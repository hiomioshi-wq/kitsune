// Strip reader: one comic at a time, big and clear, with its hover text, for webcomics and xkcd.
// A source gives a count and get(i); index 0 is the newest, and "Next" goes back in time.
import { $, esc, icon, toast } from "./util.js";
import { kvGet, kvSet, logStat } from "./store.js";

const R = {};

export async function getFavs() { return (await kvGet("comicFavs", [])) || []; }
async function isFav(key) { return (await getFavs()).some((f) => f.key === key); }
async function toggleFav(it) {
  const favs = await getFavs(), i = favs.findIndex((f) => f.key === it.key);
  if (i >= 0) favs.splice(i, 1); else favs.unshift({ key: it.key, title: it.title, img: it.img, alt: it.alt || "", date: it.date || "", link: it.link || "", source: it.source || "", saved: Date.now() });
  await kvSet("comicFavs", favs.slice(0, 500));
  return i < 0;
}
export async function seenSet(src) { return new Set(((await kvGet("comicSeen", {})) || {})[src] || []); }
export async function markSeen(src, keys) {
  const all = { ...((await kvGet("comicSeen", {})) || {}) }, cur = new Set(all[src] || []);
  let fresh = 0;
  for (const k of keys) if (!cur.has(k)) { cur.add(k); fresh++; }
  all[src] = [...cur].slice(-800);
  await kvSet("comicSeen", all);
  return fresh;
}

/**
 * Open the reader. `source` is { id, name, count, get(i) → item, random?() → index, credit? }.
 * Items are { key, title, img, alt, date, link, html? }.
 */
export async function openStrips(source, start = 0) {
  closeStrips();
  Object.assign(R, { src: source, i: start, item: null, altOpen: false, touch: null });
  const el = document.createElement("div");
  el.id = "strips"; el.className = "strips";
  el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true"); el.setAttribute("aria-label", source.name);
  el.innerHTML = `
    <header class="st-bar">
      <button class="icon-btn" type="button" data-s="close" aria-label="Close (Esc)" title="Close (Esc)">${icon("x")}</button>
      <div class="st-h"><strong>${esc(source.name)}</strong><span id="st-pos"></span></div>
      ${source.random ? `<button class="icon-btn" type="button" data-s="random" aria-label="Random comic (R)" title="Random (R)">${icon("compass")}</button>` : ""}
      <button class="icon-btn" type="button" data-s="fav" id="st-fav" aria-label="Save to favourites (F)" title="Save to favourites (F)" aria-pressed="false">${icon("star")}</button>
      <a class="icon-btn" id="st-link" target="_blank" rel="noopener" aria-label="Open on the artist's site" title="Open on the artist's site">${icon("link")}</a>
    </header>
    <main class="st-stage" id="st-stage" tabindex="-1">
      <figure class="st-fig" id="st-fig"></figure>
    </main>
    <nav class="st-nav">
      <button class="st-btn" type="button" data-s="newer" aria-label="Newer (←)">${icon("back")}<span>Newer</span></button>
      <span class="st-credit">${esc(source.credit || "")}</span>
      <button class="st-btn" type="button" data-s="older" aria-label="Older (→)"><span>Older</span>${icon("next")}</button>
    </nav>`;
  document.body.appendChild(el);
  document.documentElement.classList.add("strips-open");
  R.el = el;
  el.addEventListener("click", onClick);
  addEventListener("keydown", onKey, true);
  const st = $("#st-stage", el);
  st.addEventListener("touchstart", (e) => { if (e.touches.length === 1) R.touch = { x: e.touches[0].clientX, y: e.touches[0].clientY, t: Date.now() }; }, { passive: true });
  st.addEventListener("touchend", (e) => {
    const t = R.touch; R.touch = null; if (!t) return;
    const dx = e.changedTouches[0].clientX - t.x, dy = e.changedTouches[0].clientY - t.y;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.6 && Date.now() - t.t < 600) go(dx < 0 ? 1 : -1);
  }, { passive: true });
  await show(start);
  st.focus({ preventScroll: true });
}

export function closeStrips() {
  if (!R.el) return;
  removeEventListener("keydown", onKey, true);
  R.el.remove(); R.el = null;
  document.documentElement.classList.remove("strips-open");
  R.src?.onClose?.();
}

