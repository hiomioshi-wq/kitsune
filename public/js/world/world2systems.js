// Kitsune World 2 gameplay systems: wandering critters, treasure digging, Alchemy Charms,
// Star-Wheel Pavilion, Pearl Dive, Star-Card Clash, Starfall Labyrinth, Bounty Board, Museum, and Star-Garden.
import { W2, T2, W2_REGIONS, w2RegionAt, W2_RELICS, W2_CRITTERS, W2_FISH, W2_CHARMS, W2_BOUNTIES, W2_CROPS, W2_WORKSHOP, W2_CONSTELLATIONS, W2_FAMILIARS } from "./world2data.js";
import { FURNITURE } from "./data.js";
import { furnitureUrl } from "./art.js";

const esc = (x) => String(x).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export function createW2Critters(map, w2) {
  const list = [];
  const open = map.open || [];
  if (open.length) {
    let h = 991;
    for (let i = 0; i < 240; i++) {
      h = (Math.imul(h ^ (h >>> 13), 1274126177) + i + 17) >>> 0;
      const idx = open[h % open.length];
      const sp = W2_CRITTERS[i % W2_CRITTERS.length];
      list.push({
        id: i, sp,
        x: ((idx % W2) + 0.5) * T2,
        y: (Math.floor(idx / W2) + 0.5) * T2,
        vx: 0, vy: 0, t: Math.random() * 4, caught: false,
      });
    }
  }
  return {
    list,
    update(dt, blocked) {
      for (const c of list) {
        if (c.caught) continue;
        c.t -= dt;
        if (c.t <= 0) {
          c.t = 1.2 + Math.random() * 2.4;
          const a = Math.random() * 6.283;
          const spd = Math.random() < 0.35 ? 0 : 22 + Math.random() * 26;
          c.vx = Math.cos(a) * spd;
          c.vy = Math.sin(a) * spd;
        }
        const nx = c.x + c.vx * dt, ny = c.y + c.vy * dt;
        if (!blocked(nx, c.y)) c.x = nx; else c.vx *= -1;
        if (!blocked(c.x, ny)) c.y = ny; else c.vy *= -1;
      }
    },
    draw(g, things, x, y, vw, vh, now) {
      for (const c of list) {
        if (c.caught || Math.abs(c.x - x) > vw || Math.abs(c.y - y) > vh) continue;
        things.push([c.y + 8, () => {
          const bob = Math.sin(now / 180 + c.id) * 3;
          g.fillStyle = "rgba(0,0,0,0.2)";
          g.beginPath(); g.ellipse(c.x, c.y + 8, 6, 2.5, 0, 0, 7); g.fill();
          g.fillStyle = c.sp[2];
          g.beginPath(); g.arc(c.x, c.y - 4 + bob, 5.5, 0, 7); g.fill();
          g.fillStyle = "#fff";
          g.beginPath(); g.arc(c.x - 1.5, c.y - 5.5 + bob, 1.8, 0, 7); g.fill();
        }]);
      }
    },
    near(x, y) { return list.find((c) => !c.caught && Math.hypot(c.x - x, c.y - y) < 44); },
    catch(c, api, burst, sayToast, hud, addXp) {
      c.caught = true;
      w2.crittersCaught = (w2.crittersCaught || 0) + 1;
      w2.critters ||= {};
      w2.critters[c.sp[0]] = (w2.critters[c.sp[0]] || 0) + 1;
      const pay = c.sp[3] + (w2.perms?.net ? 10 : 0);
      api.addMon(pay);
      addXp?.(12);
      api.ping("done");
      burst(c.x, c.y, 16);
      sayToast(`Caught ${c.sp[1]}! (+${pay} mon)`);
      api.save();
      hud();
    },
  };
}

export function digSpotsW2(map, w2, todayStr) {
  w2.dig ||= { day: todayStr, found: {}, total: 0 };
  if (w2.dig.day !== todayStr) { w2.dig.day = todayStr; w2.dig.found = {}; }
  const open = map.open || [];
  let h = 421;
  for (const ch of w2.dig.day) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return Array.from({ length: 20 }, (_, n) => {
    h = (Math.imul(h ^ (h >>> 13), 1274126177) + n + 19) >>> 0;
    const idx = open[h % open.length];
    const x = idx % W2, y = Math.floor(idx / W2);
    return { n, x, y, region: w2RegionAt(x, y) };
  });
}

