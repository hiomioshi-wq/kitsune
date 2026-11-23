// Kitsune Browser, v124:
//  - how old a page is: articles show when they were published (and updated), so old news doesn't pass as new
//  - find related pages, and check a claim with fact-checkers
//  - touch-friendly links and buttons, and reduced motion (no animations or transitions)
//  - battery saver: when the battery is low, background loading and heavy extras pause by themselves
import { $, esc, toast } from "./util.js";

const on = (k) => localStorage.getItem(k) === "1";
const flip = (k) => { const v = !on(k); try { v ? localStorage.setItem(k, "1") : localStorage.removeItem(k); } catch {} return v; };

// ---------- publication date ----------
export function pageDates(html) {
  if (!html) return {};
  const d = new DOMParser().parseFromString(html.slice(0, 400000), "text/html"), meta = (sel) => d.querySelector(sel)?.getAttribute("content") || "";
  let pub = meta('meta[property="article:published_time"]') || meta('meta[name="date"]') || meta('meta[itemprop="datePublished"]') || meta('meta[name="pubdate"]') || meta('meta[name="publish-date"]') || meta('meta[name="DC.date.issued"]') || meta('meta[name="citation_publication_date"]');
  let upd = meta('meta[property="article:modified_time"]') || meta('meta[property="og:updated_time"]') || meta('meta[itemprop="dateModified"]');
  if (!pub || !upd) for (const s of d.querySelectorAll('script[type="application/ld+json"]')) {
    try { const walk = (o) => { if (!o || typeof o !== "object") return; if (Array.isArray(o)) return o.forEach(walk); if (o.datePublished && !pub) pub = o.datePublished; if (o.dateModified && !upd) upd = o.dateModified; if (o["@graph"]) walk(o["@graph"]); }; walk(JSON.parse(s.textContent)); } catch {}
  }
  if (!pub) pub = d.querySelector("article time[datetime], time[pubdate], time[itemprop=datePublished]")?.getAttribute("datetime") || "";
  const ok = (s) => { const t = Date.parse(s); return isNaN(t) || t > Date.now() + 864e5 || t < Date.parse("1990-01-01") ? null : t; };
  return { pub: ok(pub), upd: ok(upd) };
}
const ago = (t) => { const days = (Date.now() - t) / 864e5; if (days < 1) return "today"; if (days < 2) return "yesterday"; if (days < 45) return `${Math.round(days)} days ago`; if (days < 600) return `${Math.round(days / 30.4)} months ago`; const y = days / 365.25; return `${y < 10 ? y.toFixed(1).replace(/\.0$/, "") : Math.round(y)} years ago`; };
export function afterRender({ t, B }) {
  $("#kb-age", B.view)?.remove(); if (!t?.data?.html || on("kitsune.webNoAge")) return;
  const { pub, upd } = pageDates(t.data.html); if (!pub) return;
  const old = Date.now() - pub > 2 * 365.25 * 864e5;
  const el = document.createElement("button"); el.id = "kb-age"; el.type = "button"; el.title = "When this page was published. Click to hide.";
  el.textContent = `Published ${new Date(pub).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })} · ${ago(pub)}${upd && upd - pub > 7 * 864e5 ? ` · updated ${ago(upd)}` : ""}`;
  el.style.cssText = `position:absolute;left:50%;transform:translateX(-50%);top:10px;z-index:19;font:600 11.5px system-ui,sans-serif;padding:4px 10px;border-radius:99px;border:1px solid ${old ? "rgba(229,83,75,.6)" : "var(--line,#3a3e66)"};background:${old ? "rgba(229,83,75,.16)" : "color-mix(in srgb, var(--surface,#222) 88%, transparent)"};color:inherit;cursor:pointer;max-width:calc(100% - 140px);white-space:nowrap;overflow:hidden;text-overflow:ellipsis`;
  el.onclick = () => el.remove();
  ($("#kb-body", B.view) || B.view).append(el);
  setTimeout(() => { if (el.isConnected && !old) el.style.opacity = ".55"; }, 8000);
}

