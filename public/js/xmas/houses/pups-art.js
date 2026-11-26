// Puddle Paws Park art: thirty dogs on a front-sitting rig and a side-standing rig (plus special poses),
// each with breed-true ears, muzzle, coat, tail and proportions, and animated signature behaviours.
import { INK, el, dot, p, ln, dots, both, wrap, eye, frame } from "./artkit.js";

// ---------- helpers ----------
const n = (v) => Math.round(v * 10) / 10;
const dark = (c) => parseInt(c.slice(1, 3), 16) * 0.3 + parseInt(c.slice(3, 5), 16) * 0.59 + parseInt(c.slice(5, 7), 16) * 0.11 < 75;
const rim = (c) => `stroke="${dark(c) ? "#b9b4d6" : "#3a2410"}" stroke-opacity="${dark(c) ? 0.42 : 0.28}" stroke-width="1"`;
const fur = (d, c) => p(d, c, rim(c));
const at = (x, y, s, svg, r = 0) => `<g transform="translate(${x} ${y}) rotate(${r}) scale(${s}) translate(-60 -45)">${svg}</g>`;
const place = (x, y, s, svg, r = 0) => `<g transform="translate(${x} ${y}) rotate(${r}) scale(${s})">${svg}</g>`;
const shade = (d, col = "#000", o = 0.16) => p(d, col, `opacity="${o}"`);
const txt = (x, y, s, t, fill, cls = "") => `<text ${cls ? `class="${cls}" ` : ""}x="${x}" y="${y}" font-size="${s}" font-family="system-ui" font-weight="800" fill="${fill}" stroke="${INK}" stroke-width="2.6" paint-order="stroke">${t}</text>`;
const heart = (x, y, s = 1) => p(`M${x} ${y + 4 * s}l${-4.6 * s} ${-4.6 * s}a${2.7 * s} ${2.7 * s} 0 0 1 ${4.6 * s} ${-2.7 * s}a${2.7 * s} ${2.7 * s} 0 0 1 ${4.6 * s} ${2.7 * s}Z`, "#ff4f74", `stroke="#fff" stroke-width=".8"`);
const star = (x, y, r, col = "#fff6b0") => p(`M${x} ${y - r}Q${x + r * 0.2} ${y - r * 0.2} ${x + r} ${y}Q${x + r * 0.2} ${y + r * 0.2} ${x} ${y + r}Q${x - r * 0.2} ${y + r * 0.2} ${x - r} ${y}Q${x - r * 0.2} ${y - r * 0.2} ${x} ${y - r}Z`, col);
const drop = (x, y, s, ang = 0) => `<g transform="translate(${x} ${y}) rotate(${ang}) scale(${s})">${p("M0 -5Q4.5 1 3.4 3.4Q0 7 -3.4 3.4Q-4.5 1 0 -5Z", "#9fe4ff", `stroke="#2a7ab0" stroke-width=".8"`)}</g>`;
const note = (x, y, col) => `${el(x, y, 3.4, 2.6, col, `stroke="${INK}" stroke-width=".8"`)}${ln(`M${x + 3} ${y}v-11q5 1 5 6`, col, 1.8)}`;

/** Scalloped (fluffy) ellipse. */
function fluff(cx, cy, rx, ry, count, bump, fill, x = "") {
  let d = "";
  for (let i = 0; i <= count; i++) {
    const t = (i / count) * Math.PI * 2 - Math.PI / 2;
    const px = n(cx + rx * Math.cos(t)), py = n(cy + ry * Math.sin(t));
    if (!i) d = `M${px} ${py}`;
    else {
      const m = ((i - 0.5) / count) * Math.PI * 2 - Math.PI / 2;
      d += `Q${n(cx + (rx + bump * 2) * Math.cos(m))} ${n(cy + (ry + bump * 2) * Math.sin(m))} ${px} ${py}`;
    }
  }
  return p(`${d}Z`, fill, x || rim(fill));
}

const nose = (x, y, rx = 5, ry = 3.6, c = "#17131a") => p(`M${x - rx} ${y - ry * 0.35}Q${x - rx * 0.9} ${y - ry} ${x} ${y - ry}Q${x + rx * 0.9} ${y - ry} ${x + rx} ${y - ry * 0.35}Q${x + rx * 0.7} ${y + ry * 0.85} ${x} ${y + ry}Q${x - rx * 0.7} ${y + ry * 0.85} ${x - rx} ${y - ry * 0.35}Z`, c, `stroke="#ffffff55" stroke-width=".6"`) + el(x - rx * 0.28, y - ry * 0.5, rx * 0.36, ry * 0.2, "#fff", `opacity=".65"`);

const tongueShape = (x, y, col = "#ff7e93", edge = "#bd4764") => p(`M${x - 4.4} ${y}Q${x - 5.4} ${y + 8.5} ${x} ${y + 8.5}Q${x + 5.4} ${y + 8.5} ${x + 4.4} ${y}Z`, col, `stroke="${edge}" stroke-width=".9"`) + ln(`M${x} ${y + 1}v4.4`, edge, 0.8);

function mouth(x, y, mood, o = {}) {
  const col = o.col || INK, w = o.w || 6;
  if (mood === "sad") return ln(`M${x} ${y}v2M${x - w * 0.8} ${y + 6}Q${x} ${y + 0.5} ${x + w * 0.8} ${y + 6}`, col, 1.5);
  const out = mood === "love" || (mood === "happy" && o.tongue);
  return `${out ? tongueShape(x, y + 4, o.tcol, o.tedge) : ""}${ln(`M${x} ${y}v2.6M${x - w} ${y + 2}Q${x - w * 0.5} ${y + 6.6} ${x} ${y + 2.8}Q${x + w * 0.5} ${y + 6.6} ${x + w} ${y + 2}`, col, 1.5)}`;
}
/** Wide-open laughing mouth for howls, screams and big smiles. */
const openMouth = (x, y, w, h) => p(`M${x - w} ${y}Q${x} ${y + 3} ${x + w} ${y}Q${x + w * 0.8} ${y + h} ${x} ${y + h}Q${x - w * 0.8} ${y + h} ${x - w} ${y}Z`, "#5c1428", `stroke="${INK}" stroke-width="1.4"`) + el(x, y + h - h * 0.28, w * 0.58, h * 0.24, "#ff7e93");
const happyShut = (x, y, col = INK) => ln(`M${x - 5} ${y + 2}Q${x} ${y - 5.5} ${x + 5} ${y + 2}`, col, 2.6);

/** Front-facing head centred on (60, 45). h describes one dog; o overrides eyes and mouth. */
function fhead(h, mood, o = {}) {
  const ex = h.ex ?? 48, ey = h.ey ?? 43.5, eo = h.eyes || {};
  const eyes = o.eyes ?? (eye(ex, ey, mood, eo) + eye(120 - ex, ey, mood, h.eyes2 || eo));
  const bl = h.blush === false ? "" : both(el(h.bx ?? 40, h.by ?? 52, 4, 2.4, "#ff6f8c", `opacity=".42"`));
  return `${h.back || ""}${h.skull}${h.marks || ""}${h.muz || ""}${bl}${eyes}${h.brow || ""}${h.nose}${o.mouth ?? mouth(60, h.my, mood, h.mouth)}${h.front || ""}`;
}

// ---------- front sitting rig ----------
const toes = (x, y, col) => ln(`M${x - 2.6} ${y}v3.4M${x + 2.6} ${y}v3.4`, col, 1);
const toeCol = (c) => (dark(c) ? "#8a86a0" : "#00000055");
function sit(B) {
  const c = B.fur, leg = B.leg || c, paw = B.paw || leg, w = B.w || 0, lw = B.lw || 12, hp = B.hpaw || paw;
  const haunch = both(el(38 - w, 102, 13 + w * 0.4, 14, B.haunch || c, rim(B.haunch || c)) + el(32 - w, 115, 10, 4.6, hp, rim(hp)) + toes(28 - w * 0.9, 115, toeCol(hp)));
  const torso = B.torso || fur(`M${43 - w} 66Q60 58 ${77 + w} 66Q${90 + w} 84 ${84 + w} 108Q72 119 60 117Q48 119 ${36 - w} 108Q${30 - w} 84 ${43 - w} 66Z`, c);
  const x = 50 - w * 0.2, h = lw / 2;
  const legs = B.legs ?? both(fur(`M${x - h} 88Q${x - h - 1} 104 ${x - h} 113L${x + h} 113Q${x + h + 0.5} 100 ${x + h} 88Q${x} 84 ${x - h} 88Z`, leg) + (B.legMarks || "") + el(x, 114.5, h + 1.8, 4.8, paw, rim(paw)) + toes(x, 115, toeCol(paw)));
  return `${B.tail || ""}${B.behind || ""}${haunch}${B.haunchMarks || ""}${torso}${B.chest || ""}${legs}${B.over || ""}`;
}
const front = (h, B, mood, extra = {}) => ({
  body: sit(B) + wrap("bd-bob", fhead(h, mood)),
  neck: [60, extra.ny ?? 70, extra.nw ?? 19],
  cap: [60, h.top + 5, extra.k ?? 1],
  wrapClass: "bd-breathe",
});

// ---------- side standing rig (faces right) ----------
function legPath(x, y, fx, w, col, pawCol, hind, gy = 115, part = "all") {
  const h = gy - y;
  const d = hind
    ? `M${x} ${y}C${n(x + 2)} ${n(y + h * 0.3)} ${n(fx - h * 0.2)} ${n(y + h * 0.42)} ${n(fx - h * 0.13)} ${n(y + h * 0.68)}L${fx} ${gy}`
    : `M${x} ${y}Q${x + 1.5} ${n((y + gy) / 2)} ${fx} ${gy}`;
  const under = ln(d, dark(col) ? "#6d6888" : "#7a5c40", w + 1.6, `opacity=".55"`);
  if (part === "under") return under;
  return (part === "all" ? under : "") + ln(d, col, w) + el(fx + w * 0.22, gy + 1, w * 0.7 + 0.6, w * 0.34 + 1.4, pawCol, rim(pawCol));
}
const bodyD = (S) => {
  const { x0, x1, top, bot } = S, t = S.tuck || 0, mid = n((top + bot) / 2);
  return `M${x0 + 10} ${top}C${x0 + 24} ${top - 1} ${x1 - 24} ${top + 3} ${x1 - 12} ${top - 2}Q${x1 + 2} ${top} ${x1} ${mid}Q${x1 - 1} ${bot + 1} ${x1 - 15} ${bot}C${x1 - 28} ${bot} ${x0 + 28} ${bot - t} ${x0 + 17} ${bot - t}Q${x0 - 2} ${bot - t + 1} ${x0} ${n(mid - t / 2)}Q${x0 + 1} ${top + 1} ${x0 + 10} ${top}Z`;
};
function stand(S) {
  const { x0, x1, top, bot } = S, c = S.fur, lw = S.lw || 7, near = S.leg || c, far = S.far || near, paw = S.paw || near, ly = bot - (S.up ?? 8);
  const L = S.legs || [[x0 + 19, ly - (S.tuck || 0) * 0.6, x0 + 20, 1, 1], [x1 - 17, ly, x1 - 17, 0, 1], [x0 + 10, ly - (S.tuck || 0) * 0.8, x0 + 7, 1, 0], [x1 - 7, ly, x1 - 5, 0, 0]];
  const draw = (isFar, part) => L.filter((l) => !!l[4] === isFar).map(([x, y, fx, hind]) => legPath(x, y, fx, lw, isFar ? far : near, paw, hind, 115, part) + (isFar ? el(fx + 1, 116, lw * 0.7, lw * 0.34 + 1.2, "#000", `opacity=".2"`) : "")).join("");
  // The haunch blends into the body: no full outline, only the crease along its front edge.
  const cx = x0 + 13, cy = n((top + bot) / 2 - (S.tuck || 0) * 0.35 + 2), rx = n((bot - top) * 0.4), ry = n((bot - top) * 0.5);
  const thigh = el(cx, cy, rx, ry, S.thigh || c) + ln(`M${n(cx + rx * 0.35)} ${n(cy - ry * 0.75)}Q${n(cx + rx * 1.25)} ${cy} ${n(cx + rx * 0.3)} ${n(cy + ry * 0.92)}`, dark(c) ? "#8d88a8" : "#6a4a30", 1.1, `opacity=".5"`);
  return `${S.tail || ""}${draw(true, "all")}${draw(false, "under")}${S.neckSvg || ""}${fur(bodyD(S), c)}${S.marks || ""}${draw(false, "fill")}${thigh}${S.thighMarks || ""}${S.chest || ""}`;
}

// ---------- profile head (faces right, origin at skull centre) ----------
function phead(h, mood, o = {}) {
  const c = h.fur, L = h.len || 24, mt = h.mt ?? -5, mb = h.mb ?? 9, r = h.r || 14;
  const muzC = h.muz || c;
  const muz = fur(`M3 ${mt}Q${L * 0.55} ${mt + 1} ${L - 5} ${mt + 2.5}Q${L + 1.5} ${mt + 3.5} ${L} ${mt + 8}Q${L - 1} ${mb - 1} ${L - 8} ${mb}Q${L * 0.35} ${mb + 1} 0 ${mb + 4}Z`, muzC);
  let m;
  if (o.open) m = p(`M${L - 4} ${mb - 4}Q${L * 0.55} ${mb - 1} 7 ${mb - 3}Q${L * 0.45} ${mb + 14} ${L - 6} ${mb + 7}Q${L - 1} ${mb + 1} ${L - 4} ${mb - 4}Z`, "#5c1428", `stroke="${INK}" stroke-width="1.3"`) + el(L * 0.55, mb + 4, L * 0.2, 2.6, "#ff7e93") + ln(`M10 ${mb + 1}Q${L * 0.5} ${mb + 14} ${L - 6} ${mb + 8}`, muzC, 3.4);
  else {
    const lick = mood === "love" || (mood === "happy" && h.tongue) ? p(`M${L * 0.5} ${mb - 3}q1 11 6 10q5 -1 3 -11Z`, "#ff7e93", `stroke="#bd4764" stroke-width=".8"`) : "";
    m = lick + ln(mood === "sad" ? `M${L - 4} ${mb - 1}Q${L * 0.55} ${mb - 5} 9 ${mb - 0.5}` : `M${L - 4} ${mb - 3}Q${L * 0.55} ${mb - 1} 8 ${mb - 5}`, h.lip || INK, 1.4);
  }
  return `${h.back || ""}${el(0, 0, r, r - 0.5, c, rim(c))}${muz}${h.marks || ""}${m}${o.eyes ?? eye(h.ex ?? 4, h.ey ?? -4, mood, h.eyes || { r: 3.9 })}${h.brow || ""}${nose(L - 0.5, mt + 5.5, h.nr || 3.8, (h.nr || 3.8) * 0.85, h.noseCol)}${h.front || ""}${h.blush === false ? "" : el(0, 5, 3.4, 2.2, "#ff6f8c", `opacity=".42"`)}`;
}