export function digHereW2({ map, w2, todayStr, api, burst, sayToast, hud, addXp }) {
  const spots = digSpotsW2(map, w2, todayStr);
  const left = spots.filter((q) => !w2.dig.found[q.n]);
  burst(w2.x, w2.y + 18, 8);
  api.ping("blip");
  if (!left.length) return sayToast("You've unearthed all 20 World 2 treasures today! New maps tomorrow.");
  const tx = w2.x / T2, ty = w2.y / T2;
  const q = [...left].sort((a, b) => Math.hypot(a.x - tx, a.y - ty) - Math.hypot(b.x - tx, b.y - ty))[0];
  const d = Math.hypot(q.x + 0.5 - tx, q.y + 0.5 - ty);
  if (d < 2.5) {
    w2.dig.found[q.n] = 1;
    w2.dig.total = (w2.dig.total || 0) + 1;
    const rel = W2_RELICS[(q.x + q.y) % W2_RELICS.length];
    const pay = 85 + ((q.x * 7 + q.y * 3) % 140) + (w2.perms?.spade ? 50 : 0);
    w2.bag[rel[0]] = (w2.bag[rel[0]] || 0) + 2;
    api.addMon(pay);
    addXp?.(25);
    api.ping("done");
    burst(w2.x, w2.y, 36);
    api.save();
    hud();
    return sayToast(`Treasure! +${pay} mon & 2 ${rel[1]} (${Object.keys(w2.dig.found).length}/20 today)`);
  }
  const dx = q.x - tx, dy = q.y - ty;
  const way = (Math.abs(dy) > Math.abs(dx) * 0.45 ? (dy < 0 ? "north" : "south") : "") + (Math.abs(dx) > Math.abs(dy) * 0.45 ? (dx < 0 ? "west" : "east") : "");
  const heat = d > 130 ? "Freezing" : d > 65 ? "Cold" : d > 28 ? "Warm" : d > 9 ? "Hot" : "Burning hot";
  sayToast(d > 50 ? `${heat} — compass points ${way} toward ${W2_REGIONS[q.region][0]}.` : `${heat} — dig further ${way}!`);
}

export function openAlchemyUI({ s, w2, api, page, sayToast }) {
  w2.charms ||= {};
  const relicName = (id) => W2_RELICS.find((r) => r[0] === id)?.[1] || id;
  const rows = W2_CHARMS.map((ch) => {
    const owned = !!w2.charms[ch.id];
    const canRelics = Object.entries(ch.cost).every(([k, n]) => (w2.bag[k] || 0) >= n);
    const can = !owned && canRelics && s.mon >= ch.mon;
    const costStr = Object.entries(ch.cost).map(([k, n]) => `${n} ${relicName(k)} (${w2.bag[k] || 0})`).join(" + ");
    return `<div><strong>${esc(ch.name)}</strong><span class="muted">${esc(ch.desc)}</span><span class="muted">${esc(costStr)} · ${ch.mon} mon</span>${owned ? `<span style="color:#7dff8a;font-weight:800">Active ✓</span>` : `<button class="btn btn-accent" data-ch="${ch.id}" ${can ? "" : "disabled"}>Brew Charm</button>`}</div>`;
  }).join("");
  page("Starfall Alchemy", `<p class="muted">Brew permanent World 2 Charms from your Relics.</p><div class="wd-goods">${rows}</div>`, (el) => {
    el.querySelectorAll("[data-ch]").forEach((b) => (b.onclick = () => {
      const ch = W2_CHARMS.find((x) => x.id === b.dataset.ch);
      if (!ch || w2.charms[ch.id] || s.mon < ch.mon) return;
      if (!Object.entries(ch.cost).every(([k, n]) => (w2.bag[k] || 0) >= n)) return;
      for (const [k, n] of Object.entries(ch.cost)) w2.bag[k] -= n;
      api.addMon(-ch.mon);
      w2.charms[ch.id] = 1;
      api.ping("done");
      api.save();
      sayToast(`${ch.name} brewed and active!`);
      openAlchemyUI({ s, w2, api, page, sayToast });
    }));
  });
}

export function openStarWheelUI({ s, w2, api, page, sayToast }) {
  if ((w2.wheel || 0) >= 5) return sayToast("The Star-Wheel rests after 5 spins a day.");
  const prizes = [
    { label: "150 mon", fn: () => api.addMon(150) },
    { label: "60 mon", fn: () => api.addMon(60) },
    { label: "30 mon", fn: () => api.addMon(30) },
    { label: "2 Rare Relics", fn: () => { const r = W2_RELICS[Math.floor(Math.random() * W2_RELICS.length)]; w2.bag[r[0]] = (w2.bag[r[0]] || 0) + 2; } },
    { label: "Star-Wheel Lucky Cap", fn: () => { if (!s.hats.includes("w2_luckycap")) api.giveHat("w2_luckycap"); else api.addMon(90); } },
    { label: "Tabletop Star-Wheel", fn: () => { if (!s.furn.w2_starwheelmini) api.giveFurn("w2_starwheelmini"); else api.addMon(90); } },
  ];
  page("Star-Wheel Pavilion", `<p class="muted">Spin the Astral Wheel for 25 mon! (${5 - (w2.wheel || 0)} spins left today)</p><div id="sw-res" class="by-big" style="margin:20px 0">🎡 Ready</div><button class="btn btn-accent" id="sw-go" ${s.mon < 25 ? "disabled" : ""}>Spin Wheel (25 mon)</button>`, (el) => {
    el.querySelector("#sw-go").onclick = () => {
      if (s.mon < 25 || (w2.wheel || 0) >= 5) return;
      api.addMon(-25);
      w2.wheel = (w2.wheel || 0) + 1;
      const p = prizes[Math.floor(Math.random() * prizes.length)];
      p.fn();
      api.ping("done");
      api.save();
      el.querySelector("#sw-res").textContent = `✨ ${p.label}!`;
      if ((w2.wheel || 0) >= 5 || s.mon < 25) el.querySelector("#sw-go").disabled = true;
    };
  });
}

