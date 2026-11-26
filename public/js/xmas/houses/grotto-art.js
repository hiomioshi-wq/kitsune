// Mossdrip Grotto SVG art: frogs and toads on a front-sitting rig, axolotls, salamanders, a side-view
// newt, an olm and a ringed caecilian, each with its own field marks and signature behaviour.
import { INK, el, dot, p, ln, dots, both, wrap, eye, frame } from "./artkit.js";

const EDGE = `stroke="#0005" stroke-width="1.2"`;
const many = (list, fill, x = "") => list.map(([cx, cy, rx, ry = rx, rot = 0]) => el(cx, cy, rx, ry, fill, `${rot ? `transform="rotate(${rot} ${cx} ${cy})"` : ""} ${x}`)).join("");
const say = (x, y, text, size = 11, fill = "#fff6a8", stroke = "#1b2a20") => `<text x="${x}" y="${y}" font-family="system-ui,sans-serif" font-size="${size}" font-weight="800" text-anchor="middle" fill="${fill}" stroke="${stroke}" stroke-width="2.6" paint-order="stroke">${text}</text>`;
const heart = (x, y, k = 1, fill = "#ff5c7c") => p(`M${x} ${y + 5 * k}l${-5.5 * k} ${-5.5 * k}a${3.2 * k} ${3.2 * k} 0 0 1 ${5.5 * k} ${-3.2 * k}a${3.2 * k} ${3.2 * k} 0 0 1 ${5.5 * k} ${3.2 * k}Z`, fill, `stroke="#fff" stroke-width="1"`);
const bubble = (x, y, r) => dot(x, y, r, "#e8fbff", `opacity=".45" stroke="#fff" stroke-width="1"`) + dot(x - r * 0.35, y - r * 0.35, r * 0.28, "#fff");
const sparkle = (x, y, r, fill = "#fff8b8") => p(`M${x} ${y - r}Q${x + r * 0.2} ${y - r * 0.2} ${x + r} ${y}Q${x + r * 0.2} ${y + r * 0.2} ${x} ${y + r}Q${x - r * 0.2} ${y + r * 0.2} ${x - r} ${y}Q${x - r * 0.2} ${y - r * 0.2} ${x} ${y - r}Z`, fill);

/** Build one signature animation class. Returns { cls, css }. */
function anim(key, frames, dur, origin = "60px 90px", extra = "") {
  const cls = `bd-s-grotto-${key}`;
  const o = origin === "box" ? "transform-box:fill-box;transform-origin:50% 50%" : origin === "top" ? "transform-box:fill-box;transform-origin:50% 0" : `transform-origin:${origin}`;
  return { cls, css: `.${cls}{${o};animation:grotto-${key} ${dur}s ease-in-out infinite${extra}}@keyframes grotto-${key}{${frames}}` };
}
const move = (a, svg) => wrap(a.cls, svg);

// ---------- eyes ----------
/** A frog eye with a species pupil: "round" | "h" | "v" | "heart". Moods fall back to the shared eye. */
function feye(x, y, mood, o) {
  const r = o.r || 8;
  if (mood === "sleepy" || mood === "love") return eye(x, y, mood, { lid: o.lid || INK });
  const ring = o.ring ? dot(x, y, r + 1.7, o.ring) : "";
  const base = dot(x, y, r, o.iris || "#14131f", `stroke="#0008" stroke-width=".9"`);
  const K = "#100d16";
  let pupil = "";
  if (o.iris) {
    if (o.pupil === "h") pupil = el(x, y + 0.3, r * 0.8, r * 0.52, K);
    else if (o.pupil === "v") pupil = p(`M${x} ${y - r * 0.92}Q${x + r * 0.62} ${y} ${x} ${y + r * 0.92}Q${x - r * 0.62} ${y} ${x} ${y - r * 0.92}Z`, K);
    else if (o.pupil === "heart") pupil = p(`M${x} ${y + r * 0.7}L${x - r * 0.66} ${y - r * 0.08}Q${x - r * 0.6} ${y - r * 0.68} ${x} ${y - r * 0.26}Q${x + r * 0.6} ${y - r * 0.68} ${x + r * 0.66} ${y - r * 0.08}Z`, K);
    else pupil = dot(x, y, r * 0.68, K);
  }
  const shine = dot(x + r * 0.33, y - r * 0.38, r * 0.3, "#fff") + dot(x - r * 0.34, y + r * 0.38, r * 0.15, "#fff");
  const brow = mood === "sad" ? ln(x < 60 ? `M${x - r} ${y - r - 0.5}L${x + r * 0.7} ${y - r - 4}` : `M${x + r} ${y - r - 0.5}L${x - r * 0.7} ${y - r - 4}`, o.lid || INK, 2) : "";
  return `${ring}${base}${pupil}${shine}${brow}`;
}

// ---------- frog limbs (left side; mirrored by both) ----------
const toes = (x, y, ends, col, w, pad) => {
  const d = ends.map(([a, b]) => `M${x} ${y}L${a} ${b}`).join("");
  return ln(d, "#0004", w + 1.5) + ln(d, col, w) + (pad ? ends.map(([a, b]) => dot(a, b, pad, col, `stroke="#0004" stroke-width=".8"`)).join("") : "");
};
const HIND = {
  std: (c, t, pad) => toes(25, 110, [[10, 114], [15, 119], [24, 119], [33, 118]], t, 3.2, pad) + p("M36 78C17 78 5 96 12 108C20 119 42 111 47 98Z", c, EDGE) + ln("M16 103Q27 94 40 101", "#0003", 1.6),
  slim: (c, t, pad) => toes(27, 112, [[9, 113], [13, 119], [23, 120], [35, 119]], t, 2.6, pad) + ln("M44 92L13 94L28 112", "#0005", 9) + ln("M44 92L13 94L28 112", c, 7.4),
  stub: (c, t, pad) => toes(24, 110, [[13, 113], [17, 118], [25, 119], [32, 117]], t, 3.4, pad) + el(28, 103, 14, 11, c, `${EDGE} transform="rotate(-24 28 103)"`),
  none: () => "",
};
const ARM = {
  std: (c, t, pad) => ln("M39 84Q31 96 37 109", "#0005", 11) + ln("M39 84Q31 96 37 109", c, 9.4) + toes(37, 110, [[29, 114], [33, 119], [41, 119], [46, 115]], t, 3, pad),
  slim: (c, t, pad) => ln("M42 82L29 96L37 110", "#0005", 7.6) + ln("M42 82L29 96L37 110", c, 6) + toes(37, 110, [[27, 113], [31, 119], [40, 120], [47, 115]], t, 2.4, pad),
  stub: (c, t, pad) => ln("M37 96Q32 104 36 110", "#0005", 11) + ln("M37 96Q32 104 36 110", c, 9.4) + toes(36, 111, [[28, 115], [33, 118], [40, 118], [45, 114]], t, 3.2, pad),
  none: () => "",
};

// ---------- frog bodies ----------
const SHAPE = {
  std: "M60 36C85 36 98 55 98 80C98 103 82 113 60 113C38 113 22 103 22 80C22 55 35 36 60 36Z",
  slim: "M60 38C82 38 93 52 91 70C90 80 84 85 85 94C86 108 74 113 60 113C46 113 34 108 35 94C36 85 30 80 29 70C27 52 38 38 60 38Z",
  chunky: "M60 37C84 37 94 48 98 62C106 74 108 90 100 101C92 112 78 115 60 115C42 115 28 112 20 101C12 90 14 74 22 62C26 48 36 37 60 37Z",
  squat: "M60 45C87 45 104 63 104 85C104 106 85 114 60 114C35 114 16 106 16 85C16 63 33 45 60 45Z",
  pointed: "M60 37C69 37 79 44 88 55C95 66 86 74 82 82C88 100 76 112 60 112C44 112 32 100 38 82C34 74 25 66 32 55C41 44 51 37 60 37Z",
  round: "M60 39C90 39 105 61 103 84C101 107 84 115 60 115C36 115 19 107 17 84C15 61 30 39 60 39Z",
  bean: "M60 40C87 40 109 62 108 87C107 107 87 115 60 115C33 115 13 107 12 87C11 62 33 40 60 40Z",
  maw: "M60 39C93 39 111 63 109 87C107 108 88 115 60 115C32 115 13 108 11 87C9 63 27 39 60 39Z",
  pancake: "M60 55C94 55 115 70 115 91C115 110 90 115 60 115C30 115 5 110 5 91C5 70 26 55 60 55Z",
};

/**
 * Front-sitting frog rig. d: { c, shape, hind, arm, limb, toe, pad, back, legMarks, armMarks, belly, marks,
 * eyes:{x,y,r,bump,iris,pupil,ring,lid,skin}, over, mouth:{y,w,d,col}, nose:{y,x}, blush:[x,y]|false, front }
 */
function frog(d, mood) {
  const e = { x: 41, y: 45, r: 8.5, bump: 13.5, ...d.eyes };
  const limb = d.limb || d.c, toe = d.toe || limb, pad = d.pad ?? 0;
  const hind = d.hindSvg ?? both(HIND[d.hind || "std"](d.hindCol || limb, toe, pad) + (d.legMarks || ""));
  const arms = d.armSvg ?? both(ARM[d.arm || "std"](limb, toe, pad) + (d.armMarks || ""));
  const bumps = both(dot(e.x, e.y, e.bump, e.skin || d.c, EDGE) + dot(e.x, e.y + 3.4, e.bump - 1.8, e.skin || d.c));
  const eyes = d.eyeSvg ?? feye(e.x, e.y, mood, e) + feye(120 - e.x, e.y, mood, e);
  const m = { y: 68, w: 21, d: 11, col: INK, ...d.mouth };
  const mouth = d.mouthSvg ?? ln(mood === "sad" ? `M${60 - m.w * 0.7} ${m.y + m.d * 0.6}Q60 ${m.y - m.d * 0.3} ${60 + m.w * 0.7} ${m.y + m.d * 0.6}` : `M${60 - m.w} ${m.y}Q60 ${m.y + m.d} ${60 + m.w} ${m.y}`, m.col, 1.9);
  const n = { y: 56, x: 55, col: "#0007", ...d.nose };
  const bl = d.blush === false ? "" : both(el(d.blush?.[0] ?? 33, d.blush?.[1] ?? 65, 5, 3, "#ff6f94", `opacity=".5"`));
  const gloss = el(60, e.y - 1, 9, 3.4, "#fff", `opacity=".16"`);
  return `${d.back || ""}${hind}${p(d.shapeD || SHAPE[d.shape || "std"], d.c, EDGE)}${d.belly || ""}${bumps}${d.marks || ""}${gloss}${d.noEyes ? "" : eyes}${d.over || ""}${both(el(n.x, n.y, 1.3, 1, n.col))}${mouth}${bl}${arms}${d.front || ""}`;
}
const bellyOval = (fill, rx = 22, ry = 19, cy = 93, x = "") => el(60, cy, rx, ry, fill, x);

// Shared shapes for dart frogs (small, glossy, upright, tiny toe discs).
const dart = (extra) => ({ shape: "slim", hind: "slim", arm: "slim", pad: 2.2, eyes: { x: 42, y: 47, r: 8, bump: 12, lid: "#e8f4ff" }, mouth: { y: 68, w: 16, d: 8 }, blush: [38, 65], ...extra });

const WARTS = [[30, 74], [37, 62], [25, 88], [34, 96], [90, 74], [83, 62], [95, 88], [86, 96], [51, 49], [69, 49], [60, 53], [29, 100], [91, 101]];
const warts = (c, hi, list, r = 2.8) => list.map(([x, y], i) => dot(x, y, r - (i % 3) * 0.6, c) + dot(x - 0.7, y - 0.8, 0.9, hi, `opacity=".8"`)).join("");

// ---------- frog species ----------
function whitesParts(k, snow) {
  // The thick fold of skin that runs from behind the eye, over the eardrum, toward the shoulder.
  const ridge = "M29.5 52Q24 57 24.5 64Q25 70 32 73";
  const fold = both(dot(31.5, 61.5, 3.2, "none", `stroke="#0004" stroke-width="1.3"`) + ln(ridge, "#0003", 6.4) + ln(ridge, k.c, 4.8) + ln("M27 55.5Q25.4 58.5 25.5 62", "#ffffff88", 1.4));
  const flake = (x, y, r) => ln(`M${x - r} ${y}H${x + r}M${x - r / 2} ${y - r * 0.87}L${x + r / 2} ${y + r * 0.87}M${x + r / 2} ${y - r * 0.87}L${x - r / 2} ${y + r * 0.87}`, "#fff", 1.5);
  const marks = snow
    ? many([[27, 75, 4.2, 3.4], [33, 88, 2], [24, 90, 3], [90, 72, 3.2], [96, 86, 4.6, 3.6], [87, 95, 2.4], [60, 38, 3.4, 2.6], [51, 44, 1.6], [70, 43, 2.2], [60, 50, 1.4], [30, 62, 2.4], [92, 60, 1.8], [36, 100, 1.6], [84, 105, 1.8], [24, 80, 1.2], [93, 78, 1.2]], "#fff") + flake(29, 99, 4) + flake(93, 98, 3.4) + flake(60, 44.5, 3) + dots([[40, 30], [82, 31], [35, 76], [86, 83]], 1.2, "#fff")
    : dots([[27, 82], [31, 91], [94, 76], [89, 94], [63, 39]], 1.7, "#fbfff4") + dots([[24, 90], [96, 86]], 1, "#fbfff4");
  return {
    c: k.c, shape: "chunky", pad: 3.3, toe: snow ? "#c8dcf0" : "#e6c8a8", hindCol: k.c, limb: k.c,
    belly: bellyOval(k.b, 27, 18, 95),
    marks,
    eyes: { x: 40, y: 47, r: 9, bump: 13, iris: "#e8b83a", pupil: "h", ring: "#2a4a3a" },
    over: fold,
    mouth: { y: 66, w: 25, d: 12 },
    blush: [37, 69],
  };
}
const pacHorns = (c, tip) => both(p("M27 42Q26 28 30 22Q36 30 45 33Z", c, EDGE) + ln("M30 25L33 33", tip, 2));
const PAC = { shape: "maw", hind: "stub", arm: "stub", eyes: { x: 37, y: 46, r: 8, bump: 12.5, pupil: "h" }, nose: { y: 59, x: 55 }, mouth: { y: 71, w: 41, d: 24 }, blush: [24, 69] };
const lip = (col) => ln("M19 73Q60 100 101 73", col, 5.4, `opacity=".85"`);

