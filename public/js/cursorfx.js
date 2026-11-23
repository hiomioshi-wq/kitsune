// Cursor effects: trails behind the mouse and little bursts when you click. One small canvas that only
// draws while something is moving, stays out of the way of clicks, and switches off for reduced motion.
export const TRAILS = { none: "Off", foxfire: "Foxfire", sparkle: "Sparkles", sakura: "Sakura", snow: "Snow", stars: "Stars", ink: "Ink", bubbles: "Bubbles", embers: "Embers", leaves: "Autumn leaves", rainbow: "Rainbow", confetti: "Confetti", comet: "Comet" };
export const CLICKS = { none: "Off", ripple: "Ripple", burst: "Burst", petals: "Petals", stars: "Stars", ink: "Ink splat", foxfire: "Foxfire ring", confetti: "Confetti", paw: "Paw print" };

const R = (a, b) => a + Math.random() * (b - a), pick = (l) => l[Math.floor(Math.random() * l.length)];
const PARTY = ["#ff4d4d", "#ffc53d", "#46d369", "#3da5ff", "#a855f7", "#ff7ac6"];
const TRAIL = {
  foxfire: () => ({ s: "glow", c: "110,180,255", r: R(2, 5), vx: R(-.3, .3), vy: R(-1.2, -.4), d: .025 }),
  sparkle: () => ({ s: "star4", c: pick(["#fff", "#ffe9a8", "#ffd36b"]), r: R(2, 6), vx: R(-.6, .6), vy: R(-.6, .6), d: .03, vr: R(-.1, .1) }),
  sakura: () => ({ s: "petal", c: pick(["#f7b6c9", "#ffd3df", "#f08fb0"]), r: R(3, 6), vx: R(-.6, .6), vy: R(.3, 1), g: .005, d: .014, vr: R(-.06, .06) }),
  snow: () => ({ s: "dot", c: "#ffffff", r: R(1, 3.2), vx: R(-.4, .4), vy: R(.4, 1.1), d: .014 }),
  stars: () => ({ s: "star5", c: pick(["#ffd36b", "#fff0b8", "#9ad7ff"]), r: R(3, 6), vx: R(-.5, .5), vy: R(-.5, .7), d: .024, vr: R(-.08, .08) }),
  ink: () => ({ s: "dot", c: pick(["#111", "#1b1d33", "#333"]), r: R(1.5, 5), vx: R(-.15, .15), vy: R(.1, .5), d: .02, shrink: 1 }),
  bubbles: () => ({ s: "ring", c: pick(["#9ad7ff", "#c6efff", "#fff"]), r: R(2, 7), vx: R(-.3, .3), vy: R(-1.2, -.5), d: .016 }),
  embers: () => ({ s: "glow", c: pick(["255,150,50", "255,90,40", "255,210,90"]), r: R(1, 3), vx: R(-.6, .6), vy: R(-1.8, -.6), d: .025 }),
  leaves: () => ({ s: "petal", c: pick(["#d9531e", "#e8962e", "#b8341b", "#c9a227"]), r: R(3, 7), vx: R(-.8, .8), vy: R(.3, 1), g: .008, d: .013, vr: R(-.09, .09) }),
  rainbow: (n) => ({ s: "dot", c: `hsl(${(n * 5) % 360} 95% 62%)`, r: 4, vx: 0, vy: 0, d: .035, shrink: 1 }),
  confetti: () => ({ s: "rect", c: pick(PARTY), r: R(2, 4), vx: R(-1, 1), vy: R(-.8, .4), g: .04, d: .018, vr: R(-.2, .2) }),
  comet: () => ({ s: "glow", c: "255,235,190", r: 3.4, vx: 0, vy: 0, d: .05 }),
};
const ring = (n, f) => Array.from({ length: n }, (_, k) => f((k / n) * Math.PI * 2));
const CLICK = {
  ripple: () => [{ s: "wave", c: "#e0702f", r: 3, grow: 1.7, d: .035 }, { s: "wave", c: "#ffd36b", r: 1, grow: 1.2, d: .035 }],
  burst: () => ring(14, (a) => ({ s: "dot", c: pick(["#ffd36b", "#e0702f", "#fff"]), r: R(1.5, 3), vx: Math.cos(a) * R(1.5, 3.6), vy: Math.sin(a) * R(1.5, 3.6), d: .032, shrink: 1 })),
  petals: () => ring(10, (a) => ({ s: "petal", c: pick(["#f7b6c9", "#ffd3df", "#f08fb0"]), r: R(3, 6), vx: Math.cos(a) * R(.8, 2.2), vy: Math.sin(a) * R(.8, 2.2), g: .03, d: .018, vr: R(-.12, .12) })),
  stars: () => ring(8, (a) => ({ s: "star5", c: pick(["#ffd36b", "#fff0b8"]), r: R(3, 6), vx: Math.cos(a) * R(1, 2.8), vy: Math.sin(a) * R(1, 2.8), d: .028, vr: .1 })),
  ink: () => ring(13, (a) => ({ s: "dot", c: "#14141c", r: R(1, 5), vx: Math.cos(a) * R(.3, 2.8), vy: Math.sin(a) * R(.3, 2.8), f: .9, d: .022 })),
  foxfire: () => ring(16, (a) => ({ s: "glow", c: "110,180,255", r: 3, vx: Math.cos(a) * 2.2, vy: Math.sin(a) * 2.2, f: .96, d: .03 })),
  confetti: () => ring(18, (a) => ({ s: "rect", c: pick(PARTY), r: R(2, 4), vx: Math.cos(a) * R(1, 3.6), vy: Math.sin(a) * R(1, 3.6) - 1.4, g: .09, d: .017, vr: R(-.3, .3) })),
  paw: () => [{ s: "paw", c: "#e0702f", r: 11, d: .022 }],
};

