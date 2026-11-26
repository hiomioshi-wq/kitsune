// Lily Pad Leap: hold to wind up, let go to jump. Judge the distance, land on the pad, hit the flower for double.
export default function mount(el, api) {
  const W = 360, H = 230, WATER = 170, HOME = 56, MIN = 40, SPAN = 225;
  const easy = !!api.unhurried;
  const RUN = easy ? 42 : 35, CHARGE = easy ? 1.7 : 1.05, FLIGHT = easy ? 0.65 : 0.5;
  const calm = !!globalThis.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  const FROGS = ["grotto_redeye", "grotto_whites", "grotto_tomato", "grotto_azureus", "grotto_terribilis"];

  el.innerHTML = `
    <div style="max-width:540px;margin:0 auto;color:#fff">
      <div style="display:flex;justify-content:space-between;gap:8px;font-weight:800;font-size:14px;margin-bottom:6px">
        <span data-score>Points: 0</span><span data-time>Time: ${RUN}s</span>
      </div>
      <canvas data-cv width="${W * 2}" height="${H * 2}" role="img" tabindex="0" aria-label="Lily pad pond. Hold Space, Enter, or press and hold on the pond to wind up a jump, then let go." style="display:block;width:100%;height:auto;border-radius:12px;border:2px solid #b8e46c;background:#1d5a6a;touch-action:none;user-select:none;-webkit-user-select:none;cursor:pointer"></canvas>
      <p data-msg aria-live="polite" style="margin:8px 0;min-height:2.6em;font-size:13px;line-height:1.35;text-align:center">Hold the pond (or Space) to wind up, let go to leap. The flower in the middle of a pad scores 2.</p>
      <div style="text-align:center"><button type="button" class="btn btn-accent" data-start>🪷 Start leaping</button></div>
    </div>`;

  const q = (s) => el.querySelector(s);
  const cv = q("[data-cv]"), g = cv.getContext("2d"), startBtn = q("[data-start]");
  const scoreEl = q("[data-score]"), timeEl = q("[data-time]"), msgEl = q("[data-msg]");

  let state = "idle", raf = 0, last = 0, dead = false, finished = false;
  let score = 0, left = RUN, shownTime = RUN, clock = 0, hops = 0, held = "";
  let wind = 0, power = 0, t = 0, cam = 0;
  let frog = { x: 0, y: 0 }, from = 0, to = 0, here, next, old = null;
  let pops = [], splashAt = 0;

  const pick = FROGS[Math.floor(Math.random() * FROGS.length)];
  const picture = (mood) => {
    if (typeof Image !== "function" || !api.svg) return null;
    const im = new Image();
    im.onload = () => { if (!dead && state === "idle") draw(); };
    im.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(api.svg(pick, { size: 144, stage: 1, mood }))}`;
    return im;
  };
  const faces = { happy: picture("happy"), love: picture("love"), sad: picture("sad") };
  let face = "happy";

  const makePad = (x, r, drift = 0) => ({ base: x, x, r, drift, phase: Math.random() * 6.28, flower: Math.random() < 0.5 ? "#ff9ac2" : "#fff2a8" });
  const padRadius = () => (easy ? Math.max(29, 38 - hops * 0.7) : Math.max(20, 31 - hops * 0.8));
  function newTarget() {
    const gap = 78 + Math.random() * 128;
    const drift = !easy && hops >= 7 ? Math.min(17, 7 + (hops - 7) * 1.4) : 0;
    next = makePad(here.x + gap, padRadius(), drift);
  }
  function reset() {
    score = 0; left = RUN; shownTime = RUN; hops = 0; pops = []; wind = 0; power = 0; face = "happy";
    here = makePad(0, 40);
    frog = { x: 0, y: 0 };
    cam = 0; old = null;
    newTarget();
  }

  function beginWind(source) {
    if (state !== "ready" || left <= 0) return;
    held = source;
    state = "wind";
    wind = 0;
    power = 0;
  }
  function leap(source) {
    if (state !== "wind" || held !== source) return;
    held = "";
    state = "fly";
    t = 0;
    from = frog.x;
    to = from + MIN + power * SPAN;
    api.ping?.("blip");
  }
  function cancelWind() {
    if (state !== "wind") return;
    held = "";
    state = "ready";
    power = 0;
  }
  function land() {
    const off = Math.abs(to - next.x);
    frog.x = to;
    frog.y = 0;
    if (off <= next.r) {
      const bull = off <= next.r * 0.32;
      const gain = bull ? 2 : 1;
      score += gain;
      hops++;
      scoreEl.textContent = `Points: ${score}`;
      msgEl.textContent = bull ? "Right on the flower! +2" : "Safe landing. +1";
      pops.push({ x: to, y: WATER - 62, text: `+${gain}`, color: bull ? "#ffe23a" : "#ffffff", life: 1 });
      face = bull ? "love" : "happy";
      next.base = next.x;
      next.drift = 0;
      old = here;
      here = next;
      newTarget();
      state = "ready";
      api.ping?.(bull ? "choice" : "blip");
    } else {
      msgEl.textContent = to < next.x ? "Splash! A little short." : "Splash! Too far.";
      state = "splash";
      t = 0;
      splashAt = to;
      face = "sad";
      api.ping?.("blip");
    }
  }

  function finish() {
    if (finished) return;
    finished = true;
    state = "over";
    held = "";
    timeEl.textContent = "Time: 0s";
    msgEl.textContent = `Pond time is up! ${score} points from ${hops} safe ${hops === 1 ? "landing" : "landings"}.`;
    draw();
    stop();
    api.done(Math.floor(score));
  }

  function update(dt) {
    clock += dt;
    left = Math.max(0, left - dt);
    const secs = Math.ceil(left);
    if (secs !== shownTime) {
      shownTime = secs;
      timeEl.textContent = `Time: ${secs}s`;
    }
    if (next.drift) next.x = next.base + Math.sin(clock * 1.7 + next.phase) * next.drift;
    if (state === "wind") {
      wind += dt / CHARGE;
      const u = wind % 2;
      power = u <= 1 ? u : 2 - u;
    } else if (state === "fly") {
      t = Math.min(1, t + dt / FLIGHT);
      frog.x = from + (to - from) * t;
      frog.y = Math.sin(Math.PI * t) * (30 + (to - from) * 0.28);
      if (t >= 1) land();
    } else if (state === "splash") {
      t += dt / 0.85;
      if (t >= 1) {
        frog.x = from;
        frog.y = 0;
        face = "happy";
        state = "ready";
        msgEl.textContent = "Back on your pad. Try that one again.";
      }
    }
    const want = state === "splash" ? from : state === "fly" ? from : frog.x;
    cam += (want - cam) * Math.min(1, dt * 7);
    pops = pops.filter((o) => ((o.life -= dt * 1.1), (o.y -= dt * 24), o.life > 0));
    // A jump already in the air is allowed to land before time is called.
    if (left <= 0 && state !== "fly") finish();
  }

  const sx = (x) => x - cam + HOME;
  function oval(x, y, rx, ry, fill, stroke, w = 2) {
    g.beginPath();
    g.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, Math.PI * 2);
    if (fill) { g.fillStyle = fill; g.fill(); }
    if (stroke) { g.strokeStyle = stroke; g.lineWidth = w; g.stroke(); }
  }
  function drawPad(pad, target) {
    const x = sx(pad.x), r = pad.r, bob = calm ? 0 : Math.sin(clock * 2 + pad.phase) * 1.2, y = WATER + bob;
    oval(x, y + 5, r + 4, r * 0.3 + 3, "rgba(0,20,20,.3)");
    g.beginPath();
    g.ellipse(x, y, r, r * 0.32 + 2, 0, 1.95, 1.4 + Math.PI * 2);
    g.lineTo(x, y);
    g.closePath();
    g.fillStyle = "#4cae4c";
    g.fill();
    g.strokeStyle = "#b8e46c";
    g.lineWidth = 2;
    g.stroke();
    if (!target) return;
    // The middle ring is exactly the double-points zone.
    oval(x, y, r * 0.32, r * 0.14 + 1, "rgba(255,255,255,.3)", "#fff", 1.5);
    for (let i = 0; i < 6; i++) oval(x + Math.cos((i / 6) * 6.283) * 5.5, y - 4 + Math.sin((i / 6) * 6.283) * 2.4, 4.2, 2.6, pad.flower);
    oval(x, y - 4.5, 3, 2.2, "#ffb81e");
  }

  function draw() {
    if (!g || !here) return;
    g.setTransform(2, 0, 0, 2, 0, 0);
    const sky = g.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, "#16403c");
    sky.addColorStop(0.55, "#2f7a7a");
    sky.addColorStop(1, "#123e55");
    g.fillStyle = sky;
    g.fillRect(0, 0, W, H);
    // Distant reeds scroll slowly behind the pond.
    g.strokeStyle = "rgba(150,220,130,.3)";
    g.lineWidth = 3;
    g.lineCap = "round";
    for (let i = 0; i < 12; i++) {
      const x = ((((i * 41 - cam * 0.25) % 420) + 420) % 420) - 30, h = 36 + ((i * 29) % 44), sway = calm ? 0 : Math.sin(clock * 1.2 + i) * 4;
      g.beginPath(); g.moveTo(x, 128); g.quadraticCurveTo(x + sway * 0.5, 128 - h * 0.6, x + sway + 4, 128 - h); g.stroke();
    }
    g.fillStyle = "rgba(220,250,255,.28)";
    for (let i = 0; i < 9; i++) {
      const x = ((((i * 67 - cam * 0.7 + (calm ? 0 : clock * 6)) % 400) + 400) % 400) - 20;
      g.fillRect(x, 136 + ((i * 31) % 84), 14 + (i % 3) * 8, 1.5);
    }
    if (old && sx(old.x) > -50) drawPad(old, false);
    drawPad(here, false);
    drawPad(next, true);

    const fx = sx(frog.x);
    if (state === "wind" && easy) {
      const land = sx(frog.x + MIN + power * SPAN);
      oval(land, WATER, 7, 3.4, "rgba(255,226,58,.55)", "#ffe23a", 1.5);
    }
    if (state === "splash") {
      const x = sx(splashAt);
      for (let i = 0; i < 3; i++) {
        const k = Math.max(0, t * 1.4 - i * 0.18);
        if (k > 0 && k < 1) oval(x, WATER + 5, 8 + k * 36, 3 + k * 11, null, `rgba(230,250,255,${1 - k})`, 2);
      }
      if (!calm) for (let i = 0; i < 7; i++) oval(x + (i - 3) * (5 + t * 12), WATER - Math.sin(Math.PI * Math.min(1, t * 1.3)) * (16 + (i % 3) * 9), 2.2, 3, "#d8f6ff");
    }
    const sunk = state === "splash" ? Math.min(1, t * 1.8) : 0;
    const squash = state === "wind" ? power * 0.24 : 0;
    const im = faces[face];
    g.save();
    g.beginPath();
    g.rect(0, 0, W, sunk ? WATER + 5 : H);
    g.clip();
    g.translate(fx, WATER - frog.y + sunk * 56);
    g.scale(1 + squash * 0.7, 1 - squash);
    if (im && im.complete && im.naturalWidth) g.drawImage(im, -34, -64, 68, 68);
    else {
      oval(0, -16, 20, 17, "#5cc84a", "#1f5a1c");
      oval(-9, -31, 7, 7, "#fff", "#1f5a1c"); oval(9, -31, 7, 7, "#fff", "#1f5a1c");
      oval(-9, -31, 3, 3, "#14131f"); oval(9, -31, 3, 3, "#14131f");
    }
    g.restore();

    // Wind-up meter
    g.fillStyle = "rgba(8,20,24,.75)";
    g.fillRect(30, 207, 300, 15);
    if (state === "wind") {
      g.fillStyle = power < 0.5 ? "#8ce85a" : power < 0.8 ? "#ffd83a" : "#ff8a3a";
      g.fillRect(32, 209, 296 * power, 11);
    }
    g.strokeStyle = "rgba(255,255,255,.65)";
    g.lineWidth = 1.5;
    g.strokeRect(30, 207, 300, 15);
    g.fillStyle = "rgba(255,255,255,.3)";
    for (let i = 1; i < 8; i++) g.fillRect(30 + i * 37.5, 209, 1, 11);
    g.textAlign = "center";
    g.fillStyle = "#fff";
    g.font = "700 10px system-ui, sans-serif";
    g.fillText(state === "wind" ? "let go to leap" : "hold to wind up", 180, 202);

    g.font = "800 17px system-ui, sans-serif";
    for (const o of pops) {
      g.globalAlpha = Math.max(0, Math.min(1, o.life));
      g.lineWidth = 3;
      g.strokeStyle = "#123028";
      g.strokeText(o.text, sx(o.x), o.y);
      g.fillStyle = o.color;
      g.fillText(o.text, sx(o.x), o.y);
    }
    g.globalAlpha = 1;
    if (state === "idle") {
      g.fillStyle = "rgba(8,20,24,.7)";
      g.fillRect(70, 34, 220, 44);
      g.fillStyle = "#fff";
      g.font = "800 18px system-ui, sans-serif";
      g.fillText("Lily Pad Leap", 180, 54);
      g.font = "600 11px system-ui, sans-serif";
      g.fillText(`${RUN} seconds of hopping`, 180, 69);
    }
  }

  function loop(now) {
    if (dead || finished) return;
    if (!el.isConnected) return cleanup();
    const dt = Math.max(0, Math.min(0.05, (now - last) / 1000));
    last = now;
    update(dt);
    if (dead || finished) return;
    draw();
    raf = requestAnimationFrame(loop);
  }

  function start() {
    if (dead || state !== "idle") return;
    reset();
    state = "ready";
    startBtn.hidden = true;
    msgEl.textContent = "Hold, watch the meter, and let go to leap to the flower pad.";
    cv.focus?.({ preventScroll: true });
    api.ping?.("choice");
    last = performance.now();
    raf = requestAnimationFrame(loop);
  }

  const KEYS = [" ", "Spacebar", "Enter", "ArrowUp"];
  function onKeyDown(e) {
    if (!el.isConnected) return cleanup();
    if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey || !KEYS.includes(e.key)) return;
    if (state === "idle" || state === "over") return;
    // Leave other controls (Close, Back) working from the keyboard.
    if (e.target?.closest?.("button, a, input, select, textarea") && e.target !== startBtn) return;
    e.preventDefault();
    e.stopPropagation();
    if (!e.repeat) beginWind(`key:${e.key}`);
  }
  function onKeyUp(e) {
    if (!el.isConnected) return cleanup();
    if (state !== "wind" || held !== `key:${e.key}`) return;
    e.preventDefault();
    e.stopPropagation();
    leap(`key:${e.key}`);
  }
  function onPointerDown(e) {
    if (e.button > 0) return;
    e.preventDefault?.();
    if (state === "ready") beginWind(`ptr:${e.pointerId}`);
  }
  function onPointerUp(e) {
    if (!el.isConnected) return cleanup();
    leap(`ptr:${e.pointerId}`);
  }
  function onPointerCancel(e) {
    if (held === `ptr:${e.pointerId}`) cancelWind();
  }
  const onBlur = () => cancelWind();
  const noMenu = (e) => e.preventDefault();

  function stop() {
    cancelAnimationFrame(raf);
    window.removeEventListener("keydown", onKeyDown, true);
    window.removeEventListener("keyup", onKeyUp, true);
    window.removeEventListener("pointerup", onPointerUp, true);
    window.removeEventListener("pointercancel", onPointerCancel, true);
    window.removeEventListener("blur", onBlur);
  }
  function cleanup() {
    if (dead) return;
    dead = true;
    stop();
    cv.removeEventListener("pointerdown", onPointerDown);
    cv.removeEventListener("contextmenu", noMenu);
    startBtn.onclick = null;
  }

  window.addEventListener("keydown", onKeyDown, true);
  window.addEventListener("keyup", onKeyUp, true);
  window.addEventListener("pointerup", onPointerUp, true);
  window.addEventListener("pointercancel", onPointerCancel, true);
  window.addEventListener("blur", onBlur);
  cv.addEventListener("pointerdown", onPointerDown);
  cv.addEventListener("contextmenu", noMenu);
  startBtn.onclick = start;
  reset();
  draw();

  return cleanup;
}
