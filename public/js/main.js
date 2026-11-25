// Kitsune app entry: navigation, routing, global shortcuts.
import { navVisible, navPins } from "./plus/shell.js";
import { $, $$, esc, icon, toast, topModal, applyTints } from "./util.js";
import { loadSettings, loadLibrary, lib, onLibraryChange } from "./store.js";
import { openPalette } from "./palette.js";
import { updateNowPill } from "./nowpill.js";
import { restorePlayer } from "./readers/audio.js";
import { currentProfile, getProfiles, isKids, switchProfile } from "./profiles.js";

const NAV_ALL = [
  ["home", "Home", "home"],
  ["library", "Library", "shelf"],
  ["discover", "Discover", "compass"],
  ["comics", "Comics", "comics"],
  ["web", "Browser", "browser"],
  ["feeds", "Feeds", "list"],
  ["books", "Books", "book"],
  ["wiki", "Wikis", "globe"],
  ["vn", "Visual novels", "book"],
  ["story", "Story games", "spark"],
  ["xmas", "Winterfest", "spark"],
  ["world", "Kitsune World", "atlas"],
  ["shrine", "Fox Shrine", "tails"],
  ["lore", "Originals wiki", "list"],
  ["find", "Where to read", "search"],
  ["link", "Link & import", "link"],
  ["create", "Create", "edit"],
  ["ai", "Ask AI", "spark"],
  ["notebook", "Notebook", "highlight"],
  ["stats", "Stats", "chart"],
  ["tools", "Library tools", "sliders"],
  ["den", "Den", "tails"],
  ["atlas", "Atlas", "atlas"],
  ["plus", "Kitsune Plus", "spark"],
  ["settings", "Settings", "gear"],
];
const TABBAR_ALL = ["home", "library", "discover", "books", "link"];

const routes = {
  home: () => import("./views/home.js"),
  library: () => import("./views/library.js"),
  item: () => import("./views/library.js"),
  series: () => import("./views/library.js"),
  discover: () => import("./views/discover.js"),
  comics: () => import("./views/comics.js"),
  web: () => import("./views/web.js"),
  feeds: () => import("./views/feeds.js"),
  manga: () => import("./views/discover.js"),
  books: () => import("./views/books.js"),
  gutenberg: () => import("./views/books.js"),
  scan: () => import("./views/books.js"),
  loc: () => import("./views/books.js"),
  audiobook: () => import("./views/books.js"),
  link: () => import("./views/link.js"),
  stats: () => import("./views/stats.js"),
  tools: () => import("./views/tools.js"),
  story: () => import("./views/story.js"),
  vn: () => import("./views/vn.js"),
  shrine: () => import("./views/shrine.js"),
  plus: () => import("./views/plus.js"),
  world: () => import("./views/world.js"),
  town: () => import("./views/town.js"),
  xmas: () => import("./views/xmas.js"),
  den: () => import("./views/den.js"),
  atlas: () => import("./views/atlas.js"),
  notebook: () => import("./views/notebook.js"),
  list: () => import("./views/list.js"),
  studio: () => import("./views/studio.js"),
  sources: () => import("./views/sources.js"),
  find: () => import("./views/find.js"),
  accounts: () => import("./views/accounts.js"),
  create: () => import("./views/create.js"),
  ai: () => import("./views/ai.js"),
  panels: () => import("./views/panels.js"),
  write: () => import("./views/write.js"),
  wiki: () => import("./views/wiki.js"),
  lore: () => import("./views/lore.js"),
  search: () => import("./views/search.js"),
  own: () => import("./views/own.js"),
  settings: () => import("./views/settings.js"),
  sanctuary: () => import("./views/sanctuary.js"),
  constellations: () => import("./views/constellations.js"),
  mythic: () => import("./xmas/mythic.js"),
};