function draw(g, p) {
  const a = Math.max(0, p.life), r = p.shrink ? p.r * a : p.r; g.save(); g.globalAlpha = p.s === "glow" ? 1 : a; g.translate(p.x, p.y); if (p.rot) g.rotate(p.rot); g.fillStyle = g.strokeStyle = p.s === "glow" ? "#fff" : p.c;
  if (p.s === "glow") { const q = g.createRadialGradient(0, 0, 0, 0, 0, r * 3); q.addColorStop(0, `rgba(235,247,255,${a})`); q.addColorStop(.4, `rgba(${p.c},${a * .6})`); q.addColorStop(1, `rgba(${p.c},0)`); g.fillStyle = q; g.beginPath(); g.arc(0, 0, r * 3, 0, 7); g.fill(); }
  else if (p.s === "dot") { g.beginPath(); g.arc(0, 0, Math.max(.2, r), 0, 7); g.fill(); }
  else if (p.s === "ring" || p.s === "wave") { g.lineWidth = p.s === "wave" ? 2.5 * a + .4 : 1.2; g.beginPath(); g.arc(0, 0, r, 0, 7); g.stroke(); }
  else if (p.s === "rect") g.fillRect(-r, -r / 2, r * 2, r);
  else if (p.s === "petal") { g.beginPath(); g.moveTo(0, -r); g.bezierCurveTo(r, -r * .4, r * .8, r * .7, 0, r); g.bezierCurveTo(-r * .8, r * .7, -r, -r * .4, 0, -r); g.fill(); }
  else if (p.s === "star4" || p.s === "star5") { const n = p.s === "star4" ? 4 : 5, ins = p.s === "star4" ? .28 : .45; g.beginPath(); for (let k = 0; k < n * 2; k++) { const m = k % 2 ? r * ins : r, t = (k / (n * 2)) * Math.PI * 2 - Math.PI / 2; g.lineTo(Math.cos(t) * m, Math.sin(t) * m); } g.closePath(); g.fill(); }
  else if (p.s === "paw") { g.beginPath(); g.ellipse(0, 3, 6.5, 5.5, 0, 0, 7); g.fill(); for (const [x, y] of [[-7, -3], [-2.6, -8], [2.6, -8], [7, -3]]) { g.beginPath(); g.arc(x, y, 2.6, 0, 7); g.fill(); } }
  g.restore();
}