// ---------- related pages, fact checks ----------
const STOP = new Set("the a an of and to in on for with by at from is are was were be this that it as or how why what who your you our we their his her its about into over".split(" "));
function keywords(t) { const title = (t.title || "").replace(/\s[-|·–—:]\s.*$/, ""); return title.split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w.toLowerCase())).slice(0, 8).join(" "); }

// ---------- comfort ----------
const COMFORT_CSS = { touch: `a, button, [role=button], input, select, summary { min-height: 40px; } a { padding-block: 4px; } nav a, li > a { display: inline-block; }`, motion: `*, *::before, *::after { animation: none !important; transition: none !important; scroll-behavior: auto !important; } video[autoplay] { display: none !important; }` };
export function applyComfort(root) {
  if (!root?.querySelector) return; root.querySelector("#kbcomfort-style")?.remove();
  const css = (on("kitsune.webTouch") ? COMFORT_CSS.touch : "") + (on("kitsune.webNoMotion") || matchMedia("(prefers-reduced-motion: reduce)").matches ? COMFORT_CSS.motion : ""); if (!css) return;
  const st = document.createElement("style"); st.id = "kbcomfort-style"; st.textContent = css; (root.querySelector(".kb-html") || root).append(st);
}

// ---------- battery saver ----------
let battWired = false;
export async function batterySaver() {
  if (battWired || !navigator.getBattery || on("kitsune.webNoBatterySaver")) return; battWired = true;
  try {
    const b = await navigator.getBattery(); let saving = false;
    const check = () => {
      const low = !b.charging && b.level <= 0.2;
      if (low && !saving) { saving = true; try { if (localStorage.getItem("kitsune.webNoPrefetch") !== "1") { localStorage.setItem("kitsune.webNoPrefetch", "1"); localStorage.setItem("kitsune.batterySet", "1"); } } catch {} toast("Battery is low, so Kitsune stopped loading links ahead. It turns back on when you charge.", { ms: 6000 }); }
      if (!low && saving) { saving = false; try { if (localStorage.getItem("kitsune.batterySet") === "1") { localStorage.removeItem("kitsune.webNoPrefetch"); localStorage.removeItem("kitsune.batterySet"); } } catch {} }
    };
    b.addEventListener("levelchange", check); b.addEventListener("chargingchange", check); check();
  } catch {}
}

export function items({ T, go, root }) {
  batterySaver();
  return [
    { label: "Find pages related to this one", icon: "search", run: () => { const k = keywords(T()); if (!k) return toast("This page has no title to search with."); go(k, { newTab: true }); } },
    { label: "Check this with fact-checkers", icon: "search", run: () => { const k = keywords(T()); if (!k) return toast("Open a page first."); go(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(k + " site:snopes.com OR site:politifact.com OR site:fullfact.org OR site:apnews.com/ap-fact-check OR site:reuters.com/fact-check")}`, { newTab: true }); } },
    { label: on("kitsune.webNoAge") ? "Show when pages were published: off (turn on)" : "Show when pages were published: on (turn off)", icon: "clock", run: () => { const off = flip("kitsune.webNoAge"); toast(off ? "Publication dates hidden." : "Articles show when they were published."); } },
    { label: on("kitsune.webTouch") ? "Touch-friendly links and buttons: on (turn off)" : "Touch-friendly links and buttons", icon: "sliders", run: () => { const v = flip("kitsune.webTouch"); applyComfort(root()); toast(v ? "Links and buttons are bigger and easier to tap." : "Links and buttons back to normal."); } },
    { label: on("kitsune.webNoMotion") ? "Reduce motion: on (turn off)" : "Reduce motion (stop animations)", icon: "sliders", run: () => { const v = flip("kitsune.webNoMotion"); applyComfort(root()); toast(v ? "Animations and transitions are off, and autoplaying videos are hidden." : "Motion back to normal."); } },
    { label: on("kitsune.webNoBatterySaver") ? "Battery saver: off (turn on)" : "Battery saver: on (turn off)", icon: "sliders", run: () => { const off = flip("kitsune.webNoBatterySaver"); toast(off ? "Battery saver off." : "When the battery gets low, Kitsune stops loading links ahead until you charge."); } },
  ];
}