const FROG = {
  whites: (k) => whitesParts(k, false),
  whites_snowflake: (k) => whitesParts(k, true),
  toad: (k) => ({
    c: k.c, shape: "squat", toe: "#b89464",
    belly: bellyOval(k.b, 25, 15, 97) + dots([[48, 92], [58, 98], [70, 93], [66, 104], [52, 103], [76, 100], [44, 100]], 1.4, "#8a6a42"),
    marks: warts("#6c4e2c", "#c8a674", WARTS) + warts("#a8643a", "#e8b884", [[22, 78], [98, 80], [34, 84], [87, 91]], 2.4),
    eyes: { x: 40, y: 51, r: 8, bump: 12.5, iris: k.a, pupil: "h" },
    over: both(el(23, 66, 5.8, 11.5, "#a8844f", `transform="rotate(40 23 66)" ${EDGE}`) + dots([[27, 61.5], [23, 66], [19.5, 70]], 1.1, "#5a3e22")),
    nose: { y: 61, x: 55 }, mouth: { y: 72, w: 27, d: 8 }, blush: [31, 70],
    legMarks: warts("#6c4e2c", "#c8a674", [[20, 100], [30, 91], [29, 106]], 2.4),
  }),
  bullfrog: (k) => ({
    c: k.c, shape: "std", toe: "#c8b870",
    back: both(p("M10 114L15 119L24 117L33 119L27 106Z", "#b8a458", `opacity=".9"`)),
    belly: p("M26 74Q60 66 94 74Q94 108 60 112Q26 108 26 74Z", k.b) + many([[44, 100, 4, 2], [74, 96, 5, 2.4], [58, 106, 5, 2], [34, 90, 3, 2]], "#a8ac5a", `opacity=".6"`),
    marks: many([[52, 40, 4, 3], [68, 42, 3, 2.4], [60, 49, 2.4, 2], [27, 80, 4, 5], [93, 82, 4, 6]], "#47602a") + ln("M27 71Q60 63 93 71", "#9cd048", 5),
    legMarks: ln("M13 96l15 -9M13 106l24 -12M23 111l20 -12", "#3a4a1e", 3.4),
    armMarks: ln("M31 93l8 3M32 101l8 1", "#3a4a1e", 2.6),
    eyes: { x: 41, y: 43, r: 8, bump: 13, iris: "#e0a82e", pupil: "h" },
    over: both(dot(24, 59, 9.5, "#6a4e20", EDGE) + dot(24, 59, 7, k.a) + dot(24, 59, 2.8, "#7a5a28") + dot(22, 56.5, 1.4, "#fff", `opacity=".5"`)),
    mouth: { y: 71, w: 31, d: 10 }, blush: [34, 77],
  }),
  firebelly: (k) => ({
    c: k.c, shape: "squat", toe: "#ff7a2a",
    belly: p("M28 90Q40 80 50 86Q60 80 70 86Q80 80 92 90Q90 112 60 113Q30 112 28 90Z", k.b) + p("M37 94q8 -6 10 2q-2 8 -9 5q-6 -2 -1 -7ZM55 99q7 -5 12 0q1 7 -6 7q-9 1 -6 -7ZM75 90q7 -3 8 5q-3 8 -9 4q-4 -4 1 -9ZM48 87q5 -2 6 2q-3 4 -6 -2Z", k.a),
    marks: many([[52, 50, 3, 3.4], [69, 51, 3.6, 2.6], [60, 60, 2.4, 2.8], [28, 68, 5, 4, 30], [93, 70, 4, 6, -30], [26, 83, 3.4, 4], [96, 84, 3, 3.4], [36, 76, 2.4], [84, 78, 3, 2.2]], k.a) + warts("#3c9434", "#b8f088", [[32, 60], [88, 60], [22, 76], [98, 76], [60, 48]], 2),
    legMarks: many([[20, 98, 4.4, 3.4], [33, 105, 3, 2.6], [29, 91, 2.4]], k.a),
    armMarks: dots([[33, 94], [36, 103]], 2.2, k.a),
    eyes: { x: 41, y: 50, r: 8.5, bump: 12.5, iris: "#e8c84a", pupil: "heart" },
    nose: { y: 60, x: 55 }, mouth: { y: 71, w: 24, d: 8 }, blush: [32, 70],
  }),
  redeye: (k) => ({
    ...dart({}),
    c: k.c, pad: 3.4, toe: "#ff8a1a", limb: k.c, hindCol: k.c,
    belly: bellyOval(k.b, 17, 18, 94) + both(p("M32 65C26 77 33 83 37 90C37 98 37 105 44 108C44 93 45 77 32 65Z", "#2458d8") + ln("M31 74l9 2M34 81l8 0M38 89l6 -1M37 96l7 -1M39 102l5 -2", "#fff0b0", 2.3)),
    legMarks: ln("M37 96L17 95", "#2458d8", 3.4) + ln("M23 94v5M30 94v5", "#fff0b0", 1.6),
    armMarks: ln("M38 87L31 95", "#2458d8", 3),
    marks: dots([[56, 40], [65, 38], [62, 48]], 1.3, "#f4fff0"),
    eyes: { x: 39, y: 47, r: 10.5, bump: 13.5, iris: k.a, pupil: "v", ring: "#1f6a1c" },
    mouth: { y: 68, w: 19, d: 10 }, blush: [38, 67],
  }),
  auratus: (k) => dart({
    c: k.c, limb: k.c, toe: "#3ac888",
    eyes: { x: 42, y: 47, r: 8, bump: 12, ring: "#4a7a68", lid: "#d8fff0" }, mouth: { y: 68, w: 16, d: 8, col: "#c8ffe4" }, nose: { y: 56, x: 55, col: "#a8f0d0" },
    belly: p("M47 86Q57 77 66 85Q75 80 77 93Q70 99 72 107Q60 112 52 104Q41 98 47 86Z", k.a) + p("M56 93q8 -4 11 4q-5 7 -11 -4Z", k.c),
    marks: p("M46 54Q52 62 60 56Q70 61 75 53Q70 45 63 50Q58 38 50 42Q54 50 46 54Z", k.a) + p("M30 60Q40 66 37 75Q29 74 30 60ZM90 57Q93 68 82 74Q76 66 90 57ZM30 82q9 0 9 11q-8 2 -9 -11Z", k.a),
    legMarks: p("M15 90q9 -7 14 0q-4 8 -14 0ZM30 99q7 0 6 7q-7 1 -6 -7Z", k.a),
    armMarks: el(32, 97, 4, 5, k.a),
  }),
  azureus: (k) => dart({
    c: k.c, limb: k.b, toe: "#4a80e8",
    belly: bellyOval("#52a8ff", 17, 16, 94, `opacity=".8"`),
    marks: many([[53, 40, 4.6, 3.6, -20], [68, 39, 3.4, 3], [60, 50, 3.2, 2.6], [71, 50, 1.8], [33, 64, 3, 4], [87, 66, 4, 3, 30], [38, 79, 2.4], [83, 80, 2], [46, 49, 1.5], [78, 60, 1.6], [42, 98, 2], [78, 99, 2.4]], k.a),
    legMarks: many([[18, 94, 3.4, 2.8], [28, 90, 2], [24, 105, 2.4], [37, 95, 1.6]], k.a),
    armMarks: dots([[34, 92], [34, 103]], 1.8, k.a),
  }),
  strawberry: (k) => dart({
    c: k.c, limb: k.a, toe: "#5a7ae0",
    belly: bellyOval(k.b, 16, 17, 94),
    marks: dots([[54, 39], [66, 41], [60, 47], [72, 52], [34, 70], [88, 66], [84, 78], [47, 50], [31, 61], [79, 40]], 1.35, "#3a0c18"),
    legMarks: dots([[17, 95], [24, 90], [30, 98], [20, 103], [37, 94]], 1.2, "#101c50"),
    armMarks: dots([[33, 91], [34, 100]], 1.1, "#101c50"),
  }),
  terribilis: (k) => ({
    c: k.c, shape: "std", hind: "slim", arm: "slim", pad: 2.4, toe: "#e0a800",
    belly: bellyOval(k.b, 22, 18, 94),
    marks: el(36, 70, 4, 10, "#fff6b0", `transform="rotate(22 36 70)" opacity=".7"`) + el(60, 39, 11, 2.6, "#fff6b0", `opacity=".75"`) + sparkle(87, 68, 5, "#fffbe0"),
    eyes: { x: 41, y: 46, r: 9, bump: 13 },
    nose: { col: k.a, y: 57, x: 54.5 },
    mouth: { y: 68, w: 22, d: 9, col: k.a },
    armMarks: ln("M29 113l-2 1M31 118l-1 1.5", k.a, 2),
  }),
  atelopus: (k) => ({
    c: k.c, shape: "pointed", hind: "slim", arm: "slim", pad: 1.8, toe: "#e89a08",
    belly: bellyOval(k.b, 16, 17, 94),
    marks: p("M51 39Q60 50 69 39Q66 48 61 53L59 53Q54 48 51 39Z", k.a) + both(p("M32 55Q40 60 41 66Q34 65 29 61ZM40 79Q50 82 47 91Q42 88 38 91Q42 84 40 79Z", k.a)) + p("M72 96q10 -1 7 9q-8 2 -7 -9Z", k.a),
    legMarks: ln("M18 90l3 9M30 90l2 6M17 103l8 -3", k.a, 4),
    armMarks: ln("M31 91l7 5M31 103l7 -2", k.a, 3.4),
    eyes: { x: 43, y: 48, r: 7.5, bump: 10.5, iris: "#3a2a08", pupil: "h", ring: "#f8e070" },
    nose: { y: 41, x: 57 }, mouth: { y: 69, w: 15, d: 8 }, blush: [41, 67],
  }),
  glass: (k) => ({
    c: k.c, shape: "slim", pad: 3.2, limb: "#c4ee80", toe: "#e4f49a", hind: "slim", arm: "slim",
    belly: bellyOval(k.b, 19, 20, 93, `opacity=".82"`) + ln("M49 96q6 -7 11 0q5 7 11 0M52 104q8 -5 15 0", "#fff", 3.4, `opacity=".75"`) + heart(60, 83, 0.9, "#e8485a") + ln("M60 86v7", "#e87884", 1.2),
    marks: dots([[50, 40], [66, 39], [58, 46], [72, 48], [33, 68], [87, 68], [38, 77], [83, 78], [61, 54], [78, 57], [41, 59], [34, 98], [86, 99]], 1.8, k.a),
    eyes: { x: 45, y: 45, r: 8.6, bump: 12, iris: "#f4d848", pupil: "h", ring: "#e4f8b0" },
    nose: { y: 58, x: 56 }, mouth: { y: 66, w: 16, d: 8 }, blush: [38, 64],
  }),
  tomato: (k) => ({
    c: k.c, shape: "round", hind: "stub", arm: "stub", toe: "#f06a34",
    belly: p("M30 88Q60 70 90 88Q90 112 60 113Q30 112 30 88Z", k.b) + dots([[49, 80], [55, 84], [64, 79], [70, 83], [60, 87], [45, 85], [75, 86], [58, 78]], 1.15, k.a),
    marks: el(60, 42, 20, 3.4, "#ff9a62", `opacity=".6"`),
    eyes: { x: 40, y: 48, r: 7.6, bump: 11.5, iris: "#b87a30", pupil: "h" },
    over: both(ln("M33 53Q20 60 22 76Q23 85 29 92", k.a, 3.2)),
    mouth: { y: 68, w: 20, d: 9 }, blush: [32, 66],
  }),
  rainfrog: (k) => ({
    c: k.c, shape: "bean", hind: "stub", arm: "stub", toe: "#e8c498",
    belly: bellyOval(k.b, 31, 19, 94, `opacity=".92"`),
    marks: p("M45 41Q60 49 75 41Q72 53 66 51Q61 61 55 52Q48 53 45 41ZM18 72Q30 66 32 78Q26 88 14 84ZM102 70Q90 68 88 79Q96 90 107 83ZM30 101q6 -4 9 3q-6 5 -9 -3Z", k.a, `opacity=".85"`) + dots([[27, 62], [93, 60], [20, 93], [99, 94], [51, 59], [71, 58], [36, 74], [85, 72], [26, 103], [92, 105], [60, 40], [80, 87], [40, 88]], 0.9, "#7a5434") + dots([[31, 68], [88, 65], [23, 82], [97, 88], [57, 64], [77, 52], [44, 62]], 0.8, "#fff4d8"),
    eyes: { x: 38, y: 48, r: 11, bump: 13.5, ring: "#f4dca8", iris: "#3a2418", pupil: "round" },
    nose: { y: 64, x: 56 }, mouth: { y: 75, w: 11, d: -5 }, blush: [31, 71],
  }),
  pacman: (k) => ({
    ...PAC, c: k.c, toe: "#c8a868", eyes: { ...PAC.eyes, iris: "#d8a038" },
    belly: p("M24 88Q60 112 96 88Q94 113 60 114Q26 113 24 88Z", k.b),
    marks: p("M47 40Q54 44 60 40Q66 44 73 40Q71 47 66 48Q64 55 60 53Q56 55 54 48Q49 47 47 40Z", k.a, `stroke="#e8d8a0" stroke-width="1.6"`) + both(p("M15 78Q20 62 31 62Q30 74 24 82Q18 88 15 78ZM21 94q9 -6 14 2q-4 10 -12 5Z", k.a, `stroke="#e8d8a0" stroke-width="1.6"`)) + dots([[44, 62], [77, 61], [18, 68], [103, 67], [38, 106], [82, 106]], 1.7, "#5a7a2a"),
    over: lip("#e8d49a") + pacHorns(k.c, k.a),
    legMarks: el(25, 102, 5, 3.4, k.a),
  }),
  pacman_pineapple: (k) => ({
    ...PAC, c: k.c, toe: "#ffe08a", eyes: { ...PAC.eyes, iris: "#ff5a48", ring: "#fff0a0" },
    belly: p("M24 88Q60 112 96 88Q94 113 60 114Q26 113 24 88Z", k.b),
    marks: p("M53 39Q64 37 68 43Q62 48 66 56Q60 66 55 57Q50 50 55 47Z", k.a) + p("M13 76Q22 60 30 66Q24 70 28 78Q34 84 24 88Q14 90 13 76ZM104 68Q110 78 107 90Q96 86 100 80Q92 72 104 68ZM33 100q10 -2 8 8q-10 2 -8 -8ZM79 103q6 -8 13 -2q-4 9 -13 2Z", k.a) + dots([[47, 62], [73, 60], [20, 95], [98, 98], [60, 70], [84, 64]], 2.2, "#ff3e4a") + dots([[42, 40], [78, 41], [16, 66], [104, 60], [49, 108], [70, 108], [30, 92], [91, 93]], 1.4, "#fffbe0"),
    over: lip("#fff6c8") + pacHorns(k.c, k.a),
    legMarks: dots([[22, 100], [31, 106]], 3, k.a),
  }),
  budgett: (k) => ({
    c: k.c, shape: "pancake", hind: "stub", arm: "stub", toe: "#a8a888",
    belly: p("M14 96Q60 118 106 96Q102 114 60 114Q18 114 14 96Z", k.b),
    marks: many([[24, 73, 9, 5.4, -20], [97, 75, 8, 6, 24], [60, 59, 8, 3.4], [16, 89, 5, 4], [105, 91, 5.4, 3.6], [43, 74, 4, 2.6], [79, 70, 3.4, 4]], k.a, `opacity=".85"`) + dots([[33, 80], [88, 80], [70, 63], [50, 64], [12, 80], [109, 82]], 1.7, "#b8b890"),
    eyes: { x: 42, y: 55, r: 6.8, bump: 10, iris: "#c8a848", pupil: "h" },
    nose: { y: 66, x: 55.5 },
    mouthSvg: ln("M9 89Q14 77 34 79Q60 85 86 79Q106 77 111 89", INK, 2.2) + ln("M12 92Q60 104 108 92", k.b, 3, `opacity=".8"`) + p("M52 82.4l3 6.4l3 -5.8ZM62 83l3 5.8l3 -6.4Z", "#fff", `stroke="#0006" stroke-width=".6"`),
    blush: [24, 94],
  }),
  mossy: (k) => {
    const rim = [[44, 33], [54, 36], [66, 36], [76, 33], [30, 40], [90, 40], [25, 55], [95, 55], [23, 68], [97, 68], [22, 81], [98, 81], [25, 94], [95, 94], [32, 104], [88, 104], [44, 111], [76, 111], [60, 113]];
    return {
      c: k.c, shape: "std", pad: 4, toe: "#a8884e",
      back: rim.map(([x, y], i) => dot(x, y, 5 - (i % 3) * 0.7, i % 4 === 2 ? k.a : k.c, EDGE)).join(""),
      belly: bellyOval(k.b, 20, 16, 95) + many([[52, 92, 6, 4], [70, 100, 5, 3.4], [60, 82, 3, 2.4]], "#4a5a30", `opacity=".8"`),
      marks: p("M47 39Q55 49 63 41Q75 44 70 53Q63 50 60 57Q50 56 47 39ZM27 63q13 -5 12 8q-7 10 -14 2ZM93 76q-14 -4 -9 10q6 8 11 2ZM32 91q10 -2 8 9q-9 4 -8 -9Z", k.a) + warts("#3e6a24", "#c8e878", [[38, 62], [31, 84], [86, 64], [90, 96], [58, 37], [71, 62], [49, 63], [80, 92], [41, 80], [82, 80]], 3) + warts("#a86a3a", "#f0c088", [[65, 47], [28, 74], [92, 86], [54, 48]], 2.4) + dots([[44, 71], [77, 72], [30, 56], [89, 55]], 1.2, "#d8f0a0"),
      legMarks: warts("#3e6a24", "#c8e878", [[19, 97], [29, 90], [26, 107], [38, 101]], 2.8) + el(32, 99, 4.4, 3, k.a),
      armMarks: warts("#a86a3a", "#f0c088", [[33, 93], [36, 102]], 2.4),
      eyes: { x: 40, y: 47, r: 8.4, bump: 12.5, iris: "#c87a30", pupil: "h", skin: k.c },
      over: both(dots([[31, 38], [37, 34], [46, 34]], 2.2, k.a)),
      mouth: { y: 68, w: 20, d: 9 }, blush: [33, 65],
    };
  },
};