export function openPearlDiveUI({ w2, api, page, sayToast }) {
  if ((w2.dive || 0) >= 3) return sayToast("The lagoon tide is resting. 3 dives per day!");
  w2.dive = (w2.dive || 0) + 1;
  let picks = 3, monWon = 0;
  const shells = Array.from({ length: 9 }, (_, i) => ({
    i, opened: false, type: i < 3 ? "pearl" : i < 6 ? "mon" : "empty",
  })).sort(() => Math.random() - 0.5);
  const render = () => {
    page("Coral Crown Pearl Dive", `<p class="muted">Open 3 oyster shells (${picks} picks left). Find Coral Pearls and sunken mon!</p><div style="display:grid;grid-template-columns:repeat(3,88px);gap:10px;justify-content:center;margin:16px 0">${shells.map((sh, idx) => `<button class="btn" style="height:68px;font-size:22px" data-sh="${idx}" ${sh.opened || !picks ? "disabled" : ""}>${!sh.opened ? "🦪" : sh.type === "pearl" ? "🫧" : sh.type === "mon" ? "🪙" : "🌿"}</button>`).join("")}</div><p><strong>Won so far: ${monWon} mon</strong></p>`, (el) => {
      el.querySelectorAll("[data-sh]").forEach((b) => (b.onclick = () => {
        const sh = shells[+b.dataset.sh];
        if (sh.opened || !picks) return;
        sh.opened = true; picks--;
        if (sh.type === "pearl") { w2.bag.coralpearl = (w2.bag.coralpearl || 0) + 1; monWon += 30; api.addMon(30); api.ping("done"); sayToast("Found a Coral Pearl + 30 mon!"); }
        else if (sh.type === "mon") { monWon += 45; api.addMon(45); api.ping("choice"); }
        else api.ping("blip");
        api.save();
        render();
      }));
    });
  };
  render();
}

export function openCardClashUI({ w2, api, page }) {
  const elems = [
    { id: "star", label: "⭐ Star", beats: "tide" },
    { id: "tide", label: "🌊 Tide", beats: "ember" },
    { id: "ember", label: "🔥 Ember", beats: "frost" },
    { id: "frost", label: "❄️ Frost", beats: "star" },
  ];
  let round = 1, me = 0, foe = 0, msg = "Pick an element for Round 1 (Best of 3)!";
  const render = () => {
    const over = round > 3;
    page("Moon-Glass Star-Card Clash", `
      <p class="muted">Star beats Tide · Tide beats Ember · Ember beats Frost · Frost beats Star</p>
      <div class="by-jobtop"><strong>You: ${me}</strong><strong>Archivist Selene: ${foe}</strong></div>
      <p style="margin:14px 0;font-weight:700">${esc(msg)}</p>
      ${over ? `<button class="btn btn-accent" id="cc-again">Play Again</button>` : `<div class="chips" style="justify-content:center">${elems.map((e) => `<button class="btn" data-el="${e.id}">${e.label}</button>`).join("")}</div>`}
    `, (el) => {
      if (over) el.querySelector("#cc-again").onclick = () => openCardClashUI({ w2, api, page });
      else el.querySelectorAll("[data-el]").forEach((b) => (b.onclick = () => {
        const myEl = elems.find((x) => x.id === b.dataset.el);
        const foeEl = elems[Math.floor(Math.random() * elems.length)];
        if (myEl.beats === foeEl.id) { me++; msg = `Round ${round}: ${myEl.label} beats ${foeEl.label}!`; api.ping("choice"); }
        else if (foeEl.beats === myEl.id) { foe++; msg = `Round ${round}: ${foeEl.label} beats ${myEl.label}.`; api.ping("blip"); }
        else { msg = `Round ${round}: Both played ${myEl.label} — tie!`; api.ping("blip"); }
        round++;
        if (round > 3) {
          if (me > foe) { w2.duelWins = (w2.duelWins || 0) + 1; api.addMon(65); api.ping("done"); msg += " You won! (+65 mon)"; }
          else if (me === foe) { api.addMon(20); msg += " Draw! (+20 mon)"; }
          else msg += " Selene wins this match.";
          api.save();
        }
        render();
      }));
    });
  };
  render();
}

