// Amberfall Hatchery art: thirty prehistoric animals drawn side-on and facing right, each with its own
// anatomy and field marks, plus signature behaviour animations. Sea creatures arrive in a rolling tub.
import { INK, el, dot, p, ln, dots, eye, scarf, hat, frame } from "./artkit.js";

// ---------- small helpers ----------
const n = (v) => Math.round(v * 10) / 10;
const at = (t, s) => `<g transform="${t}">${s}</g>`;
const edge = (c, w = 1.4) => `stroke="${c}" stroke-width="${w}" stroke-linejoin="round"`;
const op = (v) => `opacity="${v}"`;
/** Darken (k < 0) or lighten (k > 0) a #rrggbb colour. */
export function tone(hex, k) {
  const v = parseInt(hex.slice(1), 16);
  return `#${[16, 8, 0].map((s) => { const c = (v >> s) & 255; return Math.round(k < 0 ? c * (1 + k) : c + (255 - c) * k).toString(16).padStart(2, "0"); }).join("")}`;
}
const smile = (x, y, mood, col = INK, w = 9) => ln(mood === "sad" ? `M${x} ${y + 3}q${w / 2} -5 ${w} 0` : `M${x} ${y}q${w / 2} 5 ${w} 0`, col, 1.8);
const cheek = (x, y) => el(x, y, 3.4, 2.2, "#ff7f9c", op(0.55));

// Signature motion. `move` wraps a part in an animated group only while the behaviour plays.
const swing = (a, b = -a) => `0%,100%{transform:rotate(${b}deg)}50%{transform:rotate(${a}deg)}`;
const blink = "0%,100%{opacity:0}35%,70%{opacity:1}";
function motion(sig) {
  const css = [];
  const move = (name, svg, dur, frames, origin = "60px 118px") => {
    if (!sig) return svg;
    css.push(`.bd-s-amber-${name}{transform-origin:${origin};animation:amber-${name} ${dur} ease-in-out infinite}@keyframes amber-${name}{${frames}}`);
    return `<g class="bd-s-amber-${name}">${svg}</g>`;
  };
  /** A decoration that only exists while the behaviour plays. */
  const extra = (name, svg, dur, frames, origin) => (sig ? move(name, svg, dur, frames, origin) : "");
  return { sig, move, extra, css: () => css.join("") };
}

// ---------- shared anatomy ----------
const claws = (x, y, col = "#f4ead0") => ln(`M${x} ${y}l3 1.500M${x - 3.5} ${y + 0.5}l2.500 1.600`, col, 1.6);
/** A bird-like hind leg: drumstick thigh, backward ankle, three-toed foot on the ground. */
const bird = (x, y, col, k = 1) => `${el(x, y, n(9 * k), n(13 * k), col, edge(tone(col, -0.35)))}${ln(`M${x + 1} ${y + 8}L${x - 6} 106L${x + 1} 115`, col, n(6.5 * k))}${ln(`M${x} 115.500h11M${x + 1} 115l8 -3.500`, col, n(3.6 * k))}${claws(x + 11, 115)}`;
/** A pillar leg with rounded toes. */
const post = (x, y, w, col) => `${p(`M${x} ${y}h${w}L${x + w + 1} 113q0 5 -5 5H${x + 4}q-5 0 -5 -5Z`, col, edge(tone(col, -0.35)))}${dots([[x + w * 0.35, 116], [x + w * 0.75, 116]], 1.7, "#f4ead0")}`;
/** Four pillar legs: the far pair first and darker, then the near pair. */
const legs4 = (col, [fb, ff, nb, nf], y = 86, w = 12) => ({ far: post(fb, y, w, tone(col, -0.28)) + post(ff, y, w, tone(col, -0.28)), near: post(nb, y + 3, w, col) + post(nf, y + 3, w, col) });
const stripes = (list, col, w = 3.4, o = 0.55) => list.map((d) => ln(d, col, w, op(o))).join("");
/** Overlapping leaf-shaped feathers fanned from a root point. */
const fan = (x, y, angles, len, wide, col, tip) => angles.map((a) => at(`translate(${x} ${y}) rotate(${a})`, p(`M0 0Q${n(len * 0.55)} ${-wide} ${len} 0Q${n(len * 0.55)} ${wide} 0 0Z`, col, edge(tone(col, -0.4), 1)) + (tip ? p(`M${n(len * 0.66)} ${n(-wide * 0.34)}Q${n(len * 0.85)} ${n(-wide * 0.3)} ${len} 0Q${n(len * 0.85)} ${n(wide * 0.3)} ${n(len * 0.66)} ${n(wide * 0.34)}Z`, tip) : ""))).join("");
const waves = (x, y, col) => ln(`M${x} ${y - 8}q7 8 0 16M${x + 7} ${y - 13}q11 13 0 26`, col, 2.2);
const bubbles = (list) => list.map(([x, y, r]) => dot(x, y, r, "#e8fbff", `stroke="#6ac8e0" stroke-width="1.2" opacity=".85"`)).join("");
/** The front of the rolling water tub that sea creatures travel in. */
const tub = () => `${p("M10 100Q22 94 34 100T60 100T86 100T110 100L106 113Q104 118 96 118H24Q16 118 14 113Z", "#58c0dc", `opacity=".82"`)}${ln("M10 100Q22 94 34 100T60 100T86 100T110 100", "#e8fbff", 2.4)}${p("M16 109H104L101 115Q100 118 94 118H26Q20 118 19 115Z", "#a8703c", edge("#5a3418"))}${dots([[30, 119], [90, 119]], 3.6, "#5a3418")}`;

// ---------- small theropods and plant-eating bipeds ----------
function compsognathus(k, mood, M) {
  const d = tone(k.c, -0.25);
  const tail = ln("M44 84Q24 82 6 62", k.c, 8) + ln("M24 79Q14 72 6 62", k.c, 4);
  const head = p("M74 40Q86 30 96 40L113 49Q114 54 106 55L86 58Q72 56 74 40Z", k.c, edge(k.a)) + p("M84 55L106 53L90 61Z", k.b) + eye(86, 44, mood, { r: 4.4 }) + dot(108, 48, 1.1, k.a) + smile(94, 53, mood, k.a) + cheek(80, 52);
  const lizard = p("M96 108q8 -8 17 -2q-7 7 -17 2Z", "#e8a83c", edge("#8a5a10", 1)) + ln("M96 108q-7 1 -9 7M100 111l-2 5M108 111l3 5", "#c88418", 2) + dot(110, 105, 1.2, INK);
  const body = `${M.move("compy-tail", tail, ".5s", swing(6), "44px 84px")}${bird(60, 90, d, 0.75)}${el(56, 83, 19, 13, k.c, edge(k.a))}${el(60, 88, 13, 7, k.b)}${stripes(["M44 74l4 7", "M52 71l3 8", "M61 71l2 8"], k.a, 2.6)}${ln("M68 78Q76 70 80 54", k.c, 11)}${ln("M72 78Q80 70 83 58", k.b, 4)}${bird(48, 90, k.c, 0.8)}${ln("M68 86l8 6l5 -2", d, 3.6)}${head}${M.extra("compy-lizard", lizard, ".7s", "0%,100%{transform:translate(0,0)}50%{transform:translate(6px,-5px)}")}`;
  return { body: M.move("compy-run", body, ".35s", "0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}"), neck: [75, 66, 8], cap: [85, 35, 0.5] };
}

