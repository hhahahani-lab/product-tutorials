/* Demo bills retain collection routes and payment snapshots independently. */
window.collectionUI = (() => {
  const money = amount => '$' + Number(amount).toFixed(2);
  const round = amount => Math.round(amount * 100) / 100;
  const finalHostSalary = host => round(host.hostSalary + (host.adjustment || 0));
  const hosts = bill => bill.hostEntries || bill.hosts || [];
  const usesTrader = host => host.collection === 'trader' && finalHostSalary(host) >= 5;
  const traderHosts = bill => hosts(bill).filter(usesTrader);
  const traderAmount = bill => round(traderHosts(bill).reduce((total, host) => total + finalHostSalary(host), 0));
  const agencyAmount = bill => round(bill.shouldPay - traderAmount(bill));
  const isLowAmount = amount => amount > 0 && amount < 5;
  const payoutAmount = bill => Array.isArray(bill.hostEntries) || Array.isArray(bill.hosts)
    ? agencyAmount(bill) : bill.shouldPay ?? bill.total;
  function lowAgencyPayment(bill) {
    const recipients = hosts(bill).filter(host => !usesTrader(host) && finalHostSalary(host) > 0)
      .map(host => ({uid:String(host.id), amount:finalHostSalary(host)}));
    const hostTotal = round(recipients.reduce((sum, recipient) => sum + recipient.amount, 0));
    const agentAmount = round(agencyAmount(bill) - hostTotal);
    if (agentAmount > 0) {
      const ownerUid=bill.ownerUid || '10032846', own=recipients.find(item=>item.uid===ownerUid);
      if(own)own.amount=round(own.amount+agentAmount);
      else recipients.push({uid:ownerUid,amount:agentAmount});
    }
    return {method:'Coins', payee:'—', recipients,
      version:JSON.stringify(recipients)};
  }
  function prepare(bills) {
    const first = bills[0];
    const host = first && hosts(first)[0];
    if (first) {
      first.method = 'Coin Trader Top-up';
      first.payee = 'user10833021 · ID 10833021';
    }
    if (host) {
      host.collection = 'trader';
      host.traderId = '9198';
      host.traderName = 'user9198';
      host.collectionStatus = 'Agency Confirmed';
    }
  }
  function breakdown(bill) {
    const hostTotal = round(hosts(bill).reduce((total, host) => total + finalHostSalary(host), 0));
    return `<div class="collectionBreakdown">
      <div class="collectionTotal"><span>Settlement Amount</span><b>${money(bill.shouldPay)}</b></div>
      <div class="collectionSplitGrid">
        <div><b>${money(round(hostTotal - traderAmount(bill)))}</b><span>Host Salary via Agency</span></div>
        <div><b>${money(traderAmount(bill))}</b><span>Host-selected Coin Trader</span></div>
      </div>
    </div>`;
  }
  function hostStatus(host, bill) {
    if (bill.published === false || bill.status === 3) return '';
    const personalCoins = !usesTrader(host) && isLowAmount(agencyAmount(bill));
    const ownStatus = host.payoutStatus || host.collectionStatus;
    const agencyStatus = bill.agencyPayoutStatus || bill.payoutStatus;
    const payout = usesTrader(host) || personalCoins || String(host.id)===String(bill.ownerUid)
      ? ownStatus || (bill.status === 4 ? 'Paid' : 'Agency Confirmed')
      : agencyStatus === 'Paid' || bill.status === 4 ? 'Paid' : 'Agency Confirmed';
    const status = bill.status === 1 ? 'Under review' : payout;
    return `<span class="salaryStatus collectionPayoutStatus">${status}</span>`;
  }
  function billVersion(bill) {
    return JSON.stringify({
      revision: bill.linkedUid ? salaryDemo.read()[bill.linkedUid]?.revision : bill.revision,
      total: bill.total,
      shouldPay: bill.shouldPay,
      agentAdjustment: bill.agentAdjustment,
      hostAdjustment: bill.hostAdjustment,
      hosts: hosts(bill)
    });
  }
  function hostRoute(host, bill) {
    const amount = finalHostSalary(host);
    const trader = usesTrader(host);
    const personalCoins = !trader && isLowAmount(agencyAmount(bill));
    if(host.paymentOverride && bill.status !== 1){
      const route=host.paymentOverride;
      return `<div class="agencyBillPaymentMeta collectionPaymentMeta"><div><b>${escape(route.method)}</b><span>Payment</span></div><div><b>${['Coin Trader Top-up','Coins'].includes(route.method)?'Coins':'USD'}</b><span>Currency</span></div><div class="wideMeta"><b>${escape(route.receiver)}</b><span>Receiving account</span></div></div>`;
    }
    const method = amount === 0 ? '—' : personalCoins ? 'Coins' : trader ? 'Coin Trader Top-up' : 'Paid via Agency';
    const receiver = amount === 0 ? '—' : personalCoins ? `ID ${host.id}`
      : trader ? `${host.traderName} · ID ${host.traderId}` : `Agency · ID ${bill.ownerUid || '10032846'}`;
    return `<div class="agencyBillPaymentMeta collectionPaymentMeta">
      <div><b>${method}</b><span>Payment</span></div>
      <div><b>${amount === 0 ? '—' : personalCoins || trader ? 'Coins' : 'USD'}</b><span>Currency</span></div>
      <div class="wideMeta"><b>${receiver}</b><span>${personalCoins ? 'User ID' : trader ? 'Coin Trader ID' : 'Agency ID'}</span></div>
    </div>`;
  }


  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function payment(bill) {
    const amount = payoutAmount(bill);
    if (amount === 0) return {method:'—',payee:'—'};
    const pending = (bill.status ?? bill.settlement) === 1;
    if (!pending) return {method:bill.method || '—',payee:bill.payee || '—'};
    if (isLowAmount(amount)) {
      if (Array.isArray(bill.hostEntries) || Array.isArray(bill.hosts)) return lowAgencyPayment(bill);
      return {method:'Coins',payee:bill.ownerUid || '10032846',version:'coins'};
    }
    return window.payoutUI?.selectedAccount() || {method:'—',payee:'—'};
  }
  function rejectionNote(bill) {
    return bill.rejectionReason ? `<p class="billRejectionReason"><b>Rejection reason</b><span>${escape(bill.rejectionReason)}</span></p>` : '';
  }
  function openDecision(bill, status, notify, onSubmit) {
    const statusKey = 'settlement' in bill ? 'settlement' : 'status';
    if (bill[statusKey] !== 1 || bill.published === false) return;
    const version = billVersion(bill);
    const total = bill.shouldPay ?? bill.total;
    const agencyBill = Array.isArray(bill.hostEntries) || Array.isArray(bill.hosts);
    const payout = agencyBill ? agencyAmount(bill) : total;
    const coins = isLowAmount(payout);
    const selection = coins ? payment(bill) : window.payoutUI.selectedAccount();
    const missingPayment = () => notify('Please fill in the payment method and click [Star Mark] before confirming the bill.');
    if (status === 2 && payout > 0 && !selection) { missingPayment(); return; }
    const reject = status === 3;
    document.getElementById('salaryDecisionOverlay')?.remove();
    const overlay = document.createElement('div');
    overlay.id = 'salaryDecisionOverlay';
    overlay.className = 'salaryDecisionOverlay';
    overlay.innerHTML = `<section class="salaryDecisionCard" role="dialog" aria-modal="true" aria-labelledby="salaryDecisionTitle">
      <h2 id="salaryDecisionTitle">${reject ? 'Reject' : 'Confirm'} Salary Bill</h2>
      <div class="salaryDecisionRows">
        <div><span>Settlement Amount</span><b>${money(total)}</b></div>
        ${agencyBill && traderAmount(bill) > 0 ? `<div><span>Host-selected Coin Trader</span><b class="salaryDecisionSecondaryAmount">${money(traderAmount(bill))}</b></div><div><span>Agency Payout</span><b>${money(payout)}</b></div>` : ''}
        <div><span>Payment</span><strong>${escape(payout === 0 ? '—' : selection?.method || '—')}</strong></div>
      </div>
      ${reject ? '<label class="salaryRejectField"><textarea aria-label="Rejection reason" placeholder="Please enter a rejection reason (required)" rows="3"></textarea><span role="alert"></span></label>' : '<p class="salaryDecisionHint">After confirmation, this bill will wait for payout.</p>'}
      <div class="salaryDecisionActions"><button type="button" data-cancel>Cancel</button><button type="button" data-submit class="${reject ? 'reject' : 'confirm'}">${reject ? 'Reject' : 'Confirm'}</button></div>
    </section>`;
    const trigger = document.activeElement;
    const close = () => { overlay.remove(); trigger?.isConnected && trigger.focus(); };
    overlay.querySelector('[data-cancel]').onclick = close;
    overlay.onclick = event => { if (event.target === overlay) close(); };
    overlay.onkeydown = event => {
      if (event.key === 'Escape') { event.preventDefault(); close(); }
      if (event.key === 'Tab') {
        const controls = [...overlay.querySelectorAll('button,textarea')];
        const first = controls[0], last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    overlay.querySelector('[data-submit]').onclick = () => {
      if (bill[statusKey] !== 1 || bill.published === false) { close(); return; }
      if (billVersion(bill) !== version) {
        close();
        window.dispatchEvent(new Event('salary-bill-changed'));
        notify('Bill information changed. Please review the updated amounts and confirm again.');
        return;
      }
      const reason = overlay.querySelector('textarea')?.value.trim() || '';
      if (reject && !reason) {
        overlay.querySelector('[role="alert"]').textContent = 'Please enter a rejection reason.';
        overlay.querySelector('textarea').focus();
        return;
      }
      if (!reject && !coins && payout > 0 && JSON.stringify(window.payoutUI.selectedAccount()) !== JSON.stringify(selection)) {
        close(); notify('Payment information changed. Please confirm the bill again.'); return;
      }
      if (reject) {
        bill.published = false;
        bill.rejectionReason = reason;
        bill.method = selection?.method || '—';
        bill.payee = selection?.payee || '—';
      }
      else if (payout === 0) {
        bill.method = '—';
        bill.payee = '—';
      }
      else if (selection && payout > 0) {
        bill.method = selection.method;
        bill.payee = selection.payee;
        bill.confirmedPayment = {...selection};
      }
      if (!reject) {
        bill.confirmedHosts = hosts(bill).map(host => ({...host}));
      }
      close();
      onSubmit();
      if(bill.linkedUid)salaryDemo.decision(bill,status);
    };
    document.body.appendChild(overlay);
    overlay.querySelector('[data-cancel]').focus();
  }
  return {prepare, breakdown, hostRoute, hostStatus, agencyAmount, openDecision, rejectionNote, payment};
})();
