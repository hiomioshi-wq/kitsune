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



// ===== Chapter 2: The Reply =====
const FW = W - 2 * M; // full panel width
const half = (FW - G) / 2;
const ground = (w, h, y, c = "#1d2140") => `<path d="M 0 ${h} L 0 ${y} Q ${w / 2} ${y - 40} ${w} ${y + 10} L ${w} ${h} Z" fill="${c}"/>`;
const stormSky = (w, h) => `<rect width="${w}" height="${h}" fill="#1c2038"/><path d="M 0 0 H ${w} V ${h * .45} Q ${w * .7} ${h * .3} ${w * .4} ${h * .5} T 0 ${h * .4} Z" fill="#2c3252"/>${rain(w, h)}`;
const river = (w, h, y) => `<rect y="${y}" width="${w}" height="${h - y}" fill="#2c4a73"/>${Array.from({ length: 9 }, (_, i) => `<path d="M ${i * 120 - 20} ${y + 50 + (i % 3) * 36} q 30 -14 60 0 q 30 14 60 0" stroke="#7aa6d8" stroke-width="4" fill="none" opacity=".6"/>`).join("")}`;
const shelf = (w, h) => `<rect width="${w}" height="${h}" fill="#c9b892"/><rect x="30" y="${h * .35}" width="${w - 60}" height="26" fill="#8a5a33" stroke="${INK}" stroke-width="4"/>${Array.from({ length: 9 }, (_, i) => `<rect x="${60 + i * ((w - 150) / 9)}" y="${h * .35 - 44}" width="54" height="40" fill="${CREAM}" stroke="${INK}" stroke-width="3" transform="rotate(${(i % 3) * 5 - 5} ${80 + i * ((w - 150) / 9)} ${h * .35 - 24})"/>`).join("")}`;

const out = [];
const P = (body, n) => out.push(page(body, n));

// Cover
P(`
  ${nightSky(W, H, 41)}${moon(230, 250, 100)}${mountains(W, H, 1000)}
  <rect y="1050" width="${W}" height="450" fill="#2c4a73"/>${Array.from({ length: 12 }, (_, i) => `<path d="M ${i * 90 - 20} ${1110 + (i % 4) * 70} q 24 -12 48 0 q 24 12 48 0" stroke="#7aa6d8" stroke-width="5" fill="none" opacity=".55"/>`).join("")}
  ${lighthouse(780, 1060, 1.1, true)}
  ${kitsu({ x: 440, y: 1300, s: 2.3, face: "happy", walk: true, hold: "letter" })}
  <rect x="60" y="70" width="600" height="260" fill="${CREAM}" stroke="${INK}" stroke-width="8"/>
  <text x="90" y="170" font-size="94" ${FONT} font-weight="900" fill="${INK}" letter-spacing="2">KITSU</text>
  <text x="90" y="260" font-size="74" ${FONT} font-weight="900" fill="${SCARF}">DELIVERS</text>
  <text x="90" y="305" font-size="26" ${FONT} fill="${INK}">Chapter 2 · The Reply</text>
  <text x="${W / 2}" y="${H - 40}" text-anchor="middle" font-size="24" ${FONT} fill="${CREAM}">A Kitsune Original · CC BY 4.0</text>`, 0);

// 1: the lighthouse, and a reply
P(`
  ${panel(M, M, FW, 560, (w, h) => `${nightSky(w, h, 43)}${river(w, h, 400)}${lighthouse(w * .72, 420, 1.1, true)}
    ${caption(24, 24, "The sea is a long way from the mountains. A letter has to be answered all the same.", { w: 560 })}`)}
  ${panel(M, M + 560 + G, half, 460, (w, h) => `<rect width="${w}" height="${h}" fill="#e9e1cf"/><rect x="40" y="270" width="${w - 80}" height="150" fill="#8a5a33" stroke="${INK}" stroke-width="5"/>${crane({ x: 150, y: 430, s: .9, face: "calm" })}
    ${envelope(w - 120, 330, .5)}${bubble(w - 190, 90, "I drew it on the envelope so you would know it was me.", { w: 290, size: 24, tail: [250, 190] })}`)}
  ${panel(M + half + G, M + 560 + G, half, 460, (w, h) => `<rect width="${w}" height="${h}" fill="#f4eede"/>${envelope(w / 2, h / 2 + 10, 1.05, true)}
    ${caption(16, 16, "A reply. Addressed, for once, to nobody in particular.", { w: w - 32, size: 22 })}`)}
  ${panel(M, M + 1040 + 2 * G, FW, 1500 - (M + 1040 + 2 * G) - M - 20, (w, h) => `${nightSky(w, h, 47)}${ground(w, h, h - 110)}${kitsu({ x: 300, y: h - 20, s: .95, face: "determined", walk: true, hold: "letter" })}
    ${bubble(w - 240, 100, "All letters arrive. Even the ones going backwards.", { w: 360, size: 28, tail: [420, 150] })}`)}`, 1);