// ---------- tails ----------
const stroke = (d, c, w) => ln(d, dark(c) ? "#6d6888" : "#7a5c40", w + 1.8, `opacity=".55"`) + ln(d, c, w);
const curl = (c, u) => stroke("M78 108C102 108 114 90 106 76C99 64 80 68 82 79C83 87 93 87 95 81", c, 12) + ln("M86 106C101 101 108 90 104 81", u, 3.6, `opacity=".9"`);

// ---------- dogs ----------
// Each takes the palette k, mood m and signature flag s, and returns what frame() needs.
const D = {};

// --- Shiba Inu: fox face, small thick triangle ears, urajiro cream, curled tail ---
function shibaHead(k, sesame, flat) {
  const ears = flat
    ? both(fur("M40 32Q20 20 8 31Q18 47 38 45Z", k.c) + p("M35 35Q22 28 15 33Q22 41 34 41Z", k.b) + (sesame ? p("M8 31Q12 26 19 26L14 36Z", k.a) : ""))
    : both(fur("M33 37Q28 19 35 11Q48 15 55 25Z", k.c) + p("M37 31Q35 21 38 17Q45 21 49 26Z", k.b) + (sesame ? p("M30.5 18Q32 13 35 11Q41 13 45 16Q37 15 30.5 18Z", k.a) : ""));
  const cap = sesame ? p("M33.5 42C33 28 44 20.5 60 20.5C76 20.5 87 28 86.5 42Q79 31 70 31.5Q63 33 60 43Q57 33 50 31.5Q41 31 33.5 42Z", k.a, `opacity=".88"`) + dots([[39, 47], [35, 44], [81, 47], [86, 44], [44, 30], [75, 29], [52, 24], [68, 24], [60, 27], [33, 50], [87, 50]], 1, k.a) + dots([[42, 26], [55, 27], [66, 28], [78, 27], [60, 23], [47, 25]], 0.7, k.b) : "";
  return {
    top: 19, back: ears, my: 55.5, ex: 47,
    skull: fur("M60 20C77 20 87 30 87 43L94 55Q86 56 83 62Q74 71 60 71Q46 71 37 62Q34 56 26 55L33 43C33 30 43 20 60 20Z", k.c),
    marks: cap + p("M29.5 55Q37 49 45 50.5Q52 51 55 46Q57.5 43 60 43Q62.5 43 65 46Q68 51 75 50.5Q83 49 90.5 55Q84 57 82 61.5Q73 70 60 70Q47 70 38 61.5Q36 57 29.5 55Z", k.b) + both(el(47.5, 35, 4.2, 2.5, k.b, `transform="rotate(-12 47.5 35)"`)),
    eyes: { r: 4, rim: 0.8 }, nose: nose(60, 52.5, 4.8, 3.4),
  };
}
function shiba(k, m, s, sesame) {
  const speck = sesame ? dots([[34, 94], [30, 102], [40, 98], [86, 94], [90, 102], [80, 98], [43, 74], [77, 74], [39, 82], [81, 82], [35, 108], [85, 108]], 1.3, k.a) + dots([[37, 90], [83, 90], [41, 105], [79, 105]], 0.8, k.b) : "";
  const body = { fur: k.c, paw: k.b, tail: wrap(s ? "bd-s-pups-stiff" : "bd-wag", curl(k.c, k.b) + (sesame ? ln("M84 105C103 104 113 91 107 79", k.a, 4, `opacity=".8"`) : "")), chest: p("M47 66Q60 76 73 66Q79 86 69 100Q60 107 51 100Q41 86 47 66Z", k.b), over: speck };
  if (!s) return front(shibaHead(k, sesame), body, m);
  const h = shibaHead(k, sesame, true);
  const squeeze = both(ln("M42 39l9 4.5l-9 4.5", INK, 2.6));
  return {
    body: sit(body) + wrap("bd-s-pups-scream", fhead(h, m, { eyes: squeeze, mouth: openMouth(60, 56, 10, 15) + p("M54 57.5l2.4 3.6l2 -3.2ZM66 57.5l-2.4 3.6l-2 -3.2Z", "#fff") + both(drop(37, 38, 1, 40)) })),
    top: wrap("bd-s-pups-alarm", ln("M20 54l-12 -3M21 64l-13 4M100 54l12 -3M99 64l13 4", "#fff2a0", 3)) + txt(74, 14, 13, "AIEE!", "#ffe14d", "bd-s-pups-pop"),
    neck: [60, 72, 19], cap: [47, 25, 0.9], css: CSS.scream,
  };
}
D.shiba = (k, m, s) => shiba(k, m, s, false);
D.shibasesame = (k, m) => shiba(k, m, false, true);

// --- Beagle: tricolour, very long rounded ears, white blaze and flag tail ---
D.beagle = (k, m, s) => {
  const ear = "#93501f";
  if (s) {
    const head = {
      fur: k.c, muz: k.b, len: 23, r: 15, nr: 4.8, mb: 10,
      marks: p("M0 -14Q8 -13 9 -6Q10 -2 20 -2L15 4Q4 2 0 -14Z", k.b),
      front: wrap("bd-s-pups-earsway", fur("M-6 -11Q-19 -6 -18 11Q-18 27 -8 26Q1 24 1 10Q2 -3 3 -9Q-1 -14 -6 -11Z", ear)),
      eyes: { r: 3.8, iris: "#5a2e14" },
    };
    const body = stand({ x0: 12, x1: 70, top: 70, bot: 95, fur: k.c, leg: k.b, far: "#d8cfc0", lw: 8,
      tail: wrap("bd-s-pups-flagsniff", stroke("M17 75Q5 62 11 40", k.a, 7) + ln("M9.5 51Q9 45 11 40", k.b, 6.4)),
      neckSvg: fur("M52 70Q72 70 84 86L74 104Q62 96 56 88Z", k.c),
      marks: p("M18 72Q34 66 56 71Q62 82 52 87Q36 90 24 84Q16 78 18 72Z", k.a) + p("M70 86Q70 96 55 95Q46 94 40 93Q56 90 62 82Z", k.b),
    });
    return {
      body: body + wrap("bd-s-pups-sniff", place(80, 91, 1, phead(head, m), 28)),
      top: wrap("bd-s-pups-scent", ln("M106 106q7 -5 1 -10q-6 -5 2 -11M113 113q6 -4 3 -9", "#fff6a8", 2.2, `stroke-dasharray="5 3"`)) + dots([[103, 119], [111, 119]], 2, "#6b4423") + dots([[100, 116.5], [103, 115], [106, 116.5]], 0.8, "#6b4423"),
      neck: [64, 79, 10], cap: [78, 79, 0.65], css: CSS.sniff,
    };
  }
  const h = {
    top: 20, my: 56, ey: 43,
    skull: fur("M60 20C76 20 85 31 85 45C85 60 74 71 60 71C46 71 35 60 35 45C35 31 44 20 60 20Z", k.c),
    marks: p("M57.5 21Q60 20.3 62.5 21Q63 36 68 45Q78 51 76 61Q70 70.5 60 70.5Q50 70.5 44 61Q42 51 52 45Q57 36 57.5 21Z", k.b),
    muz: el(60, 58, 13, 10, k.b), nose: nose(60, 52.5, 6.2, 4.4), eyes: { r: 4.8, iris: "#5a2e14" }, mouth: { tongue: true },
    front: both(wrap("bd-flop", fur("M41 26Q22 26 19 48Q15 72 26 78Q38 81 40 66Q42 50 40 41Q43 33 47 29Q45 26 41 26Z", ear))),
  };
  return front(h, {
    fur: k.c, leg: k.b, haunch: k.c,
    tail: wrap("bd-wag", stroke("M80 102Q102 94 101 66", k.a, 8) + ln("M102 78Q102.5 71 101 66", k.b, 7.4)),
    chest: both(p("M44 66Q31 76 33 95Q45 90 50 72Z", k.a)) + p("M47 66Q60 74 73 66Q80 88 71 106Q60 113 49 106Q40 88 47 66Z", k.b),
  }, m);
};

