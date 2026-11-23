// Draws the Kitsune Original manga "Kitsu Delivers, Chapter 1" as SVG pages.
// Run: node tools/make-originals.mjs   (writes public/originals/kitsu-delivers-1/000.svg …)
// The characters and art are original to Kitsune and released under CC BY 4.0.
import { mkdirSync, writeFileSync } from "node:fs";

const W = 1000, H = 1500;
const INK = "#1b1d33", PAPER = "#fbfaf6", NIGHT = "#262b4f", NIGHT2 = "#3a4170", FOX = "#e0702f", FOX2 = "#b8521b", CREAM = "#fff6e6", SCARF = "#c8283a", GLOW = "#ffd36b", SEA = "#33507a";
const FONT = `font-family="'Trebuchet MS','Segoe UI',system-ui,sans-serif"`;
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");

// ---------- characters ----------
// Kitsu: a young fox courier with a long red scarf, a satchel and a lantern on a pole. Origin = between her feet.
function kitsu({ x, y, s = 1, flip = false, face = "calm", lantern = true, walk = false, hold = null }) {
  const eye = face === "happy" ? `<path d="M 52 -238 q 9 -9 18 0" stroke="${INK}" stroke-width="5" fill="none" stroke-linecap="round"/>`
    : face === "surprised" ? `<circle cx="61" cy="-238" r="8" fill="${INK}"/><circle cx="64" cy="-241" r="2.5" fill="#fff"/>`
    : face === "determined" ? `<path d="M 50 -246 l 20 6" stroke="${INK}" stroke-width="5" stroke-linecap="round"/><circle cx="62" cy="-234" r="5.5" fill="${INK}"/>`
    : `<circle cx="61" cy="-236" r="6" fill="${INK}"/>`;
  const mouth = face === "surprised" ? `<ellipse cx="88" cy="-205" rx="5" ry="7" fill="${INK}"/>` : face === "happy" ? `<path d="M 80 -208 q 8 8 16 0" stroke="${INK}" stroke-width="4" fill="none"/>` : "";
  const legA = walk ? `<path d="M -18 -70 L -40 0" stroke="${FOX2}" stroke-width="18" stroke-linecap="round"/>` : `<path d="M -18 -70 L -22 0" stroke="${FOX2}" stroke-width="18" stroke-linecap="round"/>`;
  const legB = walk ? `<path d="M 18 -70 L 38 -4" stroke="${FOX2}" stroke-width="18" stroke-linecap="round"/>` : `<path d="M 18 -70 L 22 0" stroke="${FOX2}" stroke-width="18" stroke-linecap="round"/>`;
  const lant = lantern ? `<path d="M 10 -150 L 150 -230" stroke="#6b4a2b" stroke-width="7" stroke-linecap="round"/>
      <circle cx="150" cy="-185" r="62" fill="${GLOW}" opacity=".28"/>
      <line x1="150" y1="-230" x2="150" y2="-214" stroke="${INK}" stroke-width="3"/>
      <rect x="128" y="-214" width="44" height="58" rx="18" fill="${GLOW}" stroke="${INK}" stroke-width="4"/>
      <path d="M 130 -195 h 40 M 130 -176 h 40" stroke="${INK}" stroke-width="2" opacity=".5"/>` : "";
  const held = hold === "letter" ? `<g transform="translate(92 -150) rotate(-12)"><rect x="-26" y="-18" width="52" height="36" fill="${CREAM}" stroke="${INK}" stroke-width="3"/><path d="M -26 -18 L 0 4 L 26 -18" fill="none" stroke="${INK}" stroke-width="2.5"/></g>`
    : hold === "parcel" ? `<g transform="translate(88 -140)"><rect x="-30" y="-24" width="60" height="48" fill="#a98a5f" stroke="${INK}" stroke-width="3"/><path d="M -30 0 h 60 M 0 -24 v 48" stroke="${INK}" stroke-width="2"/></g>` : "";
  return `<g transform="translate(${x} ${y}) scale(${flip ? -s : s} ${s})">
    <path d="M -40 -95 C -150 -110 -170 -230 -95 -250 C -110 -190 -80 -150 -30 -130 Z" fill="${FOX}" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
    <path d="M -95 -250 C -120 -230 -122 -205 -112 -188 C -100 -205 -95 -225 -95 -250 Z" fill="#fff" stroke="${INK}" stroke-width="4"/>
    ${legA}${legB}
    <ellipse cx="0" cy="-115" rx="52" ry="62" fill="${FOX}" stroke="${INK}" stroke-width="5"/>
    <ellipse cx="14" cy="-108" rx="26" ry="40" fill="${CREAM}"/>
    <path d="M -50 -150 L 45 -62" stroke="#6b4a2b" stroke-width="7"/>
    <rect x="-70" y="-110" width="46" height="40" rx="6" fill="#8a5a33" stroke="${INK}" stroke-width="4"/>
    <path d="M -70 -98 h 46" stroke="${INK}" stroke-width="3"/>
    ${lant}${held}
    <path d="M -30 -170 Q 0 -150 46 -172 L 50 -156 Q 0 -134 -34 -154 Z" fill="${SCARF}" stroke="${INK}" stroke-width="4"/>
    <path d="M -30 -164 Q -80 -150 -110 -120 L -100 -108 Q -70 -136 -24 -150 Z" fill="${SCARF}" stroke="${INK}" stroke-width="4"/>
    <path d="M 0 -170 L -18 -250 L 8 -215 Z" fill="${FOX2}" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
    <path d="M 64 -260 L 70 -310 L 88 -262 Z M 20 -262 L 12 -312 L 44 -270 Z" fill="${FOX}" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
    <ellipse cx="50" cy="-228" rx="52" ry="44" fill="${FOX}" stroke="${INK}" stroke-width="5"/>
    <path d="M 70 -222 L 118 -210 L 78 -196 Q 60 -196 54 -210 Z" fill="${CREAM}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
    <circle cx="117" cy="-210" r="6" fill="${INK}"/>
    ${eye}${mouth}
  </g>`;
}

