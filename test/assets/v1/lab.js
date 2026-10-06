(() => {
 const key='residim-design-favorite';
 const safe={get(k){try{return localStorage.getItem(k)}catch{return null}},set(k,v){try{localStorage.setItem(k,v);return true}catch{return false}}};
 const select=document.querySelector('[data-appearance]');
 if(select){const stored=safe.get('residim-lab-skin');const allowed=['dark','light','soft'];if(allowed.includes(stored))select.value=stored;document.documentElement.dataset.skin=select.value;select.addEventListener('change',()=>{document.documentElement.dataset.skin=select.value;safe.set('residim-lab-skin',select.value)})}
 const preferred=document.querySelector('[data-preferred]');
 const update=()=>{if(preferred){const value=safe.get(key);preferred.textContent=value?'انتخاب این دستگاه: تست '+Number(value).toLocaleString('fa-IR'):'هنوز طرحی انتخاب نکرده‌اید.'}};update();
 document.querySelectorAll('[data-favorite]').forEach(button=>button.addEventListener('click',()=>{const ok=safe.set(key,button.dataset.favorite);const status=document.querySelector('[data-status]');if(status)status.textContent=ok?'این طرح به‌عنوان انتخاب شما روی این دستگاه ذخیره شد.':'مرورگر اجازه ذخیره انتخاب را نداد.';update()}));
 const dayButtons=[...document.querySelectorAll('[data-day]')];
 dayButtons.forEach(button=>button.addEventListener('click',()=>{dayButtons.forEach(b=>b.setAttribute('aria-pressed',String(b===button)));const target=document.querySelector('[data-day-output]');if(target)target.textContent=button.dataset.day+'، ساعت ۷:۱۰؛ همیار '+button.dataset.driver+' — برنامه نمونه'}));
 const notify=document.querySelector('[data-preview]');if(notify)notify.addEventListener('click',()=>{const status=document.querySelector('[data-status]');status.textContent='در این نمونه: درخواست جایگزینی ثبت می‌شود، همیارها مطلع می‌شوند و بعد از پذیرش، برنامه به‌روز می‌شود.'});
 if('serviceWorker' in navigator && ['https:','http:'].includes(location.protocol))navigator.serviceWorker.register(new URL('../../sw.js',document.currentScript.src),{scope:new URL('../../',document.currentScript.src).pathname}).catch(()=>{});
})();
