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

const pages = [];

// Cover
pages.push(page(`
  ${nightSky(W, H, 3)}${moon(760, 260, 110)}${mountains(W, H, 1050)}
  <path d="M 0 1500 L 0 1280 Q 500 1180 1000 1300 L 1000 1500 Z" fill="#1d2140"/>
  ${kitsu({ x: 470, y: 1330, s: 2.5, face: "determined", walk: true })}
  <rect x="60" y="70" width="560" height="250" fill="${CREAM}" stroke="${INK}" stroke-width="8"/>
  <text x="90" y="170" font-size="94" ${FONT} font-weight="900" fill="${INK}" letter-spacing="2">KITSU</text>
  <text x="90" y="260" font-size="74" ${FONT} font-weight="900" fill="${SCARF}">DELIVERS</text>
  <text x="90" y="300" font-size="24" ${FONT} fill="${INK}">Chapter 1 · The Letter With No Name</text>
  <text x="${W / 2}" y="${H - 40}" text-anchor="middle" font-size="24" ${FONT} fill="${CREAM}">A Kitsune Original · CC BY 4.0</text>`, 0));

// Page 1: the night roads
pages.push(page(`
  ${panel(M, M, W - 2 * M, 520, (w, h) => `${nightSky(w, h, 5)}${moon(w - 140, 110, 60)}${mountains(w, h, 420)}${house(220, 470, .9)}${house(420, 480, .7)}${house(650, 470, .85, false)}
    ${caption(24, 24, "In the mountain towns, letters travel at night.", { w: 520 })}`)}
  ${panel(M, M + 520 + G, (W - 2 * M - G) * .55, 840, (w, h) => `${nightSky(w, h, 9)}${mountains(w, h, 600, "#2f3560")}<path d="M 0 ${h} L 0 700 Q ${w / 2} 650 ${w} 720 L ${w} ${h} Z" fill="#1d2140"/>
    ${kitsu({ x: w * .45, y: 760, s: 1.55, walk: true })}
    ${caption(20, 24, "Kitsu carries them. She was born in the dark, and she prefers it.", { w: w - 40, size: 24 })}`)}
  ${panel(M + (W - 2 * M - G) * .55 + G, M + 520 + G, (W - 2 * M - G) * .45, 400, (w, h) => `<rect width="${w}" height="${h}" fill="#8a5a33"/><rect x="30" y="80" width="${w - 60}" height="240" rx="18" fill="#a06a3d" stroke="${INK}" stroke-width="6"/>
    <text x="${w / 2}" y="215" text-anchor="middle" font-size="34" ${FONT} font-weight="800" fill="#e8d6a8" letter-spacing="3">ALL LETTERS</text><text x="${w / 2}" y="258" text-anchor="middle" font-size="34" ${FONT} font-weight="800" fill="#e8d6a8" letter-spacing="3">ARRIVE</text>`)}
  ${panel(M + (W - 2 * M - G) * .55 + G, M + 520 + G + 400 + G, (W - 2 * M - G) * .45, 418, (w, h) => `<rect width="${w}" height="${h}" fill="${NIGHT}"/><circle cx="${w / 2}" cy="${h / 2}" r="150" fill="${GLOW}" opacity=".3"/>
    <rect x="${w / 2 - 60}" y="${h / 2 - 80}" width="120" height="160" rx="50" fill="${GLOW}" stroke="${INK}" stroke-width="6"/>
    ${caption(16, h - 120, "Her lantern doesn't light the road. It lights the addresses.", { w: w - 32, size: 22 })}`)}`, 1));

// Page 2: forty letters behave
pages.push(page(`
  ${panel(M, M, (W - 2 * M - G) / 2, 460, (w, h) => `<rect width="${w}" height="${h}" fill="#3a2f4d"/><rect x="40" y="60" width="${w - 80}" height="${h - 60}" fill="#5a4a6a" stroke="${INK}" stroke-width="5"/>
    <rect x="80" y="${h - 40}" width="140" height="18" fill="${CREAM}" stroke="${INK}" stroke-width="3"/>${sfx(220, 150, "shff", { size: 56 })}`)}
  ${panel(M + (W - 2 * M - G) / 2 + G, M, (W - 2 * M - G) / 2, 460, (w, h) => `${nightSky(w, h, 12)}${house(w / 2 + 60, h - 20, .9)}${kitsu({ x: 120, y: h - 10, s: 1.05, face: "happy", lantern: false })}
    ${bubble(w / 2 + 30, 100, "Thirty-nine… forty!", { w: 280, tail: [140, 170] })}`)}
  ${panel(M, M + 460 + G, W - 2 * M, 420, (w, h) => `<rect width="${w}" height="${h}" fill="#2a2f55"/><path d="M 0 ${h} L 0 300 L 260 230 L 520 290 L ${w} 240 L ${w} ${h} Z" fill="#1d2140"/>
    ${kitsu({ x: 230, y: 400, s: 1.15, face: "surprised", lantern: false, hold: "letter" })}
    ${bubble(620, 130, "Huh? There's one more…", { w: 320, tail: [380, 200] })}`)}
  ${panel(M, M + 880 + 2 * G, W - 2 * M, 1500 - (M + 880 + 2 * G) - M - 20, (w, h) => `<rect width="${w}" height="${h}" fill="#e9e1cf"/>${envelope(w / 2, h / 2 + 20, 1.35)}
    ${caption(24, 24, "No name. No address. Only a little lighthouse, drawn in brown ink.", { w: 560 })}
    ${bubble(w - 180, h - 70, "There are no lighthouses in the mountains.", { w: 260, size: 24, think: true, tail: [w - 300, h - 140] })}`)}`, 2));

// Page 3: the glow points east
pages.push(page(`
  ${panel(M, M, W - 2 * M, 560, (w, h) => `<rect width="${w}" height="${h}" fill="${NIGHT}"/>${envelope(w / 2 - 80, h / 2 + 20, 1.25, true, true)}
    ${sfx(w - 260, 120, "glow…", { size: 58, rot: 0 })}
    ${caption(24, h - 100, "In the lantern light, a thread appears, pulling east. Down the mountain. Toward the sea.", { w: 620, size: 24 })}`)}
  ${panel(M, M + 560 + G, (W - 2 * M - G) * .48, 420, (w, h) => `<rect width="${w}" height="${h}" fill="#c9b892"/><rect x="40" y="80" width="${w - 80}" height="230" fill="#a8956c" stroke="${INK}" stroke-width="5"/>
    ${[0, 1, 2].map((i) => `<rect x="${70 + i * 110}" y="110" width="70" height="44" fill="${CREAM}" stroke="${INK}" stroke-width="3" transform="rotate(${i * 6 - 6} ${105 + i * 110} 132)"/>`).join("")}
    ${caption(20, h - 92, "There is a shelf for letters that can't be delivered.", { w: w - 40, size: 22 })}`)}
  ${panel(M + (W - 2 * M - G) * .48 + G, M + 560 + G, (W - 2 * M - G) * .52, 420, (w, h) => `${nightSky(w, h, 21)}${kitsu({ x: w / 2 - 20, y: h + 140, s: 1.6, face: "calm", lantern: false, hold: "letter" })}
    ${bubble(w / 2, 90, "That's a long way…", { w: 250, think: true, tail: [w / 2 + 40, 190] })}`)}
  ${panel(M, M + 980 + 2 * G, W - 2 * M, 1500 - (M + 980 + 2 * G) - M - 20, (w, h) => `<rect width="${w}" height="${h}" fill="${SCARF}"/>${Array.from({ length: 16 }, (_, i) => `<line x1="${w / 2}" y1="${h / 2}" x2="${w / 2 + Math.cos(i / 16 * 6.283) * 900}" y2="${h / 2 + Math.sin(i / 16 * 6.283) * 900}" stroke="#fff" stroke-width="10" opacity=".15"/>`).join("")}
    ${kitsu({ x: 210, y: h + 70, s: 1.25, face: "determined", lantern: false, hold: "letter" })}
    ${bubble(600, h / 2, "Nope. All letters arrive.", { w: 380, size: 38, shout: true })}`)}`, 3));

// Page 4: the road east
pages.push(page(`
  ${panel(M, M, W - 2 * M, 440, (w, h) => `${nightSky(w, h, 31)}<rect y="${h - 170}" width="${w}" height="170" fill="#2c4a73"/>${Array.from({ length: 8 }, (_, i) => `<path d="M ${i * 130} ${h - 120} q 30 -14 60 0" stroke="#7fa3cf" stroke-width="4" fill="none"/>`).join("")}
    <path d="M 300 ${h - 120} L 640 ${h - 120} L 600 ${h - 70} L 340 ${h - 70} Z" fill="#8a5a33" stroke="${INK}" stroke-width="5"/>
    ${heron({ x: 560, y: h - 120, s: .9, flip: true })}${kitsu({ x: 390, y: h - 118, s: .72, face: "happy" })}
    ${bubble(780, 120, "No name? Then how do you know it isn't for me?", { w: 300, size: 24, tail: [610, 240] })}
    ${caption(20, 20, "Night two: the Kagami River.", { w: 330, size: 22, dark: true })}`)}
  ${panel(M, M + 440 + G, (W - 2 * M - G) / 2, 520, (w, h) => `<rect width="${w}" height="${h}" fill="#4a5470"/>${rain(w, h)}<path d="M 0 ${h - 120} L ${w} ${h - 120} L ${w} ${h} L 0 ${h} Z" fill="#33394f"/>
    ${badger({ x: 120, y: h - 60, s: .85 })}${kitsu({ x: 320, y: h - 50, s: .78, face: "calm", lantern: false })}
    ${caption(16, 16, "Night four: rain.", { w: 220, size: 22, dark: true })}
    ${bubble(w / 2 + 40, 140, "Letters with no name are usually apologies.", { w: 300, size: 22, tail: [150, 250] })}`)}
  ${panel(M + (W - 2 * M - G) / 2 + G, M + 440 + G, (W - 2 * M - G) / 2, 520, (w, h) => `<rect width="${w}" height="${h}" fill="#4a5470"/>${rain(w, h)}${kitsu({ x: w / 2, y: h + 60, s: 1.4, face: "happy", lantern: false })}
    ${bubble(w / 2, 120, "The post isn't clever. Just stubborn.", { w: 300, size: 24, tail: [w / 2 + 60, 260] })}`)}
  ${panel(M, M + 960 + 2 * G, W - 2 * M, 1500 - (M + 960 + 2 * G) - M - 20, (w, h) => `${nightSky(w, h, 44)}${mountains(w, h, h - 40, "#2f3560")}
    ${[0, 1, 2, 3].map((i) => kitsu({ x: 150 + i * 200, y: h - 30 - i * 30, s: .45, walk: i % 2 === 0 })).join("")}
    ${caption(24, 24, "Six nights of walking.", { w: 320, size: 24 })}`)}`, 4));

// Page 5: the sea
pages.push(page(`
  ${panel(M, M, W - 2 * M, 300, (w, h) => `${nightSky(w, h, 51)}${mountains(w, h, h - 10, "#2f3560")}${kitsu({ x: w / 2, y: h + 40, s: 1, face: "surprised" })}
    ${sfx(w / 2 + 160, 120, "sniff… salt?", { size: 40, rot: -4, color: "#fff" })}`)}
  ${panel(M, M + 300 + G, W - 2 * M, 1500 - (M + 300 + G) - M - 20, (w, h) => `<rect width="${w}" height="${h}" fill="${NIGHT}"/>${stars(120, w, h * .5, 57)}${moon(220, 200, 90)}
    <rect y="${h * .52}" width="${w}" height="${h * .48}" fill="${SEA}"/>
    ${Array.from({ length: 22 }, (_, i) => `<path d="M ${(i * 173) % w} ${h * .55 + ((i * 61) % (h * .4))} q 26 -10 52 0" stroke="#9fc0e6" stroke-width="4" fill="none" opacity=".7"/>`).join("")}
    <path d="M 220 ${h * .52} L 260 ${h} L 180 ${h} Z" fill="#fdf3cf" opacity=".12"/>
    <path d="M ${w - 420} ${h * .56} Q ${w - 250} ${h * .5} ${w - 80} ${h * .58} L ${w - 80} ${h * .62} L ${w - 420} ${h * .62} Z" fill="#1b1d33"/>
    ${lighthouse(w - 230, h * .56, 1.05, false)}
    <path d="M 0 ${h} L 0 ${h - 180} Q 200 ${h - 260} 420 ${h - 200} L 420 ${h} Z" fill="#1d2140"/>
    ${kitsu({ x: 220, y: h - 210, s: 1.05, face: "surprised" })}
    ${bubble(560, 160, "…the sea!", { w: 220, size: 34, tail: [300, 260] })}
    ${caption(24, h * .45 - 40, "She had never seen it before. It lay under the moon like a sheet of hammered tin.", { w: 520, size: 24 })}`)}`, 5));