// --- Labrador: broad head, pendant ears, thick otter tail ---
function labHead(k) {
  return {
    top: 19, my: 56.5, ey: 42,
    skull: fur("M60 19C79 19 87 30 86 43C86 52 85 58 80 63Q72 71 60 71Q48 71 40 63C35 58 34 52 34 43C33 30 41 19 60 19Z", k.c),
    marks: el(60, 30, 13, 7, "#fff", `opacity=".16"`),
    muz: fur("M45 55Q46 46 60 46Q74 46 75 55Q75 69 60 69Q45 69 45 55Z", k.b),
    nose: nose(60, 51.5, 7.4, 5), eyes: { r: 4.6, iris: "#4a2810" }, mouth: { tongue: true, w: 7 },
    front: both(fur("M42 24Q24 21 21 39Q19 54 27 58Q35 56 37 45Q39 33 49 27Q46 24 42 24Z", k.a)),
  };
}
D.labyellow = (k, m, s) => {
  const h = labHead(k);
  if (!s) return front(h, { fur: k.c, w: 3, lw: 13, tail: wrap("bd-wag", fur("M78 101Q100 103 114 89Q121 87 118 97Q110 117 80 116Z", k.c)), chest: p("M49 68Q60 76 71 68Q74 86 60 94Q46 86 49 68Z", k.b, `opacity=".75"`) }, m);
  const ball = dot(60, 64, 10, "#d6f23c", `stroke="#6d8a10" stroke-width="1.4"`) + ln("M52 58q8 5 5.5 15.5M68 57q-6 7 -1 15", "#fff", 1.8);
  const body = stand({ x0: 14, x1: 72, top: 66, bot: 90, fur: k.c, far: k.a, paw: k.b, lw: 9,
    legs: [[32, 82, 24, 1, 1], [62, 82, 86, 0, 1], [23, 80, 8, 1, 0], [68, 80, 96, 0, 0]].map((l) => l),
    tail: wrap("bd-s-pups-flagfetch", fur("M19 70Q4 66 3 50Q9 46 13 55Q19 63 30 66Z", k.c)),
    neckSvg: fur("M56 66Q70 48 86 56L80 78Z", k.c),
  }).replace(/115(?=" stroke)/g, "115");
  return {
    body: `<g transform="translate(0 -14) rotate(-9 52 92)">${body}${at(82, 49, 0.8, fhead(h, m, { eyes: happyShut(48, 42) + happyShut(72, 42), mouth: ball }))}</g>`,
    top: ln("M4 78h13M2 88h10M10 99h14", "#fff", 2.4, `opacity=".85"`),
    neck: [74, 56, 11], cap: [79, 24, 0.75], css: CSS.fetch,
  };
};

// --- Golden Retriever: feathered ears, chest ruff and plume tail ---
D.golden = (k, m, s) => {
  const ears = s
    ? both(wrap("bd-s-pups-earflap", fur("M42 27Q22 16 7 25Q10 30 7 33Q14 34 12 41Q20 39 22 45Q29 40 32 43Q38 40 44 35Z", k.a)))
    : both(fur("M42 26Q24 24 21 41Q15 45 20 50Q16 56 23 58Q22 66 29 63Q35 66 36 58Q42 53 38 46Q41 34 49 28Q46 25 42 26Z", k.a) + ln("M27 40q-3 9 0 17M32 41q-2 8 1 15", "#fff", 0.9, `opacity=".4"`));
  const h = {
    top: 20, my: 56, ey: 43, back: "",
    skull: fur("M60 20C77 20 86 31 86 44Q90 52 84 56Q84 64 76 64Q70 71 60 71Q50 71 44 64Q36 64 36 56Q30 52 34 44C34 31 43 20 60 20Z", k.c),
    marks: el(60, 31, 12, 7, "#fff", `opacity=".16"`),
    muz: fur("M47 55Q48 46 60 46Q72 46 73 55Q72 68 60 68Q48 68 47 55Z", k.b),
    nose: nose(60, 52, 5.8, 4), eyes: { r: 4.6, iris: "#4f2a0e" }, mouth: { tongue: true }, front: ears,
  };
  const plume = fur("M78 106Q104 104 108 72Q117 78 113 85Q120 90 113 95Q118 102 108 104Q111 112 100 112Q96 120 80 115Z", k.c) + ln("M92 108q14 -8 17 -26M96 111q12 -5 17 -17", k.b, 1.8);
  const body = { fur: k.c, w: 2, tail: wrap(s ? "bd-s-pups-flagshake" : "bd-wag", plume), chest: fluff(60, 81, 15, 17, 14, 2.6, k.b, `opacity=".95"`) };
  if (!s) return front(h, body, m);
  const spikes = fur("M40 72L26 68L36 78L21 83L35 87L22 96L38 97ZM80 72L94 68L84 78L99 83L85 87L98 96L82 97ZM47 24L45 11L55 20L61 9L65 20L77 13L73 26Z", k.c);
  const drops = [[8, 54, -70], [6, 82, -95], [16, 104, -120], [112, 54, 70], [114, 82, 95], [104, 104, 120], [18, 14, -40], [102, 14, 40], [60, 4, 0], [36, 7, -20], [88, 6, 22]].map(([x, y, r]) => drop(x, y, 1.15, r + 180)).join("");
  return {
    body: wrap("bd-s-pups-shake", spikes + sit(body) + wrap("bd-s-pups-shakehead", fhead(h, m, { eyes: both(ln("M43 40l9 3.5l-9 3.5", INK, 2.4)) }))),
    top: wrap("bd-s-pups-drops", drops) + el(60, 119, 48, 5, "#8fdcff", `opacity=".5"`),
    neck: [60, 70, 19], cap: [60, 25, 1], css: CSS.shake,
  };
};

// --- Pembroke Welsh Corgi: huge upright ears, short legs, long body, stub tail ---
function corgiHead(k) {
  return {
    top: 21, my: 55.5, ex: 47,
    back: both(fur("M36 42Q18 14 25 2Q45 5 57 25Z", k.c) + p("M37 32Q27 16 29 9Q42 12 50 25Z", "#f7c3ae")),
    skull: fur("M60 21C76 21 86 31 86 43L91 55Q82 58 79 64Q70 71 60 71Q50 71 41 64Q38 58 29 55L34 43C34 31 44 21 60 21Z", k.c),
    marks: p("M58 22Q60 21.4 62 22L64 38Q76 46 83 55Q80 62 76 64Q69 70.5 60 70.5Q51 70.5 44 64Q40 62 37 55Q44 46 56 38Z", k.b),
    nose: nose(60, 52, 5, 3.6), eyes: { r: 4.3, rim: 0.9 }, mouth: { tongue: true },
  };
}
D.corgi = (k, m, s) => {
  const h = corgiHead(k);
  if (s) {
    const sole = (x, y) => el(x, y, 7.6, 6.4, k.b, rim(k.b)) + el(x, y + 1.6, 3.2, 2.6, "#f28ca4") + dots([[x - 4.2, y - 1.6], [x - 1.5, y - 3.6], [x + 1.7, y - 3.6], [x + 4.3, y - 1.6]], 1.3, "#f28ca4");
    const hind = both(wrap("bd-s-pups-kick", fur("M38 88Q16 86 7 99Q1 112 13 117Q30 118 44 108Z", k.c) + sole(13, 108)));
    return {
      body: el(60, 114, 57, 9, "#8fd6e8", `opacity=".8"`) + hind + fur("M25 103Q24 76 60 74Q96 76 95 103Q90 116 60 116Q30 116 25 103Z", k.c) + p("M38 96Q60 84 82 96Q84 114 60 114Q36 114 38 96Z", k.b)
        + wrap("bd-s-pups-loaf", at(60, 64, 0.9, fhead(h, m, { eyes: happyShut(47, 43) + happyShut(73, 43) })))
        + both(fur("M39 100Q38 112 40 116Q47 121 54 116Q56 110 53 100Z", k.b) + toes(47, 114, "#00000055")),
      top: wrap("bd-s-pups-pop", heart(104, 48, 1.2) + heart(16, 60, 0.9)),
      neck: [60, 87, 17], cap: [60, 48, 0.9], css: CSS.sploot, shadow: false,
    };
  }
  const body = stand({ x0: 8, x1: 88, top: 76, bot: 104, fur: k.c, leg: k.b, far: "#e2d2c0", lw: 10, up: 9,
    tail: wrap("bd-wag", el(10, 83, 6, 5, k.c, rim(k.c))),
    marks: p("M87 84Q89 104 72 104Q52 104 34 103Q56 96 66 84Q76 78 87 84Z", k.b),
    thigh: k.c, thighMarks: p("M8.6 87Q17 89 18 97Q18 103 15 104Q9 102 8.6 94Z", k.b) + p("M54 77Q64 82 66 94Q72 82 70 76Z", k.b),
  });
  return { body: body + wrap("bd-bob", at(82, 56, 0.82, fhead(h, m))), neck: [80, 77, 15], cap: [82, 40, 0.82], wrapClass: "bd-breathe" };
};

// --- Dachshunds: long low body, very short legs, long muzzle, drop ears; four coats ---
function dachHead(k, coat) {
  const long = coat === "long" || coat === "dapple";
  const earC = coat === "smooth" ? "#1a1518" : coat === "wire" ? k.a : coat === "dapple" ? k.c : "#8e3c14";
  const ear = long
    ? fur("M-5 -12Q-19 -8 -18 6Q-23 12 -18 15Q-21 22 -14 23Q-14 30 -8 26Q-2 30 -1 22Q5 18 2 10Q5 0 3 -9Q-1 -14 -5 -12Z", earC) + ln("M-12 0q-3 12 -1 21M-6 1q-2 12 0 22", coat === "dapple" ? k.a : k.b, 1.1, `opacity=".75"`)
    : fur("M-5 -12Q-18 -7 -17 10Q-17 23 -8 23Q1 21 1 9Q3 -2 3 -9Q-1 -14 -5 -12Z", earC);
  let marks = "", brow = "", front = ear;
  if (coat === "smooth") marks = p("M5 5Q14 3 24 1Q24 8 17 9Q8 11 0 13Q-2 8 5 5Z", k.b) + el(7, -9, 3, 2, k.b, `transform="rotate(14 7 -9)"`);
  if (coat === "wire") {
    marks = p("M24 2L27 9L23 8L24 15L19 12L18 19L13 13L9 17L7 11L1 14L4 6Q14 4 24 2Z", k.b) + ln("M-8 -9l-3 -5M-3 -12l-1 -5M3 -12l2 -4M-11 -2l-5 -2", k.a, 1.6);
    brow = p("M1 -11Q7 -17 15 -14L12 -12.4L16 -10L10 -10.4L11 -8L6 -9.8Z", k.b, `stroke="#6a4a2a" stroke-width=".7"`);
  }
  if (coat === "long") marks = el(11, 5, 9, 4, k.b, `opacity=".75"`);
  if (coat === "dapple") {
    marks = p("M5 5Q14 3 24 1Q24 8 17 9Q8 11 0 13Q-2 8 5 5Z", k.b) + el(7, -9, 3, 2, k.b) + p("M-12 -6q6 -9 12 -5q-2 4 -6 4q-1 5 -6 1Z", k.a) + p("M10 -4q6 -1 7 3q-5 3 -8 0Z", k.a);
    front = ear + p("M-15 6q4 -4 7 0q-1 4 -5 3Z", k.a) + p("M-9 15q5 -2 6 3q-4 3 -7 1Z", k.a);
  }
  return { fur: k.c, len: 28, r: 15, mt: -5, mb: 9, marks, brow, front, ex: 6.4, ey: -4, eyes: { r: 3.8, iris: coat === "dapple" ? "#c88a2a" : "#4a220e", rim: 1 }, nr: 3.8, noseCol: coat === "dapple" ? "#4a2a1e" : undefined, lip: coat === "smooth" ? "#3a1c10" : INK };
}
function dachBody(k, coat) {
  const long = coat === "long" || coat === "dapple";
  const c = k.c;
  const S = { x0: 9, x1: 82, top: 83, bot: 105, tuck: 2, fur: c, lw: 9, up: 7, leg: coat === "smooth" || coat === "dapple" ? k.b : coat === "wire" ? k.b : k.c, far: coat === "long" ? "#8a3a14" : "#9a6a40", paw: coat === "long" ? k.b : k.b };
  S.neckSvg = fur("M62 86Q68 68 80 62L94 74Q88 90 80 96Z", c);
  S.tail = wrap("bd-wag", long
    ? fur("M14 88Q0 84 1 66Q5 72 8 70Q7 78 12 77Q12 83 20 85Z", c) + fur("M12 90Q1 92 2 80Q5 86 8 82Q9 88 18 86Z", coat === "dapple" ? k.a : k.b)
    : stroke("M14 89Q3 85 3 68", c, 5));
  S.chest = "";
  if (coat === "smooth") { S.marks = p("M81 90Q82 104 68 105Q74 98 74 90Q78 86 81 90Z", k.b) + ln("M18 88Q40 84 64 88", "#fff", 2, `opacity=".22"`); }
  if (long) S.chest = p("M24 103l4 6l3 -4l4 7l4 -5l5 7l4 -6l5 6l4 -6l5 6l3 -6l5 4l4 -9Q54 100 24 103Z", coat === "dapple" ? k.b : k.b) + p("M76 82q8 8 4 20l-3 -5l-2 6l-3 -8Z", k.b);
  if (coat === "long") S.marks = ln("M22 90q14 -5 30 -1M30 96q12 -3 24 0", k.b, 1.4, `opacity=".8"`);
  if (coat === "wire") {
    S.marks = ln("M22 88l-4 4M31 86l-3 5M40 86l-2 5M49 87l-3 5M58 86l-2 5M66 86l-2 4M26 96l-3 4M36 95l-3 5M46 96l-2 4M56 95l-3 4M66 96l-2 3", k.a, 1.5) + ln("M27 90l-2 3M45 92l-2 3M62 91l-2 3M52 99l-2 3", k.b, 1.2);
    S.chest = p("M80 88l3 5l-4 1l3 6l-5 0l1 5l-6 -4Q76 96 80 88Z", k.b) + ln("M14 84l5 -5M24 83l4 -5M36 83l3 -5M50 85l3 -5", k.a, 1.6);
  }
  if (coat === "dapple") S.marks = p("M20 86q10 -5 14 2q-4 3 -2 7q-9 2 -13 -2Z", k.a) + p("M44 84q9 0 12 6q-6 0 -7 5q-7 -2 -5 -11Z", k.a) + p("M62 94q8 -4 11 2q-5 6 -11 -2Z", k.a) + dots([[39, 98], [57, 100], [68, 87], [28, 100]], 2.2, k.a);
  return stand(S);
}
function dach(coat, k, m, s) {
  const head = dachHead(k, coat);
  if (!s) return { body: dachBody(k, coat) + wrap("bd-bob", place(84, 67, 1, phead(head, m))), neck: [77, 79, 10], cap: [82, 56, 0.72], wrapClass: "bd-breathe" };
  const c = k.c;
  const paw = (cls, x, fx, y) => wrap(cls, legPath(x, y, fx, 9, k.b, k.b, false, 112));
  const body = stand({ x0: 6, x1: 72, top: 76, bot: 99, fur: c, lw: 9, leg: k.b, far: "#9a6a40", legs: [[24, 92, 26, 1, 1], [15, 90, 12, 1, 0]],
    tail: wrap("bd-s-pups-flagdig", stroke("M11 82Q2 70 8 52", c, 5)), marks: p("M71 84Q72 98 58 99Q64 92 64 84Q68 80 71 84Z", k.b),
  });
  const clod = (x, y, r) => p(`M${x - r} ${y}l${r * 0.7} ${-r}l${r} ${r * 0.3}l${r * 0.3} ${r}l${-r * 1.2} ${r * 0.4}Z`, "#7a4c28", `stroke="#42260f" stroke-width=".8"`);
  return {
    body: el(93, 116, 25, 6, "#4a2c16") + `<g transform="rotate(7 20 100)">${body}${fur("M54 80Q70 72 80 80L82 96Q70 100 62 94Z", c)}</g>` + paw("bd-s-pups-dig1", 62, 86, 96) + paw("bd-s-pups-dig2", 70, 98, 96) + wrap("bd-s-pups-nod", place(80, 86, 0.95, phead(head, m), 22)),
    top: p("M78 119Q86 106 96 114Q108 104 120 119Z", "#8a5a30", `stroke="#4a2c16" stroke-width="1.2"`) + wrap("bd-s-pups-dirt", clod(46, 54, 5) + clod(28, 62, 4) + clod(60, 62, 3.4) + clod(14, 44, 3) + clod(34, 42, 2.6) + ln("M66 68Q48 46 20 54", "#8a5a30", 1.6, `stroke-dasharray="3 5"`)),
    neck: [68, 82, 10], cap: [78, 76, 0.65], css: CSS.dig,
  };
}
D.dachsmooth = (k, m, s) => dach("smooth", k, m, s);
D.dachlong = (k, m) => dach("long", k, m, false);
D.dachwire = (k, m) => dach("wire", k, m, false);
D.dachdapple = (k, m) => dach("dapple", k, m, false);

// --- Border Collie: white blaze and ruff, semi-erect ears with tipped-over points ---
D.bordercollie = (k, m, s) => {
  if (s) {
    const head = {
      fur: k.c, len: 23, r: 14, muz: k.b,
      marks: p("M-1 -13.5Q6 -14 5 -9Q9 -4 20 -3L14 2Q2 -2 -1 -13.5Z", k.b),
      back: fur("M-2 -10Q-2 -25 6 -27Q14 -22 10 -9Z", k.a),
      front: fur("M-12 -7Q-17 -22 -10 -27Q0 -21 0 -11Z", k.c) + p("M-10 -27Q-3 -27 0 -19Q-7 -21 -10 -27Z", k.a),
      eyes: { r: 4.4, iris: "#e8a02a", rim: 1 }, brow: ln("M-2 -9L10 -8", "#b9b4d6", 2), blush: false,
    };
    const body = p("M10 103Q8 84 26 84Q44 96 66 92Q76 94 72 104Q66 113 44 112Q24 118 10 103Z", k.c, rim(k.c));
    return {
      body: wrap("bd-s-pups-creep", stroke("M13 98Q2 106 3 117", k.c, 7) + ln("M3 111v6", k.b, 6) + legPath(38, 104, 46, 8, k.a, k.b, true) + legPath(58, 104, 82, 8, k.a, k.b, false) + body + p("M58 94Q74 92 72 103Q66 110 52 107Q62 104 58 94Z", k.b) + el(24, 99, 12, 12, k.c, rim(k.c)) + legPath(22, 104, 29, 9, k.c, k.b, true) + legPath(64, 106, 91, 8, k.c, k.b, false) + place(73, 89, 0.95, phead(head, m), 10)),
      top: wrap("bd-s-pups-tremble", ln("M108 108v9M115 108v9", "#3a3038", 2.4) + fluff(111, 102, 7, 6.4, 8, 1.4, "#fbf7ee") + el(106, 99, 4.2, 5, "#3a3038", `transform="rotate(20 106 99)"`) + dot(105, 98, 1.1, "#fff")) + wrap("bd-s-pups-flash", ln("M84 82Q96 83 103 91", "#ffe46a", 2, `stroke-dasharray="4 4"`) + txt(92, 76, 14, "!", "#ffe46a")),
      neck: [64, 93, 9], cap: [71, 78, 0.62], css: CSS.crouch,
    };
  }
  const h = {
    top: 21, my: 56,
    back: both(fur("M36 38Q25 22 29 11Q43 11 55 25Z", k.c) + p("M29 11Q39 7 45 17Q37 17 33.5 26Q27 18 29 11Z", k.a, rim(k.a))),
    skull: fur("M60 21C76 21 85 31 85 43Q91 50 87 53Q89 59 80 60Q74 71 60 71Q46 71 40 60Q31 59 33 53Q29 50 35 43C35 31 44 21 60 21Z", k.c),
    marks: p("M58.4 21.4Q60 21 61.6 21.4Q62 36 66 43Q75 50 74 60Q69 70.5 60 70.5Q51 70.5 46 60Q45 50 54 43Q58 36 58.4 21.4Z", k.b),
    nose: nose(60, 52, 5.4, 3.8), eyes: { r: 4.4, iris: "#a4601e", rim: 1.2 }, mouth: { tongue: true },
  };
  return front(h, { fur: k.c, paw: k.b, tail: wrap("bd-wag", stroke("M78 108Q102 119 112 98", k.c, 11) + ln("M107 109Q112 104 112 98", k.b, 9)), chest: p("M40 66l5 7l-1 4l6 3l-1 7l6 2q-1 8 5 14q6 -6 5 -14l6 -2l-1 -7l6 -3l-1 -4l5 -7Q60 74 40 66Z", k.b) }, m);
};

// --- Scruffy rescue: wiry outline, beard, bushy brows, one folded ear, a prized stick ---
D.scruffy = (k, m) => {
  const h = {
    top: 20, my: 57, ey: 43, ex: 47,
    back: fur("M37 38Q24 22 26 8L33 14L35 8Q48 14 54 26Z", k.a) + fur("M83 38Q98 24 94 14Q80 12 66 26Z", k.a),
    skull: fur("M60 20L66 17L68 22L76 21L77 27L85 29L83 35L90 41L85 45L93 53L85 55L90 63L80 62L79 69L70 66L64 72L60 68L54 72L50 66L41 70L40 63L30 63L35 56L27 52L35 45L30 40L37 35L35 28L43 28L45 21L52 23L55 16Z", k.c),
    muz: p("M45 52Q60 42 75 52L82 66L73 63L74 72L66 68L61 76L57 69L50 73L49 65L39 68Z", k.b, rim(k.b)),
    nose: nose(60, 51.5, 5.6, 4), eyes: { r: 4.4, iris: "#4a2a14" }, mouth: { tongue: true },
    brow: both(p("M39 36Q46 27 57 33L51 34L54 38L47 36L47 40L42 37Z", k.b, rim(k.b))),
    front: p("M94 14Q99 24 90 33L89 27L84 29Q86 20 94 14Z", k.c, rim(k.c)),
  };
  const stick = stroke("M20 112L102 108", "#8a5a2e", 5) + stroke("M88 108.6l8 -7M30 111.6l-5 -6", "#8a5a2e", 2.6) + el(99, 98, 5, 2.6, "#6ec04a", `transform="rotate(-30 99 98)"`);
  return front(h, {
    fur: k.c, paw: k.b,
    tail: wrap("bd-wag", fur("M78 104Q96 96 100 70L104 76L107 70L106 80L112 80L105 87L110 92L101 93Q98 108 80 114Z", k.c)),
    chest: p("M45 66L49 76L52 73L55 84L58 80L61 92L64 80L67 84L69 73L72 76L75 66Q60 74 45 66Z", k.b),
    haunchMarks: both(ln("M28 96l-5 -3M27 104l-6 0M36 92l-2 -5", k.a, 1.6)), over: stick,
  }, m);
};

// --- Patch rescue: eye patch, one ear up and one ear down, freckled muzzle ---
D.patch = (k, m) => {
  const h = {
    top: 20, my: 56,
    back: fur("M36 38Q25 18 32 7Q47 13 55 25Z", k.a) + p("M38 31Q33 19 35 15Q44 19 49 26Z", "#f2b8a8"),
    skull: fur("M60 20C76 20 85 31 85 45C85 61 74 71 60 71C46 71 35 61 35 45C35 31 44 20 60 20Z", k.c),
    marks: p("M66 28Q80 24 85 40Q86 56 74 56Q62 55 61 45Q61 34 66 28Z", k.a) + p("M36 38Q40 24 52 22Q50 32 44 34Q40 36 36 38Z", k.a),
    muz: el(60, 57, 13, 10, k.b), nose: nose(60, 52.5, 5.4, 3.8), eyes: { r: 4.4 }, eyes2: { r: 4.6, iris: "#8a5220", rim: 1.4 }, mouth: { tongue: true },
    front: dots([[49, 57], [52, 60], [48.5, 61.5], [71, 57], [68, 60], [71.5, 61.5]], 0.8, k.a) + fur("M72 25Q92 20 98 38Q101 52 93 54Q85 52 83 42Q80 32 70 29Z", k.a),
  };
  return front(h, {
    fur: k.c, tail: wrap("bd-wag", stroke("M80 104Q104 100 104 74", k.c, 8) + ln("M104 86Q105 80 104 74", k.a, 7.4)),
    chest: "", haunchMarks: p("M27 94Q38 86 45 94Q44 106 34 105Q26 102 27 94Z", k.a),
    over: p("M72 70Q84 72 84 86Q76 92 70 84Q66 74 72 70Z", k.a),
  }, m);
};

// --- Siberian Husky: facial mask, blue eyes, thick prick ears, brush tail ---
D.husky = (k, m, s) => {
  if (s) {
    const head = {
      fur: k.c, muz: k.b, len: 24, r: 15, mt: -4,
      back: fur("M-4 -9Q-6 -25 3 -29Q11 -22 8 -10Z", k.a),
      marks: p("M-6 3Q5 -2 9 -2Q14 0 22 0Q20 10 12 12Q0 18 -9 11Z", k.b) + el(6, -9.5, 3.2, 2, k.b),
      front: fur("M-13 -6Q-21 -21 -14 -27Q-3 -21 -2 -12Z", k.c) + p("M-12 -10Q-16 -18 -13 -22Q-7 -17 -6 -13Z", k.b),
      eyes: { r: 3.8, iris: "#4fc4ff" },
    };
    const torso = fur("M30 112Q20 88 40 76Q52 70 58 56L80 62Q86 80 76 96L76 112Z", k.c);
    return {
      body: fur("M38 108Q10 100 5 112Q4 121 24 119Q38 120 48 114Z", k.c) + ln("M8 115Q20 118 34 114", k.b, 4) + legPath(62, 88, 62, 8, "#c8ccd8", k.b, false) + torso + p("M74 62Q86 80 76 98Q66 100 62 90Q66 76 62 66Z", k.b) + fur("M32 92Q56 84 58 108Q56 119 36 117Q22 108 32 92Z", k.c) + el(52, 116, 12, 4.4, k.b, rim(k.b)) + legPath(73, 90, 76, 8.6, k.b, k.b, false)
        + wrap("bd-s-pups-howl", place(70, 54, 1, phead(head, m, { open: true, eyes: m === "love" ? eye(4, -4, m) : ln("M0 -4q4.5 3.6 9 -1", INK, 2.2) }), -52)),
      top: wrap("bd-s-pups-ring", ln("M92 24q8 4 6 14", "#cfeaff", 3)) + wrap("bd-s-pups-ring2", ln("M96 14q16 7 11 28", "#cfeaff", 3)) + wrap("bd-s-pups-ring3", ln("M99 4q23 11 15 42", "#cfeaff", 3)) + p("M22 10A13 13 0 1 0 34 30A11 11 0 0 1 22 10Z", "#fff2a8") + star(42, 8, 3.4) + txt(6, 52, 10, "awoo", "#cfeaff"),
      neck: [69, 68, 11], cap: [56, 46, 0.58], css: CSS.howl,
    };
  }
  const h = {
    top: 20, my: 56.5, ey: 43,
    back: both(fur("M34 40Q26 18 34 8Q49 13 57 26Z", k.c) + p("M37 33Q32 21 36 15Q46 20 50 27Z", k.b)),
    skull: fur("M60 20C77 20 87 30 87 43L93 52L86 54L90 60L81 61Q73 72 60 72Q47 72 39 61L30 60L34 54L27 52L33 43C33 30 43 20 60 20Z", k.c),
    marks: p("M60 41Q61 33 68 30Q77 28 77 36Q84 40 84 48Q90 52 84 55Q85 61 79 61Q72 70.5 60 70.5Q48 70.5 41 61Q35 61 36 55Q30 52 36 48Q36 40 43 36Q43 28 52 30Q59 33 60 41Z", k.b) + p("M55.5 21L64.5 21L61.5 40L61.8 50L58.2 50L58.5 40Z", k.c),
    nose: nose(60, 52.5, 5.4, 3.8), eyes: { r: 4.2, iris: "#43c0ff", rim: 0.4 }, brow: both(ln("M42.5 40.5Q48 37 53.5 42", k.a, 1.6)), mouth: { tongue: true },
  };
  return front(h, {
    fur: k.c, leg: k.b,
    chest: p("M45 66Q60 75 75 66Q82 88 70 104Q60 110 50 104Q38 88 45 66Z", k.b),
    over: wrap("bd-wag", fur("M84 94Q113 92 111 108Q108 121 86 120Q70 120 70 113Q82 115 93 111Q99 102 84 104Z", k.c) + p("M71 113Q83 117 95 112Q101 108 100 103Q104 114 93 117Q82 120 71 113Z", k.b)),
  }, m);
};

// --- Standard Poodle: topknot, pompom ears, shaved face and legs with bracelets ---
D.poodle = (k, m, s) => {
  const h = {
    top: 10, my: 58, ey: 42, ex: 49, bx: 45, by: 51,
    skull: fur("M60 24C72 24 80 33 79 45Q78 54 70 58Q69 72 60 72Q51 72 50 58Q42 54 41 45C40 33 48 24 60 24Z", k.b),
    muz: ln("M52 52Q51 66 60 68Q69 66 68 52", k.a, 1, `opacity=".6"`), nose: nose(60, 54, 5, 3.6, "#5a2e20"),
    eyes: { r: 4, rim: 0.8, dark: "#2e1810" },
    front: both(fluff(36, 52, 11, 17, 13, 2.6, k.c) + ln("M32 46q4 3 0 7M38 57q4 3 0 7", k.a, 1)) + fluff(60, 22, 18, 13, 14, 2.8, k.c) + ln("M50 20q4 -5 9 -1M62 27q5 2 9 -3M55 13q5 -3 9 0", k.a, 1.1),
  };
  const bracelet = (x, y) => fluff(x, y, 7.4, 5.6, 9, 1.8, k.c);
  const pom = fluff(104, 66, 9.5, 9.5, 11, 2.4, k.c);
  if (!s) return front(h, {
    fur: k.b, lw: 8, w: -2,
    tail: wrap("bd-wag", stroke("M80 104Q98 94 102 72", k.b, 4.6) + pom),
    chest: fluff(60, 79, 22, 15, 16, 3, k.c) + ln("M50 76q5 4 0 8M66 78q5 3 1 8", k.a, 1),
    haunchMarks: both(fluff(36, 98, 11, 9.5, 11, 2.2, k.c)),
    legMarks: bracelet(50, 107),
  }, m, { k: 0.74 });
  const hindleg = both(stroke("M52 80Q44 92 49 114", k.b, 7) + bracelet(48, 104) + el(46, 116, 8, 4, k.b, rim(k.b)));
  const arm = both(stroke("M48 62Q30 66 32 50", k.b, 6) + bracelet(32, 55) + el(32.5, 47, 4.8, 4.4, k.b, rim(k.b)));
  return {
    body: stroke("M70 76Q92 80 96 62", k.b, 4) + fluff(97, 58, 9, 9, 11, 2.4, k.c) + hindleg + fluff(60, 78, 15, 10, 12, 2, k.c) + fluff(60, 62, 19, 14, 15, 2.8, k.c) + arm + at(60, 34, 0.74, fhead(h, m, { eyes: happyShut(49, 42) + happyShut(71, 42) })),
    top: wrap("bd-s-pups-notes", note(14, 38, "#ff7ab0") + note(95, 30, "#7ad8ff") + note(103, 98, "#ffe14d") + star(14, 78, 4.4)),
    neck: [60, 52, 12], cap: [60, 15, 0.66], css: CSS.prance,
  };
};

// --- Whippet: small slim sighthound, deep chest, tucked waist, rose ears, fawn and white ---
function sighthead(k, grey, flat) {
  const ear = flat || grey
    ? fur("M-1 -10.5Q-10 -19 -19 -10Q-14 -11 -17 -3Q-9 -6 -5 -2Z", k.a) + ln("M-5 -10Q-11 -13 -15 -9", k.b, 1.3, `opacity=".7"`)
    : fur("M-6 -9Q-17 -27 -26 -21Q-19 -20 -18 -13Q-12 -12 -7 -2Z", k.a) + p("M-12 -13Q-18 -21 -23 -20.5Q-17 -18 -15.5 -12Z", "#f0b8a8");
  return {
    fur: k.c, len: grey ? 31 : 27, r: grey ? 12.5 : 12, mt: -4, mb: 7, nr: 3.4, ex: 3, ey: -4,
    muz: k.c,
    marks: grey ? ln("M-9 -3q5 3 3 9M-3 -10q4 4 3 8M12 -3q2 4 -1 8", k.a, 1.5) + p("M6 4Q18 3 28 2Q24 8 12 9Z", k.b, `opacity=".8"`) : p("M0 -11.5Q6 -12 5 -8Q8 -3 24 -1.5L26 3Q15 9 -1 12Q10 2 0 -11.5Z", k.b),
    front: ear, eyes: { r: 3.8, iris: grey ? "#8a5a20" : "#5a3014", rim: 1 },
  };
}
D.whippet = (k, m, s) => {
  const head = sighthead(k, false, s);
  if (s) {
    const leg = (x, y, mx, my, fx, fy, col) => stroke(`M${x} ${y}Q${mx} ${my} ${fx} ${fy}`, col, 5) + el(fx, fy, 4.4, 3, k.b, rim(k.b));
    const stretched = leg(34, 76, 22, 94, 4, 98, k.a) + leg(64, 80, 84, 92, 112, 88, k.a) + leg(28, 76, 10, 88, 6, 111, k.c) + leg(70, 80, 88, 100, 111, 104, k.c);
    const gathered = leg(34, 78, 52, 96, 66, 104, k.a) + leg(64, 80, 56, 98, 42, 102, k.a) + leg(28, 76, 44, 92, 58, 112, k.c) + leg(70, 80, 62, 96, 48, 111, k.c);
    const body = fur("M19 71Q34 60 50 68Q60 64 72 64Q86 70 78 84Q70 92 56 88Q42 76 30 83Q16 86 19 71Z", k.c) + p("M76 68Q86 76 76 85Q66 92 54 86Q70 82 76 68Z", k.b) + el(30, 74, 11, 10, k.c);
    return {
      body: wrap("bd-s-pups-bound", stroke("M22 70Q6 66 2 52", k.c, 3.6) + wrap("bd-s-pups-legsA", stretched) + wrap("bd-s-pups-legsB", gathered) + fur("M62 70Q74 52 88 52L90 68Q80 74 76 82Z", k.c) + body + place(88, 58, 0.95, phead(head, m, {}), -2)),
      top: wrap("bd-s-pups-speed", ln("M1 36h24M6 45h14M2 62h8M14 28h12", "#fff", 2.4)) + wrap("bd-s-pups-dust", fluff(14, 116, 9, 4.4, 8, 1.6, "#e8d4ac") + fluff(31, 118, 6, 3, 7, 1.2, "#e8d4ac")),
      neck: [79, 66, 9], cap: [87, 50, 0.55], css: CSS.zoom,
    };
  }
  const body = stand({ x0: 20, x1: 76, top: 70, bot: 93, tuck: 13, fur: k.c, far: k.a, paw: k.b, lw: 5.2, up: 9,
    tail: wrap("bd-wag", stroke("M24 75Q9 88 12 108", k.c, 3.2) + ln("M11 101q-.5 4 1 7", k.b, 3.2)),
    neckSvg: fur("M58 72Q68 56 74 40L88 48Q82 62 76 80Z", k.c),
    marks: p("M75 76Q78 93 61 93Q52 92 46 88Q62 88 68 76Z", k.b),
    chest: p("M82 50Q76 64 76 76Q72 82 66 80Q76 68 76 52Z", k.b),
  });
  return { body: body + wrap("bd-bob", place(81, 43, 1, phead(head, m))), neck: [76, 58, 9], cap: [80, 34, 0.6], wrapClass: "bd-breathe" };
};

// --- Samoyed: all-white cloud, small furry ears, upturned black smile, plume over back ---
D.samoyed = (k, m, s) => {
  const smile = m === "sad" ? mouth(60, 56, m) : `${s ? openMouth(60, 58.5, 11, 13) : m === "love" || m === "happy" ? tongueShape(60, 61) : ""}${ln("M60 55v4M47 55.5Q50 64 60 59Q70 64 73 55.5", INK, 1.9)}`;
  const h = {
    top: 20, my: 56, ex: 47,
    back: both(fur("M33 36Q30 15 39 11Q50 15 55 24Z", k.c) + p("M37 30Q36 20 40 17Q47 20 49 24Z", "#f6c4cc")),
    skull: fluff(60, 46, 29, 25, 18, 2.6, k.c, `stroke="${k.a}" stroke-width="1.2"`),
    muz: el(60, 56, 14, 10.5, k.b) + ln("M45 53Q47 46 54 46M75 53Q73 46 66 46", k.a, 1, `opacity=".6"`),
    nose: nose(60, 52, 5.2, 3.6), eyes: { r: 4, rim: 0.6 },
  };
  const edge = `stroke="${k.a}" stroke-width="1.2"`;
  const body = {
    fur: k.c, w: 3,
    tail: wrap(s ? "bd-s-pups-flagwiggle" : "bd-wag", fluff(95, 82, 14, 20, 13, 3.4, k.c, edge) + ln("M90 94q14 -6 12 -22M96 96q10 -5 11 -14", k.a, 1.4)),
    torso: fluff(60, 90, 27, 26, 18, 3, k.c, edge),
    chest: ln("M50 76q4 6 2 10M70 76q-4 6 -2 10M60 78v10", k.a, 1.4),
  };
  if (!s) { const r = front(h, body, m); r.body = sit(body) + wrap("bd-bob", fhead(h, m, { mouth: smile })); return r; }
  const eyes = m === "love" ? undefined : happyShut(47, 42) + happyShut(73, 42);
  const wave = wrap("bd-s-pups-wave", stroke("M80 90Q96 84 99 70", k.c, 10) + el(100, 67, 7.4, 6.6, k.b, edge) + el(100, 68, 3, 2.4, "#f6a8b8") + dots([[96, 64], [100, 62.5], [104, 64]], 1.2, "#f6a8b8"));
  return {
    body: wrap("bd-s-pups-wiggle", sit(body) + wrap("bd-s-pups-grin", fhead(h, m, { eyes, mouth: smile })) + wave),
    top: wrap("bd-s-pups-pop", heart(14, 26, 1.3) + heart(106, 38, 0.9) + star(103, 14, 6) + star(12, 58, 4.4)),
    neck: [60, 74, 20], cap: [60, 25, 1], css: CSS.wiggle,
  };
};

// --- Three-legged rescue: black-and-tan shepherd mix with a single sturdy hind leg ---
D.tripod = (k, m, s) => {
  const h = {
    top: 20, my: 55.5,
    back: fur("M36 40Q22 16 29 3Q46 10 56 26Z", k.c) + p("M37 31Q30 17 32 11Q43 17 49 27Z", k.b) + fur("M84 40Q98 24 96 12Q80 8 66 26Z", k.c),
    skull: fur("M60 21C76 21 85 31 85 44L88 55Q80 58 76 64Q69 71 60 71Q51 71 44 64Q40 58 32 55L35 44C35 31 44 21 60 21Z", k.c),
    marks: p("M33 55Q42 49 52 47Q56 40 60 40Q64 40 68 47Q78 49 87 55Q79 58 76 63Q69 70.5 60 70.5Q51 70.5 44 63Q41 58 33 55Z", k.b) + both(el(47, 35, 4.4, 3, k.b)),
    nose: nose(60, 52, 5.4, 3.8), eyes: { r: 4.4, iris: "#6a3a14", rim: 1.1 }, mouth: { tongue: true },
    front: fur("M96 12Q101 26 89 34L88 25L82 27Q86 16 96 12Z", k.a),
  };
  const make = (legs) => stand({ x0: 14, x1: 80, top: 73, bot: 98, tuck: 5, fur: k.c, leg: k.b, far: "#a87c44", lw: 8.6, legs,
    tail: wrap(s ? "bd-s-pups-flaghop" : "bd-wag", fur("M20 78Q2 70 5 46Q9 50 11 49Q9 60 16 63Q16 70 26 74Z", k.c)),
    marks: p("M79 82Q81 98 64 98Q54 97 46 95Q64 92 68 80Q74 76 79 82Z", k.b),
  });
  if (!s) {
    const body = make([[63, 90, 63, 0, 1], [29, 87, 31, 1, 0], [73, 90, 75, 0, 0]]);
    return { body: body + wrap("bd-bob", at(81, 52, 0.8, fhead(h, m))), neck: [79, 73, 15], cap: [81, 36, 0.8], wrapClass: "bd-breathe" };
  }
  const body = make([[63, 90, 90, 0, 1], [30, 87, 20, 1, 0], [73, 90, 99, 0, 0]]).replace(/ 115(?=")/g, " 108").replace(/cy="116"/g, `cy="109"`);
  return {
    body: wrap("bd-s-pups-hop", `<g transform="translate(0 -4) rotate(-10 48 94)">${body}${at(81, 52, 0.8, fhead(h, m, { mouth: openMouth(60, 56, 8, 11) }))}</g>`),
    top: wrap("bd-s-pups-dust", fluff(20, 116, 10, 4, 8, 1.5, "#e8d4ac")) + ln("M6 117Q18 92 34 112", "#fff", 2, `stroke-dasharray="3 5"`) + wrap("bd-s-pups-pop", heart(106, 14, 1.2) + star(13, 24, 5)),
    neck: [78, 61, 12], cap: [76, 31, 0.75], css: CSS.hop,
  };
};

// --- Australian Shepherd: blue merle blotches, copper points, odd eyes, bobtail ---
D.aussie = (k, m, s) => {
  const copper = "#c97f3e";
  const h = {
    top: 20, my: 56,
    back: both(fur("M36 37Q27 22 31 14Q44 12 55 25Z", k.a) + p("M31 14Q42 10 48 20Q38 19 36 29Q29 21 31 14Z", k.c, rim(k.c))),
    skull: fur("M60 20C76 20 85 31 85 43Q91 50 87 54Q89 60 79 61Q73 71 60 71Q47 71 41 61Q31 60 33 54Q29 50 35 43C35 31 44 20 60 20Z", k.c),
    marks: p("M37 40Q40 24 54 23Q56 28 51 31Q55 36 48 37Q47 45 40 44Z", k.a) + p("M70 24Q82 28 83 40Q77 38 77 34Q71 36 72 31Q67 29 70 24Z", k.a) + dots([[80, 48], [76, 26], [64, 26], [39, 49]], 1.8, k.a) + both(p("M40 51Q47 49 51 52Q50 62 45 63Q39 59 40 51Z", copper)) + both(el(48, 35.5, 4.2, 2.6, copper)) + p("M57.6 21Q60 20.4 62.4 21Q62.5 36 66 44Q74 51 73 61Q69 70.5 60 70.5Q51 70.5 47 61Q46 51 54 44Q57.5 36 57.6 21Z", k.b),
    nose: nose(60, 52, 5.2, 3.8), eyes: { r: 4.4, iris: "#55c8ff", rim: 0.8 }, eyes2: { r: 4.4, iris: "#8a4a18", rim: 0.8 }, mouth: { tongue: true },
  };
  const merle = (x, y) => p(`M${x} ${y}q6 -6 10 -1q-1 4 -5 4q1 5 -5 5q-4 -3 0 -8Z`, k.a);
  if (!s) return front(h, {
    fur: k.c, leg: k.b,
    tail: wrap("bd-wag", fluff(93, 99, 9, 8, 9, 2.4, k.c) + merle(92, 95)),
    chest: p("M42 66l5 8l-1 4l6 4l-1 6l6 3q-1 6 3 10q4 -4 3 -10l6 -3l-1 -6l6 -4l-1 -4l5 -8Q60 74 42 66Z", k.b),
    haunchMarks: merle(27, 94) + merle(84, 90) + dots([[40, 105], [83, 106], [31, 106]], 2.2, k.a),
    over: both(merle(35, 72) + el(42, 96, 3, 5, copper)),
  }, m);
  const body = p("M12 74Q12 56 30 59Q48 64 62 80Q80 88 78 102Q70 112 56 106Q44 94 32 92Q14 92 12 74Z", k.c, rim(k.c));
  return {
    body: wrap("bd-s-pups-bow", wrap("bd-s-pups-flagbow", fluff(12, 56, 8, 9, 9, 2.4, k.c) + merle(8, 52)) + legPath(34, 82, 38, 8, k.a, k.b, true) + legPath(66, 102, 96, 8, k.a, k.b, false, 111) + body + merle(24, 64) + merle(42, 72) + merle(26, 76) + dots([[46, 86], [56, 80], [18, 74]], 2.4, k.a) + p("M78 98Q72 112 56 106Q66 104 68 94Z", k.b) + el(24, 80, 12, 14, k.c, rim(k.c)) + merle(18, 76) + legPath(21, 84, 17, 9, k.c, k.b, true) + legPath(66, 103, 100, 9, k.b, k.b, false) + at(79, 76, 0.76, fhead(h, m, { mouth: openMouth(60, 57, 8, 11) }))),
    top: wrap("bd-s-pups-flash", ln("M2 40q4 4 2 9M22 40q-3 5 0 9", "#fff", 2.2)) + wrap("bd-s-pups-pop", txt(88, 30, 12, "play!", "#ffe14d")),
    neck: [78, 94, 13], cap: [79, 62, 0.75], css: CSS.bow,
  };
};

// --- Bernese Mountain Dog: black with rust points, white blaze, muzzle and chest cross ---
D.bernese = (k, m, s) => {
  const h = {
    top: 20, my: 56.5, ey: 42,
    skull: fur("M60 20C78 20 87 31 87 44Q88 57 79 64Q71 72 60 72Q49 72 41 64Q32 57 33 44C33 31 42 20 60 20Z", k.c),
    marks: both(p("M44 47Q34 52 37 60Q43 69 51 65Q47 55 50 47Z", k.a)) + both(el(47.5, 34.5, 4.4, 3.2, k.a)) + p("M57 21Q60 20.2 63 21Q63 35 65 42Q76 50 75 61Q70 71 60 71Q50 71 45 61Q44 50 55 42Q57 35 57 21Z", k.b),
    nose: nose(60, 52, 6.4, 4.4), eyes: { r: 4.4, iris: "#7a4416", rim: 1.1 }, mouth: { tongue: true },
    front: both(fur("M41 26Q23 25 21 43Q20 56 28 58Q37 54 39 43Q41 33 48 28Q45 25 41 26Z", k.c)),
  };
  if (!s) return front(h, {
    fur: k.c, w: 6, lw: 13, paw: k.b, hpaw: k.b,
    legMarks: p("M43.6 97Q50 93 56.2 97L56 113H43.6Z", k.a),
    tail: wrap("bd-wag", fur("M80 100Q106 102 112 84Q121 92 114 106Q104 120 80 116Z", k.c) + p("M112 84Q120 90 116 100Q110 96 108 90Z", k.b)),
    chest: both(p("M45 66Q36 71 36 83Q43 89 52 84Q52 74 45 66Z", k.a)) + p("M45 65Q60 73 75 65Q73 78 66 83Q66 97 60 101Q54 97 54 83Q47 78 45 65Z", k.b),
  }, m);
  const body = stand({ x0: 42, x1: 94, top: 72, bot: 97, fur: k.c, leg: k.a, far: "#8a4a1c", paw: k.b, lw: 9,
    tail: stroke("M47 76Q36 70 38 56", k.c, 7) + ln("M37.5 61Q37.5 58 38 56", k.b, 6),
    chest: p("M93 79Q95 96 82 97Q86 90 85 80Q89 74 93 79Z", k.b),
  });
  const spokes = [0, 45, 90, 135].map((a) => `<g transform="rotate(${a} 19 102)">${ln("M7 102H31", "#d8a860", 2.2)}</g>`).join("");
  const churn = (x) => fur(`M${x - 7} 78V62Q${x - 7} 58 ${x - 3} 55V50H${x + 3}V55Q${x + 7} 58 ${x + 7} 62V78Z`, "#c9d2dc") + ln(`M${x - 7} 65H${x + 7}M${x - 7} 73H${x + 7}`, "#8a96a6", 1.4) + el(x, 50, 5, 2, "#a8b4c2");
  const cart = churn(12) + churn(27) + fur("M2 76H38L35 94H5Z", "#b0702e") + ln("M4 82H36M12 77v16M21 77v16M30 77v16", "#7a4614", 1.4);
  const wheel = wrap("bd-s-pups-cartwheel", dot(19, 102, 14.5, "none", `stroke="#5a2e10" stroke-width="5"`) + spokes) + dot(19, 102, 3.4, "#d33a2a");
  return {
    body: wrap("bd-s-pups-rattle", cart) + wheel + ln("M36 88Q50 94 66 90", "#7a4614", 3) + wrap("bd-s-pups-trot", body + ln("M66 74Q72 86 66 96M66 90L88 84", "#d33a2a", 3.4) + at(90, 54, 0.68, fhead(h, m))),
    top: wrap("bd-s-pups-dust", fluff(40, 117, 6, 3, 7, 1.2, "#e8d4ac")),
    neck: [89, 71, 13], cap: [90, 40, 0.68], css: CSS.cart,
  };
};

// --- Greyhound: tall, blue brindle, very deep chest, extreme tuck, long fine muzzle ---
D.greyhound = (k, m, s) => {
  if (s) {
    const head = sighthead(k, true, true);
    const leg = (cls, d, x, y) => wrap(cls, stroke(d, k.c, 5.6) + el(x, y, 4.6, 3.8, k.b, rim(k.b)));
    return {
      body: el(60, 113, 57, 10, "#d95a78") + el(60, 110, 52, 7, "#f08aa0")
        + leg("bd-s-pups-twitch2", "M32 96Q46 74 40 54", 40, 52) + leg("bd-s-pups-twitch", "M64 94L67 73Q70 67 76 72L80 82", 80, 83)
        + fur("M13 99Q14 84 32 87Q46 94 60 84Q76 76 90 90Q96 104 80 109Q52 116 28 110Q13 108 13 99Z", k.c) + p("M22 93Q34 90 46 94Q60 86 70 84Q82 84 86 92Q72 94 60 99Q38 106 22 93Z", k.b) + ln("M20 100q4 5 2 9M30 102q4 4 3 9M42 104q3 3 2 7M54 103q4 4 3 8M66 101q4 4 4 9M76 98q4 4 4 9", k.a, 1.8)
        + leg("bd-s-pups-twitch", "M22 96Q4 84 14 66Q18 60 24 60", 25, 60) + leg("bd-s-pups-twitch2", "M72 94L83 74Q87 69 93 73L98 82", 98, 83)
        + stroke("M16 102Q2 108 4 117", k.c, 3.4)
        + `<g transform="translate(88 98) scale(.86 -.86)">${phead(head, m, { eyes: m === "love" ? eye(3, -4, m) : ln("M-1 -3q4.5 -4.5 9 -1", INK, 2.2) })}</g>`,
      top: wrap("bd-s-pups-zzz", txt(94, 56, 15, "Z", "#cfe0ff") + txt(106, 40, 11, "z", "#cfe0ff") + txt(99, 27, 8, "z", "#cfe0ff")),
      neck: [72, 93, 8], cap: [93, 86, 0.5], css: CSS.roach, shadow: false,
    };
  }
  const head = sighthead(k, true, false);
  const body = stand({ x0: 16, x1: 78, top: 60, bot: 91, tuck: 20, fur: k.c, far: k.a, paw: k.b, lw: 5.8, up: 12,
    tail: wrap("bd-wag", stroke("M20 66Q3 84 9 107Q12 113 18 110", k.c, 3)),
    neckSvg: fur("M56 62Q70 48 74 28L88 36Q82 54 78 72Z", k.c) + ln("M68 52q4 2 9 1M72 44q4 2 8 1", k.a, 1.6),
    marks: p("M77 74Q80 91 63 91Q54 90 46 84Q64 86 70 74Z", k.b) + ln("M30 62q5 8 2 14M40 61q6 11 2 17M50 62q6 12 3 23M60 62q6 12 3 24M69 62q5 9 5 18", k.a, 2.4),
    thighMarks: ln("M22 64q5 6 3 12M30 68q4 6 1 12", k.a, 2.2),
  });
  return { body: body + wrap("bd-bob", place(81, 30, 1, phead(head, m))), neck: [76, 48, 9], cap: [76, 18, 0.55], wrapClass: "bd-breathe" };
};

// --- Basenji: tall upright ears, wrinkled brow, tight ring tail, white feet and chest ---
D.basenji = (k, m, s) => {
  const h = {
    top: 24, my: 57, ey: 45, ex: 48,
    back: both(fur("M39 40Q27 14 35 1Q50 10 57 28Z", k.c) + p("M41 32Q33 17 36 9Q46 16 50 28Z", "#f8d4c4")),
    skull: fur("M60 25C74 25 82 34 82 46Q82 56 74 63Q68 72 60 72Q52 72 46 63Q38 56 38 46C38 34 46 25 60 25Z", k.c),
    marks: ln("M50 30Q55 33 57 37M70 30Q65 33 63 37M52 27Q56 29 58 32M68 27Q64 29 62 32", k.a, 1.5) + p("M60 37Q62 44 64 48Q74 52 73 62Q68 71 60 71Q52 71 47 62Q46 52 56 48Q58 44 60 37Z", k.b),
    nose: nose(60, 53.5, 4.8, 3.4), eyes: { r: 4.2, rim: 0.8, dark: "#2c140c" },
  };
  const ring = stroke("M79 100C96 100 104 88 98 80C91 72 80 80 85 88C89 93 96 89 94 85", k.c, 7) + ln("M85 88C89 93 96 89 94 85", k.b, 4.4);
  const body = {
    fur: k.c, w: -4, lw: 9, paw: k.b, hpaw: k.b,
    tail: wrap(s ? "bd-s-pups-stiff" : "bd-wag", ring),
    chest: p("M50 66Q60 73 70 66Q74 84 60 98Q46 84 50 66Z", k.b),
    legMarks: el(50, 110, 4.6, 6, k.b),
  };
  if (!s) return front(h, body, m);
  const wav = ln("M84 40l6 -10l5 7l6 -13l5 8l7 -15", "#fff2a0", 2.8);
  const o = el(60, 61.5, 6, 7.6, "#5c1428", `stroke="${INK}" stroke-width="1.4"`) + el(60, 65, 3.4, 2.4, "#ff7e93");
  return {
    body: sit(body) + wrap("bd-s-pups-yodel", at(58, 47, 1, fhead(h, m, { eyes: m === "love" ? undefined : happyShut(48, 43) + happyShut(72, 43), mouth: o }), -13)),
    top: wrap("bd-s-pups-flash", wav) + wrap("bd-s-pups-notes", note(10, 30, "#ff7ab0") + note(20, 54, "#7ad8ff") + note(103, 58, "#ffe14d")) + txt(3, 13, 11, "ba-roo!", "#ffe14d", "bd-s-pups-pop"),
    neck: [60, 74, 17], cap: [50, 28, 0.82], css: CSS.yodel,
  };
};

// --- Papillon: tiny, with enormous fringed butterfly ears and a silky plume ---
D.papillon = (k, m, s) => {
  const wing = fur("M49 44Q36 12 16 5L13 10L6 10L9 17L2 21L8 27L3 33L11 36L9 43L17 43L18 50L26 47Q36 56 48 55Z", k.a)
    + p("M45 43Q33 18 19 13Q10 20 14 30Q14 40 26 43Q36 49 45 48Z", k.c) + ln("M40 40Q28 28 18 18M40 44Q28 38 15 31M40 47Q30 48 22 45", "#e89a68", 1.2, `opacity=".8"`);
  const h = {
    top: 29, my: 60, ey: 48, ex: 50, bx: 45, by: 56,
    back: both(wrap(s ? "bd-s-pups-wing" : "bd-wingear", wing)),
    skull: fur("M60 30C72 30 78 38 78 49Q78 60 70 64Q66 72 60 72Q54 72 50 64Q42 60 42 49C42 38 48 30 60 30Z", k.c),
    marks: p("M57.5 30.5Q60 30 62.5 30.5Q62.5 44 65 51Q72 56 69 64Q65 71.5 60 71.5Q55 71.5 51 64Q48 56 55 51Q57.5 44 57.5 30.5Z", k.b),
    nose: nose(60, 57, 4, 2.9), eyes: { r: 4.2, rim: 0.7 }, mouth: { w: 4.6, tongue: true },
  };
  const plume = fur("M72 104Q84 82 100 78Q116 76 117 92Q112 86 108 90Q116 96 110 104Q108 98 103 100Q108 108 98 112Q96 106 92 108Q90 116 76 116Z", k.b) + ln("M82 106Q92 90 108 85M86 110Q96 100 106 96", k.c, 2);
  const body = { fur: k.b, w: -8, lw: 7.4, paw: k.b, haunch: k.b, tail: wrap(s ? "bd-s-pups-flagflutter" : "bd-wag", plume), chest: fluff(60, 80, 12, 13, 12, 2.4, k.b), haunchMarks: el(40, 96, 8, 9, k.c) };
  if (!s) return front(h, body, m, { ny: 71, nw: 14, k: 0.85 });
  const fly = (x, y, col) => both("") + `<g transform="translate(${x} ${y})">${p("M0 0Q-11 -11 -12 -1Q-9 4 0 1Q-9 4 -7 9Q-2 10 0 2Q2 10 7 9Q9 4 0 1Q9 4 12 -1Q11 -11 0 0Z", col, `stroke="${INK}" stroke-width="1"`)}${ln("M0 -2v9M0 -2l-3 -5M0 -2l3 -5", INK, 1.2)}</g>`;
  return {
    body: wrap("bd-s-pups-pap", `<g transform="translate(0 -3)">${sit({ ...body, lw: 6.4 })}${fhead(h, m, { mouth: openMouth(60, 60.5, 6, 8) })}</g>`),
    top: wrap("bd-s-pups-flit", fly(103, 70, "#ffb02a")) + wrap("bd-s-pups-flit2", fly(17, 76, "#7ad8ff")) + wrap("bd-s-pups-pop", star(42, 8, 4.4) + star(112, 92, 3.4)),
    neck: [60, 68, 13], cap: [60, 31, 0.8], css: CSS.flutter,
  };
};

// --- Japanese Akita: big broad head, small forward-tipped ears, urajiro, massive curled tail ---
D.akita = (k, m) => {
  const h = {
    top: 19, my: 57, ey: 42, ex: 46,
    back: both(fur("M31 36Q27 17 36 13Q49 15 53 23Z", k.c) + p("M35 29Q34 20 38 18Q45 19 48 23Z", k.b)),
    skull: fur("M60 19C80 19 91 30 91 43Q98 55 89 63Q78 74 60 74Q42 74 31 63Q22 55 29 43C29 30 40 19 60 19Z", k.c),
    marks: p("M27 54Q34 48 42 50Q52 49 55 43Q58 38 60 38Q62 38 65 43Q68 49 78 50Q86 48 93 54Q93 60 88 63Q78 73 60 73Q42 73 32 63Q27 60 27 54Z", k.b) + both(el(46, 33.5, 4.6, 2.8, k.b, `transform="rotate(-14 46 33.5)"`)) + ln("M60 23v10", k.a, 1.6),
    muz: fur("M46 55Q48 47 60 47Q72 47 74 55Q72 69 60 69Q48 69 46 55Z", k.b),
    nose: nose(60, 53, 6, 4.2), eyes: { r: 3.7, rim: 1, dark: "#24130c" }, brow: both(ln("M41 39.5Q46.5 36.5 51.5 38.5", k.a, 1.3)),
  };
  const tail = stroke("M80 104C108 104 118 78 106 62C94 49 76 58 82 72C86 82 99 78 99 70", k.c, 14) + ln("M90 101C106 93 111 78 104 67", k.b, 4.6) + ln("M88 62q8 -6 16 2", k.b, 3);
  return front(h, {
    fur: k.c, w: 9, lw: 14, paw: k.b,
    tail: wrap("bd-wag", tail),
    chest: fluff(60, 80, 19, 15, 14, 2.4, k.b),
  }, m, { ny: 73, nw: 23, k: 1.05 });
};

// --- Chow Chow: lion mane, tiny round ears, deep-set eyes, blue-black tongue ---
D.chow = (k, m, s) => {
  const h = {
    top: 16, my: 57.5, ey: 43, ex: 49,
    back: fluff(60, 48, 38, 36, 22, 4, k.c) + fluff(60, 49, 31, 29, 18, 3, k.b, `opacity=".75"`) + both(fur("M34 27Q29 10 41 11Q50 15 51 24Z", k.c) + el(40, 18, 4.6, 5, k.a)),
    skull: fluff(60, 46, 24, 22, 14, 1.8, k.c),
    muz: fur("M45 56Q45 46 60 46Q75 46 75 56Q75 68 60 69Q45 68 45 56Z", k.b),
    nose: nose(60, 52, 7, 4.8), eyes: { r: 3.2, rim: 0.7, dark: "#1e100a" }, bx: 41,
    brow: both(ln("M42.5 37.5Q48 35 54 38.5", k.a, 2.2)) + ln("M56 31q4 3 8 0", k.a, 1.6), mouth: { tongue: true, tcol: "#41366b", tedge: "#1d1638", w: 7 },
  };
  const body = {
    fur: k.c, w: 6, lw: 14,
    tail: wrap("bd-wag", fluff(96, 90, 15, 17, 12, 4, k.c) + ln("M92 100q12 -6 14 -20", k.b, 2.4)),
    chest: fluff(60, 88, 15, 14, 12, 2.4, k.b),
  };
  if (!s) return front(h, body, m, { ny: 72, nw: 22 });
  const eyes = m === "love" ? undefined : both(ln("M43 44q5.5 4 11 0", INK, 2.6));
  const big = fur("M51 69Q46 92 52 100Q60 108 68 100Q74 92 69 69Q60 75 51 69Z", "#41366b") + ln("M60 73v24", "#1d1638", 1.6) + el(55, 88, 2.4, 6, "#8a7ac0", `opacity=".75"`);
  return {
    body: sit(body) + wrap("bd-s-pups-tilt", at(60, 45, 1.07, fhead(h, m, { eyes, mouth: openMouth(60, 58, 10, 11) }))),
    top: wrap("bd-s-pups-blep", big) + wrap("bd-s-pups-pop", star(13, 18, 5) + star(106, 24, 6) + txt(82, 112, 11, "blep!", "#d8ccff")),
    neck: [60, 72, 21], cap: [60, 20, 1], css: CSS.blep,
  };
};

// --- Newfoundland: huge black water dog with heavy head, small ears and webbed paws ---
D.newf = (k, m, s) => {
  const h = {
    top: 17, my: 57.5, ey: 41, ex: 47,
    skull: fluff(60, 45, 31, 27, 22, 2.2, k.c),
    marks: ln("M40 26q9 -6 18 -4M76 28q6 4 8 10", k.a, 2.2, `opacity=".7"`),
    muz: fur("M42 56Q43 45 60 45Q77 45 78 56Q79 72 68 71Q60 67 52 71Q41 72 42 56Z", k.b),
    nose: nose(60, 51.5, 8, 5.4, "#0c0a10"), eyes: { r: 3.9, iris: "#8a5024", rim: 1.2 }, mouth: { tongue: true, w: 8 },
    front: both(fur("M36 28Q19 27 19 43Q19 55 28 54Q34 50 35 41Q37 34 43 30Z", k.b)),
  };
  if (!s) return front(h, {
    fur: k.c, w: 11, lw: 16,
    tail: wrap("bd-wag", fluff(100, 105, 16, 9, 12, 2.6, k.c)),
    torso: fluff(60, 90, 33, 27, 20, 2.6, k.c),
    chest: ln("M48 76q3 8 -1 14M60 79q2 8 -1 15M72 76q-3 8 1 14", k.a, 2, `opacity=".65"`),
    legMarks: ln("M45 116q5 4 10 0", k.a, 1.2),
  }, m, { ny: 71, nw: 22, k: 1.05 });
  const wave = (y, col, o, cls) => wrap(cls, p(`M7 ${y}q6.6 -7 13.25 0t13.25 0t13.25 0t13.25 0t13.25 0t13.25 0t13.25 0t13.25 0Q116 ${y + 12} 60 ${y + 13}Q4 ${y + 12} 7 ${y}Z`, col, `opacity="${o}"`));
  const paw = (x, y) => el(x, y, 10, 7, k.c, rim(k.c)) + ln(`M${x - 5} ${y + 1}l-1 5M${x} ${y + 2}v5M${x + 5} ${y + 1}l1 5`, k.a, 1.4);
  const float = dot(97, 88, 14, "none", `stroke="#fbfbf6" stroke-width="9"`) + dot(97, 88, 14, "none", `stroke="#e8383a" stroke-width="9" stroke-dasharray="11 11"`);
  return {
    body: wrap("bd-s-pups-swim", fluff(54, 82, 32, 18, 16, 2.4, k.c) + at(53, 52, 0.92, fhead(h, m))),
    top: wrap("bd-s-pups-swim", float + ln("M60 66Q74 90 86 80", "#e8c070", 2.8)) + wave(88, "#58bfee", 0.82, "bd-s-pups-wave1") + wrap("bd-s-pups-paddle", paw(28, 97)) + wrap("bd-s-pups-paddle2", paw(70, 99)) + p("M7 100Q33 94 60 100T113 100Q116 122 60 123Q4 122 7 100Z", "#2f93d4", `opacity=".9"`) + wave(105, "#78d2f6", 0.6, "bd-s-pups-wave2") + wrap("bd-s-pups-drops", drop(12, 66, 1.2, -30) + drop(20, 80, 0.8, -50) + drop(112, 62, 1, 36) + drop(86, 54, 0.8, 20)),
    neck: [53, 76, 18], cap: [53, 29, 0.9], css: CSS.swim, shadow: false,
  };
};

// --- Great Dane (harlequin): tall, long deep muzzle, torn black patches ---
const TORN = [
  "M-8 -2Q-7 -6 -3 -5L-1 -7Q3 -8 4 -4L8 -4Q10 0 6 1L7 5Q3 8 0 5L-3 7Q-7 5 -5 2Z",
  "M-6 -5L-2 -4Q1 -8 4 -5L3 -2Q8 -1 7 3L3 3Q2 7 -2 5L-4 2L-8 3Q-9 -1 -6 -2Z",
  "M-5 -6Q0 -5 2 -7L6 -3L4 -1Q7 3 3 6L0 3L-4 6Q-8 3 -5 0Q-8 -3 -5 -6Z",
];
function patch(x, y, s, col, r = 0) {
  return `<g transform="translate(${x} ${y}) rotate(${r}) scale(${s})">${p(TORN[Math.round(x + y) % 3], col)}</g>`;
}
D.dane = (k, m, s) => {
  if (s) {
    const h = {
      top: 17, my: 59, ey: 37, ex: 49, by: 47,
      skull: fur("M60 17C73 17 80 24 80 36Q82 44 80 48Q84 64 74 72Q67 76 60 72Q53 76 46 72Q36 64 40 48Q38 44 40 36C40 24 47 17 60 17Z", k.c),
      marks: patch(72, 29, 1.4, k.a, 20) + patch(44, 52, 0.8, k.a),
      muz: fur("M46 52Q46 44 60 44Q74 44 74 52Q78 70 68 71Q60 66 52 71Q42 70 46 52Z", k.b),
      nose: nose(60, 50.5, 7.4, 5), eyes: { r: 4, iris: "#6a4020", rim: 1 }, mouth: { w: 8 },
      front: both(fur("M43 22Q27 17 23 30Q22 44 30 48Q34 36 46 29Z", k.a)),
    };
    const body = stand({ x0: 24, x1: 82, top: 62, bot: 88, tuck: 8, fur: k.c, far: "#d8d4cc", lw: 9,
      tail: stroke("M28 68Q16 86 26 108", k.c, 5),
      neckSvg: fur("M62 64Q68 46 70 38L90 44Q88 60 82 74Z", k.c),
      marks: patch(40, 70, 1.5, k.a, 15) + patch(61, 76, 1.2, k.a, 70) + patch(75, 66, 0.8, k.a),
      thighMarks: patch(36, 82, 0.9, k.a, 40),
    });
    const eyes = m === "love" ? undefined : happyShut(49, 38) + happyShut(71, 38);
    const person = p("M-2 -2H24Q27 40 22 70Q24 88 21 104H4Q-2 60 -2 -2Z", "#4a6ea8", `stroke="#24365a" stroke-width="1.4"`) + ln("M12 4q4 34 -2 64M8 74q6 3 12 0", "#8ab0e0", 1.4) + p("M3 101H22Q24 107 32 109Q38 111 36 118H3Z", "#8a5230", `stroke="#42240e" stroke-width="1.4"`) + ln("M4 117H35", "#3a1e0c", 3) + ln("M9 105l9 5M18 105l-8 5", "#f6e0b0", 1.4);
    return {
      body: person + wrap("bd-s-pups-lean", `<g transform="translate(0 116) skewX(12) translate(0 -116)">${body}${at(80, 38, 0.82, fhead(h, m, { eyes }), -18)}</g>`),
      top: wrap("bd-s-pups-pop", heart(104, 18, 1.4) + heart(110, 40, 0.8) + txt(88, 76, 10, "lean…", "#fff")),
      neck: [65, 57, 13], cap: [55, 17, 0.7], css: CSS.lean,
    };
  }
  const head = {
    fur: k.c, len: 25, r: 15, mt: -4, mb: 14, nr: 4.8, ex: 5, ey: -5,
    marks: p("M12 3Q22 2 24 6Q24 16 15 14Q10 18 6 12Z", k.b, rim(k.b)),
    front: fur("M-5 -13Q0 -17 0 -10Q-1 2 -9 8Q-17 1 -14 -8Q-11 -14 -5 -13Z", k.a),
    eyes: { r: 3.8, iris: "#6a4020", rim: 1 },
  };
  const body = stand({ x0: 14, x1: 78, top: 56, bot: 83, tuck: 9, fur: k.c, far: "#d8d4cc", lw: 8.6, up: 10,
    tail: wrap("bd-wag", stroke("M18 62Q4 76 8 100", k.c, 4.6) + ln("M7 90q0 6 1 10", k.a, 4.6)),
    neckSvg: fur("M56 58Q68 42 70 28L90 36Q86 54 78 68Z", k.c) + patch(77, 52, 0.9, k.a, 30),
    marks: patch(33, 64, 1.6, k.a, 10) + patch(54, 72, 1.4, k.a, 55) + patch(68, 60, 0.9, k.a, -20) + patch(43, 80, 0.7, k.a),
    thighMarks: patch(23, 76, 1, k.a, 30),
    chest: patch(72, 90, 0.4, k.a) + patch(16, 103, 0.45, k.a, 30),
  });
  return { body: body + wrap("bd-bob", place(82, 33, 1, phead(head, m))), neck: [77, 48, 10], cap: [80, 22, 0.7], wrapClass: "bd-breathe" };
};

// --- Xoloitzcuintli: hairless slate skin, huge bat ears, wrinkled brow, a sparse tuft ---
D.xolo = (k, m) => {
  const h = {
    top: 24, my: 58, ey: 44, ex: 49, bx: 44,
    back: both(fur("M42 42Q18 22 17 2Q40 4 56 28Z", k.c) + p("M42 33Q26 20 23 9Q39 13 50 29Z", "#9c6f86")),
    skull: fur("M60 26C73 26 80 35 79 46Q78 55 71 60Q69 72 60 72Q51 72 49 60Q42 55 41 46C40 35 47 26 60 26Z", k.c),
    marks: el(52, 32, 8, 4, "#fff", `opacity=".2"`) + ln("M52 35Q60 39 68 35M54 39Q60 42 66 39", k.a, 1.2) + ln("M57 27Q54 18 49 19M60 26Q60 15 65 13M63 27Q68 20 72 22", "#17131a", 1.5),
    muz: fur("M51 56Q51 48 60 48Q69 48 69 56Q69 69 60 70Q51 69 51 56Z", k.b),
    nose: nose(60, 54, 5, 3.6, "#17131a"), eyes: { r: 4.4, iris: "#e0982a", rim: 0.5 }, mouth: { w: 4.6 },
  };
  return front(h, {
    fur: k.c, w: -6, lw: 8.4,
    tail: wrap("bd-wag", stroke("M78 108Q104 112 108 88", k.c, 4.6)),
    chest: el(52, 80, 5, 11, "#fff", `opacity=".13"`) + ln("M52 69Q60 73 68 69M55 77Q60 80 65 77", k.a, 1.3),
    haunchMarks: el(33, 96, 4, 6, "#fff", `opacity=".16"`),
  }, m, { ny: 71, nw: 14, k: 0.85 });
};

// --- Dalmatian: crisp spots, drop ears, athletic carriage-dog build ---
D.dalmatian = (k, m, s) => {
  const spot = (list) => list.map(([x, y, rx, ry = rx, r = 0]) => el(x, y, rx, ry, k.a, r ? `transform="rotate(${r} ${x} ${y})"` : "")).join("");
  const head = {
    fur: k.c, len: 23, r: 14, mt: -4, mb: 10, nr: 4.2,
    marks: spot([[-8, 6, 2.2, 1.8], [-1, -9, 1.6], [10, 4, 1.4], [16, 0, 1.1], [13, 7, 0.9], [-4, 10, 1.3], [9, -2, 1]]),
    front: p("M-6 -12Q-19 -8 -17 7Q-15 18 -7 16Q-1 10 0 0Q2 -9 -6 -12Z", "#ece8e0", `stroke="#5a5058" stroke-width="1.2"`) + spot([[-10, -4, 4.2, 3.4, 30], [-11.5, 8, 3.4, 4.4], [-4, 3, 2.4], [-5, -8.5, 2], [-7, 13, 1.8]]),
    ex: 7, eyes: { r: 3.9, iris: "#4a2a16", rim: 0.6 },
  };
  const dx = s ? 8 : 0;
  const legs = s
    ? [[45, 82, 40, 1, 1], [69, 84, 92, 0, 1], [35, 80, 24, 1, 0], [79, 84, 79, 0, 0]]
    : undefined;
  let body = stand({ x0: 18 + dx, x1: 78 + dx, top: 66, bot: 92, tuck: 9, fur: k.c, far: "#d8d5cf", lw: 7, legs: s ? legs.slice(0, 1).concat(legs.slice(2)) : undefined,
    tail: wrap("bd-wag", stroke(`M${22 + dx} 72Q${6 + dx} 66 ${6 + dx} 46`, k.c, 4.4) + spot([[8 + dx, 60, 1.7], [6.5 + dx, 50, 1.4], [13 + dx, 68, 1.8]])),
    neckSvg: fur(`M${58 + dx} 68Q${68 + dx} 54 ${72 + dx} 40L${88 + dx} 48Q${84 + dx} 64 ${78 + dx} 78Z`, k.c) + spot([[75 + dx, 58, 2.2], [81 + dx, 64, 1.5], [70 + dx, 66, 1.4]]),
    marks: spot([[31, 71, 3.4, 2.8], [43, 76, 2.4], [51, 70, 3, 2.4, 20], [62, 74, 3.6, 3], [57, 84, 2.2], [39, 82, 1.7], [69, 83, 2.6], [71, 70, 1.6], [47, 88, 1.4], [34, 63, 1]].map(([x, ...r]) => [x + dx, ...r])),
    thighMarks: spot([[27, 76, 2.8], [35, 84, 2], [26, 86, 1.6]].map(([x, ...r]) => [x + dx, ...r])),
    chest: s ? "" : spot([[27, 102, 1.8], [24.6, 110, 1.4], [73, 96, 1.7], [73.6, 106, 1.5], [39, 104, 1.4], [61, 101, 1.4]]),
  });
  if (!s) return { body: body + wrap("bd-bob", place(81, 44, 1, phead(head, m))), neck: [77, 58, 10], cap: [77, 31, 0.62], wrapClass: "bd-breathe" };
  const high = wrap("bd-s-pups-step", stroke("M86 84Q102 82 101 102", k.c, 7) + el(100, 104, 4.6, 4, k.c, rim(k.c)) + spot([[96, 87, 1.7], [101, 96, 1.3]]));
  const spokes = [0, 30, 60, 90, 120, 150].map((a) => `<g transform="rotate(${a} 26 90)">${ln("M2 90H50", "#e8b83a", 2)}</g>`).join("");
  const wheel = wrap("bd-s-pups-coachwheel", dot(26, 90, 25, "none", `stroke="#a8262c" stroke-width="5"`) + spokes) + dot(26, 90, 4.6, "#a8262c", `stroke="#ffd84d" stroke-width="1.6"`);
  return {
    body: wheel + wrap("bd-s-pups-trot", body + high + place(90, 40, 1, phead(head, m), -10)),
    top: wrap("bd-s-pups-dust", fluff(58, 117, 8, 3.4, 8, 1.3, "#e8d4ac")) + ln("M104 114l6 -3M105 108l7 -1", "#fff", 2),
    neck: [86, 56, 10], cap: [88, 30, 0.68], css: CSS.trot,
  };
};

// --- Puddle Sprite (storybook): a water pup with droplet ears and a rainbow tail ---
D.puddlesprite = (k, m, s) => {
  const bubble = (x, y, r) => dot(x, y, r, "#fff", `opacity=".28" stroke="#fff" stroke-width="1"`) + dot(x - r * 0.35, y - r * 0.35, r * 0.25, "#fff");
  const h = {
    top: 19, my: 56, ex: 47,
    back: p("M60 24Q50 12 62 1Q60 9 68 12Q74 20 60 24Z", k.c, `stroke="${k.a}" stroke-width="1.4"`),
    skull: p("M60 20C78 20 87 31 87 45C87 61 76 71 60 71C44 71 33 61 33 45C33 31 42 20 60 20Z", k.c, `stroke="${k.a}" stroke-width="1.6"`),
    marks: el(48, 29, 9, 5, "#fff", `opacity=".6" transform="rotate(-22 48 29)"`) + p("M60 30Q66 38 60 41Q54 38 60 30Z", k.b),
    muz: el(60, 57, 13, 10, k.b), nose: nose(60, 52.5, 5, 3.6, "#1c5c9c"), eyes: { r: 5, iris: "#2a6ae0", rim: 1 }, mouth: { col: "#1c4c80", tongue: true },
    front: both(wrap("bd-flap", p("M40 28Q24 28 16 46Q8 66 20 70Q34 72 37 54Q38 42 46 32Q44 28 40 28Z", k.c, `stroke="${k.a}" stroke-width="1.6"`) + el(22, 58, 4, 7, "#fff", `opacity=".5" transform="rotate(22 22 58)"`))),
  };
  const rainbow = ["#ff5a6a", "#ffa63a", "#ffe44a", "#6ad86a", "#6a8cff"].map((c, i) => ln(`M80 ${99 + i * 3.4}Q${110 - i * 2.4} ${100 + i} ${112 - i * 3.4} ${68 + i * 2.6}`, c, 3.8)).join("");
  const body = {
    fur: k.c, paw: k.b,
    behind: "", tail: wrap("bd-wag", rainbow),
    chest: p("M48 67Q60 76 72 67Q76 88 60 100Q44 88 48 67Z", k.b) + bubble(78, 94, 4) + bubble(40, 84, 2.6),
  };
  const sparkle = `<g class="bd-glow">${star(12, 20, 6)}${star(106, 30, 4.4)}${star(104, 10, 3)}${star(10, 90, 3.4)}</g>`;
  const puddle = el(60, 118, 48, 6, "#7ad2f6", `opacity=".75"`) + el(60, 118, 34, 3.6, "none", `stroke="#fff" stroke-width="1.2" opacity=".8"`);
  if (!s) { const r = front(h, body, m); r.body = puddle + r.body; r.top = sparkle; r.shadow = false; return r; }
  const arc = ["#ff5a6a", "#ffa63a", "#ffe44a", "#6ad86a", "#6a8cff"].map((c, i) => ln(`M${4 + i * 4} 96C${4 + i * 4} ${8 + i * 5} ${116 - i * 4} ${8 + i * 5} ${116 - i * 4} 96`, c, 3.8)).join("");
  const crown = p("M16 118Q12 96 6 90Q22 94 28 106Q28 88 24 80Q40 90 42 108Q50 100 60 104Q70 100 78 108Q80 90 96 80Q92 90 92 106Q98 94 114 90Q108 96 104 118Q60 126 16 118Z", "#a8e8ff", `stroke="${k.a}" stroke-width="1.4"`);
  return {
    body: wrap("bd-s-pups-glint", arc) + wrap("bd-s-pups-leap", `<g transform="translate(60 60) scale(.8) translate(-60 -66)">${sit(body)}${fhead(h, m, { mouth: openMouth(60, 56.5, 9, 12) })}</g>`),
    top: wrap("bd-s-pups-splash", crown) + wrap("bd-s-pups-drops", drop(8, 66, 1.4, -35) + drop(112, 66, 1.4, 35) + drop(20, 46, 1, -20) + drop(101, 48, 1, 20)) + sparkle,
    neck: [60, 64, 15], cap: [60, 25, 0.8], css: CSS.leap, shadow: false,
  };
};

// ---------- signature animation CSS (every selector is scoped to a .bd-s-pups- class) ----------
const anim = (cls, name, time, frames, origin = "", ease = "ease-in-out") => `.bd-s-pups-${cls}{${origin ? `transform-origin:${origin};` : ""}animation:${name} ${time} ${ease} infinite}@keyframes ${name}{${frames}}`;
const swing = (a, b) => `0%,100%{transform:${a}}50%{transform:${b}}`;
const pop = anim("pop", "pupsPop", "1.4s", "0%,100%{opacity:1;transform:translateY(0)}50%{opacity:.45;transform:translateY(-3px)}");
const flash = anim("flash", "pupsFlash", ".6s", "0%,100%{opacity:1}50%{opacity:.25}");
const flagwag = (pose, o) => anim(`flag${pose}`, "pupsFlagwag", ".32s", swing("rotate(-9deg)", "rotate(11deg)"), o);
const dust = anim("dust", "pupsDust", ".6s", "0%{opacity:.95;transform:translateX(0)}100%{opacity:0;transform:translateX(-10px)}", "", "ease-out");
const drops = anim("drops", "pupsDrops", ".55s", "0%{opacity:1;transform:scale(.86)}100%{opacity:0;transform:scale(1.14)}", "60px 70px", "ease-out");
const notes = anim("notes", "pupsNotes", "1.1s", swing("translateY(2px)", "translateY(-6px)"));
const wheel = (cls, o) => anim(cls, "pupsWheel", "1s", "from{transform:rotate(0)}to{transform:rotate(360deg)}", o, "linear");
const trot = anim("trot", "pupsTrot", ".42s", swing("translateY(0)", "translateY(-3.4px)"));
const stiff = anim("stiff", "pupsStiff", ".5s", swing("rotate(-3deg)", "rotate(3deg)"), "80px 104px");

const CSS = {
  scream: anim("scream", "pupsScream", ".13s", swing("rotate(-5deg)", "rotate(5deg)"), "60px 70px", "linear") + anim("alarm", "pupsAlarm", ".26s", "0%,100%{opacity:1}50%{opacity:.2}") + pop + stiff,
  sniff: anim("sniff", "pupsSniff", ".5s", "0%,100%{transform:translate(0,0)}25%{transform:translate(3px,1px)}50%{transform:translate(-1px,-2px)}75%{transform:translate(4px,0)}") + anim("scent", "pupsScent", "1s", "0%{opacity:.35;transform:translate(2px,3px)}50%{opacity:1}100%{opacity:.35;transform:translate(-4px,-4px)}") + anim("earsway", "pupsEarsway", ".5s", swing("rotate(-6deg)", "rotate(7deg)"), "0px -9px") + flagwag("sniff", "17px 75px"),
  fetch: ".bd-s-pups-fetch{animation:pupsFetch .8s ease-in-out infinite}@keyframes pupsFetch{0%,100%{transform:translateY(0)}50%{transform:translateY(7px)}}" + flagwag("fetch", "22px 70px"),
  shake: anim("shake", "pupsShake", ".2s", swing("rotate(-8deg)", "rotate(8deg)"), "60px 104px", "linear") + anim("shakehead", "pupsShakehead", ".2s", swing("rotate(9deg)", "rotate(-9deg)"), "60px 62px", "linear") + anim("earflap", "pupsEarflap", ".16s", swing("rotate(-14deg)", "rotate(18deg)"), "42px 32px", "linear") + flagwag("shake", "80px 110px") + drops,
  sploot: anim("kick", "pupsKick", "1.3s", "0%,60%,100%{transform:rotate(0)}70%{transform:rotate(-8deg)}80%{transform:rotate(4deg)}90%{transform:rotate(-6deg)}", "40px 98px") + anim("loaf", "pupsLoaf", "2.2s", swing("rotate(-6deg)", "rotate(6deg)"), "60px 92px") + pop,
  dig: anim("dig1", "pupsDig1", ".26s", swing("translate(0,0)", "translate(-8px,-3px)"), "", "linear") + anim("dig2", "pupsDig2", ".26s", swing("translate(-8px,-3px)", "translate(0,0)"), "", "linear") + anim("nod", "pupsNod", ".52s", swing("translateY(0)", "translateY(3px)")) + anim("dirt", "pupsDirt", ".52s", "0%{opacity:1;transform:translate(6px,6px)}100%{opacity:.15;transform:translate(-9px,-7px)}", "", "ease-out") + flagwag("dig", "11px 82px"),
  crouch: anim("creep", "pupsCreep", "2s", "0%,20%{transform:translateX(0)}45%,60%{transform:translateX(3px)}80%,100%{transform:translateX(6px)}") + anim("tremble", "pupsTremble", ".24s", swing("translateX(0)", "translateX(1.8px)"), "", "linear") + flash,
  howl: anim("howl", "pupsHowl", "2s", "0%,100%{transform:rotate(0)}30%,70%{transform:rotate(-9deg)}", "68px 66px") + [1, 2, 3].map((i) => `.bd-s-pups-ring${i > 1 ? i : ""}{animation:pupsHring 1.2s ease-out ${(i - 1) * 0.2}s infinite}`).join("") + "@keyframes pupsHring{0%{opacity:.35}35%{opacity:1}100%{opacity:.1}}",
  prance: ".bd-s-pups-prance{transform-origin:60px 116px;animation:pupsPrance 1s ease-in-out infinite}@keyframes pupsPrance{0%,100%{transform:rotate(-7deg)}25%{transform:rotate(0) translateY(-2px)}50%{transform:rotate(7deg)}75%{transform:rotate(0) translateY(-2px)}}" + notes,
  zoom: anim("bound", "pupsBound", ".36s", "0%,100%{transform:translateY(-4px) rotate(-2deg)}50%{transform:translateY(3px) rotate(4deg)}", "50px 80px") + ".bd-s-pups-legsA{animation:pupsLegsA .36s steps(1) infinite}.bd-s-pups-legsB{opacity:0;animation:pupsLegsB .36s steps(1) infinite}@keyframes pupsLegsA{0%{opacity:1}50%{opacity:0}}@keyframes pupsLegsB{0%{opacity:0}50%{opacity:1}}" + anim("speed", "pupsSpeed", ".36s", "0%{opacity:1;transform:translateX(4px)}100%{opacity:.2;transform:translateX(-8px)}", "", "linear") + dust,
  wiggle: anim("wiggle", "pupsWiggle", ".42s", swing("rotate(-7deg)", "rotate(7deg)"), "60px 118px") + anim("grin", "pupsGrin", ".84s", swing("rotate(-5deg)", "rotate(5deg)"), "60px 66px") + anim("wave", "pupsWave", ".42s", swing("rotate(-12deg)", "rotate(12deg)"), "80px 90px") + flagwag("wiggle", "90px 98px") + pop,
  hop: anim("hop", "pupsHop", ".62s", "0%,100%{transform:translateY(0) rotate(0)}45%{transform:translateY(-3px) rotate(-3deg)}80%{transform:translateY(6px) rotate(4deg)}", "50px 100px") + flagwag("hop", "20px 78px") + dust + pop,
  bow: anim("bow", "pupsBow", ".8s", "0%,100%{transform:rotate(0)}30%{transform:rotate(4deg)}60%{transform:rotate(-3deg)}", "80px 112px") + flagwag("bow", "16px 62px") + flash + pop,
  cart: wheel("cartwheel", "19px 102px") + trot + anim("rattle", "pupsRattle", ".28s", swing("translateY(0)", "translateY(-1.6px)")) + dust,
  roach: anim("twitch", "pupsTwitch", "2.2s", "0%,60%,100%{transform:rotate(0)}68%{transform:rotate(5deg)}76%{transform:rotate(-3deg)}84%{transform:rotate(3deg)}", "50px 96px") + anim("twitch2", "pupsTwitch2", "2.6s", "0%,30%,60%,100%{transform:rotate(0)}40%{transform:rotate(-5deg)}50%{transform:rotate(3deg)}", "60px 96px") + anim("zzz", "pupsZzz", "2.4s", "0%{opacity:.4;transform:translate(0,3px)}50%{opacity:1}100%{opacity:.4;transform:translate(3px,-6px)}"),
  yodel: anim("yodel", "pupsYodel", ".7s", "0%,100%{transform:translateY(0) rotate(0)}25%{transform:translateY(-2px) rotate(-6deg)}50%{transform:translateY(1px) rotate(1deg)}75%{transform:translateY(-1px) rotate(-3deg)}", "60px 68px") + flash + notes + pop + stiff,
  flutter: anim("wing", "pupsWing", ".3s", swing("rotate(-13deg)", "rotate(3deg)"), "48px 48px") + anim("pap", "pupsPap", ".9s", swing("translateY(3px)", "translateY(-1px)")) + anim("flit", "pupsFlit", "1.3s", "0%,100%{transform:translate(0,0)}33%{transform:translate(-9px,8px)}66%{transform:translate(5px,12px)}") + anim("flit2", "pupsFlit2", "1.7s", swing("translate(0,0)", "translate(7px,-12px)")) + flagwag("flutter", "78px 108px") + pop,
  blep: anim("blep", "pupsBlep", ".55s", swing("scaleY(1)", "scaleY(.82)"), "60px 70px") + anim("tilt", "pupsTilt", "2.2s", swing("rotate(-3deg)", "rotate(3deg)"), "60px 80px") + pop,
  swim: anim("swim", "pupsSwim", "1.5s", "0%,100%{transform:translateY(0) rotate(-2deg)}50%{transform:translateY(4px) rotate(2deg)}", "60px 90px") + anim("wave1", "pupsWave1", "1.4s", "0%,100%{transform:translateX(-4px)}50%{transform:translateX(4px)}") + anim("wave2", "pupsWave2", "1s", "0%,100%{transform:translateX(4px)}50%{transform:translateX(-4px)}") + anim("paddle", "pupsPaddle", ".6s", swing("translate(0,0)", "translate(7px,-7px)")) + anim("paddle2", "pupsPaddle2", ".6s", swing("translate(7px,-8px)", "translate(0,0)")) + drops,
  lean: anim("lean", "pupsLean", "2.4s", swing("skewX(-1deg)", "skewX(3deg)"), "52px 116px") + pop,
  trot: wheel("coachwheel", "26px 90px") + trot + anim("step", "pupsStep", ".42s", swing("rotate(0)", "rotate(20deg)"), "86px 84px") + dust + ".bd-s-pups-trot .bd-wag{animation-duration:.5s}",
  leap: anim("leap", "pupsLeap", "1.1s", swing("translateY(9px)", "translateY(-9px)")) + anim("splash", "pupsSplash", "1.1s", swing("scale(1.04,1)", "scale(.86,.7)"), "60px 120px") + anim("glint", "pupsGlint", "1.1s", "0%,100%{opacity:.55}50%{opacity:1}") + drops,
};

export default function art(o) {
  const key = String(o.id).replace(/^pups_/, "");
  const draw = D[key] || D.patch;
  const r = draw({ c: o.c, b: o.b, a: o.a }, o.mood || "happy", o.act === "signature");
  const sigClass = { labyellow: "fetch", poodle: "prance" }[key];
  return frame({
    name: o.name, size: o.size, tier: o.tier, accent: o.a, stage: o.stage || 1,
    ...r,
    wrapClass: o.act === "signature" && sigClass && r.css ? `bd-s-pups-${sigClass}` : r.wrapClass,
  });
}
