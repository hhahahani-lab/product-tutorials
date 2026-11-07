/* Same-origin settlement fixtures shared by the four prototype entry points. */
window.salaryDemo = (() => {
  const key = 'salary-collection-linked-v1';
  const traders = {
    '1164083': {name:'LOVEDIA',type:'Private Coin Trader',available:true},
    '1201386': {name:'SH-AGENCY',type:'Public Coin Trader',available:true},
    '10833022': {name:'Demo Trader',type:'Private Coin Trader',available:false}
  };
  function read() {
    try { return JSON.parse(localStorage.getItem(key) || '{}'); } catch { return {}; }
  }
  function write(bill) {
    const bills = read();
    const previous = bills[bill.uid];
    const candidate = {...bill};
    delete candidate.revision;
    const old = {...previous};
    delete old.revision;
    if (JSON.stringify(candidate) === JSON.stringify(old)) return;
    bills[bill.uid] = {...candidate,revision:(previous?.revision || 0) + 1};
    localStorage.setItem(key,JSON.stringify(bills));
    window.dispatchEvent(new Event('salary-demo-change'));
  }
  const initial = read();
  for (const [uid,start,end,salary,review] of [
    ['319008','2026-10-19','2026-10-25',48.4,'Confirmed'],
    ['319009','2026-10-12','2026-10-18',32,'Confirmed'],
    ['319010','2026-10-26','2026-11-01',48.4,'Pending Confirmation'],
    ['319011','2026-09-28','2026-10-04',5,'Pending Confirmation']
  ]) {
    if (initial[uid]) continue;
    initial[uid] = {uid,name:'Aurora Media',ownerUid:'10032846',start,end,
      period:start+' - '+end,finance:'Published',review,revision:1,
      method:'USDT',payee:'TQ8Lw9p2xD7k3mN6cR4vB1zA5sF9hJ2uXq',
      agentSalary:10,agentAdj:0,payments:review==='Pending Confirmation'?{}:{'host:88888888':{method:'Coin Trader Top-up',receiver:'Demo Trader · ID 10833022',receiverUid:'10833022',status:'Returned',available:false}},
      hosts:[{uid:'88888888',name:'Alicia Moon',salary,target:Math.max(salary-8.4,0),diamond:Math.min(salary,8.4),
        adjustment:0,coins:320000,diamonds:80000,days:4,hours:10,
        collection:review==='Pending Confirmation'?'Agency':'Coin Trader Top-up',traderId:'10833022',traderName:'Demo Trader'}]};
  }
  Object.values(initial).forEach(bill=>{if(bill.review==='Confirmed')bill.rejectReason='';});
  localStorage.setItem(key,JSON.stringify(initial));
  function finalHost(host) { return Math.round((host.salary + host.adjustment)*100)/100; }
  function total(bill) { return Math.round((bill.hosts.reduce((sum,host)=>sum+finalHost(host),0)+bill.agentSalary+bill.agentAdj)*100)/100; }
  function split(bill) { return Math.round(bill.hosts.filter(host=>host.collection==='Coin Trader Top-up' && finalHost(host)>=5).reduce((sum,host)=>sum+finalHost(host),0)*100)/100; }
  function route(bill,host) {
    const payment = bill.payments['host:'+host.uid] || bill.payments['personal:'+host.uid];
    if (payment) return payment;
    const amount = finalHost(host);
    if (host.collection==='Coin Trader Top-up' && amount>=5) return {method:host.collection,receiver:host.traderName+' · ID '+host.traderId,receiverUid:host.traderId,status:'Unpaid'};
    const remaining = Math.round((total(bill)-split(bill))*100)/100;
    if (remaining>0 && remaining<5) return {method:'Coins',receiver:'Personal UID '+host.uid,receiverUid:host.uid,status:'Unpaid'};
    return {method:'Paid via Agency',receiver:bill.name+' · ID '+bill.uid,status:bill.payments['agency:'+bill.uid]?.status || 'Unpaid'};
  }
  function frontend(bill) {
    const hostRows=bill.hosts.map(host=>{
      const payment=route(bill,host);
      return {id:host.uid,name:host.name,nick:host.name,hostSalary:host.salary,adjustment:host.adjustment,
        agencySalary:0,agentSalary:0,targetSalary:host.target,diamondSalary:host.diamond,
        goldNum:host.coins,diamondNum:host.diamonds,coins:host.coins,diamonds:host.diamonds,
        validDay:host.days,validTime:host.hours,days:host.days,hours:host.hours,workingMet:host.days>=4,
        collection:host.collection==='Coin Trader Top-up'?'trader':'agency',traderId:host.traderId,traderName:host.traderName,
        payoutStatus:payment.status==='Returned'?'Payment issue':payment.status==='Paid'?'Paid':'Agency Confirmed',
        paymentOverride:payment};
    });
    const remaining=Math.round((total(bill)-split(bill))*100)/100;
    const agencyPayments=Object.entries(bill.payments).filter(([id])=>!id.startsWith('host:')).map(([,value])=>value);
    return {id:Number(bill.uid),linkedUid:bill.uid,periodId:bill.uid,ownerUid:bill.ownerUid,
      start:bill.start,end:bill.end,published:bill.finance==='Published',revision:bill.revision,
      status:bill.review==='Rejected'?3:bill.review==='Pending Confirmation'?1:agencyPayments.length&&agencyPayments.every(item=>item.status==='Paid')?4:2,
      gold:bill.hosts.reduce((sum,host)=>sum+host.coins,0),diamonds:bill.hosts.reduce((sum,host)=>sum+host.diamonds,0),
      hostSalary:bill.hosts.reduce((sum,host)=>sum+host.salary,0),agencySalary:bill.agentSalary,
      agentAdjustment:bill.agentAdj,hostAdjustment:bill.hosts.reduce((sum,host)=>sum+host.adjustment,0),
      total:bill.hosts.reduce((sum,host)=>sum+host.salary,0)+bill.agentSalary,shouldPay:total(bill),
      method:remaining>0&&remaining<5?'Coins':bill.method,payee:bill.payee,
      agencyPayoutStatus:agencyPayments.length&&agencyPayments.every(item=>item.status==='Paid')?'Paid':'Agency Confirmed',
      hosts:hostRows,hostEntries:hostRows};
  }
  function decision(view,status) {
    const bill=read()[view.linkedUid];
    if (!bill || bill.review!=='Pending Confirmation' || bill.finance!=='Published') return;
    bill.review=status===3?'Rejected':'Confirmed';
    if(status===3) {bill.finance='Ready to Publish';bill.rejectReason=view.rejectionReason;}
    else {bill.method=view.method;bill.payee=view.payee;bill.rejectReason='';}
    write(bill);
  }
  function configureAgency(ownerUid,account) {
    if(!account)return;
    Object.values(read()).filter(bill=>bill.ownerUid===String(ownerUid)&&bill.review==='Pending Confirmation'&&bill.finance==='Published').forEach(bill=>{
      bill.method=account.method;
      bill.payee=account.payee;
      write(bill);
    });
  }
  function configureHost(account) {
    Object.values(read()).filter(bill=>bill.review==='Pending Confirmation'&&bill.finance==='Published').forEach(bill=>{
      const host=bill.hosts.find(item=>item.uid==='88888888');
      if(!host)return;
      host.collection=account.method;
      host.traderId=account.traderId || '';
      host.traderName=traders[host.traderId]?.name || '';
      write(bill);
    });
  }
  window.addEventListener('storage',event=>{if(event.key===key)window.dispatchEvent(new Event('salary-demo-change'));});
  return {key,read,write,traders,total,split,route,frontend,decision,configureHost,configureAgency};
})();
