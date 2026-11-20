/* BEK 學員訊息 PWA - 離線快取 */
// 2026-11-20：快取版本升級，舊快取於 activate 清除；同源請求改 no-cache 強制重驗，
// 避免 GitHub Pages max-age=600 期間 service worker 回舊版 HTML
const CACHE = 'bek-msg-v2';
const CORE = ['./', './index.html', './coach.html', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) =>
    Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
  ).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  // 只處理同源 GET（PWA 自身檔案）；API（script.google.com 跨域）與非 GET 一律走網路
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;
  e.respondWith(
    // no-cache：每次向伺服器重驗（ETag 未變回 304），更新後立刻取到新版
    fetch(e.request, { cache: 'no-cache' })
      .then((r) => { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); return r; })
      .catch(() => caches.match(e.request).then((m) => m || caches.match('./')))
  );
});
