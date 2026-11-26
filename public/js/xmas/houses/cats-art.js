// Teacup Cat Café art: domestic breeds and coats plus four wild small cats, each with its own head
// shape, ears, coat length, tail and markings, and a bespoke animated drawing for every behaviour.
import { INK, el, dot, p, ln, dots, wrap, eye, scarf, hat, frame } from "./artkit.js";

const n1 = (v) => Math.round(v * 10) / 10;
const pt = ([x, y]) => `${n1(x)} ${n1(y)}`;
const mid = (a, b, t = 0.5) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const EDGE = `stroke="#1b1020" stroke-opacity=".28" stroke-width="1.1" stroke-linejoin="round"`;
const flip = (cx, svg) => `<g transform="matrix(-1 0 0 1 ${2 * cx} 0)">${svg}</g>`;
const pair = (svg, cx = 60) => svg + flip(cx, svg);
const g = (tr, svg) => `<g transform="${tr}">${svg}</g>`;

// ---------- soft outlines ----------
/** A rounded blob that can narrow to a chin, grow jowls or sprout fur tufts. Angles: 0 right, 90 down. */
function shape(cx, cy, w, h, o = {}) {
  const at = (deg, push = 0) => {
    const t = (deg * Math.PI) / 180, c = Math.cos(t), s = Math.sin(t), e = o.e || 1;
    let x = Math.sign(c) * Math.abs(c) ** e * w, y = Math.sign(s) * Math.abs(s) ** e * h;
    if (s > 0) x *= (1 - (o.chin || 0) * s ** 2) * (1 + (o.jowl || 0) * 4 * s * (1 - s));
    if (s < 0) x *= 1 - (o.top || 0) * s * s;
    if (s > 0) y *= 1 + (o.drop || 0) * s ** 4;
    return [cx + x + c * push, cy + y + s * push];
  };
  const tufts = [...(o.tufts || [])].sort((a, b) => a[0] - b[0]);
  let d = `M${pt(at(0))}`, a = 0, i = 0;
  while (a < 360) {
    const t = tufts[i];
    if (t && a >= t[0]) {
      const [from, to, count, len, droop = 0] = t, step = (to - from) / count;
      for (let k = 0; k < count; k++) {
        const a0 = from + k * step, tip = at(a0 + step * 0.6, len);
        tip[1] += droop;
        d += `Q${pt(at(a0 + step * 0.2, len * 0.3))} ${pt(tip)}Q${pt(at(a0 + step * 0.78, len * 0.15))} ${pt(at(a0 + step))}`;
      }
      a = to;
      i++;
    } else {
      a = Math.min(a + 6, t ? t[0] : 360, 360);
      d += `L${pt(at(a))}`;
    }
  }
  return { d: `${d}Z`, at, cx, cy, w, h };
}
/** A coat patch that hugs the outline between two angles, then returns through inner points. */
function patch(S, a0, a1, inner, fill, x = "") {
  const start = S.at(a0);
  let d = `M${pt(start)}`;
  for (let a = a0 + 5; a < a1; a += 5) d += `L${pt(S.at(a))}`;
  d += `L${pt(S.at(a1))}`;
  for (let i = 0; i < inner.length; i++) d += `Q${pt(inner[i])} ${pt(i + 1 < inner.length ? mid(inner[i], inner[i + 1]) : start)}`;
  return p(`${d}Z`, fill, x);
}
/** A free-form fur patch through a ring of points. */
function blot(list, fill, x = "") {
  let d = `M${pt(mid(list[list.length - 1], list[0]))}`;
  list.forEach((q, i) => (d += `Q${pt(q)} ${pt(mid(q, list[(i + 1) % list.length]))}`));
  return p(`${d}Z`, fill, x);
}

// ---------- fluffy tails ----------
/** A furry shape swept along a cubic curve. wid(t) gives the full width; jag adds fur spikes. */
function brush(P, wid, jag = 0) {
  const pos = (t) => [0, 1].map((k) => (1 - t) ** 3 * P[0][k] + 3 * (1 - t) ** 2 * t * P[1][k] + 3 * (1 - t) * t * t * P[2][k] + t ** 3 * P[3][k]);
  const nrm = (t) => {
    const a = pos(Math.max(0, t - 0.02)), b = pos(Math.min(1, t + 0.02)), dx = b[0] - a[0], dy = b[1] - a[1], m = Math.hypot(dx, dy) || 1;
    return [-dy / m, dx / m];
  };
  const edge = (t, side, extra) => {
    const q = pos(t), n = nrm(t), r = wid(t) / 2 + extra;
    return [q[0] + n[0] * r * side, q[1] + n[1] * r * side];
  };
  const seg = (t0, t1, cap) => {
    const N = Math.max(2, Math.round((t1 - t0) * 11)), L = [], R = [];
    for (let i = 0; i <= N; i++) {
      const t = t0 + ((t1 - t0) * i) / N;
      L.push(edge(t, 1, 0));
      R.push(edge(t, -1, 0));
    }
    // Each tuft is a soft scallop that leans toward the tail tip, so the fur reads as fluff, not saw teeth.
    const tuft = (i, side, back) => {
      const t = t0 + ((t1 - t0) * (i + (back ? 0.2 : 0.8))) / N;
      return pt(edge(t, side, jag * 1.7));
    };
    let d = `M${pt(L[0])}`;
    for (let i = 0; i < N; i++) d += `Q${tuft(i, 1)} ${pt(L[i + 1])}`;
    if (cap) {
      const a = pos(t1 - 0.03), b = pos(t1), m = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, u = [(b[0] - a[0]) / m, (b[1] - a[1]) / m];
      const r = wid(t1) / 2, tip = [b[0] + u[0] * (r + jag * 0.6), b[1] + u[1] * (r + jag * 0.6)];
      d += `Q${pt([L[N][0] + u[0] * r, L[N][1] + u[1] * r])} ${pt(tip)}Q${pt([R[N][0] + u[0] * r, R[N][1] + u[1] * r])} ${pt(R[N])}`;
    } else d += `L${pt(R[N])}`;
    for (let i = N - 1; i >= 0; i--) d += `Q${tuft(i, -1, false)} ${pt(R[i])}`;
    return `${d}Z`;
  };
  return { seg, pos };
}
/** Plumed or bushy tail with optional bands and tip colour. */
function fluff(P, col, o = {}) {
  const w = o.w || 17, wid = o.wid || ((t) => w * (0.6 + 0.55 * Math.sin(Math.PI * (0.15 + t * 0.7))));
  const b = brush(P, wid, o.jag ?? 2.4);
  const bands = (o.bands || []).map(([t0, t1]) => p(b.seg(t0, t1), o.ring)).join("");
  const tip = o.tip ? p(b.seg(o.tipFrom || 0.78, 1, true), o.tip) : "";
  const hair = o.hair ? ln(`M${pt(b.pos(0.2))}Q${pt(b.pos(0.45))} ${pt(b.pos(0.62))}M${pt(b.pos(0.55))}L${pt(b.pos(0.85))}`, o.hair, 1.3, `opacity=".7"`) : "";
  return p(b.seg(0, 1, true), col, EDGE) + bands + tip + hair;
}
/** Smooth short-haired tail drawn as a stroke, with rings and a tip. */
function rope(d, col, w, o = {}) {
  const path = (stroke, width, extra = "") => `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${width}" ${extra}/>`;
  const round = `stroke-linecap="round"`;
  return path("#1b1020", w + 2, `${round} opacity=".3"`) + path(col, w, round)
    + (o.ring ? path(o.ring, w - 0.2, `pathLength="100" stroke-dasharray="${o.dash || "0 26 6 12 6 12 6 40"}"`) : "")
    + (o.tip ? path(o.tip, w, `${round} pathLength="100" stroke-dasharray="0 ${100 - (o.tipLen || 16)} ${o.tipLen || 16} 200"`) : "");
}
const wag = (svg) => wrap("bd-wag", svg);

// ---------- heads (drawn around centre 60,48) ----------
/** One ear, left side; base runs along the head outline from a0 to a1, tip leans phi degrees outward. */
function earSvg(H, e, col, inner) {
  const A = H.at(e.a0, -3), B = H.at(e.a1, -3), m = mid(H.at(e.a0), H.at(e.a1)), r = e.round ?? 0.3, f = (e.phi * Math.PI) / 180;
  const T = [m[0] - Math.sin(f) * e.len, m[1] - Math.cos(f) * e.len];
  const path = (a, t, b) => {
    const t1 = mid(t, a, r * 0.45), t2 = mid(t, b, r * 0.45);
    const bow = (u, v, k) => { const q = mid(u, v), d = [q[0] - (a[0] + b[0] + t[0]) / 3, q[1] - (a[1] + b[1] + t[1]) / 3]; return [q[0] + d[0] * k, q[1] + d[1] * k]; };
    return `M${pt(a)}Q${pt(bow(a, t1, 0.3))} ${pt(t1)}Q${pt(t)} ${pt(t2)}Q${pt(bow(t2, b, 0.15))} ${pt(b)}Z`;
  };
  const base = mid(A, B), s = (q, k) => mid(base, q, k);
  const shell = p(path(A, T, B), col, EDGE);
  const tip = e.tipCol ? p(path(mid(T, A, 0.42), T, mid(T, B, 0.42)), e.tipCol) : "";
  const innerSvg = inner ? p(path(s(A, 0.68), s(T, e.deep || 0.74), s(B, 0.55)), inner) : "";
  const furnish = e.furnish ? ln(`M${pt(s(A, 0.55))}l${n1(-3)} -7M${pt(mid(s(A, 0.6), base, 0.4))}l-1 -8M${pt(base)}l1.5 -6`, e.furnish, 1.2, `opacity=".95"`) : "";
  const tuft = e.tuft ? ln(`M${pt(mid(T, base, 0.08))}l${n1(-Math.sin(f) * e.tuft)} ${n1(-Math.cos(f) * e.tuft)}M${pt(mid(T, base, 0.1))}l${n1(-Math.sin(f - 0.5) * e.tuft * 0.8)} ${n1(-Math.cos(f - 0.5) * e.tuft * 0.8)}M${pt(mid(T, base, 0.1))}l${n1(-Math.sin(f + 0.45) * e.tuft * 0.7)} ${n1(-Math.cos(f + 0.45) * e.tuft * 0.7)}`, e.tuftCol || col, 1.5) : "";
  return shell + tip + innerSvg + furnish + tuft;
}

function eyesSvg(s, mood, o) {
  const E = { r: 6, dx: 12.5, y: 49, iris: "#9ac84a", line: "#241820", ...s.eyes, ...(o.eyes || {}) };
  const open = mood === "happy" || mood === "sad";
  return [-1, 1].map((side) => {
    const x = 60 + side * E.dx, iris = side > 0 && E.irisR ? E.irisR : E.iris, lid = side > 0 && E.lidR ? E.lidR : E.lid;
    if (!open) return eye(x, E.y, mood, { lid: lid || INK });
    const rim = (E.white ? el(x, E.y + 0.4, E.r + 3.4, E.r + 2.8, E.white) : "") + dot(x, E.y, E.r + 1.1, E.line);
    let ball;
    if (E.pin) {
      // Pallas's cat: round pin-point pupils in a wide pale iris.
      ball = dot(x, E.y, E.r, iris) + dot(x, E.y, E.r * 0.36, "#14131f") + dot(x + E.r * 0.38, E.y - E.r * 0.38, E.r * 0.24, "#fff");
      if (mood === "sad") ball += ln(`M${x + side * 5} ${E.y - 11}L${x - side * 4} ${E.y - 8.6}`, lid || INK, 2);
    } else ball = eye(x, E.y, mood, { r: E.r, iris, lid: lid || INK, rim: 0 });
    // Almond or hooded lids: a wedge of face colour across the top of the eye.
    let cover = "";
    if (E.hood) {
      const col = side > 0 && E.hoodR ? E.hoodR : E.hood, r = E.r + 1.6, hi = E.y - E.r * (E.hoodHi ?? 0.95), lo = E.y - E.r * (E.hoodLo ?? 0.2);
      const ox = x + side * r, ix = x - side * r;
      cover = p(`M${ox} ${hi}Q${ox} ${E.y - r - 1.6} ${x} ${E.y - r - 1.6}Q${ix} ${E.y - r - 1.6} ${ix} ${lo}Q${x} ${(hi + lo) / 2 - 2.4} ${ox} ${hi}Z`, col) + ln(`M${ix} ${lo}Q${x} ${(hi + lo) / 2 - 2.4} ${ox} ${hi - 0.4}`, E.line, 1.5);
    }
    return rim + ball + cover;
  }).join("");
}

function mouthSvg(s, mood, mode) {
  const y = (s.nose?.y || 57.5) + 3.4, col = s.mouth || "#3a2228";
  if (mode === "open") return p(`M53.5 ${y + 2}Q60 ${y - 0.5} 66.5 ${y + 2}Q67 ${y + 14} 60 ${y + 14}Q53 ${y + 14} 53.5 ${y + 2}Z`, "#6a1830", `stroke="${col}" stroke-width="1.3"`) + el(60, y + 10.6, 4.4, 2.8, "#ff7f96") + p(`M55.6 ${y + 2}l1.6 3.6l1.5 -4ZM64.4 ${y + 2}l-1.6 3.6l-1.5 -4Z`, "#fff");
  if (mode === "small") return ln(`M60 ${y}v2`, col, 1.3) + el(60, y + 4.6, 2.8, 3, "#6a1830", `stroke="${col}" stroke-width="1"`);
  if (s.flat && mode !== "tongue") return ln(`M60 ${y}v1.6M54 ${y + 4}Q60 ${y + 0.6} 66 ${y + 4}`, col, 1.35);
  if (mood === "sad") return ln(`M60 ${y}v2M55.5 ${y + 5.5}Q60 ${y + 0.6} 64.5 ${y + 5.5}`, col, 1.4);
  const w = ln(`M60 ${y}v2.2M55 ${y + 2}Q57.4 ${y + 5.2} 60 ${y + 2.4}Q62.6 ${y + 5.2} 65 ${y + 2}`, col, 1.35);
  if (mode === "tongue") return p(`M57 ${y + 3}Q56.6 ${y + 10} 60 ${y + 10}Q63.4 ${y + 10} 63 ${y + 3}Z`, "#ff7f96", `stroke="#a8384e" stroke-width=".9"`) + w;
  return w;
}

function whiskerSvg(s) {
  if (!s.wh) return "";
  const y = (s.nose?.y || 57.5) + 3;
  if (s.whisk === "curly") return pair(ln(`M49 ${y}q-6 -3 -9 0t-6 1q-3 0 -2 -3M49 ${y + 3}q-5 0 -8 4t-6 2M50 ${y + 5}q-3 4 -7 5q-3 2 -1 4`, s.wh, 0.9));
  const k = s.whLen || 1;
  return pair(ln(`M49.5 ${y}Q${40 - 6 * k} ${y - 3} ${47 - 22 * k} ${y - 1}M49 ${y + 2.8}Q${40 - 6 * k} ${y + 2} ${47 - 23 * k} ${y + 6}M50.5 ${y + 5.2}Q${43 - 5 * k} ${y + 7} ${49 - 20 * k} ${y + 11.5}`, s.wh, 0.8, `opacity=".9"`));
}

/**
 * A whole head. s: { w, h, sh, fill, ears, marks(H), eyes, muzzle, nose, mouth, wh, whisk, cheeks, over(H) }.
 * o: { x, y (centre), k (scale), rot, mouth: "open"|"small"|"tongue", eyes, lids (extra svg), ears (overrides) }.
 */