function psittacosaurus(k, mood, M) {
  const d = tone(k.c, -0.25);
  const bristles = Array.from({ length: 9 }, (_, i) => ln(`M${n(38 - i * 3.4)} ${n(76 - i * 1.5)}q${n(-4 - i * 0.2)} -12 ${n(-9 - i * 0.3)} -17`, k.a, 2)).join("");
  const tail = `${bristles}${p("M46 72Q22 70 4 56Q16 82 44 94Z", k.c, edge(k.a))}`;
  const head = p("M68 44Q80 28 96 38Q106 42 108 52L112 60L102 62Q92 70 76 64Q66 58 68 44Z", k.c, edge(k.a)) + p("M100 44Q114 48 110 62L104 58L98 62Z", "#5a4030", edge("#2c1c10", 1)) + p("M74 58L66 66L82 63Z", k.b, edge(k.a, 1)) + eye(86, 46, mood, { r: 4.8 }) + smile(88, 58, mood, k.a) + cheek(78, 55);
  const body = `${M.move("psitt-tail", tail, "1s", swing(9, -7), "44px 82px")}${bird(62, 90, d)}${el(57, 82, 23, 18, k.c, edge(k.a))}${el(62, 89, 15, 9, k.b)}${bird(48, 90, k.c)}${ln("M68 74L78 66", k.c, 17)}${ln("M70 86l7 9l7 -3", d, 5)}${head}`;
  return { body, neck: [76, 68, 11], cap: [84, 34, 0.6] };
}

function dryosaurus(k, mood, M) {
  const d = tone(k.c, -0.25);
  const body = `${p("M44 66Q20 62 3 44Q14 74 42 86Z", k.c, edge(k.a))}${bird(63, 84, d)}${el(56, 74, 21, 15, k.c, edge(k.a))}${el(61, 80, 13, 7, k.b)}${stripes(["M40 66Q56 56 72 66", "M30 66l6 8", "M20 59l5 8"], k.a)}${ln("M68 70Q80 62 82 42", k.c, 11)}${bird(49, 84, k.c, 1.05)}${ln("M70 78l7 9l6 -2", d, 4)}${p("M74 32Q84 20 96 30L108 38Q108 45 100 46L84 48Q72 44 74 32Z", k.c, edge(k.a))}${p("M100 34Q112 38 107 45L100 43Z", "#c8a05c", edge("#6a4820", 1))}${eye(86, 33, mood, { r: 4.8 })}${smile(92, 41, mood, k.a, 8)}${cheek(80, 41)}`;
  return { body, neck: [77, 55, 8], cap: [84, 24, 0.5] };
}

function parasaurolophus(k, mood, M) {
  const d = tone(k.c, -0.25);
  const crest = p("M84 40Q60 12 22 18Q18 24 26 27Q52 28 74 48Z", k.a, edge(tone(k.a, -0.4))) + ln("M28 22Q54 22 78 43", tone(k.a, 0.4), 2);
  const head = `${crest}${p("M72 46Q82 32 96 40L112 52Q116 62 106 62L88 62Q72 60 72 46Z", k.c, edge(tone(k.c, -0.4)))}${p("M102 50Q117 54 114 62H102Z", "#5a4030", edge("#2c1c10", 1))}${eye(86, 47, mood, { r: 4.6 })}${smile(93, 56, mood, tone(k.c, -0.5))}${cheek(80, 56)}`;
  const body = `${p("M40 68Q18 68 3 54Q12 80 40 92Z", k.c, edge(tone(k.c, -0.4)))}${bird(60, 88, d, 1.1)}${el(52, 80, 25, 19, k.c, edge(tone(k.c, -0.4)))}${el(57, 88, 16, 9, k.b)}${stripes(["M36 70l5 10", "M46 64l3 11", "M58 64l1 11"], k.a)}${post(70, 90, 8, d)}${ln("M66 74Q78 66 80 54", k.c, 15)}${bird(44, 89, k.c, 1.15)}${post(76, 88, 9, k.c)}${head}${M.extra("para-call", waves(8, 38, "#fff4c8"), "1s", blink)}`;
  return { body, neck: [76, 66, 10], cap: [90, 37, 0.55] };
}

function pachycephalosaurus(k, mood, M) {
  const d = tone(k.c, -0.25);
  const head = `${el(86, 44, 19, 17, k.a, edge(tone(k.a, -0.4)))}${p("M70 48Q80 38 100 46L112 56Q114 64 104 66L84 66Q70 62 70 48Z", k.c, edge(tone(k.c, -0.4)))}${el(84, 33, 10, 5, "#fff", op(0.35))}${dots([[69, 49], [71, 56], [76, 61], [106, 50], [111, 54]], 2.8, k.b)}${eye(89, 51, mood, { r: 4.6 })}${smile(94, 60, mood, tone(k.c, -0.55))}${cheek(82, 59)}`;
  const body = `${p("M42 68Q20 68 4 56Q14 80 40 90Z", k.c, edge(tone(k.c, -0.4)))}${bird(62, 88, d)}${el(54, 80, 23, 18, k.c, edge(tone(k.c, -0.4)))}${el(59, 88, 15, 8, k.b)}${bird(46, 89, k.c, 1.1)}${ln("M66 76L78 62", k.c, 15)}${ln("M68 84l8 8l6 -3", d, 4.6)}${M.move("pachy-bow", head, "1.8s", "0%,20%,100%{transform:rotate(0)}50%,70%{transform:rotate(22deg)}", "74px 62px")}`;
  return { body, neck: [75, 68, 10], cap: [86, 28, 0.6] };
}

// ---------- feathered hunters ----------
function microraptor(k, mood, M) {
  const glint = k.a;
  const tail = ln("M46 80L16 90", k.c, 5) + fan(18, 90, [150, 172, 196], 18, 6, k.c, glint);
  const wing = (x, y, flip) => fan(x, y, flip ? [122, 140, 158, 176] : [112, 132, 152, 170], 30, 7, k.b, glint);
  const legWing = fan(54, 96, [118, 142, 166], 22, 6, k.c, glint);
  const body = `${tail}${M.move("micro-far", wing(66, 70, true), ".9s", swing(26, 4), "66px 70px")}${bird(60, 94, tone(k.c, 0.1), 0.65)}${el(57, 80, 18, 13, k.c, edge("#101424"))}${el(62, 85, 10, 6, k.b)}${legWing}${bird(49, 94, k.c, 0.7)}${ln("M66 74Q74 66 78 56", k.c, 11)}${fan(76, 42, [-160, -128, -100], 15, 4, k.b, glint)}${p("M70 44Q82 30 94 42L110 50Q108 55 100 55L84 58Q70 56 70 44Z", k.c, edge("#101424"))}${p("M96 45L112 51L98 54Z", "#8a8894")}${eye(84, 45, mood, { r: 4.8, ring: "#e8c84a" })}${M.move("micro-near", wing(62, 78, false), ".9s", swing(30, -2), "62px 78px")}${ln("M60 70q8 -4 14 2", glint, 2, op(0.8))}`;
  return { body, all: M.sig ? ["micro-glide", "2.6s", "0%,100%{transform:translate(0,-4px) rotate(-5deg)}50%{transform:translate(3px,-14px) rotate(5deg)}", "60px 80px"] : null, neck: [73, 64, 8], cap: [82, 34, 0.5] };
}

