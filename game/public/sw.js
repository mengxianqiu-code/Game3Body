/* Service Worker — 三体·星际逃亡
 * 离线缓存策略：
 *   - 安装时预缓存 app shell（index.html + manifest）
 *   - 运行时网络优先，失败回退到缓存
 *   - 资源版本号变更时（新的 index-*.js / index-*.css）自动失效旧缓存
 */

const VERSION = 'v1';
const STATIC_CACHE = `starsea-static-${VERSION}`;
const RUNTIME_CACHE = `starsea-runtime-${VERSION}`;

const PRECACHE_URLS = [
  '/',
  '/manifest.webmanifest',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((k) => k !== STATIC_CACHE && k !== RUNTIME_CACHE)
          .map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// 允许主页面通过 postMessage 跳过等待
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  // 只处理 GET
  if (request.method !== 'GET') return;
  // 跳过跨域
  const url = new URL(request.url);
  if (url.origin !== location.origin) return;

  // 资源（带 hash 的 /assets/*）走 cache-first
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(RUNTIME_CACHE).then((c) => c.put(request, copy));
          }
          return response;
        });
      })
    );
    return;
  }

  // 导航请求（HMR / 刷新）：网络优先，回退到 /index.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(RUNTIME_CACHE).then((c) => c.put('/', copy));
          }
          return response;
        })
        .catch(() => caches.match('/'))
    );
    return;
  }

  // 其它：网络优先，回退缓存
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.status === 200) {
          const copy = response.clone();
          caches.open(RUNTIME_CACHE).then((c) => c.put(request, copy));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});