// 2: the storm
P(`
  ${panel(M, M, FW, 500, (w, h) => `${stormSky(w, h)}${mountains(w, h, 420, "#232846")}${kitsu({ x: 300, y: 470, s: 1.1, face: "surprised", walk: true, hold: "letter" })}${sfx(w - 280, 130, "KRAKOOM", { size: 66, rot: -6 })}`)}
  ${panel(M, M + 500 + G, half, 520, (w, h) => `${stormSky(w, h)}${ground(w, h, 400, "#171a30")}${kitsu({ x: 200, y: 470, s: 1.2, face: "determined", walk: true, lantern: true, hold: "letter" })}
    ${caption(20, h - 100, "Rain makes a lantern shy. It makes a letter shy too.", { w: w - 40, size: 22 })}`)}
  ${panel(M + half + G, M + 500 + G, half, 520, (w, h) => `<rect width="${w}" height="${h}" fill="#26304f"/>${envelope(w / 2, 230, 1.0, false)}<path d="M 120 120 q 40 60 0 110 M 300 140 q 30 50 0 90" stroke="#7fc3ff" stroke-width="10" fill="none" opacity=".7"/>
    ${bubble(w / 2, h - 110, "The ink! It's running!", { w: 300, size: 32, shout: true, tail: [w / 2, 300] })}`)}
  ${panel(M, M + 1040 + 2 * G, FW, 1500 - (M + 1040 + 2 * G) - M - 20, (w, h) => `${stormSky(w, h)}${river(w, h, h - 230)}${kitsu({ x: 250, y: h - 230, s: .9, face: "surprised", walk: false, hold: "letter" })}
    <path d="M ${w - 400} ${h - 200} L ${w - 100} ${h - 200} L ${w - 130} ${h - 150} L ${w - 370} ${h - 150} Z" fill="#8a5a33" stroke="${INK}" stroke-width="5"/>
    ${caption(w - 600, 20, "The river is up. The ferry is tied. The ferryman is asleep.", { w: 560, size: 24 })}`)}`, 2);

// 3: the ferry
P(`
  ${panel(M, M, FW, 560, (w, h) => `${stormSky(w, h)}${river(w, h, 300)}<path d="M 220 330 L 760 330 L 720 410 L 260 410 Z" fill="#8a5a33" stroke="${INK}" stroke-width="6"/>${heron({ x: 560, y: 330, s: 1.1, flip: true })}${kitsu({ x: 330, y: 330, s: .85, face: "surprised", lantern: true, hold: "letter" })}
    ${bubble(w - 250, 100, "Ferry's closed, little one. Weather.", { w: 340, size: 28, tail: [620, 220] })}`)}
  ${panel(M, M + 560 + G, half, 430, (w, h) => `<rect width="${w}" height="${h}" fill="#e9e1cf"/>${kitsu({ x: 160, y: h - 20, s: .95, face: "determined", lantern: false, hold: "letter" })}${bubble(w - 170, 120, "It's addressed to nobody. So it can't wait.", { w: 280, size: 26, tail: [260, 220] })}`)}
  ${panel(M + half + G, M + 560 + G, half, 430, (w, h) => `<rect width="${w}" height="${h}" fill="#26304f"/>${heron({ x: 220, y: h - 10, s: 1.15 })}${bubble(w - 160, 110, "…Nobody in particular?", { w: 250, size: 28, tail: [300, 190] })}${caption(16, h - 90, "The heron has carried the mail across this river for forty years.", { w: w - 32, size: 20 })}`)}
  ${panel(M, M + 990 + 2 * G, FW, 1500 - (M + 990 + 2 * G) - M - 20, (w, h) => `${stormSky(w, h)}${river(w, h, h - 250)}<path d="M 200 ${h - 220} L 800 ${h - 220} L 760 ${h - 150} L 240 ${h - 150} Z" fill="#8a5a33" stroke="${INK}" stroke-width="6"/>${heron({ x: 620, y: h - 220, s: .95, flip: true })}${kitsu({ x: 360, y: h - 220, s: .8, face: "happy", lantern: true, hold: "letter" })}${sfx(110, 120, "SPLASH", { size: 60 })}`)}`, 3);