let seq = 0;
async function show(i) {
  const src = R.src, el = R.el; if (!el) return;
  i = Math.max(0, Math.min(src.count - 1, i));
  R.i = i; R.altOpen = false;
  const my = ++seq, fig = $("#st-fig", el);
  fig.classList.add("loading");
  $("#st-pos", el).textContent = src.label ? src.label(i) : `${i + 1} of ${src.count}`;
  $("[data-s=newer]", el).disabled = i <= 0;
  $("[data-s=older]", el).disabled = i >= src.count - 1;
  let it;
  try { it = await src.get(i); } catch (e) { if (my === seq) { fig.classList.remove("loading"); fig.innerHTML = `<p class="st-msg">${esc(e.message || "This comic didn't load.")}</p>`; } return; }
  if (my !== seq || !R.el) return;
  R.item = it;
  fig.classList.remove("loading");
  fig.innerHTML = `
    <div class="st-imgwrap">${it.img ? `<img id="st-img" src="${esc(it.img)}" alt="${esc(it.title)}${it.alt ? ". " + esc(it.alt) : ""}" referrerpolicy="no-referrer" decoding="async">` : `<p class="st-msg">${esc(it.alt || "This one has no picture.")}</p>`}</div>
    <figcaption>
      <h2>${esc(it.title || "")}</h2>
      <p class="st-meta">${[it.by, it.date ? fmtDate(it.date) : "", it.num ? `#${it.num}` : ""].filter(Boolean).map(esc).join(" · ")}</p>
      ${it.alt && it.img ? `<button class="st-alt" type="button" data-s="alt" aria-expanded="false"><span>${icon("highlight")}Hover text</span><em>${esc(it.alt)}</em></button>` : ""}
    </figcaption>`;
  const img = $("#st-img", fig);
  if (img) {
    img.onerror = () => { img.replaceWith(Object.assign(document.createElement("p"), { className: "st-msg", textContent: "The picture didn't load from the artist's site. Open it there instead." })); };
    img.onclick = () => toggleAlt();
  }
  const link = $("#st-link", el); if (it.link) { link.href = it.link; link.hidden = false; } else link.hidden = true;
  $("#st-fav", el).setAttribute("aria-pressed", String(await isFav(it.key)));
  $("#st-stage", el).scrollTop = 0;
  // count it as read, and warm up the next one
  if (src.id) { const fresh = await markSeen(src.id, [it.key]); if (fresh) logStat({ pages: 1 }); }
  src.onView?.(it, i);
  if (i + 1 < src.count) src.get(i + 1).then((n) => { if (n?.img) { const p = new Image(); p.referrerPolicy = "no-referrer"; p.src = n.img; } }).catch(() => {});
}
const fmtDate = (d) => { const t = new Date(d); return isNaN(t) ? d : t.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }); };

function toggleAlt() {
  const b = $(".st-alt", R.el); if (!b) return;
  R.altOpen = !R.altOpen; b.classList.toggle("open", R.altOpen); b.setAttribute("aria-expanded", String(R.altOpen));
}
const go = (d) => { const n = R.i + d; if (n >= 0 && n < R.src.count) show(n); };

async function onClick(e) {
  const b = e.target.closest("[data-s]"); if (!b) return;
  const a = b.dataset.s;
  if (a === "close") closeStrips();
  if (a === "older") go(1);
  if (a === "newer") go(-1);
  if (a === "alt") toggleAlt();
  if (a === "random" && R.src.random) show(R.src.random());
  if (a === "fav" && R.item) { const on = await toggleFav({ ...R.item, source: R.src.name }); b.setAttribute("aria-pressed", String(on)); toast(on ? "Saved to your favourite strips." : "Removed from favourites."); }
}
function onKey(e) {
  if (!R.el || e.metaKey || e.ctrlKey || e.altKey) return;
  const k = e.key;
  if (k === "Escape") { e.preventDefault(); e.stopPropagation(); closeStrips(); }
  else if (k === "ArrowRight" || k === "j" || k === "J") { e.preventDefault(); e.stopPropagation(); go(1); }
  else if (k === "ArrowLeft" || k === "k" || k === "K") { e.preventDefault(); e.stopPropagation(); go(-1); }
  else if ((k === "r" || k === "R") && R.src.random) { e.preventDefault(); e.stopPropagation(); show(R.src.random()); }
  else if (k === "f" || k === "F") { e.preventDefault(); e.stopPropagation(); $("#st-fav", R.el)?.click(); }
  else if (k === "h" || k === "H" || k === " ") { if ($(".st-alt", R.el)) { e.preventDefault(); e.stopPropagation(); toggleAlt(); } }
  else if (/^[1-9]$/.test(k)) e.stopPropagation(); // keep the app's page shortcuts from firing underneath
}
