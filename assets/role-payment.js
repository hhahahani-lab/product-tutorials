/* Shared prototype UI. Account data and eligibility fixtures are local demo state only. */
(() => {
  const host = document.body.dataset.paymentRole === 'host';
  const methods = host ? ['Agency', 'Coin Trader Top-up'] : ['USDT', 'Bank card or e-wallet', 'Coins', 'EPAY', 'Coin Trader Top-up'];
  const accounts = new Map();
  const management = !!document.getElementById('root');
  const uid = () => host ? '88888888' : management ? String(demoConfig().id) : '10032846';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const profiles = () => {
    if (!accounts.has(uid())) accounts.set(uid(), {
      Agency:{configured:true,preferred:host,name:'Aurora Media',agencyId:'66666666'},
      USDT:{configured:true,preferred:!host,address:'TQ8Lw9p2xD7k3mN6cR4vB1zA5sF9hJ2uXq',network:'TRC20'},
      'Bank card or e-wallet':{configured:false,preferred:false,country:'India',currency:'INR',type:'',code:'',account:'',name:'',phone:'',home:'',email:'',swift:''},
      EPAY:{configured:false,preferred:false,email:''},
      'Coin Trader Top-up':{configured:false,preferred:false,traderId:''}
    });
    return accounts.get(uid());
  };
  const guidance = 'The platform recommends USDT as the preferred payment method. If you choose bank transfer, all incurred handling fees shall be borne by the recipient. If both payment methods are submitted, payout will be prioritized via USDT.';
  let editing = null, draft = null, verifiedId = '', returnFocus = null;
  const notice = () => {
    const message = 'Positive final payouts below $5 are paid in Coins at 1 USD = 20,000 Coins.';
    return `<div class="salaryNotice" tabindex="0" aria-label="${message}"><span class="salaryNoticeIcon" aria-hidden="true">!</span><div class="salaryNoticeWindow" aria-hidden="true"><div class="salaryNoticeTrack"><span>${message}</span><span>${message}</span></div></div></div>`;
  };
  const sheet = document.getElementById('paymentMethodSheet');
  sheet.innerHTML = '<section class="onlinePaymentPanel" role="dialog" aria-modal="true" aria-labelledby="onlinePaymentTitle"><header class="onlinePaymentHeader"><h2 id="onlinePaymentTitle">Payment methods</h2><p>' + (host ? 'Choose how to receive your salary' : 'Star one to prioritize it for payout') + '</p></header><div id="paymentMethodList" class="onlineMethodList"></div></section>';
  sheet.onclick = e => { if (e.target === sheet) hidePaymentMethodSheet(); };
  const editor = document.getElementById('paymentInfoOverlay');
  editor.innerHTML = '<section class="onlinePaymentPage" role="dialog" aria-modal="true" aria-labelledby="onlineEditorTitle"><header class="onlinePaymentNav"><button type="button" class="onlinePaymentBack" aria-label="Back to payment methods" onclick="hidePaymentInfo()">‹</button><h2 id="onlineEditorTitle"></h2></header><form id="onlinePaymentForm" class="onlinePaymentBody" novalidate></form><footer class="onlinePaymentActions"><button type="button" onclick="hidePaymentInfo()">Cancel</button><button type="submit" form="onlinePaymentForm" class="onlineSave">Save</button></footer></section>';
  editor.onclick = null;
  const icon = method => method === 'Agency' ? '<span class="onlineMethodIcon agency"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2M16 5a3 3 0 0 1 0 6M18 14a5 5 0 0 1 3 4v2"/></svg></span>' : method === 'USDT' ? '<span class="onlineMethodIcon">₮</span>' : method === 'Coins' ? '<span class="onlineMethodIcon coins">★</span>' : method === 'EPAY' ? '<span class="onlineMethodIcon epay">EPay</span>' : method === 'Coin Trader Top-up' ? '<span class="onlineMethodIcon trader">💰</span>' : '<span class="onlineMethodIcon bank">▤</span>';
  const summary = (method,p) => method === 'Agency' ? `${p.name} · ID ${p.agencyId}` : !p.configured ? 'Not set · Tap to complete' : method === 'USDT' ? `TRC20 · ${p.address.slice(0,5)}••••${p.address.slice(-4)}` : method === 'EPAY' ? p.email : method === 'Coin Trader Top-up' ? `ID ${p.traderId}` : `${p.code} · ••••${p.account.slice(-4)}`;
  preferredPaymentMethod = () => methods.find(m => profiles()[m]?.configured && profiles()[m].preferred) || null;
  renderPaymentMethodList = () => {
    document.getElementById('paymentMethodList').innerHTML = methods.map((method, index) => {
      if (method === 'Coins') {
        return `<div class="onlineMethod">${icon(method)}<div class="onlineMethodStatic"><b>Coins</b><small>ID ${esc(uid())}</small></div></div>`;
      }
      const profile = profiles()[method];
      const isAgency = host && method === 'Agency';
      const selectedLabel = host ? 'Selected' : 'Preferred';
      const actionLabel = host
        ? `Select ${method}`
        : `${profile.preferred ? 'Remove preferred' : 'Set preferred'} ${method}`;
      const mainAction = isAgency ? `payoutUI.star(${index})` : `payoutUI.edit(${index})`;
      return `<div class="onlineMethod">
        ${icon(method)}
        <button type="button" class="onlineMethodMain" onclick="${mainAction}">
          <span class="onlineMethodName">${method}${profile.preferred ? `<span class="onlinePreferred">${selectedLabel}</span>` : ''}</span>
          <small class="${profile.configured ? '' : 'unset'}">${esc(summary(method, profile))}</small>
        </button>
        <button type="button" class="onlineStar ${profile.preferred ? 'on' : ''}"
          aria-label="${actionLabel}" aria-pressed="${!!profile.preferred}"
          ${profile.configured ? '' : 'disabled'} onclick="payoutUI.star(${index})">${profile.preferred ? '★' : '☆'}</button>
        ${isAgency ? '' : '<span class="onlineChevron" aria-hidden="true">›</span>'}
      </div>`;
    }).join('');
  };
  const refreshSummary = () => {
    if (host) {
      const method = preferredPaymentMethod();
      document.getElementById('salaryPaymentMethodLabel').textContent = method === 'Agency' ? 'Agency' : 'Coin Trader Top-up';
      document.getElementById('salaryPaymentMethodHint').textContent = method === 'Agency' ? `${profiles().Agency.name} · ID ${profiles().Agency.agencyId}` : `Coin Trader ID ${profiles()['Coin Trader Top-up'].traderId}`;
      document.getElementById('salaryPaymentLogo').innerHTML = icon(method);
      window.renderHostSalaryRecords?.();
      return;
    }
    if (management) { render(); return; }
    const method = preferredPaymentMethod();
    document.getElementById('salaryPaymentMethodLabel').textContent = method || 'No preferred method';
    document.getElementById('salaryPaymentMethodHint').textContent = method ? 'Preferred payout method · Tap to manage' : 'Tap to star a configured method';
    document.getElementById('salaryPaymentLogo').innerHTML = method === 'USDT' ? '₮' : '$';
    renderSalaryRecords();
  };
  if (!management) renderPaymentSummary = refreshSummary;
  openPaymentMethodSheet = () => {returnFocus = document.activeElement;renderPaymentMethodList();sheet.classList.add('show');setBaseInert(true);sheet.querySelector('button')?.focus();};
  hidePaymentMethodSheet = () => {sheet.classList.remove('show');if(!editor.classList.contains('show')){setBaseInert(false);(returnFocus?.isConnected ? returnFocus : document.querySelector(host ? '.hostPaymentSummary' : management?'.paymentMainRow':'#salary .paymentMainRow'))?.focus();}};
  function setBaseInert(on) { const bases = host ? [document.querySelector('.phone'), document.getElementById('hostHistory')] : management ? [document.getElementById('root')] : document.querySelectorAll('.app > .top, .app > section.page'); bases.forEach(base => {if(base)base.inert=on;}); }
  const field = (key,label,placeholder='',readonly=false,type='text') => `<label class="onlineField"><span>${label}:</span><input aria-label="${label}:" aria-describedby="payout-error-${key}" name="${key}" value="${esc(draft[key]||'')}" placeholder="${esc(placeholder)}" ${readonly?'readonly':''} type="${type}"><small id="payout-error-${key}" class="onlineFieldError" data-error="${key}" aria-live="polite"></small></label>`;
  const select = (key,label,options,placeholder,disabled=false) => `<label class="onlineField"><span>${label}:</span><select aria-label="${label}:" aria-describedby="payout-error-${key}" name="${key}" ${disabled?'disabled':''}><option value="">${placeholder}</option>${options.map(v=>`<option value="${esc(v)}" ${draft[key]===v?'selected':''}>${esc(v)}</option>`).join('')}</select><small id="payout-error-${key}" class="onlineFieldError" data-error="${key}" aria-live="polite"></small></label>`;
  const countryCurrency = {India:'INR',Pakistan:'PKR',Singapore:'SGD'};
  // Sample routing options only; these are not a production bank directory.
  const bankCodes = () => draft.type === 'Bank card' ? ['Example Bank'] : draft.type === 'e-wallet' ? ['Example Wallet'] : [];
  function drawFields() {
    const form = document.getElementById('onlinePaymentForm');
    let html = '';
    if(editing === 'Coin Trader Top-up') {
      html = '<div class="onlineTraderEntry">' + field('traderId','Coin Trader ID','Enter Coin Trader ID') + '<button type="button" id="onlineTraderConfirm" class="onlineTraderConfirm">Confirm</button></div>' + '<div id="onlineTraderResult" aria-live="polite"></div><section class="onlineTraderNote"><b>Note</b><ul><li>Salary paid via Coin Trader Top-up will be converted into Coins and credited to the selected Coin Trader Inventory.</li><li>Only eligible Coin Traders can be used for salary payout.</li><li>Coin Trader eligibility will be verified again before payout.</li></ul></section>';
    } else {
      html = field('method','Payment method','',true);
      if(editing === 'USDT') html += field('network','Network','',true) + field('address','Address','Enter USDT address');
      if(editing === 'EPAY') html += field('email','Email','Enter EPay email','', 'email');
      if(editing === 'Bank card or e-wallet') html += select('country','Select Country/Region',Object.keys(countryCurrency),'Select Country/Region') + field('currency','Account Currency','',true) + select('type','Account Type',['Bank card','e-wallet'],'Select Account Type') + select('code','Bank/Wallet Code',bankCodes(),'Select Bank/Wallet Code',!draft.type) + field('account','Bank/Wallet Account','Enter bank account number') + field('name','Recipient Name','Enter the account holder name') + field('phone','Phone Number','Enter phone number',false,'tel') + field('swift','SWIFT Code','Enter SWIFT Code') + field('home','Home address','Enter home address') + field('email','Email','Enter email address',false,'email');
      html += `<p class="onlinePaymentGuidance">${guidance}</p>`;
    }
    form.innerHTML = html;
    form.oninput = e => {if(e.target.name){draft[e.target.name]=e.target.value;const err=form.querySelector(`[data-error="${e.target.name}"]`);if(err)err.textContent='';e.target.removeAttribute('aria-invalid');if(editing==='Coin Trader Top-up')resetTraderVerification();}};
    form.onchange = e => {if(e.target.name==='country'){draft.currency=countryCurrency[draft.country]||'';draft.type='';draft.code='';drawFields();form.elements.country.focus();}else if(e.target.name==='type'){draft.code='';drawFields();form.elements.type.focus();}};
    form.onsubmit = e => {e.preventDefault();savePaymentInfo();};
    if (editing === 'Coin Trader Top-up') {
      document.getElementById('onlineTraderConfirm').onclick = verifyTrader;
      form.elements.traderId.onkeydown = e => {
        if (e.key === 'Enter') { e.preventDefault(); verifyTrader(); }
      };
      resetTraderVerification();
      if (draft.configured) verifyTrader();
    } else editor.querySelector('.onlineSave').disabled = false;
  }
  function resetTraderVerification() {
    verifiedId = '';
    document.querySelector('.onlineTraderToast')?.remove();
    document.getElementById('onlineTraderResult').innerHTML = '';
    document.getElementById('onlineTraderConfirm').disabled = !draft.traderId.trim();
    editor.querySelector('.onlineSave').disabled = true;
  }
  function verifyTrader() {
    const id = draft.traderId.trim();
    resetTraderVerification();
    if (!id) return;
    // Local fixtures preserve existing test IDs and add the supplied screenshot examples.
    const traders = {
      '9198': {name: 'user9198', type: 'Public Coin Trader', available: true},
      '10833021': {name: 'Demo Trader', type: 'Public Coin Trader', available: true},
      '10833022': {name: 'Demo Trader', type: 'Private Coin Trader', available: false}
    };
    const trader = traders[id];
    if (!trader) {
      const toast = document.createElement('div');
      toast.className = 'onlineTraderToast';
      toast.setAttribute('role', 'status');
      toast.textContent = 'Invalid Coin Trader ID.';
      editor.appendChild(toast);
      setTimeout(() => toast.remove(), 2400);
      return;
    }
    const availability = trader.available ? 'Available' : 'Unavailable';
    document.getElementById('onlineTraderResult').innerHTML = `<section class="onlineTraderCard">
      <header><span class="onlineTraderAvatar" aria-label="Trader avatar">${esc(trader.name.slice(0, 1).toUpperCase())}</span>
        <b>${esc(trader.name)}</b><span class="onlineTraderAvailability ${trader.available ? '' : 'unavailable'}">● ${availability}</span></header>
      <div class="onlineTraderDetail"><span>Coin Trader ID</span><b>${esc(id)}</b></div>
      <div class="onlineTraderDetail"><span>Type</span><b>${esc(trader.type)}</b></div>
    </section>`;
    verifiedId = trader.available ? id : '';
    editor.querySelector('.onlineSave').disabled = !verifiedId;
  }
  openPaymentInfo = m => {
    if(!profiles()[m])return;
    editing=m;draft={...profiles()[m],method:m==='EPAY'?'EPay':m};verifiedId='';
    document.getElementById('onlineEditorTitle').textContent=m==='Coin Trader Top-up'?m:(draft.configured?'Edit ':'Set up ')+(m==='EPAY'?'EPay':m);
    editor.classList.add('show');sheet.classList.remove('show');setBaseInert(true);drawFields();document.getElementById('onlinePaymentForm').scrollTop=0;editor.querySelector('.onlinePaymentBack').focus();
  };
  hidePaymentInfo = () => {editor.classList.remove('show');editing=null;draft=null;verifiedId='';renderPaymentMethodList();sheet.classList.add('show');sheet.querySelector('button')?.focus();};
  savePaymentInfo = () => {
    const form=document.getElementById('onlinePaymentForm');let invalid=[];
    form.querySelectorAll('[data-error]').forEach(x=>x.textContent='');
    const error=(key,message)=>{form.querySelector(`[data-error="${key}"]`).textContent=message;form.elements[key].setAttribute('aria-invalid','true');invalid.push(key);};
    if(editing==='USDT'&&!/^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(draft.address.trim()))error('address','Enter a valid TRC20 address.');
    if(editing==='EPAY'&&!/^\S+@\S+\.\S+$/.test(draft.email.trim()))error('email','Enter a valid email address.');
    if(editing==='Bank card or e-wallet') {
      for(const key of ['country','type','code','account','name'])if(!draft[key]?.trim())error(key,'Please complete this field.');
      if(draft.email&&!/^\S+@\S+\.\S+$/.test(draft.email.trim()))error('email','Enter a valid email address.');
    }
    if(invalid.length){form.elements[invalid[0]].focus();return;}
    if(editing==='Coin Trader Top-up'&&(!verifiedId||verifiedId!==draft.traderId.trim()))return;
    Object.keys(draft).forEach(k=>{if(typeof draft[k]==='string')draft[k]=draft[k].trim();});
    profiles()[editing]={...draft,configured:true};editor.classList.remove('show');editing=null;draft=null;refreshSummary();renderPaymentMethodList();sheet.classList.add('show');setBaseInert(true);sheet.querySelector('button')?.focus();
  };
  togglePreferredPayment = m => {const p=profiles()[m];if(!p?.configured)return;const on=host ? true : !p.preferred;Object.values(profiles()).forEach(x=>x.preferred=false);p.preferred=on;refreshSummary();renderPaymentMethodList();setBaseInert(true);sheet.querySelector(`[aria-label="${host ? 'Select' : p.preferred?'Remove preferred':'Set preferred'} ${m}"]`)?.focus();};
  window.payoutUI = {selectedAccount:() => {
    const method = preferredPaymentMethod();
    if (!method) return null;
    const profile = profiles()[method];
    const payee = method === 'Agency' ? profile.name + ' · ID ' + profile.agencyId
      : method === 'Coin Trader Top-up' ? 'ID ' + profile.traderId
      : method === 'EPAY' ? profile.email
      : method === 'Bank card or e-wallet' ? profile.code + ' · ' + profile.account
      : profile.address;
    return {method, payee, version: JSON.stringify(profile)};
  }, edit:i=>openPaymentInfo(methods[i]),star:i=>togglePreferredPayment(methods[i])};
  document.addEventListener('keydown',e=>{
    const active=editor.classList.contains('show')?editor:sheet.classList.contains('show')?sheet:null;if(!active)return;
    if(e.key==='Escape'){e.preventDefault();active===editor?hidePaymentInfo():hidePaymentMethodSheet();}
    if(e.key==='Tab'){const els=[...active.querySelectorAll('button:not(:disabled),input,select:not(:disabled),[tabindex="0"]')];const first=els[0],last=els[els.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}
  });
  if(host){refreshSummary();}
  else if(management){const oldSalary=renderSalary;renderSalary=()=>oldSalary().replace('<div class="salaryBillTabs"',notice()+'<div class="salaryBillTabs"').replace('Preferred payout method</small>','Preferred payout method · Tap to manage</small>').replace('Payment method not set</b>','No preferred method</b>').replace('Tap to complete payout information</small>','Tap to star a configured method</small>');render();}
  else {document.querySelector('#salary .salaryRecordsHead').insertAdjacentHTML('afterend',notice());refreshSummary();}
})();
