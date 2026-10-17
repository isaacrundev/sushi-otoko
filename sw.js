// stale-while-revalidate：先回快取（秒開），同時背景抓新版。
//
// 這裡刻意不用 cache-first。價格資料（presets.js）會變，cache-first 會讓已經安裝的
// 使用者永遠拿到舊價位，而且要等使用者在線上重新載入兩次才會更新完畢。
// 離線時照樣從快取回應（餐廳訊號差是常態）。
const CACHE = 'sushi-otoko-v1'
const FILES = [
  './',
  './index.html',
  './app.js',
  './calc.js',
  './presets.js',
  './manifest.webmanifest',
  './icon-180.png',
  './icon-192.png',
  './icon-512.png',
]

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (e) => {
  const { request } = e
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return

  e.respondWith(
    (async () => {
      const cache = await caches.open(CACHE)
      const hit = await cache.match(request)
      const network = fetch(request).then((res) => {
        if (res && res.ok) cache.put(request, res.clone())
        return res
      })
      if (hit) return hit // 先給舊的，背景已經在更新
      try {
        return await network
      } catch {
        return new Response('離線中', { status: 503, headers: { 'content-type': 'text/plain' } })
      }
    })(),
  )
})