function velociraptor(k, mood, M) {
  const d = tone(k.c, -0.28);
  const sickle = ln("M62 112q9 -4 8 -14", "#f4ead0", 3);
  const tail = ln("M42 78Q22 72 12 62", k.c, 11) + fan(14, 63, [185, 210, 235], 17, 5, k.a, k.b);
  const arm = fan(64, 80, [108, 130, 152], 24, 6, k.a, k.b) + ln("M64 80l12 10l8 -2", k.c, 5) + claws(84, 88);
  const body = `${tail}${bird(65, 88, d)}${el(54, 79, 23, 16, k.c, edge(k.a))}${el(60, 86, 14, 8, k.b)}${stripes(["M40 70l5 8", "M50 65l3 9", "M62 66l1 8"], k.a)}${ln("M68 74Q80 66 82 50", k.c, 14)}${bird(48, 89, k.c, 1.05)}${M.move("raptor-claw", sickle, ".5s", "0%,45%,100%{transform:rotate(0)}65%{transform:rotate(-28deg)}80%{transform:rotate(8deg)}", "62px 112px")}${fan(80, 36, [-172, -148, -124], 15, 4, k.a)}${p("M73 40Q84 27 96 37L116 48Q116 53 108 54L86 56Q72 52 73 40Z", k.c, edge(k.a))}${p("M86 52L112 52L106 59L92 59Z", k.b, edge(k.a, 1))}${ln("M96 54l2 3l2 -3M104 53l2 3l2 -3", "#fff", 1.4)}${eye(87, 41, mood, { r: 4.4, ring: "#f0a828" })}${dot(110, 47, 1.1, INK)}${arm}${M.extra("raptor-tap", ln("M74 108l5 -4M76 115h7", "#fff4c8", 2), ".5s", blink)}`;
  return { body, neck: [76, 62, 9], cap: [84, 31, 0.5] };
}

function archaeopteryx(k, mood, M) {
  const tail = ln("M46 82Q28 88 12 100", k.c, 4) + [0, 1, 2, 3].map((i) => fan(42 - i * 9, 85 + i * 4.6, [118, 208], 13, 4, k.c, k.a)).join("");
  const wing = (x, y, col) => fan(x, y, [118, 136, 154, 172, 190], 33, 7, col, k.a);
  const body = `${tail}${M.move("arch-far", wing(68, 68, tone(k.c, -0.2)), ".55s", swing(34, -6), "68px 68px")}${bird(61, 92, "#c89858", 0.62)}${el(57, 79, 19, 15, k.c, edge("#121018"))}${el(63, 84, 11, 8, k.b)}${bird(50, 92, "#d8a868", 0.66)}${ln("M66 72Q74 62 78 54", k.c, 12)}${el(84, 46, 14, 13, k.c, edge("#121018"))}${p("M92 42L112 50L93 56Z", "#c8a878", edge("#6a5030", 1))}${ln("M97 51l1.500 3l1.500 -3M103 51l1.500 2.500l1.500 -2.500", "#fff", 1.2)}${eye(85, 44, mood, { r: 4.8, rim: 1 })}${cheek(78, 52)}${fan(81, 33, [-120, -96], 11, 3, k.a)}${M.move("arch-near", wing(63, 74, k.c) + claws(65, 71, "#e8d8b0") + claws(70, 76, "#e8d8b0"), ".55s", swing(40, -4), "63px 74px")}`;
  return { body, all: M.sig ? ["arch-hop", ".55s", "0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}", "60px 100px"] : null, neck: [74, 61, 9], cap: [82, 35, 0.5] };
}

function anchiornis(k, mood, M) {
  const barred = (x, y, angles, len) => fan(x, y, angles, len, 7, k.b, k.c) + fan(x, y, angles, len * 0.55, 5, k.c);
  const crest = fan(82, 38, [-168, -140, -112, -86], 20, 5, k.a, tone(k.a, 0.35));
  const body = `${ln("M46 80Q30 78 16 68", k.c, 5)}${fan(19, 70, [180, 208, 236], 17, 5, k.c, k.b)}${barred(66, 70, [120, 142, 164], 28)}${bird(61, 93, "#5a5864", 0.65)}${el(57, 80, 19, 14, k.c, edge("#141418"))}${el(62, 85, 11, 7, "#6a6a74")}${fan(52, 96, [122, 148], 20, 5, k.b, k.c)}${bird(49, 93, "#6a6874", 0.7)}${ln("M66 74Q74 66 79 56", k.c, 12)}${M.move("anch-crest", crest, ".8s", "0%,100%{transform:scale(.8) rotate(-6deg)}50%{transform:scale(1.28) rotate(6deg)}", "82px 40px")}${el(84, 48, 14, 12, "#585862", edge("#141418"))}${p("M92 44L110 52L93 57Z", "#3a3438")}${dots([[76, 53], [81, 56], [94, 40]], 1.6, k.a)}${eye(86, 46, mood, { r: 4.6, rim: 1.2 })}${barred(61, 76, [112, 134, 156, 178], 31)}${M.extra("anch-spark", ln("M60 22l5 5M65 22l-5 5M104 28h8M108 24v8", "#ffd84d", 2), ".8s", blink)}`;
  return { body, neck: [74, 63, 9], cap: [90, 37, 0.45] };
}

// ---------- great hunters ----------
function tyrannosaurus(k, mood, M) {
  const d = tone(k.c, -0.28);
  const head = `${p("M62 40Q70 18 90 22Q108 22 116 36Q120 48 112 52L78 58Q62 56 62 40Z", k.c, edge(tone(k.c, -0.45), 1.8))}${p("M74 54L112 50Q112 62 98 65L82 65Q74 62 74 54Z", k.b, edge(tone(k.c, -0.45)))}${ln("M82 55l3 5l3 -5.500l3 5l3 -5.500l3 5l3 -5.500l3 5l3 -5.500", "#fffdf2", 1.8)}${p("M72 26Q80 18 88 26Z", k.a)}${eye(82, 34, mood, { r: 5, ring: "#f0b828" })}${dots([[108, 34], [101, 28]], 1.4, d)}${cheek(72, 47)}`;
  const rings = ln("M104 66q10 6 8 18M112 64q12 9 9 26", "#fff0c0", 2.4);
  const body = `${p("M36 66Q14 64 2 46Q6 78 36 94Z", k.c, edge(tone(k.c, -0.45)))}${bird(64, 86, d, 1.3)}${el(50, 76, 27, 21, k.c, edge(tone(k.c, -0.45), 1.8))}${el(58, 86, 17, 10, k.b)}${stripes(["M32 66l7 10", "M44 58l4 12", "M58 57l1 12"], k.a, 4)}${ln("M60 70Q72 62 76 50", k.c, 22)}${M.extra("rex-throat", el(78, 62, 11, 8, tone(k.a, 0.25)), "1.2s", "0%,100%{transform:scale(.75)}50%{transform:scale(1.25)}", "78px 62px")}${bird(42, 87, k.c, 1.35)}${ln("M70 76l8 6l-1 6", k.c, 4.6)}${claws(77, 88)}${head}${M.extra("rex-rumble", rings, "1.2s", blink)}`;
  return { body: M.move("rex-shake", body, ".25s", "0%,100%{transform:translateX(-.8px)}50%{transform:translateX(.8px)}"), neck: [72, 66, 12], cap: [84, 22, 0.7] };
}

function spinosaurus(k, mood, M) {
  const d = tone(k.c, -0.25);
  const sail = p("M24 72Q26 36 46 28Q66 24 74 66Z", k.a, edge(tone(k.a, -0.4), 1.8)) + ln("M31 70L34 44M40 70L43 32M50 68L53 30M60 66L63 40M68 66L70 52", tone(k.a, -0.3), 2);
  const head = p("M70 46Q80 34 92 44L117 54Q121 62 112 62L90 62Q72 62 70 46Z", k.c, edge(tone(k.c, -0.45))) + ln("M92 56L114 58M96 56l1.500 4M103 57l1.500 4M110 57.500l1 4", "#fffdf2", 1.5) + dot(116, 56, 2.4, d) + p("M80 40l6 -7l4 8Z", k.a) + eye(84, 48, mood, { r: 4.6, ring: "#e8c83c" }) + cheek(78, 57);
  const fish = p("M96 92q10 -9 18 0q-8 9 -18 0Z", "#c8e0f0", edge("#4a7898", 1)) + p("M97 92l-7 -6v12Z", "#c8e0f0", edge("#4a7898", 1)) + dot(110, 90, 1.2, INK);
  const body = `${sail}${p("M34 72Q14 74 3 58Q8 88 34 94Z", k.c, edge(tone(k.c, -0.45)))}${bird(62, 88, d, 1.15)}${el(50, 79, 27, 18, k.c, edge(tone(k.c, -0.45), 1.8))}${el(57, 87, 17, 8, k.b)}${bird(40, 89, k.c, 1.2)}${M.move("spino-dip", `${ln("M66 76Q76 68 78 54", k.c, 16)}${head}${ln("M70 82l9 9l7 -2", k.c, 5)}${claws(86, 89)}`, "2s", "0%,20%,100%{transform:rotate(0)}50%,68%{transform:rotate(24deg)}", "66px 76px")}${M.extra("spino-fish", fish, "2s", "0%,100%{transform:translateY(4px)}50%{transform:translateY(-6px)}")}${tub()}`;
  return { body, neck: [74, 65, 10], cap: [82, 36, 0.55] };
}

