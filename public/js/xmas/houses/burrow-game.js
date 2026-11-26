// Pouch Run: steer a hamster between three tunnels, fill its cheeks with seeds, and store them at
// pantry doors before a root knocks them all out.
const LANES = 3;
const CAP = 6; // seeds that fit in both cheeks
const FULL_BONUS = 2;
const HEIGHT = 300;
const HIT_Y = HEIGHT - 50; // where an item meets the hamster
const SPACING = 108; // pixels between rows
const PANTRY_EVERY = 6;
const HERO = "burrow_syrian";

const SEED = `<svg viewBox="0 0 40 40" width="34" height="34" aria-hidden="true"><circle cx="20" cy="20" r="18" fill="#ffe27a" opacity=".28"/><path d="M20 5C31 14 30 34 20 35C10 34 9 14 20 5Z" fill="#4a3830" stroke="#fff3d8" stroke-width="2.2"/><path d="M16 17v12M24 17v12" stroke="#f2eadc" stroke-width="2" stroke-linecap="round"/></svg>`;
const ROOT = `<svg viewBox="0 0 72 44" width="72" height="44" aria-hidden="true"><g fill="none" stroke-linecap="round"><path d="M5 14Q24 8 34 22T68 28M20 15Q22 30 12 38M44 25Q50 12 62 8M36 23Q38 34 48 39" stroke="#1c0e06" stroke-width="13"/><path d="M5 14Q24 8 34 22T68 28M20 15Q22 30 12 38M44 25Q50 12 62 8M36 23Q38 34 48 39" stroke="#c08850" stroke-width="7.5"/><path d="M9 12Q24 9 31 18M46 27Q55 29 64 27" stroke="#f0c890" stroke-width="2"/></g><path d="M30 6l4 6M39 4v7M48 6l-4 6" stroke="#ff6a5a" stroke-width="3" stroke-linecap="round"/></svg>`;
const PANTRY = `<svg viewBox="0 0 72 52" width="72" height="52" aria-hidden="true"><path d="M8 50V25C8 9 20 3 36 3S64 9 64 25V50Z" fill="#ffcf4a" stroke="#fff6c8" stroke-width="3.5"/><path d="M15 49V27C15 16 24 11 36 11S57 16 57 27V49Z" fill="#6a3c1c"/><path d="M36 17l4 7l8 -1l-5 6l5 6l-8 -1l-4 7l-4 -7l-8 1l5 -6l-5 -6l8 1Z" fill="#ffd84d" opacity=".9"/><rect x="11" y="37" width="50" height="14" rx="4" fill="#fff6d8" stroke="#6a3c1c" stroke-width="1.5"/><text x="36" y="47.6" font-size="10.5" font-weight="800" font-family="system-ui,Helvetica" text-anchor="middle" fill="#4a2408">STORE</text></svg>`;
const ICONS = { seed: SEED, root: ROOT, pantry: PANTRY };

