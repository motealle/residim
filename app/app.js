(() => {
  'use strict';

  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const money = n => new Intl.NumberFormat('fa-IR').format(Math.round(Math.abs(n))) + ' تومان';
  const fmtDate = d => new Intl.DateTimeFormat('fa-IR-u-ca-persian',{weekday:'short',day:'numeric',month:'short'}).format(d);
  const todayISO = () => new Date().toISOString().slice(0,10);
  const addDays = (d,n) => { const x=new Date(d); x.setDate(x.getDate()+n); return x; };
  const storageKey = 'residim-demo-v1';

  const state = {
    mode: 'live', user: null, groups: [], group: null, members: [], trips: [], ledger: [],
    inviteCode: '', currentMemberId: null, currentTrip: null, installPrompt: null,
    location: null, webOtpController: null
  };

  const els = {
    authView: $('#authView'), onboardingView: $('#onboardingView'), appShell: $('#appShell'), offlineBar: $('#offlineBar'),
    authPhoneStep: $('#authPhoneStep'), authOtpStep: $('#authOtpStep'), phoneInput: $('#phoneInput'), otpInput: $('#otpInput'),
    requestOtpBtn: $('#requestOtpBtn'), verifyOtpBtn: $('#verifyOtpBtn'), backToPhoneBtn: $('#backToPhoneBtn'), authMessage: $('#authMessage'), otpHint: $('#otpHint'),
    groupNameInput: $('#groupNameInput'), tripValueInput: $('#tripValueInput'), groupStartInput: $('#groupStartInput'), createGroupBtn: $('#createGroupBtn'), inviteCodeInput: $('#inviteCodeInput'), joinGroupBtn: $('#joinGroupBtn'), onboardingMessage: $('#onboardingMessage'),
    groupName: $('#groupName'), groupSwitcher: $('#groupSwitcher'), scheduleGrid: $('#scheduleGrid'), weekLabel: $('#weekLabel'),
    nextTripTitle: $('#nextTripTitle'), nextTripMeta: $('#nextTripMeta'), readyBtn: $('#readyBtn'), cantBtn: $('#cantBtn'), startTripBtn: $('#startTripBtn'), locationBtn: $('#locationBtn'), locationStatus: $('#locationStatus'),
    balanceValue: $('#balanceValue'), balanceLabel: $('#balanceLabel'), doneCount: $('#doneCount'), forecastValue: $('#forecastValue'), settlementList: $('#settlementList'), ledgerList: $('#ledgerList'), membersList: $('#membersList'), membersTitle: $('#membersTitle'),
    copyInviteBtn: $('#copyInviteBtn'), privacyLocationBtn: $('#privacyLocationBtn'), installBtn: $('#installBtn'), notifyBtn: $('#notifyBtn'), profileBtn: $('#profileBtn'),
    tripDialog: $('#tripDialog'), dialogTitle: $('#dialogTitle'), dialogMeta: $('#dialogMeta'), dialogActions: $('#dialogActions'), toast: $('#toast')
  };

  function toast(message, type='ok', timeout=3200){
    const div=document.createElement('div');
    div.className='toast-alert'+(type==='warn'?' warn':type==='error'?' error':'');
    div.textContent=message; els.toast.appendChild(div);
    if(window.gsap) gsap.from(div,{opacity:0,y:10,duration:.25});
    setTimeout(()=>{ if(window.gsap){gsap.to(div,{opacity:0,y:8,duration:.2,onComplete:()=>div.remove()});} else div.remove(); },timeout);
  }

  function setBusy(btn, busy, label){
    if(!btn) return;
    if(busy){btn.dataset.label=btn.textContent;btn.disabled=true;btn.innerHTML='<span class="loading loading-spinner loading-sm"></span> '+(label||'کمی صبر کنید');}
    else{btn.disabled=false;btn.textContent=btn.dataset.label||label||btn.textContent;}
  }

  async function api(action, method='GET', body=null){
    const options={method,headers:{'Accept':'application/json'},credentials:'same-origin'};
    if(body!==null){options.headers['Content-Type']='application/json';options.body=JSON.stringify(body);}
    const response=await fetch('./api/index.php?action='+encodeURIComponent(action),options);
    let data={}; try{data=await response.json();}catch{data={ok:false,error:'invalid_response'};}
    if(!response.ok || data.ok===false){const err=new Error(data.message||data.error||'خطای سرور');err.code=data.error;err.status=response.status;err.data=data;throw err;}
    return data;
  }

  function showOnly(view){[els.authView,els.onboardingView,els.appShell].forEach(el=>el.hidden=true);view.hidden=false;}

  function normalizePhone(input){
    const fa='۰۱۲۳۴۵۶۷۸۹', ar='٠١٢٣٤٥٦٧٨٩';
    let s=String(input||'').trim().replace(/[۰-۹]/g,d=>fa.indexOf(d)).replace(/[٠-٩]/g,d=>ar.indexOf(d)).replace(/s|-/g,'');
    if(s.startsWith('+98')) s='0'+s.slice(3);
    if(s.startsWith('98') && s.length===12) s='0'+s.slice(2);
    return s;
  }

  async function requestOtp(){
    const phone=normalizePhone(els.phoneInput.value);
    if(!/^09d{9}$/.test(phone)){els.authMessage.textContent='شماره موبایل را به شکل 09xxxxxxxxx وارد کنید.';return;}
    setBusy(els.requestOtpBtn,true,'در حال ارسال');els.authMessage.textContent='';
    try{
      const res=await api('request_otp','POST',{phone});
      state.pendingPhone=phone;
      els.authPhoneStep.hidden=true;els.authOtpStep.hidden=false;
      els.otpHint.textContent='کد برای '+phone.replace(/(d{4})d{4}(d{3})/,'$1••••$2')+' ارسال شد.';
      els.otpInput.focus(); if(res.debug_code){els.authMessage.textContent='حالت توسعه: کد '+res.debug_code;} startWebOtp();
    }catch(err){
      if(err.code==='sms_not_configured') els.authMessage.textContent='درگاه پیامک هنوز روی سرور پیکربندی نشده؛ نسخه نمایشی پایین صفحه آماده است.';
      else els.authMessage.textContent=err.message||'ارسال کد انجام نشد.';
    }finally{setBusy(els.requestOtpBtn,false);}
  }

  async function startWebOtp(){
    if(!('OTPCredential' in window) || !navigator.credentials) return;
    try{
      state.webOtpController?.abort();
      const controller=new AbortController();state.webOtpController=controller;setTimeout(()=>controller.abort(),120000);
      const otp=await navigator.credentials.get({otp:{transport:['sms']},signal:controller.signal});
      if(otp?.code){els.otpInput.value=otp.code;verifyOtp();}
    }catch(err){if(err.name!=='AbortError') console.debug('WebOTP unavailable',err);}
  }

  async function verifyOtp(){
    const code=String(els.otpInput.value||'').replace(/D/g,'');
    if(code.length!==6){els.authMessage.textContent='کد باید ۶ رقم باشد.';return;}
    setBusy(els.verifyOtpBtn,true,'در حال ورود');els.authMessage.textContent='';
    try{await api('verify_otp','POST',{phone:state.pendingPhone,code});state.webOtpController?.abort();await bootLive();}
    catch(err){els.authMessage.textContent=err.message||'کد معتبر نیست یا منقضی شده است.';}
    finally{setBusy(els.verifyOtpBtn,false);}
  }

  function makeDemo(){
    const saved=localStorage.getItem(storageKey); if(saved){try{return JSON.parse(saved);}catch{}}
    const start=new Date();start.setHours(0,0,0,0);start.setDate(start.getDate()-((start.getDay()+1)%7));
    const members=[
      {id:'me',label:'خانواده شما',role:'owner',start_date:start.toISOString().slice(0,10)},
      {id:'m1',label:'همیار ۱',role:'member',start_date:start.toISOString().slice(0,10)},
      {id:'m2',label:'همیار ۲',role:'member',start_date:start.toISOString().slice(0,10)},
      {id:'m3',label:'همیار ۳',role:'member',start_date:start.toISOString().slice(0,10)}
    ];
    const trips=[];let id=1;
    for(let day=0;day<6;day++) for(const direction of ['morning','return']){
      const member=members[(day*2+(direction==='return'?1:0))%members.length];
      let status='planned';if(day===0)status='completed';if(day===1&&direction==='morning')status='confirmed';if(day===2&&direction==='return')status='replacement_needed';
      trips.push({id:'d'+id++,service_date:addDays(start,day).toISOString().slice(0,10),direction,planned_time:direction==='morning'?'07:10':'13:15',assigned_member_id:member.id,assigned_label:member.label,status,actual_member_id:status==='completed'?member.id:null,actual_label:status==='completed'?member.label:null,value:100000});
    }
    const demo={group:{id:'demo',name:'هم‌سرویس نمونه',trip_value:100000,invite_code:'RD7K2M'},members,trips,currentMemberId:'me'};
    localStorage.setItem(storageKey,JSON.stringify(demo));return demo;
  }

  function saveDemo(){if(state.mode==='demo')localStorage.setItem(storageKey,JSON.stringify({group:state.group,members:state.members,trips:state.trips,currentMemberId:state.currentMemberId}));}

  function applyData(data){
    state.user=data.user||state.user;state.groups=data.groups||state.groups;state.group=data.group||state.groups?.[0]||state.group;
    state.members=(data.members||[]).map((m,i)=>({...m,label:m.label||m.display_name||(m.is_current?'خانواده شما':'همیار '+i)}));
    state.trips=(data.trips||[]).map(t=>({...t,id:String(t.id),assigned_member_id:String(t.assigned_member_id||t.assigned_user_id||''),actual_member_id:t.actual_member_id?String(t.actual_member_id):t.actual_user_id?String(t.actual_user_id):null,value:Number(t.value||t.trip_value||state.group?.trip_value||100000)}));
    state.ledger=data.ledger||[];state.inviteCode=data.invite_code||state.group?.invite_code||'';state.currentMemberId=String(data.current_member_id||state.user?.id||state.currentMemberId||'');
  }

  async function bootLive(){
    state.mode='live';
    try{
      const session=await api('session');if(!session.authenticated){showOnly(els.authView);return;}
      state.user=session.user;const data=await api('bootstrap');
      if(!data.groups?.length){showOnly(els.onboardingView);els.groupStartInput.value=todayISO();return;}
      applyData(data);showApp();
    }catch(err){showOnly(els.authView);els.authMessage.textContent='ارتباط با سرور برقرار نشد. می‌توانید نسخه نمایشی را ببینید.';}
  }

  function bootDemo(){
    state.mode='demo';state.user={id:'me',display_name:'خانواده شما'};
    const demo=makeDemo();applyData({...demo,groups:[demo.group],current_member_id:demo.currentMemberId,user:state.user,invite_code:demo.group.invite_code});
    showApp();toast('نسخه نمایشی فعال است؛ تغییرات فقط روی همین دستگاه ذخیره می‌شود.','warn',4200);
  }

  function showApp(){showOnly(els.appShell);els.groupName.textContent=state.group?.name||'هم‌سرویس';renderAll();const hash=location.hash.replace('#','');if(['week','account','group'].includes(hash))switchTab(hash);}
  function getMember(id){return state.members.find(m=>String(m.id)===String(id));}
  function memberLabel(id){return getMember(id)?.label||getMember(id)?.display_name||(String(id)===String(state.currentMemberId)?'خانواده شما':'همیار');}
  function directionLabel(d){return d==='return'?'برگشت':'رفت';}
  function statusLabel(s){return ({planned:'قرار قطعی',confirmed:'آماده و تأییدشده',started:'در حال انجام',replacement_needed:'جایگزین لازم است',completed:'انجام شده',cancelled:'لغو شده'})[s]||s;}
  function uniqueDays(){return [...new Set(state.trips.map(t=>t.service_date))].sort().slice(0,6);}

  function renderSchedule(){
    const grid=els.scheduleGrid;grid.innerHTML='';const days=uniqueDays();
    const corner=document.createElement('div');corner.className='schedule-cell header row-head corner';corner.textContent='خانواده';grid.append(corner);
    days.forEach(date=>{const d=new Date(date+'T12:00:00');['morning','return'].forEach(dir=>{const h=document.createElement('div');h.className='schedule-cell header'+(date===todayISO()?' today':'');h.innerHTML='<span>'+fmtDate(d)+'</span><small>'+directionLabel(dir)+'</small>';grid.append(h);});});
    const members=[...state.members].sort((a,b)=>String(a.id)===String(state.currentMemberId)?-1:String(b.id)===String(state.currentMemberId)?1:0);
    members.forEach(member=>{
      const head=document.createElement('div');head.className='schedule-cell row-head';head.textContent=String(member.id)===String(state.currentMemberId)?'خانواده شما':member.label;grid.append(head);
      days.forEach(date=>['morning','return'].forEach(direction=>{
        const cell=document.createElement('div');cell.className='schedule-cell'+(date===todayISO()?' today':'');
        const planned=state.trips.find(t=>t.service_date===date&&t.direction===direction&&String(t.assigned_member_id)===String(member.id));
        const actual=state.trips.find(t=>t.service_date===date&&t.direction===direction&&t.status==='completed'&&String(t.actual_member_id)===String(member.id)&&String(t.assigned_member_id)!==String(member.id));
        const trip=actual||planned;
        if(trip){
          const btn=document.createElement('button');btn.type='button';btn.className='schedule-slot';
          if(trip.status==='completed')btn.classList.add('done');if(trip.status==='replacement_needed')btn.classList.add('warn');if(actual)btn.classList.add('replaced');
          btn.textContent=actual?'انجام':trip.status==='replacement_needed'?'جایگزین':trip.status==='completed'?'انجام':'قرار';btn.addEventListener('click',()=>openTrip(trip));cell.append(btn);
        }else{const e=document.createElement('span');e.className='schedule-empty';e.textContent='—';cell.append(e);}grid.append(cell);
      }));
    });
    if(days.length)els.weekLabel.textContent=fmtDate(new Date(days[0]+'T12:00:00'))+' تا '+fmtDate(new Date(days[days.length-1]+'T12:00:00'));
  }

  function nextAssignedTrip(){
    const current=state.trips.filter(t=>String(t.assigned_member_id)===String(state.currentMemberId)&&!['completed','cancelled'].includes(t.status)).sort((a,b)=>(a.service_date+a.planned_time).localeCompare(b.service_date+b.planned_time));
    return current[0]||state.trips.find(t=>!['completed','cancelled'].includes(t.status))||state.trips[0];
  }

  function renderNextTrip(){
    const trip=nextAssignedTrip();if(!trip){els.nextTripTitle.textContent='فعلاً نوبتی ندارید';els.nextTripMeta.textContent='با ساخت برنامه هفتگی، نوبت‌ها اینجا ظاهر می‌شوند.';els.readyBtn.disabled=els.cantBtn.disabled=true;return;}
    const d=new Date(trip.service_date+'T12:00:00');els.nextTripTitle.textContent=fmtDate(d)+' · '+directionLabel(trip.direction)+' · '+trip.planned_time;els.nextTripMeta.textContent=statusLabel(trip.status)+' · '+memberLabel(trip.assigned_member_id);
    els.readyBtn.disabled=trip.status==='completed'||String(trip.assigned_member_id)!==String(state.currentMemberId);els.cantBtn.disabled=trip.status==='completed'||String(trip.assigned_member_id)!==String(state.currentMemberId);
    els.readyBtn.onclick=()=>performTripAction(trip,'ready');els.cantBtn.onclick=()=>performTripAction(trip,'cant');els.startTripBtn.onclick=()=>startTrip(trip);
  }

  function computeLedger(){
    const entries=[];const members=state.members;
    state.trips.filter(t=>t.status==='completed').forEach(t=>{
      const active=members.filter(m=>!m.start_date||m.start_date<=t.service_date);const value=Number(t.value||state.group?.trip_value||100000);const share=active.length?value/active.length:0;
      active.forEach(m=>entries.push({trip_id:t.id,user_id:String(m.id),amount:-share,kind:'usage',date:t.service_date,label:'سهم استفاده · '+directionLabel(t.direction)}));
      const driver=String(t.actual_member_id||t.assigned_member_id);entries.push({trip_id:t.id,user_id:driver,amount:value,kind:'service',date:t.service_date,label:'اعتبار انجام سفر · '+directionLabel(t.direction)});
    });return entries;
  }

  function computeBalances(entries){const balances=new Map(state.members.map(m=>[String(m.id),0]));entries.forEach(e=>balances.set(String(e.user_id),(balances.get(String(e.user_id))||0)+Number(e.amount)));return balances;}
  function settle(balances){
    const creditors=[...balances].filter(([,v])=>v>1).map(([id,v])=>({id,v})).sort((a,b)=>b.v-a.v);
    const debtors=[...balances].filter(([,v])=>v<-1).map(([id,v])=>({id,v:-v})).sort((a,b)=>b.v-a.v);
    const out=[];let i=0,j=0;while(i<debtors.length&&j<creditors.length){const x=Math.min(debtors[i].v,creditors[j].v);out.push({from:debtors[i].id,to:creditors[j].id,amount:x});debtors[i].v-=x;creditors[j].v-=x;if(debtors[i].v<1)i++;if(creditors[j].v<1)j++;}return out;
  }

  function renderAccount(){
    const entries=state.mode==='live'&&state.ledger?.length?state.ledger:computeLedger();const balances=computeBalances(entries);const current=balances.get(String(state.currentMemberId))||0;
    els.balanceValue.textContent=(current>=0?'+':'−')+money(current).replace(' تومان','');els.balanceValue.classList.toggle('positive',current>=0);els.balanceValue.classList.toggle('negative',current<0);els.balanceLabel.textContent=current>=0?'طلب شما':'مانده پرداخت شما';
    els.doneCount.textContent=new Intl.NumberFormat('fa-IR').format(state.trips.filter(t=>t.status==='completed'&&String(t.actual_member_id||t.assigned_member_id)===String(state.currentMemberId)).length);
    const allPlanned=state.trips.filter(t=>t.status!=='cancelled');let forecast=current;const activeCount=Math.max(state.members.length,1);
    allPlanned.filter(t=>t.status!=='completed').forEach(t=>{forecast-=Number(t.value||100000)/activeCount;if(String(t.assigned_member_id)===String(state.currentMemberId))forecast+=Number(t.value||100000);});els.forecastValue.textContent=(forecast>=0?'+':'−')+money(forecast).replace(' تومان','');
    const settlements=settle(balances).filter(s=>s.from===String(state.currentMemberId)||s.to===String(state.currentMemberId));els.settlementList.innerHTML=settlements.length?'':'<div class="settlement-item"><span>فعلاً تسویه‌ای برای شما لازم نیست.</span><span class="badge badge-success badge-outline">صاف</span></div>';
    settlements.forEach(s=>{const div=document.createElement('div');div.className='settlement-item';const mineFrom=s.from===String(state.currentMemberId);div.innerHTML='<span>'+(mineFrom?'پرداخت به':'دریافت از')+' <strong>'+memberLabel(mineFrom?s.to:s.from)+'</strong></span><b>'+money(s.amount)+'</b>';els.settlementList.append(div);});
    const mine=entries.filter(e=>String(e.user_id)===String(state.currentMemberId)).sort((a,b)=>String(b.date).localeCompare(String(a.date))).slice(0,10);els.ledgerList.innerHTML=mine.length?'':'<div class="ledger-item"><span>هنوز سفر تکمیل‌شده‌ای ثبت نشده است.</span></div>';
    mine.forEach(e=>{const div=document.createElement('div');div.className='ledger-item';div.innerHTML='<div><span>'+(e.label||e.kind)+'</span><small>'+(e.date||'')+'</small></div><b class="'+(Number(e.amount)>=0?'credit':'debit')+'">'+(Number(e.amount)>=0?'+':'−')+money(e.amount)+'</b>';els.ledgerList.append(div);});
  }

  function renderGroup(){
    els.membersTitle.textContent=new Intl.NumberFormat('fa-IR').format(state.members.length)+' خانواده';els.membersList.innerHTML='';
    state.members.forEach(m=>{const div=document.createElement('div');div.className='member-item';const isMe=String(m.id)===String(state.currentMemberId);div.innerHTML='<div><span>'+(isMe?'خانواده شما':m.label)+'</span><small>'+(m.role==='owner'?'مدیر هم‌سرویس':'عضو')+' · شروع '+(m.start_date||'از امروز')+'</small></div><span class="badge '+(isMe?'badge-success':'badge-ghost')+' badge-outline">'+(isMe?'شما':'فعال')+'</span>';els.membersList.append(div);});
  }

  function renderAll(){els.groupName.textContent=state.group?.name||'هم‌سرویس';renderNextTrip();renderSchedule();renderAccount();renderGroup();}

  function openTrip(trip){
    state.currentTrip=trip;const d=new Date(trip.service_date+'T12:00:00');els.dialogTitle.textContent=fmtDate(d)+' · '+directionLabel(trip.direction)+' · '+trip.planned_time;
    els.dialogMeta.innerHTML='<div><span>مسئول برنامه</span><strong>'+memberLabel(trip.assigned_member_id)+'</strong></div><div><span>وضعیت</span><strong>'+statusLabel(trip.status)+'</strong></div><div><span>ارزش نوبت</span><strong>'+money(trip.value||state.group?.trip_value||100000)+'</strong></div>'+(trip.actual_member_id?'<div><span>انجام‌دهنده واقعی</span><strong>'+memberLabel(trip.actual_member_id)+'</strong></div>':'');
    els.dialogActions.innerHTML='';
    const add=(label,cls,fn)=>{const b=document.createElement('button');b.type='button';b.className='btn '+cls;b.textContent=label;b.onclick=fn;els.dialogActions.append(b);};const mine=String(trip.assigned_member_id)===String(state.currentMemberId);
    if(trip.status==='replacement_needed'&&!mine)add('قبول می‌کنم','btn-success',()=>performTripAction(trip,'accept_swap'));
    if(mine&&!['completed','cancelled'].includes(trip.status)){add('✓ آماده‌ام','btn-success',()=>performTripAction(trip,'ready'));add('جایگزین می‌خواهم','btn-ghost',()=>performTripAction(trip,'cant'));add('انجام شد','btn-primary',()=>performTripAction(trip,'done'));}
    if(trip.status==='completed')add('ثبت شده','btn-disabled',()=>{});els.tripDialog.showModal();
  }

  async function performTripAction(trip,action){
    try{
      if(state.mode==='demo'){
        if(action==='ready')trip.status='confirmed';if(action==='cant')trip.status='replacement_needed';if(action==='done'){trip.status='completed';trip.actual_member_id=state.currentMemberId;trip.actual_label=memberLabel(state.currentMemberId);}
        if(action==='accept_swap'){trip.original_member_id=trip.assigned_member_id;trip.assigned_member_id=state.currentMemberId;trip.assigned_label=memberLabel(state.currentMemberId);trip.status='confirmed';}
        saveDemo();renderAll();els.tripDialog.close();toast(action==='cant'?'درخواست جایگزین ثبت شد.':'وضعیت نوبت به‌روز شد.');return;
      }
      await api('trip_action','POST',{trip_id:trip.id,action});await refreshLive();els.tripDialog.close();toast('وضعیت نوبت به‌روز شد.');
    }catch(err){toast(err.message||'این تغییر ثبت نشد.','error');}
  }

  async function startTrip(trip){
    if(!trip)return;let location=null;try{location=await getLocation(false);}catch{}
    if(state.mode==='demo'){trip.status='started';trip.started_at=new Date().toISOString();if(location)trip.location=location;saveDemo();renderAll();toast('شروع سفر ثبت شد.');return;}
    try{await api('trip_action','POST',{trip_id:trip.id,action:'start',location});await refreshLive();toast('شروع سفر ثبت شد.');}catch(err){toast(err.message||'شروع سفر ثبت نشد.','error');}
  }

  function getLocation(showToast=true){
    return new Promise((resolve,reject)=>{
      if(!navigator.geolocation){if(showToast)toast('این دستگاه دسترسی موقعیت ندارد.','warn');return reject(new Error('no_geolocation'));}
      els.locationStatus.textContent='در حال دریافت…';
      navigator.geolocation.getCurrentPosition(pos=>{const loc={lat:pos.coords.latitude,lng:pos.coords.longitude,accuracy:Math.round(pos.coords.accuracy),captured_at:new Date().toISOString()};state.location=loc;els.locationStatus.textContent='دقت حدود '+new Intl.NumberFormat('fa-IR').format(loc.accuracy)+' متر';if(showToast)toast('موقعیت همین لحظه ثبت شد.');resolve(loc);},err=>{els.locationStatus.textContent='دسترسی داده نشد';if(showToast)toast('بدون اجازه شما موقعیتی ثبت نمی‌شود.','warn');reject(err);},{enableHighAccuracy:true,timeout:10000,maximumAge:15000});
    });
  }

  async function captureLocation(){try{const loc=await getLocation();if(state.mode==='live')await api('location_event','POST',{type:'manual',location:loc});}catch{}}
  async function refreshLive(){const data=await api('bootstrap');applyData(data);renderAll();}

  async function createGroup(){
    const name=els.groupNameInput.value.trim();const tripValue=Number(els.tripValueInput.value.replace(/D/g,''));const start=els.groupStartInput.value||todayISO();
    if(name.length<2||!tripValue){els.onboardingMessage.textContent='نام هم‌سرویس و ارزش هر نوبت را کامل کنید.';return;}setBusy(els.createGroupBtn,true,'در حال ساخت');
    try{await api('create_group','POST',{name,trip_value:tripValue,start_date:start});await bootLive();toast('هم‌سرویس ساخته شد؛ حالا می‌توانید اعضا را دعوت کنید.');}catch(err){els.onboardingMessage.textContent=err.message||'ساخت هم‌سرویس انجام نشد.';}finally{setBusy(els.createGroupBtn,false);}
  }

  async function joinGroup(){
    const code=els.inviteCodeInput.value.trim().toUpperCase();if(code.length<4){els.onboardingMessage.textContent='کد دعوت را وارد کنید.';return;}setBusy(els.joinGroupBtn,true,'در حال پیوستن');
    try{await api('join_group','POST',{invite_code:code,start_date:todayISO()});await bootLive();toast('به هم‌سرویس پیوستید.');}catch(err){els.onboardingMessage.textContent=err.message||'کد دعوت معتبر نیست.';}finally{setBusy(els.joinGroupBtn,false);}
  }

  function switchTab(tab){
    $$('.panel').forEach(p=>p.classList.toggle('active-panel',p.dataset.panel===tab));$$('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));history.replaceState(null,'','#'+tab);
    const panel=$('.panel[data-panel="'+tab+'"]');if(window.gsap&&panel)gsap.fromTo(panel,{opacity:0,y:8},{opacity:1,y:0,duration:.28,ease:'power2.out'});
  }

  function cycleGroup(){
    if(state.mode==='demo'||state.groups.length<2){toast(state.mode==='demo'?'در نسخه واقعی می‌توانید بین چند هم‌سرویس جابه‌جا شوید.':'فقط یک هم‌سرویس فعال دارید.');return;}
    const idx=state.groups.findIndex(g=>String(g.id)===String(state.group.id));const next=state.groups[(idx+1)%state.groups.length];api('select_group','POST',{group_id:next.id}).then(refreshLive).catch(e=>toast(e.message,'error'));
  }

  async function copyInvite(){const code=state.inviteCode||state.group?.invite_code;if(!code){toast('کد دعوت هنوز ساخته نشده است.','warn');return;}try{await navigator.clipboard.writeText(code);toast('کد دعوت '+code+' کپی شد.');}catch{toast('کد دعوت: '+code);}}

  async function requestNotifications(){
    if(!('Notification' in window)){toast('اعلان مرورگر روی این دستگاه پشتیبانی نمی‌شود.','warn');return;}
    const result=await Notification.requestPermission();
    if(result==='granted'){toast('اعلان‌ها فعال شدند.');try{const reg=await navigator.serviceWorker.ready;reg.showNotification('رسیدیم',{body:'اعلان‌های مهم نوبت و جایگزینی روی این دستگاه قابل نمایش‌اند.',icon:'/app/icon.svg'});}catch{}}
    else toast('اعلان فعال نشد؛ تغییرات مهم باید از مسیر پشتیبان هم اطلاع داده شوند.','warn');
  }

  function updateOnline(){els.offlineBar.hidden=navigator.onLine;}
  async function logout(){if(state.mode==='demo'){localStorage.removeItem(storageKey);location.href='./';return;}if(confirm('از حساب رسیدیم خارج می‌شوید؟')){try{await api('logout','POST',{});}finally{location.href='./';}}}

  async function boot(){
    if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js',{scope:'/app/'}).catch(console.warn);
    updateOnline();addEventListener('online',updateOnline);addEventListener('offline',updateOnline);
    addEventListener('beforeinstallprompt',e=>{e.preventDefault();state.installPrompt=e;els.installBtn.hidden=false;});
    const params=new URLSearchParams(location.search);if(params.get('demo')==='1')bootDemo();else await bootLive();
  }

  els.requestOtpBtn.addEventListener('click',requestOtp);els.verifyOtpBtn.addEventListener('click',verifyOtp);els.otpInput.addEventListener('keydown',e=>{if(e.key==='Enter')verifyOtp();});
  els.backToPhoneBtn.addEventListener('click',()=>{state.webOtpController?.abort();els.authOtpStep.hidden=true;els.authPhoneStep.hidden=false;els.authMessage.textContent='';});
  els.createGroupBtn.addEventListener('click',createGroup);els.joinGroupBtn.addEventListener('click',joinGroup);els.copyInviteBtn.addEventListener('click',copyInvite);
  els.locationBtn.addEventListener('click',captureLocation);els.privacyLocationBtn.addEventListener('click',captureLocation);els.notifyBtn.addEventListener('click',requestNotifications);els.profileBtn.addEventListener('click',logout);els.groupSwitcher.addEventListener('click',cycleGroup);
  els.installBtn.addEventListener('click',async()=>{if(!state.installPrompt)return;state.installPrompt.prompt();await state.installPrompt.userChoice;state.installPrompt=null;els.installBtn.hidden=true;});
  $$('.nav-item').forEach(btn=>btn.addEventListener('click',()=>switchTab(btn.dataset.tab)));$('.modal-close').addEventListener('click',()=>els.tripDialog.close());
  $('#todayBtn').addEventListener('click',()=>{const cell=$('.schedule-cell.today');cell?.scrollIntoView({behavior:'smooth',inline:'center',block:'nearest'});});
  boot();
})();
