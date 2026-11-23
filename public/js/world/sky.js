// The Skyward Isles: walkable floating archipelago reached by Starlight Airship.
import { characterSvg } from "../vnchar.js";
import { SW, SH, ST as T, STILE, SKY_ISLANDS, SKY_SPAWN, SKY_DOCK, SKY_BUILDINGS, SKY_NPCS, SKY_BELLS, SKY_FISH, CONSTELLATIONS, SKY_GOODS, ensureSky, buildSkyMap } from "./skycore.js";

const esc = (x) => String(x).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export function mountSky(host, api) {
  const s = api.state, sk = ensureSky(s), map = buildSkyMap(), keys = new Set();
  host.innerHTML = `<canvas class="by-c"></canvas>
    <div class="by-hud sky-hud">
      <strong>✦ <span id="sky-sh">${sk.shards}</span> shards · 🔔 <span id="sky-bl">0</span>/${SKY_BELLS.length}</strong>
      <span id="sky-reg">Galeharbor</span>
      <div class="by-btns">
        <button type="button" id="sky-log">Sky Log <kbd>J</kbd></button>
        <button type="button" id="sky-leave">Airship home <kbd>Esc</kbd></button>
      </div>
    </div>
    <button type="button" class="by-prompt" id="sky-prompt" hidden></button>
    <div class="wd-pad by-pad" id="sky-pad"><i></i></div>
    <button type="button" class="wd-act by-act" id="sky-act">E</button>
    <div class="by-toast" id="sky-toast" hidden></div>
    <div class="wd-talk" id="sky-talk" hidden role="dialog" aria-live="polite"></div>
    <section class="by-page" id="sky-page" hidden></section>`;

  const c = host.querySelector(".by-c"), g = c.getContext("2d");
  const promptEl = host.querySelector("#sky-prompt"), toastEl = host.querySelector("#sky-toast");
  const talkEl = host.querySelector("#sky-talk"), pageEl = host.querySelector("#sky-page");

  let px = (SKY_SPAWN[0] + 0.5) * T, py = (SKY_SPAWN[1] + 0.5) * T;
  let dir = "down", step = 0, moving = false, alive = true, raf = 0, last = performance.now();
  let cw = 0, ch = 0, zoom = 1.5, target = null, joy = null, pageOff = null, toastT = 0, saveT = 0;
  let sparks = [], fishing = null, fireworks = 0;

  const npcs = SKY_NPCS.map((n, i) => {
    const svg = characterSvg(n.key, n.look, "calm");
    const img = new Image();
    img.src = "data:image/svg+xml," + encodeURIComponent(svg.replace('width="100%" height="100%"', 'width="300" height="420"'));
    return { ...n, px: (n.x + 0.5) * T, py: (n.y + 0.5) * T, img, tw: i * 1.4, line: 0 };
  });

  const stars = Array.from({ length: 140 }, (_, i) => ({
    x: ((i * 197) % 1000) / 1000,
    y: ((i * 313) % 1000) / 1000,
    r: 0.8 + (i % 3) * 0.7,
    p: i * 0.9,
  }));
  const clouds = Array.from({ length: 18 }, (_, i) => ({
    x: (i * 173) % (SW * T),
    y: (i * 109) % (SH * T),
    w: 90 + (i % 4) * 45,
    sp: 8 + (i % 5) * 4,
  }));

  const blocked = (x, y) => [[-9, 2], [9, 2], [-9, 13], [9, 13]].some(([a, b]) => {
    const X = Math.floor((x + a) / T), Y = Math.floor((y + b) / T);
    return X < 0 || Y < 0 || X >= SW || Y >= SH || map.solid[Y * SW + X];
  });

  const sayToast = (t) => { toastEl.textContent = t; toastEl.hidden = false; toastT = performance.now() + 3000; };
  const hud = () => {
    host.querySelector("#sky-sh").textContent = sk.shards;
    host.querySelector("#sky-bl").textContent = Object.keys(sk.bells).length;
    const isl = SKY_ISLANDS.reduce((a, b) => (Math.hypot(px / T - b.cx, py / T - b.cy) < Math.hypot(px / T - a.cx, py / T - a.cy) ? b : a));
    host.querySelector("#sky-reg").textContent = isl.name;
  };
  const burst = (x, y, n = 22) => {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * 6.28, v = 40 + Math.random() * 120;
      sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1, c: ["#ffd27a", "#9fe0ff", "#fff", "#ff9fd0"][i % 4] });
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
    pageEl.innerHTML = `<header><button class="btn" type="button" id="sky-back">Back</button><h2>${esc(title)}</h2><span>✦ ${sk.shards} shards · ${api.mon()} mon</span></header><div class="by-body">${html}</div>`;
    pageEl.querySelector("#sky-back").onclick = closePage;
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

  function ringBell(bell) {
    if (sk.bells[bell.id]) return sayToast(`${bell.name} is already ringing clear.`);
    if (!bell.check(sk)) return say(null, `${bell.name} is silent. ${bell.desc}`);
    sk.bells[bell.id] = 1;
    api.addMon(120);
    sk.shards += 2;
    api.ping("done");
    burst((bell.x + 0.5) * T, (bell.y + 0.5) * T, 42);
    let msg = `${bell.name} rings across the clouds! (+120 mon, +2 shards)`;
    if (SKY_BELLS.every((b) => sk.bells[b.id]) && !sk.aurora) {
      sk.aurora = 1;
      fireworks = 10;
      api.addMon(500);
      api.giveHat("skycaptain");
      api.giveFurn("orrery");
      msg = "All four Wind-Bells answer together! The Aurora returns to the sky. (+500 mon, Sky Captain's cap & Brass Orrery)";
    }
    api.save(); hud(); sayToast(msg);
  }

  function loomShop() {
    page("The Cloud Loom", `<p class="muted">Loomis weaves Star-Shards and mon into sky-born wares.</p><div class="by-list">${SKY_GOODS.map((it) => {
      const own = it.kind === "hat" ? s.hats.includes(it.key) : it.kind === "tonic" ? sk.tonic : false;
      const can = sk.shards >= it.shards && api.mon() >= it.mon && !own;
      return `<div><i>${it.kind === "hat" ? "🎩" : it.kind === "furn" ? "🪑" : "✨"}</i><span><strong>${esc(it.name)}</strong><small>${esc(it.desc)} · ${it.shards} shards, ${it.mon} mon</small></span>${own ? "<em>Owned</em>" : `<button class="btn btn-accent" type="button" data-buy="${it.id}" ${can ? "" : "disabled"}>Weave</button>`}</div>`;
    }).join("")}</div>`, (e) => {
      e.querySelectorAll("[data-buy]").forEach((b) => (b.onclick = () => {
        const it = SKY_GOODS.find((q) => q.id === b.dataset.buy);
        if (!it || sk.shards < it.shards || api.mon() < it.mon) return;
        sk.shards -= it.shards;
        api.addMon(-it.mon);
        if (it.kind === "hat") api.giveHat(it.key);
        else if (it.kind === "furn") api.giveFurn(it.key);
        else if (it.kind === "tonic") sk.tonic = 1;
        api.ping("done"); api.save(); hud(); loomShop();
      }));
    });
  }

  function telescope(cid = CONSTELLATIONS[0].id) {
    const con = CONSTELLATIONS.find((x) => x.id === cid) || CONSTELLATIONS[0];
    let rings = [1, 2, 3].map((i) => ((con.id.charCodeAt(0) * i + i * 2) % 7) + 1);
    const aligned = () => rings.every((r) => r === 0);
    const draw = (e) => {
      const svg = e.querySelector("#sky-scope");
      if (!svg) return;
      const pts = con.pts.map(([x, y], i) => {
        const ring = i % 3;
        const a = (rings[ring] * Math.PI) / 4;
        return [120 + x * Math.cos(a) - y * Math.sin(a), 100 + x * Math.sin(a) + y * Math.cos(a)];
      });
      const ok = aligned();
      svg.innerHTML = `<circle cx="120" cy="100" r="88" fill="#090c20" stroke="#4f5f9a" stroke-width="2"/>
        ${[32, 56, 80].map((r, i) => `<circle cx="120" cy="100" r="${r}" fill="none" stroke="${rings[i] === 0 ? "#7dff8a" : "#3a4678"}" stroke-dasharray="4 4"/>`).join("")}
        ${ok ? `<polyline points="${pts.map((p) => p.join(",")).join(" ")}" fill="none" stroke="#ffd27a" stroke-width="2"/>` : ""}
        ${pts.map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="4.5" fill="${rings[i % 3] === 0 ? "#ffd27a" : "#bfeaff"}"/>`).join("")}`;
      const stEl = e.querySelector("#sky-cstate");
      if (stEl) stEl.textContent = ok ? `${con.name} is in focus!` : "Turn the three lens rings until all rings glow green.";
    };
    page("Starlight Telescope", `<div class="chips">${CONSTELLATIONS.map((x) => `<button class="chip${x.id === con.id ? " on" : ""}" type="button" data-con="${x.id}">${sk.stars[x.id] ? "★ " : ""}${esc(x.name)}</button>`).join("")}</div>
      <div class="sky-scope-wrap"><svg id="sky-scope" viewBox="0 0 240 200" width="240" height="200"></svg>
      <p id="sky-cstate" class="muted"></p>
      <div class="sky-rings"><button class="btn" type="button" data-ring="0">Inner Ring</button><button class="btn" type="button" data-ring="1">Middle Ring</button><button class="btn" type="button" data-ring="2">Outer Ring</button></div></div>`, (e) => {
      draw(e);
      e.querySelectorAll("[data-con]").forEach((b) => (b.onclick = () => telescope(b.dataset.con)));
      e.querySelectorAll("[data-ring]").forEach((b) => (b.onclick = () => {
        if (aligned()) return;
        const i = +b.dataset.ring;
        rings[i] = (rings[i] + 1) % 8;
        api.ping(rings[i] === 0 ? "choice" : "blip");
        draw(e);
        if (aligned()) {
          const fresh = !sk.stars[con.id];
          sk.stars[con.id] = 1;
          if (fresh) {
            api.addMon(75);
            sk.shards += 2;
            if (Object.keys(sk.stars).length === CONSTELLATIONS.length) {
              api.giveHat("stargazer");
              api.addMon(150);
              sayToast("All 6 constellations charted! (+150 mon & Stargazer's veil)");
            } else {
              sayToast(`Charted ${con.name}! (+75 mon, +2 shards)`);
            }
          }
          api.ping("done"); api.save(); hud();
          e.querySelector(`[data-con="${con.id}"]`).textContent = "★ " + con.name;
        }
      }));
    });
  }

  function chimeTrial() {
    const CHIMES = [["Amber", "#ffb74d"], ["Azure", "#6cc8ff"], ["Rose", "#ff8fb8"], ["Jade", "#67d6a4"]];
    let round = 1, seq = [], idx = 0, locked = true, timer = 0;
    const nextRound = (e) => {
      seq = Array.from({ length: round + 2 }, () => Math.floor(Math.random() * 4));
      idx = 0; locked = true;
      const msg = e.querySelector("#sky-chmsg");
      if (msg) msg.textContent = `Round ${round}/3: Listen closely…`;
      let stepI = 0;
      const playStep = () => {
        if (!e.isConnected) return;
        e.querySelectorAll("[data-ch]").forEach((b) => b.classList.remove("lit"));
        if (stepI >= seq.length) { locked = false; if (msg) msg.textContent = `Repeat ${seq.length} chimes!`; return; }
        const btn = e.querySelector(`[data-ch="${seq[stepI]}"]`);
        btn?.classList.add("lit");
        api.ping("blip");
        stepI++;
        timer = setTimeout(() => { btn?.classList.remove("lit"); timer = setTimeout(playStep, 220); }, 420);
      };
      timer = setTimeout(playStep, 450);
    };
    page("The Amber Chimes", `<p id="sky-chmsg" class="muted">Watch the glowing chimes and repeat the pattern.</p>
      <div class="sky-chimes">${CHIMES.map(([n, c], i) => `<button type="button" data-ch="${i}" style="--cc:${c}"><strong>${n}</strong></button>`).join("")}</div>`, (e) => {
      nextRound(e);
      e.querySelectorAll("[data-ch]").forEach((b) => (b.onclick = () => {
        if (locked) return;
        const pick = +b.dataset.ch;
        b.classList.add("lit");
        setTimeout(() => b.classList.remove("lit"), 220);
        if (pick !== seq[idx]) {
          api.ping("close");
          e.querySelector("#sky-chmsg").textContent = "Out of tune! Try again from Round 1.";
          round = 1;
          nextRound(e);
          return;
        }
        api.ping("choice");
        idx++;
        if (idx >= seq.length) {
          if (round >= 3) {
            const fresh = !sk.chimeWon;
            sk.chimeWon = 1;
            api.addMon(fresh ? 140 : 40);
            if (fresh) api.giveHat("cloudwalker");
            api.ping("done"); api.save(); hud();
            e.querySelector("#sky-chmsg").textContent = fresh ? "The Amber Spire echoes! (+140 mon & Cloudwalker's plume)" : "Perfectly played! (+40 mon)";
            locked = true;
          } else {
            round++;
            nextRound(e);
          }
        }
      }));
      return () => clearTimeout(timer);
    });
  }

  function skyFishGame() {
    const pool = SKY_FISH, total = pool.reduce((a, f) => a + 1 / f[2], 0);
    let r = Math.random() * total, fish = pool[0];
    for (const f of pool) { r -= 1 / f[2]; if (r <= 0) { fish = f; break; } }
    page("Cloud-Fishing", `<div class="wd-fishing"><p id="wf-msg">Your hook drifts into the clouds…</p><div class="wf-bar" hidden><i id="wf-zone"></i><b id="wf-mark"></b></div><button class="btn btn-accent" type="button" id="wf-go"><kbd>E</kbd> Waiting…</button></div>`, (p) => {
      const msg = p.querySelector("#wf-msg"), bar = p.querySelector(".wf-bar"), zoneEl = p.querySelector("#wf-zone"), mark = p.querySelector("#wf-mark"), go = p.querySelector("#wf-go");
      const F = fishing = { phase: "wait", raf: 0, t0: performance.now(), biteAt: 900 + Math.random() * 2200 };
      const width = Math.min(0.8, fish[3]), left = 0.1 + Math.random() * (0.8 - width);
      let pos = 0;
      const again = () => { go.textContent = "Cast again"; go.onclick = skyFishGame; F.phase = "over"; };
      const hit = () => {
        if (F.phase === "wait") { msg.textContent = "Too soon!"; api.ping("blip"); again(); }
        else if (F.phase === "bite") { F.phase = "reel"; bar.hidden = false; zoneEl.style.left = left * 100 + "%"; zoneEl.style.width = width * 100 + "%"; msg.textContent = "Stop the marker in the gold!"; go.innerHTML = "<kbd>E</kbd> Reel in"; F.t0 = performance.now(); }
        else if (F.phase === "reel") {
          if (pos >= left && pos <= left + width) {
            sk.caught++; sk.fish[fish[0]] = (sk.fish[fish[0]] || 0) + 1;
            api.addMon(fish[2]); api.save(); hud(); api.ping("done");
            msg.innerHTML = `You caught: <strong>${esc(fish[1])}</strong> (+${fish[2]} mon)`;
          } else { api.ping("blip"); msg.textContent = "It slipped into the mist."; }
          again();
        } else if (F.phase === "over") go.click();
      };
      F.hit = hit; go.onclick = hit;
      const tick = (now) => {
        if (fishing !== F || F.phase === "over") return;
        if (F.phase === "wait" && now - F.t0 > F.biteAt) { F.phase = "bite"; F.t0 = now; msg.textContent = "A tug in the clouds!"; go.innerHTML = "<kbd>E</kbd> Strike!"; api.ping("choice"); }
        else if (F.phase === "bite" && now - F.t0 > 1400) { msg.textContent = "It took the bait."; again(); return; }
        else if (F.phase === "reel") { pos = (Math.sin((now - F.t0) / (260 + width * 900) - 1.57) + 1) / 2; mark.style.left = pos * 100 + "%"; }
        F.raf = requestAnimationFrame(tick);
      };
      F.raf = requestAnimationFrame(tick);
    });
  }

  function skyLog() {
    page("Sky Log", `<h3>Wind-Bells (${Object.keys(sk.bells).length}/${SKY_BELLS.length})</h3>
      <ol class="wd-list">${SKY_BELLS.map((b) => `<li class="${sk.bells[b.id] ? "ok" : ""}"><strong>${esc(b.name)}</strong><span>${sk.bells[b.id] ? "Ringing" : b.need}</span></li>`).join("")}</ol>
      <h3>Constellations (${Object.keys(sk.stars).length}/${CONSTELLATIONS.length})</h3>
      <ol class="wd-list">${CONSTELLATIONS.map((c) => `<li class="${sk.stars[c.id] ? "ok" : ""}"><strong>${esc(c.name)}</strong><span>${sk.stars[c.id] ? "Charted" : "Uncharted"}</span></li>`).join("")}</ol>
      <h3>Sky Fish (${Object.keys(sk.fish).length}/${SKY_FISH.length})</h3>
      <ol class="wd-list">${SKY_FISH.map((f) => `<li class="${sk.fish[f[0]] ? "ok" : ""}"><strong>${sk.fish[f[0]] ? esc(f[1]) : "???"}</strong><span>${sk.fish[f[0]] ? `${sk.fish[f[0]]} caught · ${f[2]} mon` : "Cloud-edge"}</span></li>`).join("")}</ol>
      <h3>Fast Travel</h3>
      <div class="chips">${SKY_ISLANDS.map((isl) => `<button class="chip" type="button" data-go="${isl.id}">${esc(isl.name)}</button>`).join("")}</div>`, (e) => {
      e.querySelectorAll("[data-go]").forEach((b) => (b.onclick = () => {
        const isl = SKY_ISLANDS.find((q) => q.id === b.dataset.go);
        if (isl) { px = (isl.cx + 0.5) * T; py = (isl.cy + 1.5) * T; }
        closePage();
      }));
    });
  }

  function talkNpc(n) {
    const btns = [];
    if (n.id === "loomis") btns.push(["Open Cloud Loom", loomShop]);
    if (n.id === "astrid") btns.push(["Look through Telescope", () => telescope()]);
    if (n.id === "zephyr") btns.push(["Play Wind-Chime Trial", chimeTrial]);
    say(n, n.lines[n.line++ % n.lines.length], btns);
  }

  const facingSky = () => {
    const [a, b] = { up: [0, -26], down: [0, 34], left: [-28, 8], right: [28, 8] }[dir];
    const x = Math.floor((px + a) / T), y = Math.floor((py + b) / T);
    return x >= 0 && y >= 0 && x < SW && y < SH && map.g[y * SW + x] === STILE.sky;
  };

  function findTarget() {
    if (Math.hypot((SKY_DOCK[0] + 0.5) * T - px, (SKY_DOCK[1] + 0.5) * T - py) < 52) return { label: "Board Airship home", go: leave };
    for (const n of npcs) if (Math.hypot(n.px - px, n.py - py) < 50) return { label: `Talk to ${n.name}`, go: () => talkNpc(n) };
    for (const b of SKY_BELLS) if (Math.hypot((b.x + 0.5) * T - px, (b.y + 0.5) * T - py) < 48) return { label: sk.bells[b.id] ? `${b.name} (Ringing)` : `Ring ${b.name}`, go: () => ringBell(b) };
    for (const b of SKY_BUILDINGS) {
      const dx = (b.x + b.w / 2) * T, dy = (b.y + b.h + 0.4) * T;
      if (Math.hypot(dx - px, dy - py) < 46) {
        if (b.id === "loomhouse") return { label: "Enter The Cloud Loom", go: loomShop };
        if (b.id === "dome") return { label: "Use Starlight Telescope", go: () => telescope() };
        if (b.id === "spirearch") return { label: "Play Wind-Chime Trial", go: chimeTrial };
        if (b.id === "kiteworks") return { label: "Read the workshop board", go: skyLog };
        if (b.id === "windwatch") return { label: "Study the wind charts", go: skyLog };
        return { label: "Read Harbor Post", go: skyLog };
      }
    }
    if (facingSky()) return { label: "Cloud-Fish here", go: skyFishGame };
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
      const v = (keys.has("shift") ? 280 : 185) * (sk.tonic ? 1.15 : 1) * dt;
      const nx = px + (ax / m) * v, ny = py + (ay / m) * v;
      if (!blocked(nx, py)) px = nx;
      if (!blocked(px, ny)) py = ny;
      dir = Math.abs(ax) > Math.abs(ay) ? (ax < 0 ? "left" : "right") : ay < 0 ? "up" : "down";
      step += dt * 13;
    }
    for (const sh of map.shards) {
      if (!sk.picked[sh.id] && Math.hypot((sh.x + 0.5) * T - px, (sh.y + 0.5) * T - py) < 26) {
        sk.picked[sh.id] = 1; sk.shards++; sk.totalShards++;
        api.addMon(4); api.ping("blip");
        burst((sh.x + 0.5) * T, (sh.y + 0.5) * T, 10);
        hud();
      }
    }
    for (const cl of clouds) { cl.x += cl.sp * dt; if (cl.x > SW * T + 120) cl.x = -120; }
    if (fireworks > 0) { fireworks -= dt; if (Math.random() < dt * 3) burst(px + (Math.random() - 0.5) * 400, py - 120 + Math.random() * 140, 24); }
    for (const p of sparks) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 110 * dt; p.life -= dt * 1.15; }
    sparks = sparks.filter((p) => p.life > 0);
    if (toastT && now > toastT) { toastEl.hidden = true; toastT = 0; }
    if (pageEl.hidden && talkEl.hidden) {
      const nt = findTarget();
      if (nt?.label !== target?.label) { promptEl.hidden = !nt; if (nt) promptEl.innerHTML = `<kbd>E</kbd> ${esc(nt.label)}`; }
      target = nt;
    } else { promptEl.hidden = true; target = null; }
    if ((saveT += dt) > 6) { saveT = 0; api.save(); }
  }

  const TC = { [STILE.cloud]: ["#eef6ff", "#e2f0ff"], [STILE.meadow]: ["#8ad08c", "#7ec680"], [STILE.plaza]: ["#d8d3e8", "#cec8df"], [STILE.bridge]: ["#f4dca8", "#ecd098"], [STILE.ruin]: ["#e4c99a", "#dac08e"], [STILE.flower]: ["#9fe09a", "#93d68e"], [STILE.tree]: ["#8ad08c", "#7ec680"] };

  function frame(now) {
    if (!alive) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    update(dt, now);
    const vw = cw / zoom, vh = ch / zoom;
    const camX = Math.max(0, Math.min(SW * T - vw, px - vw / 2));
    const camY = Math.max(0, Math.min(SH * T - vh, py - vh / 2));

    g.setTransform(1, 0, 0, 1, 0, 0);
    const skyGrad = g.createLinearGradient(0, 0, 0, ch);
    skyGrad.addColorStop(0, sk.aurora ? "#101b3d" : "#182b5c");
    skyGrad.addColorStop(1, sk.aurora ? "#2a4576" : "#4478b8");
    g.fillStyle = skyGrad; g.fillRect(0, 0, cw, ch);

    for (const st of stars) {
      const a = 0.4 + 0.5 * Math.sin(now / 700 + st.p);
      g.fillStyle = `rgba(255,248,220,${a})`;
      g.fillRect(st.x * cw, st.y * ch * 0.7, st.r * 2, st.r * 2);
    }
    if (sk.aurora) {
      g.save();
      for (let i = 0; i < 3; i++) {
        g.strokeStyle = ["rgba(110,255,190,.18)", "rgba(130,210,255,.16)", "rgba(220,140,255,.14)"][i];
        g.lineWidth = 24;
        g.beginPath();
        for (let x = 0; x <= cw; x += 32) {
          const y = 60 + i * 28 + Math.sin(x / 120 + now / 1400 + i) * 18;
          x ? g.lineTo(x, y) : g.moveTo(x, y);
        }
        g.stroke();
      }
      g.restore();
    }

    g.scale(zoom, zoom); g.translate(-Math.round(camX), -Math.round(camY));
    for (const cl of clouds) {
      if (cl.x > camX - 180 && cl.x < camX + vw + 180 && cl.y > camY - 80 && cl.y < camY + vh + 80) {
        g.fillStyle = "rgba(255,255,255,.14)";
        g.beginPath(); g.ellipse(cl.x, cl.y, cl.w / 2, 16, 0, 0, 7); g.fill();
      }
    }

    const x0 = Math.max(0, Math.floor(camX / T)), x1 = Math.min(SW - 1, Math.ceil((camX + vw) / T));
    const y0 = Math.max(0, Math.floor(camY / T)), y1 = Math.min(SH - 1, Math.ceil((camY + vh) / T));
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const v = map.g[y * SW + x];
        if (v === STILE.sky) continue;
        if (y + 1 < SH && map.g[(y + 1) * SW + x] === STILE.sky) {
          g.fillStyle = v === STILE.bridge ? "#a8865a" : "#6c7fa8";
          g.fillRect(x * T, (y + 1) * T, T + 0.5, 14);
        }
        g.fillStyle = TC[v][(x + y) % 2];
        g.fillRect(x * T, y * T, T + 0.5, T + 0.5);
        if (v === STILE.flower) {
          g.fillStyle = (x + y) % 2 ? "#ffb7d0" : "#ffe382";
          g.beginPath(); g.arc(x * T + 16, y * T + 16, 3.5, 0, 7); g.fill();
        }
      }
    }

    const things = [];
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        if (map.g[y * SW + x] === STILE.tree) {
          const tx = (x + 0.5) * T, ty = (y + 0.5) * T;
          things.push([ty + 12, () => {
            g.fillStyle = "#6a4528"; g.fillRect(tx - 4, ty - 2, 8, 15);
            g.fillStyle = "#7cc8a2"; g.beginPath(); g.arc(tx, ty - 14, 15, 0, 7); g.fill();
            g.fillStyle = "#b9f0d2"; g.beginPath(); g.arc(tx - 4, ty - 18, 7, 0, 7); g.fill();
          }]);
        }
      }
    }
    for (const b of SKY_BUILDINGS) {
      const bx = b.x * T, by = b.y * T, bw = b.w * T, bh = b.h * T;
      things.push([by + bh, () => {
        g.fillStyle = "#f4ead8"; g.fillRect(bx, by + bh * 0.35, bw, bh * 0.65);
        g.fillStyle = b.roof; g.beginPath(); g.moveTo(bx - 8, by + bh * 0.38); g.lineTo(bx + bw * 0.16, by); g.lineTo(bx + bw * 0.84, by); g.lineTo(bx + bw + 8, by + bh * 0.38); g.closePath(); g.fill();
        g.strokeStyle = "#1b1d33"; g.lineWidth = 2.5; g.stroke(); g.strokeRect(bx, by + bh * 0.35, bw, bh * 0.65);
        g.fillStyle = "#5a3c22"; g.fillRect(bx + bw / 2 - 11, by + bh - 34, 22, 34);
        g.font = "800 10.5px system-ui"; g.textAlign = "center";
        const tw = g.measureText(b.name).width + 10;
        g.fillStyle = "rgba(15,14,24,.88)"; g.fillRect(bx + bw / 2 - tw / 2, by - 16, tw, 15);
        g.fillStyle = "#ffe9b0"; g.fillText(b.name, bx + bw / 2, by - 5);
      }]);
    }
    // Moored Starlight Airship
    {
      const dx = (SKY_DOCK[0] - 0.8) * T, dy = (SKY_DOCK[1] + 0.2) * T, bob = Math.sin(now / 550) * 4;
      things.push([dy + 20, () => {
        g.fillStyle = "#8a4a2c"; g.fillRect(dx - 24, dy + 4 + bob, 48, 16);
        g.strokeStyle = "#1b1d33"; g.lineWidth = 2; g.strokeRect(dx - 24, dy + 4 + bob, 48, 16);
        g.fillStyle = "#e8d8b8"; g.beginPath(); g.ellipse(dx, dy - 22 + bob, 36, 17, 0, 0, 7); g.fill(); g.stroke();
        g.fillStyle = "#d95040"; g.fillRect(dx - 34, dy - 24 + bob, 68, 5);
        g.font = "800 10px system-ui"; g.textAlign = "center"; g.fillStyle = "#fff4d6"; g.fillText("Airship", dx, dy - 44 + bob);
      }]);
    }
    for (const bell of SKY_BELLS) {
      const bx = (bell.x + 0.5) * T, by = (bell.y + 0.5) * T, on = !!sk.bells[bell.id];
      things.push([by + 12, () => {
        g.fillStyle = "#4a3c32"; g.fillRect(bx - 12, by - 26, 4, 38); g.fillRect(bx + 8, by - 26, 4, 38); g.fillRect(bx - 14, by - 28, 28, 5);
        g.fillStyle = on ? "#ffd84d" : "#7a8296"; g.beginPath(); g.moveTo(bx - 8, by - 8); g.lineTo(bx + 8, by - 8); g.lineTo(bx + 5, by - 22); g.lineTo(bx - 5, by - 22); g.closePath(); g.fill();
        if (on) { g.fillStyle = "rgba(255,220,110,.25)"; g.beginPath(); g.arc(bx, by - 14, 22 + Math.sin(now / 280) * 3, 0, 7); g.fill(); }
      }]);
    }
    for (const sh of map.shards) {
      if (sk.picked[sh.id]) continue;
      const sx = (sh.x + 0.5) * T, sy = (sh.y + 0.5) * T, bob = Math.sin(now / 360 + sh.id) * 3;
      things.push([sy, () => {
        g.fillStyle = "rgba(150,220,255,.3)"; g.beginPath(); g.arc(sx, sy + bob, 10, 0, 7); g.fill();
        g.fillStyle = "#ffe885"; g.beginPath(); g.moveTo(sx, sy - 9 + bob); g.lineTo(sx + 6, sy + bob); g.lineTo(sx, sy + 9 + bob); g.lineTo(sx - 6, sy + bob); g.closePath(); g.fill();
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
    else if (k === "j") skyLog();
    else if (k === "f") leave();
  };
  const onUp = (e) => keys.delete(e.key.toLowerCase()), onBlur = () => keys.clear();
  window.addEventListener("keydown", onDown, true); window.addEventListener("keyup", onUp, true); window.addEventListener("blur", onBlur);

  const pad = host.querySelector("#sky-pad"), knob = pad.querySelector("i");
  pad.onpointerdown = (e) => { pad.setPointerCapture(e.pointerId); joy = { x: 0, y: 0 }; pad.onpointermove(e); };
  pad.onpointermove = (e) => { if (!joy) return; const r = pad.getBoundingClientRect(), x = (e.clientX - r.left - r.width / 2) / (r.width / 2), y = (e.clientY - r.top - r.height / 2) / (r.height / 2), m = Math.max(1, Math.hypot(x, y)); joy = { x: x / m, y: y / m }; knob.style.transform = `translate(${joy.x * 30}px,${joy.y * 30}px)`; };
  pad.onpointerup = pad.onpointercancel = () => { joy = null; knob.style.transform = ""; };

  host.querySelector("#sky-act").onclick = act;
  promptEl.onclick = act;
  host.querySelector("#sky-log").onclick = skyLog;
  host.querySelector("#sky-leave").onclick = leave;

  function cleanup() {
    cancelAnimationFrame(raf); ro.disconnect();
    if (fishing) cancelAnimationFrame(fishing.raf);
    window.removeEventListener("keydown", onDown, true); window.removeEventListener("keyup", onUp, true); window.removeEventListener("blur", onBlur);
  }
  hud(); host.focus({ preventScroll: true }); raf = requestAnimationFrame(frame);
  return () => { alive = false; cleanup(); };
}
