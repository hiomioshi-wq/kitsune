// Glowmoth Garden art: moths and butterflies, beetles, bees, spiders, a mantis, isopods, a millipede
// and one mollusc, each with its own anatomy and field marks, plus signature behaviour animations.
import { INK, el, dot, p, ln, dots, both, wrap, eye, scarf, hat, frame } from "./artkit.js";

// ---------- tiny geometry helpers ----------
const n = (v) => Math.round(v * 10) / 10;
const at = (t, s) => `<g transform="${t}">${s}</g>`;
const edge = (c, w = 1.2) => `stroke="${c}" stroke-width="${w}" stroke-linejoin="round"`;
const op = (v) => `opacity="${v}"`;
const path = (pts) => `M${pts.map((q) => q.join(" ")).join("L")}`;
const limbs = (list, col, w) => list.map((pts) => ln(path(pts), col, w)).join("");
const mix = (a, b, t) => [n(a[0] + (b[0] - a[0]) * t), n(a[1] + (b[1] - a[1]) * t)];

/** Scalloped, fluffy ellipse. */
function fuzz(cx, cy, rx, ry, fill, bumps = 20, depth = 3, x = "") {
  let d = `M${n(cx + rx)} ${cy}`;
  for (let i = 1; i <= bumps; i++) {
    const t = (i / bumps) * Math.PI * 2, m = ((i - 0.5) / bumps) * Math.PI * 2;
    d += `Q${n(cx + (rx + depth) * Math.cos(m))} ${n(cy + (ry + depth) * Math.sin(m))} ${n(cx + rx * Math.cos(t))} ${n(cy + ry * Math.sin(t))}`;
  }
  return p(`${d}Z`, fill, x);
}
/** Dots along a cubic wing margin, pushed `inset` units toward `mid`. */
function margin(s, count, mid, inset, r, fill) {
  let out = "";
  for (let i = 0; i < count; i++) {
    const t = (i + 0.5) / count, u = 1 - t;
    const f = (a, b, c, d) => u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d;
    const x = f(s[0], s[2], s[4], s[6]), y = f(s[1], s[3], s[5], s[7]);
    const len = Math.hypot(mid[0] - x, mid[1] - y) || 1;
    out += dot(n(x + ((mid[0] - x) / len) * inset), n(y + ((mid[1] - y) / len) * inset), r, fill);
  }
  return out;
}
/** Feathery (comb-like) moth antenna along a curve. */
function plume(x0, y0, cx, cy, x1, y1, col, wide = 5.5) {
  let d = "";
  for (let i = 1; i <= 8; i++) {
    const t = i / 8.6, u = 1 - t;
    const x = u * u * x0 + 2 * u * t * cx + t * t * x1, y = u * u * y0 + 2 * u * t * cy + t * t * y1;
    const dx = 2 * u * (cx - x0) + 2 * t * (x1 - cx), dy = 2 * u * (cy - y0) + 2 * t * (y1 - cy), l = Math.hypot(dx, dy) || 1;
    const w = wide * Math.sin(Math.PI * (t * 0.85 + 0.08));
    for (const s of [1, -1]) d += `M${n(x)} ${n(y)}l${n((-dy / l) * w * s + (dx / l) * 2.6)} ${n((dx / l) * w * s + (dy / l) * 2.6)}`;
  }
  return ln(d, col, 1.5) + ln(`M${x0} ${y0}Q${cx} ${cy} ${x1} ${y1}`, col, 1.8);
}
const club = (d, x, y, col, tip = col, rot = -35) => ln(d, col, 1.8) + el(x, y, 2.6, 4.4, tip, `transform="rotate(${rot} ${x} ${y})"`);
const star = (x, y, r, col, x2 = "") => p(`M${x} ${y - r}Q${x} ${y} ${x + r} ${y}Q${x} ${y} ${x} ${y + r}Q${x} ${y} ${x - r} ${y}Q${x} ${y} ${x} ${y - r}Z`, col, x2);
const flower = (x, y, r, petal, mid) => [0, 72, 144, 216, 288].map((a) => at(`rotate(${a} ${x} ${y})`, el(x, y - r * 0.8, r * 0.55, r * 0.8, petal, edge("#0002", 0.8)))).join("") + dot(x, y, r * 0.48, mid);
const smile = (x, y, mood, col = INK, w = 1.7) => (mood === "sad" ? ln(`M${x - 3.5} ${y + 2}q3.5 -3.5 7 0`, col, w) : mood === "sleepy" ? ln(`M${x - 2} ${y + 1}h4`, col, w) : ln(`M${x - 4} ${y}q4 4.5 8 0`, col, w));
const cheeks = (x1, x2, y, o = 0.6) => el(x1, y, 3.8, 2.4, "#ff7f9c", op(o)) + el(x2, y, 3.8, 2.4, "#ff7f9c", op(o));
const pair = (x1, x2, y, mood, o) => eye(x1, y, mood, o) + eye(x2, y, mood, o);
const DARK = { ring: "#fff", lid: "#fff" };

// ---------- signature CSS ----------
const anim = (k, dur, frames, base = "", origin = "", ease = "ease-in-out") => `.bd-s-glow-${k}{${base}${origin ? `transform-origin:${origin};` : ""}animation:glow-${k} ${dur} ${ease} infinite}@keyframes glow-${k}{${frames}}`;
const sg = (k, s) => wrap(`bd-s-glow-${k}`, s);

// ================= moths and butterflies =================
/**
 * Front-facing lepidopteran. d.wing is the LEFT side (mirrored). brush: nymphalid butterflies stand on
 * four legs, the front pair being tiny brush-like limbs held against the chest.
 */
function lep(d, mood) {
  const wings = d.wings ?? both(wrap("bd-flap", d.wing));
  const leg = d.leg || "#241c20";
  const six = d.brush
    ? limbs([[[52, 80], [37, 90], [33, 108]], [[54, 87], [47, 104], [41, 117]]], leg, 2.6)
    : limbs([[[52, 73], [37, 76], [31, 88]], [[52, 81], [36, 93], [32, 107]], [[54, 88], [46, 105], [41, 117]]], leg, d.legW || 2.6);
  const brush = d.brush ? ln("M54 71q-8 3 -5 10", leg, 2.2) + fuzz(50, 82, 2.2, 3, leg, 7, 1.2) : "";
  const abdomen = d.abdomen || (el(60, 93, 9.5, 18, d.body, edge(d.rim || "#0003", 1.3)) + ln("M52 88q8 4 16 0M52.500 96q7.500 4 15 0M55 104q5 3 10 0", d.band || "#ffffff44", 1.8));
  const thorax = d.furry ? fuzz(60, 74, 13, 12, d.body, 18, 3.2) : el(60, 74, 11.500, 12, d.body, d.rim ? edge(d.rim, 1.3) : "");
  const headCol = d.head || d.body;
  const head = (d.furry ? fuzz(60, 50, 16.500, 15.500, headCol, 22, 2.6) : el(60, 50, 17, 16, headCol, d.rim ? edge(d.rim, 1.3) : "")) + (d.face || "") + pair(52, 68, 49, mood, d.eyes || { r: 5.4, ...DARK }) + cheeks(45.500, 74.500, 57.500) + (d.mouth ?? smile(60, 57.500, mood, d.lip || INK));
  return {
    bg: d.bg || "",
    body: `${wings}${both(six)}${wrap("bd-breathe", abdomen + (d.marks || ""))}${thorax}${d.chest || ""}${both(brush)}${both(wrap("bd-wag", d.ant))}${head}`,
    neck: [60, 64, 13],
    cap: [60, 38, 0.72],
  };
}
const curl = (col) => ln("M60 57q-.500 6 3.500 7q4.500 .500 4 -3.200q-1 -3 -3.400 -1.400", col, 1.5);

// Monarch wing outlines (left side).
const MON_FW = "M57 60C46 40 28 17 13 15C4 15 2 25 6 37C10 51 15 61 23 66C34 73 47 71 57 68Z";
const MON_HW = "M57 70C42 66 20 64 13 76C7 88 14 103 28 108C40 112 52 100 58 80Z";
function monarchWing(c, spot, vein, dust = "") {
  const black = "#1a1216";
  return p(MON_HW, c, edge(black, 7)) + dust
    + ln("M56 75Q34 70 17 74M54 78Q32 80 13 87M54 80Q34 88 18 100M55 81Q42 94 30 106M56 82Q52 94 43 103", vein, 1.7) + ln("M55 75C45 73 33 80 32 86C40 91 50 85 55 79", vein, 1.7)
    + p(MON_FW, c, edge(black, 7))
    + ln("M55 63Q34 36 17 20M42 52Q24 40 8 34M40 56Q24 52 10 47M42 60Q28 60 17 60M52 66Q40 68 27 67", vein, 1.7) + ln("M55 61C44 47 32 42 27 44C29 53 42 62 55 67", vein, 1.7)
    + p("M33 27C24 17 8 12 6 23C5 32 8 39 13 40C18 31 25 29 33 27Z", black)
    + dots([[15, 21], [12, 29]], 2.2, spot) + dots([[22, 21.500], [18, 28]], 1.6, spot)
    + margin([13, 15, 4, 15, 2, 25, 6, 37], 5, [32, 46], -1.5, 1.05, "#fff") + margin([6, 37, 10, 51, 15, 61, 23, 66], 7, [32, 46], -1.5, 1.05, "#fff") + margin([6, 37, 10, 51, 15, 61, 23, 66], 6, [32, 46], 1.7, 0.8, "#fff")
    + margin([13, 76, 7, 88, 14, 103, 28, 108], 8, [36, 85], -1.5, 1.05, "#fff") + margin([28, 108, 40, 112, 52, 100, 58, 80], 6, [36, 85], -1.5, 1.05, "#fff") + margin([13, 76, 7, 88, 14, 103, 28, 108], 7, [36, 85], 1.7, 0.8, "#fff");
}
const headDots = dots([[47, 40], [52, 37], [68, 37], [73, 40], [60, 39], [45.500, 49], [74.500, 49]], 1.1, "#fff");
const buttAnt = (col = "#241c20", tip = col) => club("M53 37Q46 22 36 14", 35, 13, col, tip, -50);

function monarch(k, mood, sig) {
  const wing = monarchWing(k.c, "#ffc26a", k.a);
  const d = { wing, body: k.a, head: k.a, face: headDots, ant: buttAnt(), brush: true, leg: "#4e3c46", rim: "#6a5460", mouth: curl("#a88a70"), marks: dots([[55, 90], [65, 90], [56, 99], [64, 99]], 1.2, "#fff"), chest: dots([[53, 72], [67, 72], [56, 79], [64, 79]], 1.3, "#fff") };
  if (!sig) return lep(d, mood);
  const r = lep({ ...d, wings: sg("sip-wings", both(wing)), mouth: "" }, mood);
  r.xf = "translate(-8 -1) scale(.97)";
  r.fg = sg("sip-tongue", ln("M54 56C64 74 88 62 95 90", "#4a2e22", 2.2)) + sg("sip-bloom", ln("M99 118Q96 108 98 100", "#4a8a3a", 3) + p("M98 114Q110 104 117 108Q110 118 98 114Z", "#5aa448") + [[88, 94], [98, 89], [108, 95], [92, 103], [104, 104]].map(([x, y]) => flower(x, y, 6, "#e884c0", "#ffe27a")).join(""));
  r.css = anim("sip-wings", "2.4s", "0%,100%{transform:scaleX(.78)}50%{transform:scaleX(.98)}", "transform:scaleX(.78);", "60px 70px") + anim("sip-tongue", "1.2s", "0%,100%{transform:translate(0,0)}50%{transform:translate(.8px,2.2px)}") + anim("sip-bloom", "2.4s", "0%,100%{transform:rotate(0)}50%{transform:rotate(3deg)}", "", "99px 118px");
  return r;
}

function whiteMonarch(k, mood) {
  const dust = el(30, 88, 8, 5, k.b, op(0.9));
  const smudge = el(26, 36, 9, 6, k.b, `${op(0.75)} transform="rotate(40 26 36)"`) + el(38, 58, 10, 4.500, k.b, op(0.75)) + dots([[34, 50], [20, 46], [24, 54], [40, 94], [22, 90]], 1.3, "#a8a098");
  const wing = monarchWing(k.c, "#fff", "#5c5256", dust) + smudge;
  const r = lep({ wing, body: k.a, head: k.a, face: headDots, ant: buttAnt(), brush: true, leg: "#5a4a52", rim: "#8a7a80", mouth: curl("#c8b8b0"), marks: dots([[55, 90], [65, 90], [56, 99], [64, 99]], 1.2, "#fff"), chest: dots([[53, 72], [67, 72], [56, 79], [64, 79]], 1.3, "#fff") }, mood);
  r.fg = wrap("bd-glow", [[10, 62], [104, 14], [112, 70], [16, 112]].map(([x, y]) => star(x, y, 3.4, "#fff8d8")).join(""));
  return r;
}

const MORPHO_FW = "M57 60C46 38 24 19 7 21C2 31 5 45 11 54C14 58 12 61 16 64C24 74 42 73 57 70Z";
const MORPHO_HW = "M57 71C40 64 16 68 12 82C10 88 15 89 13 94C17 98 17 101 22 102C25 108 31 105 35 108C48 108 56 94 58 80Z";
const morphoOpen = (k) => p(MORPHO_HW, k.c, edge(k.a, 5)) + p("M55 74C42 72 26 78 24 88C30 98 46 96 55 82Z", k.b, op(0.75))
  + ln("M55 76Q36 74 18 82M55 79Q38 86 22 98M56 80Q50 94 40 103", "#0a52a8", 1)
  + p(MORPHO_FW, k.c, edge(k.a, 6)) + p("M55 63C44 46 30 34 18 33C17 47 30 63 55 67Z", k.b, op(0.75)) + p("M50 62C42 50 32 43 24 42C26 50 36 59 50 63Z", "#e6fbff", op(0.55))
  + ln("M55 63Q32 36 12 26M54 65Q32 52 10 44M54 68Q36 68 18 62", "#0a52a8", 1)
  + p("M7 21C2 31 5 45 11 54C14 44 18 30 26 29C20 24 14 21 7 21Z", k.a) + dots([[12, 28], [17, 26], [9, 35]], 1.4, "#fff")
  + margin([22, 102, 25, 108, 31, 105, 35, 108], 3, [36, 84], 0.8, 0.9, "#ffd8c0") + dots([[14, 84], [13.500, 91], [17, 98]], 0.9, "#ffd8c0");
const ocellus = (x, y, r) => dot(x, y, r + 1.8, "#e8b848") + dot(x, y, r, "#1c100c") + dot(x, y, r * 0.55, "#5a2c18") + dot(x + r * 0.15, y - r * 0.2, r * 0.25, "#fff");
const morphoUnder = both(p("M57 76C36 80 14 68 13 44C12 22 30 8 43 11C55 18 60 44 58 66Z", "#7a5638", edge("#3c2616", 3))
  + ln("M22 24Q34 40 20 62M36 16Q50 36 42 70", "#c8a87c", 3.4, op(0.75)) + ln("M55 68Q40 46 22 30M55 70Q36 64 17 54", "#3c2616", 1)
  + ocellus(27, 29, 4.2) + ocellus(24, 46, 6) + ocellus(31, 63, 4.6));