const KIDS_HIDDEN = new Set(["discover", "manga", "ai", "feeds"]);
function profileChip() {
  const p = currentProfile(), init = esc([...p.name][0]?.toUpperCase() || "?");
  $("#profile-btn").innerHTML = `<span class="av" style="background:${esc(p.color)}">${init}</span><span>${esc(p.name)}<small>${p.kids ? "Kids profile" : getProfiles().length > 1 ? "Switch profile" : "Add a profile"}</small></span>`;
  const dot = $("#profile-btn-m"); dot.textContent = [...p.name][0]?.toUpperCase() || "?"; dot.style.background = p.color;
}
async function profileMenu(anchor) {
  const { menu } = await import("./util.js");
  const cur = currentProfile();
  menu(anchor, [
    ...getProfiles().filter((p) => p.id !== cur.id).map((p) => ({ label: `Switch to ${p.name}${p.kids ? " (kids)" : ""}`, icon: "next", run: () => leaveProfile(p.id) })),
    ...(cur.kids ? [] : [{ label: "Add a profile", icon: "plus", run: () => { location.hash = "settings/profiles"; } }, { label: "Manage profiles", icon: "gear", run: () => { location.hash = "settings/profiles"; } }]),
  ]);
}
// Leaving a kids profile can ask for the parent PIN.
async function leaveProfile(id) {
  const cur = currentProfile();
  if (!cur.kids || !cur.pin) return switchProfile(id);
  const { modal } = await import("./util.js");
  const m = modal({ title: "Parent PIN", body: `<form class="form" id="pin-f"><p class="muted" style="margin:0">Enter the PIN to leave ${esc(cur.name)}'s profile.</p><input class="field" id="pin-v" inputmode="numeric" maxlength="8" autocomplete="off" autofocus style="font:600 22px var(--f-mono);letter-spacing:.3em;text-align:center"><p class="status" id="pin-s"></p></form>`,
    actions: `<button class="btn" type="button" data-close>Cancel</button><button class="btn btn-accent" form="pin-f">Continue</button>` });
  $("#pin-f", m.root).onsubmit = (e) => { e.preventDefault(); if ($("#pin-v", m.root).value === cur.pin) switchProfile(id); else { $("#pin-s", m.root).className = "status err"; $("#pin-s", m.root).textContent = "That PIN isn't right."; } };
}

function renderNav() {
  const counts = { library: lib.items.length };
  profileChip();
  const shown = navVisible(), pins = navPins(), base = (isKids() ? NAV_ALL.filter(([r]) => !KIDS_HIDDEN.has(r)) : NAV_ALL);
  const NAV = [...base.filter(([r]) => pins.includes(r) && shown.has(r)), ...base.filter(([r]) => !pins.includes(r) && shown.has(r))];
  const TABBAR = isKids() ? ["home", "library", "books", "notebook", "stats"] : TABBAR_ALL;
  $("#nav").innerHTML = NAV.map(([r, label, ic], i) =>
    (r === "link" ? `<div class="nav-label">Yours</div>` : "") +
    `<a href="#${r}" data-route="${r}">${icon(ic)}<span>${label}</span>${counts[r] ? `<span class="count">${counts[r]}</span>` : ""}</a>`).join("");
  $("#tabbar").innerHTML = TABBAR.filter((r) => NAV.some((n) => n[0] === r)).map((r) => { const [, label, ic] = NAV.find((n) => n[0] === r); return `<a href="#${r}" data-route="${r}">${icon(ic)}<span>${label.split(" ")[0]}</span></a>`; }).join("");
  markNav();
  const f = lib.features;
  $("#side-note").textContent = f.host === "local" ? "Running on this computer · library folder on" : "Your files stay on this device";
}