function head(s, mood, o = {}) {
  const H = shape(60, 48, s.w || 29, s.h || 23.5, s.sh);
  const E = { ...s.ears, ...(o.ears || {}) };
  const ears = earSvg(H, E, E.col || s.fill, E.in) + flip(60, earSvg(H, E, E.colR || E.col || s.fill, E.inR || E.in));
  const mz = s.muzzle;
  const muzzle = mz ? el(55.4, mz.y || 61.4, mz.rx || 6.4, mz.ry || 5, mz.fill) + el(64.6, mz.y || 61.4, mz.rx || 6.4, mz.ry || 5, mz.fillR || mz.fill) + el(60, (mz.y || 61.4) + 5, 4.6, 2.6, mz.chin || mz.fill) : "";
  const ny = s.nose?.y || 57.5, nw = s.nose?.w || 3.4;
  const nose = p(`M${60 - nw} ${ny}Q60 ${ny - 2.2} ${60 + nw} ${ny}Q${60 + nw * 0.5} ${ny + 3} 60 ${ny + 3.6}Q${60 - nw * 0.5} ${ny + 3} ${60 - nw} ${ny}Z`, s.nose?.col || "#e8828e", `stroke="${s.nose?.line || "#6a3440"}" stroke-width=".8"`);
  const art = ears + p(H.d, s.fill, EDGE) + (s.marks ? s.marks(H) : "") + el(52, 33, 13, 5.5, "#fff", `opacity=".13" transform="rotate(-14 52 33)"`) + muzzle
    + (o.noEyes ? "" : eyesSvg(s, mood, o)) + nose + mouthSvg(s, mood, o.mouth) + whiskerSvg(s)
    + (s.cheeks === false ? "" : pair(el(41, 58.5, 4, 2.4, "#ff7f9c", `opacity=".38"`))) + (s.over ? s.over(H) : "") + (o.extra || "");
  const x = o.x ?? 60, y = o.y ?? 47, k = o.k || 1;
  return g(`translate(${x} ${y}) rotate(${o.rot || 0}) scale(${k}) translate(-60 -48)`, art);
}
const capOf = (s, x, y, k = 1) => [x, y - (s.h || 23.5) * k + 6 * k, 0.9 * k];

// ---------- bodies ----------
const toes = (x, y, col = "#1b1020") => ln(`M${x - 2.4} ${y}v3M${x + 2.4} ${y}v3`, col, 1, `opacity=".35"`);
/** Upright front leg for the sitting pose, centred on x. */
function frontLeg(x, fill, o = {}) {
  const w = o.w || 6.2, top = o.top || 88;
  return p(`M${x - w + 1} ${top}Q${x - w - 0.4} 104 ${x - w - 0.6} 112Q${x - w - 0.6} 118.6 ${x} 118.6Q${x + w + 0.6} 118.6 ${x + w + 0.6} 112Q${x + w + 0.4} 104 ${x + w - 1} ${top}Z`, fill, EDGE)
    + (o.sock ? p(`M${x - w - 0.4} ${o.sockY || 106}Q${x} ${(o.sockY || 106) + 3} ${x + w + 0.4} ${o.sockY || 106}L${x + w + 0.6} 112Q${x + w + 0.6} 118.6 ${x} 118.6Q${x - w - 0.6} 118.6 ${x - w - 0.6} 112Z`, o.sock) : "")
    + toes(x, 114.4);
}

/** Front-sitting rig. d: { head, fill, bw, body, haunch, haunchR, marks(B), bib, legs, legMarks, tailBack, tailFront, top } */
function sit(d, mood) {
  const bw = d.bw || 24, B = shape(60, 93, bw, 26, { top: 0.34, ...(d.body || {}) });
  const hx = bw - 4;
  const haunch = (x, fill) => el(x, 106, 11.5, 12.5, fill, EDGE) + el(x + (x < 60 ? 1 : -1), 116.2, 8.6, 3.6, d.footFill || fill, EDGE);
  const legs = (d.noLegs ? "" : frontLeg(51.6, d.legFill || d.fill, d.legs)) + (d.noLegs || d.noLegR ? "" : frontLeg(68.4, d.legFillR || d.legFill || d.fill, d.legs));
  const body = (d.under || "") + (d.tailBack || "")
    + wrap("bd-breathe", p(B.d, d.fill, EDGE) + (d.marks ? d.marks(B) : "") + haunch(60 - hx, d.haunch || d.fill) + haunch(60 + hx, d.haunchR || d.haunch || d.fill) + (d.haunchMarks || "")
      + (d.bib || "") + legs + (d.legMarks || ""))
    + (d.tailFront || "") + head(d.head, mood, d.headPos);
  return { body, neck: d.neck || [60, 71, 17], cap: capOf(d.head, d.headPos?.x ?? 60, d.headPos?.y ?? 47, d.headPos?.k || 1), top: d.top || "" };
}

/** One leg for side poses: column from (x, top) down to a paw pointing right. */
function sideLeg(x, top, fill, o = {}) {
  const w = o.w || 5;
  const sockY = o.sockY || 108;
  return p(`M${x - w} ${top}Q${x - w - 0.5} ${(top + 114) / 2} ${x - w + 0.6} 113Q${x - w} 118.4 ${x + 1} 118.4Q${x + w + 4} 118.4 ${x + w + 3} 113.6Q${x + w + 1} 110.6 ${x + w - 0.4} 109Q${x + w} ${(top + 104) / 2} ${x + w + 1} ${top}Z`, fill, EDGE)
    + (o.sock ? p(`M${x - w + 0.2} ${sockY}Q${x} ${sockY + 2.5} ${x + w - 0.2} ${sockY}L${x + w + 1.6} 111.4Q${x + w + 4} 118.4 ${x + 1} 118.4Q${x - w} 118.4 ${x - w + 0.6} 113Z`, o.sock) : "")
    + (o.bars ? ln(o.bars.map((y) => `M${x - w + 0.8} ${y}Q${x} ${y + 2.6} ${x + w - 0.6} ${y - 0.4}`).join(""), o.barCol, 2) : "")
    + toes(x + 2.4, 114.6);
}
/** Side-on standing rig, head turned to the viewer. d: { head, fill, far, body:{cx,cy,w,h}, legs, marks(B), tail, headPos } */
function side(d, mood) {
  const b = { cx: 49, cy: 90, w: 32, h: 17, ...(d.bodyBox || {}) };
  const B = shape(b.cx, b.cy, b.w, b.h, b.o);
  const [x1, x2, x3, x4] = d.legX || [29, 39, 62, 72];
  const leg = (x, far) => sideLeg(x, b.cy + 4, far ? d.far : d.legFill || d.fill, far ? { ...d.legs, sock: d.legs?.farSock || d.legs?.sock } : d.legs);
  const hp = { x: 79, y: 60, k: 0.84, ...(d.headPos || {}) };
  const body = (d.under || "") + (d.tail || "")
    + leg(x2, true) + leg(x4, true)
    + wrap("bd-breathe", p(B.d, d.fill, EDGE) + (d.marks ? d.marks(B) : ""))
    + leg(x1) + leg(x3) + (d.haunch || "") + (d.chest || "") + head(d.head, mood, hp);
  return { body, neck: d.neck || [hp.x - 3, hp.y + (d.head.h || 23.5) * hp.k - 1, 15], cap: capOf(d.head, hp.x, hp.y, hp.k), top: d.top || "" };
}

/** Lying "front paws out" rig. d: { head, fill, marks(B), haunch, paws, pawFill, tailBack, tailFront, chest } */
function lounge(d, mood) {
  const B = shape(69, 97, d.bw || 38, d.bh || 21, d.body);
  const hp = { x: 46, y: 65, k: 0.96, ...(d.headPos || {}) };
  const paw = (x, y, fill) => p(`M${x - 10} ${y}Q${x - 10} ${y - 7.5} ${x} ${y - 7.5}Q${x + 10} ${y - 6} ${x + 9} ${y + 1}Q${x + 7} ${y + 4.6} ${x - 1} ${y + 4.4}Q${x - 10} ${y + 5} ${x - 10} ${y}Z`, fill, EDGE) + ln(`M${x - 5} ${y}v3.6M${x} ${y + 0.4}v3.6`, "#1b1020", 1, `opacity=".35"`);
  const body = (d.tailBack || "")
    + wrap("bd-breathe", p(B.d, d.fill, EDGE) + (d.marks ? d.marks(B) : "") + el(91, 105, 15, 13, d.haunch || d.fill, EDGE) + (d.haunchMarks || "") + el(88, 116, 10, 3.8, d.pawFill || d.fill, EDGE))
    + (d.chest || "") + (d.tailFront || "") + head(d.head, mood, hp) + paw(31, 113.6, d.pawFill || d.fill) + paw(58, 114.4, d.pawFillR || d.pawFill || d.fill);
  return { body, neck: d.neck || [hp.x + 1, hp.y + (d.head.h || 23.5) * hp.k - 3, 17], cap: capOf(d.head, hp.x, hp.y, hp.k), top: d.top || "" };
}

// ---------- marking helpers ----------
/** Forehead "M" plus the little crown lines between the ears. */
const tabbyM = (c, w = 1.9) => ln("M48.5 41.5L51.5 33L56 39L60 33.5L64 39L68.5 33L71.5 41.5", c, w) + ln("M55 30.5L54 26M60 29.5V25M65 30.5L66 26", c, w * 0.9);
const cheekStripes = (c, w = 1.8) => pair(ln("M41 51Q36 52 31.5 50M40.5 56Q37 59 33 59", c, w));
const specks = (list, r, c) => dots(list, r, c);
const rosette = (x, y, r, dark, fill, rot = 0) => `<g transform="rotate(${rot} ${x} ${y})">${el(x, y, r, r * 0.8, fill)}${ln(`M${x - r} ${y + 0.4}Q${x - r} ${y - r} ${x} ${y - r * 0.95}M${x + r * 0.5} ${y - r * 0.75}Q${x + r * 1.15} ${y - r * 0.1} ${x + r * 0.75} ${y + r * 0.6}M${x + r * 0.2} ${y + r * 0.9}Q${x - r * 0.45} ${y + r} ${x - r * 0.75} ${y + r * 0.55}`, dark, 2)}</g>`;
const curls = (list, c, r = 2.6, w = 1.2) => ln(list.map(([x, y]) => `M${x - r} ${y + 0.6}a${r} ${r} 0 1 1 ${r} ${r}a${r * 0.5} ${r * 0.5} 0 0 1 0 ${-r}`).join(""), c, w);
const waves = (list, c, w = 1.2) => ln(list.map(([x, y]) => `M${x} ${y}q2.2 -3 4.4 0t4.4 0`).join(""), c, w, `opacity=".8"`);
const ticks = (list, c) => ln(list.map(([x, y]) => `M${x} ${y}l.8 1.6M${x + 3} ${y + 2.6}l.8 1.6`).join(""), c, 1);

