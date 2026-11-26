// Bramble Burrow SVG art: 30 small mammals, each drawn with its own field marks, plus a posed and
// animated "signature" drawing for every behaviour. Canvas 120 x 124, ground at y = 118.
import { INK, el, dot, p, ln, both, eye, blush, scarf, hat, frame } from "./artkit.js";

const OL = `stroke="#3a1e1040" stroke-width="1.2"`;
const PINK = "#f4b2ac";
const f = (n) => Math.round(n * 10) / 10;
const g = (transform, svg) => `<g transform="${transform}">${svg}</g>`;
const grp = (cls, svg) => `<g class="${cls}">${svg}</g>`;
/** Rotated ellipse. */
const tel = (cx, cy, rx, ry, rot, fill, x = "") => el(cx, cy, rx, ry, fill, `transform="rotate(${rot} ${cx} ${cy})" ${x}`);
const shine = (cx, cy, rx, ry, rot = -25, o = 0.26) => tel(cx, cy, rx, ry, rot, "#fff", `opacity="${o}"`);

/** Scalloped, fluffy outline around an ellipse. */
function fluffPath(cx, cy, rx, ry, n = 22, k = 1.12) {
  const at = (i, m = 1) => {
    const t = (i / n) * Math.PI * 2 - Math.PI / 2;
    return `${f(cx + Math.cos(t) * rx * m)} ${f(cy + Math.sin(t) * ry * m)}`;
  };
  let d = `M${at(0)}`;
  for (let i = 0; i < n; i++) d += `Q${at(i + 0.5, k)} ${at(i + 1)}`;
  return `${d}Z`;
}
const fluff = (cx, cy, rx, ry, fill, n, k, x = OL) => p(fluffPath(cx, cy, rx, ry, n, k), fill, x);

// ---------- face parts ----------
const nose = (x, y, col = "#e8788a", w = 3.4) => p(`M${x - w} ${y - 1.4}Q${x} ${y - 3.4} ${x + w} ${y - 1.4}Q${f(x + w * 0.6)} ${y + 1.8} ${x} ${y + 2.6}Q${f(x - w * 0.6)} ${y + 1.8} ${x - w} ${y - 1.4}Z`, col);
const mouth = (x, y, mood, col = INK) => (mood === "sad" ? ln(`M${x - 4.5} ${y + 7}Q${x} ${y + 2.5} ${x + 4.5} ${y + 7}`, col, 1.5) : ln(`M${x} ${y}v2.8M${x} ${y + 2.8}q-2.4 3.2 -5.6 .8M${x} ${y + 2.8}q2.4 3.2 5.6 .8`, col, 1.4));
const gape = (x, y, w = 6, h = 7) => el(x, y, w, h, "#6a1e2c", OL) + el(x, f(y + h * 0.42), f(w * 0.66), f(h * 0.42), "#ff8c9c");
const teeth = (x, y, col = "#fffdf4") => p(`M${x - 3} ${y}h6v4.2q-1.5 1.2 -3 0q-1.5 1.2 -3 0Z`, col, `stroke="#0005" stroke-width=".6"`) + ln(`M${x} ${y}v4.4`, "#0005", 0.6);
const whisk = (cx, y, gap, len, col = "#ffffff") => ln([-1, 1].map((s) => [-4, 0.5, 5].map((dy) => `M${cx + s * gap} ${f(y + dy * 0.35)}l${s * len} ${dy}`).join("")).join(""), col, 0.8, `opacity=".85"`);
/** A little paw with toe creases. */
const paw = (x, y, rx, ry, fill = PINK) => el(x, y, rx, ry, fill, OL) + ln(`M${f(x - rx * 0.32)} ${f(y + ry * 0.2)}v${f(ry * 0.65)}M${f(x + rx * 0.32)} ${f(y + ry * 0.2)}v${f(ry * 0.65)}`, "#7a3a3a55", 0.9);
const roundEar = (x, y, r, outer, inner) => dot(x, y, r, outer, OL) + dot(x + 0.6, y + 1.4, f(r * 0.6), inner);
const seed = (x, y, rot) => g(`rotate(${rot} ${x} ${y})`, p(`M${x} ${y - 6}C${x + 5} ${y - 2} ${x + 4} ${y + 6} ${x} ${y + 6}C${x - 4} ${y + 6} ${x - 5} ${y - 2} ${x} ${y - 6}Z`, "#4c3c34", `stroke="#2a1e18" stroke-width=".8"`) + ln(`M${x - 1.6} ${y - 2}v5M${x + 1.6} ${y - 2}v5`, "#f2eadc", 0.9));
const heart = (x, y, k = 1, col = "#ff6a8a") => g(`translate(${x} ${y}) scale(${k})`, p("M0 6L-6.5 -0.5a3.8 3.8 0 0 1 6.5 -4a3.8 3.8 0 0 1 6.5 4Z", col, `stroke="#fff" stroke-width="1.2"`));
const spark = (x, y, r = 4, col = "#fff6a8") => p(`M${x} ${y - r}Q${x} ${y} ${x + r} ${y}Q${x} ${y} ${x} ${y + r}Q${x} ${y} ${x - r} ${y}Q${x} ${y} ${x} ${y - r}Z`, col);

// ---------- signature helpers ----------
/** CSS for one moving class. `n` is unique per behaviour; 0% should stay at the drawn pose. */
const move = (n, frames, timing = "1.2s ease-in-out", origin = "60px 80px") => `.bd-s-burrow-${n}{transform-origin:${origin};animation:burrow-${n} ${timing} infinite}@keyframes burrow-${n}{${frames}}`;
const POP = ".bd-s-burrow-pop{animation:burrow-pop 1.1s ease-in-out infinite}@keyframes burrow-pop{0%,100%{opacity:1}50%{opacity:.3}}";
const pop = (svg) => grp("bd-s-burrow-pop", svg);
const word = (x, y, text, size = 11, col = "#fff3a0") => `<text x="${x}" y="${y}" font-size="${size}" font-family="system-ui,Helvetica" font-weight="800" text-anchor="middle" fill="${col}" stroke="#3a1c10" stroke-width="2.8" paint-order="stroke">${text}</text>`;
const arcs = (d, col = "#fff3a0", w = 2.4) => ln(d, col, w);

// =====================================================================================
// Sandy Burrows
// =====================================================================================
const HAM = "M60 28C84 28 94 46 93 62C104 72 107 97 96 109C85 119 35 119 24 109C13 97 16 72 27 62C26 46 36 28 60 28Z";

function syrian(k, m, sig) {
  const ears = both(g("rotate(-18 36 36)", roundEar(36, 36, 10.5, k.a, "#b07a72")));
  const body = p(HAM, k.c, OL) + el(60, 39, 15, 8, "#a8601c", `opacity=".28"`) + shine(43, 40, 10, 5);
  const belly = p("M60 66C73 64 82 72 80 82C91 96 84 115 60 115C36 115 29 96 40 82C38 72 47 64 60 66Z", k.b);
  const face = (ey) => `${eye(46, ey, m, { r: 5.2 })}${eye(74, ey, m, { r: 5.2 })}`;
  const muzzle = el(54, 69, 8.5, 7, k.b) + el(66, 69, 8.5, 7, k.b) + nose(60, 65) + mouth(60, 67, m) + whisk(60, 69, 14, 17, "#fff");
  if (!sig) {
    // The dark cheek flash and the cream crescent under it are the golden hamster's signature marks.
    const flash = both(p("M21 86C19 72 25 59 40 51C35 60 31 70 33.6 79C32 85 25 89 21 86Z", k.a, `opacity=".94"`) + ln("M43 55Q35 68 40 80", k.b, 4.2));
    return {
      actor: `${ears}${body}${flash}${belly}${face(54)}${muzzle}${blush(35, 85, 68)}${both(paw(49, 96, 6, 4.8))}${both(paw(43, 114, 10, 5))}`,
      neck: [60, 80, 23], cap: [60, 33, 0.95],
    };
  }
  const cheek = (x) => el(x, 76, 24, 22, k.c, OL) + el(x + (x < 60 ? 4 : -4), 83, 17, 13, k.b) + shine(x - 6, 64, 8, 4.4, -30, 0.4);
  return {
    actor: `${ears}${body}${belly}${grp("bd-s-burrow-cheekl", cheek(30))}${grp("bd-s-burrow-cheekr", cheek(90))}${both(ln("M24 66Q30 58 40 58", k.a, 4.4))}${face(51)}${el(60, 66, 10, 7, k.b)}${nose(60, 63)}${gape(60, 72, 5.5, 5)}${grp("bd-s-burrow-nibble", seed(60, 79, 12) + both(paw(52, 84, 5.4, 4.6)))}${both(paw(44, 114, 10, 5))}`,
    front: seed(12, 114, 70) + seed(22, 117, -55) + seed(99, 116, 60) + seed(110, 112, -75) + grp("bd-s-burrow-feed", seed(103, 42, 48)) + pop(arcs("M108 30l6 -5M112 40h6", "#fff3a0", 2)),
    anim: "bd-s-burrow-stuff",
    neck: [60, 93, 22], cap: [60, 33, 0.95],
    css: POP + move("stuff", "0%,100%{transform:scale(1,1)}50%{transform:scale(1.025,.975)}", ".8s ease-in-out", "60px 116px")
      + move("cheekl", "0%,100%{transform:scale(1)}50%{transform:scale(1.09)}", ".8s ease-in-out", "42px 76px")
      + move("cheekr", "0%,100%{transform:scale(1.06)}50%{transform:scale(.98)}", ".8s ease-in-out", "78px 76px")
      + move("nibble", "0%,100%{transform:translateY(0)}50%{transform:translateY(-3.5px)}", ".4s ease-in-out")
      + move("feed", "0%{transform:translate(0,0);opacity:1}75%{transform:translate(-40px,34px);opacity:1}76%,100%{transform:translate(-40px,34px);opacity:0}", "1.3s ease-in"),
  };
}

function winterwhite(k, m, sig) {
  const feet = both(fluff(43, 113, 10, 5, "#ffffff", 10, 1.2));
  const face = (y) => `${eye(46, y, m, { r: 5 })}${eye(74, y, m, { r: 5 })}${el(55, y + 14, 8, 6.5, "#fff")}${el(65, y + 14, 8, 6.5, "#fff")}${nose(60, y + 10)}${mouth(60, y + 12, m)}${whisk(60, y + 14, 14, 15, "#fff")}${blush(36, 84, y + 11)}`;
  if (!sig) {
    const arches = "M19 100Q22 86 32 93Q34 78 46 86Q52 79 60 79Q68 79 74 86Q86 78 88 93Q98 86 101 100";
    return {
      actor: `${both(roundEar(35, 43, 9, k.a, "#c89a96"))}${p("M60 33C86 33 101 57 102 82C104 104 90 116 60 116C30 116 16 104 18 82C19 57 34 33 60 33Z", k.c, OL)}${p(`${arches}C101 110 86 116 60 116C34 116 19 110 19 100Z`, k.b)}${ln(arches, k.a, 2.2, `opacity=".65"`)}${p("M54 33.8Q60 32.4 66 33.8L63 47Q60 55 57 47Z", k.a)}${shine(42, 45, 9, 4.4)}${face(59)}${both(paw(49, 98, 5.4, 4.4))}${feet}`,
      neck: [60, 84, 23], cap: [60, 37, 0.9],
    };
  }
  const flake = (x, y, r) => ln(`M${x - r} ${y}h${2 * r}M${x - r / 2} ${f(y - r * 0.87)}l${r} ${f(r * 1.74)}M${x + r / 2} ${f(y - r * 0.87)}l${-r} ${f(r * 1.74)}`, "#ffffff", 1.8);
  const summer = g(`translate(0 0)`, p("M24 66C30 46 44 38 60 38C76 38 90 46 96 66Q86 60 80 68Q70 58 60 62Q50 58 40 68Q34 60 24 66Z", k.c, `opacity=".8"`) + p("M54 38.6Q60 37 66 38.6L63 49Q60 55 57 49Z", k.a, `opacity=".8"`));
  return {
    actor: `${both(roundEar(35, 47, 8.5, "#b8aca4", "#d8aaa8"))}${fluff(60, 78, 42, 38, k.b, 26, 1.1)}${grp("bd-s-burrow-moult", summer)}${shine(38, 76, 7, 12, 20, 0.7)}${face(63)}${both(paw(52, 96, 5, 3.8))}${feet}`,
    front: grp("bd-s-burrow-snow", [flake(13, 34, 5), flake(30, 14, 3.6), flake(92, 18, 4.6), flake(109, 46, 3.4), flake(8, 72, 3.4), flake(112, 86, 4.4), flake(72, 8, 3)].join("")),
    anim: "bd-s-burrow-shiver",
    neck: [60, 86, 24], cap: [60, 42, 0.9],
    css: move("moult", "0%,100%{opacity:1}45%,60%{opacity:0}", "3.4s ease-in-out") + move("snow", "0%{transform:translateY(0);opacity:1}80%{transform:translateY(11px);opacity:1}100%{transform:translateY(14px);opacity:0}", "2.2s linear")
      + move("shiver", "0%,70%,100%{transform:scale(1)}76%{transform:scale(1.04) rotate(2deg)}82%{transform:scale(1.04) rotate(-2deg)}88%{transform:scale(1.03) rotate(1.5deg)}", "1.7s ease-in-out", "60px 116px"),
  };
}

