/* Host-selected collectors extend the existing settlement and payout drawers. */
(() => {
  const CT = 'Coin Trader Top-up';
  const COINS = 'Coins';
  const round = amount => Math.round((Number(amount) + Number.EPSILON) * 100) / 100;
  const esc = value => String(value ?? '—').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const originalActual = window.actualSettlementMethod;
  const originalAddress = window.actualSettlementAddress;
  const originalFilter = window.settlementFilter;
  const originalIssue = window.issueCoinBill;
  const originalBatch = window.batchIssueCoins;
  const originalCanIssue = window.canIssueCoinBill;
  const originalOpenBill = window.openBill;
  const originalPublish = window.publishBill;
  const originalExport = window.exportSettlement;
  const agency = uid => agencyWeeklySettlement.find(row => String(row.uid) === String(uid));
  const agencyHosts = bill => hostWeeklySettlement.filter(host => String(host.agencyUid) === String(bill.uid));
  const hostAmount = host => round(hostFinalSalary(host));
  const isTraderHost = host => host.collectionMethod === CT && hostAmount(host) >= 5;
  const isAgency = bill => agencyWeeklySettlement.includes(bill);
  const low = amount => amount > 0 && amount < 5;
  const hasPerformance = bill => [bill.totalCoins, bill.totalDiamonds, bill.totalValidHours, bill.totalValidDays].some(value => Number(value) > 0) || agencyHosts(bill).some(host => Number(host.validDays) > 0);
  const coinMethod = method => method === CT || method === COINS;
  const time = () => formatAdminTime(new Date(), 8);

  const methodLabel = method => method === CT ? '币商代收' : method === COINS ? '金币' : method;
  function configured(bill) {
    return bill.configuredPayType || bill.payType || '—';
  }
  function part(key, label, amount, method, receiver, uid, source, available = true) {
    const rate = method === CT ? (amount >= 2000 ? 20300 : 19040) : method === COINS ? 20000 : null;
    return {key, label, amount:round(amount), method, receiver, receiverUid:String(uid || ''), source,
      rate, coins:rate ? Math.round(amount * rate) : null, available};
  }
  function buildPlan(bill) {
    const hosts = agencyHosts(bill).map(host => ({...host}));
    const splitHosts = hosts.filter(isTraderHost);
    const trader = round(splitHosts.reduce((sum, host) => sum + hostAmount(host), 0));
    const remaining = round(bill.final - trader);
    const parts = splitHosts.map(host => part('host:' + host.uid, '币商代收', hostAmount(host), CT,
      `${host.traderName || 'Coin Trader'} · ID ${host.traderId || '—'}`, host.traderId,
      `${host.name} · UID ${host.uid}`, host.collectionTraderAvailable !== false));
    if (low(remaining)) {
      const viaAgency = hosts.filter(host => !isTraderHost(host) && hostAmount(host) > 0);
      viaAgency.forEach(host => parts.push(part('personal:' + host.uid, '主播薪资', hostAmount(host), COINS,
        `${host.name} · UID ${host.uid}`, host.uid, '代理代收部分')));
      const own = round(remaining - viaAgency.reduce((sum, host) => sum + hostAmount(host), 0));
      if (own < 0) return {total:bill.final, trader, agency:remaining, parts, error:'代理本人应结金额为负，请先核对财务调整。'};
      if (own > 0) parts.push(part('agent:' + bill.uid, '代理本人薪资', own, COINS,
        `${bill.name} · UID ${bill.uid}`, bill.uid, '代理代收部分'));
    } else if (remaining > 0) {
      const proxy = {...bill, final:remaining};
      const method = originalActual(proxy);
      parts.push(part('agency:' + bill.uid, '代理实付', remaining, method,
        originalAddress(proxy), method === COINS ? bill.uid : bill.paymentDetails?.['Coin Trader ID'],
        `${bill.name} · UID ${bill.uid}`, bill.coinTraderAvailable !== false));
    }
    const sum = round(parts.reduce((total, item) => total + item.amount, 0));
    const error = remaining < 0 || sum !== round(bill.final) ? '付款金额无法核平，请先核对财务调整。' : '';
    return {total:round(bill.final), trader, agency:remaining, parts, hosts, error};
  }
  function plan(bill) {
    if (bill.bill === 'Confirmed' && !bill.collectionSnapshot) bill.collectionSnapshot = buildPlan(bill);
    return bill.collectionSnapshot || buildPlan(bill);
  }
  function paymentRows(bill) {
    const saved = bill.collectionPayments || {};
    return plan(bill).parts.map(item => ({...item, status:bill.payout === 'Paid' && !bill.collectionPayments ? 'Paid' : 'Unpaid', ...saved[item.key]}));
  }
  function signature(bill) {
    return JSON.stringify({plan:plan(bill),finance:bill.finance,bill:bill.bill,payments:bill.collectionPayments || {}});
  }
  function totals(bill) {
    const data = plan(bill);
    return `<div class="compositionTotals"><div><span>结算金额</span><b>${money(data.total)}</b></div><div><span>币商代收</span><b>${money(data.trader)}</b></div><div><span>代理实付</span><b>${money(data.agency)}</b></div></div>`;
  }
  function ready(bill) {
    return bill.finance === 'Published' && bill.bill === 'Confirmed' && !plan(bill).error;
  }
  function eligibleParts(bill, coinsOnly = false) {
    return ready(bill) ? paymentRows(bill).filter(item => item.status === 'Unpaid' && (!coinsOnly || coinMethod(item.method))) : [];
  }
  function traderValid(item) {
    if (item.method !== CT) return true;
    if (!item.available) return false;
    return !window.ctDepositEligible || window.ctDepositEligible({coinTraderAvailable:item.available,
      payAddress:item.receiver, paymentDetails:{'Coin Trader ID':item.receiverUid}});
  }
  function summaryMethod(bill) {
    const methods = [...new Set(plan(bill).parts.map(item => item.method))];
    return methods.length > 1 ? '多种方式' : methodLabel(methods[0]) || '—';
  }
  window.actualSettlementMethod = bill => isAgency(bill) ? summaryMethod(bill) : originalActual(bill);
  function paymentGroups(bill) {
    const rows = paymentRows(bill);
    return ['cash','coins'].map(kind => ({kind, rows:rows.filter(item => coinMethod(item.method) === (kind === 'coins'))})).filter(group => group.rows.length);
  }
  function groupLines(bill, content) {
    return paymentGroups(bill).map(group => `<div class="hcPaymentLine">${content(group)}</div>`).join('') || '—';
  }
  function accountCell(bill) {
    return groupLines(bill, group => {
      if (group.kind === 'cash') return group.rows.map(item => esc(item.receiver)).join('<br>');
      const count = new Set(group.rows.map(item => item.method + '|' + item.receiver)).size;
      return `<button class="payoutAccountLink" onclick="hcPayoutDetails('${esc(bill.uid)}','${group.kind}')">收款账户（${count}）</button>`;
    });
  }
  function methodCell(bill) {
    return groupLines(bill, group => [...new Set(group.rows.map(item => methodLabel(item.method)))].map(esc).join(' / '));
  }
  function payoutCell(bill) {
    if (bill.finance !== 'Published' || bill.bill !== 'Confirmed') return statusBadge(bill.payout);
    return groupLines(bill, group => {
      const paid = group.rows.filter(item => item.status === 'Paid').length;
      return `<span class="hcPayoutProgress">已付款（${paid}/${group.rows.length}）笔</span>`;
    });
  }
  window.actualSettlementAddress = bill => isAgency(bill) ? accountCell(bill) : originalAddress(bill);
  window.settlementFilter = rows => {
    if (!rows.some(isAgency)) return originalFilter(rows);
    const picker = document.getElementById('settlementPaymentMethod');
    const value = picker?.value;
    if (picker) picker.value = 'All Payment Types';
    const filtered = originalFilter(rows);
    if (picker) picker.value = value;
    return filtered.filter(bill => !isAgency(bill) || !value || value === 'All Payment Types'
      || plan(bill).parts.some(item => item.method === value));
  };
  window.canIssueCoinBill = (type, bill) => type === 'agencyWeekly'
    ? eligibleParts(bill, true).length > 0 : originalCanIssue(type, bill);

  function actionButtons(bill) {
    const uid = esc(bill.uid);
    const review = bill.finance === 'Pending Finance Review'
      ? `<button class="op" onclick="financeConfirm('agencyWeekly','${uid}')">财务确认</button>` : '';
    const publish = bill.finance === 'Ready to Publish' || bill.bill === 'Rejected'
      ? `<button class="op" onclick="publishBill('agencyWeekly','${uid}')">${bill.bill === 'Rejected' ? '重新发布' : '发布'}</button>` : '';
    const adjust = bill.finance === 'Pending Finance Review' || bill.finance === 'Ready to Publish'
      ? `<button class="op" onclick="openAdjustment('agencyWeekly','${uid}')">财务调整</button>` : '';
    const cashPart = eligibleParts(bill).find(item => !coinMethod(item.method));
    const cashPay = cashPart ? `<button class="op good" onclick="hcPayPart('${uid}','${cashPart.key}')">确认打款</button><button class="op bad" onclick="hcReturnPart('${uid}','${cashPart.key}')">退回</button>` : '';
    return `<div class="opCell">${adjust}${review}${publish}${cashPay}</div>`;
  }
  window.agencyWeeklyActions = actionButtons;
  window.agencyWeeklyTable = () => {
    refreshAgencyWeeklyTotals();
    const rows = settlementFilter(agencyWeeklySettlement).filter(bill => bill.final !== 0 || hasPerformance(bill));
    const head = ['','代理信息','国家/地区','总主播数','有效主播数','总金币','总钻石','计薪钻石余额','主播总薪资','主播总结算','代理本人总薪资','代理总薪资','代理需调整','结算金额','币商代收','代理实付','配置收款方式','实际结算方式','收款账号','财务状态','账单状态','付款状态','拒绝原因','操作'];
    const body = rows.map(bill => {
      const data = plan(bill);
      const key = 'agencyWeekly:' + bill.uid;
      const checkbox = `<input type="checkbox" data-coin-key="${key}" ${canIssueCoinBill('agencyWeekly',bill) ? '' : 'disabled'} onchange="updateCoinBatchButton()" aria-label="选择 ${esc(bill.name)}">`;
      const cells = [checkbox, identityMerged(bill.name,bill.uid), displayCountry(bill.country), bill.hosts,
        bill.effectiveHosts, fmt(bill.totalCoins), fmt(bill.totalDiamonds), fmt(agencyPayrollDiamondBalance(bill)),
        money(bill.hostSalary), money(bill.hostSettlement), money(bill.agentOwnSalary), money(bill.agentTotalSalary),
        money(bill.agentAdj || 0), money(data.total), money(data.trader), money(data.agency), esc(methodLabel(configured(bill))),
        methodCell(bill), accountCell(bill),
        statusBadge(bill.finance), statusBadge(bill.bill), payoutCell(bill), rejectReasonCell(bill.rejectReason), actionButtons(bill)];
      return '<tr>' + cells.map(cell => `<td>${cell}</td>`).join('') + '</tr>';
    }).join('');
    return `<div class="memberRelationNote">先拆出已选币商且调整后薪资 ≥ $5 的主播，再按代理实付判断 $5 门槛。</div><div class="table-responsive tableWrap"><table class="table settlementAgencyWeeklyTable"><thead><tr>${head.map((label,index) => `<th>${index ? label : '<input type="checkbox" aria-label="全选可发放账单" onchange="hcSelectAll(this.checked)">'}</th>`).join('')}</tr></thead><tbody>${body || '<tr><td colspan="24">暂无账单</td></tr>'}</tbody></table></div>`;
  };
  window.hcSelectAll = checked => {
    document.querySelectorAll('#settlementContent input[data-coin-key]:not(:disabled)').forEach(input => {input.checked = checked;});
    updateCoinBatchButton();
  };

  window.openAgencyComposition = uid => {
    const bill = agency(uid);
    if (!bill) return;
    const rows = agencyHosts(bill).map(host => {
      host = plan(bill).hosts?.find(item => String(item.uid) === String(host.uid)) || host;
      return `<tr><td>${identityMerged(host.name,host.uid)}</td><td>${money(host.hostSalary)}</td><td>${money(hostRowAdjustment(host))}</td><td>${money(hostAmount(host))}</td><td>${isTraderHost(host) ? '币商代收' : '所属代理'}</td></tr>`;
    }).join('');
    openDrawer('查看主播薪资', `<div class="detailHero"><div><h3>${esc(bill.name)}</h3><p>UID ${bill.uid}</p></div></div>${totals(bill)}<div class="detailSec"><div class="tableWrap"><table class="table"><thead><tr><th>主播</th><th>主播薪资</th><th>调整</th><th>主播应结</th><th>代收对象</th></tr></thead><tbody>${rows}</tbody></table></div></div>`);
  };
  window.openBill = (type, uid) => {
    if (type !== 'agencyWeekly') return originalOpenBill(type,uid);
    const bill = agency(uid);
    if (!bill) return;
    openDrawer('代理周结算详情', `<div class="detailHero"><div><h3>${esc(bill.name)}</h3><p>代理 UID ${uid}</p></div></div>${totals(bill)}<div class="detailSec"><div class="kv"><div><span>财务状态</span><b>${displayStatus(bill.finance)}</b></div><div><span>账单状态</span><b>${displayStatus(bill.bill)}</b></div><div><span>付款状态</span><b>${payoutCell(bill)}</b></div><div><span>配置收款方式</span><b>${esc(methodLabel(configured(bill)))}</b></div></div></div><div class="drawerActions"><button class="btn" onclick="openAgencyComposition('${uid}')">查看主播薪资</button><button class="btn" onclick="hcPayoutDetails('${uid}')">查看付款明细</button></div>`);
  };
  let activeDetailKind;
  window.hcPayoutDetails = (uid, kind) => {
    activeDetailKind = kind;
    const bill = agency(uid);
    if (!bill) return;
    const groups = paymentGroups(bill).filter(group => !kind || group.kind === kind);
    const sections = groups.map(group => {
      const coins = group.kind === 'coins';
      const headers = ['薪资归属','薪资类型','金额（$）','结算方式','收款账号',...(coins ? ['折算比例','折算金币'] : []),'状态','操作'];
      const rows = group.rows.map(item => {
        const salaryType = item.key.startsWith('host:') || item.key.startsWith('personal:') ? '主播薪资' : item.key.startsWith('agent:') ? '代理本人薪资' : '代理实付';
        const owner = item.key.startsWith('personal:') || item.key.startsWith('agent:') ? item.receiver : item.source;
        const action = ready(bill) && item.status === 'Unpaid' ? `<button class="op" onclick="hcPayPart('${uid}','${item.key}')">${coins ? '发放金币' : '确认打款'}</button><button class="op bad" onclick="hcReturnPart('${uid}','${item.key}')">退回</button>` : item.status === 'Returned' ? `<span class="muted">待更新收款信息</span>` : '—';
        const cells = [esc(owner),salaryType,money(item.amount),esc(methodLabel(item.method)),esc(item.receiver),...(coins ? ['1 USD = ' + fmt(item.rate) + ' 金币',fmt(item.coins)] : []),(item.status === 'Returned' ? '<span class="badge rejected">收款信息异常</span><div class="muted">'+esc(item.returnReason)+'</div>' : statusBadge(item.status)),action];
        return '<tr>' + cells.map(cell => `<td>${cell}</td>`).join('') + '</tr>';
      }).join('');
      const amount = group.rows.reduce((sum,item) => sum + item.amount,0);
      const count = new Set(group.rows.map(item => item.method + '|' + item.receiver)).size;
      const paid = group.rows.filter(item => item.status === 'Paid').length;
      return `<section class="hcPaymentSection"><h4>${coins ? '金币收款明细' : '现金收款明细'}</h4><div class="hcPaymentMeta"><b>${money(amount)}</b> 应付金额 <span>${count} 个收款账户</span><span>已付款（${paid}/${group.rows.length}）笔</span></div><div class="tableWrap"><table class="table hcPaymentTable"><thead><tr>${headers.map(label => `<th>${label}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div></section>`;
    }).join('');
    openDrawer(kind === 'cash' ? '现金收款明细' : kind === 'coins' ? '金币收款明细' : '收款明细', `<div class="hcPayoutDetail"><div class="detailHero"><div><h3>${esc(bill.name)}</h3><p>代理 UID ${uid}</p></div></div>${sections || '<div class="empty">暂无收款明细</div>'}</div>`);
  };
  window.openAgencyPayoutDetails = uid => hcPayoutDetails(uid);

  const returnStorageKey = 'salary-collection-returns-v1';
  const paidStorageKey = 'salary-collection-paid-v1';
  function readReturns() {
    try { return JSON.parse(localStorage.getItem(returnStorageKey) || '{}'); }
    catch { return {}; }
  }
  function returnPart(bill,item,reason) {
    const current = paymentRows(bill).find(row => row.key === item.key);
    if (!ready(bill) || current?.status !== 'Unpaid') return;
    bill.collectionPayments ||= {};
    bill.collectionPayments[item.key] = {...current,status:'Returned',returnReason:reason,returnedAt:time()};
    const hostUid = item.key.startsWith('host:') || item.key.startsWith('personal:') ? item.key.split(':')[1] : String(bill.uid);
    const returns = readReturns();
    returns[bill.uid + ':' + item.key] = {billUid:String(bill.uid),key:item.key,hostUid,
      hostName:item.source,amount:item.amount,period:bill.period || '2026-W34',
      method:item.method,receiver:item.receiver,status:'Returned',reason,
      version:Date.now(),returnedAt:time(),message:coinMethod(item.method) ? '收款信息异常，请更新币商账号或使用本人金币账户。' : '现金收款信息异常，请更新收款账号。'};
    localStorage.setItem(returnStorageKey,JSON.stringify(returns));
  }
  window.hcReturnPart = (uid,key) => {
    const bill = agency(uid);
    const item = bill && paymentRows(bill).find(row => row.key === key);
    if (!item || !ready(bill) || item.status !== 'Unpaid') return toast('仅可退回未付款记录');
    const stamp = signature(bill);
    openModal('退回付款记录', `<div class="note">${esc(item.source)} · ${money(item.amount)}<br>仅暂停这笔付款，通知收款人更新账号。</div><div class="field"><label>退回原因</label><textarea id="hcReturnReason" placeholder="请填写原因，将通知收款人"></textarea></div>`, '确认退回', () => {
      const reason = document.getElementById('hcReturnReason').value.trim();
      if (!reason) return toast('请填写退回原因');
      if (stamp !== signature(bill)) return toast('付款记录已变化，请重新打开');
      returnPart(bill,item,reason);closeModal();renderSettlement();toast('该笔付款已退回，收款人通知已生成');
    });
  };
  function syncReturnedPayments() {
    let paidRecords = {};
    try {paidRecords=JSON.parse(localStorage.getItem(paidStorageKey) || '{}');} catch {}
    Object.values(paidRecords).forEach(record => {
      const bill=agency(record.billUid);
      if (!bill || bill.bill !== 'Confirmed') return;
      bill.collectionPayments ||= {};
      bill.collectionPayments[record.payment.key]={...record.payment,status:'Paid'};
    });
    const returns = readReturns();
    Object.values(returns).forEach(record => {
      const bill = agency(record.billUid);
      if (!bill || bill.bill !== 'Confirmed' || bill.finance !== 'Published') return;
      const base = plan(bill).parts.find(item => item.key === record.key);
      if (!base || round(record.amount) !== base.amount) return;
      bill.collectionPayments ||= {};
      const current = bill.collectionPayments[record.key];
      if (current?.status === 'Paid') return;
      if (record.status === 'Paid' && record.paymentSnapshot) {
        bill.collectionPayments[record.key]={...base,...record.paymentSnapshot,status:'Paid'};
      } else if (record.status === 'Returned') {
        bill.collectionPayments[record.key] = {...base,status:'Returned',returnReason:record.reason};
      } else if (record.status === 'Submitted' && (record.method === CT || record.method === COINS)) {
        const receiverUid = record.method === COINS ? record.hostUid : record.receiverUid;
        const updated = part(base.key,base.label,base.amount,record.method,record.receiver,receiverUid,base.source,true);
        if (!traderValid(updated)) return;
        bill.collectionPayments[record.key] = {...updated,status:'Unpaid',returnHistory:record.history,updatedAt:time()};
      }
    });
  }
  window.addEventListener('storage',event => {if (event.key === returnStorageKey || event.key === paidStorageKey) renderSettlement();});
  function issueRows(bills, coinsOnly, selectedKey) {
    const selections = bills.map(bill => ({bill, stamp:signature(bill), rows:eligibleParts(bill,coinsOnly)
      .filter(item => !selectedKey || item.key === selectedKey)})).filter(entry => entry.rows.length);
    if (!selections.length) return toast('暂无可处理的付款部分');
    const invalid = selections.flatMap(entry => entry.rows.filter(item => !traderValid(item)).map(item => ({bill:entry.bill,item})));
    if (invalid.length) {
      return openModal('币商账户不可接收', '<div class="note">仅打回以下未付款记录，其他款项可继续付款。</div>' + invalid.map(({item}) => `<p>${esc(item.source)} · ${money(item.amount)} · ${esc(item.receiver)}</p>`).join(''), '打回异常记录', () => {
        if (selections.some(entry => entry.stamp !== signature(entry.bill))) return toast('付款记录已变化，请重新打开');
        invalid.forEach(({bill,item}) => returnPart(bill,item,'币商账户不可接收'));
        closeModal();renderSettlement();toast('异常付款记录已打回，并生成收款人通知');
      });
    }
    const rows = selections.flatMap(entry => entry.rows.map(item => `<tr><td>${esc(entry.bill.name)}</td><td>${esc(item.label)}</td><td>${money(item.amount)}</td><td>${methodLabel(item.method)}</td><td>${esc(item.receiver)}</td><td>${item.coins === null ? '—' : fmt(item.coins)}</td></tr>`)).join('');
    openModal(coinsOnly ? '发放金币' : '登记付款', `<div class="tableWrap"><table class="table"><thead><tr><th>账单</th><th>付款部分</th><th>金额（USD）</th><th>方式</th><th>账号</th><th>金币</th></tr></thead><tbody>${rows}</tbody></table></div>`, '确认', () => {
      if (selections.some(entry => entry.stamp !== signature(entry.bill) || !ready(entry.bill)
        || entry.rows.some(item => !traderValid(item)))) return toast('账单或收款信息已变化，请重新打开确认');
      selections.forEach(({bill,rows}) => {
        bill.collectionPayments ||= {};
        rows.forEach(item => {
          bill.collectionPayments[item.key] = {...item,status:'Paid',paidAt:time(),txn:'DEMO-'+Date.now()+'-'+item.key,operator:'Current Admin'};
          let paidRecords={};
          try {paidRecords=JSON.parse(localStorage.getItem(paidStorageKey) || '{}');} catch {}
          paidRecords[bill.uid + ':' + item.key]={billUid:String(bill.uid),payment:bill.collectionPayments[item.key]};
          localStorage.setItem(paidStorageKey,JSON.stringify(paidRecords));
          const returns = readReturns(), record = returns[bill.uid + ':' + item.key];
          if (record) {record.status='Paid';record.paymentSnapshot=bill.collectionPayments[item.key];localStorage.setItem(returnStorageKey,JSON.stringify(returns));}
        });
        bill.payout = paymentRows(bill).every(item => item.status === 'Paid') ? 'Paid' : 'Unpaid';
      });
      closeModal();renderSettlement();updatePendingCounters();
      if (selections.length === 1 && document.getElementById('drawerBack').classList.contains('show')) hcPayoutDetails(selections[0].bill.uid,activeDetailKind);
      toast('付款结果已更新');
    });
  }
  window.hcPayPart = (uid,key) => {
    const bill = agency(uid);
    if (!bill) return;
    const item = paymentRows(bill).find(row => row.key === key);
    if (item) issueRows([bill],coinMethod(item.method),key);
  };
  window.issueCoinBill = (type,uid) => type === 'agencyWeekly' ? issueRows([agency(uid)].filter(Boolean),true) : originalIssue(type,uid);
  window.batchIssueCoins = () => {
    if (state.settlementTab !== 'agencyWeekly') return originalBatch();
    const bills = [...document.querySelectorAll('#settlementContent input[data-coin-key]:checked')]
      .map(input => agency(input.dataset.coinKey.split(':')[1])).filter(Boolean);
    issueRows(bills,true);
  };
  window.publishBill = (type,uid) => {
    if (type !== 'agencyWeekly') return originalPublish(type,uid);
    const bill = agency(uid);
    const data = plan(bill);
    if (data.error) return toast(data.error);
    if (bill.final === 0 && !hasPerformance(bill)) return toast('无业绩账单不发布');
    originalPublish(type,uid);
    const button = document.getElementById('modalConfirm');
    if (!button || !document.getElementById('modalBack').classList.contains('show')) return;
    document.getElementById('modalBody').insertAdjacentHTML('beforeend',totals(bill));
    const submit = button.onclick, stamp = signature(bill);
    button.onclick = () => {
      if (stamp !== signature(bill)) return toast('账单已变化，请重新核对后发布');
      submit();
      if (bill.finance === 'Published') {
        delete bill.collectionSnapshot;
        bill.collectionRevision = (bill.collectionRevision || 0) + 1;
      }
    };
  };
  window.exportSettlement = () => {
    if (state.settlementTab !== 'agencyWeekly') return originalExport();
    const rows = settlementFilter(agencyWeeklySettlement);
    const csv = [['代理UID','结算金额','币商代收','代理实付','实际方式','付款状态'],
      ...rows.map(bill => [bill.uid,plan(bill).total,plan(bill).trader,plan(bill).agency,summaryMethod(bill),bill.payout])]
      .map(row => row.map(cell => '"'+String(cell).replace(/"/g,'""')+'"').join(',')).join('\n');
    const url = URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}));
    const link = document.createElement('a');link.href=url;link.download='agency-settlement.csv';link.click();URL.revokeObjectURL(url);
  };

  // Example bills cover the collection routes through the existing bill list.
  const sourceBill = agency('310001') || agencyWeeklySettlement[0];
  const sourceHosts = agencyHosts(sourceBill).map(host => ({...host}));
  const sourceValue = {...sourceBill};
  const examples = [
    {uid:sourceBill.uid, name:sourceBill.name, kind:'mixed'},
    {uid:'319001', name:'Crescent Agency', kind:'smallHost'},
    {uid:'319002', name:'Horizon Agency', kind:'smallAgency'},
    {uid:'319003', name:'Ocean Agency', kind:'cash'},
    {uid:'319004', name:'Maple Agency', kind:'partial'},
    {uid:'319005', name:'Sunny Agency', kind:'pending'},
    {uid:'319006', name:'Willow Agency', kind:'rejected'},
    {uid:'319007', name:'River Agency', kind:'invalid'}
  ];
  examples.forEach((example,index) => {
    const bill = index === 0 ? sourceBill : {...sourceValue,uid:example.uid,name:example.name};
    if (index > 0) {
      agencyWeeklySettlement.push(bill);
      sourceHosts.forEach((host,hostIndex) => hostWeeklySettlement.push({...host,
        uid:String(94000000 + index * 100 + hostIndex),agencyUid:bill.uid}));
    }
    const hosts = agencyHosts(bill);
    delete bill.collectionSnapshot;
    bill.collectionPayments = {};
    bill.finance='Published';bill.bill='Confirmed';bill.payout='Unpaid';bill.agentAdj=0;
    hosts.forEach(host => {host.collectionMethod='Agency';});
    const first = hosts[0];
    if (example.kind === 'invalid') first.uid='88888888';
    first.collectionMethod=CT;first.traderId='1164083';first.traderName='LOVEDIA';
    first.collectionTraderAvailable=example.kind !== 'invalid';
    if (example.kind === 'smallHost' || example.kind === 'smallAgency') {
      const amounts = example.kind === 'smallHost' ? [3,90] : [97,2];
      hosts.forEach((host,hostIndex) => {
        host.hostSalary=amounts[hostIndex] || 0;host.adj=0;host.deduction=0;
        host.agentSalary=hostIndex === 0 ? (example.kind === 'smallHost' ? 7 : 1) : 0;
      });
    }
    if (example.kind === 'cash' || example.kind === 'smallHost') {
      bill.configuredPayType=bill.payType='USDT';
      bill.payAddress='TQ8Lw9p2xD7k3mN6cR4vB1zA5sF9hJ2uXq';
    }
    if (example.kind === 'partial') {
      bill.collectionPayments['host:' + first.uid]={status:'Paid',paidAt:time(),txn:'DEMO-PAID-HOST'};
    }
    if (example.kind === 'pending') bill.bill='Pending Confirmation';
    if (example.kind === 'rejected') {
      bill.bill='Rejected';bill.finance='Ready to Publish';bill.rejectReason='请核对本期财务调整';
    }
  });
  refreshAgencyWeeklyTotals();
  examples.forEach(example => {
    const bill = agency(example.uid);
    if (bill.bill === 'Confirmed') bill.collectionSnapshot=buildPlan(bill);
  });

  const linkedUids = Object.keys(salaryDemo.read());
  function syncLinkedBills() {
    const linked = salaryDemo.read();
    linkedUids.forEach(uid => {
      const source=linked[uid];
      if(!source)return;
      let bill=agency(uid);
      if(!bill){bill={...sourceValue,uid,name:source.name};agencyWeeklySettlement.unshift(bill);}
      if(bill.linkedRevision===source.revision)return;
      bill.name=source.name;bill.period=source.period;bill.finance=source.finance;bill.bill=source.review;
      bill.agentAdj=source.agentAdj;bill.payType=bill.configuredPayType=source.method;
      bill.payAddress=source.payee;bill.rejectReason=source.rejectReason || '';
      bill.paymentDetails={'Coin Trader ID':source.payee.match(/ID\s+(\d+)/)?.[1] || ''};
      bill.collectionPayments=structuredClone(source.payments);
      bill.payout='Unpaid';
      for(let index=hostWeeklySettlement.length-1;index>=0;index--){if(String(hostWeeklySettlement[index].agencyUid)===uid)hostWeeklySettlement.splice(index,1);}
      source.hosts.forEach((host,index)=>hostWeeklySettlement.push({...sourceHosts[0],uid:host.uid,name:host.name,agencyUid:uid,
        hostSalary:host.salary,adj:host.adjustment,diamondSalary:host.diamond,targetSalary:host.target,
        agentSalary:index===0?source.agentSalary:0,totalCoins:host.coins,totalDiamonds:host.diamonds,diamonds:host.diamonds,validDays:host.days,validHours:host.hours,
        collectionMethod:host.collection,traderId:host.traderId,traderName:host.traderName,
        collectionTraderAvailable:salaryDemo.traders[host.traderId]?.available !== false}));
      delete bill.collectionSnapshot;
      bill.linkedRevision=source.revision;
    });
    refreshAgencyWeeklyTotals();
  }
  function saveLinkedBills() {
    linkedUids.forEach(uid=>{
      const source=salaryDemo.read()[uid],bill=agency(uid);
      if(!source||!bill)return;
      const next={...source,finance:bill.finance,review:bill.bill,agentAdj:bill.agentAdj,
        rejectReason:bill.rejectReason || '',method:configured(bill),payee:bill.payAddress,
        payments:structuredClone(bill.collectionPayments || {}),
        hosts:source.hosts.map(host=>{
          const current=agencyHosts(bill).find(item=>String(item.uid)===host.uid);
          return current ? {...host,salary:current.hostSalary,adjustment:hostRowAdjustment(current)} : host;
        })};
      salaryDemo.write(next);
      bill.linkedRevision=salaryDemo.read()[uid].revision;
    });
  }
  syncLinkedBills();
  window.addEventListener('salary-demo-change',()=>{if(!linkedRendering)renderSettlement();});
  let linkedRendering=false;
  window.hostCollectionAdmin = {plan,paymentRows,ready};
  const renderSettlementBase = window.renderSettlement;
  window.renderSettlement = function () {
    linkedRendering=true;
    syncLinkedBills();
    syncReturnedPayments();
    saveLinkedBills();
    linkedRendering=false;
    agencyWeeklySettlement.filter(bill => bill.bill === 'Confirmed').forEach(bill => {
      const rows=paymentRows(bill);
      if (rows.length && rows.every(item => item.status === 'Paid')) bill.payout='Paid';
    });
    const result = renderSettlementBase.apply(this,arguments);
    if (state.settlementTab !== 'agencyWeekly' || state.settlementQueueStatus) return result;
    const table = document.querySelector('#settlementContent .settlementAgencyWeeklyTable');
    if (!table) return result;
    document.querySelectorAll('#settlementContent .memberRelationNote').forEach(note => {
      note.textContent='先拆出已选币商且调整后薪资 ≥ $5 的主播，再按代理实付判断 $5 门槛。';
    });
    table.querySelectorAll('tbody tr').forEach(row => {
      const bill = agencyWeeklySettlement.find(item => row.cells[1]?.textContent.includes(String(item.uid)));
      if (!bill || row.cells.length !== 24) return;
      row.cells[17].innerHTML=methodCell(bill);
      row.cells[21].innerHTML=payoutCell(bill);
      row.cells[18].innerHTML=accountCell(bill);
      row.cells[23].innerHTML=actionButtons(bill);
      const checkbox=row.querySelector('input[data-coin-key]');
      if (checkbox) checkbox.disabled=!canIssueCoinBill('agencyWeekly',bill);
    });
    updateCoinBatchButton();
    return result;
  };
  renderSettlement();
})();
