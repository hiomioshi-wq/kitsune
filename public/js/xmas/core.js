// Winterfest core: Snowbells, quests, pets, the well, the shop. Saved in kv "xmas". Nothing here costs real money.
import { kvGet, kvSet, settings, saveSettings } from "../store.js";
import { ls, toast, today } from "../util.js";
import { SPECIES, species, RARITY, TREATS, CATALOG, item, ORNAMENTS, DAILY, GOALS, ADVENT, WISH_COST, PITY, WELL_ONLY } from "./data.js";
import { mythicMultiplier } from "./mythic.js";

export const isSeason = (d = new Date()) => { const m = d.getMonth(), x = d.getDate(); return m === 11 || (m === 10 && x >= 15) || (m === 0 && x <= 6); };
export const daysToXmas = (d = new Date()) => { const y = d.getMonth() === 0 ? d.getFullYear() - 1 : d.getFullYear(), t = new Date(y, 11, 25), a = new Date(d.getFullYear(), d.getMonth(), d.getDate()); return Math.round((t - a) / 864e5); };
const blank = () => ({ v: 1, bells: 0, earned: 0, day: "", c: {}, claimed: {}, tot: {}, goals: {}, lastGift: "", streak: 0, advent: 0, adventDay: "", owned: [], treats: { cookie: 3 }, eggs: [], pets: {}, active: "", wishes: 0, pity: 0, jar: [], tree: {}, orn: { red: 2, gold: 1 }, drops: 0, readCap: 0, doneCap: 0, plays: 0, frac: 0, starter: false, hideStrip: "", opts: { on: true, snow: true, lights: true, pet: true, drops: true, strips: true, readers: false } });
let S = null, loading = null; const subs = new Set();
export const onXmas = (f) => (subs.add(f), () => subs.delete(f));
const emit = () => subs.forEach((f) => { try { f(S); } catch {} });
export const xs = () => S;
export function save() { if (!S) return; kvSet("xmas", S); ls.set("xmasOwned", S.owned); emit(); }
const hash = (s) => { let h = 2166136261; for (const c of String(s)) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };

export function loadXmas() {
  if (S) return Promise.resolve(S);
  return (loading ||= (async () => { const v = await kvGet("xmas", null), b = blank(); S = { ...b, ...(v || {}), opts: { ...b.opts, ...(v?.opts || {}) } }; roll(); ls.set("xmasOwned", S.owned); return S; })());
}
function roll() { if (S.day === today()) return decay(); S.day = today(); S.c = {}; S.claimed = {}; S.drops = 0; S.readCap = 0; S.doneCap = 0; S.plays = 0; decay(); kvSet("xmas", S); }
function decay() { const now = Date.now(); for (const p of Object.values(S.pets)) { const hrs = Math.max(0, (now - (p.at || now)) / 36e5); if (hrs < .05) continue; p.hunger = Math.max(10, p.hunger - hrs * 2.2); p.joy = Math.max(10, p.joy - hrs * 1.6); p.at = now; } }

export const activePet = () => (S?.active && S.pets[S.active]) || null;
export const petLevel = (p) => { let l = 1, x = p.xp || 0; while (l < 20 && x >= l * 22) { x -= l * 22; l++; } return { level: l, into: x, need: l * 22 }; };
export const petStage = (l) => (l >= 12 ? 3 : l >= 5 ? 2 : 1);
export const petBonus = () => { const p = activePet(); if (!p) return 0; const sp = species(p.sp), mood = (p.hunger + p.joy) / 200; return Math.round((RARITY[sp[2]][2] + petLevel(p).level / 2) * (mood > .35 ? 1 : .5)); };