function robo(k, m, sig) {
  if (!sig) {
    return {
      actor: `${both(roundEar(38, 57, 8, k.c, "#a8786a"))}${p("M60 49C80 49 91 65 90 81C98 91 95 110 83 114C70 119 50 119 37 114C25 110 22 91 30 81C29 65 40 49 60 49Z", k.c, OL)}${p("M28.5 93Q39 80 49 84Q60 76 71 84Q81 80 91.5 93C94 106 86 115 60 116.5C34 115 26 106 28.5 93Z", k.b)}${shine(46, 57, 8, 3.6)}${both(tel(46, 60.5, 6.6, 3.5, -20, "#fff"))}${eye(47.5, 71, m, { r: 5.6 })}${eye(72.5, 71, m, { r: 5.6 })}${el(55, 83, 8, 6.4, k.b)}${el(65, 83, 8, 6.4, k.b)}${nose(60, 79, "#e8788a", 3)}${mouth(60, 81, m)}${whisk(60, 83, 13, 17)}${blush(37, 83, 80)}${both(paw(51, 102, 4.6, 3.8))}${both(paw(45, 115, 7.4, 3.6))}`,
      neck: [60, 91, 19], cap: [60, 54, 0.74],
    };
  }
  const runner = `${grp("bd-s-burrow-legb", tel(26, 104, 12, 4.4, -28, PINK, OL) + tel(40, 110, 11, 4, -8, "#e89c96", OL))}${grp("bd-s-burrow-legf", tel(84, 106, 10, 4, 34, "#e89c96", OL) + tel(96, 101, 9.5, 4, 12, PINK, OL))}${dot(19, 82, 5, k.b, OL)}${tel(54, 85, 33, 22, -6, k.c, OL)}${p("M30 96Q50 84 68 90Q80 88 84 94Q74 108 54 108Q38 108 30 96Z", k.b)}${shine(44, 71, 13, 4.4, -8)}${roundEar(66, 59, 8, k.c, "#a8786a")}${el(79, 76, 21, 19, k.c, OL)}${roundEar(85, 57, 7, k.c, "#a8786a")}${el(91, 84, 11, 8.5, k.b)}${p("M64 86Q76 96 94 91Q84 99 70 95Z", k.b)}${tel(84, 65, 6.4, 3.2, -14, "#fff")}${eye(85, 73, m, { r: 5.4 })}${nose(99, 80, "#e8788a", 3)}${mouth(96, 82, m)}${ln("M94 85l17 3M93 88l13 7", "#fff", 0.8)}`;
  return {
    behind: grp("bd-s-burrow-speed", arcs("M2 60h20M6 73h12M1 90h13M12 48h14", "#ffffff", 2.6)),
    actor: runner,
    front: pop(`${dot(10, 112, 6, "#f2dcb0")}${dot(19, 116, 4.4, "#f2dcb0")}${dot(5, 104, 3, "#f2dcb0")}`),
    anim: "bd-s-burrow-dash",
    neck: [75, 92, 12], cap: [77, 61, 0.6],
    css: POP + move("dash", "0%,100%{transform:translate(0,0) rotate(0)}25%{transform:translate(4px,-5px) rotate(-5deg)}50%{transform:translate(7px,0) rotate(0)}75%{transform:translate(1px,-3px) rotate(4deg)}", ".5s linear")
      + move("legb", "0%,100%{transform:rotate(0)}50%{transform:rotate(-30deg)}", ".18s linear", "42px 98px") + move("legf", "0%,100%{transform:rotate(0)}50%{transform:rotate(32deg)}", ".18s linear", "78px 96px")
      + move("speed", "0%,100%{transform:translateX(0);opacity:1}50%{transform:translateX(-5px);opacity:.35}", ".35s linear"),
  };
}

function chinese(k, m) {
  return {
    behind: ln("M30 104C14 110 6 100 10 86", "#5a3828", 8.6) + ln("M30 104C14 110 6 100 10 86", k.c, 6) + ln("M13 100Q9 94 10 87", k.a, 2.4),
    actor: `${p("M22 98C20 74 40 62 62 64C82 66 92 82 89 99C87 112 72 117 53 117C37 117 24 111 22 98Z", k.c, OL)}${p("M32 109C42 90 68 90 85 96C82 112 68 116.5 53 116.5C43 116.5 36 114 32 109Z", k.b)}${ln("M23.5 95C25 74 42 64.5 62 65.5", k.a, 5)}${ln("M34 113C24 96 42 86 52 94C58 100 58 108 55 113", "#3a1e1033", 1.4)}${shine(38, 78, 10, 4.4, -35)}${paw(46, 115, 10, 4)}${paw(74, 115, 7.6, 3.8)}${roundEar(57, 42, 9.6, "#f4ece2", "#8a5c50")}${roundEar(96, 43, 9.2, "#f4ece2", "#8a5c50")}${el(77, 63, 23, 21.5, k.c, OL)}${p("M69.5 42.4Q76 40.6 82.5 42.2L79.5 52Q76.5 57 73 51Z", k.a)}${el(76.5, 75, 9, 7, k.b)}${el(88, 74, 9, 7, k.b)}${eye(66.5, 61, m, { r: 4.8 })}${eye(89.5, 61, m, { r: 4.8 })}${nose(82.5, 69.5)}${mouth(82.5, 71.5, m)}${whisk(82, 74, 12, 15, "#fff")}${blush(61, 96, 72)}${paw(70, 97, 5, 4)}${paw(87, 95, 5, 4)}`,
    neck: [75, 83, 16], cap: [77, 45, 0.76],
  };
}

function gerbil(k, m, sig) {
  const tailD = sig ? "M44 104C24 104 12 96 14 80" : "M46 110C24 120 6 111 12 92";
  const tail = ln(tailD, "#8a5c38", 8.4) + ln(tailD, k.c, 6.4) + (sig ? brush(14, 70, -4, k.a, 15) : brush(13.5, 83, 8, k.a, 15));
  const claws = (x, y) => ln(`M${x - 3} ${y}l-.6 3.4M${x} ${y + 0.6}v3.4M${x + 3} ${y}l.6 3.4`, "#2a1c18", 1.1);
  const body = `${p("M42 112C31 95 37 64 62 61C83 61 91 82 87 100C85 114 73 118 60 118C52 118 46 116 42 112Z", k.c, OL)}${el(69, 92, 13.5, 21, k.b)}${shine(46, 82, 5, 12, 24)}${ln("M45 113C33 95 48 84 59 90C68 96 66 107 62 113", "#3a1e1033", 1.4)}`;
  const head = `${tel(50, 29, 8.6, 11, -28, k.c, OL)}${tel(50.4, 30, 5, 7, -28, "#c8847a")}${tel(87, 29, 8.6, 11, 28, k.c, OL)}${tel(86.6, 30, 5, 7, 28, "#c8847a")}${el(68, 46, 24.5, 22, k.c, OL)}${el(68, 32, 13, 6, "#6a3e1e", `opacity=".22"`)}${el(68.5, 57.5, 9, 7.5, k.b)}${el(79, 57, 9, 7.5, k.b)}${dot(57.5, 44, 8.4, k.b, `opacity=".7"`)}${dot(82, 44, 8.4, k.b, `opacity=".7"`)}${eye(58, 44, m, { r: 6 })}${eye(81.5, 44, m, { r: 6 })}${nose(74, 53)}${mouth(74, 55, m)}${whisk(73.5, 56, 11, 20, "#5a3c2c")}${blush(52, 89, 55)}`;
  const hands = paw(68, 81, 4.8, 3.8, "#f4cdb6") + claws(68, 82.4) + paw(81, 81, 4.8, 3.8, "#f4cdb6") + claws(81, 82.4);
  const foot = (x, y) => el(x, y, 15, 4.4, "#f4cdb6", OL) + ln(`M${x + 9} ${y - 1}l6 .6M${x + 8.6} ${y + 1.8}l6 1.4`, "#2a1c18", 1.1);
  if (!sig) return { behind: tail, actor: `${body}${head}${hands}${foot(66, 115)}`, neck: [68, 66, 17], cap: [68, 27, 0.78] };
  return {
    behind: tail,
    actor: `${foot(52, 115)}${body}${head}${hands}${grp("bd-s-burrow-thump", ln("M64 103L74 103", "#f4cdb6", 7) + g("rotate(-30 82 101)", foot(84, 101)))}`,
    front: pop(`${arcs("M97 110l13 -7M100 116h16M92 103l6 -10")}${el(89, 118, 17, 3.4, "none", `stroke="#fff3a0" stroke-width="2"`)}${word(98, 84, "THUMP!", 10)}`),
    anim: "bd-s-burrow-lean",
    neck: [68, 66, 17], cap: [68, 27, 0.78],
    css: POP + move("thump", "0%,30%,100%{transform:rotate(0)}45%,60%{transform:rotate(27deg)}75%{transform:rotate(-8deg)}", ".55s ease-in", "64px 103px") + move("lean", "0%,30%,100%{transform:rotate(0)}50%{transform:rotate(3deg)}", ".55s ease-in-out", "55px 116px"),
  };
}

function duprasi(k, m) {
  // Short, plump, club-shaped tail: the fat store that gives this gerbil its name.
  const tail = p("M80 103C90 92 113 94 115 106C116 117 96 119 82 114Z", k.a, `stroke="#9a4a4a66" stroke-width="1.2"`) + ln("M94 99q-3 8 1 17M101 98.6q-2.6 8 .6 17.6M108 101q-2 6 0 13", "#fff", 1.1, `opacity=".65"`) + shine(103, 101, 8, 2.6, 8, 0.5);
  return {
    behind: tail,
    actor: `${both(g("translate(-2 0)", roundEar(38, 57, 8.4, k.c, "#e2a49c")))}${fluff(56, 83, 36, 32, k.c, 32, 1.08)}${shine(38, 66, 9, 5)}${tel(29, 68, 6.4, 5, -30, "#fff")}${tel(83, 68, 6.4, 5, 30, "#fff")}${fluff(56, 100, 25, 15, k.b, 18, 1.1, "")}${eye(44, 74, m, { r: 5.4 })}${eye(68, 74, m, { r: 5.4 })}${el(51, 87, 8.4, 6.6, "#fff")}${el(61, 87, 8.4, 6.6, "#fff")}${nose(56, 82.5)}${mouth(56, 84.5, m)}${whisk(56, 87, 13, 18, "#a87a52")}${blush(34, 78, 85)}${paw(47, 103, 4.8, 3.8)}${paw(65, 103, 4.8, 3.8)}${paw(41, 115, 8, 3.8)}${paw(70, 115, 8, 3.8)}`,
    neck: [56, 92, 22], cap: [56, 56, 0.82],
  };
}

const jerboaFace = (k, m, hx, hy) => `${tel(hx - 17, hy - 25, 8, 18, -24, k.c, OL)}${tel(hx - 17, hy - 24, 4.6, 13, -24, "#f0b4aa")}${tel(hx + 17, hy - 25, 8, 18, 24, k.c, OL)}${tel(hx + 17, hy - 24, 4.6, 13, 24, "#f0b4aa")}${el(hx, hy, 24, 21, k.c, OL)}${el(hx - 12, hy, 9.6, 9.6, k.b, `opacity=".75"`)}${el(hx + 12, hy, 9.6, 9.6, k.b, `opacity=".75"`)}${shine(hx - 10, hy - 14, 8, 3.4)}${eye(hx - 12, hy - 1, m, { r: 6.4 })}${eye(hx + 12, hy - 1, m, { r: 6.4 })}${el(hx, hy + 12, 11, 8, k.b)}${el(hx, hy + 9, 5.2, 3.6, "#e8988e", OL)}${dot(hx - 1.8, hy + 9, 0.9, "#7a3a34")}${dot(hx + 1.8, hy + 9, 0.9, "#7a3a34")}${mouth(hx, hy + 12.6, m)}${whisk(hx, hy + 12, 10, 25, "#4a3428")}${blush(hx - 19, hx + 19, hy + 9)}`;
/** A soft pointed brush of hair centred on x,y, tip pointing up before rotation. */
const brush = (x, y, rot, col, len = 15) => g(`rotate(${rot} ${x} ${y})`, p(`M${x} ${y - len}Q${x + 2} ${y - len * 0.7} ${x + 5.6} ${y - len * 0.66}L${x + 4.6} ${y - len * 0.34}L${x + 8} ${y - len * 0.1}L${x + 5.6} ${y + len * 0.14}L${x + 6.6} ${y + len * 0.44}Q${x + 4} ${y + len} ${x} ${y + len}Q${x - 4} ${y + len} ${x - 6.6} ${y + len * 0.44}L${x - 5.6} ${y + len * 0.14}L${x - 8} ${y - len * 0.1}L${x - 4.6} ${y - len * 0.34}L${x - 5.6} ${y - len * 0.66}Q${x - 2} ${y - len * 0.7} ${x} ${y - len}Z`, col, `stroke="#10080444" stroke-width="1"`) + ln(`M${x} ${y + len * 0.7}V${y - len * 0.4}M${x - 3} ${y + len * 0.5}l-1 -${f(len * 0.5)}M${x + 3} ${y + len * 0.5}l1 -${f(len * 0.5)}`, "#ffffff2e", 1.2));

/** Black band with a white flag at the end: the jerboa's tail tuft. */
const flag = (x, y, rot) => g(`rotate(${rot} ${x} ${y})`, el(x, y, 6, 9.5, "#2a201c") + p(`M${x - 5} ${y + 5}Q${x - 6} ${y + 14} ${x} ${y + 16}Q${x + 6} ${y + 14} ${x + 5} ${y + 5}Q${x} ${y + 9} ${x - 5} ${y + 5}Z`, "#fff", OL));

