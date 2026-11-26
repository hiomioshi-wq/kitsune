// Dawn Aviary SVG art: 48 hand-marked birds on two chibi rigs (front-facing and side profile),
// each with its own field marks, plus signature behaviour animations (act = "signature").
export const BIRD_FAMILIES = new Set(["bsmall", "bduck", "bowl", "bbill", "bparrot", "blong", "bfan", "braptor"]);

const INK = "#1b1d33";
const el = (cx, cy, rx, ry, fill, x = "") => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" ${x}/>`;
const dot = (cx, cy, r, fill, x = "") => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" ${x}/>`;
const p = (d, fill, x = "") => `<path d="${d}" fill="${fill}" ${x}/>`;
const ln = (d, col, w = 2, x = "") => `<path d="${d}" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" fill="none" ${x}/>`;
const dots = (list, r, fill) => list.map(([x, y]) => dot(x, y, r, fill)).join("");
// Draw a left-side part and its mirror image on the right.
const both = (svg) => `${svg}<g transform="matrix(-1 0 0 1 120 0)">${svg}</g>`;
const wrap = (cls, svg) => `<g class="${cls}">${svg}</g>`;

// ---------- eyes ----------
function eye(x, y, mood, o = {}) {
  if (mood === "sleepy") return ln(`M${x - 5} ${y}q5 4.5 10 0`, o.lid || INK, 2.4);
  if (mood === "love") return p(`M${x} ${y + 5}l-5.5 -5.5a3.2 3.2 0 0 1 5.5 -3.2a3.2 3.2 0 0 1 5.5 3.2Z`, "#ff3d5e", `stroke="#fff" stroke-width="1"`);
  const r = o.r || 4.6;
  const ring = o.ring ? dot(x, y, r + 2.2, o.ring) : "";
  const iris = o.iris ? dot(x, y, r, o.iris) + dot(x, y, r * 0.6, "#14131f") : dot(x, y, r, o.dark || "#14131f", `stroke="#ffffff" stroke-width="${o.rim ?? 0.7}"`);
  const brow = mood === "sad" ? ln(`M${x - 5} ${y - 7}L${x + 4} ${y - 9.5}`, o.lid || INK, 2, x > 60 ? `transform="matrix(-1 0 0 1 ${2 * x} 0)"` : "") : "";
  return `${ring}${iris}${dot(x + r * 0.34, y - r * 0.36, r * 0.34, "#fff")}${dot(x - r * 0.3, y + r * 0.36, r * 0.16, "#fff")}${brow}`;
}

// ---------- front-facing bills (centred on x = 60) ----------
const bill = {
  cone: (c, c2 = c) => p("M52.5 53Q60 49.5 67.5 53L60 63.5Z", c, `stroke="#0004" stroke-width="1"`) + p("M55.5 57.5L64.5 57.5L60 63.5Z", c2),
  tiny: (c) => p("M55 54Q60 51 65 54L60 60.5Z", c, `stroke="#0004" stroke-width="1"`),
  point: (c, c2 = c) => p("M54.5 53Q60 50.5 65.5 53L60 68Z", c, `stroke="#0004" stroke-width="1"`) + p("M57 60L63 60L60 68Z", c2),
  hook: (top, low = top, s = 1) => `<g transform="translate(60 57) scale(${s}) translate(-60 -57)">${p("M53.5 59Q54 71 60 71Q66 71 66.5 59Z", low, `stroke="#0005" stroke-width="1"`)}${p("M49.5 53Q60 44 70.5 53Q71 63 62 68Q63.5 60.5 57 60.5Q50 59.5 49.5 53Z", top, `stroke="#0005" stroke-width="1"`)}${ln("M54 52q5 -3.5 11 -1", "#ffffff66", 1.4)}</g>`,
  raptor: (c, cere, tip = "#2a2a32") => p("M51 53Q60 47 69 53Q70 63 61 69Q60.5 62 54.5 60.5Q51.5 58 51 53Z", c, `stroke="#0005" stroke-width="1"`) + p("M51 53Q60 47 69 53Q60 56.5 51 53Z", cere) + p("M63.5 65.5Q62 68 61 69Q60.8 66.5 60 64.5Z", tip) + dots([[56.5, 52.4], [63.5, 52.4]], 0.9, "#0006"),
};

// ---------- stage cosmetics ----------
const scarf = (x, y, w) => `${p(`M${x - w} ${y - 4}Q${x} ${y + 7} ${x + w} ${y - 4}L${x + w + 1.5} ${y + 2.5}Q${x} ${y + 15} ${x - w - 1.5} ${y + 2.5}Z`, "#d3312f")}${p(`M${x + w * 0.42} ${y + 5}l7 15l-7.5 -1.5l-5.5 -11Z`, "#b52228")}${ln(`M${x - w * 0.6} ${y + 2}v4M${x - w * 0.1} ${y + 4}v4M${x + w * 0.4} ${y + 3}v4`, "#fff", 1.8)}`;
const hat = (x, y, k = 1) => `<g transform="translate(${x} ${y}) scale(${k})">${p("M-17 4Q-8 -22 13 -17Q21 -13 22 3Q2 -7 -17 4Z", "#d3312f")}${ln("M-19 5Q1 -6 24 4", "#fff", 5.5)}${dot(22, -15, 4.8, "#fff")}</g>`;

// ---------- shared pieces ----------
const feet = (col, y = 108) => both(`${ln(`M50 ${y}V${y + 7}M50 ${y + 7}l-7 2.5M50 ${y + 7}l0 3.5M50 ${y + 7}l6 2.5`, col, 2.6)}`);
const talons = (col) => both(`${ln("M49 105v8M49 113l-8 3M49 113l-1 4.5M49 113l7 3.5", col, 4)}${ln("M41 116l-1 2.5M48 117.5v2M56 116.5l1.5 2", "#23232a", 2)}`);
const tails = {
  short: (c, a) => p("M48 102L44 117Q52 113 55 118Q60 112 65 118Q68 113 76 117L72 102Z", c) + ln("M52 108l-2 6M68 108l2 6", a, 1.4),
  long: (c, a) => p("M68 98Q92 108 112 104Q116 112 106 113Q86 119 62 108Z", c) + ln("M76 104Q92 111 108 108", a, 2),
  fork: (c, a) => p("M50 100L36 119L52 112L60 116L68 112L84 119L70 100Z", c) + ln("M48 108l-6 7M72 108l6 7", a, 1.4),
};
const frontWing = (fill, extra = "") => `${p("M36.5 68C22 76 21 100 35 108C46 100 47 80 36.5 68Z", fill, `stroke="#0003" stroke-width="1"`)}${extra}`;

/**
 * Front rig. d describes one species:
 * body, belly, wing, head colours; feet; tail; back (behind body); chest, wingMarks (left side, mirrored);
 * crown (behind head), face (on head, under eyes), eyes, bill, top (over everything).
 */
function front(d, mood) {
  const hr = d.hr || 26;
  const hrx = d.hrx || hr;
  const wingSvg = d.noWing ? "" : both(wrap("bd-wing", frontWing(d.wing, d.wingMarks || "")));
  const head = `${d.crown || ""}${el(60, 46, hrx, hr, d.head || d.body)}${d.face || ""}${eye(d.ex || 48.5, d.ey || 45, mood, d.eyes)}${eye(120 - (d.ex || 48.5), d.ey || 45, mood, d.eyes)}${d.over || ""}${d.bill || ""}${d.blush === false ? "" : both(el(40, 55.5, 4, 2.5, "#ff7f9c", `opacity=".45"`))}`;
  return {
    back: `${d.back || ""}${d.tail || ""}`,
    body: `${d.feet || ""}${el(60, 86, d.brx || 27, 27, d.body)}${el(60, 92, 17.5, 19, d.belly)}${d.chest || ""}${wingSvg}`,
    head: wrap(d.headClass || "bd-head", head),
    top: d.top || "",
    neck: [60, 70, 20],
    cap: [60, 46 - hr + 5, 1],
  };
}

/**
 * Side rig, facing right. Adds: neck (svg), at [x, y] head centre, r head radius, legs.
 */
function side(d, mood) {
  const [hx, hy] = d.at || [70, 48];
  const r = d.r || 19;
  const body = d.bodyPath || p("M24 82C26 64 52 60 70 68C86 74 86 98 66 105C46 112 24 102 24 82Z", d.body);
  const wing = d.noWing ? "" : wrap("bd-wing", p(d.wingPath || "M30 76C44 66 66 68 74 82C62 98 40 98 20 90C24 86 26 80 30 76Z", d.wing, `stroke="#0003" stroke-width="1"`) + (d.wingMarks || ""));
  const head = `${d.crown || ""}${el(hx, hy, r, r, d.head || d.body)}${d.face || ""}${eye(d.ex ?? hx + 4, d.ey ?? hy - 3, mood, d.eyes)}${d.over || ""}${d.bill || ""}${d.blush === false ? "" : el(hx - 2, hy + 8, 3.6, 2.3, "#ff7f9c", `opacity=".45"`)}`;
  return {
    back: `${d.back || ""}${d.tail || ""}`,
    body: `${d.legs || ""}${body}${d.belly === false ? "" : p(d.bellyPath || "M40 96C52 84 74 82 80 88C80 100 66 106 54 106C46 105 42 101 40 96Z", d.belly)}${d.chest || ""}${wing}${d.neck || ""}`,
    head: wrap(d.headClass || "bd-head", head),
    top: d.top || "",
    neck: d.scarfAt || [hx - 3, hy + r - 3, r * 0.75],
    cap: [hx, hy - r + 4, r / 25],
  };
}

const sideLegs = (col, x1 = 48, x2 = 62, y = 102, w = 2.8) => ln(`M${x1} ${y}V115M${x1} 115l-5 3M${x1} 115l8 2M${x2} ${y}V115M${x2} 115l-5 3M${x2} 115l8 2`, col, w);
const sideTail = (c, d = "M30 84L6 100L12 106L16 102L20 108L40 96Z") => p(d, c);

