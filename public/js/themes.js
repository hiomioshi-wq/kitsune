// Custom themes and cursors (presets include Twilight and Fern). Both compile to a small stylesheet that is cached in
// localStorage so index.html can apply it before the first paint (no flash).
import { ls } from "./util.js";
import { MORE_CURSORS } from "./cursors.js";

// ---------- colour helpers ----------
const hex = (h) => { h = h.replace("#", ""); if (h.length === 3) h = [...h].map((c) => c + c).join(""); return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)); };
const lum = (h) => { const [r, g, b] = hex(h).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
export const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const readableOn = (bg) => (contrast(bg, "#ffffff") >= contrast(bg, "#15172c") ? "#ffffff" : "#15172c");

// ---------- presets (original palettes) ----------
export const PRESETS = {
  washi:   { name: "Washi paper",     mode: "light", bg: "#f3eee3", surface: "#fbf8f1", ink: "#2b2622", muted: "#7a6f62", line: "#e0d6c5", accent: "#b5452b", font: "body", display: "mincho" },
  sumi:    { name: "Sumi ink",        mode: "dark",  bg: "#0e0e0f", surface: "#18181a", ink: "#e9e6df", muted: "#8f8a82", line: "#2a2a2d", accent: "#d9a441", font: "body", display: "mincho" },
  sakura:  { name: "Sakura night",    mode: "dark",  bg: "#1c1420", surface: "#271b2c", ink: "#f6e9f0", muted: "#b89aab", line: "#3d2b44", accent: "#f48fb1", font: "body", display: "display" },
  hanami:  { name: "Hanami",          mode: "light", bg: "#fdf1f4", surface: "#ffffff", ink: "#3b2430", muted: "#8c6b7a", line: "#f1d6df", accent: "#c2456f", font: "body", display: "display" },
  matcha:  { name: "Matcha latte",    mode: "light", bg: "#eef1e4", surface: "#fafbf4", ink: "#25301d", muted: "#66735a", line: "#d6dec6", accent: "#4f7a28", font: "body", display: "display" },
  akiba:   { name: "Akihabara neon",  mode: "dark",  bg: "#0b0b1a", surface: "#14142b", ink: "#e8f6ff", muted: "#8fa0c0", line: "#26264a", accent: "#2ee6d6", font: "body", display: "display" },
  deepsea: { name: "Deep sea",        mode: "dark",  bg: "#081a22", surface: "#0e2530", ink: "#dceff2", muted: "#7fa3ab", line: "#183845", accent: "#4fc3f7", font: "body", display: "display" },
  momiji:  { name: "Autumn momiji",   mode: "light", bg: "#f7efe6", surface: "#fffaf3", ink: "#33231a", muted: "#8a6b55", line: "#ead9c6", accent: "#c4501b", font: "body", display: "serif" },
  contrast:{ name: "High contrast",   mode: "dark",  bg: "#000000", surface: "#0d0d0d", ink: "#ffffff", muted: "#d0d0d0", line: "#5a5a5a", accent: "#ffd400", font: "atkinson", display: "display" },
  kintsugi: {"name":"Kintsugi","mode":"dark","bg":"#15130f","surface":"#211e18","ink":"#f2ecdf","muted":"#aaa08c","line":"#3a3428","accent":"#e3b04b","font":"body","display":"mincho"},
  yozakura: {"name":"Yozakura","mode":"dark","bg":"#120f1f","surface":"#1d1830","ink":"#f4eaf6","muted":"#b3a4c4","line":"#332b4d","accent":"#ff9ec4","font":"body","display":"display"},
  ramune: {"name":"Ramune soda","mode":"light","bg":"#e6f6fb","surface":"#ffffff","ink":"#10303c","muted":"#47707e","line":"#c3e4ee","accent":"#0a7ea4","font":"body","display":"display"},
  yuzu: {"name":"Yuzu","mode":"light","bg":"#fdf8dd","surface":"#fffef3","ink":"#332e0d","muted":"#6d6532","line":"#eee5ac","accent":"#946f00","font":"body","display":"display"},
  ume: {"name":"Umeboshi","mode":"light","bg":"#fbecea","surface":"#fff8f6","ink":"#3b1a1d","muted":"#7f5255","line":"#efd2cf","accent":"#b32142","font":"body","display":"mincho"},
  fuji: {"name":"Wisteria","mode":"light","bg":"#f1edfa","surface":"#fdfbff","ink":"#2a2240","muted":"#675c85","line":"#ddd4ef","accent":"#6a43b8","font":"body","display":"display"},
  kohaku: {"name":"Amber koi","mode":"dark","bg":"#1a120b","surface":"#271b11","ink":"#f8e9d6","muted":"#bfa283","line":"#44301e","accent":"#ff9d3c","font":"body","display":"display"},
  aizome: {"name":"Indigo dye","mode":"dark","bg":"#0c1630","surface":"#142244","ink":"#e5ecfb","muted":"#9eafd2","line":"#263a69","accent":"#7fb0ff","font":"body","display":"mincho"},
  moss: {"name":"Temple moss","mode":"dark","bg":"#10170f","surface":"#1a2318","ink":"#e7efe0","muted":"#9eae93","line":"#2e3b2a","accent":"#9ccc65","font":"body","display":"display"},
  lantern: {"name":"Lantern festival","mode":"dark","bg":"#1b0d0d","surface":"#2a1414","ink":"#fbe9dc","muted":"#c7a191","line":"#4a2622","accent":"#ff7a45","font":"body","display":"display"},
  snowcountry: {"name":"Snow country","mode":"light","bg":"#eef3f7","surface":"#ffffff","ink":"#1c2a36","muted":"#566878","line":"#d5e0e9","accent":"#2467a6","font":"body","display":"mincho"},
  sunrise: {"name":"Sunrise","mode":"light","bg":"#fff1e6","surface":"#fffaf5","ink":"#3a2118","muted":"#7c5a4c","line":"#f4d9c6","accent":"#c8401f","font":"body","display":"display"},
  tatami: {"name":"Tatami","mode":"light","bg":"#ece7cf","surface":"#f8f5e6","ink":"#2c2a18","muted":"#67634a","line":"#d8d2b3","accent":"#5f6b1f","font":"body","display":"mincho"},
  newsprint: {"name":"Newsprint","mode":"light","bg":"#efefea","surface":"#fafaf7","ink":"#161616","muted":"#5c5c58","line":"#d6d6d0","accent":"#111111","font":"serif","display":"serif"},
  manga: {"name":"Black and white","mode":"light","bg":"#ffffff","surface":"#ffffff","ink":"#000000","muted":"#505050","line":"#000000","accent":"#000000","font":"body","display":"display"},
  ink2: {"name":"Inverted manga","mode":"dark","bg":"#000000","surface":"#0b0b0b","ink":"#ffffff","muted":"#b5b5b5","line":"#ffffff","accent":"#ffffff","font":"body","display":"display"},
  terminal: {"name":"Terminal","mode":"dark","bg":"#071008","surface":"#0d1a0f","ink":"#b6ffb9","muted":"#6fbf74","line":"#1c3a20","accent":"#3cff5a","font":"mono","display":"body"},
  vapor: {"name":"Vapor","mode":"dark","bg":"#1a1033","surface":"#261849","ink":"#fbe9ff","muted":"#c1a7dc","line":"#46307a","accent":"#ff71ce","font":"body","display":"display"},
  arcade: {"name":"Arcade","mode":"dark","bg":"#0a0420","surface":"#150a36","ink":"#f3f0ff","muted":"#a79dd0","line":"#33236b","accent":"#ffe14d","font":"body","display":"display"},
  cocoa: {"name":"Hot cocoa","mode":"dark","bg":"#1e1410","surface":"#2c1e18","ink":"#f5e8df","muted":"#bda596","line":"#4a352b","accent":"#e0a37a","font":"body","display":"display"},
  lavender: {"name":"Lavender haze","mode":"dark","bg":"#17141f","surface":"#221e2e","ink":"#efeaf7","muted":"#ada5be","line":"#3a3350","accent":"#c4a7ff","font":"body","display":"display"},
  glacier: {"name":"Glacier","mode":"dark","bg":"#0d1b24","surface":"#152833","ink":"#e4f3f8","muted":"#99b6c2","line":"#264452","accent":"#7fe0e8","font":"body","display":"display"},
  parchment: {"name":"Old parchment","mode":"light","bg":"#efe3c8","surface":"#f8efd9","ink":"#30240f","muted":"#67552f","line":"#dbcba4","accent":"#8c3a12","font":"serif","display":"serif"},
  dyslexia: {"name":"Easy reading","mode":"light","bg":"#fbf6e6","surface":"#fffdf3","ink":"#20201c","muted":"#55554c","line":"#e4dcc0","accent":"#1d5fa8","font":"atkinson","display":"body"},
  twilight: {"name":"Twilight","mode":"dark","bg":"#151433","surface":"#201d45","ink":"#efedfb","muted":"#9893c8","line":"#37325f","accent":"#ff9d5c","font":"body","display":"display"},
  fern: {"name":"Fern","mode":"light","bg":"#e4efe9","surface":"#f2f8f4","ink":"#1c2b26","muted":"#55706a","line":"#c5dbd2","accent":"#0f7d6e","font":"body","display":"mincho"},
};
const FONT_BODY = { body: '"Zen Kaku Gothic New", "Hiragino Sans", system-ui, sans-serif', atkinson: '"Atkinson Hyperlegible", system-ui, sans-serif', serif: '"Literata", Georgia, serif', lexend: '"Lexend", system-ui, sans-serif', mono: '"IBM Plex Mono", ui-monospace, monospace' };
const FONT_DISPLAY = { display: '"Dela Gothic One", "Arial Black", Impact, sans-serif', mincho: '"Shippori Mincho", "Hiragino Mincho ProN", serif', serif: '"Literata", Georgia, serif', body: FONT_BODY.body };
export const FONT_CHOICES = { body: ["body", "Zen Kaku Gothic"], atkinson: ["atkinson", "Atkinson Hyperlegible"], serif: ["serif", "Literata"], lexend: ["lexend", "Lexend"], mono: ["mono", "IBM Plex Mono"] };
export const DISPLAY_CHOICES = { display: "Dela Gothic One", mincho: "Shippori Mincho", serif: "Literata", body: "Same as text" };

export function themeCss(t) {
  const accentInk = readableOn(t.accent);
  const mix = (a, b, p) => `color-mix(in srgb, ${a} ${p}%, ${b})`;
  return `html:root[data-theme]{
    --bg:${t.bg};--bg-2:${mix(t.bg, t.ink, 95)};--surface:${t.surface};--surface-2:${mix(t.surface, t.ink, 95)};
    --ink:${t.ink};--ink-2:${mix(t.ink, t.bg, 82)};--muted:${t.muted};--line:${t.line};--line-2:${mix(t.line, t.ink, 82)};
    --accent:${t.accent};--accent-l:${t.accent};--accent-d:${t.accent};--accent-ink:${accentInk};--accent-soft:${mix(t.accent, t.surface, 14)};
    --f-body:${FONT_BODY[t.font] || FONT_BODY.body};--f-display:${FONT_DISPLAY[t.display] || FONT_DISPLAY.display};
    color-scheme:${t.mode};}
  html:root[data-theme] body{background:var(--bg);color:var(--ink);font-family:var(--f-body)}`;
}

export const getCustomThemes = () => ls.get("customThemes", {});
export const saveCustomThemes = (all) => ls.set("customThemes", all);

// Applies the chosen theme id ("preset:washi" or "custom:<id>") or clears it.
export function applyCustomTheme(choice) {
  document.getElementById("kt-theme")?.remove();
  if (!choice) { ls.set("themeCss", ""); return null; }
  const [kind, id] = choice.split(":");
  const t = kind === "preset" ? PRESETS[id] : getCustomThemes()[id];
  if (!t) { ls.set("themeCss", ""); return null; }
  const css = themeCss(t);
  const style = document.createElement("style");
  style.id = "kt-theme"; style.textContent = css;
  document.head.append(style);
  document.documentElement.setAttribute("data-theme", t.mode);
  ls.set("themeCss", css); ls.set("themeMode", t.mode);
  return t;
}

// Share codes: KITSUNE-THEME:<base64 json>
export const encodeTheme = (t) => "KITSUNE-THEME:" + btoa(unescape(encodeURIComponent(JSON.stringify({ v: 1, ...t }))));
export function decodeTheme(code) {
  const m = String(code).trim().match(/^KITSUNE-THEME:([A-Za-z0-9+/=]+)$/);
  if (!m) throw new Error("That isn't a Kitsune theme code. It starts with KITSUNE-THEME:");
  const t = JSON.parse(decodeURIComponent(escape(atob(m[1]))));
  const ok = (c) => /^#[0-9a-f]{6}$/i.test(c || "");
  if (!["bg", "surface", "ink", "muted", "line", "accent"].every((k) => ok(t[k]))) throw new Error("That theme code is missing colours.");
  return { name: String(t.name || "Shared theme").slice(0, 40), mode: t.mode === "light" ? "light" : "dark", bg: t.bg, surface: t.surface, ink: t.ink, muted: t.muted, line: t.line, accent: t.accent, font: FONT_BODY[t.font] ? t.font : "body", display: FONT_DISPLAY[t.display] ? t.display : "display" };
}

// ---------- cursors (original drawings) ----------
const svgCursor = (body, size = 32) => `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}' viewBox='0 0 32 32'>${body.replace(/%23/g, "#")}</svg>`)}")`;
export const CURSORS = {
  default: { name: "System", css: null },
  paw: { name: "Fox paw", hot: [6, 4], body: "<g fill='%23c9661a' stroke='%231b1d33' stroke-width='1.5'><ellipse cx='16' cy='20' rx='7' ry='6'/><circle cx='8' cy='11' r='3'/><circle cx='14' cy='7' r='3'/><circle cx='20' cy='7' r='3'/><circle cx='25' cy='12' r='3'/></g><path d='M2 2 L9 4 L4 9 Z' fill='%231b1d33'/>" },
  brush: { name: "Sumi brush", hot: [3, 29], body: "<path d='M27 3 L12 18 L15 21 L30 6 Z' fill='%238b5a2b' stroke='%231b1d33' stroke-width='1.2'/><path d='M12 18 C8 19 5 23 3 29 C9 27 13 24 15 21 Z' fill='%23111' stroke='%23fff' stroke-width='1'/>" },
  petal: { name: "Sakura petal", hot: [4, 4], body: "<path d='M4 4 C14 2 26 8 26 18 C26 26 18 28 14 24 C10 28 4 22 6 14 C4 10 3 7 4 4 Z' fill='%23f7b6c9' stroke='%23c2456f' stroke-width='1.5'/><path d='M14 24 L13 19' stroke='%23c2456f' stroke-width='1.5'/>" },
  big: { name: "Large arrow", hot: [3, 3], size: 48, body: "<path d='M3 3 L3 27 L9 21 L13 30 L17 28 L13 19 L21 19 Z' fill='%23ffffff' stroke='%23000' stroke-width='2' stroke-linejoin='round'/>" },
  foxfire: { name: "Foxfire", hot: [16, 16], body: "<circle cx='16' cy='16' r='9' fill='%2386c5ff' opacity='.35'/><circle cx='16' cy='16' r='5' fill='%23bfe3ff'/><circle cx='16' cy='16' r='2' fill='%23ffffff'/>" },
  ...MORE_CURSORS,
};
for (const [k, g] of [["paw", "Kitsune"], ["brush", "Stationery"], ["petal", "Nature"], ["big", "Easy to see"], ["foxfire", "Kitsune"]]) CURSORS[k].group = g;
export function cursorCss(choice, customDataUrl, userSize = 32) {
  let url, hot = [4, 4];
  if (choice === "custom" && customDataUrl) { url = `url("${customDataUrl}")`; hot = [2, 2]; }
  else { const c = CURSORS[choice]; if (!c?.body) return ""; const px = Math.min(128, Math.round((c.size || 32) * (userSize / 32))); url = svgCursor(c.body, px); hot = [Math.round(c.hot[0] * px / 32), Math.round(c.hot[1] * px / 32)]; }
  return `html,body{cursor:${url} ${hot[0]} ${hot[1]},auto}
    a,button,[role=button],label,select,summary,.card,.chip{cursor:${url} ${hot[0]} ${hot[1]},pointer}
    input[type=text],input[type=search],textarea,.b-text{cursor:text}`;
}
export const AUTO_CURSOR = { off: "Off", daily: "A new one every day", season: "With the seasons", daynight: "Day and night" };
export function effectiveCursor(s) {
  const d = new Date(), m = d.getMonth(), h = d.getHours();
  if (s.cursorAuto === "season") return m < 2 || m === 11 ? "snow" : m < 5 ? "petal" : m < 8 ? "wave" : "maple";
  if (s.cursorAuto === "daynight") return h >= 7 && h < 19 ? "foxface" : "moon";
  if (s.cursorAuto === "daily") { const favs = (s.cursorFavs || []).filter((k) => CURSORS[k]), l = favs.length ? favs : Object.keys(CURSORS).filter((k) => k !== "default" && !CURSORS[k].xmas), n = d.getFullYear() * 372 + m * 31 + d.getDate(); return l[n % l.length]; }
  return s.cursor || "default";
}
let autoTimer = 0;
// Everything about the cursor from settings: the picture, its size, the link cursor, and the effects.
export function applyCursorFrom(s, customDataUrl) {
  applyCursor(effectiveCursor(s), customDataUrl, s.cursorSize || 32, s.cursorLink || "");
  clearInterval(autoTimer); if (s.cursorAuto && s.cursorAuto !== "off") { let last = effectiveCursor(s); autoTimer = setInterval(() => { const now = effectiveCursor(s); if (now !== last) { last = now; applyCursor(now, customDataUrl, s.cursorSize || 32, s.cursorLink || ""); } }, 10 * 60_000); }
  if (s.trail || s.cursorFx || document.getElementById("kt-cursorfx")) import("./cursorfx.js").then((F) => F.applyFx(s)).catch(() => {});
}
export function applyCursor(choice, customDataUrl, userSize = 32, linkChoice = "") {
  document.getElementById("kt-cursor")?.remove();
  let css = cursorCss(choice, customDataUrl, userSize);
  if (linkChoice && CURSORS[linkChoice]?.body) { const l = cursorCss(linkChoice, "", userSize).match(/cursor:([^;}]+)/)?.[1]?.replace(/,auto$/, ",pointer"); if (l) css += `\na,button,[role=button],label,select,summary,.card,.chip{cursor:${l}}`; }
  ls.set("cursorCss", css);
  if (!css) return;
  const s = document.createElement("style"); s.id = "kt-cursor"; s.textContent = css; document.head.append(s);
}
// Shrinks an uploaded image to a cursor-sized PNG (browsers ignore cursors over 128px).
export async function imageToCursor(file, size = 32) {
  const img = new Image(); img.src = URL.createObjectURL(file); await img.decode();
  const c = document.createElement("canvas"); c.width = c.height = size;
  const s = Math.min(size / img.naturalWidth, size / img.naturalHeight);
  c.getContext("2d").drawImage(img, 0, 0, img.naturalWidth * s, img.naturalHeight * s);
  URL.revokeObjectURL(img.src);
  return c.toDataURL("image/png");
}

