// Moonpool Reef art: 30 sea friends, each with its own body outline and field marks, plus
// behaviour animations (act = "signature"). Side-profile swimmers face right.
import { INK, el, dot, p, ln, dots, wrap, eye, scarf, hat, frame } from "./artkit.js";

// ---------- helpers ----------
let uid = 0;
const long = (h) => (h.length === 4 ? `#${h[1]}${h[1]}${h[2]}${h[2]}${h[3]}${h[3]}` : h);
const mix = (c, d, t) => `#${[1, 3, 5].map((i) => Math.round(parseInt(long(c).slice(i, i + 2), 16) * (1 - t) + parseInt(long(d).slice(i, i + 2), 16) * t).toString(16).padStart(2, "0")).join("")}`;
const dk = (c, t = 0.3) => mix(c, "#0b0b1c", t);
const lt = (c, t = 0.35) => mix(c, "#ffffff", t);
const stroke = (col, w = 1.4) => `stroke="${col}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const out = (d, fill, col, w = 1.4, x = "") => p(d, fill, `${stroke(col, w)} ${x}`);
const g = (transform, svg) => `<g transform="${transform}">${svg}</g>`;
const mirror = (svg) => g("matrix(-1 0 0 1 120 0)", svg);
const two = (svg) => svg + mirror(svg);
/** Paint `inner` only inside the outline `d`. */
function clip(d, inner) {
  const id = `reefc${(uid = (uid + 1) % 1e7)}`;
  return `<clipPath id="${id}"><path d="${d}"/></clipPath><g clip-path="url(#${id})">${inner}</g>`;
}
/** A shaded body: fill, markings clipped inside, soft underside shadow and gloss, then the outline. */
function skin(d, fill, marks = "", o = {}) {
  const [gx, gy, gr] = o.gloss || [70, 54, 18];
  return p(d, fill) + clip(d, marks + (o.noShade ? "" : p("M0 86Q60 100 120 82V124H0Z", "#10123a", `opacity=".12"`)) + el(gx, gy, gr, gr * 0.32, "#fff", `opacity="${o.shine ?? 0.28}" transform="rotate(-8 ${gx} ${gy})"`)) + out(d, "none", o.edge || dk(fill), o.w || 1.5);
}
/** A fin: translucent membrane with rays. */
const fin = (d, fill, rays = "", o = {}) => p(d, fill, `${stroke(o.edge || dk(fill, 0.22), o.w || 1.3)} opacity="${o.op ?? 0.95}"`) + (rays ? ln(rays, o.ray || lt(fill, 0.45), o.rw || 1.1, `opacity=".8"`) : "");
const flap = (svg) => wrap("bd-flap", svg);
const wag = (svg) => wrap("bd-wag", svg);
const smile = (x, y, mood, col = "#4a1c24", w = 4) => mood === "sad" ? ln(`M${x - w} ${y + 2}q${w} -4 ${w * 2} 0`, col, 1.9) : mood === "love" ? p(`M${x - w} ${y - 1}Q${x} ${y + 7} ${x + w} ${y - 1}Z`, "#7a1f34", stroke(col, 1.2)) : mood === "sleepy" ? el(x, y + 1, 2, 2.4, col) : ln(`M${x - w} ${y}q${w} ${w * 0.9} ${w * 2} 0`, col, 1.9);
/** Single side-profile eye: the sad brow lifts toward the snout. */
const peer = (x, y, mood, o) => (mood === "sad" ? g(`matrix(-1 0 0 1 ${2 * x} 0)`, eye(x, y, mood, o)) : eye(x, y, mood, o));
const rosy = (x, y, rx = 4.4) => el(x, y, rx, rx * 0.62, "#ff5f8a", `opacity=".42"`);
const bubble = (x, y, r) => dot(x, y, r, "#dff8ff", `opacity=".35" stroke="#fff" stroke-width="1"`) + dot(x - r * 0.35, y - r * 0.35, r * 0.24, "#fff");
const bubbles = (list) => list.map(([x, y, r]) => bubble(x, y, r)).join("");
const spark = (x, y, r, col = "#fff4a8") => p(`M${x} ${y - r}Q${x + r * 0.18} ${y - r * 0.18} ${x + r} ${y}Q${x + r * 0.18} ${y + r * 0.18} ${x} ${y + r}Q${x - r * 0.18} ${y + r * 0.18} ${x - r} ${y}Q${x - r * 0.18} ${y - r * 0.18} ${x} ${y - r}Z`, col);
const wear = (stage, neck, cap) => (stage >= 2 && neck ? scarf(...neck) : "") + (stage >= 3 && cap ? hat(...cap) : "");
/** Signature poses move the pet, so the scarf and hat travel inside the posed group. */
const posed = (k, svg, neck, cap, transform = "", cls = "") => {
  const inner = g(transform || "translate(0 0)", svg + wear(k.stage, neck, cap));
  return cls ? wrap(cls, inner) : inner;
};
const kf = (name, frames) => `@keyframes reef${name}{${frames}}`;
const anim = (cls, rule, extra = "") => `.bd-s-reef-${cls}{${rule}}${extra}`;
// Shared signature motions.
const CSS_RISE = anim("rise", "animation:reefRise 1.8s ease-in infinite", kf("Rise", "0%{opacity:0;transform:translateY(6px)}20%{opacity:1}100%{opacity:0;transform:translateY(-16px)}"));
const CSS_TWINKLE = anim("twinkle", "animation:reefTwinkle 1.3s ease-in-out infinite", kf("Twinkle", "0%,100%{opacity:.25}50%{opacity:1}"));

// =====================================================================
// Lily Pond Gardens
// =====================================================================
function comet(k) {
  const { c, b, a, mood, sig } = k;
  const edge = dk(a, 0.28);
  const fish =
    flap(fin("M50 63C38 56 24 34 4 28C10 44 16 58 32 70C20 80 10 96 6 114C26 108 38 86 50 77Z", a, "M48 66C34 58 22 44 10 34M46 69C34 64 26 58 18 50M46 72C34 80 22 94 12 107M48 74C38 82 30 90 22 94", { op: 0.92 }) + p("M4 28C8 38 11 44 15 50C14 40 18 36 22 38C16 32 10 30 4 28ZM6 114C10 104 12 98 17 92C16 102 20 104 25 101C19 108 12 112 6 114Z", "#ffe0a8", `opacity=".8"`)) +
    wag(fin("M54 52C56 32 72 22 86 28C76 34 78 42 82 49Z", a, "M60 50Q62 36 76 29M68 48Q69 38 80 31")) +
    fin("M60 90C56 104 46 112 36 112C44 104 46 96 50 85Z", a, "M54 92Q50 102 42 108") +
    skin("M44 70C46 52 62 45 80 46C100 48 113 61 113 72C113 85 98 96 78 95C60 94 46 84 44 70Z", c,
      el(78, 96, 36, 14, b) + ln("M54 62q5 4 0 9M62 56q6 5 0 11M62 72q5 4 0 9M54 76q4 3 0 7M71 54q5 4 0 9", lt(c, 0.45), 1.3) + ln("M82 55Q74 70 82 88", dk(c, 0.18), 1.6), { edge }) +
    flap(fin("M72 79C66 90 56 95 48 93C56 88 60 80 68 74Z", b, "M68 79L54 90M68 82L60 91", { edge })) +
    peer(96, 64, mood, { r: 6.4, ring: "#fff6e0" }) + smile(108, 78, mood, "#6a2008", 3.4) + rosy(93, 78);
  if (!sig) return { body: fish, neck: [84, 90, 12], cap: [84, 50, 0.76], wrap: "bd-bob" };
  const stones = [[10, 115, 7, "#8a8f9c"], [22, 117, 6, "#c8a878"], [34, 114, 7, "#6a7484"], [47, 117, 6, "#b8bcc8"], [58, 115, 5, "#a8845c"], [70, 118, 7, "#7a808c"], [82, 114, 5, "#d8c098"], [92, 117, 7, "#8a8f9c"], [105, 115, 7, "#b89870"], [115, 118, 5, "#6a7484"]].map(([x, y, r, col]) => out(`M${x - r} ${y}q0 -${r} ${r} -${r}q${r} 0 ${r} ${r}q-${r} ${r * 0.7} -${r * 2} 0Z`, col, dk(col, 0.3), 1)).join("");
  return {
    body: posed(k, fish, [84, 90, 12], [84, 50, 0.76], "translate(4 0) rotate(24 70 66) translate(70 66) scale(.9) translate(-70 -66)", "bd-s-reef-sift") + stones +
      wrap("bd-s-reef-spit", el(96, 98, 3.4, 2.8, "#8a8f9c", stroke("#4a4f5c", 0.8)) + el(104, 102, 2.6, 2.2, "#c8a878", stroke("#7a5a38", 0.8)) + el(91, 105, 2.4, 2, "#6a7484") + bubbles([[106, 90, 3], [112, 82, 2.2]])) +
      ln("M104 106l7 -2M86 108l-6 -3", "#fff", 1.6, `opacity=".7"`),
    css: anim("sift", "transform-origin:70px 70px;animation:reefSift 1.1s ease-in-out infinite", kf("Sift", "0%,100%{transform:rotate(0) translateY(0)}50%{transform:rotate(7deg) translateY(4px)}")) +
      anim("spit", "animation:reefSpit .8s ease-in infinite", kf("Spit", "0%{opacity:0;transform:translateY(-8px)}25%{opacity:1}100%{opacity:.2;transform:translateY(9px)}")),
  };
}

/** Egg-shaped fancy goldfish shared outline. */
const FANCY = "M40 70C42 49 58 41 76 43C96 45 108 58 108 73C108 90 92 100 73 99C54 98 40 88 40 70Z";
function blackmoor(k) {
  const { c, b, a, mood } = k;
  const edge = "#0a0810", sheen = "#7a6c98";
  return {
    body:
      flap(fin("M48 62C36 40 14 36 3 48C16 52 12 64 24 70C6 76 2 98 12 114C22 98 36 104 50 82Z", c, "M46 64C34 52 20 46 10 49M44 70C30 68 18 62 14 56M44 76C28 80 14 94 12 108M46 80C34 90 24 94 18 102", { edge, ray: sheen, op: 0.92 })) +
      fin("M50 84C36 96 32 110 22 116C40 118 52 104 62 92Z", a, "M52 88Q42 104 30 112", { edge, ray: sheen, op: 0.85 }) +
      wag(fin("M50 52C44 24 62 10 80 18C70 24 74 34 80 44Z", c, "M56 48Q52 28 70 17M65 45Q62 32 74 22", { edge, ray: sheen })) +
      fin("M68 96C62 110 52 118 42 116C52 108 52 100 56 90Z", c, "M62 98Q56 108 48 113", { edge, ray: sheen }) +
      out("M88 52C87 40 99 36 105 42C112 49 107 60 98 60Z", a, edge) + dot(102, 46, 3.8, "#050409", stroke("#c9a24a", 1.2)) + dot(103, 44.6, 1.2, "#fff") +
      skin(FANCY, c, el(74, 98, 30, 13, b, `opacity=".7"`) + ln("M52 60q6 5 0 11M62 54q6 5 0 11M62 72q6 5 0 11M52 76q5 4 0 8M72 76q5 4 0 8", sheen, 1.2, `opacity=".65"`), { edge, gloss: [66, 52, 17], shine: 0.2 }) +
      out("M80 60C80 45 106 44 108 61C109 76 82 77 80 60Z", c, edge, 1.5) + ln("M83 56Q87 48 96 47", sheen, 1.8) +
      peer(96, 61, mood, { r: 7.2, ring: "#c9a24a", lid: "#d8cce8" }) +
      flap(fin("M68 80C60 92 48 94 42 90C52 86 56 80 64 74Z", b, "M64 80L48 90", { edge, ray: sheen, op: 0.9 })) +
      smile(103, 83, mood, "#c8b4dc", 3.2) + rosy(86, 80),
    neck: [80, 92, 13], cap: [70, 45, 0.74], wrap: "bd-bob",
  };
}

function oranda(k) {
  const { c, a, mood } = k;
  const edge = "#b8a8a0", tint = "#ffe9e4";
  const lumps = [[72, 49, 7], [80, 42, 8.5], [91, 39, 8.5], [101, 46, 7.5], [86, 49, 8], [97, 53, 6.5], [76, 54, 5]];
  return {
    body:
      flap(fin("M48 62C34 44 16 34 4 40C14 50 10 62 24 70C8 78 4 94 8 110C22 100 36 102 50 82Z", tint, "M46 64C32 52 20 44 10 43M44 70C30 66 20 58 15 52M44 76C28 82 16 94 12 104M46 80C34 90 22 94 16 100", { edge, ray: "#f2a0a0" })) +
      fin("M52 86C42 100 32 108 22 108C34 118 52 106 62 92Z", "#fff", "M54 90Q42 104 30 108", { edge, ray: "#f2b8b0", op: 0.85 }) +
      wag(fin("M48 52C44 28 58 16 74 22C68 28 70 36 76 45Z", tint, "M54 49Q52 30 66 22M63 46Q61 34 70 28", { edge, ray: "#f2a0a0" })) +
      fin("M70 96C66 110 56 116 46 114C54 108 56 100 60 92Z", "#fff", "M65 98Q60 108 52 112", { edge, ray: "#f2b8b0" }) +
      skin(FANCY, c, el(74, 100, 30, 11, "#e8dcd8", `opacity=".7"`) + ln("M52 60q6 5 0 11M62 54q6 5 0 11M62 72q6 5 0 11M52 76q5 4 0 8M72 78q5 4 0 8", "#dccbc4", 1.2), { edge }) +
      lumps.map(([x, y, r]) => dot(x, y, r + 1.1, dk(a, 0.3))).join("") + lumps.map(([x, y, r]) => dot(x, y, r, a)).join("") +
      dots([[70, 46], [78, 38], [89, 35], [99, 43], [84, 45], [95, 51], [75, 52], [86, 38]], 1.7, lt(a, 0.5)) +
      peer(95, 66, mood, { r: 6.4, ring: "#ffe2b8" }) +
      flap(fin("M70 80C62 92 50 95 44 91C54 87 58 80 66 74Z", "#fff", "M66 80L50 91", { edge, ray: "#f2a0a0" })) +
      smile(104, 80, mood, "#8a2830", 3.4) + rosy(89, 81),
    neck: [81, 92, 13], cap: [86, 35, 0.72], wrap: "bd-bob",
  };
}

function ranchu(k) {
  const { c, b, a, mood } = k;
  const edge = dk(a, 0.3);
  const d = "M32 82C30 56 48 38 70 38C86 38 94 42 100 47C110 54 114 66 113 77C111 94 93 102 69 101C50 100 34 94 32 82Z";
  const wen = [[78, 49, 4.6], [85, 45, 5], [93, 45, 5.2], [100, 49, 5], [106, 55, 4.8], [109, 63, 4.6], [110, 72, 4.4], [107, 80, 4.8], [101, 86, 5], [93, 88, 4.8], [85, 86, 4.6], [79, 80, 4.4], [76, 72, 4.2], [76, 63, 4.2], [76, 55, 4.2], [87, 52, 4.6], [97, 53, 4.4]];
  return {
    body:
      flap(fin("M40 78C28 66 22 50 6 50C16 60 14 68 22 74C10 76 4 86 6 98C18 90 28 98 42 90Z", lt(c, 0.12), "M38 76C28 66 18 56 11 54M36 80C24 78 18 76 12 76M36 85C24 86 16 90 10 94", { edge, ray: b })) +
      flap(fin("M52 96C48 110 36 116 28 112C38 108 40 100 44 92Z", b, "M48 99L36 110", { edge, ray: c })) +
      wag(fin("M72 96C70 110 60 118 50 116C60 110 62 102 64 94Z", b, "M68 100L57 113", { edge, ray: c })) +
      skin(d, c, p("M24 84C44 76 66 96 88 92C104 90 112 80 118 74V120H24Z", b) + ln("M44 62q6 5 0 11M53 52q6 5 0 11M54 70q6 5 0 11M64 60q5 4 0 9M44 78q5 4 0 8M64 46q5 4 0 8", lt(c, 0.4), 1.4), { edge, gloss: [62, 48, 18] }) +
      ln("M38 62C46 45 58 39 70 38", lt(c, 0.5), 2.2) +
      out("M72 62C72 46 86 38 96 42C108 47 115 60 114 72C113 85 103 93 91 92C79 91 72 78 72 62Z", lt(c, 0.12), dk(c, 0.12), 1) + wen.map(([x, y, r]) => dot(x, y, r, lt(c, 0.18), stroke(dk(c, 0.06), 0.9))).join("") + dots(wen.map(([x, y]) => [x - 1.2, y - 1.6]), 1.2, lt(c, 0.55)) +
      el(93, 66, 12, 11, lt(c, 0.3)) +
      peer(93, 65, mood, { r: 5.6, ring: "#fff0d0" }) +
      flap(fin("M66 82C60 94 48 96 42 92C52 90 56 84 60 76Z", b, "M62 82L48 91", { edge, ray: c })) +
      smile(103, 77, mood, "#6a2008", 3.6) + rosy(90, 77),
    neck: [80, 94, 14], cap: [84, 43, 0.78], wrap: "bd-bob",
  };
}

function bubbleeye(k) {
  const { c, b, a, mood } = k;
  const edge = dk(c, 0.35);
  const sac = (x, y, rx, ry, op) => el(x, y, rx, ry, a, `opacity="${op}" ${stroke("#e89a50", 1.5)}`) + el(x, y + ry * 0.35, rx * 0.72, ry * 0.5, b, `opacity=".55"`) + el(x - rx * 0.38, y - ry * 0.4, rx * 0.25, ry * 0.17, "#fff", `opacity=".9" transform="rotate(-28 ${x - rx * 0.38} ${y - ry * 0.4})"`) + dot(x + rx * 0.45, y + ry * 0.35, 1.6, "#fff", `opacity=".8"`);
  const eyeSvg = mood === "happy" ? dot(91, 55, 8.6, "#fff6e0", stroke(edge, 1.2)) + dot(92, 52.6, 5.4, "#14131f") + dot(94, 50.6, 1.9, "#fff") + dot(90.4, 55, 0.9, "#fff") : dot(91, 55, 8.6, "#fff6e0", stroke(edge, 1.2)) + peer(91, 55, mood, { r: 5 });
  return {
    body:
      flap(fin("M42 62C30 42 14 36 4 42C14 50 10 60 22 66C8 72 4 88 10 102C20 90 34 90 44 76Z", lt(c, 0.15), "M40 62C28 50 18 44 10 45M38 67C26 66 18 60 14 55M38 72C24 76 14 88 12 96", { edge, ray: b })) +
      fin("M54 80C50 94 38 100 30 98C40 92 42 86 46 76Z", b, "M50 83L38 95", { edge, ray: c }) +
      el(108, 72, 10.5, 13, a, `opacity=".75" ${stroke("#e89a50", 1.3)}`) +
      skin("M38 68C40 52 56 46 74 46C92 42 108 48 111 58C112 70 98 82 78 85C58 88 40 82 38 68Z", c, el(74, 88, 34, 12, b) + ln("M52 60q5 4 0 9M61 54q5 4 0 9M62 70q5 4 0 8", lt(c, 0.45), 1.3), { edge, gloss: [64, 54, 15] }) +
      eyeSvg + smile(108, 62, mood, "#6a2008", 3) +
      wrap("bd-bob", sac(90, 83, 19, 18, 0.88) + rosy(86, 74, 4.8)) +
      flap(fin("M64 76C56 88 44 90 38 86C48 82 52 76 60 70Z", b, "M60 76L44 86", { edge, ray: c })),
    neck: [58, 80, 13], cap: [67, 45, 0.68], wrap: "bd-bob",
  };
}

const KOI_SIDE = "M26 72C34 58 56 49 78 51C99 53 114 63 114 73C113 84 98 93 76 94C54 95 36 86 26 77Z";
function kohaku(k) {
  const { c, a, mood, sig } = k;
  const edge = "#b0a098", hi = dk(a, 0.12);
  const fish =
    flap(fin("M31 71C22 66 14 52 3 50C8 62 10 70 16 75C10 82 8 92 3 102C16 98 22 84 31 79Z", "#fff4ee", "M28 72L8 55M28 74L14 74M28 77L8 97", { edge, ray: "#f09088" })) +
    wag(fin("M46 56C52 40 74 36 88 52Z", "#fff6f0", "M52 54L56 45M61 52L65 41M71 51L74 42M79 52L81 47", { edge, ray: "#d8c0b8" })) +
    fin("M52 90C48 102 40 106 32 104C40 100 42 92 44 86Z", "#fff6f0", "M48 92L38 101", { edge, ray: "#d8c0b8" }) +
    skin(KOI_SIDE, c,
      p("M114 60C104 50 88 46 84 54C80 62 90 68 94 62C100 58 106 68 118 66Z", a, stroke(hi, 0.8)) +
      p("M48 46C70 40 80 52 72 62C70 72 80 76 68 82C58 86 58 72 50 70C40 70 38 54 48 46Z", a, stroke(hi, 0.8)) +
      p("M24 62C34 56 40 66 36 74C34 82 28 84 24 80Z", a) +
      ln("M44 66q5 4 0 9M53 60q5 4 0 9M61 68q5 4 0 9M70 64q5 4 0 9M62 80q4 3 0 7M52 78q4 3 0 7", "#ffffff", 1.1, `opacity=".6"`) + ln("M84 57Q77 72 84 88", "#d8c4bc", 1.5), { edge }) +
    flap(fin("M76 84C70 99 56 105 47 101C57 97 62 88 70 79Z", "#fff6f0", "M72 85L56 99M72 88L63 99", { edge, ray: "#d8c0b8" })) +
    ln("M110 79q6 4 5 11M105 83q2 6 -2 10", "#d89878", 2) +
    peer(98, 66, mood, { r: 5.8, ring: "#fff0d8" }) + smile(110, 76, mood, "#8a3028", 3) + rosy(94, 79);
  if (!sig) return { body: fish, neck: [86, 89, 11], cap: [88, 55, 0.66], wrap: "bd-bob" };
  return {
    shadow: false,
    body: p("M2 102Q16 96 30 102T58 102T86 102T118 102V118Q60 124 2 118Z", "#57c0e8", `opacity=".75"`) +
      posed(k, fish, [86, 89, 11], [88, 55, 0.66], "translate(4 -16) rotate(-36 66 72) translate(66 72) scale(.9) translate(-66 -72)", "bd-s-reef-leap") +
      ln("M2 102Q16 96 30 102T58 102T86 102T118 102", "#e8fbff", 2.4) +
      wrap("bd-s-reef-splash", ln("M26 102Q16 82 8 88M36 100Q34 84 26 76M46 102Q56 88 52 80M18 108q-8 -2 -14 3M56 108q10 -3 16 3", "#dff8ff", 2.8) + dots([[14, 76], [34, 70], [58, 76], [66, 92], [6, 96], [46, 70]], 2.4, "#bfefff")),
    css: anim("leap", "transform-origin:50px 106px;animation:reefLeap 1.9s cubic-bezier(.4,0,.4,1) infinite", kf("Leap", "0%,100%{transform:translate(0,0) rotate(0)}12%{transform:translate(-8px,14px) rotate(-8deg)}50%{transform:translate(3px,-7px) rotate(10deg)}85%{transform:translate(10px,12px) rotate(30deg)}")) +
      anim("splash", "transform-origin:40px 102px;animation:reefSplash 1.9s ease-out infinite", kf("Splash", "0%{opacity:1;transform:scale(1)}30%{opacity:1;transform:scale(1.12)}60%{opacity:.25;transform:scale(.8)}85%{opacity:0;transform:scale(.5)}100%{opacity:1;transform:scale(1)}")),
  };
}

function tancho(k) {
  const { c, a, mood } = k;
  const edge = "#b4b0bc", ray = "#c8c4d4";
  const body = "M38 74C36 54 46 40 62 33C74 28 84 23 90 14L99 18C101 32 95 40 89 47C91 58 88 68 82 76Z";
  const head = "M29 82C29 62 42 52 60 52C78 52 91 62 91 82C91 98 78 108 60 108C42 108 29 98 29 82Z";
  const pec = flap(fin("M36 82C20 76 5 86 3 104C14 99 18 106 24 102C30 106 38 98 44 94Z", "#f8f8ff", "M36 85L10 99M37 88L22 100M39 90L33 99", { edge, ray }));
  return {
    body:
      wag(fin("M90 20C82 14 76 4 78 1C88 2 94 6 96 10C100 5 108 3 118 6C116 16 110 24 99 26Z", "#eceef8", "M94 18L81 5M95 18L90 6M96 19L108 8M97 21L114 9", { edge, ray: "#b8b4c8" })) +
      two(pec) +
      fin("M88 28C104 32 110 46 102 62C100 52 94 48 86 50Z", "#eceef8", "M90 34L102 42M90 40L103 52", { edge, ray: "#b8b4c8" }) +
      skin(body, c, ln("M56 44q5 5 10 0M68 37q5 5 10 0M80 29q4 4 8 0M72 48q5 5 10 0M60 54q5 4 10 0M84 39q4 4 8 0M76 59q5 4 9 0M44 56q5 4 9 0", "#c8c4d8", 1.3) + p("M82 76C88 66 91 58 89 47C95 40 101 32 99 18L110 20 104 80Z", "#d8d4e8", `opacity=".7"`), { edge, gloss: [56, 45, 11], noShade: true }) +
      ln("M94 22C84 32 70 40 62 52", "#b8b4c8", 2.4) +
      skin(head, c, el(60, 108, 28, 10, "#e8e4f0"), { edge, gloss: [44, 63, 10], noShade: true, shine: 0.8 }) +
      dot(60, 65, 10.5, a, stroke(dk(a, 0.25), 1)) + el(56.5, 61, 3.4, 2.2, lt(a, 0.4), `transform="rotate(-25 56.5 61)"`) +
      ln("M51 95q-7 3 -9 12M69 95q7 3 9 12M54 99q-3 4 -3 9M66 99q3 4 3 9", "#d8a898", 1.9) +
      eye(43, 79, mood, { r: 6, ring: "#e8e0d0" }) + eye(77, 79, mood, { r: 6, ring: "#e8e0d0" }) +
      el(60, 94, 8.5, 6, "#ffe8e4", stroke("#d8a898", 1)) + smile(60, 93, mood, "#8a3840", 3.6) + rosy(39, 91) + rosy(81, 91),
    neck: [60, 104, 19], cap: [60, 48, 0.68], wrap: "bd-bob",
  };
}

function moonkoi(k) {
  const { c, b, a, mood } = k;
  const edge = "#1c2268", ray = "#e8f0ff";
  const body = "M40 76C37 52 46 38 58 30C66 24 70 20 74 14C82 22 84 34 81 44C88 54 87 66 82 76Z";
  const head = "M29 82C29 62 42 52 60 52C78 52 91 62 91 82C91 98 78 108 60 108C42 108 29 98 29 82Z";
  const pec = flap(fin("M38 80C22 64 4 70 2 90C8 86 10 92 8 98C4 106 6 114 2 120C16 118 18 108 24 108C30 108 36 102 44 94Z", b, "M36 82C22 76 12 78 6 86M36 86C22 88 12 100 6 114M38 90C30 94 24 100 20 106", { edge: "#6a78d0", ray, op: 0.82 }));
  return {
    body:
      wag(fin("M72 20C62 4 40 0 28 12C40 10 44 16 38 24C52 16 62 22 70 28Z", b, "M70 23C58 10 46 8 34 11M68 25C58 18 48 18 42 21", { edge: "#6a78d0", ray, op: 0.85 }) + fin("M76 18C88 0 112 2 118 20C106 14 100 20 108 34C96 26 86 28 79 30Z", b, "M78 21C90 8 104 8 113 16M80 24C90 18 98 22 103 28", { edge: "#6a78d0", ray, op: 0.85 })) +
      two(pec) +
      skin(body, c, p("M36 76C50 66 50 50 62 46C74 42 70 28 80 22L90 60 86 78Z", b, `opacity=".55"`) + spark(56, 46, 4.5, a) + spark(70, 34, 3, a) + spark(76, 60, 3.5, a) + dots([[50, 58], [66, 42], [74, 50], [62, 34]], 1.1, "#fff"), { edge, gloss: [58, 40, 13], noShade: true }) +
      skin(head, c, el(60, 106, 30, 17, b, `opacity=".8"`) + dots([[36, 72], [84, 70], [40, 64], [80, 62]], 1.1, "#fff"), { edge, gloss: [44, 62, 10], noShade: true }) +
      p("M66 54C56 54 50 60 51 66C52 72 60 76 68 72C61 72 58 68 58 64C58 60 61 56 66 54Z", a, stroke("#d8a830", 1)) + spark(72, 60, 3.4, "#fff") +
      ln("M51 95C40 96 36 108 26 106C22 105 22 100 26 101M69 95C80 96 84 108 94 106C98 105 98 100 94 101M54 99C50 106 52 114 46 117M66 99C70 106 68 114 74 117", a, 1.8) +
      eye(43, 80, mood, { iris: a, r: 6.6 }) + eye(77, 80, mood, { iris: a, r: 6.6 }) +
      el(60, 94, 8, 5.6, lt(b, 0.35), stroke(edge, 1)) + smile(60, 93, mood, "#2a2870", 3.4) + rosy(39, 92) + rosy(81, 92) +
      wrap("bd-glow", spark(12, 46, 5) + spark(108, 56, 4) + spark(22, 28, 3) + spark(104, 92, 3.4)),
    neck: [60, 104, 19], cap: [60, 47, 0.66], wrap: "bd-bob",
  };
}

// =====================================================================
// Planted River Tanks
// =====================================================================
const BETTA = "M48 72C52 60 66 55 80 56C96 57 109 63 110 68C108 71 108 74 106 77C100 85 91 88 80 88C66 88 52 82 48 72Z";
const bettaFace = (k, ring, edge) => ln("M84 60Q76 72 84 85", edge, 1.5) + peer(95, 69, k.mood, { r: 6.2, ring }) + ln("M110 68q-4 2 -6 1", "#2a0c18", 1.8) + smile(103, 77, k.mood, "#2a0c18", 3) + rosy(90, 81, 3.8);
const feelers = (col, edge) => fin("M84 85C84 98 78 110 68 118C70 106 74 96 76 86Z", col, "M81 89Q78 104 70 115", { edge });

function halfmoon(k) {
  const { c, b, a, mood, sig } = k;
  const edge = "#17246a";
  const tail = fin("M56 66L50 24C24 27 5 47 5 71C5 96 24 116 50 119L56 78Z", c, "", { edge }) +
    p("M50 24C24 27 5 47 5 71C5 96 24 116 50 119L50 111C29 107 14 91 14 71C14 52 29 36 51 32Z", a) +
    ln("M53 66L46 30M52 68L32 36M51 70L20 49M51 72L15 71M51 74L20 93M52 76L32 107M53 78L46 112", b, 1.5) + out("M56 66L50 24C24 27 5 47 5 71C5 96 24 116 50 119L56 78Z", "none", edge, 1.4);
  const top = fin("M56 62C50 38 62 24 88 28C82 36 82 48 86 58Z", c, "M60 58Q58 40 72 29M68 57Q68 42 80 31M77 57Q78 46 83 37", { edge, ray: b }) + p("M56 32C62 26 74 25 88 28C86 30 85 32 84 34C74 31 64 31 56 32Z", a);
  const low = fin("M56 82C44 98 48 112 60 119C70 108 82 98 88 86Z", c, "M60 85Q52 100 58 114M68 87Q62 100 66 110M77 87Q73 96 75 102", { edge, ray: b }) + p("M48 105C50 111 54 115 60 119C64 114 69 110 73 106C66 109 56 109 48 105Z", a);
  const bodySvg = skin(BETTA, c, p("M96 40C82 56 92 76 120 90V40Z", dk(c, 0.35), `opacity=".7"`) + ln("M58 66q5 4 0 9M66 62q5 4 0 9M66 76q4 3 0 7M74 68q5 4 0 9", b, 1.4), { edge, gloss: [72, 62, 13] });
  const pec = flap(fin("M76 76C66 74 58 82 56 90C66 90 74 86 78 80Z", b, "M74 78L60 87", { edge, op: 0.75 }));
  if (!sig) {
    return { body: flap(tail) + wag(top) + low + feelers(a, edge) + bodySvg + pec + bettaFace(k, "#bfe0ff", edge), neck: [87, 85, 9], cap: [90, 58, 0.6], wrap: "bd-bob" };
  }
  const gills = out("M88 54C80 46 68 48 68 56C73 56 74 60 70 64C76 65 76 70 72 74C78 74 80 79 78 85C84 83 86 87 86 94C92 90 96 92 99 99C103 90 106 86 106 78C98 82 90 78 86 70C84 64 85 58 88 54Z", a, "#4a0a24", 1.6) + ln("M85 57L73 55M83 63L74 64M83 70L77 73M85 77L81 84M91 80L89 90M97 81L98 93", "#4a0a24", 1.3);
  const fins = wrap("bd-s-reef-fan", g("translate(52 72) scale(1.07 1.05) translate(-52 -72)", tail) + g("translate(70 60) scale(1.1 1.14) translate(-70 -60)", top) + g("translate(70 84) scale(1.08) translate(-70 -84)", low));
  const face = ln("M110 68q-4 2 -6 1", "#2a0c18", 1.8) + peer(95, 69, mood, { r: 6.4, ring: "#ffe0e0" }) + (mood === "happy" ? ln("M87 59L103 63", "#14060c", 2.8) : "") + el(105, 77, 3, 3.4, "#3a0a18");
  return {
    body: posed(k, fins + feelers(a, edge) + bodySvg + pec + gills + face, [84, 92, 10], [92, 55, 0.6], "translate(-1 -1)", "bd-s-reef-flare") +
      wrap("bd-s-reef-twinkle", ln("M108 46l7 -7M113 56l6 -2M100 40l2 -9M112 104l6 5M105 111l2 8", "#ffd84d", 3)),
    css: anim("fan", "transform-origin:56px 72px;animation:reefFan 1.1s ease-in-out infinite", kf("Fan", "0%,100%{transform:scale(.95)}50%{transform:scale(1.01)}")) +
      anim("flare", "animation:reefFlare .9s ease-in-out infinite", kf("Flare", "0%,100%{transform:translateX(-2px)}40%{transform:translateX(3px)}55%{transform:translateX(1px)}70%{transform:translateX(3px)}")) + CSS_TWINKLE,
  };
}

/** Comb-edged fin: long ray tips with deeply cut webbing between them. */
function comb(bx, by, tips, depth, fill, edge) {
  const mid = (i) => {
    const [x1, y1] = tips[i], [x2, y2] = tips[i + 1];
    return `${(bx + ((x1 + x2) / 2 - bx) * depth).toFixed(1)} ${(by + ((y1 + y2) / 2 - by) * depth).toFixed(1)}`;
  };
  const d = `M${bx} ${by}${tips.map(([x, y], i) => `L${x} ${y}${i < tips.length - 1 ? `L${mid(i)}` : ""}`).join("")}Z`;
  return p(d, fill, stroke(edge, 1.1)) + ln(tips.map(([x, y]) => `M${bx} ${by}L${x} ${y}`).join(""), edge, 1.5);
}
function crowntail(k) {
  const { c, b, a, mood } = k;
  const edge = dk(a, 0.25);
  return {
    body:
      flap(comb(55, 72, [[44, 25], [27, 30], [14, 42], [6, 57], [4, 72], [7, 88], [15, 101], [28, 112], [45, 118]], 0.58, c, edge) + p("M54 72C40 56 30 56 24 62C22 72 24 82 30 86C40 90 48 82 54 72Z", a, `opacity=".65"`)) +
      wag(comb(70, 62, [[50, 36], [56, 25], [66, 20], [77, 22], [86, 30]], 0.62, c, edge)) +
      comb(70, 82, [[49, 100], [53, 112], [62, 119], [73, 112], [82, 101], [88, 92]], 0.64, c, edge) +
      comb(80, 83, [[75, 117], [69, 112], [66, 104]], 0.7, b, edge) +
      skin(BETTA, c, p("M94 42C80 58 90 76 120 90V42Z", a, `opacity=".75"`) + ln("M58 66q5 4 0 9M66 62q5 4 0 9M66 76q4 3 0 7M74 68q5 4 0 9", b, 1.4), { edge, gloss: [72, 62, 13] }) +
      flap(comb(77, 77, [[58, 82], [57, 89], [63, 92]], 0.7, b, edge)) +
      bettaFace(k, "#ffd8c8", edge),
    neck: [87, 85, 9], cap: [90, 58, 0.6], wrap: "bd-bob",
  };
}

function galaxybetta(k) {
  const { c, a, mood, sig } = k;
  const edge = "#46508a", red = "#ea4a2c", ink = "#221e30", cyan = "#58e0ff";
  const TAIL = "M54 66C46 44 24 40 14 52C5 63 6 82 14 92C26 104 46 96 54 78Z";
  const DORSAL = "M54 62C48 44 62 34 78 40C86 44 86 52 86 58Z";
  const ANAL = "M52 80C40 96 46 108 62 108C74 106 82 96 88 86Z";
  const finP = (d, marks, rays) => p(d, c, `opacity=".95"`) + clip(d, marks) + ln(rays, "#8a9ad0", 1, `opacity=".7"`) + out(d, "none", edge, 1.3);
  const fish =
    flap(finP(TAIL, p("M6 40C30 40 34 56 22 62C12 68 4 66 0 60Z", a) + p("M10 84C24 72 38 82 34 92C30 104 14 100 8 94Z", red) + p("M30 46C42 42 50 54 40 60C32 62 26 54 30 46Z", ink) + p("M40 92C50 80 58 92 48 100Z", a) + dots([[20, 72], [28, 68], [16, 78], [38, 74], [26, 54], [14, 50]], 1.7, cyan), "M52 68L18 50M52 71L10 68M52 74L12 86M52 77L28 96")) +
    wag(finP(DORSAL, p("M50 30C66 34 64 48 54 52Z", red) + p("M74 34C90 36 86 54 76 52C68 48 68 40 74 34Z", a) + dots([[66, 46], [70, 52], [60, 56]], 1.4, ink), "M58 58L62 40M68 56L73 42M76 57L82 47")) +
    finP(ANAL, p("M36 92C52 84 62 96 54 112Z", a) + p("M70 96C84 88 90 100 76 110Z", ink) + dots([[62, 102], [68, 106], [48, 96]], 1.6, red), "M58 84L50 100M68 88L62 104M78 88L74 98") +
    feelers("#fff", edge) +
    skin(BETTA, c, p("M44 66C56 56 66 62 62 72C56 82 48 76 44 74Z", a) + p("M68 50C84 52 88 62 78 66C68 68 62 58 68 50Z", red) + p("M64 80C72 72 86 78 80 90C72 94 62 88 64 80Z", ink) + p("M98 54C108 52 120 60 112 66C104 66 96 60 98 54Z", red) + p("M84 58C90 56 92 62 87 64Z", ink) + dots([[58, 62], [74, 72], [70, 76], [54, 78], [86, 80], [80, 56]], 1.6, cyan) + dots([[60, 82], [90, 58], [76, 82]], 1.4, a), { edge, gloss: [72, 62, 13] }) +
    flap(fin("M76 76C66 72 56 80 56 90C66 92 76 86 78 80Z", "#e8f0ff", "M74 78L60 87", { edge, ray: cyan, op: 0.85 })) +
    bettaFace(k, "#9fd8ff", edge) +
    wrap("bd-glow", spark(40, 66, 3.4, "#fff") + spark(18, 62, 2.6, cyan) + spark(78, 46, 2.4, "#fff"));
  if (!sig) return { body: fish, neck: [87, 85, 9], cap: [90, 58, 0.6], wrap: "bd-bob" };
  const nest = [[34, 19, 5], [43, 15, 6.5], [53, 19, 5.5], [60, 13, 6], [69, 18, 7], [79, 14, 5.5], [87, 19, 6], [97, 15, 5], [105, 20, 4.5], [49, 27, 4], [62, 25, 5], [78, 26, 4.5], [92, 27, 4], [26, 15, 3.6], [112, 15, 3]];
  return {
    shadow: false,
    body: p("M2 9Q16 5 30 9T58 9T86 9T118 9V16H2Z", "#7fd8f0", `opacity=".4"`) + ln("M2 9Q16 5 30 9T58 9T86 9T118 9", "#e8fbff", 2) +
      posed(k, fish, [87, 85, 9], [90, 58, 0.6], "translate(-2 11) rotate(-34 70 72) translate(70 72) scale(.8) translate(-70 -72)", "bd-s-reef-nest") +
      bubbles(nest) + wrap("bd-s-reef-rise", bubbles([[100, 44, 4.5], [108, 32, 3.4], [96, 33, 2.6]])),
    css: anim("nest", "animation:reefNest 1.8s ease-in-out infinite", kf("Nest", "0%,100%{transform:translateY(3px)}50%{transform:translateY(-4px)}")) + CSS_RISE,
  };
}

function neon(k) {
  const { c, b, a, mood, sig } = k;
  const edge = "#4a5c68";
  const body = "M28 70C38 53 60 49 80 51C99 53 113 62 113 71C113 82 98 91 78 91C58 91 38 83 28 72Z";
  const redMark = (col) => p("M78 73C62 68 44 68 24 70L24 76C40 88 62 94 78 88C82 84 82 76 78 73Z", col);
  const blue = (main, core) => ln("M104 59C88 56 62 56 38 66", main, 8.6) + ln("M101 58C86 55.5 66 56 45 63", core, 3);
  const clear = "#d8eef4";
  const tail = flap(fin("M33 70L8 50C12 61 15 66 20 70C15 75 12 81 8 91Z", clear, "M29 70L12 56M29 71L13 86", { edge, ray: "#fff", op: 0.7 }) + p("M33 69L20 61L23 70L20 80L33 73Z", a, `opacity="${sig ? 0.4 : 0.8}"`));
  const base =
    tail + wag(fin("M58 53L66 34Q74 40 78 52Z", clear, "M64 50L67 39M70 50L71 42", { edge, ray: "#fff", op: 0.7 })) +
    fin("M40 58L42 50Q48 53 50 56Z", clear, "", { edge, op: 0.8 }) +
    fin("M52 87L48 105Q64 100 74 90Z", clear, "M56 90L52 101M64 91L59 99", { edge, ray: "#fff", op: 0.7 }) +
    fin("M80 89L76 100L88 90Z", clear, "", { edge, op: 0.7 }) +
    skin(body, c, el(82, 94, 42, 16, b) + p("M20 40H120V57C90 48 60 52 24 70Z", "#4e6258") + redMark(sig ? "#c89aa0" : a) + blue(sig ? "#7c98a6" : "#12bcff", sig ? "#a8c0ca" : "#9cffee"), { edge, gloss: [76, 55, 14] });
  const face = ln("M86 62Q80 73 87 84", "#8aa0ac", 1.3) + peer(97, 67, sig && mood === "happy" ? "sleepy" : mood, { r: 7, ring: "#eef6f8" }) + smile(108, 79, mood, "#38404c", 3) + rosy(92, 81);
  const pec = flap(fin("M80 76C72 76 66 82 66 88C74 88 80 84 82 79Z", clear, "", { edge, op: 0.75 }));
  if (!sig) return { body: base + pec + face, neck: [88, 87, 10], cap: [88, 54, 0.68], wrap: "bd-bob" };
  const lit = `<g class="bd-s-reef-lit" opacity="0">${clip(body, redMark(a) + blue("#12bcff", "#9cffee"))}${out(body, "none", edge, 1.5)}</g>`;
  return {
    body: dot(60, 66, 55, "#0a1040", `opacity=".5"`) + p("M96 10C88 12 84 22 90 28C96 34 106 32 109 26C101 28 94 22 96 10Z", "#fff2b0") + dots([[16, 20], [36, 12], [64, 18], [111, 44], [10, 44]], 1.4, "#fff") +
      ln("M16 124Q8 100 18 82M28 124Q36 108 30 96", "#2e7a50", 4.5) + el(17, 90, 8, 3.6, "#2e7a50", `transform="rotate(-35 17 90)"`) +
      posed(k, base + lit + pec + face, [88, 87, 10], [88, 54, 0.68], "translate(0 14) rotate(6 70 70)", "bd-s-reef-doze") +
      `<g class="bd-s-reef-rise" fill="#cfe4ff" font-family="system-ui" font-weight="800"><text x="94" y="54" font-size="11">z</text><text x="103" y="44" font-size="9">z</text></g>`,
    css: anim("lit", "animation:reefLit 4s ease-in-out infinite", kf("Lit", "0%,38%{opacity:0}58%,80%{opacity:1}100%{opacity:0}")) +
      anim("doze", "animation:reefDoze 3.4s ease-in-out infinite", kf("Doze", "0%,100%{transform:translateY(0)}50%{transform:translateY(3px)}")) + CSS_RISE,
  };
}

function discus(k) {
  const { c, b, a, mood, sig } = k;
  const edge = dk(c, 0.45), rim = "#d8342c";
  const body = "M102 71C101 52 86 33 62 33C39 33 23 50 23 70C23 91 39 107 62 107C84 107 99 92 101 80Q107 76 102 71Z";
  const marks = ln("M36 30V112M47 30V112M58 30V112M69 30V112M80 30V112", dk(c, 0.55), 3.4, `opacity=".38"`) +
    ln("M28 52q8 -8 16 -4t16 -4t16 2t16 8M22 64q10 -4 16 2t16 -2t14 4M24 80q8 6 16 0t14 4t16 -2M30 92q10 4 18 -2t18 4t16 -4M42 104q8 -6 16 -2t18 -2M82 54q8 2 12 8M78 62q6 6 4 12t4 12M92 70q-2 6 2 12M44 42q8 -6 16 -2", a, 2.1) +
    ln("M90 52Q96 60 94 70", dk(c, 0.5), 3, `opacity=".5"`);
  const fish =
    flap(fin("M28 62L7 52C12 64 12 78 7 90L28 80Z", lt(c, 0.35), "M25 66L11 58M25 71L12 71M25 76L11 84", { edge, ray: a, op: 0.85 })) +
    wag(fin("M25 62C24 32 52 12 78 22C88 27 94 36 96 46C78 30 42 32 25 62Z", c, "M30 50L26 40M38 40L36 29M49 35L50 22M62 33L66 20M74 35L82 27M83 39L92 35", { edge, ray: a }) ) + ln("M25 60C25 34 52 13 78 22C88 27 93 35 96 44", rim, 2) +
    fin("M25 80C24 106 50 124 76 118C88 112 94 104 96 96C76 112 42 108 25 80Z", c, "M30 92L26 102M39 102L37 112M50 106L51 118M63 108L67 119M75 105L83 114", { edge, ray: a }) + ln("M26 84C28 108 52 123 76 118C86 113 92 106 95 99", rim, 2) +
    skin(body, c, el(60, 72, 28, 24, b, `opacity=".55"`) + marks, { edge, gloss: [66, 44, 18], shine: 0.22 }) +
    ln("M80 100Q78 112 66 119", rim, 2.6) +
    flap(fin("M70 74C60 70 54 80 58 88C66 88 72 82 74 76Z", b, "M70 77L60 84", { edge, ray: a, op: 0.75 })) +
    peer(89, 62, mood, { iris: "#e0262e", r: 6.4 }) + smile(98, 79, mood, "#4a100c", 3) + rosy(84, 77);
  if (!sig) return { body: fish, neck: [80, 96, 12], cap: [72, 36, 0.72], wrap: "bd-bob" };
  const fry = (x, y, ang, cls) => wrap(`bd-s-reef-${cls}`, g(`translate(${x} ${y}) rotate(${ang})`, p("M-4 0C-9 -1 -12 -4 -14 -3Q-12 0 -14 3C-12 4 -9 1 -4 0Z", "#e8d8c0", stroke("#6a5040", 0.7)) + el(0, 0, 5.4, 3.8, "#f4e4c8", stroke("#6a5040", 0.9)) + dot(2, -0.6, 1.7, INK) + dot(2.5, -1.2, 0.55, "#fff")));
  return {
    body: posed(k, fish + el(54, 74, 26, 20, "#fff", `opacity=".16"`) + dots([[44, 66], [66, 84], [52, 90], [62, 60]], 1.6, "#fff"), [80, 96, 12], [72, 36, 0.72], "translate(4 0)", "bd-s-reef-host") +
      fry(44, 60, 20, "nib1") + fry(56, 84, -25, "nib2") + fry(34, 80, 0, "nib3") + fry(66, 66, 50, "nib2") + fry(15, 40, 35, "nib1") + fry(16, 104, -35, "nib3") + fry(50, 100, -65, "nib1") + wrap("bd-s-reef-twinkle", spark(40, 72, 4) + spark(62, 94, 3.4) + spark(56, 52, 3)),
    css: anim("host", "animation:reefHost 3s ease-in-out infinite", kf("Host", "0%,100%{transform:translate(0,0)}50%{transform:translate(2px,-2px)}")) +
      anim("nib1", "animation:reefNibA .7s ease-in-out infinite", kf("NibA", "0%,100%{transform:translate(0,0)}50%{transform:translate(3px,3px)}")) +
      anim("nib2", "animation:reefNibB .9s ease-in-out infinite", kf("NibB", "0%,100%{transform:translate(0,0)}50%{transform:translate(-3px,-2px)}")) +
      anim("nib3", "animation:reefNibC .8s ease-in-out infinite", kf("NibC", "0%,100%{transform:translate(0,0)}50%{transform:translate(4px,-1px)}")) + CSS_TWINKLE,
  };
}

function angelfish(k) {
  const { c, b, a, mood } = k;
  const edge = "#6a7884", ray = "#8a96a4", finCol = "#e8eef0";
  const body = "M44 70C50 54 64 43 78 43C94 51 109 64 111 71C111 76 109 79 105 80C97 89 88 95 78 97C62 94 50 84 44 70Z";
  const DORSAL = "M85 49C74 30 56 9 24 3C42 20 45 40 48 64L60 54Z";
  const ANAL = "M82 94C72 108 54 119 24 122C42 106 45 92 48 76L60 86Z";
  const bars = p("M91 40C96 54 98 72 94 98L101 96C105 74 102 54 98 40Z", a) + p("M66 0C74 30 78 70 70 124L61 124C68 80 65 40 54 0Z", a) + p("M44 18C54 40 55 90 44 124L38 124C47 86 46 46 36 20Z", a, `opacity=".9"`);
  const barredFin = (d, rays) => p(d, finCol, `opacity=".92"`) + clip(d, bars) + ln(rays, ray, 1, `opacity=".75"`) + out(d, "none", edge, 1.2);
  return {
    body:
      flap(fin("M50 68L17 52C25 64 25 78 17 90L50 74Z", finCol, "M46 69L22 57M46 71L23 71M46 73L22 85", { edge, ray, op: 0.85 })) +
      wag(barredFin(DORSAL, "M76 45L34 7M66 50L40 18M56 55L45 32")) +
      barredFin(ANAL, "M74 97L34 118M64 91L41 107M55 83L46 96") +
      ln("M86 92Q86 108 76 121M81 94Q78 106 66 115", "#c8d0d8", 2.6) + ln("M86 92Q86 108 76 121", edge, 0.8) +
      skin(body, c, el(88, 96, 36, 18, b) + p("M60 30H100L90 52 66 54Z", "#e8d27a", `opacity=".6"`) + bars, { edge, gloss: [80, 55, 12] }) +
      flap(fin("M80 76C70 74 64 82 66 88C74 88 80 82 82 78Z", "#fff", "M78 79L69 85", { edge, ray, op: 0.7 })) +
      peer(96, 66, mood, { iris: "#e0602a", r: 6.4 }) + smile(105, 79, mood, "#38303c", 3) + rosy(90, 81),
    neck: [87, 89, 9], cap: [85, 49, 0.62], wrap: "bd-bob",
  };
}

function archer(k) {
  const { c, b, a, mood, sig } = k;
  const edge = "#6a7460", blk = "#24262a";
  const body = "M34 70C44 62 60 54 80 52L114 53C110 59 108 66 103 73C94 87 80 96 64 94C50 91 40 82 34 72Z";
  const fish =
    flap(fin("M37 70L14 55C8 64 8 78 14 87L37 76Z", a, "M33 71L14 61M33 73L12 72M33 75L14 82", { edge: "#8a741a", ray: "#fff0a0" }) + ln("M14 55C8 64 8 78 14 87", blk, 2.6)) +
    wag(fin("M42 66L36 43Q52 44 66 56Z", a, "M45 62L41 49M52 59L50 49M58 58L58 52", { edge: blk, ray: "#fff0a0" }) + p("M36 43Q46 44 52 47L42 51Z", blk)) +
    fin("M46 84L38 105Q58 104 70 93Z", "#e8e0b0", "M50 88L44 100M57 90L53 100M63 92L61 98", { edge: blk, ray: "#a89858" }) +
    skin(body, c, el(86, 96, 44, 18, b) + p("M20 40H120V54L86 57C64 58 46 66 20 70Z", "#98a47c", `opacity=".8"`) +
      p("M37 50L50 50L47 71Q42 76 40 70Z", blk) + p("M54 44L68 44L64 74Q59 80 57 72Z", blk) + p("M72 42L85 42L80 66Q76 71 74 64Z", blk) + p("M91 44L100 44L94 76Q90 80 89 73Z", blk, `opacity=".85"`), { edge, gloss: [74, 82, 13] }) +
    flap(fin("M76 76C66 76 60 84 62 90C70 90 76 84 78 79Z", "#f4f0d0", "M74 79L65 87", { edge, op: 0.8 })) +
    ln("M114 53Q105 57 101 66", "#38402c", 2.2) +
    peer(96, 63, mood, { r: 7.6, ring: "#f4e8a0" }) + rosy(94, 80);
  if (!sig) return { body: fish + (mood === "happy" ? "" : smile(103, 74, mood, "#38402c", 2.6)), neck: [86, 87, 11], cap: [82, 53, 0.68], wrap: "bd-bob" };
  return {
    shadow: false,
    body: p("M2 36Q16 32 30 36T58 36T86 36T118 36V124H2Z", "#3aa8c8", `opacity=".26"`) + ln("M2 36Q16 32 30 36T58 36T86 36T118 36", "#e0faff", 2) +
      posed(k, fish, [86, 87, 11], [82, 53, 0.68], "translate(-9 13) rotate(-32 66 72) translate(66 72) scale(.92) translate(-66 -72)", "bd-s-reef-aim") +
      ln("M84 48Q93 28 105 18", "#bff0ff", 5.5, `opacity=".9"`) + ln("M84 48Q93 28 105 18", "#fff", 2.2, `stroke-dasharray="6 6" class="bd-s-reef-jet"`) +
      ln("M121 3Q108 8 96 6", "#5a3a20", 2.4) + out("M94 7C100 -1 112 1 116 6C108 14 98 13 94 7Z", "#58b84a", "#2a6a24") +
      wrap("bd-s-reef-bug", el(109, 17, 5.4, 4.4, "#6a2818", stroke(INK, 1)) + dot(104, 17, 2.6, INK) + ln("M107 21l-2 5M111 21l1 5M114 19l4 3M105 14l-3 -4M108 13l1 -4", INK, 1.2) + dot(103.4, 16.2, 0.8, "#fff")) +
      wrap("bd-s-reef-twinkle", dots([[99, 28], [116, 29], [118, 12], [92, 21]], 1.8, "#dff8ff")),
    css: anim("jet", "animation:reefJet .35s linear infinite", kf("Jet", "0%{stroke-dashoffset:12}100%{stroke-dashoffset:0}")) +
      anim("aim", "animation:reefAim 1.4s ease-in-out infinite", kf("Aim", "0%,100%{transform:translate(0,0)}30%{transform:translate(-3px,3px)}45%{transform:translate(2px,-2px)}")) +
      anim("bug", "transform-origin:109px 17px;animation:reefBug 1.4s ease-in infinite", kf("Bug", "0%,35%{transform:translate(0,0) rotate(0)}55%{transform:translate(3px,-3px) rotate(40deg)}85%{transform:translate(-3px,20px) rotate(200deg)}86%{opacity:0}100%{opacity:1;transform:translate(0,0) rotate(0)}")) + CSS_TWINKLE,
  };
}

// =====================================================================
// Sunlit Coral Reef
// =====================================================================
const CLOWN = "M32 70C37 51 55 43 76 44C98 45 113 59 113 72C113 86 97 97 76 96C56 96 38 87 32 70Z";
/** Clownfish fins: orange with a black rim and a fine pale margin. */
const cfin = (d, c) => p(d, c, stroke("#17121a", 3.4)) + p(d, "none", stroke("#fff", 0.6));
function clownBody(k, marks, tailMarks = "") {
  const { c, b, mood } = k;
  const rays = lt(c, 0.4);
  return {
    back: flap(cfin("M37 63C24 50 7 54 7 70C7 86 24 91 37 78Z", c) + tailMarks + ln("M33 68L15 62M33 71L13 71M33 74L15 80", rays, 1.2)) +
      wag(cfin("M44 53C46 33 60 32 65 44C69 31 86 31 90 47Z", c) + ln("M51 47L53 39M59 47L60 41M74 44L75 38M82 45L81 39", rays, 1.2)) +
      cfin("M50 90C44 108 64 111 70 94Z", c) + cfin("M74 93C74 106 86 104 85 94Z", c),
    main: skin(CLOWN, c, el(80, 98, 40, 14, b, `opacity=".8"`) + marks, { edge: "#2a1408", w: 1.8, gloss: [66, 52, 17] }),
    face: peer(99, 66, mood, { r: 6.4, ring: "#ffb060" }) + smile(107, 80, mood, "#4a1404", 3.4) + rosy(94, 81),
    pec: flap(cfin("M76 77C62 71 54 84 60 91C68 96 78 88 79 81Z", c) + ln("M73 80L62 87M73 83L66 89", rays, 1.1)),
  };
}
const OCELLARIS = p("M70 38C82 50 91 66 86 82C84 90 80 96 75 100L65 100C73 86 76 70 73 60C70 52 66 45 61 40Z", "#fff", stroke("#17121a", 2.6)) +
  p("M43 40C45 52 49 58 58 64Q64 69 57 74C51 80 50 90 50 100L39 100C41 86 41 56 34 42Z", "#fff", stroke("#17121a", 2.6)) +
  p("M29 52C37 60 39 80 29 94L22 94V50Z", "#fff", stroke("#17121a", 2.6));
function anemone(front) {
  const tent = (list, col, tip) => list.map(([x1, y1, cx, cy, x2, y2], i) => wrap(`bd-s-reef-tent${i % 2}`, ln(`M${x1} ${y1}Q${cx} ${cy} ${x2} ${y2}`, dk(col, 0.28), 9.4) + ln(`M${x1} ${y1}Q${cx} ${cy} ${x2} ${y2}`, col, 7.4) + dot(x2, y2, 4.4, tip, stroke(dk(col, 0.28), 1)))).join("");
  return front
    ? tent([[24, 114, 8, 108, 12, 88], [36, 116, 24, 100, 34, 86], [50, 116, 54, 102, 46, 90], [64, 117, 60, 104, 70, 93], [78, 116, 90, 104, 82, 90], [92, 116, 102, 104, 98, 88], [102, 114, 114, 112, 112, 94]], "#d878c8", "#ffc8ee") + out("M16 112Q60 104 104 112L98 122Q60 127 22 122Z", "#8a3a90", "#4a1a58")
    : tent([[22, 108, 6, 80, 12, 62], [32, 104, 30, 76, 22, 48], [48, 104, 36, 80, 44, 62], [84, 104, 98, 78, 88, 54], [96, 106, 112, 84, 110, 62], [66, 104, 72, 86, 62, 74]], "#a85ab8", "#e8a8f0");
}
const CSS_ANEMONE = anim("tent0", "transform-box:fill-box;transform-origin:50% 100%;animation:reefTentA 2s ease-in-out infinite", kf("TentA", "0%,100%{transform:rotate(-8deg)}50%{transform:rotate(8deg)}")) + anim("tent1", "transform-box:fill-box;transform-origin:50% 100%;animation:reefTentB 2.4s ease-in-out infinite", kf("TentB", "0%,100%{transform:rotate(8deg)}50%{transform:rotate(-7deg)}"));
function clown(k) {
  const f = clownBody(k, OCELLARIS);
  if (!k.sig) return { body: f.back + f.main + f.pec + f.face, neck: [89, 91, 11], cap: [87, 49, 0.7], wrap: "bd-bob" };
  const mood = k.mood === "happy" ? "sleepy" : k.mood;
  const face = peer(99, 66, mood, { r: 6.4, ring: "#ffb060" }) + smile(107, 79, "happy", "#4a1404", 4) + rosy(94, 80, 6);
  return {
    body: anemone(false) + posed(k, f.back + f.main + f.pec + face, [89, 91, 11], [87, 49, 0.7], "translate(1 -2) rotate(-9 66 72) translate(66 72) scale(.92) translate(-66 -72)", "bd-s-reef-snug") + anemone(true) +
      wrap("bd-s-reef-rise", p("M106 32l-4 -4a2.4 2.4 0 0 1 4 -2.4a2.4 2.4 0 0 1 4 2.4Z", "#ff6a9a") + p("M95 20l-3 -3a1.8 1.8 0 0 1 3 -1.8a1.8 1.8 0 0 1 3 1.8Z", "#ff8ab0")),
    css: CSS_ANEMONE + anim("snug", "animation:reefSnug 1.6s ease-in-out infinite", kf("Snug", "0%,100%{transform:translate(-4px,0)}50%{transform:translate(5px,4px)}")) + CSS_RISE,
  };
}

function snowclown(k) {
  const blk = stroke("#17121a", 2.4);
  const marks =
    p("M74 40C84 44 80 54 88 58C94 64 84 70 88 78C90 88 78 86 78 100L58 100C66 90 58 84 66 78C72 72 62 68 68 62C74 56 62 50 62 40Z", "#fff", blk) +
    p("M38 42C48 46 44 56 54 56C66 58 70 70 58 70C50 72 64 82 52 84C46 86 52 94 46 100L34 100C40 88 30 84 38 76C46 68 30 64 36 58C42 52 30 46 38 42Z", "#fff", blk) +
    p("M24 54C32 54 30 62 38 66C42 72 32 74 36 80C38 86 30 90 24 92Z", "#fff", blk) +
    dot(76, 90, 3.4, "#fff", blk) + dot(50, 64, 6, "#fff") + p("M52 62Q64 56 68 66Q62 72 54 70Z", "#fff") + dot(92, 52, 3, "#fff", stroke("#17121a", 1.8)) + dot(60, 48, 2.2, "#fff");
  const f = clownBody(k, marks, p("M10 64C18 60 16 70 24 72C18 76 20 84 12 80Z", "#fff", stroke("#17121a", 1.6)));
  const flakes = wrap("bd-glow", ln("M14 34v10M9 39h10M10.5 35.5l7 7M17.5 35.5l-7 7", "#fff", 1.5) + ln("M108 24v8M104 28h8", "#fff", 1.5) + ln("M22 100v8M18 104h8", "#fff", 1.5));
  if (!k.sig) return { body: flakes + f.back + f.main + f.pec + f.face, neck: [89, 91, 11], cap: [87, 49, 0.7], wrap: "bd-bob" };
  const eggs = [[64, 108], [70, 106], [76, 108], [82, 106], [88, 108], [94, 107], [100, 109], [67, 113], [73, 112], [79, 113], [85, 112], [91, 113], [97, 113], [76, 102], [88, 101], [94, 102]];
  return {
    shadow: false,
    body: out("M44 122C46 112 54 114 62 114C76 116 94 118 106 112C116 110 120 122 118 124H44Z", "#6a5a78", "#35284a") + dots([[52, 119], [110, 117]], 3, "#c86a9a") +
      eggs.map(([x, y]) => el(x, y, 2.8, 3.6, "#ffa424", stroke("#b8561a", 0.8)) + dot(x - 0.6, y - 1.2, 0.9, "#fff0c0")).join("") +
      posed(k, f.back + f.main + f.face + wrap("bd-s-reef-fanfin", g("translate(77 80) scale(1.45) translate(-77 -80)", cfin("M76 79C64 78 52 90 56 99C68 102 78 90 80 82Z", k.c) + ln("M73 83L60 93M74 86L66 96", lt(k.c, 0.4), 1))), [89, 91, 11], [87, 49, 0.7], "translate(-12 -22) rotate(24 70 72)", "bd-s-reef-tend") +
      wrap("bd-s-reef-twinkle", ln("M52 84q-8 6 -6 16M42 80q-12 10 -9 25M32 76q-14 14 -11 32", "#dff8ff", 2.2)),
    css: anim("fanfin", "transform-origin:77px 80px;animation:reefFanFin .22s ease-in-out infinite", kf("FanFin", "0%,100%{transform:rotate(-20deg)}50%{transform:rotate(24deg)}")) +
      anim("tend", "animation:reefTend 1.2s ease-in-out infinite", kf("Tend", "0%,100%{transform:translate(0,0)}50%{transform:translate(2px,4px)}")) + CSS_TWINKLE,
  };
}

function bluetang(k) {
  const { c, b, a, mood, sig } = k;
  const edge = "#0c1c60", ink = "#101230";
  const body = "M28 70C35 48 55 39 77 40C98 43 112 58 113 72Q117 76 112 80C106 93 92 101 73 101C53 101 36 91 28 72Z";
  const fish =
    flap(fin("M33 68L7 48C14 60 14 82 7 93L33 76Z", a, "M29 69L13 58M29 72L13 72M29 75L13 84", { edge: "#b88a08", ray: "#fff2a0" }) + ln("M33 68L7 48M33 76L7 93", ink, 3.4)) +
    wag(fin("M32 62C38 32 74 22 100 50L82 46 44 58Z", c, "M44 50L40 42M56 42L54 33M70 41L72 32M84 45L90 40", { edge: ink, w: 2.2, ray: b })) +
    fin("M34 82C40 108 72 118 96 94L78 98 46 88Z", c, "M46 91L42 100M58 97L57 108M72 98L76 108", { edge: ink, w: 2.2, ray: b }) +
    skin(body, c, el(88, 104, 38, 18, b, `opacity=".75"`) +
      p("M99 60C88 46 66 41 50 47C41 51 33 61 24 69L24 76C34 76 38 82 48 86C62 90 80 86 83 76C85 69 80 64 84 62C88 60 94 68 100 66Z", ink) +
      p("M44 66C48 57 66 55 73 62C78 69 70 76 60 76C52 76 41 73 44 66Z", c) + p("M24 69L38 71L24 76Z", a), { edge, gloss: [76, 50, 14], shine: 0.2 }) +
    flap(fin("M78 76C66 72 58 82 60 90C70 90 78 84 80 79Z", c, "M75 79L64 86", { edge: ink, ray: b, op: 0.95 }) + p("M60 90C58 86 61 82 64 80C63 84 65 87 69 89Z", a)) +
    peer(97, 63, sig && mood === "happy" ? "sleepy" : mood, { r: 6.4, ring: "#fff", lid: "#fff" }) + smile(107, 80, mood, "#081040", 3) + rosy(92, 80);
  if (!sig) return { body: fish, neck: [87, 92, 11], cap: [82, 44, 0.74], wrap: "bd-bob" };
  const branch = (d, col) => ln(d, dk(col, 0.28), 9) + ln(d, col, 6.6);
  return {
    body: branch("M20 122C18 100 24 90 14 76M20 100C30 90 28 80 34 74M96 122C98 104 108 96 104 76M99 104C90 96 94 86 88 82", "#e0607a") + dots([[14, 76], [34, 74], [104, 76], [88, 82]], 4.4, "#ff98a8") +
      posed(k, fish, [87, 92, 11], [82, 44, 0.74], "translate(-4 -6) rotate(58 70 72) translate(70 72) scale(.84) translate(-70 -72)", "bd-s-reef-still") +
      branch("M30 123C32 112 24 104 26 90M30 110C40 106 42 96 48 92M90 124C86 114 98 108 100 96M88 116C78 114 74 108 68 108M52 124C54 116 50 112 52 106", "#ff8a54") + dots([[26, 90], [48, 92], [100, 96], [68, 108], [52, 106]], 3.8, "#ffbc84") +
      wrap("bd-s-reef-shark", p("M2 20C12 10 28 10 38 15L46 8L44 17L48 24L40 22C28 28 12 28 2 20Z", "#4a5878", `opacity=".6"`) + p("M20 13L26 4L28 13Z", "#4a5878", `opacity=".6"`) + dot(10, 18, 1.3, "#fff")) +
      `<text class="bd-s-reef-twinkle" x="104" y="34" font-size="16" font-family="system-ui" font-weight="800" fill="#fff" stroke="${ink}" stroke-width="2.4" paint-order="stroke">…</text>`,
    css: anim("still", "animation:reefStill 3s linear infinite", kf("Still", "0%,70%,100%{transform:translate(0,0)}74%{transform:translate(1.4px,0)}78%{transform:translate(-1.4px,0)}82%{transform:translate(1px,0)}86%{transform:translate(0,0)}")) +
      anim("shark", "animation:reefShark 5s linear infinite", kf("Shark", "0%{transform:translateX(8px)}80%{transform:translateX(80px);opacity:1}81%{opacity:0}100%{transform:translateX(-50px);opacity:0}")) + CSS_TWINKLE,
  };
}

function mandarinFish(k, eyeMood) {
  const { c, b, a } = k;
  const edge = "#0c2470", navy = "#123a8a", red = "#e8381e";
  const body = "M26 74C34 61 52 56 72 55C90 52 113 62 114 76C114 89 97 96 76 95C54 95 36 86 26 77Z";
  const swirl = (d) => ln(d, navy, 7.4) + ln(d, a, 5) + ln(d, "#ffd04a", 1.2);
  return (
    flap(fin("M30 71C18 52 3 58 3 75C3 92 19 98 30 80Z", a, "", { edge: "#1a52c8", w: 3.4 }) + ln("M27 73L10 64M27 75L7 75M27 77L10 87", navy, 2.2) + ln("M27 74L12 70M27 77L12 82", "#38e0d0", 1.2)) +
    fin("M30 68C32 48 48 44 58 58Z", a, "M36 63L36 53M44 60L45 51M50 59L53 53", { edge: "#1a52c8", w: 2.6, ray: navy, rw: 2 }) +
    wag(fin("M56 58C52 32 60 14 72 8C70 24 84 42 80 57Z", a, "", { edge: "#1a52c8", w: 2.6 }) + ln("M61 54Q58 32 69 15M68 54Q66 38 71 26M75 55Q75 44 72 38", navy, 2.6) + ln("M64 54Q62 36 68 22M72 55Q72 44 70 34", "#38e0d0", 1.4)) +
    fin("M40 87C38 104 54 108 66 93Z", a, "M46 90L44 100M53 93L53 101", { edge: "#1a52c8", w: 2.6, ray: navy, rw: 2 }) +
    skin(body, c, el(78, 100, 34, 14, a) + p("M36 66C44 58 52 66 46 74C40 82 32 74 36 66Z", b) + p("M60 74C72 66 80 76 70 84C60 90 52 82 60 74Z", b) + p("M92 82C102 76 116 82 108 92C98 98 88 90 92 82Z", b) +
      swirl("M32 74C40 66 44 84 54 80C62 76 50 64 62 62C72 60 74 70 66 74") + swirl("M44 92C54 82 62 96 72 88C80 80 70 70 82 68") + swirl("M72 54C78 62 70 62 62 52") + swirl("M82 90C84 80 92 78 96 84") + swirl("M106 64C100 70 108 78 118 74") + swirl("M30 62C40 60 40 56 48 54") +
      dots([[56, 70], [40, 76], [76, 80], [56, 88]], 1.6, "#38e0d0"), { edge, gloss: [66, 62, 14], shine: 0.22 }) +
    flap(fin("M78 80C62 76 48 94 55 108C70 112 84 96 83 85Z", mix(b, "#ffffff", 0.2), "M77 84L56 102M78 87L62 107M80 89L72 106M75 82L55 94", { edge: "#1a52c8", ray: a, rw: 1.8, op: 0.86 })) +
    dot(94, 62, 10.5, c, stroke(edge, 1.4)) + ln("M84 60Q90 49 101 55", a, 3) +
    peer(96, 63, eyeMood, { iris: red, r: 6.8, lid: "#fff" }) + smile(107, 82, eyeMood, "#401004", 3.4) + rosy(90, 80)
  );
}
function mandarin(k) {
  const fish = mandarinFish(k, k.mood);
  if (!k.sig) return { body: fish, neck: [88, 91, 11], cap: [78, 57, 0.62], wrap: "bd-bob" };
  const partner = mandarinFish({ ...k }, k.mood === "happy" ? "love" : k.mood);
  return {
    shadow: false,
    body: dot(60, 60, 56, "#ff9a5a", `opacity=".22"`) + dot(60, 48, 40, "#8a4ac8", `opacity=".25"`) +
      out("M4 124C6 112 18 110 28 116C38 108 50 112 56 119C68 110 82 112 88 118C98 110 114 112 118 124Z", "#7a5a8a", "#3a2450") + dots([[18, 116], [72, 117], [104, 116]], 3.4, "#e88a9a") +
      wrap("bd-s-reef-pairA", g("translate(34 76) rotate(-48) scale(.57) translate(-66 -72)", partner)) +
      posed(k, g("translate(78 66) rotate(-48) scale(.62) translate(-66 -72)", mandarinFish(k, k.mood) + wear(k.stage, [88, 91, 11], [78, 57, 0.62])), null, null, "translate(0 0)", "bd-s-reef-pairB") +
      wrap("bd-s-reef-rise", dots([[62, 24], [70, 18], [76, 26], [56, 16], [66, 32], [82, 14], [50, 28], [72, 8]], 2, "#fff4c0") + spark(88, 28, 5) + spark(46, 14, 4)),
    css: anim("pairA", "animation:reefPairA 2.6s ease-in-out infinite", kf("PairA", "0%,100%{transform:translate(-3px,12px)}60%{transform:translate(4px,-7px)}")) +
      anim("pairB", "animation:reefPairB 2.6s ease-in-out infinite", kf("PairB", "0%,100%{transform:translate(3px,12px)}60%{transform:translate(-3px,-7px)}")) + CSS_RISE,
  };
}

function seahorse(k) {
  const { c, b, a, mood, sig } = k;
  const edge = dk(a, 0.3);
  const trunk = "M58 40C48 47 42 60 46 73C50 85 52 93 51 101L66 99C79 95 86 85 85 73C84 62 75 57 73 48C77 46 80 43 80 40Z";
  const curl = "M51 97C48 113 62 123 77 118C90 113 91 97 79 94C69 93 64 103 71 108C75 111 81 108 80 104C77 107 73 104 74 102C75 99 81 99 82 104C84 110 77 114 71 113C64 111 62 105 66 96Z";
  const gripTail = "M51 96C47 108 54 116 68 117C80 118 88 112 88 106L80 104C78 108 73 110 68 108C63 107 62 102 66 95Z";
  const ridges = ln("M50 62Q62 70 83 66M47 71Q62 80 85 76M49 81Q62 89 82 85M52 90Q60 96 73 93M54 53Q62 59 75 55", a, 1.7, `opacity=".8"`);
  const spikes = (list) => list.map(([x, y, dx, dy]) => out(`M${x} ${y - 3}L${x + dx} ${y + dy}L${x} ${y + 3}Z`, a, edge, 0.9)).join("");
  const horse = (tail) =>
    flap(fin("M52 62C34 54 26 68 30 84C36 80 40 86 53 78Z", b, "M50 66L33 66M50 70L31 76M51 74L35 82", { edge, ray: a, op: 0.9 })) +
    spikes([[52, 50, -8, -3], [45, 64, -6, -3], [48, 82, -7, 1], [52, 93, -7, 3]]) +
    tail +
    skin(trunk, c, el(80, 78, 17, 27, b) + ridges + dots([[56, 58], [52, 74], [60, 86], [58, 66], [66, 94]], 1.5, edge), { edge, gloss: [58, 56, 10], noShade: true }) +
    out("M58 17L52 6L60 11L63 2L68 10L74 5L72 18Z", c, edge) + dots([[52, 6], [63, 2], [74, 5]], 2.2, a) +
    out("M79 27C89 29 97 33 105 35Q110 36 110 41Q110 47 105 47C97 46 89 47 79 45Z", c, edge) + ln("M101 35Q98 41 101 47", edge, 1.2) +
    skin("M50 31C50 20 58 15 68 15C79 15 86 23 86 33C86 44 78 50 68 50C57 50 50 42 50 31Z", c, dots([[56, 24], [58, 38], [80, 22]], 1.4, edge), { edge, gloss: [64, 21, 9], noShade: true }) +
    ln("M104 42q3 2.6 5.4 0", edge, 1.4) + spikes([[78, 17, 6, -6]]) +
    fin("M57 41C49 38 46 48 50 52C55 53 59 49 60 45Z", b, "M57 44L50 49M57 42L50 44", { edge, ray: a }) +
    peer(72, 30, mood, { r: 6.6, ring: "#fff2c0" }) + rosy(74, 42) + (mood === "happy" ? "" : smile(94, 42, mood, edge, 2.6));
  const tailRings = ln("M52 106Q58 108 65 103M56 114Q62 113 68 108M67 119Q69 115 73 112M80 117L76 112M87 107L82 105M82 96L79 101", a, 1.5);
  if (!sig) return { body: horse(skin(curl, c, tailRings, { edge, noShade: true, shine: 0 })), neck: [64, 52, 11], cap: [65, 16, 0.6], wrap: "bd-bob" };
  const blade = ln("M82 124C74 108 82 92 90 74C96 58 92 44 98 30", "#1f7a48", 8) + ln("M82 124C74 108 82 92 90 74C96 58 92 44 98 30", "#48b868", 4.4);
  const ring = (d) => ln(d, edge, 8.6) + ln(d, c, 6.2);
  return {
    shadow: false,
    body: ln("M96 124Q112 100 102 82", "#2e8a58", 5) +
      wrap("bd-s-reef-hitch", g("translate(-6 -1) rotate(-13 74 108)", horse(skin(gripTail, c, tailRings, { edge, noShade: true, shine: 0 })) + wear(k.stage, [64, 52, 11], [65, 16, 0.6]))) +
      blade + ring("M71 105C73 98 89 99 88 106") + ring("M88 106C87 113 74 116 70 110C68 104 82 102 84 108") + ln("M74 101l3 4M84 101l-1 5M78 112l1 -4", a, 1.5) +
      wrap("bd-s-reef-current", ln("M2 12q10 -6 20 0t14 -2M2 62q10 -6 20 0M6 96q12 -6 24 0t20 -2M96 14q10 -5 20 0", "#e0faff", 2.2) + bubbles([[16, 44, 3], [28, 78, 2.2]])),
    css: anim("hitch", "transform-origin:76px 108px;animation:reefHitch 2.2s ease-in-out infinite", kf("Hitch", "0%,100%{transform:rotate(-8deg)}50%{transform:rotate(5deg)}")) +
      anim("current", "animation:reefCurrent 1.4s linear infinite", kf("Current", "0%{transform:translateX(14px);opacity:0}30%{opacity:1}100%{transform:translateX(-12px);opacity:0}")),
  };
}

function puffer(k) {
  const { c, b, a, mood, sig } = k;
  const edge = dk(c, 0.45), blk = a;
  const spots = (list) => list.map(([x, y, r]) => dot(x, y, r, blk)).join("");
  if (!sig) {
    const body = "M30 72C31 52 49 44 72 45C97 46 112 59 112 75C112 91 93 99 72 99C50 99 30 91 30 72Z";
    return {
      body:
        flap(fin("M34 68C20 56 8 62 8 74C8 88 22 92 34 79Z", c, "M31 71L14 66M31 74L12 75M31 77L15 84", { edge, ray: "#807a6c" }) + spots([[17, 70, 2.2], [22, 82, 1.8]])) +
        wag(fin("M44 54C34 40 46 33 59 47Z", c, "M48 49L42 42M53 48L49 40", { edge, ray: "#807a6c" })) +
        fin("M46 94C36 108 50 112 61 97Z", c, "M50 98L45 104M55 98L52 105", { edge, ray: "#807a6c" }) +
        skin(body, c, p("M22 84C50 72 80 96 118 84V120H22Z", b) + spots([[44, 62, 3], [55, 54, 2.4], [64, 64, 2.8], [50, 76, 2.2], [39, 76, 2], [74, 52, 2], [78, 80, 1.8], [62, 80, 1.6], [70, 90, 2.2], [48, 88, 1.8]]) +
          p("M96 52C108 54 118 66 116 80C112 92 98 92 92 82C98 72 100 64 96 52Z", blk) + el(91, 62, 13, 12, blk, `opacity=".9" transform="rotate(-15 91 62)"`), { edge, gloss: [62, 52, 16] }) +
        flap(fin("M70 72C58 66 52 78 57 87C65 91 73 84 75 77Z", c, "M69 76L57 79M69 79L60 85", { edge, ray: "#807a6c" })) +
        el(108, 79, 8.5, 8, mix(blk, "#ffffff", 0.12), stroke("#14121a", 1)) + el(105, 74, 3, 1.8, "#fff", `opacity=".35"`) + ln("M101 65l2 -4M106 67l4 -3", blk, 2.6) +
        peer(91, 62, mood, { iris: "#a8c860", r: 7.4, lid: "#fff" }) + smile(108, 81, mood, "#ffd8d8", 3.4) + rosy(85, 80),
      neck: [84, 93, 13], cap: [76, 48, 0.74], wrap: "bd-bob",
    };
  }
  const prickles = [];
  for (let i = 0; i < 30; i++) {
    const t = (i / 30) * Math.PI * 2, cs = Math.cos(t), sn = Math.sin(t);
    const at = (r, off) => `${(60 + Math.cos(t + off) * r).toFixed(1)} ${(70 + Math.sin(t + off) * r).toFixed(1)}`;
    prickles.push(out(`M${at(43, -0.05)}L${(60 + cs * 50).toFixed(1)} ${(70 + sn * 49).toFixed(1)}L${at(43, 0.05)}Z`, lt(c, 0.3), edge, 1));
  }
  const ball = "M16 70C16 44 35 27 60 27C85 27 104 44 104 70C104 96 85 113 60 113C35 113 16 96 16 70Z";
  const sideFin = flap(fin("M20 68C6 62 2 72 5 80C10 86 18 82 22 77Z", c, "M18 72L7 72M18 76L9 80", { edge, ray: "#807a6c" }));
  return {
    shadow: false,
    body: fin("M72 32C78 18 92 22 88 40Z", c, "M77 31L82 24", { edge }) + prickles.join("") + two(sideFin) +
      skin(ball, c, el(60, 108, 50, 36, b) + spots([[34, 50, 3.4], [46, 40, 2.6], [76, 40, 3], [88, 52, 2.6], [60, 38, 2], [28, 68, 2.6], [93, 70, 3], [36, 88, 2.8], [86, 88, 2.4], [50, 102, 2.4], [72, 100, 3], [60, 48, 1.8]]) + el(41, 62, 13, 12, blk) + el(79, 62, 13, 12, blk) + el(60, 78, 17, 13, blk), { edge, gloss: [44, 43, 16], shine: 0.35 }) +
      eye(42, 62, mood, { iris: "#a8c860", r: 8, lid: "#fff" }) + eye(78, 62, mood, { iris: "#a8c860", r: 8, lid: "#fff" }) +
      ln("M54 69l-2 -4M66 69l2 -4", "#57515e", 2.6) + el(60, 80, 6.4, 7, "#f28a9a", stroke("#14121a", 2)) + el(60, 83, 3.4, 2.4, "#8a2038") + rosy(30, 80, 6) + rosy(90, 80, 6) +
      wrap("bd-s-reef-twinkle", ln("M8 34l8 7M112 34l-8 7M6 108l8 -5M114 108l-8 -5", "#fff", 2.6)) + wrap("bd-s-reef-rise", bubbles([[104, 26, 3.4], [111, 17, 2.4], [14, 22, 2.8]])),
    neck: [60, 95, 22], cap: [60, 30, 0.95], wrap: "bd-s-reef-puff",
    css: anim("puff", "transform-origin:60px 72px;animation:reefPuff 2.2s cubic-bezier(.3,1.6,.5,1) infinite", kf("Puff", "0%{transform:scale(.62)}28%,78%{transform:scale(1)}86%{transform:scale(.96)}100%{transform:scale(.62)}")) + CSS_TWINKLE + CSS_RISE,
  };
}

function boxfish(k) {
  const { c, b, a, mood } = k;
  const edge = "#b0800a";
  const body = "M33 54C35 45 42 43 60 42C78 39 95 40 102 48C108 55 108 62 108 70C108 80 107 86 102 91C96 99 80 100 62 100C46 100 36 97 33 89C30 78 30 63 33 54Z";
  const spot = (x, y, r) => dot(x, y, r + 1.4, "#fff6c0") + dot(x, y, r, a);
  const clear = "#fff0a0";
  return {
    body:
      flap(fin("M24 70C14 56 5 62 6 73C5 86 14 92 24 79Z", clear, "M22 72L10 66M22 74L8 74M22 76L10 83", { edge, ray: "#e0b020" }) + dots([[13, 70], [14, 80]], 1.6, a) + out("M34 66L22 69Q20 74 22 80L34 83Z", c, edge) + dot(27, 74, 2.2, a)) +
      wag(fin("M40 48C32 34 44 30 52 44Z", clear, "M43 44L39 37M47 43L45 36", { edge, ray: "#e0b020" })) +
      fin("M42 95C34 110 48 112 54 98Z", clear, "M45 99L41 105", { edge, ray: "#e0b020" }) +
      skin(body, c, p("M30 55C48 47 84 41 108 50V34H30Z", b) + ln("M34 55C52 48 82 44 104 51", lt(c, 0.6), 2) + ln("M36 90C54 94 84 94 103 88", "#e0a812", 2.4) +
        spot(45, 62, 3.4) + spot(59, 53, 2.6) + spot(60, 71, 3.6) + spot(43, 80, 2.8) + spot(75, 50, 2.2) + spot(75, 88, 2.8) + spot(58, 88, 2.6) + spot(78, 63, 2.2) + spot(40, 49, 1.8) + spot(97, 50, 1.8) + spot(48, 93, 1.4), { edge, gloss: [70, 47, 17], shine: 0.4 }) +
      flap(fin("M70 75C58 68 54 82 60 87C66 89 71 83 73 79Z", clear, "M69 78L59 79M69 80L61 85", { edge, ray: "#e0b020" })) +
      peer(91, 63, mood, { r: 8.4, ring: "#fff8d0" }) +
      el(110, 82, 6, 5.4, "#f4a838", stroke("#a86408", 1.4)) + ln(mood === "sad" ? "M107 84q3 -3 7 -1" : "M106.5 82q4 1.4 8 0", "#6a3004", 1.5) + rosy(90, 81, 5.4),
    neck: [86, 93, 13], cap: [80, 43, 0.74], wrap: "bd-bob",
  };
}

/** One banded lionfish spine with a ragged banner. */
const spine = (x1, y1, x2, y2, c, flag = 4) => {
  const dx = x2 - x1, dy = y2 - y1, n = Math.hypot(dx, dy) || 1, ox = (-dy / n) * flag, oy = (dx / n) * flag;
  return p(`M${x1} ${y1}Q${(x1 + dx * 0.55 - ox).toFixed(1)} ${(y1 + dy * 0.55 - oy).toFixed(1)} ${x2} ${y2}L${x1 + 4} ${y1}Z`, "#fbeee2", `opacity=".8"`) + ln(`M${x1} ${y1}L${x2} ${y2}`, "#fbeee2", 2.4) + ln(`M${x1} ${y1}L${x2} ${y2}`, c, 2.4, `stroke-dasharray="5 4"`) + dot(x2, y2, 1.4, c);
};
/** A broad pectoral fan: long separate rays joined by webbing near the base. */
const lionFan = (bx, by, tips, c, reach = 0.66) => {
  const web = tips.map(([x, y]) => `L${(bx + (x - bx) * reach).toFixed(1)} ${(by + (y - by) * reach).toFixed(1)}`).join("");
  return p(`M${bx} ${by}${web}Z`, "#fbe4d4", `opacity=".88" ${stroke(c, 1)}`) +
    [reach * 0.42, reach * 0.74].map((t) => ln(`M${tips.map(([x, y]) => `${(bx + (x - bx) * t).toFixed(1)} ${(by + (y - by) * t).toFixed(1)}`).join("L")}`, c, 2.6)).join("") +
    tips.map(([x, y]) => spine(bx, by, x, y, c, 3.6)).join("");
};
function lionfish(k) {
  const { c, b, a, mood, sig } = k;
  const edge = a;
  const body = "M40 70C46 56 60 50 78 50C96 51 113 62 113 74C113 85 99 93 80 93C62 93 47 84 40 74Z";
  const fish = (nearFan, farFan) =>
    farFan +
    spine(54, 60, 18, 28, c) + spine(60, 56, 29, 15, c) + spine(66, 54, 44, 7, c) + spine(73, 52, 59, 4, c) + spine(80, 52, 74, 6, c) + spine(87, 54, 89, 14, c) + spine(93, 57, 103, 28, c, 3) +
    flap(fin("M43 68C28 54 12 60 13 73C12 88 30 90 43 78Z", "#fbe4d4", "M40 72L18 64M40 74L16 74M40 76L19 84", { edge: c, ray: c }) + dots([[22, 68], [26, 78], [20, 79], [30, 70], [18, 72], [30, 83]], 1.5, a)) +
    fin("M50 86C40 96 40 106 48 108C56 102 62 96 64 90Z", "#fbe4d4", "M54 89L45 103", { edge: c, ray: c, rw: 1.8 }) +
    skin(body, b, ln("M48 52Q56 72 48 96M62 46Q70 72 62 98M78 44Q86 72 76 98", c, 7.4) + ln("M55 48Q63 72 55 98M70 46Q78 72 69 98M87 46Q92 62 88 74", a, 2) + ln("M96 44Q104 66 92 98", c, 4.6) + ln("M108 50Q112 64 118 70", c, 3.4) + ln("M40 62Q46 72 40 84", c, 4), { edge, gloss: [70, 57, 14] }) +
    ln("M98 56C96 46 104 42 100 33", c, 2.6) + p("M100 33C95 30 96 24 100 24C104 25 104 30 100 33Z", c) + ln("M108 85q1 6 -3 9M112 81q5 3 5 8", c, 2) +
    nearFan +
    dot(99, 66, 9.4, b) + peer(99, 66, mood, { iris: "#e8862a", r: 6.4 }) + smile(108, 81, mood, "#4a100c", 3) + rosy(95, 80, 3.6);
  if (!sig) {
    return {
      body: fish(wag(lionFan(76, 78, [[72, 116], [60, 117], [47, 113], [37, 105], [33, 95], [36, 85]], c)), spine(86, 84, 100, 112, c) + spine(86, 84, 90, 115, c) + spine(86, 84, 110, 103, c, 3)),
      neck: [90, 90, 10], cap: [89, 54, 0.58], wrap: "bd-bob",
    };
  }
  const upper = wrap("bd-s-reef-herdUp", lionFan(46, 63, [[40, 8], [58, 6], [76, 10], [92, 18], [106, 30], [114, 46]], c, 0.76));
  const lower = wrap("bd-s-reef-herdDown", lionFan(48, 81, [[46, 118], [64, 120], [81, 117], [96, 109], [108, 98], [115, 85]], c, 0.76));
  const small = "translate(-24 2) translate(60 72) scale(.66) translate(-60 -72)";
  return {
    body: out("M121 30C111 36 118 52 112 62C119 74 110 90 117 108L121 108Z", "#7a6088", "#3a2850") +
      upper + posed(k, fish("", ""), [90, 90, 10], [89, 54, 0.58], small) + lower +
      wrap("bd-s-reef-prey", g("translate(-8 -1)", out("M103 66C108 62 116 66 114 73C112 78 106 79 103 76C108 76 110 72 108 70Q106 69 103 71Z", "#ffa488", "#a8402a", 1.1) + dot(105, 68, 1.9, "#fff") + dot(105.4, 68, 1.1, INK) + ln("M102 66Q97 60 94 61M103 64Q101 58 97 56", "#c85a3a", 1) + ln("M108 55v5M115 58l-3 3M114 80l3 3", "#fff", 1.8))),
    css: anim("herdUp", "transform-origin:46px 63px;animation:reefHerdUp 1.6s ease-in-out infinite", kf("HerdUp", "0%,100%{transform:rotate(-6deg)}55%{transform:rotate(7deg)}")) +
      anim("herdDown", "transform-origin:48px 81px;animation:reefHerdDown 1.6s ease-in-out infinite", kf("HerdDown", "0%,100%{transform:rotate(6deg)}55%{transform:rotate(-7deg)}")) +
      anim("prey", "animation:reefPrey .3s linear infinite", kf("Prey", "0%,100%{transform:translate(0,0)}50%{transform:translate(1.6px,-1.4px)}")),
  };
}

/** One leaf-shaped skin flap on a thin stalk. */
const frond = (x, y, ang, s, fill, edge) => g(`translate(${x} ${y}) rotate(${ang}) scale(${s})`, ln("M0 0Q6 -2 11 0", edge, 2) + out("M9 0C11 -6 17 -9 21 -5C25 -9 31 -6 29 -2C34 -1 35 4 28 5C27 10 20 8 18 5C13 8 9 5 9 0Z", fill, edge, 1.1) + ln("M11 0Q19 -1 28 2M18 -0.5l3 -4M20 1l2 4", edge, 0.8));
function seadragon(k) {
  const { c, b, a, mood, sig } = k;
  const edge = dk(c, 0.5), leafEdge = dk(a, 0.4), leaf2 = mix(a, c, 0.5);
  const f = (list) => list.map(([x, y, ang, s, alt]) => frond(x, y, ang, s, alt ? leaf2 : a, leafEdge)).join("");
  const tail = "M50 84C42 96 30 102 20 104C14 106 10 110 11 116C15 112 20 112 26 112C42 110 54 102 62 90Z";
  const trunk = "M71 44C67 54 57 56 50 64C42 74 43 86 52 92C62 98 73 92 74 82C75 74 72 70 76 64C82 56 86 52 86 44Z";
  const dragon =
    wrap("bd-wag", f([[70, 27, -118, 0.74], [81, 26, -66, 0.6, 1]])) +
    wrap("bd-flap", f([[67, 52, -160, 1], [50, 66, -128, 1.05, 1], [47, 80, 168, 1.05]])) +
    f([[34, 102, -108, 0.9], [23, 106, 152, 0.62, 1]]) +
    wrap("bd-wag", f([[42, 100, 118, 0.8, 1]])) +
    skin(tail, c, ln("M44 92l6 8M34 100l4 9M24 104l2 8M17 108l1 6", b, 2), { edge, noShade: true, shine: 0 }) +
    f([[72, 82, 24, 1, 1], [62, 92, 74, 0.84], [81, 56, 26, 0.74]]) +
    skin(trunk, c, ln("M69 50Q76 58 82 54M57 60Q66 70 76 66M48 68Q60 80 74 78M45 80Q58 92 72 88", b, 2.6) + el(52, 76, 7, 11, lt(c, 0.25), `opacity=".7"`), { edge, noShade: true }) +
    f([[58, 70, 150, 0.52, 1], [64, 82, 52, 0.55]]) +
    out("M83 30C93 33 103 37 113 40Q119 41 118 46Q117 51 112 50C101 48 92 47 83 45Z", c, edge) + ln("M110 40Q107 45 110 49", edge, 1.1) +
    skin("M64 36C64 27 71 22 79 22C88 22 93 29 93 37C93 45 87 50 79 50C70 50 64 44 64 36Z", c, el(80, 50, 15, 8, b), { edge, noShade: true, gloss: [74, 28, 8] }) +
    ln("M77 23l-2 -8M85 24l3 -7", edge, 2) + out("M72 15C68 8 76 5 78 10C82 12 78 18 72 15Z", a, leafEdge, 1) +
    peer(81, 34, mood, { iris: "#c8502a", r: 5.6, lid: "#3a2808" }) + rosy(80, 44, 3.6) + (mood === "happy" ? ln("M112 45q2.6 2.4 5 0", edge, 1.3) : smile(106, 44, mood, edge, 2.4)) +
    wrap("bd-flap", fin("M52 64C44 56 37 60 40 68C44 70 48 68 54 70Z", lt(c, 0.55), "M51 66L42 62M51 68L41 67", { edge, op: 0.8, ray: "#fff" }));
  if (!sig) return { body: dragon, neck: [75, 52, 9], cap: [77, 24, 0.55], wrap: "bd-bob" };
  const kelp = (d, col, cls, leaves) => wrap(`bd-s-reef-${cls}`, ln(d, dk(col, 0.35), 5) + leaves.map(([x, y, ang, s]) => frond(x, y, ang, s, col, dk(col, 0.35))).join(""));
  return {
    shadow: false,
    body: kelp("M14 124C6 100 22 80 12 54C8 40 14 30 12 20", a, "kelpA", [[12, 28, -50, 0.9], [14, 62, -20, 1], [15, 86, -40, 0.9], [11, 104, 10, 0.7]]) +
      kelp("M104 124C112 104 96 88 108 66", leaf2, "kelpB", [[108, 70, -70, 0.9], [102, 88, 190, 0.8]]) +
      posed(k, dragon, [75, 52, 9], [77, 24, 0.55], "translate(-1 1) rotate(-16 56 80)", "bd-s-reef-weed") +
      kelp("M36 126C28 118 40 108 32 100", c, "kelpB", [[33, 102, -70, 0.8], [35, 114, 200, 0.7]]) + kelp("M82 126C92 116 78 106 88 98", a, "kelpA", [[87, 100, -60, 0.9], [84, 112, -10, 0.8]]) +
      wrap("bd-s-reef-swell", ln("M24 18q12 -5 22 0t20 -1M60 112q10 -5 20 0", "#e0faff", 1.8)),
    css: anim("weed", "transform-origin:60px 112px;animation:reefWeed 3s ease-in-out infinite", kf("Weed", "0%,100%{transform:rotate(-11deg)}50%{transform:rotate(11deg)}")) +
      anim("kelpA", "transform-box:fill-box;transform-origin:50% 100%;animation:reefKelpA 3s ease-in-out infinite", kf("KelpA", "0%,100%{transform:rotate(-8deg)}50%{transform:rotate(8deg)}")) +
      anim("kelpB", "transform-box:fill-box;transform-origin:50% 100%;animation:reefKelpB 3s ease-in-out infinite", kf("KelpB", "0%,100%{transform:rotate(-6deg)}50%{transform:rotate(10deg)}")) +
      anim("swell", "animation:reefDrift 2.4s ease-in-out infinite", kf("Drift", "0%,100%{transform:translateX(-5px);opacity:.3}50%{transform:translateX(6px);opacity:.9}")),
  };
}

// =====================================================================
// Moonlit Deep Pool
// =====================================================================
const OCTO_HEAD = "M29 58C24 29 41 15 60 15C79 15 96 29 91 58C90 73 80 80 60 80C40 80 30 73 29 58Z";
const OCTO_ARMS = [
  ["M42 68C30 72 14 70 8 60C4 52 12 46 16 52C14 56 18 60 26 60C32 60 36 56 40 54Z", [[34, 66], [25, 66], [17, 63], [11, 58]]],
  ["M44 72C34 82 18 84 10 94C4 102 8 112 15 110C19 108 18 103 14 103C16 96 26 94 34 93C44 90 50 84 54 76Z", [[42, 83], [33, 88], [24, 90], [16, 94], [11, 101]]],
  ["M49 74C48 90 36 96 32 106C28 116 37 123 43 118C46 115 43 111 40 113C39 108 44 104 50 100C58 94 60 86 62 76Z", [[54, 85], [49, 93], [42, 99], [37, 106]]],
  ["M57 76C56 90 60 98 56 108C52 116 55 121 60 119L62 78Z", [[59, 86], [59, 96], [58, 106]]],
];
/** Skin only: arms and mantle in one colourway, so colour layers can be stacked cheaply. */
function octoSkin(c, b, a, o = {}) {
  const edge = dk(c, 0.45);
  const arms = OCTO_ARMS.map(([d]) => out(d, c, edge, 1.5)).join("");
  return arms + mirror(arms) +
    skin(OCTO_HEAD, c, (o.marks || "") + dots(o.speck || [[44, 28], [54, 22], [72, 26], [80, 40], [38, 42], [66, 34], [50, 38], [84, 54], [35, 56]], 2.4, a) + dots([[48, 26], [76, 33], [60, 29], [41, 34], [69, 20]], 1.4, b), { edge, gloss: [46, 26, 14], noShade: true, shine: 0.3 });
}
const octoSuckers = (arm, b) => `<g fill="${b}" stroke="${dk(b, 0.25)}" stroke-width=".7">${OCTO_ARMS[arm][1].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.2"/>`).join("")}</g>`;
const octoFace = (c, a, b, mood, ring = "#ffe8b8") =>
  two(dot(44, 58, 11.5, lt(c, 0.14), stroke(dk(c, 0.45), 1.3))) + eye(44, 58, mood, { r: 7, ring }) + eye(76, 58, mood, { r: 7, ring }) +
  two(dot(33, 73, 4.4, dk(a, 0.35), stroke(b, 1.4))) + smile(60, 69, mood, "#3a0c14", 4.4) + two(rosy(46, 71));
function octopus(k) {
  const { c, b, a, mood, sig } = k;
  if (!sig) {
    const edge = dk(c, 0.45);
    const arms = OCTO_ARMS.map(([d], i) => wrap(i % 2 ? "bd-wag" : "bd-breathe", out(d, c, edge, 1.5) + octoSuckers(i, b))).join("");
    const head = skin(OCTO_HEAD, c, dots([[44, 28], [54, 22], [72, 26], [80, 40], [38, 42], [66, 34], [50, 38], [84, 54], [35, 56]], 2.4, a) + dots([[48, 26], [76, 33], [60, 29], [41, 34], [69, 20]], 1.4, b), { edge, gloss: [46, 26, 14], noShade: true, shine: 0.3 });
    return { body: arms + mirror(arms) + head + octoFace(c, a, b, mood), neck: [60, 79, 18], cap: [60, 21, 0.95], wrap: "bd-bob" };
  }
  const horns = (col) => out("M38 46C32 34 36 30 38 22C43 30 44 34 49 40ZM82 46C88 34 84 30 82 22C77 30 76 34 71 40ZM54 17C54 8 58 8 60 1C62 8 66 8 66 17Z", col, dk(col, 0.4), 1.4);
  const stripes = (col) => ln("M48 14Q40 30 42 46M72 14Q80 30 78 46M60 12V46M26 48Q36 46 38 40M94 48Q84 46 82 40M34 66Q46 78 44 90M86 66Q74 78 76 90", col, 6);
  const white = "#fbeee0", red = "#a81c40", teal = "#2a8a9a", plum = "#3a2450";
  const first = horns(white) + octoSkin(white, "#ffffff", red, { marks: p("M20 14H60Q50 30 62 40Q48 54 58 66Q50 76 54 90H20Z", red) + stripes("#d84a68") }) +
    clip("M0 0H56Q48 28 58 42Q44 60 56 74Q46 92 52 124H0Z", horns(red) + octoSkin(red, "#f8a8b0", "#4a0820", { speck: [[38, 30], [34, 48], [46, 20]] }));
  const second = horns(teal) + octoSkin(teal, "#bff0e8", "#f4e04a", { marks: stripes("#14485a") });
  const third = horns(plum) + octoSkin(plum, "#c8a8e8", "#ff8a3a", { speck: [[44, 28], [54, 20], [72, 26], [80, 40], [38, 42], [66, 34], [50, 40], [60, 24]] });
  const suckers = `<g fill="#ffd8dc" stroke="#c8909a" stroke-width=".7">${OCTO_ARMS.flatMap(([, list]) => list).map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.2"/>`).join("")}</g>`;
  return {
    body: first + `<g class="bd-s-reef-hue1" opacity="0">${second}</g><g class="bd-s-reef-hue2" opacity="0">${third}</g>` + suckers + mirror(suckers) + octoFace("#e8b0b0", red, "#ffffff", mood, "#ffd0d8") +
      wrap("bd-s-reef-twinkle", spark(12, 24, 6) + spark(108, 20, 5, "#ff8ac8") + spark(112, 76, 4, "#8affe0") + spark(8, 78, 4, "#c8a8ff")),
    neck: [60, 79, 18], cap: [60, 21, 0.95], wrap: "bd-s-reef-shift",
    css: anim("hue1", "animation:reefHueA 3.6s linear infinite", kf("HueA", "0%,22%{opacity:0}34%,56%{opacity:1}68%,100%{opacity:0}")) +
      anim("hue2", "animation:reefHueB 3.6s linear infinite", kf("HueB", "0%,56%{opacity:0}68%,88%{opacity:1}99%,100%{opacity:0}")) +
      anim("shift", "transform-origin:60px 100px;animation:reefShift 1.2s ease-in-out infinite", kf("Shift", "0%,100%{transform:scale(1,1)}50%{transform:scale(1.04,.96)}")) + CSS_TWINKLE,
  };
}

function cuttle(k) {
  const { c, b, a, mood, sig } = k;
  const edge = dk(c, 0.5);
  const mantle = "M13 68C19 49 41 42 61 43C78 44 86 55 86 68C86 82 73 90 54 90C33 90 19 82 13 68Z";
  const skirt = "M8 68C8 60 14 60 15 54C18 48 24 52 27 45C32 39 38 45 43 38C49 33 54 40 60 37C66 36 69 42 75 41C80 42 78 48 82 52L80 82C78 90 72 88 68 94C62 98 56 92 50 96C43 99 40 91 33 92C27 93 26 86 20 84C13 82 16 76 8 68Z";
  const headD = "M66 67C66 53 74 46 86 46C98 46 105 55 105 67C105 78 97 85 86 85C74 85 66 78 66 67Z";
  const arm = (d, i) => wrap(i % 2 ? "bd-wag" : "bd-flap", out(d, c, edge, 1.3));
  const arms = sig
    ? out("M98 56C106 50 112 44 119 42C117 49 111 56 102 63Z", c, edge) + out("M100 62C108 60 114 60 120 62C115 67 108 69 102 70Z", b, edge) + out("M100 70C108 71 114 74 119 80C111 80 105 78 98 76Z", c, edge) + out("M95 76C101 82 106 88 108 95C100 92 94 87 90 82Z", b, edge)
    : arm("M96 58C108 55 115 60 117 69C118 74 113 75 112 71C109 66 104 68 98 68Z", 0) + arm("M99 66C108 71 114 80 112 90C110 95 106 92 108 88C107 81 101 78 94 76Z", 1) + arm("M93 74C102 82 104 94 98 101C94 104 91 100 95 97C97 90 91 85 84 82Z", 2) + out("M86 78C90 88 88 96 80 100C77 100 78 96 80 95C82 90 80 85 76 82Z", b, edge, 1.2);
  const zebra = ln("M24 60Q30 56 34 62M34 49Q40 54 46 48M22 74Q30 72 32 80M48 56Q54 62 62 54M44 72Q52 66 58 74M38 84Q44 80 50 86M62 82Q66 76 74 80M62 64Q68 70 74 62M26 66Q36 70 40 64M52 46Q58 52 66 46", b, 3) + dots([[30, 66], [48, 64], [58, 82], [40, 58], [70, 52], [66, 74], [36, 76]], 1.5, "#fff");
  const bands = (n) => {
    let s = "";
    for (let i = -1; i < n; i++) s += ln(`M${i * 24 + 6} 30Q${i * 24 + 24} 66 ${i * 24 + 4} 104`, "#2a140c", 11, `opacity=".82"`) + ln(`M${i * 24 + 18} 30Q${i * 24 + 36} 66 ${i * 24 + 16} 104`, "#fff2d8", 3.4, `opacity=".75"`);
    return s;
  };
  const ex = 89, ey = 61;
  const wEye = mood === "happy"
    ? el(ex, ey, 10.5, 9.5, "#f4e6b0", stroke(edge, 1.4)) + ln(`M${ex - 7.4} ${ey - 3}Q${ex - 6} ${ey + 5} ${ex - 2.8} ${ey + 3.6}Q${ex} ${ey + 2} ${ex} ${ey - 2.4}Q${ex} ${ey + 2} ${ex + 2.8} ${ey + 3.6}Q${ex + 6} ${ey + 5} ${ex + 7.4} ${ey - 3}`, "#14101a", 3.6) + dot(ex + 3.6, ey - 4, 2.3, "#fff") + dot(ex - 3.6, ey + 6, 1, "#fff")
    : el(ex, ey, 10.5, 9.5, "#f4e6b0", stroke(edge, 1.4)) + peer(ex, ey, mood, { r: 6 });
  const move = (cls) => (sig ? `<g class="bd-s-reef-${cls}">${bands(6)}</g>` : zebra);
  const fish =
    out(skirt, lt(b, 0.15), edge, 1.2, `opacity=".92"`) + ln("M16 60l6 4M26 47l4 8M43 40l2 8M60 39v7M74 43l-2 7M17 80l6 -4M33 90l3 -7M50 94v-6M68 92l-2 -7", c, 1.4, `opacity=".7"`) +
    arms +
    skin(mantle, c, move("cloud"), { edge, gloss: [48, 52, 18] }) +
    skin(headD, c, sig ? move("cloud") : dots([[76, 52], [72, 68], [78, 77], [96, 77]], 1.6, "#fff") + ln("M72 58Q76 52 82 51", b, 2.4), { edge, gloss: [84, 51, 10], noShade: true }) +
    wEye + ln(`M${ex - 11} ${ey - 9}Q${ex} ${ey - 15} ${ex + 11} ${ey - 8}`, edge, 2.4) + smile(93, 77, mood, "#2a100c", 3.4) + rosy(81, 76);
  if (!sig) return { body: fish, neck: [76, 85, 12], cap: [83, 43, 0.64], wrap: "bd-bob" };
  return {
    body: posed(k, fish, [76, 85, 12], [83, 43, 0.64], "translate(-5 -6) rotate(10 60 68)", "bd-s-reef-hunt") +
      wrap("bd-s-reef-crab", el(108, 108, 7, 5, "#e8643c", stroke("#8a2a14", 1.2)) + ln("M102 111l-5 4M104 113l-3 5M114 111l5 4M112 113l3 5", "#8a2a14", 1.6) + dots([[104.5, 102], [111.5, 102]], 2.2, "#fff") + dots([[104.5, 102.2], [111.5, 102.2]], 1.2, INK)) +
      wrap("bd-s-reef-twinkle", ln("M30 22q8 -8 16 0t16 0M44 12q8 -8 16 0t16 0M12 108q8 -8 16 0t16 0", "#fff2d8", 2.2)),
    css: anim("cloud", "animation:reefCloud .9s linear infinite", kf("Cloud", "0%{transform:translateX(0)}100%{transform:translateX(24px)}")) +
      anim("hunt", "animation:reefHunt 2.4s ease-in-out infinite", kf("Hunt", "0%,100%{transform:translate(-2px,-2px)}60%{transform:translate(3px,3px)}")) +
      anim("crab", "animation:reefCrab 1.6s ease-in-out infinite", kf("Crab", "0%,100%{transform:translateX(0)}50%{transform:translateX(-2px)}")) + CSS_TWINKLE,
  };
}

function seabunny(k) {
  const { c, a, mood, sig } = k;
  const edge = "#b8a898";
  const body = "M21 98C17 76 35 60 60 60C85 60 103 76 99 98C98 110 82 115 60 115C38 115 22 110 21 98Z";
  const fuzz = [[23, 90], [22, 99], [27, 78], [35, 69], [45, 63], [56, 60], [68, 61], [79, 65], [88, 72], [95, 82], [98, 92], [95, 104], [86, 110], [74, 113], [60, 114], [46, 113], [34, 110], [26, 105]];
  const flecks = [[32, 82], [42, 72], [52, 68], [66, 70], [78, 74], [88, 86], [30, 96], [38, 90], [58, 76], [72, 80], [82, 96], [90, 100], [34, 104], [48, 104], [68, 108], [80, 105], [60, 102], [26, 86], [94, 93], [46, 80], [84, 80], [52, 110], [60, 66], [76, 66]];
  const ear = (stretch = 1) => g(`translate(44 66) scale(1 ${stretch}) translate(-44 -66)`, out("M40 68C30 60 22 40 27 28C32 20 41 24 45 34C49 44 52 58 51 65Z", mix(a, "#ffffff", 0.18), dk(a, 0.3), 1.5) + ln("M31 35l8 -4M32 43l11 -5M35 51l11 -5M39 58l10 -4", a, 3) + dots([[32, 30], [40, 40], [36, 46], [45, 52], [42, 60], [36, 36], [46, 62]], 1.4, "#fff") + dot(33, 27, 2.4, "#fff", `opacity=".6"`));
  const gill = (x, y, s) => g(`translate(${x} ${y}) scale(${s})`, [-62, -32, -2, 28, 58].map((ang) => g(`rotate(${ang})`, out("M-3 0C-8 -9 -5 -17 0 -19C5 -17 8 -9 3 0Z", "#fff", edge, 1) + ln("M0 -2V-15M0 -6l-3 -3M0 -6l3 -3M0 -11l-3 -3M0 -11l3 -3", mix(a, "#ffffff", 0.28), 1.3) + dot(0, -17, 2, a))).join(""));
  const bunny = (ears, eyeMood) =>
    wrap("bd-wag", gill(93, 72, 0.95)) +
    ears +
    fuzz.map(([x, y]) => dot(x, y, 4.6, c, stroke(edge, 1.1))).join("") +
    p(body, c) + clip(body, el(60, 118, 44, 12, "#e4d8cc", `opacity=".8"`) + el(46, 68, 15, 6, "#fff", `opacity=".9"`)) +
    flecks.map(([x, y]) => ln(`M${x} ${y + 2.6}V${y}`, "#c8b8a8", 1.2) + dot(x, y, 1.7, a)).join("") +
    el(60, 91, 24, 15, c, `opacity=".92"`) +
    eye(47, 87, eyeMood, { r: 6.2 }) + eye(73, 87, eyeMood, { r: 6.2 }) + smile(60, 96, mood, "#5a3438", 3.6) + dot(60, 91, 1.8, "#ff8aa0") + rosy(37, 96, 5) + rosy(83, 96, 5);
  const leaf = out("M6 116C30 105 90 105 114 116C92 126 28 126 6 116Z", "#4aa860", "#24683a") + ln("M14 116Q60 112 106 116", "#8ad890", 1.4);
  if (!sig) return { shadow: false, body: leaf + bunny(wrap("bd-wag", ear()) + mirror(wrap("bd-wag", ear())), mood), neck: [60, 102, 22], cap: [60, 61, 0.8] };
  const scent = (d) => ln(d, "#ffe08a", 2.6, `stroke-dasharray="1 7"`);
  return {
    shadow: false,
    body: leaf + posed(k, bunny(wrap("bd-s-reef-earL", ear(1.18)) + mirror(wrap("bd-s-reef-earR", ear(1.18))), mood === "happy" ? "sleepy" : mood), [60, 102, 22], [60, 61, 0.8], "translate(-2 0) rotate(4 60 112)", "bd-s-reef-lean") +
      wrap("bd-s-reef-scent", scent("M119 20C106 14 100 30 90 26S80 22 76 30") + scent("M120 48C110 40 104 52 96 46S90 34 86 36") + scent("M4 12C14 6 18 20 28 16S36 18 40 26") + dots([[108, 12], [102, 38], [14, 24]], 2.4, "#ffd05a")) +
      `<text class="bd-s-reef-twinkle" x="60" y="15" font-size="10" font-family="system-ui" font-weight="800" text-anchor="middle" fill="#fff" stroke="${INK}" stroke-width="2.6" paint-order="stroke">sniff!</text>`,
    css: anim("earL", "transform-origin:46px 66px;animation:reefEarA .7s ease-in-out infinite", kf("EarA", "0%,100%{transform:rotate(-7deg) scale(1,1)}50%{transform:rotate(9deg) scale(1,1.08)}")) +
      anim("earR", "transform-origin:46px 66px;animation:reefEarB .85s ease-in-out infinite", kf("EarB", "0%,100%{transform:rotate(6deg) scale(1,1.06)}50%{transform:rotate(-9deg) scale(1,.96)}")) +
      anim("lean", "transform-origin:60px 112px;animation:reefLean 1.8s ease-in-out infinite", kf("Lean", "0%,100%{transform:scale(1,1)}50%{transform:scale(1.03,.96)}")) +
      anim("scent", "animation:reefScent 1.2s ease-in-out infinite", kf("Scent", "0%,100%{opacity:.3;transform:translateY(-2px)}50%{opacity:1;transform:translateY(3px)}")) + CSS_TWINKLE,
  };
}

function moonjelly(k) {
  const { c, b, a, mood, sig } = k;
  const edge = mix(c, "#2a3a90", 0.45);
  const bell = "M17 63C17 33 37 16 60 16C83 16 103 33 103 63Q96 72 89 65Q82 72 74 66Q67 73 60 67Q53 73 46 66Q38 72 31 65Q24 72 17 63Z";
  const ring = (x, y, ang) => g(`translate(${x} ${y}) rotate(${ang}) scale(.82)`, ln("M-4.6 4.6C-9 0 -6.6 -7.4 0 -7.4C6.6 -7.4 9 0 4.6 4.6", dk(a, 0.12), 5) + ln("M-4.6 4.6C-9 0 -6.6 -7.4 0 -7.4C6.6 -7.4 9 0 4.6 4.6", lt(a, 0.35), 2));
  let fringe = "";
  for (let x = 20; x <= 100; x += 5) fringe += `M${x} 66q${x % 10 ? -3 : 3} 6 0 ${x % 10 ? 10 : 14}`;
  const ribbon = (d) => out(d, lt(b, 0.2), edge, 1.2, `opacity=".85"`);
  const arms = wrap("bd-wag", ribbon("M44 62C36 76 48 84 38 94C32 102 38 110 32 117C44 113 44 104 47 98C54 88 44 82 54 66Z")) + wrap("bd-breathe", ribbon("M53 64C58 80 46 90 54 100C58 108 52 114 54 120C62 114 66 106 61 98C56 88 68 80 64 66Z")) + wrap("bd-wag", ribbon("M68 64C66 78 80 84 74 96C72 104 80 110 88 116C86 108 82 104 83 96C86 84 74 78 77 62Z"));
  const jelly =
    p(bell, b, `opacity=".78"`) + clip(bell, el(60, 74, 46, 24, c, `opacity=".65"`) + el(40, 30, 14, 8, "#fff", `opacity=".85" transform="rotate(-35 40 30)"`) + ln("M60 20Q40 32 28 66M60 20Q52 40 46 68M60 20Q68 40 74 68M60 20Q80 32 92 66", "#fff", 1.2, `opacity=".6"`)) + out(bell, "none", edge, 1.8) +
    ring(60, 24.5, 0) + ring(75, 35.5, 90) + ring(60, 45, 180) + ring(45, 35.5, -90) +
    eye(38, 54, mood, { r: 5.8 }) + eye(82, 54, mood, { r: 5.8 }) + smile(60, 58, mood, "#38306a", 4.4) + rosy(29, 62) + rosy(91, 62);
  if (!sig) return { body: arms + ln(fringe, edge, 1.3) + jelly, neck: [60, 70, 20], cap: [60, 16, 0.66], wrap: "bd-bob" };
  let tight = "";
  for (let x = 32; x <= 88; x += 5) tight += `M${x} 66q${(60 - x) / 12} 12 ${(60 - x) / 6} ${x % 10 ? 18 : 24}`;
  return {
    shadow: false,
    body: wrap("bd-s-reef-pulse", g("translate(0 -1)", g("translate(60 64) scale(.9 1.01) translate(-60 -64)", arms) + ln(tight, edge, 1.4) + g("translate(60 40) scale(.78 1.06) translate(-60 -40)", jelly) + wear(k.stage, [60, 72, 17], [60, 17, 0.62]))) +
      wrap("bd-s-reef-jets", ln("M26 80q-8 12 -4 26M94 80q8 12 4 26M16 72q-12 12 -9 30M104 72q12 12 9 30", "#e8f8ff", 2.6) + bubbles([[24, 114, 3.4], [97, 112, 2.8], [106, 119, 2]])) +
      wrap("bd-s-reef-twinkle", ln("M10 44l9 3M110 44l-9 3M12 26l8 6M108 26l-8 6", "#fff", 2.4)),
    css: anim("pulse", "transform-origin:60px 44px;animation:reefPulse 1.4s cubic-bezier(.4,0,.3,1) infinite", kf("Pulse", "0%,100%{transform:translateY(-3px) scale(1,1)}50%{transform:translateY(6px) scale(1.24,.82)}")) +
      anim("jets", "animation:reefJets 1.4s ease-out infinite", kf("Jets", "0%{opacity:1;transform:translateY(-3px)}60%,80%{opacity:0;transform:translateY(6px)}100%{opacity:1;transform:translateY(-3px)}")) + CSS_TWINKLE,
  };
}

function manta(k) {
  const { c, b, a, mood, sig } = k;
  const edge = "#141a30";
  const wings = "M60 43C46 43 36 46 26 51C16 56 6 56 1 64C10 66 15 71 21 76C31 79 38 86 44 95C50 103 70 103 76 95C82 86 89 79 99 76C105 71 110 66 119 64C114 56 104 56 94 51C84 46 74 43 60 43Z";
  const tail = wrap("bd-wag", ln("M60 48C62 34 74 28 84 12", edge, 4) + ln("M60 48C62 34 74 28 84 12", c, 2.2)) + out("M55 46L62 35L66 47Z", c, edge);
  const horn = (fill, inner) => out("M41 79C33 82 30 92 32 101C34 108 41 108 42 103C39 100 40 96 42 93C45 89 48 87 48 82Z", fill, edge, 1.5) + ln("M39 85C35 90 34.5 96 36.5 101", inner, 2);
  if (!sig) {
    return {
      body: tail +
        skin(wings, c, two(p("M55 50C44 48 32 54 24 64C33 61 40 63 46 66C49 60 52 55 57 55Z", a) + ln("M50 52Q40 53 32 59", "#dfe6f8", 2.4)) + ln("M60 46V64", edge, 2.4, `opacity=".5"`) + two(p("M0 66C14 66 30 74 47 98L38 100 20 82 0 74Z", dk(c, 0.3), `opacity=".5"`)), { edge, gloss: [60, 52, 22], noShade: true, shine: 0.18 }) +
        out("M43 84Q60 118 77 84Q60 96 43 84Z", b, edge, 1.4) + dots([[55, 102], [64, 104]], 1.6, c) +
        (mood === "sad" ? ln("M48 85Q60 77 72 85", edge, 3) : mood === "sleepy" ? ln("M49 82Q60 87 71 82", edge, 3) : out("M42 78Q60 75 78 78Q74 94 60 94Q46 94 42 78Z", "#1c1228", "#dfe6f8", 1.8) + el(60, 89, 9, 4, "#d8607c") + ln("M48 80Q60 83 72 80", "#7a6a90", 1.2)) +
        two(horn(lt(c, 0.16), "#e8eefc") + dot(34, 69, 9, lt(c, 0.08), stroke(edge, 1))) +
        eye(34, 69, mood, { r: 6, ring: "#e8eefc", lid: "#fff" }) + eye(86, 69, mood, { r: 6, ring: "#e8eefc", lid: "#fff" }) + two(rosy(41, 77, 4)),
      neck: [60, 101, 15], cap: [60, 47, 0.85], wrap: "bd-bob",
    };
  }
  // Belly-up mid-somersault: white underside, five pairs of gill slits and unique belly spots.
  const belly = tail +
    skin(wings, b, p("M0 80C10 62 30 50 40 48L22 66 14 78ZM120 80C110 62 90 50 80 48L98 66 106 78Z", c) + dots([[42, 78], [48, 86], [74, 82], [68, 88], [52, 91], [79, 74]], 2.2, "#4a5478") + dots([[55, 84], [64, 93], [37, 70]], 1.4, "#4a5478"), { edge, gloss: [60, 52, 22], noShade: true }) +
    two(ln("M45 55q-5 3 -9 2M47 60q-5 3 -10 2M49 65q-5 3 -10 2M51 70q-5 3 -9 2M53 75q-4 2 -8 2", "#5a6488", 1.8)) +
    out("M44 80Q60 76 76 80Q72 96 60 96Q48 96 44 80Z", "#1c1228", edge, 1.8) + el(60, 90, 8, 4.4, "#d8607c") +
    two(horn(lt(c, 0.25), b)) +
    eye(35, 68, mood, { r: 5.4, ring: "#9fb0d0" }) + eye(85, 68, mood, { r: 5.4, ring: "#9fb0d0" }) + two(rosy(40, 76, 4));
  const loop = (d) => ln(d, "#e8fbff", 3, `stroke-dasharray="8 6"`);
  return {
    shadow: false,
    body: wrap("bd-s-reef-loop", loop("M16 36C28 10 62 0 88 14") + p("M86 7L100 20L81 22Z", "#e8fbff") + loop("M104 108C92 124 56 128 32 114") + p("M35 121L21 107L40 106Z", "#e8fbff")) +
      wrap("bd-s-reef-plankton", dots([[14, 52], [24, 22], [48, 12], [106, 40], [96, 98], [72, 118], [20, 98], [110, 66], [40, 114], [100, 12]], 1.6, "#a8ffc8") + dots([[8, 70], [60, 6], [114, 90], [84, 4]], 1.1, "#fff4a8")) +
      wrap("bd-s-reef-roll", g("translate(60 66) rotate(152) scale(.84) translate(-60 -68)", belly + wear(k.stage, [60, 101, 15], [60, 47, 0.85]))),
    css: anim("roll", "transform-origin:60px 66px;animation:reefRoll 2.8s linear infinite", kf("Roll", "0%{transform:rotate(0)}100%{transform:rotate(-360deg)}")) +
      anim("loop", "animation:reefLoop 1.4s ease-in-out infinite", kf("Loop", "0%,100%{opacity:.4}50%{opacity:1}")) +
      anim("plankton", "animation:reefPlankton 1.8s ease-in-out infinite", kf("Plankton", "0%,100%{opacity:.5;transform:translate(0,0)}50%{opacity:1;transform:translate(2px,-3px)}")),
  };
}

function dumbo(k) {
  const { c, b, a, mood, sig } = k;
  const edge = dk(a, 0.22);
  const mantle = "M29 61C28 36 43 22 60 22C77 22 92 36 91 61C92 77 80 86 60 86C40 86 28 77 29 61Z";
  const earD = "M35 40C22 24 4 28 3 43C3 55 18 59 33 56C37 51 38 45 35 40Z";
  const ear = out(earD, c, edge, 1.6) + p("M31 43C22 32 10 34 9 43C10 51 20 52 30 51Z", b, `opacity=".9"`) + ln("M30 46Q20 38 12 41M30 49Q22 46 13 48", a, 1.2);
  const web = "M33 70C27 86 18 98 11 108Q20 104 23 114Q33 102 39 115Q47 103 52 117Q60 105 68 117Q73 103 81 115Q87 102 97 114Q100 104 109 108C102 98 93 86 87 70Z";
  const skirt = (d, ribs) => p(d, c, `opacity=".95"`) + clip(d, el(60, 120, 56, 20, b, `opacity=".75"`) + ln(ribs, a, 1.8, `opacity=".75"`)) + out(d, "none", edge, 1.6);
  const openRibs = "M42 76Q30 92 23 114M50 80Q42 96 39 115M60 82Q56 100 52 117M70 80Q76 96 68 117M78 76Q88 92 81 115M36 74Q22 92 11 108M84 74Q98 92 109 108";
  const shutRibs = "M44 76Q38 92 35 112M52 80Q48 98 46 114M60 82V115M68 80Q72 98 65 115M76 76Q82 92 74 114";
  const head = skin(mantle, c, el(60, 88, 34, 16, b, `opacity=".65"`) + dots([[44, 36], [74, 32], [80, 44], [38, 48], [62, 28]], 1.8, a), { edge, gloss: [48, 32, 14], noShade: true, shine: 0.35 });
  const face = eye(45, 60, mood, { r: 8 }) + eye(75, 60, mood, { r: 8 }) + (mood === "happy" ? el(60, 73, 3.2, 3.6, "#8a2440") : smile(60, 72, mood, "#6a1830", 4)) + two(rosy(39, 73, 5.4));
  const flapEar = `<g class="bd-wag">${ear}</g>`;
  if (!sig) return { body: wrap("bd-breathe", skirt(web, openRibs)) + two(flapEar) + head + face, neck: [60, 82, 22], cap: [60, 25, 0.95], wrap: "bd-bob" };
  const upEar = wrap("bd-s-reef-ear", g("translate(36 48) rotate(24) scale(1.18) translate(-36 -48)", ear));
  const trail = "M36 70C34 84 30 96 25 106Q33 102 35 112Q42 102 46 114Q52 103 55 115Q60 105 65 115Q68 103 74 114Q78 102 85 112Q87 102 95 106C90 96 86 84 84 70Z";
  return {
    shadow: false,
    body: wrap("bd-s-reef-soar", g("translate(0 -3)", wrap("bd-s-reef-skirt", skirt(trail, shutRibs)) + two(upEar) + head + face + wear(k.stage, [60, 82, 22], [60, 25, 0.95]))) +
      wrap("bd-s-reef-rise", bubbles([[24, 116, 3.4], [94, 118, 2.8], [106, 104, 2]])) +
      wrap("bd-s-reef-twinkle", ln("M5 62q6 8 16 8M2 74q8 10 20 10M115 62q-6 8 -16 8M118 74q-8 10 -20 10", "#e8f4ff", 2.4)),
    css: anim("ear", "transform-origin:36px 50px;animation:reefEarFlap .6s ease-in-out infinite", kf("EarFlap", "0%,100%{transform:rotate(14deg)}50%{transform:rotate(-34deg)}")) +
      anim("soar", "animation:reefSoar .6s ease-in-out infinite", kf("Soar", "0%,100%{transform:translateY(3px)}50%{transform:translateY(-5px)}")) +
      anim("skirt", "transform-origin:60px 74px;animation:reefSkirt .6s ease-in-out infinite", kf("Skirt", "0%,100%{transform:scale(1.08,.96)}50%{transform:scale(.9,1.04)}")) + CSS_RISE + CSS_TWINKLE,
  };
}

const DRAW = { comet, blackmoor, oranda, ranchu, bubbleeye, kohaku, tancho, moonkoi, halfmoon, crowntail, galaxybetta, neon, discus, angelfish, archer, clown, snowclown, bluetang, mandarin, seahorse, puffer, boxfish, lionfish, seadragon, octopus, cuttle, seabunny, moonjelly, manta, dumbo };
const SIGNATURES = new Set(["comet", "kohaku", "halfmoon", "galaxybetta", "neon", "discus", "archer", "clown", "snowclown", "bluetang", "mandarin", "seahorse", "puffer", "lionfish", "seadragon", "octopus", "cuttle", "seabunny", "moonjelly", "manta", "dumbo"]);

export default function art({ id, name, tier, c, b, a, stage = 1, mood = "happy", size = 0, act = "" }) {
  const key = String(id).replace(/^reef_/, "");
  const draw = DRAW[key] || comet;
  const sig = act === "signature" && SIGNATURES.has(key);
  const rig = draw({ c, b, a, mood, stage, sig });
  // A signature rig without neck/cap has already dressed itself inside its moving group.
  return frame({ name, size, tier, accent: a, stage, body: rig.body, neck: rig.neck || null, cap: rig.cap || null, css: sig ? rig.css : "", wrapClass: rig.wrap, shadow: rig.shadow });
}