// Oyuki: an old crane who keeps the lighthouse, in a cardigan buttoned wrong.
function crane({ x, y, s = 1, flip = false, face = "calm", letter = false }) {
  const eye = face === "teary" ? `<path d="M 58 -330 q 7 6 14 0" stroke="${INK}" stroke-width="4" fill="none"/><path d="M 66 -322 q -4 12 0 18 q 4 -6 0 -18" fill="#7fc3ff" stroke="${INK}" stroke-width="1.5"/>` : `<circle cx="64" cy="-332" r="5" fill="${INK}"/>`;
  return `<g transform="translate(${x} ${y}) scale(${flip ? -s : s} ${s})">
    <path d="M -10 -70 L -14 0 M 14 -70 L 18 0" stroke="#c9a46a" stroke-width="8" stroke-linecap="round"/>
    <ellipse cx="0" cy="-130" rx="56" ry="74" fill="#d9dbe2" stroke="${INK}" stroke-width="5"/>
    <path d="M -50 -170 Q 0 -190 50 -170 L 44 -70 Q 0 -60 -44 -70 Z" fill="#7a6aa8" stroke="${INK}" stroke-width="4"/>
    <path d="M 0 -186 L 0 -66" stroke="${INK}" stroke-width="3"/>
    <circle cx="8" cy="-160" r="4" fill="${CREAM}"/><circle cx="8" cy="-130" r="4" fill="${CREAM}"/><circle cx="-8" cy="-100" r="4" fill="${CREAM}"/>
    <path d="M 18 -195 C 30 -250 40 -280 46 -315" stroke="#d9dbe2" stroke-width="22" fill="none" stroke-linecap="round"/>
    <path d="M 18 -195 C 30 -250 40 -280 46 -315" stroke="${INK}" stroke-width="3" fill="none" opacity=".35"/>
    <circle cx="52" cy="-330" r="26" fill="#e6e8ee" stroke="${INK}" stroke-width="5"/>
    <path d="M 40 -352 a 14 10 0 0 1 24 -2" fill="${SCARF}"/>
    <path d="M 74 -336 L 132 -326 L 74 -320 Z" fill="#e3b04b" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
    ${eye}
    ${letter ? `<g transform="translate(70 -150) rotate(8)"><rect x="-30" y="-40" width="60" height="80" fill="${CREAM}" stroke="${INK}" stroke-width="3"/><path d="M -20 -24 h 40 M -20 -10 h 34 M -20 4 h 40 M -20 18 h 24" stroke="${INK}" stroke-width="2" opacity=".5"/></g>` : ""}
  </g>`;
}

// The heron who runs the river ferry.
function heron({ x, y, s = 1, flip = false }) {
  return `<g transform="translate(${x} ${y}) scale(${flip ? -s : s} ${s})">
    <path d="M 0 -60 L 0 0" stroke="#c9a46a" stroke-width="7"/>
    <ellipse cx="0" cy="-100" rx="44" ry="52" fill="#9fb1c9" stroke="${INK}" stroke-width="5"/>
    <path d="M 20 -140 C 40 -180 20 -210 40 -240" stroke="#9fb1c9" stroke-width="16" fill="none" stroke-linecap="round"/>
    <circle cx="46" cy="-248" r="20" fill="#b9c7da" stroke="${INK}" stroke-width="4"/>
    <path d="M 62 -252 L 120 -244 L 62 -238 Z" fill="#e3b04b" stroke="${INK}" stroke-width="3"/>
    <circle cx="50" cy="-252" r="4" fill="${INK}"/>
    <path d="M 30 -262 Q 0 -270 -20 -250" stroke="${INK}" stroke-width="4" fill="none"/>
  </g>`;
}

