// Waggle Compass: read a honey bee's waggle dance, then fly to the flowers it describes.
// On the comb, "up" means "toward the sun"; a longer waggle run (more bzz) means farther away.
export default function mount(el, api) {
  const FLIGHTS = 7;
  const slow = !!api.unhurried;
  const LIMIT = slow ? 9 : 5.2;          // seconds to answer each flight
  const SHOW = slow ? 1.8 : 1.15;        // seconds the answer stays up
  const BZZ = slow ? 0.5 : 0.38;         // waggle seconds per ring
  const LOOP = slow ? 0.95 : 0.75;       // return loop seconds
  const EASE = slow ? 1.35 : 1;          // aiming tolerance
  const STEP = 7.5, GAP = 31, C = 150, TAU = Math.PI * 2;
  const still = !!globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  el.innerHTML = `
    <div style="max-width:560px;margin:0 auto;color:#fff;background:#171a30;border-radius:14px;padding:10px;box-sizing:border-box;text-align:center;font:600 13px/1.4 system-ui,sans-serif">
      <div data-intro>
        <div style="width:84px;height:84px;margin:0 auto">${api.svg("glow_honeybee", { size: 84, stage: 1, act: "signature" })}</div>
        <p style="margin:6px 0;color:#fff">On the comb, <b style="color:#ffd84d">up means toward the sun</b>. Turn that same angle from the sun on the meadow.<br>Count the <b style="color:#ffd84d">bzz</b> dots: one dot, one ring.</p>
        <p style="margin:6px 0;color:#c9cdf0;font-weight:500">Tap or drag on the meadow. Keys: ← → turn, ↑ ↓ distance, Enter to fly.</p>
        <button type="button" class="btn btn-accent" data-start>Start the dance (${FLIGHTS} flights)</button>
      </div>
      <div data-board hidden>
        <div style="display:flex;justify-content:space-between;gap:8px;color:#fff"><span data-flight></span><span data-score></span></div>
        <div style="height:6px;border-radius:3px;background:#ffffff22;margin:5px 0 8px;overflow:hidden"><div data-time style="height:100%;width:100%;background:#d4f27a"></div></div>
        <div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;align-items:center">
          <canvas data-dance role="img" aria-label="The dancing bee" style="width:100%;max-width:210px;height:auto;display:block;border-radius:12px"></canvas>
          <canvas data-map tabindex="0" role="application" aria-label="Meadow map. Left and right arrows turn, up and down set distance, Enter flies." style="width:100%;max-width:290px;height:auto;display:block;border-radius:50%;cursor:crosshair;touch-action:none;outline-offset:2px"></canvas>
        </div>
        <p data-status aria-live="polite" style="margin:8px 0 0;min-height:38px;color:#fff"></p>
      </div>
    </div>`;

  const q = (s) => el.querySelector(s);
  const dance = q("[data-dance]"), map = q("[data-map]"), status = q("[data-status]"), timeBar = q("[data-time]");
  const dpr = Math.min(2, globalThis.devicePixelRatio || 1);
  const setup = (cv, w, h) => {
    cv.width = Math.round(w * dpr);
    cv.height = Math.round(h * dpr);
    const g = cv.getContext("2d");
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    return g;
  };
  const dg = setup(dance, 210, 210), mg = setup(map, 300, 300);

  let state = "intro", dead = false, raf = 0, last = 0;
  let flight = 0, score = 0, clock = 0, danceClock = 0, aiming = null;
  let target = { sun: 0, turn: 0, ring: 1 }, aim = { deg: 0, ring: 2 }, shot = null;

  const rad = (d) => (d * Math.PI) / 180;
  const norm = (d) => ((d % 360) + 360) % 360;
  const diff = (a, b) => Math.abs(((a - b + 540) % 360) - 180);
  const spot = (deg, ring) => [C + Math.sin(rad(deg)) * ring * GAP, C - Math.cos(rad(deg)) * ring * GAP];
  const bearing = () => norm(target.sun + target.turn);
  const pick = (n) => Math.min(n - 1, Math.floor(Math.random() * n));

  function newFlight() {
    // The first two flights keep the sun at the top; after that it wanders around the meadow.
    const sun = flight < 2 ? 0 : flight < 4 ? [90, 270, 180, 45, 315][pick(5)] : pick(24) * 15;
    let turn = (pick(23) + 1) * 15;
    if (diff(turn, target.turn) < 30) turn = norm(turn + 105);
    target = { sun, turn, ring: 1 + pick(4) };
    aim = { deg: sun, ring: 2 };
    shot = null;
    aiming = null;
    clock = 0;
    danceClock = 0;
    state = "aim";
    q("[data-flight]").textContent = `Flight ${flight + 1}/${FLIGHTS}`;
    q("[data-score]").textContent = `Nectar drops: ${score}`;
    status.textContent = flight < 2 ? "The sun is at the top: fly the way the waggle points." : "The sun has moved! Start at the sun, then turn the dance's angle.";
  }

  function fly(timedOut = false) {
    if (state !== "aim") return;
    const err = diff(aim.deg, bearing()), off = Math.abs(aim.ring - target.ring);
    let pts = 0;
    if (!timedOut) {
      if (err <= 16 * EASE && off === 0) pts = 3;
      else if (err <= 30 * EASE && off <= 1) pts = 2;
      else if (err <= 50 * EASE && off <= 2) pts = 1;
    }
    score += pts;
    shot = timedOut ? null : { deg: aim.deg, ring: aim.ring };
    state = "show";
    clock = 0;
    aiming = null;
    const hint = err > 30 * EASE ? "check the angle" : off ? "count the bzz dots" : "so close";
    status.textContent = timedOut ? "Too slow, the flowers closed. +0" : pts === 3 ? "Right on the flowers! +3" : pts === 2 ? `Lovely flight, ${off ? "one ring out" : "a touch wide"}. +2` : pts === 1 ? `Found the edge of the patch, ${hint}. +1` : `Missed, ${hint}. +0`;
    q("[data-score]").textContent = `Nectar drops: ${score}`;
    api.ping(pts ? "blip" : "choice");
  }

  // ---------- drawing ----------
  const disc = (g, x, y, r, fill) => { g.beginPath(); g.arc(x, y, r, 0, TAU); g.fillStyle = fill; g.fill(); };
  const stroke = (g, pts, col, w, dash = []) => {
    g.beginPath();
    pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
    g.strokeStyle = col;
    g.lineWidth = w;
    g.lineCap = "round";
    g.setLineDash(dash);
    g.stroke();
    g.setLineDash([]);
  };
  const text = (g, s, x, y, col = "#fff", size = 11) => {
    g.font = `700 ${size}px system-ui,sans-serif`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillStyle = col;
    g.fillText(s, x, y);
  };
  function sunIcon(g, x, y, r) {
    for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; stroke(g, [[x + Math.cos(a) * (r + 2), y + Math.sin(a) * (r + 2)], [x + Math.cos(a) * (r + 6), y + Math.sin(a) * (r + 6)]], "#ffd23a", 2.4); }
    disc(g, x, y, r, "#ffd23a");
  }
  /** A tiny top-view bee, head toward `heading` (radians clockwise from up). */
  function bee(g, x, y, heading, k = 1) {
    g.save();
    g.translate(x, y);
    g.rotate(heading);
    g.scale(k, k);
    const oval = (cx, cy, rx, ry, fill, rot = 0) => { g.beginPath(); g.ellipse(cx, cy, rx, ry, rot, 0, TAU); g.fillStyle = fill; g.fill(); };
    for (const s of [-1, 1]) for (const ly of [-6, 0, 6]) stroke(g, [[s * 5, ly], [s * 13, ly + 4]], "#2c1a0c", 1.8);
    oval(0, 8, 8, 11, "#f2a822");
    for (const by of [5, 11]) stroke(g, [[-6.5, by], [6.5, by]], "#3b2412", 3);
    oval(0, -4, 7.5, 7, "#b87c2c");
    oval(0, -13, 6.5, 5.5, "#3b2412");
    for (const s of [-1, 1]) {
      disc(g, s * 3.4, -14, 2.3, "#fff");
      disc(g, s * 3.4, -14.4, 1.3, "#14131f");
      stroke(g, [[s * 2, -17], [s * 6, -23]], "#3b2412", 1.4);
      oval(s * 11, 1, 5, 10, "rgba(220,242,255,.72)", s * -0.7);
    }
    g.restore();
  }

  function drawDance() {
    const g = dg, a = rad(target.turn), ux = Math.sin(a), uy = -Math.cos(a), nx = -uy, ny = ux;
    g.clearRect(0, 0, 210, 210);
    g.fillStyle = "#7a4c14";
    g.fillRect(0, 0, 210, 210);
    for (let row = 0; row < 9; row++) for (let col = 0; col < 9; col++) {
      const x = col * 27 + (row % 2 ? 13.5 : 0), y = row * 24 + 4;
      g.beginPath();
      for (let i = 0; i < 6; i++) { const h = (i / 6) * TAU + TAU / 12; g[i ? "lineTo" : "moveTo"](x + Math.cos(h) * 14.5, y + Math.sin(h) * 14.5); }
      g.closePath();
      g.fillStyle = (row + col) % 3 ? "#9a651c" : "#8a5818";
      g.fill();
    }
    const cx = 105, cy = 108, L = 80;
    // "up" reference line to the sun
    stroke(g, [[cx, cy], [cx, 36]], "#ffe9a0", 2, [3, 5]);
    sunIcon(g, cx, 19, 8);
    text(g, "UP = SUN", 170, 18, "#fff2c0", 10);
    const start = [cx - ux * L / 2, cy - uy * L / 2], end = [cx + ux * L / 2, cy + uy * L / 2];
    // the waggle run itself, with an arrow head showing its direction
    stroke(g, [start, end], "#fff", 3, [7, 6]);
    stroke(g, [[end[0] - ux * 11 + nx * 8, end[1] - uy * 11 + ny * 8], [end[0] + ux * 3, end[1] + uy * 3], [end[0] - ux * 11 - nx * 8, end[1] - uy * 11 - ny * 8]], "#fff", 3);
    const run = target.ring * BZZ, cycle = run + LOOP, t = danceClock % cycle, side = Math.floor(danceClock / cycle) % 2 ? -1 : 1;
    let x, y, heading, lit;
    if (still) {
      [x, y] = [cx, cy];
      heading = a;
      lit = target.ring;
      stroke(g, Array.from({ length: 25 }, (_, i) => { const u = i / 24, w = i % 2 ? 5 : -5; return [start[0] + ux * L * u + nx * w, start[1] + uy * L * u + ny * w]; }), "#ffd84d", 1.5);
    } else if (t < run) {
      const u = t / run, phase = (t / BZZ) * TAU * 3, w = Math.sin(phase) * 5;
      x = start[0] + ux * L * u + nx * w;
      y = start[1] + uy * L * u + ny * w;
      heading = a + Math.cos(phase) * 0.32;
      lit = Math.min(target.ring, Math.floor(t / BZZ) + 1);
      for (const s of [-1, 1]) stroke(g, [[x + nx * s * 17, y + ny * s * 17], [x + nx * s * 24 - ux * 5, y + ny * s * 24 - uy * 5]], "#fff2a8", 2.5);
    } else {
      const v = (t - run) / LOOP, bulge = Math.sin(Math.PI * v) * 52 * side;
      x = end[0] - ux * L * v + nx * bulge;
      y = end[1] - uy * L * v + ny * bulge;
      const dx = -ux * L + nx * Math.cos(Math.PI * v) * Math.PI * 52 * side, dy = -uy * L + ny * Math.cos(Math.PI * v) * Math.PI * 52 * side;
      heading = Math.atan2(dx, -dy);
      lit = target.ring;
    }
    bee(g, x, y, heading, 1.15);
    g.fillStyle = "rgba(23,14,6,.82)";
    g.fillRect(40, 180, 130, 26);
    text(g, "bzz", 62, 193, "#fff", 12);
    for (let i = 0; i < 4; i++) disc(g, 90 + i * 20, 193, 7, i < lit ? "#ffe23a" : "rgba(255,255,255,.18)");
  }

  function flower(g, x, y) {
    for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; disc(g, x + Math.cos(a) * 8, y + Math.sin(a) * 8, 6, "#ff8fc4"); }
    disc(g, x, y, 5.5, "#ffe23a");
  }

  function drawMap() {
    const g = mg;
    g.clearRect(0, 0, 300, 300);
    disc(g, C, C, 150, "#2f5c3c");
    for (let r = 4; r >= 1; r--) {
      disc(g, C, C, r * GAP + GAP / 2, r % 2 ? "#4c8a4e" : "#427c48");
    }
    for (let r = 1; r <= 4; r++) {
      g.beginPath();
      g.arc(C, C, r * GAP, 0, TAU);
      g.strokeStyle = "rgba(255,255,255,.35)";
      g.lineWidth = 1;
      g.stroke();
    }
    for (let i = 0; i < 24; i++) { const [x, y] = spot(i * 47 + 11, 0.7 + ((i * 13) % 34) / 10); disc(g, x, y, 1.6, ["#fff", "#ffe27a", "#ffc0dc"][i % 3]); }
    const sx = C + Math.sin(rad(target.sun)) * 137, sy = C - Math.cos(rad(target.sun)) * 137;
    stroke(g, [[C, C], [sx, sy]], "#ffe27a", 2, [4, 5]);
    sunIcon(g, sx, sy, 7);
    for (let r = 1; r <= 4; r++) {
      // ring numbers sit opposite the sun so they never hide it
      const [x, y] = spot(target.sun + 180, r);
      disc(g, x, y, 8, "rgba(12,30,18,.75)");
      text(g, String(r), x, y + 0.5, "#fff", 10);
    }
    // hive
    g.beginPath();
    for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; g[i ? "lineTo" : "moveTo"](C + Math.cos(a) * 13, C + Math.sin(a) * 13); }
    g.closePath();
    g.fillStyle = "#f6b83a";
    g.fill();
    g.strokeStyle = "#7a4a10";
    g.lineWidth = 2.5;
    g.stroke();
    disc(g, C, C + 2, 4, "#5a3410");
    if (state === "aim") {
      const [x, y] = spot(aim.deg, aim.ring);
      stroke(g, [[C, C], [x, y]], "#fff", 2.5, [6, 5]);
      g.beginPath();
      g.arc(x, y, 14, 0, TAU);
      g.strokeStyle = "#fff";
      g.lineWidth = 2;
      g.stroke();
      bee(g, x, y, rad(aim.deg), 0.7);
    } else {
      const [fx, fy] = spot(bearing(), target.ring);
      stroke(g, [[C, C], [fx, fy]], "#ffb0d6", 3);
      flower(g, fx, fy);
      if (shot) {
        const u = still ? 1 : Math.min(1, clock / 0.45), [x, y] = spot(shot.deg, shot.ring * u);
        stroke(g, [[C, C], [x, y]], "#fff", 2, [5, 5]);
        bee(g, x, y, rad(shot.deg), 0.8);
      }
    }
    if (state === "over") {
      g.fillStyle = "rgba(14,16,34,.82)";
      g.fillRect(55, 118, 190, 64);
      text(g, "Back at the hive!", C, 138, "#fff", 15);
      text(g, `${score} nectar drops`, C, 163, "#ffe23a", 15);
    }
  }

  // ---------- loop and input ----------
  function tick(now) {
    if (dead) return;
    if (!el.isConnected) return cleanup();
    const dt = Math.min(0.1, Math.max(0, (now - last) / 1000));
    last = now;
    clock += dt;
    danceClock += dt;
    if (state === "aim") {
      const left = Math.max(0, 1 - clock / LIMIT);
      timeBar.style.width = `${left * 100}%`;
      timeBar.style.background = left < 0.3 ? "#ff8a6a" : "#d4f27a";
      if (clock >= LIMIT) fly(true);
    } else if (state === "show" && clock >= SHOW) {
      flight++;
      if (flight >= FLIGHTS) {
        state = "over";
        status.textContent = `The dance is done: ${score} nectar drops from ${FLIGHTS} flights.`;
        drawDance();
        drawMap();
        unbind();
        api.done(score);
        return;
      }
      newFlight();
    }
    drawDance();
    drawMap();
    raf = requestAnimationFrame(tick);
  }

  function setAim(e) {
    const r = map.getBoundingClientRect();
    const x = ((e.clientX - r.left) / (r.width || 300)) * 300 - C, y = ((e.clientY - r.top) / (r.height || 300)) * 300 - C;
    const d = Math.hypot(x, y);
    if (d < 14) return false; // a touch on the hive itself is not a destination
    aim = { deg: norm((Math.atan2(x, -y) * 180) / Math.PI), ring: Math.max(1, Math.min(4, Math.round(d / GAP))) };
    return true;
  }
  map.addEventListener("pointerdown", (e) => {
    if (state !== "aim" || (e.button || 0) > 0) return;
    e.preventDefault();
    if (!setAim(e)) return;
    aiming = e.pointerId ?? 0;
    map.setPointerCapture?.(e.pointerId);
  });
  map.addEventListener("pointermove", (e) => {
    if (state === "aim" && aiming === (e.pointerId ?? 0)) setAim(e);
  });
  map.addEventListener("pointerup", (e) => {
    if (state !== "aim" || aiming !== (e.pointerId ?? 0)) return;
    aiming = null;
    if (setAim(e)) fly();
  });
  map.addEventListener("pointercancel", () => { aiming = null; });

  const KEYS = { arrowleft: "left", a: "left", arrowright: "right", d: "right", arrowup: "up", w: "up", arrowdown: "down", s: "down", enter: "go", " ": "go" };
  function onKey(e) {
    if (!el.isConnected) return cleanup();
    if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
    const k = e.key.toLowerCase(), act = KEYS[k];
    if (!act || (state !== "aim" && state !== "show")) return;
    // Focused buttons (such as Close) keep their own Enter and Space.
    if (act === "go" && e.target?.closest?.("button")) return;
    e.preventDefault();
    e.stopPropagation();
    if (state !== "aim") return;
    if (act === "left") aim.deg = norm(aim.deg - STEP);
    else if (act === "right") aim.deg = norm(aim.deg + STEP);
    else if (act === "up") aim.ring = Math.min(4, aim.ring + 1);
    else if (act === "down") aim.ring = Math.max(1, aim.ring - 1);
    else if (!e.repeat) return fly();
    status.textContent = `Aim: ${Math.round(norm(aim.deg - target.sun))}° clockwise from the sun, ring ${aim.ring}.`;
  }
  const unbind = () => globalThis.removeEventListener?.("keydown", onKey, true);

  function cleanup() {
    if (dead) return;
    dead = true;
    cancelAnimationFrame(raf);
    unbind();
  }

  q("[data-start]").onclick = () => {
    if (state !== "intro" || dead) return;
    q("[data-intro]").hidden = true;
    q("[data-board]").hidden = false;
    globalThis.addEventListener?.("keydown", onKey, true);
    api.ping("choice");
    newFlight();
    map.focus?.({ preventScroll: true });
    last = performance.now();
    drawDance();
    drawMap();
    raf = requestAnimationFrame(tick);
  };

  return cleanup;
}