/** Wrap a frog's idle drawing in the standard cosmetics anchors. */
const frogOut = (svg, extra = {}) => ({ body: wrap("bd-breathe", svg), neck: [60, 82, 26], cap: [60, 39, 0.72], ...extra });
/** The winter hat perches on top of one eye so it never hides either of them. */
const perch = (d) => {
  const e = { x: 41, y: 45, bump: 13.5, ...d.eyes };
  return [121 - e.x, e.y - e.bump + 1.5, 0.6];
};

// ---------- frog signature behaviours ----------
const rays = (x, y, r1, r2, col, n = 10, w = 2.4) => ln(Array.from({ length: n }, (_, i) => {
  const a = (i / n) * Math.PI * 2 + 0.3;
  return `M${(x + Math.cos(a) * r1).toFixed(1)} ${(y + Math.sin(a) * r1).toFixed(1)}L${(x + Math.cos(a) * r2).toFixed(1)} ${(y + Math.sin(a) * r2).toFixed(1)}`;
}).join(""), col, w);
const soundArcs = (y, col = "#fff") => both(ln(`M12 ${y - 9}q-7 9 0 18M5 ${y - 15}q-11 15 0 30`, col, 2.4));
const cricket = (x, y) => `${ln(`M${x - 3} ${y + 1}l-5 -8l-4 12M${x + 1} ${y + 2}l-1 7M${x + 5} ${y + 1}l4 6M${x + 7} ${y - 3}q4 -9 11 -9M${x + 8} ${y - 2}q8 -3 10 2`, "#3a2410", 1.5)}${el(x, y, 8, 4, "#8a5a28", EDGE)}${dot(x + 8, y - 1, 3.4, "#a87038")}${dot(x + 9, y - 2, 1, INK)}`;
const ant = (x, y) => `${ln(`M${x - 4} ${y}l-3 4M${x} ${y}v5M${x + 4} ${y}l3 4M${x + 5} ${y - 3}l4 -4`, "#2a140c", 1.1)}${dot(x - 4, y, 3.2, "#5a2414")}${dot(x + 1, y - 0.5, 2.2, "#5a2414")}${dot(x + 5, y - 2, 2.6, "#5a2414")}`;
const tadpole = (x, y, rot, tail, col = "#3a3a30") => `<g transform="translate(${x} ${y}) rotate(${rot})">${move(tail, p("M5 -3Q13 -7 17 -1Q21 4 24 0Q19 10 13 4Q9 1 5 3Z", "#6a6a50", EDGE))}${el(0, 0, 7.5, 6, col, `stroke="#fff" stroke-width=".9"`)}${dot(-3, -1.5, 2, "#fff")}${dot(-3.4, -1.5, 1.1, INK)}</g>`;