function jerboa(k, m, sig) {
  const legLine = (d) => ln(d, "#a87a4c", 5.4) + ln(d, k.c, 3.6);
  const toes = (d) => ln(d, "#b87c66", 5.4) + ln(d, "#f4d2b4", 3.8);
  if (!sig) {
    return {
      behind: ln("M46 82C22 80 12 88 16 100", "#a87a4c", 4.8) + ln("M46 82C22 80 12 88 16 100", k.c, 3) + flag(17, 102, 8),
      actor: `${legLine("M49 88L31 99L43 114")}${legLine("M71 88L89 99L77 114")}${toes("M43 115H58")}${toes("M77 115H62")}${tel(46, 83, 10, 13, 30, k.c, OL)}${tel(74, 83, 10, 13, -30, k.c, OL)}${el(60, 77, 19, 19, k.c, OL)}${el(60, 81, 12, 14, k.b)}${both(ln("M42 77Q38 85 44 91", k.b, 2.4, `opacity=".8"`))}${both(tel(54, 77, 3.2, 6, -18, "#f4d2b4", OL))}${jerboaFace(k, m, 60, 46)}`,
      neck: [60, 66, 14], cap: [60, 28, 0.7],
    };
  }
  return {
    behind: pop(ln("M3 119L27 110L17 99L42 91L34 82", "#fff3a0", 2.6, `stroke-dasharray="5 5"`) + spark(102, 94, 6) + spark(112, 80, 4)),
    actor: `${ln("M48 66C28 66 10 58 12 40", "#a87a4c", 4.8)}${ln("M48 66C28 66 10 58 12 40", k.c, 3)}${flag(12, 34, 178)}${legLine("M56 78L34 84L23 101")}${toes("M23 101L15 112")}${legLine("M68 84L52 98L50 108")}${toes("M50 108L40 118")}${tel(56, 74, 11, 15, 52, k.c, OL)}${tel(63, 68, 24, 16, -36, k.c, OL)}${tel(68, 72, 15, 9, -36, k.b)}${tel(84, 70, 3.4, 7, -50, "#f4d2b4", OL)}${tel(92, 66, 3.4, 7, -60, "#f4d2b4", OL)}${g("rotate(8 80 46)", jerboaFace(k, m, 80, 46))}`,
    front: arcs("M98 100q10 6 8 16M108 94q10 8 9 20", "#ffffff", 2),
    anim: "bd-s-burrow-zig",
    tf: "translate(60 70) scale(.9) translate(-60 -68)",
    neck: [76, 63, 12], cap: [83, 29, 0.62],
    css: POP + move("zig", "0%,100%{transform:translate(0,0) rotate(0)}22%{transform:translate(2px,-4px) rotate(5deg)}45%{transform:translate(-4px,3px) rotate(-6deg)}70%{transform:translate(2px,-3px) rotate(4deg)}", ".95s cubic-bezier(.5,0,.4,1)", "62px 70px"),
  };
}

// =====================================================================================
// Clover Meadow: guinea pigs
// =====================================================================================
const CAVY = "M11 92C9 65 32 50 57 50C83 50 105 65 107 90C109 108 95 116 73 116L35 116C19 116 12 106 11 92Z";
const cavyFeet = (col = PINK) => paw(30, 115, 9, 3.8, col) + paw(53, 116, 7.6, 3.6, col) + paw(83, 116, 8, 3.8, col) + paw(101, 114, 7, 3.6, col);
const cavyEars = (l, r) => p("M55 62C44 54 31 58 33 69C35 80 48 77 58 69Z", l, OL) + ln("M52 65C45 62 38 63 37 69", "#c8707a", 2.6, `opacity=".65"`) + p("M97 62C106 54 119 59 116 70C113 80 103 76 95 69Z", r, OL) + ln("M100 65C106 62 112 64 112 70", "#c8707a", 2.6, `opacity=".65"`);
const cavyFace = (m, o = {}) => `${eye(64, 76, m, { r: 5.2, rim: o.rim ?? 0.8 })}${eye(90, 76, m, { r: 5.2, rim: o.rim ?? 0.8 })}${o.open ? "" : `${nose(77, 88, "#e8909a", 5)}${mouth(77, 90, m)}`}${whisk(77, 91, 15, 18, o.whisk || "#fff")}${blush(61, 94, 87)}`;

function american(k, m, sig) {
  const head = `${el(77, 79, 28, 26, k.b, OL)}${p("M49.4 78C50 62 60 54 71 53.6C69 64 73 75 68 86C61 92 50.4 88 49.4 78Z", k.c)}${p("M85 54C96 57 105 68 104.8 78C104 89 93 91 86 85C82 75 82 63 85 54Z", k.a)}${shine(76, 60, 5, 3.4, 0, 0.8)}`;
  const body = `${p(CAVY, k.b, OL)}${p("M33 56C45 50 60 49 70 52C58 62 56 84 48 114L33 115C28 96 26 72 33 56Z", k.c)}${p("M11 92C9.6 72 20 60 34 55.4C28 72 34 92 27 112C17 108 12 101 11 92Z", k.a)}${shine(34, 64, 12, 5, -25)}`;
  const pig = `${body}${head}${cavyEars(k.c, k.a)}`;
  if (!sig) return { actor: `${pig}${cavyFace(m, { rim: 1.4 })}${cavyFeet()}`, neck: [77, 100, 17], cap: [77, 56, 0.8] };
  const legs = [["M31 108L14 119", "M12 120l-5 1"], ["M52 112L47 128", "M46 129l-1 4"], ["M84 112L95 126", "M96 127l4 4"], ["M101 102L116 108", "M116 108l4 2"]];
  return {
    behind: el(62, 117, 24, 3.6, "#000", `opacity=".16"`),
    actor: `${legs.map(([a, b]) => ln(a, "#c87c78", 8) + ln(a, PINK, 6.2) + ln(b, PINK, 5)).join("")}${pig}${eye(64, 74, m, { r: 5.4, rim: 1.4 })}${eye(90, 74, m, { r: 5.4, rim: 1.4 })}${nose(77, 85, "#e8909a", 5)}${gape(77, 93, 5, 4.4)}${whisk(77, 88, 15, 18)}${blush(61, 94, 85)}`,
    front: pop(`${arcs("M22 108q10 9 24 9M104 106q-9 9 -22 11M10 84q-6 8 -3 18M115 66q7 8 4 19")}${word(25, 24, "pop!", 12)}${word(100, 15, "pop!", 9)}${spark(108, 36, 5)}${spark(12, 46, 4)}`),
    anim: "bd-s-burrow-corn",
    tf: "translate(2 -17) rotate(-13 60 84) translate(60 84) scale(.9) translate(-60 -84)",
    neck: [77, 100, 17], cap: [77, 56, 0.76],
    css: POP + move("corn", "0%,100%{transform:translate(0,0) rotate(0)}22%{transform:translateY(-5px) rotate(10deg)}44%{transform:translateY(11px) rotate(0)}66%{transform:translateY(-4px) rotate(-7deg)}84%{transform:translateY(9px) rotate(3deg)}", ".9s cubic-bezier(.35,0,.5,1)", "60px 68px"),
  };
}

/** A rosette: fine hair swirling out from one centre. */
function rosette(x, y, r, dark, light) {
  let a = "", b = "";
  for (let i = 0; i < 14; i++) {
    const t = (i / 14) * Math.PI * 2, from = i % 2 ? 0.28 : 0.12, to = i % 3 ? 1 : 0.8;
    const at = (u, m) => `${f(x + Math.cos(t + u) * r * m)} ${f(y + Math.sin(t + u) * r * m)}`;
    const seg = `M${at(0, from)}Q${at(0.2, to * 0.68)} ${at(0.66, to)}`;
    if (i % 2) b += seg;
    else a += seg;
  }
  return ln(a, dark, 1.5, `opacity=".85"`) + ln(b, light, 1.4);
}

function abyssinian(k, m, sig) {
  const tufts = p("M16 76L7 70L18 68L14 58L27 61L30 50L39 56L47 45L54 52L64 44L68 53L80 47L82 56L96 55L93 64L106 66L100 72L110 82L102 84", k.c, `stroke="#2a140a55" stroke-width="1.2" stroke-linejoin="round"`) + ln("M14 100l-7 6M22 110l-4 7", k.c, 4);
  const body = `${tufts}${p(CAVY, k.c, OL)}${p("M40 52C54 49 66 52 72 56C60 66 62 90 52 115L40 115C46 94 34 72 40 52Z", k.b)}${p("M12 94C14 80 22 76 30 80C26 92 30 104 24 111C16 107 13 101 12 94Z", k.a)}${rosette(27, 72, 14, "#5e301a", "#d89a66")}${rosette(50, 69, 12.5, "#c09464", "#fff6e4")}${rosette(35, 98, 13.5, "#5e301a", "#d89a66")}${ln("M16 86Q26 87 36 84Q46 82 52 88", "#5e301a", 1.6, `opacity=".6"`)}`;
  const head = `${p("M60 57L58 46L68 53L72 43L79 53L87 45L88 55L98 52L95 62Z", k.c)}${el(77, 79, 28, 26, k.c, OL)}${el(77, 91, 17, 13, k.b)}${p("M71 55Q77 66 74 80L82 80Q80 66 85 56Q78 53 71 55Z", k.b)}${rosette(77.5, 61, 11, "#a87448", "#fff8ea")}${cavyEars(k.a, k.a)}`;
  if (!sig) return { actor: `${body}${head}${cavyFace(m, { rim: 1 })}${cavyFeet()}`, neck: [77, 100, 17], cap: [77, 56, 0.8] };
  const up = "translate(-2 -12) rotate(-13 77 80)";
  return {
    actor: `${body}${cavyFeet()}${g(up, `${head}${eye(63, 73, m, { r: 5, rim: 1 })}${eye(90, 73, m, { r: 5, rim: 1 })}${nose(76.5, 82, "#e8909a", 5)}${gape(76.5, 93.5, 9, 9.4)}${teeth(76.5, 85)}${whisk(77, 88, 15, 18)}${blush(60, 95, 84)}`)}${paw(97, 101, 6, 5)}`,
    front: pop(`${arcs("M104 44q9 10 3 24M111 34q15 18 6 42M46 28q-6 4 -8 10")}${word(33, 22, "WHEEK!", 13)}`),
    anim: "bd-s-burrow-wheek",
    neck: [73, 93, 17], cap: [70, 43, 0.74],
    css: POP + move("wheek", "0%,100%{transform:scale(1,1)}30%{transform:scale(.97,1.07)}60%{transform:scale(1.02,.97)}", ".7s ease-in-out", "60px 117px"),
  };
}

function peruvian(k, m) {
  const hair = "M18 119C4 100 12 64 34 55C48 46 70 42 86 50C106 60 112 82 111 98C114 108 116 115 112 120C107 113 104 118 99 120C97 111 92 117 85 120C82 113 74 117 68 120C63 112 55 119 47 120C42 113 34 120 28 118C26 114 22 118 18 119Z";
  const strands = ln("M34 62C20 76 20 96 14 112M48 58C34 76 38 98 30 116M58 56C48 76 54 98 46 116M96 62C106 78 102 96 108 114M26 74C18 86 20 96 17 104", "#b8946a", 1.3, `opacity=".75"`);
  const saddle = p("M34 55C20 62 10 84 13 106C20 98 22 108 28 112C32 96 30 88 40 78C46 68 52 58 60 52C50 49 42 50 34 55Z", k.a) + ln("M30 66C22 78 20 90 20 98M42 60C34 70 30 80 28 94", "#f2c08a", 1.3);
  const face = `${el(77, 81, 21, 19.5, k.b, OL)}${el(77, 90, 12, 9, "#f6e4cc")}${eye(68, 79, m, { r: 4.8 })}${eye(87, 79, m, { r: 4.8 })}${nose(77.5, 88.5, "#e8909a", 4.4)}${mouth(77.5, 90.5, m)}${whisk(77.5, 92, 11, 16, "#c8a47a")}${blush(63, 92, 87)}`;
  const locks = p("M63 60C46 72 52 98 38 117C48 113 52 116 55 110C60 100 58 92 60 84C62 76 60 68 63 60Z", k.c) + p("M91 60C108 72 102 98 116 117C106 113 102 116 98 110C93 100 96 90 94 83C92 76 94 68 91 60Z", k.a) + ln("M56 74C52 88 54 98 46 111M99 76C102 90 100 98 108 111", "#a87a4e", 1.2, `opacity=".7"`);
  const bangs = p("M53 77C54 56 66 49 77 52C90 49 102 60 101 77C96 66 90 64 86 71C86 62 80 59 77 66C74 60 66 62 67 71C62 64 56 67 53 77Z", k.c, `stroke="#a8825a66" stroke-width="1"`) + ln("M70 55Q65 60 62 66M78 54Q80 60 77 64M87 56Q92 60 94 68", "#c8a47a", 1.2);
  const bow = g("translate(77 55)", p("M0 0L-9 -6Q-12 0 -9 5ZM0 0L9 -6Q12 0 9 5Z", "#ff7aa8", OL) + dot(0, 0, 2.8, "#ff4f8a"));
  return {
    actor: `${paw(54, 119, 6, 2.8)}${paw(90, 119, 6, 2.8)}${p(hair, k.c, `stroke="#a8825a77" stroke-width="1.2"`)}${saddle}${strands}${shine(52, 66, 11, 4.4, -28, 0.45)}${face}${locks}${bangs}${bow}`,
    neck: [77, 100, 14], cap: [77, 55, 0.74],
  };
}

function skinny(k, m) {
  const fuzz = "#a8704a";
  const ears = p("M56 63C42 50 24 56 29 71C33 84 48 80 59 71Z", k.c, `stroke="${k.a}" stroke-width="1.4"`) + p("M50 64C41 59 33 62 35 70C37 76 46 74 52 69Z", "#d88c94") + p("M96 63C108 50 126 57 119 72C114 83 104 79 94 71Z", k.c, `stroke="${k.a}" stroke-width="1.4"`) + p("M101 64C109 59 116 63 113 71C110 76 104 74 99 69Z", "#d88c94");
  const wrinkles = ln("M46 62C38 74 40 90 48 102M40 66C33 76 34 86 39 94M52 106Q60 113 70 111M20 100Q24 106 31 108M17 88Q18 94 23 97", k.a, 1.4, `opacity=".65"`);
  const spots = el(28, 74, 8, 6, k.a, `opacity=".36"`) + el(22, 90, 4, 5, k.a, `opacity=".3"`) + el(44, 57, 5, 3.4, k.a, `opacity=".3"`) + dot(33, 90, 2.4, k.a, `opacity=".3"`);
  const toes = [[30, 115, 9], [53, 116, 7.6], [83, 116, 8], [101, 114, 7]].map(([x, y, r]) => paw(x, y, r, 3.8, "#e89c9c") + fluff(x, y - 1.6, r * 0.66, 3, fuzz, 8, 1.35, "")).join("");
  return {
    actor: `${p(CAVY, k.c, `stroke="${k.a}" stroke-width="1.4"`)}${spots}${wrinkles}${shine(40, 66, 14, 6, -28, 0.4)}${el(77, 79, 28, 26, k.c, `stroke="${k.a}" stroke-width="1.2"`)}${el(77, 90, 18, 13, k.b)}${shine(70, 61, 8, 4, -15, 0.45)}${ln("M67 62Q77 58 87 62M71 67Q77 65 83 67", k.a, 1.1, `opacity=".6"`)}${ears}${fluff(77, 86.5, 10.5, 7.6, fuzz, 14, 1.24, "")}${eye(64, 75, m, { r: 5.4 })}${eye(90, 75, m, { r: 5.4 })}${nose(77, 87, "#d87886", 4.4)}${mouth(77, 89.4, m)}${whisk(77, 90, 15, 15, "#8a6a5a")}${blush(61, 94, 87)}${toes}`,
    neck: [77, 100, 17], cap: [77, 56, 0.8],
  };
}

