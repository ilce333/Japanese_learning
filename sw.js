/* 假名道場 离线缓存
   只有把文件放到网站上时才会生效；本地双击打开会自动忽略。 */
const CACHE = "kana-dojo-v6.5.2";

/* 核心：装好就必须能离线跑 */
const CORE = ["./", "./index.html"];

/* 附加：手写模型与词典包。装 SW 时顺带缓存，
   这样第一次联网访问过之后，手写识别和词典获取也能离线用。
   任何一个取不到都不该让整个安装失败，所以逐个容错。 */
const EXTRA = [
  "./dict/hwmodel.json",
  "./dict/catalog.json",
  "./dict/travel.json",
  "./dict/food.json",
  "./dict/medical.json",
  "./dict/business.json",
  "./dict/onomatope.json"
];

self.addEventListener("install", e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(async c => {
      await c.addAll(CORE).catch(() => {});
      await Promise.all(EXTRA.map(u => c.add(u).catch(() => {})));
    })
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(
      ks.filter(k => k !== CACHE).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

/* 缓存优先：装过一次之后完全离线可用 */
self.addEventListener("fetch", e => {
  if(e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  if(url.origin !== location.origin) return;          /* 外部请求不拦 */
  e.respondWith(
    caches.match(e.request).then(hit =>
      hit || fetch(e.request).then(res => {
        if(res && res.status === 200){
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
        }
        return res;
      }).catch(() => caches.match("./index.html"))
    )
  );
});