const FROGSIG = {
  redeye: (k, mood, d) => {
    // Lids rest open, so the red eyes still show when motion is reduced.
    const lids = anim("flash-lid", "0%,40%,92%,100%{transform:scaleY(0)}55%,78%{transform:scaleY(1)}", 2.4, "top", ";transform:scaleY(0)");
    const burst = anim("flash-burst", "0%,40%{transform:scale(1);opacity:1}55%,78%{transform:scale(.6);opacity:0}86%{transform:scale(1.16);opacity:1}100%{transform:scale(1);opacity:1}", 2.4, "box");
    const hind = both(ln("M44 92L10 80L18 108", "#0005", 12) + ln("M44 92L10 80L18 108", k.c, 10) + ln("M40 94L16 86", "#2458d8", 5) + ln("M22 85l-2 6M30 88l-2 6", "#fff0b0", 2) + toes(18, 109, [[4, 106], [5, 117], [15, 119], [27, 117]], "#ff8a1a", 3.4, 3.8));
    const eyeAt = (x) => move(burst, rays(x, 44, 17, 24, "#ffd21e", 9, 2.8) + rays(x, 44, 17, 20, "#ff4a2a", 6, 2));
    const eyes = [39, 81].map((x) => feye(x, 44, mood === "sleepy" ? "happy" : mood, { r: 12.5, iris: k.a, pupil: "v", ring: "#ffe860" })).join("");
    const cover = [39, 81].map((x) => move(lids, el(x, 44, 14.6, 14.6, k.c) + ln(`M${x - 9} 53q9 5 18 0`, "#1f6a1c", 2.4))).join("");
    return {
      cap: [83, 30, 0.6],
      svg: frog({ ...d, hindSvg: hind, back: eyeAt(39) + eyeAt(81), eyes: { x: 39, y: 44, r: 12.5, bump: 15 }, eyeSvg: eyes + cover, mouthSvg: el(60, 71, 6, 5.4, "#7a1830", EDGE) }, mood) + say(60, 17, "!", 17, "#ffe23a"),
      css: lids.css + burst.css,
    };
  },
  tomato: (k, mood, d) => {
    const puff = anim("puff", "0%,100%{transform:scale(1.08,1.05)}45%{transform:scale(.92,.94)}70%{transform:scale(1.14,1.1)}", 1.7, "60px 114px");
    const goo = anim("goo", "0%{transform:translateY(0);opacity:1}80%{opacity:1}100%{transform:translateY(9px);opacity:0}", 1.4, "box");
    const drops = [[17, 66], [102, 64], [12, 90], [107, 91], [27, 33], [93, 34]].map(([x, y]) => move(goo, p(`M${x} ${y - 7}Q${x + 6} ${y + 2} ${x} ${y + 4}Q${x - 6} ${y + 2} ${x} ${y - 7}Z`, "#fffdf2", `stroke="#c8b8a0" stroke-width="1"`))).join("");
    const blob = frog({ ...d, shapeD: "M60 31C96 31 112 56 110 82C108 108 87 115 60 115C33 115 12 108 10 82C8 56 24 31 60 31Z", eyes: { ...d.eyes, y: 46, x: 41 }, mouth: { y: 68, w: 10, d: -5 }, blush: [29, 66] }, mood === "happy" ? "sad" : mood);
    return { svg: move(puff, blob + p("M24 96q5 8 10 1q4 9 9 2q-3 11 -12 8ZM96 94q-5 9 -10 2q-3 8 -8 3q3 10 12 7Z", "#fffdf2", `opacity=".95"`)) + drops + say(103, 30, "!!", 15), css: puff.css + goo.css };
  },
  rainfrog: (k, mood, d) => {
    const shake = anim("squeak-shake", "0%,100%{transform:translate(0,0) rotate(0deg)}20%{transform:translate(-1.6px,-4px) rotate(-3deg)}40%{transform:translate(1.6px,0) rotate(3deg)}60%{transform:translate(-1px,-3px) rotate(-2deg)}", 0.55, "60px 114px");
    const ring = anim("squeak-ring", "0%{transform:scale(.88);opacity:1}100%{transform:scale(1.08);opacity:.15}", 0.8, "60px 76px");
    const open = el(60, 79, 10.5, 12.5, "#5a1424", `stroke="${INK}" stroke-width="1.8"`) + el(60, 85, 6.4, 4.6, "#ff7a8c");
    return {
      neck: [60, 97, 33],
      svg: move(shake, frog({ ...d, mouthSvg: open, nose: { y: 62, x: 56 }, blush: [29, 71] }, mood)) + move(ring, ln("M8 50l8 5l-8 6l8 5M112 50l-8 5l8 6l-8 5M20 28l7 7M100 28l-7 7", "#fff6a8", 2.6)) + say(60, 20, "SQUEEE!", 14),
      css: shake.css + ring.css,
    };
  },
  glass: (k, mood) => {
    const beat = anim("glass-beat", "0%,40%,100%{transform:scale(1)}15%{transform:scale(1.3)}27%{transform:scale(.94)}", 0.85, "box");
    const glint = anim("glass-glint", "0%,100%{transform:translateX(-6px);opacity:.35}50%{transform:translateX(8px);opacity:.8}", 2.6, "box");
    const limb = (d2) => ln(d2, "#5a9a2a", 9.4, `opacity=".7"`) + ln(d2, "#c8f088", 7.6, `opacity=".85"`);
    const pad = (x, y, dx, dy) => toes(x, y, [[x + dx, y - 5], [x + dx * 1.3, y + dy * 0.2], [x + dx * 0.9, y + dy], [x + dx * 0.2, y + dy * 1.2]], "#e2f6a0", 2.4, 3);
    const pane = `<rect x="3" y="10" width="114" height="111" rx="14" fill="#bfeee8" opacity=".38" stroke="#e8ffff" stroke-width="2.5"/>`;
    const body = both(limb("M42 62L22 58L16 40") + pad(16, 39, -8, -7) + limb("M44 92L18 86L24 110") + pad(24, 110, -10, 7))
      + p("M60 22C81 22 90 36 86 49C83 58 85 66 87 78C90 100 76 110 60 110C44 110 30 100 33 78C35 66 37 58 34 49C30 36 39 22 60 22Z", "#c4ee7a", `opacity=".78" stroke="#5a9a2a" stroke-width="1.6"`)
      + el(60, 80, 21, 26, "#eefcd8", `opacity=".8"`)
      + ln("M52 86q-8 5 0 9q10 2 14 -3q9 -1 6 7q-4 8 -13 4q-10 -3 -13 4", "#f6d890", 4.6)
      + el(70, 77, 8, 6.4, "#c86a74", `transform="rotate(24 70 77)"`) + dots([[48, 76], [47, 82]], 2.4, "#fff") + ln("M60 72V60M60 74q-9 4 -11 14M61 74q6 10 2 18", "#e8606c", 1.5)
      + move(beat, heart(57, 67, 1.55, "#f0283e") + dot(54, 66, 1.4, "#fff", `opacity=".8"`));
    const face = both(dot(39, 29, 10, "#b8e868", EDGE) + feye(39, 28, mood, { r: 6.6, iris: "#f4d848", pupil: "h" })) + ln(mood === "sad" ? "M50 48q10 -6 20 0" : "M49 44q11 11 22 0", INK, 1.9) + both(el(42, 45, 4.4, 2.6, "#ff6f94", `opacity=".55"`));
    return { body: pane + body + face + move(glint, ln("M14 50L34 22M14 66L26 50", "#fff", 3.4)), neck: [60, 50, 22], cap: [60, 26, 0.72], css: beat.css + glint.css };
  },
  whites: (k, mood, d) => {
    const sink = anim("gulp-eyes", "0%,100%{transform:translateY(0)}35%{transform:translateY(5px)}60%{transform:translateY(-5px)}", 1.5, "60px 50px");
    const bug = anim("gulp-bug", "0%{transform:translate(8px,2px)}40%{transform:translate(0,0)}75%,100%{transform:translate(-12px,-2px) scale(.55)}", 1.5, "66px 74px");
    const throat = anim("gulp-throat", "0%,100%{transform:scale(1)}35%{transform:scale(1.25,1.12)}", 1.5, "60px 84px");
    const lids = [40, 80].map((x) => ln(mood === "love" ? "" : `M${x - 8} 55q8 -8 16 0`, INK, 2.6) + (mood === "love" ? heart(x, 51, 1) : "")).join("");
    const eyes = move(sink, both(el(40, 53, 12, 9, k.c, EDGE)) + lids);
    return {
      cap: [60, 40, 0.68],
      svg: frog({ ...d, eyes: { ...d.eyes, bump: 6, y: 54 }, eyeSvg: eyes, mouthSvg: move(throat, el(60, 84, 17, 11, d.belly ? k.b : k.c, EDGE)) + move(bug, cricket(80, 72)) + ln("M33 67Q60 82 80 71", INK, 2.2) }, mood) + say(98, 28, "gulp!", 12),
      css: sink.css + bug.css + throat.css,
    };
  },
  toad: (k, mood, d) => {
    const rise = anim("tiptoe", "0%,100%{transform:translateY(0) rotate(-4deg)}50%{transform:translateY(5px) rotate(2deg) scale(.96)}", 1.8, "60px 80px");
    const legs = both(ln("M34 76L21 94L27 116", "#0005", 13) + ln("M34 76L21 94L27 116", k.c, 11) + toes(27, 116, [[16, 119], [23, 120], [34, 119]], "#b89464", 3) + ln("M45 80L42 114", "#0005", 11) + ln("M45 80L42 114", k.c, 9) + toes(42, 115, [[36, 119], [43, 120], [50, 118]], "#b89464", 3));
    const body = `<g transform="translate(0 -17) translate(60 80) scale(1.04) translate(-60 -80)">${frog({ ...d, hindSvg: "", armSvg: "", shapeD: "M60 40C94 40 110 58 108 78C106 100 86 106 60 106C34 106 14 100 12 78C10 58 26 40 60 40Z", mouth: { y: 74, w: 22, d: -4 } }, mood)}</g>`;
    const snake = ln("M119 119Q104 112 112 100", "#6a8a4a", 8) + el(108, 96, 8, 6, "#7a9a54", `${EDGE} transform="rotate(-28 108 96)"`) + dot(106, 94, 1.8, INK) + dot(106.6, 93.4, 0.6, "#fff") + ln("M102 99l-6 4M96 103l-4 -1M96 103l-1 4", "#e8304a", 1.4) + ln("M111 101l-3 3", "#f2d848", 3);
    return { svg: legs + move(rise, body) + snake, css: rise.css, neck: [60, 70, 28], cap: [60, 26, 0.7] };
  },
  bullfrog: (k, mood, d) => {
    const sac = anim("sac", "0%,100%{transform:scale(1.04)}35%{transform:scale(.66,.55)}65%{transform:scale(1.12)}", 1.5, "60px 74px");
    const wave = anim("sac-wave", "0%,100%{transform:scale(.94);opacity:.35}60%{transform:scale(1.05);opacity:1}", 1.5, "60px 76px");
    const balloon = move(sac, p("M30 73Q60 80 90 73C102 90 90 113 60 113C30 113 18 90 30 73Z", "#f8f0a0", `stroke="#a89a3a" stroke-width="1.6"`) + el(45, 87, 8, 5.4, "#fff", `opacity=".75" transform="rotate(-30 45 87)"`) + ln("M60 79v30M46 80q-8 14 4 26M74 80q8 14 -4 26", "#d8c85a", 1.2, `opacity=".7"`));
    return {
      svg: frog({ ...d, mouthSvg: ln("M29 72Q60 80 91 72", INK, 2.2), blush: [34, 66], armSvg: both(ln("M30 86Q18 98 22 110", "#0005", 10) + ln("M30 86Q18 98 22 110", k.c, 8.4) + toes(22, 110, [[14, 115], [19, 119], [28, 118]], "#c8b870", 3)), front: balloon }, mood) + move(wave, soundArcs(62, "#e8ffb0")) + say(60, 17, "jug-o-RUM", 12),
      css: sac.css + wave.css, neck: null,
    };
  },
  firebelly: (k, mood) => {
    const rock = anim("unken", "0%,100%{transform:rotate(-6deg)}50%{transform:rotate(6deg)}", 1.4, "60px 108px");
    const blot = (x, y, s) => p(`M${x - 5 * s} ${y}q${2 * s} ${-6 * s} ${7 * s} ${-3 * s}q${6 * s} ${s} ${2 * s} ${6 * s}q${-3 * s} ${4 * s} ${-6 * s} 0q${-4 * s} 0 ${-3 * s} ${-3 * s}Z`, k.a);
    const palm = (x, y, ends, from) => ln(`M${from[0]} ${from[1]}L${x} ${y}`, "#0005", 12) + ln(`M${from[0]} ${from[1]}L${x} ${y}`, k.c, 10) + toes(x, y, ends, "#ff6a24", 3.4, 2.2) + dot(x, y, 6.4, k.b, `stroke="#0005" stroke-width="1"`) + dot(x + 1, y + 1, 2.4, k.a);
    const arms = both(palm(17, 39, [[6, 36], [9, 27], [18, 26], [27, 32]], [37, 70]) + palm(13, 98, [[2, 94], [2, 104], [9, 111], [18, 112]], [38, 94]));
    const body = p("M60 28C82 28 92 42 90 55C88 64 96 74 96 88C96 108 80 115 60 115C40 115 24 108 24 88C24 74 32 64 30 55C28 42 38 28 60 28Z", k.c, EDGE)
      + p("M60 58C78 58 88 74 88 90C88 106 76 112 60 112C44 112 32 106 32 90C32 74 42 58 60 58Z", k.b) + blot(46, 74, 1.2) + blot(72, 70, 1) + blot(62, 88, 1.35) + blot(44, 98, 0.9) + blot(77, 94, 1.15) + blot(58, 105, 0.8)
      + many([[50, 33, 3, 3.6], [72, 34, 3.4, 2.6], [28, 80, 3, 5], [92, 80, 3, 5]], k.a);
    const face = [44, 76].map((x) => dot(x, 38, 10, k.c, EDGE) + (mood === "love" ? heart(x, 36, 1) : ln(`M${x - 6} ${mood === "sad" ? 41 : 37}q6 ${mood === "sad" ? -4 : 5} 12 0`, INK, 2.4))).join("") + ln("M50 51q10 6 20 0", INK, 1.8) + both(el(40, 50, 4.4, 2.6, "#ff6f94", `opacity=".6"`));
    return { body: move(rock, arms + body + face) + say(105, 18, "!", 18, "#ff8a2a"), neck: [60, 58, 25], cap: [60, 31, 0.68], css: rock.css };
  },
  pacman: (k, mood, d) => {
    const lunge = anim("ambush", "0%,100%{transform:translateY(0) scale(1)}45%{transform:translateY(5px) scale(.97,.93)}62%{transform:translateY(-5px) scale(1.03)}", 1.5, "60px 114px");
    const prey = anim("ambush-prey", "0%{transform:translate(9px,-9px)}45%{transform:translate(2px,-3px)}65%,100%{transform:translate(-16px,12px) scale(.6)}", 1.5, "88px 66px");
    const maw = p("M17 72Q60 62 103 72Q98 110 60 110Q22 110 17 72Z", "#7a2034", `stroke="${INK}" stroke-width="2"`) + p("M34 100Q48 82 62 90Q76 80 86 100Q74 109 60 109Q44 109 34 100Z", "#ff8090") + ln("M60 92v12", "#e05a70", 1.6) + ln("M19 72Q60 63 101 72", "#f4e4b0", 3);
    const leaf = (x, y, rot, col) => `<g transform="rotate(${rot} ${x} ${y})">${p(`M${x - 17} ${y}Q${x - 4} ${y - 11} ${x + 17} ${y}Q${x - 2} ${y + 10} ${x - 17} ${y}Z`, col, EDGE)}${ln(`M${x - 15} ${y}H${x + 14}M${x - 6} ${y}l6 -5M${x + 2} ${y}l6 4`, "#0004", 1)}</g>`;
    const litter = leaf(18, 108, 18, "#b8742a") + leaf(100, 110, -20, "#8a5a24") + leaf(38, 116, -8, "#c8942e") + leaf(80, 116, 12, "#a84e22") + leaf(60, 119, -3, "#7a6a24") + leaf(9, 118, -30, "#6a4a20") + leaf(112, 118, 30, "#b8842a");
    return { svg: move(lunge, frog({ ...d, mouthSvg: maw, hindSvg: "", armSvg: "", blush: [23, 62], nose: { y: 56, x: 55 }, eyes: { ...d.eyes, y: 44 } }, mood)) + litter + move(prey, cricket(88, 66)) + say(98, 22, "CHOMP", 10), neck: null, css: lunge.css + prey.css };
  },
  budgett: (k, mood, d) => {
    const quake = anim("scream", "0%,100%{transform:translate(0,0)}25%{transform:translate(-1.8px,1px) scale(1.025)}50%{transform:translate(1.8px,-1px)}75%{transform:translate(-1px,-1px) scale(1.02)}", 0.4, "60px 100px");
    const roar = anim("scream-text", "0%,100%{transform:scale(.92)}50%{transform:scale(1.1)}", 0.7, "40px 16px");
    const legs = both(ln("M30 76L10 92L20 114", "#0005", 14) + ln("M30 76L10 92L20 114", k.c, 12) + toes(20, 114, [[8, 117], [17, 120], [29, 119]], "#a8a888", 3.4) + ln("M42 82L40 114", "#0005", 12) + ln("M42 82L40 114", k.c, 10) + toes(40, 114, [[33, 119], [42, 120], [49, 117]], "#a8a888", 3));
    const body = p("M60 26C94 26 112 48 110 70C108 94 88 102 60 102C32 102 12 94 10 70C8 48 26 26 60 26Z", k.c, EDGE)
      + many([[22, 48, 8, 6, -30], [98, 52, 7, 7], [60, 30, 8, 3], [16, 68, 4, 5], [104, 72, 4, 5]], k.a)
      + p("M18 60Q60 38 102 60Q100 98 60 100Q20 98 18 60Z", "#ff8c9a", `stroke="${INK}" stroke-width="2.4"`) + p("M28 64Q60 48 92 64Q88 90 60 92Q32 90 28 64Z", "#8a2840") + el(60, 83, 17, 8, "#ff7288") + el(60, 62, 5, 4, "#ffb0b8")
      + p("M51 94.5l3.4 -9l3.4 9.8ZM62.4 95.3l3.4 -9.8l3.4 9Z", "#fff", `stroke="#0006" stroke-width=".7"`);
    const eyes = [40, 80].map((x) => dot(x, 34, 10.5, k.c, EDGE) + (mood === "sleepy" ? ln(`M${x - 6} 30l8 4l-8 4`.replace("l8 4l-8 4", x < 60 ? "l9 4l-9 4" : "m12 0l-9 4l9 4"), INK, 2.4) : feye(x, 33, mood, { r: 7, iris: "#c8a848", pupil: "h" }))).join("");
    return { body: legs + move(quake, body + eyes) + move(roar, say(40, 15, "SCREEE!", 13)), css: quake.css + roar.css, neck: null, cap: [82, 25, 0.56] };
  },
  mossy: (k, mood) => {
    const rock = anim("ball", "0%,100%{transform:rotate(-9deg)}50%{transform:rotate(9deg)}", 3.2, "60px 114px");
    const drift = anim("ball-dots", "0%,100%{opacity:.25}50%{opacity:1}", 2, "box");
    const rim = Array.from({ length: 22 }, (_, i) => {
      const a = (i / 22) * Math.PI * 2;
      return dot((60 + Math.cos(a) * 36).toFixed(1), (80 + Math.sin(a) * 33).toFixed(1), 6 - (i % 3), i % 4 === 1 ? k.a : k.c, EDGE);
    }).join("");
    const ball = rim + el(60, 80, 37, 34, k.c) + p("M36 58Q50 45 66 55Q80 52 82 66Q70 64 66 72Q52 74 48 64Q38 68 36 58ZM28 82q14 -4 13 10q-8 10 -15 0ZM92 86q-16 -4 -10 12q8 6 12 -2Z", k.a)
      + warts("#3e6a24", "#c8e878", [[44, 53], [70, 50], [31, 70], [88, 72], [60, 58], [82, 100], [40, 104], [90, 80], [54, 49]], 3.2) + warts("#a86a3a", "#f0c088", [[64, 67], [32, 92], [78, 58]], 2.6);
    const face = [48, 72].map((x) => (mood === "love" ? heart(x, 74, 0.9) : ln(`M${x - 6} 77q6 ${mood === "sad" ? -4 : 5} 12 0`, "#10200a", 2.6))).join("") + ln("M54 84q6 3 12 0", "#10200a", 1.6) + both(el(40, 85, 4.4, 2.6, "#ff6f94", `opacity=".55"`));
    const paws = both(ln("M30 96Q42 108 54 101", "#0005", 10) + ln("M30 96Q42 108 54 101", k.c, 8.4) + toes(54, 101, [[60, 96], [61, 103], [57, 109]], "#a8884e", 3, 3.6) + ln("M32 108Q40 116 52 113", k.c, 7) + dots([[53, 113], [48, 117]], 3.2, "#a8884e"));
    return { body: move(rock, ball + face + paws) + move(drift, say(96, 36, "...", 18)), neck: [60, 91, 25], cap: [60, 51, 0.75], css: rock.css + drift.css };
  },
  strawberry: (k, mood, d) => {
    const egg = anim("egg", "0%{transform:translate(0,0)}15%{transform:translate(0,0)}65%{transform:translate(5px,34px)}80%,100%{transform:translate(5px,38px) scale(.5)}", 1.8, "72px 62px");
    const tail = anim("egg-tail", "0%,100%{transform:rotate(-14deg)}50%{transform:rotate(14deg)}", 0.5, "box");
    const leafBack = p("M60 118C30 112 8 92 4 66C24 72 36 82 44 92Z", "#2a8a4a", EDGE) + p("M60 118C90 112 112 92 116 66C96 72 84 82 76 92Z", "#2a8a4a", EDGE) + p("M60 112C44 100 38 82 40 68Q56 80 62 96Q70 80 94 64Q94 90 62 112Z", "#369e52", EDGE);
    const water = el(70, 99, 31, 11, "#8ad8f0", `stroke="#e8ffff" stroke-width="1.6"`) + ln("M52 96q6 -3 12 0M80 104q6 -2 10 0", "#fff", 1.4);
    const leafFront = p("M60 120C42 116 30 108 38 100Q54 114 72 112Q94 111 103 99C108 110 86 120 60 120Z", "#c8323c", EDGE) + p("M62 119C40 118 18 108 12 94Q34 100 44 108Q52 114 62 119ZM62 119C86 118 106 108 112 94Q94 100 82 110Z", "#2f9a50", EDGE);
    const mum = `<g transform="translate(-3 -2) scale(.66)">${frog({ ...d, eyes: { ...d.eyes, lid: INK } }, mood)}</g>`;
    return { body: leafBack + water + tadpole(74, 98, 8, tail, "#4a4030") + leafFront + mum + move(egg, el(72, 60, 5.6, 6.4, "#fff2a8", `stroke="#c8a02a" stroke-width="1.2"`) + dot(70, 58, 1.6, "#fff")), neck: [37, 52, 17], cap: [37, 25, 0.52], css: egg.css + tail.css };
  },
  terribilis: (k, mood, d) => {
    const tail = anim("taxi-tail", "0%,100%{transform:rotate(-18deg)}50%{transform:rotate(18deg)}", 0.5, "box");
    const hop = anim("taxi-hop", "0%,55%,100%{transform:translateY(0)}72%{transform:translateY(-6px)}", 1.4, "60px 114px");
    const riders = tadpole(55, 30, -8, tail) + tadpole(90, 63, 26, tail) + tadpole(29, 77, 160, tail);
    return { svg: move(hop, frog(d, mood) + riders) + ln("M6 96h10M3 104h12M7 112h8", "#fff", 2.2, `opacity=".8"`), css: tail.css + hop.css, cap: [82, 33, 0.6] };
  },
  atelopus: (k, mood, d) => {
    const wave = anim("wave", "0%,100%{transform:rotate(-20deg)}50%{transform:rotate(24deg)}", 0.9, "84px 82px");
    const lines = anim("wave-lines", "0%,100%{opacity:.2}50%{opacity:1}", 0.9, "box");
    const left = ARM.slim(k.c, "#e89a08", 1.8) + (d.armMarks || "");
    const raised = ln("M82 84L100 78L103 54", "#0005", 8.4) + ln("M82 84L100 78L103 54", k.c, 6.8) + ln("M93 77l5 6M99 63l7 1", k.a, 3.4) + toes(103, 53, [[92, 45], [98, 38], [107, 38], [114, 46]], "#e89a08", 2.8, 2.6);
    const stream = ln("M2 119q10 -5 20 0t20 0M80 120q9 -5 18 0t18 0", "#9ae4ff", 2.6);
    return { svg: frog({ ...d, armSvg: left, mouthSvg: p("M50 67Q60 70 70 67Q66 78 60 78Q54 78 50 67Z", "#8a2438", EDGE) }, mood) + move(wave, raised) + move(lines, ln("M111 30q8 6 6 16M105 24q12 4 14 16", "#fff", 2.4)) + stream, css: wave.css + lines.css };
  },
  azureus: (k, mood, d) => {
    const tap = anim("tap", "0%,30%,60%,100%{transform:rotate(0deg)}15%,45%{transform:rotate(-24deg)}", 0.8, "92px 107px");
    const tick = anim("tap-tick", "0%,30%,60%,100%{opacity:1}15%,45%{opacity:0}", 0.8, "box");
    const left = HIND.slim(k.b, "#4a80e8", 2.2) + d.legMarks;
    const leg = ln("M76 92L106 94L92 107", "#0005", 9) + ln("M76 92L106 94L92 107", k.b, 7.4) + dots([[102, 94], [98, 101]], 2, k.a) + toes(92, 108, [[86, 117], [94, 119]], "#4a80e8", 2.6, 2.2);
    const toe = move(tap, toes(92, 107, [[115, 112]], "#4a80e8", 4.4, 3.8) + dot(114, 110.8, 1.2, "#cfe4ff"));
    return { svg: frog({ ...d, hindSvg: `${left}${leg}` }, mood) + toe + move(tick, ln("M108 119l-3 4M118 118l1 5M118 104l2 -5M112 102v-6", "#fff6a8", 2.2)) + ant(13, 62) + say(104, 90, "tap!", 10), css: tap.css + tick.css };
  },
};