// ---------- horned, plated and armoured plant eaters ----------
function protoceratops(k, mood, M) {
  const far = legs4(k.c, [36, 70, 24, 58], 92, 11);
  const frill = p("M60 68Q50 32 76 34Q98 36 94 62Z", k.b, edge(k.a, 2)) + dots([[64, 47], [74, 40], [85, 44]], 3, tone(k.c, -0.1));
  const head = `${frill}${p("M66 62Q80 46 96 60L108 74Q110 82 100 82L82 84Q64 80 66 62Z", k.c, edge(k.a))}${p("M99 66Q114 70 108 84L102 78L96 82Z", "#6a4a30", edge("#33200f", 1))}${p("M78 78l-6 9l12 -5Z", k.b, edge(k.a, 1))}${eye(84, 65, mood, { r: 4.8 })}${smile(88, 77, mood, k.a, 8)}${cheek(76, 74)}`;
  const body = `${p("M30 84Q16 86 6 104Q22 100 36 98Z", k.c, edge(k.a))}${far.far}${el(50, 88, 27, 17, k.c, edge(k.a))}${el(52, 96, 19, 7, k.b)}${stripes(["M34 78q6 -5 12 -4", "M50 72q8 -1 12 3"], k.a)}${far.near}${head}`;
  return { body, neck: [72, 82, 11], cap: [78, 34, 0.6] };
}

function triceratops(k, mood, M) {
  const far = legs4(k.c, [34, 68, 20, 54], 84, 13);
  const horn = (d) => p(d, "#f6ecd0", edge("#8a7448", 1.2));
  const frill = p("M54 64Q42 14 78 16Q106 20 94 58Z", k.a, edge(tone(k.a, -0.4), 2)) + p("M61 58Q54 28 77 28Q94 30 87 54Z", tone(k.a, 0.35)) + dots([[52, 40], [58, 27], [69, 19], [82, 19], [93, 28], [97, 41]], 3, "#f6ecd0");
  const head = `${frill}${horn("M78 44Q84 22 104 14Q94 30 90 46Z")}${p("M66 56Q80 40 96 54L110 70Q112 80 102 82L84 84Q64 78 66 56Z", k.c, edge(tone(k.c, -0.45)))}${p("M101 62Q117 68 110 84L103 76L97 80Z", "#5a4a38", edge("#2c2418", 1))}${horn("M88 48Q100 28 117 24Q106 38 100 54Z")}${horn("M101 62Q103 52 110 50Q108 58 108 66Z")}${eye(84, 60, mood, { r: 4.8 })}${smile(88, 73, mood, tone(k.c, -0.55))}${cheek(76, 70)}`;
  const body = `${p("M28 76Q10 80 3 100Q20 94 32 92Z", k.c, edge(tone(k.c, -0.45)))}${far.far}${el(48, 80, 31, 23, k.c, edge(tone(k.c, -0.45), 1.8))}${el(50, 92, 22, 9, k.b)}${dots([[34, 70], [44, 64], [38, 80], [54, 70]], 2, tone(k.c, 0.25))}${far.near}${M.move("tri-nod", head, "1.6s", "0%,100%{transform:rotate(-7deg)}50%{transform:rotate(11deg)}", "70px 74px")}`;
  return { body, neck: [70, 82, 13], cap: [76, 18, 0.65] };
}

function stegosaurus(k, mood, M) {
  const far = legs4(k.c, [36, 66, 22, 54], 86, 12);
  const plate = (x, y, h, col) => p(`M${x - h * 0.45} ${y}Q${x - h * 0.55} ${y - h * 0.6} ${x} ${y - h}Q${x + h * 0.55} ${y - h * 0.6} ${x + h * 0.45} ${y}Z`, col, edge(tone(col, -0.4), 1.4));
  const farPlates = [[34, 70, 18], [49, 62, 24], [64, 66, 19]].map(([x, y, h]) => plate(x, y, h, tone(k.a, -0.3))).join("");
  const nearPlates = [[26, 76, 17], [41, 66, 27], [58, 63, 29], [74, 72, 18]].map(([x, y, h]) => plate(x, y, h, k.a)).join("");
  const spikes = ln("M13 86L6 66M19 87L18 66M12 90L2 80M18 92L9 104", "#f6ecd0", 4);
  const tail = `${p("M32 72Q16 76 8 88Q20 96 36 94Z", k.c, edge(tone(k.c, -0.4)))}${spikes}`;
  const head = ln("M72 82Q84 86 92 90", k.c, 14) + p("M86 82Q98 76 108 86L116 94Q114 101 104 100L90 100Q82 94 86 82Z", k.c, edge(tone(k.c, -0.4))) + p("M110 88Q119 94 112 100L108 96Z", "#5a4a30") + eye(96, 88, mood, { r: 4.2 }) + smile(100, 95, mood, tone(k.c, -0.55), 7) + cheek(90, 95);
  const body = `${farPlates}${M.move("stego-tail", tail, "1.1s", swing(17, -13), "32px 82px")}${far.far}${p("M24 90Q24 60 52 60Q80 62 82 88Q70 102 50 102Q30 102 24 90Z", k.c, edge(tone(k.c, -0.4), 1.8))}${el(52, 95, 21, 6, k.b)}${nearPlates}${far.near}${head}${M.extra("stego-swish", ln("M3 56q-3 8 0 14M24 56q5 5 5 11", "#fff4c8", 2), "1.1s", blink)}`;
  return { body, neck: [84, 91, 8], cap: [95, 81, 0.45] };
}

function ankylosaurus(k, mood, M) {
  const far = legs4(k.c, [34, 70, 22, 58], 94, 12);
  const scute = (x, y, r) => p(`M${x - r} ${y}Q${x - r * 0.3} ${y - r * 1.7} ${x + r * 0.5} ${y - r * 1.5}Q${x + r} ${y - r * 0.5} ${x + r} ${y}Z`, k.b, edge(k.a, 1.2));
  const tail = ln("M28 88Q16 92 12 96", k.c, 10) + el(11, 97, 10, 9, k.a, edge(tone(k.a, -0.4), 1.6)) + dots([[7, 93], [14, 101]], 2.6, k.b);
  const head = p("M74 78Q88 68 102 78L112 90Q112 100 100 100L82 102Q70 94 74 78Z", k.c, edge(k.a)) + p("M76 76L72 62L86 72Z", k.b, edge(k.a, 1.2)) + p("M92 71L100 62L103 77Z", k.b, edge(k.a, 1.2)) + p("M104 86Q116 90 110 100L103 97Z", "#5a4228") + eye(90, 83, mood, { r: 4.4 }) + smile(94, 93, mood, k.a, 8) + cheek(83, 92);
  const body = `${far.far}${M.move("anky-club", tail, "1s", "0%,100%{transform:rotate(26deg)}45%{transform:rotate(-14deg)}60%{transform:rotate(-8deg)}", "28px 88px")}${p("M20 96Q22 66 52 64Q82 66 86 94Q72 106 52 106Q30 106 20 96Z", k.c, edge(k.a, 1.8))}${[[30, 78, 5], [43, 70, 6], [58, 69, 6], [72, 76, 5], [36, 89, 4.5], [52, 84, 5], [68, 89, 4.5]].map(([x, y, r]) => scute(x, y, r)).join("")}${[22, 34, 48, 62].map((x, i) => p(`M${x} ${97 + (i % 2) * 3}l-6 7l12 -2Z`, k.b, edge(k.a, 1))).join("")}${far.near}${head}${M.extra("anky-dust", dots([[6, 114], [16, 117], [24, 112]], 3.4, "#e8d4a8"), "1s", "0%,35%,100%{opacity:0}50%,70%{opacity:1}")}`;
  return { body, neck: [80, 96, 10], cap: [92, 71, 0.5] };
}