// ---------- peacock-style fans ----------
function fan(base, rim, eyeA, eyeB, big) {
  const feathers = [-84, -63, -42, -21, 0, 21, 42, 63, 84].map((ang) => `<g transform="rotate(${ang} 60 90)">${p("M60 92C46 66 45 34 60 14C75 34 74 66 60 92Z", base, `stroke="${rim}" stroke-width="1.4"`)}${ln("M60 86V34", rim, 1)}${el(60, 29, 7.5, 9, eyeA)}${el(60, 30, 4.8, 6, eyeB)}${el(60, 31.5, 2.4, 3, "#17134a")}</g>`).join("");
  const inner = [-72, -48, -24, 0, 24, 48, 72].map((ang) => `<g transform="rotate(${ang} 60 90)">${el(60, 52, 4.4, 5.6, eyeA)}${el(60, 52.6, 2.6, 3.4, eyeB)}${dot(60, 53.2, 1.3, "#17134a")}</g>`).join("");
  return `<g class="${big ? "bd-s-fan" : "bd-fan"}"><g transform="translate(60 92) scale(${big ? 1 : 0.8}) translate(-60 -92)">${feathers}${inner}</g></g>`;
}
const peaCrest = (stalk, tip) => ln("M53 24L48 8M60 22V4M67 24L72 8", stalk, 1.6) + dots([[48, 7], [60, 3.5], [72, 7]], 3, tip);

