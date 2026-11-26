// Puffer Drift: hold to puff up and float, let go to sink. Thread the coral gaps and scoop pearls.
export default function mount(el, api) {
  const W = 300, H = 190, PX = 62, GW = 24;
  const calm = !!api.unhurried;
  const still = !!globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const RUN = 36, EVERY = 1.65, SPEED = calm ? 66 : 94, GAP = calm ? 98 : 76, HEARTS = calm ? 5 : 3;
  const CORAL = [["#ff7a8a", "#c8405c", "#ffc0c8"], ["#ff9a52", "#c8602a", "#ffd0a8"], ["#b07ae8", "#7448b0", "#dcc0ff"], ["#40c0a8", "#208070", "#a8f0e0"]];
  const KEYS = [" ", "spacebar", "arrowup", "w"];

  el.innerHTML = `
    <div style="max-width:380px;margin:0 auto;color:#fff;text-align:center;-webkit-user-select:none;user-select:none">
      <div style="display:flex;justify-content:space-between;gap:8px;font-weight:800;font-size:13px;margin-bottom:4px">
        <span data-score>Score 0</span><span data-hearts></span><span data-time>${RUN}s</span>
      </div>
      <div style="position:relative">
        <canvas width="${W * 2}" height="${H * 2}" tabindex="0" role="img" aria-label="Puffer Drift play area. Hold Space, Up or W, or press and hold here, to float upward." style="display:block;width:100%;height:auto;aspect-ratio:${W}/${H};border-radius:12px;background:#0d2c52;touch-action:none;cursor:pointer"></canvas>
        <div data-intro style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;padding:8px;box-sizing:border-box;background:rgba(7,18,40,.8);border-radius:12px">
          <div data-hero style="width:62px;height:64px" aria-hidden="true"></div>
          <div style="font-size:12.5px;line-height:1.35;max-width:270px">Hold to <b>puff up</b> and rise. Let go to sink.<br>Coral gap = 1 point, pearl = 1 point.</div>
          <button type="button" class="btn btn-accent" data-start>Start drifting</button>
        </div>
      </div>
      <button type="button" class="btn btn-accent" data-puff disabled style="width:100%;margin-top:8px;min-height:44px;touch-action:none">🐡 Hold to puff</button>
      <p data-say aria-live="polite" style="margin:6px 0 0;font-size:12px;min-height:1.4em;color:#dff6ff">Space, ↑ or W also work.</p>
    </div>`;

  const $ = (s) => el.querySelector(s);
  const cv = $("canvas"), ctx = cv.getContext("2d"), puffBtn = $("[data-puff]"), startBtn = $("[data-start]"), intro = $("[data-intro]");
  try {
    $("[data-hero]").innerHTML = api.svg("reef_puffer", { size: 62, stage: 1 });
  } catch { /* the picture is optional */ }

  let raf = 0, last = 0, running = false, finished = false, dead = false;
  let t = 0, y = H / 2, vy = 0, puff = 0, score = 0, hearts = HEARTS, safe = 0, nextAt = 0.4, count = 0, lastGap = H / 2;
  let gates = [], pearls = [], pops = [];
  let keyHeld = false;
  const touches = new Set();
  const held = () => keyHeld || touches.size > 0;
  const drift = Array.from({ length: 16 }, (_, i) => ({ x: (i * 67) % W, y: (i * 43) % H, r: 1 + (i % 3), v: 8 + (i % 5) * 5 }));

  const say = (text) => { $("[data-say]").textContent = text; };
  function hud() {
    $("[data-score]").textContent = `Score ${score}`;
    $("[data-hearts]").textContent = "♥".repeat(Math.max(0, hearts)) + "♡".repeat(Math.max(0, HEARTS - hearts));
    $("[data-time]").textContent = `${Math.max(0, Math.ceil(RUN - t))}s`;
  }

  function spawn() {
    const half = GAP / 2, lo = half + 10, hi = H - half - 10;
    let gy = lo + Math.random() * (hi - lo);
    gy = Math.max(lastGap - 56, Math.min(lastGap + 56, gy));
    const x = W + 20;
    gates.push({ x, y: gy, hue: count % CORAL.length, bumped: false, passed: false });
    // Every second gap has a pearl floating on the way in, a little off the straight line.
    if (count % 2) {
      const off = (Math.random() < 0.5 ? -1 : 1) * (14 + Math.random() * 20);
      pearls.push({ x: x - (SPEED * EVERY) / 2, y: Math.max(18, Math.min(H - 18, (gy + lastGap) / 2 + off)) });
    }
    lastGap = gy;
    count++;
  }

  const radius = () => 9 + puff * 4;
  const touchesRect = (x0, y0, x1, y1, r) => Math.hypot(PX - Math.max(x0, Math.min(x1, PX)), y - Math.max(y0, Math.min(y1, y))) < r;

  function step(dt) {
    t += dt;
    const up = held();
    puff += ((up ? 1 : 0) - puff) * Math.min(1, dt * 9);
    vy += (up ? -300 : 235) * dt;
    vy *= Math.exp(-2.4 * dt);
    y += vy * dt;
    const r = radius();
    if (y < r) { y = r; vy = Math.max(0, vy); }
    if (y > H - r - 3) { y = H - r - 3; vy = Math.min(0, vy); }
    safe = Math.max(0, safe - dt);
    // Only send a gap that can still reach the puffer before the tide turns.
    if (t >= nextAt && t + (W + 20 + GW - PX + 14) / SPEED < RUN) {
      spawn();
      nextAt += EVERY;
    }
    for (const g of gates) {
      g.x -= SPEED * dt;
      const hit = r - 1.8;
      if (safe <= 0 && !g.passed && (touchesRect(g.x, -40, g.x + GW, g.y - GAP / 2, hit) || touchesRect(g.x, g.y + GAP / 2, g.x + GW, H + 40, hit))) {
        g.bumped = true;
        hearts--;
        safe = 1.3;
        pops.push({ x: PX + 8, y: y - 12, text: "ouch!", col: "#ff9ab0", life: 1 });
        say(hearts > 0 ? `Bumped the coral. ${hearts} ${hearts === 1 ? "heart" : "hearts"} left.` : "Out of hearts!");
        api.ping?.("blip");
      }
      if (!g.passed && g.x + GW < PX - r) {
        g.passed = true;
        if (!g.bumped) {
          score++;
          pops.push({ x: PX, y: y - 16, text: "+1", col: "#bfffd0", life: 1 });
        }
      }
    }
    for (const q of pearls) {
      q.x -= SPEED * dt;
      if (!q.got && Math.hypot(q.x - PX, q.y - y) < r + 6) {
        q.got = true;
        score++;
        pops.push({ x: q.x, y: q.y - 8, text: "pearl +1", col: "#fff2a8", life: 1 });
        say(`Pearl! Score ${score}.`);
        api.ping?.("choice");
      }
    }
    for (const q of pops) { q.y -= 22 * dt; q.life -= dt * 1.4; }
    gates = gates.filter((g) => g.x > -GW - 10);
    pearls = pearls.filter((q) => !q.got && q.x > -10);
    pops = pops.filter((q) => q.life > 0);
    if (!still) for (const d of drift) { d.y -= d.v * dt; d.x -= SPEED * 0.12 * dt; if (d.y < -4) d.y = H + 4; if (d.x < -4) d.x = W + 4; }
  }

  const disc = (x, y0, r, fill) => { ctx.beginPath(); ctx.arc(x, y0, r, 0, Math.PI * 2); ctx.fillStyle = fill; ctx.fill(); };
  const oval = (x, y0, rx, ry, fill, rot = 0) => { ctx.beginPath(); ctx.ellipse(x, y0, rx, ry, rot, 0, Math.PI * 2); ctx.fillStyle = fill; ctx.fill(); };

  /** One coral column from y0 to y1 with a knobbly tip facing the gap. */
  function coral(x, y0, y1, tip, [main, dark, light]) {
    ctx.fillStyle = dark;
    ctx.fillRect(x, y0, GW, y1 - y0);
    ctx.fillStyle = main;
    ctx.fillRect(x + 2, y0, GW - 6, y1 - y0);
    ctx.fillStyle = light;
    ctx.fillRect(x + 5, y0, 3, y1 - y0);
    const end = tip > 0 ? y1 : y0;
    for (let i = 0; i < 3; i++) {
      disc(x + 4 + i * 8, end - tip * 4, 5.4, dark);
      disc(x + 4 + i * 8, end - tip * 4.6, 4, main);
      disc(x + 2.8 + i * 8, end - tip * 5.6, 1.3, light);
    }
    for (let k = y0 + 12; k < y1 - 12; k += 19) disc(x + 15 + ((k | 0) % 2) * 3, k, 2.2, light);
  }

  function pufferFish() {
    const r = radius(), tilt = Math.max(-0.4, Math.min(0.4, vy / 260));
    ctx.save();
    ctx.translate(PX, y);
    ctx.rotate(tilt);
    if (safe > 0) {
      ctx.beginPath(); ctx.arc(0, 0, r + 6, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,170,190,.9)"; ctx.lineWidth = 2; ctx.stroke();
      if (!still && Math.floor(safe * 9) % 2) ctx.globalAlpha = 0.45;
    }
    // tail
    ctx.beginPath(); ctx.moveTo(-r + 2, 0); ctx.quadraticCurveTo(-r - 11, -10, -r - 10, 0); ctx.quadraticCurveTo(-r - 11, 10, -r + 2, 3); ctx.fillStyle = "#b9b4a4"; ctx.fill();
    if (puff > 0.35) {
      ctx.strokeStyle = "#efe8d4"; ctx.lineWidth = 1.6; ctx.beginPath();
      for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r); ctx.lineTo(Math.cos(a) * (r + 3.5 * puff), Math.sin(a) * (r + 3.5 * puff)); }
      ctx.stroke();
    }
    const long = 1.16 - puff * 0.16;
    oval(0, 0, r * long, r, "#6a6458");
    oval(0, 0, r * long - 1.2, r - 1.2, "#bdb8a6");
    oval(0, r * 0.4, r * 0.78, r * 0.48, "#ece5ce");
    for (const [dx, dy, s] of [[-0.55, -0.35, 0.13], [-0.15, -0.62, 0.1], [-0.4, 0.15, 0.1], [0.05, -0.25, 0.09], [-0.7, 0.1, 0.08]]) disc(dx * r, dy * r, s * r, "#26222a");
    oval(r * 0.82, r * 0.24, r * 0.32, r * 0.34, "#26222a");
    oval(r * 0.4, -r * 0.24, r * 0.4, r * 0.4, "#26222a");
    disc(r * 0.42, -r * 0.26, r * 0.28, "#a8c860");
    disc(r * 0.46, -r * 0.26, r * 0.18, "#14121a");
    disc(r * 0.54, -r * 0.34, r * 0.08, "#fff");
    ctx.beginPath(); ctx.arc(r * 0.9, r * 0.24, r * 0.12, 0, Math.PI * (puff > 0.5 ? 2 : 1)); ctx.strokeStyle = "#ffc8d0"; ctx.lineWidth = 1.3; ctx.stroke();
    oval(r * 0.36, r * 0.3, r * 0.17, r * 0.11, "rgba(255,95,138,.6)");
    oval(-r * 0.12, r * 0.18, r * 0.28, r * 0.16, "#9a9486", -0.5);
    ctx.restore();
  }

  function draw() {
    ctx.setTransform(2, 0, 0, 2, 0, 0);
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, "#1c6a98");
    sky.addColorStop(1, "#0a1c40");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);
    disc(248, 30, 24, "rgba(255,246,200,.08)");
    disc(248, 30, 13, "rgba(255,246,200,.35)");
    for (const d of drift) disc(d.x, d.y, d.r, "rgba(210,240,255,.28)");
    ctx.lineCap = "round";
    ctx.strokeStyle = "rgba(60,150,110,.55)";
    ctx.lineWidth = 4;
    for (let i = 0; i < 8; i++) {
      const x = 12 + i * 42, sway = still ? 4 : Math.sin(t * 1.6 + i) * 6;
      ctx.beginPath(); ctx.moveTo(x, H); ctx.quadraticCurveTo(x - sway, H - 14, x + sway, H - 24 - (i % 3) * 7); ctx.stroke();
    }
    for (const g of gates) {
      coral(g.x, 0, g.y - GAP / 2, 1, CORAL[g.hue]);
      coral(g.x, g.y + GAP / 2, H, -1, CORAL[g.hue]);
    }
    for (const q of pearls) {
      disc(q.x, q.y, 10, "rgba(255,248,200,.2)");
      disc(q.x, q.y, 5.4, "#fff6e4");
      disc(q.x + 1.2, q.y + 1.4, 3.2, "#e8d8f0");
      disc(q.x - 1.8, q.y - 1.8, 1.5, "#fff");
    }
    ctx.fillStyle = "#c8a86a";
    ctx.fillRect(0, H - 4, W, 4);
    pufferFish();
    ctx.font = "800 11px system-ui, sans-serif";
    ctx.textAlign = "center";
    for (const q of pops) {
      ctx.globalAlpha = Math.max(0, Math.min(1, q.life));
      ctx.fillStyle = q.col;
      ctx.fillText(q.text, q.x, q.y);
    }
    ctx.globalAlpha = 1;
    if (finished) {
      ctx.fillStyle = "rgba(7,18,40,.72)";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#fff";
      ctx.font = "800 20px system-ui, sans-serif";
      ctx.fillText(hearts > 0 ? "Safe in the lagoon!" : "Time for a rest", W / 2, H / 2 - 6);
      ctx.font = "700 14px system-ui, sans-serif";
      ctx.fillText(`${score} points`, W / 2, H / 2 + 18);
    }
  }

  function finish() {
    if (finished) return;
    finished = true;
    running = false;
    keyHeld = false;
    touches.clear();
    puffBtn.disabled = true;
    hud();
    draw();
    say(`Run over: ${score} points.`);
    unbind();
    api.done(Math.round(score));
  }

  function loop(now) {
    raf = 0;
    if (dead || !running) return;
    if (!el.isConnected) return cleanup();
    const dt = Math.max(0, Math.min(0.05, (now - last) / 1000));
    last = now;
    step(dt);
    if (hearts <= 0 || t >= RUN) return finish();
    hud();
    draw();
    raf = requestAnimationFrame(loop);
  }

  function start() {
    if (running || finished || dead) return;
    running = true;
    intro.style.display = "none";
    puffBtn.disabled = false;
    say(calm ? "Gentle tide. Hold to rise, let go to sink." : "Hold to rise, let go to sink.");
    api.ping?.("choice");
    window.addEventListener("keydown", onDown, true);
    window.addEventListener("keyup", onUp, true);
    window.addEventListener("blur", release);
    cv.focus?.({ preventScroll: true });
    cv.scrollIntoView?.({ block: "nearest" });
    last = performance.now();
    raf = requestAnimationFrame(loop);
  }

  function onDown(e) {
    if (!el.isConnected) return cleanup();
    if (e.metaKey || e.ctrlKey || e.altKey || !running) return;
    if (!KEYS.includes(String(e.key).toLowerCase())) return;
    e.preventDefault();
    keyHeld = true;
  }
  function onUp(e) {
    if (!el.isConnected) return cleanup();
    if (!KEYS.includes(String(e.key).toLowerCase())) return;
    if (running) e.preventDefault();
    keyHeld = false;
  }
  function release() {
    keyHeld = false;
    touches.clear();
  }
  const press = (e) => {
    if (!running) return;
    e.preventDefault();
    touches.add(e.pointerId);
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* capture is a nicety */ }
  };
  const lift = (e) => touches.delete(e.pointerId);
  for (const node of [cv, puffBtn]) {
    node.addEventListener("pointerdown", press);
    for (const type of ["pointerup", "pointercancel", "lostpointercapture"]) node.addEventListener(type, lift);
    node.addEventListener("contextmenu", (e) => e.preventDefault());
  }
  startBtn.addEventListener("click", start);

  function unbind() {
    window.removeEventListener("keydown", onDown, true);
    window.removeEventListener("keyup", onUp, true);
    window.removeEventListener("blur", release);
  }
  function cleanup() {
    if (dead) return;
    dead = true;
    running = false;
    cancelAnimationFrame(raf);
    raf = 0;
    unbind();
  }

  hud();
  draw();
  return cleanup;
}
