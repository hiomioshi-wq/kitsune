// The Lantern Guild: Guild Ranks, Companion Expeditions, Guild Armory and World Mastery tracker.
import { esc } from "../util.js";
import { ITEMS } from "./extras.js";
import { DELVE_SITES } from "./delve.js";
import { TRIALS } from "./trials.js";
import { FAR_QUESTS } from "./far.js";

export const GUILD_RANKS = [
  [0, "Apprentice Bearer"],
  [100, "Roadwarden"],
  [260, "Wayfinder"],
  [500, "Arch-Courier"],
  [850, "Keeper of Beacons"],
  [1300, "Grand Lantern Master"],
  [1900, "Meridian Warden"],
  [2600, "Sovereign of the Nine"],
  [3500, "Chronicler of Blackwood"],
  [4600, "Eternal Star-Bearer"],
];

export const EXPEDITIONS = [
  { id: "coast", name: "Patrol Saltwick Coast", mins: 1, cost: 20, marks: 18, mon: 45, loot: ["shell", "kelp", "pearl"], desc: "Send a resident down the shore for shells and tide-finds." },
  { id: "frontier", name: "Chart the Southern Frontier", mins: 2, cost: 40, marks: 34, mon: 95, loot: ["coralbranch", "glowshroom", "starice"], desc: "Scout the Coral Causeway, Cavern, and Starfall Glacier." },
  { id: "eastern", name: "Chart the Eastern Frontier", mins: 3, cost: 55, marks: 48, mon: 130, loot: ["amberresin", "saltprism", "basaltshard"], desc: "Explore the Amber Woods, Salt Flats, and Obsidian Coast." },
  { id: "sky", name: "Survey the Skyward Isles", mins: 3, cost: 65, marks: 55, mon: 150, loot: ["cloudcotton", "quartz", "meteor"], desc: "Ride the high currents for sky-glass and starfall shards." },
  { id: "deep", name: "Dredge the Sunken Deep", mins: 4, cost: 85, marks: 75, mon: 210, loot: ["seaglass", "crystal", "pearl"], desc: "Lower the diving bell for abyssal relics and pearls." },
  { id: "southern", name: "Sail the Maelstrom Rim", mins: 4, cost: 95, marks: 88, mon: 245, loot: ["kelpribbon", "prismglass", "stormstone"], desc: "Brave the Kelp Archipelago, Prism Reefs, and Maelstrom Rim." },
  { id: "blackwood", name: "Audit Blackwood's Stairwell", mins: 5, cost: 110, marks: 100, mon: 280, loot: ["ink", "obsidian", "emerald"], desc: "Send someone brave into Tray Three with a clipboard." },
  { id: "deepbw", name: "Survey Meridian Sector 4", mins: 6, cost: 140, marks: 130, mon: 360, loot: ["starice", "meteor", "crystal"], desc: "Venture past the wall Yuki opened into Deep Blackwood." },
  { id: "incarnate", name: "Scout Halcyon & the Canyon", mins: 5, cost: 125, marks: 115, mon: 320, loot: ["obsidian", "amberresin", "crystal"], desc: "Sweep the Mini-Portal Lab and the Starving Canyon." },
  { id: "backrooms", name: "Map Level 3999 & the Hub", mins: 6, cost: 155, marks: 145, mon: 400, loot: ["quartz", "prismglass", "meteor"], desc: "Trace the neon arcade doors past Level 4." },
  { id: "citadel", name: "Patrol the Starlight Citadel", mins: 7, cost: 185, marks: 175, mon: 480, loot: ["starice", "meteor", "pearl"], desc: "Cross the Bridge of Nine Tails to the Cloud Gallery." },
  { id: "abyssal", name: "Chart the 153rd Horizon", mins: 8, cost: 220, marks: 210, mon: 580, loot: ["stormstone", "crystal", "emerald"], desc: "Sail out to the Elysian Terminus at the edge of the chart." },
  { id: "rescue", name: "The Mine Rescue", mins: 9, cost: 245, marks: 225, mon: 625, loot: ["basaltshard", "crystal", "emerald"], req: 850, desc: "Dig a trapped miner out of the Deep Mines before his lantern gutters." },
  { id: "regatta", name: "Regatta Guard", mins: 1, cost: 15, marks: 13, mon: 38, loot: ["shell", "seaglass", "pearl"], desc: "Escort the paper boats of the Lantern Regatta along the shore." },
  { id: "retrospect", name: "Ride the Retrospect Express", mins: 5, cost: 130, marks: 120, mon: 340, loot: ["ink", "gear", "quartz"], desc: "Board at Platform Null and survive the Three-Second Car." },
  { id: "deadletter", name: "Sort the Dead Letter Office", mins: 6, cost: 150, marks: 140, mon: 390, loot: ["page", "ink", "gold"], desc: "Help Inspector Yuki deliver the backlog before dawn." },
  { id: "hellspeak", name: "Inspect Hell's Peak Estates", mins: 4, cost: 90, marks: 85, mon: 230, loot: ["honey", "poppy", "silk"], desc: "Measure the grass to two and a half inches without saying please." },
  { id: "oceanislands", name: "Chart the Uncharted Atolls", mins: 7, cost: 175, marks: 165, mon: 460, loot: ["pearl", "coralbranch", "starice"], desc: "Sail past the 12 ocean islands and log every drift chest." },
];

