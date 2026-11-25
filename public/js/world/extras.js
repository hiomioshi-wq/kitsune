// More to do in Kitsune World: foraging, critters, chests, cooking, friendships, daily bounties and achievements.
// Saved inside the World save under "x2", so older saves simply start with an empty bag.
import { W, H, T, TILE, regionAt, NPCS } from "./data.js";
import { esc, today } from "../util.js";
import { FAR_ITEMS } from "./far.js";
import { CROP_ITEMS, CROP_MEALS } from "./farm.js";

// id, name, colour, regions ("any" or a list), mon value
export const ITEMS = [
  ["acorn", "Acorn", "#9a6a3a", "village clock", 2], ["mushroom", "Lantern mushroom", "#e8703a", "village lake", 3], ["berry", "Snowberry", "#d3314a", "peaks village", 3], ["herb", "Tea herb", "#4fa35a", "any", 2], ["honey", "Wild honey", "#f2b23a", "village oz", 6], ["pinecone", "Pinecone", "#7a5534", "peaks village", 2],
  ["shell", "Spiral shell", "#f2d9c0", "shore", 3], ["kelp", "Saltwick kelp", "#2f7a5a", "shore lake", 2], ["pearl", "Small pearl", "#eef0f6", "shore", 16], ["driftwood", "Driftwood", "#a58a68", "shore", 2], ["reed", "Reservoir reed", "#7fa04a", "lake", 2], ["lily", "Drowned lily", "#c79bff", "lake", 7], ["page", "Waterlogged page", "#e8dfc8", "lake", 5],
  ["quartz", "Frost quartz", "#bfe6f7", "peaks", 8], ["iron", "Iron ore", "#7b8290", "peaks clock", 5], ["gold", "Gold fleck", "#f2c23c", "peaks", 18], ["gear", "Brass gear", "#c79a2e", "clock", 6], ["spring", "Old spring", "#9aa2aa", "clock", 4], ["silk", "Umbrella silk", "#60379a", "market", 7], ["spice", "Night spice", "#c8452a", "market", 5], ["ink", "Bottled ink", "#23233a", "market", 6],
  ["ticket", "Lost ticket", "#ffd27a", "station", 7], ["coal", "Train coal", "#2e2e36", "station", 3], ["emerald", "Emerald chip", "#35d68a", "oz", 20], ["poppy", "Sleepy poppy", "#e0343e", "oz", 4], ["patch", "Patchwork scrap", "#e88fb8", "oz", 5],
  ...FAR_ITEMS, ...CROP_ITEMS,
];
const HOME_ITEMS = ITEMS.slice(0, 26), FORAGE = ITEMS.filter((q) => q[3] !== "farm");
export const item = (id) => ITEMS.find((x) => x[0] === id) || MEALS.find((x) => x[0] === id);
// id, name, colour, needs, seconds of speed, mon if sold
export const MEALS = [
  ["tea", "Too-long tea", "#8a5a2a", { herb: 2 }, 60, 8], ["jam", "Snowberry jam toast", "#d3314a", { berry: 2, honey: 1 }, 90, 20], ["stew", "Mushroom stew", "#b5703a", { mushroom: 2, herb: 1 }, 120, 18], ["broth", "Saltwick broth", "#3f9a8a", { kelp: 2, shell: 1 }, 90, 14], ["pie", "Acorn pie", "#a5743a", { acorn: 3, honey: 1 }, 150, 26], ["soup", "Lily soup", "#a88fe0", { lily: 1, reed: 2 }, 120, 24],
  ["skewer", "Night Market skewer", "#c8452a", { spice: 2, mushroom: 1 }, 150, 24], ["cocoa", "Hot pinecone cocoa", "#6a3f25", { pinecone: 2, honey: 1 }, 120, 20], ["bento", "Sleeper train bento", "#e8c078", { coal: 1, ticket: 1, herb: 2 }, 180, 34], ["emeraldcake", "Emerald City cake", "#35d68a", { emerald: 1, poppy: 2, honey: 1 }, 240, 70], ["feast", "Keeper's feast", "#ffd27a", { pearl: 1, gold: 1, spice: 1, honey: 2 }, 300, 110], ["clockwork", "Three-seconds-late toffee", "#c79a2e", { gear: 1, spring: 1, honey: 1 }, 180, 36], ...CROP_MEALS,
];
// id, name, wing colour, body, when, regions
export const CRITTERS = [
  ["sulphur", "Sulphur butterfly", "#ffe066", "#3a2a18", "day", "village oz"], ["blue", "Lantern blue", "#6cc8ff", "#22304a", "day", "village lake"], ["monarch", "Courier monarch", "#f08a2a", "#1b1b22", "day", "any"], ["moth", "Radio moth", "#c9b8a0", "#4a3a2c", "night", "any"], ["firefly", "Firefly", "#fff27a", "#2a2a18", "night", "village lake"], ["luna", "Luna moth", "#b8f2c8", "#e8e8d8", "night", "lake oz"],
  ["dragonfly", "Reservoir dragonfly", "#3fc8c0", "#14505a", "day", "lake"], ["crabfly", "Salt fly", "#d8c8a0", "#5a4a30", "day", "shore"], ["snowmoth", "Snow moth", "#f4f8ff", "#a8b8c8", "any", "peaks"], ["icewing", "Icewing", "#bfe6f7", "#5a8ab0", "night", "peaks"], ["gearbug", "Clockwork beetle", "#c79a2e", "#6a4a18", "any", "clock"], ["inkfly", "Ink moth", "#3a3060", "#14102a", "night", "market"], ["cinder", "Cinder fly", "#ff7a3a", "#3a1408", "any", "station"], ["emerwing", "Emerald swallowtail", "#35d68a", "#0f4a2c", "day", "oz"],
  ["sakurawing", "Sakura skipper", "#f7a8c6", "#5a2438", "day", "sakura"], ["sandwing", "Dune cicada", "#ffd97a", "#6a4a24", "day", "dunes"], ["bogwing", "Mire damselfly", "#7fe8b0", "#1c4a38", "any", "mire"], ["coralwing", "Coral glider", "#ff8a8a", "#5a242c", "day", "coral"], ["echowing", "Echo moth", "#b58cff", "#2a1c4a", "night", "cavern"], ["starwing", "Starfall sprite", "#9fe0ff", "#1c345a", "night", "glacier"],
];
const BOUNTY = [["forage", "Forage {n} things", [8, 12, 16], 6], ["critter", "Catch {n} critters", [2, 3, 5], 18], ["fish", "Catch {n} fish", [2, 3, 5], 16], ["cook", "Cook {n} meals", [1, 2, 3], 24], ["gift", "Give {n} gifts to residents", [1, 2, 3], 26], ["sell", "Sell {n} things", [4, 6, 10], 5], ["chest", "Open a treasure chest", [1, 1, 1], 60]];
const ACH = [
  ["forage50", "Pocketful", "Forage 50 things", (x) => x.t.forage >= 50], ["forage300", "Hedge Fund", "Forage 300 things", (x) => x.t.forage >= 300], ["allitems", "Naturalist", `Find all ${FORAGE.length} kinds of forage`, (x) => Object.keys(x.seen).length >= FORAGE.length],
  ["crit1", "Gentle Hands", "Catch a critter", (x) => x.t.critter >= 1], ["crit50", "Net Worth", "Catch 50 critters", (x) => x.t.critter >= 50], ["allcrit", "Lepidopterist", "Catch all 14 critters", (x) => Object.keys(x.dex).length >= CRITTERS.length],
  ["chest1", "X Marks It", "Open a chest", (x) => Object.keys(x.chests).length >= 1], ["chest10", "Treasure Hunter", "Open 10 chests", (x) => Object.keys(x.chests).length >= 10], ["chestall", "Nothing Left Buried", "Open all 56 chests", (x) => Object.keys(x.chests).length >= 56],
  ["cook1", "Steeped Too Long", "Cook a meal", (x) => x.t.cook >= 1], ["cook30", "Regular at the Stove", "Cook 30 meals", (x) => x.t.cook >= 30], ["allmeals", "Full Menu", `Cook all ${MEALS.length} recipes`, (x) => Object.keys(x.cooked).length >= MEALS.length],
  ["gift1", "Thoughtful", "Give a gift", (x) => x.t.gift >= 1], ["friend1", "Best Friend", "Reach 5 hearts with a resident", (x) => Object.values(x.hearts).some((n) => n >= 5)], ["friend5", "Popular", "Reach 5 hearts with 5 residents", (x) => Object.values(x.hearts).filter((n) => n >= 5).length >= 5], ["friendall", "Everybody's Fox", `Reach 5 hearts with all ${NPCS.length}`, (x) => Object.values(x.hearts).filter((n) => n >= 5).length >= NPCS.length],
  ["bounty5", "On the Board", "Finish 5 bounties", (x) => x.t.bounty >= 5], ["bounty30", "Local Legend", "Finish 30 bounties", (x) => x.t.bounty >= 30], ["sell100", "Market Stall", "Sell 100 things", (x) => x.t.sell >= 100], ["steps", "Long Way Round", "Walk 20,000 steps", (x) => x.t.steps >= 20000],
];
const rng = (seed) => () => { seed = (seed + 0x6D2B79F5) | 0; let x = Math.imul(seed ^ (seed >>> 15), 1 | seed); x ^= x + Math.imul(x ^ (x >>> 7), 61 | x); return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
const hash = (s) => { let h = 7; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };
const inRegion = (spec, r) => spec === "any" || spec.split(" ").includes(r);

export function createExtras(api) {
  const { s, map, people, panel, say, closeTalk, hud, save, ping, toast, burst, calm, isNight } = api;
  const x = (s.x2 = { bag: {}, day: "", taken: {}, chests: {}, dex: {}, seen: {}, cooked: {}, hearts: {}, gifted: {}, c: {}, done: {}, t: {}, ach: {}, buff: 0, ...(s.x2 || {}) });
  for (const k of ["forage", "critter", "cook", "gift", "sell", "bounty", "steps"]) x.t[k] ||= 0;
  const roll = () => { if (x.day === today()) return; x.day = today(); x.taken = {}; x.gifted = {}; x.c = {}; x.done = {}; };
  roll();
  const bump = (k, n = 1) => { x.c[k] = (x.c[k] || 0) + n; if (k in x.t) x.t[k] += n; };
  const open = []; for (let i = 0; i < W * H; i++) if (map.reach[i] && !map.solid[i] && ![TILE.path, TILE.brick, TILE.plaza, TILE.market, TILE.bridge, TILE.rail].includes(map.g[i])) open.push(i);
  const scatter = (r, n, gap, src = open) => { if (!src.length) return []; const out = []; let guard = 0; while (out.length < n && guard++ < 9000) { const i = src[Math.floor(r() * src.length)], a = i % W, b = Math.floor(i / W); if (!out.some((o) => Math.abs(o.x - a) + Math.abs(o.y - b) < gap)) out.push({ id: i, x: a, y: b }); } return out; };
  const homeOpen = open.filter((i) => i % W < 120 && i < 90 * W), farOpen = open.filter((i) => !(i % W < 120 && i < 90 * W));
  const home = scatter(rng(424242), 24, 11, homeOpen).map((c, i) => ({ ...c, id: c.y * 120 + c.x, pay: 25 + (i * 17) % 90, loot: HOME_ITEMS[(i * 7) % HOME_ITEMS.length][0] }));
  const far = scatter(rng(515151), 32, 13, farOpen).map((c, i) => ({ ...c, id: 2e6 + c.id, pay: 70 + (i * 23) % 130, loot: FAR_ITEMS[(i * 5) % FAR_ITEMS.length][0] }));
  const chests = [...home, ...far];
  let nodes = [];
  const seed = () => { const r = rng(hash(x.day)); nodes = scatter(r, 300, 3).map((o) => { const reg = regionAt(o.x, o.y), pool = ITEMS.filter((q) => inRegion(q[3], reg)).sort((a, b) => a[4] - b[4]), k = Math.floor(r() * r() * pool.length); return { ...o, it: pool[k] }; }); };
  seed();
  let bugs = [], spawnT = 0, bugId = 0, stepAcc = 0;
  const bounties = () => { const r = rng(hash("b" + x.day)), pool = [...BOUNTY].sort(() => r() - .5).slice(0, 3); return pool.map(([k, label, ns, per]) => { const n = ns[Math.floor(r() * 3)]; return { k, n, label: label.replace("{n}", n), pay: n * per, have: Math.min(n, x.c[k] || 0), done: !!x.done[k] }; }); };
  const checkAch = () => { for (const [id, name, , test] of ACH) if (!x.ach[id] && test(x)) { x.ach[id] = today(); s.mon += 50; hud(); ping("done"); toast(`Achievement: ${name} (+50 mon)`); } };
  const addItem = (id, n = 1) => { x.bag[id] = (x.bag[id] || 0) + n; if (FORAGE.some((q) => q[0] === id)) x.seen[id] = 1; };
  const onWorld = (e) => { if (e.detail?.k === "fish") { roll(); bump("fish"); save(); } }; document.addEventListener("kitsune:world", onWorld);

  function bag(tab = "bag") {
    roll(); const count = Object.values(x.bag).reduce((a, n) => a + n, 0), ready = bounties().filter((b) => !b.done && b.have >= b.n).length;
    const tabs = [["bag", `Bag ${count}`], ["cook", "Cook"], ["critters", `Critters ${Object.keys(x.dex).length}/${CRITTERS.length}`], ["friends", "Friends"], ["bounties", ready ? `Bounties (${ready})` : "Bounties"], ["ach", `Achievements ${Object.keys(x.ach).length}/${ACH.length}`]];
    const dot = (c) => `<i class="wx-dot" style="background:${c}"></i>`, list = Object.entries(x.bag).filter(([, n]) => n > 0).map(([id, n]) => [item(id), n]).filter(([q]) => q);
    const value = (q) => (MEALS.includes(q) ? q[5] : q[4]);
    const body = tab === "cook" ? `<div class="wx-grid">${MEALS.map((m) => { const can = Object.entries(m[3]).every(([k, n]) => (x.bag[k] || 0) >= n); return `<article class="${x.cooked[m[0]] ? "known" : ""}">${dot(m[2])}<strong>${x.cooked[m[0]] ? esc(m[1]) : esc(m[1])}</strong><small>${Object.entries(m[3]).map(([k, n]) => `${esc(item(k)[1])} ${x.bag[k] || 0}/${n}`).join(" · ")}</small><small class="muted">Eat for ${m[4]}s of speed, sells for ${m[5]} mon</small><button class="btn btn-sm${can ? " btn-accent" : ""}" type="button" data-cook="${m[0]}" ${can ? "" : "disabled"}>Cook</button></article>`; }).join("")}</div>`
      : tab === "critters" ? `<div class="wx-grid">${CRITTERS.map((c) => x.dex[c[0]] ? `<article class="known">${dot(c[2])}<strong>${esc(c[1])}</strong><small>Caught ${x.dex[c[0]]} · ${c[4] === "any" ? "Any time" : c[4] === "day" ? "Daytime" : "At night"}</small></article>` : `<article>${dot("#555")}<strong>???</strong><small>${c[4] === "any" ? "Any time" : c[4] === "day" ? "Daytime" : "At night"} · ${esc(c[5] === "any" ? "anywhere" : c[5].split(" ").map((r) => api.regionName(r)).join(", "))}</small></article>`).join("")}</div>`
      : tab === "friends" ? `<p class="muted">Talk to a resident and offer a gift, once per resident per day. Five hearts earns a thank-you of 100 mon.</p><div class="wx-grid">${people.map((p) => { const n = x.hearts[p.id] || 0; return `<article class="${n >= 5 ? "known" : ""}"><strong>${esc(p.n[2])}</strong><small class="wx-h">${"♥".repeat(n)}${"♡".repeat(5 - n)}</small><small class="muted">${s.met[p.id] ? `Loves ${esc(favName(p.id))}` : "Not met yet"}</small></article>`; }).join("")}</div>`
      : tab === "bounties" ? `<p class="muted">New bounties every day.</p><ul class="wd-list wx-b">${bounties().map((b) => `<li class="${b.done ? "ok" : ""}"><strong>${esc(b.label)}</strong><span>${b.have}/${b.n}</span><button class="btn btn-sm${!b.done && b.have >= b.n ? " btn-accent" : ""}" type="button" data-bounty="${b.k}" ${b.done || b.have < b.n ? "disabled" : ""}>${b.done ? "Paid" : `Claim ${b.pay} mon`}</button></li>`).join("")}</ul>`
      : tab === "ach" ? `<div class="wx-grid">${ACH.map(([id, name, how]) => `<article class="${x.ach[id] ? "known" : ""}"><strong>${esc(name)}</strong><small>${esc(how)}</small><small class="muted">${x.ach[id] ? `Earned ${esc(x.ach[id])}` : "+50 mon"}</small></article>`).join("")}</div>`
      : list.length ? `<div class="wx-grid">${list.map(([q, n]) => { const meal = MEALS.includes(q); return `<article>${dot(q[2])}<strong>${esc(q[1])} × ${n}</strong><small class="muted">Worth ${value(q)} mon</small><div class="wx-row">${meal ? `<button class="btn btn-sm btn-accent" type="button" data-eat="${q[0]}">Eat</button>` : ""}<button class="btn btn-sm" type="button" data-sell="${q[0]}">Sell</button></div></article>`; }).join("")}</div>` : `<p class="muted">Your bag is empty. Walk around: berries, shells, ore and all sorts of things are lying about, and they grow back every day.</p>`;
    panel("Your bag", `<div class="chips">${tabs.map(([k, l]) => `<button class="chip${k === tab ? " on" : ""}" type="button" data-t="${k}">${l}</button>`).join("")}</div>${x.buff > Date.now() ? `<p class="hint">Well fed: ${Math.ceil((x.buff - Date.now()) / 1000)}s of extra speed left.</p>` : ""}${body}`, (p) => {
      p.querySelectorAll("[data-t]").forEach((b) => (b.onclick = () => bag(b.dataset.t)));
      p.querySelectorAll("[data-sell]").forEach((b) => (b.onclick = () => { const q = item(b.dataset.sell); if (!(x.bag[q[0]] > 0)) return; x.bag[q[0]]--; s.mon += value(q); bump("sell"); after(); bag("bag"); }));
      p.querySelectorAll("[data-eat]").forEach((b) => (b.onclick = () => { const q = item(b.dataset.eat); if (!(x.bag[q[0]] > 0)) return; x.bag[q[0]]--; x.buff = Math.max(x.buff, Date.now()) + q[4] * 1000; ping("done"); after(); bag("bag"); }));
      p.querySelectorAll("[data-cook]").forEach((b) => (b.onclick = () => { const m = MEALS.find((q) => q[0] === b.dataset.cook); if (!Object.entries(m[3]).every(([k, n]) => (x.bag[k] || 0) >= n)) return; for (const [k, n] of Object.entries(m[3])) x.bag[k] -= n; addItem(m[0]); x.cooked[m[0]] = 1; bump("cook"); ping("done"); toast(`Cooked ${m[1]}`); after(); bag("cook"); }));
      p.querySelectorAll("[data-bounty]").forEach((b) => (b.onclick = () => { const q = bounties().find((o) => o.k === b.dataset.bounty); if (!q || q.done || q.have < q.n) return; x.done[q.k] = 1; s.mon += q.pay; x.t.bounty++; ping("done"); after(); bag("bounties"); }));
    });
  }
  const after = () => { checkAch(); save(); hud(); };
  const favOf = (id) => HOME_ITEMS[hash(id) % HOME_ITEMS.length], favName = (id) => favOf(id)[1];
  function gift(p, back) {
    const list = Object.entries(x.bag).filter(([, n]) => n > 0).map(([id]) => item(id)).filter(Boolean);
    if (!list.length) return say(p, "That's kind, but your paws are empty. Bring me something you found.", back ? [["Back", back]] : []);
    say(p, "For me? What have you got?", list.map((q) => [q[1], () => { x.bag[q[0]]--; x.gifted[p.id] = 1; const love = q[0] === favOf(p.id)[0] || MEALS.includes(q), before = x.hearts[p.id] || 0, now = Math.min(5, before + (love ? 2 : 1)); x.hearts[p.id] = now; bump("gift"); if (before < 5 && now >= 5) s.mon += 100; after(); ping("done"); burst(p, 14); say(p, `${love ? "Oh, this is my favourite!" : "Thank you. I'll find a place for it."} (${"♥".repeat(now)}${"♡".repeat(5 - now)}${before < 5 && now >= 5 ? ", and 100 mon as thanks" : ""})`); }, "gift"]));
  }
  const talkBtns = (p) => (x.gifted[p.id] || !Object.values(x.bag).some((n) => n > 0) ? [] : [["Give a gift", () => gift(p), "gift"]]);
  function target() {
    let best = null, d = 44; for (const b of bugs) { const q = Math.hypot(b.x - s.x, b.y - 8 - s.y); if (q < d) { d = q; best = b; } }
    if (best) return { label: `Catch the ${best.c[1]}`, go: () => { x.dex[best.c[0]] = (x.dex[best.c[0]] || 0) + 1; bump("critter"); s.mon += 3; bugs = bugs.filter((o) => o !== best); burst({ x: best.x, y: best.y + 20 }, 10); ping("done"); toast(`Caught: ${best.c[1]} (+3 mon)`); after(); } };
    for (const c of chests) if (!x.chests[c.id] && Math.hypot((c.x + .5) * T - s.x, (c.y + .5) * T - s.y) < 44) return { label: "Open the chest", go: () => { x.chests[c.id] = 1; s.mon += c.pay; addItem(c.loot, 2); bump("chest"); burst({ x: (c.x + .5) * T, y: (c.y + .5) * T + 20 }, 26); ping("done"); after(); say(null, `Inside: ${c.pay} mon and 2 × ${item(c.loot)[1]}. (${Object.keys(x.chests).length} of ${chests.length} chests found)`); } };
    return null;
  }
  function update(dt, now, moving) {
    if (x.day !== today()) { roll(); seed(); }
    if (moving) { stepAcc += dt * 3; if (stepAcc >= 1) { x.t.steps += Math.floor(stepAcc); stepAcc %= 1; } }
    let got = 0; for (const o of nodes) if (!x.taken[o.id] && Math.abs((o.x + .5) * T - s.x) < 24 && Math.abs((o.y + .5) * T - s.y) < 26) { x.taken[o.id] = 1; addItem(o.it[0]); bump("forage"); got++; toast(`+1 ${o.it[1]}`); } if (got) { ping("blip"); after(); }
    if (now > spawnT) { spawnT = now + 1400; if (bugs.length < 7) { const r = regionAt(Math.floor(s.x / T), Math.floor(s.y / T)), night = isNight(), pool = CRITTERS.filter((c) => inRegion(c[5], r) && (c[4] === "any" || (c[4] === "night") === night)); if (pool.length) { const a = Math.random() * 6.28, q = 150 + Math.random() * 170; bugs.push({ id: ++bugId, c: pool[Math.floor(Math.random() * pool.length)], x: s.x + Math.cos(a) * q, y: s.y + Math.sin(a) * q, p: Math.random() * 6, life: now + 26000 }); } } }
    for (const b of bugs) { if (calm()) continue; b.x += Math.sin(now / 620 + b.p) * 34 * dt; b.y += Math.cos(now / 410 + b.p * 2) * 26 * dt; }
    bugs = bugs.filter((b) => now < b.life && Math.hypot(b.x - s.x, b.y - s.y) < 620);
  }
  function draw(g, things, camX, camY, vw, vh, now) {
    const see = (a, b, m = 30) => a > camX - m && a < camX + vw + m && b > camY - m && b < camY + vh + m;
    for (const o of nodes) { if (x.taken[o.id]) continue; const px = (o.x + .5) * T, py = (o.y + .5) * T; if (see(px, py)) things.push([py + 6, () => { g.fillStyle = "rgba(0,0,0,.22)"; g.beginPath(); g.ellipse(px, py + 9, 8, 3, 0, 0, 7); g.fill(); g.fillStyle = o.it[2]; g.strokeStyle = "#1b1d33"; g.lineWidth = 1.5; g.beginPath(); g.moveTo(px, py - 7); g.lineTo(px + 7, py + 1); g.lineTo(px, py + 8); g.lineTo(px - 7, py + 1); g.closePath(); g.fill(); g.stroke(); g.fillStyle = "rgba(255,255,255,.65)"; g.fillRect(px - 2, py - 3, 3, 3); }]); }
    for (const c of chests) { if (x.chests[c.id]) continue; const px = (c.x + .5) * T, py = (c.y + .5) * T; if (see(px, py)) things.push([py + 12, () => { g.fillStyle = "rgba(0,0,0,.25)"; g.fillRect(px - 15, py + 10, 30, 4); g.fillStyle = "#8a5a2a"; g.strokeStyle = "#2a1a10"; g.lineWidth = 2; g.fillRect(px - 14, py - 4, 28, 15); g.strokeRect(px - 14, py - 4, 28, 15); g.fillStyle = "#a5703a"; g.beginPath(); g.moveTo(px - 14, py - 4); g.quadraticCurveTo(px, py - 17, px + 14, py - 4); g.fill(); g.stroke(); g.fillStyle = "#ffd27a"; g.fillRect(px - 3, py - 6, 6, 8); }]); }
    for (const b of bugs) if (see(b.x, b.y)) things.push([b.y + 20, () => { const f = calm() ? .7 : Math.abs(Math.sin(now / 70 + b.p)); g.fillStyle = b.c[2]; for (const q of [-1, 1]) { g.beginPath(); g.ellipse(b.x + q * 6 * f, b.y - 2, 6 * f + 1, 7, q * .4, 0, 7); g.fill(); } g.fillStyle = b.c[3]; g.fillRect(b.x - 1.5, b.y - 6, 3, 11); if (["firefly", "cinder"].includes(b.c[0])) { g.fillStyle = "rgba(255,240,130,.28)"; g.beginPath(); g.arc(b.x, b.y, 13, 0, 7); g.fill(); } }]);
  }
  const speed = () => (x.buff > Date.now() ? 1.3 : 1);
  return { itemName: (id) => item(id)?.[1] || id, bag, target, update, draw, talkBtns, speed, destroy: () => document.removeEventListener("kitsune:world", onWorld), state: x, chests, nodes: () => nodes, bugs: () => bugs };
}