export function openLabyrinthUI({ s, w2, api, page, closePage, addXp }) {
  const foes = [
    { name: "Star-Shade", hp: 22, atk: 5, pay: 35 },
    { name: "Clockwork Sentinel", hp: 30, atk: 7, pay: 50 },
    { name: "Frost Mirror Wraith", hp: 38, atk: 8, pay: 65 },
    { name: "Ember Basilisk", hp: 46, atk: 10, pay: 85 },
    { name: "The Astral Warden (Boss)", hp: 66, atk: 12, pay: 250 },
  ];
  let floor = 1, hp = 50 + (w2.level || 1) * 4, maxHp = hp, flasks = 3, foe = { ...foes[0] };
  let log = `Floor 1: A ${foe.name} blocks the starlight stair!`;
  const render = () => {
    const dead = hp <= 0, wonAll = floor > 5;
    page(`Starfall Labyrinth · Floor ${Math.min(5, floor)}/5`, `
      <div class="by-jobtop"><strong>Fox HP: ${Math.max(0, hp)}/${maxHp} · 🧪 ${flasks}</strong><strong>${wonAll ? "Cleared!" : `${esc(foe.name)}: ${Math.max(0, foe.hp)} HP`}</strong></div>
      <p style="margin:16px 0;font-weight:700">${esc(log)}</p>
      ${dead ? `<button class="btn btn-accent" id="lb-retry">Try Again</button>`
        : wonAll ? `<button class="btn btn-accent" id="lb-exit">Leave Victorious</button>`
        : `<div class="chips" style="justify-content:center">
            <button class="btn btn-accent" id="lb-hit">Foxfire Strike</button>
            <button class="btn" id="lb-burst">Star-Burst (Heavy)</button>
            <button class="btn" id="lb-heal" ${flasks ? "" : "disabled"}>Drink Flask (${flasks})</button>
          </div>`}
    `, (el) => {
      if (dead) { el.querySelector("#lb-retry").onclick = () => openLabyrinthUI({ s, w2, api, page, closePage, addXp }); return; }
      if (wonAll) { el.querySelector("#lb-exit").onclick = closePage; return; }
      const enemyTurn = () => {
        if (foe.hp <= 0) {
          api.addMon(foe.pay);
          addXp?.(30 * floor);
          api.ping("done");
          if (floor === 5) {
            w2.labyrinthCleared = (w2.labyrinthCleared || 0) + 1;
            if (!s.hats.includes("w2_labyrinthhelm")) api.giveHat("w2_labyrinthhelm");
            if (!s.furn.w2_labyrinthped) api.giveFurn("w2_labyrinthped");
            api.save();
            floor = 6;
            log = `Victory! Defeated The Astral Warden! (+250 mon, Labyrinth Warden Helm & Pedestal!)`;
          } else {
            floor++;
            foe = { ...foes[floor - 1] };
            hp = Math.min(maxHp, hp + 10);
            log = `Floor cleared! (+${foes[floor - 2].pay} mon, +10 HP). Floor ${floor}: ${foe.name} appears!`;
          }
        } else {
          const dmg = Math.max(1, foe.atk - Math.floor((w2.level || 1) / 3) + Math.floor(Math.random() * 3));
          hp -= dmg;
          log += ` ${foe.name} hits for ${dmg} dmg.`;
        }
        render();
      };
      el.querySelector("#lb-hit").onclick = () => { const d = 10 + (w2.level || 1) * 2 + Math.floor(Math.random() * 5); foe.hp -= d; log = `You strike for ${d} dmg!`; api.ping("choice"); enemyTurn(); };
      el.querySelector("#lb-burst").onclick = () => { const d = Math.random() < 0.72 ? 18 + (w2.level || 1) * 3 : 4; foe.hp -= d; log = d > 10 ? `Star-Burst blasts for ${d} dmg!` : `Star-Burst fizzles (${d} dmg)!`; api.ping("choice"); enemyTurn(); };
      el.querySelector("#lb-heal").onclick = () => { if (!flasks) return; flasks--; hp = Math.min(maxHp, hp + 26); log = "Drank a Star-Flask (+26 HP)."; api.ping("blip"); enemyTurn(); };
    });
  };
  render();
}

export function openBountyBoardUI({ s, w2, api, page, addXp }) {
  w2.bounties ||= {};
  const rows = W2_BOUNTIES.map((b) => {
    const done = !!w2.bounties[b.id];
    return `<div><strong>${esc(b.name)} (Lv.${b.lv})</strong><span class="muted">${esc(b.region)} · Reward: ${b.pay} mon</span><button class="btn${done ? "" : " btn-accent"}" data-bn="${b.id}">${done ? "Rematch" : "Hunt"}</button></div>`;
  }).join("");
  page("Frontier Bounty Board", `<p class="muted">Hunt all 6 Frontier Beasts to earn the Frontier Marshal Hat & Plaque!</p><div class="wd-goods">${rows}</div>`, (el) => {
    el.querySelectorAll("[data-bn]").forEach((btn) => (btn.onclick = () => {
      const b = W2_BOUNTIES.find((x) => x.id === btn.dataset.bn);
      let hp = 55 + (w2.level || 1) * 4, bhp = b.hp, log = `Tracking ${b.name} in ${b.region}…`;
      const fight = () => {
        page(`Bounty: ${b.name}`, `
          <div class="by-jobtop"><strong>Your HP: ${Math.max(0, hp)}</strong><strong>${esc(b.name)}: ${Math.max(0, bhp)} HP</strong></div>
          <p style="margin:16px 0;font-weight:700">${esc(log)}</p>
          ${bhp <= 0 || hp <= 0 ? `<button class="btn btn-accent" id="bn-back">Back to Board</button>` : `<div class="chips" style="justify-content:center"><button class="btn btn-accent" id="bn-atk">Attack</button><button class="btn" id="bn-dodge">Parry & Counter</button></div>`}
        `, (fEl) => {
          if (bhp <= 0 || hp <= 0) { fEl.querySelector("#bn-back").onclick = () => openBountyBoardUI({ s, w2, api, page, addXp }); return; }
          fEl.querySelector("#bn-atk").onclick = () => {
            const d = 12 + (w2.level || 1) * 2 + Math.floor(Math.random() * 6);
            bhp -= d;
            if (bhp <= 0) {
              const first = !w2.bounties[b.id];
              w2.bounties[b.id] = (w2.bounties[b.id] || 0) + 1;
              api.addMon(first ? b.pay : Math.round(b.pay / 2));
              addXp?.(40 * b.lv);
              api.ping("done");
              log = `${b.name} defeated! +${first ? b.pay : Math.round(b.pay / 2)} mon!`;
              if (W2_BOUNTIES.every((x) => w2.bounties[x.id]) && !s.hats.includes("w2_bountyhat")) {
                api.giveHat("w2_bountyhat");
                api.giveFurn("w2_bountytrophy");
                log += " All 6 bounties cleared! Frontier Marshal Hat & Plaque unlocked!";
              }
              api.save();
            } else {
              const bd = Math.max(1, b.atk - Math.floor((w2.level || 1) / 2));
              hp -= bd;
              log = `Hit for ${d}! ${b.name} strikes back for ${bd}.`;
            }
            fight();
          };
          fEl.querySelector("#bn-dodge").onclick = () => {
            const d = 8 + (w2.level || 1) * 2;
            bhp -= d;
            if (bhp <= 0) {
              w2.bounties[b.id] = (w2.bounties[b.id] || 0) + 1;
              api.addMon(b.pay);
              addXp?.(40 * b.lv);
              api.ping("done");
              log = `Counter-strike defeated ${b.name}! +${b.pay} mon!`;
              api.save();
            } else {
              const bd = Math.max(1, Math.floor(b.atk / 2));
              hp -= bd;
              log = `Parried! Dealt ${d} and took only ${bd}.`;
            }
            fight();
          };
        });
      };
      fight();
    }));
  });
}