function morpho(k, mood, sig) {
  const d = { wing: morphoOpen(k), body: "#2a2018", head: "#33261e", rim: "#7a6252", face: dots([[48, 39], [72, 39]], 1.2, "#fff"), ant: buttAnt("#2a2018"), brush: true, leg: "#5a4434", mouth: curl("#a88868") };
  if (!sig) return lep(d, mood);
  const r = lep({ ...d, wings: sg("flash-brown", morphoUnder) + wrap("bd-s-glow-flash-blue", both(morphoOpen(k))) }, mood);
  r.fg = sg("flash-spark", [[12, 12, 6], [106, 20, 5], [108, 88, 4], [10, 92, 4.500], [96, 5, 3]].map(([x, y, s]) => star(x, y, s, "#9ff0ff", edge("#1668c8", 0.8))).join(""));
  r.css = anim("flash-brown", "1.8s", "0%,46%{opacity:1}54%,92%{opacity:0}100%{opacity:1}", "opacity:1;", "", "linear") + anim("flash-blue", "1.8s", "0%,46%{opacity:0}54%,92%{opacity:1}100%{opacity:0}", "opacity:0;", "", "linear") + anim("flash-spark", "1.8s", "0%,46%{opacity:0}60%{opacity:1}100%{opacity:0}", "opacity:.35;");
  return r;
}

function swallowtail(k, mood) {
  const y = k.c, bk = k.a;
  const hw = "M57 70C42 65 21 67 15 79C11 89 17 98 24 100C23 108 15 112 17 117C24 120 30 112 33 105C46 108 56 94 58 80Z";
  const fw = "M57 58C44 40 25 21 7 17C5 31 11 51 22 62C32 71 46 71 57 68Z";
  const wing = p(hw, y, edge(bk, 2.4))
    + p("M15 79C11 89 17 98 24 100C23 108 15 112 17 117C24 120 30 112 33 105C40 106 46 103 50 97C40 98 26 94 22 80Z", bk)
    + dots([[21, 90], [26, 95.500], [34, 98.500]], 2.7, k.b) + dots([[16.500, 85], [21, 96], [26, 101.500]], 1.4, y)
    + dot(47, 96, 5.600, bk) + dot(47, 97, 3.8, "#e83a26") + ln("M43 93.500q4 -3.500 8 0", k.b, 2)
    + ln("M55 75Q40 72 22 78M55 78Q40 84 25 92M56 80Q50 90 40 99", bk, 1.4)
    + p(fw, y, edge(bk, 2.4))
    + p("M7 17C5 31 11 51 22 62C25 63 28 65 31 66C23 52 17 34 17 21Z", bk) + margin([7, 17, 5, 31, 11, 51, 22, 62], 7, [34, 40], 3.2, 1.7, y)
    + p("M57 58C51 51 46 47 42 47C40 55 44 64 49 68L57 68Z", bk, op(0.88)) + dots([[48, 56], [45, 60], [50, 63]], 1, y)
    + ln("M26 29L33 40M35 37L41 47M18 23L23 31", bk, 4.600) + ln("M55 64Q32 42 12 24M44 58Q30 50 14 40M46 63Q32 62 20 56M52 67Q40 68 28 64", bk, 1.3);
  return lep({ wing, body: y, head: y, face: p("M54 35Q60 33 66 35L63 44Q60 46 57 44Z", bk), ant: buttAnt(bk), leg: bk, band: bk, chest: ln("M60 66V86", bk, 7), marks: ln("M60 80V108", bk, 4.5), eyes: { r: 5.4, rim: 1.4 }, mouth: curl(bk) }, mood);
}

function rosyMaple(k, mood) {
  const pink = k.a, yel = k.c;
  const wing = p("M57 72C42 69 21 76 21 90C25 104 43 108 52 99C57 92 58 84 58 78Z", yel, edge(pink, 3.6)) + p("M56 78C46 80 38 88 38 94C46 96 54 90 56 84Z", k.b)
    + p("M57 60C42 46 22 30 8 33C4 46 10 63 22 71C34 78 47 74 57 70Z", pink, edge("#e85c8a", 1.4))
    + p("M23 35C31 39 39 42 43 47C37 55 34 66 34 74C28 73 22 70 18 66C27 57 29 47 23 35Z", yel) + p("M27 42C32 45 36 47 37 50C33 55 30 62 29 68C27 68 25 67 24 65C30 57 31 50 27 42Z", k.b)
    + p("M57 61C52 56 47 54 44 54C43 60 46 66 52 69L57 69Z", pink) + dot(29, 55, 1.6, pink);
  const r = lep({ wing, body: yel, head: yel, furry: true, leg: pink, legW: 3.8, face: fuzz(60, 39, 9, 5, k.b, 12, 2), ant: plume(52, 37, 40, 30, 30, 14, "#f08aa4"), eyes: { r: 6, rim: 1.2 }, mouth: smile(60, 58, mood),
    abdomen: fuzz(60, 94, 10.500, 17, yel, 20, 3) + fuzz(60, 106, 6, 5, k.b, 10, 2), chest: fuzz(60, 78, 7, 6, k.b, 12, 2.4) }, mood);
  return r;
}

const LUNA_FW = "M57 60C46 42 27 20 6 17C7 30 13 46 22 57C32 68 46 71 57 69Z";
const LUNA_EYE = (x, y, k) => el(x, y, 5.2, 4.2, "#f2d64a", edge(k.a, 1.2)) + el(x + 0.6, y + 0.5, 3, 2.4, "#3a2038") + el(x - 0.3, y - 0.2, 1.8, 1.4, "#e8f4e0");
const lunaFore = (k) => p(LUNA_FW, k.c, edge("#d8e878", 1.8)) + ln("M55 62Q36 52 12 24M54 65Q34 60 18 46M54 68Q40 68 24 58M44 55Q36 40 26 30", "#8ac878", 1.1) + ln("M57 60C46 42 27 20 6 17", k.a, 4.2) + ln("M32 33L31 43", k.a, 1.8) + LUNA_EYE(31, 46, k);
function luna(k, mood, sig) {
  const hwTail = "M57 71C43 66 27 71 26 82C26 89 31 93 33 95C30 101 20 103 15 109C11 115 15 121 22 118C29 115 33 108 40 104C50 101 56 90 58 80Z";
  const hwStub = "M57 71C43 66 27 71 26 82C26 92 34 99 44 99C52 96 56 90 58 80Z";
  const hind = (d) => p(d, k.c, edge("#d8e878", 1.8)) + ln("M55 75Q42 76 31 82M55 78Q46 86 37 96", "#8ac878", 1.1) + LUNA_EYE(43, 85, k);
  const d = { body: k.b, head: k.b, furry: true, leg: k.a, ant: plume(52, 37, 38, 30, 31, 13, "#c89c48", 6), eyes: { r: 5.6, rim: 1.2 }, abdomen: fuzz(60, 93, 9.500, 17, k.b, 20, 2.6), chest: ln("M48 66Q60 72 72 66", k.a, 3.4) };
  if (!sig) return lep({ ...d, wing: hind(hwTail) + ln("M34 97Q26 104 19 112", "#e8f8b0", 2) + lunaFore(k) }, mood);
  const tail = p("M44 95C36 104 20 98 14 108C9 118 22 124 28 117C32 112 27 108 23 111C25 115 21 117 18 114C17 107 31 110 38 107C45 105 49 101 50 97Z", k.c, edge("#9aca70", 1.6));
  const r = lep({ ...d, wings: both(sg("twirl-tail", tail) + wrap("bd-flap", hind(hwStub) + lunaFore(k))) }, mood);
  r.xf = "translate(5 -5) scale(.93)";
  r.fg = sg("twirl-bat", p("M96 104q-5 -8 -12 -5q3 2 2 5q4 -1 5 3q3 -3 5 -3ZM104 104q5 -8 12 -5q-3 2 -2 5q-4 -1 -5 3q-3 -3 -5 -3Z", "#6a58a8", edge("#3c3070", 1)) + el(100, 106, 7, 7, "#8a74c8") + p("M95 101l-1 -7l5 4ZM105 101l1 -7l-5 4Z", "#8a74c8") + dots([[97.500, 105], [102.500, 105]], 1.3, "#fff") + ln("M98 109q2 1.500 4 0", "#2a1c50", 1))
    + sg("twirl-echo", ln("M86 100q-5 7 0 14M79 97q-8 10 0 20", "#e8dcff", 1.8))
    + sg("twirl-swirl", ln("M6 98q-5 12 5 19M114 84q6 6 3 12", "#f4ffd8", 1.8));
  r.css = anim("twirl-tail", ".7s", "0%,100%{transform:rotate(-7deg) scaleX(1)}50%{transform:rotate(12deg) scaleX(.78)}", "", "46px 97px") + anim("twirl-bat", "1.8s", "0%,100%{transform:translate(4px,3px)}45%{transform:translate(-8px,2px)}70%{transform:translate(-3px,-4px)}") + anim("twirl-echo", ".9s", "0%{opacity:.15}50%{opacity:1}100%{opacity:.15}", "opacity:.9;") + anim("twirl-swirl", ".7s", "0%,100%{opacity:.2}50%{opacity:.9}", "opacity:.8;");
  return r;
}

const ioHind = (k, eyes) => p("M57 70C40 65 13 72 13 90C15 108 36 114 48 103C56 95 58 85 58 78Z", k.c, edge("#c88a18", 1.4))
  + p("M57 76C52 86 46 100 40 108C50 106 57 94 58 80Z", k.b) + ln("M17 95C24 108 38 110 48 100", k.b, 2.6) + ln("M20 92C27 103 38 104 46 96", "#5a3418", 1.6) + eyes;
const ioEye = (k) => dot(32, 87, 12, "#18121c") + dot(32, 87, 8.600, k.a) + dot(32.500, 87.500, 5.200, "#151a30") + ln("M28 84q2.500 -3 6.500 -2.500", "#fff", 2.2) + dots([[34, 90], [30, 91.500]], 0.8, "#dce8ff");
const ioFore = (k) => p("M57 59C43 42 22 29 6 33C6 46 10 61 20 70C33 82 48 79 57 71Z", k.c, edge("#c88a18", 1.4))
  + ln("M13 36Q19 56 33 74", "#a8561e", 1.8) + ln("M27 36q-1 8 5 12q-2 8 6 13q0 6 6 9", "#a8561e", 1.4) + dots([[31, 51], [36, 55], [33, 58]], 1.8, "#8a3a1c") + dots([[19, 44], [24, 59], [44, 62], [14, 52]], 1.1, "#a8561e");
function io(k, mood, sig) {
  const d = { body: "#f2b424", head: "#f6c836", furry: true, leg: "#a8561e", legW: 3.2, ant: plume(52, 37, 39, 30, 29, 15, "#a8661e"), eyes: { r: 5.6, rim: 1.2 }, abdomen: fuzz(60, 94, 10, 17, "#eea428", 20, 2.8) + ln("M52 92q8 4 16 0M53 100q7 4 14 0", k.b, 2.2), chest: fuzz(60, 78, 7, 5, k.b, 12, 2) };
  if (!sig) return lep({ ...d, wing: ioHind(k, ioEye(k)) + ioFore(k) }, mood);
  const r = lep({ ...d, wings: both(ioHind(k, sg("flare-eye", ioEye(k))) + sg("flare-fore", ioFore(k))) }, mood);
  r.fg = sg("flare-burst", both(ln("M8 80l-5 -2M9 94l-6 3M16 108l-4 6", "#fff6b0", 2.6)) + both(star(10, 68, 4, "#fff6b0")));
  r.css = anim("flare-fore", "1.7s", "0%,62%{transform:rotate(27deg)}80%,88%{transform:rotate(-4deg)}100%{transform:rotate(27deg)}", "transform:rotate(27deg);", "57px 65px") + anim("flare-eye", ".85s", "0%,100%{transform:scale(1.22)}50%{transform:scale(1)}", "transform:scale(1.22);", "32px 87px") + anim("flare-burst", ".85s", "0%,100%{opacity:1}50%{opacity:.15}");
  return r;
}

const atlasFore = (k, sig) => {
  const fw = "M57 55C43 38 32 13 17 11C9 10 2 13 3 19C4 23 11 23 13 27C14 30 8 31 7 36C3 48 7 60 15 68C28 76 46 74 57 69Z";
  return p(fw, k.c, edge("#5a2410", 1.4))
    // pale outer border with a thin dark scalloped line
    + p("M7 36C3 48 7 60 15 68C19 71 23 72 27 72C17 63 12 50 13 36Z", k.b) + ln("M12 38q-3 6 1 9q-3 6 2 9q0 6 6 8q1 4 6 6", k.a, 1.4)
    // the curved, snake-head wingtip
    + p("M17 11C9 10 2 13 3 19C4 23 11 23 13 27C15 24 22 22 27 22C25 16 22 12 17 11Z", "#e8a85a") + ln("M4.500 19.500Q10 18 13 22Q18 20 22 19", k.a, 1.6) + dot(11.500, 14.800, sig ? 2.8 : 2, "#160c08") + dot(12.200, 14, 0.8, "#fff") + dots([[16.500, 25], [21, 28]], 1.6, "#2a1008")
    + ln("M28 21C19 34 24 44 17 52C16 60 22 66 29 70", "#fff4e4", 2.2) + ln("M30.500 22.500C22 34 27 45 20 53C20 59 25 64 31 69", k.a, 1.6)
    // clear triangular window
    + p("M29 37Q37 42 45 54Q35 56 24 55Q27 46 29 37Z", "#e4f2ee", `${edge("#fff4e4", 2.4)} fill-opacity=".8"`) + p("M29 37Q37 42 45 54Q35 56 24 55Q27 46 29 37Z", "none", edge(k.a, 0.9)) + p("M37 33l5 7l-6 -1Z", "#e4f2ee", edge(k.a, 0.8))
    + ln("M55 60Q46 60 40 66", "#fff4e4", 1.6);
};
const atlasHind = (k) => p("M57 71C40 66 15 71 13 86C13 100 27 110 40 106C52 99 58 90 58 80Z", k.c, edge("#5a2410", 1.4)) + p("M13 86C13 100 27 110 40 106C43 104 45 103 47 101C32 103 20 96 18 82Z", k.b) + margin([13, 86, 13, 100, 27, 110, 40, 106], 6, [34, 84], 3.2, 1.5, k.a)
  + ln("M22 76C18 90 30 100 48 96", "#fff4e4", 1.8) + p("M28 79Q38 80 46 82Q38 88 30 95Q28 87 28 79Z", "#e4f2ee", `${edge("#fff4e4", 2.2)} fill-opacity=".8"`) + p("M28 79Q38 80 46 82Q38 88 30 95Q28 87 28 79Z", "none", edge(k.a, 0.9));
