// Teacup Rescue: four café cats nudge things off a high shelf. Slide the cushion under each falling
// teacup in landing order, and keep clear of the soggy teabags.
const LANES = 4, SHELF = 92, FLOOR = 262;
const CATS = [["cats_ginger", "#ee9a45"], ["cats_tuxedo", "#fbfaf5"], ["cats_calico", "#fdf9f0"], ["cats_black", "#3c3752"]];

const svg = (body, w = 46) => `<svg viewBox="0 0 46 40" width="${w}" height="${(w * 40) / 46}" aria-hidden="true" style="display:block">${body}</svg>`;
const cup = (body, trim, steam) => `<path d="M33 17q11 -2 9 7q-2 7 -11 6" fill="none" stroke="${trim}" stroke-width="3.4"/><ellipse cx="21" cy="35" rx="18" ry="4" fill="${trim}"/><path d="M7 13H35Q35 33 21 34Q7 33 7 13Z" fill="${body}" stroke="#2a1830" stroke-width="1.4"/><ellipse cx="21" cy="13" rx="14" ry="3.6" fill="#a8642c" stroke="${trim}" stroke-width="2"/><path d="M10 21q11 5 22 0" fill="none" stroke="${trim}" stroke-width="2.6"/><path d="M16 8q-4 -3 0 -6M25 8q4 -3 0 -6" fill="none" stroke="${steam}" stroke-width="2" stroke-linecap="round"/>`;
const ART = {
  cup: svg(cup("#fdf7ef", "#e0688a", "#ffffff")),
  gold: svg(cup("#ffd84d", "#b8801a", "#fff2a8") + `<path d="M40 2q1 5 5 6q-4 1 -5 6q-1 -5 -5 -6q4 -1 5 -6Z" fill="#fff7c0"/>`),
  bag: svg(`<path d="M23 12V3h9" fill="none" stroke="#f4ead8" stroke-width="1.6"/><rect x="31" y="1" width="9" height="8" rx="1.5" fill="#8ad06a" stroke="#2a4a18"/><path d="M13 13L23 9L33 13L35 35Q23 39 11 35Z" fill="#9a7a4a" stroke="#d8f080" stroke-width="1.8" stroke-dasharray="4 3"/><path d="M17 22l5 5M22 22l-5 5M26 22l5 5M31 22l-5 5" stroke="#241408" stroke-width="2" stroke-linecap="round"/><path d="M18 33q5 -5 11 0" fill="none" stroke="#241408" stroke-width="2" stroke-linecap="round"/>`),
  crash: svg(`<path d="M4 36l9 -9l4 9ZM19 37l5 -14l7 13ZM33 36l4 -10l6 9Z" fill="#fdf7ef" stroke="#e0688a" stroke-width="1.4"/><path d="M11 19l-5 -6M23 15V6M35 19l6 -6" stroke="#ffb07a" stroke-width="2.6" stroke-linecap="round"/>`),
};
const cushion = `<svg viewBox="0 0 80 34" width="100%" height="34" preserveAspectRatio="none" aria-hidden="true" style="display:block"><path d="M5 10Q8 2 18 7Q40 2 62 7Q72 2 75 10Q80 30 66 31Q40 35 14 31Q0 30 5 10Z" fill="#c4486c" stroke="#ffd9a8" stroke-width="2"/><path d="M12 13Q40 22 68 13" fill="none" stroke="#ffd9a8" stroke-width="2"/><circle cx="40" cy="22" r="3" fill="#ffd84d"/></svg>`;
const paw = (col) => `<svg viewBox="0 0 24 34" width="20" height="28" aria-hidden="true" style="display:block"><path d="M6 0H18L20 22Q22 32 12 32Q2 32 4 22Z" fill="${col}" stroke="#1b1020" stroke-width="1.4"/><path d="M8 26v5M12 27v5M16 26v5" stroke="#8a5a68" stroke-width="1.3"/></svg>`;