export function openMuseumUI({ s, w2, api, page, sayToast }) {
  w2.museum ||= {};
  const donated = Object.keys(w2.museum).length;
  const items = [
    ...W2_RELICS.map((r) => ({ k: "rel:" + r[0], id: r[0], name: r[1], have: w2.bag?.[r[0]] || 0, take: () => { w2.bag[r[0]]--; } })),
    ...W2_FISH.map((f) => ({ k: "fsh:" + f[0], id: f[0], name: f[1], have: w2.fish?.[f[0]] || 0, take: () => { w2.fish[f[0]]--; } })),
    ...W2_CRITTERS.map((c) => ({ k: "crt:" + c[0], id: c[0], name: c[1], have: w2.critters?.[c[0]] || 0, take: () => { w2.critters[c[0]]--; } })),
  ];
  const rows = items.map((it) => {
    const done = !!w2.museum[it.k];
    return `<div><strong>${esc(it.name)}</strong><span class="muted">${done ? "On Display ✓" : `In Satchel: ${it.have}`}</span>${!done && it.have > 0 ? `<button class="btn btn-accent" data-don="${esc(it.k)}">Donate (+45 mon)</button>` : ""}</div>`;
  }).join("");
  page(`Starfall Museum (${donated}/${items.length})`, `<p class="muted">Donate 15 specimens to unlock the Grand Curator Hat & Display Case!</p><div class="wd-goods">${rows}</div>`, (el) => {
    el.querySelectorAll("[data-don]").forEach((b) => (b.onclick = () => {
      const it = items.find((x) => x.k === b.dataset.don);
      if (!it || w2.museum[it.k] || it.have <= 0) return;
      it.take();
      w2.museum[it.k] = 1;
      api.addMon(45);
      api.ping("done");
      if (Object.keys(w2.museum).length >= 15 && !s.hats.includes("w2_curatorhat")) {
        api.giveHat("w2_curatorhat");
        api.giveFurn("w2_museumcase");
        sayToast("15 Donations! Grand Curator Hat & Display Case unlocked!");
      }
      api.save();
      openMuseumUI({ s, w2, api, page, sayToast });
    }));
  });
}

export function createW2Garden(w2) {
  w2.garden ||= {};
  const x0 = 792, y0 = 601, cols = 6, rows = 2;
  return {
    drawGround(g) {
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const tx = x0 + c, ty = y0 + r, k = `${tx},${ty}`;
          const cell = w2.garden[k];
          g.fillStyle = cell ? "#5a3c24" : "#785334";
          g.fillRect(tx * T2 + 2, ty * T2 + 2, T2 - 4, T2 - 4);
          g.strokeStyle = "#3a2415";
          g.strokeRect(tx * T2 + 2, ty * T2 + 2, T2 - 4, T2 - 4);
          if (cell) {
            const crop = W2_CROPS.find((q) => q.id === cell.id);
            const ready = Date.now() >= cell.at;
            g.fillStyle = ready ? (crop?.col || "#ffd84d") : "#64b868";
            g.beginPath();
            g.arc((tx + 0.5) * T2, (ty + 0.5) * T2, ready ? 9 : 5, 0, 7);
            g.fill();
          }
        }
      }
    },
    target(px, py) {
      const tx = Math.floor(px / T2), ty = Math.floor(py / T2);
      if (tx < x0 || tx >= x0 + cols || ty < y0 || ty >= y0 + rows) return null;
      const k = `${tx},${ty}`, cell = w2.garden[k];
      if (!cell) return { label: "Plant Star-Garden Crop", k, act: "plant" };
      if (Date.now() >= cell.at) return { label: "Harvest Crop", k, act: "harvest" };
      const left = Math.ceil((cell.at - Date.now()) / 1000);
      return { label: `Growing (${left}s left)`, k, act: "wait" };
    },
    interact(t, { s, api, page, closePage, sayToast, burst, hud }) {
      if (t.act === "harvest") {
        const cell = w2.garden[t.k];
        const crop = W2_CROPS.find((q) => q.id === cell.id);
        delete w2.garden[t.k];
        api.addMon(crop?.pay || 50);
        api.ping("done");
        burst(w2.x, w2.y, 18);
        sayToast(`Harvested ${crop?.name || "crop"}! (+${crop?.pay || 50} mon)`);
        api.save();
        hud();
      } else if (t.act === "plant") {
        page("Star-Garden Seeds", `<div class="wd-goods">${W2_CROPS.map((c) => `<div><strong>${esc(c.name)}</strong><span class="muted">Grows in ${c.sec}s · Sells for ${c.pay} mon</span><button class="btn btn-accent" data-seed="${c.id}" ${s.mon < c.cost ? "disabled" : ""}>Plant (${c.cost} mon)</button></div>`).join("")}</div>`, (el) => {
          el.querySelectorAll("[data-seed]").forEach((b) => (b.onclick = () => {
            const c = W2_CROPS.find((x) => x.id === b.dataset.seed);
            if (!c || s.mon < c.cost) return;
            api.addMon(-c.cost);
            w2.garden[t.k] = { id: c.id, at: Date.now() + c.sec * 1000 };
            api.ping("choice");
            api.save();
            closePage();
          }));
        });
      } else {
        sayToast("Watered with starlight — almost ready!");
      }
    },
  };
}