// ---------- foxfire trail (kitsune-bi) ----------
let trail = null;
export function setTrail(on) {
  if (!on || (document.documentElement.dataset.motion === "reduce" || matchMedia("(prefers-reduced-motion: reduce)").matches)) { trail?.stop(); trail = null; return; }
  if (trail) return;
  const c = document.createElement("canvas");
  c.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:200";
  document.body.append(c);
  const g = c.getContext("2d");
  const parts = [];
  const size = () => { c.width = innerWidth * devicePixelRatio; c.height = innerHeight * devicePixelRatio; g.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0); };
  size(); addEventListener("resize", size);
  const move = (e) => { if (e.pointerType !== "mouse") return; for (let i = 0; i < 2; i++) parts.push({ x: e.clientX, y: e.clientY, vx: (Math.random() - 0.5) * 0.6, vy: -0.4 - Math.random() * 0.8, life: 1, r: 2 + Math.random() * 3 }); };
  addEventListener("pointermove", move, { passive: true });
  let raf;
  const tick = () => {
    g.clearRect(0, 0, innerWidth, innerHeight);
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i]; p.x += p.vx; p.y += p.vy; p.life -= 0.025;
      if (p.life <= 0) { parts.splice(i, 1); continue; }
      const grad = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3);
      grad.addColorStop(0, `rgba(210,240,255,${p.life})`); grad.addColorStop(0.4, `rgba(110,180,255,${p.life * 0.6})`); grad.addColorStop(1, "rgba(80,120,255,0)");
      g.fillStyle = grad; g.beginPath(); g.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2); g.fill();
    }
    if (parts.length > 160) parts.splice(0, parts.length - 160);
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  trail = { stop() { cancelAnimationFrame(raf); removeEventListener("pointermove", move); removeEventListener("resize", size); c.remove(); } };
}
