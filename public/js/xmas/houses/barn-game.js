// Bale Tower: hay bales swing from the loft hoist. Drop each one onto the stack; overhang gets trimmed,
// centred drops score double and win some width back, and a pygmy-sized climber rides the top.
const W = 280; // logical width; horizontal positions are drawn as percentages of it
const HEIGHT = 300;
const BALE_H = 22;
const BALES = 14;
const BASE_W = 96;
const MIN_W = 40;
const BASE_Y = 26; // top of the hay cart
const CARRY_Y = HEIGHT - 72; // bottom edge of the swinging bale, in screen pixels
const GRAVITY = 1500;
const HERO = "barn_nigerian";

export default function mount(el, api) {
  const slow = !!api.unhurried;
  const SWING = slow ? [1.35, 1.9] : [2.15, 3.2]; // radians per second, first to last bale
  const PERFECT = slow ? 8 : 6; // how far off centre still counts as spot on
  const AUTO = slow ? 4.8 : 2.9; // seconds before the hoist lets go by itself
  const LIMIT = slow ? 70 : 44; // hard cap on a run
  const calm = !!globalThis.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

  const make = (tag, css, parent, text) => {
    const node = document.createElement(tag);
    if (css) node.style.cssText = css;
    if (text) node.textContent = text;
    parent?.appendChild(node);
    return node;
  };

  el.innerHTML = "";
  const root = make("div", "max-width:320px;margin:0 auto;color:#fff;font:600 13px system-ui,sans-serif;user-select:none;-webkit-user-select:none", el);
  const hud = make("div", "display:flex;justify-content:space-between;gap:6px;padding:7px 10px;border-radius:10px;background:#2e1612;margin-bottom:6px", root);
  const leftEl = make("span", "white-space:nowrap", hud);
  const scoreEl = make("span", "white-space:nowrap;color:#ffd84d;font-weight:800", hud);

  const stage = make("div", `position:relative;height:${HEIGHT}px;border-radius:14px;overflow:hidden;touch-action:none;cursor:pointer;border:3px solid #b9483a;background:linear-gradient(180deg,#1f2748 0%,#59426a 48%,#c06a52 100%)`, root);
  stage.setAttribute("aria-label", "Bale tower. Press Space, Enter, down arrow or tap to drop the swinging bale.");
  // Loft beam and hoist.
  make("div", "position:absolute;left:0;right:0;top:0;height:12px;background:#4a2418;border-bottom:3px solid #2a120a", stage);
  const fuse = make("div", "position:absolute;left:0;top:15px;height:4px;width:0;background:#ffd84d;border-radius:0 3px 3px 0", stage);
  const world = make("div", "position:absolute;inset:0;pointer-events:none", stage);
  const rope = make("div", `position:absolute;top:12px;width:3px;margin-left:-1.5px;height:${HEIGHT - 12 - CARRY_Y - BALE_H}px;background:#d8b070;pointer-events:none`, stage);

  const place = (node, cx, w, bottom) => {
    node.style.left = `${((cx - w / 2) / W) * 100}%`;
    node.style.width = `${(w / W) * 100}%`;
    node.style.bottom = `${bottom}px`;
  };
  const baleCss = `position:absolute;box-sizing:border-box;height:${BALE_H}px;border-radius:5px;border:2px solid #8a5a14;background:linear-gradient(90deg,transparent 0 24%,#a8401e 24% 28%,transparent 28% 72%,#a8401e 72% 76%,transparent 76%),repeating-linear-gradient(176deg,#f6cf5a 0 3px,#e3ac34 3px 5px,#ffe27c 5px 7px);box-shadow:inset 0 -4px 0 rgba(110,60,0,.3)`;

  const ground = make("div", "position:absolute;left:0;right:0;height:60px;background:#5a3a20;border-top:5px solid #6f9f45", world);
  const cart = make("div", "position:absolute;box-sizing:border-box;height:10px;border-radius:3px;background:#c8503c;border:2px solid #6a2018", world);
  const wheels = [-1, 1].map(() => make("div", "position:absolute;width:16px;height:16px;margin-left:-8px;border-radius:50%;background:#3a2418;border:3px solid #d8a860;box-sizing:border-box", world));
  const goat = make("div", `position:absolute;width:52px;height:52px;margin-left:-26px;${calm ? "" : "transition:left .18s ease-out,bottom .18s cubic-bezier(.3,1.8,.6,1);"}`, world);
  const carried = make("div", baleCss, stage);
  carried.style.pointerEvents = "none";

  const cover = make("div", "position:absolute;inset:0;z-index:3;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;text-align:center;padding:16px;background:rgba(30,14,12,.86)", stage);
  make("div", "font-size:19px;font-weight:800", cover, "Bale Tower");
  make("div", "font-size:13px;line-height:1.5;color:#ffeccc;max-width:250px", cover, `Drop ${BALES} swinging bales onto the cart. Overhang gets trimmed. Spot-on drops score 2 and win width back; others score 1.`);
  const startBtn = make("button", "min-height:44px", cover, "Start stacking");
  startBtn.type = "button";
  startBtn.className = "btn btn-accent";
  make("div", "font-size:11px;color:#e0c4a8", cover, "Tap the loft, or press Space, Enter or ↓");

  const dropBtn = make("button", "display:block;width:100%;min-height:46px;margin-top:8px;font-size:16px;font-weight:800;touch-action:none", root, "⬇ Drop bale");
  dropBtn.type = "button";
  dropBtn.className = "btn";
  const msg = make("div", "min-height:20px;text-align:center;margin-top:6px;color:#ffe6a8", root, "The goat is waiting.");
  msg.setAttribute("aria-live", "polite");

  let running = false, ended = false, dead = false;
  let raf = 0, last = 0, clock = 0, moodTimer = 0;
  let score = 0, used = 0, cam = 0, phase = 0, held = 0, pause = 0;
  let falling = null; // { cx, w, y, vy, miss, side, spin }
  let tower = [{ cx: W / 2, w: BASE_W }];
  let moodNow = "";

  const topBale = () => tower[tower.length - 1];
  const topY = () => BASE_Y + (tower.length - 1) * BALE_H;
  const swingX = () => W / 2 + (W / 2 - topBale().w / 2 - 5) * Math.sin(phase);

  function drawGoat(mood = "happy") {
    if (mood === moodNow) return;
    moodNow = mood;
    goat.innerHTML = api.svg(HERO, { size: 52, stage: 1, mood });
  }
  function cheer(mood) {
    clearTimeout(moodTimer);
    drawGoat(mood);
    moodTimer = setTimeout(() => { if (!dead) drawGoat(); }, 650);
  }
  function drawHud() {
    leftEl.textContent = `🌾 Bales ${BALES - used}/${BALES}`;
    scoreEl.textContent = `Score ${score}`;
  }
  const say = (text) => { msg.textContent = text; };

  function drawScene() {
    place(ground, W / 2, W, BASE_Y - 26 - 60 + 5 - cam);
    place(cart, W / 2, BASE_W + 14, BASE_Y - 10 - cam);
    wheels.forEach((wheel, i) => {
      wheel.style.left = `${((W / 2 + (i ? 36 : -36)) / W) * 100}%`;
      wheel.style.bottom = `${BASE_Y - 23 - cam}px`;
    });
    tower.forEach((b, i) => { if (b.node) place(b.node, b.cx, b.w, BASE_Y + (i - 1) * BALE_H - cam); });
    const t = topBale();
    goat.style.left = `${(t.cx / W) * 100}%`;
    goat.style.bottom = `${topY() - 3 - cam}px`;
    const cx = swingX(), waiting = !falling && pause <= 0 && used < BALES;
    rope.style.left = `${(cx / W) * 100}%`;
    rope.style.opacity = waiting ? "1" : ".35";
    if (falling) {
      place(carried, falling.cx, falling.w, falling.y - cam);
      carried.style.transform = falling.spin && !calm ? `rotate(${falling.spin}deg)` : "none";
      carried.style.display = "block";
    } else {
      place(carried, cx, t.w, CARRY_Y);
      carried.style.transform = "none";
      carried.style.display = waiting ? "block" : "none";
    }
    fuse.style.width = running && waiting ? `${Math.max(0, 1 - held / AUTO) * 100}%` : "0";
  }

  function drop() {
    if (dead || !running || falling || pause > 0 || used >= BALES) return;
    used++;
    falling = { cx: swingX(), w: topBale().w, y: CARRY_Y + cam, vy: 60, miss: false, side: 0, spin: 0 };
    held = 0;
    api.ping?.("blip");
    drawHud();
  }

  function land() {
    const t = topBale(), b = falling, off = b.cx - t.cx;
    // A bale needs a good third of itself resting on the stack, or it tips off.
    if (b.w - Math.abs(off) < b.w * 0.35) {
      b.miss = true;
      b.side = Math.sign(off) || 1;
      say("Whoops! That one tumbled off.");
      cheer("sad");
      return;
    }
    let { cx, w } = b;
    if (Math.abs(off) <= PERFECT) {
      cx = t.cx;
      w = Math.min(BASE_W, t.w + 8);
      score += 2;
      say("Spot on! +2");
      api.ping?.("choice");
      cheer("love");
    } else {
      // Trim part of the overhanging side.
      w = Math.max(MIN_W, b.w - Math.abs(off) * 0.45);
      cx = b.cx - Math.sign(off) * Math.max(0, b.w - w) / 2;
      score += 1;
      say(Math.abs(off) > b.w * 0.35 ? "Wobbly, but it holds. +1" : "Stacked! +1");
    }
    cx = Math.max(w / 2 + 4, Math.min(W - w / 2 - 4, cx));
    const node = make("div", baleCss, world);
    world.appendChild(goat); // keep the goat in front of every bale
    tower.push({ cx, w, node });
    falling = null;
    settle();
  }

  function settle() {
    pause = 0.5;
    // Alternate the side each new bale swings in from.
    phase = used % 2 ? -Math.PI / 2 : Math.PI / 2;
    drawHud();
    if (used >= BALES) finish();
  }

  function finish() {
    if (ended || dead) return;
    ended = true;
    running = false;
    falling = null;
    cancelAnimationFrame(raf);
    cam = Math.max(0, topY() - 120);
    dropBtn.disabled = true;
    drawScene();
    drawHud();
    const bales = tower.length - 1;
    say(`${bales} ${bales === 1 ? "bale" : "bales"} stacked for ${score} ${score === 1 ? "point" : "points"}.`);
    api.done(score);
  }

  function tick(now) {
    if (dead || !running) return;
    if (!el.isConnected) return cleanup();
    const dt = Math.max(0, Math.min(0.05, (now - last) / 1000));
    last = now;
    clock += dt;
    cam += (Math.max(0, topY() - 110) - cam) * (calm ? 1 : Math.min(1, dt * 7));
    if (falling) {
      falling.vy += GRAVITY * dt;
      falling.y -= falling.vy * dt;
      if (falling.miss) {
        falling.cx += falling.side * 120 * dt;
        falling.spin += falling.side * 320 * dt;
        if (falling.y - cam < -BALE_H * 2) { falling = null; settle(); }
      } else if (falling.y <= topY()) {
        falling.y = topY();
        land();
      }
    } else if (pause > 0) {
      pause -= dt;
    } else {
      const progress = Math.min(1, used / (BALES - 1));
      phase += (SWING[0] + (SWING[1] - SWING[0]) * progress) * dt;
      held += dt;
      if (held >= AUTO) drop();
    }
    if (ended) return;
    if (clock >= LIMIT) return finish();
    drawScene();
    raf = requestAnimationFrame(tick);
  }

  function start() {
    if (dead || running || ended) return;
    running = true;
    cover.style.display = "none";
    startBtn.blur?.();
    phase = -Math.PI / 2;
    say("Line it up, then drop!");
    api.ping?.("blip");
    last = performance.now();
    raf = requestAnimationFrame(tick);
  }
  startBtn.addEventListener("click", start);

  stage.addEventListener("pointerdown", (e) => {
    if (!running || e.button > 0) return;
    e.preventDefault();
    drop();
  });
  dropBtn.addEventListener("pointerdown", (e) => {
    if (e.button > 0) return;
    e.preventDefault();
    drop();
  });
  // Assistive tech activates the button with a click that has no pointer detail.
  dropBtn.addEventListener("click", (e) => { if (!e.detail) drop(); });

  const KEYS = new Set([" ", "spacebar", "enter", "arrowdown", "s"]);
  function onKey(e) {
    if (dead) return;
    if (!el.isConnected) return cleanup();
    if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey || !running) return;
    if (!KEYS.has(String(e.key).toLowerCase())) return;
    if (/^(input|textarea|select)$/i.test(e.target?.tagName || "")) return;
    e.preventDefault();
    if (!e.repeat) drop();
  }
  globalThis.addEventListener("keydown", onKey, true);

  function cleanup() {
    if (dead) return;
    dead = true;
    running = false;
    cancelAnimationFrame(raf);
    clearTimeout(moodTimer);
    globalThis.removeEventListener("keydown", onKey, true);
    tower = [];
    falling = null;
    el.innerHTML = "";
  }

  drawGoat();
  drawHud();
  drawScene();
  return cleanup;
}