// =====================================================================================
// Clover Meadow: rabbits and friends
// =====================================================================================
const upEars = (col, inner = "#f2aeb4") => both(p("M48 50C35 37 31 13 40 7C49 3 57 24 58 46Z", col, OL) + p("M47 43C39 31 37 17 41.5 13.5C47.5 13 52 28 54 42Z", inner));
const bunFace = (m, o = {}) => {
  const y = o.y || 61, w = o.w || 13;
  return `${el(54, y + 13, 8.6, 7.2, o.muzzle)}${el(66, y + 13, 8.6, 7.2, o.muzzle)}${eye(60 - w, y, m, { r: o.r || 5.2, rim: o.rim ?? 0.8 })}${eye(60 + w, y, m, { r: o.r || 5.2, rim: o.rim ?? 0.8 })}${nose(60, y + 8.6, "#e8808e", 3.8)}${mouth(60, y + 11, m)}${whisk(60, y + 13, 15, 19, o.whisk || "#fff")}${blush(60 - w - 8, 60 + w + 8, y + 10)}`;
};

function dutch(k, m, sig) {
  const blaze = "M60 41.5C62.5 50 68 59 74 67C81 77 76 87 60 87C44 87 39 77 46 67C52 59 57.5 50 60 41.5Z";
  if (!sig) {
    return {
      actor: `${upEars(k.c)}${el(60, 96, 28, 22, k.b, OL)}${both(el(37.5, 100, 15.5, 16, k.c, OL) + shine(33, 93, 5, 7, 25, 0.16))}${both(el(34, 114, 13, 5.4, k.c, OL) + el(28, 114, 7.6, 4.8, k.b, OL))}${both(paw(52, 111.5, 6.2, 7, k.b))}${el(60, 63, 28, 23.5, k.c, OL)}${shine(43, 49, 8, 4.4)}${p(blaze, k.b)}${bunFace(m, { muzzle: k.b, w: 15.5, rim: 1.4, whisk: "#d8d0dc" })}`,
      neck: [60, 86, 20], cap: [60, 44, 0.74],
    };
  }
  const ear = (cx, cy, rot) => tel(cx, cy, 7.4, 18, rot, k.c, OL) + tel(cx, cy + 1, 3.6, 13, rot, "#f2aeb4");
  const hind = (cx, cy, rot, tx, ty) => tel(cx, cy, 18, 7.6, rot, k.c, OL) + tel(tx, ty, 9, 5.8, rot, k.b, OL);
  const head = g("rotate(17 81 50)", `${el(81, 50, 22, 19.5, k.c, OL)}${p("M81 33C83 40 87 47 91 53C96 61 92 68.6 81 68.6C70 68.6 66 61 71 53C75 47 79 40 81 33Z", k.b)}${eye(70, 47, m, { r: 4.6, rim: 1.4 })}${eye(92, 47, m, { r: 4.6, rim: 1.4 })}${nose(81, 56, "#e8808e", 3.2)}${mouth(81, 58, m)}${whisk(81, 60, 11, 15)}${blush(67, 95, 56)}`);
  return {
    behind: el(58, 117, 22, 3.4, "#000", `opacity=".16"`),
    actor: `${ear(63, 27, -48)}${ear(86, 19, -6)}${grp("bd-s-burrow-kick", hind(27, 66, 30, 13, 58) + hind(31, 87, -14, 16, 91))}${fluff(36, 98, 8, 8, k.b, 10, 1.25)}${tel(55, 76, 29, 20, -36, k.c, OL)}${tel(66, 68, 10, 20, -36, k.b)}${ln("M68 80L80 95", "#8a8290", 8.6)}${ln("M68 80L80 95", k.b, 6.8)}${ln("M58 86L59 102", "#8a8290", 8.6)}${ln("M58 86L59 102", k.b, 6.8)}${shine(42, 76, 5, 10, 55, 0.18)}${head}`,
    front: pop(`${arcs("M14 34q-12 20 -1 40M104 76q10 22 -12 36M95 82q4 14 -9 23M24 108q-9 -3 -14 -11")}${word(29, 20, "binky!", 12)}${spark(108, 40, 5)}`),
    anim: "bd-s-burrow-binky",
    tf: "translate(60 68) scale(.93) translate(-60 -66)",
    neck: [75, 66, 13], cap: [86, 34, 0.62],
    css: POP + move("binky", "0%,100%{transform:translate(0,0) rotate(0)}30%{transform:translate(1px,-3px) rotate(-12deg)}55%{transform:translate(0,6px) rotate(13deg)}78%{transform:translate(0,1px) rotate(-4deg)}", "1.05s cubic-bezier(.4,0,.4,1)", "58px 68px")
      + move("kick", "0%,100%{transform:rotate(0)}40%{transform:rotate(22deg)}70%{transform:rotate(-12deg)}", "1.05s ease-in-out", "46px 80px"),
  };
}

function hollandlop(k, m, sig) {
  if (!sig) {
    const lop = p("M43 43C27 39 14 55 15.5 75C16.5 91 25 99 33 93C41 85 38 70 43 59C46 52 50 46 43 43Z", k.a, OL) + ln("M36 51C25 59 22 74 26 87", "#f0b8a8", 3.4, `opacity=".75"`);
    return {
      actor: `${el(60, 98, 29, 20, k.c, OL)}${el(60, 99, 15, 17, k.b)}${both(paw(35, 114, 13, 5.2, k.b))}${both(paw(52, 112, 6.2, 6.6, k.b))}${el(60, 65, 31, 25, k.c, OL)}${shine(48, 50, 9, 4.4)}${bunFace(m, { muzzle: k.b, y: 63, w: 13.5 })}${both(lop)}${p("M43 45Q44 33 52 38Q54 29 60 35Q66 29 68 38Q76 33 77 45Q68 39 60 41Q52 39 43 45Z", k.c, OL)}`,
      neck: [60, 87, 19], cap: [60, 43, 0.72],
    };
  }
  const em = m === "happy" ? "sleepy" : m;
  const foot = (cx, cy, rot, col) => tel(cx, cy, 15, 5.6, rot, col, OL) + ln(`M${cx - 10} ${cy - 1}l-3 .6M${cx - 9} ${cy + 2}l-3 1`, "#7a4a2a", 1);
  return {
    actor: `${foot(19, 103, -14, k.c)}${p("M19 105C17 82 40 70 63 73C86 76 96 94 91 108C85 119 38 119 19 105Z", k.c, OL)}${shine(40, 82, 14, 5, -14)}${p("M28 110C36 90 66 87 82 104C78 117 44 119 28 110Z", k.b)}${fluff(19, 90, 7.4, 7.4, k.b, 10, 1.25)}${foot(22, 115, 3, k.b)}${tel(55, 116, 11, 4.2, 4, k.b, OL)}${tel(105, 110, 8, 15, -62, k.a, OL)}${el(85, 92, 24, 20.5, k.c, OL)}${el(87, 101, 9, 7, k.b)}${el(99, 100, 9, 7, k.b)}${eye(82, 91, em, { r: 4.8 })}${eye(101, 90, em, { r: 4.8 })}${nose(93, 96, "#e8808e", 3.4)}${mouth(93, 98.4, m)}${whisk(93, 100, 12, 13)}${blush(76, 106, 99)}${p("M78 74C61 69 50 81 54 95C57 106 69 105 71 94C73 85 79 80 85 76C84 74 81 74.6 78 74Z", k.a, OL)}${ln("M72 78C63 80 59 87 61 95", "#f0b8a8", 3, `opacity=".7"`)}`,
    front: grp("bd-s-burrow-float", heart(32, 55, 1.1) + heart(48, 36, 0.8) + heart(17, 38, 0.6)) + word(96, 55, "ahhh~", 11),
    anim: "bd-s-burrow-flop",
    neck: [74, 103, 11], cap: [91, 74, 0.68],
    css: move("flop", "0%,100%{transform:scale(1,1)}50%{transform:scale(1.015,.955)}", "2.8s ease-in-out", "60px 118px") + move("float", "0%{transform:translateY(0);opacity:1}80%{transform:translateY(-12px);opacity:.15}100%{transform:translateY(0);opacity:0}", "2.8s ease-out"),
  };
}

function netherland(k, m, sig) {
  const ring = (x, y, r) => dot(x, y, r, k.b, `opacity=".85"`);
  if (!sig) {
    const ears = both(tel(47, 30, 8.6, 18, -13, k.c, OL) + tel(47.4, 31, 4.4, 12.6, -13, "#f0a8a8") + tel(43.6, 15.4, 5.6, 3, -13, k.a));
    return {
      actor: `${ears}${el(60, 101, 24, 17, k.c, OL)}${el(60, 103, 13, 14, k.b)}${both(paw(40, 115, 10, 4.4, k.c))}${both(paw(52, 113, 5.4, 5.6, k.b))}${el(60, 64, 32, 28, k.c, OL)}${el(60, 42, 16, 7, k.a, `opacity=".4"`)}${shine(42, 49, 9, 5)}${both(ring(45, 63, 9.4))}${bunFace(m, { muzzle: k.b, y: 63, w: 15, r: 6.4 })}`,
      neck: [60, 89, 20], cap: [60, 40, 0.74],
    };
  }
  const ears = both(tel(48.5, 20, 7.4, 15, -11, k.c, OL) + tel(49, 21, 3.8, 10.6, -11, "#f0a8a8"));
  return {
    actor: `${both(paw(43, 115, 11, 4.4, k.c))}${p("M42 115C34 98 42 62 60 60C78 62 86 98 78 115C70 119 50 119 42 115Z", k.c, OL)}${el(60, 92, 12, 23, k.b)}${shine(45, 90, 4, 14, 10, 0.2)}${both(tel(49, 80, 5.4, 10, 18, k.c, OL) + paw(46.5, 89, 4.6, 4.2, k.b))}${ears}${el(60, 45, 25, 22.5, k.c, OL)}${shine(47, 33, 7, 3.6)}${both(ring(48.5, 43, 8))}${bunFace(m, { muzzle: k.b, y: 43, w: 11.5, r: 5.6 })}`,
    front: pop(arcs("M94 30q7 9 1 19M104 23q11 15 2 32M26 30q-7 9 -1 19M16 23q-11 15 -2 32", "#fff3a0", 2.2)),
    anim: "bd-s-burrow-peri",
    neck: [60, 64, 14], cap: [60, 26, 0.6],
    css: POP + move("peri", "0%,100%{transform:rotate(0) scale(1,1)}20%,35%{transform:rotate(-9deg) scale(.98,1.02)}60%,75%{transform:rotate(9deg) scale(.98,1.02)}", "2.6s ease-in-out", "60px 117px"),
  };
}

function lionhead(k, m) {
  const ears = both(tel(46, 24, 8, 19, -15, k.a, OL) + tel(46.5, 25, 4, 13.5, -15, "#f2b0ac"));
  const wisps = ln("M48 40Q46 30 52 27M56 37Q57 27 64 26M66 39Q70 31 76 32", k.a, 2.6) + both(ln("M34 66Q22 68 18 77M36 76Q27 82 27 90M30 54Q20 52 16 58", "#fff4e0", 1.6));
  return {
    actor: `${ears}${el(60, 101, 27, 17, k.c, OL)}${el(60, 103, 14, 14, k.b)}${both(paw(35, 114, 12, 5, k.b))}${both(paw(52, 113, 5.6, 6, k.b))}${fluff(60, 65, 39, 34, k.a, 22, 1.17)}${fluff(60, 66, 32, 28, k.c, 18, 1.17, "")}${wisps}${el(60, 65, 23.5, 20.5, k.c)}${el(60, 74, 15, 11, k.b)}${fluff(60, 46, 12, 6.4, k.c, 10, 1.3, "")}${bunFace(m, { muzzle: k.b, y: 63, w: 12, whisk: "#c8a478" })}`,
    neck: [60, 92, 21], cap: [60, 40, 0.76],
  };
}

function jackalope(k, m) {
  const ear = p("M45 57C29 52 9 38 9 24C21 15 44 32 55 49Z", k.c, OL) + p("M42 52C30 46 17 37 15.5 28C24 25 39 36 49 48Z", "#f4b8c4") + p("M9 24C10 19 16 18 24 21L17 33C12 29 9 27 9 24Z", "#2e2236");
  const antler = (d) => ln(d, "#5c3a1a", 5.6) + ln(d, k.a, 3.6);
  const horns = both(antler("M52 47C48 34 45 23 50 6M48.4 32L37 24M47 19L39 8M49 17L57 9"));
  return {
    behind: dot(60, 56, 52, "#fff0b8", `class="bd-glow"`),
    actor: `${both(ear)}${horns}${el(60, 96, 27, 22, k.c, OL)}${el(60, 97, 14, 18, k.b)}${both(el(40, 101, 13, 15, k.c, OL))}${both(paw(35, 115, 13, 4.8, k.b))}${both(paw(52, 111, 5.6, 7.4, k.b))}${fluff(88, 104, 7, 7, "#fff", 10, 1.25)}${p("M60 42C76 42 86 52 87 65C90 80 76 87 60 87C44 87 30 80 33 65C34 52 44 42 60 42Z", k.c, OL)}${p("M60 45.5C54 46 53 55 59 58C55.5 54 57 48.5 63.5 46.6Q61.8 45.5 60 45.5Z", "#fff6b0", `stroke="#e8c85a" stroke-width=".8"`)}${both(el(46.5, 63, 8.2, 8.2, k.b, `opacity=".85"`))}${bunFace(m, { muzzle: k.b, y: 63, w: 13.5, r: 5.6 })}`,
    front: grp("bd-glow", spark(14, 62, 5) + spark(104, 56, 4) + spark(100, 90, 3) + spark(18, 90, 3.4) + spark(84, 6, 4.6)),
    neck: [60, 86, 19], cap: [60, 47, 0.52],
  };
}