export function openWorkshopUI({ s, w2, api, page, sayToast, addXp }) {
  w2.perms ||= {};
  const relicName = (id) => W2_RELICS.find((r) => r[0] === id)?.[1] || id;
  const rows = W2_WORKSHOP.map((w) => {
    const owned = w.perm && !!w2.perms[w.perm];
    const canRel = Object.entries(w.cost).every(([k, n]) => (w2.bag[k] || 0) >= n);
    const can = !owned && canRel && s.mon >= w.mon;
    const costStr = Object.entries(w.cost).map(([k, n]) => `${n} ${relicName(k)} (${w2.bag[k] || 0})`).join(" + ");
    return `<div><strong>${esc(w.name)}</strong><span class="muted">${esc(w.desc)}</span><span class="muted">${esc(costStr)} · ${w.mon} mon</span>${owned ? `<span style="color:#7dff8a;font-weight:800">Owned ✓</span>` : `<button class="btn btn-accent" data-wk="${w.id}" ${can ? "" : "disabled"}>Craft</button>`}</div>`;
  }).join("");
  page("Starfall Workshop", `<p class="muted">Craft tonics, kits, and permanent frontier tool upgrades.</p><div class="wd-goods">${rows}</div>`, (el) => {
    el.querySelectorAll("[data-wk]").forEach((b) => (b.onclick = () => {
      const w = W2_WORKSHOP.find((x) => x.id === b.dataset.wk);
      if (!w || (w.perm && w2.perms[w.perm]) || s.mon < w.mon) return;
      if (!Object.entries(w.cost).every(([k, n]) => (w2.bag[k] || 0) >= n)) return;
      for (const [k, n] of Object.entries(w.cost)) w2.bag[k] -= n;
      api.addMon(-w.mon);
      if (w.pay) api.addMon(w.pay);
      if (w.xp) addXp?.(w.xp);
      if (w.relics) for (let i = 0; i < w.relics; i++) { const r = W2_RELICS[Math.floor(Math.random() * W2_RELICS.length)]; w2.bag[r[0]] = (w2.bag[r[0]] || 0) + 1; }
      if (w.perm) w2.perms[w.perm] = 1;
      api.ping("done");
      api.save();
      sayToast(`Crafted ${w.name}!`);
      openWorkshopUI({ s, w2, api, page, sayToast, addXp });
    }));
  });
}

export function openGuildUI({ s, w2, todayStr, api, page, sayToast, addXp }) {
  w2.guild ||= { day: todayStr, done: {}, total: 0 };
  if (w2.guild.day !== todayStr) { w2.guild.day = todayStr; w2.guild.done = {}; }
  const tasks = [
    { id: "motes",   name: "Star-Mote Patrol",   desc: "Have at least 25 Star-Motes collected", pay: 120, ok: () => Object.keys(w2.motes || {}).length >= 25 },
    { id: "fish",    name: "Canopy Angler",      desc: "Have at least 3 World 2 fish caught",   pay: 140, ok: () => (w2.caught || 0) >= 3 },
    { id: "critter", name: "Critter Roundup",    desc: "Have at least 3 critters caught",       pay: 140, ok: () => (w2.crittersCaught || 0) >= 3 },
  ];
  const rows = tasks.map((t) => {
    const claimed = !!w2.guild.done[t.id];
    const ready = !claimed && t.ok();
    return `<div><strong>${esc(t.name)}</strong><span class="muted">${esc(t.desc)} · +${t.pay} mon</span>${claimed ? `<span style="color:#7dff8a;font-weight:800">Completed ✓</span>` : `<button class="btn btn-accent" data-gd="${t.id}" ${ready ? "" : "disabled"}>Claim</button>`}</div>`;
  }).join("");
  page(`Astral Guild Hall (Cleared: ${w2.guild.total || 0})`, `<p class="muted">Complete 5 Guild Commissions to earn the Astral Guildmaster Hat & Banner!</p><div class="wd-goods">${rows}</div>`, (el) => {
    el.querySelectorAll("[data-gd]").forEach((b) => (b.onclick = () => {
      const t = tasks.find((x) => x.id === b.dataset.gd);
      if (!t || w2.guild.done[t.id] || !t.ok()) return;
      w2.guild.done[t.id] = 1;
      w2.guild.total = (w2.guild.total || 0) + 1;
      api.addMon(t.pay);
      addXp?.(60);
      api.ping("done");
      if (w2.guild.total >= 5 && !s.hats.includes("w2_guildhat")) {
        api.giveHat("w2_guildhat");
        api.giveFurn("w2_guildbanner");
        sayToast("5 Commissions! Astral Guildmaster Hat & Banner unlocked!");
      } else sayToast(`Commission claimed! +${t.pay} mon`);
      api.save();
      openGuildUI({ s, w2, todayStr, api, page, sayToast, addXp });
    }));
  });
}