// Tamba: the old badger who sells umbrellas.
function badger({ x, y, s = 1, flip = false }) {
  return `<g transform="translate(${x} ${y}) scale(${flip ? -s : s} ${s})">
    <ellipse cx="0" cy="-80" rx="70" ry="80" fill="#7d7f86" stroke="${INK}" stroke-width="5"/>
    <ellipse cx="10" cy="-170" rx="50" ry="42" fill="#efeee9" stroke="${INK}" stroke-width="5"/>
    <path d="M -20 -205 Q 10 -190 -10 -140 M 40 -205 Q 10 -190 30 -140" stroke="#3b3c42" stroke-width="16" fill="none"/>
    <circle cx="-2" cy="-170" r="4.5" fill="#fff"/><circle cx="24" cy="-170" r="4.5" fill="#fff"/>
    <circle cx="11" cy="-148" r="7" fill="${INK}"/>
    <path d="M 40 -80 L 110 -230" stroke="#6b4a2b" stroke-width="6"/>
    <path d="M 20 -230 Q 110 -320 200 -230 Z" fill="#c64b4b" stroke="${INK}" stroke-width="5"/>
    <path d="M 110 -230 L 110 -290 M 65 -232 L 85 -284 M 155 -232 L 135 -284" stroke="${INK}" stroke-width="2" opacity=".5"/>
  </g>`;
}

// ---------- scenery ----------
const stars = (n, w, h, seed = 1) => { let r = seed, out = ""; const rnd = () => ((r = (r * 9301 + 49297) % 233280) / 233280); for (let i = 0; i < n; i++) out += `<circle cx="${(rnd() * w).toFixed(0)}" cy="${(rnd() * h).toFixed(0)}" r="${(rnd() * 2.4 + .6).toFixed(1)}" fill="#fff" opacity="${(rnd() * .6 + .3).toFixed(2)}"/>`; return out; };
const nightSky = (w, h, seed) => `<rect width="${w}" height="${h}" fill="${NIGHT}"/>${stars(70, w, h * .7, seed)}`;
const moon = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r * 1.8}" fill="#fff" opacity=".07"/><circle cx="${x}" cy="${y}" r="${r}" fill="#fdf3cf"/><circle cx="${x - r * .3}" cy="${y - r * .2}" r="${r * .18}" fill="#efe0a8"/>`;
const mountains = (w, h, y, c = NIGHT2) => `<path d="M 0 ${h} L 0 ${y} L ${w * .18} ${y - 140} L ${w * .32} ${y - 40} L ${w * .5} ${y - 200} L ${w * .7} ${y - 60} L ${w * .85} ${y - 150} L ${w} ${y - 30} L ${w} ${h} Z" fill="${c}"/>`;
const house = (x, y, s = 1, lit = true) => `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-60" y="-80" width="120" height="80" fill="#4b4060" stroke="${INK}" stroke-width="4"/><path d="M -80 -76 L 0 -136 L 80 -76 Z" fill="#2e2742" stroke="${INK}" stroke-width="4"/><rect x="-36" y="-56" width="28" height="28" fill="${lit ? GLOW : "#333"}" stroke="${INK}" stroke-width="3"/><rect x="12" y="-56" width="26" height="56" fill="#3a2f4d" stroke="${INK}" stroke-width="3"/></g>`;
const lighthouse = (x, y, s = 1, lit = true) => `<g transform="translate(${x} ${y}) scale(${s}) rotate(-4)">
  ${lit ? `<path d="M 0 -300 L 420 -380 L 420 -220 Z" fill="${GLOW}" opacity=".18"/><path d="M 0 -300 L -420 -380 L -420 -220 Z" fill="${GLOW}" opacity=".12"/>` : ""}
  <path d="M -50 0 L -32 -270 L 32 -270 L 50 0 Z" fill="#f2efe8" stroke="${INK}" stroke-width="5"/>
  <path d="M -45 -80 L 45 -80 L 42 -130 L -42 -130 Z M -38 -190 L 38 -190 L 36 -230 L -36 -230 Z" fill="#c8283a"/>
  <rect x="-30" y="-320" width="60" height="50" fill="${lit ? GLOW : "#9aa"}" stroke="${INK}" stroke-width="5"/>
  <path d="M -40 -320 L 0 -350 L 40 -320 Z" fill="${INK}"/></g>`;