function atlas(k, mood, sig) {
  const d = { body: k.c, head: "#b8582a", furry: true, leg: "#6a2c16", legW: 3.4, ant: plume(52, 37, 40, 26, 36, 8, "#e0a45c", 6.5), eyes: { r: 5.4, rim: 1.2 }, abdomen: fuzz(60, 94, 10.500, 17, k.c, 20, 2.8) + ln("M52 88q8 4 16 0M51.500 97q8.500 5 17 0M54 105q6 4 12 0", "#fff4e4", 2.4), chest: ln("M49 70q11 7 22 0", "#fff4e4", 2.4), mouth: smile(60, 58, mood, "#2a1008") };
  if (!sig) return lep({ ...d, wing: atlasHind(k) + atlasFore(k) }, mood);
  const tongue = ln("M4 20l-3 4M1 24l0 3M1 24l-1 1", "#e8244a", 1.5);
  const r = lep({ ...d, wings: both(wrap("bd-flap", atlasHind(k)) + sg("snake-wing", atlasFore(k, true) + sg("snake-tongue", tongue))) }, mood);
  r.fg = sg("snake-hiss", both(ln("M31 7l4 -5M39 11l7 -3", "#fff4d8", 2)));
  r.css = anim("snake-wing", "1.9s", "0%,100%{transform:rotate(9deg)}50%{transform:rotate(-8deg)}", "transform:rotate(9deg);", "57px 64px") + anim("snake-tongue", ".45s", "0%,55%{opacity:1}56%,100%{opacity:0}", "", "", "linear") + anim("snake-hiss", "1.9s", "0%,100%{opacity:1}50%{opacity:0}");
  return r;
}

function elephantHawk(k, mood, sig) {
  const olive = k.c, pink = k.a;
  const fore = p("M55 60C40 49 21 38 3 37C8 49 18 59 30 67C40 74 49 76 57 74Z", olive, edge("#5c5a1c", 1.2))
    + ln("M54 60C40 49 22 40 7 38", pink, 3) + ln("M6 40Q28 56 54 68", pink, 3.600) + ln("M13 50Q24 63 40 71", k.b, 2.4) + dot(37, 55, 1.6, "#fff");
  const hind = p("M56 74C43 74 27 79 22 91C32 101 49 96 57 84Z", pink, edge("#fff", 2)) + p("M56 75C47 75 39 79 36 85C44 89 52 87 57 82Z", "#2c1c28");
  const body = p("M51 82C49 98 55 110 60 118C65 110 71 98 69 82Z", olive, edge("#5c5a1c", 1)) + ln("M60 82V112", pink, 3) + ln("M53 86Q53 99 58 109M67 86Q67 99 62 109", k.b, 2);
  const d = { body: olive, head: olive, furry: true, leg: "#fbeef2", ant: ln("M52 37Q42 28 34 17q-3 -4 -6 -1", "#fbe0e8", 3.8) + ln("M52 37Q42 28 34 17", pink, 1), eyes: { r: 6, ...DARK }, abdomen: body, chest: ln("M50 68Q54 80 58 86M70 68Q66 80 62 86", pink, 3) + ln("M48 70Q50 80 54 84M72 70Q70 80 66 84", "#fff", 1.6), face: ln("M49 38Q60 44 71 38", pink, 3) };
  if (!sig) return lep({ ...d, wing: hind + fore, mouth: curl("#f6c8d4") }, mood);
  const ghost = (a) => at(`rotate(${a} 56 70)`, p("M55 60C40 49 21 38 3 37C8 49 18 59 30 67C40 74 49 76 57 74Z", k.b, op(0.35)));
  const r = lep({ ...d, wings: both(ghost(28) + ghost(-24) + sg("hover-wing", hind + fore)), mouth: "" }, mood);
  r.xf = "translate(2 8) scale(.76)";
  r.move = "bd-s-glow-hover-body";
  r.bg = [[8, 12], [30, 6], [104, 14], [112, 34], [10, 100]].map(([x, y]) => star(x, y, 3, "#fff6c0", `class="bd-glow"`)).join("");
  r.over = ln("M63 57C82 70 100 62 121 68", "#7a3050", 2.2);
  const bloom = (x, y, a) => at(`rotate(${a} ${x} ${y})`, p(`M${x} ${y - 2}Q${x + 12} ${y - 3} ${x + 17} ${y - 10}Q${x + 20} ${y - 2} ${x + 15} ${y + 1}Q${x + 20} ${y + 7} ${x + 13} ${y + 8}Q${x + 10} ${y + 3} ${x} ${y + 2}Z`, "#fff0c8", edge("#e8a860", 1)) + ln(`M${x + 12} ${y}q8 -4 11 -12M${x + 12} ${y}q10 0 13 -5`, "#d89048", 0.8) + dots([[x + 23, y - 12], [x + 25, y - 5]], 1.2, "#e8a028"));
  r.fg = ln("M109 119Q112 88 100 66", "#4a8a48", 2.6) + p("M110 96Q96 90 92 100Q102 106 110 96Z", "#58a054") + bloom(90, 57, -6) + bloom(94, 74, 26) + ln("M101 66q-8 -2 -10 -9M104 76q-6 -1 -10 -3", "#e87ca0", 2);
  r.css = anim("hover-wing", ".16s", "0%,100%{transform:rotate(14deg)}50%{transform:rotate(-16deg)}", "", "56px 70px", "linear") + anim("hover-body", "1.1s", "0%,100%{transform:translate(0,0)}30%{transform:translate(2px,-3px)}65%{transform:translate(-1.500px,2px)}");
  return r;
}

function lanternMoth(k, mood) {
  const glow = k.a;
  const wing = p("M57 71C42 66 19 73 18 87C18 95 24 94 25 99C30 103 33 100 36 106C48 108 56 94 58 80Z", k.c, edge(glow, 1.8))
    + dot(36, 88, 7.500, k.b, op(0.35)) + dot(36, 88, 4, k.b) + dots([[26, 84], [29, 94], [46, 96]], 1.2, glow)
    + p("M57 60C44 40 25 22 9 22C2 32 8 40 7 46C12 50 9 56 14 60C22 74 43 74 57 69Z", k.c, edge(glow, 1.8))
    + p("M57 62C45 46 28 34 17 32C16 48 30 66 57 68Z", "#5a54b8", op(0.75))
    + dot(27, 45, 11, k.b, `${op(0.22)} class="bd-glow"`) + p("M29 36A10 10 0 1 0 35 53A8 8 0 0 1 29 36Z", k.b) + star(42, 62, 4.4, k.b) + star(14, 34, 3, "#fff") + dots([[18, 52], [38, 40], [24, 62], [46, 56]], 1, "#fff") + margin([9, 22, 25, 22, 44, 40, 57, 60], 6, [30, 50], 3, 0.9, glow);
  const abdomen = dot(60, 100, 17, k.b, `${op(0.3)} class="bd-glow"`) + el(60, 94, 10.500, 18, k.c) + el(60, 101, 8.500, 10.500, k.b) + ln("M52 98q8 4 16 0M53.500 104q6.500 4 13 0", "#e8b048", 1.4) + ln("M52 86q8 4 16 0", glow, 1.6);
  const r = lep({ wing, body: k.c, head: "#5650a8", furry: true, leg: "#aaa4ec", ant: plume(52, 37, 38, 28, 32, 13, glow, 6) + dot(32, 13, 5, k.b, `${op(0.45)} class="bd-glow"`) + dot(32, 13, 2.4, k.b), eyes: { r: 6, iris: glow, lid: "#fff" }, abdomen, chest: fuzz(60, 78, 8, 6, k.b, 12, 2.4), lip: "#fff" }, mood);
  r.fg = wrap("bd-glow", [[8, 76], [112, 72], [104, 10], [18, 8], [110, 108]].map(([x, y], i) => (i % 2 ? star(x, y, 3.4, k.b) : dot(x, y, 1.8, glow))).join(""));
  return r;
}

// ================= beetles (upright, seen from above with the face up) =================
const BEETLE_LEGS = [[[46, 63], [29, 58], [20, 68], [15, 68]], [[38, 80], [21, 81], [13, 95], [8, 96]], [[42, 96], [27, 104], [25, 116], [19, 118]]];
const beetleLegs = (col, w = 3.8) => both(limbs(BEETLE_LEGS, col, w));
const threadAnt = (col, d = "M52 32Q44 18 35 20", x = 35, y = 20, r = 3) => both(ln(d, col, 2) + dot(x, y, r, col));
const gloss = (d, w = 3.4, o = 0.65) => ln(d, "#fff", w, op(o));

const DOME = "M60 60C85 58 95 74 93 90C91 107 77 117 60 117C43 117 29 107 27 90C25 74 35 58 60 60Z";
const PRONOTUM = "M38 69C37 52 47 46 60 46C73 46 83 52 82 69C72 63 48 63 38 69Z";

function sevenSpot(k, mood) {
  const spot = both(dot(35.500, 80, 4.2, k.a) + dot(46, 91, 6.8, k.a) + dot(41, 106, 4.8, k.a) + el(52.500, 68.500, 4, 3, k.b));
  return {
    body: `${beetleLegs(k.a)}${wrap("bd-breathe", p(DOME, k.c, edge("#8a1414", 1.4)) + spot + dot(60, 72, 4.8, k.a) + ln("M60 77V116", "#7a1010", 1.4) + gloss("M32 82q2 -11 12 -16") + gloss("M76 100q6 -5 8 -12", 2.4, 0.4))}${p(PRONOTUM, k.a)}${both(p("M39 66Q38 55 47 50Q49 58 45 63Z", k.b))}${threadAnt(k.a)}${el(60, 43, 17, 15, k.a)}${both(el(49.500, 33.500, 3.8, 3, k.b))}${pair(52, 68, 43, mood, DARK)}${cheeks(46, 74, 50)}${smile(60, 50.500, mood, "#fff")}`,
    neck: [60, 56, 14],
    cap: [60, 31, 0.72],
  };
}
function twentyTwoSpot(k, mood) {
  const spots = both(dots([[52, 70], [40, 73], [33.500, 84], [44, 83.500], [54.500, 85], [35, 97], [45.500, 95], [54, 100], [40.500, 106.500], [51.500, 110], [53.500, 77]], 2.7, k.a));
  return {
    body: `${beetleLegs("#c89a1c", 3.2)}${wrap("bd-breathe", p("M60 61C83 60 92 76 90 91C87 108 74 116 60 116C46 116 33 108 30 91C28 76 37 60 60 61Z", k.c, edge("#b89008", 1.4)) + spots + ln("M60 65V115", "#8a6c08", 1.2) + gloss("M34 82q3 -10 11 -14", 3, 0.7))}${p("M40 68C39 52 48 47 60 47C72 47 81 52 80 68C71 63 49 63 40 68Z", k.b, edge("#c8a818", 1))}${dots([[43.500, 61], [76.500, 61], [46, 52.500], [74, 52.500], [60, 66.500]], 2.3, k.a)}${both(ln("M53 32Q46 22 39 22", "#c89a1c", 1.8) + el(38, 22, 2.4, 3.4, "#c89a1c"))}${el(60, 43, 15.500, 14, k.c, edge("#b89008", 1))}${pair(53, 67, 43, mood, { r: 4.8, rim: 1.2 })}${cheeks(48, 72, 50, 0.7)}${smile(60, 50, mood)}`,
    neck: [60, 56, 13],
    cap: [60, 32, 0.66],
  };
}

function jewelBeetle(k, mood, sig) {
  const ely = "M60 61C79 59 87 71 85 85C83 101 70 114 60 121C50 114 37 101 35 85C33 71 41 59 60 61Z";
  const stripes = both(ln("M46 66C39 80 43 99 57 114", k.b, 10.5) + ln("M46 66C39 80 43 99 57 114", k.a, 7) + ln("M45.500 70C41 82 45 98 54 109", "#e05898", 2.2));
  const lines = both(ln("M53 70Q50 90 58 110M39 78Q37 92 48 106", "#0c6a40", 1));
  const body = `${beetleLegs("#14784c", 3.4)}${wrap("bd-breathe", p(ely, k.c, edge("#0a5a38", 1.6)) + stripes + lines + ln("M60 64V119", "#0a5a38", 1.4) + gloss("M37.500 84q1 -11 8 -17", 3, 0.75) + gloss("M72 70q8 5 8 15", 2.2, 0.55))}${p("M41 69C41 53 49 47 60 47C71 47 79 53 79 69C70 63 50 63 41 69Z", k.c, edge("#0a5a38", 1.2))}${both(ln("M49 52Q44 58 44 64", k.b, 6) + ln("M49 52Q44 58 44 64", k.a, 3.8))}${both(ln("M52 33l-4 -5l-5 1l-3 -6l-6 0l-3 -5", "#0c5c3a", 2.6))}${el(60, 43, 15.500, 14, k.c, edge("#0a5a38", 1.2))}${el(60, 34.500, 6, 3.4, k.b, op(0.8))}${pair(52.500, 67.500, 43, mood, { r: 5, ...DARK })}${cheeks(48, 72, 50, 0.75)}${smile(60, 50.500, mood, "#fff")}`;
  const r = { body, neck: [60, 56, 12.500], cap: [60, 32, 0.66] };
  if (!sig) return { ...r, fg: wrap("bd-glow", star(96, 62, 4.4, "#fff") + star(24, 108, 3, "#d8fff0")) };
  const sheen = (cls, col) => sg(cls, p(ely, col, `${op(0.5)} style="mix-blend-mode:screen"`) + p("M44 62Q70 78 78 108Q66 108 52 90Q38 74 44 62Z", col, op(0.55)));
  r.body = body + sheen("shine-a", "#28c8ff") + sheen("shine-b", "#ffc21a") + ln("M40 74Q60 82 76 108", "#fff", 4, `class="bd-s-glow-shine-ray" ${op(0.7)}`);
  r.move = "bd-s-glow-shine-tilt";
  r.xf = "translate(3 1) scale(.95)";
  r.fg = sg("shine-spark", [[14, 30, 7], [102, 24, 5.500], [108, 80, 6.500], [16, 86, 4.500], [94, 112, 4]].map(([x, y, s]) => star(x, y, s, "#fff", edge("#28b8d8", 0.8))).join(""));
  r.css = anim("shine-tilt", "2.4s", "0%,100%{transform:rotate(-13deg)}50%{transform:rotate(13deg)}", "transform:rotate(-13deg);", "60px 100px") + anim("shine-a", "2.4s", "0%,100%{opacity:1}35%,75%{opacity:0}", "opacity:1;") + anim("shine-b", "2.4s", "0%,25%{opacity:0}55%,70%{opacity:1}95%,100%{opacity:0}", "opacity:0;") + anim("shine-ray", "1.2s", "0%{transform:translate(-8px,6px);opacity:0}50%{opacity:.8}100%{transform:translate(12px,-8px);opacity:0}") + anim("shine-spark", "1.2s", "0%,100%{opacity:.2}50%{opacity:1}");
  return r;
}