// ---------- species ----------
// Each entry returns a rig. `sig` is true while the signature behaviour plays; `a` is the species palette.
const ART = {
  sparrow: (k, m) => front({ body: k.c, belly: k.b, wing: "#8a5a34", head: "#c9b8a2", feet: feet("#c88868"), tail: tails.short("#6e4a2e", "#c9a878"),
    wingMarks: ln("M27 84l11 -3", "#fff", 3) + ln("M28 91l10 6M32 89l9 5", "#2e1c10", 2.4),
    face: p("M36 40Q60 14 84 40Q72 31 60 31Q48 31 36 40Z", "#82868e") + both(p("M35 40Q42 30 50 31Q42 40 40 54Q35 49 35 40Z", "#7a3c20")) + both(el(41, 52, 7, 6.5, "#e8e4dc")) + p("M52 56Q60 52 68 56Q72 68 66 76Q60 82 54 76Q48 68 52 56Z", "#1f1a1a"),
    bill: bill.cone("#3a3034") }, m),

  bluetit: (k, m, sig) => front({ body: k.c, belly: k.b, wing: k.a, head: "#fbfbf4", feet: feet("#6a7a9a"), tail: tails.short(k.a, "#9fc0f0"),
    chest: ln("M60 82v20", "#2a3050", 3),
    wingMarks: ln("M26 83l13 -4", "#fff", 2.8),
    face: p("M42 28Q60 16 78 28Q70 36 60 34Q50 36 42 28Z", "#2f7fe0") + ln("M34 46Q46 40 58 50M86 46Q74 40 62 50", "#1c2c60", 4.6) + ln("M36 54Q46 72 60 70Q74 72 84 54", "#1c2c60", 3.4) + p("M55 61L65 61L60 70Z", "#1c2c60"),
    eyes: { r: 4 }, bill: bill.tiny("#3a3a48"), top: sig ? ln("M16 119Q60 113 108 118", "#7a5230", 4) : "" }, m),

  goldfinch: (k, m) => front({ body: k.c, belly: k.b, wing: "#18181e", head: "#fbf6ea", feet: feet("#c89878"), tail: tails.fork("#18181e", "#fff"),
    wingMarks: p("M25 88Q32 82 41 80L42 89Q34 92 28 99Z", k.a) + dots([[33, 103], [38, 99]], 1.6, "#fff"),
    chest: both(el(46, 84, 7, 11, k.c, `opacity=".75"`)),
    face: p("M37 32Q60 10 83 32Q74 27 66 28L60 24L54 28Q46 27 37 32Z", "#16141a") + both(ln("M37 31Q32 46 38 60", "#16141a", 6)) + p("M42 38Q60 24 78 38Q82 52 72 62Q60 70 48 62Q38 52 42 38Z", "#d81e28") + ln("M45 46L56 53M75 46L64 53", "#16141a", 3.4),
    eyes: { r: 4.2, rim: 1.1 }, bill: bill.point("#f6e0c0", "#5a4a44") }, m),

  cardinal: (k, m) => front({ body: k.c, belly: k.b, wing: "#a81c2e", feet: feet("#a86858"), tail: tails.long("#a81c2e", "#7a1020"),
    wingMarks: ln("M28 90l8 8M32 85l8 7", "#7a1020", 2),
    crown: wrap("bd-crest", p("M40 34Q44 8 76 2Q68 14 78 30Q60 20 40 34Z", k.c, `stroke="#a81c2e" stroke-width="1.4"`)),
    face: p("M40 46Q46 36 55 44Q60 40 65 44Q74 36 80 46Q78 62 68 68Q60 76 52 68Q42 62 40 46Z", "#17141a"),
    eyes: { r: 4, rim: 1.2 }, bill: bill.cone("#ff7a2e", "#e04e22"), blush: false }, m),

  bluejay: (k, m) => front({ body: k.c, belly: k.b, wing: "#3a6ec8", feet: feet("#3a3a44"), tail: tails.long("#3a6ec8", "#10182e") + ln("M86 106l-2 9M96 107v9M106 106l2 7", "#10182e", 2),
    wingMarks: ln("M26 86l13 -3M27 93l12 -2M30 100l9 -1", "#101830", 2) + dots([[31, 82], [36, 89]], 2, "#fff"),
    crown: wrap("bd-crest", p("M38 36Q42 8 78 3Q72 16 80 32Q60 22 38 36Z", k.c, `stroke="#2a4e98" stroke-width="1.4"`) + ln("M52 24Q60 14 70 9", "#2a4e98", 1.6)),
    face: p("M37 48Q40 36 52 38Q60 46 68 38Q80 36 83 48Q80 66 60 70Q40 66 37 48Z", "#f6f8fc") + ln("M34 38Q36 66 48 70Q60 80 72 70Q84 66 86 38", "#12162a", 3.6) + ln("M40 40L55 47M80 40L65 47", "#12162a", 2.4),
    eyes: { r: 4 }, bill: bill.cone("#20222e") }, m),

  pigeon: (k, m) => front({ body: k.c, belly: k.b, wing: "#a8b0c2", head: "#6e7890", feet: feet("#e8546a"), tail: tails.short("#6a7288", "#23262e"),
    wingMarks: ln("M26 90l14 -6M29 99l11 -5", "#22252e", 3.4),
    chest: p("M39 70Q60 62 81 70Q74 86 60 85Q46 86 39 70Z", k.a, `opacity=".92"`) + p("M44 76Q60 70 76 76Q68 88 60 87Q52 88 44 76Z", "#8a4ab0", `opacity=".75"`),
    over: el(56.5, 52, 4.5, 3, "#f4f4f8") + el(63.5, 52, 4.5, 3, "#f4f4f8"),
    eyes: { iris: "#f28a1e", r: 4.6 }, bill: bill.tiny("#33343e") }, m),

  chickadee: (k, m) => front({ body: k.c, belly: k.b, wing: "#747a86", head: "#fbf8f0", feet: feet("#4a5064"), tail: tails.long("#747a86", "#fff"),
    wingMarks: ln("M27 88l11 -3M29 95l10 -2", "#e8ecf2", 1.8),
    chest: both(el(45, 94, 8, 11, "#e8b888", `opacity=".8"`)),
    face: p("M34 46Q34 20 60 20Q86 20 86 46Q74 40 66 47L60 44L54 47Q46 40 34 46Z", "#15151b") + p("M52 57Q60 54 68 57Q74 66 66 70Q60 74 54 70Q46 66 52 57Z", "#15151b"),
    eyes: { r: 4, rim: 1.3 }, bill: bill.tiny("#2a2a32") }, m),

  budgie: (k, m) => front({ body: k.c, belly: k.b, wing: "#f2e452", head: "#ffe94e", hr: 27, feet: feet("#c88aa0"), tail: tails.long(k.a, "#123a7a"),
    wingMarks: ln("M27 82q6 -2 11 -1M25 88q8 -1 15 -2M26 94q7 0 13 -3M29 100q5 0 9 -3", "#202018", 2.4),
    face: ln("M40 26q6 3 10 0M55 23q5 3 10 0M70 26q5 3 10 0M36 33q5 2 8 0M76 33q5 2 8 0", "#202018", 1.8) + both(el(40, 61, 4.6, 6, "#4a52d8", `transform="rotate(24 40 61)"`)) + dots([[48, 68], [55, 71], [65, 71], [72, 68]], 2.2, "#15151b"),
    eyes: { iris: "#e8e8f0", r: 4.6 }, over: p("M51 51Q60 44 69 51Q60 56 51 51Z", "#4a8ae8") + dots([[56.5, 50], [63.5, 50]], 1, "#1f3a6a"),
    bill: p("M54 54Q60 52 66 54Q66 64 60 66Q54 64 54 54Z", "#f2b830", `stroke="#0004"`), blush: false }, m),

  cockatiel: (k, m) => front({ body: k.c, belly: k.b, wing: "#6a6e7a", head: "#fbe45a", hr: 26, feet: feet("#b89898"), tail: tails.long("#6a6e7a", "#c8ccd4"),
    wingMarks: p("M25 86Q31 80 38 78Q42 90 36 98Q28 96 25 86Z", "#fbfbf6"),
    crown: wrap("bd-crest", p("M52 26Q46 6 70 0Q58 10 66 14Q74 6 82 8Q68 14 68 26Z", "#fbe45a", `stroke="#d8b82a" stroke-width="1.2"`) + ln("M58 22Q56 10 66 4", "#d8b82a", 1.2)),
    face: both(dot(39, 55, 7.5, "#ff8a2a")), bill: bill.hook("#b8aab0", "#8a808a", 0.82), blush: false }, m),

  zebrafinch: (k, m) => front({ body: k.c, belly: k.b, wing: "#8a7e76", head: "#a8acb8", feet: feet("#f2873a"), tail: tails.short("#1b1b20", "#fff") + ln("M50 108h20M49 113h22", "#fff", 2.4),
    chest: ln("M46 74h28M45 78h30", "#17171c", 1.8) + p("M44 79Q60 87 76 79L74 84Q60 92 46 84Z", "#17171c") + both(el(41, 94, 6.5, 12, "#c8642e") + dots([[39, 88], [42, 95], [39, 101]], 1.4, "#fff")),
    face: both(el(40, 55, 7, 6.5, k.a)) + ln("M47 51L50 64M73 51L70 64", "#fff", 3.4) + ln("M50.5 52L53 64M69.5 52L67 64", "#17171c", 2),
    bill: bill.cone("#f2442a", "#d83020"), blush: false }, m),

  canary: (k, m) => front({ body: k.c, belly: k.b, wing: "#f2c41e", feet: feet("#e89880"), tail: tails.fork("#f2c41e", k.a),
    wingMarks: ln("M27 88l9 8M31 83l9 8", k.a, 2),
    face: el(60, 32, 14, 6, "#fff0a0", `opacity=".8"`), bill: bill.cone("#f6a890") }, m),

  speckledstarling: (k, m) => front({ body: k.c, belly: k.b, wing: "#24242e", feet: feet("#c8705a"), tail: tails.short("#20202a", "#a87a50"),
    wingMarks: ln("M27 90l9 9M32 84l8 8", "#a87a50", 1.4),
    chest: el(52, 80, 12, 9, "#2a7a5a", `opacity=".5"`) + el(70, 84, 10, 11, "#6a3a9a", `opacity=".55"`) + dots([[46, 86], [54, 94], [66, 92], [74, 84], [60, 102], [50, 104], [70, 102], [60, 80], [44, 96], [76, 96], [56, 108], [66, 110]], 1.5, "#f4ecd0"),
    face: el(52, 32, 12, 7, "#6a3a9a", `opacity=".55"`) + el(72, 58, 8, 7, "#2a7a5a", `opacity=".6"`) + dots([[44, 30], [56, 25], [70, 29], [80, 42], [40, 42], [66, 68], [52, 68]], 1.1, "#f4ecd0"),
    eyes: { rim: 1.2 }, bill: bill.point(k.a, "#c89820") }, m),

  chaffinch: (k, m) => front({ body: k.c, belly: k.b, wing: "#2a2422", head: "#d8846a", feet: feet("#b88878"), tail: tails.fork("#3a3434", "#fff"),
    wingMarks: ln("M27 83l12 -5", "#fff", 4.4) + ln("M26 93l13 -4", "#fbf6e0", 2.6),
    face: p("M35 38Q38 19 60 19Q82 19 85 38Q74 30 67 34L60 37L53 34Q46 30 35 38Z", k.a) + p("M54 34Q60 30 66 34L63 38L57 38Z", "#17141a"),
    bill: bill.cone("#8a98b0", "#5a6478") }, m),

  barnowl: (k, m, sig) => front({ body: k.c, belly: k.b, wing: "#cf9a56", hr: 28, hrx: 29, brx: 25, feet: talons("#e8d8c0"), tail: tails.short(k.c, "#8a6a3a"),
    wingMarks: dots([[30, 80], [35, 87], [28, 90], [33, 97], [38, 77], [38, 100]], 1.7, k.a) + dots([[31, 81.5], [36, 88.5], [29, 91.5], [34, 98.5]], 0.8, "#fff"),
    chest: dots([[50, 84], [70, 86], [56, 96], [66, 100], [48, 98], [60, 78]], 0.9, "#a8844e"),
    face: p("M60 31C70 17 90 28 85 48C81 66 68 72 60 75C52 72 39 66 35 48C30 28 50 17 60 31Z", "#fffaf0", `stroke="#a86a30" stroke-width="2.8"`) + ln("M60 34V50", "#e8cfa8", 2) + both(el(48, 46, 8, 7.5, "#f2e0c4", `opacity=".7"`)),
    eyes: { r: 5.2, rim: 0 }, bill: p("M56.5 52Q60 49 63.5 52Q63 61 60 66Q57 61 56.5 52Z", "#ecd2b4", `stroke="#a8805a" stroke-width="1"`), blush: false,
    headClass: sig ? "bd-s-swivel" : "bd-head" }, m),

  kookaburra: (k, m, sig) => side({ body: k.c, belly: k.b, wing: "#533a28", head: k.b, at: [68, 48], r: 22, legs: sideLegs("#a89878"),
    tail: sideTail("#b85a30", "M32 84L4 104L14 110L40 96Z") + ln("M14 100l6 6M21 95l6 6M28 91l6 6", "#2a1a12", 2),
    wingMarks: dots([[44, 78], [50, 82], [56, 79], [61, 84], [52, 74]], 2.4, k.a),
    face: p("M52 36Q64 24 80 30Q68 30 60 37Z", "#7a5c44") + p("M48 48Q60 40 74 42Q88 42 89 47Q74 50 66 48Q56 52 50 56Z", "#4a3224", `opacity=".9"`),
    ex: 74, ey: 44, eyes: { rim: 1 },
    bill: `${sig ? wrap("bd-s-jaw", p("M82 56L108 58Q96 66 82 62Z", "#e8d0a0", `stroke="#0004"`)) : p("M82 55L112 53Q100 64 82 62Z", "#e8d0a0", `stroke="#0004"`)}${p("M81 45Q100 43 114 53L113 56Q100 53 82 56Z", "#33302e", `stroke="#0004"`)}`,
    top: sig ? `<g class="bd-s-pop" font-family="system-ui" font-weight="800" fill="#ffd84d" stroke="#2a1a10" stroke-width="2.6" paint-order="stroke"><text x="86" y="30" font-size="12">HA</text><text x="96" y="18" font-size="10">HA</text><text x="72" y="16" font-size="8">HA</text></g>` : "" }, m),

  lovebird: (k, m) => front({ body: k.c, belly: k.b, wing: "#369a3e", hr: 28, feet: feet("#a8a0a0"), tail: tails.short("#369a3e", "#e8684a") + p("M52 101h16l-2 6h-12Z", "#2a8ae0"),
    wingMarks: ln("M29 92l8 8M33 87l7 7", "#1f6a2a", 2),
    face: p("M36 42Q36 22 60 20Q84 22 84 42Q86 64 74 70Q60 78 46 70Q34 64 36 42Z", k.a) + p("M40 33Q45 21 60 20Q75 21 80 33Q70 38 60 35Q50 38 40 33Z", "#e83a3a"),
    eyes: { ring: "#f8ece0", r: 4.4 }, bill: bill.hook("#fbeed2", "#e8d0a8", 0.95), blush: false }, m),

  hummingbird: (k, m, sig) => {
    const blur = (d, o) => p(d, "#d8e8f0", `opacity="${o}" stroke="#8aa8b8" stroke-width=".8"`);
    return side({ body: k.c, belly: k.b, wing: "#3a5a48", head: k.c, at: [66, 52], r: 18, legs: ln("M52 100l-2 6M60 100l1 6", "#2a2a2a", 2),
      back: wrap(sig ? "bd-s-wingblur" : "bd-wingblur", blur("M46 76C20 52 14 24 22 14C38 24 52 50 56 74Z", 0.5) + blur("M52 74C40 44 46 18 58 10C66 28 66 54 62 76Z", 0.35) + blur("M40 80C16 70 4 50 6 40C24 46 40 62 50 76Z", 0.28)),
      tail: p("M32 86L8 108L22 104L20 118L40 96Z", "#1f2a24"),
      bodyPath: p("M28 90C30 68 54 60 70 66C82 78 76 96 60 101C46 106 32 102 28 90Z", k.c),
      bellyPath: "M46 98C56 84 70 76 76 76C78 90 68 99 56 101Z",
      noWing: true,
      face: p("M52 60Q66 56 84 56Q84 68 70 72Q56 72 52 60Z", k.a, `stroke="#8a0a22" stroke-width="1"`) + ln("M58 63l4 3M66 62l4 4M74 61l3 3", "#ff6a7e", 1.4) + ln("M52 55Q64 50 74 52", "#16261c", 3),
      ex: 70, ey: 47, eyes: { r: 4, rim: 1 },
      bill: ln("M82 51L117 46", "#17171c", 2.8), scarfAt: [62, 68, 13],
      top: sig ? dot(113, 62, 3, "#ff6a9a") + ln("M16 66h12M10 76h14M18 56h9", "#cfe8ff", 2) : "" }, m);
  },

  kingfisher: (k, m, sig) => side({ body: k.c, belly: k.b, wing: "#0e6a9a", at: [66, 52], r: 22, legs: sideLegs("#f2442a", 50, 62, 100, 3),
    tail: sideTail("#0e6a9a", "M30 88L10 104L18 110L40 100Z"),
    bellyPath: "M38 96C48 80 72 78 82 76C86 94 70 106 56 106C48 105 42 102 38 96Z",
    wingMarks: dots([[42, 80], [48, 76], [54, 82], [60, 78], [50, 88], [64, 86]], 1.7, k.a) + ln("M30 84Q46 70 62 72", k.a, 3),
    face: dots([[54, 36], [62, 33], [70, 34], [58, 41]], 1.5, k.a) + p("M56 54Q70 46 84 52Q76 60 64 60Q58 60 56 54Z", k.b) + p("M46 56Q52 50 56 56Q54 66 48 66Q44 62 46 56Z", "#fff") + p("M56 63Q70 58 84 60Q76 72 64 70Z", "#fff") + ln("M62 62Q56 68 50 72", "#38e0ee", 3),
    ex: 74, ey: 45, eyes: { r: 4.4, rim: 1 },
    bill: p("M84 46L119 55L85 59Z", "#17171c") + ln("M86 55L110 56", "#e0603a", 1.2),
    top: sig ? `<g class="bd-s-splash">${ln("M62 112q-10 -14 -20 -6M80 112q10 -16 22 -6M71 110v-14", "#9fe4ff", 3)}${el(70, 116, 36, 5, "none", `stroke="#7fd8ff" stroke-width="2"`)}${dots([[36, 98], [108, 96], [74, 90]], 2.4, "#bff0ff")}</g>` : "" }, m),

  woodpecker: (k, m, sig) => side({ body: k.c, belly: false, wing: "#17171c", at: [64, 46], r: 18, legs: sideLegs("#6a6a74"),
    tail: sideTail(k.c, "M34 92L16 119L24 118L30 111L34 116L50 102Z"),
    wingMarks: ln("M40 87Q52 90 64 83", "#fff", 3.4),
    neck: p("M52 54Q62 66 74 60L72 78Q60 82 50 72Z", k.c) + ln("M58 58Q58 72 46 78", k.b, 4),
    crown: wrap("bd-crest", p("M46 38Q42 12 62 6Q80 6 82 36Q66 28 46 38Z", k.a, `stroke="#8a0a12" stroke-width="1.2"`)),
    face: ln("M66 40Q56 38 48 44", k.b, 2.6) + ln("M80 50Q66 50 56 56Q50 58 48 60", k.b, 3.6) + ln("M80 56Q72 58 66 62", k.a, 4),
    ex: 71, ey: 43, eyes: { iris: "#f6d03a", r: 4.2 },
    bill: p("M80 44L108 50L80 56Z", "#9aa0ac", `stroke="#0005"`) + ln("M82 50h20", "#5a606c", 1),
    scarfAt: [62, 66, 12],
    top: sig ? p("M108 8Q120 40 114 76Q120 100 112 120H120V8Z", "#8a5a32", `stroke="#4a2c14" stroke-width="2"`) + `<g class="bd-s-pop">${ln("M104 36l-6 -6M106 62l-8 4M102 26l-2 -8", "#ffd84d", 2.6)}</g>` : "",
    headClass: sig ? "bd-s-drum" : "bd-head" }, m),

  mallard: (k, m) => side({ body: k.c, belly: "#d8d8d4", wing: "#8a8478", head: k.a, at: [76, 48], r: 19, legs: sideLegs("#f2822a", 50, 66, 102, 3.6),
    tail: sideTail("#f4f4f0", "M30 84L8 82L14 90L12 96L40 96Z") + ln("M24 80Q10 74 16 66Q24 66 20 74", "#15151a", 3.4),
    chest: p("M64 70Q86 74 82 94Q74 104 62 102Q76 88 64 70Z", k.b),
    wingMarks: p("M42 86L62 84L58 91L40 92Z", "#2a3aa8") + ln("M42 84l21 -2M40 94l18 -2", "#fff", 2),
    neck: p("M64 58Q76 68 88 60L84 74Q74 78 66 72Z", k.a) + ln("M65 72Q76 79 85 73", "#fff", 3),
    face: el(72, 40, 9, 6, "#4ac88a", `opacity=".55"`),
    ex: 80, ey: 44, eyes: { rim: 1.1 },
    bill: p("M92 48Q104 46 114 55Q116 60 108 60L92 58Z", "#f2c81e", `stroke="#0004"`) + p("M110 54Q115 57 112 60L107 59Z", "#2a2a22"), scarfAt: [75, 66, 13] }, m),

  mandarinduck: (k, m) => side({ body: "#d8b078", belly: "#fbf4e8", wing: "#5a4436", head: "#f6ead8", at: [74, 48], r: 20, legs: sideLegs("#f29a3a", 50, 66, 102, 3.6),
    tail: sideTail("#3a2a24", "M30 84L8 86L14 98L40 96Z"),
    chest: p("M64 68Q88 74 82 96Q76 102 68 101Q80 86 64 68Z", k.a) + ln("M66 76Q74 88 70 100M71 74Q80 86 76 98", "#fff", 1.6),
    wingMarks: p("M38 86Q36 62 62 58Q58 66 62 84Z", k.c, `stroke="#8a4a14" stroke-width="1.6"`) + ln("M44 80Q46 70 56 64M50 82Q52 74 58 70", "#ffb458", 1.4) + ln("M30 90q16 6 30 0", "#1f6a8a", 3),
    crown: p("M80 28Q58 22 46 44Q38 58 44 68Q50 54 58 56Q60 34 80 28Z", "#2f6a5a") + p("M60 28Q48 36 46 50Q54 38 66 32Z", "#8a2a6a"),
    face: p("M62 42Q72 28 86 36Q76 40 66 50Q58 56 52 56Q54 46 62 42Z", "#fffaf0") + p("M54 54Q74 52 82 56Q74 74 50 76Q60 66 54 54Z", k.c) + ln("M58 58l-4 12M66 58l-7 14M74 58l-10 12", "#a8501a", 1.6),
    ex: 78, ey: 44, eyes: { rim: 1.2 },
    bill: p("M92 48Q104 48 111 56L92 59Z", "#e82a3a", `stroke="#0004"`) + p("M107 52L111 56L105 57Z", "#fbeee8"), blush: false, scarfAt: [72, 68, 13] }, m),

  muteswan: (k, m) => side({ body: k.c, belly: k.b, wing: "#f1f3ec", head: k.c, at: [82, 30], r: 14, legs: sideLegs("#4a4a52", 48, 64, 102, 3.6),
    tail: sideTail(k.c, "M30 82L8 70L18 88L34 94Z"),
    wingPath: "M26 78C28 56 52 50 74 74C66 92 44 96 22 86Z",
    wingMarks: ln("M32 76q16 -12 32 0M30 83q18 -8 36 -2", "#cfd4ca", 1.8),
    neck: ln("M72 86C96 74 92 56 78 52C64 46 68 30 80 28", "#c8cec4", 17) + ln("M72 86C96 74 92 56 78 52C64 46 68 30 80 28", k.c, 14.5),
    face: p("M84 26L96 30L92 36L84 30Z", "#17171c"),
    ex: 83, ey: 27, eyes: { r: 3.4, rim: 0.8 },
    bill: p("M92 29Q104 32 112 42Q102 44 90 36Z", k.a, `stroke="#0004"`) + dot(94, 29, 3.6, "#17171c") + p("M108 40L112 42L106 43Z", "#17171c"), scarfAt: [81, 55, 10] }, m),

  hoopoe: (k, m) => side({ body: k.c, belly: k.b, wing: "#1b1b20", at: [68, 52], r: 18, legs: sideLegs("#6a5a58"),
    tail: sideTail("#1b1b20", "M30 86L6 106L16 112L42 98Z") + ln("M15 99l9 8", "#fff", 3.4),
    wingMarks: ln("M34 79q16 -5 34 1M29 85q18 -4 40 0M27 91q16 -1 32 -1", "#fbf4e4", 3),
    crown: wrap("bd-crest", [[-62, 30], [-40, 35], [-18, 37], [4, 35], [26, 30]].map(([ang, len]) => `<g transform="rotate(${ang} 68 44)">${p(`M64 42Q60 ${44 - len} 68 ${40 - len}Q76 ${44 - len} 72 42Z`, k.c, `stroke="#a86a3a" stroke-width=".8"`)}${el(68, 44 - len, 3.6, 5, "#17171c")}</g>`).join("")),
    ex: 73, ey: 49, eyes: { rim: 0.9 },
    bill: p("M83 52Q102 52 117 66Q100 60 83 58Z", "#4a3a34"), scarfAt: [66, 68, 12] }, m),

  raven: (k, m) => side({ body: k.c, belly: k.b, wing: "#12121a", at: [68, 48], r: 21, legs: sideLegs("#23232c", 48, 64, 102, 3.4),
    tail: sideTail(k.c, "M32 84L4 100L8 110L18 110L42 98Z"),
    wingMarks: ln("M36 80Q52 72 68 80M32 88Q50 82 62 86", k.a, 2, `opacity=".7"`),
    neck: p("M54 60L58 76L63 68L68 80L72 68L80 74L82 60Z", k.c, `stroke="#34344a" stroke-width=".8"`),
    face: ln("M56 34Q68 28 78 33", k.a, 2.6, `opacity=".8"`),
    ex: 73, ey: 44, eyes: { rim: 1.5 },
    bill: p("M84 42Q104 42 115 60Q108 58 104 59L86 59Z", "#2c2c36", `stroke="#55556a" stroke-width="1"`) + ln("M86 53Q100 52 110 58", "#08080c", 1.4) + ln("M82 43l12 5M82 47l10 4", "#08080c", 1.4), blush: false, scarfAt: [67, 68, 14] }, m),

  amberkestrel: (k, m) => front({ body: k.b, belly: "#f4deb0", wing: k.c, head: k.a, feet: talons("#f6c41e"), tail: p("M48 100L42 119H78L72 100Z", k.a) + ln("M43.5 113.5h33", "#17171c", 4.4) + ln("M43 118h34", "#fff", 1.4),
    wingMarks: dots([[31, 79], [36, 85], [29, 88], [34, 93], [38, 78]], 1.9, "#1f1410") + p("M25 94Q28 105 35 108Q40 103 41 97Q32 100 25 94Z", "#2a2426"),
    chest: ln("M52 80v5M60 83v5M68 80v5M47 90v5M55 93v5M65 93v5M73 90v5M60 101v5", "#3a2416", 2),
    face: both(el(43, 57, 8, 8, "#f6ecd8")) + both(p("M44 49Q51 51 48 56Q45 66 41 69Q42 58 44 49Z", "#2a2830")),
    eyes: { ring: "#f6c41e", r: 4.4 }, bill: bill.raptor("#6a7484", "#f6c41e"), blush: false }, m),

  oakjay: (k, m) => front({ body: k.c, belly: k.b, wing: "#201c1e", feet: feet("#a87868"), tail: tails.long("#18161a", "#fff"),
    wingMarks: p("M26 82Q32 76 39 74L42 86Q33 88 26 92Z", k.a) + ln("M28 81l11 1M27 85.5l13 .5M26 89.5l10 0", "#0e2a58", 1.2) + p("M26 95Q33 92 41 90Q40 96 36 100Z", "#fff"),
    crown: wrap("bd-crest", p("M42 30Q46 12 60 18Q74 12 78 30Q60 22 42 30Z", "#f2ece4") + ln("M50 28l-2 -9M56 25l-1 -8M62 25l1 -9M69 27l3 -9", "#1b181c", 2.2)),
    face: p("M44 29Q60 20 76 29Q70 35 60 33Q50 35 44 29Z", "#f2ece4") + ln("M52 31l-1 -6M58 30v-7M64 30l1 -7M70 31l2 -5", "#1b181c", 1.8) + both(p("M53 57Q44 56 40 70Q50 68 55 62Z", "#151216")) + el(60, 69, 8, 5, "#f8f0ea"),
    eyes: { iris: "#bfe0f2", r: 4.6 }, bill: bill.cone("#38343a") }, m),

  sunconure: (k, m) => front({ body: k.c, belly: k.b, wing: "#ffd82a", hr: 28, feet: feet("#8a8088"), tail: tails.long("#5a8a2a", "#2458c8"),
    wingMarks: p("M25 90Q31 94 41 88Q43 100 35 108Q27 102 25 90Z", k.a) + p("M30 102Q35 104 40 98Q40 105 35 108Z", "#2458c8"),
    face: both(el(43, 54, 10, 9, "#ff8a1e", `opacity=".9"`)) + el(60, 33, 13, 8, "#ffe44a"),
    eyes: { ring: "#fbf8f0", r: 4.6 }, bill: bill.hook("#2a2a30", "#1a1a20", 0.95), blush: false }, m),

  scarletmacaw: (k, m) => front({ body: k.c, belly: k.b, wing: "#ffd21e", hr: 27, feet: feet("#4a4650"), tail: p("M66 98Q94 106 116 100Q118 108 108 112Q86 122 60 108Z", k.c) + ln("M80 110Q96 113 110 106", k.a, 4),
    wingMarks: p("M25 90Q33 96 42 89Q44 100 35 108Q26 102 25 90Z", k.a) + ln("M26.5 87Q34 91 41.5 85", "#1f9a5a", 3.4),
    face: p("M60 36Q46 30 39 42Q36 58 48 66Q56 70 60 62Q64 70 72 66Q84 58 81 42Q74 30 60 36Z", "#fbf4ee") + ln("M39 55q6 3 11 3M42 61q5 2 10 1M81 55q-6 3 -11 3M78 61q-5 2 -10 1", "#d8403a", 0.9),
    eyes: { iris: "#fbe6a0", r: 4.4 }, bill: bill.hook("#f2e4d0", "#1e1a20", 1.18), blush: false }, m),

  africangrey: (k, m, sig) => front({ body: k.c, belly: k.b, wing: "#6a6e7a", hr: 27, feet: feet("#5a5a64"), tail: p("M48 100L44 118Q60 123 76 118L72 100Z", k.a),
    wingMarks: ln("M29 82q4 4 8 0M26 89q4 4 8 0M34 89q4 4 8 0M29 96q4 4 8 0M32 102q3 3 6 0", "#c4c8d2", 1.5),
    chest: ln("M50 82q4 4 8 0M62 82q4 4 8 0M56 90q4 4 8 0M46 92q4 4 8 0M66 92q4 4 8 0M56 100q4 4 8 0", "#d8dce4", 1.5),
    face: ln("M44 30q4 3 8 0M56 26q4 3 8 0M68 30q4 3 8 0", "#b8bcc8", 1.4) + p("M60 38Q46 30 38 44Q38 58 49 60Q56 58 60 54Q64 58 71 60Q82 58 82 44Q74 30 60 38Z", "#f4f4f6"),
    eyes: { iris: "#f6e48a", r: 4.4 }, bill: bill.hook("#23232a", "#17171c", 1.08), blush: false,
    top: sig ? `<g class="bd-s-pop">${p("M70 2h46a5 5 0 0 1 5 5v13a5 5 0 0 1 -5 5H88l-9 8l2 -8H70a5 5 0 0 1 -5 -5V7a5 5 0 0 1 5 -5Z", "#fff", `stroke="${INK}" stroke-width="1.6"`)}<text x="93" y="18" font-size="11" font-family="system-ui" font-weight="800" text-anchor="middle" fill="${INK}">hello!</text></g>` : "" }, m),

  cockatoo: (k, m, sig) => front({ body: k.c, belly: k.b, wing: "#eeeee4", hr: 27, feet: feet("#5a5a62"), tail: tails.short("#f4f4ec", "#ffe45a"),
    wingMarks: ln("M29 84q4 12 8 18M33 80q5 9 7 16", "#d4d4c8", 1.4),
    crown: wrap(sig ? "bd-s-crest" : "bd-crest", sig
      ? [-58, -34, -10, 14, 38].map((ang) => `<g transform="rotate(${ang} 60 34)">${p("M56 32Q50 6 62 -6Q58 8 66 32Z", k.a, `stroke="#d8a808" stroke-width="1"`)}</g>`).join("")
      : p("M54 24Q46 6 68 2Q80 2 86 10Q72 8 70 14Q80 12 84 20Q70 16 68 26Z", k.a, `stroke="#d8a808" stroke-width="1"`)),
    face: both(el(41, 54, 7, 6, "#ffe45a", `opacity=".75"`)),
    eyes: { ring: "#dce4f0", r: 4.4 }, bill: bill.hook("#2e2e36", "#1c1c22", 1.1), blush: false }, m),

  toucan: (k, m) => side({ body: k.c, belly: false, wing: "#0c0c12", at: [58, 50], r: 21, legs: sideLegs("#4a7ac8", 44, 58, 102, 3.4),
    tail: sideTail(k.c, "M30 84L6 110L18 114L42 98Z") + p("M26 94L38 100L30 106L18 104Z", "#e0242a"),
    neck: p("M54 56Q72 54 76 66Q76 82 64 86Q50 80 54 56Z", k.b),
    face: dot(63, 44, 9, k.a) + dot(63, 44, 6.4, "#2a6ae0"),
    ex: 63, ey: 44, eyes: { r: 4, rim: 0.6 },
    bill: p("M73 38Q102 28 116 48Q120 62 110 66Q108 54 96 56L74 62Q70 50 73 38Z", k.a, `stroke="#0006" stroke-width="1.2"`) + p("M104 36Q118 44 117 58Q114 66 110 66Q112 52 104 36Z", "#17171c") + ln("M75 55Q96 48 112 53", "#a83a12", 1.4) + ln("M80 38Q92 35 102 40", "#ffe24a", 3.4) + ln("M74.5 39Q72 50 75 61", "#17171c", 3.4),
    blush: false, scarfAt: [60, 70, 14] }, m),

  hornbill: (k, m) => side({ body: k.c, belly: "#f6f4e8", wing: "#121218", at: [58, 50], r: 19, legs: sideLegs("#6a6a62", 44, 60, 102, 3.4),
    tail: sideTail("#f6f0d8", "M30 84L4 102L12 112L42 98Z") + ln("M12 98l9 10", "#17171c", 6),
    wingMarks: ln("M34 82Q50 84 66 76", "#f6e8a0", 5) + ln("M22 90Q36 92 48 90", "#fff", 3),
    neck: p("M46 58Q58 70 74 58L72 76Q58 82 46 72Z", k.b),
    face: p("M58 34Q76 34 78 50Q70 66 58 66Q66 50 58 34Z", "#17171c"),
    ex: 66, ey: 46, eyes: { iris: "#e0242a", r: 4.4 },
    bill: p("M74 42Q102 38 114 70Q104 62 96 61L74 59Z", k.a, `stroke="#0006" stroke-width="1.2"`) + p("M56 34Q70 18 100 26Q108 30 104 36Q92 34 88 42Q74 40 66 40Z", "#ffd84a", `stroke="#8a5a08" stroke-width="1.6"`) + ln("M62 33Q78 28 100 30", "#e87a14", 2.4) + ln("M76 52Q94 50 108 62", "#a86a0a", 1.2),
    blush: false, scarfAt: [58, 70, 13] }, m),

  flamingo: (k, m, sig) => {
    const neck = sig ? "M66 80C92 62 106 74 96 94" : "M66 80C94 72 88 58 74 54C60 48 64 32 76 30";
    const head = sig ? [95, 97] : [78, 30];
    const beak = sig
      ? p("M90 104Q86 118 72 114Q78 112 80 106L86 100Z", "#fbeee8", `stroke="#0004"`) + p("M81 108Q82 116 72 114Q78 112 78 108Z", "#17171c")
      : p("M88 26Q104 28 103 48Q96 40 87 38Z", "#fbeee8", `stroke="#0004"`) + p("M102 36Q105 44 103 48Q99 43 95 41Z", "#17171c");
    return side({ body: k.c, belly: k.b, wing: "#f490aa", at: head, r: 12,
      bodyPath: p("M24 78C28 62 54 60 70 70C80 80 70 94 54 94C38 94 28 88 24 78Z", k.c), bellyPath: "M40 88C50 80 66 80 72 78C70 90 56 94 48 92Z",
      wingPath: "M30 74C44 62 62 68 70 80C58 90 40 88 18 84C22 82 26 78 30 74Z",
      wingMarks: p("M18 84Q28 84 40 88L30 90Z", "#17171c"),
      tail: sideTail(k.a, "M28 76L12 74L26 86Z"),
      legs: ln("M50 90V116M50 116l-6 3M50 116l8 2", k.a, 2.8) + ln("M58 90L70 104L56 108", k.a, 2.8) + dots([[70, 104]], 2.4, k.a),
      neck: ln(neck, "#d8809a", 11) + ln(neck, k.c, 8.8),
      ex: head[0] + 1, ey: head[1] - 2, eyes: { iris: "#ffe04a", r: 3.2 },
      bill: beak, blush: false, scarfAt: sig ? [78, 74, 9] : [75, 52, 8],
      top: sig ? `<g class="bd-s-ripple">${el(80, 116, 28, 4, "none", `stroke="#7fd8ff" stroke-width="2"`)}${el(80, 116, 15, 2.2, "none", `stroke="#bff0ff" stroke-width="1.6"`)}</g>` : "",
      headClass: sig ? "bd-s-sieve" : "bd-head" }, m);
  },

  crownedcrane: (k, m) => side({ body: k.c, belly: k.b, wing: "#fbfbf6", at: [76, 36], r: 15,
    bodyPath: p("M24 80C28 64 54 62 70 72C80 82 70 96 54 96C38 96 28 90 24 80Z", k.c), bellyPath: "M40 90C50 82 66 82 72 80C70 92 56 96 48 94Z",
    wingPath: "M30 76C44 64 62 70 70 82C58 92 40 90 18 86C22 84 26 80 30 76Z",
    wingMarks: p("M22 85Q40 80 62 86Q48 92 34 90Z", "#e8b030") + p("M18 86Q26 86 34 90L24 94Z", "#7a2a22"),
    tail: sideTail("#17171c", "M28 78L8 84L28 90Z"),
    legs: ln("M48 92V116M48 116l-6 3M48 116l8 2M62 92V116M62 116l-6 3M62 116l8 2", "#33343e", 2.8),
    neck: ln("M66 78C80 68 70 56 75 42", "#6a7282", 11) + ln("M66 78C80 68 70 56 75 42", k.c, 8.8),
    crown: wrap("bd-crest", [-100, -76, -52, -28, -4, 20, 44].map((ang) => `<g transform="rotate(${ang} 70 32)">${ln("M70 24V6", k.a, 1.5)}${dot(70, 6, 1.6, "#8a5a10")}</g>`).join("")),
    face: p("M66 26Q76 14 90 28Q82 26 78 34Q70 34 66 26Z", "#17171c") + el(76, 40, 9, 7, "#fbfbf6") + el(73, 32.5, 4.4, 2.8, "#e0242a") + el(76, 53, 3.2, 6, "#e0242a"),
    ex: 82, ey: 34, eyes: { iris: "#dcecf8", r: 3.6 },
    bill: p("M89 36L103 42L89 44Z", "#33343e"), blush: false, scarfAt: [73, 62, 9] }, m),

  greyheron: (k, m) => side({ body: k.c, belly: k.b, wing: "#6e7c8e", at: [74, 34], r: 14,
    bodyPath: p("M22 84C28 66 54 62 70 72C80 82 70 96 54 97C38 97 28 92 22 84Z", k.c), bellyPath: "M40 91C50 83 66 82 72 80C70 92 56 97 48 95Z",
    wingPath: "M30 76C44 64 62 70 70 82C58 94 38 94 12 90C18 86 24 80 30 76Z",
    wingMarks: ln("M16 89Q36 90 56 86", "#222834", 3.4) + el(65, 78, 5, 4, "#222834"),
    tail: sideTail("#5a6676", "M28 82L10 94L28 94Z"),
    legs: ln("M48 94V116M48 116l-7 3M48 116l9 2M62 94V116M62 116l-7 3M62 116l9 2", "#b8902a", 2.6),
    neck: ln("M66 80C84 68 66 58 73 40", "#6a7888", 11.5) + ln("M66 80C84 68 66 58 73 40", "#e4e8ee", 9.4) + ln("M74 48l1 4M72 56l2 4M75 64l1 4M73 72l2 3", "#17171c", 2),
    crown: wrap("bd-crest", ln("M68 25Q52 20 40 30M66 28Q54 28 46 36", "#17171c", 2.2)),
    face: el(75, 31, 12, 10, "#fbfbf8") + ln("M86 30Q74 22 62 27", "#17171c", 4),
    ex: 79, ey: 33, eyes: { iris: "#ffd82a", r: 3.6 },
    bill: p("M86 33L118 42L86 43Z", k.a, `stroke="#0005"`) + ln("M88 39L108 41", "#8a6a14", 0.9), blush: false, scarfAt: [72, 62, 9] }, m),

  shoebill: (k, m, sig) => side({ body: k.c, belly: k.b, wing: "#586478", at: [62, 42], r: 22, legs: sideLegs("#3a4050", 46, 62, 100, 4),
    tail: sideTail("#586478", "M30 84L10 98L18 106L40 98Z"),
    wingMarks: ln("M30 86Q48 90 66 82M36 80Q50 82 64 76", "#9aa8bc", 1.6),
    neck: p("M48 54Q60 66 76 56L72 76Q58 82 48 70Z", k.c),
    crown: wrap("bd-crest", p("M50 24Q42 8 52 8Q50 16 60 20Q56 8 64 8Q62 18 68 22Z", k.c)),
    ex: 65, ey: 34, eyes: { iris: "#f4ecb8", r: 5.2 }, over: ln("M58 26.5L74 28", "#2e3646", 3),
    bill: `${sig ? wrap("bd-s-clack", p("M72 60Q94 70 110 66Q104 76 90 74Q76 72 72 60Z", "#b49c7a", `stroke="#5a4a34" stroke-width="1.2"`)) : p("M72 58Q94 66 112 62Q104 72 90 71Q76 69 72 58Z", "#b49c7a", `stroke="#5a4a34" stroke-width="1.2"`)}${p("M70 38Q96 28 114 52Q118 62 112 66Q110 60 106 60Q88 62 72 56Q66 46 70 38Z", k.a, `stroke="#5a4a34" stroke-width="1.4"`)}${ln("M76 39Q96 36 110 55", "#7a6448", 2)}${dots([[84, 48], [96, 52], [92, 44], [104, 56], [80, 54]], 2, "#8a7256")}${p("M111 56Q119 66 110 70Q112 63 108 60Z", "#5a4a34")}`,
    blush: false, scarfAt: [60, 68, 14],
    top: sig ? `<g class="bd-s-pop">${ln("M114 76l5 6M104 80l1 8M117 38l3 -7", "#ffd84d", 2.4)}<text x="94" y="20" font-size="10" font-family="system-ui" font-weight="800" fill="#ffd84d" stroke="#232a38" stroke-width="2.4" paint-order="stroke">clack!</text></g>` : "" }, m),

  birdofparadise: (k, m, sig) => side({ body: k.c, belly: k.b, wing: "#5a2814", at: [70, 46], r: 18, legs: sideLegs("#7a6070"),
    back: wrap(sig ? "bd-s-plumes" : "bd-tail", sig
      ? [["M50 78C20 62 4 34 10 10C26 30 46 46 62 70Z", k.a], ["M54 76C40 46 40 20 52 2C58 26 66 50 66 74Z", "#ff8a1e"], ["M46 82C16 80 0 62 0 42C18 58 40 66 58 76Z", "#ff3a1e"], ["M60 74C60 46 72 24 90 14C84 36 78 56 70 76Z", "#ffb02a"]].map(([d, col]) => p(d, col, `opacity=".95"`)).join("") + ln("M36 54Q22 38 18 22M54 46Q50 26 52 14", "#ffe08a", 1.6)
      : p("M46 84C26 84 8 96 2 116C20 106 36 104 58 98Z", k.a) + p("M50 90C34 94 24 106 22 119C34 108 46 106 62 100Z", "#ff9a2a") + p("M42 80C24 76 8 82 0 92C18 90 30 92 48 92Z", "#ff3a1e", `opacity=".85"`)),
    tail: ln("M40 94C28 112 12 108 6 98M46 98C42 116 26 120 18 114", "#2a1a14", 1.4),
    chest: p("M60 66Q78 72 76 90Q66 94 58 86Z", "#2a1410", `opacity=".6"`),
    neck: ln("M56 62Q68 72 82 60", "#ffd82a", 4.4),
    face: p("M54 40Q56 28 70 28Q84 29 87 40Q72 38 54 40Z", "#ffd82a") + p("M54 40Q50 46 54 54Q58 48 62 44Z", "#ffd82a") + p("M68 52Q80 48 88 50Q86 64 74 64Q66 62 68 52Z", "#10a860") + p("M80 40Q88 42 88 49Q80 50 76 46Z", "#0a6a40"),
    ex: 76, ey: 43, eyes: { iris: "#ffe04a", r: 3.8 },
    bill: p("M87 45L104 52L86 55Z", "#a8bcd4", `stroke="#0005"`), blush: false, scarfAt: [68, 66, 12] }, m),

  quetzal: (k, m) => front({ body: k.c, belly: k.b, wing: "#0a8a50", hr: 24, feet: feet("#8a8068"),
    back: wrap("bd-tail", p("M46 88C26 82 8 94 2 123C16 104 32 100 54 106Z", k.c) + p("M74 88C94 82 112 94 118 123C104 104 88 100 66 106Z", k.c) + p("M50 100C36 104 26 112 24 123C36 114 46 112 58 112Z", "#0a8a50") + ln("M44 92C28 90 14 100 7 114M76 92C92 90 106 100 113 114", k.a, 2) + p("M52 102L54 119L60 112L66 119L68 102Z", "#f4f6f4")),
    wingMarks: ln("M28 82q10 8 6 20M34 76q10 10 8 20", k.a, 2.2),
    crown: wrap("bd-crest", p("M38 38Q36 28 44 24Q40 18 50 18Q50 8 60 12Q68 4 72 16Q82 12 80 24Q88 28 82 38Q60 24 38 38Z", k.c, `stroke="${k.a}" stroke-width="1.4"`)),
    face: el(60, 33, 14, 7, k.a, `opacity=".45"`),
    eyes: { rim: 1, r: 4.8 }, bill: bill.cone("#ffd82a", "#e8a80a") }, m),

  kakapo: (k, m, sig) => front({ body: k.c, belly: k.b, wing: "#678a2e", hr: 28, hrx: 29, brx: sig ? 33 : 30, feet: feet("#b89a7a", 107), tail: tails.short("#5a7a28", k.a),
    wingMarks: ln("M27 84l5 3M33 80l5 3M26 92l6 3M34 90l5 3M29 100l5 2", k.a, 2.4),
    chest: ln("M50 80l-3 5M62 78l1 6M72 82l3 5M54 94l-2 5M68 96l2 5M46 96l-3 4M62 104v4", "#5a6a20", 1.8) + (sig ? wrap("bd-s-puff", el(60, 80, 23, 17, "#d8e488", `opacity=".92"`) + ln("M48 76l-2 5M62 74v6M72 78l2 4M56 88l-1 4", "#7a8a30", 1.6)) : ""),
    face: p("M60 34C72 24 88 36 82 54C76 68 66 72 60 72C54 72 44 68 38 54C32 36 48 24 60 34Z", "#d8c878") + ln("M42 30l5 5M54 24l2 7M68 24l-2 7M78 30l-5 5", "#4a5a24", 2.2) + both(ln("M52 60L32 66M52 64L36 73M50 56L31 57", "#8a7a40", 0.9)),
    eyes: { rim: 1, r: 4.4 }, bill: p("M50.5 53Q60 45 69.5 53Q69 64 60 68Q51 64 50.5 53Z", "#b4bcb8", `stroke="#5a625e" stroke-width="1.2"`) + ln("M54 59q6 4 12 0", "#6a726e", 1.4) + dots([[56, 52], [64, 52]], 1.3, "#4a524e"), blush: false,
    top: sig ? `<g class="bd-s-ripple" fill="none" stroke="#e8f08a" stroke-width="2.4" stroke-linecap="round"><path d="M18 66q-9 14 0 30M8 58q-13 22 0 46M102 66q9 14 0 30M112 58q13 22 0 46"/></g><text class="bd-s-pop" x="87" y="22" font-size="10" font-family="system-ui" font-weight="800" fill="#e8f08a" stroke="#2a3410" stroke-width="2.6" paint-order="stroke">BOOM</text>` : "" }, m),

  baldeagle: (k, m, sig) => front({ body: k.c, belly: k.b, wing: "#3a2416", head: "#fcfbf4", hr: 25, feet: talons(k.a), tail: p("M46 100L40 118Q60 123 80 118L74 100Z", "#fcfbf4"),
    back: sig ? both(wrap("bd-s-spread", p("M44 76C30 56 12 48 0 50L8 58L0 64L10 70L2 78L14 82L8 92L24 90L22 100Q36 96 46 88Z", "#3a2416", `stroke="#20120a" stroke-width="1.2"`))) : "",
    noWing: sig,
    wingMarks: ln("M28 86q4 8 8 14M33 80q5 9 7 14", "#22140a", 1.6),
    chest: ln("M46 74l5 6l5 -5l4 7l5 -7l5 5l4 -6", "#fcfbf4", 4),
    face: ln("M39 38L55 43M81 38L65 43", "#d8d0bc", 3.4),
    eyes: { iris: "#ffd82a", r: 4.8 }, bill: bill.raptor(k.a, "#f2b414", "#d89a0a"), blush: false }, m),

  goldeneagle: (k, m, sig) => front({ body: k.c, belly: k.b, wing: "#3c2414", hr: 25, feet: talons("#f2c41e"), tail: p("M46 100L40 118Q60 123 80 118L74 100Z", "#4a2e1a") + ln("M43 112h34", "#8a7a68", 3),
    back: sig ? both(wrap("bd-s-spread", p("M44 76C30 56 12 46 0 46L8 55L0 61L10 68L2 76L14 80L8 90L24 89L22 100Q36 96 46 88Z", "#3c2414", `stroke="#1e1008" stroke-width="1.2"`) + ln("M20 66q10 8 22 12", "#a8742e", 3))) : "",
    noWing: sig,
    wingMarks: ln("M28 84l9 -3M30 92l9 -3", "#a8742e", 3),
    face: p("M34 46Q32 22 60 20Q88 22 86 46Q80 32 72 34L66 30L60 36L54 30L48 34Q40 32 34 46Z", k.a) + both(ln("M37 48q-2 10 4 18", k.a, 4)) + ln("M40 37L55 42M80 37L65 42", "#2a180c", 3),
    eyes: { iris: "#c8801e", r: 4.8 }, bill: bill.raptor("#8a98a8", "#f2c41e", "#1c1c24"), blush: false }, m),

  harpyeagle: (k, m, sig) => front({ body: k.c, belly: k.b, wing: "#24262e", head: "#b4b8c0", hr: 25, feet: talons("#f2c82a"), tail: p("M46 100L40 118Q60 123 80 118L74 100Z", "#2a2c34") + ln("M43 109h34M41 115h38", "#b8bcc4", 2.2),
    chest: p("M38 72Q60 66 82 72Q76 84 60 82Q44 84 38 72Z", "#1c1e26") + ln("M46 98h6M68 98h6M50 106h5M65 106h5", "#8a8e98", 1.4),
    wingMarks: ln("M28 86l10 -3M29 95l10 -3", "#60646e", 1.8),
    crown: wrap(sig ? "bd-s-crest" : "bd-crest", sig
      ? both(p("M44 32Q28 12 30 -2Q40 10 46 8Q46 18 56 24Z", "#3a3c46") + p("M36 42Q18 32 14 18Q26 26 34 24Q34 32 46 30Z", "#6a6e78"))
      : both(p("M44 32Q32 18 36 8Q44 16 50 14Q50 20 58 24Z", "#3a3c46"))),
    face: el(60, 52, 20, 18, "#d4d8de") + ln("M40 37L55 42M80 37L65 42", "#4a4c56", 3),
    eyes: { dark: "#3a1c14", r: 4.8 }, bill: bill.raptor("#23232c", "#4a4a54", "#08080c"), blush: false }, m),

  dawnphoenix: (k, m) => front({ body: k.c, belly: k.b, wing: k.a, feet: feet("#c8841e"),
    back: dot(60, 66, 52, "#ffb02a", `opacity=".18" class="bd-bglow"`) + wrap("bd-tail", p("M50 96C28 106 10 100 4 78C10 96 22 90 26 98C14 106 16 116 6 118C28 122 46 112 58 104Z", k.a) + p("M70 96C92 106 110 100 116 78C110 96 98 90 94 98C106 106 104 116 114 118C92 122 74 112 62 104Z", k.a) + p("M52 100C46 116 54 120 60 110C66 120 74 116 68 100Z", "#ffd45a")),
    wingMarks: p("M27 90Q34 94 40 86Q42 98 35 106Q28 100 27 90Z", "#ff8a1e") + ln("M30 96l6 5", "#ffe08a", 2.4),
    crown: wrap("bd-crest", p("M42 32Q38 12 50 6Q48 16 56 18Q54 2 68 -2Q62 10 70 16Q74 8 84 10Q72 16 78 32Q60 20 42 32Z", k.a) + p("M52 26Q50 14 58 12Q58 20 64 18Q62 8 70 8Q66 16 70 26Q60 20 52 26Z", "#ffd45a")),
    face: el(60, 52, 17, 14, "#ffd45a", `opacity=".7"`),
    eyes: { iris: "#ff5a1e", r: 4.8 }, bill: bill.cone("#ffe28a", "#e8a81e") }, m),

  hyacinthmacaw: (k, m) => front({ body: k.c, belly: k.b, wing: "#1a2894", hr: 28, feet: feet("#4a4a58"), tail: p("M66 98Q94 106 116 100Q118 108 108 112Q86 122 60 108Z", "#1a2894") + ln("M78 108Q94 111 108 106", "#5a74f0", 2),
    wingMarks: ln("M29 84q4 12 8 18M33 79q5 10 7 16", "#4a62e8", 1.6),
    face: both(p("M50 57Q44 62 46 70Q52 74 55 68Q52 62 54 58Z", k.a)),
    eyes: { ring: k.a, r: 4.4 }, bill: bill.hook("#262630", "#14141a", 1.3), blush: false }, m),

  spixmacaw: (k, m) => front({ body: k.c, belly: k.b, wing: "#2e5ea8", head: k.a, hr: 27, feet: feet("#5a5660"), tail: p("M66 98Q94 106 116 100Q118 108 108 112Q86 122 60 108Z", "#2e5ea8") + ln("M80 108Q96 111 108 106", "#8ab8e8", 2),
    wingMarks: ln("M29 84q4 12 8 18M33 79q5 10 7 16", "#6a9ad8", 1.6),
    face: both(p("M54 48Q44 36 38 44Q38 56 50 58Q56 56 54 48Z", "#5a5e6a")),
    eyes: { iris: "#f2ead0", r: 4.2 }, bill: bill.hook("#23232a", "#16161c", 1.1), blush: false }, m),

  peacock: (k, m, sig) => front({ body: k.c, belly: k.b, wing: "#a8885a", hr: 20, feet: feet("#8a8070"),
    back: fan(k.a, "#14704a", "#c8a028", "#14a0a0", sig),
    wingMarks: ln("M27 84l10 -3M26 90l13 -3M28 96l11 -2", "#2a2018", 2),
    crown: peaCrest("#1a2a6a", "#1fa0c8"),
    face: both(p("M38 39Q48 32 57 39Q49 40 40 43Z", "#fbfbf4") + p("M40 49Q48 56 56 51Q50 60 42 56Z", "#fbfbf4")),
    ex: 50, eyes: { r: 3.8 }, bill: bill.cone("#b8a890"), blush: false }, m),

  whitepeacock: (k, m, sig) => front({ body: k.c, belly: k.b, wing: "#eceff8", hr: 20, feet: feet("#d8b8b0"),
    back: fan("#f8f9ff", k.a, "#dde4fa", "#c0ccf0", sig),
    wingMarks: ln("M28 86l10 -3M28 94l10 -3", k.a, 1.6),
    crown: peaCrest("#b8c0d8", "#fff"),
    ex: 50, eyes: { r: 4, dark: "#2a2438" }, bill: bill.cone("#f2c8b8") }, m),

  aurorapeacock: (k, m, sig) => front({ body: k.c, belly: k.b, wing: "#5a4ab0", hr: 20, feet: feet("#b8a0e0"),
    back: dot(60, 60, 55, k.a, `opacity=".18" class="bd-bglow"`) + fan("#2a8a9a", "#7dffd0", k.a, "#5cf0c0", sig) + `<g class="bd-bglow">${dots([[10, 36], [28, 10], [96, 14], [112, 44], [8, 74], [110, 80]], 1.8, "#ffe88a")}</g>`,
    wingMarks: ln("M28 86l10 -3M28 94l10 -3", "#7dffd0", 2),
    crown: peaCrest(k.a, "#ffd84d"),
    ex: 50, eyes: { iris: "#b58cff", r: 4.2 }, bill: bill.cone("#ffe0a0") }, m),
};

