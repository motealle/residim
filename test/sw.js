const CACHE='residim-design-lab-v1';
const BASE=new URL('./',self.location.href);
const files=['./','index.html','offline.html','manifest.webmanifest','assets/v1/base.css','assets/v1/lab.js','assets/v1/icon.svg','assets/v1/icon-192.png','assets/v1/icon-512.png','1/index.html','2/index.html','3/index.html'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(files.map(p=>new URL(p,BASE).href)))));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('residim-design-lab-')&&k!==CACHE).map(k=>caches.delete(k))))));
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(event.request.method!=='GET'||url.origin!==BASE.origin||!url.pathname.startsWith(BASE.pathname))return;
 event.respondWith(fetch(event.request).then(response=>{
 if(response.ok){const clone=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(event.request,clone)));}return response;
 }).catch(async()=>{
 const cache=await caches.open(CACHE);const hit=await cache.match(event.request);if(hit)return hit;
 if(event.request.mode==='navigate'){const normalized=url.pathname.endsWith('/')?url.href+'index.html':url.href;return await cache.match(normalized)||await cache.match(new URL('offline.html',BASE).href);}
 return Response.error();
 }));
});
