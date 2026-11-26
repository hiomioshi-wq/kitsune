// Kitsune offline support. The app shell is cached on install; pages and
// API answers you've already opened keep working without a connection.
const VERSION = "kitsune-v334";
const SHELL = ["/","/index.html","/css/app.css","/css/premium.css","/icon.svg","/manifest.webmanifest","/js/main.js","/js/views/bingo.js","/js/views/thanksgiving.js","/js/xmas/mythic.js","/js/views/constellations.js","/js/views/sanctuary.js","/js/world/nexuscore.js","/js/world/nexus.js","/js/world/cardcore.js","/js/world/duel.js","/js/world/races.js","/js/world/siegecore.js","/js/world/sieges.js","/js/world/seacore.js","/js/world/sailing.js","/js/world/baycore.js","/js/world/bay.js","/js/world/bayhotel.js","/js/world/baycare.js","/js/world/bayfun.js","/js/world/baywild.js","/js/world/baydaycare.js","/js/world/bayfish.js","/js/world/bayparade.js","/js/world/baygrove.js","/js/world/bayraffle.js","/js/world/baywish.js","/js/world/carnival.js","/js/world/arena.js","/js/world/calypso.js","/js/world/codex.js","/js/world/roulette.js","/js/world/tavern.js","/js/world/achievements.js","/js/world/keno.js","/js/world/auction.js","/js/world/jukebox.js","/js/world/exchange.js","/js/world/quiz.js","/js/world/tarot.js","/js/world/explore.js","/js/world/inventory.js","/js/world/museum.js","/js/world/petarena.js","/js/world/stargaze.js","/js/world/postoffice.js","/js/world/tidepool.js","/js/world/photoclub.js","/js/world/smithy.js","/js/world/bakery.js","/js/world/weatherbell.js","/js/world/raffle.js","/js/world/lounge.js","/js/world/wishing.js","/js/world/memory.js","/js/world/express.js","/js/world/arcade.js","/js/world/teahouse.js","/js/world/bulletin.js","/js/world/botanical.js","/js/world/fireworks.js","/js/world/luckyspin.js","/js/world/deep.js","/js/world/deepcore.js","/js/world/guild.js","/js/world/mindai.js","/js/world/mining.js","/js/world/powers.js","/js/world/realm-citadel.js","/js/world/realm-clockworks.js","/js/world/realm-deepbw.js","/js/world/realm-express.js","/js/world/realm-oz.js","/js/world/realm-undermarket.js","/js/world/sky.js","/js/world/skycore.js","/js/world/ozcity.js","/js/world/desert.js","/js/world/darwin.js","/js/webcompat2.js","/js/webadapters6.js","/js/webplus26.js","/js/webplus27.js","/js/views/plus.js","/js/plus/core.js","/js/plus/shell.js","/js/plus/audio.js","/js/plus/tools.js","/js/plus/social.js","/js/plus/make.js","/js/plus/worldplus.js","/js/plus/worldhook.js","/js/world/lifecore.js","/js/world/life.js","/js/world/lifeplay.js","/js/world/lifemap.js","/js/plus/festgames.js","/js/plus/extra2.js","/js/world/boards.js","/js/world/townplay.js","/js/world/square.js","/js/world/casecore.js","/js/world/agency.js","/js/world/hotelcore.js","/js/world/talecore.js","/js/world/chronicle.js","/js/world/events.js","/js/webplus.js","/js/webplus2.js","/js/webplus3.js","/js/webplus4.js","/js/webplus5.js","/js/webplus6.js","/js/webplus7.js","/js/webcompat.js","/js/webpages.js","/js/webadapters.js","/js/webadapters2.js","/js/webadapters3.js", "/js/webadapters4.js", "/js/webadapters5.js", "/js/syncgone.js", "/js/views/story.js", "/js/views/vn.js", "/js/views/shrine.js", "/js/views/world.js", "/js/views/xmas.js", "/js/views/town.js", "/js/town/core.js", "/js/xmas/data.js", "/js/xmas/core.js", "/js/xmas/art.js", "/js/xmas/fx.js", "/js/xmas/games.js", "/js/xmas/more.js", "/js/xmas/frostcore.js", "/js/xmas/frostbound.js", "/js/world/data.js", "/js/world/art.js", "/js/world/winter.js", "/js/world/gates.js", "/js/world/far.js", "/js/world/delve.js", "/js/world/trials.js", "/js/world/sidequests.js", "/js/world/farm.js", "/js/world/extras.js", "/js/world/realm.js", "/js/world/realms.js", "/js/world/realm-backrooms.js", "/js/world/boss.js", "/js/world/rpg.js", "/js/world/winterplay.js", "/js/world/bestie.js", "/js/vnparse.js", "/js/vnchoices.js", "/js/vnbranch.js", "/js/vnchar.js", "/js/sfx.js", "/js/views/settingtabs.js", "/js/vnart.js", "/js/views/tools.js", "/js/views/tools2.js", "/js/views/tools3.js", "/js/cast.js", "/js/cursors.js", "/js/decor.js", "/js/views/decorpicker.js", "/js/cursorfx.js", "/js/views/cursorpicker.js", "/js/views/homeplans.js", "/js/readers/bookplus.js", "/js/readers/bookui.js","/js/webrescue.js","/js/webcode.js","/js/webcode2.js","/js/webplus9.js","/js/webcache.js","/js/weblisten.js", "/js/webplus10.js", "/js/webplus11.js", "/js/webplus12.js", "/js/webplus13.js", "/js/webplus14.js", "/js/webplus15.js", "/js/webplus16.js", "/js/webplus17.js", "/js/webplus18.js", "/js/webplus19.js", "/js/webplus20.js", "/js/webplus21.js", "/js/webplus22.js", "/js/webplus23.js", "/js/webplus24.js", "/js/webplus25.js","/js/webprog.js","/js/pagetext.js","/js/webanswers.js","/js/webplus8.js","/js/feedlib.js","/js/feedbadge.js","/js/views/feeds.js","/js/util.js","/js/store.js","/js/palette.js","/js/epub.js","/js/importers.js","/js/gutendex.js","/js/lookup.js","/js/focus.js","/js/wikisource.js","/js/profiles.js","/js/welcome.js","/js/themes.js","/js/views/studio.js","/js/views/sources.js","/js/services.js","/js/views/find.js","/js/views/accounts.js","/js/views/create.js","/js/views/panels.js","/js/views/wiki.js","/js/views/search.js","/js/views/own.js","/js/originals.js","/js/mediawiki.js","/js/views/common.js","/js/views/home.js","/js/views/library.js","/js/views/discover.js","/js/views/books.js","/js/views/link.js","/js/views/stats.js","/js/views/settings.js","/js/views/notebook.js","/js/views/list.js","/js/readers/manga.js", "/js/readers/mangaplus.js", "/js/readers/mangaui.js","/js/readers/book.js","/js/ambience.js","/js/nowpill.js","/js/views/coverflow.js","/js/wrapped.js","/js/den.js","/js/views/den.js","/js/views/atlas.js","/js/sync.js","/js/trackers.js","/js/privacy.js","/js/fulltext.js","/js/reminders.js","/js/xray.js","/js/recall.js","/js/ink.js","/js/views/write.js","/js/ai.js","/js/views/ai.js","/js/views/lore.js","/js/lore-curated.js","/js/strips.js","/js/views/comics.js","/js/views/web.js","/js/embeds.js","/js/live-shim.js","/js/userscripts.js","/js/daemons.js","/js/readers/audio.js"];
// Books, covers and sample pages almost never change, so they live in a cache that survives updates and is only filled once.
const STATIC = ["/originals/kitsu-delivers-1/000.svg","/originals/kitsu-delivers-1/001.svg","/originals/kitsu-delivers-1/002.svg","/originals/kitsu-delivers-1/003.svg","/originals/kitsu-delivers-1/004.svg","/originals/kitsu-delivers-1/005.svg","/originals/kitsu-delivers-1/006.svg","/originals/kitsu-delivers-1/007.svg","/originals/kitsu-delivers-1/008.svg","/originals/the-lantern-courier.txt","/originals/the-library-under-the-lake.txt","/originals/nine-umbrellas.txt","/originals/page-zero.txt","/originals/the-night-market-bookbinder.txt","/originals/the-sleeper-train-to-tsukimi.txt","/originals/the-weather-cartographer.txt","/originals/covers/the-night-market-bookbinder.svg","/originals/covers/the-sleeper-train-to-tsukimi.svg","/originals/covers/the-weather-cartographer.svg","/originals/the-color-thief-of-oz.txt","/originals/madison-of-oz.txt","/originals/the-cephalotus-of-oz.txt","/originals/the-hiccup-of-oz.txt","/originals/covers/the-hiccup-of-oz.svg","/originals/covers/the-cephalotus-of-oz.svg","/originals/covers/madison-of-oz.svg","/originals/covers/the-color-thief-of-oz.svg","/originals/covers/the-lantern-courier.svg","/originals/covers/the-library-under-the-lake.svg","/originals/covers/nine-umbrellas.svg","/originals/covers/page-zero.svg","/originals/the-tea-shop-at-the-end-of-the-line.txt","/originals/covers/the-tea-shop-at-the-end-of-the-line.svg","/originals/moth-radio.txt","/originals/covers/moth-radio.svg","/originals/the-snow-postman.txt","/originals/covers/the-snow-postman.svg","/originals/the-clockmakers-apprentice.txt","/originals/covers/the-clockmakers-apprentice.svg","/originals/interactive/the-thirteenth-letter.json","/originals/lore-data.json","/originals/the-carnival-of-nine-lanterns.txt","/originals/covers/the-carnival-of-nine-lanterns.svg","/originals/the-melody-bank-of-oz.txt","/originals/covers/the-melody-bank-of-oz.svg","/originals/the-fourteenth-color-of-oz.txt","/originals/covers/the-fourteenth-color-of-oz.svg","/originals/the-royal-weather-of-oz.txt","/originals/covers/the-royal-weather-of-oz.svg","/originals/the-nine-windows-of-oz.txt","/originals/covers/the-nine-windows-of-oz.svg","/originals/the-courthouse-of-oz.txt","/originals/covers/the-courthouse-of-oz.svg","/originals/the-migrating-meadow-of-oz.txt","/originals/covers/the-migrating-meadow-of-oz.svg","/originals/the-moth-librarian.txt","/originals/covers/the-moth-librarian.svg","/originals/the-radio-that-broadcast-next-week.txt","/originals/covers/the-radio-that-broadcast-next-week.svg","/originals/the-ferrymans-ledger.txt","/originals/covers/the-ferrymans-ledger.svg","/sample/000.svg","/sample/001.svg","/sample/002.svg","/sample/003.svg"];
const STATIC_CACHE = "kitsune-static";
const LIBS = /^https:\/\/(cdnjs\.cloudflare\.com|fonts\.(googleapis|gstatic)\.com)\//;

