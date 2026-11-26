// Moonwake Bay: Breakables Yard, Golden/Rainbow Forge, Enchants, Potions, Mastery, Ranks & Rebirth.
import { SPECIES, specie, RARITY, RAR_C, petLevel, stageOf, addPet, petMult, rollCrate, CRATES } from "./baycore.js";

export const PS_ZONES = [
  { id: "shallows", name: "Sandy Shallows", cost: 0, mult: 1, hp: [70, 190], bossHp: 750, color: "#e8c47a" },
  { id: "coral", name: "Coral Reef", cost: 450, mult: 2.5, hp: [240, 560], bossHp: 2100, color: "#ff8c7a" },
  { id: "vault", name: "Sunken Vault", cost: 1800, mult: 6, hp: [750, 1700], bossHp: 6200, color: "#58b8d8" },
  { id: "plaza", name: "Starlight Plaza", cost: 6500, mult: 14, hp: [2400, 5200], bossHp: 18000, color: "#a478f0" },
  { id: "void", name: "Void Reef", cost: 22000, mult: 32, hp: [8000, 17500], bossHp: 56000, color: "#3d2868" },
];

export const BREAKABLES = [
  ["coin", "Shell Coin", "🪙", 1, 1, 1],
  ["crate", "Driftwood Crate", "📦", 1.5, 1.7, 1],
  ["gem", "Diamond Pile", "💎", 1.3, 1.1, 3.5],
  ["safe", "Coral Safe", "🔐", 2.2, 2.8, 1.8],
  ["chest", "Starlight Chest", "🧰", 3.4, 4.6, 3],
];

export const ENCHANTS = [
  ["coins", "Coins", "🪙", "Breakables drop more shells", [35, 65, 110]],
  ["strength", "Strength", "⚔️", "Squad deals more breakable damage", [40, 75, 130]],
  ["treasure", "Treasure Hunter", "💎", "More Diamonds & bonus drops", [30, 60, 100]],
  ["crit", "Criticals", "💥", "Chance for 2.5× critical hits", [18, 30, 45]],
  ["tap", "Tap Power", "👆", "Manual taps deal huge damage", [100, 200, 350]],
  ["lucky", "Lucky Eggs", "🍀", "Boosts Huge & Rare hatch odds", [35, 70, 120]],
];

const QUEST_POOL = [
  { kind: "break", label: "Smash breakables", base: 14, step: 6, reward: 35 },
  { kind: "boss", label: "Defeat Boss Chests", base: 1, step: 1, reward: 55 },
  { kind: "hatch", label: "Hatch Exclusive or Crate eggs", base: 2, step: 1, reward: 45 },
  { kind: "forge", label: "Forge Golden or Rainbow critters", base: 1, step: 1, reward: 65 },
  { kind: "enchant", label: "Equip or upgrade Enchants", base: 1, step: 1, reward: 40 },
];

export function masteryLv(xp) {
  return Math.min(25, Math.floor(Math.sqrt((xp || 0) / 20)) + 1);
}

export function ensureYard(b) {
  const p = (b.yard ||= {
    zone: 0,
    curZone: 0,
    diamonds: 40,
    squad: [],
    slots: 3,
    rank: 1,
    stars: 0,
    quest: null,
    enchants: { coins_1: 1, strength_1: 1 },
    eqEnchants: ["coins_1"],
    potions: { dmg: 1, coins: 1, luck: 1 },
    potOn: { dmg: false, coins: false, luck: false },
    mastery: { break: 0, hatch: 0, forge: 0, enchant: 0 },
    rebirths: 0,
    totalBroken: 0,
    bossesBroken: 0,
    goldMade: 0,
    rainbowMade: 0,
    hugeHatched: 0,
  });
  p.squad = (p.squad || []).filter((id) => b.pets.some((q) => q.id === id)).slice(0, p.slots);
  if (!p.squad.length && b.pets.length) equipBestSquad(b);
  if (!p.quest) p.quest = rollQuest(p.rank);
  p.enchants ||= {};
  p.eqEnchants ||= [];
  p.potions ||= { dmg: 0, coins: 0, luck: 0 };
  p.potOn ||= { dmg: false, coins: false, luck: false };
  p.mastery ||= { break: 0, hatch: 0, forge: 0, enchant: 0 };
  return p;
}