// Page 6: the keeper
pages.push(page(`
  ${panel(M, M, (W - 2 * M - G) * .42, 560, (w, h) => `<rect width="${w}" height="${h}" fill="#e6dfcf"/><rect x="60" y="60" width="${w - 120}" height="${h - 60}" fill="#7a5a3a" stroke="${INK}" stroke-width="6"/>
    <circle cx="${w - 100}" cy="${h / 2 + 30}" r="9" fill="${GLOW}" stroke="${INK}" stroke-width="3"/>${sfx(40, 140, "creak", { size: 46, rot: -12, color: "#fff" })}`)}
  ${panel(M + (W - 2 * M - G) * .42 + G, M, (W - 2 * M - G) * .58, 560, (w, h) => `<rect width="${w}" height="${h}" fill="#f2e6cc"/>${crane({ x: w / 2 + 60, y: h + 20, s: 1.15 })}
    ${bubble(170, 110, "You're not the usual post.", { w: 230, size: 26, tail: [w / 2, 200] })}`)}
  ${panel(M, M + 560 + G, W - 2 * M, 380, (w, h) => `<rect width="${w}" height="${h}" fill="#f2e6cc"/>${kitsu({ x: 240, y: h + 30, s: 1.05, face: "calm", lantern: false, hold: "letter" })}
    ${crane({ x: 690, y: h + 140, s: 1 })}
    ${bubble(430, 90, "I'm from the mountains. This is for you.", { w: 320, size: 26, tail: [300, 170] })}`)}
  ${panel(M, M + 940 + 2 * G, W - 2 * M, 1500 - (M + 940 + 2 * G) - M - 20, (w, h) => `<rect width="${w}" height="${h}" fill="#efe1c2"/>
    ${[0, 1, 2, 3].map((i) => `<g transform="translate(${100 + i * 70} ${60 + (i % 2) * 20}) scale(.18) rotate(-6)"><path d="M -50 0 L -32 -270 L 32 -270 L 50 0 Z" fill="none" stroke="#7a4a22" stroke-width="12"/><rect x="-30" y="-320" width="60" height="50" fill="none" stroke="#7a4a22" stroke-width="12"/></g>`).join("")}
    ${crane({ x: w / 2 + 120, y: h + 150, s: 1.15, face: "teary", letter: true })}
    ${bubble(250, 220, "My brother drew lighthouses like that. Always leaning a little to the left.", { w: 330, size: 24, tail: [w / 2 + 40, 300] })}`)}`, 6));

// Page 7: the light
pages.push(page(`
  ${panel(M, M, W - 2 * M, 420, (w, h) => `<rect width="${w}" height="${h}" fill="#f2e6cc"/>${crane({ x: 300, y: h + 180, s: 1.2, face: "teary", letter: true })}
    ${bubble(680, 130, "He says the light was always mine. He only wanted to be asked.", { w: 360, size: 25, tail: [430, 220] })}`)}
  ${panel(M, M + 420 + G, W - 2 * M, 640, (w, h) => `<rect width="${w}" height="${h}" fill="${NIGHT}"/>${stars(80, w, h * .6, 77)}<rect y="${h * .7}" width="${w}" height="${h * .3}" fill="${SEA}"/>
    ${lighthouse(w / 2, h * .74, 1.25, true)}${sfx(w / 2 + 120, 120, "FWOOM", { size: 70, rot: -6 })}
    ${caption(24, h - 110, "That night the lamp burned brighter than it had in forty years.", { w: 540, size: 24, dark: true })}`)}
  ${panel(M, M + 1060 + 2 * G, W - 2 * M, 1500 - (M + 1060 + 2 * G) - M - 20, (w, h) => `${nightSky(w, h, 81)}${mountains(w, h, h - 20, "#2f3560")}
    ${kitsu({ x: w - 260, y: h - 20, s: .95, flip: true, walk: true, hold: "parcel" })}
    ${caption(24, 24, "A parcel for the stationer at Hollow Pine. This time, with a name on it.", { w: 520, size: 22 })}
    <text x="40" y="${h - 40}" font-size="34" ${FONT} font-weight="900" fill="${CREAM}">ALL LETTERS ARRIVE.</text>`)}`, 7));

// Back page
pages.push(page(`
  ${nightSky(W, H, 99)}${moon(W / 2, 420, 120)}${mountains(W, H, 1150)}
  <text x="${W / 2}" y="760" text-anchor="middle" font-size="64" ${FONT} font-weight="900" fill="${CREAM}">END OF CHAPTER 1</text>
  <text x="${W / 2}" y="830" text-anchor="middle" font-size="28" ${FONT} fill="${CREAM}">Read the full story as prose: “The Lantern Courier”</text>
  <text x="${W / 2}" y="1420" text-anchor="middle" font-size="22" ${FONT} fill="${CREAM}">Kitsu Delivers · a Kitsune Original · Creative Commons Attribution 4.0</text>`, 8));