// ---------- head recipes ----------
const E_STD = { a0: 200, a1: 258, len: 19, phi: 30, round: 0.28 };
const HEADS = {
  mackerel: (k) => ({ fill: k.c, w: 28.5, h: 23.5, sh: { tufts: [[15, 50, 2, 2.6], [130, 165, 2, 2.6]] },
    ears: { ...E_STD, in: "#e8a8a0", furnish: "#fff4e4" }, eyes: { iris: "#a8c832", line: k.a },
    muzzle: { fill: k.b }, nose: { col: "#c8685e", line: k.a }, wh: "#fffaf0",
    marks: () => tabbyM(k.a) + cheekStripes(k.a) + pair(el(47.5, 49, 10, 9.4, k.b, `opacity=".7"`)) }),
  classic: (k) => ({ fill: k.c, w: 30, h: 23.5, sh: { jowl: 0.05 },
    ears: { ...E_STD, len: 17, in: "#e8aca0", furnish: "#fff4e4" }, eyes: { iris: "#e0a82a", line: k.a },
    muzzle: { fill: k.b, rx: 7 }, nose: { col: "#b8584e", line: k.a }, wh: "#fffaf0",
    marks: () => tabbyM(k.a, 2.6) + pair(ln("M41 51Q35 53 31.5 49M41 56Q36 62 31.5 56", k.a, 2.8) + el(47.5, 49, 9.6, 9, k.b, `opacity=".65"`)) }),
  ginger: (k) => ({ fill: k.c, w: 29.5, h: 23.5, sh: { tufts: [[12, 52, 3, 3], [128, 168, 3, 3]] },
    ears: { ...E_STD, in: "#ffb0a0", furnish: "#fff6e0" }, eyes: { iris: "#e8a014", line: "#7a3408" },
    muzzle: { fill: k.b, rx: 7.2, ry: 5.4 }, nose: { col: "#ff8a8a", line: "#a8402e" }, wh: "#fffaf0",
    marks: () => tabbyM(k.a, 2.3) + cheekStripes(k.a, 2.2) + el(60, 66, 11, 6, k.b) }),
  tuxedo: (k) => ({ fill: k.c, w: 29, h: 23.5, ears: { ...E_STD, in: "#d88a96", furnish: "#e8e4f0" }, eyes: { iris: "#b4dc4a", line: "#0e0c14", lid: "#d8d4e8" },
    nose: { col: k.a, line: "#7a4048" }, wh: "#ffffff",
    marks: (H) => patch(H, 40, 140, [[50, 62], [54, 57], [58.5, 52], [60, 34], [61.5, 52], [66, 57], [71, 62]], k.b) }),
  black: (k) => ({ fill: k.c, w: 28, h: 23.5, ears: { ...E_STD, len: 20, in: "#5a3c5e", furnish: "#6a6488" }, eyes: { iris: k.a, r: 6.6, line: "#08060e", lid: "#9a90c8" },
    nose: { col: "#2c2438", line: "#6a5e80" }, mouth: "#8a7ea0", wh: "#b8b0d8", cheeks: false,
    marks: () => ln("M38 38Q44 28 55 27", "#6a6690", 2.6, `opacity=".65"`) + pair(el(55, 62, 6.4, 5, k.b, `opacity=".55"`)) }),
  cow: (k) => ({ fill: k.c, w: 29, h: 23.5, ears: { ...E_STD, col: k.a, colR: k.c, in: "#f0a8ac" }, eyes: { iris: "#d8c02a", line: "#1b1620", lid: "#8a8498" },
    nose: { col: "#ff98a4" }, wh: "#b8b4c0",
    marks: (H) => patch(H, 150, 262, [[52, 30], [56, 44], [50, 56], [40, 58]], k.a) + el(65.5, 59.5, 2.6, 1.8, k.a, `transform="rotate(20 65.5 59.5)"`) }),
  tortie: (k) => ({ fill: k.c, w: 28.5, h: 23.5, sh: { tufts: [[15, 50, 2, 2.4], [130, 165, 2, 2.4]] },
    ears: { ...E_STD, col: k.c, colR: k.b, in: "#b8686a", furnish: "#f0d8b8" }, eyes: { iris: "#d8c43a", line: "#140c0a", lid: "#f0c898" },
    muzzle: { fill: "#6a4634", fillR: k.b, chin: k.a }, nose: { col: "#5a342e", line: "#140c0a" }, mouth: "#e8c0a0", wh: "#f8e8d8", cheeks: false,
    marks: (H) => patch(H, 268, 345, [[70, 46], [62, 56], [58, 42], [59, 30]], k.b) + patch(H, 95, 155, [[44, 56], [54, 66]], k.b)
      + blot([[38, 38], [46, 34], [50, 41], [42, 45]], k.b) + blot([[72, 56], [82, 52], [84, 60], [75, 64]], k.c) + blot([[60, 30], [64, 40], [61, 55], [57, 40]], k.a)
      + specks([[42, 62], [48, 30], [80, 42], [36, 52], [70, 30], [52, 36]], 2, k.b) + specks([[74, 36], [68, 42], [46, 40], [34, 46]], 1.6, k.a) }),
  calico: (k) => ({ fill: k.c, w: 29, h: 23.5, ears: { ...E_STD, col: k.b, colR: k.a, in: "#f0a8a8" }, eyes: { iris: "#b8c43a", line: "#2a1c14", lid: INK },
    nose: { col: "#ff98a0" }, wh: "#c8bcb0",
    marks: (H) => patch(H, 172, 266, [[55, 32], [55, 45], [46, 54], [36, 55]], k.b) + patch(H, 276, 368, [[82, 52], [70, 54], [65, 42], [64, 30]], k.a) + el(40, 38, 5, 3, "#f7b068", `opacity=".8"`) }),
  british: (k) => ({ fill: k.c, w: 33, h: 24, sh: { jowl: 0.14 }, ears: { a0: 206, a1: 246, len: 13, phi: 36, round: 0.95, in: "#b898b0" }, eyes: { iris: k.a, r: 6.8, dx: 13.6, line: "#4a3a3a" },
    muzzle: { fill: k.b, rx: 8, ry: 6 }, nose: { col: "#6a6478", line: "#3a3648", w: 4 }, wh: "#e8ecf8", cheeks: false,
    marks: () => pair(el(40, 62, 8, 6, k.b, `opacity=".6"`) + el(41, 58, 4, 2.4, "#e88aa8", `opacity=".4"`)) }),
  siamese: (k) => ({ fill: k.c, w: 28, h: 23, sh: { chin: 0.5, drop: 0.1, top: 0.05 }, ears: { a0: 184, a1: 252, len: 28, phi: 44, round: 0.18, col: k.a, in: "#8a5a52" },
    eyes: { iris: "#3aa0f0", r: 5.6, dx: 11.6, line: "#1c0e0a", lid: "#f0d8c0", hood: k.a, hoodHi: 1.25, hoodLo: 0.85 },
    nose: { col: "#2a1812", line: "#1a0c08", y: 58.5, w: 3 }, mouth: "#c89888", wh: "#fffaf0", whLen: 1.05, cheeks: false,
    marks: () => blot([[60, 33], [66, 42], [76, 44], [77, 56], [68, 66], [60, 73], [52, 66], [43, 56], [44, 44], [54, 42]], "#8a6050", `opacity=".55"`)
      + blot([[60, 41], [64, 47], [73, 47], [72, 58], [65, 66], [60, 70], [55, 66], [48, 58], [47, 47], [56, 47]], k.a) }),
  maine: (k) => ({ fill: k.c, w: 30, h: 23.5, sh: { e: 0.9, tufts: [[5, 75, 4, 8, 2], [105, 175, 4, 8, 2]] },
    ears: { a0: 202, a1: 260, len: 24, phi: 24, round: 0.1, in: "#c88878", tuft: 8, tuftCol: k.a, furnish: "#fff2da" },
    eyes: { iris: "#c8b83a", line: k.a }, muzzle: { fill: k.b, rx: 8.4, ry: 6.4, chin: "#fff6e4" }, nose: { col: "#a8564a", line: k.a, w: 4 }, wh: "#fffaf0", whLen: 1.3,
    marks: () => tabbyM(k.a, 2.1) + cheekStripes(k.a, 2) + pair(el(47.5, 49.5, 9.4, 8.2, k.b, `opacity=".45"`)) }),
  persian: (k) => ({ fill: k.c, w: 32, h: 24.5, sh: { e: 0.92, tufts: [[0, 80, 6, 6, 1.5], [100, 180, 6, 6, 1.5], [250, 290, 3, 3]] },
    ears: { a0: 212, a1: 240, len: 11, phi: 42, round: 0.9, in: "#f2a8a0", furnish: "#fffaf0" },
    eyes: { iris: k.a, r: 6.6, dx: 13.6, y: 49.5, line: "#7a4a2a" }, muzzle: { fill: k.b, y: 59.6, rx: 8, ry: 5 },
    nose: { col: "#ff9a94", y: 54.6, w: 3.8 }, wh: "#e0b890", whLen: 1.1,
    marks: () => el(60, 62, 17, 10, k.b, `opacity=".85"`) + ln("M60 36Q58 42 60 47M50 34Q52 38 55 40M70 34Q68 38 65 40", "#e0bc8c", 1.4) }),
  russian: (k) => ({ fill: k.c, w: 27.5, h: 23, sh: { chin: 0.3, e: 0.94 }, ears: { a0: 194, a1: 253, len: 24, phi: 34, round: 0.22, in: "#b8909e" },
    eyes: { iris: k.a, r: 6.2, dx: 12.4, line: "#1f2c34" }, nose: { col: "#56607a", line: "#2c3446" }, mouth: "#39425a", wh: "#eef4ff", cheeks: false,
    marks: () => pair(el(55.4, 61.6, 6.6, 5, k.b, `opacity=".8"`)) + specks([[44, 34], [50, 31], [70, 33], [76, 40], [38, 44], [82, 52], [58, 28]], 0.8, "#e4ecfa") + pair(el(47.6, 49, 8.6, 8.6, "#c4d0e4", `opacity=".45"`)) }),
  ragdoll: (k) => ({ fill: k.c, w: 30, h: 23.5, sh: { tufts: [[10, 70, 4, 5.5, 1.5], [110, 170, 4, 5.5, 1.5]] },
    ears: { a0: 198, a1: 252, len: 18, phi: 36, round: 0.45, col: k.a, in: "#c89088", furnish: "#fff6ec" },
    eyes: { iris: "#4a9ae8", r: 6.4, line: "#2a1c18" }, nose: { col: "#f2949c" }, wh: "#d8ccc0",
    marks: () => blot([[56, 40], [48, 36], [38, 40], [35, 52], [42, 60], [51, 58], [54, 50]], "#8e6e60") + blot([[64, 40], [72, 36], [82, 40], [85, 52], [78, 60], [69, 58], [66, 50]], "#8e6e60")
      + p("M60 27Q62.5 40 66 48Q76 58 72 66Q66 73 60 73Q54 73 48 66Q44 58 54 48Q57.5 40 60 27Z", k.b) }),
  norwegian: (k) => ({ fill: k.c, w: 29, h: 23.5, sh: { chin: 0.34, e: 0.9, tufts: [[0, 68, 4, 9, 3], [112, 180, 4, 9, 3]] },
    ears: { a0: 200, a1: 258, len: 23, phi: 30, round: 0.1, in: "#c8948a", tuft: 6.5, tuftCol: "#4a3a2e", furnish: "#fffaf0" },
    eyes: { iris: "#8ac04a", r: 5.8, line: k.a }, nose: { col: "#e07a78", y: 58 }, wh: "#fffaf0", whLen: 1.3,
    marks: (H) => tabbyM(k.a, 2.1) + cheekStripes(k.a, 2) + patch(H, 28, 152, [[44, 62], [55, 52], [60, 40], [65, 52], [76, 62]], k.b) + ln("M60 44V55", "#d8ccbc", 1) }),
  abyssinian: (k) => ({ fill: k.c, w: 27.5, h: 23, sh: { chin: 0.28 }, ears: { a0: 192, a1: 254, len: 26, phi: 34, round: 0.28, in: "#e8a080", tipCol: k.a, deep: 0.68, furnish: "#fbe4c0", tuft: 3.4 },
    eyes: { iris: "#c8bc28", r: 6, line: "#3a1808" }, muzzle: { fill: "#f6dcb4", rx: 5.8, ry: 4.4 }, nose: { col: "#c85c4a", line: "#4a1c0c" }, wh: "#fff4e4",
    marks: () => pair(el(47.5, 49, 9.6, 9.2, "#f2cf98", `opacity=".8"`) + ln("M54 45Q52 40 48 38.5M40 52Q36 51 33 48", k.a, 1.7)) + ln("M54 37L55 31L58 35L60 30L62 35L65 31L66 37", k.a, 1.4) + ticks([[44, 31], [74, 30], [50, 28], [68, 27], [38, 42], [80, 42]], k.a) }),
  devon: (k) => ({ fill: k.c, w: 28, h: 20.5, sh: { chin: 0.48, jowl: 0.16, drop: 0.04 }, ears: { a0: 168, a1: 248, len: 32, phi: 58, round: 0.62, in: "#e8a49c", deep: 0.78 },
    eyes: { iris: "#b8c46a", r: 7.2, dx: 13, y: 48, line: "#4a2c24" }, muzzle: { fill: k.b, rx: 6, ry: 4.4, y: 60.6 }, nose: { col: "#e8847e", y: 57, w: 3 }, wh: "#8a6a5a", whisk: "curly",
    marks: () => waves([[51, 31], [58, 36], [43, 37], [67, 38], [37, 56], [74, 58]], k.a) }),
  sphynx: (k) => ({ fill: k.c, w: 27, h: 22.5, sh: { chin: 0.42, jowl: 0.12 }, ears: { a0: 180, a1: 253, len: 31, phi: 46, round: 0.38, in: "#d88a82", deep: 0.8 },
    eyes: { iris: "#e8d84a", r: 6.6, dx: 12.4, line: k.a }, nose: { col: "#d8847e", line: k.a }, mouth: "#8a4a48",
    muzzle: { fill: k.b, rx: 6.4, ry: 4.8 },
    marks: () => ln("M48 36Q60 30 72 36M50 32Q60 27 70 32M53 28Q60 25 67 28M56 40.5Q60 38 64 40.5", "#b87870", 1.2, `opacity=".85"`) + pair(ln("M44 61Q39 62 35 59M45 65Q40 67 37 65", "#b87870", 1.1) + ln("M40 41Q46 37.5 53 41", "#c8908a", 1.4)) }),
  bengal: (k) => ({ fill: k.c, w: 28.5, h: 23, sh: { chin: 0.15 }, ears: { a0: 202, a1: 252, len: 16, phi: 32, round: 0.75, in: "#e8a890", tipCol: k.a, furnish: "#fff4dc" },
    eyes: { iris: "#8ac442", r: 6.2, line: k.a }, muzzle: { fill: "#fff6e2", rx: 7.4, ry: 5.6 }, nose: { col: "#c8503a", line: k.a, w: 4 }, wh: "#fffaf0",
    marks: () => tabbyM(k.a, 2.2) + pair(el(47.5, 49, 10, 9.6, "#fff4dc") + ln("M41 54Q35 58 31 54M43 60Q39 63 36 62", k.a, 2.4) + ln("M53.5 44Q54 40 52 37", k.a, 2)) + specks([[42, 34], [78, 34], [37, 43], [83, 43]], 1.7, k.a) }),
  bobtail: (k) => ({ fill: k.c, w: 28.5, h: 23, sh: { chin: 0.34, jowl: 0.1 }, ears: { a0: 197, a1: 256, len: 22, phi: 30, round: 0.28, col: k.b, colR: k.a, in: "#f2a8a4" },
    eyes: { iris: "#d89a24", r: 6.2, dx: 12.6, line: "#2a1810" }, nose: { col: "#ff8e96" }, wh: "#b8aca8",
    marks: (H) => patch(H, 178, 258, [[54, 34], [52, 44], [44, 52], [36, 50]], k.b) + patch(H, 283, 362, [[80, 52], [70, 52], [66, 42], [67, 32]], k.a) + pair(ln("M42 46.5Q39 45.5 37.5 42.5", "#2a1810", 1.8)) }),
  van: (k) => ({ fill: k.c, w: 29, h: 23.5, sh: { chin: 0.18, tufts: [[12, 70, 4, 5, 1.5], [110, 168, 4, 5, 1.5]] },
    ears: { a0: 198, a1: 256, len: 22, phi: 30, round: 0.38, in: "#f2a8a4", furnish: "#fffaf0" },
    eyes: { iris: "#e89a1e", irisR: "#e89a1e", r: 6.2, line: "#7a4a32" }, nose: { col: "#ff92a0" }, wh: "#c8bcb0",
    marks: (H) => patch(H, 182, 262, [[54, 33], [54, 44], [44, 47], [35, 47]], k.a) + patch(H, 278, 358, [[85, 47], [76, 47], [66, 44], [66, 33]], k.a) + pair(ln("M40 36Q45 32 51 32", "#e08a4a", 1.6)) }),
  mau: (k) => ({ fill: k.c, w: 28.5, h: 23, sh: { chin: 0.22 }, ears: { a0: 196, a1: 255, len: 22, phi: 36, round: 0.2, in: "#e0a0a0", furnish: "#fffaf4" },
    eyes: { iris: "#a8d45a", r: 6.8, dx: 12.8, line: k.a }, muzzle: { fill: k.b }, nose: { col: "#d86a68", line: k.a }, wh: "#fffaf4",
    marks: () => tabbyM(k.a, 1.8) + pair(el(47.2, 49, 10.4, 9.8, k.b) + ln("M54 52Q47 59 38 55Q35 54 33 50", k.a, 2.2) + ln("M42 59Q38 63 34 61", k.a, 2) + ln("M44 40.5Q49 37.5 55 38.5", k.a, 1.5)) + specks([[45, 30], [75, 30], [38, 40], [82, 40]], 1.5, k.a) }),
  selkirk: (k) => ({ fill: k.c, w: 31, h: 24, sh: { jowl: 0.08, tufts: [[0, 180, 14, 4], [215, 325, 8, 3]] }, ears: { a0: 203, a1: 250, len: 15, phi: 38, round: 0.75, in: "#e8a898", furnish: "#fff4e0" },
    eyes: { iris: "#d8922a", r: 6.4, dx: 13, line: "#5a3a20" }, muzzle: { fill: k.b, rx: 7.4, ry: 5.6 }, nose: { col: "#d8766a", w: 3.8 }, wh: "#fff8ea", whisk: "curly",
    marks: () => curls([[48, 33], [58, 29], [69, 33], [39, 41], [79, 42], [59, 39], [36, 55], [84, 55], [41, 65], [77, 65]], k.a, 2.8) }),
  pallas: (k) => ({ fill: k.c, flat: true, w: 36, h: 21.5, sh: { e: 0.86, tufts: [[0, 75, 5, 7.5, 2], [105, 180, 5, 7.5, 2]] },
    ears: { a0: 188, a1: 222, len: 11, phi: 64, round: 1, in: "#e8dccb", furnish: "#fffaf0", deep: 0.64 },
    eyes: { iris: "#e8c83a", r: 5.6, dx: 12.8, y: 47.5, line: "#241c14", white: "#f8f2e6", pin: true, hood: "#968a7a", hoodHi: 0.55, hoodLo: 0.55 },
    muzzle: { fill: "#e6ded0", rx: 6.6, ry: 4.6, y: 60 }, nose: { col: "#6a4a42", line: k.a, y: 55.8 }, wh: "#ffffff", cheeks: false,
    marks: () => el(60, 66.5, 15, 6.4, "#f2ece0") + specks([[47, 31], [53, 29], [60, 31], [67, 29], [73, 31], [50, 35.5], [57, 35], [63, 35], [70, 35.5], [43, 34.5], [77, 34.5]], 1.25, k.a)
      + pair(ln("M43 53Q36 56 27 56M45 58Q39 63 29 64", k.a, 2.6) + ln("M42.5 55.4Q36 59.5 28 60", "#f8f2e6", 2.2) + ln("M55 42Q56 49 53 56", "#f2ece0", 1.6)) }),
  sand: (k) => ({ fill: k.c, w: 33, h: 22.5, sh: { chin: 0.24, tufts: [[15, 60, 3, 4.5, 1], [120, 165, 3, 4.5, 1]] },
    ears: { a0: 177, a1: 235, len: 28, phi: 62, round: 0.28, in: "#fbf0e0", tipCol: "#3a2418", deep: 0.7, furnish: "#fffdf6" },
    eyes: { iris: "#cfd04a", r: 6.4, dx: 13.2, line: "#3a2414" }, muzzle: { fill: "#fff9ee", rx: 7, ry: 5 }, nose: { col: "#e0887c", line: "#7a3c30" }, wh: "#ffffff", whLen: 1.25,
    marks: () => pair(el(47, 48, 10.4, 9.8, k.b) + ln("M41 52Q37 57 29.5 57.5", k.a, 3.4)) + el(60, 66, 12, 6.4, "#fff9ee") + ln("M54 33L55 28M60 32V27M66 33L65 28", "#b08a58", 1.4) }),
  blackfooted: (k) => ({ fill: k.c, w: 29.5, h: 23, ears: { a0: 188, a1: 248, len: 19, phi: 48, round: 0.9, in: "#f2d0b8", furnish: "#fffaf0" },
    eyes: { iris: "#b8c83a", r: 7, dx: 12.8, line: k.a }, muzzle: { fill: "#fff6e4", rx: 6.4, ry: 4.8 }, nose: { col: "#d86858", line: k.a }, wh: "#fffaf0",
    marks: () => pair(el(47.2, 49, 10.6, 10.2, "#fbedcc") + ln("M41 53Q36 57 31 55.5M43 59Q39 64 34 63.5", k.a, 2.8) + ln("M53 40Q53 32 49 27", k.a, 2.6) + ln("M45 38Q41 34 39 33", k.a, 2.2)) + ln("M60 40V27", k.a, 1.8) + specks([[35, 42], [85, 42], [55.5, 30], [64.5, 30]], 1.5, k.a) }),
  fishing: (k) => ({ fill: k.c, w: 31.5, h: 22.5, sh: { e: 0.9, jowl: 0.1 }, ears: { a0: 197, a1: 237, len: 12, phi: 46, round: 1, col: k.a, in: "#d8b0a0", furnish: "#f2eede", deep: 0.62 },
    eyes: { iris: "#c8a83a", r: 5.6, dx: 12, line: k.a }, muzzle: { fill: "#e8e2cc", rx: 7.4, ry: 5.4 }, nose: { col: "#9a5a52", line: k.a, w: 4.4 }, wh: "#fffaf0",
    marks: () => ln("M53 40Q52 32 48 27M57 38Q57 30 55 25.5M60 38V25.5M63 38Q63 30 65 25.5M67 40Q68 32 72 27", k.a, 1.7) + pair(el(47.8, 48.6, 9.4, 8.8, "#e0dac2", `opacity=".85"`) + ln("M41.5 52.5Q36 55 30 53M42 58Q38 62 33 61", k.a, 2.3)) }),
  chimera: (k) => ({ fill: k.c, w: 29, h: 23.5, sh: { tufts: [[10, 60, 3, 4], [120, 170, 3, 4]] },
    ears: { ...E_STD, len: 20, col: k.c, colR: k.b, in: "#7a4a56", inR: "#ffbca8" },
    eyes: { iris: "#4aa8f0", irisR: "#f2c028", r: 6.6, line: "#100a10", lid: "#a89ab8", lidR: INK },
    muzzle: { fill: "#3e3640", fillR: k.a, chin: "#6a4a3a" }, nose: { col: "#7a4a50", line: "#100a10" }, mouth: "#9a6a60", wh: "#f2e8e0", cheeks: false,
    marks: (H) => patch(H, 270, 450, [[60, 68], [60.5, 56], [59.5, 44], [60, 32]], k.b) + ln("M63 41L65.5 33L69 39L72.5 33M72 52Q78 53 83 50M71 57Q76 61 82 60M66 30L66 26M74 31L76 28", "#a85014", 2) + ln("M40 36Q46 29 54 28", "#5a4c62", 2.4, `opacity=".7"`) }),
  angora: (k) => ({ fill: k.c, w: 27.5, h: 22.5, sh: { chin: 0.42, tufts: [[8, 66, 5, 5.5, 2], [114, 172, 5, 5.5, 2]] },
    ears: { a0: 192, a1: 256, len: 27, phi: 28, round: 0.15, col: k.c, in: "#ffbcc4", furnish: "#ffffff", tuft: 4, tuftCol: "#dfe3f0" },
    eyes: { iris: "#3a9cf8", irisR: "#f4b41e", r: 6.4, dx: 12, line: "#6a6078" }, nose: { col: "#ff9cae" }, wh: "#c4c8d8", whLen: 1.15,
    marks: () => ln("M46 33Q52 29 58 30M64 29Q70 30 75 34M36 52Q38 60 43 64M84 52Q82 60 77 64", k.a, 1.1) }),
  lykoi: (k) => ({ fill: k.c, w: 28, h: 23, sh: { chin: 0.36, tufts: [[8, 70, 6, 3.4, 1], [110, 172, 6, 3.4, 1], [225, 315, 7, 3]] },
    ears: { a0: 186, a1: 252, len: 27, phi: 40, round: 0.25, col: k.a, in: "#c8909a", deep: 0.78 },
    eyes: { iris: "#f2c81e", r: 6.6, dx: 12.4, line: "#140e18", lid: "#2a2030" }, nose: { col: "#5a4450", line: "#241a22", w: 4 }, mouth: "#2e2230", wh: "#d8d0dc", cheeks: false,
    marks: () => pair(blot([[47, 39], [56, 44], [54.5, 56], [46, 58], [38, 52], [39, 43]], k.a)) + blot([[56, 46], [64, 46], [66, 60], [72, 63], [60, 70], [48, 63], [54, 60]], k.a)
      + ln("M44 33l2 -4M52 31l1 -5M60 30v-5M68 31l-1 -5M76 34l-2 -4M33 52l-4 1M35 60l-4 3M87 52l4 1M85 60l4 3M49 29l1 -3M72 29l-1 -3M40 66l-2 3M80 66l2 3", k.b, 1.2) }),
};