function rollQuest(rank) {
  const q = QUEST_POOL[(rank + Math.floor(Math.random() * QUEST_POOL.length)) % QUEST_POOL.length];
  return { kind: q.kind, label: q.label, need: q.base + (rank - 1) * q.step, have: 0, reward: q.reward + rank * 12 };
}

function addQuestProgress(b, kind, n = 1) {
  const p = ensureYard(b);
  if (p.quest && p.quest.kind === kind && p.quest.have < p.quest.need) {
    p.quest.have = Math.min(p.quest.need, p.quest.have + n);
  }
}

export function enchantBonus(b, id) {
  const p = ensureYard(b);
  let total = 0;
  for (const key of p.eqEnchants) {
    const [eid, t] = key.split("_");
    if (eid === id) {
      const def = ENCHANTS.find((e) => e[0] === eid);
      if (def) total += def[4][Math.max(0, Math.min(2, (+t || 1) - 1))];
    }
  }
  return total;
}

export function petPower(pet, b) {
  if (!pet) return 0;
  const d = specie(pet.sp), lv = petLevel(pet).level, st = stageOf(pet);
  const base = [12, 26, 56, 125, 280][d?.r || 0] + lv * 5 + st * 9;
  const tierMult = (pet.rainbow ? 3.2 : pet.gold ? 1.8 : 1) * (pet.huge ? 4.0 : 1) * (pet.eclipse ? 2.6 : pet.moon ? 1.6 : 1) * (pet.prism ? 1.45 : 1);
  const p = ensureYard(b);
  const strBonus = 1 + enchantBonus(b, "strength") / 100;
  const potBonus = p.potOn.dmg && p.potions.dmg > 0 ? 1.6 : 1;
  const mastBonus = 1 + (masteryLv(p.mastery.break) - 1) * 0.04;
  const rebBonus = 1 + (p.rebirths || 0) * 0.75;
  return Math.round(base * tierMult * strBonus * potBonus * mastBonus * rebBonus);
}

export function squadDps(b) {
  const p = ensureYard(b);
  return p.squad.reduce((sum, id) => {
    const pet = b.pets.find((q) => q.id === id);
    return sum + petPower(pet, b);
  }, 0);
}

export function equipBestSquad(b) {
  const p = ensureYard(b);
  p.squad = [...b.pets]
    .sort((a, c) => petPower(c, b) - petPower(a, b))
    .slice(0, p.slots)
    .map((q) => q.id);
  return p.squad;
}

function petLabel(pet) {
  const d = specie(pet.sp);
  return `${pet.huge ? "Huge " : ""}${pet.rainbow ? "Rainbow " : pet.gold ? "Golden " : ""}${pet.prism ? "Prism " : ""}${pet.eclipse ? "Eclipse " : pet.moon ? "Moonlit " : ""}${pet.name || d?.name || "Critter"}`;
}