export default function mount(el, api) {
  const slow = !!api.unhurried;
  const RUN_SECONDS = slow ? 38 : 28; // then the way home scrolls in
  const START_SPEED = slow ? 92 : 128;
  const END_SPEED = slow ? 124 : 188;
  const calm = !!globalThis.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

  const make = (tag, css, parent, text) => {
    const node = document.createElement(tag);
    if (css) node.style.cssText = css;
    if (text) node.textContent = text;
    parent?.appendChild(node);
    return node;
  };

  el.innerHTML = "";
  const root = make("div", "max-width:330px;margin:0 auto;color:#fff;font:600 13px system-ui,sans-serif;user-select:none;-webkit-user-select:none", el);
  const hud = make("div", "display:flex;justify-content:space-between;align-items:center;gap:6px;padding:6px 10px;border-radius:10px;background:#2a1c16;margin-bottom:6px", root);
  const timeEl = make("span", "min-width:52px", hud);
  const pouchEl = make("span", "letter-spacing:2px;color:#ffd84d;font-size:15px;white-space:nowrap", hud);
  const storedEl = make("span", "min-width:70px;text-align:right", hud);

  const track = make("div", `position:relative;height:${HEIGHT}px;border-radius:14px;overflow:hidden;touch-action:none;cursor:pointer;background:#5a3a26;border:3px solid #c99a60`, root);
  track.setAttribute("aria-label", "Three tunnels. Use left and right arrows, 1 2 3, tap a tunnel or swipe.");
  const stripes = [];
  for (let i = 0; i < LANES; i++) {
    stripes.push(make("div", `position:absolute;top:0;bottom:0;left:${(i * 100) / LANES + 1.5}%;width:${100 / LANES - 3}%;border-radius:18px;background:repeating-linear-gradient(180deg,#8a5c3a 0 27px,#815434 27px 54px);box-shadow:inset 0 0 14px rgba(20,8,0,.6)`, track));
  }
  const field = make("div", "position:absolute;inset:0;pointer-events:none", track);
  const hero = make("div", `position:absolute;top:${HEIGHT - 90}px;width:76px;height:76px;margin-left:-38px;pointer-events:none;z-index:2;${calm ? "" : "transition:left .09s ease-out;"}`, track);
  const heroArt = make("div", "width:76px;height:76px;transform-origin:50% 100%", hero);
  const cover = make("div", "position:absolute;inset:0;z-index:3;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;text-align:center;padding:16px;background:rgba(24,14,10,.86)", track);
  make("div", "font-size:18px;font-weight:800", cover, "Pouch Run");
  make("div", "font-size:13px;line-height:1.45;color:#ffeccc", cover, `Scoop seeds (cheeks hold ${CAP}), then run into a STORE door to keep them. Roots spill the lot! A full pouch earns +${FULL_BONUS}.`);
  const startBtn = make("button", "", cover, "Start run");
  startBtn.type = "button";
  startBtn.className = "btn btn-accent";
  make("div", "font-size:11px;color:#d8bfa0", cover, "Arrows, A/D or 1-3. Tap or swipe the tunnels.");

  const pad = make("div", "display:flex;gap:8px;margin-top:8px", root);
  const padButton = (label, name, step) => {
    const b = make("button", "flex:1;min-height:44px;font-size:20px;touch-action:none", pad, label);
    b.type = "button";
    b.className = "btn";
    b.setAttribute("aria-label", name);
    b.addEventListener("pointerdown", (e) => { e.preventDefault(); steer(lane + step); });
    // Keyboard activation of the focused button arrives as a click with no pointer detail.
    b.addEventListener("click", (e) => { if (!e.detail) steer(lane + step); });
    return b;
  };
  padButton("◀", "Move left", -1);
  padButton("▶", "Move right", 1);
  const msg = make("div", "min-height:20px;text-align:center;margin-top:6px;color:#ffe6a8", root, "Ready when you are.");
  msg.setAttribute("aria-live", "polite");

  let lane = 1, safeLane = 1, pouch = 0, stored = 0;
  let running = false, ended = false, dead = false;
  let raf = 0, last = 0, elapsed = 0, travelled = SPACING - 30, scrolled = 0, rows = 0, homeSent = false, moodTimer = 0;
  let items = [];
  let shown = "";

  function drawHero(mood = "happy") {
    const full = pouch >= CAP;
    const key = `${mood}:${full}`;
    if (key !== shown) {
      shown = key;
      heroArt.innerHTML = api.svg(HERO, { size: 76, stage: 1, mood, act: full ? "signature" : "" });
    }
    // Cheeks visibly widen as they fill.
    heroArt.style.transform = `scale(${1 + Math.min(pouch, CAP) * 0.028},1)`;
  }
  function drawHud() {
    timeEl.textContent = homeSent ? "Home!" : `⏱ ${Math.max(0, Math.ceil(RUN_SECONDS - elapsed))}s`;
    pouchEl.textContent = "●".repeat(pouch) + "○".repeat(CAP - pouch);
    pouchEl.setAttribute("aria-label", `Pouch ${pouch} of ${CAP}`);
    storedEl.textContent = `Stored ${stored}`;
  }
  function steer(to) {
    if (dead || ended) return;
    lane = Math.max(0, Math.min(LANES - 1, to));
    hero.style.left = `${((lane + 0.5) * 100) / LANES}%`;
  }
  const say = (text) => { msg.textContent = text; };

  function addItem(type, at, wide = false) {
    // Each item is a box centred on its lane (or spanning the track) and on its own y position.
    const place = wide ? "left:0;width:100%;justify-content:space-around" : `left:${((at + 0.5) * 100) / LANES}%;width:80px;margin-left:-40px;justify-content:center`;
    const node = make("div", `position:absolute;top:-28px;height:56px;display:flex;align-items:center;${place}`, field);
    node.innerHTML = wide ? PANTRY.repeat(LANES) : ICONS[type];
    node.dataset.type = type;
    node.dataset.lane = wide ? "all" : String(at);
    const item = { type, lane: at, wide, y: -30, node, done: false };
    node.style.transform = `translateY(${item.y}px)`;
    items.push(item);
  }

  function spawnRow() {
    rows++;
    // One lane is always root-free and never more than one step from the last such lane.
    const step = Math.floor(Math.random() * 3) - 1;
    safeLane = Math.max(0, Math.min(LANES - 1, safeLane + step));
    const others = [0, 1, 2].filter((i) => i !== safeLane).sort(() => Math.random() - 0.5);
    if (rows % PANTRY_EVERY === 0) {
      addItem("pantry", safeLane);
      if (Math.random() < 0.5) addItem("root", others[0]);
      return;
    }
    const roll = Math.random();
    const roots = rows < 3 ? 0 : roll < 0.2 ? 0 : roll < 0.68 ? 1 : 2;
    const blocked = others.slice(0, roots);
    blocked.forEach((i) => addItem("root", i));
    const open = [0, 1, 2].filter((i) => !blocked.includes(i)).sort(() => Math.random() - 0.5);
    if (Math.random() < 0.86) {
      addItem("seed", open[0]);
      if (open[1] !== undefined && Math.random() < 0.18) addItem("seed", open[1]);
    }
  }

  function bank() {
    if (!pouch) return say("Empty cheeks: nothing to store yet.");
    const bonus = pouch >= CAP ? FULL_BONUS : 0;
    stored += pouch + bonus;
    say(bonus ? `Full pouch! ${pouch} stored, +${bonus} bonus.` : `${pouch} stored safely.`);
    pouch = 0;
    api.ping?.("choice");
  }

  function mood(name) {
    clearTimeout(moodTimer);
    drawHero(name);
    moodTimer = setTimeout(() => { if (!dead) drawHero(); }, 600);
  }

  function meet(item) {
    if (!item.wide && item.lane !== lane) return;
    item.done = true;
    if (item.type === "seed") {
      if (pouch >= CAP) return say("Cheeks full! Find a STORE door.");
      pouch++;
      item.node.style.display = "none";
      api.ping?.("blip");
      drawHero();
      if (pouch >= CAP) say("Cheeks full! Find a STORE door.");
    } else if (item.type === "root") {
      say(pouch ? `Bonk! ${pouch} ${pouch === 1 ? "seed" : "seeds"} spilled.` : "Bonk! Mind the roots.");
      pouch = 0;
      mood("sad");
    } else {
      item.node.style.display = "none";
      bank();
      if (item.wide) finish();
      else mood("love");
    }
    drawHud();
  }

  function finish() {
    if (ended || dead) return;
    ended = true;
    running = false;
    cancelAnimationFrame(raf);
    drawHud();
    say(`Home safe with ${stored} stored ${stored === 1 ? "seed" : "seeds"}.`);
    api.done(stored);
  }

  function tick(now) {
    if (dead || !running) return;
    if (!el.isConnected) return cleanup();
    const dt = Math.max(0, Math.min(0.05, (now - last) / 1000));
    last = now;
    elapsed += dt;
    const speed = START_SPEED + (END_SPEED - START_SPEED) * Math.min(1, elapsed / RUN_SECONDS);
    const dy = speed * dt;
    travelled += dy;
    scrolled = (scrolled + dy) % 54;
    if (!calm) for (const s of stripes) s.style.backgroundPosition = `0 ${scrolled}px`;
    if (elapsed < RUN_SECONDS) {
      if (travelled >= SPACING) { travelled -= SPACING; spawnRow(); }
    } else if (!homeSent && travelled >= SPACING * 1.3) {
      homeSent = true;
      addItem("pantry", 1, true);
      say("Home stretch: the big pantry is coming!");
    }
    for (const item of items) {
      const before = item.y;
      item.y += dy;
      item.node.style.transform = `translateY(${item.y}px)`;
      if (!item.done && before < HIT_Y && item.y >= HIT_Y) meet(item);
      if (ended) return;
    }
    items = items.filter((item) => {
      if (item.y < HEIGHT + 40) return true;
      item.node.remove();
      return false;
    });
    drawHud();
    raf = requestAnimationFrame(tick);
  }

  function start() {
    if (dead || running || ended) return;
    running = true;
    cover.style.display = "none";
    say("Go! Fill those cheeks.");
    api.ping?.("blip");
    startBtn.blur?.();
    last = performance.now();
    raf = requestAnimationFrame(tick);
  }
  startBtn.addEventListener("click", start);

  const KEYS = { arrowleft: -1, a: -1, arrowright: 1, d: 1 };
  function onKey(e) {
    if (dead) return;
    if (!el.isConnected) return cleanup();
    if (e.metaKey || e.ctrlKey || e.altKey || !running) return;
    const k = String(e.key).toLowerCase();
    if (k in KEYS) steer(lane + KEYS[k]);
    else if (k === "1" || k === "2" || k === "3") steer(Number(k) - 1);
    else return;
    e.preventDefault();
  }
  globalThis.addEventListener("keydown", onKey, true);

  let swipeX = null, swiped = false;
  track.addEventListener("pointerdown", (e) => {
    if (!running) return;
    e.preventDefault();
    swipeX = e.clientX;
    swiped = false;
    track.setPointerCapture?.(e.pointerId);
  });
  track.addEventListener("pointermove", (e) => {
    if (swipeX === null) return;
    const dx = e.clientX - swipeX;
    if (Math.abs(dx) > 30) {
      steer(lane + Math.sign(dx));
      swipeX = e.clientX;
      swiped = true;
    }
  });
  track.addEventListener("pointerup", (e) => {
    if (swipeX === null) return;
    swipeX = null;
    if (swiped) return;
    const box = track.getBoundingClientRect();
    steer(Math.floor(((e.clientX - box.left) / (box.width || 1)) * LANES));
  });
  track.addEventListener("pointercancel", () => { swipeX = null; });

  function cleanup() {
    if (dead) return;
    dead = true;
    running = false;
    cancelAnimationFrame(raf);
    clearTimeout(moodTimer);
    globalThis.removeEventListener("keydown", onKey, true);
    items = [];
    el.innerHTML = "";
  }

  steer(1);
  drawHero();
  drawHud();
  return cleanup;
}
