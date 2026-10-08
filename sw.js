// 離線快取：有網路就抓最新版並更新快取，沒網路才用快取
const CACHE = 'bk-v4';
const FILES = ['./', 'index.html', 'manifest.json', 'icon-180.png', 'icon-192.png', 'icon-512.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES.map(f => new Request(f, {cache: 'reload'})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  // 同網站的檔案每次都向伺服器確認有沒有新版（GitHub Pages 預設會讓瀏覽器暫存 10 分鐘）
  const same = new URL(e.request.url).origin === location.origin;
  e.respondWith((same ? fetch(e.request.url, {cache: 'no-cache'}) : fetch(e.request)).then(r => {
    // 帶參數的網址（版本檢查、API）不存快取，避免快取越堆越多
    if (r.ok && !new URL(e.request.url).search) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); }
    return r;
  }).catch(() => caches.match(e.request, {ignoreSearch: true})));
});