export function breakablesPage(ctx, tab = "arena") {
  const { b, page, esc, ping, save, pay, checkGoals, say, wearUrl } = ctx;
  const p = ensureYard(b);
  const z = PS_ZONES[p.curZone] || PS_ZONES[0];
  const tabs = `<div class="dy-tabs"><button type="button" class="${tab === "arena" ? "on" : ""}" data-t="arena">Breakables Arena</button><button type="button" class="${tab === "squad" ? "on" : ""}" data-t="squad">Pet Squad (${p.squad.length}/${p.slots})</button><button type="button" class="${tab === "zones" ? "on" : ""}" data-t="zones">Zones (${p.zone + 1}/${PS_ZONES.length})</button></div>`;

  if (tab === "squad") {
    const slotCost = 60 + (p.slots - 3) * 85;
    const html = `${tabs}<div class="by-jobtop"><strong>Squad DPS: ${squadDps(b)}/s</strong><span>💎 ${p.diamonds} Diamonds</span><button class="btn btn-accent" type="button" id="ps-best">Equip Best</button>${p.slots < 8 ? `<button class="btn" type="button" id="ps-slot" ${p.diamonds >= slotCost ? "" : "disabled"}>+1 Slot (${slotCost} 💎)</button>` : "<em>Max Slots (8)</em>"}</div><p class="muted">Your equipped squad automatically smashes breakables in the Arena.</p><div class="by-grid">${b.pets.length ? b.pets.map((pet) => {
      const d = specie(pet.sp), on = p.squad.includes(pet.id);
      return `<div class="by-pet${on ? " on" : ""}" style="--r:${RAR_C[d.r]}"><img src="${wearUrl(pet)}" alt=""><strong>${esc(petLabel(pet))}</strong><small>${RARITY[d.r]} · ⚡ ${petPower(pet, b)} DPS</small><button class="btn${on ? " btn-accent" : ""}" type="button" data-eq="${pet.id}">${on ? "Equipped" : "Equip"}</button></div>`;
    }).join("") : "<p>Adopt critters at Tidepool Shelter first!</p>"}</div>`;
    page("Breakables Yard · Squad", html, (e) => {
      e.querySelectorAll("[data-t]").forEach((x) => (x.onclick = () => breakablesPage(ctx, x.dataset.t)));
      e.querySelector("#ps-best").onclick = () => { equipBestSquad(b); save(); ping("choice"); breakablesPage(ctx, "squad"); };
      const sl = e.querySelector("#ps-slot");
      if (sl) sl.onclick = () => { if (p.diamonds < slotCost || p.slots >= 8) return; p.diamonds -= slotCost; p.slots++; equipBestSquad(b); save(); ping("done"); checkGoals(); breakablesPage(ctx, "squad"); };
      e.querySelectorAll("[data-eq]").forEach((x) => (x.onclick = () => {
        const id = +x.dataset.eq;
        if (p.squad.includes(id)) p.squad = p.squad.filter((q) => q !== id);
        else if (p.squad.length < p.slots) p.squad.push(id);
        else return say(`Squad full (${p.slots}/${p.slots}).`);
        save(); ping("blip"); breakablesPage(ctx, "squad");
      }));
    });
    return;
  }

  if (tab === "zones") {
    const html = `${tabs}<div class="by-jobtop"><strong>Rebirths: ${p.rebirths}</strong><span>💎 ${p.diamonds} Diamonds · ${b.shells} shells</span></div><div class="by-list">${PS_ZONES.map((zn, i) => {
      const unlocked = i <= p.zone, cur = i === p.curZone, next = i === p.zone + 1;
      return `<div><i style="background:${zn.color}"></i><span><strong>Zone ${i + 1}: ${esc(zn.name)}</strong><small>${zn.mult}× rewards · Boss ${zn.bossHp} HP</small></span>${unlocked ? `<button class="btn${cur ? " btn-accent" : ""}" type="button" data-go="${i}">${cur ? "Active" : "Enter"}</button>` : next ? `<button class="btn btn-accent" type="button" data-unlock="${i}" ${b.shells >= zn.cost ? "" : "disabled"}>Unlock (${zn.cost} shells)</button>` : `<em>Locked</em>`}</div>`;
    }).join("")}</div>`;
    page("Breakables Yard · Zones", html, (e) => {
      e.querySelectorAll("[data-t]").forEach((x) => (x.onclick = () => breakablesPage(ctx, x.dataset.t)));
      e.querySelectorAll("[data-go]").forEach((x) => (x.onclick = () => { p.curZone = +x.dataset.go; save(); ping("choice"); breakablesPage(ctx, "arena"); }));
      e.querySelectorAll("[data-unlock]").forEach((x) => (x.onclick = () => {
        const i = +x.dataset.unlock, zn = PS_ZONES[i];
        if (i !== p.zone + 1 || b.shells < zn.cost) return;
        b.shells -= zn.cost; p.zone = i; p.curZone = i; save(); ping("done"); checkGoals(); breakablesPage(ctx, "arena");
      }));
    });
    return;
  }

  // Interactive Arena
  let items = [], uid = 1, kills = 0, lastNote = `Tap breakables to help your ${p.squad.length}-critter squad!`;
  const spawnItem = (boss = false) => {
    const kind = boss ? ["boss", `${z.name} Boss Chest`, "👑", 4.5, 9, 8] : BREAKABLES[Math.floor(Math.random() * BREAKABLES.length)];
    const baseHp = boss ? z.bossHp : Math.round((z.hp[0] + Math.random() * (z.hp[1] - z.hp[0])) * kind[3]);
    return { u: uid++, boss, kind, hp: baseHp, max: baseHp };
  };
  for (let i = 0; i < 6; i++) items.push(spawnItem(false));

  const tapDmg = () => {
    const dps = Math.max(18, squadDps(b));
    return Math.round((24 + dps * 0.45) * (1 + enchantBonus(b, "tap") / 100));
  };

  const awardBreak = (it) => {
    p.totalBroken++;
    if (it.boss) p.bossesBroken++;
    p.mastery.break += it.boss ? 18 : 4;
    addQuestProgress(b, "break", 1);
    if (it.boss) addQuestProgress(b, "boss", 1);
    const coinsMult = (1 + enchantBonus(b, "coins") / 100) * (p.potOn.coins && p.potions.coins > 0 ? 1.75 : 1) * (1 + p.rebirths * 0.4);
    const shellGot = pay(b, Math.max(4, Math.round(6 * z.mult * it.kind[4] * coinsMult)));
    const treasMult = 1 + enchantBonus(b, "treasure") / 100;
    const diaGot = Math.max(1, Math.round((it.boss ? 12 : 2) * it.kind[5] * (1 + p.curZone * 0.35) * treasMult));
    p.diamonds += diaGot;
    if (p.potOn.coins && p.potions.coins > 0 && Math.random() < 0.12) p.potions.coins--;
    if (p.potOn.dmg && p.potions.dmg > 0 && Math.random() < 0.12) p.potions.dmg--;
    let extra = "";
    if (Math.random() < (it.boss ? 0.45 : 0.05) * treasMult) {
      const eDef = ENCHANTS[Math.floor(Math.random() * ENCHANTS.length)];
      const k = `${eDef[0]}_1`;
      p.enchants[k] = (p.enchants[k] || 0) + 1;
      extra = ` + ${eDef[1]} I!`;
    }
    lastNote = `${it.kind[1]} smashed! +${shellGot} shells, +${diaGot} 💎${extra}`;
    kills++;
    checkGoals();
  };

  const hitItem = (it, dmg, allowCrit = true) => {
    const critChance = enchantBonus(b, "crit") / 100;
    const crit = allowCrit && Math.random() < critChance;
    const dealt = crit ? Math.round(dmg * 2.5) : dmg;
    it.hp -= dealt;
    if (it.hp <= 0) {
      awardBreak(it);
      const idx = items.indexOf(it);
      if (idx >= 0) items[idx] = spawnItem(kills > 0 && kills % 6 === 0 && !items.some((q) => q.boss));
      return true;
    }
    return false;
  };

  const html = `${tabs}<div class="by-jobtop"><strong>Zone ${p.curZone + 1}: ${esc(z.name)} (${z.mult}×)</strong><span>⚡ ${squadDps(b)} DPS · 💎 ${p.diamonds}</span><button class="btn" type="button" id="ps-boss">Summon Boss</button></div><p class="muted" id="ps-note">${esc(lastNote)}</p><div class="by-crates" id="ps-field"></div>`;
  page("Breakables Yard", html, (e) => {
    e.querySelectorAll("[data-t]").forEach((x) => (x.onclick = () => breakablesPage(ctx, x.dataset.t)));
    const field = e.querySelector("#ps-field"), note = e.querySelector("#ps-note");
    const paint = () => {
      const ids = items.map((it) => String(it.u)).join(",");
      if (field.dataset.ids !== ids) {
        field.dataset.ids = ids;
        field.innerHTML = items.map((it) => `<button type="button" class="by-crate" data-br="${it.u}" style="border-color:${it.boss ? "#ffd25a" : z.color}"><span>${it.kind[2]}</span><strong>${esc(it.kind[1])}</strong><small>${Math.max(0, it.hp)} / ${it.max} HP</small><div style="width:100%;height:6px;background:rgba(0,0,0,.25);border-radius:4px;overflow:hidden"><div style="width:${Math.max(0, Math.min(100, (it.hp / it.max) * 100))}%;height:100%;background:${it.boss ? "#ffd25a" : "#67d6a4"}"></div></div></button>`).join("");
      } else {
        items.forEach((it, idx) => {
          const btn = field.children[idx];
          if (!btn) return;
          btn.querySelector("small").textContent = `${Math.max(0, it.hp)} / ${it.max} HP`;
          btn.querySelector("div > div").style.width = `${Math.max(0, Math.min(100, (it.hp / it.max) * 100))}%`;
        });
      }
      note.textContent = lastNote;
    };
    field.onclick = (ev) => {
      const btn = ev.target.closest("[data-br]");
      if (!btn) return;
      const it = items.find((q) => q.u === +btn.dataset.br);
      if (!it) return;
      const broke = hitItem(it, tapDmg(), true);
      ping(broke ? "done" : "blip");
      paint();
    };
    e.querySelector("#ps-boss").onclick = () => {
      if (items.some((q) => q.boss)) return say("A Boss Chest is already in the field!");
      items[0] = spawnItem(true);
      ping("choice");
      paint();
    };
    paint();
    const timer = setInterval(() => {
      const dps = squadDps(b);
      if (dps > 0 && items.length) {
        const target = items.find((q) => q.boss) || items[0];
        if (hitItem(target, Math.max(1, Math.round(dps * 0.4)), true)) ping("done");
        paint();
      }
    }, 400);
    return () => { clearInterval(timer); save(); };
  });
}