export const GUILD_ARMORY = [
  { id: "perk:boots", kind: "perk", key: "boots", name: "Courier's Boots", desc: "+10% walking speed across Kitsune World.", marks: 40 },
  { id: "perk:luck", kind: "perk", key: "luck", name: "Wayfinder's Satchel", desc: "+1 bonus item from every Guild Expedition.", marks: 70 },
  { id: "perk:oil", kind: "perk", key: "oil", name: "First-Lantern Oil", desc: "+20% mon from Guild Expeditions.", marks: 100 },
  { id: "perk:lantern", kind: "perk", key: "lantern", name: "Astral Wick", desc: "+15% Guild XP and Marks from Expeditions.", marks: 115 },
  { id: "perk:charm", kind: "perk", key: "charm", name: "Foxfire Compass Charm", desc: "+15% extra mon from Expeditions.", marks: 130 },
  { id: "perk:carnival", kind: "perk", key: "carnival", name: "Carnival Pass", desc: "+10% mon from Guild Expeditions.", marks: 90 },
  { id: "perk:moth", kind: "perk", key: "moth", name: "Moth Charm", desc: "Drawn to the lantern: +1 bonus item from every Guild Expedition.", marks: 150 },
  { id: "hat:guildhat", kind: "hat", key: "guildhat", name: "Guildmaster's Hat", desc: "Worn by Keepers of the Guild.", marks: 120 },
  { id: "furn:guildbanner", kind: "furn", key: "guildbanner", name: "Guild Banner", desc: "Crimson and gold banner for your house.", marks: 55 },
  { id: "furn:compass", kind: "furn", key: "compass", name: "Golden Compass", desc: "Always points toward Hollow Pine.", marks: 80 },
];