export function earn(n, { bonus = true } = {}) { if (!S || !isSeason() || settings.incognito) return 0; const x = bonus ? n * (1 + petBonus() / 100) + (S.frac || 0) : n; const w = Math.floor(x); S.frac = bonus ? x - w : S.frac; S.bells += w; S.earned += w; if (w > 0) { S.c.bellrun = (S.c.bellrun || 0) + w; S.tot.bellrun = (S.tot.bellrun || 0) + w; } save(); return w; }
export function grant(n) { S.bells += n; S.earned += n; }
export function bump(k, n = 1) { if (!S || !isSeason() || settings.incognito) return; S.c[k] = (S.c[k] || 0) + n; S.tot[k] = (S.tot[k] || 0) + n; save(); }
export const todaysQuests = () => { const r = hash(S.day), pool = DAILY.slice(2).map((q, i) => [hash(S.day + q[0]) + i, q]).sort((a, b) => a[0] - b[0]).map((x) => x[1]); return [DAILY[r % 2], ...pool.slice(0, 4)].map(([k, label, need, reward]) => ({ k, label, need, reward, have: Math.min(need, Math.floor(S.c[k] || 0)), claimed: !!S.claimed[k] })); };
export function claimQuest(k) { const q = todaysQuests().find((x) => x.k === k); if (!q || q.claimed || q.have < q.need) return false; S.claimed[k] = 1; grant(q.reward); S.tot.quests = (S.tot.quests || 0) + 1; save(); document.dispatchEvent(new Event("kitsune:done")); return true; }
const GOAL_MAP = { wells100: "well", wells150: "well", crafts75: "crafted", snowball100: "snowball", toys50: "toy", toys75: "toy", fish50: "fish", snowman24: "snowman", quests60: "quests", fbkill200: "fbkill", arcade200: "arcade" };
const goalHave = (k) => {
  if (k === "hatched" || k === "hatchedAll") return Object.keys(S.pets).length;
  if (k === "petlv") return Math.max(0, ...Object.values(S.pets).map((p) => petLevel(p).level));
  if (k === "allpets18") return Object.values(S.pets).filter((p) => petLevel(p).level >= 5).length;
  if (k === "tree") return Object.keys(S.tree).length;
  if (k === "advent" || k === "adventAll") return S.advent;
  if (k === "pass80" || k === "pass100" || k === "pass120" || k === "pass140") return Math.min(140, Math.floor((S.earned || 0) / 150));
  return Math.floor(S.tot[GOAL_MAP[k] || k] || 0);
};
export const goalList = () => GOALS.map(([k, label, need, reward]) => ({ k, label, need, reward, have: Math.min(need, goalHave(k)), claimed: !!S.goals[k] }));
export function claimGoal(k) { const g = goalList().find((x) => x.k === k); if (!g || g.claimed || g.have < g.need) return false; S.goals[k] = 1; grant(g.reward); save(); document.dispatchEvent(new Event("kitsune:done")); return true; }

export const giftReady = () => S.lastGift !== today();
export function dailyGift() { if (!giftReady()) return 0; const y = new Date(); y.setDate(y.getDate() - 1); const ys = today(y); S.streak = S.lastGift === ys ? S.streak + 1 : 1; S.lastGift = today(); const n = 20 + Math.min(7, S.streak) * 5; grant(n); S.treats.cookie = (S.treats.cookie || 0) + 1; save(); return n; }

const eggFor = (rar) => { const list = SPECIES.filter((x) => x[2] === rar && x[0] !== "blackdragon"), mine = new Set([...Object.keys(S.pets), ...S.eggs.map((e) => e.sp)]), fresh = list.filter((x) => !mine.has(x[0])), l = rar === "l" ? list : (fresh.length ? fresh : list); return l[Math.floor(Math.random() * l.length)][0]; };
export function addEgg(rar) { const sp = eggFor(rar), id = "e" + Date.now().toString(36) + Math.floor(Math.random() * 1e4); S.eggs.push({ id, sp, rar, have: 0, need: { c: 20, r: 35, e: 60, l: 90 }[rar] }); return id; }
export function warmEgg(n) { for (const e of S.eggs) e.have = Math.min(e.need, e.have + n); }
export function hatch(id) { const i = S.eggs.findIndex((e) => e.id === id); if (i < 0 || S.eggs[i].have < S.eggs[i].need) return null; const e = S.eggs[i]; S.eggs.splice(i, 1); if (S.pets[e.sp]) { const r = { c: 60, r: 140, e: 320, l: 700 }[e.rar]; grant(r); S.pets[e.sp].xp += 40; save(); return { dupe: true, sp: e.sp, refund: r }; } S.pets[e.sp] = { sp: e.sp, name: species(e.sp)[1], xp: 0, hunger: 80, joy: 80, at: Date.now(), born: today() }; if (!S.active) S.active = e.sp; save(); return { sp: e.sp }; }
export function feed(id, t) { const p = S.pets[id], d = TREATS[t]; if (!p || !(S.treats[t] > 0)) return false; S.treats[t]--; p.hunger = Math.min(100, p.hunger + d[2]); p.joy = Math.min(100, p.joy + 4); p.xp += Math.round(d[3] * mythicMultiplier("xp_mult")); p.at = Date.now(); bump("feed"); save(); return true; }
export function pat(id) { const p = S.pets[id]; if (!p) return false; const now = Date.now(); if (now - (p.patAt || 0) < 1500) return false; p.patAt = now; p.joy = Math.min(100, p.joy + 3); p.xp += Math.max(1, Math.round(mythicMultiplier("xp_mult"))); bump("pat"); save(); return true; }