const rain = (w, h) => Array.from({ length: 60 }, (_, i) => { const x = (i * 97) % w, y = (i * 53) % h; return `<line x1="${x}" y1="${y}" x2="${x - 12}" y2="${y + 40}" stroke="#bcd" stroke-width="3" opacity=".55"/>`; }).join("");
const envelope = (x, y, s = 1, glow = false, line = false) => `<g transform="translate(${x} ${y}) scale(${s})">
  ${glow ? `<circle r="190" fill="${GLOW}" opacity=".25"/>` : ""}
  <rect x="-150" y="-95" width="300" height="190" fill="${CREAM}" stroke="${INK}" stroke-width="6"/>
  <path d="M -150 -95 L 0 20 L 150 -95" fill="none" stroke="${INK}" stroke-width="4" opacity=".35"/>
  <g transform="translate(105 55) scale(.16) rotate(-4)"><path d="M -50 0 L -32 -270 L 32 -270 L 50 0 Z" fill="none" stroke="#7a4a22" stroke-width="16"/><rect x="-30" y="-320" width="60" height="50" fill="none" stroke="#7a4a22" stroke-width="16"/></g>
  ${line ? `<path d="M 105 30 C 160 20 190 0 260 -10" stroke="${GLOW}" stroke-width="7" fill="none" stroke-dasharray="14 10"/><path d="M 250 -26 L 286 -12 L 252 6" fill="none" stroke="${GLOW}" stroke-width="7"/>` : ""}
</g>`;

// ---------- lettering ----------
function wrap(text, max) { const out = []; let line = ""; for (const w of text.split(" ")) { if ((line + " " + w).trim().length > max) { out.push(line.trim()); line = w; } else line += " " + w; } if (line.trim()) out.push(line.trim()); return out; }
function bubble(x, y, text, { w = 300, tail = null, think = false, size = 30, shout = false } = {}) {
  const lines = wrap(text, Math.max(8, Math.floor(w / (size * .6))));
  const h = lines.length * size * 1.25 + 40;
  const t = tail ? (think ? `<circle cx="${tail[0]}" cy="${tail[1]}" r="9" fill="#fff" stroke="${INK}" stroke-width="4"/><circle cx="${(tail[0] + x) / 2}" cy="${(tail[1] + y + h / 2) / 2}" r="14" fill="#fff" stroke="${INK}" stroke-width="4"/>`
    : `<path d="M ${x - 26} ${y + h / 2 - 6} L ${tail[0]} ${tail[1]} L ${x + 22} ${y + h / 2 - 10}" fill="#fff" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>`) : "";
  const shape = shout ? `<path d="${Array.from({ length: 18 }, (_, i) => { const a = (i / 18) * Math.PI * 2, r = i % 2 ? 1 : 1.18; return `${i ? "L" : "M"} ${x + Math.cos(a) * (w / 2 + 14) * r} ${y + Math.sin(a) * (h / 2 + 12) * r}`; }).join(" ")} Z" fill="#fff" stroke="${INK}" stroke-width="5"/>`
    : `<ellipse cx="${x}" cy="${y}" rx="${w / 2 + 18}" ry="${h / 2 + 6}" fill="#fff" stroke="${INK}" stroke-width="5" ${think ? `stroke-dasharray="2 10" stroke-linecap="round"` : ""}/>`;
  const cover = tail && !think ? `<ellipse cx="${x}" cy="${y}" rx="${w / 2 + 14}" ry="${h / 2 + 2}" fill="#fff"/>` : "";
  return `${t}${shape}${cover}<text x="${x}" y="${y - (lines.length - 1) * size * .62 + size * .35}" text-anchor="middle" font-size="${size}" ${FONT} font-weight="${shout ? 800 : 600}" fill="${INK}">${lines.map((l, i) => `<tspan x="${x}" dy="${i ? size * 1.25 : 0}">${esc(l)}</tspan>`).join("")}</text>`;
}
function caption(x, y, text, { w = 420, size = 26, dark = false } = {}) {
  const lines = wrap(text, Math.floor(w / (size * .5)));
  const h = lines.length * size * 1.3 + 26;
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${dark ? INK : CREAM}" stroke="${INK}" stroke-width="4"/><text x="${x + 16}" y="${y + size + 6}" font-size="${size}" ${FONT} font-style="italic" fill="${dark ? CREAM : INK}">${lines.map((l, i) => `<tspan x="${x + 16}" dy="${i ? size * 1.3 : 0}">${esc(l)}</tspan>`).join("")}</text>`;
}
const sfx = (x, y, text, { size = 64, rot = -8, color = GLOW } = {}) => `<text x="${x}" y="${y}" font-size="${size}" ${FONT} font-weight="900" fill="${color}" stroke="${INK}" stroke-width="5" paint-order="stroke" transform="rotate(${rot} ${x} ${y})" letter-spacing="2">${esc(text)}</text>`;

