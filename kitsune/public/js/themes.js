// Custom themes and cursors. Both compile to a small stylesheet that is cached in
// localStorage so index.html can apply it before the first paint (no flash).
import { ls } from "./util.js";

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
const svgCursor = (body, size = 32) => `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}' viewBox='0 0 32 32'>${body}</svg>`)}")`;
export const CURSORS = {
  default: { name: "System", css: null },
  paw: { name: "Fox paw", hot: [6, 4], body: "<g fill='%23c9661a' stroke='%231b1d33' stroke-width='1.5'><ellipse cx='16' cy='20' rx='7' ry='6'/><circle cx='8' cy='11' r='3'/><circle cx='14' cy='7' r='3'/><circle cx='20' cy='7' r='3'/><circle cx='25' cy='12' r='3'/></g><path d='M2 2 L9 4 L4 9 Z' fill='%231b1d33'/>" },
  brush: { name: "Sumi brush", hot: [3, 29], body: "<path d='M27 3 L12 18 L15 21 L30 6 Z' fill='%238b5a2b' stroke='%231b1d33' stroke-width='1.2'/><path d='M12 18 C8 19 5 23 3 29 C9 27 13 24 15 21 Z' fill='%23111' stroke='%23fff' stroke-width='1'/>" },
  petal: { name: "Sakura petal", hot: [4, 4], body: "<path d='M4 4 C14 2 26 8 26 18 C26 26 18 28 14 24 C10 28 4 22 6 14 C4 10 3 7 4 4 Z' fill='%23f7b6c9' stroke='%23c2456f' stroke-width='1.5'/><path d='M14 24 L13 19' stroke='%23c2456f' stroke-width='1.5'/>" },
  big: { name: "Large arrow", hot: [3, 3], size: 48, body: "<path d='M3 3 L3 27 L9 21 L13 30 L17 28 L13 19 L21 19 Z' fill='%23ffffff' stroke='%23000' stroke-width='2' stroke-linejoin='round'/>" },
  foxfire: { name: "Foxfire", hot: [16, 16], body: "<circle cx='16' cy='16' r='9' fill='%2386c5ff' opacity='.35'/><circle cx='16' cy='16' r='5' fill='%23bfe3ff'/><circle cx='16' cy='16' r='2' fill='%23ffffff'/>" },
};
export function cursorCss(choice, customDataUrl) {
  let url, hot = [4, 4];
  if (choice === "custom" && customDataUrl) { url = `url("${customDataUrl}")`; hot = [2, 2]; }
  else { const c = CURSORS[choice]; if (!c?.body) return ""; url = svgCursor(c.body, c.size || 32); hot = c.size ? [Math.round(c.hot[0] * c.size / 32), Math.round(c.hot[1] * c.size / 32)] : c.hot; }
  return `html,body{cursor:${url} ${hot[0]} ${hot[1]},auto}
    a,button,[role=button],label,select,summary,.card,.chip{cursor:${url} ${hot[0]} ${hot[1]},pointer}
    input[type=text],input[type=search],textarea,.b-text{cursor:text}`;
}
export function applyCursor(choice, customDataUrl) {
  document.getElementById("kt-cursor")?.remove();
  const css = cursorCss(choice, customDataUrl);
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