export function forgePage(ctx, tab = "gold") {
  const { b, page, esc, ping, save, checkGoals, say, petUrl } = ctx;
  const p = ensureYard(b);
  const tabs = `<div class="dy-tabs"><button type="button" class="${tab === "gold" ? "on" : ""}" data-t="gold">Golden & Rainbow</button><button type="button" class="${tab === "eggs" ? "on" : ""}" data-t="eggs">Exclusive Eggs</button><button type="button" class="${tab === "enchants" ? "on" : ""}" data-t="enchants">Enchants & Potions</button></div>`;

  if (tab === "eggs") {
    const luckMult = (1 + enchantBonus(b, "lucky") / 100) * (p.potOn.luck && p.potions.luck > 0 ? 1.65 : 1) * (1 + (masteryLv(p.mastery.hatch) - 1) * 0.04);
    const rollExclusive = (titanic = false) => {
      const rar = titanic ? (Math.random() < 0.25 ? 4 : 3) : (Math.random() < 0.08 * luckMult ? 4 : Math.random() < 0.32 * luckMult ? 3 : 2);
      const pool = SPECIES.filter((x) => x.r === rar);
      const sp = pool[Math.floor(Math.random() * pool.length)].id;
      const pet = addPet(b, sp);
      if (Math.random() < (titanic ? 0.14 : 0.045) * luckMult) {
        pet.huge = true;
        p.hugeHatched++;
      } else if (Math.random() < (titanic ? 0.35 : 0.15)) {
        pet.gold = true;
      }
      if (p.potOn.luck && p.potions.luck > 0) p.potions.luck--;
      p.mastery.hatch += titanic ? 18 : 8;
      addQuestProgress(b, "hatch", 1);
      return pet;
    };
    const html = `${tabs}<div class="by-jobtop"><strong>Hatchery Mastery Lv.${masteryLv(p.mastery.hatch)}</strong><span>💎 ${p.diamonds} Diamonds · ${b.shells} shells</span></div><div class="by-crates"><button type="button" class="by-crate" id="ex-star" ${p.diamonds >= 90 ? "" : "disabled"}><span>🥚</span><strong>Exclusive Starlight Egg</strong><small>90 💎 · Rare–Legendary + Huge chance</small></button><button type="button" class="by-crate" id="ex-tit" ${p.diamonds >= 280 ? "" : "disabled"}><span>🌟</span><strong>Titanic Reef Egg</strong><small>280 💎 · Epic+ + High Gold/Huge</small></button><button type="button" class="by-crate" id="ex-shell" ${b.shells >= 900 ? "" : "disabled"}><span>🐚</span><strong>Shell Mystery Egg</strong><small>900 shells · Starlight Egg roll</small></button></div>`;
    page("Exclusive Hatchery", html, (e) => {
      e.querySelectorAll("[data-t]").forEach((x) => (x.onclick = () => forgePage(ctx, x.dataset.t)));
      const showHatch = (pet) => { save(); ping("done"); checkGoals(); say(`Hatched ${petLabel(pet)}!`); forgePage(ctx, "eggs"); };
      e.querySelector("#ex-star").onclick = () => { if (p.diamonds < 90) return; p.diamonds -= 90; showHatch(rollExclusive(false)); };
      e.querySelector("#ex-tit").onclick = () => { if (p.diamonds < 280) return; p.diamonds -= 280; showHatch(rollExclusive(true)); };
      e.querySelector("#ex-shell").onclick = () => { if (b.shells < 900) return; b.shells -= 900; showHatch(rollExclusive(false)); };
    });
    return;
  }

  if (tab === "enchants") {
    const owned = Object.entries(p.enchants).filter(([, n]) => n > 0);
    const html = `${tabs}<div class="by-jobtop"><strong>Equipped Enchants (${p.eqEnchants.length}/3)</strong><span>💎 ${p.diamonds} Diamonds · Mastery Lv.${masteryLv(p.mastery.enchant)}</span><button class="btn btn-accent" type="button" id="en-roll" ${p.diamonds >= 40 ? "" : "disabled"}>Roll Book (40 💎)</button></div><h3>Potions</h3><div class="by-list">${[["dmg", "Damage Potion (+60% DPS)", "⚔️", 35], ["coins", "Coins Potion (+75% Shells)", "🪙", 35], ["luck", "Lucky Potion (+65% Huge/Rare)", "🍀", 45]].map(([k, lbl, ic, cost]) => `<div><i>${ic}</i><span><strong>${lbl}</strong><small>Stock: ${p.potions[k] || 0}</small></span><button class="btn${p.potOn[k] ? " btn-accent" : ""}" type="button" data-ptog="${k}">${p.potOn[k] ? "Active" : "Paused"}</button><button class="btn" type="button" data-pbuy="${k}" data-pc="${cost}" ${p.diamonds >= cost ? "" : "disabled"}>Buy (${cost} 💎)</button></div>`).join("")}</div><h3>Enchant Books</h3><div class="by-list">${owned.length ? owned.map(([key, count]) => {
      const [id, tierStr] = key.split("_"), tier = +tierStr || 1, def = ENCHANTS.find((q) => q[0] === id);
      const eq = p.eqEnchants.includes(key);
      return `<div><i>${def[2]}</i><span><strong>${def[1]} Tier ${["I", "II", "III"][tier - 1]} (×${count})</strong><small>${def[3]} (+${def[4][tier - 1]}%)</small></span><button class="btn${eq ? " btn-accent" : ""}" type="button" data-eeq="${key}">${eq ? "Unequip" : "Equip"}</button>${tier < 3 && count >= 2 ? `<button class="btn" type="button" data-eup="${key}">Upgrade (2→1)</button>` : ""}</div>`;
    }).join("") : "<p class=\"muted\">No Enchant Books yet. Roll one above or smash Breakables!</p>"}</div>`;
    page("Enchants & Potions", html, (e) => {
      e.querySelectorAll("[data-t]").forEach((x) => (x.onclick = () => forgePage(ctx, x.dataset.t)));
      e.querySelector("#en-roll").onclick = () => {
        if (p.diamonds < 40) return;
        p.diamonds -= 40;
        const def = ENCHANTS[Math.floor(Math.random() * ENCHANTS.length)];
        const k = `${def[0]}_1`;
        p.enchants[k] = (p.enchants[k] || 0) + 1;
        p.mastery.enchant += 6;
        save(); ping("done"); say(`Got ${def[1]} I!`); forgePage(ctx, "enchants");
      };
      e.querySelectorAll("[data-ptog]").forEach((x) => (x.onclick = () => { const k = x.dataset.ptog; p.potOn[k] = !p.potOn[k]; save(); ping("blip"); forgePage(ctx, "enchants"); }));
      e.querySelectorAll("[data-pbuy]").forEach((x) => (x.onclick = () => { const k = x.dataset.pbuy, c = +x.dataset.pc; if (p.diamonds < c) return; p.diamonds -= c; p.potions[k] = (p.potions[k] || 0) + 2; save(); ping("done"); forgePage(ctx, "enchants"); }));
      e.querySelectorAll("[data-eeq]").forEach((x) => (x.onclick = () => {
        const k = x.dataset.eeq, eid = k.split("_")[0];
        if (p.eqEnchants.includes(k)) p.eqEnchants = p.eqEnchants.filter((q) => q !== k);
        else if (p.eqEnchants.some((q) => q.split("_")[0] === eid)) return say("Only one tier of each enchant can be equipped at once.");
        else if (p.eqEnchants.length < 3) { p.eqEnchants.push(k); addQuestProgress(b, "enchant", 1); }
        else return say("All 3 Enchant slots are full.");
        save(); ping("choice"); checkGoals(); forgePage(ctx, "enchants");
      }));
      e.querySelectorAll("[data-eup]").forEach((x) => (x.onclick = () => {
        const k = x.dataset.eup, [id, t] = k.split("_"), tier = +t || 1;
        if ((p.enchants[k] || 0) < 2 || tier >= 3) return;
        p.enchants[k] -= 2;
        if (p.enchants[k] <= 0) { delete p.enchants[k]; p.eqEnchants = p.eqEnchants.filter((q) => q !== k); }
        const nk = `${id}_${tier + 1}`;
        p.enchants[nk] = (p.enchants[nk] || 0) + 1;
        p.mastery.enchant += 12;
        addQuestProgress(b, "enchant", 1);
        save(); ping("done"); checkGoals(); forgePage(ctx, "enchants");
      }));
    });
    return;
  }

  // Golden & Rainbow Forge
  const normCounts = {}, goldCounts = {};
  for (const pet of b.pets) {
    if (!pet.gold && !pet.rainbow) (normCounts[pet.sp] ||= []).push(pet);
    else if (pet.gold && !pet.rainbow) (goldCounts[pet.sp] ||= []).push(pet);
  }
  const normRows = Object.entries(normCounts).filter(([, l]) => l.length >= 3);
  const goldRows = Object.entries(goldCounts).filter(([, l]) => l.length >= 3);
  const html = `${tabs}<div class="by-jobtop"><strong>Forge Mastery Lv.${masteryLv(p.mastery.forge)}</strong><span>Gold: ${p.goldMade} · Rainbow: ${p.rainbowMade}</span></div><h3>Golden Machine (5 free, or 3 + 250 shells)</h3><div class="by-list">${normRows.length ? normRows.map(([sp, l]) => {
    const d = specie(sp);
    return `<div><img src="${petUrl(sp)}" alt=""><span><strong>${esc(d.name)} (×${l.length})</strong><small>Golden = 1.8× DPS & Shell mult</small></span>${l.length >= 5 ? `<button class="btn btn-accent" type="button" data-mg="${sp}" data-n="5">Fuse 5</button>` : ""}<button class="btn" type="button" data-mg="${sp}" data-n="3" ${b.shells >= 250 ? "" : "disabled"}>Fuse 3 + 250s</button></div>`;
  }).join("") : "<p class=\"muted\">Need at least 3 matching normal critters to forge Golden.</p>"}</div><h3>Rainbow Machine (5 Golden free, or 3 + 800 shells)</h3><div class="by-list">${goldRows.length ? goldRows.map(([sp, l]) => {
    const d = specie(sp);
    return `<div><img src="${petUrl(sp)}" alt=""><span><strong>Golden ${esc(d.name)} (×${l.length})</strong><small>Rainbow = 3.2× DPS & Shell mult</small></span>${l.length >= 5 ? `<button class="btn btn-accent" type="button" data-mr="${sp}" data-n="5">Fuse 5</button>` : ""}<button class="btn" type="button" data-mr="${sp}" data-n="3" ${b.shells >= 800 ? "" : "disabled"}>Fuse 3 + 800s</button></div>`;
  }).join("") : "<p class=\"muted\">Need at least 3 matching Golden critters to forge Rainbow.</p>"}</div>`;
  page("Golden & Rainbow Forge", html, (e) => {
    e.querySelectorAll("[data-t]").forEach((x) => (x.onclick = () => forgePage(ctx, x.dataset.t)));
    const fuse = (sp, n, cost, toRainbow) => {
      if (cost && b.shells < cost) return;
      const pool = b.pets.filter((q) => q.sp === sp && (toRainbow ? q.gold && !q.rainbow : !q.gold && !q.rainbow));
      if (pool.length < n) return;
      const vScore = (q) => (q.huge ? 8 : 0) + (q.eclipse ? 4 : 0) + (q.moon ? 2 : 0) + (q.prism ? 1 : 0);
      pool.sort((a, c) => vScore(a) - vScore(c));
      if (cost) b.shells -= cost;
      const drop = new Set(pool.slice(0, n - 1).map((q) => q.id));
      const keep = pool[n - 1];
      if (toRainbow) { keep.gold = false; keep.rainbow = true; p.rainbowMade++; }
      else { keep.gold = true; p.goldMade++; }
      b.pets = b.pets.filter((q) => !drop.has(q.id));
      if (drop.has(b.active)) b.active = keep.id;
      p.mastery.forge += toRainbow ? 25 : 10;
      addQuestProgress(b, "forge", 1);
      equipBestSquad(b);
      save(); ping("done"); checkGoals(); say(`Forged ${petLabel(keep)}!`); forgePage(ctx, "gold");
    };
    e.querySelectorAll("[data-mg]").forEach((x) => (x.onclick = () => fuse(x.dataset.mg, +x.dataset.n, +x.dataset.n === 3 ? 250 : 0, false)));
    e.querySelectorAll("[data-mr]").forEach((x) => (x.onclick = () => fuse(x.dataset.mr, +x.dataset.n, +x.dataset.n === 3 ? 800 : 0, true)));
  });
}