// ---------- page layout ----------
function panel(x, y, w, h, inner) {
  return `<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" overflow="hidden">${inner(w, h)}</svg><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="${INK}" stroke-width="8"/>`;
}
const page = (body, n) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="#fff"/>${body}
  ${n ? `<text x="${W / 2}" y="${H - 18}" text-anchor="middle" font-size="20" ${FONT} fill="#888">${n}</text>` : ""}</svg>`;
const M = 36, G = 22; // margin, gutter



// ===== Chapter 3: The Night Market =====
const FW = W - 2 * M, half = (FW - G) / 2;
const ground = (w, h, y, c = "#1d2140") => `<path d="M 0 ${h} L 0 ${y} Q ${w / 2} ${y - 40} ${w} ${y + 10} L ${w} ${h} Z" fill="${c}"/>`;
const lantern = (x, y, s = 1, c = "#e8503a") => `<g transform="translate(${x} ${y}) scale(${s})"><line x1="0" y1="-60" x2="0" y2="-34" stroke="${INK}" stroke-width="3"/><ellipse cx="0" cy="0" rx="30" ry="36" fill="${c}" stroke="${INK}" stroke-width="4"/><path d="M -30 0 h 60 M -20 -22 q 20 8 40 0 M -20 22 q 20 -8 40 0" stroke="${INK}" stroke-width="2" opacity=".5" fill="none"/><circle r="52" fill="${GLOW}" opacity=".16"/></g>`;
const stall = (x, y, s = 1, col = "#c64b4b") => `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-90" y="-120" width="180" height="120" fill="#4b3a52" stroke="${INK}" stroke-width="4"/><path d="M -110 -120 L -80 -170 L 80 -170 L 110 -120 Z" fill="${col}" stroke="${INK}" stroke-width="4"/><path d="M -70 -120 v -50 M -30 -120 v -50 M 10 -120 v -50 M 50 -120 v -50" stroke="${INK}" stroke-width="2" opacity=".4"/><rect x="-80" y="-60" width="160" height="12" fill="#8a5a33" stroke="${INK}" stroke-width="3"/></g>`;
const bookstack = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">${["#c64b4b", "#4b7ec6", "#e0a43a", "#6bb06b"].map((c, i) => `<rect x="${-50 + i * 4}" y="${-26 * (i + 1)}" width="${100 - i * 8}" height="24" fill="${c}" stroke="${INK}" stroke-width="3"/>`).join("")}</g>`;
const out = [];
const P = (body, n) => out.push(page(body, n));

// Cover
P(`
  ${nightSky(W, H, 71)}${moon(780, 240, 90)}${mountains(W, H, 980)}
  <rect y="1000" width="${W}" height="500" fill="#2a2347"/>
  ${[120, 300, 480, 660, 840].map((x, i) => stall(x, 1250 + (i % 2) * 20, 1.0, ["#c64b4b", "#4b7ec6", "#e0a43a", "#6bb06b", "#9b6bc6"][i])).join("")}
  ${[60, 220, 380, 540, 700, 860].map((x, i) => lantern(x, 900 + (i % 3) * 30, 1.1, ["#e8503a", "#e0a43a", "#d94a8c"][i % 3])).join("")}
  ${kitsu({ x: 480, y: 1400, s: 2.1, face: "surprised", walk: true, hold: "parcel" })}
  <rect x="60" y="70" width="600" height="260" fill="${CREAM}" stroke="${INK}" stroke-width="8"/>
  <text x="90" y="170" font-size="94" ${FONT} font-weight="900" fill="${INK}" letter-spacing="2">KITSU</text>
  <text x="90" y="260" font-size="74" ${FONT} font-weight="900" fill="${SCARF}">DELIVERS</text>
  <text x="90" y="305" font-size="26" ${FONT} fill="${INK}">Chapter 3 · The Night Market</text>
  <text x="${W / 2}" y="${H - 40}" text-anchor="middle" font-size="24" ${FONT} fill="${CREAM}">A Kitsune Original · CC BY 4.0</text>`, 0);