export function createGuild(o) {
  const { s, people, extras, panel, closePanel, toast, ping, save, hud, giveHat, giveFurn } = o;
  const g = (s.guild ||= {});
  g.marks ??= 0;
  g.xp ??= 0;
  g.perks ??= {};
  g.runs ??= [];
  g.done ??= 0;

  const rankOf = () => [...GUILD_RANKS].reverse().find((r) => g.xp >= r[0]) || GUILD_RANKS[0];
  const nextRank = () => GUILD_RANKS.find((r) => r[0] > g.xp);
  const itemName = (id) => ITEMS.find((i) => i[0] === id)?.[1] || id;
  const speedMul = () => (g.perks.boots ? 1.1 : 1);

  const mastery = () => [
    ["Nine Lanterns", Object.keys(s.lit || {}).length + (s.final ? 1 : 0), 9],
    ["Far Beacons", Object.keys(s.far?.lit || {}).length, FAR_QUESTS.length],
    ["Skyward Wind-Bells", Object.keys(s.sky?.bells || {}).length, 6],
    ["Sunken Deep Lanterns", Object.keys(s.deep?.lit || {}).length, 6],
    ["Blackwood Relics", Object.keys(s.realm?.blackwood?.found || {}).length, 45],
    ["Deep Blackwood Relics", Object.keys(s.realm?.blackwood2?.found || {}).length, 16],
    ["Incarnate Relics", Object.keys(s.realm?.incarnate?.found || {}).length, 25],
    ["Backrooms Relics", Object.keys(s.realm?.backrooms?.found || {}).length, 16],
    ["Spirit Express Relics", Object.keys(s.realm?.express?.found || {}).length, 6],
    ["Starlight Citadel Relics", Object.keys(s.realm?.citadel?.found || {}).length, 5],
    ["Under-Market Relics", Object.keys(s.realm?.undermarket?.found || {}).length, 6],
    ["Clockworks Relics", Object.keys(s.realm?.clockworks?.found || {}).length, 5],
    ["Emerald Vault Relics", Object.keys(s.realm?.emeraldvault?.found || {}).length, 5],
    ["Arena Champions", Object.keys(s.arena?.beat || {}).length, 4],
    ["Delves Cleared", Object.entries(s.realm || {}).filter(([k, v]) => k.startsWith("delve-") && k !== "delve-stair" && v?.beat).length, DELVE_SITES.length],
    ["Regional Trials", Object.values(s.trials || {}).filter((v) => v?.medal).length, TRIALS.length],
    ["Bounties Hunted", Object.keys(s.bounty?.done || {}).length, 149],
    ["Side Quests", Object.keys(s.sq?.done || {}).length, 164],
    ["Detective Cases", Object.keys(s.agency?.solved || {}).length, 20],
    ["Card Duels Won", Object.keys(s.cards?.wins || {}).length, 311],
    ["Critters Photographed", Object.keys(s.square?.guide || {}).length, 20],
  ];

  function board(tab = "exp") {
    const now = Date.now();
    const rank = rankOf();
    const nxt = nextRank();
    const met = people.filter((p) => s.met?.[p.id]);
    const busyIds = new Set(g.runs.map((r) => r.who));
    const freeNpc = met.filter((p) => !busyIds.has(p.id));

    const tabs = [
      ["exp", `Expeditions (${g.runs.length}/3)`],
      ["armory", `Armory (${g.marks} marks)`],
      ["mastery", "World Mastery"],
    ];

    let body = "";
    if (tab === "exp") {
      const activeHtml = g.runs.length
        ? `<h4>Active Expeditions</h4><div class="se-mkt">${g.runs.map((r, i) => {
            const ex = EXPEDITIONS.find((q) => q.id === r.id);
            const left = Math.max(0, Math.ceil((r.end - now) / 1000));
            const who = people.find((p) => p.id === r.who)?.n[2] || r.who;
            return `<div class="se-good"><span><strong>${esc(ex.name)}</strong><small>${esc(who)} · ${left ? `${left}s remaining` : "Ready to claim!"}</small></span><button class="btn btn-accent" type="button" data-claim="${i}" ${left ? "disabled" : ""}>${left ? "Away" : "Claim"}</button></div>`;
          }).join("")}</div>`
        : "";

      body = `${activeHtml}<h4>Dispatch a Resident</h4><p class="muted">Send met residents on timed expeditions for mon, rare items, and Guild Marks. (${freeNpc.length} available)</p>
        <div class="se-mkt">${EXPEDITIONS.map((ex) => {
          const can = g.runs.length < 3 && freeNpc.length > 0 && s.mon >= ex.cost && (!ex.req || g.xp >= ex.req);
          return `<div class="se-good"><span><strong>${esc(ex.name)}</strong><small>${esc(ex.desc)}</small><small>${ex.mins}m · Cost ${ex.cost} mon · Pays ~${ex.mon} mon, ${ex.marks} marks${ex.req ? ` · Needs ${esc(GUILD_RANKS.find((r) => r[0] === ex.req)?.[1] || "a higher rank")}` : ""}</small></span><button class="btn btn-accent" type="button" data-go="${ex.id}" ${can ? "" : "disabled"}>Dispatch</button></div>`;
        }).join("")}</div>`;
    } else if (tab === "armory") {
      body = `<p class="muted">Spend Guild Marks earned from expeditions.</p><div class="se-mkt">${GUILD_ARMORY.map((it) => {
        const own = it.kind === "perk" ? !!g.perks[it.key] : it.kind === "hat" ? s.hats?.includes(it.key) : it.kind === "furn" ? !!s.furn?.[it.key] : false;
        const can = g.marks >= it.marks && !own;
        return `<div class="se-good"><span><strong>${esc(it.name)}</strong><small>${esc(it.desc)} · ${it.marks} marks</small></span>${own ? "<em>Owned</em>" : `<button class="btn btn-accent" type="button" data-buy="${it.id}" ${can ? "" : "disabled"}>Claim</button>`}</div>`;
      }).join("")}</div>`;
    } else {
      const rows = mastery();
      const got = rows.reduce((a, r) => a + Math.min(r[1], r[2]), 0);
      const tot = rows.reduce((a, r) => a + r[2], 0);
      body = `<p class="muted">Overall Kitsune World Mastery: <strong>${Math.round((got / tot) * 100)}%</strong> (${got}/${tot})</p>
        <ol class="wd-list">${rows.map(([n, a, b]) => `<li class="${a >= b ? "ok" : ""}"><strong>${esc(n)}</strong><span>${Math.min(a, b)}/${b}</span></li>`).join("")}</ol>`;
    }

    panel(`Lantern Guild · ${rank[1]}`, `<p class="muted">Guild XP: <strong>${g.xp}</strong>${nxt ? ` (${nxt[0] - g.xp} to ${nxt[1]})` : " (Max Rank)"} · Marks: <strong>${g.marks}</strong> · Completed: <strong>${g.done}</strong></p>
      <div class="dy-tabs">${tabs.map(([k, l]) => `<button type="button" class="${k === tab ? "on" : ""}" data-t="${k}">${l}</button>`).join("")}</div>${body}`, (e) => {
      e.querySelectorAll("[data-t]").forEach((b) => (b.onclick = () => board(b.dataset.t)));
      e.querySelectorAll("[data-go]").forEach((b) => (b.onclick = () => {
        const ex = EXPEDITIONS.find((q) => q.id === b.dataset.go);
        if (!ex || g.runs.length >= 3 || !freeNpc.length || s.mon < ex.cost || (ex.req && g.xp < ex.req)) return;
        const pick = freeNpc[Math.floor(Math.random() * freeNpc.length)];
        s.mon -= ex.cost;
        g.runs.push({ id: ex.id, who: pick.id, end: Date.now() + ex.mins * 60000 });
        ping("choice"); save(); hud(); toast(`${pick.n[2]} set out on ${ex.name}.`); board("exp");
      }));
      e.querySelectorAll("[data-claim]").forEach((b) => (b.onclick = () => {
        const i = +b.dataset.claim, r = g.runs[i];
        if (!r || Date.now() < r.end) return;
        const ex = EXPEDITIONS.find((q) => q.id === r.id);
        g.runs.splice(i, 1);
        const pay = Math.round(ex.mon * (g.perks.oil ? 1.2 : 1) * (g.perks.charm ? 1.15 : 1) * (g.perks.carnival ? 1.1 : 1));
        const marks = Math.round(ex.marks * (g.perks.lantern ? 1.15 : 1));
        const nLoot = 1 + (g.perks.luck ? 1 : 0) + (g.perks.moth ? 1 : 0);
        const gotItems = [];
        for (let k = 0; k < nLoot; k++) {
          const it = ex.loot[Math.floor(Math.random() * ex.loot.length)];
          extras.state.bag[it] = (extras.state.bag[it] || 0) + 1;
          extras.state.seen[it] = 1;
          gotItems.push(itemName(it));
        }
        s.mon += pay;
        g.marks += marks;
        g.xp += marks;
        g.done++;
        ping("done"); save(); hud();
        toast(`Expedition complete! +${pay} mon, +${marks} marks, ${gotItems.join(", ")}`);
        board("exp");
      }));
      e.querySelectorAll("[data-buy]").forEach((b) => (b.onclick = () => {
        const it = GUILD_ARMORY.find((q) => q.id === b.dataset.buy);
        if (!it || g.marks < it.marks) return;
        g.marks -= it.marks;
        if (it.kind === "perk") g.perks[it.key] = 1;
        else if (it.kind === "hat") giveHat(it.key);
        else if (it.kind === "furn") giveFurn(it.key);
        ping("done"); save(); hud(); toast(`Claimed ${it.name}!`); board("armory");
      }));
    });
  }

  return { board, speedMul, state: g };
}