// 4: the far bank, the umbrella shop
P(`
  ${panel(M, M, FW, 480, (w, h) => `${stormSky(w, h)}${ground(w, h, 330)}${house(220, 400, 1.2, true)}${house(560, 410, .9, false)}${kitsu({ x: 820, y: 440, s: .9, face: "calm", walk: true, hold: "letter" })}${caption(24, 24, "The far bank. Every window dark but one.", { w: 460 })}`)}
  ${panel(M, M + 480 + G, FW, 520, (w, h) => `<rect width="${w}" height="${h}" fill="#3b2f33"/>${Array.from({ length: 9 }, (_, i) => `<path d="M ${70 + i * 105} 110 Q ${70 + i * 105 + 45} 20 ${70 + i * 105 + 90} 110 Z" fill="${["#c64b4b", "#e0a43a", "#4b7ec6", "#6bb06b", "#9b6bc6"][i % 5]}" stroke="${INK}" stroke-width="4"/><line x1="${115 + i * 105}" y1="110" x2="${115 + i * 105}" y2="190" stroke="${INK}" stroke-width="5"/>`).join("")}
    ${badger({ x: 260, y: h - 20, s: 1.2 })}${kitsu({ x: 720, y: h - 20, s: 1.05, face: "surprised", lantern: false, hold: "letter" })}${bubble(w / 2 + 40, 250, "Letter for nobody? Come in, come in. I have an umbrella for exactly that.", { w: 420, size: 26, tail: [300, 340] })}`)}
  ${panel(M, M + 1000 + 2 * G, half, 1500 - (M + 1000 + 2 * G) - M - 20, (w, h) => `<rect width="${w}" height="${h}" fill="#4c3e45"/><path d="M 40 ${h - 40} Q ${w / 2} 20 ${w - 40} ${h - 40} Z" fill="#e0a43a" stroke="${INK}" stroke-width="6"/><path d="M ${w / 2} 100 L ${w / 2} ${h - 40}" stroke="${INK}" stroke-width="5"/>${caption(16, 16, "Number nine. Painted with a small sun on the inside.", { w: w - 32, size: 20 })}`)}
  ${panel(M + half + G, M + 1000 + 2 * G, half, 1500 - (M + 1000 + 2 * G) - M - 20, (w, h) => `${stormSky(w, h)}${ground(w, h, h - 90)}${kitsu({ x: 200, y: h - 20, s: .85, face: "happy", lantern: true, hold: null })}<path d="M 90 150 Q 220 40 350 150 Z" fill="#e0a43a" stroke="${INK}" stroke-width="5"/><path d="M 220 100 V 260" stroke="${INK}" stroke-width="5"/>${bubble(w - 190, h - 110, "It stops the rain from reading over my shoulder.", { w: 290, size: 20, tail: [330, h - 200] })}`)}`, 4);

// 5: the climb
P(`
  ${panel(M, M, FW, 560, (w, h) => `${nightSky(w, h, 53)}${mountains(w, h, 470, "#2f3560")}<path d="M 0 ${h} L 0 520 Q 420 440 ${w} 380 L ${w} ${h} Z" fill="#1d2140"/>${Array.from({ length: 12 }, (_, i) => `<circle cx="${80 + i * 80}" cy="${380 - i * 14}" r="9" fill="${GLOW}" opacity=".85"/>`).join("")}${kitsu({ x: 220, y: 500, s: .85, face: "happy", walk: true, lantern: true, hold: "letter" })}
    ${caption(w - 580, 24, "Up the mountain, the road is lit by every letter she has ever carried.", { w: 560 })}`)}
  ${panel(M, M + 560 + G, half, 430, (w, h) => `<rect width="${w}" height="${h}" fill="#26304f"/>${house(w / 2, h - 20, 1.4, false)}${caption(16, 16, "The stationer's shop. Dark since the autumn.", { w: w - 32, size: 22 })}`)}
  ${panel(M + half + G, M + 560 + G, half, 430, (w, h) => `${nightSky(w, h, 55)}${kitsu({ x: 160, y: h - 20, s: 1.05, face: "determined", lantern: false, hold: "letter" })}${bubble(w - 170, 110, "Nobody's home. So this is the right door.", { w: 290, size: 24, tail: [230, 200] })}`)}
  ${panel(M, M + 990 + 2 * G, FW, 1500 - (M + 990 + 2 * G) - M - 20, (w, h) => `${shelf(w, h)}${kitsu({ x: 220, y: h - 10, s: 1, face: "calm", lantern: false, hold: "letter" })}${caption(w - 560, 20, "Behind the counter, a shelf for letters that can't be delivered. Forty of them, waiting.", { w: 540, size: 22 })}`)}`, 5);

