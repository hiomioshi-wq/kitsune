// The Sunken Deep: walkable underwater realm reached by Diving Bell.
import { characterSvg } from "../vnchar.js";
import { DW, DH, DT as T, DTILE, DEEP_ZONES, DEEP_SPAWN, DEEP_BELL, DEEP_BUILDINGS, DEEP_NPCS, DEEP_LANTERNS, DEEP_FISH, DEEP_GOODS, ensureDeep, buildDeepMap } from "./deepcore.js";

const esc = (x) => String(x).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export function mountDeep(host, api) {
  const s = api.state, dp = ensureDeep(s), map = buildDeepMap(), keys = new Set();
  host.innerHTML = `<canvas class="by-c"></canvas>
    <div class="by-hud sky-hud">
      <strong>🫧 <span id="dp-pr">${dp.pearls}</span> pearls · 🏮 <span id="dp-lt">0</span>/${DEEP_LANTERNS.length}</strong>
      <span id="dp-reg">The Kelp Trench</span>
      <div class="by-btns">
        <button type="button" id="dp-log">Deep Log <kbd>J</kbd></button>
        <button type="button" id="dp-leave">Diving Bell up <kbd>Esc</kbd></button>
      </div>
    </div>
    <button type="button" class="by-prompt" id="dp-prompt" hidden></button>
    <div class="wd-pad by-pad" id="dp-pad"><i></i></div>
    <button type="button" class="wd-act by-act" id="dp-act">E</button>
    <div class="by-toast" id="dp-toast" hidden></div>
    <div class="wd-talk" id="dp-talk" hidden role="dialog" aria-live="polite"></div>
    <section class="by-page" id="dp-page" hidden></section>`;

  const c = host.querySelector(".by-c"), g = c.getContext("2d");
  const promptEl = host.querySelector("#dp-prompt"), toastEl = host.querySelector("#dp-toast");
  const talkEl = host.querySelector("#dp-talk"), pageEl = host.querySelector("#dp-page");

  let px = (DEEP_SPAWN[0] + 0.5) * T, py = (DEEP_SPAWN[1] + 0.5) * T;
  let dir = "down", step = 0, moving = false, alive = true, raf = 0, last = performance.now();
  let cw = 0, ch = 0, zoom = 1.5, target = null, joy = null, pageOff = null, toastT = 0, saveT = 0;
  let sparks = [], fishing = null, fireworks = 0;

  const npcs = DEEP_NPCS.map((n, i) => {
    const svg = characterSvg(n.key, n.look, "calm");
    const img = new Image();
    img.src = "data:image/svg+xml," + encodeURIComponent(svg.replace('width="100%" height="100%"', 'width="300" height="420"'));
    return { ...n, px: (n.x + 0.5) * T, py: (n.y + 0.5) * T, img, tw: i * 1.4, line: 0 };
  });

  const bubbles = Array.from({ length: 48 }, (_, i) => ({
    x: (i * 193) % (DW * T),
    y: (i * 127) % (DH * T),
    r: 2 + (i % 4) * 1.2,
    sp: 18 + (i % 5) * 8,
  }));

  const blocked = (x, y) => [[-9, 2], [9, 2], [-9, 13], [9, 13]].some(([a, b]) => {
    const X = Math.floor((x + a) / T), Y = Math.floor((y + b) / T);
    return X < 0 || Y < 0 || X >= DW || Y >= DH || map.solid[Y * DW + X];
  });

  const sayToast = (t) => { toastEl.textContent = t; toastEl.hidden = false; toastT = performance.now() + 3000; };
  const hud = () => {
    host.querySelector("#dp-pr").textContent = dp.pearls;
    host.querySelector("#dp-lt").textContent = Object.keys(dp.lit).length;
    const zn = DEEP_ZONES.reduce((a, b) => (Math.hypot(px / T - b.cx, py / T - b.cy) < Math.hypot(px / T - a.cx, py / T - a.cy) ? b : a));
    host.querySelector("#dp-reg").textContent = zn.name;
  };
  const burst = (x, y, n = 22) => {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * 6.28, v = 40 + Math.random() * 120;
      sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1, c: ["#7fe0d0", "#9fe8ff", "#fff", "#ff9fd0"][i % 4] });
    }
  };

  const closeTalk = () => { talkEl.hidden = true; talkEl.innerHTML = ""; host.focus({ preventScroll: true }); };
  const closePage = () => {
    if (fishing) { cancelAnimationFrame(fishing.raf); fishing = null; }
    pageOff?.(); pageOff = null; pageEl.hidden = true; pageEl.innerHTML = "";
    api.save(); hud(); host.focus({ preventScroll: true });
  };
  function page(title, html, bind) {
    closeTalk(); pageOff?.(); pageOff = null; pageEl.hidden = false;
    pageEl.innerHTML = `<header><button class="btn" type="button" id="dp-back">Back</button><h2>${esc(title)}</h2><span>🫧 ${dp.pearls} pearls · ${api.mon()} mon</span></header><div class="by-body">${html}</div>`;
    pageEl.querySelector("#dp-back").onclick = closePage;
    pageOff = bind?.(pageEl) || null;
    api.ping("open");
  }

  function say(npc, text, btns = []) {
    closePage();
    const list = [...btns, ["Goodbye", closeTalk]];
    talkEl.hidden = false;
    api.ping("blip");
    talkEl.innerHTML = `${npc ? `<div class="wd-face">${characterSvg(npc.key, npc.look, /!/.test(text) ? "happy" : "calm")}</div>` : ""}<div class="wd-say">${npc ? `<strong>${esc(npc.name)}</strong>` : ""}<p>${esc(text)}</p><div class="wd-opts">${list.map(([l], i) => `<button class="btn${i === 0 && list.length > 1 ? " btn-accent" : ""}" type="button" data-o="${i}"><kbd>${i + 1}</kbd> ${esc(l)}</button>`).join("")}</div></div>`;
    talkEl.querySelectorAll("[data-o]").forEach((b) => (b.onclick = () => list[+b.dataset.o][1]()));
    talkEl.querySelector("[data-o]")?.focus({ preventScroll: true });
  }

  function lightLantern(l) {
    if (dp.lit[l.id]) return sayToast(`${l.name} is already lit.`);
    if (!l.check(dp)) return say(null, `${l.name} is dark. ${l.desc}`);
    dp.lit[l.id] = 1;
    api.addMon(140);
    dp.pearls += 2;
    api.ping("done");
    burst((l.x + 0.5) * T, (l.y + 0.5) * T, 42);
    let msg = `${l.name} flares blue-green! (+140 mon, +2 pearls)`;
    if (DEEP_LANTERNS.every((q) => dp.lit[q.id]) && !dp.phosphor) {
      dp.phosphor = 1;
      fireworks = 10;
      api.addMon(600);
      api.giveHat("divehelm");
      api.giveFurn("coralthrone");
      msg = `All ${DEEP_LANTERNS.length} Sunken Lanterns burn! The Phosphor Tide awakens. (+600 mon, Abyssal Diver's Helm & Coral Throne)`;
    }
    api.save(); hud(); sayToast(msg);
  }

  function pearlShop() {
    page("Flooded Stacks · Pearl Exchange", `<p class="muted">Coralia trades Sea Pearls and mon for abyssal gear.</p><div class="by-list">${DEEP_GOODS.map((it) => {
      const own = it.kind === "hat" ? s.hats.includes(it.key) : it.kind === "tonic" ? dp.tonic : it.kind === "furn" ? !!s.furn?.[it.key] : false;
      const can = dp.pearls >= it.pearls && api.mon() >= it.mon && !own;
      return `<div><i>${it.kind === "hat" ? "🤿" : it.kind === "furn" ? "🪑" : "🫧"}</i><span><strong>${esc(it.name)}</strong><small>${esc(it.desc)} · ${it.pearls} pearls, ${it.mon} mon</small></span>${own ? "<em>Owned</em>" : `<button class="btn btn-accent" type="button" data-buy="${it.id}" ${can ? "" : "disabled"}>Trade</button>`}</div>`;
    }).join("")}</div>`, (e) => {
      e.querySelectorAll("[data-buy]").forEach((b) => (b.onclick = () => {
        const it = DEEP_GOODS.find((q) => q.id === b.dataset.buy);
        if (!it || dp.pearls < it.pearls || api.mon() < it.mon) return;
        dp.pearls -= it.pearls;
        api.addMon(-it.mon);
        if (it.kind === "hat") api.giveHat(it.key);
        else if (it.kind === "furn") api.giveFurn(it.key);
        else if (it.kind === "tonic") dp.tonic = 1;
        api.ping("done"); api.save(); hud(); pearlShop();
      }));
    });
  }

  function valvesGame() {
    const VALVES = [["vent1", "North Vent"], ["vent2", "East Vent"], ["vent3", "Deep Vent"]];
    let cur = VALVES[0][0];
    let bars = [35, 65, 20];
    const ok = () => bars.every((v) => v >= 45 && v <= 55);
    const paint = (e) => {
      e.querySelector("#dp-vbars").innerHTML = bars.map((v, i) => `<div style="margin:8px 0"><small>Chamber ${i + 1}: ${v}% (Target 45–55%)</small><div style="height:12px;background:#162436;border-radius:6px;overflow:hidden"><div style="width:${v}%;height:100%;background:${v >= 45 && v <= 55 ? "#7dff8a" : "#7fe0d0"}"></div></div></div>`).join("");
      e.querySelector("#dp-vmsg").textContent = ok() ? `${VALVES.find((q) => q[0] === cur)[1]} balanced!` : "Adjust the three valves until all chambers sit between 45% and 55%.";
    };
    page("Anemone Conservatory · Pressure Valves", `<div class="chips">${VALVES.map(([id, n]) => `<button class="chip${id === cur ? " on" : ""}" type="button" data-v="${id}">${dp.valves[id] ? "✓ " : ""}${n}</button>`).join("")}</div>
      <div id="dp-vbars"></div><p id="dp-vmsg" class="muted"></p>
      <div class="sky-rings"><button class="btn" type="button" data-step="0">Turn Valve A (+15 / -10 / +5)</button><button class="btn" type="button" data-step="1">Turn Valve B (-10 / +15 / -5)</button><button class="btn" type="button" data-step="2">Turn Valve C (+5 / -5 / +15)</button></div>`, (e) => {
      paint(e);
      e.querySelectorAll("[data-v]").forEach((b) => (b.onclick = () => { cur = b.dataset.v; bars = [35, 65, 20]; e.querySelectorAll("[data-v]").forEach((q) => q.classList.toggle("on", q.dataset.v === cur)); paint(e); }));
      const deltas = [[15, -10, 5], [-10, 15, -5], [5, -5, 15]];
      e.querySelectorAll("[data-step]").forEach((b) => (b.onclick = () => {
        if (ok()) return;
        const d = deltas[+b.dataset.step];
        bars = bars.map((v, i) => Math.max(5, Math.min(95, v + d[i])));
        api.ping("blip"); paint(e);
        if (ok()) {
          const fresh = !dp.valves[cur];
          dp.valves[cur] = 1;
          if (fresh) { api.addMon(85); dp.pearls += 2; sayToast("Valve balanced! (+85 mon, +2 pearls)"); }
          api.ping("done"); api.save(); hud();
          e.querySelector(`[data-v="${cur}"]`).textContent = "✓ " + VALVES.find((q) => q[0] === cur)[1];
        }
      }));
    });
  }

  function sonarTrial() {
    const TONES = [["Kelp", "#67d6a4"], ["Trench", "#5ab0ff"], ["Coral", "#ff8a8a"], ["Abyss", "#b58cff"]];
    let round = 1, seq = [], idx = 0, locked = true, timer = 0;
    const nextRound = (e) => {
      seq = Array.from({ length: round + 2 }, () => Math.floor(Math.random() * 4));
      idx = 0; locked = true;
      const msg = e.querySelector("#dp-smsg");
      if (msg) msg.textContent = `Echo ${round}/3: Watch the sonar pulses…`;
      let stepI = 0;
      const playStep = () => {
        if (!e.isConnected) return;
        e.querySelectorAll("[data-sn]").forEach((b) => b.classList.remove("lit"));
        if (stepI >= seq.length) { locked = false; if (msg) msg.textContent = `Repeat ${seq.length} sonar pulses!`; return; }
        const btn = e.querySelector(`[data-sn="${seq[stepI]}"]`);
        btn?.classList.add("lit"); api.ping("blip"); stepI++;
        timer = setTimeout(() => { btn?.classList.remove("lit"); timer = setTimeout(playStep, 220); }, 420);
      };
      timer = setTimeout(playStep, 450);
    };
    page("Leviathan's Arch · Sonar Echo", `<p id="dp-smsg" class="muted">Repeat the sonar echo sequence.</p>
      <div class="sky-chimes">${TONES.map(([n, c], i) => `<button type="button" data-sn="${i}" style="--cc:${c}"><strong>${n}</strong></button>`).join("")}</div>`, (e) => {
      nextRound(e);
      e.querySelectorAll("[data-sn]").forEach((b) => (b.onclick = () => {
        if (locked) return;
        const pick = +b.dataset.sn;
        b.classList.add("lit"); setTimeout(() => b.classList.remove("lit"), 220);
        if (pick !== seq[idx]) { api.ping("close"); e.querySelector("#dp-smsg").textContent = "Echo lost! Restarting from Echo 1."; round = 1; nextRound(e); return; }
        api.ping("choice"); idx++;
        if (idx >= seq.length) {
          if (round >= 3) {
            const fresh = !dp.sonarWon; dp.sonarWon = 1;
            api.addMon(fresh ? 160 : 45);
            if (fresh) api.giveHat("coralcrown");
            api.ping("done"); api.save(); hud();
            e.querySelector("#dp-smsg").textContent = fresh ? "The Gate answers your sonar! (+160 mon & Coral Crown)" : "Clean echo! (+45 mon)";
            locked = true;
          } else { round++; nextRound(e); }
        }
      }));
      return () => clearTimeout(timer);
    });
  }

  function deepFishGame() {
    const pool = DEEP_FISH, total = pool.reduce((a, f) => a + 1 / f[2], 0);
    let r = Math.random() * total, fish = pool[0];
    for (const f of pool) { r -= 1 / f[2]; if (r <= 0) { fish = f; break; } }
    page("Trench Fishing", `<div class="wd-fishing"><p id="wf-msg">Your line sinks into the trench…</p><div class="wf-bar" hidden><i id="wf-zone"></i><b id="wf-mark"></b></div><button class="btn btn-accent" type="button" id="wf-go"><kbd>E</kbd> Waiting…</button></div>`, (p) => {
      const msg = p.querySelector("#wf-msg"), bar = p.querySelector(".wf-bar"), zoneEl = p.querySelector("#wf-zone"), mark = p.querySelector("#wf-mark"), go = p.querySelector("#wf-go");
      const F = fishing = { phase: "wait", raf: 0, t0: performance.now(), biteAt: 900 + Math.random() * 2200 };
      const width = Math.min(0.8, fish[3]), left = 0.1 + Math.random() * (0.8 - width);
      let pos = 0;
      const again = () => { go.textContent = "Cast again"; go.onclick = deepFishGame; F.phase = "over"; };
      const hit = () => {
        if (F.phase === "wait") { msg.textContent = "Too soon!"; api.ping("blip"); again(); }
        else if (F.phase === "bite") { F.phase = "reel"; bar.hidden = false; zoneEl.style.left = left * 100 + "%"; zoneEl.style.width = width * 100 + "%"; msg.textContent = "Stop the marker in the gold!"; go.innerHTML = "<kbd>E</kbd> Reel in"; F.t0 = performance.now(); }
        else if (F.phase === "reel") {
          if (pos >= left && pos <= left + width) {
            dp.caught++; dp.fish[fish[0]] = (dp.fish[fish[0]] || 0) + 1;
            api.addMon(fish[2]); api.save(); hud(); api.ping("done");
            msg.innerHTML = `You caught: <strong>${esc(fish[1])}</strong> (+${fish[2]} mon)`;
          } else { api.ping("blip"); msg.textContent = "It slipped into the dark."; }
          again();
        } else if (F.phase === "over") go.click();
      };
      F.hit = hit; go.onclick = hit;
      const tick = (now) => {
        if (fishing !== F || F.phase === "over") return;
        if (F.phase === "wait" && now - F.t0 > F.biteAt) { F.phase = "bite"; F.t0 = now; msg.textContent = "A tug from below!"; go.innerHTML = "<kbd>E</kbd> Strike!"; api.ping("choice"); }
        else if (F.phase === "bite" && now - F.t0 > 1400) { msg.textContent = "It took the bait."; again(); return; }
        else if (F.phase === "reel") { pos = (Math.sin((now - F.t0) / (260 + width * 900) - 1.57) + 1) / 2; mark.style.left = pos * 100 + "%"; }
        F.raf = requestAnimationFrame(tick);
      };
      F.raf = requestAnimationFrame(tick);
    });
  }

  function deepLog() {
    page("Deep Log", `<h3>Sunken Lanterns (${Object.keys(dp.lit).length}/${DEEP_LANTERNS.length})</h3>
      <ol class="wd-list">${DEEP_LANTERNS.map((l) => `<li class="${dp.lit[l.id] ? "ok" : ""}"><strong>${esc(l.name)}</strong><span>${dp.lit[l.id] ? "Lit" : l.need}</span></li>`).join("")}</ol>
      <h3>Abyssal Fish (${Object.keys(dp.fish).length}/${DEEP_FISH.length})</h3>
      <ol class="wd-list">${DEEP_FISH.map((f) => `<li class="${dp.fish[f[0]] ? "ok" : ""}"><strong>${dp.fish[f[0]] ? esc(f[1]) : "???"}</strong><span>${dp.fish[f[0]] ? `${dp.fish[f[0]]} caught · ${f[2]} mon` : "Trench edge"}</span></li>`).join("")}</ol>
      <h3>Fast Travel</h3>
      <div class="chips">${DEEP_ZONES.map((z) => `<button class="chip" type="button" data-go="${z.id}">${esc(z.name)}</button>`).join("")}</div>`, (e) => {
      e.querySelectorAll("[data-go]").forEach((b) => (b.onclick = () => {
        const z = DEEP_ZONES.find((q) => q.id === b.dataset.go);
        if (z) { px = (z.cx + 0.5) * T; py = (z.cy + 1.5) * T; }
        closePage();
      }));
    });
  }

  function talkNpc(n) {
    const btns = [];
    if (n.id === "coralia") btns.push(["Open Pearl Exchange", pearlShop]);
    if (n.id === "lumen") btns.push(["Balance Pressure Valves", valvesGame]);
    if (n.id === "nautilus") btns.push(["Play Sonar Echo Trial", sonarTrial]);
    say(n, n.lines[n.line++ % n.lines.length], btns);
  }

  const facingAbyss = () => {
    const [a, b] = { up: [0, -26], down: [0, 34], left: [-28, 8], right: [28, 8] }[dir];
    const x = Math.floor((px + a) / T), y = Math.floor((py + b) / T);
    return x >= 0 && y >= 0 && x < DW && y < DH && map.g[y * DW + x] === DTILE.abyss;
  };

  function findTarget() {
    if (Math.hypot((DEEP_BELL[0] + 0.5) * T - px, (DEEP_BELL[1] + 0.5) * T - py) < 52) return { label: "Take Diving Bell up", go: leave };
    for (const n of npcs) if (Math.hypot(n.px - px, n.py - py) < 50) return { label: `Talk to ${n.name}`, go: () => talkNpc(n) };
    for (const l of DEEP_LANTERNS) if (Math.hypot((l.x + 0.5) * T - px, (l.y + 0.5) * T - py) < 48) return { label: dp.lit[l.id] ? `${l.name} (Lit)` : `Light ${l.name}`, go: () => lightLantern(l) };
    for (const b of DEEP_BUILDINGS) {
      const dx = (b.x + b.w / 2) * T, dy = (b.y + b.h + 0.4) * T;
      if (Math.hypot(dx - px, dy - py) < 46) {
        if (b.id === "sunkenannex") return { label: "Enter Flooded Stacks", go: pearlShop };
        if (b.id === "gardendome") return { label: "Balance Pressure Valves", go: valvesGame };
        if (b.id === "gatearch") return { label: "Play Sonar Echo Trial", go: sonarTrial };
        if (b.id === "moonshrine") return { label: "Read Moonwell Shrine", go: deepLog };
        return { label: "Read Trench Outpost", go: deepLog };
      }
    }
    if (facingAbyss()) return { label: "Trench-Fish here", go: deepFishGame };
    return null;
  }

  const leave = () => { if (!alive) return; alive = false; cleanup(); api.save(); api.leave(); };
  const act = () => { if (fishing?.hit) return fishing.hit(); if (pageEl.hidden && talkEl.hidden && target) target.go(); };

  function update(dt, now) {
    let ax = 0, ay = 0;
    if (pageEl.hidden && talkEl.hidden) {
      if (keys.has("a") || keys.has("arrowleft")) ax--;
      if (keys.has("d") || keys.has("arrowright")) ax++;
      if (keys.has("w") || keys.has("arrowup")) ay--;
      if (keys.has("s") || keys.has("arrowdown")) ay++;
      if (joy && Math.hypot(joy.x, joy.y) > 0.18) { ax = joy.x; ay = joy.y; }
    }
    moving = !!(ax || ay);
    if (moving) {
      const m = Math.max(1, Math.hypot(ax, ay));
      const v = (keys.has("shift") ? 275 : 180) * (dp.tonic ? 1.15 : 1) * dt;
      const nx = px + (ax / m) * v, ny = py + (ay / m) * v;
      if (!blocked(nx, py)) px = nx;
      if (!blocked(px, ny)) py = ny;
      dir = Math.abs(ax) > Math.abs(ay) ? (ax < 0 ? "left" : "right") : ay < 0 ? "up" : "down";
      step += dt * 13;
    }
    for (const pr of map.pearls) {
      if (!dp.picked[pr.id] && Math.hypot((pr.x + 0.5) * T - px, (pr.y + 0.5) * T - py) < 26) {
        dp.picked[pr.id] = 1; dp.pearls++; api.addMon(5); api.ping("blip");
        burst((pr.x + 0.5) * T, (pr.y + 0.5) * T, 10); hud();
      }
    }
    for (const bu of bubbles) { bu.y -= bu.sp * dt; if (bu.y < -20) bu.y = DH * T + 20; }
    if (fireworks > 0) { fireworks -= dt; if (Math.random() < dt * 3) burst(px + (Math.random() - 0.5) * 400, py - 120 + Math.random() * 140, 24); }
    for (const p of sparks) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 90 * dt; p.life -= dt * 1.15; }
    sparks = sparks.filter((p) => p.life > 0);
    if (toastT && now > toastT) { toastEl.hidden = true; toastT = 0; }
    if (pageEl.hidden && talkEl.hidden) {
      const nt = findTarget();
      if (nt?.label !== target?.label) { promptEl.hidden = !nt; if (nt) promptEl.innerHTML = `<kbd>E</kbd> ${esc(nt.label)}`; }
      target = nt;
    } else { promptEl.hidden = true; target = null; }
    if ((saveT += dt) > 6) { saveT = 0; api.save(); }
  }

  const TC = { [DTILE.sand]: ["#2b5a6e", "#265164"], [DTILE.kelp]: ["#244d58", "#1f444f"], [DTILE.ruin]: ["#3a4b5c", "#334354"], [DTILE.bridge]: ["#5a7a78", "#4e6d6b"], [DTILE.coral]: ["#3f5a6a", "#364f5e"], [DTILE.vent]: ["#2f5e64", "#285258"], [DTILE.rock]: ["#244d58", "#1f444f"] };

  function frame(now) {
    if (!alive) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    update(dt, now);
    const vw = cw / zoom, vh = ch / zoom;
    const camX = Math.max(0, Math.min(DW * T - vw, px - vw / 2));
    const camY = Math.max(0, Math.min(DH * T - vh, py - vh / 2));

    g.setTransform(1, 0, 0, 1, 0, 0);
    const bg = g.createLinearGradient(0, 0, 0, ch);
    bg.addColorStop(0, dp.phosphor ? "#08293a" : "#061826");
    bg.addColorStop(1, dp.phosphor ? "#124258" : "#0b2a3c");
    g.fillStyle = bg; g.fillRect(0, 0, cw, ch);

    g.scale(zoom, zoom); g.translate(-Math.round(camX), -Math.round(camY));
    const x0 = Math.max(0, Math.floor(camX / T)), x1 = Math.min(DW - 1, Math.ceil((camX + vw) / T));
    const y0 = Math.max(0, Math.floor(camY / T)), y1 = Math.min(DH - 1, Math.ceil((camY + vh) / T));
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const v = map.g[y * DW + x];
        if (v === DTILE.abyss) continue;
        if (y + 1 < DH && map.g[(y + 1) * DW + x] === DTILE.abyss) {
          g.fillStyle = "#122634"; g.fillRect(x * T, (y + 1) * T, T + 0.5, 14);
        }
        g.fillStyle = TC[v][(x + y) % 2];
        g.fillRect(x * T, y * T, T + 0.5, T + 0.5);
        if (v === DTILE.coral) { g.fillStyle = (x + y) % 2 ? "#ff8a9a" : "#7fe0d0"; g.beginPath(); g.arc(x * T + 16, y * T + 16, 4, 0, 7); g.fill(); }
      }
    }

    const things = [];
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        if (map.g[y * DW + x] === DTILE.rock) {
          const rx = (x + 0.5) * T, ry = (y + 0.5) * T;
          things.push([ry + 12, () => {
            g.fillStyle = "#486074"; g.beginPath(); g.moveTo(rx - 14, ry + 12); g.lineTo(rx - 5, ry - 12); g.lineTo(rx + 8, ry - 6); g.lineTo(rx + 14, ry + 12); g.closePath(); g.fill();
          }]);
        }
      }
    }
    for (const b of DEEP_BUILDINGS) {
      const bx = b.x * T, by = b.y * T, bw = b.w * T, bh = b.h * T;
      things.push([by + bh, () => {
        g.fillStyle = "#3a4f5e"; g.fillRect(bx, by + bh * 0.35, bw, bh * 0.65);
        g.fillStyle = b.roof; g.beginPath(); g.moveTo(bx - 8, by + bh * 0.38); g.lineTo(bx + bw * 0.16, by); g.lineTo(bx + bw * 0.84, by); g.lineTo(bx + bw + 8, by + bh * 0.38); g.closePath(); g.fill();
        g.strokeStyle = "#111c26"; g.lineWidth = 2.5; g.stroke(); g.strokeRect(bx, by + bh * 0.35, bw, bh * 0.65);
        g.fillStyle = "#14222e"; g.fillRect(bx + bw / 2 - 11, by + bh - 34, 22, 34);
        g.font = "800 10.5px system-ui"; g.textAlign = "center";
        const tw = g.measureText(b.name).width + 10;
        g.fillStyle = "rgba(8,18,28,.9)"; g.fillRect(bx + bw / 2 - tw / 2, by - 16, tw, 15);
        g.fillStyle = "#b8fff0"; g.fillText(b.name, bx + bw / 2, by - 5);
      }]);
    }
    // Diving Bell
    {
      const dx = (DEEP_BELL[0] - 0.6) * T, dy = (DEEP_BELL[1] + 0.2) * T, bob = Math.sin(now / 520) * 3;
      things.push([dy + 20, () => {
        g.strokeStyle = "#8a9aa8"; g.lineWidth = 2; g.beginPath(); g.moveTo(dx, dy - 70); g.lineTo(dx, dy - 26 + bob); g.stroke();
        g.fillStyle = "#c79a2e"; g.strokeStyle = "#1b1d33"; g.beginPath(); g.arc(dx, dy - 6 + bob, 20, Math.PI, 0); g.lineTo(dx + 22, dy + 14 + bob); g.lineTo(dx - 22, dy + 14 + bob); g.closePath(); g.fill(); g.stroke();
        g.fillStyle = "#9fe8ff"; g.beginPath(); g.arc(dx, dy - 4 + bob, 7, 0, 7); g.fill();
      }]);
    }
    for (const l of DEEP_LANTERNS) {
      const lx = (l.x + 0.5) * T, ly = (l.y + 0.5) * T, on = !!dp.lit[l.id];
      things.push([ly + 12, () => {
        g.fillStyle = "#2c3f4e"; g.fillRect(lx - 4, ly - 24, 8, 36);
        g.fillStyle = on ? "#7fe8d0" : "#4a5a68"; g.beginPath(); g.arc(lx, ly - 26, 9, 0, 7); g.fill();
        if (on) { g.fillStyle = "rgba(127,232,208,.25)"; g.beginPath(); g.arc(lx, ly - 26, 22 + Math.sin(now / 260) * 3, 0, 7); g.fill(); }
      }]);
    }
    for (const pr of map.pearls) {
      if (dp.picked[pr.id]) continue;
      const sx = (pr.x + 0.5) * T, sy = (pr.y + 0.5) * T, bob = Math.sin(now / 380 + pr.id) * 2.5;
      things.push([sy, () => {
        g.fillStyle = "rgba(180,245,255,.28)"; g.beginPath(); g.arc(sx, sy + bob, 9, 0, 7); g.fill();
        g.fillStyle = "#f6f8ff"; g.beginPath(); g.arc(sx, sy + bob, 5, 0, 7); g.fill();
      }]);
    }
    for (const n of npcs) {
      things.push([n.py + 13, () => {
        const b = Math.sin(now / 620 + n.tw) * 1.2;
        g.fillStyle = "rgba(0,0,0,.22)"; g.beginPath(); g.ellipse(n.px, n.py + 14, 14, 5, 0, 0, 7); g.fill();
        if (n.img.complete && n.img.naturalWidth) g.drawImage(n.img, n.px - 25, n.py - 54 + b, 50, 70);
      }]);
    }
    things.push([py + 14, () => api.drawFox(g, px, py, dir, step, api.fur, api.tails, s.hat, now, moving)]);
    things.sort((a, b) => a[0] - b[0]);
    for (const t of things) t[1]();
    for (const bu of bubbles) {
      if (bu.x > camX - 20 && bu.x < camX + vw + 20 && bu.y > camY - 20 && bu.y < camY + vh + 20) {
        g.strokeStyle = "rgba(190,245,255,.38)"; g.lineWidth = 1.2;
        g.beginPath(); g.arc(bu.x, bu.y, bu.r, 0, 7); g.stroke();
      }
    }
    for (const p of sparks) { g.globalAlpha = Math.max(0, p.life); g.fillStyle = p.c; g.fillRect(p.x - 2, p.y - 2, 4, 4); }
    g.globalAlpha = 1;
    raf = requestAnimationFrame(frame);
  }

  const resize = () => {
    const r = host.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
    cw = Math.max(1, r.width * dpr); ch = Math.max(1, r.height * dpr);
    c.width = cw; c.height = ch; zoom = (r.width < 640 ? 1.25 : 1.5) * dpr;
  };
  const ro = new ResizeObserver(resize); ro.observe(host); resize();

  const onDown = (e) => {
    if (!host.isConnected || document.querySelector(".modal") || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key.toLowerCase(); e.stopPropagation();
    if (k === "escape") { e.preventDefault(); if (!pageEl.hidden) closePage(); else if (!talkEl.hidden) closeTalk(); else leave(); return; }
    if (fishing && (k === "e" || k === " " || k === "enter")) { e.preventDefault(); if (!e.repeat) fishing.hit(); return; }
    if (!talkEl.hidden) { if (/^[1-9]$/.test(k)) { e.preventDefault(); talkEl.querySelectorAll("[data-o]")[+k - 1]?.click(); } else if (k === "e") { e.preventDefault(); if (!e.repeat) talkEl.querySelector("[data-o]")?.click(); } return; }
    if (!pageEl.hidden) { if (k === "j") { e.preventDefault(); closePage(); } return; }
    if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright", "shift"].includes(k)) { e.preventDefault(); keys.add(k); return; }
    if (e.repeat) return;
    if (k === "e" || k === " " || k === "enter") { e.preventDefault(); act(); }
    else if (k === "j") deepLog();
  };
  const onUp = (e) => keys.delete(e.key.toLowerCase()), onBlur = () => keys.clear();
  window.addEventListener("keydown", onDown, true); window.addEventListener("keyup", onUp, true); window.addEventListener("blur", onBlur);

  const pad = host.querySelector("#dp-pad"), knob = pad.querySelector("i");
  pad.onpointerdown = (e) => { pad.setPointerCapture(e.pointerId); joy = { x: 0, y: 0 }; pad.onpointermove(e); };
  pad.onpointermove = (e) => { if (!joy) return; const r = pad.getBoundingClientRect(), x = (e.clientX - r.left - r.width / 2) / (r.width / 2), y = (e.clientY - r.top - r.height / 2) / (r.height / 2), m = Math.max(1, Math.hypot(x, y)); joy = { x: x / m, y: y / m }; knob.style.transform = `translate(${joy.x * 30}px,${joy.y * 30}px)`; };
  pad.onpointerup = pad.onpointercancel = () => { joy = null; knob.style.transform = ""; };

  host.querySelector("#dp-act").onclick = act;
  promptEl.onclick = act;
  host.querySelector("#dp-log").onclick = deepLog;
  host.querySelector("#dp-leave").onclick = leave;

  function cleanup() {
    cancelAnimationFrame(raf); ro.disconnect();
    if (fishing) cancelAnimationFrame(fishing.raf);
    window.removeEventListener("keydown", onDown, true); window.removeEventListener("keyup", onUp, true); window.removeEventListener("blur", onBlur);
  }
  hud(); host.focus({ preventScroll: true }); raf = requestAnimationFrame(frame);
  return () => { alive = false; cleanup(); };
}