function goldenTortoise(k, mood, sig) {
  const FLANGE = "M60 44C84 42 103 62 101 83C99 105 81 118 60 118C39 118 21 105 19 83C17 62 36 42 60 44Z";
  const shell = (gold, rim, deep, shine) => p(FLANGE, rim, `${edge(deep, 1.4)} fill-opacity=".62"`)
    + ln("M30 66L40 74M22 88L35 89M33 108L43 99M90 66L80 74M98 88L85 89M87 108L77 99M60 117V107", "#fff", 1.4, op(0.85))
    + el(60, 87, 28, 24, gold, edge(deep, 1.6)) + el(60, 90, 20, 17, shine, op(0.35)) + el(60, 63, 18, 11, gold, edge(deep, 1.2))
    + ln("M60 73V110", deep, 1.2) + dots([[48, 82], [43, 92], [50, 100], [72, 82], [77, 92], [70, 100], [54, 90], [66, 90]], 0.9, deep)
    + p("M38 82Q40 70 52 66Q56 69 50 74Q44 78 44 88Q38 90 38 82Z", "#fff", op(0.8)) + dot(73, 101, 2.6, "#fff", op(0.7));
  const head = `${both(ln("M52 32Q45 20 36 17", "#a86c0c", 2) + dots([[36, 17], [40, 19]], 2, "#a86c0c"))}${el(60, 43, 15, 14, "#e8a824", edge("#a86c0c", 1))}${pair(53, 67, 43, mood, { r: 4.8, rim: 1.2 })}${cheeks(48.500, 71.500, 50, 0.75)}${smile(60, 49.500, mood)}`;
  const body = `${both(limbs([[[40, 62], [24, 54], [14, 60]], [[32, 82], [16, 82], [8, 92]], [[38, 104], [22, 108], [16, 118]]], "#c8861a", 3.4))}${wrap("bd-breathe", shell(k.c, k.b, "#b87c0c", "#fff4a0"))}${sig ? sg("shift-red", shell(k.a, "#ffb878", "#8a2c0c", "#ff9a4a") + dots([[48, 79], [72, 79], [42, 96], [78, 96], [60, 102], [60, 80]], 3, "#2a1008")) : ""}${head}`;
  const r = { body, neck: [60, 56, 12.500], cap: [60, 32, 0.66] };
  if (!sig) return { ...r, fg: wrap("bd-glow", star(98, 52, 4.600, "#fff") + star(20, 106, 3, "#fff6b0")) };
  r.move = "bd-s-glow-shift-body";
  r.fg = sg("shift-ring", ln("M10 46q-7 12 -3 24M110 46q7 12 3 24M16 28q6 -9 15 -12M104 28q-6 -9 -15 -12", "#ff8a3a", 2.8));
  r.css = anim("shift-red", "3.2s", "0%,40%{opacity:1}55%,85%{opacity:0}100%{opacity:1}", "opacity:1;") + anim("shift-body", ".4s", "0%,100%{transform:translateX(-1.200px) rotate(-2deg)}50%{transform:translateX(1.200px) rotate(2deg)}", "transform:rotate(-2deg);", "60px 100px") + anim("shift-ring", "1.6s", "0%{opacity:1}55%{opacity:.2}100%{opacity:1}");
  return r;
}

function firefly(k, mood, sig) {
  const ely = "M60 60C74 59 80 68 79 80C78 94 71 106 60 106C49 106 42 94 41 80C40 68 46 59 60 60Z";
  const lantern = `${wrap(sig ? "bd-s-glow-jay-flash" : "bd-glow", dot(60, 109, sig ? 30 : 19, k.a, op(sig ? 0.55 : 0.4)) + (sig ? dot(60, 108, 20, "#fbffb0", op(0.7)) : ""))}${el(60, 107, 13.500, 11.500, k.a, edge("#88a818", 1.2))}${el(60, 111.500, 8, 5.500, "#fbffd0")}${ln("M49 108q11 5 22 0M52 113.500q8 3.500 16 0", "#98b828", 1.4)}`;
  const body = `${beetleLegs("#2c201c", 3.2)}${lantern}${wrap("bd-breathe", p(ely, k.c, edge(k.b, 3)) + ln("M60 63V105", k.b, 2.6) + gloss("M46 80q1 -10 7 -14", 2.6, 0.35))}${both(ln("M50 34Q36 26 32 14Q30 8 25 8", "#2c201c", 2.6) + dots([[34, 20], [31, 12]], 1.8, "#2c201c"))}${p("M36 52C32 22 46 18 60 18C74 18 88 22 84 52C76 42 44 42 36 52Z", k.b, edge("#c89c40", 1.2))}${both(el(48.500, 28.500, 6, 5, "#f2706a"))}${el(60, 27, 4.600, 7.500, "#221814")}${el(60, 47, 17, 14, "#3a2822")}${p("M43 41Q60 31 77 41Q60 36.500 43 41Z", k.b)}${pair(52, 68, 47, mood, { r: 5.2, ...DARK })}${cheeks(46, 74, 53.500)}${smile(60, 53.500, mood, "#fff")}`;
  const r = { body, neck: [60, 60, 13], cap: [60, 21, 0.66] };
  if (!sig) return r;
  r.xf = "translate(41 -3) scale(.66)";
  r.move = "bd-s-glow-jay-fly";
  const J = "M13 22C13 52 12 84 28 98C42 110 62 104 75 86";
  r.bg = `<rect x="2" y="2" width="116" height="116" rx="20" fill="#1c2050" opacity=".55"/>${[[40, 14], [28, 40], [108, 100], [100, 114], [46, 56]].map(([x, y]) => star(x, y, 2.4, "#fff6c0")).join("")}${ln(J, k.a, 10, op(0.25))}${ln(J, "#fbffb0", 3.6, `class="bd-s-glow-jay-trail" stroke-dasharray="1 8"`)}${dot(13, 22, 3.4, "#fbffb0")}`;
  r.css = anim("jay-flash", "1.5s", "0%,55%{opacity:1}70%,88%{opacity:.08}100%{opacity:1}") + anim("jay-fly", "1.5s", "0%{transform:translate(0,0)}25%{transform:translate(-5px,9px)}50%{transform:translate(0,0)}65%,85%{transform:translate(4px,-7px)}100%{transform:translate(0,0)}") + anim("jay-trail", "1.5s", "0%{stroke-dashoffset:54}100%{stroke-dashoffset:0}", "", "", "linear");
  return r;
}

function rhinoBeetle(k, mood, sig) {
  const dome = "M60 59C87 57 98 75 96 91C94 109 78 118 60 118C42 118 26 109 24 91C22 75 33 57 60 59Z";
  const horn = (col, hi) => ln("M60 40Q58 30 51 23", col, 8.600) + ln("M51 23Q45 18 40 17M51 23Q54 17 54 11", col, 5.4) + ln("M40 17L34 19M40 17L38 9M54 11L48 5M54 11L61 6", col, 3.4) + ln("M58 36Q55 28 50 23", hi, 2, op(0.7));
  const thorax = ln("M72 52Q80 44 81 36", k.a, 7.5) + ln("M81 36L76 28M81 36L88 31", k.a, 4) + ln("M76 49Q80 44 80 39", k.b, 1.8);
  const body = `${beetleLegs(k.a, 5)}${wrap("bd-breathe", p(dome, k.c, edge(k.a, 2)) + ln("M60 66V117", k.a, 1.8) + gloss("M31 86q2 -14 15 -20", 4.4, 0.5) + gloss("M80 104q8 -7 9 -17", 3, 0.3))}${p("M34 70C32 50 45 44 60 44C75 44 88 50 86 70C74 62 46 62 34 70Z", k.c, edge(k.a, 2))}${gloss("M40 62q1 -9 9 -12", 3, 0.4)}${thorax}${both(ln("M47 46L36 42", k.a, 2.4) + ln("M36 42l-7 -4M36 42l-8 1M36 42l-6 5", k.b, 2.6))}${el(60, 50, 15.500, 13.500, k.a)}${horn(k.a, k.b)}${pair(53, 67, 50, mood, { r: 4.600, ...DARK })}${cheeks(48, 72, 56.500)}${smile(60, 57, mood, "#fff")}`;
  const r = { body, neck: [60, 63, 14], cap: [44, 43, 0.5] };
  if (!sig) return r;
  r.xf = "translate(8 9) scale(.87)";
  r.move = "bd-s-glow-toss-body";
  r.fg = sg("toss-log", at("rotate(-32 22 20)", `<rect x="8" y="12" width="28" height="15" rx="6" fill="#a8743c" stroke="#5c3a18" stroke-width="1.6"/>${el(34, 19.500, 4.4, 6.600, "#e8c488", edge("#5c3a18", 1.2))}${el(34, 19.500, 2, 3, "none", edge("#a8743c", 1))}${ln("M12 17h13M14 23h10", "#5c3a18", 1.2)}`)) + sg("toss-whoosh", ln("M8 54Q2 40 6 30M17 50Q12 40 14 34M42 6Q52 1 64 4", "#fff6d8", 2.6));
  r.css = anim("toss-body", "1.5s", "0%,100%{transform:rotate(-11deg)}35%{transform:rotate(9deg) translateY(2px)}60%{transform:rotate(-18deg) translateY(-3px)}", "transform:rotate(-9deg);", "64px 98px") + anim("toss-log", "1.5s", "0%,35%{transform:translate(8px,14px) rotate(0)}70%{transform:translate(-3px,-6px) rotate(-130deg)}100%{transform:translate(8px,14px) rotate(-360deg)}", "", "22px 20px") + anim("toss-whoosh", "1.5s", "0%,35%{opacity:.15}60%{opacity:1}100%{opacity:.15}", "opacity:.9;");
  return r;
}

function stagBeetle(k, mood, sig) {
  const jaw = p("M47 43C33 40 23 29 25 18C27 8 37 3 46 5C50 6 53 9 55 13L49 12.500L51 17C46 13 38 12 36 18C36 21 37 23 39 24L47 23L41 29C45 33 50 35 54 38Z", k.c, edge(k.a, 1.6)) + ln("M31 28Q27 16 37 9", k.b, 2, op(0.85));
  const ant = ln("M43 43L28 45L22 36", "#7a5a52", 1.8) + ln("M22 36l-5 -1.500M23.500 38.500l-5.500 .500M25 41l-5 2.500", "#c8845a", 2);
  const dome = "M60 62C82 60 91 76 89 91C87 108 74 118 60 118C46 118 33 108 31 91C29 76 38 60 60 62Z";
  const body = `${beetleLegs(k.a, 4.4)}${wrap("bd-breathe", p(dome, k.c, edge(k.a, 2)) + ln("M60 66V117", k.a, 1.8) + gloss("M36 86q2 -13 12 -18", 3.6, 0.5) + gloss("M75 104q8 -7 9 -17", 2.6, 0.3))}${p("M35 69C33 54 44 50 60 50C76 50 87 54 85 69C73 62 47 62 35 69Z", k.a)}${gloss("M40 62q2 -6 9 -8", 2.4, 0.35)}${both(sig ? sg("jaws-bite", jaw) : jaw)}${both(ant)}${p("M39 46C39 33 48 33 60 35C72 33 81 33 81 46C81 57 72 60 60 60C48 60 39 57 39 46Z", k.a)}${ln("M45 38Q60 43 75 38", "#4a3a42", 1.6)}${pair(49, 71, 47, mood, { r: 4.8, ...DARK })}${cheeks(46, 74, 54.500)}${smile(60, 53.500, mood, "#fff")}`;
  const r = { body, neck: [60, 60, 15], cap: [60, 37, 0.52] };
  if (!sig) return r;
  r.xf = "translate(7 8) scale(.88)";
  r.move = "bd-s-glow-jaws-body";
  r.over = ln("M15 16Q40 9 62 15Q86 21 108 10", "#6a4622", 6.600) + ln("M17 15Q40 9 60 14", "#a8784a", 2) + ln("M30 11l-6 -8M90 17l7 8", "#6a4622", 3) + p("M24 4q8 -4 10 3q-7 4 -10 -3Z", "#5aa448");
  r.fg = sg("jaws-effort", ln("M8 44l-6 -4M10 56l-8 1M112 40l6 -4M110 53l8 1", "#fff2c8", 2.8));
  r.css = anim("jaws-body", ".9s", "0%,100%{transform:rotate(-12deg)}25%{transform:rotate(-8deg) translateY(-4px)}55%{transform:rotate(11deg)}80%{transform:rotate(7deg) translateY(-3px)}", "transform:rotate(-9deg);", "60px 96px") + anim("jaws-bite", ".45s", "0%,100%{transform:rotate(8deg)}50%{transform:rotate(3deg)}", "transform:rotate(8deg);", "50px 40px") + anim("jaws-effort", ".45s", "0%,100%{opacity:1}50%{opacity:.2}");
  return r;
}

// ================= bees and dragonfly =================
const gauze = (d, veins, col = "#e4f6ff") => p(d, col, `${edge("#6a8498", 1.2)} fill-opacity=".72"`) + ln(veins, "#6a8498", 0.8);