// 1: a parcel that hums
P(`
  ${panel(M, M, FW, 520, (w, h) => `${nightSky(w, h, 73)}${ground(w, h, h - 120)}${house(w * .75, h - 20, 1.1, true)}${kitsu({ x: 260, y: h - 16, s: 1.05, face: "calm", walk: true, hold: "parcel" })}${caption(24, 24, "Some parcels are heavy because of what's in them. This one is heavy because of what it wants.", { w: 600, size: 24 })}`)}
  ${panel(M, M + 520 + G, half, 480, (w, h) => `<rect width="${w}" height="${h}" fill="#e9e1cf"/><rect x="${w / 2 - 110}" y="150" width="220" height="190" fill="#a98a5f" stroke="${INK}" stroke-width="6"/><path d="M ${w / 2 - 110} 245 h 220 M ${w / 2} 150 v 190" stroke="${INK}" stroke-width="4" opacity=".5"/>${sfx(w / 2 + 40, 110, "hmmmm", { size: 56, rot: -4 })}${caption(16, h - 100, "It hums a tune nobody has ever heard, and it gets louder near open doors.", { w: w - 32, size: 20 })}`)}
  ${panel(M + half + G, M + 520 + G, half, 480, (w, h) => `${nightSky(w, h, 75)}${kitsu({ x: 180, y: h - 14, s: 1.15, face: "surprised", lantern: false, hold: "parcel" })}${bubble(w - 170, 120, "No address. No sender. Just a drawing of a stall.", { w: 290, size: 24, tail: [250, 220] })}`)}
  ${panel(M, M + 1000 + 2 * G, FW, 1500 - (M + 1000 + 2 * G) - M - 20, (w, h) => `<rect width="${w}" height="${h}" fill="#2a2347"/>${[0, 1, 2, 3, 4].map((i) => lantern(100 + i * 200, 90 + (i % 2) * 24, 1.2, ["#e8503a", "#e0a43a", "#d94a8c"][i % 3])).join("")}${stall(w - 200, h - 10, 1.1, "#9b6bc6")}${caption(24, h - 110, "The drawing shows the stall with nine lanterns. There is only one night a year with nine.", { w: 600, size: 22 })}`)}`, 1);

// 2: the market opens
P(`
  ${panel(M, M, FW, 600, (w, h) => `${nightSky(w, h, 77)}${mountains(w, h, 350, "#2f3560")}${ground(w, h, 400, "#2a2347")}${[0, 1, 2, 3, 4, 5, 6].map((i) => lantern(70 + i * 140, 150 + (i % 3) * 30, 1, ["#e8503a", "#e0a43a", "#d94a8c"][i % 3])).join("")}${[150, 360, 570, 780].map((x, i) => stall(x, 580, .95, ["#c64b4b", "#4b7ec6", "#e0a43a", "#6bb06b"][i])).join("")}${caption(24, 24, "Once a year, in the pass above the last village, a market appears. It is gone by dawn.", { w: 580 })}`)}
  ${panel(M, M + 600 + G, half, 430, (w, h) => `${nightSky(w, h, 79)}${ground(w, h, h - 100)}${kitsu({ x: 150, y: h - 14, s: .95, face: "happy", walk: true, hold: "parcel" })}${sfx(w - 200, 100, "chime!", { size: 52, rot: 6 })}${bubble(w - 180, h - 120, "Everyone here is a little bit see-through.", { w: 280, size: 22, tail: [300, h - 220], think: true })}`)}
  ${panel(M + half + G, M + 600 + G, half, 430, (w, h) => `<rect width="${w}" height="${h}" fill="#3b2a44"/>${badger({ x: 170, y: h - 14, s: 1 })}${bubble(w - 180, 120, "Fresh moonlight! Six for a button!", { w: 290, size: 26, tail: [230, 230] })}`)}
  ${panel(M, M + 1030 + 2 * G, FW, 1500 - (M + 1030 + 2 * G) - M - 20, (w, h) => `${nightSky(w, h, 81)}${ground(w, h, h - 110, "#2a2347")}${[0, 1, 2].map((i) => stall(160 + i * 300, h - 20, .95, ["#4b7ec6", "#6bb06b", "#c64b4b"][i])).join("")}${kitsu({ x: 460, y: h - 14, s: .78, face: "determined", walk: true, hold: "parcel" })}${bubble(w - 220, 110, "A stall with nine lanterns. Where?", { w: 340, size: 26, tail: [500, h - 240] })}`)}`, 2);