function prairiedog(k, m, sig) {
  const mound = p("M8 120C16 108 36 110 60 110C84 110 104 108 112 120Z", "#b47c50", OL) + dot(20, 116, 2.4, "#8a5a38") + dot(96, 117, 1.8, "#8a5a38");
  const claws = (x, y) => ln(`M${x - 4} ${y}l-1 3.4M${x} ${y + 1}v3M${x + 4} ${y}l1 3.4`, k.a, 1.2);
  const ears = (y) => both(dot(35.5, y, 5.4, k.c, OL) + dot(36.2, y + 0.6, 2.6, "#8a5a3c"));
  const headShape = "M60 24C80 24 91 36 89 49C90 62 76 68 60 68C44 68 30 62 31 49C29 36 40 24 60 24Z";
  if (!sig) {
    return {
      behind: mound + tel(87, 104, 6.4, 14, 54, k.c, OL) + tel(97, 96.6, 5.4, 8.4, 54, k.a),
      actor: `${p("M40 112C31 95 38 62 60 60C82 62 89 95 80 112C72 117 48 117 40 112Z", k.c, OL)}${el(60, 92, 13.5, 22, k.b)}${both(paw(44, 112, 10, 4.4, k.c) + claws(40, 113.6))}${ears(36)}${p(headShape, k.c, OL)}${el(60, 30, 17, 5.6, "#7a4a22", `opacity=".22"`)}${both(el(43, 55, 10.5, 9.4, k.b) + el(47, 42.5, 8.4, 7.4, k.b, `opacity=".85"`))}${el(60, 57, 13.5, 9.4, k.b)}${eye(47.5, 43, m, { r: 5 })}${eye(72.5, 43, m, { r: 5 })}${nose(60, 52, "#5a362c", 4.6)}${teeth(60, 59.4)}${mouth(60, 55, m)}${whisk(60, 57, 12, 20, k.a)}${blush(39, 81, 55)}${both(tel(46, 81, 5.6, 11, -34, k.c, OL) + paw(53.5, 88, 4.6, 3.8, k.b) + claws(53.5, 89.4))}`,
      neck: [60, 66, 18], cap: [60, 28, 0.72],
    };
  }
  const arm = tel(30, 56, 6.2, 17, -38, k.c, OL) + paw(19.5, 42.5, 5.2, 4.8, k.b) + ln("M16 39l-3 -4M20 38l-1 -5M24 39l2 -4", k.a, 1.2);
  return {
    behind: mound + el(60, 112, 17, 3.6, "#3a2214"),
    actor: `${tel(81, 100, 6, 13, 24, k.c, OL)}${tel(86, 111, 5, 7.4, 24, k.a)}${both(tel(48, 109, 6.4, 11, 16, k.c, OL) + claws(45, 117))}${both(arm)}${p("M42 108C32 90 40 56 60 54C80 56 88 90 78 108C70 114 50 114 42 108Z", k.c, OL)}${el(60, 84, 13.5, 23, k.b)}${ears(30)}${p("M60 20C79 20 89 31 88 43C89 58 76 66 60 66C44 66 31 58 32 43C31 31 41 20 60 20Z", k.c, OL)}${both(el(43, 46, 10, 9.4, k.b))}${el(60, 48, 16, 14, k.b)}${eye(46, 32, m === "happy" ? "sleepy" : m, { r: 4.6 })}${eye(74, 32, m === "happy" ? "sleepy" : m, { r: 4.6 })}${nose(60, 37, "#5a362c", 4.8)}${gape(60, 50, 8, 9)}${teeth(60, 41.4)}${whisk(60, 42, 13, 18, k.a)}${blush(40, 80, 44)}`,
    front: pop(`${word(98, 20, "YIP!", 15)}${arcs("M92 30q6 6 5 14M101 28q10 9 8 23M24 108q-7 -6 -7 -14M96 108q7 -6 7 -14")}`),
    anim: "bd-s-burrow-yip",
    tf: "translate(0 -6)",
    neck: [60, 63, 16], cap: [60, 24, 0.6],
    css: POP + move("yip", "0%,100%{transform:translateY(0) scale(1,1)}25%{transform:translateY(-3px) scale(.97,1.02)}55%{transform:translateY(10px) scale(1.07,.9)}75%{transform:translateY(4px) scale(1,1)}", "1.15s cubic-bezier(.4,0,.4,1)", "60px 108px"),
  };
}

// =====================================================================================
// Climbing Wood
// =====================================================================================
function degu(k, m, sig) {
  const tailD = "M30 102C10 102 5 86 12 68";
  const tail = ln(tailD, "#6a4426", 6.4) + ln(tailD, k.c, 4.6) + brush(15.5, 57, 22, k.a, 16);
  const earSet = tel(56, 36, 10.6, 15.5, -28, k.c, OL) + tel(56.4, 37, 6.6, 11, -28, "#7a4c44") + tel(97, 37, 10.6, 15.5, 28, k.c, OL) + tel(96.6, 38, 6.6, 11, 28, "#7a4c44");
  const ring = (x) => el(x, 59, 9.4, 8.8, k.b);
  const body = `${p("M25 101C22 78 43 66 63 68C83 70 92 85 89 100C86 113 71 117 54 117C37 117 28 112 25 101Z", k.c, OL)}${p("M36 110C46 94 70 94 85 99C81 113 68 116.5 54 116.5C45 116.5 40 114 36 110Z", k.b)}${el(63, 82, 15, 7, k.b, `opacity=".6" transform="rotate(30 63 82)"`)}${shine(40, 80, 10, 4.4, -34)}${ln("M35 113C25 96 43 86 53 94C59 100 59 108 56 113", "#2a140833", 1.4)}`;
  const head = `${earSet}${el(77, 63, 23.5, 21.5, k.c, OL)}${el(77, 48, 12, 5.4, k.a, `opacity=".25"`)}${ring(66.5)}${ring(89)}${el(78.5, 74.5, 12.5, 8.4, k.b)}${eye(66.5, 59, m, { r: 5.2 })}${eye(89, 59, m, { r: 5.2 })}${nose(79, 69.5, "#8a4c44", 3.8)}${teeth(79, 76, "#f4961e")}${mouth(79, 71.5, m)}${whisk(79, 74, 11, 20, k.a)}${blush(60, 97, 71)}`;
  const feet = paw(46, 115, 11, 4, k.b) + paw(76, 115, 8, 3.8, k.b);
  if (!sig) return { behind: tail, actor: `${body}${head}${paw(70, 96, 5, 4, k.b)}${paw(87, 94, 5, 4, k.b)}${feet}`, neck: [76, 83, 15], cap: [77, 44, 0.74] };
  const wood = (d, w = 4) => ln(d, "#4a2a12", w + 1.8) + ln(d, "#9a6a38", w);
  const pile = wood("M3 117L38 105") + wood("M8 105L42 117") + wood("M2 111L30 98", 3) + wood("M14 119L40 111", 3.4) + wood("M10 99L26 114", 3) + el(12, 116, 7, 4.4, "#9a9490", OL) + el(30, 117, 6, 3.6, "#b8b0a8", OL) + el(22, 108, 4.4, 3.2, "#8a8480", OL);
  const carry = wood("M48 85L116 69", 4.2) + wood("M104 72L112 62", 2) + wood("M60 82L54 72", 2) + tel(53, 70, 6, 3.4, -40, "#6aa84a", OL);
  return {
    behind: tail,
    actor: g("translate(6 0)", `${body}${head}${carry}${paw(66, 86, 5.4, 4.4, k.b)}${paw(94, 80, 5.4, 4.4, k.b)}${feet}`),
    front: pile + pop(arcs("M50 98q-8 -2 -12 4M45 92q-8 0 -12 4", "#fff3a0", 2) + spark(18, 90, 4.6) + spark(40, 94, 3)),
    anim: "bd-s-burrow-haul",
    neck: [82, 84, 15], cap: [83, 44, 0.74],
    css: POP + move("haul", "0%,100%{transform:translate(0,0) rotate(0)}35%{transform:translate(-9px,1px) rotate(-8deg)}60%{transform:translate(-9px,2px) rotate(-8deg)}", "1.8s ease-in-out", "60px 116px"),
  };
}

function hooded(k, m, sig) {
  const hood = k.a;
  const ratHead = (em, open) => `${roundEar(57, 40, 13, "#7a564e", "#f2aca8")}${roundEar(100, 42, 12.4, "#7a564e", "#f2aca8")}${p("M54 62C54 46 65 38 78 38C94 38 105 49 105 62C105 71 98 73 93 78C87 85 74 86 66 82C57 77 54 71 54 62Z", hood, `stroke="#1a0e0a66" stroke-width="1.2"`)}${shine(66, 47, 8, 3.8, -28, 0.2)}${el(85, 74, 11.5, 8, "#7c5e56")}${eye(69, 60, em, { r: 5, rim: 1.5, lid: "#f4e4dc" })}${eye(92, 60, em, { r: 5, rim: 1.5, lid: "#f4e4dc" })}${nose(86, 71, "#f49ca2", 4.2)}${open ? gape(85.5, 79, 5.4, 5.4) : teeth(86, 77.4) + mouth(86, 73, m, "#f4d8d0")}${whisk(86, 75, 11, 21)}${blush(63, 100, 71)}`;
  const tail = (d) => ln(d, "#c87c76", 5.4) + ln(d, "#f2b4ac", 3.8) + ln(d, "#c87c7688", 3.8, `stroke-dasharray="1 3"`);
  if (!sig) {
    return {
      behind: tail("M30 107C8 114 3 94 17 89C28 86 31 97 22 101"),
      actor: `${p("M23 100C21 77 42 65 62 67C85 69 93 86 90 101C87 114 70 117 52 117C35 117 25 112 23 100Z", k.c, `stroke="#6a5a5266" stroke-width="1.2"`)}${p("M55 68.4C72 64 90 76 90.6 94C80 94 71 101 62 96C58 87 53 79 55 68.4Z", hood)}${ln("M24 96C25 78 42 69.4 60 70", hood, 6.4)}${ln("M35 113C25 96 43 86 53 94C59 100 59 108 56 113", "#3a2a2433", 1.4)}${ratHead(m, false)}${paw(70, 99, 5.2, 4.2)}${paw(87, 99, 5.2, 4.2)}${paw(45, 115, 11, 4)}${paw(77, 115, 8.6, 3.8)}`,
      neck: [76, 84, 15], cap: [79, 42, 0.74],
    };
  }
  const em = m === "happy" ? "sleepy" : m;
  const leg = (d, x, y) => ln(d, "#8a7a72", 10) + ln(d, k.c, 8.4) + paw(x, y, 5.4, 4.6);
  return {
    behind: tail("M22 106C6 112 3 92 14 85"),
    actor: `${leg("M32 90L22 72", 21, 69)}${leg("M64 88L72 70", 73, 67)}${p("M16 100C16 81 38 76 57 79C76 81 90 92 85 106C79 119 27 119 16 100Z", k.c, `stroke="#6a5a5266" stroke-width="1.2"`)}${ln("M19 105C30 118 62 119 82 110", hood, 6)}${el(47, 92, 20, 10, "#fff2ee")}${leg("M45 86L40 70", 39, 67)}${g("translate(4 22) rotate(15 79 62)", ratHead(em, true))}`,
    front: grp("bd-s-burrow-feather", g("translate(50 87) scale(.72) translate(-48 -86)", ln("M9 24L48 86", "#a86a2a", 2.2) + p("M9 24C22 22 40 42 46 76C40 72 35 74 31 67C26 67 24 60 20 56C14 52 16 45 12 41C9 36 10 28 9 24Z", "#5ac8e8", `stroke="#1a6a8a" stroke-width="1.3"`) + ln("M12 30L43 76", "#e8fbff", 1.3))) + pop(word(80, 22, "hee hee!", 12) + arcs("M104 32q8 6 8 14M110 24q10 9 8 24", "#fff3a0", 2) + arcs("M52 56l4 -8M61 59l7 -6", "#ffffff", 2)),
    anim: "bd-s-burrow-giggle",
    neck: [72, 103, 11], cap: [84, 63, 0.62],
    css: POP + move("giggle", "0%,100%{transform:rotate(0) translateY(0)}25%{transform:rotate(-3.5deg) translateY(-2px)}75%{transform:rotate(3.5deg) translateY(0)}", ".32s ease-in-out", "52px 110px") + move("feather", "0%,100%{transform:rotate(0)}50%{transform:rotate(-15deg)}", ".45s ease-in-out", "23px 42px"),
  };
}