// ---------- story covers (600×900) ----------
function cover(title, sub, art) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 900" width="600" height="900">${art}
    <rect x="30" y="640" width="540" height="200" fill="${CREAM}" stroke="${INK}" stroke-width="6"/>
    <text x="50" y="${title.length > 22 ? 700 : 715}" font-size="${title.length > 22 ? 40 : 48}" ${FONT} font-weight="900" fill="${INK}">${wrap(title, title.length > 22 ? 20 : 18).map((l, i) => `<tspan x="50" dy="${i ? 48 : 0}">${esc(l)}</tspan>`).join("")}</text>
    <text x="50" y="815" font-size="22" ${FONT} fill="${SCARF}" font-weight="700">${esc(sub)}</text></svg>`;
}
const covers = {
  "the-lantern-courier": cover("The Lantern Courier", "A KITSUNE ORIGINAL · STORY", `${nightSky(600, 900, 7)}${moon(450, 160, 70)}${mountains(600, 900, 560)}${kitsu({ x: 260, y: 620, s: 1.35, face: "calm", walk: true })}`),
  "the-library-under-the-lake": cover("The Library Under the Lake", "A KITSUNE ORIGINAL · STORY", `<rect width="600" height="900" fill="#2f5d73"/><rect width="600" height="260" fill="#c9dde3"/><path d="M 0 260 Q 150 240 300 260 T 600 260" fill="none" stroke="#fff" stroke-width="6"/>
    ${Array.from({ length: 14 }, (_, i) => `<rect x="${60 + (i % 7) * 70}" y="${360 + Math.floor(i / 7) * 120}" width="46" height="100" fill="${["#c8283a", "#e3b04b", "#7a6aa8", "#3a9d5d", "#e0702f"][i % 5]}" stroke="${INK}" stroke-width="4" opacity=".75"/>`).join("")}
    <g transform="translate(430 320)"><ellipse rx="70" ry="34" fill="#f08a3c" stroke="${INK}" stroke-width="5"/><path d="M 60 0 L 110 -30 L 110 30 Z" fill="#f08a3c" stroke="${INK}" stroke-width="5"/><circle cx="-40" cy="-6" r="6" fill="${INK}"/><circle cx="-38" cy="-6" r="14" fill="none" stroke="${INK}" stroke-width="3"/></g>
    ${Array.from({ length: 6 }, (_, i) => `<circle cx="${380 - i * 14}" cy="${290 - i * 22}" r="${5 + i}" fill="none" stroke="#fff" stroke-width="3" opacity=".7"/>`).join("")}`),
  "nine-umbrellas": cover("Nine Umbrellas", "A KITSUNE ORIGINAL · STORY", `<rect width="600" height="900" fill="#4a5470"/>${rain(600, 900)}
    ${["#c8283a", "#e3b04b", "#7a6aa8", "#3a9d5d", "#e0702f", "#2c6aa0", "#d36a8f", "#8a5a33", "#1b1d33"].map((c, i) => { const x = 90 + (i % 3) * 210, y = 170 + Math.floor(i / 3) * 150; return `<path d="M ${x - 80} ${y} Q ${x} ${y - 90} ${x + 80} ${y} Z" fill="${c}" stroke="${INK}" stroke-width="5"/><path d="M ${x} ${y} L ${x} ${y + 70} q 0 16 -16 16" stroke="${INK}" stroke-width="5" fill="none"/>`; }).join("")}`),
  "page-zero": cover("Page Zero", "A KITSUNE ORIGINAL · STORY", `<rect width="600" height="900" fill="#e8e1d2"/><rect x="90" y="70" width="420" height="540" fill="#fff" stroke="${INK}" stroke-width="5" transform="rotate(-3 300 340)"/>
    <path d="M 150 140 q 30 -16 60 0" stroke="${INK}" stroke-width="5" fill="none"/>
    <path d="M 470 560 L 560 420" stroke="#e3b04b" stroke-width="16" stroke-linecap="round"/><path d="M 470 560 L 462 584 L 480 568 Z" fill="${INK}"/>`),
};
covers["the-color-thief-of-oz"] = cover("The Color Thief of Oz", "A KITSUNE ORIGINAL · OZ STORY", `<rect width="600" height="900" fill="#6fa3d8"/><rect width="600" height="420" fill="#cfe4f5"/>
    <path d="M 0 420 Q 150 330 300 400 T 600 380 L 600 900 L 0 900 Z" fill="#2f63a8"/><path d="M 0 500 Q 200 430 400 490 T 600 470 L 600 900 L 0 900 Z" fill="#3d7bc4"/>
    <path d="M 0 360 Q 120 300 260 350 L 260 900 L 0 900 Z" fill="#8a8a8a" opacity=".85"/><path d="M 0 470 Q 100 430 200 470 L 200 900 L 0 900 Z" fill="#9a9a9a" opacity=".85"/>
    <path d="M 330 900 L 270 900 Q 300 640 420 470 L 450 470 Q 350 660 330 900 Z" fill="#f0c93a" stroke="#b8901c" stroke-width="3"/>
    <circle cx="470" cy="150" r="70" fill="#7fc97f" opacity=".35"/><path d="M 455 170 L 470 90 L 485 170 Z M 440 170 h 60 v 30 h -60 Z" fill="#3a9d5d"/>
    <path d="M 120 640 L 220 330" stroke="#6b4a2b" stroke-width="7" stroke-linecap="round"/><circle cx="220" cy="360" r="50" fill="#9fd0ff" opacity=".45"/><rect x="200" y="338" width="40" height="52" rx="16" fill="#4a90e2" stroke="${INK}" stroke-width="4"/>`);
covers["madison-of-oz"] = cover("Madison of Oz", "A KITSUNE ORIGINAL · OZ STORY", `<rect width="600" height="900" fill="#1d1a2e"/>${stars(60, 600, 380, 33)}
    <path d="M 0 520 Q 300 470 600 520 L 600 900 L 0 900 Z" fill="#7a7368"/><path d="M 0 560 Q 300 520 600 560" stroke="#5d574e" stroke-width="6" fill="none"/>
    <path d="M 220 520 L 230 380 L 250 380 L 255 300 L 270 300 L 280 230 L 300 160 L 320 230 L 330 300 L 345 300 L 350 380 L 370 380 L 380 520 Z" fill="#2fa36b" opacity=".95"/>
    <circle cx="300" cy="300" r="180" fill="#3ccf8a" opacity=".12"/>
    ${[0, 1, 2, 3].map((i) => `<path d="M 300 420 m -${40 + i * 45} 0 a ${40 + i * 45} ${40 + i * 45} 0 1 1 ${80 + i * 90} 0" fill="none" stroke="#f2a7d8" stroke-width="${4 - i * .6}" opacity="${.7 - i * .14}" stroke-dasharray="${12 + i * 6} ${10 + i * 4}"/>`).join("")}
    <path d="M 90 600 C 200 590 260 640 300 700 C 340 640 400 590 510 600" stroke="#c8283a" stroke-width="3" fill="none" opacity=".6"/>`);
covers["the-cephalotus-of-oz"] = cover("The Cephalotus of Oz", "A KITSUNE ORIGINAL · OZ STORY", `<rect width="600" height="900" fill="#1e3a2a"/><rect width="600" height="900" fill="#2f6b45" opacity=".35"/>
    ${Array.from({ length: 7 }, (_, i) => `<path d="M ${i * 100} 0 L ${i * 100 - 40} 640" stroke="#7fbf8f" stroke-width="2" opacity=".18"/>`).join("")}
    <circle cx="300" cy="380" r="210" fill="#ffe8a8" opacity=".08"/>
    <path d="M 205 610 L 225 500 L 375 500 L 395 610 Z" fill="#b5653a" stroke="#4a2410" stroke-width="5"/><rect x="215" y="488" width="170" height="24" rx="4" fill="#c97a48" stroke="#4a2410" stroke-width="5"/>
    <ellipse cx="300" cy="490" rx="78" ry="12" fill="#3c5e2a"/>
    <g transform="translate(250 490) rotate(-14) scale(1)"><path d="M -26 0 C -34 -40 -30 -78 -18 -92 L 18 -92 C 30 -78 34 -40 26 0 Z" fill="#8f1d2a" stroke="#3a0a10" stroke-width="4"/><path d="M -18 -92 Q 0 -100 18 -92 Q 0 -86 -18 -92 Z" fill="#c9cc8a" stroke="#3a0a10" stroke-width="3"/><path d="M -16 -92 l 2 9" stroke="#f0e6c8" stroke-width="2"/><path d="M -10.7 -92 l 2 9" stroke="#f0e6c8" stroke-width="2"/><path d="M -5.4 -92 l 2 9" stroke="#f0e6c8" stroke-width="2"/><path d="M -0.10000000000000142 -92 l 2 9" stroke="#f0e6c8" stroke-width="2"/><path d="M 5.199999999999999 -92 l 2 9" stroke="#f0e6c8" stroke-width="2"/><path d="M 10.5 -92 l 2 9" stroke="#f0e6c8" stroke-width="2"/><path d="M 15.799999999999997 -92 l 2 9" stroke="#f0e6c8" stroke-width="2"/><path d="M -20 -96 Q -6 -140 22 -128 Q 12 -108 18 -94" fill="#a8323f" stroke="#3a0a10" stroke-width="4"/><path d="M -10 -20 v -60 M 0 -16 v -66 M 10 -20 v -60" stroke="#5c0f18" stroke-width="2" opacity=".6"/></g><g transform="translate(350 490) rotate(14) scale(1)"><path d="M -26 0 C -34 -40 -30 -78 -18 -92 L 18 -92 C 30 -78 34 -40 26 0 Z" fill="#8f1d2a" stroke="#3a0a10" stroke-width="4"/><path d="M -18 -92 Q 0 -100 18 -92 Q 0 -86 -18 -92 Z" fill="#c9cc8a" stroke="#3a0a10" stroke-width="3"/><path d="M -16 -92 l 2 9" stroke="#f0e6c8" stroke-width="2"/><path d="M -10.7 -92 l 2 9" stroke="#f0e6c8" stroke-width="2"/><path d="M -5.4 -92 l 2 9" stroke="#f0e6c8" stroke-width="2"/><path d="M -0.10000000000000142 -92 l 2 9" stroke="#f0e6c8" stroke-width="2"/><path d="M 5.199999999999999 -92 l 2 9" stroke="#f0e6c8" stroke-width="2"/><path d="M 10.5 -92 l 2 9" stroke="#f0e6c8" stroke-width="2"/><path d="M 15.799999999999997 -92 l 2 9" stroke="#f0e6c8" stroke-width="2"/><path d="M -20 -96 Q -6 -140 22 -128 Q 12 -108 18 -94" fill="#a8323f" stroke="#3a0a10" stroke-width="4"/><path d="M -10 -20 v -60 M 0 -16 v -66 M 10 -20 v -60" stroke="#5c0f18" stroke-width="2" opacity=".6"/></g><g transform="translate(300 486) rotate(0) scale(1.18)"><path d="M -26 0 C -34 -40 -30 -78 -18 -92 L 18 -92 C 30 -78 34 -40 26 0 Z" fill="#8f1d2a" stroke="#3a0a10" stroke-width="4"/><path d="M -18 -92 Q 0 -100 18 -92 Q 0 -86 -18 -92 Z" fill="#c9cc8a" stroke="#3a0a10" stroke-width="3"/><path d="M -16 -92 l 2 9" stroke="#f0e6c8" stroke-width="2"/><path d="M -10.7 -92 l 2 9" stroke="#f0e6c8" stroke-width="2"/><path d="M -5.4 -92 l 2 9" stroke="#f0e6c8" stroke-width="2"/><path d="M -0.10000000000000142 -92 l 2 9" stroke="#f0e6c8" stroke-width="2"/><path d="M 5.199999999999999 -92 l 2 9" stroke="#f0e6c8" stroke-width="2"/><path d="M 10.5 -92 l 2 9" stroke="#f0e6c8" stroke-width="2"/><path d="M 15.799999999999997 -92 l 2 9" stroke="#f0e6c8" stroke-width="2"/><path d="M -20 -96 Q -6 -140 22 -128 Q 12 -108 18 -94" fill="#a8323f" stroke="#3a0a10" stroke-width="4"/><path d="M -10 -20 v -60 M 0 -16 v -66 M 10 -20 v -60" stroke="#5c0f18" stroke-width="2" opacity=".6"/></g><g transform="translate(215 494) rotate(-30) scale(0.7)"><path d="M -26 0 C -34 -40 -30 -78 -18 -92 L 18 -92 C 30 -78 34 -40 26 0 Z" fill="#8f1d2a" stroke="#3a0a10" stroke-width="4"/><path d="M -18 -92 Q 0 -100 18 -92 Q 0 -86 -18 -92 Z" fill="#c9cc8a" stroke="#3a0a10" stroke-width="3"/><path d="M -16 -92 l 2 9" stroke="#f0e6c8" stroke-width="2"/><path d="M -10.7 -92 l 2 9" stroke="#f0e6c8" stroke-width="2"/><path d="M -5.4 -92 l 2 9" stroke="#f0e6c8" stroke-width="2"/><path d="M -0.10000000000000142 -92 l 2 9" stroke="#f0e6c8" stroke-width="2"/><path d="M 5.199999999999999 -92 l 2 9" stroke="#f0e6c8" stroke-width="2"/><path d="M 10.5 -92 l 2 9" stroke="#f0e6c8" stroke-width="2"/><path d="M 15.799999999999997 -92 l 2 9" stroke="#f0e6c8" stroke-width="2"/><path d="M -20 -96 Q -6 -140 22 -128 Q 12 -108 18 -94" fill="#a8323f" stroke="#3a0a10" stroke-width="4"/><path d="M -10 -20 v -60 M 0 -16 v -66 M 10 -20 v -60" stroke="#5c0f18" stroke-width="2" opacity=".6"/></g><g transform="translate(385 494) rotate(30) scale(0.7)"><path d="M -26 0 C -34 -40 -30 -78 -18 -92 L 18 -92 C 30 -78 34 -40 26 0 Z" fill="#8f1d2a" stroke="#3a0a10" stroke-width="4"/><path d="M -18 -92 Q 0 -100 18 -92 Q 0 -86 -18 -92 Z" fill="#c9cc8a" stroke="#3a0a10" stroke-width="3"/><path d="M -16 -92 l 2 9" stroke="#f0e6c8" stroke-width="2"/><path d="M -10.7 -92 l 2 9" stroke="#f0e6c8" stroke-width="2"/><path d="M -5.4 -92 l 2 9" stroke="#f0e6c8" stroke-width="2"/><path d="M -0.10000000000000142 -92 l 2 9" stroke="#f0e6c8" stroke-width="2"/><path d="M 5.199999999999999 -92 l 2 9" stroke="#f0e6c8" stroke-width="2"/><path d="M 10.5 -92 l 2 9" stroke="#f0e6c8" stroke-width="2"/><path d="M 15.799999999999997 -92 l 2 9" stroke="#f0e6c8" stroke-width="2"/><path d="M -20 -96 Q -6 -140 22 -128 Q 12 -108 18 -94" fill="#a8323f" stroke="#3a0a10" stroke-width="4"/><path d="M -10 -20 v -60 M 0 -16 v -66 M 10 -20 v -60" stroke="#5c0f18" stroke-width="2" opacity=".6"/></g>
    ${[[150, 200], [460, 170], [110, 360], [500, 330], [420, 90]].map(([x, y], i) => `<g transform="translate(${x} ${y}) rotate(${i * 23 - 30})"><path d="M 0 0 C -30 -26 -52 -6 -40 14 C -26 22 -10 12 0 0 C 10 12 26 22 40 14 C 52 -6 30 -26 0 0 Z" fill="#c9c6d6" opacity=".85"/><path d="M 0 -4 v 18" stroke="#6b6880" stroke-width="3"/></g>`).join("")}
    ${[[240, 470], [362, 470], [300, 468]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7" fill="#e9e6f5" opacity=".9"/><circle cx="${x}" cy="${y}" r="15" fill="#e9e6f5" opacity=".2"/>`).join("")}`);
covers["the-hiccup-of-oz"] = cover("The Hiccup of Oz", "A KITSUNE ORIGINAL · OZ STORY", `<rect width="600" height="900" fill="#1a2440"/><rect y="420" width="600" height="480" fill="#26365e"/>${stars(70, 600, 400, 51)}
    ${[[150, 80, 230], [210, 60, 300], [270, 50, 380], [330, 60, 300], [390, 80, 230], [460, 50, 180], [90, 50, 170]].map(([x, w, h]) => `<path d="M ${x - w / 2} 640 L ${x - w / 2} ${640 - h} L ${x} ${600 - h} L ${x + w / 2} ${640 - h} L ${x + w / 2} 640 Z" fill="#2fa36b" stroke="#1d6b45" stroke-width="3"/>`).join("")}
    <rect y="636" width="600" height="264" fill="#1d6b45"/>
    <circle cx="300" cy="200" r="90" fill="#e8f0a0" opacity=".12"/><circle cx="300" cy="200" r="44" fill="#d9e86a"/><circle cx="300" cy="200" r="30" fill="#f6ffd0"/>
    ${Array.from({ length: 8 }, (_, i) => { const a = i / 8 * 6.283; return `<path d="M ${300 + Math.cos(a) * 54} ${200 + Math.sin(a) * 54} L ${300 + Math.cos(a) * 78} ${200 + Math.sin(a) * 78}" stroke="#f6ffd0" stroke-width="4" stroke-linecap="round"/>`; }).join("")}
    <path d="M 300 248 v 36 m -10 -4 l 10 12 l 10 -12" stroke="#f6ffd0" stroke-width="3" fill="none" opacity=".7"/>`);
covers["the-glass-cat-of-oz"] = cover("The Glass Cat of Oz", "A KITSUNE ORIGINAL · OZ STORY", `<rect width="600" height="900" fill="#1e5a3a"/><rect width="600" height="900" fill="#3fa36b" opacity=".25"/>
    ${[[80, 60, 260], [150, 70, 340], [460, 70, 320], [530, 60, 250]].map(([x, w, h]) => `<path d="M ${x - w / 2} 700 L ${x - w / 2} ${700 - h} L ${x} ${660 - h} L ${x + w / 2} ${700 - h} L ${x + w / 2} 700 Z" fill="#2fa36b" stroke="#1d6b45" stroke-width="3"/>`).join("")}
    <rect x="160" y="520" width="280" height="40" rx="8" fill="#7a2a4a"/>
    <ellipse cx="300" cy="460" rx="110" ry="80" fill="#dff4ff" opacity=".35" stroke="#ffffff" stroke-width="4"/>
    <circle cx="300" cy="340" r="62" fill="#dff4ff" opacity=".35" stroke="#ffffff" stroke-width="4"/>
    <path d="M 250 300 L 258 250 L 280 290 Z M 350 300 L 342 250 L 320 290 Z" fill="#dff4ff" opacity=".45" stroke="#fff" stroke-width="3"/>
    <ellipse cx="300" cy="322" rx="30" ry="18" fill="#f5a8c8" opacity=".85"/>
    <circle cx="280" cy="350" r="8" fill="#2fd07a"/><circle cx="320" cy="350" r="8" fill="#2fd07a"/>
    <path d="M 400 460 q 70 -20 60 -100" stroke="#fff" stroke-width="8" fill="none" opacity=".5"/>
    <path d="M 240 400 l 30 30 l -10 40 l 40 20 l 30 -10 l 20 30 M 270 430 l 40 -10 M 300 480 l -20 20" stroke="#f2c230" stroke-width="5" fill="none" stroke-linecap="round"/>
    <circle cx="300" cy="460" r="12" fill="#d0203a"/><path d="M 292 456 l 16 8" stroke="#f2c230" stroke-width="3"/>`);
covers["winter-post"] = cover("Winter Post", "A KITSUNE ORIGINAL · STORY", `${nightSky(600, 900, 13)}${mountains(600, 900, 540)}
    <path d="M 0 900 L 0 690 Q 300 610 600 700 L 600 900 Z" fill="#e8eef8"/>
    <rect x="452" y="296" width="54" height="36" fill="#3a2a2a"/><path d="M 444 300 L 479 274 L 514 300 Z" fill="#5a4a4a"/><rect x="470" y="306" width="16" height="14" fill="#ffd27a"/>
    ${Array.from({ length: 60 }, (_, i) => `<circle cx="${(i * 97) % 600}" cy="${(i * 151) % 880}" r="${1.5 + (i % 3)}" fill="#fff" opacity=".8"/>`).join("")}
    ${kitsu({ x: 250, y: 640, s: 1.3, face: "calm", walk: true })}`);
const cdir = new URL("../public/originals/covers/", import.meta.url);
mkdirSync(cdir, { recursive: true });
for (const [k, svg] of Object.entries(covers)) writeFileSync(new URL(k + ".svg", cdir), svg);

const dir = new URL("../public/originals/kitsu-delivers-1/", import.meta.url);
mkdirSync(dir, { recursive: true });
pages.forEach((svg, i) => writeFileSync(new URL(String(i).padStart(3, "0") + ".svg", dir), svg));
console.log(`Wrote ${pages.length} pages to ${dir.pathname}`);

// ---------- Blackwood University and Incarnate title cards (600×900) ----------
// Plain typographic cards; these series and their texts belong to their author.
const BW = [
  ["ep01-welcome-to-blackwood", "EPISODE 1", "Welcome to Blackwood"],
  ["ep02-soul-possession", "EPISODE 2", "Soul Possession"],
  ["ep03-canon-event", "EPISODE 3", "Canon Event"],
  ["ep10-give-me-a-fucking-l", "EPISODE 10", "Give Me a Fucking L"],
  ["ep12-hot-girl-hazard", "EPISODE 12", "Hot Girl Hazard"],
  ["oneshot-friendship-festival", "MANGA CHAPTER", "The Friendship Festival"],
  ["horsemen-chronicles-ep1", "HORSEMEN CHRONICLES", "Have It Your Way"],
  ["ep05-seconds", "EPISODE 5", "Seconds"],
  ["ep07-do-not-reply-all", "EPISODE 7", "Do Not Reply All"],
  ["ep14-last-stop-rewrite", "EPISODE 14", "Last Stop Rewrite"],
  ["ep15-arrest-the-survivors", "EPISODE 15", "Arrest the Survivors"],
  ["ep18-your-best-years-are-nonrefundable", "EPISODE 18", "Your Best Years Are Nonrefundable"],
  ["special-eleven-seconds", "SPECIAL EPISODE", "Eleven Seconds"],
  ["pilot-one-cupcake", "PILOT", "One Cupcake"],
  ["ep13-kevin-in-space", "EPISODE 13", "Kevin in Space"],
  ["spinoff-madison-nomad", "SPINOFF", "Madison, Nomad"],
];
const skyline = (seed) => {
  let x = 0, d = "M 0 900 L 0 560", r = seed;
  const rnd = () => ((r = (r * 9301 + 49297) % 233280) / 233280);
  while (x < 600) { const w = 30 + rnd() * 50, h = 380 + rnd() * 180, spire = rnd() > .45; d += ` L ${x} ${h} ${spire ? `L ${x + w / 2} ${h - 70 - rnd() * 90} ` : ""}L ${x + w} ${h}`; x += w; }
  return `<path d="${d} L 600 900 Z" fill="#0d0b10"/>${Array.from({ length: 14 }, (_, i) => `<rect x="${(i * 97 + seed * 13) % 580}" y="${600 + ((i * 53) % 220)}" width="7" height="11" fill="#c9283a" opacity="${.35 + (i % 3) * .2}"/>`).join("")}`;
};
function titleCard({ series, sub, kicker, title, top = "#3a0d18", accent = "#c9283a", art }) {
  const lines = wrap(title, 13);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 900" width="600" height="900">
    <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset=".6" stop-color="#170a12"/><stop offset="1" stop-color="#050406"/></linearGradient></defs>
    <rect width="600" height="900" fill="url(#g)"/>${art}
    <text x="300" y="120" text-anchor="middle" font-size="26" ${FONT} font-weight="800" fill="#e8d9c4" letter-spacing="10">${esc(series)}</text>
    <text x="300" y="150" text-anchor="middle" font-size="16" ${FONT} fill="${accent}" letter-spacing="8">${esc(sub)}</text>
    <text x="300" y="${300 - (lines.length - 1) * 28}" text-anchor="middle" font-size="20" ${FONT} font-weight="700" fill="${accent}" letter-spacing="5">${esc(kicker)}</text>
    <text x="300" y="${360 - (lines.length - 1) * 28}" text-anchor="middle" font-size="54" ${FONT} font-weight="900" fill="#f5ece0">${lines.map((l, j) => `<tspan x="300" dy="${j ? 60 : 0}">${esc(l)}</tspan>`).join("")}</text>
  </svg>`;
}
const bdir = new URL("../public/originals/blackwood/", import.meta.url);
mkdirSync(bdir, { recursive: true });
BW.forEach(([file, kicker, title], i) => writeFileSync(new URL(file + ".svg", bdir), titleCard({ series: "BLACKWOOD", sub: "UNIVERSITY", kicker, title,
  art: `${stars(40, 600, 380, 200 + i)}<circle cx="470" cy="150" r="64" fill="#e8d9c4" opacity=".9"/><circle cx="492" cy="138" r="60" fill="#3a0d18" opacity=".55"/>${skyline(7 + i * 3)}` })));
const idir = new URL("../public/originals/incarnate/", import.meta.url);
mkdirSync(idir, { recursive: true });
writeFileSync(new URL("book-one-act-one.svg", idir), titleCard({ series: "INCARNATE", sub: "THE CORRUPTION SAGA", kicker: "BOOK ONE", title: "Act One", top: "#0f1b2e", accent: "#d9b44a",
  art: `${stars(70, 600, 600, 77)}<circle cx="300" cy="620" r="150" fill="none" stroke="#d9b44a" stroke-width="3" opacity=".6"/><circle cx="300" cy="620" r="105" fill="none" stroke="#d9b44a" stroke-width="2" opacity=".4"/>
    <path d="M 300 470 L 318 600 L 300 770 L 282 600 Z" fill="#d9b44a" opacity=".85"/>${Array.from({ length: 18 }, (_, i) => `<circle cx="${300 + Math.cos(i / 18 * 6.283) * 190}" cy="${620 + Math.sin(i / 18 * 6.283) * 190}" r="3" fill="#8b1a2b"/>`).join("")}` }));
const brdir = new URL("../public/originals/backrooms/", import.meta.url);
mkdirSync(brdir, { recursive: true });
writeFileSync(new URL("no-wind-resistance-draft-4.svg", brdir), titleCard({ series: "BACKROOMS", sub: "NO WIND RESISTANCE", kicker: "SCRIPT · DRAFT 4", title: "No Wind Resistance", top: "#5a5320", accent: "#e8d36a",
  art: `${Array.from({ length: 9 }, (_, i) => `<rect x="${60 + i * 54}" y="420" width="30" height="480" fill="#c9b85a" opacity="${.12 + (i % 3) * .05}"/>`).join("")}<rect x="0" y="720" width="600" height="180" fill="#4a4418"/><rect x="250" y="520" width="100" height="200" fill="#1a1708" stroke="#e8d36a" stroke-width="3"/><rect x="120" y="470" width="360" height="10" fill="#fff8c0" opacity=".7"/>` }));
writeFileSync(new URL("spinoff-ember.svg", idir), titleCard({ series: "INCARNATE", sub: "THE CORRUPTION SAGA", kicker: "A SPINOFF", title: "Ember", top: "#3a1208", accent: "#ff8a3a",
  art: `${stars(50, 600, 500, 91)}<path d="M 300 760 C 210 680 220 590 270 530 C 270 590 300 600 310 560 C 300 500 330 450 360 420 C 350 500 420 540 400 620 C 420 600 430 580 425 555 C 470 620 430 720 300 760 Z" fill="#ff6a1a" opacity=".9"/>
    <path d="M 300 740 C 250 690 260 640 290 610 C 295 650 320 650 325 625 C 350 660 350 710 300 740 Z" fill="#ffd27a"/>
    <path d="M 170 820 Q 300 780 430 820" stroke="#3a8fd9" stroke-width="6" fill="none" opacity=".8"/><path d="M 140 850 Q 300 810 460 850" stroke="#3a8fd9" stroke-width="4" fill="none" opacity=".5"/>` }));
writeFileSync(new URL("spinoff-mind.svg", idir), titleCard({ series: "INCARNATE", sub: "THE CORRUPTION SAGA", kicker: "A SPINOFF", title: "Mind", top: "#0f1a3a", accent: "#7fb6ff",
  art: `${Array.from({ length: 5 }, (_, r) => Array.from({ length: 8 }, (_, c) => { const x = 40 + c * 68, y = 470 + r * 80, hue = (r * 8 + c) % 3; return `<rect x="${x}" y="${y}" width="${18 + ((r + c) % 3) * 8}" height="60" rx="3" fill="${["#7fb6ff", "#e8c870", "#9aa0b4"][hue]}" opacity="${.25 + ((r * 3 + c) % 5) * .12}"/>`; }).join("")).join("")}
    ${[90, 160, 230].map((y) => `<path d="M 0 ${y + 380} H 600" stroke="#2a3a66" stroke-width="2"/>`).join("")}
    <circle cx="300" cy="610" r="70" fill="#e8c870" opacity=".12"/><circle cx="300" cy="610" r="10" fill="#f5e2a0"/>
    <path d="M 300 440 C 270 480 330 520 300 560 C 270 600 330 640 300 680" stroke="#7fb6ff" stroke-width="3" fill="none" stroke-dasharray="6 8" opacity=".8"/>` }));
writeFileSync(new URL("spinoff-unsaid.svg", idir), titleCard({ series: "INCARNATE", sub: "THE CORRUPTION SAGA", kicker: "A SPINOFF", title: "Unsaid", top: "#3a0a0f", accent: "#e04545",
  art: `${Array.from({ length: 22 }, (_, i) => `<rect x="${30 + (i * 53) % 540}" y="${460 + (i * 37) % 380}" width="${26 + (i % 4) * 8}" height="${8 + (i % 3) * 4}" rx="2" fill="#e8e0d4" opacity="${.08 + (i % 5) * .05}" transform="rotate(${(i * 29) % 60 - 30} ${30 + (i * 53) % 540} ${460 + (i * 37) % 380})"/>`).join("")}
    <path d="M 300 450 L 316 470 L 316 760 L 300 790 L 284 760 L 284 470 Z" fill="#c8c8cc" stroke="#2a2a30" stroke-width="3"/>
    <path d="M 300 470 V 770" stroke="#8a8a92" stroke-width="2"/>
    <rect x="252" y="760" width="96" height="14" rx="4" fill="#5a1a1f" stroke="#2a2a30" stroke-width="3"/>
    <rect x="290" y="774" width="20" height="64" fill="#e8e0d4" stroke="#2a2a30" stroke-width="3"/>
    ${[786, 800, 814, 828].map((y) => `<path d="M 292 ${y} h 16" stroke="#8a7a6a" stroke-width="1.5"/>`).join("")}
    <circle cx="300" cy="620" r="150" fill="none" stroke="#e04545" stroke-width="2" opacity=".35"/>` }));
writeFileSync(new URL("spinoff-adored.svg", idir), titleCard({ series: "INCARNATE", sub: "THE CORRUPTION SAGA", kicker: "A SPINOFF", title: "Adored", top: "#4a1a3a", accent: "#ff8ac8",
  art: `<rect y="700" width="600" height="200" fill="#4a4a52"/>${[40, 130, 220, 330, 430, 520].map((x, i) => `<rect x="${x}" y="${700 - 60 - (i % 3) * 30}" width="70" height="${60 + (i % 3) * 30}" fill="#5a5a64" stroke="#2a2a30" stroke-width="3"/>`).join("")}
    <path d="M 300 650 C 210 590 170 530 200 480 C 230 440 280 450 300 490 C 320 450 370 440 400 480 C 430 530 390 590 300 650 Z" fill="#ff6fb3" stroke="#a03070" stroke-width="5"/>
    <path d="M 300 490 L 290 530 L 312 560 L 296 600 L 305 640" stroke="#4a1a3a" stroke-width="5" fill="none" stroke-linejoin="round"/>
    ${Array.from({ length: 14 }, (_, i) => { const x = 70 + (i * 41) % 460, y = 420 + (i * 23) % 90; return `<path d="M ${x} ${y} c -6 -6 -14 0 -8 8 l 8 8 l 8 -8 c 6 -8 -2 -14 -8 -8 Z" fill="#ff8ac8" opacity="${.25 + (i % 4) * .12}"/>`; }).join("")}
    <ellipse cx="300" cy="830" rx="90" ry="8" fill="#ff8ac8" opacity=".25"/>` }));
writeFileSync(new URL("spinoff-leash.svg", idir), titleCard({ series: "INCARNATE", sub: "THE CORRUPTION SAGA", kicker: "A SPINOFF", title: "Leash", top: "#1a1a24", accent: "#d8d4e8",
  art: `${Array.from({ length: 16 }, (_, i) => { const ex = 20 + i * 37, ey = 430 + (i % 4) * 20; return `<path d="M 300 760 C ${300 + (ex - 300) * .3} 640 ${ex} ${ey + 120} ${ex} ${ey}" stroke="#d8d4e8" stroke-width="1.6" fill="none" opacity="${.25 + (i % 3) * .15}"/>`; }).join("")}
    <path d="M 300 760 C 330 700 380 690 420 640" stroke="#d8d4e8" stroke-width="2.4" fill="none"/><path d="M 432 622 C 450 600 470 590 500 560" stroke="#d8d4e8" stroke-width="2.4" fill="none" stroke-dasharray="4 6"/>
    <path d="M 262 860 C 250 820 258 790 270 770 L 276 740 C 278 728 290 728 290 740 L 292 765 L 296 730 C 298 718 310 718 310 730 L 310 765 L 316 735 C 318 724 330 724 330 736 L 328 770 L 336 750 C 340 740 352 744 348 756 L 340 800 C 336 830 326 850 320 860 Z" fill="#e8e4f0" stroke="#4a4660" stroke-width="3"/>
    <circle cx="300" cy="760" r="6" fill="#ffffff"/>` }));
writeFileSync(new URL("spinoff-first-war.svg", idir), titleCard({ series: "INCARNATE", sub: "THE CORRUPTION SAGA", kicker: "A PREQUEL", title: "The First War", top: "#26262c", accent: "#b8b8c4",
  art: `<rect y="700" width="600" height="200" fill="#3a3a42"/>${Array.from({ length: 30 }, (_, i) => `<circle cx="${(i * 97) % 600}" cy="${440 + (i * 53) % 250}" r="${1 + (i % 3)}" fill="#9a9aa6" opacity=".5"/>`).join("")}
    <path d="M 300 430 C 286 500 316 560 296 620 C 284 660 308 690 300 720" stroke="#0a0a0c" stroke-width="16" fill="none" stroke-linecap="round"/>
    <path d="M 300 430 C 286 500 316 560 296 620 C 284 660 308 690 300 720" stroke="#c8c8d4" stroke-width="3" fill="none" opacity=".7"/>
    <path d="M 296 620 C 330 650 360 690 350 760 C 346 790 330 820 320 840" stroke="#0a0a0c" stroke-width="7" fill="none" stroke-linecap="round"/>
    <path d="M 420 840 L 470 690 C 486 650 520 640 530 600 C 506 630 476 640 456 680 Z" fill="#d8d8e0" stroke="#4a4a54" stroke-width="3"/><path d="M 420 840 L 466 700" stroke="#4a4a54" stroke-width="2"/>` }));
writeFileSync(new URL("spinoff-hermitage.svg", idir), titleCard({ series: "INCARNATE", sub: "THE CORRUPTION SAGA", kicker: "A SPINOFF", title: "Hermitage", top: "#3a3630", accent: "#e8d8b0",
  art: `<path d="M 0 900 L 0 760 Q 300 600 600 760 L 600 900 Z" fill="#6a6658"/>
    <rect x="250" y="620" width="100" height="80" fill="#9a9488" stroke="#3a3630" stroke-width="4"/><path d="M 236 624 L 300 570 L 364 624 Z" fill="#5a5448" stroke="#3a3630" stroke-width="4"/>
    <rect x="288" y="650" width="26" height="50" fill="#3a3630"/><rect x="262" y="636" width="16" height="16" fill="#ffd27a"/><circle cx="270" cy="644" r="20" fill="#ffd27a" opacity=".15"/>
    <path d="M 340 572 v -24 h 12 v 24" fill="#5a5448" stroke="#3a3630" stroke-width="3"/>${[0, 1, 2].map((i) => `<circle cx="${346 + i * 6}" cy="${534 - i * 16}" r="${5 + i * 2}" fill="#d8d0c0" opacity="${.4 - i * .1}"/>`).join("")}
    <path d="M 150 860 L 300 840 L 450 860 L 450 880 L 300 862 L 150 880 Z" fill="#f0e8d4" stroke="#3a3630" stroke-width="3"/><path d="M 300 840 V 862" stroke="#3a3630" stroke-width="2"/>
    ${[0, 1, 2].map((i) => `<path d="M ${170 + i * 0} ${862 + 0} " />`).join("")}
    <path d="M 420 846 L 470 760 C 480 740 504 734 510 712 C 494 730 474 736 462 760 Z" fill="#2a2620" stroke="#3a3630" stroke-width="2"/>` }));
writeFileSync(new URL("spinoff-hunger.svg", idir), titleCard({ series: "INCARNATE", sub: "THE CORRUPTION SAGA", kicker: "A SPINOFF", title: "Hunger", top: "#3a120a", accent: "#e8a070",
  art: `<path d="M 0 900 L 0 440 L 90 470 L 150 560 L 170 700 L 230 760 L 370 760 L 430 700 L 450 560 L 510 470 L 600 440 L 600 900 Z" fill="#8a3a22"/>
    <path d="M 0 900 L 0 520 L 70 560 L 120 660 L 150 780 L 450 780 L 480 660 L 530 560 L 600 520 L 600 900 Z" fill="#6a2a18"/>
    <ellipse cx="300" cy="780" rx="140" ry="26" fill="#0a0a0c"/><ellipse cx="300" cy="776" rx="120" ry="14" fill="#2a2a34" opacity=".8"/>
    <path d="M 300 770 V 708" stroke="#e8d8c0" stroke-width="5"/><circle cx="300" cy="700" r="9" fill="#e8d8c0"/>
    <path d="M 432 760 V 690 C 432 676 446 676 446 690" stroke="#1a1a20" stroke-width="4" fill="none"/>
    <path d="M 390 690 Q 432 640 474 690 Z" fill="#1a1a20"/>${[398, 416, 432, 448, 466].map((x, i) => `<circle cx="${x}" cy="${700 + (i % 2) * 14}" r="3" fill="#6a8ab0" opacity=".8"/>`).join("")}` }));
writeFileSync(new URL("spinoff-conquest.svg", idir), titleCard({ series: "INCARNATE", sub: "THE CORRUPTION SAGA", kicker: "A SPINOFF", title: "Conquest", top: "#3a3420", accent: "#f0d060",
  art: `<rect y="740" width="600" height="160" fill="#7a6a4a"/><rect y="730" width="600" height="14" fill="#9a8a6a"/>
    <path d="M 170 640 L 170 560 L 210 600 L 250 540 L 290 600 L 330 540 L 370 600 L 410 560 L 410 640 Z" fill="#f5d84a" stroke="#a08020" stroke-width="4" stroke-linejoin="round"/>
    ${[[210, 615], [290, 618], [370, 615]].map(([x, y]) => `<path d="M ${x} ${y - 12} l 4 9 l 10 1 l -8 6 l 3 10 l -9 -6 l -9 6 l 3 -10 l -8 -6 l 10 -1 Z" fill="#8a4ac8"/>`).join("")}
    <path d="M 410 560 L 404 590" stroke="#a08020" stroke-width="3"/>
    <ellipse cx="300" cy="712" rx="62" ry="16" fill="none" stroke="#3a2a14" stroke-width="7"/>
    ${Array.from({ length: 14 }, (_, i) => { const a = i / 14 * 6.283, x = 300 + Math.cos(a) * 62, y = 712 + Math.sin(a) * 16; return `<path d="M ${x} ${y} l ${Math.cos(a) * 10} ${Math.sin(a) * 6 - 6}" stroke="#3a2a14" stroke-width="3"/>`; }).join("")}` }));
writeFileSync(new URL("spinoff-void.svg", idir), titleCard({ series: "INCARNATE", sub: "THE CORRUPTION SAGA", kicker: "A SPINOFF", title: "Void", top: "#2a2a2e", accent: "#c8c8d0",
  art: `<rect x="90" y="440" width="420" height="420" fill="#d8d6d0" opacity=".14" stroke="#c8c8d0" stroke-width="2" stroke-opacity=".3"/>
    <circle cx="250" cy="720" r="13" fill="#9a9aa4"/><path d="M 236 790 Q 238 740 250 736 Q 262 740 264 790 Z" fill="#9a9aa4"/>
    <circle cx="350" cy="720" r="13" fill="#e8e6f0"/><path d="M 336 790 Q 338 740 350 736 Q 362 740 364 790 Z" fill="#e8e6f0"/>
    <path d="M 262 760 Q 300 772 338 760" stroke="#c8c8d0" stroke-width="3" fill="none"/>
    <path d="M 300 690 C 296 650 310 620 330 600 C 318 630 316 660 304 692 Z" fill="#1a1a1e" stroke="#4a4a54" stroke-width="2"/><path d="M 300 692 L 322 606" stroke="#4a4a54" stroke-width="1.5"/>` }));
writeFileSync(new URL("spinoff-main-character.svg", idir), titleCard({ series: "INCARNATE", sub: "THE CORRUPTION SAGA", kicker: "A SPINOFF", title: "Main Character", top: "#0a2a3a", accent: "#5ad8ff",
  art: `<rect y="760" width="600" height="140" fill="#123040"/>
    ${Array.from({ length: 9 }, (_, i) => `<path d="M ${60 + i * 60} 760 q 14 -40 0 -80" stroke="#5ad8ff" stroke-width="3" fill="none" opacity="${0.25 + (i % 3) * 0.2}"/>`).join("")}
    <circle cx="300" cy="610" r="70" fill="#0d1d28" stroke="#5ad8ff" stroke-width="4"/>
    <path d="M 262 600 Q 300 680 338 600 Q 300 630 262 600 Z" fill="#5ad8ff"/>
    ${[0, 1, 2, 3, 4, 5, 6].map((i) => `<path d="M ${270 + i * 10} 612 l 4 12 l 4 -12" fill="#e8f8ff"/>`).join("")}
    <path d="M 240 560 Q 300 520 360 560" stroke="#ff8ac8" stroke-width="10" fill="none" stroke-linecap="round"/>` }));
writeFileSync(new URL("spinoff-vessel.svg", idir), titleCard({ series: "INCARNATE", sub: "THE CORRUPTION SAGA", kicker: "A SPINOFF", title: "Vessel", top: "#0a2a2a", accent: "#4ad8c8",
  art: `<path d="M 300 480 C 230 480 210 560 220 640 C 230 720 260 800 300 800 C 340 800 370 720 380 640 C 390 560 370 480 300 480 Z" fill="#2a6a64" stroke="#4ad8c8" stroke-width="3"/>
    <circle cx="272" cy="600" r="14" fill="#9af8f0"/><circle cx="328" cy="600" r="14" fill="#9af8f0"/>
    <path d="M 240 520 Q 300 470 360 520 L 360 500 Q 300 450 240 500 Z" fill="#eef"/>
    ${[[230, 680], [370, 650], [250, 740], [350, 730]].map(([x, y]) => `<path d="M ${x} ${y} l 12 6 l -4 10 l -10 -4 Z" fill="#0a2a2a" stroke="#4ad8c8" stroke-width="1.5"/>`).join("")}
    <path d="M 290 680 Q 300 690 310 680" stroke="#0a2a2a" stroke-width="3" fill="none"/>` }));
writeFileSync(new URL("spinoff-relapse.svg", idir), titleCard({ series: "INCARNATE", sub: "THE CORRUPTION SAGA", kicker: "A SPINOFF", title: "Relapse", top: "#2a0a0e", accent: "#ff4a5a",
  art: `<rect x="210" y="600" width="180" height="120" rx="14" fill="#c8323e" stroke="#ff4a5a" stroke-width="3"/>
    <rect x="210" y="600" width="180" height="34" rx="10" fill="#e8e8ec"/>
    ${[[250, 670], [290, 690], [330, 662], [270, 700], [350, 696]].map(([x, y]) => `<path d="M ${x} ${y - 12} l 9 12 l -9 12 l -9 -12 Z" fill="#0a0a0e" stroke="#ff4a5a" stroke-width="1.5"/>`).join("")}
    <path d="M 440 760 q 20 -40 50 -20 q -10 30 -50 20 Z M 470 742 l 6 -16 l 6 16" fill="#e07a2a"/>
    <text x="300" y="800" text-anchor="middle" font-family="monospace" font-size="26" fill="#ff4a5a" opacity=".8">DAY 41</text>
    <path d="M 254 788 L 346 806" stroke="#ff4a5a" stroke-width="3"/>` }));
writeFileSync(new URL("spinoff-experiment.svg", idir), titleCard({ series: "INCARNATE", sub: "THE CORRUPTION SAGA", kicker: "A SPINOFF", title: "Experiment", top: "#2a1020", accent: "#e0b0ff",
  art: `<path d="M 240 520 h 120 v 40 q 40 30 40 120 v 80 q 0 30 -30 30 h -140 q -30 0 -30 -30 v -80 q 0 -90 40 -120 Z" fill="#e0b0ff" opacity=".12" stroke="#e0b0ff" stroke-width="3"/>
    ${[[280, 640], [320, 680], [300, 720], [270, 700], [330, 630]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${9 + i % 3 * 3}" fill="#fff4e0" opacity="${0.55 + i * 0.08}"/>`).join("")}
    <text x="300" y="590" text-anchor="middle" font-family="monospace" font-size="30" fill="#e0b0ff">Nº 9</text>
    <path d="M 290 480 l 10 -26 l 10 26 Z" fill="#1a0a14" stroke="#e0b0ff" stroke-width="2"/><path d="M 300 454 L 300 430" stroke="#e0b0ff" stroke-width="2"/>` }));
writeFileSync(new URL("spinoff-static.svg", idir), titleCard({ series: "INCARNATE", sub: "THE CORRUPTION SAGA", kicker: "A SCREENPLAY", title: "Static", top: "#141a2a", accent: "#6ab0ff",
  art: `<rect x="150" y="500" width="300" height="220" rx="22" fill="#1e2638" stroke="#6ab0ff" stroke-width="4"/>
    ${Array.from({ length: 22 }, (_, i) => `<rect x="${170 + (i * 37) % 260}" y="${520 + (i * 53) % 180}" width="${8 + (i % 4) * 6}" height="3" fill="#cfe4ff" opacity="${0.3 + (i % 5) * 0.12}"/>`).join("")}
    <circle cx="270" cy="610" r="10" fill="#6ab0ff"/><circle cx="330" cy="610" r="10" fill="#6ab0ff"/>
    <path d="M 300 720 L 300 780 M 240 800 L 360 800" stroke="#6ab0ff" stroke-width="5"/>
    <path d="M 470 560 l 22 -10 M 470 600 l 30 0 M 470 640 l 22 10" stroke="#6ab0ff" stroke-width="3" opacity=".6"/>` }));
writeFileSync(new URL("spinoff-chalk.svg", idir), titleCard({ series: "INCARNATE", sub: "THE CORRUPTION SAGA", kicker: "A SPINOFF", title: "Chalk", top: "#1a1410", accent: "#e8e4d8",
  art: `<rect y="720" width="600" height="180" fill="#2a1e16"/>
    <path d="M 160 720 L 160 560 L 300 470 L 440 560 L 440 720 Z" fill="#6a2018" stroke="#3a120c" stroke-width="4"/>
    <path d="M 260 720 L 260 620 L 340 620 L 340 720 Z" fill="#0a0806"/>
    <ellipse cx="300" cy="790" rx="150" ry="34" fill="none" stroke="#e8e4d8" stroke-width="4" stroke-dasharray="14 8"/>
    <ellipse cx="300" cy="790" rx="96" ry="20" fill="none" stroke="#e8e4d8" stroke-width="3"/>
    <path d="M 270 790 L 330 790 M 300 772 L 300 808" stroke="#e8e4d8" stroke-width="3"/>
    <circle cx="300" cy="790" r="5" fill="#0a0806" stroke="#e8e4d8" stroke-width="2"/>` }));
writeFileSync(new URL("spinoff-plan-b.svg", idir), titleCard({ series: "INCARNATE", sub: "THE CORRUPTION SAGA", kicker: "A SPINOFF", title: "Plan B", top: "#101418", accent: "#c8e0e8",
  art: `<rect x="190" y="470" width="220" height="300" rx="10" fill="#c8b890" stroke="#6a5a3a" stroke-width="3"/>
    ${Array.from({ length: 9 }, (_, i) => `<rect x="215" y="${510 + i * 26}" width="${110 + (i * 41) % 60}" height="4" fill="#6a3020" opacity=".7"/>`).join("")}
    <text x="215" y="500" font-family="monospace" font-size="18" fill="#6a3020">LOG 0</text>
    <path d="M 390 760 l 60 -110 l 22 12 l -60 110 Z" fill="#c8e0e8" opacity=".85"/>
    <path d="M 380 790 Q 300 840 220 800" stroke="#a02020" stroke-width="5" fill="none"/>` }));
writeFileSync(new URL("spinoff-encore.svg", idir), titleCard({ series: "INCARNATE", sub: "THE CORRUPTION SAGA", kicker: "A SEQUEL", title: "Encore", top: "#0a1a3a", accent: "#5ad8ff",
  art: `<path d="M 230 560 L 250 500 L 280 540 L 300 490 L 320 540 L 350 500 L 370 560 Z" fill="#f0d060" stroke="#a08020" stroke-width="3"/>
    <rect x="120" y="600" width="360" height="12" fill="#e8c840" opacity=".5"/>
    ${Array.from({ length: 12 }, (_, i) => `<circle cx="${140 + i * 29}" cy="${700 + (i % 3) * 18}" r="9" fill="#5ad8ff" opacity=".7"/><rect x="${133 + i * 29}" y="${712 + (i % 3) * 18}" width="14" height="40" rx="5" fill="#2a4a6a"/>`).join("")}
    <path d="M 100 820 Q 200 790 300 830 T 500 815" stroke="#3a2a1a" stroke-width="14" fill="none"/>` }));
writeFileSync(new URL("spinoff-best-friends.svg", idir), titleCard({ series: "INCARNATE", sub: "THE CORRUPTION SAGA", kicker: "A SPINOFF", title: "Best Friends", top: "#16202a", accent: "#8ab8e0",
  art: `<rect x="170" y="560" width="260" height="170" rx="10" fill="#2a3a4a" stroke="#8ab8e0" stroke-width="3"/>
    <rect x="190" y="580" width="220" height="110" fill="#c8e0f8" opacity=".25"/>
    <circle cx="300" cy="635" r="22" fill="#8ab8e0" opacity=".8"/><circle cx="292" cy="630" r="4" fill="#16202a"/><circle cx="308" cy="630" r="4" fill="#16202a"/>
    ${[0, 1, 2].map((i) => `<text x="300" y="${770 + i * 28}" text-anchor="middle" font-family="monospace" font-size="17" fill="#8ab8e0" opacity="${0.9 - i * 0.3}">we're still best friends</text>`).join("")}` }));
writeFileSync(new URL("spinoff-sponsor.svg", idir), titleCard({ series: "INCARNATE", sub: "THE CORRUPTION SAGA", kicker: "A SPINOFF", title: "Sponsor", top: "#1a1612", accent: "#e0b060",
  art: `${[0, 1, 2, 3, 4, 5].map((i) => { const a = i / 6 * 6.283, x = 300 + Math.cos(a) * 120, y = 650 + Math.sin(a) * 50; return `<path d="M ${x - 14} ${y} h 28 v -26 h -28 Z M ${x - 14} ${y} v 26 M ${x + 14} ${y} v 26" fill="#5a4a3a" stroke="#e0b060" stroke-width="2"/>`; }).join("")}
    <rect x="262" y="760" width="76" height="40" rx="6" fill="#3a6aa0" stroke="#e0b060" stroke-width="2"/>
    <path d="M 338 780 Q 420 780 440 720 Q 460 660 520 650" stroke="#e0b060" stroke-width="3" fill="none" stroke-dasharray="6 6"/>` }));
writeFileSync(new URL("spinoff-remade.svg", idir), titleCard({ series: "INCARNATE", sub: "THE CORRUPTION SAGA", kicker: "A SPINOFF", title: "Remade", top: "#1a1020", accent: "#5ad8ff",
  art: `<path d="M 300 480 C 250 480 230 530 235 580 C 240 640 270 680 300 680 C 330 680 360 640 365 580 C 370 530 350 480 300 480 Z" fill="#2a1a30" stroke="#5ad8ff" stroke-width="3"/>
    <circle cx="275" cy="575" r="12" fill="#5ad8ff"/><circle cx="325" cy="575" r="12" fill="#5ad8ff"/>
    <path d="M 220 720 Q 300 680 380 720 L 400 820 L 200 820 Z" fill="#2a1a30" stroke="#5ad8ff" stroke-width="3"/>
    <circle cx="300" cy="755" r="10" fill="#9af0ff"/><circle cx="300" cy="755" r="22" fill="none" stroke="#5ad8ff" stroke-width="2" opacity=".5"/>
    <path d="M 120 840 Q 300 800 480 840" stroke="#6a3a20" stroke-width="20" fill="none"/>` }));
writeFileSync(new URL("spinoff-fresh-meat.svg", brdir), titleCard({ series: "BACKROOMS", sub: "NO WIND RESISTANCE", kicker: "A PREQUEL", title: "Fresh Meat", top: "#5a5320", accent: "#e8d36a",
  art: `<rect x="250" y="460" width="22" height="380" fill="#6a5a30"/><rect x="328" y="460" width="22" height="380" fill="#6a5a30"/>
    ${Array.from({ length: 8 }, (_, i) => `<rect x="250" y="${490 + i * 44}" width="100" height="9" fill="#8a7a40"/>`).join("")}
    <rect x="230" y="440" width="140" height="22" fill="#e8d36a" opacity=".85"/>
    <path d="M 340 520 l 26 -10 l 6 14 l -26 10 Z" fill="#e8c8a0"/><path d="M 262 800 l -20 10 l 4 12 l 22 -8 Z" fill="#e8c8a0"/>
    <path d="M 0 840 Q 150 800 300 850 T 600 830 L 600 900 L 0 900 Z" fill="#2a2a1a"/>` }));
writeFileSync(new URL("spinoff-base-beta.svg", brdir), titleCard({ series: "BACKROOMS", sub: "NO WIND RESISTANCE", kicker: "A SPINOFF", title: "Base Beta", top: "#2a2e30", accent: "#d8c890",
  art: `<circle cx="300" cy="680" r="150" fill="#5a6064" stroke="#d8c890" stroke-width="5"/>
    <circle cx="300" cy="680" r="110" fill="#4a5054" stroke="#8a8a80" stroke-width="3"/>
    ${[0, 1, 2, 3, 4, 5].map((i) => { const a = i / 6 * 6.283; return `<path d="M 300 680 L ${300 + Math.cos(a) * 80} ${680 + Math.sin(a) * 80}" stroke="#d8c890" stroke-width="7" stroke-linecap="round"/>`; }).join("")}
    <circle cx="300" cy="680" r="18" fill="#d8c890"/>
    <circle cx="470" cy="520" r="26" fill="#f0d040"/><path d="M 470 546 Q 476 600 466 640" stroke="#ccc" stroke-width="2" fill="none"/>
    <path d="M 458 516 a 3 3 0 1 0 0.1 0 M 482 516 a 3 3 0 1 0 0.1 0 M 458 528 Q 470 540 482 528" stroke="#222" stroke-width="2.5" fill="none"/>` }));
writeFileSync(new URL("spinoff-inventory.svg", brdir), titleCard({ series: "BACKROOMS", sub: "NO WIND RESISTANCE", kicker: "A SPINOFF", title: "Inventory", top: "#3a2a18", accent: "#f0c060",
  art: `<rect x="170" y="480" width="260" height="320" rx="8" fill="#e8dcc0" stroke="#7a5a30" stroke-width="4"/>
    ${Array.from({ length: 10 }, (_, i) => `<rect x="195" y="${510 + i * 26}" width="${120 + (i * 37) % 80}" height="4" fill="${i % 4 === 3 ? "#c03030" : "#5a4a30"}" opacity=".75"/><rect x="380" y="${508 + i * 26}" width="26" height="6" fill="#5a4a30" opacity=".6"/>`).join("")}
    <path d="M 300 800 l 0 -320" stroke="#7a5a30" stroke-width="3"/>
    <path d="M 410 760 q 30 -8 40 18 q -20 14 -40 -18 Z" fill="#f0d040"/>
    <circle cx="200" cy="790" r="14" fill="#f0c060"/><circle cx="200" cy="790" r="6" fill="#3a2a18"/>` }));
writeFileSync(new URL("spinoff-party-favor.svg", brdir), titleCard({ series: "BACKROOMS", sub: "NO WIND RESISTANCE", kicker: "A SPINOFF", title: "Party Favor", top: "#4a3a10", accent: "#ffd84a",
  art: `<ellipse cx="300" cy="650" rx="90" ry="110" fill="#f0d040" stroke="#a08020" stroke-width="3"/>
    <path d="M 225 660 Q 300 720 375 660" stroke="#8a1a1a" stroke-width="7" fill="none"/>
    <path d="M 255 540 L 300 440 L 345 540 Z" fill="#e84a8a"/><circle cx="300" cy="440" r="9" fill="#5ad8ff"/>
    ${[[150, 520, "#e84a4a"], [460, 560, "#4a8ae8"], [130, 700, "#4ae88a"], [470, 740, "#e8a04a"]].map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="28" fill="${c}" opacity=".85"/><path d="M ${x} ${y + 28} q 6 40 -4 80" stroke="#ddd" stroke-width="2" fill="none"/>`).join("")}
    ${Array.from({ length: 30 }, (_, i) => `<rect x="${(i * 97) % 560 + 20}" y="${(i * 53) % 400 + 440}" width="8" height="4" fill="${["#e84a8a", "#5ad8ff", "#ffd84a", "#4ae88a"][i % 4]}" transform="rotate(${i * 23} ${(i * 97) % 560 + 20} ${(i * 53) % 400 + 440})"/>`).join("")}` }));
writeFileSync(new URL("spinoff-uncut.svg", idir), titleCard({ series: "INCARNATE", sub: "THE CORRUPTION SAGA", kicker: "A NOVEL", title: "Uncut", top: "#06142a", accent: "#5ad8ff",
  art: `<rect x="200" y="460" width="200" height="380" rx="30" fill="#0a3a4a" opacity=".55" stroke="#5ad8ff" stroke-width="4"/>
    <path d="M 300 520 C 260 560 260 640 300 700 C 340 640 340 560 300 520 Z" fill="#5ad8ff" opacity=".35"/>
    ${Array.from({ length: 14 }, (_, i) => `<circle cx="${230 + (i * 47) % 140}" cy="${820 - i * 26}" r="${3 + i % 4}" fill="#9af0ff" opacity=".6"/>`).join("")}
    <path d="M 270 486 L 282 462 L 294 480 L 300 456 L 306 480 L 318 462 L 330 486 Z" fill="#f0d060"/>
    ${[0, 1, 2, 3, 4].map((i) => `<path d="M ${120 + i * 4} ${560 + i * 50} q ${-30 - i * 6} 20 0 40" stroke="#5ad8ff" stroke-width="3" fill="none" opacity="${0.7 - i * 0.12}"/><path d="M ${480 - i * 4} ${560 + i * 50} q ${30 + i * 6} 20 0 40" stroke="#5ad8ff" stroke-width="3" fill="none" opacity="${0.7 - i * 0.12}"/>`).join("")}` }));
writeFileSync(new URL("spinoff-only-child.svg", idir), titleCard({ series: "INCARNATE", sub: "THE CORRUPTION SAGA", kicker: "A SPINOFF", title: "Only Child", top: "#1a2a1a", accent: "#f0e060",
  art: `<rect x="200" y="740" width="200" height="90" rx="10" fill="#8a4a2a" stroke="#5a2a1a" stroke-width="4"/>
    <path d="M 300 740 L 300 600" stroke="#5a3a1a" stroke-width="10"/>
    ${[[250, 590, 70], [340, 560, 80], [300, 510, 70], [230, 640, 50], [370, 640, 55]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#2a6a2a" opacity=".9"/>`).join("")}
    <ellipse cx="330" cy="600" rx="18" ry="14" fill="#f0e060" stroke="#a09020" stroke-width="2"/>
    <rect x="120" y="470" width="80" height="100" fill="#e8e0d0" transform="rotate(-8 160 520)"/><circle cx="148" cy="510" r="12" fill="#6a4a3a" transform="rotate(-8 160 520)"/><circle cx="175" cy="514" r="9" fill="#6a4a3a" transform="rotate(-8 160 520)"/>` }));
writeFileSync(new URL("spinoff-wall-of-string.svg", idir), titleCard({ series: "INCARNATE", sub: "THE CORRUPTION SAGA", kicker: "A SPINOFF", title: "Wall of String", top: "#1a1414", accent: "#e04040",
  art: `<rect x="110" y="460" width="380" height="380" fill="#c8b48a" opacity=".9"/>
    ${[[170, 520], [420, 500], [150, 760], [440, 780], [300, 470], [200, 640], [410, 650]].map(([x, y]) => `<rect x="${x - 22}" y="${y - 16}" width="44" height="32" fill="#f0ece0" stroke="#888" stroke-width="1"/><circle cx="${x}" cy="${y - 16}" r="4" fill="#e04040"/><path d="M ${x} ${y - 16} L 300 650" stroke="#e04040" stroke-width="2"/>`).join("")}
    <rect x="270" y="620" width="60" height="70" fill="#fff"/><path d="M 280 628 L 290 616 L 300 626 L 310 616 L 320 628 Z" fill="#f0d060"/>
    ${[0, 1, 2, 3, 4, 5, 6].map((i) => `<rect x="${140 + i * 50}" y="852" width="10" height="34" fill="#111"/><path d="M ${145 + i * 50} 852 q -5 -12 0 -20 q 5 8 0 20" fill="#ff9a3a"/>`).join("")}` }));
writeFileSync(new URL("spinoff-last-rites.svg", idir), titleCard({ series: "INCARNATE", sub: "THE CORRUPTION SAGA", kicker: "A SPINOFF", title: "Last Rites", top: "#18181c", accent: "#c8b8a8",
  art: `<path d="M 60 720 L 540 640" stroke="#4a4a50" stroke-width="40"/><path d="M 60 690 L 540 610" stroke="#a8a8b0" stroke-width="6"/>
    <circle cx="260" cy="610" r="16" fill="#e8e8f0"/><path d="M 244 690 Q 246 630 260 626 Q 274 630 276 690 Z" fill="#e8e8f0"/>
    <circle cx="330" cy="598" r="16" fill="#8a6a5a"/><path d="M 314 678 Q 316 618 330 614 Q 344 618 346 678 Z" fill="#8a6a5a" stroke="#c8b8a8" stroke-width="2" stroke-dasharray="4 3"/>
    <path d="M 276 660 Q 295 672 314 655" stroke="#c8b8a8" stroke-width="5" fill="none"/>
    <path d="M 420 500 q 14 -10 26 0 q -6 10 -26 0 Z M 446 500 l 10 -6 l -2 10 Z" fill="#7ab0c8"/>
    ${Array.from({ length: 12 }, (_, i) => `<circle cx="${80 + i * 45}" cy="${470 + (i % 3) * 20}" r="${3 + (i % 2) * 2}" fill="#ffe8a0" opacity="${0.2 + (i % 4) * 0.1}"/>`).join("")}` }));
writeFileSync(new URL("spinoff-mermaid.svg", idir), titleCard({ series: "INCARNATE", sub: "THE CORRUPTION SAGA", kicker: "A SPINOFF", title: "Mermaid", top: "#14243a", accent: "#f0d060",
  art: `<rect x="230" y="500" width="140" height="300" fill="#8a9aa8" stroke="#5a6a78" stroke-width="3"/>
    <ellipse cx="300" cy="500" rx="80" ry="40" fill="#a8b8c8" stroke="#5a6a78" stroke-width="3"/>
    <text x="300" y="510" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="17" fill="#2a3a58">HATTIEVILLE</text>
    <path d="M 220 520 L 200 800 M 380 520 L 400 800" stroke="#5a6a78" stroke-width="5"/>
    <rect x="276" y="740" width="48" height="60" fill="#3a4a58"/><rect x="270" y="760" width="60" height="8" fill="#c8a040"/>
    <path d="M 270 440 L 282 412 L 294 432 L 300 404 L 306 432 L 318 412 L 330 440 Z" fill="#f0d060" stroke="#a08020" stroke-width="2"/>` }));
writeFileSync(new URL("spinoff-sorry.svg", idir), titleCard({ series: "INCARNATE", sub: "THE CORRUPTION SAGA", kicker: "A SPINOFF", title: "Sorry", top: "#0a2a24", accent: "#7ae8c8",
  art: `<rect x="120" y="760" width="360" height="40" fill="#2a8a6a" opacity=".5"/>
    ${Array.from({ length: 9 }, (_, i) => `<path d="M ${150 + i * 35} ${480 + (i % 3) * 30} l ${-20 + (i % 2) * 40} 60 l 20 -10 Z" fill="#c8f0e8" opacity=".55"/>`).join("")}
    <circle cx="300" cy="700" r="16" fill="#1a1a2a" stroke="#7ae8c8" stroke-width="2"/><circle cx="294" cy="698" r="4" fill="#7ae8c8"/><path d="M 302 692 l 8 8" stroke="#7ae8c8" stroke-width="2"/>
    <path d="M 284 716 L 240 770 M 316 716 L 360 770" stroke="#1a1a2a" stroke-width="10" stroke-linecap="round"/>
    <text x="300" y="840" text-anchor="middle" font-family="monospace" font-size="20" fill="#7ae8c8" opacity=".75">sorry, nine</text>` }));
writeFileSync(new URL("spinoff-prophecy.svg", idir), titleCard({ series: "INCARNATE", sub: "THE CORRUPTION SAGA", kicker: "A SPINOFF", title: "Prophecy", top: "#2a0808", accent: "#ff5a4a",
  art: `<rect x="180" y="470" width="240" height="320" fill="#e8d8b8" stroke="#8a6a3a" stroke-width="3" transform="rotate(-4 300 630)"/>
    ${Array.from({ length: 10 }, (_, i) => `<rect x="205" y="${500 + i * 26}" width="${150 + (i * 31) % 40}" height="4" fill="#4a2a1a" opacity=".7" transform="rotate(-4 300 630)"/>`).join("")}
    <path d="M 210 560 L 380 556" stroke="#1a1a1a" stroke-width="8" transform="rotate(-4 300 630)"/>
    <text x="300" y="590" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="22" fill="#1a1a1a" transform="rotate(-4 300 630)">BULLSHIT</text>
    <path d="M 300 800 Q 260 740 290 690 Q 300 720 320 700 Q 350 760 300 800 Z" fill="#ff5a4a"/><path d="M 300 800 Q 286 770 300 744 Q 314 770 300 800 Z" fill="#ffd060"/>` }));
writeFileSync(new URL("spinoff-leftovers.svg", idir), titleCard({ series: "INCARNATE", sub: "THE CORRUPTION SAGA", kicker: "A SPINOFF", title: "Leftovers", top: "#06142a", accent: "#5ad8ff",
  art: `${Array.from({ length: 7 }, (_, i) => `<path d="M ${160 + i * 45} ${780 - (i % 3) * 20} l ${30 + (i % 2) * 20} -${70 + (i * 13) % 50} l 25 ${60 + (i * 7) % 30} Z" fill="#2a6a5a" opacity=".55" stroke="#5ad8ff" stroke-width="2"/>`).join("")}
    <path d="M 240 600 L 262 552 L 284 592 L 300 540 L 316 592 L 338 556 L 360 600 Z" fill="#f0d060" transform="rotate(14 300 580)"/>
    <path d="M 296 560 L 304 600" stroke="#06142a" stroke-width="4"/>
    <ellipse cx="300" cy="820" rx="200" ry="22" fill="#2a8a6a" opacity=".45"/>` }));
writeFileSync(new URL("spinoff-margin-notes.svg", idir), titleCard({ series: "INCARNATE", sub: "THE CORRUPTION SAGA", kicker: "A SPINOFF", title: "Margin Notes", top: "#1a1a1e", accent: "#e8e8f0",
  art: `<rect x="170" y="470" width="260" height="330" rx="6" fill="#d8d0c0" stroke="#5a5a60" stroke-width="3"/>
    ${Array.from({ length: 11 }, (_, i) => `<rect x="195" y="${500 + i * 25}" width="${140 + (i * 29) % 60}" height="3" fill="#2a2a30" opacity=".7"/>`).join("")}
    <text x="300" y="788" text-anchor="middle" font-family="serif" font-style="italic" font-size="20" fill="#2a2a30">note: I got attached</text>
    ${Array.from({ length: 22 }, (_, i) => `<circle cx="${420 + (i * 17) % 90}" cy="${520 + (i * 41) % 280}" r="${2 + i % 3}" fill="#9a9aa0" opacity=".7"/>`).join("")}
    <path d="M 440 470 L 470 440 L 478 448 L 448 478 Z" fill="#2a2a30"/>` }));
writeFileSync(new URL("spinoff-the-flock.svg", brdir), titleCard({ series: "BACKROOMS", sub: "NO WIND RESISTANCE", kicker: "A SPINOFF", title: "The Flock", top: "#0a1a3a", accent: "#6aa8ff",
  art: `<ellipse cx="300" cy="640" rx="95" ry="120" fill="#f4f2ee" stroke="#a0a8b8" stroke-width="3"/>
    <ellipse cx="262" cy="610" rx="18" ry="11" fill="#0a1a3a"/><ellipse cx="338" cy="610" rx="18" ry="11" fill="#0a1a3a"/>
    <path d="M 286 640 L 300 676 L 314 640 Z" fill="#4a7ad8"/>
    <path d="M 220 560 Q 226 640 214 700" stroke="#c8a8a0" stroke-width="5" fill="none" opacity=".8"/>
    <path d="M 430 790 Q 470 700 520 660 Q 480 740 430 790 Z" fill="#6aa8ff"/><path d="M 430 790 L 515 665" stroke="#2a4a8a" stroke-width="2"/>` }));
writeFileSync(new URL("spinoff-last-slice.svg", idir), titleCard({ series: "INCARNATE", sub: "THE CORRUPTION SAGA", kicker: "A SPINOFF", title: "Last Slice", top: "#020208", accent: "#5ad8ff",
  art: `<path d="M 170 760 L 300 520 L 430 760 Z" fill="#f0e0c0" stroke="#c8a870" stroke-width="3"/>
    <path d="M 170 760 L 430 760 L 430 800 L 170 800 Z" fill="#e8a8c8"/>
    <path d="M 300 520 L 300 470" stroke="#f0f0f0" stroke-width="6"/>
    <path d="M 300 470 q -12 -20 0 -40 q 12 20 0 40" fill="none" stroke="#9a9aa8" stroke-width="3" opacity=".7"/>
    ${Array.from({ length: 18 }, (_, i) => `<circle cx="${60 + (i * 89) % 480}" cy="${430 + (i * 57) % 420}" r="2" fill="#5ad8ff" opacity="${0.15 + (i % 4) * 0.1}"/>`).join("")}
    <path d="M 255 840 L 270 818 L 284 834 L 300 812 L 316 834 L 330 818 L 345 840 Z" fill="#f0d060" opacity=".75" transform="rotate(10 300 830)"/>` }));
writeFileSync(new URL("spinoff-spatial-shift.svg", brdir), titleCard({ series: "BACKROOMS", sub: "NO WIND RESISTANCE", kicker: "A SPINOFF", title: "Spatial Shift", top: "#14141c", accent: "#7ad0ff",
  art: `<rect x="150" y="480" width="300" height="300" fill="#1e1e2a" stroke="#3a3a4a" stroke-width="4"/>
    ${Array.from({ length: 8 }, (_, i) => `<rect x="160" y="${492 + i * 36}" width="280" height="22" fill="#2e2e3e"/>`).join("")}
    <rect x="260" y="820" width="80" height="12" rx="4" fill="#3a3a4a"/>
    <path d="M 270 730 h 60 v 70 q 0 14 -14 14 h -32 q -14 0 -14 -14 Z" fill="#c8c0a8" opacity=".9"/>
    <rect x="276" y="742" width="48" height="50" fill="#7ad0ff" opacity=".55"/>
    <text x="300" y="870" text-anchor="middle" font-family="monospace" font-size="22" fill="#7ad0ff" opacity=".7">3:04 AM</text>` }));
writeFileSync(new URL("episode-corbenic.svg", brdir), titleCard({ series: "BACKROOMS", sub: "NO WIND RESISTANCE", kicker: "NEXT EPISODE", title: "Corbenic", top: "#1a1a22", accent: "#8ad8ff",
  art: `<circle cx="190" cy="500" r="46" fill="#e8eef8" opacity=".85"/><circle cx="300" cy="470" r="62" fill="#f4f8ff" opacity=".95"/><circle cx="420" cy="505" r="40" fill="#dce6f4" opacity=".8"/>
    <rect x="0" y="760" width="600" height="140" fill="#5a5a60" opacity=".55"/>
    <path d="M 120 760 L 132 690 M 132 690 L 104 660 M 132 690 L 160 668 L 176 672" stroke="#121216" stroke-width="7" fill="none" stroke-linecap="round"/>
    <path d="M 330 780 l 10 -30 h 120 l 20 30 Z" fill="#6a2a22"/><rect x="320" y="778" width="170" height="26" rx="6" fill="#7a3428"/><circle cx="350" cy="806" r="12" fill="#121216"/><circle cx="462" cy="806" r="12" fill="#121216"/>
    <path d="M 280 560 L 280 760 M 316 560 L 316 760" stroke="#8ad8ff" stroke-width="3" opacity=".9"/>
    ${Array.from({ length: 8 }, (_, i) => `<path d="M 280 ${580 + i * 24} H 316" stroke="#8ad8ff" stroke-width="3" opacity="${0.9 - i * 0.08}"/>`).join("")}` }));
writeFileSync(new URL("spinoff-statue.svg", idir), titleCard({ series: "INCARNATE", sub: "THE CORRUPTION SAGA", kicker: "A SPINOFF", title: "Statue", top: "#1e1c1a", accent: "#e8d8b0",
  art: `<rect x="170" y="760" width="260" height="60" fill="#6a665e"/><rect x="150" y="820" width="300" height="24" fill="#5a564e"/>
    <path d="M 230 760 L 238 600 Q 240 560 262 556 Q 284 560 286 600 L 292 760 Z" fill="#9a968c"/><circle cx="262" cy="535" r="24" fill="#9a968c"/>
    <path d="M 330 760 L 334 610 Q 336 576 354 572 Q 372 576 374 610 L 380 760 Z" fill="#8a867c"/><circle cx="354" cy="552" r="21" fill="#8a867c"/><rect x="340" y="532" width="28" height="7" rx="3" fill="#f0d060"/>
    <path d="M 284 630 L 330 640" stroke="#9a968c" stroke-width="12" stroke-linecap="round"/>
    <path d="M 330 640 L 352 646" stroke="#c8c8d0" stroke-width="5"/>
    <text x="300" y="880" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="24" fill="#1a1a1a" transform="rotate(-3 300 880)">BULLSHIT <tspan font-size="20">:)</tspan></text>
    <path d="M 215 868 L 390 860" stroke="#1a1a1a" stroke-width="0"/>` }));
writeFileSync(new URL("spinoff-sundays.svg", brdir), titleCard({ series: "BACKROOMS", sub: "NO WIND RESISTANCE", kicker: "A SPINOFF", title: "Sundays", top: "#2a1e14", accent: "#ffd84a",
  art: `<rect x="140" y="700" width="320" height="100" rx="22" fill="#5a3a2a"/><rect x="120" y="660" width="70" height="140" rx="20" fill="#6a4a36"/><rect x="410" y="660" width="70" height="140" rx="20" fill="#6a4a36"/>
    <path d="M 250 520 q 50 -40 100 0 q 20 60 -10 120 q -40 20 -80 0 q -30 -60 -10 -120 Z" fill="#e8c8a8" stroke="#8a6a50" stroke-width="3"/>
    <path d="M 272 570 h 18 M 312 570 h 18" stroke="#2a1e14" stroke-width="4" stroke-linecap="round"/>
    <path d="M 266 606 Q 300 640 334 606" stroke="#8a1a1a" stroke-width="4" fill="none"/>
    <path d="M 340 524 l 30 -18 l 4 36 Z" fill="#c8a888" opacity=".8"/>
    <rect x="390" y="610" width="34" height="70" rx="8" fill="#5ad84a" opacity=".85"/>` }));
console.log("Wrote Blackwood and Incarnate title cards");