// ---------- axolotls ----------
const GILLS = [
  { root: "31px 47px", stalk: "M33 48Q20 42 11 31", frond: "M24 43l0 -10M18 39l-1 -10M13 34l-5 -8M23 44l-9 3M17 40l-9 3M11 31l-6 -1M11 31l-1 -6" },
  { root: "28px 61px", stalk: "M31 61Q18 58 5 59", frond: "M22 59l-4 -9M15 58l-4 -9M9 59l-5 -6M23 61l-5 8M16 60l-4 9M9 59l-4 7" },
  { root: "31px 74px", stalk: "M33 72Q20 76 12 88", frond: "M24 75l-10 -1M18 80l-10 -1M23 76l-2 10M17 81l-1 10M12 88l-7 3M12 88l0 7" },
];
const gill = (g, stalk, frond) => ln(g.stalk, "#0004", 7.4) + ln(g.frond, frond, 3.2) + ln(g.stalk, stalk, 5.4);
const mirror = (svg) => `<g transform="matrix(-1 0 0 1 120 0)">${svg}</g>`;

/** Front-facing axolotl. d: { c, belly, stalk, gill, right?:{...}, eyes, marks, tailMarks, flutter, mouthSvg, noArm } */
function axo(d, mood) {
  const R = d.right || d;
  const side = (s) => GILLS.map((g, i) => {
    const art = gill(g, s.stalk, s.gill);
    return d.flutter ? move(d.flutter[i], art) : art;
  }).join("");
  const wrapGills = (svg) => (d.flutter ? svg : wrap("bd-flap", svg));
  const gills = wrapGills(side(d)) + mirror(wrapGills(side(R)));
  const tail = p("M68 90C86 92 98 80 102 66C106 58 116 62 117 74C118 100 100 116 70 112Z", R.fin || R.belly, `${EDGE} opacity=".92"`) + p("M68 95C86 97 100 88 109 73C111 90 98 108 70 108Z", R.c) + (d.tailMarks || "");
  const leg = (s, d2, x, y, ends) => ln(d2, "#0005", 9.6) + ln(d2, s.c, 8) + toes(x, y, ends, s.toe || s.c, 2.8, 1.8);
  const legs = (s, fore) => leg(s, "M46 102Q40 108 41 112", 41, 113, [[32, 114], [34, 119], [40, 120], [46, 119], [49, 116]]) + (fore ? leg(s, "M43 89Q33 91 29 99", 29, 100, [[21, 99], [22, 106], [28, 108], [35, 105]]) : "");
  const body = el(60, 96, 22, 18, d.c, EDGE) + (d.right ? p("M60 78C74 78 82 86 82 96C82 106 72 114 60 114Z", R.c) : "") + el(60, 100, 13, 12, d.belly, `opacity=".9"`) + (d.right ? p("M60 88C68 88 73 94 73 100C73 107 67 112 60 112Z", R.belly) : "");
  const headD = "M60 32C84 32 99 45 99 61C99 77 82 86 60 86C38 86 21 77 21 61C21 45 36 32 60 32Z";
  const head = p(headD, d.c, EDGE) + (d.right ? p("M60 32C84 32 99 45 99 61C99 77 82 86 60 86Z", R.c) + ln("M60 32.5Q57 46 61 56T59 72T60 85.5", "#6a5460", 1, `opacity=".5"`) : "") + el(48, 39, 12, 4, "#fff", `opacity=".22" transform="rotate(-16 48 39)"`);
  const e = { r: 6.2, x: 39, y: 57, ...d.eyes };
  const eyes = feye(e.x, e.y, mood, e) + feye(120 - e.x, e.y, mood, R.eyes ? { r: 6.2, ...R.eyes } : e);
  const mouth = d.mouthSvg ?? ln(mood === "sad" ? "M50 76Q60 68 70 76" : "M43 68Q47 76 60 76Q73 76 77 68", d.mouthCol || INK, 2);
  const bl = both(el(32, 68, 5.2, 3, "#ff6f94", `opacity="${d.blushOp ?? 0.5}"`));
  return `${wrap("bd-wag", tail)}${legs(d, !d.noArm)}${mirror(legs(R, !d.noRightArm))}${body}${gills}${head}${d.marks || ""}${eyes}${dots([[55, 66], [65, 66]], 0.9, "#0007")}${mouth}${bl}`;
}
const AXO = {
  axolotl_wild: (k) => ({
    c: k.c, belly: k.b, stalk: "#6e4a34", gill: k.a, toe: "#8a8658", mouthCol: "#14140a", blushOp: 0.55,
    eyes: { r: 6.4, ring: "#e8c04a", lid: "#f6e49a" },
    marks: many([[48, 40, 4, 2.8], [63, 37, 3, 2.2], [75, 44, 4.4, 3], [31, 52, 3, 3], [90, 58, 3.4, 2.6], [58, 47, 2, 1.6], [28, 66, 2.4], [88, 72, 3, 2], [68, 55, 1.8], [42, 79, 2.6, 1.8], [50, 91, 3, 2], [74, 98, 3, 2.4], [44, 104, 2]], "#2a2814") + dots([[43, 45], [55, 40], [69, 41], [82, 52], [36, 44], [60, 53], [86, 64], [34, 76], [76, 79], [66, 91], [52, 47], [78, 37], [47, 98], [71, 106]], 1.05, "#f2d25a"),
    tailMarks: many([[86, 100, 4, 3], [101, 88, 3, 4], [108, 74, 2.4, 3]], "#2a2814") + dots([[80, 104], [95, 96], [104, 80], [91, 101]], 1.1, "#f2d25a"),
  }),
  axolotl_leucistic: (k) => ({
    c: k.c, belly: k.b, stalk: "#ff94ae", gill: k.a, toe: "#ffb4c4", mouthCol: "#8a2a48", eyes: { r: 6.2 },
    marks: dots([[53, 44], [57, 41], [62, 43], [66, 40], [60, 47]], 0.8, "#c89aa8") + ln("M52 37Q60 34 68 37", "#fff", 2, `opacity=".8"`),
    tailMarks: ln("M86 104Q100 96 108 82", "#ff9ab0", 1.4),
  }),
  axolotl_golden: (k) => ({
    c: k.c, belly: k.b, stalk: "#ffb25a", gill: k.a, toe: "#ffe298", mouthCol: "#8a4a10", eyes: { r: 6.2, iris: "#ff9a8a", pupil: "round", ring: "#fff6c0" },
    marks: [[45, 43, 3.6], [71, 39, 2.8], [86, 55, 2.4], [32, 55, 2], [60, 48, 2], [50, 94, 2.6], [74, 100, 2], [68, 80, 1.8]].map(([x, y, r]) => sparkle(x, y, r, "#fffbe8")).join("") + dots([[55, 39], [78, 47], [38, 47], [91, 66], [29, 68], [66, 52], [43, 100], [67, 107], [50, 79]], 1.1, "#fff4a0"),
    tailMarks: sparkle(96, 94, 3.4, "#fffbe8") + sparkle(108, 76, 2.4, "#fffbe8") + dots([[84, 103], [103, 86]], 1.1, "#fff4a0"),
  }),
  axolotl_melanoid: (k) => ({
    c: k.c, belly: k.b, stalk: "#3c3448", gill: k.a, toe: "#4c4658", fin: "#4a4458", mouthCol: "#c8b8e0", blushOp: 0.38,
    eyes: { r: 6.6, lid: "#e0d0f4" },
    marks: ln("M38 41Q52 33 70 36", "#9a90b8", 3.4, `opacity=".55"`) + dots([[77, 39]], 1.8, "#9a90b8") + el(60, 82, 17, 3.4, k.b, `opacity=".7"`),
    tailMarks: ln("M82 106Q100 100 108 84", "#6a6080", 2),
  }),
  axolotl_chimera: (k) => ({
    c: k.c, belly: k.b, stalk: "#ff94ae", gill: "#f0547a", toe: "#ffb4c4", mouthCol: "#a84868", eyes: { r: 6.2, lid: INK },
    right: { c: k.a, belly: "#5a5464", fin: "#524c5e", stalk: "#443a4a", gill: "#6a2c50", toe: "#524c5e", eyes: { r: 6.4, ring: "#e8c04a", lid: "#f0e0ff" } },
    marks: dots([[68, 41], [80, 46], [89, 60], [74, 77], [66, 52], [84, 70]], 1.1, "#e8c85a") + many([[72, 38, 3, 2], [88, 52, 2.6, 3], [80, 74, 3, 2]], "#1a1620") + dots([[44, 43], [38, 47], [48, 40]], 0.8, "#c89aa8"),
    tailMarks: dots([[90, 100], [104, 84], [82, 105]], 1.2, "#e8c85a"),
  }),
};
const axoOut = (svg, extra = {}) => ({ body: wrap("bd-breathe", svg), neck: [60, 85, 22], cap: [60, 36, 0.9], ...extra });