function dumbo(k, m, sig) {
  const ears = both(dot(24.5, 55, 20, k.c, OL) + dot(25, 55.6, 14, k.a) + shine(19, 48, 5, 3.4, -35, 0.4));
  const tailD = "M80 110C106 118 116 100 107 91C101 86 95 92 100 96";
  const tail = ln(tailD, "#c87c86", 5.4) + ln(tailD, k.a, 3.8) + ln(tailD, "#c87c8688", 3.8, `stroke-dasharray="1 3"`);
  const body = `${p("M35 112C28 92 40 74 60 74C80 74 92 92 85 112C75 118 45 118 35 112Z", k.c, OL)}${el(60, 97, 14.5, 18, k.b)}`;
  const head = `${p("M60 28C79 28 87 42 85 56C83 71 70 81 60 83C50 81 37 71 35 56C33 42 41 28 60 28Z", k.c, OL)}${p("M57.5 31.4Q60 30 62.5 31.4L65 52Q73 65 69 74Q60 83 51 74Q47 65 55 52Z", k.b)}${shine(46, 37, 7, 3.6)}`;
  const feet = both(paw(43, 115, 10, 4.2)) ;
  if (!sig) {
    return {
      behind: tail,
      actor: `${ears}${body}${head}${eye(47, 53, m, { r: 5.4 })}${eye(73, 53, m, { r: 5.4 })}${nose(60, 70, "#f0909c", 4.4)}${teeth(60, 76.6)}${mouth(60, 72, m)}${whisk(60, 73, 10, 24, "#fff")}${blush(43, 77, 66)}${both(paw(49, 96, 5.2, 4.2))}${feet}`,
      neck: [60, 83, 17], cap: [60, 32, 0.72],
    };
  }
  // Eyes pushed forward out of their sockets while the jaw grinds.
  const bulge = (x) => dot(x, 50, 11, "#ffffff", `stroke="#5a6078" stroke-width="1.6"`) + eye(x, 50, m, { r: 7 });
  return {
    behind: tail,
    actor: `${ears}${body}${head}${grp("bd-s-burrow-bogl", bulge(45))}${grp("bd-s-burrow-bogr", bulge(75))}${grp("bd-s-burrow-grind", nose(60, 68.5, "#f0909c", 4.4) + teeth(60, 73) + teeth(60, 80, "#ffd89a") + ln("M52 75q3 5 8 2q5 3 8 -2", INK, 1.4))}${whisk(60, 72, 10, 24, "#fff")}${blush(39, 81, 66)}${both(paw(48, 99, 5.2, 4.2))}${feet}`,
    front: pop(`${arcs("M27 78l6 3l-5 4l6 3M93 78l-6 3l5 4l-6 3", "#fff3a0", 2.2)}${word(24, 104, "brux", 10)}${word(98, 20, "brux", 10)}${arcs("M40 16l-4 -8M60 20v-9M80 16l4 -8", "#ffffff", 2)}`) + heart(18, 22, 0.8),
    anim: "bd-s-burrow-purr",
    neck: [60, 85, 17], cap: [60, 32, 0.72],
    css: POP + move("purr", "0%,100%{transform:scale(1,1)}50%{transform:scale(1.014,.986)}", ".5s ease-in-out", "60px 116px") + move("grind", "0%,100%{transform:translateX(-1.8px)}50%{transform:translateX(1.8px)}", ".16s linear")
      + move("bogl", "0%,100%{transform:scale(1.08)}50%{transform:scale(.74)}", ".42s ease-in-out", "45px 50px") + move("bogr", "0%,100%{transform:scale(1.08)}50%{transform:scale(.74)}", ".42s ease-in-out", "75px 50px"),
  };
}

function ferret(k, m, sig) {
  const ferretHead = (em, open) => `${both2(70, 102, 39, k)}${p("M62 56C62 41 73 34 86 34C100 34 110 43 110 56C110 70 97 77 86 77C73 77 62 70 62 56Z", k.b, OL)}${p("M70 38Q86 30 102 38Q92 40 86 45Q80 40 70 38Z", k.c)}${p("M63 51C68 43 79 44 83.5 51Q86 53 88.5 51C93 44 104 43 109 51C111 59 102 63 95 60.5Q89 58 86 55Q83 58 77 60.5C69 63 61 59 63 51Z", k.a)}${el(86, 66.5, 12.4, 9, "#fffaf2")}${eye(75, 53, em, { r: 4.6, rim: 1.5, lid: "#fff3e4" })}${eye(97, 53, em, { r: 4.6, rim: 1.5, lid: "#fff3e4" })}${nose(86, 63, "#e87c8a", 4)}${open ? gape(86, 72, 6, 5.6) : mouth(86, 65.5, m)}${whisk(86, 68, 10, 20, "#c8b49a")}${blush(68, 104, 66)}`;
  const leg = (d) => ln(d, "#24120a", 11) + ln(d, k.a, 9.4);
  if (!sig) {
    return {
      behind: p("M34 94C18 93 5 101 3 113C14 119 30 114 40 107Z", k.a, OL) + ln("M10 110Q18 102 30 100", "#7a5440", 1.6),
      actor: `${leg("M54 102L57 114")}${leg("M92 94L97 114")}${paw(60, 115, 7, 3.6, k.a)}${paw(100, 115, 7, 3.6, k.a)}${p("M26 101C23 83 40 75 54 79C64 83 69 80 73 68C80 55 97 57 100 72C104 89 99 103 85 107C72 110 62 104 52 109C40 114 28 112 26 101Z", k.c, OL)}${p("M30 90C38 77 52 78 60 83C66 84 70 80 73 76C70 92 52 92 42 94Q34 96 30 90Z", "#9a6a48", `opacity=".42"`)}${p("M80 82C92 78 99 84 96 94C90 101 82 98 80 82Z", k.b)}${leg("M39 101L36 114")}${leg("M80 100L80 114")}${paw(39, 115, 7.4, 3.6, k.a)}${paw(83, 115, 7.4, 3.6, k.a)}${ferretHead(m, false)}`,
      neck: [85, 77, 14], cap: [86, 38, 0.7],
    };
  }
  const back = "M24 108C13 72 32 40 57 41C78 42 82 62 91 74C104 70 112 82 106 93C99 103 85 99 76 90C65 80 63 65 53 65C41 66 40 90 43 108C37 114 28 114 24 108Z";
  return {
    behind: g("rotate(-34 18 82)", fluff(18, 80, 10, 25, k.a, 18, 1.32)) + el(60, 117, 30, 3.4, "#000", `opacity=".1"`),
    actor: `${leg("M40 100L52 114")}${leg("M101 90L114 101")}${paw(56, 115, 7, 3.6, k.a)}${paw(114, 103, 5.6, 4, k.a)}${p(back, k.c, OL)}${p("M24 92C20 66 36 45 57 45C70 46 76 55 78 62C66 52 44 52 34 70Q28 80 24 92Z", "#9a6a48", `opacity=".45"`)}${leg("M28 104L17 114")}${leg("M85 94L79 112")}${paw(15, 116, 7.4, 3.4, k.a)}${paw(79, 114, 7, 3.6, k.a)}${g("translate(1 24) rotate(15 86 56)", ferretHead(m, true))}`,
    front: pop(`${word(99, 30, "dook!", 12)}${word(80, 16, "dook!", 9)}${arcs("M8 38l8 6l-7 6M114 50l-7 6l7 6M46 28q10 -8 22 -2M32 117q10 5 22 1")}`),
    anim: "bd-s-burrow-war",
    neck: [80, 96, 11], cap: [92, 63, 0.6],
    css: POP + move("war", "0%,100%{transform:translate(0,0) rotate(0)}18%{transform:translate(-7px,-11px) rotate(-12deg)}36%{transform:translate(-9px,0) rotate(4deg)}55%{transform:translate(-3px,-6px) rotate(7deg)}74%{transform:translate(0,0) rotate(-5deg)}87%{transform:translate(0,-6px) rotate(-8deg)}", "1.1s ease-in-out", "58px 108px"),
  };
}
/** Pale-rimmed ferret ears at two x positions. */
function both2(x1, x2, y, k) {
  return [x1, x2].map((x) => dot(x, y, 8.6, "#fffaf0", OL) + dot(x, y + 1, 5.4, k.a)).join("");
}

function chinchillaBody(k, m, o = {}) {
  const ear = tel(30, 36, 18, 21, -30, k.c, `stroke="${k.a}" stroke-width="1.8"`) + tel(31, 37, 12.6, 15.6, -30, o.inner || "#d8aab2") + tel(33, 41, 6, 8, -30, "#a8727e", `opacity=".45"`);
  return `${both(ear)}${fluff(60, 91, 33, 26, k.c, 30, 1.08)}${fluff(60, 99, 20, 16, k.b, 18, 1.1, "")}${fluff(60, 60, 29.5, 25.5, k.c, 28, 1.07)}${el(60, 42, 15, 7, k.a, `opacity=".25"`)}${shine(43, 48, 8, 4.4)}${el(53.5, 70, 10, 8.4, k.b)}${el(66.5, 70, 10, 8.4, k.b)}${eye(46.5, 57, m, { r: 5.8, rim: 1 })}${eye(73.5, 57, m, { r: 5.8, rim: 1 })}${nose(60, 65.5, "#e88c9c", 3.8)}${mouth(60, 68, m)}${whisk(60, 70, 13, 31, k.a)}${blush(38, 82, 68)}`;
}

function chinchilla(k, m, sig) {
  const tail = p("M80 108C104 117 119 100 116 80C114 66 104 58 96 63C106 74 103 92 82 92Z", k.a, OL) + ln("M96 108l8 5M106 102l9 2M110 92l8 -2M110 81l7 -5M104 71l5 -7M90 106l5 8", k.a, 2.4) + ln("M90 101Q106 97 107 78", k.c, 3.4);
  if (!sig) {
    return {
      behind: tail,
      actor: `${chinchillaBody(k, m)}${both(paw(51, 91, 5.4, 4.4, "#f0d8d4"))}${both(paw(41, 114, 11.4, 4.8, "#f0d8d4"))}`,
      neck: [60, 81, 23], cap: [60, 39, 0.8],
    };
  }
  const puff = (x, y, r) => dot(x, y, r, "#f4e6cc", `opacity=".94"`) + dot(x + r * 0.9, y + r * 0.35, r * 0.7, "#ead8b8", `opacity=".9"`) + dot(x - r * 0.85, y + r * 0.4, r * 0.62, "#fbf2e0", `opacity=".9"`);
  return {
    behind: el(60, 108, 52, 9, "#a87850", OL) + grp("bd-s-burrow-dustb", puff(19, 80, 10) + puff(102, 58, 9) + puff(94, 28, 5.4)),
    actor: `${tail}${chinchillaBody(k, m)}${both(paw(47, 91, 5.6, 4.6, "#f0d8d4"))}${paw(38, 113, 11, 5, "#f0d8d4")}${paw(85, 111, 11, 5, "#f0d8d4")}`,
    tf: "translate(6 1) rotate(-56 60 82) translate(60 82) scale(.8) translate(-60 -82)",
    front: p("M8 107Q60 118 112 107L105 119Q60 125 15 119Z", "#c8945e", OL) + el(60, 108.6, 47, 4.8, "#f0deb8") + grp("bd-s-burrow-dusta", puff(26, 106, 9) + puff(92, 103, 11) + puff(60, 113, 6)) + pop(arcs("M82 20q24 6 30 28M104 50l9 -1l-3 -9M16 50q2 -18 18 -28", "#fff3a0", 2.4) + dot(14, 62, 2, "#f4e6cc") + dot(108, 76, 2.4, "#f4e6cc") + dot(66, 12, 1.8, "#f4e6cc")),
    anim: "bd-s-burrow-roll",
    neck: [60, 81, 22], cap: [60, 39, 0.76],
    css: POP + move("roll", "0%,100%{transform:rotate(0)}30%{transform:rotate(-34deg)}65%{transform:rotate(30deg)}", ".95s ease-in-out", "60px 84px")
      + move("dusta", "0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.14) translateY(-4px);opacity:.65}", ".6s ease-in-out", "60px 108px") + move("dustb", "0%,100%{transform:scale(.97) translateY(0);opacity:1}50%{transform:scale(1.08) translateY(-6px);opacity:.4}", ".95s ease-in-out", "60px 90px"),
  };
}

function violet(k, m) {
  // Sits up on a wooden ledge with its brush of a tail hanging over the front.
  const ledge = ln("M18 106L14 119M102 106L106 119", "#6a4222", 6) + p("M8 99Q60 94 112 99Q117 105 111 110Q60 115 9 110Q3 105 8 99Z", "#b4804a", `stroke="#5a3616" stroke-width="1.4"`) + ln("M16 103Q40 100 62 104M72 107Q90 104 104 106", "#7a5028", 1.3);
  const tail = p("M80 90C96 90 104 100 102 110C100 120 90 124 82 120C90 114 90 104 78 102Z", k.c, `stroke="${k.a}" stroke-width="1.4"`) + ln("M96 98l8 -1M101 108l7 2M96 117l5 5M88 120l0 4", k.c, 2.6) + ln("M84 94Q96 98 95 110", k.b, 2.2);
  const hip = dot(60, 93, 6.4, "#e8445a", OL) + ln("M60 87l-3 -4M60 87l1 -5M60 87l4 -3", "#4a8a3a", 1.6) + dot(58, 91, 1.8, "#fff", `opacity=".7"`);
  return {
    behind: dot(60, 54, 52, k.c, `class="bd-glow"`) + ledge,
    actor: `${g("translate(60 98) scale(.94) translate(-60 -112)", `${chinchillaBody(k, m, { inner: "#e8b0d0" })}${both(paw(42, 112, 11, 5, "#f6d8e4"))}`)}${tail}${hip}${both(paw(52.5, 93, 5, 4.2, "#f6d8e4"))}`,
    front: grp("bd-glow", spark(10, 66, 5, "#ffe8ff") + spark(111, 52, 4, "#ffe8ff") + spark(20, 88, 3, "#fff6a8") + spark(80, 7, 4, "#fff6a8")),
    neck: [60, 69, 21], cap: [60, 29, 0.74],
  };
}

const gliderHead = (k, m, o = {}) => {
  const ear = tel(31, 30, 9.6, 17, -42, k.c, OL) + tel(31.6, 31, 5.8, 12, -42, o.inner || "#e8a6b0");
  const marks = o.plain ? "" : `${p("M55.4 28.4Q60 26.4 64.6 28.4L62.6 52Q60 59 57.4 52Z", k.a)}${both(p("M55 54C46 65 31 59 29.4 41C30 35 34 33 38 37C40 43 46 43 52 46C57 48 57 51 55 54Z", k.a))}`;
  return `${both(ear)}${p("M60 27C80 27 92 39 92 52C93 67 76 77 60 77C44 77 27 67 28 52C28 39 40 27 60 27Z", k.c, o.plain ? `stroke="#a89cbc" stroke-width="1.3"` : OL)}${marks}${both(el(40, 65, 10.4, 7.4, k.b))}${el(60, 68, 12.4, 8.6, k.b)}${shine(44, 35, 8, 3.4, -20, 0.3)}${eye(45.5, 53, m, { r: 7.2, rim: 1.3, ring: o.ring })}${eye(74.5, 53, m, { r: 7.2, rim: 1.3, ring: o.ring })}${nose(60, 64, "#f090a0", 4)}${mouth(60, 66.4, m)}${whisk(60, 67, 12, 22, o.plain ? "#a89cbc" : "#5a5662")}${blush(36, 84, 65)}`;
};
const fingers = (x, y, dx, dy) => ln(`M${x} ${y}l${dx} ${dy}M${x} ${y}l${f(dx * 1.1 - dy * 0.5)} ${f(dy * 1.1 + dx * 0.5)}M${x} ${y}l${f(dx * 1.1 + dy * 0.5)} ${f(dy * 1.1 - dx * 0.5)}`, "#f0a8a8", 2.6) + dot(x, y, 4, PINK, OL);