// ---------- idle poses ----------
const ruff = (cx, cy, w, h, n, len, fill, x = "") => p(shape(cx, cy, w, h, { chin: 0.35, tufts: [[0, 180, n, len, 1.6]] }).d, fill, x);
const bib = (fill, d = "M45 70Q60 66 75 70Q73 84 66 92L63 100L60 95L57 100L54 92Q47 84 45 70Z") => p(d, fill);
const WRAP = "M85 102C108 103 109 119 86 117.6C75 117 64 119 56 109";
/** Wrap-around tail; `hi` adds a sheen so a one-colour tail still reads against the body. */
const wrapTail = (c, w = 9, o = {}) => rope(WRAP, c, w, o) + (o.hi ? ln("M91 104Q103 108 99 113M84 114.6Q72 115 64 113", o.hi, 1.8, `opacity=".85"`) : "");
/** The Japanese Bobtail's curled pom-pom tail. */
const pom = (k) => g("translate(90 99)", p(shape(0, 0, 11, 10.5, { tufts: [[0, 360, 11, 3]] }).d, k.a, EDGE) + blot([[-8, -3], [-2, -8], [6, -5], [0, 1]], k.b) + ln("M2 6q4 0 5 -4", "#6a5a6a", 1.4));
const sitTail = {
  up: (c, o = {}) => wag(rope("M76 110C100 114 112 96 103 82C97 72 100 62 109 60", c, o.w || 8.4, o)),
};