function bumblebee(k, mood, sig) {
  const wing = gauze("M44 68C30 54 12 44 6 50C0 60 16 74 42 76Z", "M43 70Q24 58 9 54M41 73Q24 68 12 63M24 58Q20 64 22 68M32 63Q30 68 32 72") + gauze("M42 77C28 74 13 76 13 84C16 92 32 88 43 82Z", "M41 78Q28 79 16 84M30 79Q28 83 30 86");
  const stance = [[[42, 70], [28, 73], [24, 85]], [[36, 88], [20, 94], [18, 106]], [[43, 106], [32, 112], [28, 119]]];
  const legs = limbs(sig ? stance.slice(0, 2) : stance, "#161218", 4.2);
  const abdomen = fuzz(60, 89, 26.500, 24.500, k.c, 30, 3) + p("M34 80q3 4 6 2q3 4 7 3q4 4 8 2q5 3 10 0q4 2 8 -2q4 1 7 -3q3 2 6 -2l1 12q-4 0 -5 3q-4 0 -6 4q-4 -1 -7 3q-4 -1 -9 2q-5 -3 -9 -2q-3 -4 -7 -3q-2 -4 -6 -4q-1 -3 -5 -3Z", k.a)
    + p("M39 106Q60 112 81 106Q75 117 60 117Q45 117 39 106Z", k.b) + fuzz(60, 109, 17, 7, k.b, 18, 2.4);
  const head = `${both(ln("M52 33L42 18L31 17", "#161218", 2.8) + dot(31, 17, 2.2, "#161218"))}${fuzz(60, 46, 18, 16.500, k.c, 24, 2.4)}${fuzz(60, 34, 7, 3.500, k.a, 10, 2)}${pair(51, 69, 46, mood, { r: 5.8, ...DARK })}${cheeks(45, 75, 55)}${smile(60, 54.500, mood, "#fff")}`;
  const wings = both(wrap(sig ? "bd-s-glow-buzz-wing" : "bd-flap", wing));
  const body = `${wings}${both(legs)}${wrap("bd-breathe", abdomen)}${fuzz(60, 65, 22, 10.500, k.a, 24, 3.4)}${head}`;
  const r = { body, neck: [60, 61, 15], cap: [60, 32, 0.74] };
  if (!sig) return r;
  r.xf = "translate(13 7) scale(.78)";
  r.move = "bd-s-glow-buzz-body";
  r.bg = ln("M60 119Q58 108 60 98", "#4a8a3a", 4) + p("M60 112Q42 98 26 106Q42 120 60 112ZM60 112Q80 96 96 104Q82 120 60 112Z", "#5aa448");
  r.over = both(ln("M42 96Q26 106 34 117L50 118", "#161218", 5));
  r.fg = [-72, -36, 36, 72, 0].map((a) => at(`rotate(${a + 180} 60 99)`, p("M60 99Q50 87 60 72Q70 87 60 99Z", "#ffe23a", edge("#d8a808", 1)))).join("") + p("M53 97L67 97L63 114Q60 118 57 114Z", "#f2a818", edge("#b87808", 1.2)) + ln("M60 100v13", "#b87808", 1)
    + sg("buzz-pollen", dots([[44, 106], [76, 108], [36, 98], [84, 96], [52, 116], [70, 117], [28, 112], [92, 112]], 2.2, "#ffd21a")) + sg("buzz-lines", both(ln("M19 18q-8 10 -3 22M9 13q-12 15 -4 33", "#fff", 2.4)));
  r.css = anim("buzz-body", ".12s", "0%,100%{transform:translate(-1.600px,0)}25%{transform:translate(1px,-1.200px)}50%{transform:translate(1.600px,.600px)}75%{transform:translate(-1px,1px)}", "", "", "linear") + anim("buzz-wing", ".08s", "0%,100%{transform:rotate(-3deg)}50%{transform:rotate(5deg)}", "", "43px 74px", "linear") + anim("buzz-pollen", ".8s", "0%{transform:translateY(-8px);opacity:0}30%{opacity:1}100%{transform:translateY(8px);opacity:0}", "", "", "linear") + anim("buzz-lines", ".24s", "0%,100%{opacity:1}50%{opacity:.25}");
  return r;
}

function honeybee(k, mood, sig) {
  const farLegs = limbs([[[76, 84], [88, 94], [100, 104]], [[66, 86], [72, 102], [76, 112]], [[56, 86], [48, 100], [48, 112]]], "#6a5038", 2.8);
  const wings = gauze("M62 66C50 46 30 28 16 32C10 40 30 60 58 70Z", "M60 66Q40 46 20 35M56 68Q38 58 22 43M38 45Q36 51 40 56M30 40Q28 45 31 49") + gauze("M60 70C42 62 20 54 14 61C16 70 38 74 58 74Z", "M58 71Q38 65 18 62M40 66Q38 69 40 72", "#d8eefc");
  const abdomen = p("M58 74C48 62 22 66 13 84C7 94 8 102 14 106C26 112 52 106 60 90Z", k.c, edge(k.a, 1.4))
    + p("M47 68.500Q40 86 46 104L37 106.500Q31 86 38 68.500Z", k.a) + p("M29 72Q22 90 27 108L19 108Q14 94 20 79Z", k.a) + p("M13 86Q9 96 14 106L8.500 100Q8 93 13 86Z", k.a)
    + ln("M50 70Q45 86 50 101M34 71Q27 89 33 108", k.b, 2) + gloss("M24 76q9 -8 22 -7", 2.4, 0.5);
  const nearLegs = limbs([[[74, 88], [80, 102], [90, 115], [95, 115]], [[64, 90], [60, 104], [64, 117], [69, 117]]], k.a, 3.4) + limbs([[[54, 88], [36, 99], [32, 114], [26, 116]]], k.a, 3.8) + el(34, 101, 6.500, 8, "#ffae1a", `${edge("#c87808", 1.2)} transform="rotate(26 34 101)"`) + dots([[32, 99], [36, 103], [35, 97]], 1, "#ffd86a");
  const thorax = fuzz(65, 77, 14, 13.500, "#b8802c", 20, 3.2) + fuzz(64, 73, 8, 6, k.b, 12, 2.4);
  const head = `${ln("M88 51L92 35L106 31", k.a, 2.8)}${ln("M96 52L106 41L115 46", k.a, 2.8)}${dots([[106, 31], [115, 46]], 2, k.a)}${el(88, 66, 18, 17, k.a)}${fuzz(82, 55, 9, 6, "#c89038", 12, 2.2)}${eye(82, 65, mood, { r: 5.4, ...DARK })}${eye(97, 65, mood, { r: 4.6, ...DARK })}${el(77, 73.500, 3.4, 2.2, "#ff7f9c", op(0.7))}${smile(91, 74, mood, "#fff")}`;
  const body = `${farLegs}${wrap(sig ? "bd-s-glow-waggle-wing" : "bd-flap", wings)}${wrap(sig ? "" : "bd-breathe", abdomen)}${nearLegs}${thorax}${head}`;
  const r = { body, neck: [82, 80, 11.500], cap: [86, 51, 0.62] };
  if (!sig) return r;
  const hex = (x, y, f) => p(`M${x} ${y - 11}l9.500 5.500v11l-9.500 5.500l-9.500 -5.500v-11Z`, f, edge("#d89c28", 1.6));
  r.bg = at("translate(0 -3)", [[16, 16], [35, 16], [54, 16], [73, 16], [92, 16], [25.500, 32.500], [101.500, 32.500], [16, 49], [16, 82], [25.500, 98.500], [35, 115], [54, 115], [73, 115], [92, 115], [101.500, 98.500], [111, 82], [111, 49], [111, 16]].map(([x, y], i) => hex(x, y, i % 3 ? "#ffd86a" : "#f6b83a")).join(""))
    + ln("M32 100C-2 78 22 28 60 58C98 88 118 30 84 18C62 12 44 70 32 100", "#7a4a10", 2.2, `class="bd-s-glow-waggle-path" stroke-dasharray="5 5"`) + ln("M34 99L82 24M70 26L83 22L82 36", "#fff", 3.4);
  r.xf = "translate(64 66) rotate(-38) scale(.72) translate(-58 -80)";
  r.move = "bd-s-glow-waggle-body";
  r.fg = sg("waggle-marks", ln("M24 66q-7 6 -6 15M30 74q-5 4 -4 10M72 102q10 -2 14 -10M78 109q10 -2 15 -9", "#fff", 2.8));
  r.css = anim("waggle-body", ".22s", "0%,100%{transform:rotate(-9deg)}50%{transform:rotate(9deg)}", "transform:rotate(-7deg);", "56px 74px", "linear") + anim("waggle-wing", ".1s", "0%,100%{transform:rotate(-5deg)}50%{transform:rotate(8deg)}", "", "60px 70px", "linear") + anim("waggle-path", "1s", "0%{stroke-dashoffset:20}100%{stroke-dashoffset:0}", "", "", "linear") + anim("waggle-marks", ".22s", "0%,100%{opacity:1}50%{opacity:.15}", "", "", "linear");
  return r;
}

function dragonfly(k, mood, sig) {
  const wing = gauze("M56 54C40 44 18 37 4 40C0 45 6 50 17 52C32 56 46 60 57 60Z", "M55 55Q32 45 6 43M55 57Q34 52 12 49M18 43l2 8M28 45l2 9M38 49l1 8M47 52v7M11 46l24 5")
    + gauze("M56 62C40 59 16 59 5 69C2 79 13 85 27 83C43 80 52 73 58 69Z", "M55 63Q32 62 8 70M55 65Q36 70 12 79M55 68Q42 75 28 81M19 65l5 14M31 64l5 13M43 63l4 10M12 73l22 0")
    + ln("M8 40.700L15 40.500", k.a, 3.4) + ln("M9 67L15 64.500", k.a, 3.4);
  const abdomen = p("M54 68C50 80 52 96 55.500 112Q57 120 60 121Q63 120 64.500 112C68 96 70 80 66 68Z", k.c, edge(k.a, 1.4)) + p("M58.500 70L61.500 70L62.500 84L64 90L61.500 96L64 103L61.500 109L60 120L58.500 109L56 103L58.500 96L56 90L57.500 84Z", k.a)
    + ln("M53 80h14M53 91h14M54 101h12M56 110h8", k.a, 1.4) + gloss("M55 74q-1.500 8 -.500 18", 2, 0.5);
  const legs = sig
    ? both(limbs([[[51, 61], [37, 66], [43, 76], [48, 78]], [[52, 67], [32, 79], [43, 91], [51, 90]], [[54, 71], [37, 93], [49, 101], [57, 97]]], k.a, 2.8) + ln("M40 66l-4 -3M37 82l-5 1M34 80l-4 -2M40 94l-4 2M43 97l-3 4", k.a, 1.4))
    : both(limbs([[[52, 60], [40, 60], [36, 69]], [[52, 66], [38, 74], [36, 86]], [[54, 70], [46, 84], [45, 96]]], k.a, 2.6));
  const thorax = el(60, 62, 12, 13, k.b, edge("#3c7a1c", 1.4)) + ln("M53 55Q58 62 55 72M67 55Q62 62 65 72", "#3c7a1c", 1.6);
  const head = `${el(60, 43, 20, 14, k.b, edge("#3c7a1c", 1.2))}${both(ln("M55 27l-4 -9", k.a, 1.4))}${both(el(49, 37, 12.500, 12, "#2c9ab0", edge("#125a78", 1.2)) + el(47, 31, 6, 4, "#a8f4e0", op(0.55)))}${pair(49.500, 70.500, 38, mood, { r: 6.4, iris: "#3fd0c4", lid: "#08283c" })}${cheeks(46, 74, 49.500, 0.7)}${smile(60, 48.500, mood)}`;
  const wings = both(wrap(sig ? "bd-s-glow-hawk-wing" : "bd-flap", wing));
  if (!sig) return { body: `${wings}${legs}${wrap("bd-breathe", abdomen)}${thorax}${head}`, neck: [60, 55, 12], cap: [60, 25, 0.55] };
  const midge = sg("hawk-prey", dot(60, 84, 13, "#fff6c8", op(0.75)) + el(52, 79, 8, 4, "#fff", `${edge("#5a6a80", 1)} transform="rotate(35 52 79)"`) + el(68, 79, 8, 4, "#fff", `${edge("#5a6a80", 1)} transform="rotate(-35 68 79)"`) + el(60, 87, 5.500, 7, "#7a4a30", edge("#2a1408", 1)) + dots([[57.500, 85], [62.500, 85]], 1.8, "#fff") + dots([[57.500, 85.400], [62.500, 85.400]], 0.9, "#14131f"));
  return {
    body: `${wings}${abdomen}${thorax}${head}`,
    neck: [60, 54, 12],
    cap: [60, 25, 0.55],
    over: midge + legs,
    xf: "rotate(-24 60 68) translate(4 2) scale(.93)",
    move: "bd-s-glow-hawk-body",
    bg: sg("hawk-speed", ln("M78 100l14 18M92 90l16 20M66 108l8 12M102 82l12 14", "#fff", 2.6)),
    css: anim("hawk-body", "1.6s", "0%,100%{transform:translate(0,0)}30%{transform:translate(-8px,-6px) rotate(-6deg)}55%{transform:translate(7px,5px) rotate(7deg)}75%{transform:translate(2px,-2px)}", "", "60px 70px") + anim("hawk-wing", ".14s", "0%,100%{transform:rotate(-7deg)}50%{transform:rotate(9deg)}", "", "57px 62px", "linear") + anim("hawk-speed", ".5s", "0%,100%{opacity:1}50%{opacity:.2}") + anim("hawk-prey", ".3s", "0%,100%{transform:translate(-.800px,0)}50%{transform:translate(.800px,.600px)}"),
  };
}

// ================= spiders (eight legs, eight eyes, two short palps) =================
const T_LEGS = [[[46, 67], [31, 47], [17, 49], [8, 63]], [[43, 75], [23, 65], [11, 77], [6, 93]], [[44, 83], [24, 82], [17, 99], [9, 115]], [[49, 88], [35, 90], [32, 106], [27, 117]]];
function hairy(pts, col, hair, w = 7.6) {
  let h = "";
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i], len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, nx = -(b[1] - a[1]) / len, ny = (b[0] - a[0]) / len;
    for (const t of [0.3, 0.72]) for (const s of [1, -1]) {
      const [x, y] = mix(a, b, t);
      h += `M${n(x + nx * s * w * 0.34)} ${n(y + ny * s * w * 0.34)}l${n(nx * s * 3.2 + ((b[0] - a[0]) / len) * 2)} ${n(ny * s * 3.2 + ((b[1] - a[1]) / len) * 2)}`;
    }
  }
  return ln(h, hair, 0.9) + ln(path(pts), col, w);
}
const smallEyes = (list, r = 2) => list.map(([x, y]) => dot(x, y, r, "#0c0a12", edge("#fff", 0.7)) + dot(x + 0.6, y - 0.6, 0.6, "#fff")).join("");
const T_EYES = [[56.500, 57.500], [63.500, 57.500], [50.500, 59.500], [69.500, 59.500], [43.500, 64], [76.500, 64]];