function borealopelta(k, mood, M) {
  const far = legs4(k.c, [34, 70, 22, 58], 92, 12);
  const spike = (d) => p(d, k.a, edge("#1c100c", 1.2));
  const shield = [[28, 82], [37, 74], [48, 70], [59, 71], [69, 76], [34, 90], [46, 83], [58, 83], [69, 89]].map(([x, y]) => el(x, y, 5, 3.6, tone(k.c, -0.22), edge(k.a, 1))).join("");
  const head = p("M76 74Q88 64 102 74L112 86Q112 96 100 96L84 98Q72 90 76 74Z", k.c, edge(k.a)) + p("M80 70q10 -7 20 3", "none", `stroke="${k.a}" stroke-width="4"`) + p("M104 82Q116 86 110 96L103 93Z", k.a) + eye(91, 80, mood, { r: 4.4, ring: tone(k.b, 0.3) }) + smile(95, 90, mood, k.a, 8) + cheek(84, 88);
  const animal = `${p("M28 82Q12 84 3 104Q18 100 34 96Z", k.c, edge(k.a))}${far.far}${p("M22 94Q22 66 52 64Q80 66 84 92Q70 104 52 104Q32 104 22 94Z", k.c, edge(k.a, 1.8))}${el(52, 98, 24, 6, k.b)}${shield}${spike("M66 74Q76 52 100 46Q86 62 78 78Z")}${spike("M56 68Q58 56 68 50Q66 62 66 70Z")}${spike("M42 68Q40 58 47 52Q49 62 51 68Z")}${spike("M30 74Q25 66 29 60Q35 68 38 72Z")}${far.near}${head}`;
  const ferns = [8, 34, 62, 92].map((x, i) => ln(`M${x} 118Q${x + 5} ${98 - (i % 2) * 8} ${x + 17} ${96 - (i % 2) * 8}M${x + 3} 108l-7 -5M${x + 5} 104l8 -1M${x + 7} 100l-4 -8`, "#3a9a4a", 3.2)).join("");
  return { body: `${M.move("borea-fade", animal, "2.6s", "0%,100%{opacity:1}50%,70%{opacity:.5}")}${M.extra("borea-fern", ferns, "2.6s", swing(2), "60px 118px")}`, neck: [80, 93, 10], cap: [91, 68, 0.5] };
}

// ---------- long necks, sails and wings ----------
function brachiosaurus(k, mood, M) {
  const d = tone(k.c, -0.28);
  const neck = `${p("M56 74Q70 56 72 26L86 24Q88 62 78 86Z", k.c, edge(tone(k.c, -0.45)))}${ln("M78 80Q84 56 80 30", k.b, 4)}${p("M68 16Q74 4 86 9L102 18Q104 28 92 29L76 30Q66 26 68 16Z", k.c, edge(tone(k.c, -0.45)))}${el(79, 9, 6, 5, k.c)}${eye(80, 17, mood, { r: 4.2 })}${smile(88, 23, mood, tone(k.c, -0.55), 8)}${cheek(74, 24)}`;
  const leaf = p("M100 14q12 -9 18 -3q-5 11 -18 3Z", "#5ab84a", edge("#2a6a24", 1)) + ln("M101 14l12 -3", "#2a6a24", 1.2);
  const body = `${p("M32 82Q16 86 3 108Q20 102 36 98Z", k.c, edge(tone(k.c, -0.45)))}${post(30, 92, 11, d)}${post(66, 82, 11, d)}${p("M24 94Q24 74 46 70Q66 58 80 74Q86 90 72 98Q48 106 24 94Z", k.c, edge(tone(k.c, -0.45), 1.8))}${el(54, 94, 20, 6, k.b)}${dots([[38, 80], [48, 76], [44, 86]], 2.4, tone(k.c, 0.2))}${post(18, 94, 12, k.c)}${post(56, 84, 12, k.c)}${M.move("brach-reach", `${neck}${M.extra("brach-leaf", leaf, ".5s", swing(8), "101px 14px")}`, "2.4s", "0%,100%{transform:rotate(14deg)}50%,70%{transform:rotate(-5deg)}", "68px 76px")}`;
  return { body, neck: [75, 55, 8], cap: [77, 7, 0.45] };
}

function dimetrodon(k, mood, M) {
  const d = tone(k.c, -0.28);
  const sail = p("M24 88Q20 38 48 34Q74 36 76 86Z", k.a, edge(tone(k.a, -0.4), 1.8)) + [[29, 86, 28, 52], [37, 86, 35, 38], [46, 86, 46, 30], [55, 86, 57, 32], [63, 86, 67, 42], [70, 86, 75, 58]].map(([x, y, a, b]) => ln(`M${x} ${y}L${a} ${b}`, "#f4dcb0", 2.2) + dot(a, b, 1.8, "#f4dcb0")).join("");
  const sprawl = (x, col) => ln(`M${x} 100L${x - 9} 106L${x - 6} 115h8`, col, 7);
  const head = p("M72 80Q84 66 100 74L114 84Q118 98 104 100L84 102Q70 96 72 80Z", k.c, edge(tone(k.c, -0.45))) + ln("M88 93Q102 96 114 90M96 95l1.500 4.500M104 94.500l1.500 4.500", "#fffdf2", 1.7) + eye(87, 81, mood, { r: 4.6 }) + dot(110, 83, 1.2, INK) + cheek(80, 91);
  const body = `${M.move("dimet-sail", sail, "1.5s", "0%,100%{transform:scaleY(.72)}50%,70%{transform:scaleY(1.14)}", "50px 88px")}${p("M30 88Q14 92 2 108Q22 108 36 102Z", k.c, edge(tone(k.c, -0.45)))}${sprawl(44, d)}${sprawl(74, d)}${el(50, 94, 29, 13, k.c, edge(tone(k.c, -0.45), 1.8))}${el(54, 100, 20, 5, k.b)}${sprawl(32, k.c)}${sprawl(66, k.c)}${head}`;
  return { body, neck: [76, 96, 10], cap: [88, 71, 0.5] };
}