export const owns = (id) => S.owned.includes(id);
export const worldLive = { fn: null };
function grantWorld(kind, id) { if (worldLive.fn) return worldLive.fn(kind, id); kvGet("world", null).then((w) => { const x = w || {}; if (kind === "worldhat") { x.hats = [...new Set([...(x.hats || []), id])]; } else { x.furn = { ...(x.furn || {}), [id]: (x.furn?.[id] || 0) + 1 }; } kvSet("world", x); }); }
function giveItem(id) { const it = item(id); if (!it || (it[1] !== "worldfurn" && owns(id))) return false; if (!owns(id)) S.owned.push(id); if (it[1] === "worldhat" || it[1] === "worldfurn") grantWorld(it[1], id); return true; }
export function buy(id) { const it = item(id); if (!it || it[5] === "well" || S.bells < it[3]) return false; if (it[1] === "egg") { S.bells -= it[3]; addEgg(it[4]); } else { if (it[1] !== "worldfurn" && owns(id)) return false; S.bells -= it[3]; giveItem(id); } save(); document.dispatchEvent(new Event("kitsune:choice")); return true; }
export const buyTreat = (t) => { const d = TREATS[t]; if (!d || S.bells < d[1]) return false; S.bells -= d[1]; S.treats[t] = (S.treats[t] || 0) + 1; save(); return true; };
export const buyOrn = (o) => { const d = ORNAMENTS.find((x) => x[0] === o); if (!d || S.bells < d[3]) return false; S.bells -= d[3]; S.orn[o] = (S.orn[o] || 0) + 1; save(); return true; };
export function equip(id) {
  const it = item(id); if (!it || !owns(id)) return false;
  if (it[1] === "theme") { import("../themes.js").then((T) => { const all = T.getCustomThemes(); all["xmas-" + id] = it[4]; T.saveCustomThemes(all); settings.theme = "custom:xmas-" + id; saveSettings(); }); }
  if (it[1] === "cursor") { settings.cursor = id; settings.cursorAuto = "off"; saveSettings(); }
  if (it[1] === "wallpaper") { settings.wallpaper = id; saveSettings(); }
  if (it[1] === "sound") { settings.uiSound = id; saveSettings(); }
  return true;
}
export const equipped = (id) => { const it = item(id); if (!it) return false; return it[1] === "theme" ? settings.theme === "custom:xmas-" + id : it[1] === "cursor" ? settings.cursor === id : it[1] === "wallpaper" ? settings.wallpaper === id : it[1] === "sound" ? settings.uiSound === id : false; };

export function award(r) { const out = []; if (r.b) { grant(r.b); out.push(`${r.b} Snowbells`); } for (const [t, n] of Object.entries(r.treat || {})) { S.treats[t] = (S.treats[t] || 0) + n; out.push(`${n} × ${TREATS[t][0]}`); } if (r.orn) { S.orn[r.orn] = (S.orn[r.orn] || 0) + 1; out.push(ORNAMENTS.find((o) => o[0] === r.orn)[1]); } if (r.egg) { addEgg(r.egg); out.push(`${RARITY[r.egg][0]} egg`); } if (r.item) { if (giveItem(r.item)) out.push(item(r.item)[2]); else { grant(150); out.push("150 Snowbells (you already own the prize)"); } } save(); return out.join(" + "); }
export const adventReady = () => isSeason() && S.advent < 25 && S.adventDay !== today();
export function openDoor() { if (!adventReady()) return null; const r = ADVENT[S.advent]; S.advent++; S.adventDay = today(); return award(r); }