const AXOSIG = {
  axolotl_wild: (k, mood, d) => {
    const gulp = anim("gulp-mouth", "0%,100%{transform:scale(1)}30%{transform:scale(1.14,1.2)}60%{transform:scale(.35,.2)}80%{transform:scale(.7,.5)}", 1.6, "60px 74px");
    const worm = anim("gulp-worm", "0%{transform:translate(14px,3px)}30%{transform:translate(5px,1px)}60%,100%{transform:translate(-18px,-1px) scale(.4)}", 1.6, "66px 74px");
    const maw = move(gulp, el(60, 74, 13, 10.5, "#3a0c1c", `stroke="${INK}" stroke-width="1.8"`) + el(60, 79.5, 8, 4, "#e8607c"));
    const w = ln("M66 75q8 -7 15 0t15 -1t13 -7", "#8a1420", 6.4) + ln("M66 75q8 -7 15 0t15 -1t13 -7", "#ff4a50", 4.4) + ln("M76 70v4M86 76v4M96 73v4", "#a81c28", 1.2);
    return { svg: axo({ ...d, mouthSvg: maw }, mood) + move(worm, w) + ln("M100 52l-9 6M112 60l-10 3M104 90l-10 -6", "#e8ffff", 2) + bubble(103, 38, 4) + bubble(94, 27, 2.6) + say(24, 24, "slurp!", 11), css: gulp.css + worm.css };
  },
  axolotl_leucistic: (k, mood, d) => {
    const flut = GILLS.map((g, i) => anim(`gill-${i}`, `0%,100%{transform:rotate(${[19, 4, -14][i]}deg) scale(1.04)}50%{transform:rotate(${[-9, -20, 18][i]}deg) scale(1.1)}`, 0.46 + i * 0.07, g.root));
    const rise = anim("gill-bubble", "0%{transform:translateY(8px);opacity:0}25%{opacity:1}100%{transform:translateY(-18px);opacity:0}", 1.8, "box", ";animation-delay:-.7s");
    const swish = ln("M4 18q8 3 9 12M116 18q-8 3 -9 12M2 98q3 8 11 10M118 52q-4 -6 -2 -12", "#e8ffff", 2.2);
    return { svg: axo({ ...d, flutter: flut, mouthSvg: p("M49 70Q60 74 71 70Q68 82 60 82Q52 82 49 70Z", "#a82a50", EDGE) + el(60, 79, 5, 2.4, "#ff8aa0") }, mood) + swish + move(rise, bubble(30, 24, 4.4) + bubble(88, 18, 3.4) + bubble(103, 34, 2.4) + bubble(18, 38, 2)), css: flut.map((a) => a.css).join("") + rise.css };
  },
  axolotl_golden: (k, mood, d) => {
    const grow = anim("regrow", "0%{transform:scale(.4)}60%,80%{transform:scale(1.12)}100%{transform:scale(.4)}", 3, "76px 90px");
    const glow = anim("regrow-glow", "0%,100%{opacity:.3;transform:scale(.8)}50%{opacity:.95;transform:scale(1.15)}", 1.2, "93px 96px");
    const halo = move(glow, dot(93, 96, 18, "#b8fff0", `opacity=".55"`) + sparkle(108, 86, 6, "#fff") + sparkle(104, 110, 4.4, "#fff") + sparkle(82, 112, 3.4, "#fff"));
    const bud = move(grow, ln("M76 90Q87 91 91 96", "#d87a3a", 10) + ln("M76 90Q87 91 91 96", "#ffd0c0", 8.2) + toes(91, 96, [[100, 93], [100, 101], [93, 105]], "#ffd0c0", 3.4, 2.4));
    return { svg: axo({ ...d, noRightArm: true }, mood) + halo + bud + say(100, 20, "regrow!", 10, "#d8fff4"), css: grow.css + glow.css };
  },
  axolotl_chimera: (k, mood, d) => {
    const swim = anim("surface", "0%,100%{transform:translateY(6px)}50%{transform:translateY(-3px)}", 2.2, "60px 70px");
    const ripple = anim("surface-ripple", "0%{transform:scale(.4);opacity:1}100%{transform:scale(1.25);opacity:0}", 2.2, "60px 17px");
    const up = anim("surface-bubble", "0%{transform:translateY(6px);opacity:.2}50%{opacity:1}100%{transform:translateY(-8px);opacity:.3}", 1.3, "box");
    const water = `<rect x="2" y="17" width="116" height="104" rx="12" fill="#6ac8ee" opacity=".22"/>` + ln("M2 17q10 -6 19.3 0t19.3 0t19.4 0t19.4 0t19.3 0t19.3 0", "#e8ffff", 2.6);
    const mouth = el(60, 73, 5.6, 6.4, "#4a1028", `stroke="${INK}" stroke-width="1.6"`);
    return { body: water + move(swim, `<g transform="translate(0 1) translate(60 78) scale(.9) translate(-60 -78)">${axo({ ...d, mouthSvg: mouth }, mood)}</g>`) + move(ripple, `<ellipse cx="60" cy="17" rx="24" ry="6" fill="none" stroke="#fff" stroke-width="2"/>`) + move(up, bubble(60, 29, 4.6) + bubble(70, 22, 2.8) + bubble(51, 21, 2.2)), neck: null, cap: [60, 41, 0.8], shadow: false, css: swim.css + ripple.css + up.css };
  },
};

// ---------- salamanders ----------
const S_TAIL = "M70 87C90 92 100 80 103 66C106 55 117 56 117 66C119 94 102 115 70 111Z";
const S_BODY = "M36 74C58 68 88 74 96 91C101 107 84 115 62 114C43 113 28 104 28 90Z";
const S_HEAD = "M43 35C64 35 78 48 78 63C78 78 62 87 43 87C24 87 8 78 8 63C8 48 22 35 43 35Z";
const sleg = (d, x, y, ends, c, toe) => ln(d, "#0005", 10.6) + ln(d, c, 9) + toes(x, y, ends, toe, 3, 1.9);
/** Three-quarter salamander. d: { c, belly, toe, head, body, tail, legs, back, eyes, hindToes, mouthSvg, noTail, headT } */
function sal(d, mood) {
  const toe = d.toe || d.c;
  const hind5 = d.hindToes !== 4;
  const far = sleg("M76 102Q78 108 75 113", 75, 114, [[68, 117], [73, 119], [80, 118]], d.c, toe);
  const near = sleg("M88 98Q101 101 102 110", 102, 111, hind5 ? [[94, 117], [99, 119], [105, 119], [111, 116], [112, 110]] : [[96, 118], [102, 119], [109, 117], [112, 111]], d.c, toe);
  const fl = sleg("M37 90Q23 94 21 108", 21, 109, [[12, 111], [15, 117], [22, 119], [29, 116]], d.c, toe);
  const fr = sleg("M54 96Q56 103 54 110", 54, 111, [[46, 116], [52, 119], [58, 119], [63, 115]], d.c, toe);
  const e = { r: 6.6, ...d.eyes };
  const ex = e.x || 28, ey = e.y || 60;
  const mouth = d.mouthSvg ?? ln(mood === "sad" ? "M34 79Q43 72 52 79" : "M29 71Q35 79 43 79Q52 79 58 71", d.mouthCol || INK, 2);
  const head = `${p(d.headD || S_HEAD, d.c, EDGE)}${el(32, 43, 10, 3.6, "#fff", `opacity=".2" transform="rotate(-18 32 43)"`)}${d.head || ""}${feye(ex, ey, mood, e)}${feye(86 - ex, ey, mood, e)}${dots([[39, 68], [47, 68]], 1, d.noseCol || "#0008")}${mouth}${el(18, 72, 5, 3, "#ff6f94", `opacity=".5"`)}${el(68, 72, 5, 3, "#ff6f94", `opacity=".5"`)}${d.over || ""}`;
  const tail = d.noTail ? "" : wrap("bd-wag", p(S_TAIL, d.c, EDGE) + (d.tail || ""));
  return `${tail}${far}${p(S_BODY, d.c, EDGE)}${d.belly || ""}${d.body || ""}${near}${d.legs || ""}${fl}${fr}${d.headWrap ? d.headWrap(`${d.back || ""}${head}`) : `${d.back || ""}${head}`}`;
}
const salOut = (svg, extra = {}) => ({ body: wrap("bd-breathe", svg), neck: [43, 85, 24], cap: [43, 39, 0.85], ...extra });

