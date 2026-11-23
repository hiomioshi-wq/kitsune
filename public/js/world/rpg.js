// Action RPG layer for the book realms: attacks, dodging, health, stamina, levels, perks, weapons and one unique system per realm.
// Progress is shared across realms and saved in the World save under "rpg".
import { esc } from "../util.js";
import { settings } from "../store.js";

// name, damage, reach, arc (radians), cooldown ms, realm it drops in, note
export const WEAPONS = {
  claws: ["Fox claws", 2, 48, 1.7, 300, "", "What you were born with."],
  icepick: ["Rimeback Pick", 6, 54, 1.3, 330, "delve", "Still cold. Very good at getting into things."], fan: ["War Fan", 5, 76, 2.5, 420, "delve", "Sweeps a whole arc, and looks wonderful doing it."], glaive: ["Imperial Glaive", 9, 96, 1.5, 680, "delve", "A long reach, and a long wait between swings."], twin: ["Twin Tanto", 4, 44, 1.4, 150, "delve", "Fast enough to be rude about it."],
  teaspoon: ["Velvette's teaspoon", 3, 42, 1.2, 190, "blackwood", "She can make a knife out of one. This is that one."],
  gerald: ["Gerald", 4, 54, 1.4, 280, "blackwood", "A sharpened plastic ruler. He answers to no stairwell."],
  lanyard: ["Kevin's lanyard", 5, 66, 1.9, 220, "blackwood", "Swings in a wide apologetic arc. Still has the badge."],
  clipboard: ["Rusk's clipboard", 6, 58, 2.0, 310, "blackwood", "ARREST AFTER FINALS. Hits harder than paperwork."],
  fountainpen: ["Answer-in-Pen Fountain Pen", 6, 52, 1.5, 195, "blackwood", "Permanent ink. Doesn't smudge."],
  wrench: ["Meridian Thermal Wrench", 7, 60, 1.9, 340, "blackwood", "Heavy brass radiator wrench from Sector 4. Still warm."],
  quill_becca: ["Becca's Ink-Quill", 7, 58, 1.8, 175, "blackwood", "Anything it writes on the air briefly becomes true."],
  crowbar_yuki: ["Yuki's Crowbar", 8, 64, 2.0, 290, "blackwood", "The iron bar that opened the east wall of the Cathedral."],
  gavel_quorum: ["Trustee Duck's Gavel", 9, 72, 2.2, 380, "blackwood", "QUORUM MET. Hits with the weight of 1642 accreditation."],
  tuningfork: ["Bell-Ringer's Tuning Fork", 7, 56, 1.7, 210, "blackwood", "Hums at the exact frequency of Tuesday's noon bell."],
  ash_ledger: ["Sasha's Redacted Ledger", 8, 62, 2.1, 260, "blackwood", "Bound in Second Schedule leather. Heavy enough to concuss."],
  scythe: ["The Reaper's scythe", 7, 88, 2.7, 700, "blackwood", "It hums like a fridge. Hits everything around you."],
  hatchet: ["War's hatchet", 6, 58, 1.8, 500, "incarnate", "Forged from an argument somebody swallowed."],
  ember: ["Rui's ember", 5, 68, 2.1, 400, "incarnate", "Sets what it hits on fire."],
  shardblade: ["Blue-Gold Shard", 7, 62, 1.9, 250, "incarnate", "Pulled from behind the washer. Hums in two colours."],
  saltblade: ["Salt-Line Blade", 7, 64, 1.9, 320, "incarnate", "Drawn in thick white salt around a barn floor."],
  plaque_blade: ["Red-Gold Shard", 8, 62, 1.9, 240, "incarnate", "Crystallized Corruption-027 from the Mini-Portal Lab."],
  machete: ["Mae's machete", 5, 62, 1.7, 360, "backrooms", "Rusted. Has opened a Wretch's skull in one swing."],
  broadsword: ["Firesalt broadsword", 8, 78, 2.2, 640, "backrooms", "Cools from white to orange. Sets what it hits on fire."],
  crowbar: ["M.E.G. Crowbar", 6, 66, 2.0, 420, "backrooms", "Heavy steel bar stamped BASE BETA. Breaks locks and ribs alike."],
  poker: ["Star-Coal Poker", 8, 68, 2.0, 440, "express", "Forged in the Spirit Express firebox. Sets what it hits on fire."],
  starlance: ["Starlight Lance", 9, 86, 1.4, 460, "citadel", "Meteor iron and High Post frost. Reaches across a room."],
  halberd: ["Foxfire Halberd", 10, 88, 2.1, 520, "undermarket", "Tempered in river jade and subterranean foxfire."],
  rapier: ["Clockwork Rapier", 8, 60, 1.3, 160, "clockworks", "Balanced on a Brask mainspring. Strikes faster than a blink."],
  emeraldsword: ["Emerald Greatsword", 11, 82, 2.2, 540, "emeraldvault", "Cut from living Oz crystal. Heavy, bright, and unforgiving."],
};
// name, what one rank does, max rank
export const PERKS = {
  fur: ["Thick Fur", "+2 max health", 5], fangs: ["Sharp Fangs", "+1 damage", 5], paws: ["Quick Paws", "+6% move speed", 4], lungs: ["Big Lungs", "+20 stamina and faster recovery", 3],
  crit: ["Killer Instinct", "+8% critical hit chance", 4], leech: ["Bloodsucker", "12% chance to heal on a kill", 3], ghost: ["Ghost Step", "Longer dodge invincibility", 2], bolt: ["Foxfire Bolt", "Unlocks a ranged shot (V), then more damage", 3], scav: ["Scavenger", "+25% loot chance", 3],
};
export const SKILLS = {
  blackwood: { name: "Please", key: "R", text: "Say the word. Every enemy near you freezes, and frozen enemies take double damage.", cost: 35 },
  incarnate: { name: "Relapse", key: "R", text: "Kills feed your Corruption, which raises your damage. Spend it in a blast. At 100 it starts eating your health.", cost: 0 },
  delve: { name: "Foxfire Nova", key: "R", text: "Burst blue flame around you, scorching and staggering anything close.", cost: 30 },
  backrooms: { name: "Flare", key: "R", text: "Sanity drains while you're down here. Burn a flare to scorch what's close. Almond Water restores your sanity.", cost: 30 },
};
const DIRS = { up: -Math.PI / 2, down: Math.PI / 2, left: Math.PI, right: 0 };
const need = (l) => Math.round(24 * l ** 1.45);
const angDiff = (a, b) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));

