const CACHE='residim-25-v1';
const SHELL=['./','index.html','manifest.webmanifest','radio.json','assets/app.css?v=25','assets/app.js?v=25','assets/map-style.json?v=25','assets/map-style-dark.json?v=25','assets/qrcode.js?v=25','assets/maplibre-gl.css','assets/icon.svg?v=25','assets/mapbg.svg?v=25','assets/snd/door.mp3?v=25','assets/snd/arrived.mp3?v=25','assets/snd/urgent.mp3?v=25','assets/icon-192.png','assets/icon-512.png','assets/vazirmatn.woff2'];
const SCOPE=new URL('./',self.registration.scope).pathname;
const TILES='residim-tiles-v1',MAX=900,AGE=14*864e5;
const MAPS=/(^|\.)(openfreemap\.org|neshan\.org)$/;
// map tiles, glyphs and sprites: cache-first for two weeks; fewer map requests, faster map, lower Neshan bills
async function tile(req,age){const c=await caches.open(TILES);const h=await c.match(req);if(h&&Date.now()-(+h.headers.get('x-at')||0)<age)return h;
  try{const r=await fetch(req);if(r.ok&&r.type!=='opaque'){const b=await r.clone().blob();const hd=new Headers(r.headers);hd.set('x-at',String(Date.now()));c.put(req,new Response(b,{status:r.status,headers:hd}));trim(c)}return r}catch(e){if(h)return h;throw e}}
let trimT=0;async function trim(c){if(Date.now()-trimT<30000)return;trimT=Date.now();const k=await c.keys();for(let i=0;i<k.length-MAX;i++)await c.delete(k[i])}
const OTHER=/^\/(app|t|test|smoke)\//;
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(n=>/^residim-\d+-v/.test(n)&&n!==CACHE).map(n=>caches.delete(n)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(e.request.method==='GET'&&MAPS.test(u.hostname)&&u.protocol==='https:'){e.respondWith(tile(e.request,/\.json$/.test(u.pathname)?864e5:AGE));return}
  if(e.request.method!=='GET'||u.origin!==location.origin||!u.pathname.startsWith(SCOPE))return;
  if(SCOPE==='/'&&OTHER.test(u.pathname))return; // root copy never touches /app or /t
  if(e.request.mode==='navigate'){e.respondWith(fetch(e.request).then(r=>{const c=r.clone();caches.open(CACHE).then(x=>x.put('index.html',c));return r}).catch(()=>caches.open(CACHE).then(c=>c.match('index.html'))));return}
  if(u.pathname.endsWith('radio.json')){e.respondWith(fetch(e.request).then(r=>{const c=r.clone();caches.open(CACHE).then(x=>x.put(e.request,c));return r}).catch(()=>caches.open(CACHE).then(c=>c.match(e.request))));return}
  e.respondWith(caches.open(CACHE).then(c=>c.match(e.request)).then(h=>h||fetch(e.request).then(r=>{if(r.ok){const c=r.clone();caches.open(CACHE).then(x=>x.put(e.request,c))}return r})));
});
// Web Push from our own server (VAPID). Urgent and trip news stay on screen until tapped.
self.addEventListener('push',e=>{let d={};try{d=e.data?e.data.json():{}}catch(x){d={b:e.data?e.data.text():''}}
  const hot=d.k==='urgent'||d.k==='trip';
  e.waitUntil(self.registration.showNotification(d.t||'رسیدیم',{body:d.b||'',icon:'assets/icon-192.png',badge:'assets/icon-192.png',dir:'rtl',lang:'fa',tag:hot?'residim-'+d.k+'-'+(d.at||''):'residim-'+(d.k||'info'),renotify:hot,requireInteraction:hot,vibrate:hot?[300,120,300,120,500]:[120],data:{k:d.k||''}}))});
self.addEventListener('notificationclick',e=>{e.notification.close();e.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(w=>{const c=w.find(x=>new URL(x.url).pathname.startsWith(SCOPE));return c?c.focus():clients.openWindow(SCOPE)}))});