function glider(k, m, sig) {
  if (!sig) {
    const tailD = "M74 94C100 90 116 102 110 113C104 123 90 118 94 110";
    const tail = ln(tailD, "#6a6e7a", 11) + ln(tailD, k.c, 9) + ln("M109 114C103 123 89 119 94 110", k.a, 10);
    const branch = ln("M5 110Q60 100 115 108", "#5a3818", 9.4) + ln("M5 110Q60 100 115 108", "#9a6a3a", 7) + tel(14, 100, 8, 4.4, -35, "#6aa84a", OL) + tel(9, 118, 7, 3.6, 20, "#8ac45a", OL);
    const flap = p("M45 73C28 78 20 92 28 105C35 100 42 100 48 94Z", k.c, OL) + ln("M44 74C28 80 22 93 29 103", k.a, 3.2) + ln("M42 77C31 82 27 92 31 99", k.b, 1.5);
    return {
      behind: tail + branch,
      actor: `${both(flap)}${el(60, 87, 20.5, 20, k.c, OL)}${el(60, 90, 12, 16, k.b)}${both(fingers(44, 103, -3, 5))}${gliderHead(k, m)}${both(fingers(52.5, 90, 2, 5.4))}`,
      neck: [60, 76, 18], cap: [60, 31, 0.74],
    };
  }
  const star = spark(10, 12, 4) + spark(108, 108, 5) + spark(11, 112, 3) + spark(111, 10, 3.4) + dot(8, 62, 1.6, "#fff6a8") + dot(113, 66, 1.6, "#fff6a8");
  const tailD = "M60 86C57 98 72 104 64 121";
  const sheet = "M17 36Q38 52 47 46H73Q82 52 103 36Q91 64 100 96Q82 86 71 92H49Q38 86 20 96Q29 64 17 36Z";
  return {
    behind: grp("bd-s-burrow-pop", star),
    actor: `${ln(tailD, "#6a6e7a", 12)}${ln(tailD, k.c, 10)}${ln("M69 110C69 114 67 117 64 121", k.a, 11)}${p(sheet, k.c, `stroke="${k.a}" stroke-width="3" stroke-linejoin="round"`)}${p("M23 45Q40 58 48 56L46 80Q34 80 27 86Q34 64 23 45ZM97 45Q80 58 72 56L74 80Q86 80 93 86Q86 64 97 45Z", k.b, `opacity=".55"`)}${el(60, 69, 16, 27, k.c, OL)}${el(60, 71, 11, 22, k.b)}${fingers(17, 35, -4, -5)}${fingers(103, 35, 4, -5)}${fingers(20, 96, -4, 5)}${fingers(100, 96, 4, 5)}${g("translate(60 31) scale(.74) translate(-60 -52)", gliderHead(k, m))}`,
    front: pop(arcs("M3 78q10 -2 14 -10M117 78q-10 -2 -14 -10M30 108q8 -2 12 -8M90 108q-8 -2 -12 -8M5 90q8 0 14 -5M115 90q-8 0 -14 -5", "#ffffff", 2)),
    anim: "bd-s-burrow-glide",
    tf: "translate(60 62) scale(.93) translate(-60 -62)",
    neck: [60, 49, 13], cap: [60, 14, 0.54],
    css: POP + move("glide", "0%,100%{transform:translate(0,0) rotate(0)}25%{transform:translate(-5px,2px) rotate(-8deg)}75%{transform:translate(5px,-2px) rotate(8deg)}", "2.4s ease-in-out", "60px 62px"),
  };
}

// =====================================================================================
// Moonlit Nook
// =====================================================================================
/** Jagged spiny outline between two angles (degrees; 270 is straight up). */
function spikeShape(cx, cy, rx, ry, a0, a1, n, out = 1.15) {
  const at = (t, m) => `${f(cx + Math.cos((t * Math.PI) / 180) * rx * m)} ${f(cy + Math.sin((t * Math.PI) / 180) * ry * m)}`;
  const step = (a1 - a0) / n;
  let d = `M${at(a0, 1)}`;
  for (let i = 0; i < n; i++) d += `L${at(a0 + step * (i + 0.62), out)}L${at(a0 + step * (i + 1), 0.97)}`;
  return `${d}Z`;
}
/** Rows of quills with pale tips. */
function quills(cx, cy, rx, ry, a0, a1, rows, mid, tip) {
  let base = "", ends = "";
  rows.forEach(([r, n], j) => {
    for (let i = 0; i < n; i++) {
      const t = ((a0 + ((a1 - a0) * (i + (j % 2 ? 0.75 : 0.3))) / n) * Math.PI) / 180;
      const at = (m) => `${f(cx + Math.cos(t) * rx * m)} ${f(cy + Math.sin(t) * ry * m)}`;
      base += `M${at(r - 0.17)}L${at(r)}`;
      ends += `M${at(r)}L${at(r + 0.085)}`;
    }
  });
  return ln(base, mid, 2.5) + ln(ends, tip, 2);
}

function hedgehog(k, m, sig) {
  if (!sig) {
    const dome = p(spikeShape(60, 82, 47, 40, 148, 392, 26), k.a, `stroke="#1e120c88" stroke-width="1" stroke-linejoin="round"`) + quills(60, 82, 47, 40, 154, 386, [[0.98, 24], [0.8, 19], [0.62, 14]], k.c, "#fff4e4");
    const ears = both(dot(35, 68, 8, "#c8988a", OL) + dot(36, 69, 4.6, "#8a5a52"));
    return {
      actor: `${dome}${both(paw(42, 115, 8, 4))}${ears}${p("M60 61C80 61 95 79 92 94C89 110 76 114 60 114C44 114 31 110 28 94C25 79 40 61 60 61Z", k.b, OL)}${quills(60, 82, 30, 27, 232, 308, [[0.84, 9]], k.c, "#fff4e4")}${both(tel(46, 82, 11, 8, -26, "#8a6a58", `opacity=".8"`))}${eye(46.5, 82, m, { r: 5, rim: 1.2 })}${eye(73.5, 82, m, { r: 5, rim: 1.2 })}${p("M51 91Q60 84 69 91Q67 101 60 104Q53 101 51 91Z", "#f6dccc", OL)}${el(60, 97, 5.4, 4.2, "#231a1c")}${dot(58.4, 95.6, 1.4, "#fff", `opacity=".8"`)}${mouth(60, 103, m)}${whisk(60, 100, 11, 19, "#8a6a58")}${blush(37, 83, 94)}${both(paw(46, 111, 4.6, 4))}`,
      neck: [60, 106, 18], cap: [60, 56, 0.8],
    };
  }
  const ball = p(spikeShape(60, 83, 36, 33, 0, 360, 30, 1.18), k.a, `stroke="#1e120c88" stroke-width="1" stroke-linejoin="round"`) + quills(60, 83, 36, 33, 0, 360, [[1, 26], [0.76, 19], [0.52, 12]], k.c, "#fff4e4");
  const peek = `${el(63, 91, 17, 11.5, "#2a1a14")}${el(63, 93, 14, 9, k.b)}${eye(55, 89, m, { r: 3.2, rim: 0.9 })}${eye(71, 89, m, { r: 3.2, rim: 0.9 })}${el(63, 96.5, 4.6, 3.6, "#231a1c")}${dot(61.8, 95.4, 1.1, "#fff", `opacity=".8"`)}${ln("M47 88l5 -6M54 83l3 -4M72 83l-2 -4M79 88l-4 -6", k.c, 2.2)}`;
  return {
    actor: `${ball}${peek}`,
    front: pop(arcs("M13 66q-9 15 -2 30M107 66q9 15 2 30M20 108l-9 5M100 108l9 5", "#fff3a0", 2.4)),
    anim: "bd-s-burrow-curl",
    neck: [63, 101, 15], cap: [60, 53, 0.8],
    css: POP + move("curl", "0%,100%{transform:rotate(0)}20%{transform:rotate(-17deg) translateX(-4px)}55%{transform:rotate(15deg) translateX(4px)}75%{transform:rotate(-5deg)}", "1.9s ease-in-out", "60px 100px"),
  };
}

function dormouse(k, m, sig) {
  const ears = (x1, x2, y) => roundEar(x1, y, 10, k.c, "#f2b0a0") + roundEar(x2, y, 10, k.c, "#f2b0a0");
  const nut = (x, y) => dot(x, y, 8.4, "#b8743a", OL) + p(`M${x - 8} ${y - 2}Q${x - 6} ${y - 11} ${x} ${y - 9}Q${x + 6} ${y - 11} ${x + 8} ${y - 2}Q${x + 4} ${y - 4} ${x} ${y - 2}Q${x - 4} ${y - 4} ${x - 8} ${y - 2}Z`, "#8ab04a", OL) + shine(x - 3, y + 2, 2.6, 3.4, 20, 0.5);
  if (!sig) {
    const tail = p("M76 112C103 119 119 97 113 74C108 56 90 55 90 66C101 72 103 94 80 97Z", k.c, OL) + ln("M96 113l7 6M108 103l9 3M112 90l8 -1M111 77l8 -5M102 62l4 -8M92 59l-3 -6", k.c, 3.2) + ln("M86 106Q106 98 104 76Q101 66 94 63", "#ffc272", 3.4);
    return {
      behind: tail,
      actor: `${p("M31 112C23 92 35 68 56 68C77 68 89 92 81 112C71 118 41 118 31 112Z", k.c, OL)}${el(56, 95, 16, 20, k.b)}${ears(33, 79, 40)}${el(56, 57, 28, 24.5, k.c, OL)}${el(56, 39, 13, 6, k.a, `opacity=".3"`)}${shine(40, 43, 7, 3.6)}${eye(43.5, 56, m, { r: 7, rim: 1 })}${eye(68.5, 56, m, { r: 7, rim: 1 })}${el(50.5, 69, 8.4, 6.4, k.b)}${el(61.5, 69, 8.4, 6.4, k.b)}${nose(56, 65.5, "#e87c86", 3.6)}${mouth(56, 68, m)}${whisk(56, 69, 13, 24, "#8a4a1a")}${blush(34, 78, 68)}${nut(56, 99)}${paw(46, 100, 5, 4.2)}${paw(66, 100, 5, 4.2)}${paw(40, 115, 9, 3.8)}${paw(72, 115, 9, 3.8)}`,
      neck: [56, 79, 20], cap: [56, 36, 0.78],
    };
  }
  const em = m === "happy" || m === "love" ? "sleepy" : m;
  const leaf = (x, y, rot, col) => g(`rotate(${rot} ${x} ${y})`, p(`M${x - 13} ${y}Q${x} ${y - 10} ${x + 13} ${y}Q${x} ${y + 10} ${x - 13} ${y}Z`, col, OL) + ln(`M${x - 11} ${y}h22`, "#0003", 1));
  const wrapTail = "M91 66C112 82 108 113 80 115C56 119 31 114 22 101C38 106 56 105 68 99C80 93 91 82 91 66Z";
  return {
    behind: leaf(20, 100, -50, "#a8742e") + leaf(103, 98, 48, "#8a9a3a") + leaf(33, 72, -28, "#c89040") + leaf(92, 66, 30, "#b8682a") + el(60, 112, 50, 9, "#8a5c2a"),
    actor: `${el(62, 86, 35, 29, k.c, OL)}${shine(70, 68, 15, 6, 18, 0.28)}${ears(30, 70, 70)}${el(49, 89, 23, 20, k.c, OL)}${el(46, 98, 13, 9, k.b)}${eye(39, 87, em, { r: 5 })}${eye(60, 87, em, { r: 5 })}${nose(48, 95, "#e87c86", 3.4)}${mouth(48, 97, m)}${whisk(48, 98, 10, 19, "#8a4a1a")}${blush(33, 65, 95)}${p(wrapTail, "#f4a850", `stroke="#8a4a1466" stroke-width="1.4"`)}${ln("M91 76Q99 100 76 108Q56 112 36 106", "#ffcc80", 3)}${ln("M104 94l7 0M98 106l7 5M84 115l2 6M64 116l0 5M44 113l-4 5M27 105l-8 3", k.c, 2.6)}${paw(66, 101, 5, 3.6)}`,
    front: leaf(15, 114, 12, "#c87c2e") + leaf(104, 116, -14, "#a8a23e") + grp("bd-s-burrow-zz", word(92, 44, "Z", 17, "#e8e4ff") + word(105, 28, "z", 13, "#e8e4ff") + word(113, 16, "z", 9, "#e8e4ff")),
    anim: "bd-s-burrow-doze",
    neck: [46, 104, 13], cap: [46, 71, 0.68],
    css: move("doze", "0%,100%{transform:scale(1,1)}50%{transform:scale(1.03,1.05)}", "3.6s ease-in-out", "60px 114px") + move("zz", "0%{transform:translate(0,0);opacity:1}70%{transform:translate(2px,-8px);opacity:.5}100%{transform:translate(3px,-11px);opacity:0}", "3.6s ease-out"),
  };
}