export function openArenaUI({ s, w2, api, page, addXp }) {
  w2.arenaTier ??= 0;
  const tiers = [
    { name: "Bronze Trial — Ember Duelist", hp: 36, atk: 6, pay: 150 },
    { name: "Silver Trial — Clockwork Knight", hp: 50, atk: 8, pay: 220 },
    { name: "Gold Trial — Glacier Archon", hp: 66, atk: 10, pay: 320 },
    { name: "Sovereign Trial — Champion Valen", hp: 85, atk: 12, pay: 500 },
  ];
  const rows = tiers.map((t, i) => `<div><strong>${esc(t.name)}</strong><span class="muted">Prize: ${t.pay} mon</span><button class="btn${i <= w2.arenaTier ? " btn-accent" : ""}" data-ar="${i}" ${i > w2.arenaTier ? "disabled" : ""}>${i < w2.arenaTier ? "Rematch" : "Challenge"}</button></div>`).join("");
  page(`Starlight Arena (Rank ${w2.arenaTier}/4)`, `<p class="muted">Clear all 4 Arena Trials to win the Arena Sovereign Laurel & Starlight Arena Cup!</p><div class="wd-goods">${rows}</div>`, (el) => {
    el.querySelectorAll("[data-ar]").forEach((b) => (b.onclick = () => {
      const idx = +b.dataset.ar, t = tiers[idx];
      let hp = 60 + (w2.level || 1) * 4, ehp = t.hp, shield = 0, log = `${t.name} enters the ring!`;
      const dmgBonus = w2.constellations?.gearc ? 1.15 : 1;
      const fight = () => {
        page(`Arena: ${t.name}`, `
          <div class="by-jobtop"><strong>Your HP: ${Math.max(0, hp)}</strong><strong>Foe HP: ${Math.max(0, ehp)}</strong></div>
          <p style="margin:16px 0;font-weight:700">${esc(log)}</p>
          ${ehp <= 0 || hp <= 0 ? `<button class="btn btn-accent" id="ar-back">Back to Arena</button>` : `<div class="chips" style="justify-content:center"><button class="btn btn-accent" id="ar-hit">Foxfire Slash</button><button class="btn" id="ar-sh">Astral Shield</button><button class="btn" id="ar-com">Comet Strike</button></div>`}
        `, (aEl) => {
          if (ehp <= 0 || hp <= 0) { aEl.querySelector("#ar-back").onclick = () => openArenaUI({ s, w2, api, page, addXp }); return; }
          const turn = (d, sh, msg) => {
            ehp -= Math.round(d * dmgBonus);
            shield = sh;
            if (ehp <= 0) {
              if (idx === w2.arenaTier) w2.arenaTier++;
              api.addMon(t.pay);
              addXp?.(60 + idx * 30);
              api.ping("done");
              log = `${msg} Victory! +${t.pay} mon!`;
              if (w2.arenaTier >= 4 && !s.hats.includes("w2_arenalaurel")) {
                api.giveHat("w2_arenalaurel");
                api.giveFurn("w2_arenacup");
                log += " Champion Laurel & Cup unlocked!";
              }
              api.save();
            } else {
              const ed = Math.max(1, t.atk - shield);
              hp -= ed;
              log = `${msg} Foe hits for ${ed}.`;
            }
            fight();
          };
          aEl.querySelector("#ar-hit").onclick = () => turn(14 + (w2.level || 1) * 2, 0, "Foxfire Slash!");
          aEl.querySelector("#ar-sh").onclick = () => turn(7, 6, "Astral Shield blocks!");
          aEl.querySelector("#ar-com").onclick = () => turn(Math.random() < 0.7 ? 24 + (w2.level || 1) * 2 : 5, 0, "Comet Strike!");
        });
      };
      fight();
    }));
  });
}

export function openObservatoryUI({ s, w2, api, page, sayToast }) {
  w2.constellations ||= {};
  const motes = Object.keys(w2.motes || {}).length;
  const rows = W2_CONSTELLATIONS.map((c) => {
    const done = !!w2.constellations[c.id];
    const can = !done && motes >= c.motes;
    return `<div><strong>${esc(c.name)}</strong><span class="muted">${esc(c.desc)} · Requires ${c.motes} Star-Motes</span>${done ? `<span style="color:#7dff8a;font-weight:800">Charted ✓</span>` : `<button class="btn btn-accent" data-con="${c.id}" ${can ? "" : "disabled"}>Chart (+${c.mon} mon)</button>`}</div>`;
  }).join("");
  page("Constellation Dome", `<p class="muted">You have ${motes} Star-Motes. Align the 6 World 2 Constellations!</p><div class="wd-goods">${rows}</div>`, (el) => {
    el.querySelectorAll("[data-con]").forEach((b) => (b.onclick = () => {
      const c = W2_CONSTELLATIONS.find((x) => x.id === b.dataset.con);
      if (!c || w2.constellations[c.id] || motes < c.motes) return;
      w2.constellations[c.id] = 1;
      api.addMon(c.mon);
      api.ping("done");
      if (c.id === "twinc" && !s.furn.w2_constlamp) {
        api.giveFurn("w2_constlamp");
        sayToast("All Constellations aligned! Constellation Star Lamp unlocked!");
      } else sayToast(`Charted ${c.name}! (+${c.mon} mon)`);
      api.save();
      openObservatoryUI({ s, w2, api, page, sayToast });
    }));
  });
}