let st = null;
// "Show effects anyway" overrides the device setting, but never Motion: Reduce chosen in Kitsune itself.
let force = false;
const reducedMotion = () => document.documentElement.dataset.motion === "reduce" || (!force && matchMedia("(prefers-reduced-motion: reduce)").matches);
const reading = () => !!document.querySelector(".reader:not([hidden]), .book:not([hidden])");

function stop() { if (!st) return; cancelAnimationFrame(st.raf); removeEventListener("pointermove", st.move); removeEventListener("pointerdown", st.down, true); removeEventListener("resize", st.size); st.c.remove(); st = null; }
function start() {
  const c = document.createElement("canvas"); c.id = "kt-cursorfx"; c.setAttribute("aria-hidden", "true"); c.style.cssText = "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:200"; document.body.append(c);
  const g = c.getContext("2d"), parts = [], S = { c, parts, raf: 0, n: 0, lx: 0, ly: 0, cfg: {} }; st = S;
  S.size = () => { const d = Math.min(2, devicePixelRatio || 1); c.width = innerWidth * d; c.height = innerHeight * d; g.setTransform(d, 0, 0, d, 0, 0); }; S.size(); addEventListener("resize", S.size);
  const tick = () => { S.raf = 0; g.clearRect(0, 0, innerWidth, innerHeight); for (let i = parts.length - 1; i >= 0; i--) { const p = parts[i]; if (p.f) { p.vx *= p.f; p.vy *= p.f; } p.vy += p.g || 0; p.x += p.vx || 0; p.y += p.vy || 0; if (p.vr) p.rot = (p.rot || 0) + p.vr; if (p.grow) p.r += p.grow; p.life -= p.d; if (p.life <= 0) { parts.splice(i, 1); continue; } draw(g, p); } if (parts.length) S.raf = requestAnimationFrame(tick); };
  const wake = () => { if (!S.raf && !document.hidden) S.raf = requestAnimationFrame(tick); };
  const add = (x, y, o) => { parts.push({ life: 1, x, y, ...o }); if (parts.length > 220) parts.splice(0, parts.length - 220); };
  S.move = (e) => { const f = TRAIL[S.cfg.trail]; if (!f || e.pointerType !== "mouse" || (S.cfg.quiet && reading())) return; const dx = e.clientX - S.lx, dy = e.clientY - S.ly, far = Math.hypot(dx, dy); if (far < 5) return; S.lx = e.clientX; S.ly = e.clientY; const n = S.cfg.trail === "rainbow" || S.cfg.trail === "comet" ? Math.min(6, Math.ceil(far / 5)) : 1 + (far > 16 ? 1 : 0); for (let k = 1; k <= n; k++) add(e.clientX - (dx * (k - 1)) / n, e.clientY - (dy * (k - 1)) / n, f(++S.n)); wake(); };
  S.down = (e) => { const f = CLICK[S.cfg.click]; if (!f || (S.cfg.quiet && reading())) return; for (const o of f()) add(e.clientX, e.clientY, o); wake(); };
  addEventListener("pointermove", S.move, { passive: true }); addEventListener("pointerdown", S.down, { passive: true, capture: true });
}

export function applyFx(s) {
  force = !!s.cursorFx?.force; const fx = s.cursorFx || {}, trail = fx.trail ?? (s.trail ? "foxfire" : "none"), click = fx.click || "none";
  if ((trail === "none" && click === "none") || reducedMotion()) return stop();
  if (!st) start(); st.cfg = { trail, click, quiet: fx.quiet !== false };
}
// A little show for the buttons in Settings, even if the effect isn't switched on yet.
export function preview(kind, name, x, y) {
  if (reducedMotion()) return; const had = !!st; if (!had) start(); const old = st.cfg; st.cfg = { ...old, quiet: false, [kind]: name };
  if (kind === "click") st.down({ clientX: x, clientY: y }); else for (let k = 0; k < 16; k++) { st.lx = x + 40; st.ly = y; st.move({ pointerType: "mouse", clientX: x - k * 7, clientY: y + Math.sin(k / 2) * 10 }); }
  st.cfg = old; if (!had) setTimeout(() => { if (st && !st.parts.length && !st.cfg.trail && !st.cfg.click) stop(); }, 2600);
}