function sengi(k, m, sig) {
  const leg = (d) => ln(d, "#7a463c", 5) + ln(d, "#bc8472", 3.4);
  const feet = (list) => list.map(([x, y]) => el(x, y, 6.4, 2.8, "#bc8472", `stroke="#7a463c" stroke-width="1"`)).join("");
  const body = `${p("M18 82C18 60 39 50 59 52C77 54 88 66 87 80C85 94 69 98 52 98C33 100 20 95 18 82Z", k.c, OL)}${p("M18 82C18 61 36 50 53 52C49 64 60 74 50 86C44 96 22 96 18 82Z", k.a)}${ln("M50 54Q56 62 52 72Q60 76 56 86", k.a, 3.4)}${p("M46 94Q62 84 82 86Q74 97 56 97Z", k.b)}${shine(34, 62, 10, 4, -30, 0.18)}`;
  const head = (em) => `${tel(59, 34, 8, 12, -26, "#a84a1c", OL)}${tel(59.4, 35, 4.6, 8, -26, "#5a2a22")}${tel(88, 33, 7.4, 11, 22, "#a84a1c", OL)}${tel(87.6, 34, 4, 7.4, 22, "#5a2a22")}${el(73, 55, 22, 20, k.c, OL)}${p("M80 51C96 52 109 60 118 74C115 80 108 77 103 73C95 76 83 75 76 69Z", k.c, OL)}${p("M80 66C90 72 100 70 105 72C96 78 82 78 74 70Z", k.b)}${ln("M86 55Q104 60 114 73", "#8a3410", 2, `opacity=".7"`)}${el(116, 75.4, 3.8, 3.4, "#241a1e")}${dot(115, 74.2, 1, "#fff", `opacity=".8"`)}${dot(66.5, 50.5, 7.6, k.b, `opacity=".85"`)}${dot(85, 49.5, 7, k.b, `opacity=".85"`)}${eye(67, 50.5, em, { r: 5.4 })}${eye(85, 49.5, em, { r: 4.8 })}${mouth(93, 70.5, m)}${ln("M102 68l9 -12M104 72l13 -5M98 74l6 12", "#4a2a20", 0.8)}${blush(62, 84, 64)}`;
  if (!sig) {
    return {
      behind: ln("M22 84C5 90 3 104 11 115", "#2a1a1e", 3.8) + ln("M22 84C7 90 5 103 12 114", "#6a4448", 1.6),
      actor: `${leg("M52 92L59 104L51 115")}${leg("M80 88L90 114")}${feet([[55, 116], [93, 116]])}${body}${leg("M36 90L28 103L38 115")}${leg("M68 94L69 114")}${feet([[42, 116], [73, 116]])}${head(m)}`,
      neck: [69, 71, 13], cap: [73, 38, 0.66],
    };
  }
  const leaf = (x, y, rot, col, s = 1) => g(`rotate(${rot} ${x} ${y})`, p(`M${x - 9 * s} ${y}Q${x} ${y - 7 * s} ${x + 9 * s} ${y}Q${x} ${y + 7 * s} ${x - 9 * s} ${y}Z`, col, OL) + ln(`M${x - 8 * s} ${y}h${16 * s}`, "#0003", 0.9));
  const beetle = (x, y) => ln(`M${x - 5} ${y - 2}l-3 -2M${x - 4} ${y + 2}l-3 3M${x + 5} ${y - 2}l3 -2M${x + 4} ${y + 2}l3 3`, "#101820", 1) + el(x, y, 5, 3.8, "#2a7a68", `stroke="#101820" stroke-width="1"`) + dot(x + 4.6, y, 2, "#101820");
  return {
    behind: ln("M22 72C6 66 4 46 12 34", "#2a1a1e", 3.8) + leaf(48, 112, -18, "#8a5a24") + leaf(80, 110, 30, "#b87a2a"),
    actor: `${leg("M50 88L60 103L50 115")}${leg("M76 92L80 115")}${feet([[54, 116], [84, 116]])}${g("rotate(17 52 82)", body)}${leg("M36 80L24 100L36 115")}${leg("M66 98L62 115")}${feet([[40, 116], [66, 116]])}${g("translate(-3 24) rotate(17 78 58)", head(m))}${ln("M103 111q3 6 10 4q3 -1 2 -4", "#f26a8a", 2.4)}`,
    front: leaf(62, 119, 8, "#c8862e") + leaf(80, 120, -14, "#7a8a34") + leaf(98, 121, 8, "#a8561e", 1.1) + leaf(113, 119, -22, "#d8a240") + grp("bd-s-burrow-flick", leaf(104, 62, -34, "#c8702a", 0.8) + leaf(99, 40, 28, "#8a9a3a", 0.65) + beetle(106, 90)) + pop(arcs("M112 104l6 -4M114 110l5 0M92 108l-5 -4", "#fff3a0", 2)),
    anim: "bd-s-burrow-probe",
    neck: [67, 85, 12], cap: [76, 62, 0.6],
    css: POP + move("probe", "0%,100%{transform:rotate(0)}15%{transform:rotate(3.5deg)}30%{transform:rotate(-3deg)}45%{transform:rotate(4deg)}60%{transform:rotate(-6deg)}", "1.4s ease-in-out", "40px 114px") + move("flick", "0%{transform:translate(0,0);opacity:1}60%{transform:translate(5px,-13px) rotate(11deg);opacity:1}100%{transform:translate(7px,-4px) rotate(18deg);opacity:0}", "1.4s ease-out", "104px 100px"),
  };
}

function longjerboa(k, m) {
  const ear = p("M52 51C31 44 17 17 26 3C44 0 60 23 61 44Z", k.c, OL) + p("M50 43C37 34 27 17 30.5 9C42 9 53 27 56 40Z", "#f0b6ae") + ln("M49 40Q40 28 34 15", "#d8807c", 1);
  const leg = (d) => ln(d, "#8a745a", 5) + ln(d, k.c, 3.2);
  const toes = (d) => ln(d, "#b08068", 5.8) + ln(d, "#f6dcc4", 4);
  const tail = "M70 88C98 80 114 90 108 102";
  return {
    behind: ln(tail, "#8a745a", 4.4) + ln(tail, k.c, 2.6) + flag(106.6, 104, 6),
    actor: `${leg("M50 91L31 101L42 114")}${leg("M70 91L89 101L78 114")}${toes("M42 115H56")}${toes("M78 115H64")}${fluff(42, 115, 3.6, 2.4, "#fff", 8, 1.4, "")}${fluff(78, 115, 3.6, 2.4, "#fff", 8, 1.4, "")}${tel(47, 87, 8.4, 11.5, 32, k.c, OL)}${tel(73, 87, 8.4, 11.5, -32, k.c, OL)}${el(60, 83, 16.5, 16, k.c, OL)}${el(60, 87, 10.5, 11.5, k.b)}${both(tel(54.5, 83, 3, 5.6, -18, "#f6dcc4", OL))}${both(ear)}${el(60, 56, 21, 18.5, k.c, OL)}${shine(50, 45, 7, 3)}${both(el(50.5, 55, 6.6, 6.6, k.b, `opacity=".8"`))}${eye(50.5, 54.5, m, { r: 4.3 })}${eye(69.5, 54.5, m, { r: 4.3 })}${p("M52.5 62Q60 58 67.5 62Q66 72 60 73Q54 72 52.5 62Z", k.b)}${el(60, 66.4, 4.8, 3.6, "#e89890", OL)}${dot(58.4, 66.4, 0.9, "#7a3a34")}${dot(61.6, 66.4, 0.9, "#7a3a34")}${mouth(60, 69.6, m)}${whisk(60, 68, 8, 29, "#5a463a")}${blush(44, 76, 63)}`,
    neck: [60, 72, 13], cap: [60, 41, 0.6],
  };
}

function bfferret(k, m, sig) {
  const mound = (front) => (front
    ? p("M8 121C16 106 31 101 43 107Q60 115 77 107C90 101 104 106 112 121Z", "#a8744a", OL) + ln("M43 107Q60 115 77 107", "#5a3418", 2.4) + dot(22, 115, 2.6, "#7a4c2c") + dot(35, 117, 1.6, "#d8a878") + dot(94, 114, 2, "#7a4c2c") + dot(82, 118, 1.6, "#d8a878")
    : el(60, 108, 27, 8, "#3a2010"));
  const head = `${both(tel(36, 30, 10, 12, -32, k.c, OL) + tel(36.6, 31, 5.8, 8, -32, "#fbeede"))}${p("M60 22C79 22 91 34 89 47C87 61 72 69 60 71C48 69 33 61 31 47C29 34 41 22 60 22Z", k.b, OL)}${p("M40 28Q60 16 80 28Q69 30 60 36Q51 30 40 28Z", k.c)}${p("M31.6 41C39 34 50 36 55 42Q60 39 65 42C70 36 81 34 88.4 41C89.4 51 80 56 71 53.5Q64 51 60 46.5Q56 51 49 53.5C40 56 30.6 51 31.6 41Z", k.a)}${el(60, 59, 13.5, 10, "#fffaf2")}${eye(47, 45, m, { r: 4.8, rim: 1.6, lid: "#fff3e4" })}${eye(73, 45, m, { r: 4.8, rim: 1.6, lid: "#fff3e4" })}${nose(60, 55.5, "#2a1c1e", 4.6)}${mouth(60, 58, m)}${whisk(60, 60, 12, 21, "#a88a6a")}${blush(40, 80, 59)}`;
  const body = sig
    ? p("M43 97C43 84 45 70 47 62H73C75 70 77 84 77 97Z", k.c, OL) + el(60, 79, 10, 16, k.b)
    : p("M42 116C42 94 44 74 47 62H73C76 74 78 94 78 116Z", k.c, OL) + el(60, 90, 10.5, 24, k.b);
  const stars = spark(12, 22, 5) + spark(104, 40, 4) + spark(18, 66, 3) + dot(32, 8, 1.6, "#fff6a8") + dot(110, 70, 1.6, "#fff6a8") + dot(8, 44, 1.2, "#fff6a8");
  const moon = p("M101 5C112 8 116 20 108 27C101 33 91 29 90 24C99 27 108 17 101 5Z", "#fff2b4");
  if (!sig) {
    const tailD = "M74 106C98 108 110 96 108 74";
    return {
      behind: ln(tailD, "#8a6038", 11) + ln(tailD, k.c, 9.2) + ln("M108.6 88C109.4 83 108.8 78 108 73", k.a, 10.2) + mound(false),
      actor: `${body}${both(tel(46, 91, 5.6, 14, 12, k.a, OL))}${head}`,
      front: mound(true) + both(paw(46, 106.5, 7, 5, k.a) + ln("M42.5 109l-1 3.4M46 110v3.4M49.5 109l1 3.4", "#d8c8b8", 1)),
      neck: [60, 71, 15], cap: [60, 27, 0.7],
    };
  }
  return {
    behind: moon + grp("bd-s-burrow-pop", stars) + mound(false),
    actor: `${body}${head}`,
    tf: "translate(0 22)",
    front: mound(true) + el(60, 125, 44, 7, "#a8744a") + both(paw(40, 107, 8, 5.4, k.a) + ln("M36 109.6l-1 3.6M40 110.6v3.6M44 109.6l1 3.6", "#d8c8b8", 1)) + pop(arcs("M22 76q-6 6 -6 14M98 76q6 6 6 14", "#fff3a0", 2)),
    anim: "bd-s-burrow-peek",
    neck: [60, 71, 15], cap: [60, 27, 0.7],
    css: POP + move("peek", "0%,100%{transform:translateY(0) rotate(0)}22%,34%{transform:translateY(-11px) rotate(-8deg)}50%,62%{transform:translateY(-11px) rotate(8deg)}80%,88%{transform:translateY(16px) rotate(0)}", "3.2s ease-in-out", "60px 108px"),
  };
}

function leucistic(k, m) {
  const moon = p("M7 72C8 105 33 121 61 120C91 120 114 101 113 70C101 92 83 99 61 99C37 99 18 91 7 72Z", k.a, `stroke="#c89a30" stroke-width="1.8"`) + dot(27, 101, 3.6, "#f4c44a") + dot(94, 104, 5, "#f4c44a") + dot(46, 112, 2.4, "#f4c44a") + ln("M14 84Q22 100 38 108", "#fff4c0", 2.4);
  const soft = `stroke="#a89cbc" stroke-width="1.3"`;
  const tailD = "M74 94C92 100 90 116 76 117C66 117 66 107 75 108";
  const flap = p("M45 70C27 76 21 90 30 101C36 96 43 96 49 90Z", k.c, soft) + ln("M42 75C31 80 27 89 31 95", "#d8d0e4", 1.6);
  return {
    behind: dot(60, 62, 53, "#d8ccff", `class="bd-glow"`) + moon,
    actor: `${both(flap)}${el(60, 84, 20.5, 19.5, k.c, soft)}${el(60, 88, 11.5, 14, k.b)}${g("translate(0 -3)", gliderHead(k, m, { plain: true, inner: "#ffbcc8", ring: "#f8d8e4" }))}${ln(tailD, "#a89cbc", 11.4)}${ln(tailD, k.c, 9)}${both(fingers(44, 99, -2, 5.4))}${both(fingers(52.5, 84, 2, 5.4))}`,
    front: grp("bd-glow", spark(12, 24, 5.4) + spark(108, 30, 4.4) + spark(103, 56, 3) + spark(15, 54, 3.2) + spark(60, 7, 3.6)),
    neck: [60, 72, 18], cap: [60, 28, 0.72],
  };
}

const ART = {
  syrian, winterwhite, robo, chinese, gerbil, duprasi, jerboa,
  american, abyssinian, peruvian, skinny, dutch, hollandlop, netherland, lionhead, prairiedog, jackalope,
  degu, hooded, dumbo, ferret, chinchilla, glider, violet,
  hedgehog, dormouse, sengi, longjerboa, bfferret, leucistic,
};

export default function art({ id, name, tier, c, b, a, stage = 1, mood = "happy", size = 0, act = "" }) {
  const draw = ART[String(id).replace(/^burrow_/, "")] || syrian;
  const r = draw({ c, b, a }, mood, act === "signature");
  // Moving and re-posed bodies carry their own scarf and hat so the clothes travel with them.
  const own = !!(r.anim || r.tf);
  const wear = own ? `${stage >= 2 && r.neck ? scarf(...r.neck) : ""}${stage >= 3 && r.cap ? hat(...r.cap) : ""}` : "";
  const posed = r.tf ? g(r.tf, r.actor + wear) : r.actor + wear;
  const body = `${r.behind || ""}${grp(r.anim || "bd-breathe", posed)}${r.front || ""}`;
  return frame({ name, size, tier, accent: a, stage, body, neck: own ? null : r.neck, cap: own ? null : r.cap, css: r.css || "" });
}
