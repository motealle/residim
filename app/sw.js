const CACHE='residim-shell-v1';
const SHELL=['/app/','/app/index.html','/app/styles.css','/app/app.js','/app/manifest.webmanifest','/app/icon.svg','/app/offline.html'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET') return;
  const url=new URL(event.request.url);
  if(url.pathname.startsWith('/app/api/')) return;
  if(event.request.mode==='navigate'){
    event.respondWith(fetch(event.request).then(res=>{const copy=res.clone();caches.open(CACHE).then(c=>c.put(event.request,copy));return res;}).catch(()=>caches.match(event.request).then(r=>r||caches.match('/app/index.html')).then(r=>r||caches.match('/app/offline.html'))));
    return;
  }
  event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(res=>{if(res && (res.ok||res.type==='opaque')){const copy=res.clone();caches.open(CACHE).then(c=>c.put(event.request,copy));}return res;})));
});
self.addEventListener('message',event=>{if(event.data==='SKIP_WAITING') self.skipWaiting();});