// 6: the shelf answers
P(`
  ${panel(M, M, FW, 520, (w, h) => `${shelf(w, h)}${envelope(w / 2, 380, .8, true)}${sfx(w - 230, 120, "hum…", { size: 58, rot: 0 })}${caption(24, 24, "She sets the reply on the shelf. Nothing happens. Then everything does.", { w: 560 })}`)}
  ${panel(M, M + 520 + G, half, 480, (w, h) => `<rect width="${w}" height="${h}" fill="#2a2f55"/>${Array.from({ length: 9 }, (_, i) => `<rect x="${60 + (i % 3) * 120}" y="${80 + Math.floor(i / 3) * 110}" width="80" height="56" fill="${CREAM}" stroke="${INK}" stroke-width="3"/><circle cx="${100 + (i % 3) * 120}" cy="${108 + Math.floor(i / 3) * 110}" r="${30 + (i % 2) * 6}" fill="${GLOW}" opacity=".3"/>`).join("")}${caption(16, h - 100, "Every undeliverable letter begins to glow.", { w: w - 32, size: 22 })}`)}
  ${panel(M + half + G, M + 520 + G, half, 480, (w, h) => `${nightSky(w, h, 61)}${kitsu({ x: 200, y: h - 20, s: 1.2, face: "surprised", lantern: false })}${bubble(w - 170, 120, "They were never lost. They were waiting for an answer!", { w: 300, size: 24, shout: true, tail: [250, 210] })}`)}
  ${panel(M, M + 1000 + 2 * G, FW, 1500 - (M + 1000 + 2 * G) - M - 20, (w, h) => `${nightSky(w, h, 63)}${Array.from({ length: 40 }, (_, i) => `<g transform="translate(${60 + (i * 83) % (w - 120)} ${60 + (i * 47) % (h - 140)}) rotate(${(i * 23) % 40 - 20})"><rect x="-26" y="-18" width="52" height="36" fill="${CREAM}" stroke="${INK}" stroke-width="3"/><path d="M -26 -18 L 0 4 L 26 -18" fill="none" stroke="${INK}" stroke-width="2" opacity=".4"/></g>`).join("")}${kitsu({ x: w / 2, y: h - 10, s: .8, face: "happy", lantern: true })}${sfx(w - 280, 110, "FWOOSH", { size: 60 })}`)}`, 6);

// 7: morning
P(`
  ${panel(M, M, FW, 480, (w, h) => `<rect width="${w}" height="${h}" fill="#f6d9b0"/><path d="M 0 ${h} L 0 300 L 260 200 L 520 270 L ${w} 180 L ${w} ${h} Z" fill="#c9a07a"/>${Array.from({ length: 12 }, (_, i) => `<g transform="translate(${60 + i * 78} ${120 + (i % 4) * 40}) rotate(${(i * 19) % 30 - 15})"><rect x="-22" y="-15" width="44" height="30" fill="${CREAM}" stroke="${INK}" stroke-width="3"/></g>`).join("")}${caption(24, h - 110, "By morning, every letter on the shelf has found its way. Forty doors opened that day.", { w: 600, size: 24 })}`)}
  ${panel(M, M + 480 + G, half, 520, (w, h) => `<rect width="${w}" height="${h}" fill="#e9e1cf"/>${crane({ x: 170, y: h - 20, s: .95, face: "teary", letter: true })}${bubble(w - 160, 120, "Somebody answered me.", { w: 250, size: 26, tail: [230, 200] })}`)}
  ${panel(M + half + G, M + 480 + G, half, 520, (w, h) => `${nightSky(w, h, 67)}${lighthouse(w / 2, h - 20, 1.3, true)}${caption(16, 16, "Far away, a lighthouse leans a little to the left, and burns brighter.", { w: w - 32, size: 22 })}`)}
  ${panel(M, M + 1000 + 2 * G, FW, 1500 - (M + 1000 + 2 * G) - M - 20, (w, h) => `<rect width="${w}" height="${h}" fill="#f6d9b0"/>${ground(w, h, h - 130, "#c9a07a")}${kitsu({ x: w / 2, y: h - 14, s: 1, face: "happy", lantern: true, walk: true })}${caption(24, 24, "Kitsu stretches, adjusts her scarf, and picks up the next letter.", { w: 520, size: 24 })}${bubble(w - 200, h - 110, "To be continued!", { w: 260, size: 32, shout: true })}`)}`, 7);

const dir2 = new URL("../public/originals/kitsu-delivers-2/", import.meta.url);
mkdirSync(dir2, { recursive: true });
out.forEach((svg, i) => writeFileSync(new URL(String(i).padStart(3, "0") + ".svg", dir2), svg));
console.log(`Wrote ${out.length} pages to ${dir2.pathname}`);