function redknee(k, mood, sig) {
  const knee = (pts) => ln(path([mix(pts[0], pts[1], 0.68), pts[1], mix(pts[1], pts[2], 0.52)]), k.a, 8) + ln(path([mix(pts[1], pts[2], 0.56), mix(pts[1], pts[2], 0.68)]), k.b, 7.8) + ln(path([mix(pts[2], pts[3], 0.34), mix(pts[2], pts[3], 0.46)]), k.b, 7.6);
  const leg = (pts) => hairy(pts, k.c, "#a8603c") + knee(pts) + dot(pts[3][0], pts[3][1], 3.6, "#4a3834");
  const legs = (sig ? T_LEGS.slice(1) : T_LEGS).map(leg).join("");
  const abdomen = fuzz(60, 43, 23, 20, k.c, 30, 4) + ln("M45 33l-6 -8M52 27l-3 -10M62 25l1 -10M71 29l5 -9M77 36l8 -6M42 42l-9 -2M78 45l9 0M56 36l-4 -7M68 37l4 -6", "#e8582a", 1.2);
  const hind = both(sg("flick-leg", hairy([[45, 70], [21, 57], [23, 32], [47, 40]], k.c, "#a8603c") + ln("M29 61.500L21 57L21.800 47", k.a, 8) + ln("M22 45L22.400 41", k.b, 7.8) + ln("M31 35l5 1.600", k.b, 7.6) + dot(47, 40, 3.4, "#4a3834")));
  const cara = fuzz(60, 74, 21, 18.500, k.b, 28, 3.2) + fuzz(60, 74, 16.500, 15, k.c, 24, 2.6) + ln("M60 57v7M50 60l5 6M70 60l-5 6", k.b, 1.4, op(0.8));
  const palps = both(hairy([[49, 85], [43, 93], [47, 98]], k.c, "#a8603c", 5.4) + ln("M45.500 90L43.500 92.800L44.800 95", k.a, 5.6) + dot(47, 98.500, 2.8, k.b));
  const jaws = both(fuzz(54.500, 88, 5, 7, "#4a3430", 12, 1.6) + ln("M55 93q1 4 4 3", "#14090a", 2));
  const face = `${smallEyes(T_EYES)}${pair(52, 68, 69, mood, { r: 5.8, ...DARK })}${cheeks(46.500, 73.500, 77.500)}${smile(60, 77.500, mood, "#fff")}`;
  const body = `${both(legs)}${sig ? sg("flick-rump", abdomen) + hind : wrap("bd-breathe", abdomen)}${cara}${jaws}${palps}${face}`;
  const r = { body, neck: [60, 87, 15], cap: [60, 59, 0.72] };
  if (!sig) return r;
  r.fg = [0, 1, 2].map((i) => sg(`flick-fluff${i}`, [[[27, 17], [93, 14], [40, 8]], [[16, 26], [104, 24], [75, 6]], [[34, 6], [88, 4], [108, 38], [10, 40]]][i].map(([x, y]) => ln(`M${x} ${y}l3 -5M${x + 4} ${y + 2}l5 -2M${x - 3} ${y - 2}l-4 -3M${x + 1} ${y + 4}l1 4`, i === 1 ? "#ffe0b0" : "#ff8a3a", 1.4)).join(""))).join("");
  r.css = anim("flick-leg", ".26s", "0%,100%{transform:rotate(0)}50%{transform:rotate(-7deg) translate(2px,3px)}", "", "45px 70px", "linear") + anim("flick-rump", ".52s", "0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}") + [0, 1, 2].map((i) => anim(`flick-fluff${i}`, "1.2s", "0%{transform:translateY(8px);opacity:0}35%{opacity:1}100%{transform:translateY(-9px);opacity:0}", "", "", `ease-out;animation-delay:-${(i * 0.4).toFixed(1)}s`)).join("");
  return r;
}

function greenbottle(k, mood, sig) {
  const pts4 = [[[46, 67], [30, 52], [15, 57], [10, 73]], [[43, 75], [22, 72], [9, 86], [5, 101]], [[45, 83], [26, 86], [17, 103], [12, 116]], [[50, 89], [38, 93], [36, 107], [34, 118]]];
  const leg = (pts) => hairy(pts, k.c, "#8ab8ff") + ln(path([mix(pts[0], pts[1], 0.5), pts[1]]), "#4a96f0", 4) + ln(path([mix(pts[1], pts[2], 0.15), mix(pts[1], pts[2], 0.85)]), "#6ab4ff", 2.4) + dot(pts[3][0], pts[3][1], 3.6, "#1a3a8a");
  const abdomen = fuzz(60, 42, 24, 22, k.a, 32, 5) + p("M60 24Q66 40 60 58Q54 40 60 24Z", "#5a2410", op(0.75)) + both(ln("M44 31q7 3 11 9M41 42q8 2 12 8M44 53q6 0 11 5", "#5a2410", 3, op(0.75))) + ln("M44 25l-5 -9M60 20v-10M76 25l5 -9M37 38l-10 -3M83 38l10 -3", "#ffb868", 1.4);
  const cara = fuzz(60, 74, 21, 18.500, k.b, 28, 3) + ln("M60 56v8M48 60l6 6M72 60l-6 6M42 72l8 1M78 72l-8 1", "#8af4e0", 1.6) + el(60, 63, 8, 4, "#b8fff0", op(0.45));
  const palps = both(hairy([[49, 85], [43, 93], [47, 98]], k.c, "#8ab8ff", 5.4) + dot(47, 98.500, 2.8, "#1a3a8a"));
  const jaws = both(fuzz(54.500, 88, 5, 7, "#2a2c6a", 12, 1.6) + ln("M55 93q1 4 4 3", "#0a0a28", 2));
  const face = `${smallEyes(T_EYES)}${pair(52, 68, 69, mood, { r: 5.8, ...DARK })}${cheeks(46.500, 73.500, 77.500, 0.75)}${smile(60, 77.500, mood, "#06303a")}`;
  const mat = ln("M2 112Q30 104 60 114Q90 104 118 112M6 120Q34 112 60 121Q86 112 114 120M14 108L30 121M44 109L36 121M76 109L86 121M104 108L90 121M60 114v7", "#fff", 0.9, op(0.8));
  const body = `${both(pts4.map(leg).join(""))}${sig ? sg("silk-rump", abdomen) : wrap("bd-breathe", abdomen)}${cara}${jaws}${palps}${face}`;
  const r = { body, neck: [60, 87, 15], cap: [60, 59, 0.72], bg: mat };
  if (!sig) return r;
  r.move = "bd-s-glow-silk-body";
  r.xf = "translate(5 9) scale(.9)";
  r.bg = ln("M2 4L60 60L118 4M2 60L60 60L118 60M2 118L60 60L118 118M60 2V60M24 24Q42 34 60 23Q78 34 96 24M14 14Q40 22 60 9Q80 22 106 14M20 60Q28 40 24 24M100 60Q92 40 96 24M24 96Q30 78 20 60M96 96Q90 78 100 60", "#fff", 1.1, op(0.75)) + mat;
  r.fg = ln("M82 38C112 30 118 66 96 74C80 82 96 96 116 92", "#fff", 2.2, `class="bd-s-glow-silk-thread" stroke-dasharray="7 4"`) + sg("silk-shine", [[22, 24], [100, 14], [112, 108], [10, 82]].map(([x, y]) => star(x, y, 4, "#fff")).join(""));
  r.css = anim("silk-body", "1.6s", "0%,100%{transform:translateX(-6px) rotate(-6deg)}50%{transform:translateX(6px) rotate(6deg)}", "transform:translateX(-4px) rotate(-5deg);", "60px 110px") + anim("silk-rump", ".4s", "0%,100%{transform:rotate(-9deg)}50%{transform:rotate(9deg)}", "", "60px 62px") + anim("silk-thread", ".8s", "0%{stroke-dashoffset:22}100%{stroke-dashoffset:0}", "", "", "linear") + anim("silk-shine", "1.6s", "0%,100%{opacity:.2}50%{opacity:1}");
  return r;
}

function peacockSpider(k, mood, sig) {
  const blue = k.b, red = k.a, fur = k.c;
  // the abdominal fan: red-orange bands on iridescent blue-green, fringed with white hairs
  const fan = (cx, cy, rx, ry) => {
    const arc = (s, col, w) => ln(`M${n(cx - rx * s)} ${n(cy + ry * s * 0.35)}C${n(cx - rx * s)} ${n(cy - ry * s * 1.2)} ${n(cx + rx * s)} ${n(cy - ry * s * 1.2)} ${n(cx + rx * s)} ${n(cy + ry * s * 0.35)}`, col, w);
    return fuzz(cx, cy, rx, ry, "#fff4dc", 34, 3) + el(cx, cy, rx - 2, ry - 2, "#241410") + el(cx, cy + 1, rx - 4, ry - 4, blue)
      + arc(0.77, red, n(rx * 0.11)) + arc(0.6, "#4af0d8", n(rx * 0.07)) + arc(0.43, red, n(rx * 0.1))
      + ln(`M${cx} ${n(cy - ry * 0.7)}V${n(cy + ry * 0.5)}`, red, n(rx * 0.1)) + both2(cx, el(n(cx - rx * 0.42), n(cy - ry * 0.16), n(rx * 0.13), n(ry * 0.17), "#1c2a88", `${edge("#ffb030", 1.4)}`))
      + el(cx, n(cy - ry * 0.1), n(rx * 0.1), n(ry * 0.16), "#2a50e0", edge("#8af8ff", 1));
  };
  const thin = (pts, w = 4.4) => hairy(pts, fur, "#e8dccc", w) + dot(pts.at(-1)[0], pts.at(-1)[1], 2.4, "#3a2c26");
  const legs = both(thin([[44, 80], [28, 76], [18, 90], [17, 103]]) + thin([[43, 90], [25, 93], [16, 106], [9, 116]]) + thin([[48, 95], [35, 101], [33, 111], [26, 118]]));
  const third = (pts, knee) => ln(path(pts), "#2c201c", 4.8) + fuzz(knee[0], knee[1], 4.4, 4.4, "#100c0c", 10, 2.6) + ln(path([mix(pts[pts.length - 2], pts.at(-1), 0.45), pts.at(-1)]), "#fff", 5);
  const head = `${fuzz(60, 80, 23, 18, fur, 30, 3, edge("#3a2a22", 1.3))}${p("M42 69Q50 61 56 63L54 67Q48 67 44 73ZM78 69Q70 61 64 63L66 67Q72 67 76 73Z", red)}${ln("M60 63V69", blue, 3)}${smallEyes([[48, 63.500], [72, 63.500], [55.500, 62], [64.500, 62]], 1.9)}${smallEyes([[38.500, 74], [81.500, 74]], 4)}${eye(50.500, 77.500, mood, { r: 8, ring: "#e8d4c0", lid: "#fff" })}${eye(69.500, 77.500, mood, { r: 8, ring: "#e8d4c0", lid: "#fff" })}${ln("M40 87q6 6 12 3M80 87q-6 6 -12 3", "#f4ece0", 3)}${cheeks(43, 77, 89, 0.8)}${smile(60, 89, mood, "#fff")}${both(fuzz(52, 99, 4.600, 6, "#f6f0e6", 12, 2.4))}`;
  if (!sig) {
    const idle3 = both(third([[45, 74], [27, 57], [14, 67], [9, 82]], [27, 57]));
    return { body: `${wrap("bd-breathe", fan(60, 49, 23, 21))}${idle3}${legs}${head}`, neck: [60, 96, 14], cap: [60, 62, 0.56] };
  }
  return {
    body: `${sg("dance-fan", fan(60, 47, 44, 40))}${both(sg("dance-leg", third([[45, 72], [22, 58], [7, 34], [10, 5]], [22, 58])))}${legs}${head}`,
    neck: [60, 96, 14],
    cap: [60, 63, 0.66],
    move: "bd-s-glow-dance-body",
    fg: sg("dance-beat", ln("M6 98q-6 7 -3 16M114 98q6 7 3 16M25 119h-9M95 119h9", "#fff2b0", 2.6)) + sg("dance-note", star(108, 28, 5, "#ffe85a", edge("#c85a1a", 0.8)) + star(106, 70, 4, "#6af4ff", edge("#1a6a9a", 0.8)) + star(14, 48, 3.600, "#ffe85a", edge("#c85a1a", 0.8))),
    css: anim("dance-fan", "1.2s", "0%,100%{transform:rotate(-7deg)}25%{transform:rotate(0) scale(1.03)}50%{transform:rotate(7deg)}75%{transform:rotate(0) scale(.96)}", "transform:rotate(-4deg);", "60px 80px") + anim("dance-leg", ".6s", "0%,100%{transform:rotate(-6deg)}50%{transform:rotate(15deg)}", "", "45px 72px") + anim("dance-body", "1.2s", "0%,100%{transform:translateX(-5px)}50%{transform:translateX(5px)}") + anim("dance-beat", ".2s", "0%,100%{opacity:1}50%{opacity:.15}", "", "", "linear") + anim("dance-note", ".6s", "0%,100%{opacity:.3}50%{opacity:1}"),
  };
}
const both2 = (cx, svg) => `${svg}<g transform="matrix(-1 0 0 1 ${2 * cx} 0)">${svg}</g>`;

// ================= masters of disguise =================
/** A flat petal or leaf lobe running along a leg segment. */
function lobe(a, b, w, fill, stroke) {
  const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = (-dy / l) * w, ny = (dx / l) * w;
  const m = mix(a, b, 0.55);
  return p(`M${a[0]} ${a[1]}Q${n(m[0] + nx)} ${n(m[1] + ny)} ${b[0]} ${b[1]}Q${n(m[0] - nx)} ${n(m[1] - ny)} ${a[0]} ${a[1]}Z`, fill, edge(stroke, 1.2));
}

function orchidMantis(k, mood, sig) {
  const pink = k.a, pale = k.c, line = "#d86a9a";
  const walk = (hip, knee, foot, w) => ln(path([hip, knee, foot, [foot[0] + (foot[0] < 60 ? -5 : 5), foot[1] + 1]]), "#e890b4", 3) + lobe(hip, knee, w, pale, line) + ln(path([mix(hip, knee, 0.25), mix(hip, knee, 0.8)]), pink, 1.6, op(0.8));
  const legs = walk([54, 78], [24, 79], [12, 108], 13) + walk([66, 78], [96, 73], [109, 102], 13) + walk([55, 89], [37, 101], [34, 117], 10) + walk([66, 90], [88, 97], [91, 117], 10);
  const abdomen = p("M63 78C80 80 98 70 101 46C112 58 113 80 100 91C90 101 74 100 62 94Z", pale, edge(line, 1.4)) + ln("M70 86Q92 86 103 57", pink, 3.4, op(0.65)) + ln("M78 81q2 7 8 14M90 73q4 5 13 10M97 62q5 3 11 5", line, 1.2) + dot(101, 48, 2.6, "#8ac858");
  const thorax = p("M54.500 52C54 62 50 70 51 82C52 94 68 94 69 82C70 70 66 62 65.500 52Z", k.b, edge(line, 1.2)) + ln("M60 58V90", pink, 2, op(0.7));
  const claw = lobe([53, 70], [39, 88], 5.500, pale, line) + lobe([39, 88], [52, 72], 7.500, k.b, line) + ln("M52 72Q60 76 57 87", "#e070a0", 3.6) + ln("M55.500 76l4 -1M57 80l4 -.500M57 84l3.600 .500", "#b84478", 1.2) + dot(57, 88, 1.8, "#8ac858");
  const head = `${both(ln("M52 27Q40 10 22 8", "#c86a94", 1.4))}${p("M36 33C36 24 46 24 51 27Q56 22 60 12Q64 22 69 27C74 24 84 24 84 33C84 43 72 50 66 55Q60 60 54 55C48 50 36 43 36 33Z", pale, edge(line, 1.4))}${p("M55 24Q60 14 65 24Q60 28 55 24Z", pink)}${both(el(45, 34, 9.500, 10, "#f8c8dc", edge(line, 1)) + ln("M40 28l9 13M47 26l6 9", "#fff", 1.4, op(0.9)))}${pair(46, 74, 35, mood, { r: 5.8, rim: 1.4 })}${cheeks(48, 72, 46.500, 0.8)}${smile(60, 46, mood, "#8a2a58")}${dot(60, 51.500, 1.4, "#8ac858")}`;
  const body = `${abdomen}${legs}${thorax}${head}`;
  const forelegs = both(sig ? sg("sway-claw", claw) : wrap("bd-bob", claw));
  const r = { body, neck: [60, 57, 9], cap: [60, 26, 0.62], over: forelegs };
  if (!sig) return r;
  r.move = "bd-s-glow-sway-body";
  r.xf = "translate(2.500 -2) scale(.95)";
  r.bg = ln("M4 119Q40 112 62 117Q90 121 116 113", "#5a9a48", 4) + [[10, 113, 8], [112, 108, 7]].map(([x, y, s]) => flower(x, y, s, "#ffd0e4", "#ffd84d")).join("");
  r.fg = sg("sway-guest", ln("M92 34q12 2 14 -8q0 -8 8 -10", "#fff", 1.4, `stroke-dasharray="2 4"`) + el(94, 19, 5.500, 3.4, "#e8f6ff", `${edge("#6a8498", 0.8)} transform="rotate(-35 94 19)"`) + el(104, 18, 5.500, 3.4, "#e8f6ff", `${edge("#6a8498", 0.8)} transform="rotate(35 104 18)"`) + el(99, 24, 7, 5.500, "#ffc41a") + ln("M97 19.500v9M101.500 20v8.500", "#3a2410", 2.2) + dot(103, 23, 1.2, "#14131f")) + sg("sway-petal", [[14, 36], [24, 62], [108, 118]].map(([x, y], i) => el(x, y, 4.5, 2.6, "#ffc0da", `transform="rotate(${i * 50 - 30} ${x} ${y})"`)).join(""));
  r.css = anim("sway-body", "2.6s", "0%,100%{transform:rotate(-11deg)}50%{transform:rotate(11deg)}", "transform:rotate(-11deg);", "60px 116px") + anim("sway-claw", "2.6s", "0%,100%{transform:rotate(7deg)}50%{transform:rotate(-3deg)}", "transform:rotate(7deg);", "53px 70px") + anim("sway-guest", "2.6s", "0%{transform:translate(10px,-8px)}60%{transform:translate(-10px,6px)}100%{transform:translate(10px,-8px)}") + anim("sway-petal", "2.6s", "0%{transform:translate(-4px,-6px)}50%{transform:translate(5px,4px)}100%{transform:translate(-4px,-6px)}");
  return r;
}