function pteranodon(k, mood, M) {
  const membrane = (side) => (side < 0 ? p("M52 70Q20 34 3 40Q16 56 12 72Q30 62 36 82Q44 76 56 86Z", tone(k.c, -0.22), edge("#5a6470")) : p("M66 70Q96 32 118 36Q104 54 112 70Q90 62 84 84Q76 78 64 86Z", k.c, edge("#5a6470")));
  const bone = (d) => ln(d, "#6a7480", 3);
  const spread = M.sig;
  const folded = (x, col) => `${p(`M${x} 72L${x - 18} 98L${x - 4} 94L${x + 4} 82Z`, col, edge("#5a6470"))}${ln(`M${x + 2} 74L${x + 10} 96L${x + 6} 116h8`, col, 5.5)}`;
  const wings = spread ? `${M.move("ptera-left", membrane(-1) + bone("M52 70Q22 38 5 41"), ".9s", swing(15, -9), "54px 76px")}${M.move("ptera-right", membrane(1) + bone("M66 70Q94 36 116 37"), ".9s", swing(-15, 9), "66px 76px")}` : folded(66, tone(k.c, -0.22));
  const head = `${p("M70 42Q48 24 30 20Q50 36 62 50Z", k.a, edge(tone(k.a, -0.4)))}${el(73, 46, 13, 12, k.c, edge("#5a6470"))}${p("M80 40L117 66Q118 70 112 69L76 56Z", "#e8c868", edge("#8a6a20", 1.2))}${ln("M82 52L112 66", "#8a6a20", 1.2)}${eye(75, 43, mood, { r: 4.6 })}${cheek(68, 51)}`;
  const body = `${wings}${ln("M54 96L50 108L54 116h7M66 96L66 108L70 116h7", "#8a94a0", 4.5)}${ln("M46 90L32 100", k.c, 4)}${el(58, 84, 15, 17, k.c, edge("#5a6470"))}${el(60, 89, 9, 10, k.b)}${ln("M62 74Q70 66 72 52", k.c, 10)}${head}${spread ? "" : folded(54, k.c)}`;
  return { body, all: M.sig ? ["ptera-lift", ".9s", "0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}", "60px 90px"] : null, neck: [67, 63, 7], cap: [74, 35, 0.45] };
}

// ---------- sea drifters ----------
function elrathia(k, mood, M) {
  const dark = tone(k.c, -0.4);
  const legs = Array.from({ length: 6 }, (_, i) => ln(`M${36 - i} ${66 + i * 8}q-12 0 -15 9`, dark, 3) + ln(`M${84 + i} ${66 + i * 8}q12 0 15 9`, dark, 3)).join("");
  const segments = Array.from({ length: 6 }, (_, i) => { const w = 29 - i * 2.8, y = 66 + i * 7.4; return p(`M${60 - w} ${y}Q60 ${y - 5} ${60 + w} ${y}L${60 + w - 3} ${y + 7}Q60 ${y + 3} ${60 - w + 3} ${y + 7}Z`, i % 2 ? k.c : tone(k.c, 0.14), edge(dark, 1.2)); }).join("");
  const head = p("M26 66Q28 36 60 36Q92 36 94 66Q86 66 80 62Q60 56 40 62Q34 66 26 66Z", k.c, edge(dark, 1.8)) + p("M46 60Q48 42 60 42Q72 42 74 60Q60 56 46 60Z", k.b, op(0.65)) + eye(43, 52, mood, { r: 4.8, rim: 1 }) + eye(77, 52, mood, { r: 4.8, rim: 1 }) + smile(55, 61, mood, dark, 10) + cheek(34, 59) + cheek(86, 59);
  const feelers = ln("M50 38Q40 22 22 20", dark, 2.4) + ln("M70 38Q80 22 98 20", dark, 2.4);
  const animal = `${M.move("trilo-legs", legs, ".25s", "0%,100%{transform:translateY(-1.5px)}50%{transform:translateY(2px)}")}${M.move("trilo-feel", feelers, ".8s", swing(5), "60px 40px")}${segments}${el(60, 110, 10, 5, k.c, edge(dark, 1.2))}${ln("M60 62v46", k.a, 3, op(0.75))}${head}`;
  return { body: M.move("trilo-walk", animal, "1.8s", "0%,100%{transform:translateX(-9px) rotate(-4deg)}50%{transform:translateX(9px) rotate(4deg)}"), neck: null, cap: [58, 37, 0.65] };
}

function dactylioceras(k, mood, M) {
  const cx = 46, cy = 68;
  const ribs = Array.from({ length: 22 }, (_, i) => { const a = (i / 22) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a), t = a + 0.22; return ln(`M${n(cx + 21 * c)} ${n(cy + 21 * s)}L${n(cx + 35 * Math.cos(t))} ${n(cy + 35 * Math.sin(t))}`, k.a, 2.4); }).join("");
  const shell = `${dot(cx, cy, 37, k.c, edge(k.a, 2))}${ribs}${dot(cx, cy, 21, tone(k.c, -0.1), edge(k.a, 2))}${ln(`M${cx + 14} ${cy}A14 14 0 1 1 ${cx} ${cy - 14}A9 9 0 1 1 ${cx - 9} ${cy}A5 5 0 1 1 ${cx} ${cy + 5}`, k.a, 2.4)}${dot(cx, cy, 2.4, k.a)}`;
  const arms = [[0, "M86 90Q104 92 114 80"], [1, "M84 94Q100 106 114 100"], [2, "M80 96Q88 112 104 112"], [3, "M74 96Q74 110 82 116"], [4, "M88 86Q106 80 112 66"]].map(([i, d]) => M.move(`ammo-arm${i}`, ln(d, tone(k.b, -0.12), 6) + ln(d, k.b, 3.4), `${0.7 + i * 0.13}s`, swing(9, -6), "80px 90px")).join("");
  const head = `${el(80, 88, 16, 14, k.b, edge(k.a))}${eye(83, 83, mood, { r: 5.6, ring: "#fff2c8" })}${smile(78, 93, mood, k.a, 9)}${cheek(73, 91)}`;
  const body = `${shell}${arms}${head}${M.extra("ammo-puff", bubbles([[8, 96, 5], [17, 108, 3.4], [5, 80, 2.6]]), "1.4s", "0%{opacity:0;transform:translateX(12px)}40%{opacity:1}100%{opacity:0;transform:translateX(-5px)}")}`;
  return { body, all: M.sig ? ["ammo-jet", "1.4s", "0%,100%{transform:translate(-4px,0)}35%{transform:translate(6px,-9px)}", "60px 80px"] : null, neck: null, cap: [44, 33, 0.75] };
}

function stenopterygius(k, mood, M) {
  const edgeCol = tone(k.a, -0.2);
  const fin = (d) => p(d, tone(k.c, -0.18), edge(edgeCol));
  const body = `${fin("M24 74Q8 52 4 48Q14 70 12 78Q10 90 6 104Q18 92 28 82Z")}${fin("M44 58Q52 36 66 36Q60 50 66 60Z")}${p("M20 76Q36 54 66 56Q88 56 94 68L117 76Q119 81 112 82L92 84Q80 96 56 94Q34 92 20 76Z", k.c, edge(edgeCol, 1.8))}${p("M30 82Q52 90 78 86Q90 84 96 80L112 80Q96 92 72 94Q46 94 30 82Z", k.b)}${ln("M96 78L114 79", edgeCol, 1.2)}${eye(83, 69, mood, { r: 7, ring: "#eaf6fc" })}${cheek(74, 80)}${M.move("steno-flip", fin("M62 82Q58 100 44 108Q62 106 74 88Z"), "1s", swing(14, -8), "68px 84px")}${tub()}`;
  return { body, neck: [70, 84, 9], cap: [72, 56, 0.6] };
}

function plesiosaurus(k, mood, M) {
  const edgeCol = tone(k.c, -0.45);
  const paddle = (name, x, y, d, col) => M.move(name, p(d, col, edge(edgeCol)), "1.3s", swing(24, -20), `${x}px ${y}px`);
  const far = tone(k.c, -0.25);
  const body = `${paddle("plesio-a", 62, 76, "M62 76Q78 58 92 58Q84 72 70 82Z", far)}${paddle("plesio-b", 28, 78, "M28 78Q20 60 6 56Q14 74 24 86Z", far)}${p("M24 82Q12 84 3 74Q8 94 28 92Z", k.c, edge(edgeCol))}${ln("M58 82Q86 86 82 54Q80 38 90 32", k.c, 15)}${ln("M64 87Q92 90 87 56", k.b, 4)}${el(44, 82, 28, 17, k.c, edge(edgeCol, 1.8))}${el(48, 90, 19, 7, k.b)}${dots([[30, 74], [40, 70], [51, 72]], 2.4, k.a)}${p("M78 28Q86 14 100 22L113 31Q114 39 104 40L88 42Q76 38 78 28Z", k.c, edge(edgeCol))}${eye(91, 27, mood, { r: 4.6 })}${smile(97, 35, mood, edgeCol, 9)}${cheek(85, 36)}${paddle("plesio-c", 54, 90, "M54 88Q60 108 80 112Q74 94 66 86Z", k.c)}${paddle("plesio-d", 28, 90, "M28 88Q18 104 4 108Q14 90 22 84Z", k.c)}${M.extra("plesio-bub", bubbles([[108, 62, 3.6], [102, 74, 2.4], [112, 82, 3]]), "1.3s", "0%{opacity:0;transform:translateY(10px)}50%{opacity:1}100%{opacity:0;transform:translateY(-12px)}")}${tub()}`;
  return { body, neck: [81, 50, 8], cap: [90, 17, 0.5] };
}