export const refreshNav = () => renderNav();
const SECTION_OF = { own: "link", panels: "create", write: "create", studio: "settings", sources: "link", accounts: "link", item: "library", series: "library", manga: "discover", gutenberg: "books", scan: "books", loc: "books", audiobook: "books" };
function markNav() {
  const r = location.hash.slice(1).split("/")[0] || "home";
  const sec = SECTION_OF[r] || r;
  $$("[data-route]").forEach((a) => (a.dataset.route === sec ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current")));
}

let cleanup = null, renderSeq = 0;
export function setCrumbs(parts) {
  $("#crumbs").innerHTML = parts.map((p, i) => (i < parts.length - 1 ? `<a href="#${p[1]}">${esc(p[0])}</a>${icon("next")}` : `<strong>${esc(p[0])}</strong>`)).join("");
  document.title = parts.length ? `${parts.at(-1)[0]} · Kitsune` : "Kitsune";
}

async function route() {
  const seq = ++renderSeq;
  const safeDec = (s) => { try { return decodeURIComponent(s); } catch { return s; } };
  const [name, ...params] = (location.hash.slice(1) || "home").split("/").map(safeDec);
  const loader = routes[name] || routes.home;
  markNav();
  try { cleanup?.(); } catch {}
  cleanup = null;
  const view = $("#view");
  if (isKids() && (KIDS_HIDDEN.has(name) || (name === "library" && params[0] === "tracking") || (name === "settings" && params[0] === "profiles"))) {
    view.innerHTML = `<div class="empty"><svg class="empty-fox"><use href="#fox"/></svg><p><strong>Not in this profile.</strong> ${esc(currentProfile().name)}'s profile has books, classic manga and their own shelf.</p><a class="btn" href="#books">Find a book</a></div>`;
    return;
  }
  try {
    const mod = await loader();
    if (seq !== renderSeq) return;
    const draw = async () => {
      view.innerHTML = "";
      window.scrollTo(0, 0);
      cleanup = (await mod.render(view, routes[name] ? name : "home", params)) || null;
    };
    // Cross-fade between pages where the browser supports it. Pages that wait on the network
    // still render in full, but the animation never holds the screen for more than a moment.
    if (document.startViewTransition && !document.hidden && !(document.documentElement.dataset.motion === "reduce" || matchMedia("(prefers-reduced-motion: reduce)").matches) && seq > 1) {
      let rendering = null;
      const vt = document.startViewTransition(() => { rendering = draw(); return Promise.race([rendering, new Promise((r) => setTimeout(r, 250))]); });
      vt.finished.catch(() => {}); vt.ready.catch(() => {});
      await vt.updateCallbackDone.catch(() => {});
      if (rendering) await rendering; else await draw();
    } else {
      await draw();
    }
  } catch (e) {
    console.error(e);
    view.innerHTML = `<div class="empty"><svg class="empty-fox"><use href="#fox"/></svg><p><strong>This page didn't load.</strong> ${esc(e.message)}</p><a class="btn" href="#home">Go home</a></div>`;
  }
  if (seq === renderSeq) updateNowPill().catch(() => {});
  if (seq === renderSeq) import("./xmas/fx.js").then((x) => x.decorate(name)).catch(() => {});
  // Celebrate a new tail on the fox, a moment after the page settles.
  if (seq === renderSeq) setTimeout(() => import("./den.js").then((d) => d.checkLevelUp()).catch(() => {}), 1200);
}
export const go = (hash) => { if (location.hash === "#" + hash) route(); else location.hash = hash; };
export const refresh = () => route();

window.addEventListener("hashchange", route);
// Pages tint themselves from their covers; this also catches sections that render after the first paint.
new MutationObserver(() => applyTints($("#view"))).observe($("#view"), { childList: true, subtree: true });
$("#open-palette").addEventListener("click", () => openPalette());
$("#profile-btn").addEventListener("click", (e) => profileMenu(e.currentTarget));
$("#profile-btn-m").addEventListener("click", (e) => profileMenu(e.currentTarget));
$("#open-palette-m").addEventListener("click", () => openPalette());
$("#add-btn").addEventListener("click", async () => (await import("./views/link.js")).openImport());

document.addEventListener("keydown", (e) => {
  const typing = !!e.target.matches?.("input, textarea, select, [contenteditable]");
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); openPalette(); return; }
  if (e.key === "Escape") { const m = topModal(); if (m) { e.preventDefault(); m.close(); } return; }
  if (typing || !$("#reader").hidden || !$("#book").hidden || topModal()) return;
  if (e.key === "/") { e.preventDefault(); openPalette(); }
  if (e.key === "?") { e.preventDefault(); showShortcuts(); }
  const g = { 1: "home", 2: "library", 3: "discover", 4: "books", 5: "link", 6: "den", 7: "atlas", 8: "comics", 9: "web" }[e.key];
  if (g && !e.metaKey && !e.ctrlKey && !e.altKey) go(g);
});

// Files or a link shared from another app (phone Share menu), parked by the service worker.
async function pickUpShared() {
  history.replaceState(null, "", "#home");
  try {
    const cache = await caches.open("kitsune-share");
    const keys = await cache.keys();
    const files = [];
    let link = null;
    for (const k of keys) {
      const res = await cache.match(k);
      if (k.url.endsWith("/shared/link")) link = await res.text();
      else files.push(new File([await res.blob()], decodeURIComponent(res.headers.get("X-Name") || "shared"), { type: res.headers.get("Content-Type") || "" }));
      await cache.delete(k);
    }
    const { openImport } = await import("./views/link.js");
    if (files.length) openImport(files);
    else if (link) openImport(null, /archive\.org/.test(link) ? { mode: "archive", prefill: link } : /manifest|iiif/i.test(link) ? { mode: "iiif", prefill: link } : { mode: "links", prefill: link });
  } catch { toast("The shared item couldn't be read. Try adding it from Link & import."); }
}