const CATS = {
  cats_mackerel: (k, m) => sit({ head: HEADS.mackerel(k), fill: k.c, bw: 24,
    tailBack: sitTail.up(k.c, { ring: k.a, dash: "0 22 6 11 6 11 6 11 6 40", tip: k.a }),
    marks: () => pair(ln("M43 75Q40 82 42 90M39 83Q36 90 37 96M46 73Q45 77 46.5 81", k.a, 2.4)),
    haunchMarks: pair(ln("M33 99Q39 101 41 107M31 105Q36 107 37 113", k.a, 2.2)),
    bib: bib(k.b) + ln("M49 74Q60 79 71 74M52 80Q60 84 68 80", k.a, 1.8),
    legMarks: ln("M46 97h10M46 103h10M64 97h10M64 103h10", k.a, 2.2) }, m),

  cats_classic: (k, m) => side({ head: HEADS.classic(k), fill: k.c, far: "#8a7258", bodyBox: { cx: 47, cy: 90, w: 33, h: 18 },
    tail: wag(rope("M20 90C4 86 4 66 15 56", k.c, 10.5, { ring: k.a, dash: "0 18 11 12 11 12 11 40", tip: k.a, tipLen: 14 })),
    marks: () => ln("M20 82Q40 70 66 76", k.a, 4) + el(42, 91, 13, 11, "none", `stroke="${k.a}" stroke-width="3.6"`) + el(42, 91, 6.6, 5.2, "none", `stroke="${k.a}" stroke-width="3"`) + dot(42, 91, 2.4, k.a)
      + ln("M62 79Q58 90 66 101M24 80Q18 90 24 100M30 105Q42 109 54 106", k.a, 3.2),
    legs: { bars: [103, 110], barCol: k.a }, chest: p("M66 78Q80 82 76 96Q68 98 62 90Q66 85 66 78Z", k.b) }, m),

  cats_ginger: (k, m) => sit({ head: HEADS.ginger(k), fill: k.c, bw: 26,
    tailFront: wrapTail(k.c, 10, { ring: k.a, dash: "0 20 8 13 8 13 8 40", tip: k.b, tipLen: 14 }),
    marks: () => pair(ln("M40 78Q44 80 46 85M37 87Q41 88 44 93", k.a, 2.8)),
    haunchMarks: pair(ln("M30 100Q36 100 40 104M30 107Q35 107 38 111", k.a, 2.6)),
    bib: bib(k.b), legs: { sock: k.b, sockY: 111 }, legMarks: ln("M46.5 97h9M64.5 97h9M46.5 103h9M64.5 103h9", k.a, 2.2) }, m),

  cats_tuxedo: (k, m) => sit({ head: HEADS.tuxedo(k), fill: k.c, bw: 24,
    tailBack: sitTail.up(k.c, { tip: k.b, tipLen: 8 }),
    bib: p("M44 69Q60 64 76 69Q78 86 69 99Q64 105 60 104Q56 105 51 99Q42 86 44 69Z", k.b),
    legs: { sock: k.b, sockY: 105 }, footFill: k.b,
    top: k.stage > 1 ? "" : p("M60 74.5L51 71.5V80ZM60 74.5L69 71.5V80Z", "#d8343e", `stroke="#7a1420" stroke-width=".8"`) + dot(60, 75.5, 2.8, "#a81e2a") }, m),

  cats_black: (k, m) => sit({ head: HEADS.black(k), fill: k.c, bw: 22, body: { top: 0.42 },
    tailBack: wag(rope("M76 110C108 112 108 90 100 74C94 60 96 46 107 45C115 45 116 55 108 56", k.c, 8)),
    marks: () => pair(ln("M43 80Q38 90 40 98", "#57517a", 2.4, `opacity=".7"`)) + p("M56 79Q60 76 64 79Q63 85 60 88Q57 85 56 79Z", "#f4f0fa"),
    haunchMarks: pair(ln("M30 101Q35 96 42 98", "#57517a", 2, `opacity=".7"`)), legMarks: ln("M47 96v10M64 96v10", "#57517a", 1.8, `opacity=".6"`) }, m),

  cats_cow: (k, m) => lounge({ head: HEADS.cow(k), fill: k.c, haunch: k.c,
    marks: (B) => patch(B, 205, 300, [[78, 96], [64, 100], [55, 90]], k.a) + blot([[88, 84], [102, 86], [104, 98], [94, 96]], k.a) + blot([[62, 104], [72, 102], [74, 112], [64, 112]], k.a),
    haunchMarks: blot([[93, 99], [104, 101], [104, 113], [94, 110]], k.a), pawFillR: k.c,
    tailBack: wag(rope("M100 108C116 108 118 90 108 82C102 76 104 70 110 68", k.a, 8.6, { tip: k.c })) }, m),

  cats_tortie: (k, m) => sit({ head: HEADS.tortie(k), fill: k.c, bw: 23.5,
    tailBack: sitTail.up(k.c, { ring: k.b, dash: "0 16 12 22 9 18 8 30" }),
    marks: () => blot([[37, 80], [48, 76], [50, 88], [40, 92]], k.b) + blot([[68, 72], [78, 78], [74, 88], [66, 82]], k.b) + blot([[54, 74], [62, 80], [56, 92], [50, 84]], k.a)
      + blot([[72, 92], [82, 90], [80, 102], [70, 100]], k.b) + specks([[57, 96], [63, 74], [45, 94], [76, 94], [41, 86], [66, 94]], 2.4, k.b) + specks([[70, 86], [52, 98], [44, 78], [61, 88]], 1.8, k.a),
    haunch: k.c, haunchMarks: blot([[28, 100], [38, 98], [40, 108], [32, 110]], k.b) + blot([[82, 104], [90, 102], [92, 112], [84, 114]], k.a) + specks([[34, 113], [86, 97], [80, 112]], 2.4, k.b),
    legFill: k.c, legFillR: k.b, legMarks: blot([[46, 96], [54, 94], [56, 104], [48, 106]], k.b) + blot([[64, 106], [73, 104], [72, 113], [65, 113]], k.c) + specks([[50, 113], [68, 94]], 2.2, k.a) }, m),

  cats_calico: (k, m) => sit({ head: HEADS.calico(k), fill: k.c, bw: 25,
    tailFront: wrapTail(k.b, 10, { ring: k.a, dash: "0 14 18 24 16 40" }),
    marks: (B) => patch(B, 150, 225, [[48, 80], [52, 92], [44, 102]], k.a) + patch(B, 300, 372, [[72, 100], [66, 88], [70, 76]], k.b),
    haunch: k.c, haunchMarks: blot([[76, 98], [88, 97], [90, 108], [79, 111]], k.a) + blot([[31, 103], [40, 101], [42, 111], [33, 113]], k.b) }, m),

  cats_british: (k, m) => sit({ head: HEADS.british(k), fill: k.c, bw: 31, body: { top: 0.2 }, headPos: { y: 48 },
    tailFront: wrapTail(k.c, 12, { hi: "#c4cbdc", tip: "#767e96", tipLen: 10 }),
    marks: () => pair(ln("M36 82Q32 90 34 96", k.b, 2.6)),
    bib: bib(k.b, "M44 72Q60 70 76 72Q72 88 60 92Q48 88 44 72Z"), legs: { w: 7.4 } }, m),

  cats_siamese: (k, m) => side({ head: HEADS.siamese(k), fill: k.c, far: "#2e1a14", legFill: k.a,
    bodyBox: { cx: 47, cy: 86, w: 28, h: 13.5 }, legX: [27, 37, 58, 68], legs: { w: 3.7 }, headPos: { x: 80, y: 55, k: 0.88 },
    tail: wag(rope("M22 82C2 78 4 54 14 42C20 34 30 38 26 45", k.a, 6)),
    marks: () => el(32, 85, 12, 9, "#caa68a", `opacity=".55"`) + ln("M26 93Q36 96 39 86", "#a8846a", 1.6, `opacity=".7"`),
    chest: p("M62 76Q74 70 80 66L82 82Q72 90 62 92Q66 84 62 76Z", k.c), neck: [75, 76, 12.5] }, m),

  cats_mainecoon: (k, m) => sit({ head: HEADS.maine(k), fill: k.c, bw: 28, headPos: { y: 47 },
    body: { top: 0.22, tufts: [[0, 60, 5, 5, 1.5], [120, 180, 5, 5, 1.5]] },
    tailBack: wag(fluff([[78, 108], [106, 112], [112, 74], [96, 52]], k.c, { w: 20, jag: 3.2, ring: k.a, bands: [[0.3, 0.4], [0.55, 0.65]], tip: k.a, tipFrom: 0.82, hair: "#b8946a" })),
    marks: () => pair(ln("M38 82Q42 84 43 90M35 92Q40 93 42 98", k.a, 2.6)),
    haunchMarks: pair(ln("M27 101Q33 101 36 106M27 108Q32 108 35 112", k.a, 2.4)),
    bib: ruff(60, 77, 22, 14, 9, 7, k.b),
    legs: { w: 7.6 }, legMarks: ln("M45 98h10M65 98h10M45 105h10M65 105h10", k.a, 2.2) + ln("M47 117.5l-2 2M53 118.5v1.5M67 118.5v1.5M73 117.5l2 2", "#fff0d8", 1.4) }, m),

  cats_persian: (k, m) => lounge({ head: HEADS.persian(k), fill: k.c, bw: 38, bh: 24,
    body: { tufts: [[185, 360, 14, 5.5, 1]] },
    tailFront: fluff([[102, 92], [116, 114], [92, 115], [66, 110]], k.c, { w: 17, jag: 3, hair: "#e0bc8c" }),
    marks: () => ln("M72 82Q82 84 86 94M62 90Q70 90 74 98M92 84Q100 88 102 96", "#e4c094", 1.5),
    chest: ruff(46, 90, 25, 13, 9, 5.5, k.b),
    headPos: { x: 46, y: 62 }, neck: [47, 82, 20] }, m),

  cats_russian: (k, m) => sit({ head: HEADS.russian(k), fill: k.c, bw: 21, body: { top: 0.42 },
    tailFront: wrapTail(k.c, 8, { hi: "#cdd8ec", tip: "#68768e", tipLen: 12 }),
    marks: () => pair(ln("M44 80Q40 88 41 96", k.b, 2.4)) + specks([[48, 78], [54, 86], [66, 80], [72, 90], [60, 74], [58, 94], [70, 74]], 0.9, "#e8f0ff"),
    haunchMarks: pair(ln("M31 101Q36 96 43 98", "#cdd8ec", 1.8)), bib: el(60, 82, 9, 12, k.b, `opacity=".55"`), legs: { w: 5.4 } }, m),

  cats_ragdoll: (k, m) => lounge({ head: HEADS.ragdoll(k), fill: k.c, haunch: "#d8c4ae", bw: 40, bh: 22,
    body: { tufts: [[190, 350, 10, 4.4, 1]] }, pawFill: k.b,
    tailBack: wag(fluff([[100, 104], [114, 96], [110, 66], [90, 62]], k.a, { w: 19, jag: 3, hair: "#8e6e60" })),
    marks: () => blot([[70, 80], [90, 78], [104, 90], [92, 96], [76, 90]], "#b89a86", `opacity=".75"`),
    chest: ruff(46, 90, 23, 13, 8, 5.5, k.b),
    headPos: { x: 46, y: 63 }, neck: [47, 83, 19] }, m),

  cats_norwegian: (k, m) => side({ head: HEADS.norwegian(k), fill: k.c, far: "#6a5848",
    bodyBox: { cx: 47, cy: 90, w: 31, h: 18, o: { tufts: [[30, 150, 9, 5, 2], [185, 245, 4, 3]] } },
    tail: wag(fluff([[24, 90], [6, 86], [6, 46], [32, 48]], k.c, { w: 19, jag: 3.2, ring: k.a, bands: [[0.35, 0.46], [0.62, 0.72]], hair: "#c4b09a", tip: k.a, tipFrom: 0.86 })),
    marks: () => ln("M22 83Q42 70 64 76", k.a, 4) + ln("M30 80Q28 88 32 94M42 76Q40 86 44 94M54 76Q52 84 56 90", k.a, 2.4),
    legs: { w: 6, sock: k.b, sockY: 105, bars: [99], barCol: k.a },
    chest: ruff(75, 79, 15, 11, 7, 6, k.b),
    headPos: { x: 79, y: 56, k: 0.86 }, neck: [76, 76, 15] }, m),

  cats_abyssinian: (k, m) => side({ head: HEADS.abyssinian(k), fill: k.c, far: "#8e4e24",
    bodyBox: { cx: 46, cy: 85, w: 28, h: 14 }, legX: [27, 36, 58, 67], legs: { w: 3.8 }, headPos: { x: 79, y: 56, k: 0.86 },
    tail: wag(rope("M22 82C6 84 2 100 8 112C10 118 18 119 24 116", k.c, 7.4, { tip: k.a, tipLen: 24 })),
    marks: () => ln("M20 79Q40 66 66 76", k.a, 4.6) + ticks([[28, 80], [34, 85], [40, 78], [46, 83], [52, 79], [58, 84], [36, 92], [48, 91], [64, 80], [42, 87], [56, 90], [30, 90], [22, 86], [60, 75], [32, 76], [50, 73]], k.a)
      + el(50, 95, 18, 4.4, k.b),
    chest: p("M64 74Q74 70 78 66L80 80Q72 88 64 90Q68 82 64 74Z", k.b) + ln("M66 78Q74 82 80 77", k.a, 1.6), neck: [75, 76, 12.5] }, m),

  cats_devon: (k, m) => sit({ head: HEADS.devon(k), fill: k.c, bw: 20, body: { top: 0.46, tufts: [[130, 230, 8, 2], [310, 360, 4, 2]] }, headPos: { y: 47 },
    tailBack: wag(rope("M74 110C100 116 112 100 100 86C94 78 100 68 110 70", k.c, 5.4)),
    marks: () => waves([[44, 80], [52, 74], [63, 78], [48, 92], [66, 90], [56, 84], [40, 94], [70, 82]], k.a),
    haunchMarks: waves([[30, 101], [32, 109], [80, 101], [78, 109]], k.a), bib: el(60, 80, 8, 10, k.b, `opacity=".7"`), legs: { w: 4.6 }, neck: [60, 69, 13] }, m),

  cats_sphynx: (k, m) => sit({ head: HEADS.sphynx(k), fill: k.c, bw: 22, body: { top: 0.44 }, headPos: { y: 47 },
    tailFront: wrapTail(k.c, 5, { hi: "#f8dcd0" }),
    marks: () => ln("M48 74Q60 80 72 74M50 79Q60 85 70 79M41 88Q45 90 46 95M79 88Q75 90 74 95", "#b87870", 1.3, `opacity=".85"`) + blot([[66, 90], [76, 86], [78, 96], [70, 100]], "#c88c86", `opacity=".55"`) + el(60, 94, 8, 10, k.b, `opacity=".7"`),
    haunchMarks: pair(ln("M32 99Q38 99 41 104M31 104Q35 104 37 108", "#b87870", 1.2)),
    legs: { w: 4.4 }, legMarks: ln("M48 96q3.6 2 7 0M65 96q3.6 2 7 0M48 110q3.6 1.6 7 0M65 110q3.6 1.6 7 0", "#b87870", 1.1), neck: [60, 69, 13] }, m),

  cats_bengal: (k, m) => side({ head: HEADS.bengal(k), fill: k.c, far: "#a86c2e", bodyBox: { cx: 47, cy: 89, w: 32, h: 16.5 },
    tail: wag(rope("M20 86C2 90 0 108 12 114C18 117 24 114 22 110", k.c, 10, { ring: k.a, dash: "0 16 9 10 9 10 9 40", tip: k.a, tipLen: 20 })),
    marks: () => el(50, 100, 22, 5, k.b) + rosette(28, 86, 5.4, k.a, "#b86c22", -20) + rosette(41, 80, 5, k.a, "#b86c22", 14) + rosette(43, 94, 5.8, k.a, "#b86c22", -8) + rosette(56, 85, 5.4, k.a, "#b86c22", 30)
      + rosette(68, 94, 3.8, k.a, "#b86c22", 0) + specks([[52, 75], [64, 77], [24, 96], [56, 100], [33, 100], [19, 90], [65, 103]], 2, k.a),
    legs: { w: 5.2, bars: [102, 110], barCol: k.a }, chest: p("M65 78Q80 82 74 96Q66 96 62 90Q66 85 65 78Z", k.b) + ln("M64 79Q72 86 79 80", k.a, 2.4) }, m),

  cats_bobtail: (k, m) => sit({ head: HEADS.bobtail(k), fill: k.c, bw: 22, body: { top: 0.36 },
    tailBack: wag(pom(k)),
    marks: (B) => patch(B, 168, 225, [[50, 80], [50, 92], [41, 98]], k.b) + patch(B, 318, 380, [[71, 98], [68, 88], [72, 79]], k.a),
    haunch: k.c, haunchMarks: blot([[76, 100], [86, 99], [87, 110], [77, 113]], k.b), legs: { w: 5.2 },
    top: k.stage > 1 ? "" : dot(60, 78, 4.2, "#ffd030", `stroke="#a8761a" stroke-width="1"`) + ln("M46 73Q60 80 74 73", "#d8303e", 3) + ln("M60 78v3.4M56.6 78h6.8", "#8a5a10", 0.9) }, m),

  cats_van: (k, m) => sit({ head: HEADS.van(k), fill: k.c, bw: 25, body: { top: 0.3, tufts: [[5, 55, 4, 3.6, 1], [125, 175, 4, 3.6, 1]] },
    tailBack: wag(fluff([[76, 108], [108, 112], [110, 76], [94, 58]], k.a, { w: 20, jag: 3.4, ring: "#9a4214", bands: [[0.45, 0.52], [0.66, 0.73]], hair: "#f2a264" })),
    marks: () => ln("M42 82Q39 90 40 97M78 82Q81 90 80 97M52 74Q56 82 54 88M68 74Q64 82 66 88", "#e4dccc", 1.5), legs: { w: 6.4 } }, m),

  cats_mau: (k, m) => side({ head: HEADS.mau(k), fill: k.c, far: "#949296", bodyBox: { cx: 47, cy: 88, w: 30, h: 15.5 }, legX: [28, 38, 60, 70],
    tail: wag(rope("M21 84C4 80 0 60 12 52", k.c, 7.6, { ring: k.a, dash: "0 20 7 10 7 10 7 40", tip: k.a, tipLen: 18 })),
    marks: () => ln("M20 79Q40 68 66 76", k.a, 2.8) + el(50, 99, 20, 4.4, k.b) + specks([[27, 86], [36, 81], [47, 80], [58, 82]], 2.9, k.a) + specks([[33, 93], [45, 91], [55, 94], [66, 90]], 3.2, k.a) + specks([[22, 94], [40, 100], [52, 102], [25, 80], [64, 100], [40, 87]], 1.8, k.a),
    legs: { w: 4.4, bars: [101, 108], barCol: k.a }, chest: p("M64 76Q78 80 76 93Q68 94 62 88Q66 83 64 76Z", k.b) + ln("M65 78Q72 85 79 79M65 86Q71 91 77 87", k.a, 2.2) }, m),

  cats_selkirk: (k, m) => sit({ head: HEADS.selkirk(k), fill: k.c, bw: 28, body: { top: 0.2, tufts: [[0, 60, 5, 4], [120, 240, 11, 4], [300, 360, 5, 4]] },
    tailBack: wag(fluff([[78, 110], [105, 114], [108, 86], [96, 72]], k.c, { w: 18, jag: 3, hair: k.a })),
    marks: () => curls([[38, 82], [46, 76], [76, 76], [83, 84], [37, 92], [82, 94], [66, 70], [52, 70]], k.a, 3),
    haunchMarks: curls([[30, 101], [37, 108], [30, 111], [84, 101], [90, 109], [82, 110]], k.a, 2.6),
    bib: p(shape(60, 82, 15, 13, { tufts: [[0, 360, 13, 3.4]] }).d, k.b) + curls([[53, 77], [66, 78], [59, 85], [50, 87], [69, 89]], k.a, 2.8),
    legs: { w: 6.8 }, legMarks: curls([[51, 100], [68, 98], [52, 108], [68, 108]], k.a, 2.4) }, m),

  cats_pallas: (k, m) => sit({ head: HEADS.pallas(k), fill: k.c, bw: 33, headPos: { y: 55 },
    body: { top: 0.14, tufts: [[0, 70, 6, 6.5, 2], [110, 180, 6, 6.5, 2], [195, 345, 10, 3.5]] },
    marks: () => ln("M32 82Q38 86 42 84M30 91Q36 95 40 93M88 82Q82 86 78 84M90 91Q84 95 80 93", "#5a5048", 2) + specks([[36, 76], [44, 80], [80, 78], [40, 100], [84, 100], [76, 86], [46, 72], [72, 72], [34, 96], [86, 88]], 0.9, "#f4eee2"),
    bib: ruff(60, 88, 20, 10, 7, 5, k.b),
    legs: { w: 7, top: 98 }, legMarks: ln("M45 104h11M64 104h11", "#5a5048", 2),
    tailFront: fluff([[94, 96], [114, 110], [72, 108], [48, 105]], k.c, { jag: 2.4, ring: k.a, bands: [[0.24, 0.31], [0.43, 0.5], [0.61, 0.68]], tip: k.a, tipFrom: 0.8, wid: (t) => 15 + 3 * Math.sin(Math.PI * t) }),
    neck: [60, 78, 20] }, m),

  cats_sand: (k, m) => sit({ head: HEADS.sand(k), fill: k.c, bw: 23, headPos: { y: 52 }, body: { top: 0.32 },
    tailBack: wag(rope("M76 112C104 118 118 104 112 88C110 82 106 80 104 82", k.c, 9.4, { ring: "#4a2e1c", dash: "0 56 7 9 7 40", tip: "#2e1c12", tipLen: 14 })),
    marks: () => el(60, 90, 14, 20, k.b),
    haunchMarks: pair(ln("M32 103Q37 102 41 106", "#c89a64", 2)),
    legs: { w: 5.6, top: 92, sock: k.b, sockY: 111 }, legMarks: ln("M45.6 97Q51 100 57.6 97M45.8 103Q51 106 57.4 103M62.4 97Q68 100 74.4 97M62.6 103Q68 106 74.2 103", "#5a3418", 2.8),
    under: el(60, 118.4, 50, 4.6, "#e8cc94") + dots([[18, 118], [26, 120], [100, 119], [92, 121]], 1, "#a8824a"), neck: [60, 75, 16] }, m),

  cats_blackfooted: (k, m) => side({ head: HEADS.blackfooted(k), fill: k.c, far: "#9a7442", bodyBox: { cx: 46, cy: 93, w: 27, h: 15 }, legX: [28, 37, 56, 65],
    headPos: { x: 77, y: 64, k: 0.88 },
    tail: wag(rope("M23 92C8 90 4 102 8 108", k.c, 8, { ring: k.a, dash: "0 24 12 18 12 40", tip: k.a, tipLen: 22 })),
    marks: () => el(48, 104, 18, 4, k.b) + ln("M22 87Q26 84 31 86M36 82Q41 80 46 82M51 81Q55 82 59 84", k.a, 3.4) + [[28, 94], [38, 89], [49, 88], [60, 91], [33, 101], [45, 98], [56, 101], [66, 98]].map(([x, y], i) => el(x, y, 3.8, 2.6, k.a, `transform="rotate(${i % 2 ? 22 : -18} ${x} ${y})"`)).join(""),
    legs: { w: 4.4, bars: [101, 107], barCol: k.a, sock: "#1c120c", sockY: 113.6 },
    chest: p("M62 80Q76 84 72 100Q64 100 60 94Q64 88 62 80Z", k.b) + ln("M61 83Q69 90 76 83M62 91Q68 96 73 92", k.a, 2.8), neck: [73, 82, 13],
    top: ln("M6 119l3 -9l3 9M96 119l2 -12l4 12M104 119l4 -8l1 8", "#b8a04a", 1.8) }, m),

  cats_fishing: (k, m) => side({ head: HEADS.fishing(k), fill: k.c, far: "#6a6854", bodyBox: { cx: 46, cy: 90, w: 33, h: 18.5 },
    headPos: { x: 80, y: 62, k: 0.86 },
    tail: wag(rope("M20 88C8 90 4 98 6 104", k.c, 11, { ring: k.a, dash: "0 30 14 20 14 40", tip: k.a, tipLen: 20 })),
    marks: () => el(49, 102, 22, 5, k.b) + ln("M18 82Q24 78 30 77M36 74.6h8M50 74.6Q56 75 62 77", k.a, 2.6)
      + [[22, 88], [32, 83], [44, 81], [56, 83], [25, 96], [36, 91], [48, 89], [60, 92], [31, 101], [43, 98], [55, 100], [67, 96]].map(([x, y]) => el(x, y, 3.4, 1.9, k.a)).join(""),
    legs: { w: 6.2, bars: [102], barCol: k.a },
    chest: ln("M64 80Q72 86 78 80M62 88Q70 94 75 89", k.a, 2.8),
    under: el(60, 118.2, 54, 5, "#6ac0e0") + ln("M10 119q6 -3 12 0M94 119q6 -3 12 0", "#d8f4ff", 1.4),
    top: ln("M26 118.4q3 2 6 0M62 118.4q3 2 6 0M74 118.4q3 2 6 0", "#d8cfa8", 1.4), neck: [76, 81, 15] }, m),

  cats_chimera: (k, m) => sit({ head: HEADS.chimera(k), fill: k.c, bw: 25, body: { top: 0.3, tufts: [[5, 50, 3, 3.4], [130, 175, 3, 3.4]] },
    tailBack: sitTail.up(k.b, { w: 11, ring: "#a85014", dash: "0 22 7 14 7 14 7 40" }),
    marks: (B) => patch(B, 270, 450, [[60, 112], [60.5, 94], [59.5, 80], [60, 70]], k.b) + ln("M70 76Q76 80 76 86M77 90Q81 94 80 100M66 84Q70 88 70 92", "#a85014", 2.4) + pair(ln("M43 80Q40 86 41 92", "#5a4c62", 2)),
    haunch: k.c, haunchR: k.b, haunchMarks: ln("M82 101Q87 101 90 106M81 108Q85 108 88 112", "#a85014", 2.2),
    bib: p("M60 68V94Q55 90 52 84Q48 78 48 71Z", "#4a3c46") + p("M60 68V94Q65 90 68 84Q72 78 72 71Z", k.a),
    legFill: k.c, legFillR: k.b, legMarks: ln("M65 98h8M65 105h8", "#a85014", 2) }, m),

  cats_angora: (k, m) => side({ head: HEADS.angora(k), fill: k.c, far: "#d8dae6",
    bodyBox: { cx: 46, cy: 89, w: 28, h: 15.5, o: { tufts: [[25, 155, 10, 5, 2.5], [195, 250, 4, 2.6]] } }, legX: [28, 37, 58, 67], legs: { w: 4.6 },
    tail: wag(fluff([[23, 86], [3, 70], [16, 32], [46, 44]], k.c, { w: 19, jag: 3.6, hair: k.a })),
    marks: () => ln("M26 84Q36 80 44 83M38 94Q48 92 56 96M48 79Q56 78 62 82", k.a, 1.4),
    chest: ruff(75, 80, 13.5, 10.5, 7, 5.5, k.b, `stroke="${k.a}" stroke-width=".9"`),
    headPos: { x: 79, y: 56, k: 0.85 }, neck: [76, 75, 13.5],
    top: [[12, 24], [104, 30], [96, 12]].map(([x, y]) => p(`M${x} ${y - 6}q1.2 4.8 6 6q-4.8 1.2 -6 6q-1.2 -4.8 -6 -6q4.8 -1.2 6 -6Z`, "#fff3b0", `class="bd-glow"`)).join("") }, m),

  cats_lykoi: (k, m) => sit({ head: HEADS.lykoi(k), fill: k.c, bw: 22, body: { top: 0.38, tufts: [[0, 60, 7, 3.4, 1], [120, 240, 13, 3.4, 1], [300, 360, 7, 3.4, 1]] },
    tailBack: wag(fluff([[76, 110], [108, 112], [114, 84], [96, 70]], k.c, { w: 10, jag: 3.4, hair: k.b })),
    marks: () => ln("M44 78l-2 5M50 74l-1 5M70 74l1 5M76 78l2 5M55 82v5M65 82v5M42 90l-2 4M78 90l2 4M60 90v5M50 90l-1 4M70 90l1 4M60 76v4M47 84v4M73 84v4", k.b, 1.2),
    haunchMarks: ln("M30 100l-1 4M36 104v5M31 108l-1 4M90 100l1 4M84 104v5M89 108l1 4", k.b, 1.2), footFill: k.a,
    legs: { w: 5, sock: k.a, sockY: 109 }, legMarks: ln("M49 94v4M53 101v4M67 94v4M71 101v4", k.b, 1.2), neck: [60, 70, 15] }, m),
};