export default function mount(el, api) {
  const slow = !!api.unhurried;
  const calm = !!globalThis.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  const LIVES = slow ? 5 : 3;
  const SPEED = slow ? 9 : 7.5; // lanes per second
  const lanePct = (x) => ((x + 0.5) / LANES) * 100;

  el.innerHTML = `
    <div data-stage style="position:relative;width:100%;max-width:420px;height:312px;margin:0 auto;overflow:hidden;border-radius:14px;background:linear-gradient(#3a2848,#241a30);color:#fff;touch-action:none;user-select:none;-webkit-user-select:none;font:600 13px system-ui,sans-serif">
      <div style="position:absolute;left:8px;right:8px;top:6px;display:flex;justify-content:space-between;gap:6px;z-index:3;text-shadow:0 1px 3px #000">
        <span data-score>0 cups</span><span data-lives></span><span data-time></span>
      </div>
      ${CATS.map(([id], i) => `<div data-cat${i} style="position:absolute;left:${lanePct(i)}%;top:${SHELF - 64}px;width:58px;height:58px;margin-left:-29px;border-radius:29px 29px 0 0;background:radial-gradient(circle at 50% 62%,rgba(255,226,189,.42),rgba(255,226,189,.1) 72%)">${api.svg(id, { size: 58, stage: 1, mood: "happy" })}</div>`).join("")}
      <div style="position:absolute;left:0;right:0;top:${SHELF - 8}px;height:9px;background:#9a6a3e;border-top:2px solid #c89a62;box-shadow:0 5px 8px rgba(0,0,0,.35)"></div>
      <div style="position:absolute;left:0;right:0;top:${FLOOR + 30}px;bottom:0;background:#6a4a34"></div>
      <div data-items></div>
      <div data-cushion style="position:absolute;left:${lanePct(1)}%;top:${FLOOR - 4}px;width:22%;margin-left:-11%;z-index:2">${cushion}</div>
      <div data-cover style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:16px;text-align:center;background:rgba(24,16,34,.9);z-index:4">
        <strong style="font-size:17px">Teacup Rescue</strong>
        <span style="max-width:270px;line-height:1.45">Slide the cushion under falling teacups. Gold cups count double. A caught <span style="color:#d8f080">soggy teabag</span> costs 2 cups. Drop ${LIVES} cups and it is closing time.</span>
        <span style="display:flex;gap:16px;align-items:center"><span>${ART.cup}</span><span>${ART.gold}</span><span>${ART.bag}</span></span>
        <button type="button" class="btn btn-accent" data-start>Start rescuing</button>
        <small style="color:#d8cce8">Drag or tap, or use ← → (A D, or 1 to 4)</small>
      </div>
    </div>
    <p data-say aria-live="polite" style="margin:6px 0 0;text-align:center;min-height:1.4em;color:#ffe8b8;font-weight:600"></p>`;

  const q = (s) => el.querySelector(s);
  const stage = q("[data-stage]"), layer = q("[data-items]"), bed = q("[data-cushion]"), cover = q("[data-cover]"), say = q("[data-say]");
  const cats = CATS.map((_, i) => q(`[data-cat${i}]`));

  let running = false, over = false, dead = false, raf = 0, prev = 0, clock = 0;
  let score = 0, lives = LIVES, x = 1, target = 1, end = 0;
  let queue = [], live = [], fx = [];

  /** The whole run is laid out up front, spaced by landing time so every cup can always be reached. */
  function plan() {
    const first = slow ? 3 : 2.3, last = slow ? 43.5 : 35, list = [];
    const offset = 2 + Math.floor(Math.random() * 4);
    let t = first, lane = 1;
    while (t <= last) {
      const f = (t - first) / (last - first), i = list.length;
      const kind = i % 6 === offset ? "bag" : "cup";
      let next = Math.floor(Math.random() * LANES);
      if (next === lane && Math.random() < 0.8) next = (lane + 1 + Math.floor(Math.random() * (LANES - 1))) % LANES;
      lane = next;
      const tell = (slow ? 0.7 : 0.45) - 0.12 * f;
      const fall = ((slow ? 2.1 : 1.55) - 0.55 * f) * (0.9 + Math.random() * 0.22);
      list.push({ kind, lane, land: t, tell, fall });
      t += (slow ? 1.62 : 1.24) - (slow ? 0.62 : 0.53) * f;
    }
    // Two golden cups, which drop a little faster than the rest.
    for (const frac of [0.38, 0.78]) {
      let i = Math.floor(list.length * frac);
      while (list[i] && list[i].kind !== "cup") i++;
      if (list[i]) Object.assign(list[i], { kind: "gold", fall: list[i].fall * 0.8 });
    }
    return list.sort((a, b) => a.land - a.tell - a.fall - (b.land - b.tell - b.fall));
  }

  function hud() {
    q("[data-score]").textContent = `${score} cups`;
    q("[data-lives]").textContent = `${"♥".repeat(Math.max(0, lives))}${"♡".repeat(Math.max(0, LIVES - lives))}`;
    q("[data-time]").textContent = `${Math.max(0, Math.ceil(end - clock))}s`;
  }

  function node(html, css) {
    const d = document.createElement("div");
    d.style.cssText = `position:absolute;pointer-events:none;${css}`;
    d.innerHTML = html;
    layer.appendChild(d);
    return d;
  }
  const effect = (html, lane, top, ttl, rise = 0) => fx.push({ el: node(html, `left:${lanePct(lane)}%;top:${top}px;transform:translateX(-50%);z-index:3;white-space:nowrap;text-shadow:0 1px 3px #000;font-weight:800;font-size:15px`), top, life: ttl, ttl, rise });

  function spawn(it) {
    it.el = node(ART[it.kind], "width:46px;margin-left:-23px;z-index:1");
    it.paw = node(paw(CATS[it.lane][1]), "width:20px;z-index:2");
    it.el.style.left = `${lanePct(it.lane)}%`;
    it.paw.style.left = `${lanePct(it.lane)}%`;
    it.paw.style.top = `${SHELF - 40}px`;
    live.push(it);
  }

  function resolve(it) {
    it.el.remove();
    it.paw.remove();
    const caught = Math.abs(x - it.lane) < 0.56;
    if (it.kind === "bag") {
      if (caught) {
        score = Math.max(0, score - 2);
        effect(`<span style="color:#d8f080">splat! -2</span>`, it.lane, FLOOR - 26, 0.8, 22);
        say.textContent = "Soggy teabag on the cushion! Two cups lost.";
        api.ping("choice");
      }
      return;
    }
    if (caught) {
      const worth = it.kind === "gold" ? 2 : 1;
      score += worth;
      effect(`<span style="color:${worth > 1 ? "#ffd84d" : "#a8ffb8"}">+${worth}</span>`, it.lane, FLOOR - 26, 0.7, 26);
      say.textContent = worth > 1 ? "Golden teacup saved!" : "";
      api.ping("blip");
    } else {
      lives--;
      effect(ART.crash, it.lane, FLOOR + 4, 0.8);
      say.textContent = lives > 0 ? `Crash! ${lives} to spare.` : "Crash! That was the last one.";
      api.ping("choice");
    }
  }

  function finish() {
    if (over || dead) return;
    over = true;
    running = false;
    globalThis.cancelAnimationFrame(raf);
    for (const it of live) { it.el.remove(); it.paw.remove(); }
    for (const f of fx) f.el.remove();
    live = [];
    fx = [];
    cover.innerHTML = `<strong style="font-size:18px">${lives > 0 ? "Café closed, cups safe!" : "Out of spare cups!"}</strong><span>${score} cups saved</span>${api.svg("cats_ginger", { size: 96, stage: 1, mood: lives > 0 ? "love" : "sad" })}`;
    cover.style.display = "flex";
    globalThis.removeEventListener("keydown", onKey, true);
    api.done(score);
  }

  function frame(now) {
    if (dead) return;
    if (!el.isConnected) return cleanup();
    if (!running) return;
    const dt = prev ? Math.min(0.05, Math.max(0, (now - prev) / 1000)) : 0;
    prev = now;
    clock += dt;
    const step = SPEED * dt;
    x += Math.max(-step, Math.min(step, target - x));
    bed.style.left = `${lanePct(x)}%`;

    while (queue.length && clock >= queue[0].land - queue[0].tell - queue[0].fall) spawn(queue.shift());
    const nudged = [0, 0, 0, 0];
    for (let i = live.length - 1; i >= 0; i--) {
      const it = live[i], left = it.land - clock;
      if (left <= 0) {
        live.splice(i, 1);
        resolve(it);
        continue;
      }
      const rest = SHELF - 45;
      if (left > it.fall) {
        // The tell: a paw reaches down and the cup wobbles on the edge.
        const f = 1 - (left - it.fall) / it.tell;
        nudged[it.lane] = 1;
        it.el.style.top = `${rest}px`;
        it.el.style.transform = calm ? "none" : `rotate(${Math.sin(f * 22) * 13 * f}deg)`;
        it.paw.style.transform = `translate(${-34 + (calm ? 8 : f * 14)}px,${calm ? 4 : f * 8}px) rotate(-38deg)`;
        it.paw.style.display = "block";
      } else {
        const f = 1 - left / it.fall;
        it.el.style.top = `${rest + (FLOOR - 30 - rest) * f ** 1.5}px`;
        it.el.style.transform = calm ? "none" : `rotate(${(it.lane % 2 ? -1 : 1) * Math.sin(f * 5) * 16}deg)`;
        it.paw.style.display = "none";
      }
    }
    if (!calm) cats.forEach((c, i) => (c.style.transform = nudged[i] ? "translateY(5px) rotate(-7deg)" : "none"));
    for (let i = fx.length - 1; i >= 0; i--) {
      const f = fx[i];
      f.life -= dt;
      if (f.life <= 0) {
        f.el.remove();
        fx.splice(i, 1);
        continue;
      }
      if (!calm) {
        f.el.style.top = `${f.top - f.rise * (1 - f.life / f.ttl)}px`;
        f.el.style.opacity = `${Math.min(1, (f.life / f.ttl) * 2)}`;
      }
    }
    hud();
    if (lives <= 0 || (!queue.length && !live.length && clock >= end)) return finish();
    raf = globalThis.requestAnimationFrame(frame);
  }

  function start() {
    if (running || over || dead) return;
    running = true;
    queue = plan();
    end = Math.max(...queue.map((it) => it.land)) + 0.7;
    clock = 0;
    prev = 0;
    cover.style.display = "none";
    say.textContent = "Watch the paws!";
    hud();
    raf = globalThis.requestAnimationFrame(frame);
  }

  function aim(e) {
    if (!running) return;
    const r = stage.getBoundingClientRect();
    if (!r.width) return;
    target = Math.max(0, Math.min(LANES - 1, ((e.clientX - r.left) / r.width) * LANES - 0.5));
  }
  function onDown(e) {
    if (!running) return;
    e.preventDefault?.();
    try { stage.setPointerCapture?.(e.pointerId); } catch { /* the pointer may already be gone */ }
    aim(e);
  }
  function onKey(e) {
    if (!el.isConnected) return cleanup();
    if (e.metaKey || e.ctrlKey || e.altKey || e.key === "Escape" || !running) return;
    const k = e.key.toLowerCase();
    const dir = k === "arrowleft" || k === "a" ? -1 : k === "arrowright" || k === "d" ? 1 : 0;
    // Step from the lane the cushion is heading for, so quick double taps move two lanes.
    if (dir) target = Math.max(0, Math.min(LANES - 1, Math.round(target) + dir));
    else if (/^[1-4]$/.test(k)) target = Number(k) - 1;
    else return;
    e.preventDefault();
    e.stopPropagation();
  }

  function cleanup() {
    if (dead) return;
    dead = true;
    running = false;
    globalThis.cancelAnimationFrame(raf);
    globalThis.removeEventListener("keydown", onKey, true);
    stage.removeEventListener("pointerdown", onDown);
    stage.removeEventListener("pointermove", aim);
    live = [];
    fx = [];
    queue = [];
  }

  q("[data-start]").onclick = start;
  stage.addEventListener("pointerdown", onDown);
  stage.addEventListener("pointermove", aim);
  globalThis.addEventListener("keydown", onKey, true);
  return cleanup;
}