// 3: the hunt
P(`
  ${panel(M, M, half, 500, (w, h) => `<rect width="${w}" height="${h}" fill="#3b2a44"/>${heron({ x: 180, y: h - 14, s: 1.05 })}${bubble(w - 170, 120, "Nine lanterns? Past the paper-fish and the lost umbrellas.", { w: 290, size: 22, tail: [260, 220] })}`)}
  ${panel(M + half + G, M, half, 500, (w, h) => `${nightSky(w, h, 83)}${[0, 1, 2, 3].map((i) => `<g transform="translate(${90 + i * 100} ${200 + (i % 2) * 60})"><path d="M 0 0 Q 40 -40 80 0 Q 40 40 0 0 Z" fill="${["#e8503a", "#4b7ec6", "#e0a43a", "#6bb06b"][i]}" stroke="${INK}" stroke-width="4"/><circle cx="60" cy="-4" r="4" fill="${INK}"/></g>`).join("")}${caption(16, h - 100, "Paper fish swim between the stalls, and nobody minds.", { w: w - 32, size: 20 })}`)}
  ${panel(M, M + 500 + G, FW, 520, (w, h) => `<rect width="${w}" height="${h}" fill="#2a2347"/>${Array.from({ length: 9 }, (_, i) => `<path d="M ${70 + i * 105} 150 Q ${70 + i * 105 + 45} 60 ${70 + i * 105 + 90} 150 Z" fill="${["#c64b4b", "#e0a43a", "#4b7ec6", "#6bb06b", "#9b6bc6"][i % 5]}" stroke="${INK}" stroke-width="4" opacity=".85"/>`).join("")}${kitsu({ x: 220, y: h - 14, s: 1.0, face: "surprised", lantern: false, hold: "parcel" })}${caption(w - 580, h - 120, "Every umbrella here was left behind by someone who was sure they'd come back for it.", { w: 560, size: 22 })}`)}
  ${panel(M, M + 1020 + 2 * G, FW, 1500 - (M + 1020 + 2 * G) - M - 20, (w, h) => `${nightSky(w, h, 85)}${ground(w, h, h - 110, "#2a2347")}${stall(w - 260, h - 20, 1.2, "#e0a43a")}${[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => lantern(w - 420 + i * 40, 90 + (i % 2) * 14, .5, "#e0a43a")).join("")}${kitsu({ x: 200, y: h - 14, s: .8, face: "happy", walk: true, hold: "parcel" })}${sfx(w / 2, 110, "NINE!", { size: 66, rot: -6 })}`)}`, 3);

// 4: the bookbinder
P(`
  ${panel(M, M, FW, 560, (w, h) => `<rect width="${w}" height="${h}" fill="#3a2f33"/>${bookstack(150, h - 30, 1.4)}${bookstack(w - 170, h - 30, 1.2)}${Array.from({ length: 9 }, (_, i) => lantern(70 + i * 105, 70 + (i % 2) * 18, .6, "#e0a43a")).join("")}${crane({ x: w / 2, y: h - 14, s: .95, face: "calm" })}${caption(24, 130, "The bookbinder: very old, very patient, and sewing a book that is holding its breath.", { w: 540, size: 22 })}`)}
  ${panel(M, M + 560 + G, half, 440, (w, h) => `${nightSky(w, h, 87)}${kitsu({ x: 160, y: h - 14, s: 1.05, face: "calm", lantern: false, hold: "parcel" })}${bubble(w - 170, 110, "This was addressed to your stall. I think.", { w: 290, size: 24, tail: [240, 210] })}`)}
  ${panel(M + half + G, M + 560 + G, half, 440, (w, h) => `<rect width="${w}" height="${h}" fill="#e9e1cf"/>${crane({ x: 170, y: h - 14, s: .85, face: "teary" })}${bubble(w - 170, 110, "That's my own thread. I lost it fifty winters ago.", { w: 300, size: 24, tail: [240, 230] })}`)}
  ${panel(M, M + 1000 + 2 * G, FW, 1500 - (M + 1000 + 2 * G) - M - 20, (w, h) => `<rect width="${w}" height="${h}" fill="#f4eede"/><g transform="translate(${w / 2} ${h / 2 + 40})"><rect x="-150" y="-70" width="300" height="140" fill="#a98a5f" stroke="${INK}" stroke-width="6"/><path d="M -150 0 h 300 M 0 -70 v 140" stroke="${INK}" stroke-width="4" opacity=".5"/><circle r="180" fill="${GLOW}" opacity=".18"/></g>${caption(24, 24, "Inside the parcel: a single spool of thread, glowing the colour of the lantern.", { w: 560, size: 22 })}`)}`, 4);

