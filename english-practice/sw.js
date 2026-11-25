/* offline cache for 國小英文練習本, version v0.2_202611171503 */
const CACHE='ek-v0.2_202611171503';
const CORE=['./','index.html','manifest.webmanifest','apple-touch-icon.png','icon-192.png','icon-512.png','audio-g3.json','audio-g6.json'];
self.addEventListener('install',e=>{ e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())); });
self.addEventListener('activate',e=>{ e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
function fromNet(req){ return fetch(req).then(r=>{ if(r && (r.ok||r.type==='opaque')){ const c=r.clone(); caches.open(CACHE).then(x=>x.put(req,c)); } return r; }); }
self.addEventListener('fetch',e=>{
  const req=e.request; if(req.method!=='GET') return;
  const url=new URL(req.url), same=url.origin===location.origin;
  const isPage=req.mode==='navigate' || (same && /\/(index\.html)?$/.test(url.pathname));
  if(isPage){
    /* page: try the network first so updates arrive, fall back to the saved copy after 4 s or when offline */
    e.respondWith(new Promise(res=>{
      let done=false; const fallback=()=>caches.match(req,{ignoreSearch:true}).then(r=>r||caches.match('index.html')).then(r=>{ if(!done&&r){ done=true; res(r); } });
      const t=setTimeout(fallback,4000);
      fromNet(req).then(r=>{ clearTimeout(t); if(!done){ done=true; res(r); } }).catch(()=>{ clearTimeout(t); fallback().then(()=>{ if(!done){ done=true; res(Response.error()); } }); });
    }));
    return;
  }
  if(same || /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)){
    e.respondWith(caches.match(req).then(r=>r||fromNet(req)));
  }
});