export function showShortcuts() {
  const groups = [
    ["Anywhere", [["⌘K  /", "Search everything"], ["1 – 5", "Home, Library, Discover, Books, Link"], ["6 / 7", "Den, Atlas"], ["?", "This list"], ["K", "Play or pause the audiobook"]]],
    ["Manga reader", [["← →", "Turn the page"], ["Space", "Next page"], ["Home / End", "First / last page"], ["T", "All pages"], ["B", "Bookmark"], ["Z  + −", "Zoom"], ["M", "Magnifier"], ["N", "Night colours"], ["G", "Guided view"], ["O", "Page text"], ["D", "Save page"], ["C", "Clip a panel"], ["A", "Auto-turn"], ["J", "Go to page"], ["K", "Note on this page"], ["L", "Notes and bookmarks"], ["I", "Your pace"], ["R", "Random page you have read"], ["W", "Cycle fit"], ["E", "Rotate page"], ["V", "All volumes"], ["U", "Goal for this sitting"], ["H", "Auto-hide controls"], ["Y", "Save spread"], ["X", "Contact sheet"], ["P", "Pages you lingered on"], ["Q", "Cast notebook"], ["/", "Quick menu"], ["[ ]", "Previous / next volume"], ["F", "Full screen"], ["S", "Settings"], ["?", "Help"], ["Esc", "Close"]]],
    ["Book reader", [["G", "Go to a percentage"], ["Q", "Quote card from selection"], ["W", "About this book"], ["K", "Quick menu"], ["V", "Chapter map"], ["H", "Highlights sheet"], ["C", "Cast notebook"], ["← →", "Turn the page (page layout)"], ["T", "Contents"], ["X", "X-Ray: people and places"], ["/", "Search in the book"], ["B", "Bookmark"], ["R", "Read aloud (each word lights up as it's read)"], ["S", "Sleep timer"], ["M", "Soundscape on / off"], ["A", "Auto-scroll"], ["[  ]", "Auto-scroll slower / faster"], ["L", "Reading ruler"], ["D", "Define, translate or look up"], ["+ −", "Text size"], ["Esc", "Close"]]],
    ["Flashcards", [["Space", "Show the meaning"], ["1", "Didn't know"], ["2", "Knew it"]]],
  ];
  import("./util.js").then(({ modal }) => modal({ title: "Keyboard shortcuts", wide: true, body: `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:24px">${groups.map(([t, rows]) =>
    `<div><h3 class="eyebrow" style="margin-bottom:10px">${t}</h3><div style="display:grid;gap:8px">${rows.map(([k, d]) => `<div style="display:flex;justify-content:space-between;gap:12px;font-size:14px"><span>${d}</span><span>${k.split("  ").map((x) => `<kbd>${x}</kbd>`).join(" ")}</span></div>`).join("")}</div></div>`).join("")}</div>` }));
}

// Files dropped anywhere on the page go to the importer.
let dragDepth = 0;
document.addEventListener("dragenter", (e) => { if (e.dataTransfer?.types?.includes("Files")) { dragDepth++; document.body.classList.add("dragging"); } });
document.addEventListener("dragleave", () => { if (--dragDepth <= 0) { dragDepth = 0; document.body.classList.remove("dragging"); } });
document.addEventListener("dragover", (e) => { if (e.dataTransfer?.types?.includes("Files")) e.preventDefault(); });
document.addEventListener("drop", async (e) => {
  dragDepth = 0; document.body.classList.remove("dragging");
  if (e.target.closest(".drop") || !e.dataTransfer?.files?.length) return;
  e.preventDefault();
  (await import("./views/link.js")).openImport([...e.dataTransfer.files]);
});

async function start() {
  const P = await import("./privacy.js");
  P.startLock();
  await loadSettings();
  P.syncIncognitoUi();
  await loadLibrary();
  renderNav();
  import("./feedbadge.js").then((m) => m.start()).catch(() => {});
  onLibraryChange(() => { renderNav(); import("./feedbadge.js").then((m) => m.paint()).catch(() => {}); });
  onLibraryChange(() => updateNowPill().catch(() => {}));
  await route();
  restorePlayer();
  $("#skip-link")?.addEventListener("click", () => $("#view").focus());
  import("./sync.js").then((s) => s.startAutoSync()).catch(() => {});
  import("./reminders.js").then((r) => r.startReminders()).catch(() => {});
  import("./xmas/fx.js").then((x) => x.startXmas()).catch(() => {});
  import("./plus/shell.js").then((x) => x.startShell()).catch(() => {});
  const stickers = () => import("./plus/make.js").then((m) => m.paintStickers()).catch(() => {}); addEventListener("hashchange", () => { setTimeout(stickers, 450); setTimeout(stickers, 1300); }); setTimeout(stickers, 700); setTimeout(stickers, 1500);
  if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("/sw.js").catch(() => {});
  // Files opened with the installed app (desktop "Open with Kitsune").
  if ("launchQueue" in window) window.launchQueue.setConsumer(async (params) => {
    if (!params.files?.length) return;
    const files = await Promise.all(params.files.map((h) => h.getFile()));
    (await import("./views/link.js")).openImport(files);
  });
  if (location.hash === "#shared") pickUpShared();
  else if (!location.hash.startsWith("#list/")) import("./welcome.js").then((w) => w.maybeWelcome());
  addEventListener("offline", () => toast("You're offline. Your library and saved volumes still work."));
  addEventListener("online", () => toast("Back online."));
  if (navigator.storage?.persist) navigator.storage.persisted().then((p) => { if (!p && lib.items.length > 3) navigator.storage.persist().catch(() => {}); });
}
start().catch((e) => { console.error(e); toast("Kitsune couldn't open its storage. " + e.message); });

// background daemons you set up in the browser
import("./daemons.js").then((d) => d.start()).catch(() => {});
