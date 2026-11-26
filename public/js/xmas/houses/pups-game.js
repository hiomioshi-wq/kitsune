// Puppy Round-Up: steer the sheepdog behind runaway puppies and herd them home through the gate.
// The yard is 100 x 100 units. Puppies amble about, trot away from the dog and scatter at a woof.
// The gate moves to another fence after every fourth puppy.

const DOG = "pups_bordercollie";
const PUPS = ["pups_corgi", "pups_shiba", "pups_beagle", "pups_golden", "pups_samoyed", "pups_patch", "pups_dachsmooth", "pups_husky"];
const SIDES = ["top", "right", "bottom", "left"];
const COUNT = 5;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const KEYS = { arrowup: [0, -1], w: [0, -1], arrowdown: [0, 1], s: [0, 1], arrowleft: [-1, 0], a: [-1, 0], arrowright: [1, 0], d: [1, 0] };

export default function mount(el, api) {
  const slow = !!api.unhurried;
  const calm = !!globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const DURATION = slow ? 45 : 35;
  const PACE = slow ? 0.78 : 1;
  const GATE = slow ? 42 : 34;
  const sprite = (id, stage = 1, mood = "happy") => api.svg(id, { size: 64, stage, mood });

  el.innerHTML = `
    <style>
      .pups-g{max-width:360px;margin:0 auto;color:#fff;font-family:system-ui,sans-serif;text-align:center;user-select:none;-webkit-user-select:none}
      .pups-g-yard{position:relative;isolation:isolate;width:100%;aspect-ratio:1/1;border-radius:14px;overflow:hidden;touch-action:none;cursor:pointer;border:4px solid #a86f3c;box-sizing:border-box;background:radial-gradient(circle at 24% 30%,#8fd06a 0 7%,transparent 8%),radial-gradient(circle at 74% 68%,#8fd06a 0 10%,transparent 11%),radial-gradient(ellipse at 66% 28%,#7cc6e0 0 6%,transparent 7%),#6fb84e}
      .pups-g-sprite{position:absolute;width:17%;height:17%;transform:translate(-50%,-62%);pointer-events:none}
      .pups-g-sprite svg{width:100%;height:100%;display:block}
      .pups-g-dog{width:20%;height:20%;filter:drop-shadow(0 0 5px #fff6a0)}
      .pups-g-gate{position:absolute;display:flex;align-items:center;justify-content:center;background:repeating-linear-gradient(45deg,#ffe28a 0 6px,#ffd25a 6px 12px);color:#4a2a08;font-weight:800;font-size:11px;border:2px dashed #7a4a14;box-sizing:border-box;pointer-events:none}
      .pups-g-ring{position:absolute;z-index:200;width:56%;height:56%;border-radius:50%;border:3px solid #fff;transform:translate(-50%,-50%);pointer-events:none;opacity:0}
      .pups-g-pop{position:absolute;z-index:210;transform:translate(-50%,-50%);font-weight:900;font-size:18px;color:#fff;text-shadow:0 1px 3px #000,0 0 3px #000;pointer-events:none;opacity:0}
      .pups-g-veil{position:absolute;z-index:300;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;background:rgba(20,18,32,.82);padding:14px;font-size:13px;line-height:1.4}
      .pups-g-btn{font:800 15px system-ui,sans-serif;border:0;border-radius:999px;padding:11px 22px;background:#ffd25a;color:#32200a;cursor:pointer;touch-action:manipulation}
      .pups-g-btn:focus-visible{outline:3px solid #fff;outline-offset:2px}
    </style>
    <div class="pups-g">
      <div style="display:flex;justify-content:space-between;gap:8px;font-weight:800;font-size:14px;margin-bottom:6px">
        <span data-score>🐾 0 home</span><span data-time>⏱ ${DURATION}s</span>
      </div>
      <div class="pups-g-yard" data-yard role="application" aria-label="Puppy yard. Drag or use the arrow keys to steer the sheepdog; press Space to woof.">
        <div class="pups-g-gate" data-gate>HOME</div>
        ${Array.from({ length: COUNT }, (_, i) => `<div class="pups-g-sprite" data-pup="${i}"></div>`).join("")}
        <div class="pups-g-sprite pups-g-dog" data-dog></div>
        <div class="pups-g-ring" data-ring></div>
        <div class="pups-g-pop" data-pop>+1</div>
        <div class="pups-g-veil" data-veil>
          <strong style="font-size:17px">Nap time round-up!</strong>
          <span>Get <b>behind</b> a puppy and it trots away from you. Nudge it into the striped <b>HOME</b> gate.</span>
          <span>Drag on the yard, or use arrows / WASD. Woof (Space) makes nearby puppies dash.</span>
          <button type="button" class="pups-g-btn" data-start>Open the yard</button>
        </div>
      </div>
      <div style="margin-top:8px"><button type="button" class="pups-g-btn" data-woof style="min-width:60%;opacity:.5">🐶 Woof!</button></div>
      <p data-hint aria-live="polite" style="margin:6px 0 0;font-size:13px;min-height:18px">${DURATION} seconds on the clock.</p>
    </div>`;

  const $ = (sel) => el.querySelector(sel);
  const yard = $("[data-yard]"), dogEl = $("[data-dog]"), gateEl = $("[data-gate]"), ringEl = $("[data-ring]"), popEl = $("[data-pop]"), veil = $("[data-veil]");
  const startBtn = $("[data-start]"), woofBtn = $("[data-woof]"), scoreEl = $("[data-score]"), timeEl = $("[data-time]"), hint = $("[data-hint]");

  let dead = false, state = "ready", raf = 0, last = 0, left = DURATION, score = 0, cool = 0, ring = 0, pop = 0, shownTime = -1, clock = 0;
  let side = 0, gateAt = 50, next = 0, target = null, dragging = null;
  const held = new Set();
  const dog = { x: 50, y: 66, face: 1 };

  const gatePoint = () => {
    const s = SIDES[side];
    return s === "top" ? { x: gateAt, y: 4 } : s === "bottom" ? { x: gateAt, y: 96 } : s === "left" ? { x: 4, y: gateAt } : { x: 96, y: gateAt };
  };
  function drawGate() {
    const s = SIDES[side], from = `${gateAt - GATE / 2}%`, size = `${GATE}%`;
    const upright = s === "left" || s === "right";
    Object.assign(gateEl.style, {
      left: upright ? (s === "left" ? "0" : "auto") : from,
      right: s === "right" ? "0" : "auto",
      top: upright ? from : s === "top" ? "0" : "auto",
      bottom: s === "bottom" ? "0" : "auto",
      width: upright ? "9%" : size,
      height: upright ? size : "9%",
      writingMode: upright ? "vertical-rl" : "horizontal-tb",
    });
  }

  function spawn(pup) {
    const g = gatePoint();
    let x = 50, y = 50;
    for (let i = 0; i < 40; i++) {
      x = 14 + Math.random() * 72;
      y = 14 + Math.random() * 72;
      if (Math.hypot(x - g.x, y - g.y) > 44 && Math.hypot(x - dog.x, y - dog.y) > 26) break;
    }
    Object.assign(pup, { x, y, vx: 0, vy: 0, wx: 0, wy: 0, think: 0, dash: 0, away: 0, face: 1 });
    pup.id = PUPS[next++ % PUPS.length];
    pup.el.innerHTML = sprite(pup.id);
    pup.el.hidden = false;
  }

  const put = (node, x, y) => {
    node.style.left = `${x.toFixed(2)}%`;
    node.style.top = `${y.toFixed(2)}%`;
  };
  function draw(o) {
    const bounce = (o.moving && !calm) ? Math.abs(Math.sin(clock * 14 + o.x / 7)) * 1.4 : 0;
    put(o.el, o.x, o.y - bounce);
    o.el.style.transform = `translate(-50%,-62%) scaleX(${o.face})`;
    o.el.style.zIndex = String(Math.round(o.y));
  }

  const pups = Array.from({ length: COUNT }, (_, i) => ({ el: $(`[data-pup="${i}"]`) }));
  dog.el = dogEl;
  dogEl.innerHTML = sprite(DOG, 2);
  drawGate();
  pups.forEach(spawn);
  pups.forEach(draw);
  draw(dog);

  function moveDog(dt) {
    let ax = 0, ay = 0;
    for (const k of held) {
      ax += KEYS[k][0];
      ay += KEYS[k][1];
    }
    const speed = 56 * (slow ? 0.9 : 1);
    let step = speed * dt;
    if (!ax && !ay && target) {
      ax = target.x - dog.x;
      ay = target.y - dog.y;
      const d = Math.hypot(ax, ay);
      if (d < 0.8) {
        if (!dragging) target = null;
        ax = ay = 0;
      } else step = Math.min(step, d);
    }
    const len = Math.hypot(ax, ay);
    dog.moving = len > 0;
    if (!len) return;
    dog.x = clamp(dog.x + (ax / len) * step, 6, 94);
    dog.y = clamp(dog.y + (ay / len) * step, 8, 94);
    if (Math.abs(ax / len) > 0.25) dog.face = ax < 0 ? -1 : 1;
  }

  function movePup(pup, dt) {
    if (pup.away > 0) {
      pup.away -= dt;
      if (pup.away <= 0) spawn(pup);
      return;
    }
    pup.think -= dt;
    if (pup.think <= 0) {
      const a = Math.random() * Math.PI * 2, v = Math.random() < 0.35 ? 0 : 3 + Math.random() * 4;
      pup.wx = Math.cos(a) * v;
      pup.wy = Math.sin(a) * v;
      pup.think = 0.7 + Math.random() * 1.4;
    }
    let vx = pup.wx, vy = pup.wy;
    const dx = pup.x - dog.x, dy = pup.y - dog.y, d = Math.hypot(dx, dy) || 0.01, reach = 23;
    if (d < reach) {
      const v = 15 + 24 * (1 - d / reach);
      vx = (dx / d) * v;
      vy = (dy / d) * v;
    }
    if (pup.dash > 0) {
      pup.dash -= dt;
      vx += (dx / d) * 24;
      vy += (dy / d) * 24;
    }
    // A herded puppy that gets close to the open gate spots its bed and heads in.
    const g = gatePoint(), gx = g.x - pup.x, gy = g.y - pup.y, gd = Math.hypot(gx, gy) || 0.01;
    if (gd < 26 && (d < reach * 1.5 || pup.dash > 0)) {
      vx += (gx / gd) * 14;
      vy += (gy / gd) * 14;
    }
    for (const other of pups) {
      if (other === pup || other.away > 0) continue;
      const ox = pup.x - other.x, oy = pup.y - other.y, od = Math.hypot(ox, oy) || 0.01;
      if (od < 10) {
        vx += (ox / od) * (10 - od) * 1.4;
        vy += (oy / od) * (10 - od) * 1.4;
      }
    }
    // Fences: slide along them instead of pushing in, and squirm out of corners.
    const open = (s) => SIDES[side] === s && Math.abs((s === "top" || s === "bottom" ? pup.x : pup.y) - gateAt) < GATE / 2;
    const atL = pup.x < 10 && !open("left"), atR = pup.x > 90 && !open("right"), atT = pup.y < 12 && !open("top"), atB = pup.y > 90 && !open("bottom");
    if ((atL && vx < 0) || (atR && vx > 0)) {
      vy += (Math.sign(vy || gy) || 1) * Math.abs(vx) * 0.7;
      vx = 0;
    }
    if ((atT && vy < 0) || (atB && vy > 0)) {
      vx += (Math.sign(vx || gx) || 1) * Math.abs(vy) * 0.7;
      vy = 0;
    }
    if ((atL || atR) && (atT || atB) && d < reach) {
      // Dart out past the dog along whichever fence it is not guarding.
      if (Math.abs(dx) > Math.abs(dy)) {
        vx = 0;
        vy = atT ? 30 : -30;
      } else {
        vy = 0;
        vx = atL ? 30 : -30;
      }
    }
    const ease = Math.min(1, dt * 9);
    pup.vx += (vx * PACE - pup.vx) * ease;
    pup.vy += (vy * PACE - pup.vy) * ease;
    pup.x = clamp(pup.x + pup.vx * dt, 6, 94);
    pup.y = clamp(pup.y + pup.vy * dt, 8, 94);
    pup.moving = Math.hypot(pup.vx, pup.vy) > 2;
    if (Math.abs(pup.vx) > 3) pup.face = pup.vx < 0 ? -1 : 1;

    const s = SIDES[side];
    const inside = (s === "top" && pup.y <= 12) || (s === "bottom" && pup.y >= 89) || (s === "left" && pup.x <= 11) || (s === "right" && pup.x >= 89);
    if (inside && open(s)) pen(pup);
  }

  function pen(pup) {
    score++;
    scoreEl.textContent = `🐾 ${score} home`;
    pup.away = 0.7;
    pup.el.hidden = true;
    pop = 0.7;
    popEl.textContent = "+1 ♥";
    put(popEl, clamp(pup.x, 12, 88), clamp(pup.y, 12, 88));
    api.ping?.("blip");
    if (score % 4 === 0) {
      side = (side + 1) % SIDES.length;
      gateAt = 36 + Math.random() * 28;
      drawGate();
      hint.textContent = `The gate moved to the ${SIDES[side]} fence!`;
    } else hint.textContent = score === 1 ? "First puppy tucked in!" : `${score} puppies tucked in.`;
  }

  function woof() {
    if (state !== "play" || cool > 0) return;
    cool = 3;
    ring = 0.45;
    put(ringEl, dog.x, dog.y);
    for (const pup of pups) {
      if (pup.away <= 0 && Math.hypot(pup.x - dog.x, pup.y - dog.y) < 36) pup.dash = 0.65;
    }
    woofBtn.style.opacity = ".5";
    hint.textContent = "WOOF!";
    api.ping?.("choice");
  }

  function finish() {
    state = "over";
    cancelAnimationFrame(raf);
    held.clear();
    target = null;
    woofBtn.style.opacity = ".5";
    timeEl.textContent = "⏱ 0s";
    hint.textContent = `Nap time! ${score} ${score === 1 ? "puppy" : "puppies"} home.`;
    api.done(score);
  }

  function frame(now) {
    if (dead || state !== "play") return;
    if (!el.isConnected) return cleanup();
    const dt = clamp((now - last) / 1000, 0, 0.05);
    last = now;
    clock += dt;
    left -= dt;
    moveDog(dt);
    for (const pup of pups) movePup(pup, dt);
    pups.forEach((pup) => pup.away > 0 || draw(pup));
    draw(dog);
    if (cool > 0) {
      cool -= dt;
      if (cool <= 0) woofBtn.style.opacity = "1";
    }
    ring = Math.max(0, ring - dt);
    ringEl.style.opacity = String(ring > 0 ? Math.min(1, ring * 3) : 0);
    if (!calm) ringEl.style.transform = `translate(-50%,-50%) scale(${(1.25 - ring * 1.6).toFixed(2)})`;
    pop = Math.max(0, pop - dt);
    popEl.style.opacity = String(Math.min(1, pop * 3));
    if (!calm) popEl.style.transform = `translate(-50%,${(-50 - (0.7 - pop) * 120).toFixed(0)}%)`;
    const secs = Math.ceil(left);
    if (secs !== shownTime) {
      shownTime = secs;
      timeEl.textContent = `⏱ ${Math.max(0, secs)}s`;
    }
    if (left <= 0) return finish();
    raf = requestAnimationFrame(frame);
  }

  function start() {
    if (dead || state !== "ready") return;
    state = "play";
    veil.hidden = true;
    veil.style.display = "none";
    woofBtn.style.opacity = "1";
    startBtn.blur?.();
    hint.textContent = "Get behind a puppy and nudge it home!";
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }

  const point = (e) => {
    const r = yard.getBoundingClientRect();
    return { x: clamp(((e.clientX - r.left) / (r.width || 1)) * 100, 6, 94), y: clamp(((e.clientY - r.top) / (r.height || 1)) * 100, 8, 94) };
  };
  const onDown = (e) => {
    if (state !== "play" || (e.button ?? 0) > 0) return;
    e.preventDefault();
    dragging = e.pointerId ?? 0;
    try { yard.setPointerCapture?.(e.pointerId); } catch { /* the pointer is already gone */ }
    held.clear();
    target = point(e);
  };
  const onMove = (e) => {
    if (state === "play" && dragging === (e.pointerId ?? 0)) target = point(e);
  };
  const onEnd = (e) => {
    if (dragging === (e.pointerId ?? 0)) dragging = null;
  };
  const onKey = (e) => {
    if (!el.isConnected) return cleanup();
    if (state !== "play" || e.metaKey || e.ctrlKey || e.altKey || e.key === "Escape") return;
    const k = e.key.toLowerCase();
    if (KEYS[k]) {
      e.preventDefault();
      target = null;
      held.add(k);
    } else if (k === " ") {
      // Leave Space alone on buttons that belong to the surrounding page, such as Close.
      const button = e.target?.closest?.("button");
      if (button && button !== woofBtn && button !== startBtn) return;
      e.preventDefault();
      if (!e.repeat) woof();
    }
  };
  const onKeyUp = (e) => {
    if (!el.isConnected) return cleanup();
    held.delete(String(e.key).toLowerCase());
  };
  const onBlur = () => {
    held.clear();
    dragging = null;
  };

  startBtn.addEventListener("click", start);
  woofBtn.addEventListener("click", woof);
  yard.addEventListener("pointerdown", onDown);
  yard.addEventListener("pointermove", onMove);
  yard.addEventListener("pointerup", onEnd);
  yard.addEventListener("pointercancel", onEnd);
  window.addEventListener("keydown", onKey, true);
  window.addEventListener("keyup", onKeyUp, true);
  window.addEventListener("blur", onBlur);
  startBtn.focus?.({ preventScroll: true });

  function cleanup() {
    if (dead) return;
    dead = true;
    cancelAnimationFrame(raf);
    startBtn.removeEventListener("click", start);
    woofBtn.removeEventListener("click", woof);
    yard.removeEventListener("pointerdown", onDown);
    yard.removeEventListener("pointermove", onMove);
    yard.removeEventListener("pointerup", onEnd);
    yard.removeEventListener("pointercancel", onEnd);
    window.removeEventListener("keydown", onKey, true);
    window.removeEventListener("keyup", onKeyUp, true);
    window.removeEventListener("blur", onBlur);
  }
  return cleanup;
}