function leafInsect(k, mood, sig) {
  const dk = "#357a1c", brown = k.a;
  const flange = (hip, knee, foot, w) => ln(path([hip, knee, foot]), dk, 2.8) + lobe(hip, knee, w, k.c, dk) + lobe(mix(knee, foot, 0.05), mix(knee, foot, 0.72), w * 0.55, k.b, dk) + ln(path([hip, knee]), dk, 0.9) + dot(foot[0], foot[1], 1.8, brown);
  const legs = both(flange([51, 51], [27, 40], [29, 21], 12) + flange([47, 66], [18, 60], [7, 76], 11.500) + flange([46, 90], [24, 99], [17, 118], 11));
  const leafBody = p("M60 55C74 57 83 63 90 70C101 80 98 89 90 91C96 96 88 106 78 108C73 114 66 113 60 121C54 113 47 114 42 108C32 106 24 96 30 91C22 89 19 80 30 70C37 63 46 57 60 55Z", k.c, edge(dk, 1.8))
    + p("M60 60C74 65 86 76 80 86C74 98 66 104 60 112C54 104 46 98 40 86C34 76 46 65 60 60Z", k.b, op(0.55))
    + ln("M60 56V119", "#d8f08a", 2.4) + both(ln("M60 68Q46 70 32 74M60 80Q44 82 30 89M60 92Q47 96 36 104M60 103Q53 107 46 110", "#c4e870", 1.4))
    + dots([[27, 82], [33.500, 98], [88, 101], [93, 79]], 3, brown) + dots([[40, 66], [77, 107], [48, 111], [70, 74], [47, 91]], 1.6, brown) + el(90, 91, 3.4, 2.2, brown);
  const head = `${both(ln("M52 28Q46 18 38 16", dk, 2) + dot(38, 16, 1.8, dk))}${el(60, 53, 10, 8, k.c, edge(dk, 1.2))}${el(60, 38, 16.500, 14.500, k.c, edge(dk, 1.6))}${ln("M60 25V30", "#d8f08a", 2)}${dots([[50, 29], [71, 30]], 1.5, brown)}${pair(52.500, 67.500, 38, mood, { r: 5.2, rim: 1.4 })}${cheeks(47.500, 72.500, 45.500, 0.75)}${smile(60, 45.500, mood, "#163a0c")}`;
  const body = `${legs}${wrap("bd-breathe", leafBody)}${head}`;
  const r = { body, neck: [60, 52, 11], cap: [60, 27, 0.64] };
  if (!sig) return r;
  r.move = "bd-s-glow-leaf-body";
  r.xf = "translate(5 4) scale(.91)";
  r.bg = ln("M2 112Q50 121 118 106M88 111q8 -10 20 -12", "#6a4a24", 5) + p("M106 100q12 -12 14 -2q-6 8 -14 2Z", "#5aa448", edge(dk, 1)) + sg("leaf-wind", ln("M2 26q16 -8 28 0q8 6 2 10q-7 1 -5 -5M80 12q14 -6 26 1M94 44q12 -5 22 0q6 5 1 8", "#fff", 2.4));
  r.fg = sg("leaf-fall", p("M100 56Q114 50 116 62Q106 70 100 56Z", "#8ac84a", edge(dk, 1)) + ln("M101 57L113 63", "#d8f08a", 1));
  r.css = anim("leaf-body", "2s", "0%,100%{transform:rotate(-13deg) translateX(-3px)}50%{transform:rotate(13deg) translateX(3px)}", "transform:rotate(-13deg) translateX(-2px);", "60px 106px") + anim("leaf-wind", "1s", "0%{transform:translateX(-9px);opacity:0}45%{opacity:1}100%{transform:translateX(10px);opacity:0}") + anim("leaf-fall", "3s", "0%{transform:translate(10px,-30px) rotate(-40deg)}100%{transform:translate(-14px,44px) rotate(150deg)}", "", "108px 60px", "linear");
  return r;
}

function katydid(k, mood, sig) {
  const dk = k.a;
  const tegmen = p("M72 71C56 57 28 60 6 94C27 99 54 98 76 86Z", k.c, edge(dk, 1.6)) + ln("M73 77Q42 76 9 93", "#fff0f6", 1.8) + ln("M62 76Q52 66 42 66M52 77Q42 68 30 72M40 80Q31 75 21 81M62 78Q54 86 46 92M48 80Q40 88 32 93M32 84Q27 90 20 93", dk, 1) + p("M72 71Q62 63 52 64Q60 73 72 77Z", k.b);
  const hind = (femur, knee, foot, col, w) => lobe(femur, knee, 8.5, col, dk) + dot(knee[0], knee[1], 2.6, dk) + ln(path([knee, foot, [foot[0] + 8, foot[1] + 1]]), dk, w) + ln(path([mix(knee, foot, 0.3), [mix(knee, foot, 0.3)[0] - 4, mix(knee, foot, 0.3)[1] + 1]]) + path([mix(knee, foot, 0.62), [mix(knee, foot, 0.62)[0] - 4, mix(knee, foot, 0.62)[1] + 1]]), dk, 1.4);
  const far = hind([64, 86], [40, 52], [38, 110], "#e86a9c", 2.4) + limbs([[[76, 90], [72, 104], [76, 113]], [[86, 88], [100, 94], [110, 106]]], "#c85a8a", 2.6);
  const near = limbs([[[72, 92], [62, 104], [60, 117], [66, 117]], [[82, 92], [92, 104], [96, 117], [103, 117]]], dk, 3.4) + el(93.500, 108, 1.8, 3.4, "#fff", `${edge(dk, 0.9)} transform="rotate(-18 93.500 108)"`) + hind([57, 90], [20, 53], [16, 115], k.c, 3.4);
  const abdomen = p("M72 84C60 80 36 84 22 96C34 104 62 104 74 94Z", k.b, edge(dk, 1.2)) + ln("M62 84q-3 8 -1 15M50 86q-3 8 -2 15M39 90q-2 5 -1 11", dk, 1);
  const antennae = ln("M84 60C78 20 44 4 8 16", dk, 1.4) + ln("M92 60C106 30 96 6 62 4", dk, 1.4);
  const head = `${p("M66 70Q70 60 84 64L84 90Q70 94 66 84Z", k.c, edge(dk, 1.2))}${el(87, 73, 17, 17.500, k.c, edge(dk, 1.4))}${el(84, 62, 8, 4, k.b)}${eye(83, 70, mood, { r: 5.6, rim: 1.4 })}${eye(98.500, 70, mood, { r: 4.4, rim: 1.2 })}${el(79, 79, 3.4, 2.2, "#ff4f86", op(0.55))}${smile(93, 80, mood, "#6a1438")}${ln("M92 87q1 4 -2 6M97 85q3 3 2 6", dk, 2)}`;
  const wingGroup = sig ? sg("song-wingfar", p("M72 71C58 46 34 34 12 42C24 60 48 72 72 78Z", "#ee6fa0", edge(dk, 1.2))) + sg("song-wing", tegmen) : tegmen;
  const body = `${far}${antennae}${wrap("bd-breathe", abdomen)}${sig ? "" : wingGroup}${near}${sig ? wingGroup : ""}${head}`;
  const r = { body, neck: [81, 87, 11], cap: [86, 58, 0.62] };
  if (!sig) return r;
  const note = (x, y, col) => el(x, y, 4, 3, col, `transform="rotate(-20 ${x} ${y})"`) + ln(`M${x + 3.4} ${y - 1}V${y - 15}q6 2 6 8`, col, 2);
  r.fg = sg("song-note", note(12, 24, "#fff")) + sg("song-note2", note(34, 20, "#ffe85a")) + sg("song-wave", ln("M18 62q-6 7 0 14M10 57q-12 12 0 24M108 44q8 6 6 15", "#fff", 2.2));
  r.css = anim("song-wing", ".16s", "0%,100%{transform:rotate(15deg)}50%{transform:rotate(24deg)}", "transform:rotate(19deg);", "72px 76px", "linear") + anim("song-wingfar", ".16s", "0%,100%{transform:rotate(8deg)}50%{transform:rotate(-3deg)}", "", "72px 76px", "linear") + anim("song-note", "1.4s", "0%{transform:translate(4px,8px);opacity:0}30%{opacity:1}100%{transform:translate(-5px,-10px);opacity:0}") + anim("song-note2", "1.4s", "0%{transform:translate(0,10px);opacity:0}40%{opacity:1}100%{transform:translate(4px,-9px);opacity:0}", "", "", "ease-out;animation-delay:-.7s") + anim("song-wave", ".7s", "0%,100%{opacity:.2}50%{opacity:1}");
  return r;
}

// ================= woodlice, millipede, snail =================
function pillWoodlouse(k, mood, sig) {
  if (sig) {
    const ball = dot(60, 83, 33, k.c, edge(k.a, 2.4))
      // plates wrap round the ball, narrowing toward the tail
      + [[-27, 25], [-20, 30], [-11, 32.500], [-1, 33], [9, 32], [18, 28], [25, 22]].map(([dx, h]) => ln(`M${60 + dx} ${83 - h}Q${n(60 + dx * 1.35 + 5)} 83 ${60 + dx} ${83 + h}`, k.a, 2.2) + ln(`M${63 + dx} ${84 - h}Q${n(63 + dx * 1.35 + 5)} 83 ${63 + dx} ${82 + h}`, k.b, 1.4, op(0.85))).join("")
      + gloss("M36 72q5 -14 19 -18", 4, 0.55) + el(60, 88, 20, 14, "#2c2e40", edge(k.a, 1.8)) + p("M40 85Q60 70 80 85Q60 79 40 85Z", k.b)
      + pair(52, 68, 88, mood, { r: 4.8, ...DARK }) + cheeks(46.500, 73.500, 95) + smile(60, 95, mood, "#fff");
    return {
      body: ball, neck: [60, 101, 17], cap: [60, 54, 0.82], move: "bd-s-glow-roll-ball",
      fg: sg("roll-dust", ln("M16 112h-11M22 118h-14M104 112h11M98 118h14", "#fff2d8", 2.6) + ln("M14 70q-8 12 -3 25M106 70q8 12 3 25", "#fff", 2.2)),
      css: anim("roll-ball", "1.8s", "0%,100%{transform:translateX(-12px) rotate(-38deg)}50%{transform:translateX(12px) rotate(38deg)}", "transform:translateX(-5px) rotate(-14deg);", "60px 83px") + anim("roll-dust", ".9s", "0%,100%{opacity:1}50%{opacity:.2}"),
    };
  }
  const leg = (x, col, w) => ln(`M${x} 105l-3.500 7l2 6`, col, w);
  const xs = [24, 33, 42, 51, 60, 69, 77];
  const far = xs.map((x) => leg(x + 5, "#4a4e66", 2.4)).join("");
  const near = xs.map((x) => leg(x, k.a, 3.2)).join("");
  const shell = p("M8 106C9 80 30 60 55 60C77 60 92 75 93 94L90 106C78 112 68 107 60 110C48 114 36 108 26 110C18 112 11 110 8 106Z", k.c, edge(k.a, 2))
    + ["M76 69Q66 86 71 108", "M65 63Q53 82 59 109", "M53 60Q40 82 47 110", "M41 63Q30 82 36 109", "M31 69Q22 86 27 109", "M23 77Q16 90 20 109", "M17 85Q11 96 14 108", "M12.500 93Q9 99 10 106"].map((d) => ln(d, k.a, 2) + at("translate(2.600 .600)", ln(d, k.b, 1.4, op(0.85)))).join("")
    + dots([[48, 70], [61, 74], [37, 76], [71, 82], [55, 86], [42, 92], [30, 90]], 1.2, k.b) + gloss("M27 78q9 -12 27 -14", 3.4, 0.45) + ln("M8 106l-5 5M12 108l-2 7", k.a, 3);
  const head = `${ln("M100 82L109 68L117 80", k.a, 2.8)}${ln("M90 80L92 66L104 58", k.a, 2.6)}${dots([[117, 80], [104, 58]], 1.8, k.a)}${el(92, 94, 15.500, 15, k.c, edge(k.a, 2))}${ln("M80 86Q91 76 104 85", k.b, 2)}${eye(87.500, 92, mood, { r: 4.8, ...DARK })}${eye(101, 92, mood, { r: 4, ...DARK })}${el(84, 100, 3.2, 2, "#ff7f9c", op(0.75))}${smile(96, 99.500, mood, "#fff")}`;
  return { body: `${far}${near}${wrap("bd-breathe", shell)}${head}`, neck: [90, 105, 10.500], cap: [92, 81, 0.55] };
}