const SAL = {
  firesal: (k) => ({
    c: k.c, toe: "#2c2830", mouthCol: "#ffe070", eyes: { r: 7, lid: "#ffe070" }, noseCol: "#fff8",
    belly: el(52, 106, 20, 6, k.b),
    head: p("M14 55Q13 41 27 39Q36 41 35 48Q27 46 22 52Q19 57 14 55ZM72 55Q73 41 59 39Q50 41 51 48Q59 46 64 52Q67 57 72 55Z", k.a, `stroke="#c88a08" stroke-width="1"`) + dots([[19, 50], [24, 45], [30, 43], [67, 50], [62, 45], [56, 43]], 0.9, "#7a5400") + p("M39 38Q47 36 49 42Q46 52 42 51Q36 46 39 38Z", k.a),
    body: p("M58 76q14 -2 17 8q-4 8 -13 3q-8 -5 -4 -11ZM78 92q14 2 13 11q-9 8 -15 0q-4 -7 2 -11ZM48 90q10 0 8 9q-9 4 -8 -9Z", k.a) + dots([[70, 76], [80, 82], [87, 89]], 1.1, "#fff6b0"),
    tail: p("M84 94q12 -4 14 4q-6 11 -14 4ZM102 74q8 -9 12 2q-1 12 -10 10q-5 -5 -2 -12Z", k.a),
    legs: el(97, 101, 5, 3.4, k.a, `transform="rotate(20 97 101)"`) + el(24, 100, 4, 5.4, k.a) + el(55, 106, 3.4, 4, k.a),
  }),
  tiger: (k) => ({
    c: k.c, toe: "#5a5a3a", mouthCol: "#f4e070", eyes: { r: 5.6, iris: "#8a7420", pupil: "round", ring: "#e8d868", lid: "#fff0a0" }, noseCol: "#0009",
    headD: "M43 38C66 38 81 50 80 65C79 79 62 87 43 87C24 87 7 79 6 65C5 50 20 38 43 38Z",
    belly: el(54, 107, 21, 6, k.b),
    head: p("M13 52L20 44L24 50L18 54ZM33 39L41 39L38 50L33 47ZM52 41L60 43L55 52L50 48ZM69 48L76 56L68 57ZM9 65l8 2l-3 8ZM77 68l-8 2l4 8ZM41 53l5 3l-3 6l-4 -3Z", k.a),
    body: p("M56 74L64 75L60 92L52 88ZM72 79L80 83L72 96L68 90ZM86 90L94 96L90 108L84 100ZM46 94l8 6l-5 9l-6 -5ZM64 100l8 -2l2 12l-9 2Z", k.a),
    tail: p("M80 90L88 91L88 109L81 106ZM96 82L104 78L106 96L97 102ZM105 62L114 62L112 71L104 72Z", k.a),
    legs: p("M93 99l8 0l-2 7l-7 -2ZM22 96l8 -2l-3 9l-6 -1Z", k.a),
  }),
  eft: (k) => {
    const spot = (x, y, r) => dot(x, y, r, "#1c0c0c") + dot(x, y, r * 0.62, k.a);
    return {
      c: k.c, toe: "#ff7a34", mouthCol: "#5a1408", eyes: { r: 6.8, iris: "#e8b83a", pupil: "h" },
      headD: "M43 38C61 38 74 50 74 63C74 77 59 86 43 86C27 86 12 77 12 63C12 50 25 38 43 38Z",
      belly: el(54, 106, 22, 7, k.b),
      head: spot(24, 47, 3) + spot(62, 47, 3) + dots([[37, 43], [49, 42], [43, 49], [32, 51], [55, 51], [17, 60], [70, 60]], 0.75, "#5a1408"),
      body: spot(57, 78, 3.8) + spot(71, 82, 4) + spot(83, 91, 3.6) + dots([[50, 88], [64, 91], [77, 100], [88, 103], [60, 99], [70, 106], [80, 78], [46, 98]], 0.8, "#5a1408"),
      tail: spot(92, 94, 3) + spot(104, 82, 2.6) + spot(110, 69, 2) + dots([[84, 104], [98, 103], [110, 84], [101, 70]], 0.75, "#5a1408"),
    };
  },
  mudpuppy: (k) => {
    const bush = (x, y, dx, dy) => {
      const d = `M${x} ${y}q${dx * 0.5} ${dy * 0.2} ${dx} ${dy}`;
      const fr = [0.35, 0.6, 0.85, 1].map((t) => `M${x + dx * t} ${y + dy * t - 1}l${dx > 0 ? 1 : -1} -7M${x + dx * t} ${y + dy * t}l${dx > 0 ? 2 : -2} 7`).join("");
      return ln(d, "#0005", 6.6) + ln(fr, k.a, 3.6) + ln(d, "#c0405a", 4.6);
    };
    return {
      c: k.c, toe: "#a88464", hindToes: 4, mouthCol: "#241408", eyes: { r: 5.2, lid: "#f4e0c4" },
      back: bush(15, 70, -9, -10) + bush(14, 77, -9, 7) + bush(71, 70, 11, -10) + bush(72, 77, 11, 7),
      headD: "M43 40C62 40 76 49 77 63C78 78 62 87 43 87C24 87 8 78 9 63C10 49 24 40 43 40Z",
      belly: el(54, 107, 21, 6, k.b),
      head: p("M10 59Q18 52 30 53Q36 56 43 56Q50 56 56 53Q68 52 76 59Q77 65 73 67Q64 66 56 67Q48 63 43 63Q38 63 30 67Q22 66 13 67Q9 64 10 59Z", "#3c2618", `opacity=".9"`) + many([[28, 47, 3.4, 2.6], [52, 45, 4, 3], [41, 50, 2], [63, 49, 2.6]], "#242040"),
      body: many([[58, 77, 4], [73, 81, 3.4, 4], [86, 94, 4.4, 3.6], [64, 93, 3.6], [49, 90, 2.4], [76, 104, 4, 3], [55, 104, 2]], "#242040"),
      tail: p("M72 90C90 95 102 82 106 66C108 60 112 60 113 64C108 86 94 100 72 96Z", "#b86a4a", `opacity=".55"`) + many([[88, 102, 4, 3], [102, 91, 3.4, 4], [112, 71, 2.6, 3]], "#242040"),
    };
  },
};

const SALSIG = {
  firesal: (k, mood, d) => {
    const duck = anim("spray-duck", "0%,100%{transform:translateY(4px) rotate(0deg)}45%{transform:translateY(8px) rotate(-3deg)}", 1.1, "43px 70px");
    const jet = anim("spray-jet", "0%{transform:scale(.55);opacity:0}25%{opacity:1}70%{transform:scale(1.04);opacity:1}100%{transform:scale(1.14);opacity:0}", 1.1, "43px 52px");
    const stream = ln("M20 46Q8 22 2 30M25 42Q22 14 12 12M66 46Q82 22 94 30M61 42Q68 12 82 12M36 40Q34 22 30 16M52 40Q56 24 62 22", "#fdfbe8", 2.4, `stroke-dasharray="4 4"`) + [[2, 33, 3], [11, 10, 3.4], [95, 33, 3], [84, 11, 3.4], [29, 13, 2.4], [64, 19, 2.4], [6, 20, 1.6], [90, 20, 1.6]].map(([x, y, r]) => dot(x, y, r, "#fffef0", `stroke="#a8a870" stroke-width=".9"`)).join("");
    const brows = ln("M20 50l14 5M66 50l-14 5", "#ffe070", 2.6);
    return { svg: sal({ ...d, headWrap: (h) => move(duck, `<g transform="translate(43 66) scale(1 .94) translate(-43 -66)">${h}</g>`), over: brows, mouthSvg: ln("M34 78Q43 74 52 78", "#ffe070", 2) }, mood) + move(jet, stream), css: duck.css + jet.css, neck: [43, 90, 23], cap: [43, 47, 0.8] };
  },
  tiger: (k, mood, d) => {
    const peek = anim("dig-peek", "0%,100%{transform:translateY(0)}45%{transform:translateY(12px)}65%{transform:translateY(-4px)}", 2.2, "60px 90px");
    const clod = anim("dig-clod", "0%{transform:translateY(12px);opacity:0}30%{opacity:1}60%{transform:translateY(-7px);opacity:1}100%{transform:translateY(8px);opacity:0}", 0.9, "box");
    const hole = el(60, 99, 46, 13, "#2a180c");
    const headOnly = `<g transform="translate(17 13)">${p(d.headD, k.c, EDGE)}${el(32, 44, 10, 3.6, "#fff", `opacity=".2"`)}${d.head}${feye(28, 60, mood, d.eyes)}${feye(58, 60, mood, d.eyes)}${dots([[39, 68], [47, 68]], 1, "#000a")}${ln(mood === "sad" ? "M34 79Q43 72 52 79" : "M27 71Q34 80 43 80Q52 80 60 71", d.mouthCol, 2)}${el(18, 72, 5, 3, "#ff6f94", `opacity=".5"`)}${el(68, 72, 5, 3, "#ff6f94", `opacity=".5"`)}</g>`;
    const chest = el(60, 101, 25, 10, k.c);
    const mound = p("M3 119Q8 98 19 100Q24 90 34 102Q60 112 86 102Q96 90 102 100Q113 98 117 119Z", "#7a4e2a", EDGE) + dots([[16, 108], [31, 112], [48, 115], [72, 113], [90, 110], [104, 107], [24, 116], [98, 117], [62, 117]], 2.4, "#a87444") + dots([[40, 110], [82, 116], [12, 115], [108, 114]], 1.6, "#4a2c14");
    const paws = both(ln("M38 99Q30 100 29 105", k.c, 9) + toes(29, 105, [[21, 107], [24, 113], [31, 114], [37, 111]], "#6a6a42", 3.2, 2));
    const dirt = move(clod, dots([[10, 74], [18, 58], [104, 64], [112, 82]], 4, "#8a5a30") + dots([[6, 92], [25, 78], [97, 80], [96, 48]], 2.4, "#a87444") + ln("M17 86l-7 -8M103 86l7 -8", "#e8c89a", 2));
    return { body: hole + move(peek, chest + headOnly) + mound + paws + dirt, neck: null, cap: [60, 52, 0.85], shadow: false, css: peek.css + clod.css };
  },
};

// ---------- great crested newt (side view, facing left) ----------
function newt(k, mood, sig) {
  const fan = sig ? anim("fan", "0%,100%{transform:rotate(-17deg)}50%{transform:rotate(16deg)}", 0.55, "84px 88px") : null;
  const sway = sig ? anim("fan-crest", "0%,100%{transform:scale(1,1)}50%{transform:scale(1.02,1.13)}", 1.1, "52px 68px") : null;
  const ripple = sig ? anim("fan-ripple", "0%{transform:scale(.8);opacity:1}100%{transform:scale(1.15);opacity:0}", 1.1, "box") : null;
  const crestD = sig ? "M30 54L30 36L38 48L41 25L48 45L55 23L58 49L68 30L68 58L79 45L80 68L86 76L56 70Z" : "M30 54L34 42L40 52L45 36L50 54L57 41L60 59L68 48L70 64L78 57L80 72L60 70Z";
  const crest = p(crestD, "#4a3c30", `stroke="#1a140e" stroke-width="1.2" stroke-linejoin="round"`);
  const tailArt = (curl) => (curl
    ? p("M80 76C90 66 100 48 96 32C108 28 119 44 117 66C116 90 100 100 84 96Z", "#4a3c30", EDGE) + p("M82 80C94 70 104 56 102 40C112 48 112 68 106 80C100 90 92 94 84 92Z", k.c) + ln("M90 82Q108 68 107 44", k.a, 5.4) + dots([[100, 84], [110, 70], [94, 70], [113, 54]], 2, "#0c0a08")
    : p("M80 76C90 62 106 52 112 62C119 72 119 92 108 97C98 102 88 100 80 94Z", "#4a3c30", EDGE) + p("M80 79C96 70 110 70 116 78C110 90 96 94 80 92Z", k.c) + ln("M85 84Q99 77 112 79", k.a, 5.4) + p("M82 93Q98 96 110 91Q100 100 86 98Z", k.b) + dots([[93, 91], [102, 88], [92, 74], [106, 71]], 1.7, "#0c0a08"));
  const leg = (d, x, y, ends) => ln(d, "#0005", 8.4) + ln(d, k.c, 6.8) + toes(x, y, ends, "#ffb02a", 2.6, 1.5) + dots(ends.map(([a, b]) => [(a + x) / 2, (b + y) / 2]), 1.1, "#17100a");
  const far = leg("M48 92Q54 102 52 108", 52, 109, [[46, 114], [53, 116], [59, 112]]) + leg("M82 90Q90 100 88 106", 88, 107, [[84, 113], [91, 114], [97, 110]]);
  const near = leg("M36 90Q28 100 30 108", 30, 109, [[21, 111], [24, 116], [31, 118], [37, 115]]) + leg("M70 94Q68 104 72 110", 72, 111, [[64, 115], [69, 119], [76, 119], [81, 115]]);
  const body = p("M36 56C60 54 84 68 88 82C90 96 66 104 44 98C34 96 26 90 26 84Z", k.c, EDGE)
    + p("M20 83C30 92 44 92 60 92C72 91 82 88 87 85C86 97 66 104 46 100C32 97 23 92 20 83Z", k.b)
    + many([[36, 94, 3, 2.4], [49, 97, 3.4, 2.6], [63, 96, 2.8, 3], [76, 92, 2.6, 2]], "#17100a")
    + many([[54, 70, 3, 2.4], [68, 74, 3.4, 3], [60, 83, 2.4], [78, 80, 2.2], [46, 78, 2]], "#0c0a08")
    + dots([[48, 86], [55, 88], [64, 87], [71, 85], [78, 87], [52, 83], [68, 89], [83, 83], [58, 90], [74, 90]], 0.95, "#fff");
  const head = p("M7 72C8 57 21 49 34 50C50 51 60 62 57 76C54 89 40 92 26 88C13 84 7 80 7 72Z", k.c, EDGE)
    + p("M10 79C18 84 34 86 50 82C44 91 28 92 18 86C13 84 11 82 10 79Z", k.b) + dots([[24, 87], [35, 88], [44, 84]], 1.5, "#17100a")
    + el(26, 56, 8, 2.8, "#fff", `opacity=".2" transform="rotate(-14 26 56)"`) + dots([[43, 66], [49, 72], [38, 60]], 2, "#0c0a08") + dots([[40, 79], [46, 76], [34, 80], [49, 80]], 0.9, "#fff")
    + feye(23, 66, mood, { r: 7.2, iris: "#f2c02a", pupil: "h", lid: "#ffe898" })
    + dot(9.5, 71, 1, "#fff8") + ln(mood === "sad" ? "M11 81q7 -5 13 0" : "M9 75q6 8 17 3", "#ffd890", 1.8) + el(35, 75, 4.2, 2.6, "#ff6f94", `opacity=".6"`);
  const tail = sig ? move(fan, tailArt(true)) : wrap("bd-wag", tailArt(false));
  const crestG = sig ? move(sway, crest) : crest;
  let extra = "", css = "";
  if (sig) {
    extra = move(ripple, ln("M92 22q16 -2 22 10M82 17q22 -6 34 8M94 106q16 2 22 -10", "#d8f8ff", 2.4)) + heart(14, 34, 1.3) + heart(26, 18, 0.9) + bubble(10, 52, 3);
    css = fan.css + sway.css + ripple.css;
  }
  return { body: wrap("bd-breathe", tail + far + crestG + body + near + head) + extra, neck: [55, 81, 11], cap: [24, 54, 0.66], css };
}

