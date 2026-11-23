// Kitsune offline support. The app shell is cached on install; pages and
// API answers you've already opened keep working without a connection.
const VERSION = "kitsune-v66";
const SHELL = [
  "/", "/index.html", "/css/app.css", "/css/premium.css", "/icon.svg", "/manifest.webmanifest",
  "/js/main.js", "/js/util.js", "/js/store.js", "/js/palette.js", "/js/epub.js", "/js/importers.js", "/js/gutendex.js", "/js/lookup.js", "/js/focus.js", "/js/wikisource.js", "/js/profiles.js", "/js/welcome.js", "/js/themes.js", "/js/views/studio.js", "/js/views/sources.js", "/js/services.js", "/js/views/find.js", "/js/views/accounts.js", "/js/views/create.js", "/js/views/panels.js", "/js/views/wiki.js", "/js/views/search.js", "/js/views/own.js", "/js/originals.js",
  ...Array.from({ length: 9 }, (_, i) => `/originals/kitsu-delivers-1/${String(i).padStart(3, "0")}.svg`),
  "/originals/the-lantern-courier.txt", "/originals/the-library-under-the-lake.txt", "/originals/nine-umbrellas.txt", "/originals/page-zero.txt", "/originals/the-color-thief-of-oz.txt", "/originals/madison-of-oz.txt", "/originals/the-cephalotus-of-oz.txt", "/originals/the-hiccup-of-oz.txt", "/originals/covers/the-hiccup-of-oz.svg", "/originals/covers/the-cephalotus-of-oz.svg", "/originals/covers/madison-of-oz.svg", "/originals/covers/the-color-thief-of-oz.svg",
  "/originals/covers/the-lantern-courier.svg", "/originals/covers/the-library-under-the-lake.svg", "/originals/covers/nine-umbrellas.svg", "/originals/covers/page-zero.svg", "/js/mediawiki.js",
  "/js/views/common.js", "/js/views/home.js", "/js/views/library.js", "/js/views/discover.js", "/js/views/books.js",
  "/js/views/link.js", "/js/views/stats.js", "/js/views/settings.js", "/js/views/notebook.js", "/js/views/list.js",
  "/js/readers/manga.js", "/js/readers/book.js", "/js/ambience.js", "/js/nowpill.js", "/js/views/coverflow.js", "/js/wrapped.js", "/js/den.js", "/js/views/den.js", "/js/views/atlas.js", "/js/sync.js", "/js/trackers.js", "/js/privacy.js", "/js/fulltext.js", "/js/reminders.js", "/js/xray.js", "/js/recall.js", "/js/readers/audio.js",
  "/sample/000.svg", "/sample/001.svg", "/sample/002.svg", "/sample/003.svg",
];
const LIBS = /^https:\/\/(cdnjs\.cloudflare\.com|fonts\.(googleapis|gstatic)\.com)\//;

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith("kitsune-") && k !== VERSION && k !== "kitsune-api" && k !== "kitsune-share").map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

async function networkFirst(req, cacheName, timeout = 0) {
  const cache = await caches.open(cacheName);
  try {
    const res = await (timeout ? Promise.race([fetch(req), new Promise((_, rej) => setTimeout(() => rej(new Error("slow")), timeout))]) : fetch(req));
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch (err) {
    const hit = await cache.match(req, { ignoreSearch: req.mode === "navigate" });
    if (hit) return hit;
    throw err;
  }
}
async function staleWhileRevalidate(req) {
  const cache = await caches.open(VERSION);
  const hit = await cache.match(req);
  const net = fetch(req).then((res) => { if (res.ok || res.type === "opaque") cache.put(req, res.clone()); return res; }).catch(() => hit);
  return hit || net;
}

// Files shared to Kitsune from a phone's Share menu: keep them briefly, then open the app.
async function receiveShare(req) {
  const form = await req.formData();
  const cache = await caches.open("kitsune-share");
  await Promise.all((await cache.keys()).map((k) => cache.delete(k)));
  let n = 0;
  for (const f of form.getAll("files")) {
    if (!(f instanceof File)) continue;
    await cache.put(`/shared/${n++}`, new Response(f, { headers: { "Content-Type": f.type || "application/octet-stream", "X-Name": encodeURIComponent(f.name) } }));
  }
  const link = form.get("url") || (String(form.get("text") || "").match(/https?:\/\/\S+/) || [])[0];
  if (link) await cache.put("/shared/link", new Response(String(link)));
  return Response.redirect("/#shared", 303);
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method === "POST" && new URL(req.url).pathname === "/share-target") { e.respondWith(receiveShare(req)); return; }
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (req.mode === "navigate") { e.respondWith(networkFirst(req, VERSION, 4000).catch(() => caches.match("/index.html"))); return; }
  if (url.origin === location.origin) {
    if (url.pathname.startsWith("/api/library") || url.pathname.startsWith("/api/proxy")) return;
    // Big binary routes are saved into your library instead of this cache.
    if (/\/api\/(ia\/[^/]+\/page|books\/\d+\/(epub|text))/.test(url.pathname)) return;
    if (url.pathname.startsWith("/api/")) { e.respondWith(networkFirst(req, "kitsune-api")); return; }
    e.respondWith(staleWhileRevalidate(req));
    return;
  }
  if (LIBS.test(req.url)) e.respondWith(staleWhileRevalidate(req));
});