function rubberDucky(k, mood) {
  const dome = p("M14 106C12 74 33 48 60 48C87 48 108 74 106 106Q98 112 90 106Q60 90 30 106Q22 112 14 106Z", k.c, edge("#2e2220", 2))
    + ["M20 90Q60 50 100 90", "M26 75Q60 44 94 75", "M16 99Q60 66 104 99", "M36 62Q60 46 84 62"].map((d) => ln(d, "#2e2220", 2) + at("translate(0 2.400)", ln(d, "#9a847c", 1.3, op(0.8)))).join("")
    // the pale yellow tail end showing over the back
    + p("M44 53Q60 43 76 53Q73 62 60 60Q47 62 44 53Z", k.b, edge("#b87808", 1.2)) + ln("M52 53Q60 50 68 53", "#fff2a0", 2)
    + dots([[32, 82], [88, 82], [42, 70], [78, 70], [24, 96], [96, 96]], 1.4, "#b8a098") + gloss("M24 80q6 -14 18 -21", 3.4, 0.35);
  const legs = both([[18, 104, 7, 108], [21, 108, 11, 115], [26, 109, 18, 118], [31, 108, 26, 119], [36, 106, 34, 118], [41, 107, 41, 119], [46, 109, 49, 119]].map(([x, y, x2, y2]) => ln(`M${x} ${y}L${n((x + x2) / 2 - 3)} ${n((y + y2) / 2 - 1)}L${x2} ${y2}`, "#e8c078", 2.4)).join(""));
  const antennae = both(ln("M40 82L22 66L12 74", "#5c4c48", 3.2) + dot(22, 66, 2.4, k.b) + dot(12, 74, 2, "#5c4c48"));
  const head = `${p("M34 90C32 70 46 64 60 64C74 64 88 70 86 90C86 104 74 110 60 110C46 110 34 104 34 90Z", k.b, edge("#c8860a", 1.8))}${el(60, 74, 13, 5, "#fff4a8", op(0.8))}${both(el(41, 84, 6, 8, k.c, `transform="rotate(18 41 84)"`))}${pair(46, 74, 83, mood, { r: 4.8, rim: 1 })}${p("M45 92Q52 87 60 90Q68 87 75 92Q71 101 60 101Q49 101 45 92Z", k.a, edge("#b85c06", 1.2))}${ln(mood === "sad" ? "M49 96q11 -5 22 0" : "M49 93.500q11 6 22 0", "#8a4204", 1.6)}${cheeks(41, 79, 94, 0.65)}`;
  return { body: `${antennae}${legs}${wrap("bd-breathe", dome)}${head}`, neck: [60, 106, 15], cap: [43, 71, 0.58] };
}

/** One millipede ring: a banded segment. */
const ring = (x, y, r, k) => dot(x, y, r, k.c, edge("#180e0a", 1.2)) + dot(x, y, r * 0.66, k.b, op(0.42)) + dot(x - r * 0.28, y - r * 0.4, r * 0.18, "#fff", op(0.55));
function millipede(k, mood, sig) {
  const head = (x, y) => `${both2(x, ln(`M${x - 8} ${y - 11}L${x - 15} ${y - 22}L${x - 23} ${y - 21}`, k.c, 3.2) + dot(x - 23, y - 21, 2.2, k.a))}${el(x, y, 15, 14, k.c, edge("#180e0a", 1.6))}${el(x, y - 8, 7, 3.4, k.b, op(0.7))}${pair(x - 6.500, x + 6.500, y - 1, mood, { r: 4.600, ...DARK })}${cheeks(x - 11, x + 11, y + 5.500)}${smile(x, y + 6, mood, "#fff")}`;
  if (sig) {
    // a tube wound as a flat spiral, ringed segment by segment, legs bristling from the outer turn
    const turn = (i) => {
      const t = 1.9 - i * 0.075, r = 37 - Math.min(i, 110) * 0.24;
      return [n(60 + r * Math.cos(-t)), n(82 + r * Math.sin(-t)), -t];
    };
    const pts = Array.from({ length: 112 }, (_, i) => turn(i));
    let feet = "", rings = "", glints = "";
    for (let i = 0; i < pts.length - 4; i += 3) {
      const [x, y, t] = pts[i], c = Math.cos(t), s = Math.sin(t);
      if (i < 78) feet += `M${n(x + 5 * c)} ${n(y + 5 * s)}l${n(6 * c - 2.4 * s)} ${n(6 * s + 2.4 * c)}`;
      rings += `M${n(x - 5.600 * c)} ${n(y - 5.600 * s)}L${n(x + 5.600 * c)} ${n(y + 5.600 * s)}`;
      if (i % 6 === 0) glints += dot(n(x + 2 * c), n(y + 2 * s), 1.1, "#fff", op(0.55));
    }
    const tube = path(pts.map(([x, y]) => [x, y]));
    const coil = ln(tube, "#180e0a", 14.500) + ln(tube, k.c, 12) + ln(rings, k.b, 1.8) + glints;
    return {
      body: `${ln(feet, k.a, 2.2)}${coil}${head(60, 82)}`, neck: [60, 92, 10.500], cap: [60, 72, 0.56], move: "bd-s-glow-coil-spin",
      fg: sg("coil-arrows", ln("M12 52Q22 36 40 34M32 28l9 6l-8 7M108 114Q98 122 84 121", "#fff2d0", 2.6)),
      css: anim("coil-spin", "2.4s", "0%,100%{transform:rotate(-18deg) scale(.94)}50%{transform:rotate(18deg) scale(1.02)}", "transform:rotate(-8deg);", "60px 82px") + anim("coil-arrows", "1.2s", "0%,100%{opacity:1}50%{opacity:.25}"),
    };
  }
  let legs = "", far = "", segs = "";
  const N = 17;
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1), u = 1 - t;
    const f = (a, b, c, d) => u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d;
    const g = (a, b, c, d) => 3 * u * u * (b - a) + 6 * u * t * (c - b) + 3 * t * t * (d - c);
    const x = f(12, 34, 92, 80), y = f(103, 112, 112, 66), tx = g(12, 34, 92, 80), ty = g(103, 112, 112, 66), l = Math.hypot(tx, ty) || 1;
    const nx = -ty / l, ny = tx / l, dx = tx / l, dy = ty / l, r = n(6.2 + Math.min(1, t * 3) * 3);
    // two pairs of legs on every body ring
    if (i < N - 2) for (const s of [-2.2, 2.4]) {
      const bx = x + dx * s + nx * (r - 2), by = y + dy * s + ny * (r - 2);
      legs += `M${n(bx)} ${n(by)}l${n(nx * 4.4 + dx * 1.8)} ${n(Math.min(118.500 - by, ny * 4.4 + dy * 1.8))}L${n(bx + nx * 7 - dx * 0.6)} ${n(Math.min(118.500, by + ny * 7 - dy * 0.6))}`;
      far += `M${n(bx + dx * 1.6)} ${n(by + dy * 1.6 - 1)}l${n(nx * 5.4 + dx * 2.8)} ${n(Math.min(117 - by, ny * 5.4 + dy * 2.8))}`;
    }
    segs += ring(n(x), n(y), r, k);
  }
  return { body: `${ln(far, "#8a4428", 1.4)}${ln(legs, k.a, 1.8)}${wrap("bd-breathe", segs)}${head(82, 55)}`, neck: [82, 66, 12], cap: [82, 43, 0.62] };
}

function groveSnail(k, mood, sig) {
  const band = k.a, skin = k.b;
  const shell = (x, y, r) => {
    const s = r / 32, q = (v) => n(v * s);
    const spiral = (d, col, w, o = "") => ln(d, col, w, o);
    return p(`M${x - r} ${y}C${x - r} ${y - q(43)} ${x + r} ${y - q(43)} ${x + r} ${y}C${x + r} ${y + q(22)} ${x + q(16)} ${y + r} ${x - q(2)} ${y + r}C${x - q(20)} ${y + r} ${x - r} ${y + q(20)} ${x - r} ${y}Z`, k.c, edge(band, 2))
      + spiral(`M${x + q(25)} ${y + q(12)}C${x + q(27)} ${y - q(31)} ${x - q(25)} ${y - q(33)} ${x - q(25)} ${y + q(1)}C${x - q(25)} ${y + q(27)} ${x + q(13)} ${y + q(29)} ${x + q(14)} ${y + q(3)}C${x + q(14)} ${y - q(16)} ${x - q(14)} ${y - q(16)} ${x - q(13)} ${y + q(3)}C${x - q(12)} ${y + q(16)} ${x + q(5)} ${y + q(16)} ${x + q(4)} ${y + q(3)}`, band, q(5.4))
      + spiral(`M${x + q(30)} ${y + q(5)}C${x + q(30)} ${y - q(39)} ${x - q(30)} ${y - q(39)} ${x - q(30)} ${y}C${x - q(30)} ${y + q(32)} ${x + q(16)} ${y + q(34)} ${x + q(20)} ${y + q(5)}C${x + q(20)} ${y - q(23)} ${x - q(20)} ${y - q(23)} ${x - q(19)} ${y + q(2)}C${x - q(18)} ${y + q(23)} ${x + q(9)} ${y + q(22)} ${x + q(9)} ${y + q(3)}C${x + q(9)} ${y - q(9)} ${x - q(8)} ${y - q(9)} ${x - q(7)} ${y + q(3)}`, "#fff2a8", q(1.6), op(0.85))
      + dot(x - q(2), y + q(3), q(3.4), band) + gloss(`M${x - q(25)} ${y - q(8)}Q${x - q(19)} ${y - q(24)} ${x - q(3)} ${y - q(27)}`, q(3.4), 0.7);
  };
  if (sig) {
    const stalk = (x, ex, ey) => ln(`M${x} 112Q${x} ${ey + 8} ${ex} ${ey}`, skin, 5.2) + dot(ex, ey, 6.2, skin, edge("#a8805a", 1)) + eye(ex, ey, mood, { r: 4.2, lid: "#3a1c0c" });
    return {
      body: `${shell(60, 74, 40)}${el(60, 96, 25, 20, k.c, edge(band, 3.6))}${el(60, 97, 20, 16, "#3a1e0e")}${sg("tuck-peek", el(60, 112, 14, 6, skin) + stalk(54, 50, 94) + stalk(66, 71, 91))}${p("M40 99C48 108 72 108 80 99C80 108 71 113 60 113C49 113 40 108 40 99Z", "#f4fbff", `class="bd-s-glow-tuck-film" opacity=".6" stroke="#fff" stroke-width="1.4"`)}${ln("M44 91q4 -8 13 -10", "#fff", 1.8, op(0.6))}`,
      neck: [60, 111, 15], cap: [60, 41, 0.82], move: "bd-s-glow-tuck-shell",
      fg: sg("tuck-sun", dot(105, 17, 9, "#ffd23a") + ln("M105 3v-1M105 31v4M91 17h-4M117 17h2M95 7l-3 -3M115 7l3 -3M95 27l-3 3M115 27l3 3", "#ffd23a", 2.4)),
      css: anim("tuck-peek", "3.2s", "0%,35%{transform:translateY(0)}55%,70%{transform:translateY(-6px)}85%,100%{transform:translateY(9px)}") + anim("tuck-film", "3.2s", "0%,35%{transform:translateY(0);opacity:.6}55%,70%{transform:translateY(3px);opacity:.3}90%,100%{transform:translateY(-6px);opacity:.9}") + anim("tuck-sun", "1.6s", "0%,100%{opacity:1}50%{opacity:.45}") + anim("tuck-shell", "3.2s", "0%,40%{transform:rotate(0)}48%{transform:rotate(-5deg)}56%{transform:rotate(4deg)}64%,100%{transform:rotate(0)}", "", "60px 116px"),
    };
  }
  const foot = p("M5 117C14 106 34 104 62 106C72 104 74 90 79 80C84 70 98 68 105 77C112 87 108 104 101 111C96 117 88 118 78 118L8 119Z", skin, edge("#a8805a", 1.6)) + dots([[16, 114], [28, 111], [101, 105], [74, 113], [86, 112]], 1.2, "#a8805a") + ln("M10 116Q44 112 92 115", "#fff2e0", 1.8, op(0.7));
  const tentacle = (x, y, ex, ey, cx) => ln(`M${x} ${y}Q${cx} ${ey + 14} ${ex} ${ey}`, "#a8805a", 6.8) + ln(`M${x} ${y}Q${cx} ${ey + 14} ${ex} ${ey}`, skin, 4.600) + dot(ex, ey, 7, skin, edge("#a8805a", 1.2));
  const upper = wrap("bd-bob", tentacle(87, 78, 81, 51, 86) + tentacle(99, 78, 106, 48, 99) + eye(81, 51, mood, { r: 4.4 }) + eye(106, 48, mood, { r: 4.4 }));
  const lower = ln("M103 94Q110 94 116 99", skin, 4) + ln("M98 99Q103 104 107 110", skin, 3.6) + dots([[116, 99], [107, 110]], 2.4, skin);
  return { body: `${foot}${wrap("bd-breathe", shell(45, 78, 32))}${upper}${lower}${cheeks(84, 102, 91, 0.75)}${smile(93, 90, mood, "#5a3418")}`, neck: [89, 100, 11.500], cap: [93, 74, 0.5] };
}

// ---------- assembly ----------
const ART = {
  glow_monarch: monarch, glow_white_monarch: whiteMonarch, glow_morpho: morpho, glow_swallowtail: swallowtail,
  glow_rosy_maple: rosyMaple, glow_luna: luna, glow_io: io, glow_atlas: atlas, glow_elephant_hawk: elephantHawk, glow_lantern_moth: lanternMoth,
  glow_seven_spot: sevenSpot, glow_twentytwo_spot: twentyTwoSpot, glow_jewel_beetle: jewelBeetle, glow_golden_tortoise: goldenTortoise,
  glow_firefly: firefly, glow_rhino_beetle: rhinoBeetle, glow_stag_beetle: stagBeetle,
  glow_bumblebee: bumblebee, glow_honeybee: honeybee, glow_emperor_dragonfly: dragonfly,
  glow_redknee: redknee, glow_greenbottle: greenbottle, glow_peacock_spider: peacockSpider,
  glow_orchid_mantis: orchidMantis, glow_leaf_insect: leafInsect, glow_pink_katydid: katydid,
  glow_pill_woodlouse: pillWoodlouse, glow_rubber_ducky: rubberDucky, glow_millipede: millipede, glow_grove_snail: groveSnail,
};

export default function art({ id, name, tier, c, b, a, stage = 1, mood = "happy", size = 0, act = "" }) {
  const draw = ART[id] || monarch;
  const r = draw({ c, b, a }, mood, act === "signature");
  // When the creature is repositioned for a behaviour, its scarf and hat have to travel with it.
  const moved = !!(r.xf || r.move);
  const wear = moved ? (stage >= 2 ? scarf(...r.neck) : "") + (stage >= 3 ? hat(...r.cap) : "") : "";
  let core = r.body + wear + (moved ? r.over || "" : "");
  if (r.xf) core = at(r.xf, core);
  if (r.move) core = wrap(r.move, core);
  return frame({
    name, size, tier, accent: a, stage,
    body: (r.bg || "") + core + (moved ? r.fg || "" : ""),
    neck: moved ? null : r.neck,
    cap: moved ? null : r.cap,
    top: moved ? "" : (r.over || "") + (r.fg || ""),
    css: r.css || "",
    shadow: act === "signature" && id === "glow_firefly" ? false : undefined,
  });
}