export function shrinePage(ctx, tab = "rank") {
  const { b, page, esc, ping, save, checkGoals, say } = ctx;
  const p = ensureYard(b);
  const tabs = `<div class="dy-tabs"><button type="button" class="${tab === "rank" ? "on" : ""}" data-t="rank">Rank Quests</button><button type="button" class="${tab === "mastery" ? "on" : ""}" data-t="mastery">Mastery</button><button type="button" class="${tab === "rebirth" ? "on" : ""}" data-t="rebirth">Rebirth Shrine</button></div>`;

  if (tab === "mastery") {
    const tracks = [
      ["break", "Breakables Mastery", "⚔️", "+4% Squad DPS per level"],
      ["hatch", "Hatching Mastery", "🥚", "+4% Huge & Rare egg luck per level"],
      ["forge", "Forge Mastery", "🌈", "Tracks Golden & Rainbow crafting"],
      ["enchant", "Enchants Mastery", "📘", "Tracks Enchant rolling & fusing"],
    ];
    const html = `${tabs}<div class="by-list">${tracks.map(([k, name, ic, desc]) => {
      const xp = p.mastery[k] || 0, lv = masteryLv(xp);
      return `<div><i>${ic}</i><span><strong>${name} · Lv.${lv}/25</strong><small>${desc} (${xp} XP)</small></span><em>+${(lv - 1) * 4}%</em></div>`;
    }).join("")}</div>`;
    page("Mastery", html, (e) => e.querySelectorAll("[data-t]").forEach((x) => (x.onclick = () => shrinePage(ctx, x.dataset.t))));
    return;
  }

  if (tab === "rebirth") {
    const can = p.zone >= PS_ZONES.length - 1;
    const html = `${tabs}<div class="by-jobtop"><strong>Rebirths: ${p.rebirths}</strong><span>Bonus: +${p.rebirths * 75}% DPS · +${p.rebirths * 40}% Shells</span></div><p class="muted">Reach Zone 5 (Void Reef) to Rebirth. Rebirthing resets your Zone unlocks back to Zone 1 while keeping all Critters, Diamonds, Enchants, Ranks, Mastery, and Shells — and permanently empowers your entire Squad!</p><button class="btn btn-accent" type="button" id="ps-reb" ${can ? "" : "disabled"}>${can ? `Rebirth #${p.rebirths + 1} (+100 💎)` : "Unlock Void Reef (Zone 5) first"}</button>`;
    page("Rebirth Shrine", html, (e) => {
      e.querySelectorAll("[data-t]").forEach((x) => (x.onclick = () => shrinePage(ctx, x.dataset.t)));
      e.querySelector("#ps-reb").onclick = () => {
        if (!can) return;
        p.rebirths++;
        p.zone = 0;
        p.curZone = 0;
        p.diamonds += 100;
        if (p.rebirths === 1 && p.slots < 8) p.slots++;
        save(); ping("done"); checkGoals(); say(`Rebirth #${p.rebirths} complete!`); shrinePage(ctx, "rebirth");
      };
    });
    return;
  }

  const q = p.quest, done = q.have >= q.need;
  const html = `${tabs}<div class="by-jobtop"><strong>Rank ${p.rank} / 10</strong><span>Squad Slots: ${p.slots}/8 · 💎 ${p.diamonds}</span></div><p class="muted">Complete Rank Quests to earn Diamonds and unlock extra Squad Slots at Ranks 2, 4, 6, 8, and 10.</p><div class="by-list"><div><i>⭐</i><span><strong>${esc(q.label)} (${q.have}/${q.need})</strong><small>Reward: +${q.reward} 💎 & Rank Up</small></span><button class="btn btn-accent" type="button" id="ps-claim" ${done ? "" : "disabled"}>${done ? "Claim & Rank Up" : "In Progress"}</button></div></div>`;
  page("Rank Quests", html, (e) => {
    e.querySelectorAll("[data-t]").forEach((x) => (x.onclick = () => shrinePage(ctx, x.dataset.t)));
    e.querySelector("#ps-claim").onclick = () => {
      if (!done) return;
      p.diamonds += q.reward;
      if (p.rank < 10) {
        p.rank++;
        if (p.rank % 2 === 0 && p.slots < 8) p.slots++;
      }
      p.quest = rollQuest(p.rank);
      equipBestSquad(b);
      save(); ping("done"); checkGoals(); say(`Ranked up to Rank ${p.rank}!`); shrinePage(ctx, "rank");
    };
  });
}