export function openStableUI({ s, w2, api, page, sayToast }) {
  w2.familiars ||= { wisp: 1 };
  w2.familiar ||= "wisp";
  const rows = W2_FAMILIARS.map((f) => {
    const own = !!w2.familiars[f.id], on = w2.familiar === f.id;
    return `<div><strong>${esc(f.name)}</strong><span class="muted">${esc(f.desc)}</span><button class="btn${on ? " btn-accent" : ""}" data-fam="${f.id}" ${!own && s.mon < f.cost ? "disabled" : ""}>${on ? "Following ✓" : own ? "Summon" : `Adopt · ${f.cost} mon`}</button></div>`;
  }).join("");
  page("Familiar Stable", `<p class="muted">Choose a World 2 Familiar to follow your fox and grant its blessing.</p><div class="wd-goods">${rows}</div>`, (el) => {
    el.querySelectorAll("[data-fam]").forEach((b) => (b.onclick = () => {
      const f = W2_FAMILIARS.find((x) => x.id === b.dataset.fam);
      if (!f) return;
      if (!w2.familiars[f.id]) {
        if (s.mon < f.cost) return;
        api.addMon(-f.cost);
        w2.familiars[f.id] = 1;
        api.ping("done");
      } else api.ping("choice");
      w2.familiar = f.id;
      api.save();
      sayToast(`${f.name} is now following you!`);
      openStableUI({ s, w2, api, page, sayToast });
    }));
  });
}

export function openVillaUI({ s, w2, api, page, sayToast }, sel) {
  w2.room ||= {};
  const W = 10, H = 7;
  const placed = (id) => Object.values(w2.room).filter((v) => v === id).length;
  const owned = FURNITURE.filter((f) => s.furn?.[f[0]]);
  if (!sel || !s.furn?.[sel]) sel = owned[0]?.[0];
  const cells = [];
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const v = w2.room[`${x},${y}`], f = FURNITURE.find((q) => q[0] === v);
      cells.push(`<button type="button" data-vc="${x},${y}">${f ? `<img src="${furnitureUrl(f[0], f[3])}" alt="">` : ""}</button>`);
    }
  }
  const tray = owned.length
    ? `<p class="muted">Pick furniture below, then click a tile to place/remove.</p><div class="wd-tray">${owned.map((f) => `<button type="button" data-vs="${f[0]}" class="${f[0] === sel ? "on" : ""}" title="${esc(f[1])}"><img src="${furnitureUrl(f[0], f[3])}" alt=""><small>${s.furn[f[0]] - placed(f[0])}</small></button>`).join("")}</div>`
    : `<p class="muted">No furniture yet. Visit the Astral Outfitter to buy some!</p>`;
  page("Starfall Villa (World 2 House)", `<div class="wd-room" style="grid-template-columns:repeat(${W},1fr)">${cells.join("")}</div>${tray}`, (el) => {
    el.querySelectorAll("[data-vs]").forEach((b) => (b.onclick = () => openVillaUI({ s, w2, api, page, sayToast }, b.dataset.vs)));
    el.querySelectorAll("[data-vc]").forEach((b) => (b.onclick = () => {
      const k = b.dataset.vc;
      if (w2.room[k]) delete w2.room[k];
      else if (sel && placed(sel) < s.furn[sel]) w2.room[k] = sel;
      else return sayToast("You've placed all of those.");
      api.ping("choice");
      api.save();
      openVillaUI({ s, w2, api, page, sayToast }, sel);
    }));
  });
}

export function openFortuneUI({ w2, todayStr, api, page, sayToast }) {
  w2.fortune ||= { day: "", buff: "" };
  const buffs = [
    { id: "mon",  name: "The Golden Fox",   desc: "+30% mon from Star-Motes today" },
    { id: "xp",   name: "The Comet Star",   desc: "+35% World 2 XP today" },
    { id: "fish", name: "The Coral Tide",   desc: "Lucky fishing bar today" },
    { id: "rel",  name: "The Amber Spade",  desc: "Bonus Relic on every dig today" },
  ];
  const drawn = w2.fortune.day === todayStr;
  const cur = buffs.find((b) => b.id === w2.fortune.buff);
  page("Bell-Keeper Shrine · Daily Fortune", `
    <p class="muted">Draw a Star-Card once per day for a 24-hour World 2 blessing.</p>
    <div class="by-big" style="margin:20px 0">${drawn && cur ? `✨ ${esc(cur.name)}` : "🔮 Unread"}</div>
    ${drawn && cur ? `<p>${esc(cur.desc)}</p>` : `<button class="btn btn-accent" id="ft-draw">Draw Daily Fortune</button>`}
  `, (el) => {
    const btn = el.querySelector("#ft-draw");
    if (btn) btn.onclick = () => {
      const pick = buffs[Math.floor(Math.random() * buffs.length)];
      w2.fortune = { day: todayStr, buff: pick.id };
      api.ping("done");
      api.save();
      sayToast(`Fortune Drawn: ${pick.name}!`);
      openFortuneUI({ w2, todayStr, api, page, sayToast });
    };
  });
}