// 5: the stitch
P(`
  ${panel(M, M, FW, 560, (w, h) => `<rect width="${w}" height="${h}" fill="#3a2f33"/>${crane({ x: 240, y: h - 14, s: 1.05, face: "calm" })}<path d="M 330 ${h - 160} C 480 ${h - 260} 600 ${h - 160} 760 ${h - 240}" stroke="${GLOW}" stroke-width="7" fill="none" stroke-dasharray="14 10"/>${stall(w - 180, h - 10, 1.05, "#e0a43a")}${caption(24, 24, "The thread finds the book on its own, and the stitches begin to hum.", { w: 540, size: 22 })}`)}
  ${panel(M, M + 560 + G, half, 440, (w, h) => `<rect width="${w}" height="${h}" fill="#e9e1cf"/><g transform="translate(${w / 2} ${h / 2 + 20})"><rect x="-120" y="-100" width="240" height="190" fill="#c64b4b" stroke="${INK}" stroke-width="6"/><path d="M -120 -100 L 120 -100 M -100 -80 L 100 -80" stroke="${INK}" stroke-width="3" opacity=".4"/></g>${sfx(w - 180, 120, "stitch", { size: 48, rot: -8 })}${caption(16, h - 90, "A book with no title, held shut by something it was afraid to say.", { w: w - 32, size: 20 })}`)}
  ${panel(M + half + G, M + 560 + G, half, 440, (w, h) => `${nightSky(w, h, 89)}${kitsu({ x: 170, y: h - 14, s: 1.1, face: "happy", lantern: false })}${bubble(w - 170, 110, "It breathed out!", { w: 250, size: 30, shout: true, tail: [250, 200] })}`)}
  ${panel(M, M + 1000 + 2 * G, FW, 1500 - (M + 1000 + 2 * G) - M - 20, (w, h) => `<rect width="${w}" height="${h}" fill="#2a2347"/>${Array.from({ length: 30 }, (_, i) => `<circle cx="${(i * 97) % w}" cy="${(i * 53) % h}" r="${2 + (i % 3)}" fill="${GLOW}" opacity=".7"/>`).join("")}<g transform="translate(${w / 2} ${h / 2 + 30})"><rect x="-130" y="-90" width="260" height="180" fill="#c64b4b" stroke="${INK}" stroke-width="6" transform="rotate(-6)"/><path d="M -130 -90 L 130 -90" stroke="${GLOW}" stroke-width="6"/></g>${caption(24, 24, "Every page of it was blank. Every page of it was warm.", { w: 480, size: 24 })}`)}`, 5);

// 6: the dawn
P(`
  ${panel(M, M, FW, 520, (w, h) => `<rect width="${w}" height="${h}" fill="#f6d9b0"/>${mountains(w, h, 380, "#c9a07a")}${[0, 1, 2, 3, 4].map((i) => `<g opacity="${1 - i * .15}" transform="translate(${150 + i * 180} ${400})"><path d="M -60 0 L -50 -100 L 50 -100 L 60 0 Z" fill="#c9a07a" opacity=".5"/></g>`).join("")}${caption(24, 24, "By morning the market is gone. The pass is snow and quiet.", { w: 500 })}`)}
  ${panel(M, M + 520 + G, half, 480, (w, h) => `<rect width="${w}" height="${h}" fill="#f6d9b0"/>${ground(w, h, h - 120, "#c9a07a")}${kitsu({ x: 170, y: h - 20, s: 1.05, face: "happy", lantern: true, walk: true })}${bubble(w - 170, 110, "A blank book. It's the best thing I've ever carried.", { w: 300, size: 24, tail: [240, 200] })}`)}
  ${panel(M + half + G, M + 520 + G, half, 480, (w, h) => `<rect width="${w}" height="${h}" fill="#e9e1cf"/><g transform="translate(${w / 2} ${h / 2 + 30})"><rect x="-120" y="-100" width="240" height="190" fill="#c64b4b" stroke="${INK}" stroke-width="6"/><text x="0" y="10" text-anchor="middle" font-size="40" ${FONT} font-weight="800" fill="${CREAM}">?</text></g>${caption(16, 16, "A name, in thread, just appeared on the cover. It's not Kitsu's.", { w: w - 32, size: 20 })}`)}
  ${panel(M, M + 1000 + 2 * G, FW, 1500 - (M + 1000 + 2 * G) - M - 20, (w, h) => `<rect width="${w}" height="${h}" fill="#f6d9b0"/>${ground(w, h, h - 130, "#c9a07a")}${house(w - 220, h - 20, 1.1, true)}${kitsu({ x: 300, y: h - 14, s: 1, face: "determined", walk: true, hold: "parcel", lantern: true })}${caption(24, 24, "Kitsu knows the street. Kitsu has never once been wrong about an address.", { w: 560, size: 24 })}${bubble(w - 260, h - 170, "To be continued…", { w: 280, size: 30, shout: true })}`)}`, 6);

const dir3 = new URL("../public/originals/kitsu-delivers-3/", import.meta.url);
mkdirSync(dir3, { recursive: true });
out.forEach((svg, i) => writeFileSync(new URL(String(i).padStart(3, "0") + ".svg", dir3), svg));
console.log(`Wrote ${out.length} pages to ${dir3.pathname}`);
