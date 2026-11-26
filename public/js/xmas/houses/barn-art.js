// Hoofbeat Barn art: thirty farm friends, each with its own breed shape, horns, muzzle, mane, fleece
// and markings, plus a posed and animated drawing for every signature behaviour (act = "signature").
import { INK, el, dot, p, ln, dots, both, wrap, eye, blush, scarf, hat, frame } from "./artkit.js";

// ---------- small helpers ----------
const f = (n) => +n.toFixed(1);
const edge = (c = "#0003", w = 1.1) => `stroke="${c}" stroke-width="${w}" stroke-linejoin="round"`;
const tf = (t, s) => `<g transform="${t}">${s}</g>`;
const mirror = (s) => tf("matrix(-1 0 0 1 120 0)", s);
const rp = ([x, y], [px, py], deg) => {
  const a = (deg * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
  return [f(px + (x - px) * c - (y - py) * s), f(py + (x - px) * s + (y - py) * c)];
};

/** Scalloped cloud outline: wool, topknots, dust and foam. */
function fluff(cx, cy, rx, ry, n, fill, x = edge("#0002"), bump = 1.2) {
  const at = (i, k) => {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    return `${f(cx + Math.cos(a) * rx * k)} ${f(cy + Math.sin(a) * ry * k)}`;
  };
  let d = `M${at(0, 1)}`;
  for (let i = 0; i < n; i++) d += `Q${at(i + 0.5, bump)} ${at(i + 1, 1)}`;
  return p(`${d}Z`, fill, x);
}
/** Little crimp curls. */
const curls = (pts, r, col, w = 1.2) => ln(pts.map(([x, y]) => `M${x - r} ${y}a${r} ${r} 0 1 1 ${r} ${r}a${r * 0.55} ${r * 0.55} 0 0 1 0 ${-r * 1.1}`).join(""), col, w);
/** Wavy hanging strands, [x, y, length]. */
const strands = (list, amp, col, w) => ln(list.map(([x, y, l]) => `M${x} ${y}q${amp} ${f(l / 4)} 0 ${f(l / 2)}t0 ${f(l / 2)}`).join(""), col, w);
/** Ringlet lock with a dark rim and a light core. */
const ringlets = (list, rim, core, w = 5, amp = 3.2) => strands(list, amp, rim, w) + strands(list, amp, core, w - 1.8);
/** Soft S-shaped locks of long hair from a root to a tip, [x, y, tipX, tipY, halfWidth]. Left open so the root has no outline. */
const tufts = (list, fill, x = "") => list.map(([a, b, c, d, w = 4]) => {
  const h = d - b, m = (c - a) / 2;
  return p(`M${a - w} ${b}C${f(a - w * 1.5 + m * 0.2)} ${f(b + h * 0.42)} ${f(c - w * 0.9 + 1.6)} ${f(d - h * 0.3)} ${c} ${d}C${f(c + w * 0.55)} ${f(d - h * 0.04)} ${f(c + w * 0.75)} ${f(d - h * 0.12)} ${f(c + w * 0.6)} ${f(d - h * 0.2)}C${f(a + w * 1.7 + m)} ${f(d - h * 0.42)} ${f(a + w * 1.5)} ${f(b + h * 0.24)} ${a + w} ${b}`, fill, x);
}).join("");
/** A pointed or leaf ear from a base point to a tip. */
function ear([bx, by], [tx, ty], w, col, inner, bow = 1.25) {
  const dx = tx - bx, dy = ty - by, l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
  const shape = (k, s0, s1) => {
    const ax = bx + dx * s0, ay = by + dy * s0, zx = bx + dx * s1, zy = by + dy * s1, mx = bx + dx * 0.55, my = by + dy * 0.55;
    return `M${f(ax + nx * w * k)} ${f(ay + ny * w * k)}Q${f(mx + nx * w * bow * k)} ${f(my + ny * w * bow * k)} ${f(zx)} ${f(zy)}Q${f(mx - nx * w * bow * k)} ${f(my - ny * w * bow * k)} ${f(ax - nx * w * k)} ${f(ay - ny * w * k)}Z`;
  };
  return p(shape(1, 0, 1), col, edge("#0004")) + (inner ? p(shape(0.52, 0.16, 0.82), inner) : "");
}
/** Tapered horn along a quadratic curve, with growth ridges. */
function horn([x0, y0], [cx, cy], [x1, y1], w0, col, ridge = "#0004", w1 = 0.6, rings = 4) {
  const at = (t) => [(1 - t) ** 2 * x0 + 2 * (1 - t) * t * cx + t * t * x1, (1 - t) ** 2 * y0 + 2 * (1 - t) * t * cy + t * t * y1];
  const L = [], R = [], marks = [];
  for (let i = 0; i <= 10; i++) {
    const t = i / 10, [x, y] = at(t);
    const dx = 2 * (1 - t) * (cx - x0) + 2 * t * (x1 - cx), dy = 2 * (1 - t) * (cy - y0) + 2 * t * (y1 - cy), l = Math.hypot(dx, dy) || 1;
    const w = w0 + (w1 - w0) * t, nx = (-dy / l) * w, ny = (dx / l) * w;
    L.push(`${f(x + nx)} ${f(y + ny)}`);
    R.unshift(`${f(x - nx)} ${f(y - ny)}`);
    if (i > 0 && i <= rings * 2 && i % 2 === 0) marks.push(`M${f(x + nx * 0.85)} ${f(y + ny * 0.85)}L${f(x - nx * 0.85)} ${f(y - ny * 0.85)}`);
  }
  return p(`M${L.join("L")}L${R.join("L")}Z`, col, edge("#0005")) + (rings ? ln(marks.join(""), ridge, 1) : "");
}
/** Straight leg with a hoof, hung from (x, y) and optionally swung by `ang` degrees (negative = forward). */
function leg(x, y, o) {
  const { col, hoof = "#2a2024", w = 9, ang = 0, hh = 6 } = o;
  const len = o.len || 118 - y, h = w / 2, e = y + len;
  let s = p(`M${x - h} ${y}Q${x} ${y - h} ${x + h} ${y}L${f(x + h * 0.86)} ${e - hh}H${f(x - h * 0.86)}Z`, col, edge());
  if (o.knee) s += el(x, y + len * 0.42, h * 0.98, 4.6, o.knee);
  if (o.sock) s += p(`M${f(x - h * 0.9)} ${e - o.sock}Q${x} ${e - o.sock - 3} ${f(x + h * 0.9)} ${e - o.sock}L${f(x + h * 0.86)} ${e - hh}H${f(x - h * 0.86)}Z`, o.sockCol);
  if (o.stripes) s += ln([0.36, 0.5, 0.64].map((t) => `M${f(x - h * 0.8)} ${f(y + len * t)}q${h * 0.8} 2 ${f(h * 1.6)} 0`).join(""), o.stripes, 1.5);
  s += p(`M${f(x - h * 0.92)} ${e - hh}H${f(x + h * 0.92)}L${f(x + h * 1.14)} ${e - 1.5}Q${f(x + h)} ${e} ${f(x + h * 0.6)} ${e}H${f(x - h * 0.6)}Q${f(x - h)} ${e} ${f(x - h * 1.14)} ${e - 1.5}Z`, hoof, edge("#0006", 0.8));
  if (o.cloven) s += ln(`M${x} ${e - hh + 1.8}V${e}`, "#00000080", 1);
  if (o.feather) s += p(`M${f(x - h * 1.1)} ${e - hh - 4}Q${f(x - h * 1.5)} ${e - 1} ${f(x - h * 0.7)} ${e - 3}Q${x - 2} ${e - 6} ${x} ${e - 2.5}Q${x + 2} ${e - 6} ${f(x + h * 0.7)} ${e - 3}Q${f(x + h * 1.5)} ${e - 1} ${f(x + h * 1.1)} ${e - hh - 4}Z`, o.feather);
  return ang ? tf(`rotate(${ang} ${x} ${y})`, s) : s;
}
/** Two-segment leg: upper swings a1, lower swings a2 from the knee. */
function bent(x, y, a1, l1, a2, l2, o) {
  const [kx, ky] = rp([x, y + l1], [x, y], a1);
  return ln(`M${x} ${y}L${kx} ${ky}`, o.col, o.w || 9) + leg(f(kx), f(ky), { ...o, len: l2, ang: a2 });
}
/** Far and near pairs of side-view legs. xs = [farHind, farFront, nearHind, nearFront]. */
function quad(xs, y, o, far = {}, angles = [0, 0, 0, 0]) {
  const one = (i, extra) => leg(xs[i], y - (i < 2 ? 2 : 0), { ...o, ...extra, len: 118 - y + (i < 2 ? -1 : 0), ang: angles[i] });
  return { far: one(0, far) + one(1, far), near: one(2, {}) + one(3, {}) };
}
/** Goat, sheep and cattle eyes: moods from artkit, with a sideways pupil when open. */
function barEye(x, y, mood, iris, r = 4.8) {
  const open = mood === "happy" || mood === "sad";
  return eye(x, y, mood, { r, iris }) + (open ? el(x, y, r * 0.76, r * 0.34, "#14131f") + dot(x + r * 0.34, y - r * 0.36, r * 0.3, "#fff") : "");
}
const nostrils = (x1, x2, y, col = "#2a1a1e", rx = 1.6, ry = 2.2) => el(x1, y, rx, ry, col, `transform="rotate(20 ${x1} ${y})"`) + el(x2, y, rx, ry, col, `transform="rotate(-20 ${x2} ${y})"`);
const smile = (x, y, col = INK, w = 4) => ln(`M${x - w} ${y}q${w / 2} ${w * 0.75} ${w} 0q${w / 2} ${w * 0.75} ${w} 0`, col, 1.4);
const txt = (x, y, s, size, fill, stroke = "#2a1a10", x2 = "") => `<text x="${x}" y="${y}" font-size="${size}" font-family="system-ui,sans-serif" font-weight="800" text-anchor="middle" fill="${fill}" stroke="${stroke}" stroke-width="2.8" paint-order="stroke" ${x2}>${s}</text>`;
const burst = (x, y, r, col = "#ffd84d") => p(Array.from({ length: 14 }, (_, i) => {
  const a = (i / 14) * Math.PI * 2, k = i % 2 ? r * 0.46 : r;
  return `${i ? "L" : "M"}${f(x + Math.cos(a) * k)} ${f(y + Math.sin(a) * k)}`;
}).join("") + "Z", col, edge("#a8641a", 1.2));
const note = (x, y, col) => el(x, y, 3.2, 2.5, col, `transform="rotate(-20 ${x} ${y})"`) + ln(`M${x + 2.8} ${y - 1}V${y - 12}q5 1 5 6`, col, 1.8);
const tuft = (x, y, col = "#4f9a3a") => ln(`M${x} ${y}q-2 -7 -7 -9M${x} ${y}q0 -8 1 -12M${x} ${y}q2 -7 7 -8M${x} ${y}q-1 -4 -3 -8M${x} ${y}q3 -4 4 -9`, col, 2);
const dust = (x, y, k = 1, col = "#e8d4ac") => fluff(x, y, 9 * k, 6 * k, 7, col, `opacity=".9" ${edge("#b8986a", 0.8)}`, 1.3);
/** A keyframed loop for one signature class. The 0% frame is always the telling pose, since sprites show it. */
const anim = (cls, kf, dur, frames, origin, ease = "ease-in-out") => `.bd-s-barn-${cls}{${origin ? `transform-origin:${origin};` : ""}animation:barn${kf} ${dur}s ${ease} infinite}@keyframes barn${kf}{${frames}}`;
/** Particles that fly from where they are drawn to `to`, then re-enter from `from`. */
const drift = (cls, kf, dur, from, to) => anim(cls, kf, dur, `0%,100%{opacity:1;transform:translate(0,0)}45%{opacity:0;transform:translate(${to})}55%{opacity:0;transform:translate(${from})}`, "", "linear");
/** A slow blink between full and faint. */
const pulse = (cls, kf, dur, low = 0.2) => anim(cls, kf, dur, `0%,100%{opacity:1}50%{opacity:${low}}`, "");
const g = (cls, s) => wrap(`bd-s-barn-${cls}`, s);

// ====================================================================================
// Ponies and donkeys (side body, profile head facing right)
// ====================================================================================
const eqBody = (col, x = "") => p("M19 83C18 67 34 63 48 67C60 70 70 65 80 71C91 82 86 101 68 104C54 107 40 106 30 103C21 99 19 92 19 83Z", col, edge() + x);
const eqNeck = (col) => p("M49 73C58 62 63 41 78 33L97 62C86 69 84 82 78 93C66 92 54 85 49 73Z", col);
function eqHead(k, mood, o) {
  const coat = o.coat || k.c;
  const far = o.ears ? ear(o.ears[0][0], o.ears[0][1], o.earW || 6, o.earFar || coat, o.earIn) : "";
  const near = o.ears ? ear(o.ears[1][0], o.ears[1][1], o.earW || 6, o.earNear || coat, o.earIn) : "";
  const skull = p("M71 47C70 32 81 26 91 29C100 32 102 41 109 48C119 55 118 68 108 71C101 74 95 69 88 68C78 69 72 59 71 47Z", coat, edge());
  const muzzle = p("M101 52C108 49 118 56 117 63C116 71 107 74 101 69C96 64 96 55 101 52Z", o.muzzle || coat);
  let mouth = ln("M104 68q5 1.5 9 -2.5", o.lip || "#2a1a1a", 1.3);
  if (o.open === "bray") mouth = p("M97 64Q108 66 117 61Q117 78 105 80Q97 77 97 64Z", "#5a1a28", edge("#2a1014", 1)) + el(106, 75, 5.5, 3.2, "#f2808c") + p("M101 65.5h12l-1.5 4h-9Z", "#fffbe8") + ln("M105 66v3M109 66v3", "#b8a888", 0.7) + p("M96 66Q98 82 108 81Q114 80 117 71Q110 76 105 76Q99 75 96 66Z", o.muzzle || coat, edge());
  if (o.open === "flehmen") mouth = p("M101 66Q109 66 116 62Q115 73 106 74Q101 72 101 66Z", "#5a2028") + p("M103 65.5L114.5 62.5L114 67L104 69.5Z", "#fff6d8", edge("#8a7a50", 0.6)) + ln("M106.5 65v4M110 64v4", "#a89868", 0.7) + p("M100 63Q104 54 113 52Q121 53 117 61Q111 59 107 63Q103 66 100 63Z", o.muzzle || coat, edge("#0005"));
  return `${far}${skull}${o.face || ""}${muzzle}${o.overMuzzle || ""}${el(111, 57.5, 1.9, 2.5, o.nose || "#2a1a1e", `transform="rotate(-25 111 57.5)"`)}${mouth}${o.eyeBack || ""}${eye(89, 46, mood, { r: 5, rim: o.rim ?? 0.8, lid: o.lid })}${blush2(86, 58)}${near}${o.top || ""}`;
}
const blush2 = (x, y) => el(x, y, 4, 2.5, "#ff7f9c", `opacity=".45"`);
const EQ = { scarf: [71, 70, 14], hat: [86, 31, 0.78], pivot: [70, 72] };
function equine(k, mood, o, h) {
  const legs = quad(o.legX || [31, 67, 41, 76], o.legY || 92, { col: o.legCol || k.c, hoof: o.hoof, w: o.legW || 9.5, sock: o.sock, sockCol: o.sockCol, stripes: o.stripes, feather: o.feather }, { col: o.farCol || o.legCol || k.c });
  return {
    back: wrap("bd-wag", o.tail), far: legs.far,
    body: eqBody(k.c) + (o.coat || ""), near: legs.near,
    neck: eqNeck(o.neckCol || k.c) + (o.neckMarks || ""),
    head: (o.maneBack || "") + eqHead(k, mood, h) + (o.mane || ""),
    ...EQ,
  };
}

const rollBody = (r, k, mood, sig, headSvg, mane, spots) => {
  // Upside down in the straw: belly to the sky, four legs kicking, head lolling on the ground.
  const l = { col: k.c, hoof: "#241a18", w: 9.5 };
  r.back = el(60, 117, 52, 5, "#b8955c", `opacity=".45"`) + p("M22 106Q2 104 4 118Q16 110 22 118Q26 112 34 114Z", k.a);
  r.far = g("kick2", bent(36, 96, 202, 15, 128, 16, { ...l, col: k.a }) + bent(66, 94, 158, 15, 232, 16, { ...l, col: k.a }));
  r.body = p("M18 100C20 86 34 90 48 87C62 84 76 88 82 98C88 112 74 118 54 118C36 118 18 114 18 100Z", k.c, edge()) + el(49, 96, 22, 7, k.b, `opacity=".85"`) + (spots || "");
  r.near = g("kick", bent(33, 98, 142, 15, 70, 16, l) + bent(72, 98, 214, 15, 292, 15, l));
  r.neck = p("M66 94Q80 88 88 94L92 116Q76 120 66 112Z", k.c);
  r.head = tf("translate(5 45) rotate(6 92 50) scale(.97)", headSvg) + (mane || "");
  r.fx = g("dust", dust(12, 100, 1.1) + dust(108, 76, 0.7) + dust(20, 74, 0.55)) + ln("M28 56q8 -8 18 -6M72 50q10 0 15 8", "#fff", 2.2, `opacity=".85"`);
  r.cls = "bd-s-barn-roll";
  r.headRot = 0;
  r.headCls = "bd-s-barn-rollhead";
  r.hat = [91, 76, 0.75];
  r.scarf = [76, 100, 11];
};

function shetland(k, mood, sig) {
  const ears = [[[78, 34], [74, 19]], [[87, 32], [89, 16]]];
  const mane = p("M92 27C78 18 62 30 58 44C54 56 48 60 44 70Q54 68 56 64Q52 76 52 82Q62 76 66 68Q66 78 68 82Q76 72 76 60C76 46 80 36 92 27Z", k.a);
  const fore = p("M80 28Q90 18 102 30Q106 38 104 46Q100 38 97 36Q98 44 94 48Q93 39 88 36Q86 42 80 44Q84 36 80 28Z", k.a) + ln("M86 27q8 2 12 10", "#6a5048", 1);
  const head = { muzzle: k.b, ears, earIn: "#5a3426", eyeBack: "", top: fore };
  const r = equine(k, mood, {
    tail: p("M24 76C6 76 2 92 6 116Q12 108 14 114Q18 104 20 108Q20 92 30 86Z", k.a) + ln("M18 82Q8 94 10 108", "#6a5048", 1.2),
    legY: 96, legW: 11, legCol: k.a, farCol: "#140e0e", hoof: "#4a3a34",
    coat: el(46, 97, 20, 6, k.b, `opacity=".45"`),
    mane: mane,
  }, head);
  if (sig) {
    rollBody(r, k, "sleepy", sig, eqHead(k, mood === "love" ? "love" : "sleepy", head), p("M88 92Q70 94 66 106Q60 112 56 118Q68 116 72 112Q72 118 78 118Q82 108 90 104Z", k.a) + p("M96 74Q108 66 116 80Q110 78 108 82Q106 76 98 80Z", k.a));
    r.css = anim("roll", "Roll", 1.5, "0%,100%{transform:rotate(-4deg)}50%{transform:rotate(2deg)}", "72px 112px") + anim("kick", "Kick", 0.5, "0%,100%{transform:rotate(-8deg)}50%{transform:rotate(9deg)}", "52px 98px") + anim("kick2", "Kick2", 0.5, "0%,100%{transform:rotate(8deg)}50%{transform:rotate(-8deg)}", "52px 96px") + anim("dust", "Dust", 1.5, "0%,100%{opacity:1;transform:scale(1.03)}50%{opacity:.25;transform:scale(.9)}", "60px 100px") + anim("rollhead", "RollHead", 1.5, "0%,100%{transform:rotate(-3deg)}50%{transform:rotate(3deg)}", "80px 104px");
  }
  return r;
}

function exmoor(k, mood) {
  const mane = p("M90 28C76 22 64 36 60 50Q56 60 50 70Q58 68 61 64L60 74Q68 68 70 58C71 44 78 34 90 28Z", k.a) + p("M82 27Q94 22 98 34Q92 30 90 34Q88 29 82 30Z", k.a);
  return equine(k, mood, {
    // Exmoor "ice tail": a thick fan of short hair over the top of the tail.
    tail: p("M24 75C8 74 4 90 8 112Q13 106 15 110Q19 100 22 102Q21 90 30 84Z", k.a) + p("M28 72Q10 68 9 86Q14 82 16 87Q18 80 22 84Q23 78 28 80Z", k.a, edge("#6a503c", 1)),
    legY: 94, legW: 10.5, legCol: k.a, farCol: "#180f0c", hoof: "#3a2c24",
    coat: p("M28 101Q50 94 76 98Q70 105 54 105Q40 105 28 101Z", k.b),
    mane,
  }, {
    muzzle: k.b, ears: [[[78, 34], [75, 20]], [[87, 32], [89, 17]]], earIn: "#c8a880", earW: 5.5,
    eyeBack: el(89, 46, 9.6, 9, k.b) + el(89, 46.6, 7, 6.4, "#8a5c3a", `opacity=".35"`),
  });
}

function fjord(k, mood, sig) {
  // The clipped crescent mane: pale outer hair standing either side of a black centre stripe.
  const mane = p("M95 29C84 6 58 20 52 42Q48 56 44 68L56 76C60 62 62 48 70 39Q78 31 95 29Z", k.b, edge("#a88a58", 1.3)) + ln("M91 26C79 16 65 26 59 42Q54 56 50 70", k.a, 4.4) + ln("M84 19l2 7M75 20l3 8M66 26l5 6M59 35l7 4M55 45l7 3M52 55l7 3", "#c4a470", 0.9);
  const head = { muzzle: "#f2e2c0", ears: [[[77, 33], [72, 18]], [[88, 31], [91, 15]]], earFar: k.c, earIn: "#fbf0d8", nose: "#4a3428", face: ln("M85 31Q96 36 103 49", k.a, 1.6, `opacity=".55"`), open: sig ? "flehmen" : "",
    top: p("M70.5 21L72 18L75.5 23Z", k.a) + p("M91.5 19L91 15L88 20Z", k.a) + p("M81 28Q86 20 94 28Q88 26 86 33Q85 28 81 28Z", k.b) + ln("M86 26l1 5", k.a, 1.6) };
  const r = equine(k, mood, {
    tail: p("M24 76C8 78 4 94 8 116Q14 108 18 114Q22 96 30 86Z", k.b, edge("#a88a58", 1)) + ln("M22 81Q11 94 12 110", k.a, 3.6),
    legY: 94, legW: 11, legCol: k.c, farCol: "#b89458", hoof: "#2c221c", stripes: "#7a5a34",
    coat: ln("M22 76C30 65 40 66 52 69", k.a, 2.6) + el(48, 99, 20, 5, k.b, `opacity=".7"`),
    mane,
  }, head);
  if (sig) {
    Object.assign(r, { headRot: -24, headCls: "bd-s-barn-flehmen",
      fx: g("scent", ln("M104 14q6 -5 2 -10M112 22q8 -4 5 -11M96 10q5 -3 2 -7", "#fff", 2.2) + dots([[114, 34], [99, 20], [116, 6]], 1.6, "#fff8c0")) + tuft(106, 118) + dot(104, 106, 3.4, "#ff9ac0") + dot(104, 106, 1.3, "#ffe45a"),
      css: anim("flehmen", "Flehmen", 2.2, "0%,30%,100%{transform:rotate(-4deg)}65%{transform:rotate(6deg)}", "70px 72px") + drift("scent", "Scent", 1.2, "0,6px", "0,-6px") });
  }
  return r;
}

function falabella(k, mood, sig) {
  const spot = (list) => list.map(([x, y, rx, ry = rx * 0.8, a = 0]) => el(x, y, rx, ry, k.a, a ? `transform="rotate(${a} ${x} ${y})"` : "")).join("");
  const mane = p("M92 28C74 16 58 30 58 46Q60 52 52 56Q44 60 46 72Q52 64 60 66Q54 74 58 82Q62 72 70 68Q66 62 70 52C74 40 80 32 92 28Z", "#e8d4bc", edge("#a8886c", 1)) + ln("M82 28Q66 32 64 48Q62 58 52 62M68 56Q60 66 60 74", "#8a5c44", 1.6);
  const fore = p("M82 29Q94 18 103 36Q96 30 94 38Q92 30 86 34Q84 30 82 29Z", "#e8d4bc", edge("#a8886c", 0.9));
  const r = equine(k, mood, {
    tail: wrap("", p("M23 76C4 68 -1 90 5 112Q9 102 13 110Q12 96 20 102Q15 90 30 84Z", "#e8d4bc", edge("#a8886c", 1)) + ln("M20 78Q7 82 8 100", "#8a5c44", 1.6)),
    legY: 91, legW: 7, farCol: "#ded4c4", legCol: k.c, hoof: "#c8a488", legX: [32, 66, 43, 76],
    coat: spot([[28, 80, 4.2, 3.4, 20], [38, 74, 3, 2.4], [35, 91, 3.4, 4], [48, 83, 4.6, 3.6, -25], [60, 76, 2.4], [58, 94, 3, 2.6], [70, 86, 3.8, 3, 30], [25, 94, 2.2], [46, 97, 2], [75, 97, 1.8], [64, 87, 1.5], [41, 84, 1.4]]) + spot([[43, 106, 1.8], [75, 109, 1.5]]),
    neckMarks: spot([[72, 74, 3, 3.6, 20], [78, 62, 2], [66, 80, 1.7], [82, 80, 2.2]]),
    mane,
  }, { muzzle: "#e4bcae", nose: "#7a4a44", ears: [[[78, 34], [74, 17]], [[88, 31], [92, 13]]], earW: 4.8, earIn: "#e8b8a8", face: spot([[79, 40, 2.6, 2], [97, 38, 1.8], [76, 54, 2.2, 2.8], [98, 52, 1.2]]), overMuzzle: dots([[105, 66], [101, 61], [112, 66], [108, 52]], 0.9, "#8a5a50"), top: fore });
  if (sig) {
    const l = { col: k.c, hoof: "#c8a488", w: 7 };
    r.far = leg(66, 90, { ...l, col: "#ded4c4", len: 27, ang: -12 }) + g("buckleg", bent(30, 83, 55, 15, 128, 18, { ...l, w: 7.6, col: "#ded4c4" }));
    r.near = leg(76, 92, { ...l, len: 26, ang: -4 }) + g("buckleg", bent(34, 93, 82, 17, 104, 18, { ...l, w: 7.6 }));
    r.back = tf("rotate(62 24 77)", r.back);
    Object.assign(r, { pose: "translate(51 112) scale(.86) translate(-60 -112) rotate(17 76 112)", cls: "bd-s-barn-buck", headRot: 3, under: dust(24, 112, 1.2) + dust(44, 115, 0.8), fx: g("kickfx", ln("M4 40l8 6M2 54l10 2M14 28l6 8", "#fff", 2.6) + dots([[10, 96], [18, 88], [4, 104]], 1.8, "#d8c090")) + txt(98, 18, "yee!", 12, "#fff3a0"),
      css: anim("buck", "Buck", 1.1, "0%,25%,100%{transform:rotate(3deg)}55%,72%{transform:rotate(-14deg)}", "76px 112px") + anim("buckleg", "BuckLeg", 1.1, "0%,25%,100%{transform:rotate(5deg)}55%,72%{transform:rotate(-26deg)}", "34px 88px") + anim("kickfx", "KickFx", 1.1, "0%,30%,100%{opacity:1}55%,75%{opacity:0}", "") });
  }
  return r;
}

function donkey(k, mood, sig) {
  const ears = sig ? [[[78, 36], [52, 22]], [[85, 33], [66, 8]]] : [[[77, 34], [66, 4]], [[88, 31], [96, 1]]];
  const mane = p("M86 28L84 19L79 28L74 21L72 33L64 28L65 40L56 37L60 49L51 49L57 58L49 61L57 68C60 52 70 36 86 28Z", k.a);
  const head = { muzzle: k.b, ears, earW: 7.6, earIn: "#f2d8d0", nose: "#4a3a40", eyeBack: el(89, 46, 9.4, 9, k.b), open: sig ? "bray" : "",
    top: (sig ? "" : p("M66 4L66.5 13L72 11Z", k.a) + p("M96 1L90.5 10L95.5 12Z", k.a)) + p("M81 29l3 -7l2 6l4 -6l0 8Z", k.a) };
  const r = equine(k, mood, {
    tail: ln("M23 77Q10 84 11 100", k.c, 4.6) + p("M11 94Q3 104 9 117Q12 110 15 114Q19 104 14 94Z", k.a),
    legY: 94, legW: 9, farCol: "#7e7a82", hoof: "#3a3238",
    coat: p("M27 100Q50 92 78 97Q70 105 54 105Q38 105 27 100Z", k.b) + ln("M21 76C30 65 40 66 52 69Q56 70 58 70", k.a, 3) ,
    // The donkey cross: a shoulder stripe meeting the dorsal stripe.
    neckMarks: ln("M55 69Q62 78 61 91", k.a, 3.8),
    mane,
  }, head);
  if (sig) {
    Object.assign(r, { headRot: -30, headCls: "bd-s-barn-bray", sigScarf: [72, 70, 13],
      fx: g("braywave", ln("M108 42q7 8 2 18M113 36q10 13 3 28", "#fff", 2.4)) + g("braytext", txt(20, 44, "HEE", 14, "#fff3a0") + txt(25, 59, "HAW!", 14, "#ffd25a")),
      css: anim("bray", "Bray", 1, "0%,28%,100%{transform:rotate(-4deg)}50%{transform:rotate(7deg)}72%{transform:rotate(2deg)}", "70px 72px") + anim("braywave", "BrayWave", 0.5, "0%,100%{opacity:1;transform:translate(1px,0)}50%{opacity:.25;transform:translate(-3px,0)}", "") + anim("braytext", "BrayText", 1, "0%,100%{transform:scale(1.06)}50%{transform:scale(.88)}", "24px 50px") });
  }
  return r;
}

function poitou(k, mood, sig) {
  // Cadenettes: the long, felted locks of a Poitou donkey's unbrushed coat.
  const shagLight = "#6e4a36";
  const earL = ear([77, 36], sig ? [50, 25] : [58, 11], 8.4, k.c, "#8a6450") + tufts([[67, 24, 59, 33, 2.4], [72, 30, 68, 40, 2.4]], k.c, edge("#8a6248", 0.9));
  const earR = ear([88, 31], sig ? [109, 20] : [101, 3], 8.4, k.c, "#8a6450") + tufts([[96, 18, 102, 28, 2.4], [92, 25, 96, 36, 2.4]], k.c, edge("#8a6248", 0.9));
  const ears = sig ? g("earL", earL) + g("earR", earR) : earL + earR;
  const locks = (list) => tufts(list, k.c, edge("#8a6248", 1));
  const coat = locks([[27, 78, 21, 104], [38, 74, 33, 102, 5], [50, 74, 47, 106, 5], [62, 76, 61, 103, 5], [74, 78, 78, 106], [32, 88, 28, 114, 5], [44, 90, 42, 112, 5], [56, 90, 57, 114, 5], [68, 90, 70, 111, 5]]) + strands([[34, 78, 18], [55, 80, 18], [68, 82, 16], [43, 76, 16]], 1.6, shagLight, 1.4);
  const mane = locks([[84, 31, 70, 50], [74, 36, 58, 60], [66, 48, 52, 74, 5], [62, 60, 54, 86, 5], [76, 64, 74, 86]]) + strands([[68, 44, 16], [62, 62, 16]], 1.6, shagLight, 1.3);
  const fore = locks([[85, 31, 84, 44, 3.4], [91, 29, 99, 42, 3.4], [80, 33, 75, 45, 3]]);
  const r = equine(k, mood, {
    tail: locks([[22, 76, 6, 108, 5], [26, 80, 16, 114, 4.5], [20, 78, 4, 94, 4]]),
    legY: 93, legW: 11.5, farCol: k.a, hoof: "#18100c", feather: k.c,
    coat, mane,
  }, { muzzle: k.b, nose: "#4a342c", lid: "#f6e8d8", rim: 1.2, eyeBack: el(89, 46.5, 9, 8.4, k.b), earW: 8, top: sig ? fore + ears : ears + fore });
  r.hat = [87, 33, 0.72];
  if (sig) {
    Object.assign(r, { headCls: "bd-s-barn-tilt", hat: [86, 35, 0.6],
      fx: g("radarL", ln("M45 18q-6 6 -2 14M38 12q-10 10 -4 24", "#ffe88a", 2.4)) + g("radarR", ln("M113 28q6 5 2 13M108 38q4 3 2 7", "#9fe4ff", 2.4)) + g("radarR", note(12, 46, "#fff")) + txt(32, 62, "?", 18, "#fff"),
      css: anim("earL", "EarL", 1.8, "0%,15%{transform:rotate(0)}35%,55%{transform:rotate(-20deg)}75%,100%{transform:rotate(24deg)}", "77px 36px") + anim("earR", "EarR", 1.3, "0%,20%{transform:rotate(6deg)}45%,65%{transform:rotate(-34deg)}90%,100%{transform:rotate(6deg)}", "88px 31px") + anim("tilt", "Tilt", 2.6, "0%,100%{transform:rotate(-4deg)}50%{transform:rotate(5deg)}", "74px 66px") + pulse("radarL", "RadarL", 1.2, 0.15) + pulse("radarR", "RadarR", 0.9, 0.15) });
  }
  return r;
}

// ====================================================================================
// Goats
// ====================================================================================
/** Front-facing goat face centred on (60, 50). */
function goatFace(k, mood, o) {
  const coat = o.coat || k.c;
  const ears = o.ears ?? both(ear([43, 42], [17, 41], 7.5, o.earCol || coat, "#e8a8a0"));
  const skull = p("M39 42C39 27 49 23 60 23C71 23 81 27 81 42C81 52 75 58 72 66Q69 76 60 76Q51 76 48 66C45 58 39 52 39 42Z", coat, edge());
  return `${o.behind || ""}${o.horns || ""}${ears}${skull}${o.marks || ""}${el(60, 65.5, 11, 8.5, o.muzzle || k.b)}${o.bridge || ""}${nostrils(56, 64, 63, o.nose || "#4a2a2e", 1.4, 2)}${smile(60, 69, o.lip || "#3a2024", 3.4)}${o.eyeBack || ""}${barEye(49, 45, mood, o.iris || "#e8b030")}${barEye(71, 45, mood, o.iris || "#e8b030")}${blush(44, 76, 57)}${o.top || ""}`;
}
const goatBody = (col) => p("M19 83C19 69 32 67 46 70C60 72 70 67 79 74C88 86 82 101 66 103C50 105 34 104 27 100C21 96 19 90 19 83Z", col, edge());
/** Side body with a front-facing head, shifted to the right. */
function goat34(k, mood, o, face) {
  const at = (s) => tf("translate(83 50) scale(.82) translate(-60 -50)", s);
  const legs = quad([31, 62, 40, 73], o.legY || 93, { col: o.legCol || k.c, hoof: o.hoof || "#3a2a26", w: o.legW || 8.5, cloven: true, sock: o.sock, sockCol: o.sockCol }, { col: o.farCol || o.legCol || k.c });
  return {
    back: wrap("bd-wag", o.tail ?? p("M24 77Q10 70 14 58Q24 62 31 74Z", k.c, edge())), far: legs.far,
    body: goatBody(k.c) + (o.coat || ""), near: legs.near,
    neck: p("M56 76Q66 58 78 58L92 66Q86 84 74 92Q62 88 56 76Z", o.neckCol || k.c) + (o.neckMarks || ""),
    head: at(goatFace(k, mood, face)),
    hat: [83, 31, 0.74], scarf: [79, 76, 12], pivot: [76, 76],
  };
}

function nigerian(k, mood, sig) {
  const face = { iris: "#7cc8f4", muzzle: k.b,
    horns: both(horn([50, 28], [44, 12], [34, 13], 3.6, "#c8b498", "#8a7458", 0.6, 3)),
    ears: both(ear([43, 36], [24, 22], 7.4, k.c, "#f2b4a0")),
    marks: p("M60 23Q68 24 65 36Q64 48 68 60L52 60Q56 48 55 36Q52 24 60 23Z", k.b) + both(el(43, 52, 4, 7, k.a, `opacity=".8" transform="rotate(-24 43 52)"`)),
    top: p("M55 75Q54 84 60 88Q59 82 63 86Q66 80 65 75Q60 78 55 75Z", k.b, edge("#a88a68", 0.8)) };
  const r = goat34(k, mood, { legY: 94, sock: 12, sockCol: k.b,
    coat: p("M44 70Q54 74 52 86Q44 94 36 86Q34 74 44 70Z", k.b) + el(25, 82, 5, 9, k.a) + el(64, 92, 8, 6, k.a),
    farCol: "#a86c38" }, face);
  if (sig) {
    const l = { col: k.c, hoof: "#3a2a26", w: 8.5, cloven: true };
    r.far = leg(31, 90, { ...l, col: "#a86c38", len: 28, ang: 22 }) + bent(66, 90, -40, 13, 55, 13, { ...l, col: "#a86c38" });
    r.near = leg(41, 93, { ...l, len: 26, ang: 30, sock: 11, sockCol: k.b }) + bent(73, 92, -58, 14, 45, 14, { ...l, sock: 8, sockCol: k.b });
    Object.assign(r, { pose: "translate(2 0) rotate(-24 36 112)", cls: "bd-s-barn-butt", headRot: 27, under: el(34, 117, 24, 3, "#00000022"),
      fx: g("bonk", burst(108, 66, 10) + txt(100, 17, "bonk!", 12, "#fff3a0")) + ln("M5 74l9 4M3 90l10 1M12 60l8 6", "#fff", 2.4),
      css: anim("butt", "Butt", 1.2, "0%,12%,100%{transform:rotate(-4deg)}40%{transform:rotate(-7deg)}65%,78%{transform:rotate(16deg)}", "36px 112px", "cubic-bezier(.5,0,.8,.6)") + anim("bonk", "Bonk", 1.2, "0%,18%{opacity:1;transform:scale(1)}30%,58%{opacity:0;transform:scale(.4)}68%,100%{opacity:1;transform:scale(1)}", "108px 66px") });
  }
  return r;
}

function fainting(k, mood, sig) {
  // Myotonic goats: high, prominent eyes, ripply side-held ears and a bold black-and-white coat.
  const faceOf = (m) => ({ iris: "#d8c060", muzzle: "#f2d4cc", lid: "#fff",
    horns: both(horn([51, 28], [46, 17], [38, 15], 3, "#a89c94", "#6a5e58", 0.6, 2)),
    ears: both(p("M43 40Q34 33 27 37Q22 34 14 40Q20 48 28 47Q36 52 44 48Z", k.c, edge("#0006")) + p("M38 42Q30 39 21 41Q28 45 38 45Z", "#e8a8a0")),
    marks: p("M60 23Q66 24 64 34Q66 48 72 58Q70 68 60 70Q50 68 48 58Q54 48 56 34Q54 24 60 23Z", k.b),
    eyeBack: both(el(48.5, 44.5, 9, 8.6, k.c, edge("#8a7e88", 1.2))),
    top: ln("M41 35q7 -5 15 -1M79 35q-7 -5 -15 -1", "#8a7e88", 1.6) });
  const r = goat34(k, mood, { sock: 11, sockCol: k.b, hoof: "#c8a890",
    coat: p("M42 69.5Q56 72 62 71Q68 86 60 103Q50 104 42 103.5Q48 86 42 69.5Z", k.b) + el(26, 92, 4.5, 5.5, k.b),
    farCol: k.a, tail: p("M24 77Q10 70 14 58Q24 62 31 74Z", k.b, edge()) }, faceOf(mood));
  if (sig) {
    // Gone stiff as a board and tipped right over: legs straight out, eyes wide, still wide awake.
    const l = { col: k.c, hoof: "#c8a890", w: 8.5, cloven: true, sock: 11, sockCol: k.b };
    const wide = mood === "happy" || mood === "sad";
    r.back = p("M20 96Q4 94 2 82Q16 82 26 90Z", k.b, edge());
    r.far = leg(32, 92, { ...l, col: k.a, len: 31, ang: 158 }) + leg(64, 92, { ...l, col: k.a, len: 31, ang: 196 });
    r.body = tf("translate(0 14)", goatBody(k.c) + p("M42 69.5Q56 72 62 71Q68 86 60 103Q50 104 42 103.5Q48 86 42 69.5Z", k.b));
    r.near = leg(37, 97, { ...l, len: 33, ang: 132 }) + leg(70, 96, { ...l, len: 32, ang: 224 });
    r.neck = p("M66 90Q80 84 90 92L88 112Q74 116 66 108Z", k.c);
    const face = faceOf(mood);
    r.head = tf("translate(85 91) rotate(14) scale(.76) translate(-60 -50)", goatFace(k, mood, face) + (wide ? both(dot(49, 45, 7, "#fff") + dot(49, 45, 2.4, "#14131f")) + el(60, 71, 4, 4.6, "#5a1a28") : ""));
    Object.assign(r, { cls: "bd-s-barn-faint", hat: [93, 73, 0.66], scarf: [73, 99, 11],
      fx: g("startle", txt(100, 40, "!", 30, "#ffd84d") + ln("M82 38l-6 -9M114 52l5 -6", "#fff", 2.4)) + g("daze", burst(66, 60, 5, "#fff3a0") + burst(14, 50, 4.4, "#fff3a0")),
      css: anim("faint", "Faint", 2.6, "0%,58%,100%{transform:translateY(0) rotate(0)}70%{transform:translateY(-14px) rotate(-9deg)}76%{transform:translateY(-16px) rotate(-9deg) translateX(2px)}82%{transform:translateY(-14px) rotate(-9deg)}92%{transform:translateY(0) rotate(0)}", "55px 112px") + anim("startle", "Startle", 2.6, "0%,60%,100%{transform:scale(1)}72%{transform:scale(1.2)}", "100px 30px") + anim("daze", "Daze", 0.9, "0%,100%{opacity:1;transform:translateY(-3px)}50%{opacity:.25;transform:translateY(0)}", "") });
  }
  return r;
}

function nubian(k, mood) {
  // Long bell ears that hang past the muzzle and a strongly convex Roman nose.
  const spots = (l) => l.map(([x, y, r]) => el(x, y, r, r * 0.8, k.b, `opacity=".95"`)).join("");
  const legs = leg(35, 96, { col: k.a, w: 9, cloven: true }) + leg(85, 96, { col: k.a, w: 9, cloven: true });
  const front = leg(49, 94, { col: k.c, w: 9.5, cloven: true, sock: 10, sockCol: k.b }) + leg(71, 94, { col: k.c, w: 9.5, cloven: true, sock: 10, sockCol: k.b });
  const ears = both(p("M44 32C27 27 14 42 14 60C14 74 9 83 13 90Q23 97 30 84C37 69 31 52 43 39Z", k.c, edge("#0005")) + p("M37 37C26 40 21 52 21 65Q21 77 18 84Q25 84 28 73C31 61 28 49 37 37Z", k.a, `opacity=".85"`) + spots([[21, 50, 2.4], [19, 72, 1.8]]));
  return {
    back: wrap("bd-wag", p("M86 84Q104 76 102 64Q90 68 82 80Z", k.c, edge())), far: legs,
    body: el(60, 90, 29, 21, k.c, edge()) + spots([[38, 84, 4], [80, 94, 5], [74, 80, 2.6], [43, 100, 2.4]]),
    near: front,
    head: p("M40 38C40 22 50 18 60 18C70 18 80 22 80 38C80 50 74 56 73 64Q72 77 60 77Q48 77 47 64C46 56 40 50 40 38Z", k.c, edge()) + spots([[48, 27, 3.4], [74, 54, 2.2], [69, 24, 1.8]])
      + p("M54 36Q60 30 66 36Q71 52 69 62Q60 68 51 62Q49 52 54 36Z", "#c06c3c", edge("#6a3018", 1.4)) + ln("M57 38Q54 50 56 58", "#e8a478", 2.6) + el(60, 68, 11.5, 8, k.b) + nostrils(55.5, 64.5, 65.5) + smile(60, 71.5, "#4a2418", 3)
      + barEye(47.5, 44.5, mood, "#d89a30") + barEye(72.5, 44.5, mood, "#d89a30") + blush(43, 77, 56) + ears
      + p("M52 20q4 -8 8 -2q4 -6 8 2q-8 3 -16 0Z", k.a),
    hat: [60, 23, 0.85], scarf: [60, 76, 16],
  };
}

/** Side-view goat head with beard and scimitar horns, facing right. */
function blackneck(k, mood, sig) {
  const hair = "#4a424c";
  const l = { w: 9.5, cloven: true, hoof: "#5a4a3a" };
  const legs = quad([30, 66, 40, 77], 94, { ...l, col: k.c }, { col: "#0e0c10" });
  // Rear half is white, front half black: the split falls just behind the shoulders.
  const white = "#d8d0c4";
  const far = leg(30, 92, { ...l, col: white, len: 25 }) + leg(66, 92, { ...l, col: "#0e0c10", len: 25 });
  const near = leg(40, 94, { ...l, col: k.b, len: 24 }) + leg(77, 94, { ...l, col: k.c, len: 24 });
  const body = goatBody(k.c) + p("M19 83C19 69 32 67 46 70L56 71Q51 80 55 87Q50 94 53 104Q36 104 27 100C21 96 19 90 19 83Z", k.b, edge())
    + tufts([[27, 94, 23, 110, 5], [38, 98, 36, 113, 5], [49, 98, 49, 112, 4.5]], k.b, edge("#c4bcac", 0.9)) + tufts([[58, 98, 60, 112, 5], [70, 96, 74, 110, 5]], k.c, edge("#4a424c", 0.9)) + strands([[28, 78, 18], [40, 76, 18]], 1.4, "#d4ccbc", 1.2) + strands([[63, 78, 18], [73, 80, 16]], 1.4, hair, 1.2);
  const hornBack = horn([78, 33], [66, -2], [38, 14], 5.6, "#8a7050", "#4a3820", 0.7, 5);
  const head = hornBack + ear([78, 42], [60, 52], 5.4, "#18141a", "#6a5058")
    + p("M72 46C70 32 82 26 92 30C101 34 105 46 113 55C118 63 112 72 104 71C96 70 92 68 86 68C76 68 73 58 72 46Z", k.c, edge("#5a525c", 1.2))
    + p("M92 67Q92 84 99 90Q99 82 103 86Q108 78 105 70Z", k.c, edge("#5a525c")) + tufts([[81, 29, 77, 40, 3], [88, 29, 92, 40, 3.4]], "#2e2830")
    + el(110, 61, 1.6, 2.3, "#6a5660", `transform="rotate(-30 110 61)"`) + ln("M104 67q5 0 8 -3", "#7a6a74", 1.3)
    + barEye(91, 46, mood, "#e8a828", 5.2) + blush2(89, 58) + horn([86, 31], [78, 0], [49, 5], 6.4, k.a, "#5a4830", 0.8, 5);
  const r = {
    back: wrap("bd-wag", p("M24 76Q9 66 12 54Q16 62 20 60Q22 68 31 73Z", k.b, edge())), far, body, near,
    neck: p("M52 74Q62 52 78 38L95 66Q86 74 80 92Q64 90 52 74Z", k.c) + strands([[68, 62, 16], [76, 68, 14]], 1.4, hair, 1.2), head,
    hat: [88, 31, 0.7], scarf: [76, 70, 13], pivot: [74, 66],
  };
  if (sig) {
    r.far = leg(30, 92, { ...l, col: white, len: 25, ang: 6 }) + leg(66, 88, { ...l, col: "#0e0c10", len: 29, ang: -54 });
    r.near = leg(41, 93, { ...l, col: k.b, len: 24, ang: 8 }) + leg(75, 91, { ...l, col: k.c, len: 30, ang: -64 });
    const bark = "#8a5c34";
    Object.assign(r, { pose: "translate(60 118) scale(.94) translate(-57 -118) rotate(-27 36 112)", cls: "bd-s-barn-browse", headRot: 8,
      under: p("M96 118Q99 90 97 66Q96 44 104 22L116 22Q110 46 112 68Q111 94 116 118Z", bark, edge("#4a2c14", 1.4)) + ln("M102 96q4 -8 2 -18M107 60q-3 -10 1 -20", "#5a3818", 1.4) + ln("M100 34Q90 26 80 24", bark, 4),
      fx: g("leaves", fluff(100, 12, 18, 11, 9, "#5aa644", edge("#2e6a24", 1.2)) + fluff(84, 22, 9, 7, 7, "#72bc50", edge("#2e6a24", 1)) + dots([[96, 8], [110, 14], [102, 18]], 2, "#a8dc78")) + g("leaffall", el(66, 46, 4, 2.2, "#72bc50", `transform="rotate(30 66 46)"`) + el(112, 44, 4, 2.2, "#5aa644", `transform="rotate(-35 112 44)"`)),
      css: anim("browse", "Browse", 1.6, "0%,100%{transform:rotate(3deg)}45%,60%{transform:rotate(-3deg)}", "36px 112px") + anim("leaves", "Leaves", 0.4, "0%,100%{transform:rotate(-2deg)}50%{transform:rotate(2.5deg)}", "102px 22px") + drift("leaffall", "LeafFall", 1.6, "0,-8px", "-5px,32px") });
  }
  return r;
}

function angora(k, mood) {
  const rim = k.a, core = k.c;
  const r = goat34(k, mood, { legY: 96, legCol: "#e8dcc8", farCol: "#c8b89c", hoof: "#8a6a4a",
    coat: ringlets([[24, 76, 28], [33, 72, 32], [43, 74, 34], [53, 76, 32], [63, 76, 30], [73, 80, 24], [29, 84, 28], [39, 86, 27], [49, 88, 25], [59, 86, 27], [69, 86, 22]], rim, core, 6.6, 3.4),
    neckMarks: ringlets([[62, 66, 24], [70, 68, 26], [80, 70, 22]], rim, core, 6, 3),
    tail: ringlets([[20, 70, 20], [15, 68, 16]], rim, core, 6, 3) },
    { iris: "#d8a840", muzzle: "#f4e0d4", coat: "#f0e6d4",
      horns: both(horn([49, 29], [36, 2], [27, 18], 4.8, "#c8a878", "#8a6a44", 2.6, 4) + horn([27, 18], [22, 30], [17, 19], 2.8, "#c8a878", "#8a6a44", 0.6, 2)),
      ears: both(ear([42, 42], [20, 62], 7, "#f0e6d4", "#eab4a8")),
      top: ringlets([[50, 24, 17], [57, 22, 19], [64, 22, 18], [70, 24, 15]], rim, core, 5, 2.6) + p("M55 74Q53 86 60 92Q59 85 63 88Q67 82 65 74Z", core, edge(rim, 1)) });
  r.hat = [83, 29, 0.72];
  return r;
}

// ====================================================================================
// Sheep (front-sitting woolly rig)
// ====================================================================================
function sheepLegs(col, back, o = {}) {
  const base = { w: 10, cloven: true, hoof: "#2a2226", ...o };
  return { far: leg(36, 96, { ...base, col: back }) + leg(84, 96, { ...base, col: back }), near: leg(49, 96, { ...base, col }) + leg(71, 96, { ...base, col }) };
}
const sheepRig = (legs, o) => ({ far: legs.far, near: legs.near, hat: [60, 28, 0.85], scarf: [60, 76, 16], pivot: [60, 72], ...o });

function suffolk(k, mood, sig) {
  const dk = k.a, lid = "#f6f0e8";
  const stipple = dots([[36, 80], [42, 90], [34, 94], [50, 100], [62, 103], [74, 99], [84, 90], [80, 80], [88, 98], [41, 102], [70, 90], [52, 92]], 1, "#c8bc9c");
  const legs = sheepLegs(dk, "#171214", { hoof: "#100c0e" });
  const jaw = (extra = "") => el(60, 64, 12.5, 10, "#3a3236") + nostrils(55.5, 64.5, 61, "#0c080a") + ln("M60 63v4", "#0c080a", 1.2) + extra;
  const mouth = sig
    ? g("chew", jaw(el(61, 70, 5.4, 2.8, "#6a2830") + ln("M63 70Q76 70 84 62M64 71Q74 76 82 76", "#5aa63c", 2.4) + el(85, 61, 3.4, 1.8, "#72bc50", `transform="rotate(-35 85 61)"`)))
    : jaw(smile(60, 68.5, "#a8949c", 3));
  const head = both(ear([43, 40], [14, 54], 8, dk, "#6a4a52")) + p("M42 42C42 29 50 25 60 25C70 25 78 29 78 42C78 52 74 56 73 62Q71 74 60 74Q49 74 47 62C46 56 42 52 42 42Z", dk, edge("#6a5e64", 1.2))
    + ln("M52 31Q60 27 68 31", "#5a4e54", 2) + mouth + eye(49.5, 46, mood, { r: 5, rim: 1.6, lid }) + eye(70.5, 46, mood, { r: 5, rim: 1.6, lid }) + blush(45, 75, 57);
  const r = sheepRig(legs, {
    body: fluff(60, 88, 33, 22, 26, k.c, edge("#b8a884", 1.3), 1.07) + stipple + el(60, 75, 21, 5, "#00000012"),
    head,
  });
  if (sig) {
    Object.assign(r, { headRot: 7, headCls: "bd-s-barn-cudhead",
      front: g("cud", el(66, 90, 6, 4.6, "#a8c878", edge("#5a7a38", 1))),
      fx: g("chewfx", ln("M30 62q-6 4 -3 9M92 72q7 3 6 9", "#fff", 2.2)) + txt(100, 24, "chew", 11, "#e8ffc0") + txt(20, 20, "chew", 9, "#e8ffc0") + tuft(100, 118) + tuft(18, 118),
      css: anim("chew", "Chew", 0.75, "0%,100%{transform:translate(-4.5px,0)}25%{transform:translate(0,2px)}50%{transform:translate(4.5px,0)}75%{transform:translate(0,-1px)}", "") + anim("cud", "Cud", 2.4, "0%{opacity:1;transform:translateY(-4px)}30%{opacity:1;transform:translateY(-18px)}40%{opacity:0;transform:translateY(-22px)}50%{opacity:0;transform:translateY(8px)}70%{opacity:1;transform:translateY(5px)}100%{opacity:1;transform:translateY(-4px)}", "") + anim("cudhead", "CudHead", 1.5, "0%,100%{transform:rotate(-2deg)}50%{transform:rotate(2deg)}", "60px 72px") + pulse("chewfx", "ChewFx", 0.75) });
  }
  return r;
}

function babydoll(k, mood, sig) {
  const face = k.a;
  const wool = (x, y, rx, ry, n) => fluff(x, y, rx, ry, n, k.c, edge("#cdb88c", 1.3), 1.14);
  const head = both(el(32, 38, 9, 7.4, face, `${edge("#5a4a3c")} transform="rotate(-24 32 38)"`) + el(33, 38.5, 5, 4, "#e8aca0", `transform="rotate(-24 33 38.5)"`))
    + wool(60, 48, 28, 27, 18) + el(60, 55, 18, 17, face) + el(60, 63, 11, 8, "#b49c88") + nostrils(56.5, 63.5, 60.5, "#3a2a28", 1.3, 1.6) + ln("M60 62v3.4", "#4a3430", 1.2) + smile(60, 65.5, "#4a3430", 3.6)
    + eye(50.5, 51, mood, { r: 4.8, rim: 1.2 }) + eye(69.5, 51, mood, { r: 4.8, rim: 1.2 }) + blush(46, 74, 60)
    + fluff(60, 34, 18, 9, 11, k.b, edge("#cdb88c", 1), 1.2) + curls([[52, 33], [61, 30], [69, 35]], 2.2, "#d4bc90");
  const r = sheepRig(sheepLegs(face, "#7a6454", { w: 11, len: 20 }), {
    body: wool(60, 90, 32, 20, 18) + curls([[35, 86], [40, 100], [80, 98], [86, 85], [52, 102], [68, 103], [60, 92], [31, 94]], 2.4, "#d4bc90"),
    head,
  });
  r.hat = [60, 24, 0.88];
  if (sig) {
    const o = { w: 11, cloven: true, hoof: "#2a2226" };
    r.far = leg(36, 94, { ...o, col: "#7a6454", len: 21, ang: 22 }) + leg(84, 94, { ...o, col: "#7a6454", len: 21, ang: -22 });
    r.near = leg(49, 96, { ...o, col: face, len: 23, ang: 7 }) + leg(71, 96, { ...o, col: face, len: 23, ang: -7 });
    Object.assign(r, { pose: "translate(0 -8)", cls: "bd-s-barn-stot", hat: [60, 27, 0.74],
      under: g("stotshadow", el(60, 119, 22, 3.2, "#00000030")),
      fx: g("stotfx", ln("M36 110l-5 8M60 112v8M84 110l5 8M18 96q-6 6 -4 13M102 96q6 6 4 13", "#fff", 2.4)) + txt(102, 24, "boing!", 11, "#fff3a0"),
      css: anim("stot", "Stot", 0.8, "0%,100%{transform:translateY(-5px)}32%{transform:translateY(3px) scale(.97,1.04)}50%{transform:translateY(8px) scale(1.06,.92)}68%{transform:translateY(3px) scale(.98,1.02)}", "60px 112px") + anim("stotshadow", "StotShadow", 0.8, "0%,100%{transform:scale(.75)}50%{transform:scale(1.4)}", "60px 119px") + pulse("stotfx", "StotFx", 0.8, 0) });
  }
  return r;
}

function zwartbles(k, mood) {
  const dk = k.c, white = k.b;
  const o = { w: 10, cloven: true, hoof: "#3a2e2a" };
  const far = leg(36, 96, { ...o, col: k.a, sock: 13, sockCol: "#d8d0c4" }) + leg(84, 96, { ...o, col: k.a, sock: 13, sockCol: "#d8d0c4" });
  const near = leg(49, 96, { ...o, col: dk, sock: 15, sockCol: white }) + leg(71, 96, { ...o, col: dk, sock: 15, sockCol: white });
  return sheepRig({ far, near }, {
    // The long undocked tail ends in a white tip.
    back: wrap("bd-wag", p("M84 80Q108 78 108 102Q108 112 102 116Q96 108 96 100Q94 92 82 92Z", dk, edge("#6a5448")) + fluff(103, 109, 6.4, 8, 9, white, edge("#b8ac9c", 1))),
    body: fluff(60, 88, 31, 22, 17, dk, edge("#6a5448", 1.3), 1.12) + curls([[38, 82], [44, 96], [78, 82], [82, 96], [60, 101], [34, 91]], 2.2, "#6a5044"),
    head: both(ear([43, 38], [18, 32], 7.4, dk, "#8a5a58")) + p("M40 40C40 25 50 22 60 22C70 22 80 25 80 40C80 50 75 56 73 63Q71 76 60 76Q49 76 47 63C45 56 40 50 40 40Z", dk, edge("#6a5448", 1.3))
      + p("M60 22Q70 23 66 34Q64 44 69 55Q73 68 67 73Q60 78 53 73Q47 68 51 55Q56 44 54 34Q50 23 60 22Z", white) + nostrils(55.5, 64.5, 65, "#7a4a4c") + smile(60, 69.5, "#6a4448", 3.4)
      + eye(47.5, 45, mood, { r: 4.8, rim: 1.4, lid: "#f4ece0" }) + eye(72.5, 45, mood, { r: 4.8, rim: 1.4, lid: "#f4ece0" }) + blush(45, 75, 57) + fluff(60, 22, 11, 5.4, 8, "#4a382e", edge("#6a5448", 0.8), 1.25),
    hat: [60, 25, 0.85],
  });
}

function valais(k, mood) {
  const blk = k.a, wool = (x, y, rx, ry, n, b = 1.14) => fluff(x, y, rx, ry, n, k.c, edge("#c8bca4", 1.3), b);
  const o = { w: 11, cloven: true, hoof: blk };
  const legs = {
    far: [35, 85].map((x) => leg(x, 96, { ...o, col: "#d8d0c0", knee: "#38323a", sock: 10, sockCol: "#38323a" })).join(""),
    near: [48, 72].map((x) => leg(x, 95, { ...o, col: k.b, knee: blk, sock: 11, sockCol: blk }) + curls([[x - 2, 98]], 1.6, "#d4c8ac", 1)).join(""),
  };
  // Heavy spiral horns coiling out from the sides of the head.
  const curl = horn([44, 33], [18, 18], [14, 42], 6.2, "#d8bc8c", "#8a6a40", 4.4, 5) + horn([14, 42], [12, 60], [28, 56], 4.4, "#d8bc8c", "#8a6a40", 2.8, 4) + horn([28, 56], [36, 52], [30, 45], 2.8, "#d8bc8c", "#8a6a40", 0.8, 2);
  return sheepRig(legs, {
    body: wool(60, 89, 34, 23, 20) + curls([[32, 86], [39, 99], [52, 104], [68, 104], [81, 99], [88, 85], [48, 90], [72, 91], [60, 96]], 2.6, "#d4c8ac", 1.3),
    head: wool(60, 38, 26, 20, 16) + both(curl) + p("M42 44C44 36 50 40 54 36Q60 32 66 36C70 40 76 36 78 44C80 56 76 68 70 73Q60 80 50 73C44 68 40 56 42 44Z", blk, edge("#00000060"))
      + both(ear([45, 49], [21, 66], 7, blk, "#4a3e46")) + el(60, 67, 11, 8, "#34303a") + nostrils(55.5, 64.5, 65, "#08060a") + smile(60, 70, "#8a7e8a", 3.4)
      + eye(50, 49.5, mood, { r: 4.8, rim: 1.8, lid: "#fff" }) + eye(70, 49.5, mood, { r: 4.8, rim: 1.8, lid: "#fff" }) + blush(46, 74, 60)
      + wool(60, 30, 17, 11.5, 12, 1.22) + curls([[51, 30], [60, 25], [68, 31], [58, 34]], 2.4, "#d4c8ac"),
    hat: [60, 22, 0.84], scarf: [60, 77, 17],
  });
}

function jacob(k, mood) {
  const blk = k.a, o = { w: 9.5, cloven: true, hoof: "#241c1a" };
  const legs = {
    far: leg(36, 96, { ...o, col: "#ded4c0" }) + leg(84, 96, { ...o, col: blk }),
    near: leg(49, 96, { ...o, col: k.c, knee: blk }) + leg(71, 96, { ...o, col: k.c, sock: 9, sockCol: blk }),
  };
  const side = horn([45, 36], [18, 28], [19, 54], 5, "#5a4a40", "#c8b4a0", 2.6, 4) + horn([19, 54], [20, 66], [32, 62], 2.6, "#5a4a40", "#c8b4a0", 0.7, 2);
  return sheepRig(legs, {
    body: fluff(60, 88, 32, 22, 16, k.c, edge("#c4b498", 1.3), 1.12) + p("M30 78Q42 68 48 76Q54 86 44 90Q40 98 32 94Q26 86 30 78Z", blk) + p("M74 92Q86 82 90 90Q92 100 82 105Q72 106 70 100Z", blk) + el(77, 74, 6, 4.4, blk) + curls([[56, 98], [66, 88], [38, 100]], 2.4, "#c8b898") + curls([[37, 80], [82, 96]], 2.4, "#5a4a46"),
    head: both(side) + horn([52, 29], [44, 12], [36, 3], 4.6, "#6a584a", "#c8b4a0", 0.7, 4) + horn([68, 29], [76, 10], [88, 5], 4.6, "#6a584a", "#c8b4a0", 0.7, 4)
      + both(ear([43, 46], [23, 60], 6.6, blk, "#8a5a58"))
      + p("M41 41C41 27 50 24 60 24C70 24 79 27 79 41C79 51 74 57 72 64Q70 76 60 76Q50 76 48 64C46 57 41 51 41 41Z", k.c, edge("#a8987c", 1.2))
      + both(p("M43 34Q52 30 55 40Q57 50 52 58Q46 56 43 48Q40 40 43 34Z", blk)) + el(60, 68, 10, 7, "#3a2e2c") + nostrils(56, 64, 66, "#0c0808") + smile(60, 70.5, "#c8b0a8", 3)
      + eye(49, 45, mood, { r: 4.6, rim: 1.6, lid: "#fff" }) + eye(71, 45, mood, { r: 4.6, rim: 1.6, lid: "#fff" }) + blush(46, 74, 58) + fluff(60, 25, 9, 4.4, 7, k.b, edge("#c4b498", 0.8), 1.25),
    hat: [60, 27, 0.72], scarf: [60, 76, 15],
  });
}

function wensleydale(k, mood) {
  const skin = k.a, rim = "#bfae88";
  const lk = (l, w = 6.4) => ringlets(l, rim, k.c, w, 3.6);
  return sheepRig(sheepLegs(skin, "#46525e"), {
    body: el(60, 86, 30, 20, k.c, edge(rim)) + lk([[31, 76, 28], [40, 72, 36], [50, 76, 36], [60, 80, 32], [70, 76, 36], [80, 72, 36], [89, 76, 28], [35, 86, 24], [45, 90, 22], [75, 90, 22], [85, 86, 24], [55, 88, 24], [66, 88, 24]]),
    head: both(ear([45, 36], [24, 18], 6.6, skin, "#b88a94")) + p("M42 42C42 29 50 26 60 26C70 26 78 29 78 42C78 52 74 56 72 63Q70 75 60 75Q50 75 48 63C46 56 42 52 42 42Z", skin, edge("#2e3844", 1.2))
      + el(60, 66, 10.5, 8, "#7e8c9c") + nostrils(56, 64, 63.5, "#26303a") + smile(60, 68.5, "#26303a", 3.4)
      + eye(50, 49, mood, { r: 4.8, rim: 1.4, lid: "#fff" }) + eye(70, 49, mood, { r: 4.8, rim: 1.4, lid: "#fff" }) + blush(46, 74, 60)
      // The famous forelock spills over the brow in long glossy curls.
      + fluff(60, 28, 19, 9, 11, k.c, edge(rim), 1.2) + lk([[43, 30, 28], [77, 30, 28]], 6) + lk([[50, 27, 16], [57, 26, 19], [64, 26, 17], [70, 27, 15]], 5.4),
    hat: [60, 24, 0.85], scarf: [60, 76, 15],
  });
}

function racka(k, mood) {
  const hi = k.b, coat = k.c;
  // Both sexes carry long corkscrew horns held in a wide V.
  const corkscrew = () => {
    const base = [50, 31], tip = [11, 3];
    let s = horn(base, [31, 16], tip, 5.4, k.a, "#7a5a30", 1.2, 0);
    for (let i = 0; i < 6; i++) {
      const t = (i + 0.6) / 6.6, x = base[0] + (tip[0] - base[0]) * t, y = base[1] + (tip[1] - base[1]) * t, w = 6.4 - t * 4.2;
      s += ln(`M${f(x - w * 0.9)} ${f(y + w * 0.75)}Q${f(x + w * 0.2)} ${f(y + w * 0.2)} ${f(x + w * 0.55)} ${f(y - w * 1.05)}`, "#6a4a24", 2) + ln(`M${f(x - w * 0.9 - 2)} ${f(y + w * 0.75 - 1.6)}Q${f(x - 1.8)} ${f(y - 1)} ${f(x + w * 0.55 - 2)} ${f(y - w * 1.05 - 1.6)}`, "#f2dcac", 1.1);
    }
    return s;
  };
  const under = sheepLegs("#241c1a", "#120e0e", { w: 9, len: 21 });
  return sheepRig({ far: under.far + under.near, near: "" }, {
    body: el(60, 86, 30, 20, coat, edge(hi)) + tufts([[34, 76, 24, 104, 7], [42, 82, 36, 111, 6], [52, 86, 49, 108, 6], [62, 88, 63, 112, 6], [72, 86, 76, 108, 6], [80, 80, 86, 111, 6], [87, 76, 97, 103, 7]], coat, edge(hi, 1.2)) + strands([[34, 82, 22], [44, 90, 18], [57, 92, 18], [70, 90, 18], [82, 84, 24]], 2.2, "#8a6e60", 1.2),
    head: both(corkscrew()) + both(ear([44, 44], [22, 54], 6, coat, "#8a5a54")) + p("M42 42C42 29 50 26 60 26C70 26 78 29 78 42C78 52 74 56 72 64Q70 76 60 76Q50 76 48 64C46 56 42 52 42 42Z", "#241c1a", edge(hi, 1.3))
      + el(60, 66, 10.5, 8, "#4a3a36") + nostrils(56, 64, 63.5, "#0a0606") + smile(60, 69, "#b89c90", 3.2)
      + eye(49.5, 46, mood, { r: 4.8, rim: 1.6, lid: "#fff" }) + eye(70.5, 46, mood, { r: 4.8, rim: 1.6, lid: "#fff" }) + blush(45, 75, 57) + tufts([[49, 29, 43, 42, 4], [56, 27, 54, 39, 4], [64, 27, 67, 39, 4], [71, 29, 77, 42, 4]], coat, edge(hi, 1)),
    hat: [60, 28, 0.74], scarf: [60, 76, 15],
  });
}

// ====================================================================================
// Pigs
// ====================================================================================
function kunekune(k, mood, sig) {
  const spot = k.a;
  const o = { col: k.c, hoof: "#3a2822", w: 10.5, cloven: true };
  const legs = quad([29, 62, 40, 74], 99, o, { col: "#a86a34" });
  const face = (m) => {
    const ears = both(ear([46, 34], [31, 16], 9, k.c, "#f2a89c", 1.15));
    return ears + p("M33 50C33 32 46 26 60 26C74 26 87 32 87 50C87 68 76 76 60 76C44 76 33 68 33 50Z", k.c, edge("#0004"))
      + el(45, 36, 9, 7, spot, `transform="rotate(-30 45 36)"`) + el(77, 62, 4.4, 3.6, spot)
      // Pire pire: the two tassels under the jaw.
      + both(p("M44 70Q38 76 39 85Q40 90 45 88Q49 84 47 78Q49 74 50 73Z", k.c, edge("#8a5420", 1.2)))
      + el(60, 60, 15.5, 11.5, k.b, edge("#a8683c", 1.4)) + el(60, 58.8, 11.5, 8, "#eaa890") + el(55, 59, 2.4, 3.4, "#6a3430") + el(65, 59, 2.4, 3.4, "#6a3430") + smile(60, 72.5, "#6a3420", 3.6)
      + eye(46, 45, m, { r: 4.6 }) + eye(74, 45, m, { r: 4.6 }) + blush(40, 80, 57) + ln("M54 27l-2 -6M60 26v-7M66 27l3 -6", k.c, 2.4);
  };
  const at = (s) => tf("translate(79 60) scale(.84) translate(-60 -50)", s);
  const body = el(49, 85, 32, 23, k.c, edge()) + el(33, 78, 9, 7, spot, `transform="rotate(-20 33 78)"`) + el(48, 99, 8, 5.4, spot) + el(55, 70, 5, 3.6, spot) + el(23, 93, 3.4, 3, spot) + ln("M26 84l-4 3M36 90l-3 5M44 76l-4 3M55 84l-3 5M32 68l-5 1M62 96l-2 6M42 64l-4 -2", "#f6c488", 1.4);
  const r = {
    back: wrap("bd-wag", ln("M20 80Q8 80 9 70Q14 64 17 71Q14 75 11 72", k.c, 3.4)), far: legs.far, body, near: legs.near,
    head: at(face(mood)), hat: [79, 40, 0.74], scarf: [74, 82, 13],
  };
  if (sig) {
    const mud = "#7a5030", hi = "#a8764a";
    r.head = at(face(mood === "love" ? "love" : "sleepy") + el(74, 33, 6, 3.4, mud) + dots([[40, 62], [82, 52], [52, 30]], 2.4, mud));
    r.body = body + el(36, 92, 8, 5, mud) + el(62, 72, 5, 3.4, mud) + dots([[26, 76], [50, 80], [66, 90], [42, 66]], 2.2, mud);
    Object.assign(r, { pose: "translate(-1 9) rotate(-5 60 90)", cls: "bd-s-barn-wallow", shadow: false,
      under: el(60, 111, 58, 12, "#5a3820"),
      over: p("M4 108Q14 100 24 107Q34 114 44 106Q56 99 68 108Q80 115 92 105Q104 99 117 109Q112 123 60 123Q8 123 4 108Z", mud, edge("#4a2c16", 1.3)) + ln("M16 113q8 -3 16 0M48 117q10 -3 20 0M84 112q8 -3 16 0", hi, 2) + dot(24, 117, 2.6, hi) + dot(100, 117, 1.8, hi),
      fx: g("splat", dots([[12, 88], [108, 90], [100, 30]], 3.6, mud) + dots([[8, 74], [22, 62], [112, 74], [114, 52]], 2.2, mud) + el(18, 98, 4, 2.6, mud, `transform="rotate(40 18 98)"`)) + g("bubble", dot(34, 104, 3.4, hi, edge("#e8c8a0", 1)) + dot(94, 106, 2.4, hi, edge("#e8c8a0", 1))) + txt(26, 28, "aaah", 12, "#ffe8c0"),
      css: anim("wallow", "Wallow", 1.4, "0%,100%{transform:rotate(-5deg)}50%{transform:rotate(5deg) translateY(2px)}", "55px 112px") + anim("splat", "Splat", 0.9, "0%,100%{opacity:1;transform:scale(1)}45%{opacity:0;transform:scale(1.1)}55%{opacity:0;transform:scale(.8)}", "60px 108px", "linear") + drift("bubble", "Bubble", 1.2, "0,5px", "0,-6px") });
  }
  return r;
}

function mangalitsa(k, mood, sig) {
  const dk = k.a, rim = "#a87c40";
  const o = { col: k.c, hoof: dk, w: 9.5, cloven: true };
  const legs = quad([30, 63, 41, 74], 98, o, { col: "#bc9258" });
  const coat = (l, r = 2.8) => curls(l, r, rim, 1.5);
  const body = fluff(49, 84, 31, 22, 24, k.c, edge(rim, 1.4), 1.09) + coat([[27, 80], [37, 72], [49, 70], [61, 74], [32, 90], [43, 83], [55, 84], [67, 88], [40, 99], [53, 97], [65, 100], [22, 92], [72, 76]]) + ln("M26 74q8 -9 20 -9M52 65q10 0 16 6", k.b, 2.4);
  const head = ear([76, 37], [74, 16], 8, "#c89c60", "#e8b098", 1.2)
    + fluff(84, 53, 21, 21, 17, k.c, edge(rim, 1.3), 1.08) + p("M94 46Q104 50 112 52Q117 56 117 66Q114 74 104 72Q94 74 90 68Z", k.c) + coat([[76, 62], [86, 68], [72, 50]], 2.4)
    + el(113, 62.5, 5.4, 10, "#5a4644", `${edge("#241a18", 1.2)} transform="rotate(-8 113 62.5)"`) + el(114, 59, 1.5, 2.2, "#180c0c") + el(114.4, 66.5, 1.5, 2.2, "#180c0c") + ln("M98 70q6 2 10 -1", "#6a4428", 1.4)
    + eye(90, 49, mood, { r: 4.8 }) + blush2(87, 60)
    + p("M80 36Q92 22 108 32Q112 38 108 44Q104 36 98 38Q90 40 82 44Z", k.c, edge(rim, 1.4)) + p("M88 34Q98 29 106 36Q96 35 90 38Z", "#e8b098") + coat([[84, 38]], 2);
  const r = {
    back: wrap("bd-wag", ln("M20 80Q6 82 7 71Q12 63 16 71Q13 76 9 72", k.c, 4.4) + ln("M20 80Q6 82 7 71", rim, 1)), far: legs.far, body, near: legs.near,
    head, hat: [83, 31, 0.76], scarf: [72, 78, 13], pivot: [70, 70],
  };
  if (sig) {
    const soil = "#6a4426";
    Object.assign(r, { pose: "translate(-5 0)", hat: [81, 33, 0.6], headRot: 37, headCls: "bd-s-barn-root", sigScarf: [68, 80, 12],
      front: g("mound", p("M80 120Q86 104 98 108Q104 100 112 108Q120 112 120 120Z", soil, edge("#3a2010", 1.2)) + dots([[92, 112], [108, 114], [100, 117]], 2, "#8a6038")),
      fx: g("clods", dots([[76, 96], [114, 78]], 3, soil) + dots([[68, 86], [104, 70], [118, 94], [84, 108]], 2, soil) + p("M64 106l7 -3l2 6l-7 2Z", soil)) + g("sniff", ln("M104 50q6 -4 3 -9M112 58q7 -3 6 -10", "#fff", 2.2)) + el(70, 116, 5, 3.4, "#3a2a28") + el(18, 116, 4, 2.8, "#3a2a28"),
      css: anim("root", "Root", 0.45, "0%,100%{transform:rotate(-6deg)}50%{transform:rotate(5deg) translate(1px,2px)}", "70px 70px") + anim("mound", "Mound", 0.45, "0%,100%{transform:scale(1,1)}50%{transform:scale(1.06,.9)}", "100px 120px") + drift("clods", "Clods", 0.9, "8px,8px", "-8px,-10px") + pulse("sniff", "Sniff", 0.9, 0.15) });
  }
  return r;
}

// ====================================================================================
// Cattle, yak and buffalo
// ====================================================================================
function highlandRig(k, mood, sig, calf) {
  const coat = k.c, light = k.b, deep = k.a;
  const o = { w: calf ? 11 : 12.5, cloven: true, hoof: calf ? "#a8866a" : "#3a241a" };
  const far = leg(34, 96, { ...o, col: deep }) + leg(86, 96, { ...o, col: deep });
  const near = leg(47, 96, { ...o, col: coat, feather: coat }) + leg(73, 96, { ...o, col: coat, feather: coat });
  const body = fluff(60, 87, calf ? 32 : 36, 22, 17, coat, edge(deep, 1.2), calf ? 1.12 : 1.07) + tufts([[30, 80, 21, 105, 7], [36, 90, 30, 112, 6], [44, 94, 40, 110, 6], [55, 96, 53, 113, 6], [66, 96, 68, 111, 6], [76, 94, 81, 113, 6], [84, 90, 91, 109, 6], [90, 80, 99, 104, 7]], coat, edge(deep, 0.9)) + strands([[29, 80, 20], [37, 86, 18], [83, 86, 18], [91, 80, 20], [48, 94, 14], [72, 94, 14]], 1.8, light, 1.5);
  const horns = calf
    ? horn([39, 36], [24, 34], [23, 21], 4.4, "#e8d4b0", "#b89868", 0.8, 2)
    : horn([40, 39], [4, 46], [5, 12], 6, "#f0dcb4", "#b09058", 0.7, 4) + p("M5 12Q4.4 18 5.8 23L8.4 21Q6.4 16 5 12Z", "#4a3220");
  const muzzle = el(60, 66, calf ? 14 : 18, calf ? 10.5 : 12, calf ? "#f2c4bc" : "#d8a490", edge("#8a5444", 1.2)) + nostrils(calf ? 54.5 : 52.5, calf ? 65.5 : 67.5, 64, "#5a2c28", calf ? 2 : 2.8, calf ? 2.6 : 3.2) + smile(60, 71.5, "#7a4034", 4.4);
  const face = both(horns) + both(ear([40, 46], [18, 52], calf ? 8 : 7.4, coat, calf ? "#f2b4ac" : "#c87c5c"))
    + p("M37 44C37 29 47 25 60 25C73 25 83 29 83 44C83 56 79 62 75 70Q68 79 60 79Q52 79 45 70C41 62 37 56 37 44Z", coat, edge()) + muzzle
    + eye(48.5, 49.5, mood, { r: calf ? 5.2 : 4.6, rim: 0.9 }) + eye(71.5, 49.5, mood, { r: calf ? 5.2 : 4.6, rim: 0.9 }) + blush(43, 77, 59);
  return { coat, light, deep, far, near, body, face };
}
function highland(k, mood, sig) {
  const h = highlandRig(k, mood, sig, false);
  // The dossan: a thick curtain of forelock parted just enough to peep through.
  const dossan = tufts([[43, 29, 35, 58, 6.6], [50, 27, 43, 46, 6], [70, 27, 77, 46, 6], [77, 29, 85, 58, 6.6], [55, 26, 51, 43, 5.4], [65, 26, 69, 43, 5.4], [60, 25, 61, 55, 5]], h.coat, edge(h.deep, 0.9)) + fluff(60, 31, 22, 10, 13, h.coat, edge(h.deep, 1), 1.18) + ln("M45 31Q42 42 37 50M53 28Q50 35 46 41M60 27Q58 38 60 48M67 28Q71 35 74 41M75 31Q80 42 83 50", h.light, 1.6);
  const r = { back: wrap("bd-wag", ln("M90 80Q108 82 108 98", h.coat, 5) + tufts([[108, 96, 111, 117, 5.4]], h.coat, edge(h.deep, 1))), far: h.far + h.near, body: h.body, head: h.face + dossan, hat: [60, 24, 0.86], scarf: [60, 78, 18], pivot: [60, 72] };
  if (sig) {
    const flung = tufts([[54, 30, 98, 8, 8], [58, 27, 82, 1, 7], [66, 30, 104, 24, 6.4], [48, 29, 66, 2, 6], [70, 34, 96, 40, 5]], h.coat, edge(h.deep, 1.1)) + fluff(58, 30, 19, 8, 12, h.coat, edge(h.deep, 1), 1.18) + ln("M58 28Q72 12 92 10M64 31Q82 24 98 25M52 27Q58 14 68 7", h.light, 1.7);
    Object.assign(r, { head: h.face + g("fringe", flung), headRot: -4, headCls: "bd-s-barn-toss",
      fx: g("swish", ln("M92 46q16 -6 20 -22M100 54q12 -2 18 -12M30 18q10 -12 24 -14", "#fff", 2.4)) + txt(17, 74, "flick!", 10, "#fff3a0"),
      css: anim("toss", "Toss", 1.5, "0%,22%,100%{transform:rotate(0) translateY(-2px)}55%,72%{transform:rotate(8deg) translateY(2px)}", "60px 72px") + anim("fringe", "Fringe", 1.5, "0%,22%,100%{transform:rotate(0) scale(1.02)}58%,72%{transform:rotate(64deg) scale(.82)}", "58px 30px") + anim("swish", "Swish", 1.5, "0%,28%,100%{opacity:1}52%,78%{opacity:0}", "") });
  }
  return r;
}
function whitehighland(k, mood) {
  const h = highlandRig(k, mood, false, true);
  const mop = fluff(60, 30, 21, 11, 13, k.c, edge(k.a, 1.1), 1.22) + tufts([[46, 31, 41, 46, 5], [55, 31, 53, 42, 4.6], [66, 31, 69, 42, 4.6], [75, 31, 80, 45, 5]], k.c, edge(k.a, 1)) + tufts([[58, 24, 50, 9, 4.4], [64, 23, 70, 8, 4.4], [61, 23, 61, 5, 4]], k.c, edge(k.a, 1.1)) + curls([[48, 29], [70, 28], [60, 31]], 2.2, k.a);
  return {
    back: wrap("bd-wag", ln("M88 82Q104 84 102 96", k.c, 5.4) + fluff(101, 102, 6, 8, 8, k.c, edge(k.a, 1))), far: h.far + h.near,
    body: h.body + curls([[40, 86], [52, 96], [68, 96], [80, 86], [34, 96], [86, 96]], 2.4, k.a),
    head: h.face + mop,
    fx: `<g class="bd-glow">${[[10, 30], [108, 40], [102, 12], [16, 72]].map(([x, y]) => ln(`M${x - 4} ${y}h8M${x} ${y - 4}v8M${x - 2.6} ${y - 2.6}l5.2 5.2M${x - 2.6} ${y + 2.6}l5.2 -5.2`, "#fff", 1.2)).join("")}</g>`,
    hat: [60, 24, 0.84], scarf: [60, 78, 16],
  };
}

function beltie(k, mood, sig) {
  const blk = k.c, white = k.b, fuzz = k.a;
  const o = { w: 11.5, cloven: true, hoof: "#18141a" };
  const legs = quad([29, 63, 40, 75], 95, { ...o, col: blk }, { col: "#121014" });
  const bodyPath = "M15 82C15 66 30 64 46 67C62 69 74 64 83 73C92 86 86 103 68 105C52 107 34 106 24 102C17 98 15 90 15 82Z";
  const body = p(bodyPath, blk, edge(fuzz, 1.2)) + p("M37 66Q48 68 60 68.4Q63 86 60 106Q49 106.6 38 105.4Q34 86 37 66Z", white, edge("#c8c0b4", 0.8)) + ln("M22 74l-3 5M28 94l-2 5M68 96l2 6M76 84l3 5M26 84l-3 3", fuzz, 1.5) + ln("M43 74l-1 7M54 88l1 7M46 98v5", "#d8d0c4", 1.2);
  // Polled, with very woolly ears and a broad grey muzzle.
  const face = (m, mouth = true) => both(fluff(30, 40, 14, 10.5, 11, blk, edge(fuzz, 1.2), 1.24) + el(31, 41, 6.4, 4.6, "#9a6c74") + curls([[28, 37]], 2.4, fuzz))
    + p("M37 44C37 29 47 24 60 24C73 24 83 29 83 44C83 55 79 62 75 68Q69 78 60 78Q51 78 45 68C41 62 37 55 37 44Z", blk, edge(fuzz, 1.3))
    + el(60, 65, 17, 11.5, "#8a7880", edge("#3a2c34", 1.2)) + nostrils(53.5, 66.5, 63, "#1c1014", 2.6, 3) + (mouth ? smile(60, 70.5, "#2a1a20", 4.2) : "")
    + eye(48.5, 47, m, { r: 5, rim: 1.6, lid: "#fff" }) + eye(71.5, 47, m, { r: 5, rim: 1.6, lid: "#fff" }) + blush(43, 77, 57)
    + fluff(60, 26, 13, 7, 9, blk, edge(fuzz, 1), 1.28) + curls([[55, 26], [64, 25]], 2.2, fuzz);
  const at = (s) => tf("translate(82 52) scale(.84) translate(-60 -50)", s);
  const r = {
    back: wrap("bd-wag", ln("M19 76Q6 80 8 96", blk, 4.4) + fluff(8, 102, 5.4, 9, 8, blk, edge(fuzz, 1))), far: legs.far, body, near: legs.near,
    neck: p("M56 76Q64 60 78 58L92 66Q86 84 74 94Q62 88 56 76Z", blk), head: at(face(mood)), hat: [82, 31, 0.76], scarf: [78, 78, 13], pivot: [70, 76],
  };
  if (sig) {
    const pink = "#f2808e";
    r.neck = p("M54 74Q70 66 84 70L96 84Q84 100 68 96Q58 88 54 74Z", blk, edge(fuzz, 0.8));
    r.head = tf("translate(78 73) rotate(-16) scale(.76) translate(-60 -50)", face(mood, false));
    // The long rough tongue wraps round a tussock and gives it a tug.
    const lick = "M83 88Q85 104 99 111Q110 115 111 107Q109 100 101 105";
    r.front = el(83, 87, 6, 3.4, "#4a1c28", `transform="rotate(-16 83 87)"`) + tuft(104, 119) + tuft(115, 119, "#6ab448") + g("tongue", ln(lick, "#a83c50", 6.4) + ln(lick, pink, 4.4) + ln("M86 96Q90 105 99 109", "#ffb4bc", 1.1)) + tuft(108, 119, "#6ab448") + tuft(96, 119, "#3e8430");
    Object.assign(r, { headCls: "bd-s-barn-graze", scarf: [67, 79, 12], scarfUnder: true, hat: [72, 57, 0.68],
      fx: g("grassbits", ln("M114 88l3 -6M100 92l-2 -6M118 98l0 -5", "#8ad060", 2.4)),
      css: anim("graze", "Graze", 1.4, "0%,100%{transform:rotate(0)}30%{transform:rotate(3deg)}60%{transform:rotate(-7deg) translateY(-2px)}", "70px 76px") + anim("tongue", "Tongue", 1.4, "0%,28%,100%{transform:scale(1.02)}62%{transform:scale(.76)}", "83px 88px") + drift("grassbits", "GrassBits", 1.4, "0,4px", "0,-9px") });
  }
  return r;
}

function buffalo(k, mood, sig) {
  const hide = k.c, deep = k.a, pale = k.b;
  const o = { w: 11.5, cloven: true, hoof: "#28242c", sock: 14, sockCol: pale };
  const legs = quad([30, 63, 41, 75], 94, { ...o, col: hide }, { col: deep, sockCol: "#b8b0b8" });
  const body = p("M16 83C16 66 32 62 46 66C58 69 72 62 82 72C92 86 86 102 68 104C52 106 34 105 25 101C18 97 16 91 16 83Z", hide, edge("#26222c", 1.2)) + ln("M26 70l-1 -5M33 67v-6M41 66l1 -5M49 68l2 -5", deep, 1.4) + el(40, 78, 12, 6, "#ffffff", `opacity=".09"`);
  const face = (m) => both(horn([46, 30], [20, 26], [13, 7], 6.4, "#5a525c", "#2a242c", 0.8, 5))
    // Big hair-fringed ears held out flat, below the swept-back horns.
    + both(ear([41, 44], [11, 51], 10, hide, "#c89ca8") + ln("M19 48l8 -3M18 52l9 -1M22 55l8 -3", "#f2e8ec", 1.3))
    + p("M39 41C39 27 49 23 60 23C71 23 81 27 81 41C81 53 77 58 76 66Q73 78 60 78Q47 78 44 66C43 58 39 53 39 41Z", hide, edge("#26222c", 1.2))
    + el(60, 66, 17.5, 11.5, "#38323c") + ln("M43.5 62Q60 51 76.5 62", pale, 2.6) + nostrils(52.5, 67.5, 64.5, "#0e0a10", 2.8, 3.2) + el(55, 59, 4, 1.8, "#fff", `opacity=".45"`) + smile(60, 71, "#c8b4bc", 4)
    + both(el(49, 40, 5, 1.8, pale, `opacity=".9" transform="rotate(-14 49 40)"`))
    + eye(48.5, 48, m, { r: 5.2, rim: 1.4, lid: "#fff" }) + eye(71.5, 48, m, { r: 5.2, rim: 1.4, lid: "#fff" }) + blush(44, 76, 57)
    + ln("M56 24q-3 -6 -7 -7M60 23q0 -6 2 -9M64 24q3 -5 8 -5", deep, 1.8);
  const at = (s) => tf("translate(81 50) scale(.84) translate(-60 -50)", s);
  const r = {
    back: wrap("bd-wag", ln("M20 76Q8 82 9 98", hide, 4) + tufts([[9, 96, 8, 112, 4]], deep)), far: legs.far, body, near: legs.near,
    // Pale chevron stripes on the throat and chest.
    neck: p("M54 76Q64 58 76 58L96 70Q92 90 76 97Q62 92 54 76Z", hide) + ln("M66 80Q76 90 90 80", pale, 3.4) + ln("M62 88Q74 100 86 91", pale, 3),
    head: at(face(mood)), hat: [81, 30, 0.74], scarf: [78, 73, 13],
  };
  if (sig) {
    const water = "#5ab4d8";
    Object.assign(r, { pose: "translate(0 17)", cls: "bd-s-barn-soak", shadow: false, scarf: [78, 73, 13],
      under: el(60, 108, 59, 13, "#3a8cb4"),
      over: p("M2 108Q12 103 22 108T42 108T62 108T82 108T102 108T118 108Q116 123 60 123Q6 123 2 108Z", water, `opacity=".95" ${edge("#2a789c", 1)}`) + ln("M6 108Q12 104 22 108T42 108T62 108T82 108T102 108T116 108", "#d4f4ff", 2) + ln("M18 116h18M52 120h20M86 115h16", "#b4e8fa", 1.8),
      fx: g("ripple", el(78, 108, 30, 5, "none", `stroke="#fff" stroke-width="1.6"`)) + el(18, 113, 9, 3.6, "#4a9a3c", edge("#2a6a24", 1)) + dot(18, 110, 3, "#ffa0c4") + dot(18, 109, 1.2, "#ffe45a") + g("drip", dots([[106, 54], [22, 76], [112, 90]], 2.2, "#bff0ff")),
      css: anim("soak", "Soak", 2.2, "0%,100%{transform:translateY(-2px)}50%{transform:translateY(3.5px)}", "") + anim("ripple", "Ripple", 2.2, "0%,100%{opacity:.9;transform:scale(1)}45%{opacity:0;transform:scale(1.3)}55%{opacity:0;transform:scale(.7)}", "78px 108px", "linear") + drift("drip", "Drip", 1.3, "0,-8px", "0,14px") });
  }
  return r;
}

function yak(k, mood, sig) {
  const hide = k.c, deep = k.a, gloss = "#6e5654";
  const o = { w: 11, cloven: true, hoof: "#8a7260" };
  const legs = quad([31, 64, 42, 76], 99, { ...o, col: hide }, { col: deep });
  const skirt = (l) => tufts(l, hide, edge(gloss, 1));
  const body = p("M18 84C17 68 30 70 40 67C48 55 66 52 76 66C88 78 88 98 70 101C50 104 30 102 24 98C19 95 18 90 18 84Z", hide, edge(gloss, 1.2))
    + skirt([[23, 86, 19, 111, 6], [31, 90, 28, 115, 6], [40, 92, 39, 110, 6], [49, 92, 49, 116, 6], [58, 92, 60, 111, 6], [67, 90, 69, 115, 6], [76, 86, 81, 109, 6]]) + strands([[28, 84, 22], [44, 88, 20], [56, 86, 20], [70, 84, 20]], 1.8, gloss, 1.4) + ln("M48 62q8 -6 17 -2", gloss, 2.2);
  const face = (m, open) => both(horn([45, 32], [23, 31], [24, 10], 5, "#d4c4ac", "#8a745c", 0.7, 3))
    + both(ear([42, 45], [20, 52], 7, hide, "#a87880") + ln("M23 50l7 -2", gloss, 1.2))
    + p("M38 42C38 28 48 24 60 24C72 24 82 28 82 42C82 54 78 60 75 68Q69 78 60 78Q51 78 45 68C42 60 38 54 38 42Z", hide, edge(gloss, 1.3))
    + el(60, 66, 15, 11, k.b, edge("#7a6458", 1)) + nostrils(54.5, 65.5, 63, "#2a1a1c", 2, 2.6)
    + (open ? el(60, 72, 6.4, 5, "#4a1822") + el(60, 74.4, 3.8, 2.2, "#e8707c") : smile(60, 70.5, "#3a2620", 4))
    + eye(48.5, 47, m, { r: 5, rim: 1.5, lid: "#fff" }) + eye(71.5, 47, m, { r: 5, rim: 1.5, lid: "#fff" }) + blush(43, 77, 58)
    + fluff(60, 28, 16, 8, 11, hide, edge(gloss, 1), 1.28) + tufts([[50, 29, 47, 41, 4], [58, 28, 58, 39, 3.6], [67, 29, 72, 40, 4]], hide, edge(gloss, 0.9));
  const at = (s) => tf("translate(81 55) scale(.83) translate(-60 -50)", s);
  const r = {
    // A full horse-like plume of a tail.
    back: wrap("bd-wag", p("M26 72C8 58 -2 76 4 92Q4 104 2 114Q10 108 13 112Q14 104 20 108Q20 98 24 102Q22 90 30 84Z", deep, edge(gloss, 1.2)) + strands([[10, 74, 28], [17, 76, 24]], 2, gloss, 1.3)),
    far: legs.far + legs.near, body, head: at(face(mood, false)), hat: [81, 36, 0.74], scarf: [76, 82, 13], pivot: [70, 76],
  };
  if (sig) {
    Object.assign(r, { head: at(face(mood, true)), headRot: -10, headCls: "bd-s-barn-grunt",
      fx: g("puff", fluff(105, 80, 9, 7, 8, "#f4faff", `opacity=".92" ${edge("#a8c0d8", 1)}`, 1.3) + fluff(114, 96, 5, 4, 7, "#f4faff", `opacity=".85" ${edge("#a8c0d8", 0.8)}`, 1.3)) + g("grunttext", txt(38, 28, "grunt!", 15, "#fff3a0") + ln("M20 38l-3 8M36 40l1 9M52 38l6 7", "#fff", 2.4)),
      css: anim("grunt", "Grunt", 1.2, "0%,28%,100%{transform:rotate(-4deg)}55%{transform:rotate(7deg)}75%{transform:rotate(1deg)}", "70px 76px") + anim("puff", "Puff", 1.2, "0%,20%,100%{opacity:1;transform:scale(1)}48%{opacity:0;transform:scale(1.2) translateY(-5px)}58%{opacity:0;transform:scale(.4)}", "92px 76px", "linear") + anim("grunttext", "GruntText", 1.2, "0%,100%{transform:scale(1.07)}50%{transform:scale(.88)}", "40px 26px") });
  }
  return r;
}

// ====================================================================================
// Camelids
// ====================================================================================
const camelFace = (k, mood, o = {}) => el(60, 52, 13, 11.5, o.muzzle || "#f0dcc8") + p("M55.5 47.5Q60 45 64.5 47.5Q63 51 60 51.5Q57 51 55.5 47.5Z", o.nose || "#7a5448") + ln("M60 51.5v4", o.nose || "#7a5448", 1.3) + smile(60, 55.5, "#6a4438", 3.4) + eye(48, 41, mood, { r: 4.8, rim: 0.9, lid: o.lid }) + eye(72, 41, mood, { r: 4.8, rim: 0.9, lid: o.lid }) + (o.lashes === false ? "" : ln("M42 38l-4 -2M43 35l-3 -3.4M78 38l4 -2M77 35l3 -3.4", o.lid || "#4a2c20", 1.2)) + blush(43, 77, 52);

function huacaya(k, mood, sig) {
  const wool = (x, y, rx, ry, n, b = 1.13) => fluff(x, y, rx, ry, n, k.c, edge("#cfb898", 1.3), b);
  const crimp = "#d8c4a4", o = { w: 10.5, cloven: true, hoof: "#8a6e5c" };
  const m = sig ? (mood === "love" ? "love" : "sleepy") : mood;
  const head = both(ear([46, 28], [38, 6], 6.4, k.c, "#e8aca4", 1.2)) + wool(60, 42, 22, 21, 15, 1.1) + camelFace(k, m)
    // Round fluffy topknot.
    + wool(60, 25, 16, 11.5, 11, 1.24) + curls([[52, 24], [61, 20], [68, 26], [58, 29]], 2.4, crimp);
  const r = {
    far: leg(36, 98, { ...o, col: k.a }) + leg(84, 98, { ...o, col: k.a }),
    body: wool(60, 91, 31, 19, 16) + curls([[36, 88], [43, 100], [76, 101], [85, 90], [32, 97], [81, 81], [39, 79]], 2.6, crimp),
    near: leg(49, 99, { ...o, col: k.c }) + leg(71, 99, { ...o, col: k.c }),
    neck: wool(60, 70, 17, 22, 15, 1.1) + curls([[52, 73], [66, 79], [58, 87], [68, 66]], 2.4, crimp),
    head, hat: [60, 21, 0.82], scarf: [60, 66, 16], pivot: [60, 66],
  };
  if (sig) {
    Object.assign(r, { headRot: -7, headCls: "bd-s-barn-sway",
      fx: g("note1", note(20, 46, "#fff3a0")) + g("note2", note(99, 32, "#ffd0e8")) + g("note3", note(104, 66, "#c8f0ff")) + g("note1", txt(20, 76, "mmm", 11, "#fff")) + g("note2", txt(100, 90, "hmm", 11, "#fff")),
      css: anim("sway", "Sway", 2.4, "0%,100%{transform:rotate(-6deg)}50%{transform:rotate(8deg)}", "60px 80px") + drift("note1", "Note1", 1.8, "3px,8px", "-5px,-14px") + drift("note2", "Note2", 2.2, "-3px,6px", "5px,-14px") + drift("note3", "Note3", 1.5, "0,7px", "6px,-12px") });
  }
  return r;
}

function suri(k, mood, sig) {
  const rim = k.a, o = { w: 10, cloven: true, hoof: "#5a4030" };
  const lk = (l, w = 6) => ringlets(l, rim, k.c, w, 1.7);
  // Suri fleece hangs in long, silky twisted pencil locks, parted down the back.
  const bodyLocks = lk([[33, 80, 28], [40, 76, 35], [48, 80, 32], [72, 80, 32], [80, 76, 35], [87, 80, 28], [36, 88, 22], [84, 88, 22], [55, 86, 24], [65, 86, 24]]);
  const neck = p("M45 56Q60 50 75 56L77 84Q60 92 43 84Z", k.c, edge(rim, 1)) + lk([[48, 60, 28], [55, 66, 26], [65, 66, 26], [72, 60, 28]], 5.6);
  const head = both(ear([47, 28], [39, 7], 6.4, k.c, "#d89a8c", 1.2)) + el(60, 42, 21, 20, k.c, edge(rim, 1.2)) + camelFace(k, mood, { muzzle: k.b })
    + p("M40 34Q44 20 60 20Q76 20 80 34Q70 28 60 27Q50 28 40 34Z", k.c, edge(rim, 1)) + lk([[41, 30, 30], [79, 30, 30]], 5.6) + lk([[47, 24, 15], [53, 21, 17]], 4.8) + lk([[67, 21, 17], [73, 24, 15]], 4.8) + ln("M60 20Q58 24 60 28", rim, 1.4);
  const r = {
    far: leg(36, 98, { ...o, col: rim }) + leg(84, 98, { ...o, col: rim }),
    body: el(60, 88, 29, 19, k.c, edge(rim)) + bodyLocks,
    near: leg(49, 100, { ...o, col: k.c }) + leg(71, 100, { ...o, col: k.c }),
    neck, head, hat: [60, 23, 0.82], scarf: [60, 66, 16], pivot: [60, 70],
  };
  if (sig) {
    // Cush: dropped onto the ground with every leg folded away underneath.
    const fold = (x) => el(x, 113, 11, 5.6, k.c, edge(rim, 1.3)) + el(x + (x < 60 ? 7 : -7), 115.5, 5, 3.4, "#5a4030");
    r.far = ""; r.near = "";
    r.body = el(60, 105, 38, 13, k.c, edge(rim)) + lk([[28, 98, 18], [35, 95, 22], [44, 97, 20], [76, 97, 20], [85, 95, 22], [92, 98, 18], [54, 100, 17], [66, 100, 17]]);
    r.front = fold(40) + fold(80);
    r.neck = tf("translate(0 18)", neck);
    r.head = tf("translate(0 18)", head);
    Object.assign(r, { cls: "bd-s-barn-cush", hat: [60, 41, 0.82], scarf: [60, 84, 16],
      fx: g("zen", txt(98, 38, "ahh", 12, "#fff") + ln("M14 74q-6 7 0 14M106 74q6 7 0 14", "#fff", 2.2)) + ln("M24 119h14M84 119h14", "#e8d4a0", 2.4) + g("lower", ln("M18 40v13M12 47l6 7l6 -7", "#fff3a0", 3)),
      css: anim("cush", "Cush", 3, "0%,46%,100%{transform:translateY(0)}64%,72%{transform:translateY(-17px)}88%{transform:translateY(1.5px) scale(1.03,.97)}", "60px 118px") + anim("zen", "Zen", 3, "0%,40%,100%{opacity:1}55%,84%{opacity:0}", "") + anim("lower", "Lower", 1, "0%,100%{transform:translateY(0)}50%{transform:translateY(6px)}", "") });
  }
  return r;
}

function llama(k, mood, sig) {
  const brown = k.c, white = k.b, deep = k.a;
  const o = { w: 8.5, cloven: true, hoof: "#3a2a22" };
  const legs = quad([27, 56, 37, 68], 90, { ...o, col: white }, { col: "#d8c8b0" });
  const body = p("M17 80C17 64 32 62 46 66C58 69 68 62 76 70C84 80 80 96 64 98C48 101 30 99 23 95C18 91 17 86 17 80Z", brown, edge())
    + p("M33 66Q50 70 52 82Q54 94 42 99.4Q30 99 24 95Q34 90 30 80Q28 70 33 66Z", white) + el(62, 76, 8, 6, white) + curls([[24, 78], [44, 72], [66, 90]], 2.6, deep, 1);
  const banana = (bx, by, tx, ty, bend) => p(`M${bx - 5} ${by}C${bx - 7 - bend} ${by - 12} ${tx - bend * 1.2 - 3} ${ty + 6} ${tx} ${ty}C${tx + 2 - bend * 0.2} ${ty + 9} ${bx + 7 - bend * 0.6} ${by - 10} ${bx + 5} ${by}Z`, brown, edge("#0005")) + ln(`M${bx - 1} ${by - 3}Q${bx - 3 - bend * 0.7} ${by - 12} ${f(tx - bend * 0.25)} ${ty + 6}`, "#e8b4a0", 2.6);
  const ears = sig ? ear([76, 31], [50, 29], 5, brown, "#e8b4a0") + ear([79, 28], [56, 18], 5, brown, "#e8b4a0") : banana(76, 31, 76, 4, 5) + banana(89, 30, 99, 3, -5);
  const head = p("M72 42C72 28 83 24 91 27C99 30 102 37 109 41C117 45 119 55 112 60C106 64 98 61 92 60C80 61 72 54 72 42Z", brown, edge("#0004"))
    + p("M101 39Q113 40 117 49Q119 58 111 61Q102 63 99 56Q96 46 101 39Z", white) + p("M81 26Q90 25 94 31Q90 40 92 48Q86 46 86 38Q80 32 81 26Z", white)
    + el(112.5, 47, 1.7, 2.2, "#5a3428", `transform="rotate(-30 112.5 47)"`)
    + (sig ? el(111, 55.5, 4, 3.2, "#4a1a1e", edge("#2a0c10", 0.8)) : ln("M113 49v4M106 57q4 1.6 8 -2", "#6a4030", 1.3))
    + eye(88, 42, sig && mood === "happy" ? "sad" : mood, { r: 4.8, rim: 0.9 }) + (sig && mood === "happy" ? ln("M80 33L96 38", "#2a140c", 2.6) : ln("M81 40l-4 -2M82 37l-3.4 -3", "#2a140c", 1.2)) + blush2(86, 52) + ears;
  const r = {
    back: wrap("bd-wag", p("M22 72Q6 62 5 78Q8 92 16 94Q12 82 26 82Z", white, edge("#c4b098", 1))), far: legs.far, body, near: legs.near,
    neck: p("M52 74C62 66 70 52 73 38L93 48C87 62 84 78 76 92C66 92 56 84 52 74Z", brown) + p("M85 56Q92 52 92 50C87 62 85 76 78 89Q72 90 70 87Q82 74 85 56Z", white),
    head, hat: [86, 28, 0.66], scarf: [77, 66, 12], pivot: [72, 66],
  };
  if (sig) {
    Object.assign(r, { headRot: -22, headCls: "bd-s-barn-spit", sigScarf: [74, 68, 12],
      fx: g("drop", el(106, 22, 3.4, 4.6, "#cdeeb0", `transform="rotate(40 106 22)" ${edge("#6a9a4a", 1)}`) + dots([[113, 13], [114, 26]], 2.2, "#cdeeb0") + dots([[101, 10], [117, 36]], 1.4, "#e8ffd4")) + txt(22, 30, "ptoo!", 14, "#e8ffb0") + g("huff", ln("M20 46q8 4 16 2M26 56q6 4 14 3", "#fff", 2.4)),
      css: anim("spit", "Spit", 1.6, "0%,35%,100%{transform:rotate(-4deg)}60%{transform:rotate(11deg)}80%{transform:rotate(16deg)}", "72px 66px") + pulse("huff", "Huff", 0.8) + anim("drop", "Drop", 1.6, "0%,18%{opacity:1;transform:translate(0,0)}35%{opacity:0;transform:translate(3px,5px)}80%{opacity:0;transform:translate(-16px,14px)}100%{opacity:1;transform:translate(0,0)}", "", "ease-out") });
  }
  return r;
}

// ====================================================================================
// Reindeer
// ====================================================================================
function deer(k, mood, sig, white) {
  const coat = k.c, ruff = k.b, antler = white ? "#b8a49c" : k.a, farAnt = white ? "#988680" : "#a4865c";
  const o = { w: 9, cloven: true, hoof: white ? "#6a5a58" : "#2c201c", hh: 7, sock: white ? 0 : 11, sockCol: "#e0d4c0" };
  const legCol = white ? coat : "#5c4232", farCol = white ? "#d4d4e0" : "#46302a";
  const legs = quad([27, 60, 38, 72], 91, { ...o, col: legCol }, { col: farCol });
  const body = p("M17 81C17 66 32 63 46 66C60 69 70 63 79 71C88 82 83 99 66 101C50 103 32 102 24 98C19 94 17 88 17 81Z", coat, edge(white ? "#b4b4c8" : "#0004", 1.2))
    + (white ? curls([[36, 78], [52, 88], [66, 80]], 2.6, "#d4d4e4", 1.1) : el(48, 96, 24, 5.4, ruff, `opacity=".75"`) + ln("M24 86Q44 92 66 88", ruff, 3, `opacity=".8"`)) + el(21, 80, 6.4, 9, white ? "#fff" : ruff);
  // Branched antlers, with the forward "shovel" brow tine over the face.
  const rack = (col, w) => ln("M80 32C66 22 56 14 62 3M64 17Q54 15 48 7M60 9Q66 7 70 2", col, w) + ln("M88 30C97 20 109 18 109 5M101 18Q112 20 114 11M99 20Q98 11 94 7", col, w);
  const antlers = white
    ? rack("#6a5854", 6.4) + rack(antler, 4.6) + dots([[62, 3], [48, 7], [70, 2], [109, 5], [114, 11], [94, 7]], 3.2, antler)
    : rack("#5a4228", 5) + rack(farAnt, 3.2);
  const brow = white ? ln("M90 30Q100 28 108 33M101 29l5 -6", "#6a5854", 5.4) + ln("M90 30Q100 28 108 33M101 29l5 -6", antler, 3.6)
    : p("M89 30Q95 24 103 25L106 20Q110 19 109.5 23L108.5 25.5L113.5 23.5Q117 25 114 27.5L111 29L115 31.5Q114.5 35 110.5 33.5Q101 30 90 34.5Z", antler, edge("#6a4a28", 1.2));
  const head = antlers + ear([77, 36], [60, 31], 5.6, coat, white ? "#f2c0c4" : "#c89080")
    + p("M72 45C72 32 82 27 91 29C99 31 102 39 109 45C118 51 119 63 112 68C106 73 96 69 89 66C79 66 72 57 72 45Z", coat, edge(white ? "#b4b4c8" : "#0004", 1.2))
    + p("M100 46Q114 48 117 58Q117 68 108 70Q99 69 97 60Q96 52 100 46Z", white ? "#fff" : ruff, edge("#a8988c", 0.8))
    + el(112, 55, 4.4, 3.6, white ? "#e8a0a4" : "#3a2824", `transform="rotate(30 112 55)"`) + el(113.4, 54.4, 1.2, 1.5, "#1a0c0c") + ln("M104 65q4 2 9 -1", "#5a3a30", 1.3)
    + (white ? "" : el(89, 45, 8.4, 7.6, "#5a3e2e")) + eye(89, 45, mood, { r: 4.8, rim: 1.2, lid: white ? INK : "#fff0e0" }) + blush2(87, 57) + brow;
  const neck = p("M50 74C60 62 64 46 76 36L96 63C88 70 86 84 76 94C64 92 54 84 50 74Z", coat)
    + p("M92 62C88 72 90 82 80 92Q80 99 73 96Q72 102 66 96Q62 98 62 90Q60 84 66 80Q76 72 79 61Z", white ? "#fff" : ruff, edge(white ? "#b4b4c8" : "#b4a088", 1));
  return { back: wrap("bd-wag", p("M21 74Q9 66 8 76Q10 86 22 84Z", "#fffdf8", edge("#b8ac9c", 1))), far: legs.far, body, near: legs.near, neck, head, hat: [86, 30, 0.66], scarf: [75, 69, 13], pivot: [70, 72], legCol, o };
}
function reindeer(k, mood, sig) {
  const r = deer(k, mood, sig, false);
  if (sig) {
    r.near = leg(38, 91, { ...r.o, col: r.legCol }) + g("step", bent(72, 89, -58, 14, 12, 15, { ...r.o, col: r.legCol }));
    Object.assign(r, { headCls: "bd-s-barn-walkhead",
      fx: g("click", burst(92, 105, 8) + txt(99, 90, "CLICK", 12, "#fff3a0")) + g("click2", ln("M104 103l9 -1M101 112l8 5M82 94l-2 -8", "#fff", 2.6)) + el(18, 116, 6, 2.4, "#e8f4ff") + el(52, 117, 5, 2, "#e8f4ff"),
      css: anim("step", "Step", 0.8, "0%,100%{transform:rotate(-5deg)}50%{transform:rotate(26deg)}", "72px 89px") + anim("click", "Click", 0.8, "0%,25%,100%{opacity:1;transform:scale(1)}48%,68%{opacity:0;transform:scale(.5)}", "94px 102px") + anim("click2", "Click2", 0.8, "0%,25%,100%{opacity:1}48%,68%{opacity:0}", "") + anim("walkhead", "WalkHead", 0.8, "0%,100%{transform:rotate(0)}50%{transform:rotate(3deg) translateY(1px)}", "70px 72px") });
  }
  return r;
}
function whitereindeer(k, mood, sig) {
  const r = deer(k, mood, sig, true);
  r.fx = `<g class="bd-glow">${dots([[14, 28], [30, 48], [10, 56], [40, 22], [106, 92], [16, 104]], 1.8, "#ffffff")}</g>`;
  if (sig) {
    const lichen = (x, y) => curls([[x - 5, y], [x, y - 3], [x + 5, y], [x, y + 1]], 2.4, "#6a9a78", 1.8) + curls([[x - 2, y - 1], [x + 3, y - 1]], 1.6, "#c8e8b0", 1.2);
    r.near = leg(38, 91, { ...r.o, col: r.legCol }) + g("paw", bent(71, 90, -42, 15, -10, 15, { ...r.o, col: r.legCol }));
    Object.assign(r, { pose: "translate(60 118) scale(.9) translate(-69 -118)", headRot: 25, headCls: "bd-s-barn-peer", sigScarf: [70, 76, 12],
      front: p("M70 123Q74 110 84 112Q88 117 96 116Q106 117 108 108Q118 108 120 123Z", "#fff", edge("#a8c0dc", 1.3)) + el(96, 118, 11, 3.6, "#8a7458") + lichen(96, 116),
      fx: g("snow", dots([[56, 108], [48, 96], [60, 92]], 3.4, "#fff") + dots([[40, 108], [52, 84], [70, 100], [44, 118]], 2.2, "#fff") + ln("M62 112l-9 -5M66 104l-6 -8", "#e4f0ff", 2.4)) + `<g class="bd-glow">${dots([[14, 28], [34, 44], [10, 62]], 1.8, "#fff")}</g>` + txt(26, 22, "scrape!", 11, "#dff0ff", "#34506a"),
      css: anim("paw", "Paw", 0.6, "0%,100%{transform:rotate(-14deg)}50%{transform:rotate(30deg)}", "71px 90px", "ease-in") + drift("snow", "Snow", 0.6, "10px,8px", "-10px,-10px") + anim("peer", "Peer", 1.8, "0%,100%{transform:rotate(-4deg)}50%{transform:rotate(1deg)}", "70px 72px") });
  }
  return r;
}

// ====================================================================================
const ART = {
  shetland, exmoor, donkey, suffolk, babydoll, zwartbles, nigerian, kunekune, beltie, huacaya,
  fjord, fainting, nubian, jacob, highland, mangalitsa, llama, reindeer,
  poitou, valais, wensleydale, angora, buffalo, suri,
  falabella, racka, blackneck, yak,
  whitehighland, whitereindeer,
};
const SIGNATURE = new Set(["shetland", "fjord", "falabella", "donkey", "poitou", "suffolk", "babydoll", "nigerian", "fainting", "blackneck", "kunekune", "mangalitsa", "highland", "beltie", "buffalo", "yak", "huacaya", "suri", "llama", "reindeer", "whitereindeer"]);

export default function art(o) {
  const key = String(o.id).replace(/^barn_/, "");
  const draw = ART[key];
  if (!draw) return "";
  const stage = o.stage || 1, mood = o.mood || "happy";
  const sig = o.act === "signature" && SIGNATURE.has(key);
  const r = draw({ c: o.c, b: o.b, a: o.a }, mood, sig);
  const common = { name: o.name, size: o.size, tier: o.tier, accent: o.a, stage };
  const parts = (head) => `${r.back || ""}${r.far || ""}${r.body || ""}${r.near || ""}${head}${r.front || ""}`;
  if (!sig) return frame({ ...common, body: parts(`${r.neck || ""}${r.head}`), neck: r.scarf, cap: r.hat, top: r.fx || "", wrapClass: "bd-breathe" });

  // Signature art dresses the pet itself, so scarf and hat travel with whatever pose it strikes.
  const moves = r.headRot !== undefined || !!r.headCls;
  const tucked = r.scarfUnder && stage >= 2;
  let head = `${r.neck || ""}${tucked ? scarf(...r.scarf) : ""}${r.head}`, neck = r.scarf;
  if (moves) {
    if (stage >= 3) head += hat(...r.hat);
    if (r.headCls) head = `<g class="${r.headCls}">${head}</g>`;
    if (r.headRot) {
      head = tf(`rotate(${r.headRot} ${r.pivot.join(" ")})`, head);
      // The scarf sits low on the neck, close to the pivot, so it only follows part of the swing.
      neck = r.sigScarf || [...rp(neck.slice(0, 2), r.pivot, r.headRot * 0.6), neck[2]];
    }
  }
  let body = parts(head) + (stage >= 2 && !tucked ? scarf(...neck) : "") + (stage >= 3 && !moves ? hat(...r.hat) : "");
  if (r.pose) body = tf(r.pose, body);
  if (r.cls) body = `<g class="${r.cls}">${body}</g>`;
  return frame({ ...common, body: `${r.under || ""}${body}${r.over || ""}`, neck: null, cap: null, top: r.fx || "", css: r.css, shadow: r.shadow });
}