export function createRpg(store, realm, api) {
  const r = Object.assign(store, { xp: 0, level: 1, points: 0, perks: {}, weapon: "claws", owned: ["claws"], flasks: 3, kills: 0, ...store });
  const bonus = { dmg: 0, spd: 0, hp: 0 }, rank = (k) => r.perks[k] || 0, maxHp = () => 8 + (r.level - 1) + rank("fur") * 2 + bonus.hp, maxSta = () => 100 + rank("lungs") * 20;
  const S = { hp: maxHp(), sta: maxSta(), corrupt: 0, sanity: 100, atkAt: 0, boltAt: 0, skillAt: 0, dashEnd: 0, dashAt: 0, dashX: 0, dashY: 0, iframes: 0, slash: null, bolts: [], fx: [], flare: 0, aim: Math.PI / 2 };
  const float = (x, y, t, c = "#fff") => { if (settings.world?.realmDamageNumbers !== false) S.fx.push({ x, y, t, c, life: 1 }); };
  const weapon = () => WEAPONS[r.weapon] || WEAPONS.claws;
  const damage = () => { const base = weapon()[1] + bonus.dmg + (r.forged?.[r.weapon] || 0) + rank("fangs") + Math.floor((r.level - 1) / 3); return realm === "incarnate" ? base + Math.floor(S.corrupt / 25) : realm === "backrooms" && S.sanity < 30 ? Math.max(1, base - 1) : base; };
  const speedMul = () => (1 + rank("paws") * .06 + bonus.spd) * (now() < S.dashEnd ? 3 : 1) * (realm === "backrooms" && S.sanity < 30 ? .88 : 1);
  const now = () => performance.now();
  function strike(e, base, t) {
    if (e.dead) return; const crit = Math.random() < .06 + rank("crit") * .08; let n = base * (crit ? 2 : 1); if (t < (e.stun || 0) && realm === "blackwood") n *= 2; e.hp -= n; e.hurt = t + 130; float(e.x, e.y - 30, `${n}${crit ? "!" : ""}`, crit ? "#ffd27a" : "#fff");
    const a = Math.atan2(e.y - api.py(), e.x - api.px()); e.kx = Math.cos(a) * 260; e.ky = Math.sin(a) * 260; if (["ember", "broadsword", "poker"].includes(r.weapon)) e.burn = t + 2200; if (e.kind === "charge" && e.cState !== "dash") { e.kx *= .4; e.ky *= .4; }
    if (e.hp <= 0) kill(e, t);
  }
  function kill(e, t) {
    e.dead = true; e.back = t + 24000; r.kills++; api.ping("done"); gain(5 + e.tier * 4 + r.level); api.reward(1 + e.tier); if (realm === "incarnate") S.corrupt = Math.min(120, S.corrupt + 14); if (realm === "backrooms") S.sanity = Math.min(100, S.sanity + 3);
    if (Math.random() < rank("leech") * .12) { S.hp = Math.min(maxHp(), S.hp + 1); float(api.px(), api.py() - 44, "+1", "#7dff8a"); }
    const luck = 1 + rank("scav") * .25, pool = Object.keys(WEAPONS).filter((k) => WEAPONS[k][5] === realm && !r.owned.includes(k));
    if (pool.length && Math.random() < .09 * luck) { const k = pool[Math.floor(Math.random() * pool.length)]; r.owned.push(k); float(e.x, e.y - 48, WEAPONS[k][0], "#ff9ad0"); api.toast(`New weapon: ${WEAPONS[k][0]}. Press K to equip it.`); }
    else if (Math.random() < .2 * luck) { r.flasks++; float(e.x, e.y - 48, "+1 Almond Water", "#ffe28a"); }
    api.changed();
  }
  function gain(n) { r.xp += n; let up = false; while (r.xp >= need(r.level)) { r.xp -= need(r.level); r.level++; r.points++; up = true; } if (up) { S.hp = maxHp(); S.sta = maxSta(); float(api.px(), api.py() - 58, `LEVEL ${r.level}`, "#7fe0ff"); api.toast(`Level ${r.level}! Press K to spend a perk point.`); api.ping("done"); } }
  const autoAim = (enemies, range) => { let best = null, bd = range; for (const e of enemies) { if (e.dead) continue; const d = Math.hypot(e.x - api.px(), e.y - api.py()); if (d < bd) { bd = d; best = Math.atan2(e.y - api.py(), e.x - api.px()); } } return best; };
  function attack(enemies, aim) {
    const t = now(), w = weapon(); if (t < S.atkAt || S.sta < 8) return; S.atkAt = t + w[4]; S.sta -= 8; S.aim = aim ?? autoAim(enemies, w[2] + 70) ?? DIRS[api.dir()]; S.slash = { at: t, a: S.aim, reach: w[2], arc: w[3] }; api.ping("blip");
    for (const e of enemies) { if (e.dead) continue; const dx = e.x - api.px(), dy = e.y - api.py(), d = Math.hypot(dx, dy); if (d < w[2] + 16 && angDiff(Math.atan2(dy, dx), S.aim) < w[3] / 2 + .2) strike(e, damage(), t); }
  }
  function shoot(aim, enemies = []) { const t = now(); if (!rank("bolt") || t < S.boltAt || S.sta < 14) return; S.boltAt = t + 420; S.sta -= 14; const a = aim ?? autoAim(enemies, 330) ?? DIRS[api.dir()]; S.bolts.push({ x: api.px(), y: api.py() - 6, vx: Math.cos(a) * 430, vy: Math.sin(a) * 430, life: .9, dmg: 1 + rank("bolt") * 2 }); api.ping("blip"); }
  function dash(ax, ay) { const t = now(); if (t < S.dashAt || S.sta < 22) return; S.dashAt = t + 650; S.sta -= 22; S.dashEnd = t + 150; S.iframes = Math.max(S.iframes, t + 300 + rank("ghost") * 130); const a = ax || ay ? Math.atan2(ay, ax) : DIRS[api.dir()]; S.dashX = Math.cos(a); S.dashY = Math.sin(a); }
  function skill(enemies) {
    const t = now(); if (t < S.skillAt) return; const near = enemies.filter((e) => !e.dead && Math.hypot(e.x - api.px(), e.y - api.py()) < 190);
    if (realm === "blackwood") { if (S.sta < 35) return api.toast("Not enough stamina."); S.sta -= 35; S.skillAt = t + 3500; near.forEach((e) => (e.stun = t + 2800)); float(api.px(), api.py() - 52, "PLEASE", "#ffe28a"); S.flare = t + 300; }
    else if (realm === "incarnate") { if (S.corrupt < 30) return api.toast("Not enough Corruption. Kill something."); const power = Math.ceil(S.corrupt / 10); S.corrupt = 0; S.skillAt = t + 2500; S.flare = t + 420; near.forEach((e) => strike(e, power + rank("fangs"), t)); float(api.px(), api.py() - 52, "RELAPSE", "#ff5a6a"); }
    else { if (S.sta < 30) return api.toast("Not enough stamina."); S.sta -= 30; if (realm === "backrooms") S.sanity = Math.max(0, S.sanity - 4); S.skillAt = t + 3000; S.flare = t + 380; near.forEach((e) => { e.burn = t + 2600; e.stun = t + 900; strike(e, 2 + Math.floor(r.level / 2), t); }); float(api.px(), api.py() - 52, realm === "delve" ? "NOVA" : "FLARE", realm === "delve" ? "#7fd8ff" : "#ff9a3a"); }
    api.ping("done");
  }
  function drink() { if (r.flasks <= 0) return api.toast("You're out of Almond Water."); if (S.hp >= maxHp() && S.sanity >= 100) return; r.flasks--; S.hp = Math.min(maxHp(), S.hp + 5); S.sanity = Math.min(100, S.sanity + 45); if (realm === "incarnate") S.corrupt = Math.max(0, S.corrupt - 25); float(api.px(), api.py() - 44, "+5", "#7dff8a"); api.ping("choice"); api.changed(); }
  function hurt(n) { const t = now(); if (t < S.iframes) return false; if (realm === "backrooms" && S.sanity < 30) n += 1; S.hp = Math.floor(S.hp) - n; S.iframes = t + 750; float(api.px(), api.py() - 40, `-${n}`, "#ff6a7a"); api.ping("blip"); if (S.hp <= 0) { S.hp = maxHp(); S.sta = maxSta(); S.corrupt = 0; S.sanity = Math.max(S.sanity, 70); return true; } return false; }
  const stats = (kind) => { const lv = r.level, t = { hound: 1, smiler: 1, follower: 2, clump: 3, partygoer: 2, mini: 1, vendbite: 2 }[kind] || 1; return { tier: t, max: 4 + t * 4 + lv * 2, hit: t > 2 ? 3 : t > 1 ? 2 : 1, speed: { clump: 118, partygoer: 150, smiler: 140, follower: 136, mini: 165 }[kind] || 148 }; };
  function update(dt, enemies) {
    const t = now(); S.sta = Math.min(maxSta(), S.sta + (22 + rank("lungs") * 7) * (settings.world?.realmStaminaRegen || 1) * dt); if (t > S.iframes + 5000 && S.hp < maxHp()) S.hp = Math.min(maxHp(), S.hp + dt * .25);
    if (realm === "backrooms") { S.sanity = Math.max(0, S.sanity - dt * .55); if (S.sanity <= 0 && hurtTick(t)) return true; }
    if (realm === "incarnate" && S.corrupt >= 100 && hurtTick(t)) return true;
    for (const b of S.bolts) { b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt; for (const e of enemies) if (!e.dead && Math.hypot(e.x - b.x, e.y - b.y) < 22) { strike(e, b.dmg + Math.floor(r.level / 4), t); b.life = 0; break; } if (api.blocked(b.x, b.y)) b.life = 0; } S.bolts = S.bolts.filter((b) => b.life > 0);
    for (const e of enemies) { if (e.dead) continue; if (e.burn > t && (e.burnT || 0) < t) { e.burnT = t + 450; strike(e, 1, t); } }
    for (const f of S.fx) { f.y -= 42 * dt; f.life -= dt * 1.05; } S.fx = S.fx.filter((f) => f.life > 0); return false;
  }
  let tickAt = 0; const hurtTick = (t) => { if (t < tickAt) return false; tickAt = t + 2600; S.iframes = 0; return hurt(1); };
  function draw(g, t, still) {
    if (S.slash) { const k = (t - S.slash.at) / 160; if (k >= 1) S.slash = null; else { g.save(); g.translate(api.px(), api.py() - 2); g.strokeStyle = `rgba(255,240,200,${.85 * (1 - k)})`; g.lineWidth = 7 * (1 - k) + 2; g.lineCap = "round"; const from = S.slash.a - S.slash.arc / 2, to = from + S.slash.arc * Math.min(1, k * 2.2); g.beginPath(); g.arc(0, 0, S.slash.reach, from, to); g.stroke(); g.restore(); } }
    for (const b of S.bolts) { g.fillStyle = "rgba(108,200,255,.3)"; g.beginPath(); g.arc(b.x, b.y, 11, 0, 7); g.fill(); g.fillStyle = "#dff4ff"; g.beginPath(); g.arc(b.x, b.y, 5, 0, 7); g.fill(); }
    if (t < S.flare) { const c = realm === "incarnate" ? "255,50,70" : realm === "blackwood" ? "255,226,138" : "255,150,60", k = (S.flare - t) / 420; g.strokeStyle = `rgba(${c},${k})`; g.lineWidth = 5; g.beginPath(); g.arc(api.px(), api.py(), 190 * (1 - k * .75), 0, 7); g.stroke(); }
    g.textAlign = "center"; g.font = "900 15px system-ui"; for (const f of S.fx) { g.globalAlpha = Math.max(0, Math.min(1, f.life * 1.5)); g.lineWidth = 3; g.strokeStyle = "#111"; g.strokeText(f.t, f.x, f.y); g.fillStyle = f.c; g.fillText(f.t, f.x, f.y); } g.globalAlpha = 1;
  }
  const bars = () => { const sk = SKILLS[realm], third = realm === "incarnate" ? ["Corruption", S.corrupt, 100, S.corrupt >= 100 ? "#ff2a3c" : "#c9304a"] : realm === "backrooms" ? ["Sanity", S.sanity, 100, S.sanity < 30 ? "#ff7a3a" : "#e8d25a"] : null; const row = (l, v, m, c) => `<label><span>${l}</span><i><b style="width:${Math.max(0, Math.min(100, v / m * 100))}%;background:${c}"></b></i><em>${Math.floor(v)}</em></label>`; return `${row("Health", S.hp, maxHp(), "#ff5a7a")}${row("Stamina", S.sta, maxSta(), "#6cd0ff")}${third ? row(...third) : ""}<div class="rm-xp"><span>Lv ${r.level}</span><i><b style="width:${r.xp / need(r.level) * 100}%"></b></i>${r.points ? `<strong>${r.points} perk</strong>` : ""}</div><small>${esc(weapon()[0])} · ${r.flasks} Almond Water · ${esc(sk.name)} ${Date.now() && now() < S.skillAt ? `${Math.ceil((S.skillAt - now()) / 1000)}s` : "ready"}</small>`; };
  const sheet = () => `<div class="rx-top"><div><strong>Level ${r.level}</strong><small>${r.xp}/${need(r.level)} XP · ${r.kills} kills</small></div><div><strong>${maxHp()}</strong><small>Health</small></div><div><strong>${damage()}</strong><small>Damage</small></div><div><strong>${r.points}</strong><small>Perk points</small></div></div><h3 class="h3">${esc(SKILLS[realm].name)}</h3><p class="muted">${esc(SKILLS[realm].text)}</p><h3 class="h3">Weapons</h3><div class="wx-grid">${Object.entries(WEAPONS).map(([k, w]) => r.owned.includes(k) ? `<article class="${r.weapon === k ? "known" : ""}"><strong>${esc(w[0])}${r.forged?.[k] ? ` +${r.forged[k]}` : ""}</strong><small>${w[1] + (r.forged?.[k] || 0)} damage · ${(1000 / w[4]).toFixed(1)} hits/s · reach ${w[2]}</small><small class="muted">${esc(w[6])}</small><button class="btn btn-sm" type="button" data-w="${k}" ${r.weapon === k ? "disabled" : ""}>${r.weapon === k ? "Equipped" : "Equip"}</button></article>` : `<article><strong>???</strong><small>${w[5] ? `Drops in ${esc({ blackwood: "Blackwood", incarnate: "the Corruption Saga", backrooms: "the Backrooms", delve: "the Delves" }[w[5]])}` : ""}</small></article>`).join("")}</div><h3 class="h3">Perks</h3><div class="wx-grid">${Object.entries(PERKS).map(([k, p]) => `<article class="${rank(k) ? "known" : ""}"><strong>${esc(p[0])} ${rank(k)}/${p[2]}</strong><small>${esc(p[1])}</small><button class="btn btn-sm${r.points && rank(k) < p[2] ? " btn-accent" : ""}" type="button" data-p="${k}" ${r.points && rank(k) < p[2] ? "" : "disabled"}>Learn</button></article>`).join("")}</div><p class="hint">F or click attack · Q dodge · R ${esc(SKILLS[realm].name)} · C drink · V bolt · K this page</p>`;
  const bindSheet = (el, again) => { el.querySelectorAll("[data-w]").forEach((b) => (b.onclick = () => { r.weapon = b.dataset.w; api.changed(); again(); })); el.querySelectorAll("[data-p]").forEach((b) => (b.onclick = () => { const k = b.dataset.p; if (!r.points || rank(k) >= PERKS[k][2]) return; r.points--; r.perks[k] = rank(k) + 1; if (k === "fur") S.hp += 2; api.ping("done"); api.changed(); again(); })); };
  return { bonus, strike, float, S, r, attack, shoot, dash, skill, drink, hurt, update, draw, bars, sheet, bindSheet, stats, speedMul, maxHp, gain };
}