self.addEventListener("install", (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(VERSION); await c.addAll(SHELL);
    self.skipWaiting();
    // the stable files are added in the background, and only the ones not already cached
    caches.open(STATIC_CACHE).then(async (sc) => { for (const n of ["the-tea-shop-at-the-end-of-the-line","moth-radio","the-snow-postman","the-clockmakers-apprentice"]) { const u = `/originals/covers/${n}.svg`; try { const r = await fetch(u, { cache: "reload" }); if (r.ok) await sc.put(u, r); } catch {} } for (const u of STATIC) { try { if (!(await sc.match(u))) await sc.add(u); } catch {} } });
  })());
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith("kitsune-") && k !== VERSION && k !== "kitsune-api" && k !== "kitsune-share" && k !== STATIC_CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
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
  const url = new URL(req.url);
  if (req.method === "POST" && url.pathname === "/share-target") {
    if (url.origin !== location.origin || req.headers.get("sec-fetch-site") === "cross-site") {
      e.respondWith(new Response("Forbidden", { status: 403 }));
      return;
    }
    e.respondWith(receiveShare(req));
    return;
  }
  if (req.method !== "GET") return;
  if (req.mode === "navigate") { e.respondWith(networkFirst(req, VERSION, 4000).catch(() => caches.match("/index.html"))); return; }
  if (url.origin === location.origin) {
    if (url.pathname.startsWith("/api/library") || url.pathname.startsWith("/api/proxy")) return;
    // Big binary routes are saved into your library instead of this cache.
    if (/\/api\/(ia\/[^/]+\/page|books\/\d+\/(epub|text))/.test(url.pathname)) return;
    if (url.pathname.startsWith("/api/")) { e.respondWith(networkFirst(req, "kitsune-api")); return; }
    if (/^\/(originals|sample)\//.test(url.pathname)) { e.respondWith(caches.match(req, { cacheName: STATIC_CACHE }).then((hit) => hit || staleWhileRevalidate(req))); return; }
    e.respondWith(staleWhileRevalidate(req));
    return;
  }
  if (LIBS.test(req.url)) e.respondWith(staleWhileRevalidate(req));
});