function mosasaurus(k, mood, M) {
  const edgeCol = "#142434";
  const fin = (d, col = k.c) => p(d, col, edge(edgeCol));
  const animal = `${fin("M24 78Q10 60 2 54Q8 76 10 84Q8 100 14 108Q20 94 30 86Z")}${fin("M62 82Q70 100 86 104Q78 88 76 80Z", tone(k.c, -0.25))}${p("M18 80Q34 62 62 60Q76 46 96 52L118 64Q120 70 110 70L86 72L112 78Q110 88 98 88Q80 94 58 92Q34 90 18 80Z", k.c, edge(edgeCol, 1.8))}${p("M30 84Q54 92 82 88Q96 86 106 82L90 78Q70 86 30 84Z", k.b)}${ln("M92 70l2.500 5l3 -5l3 5l3 -5.500l3 5l3 -5.500", "#fffdf2", 1.7)}${ln("M94 80l2.500 -4.500l3 5l3 -4.500l3 4", "#fffdf2", 1.5)}${stripes(["M38 70l4 9", "M50 65l3 11", "M63 63l1 11"], k.a, 3.4, 0.7)}${eye(88, 60, mood, { r: 5, ring: k.a })}${cheek(80, 70)}${fin("M54 86Q52 106 36 112Q52 112 68 92Z")}`;
  const splash = `${bubbles([[8, 90, 4], [20, 74, 2.6], [100, 100, 3], [112, 90, 4.4], [66, 108, 3]])}${ln("M20 98q-8 -12 -14 -6M96 98q10 -14 18 -5M60 96q-2 -12 6 -14", "#e8fbff", 2.6)}`;
  return { body: `${M.move("mosa-breach", animal, "2.2s", "0%,100%{transform:translateY(8px) rotate(5deg)}40%,55%{transform:translateY(-20px) rotate(-18deg)}")}${tub()}${M.extra("mosa-splash", splash, "2.2s", "0%,25%,100%{opacity:0}45%,70%{opacity:1}")}`, neck: M.sig ? null : [78, 82, 10], cap: M.sig ? null : [84, 51, 0.6] };
}

// ---------- Ice Age mammals ----------
/** Shaggy fringe along a baseline. */
const shag = (x0, x1, y, col, len = 7) => ln(Array.from({ length: Math.floor((x1 - x0) / 5) + 1 }, (_, i) => `M${x0 + i * 5} ${y + (i % 2) * 2}l-2 ${len}`).join(""), col, 2.6);

function dwarfelephant(k, mood, M) {
  const far = legs4(k.c, [36, 68, 24, 56], 90, 12);
  const body = `${ln("M26 80Q16 86 14 98", k.c, 4)}${dot(14, 99, 3, k.a)}${far.far}${el(48, 82, 27, 20, k.c, edge(k.a, 1.8))}${far.near}${el(76, 66, 22, 21, k.c, edge(k.a, 1.8))}${ln("M90 70Q106 78 104 94Q104 104 113 100", k.c, 11)}${ln("M100 82l8 -2M101 90h8", k.a, 1.4)}${ln("M88 82Q94 94 104 92", "#fff6dc", 4.4)}${p("M66 54Q40 42 42 70Q48 94 68 80Z", k.c, edge(k.a, 1.8))}${p("M62 60Q48 54 49 69Q53 82 64 75Z", k.b)}${eye(82, 62, mood, { r: 4.8 })}${cheek(75, 73)}${smile(80, 78, mood, k.a, 8)}${ln("M76 46q2 -7 7 -8M72 47q-1 -6 -5 -8", k.a, 1.8)}`;
  return { body, neck: [72, 85, 11], cap: [76, 48, 0.65] };
}

function cavebear(k, mood, M) {
  const far = legs4(k.c, [36, 70, 22, 56], 88, 14);
  const yawn = el(103, 66, 8, 9, "#5a1c1c", edge("#2c0c0c", 1)) + el(103, 71, 5, 3, "#e87888") + ln("M98 60l2 4M108 60l-2 4", "#fffdf2", 2);
  const head = `${dots([[68, 33], [90, 29]], 7.5, k.c)}${dots([[68, 33], [90, 29]], 3.6, k.b)}${el(80, 50, 21, 21, k.c, edge(k.a, 1.8))}${el(97, 58, 15, 12, k.b, edge(k.a))}${el(108, 53, 5, 4, k.a)}${eye(82, 45, M.sig ? "sleepy" : mood, { r: 4.4 })}${M.sig ? M.move("bear-yawn", yawn, "2.4s", "0%,15%,100%{transform:scale(.25)}45%,70%{transform:scale(1.1)}", "103px 62px") : smile(97, 62, mood, k.a, 9)}${cheek(75, 58)}`;
  const zzz = ln("M104 22h8l-8 8h8M92 8h6l-6 6h6", "#fff4c8", 2.2);
  const body = `${dot(18, 76, 6, k.c, edge(k.a))}${far.far}${p("M18 88Q16 58 46 56Q70 52 78 74Q84 98 64 102Q34 108 18 88Z", k.c, edge(k.a, 1.8))}${el(50, 94, 20, 7, tone(k.c, 0.18))}${far.near}${head}${M.extra("bear-zzz", zzz, "2.4s", "0%{opacity:0;transform:translateY(7px)}50%{opacity:1}100%{opacity:0;transform:translateY(-6px)}")}`;
  return { body, neck: [76, 70, 13], cap: [78, 30, 0.65] };
}

function woollyrhino(k, mood, M) {
  const far = legs4(k.c, [34, 68, 20, 54], 88, 13);
  const horn = (d) => p(d, k.a, edge("#8a7448", 1.2));
  const head = `${p("M72 52l-3 -17l13 12Z", k.c, edge(tone(k.c, -0.45)))}${p("M66 66Q70 46 88 50Q106 56 114 74Q118 90 102 92Q78 98 68 84Z", k.c, edge(tone(k.c, -0.45), 1.8))}${horn("M101 66Q105 36 119 26Q116 48 112 72Z")}${horn("M89 54Q90 43 97 39Q98 49 98 58Z")}${eye(86, 66, mood, { r: 4.4 })}${dot(109, 79, 1.8, INK)}${smile(96, 85, mood, tone(k.c, -0.55), 9)}${cheek(80, 77)}`;
  const body = `${ln("M22 78Q10 84 9 96", k.c, 5)}${far.far}${p("M18 88Q16 64 38 62Q54 46 72 62Q84 82 70 98Q40 106 18 88Z", k.c, edge(tone(k.c, -0.45), 1.8))}${shag(24, 68, 92, tone(k.c, -0.22), 10)}${stripes(["M34 70q8 -6 16 -4", "M52 60q8 0 13 8", "M28 80q10 -5 18 -3"], k.b, 3, 0.7)}${far.near}${head}`;
  return { body, neck: [74, 86, 12], cap: [80, 49, 0.55] };
}

