// Embeds for the Kitsune browser: videos, music, maps and posts recognised from their links, shown as cards with
// real thumbnails, played with each service's privacy-friendly player, and poppable into a floating mini player
// that keeps going while you browse. Also: an image viewer, link previews and a media panel.
import { $, $$, esc, api, toast } from "./util.js";

const host = (u) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return ""; } };
const q = (u, k) => { try { return new URL(u).searchParams.get(k); } catch { return null; } };
const seconds = (t) => { if (!t) return 0; if (/^\d+$/.test(t)) return +t; const m = t.match(/(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/); return m ? (+m[1] || 0) * 3600 + (+m[2] || 0) * 60 + (+m[3] || 0) : 0; };

// Each service: its name, colour, kind, and how to turn any of its links into a player.
const P = [
  { id: "youtube", name: "YouTube", color: "#ff0033", kind: "video", re: /(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/|v\/)|youtu\.be\/)([\w-]{11})/,
    player: (m, u) => `https://www.youtube-nocookie.com/embed/${m[1]}?autoplay=1&rel=0&modestbranding=1${seconds(q(u, "t") || q(u, "start")) ? `&start=${seconds(q(u, "t") || q(u, "start"))}` : ""}`,
    thumb: (m) => `https://i.ytimg.com/vi/${m[1]}/hqdefault.jpg`, page: (m) => `https://www.youtube.com/watch?v=${m[1]}`, ratio: "16/9" },
  { id: "vimeo", name: "Vimeo", color: "#1ab7ea", kind: "video", re: /vimeo\.com\/(?:video\/|channels\/[\w-]+\/|groups\/[\w-]+\/videos\/)?(\d{5,})/,
    player: (m) => `https://player.vimeo.com/video/${m[1]}?dnt=1&autoplay=1`, page: (m) => `https://vimeo.com/${m[1]}`, ratio: "16/9" },
  { id: "dailymotion", name: "Dailymotion", color: "#0a72e8", kind: "video", re: /(?:dailymotion\.com\/(?:video|embed\/video)\/|dai\.ly\/)([a-z0-9]+)/i,
    player: (m) => `https://www.dailymotion.com/embed/video/${m[1]}?autoplay=1`, thumb: (m) => `https://www.dailymotion.com/thumbnail/video/${m[1]}`, page: (m) => `https://www.dailymotion.com/video/${m[1]}`, ratio: "16/9" },
  { id: "twitch", name: "Twitch", color: "#9146ff", kind: "video", re: /twitch\.tv\/(?:videos\/(\d+)|(?!directory|videos)([\w]+)(?:\/?$|\?))/,
    player: (m) => `https://player.twitch.tv/?${m[1] ? `video=${m[1]}` : `channel=${m[2]}`}&parent=${location.hostname}&autoplay=true`, page: (m) => m[1] ? `https://www.twitch.tv/videos/${m[1]}` : `https://www.twitch.tv/${m[2]}`, ratio: "16/9" },
  { id: "peertube", name: "PeerTube", color: "#f1680d", kind: "video", re: /^https:\/\/([^/]+)\/(?:videos\/(?:watch|embed)\/([\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12})|w\/([1-9A-HJ-NP-Za-km-z]{22}))(?:$|[?#])/,
    player: (m) => `https://${m[1]}/videos/embed/${m[2] || m[3]}?autoplay=1&warningTitle=0`, page: (m) => `https://${m[1]}/w/${m[2] || m[3]}`, ratio: "16/9" },
  { id: "archive", name: "Internet Archive", color: "#666", kind: "video", re: /archive\.org\/(?:details|embed)\/([^/?#]+)/,
    player: (m) => `https://archive.org/embed/${m[1]}`, thumb: (m) => `https://archive.org/services/img/${m[1]}`, page: (m) => `https://archive.org/details/${m[1]}`, ratio: "16/9" },
  { id: "commons", name: "Wikimedia Commons", color: "#069", kind: "video", re: /commons\.wikimedia\.org\/wiki\/(File:[^?#]+\.(?:webm|ogv|ogg|mp4|oga|opus|mp3|wav))/i,
    player: (m) => `https://commons.wikimedia.org/wiki/${m[1]}?embedplayer=yes`, page: (m) => `https://commons.wikimedia.org/wiki/${m[1]}`, ratio: "16/9" },
  { id: "soundcloud", name: "SoundCloud", color: "#ff5500", kind: "audio", re: /(?:w\.soundcloud\.com\/player\/\?url=([^&]+)|soundcloud\.com\/((?!player)[\w-]+\/(?:sets\/)?[\w-]+))/,
    player: (m) => `https://w.soundcloud.com/player/?url=${m[1] || encodeURIComponent("https://soundcloud.com/" + m[2])}&auto_play=true&visual=true&show_comments=false`, page: (m) => { if (!m[1]) return `https://soundcloud.com/${m[2]}`; try { return decodeURIComponent(m[1]); } catch { return m[1]; } }, ratio: "16/9" },
  { id: "spotify", name: "Spotify", color: "#1db954", kind: "audio", re: /open\.spotify\.com\/(?:embed\/)?(?:intl-\w+\/)?(track|album|playlist|episode|show|artist)\/([A-Za-z0-9]+)/,
    player: (m) => `https://open.spotify.com/embed/${m[1]}/${m[2]}`, page: (m) => `https://open.spotify.com/${m[1]}/${m[2]}`, ratio: "auto", height: (m) => (m[1] === "track" || m[1] === "episode" ? 152 : 380) },
  { id: "bandcamp", name: "Bandcamp", color: "#1da0c3", kind: "audio", re: /bandcamp\.com\/EmbeddedPlayer\/(.+)/,
    player: (m) => `https://bandcamp.com/EmbeddedPlayer/${m[1]}`, page: () => "", ratio: "auto", height: () => 120 },
  { id: "x", name: "X", color: "#111", kind: "post", re: /(?:twitter|x)\.com\/(\w+)\/status(?:es)?\/(\d+)/,
    player: (m) => `https://platform.twitter.com/embed/Tweet.html?id=${m[2]}&dnt=true`, page: (m) => `https://x.com/${m[1]}/status/${m[2]}`, ratio: "auto", height: () => 520 },
  { id: "bluesky", name: "Bluesky", color: "#0085ff", kind: "post", re: /bsky\.app\/profile\/([^/]+)\/post\/(\w+)/, player: () => "", page: (m) => `https://bsky.app/profile/${m[1]}/post/${m[2]}`, ratio: "auto", height: () => 480 },
  { id: "mastodon", name: "Mastodon", color: "#6364ff", kind: "post", re: /^https:\/\/([^/]+)\/@([\w.]+)\/(\d{6,})(?:\/?$|[?#])/, player: (m) => `https://${m[1]}/@${m[2]}/${m[3]}/embed`, page: (m) => `https://${m[1]}/@${m[2]}/${m[3]}`, ratio: "auto", height: () => 420 },
  { id: "instagram", name: "Instagram", color: "#e1306c", kind: "post", re: /instagram\.com\/(?:[\w.]+\/)?(p|reel|tv)\/([\w-]+)/, player: (m) => `https://www.instagram.com/${m[1]}/${m[2]}/embed`, page: (m) => `https://www.instagram.com/${m[1]}/${m[2]}/`, ratio: "auto", height: () => 640 },
  { id: "tiktok", name: "TikTok", color: "#111", kind: "video", re: /tiktok\.com\/(?:@[\w.]+\/video|embed(?:\/v2)?|player\/v1)\/(\d+)/, player: (m) => `https://www.tiktok.com/player/v1/${m[1]}?autoplay=1`, page: (m) => `https://www.tiktok.com/embed/v2/${m[1]}`, ratio: "9/16" },
  { id: "codepen", name: "CodePen", color: "#111", kind: "code", re: /codepen\.io\/([\w-]+)\/(?:pen|embed|full|details)\/(\w+)/, player: (m) => `https://codepen.io/${m[1]}/embed/${m[2]}?default-tab=result`, page: (m) => `https://codepen.io/${m[1]}/pen/${m[2]}`, ratio: "4/3" },
  { id: "osm", name: "OpenStreetMap", color: "#7ebc6f", kind: "map", re: /openstreetmap\.org\/export\/embed\.html\?(.+)/, player: (m) => `https://www.openstreetmap.org/export/embed.html?${m[1]}`, page: () => "", ratio: "4/3" },
  { id: "gmaps", name: "Google Maps", color: "#34a853", kind: "map", re: /google\.[\w.]+\/maps\/embed(.*)/, player: (m, u) => u, page: () => "", ratio: "4/3" },
];
const KIND_LABEL = { video: "Video", audio: "Audio", post: "Post", map: "Map", code: "Code", other: "Embed" };

/** Recognise a link or an embed address. */
export function classify(url) {
  if (!url || !/^https?:/i.test(url)) return null;
  for (const p of P) {
    const m = url.match(p.re);
    if (m) return { provider: p.id, name: p.name, color: p.color, kind: p.kind, player: p.player(m, url), page: p.page(m) || url, thumb: p.thumb?.(m) || "", ratio: p.ratio, height: p.height?.(m) || 0, src: url };
  }
  return null;
}
export const generic = (url) => ({ provider: "web", name: host(url), color: "#888", kind: "other", player: url, page: url, thumb: "", ratio: "16/9", height: 0, src: url, generic: true });

const PLAY = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" fill="currentColor"/></svg>`;
const POP = `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="14" rx="2"/><rect x="12" y="11" width="7" height="6" rx="1" fill="currentColor"/></svg>`;
const OUT = `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>`;

/** A card for an embed. It loads nothing from the service until you press play. */
export function card(doc, info, { text = "", title = "" } = {}) {
  const el = doc.createElement("div");
  el.className = `kbx kbx-${info.kind}`;
  el.dataset.kbx = JSON.stringify(info);
  el.style.setProperty("--pc", info.color);
  el.innerHTML = `
    <div class="kbx-media" style="${info.ratio !== "auto" ? `aspect-ratio:${info.ratio}` : ""}">${info.thumb ? `<img class="kbx-thumb" src="${esc(info.thumb)}" alt="" loading="lazy" referrerpolicy="no-referrer">` : ""}
      ${info.kind === "post" ? "" : `<button type="button" class="kbx-play" data-kbx-play aria-label="Play ${esc(title || KIND_LABEL[info.kind])}">${PLAY}</button>`}</div>
    <div class="kbx-info"><span class="kbx-badge">${esc(info.name)}<i>${KIND_LABEL[info.kind]}</i></span>
      <strong class="kbx-title">${esc(title || (info.generic ? `Embedded from ${info.name}` : ""))}</strong>
      <span class="kbx-author"></span>${text ? `<p class="kbx-text">${esc(text)}</p>` : `<p class="kbx-text" hidden></p>`}
      <span class="kbx-acts">${info.kind === "post" ? `<button type="button" data-kbx-play>${PLAY}Show the post</button>` : `<button type="button" data-kbx-play>${PLAY}Play here</button>`}
        <button type="button" data-kbx-pop>${POP}Mini player</button>${info.page ? `<a href="${esc(info.page)}" data-kbx-out target="_blank" rel="noopener noreferrer">${OUT}${esc(info.name)}</a>` : ""}</span></div>`;
  return el;
}

/** Fill cards in with titles, thumbnails and post text, as they scroll into view. */
export function hydrate(root) {
  const cards = $$(".kbx:not([data-done])", root);
  if (!cards.length) return;
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { io.unobserve(e.target); fill(e.target); } }), { rootMargin: "600px" });
  cards.forEach((c) => { c.dataset.done = "1"; io.observe(c); });
}
const previews = new Map();
export function preview(url) {
  if (!previews.has(url)) previews.set(url, api("browse/preview?url=" + encodeURIComponent(url)).catch(() => null));
  return previews.get(url);
}
async function fill(c) {
  const info = JSON.parse(c.dataset.kbx);
  if (info.generic && !info.page) return;
  const d = await preview(info.page || info.src); if (!d) return;
  if (d.embed && (!info.player || info.provider === "bluesky")) { info.player = d.embed; c.dataset.kbx = JSON.stringify(info); }
  const t = $(".kbx-title", c); if (d.title && !t.textContent.trim().replace(/^Embedded from.*/, "")) t.textContent = d.title;
  if (d.author) $(".kbx-author", c).textContent = d.author;
  if (d.text && info.kind !== "video") { const p = $(".kbx-text", c); p.textContent = d.text; p.hidden = false; }
  if (d.thumb && !$(".kbx-thumb", c)) { const im = c.ownerDocument.createElement("img"); im.className = "kbx-thumb"; im.src = d.thumb; im.alt = ""; im.loading = "lazy"; im.referrerPolicy = "no-referrer"; $(".kbx-media", c).prepend(im); }
  if (d.provider && info.generic) $(".kbx-badge", c).firstChild.textContent = d.provider;
  if (info.kind === "post" && !d.thumb) c.classList.add("kbx-textonly");
}

/** Play a card where it is. */
export function playInline(c) {
  const info = JSON.parse(c.dataset.kbx);
  if (!info.player) { window.open(info.page, "_blank", "noopener"); return; }
  const media = $(".kbx-media", c);
  media.innerHTML = "";
  media.style.aspectRatio = info.ratio !== "auto" ? info.ratio : "";
  if (info.height) media.style.height = info.height + "px";
  media.append(frame(c.ownerDocument, info));
  c.classList.add("kbx-on");
}
function frame(doc, info) {
  const f = doc.createElement("iframe");
  f.src = info.player;
  f.title = `${info.name} ${KIND_LABEL[info.kind].toLowerCase()}`;
  f.allow = "autoplay; encrypted-media; fullscreen; picture-in-picture; clipboard-write";
  f.allowFullscreen = true;
  f.referrerPolicy = "strict-origin-when-cross-origin";
  if (info.generic) f.setAttribute("sandbox", "allow-scripts allow-same-origin allow-presentation allow-popups");
  return f;
}

// ---------- the mini player: floats over everything and keeps playing while you browse ----------
const MINI = { el: null };
export function popOut(info, title = "") {
  closeMini();
  const el = document.createElement("div");
  el.id = "kb-mini"; el.className = "kb-mini";
  el.setAttribute("role", "dialog"); el.setAttribute("aria-label", `Mini player: ${title || info.name}`);
  el.style.setProperty("--pc", info.color);
  el.dataset.size = localStorage.getItem("kitsune.miniSize") || "m";
  el.innerHTML = `<div class="kb-mini-bar"><span class="kb-mini-dot"></span><strong>${esc(title || info.name)}</strong>
      <button type="button" data-mini="size" aria-label="Change size" title="Change size">⤢</button>
      ${info.page ? `<a href="${esc(info.page)}" target="_blank" rel="noopener" aria-label="Open on ${esc(info.name)}" title="Open on ${esc(info.name)}">${OUT}</a>` : ""}
      <button type="button" data-mini="close" aria-label="Close the mini player" title="Close">×</button></div>
    <div class="kb-mini-body" style="${info.kind === "audio" && info.height ? `aspect-ratio:auto;height:${info.height}px` : info.ratio === "9/16" ? "aspect-ratio:9/16" : ""}"></div>`;
  $(".kb-mini-body", el).append(frame(document, info));
  document.body.append(el);
  MINI.el = el;
  if (!title && info.page) preview(info.page).then((d) => { if (d?.title && MINI.el === el) $(".kb-mini-bar strong", el).textContent = d.title; });
  const saved = JSON.parse(localStorage.getItem("kitsune.miniPos") || "null");
  place(saved || { right: 18, bottom: 18 });
  // drag by the bar; let go near an edge and it settles into the nearest corner
  const bar = $(".kb-mini-bar", el);
  bar.addEventListener("pointerdown", (e) => {
    if (e.target.closest("button, a")) return;
    const r = el.getBoundingClientRect(), dx = e.clientX - r.left, dy = e.clientY - r.top;
    el.classList.add("dragging"); bar.setPointerCapture(e.pointerId);
    const move = (ev) => { el.style.left = Math.max(0, Math.min(innerWidth - r.width, ev.clientX - dx)) + "px"; el.style.top = Math.max(0, Math.min(innerHeight - r.height, ev.clientY - dy)) + "px"; el.style.right = el.style.bottom = "auto"; };
    const up = () => {
      bar.removeEventListener("pointermove", move); el.classList.remove("dragging");
      const b = el.getBoundingClientRect(), right = b.left + b.width / 2 > innerWidth / 2, bottom = b.top + b.height / 2 > innerHeight / 2;
      const pos = { [right ? "right" : "left"]: 18, [bottom ? "bottom" : "top"]: bottom ? 18 : 76 };
      place(pos); try { localStorage.setItem("kitsune.miniPos", JSON.stringify(pos)); } catch {}
    };
    bar.addEventListener("pointermove", move); bar.addEventListener("pointerup", up, { once: true });
  });
  el.addEventListener("click", (e) => {
    const b = e.target.closest("[data-mini]"); if (!b) return;
    if (b.dataset.mini === "close") closeMini();
    if (b.dataset.mini === "size") { const s = { s: "m", m: "l", l: "s" }[el.dataset.size]; el.dataset.size = s; try { localStorage.setItem("kitsune.miniSize", s); } catch {} }
  });
}
function place(pos) { const el = MINI.el; if (!el) return; Object.assign(el.style, { left: "auto", right: "auto", top: "auto", bottom: "auto" }); for (const [k, v] of Object.entries(pos)) el.style[k] = v + "px"; }
export function closeMini() { MINI.el?.remove(); MINI.el = null; }

// ---------- image viewer ----------
export function lightbox(images, start = 0) {
  if (!images.length) return;
  $("#kb-lb")?.remove();
  let i = start, z = 1, px = 0, py = 0;
  const el = document.createElement("div");
  el.id = "kb-lb"; el.className = "kb-lb"; el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true"); el.setAttribute("aria-label", "Image viewer");
  el.innerHTML = `<div class="kb-lb-stage"><img alt="" referrerpolicy="no-referrer"></div>
    <div class="kb-lb-bar"><span class="kb-lb-n"></span><span class="kb-lb-cap"></span>
      <button type="button" data-lb="zoom" aria-label="Zoom">＋</button><a data-lb="find" target="_blank" rel="noopener" aria-label="Find this picture elsewhere (TinEye)" title="Find this picture elsewhere">⌕</a><a data-lb="open" target="_blank" rel="noopener" aria-label="Open the full image">${OUT}</a><button type="button" data-lb="close" aria-label="Close">×</button></div>
    ${images.length > 1 ? `<button type="button" class="kb-lb-prev" data-lb="prev" aria-label="Previous image">‹</button><button type="button" class="kb-lb-next" data-lb="next" aria-label="Next image">›</button>` : ""}`;
  document.body.append(el);
  const img = $("img", el), apply = () => (img.style.transform = `translate(${px}px, ${py}px) scale(${z})`);
  img.onerror = () => { const im = images[i]; if (im.fallback && img.src !== im.fallback) img.src = im.fallback; };
  const show = () => { const im = images[i]; { let o = im.full || im.src || ""; const mm = o.match(/\/api\/browse\/img\?url=([^&]+)/); if (mm) { try { o = decodeURIComponent(mm[1]); } catch { o = mm[1]; } } const f = $("[data-lb=find]", el); if (f) { f.hidden = !/^https?:/.test(o); f.href = "https://tineye.com/search?url=" + encodeURIComponent(o); } } z = 1; px = py = 0; apply(); img.src = im.src; img.alt = im.alt || ""; $(".kb-lb-n", el).textContent = images.length > 1 ? `${i + 1} / ${images.length}` : ""; $(".kb-lb-cap", el).textContent = im.alt || ""; $("[data-lb=open]", el).href = im.full || im.src; };
  const close = () => { el.remove(); removeEventListener("keydown", key, true); };
  const key = (e) => { if (e.key === "Escape") { e.stopPropagation(); close(); } else if (e.key === "ArrowRight") { e.stopPropagation(); i = (i + 1) % images.length; show(); } else if (e.key === "ArrowLeft") { e.stopPropagation(); i = (i - 1 + images.length) % images.length; show(); } };
  addEventListener("keydown", key, true);
  el.addEventListener("click", (e) => {
    const b = e.target.closest("[data-lb]")?.dataset.lb;
    if (b === "close" || e.target === el || e.target.classList.contains("kb-lb-stage")) return close();
    if (b === "next") { i = (i + 1) % images.length; show(); }
    if (b === "prev") { i = (i - 1 + images.length) % images.length; show(); }
    if (b === "zoom") { z = z >= 3 ? 1 : z + 1; if (z === 1) px = py = 0; apply(); }
  });
  img.addEventListener("dblclick", () => { z = z > 1 ? 1 : 2.5; px = py = 0; apply(); });
  $(".kb-lb-stage", el).addEventListener("wheel", (e) => { e.preventDefault(); z = Math.max(1, Math.min(6, z * Math.exp(-e.deltaY * 0.0025))); if (z === 1) px = py = 0; apply(); }, { passive: false });
  let drag = null;
  img.addEventListener("pointerdown", (e) => { if (z <= 1) return; drag = { x: e.clientX - px, y: e.clientY - py }; img.setPointerCapture(e.pointerId); });
  img.addEventListener("pointermove", (e) => { if (drag) { px = e.clientX - drag.x; py = e.clientY - drag.y; apply(); } });
  img.addEventListener("pointerup", () => (drag = null));
  show();
  $("[data-lb=close]", el).focus();
}

// ---------- link previews: hover a link for a moment to see where it goes ----------
let tipT = 0, tipFor = null;
export function attachLinkPreviews(root) {
  if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  root.addEventListener("pointerover", (e) => {
    const a = e.composedPath().find((n) => n.tagName === "A");
    if (!a || a === tipFor) return;
    const href = a.href || a.getAttribute("href") || "";
    clearTimeout(tipT); hideTip();
    if (!/^https?:/i.test(href) || a.closest?.(".kbx") || a.querySelector("img")) return;
    tipFor = a;
    tipT = setTimeout(async () => {
      const d = await preview(href); if (tipFor !== a || !d || (!d.title && !d.text)) return;
      const r = a.getBoundingClientRect(), tip = document.createElement("div");
      tip.id = "kb-tip"; tip.className = "kb-tip";
      tip.innerHTML = `${d.thumb ? `<img src="${esc(d.thumb)}" alt="" referrerpolicy="no-referrer" onerror="this.remove()">` : ""}<div><small>${esc(d.provider || host(href))}</small><strong>${esc(d.title || host(href))}</strong>${d.text ? `<p>${esc(d.text.slice(0, 180))}${d.text.length > 180 ? "…" : ""}</p>` : ""}</div>`;
      document.body.append(tip);
      const tw = Math.min(360, innerWidth - 24), below = r.bottom + 10 + 220 < innerHeight;
      Object.assign(tip.style, { width: tw + "px", left: Math.max(12, Math.min(innerWidth - tw - 12, r.left)) + "px", top: (below ? r.bottom + 8 : Math.max(8, r.top - 8 - tip.offsetHeight)) + "px" });
    }, 650);
  });
  root.addEventListener("pointerout", (e) => { const a = e.composedPath().find((n) => n.tagName === "A"); if (a && a === tipFor && !a.contains(e.relatedTarget)) { clearTimeout(tipT); tipFor = null; hideTip(); } });
  root.addEventListener("pointerdown", () => { clearTimeout(tipT); tipFor = null; hideTip(); });
}
export function hideTip() { $("#kb-tip")?.remove(); }

// ---------- styles that live inside the page's shadow root ----------
export const EMBED_CSS = `
.kbx { all: initial; display: grid; grid-template-columns: minmax(0, 1fr); margin: 14px 0; border-radius: 14px; overflow: hidden; border: 1px solid #0002; background: #fff; color: #111; font: 14px/1.45 -apple-system, "Segoe UI", system-ui, sans-serif; box-shadow: 0 6px 22px #0001; max-width: 720px; }
.kbx * { box-sizing: border-box; }
.kbx-media { position: relative; background: #111 linear-gradient(135deg, color-mix(in srgb, var(--pc) 70%, #000), #111); display: grid; place-items: center; overflow: hidden; }
.kbx-post .kbx-media, .kbx-textonly .kbx-media { display: none; }
.kbx-on .kbx-media { display: block; }
.kbx-thumb { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.kbx-media iframe { display: block; width: 100%; height: 100%; min-height: 152px; border: 0; background: #000; }
.kbx-play { position: relative; z-index: 1; width: 64px; height: 64px; border-radius: 50%; border: 0; display: grid; place-items: center; background: color-mix(in srgb, var(--pc) 92%, #000); color: #fff; cursor: pointer; box-shadow: 0 8px 26px #0006; transition: transform .15s; }
.kbx-play:hover { transform: scale(1.08); }
.kbx-play svg { width: 30px; height: 30px; margin-left: 3px; }
.kbx-info { display: grid; gap: 4px; padding: 12px 14px 14px; }
.kbx-badge { display: inline-flex; gap: 8px; align-items: center; font: 700 11px/1 -apple-system, system-ui, sans-serif; letter-spacing: .06em; text-transform: uppercase; color: var(--pc); }
.kbx-badge i { font-style: normal; color: #888; font-weight: 600; }
.kbx-title { font: 650 16px/1.3 -apple-system, system-ui, sans-serif; }
.kbx-title:empty { display: none; }
.kbx-author { color: #666; font-size: 13px; } .kbx-author:empty { display: none; }
.kbx-text { margin: 4px 0 0; white-space: pre-wrap; font-size: 15px; line-height: 1.5; color: #222; }
.kbx-post .kbx-text { border-left: 3px solid var(--pc); padding-left: 12px; }
.kbx-acts { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 8px; }
.kbx-acts button, .kbx-acts a { display: inline-flex; gap: 6px; align-items: center; padding: 7px 12px; border-radius: 99px; border: 1px solid #0002; background: #f4f4f6; color: #111; font: 600 13px -apple-system, system-ui, sans-serif; text-decoration: none; cursor: pointer; }
.kbx-acts button:hover, .kbx-acts a:hover { background: #eaeaee; }
.kbx-acts svg { width: 15px; height: 15px; }
.kbx-on .kbx-acts [data-kbx-play] { display: none; }
img.kb-zoomable { cursor: zoom-in; }
::highlight(kb-clip-yellow) { background: #ffe066; color: inherit; } ::highlight(kb-clip-green) { background: #a5e3a1; color: inherit; } ::highlight(kb-clip-blue) { background: #a8cdf5; color: inherit; } ::highlight(kb-clip-pink) { background: #f6b2cf; color: inherit; }
`;
void toast;

// Reader mode shows cards in the app's own page, so their styles go there too, once.
if (typeof document !== "undefined" && !document.getElementById("kbx-css")) { const st = document.createElement("style"); st.id = "kbx-css"; st.textContent = EMBED_CSS; document.head.append(st); }