// ---------- signature behaviours ----------
const text = (x, y, s, size, fill, stroke = "#2a1420", cls = "") => `<text ${cls ? `class="${cls}" ` : ""}x="${x}" y="${y}" font-size="${size}" font-family="system-ui" font-weight="800" text-anchor="middle" fill="${fill}" stroke="${stroke}" stroke-width="2.6" paint-order="stroke">${s}</text>`;
const heart = (x, y, k = 1, col = "#ff5a80") => p(`M${x} ${y + 5 * k}l${-5.5 * k} ${-5.5 * k}a${3.2 * k} ${3.2 * k} 0 0 1 ${5.5 * k} ${-3.2 * k}a${3.2 * k} ${3.2 * k} 0 0 1 ${5.5 * k} ${3.2 * k}Z`, col, `stroke="#fff" stroke-width="1"`);
/** Group with a signature class (never with a transform attribute). */
const s_ = (name, svg) => `<g class="bd-s-cats-${name}">${svg}</g>`;
const anim = (name, kf, timing, extra = "") => `.bd-s-cats-${name}{animation:cats${name} ${timing} infinite;${extra}}@keyframes cats${name}{${kf}}`;
/** Stage scarf and hat, for poses where they must move with the animated cat. */
const worn = (k, neck, cap) => (k.stage >= 2 && neck ? scarf(...neck) : "") + (k.stage >= 3 && cap ? hat(...cap) : "");
const POP = anim("pop", "0%,60%{opacity:1;transform:translateY(0)}80%{opacity:.15;transform:translateY(-6px)}81%{opacity:0;transform:translateY(3px)}100%{opacity:1;transform:translateY(0)}", "2s ease-out");