// ---------- olm (side view: long snout, no visible eyes, three front toes and two hind toes) ----------
function olm(k, mood, sig) {
  const ring = sig ? anim("sense", "0%{transform:scale(.25);opacity:1}100%{transform:scale(1.2);opacity:0}", 2.1, "13px 72px") : null;
  const ring2 = sig ? anim("sense-late", "0%{transform:scale(.25);opacity:1}100%{transform:scale(1.2);opacity:0}", 2.1, "13px 72px", ";animation-delay:-1.05s;transform:scale(.6)") : null;
  const prey = sig ? anim("sense-prey", "0%,100%{transform:translate(0,0)}50%{transform:translate(3px,-5px)}", 1.2, "box") : null;
  const tubeD = "M52 68C78 62 104 70 103 87C102 105 76 98 56 104C44 108 34 114 22 112";
  const tube = ln(tubeD, "#c8848a", 17.4) + ln(tubeD, k.c, 15) + ln("M24 112Q12 113 6 104", "#c8848a", 8) + ln("M24 112Q12 113 6 104", k.c, 6) + ln("M10 106Q18 117 40 111", k.b, 3) + ln("M58 66C80 63 98 70 99 82", "#fff", 3.4, `opacity=".65"`)
    + ln("M74 66q-2 7 1 13M85 68q-4 6 -2 12M95 75q-7 3 -7 9M98 90q-7 -3 -11 0M80 94q1 6 -2 8M68 96q2 5 0 9", "#e0a0a4", 1.2);
  const leg = (d, x, y, ends) => ln(d, "#c8848a", 7.2) + ln(d, k.c, 5.4) + ends.map(([a, b]) => ln(`M${x} ${y}L${a} ${b}`, "#c8848a", 3.8) + ln(`M${x} ${y}L${a} ${b}`, k.c, 2.4)).join("");
  const legs = leg("M58 76Q57 88 49 93", 49, 93, [[40, 92], [41, 98], [47, 102]]) + leg("M90 97Q96 108 92 111", 92, 111, [[87, 119], [98, 118]]);
  const gill = (d, fr) => ln(fr, k.a, 3) + ln(d, "#f47a8c", 4.4);
  const gills = gill("M57 56Q66 46 74 36", "M63 49l-2 -9M69 43l-1 -9M66 47l9 -1M72 40l8 0M74 36l3 -7") + gill("M61 62Q74 58 86 52", "M69 59l1 -9M77 56l2 -9M72 59l6 6M80 55l6 5M86 52l7 -3") + gill("M60 70Q72 74 80 82", "M68 73l7 -5M74 77l8 -3M67 74l0 9M74 79l-1 9M80 82l5 5");
  const head = p("M54 53C42 50 30 56 17 63C7 68 6 77 15 80C28 86 48 86 60 80C71 74 68 57 54 53Z", k.c, `stroke="#c8848a" stroke-width="1.4"`) + el(38, 60, 12, 3, "#fff", `opacity=".6" transform="rotate(-20 38 60)"`)
    + (mood === "sleepy" || mood === "love" ? eye(34, 67, mood, { lid: "#a85a68" }) : el(34, 66, 3.6, 3, "#d8949c", `opacity=".75"`) + ln("M29 67q5 -6 10 0", "#8a4a5a", 2) + (mood === "sad" ? ln("M28 61l11 -4", "#8a4a5a", 1.8) : ""))
    + dot(12, 70, 1, "#8a4a5a") + ln(mood === "sad" ? "M16 79q8 -5 15 -1" : "M13 75q9 8 22 3", "#a84a60", 1.7) + el(45, 74, 5.4, 3.2, "#ff6f94", `opacity=".55"`);
  const main = wrap("bd-breathe", tube + legs + gills + head);
  if (!sig) return { body: main, neck: [55, 78, 14], cap: [45, 56, 0.7], css: "" };
  const cave = el(60, 70, 58, 52, "#1c1836", `opacity=".62"`);
  const wave = (a, col) => move(a, `<ellipse cx="17" cy="72" rx="15" ry="31" fill="none" stroke="${col}" stroke-width="2.6"/>`);
  const shrimp = move(prey, p("M8 31Q19 20 27 31Q22 29 19 33Q15 38 8 31Z", "#c8f8ff", `stroke="#6ad8ff" stroke-width="1.2"`) + ln("M10 30q-6 -6 -3 -12M13 34l-2 5M17 35l0 5", "#a8f0ff", 1.3) + dot(23, 28, 1.2, INK));
  return { body: cave + wave(ring, "#8af4ff") + wave(ring2, "#c8a8ff") + main + shrimp + sparkle(108, 36, 4, "#8af4ff") + sparkle(96, 22, 2.6, "#c8a8ff"), neck: [55, 78, 14], cap: [45, 56, 0.7], css: ring.css + ring2.css + prey.css, shadow: false };
}

// ---------- ringed caecilian (limbless, ringed, tiny eyes, a tentacle between eye and nostril) ----------
function caecilian(k, mood, sig) {
  const coil = "M24 104C16 118 52 120 76 112C104 102 108 84 92 78C76 72 54 98 34 90C18 83 26 68 46 66C56 65 62 62 62 54";
  const tube = ln(coil, "#14182c", 22.6) + ln(coil, k.c, 20) + ln(coil, k.b, 20, `stroke-dasharray="2.2 7.4" style="stroke-linecap:butt" opacity=".92"`) + ln("M32 107C46 112 62 110 74 105M94 74C84 72 72 80 62 85M32 71Q40 63 52 61", "#fff", 2.6, `opacity=".32"`);
  const head = p("M62 22C78 22 86 33 85 44C84 57 74 64 62 64C50 64 40 57 39 44C38 33 46 22 62 22Z", k.c, `stroke="#14182c" stroke-width="1.4"`) + el(55, 29, 9, 3.4, "#fff", `opacity=".25" transform="rotate(-18 55 29)"`)
    + feye(51, 41, mood, { r: 3.8, ring: "#aab4d8", lid: "#eef0ff" }) + feye(73, 41, mood, { r: 3.8, ring: "#aab4d8", lid: "#eef0ff" })
    + ln("M50 47Q44 48 44 53M74 47Q80 48 80 53", "#e8a8c0", 2.6) + dots([[44, 53.4], [80, 53.4]], 1.8, "#ffc4d8")
    + dots([[58, 48], [66, 48]], 1.1, "#0009") + ln(mood === "sad" ? "M55 58Q62 52 69 58" : "M53 53Q62 61 71 53", "#e8ecff", 1.9) + el(47, 50, 3.6, 2.2, "#ff7f9c", `opacity=".7"`) + el(77, 50, 3.6, 2.2, "#ff7f9c", `opacity=".7"`);
  const base = { neck: [62, 57, 17], cap: [62, 22, 0.78] };
  const lift = (svg) => `<g transform="translate(0 -5)">${svg}</g>`;
  if (!sig) return { ...base, body: wrap("bd-breathe", lift(tube + head)), css: "" };
  const a1 = anim("nibble-a", "0%,100%{transform:translate(0,0) rotate(0deg)}50%{transform:translate(3px,3px) rotate(14deg)}", 0.55, "box");
  const a2 = anim("nibble-b", "0%,100%{transform:translate(0,0) rotate(0deg)}50%{transform:translate(-3px,3px) rotate(-14deg)}", 0.68, "box");
  const baby = (d, hx, hy, ex) => ln(d, "#6a4a6a", 10.4) + ln(d, "#e8b8cc", 8.4) + ln(d, "#fff", 8.4, `stroke-dasharray="1.2 4.6" style="stroke-linecap:butt" opacity=".8"`) + dot(hx, hy, 6.4, "#f2c8d8", `stroke="#6a4a6a" stroke-width="1"`) + dots([[hx - 2.4 + ex, hy - 1.4], [hx + 2.4 + ex, hy - 1.4]], 1.2, INK) + ln(`M${hx - 2 + ex} ${hy + 2}q2 2 4 0`, "#8a2a48", 1.1);
  const babies = move(a1, baby("M5 70Q18 66 14 78Q13 84 21 86", 22, 86, 1)) + move(a2, baby("M117 100Q118 84 104 90Q99 93 97 88", 96, 87, -1)) + move(a1, baby("M44 119Q60 124 58 112Q57 106 61 104", 61, 103, 0));
  const flakes = dots([[28, 80], [34, 100], [88, 80], [72, 99], [16, 94], [108, 78]], 1.6, "#dce4ff");
  return { ...base, body: lift(tube + head + babies + flakes) + say(100, 35, "nom!", 11) + heart(22, 30, 1.1), css: a1.css + a2.css };
}

// ---------- assembly ----------
function rigFor(key, k, mood, sig) {
  if (FROG[key]) {
    const d = FROG[key](k);
    if (sig && FROGSIG[key]) {
      const s = FROGSIG[key](k, mood, d);
      return s.svg === undefined ? s : frogOut("", { cap: key.startsWith("pacman") ? [60, 39, 0.62] : perch(d), ...s, body: s.svg });
    }
    // Horned frogs wear it between their horns instead.
    const fit = key === "budgett" ? { neck: [60, 94, 33] } : key === "rainfrog" ? { neck: [60, 86, 33] } : key.startsWith("pacman") ? { neck: [60, 94, 33], cap: [60, 39, 0.62] } : {};
    return frogOut(frog(d, mood), { cap: perch(d), ...fit });
  }
  if (AXO[key]) {
    const d = AXO[key](k);
    if (sig && AXOSIG[key]) {
      const s = AXOSIG[key](k, mood, d);
      return s.svg === undefined ? s : axoOut("", { ...s, body: s.svg });
    }
    return axoOut(axo(d, mood));
  }
  if (SAL[key]) {
    const d = SAL[key](k);
    if (sig && SALSIG[key]) {
      const s = SALSIG[key](k, mood, d);
      return s.svg === undefined ? s : salOut("", { ...s, body: s.svg });
    }
    return salOut(sal(d, mood));
  }
  if (key === "crestednewt") return newt(k, mood, sig);
  if (key === "olm") return olm(k, mood, sig);
  if (key === "caecilian") return caecilian(k, mood, sig);
  return frogOut(frog({ c: k.c, belly: bellyOval(k.b) }, mood));
}

export default function art(o) {
  const key = String(o.id).replace(/^grotto_/, "");
  const k = { c: o.c, b: o.b, a: o.a };
  const r = rigFor(key, k, o.mood || "happy", o.act === "signature");
  return frame({ name: o.name, size: o.size, tier: o.tier, accent: o.a, stage: o.stage, body: r.body, neck: r.neck, cap: r.cap, css: r.css || "", shadow: r.shadow });
}