const BASE_CSS = `.bd-wing{transform-box:fill-box;transform-origin:50% 20%;animation:bdWing 3.2s ease-in-out infinite}.bd-head{animation:bdBob 3.6s ease-in-out infinite}.bd-tail{transform-origin:60px 96px;animation:bdSway 3.4s ease-in-out infinite}.bd-crest{transform-box:fill-box;transform-origin:50% 100%;animation:bdSway 2.8s ease-in-out infinite}.bd-fan{transform-origin:60px 92px;animation:bdSway 5s ease-in-out infinite}.bd-bglow{animation:bdGlow 2.6s ease-in-out infinite}.bd-wingblur{transform-origin:52px 76px;animation:bdBlur .16s linear infinite}@keyframes bdWing{0%,100%{transform:rotate(0)}50%{transform:rotate(3deg)}}@keyframes bdBob{0%,100%{transform:translateY(0)}50%{transform:translateY(1.4px)}}@keyframes bdSway{0%,100%{transform:rotate(-1.6deg)}50%{transform:rotate(1.6deg)}}@keyframes bdGlow{0%,100%{opacity:.18}50%{opacity:.42}}@keyframes bdBlur{0%,100%{transform:rotate(-9deg)}50%{transform:rotate(9deg)}}`;

// Extra CSS per signature kind. Class names are only present on signature art, so inline SVGs never affect each other.
const SIG_CSS = {
  fan: ".bd-s-fan{transform-origin:60px 92px;animation:bdsFan 2.4s ease-in-out infinite}@keyframes bdsFan{0%{transform:scale(.55)}35%{transform:scale(1.04)}50%{transform:scale(1) rotate(2.5deg)}65%{transform:scale(1) rotate(-2.5deg)}85%{transform:scale(1.02)}100%{transform:scale(.55)}}",
  swivel: ".bd-s-swivel{transform-origin:60px 48px;animation:bdsSwivel 3.2s ease-in-out infinite}@keyframes bdsSwivel{0%,12%{transform:rotate(0)}32%,44%{transform:rotate(68deg)}68%,80%{transform:rotate(-68deg)}100%{transform:rotate(0)}}",
  laugh: ".bd-s-jaw{transform-origin:82px 56px;animation:bdsJaw .22s ease-in-out infinite}@keyframes bdsJaw{0%,100%{transform:rotate(0)}50%{transform:rotate(17deg)}}.bd-s-laugh-all .bd-head{transform-origin:62px 62px;animation:bdsLaugh .9s ease-in-out infinite}@keyframes bdsLaugh{0%,100%{transform:rotate(-4deg)}50%{transform:rotate(-17deg)}}",
  clatter: ".bd-s-clack{transform-origin:72px 58px;animation:bdsClack .18s linear infinite}@keyframes bdsClack{0%,100%{transform:rotate(-3deg)}50%{transform:rotate(13deg)}}",
  hover: ".bd-s-wingblur{transform-origin:52px 76px;animation:bdsBlur .07s linear infinite}@keyframes bdsBlur{0%,100%{transform:rotate(-22deg)}50%{transform:rotate(22deg)}}.bd-s-hover-all{animation:bdsDart 1.6s cubic-bezier(.6,0,.3,1) infinite}@keyframes bdsDart{0%,25%{transform:translate(0,0)}35%,55%{transform:translate(-12px,-7px)}70%,85%{transform:translate(6px,3px)}100%{transform:translate(0,0)}}",
  dive: ".bd-s-dive-all{transform-origin:62px 70px;animation:bdsDive 1.8s ease-in infinite}@keyframes bdsDive{0%,18%{transform:translate(0,-6px) rotate(0)}38%{transform:translate(-4px,-16px) rotate(28deg)}58%{transform:translate(6px,26px) rotate(64deg)}72%{transform:translate(6px,30px) rotate(64deg)}100%{transform:translate(0,-6px) rotate(0)}}.bd-s-splash{transform-origin:70px 116px;animation:bdsSplash 1.8s ease-out infinite}@keyframes bdsSplash{0%,48%{opacity:0;transform:scale(.4)}60%{opacity:1;transform:scale(1)}85%,100%{opacity:0;transform:scale(1.2)}}",
  filter: ".bd-s-sieve{animation:bdsSieve .5s ease-in-out infinite}@keyframes bdsSieve{0%,100%{transform:translateX(-3px)}50%{transform:translateX(3px)}}",
  drum: ".bd-s-drum{transform-origin:56px 66px;animation:bdsDrum .13s linear infinite}@keyframes bdsDrum{0%,100%{transform:rotate(-11deg)}50%{transform:rotate(7deg)}}",
  plumes: ".bd-s-plumes{transform-origin:55px 82px;animation:bdsShiver .28s ease-in-out infinite}@keyframes bdsShiver{0%,100%{transform:rotate(-4deg) scale(.97)}50%{transform:rotate(4deg) scale(1.03)}}.bd-s-plumes-all{animation:bdsHop .7s ease-in-out infinite}@keyframes bdsHop{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}",
  dance: ".bd-s-dance-all{transform-origin:55px 116px;animation:bdsCrane 1.2s ease-in-out infinite}@keyframes bdsCrane{0%,100%{transform:translateY(0) rotate(0)}25%{transform:translateY(-15px) rotate(-9deg)}50%{transform:translateY(0) rotate(0)}75%{transform:translateY(-11px) rotate(9deg)}}.bd-s-dance-all .bd-wing{transform-origin:100% 40%;animation:bdsFlapUp .6s ease-in-out infinite}@keyframes bdsFlapUp{0%,100%{transform:rotate(0)}50%{transform:rotate(34deg)}}",
  boom: ".bd-s-puff{transform-origin:60px 80px;animation:bdsPuff 1.5s ease-in-out infinite}@keyframes bdsPuff{0%,100%{transform:scale(.6)}50%{transform:scale(1.16)}}",
  hang: ".bd-s-hang-all{transform-origin:60px 115px;animation:bdsHang 3s ease-in-out infinite}@keyframes bdsHang{0%,10%{transform:translateY(0) rotate(0)}30%{transform:translateY(-2px) rotate(172deg)}45%{transform:translateY(-2px) rotate(188deg)}60%{transform:translateY(-2px) rotate(174deg)}75%{transform:translateY(-2px) rotate(182deg)}100%{transform:translateY(0) rotate(360deg)}}",
  crest: ".bd-s-crest{transform-box:fill-box;transform-origin:50% 100%;animation:bdsCrest 1.1s cubic-bezier(.3,1.7,.5,1) infinite alternate}@keyframes bdsCrest{0%{transform:scale(.62)}60%,100%{transform:scale(1.08)}}",
  mimic: "",
  spread: ".bd-s-spread{transform-origin:44px 82px;animation:bdsSpread 1.5s ease-in-out infinite}@keyframes bdsSpread{0%,100%{transform:rotate(12deg)}50%{transform:rotate(-14deg)}}",
};
const SIG_KIND = { cockatoo: "crest", harpyeagle: "crest", barnowl: "swivel", kookaburra: "laugh", hummingbird: "hover", kingfisher: "dive", flamingo: "filter", woodpecker: "drum", shoebill: "clatter", birdofparadise: "plumes", crownedcrane: "dance", kakapo: "boom", bluetit: "hang", africangrey: "mimic", baldeagle: "spread", goldeneagle: "spread", peacock: "fan", whitepeacock: "fan", aurorapeacock: "fan" };
const POP_CSS = "@keyframes bdsPop{0%,8%{opacity:0;transform:scale(.7)}22%,78%{opacity:1;transform:scale(1)}100%{opacity:0;transform:scale(1.06)}}.bd-s-pop{transform-box:fill-box;transform-origin:50% 50%;animation:bdsPop 1.4s ease-out infinite}.bd-s-ripple{animation:bdsPulse 1.5s ease-out infinite}@keyframes bdsPulse{0%,30%{opacity:0}55%{opacity:1}100%{opacity:0}}";

