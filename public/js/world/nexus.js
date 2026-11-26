// The Astral Nexus: Walkable Citadel, Procedural Star-Rift Roguelite, Star-Forge Relics, Grand Caravan & Nine-Tail Zodiac.
import {
  NX_W, NX_H, NX_T as T, NX_TIERS, NX_RELICS, NX_ROUTES, NX_ZODIAC,
  ensureNexus, nexusStats, pendingCaravanYield, buildRiftFloor,
} from "./nexuscore.js";

const esc = (x) => String(x ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const CIT_W = 30;
const CIT_H = 22;
const STATIONS = [
  { id: "rift", name: "Star-Rift Gate", x: 15, y: 6, color: "#ff4fd8", sub: "Descend into Astral Rifts" },
  { id: "forge", name: "The Star-Forge", x: 8, y: 11, color: "#7fd0ff", sub: "Craft & Socket 12 Relics" },
  { id: "caravan", name: "Grand Caravan", x: 22, y: 11, color: "#ffd84d", sub: "8 Regional Trade Routes" },
  { id: "zodiac", name: "Nine-Tail Zodiac", x: 15, y: 16, color: "#5cf0c0", sub: "Attune World Blessings" },
  { id: "exit", name: "Return to Hollow Pine", x: 15, y: 20, color: "#e8dcc0", sub: "Step back through the Spire" },
];

export function mountNexus(host, api) {
  const s = api.state;
  const nx = ensureNexus(s);
  const keys = new Set();

  host.innerHTML = `<canvas class="by-c"></canvas>
    <div class="by-hud">
      <strong>✦ <span id="nx-motes">${nx.motes}</span> motes · 🪙 <span id="nx-mon">${api.mon()}</span> · <span id="nx-loc">Astral Citadel</span></strong>
      <span id="nx-hp" style="color:#ff6b8a;font-weight:900;letter-spacing:1px"></span>
      <div class="by-btns">
        <button type="button" id="nx-b-forge">Forge <kbd>1</kbd></button>
        <button type="button" id="nx-b-caravan">Caravan <kbd>2</kbd></button>
        <button type="button" id="nx-b-zodiac">Zodiac <kbd>3</kbd></button>
        <button type="button" id="nx-leave">Leave <kbd>Esc</kbd></button>
      </div>
    </div>
    <button type="button" class="by-prompt" id="nx-prompt" hidden></button>
    <div class="wd-pad by-pad" id="nx-pad"><i></i></div>
    <button type="button" class="wd-act by-act" id="nx-act">E</button>
    <div class="by-toast" id="nx-toast" hidden></div>
    <section class="by-page" id="nx-page" hidden></section>`;

  const c = host.querySelector(".by-c"), g = c.getContext("2d");
  const promptEl = host.querySelector("#nx-prompt"), toastEl = host.querySelector("#nx-toast"), pageEl = host.querySelector("#nx-page");
  const motesEl = host.querySelector("#nx-motes"), monEl = host.querySelector("#nx-mon"), locEl = host.querySelector("#nx-loc"), hpEl = host.querySelector("#nx-hp");

  let mode = "citadel"; // "citadel" | "rift"
  let rift = null;
  let runBag = { motes: 0, mon: 0, floor: 0 };
  let px = 15.5 * T, py = 18.5 * T, dir = "up", step = 0, moving = false;
  let hp = 5, maxHp = 5, invT = 0, dashT = 0, dashCd = 0, boltCd = 0, wispAng = 0;
  let bolts = [], enemyShots = [], sparks = [], stars = Array.from({ length: 85 }, (_, i) => ({ x: (i * 97) % 1600, y: (i * 151) % 1100, s: 1 + (i % 3) }));
  let cw = 0, ch = 0, zoom = 1.45, alive = true, raf = 0, last = performance.now(), joy = null, target = null, toastT = 0;

  const resize = () => {
    const r = host.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
    cw = r.width; ch = r.height;
    c.width = Math.max(1, cw * dpr); c.height = Math.max(1, ch * dpr);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    zoom = cw < 700 ? 1.05 : cw > 1400 ? 1.65 : 1.4;
  };
  const ro = new ResizeObserver(resize); ro.observe(host); resize();

  const sayToast = (msg) => {
    toastEl.textContent = msg; toastEl.hidden = false; toastT = performance.now() + 2600;
  };
  const burst = (x, y, col = "#7fd0ff", n = 16) => {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * 6.28, v = 45 + Math.random() * 130;
      sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.7 + Math.random() * 0.4, c: col });
    }
  };
  const syncHud = () => {
    motesEl.textContent = nx.motes + (mode === "rift" ? ` (+${runBag.motes})` : "");
    monEl.textContent = api.mon();
    if (mode === "citadel") {
      locEl.textContent = `Astral Citadel · Best Rift F${nx.bestFloor}`;
      hpEl.textContent = "";
    } else if (rift) {
      locEl.textContent = `F${rift.floor} · ${rift.tier.name}`;
      hpEl.textContent = "♥".repeat(Math.max(0, hp)) + "♡".repeat(Math.max(0, maxHp - Math.max(0, hp)));
    }
  };

  const closePage = () => { pageEl.hidden = true; pageEl.innerHTML = ""; host.focus?.({ preventScroll: true }); };
  const openPage = (title, bodyHtml, bind) => {
    keys.clear();
    pageEl.hidden = false;
    pageEl.innerHTML = `<header><h2>${esc(title)}</h2><span>✦ ${nx.motes} motes · 🪙 ${api.mon()} mon</span><button type="button" class="btn btn-sm" id="nx-pg-x">Close</button></header><div class="by-body">${bodyHtml}</div>`;
    pageEl.querySelector("#nx-pg-x").onclick = closePage;
    bind?.(pageEl);
  };

  function enterRift(floor = 1) {
    closePage();
    const st = nexusStats(s);
    if (floor === 1) {
      maxHp = st.hp;
      hp = maxHp;
      runBag = { motes: 0, mon: 0, floor: 1 };
    } else {
      hp = Math.min(maxHp, hp + 1);
      runBag.floor = floor;
    }
    mode = "rift";
    rift = buildRiftFloor(floor, Date.now());
    [px, py] = rift.spawn;
    bolts = []; enemyShots = [];
    api.ping("open");
    sayToast(`Floor ${floor}: ${rift.tier.name} — Light all 3 Pylons!`);
    syncHud();
  }

  function extractRift(wonFloor = false) {
    const st = nexusStats(s);
    const keep = wonFloor ? 1 : 0.5;
    const bonusMotes = Math.round(runBag.motes * keep * (1 + st.motes / 100));
    const bonusMon = Math.round(runBag.mon * keep * (1 + st.mon / 100));
    if (bonusMotes > 0) nx.motes += bonusMotes;
    if (bonusMon > 0) api.addMon(bonusMon);
    runBag.motes = 0;
    runBag.mon = 0;
    if (wonFloor) nx.clears++;
    api.save();
    mode = "citadel";
    rift = null;
    px = STATIONS[0].x * T + T / 2;
    py = (STATIONS[0].y + 2) * T;
    bolts = []; enemyShots = [];
    syncHud();
    api.ping("done");
    sayToast(`Returned safely! Banked +${bonusMotes} Astral Motes & +${bonusMon} Mon.`);
  }

  function failRift() {
    const keepMotes = Math.floor(runBag.motes * 0.5);
    if (keepMotes > 0) nx.motes += keepMotes;
    api.save();
    mode = "citadel";
    rift = null;
    px = 15.5 * T; py = 18.5 * T;
    bolts = []; enemyShots = [];
    syncHud();
    api.ping("close");
    sayToast(`Shattered in the Rift! Kept ${keepMotes} Astral Motes.`);
  }

  function riftGateMenu() {
    const checkpoints = [1, 3, 5, 8, 11, 15].filter((f) => f === 1 || nx.bestFloor >= f - 1);
    openPage("Star-Rift Gate", `<p class="muted">Descend into shifting Astral Sanctums. Light 3 Resonance Pylons to summon the Rift Guardian, defeat it, and extract or dive deeper for escalating rewards. Move with WASD/Arrows, Dash with <kbd>Shift</kbd>.</p>
      <div class="by-crates">${checkpoints.map((f) => {
        const tier = NX_TIERS.slice().reverse().find((t) => f >= t.minFloor) || NX_TIERS[0];
        return `<button type="button" class="by-crate" data-go="${f}" style="border-color:${tier.accent}">
          <span>🌀</span><strong>Floor ${f} · ${esc(tier.name)}</strong>
          <small>Boss: ${esc(tier.bossName)}</small>
        </button>`;
      }).join("")}</div>
      <h3>Expedition Record</h3>
      <div class="by-list">
        <div><i>🏆</i><span><strong>Deepest Rift Reached</strong><small>Floor ${nx.bestFloor}</small></span></div>
        <div><i>⚔️</i><span><strong>Rift Phantoms Banished</strong><small>${nx.kills} defeated · ${nx.clears} extractions</small></span></div>
      </div>`, (el) => {
      el.querySelectorAll("[data-go]").forEach((b) => (b.onclick = () => enterRift(+b.dataset.go)));
    });
  }

  function forgePage() {
    openPage("The Star-Forge · Astral Relics", `<p class="muted">Forge Relics from Astral Motes and World Mon. Up to <strong>3 Relics</strong> can be socketed at once (${nx.equipped.length}/3 active) — their buffs apply across Kitsune World AND inside Star-Rifts!</p>
      <div class="by-list">${NX_RELICS.map((r) => {
        const [id, , ic, cMote, cMon, , , desc] = r;
        const owned = !!nx.relics[id], eq = nx.equipped.includes(id);
        const canBuy = !owned && nx.motes >= cMotes(cMote) && api.mon() >= cMon;
        return `<div class="${eq ? "ok" : ""}"><i>${ic}</i><span><strong>${esc(id.toUpperCase())} ${eq ? "· [SOCKETED]" : ""}</strong><small>${esc(desc)}</small></span>
          ${owned
            ? `<button type="button" class="btn btn-sm ${eq ? "" : "btn-accent"}" data-eq="${id}">${eq ? "Unsocket" : "Socket"}</button>`
            : `<button type="button" class="btn btn-sm btn-accent" data-buy="${id}" ${canBuy ? "" : "disabled"}>${cMote} ✦ + ${cMon} 🪙</button>`}
        </div>`;
      }).join("")}</div>`, (el) => {
      el.querySelectorAll("[data-buy]").forEach((b) => (b.onclick = () => {
        const r = NX_RELICS.find((x) => x[0] === b.dataset.buy);
        if (!r || nx.relics[r[0]] || nx.motes < r[3] || api.mon() < r[4]) return;
        nx.motes -= r[3]; api.addMon(-r[4]); nx.relics[r[0]] = 1;
        if (nx.equipped.length < 3) nx.equipped.push(r[0]);
        api.save(); api.ping("done"); syncHud(); forgePage();
      }));
      el.querySelectorAll("[data-eq]").forEach((b) => (b.onclick = () => {
        const id = b.dataset.eq;
        if (nx.equipped.includes(id)) nx.equipped = nx.equipped.filter((x) => x !== id);
        else { if (nx.equipped.length >= 3) nx.equipped.shift(); nx.equipped.push(id); }
        api.save(); api.ping("choice"); forgePage();
      }));
    });
  }
  const cMotes = (n) => n;

  function caravanPage() {
    const yieldNow = pendingCaravanYield(s);
    openPage("Grand Caravan · Regional Trade Network", `<div class="by-homebar">
        <span><strong>Tariff Vault:</strong> +${yieldNow.mon} 🪙 &amp; +${yieldNow.motes} ✦ (${yieldNow.monPerHr}/hr · ${yieldNow.motesPerHr}✦/hr)</span>
        <button type="button" class="btn btn-accent" id="nx-claim" ${yieldNow.mon || yieldNow.motes ? "" : "disabled"}>Collect Tariffs</button>
      </div>
      <p class="muted">Charter lantern-lit trade routes between Kitsune World's regions. Upgrade routes up to Level 5 to multiply hourly Mon &amp; Astral Mote income, or run an Express Escort for instant payouts.</p>
      <div class="by-list">${NX_ROUTES.map((r) => {
        const [id, name, baseCost, mHr, aHr, , blurb] = r;
        const lv = nx.routes[id] || 0;
        const cost = lv === 0 ? baseCost : Math.round(baseCost * (1 + lv * 0.75));
        return `<div class="${lv > 0 ? "ok" : ""}"><i>🏮</i><span><strong>${esc(name)} ${lv ? `· Lv.${lv}/5` : ""}</strong><small>${esc(blurb)} (${Math.round(mHr * (1 + Math.max(0, lv - 1) * 0.45))} 🪙/hr, ${Math.round(aHr * (1 + Math.max(0, lv - 1) * 0.45))} ✦/hr)</small></span>
          ${lv < 5 ? `<button type="button" class="btn btn-sm btn-accent" data-rt="${id}" ${api.mon() >= cost ? "" : "disabled"}>${lv ? `Upgrade · ${cost} 🪙` : `Charter · ${cost} 🪙`}</button>` : `<em>Max Lv.5</em>`}
        </div>`;
      }).join("")}</div>`, (el) => {
      const cl = el.querySelector("#nx-claim");
      if (cl) cl.onclick = () => {
        const y = pendingCaravanYield(s);
        if (!y.mon && !y.motes) return;
        nx.lastClaim = Date.now();
        nx.pendingMon = 0;
        nx.pendingMotes = 0;
        if (y.mon) api.addMon(y.mon);
        if (y.motes) nx.motes += y.motes;
        api.save(); api.ping("done"); syncHud(); sayToast(`Collected +${y.mon} Mon & +${y.motes} Astral Motes!`); caravanPage();
      };
      el.querySelectorAll("[data-rt]").forEach((b) => (b.onclick = () => {
        const r = NX_ROUTES.find((x) => x[0] === b.dataset.rt);
        if (!r) return;
        const lv = nx.routes[r[0]] || 0;
        if (lv >= 5) return;
        const cost = lv === 0 ? r[2] : Math.round(r[2] * (1 + lv * 0.75));
        if (api.mon() < cost) return;
        const y = pendingCaravanYield(s);
        nx.pendingMon = y.mon;
        nx.pendingMotes = y.motes;
        nx.lastClaim = Date.now();
        api.addMon(-cost);
        nx.routes[r[0]] = lv + 1;
        api.save(); api.ping("done"); syncHud(); caravanPage();
      }));
    });
  }

  function zodiacPage() {
    openPage("Nine-Tail Celestial Zodiac", `<p class="muted">Attune the nine star-tails with Astral Motes to unlock permanent Kitsune World blessings, exclusive hats, and house furniture.</p>
      <div class="by-list">${NX_ZODIAC.map((z) => {
        const [id, name, cost, , , rewardLabel, desc] = z;
        const done = !!nx.zodiac[id];
        return `<div class="${done ? "ok" : ""}"><i>✦</i><span><strong>${esc(name)}</strong><small>${esc(desc)} — Reward: <strong>${esc(rewardLabel)}</strong></small></span>
          ${done ? `<em>Attuned</em>` : `<button type="button" class="btn btn-sm btn-accent" data-zd="${id}" ${nx.motes >= cost ? "" : "disabled"}>Attune · ${cost} ✦</button>`}
        </div>`;
      }).join("")}</div>`, (el) => {
      el.querySelectorAll("[data-zd]").forEach((b) => (b.onclick = () => {
        const z = NX_ZODIAC.find((x) => x[0] === b.dataset.zd);
        if (!z || nx.zodiac[z[0]] || nx.motes < z[2]) return;
        nx.motes -= z[2];
        nx.zodiac[z[0]] = 1;
        if (z[3] === "mon") api.addMon(+z[4]);
        else if (z[3] === "hat") api.giveHat(z[4]);
        else if (z[3] === "furn") api.giveFurn(z[4]);
        api.save(); api.ping("done"); syncHud(); sayToast(`Attuned ${z[1]}! Unlocked ${z[5]}.`); zodiacPage();
      }));
    });
  }

  const solidRift = (x, y) => {
    const tx = Math.floor(x / T), ty = Math.floor(y / T);
    if (tx < 1 || ty < 1 || tx >= NX_W - 1 || ty >= NX_H - 1) return true;
    return rift.g[ty * NX_W + tx] === 1;
  };
  const blockedAt = (x, y) => {
    if (mode === "citadel") return x < 2 * T || y < 2 * T || x > (CIT_W - 2) * T || y > (CIT_H - 1.5) * T;
    return [[-8, 0], [8, 0], [0, -6], [0, 10]].some(([ox, oy]) => solidRift(x + ox, y + oy));
  };

  function findTarget() {
    if (mode === "citadel") {
      for (const st of STATIONS) {
        if (Math.hypot((st.x + 0.5) * T - px, (st.y + 0.5) * T - py) < 52) {
          return {
            label: st.name,
            go: () => {
              if (st.id === "rift") riftGateMenu();
              else if (st.id === "forge") forgePage();
              else if (st.id === "caravan") caravanPage();
              else if (st.id === "zodiac") zodiacPage();
              else cleanupAndLeave();
            },
          };
        }
      }
      return null;
    }
    if (!rift) return null;
    for (const p of rift.pylons) {
      if (!p.lit && Math.hypot(p.x - px, p.y - py) < 48) {
        return {
          label: "Attune Resonance Pylon",
          go: () => {
            p.lit = true;
            runBag.motes += 6 + rift.floor * 2;
            burst(p.x, p.y, rift.tier.accent, 26);
            api.ping("choice");
            const litN = rift.pylons.filter((q) => q.lit).length;
            if (litN >= 3 && !rift.bossSpawned) {
              rift.bossSpawned = true;
              const bhp = 24 + rift.floor * 9;
              rift.foes.push({
                id: 999, x: rift.portal.x, y: rift.portal.y, hp: bhp, maxHp: bhp,
                speed: 88 + Math.min(40, rift.floor * 3), elite: true, boss: true, cd: 0.9, hitT: 0,
              });
              sayToast(`${rift.tier.bossName} has awakened at the Rift Portal!`);
            } else {
              sayToast(`Pylon attuned (${litN}/3)!`);
            }
            syncHud();
          },
        };
      }
    }
    for (const ch of rift.caches) {
      if (!ch.opened && Math.hypot(ch.x - px, ch.y - py) < 44) {
        return {
          label: "Crack Runic Cache",
          go: () => {
            ch.opened = true;
            const gm = 5 + rift.floor * 2, gc = 15 + rift.floor * 6;
            runBag.motes += gm; runBag.mon += gc;
            burst(ch.x, ch.y, "#ffd84d", 22);
            api.ping("done");
            sayToast(`Runic Cache: +${gm} Motes & +${gc} Mon!`);
            syncHud();
          },
        };
      }
    }
    if (rift.portal.active && Math.hypot(rift.portal.x - px, rift.portal.y - py) < 54) {
      return {
        label: `Rift Portal (F${rift.floor + 1} or Extract)`,
        go: () => openPage(`Floor ${rift.floor} Cleared!`, `<p>Unbanked haul: <strong>+${runBag.motes} Astral Motes</strong> &amp; <strong>+${runBag.mon} Mon</strong>.</p>
          <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:12px">
            <button type="button" class="btn btn-accent" id="nx-deeper">Descend to Floor ${rift.floor + 1} (+1 ♥)</button>
            <button type="button" class="btn" id="nx-extract">Extract Safely to Citadel</button>
          </div>`, (el) => {
          el.querySelector("#nx-deeper").onclick = () => enterRift(rift.floor + 1);
          el.querySelector("#nx-extract").onclick = () => { closePage(); extractRift(true); };
        }),
      };
    }
    return null;
  }

  function triggerDash() {
    if (mode !== "rift" || dashCd > 0) return;
    const st = nexusStats(s);
    dashT = 0.22;
    invT = Math.max(invT, 0.36);
    dashCd = Math.max(0.45, 1.15 * (1 - st.dash / 100));
    burst(px, py, "#7fd0ff", 12);
    api.ping("blip");
  }

  function update(dt, now) {
    if (toastT && now > toastT) { toastEl.hidden = true; toastT = 0; }
    if (!pageEl.hidden) return;

    const st = nexusStats(s);
    let ax = 0, ay = 0;
    if (keys.has("a") || keys.has("ArrowLeft")) ax--;
    if (keys.has("d") || keys.has("ArrowRight")) ax++;
    if (keys.has("w") || keys.has("ArrowUp")) ay--;
    if (keys.has("s") || keys.has("ArrowDown")) ay++;
    if (joy && Math.hypot(joy.x, joy.y) > 0.16) { ax = joy.x; ay = joy.y; }

    moving = !!(ax || ay);
    dashT = Math.max(0, dashT - dt);
    dashCd = Math.max(0, dashCd - dt);
    invT = Math.max(0, invT - dt);
    boltCd = Math.max(0, boltCd - dt);
    wispAng += dt * 3.1;

    if (moving) {
      const m = Math.hypot(ax, ay) || 1;
      const spd = (dashT > 0 ? 470 : 205 * (1 + st.speed / 100)) * dt;
      const nxX = px + (ax / m) * spd, nxY = py + (ay / m) * spd;
      if (!blockedAt(nxX, py)) px = nxX;
      if (!blockedAt(px, nxY)) py = nxY;
      dir = Math.abs(ax) > Math.abs(ay) ? (ax < 0 ? "left" : "right") : ay < 0 ? "up" : "down";
      step += dt * 13;
    }

    if (mode === "rift" && rift) {
      // Auto-cast Star-Bolts at nearest phantom
      if (boltCd <= 0 && rift.foes.length) {
        let near = null, bd = 290;
        for (const f of rift.foes) {
          const d = Math.hypot(f.x - px, f.y - py);
          if (d < bd) { bd = d; near = f; }
        }
        if (near) {
          const a = Math.atan2(near.y - py, near.x - px);
          bolts.push({ x: px, y: py - 8, vx: Math.cos(a) * 420, vy: Math.sin(a) * 420, life: 0.85, dmg: st.dmg });
          boltCd = 0.38 / (1 + st.rate / 100);
        }
      }

      // Orbital Wisps collision
      const nWisps = st.wisps;
      const wispPts = Array.from({ length: nWisps }, (_, i) => {
        const a = wispAng + (i * Math.PI * 2) / nWisps;
        return [px + Math.cos(a) * 42, py - 6 + Math.sin(a) * 42];
      });

      for (const b of bolts) {
        b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
        if (solidRift(b.x, b.y)) b.life = 0;
      }

      for (const f of rift.foes) {
        f.hitT = Math.max(0, f.hitT - dt);
        const dx = px - f.x, dy = py - f.y, d = Math.hypot(dx, dy) || 1;
        if (d < 360) {
          const vx = (dx / d) * f.speed * dt, vy = (dy / d) * f.speed * dt;
          if (!solidRift(f.x + vx, f.y)) f.x += vx;
          if (!solidRift(f.x, f.y + vy)) f.y += vy;
        }
        if ((f.elite || f.boss) && d < 320 && (f.cd -= dt) <= 0) {
          f.cd = f.boss ? 1.05 : 1.7;
          const baseA = Math.atan2(dy, dx), spread = f.boss ? [-0.28, 0, 0.28] : [0];
          for (const da of spread) {
            enemyShots.push({ x: f.x, y: f.y, vx: Math.cos(baseA + da) * 210, vy: Math.sin(baseA + da) * 210, life: 2.2 });
          }
        }
        // Bolt hits
        for (const b of bolts) {
          if (b.life > 0 && Math.hypot(b.x - f.x, b.y - f.y) < (f.boss ? 28 : 18)) {
            b.life = 0; f.hp -= b.dmg; f.hitT = 0.12;
            burst(f.x, f.y, rift.tier.accent, 6);
          }
        }
        // Wisp hits
        if (f.hitT <= 0) {
          for (const [wx, wy] of wispPts) {
            if (Math.hypot(wx - f.x, wy - f.y) < (f.boss ? 26 : 16)) {
              f.hp -= st.dmg; f.hitT = 0.28;
              burst(f.x, f.y, "#ffd84d", 5);
              break;
            }
          }
        }
        // Contact damage
        if (invT <= 0 && d < (f.boss ? 26 : 17)) {
          hp--; invT = 0.95; api.ping("close"); burst(px, py, "#ff5a7a", 16); syncHud();
          if (hp <= 0) return failRift();
        }
      }

      bolts = bolts.filter((b) => b.life > 0);
      const dead = rift.foes.filter((f) => f.hp <= 0);
      if (dead.length) {
        rift.foes = rift.foes.filter((f) => f.hp > 0);
        for (const f of dead) {
          nx.kills++;
          runBag.motes += f.boss ? 18 + rift.floor * 4 : f.elite ? 5 : 2;
          runBag.mon += f.boss ? 45 + rift.floor * 12 : 4;
          burst(f.x, f.y, f.boss ? "#ffd84d" : rift.tier.foeColor, f.boss ? 36 : 12);
          if (f.boss) {
            rift.bossCleared = true;
            rift.portal.active = true;
            nx.bestFloor = Math.max(nx.bestFloor, rift.floor);
            api.save();
            api.ping("done");
            sayToast(`${rift.tier.bossName} vanquished! Step into the Rift Portal!`);
          }
        }
        syncHud();
      }

      for (const s2 of enemyShots) {
        s2.x += s2.vx * dt; s2.y += s2.vy * dt; s2.life -= dt;
        if (solidRift(s2.x, s2.y)) s2.life = 0;
        if (invT <= 0 && Math.hypot(s2.x - px, s2.y - py) < 14) {
          s2.life = 0; hp--; invT = 0.95; api.ping("close"); burst(px, py, "#ff5a7a", 16); syncHud();
          if (hp <= 0) return failRift();
        }
      }
      enemyShots = enemyShots.filter((q) => q.life > 0);
    }

    for (const p of sparks) { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt * 1.4; }
    sparks = sparks.filter((p) => p.life > 0);

    const nt = findTarget();
    if (nt?.label !== target?.label) {
      promptEl.hidden = !nt;
      if (nt) promptEl.innerHTML = `<kbd>E</kbd> ${esc(nt.label)}`;
    }
    target = nt;
  }

  function draw(now) {
    const vw = cw / zoom, vh = ch / zoom;
    const maxW = (mode === "citadel" ? CIT_W : NX_W) * T, maxH = (mode === "citadel" ? CIT_H : NX_H) * T;
    const camX = Math.max(0, Math.min(maxW - vw, px - vw / 2));
    const camY = Math.max(0, Math.min(maxH - vh, py - vh / 2));

    g.save();
    g.fillStyle = mode === "citadel" ? "#070b1e" : rift.tier.bg;
    g.fillRect(0, 0, cw, ch);

    // Parallax starfield
    g.fillStyle = "rgba(220,235,255,.55)";
    for (const st of stars) {
      const sx = ((st.x - camX * 0.25) % cw + cw) % cw;
      const sy = ((st.y - camY * 0.25) % ch + ch) % ch;
      g.fillRect(sx, sy, st.s, st.s);
    }

    g.scale(zoom, zoom);
    g.translate(-Math.round(camX), -Math.round(camY));

    if (mode === "citadel") {
      g.fillStyle = "#131b3a";
      g.strokeStyle = "#3a4f8c";
      g.lineWidth = 3;
      g.beginPath();
      g.roundRect(2 * T, 2 * T, (CIT_W - 4) * T, (CIT_H - 3) * T, 18);
      g.fill(); g.stroke();

      // Golden astral floor lines
      g.strokeStyle = "rgba(127,208,255,.16)";
      g.lineWidth = 1.5;
      g.beginPath();
      g.arc(15.5 * T, 11.5 * T, 150, 0, Math.PI * 2);
      g.arc(15.5 * T, 11.5 * T, 90, 0, Math.PI * 2);
      g.stroke();

      for (const st of STATIONS) {
        const sx = (st.x + 0.5) * T, sy = (st.y + 0.5) * T, bob = Math.sin(now / 420 + st.x) * 3;
        g.fillStyle = "rgba(0,0,0,.35)";
        g.beginPath(); g.ellipse(sx, sy + 14, 24, 9, 0, 0, 7); g.fill();
        g.fillStyle = st.color;
        g.strokeStyle = "#fff";
        g.lineWidth = 2;
        g.beginPath(); g.arc(sx, sy - 6 + bob, 16, 0, 7); g.fill(); g.stroke();
        g.font = "800 11px system-ui"; g.textAlign = "center";
        g.fillStyle = "#fff"; g.fillText(st.name, sx, sy - 30 + bob);
        g.font = "600 9.5px system-ui"; g.fillStyle = "rgba(255,255,255,.72)";
        g.fillText(st.sub, sx, sy + 28);
      }
    } else if (rift) {
      const x0 = Math.max(0, Math.floor(camX / T)), x1 = Math.min(NX_W - 1, Math.ceil((camX + vw) / T));
      const y0 = Math.max(0, Math.floor(camY / T)), y1 = Math.min(NX_H - 1, Math.ceil((camY + vh) / T));
      for (let y = y0; y <= y1; y++) {
        for (let x = x0; x <= x1; x++) {
          const wall = rift.g[y * NX_W + x] === 1;
          g.fillStyle = wall ? rift.tier.wall : rift.tier.floor;
          g.fillRect(x * T, y * T, T, T);
          if (!wall && (x + y) % 2 === 0) {
            g.fillStyle = "rgba(255,255,255,.03)";
            g.fillRect(x * T + 2, y * T + 2, T - 4, T - 4);
          }
        }
      }

      // Portal
      {
        const p = rift.portal;
        g.strokeStyle = p.active ? "#7dff8a" : "rgba(255,255,255,.25)";
        g.lineWidth = 3;
        g.beginPath(); g.arc(p.x, p.y, 22 + Math.sin(now / 250) * 2, 0, 7); g.stroke();
        if (p.active) {
          g.fillStyle = "rgba(125,255,138,.25)";
          g.beginPath(); g.arc(p.x, p.y, 18, 0, 7); g.fill();
        }
      }

      // Caches & Pylons
      for (const ch of rift.caches) {
        if (ch.opened) continue;
        g.fillStyle = "#ffd84d"; g.strokeStyle = "#221600"; g.lineWidth = 2;
        g.fillRect(ch.x - 11, ch.y - 9, 22, 18); g.strokeRect(ch.x - 11, ch.y - 9, 22, 18);
      }
      for (const p of rift.pylons) {
        g.fillStyle = p.lit ? rift.tier.accent : "#3a4058";
        g.strokeStyle = "#fff"; g.lineWidth = 2;
        g.beginPath();
        g.moveTo(p.x, p.y - 22); g.lineTo(p.x + 12, p.y); g.lineTo(p.x, p.y + 12); g.lineTo(p.x - 12, p.y);
        g.closePath(); g.fill(); g.stroke();
      }

      // Foes
      for (const f of rift.foes) {
        const r = f.boss ? 24 : f.elite ? 15 : 12;
        g.fillStyle = f.hitT > 0 ? "#fff" : f.boss ? "#ffd84d" : rift.tier.foeColor;
        g.strokeStyle = "#120c1c"; g.lineWidth = 2;
        g.beginPath(); g.arc(f.x, f.y, r, 0, 7); g.fill(); g.stroke();
        if (f.boss || f.hp < f.maxHp) {
          const bw = f.boss ? 56 : 28;
          g.fillStyle = "#0009"; g.fillRect(f.x - bw / 2, f.y - r - 10, bw, 5);
          g.fillStyle = "#ff5a7a"; g.fillRect(f.x - bw / 2, f.y - r - 10, bw * Math.max(0, f.hp / f.maxHp), 5);
        }
      }

      // Shots & Wisps
      g.fillStyle = "#7fd0ff";
      for (const b of bolts) { g.beginPath(); g.arc(b.x, b.y, 4.5, 0, 7); g.fill(); }
      g.fillStyle = "#ff5a7a";
      for (const q of enemyShots) { g.beginPath(); g.arc(q.x, q.y, 5.5, 0, 7); g.fill(); }

      const nWisps = nexusStats(s).wisps;
      for (let i = 0; i < nWisps; i++) {
        const a = wispAng + (i * Math.PI * 2) / nWisps;
        const wx = px + Math.cos(a) * 42, wy = py - 6 + Math.sin(a) * 42;
        g.fillStyle = "rgba(255,216,77,.32)"; g.beginPath(); g.arc(wx, wy, 9, 0, 7); g.fill();
        g.fillStyle = "#ffd84d"; g.beginPath(); g.arc(wx, wy, 4.5, 0, 7); g.fill();
      }
    }

    if (!(invT > 0 && Math.floor(now / 80) % 2)) {
      api.drawFox(g, px, py, dir, step, api.fur, api.tails, s.hat, now, moving);
    }

    for (const p of sparks) {
      g.globalAlpha = Math.max(0, p.life);
      g.fillStyle = p.c;
      g.fillRect(p.x - 2.5, p.y - 2.5, 5, 5);
    }
    g.globalAlpha = 1;
    g.restore();
  }

  function frame(now) {
    if (!alive) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    update(dt, now);
    draw(now);
    raf = requestAnimationFrame(frame);
  }

  const onKey = (e) => {
    if (!host.isConnected || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    e.stopPropagation();
    if (k === "Escape") {
      e.preventDefault();
      if (!pageEl.hidden) closePage();
      else if (mode === "rift") extractRift(false);
      else cleanupAndLeave();
      return;
    }
    if (!pageEl.hidden) return;
    if (["w", "a", "s", "d", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(k)) {
      e.preventDefault(); keys.add(k); return;
    }
    if (k === "Shift" || k === " ") { e.preventDefault(); if (!e.repeat) triggerDash(); return; }
    if (k === "e" || k === "Enter") { e.preventDefault(); if (!e.repeat && target) target.go(); return; }
    if (k === "1") forgePage();
    else if (k === "2") caravanPage();
    else if (k === "3") zodiacPage();
  };
  const onUp = (e) => keys.delete(e.key.length === 1 ? e.key.toLowerCase() : e.key);
  const onBlur = () => keys.clear();
  window.addEventListener("keydown", onKey, true);
  window.addEventListener("keyup", onUp, true);
  window.addEventListener("blur", onBlur);

  const pad = host.querySelector("#nx-pad"), knob = pad.querySelector("i");
  pad.onpointerdown = (e) => { pad.setPointerCapture(e.pointerId); joy = { x: 0, y: 0 }; pad.onpointermove(e); };
  pad.onpointermove = (e) => {
    if (!joy) return;
    const r = pad.getBoundingClientRect();
    const x = (e.clientX - r.left - r.width / 2) / (r.width / 2);
    const y = (e.clientY - r.top - r.height / 2) / (r.height / 2);
    const m = Math.max(1, Math.hypot(x, y));
    joy = { x: x / m, y: y / m };
    knob.style.transform = `translate(${joy.x * 28}px,${joy.y * 28}px)`;
  };
  pad.onpointerup = pad.onpointercancel = () => { joy = null; knob.style.transform = ""; };

  promptEl.onclick = () => target?.go();
  host.querySelector("#nx-act").onclick = () => (target ? target.go() : triggerDash());
  host.querySelector("#nx-b-forge").onclick = forgePage;
  host.querySelector("#nx-b-caravan").onclick = caravanPage;
  host.querySelector("#nx-b-zodiac").onclick = zodiacPage;
  host.querySelector("#nx-leave").onclick = () => (mode === "rift" ? extractRift(false) : cleanupAndLeave());

  function cleanup() {
    alive = false;
    cancelAnimationFrame(raf);
    ro.disconnect();
    window.removeEventListener("keydown", onKey, true);
    window.removeEventListener("keyup", onUp, true);
    window.removeEventListener("blur", onBlur);
  }
  function cleanupAndLeave() {
    cleanup();
    api.leave();
  }

  syncHud();
  raf = requestAnimationFrame(frame);
  return cleanup;
}