// Each returns { body, neck, cap, css, shadow }. Frame 0 already shows the behaviour (for static sprites).
const SIG = {
  cats_mackerel(k, m) {
    const hs = HEADS.mackerel(k);
    const shut = pair(ln("M40.5 49.5Q47.5 55.5 54.5 49.5", k.a, 3) + ln("M40.5 49.5l-2.6 -1.4", k.a, 1.8));
    const half = pair(p("M37.4 49Q37.8 39.6 47.5 39.6Q57.2 39.6 57.6 49Q47.5 45.4 37.4 49Z", "#bd9e76") + ln("M39.6 50Q47.5 46.6 55.4 50", k.a, 2));
    const rig = sit({ head: { ...hs, over: () => s_("half", half) + s_("shut", `${pair(el(47.5, 49, 10.4, 9.8, "#bd9e76"))}${shut}`) + s_("open", eyesSvg(hs, "happy", {})) },
      headPos: { rot: -9, y: 48, eyes: {} }, fill: k.c, bw: 24,
      tailFront: wrapTail(k.c, 9, { ring: k.a, dash: "0 22 6 11 6 11 6 11 6 40", tip: k.a }),
      marks: () => pair(ln("M43 75Q40 82 42 90M39 83Q36 90 37 96", k.a, 2.4)), haunchMarks: pair(ln("M33 99Q39 101 41 107M31 105Q36 107 37 113", k.a, 2.2)),
      bib: bib(k.b) + ln("M49 74Q60 79 71 74", k.a, 1.8), legMarks: ln("M46 97h10M46 103h10M64 97h10M64 103h10", k.a, 2.2) }, m);
    rig.body += s_("love", heart(100, 34, 1.5) + heart(108, 17, 1)) + text(19, 24, "blink", 10, "#fff2c8");
    rig.css = anim("shut", "0%,34%{opacity:1}44%,70%{opacity:0}82%,100%{opacity:1}", "3.6s ease-in-out")
      + anim("half", "0%,34%{opacity:0}40%{opacity:1}46%,68%{opacity:0}76%{opacity:1}82%,100%{opacity:0}", "3.6s linear", "opacity:0;")
      + anim("open", "0%,38%{opacity:0}46%,68%{opacity:1}78%,100%{opacity:0}", "3.6s ease-in-out", "opacity:0;")
      + anim("love", "0%{transform:translate(0,4px);opacity:1}40%{transform:translate(0,-6px);opacity:.2}60%{opacity:0;transform:translate(0,8px)}100%{opacity:1;transform:translate(0,4px)}", "3.6s ease-out");
    return rig;
  },

  cats_classic(k, m) {
    const hs = HEADS.classic(k);
    const loaf = "M14 117Q8 116 9 104Q10 76 34 72Q52 69 70 72Q104 74 110 100Q114 116 102 117Q60 121 14 117Z";
    const body = s_("loaf", p(loaf, k.c, EDGE)
      + ln("M40 74Q70 68 96 82", k.a, 3.6) + el(84, 96, 13, 10, "none", `stroke="${k.a}" stroke-width="3.4"`) + el(84, 96, 6.4, 4.8, "none", `stroke="${k.a}" stroke-width="2.8"`) + dot(84, 96, 2.2, k.a)
      + ln("M104 92Q108 102 103 112M64 76Q60 84 66 92M16 100Q12 108 18 114", k.a, 3)
      + p("M24 116Q22 100 46 100Q68 102 66 117Q44 119 24 116Z", k.b)
      + rope("M106 106C112 119 88 116.5 66 116", k.c, 9, { ring: k.a, dash: "0 20 12 14 12 14 12 40", tip: k.a })
      + head(hs, "sleepy", { x: 43, y: 71, k: 0.98 }));
    const steam = s_("steam", ln("M76 62q-6 -7 0 -13t0 -13M90 66q6 -7 0 -13t0 -12M102 74q-5 -6 0 -11t0 -9", "#fff6e0", 2.8));
    return { body: body + steam, neck: [44, 92, 17], cap: capOf(hs, 43, 71, 0.98),
      css: anim("loaf", "0%,100%{transform:scale(1,1)}50%{transform:scale(1.025,.965)}", "2.6s ease-in-out", "transform-origin:60px 118px;")
        + anim("steam", "0%{opacity:1;transform:translateY(2px)}70%{opacity:0;transform:translateY(-12px)}71%{transform:translateY(6px)}100%{opacity:1;transform:translateY(2px)}", "2.4s ease-out") };
  },

  cats_ginger(k, m) {
    const hs = HEADS.ginger(k);
    const rig = sit({ head: hs, fill: k.c, bw: 26, headPos: { y: 46, eyes: {} },
      tailBack: sitTail.up(k.c, { w: 10, ring: k.a, dash: "0 20 8 13 8 13 8 40", tip: k.b }),
      marks: () => pair(ln("M40 78Q44 80 46 85M37 87Q41 88 44 93", k.a, 2.8)), haunchMarks: pair(ln("M30 100Q36 100 40 104M30 107Q35 107 38 111", k.a, 2.6)),
      bib: bib(k.b), noLegs: true }, "sleepy");
    // Replace the planted legs with two kneading paws over a plump cushion.
    const paw = (x, name) => s_(name, p(`M${x - 6} 84Q${x - 9} 98 ${x - 9.5} 105Q${x - 9} 113 ${x} 113Q${x + 9} 113 ${x + 9.5} 105Q${x + 9} 98 ${x + 6} 84Z`, k.c, EDGE) + p(`M${x - 9.4} 105Q${x} 100 ${x + 9.4} 105Q${x + 9} 113 ${x} 113Q${x - 9} 113 ${x - 9.4} 105Z`, k.b) + ln(`M${x - 4} 108v4M${x} 108.6v4.2M${x + 4} 108v4`, "#b86a3a", 1.2) + ln(`M${x - 5} 92h10`, k.a, 2.2));
    const cushion = p("M14 111Q18 102 34 108Q60 114 86 108Q102 102 106 111Q111 121 92 120H28Q9 121 14 111Z", "#7a5ab8", EDGE) + ln("M24 115Q60 121 96 115", "#b898e8", 1.8) + dots([[22, 112], [98, 112]], 2.4, "#ffd84d");
    rig.body += cushion + paw(47, "kneadl") + paw(73, "kneadr")
      + s_("dentl", ln("M34 111q4 -5 3 -10M58 112q2 -3 1 -5", "#fff", 1.8)) + s_("dentr", ln("M86 111q-4 -5 -3 -10M62 112q-2 -3 -1 -5", "#fff", 1.8)) + s_("pop", text(101, 36, "purr", 11, "#ffe8a8") + heart(18, 36, 1.2));
    rig.css = anim("kneadl", "0%,100%{transform:translateY(3px)}50%{transform:translateY(-9px)}", ".9s ease-in-out")
      + anim("kneadr", "0%,100%{transform:translateY(-9px)}50%{transform:translateY(3px)}", ".9s ease-in-out")
      + anim("dentl", "0%,25%{opacity:1}50%,75%{opacity:0}100%{opacity:1}", ".9s linear") + anim("dentr", "0%,25%{opacity:0}50%,75%{opacity:1}100%{opacity:0}", ".9s linear") + POP;
    return rig;
  },

  cats_tuxedo(k, m) {
    const hs = HEADS.tuxedo(k);
    const cat = s_("box", rope("M84 88C108 82 112 62 100 52", k.c, 9, { tip: k.b, tipLen: 10 }) + el(60, 90, 30, 22, k.c, EDGE) + bib(k.b) + head(hs, m, { x: 60, y: 55, rot: 4 }) + worn(k, [60, 76, 16], capOf(hs, 60, 55)));
    const flap = (d) => p(d, "#d8a866", EDGE);
    const box = flap("M24 85L6 73L18 66L38 85Z") + flap("M96 85L114 73L102 66L82 85Z") + p("M22 84H98L95 118H25Z", "#c4904e", EDGE) + p("M22 84H98L97.4 91H22.6Z", "#a8743a") + ln("M30 96v14M34 96v14", "#8a5a2a", 1.6)
      + p("M48 96H72V110H48Z", "#f4e8d0") + text(60, 106.5, "FRAGILE", 5.6, "#b8282e", "#f4e8d0")
      + pair(el(41, 85.5, 8, 5.6, k.b, EDGE) + toes(41, 85.5));
    return { body: cat + box, neck: null, cap: null, top: s_("pop", text(18, 34, "fits!", 12, "#ffe8a8")),
      css: anim("box", "0%,100%{transform:translateY(0)}18%,34%{transform:translateY(22px)}52%{transform:translateY(-5px)}62%{transform:translateY(0)}", "3.2s ease-in-out") + POP };
  },

  cats_black(k, m) {
    const hs = HEADS.black(k);
    const leg = (x1, y1, x2, y2) => ln(`M${x1} ${y1}L${x2} ${y2}`, "#1b1020", 12, `opacity=".3"`) + ln(`M${x1} ${y1}L${x2} ${y2}`, k.c, 10);
    const cat = s_("zoom", fluff([[34, 78], [14, 78], [6, 52], [22, 32]], k.c, { w: 15, jag: 4, hair: "#57517a" })
      + leg(38, 88, 15, 106) + leg(70, 86, 98, 107)
      + p("M24 82Q30 60 52 70Q70 74 86 72Q94 90 74 96Q54 90 38 98Q24 98 24 82Z", k.c, EDGE) + ln("M32 74Q42 66 54 74", "#57517a", 2.6)
      + leg(34, 90, 24, 112) + leg(74, 90, 90, 113)
      + head(hs, m, { x: 79, y: 63, k: 0.86, rot: 12, ears: { phi: 62 }, eyes: { r: 8, dx: 13 }, mouth: "tongue" }) + worn(k, [74, 80, 13], capOf(hs, 80, 62, 0.86)));
    const lines = s_("speed", ln("M2 52h18M4 68h12M1 94h20M10 108h8", "#fff", 2.8)) + s_("dust", dots([[14, 116], [24, 118], [7, 111]], 3.4, "#e8dcc8"));
    return { body: lines + cat, neck: null, cap: null,
      css: anim("zoom", "0%{transform:translate(0,-6px) rotate(-4deg)}25%{transform:translate(9px,2px) rotate(3deg)}50%{transform:translate(0,-9px) rotate(-6deg)}75%{transform:translate(-11px,1px) rotate(4deg)}100%{transform:translate(0,-6px) rotate(-4deg)}", ".7s linear", "transform-origin:60px 90px;")
        + anim("speed", "0%,100%{opacity:1;transform:translateX(0)}50%{opacity:.2;transform:translateX(-5px)}", ".35s linear")
        + anim("dust", "0%{opacity:.9;transform:translate(6px,0)}100%{opacity:0;transform:translate(-12px,-8px)}", ".7s ease-out") };
  },

  cats_tortie(k, m) {
    const hs = HEADS.tortie(k);
    const win = p("M66 6H116V58H66Z", "#bfe4fb", `stroke="#8a5a32" stroke-width="4"`) + ln("M91 6V58", "#8a5a32", 2.4) + ln("M68 47Q90 42 114 46", "#7a5230", 3)
      + s_("bird", el(100, 34, 8.4, 7, "#8a6a52") + dot(95, 28, 5.4, "#a85a32") + p("M90 28L84 29.6L90 31Z", "#e8a82a") + p("M105 33L115 28L112 39Z", "#5a4436") + dot(93.4, 27, 1.4, "#14131f") + el(100, 37, 5, 3.4, "#f0e0c8") + ln("M97 41v5M102 41v5", "#c87a4a", 1.4));
    const chatterHead = { ...hs, over: () => s_("jaw", p("M54 64Q60 62 66 64Q66 72 60 72Q54 72 54 64Z", "#6a1830", `stroke="#e8c0a0" stroke-width="1.2"`) + p("M55.6 64.4l1.6 3l1.6 -3.2ZM61 64.2l1.8 3.2l1.6 -3Z", "#fff")) };
    const rig = sit({ head: chatterHead, fill: k.c, bw: 23.5, headPos: { x: 50, y: 50, rot: 20 },
      tailBack: s_("flick", rope("M44 110C14 118 2 100 10 86", k.c, 9, { ring: k.b, dash: "0 16 12 22 9 40" })),
      marks: () => blot([[37, 80], [48, 76], [50, 88], [40, 92]], k.b) + blot([[68, 72], [78, 78], [74, 88], [66, 82]], k.b) + blot([[54, 74], [62, 80], [56, 92], [50, 84]], k.a) + blot([[72, 92], [82, 90], [80, 102], [70, 100]], k.b),
      haunchMarks: blot([[28, 100], [38, 98], [40, 108], [32, 110]], k.b) + blot([[82, 104], [90, 102], [92, 112], [84, 114]], k.a),
      legFillR: k.b, neck: [54, 73, 15] }, m);
    rig.body = win + rig.body + s_("ek", text(104, 76, "ek-ek!", 10, "#fff2c8"));
    rig.css = anim("jaw", "0%,100%{transform:scaleY(1)}50%{transform:scaleY(.25)}", ".16s linear", "transform-origin:60px 64px;")
      + anim("bird", "0%,100%{transform:translate(0,0)}30%{transform:translate(-5px,-4px)}60%{transform:translate(3px,0)}", "1.3s ease-in-out")
      + anim("flick", "0%,100%{transform:rotate(0)}50%{transform:rotate(14deg)}", ".5s ease-in-out", "transform-origin:44px 110px;")
      + anim("ek", "0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}", ".32s linear");
    return rig;
  },

  cats_calico(k, m) {
    const hs = HEADS.calico(k);
    const rig = sit({ head: hs, fill: k.c, bw: 25, headPos: { x: 55, y: 49, rot: 11, mouth: "tongue" },
      tailFront: wrapTail(k.b, 10, { ring: k.a, dash: "0 14 18 24 16 40" }),
      marks: (B) => patch(B, 150, 225, [[48, 80], [52, 92], [44, 102]], k.a) + patch(B, 300, 372, [[72, 100], [66, 88], [70, 76]], k.b),
      haunchMarks: blot([[76, 98], [88, 97], [90, 108], [79, 111]], k.a) + blot([[31, 103], [40, 101], [42, 111], [33, 113]], k.b), noLegR: true, neck: [58, 73, 15] }, "sleepy");
    const paw = s_("wash", ln("M80 97Q97 86 76 67", "#6a5448", 13.6, `opacity=".35"`) + ln("M80 97Q97 86 76 67", k.c, 11.6) + el(74, 64, 8.4, 9.4, k.c, `stroke="#1b1020" stroke-opacity=".3" stroke-width="1.1" transform="rotate(-34 74 64)"`) + el(72.6, 65.4, 3.6, 4, "#ffb0b4", `transform="rotate(-34 72.6 65.4)"`) + dots([[68, 61], [71.6, 57.6], [76.6, 57.4]], 1.7, "#ffb0b4"));
    rig.body += paw + s_("pop", ln("M96 52q6 -3 8 -8M98 62h9M93 43q2 -5 1 -9", "#bfe8ff", 2.4));
    rig.css = anim("wash", "0%,100%{transform:translate(0,0)}25%{transform:translate(-6px,-10px)}50%{transform:translate(-1px,-17px)}75%{transform:translate(4px,-5px)}", "1.3s ease-in-out") + POP;
    return rig;
  },

  cats_siamese(k, m) {
    const hs = HEADS.siamese(k);
    const rig = sit({ head: hs, fill: k.c, bw: 21, body: { top: 0.44 }, headPos: { x: 55, y: 50, rot: -17, mouth: "open", eyes: {} },
      tailBack: s_("tail", rope("M76 110C102 112 112 92 104 76C98 66 102 56 112 58", k.a, 6.4)),
      marks: () => el(60, 88, 10, 16, k.b), haunch: "#d8bc9e", legFill: k.a, footFill: k.a, legs: { w: 4.8 }, neck: [57, 73, 13] }, "sleepy");
    rig.body = rig.body + s_("wave", ln("M86 44q7 9 0 18M94 38q12 15 0 30M102 32q17 21 0 42", "#fff2c8", 2.8)) + s_("word", text(24, 20, "MRRROW", 10, "#ffd84d"));
    rig.body = s_("yowl", rig.body);
    rig.css = anim("yowl", "0%,100%{transform:scale(1,1)}50%{transform:scale(.99,1.025)}", ".6s ease-in-out", "transform-origin:60px 118px;")
      + anim("wave", "0%{opacity:1}50%{opacity:.25}100%{opacity:1}", ".6s ease-in-out") + anim("word", "0%,100%{transform:translate(0,0) rotate(-3deg)}50%{transform:translate(1px,-3px) rotate(4deg)}", ".3s linear", "transform-origin:24px 18px;") + anim("tail", "0%,100%{transform:rotate(-5deg)}50%{transform:rotate(8deg)}", "1.2s ease-in-out", "transform-origin:76px 110px;");
    return rig;
  },

  cats_mainecoon(k, m) {
    const hs = HEADS.maine(k);
    const rig = sit({ head: hs, fill: k.c, bw: 28, headPos: { x: 55, y: 49, rot: -13, mouth: "small" },
      body: { top: 0.22, tufts: [[0, 60, 5, 5, 1.5], [120, 180, 5, 5, 1.5]] },
      tailBack: s_("flag", fluff([[78, 108], [116, 100], [98, 56], [104, 20]], k.c, { w: 21, jag: 3.8, ring: k.a, bands: [[0.35, 0.45], [0.58, 0.68]], tip: k.a, tipFrom: 0.84, hair: "#b8946a" })),
      marks: () => pair(ln("M38 82Q42 84 43 90M35 92Q40 93 42 98", k.a, 2.6)), haunchMarks: pair(ln("M27 101Q33 101 36 106M27 108Q32 108 35 112", k.a, 2.4)),
      bib: ruff(60, 77, 22, 14, 9, 7, k.b),
      legs: { w: 7.6 }, legMarks: ln("M45 98h10M65 98h10M45 105h10M65 105h10", k.a, 2.2), neck: [57, 73, 17] }, m);
    const bubble = s_("pop", g("scale(.76)", p("M3 3H44a4 4 0 0 1 4 4V19a4 4 0 0 1 -4 4H33l1 7l-9 -7H7a4 4 0 0 1 -4 -4V7a4 4 0 0 1 4 -4Z", "#fff", `stroke="${INK}" stroke-width="1.4"`) + `<text x="25.5" y="16.6" font-size="10.5" font-family="system-ui" font-weight="800" text-anchor="middle" fill="${INK}">prrrt?</text>`))
      + s_("note", text(11, 50, "♪", 16, "#ffe28a") + text(21, 66, "♫", 12, "#ffe28a"));
    rig.body += bubble;
    rig.css = anim("flag", "0%,100%{transform:rotate(-4deg)}50%{transform:rotate(6deg)}", ".7s ease-in-out", "transform-origin:78px 108px;") + anim("note", "0%{transform:translate(0,3px)}50%{transform:translate(-4px,-7px)}100%{transform:translate(0,3px)}", "1.4s ease-in-out") + POP;
    return rig;
  },

  cats_persian(k, m) {
    const hs = HEADS.persian(k);
    const cushion = p("M7 98Q8 88 24 92Q60 86 96 92Q112 88 113 98Q120 115 104 118Q60 124 16 118Q0 115 7 98Z", "#a8325e", EDGE) + ln("M14 108Q60 118 106 108", "#ffd27a", 2.2)
      + pair(dot(9, 96, 3.4, "#ffd27a") + ln("M9 98l-4 11M9 98l0 12M9 98l3 11", "#ffd27a", 1.6));
    const curl = s_("curl", p(shape(66, 85, 41, 25, { tufts: [[150, 360, 15, 5, 1]] }).d, k.c, EDGE) + ln("M70 66Q90 68 98 82M80 74Q92 80 96 92M58 66Q66 64 76 70", "#e0bc8c", 1.6)
      + el(46, 82, 31, 25, "#a8743c", `opacity=".22"`) + head(hs, "sleepy", { x: 43, y: 78, k: 0.9, rot: -14 })
      + fluff([[104, 90], [114, 114], [72, 115], [33, 108]], k.c, { w: 14, jag: 2.8, hair: "#e0bc8c" }));
    const z = s_("z1", text(88, 46, "Z", 16, "#e8f0ff", "#3a2a5a")) + s_("z2", text(101, 30, "z", 13, "#e8f0ff", "#3a2a5a")) + s_("z3", text(110, 18, "z", 9, "#e8f0ff", "#3a2a5a"));
    return { body: cushion + curl + z, neck: null, cap: capOf(hs, 41, 77, 0.9),
      css: anim("curl", "0%,100%{transform:scale(1,1)}50%{transform:scale(1.028,1.04)}", "3.4s ease-in-out", "transform-origin:60px 108px;")
        + [1, 2, 3].map((i) => anim(`z${i}`, "0%{opacity:1;transform:translate(0,0)}60%{opacity:.35;transform:translate(3px,-6px)}61%{opacity:0;transform:translate(-3px,5px)}100%{opacity:1;transform:translate(0,0)}", "2.4s ease-in-out", `animation-delay:${i * 0.3}s;`)).join("") };
  },

  cats_ragdoll(k, m) {
    const hs = HEADS.ragdoll(k);
    const limb = (name, d, ex, ey, ox, oy) => ({ svg: s_(name, ln(d, "#4a3028", 14.4, `opacity=".3"`) + ln(d, k.c, 12.4) + el(ex, ey, 8, 7.4, k.b, EDGE) + el(ex, ey + 1.6, 3.4, 2.8, "#ffacb4") + dots([[ex - 3.8, ey - 2.6], [ex, ey - 4], [ex + 3.8, ey - 2.6]], 1.4, "#ffacb4")), ox, oy });
    const limbs = [limb("legfl", "M46 90Q34 82 36 66", 36, 63, 46, 90), limb("legfr", "M64 86Q70 74 62 62", 61, 59, 64, 86), limb("leghl", "M84 98Q86 82 96 76", 98, 73, 84, 98), limb("leghr", "M94 104Q108 98 110 86", 110, 83, 94, 104)];
    const cat = s_("flop", fluff([[96, 108], [112, 120], [76, 122], [46, 114]], k.a, { w: 14, jag: 2.8, hair: "#8e6e60" })
      + p(shape(70, 100, 36, 17, { tufts: [[0, 180, 9, 4, 1]] }).d, k.c, EDGE) + el(68, 97, 26, 11.5, k.b)
      + limbs.map((q) => q.svg).join("") + head(hs, "happy", { x: 30, y: 92, k: 0.82, rot: -112, mouth: "tongue" })
      + worn(k, null, [24, 77, 0.6]));
    const hearts = s_("pop", heart(84, 40, 1.5) + heart(18, 42, 1.1) + text(60, 28, "flop!", 13, "#fff2c8"));
    return { body: cat + hearts, neck: null, cap: null,
      css: anim("flop", "0%,100%{transform:rotate(-4deg)}50%{transform:rotate(5deg)}", "2.4s ease-in-out", "transform-origin:60px 112px;")
        + ["legfl", "legfr", "leghl", "leghr"].map((n, i) => anim(n, `0%,100%{transform:rotate(${i % 2 ? 7 : -7}deg)}50%{transform:rotate(${i % 2 ? -9 : 9}deg)}`, `${1.1 + i * 0.17}s ease-in-out`, `transform-origin:${limbs[i].ox}px ${limbs[i].oy}px;`)).join("") + POP };
  },

  cats_sphynx(k, m) {
    const hs = HEADS.sphynx(k);
    const back = p("M6 117Q10 58 38 36Q60 20 84 40Q108 60 114 117Z", "#5a9ac8", EDGE);
    const cave = p("M24 112Q22 54 60 50Q98 54 96 112Z", "#2c4a72");
    const cat = s_("peek", head(hs, m, { x: 60, y: 78, k: 0.92 }) + worn(k, null, capOf(hs, 60, 76, 0.88)));
    const front = p("M6 117Q10 88 26 98Q40 112 52 104Q60 99 68 104Q82 114 96 98Q110 88 114 117Q60 123 6 117Z", "#6cb0da", EDGE) + ln("M18 106Q32 116 46 112M74 112Q90 116 104 104", "#d8f0ff", 2.2)
      + p("M24 100Q18 62 46 48Q28 70 36 106ZM96 100Q102 62 74 48Q92 70 84 106Z", "#6cb0da", EDGE) + [[24, 62], [40, 38], [78, 38], [96, 62], [14, 94], [106, 94], [60, 30]].map(([x, y]) => p(`M${x - 4} ${y}h8M${x} ${y - 4}v8`, "none", `stroke="#fff" stroke-width="2" stroke-linecap="round"`)).join("")
      + pair(el(44, 106, 8.4, 5.4, k.c, EDGE) + toes(44, 106));
    return { body: back + cave + cat + front, neck: null, cap: null, top: s_("pop", text(102, 28, "toasty", 10, "#ffe0a0")),
      css: anim("peek", "0%,100%{transform:translateY(0)}35%,50%{transform:translateY(13px)}70%{transform:translateY(-3px)}", "3.4s ease-in-out") + POP };
  },

  cats_bengal(k, m) {
    const hs = HEADS.bengal(k);
    const spokes = [0, 30, 60, 90, 120, 150].map((a) => ln(`M60 14V114`, "#a87a52", 2, `transform="rotate(${a} 60 64)" opacity=".55"`)).join("");
    const wheel = p("M60 6a57 57 0 1 0 .1 0ZM60 16a47 47 0 1 1 -.1 0Z", "#d8b080", `fill-rule="evenodd" stroke="#7a5230" stroke-width="2"`);
    const spin = s_("spin", spokes + [0, 24, 48, 72, 96, 120, 144, 168, 192, 216, 240, 264, 288, 312, 336].map((a) => ln("M60 9V14", "#8a5a32", 2.6, `transform="rotate(${a} 60 64)"`)).join(""));
    const leg = (d) => ln(d, "#4a2410", 10, `opacity=".35"`) + ln(d, k.c, 8.2);
    const cat = s_("run", rope("M34 86C20 84 14 72 18 62", k.c, 8, { ring: k.a, dash: "0 24 12 18 12 40", tip: k.a, tipLen: 20 })
      + leg("M40 90L24 103") + leg("M68 90L86 100")
      + p("M28 86Q34 70 52 77Q68 80 82 76Q90 94 70 100Q52 96 40 101Q28 98 28 86Z", k.c, EDGE) + rosette(40, 87, 4.6, k.a, "#b86c22") + rosette(55, 89, 4.8, k.a, "#b86c22", 20) + specks([[34, 94], [63, 83], [47, 80], [70, 94]], 1.8, k.a)
      + leg("M40 95L36 106L28 108") + leg("M70 95L78 107L88 106")
      + head(hs, m, { x: 79, y: 69, k: 0.74, rot: 6, mouth: "tongue" }) + worn(k, [74, 83, 11], capOf(hs, 79, 69, 0.74)));
    const stand = p("M26 114L18 121H34ZM94 114L86 121H102Z", "#6a4528") + ln("M16 121H104", "#6a4528", 3.4);
    return { body: wheel + spin + stand + cat + s_("whirr", ln("M16 52q-4 10 -3 20M24 42q-3 6 -4 10M104 40q5 8 7 16", "#fff", 2.6)), neck: null, cap: null,
      css: anim("spin", "from{transform:rotate(0)}to{transform:rotate(360deg)}", "1s linear", "transform-origin:60px 64px;")
        + anim("run", "0%,100%{transform:translate(0,0) rotate(-3deg)}50%{transform:translate(2px,-6px) rotate(4deg)}", ".34s ease-in-out", "transform-origin:60px 90px;")
        + anim("whirr", "0%,100%{opacity:1}50%{opacity:.15}", ".25s linear") };
  },

  cats_bobtail(k, m) {
    const hs = HEADS.bobtail(k);
    const rig = sit({ head: hs, fill: k.c, bw: 22, body: { top: 0.36 }, headPos: { x: 62, rot: 6, eyes: {} },
      tailBack: pom(k),
      marks: (B) => patch(B, 168, 225, [[50, 80], [50, 92], [41, 98]], k.b) + patch(B, 318, 380, [[71, 98], [68, 88], [72, 79]], k.a),
      haunchMarks: blot([[76, 100], [86, 99], [87, 110], [77, 113]], k.b), noLegs: true, neck: [61, 71, 15] }, m);
    const coin = el(66, 99, 10, 14, "#ffd030", `stroke="#a8761a" stroke-width="1.4" transform="rotate(14 66 99)"`) + ln("M63 92l6 1.4M62 99l8 2M64 106l5 1.2", "#a8761a", 1.8) + frontLeg(71, k.c, { w: 5.2, top: 96 });
    const arm = s_("beck", ln("M42 90Q22 82 25 58", "#4a3028", 13, `opacity=".3"`) + ln("M42 90Q22 82 25 58", k.c, 11) + ln("M35 85Q27 80 25.4 74", k.b, 10.4) + el(26, 52, 9, 9.6, k.c, EDGE) + el(26.6, 54, 4, 4.4, "#ffacb4") + dots([[21, 49], [25.4, 46.6], [30.4, 48]], 1.7, "#ffacb4"));
    rig.body += coin + dot(60, 77, 4.2, "#ffd030", `stroke="#a8761a" stroke-width="1"`) + ln("M47 72Q61 80 75 72", "#d8303e", 3) + dot(61, 78, 4, "#ffd030", `stroke="#a8761a" stroke-width="1"`) + arm
      + s_("pop", [[104, 30], [12, 22], [108, 66]].map(([x, y]) => p(`M${x} ${y - 7}q1.4 5.6 7 7q-5.6 1.4 -7 7q-1.4 -5.6 -7 -7q5.6 -1.4 7 -7Z`, "#ffe46a", `stroke="#a8761a" stroke-width=".8"`)).join(""));
    rig.css = anim("beck", "0%,100%{transform:rotate(-9deg)}50%{transform:rotate(16deg)}", ".8s ease-in-out", "transform-origin:42px 90px;") + POP;
    return rig;
  },

  cats_van(k, m) {
    const hs = HEADS.van(k);
    const water = p("M2 90Q16 82 30 90T60 90T90 90T118 90V114Q60 128 2 114Z", "#5ac4e8", `opacity=".88"`) + ln("M8 100q8 -5 16 0t16 0M70 106q8 -5 16 0t16 0M34 113q8 -4 16 0t16 0", "#d8f6ff", 2);
    const cat = s_("bob", fluff([[84, 94], [112, 96], [118, 60], [92, 50]], k.a, { w: 17, jag: 3.2, ring: "#9a4214", bands: [[0.4, 0.48], [0.64, 0.72]], hair: "#f2a264" })
      + el(66, 90, 30, 14, k.c, EDGE) + head(hs, m, { x: 48, y: 63, k: 0.97, rot: -6, mouth: "tongue" }) + worn(k, null, capOf(hs, 48, 63, 0.97)));
    const paws = s_("paddlel", el(25, 90, 8.6, 6.4, k.c, EDGE) + toes(25, 90)) + s_("paddler", el(75, 91, 8.6, 6.4, k.c, EDGE) + toes(75, 91));
    const drop = (x, y, k2 = 1) => p(`M${x} ${y - 6 * k2}q${5 * k2} ${7 * k2} 0 ${8 * k2}q${-5 * k2} ${-1 * k2} 0 ${-8 * k2}Z`, "#8ad8f6", `stroke="#2a7aa8" stroke-width=".8"`);
    const splash = s_("splashl", drop(11, 70, 1.2) + drop(19, 56) + drop(5, 86, 0.8) + ln("M14 84q-6 -8 -10 -4", "#d8f6ff", 2.4)) + s_("splashr", drop(105, 78) + drop(92, 36, 0.8) + drop(112, 90, 1.1) + ln("M92 86q8 -9 14 -3", "#d8f6ff", 2.4));
    return { body: cat + water + paws + splash + ln("M16 91q9 5 18 0M66 92q9 5 18 0", "#fff", 2.4), neck: null, cap: null, shadow: false,
      css: anim("bob", "0%,100%{transform:translateY(-2px) rotate(-2deg)}50%{transform:translateY(3px) rotate(2deg)}", "1.4s ease-in-out", "transform-origin:60px 90px;")
        + anim("paddlel", "0%,100%{transform:translate(0,-7px)}50%{transform:translate(3px,3px)}", ".7s ease-in-out") + anim("paddler", "0%,100%{transform:translate(3px,3px)}50%{transform:translate(0,-7px)}", ".7s ease-in-out")
        + anim("splashl", "0%{opacity:1;transform:translate(4px,4px)}70%{opacity:.15;transform:translate(-3px,-7px)}100%{opacity:1;transform:translate(4px,4px)}", ".7s ease-out") + anim("splashr", "0%{opacity:.3;transform:translate(3px,-5px)}50%{opacity:1;transform:translate(-3px,3px)}100%{opacity:.3;transform:translate(3px,-5px)}", ".7s ease-out") };
  },

  cats_pallas(k, m) {
    const hs = HEADS.pallas(k);
    const cat = s_("stalk", el(68, 82, 40, 24, k.c, EDGE) + head(hs, m, { x: 58, y: 62, k: 1.12, eyes: { hoodHi: -0.02, hoodLo: -0.02, y: 48 }, extra: pair(ln("M39.5 38.5L57 43.5", "#3a2e26", 2.8)) }) + worn(k, null, capOf(hs, 58, 62, 1.12)));
    const tailTip = s_("tip", fluff([[92, 100], [108, 96], [118, 80], [108, 62]], k.c, { w: 15, jag: 2.6, ring: k.a, bands: [[0.35, 0.46], [0.58, 0.66]], tip: k.a, tipFrom: 0.78 }));
    const rock = p("M3 119L8 94Q14 80 30 82L44 76Q58 72 68 80L88 77Q104 80 110 94L118 119Z", "#8a7a6e", EDGE) + p("M8 94Q14 80 30 82L44 76Q58 72 68 80L88 77Q104 80 110 94Q86 88 68 90Q48 82 34 92Q20 90 8 94Z", "#a89a8a") + ln("M30 92l-4 14l7 8M78 90l8 12l-3 12M52 96l6 8", "#5a4c44", 1.8)
      + pair(el(33, 82, 8, 5, k.c, EDGE) + toes(33, 81.6));
    return { body: tailTip + cat + rock + text(18, 28, "...", 18, "#fff2c8"), neck: null, cap: null,
      css: anim("stalk", "0%{transform:translateY(0)}20%,55%{transform:translateY(0)}65%,80%{transform:translateY(24px)}95%,100%{transform:translateY(0)}", "4.2s ease-in-out")
        + anim("tip", "0%,100%{transform:rotate(0)}50%{transform:rotate(-7deg)}", "2.1s ease-in-out", "transform-origin:92px 100px;") };
  },

  cats_sand(k, m) {
    const hs = HEADS.sand(k);
    const dune = p("M0 110Q24 96 52 108Q84 118 120 100V124H0Z", "#e8c888") + ln("M6 114q14 -6 28 0M74 116q16 -4 32 -8", "#c8a060", 1.8);
    const hole = el(95, 112, 15, 5, "#8a6236") + el(95, 113, 9, 2.8, "#5a3e20");
    const cat = rope("M30 96C8 94 4 78 14 70", k.c, 8.4, { ring: "#4a2e1c", dash: "0 52 8 10 8 40", tip: "#2e1c12", tipLen: 16 })
      + p("M20 108Q18 82 44 84Q68 84 82 94Q86 108 66 110Q40 114 20 108Z", k.c, EDGE) + el(30, 102, 13, 11, k.c, EDGE) + ln("M28 96Q36 96 40 103", "#c89a64", 2)
      + head(hs, m, { x: 44, y: 74, k: 0.88, rot: 6, ears: { phi: 86, len: 26 } });
    const dig = (x, name) => s_(name, ln(`M${x - 8} 99Q${x + 2} 100 ${x + 6} 110`, "#6a4420", 11, `opacity=".3"`) + ln(`M${x - 8} 99Q${x + 2} 100 ${x + 6} 110`, k.c, 9.4) + ln(`M${x - 4} 103l5 -5M${x + 1} 107l6 -4`, "#5a3418", 2.4) + el(x + 7, 111, 6.4, 4.6, k.b, EDGE));
    const spray = (name, list) => s_(name, list.map(([x, y, r]) => dot(x, y, r, "#e0b868", `stroke="#a87c38" stroke-width=".7"`)).join(""));
    const listen = s_("listen", ln("M104 66q-7 9 0 18M112 61q-11 14 0 28", "#fff6d8", 2.2));
    return { body: dune + hole + cat + dig(75, "digl") + dig(86, "digr") + spray("spraya", [[104, 100, 3], [112, 92, 2.2], [99, 90, 1.8], [114, 108, 2.4]]) + spray("sprayb", [[46, 116, 3], [36, 120, 2], [58, 119, 2.4], [26, 116, 1.6]]) + listen, neck: [47, 93, 13], cap: capOf(hs, 45, 73, 0.88), shadow: false,
      css: anim("digl", "0%,100%{transform:translate(0,0)}50%{transform:translate(-8px,-5px)}", ".4s ease-in-out") + anim("digr", "0%,100%{transform:translate(-8px,-5px)}50%{transform:translate(0,0)}", ".4s ease-in-out")
        + anim("spraya", "0%{opacity:1;transform:translate(-8px,6px)}100%{opacity:0;transform:translate(5px,-9px)}", ".6s ease-out") + anim("sprayb", "0%{opacity:1;transform:translate(12px,-8px)}100%{opacity:0;transform:translate(-9px,1px)}", ".5s ease-out")
        + anim("listen", "0%,100%{opacity:1}50%{opacity:.2}", "1.2s ease-in-out") };
  },

  cats_blackfooted(k, m) {
    const hs = HEADS.blackfooted(k);
    const spot = (x, y, r = 0) => el(x, y, 4, 2.6, k.a, `transform="rotate(${r} ${x} ${y})"`);
    const leg = (d, ex, ey) => ln(d, "#4a2e14", 10.4, `opacity=".35"`) + ln(d, k.c, 8.6) + el(ex, ey, 5.4, 4.4, k.c, EDGE) + el(ex + 1, ey + 1.6, 3.6, 2.2, "#1c120c");
    const cat = s_("leap", rope("M30 76C18 82 8 80 6 70", k.c, 8, { ring: k.a, dash: "0 28 14 18 12 40", tip: k.a, tipLen: 22 })
      + leg("M34 76L18 92", 16, 94) + leg("M42 76L33 96", 32, 99)
      + p("M26 72Q32 52 54 52Q72 52 82 66Q80 84 60 80Q42 86 30 84Q22 80 26 72Z", k.c, EDGE) + spot(34, 68, -30) + spot(46, 62, -10) + spot(58, 62, 12) + spot(43, 74, 8) + spot(57, 73, 30) + spot(34, 79, 40) + ln("M48 53Q60 52 68 58", k.a, 3)
      + leg("M68 76L92 90", 94, 91)
      + head(hs, m, { x: 78, y: 52, k: 0.82, rot: 18, mouth: "small" })
      + leg("M62 80L78 100", 80, 102) + worn(k, [73, 68, 11], capOf(hs, 80, 51, 0.82)));
    const bug = s_("prey", el(104, 110, 7, 5, "#8a8078", EDGE) + dot(100, 105, 3, "#a89c92") + dot(99, 109, 1, "#14131f") + ln("M111 111q8 2 6 7", "#c89a8a", 1.4));
    const grass = ln("M4 119l4 -18l3 18M13 119l7 -12l-1 12M42 119l2 -10l4 10M54 119l6 -15l-1 15M66 119l1 -8l5 8M112 119l5 -14l1 14", "#a8943a", 2.4);
    return { body: cat + bug + grass + s_("pop", ln("M14 46q12 -16 30 -18", "#fff6d8", 2.8, `stroke-dasharray="3 7"`)), neck: null, cap: null,
      css: anim("leap", "0%{transform:translate(0,2px) rotate(-3deg)}12%{transform:translate(-5px,20px) rotate(-8deg)}18%{transform:translate(-3px,19px) rotate(-3deg)}24%{transform:translate(-6px,20px) rotate(-9deg)}34%{transform:translate(-7px,19px) rotate(-5deg)}55%{transform:translate(0,-16px) rotate(2deg)}74%{transform:translate(9px,9px) rotate(18deg)}86%{transform:translate(9px,9px) rotate(18deg)}100%{transform:translate(0,2px) rotate(-3deg)}", "2.2s ease-in-out", "transform-origin:55px 84px;")
        + anim("prey", "0%,40%{transform:translate(0,0)}55%{transform:translate(6px,-3px)}70%,100%{transform:translate(0,0)}", "2.2s ease-in-out") + POP };
  },

  cats_fishing(k, m) {
    const hs = HEADS.fishing(k);
    const water = p("M62 108Q72 104 82 108T102 108T122 107V124H58Z", "#4ab0d8") + ln("M70 114q7 -4 14 0t14 0M96 120q7 -4 14 0", "#d0f2ff", 1.8);
    const bank = p("M0 108Q30 102 62 108L58 124H0Z", "#7a8a4a", EDGE) + ln("M5 108l-1 -16M9 108l4 -22M15 108l3 -13", "#5a7a2a", 2.2) + el(13, 85, 2.4, 6, "#7a4a2a", `transform="rotate(12 13 85)"`);
    const spot = (x, y) => el(x, y, 3.4, 1.9, k.a, `transform="rotate(24 ${x} ${y})"`);
    const cat = rope("M20 94C6 90 6 76 14 70", k.c, 10.4, { ring: k.a, dash: "0 30 14 20 14 40", tip: k.a, tipLen: 22 })
      + p("M16 102Q12 76 34 74Q56 76 68 90Q70 106 54 108Q30 112 16 102Z", k.c, EDGE) + [[26, 84], [37, 80], [48, 85], [25, 93], [37, 91], [50, 95], [60, 93]].map(([x, y]) => spot(x, y)).join("") + el(28, 100, 13, 10, k.c, EDGE) + spot(24, 97) + spot(32, 103)
      + el(53, 108, 8, 4.4, k.c, EDGE) + head(hs, m, { x: 53, y: 68, k: 0.9, rot: 15 });
    const paw = s_("scoop", ln("M58 94Q78 90 87 102", "#26221c", 12.6, `opacity=".3"`) + ln("M58 94Q78 90 87 102", k.c, 11) + ln("M64 88l2 8M72 89l1 8", k.a, 2.4) + el(89, 104, 9, 7, k.c, EDGE) + ln("M85 106l-1 5M90 107v5M95 105l2 5", "#e8e2cc", 2) + ln("M86 110q4 2 8 -.6", "#c8bc98", 1.4));
    const fish = s_("fish", g("translate(103 70) rotate(-34)", p("M-11 0Q-2 -9 9 0Q-2 9 -11 0Z", "#ff9a3a", EDGE) + p("M8 0L16 -7L14 0L16 7Z", "#ff7a2a") + dot(-5, -1.4, 1.7, "#14131f") + ln("M-1 -3q3 3 0 6", "#ffd8a0", 1.2)));
    const splash = s_("splash", ln("M80 104q-8 -14 -14 -9M96 102q8 -16 18 -9M88 98v-12", "#d0f4ff", 2.8) + dots([[70, 88], [114, 84], [96, 82]], 2.4, "#d0f4ff"));
    return { body: water + bank + cat + paw + splash + fish, neck: [52, 86, 13], cap: capOf(hs, 55, 67, 0.9), shadow: false,
      css: anim("scoop", "0%,30%{transform:rotate(-22deg)}48%{transform:rotate(14deg)}66%{transform:rotate(-38deg)}100%{transform:rotate(-22deg)}", "1.8s ease-in-out", "transform-origin:58px 94px;")
        + anim("fish", "0%,35%{transform:translate(-10px,36px) scale(.7);opacity:0}48%{opacity:1}62%{transform:translate(0,-8px);opacity:1}80%{transform:translate(4px,-30px) rotate(-12deg);opacity:1}100%{transform:translate(4px,-30px);opacity:0}", "1.8s ease-out")
        + anim("splash", "0%,38%{opacity:0;transform:scale(.5)}52%{opacity:1;transform:scale(1)}78%,100%{opacity:0;transform:scale(1.15)}", "1.8s ease-out", "transform-origin:90px 104px;") };
  },
};
export default function art(o) {
  const { id, name, tier, c, b, a, stage = 1, mood = "happy", size = 0, act = "" } = o;
  const k = { c, b, a, stage }, sig = act === "signature" && SIG[id];
  const draw = sig || CATS[id] || CATS.cats_mackerel;
  const rig = draw(k, mood);
  return frame({ name, size, tier, accent: a, stage, body: rig.body, neck: rig.neck, cap: rig.cap, top: rig.top, css: rig.css || "", shadow: rig.shadow });
}