function rollWish() {
  S.pity++; let x = Math.random() * 100; if (S.pity >= PITY) x = 99.5;
  if (x >= 99) { S.pity = 0; const un = WELL_ONLY.filter((i) => !owns(i)); const egg = Math.random() < .55 || !un.length; return { tier: "Legendary", text: award(egg ? { egg: "l" } : { item: un[Math.floor(Math.random() * un.length)] }) }; }
  if (x >= 95) return { tier: "Epic", text: award(Math.random() < .5 ? { egg: "e" } : { b: 120 + Math.floor(Math.random() * 100) }) };
  if (x >= 83) { const k = Math.random(); return { tier: "Rare", text: award(k < .4 ? { egg: "c" } : k < .6 ? { egg: "r" } : { orn: ORNAMENTS[Math.floor(Math.random() * ORNAMENTS.length)][0] }) }; }
  if (x >= 62) { const t = ["cookie", "cookie", "cocoa", "cane"][Math.floor(Math.random() * 4)]; return { tier: "Uncommon", text: award({ treat: { [t]: 1 + Math.floor(Math.random() * 2) } }) }; }
  return { tier: "Common", text: award({ b: 8 + Math.floor(Math.random() * 18) }) };
}
export function wish(n = 1, text = "") { const cost = n === 10 ? WISH_COST * 9 : WISH_COST * n; if (S.bells < cost) return null; S.bells -= cost; const out = []; for (let i = 0; i < n; i++) out.push(rollWish()); S.wishes += n; S.c.well = (S.c.well || 0) + n; S.tot.well = (S.tot.well || 0) + n; const t = String(text).trim().slice(0, 120); if (t) S.jar = [{ t, at: today() }, ...S.jar].slice(0, 40); save(); return out; }
export const hangOrn = (slot, o) => { if (o && Object.values(S.tree).filter((v) => v === o).length >= (S.orn[o] || 0) && S.tree[slot] !== o) return false; if (o) S.tree[slot] = o; else delete S.tree[slot]; if (o) bump("tree"); save(); return true; };

// Reading is the main way to earn. Everything is capped per day so it stays a treat.
export function startEarning() {
  let lastBell = 0;
  document.addEventListener("kitsune:stat", (e) => { if (!S) return; roll(); const { pages = 0, secs = 0, listen = 0 } = e.detail || {}, mins = (secs + listen) / 60; const p = activePet(); if (p && (pages || mins)) { p.xp += (pages * .5 + mins) * mythicMultiplier("xp_mult"); } warmEgg(pages + mins); if (pages) bump("pages", pages); if (mins) bump("mins", mins); if (!isSeason()) return save(); const value = Math.min(Math.max(0, 300 - S.readCap), pages * .5 + mins); S.readCap += value; if (value > 0) { const got = earn(value); if (got && Date.now() - lastBell > 45000 && S.c.pages >= 5) { lastBell = Date.now(); document.dispatchEvent(new CustomEvent("xmas:bell", { detail: got })); } } else save(); });
  document.addEventListener("kitsune:finished", () => { if (!S) return; bump("done"); earn(60); toast("Finished! +60 Snowbells"); });
  document.addEventListener("kitsune:world", (e) => { if (!S) return; const { k, n = 1 } = e.detail || {}; if (k === "fish") { bump("fish", n); earn(3); } if (k === "present") { bump("present", n); earn(25, { bonus: false }); } });
  document.addEventListener("kitsune:done", () => { if (!S || S.doneCap >= 5) return; S.doneCap++; earn(3); });
  const seen = { world: "world", vn: "vn", story: "story", shrine: "shrine", den: "den", library: "lib", web: "web", stats: "stats" };
  const visit = () => { if (!S) return; roll(); const k = seen[location.hash.slice(1).split("/")[0]]; if (k && !S.c[k]) bump(k); };
  addEventListener("hashchange", visit); visit();
}
