/* BEK 學員訊息 PWA - 更新與離線快取 */
// 2026-11-25：加入更新接手機制（v3）。目的是讓「手機上的舊圖標」自己換到新版，
// 不必每次叫學員移除圖標、重新加入主畫面。
//   1. HTML 導覽請求一律繞過 HTTP 快取（no-store），直接跟伺服器要最新頁面。
//   2. 頁面註冊時 reg.update() 主動抓新版 sw.js；新版 install 後 skipWaiting + clients.claim，
//      下一次開 App 就換成新頁面，由頁面端 controllerchange 自動 reload 一次。
//   3. 圖片等靜態資源維持先重驗、失敗回快取，離線仍可開。
const CACHE = 'bek-msg-v3';
const CORE = ['./', './index.html', './coach.html', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) =>
    Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))
  ).then(() => self.clients.claim()));
});

function _isDoc(req, url) {
  if (req.mode === 'navigate') return true;
  const p = url.pathname;
  return p.endsWith('/') || /\.html?$/.test(p);
}

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  // 只處理同源 GET（PWA 自身檔案）；API（script.google.com 跨域）與非 GET 一律走網路
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;

  if (_isDoc(e.request, url)) {
    // 頁面：完全不吃 HTTP 快取（GitHub Pages 給 max-age=600，會造成舊頁）
    e.respondWith(
      fetch(e.request, { cache: 'no-store' })
        .then((r) => { const c = r.clone(); caches.open(CACHE).then((x) => x.put(e.request, c)); return r; })
        .catch(() => caches.match(e.request).then((m) => m || caches.match('./')))
    );
    return;
  }

  e.respondWith(
    fetch(e.request, { cache: 'no-cache' })
      .then((r) => { const c = r.clone(); caches.open(CACHE).then((x) => x.put(e.request, c)); return r; })
      .catch(() => caches.match(e.request))
  );
});