function megaloceros(k, mood, M) {
  const d = tone(k.c, -0.28);
  const antler = p("M74 44Q58 42 44 28Q30 26 24 12Q36 18 42 15Q38 8 40 3Q48 12 56 12Q56 6 60 3Q64 12 68 20Q76 26 79 40Z", "#e8d4a8", edge("#8a6c40", 1.4));
  const front = p("M86 40Q92 22 102 17Q103 9 108 5Q108 14 112 15Q114 8 119 8Q118 20 111 26Q101 32 93 43Z", "#f4e4bc", edge("#8a6c40", 1.4));
  const slim = (x, y, col) => `${ln(`M${x} ${y}L${x - 2} 103L${x} 115`, col, 6.4)}${ln(`M${x - 1} 116h5`, k.a, 4)}`;
  const body = `${antler}${slim(38, 84, d)}${slim(68, 82, d)}${dot(22, 72, 6, k.b, edge(k.a, 1))}${el(46, 80, 25, 17, k.c, edge(k.a, 1.8))}${el(50, 89, 16, 6, k.b)}${slim(28, 88, k.c)}${slim(58, 88, k.c)}${p("M54 70Q70 66 74 48L90 52Q88 76 68 88Z", k.c, edge(k.a, 1.4))}${front}${p("M74 44Q84 34 94 42L111 58Q112 68 101 67L84 62Q72 56 74 44Z", k.c, edge(k.a, 1.6))}${el(105, 62, 7, 5, k.b)}${dot(110, 59, 2.6, k.a)}${p("M74 46l-13 -3l9 10Z", k.c, edge(k.a, 1))}${eye(87, 47, mood, { r: 4.4 })}${smile(98, 63, mood, k.a, 7)}${cheek(82, 57)}`;
  return { body, neck: [75, 66, 10], cap: [86, 37, 0.45] };
}

function smilodon(k, mood, M) {
  const far = legs4(k.c, [34, 68, 22, 54], 86, 12);
  const jaw = p("M84 68Q96 76 108 70Q108 84 94 84Q84 80 84 68Z", k.b, edge(k.a, 1.2));
  const fang = (x) => p(`M${x - 3.4} 68Q${x + 2} 80 ${x - 2} 90Q${x + 5} 80 ${x + 4} 67Z`, "#fffdf2", edge("#a89878", 1));
  const head = `${p("M66 42l-1 -17l14 10Z", k.c, edge(k.a))}${p("M88 34l11 -12l3 17Z", k.c, edge(k.a))}${el(84, 53, 21, 20, k.c, edge(k.a, 1.8))}${M.move("smilo-jaw", jaw, "1.7s", "0%,20%,100%{transform:rotate(0)}50%,70%{transform:rotate(30deg)}", "84px 68px")}${el(99, 63, 13, 9, k.b, edge(k.a))}${p("M105 56h8l-4 6Z", k.a)}${fang(96)}${fang(106)}${eye(83, 48, mood, { r: 4.6, ring: "#c8d858" })}${eye(98, 47, mood, { r: 4, ring: "#c8d858" })}${ln("M92 65l-14 3M92 68l-12 7", "#fff", 1)}${cheek(76, 62)}`;
  const body = `${ln("M24 76Q15 74 13 66", k.c, 8)}${far.far}${p("M20 86Q18 62 44 64Q60 54 74 68Q80 92 62 98Q34 102 20 86Z", k.c, edge(k.a, 1.8))}${el(48, 92, 18, 6, k.b)}${dots([[34, 74], [43, 70], [38, 83], [52, 76], [28, 82]], 2.2, k.a)}${far.near}${head}`;
  return { body, neck: [73, 70, 11], cap: [82, 35, 0.6] };
}

function woollymammoth(k, mood, M) {
  const far = legs4(k.c, [34, 66, 20, 52], 90, 14);
  const tusk = (d, col) => ln(d, "#8a7448", 7.4) + ln(d, col, 5);
  const head = `${tusk("M82 82Q86 108 108 104Q119 100 116 88", "#d8c8a0")}${p("M62 56Q62 28 84 28Q104 32 104 58Q106 74 96 84Q76 90 66 76Z", k.c, edge(tone(k.c, -0.45), 1.8))}${ln("M96 68Q108 80 102 96Q99 106 108 108", k.c, 13)}${ln("M98 82l9 2M97 92l8 1", tone(k.c, -0.4), 1.4)}${tusk("M90 80Q96 112 117 106", k.a)}${el(68, 58, 8, 12, k.b, edge(tone(k.c, -0.45)))}${eye(87, 53, mood, { r: 4.6 })}${cheek(81, 66)}${ln("M76 32q3 -10 10 -11M82 30q6 -8 13 -6M72 33q-2 -8 -8 -10", k.b, 2.6)}`;
  const snow = dots([[92, 114], [100, 108], [110, 115], [116, 106], [84, 117]], 3.4, "#ffffff", ) + ln("M96 100l4 -4M112 98l5 -2", "#ffffff", 2.4);
  const body = `${ln("M18 74Q8 82 9 94", k.c, 5)}${far.far}${p("M14 88Q12 58 36 54Q56 34 76 54Q86 80 70 98Q36 108 14 88Z", k.c, edge(tone(k.c, -0.45), 1.8))}${shag(20, 70, 93, tone(k.c, -0.2), 12)}${stripes(["M26 68q8 -8 18 -6", "M46 52q10 -4 18 6", "M22 80q10 -6 20 -3"], k.b, 3, 0.8)}${far.near}${M.move("mamm-sweep", head, "1.4s", "0%,100%{transform:rotate(-8deg)}50%{transform:rotate(9deg)}", "74px 56px")}${M.extra("mamm-snow", snow, "1.4s", "0%,100%{opacity:.15;transform:translateX(-8px)}50%{opacity:1;transform:translateX(3px)}")}`;
  return { body, neck: [72, 84, 12], cap: [84, 30, 0.65] };
}

// ---------- assembly ----------
const ART = {
  amber_compsognathus: compsognathus, amber_protoceratops: protoceratops, amber_psittacosaurus: psittacosaurus, amber_dryosaurus: dryosaurus,
  amber_microraptor: microraptor, amber_elrathia: elrathia, amber_dactylioceras: dactylioceras, amber_dwarfelephant: dwarfelephant, amber_cavebear: cavebear,
  amber_triceratops: triceratops, amber_stegosaurus: stegosaurus, amber_ankylosaurus: ankylosaurus, amber_parasaurolophus: parasaurolophus,
  amber_pteranodon: pteranodon, amber_dimetrodon: dimetrodon, amber_woollyrhino: woollyrhino, amber_stenopterygius: stenopterygius,
  amber_velociraptor: velociraptor, amber_brachiosaurus: brachiosaurus, amber_pachycephalosaurus: pachycephalosaurus, amber_plesiosaurus: plesiosaurus,
  amber_megaloceros: megaloceros, amber_smilodon: smilodon,
  amber_tyrannosaurus: tyrannosaurus, amber_spinosaurus: spinosaurus, amber_mosasaurus: mosasaurus, amber_woollymammoth: woollymammoth,
  amber_archaeopteryx: archaeopteryx, amber_anchiornis: anchiornis, amber_borealopelta: borealopelta,
};

export default function art({ id, name, tier, c, b, a, stage = 1, mood = "happy", size = 0, act = "" }) {
  const draw = ART[id] || protoceratops;
  const M = motion(act === "signature");
  const r = draw({ c, b, a }, mood, M);
  // The scarf and hat ride along when the whole animal moves.
  let core = r.body + (stage >= 2 && r.neck ? scarf(...r.neck) : "") + (stage >= 3 && r.cap ? hat(...r.cap) : "");
  if (r.all) core = M.move(r.all[0], core, r.all[1], r.all[2], r.all[3]);
  return frame({ name, size, tier, accent: a, stage, body: core, neck: null, cap: null, css: M.css() });
}