export function birdSvg(id, name, rar, c, b, a, family, tailMode, stage = 1, mood = "happy", size = 0, act = "") {
  const draw = ART[id];
  if (!draw) return "";
  const kind = act === "signature" ? SIG_KIND[id] : "";
  const rig = draw({ c, b, a }, mood, !!kind);
  const scale = stage === 1 ? 0.84 : stage === 2 ? 0.93 : 1;
  const glow = rar === "l" ? dot(60, 64, 55, a, `opacity=".13"`) : "";
  const css = `${BASE_CSS}${kind ? POP_CSS + SIG_CSS[kind] : ""}@media (prefers-reduced-motion:reduce){[class^="bd-"]{animation:none!important}}`;
  const wear = (stage >= 2 ? scarf(...rig.neck) : "") + (stage >= 3 ? hat(...rig.cap) : "");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 124" ${size ? `width="${size}" height="${size}"` : ""} overflow="hidden" role="img" aria-label="${name}"><style>${css}</style>${glow}<g transform="translate(${60 - 60 * scale} ${124 - 124 * scale}) scale(${scale})">${el(60, 119, 32, 4, "#000", `opacity=".15"`)}<g class="bd-all${kind ? ` bd-s-${kind}-all` : ""}">${rig.back}${rig.body}${rig.head}${wear}${rig.top}</g></g></svg>`;
}
