// A small walking engine for the book realms. Each realm has its own maps, cast, hazards, deaths and main quest.
import { drawFox } from "./art.js";
import { characterSvg } from "../vnchar.js";
import { esc } from "../util.js";
import { REALMS, TILES, drawProp, SOLID_PROPS } from "./realms.js";
import { BOSSES, startBoss } from "./boss.js";
import { createRpg } from "./rpg.js";
import { createBestie } from "./bestie.js";
import { createSong } from "./calypso.js";
import { createPowers } from "./powers.js";
import { speakAs, execVoiceCmds, askChatLine } from "./mindai.js";
import { settings } from "../store.js";
import { STAIR_MODS, STAIR_BOONS } from "./delve.js";

const T = 32, FALLBACK = { c: "#3a3744", a: "#d8d2c4", st: 3, sk: 1, h: "#26222c", e: "#222", f: "casual" };
const calm = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

function compile(sc) {
  const w = sc.w, h = sc.h, grid = new Array(w * h).fill(sc.base), solid = new Uint8Array(w * h);
  (sc.gen || (() => {}))((x, y, t) => { if (x >= 0 && y >= 0 && x < w && y < h) grid[y * w + x] = t; }, w, h);
  for (const [x, y, rw, rh, t] of sc.r || []) for (let j = y; j < y + rh; j++) for (let i = x; i < x + rw; i++) if (i >= 0 && j >= 0 && i < w && j < h) grid[j * w + i] = t;
  if (sc.room) for (let i = 0; i < w; i++) { grid[i] = "wall"; grid[(h - 1) * w + i] = "wall"; } if (sc.room) for (let j = 0; j < h; j++) { grid[j * w] = "wall"; grid[j * w + w - 1] = "wall"; }
  for (const d of sc.doors || []) if (d.x >= 0 && d.y >= 0 && d.x < w && d.y < h && sc.room) grid[d.y * w + d.x] = "door";
  for (let i = 0; i < w * h; i++) solid[i] = TILES[grid[i]]?.[1] ? 1 : 0;
  for (const b of sc.b || []) for (let y = b.y; y < b.y + b.h; y++) for (let x = b.x; x < b.x + b.w; x++) solid[y * w + x] = 1;
  for (const p of sc.props || []) if (SOLID_PROPS.has(p[0])) solid[p[2] * w + p[1]] = 1;
  return { ...sc, doors: [...(sc.doors || [])], grid, solid };
}

export function openRealm(host, id, ctx) {
  const baseReward = ctx.reward;
  ctx = { ...ctx, reward: (n) => baseReward?.(Math.round(n * (settings.world?.realmRewards || 1))) };
  const R = REALMS[id], st = ctx.state, scenes = {}; for (const [k, v] of Object.entries(R.scenes)) scenes[k] = compile({ ...v, id: k });
  // Every building gets a door out to the street, placed on the room's bottom wall.
  for (const sc of Object.values(scenes)) for (const b of sc.b || []) if (b.to && scenes[b.to]) { const dx = b.x + Math.floor(b.w / 2), dy = b.y + b.h, room = scenes[b.to], rx = Math.floor(room.w / 2); sc.doors.push({ x: dx, y: dy, to: b.to, tx: rx, ty: room.h - 2, label: `Enter ${b.name}`, need: b.need, lock: b.lock }); if (!room.doors.some((d) => d.to === sc.id && d.y === room.h - 1)) room.doors.push({ x: rx, y: room.h - 1, to: sc.id, tx: dx, ty: dy + 1, label: "Back outside" }); const i = (room.h - 1) * room.w + rx; room.grid[i] = "door"; room.solid[i] = 0; }
  for (const r of R.relics || []) { const sc = scenes[r.s]; sc.npcs = [...(sc.npcs || []), { id: "relic-" + r.id, relic: r, name: r.name, x: r.x, y: r.y, art: "relic", verb: "Pick up", story: r.story, lines: [r.text] }]; }
  st.found ||= {}; const relicTotal = (R.relics || []).length, hiddenNpc = (n) => n.relic && st.found[n.relic.id];
  st.step ||= 0; st.deaths ||= 0; st.scene = scenes[st.scene] ? st.scene : R.start[0]; if (st.x == null) { st.x = (R.start[1] + .5) * T; st.y = (R.start[2] + .5) * T; }
  const el = document.createElement("div"); el.className = `rm rm-${id}`; el.tabIndex = 0;
  el.innerHTML = `<canvas></canvas><div class="rm-hud"><strong class="rm-place"></strong><p class="rm-goal"></p><small class="rm-stat"></small></div><div class="rm-bars"></div><div class="rm-combat" aria-hidden="true"><button type="button" data-c="attack">Hit</button><button type="button" data-c="dash">Dodge</button><button type="button" data-c="skill">Skill</button><button type="button" data-c="drink">Drink</button><button type="button" data-c="sheet">Perks</button></div><div class="rm-btns"><button type="button" class="rm-log">Case file <kbd>J</kbd></button><button type="button" class="rm-leave">Leave <kbd>Esc</kbd></button></div><div class="rm-flash" hidden></div><button type="button" class="wd-prompt rm-prompt" hidden></button><div class="wd-pad rm-pad" aria-hidden="true"><i></i></div><button type="button" class="wd-act rm-act" aria-label="Interact">E</button><div class="wd-talk rm-talk" hidden role="dialog" aria-live="polite"></div><div class="wd-panel rm-panel" hidden role="dialog"></div>`;
  host.appendChild(el);
  const $ = (q) => el.querySelector(q), c = $("canvas"), g = c.getContext("2d"), talkEl = $(".rm-talk"), panelEl = $(".rm-panel"), promptEl = $(".rm-prompt"), flash = $(".rm-flash");
  const keys = new Set(), imgs = new Map(); let sc = scenes[st.scene], alive = true, raf = 0, last = performance.now(), cw = 0, ch = 0, zoom = 1, dir = "down", step = 0, moving = false, target = null, joy = null, drop = null, dropT = performance.now() + 5000, saveT = 0, healT = 0, invuln = 0, hounds = [], rpg = null, foeShots = [], bestie = null, song = null, powers = null, barsT = 0, lastCam = [0, 0];
  const busy = () => !talkEl.hidden || !panelEl.hidden, save = () => ctx.save();
  const size = () => { const r = el.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1); cw = r.width; ch = r.height; c.width = cw * d; c.height = ch * d; g.setTransform(d, 0, 0, d, 0, 0); zoom = cw < 700 ? 1 : cw > 1500 ? 1.75 : 1.4; }, ro = new ResizeObserver(size); ro.observe(el); size();
  const design = (n) => (n.cast && ctx.cast[`${R.series}:${n.cast}`]) || n.look || FALLBACK;
  const sprite = (n) => { if (imgs.has(n.id)) return imgs.get(n.id); const i = new Image(); try { i.src = "data:image/svg+xml," + encodeURIComponent(characterSvg(n.cast || n.name, design(n), n.mood || "calm").replace('width="100%" height="100%"', 'width="300" height="420"')); } catch {} imgs.set(n.id, i); return i; };
  const quest = () => R.quest[st.step] || null, hasStep = (k) => { const i = R.quest.findIndex((q) => q.id === k); return i < 0 || st.step > i; };
  const hud = () => { $(".rm-place").textContent = sc.name; const q = quest(); if (R.endless) { const left = hounds.filter((h) => !h.dead).length, m = STAIR_MODS[st.mod || 0]; $(".rm-place").textContent = `The Bottomless Stair · Depth ${(st.depth || 0) + 1}`; $(".rm-goal").textContent = `${m[0] ? `${m[0]}: ${m[1]}. ` : ""}${left ? `${left} left on this floor` : "The stairs are open. Descend."}`; $(".rm-stat").textContent = `Best depth ${st.best || 0} · ${R.deathWord}: ${st.deaths}`; return; } if (R.bountyId) { const left = hounds.filter((h) => !h.dead).length; $(".rm-goal").textContent = st.clear?.[sc.id] ? "Bounty collected. Leave whenever you like." : st.wave >= sc.waves.length ? `Bring it down: ${left} left` : `Wave ${st.wave + 1} of ${sc.waves.length + 1}: ${left} left`; $(".rm-stat").textContent = `${R.deathWord}: ${st.deaths}${st.beat ? ` · Hunted ${st.beat} times` : ""}`; return; } if (R.delve) { const left = hounds.filter((h) => !h.dead).length, hasBoss = sc.npcs?.some((n) => n.boss); $(".rm-goal").textContent = hasBoss ? (st.beat ? "You beat it. Fight it again, or head back up." : "Face what lives at the bottom.") : left ? `Clear this floor: ${left} left` : "The stairs are open. Descend."; $(".rm-stat").textContent = `${R.deathWord}: ${st.deaths} · Caches ${Object.keys(st.found).length}/${relicTotal}${st.beat ? " · Beaten" : ""}`; return; } $(".rm-goal").textContent = (st.aiTask ? `Order (${st.aiTask.who}): ${st.aiTask.text} · ` : "") + (bestie?.goal() || song?.goal() || (q ? q.goal : R.doneGoal)); $(".rm-stat").textContent = `${R.deathWord}: ${st.deaths} · Chapter ${Math.min(st.step + 1, R.quest.length)} of ${R.quest.length} · Relics ${Object.keys(st.found).length}/${relicTotal}`; };
  const spawnHounds = (list) => { foeShots = []; if (R.delve && st.clear?.[sc.id]) { hounds = []; return; } const mod = R.endless ? STAIR_MODS[st.mod || 0][0] : ""; let spawnList = list || sc.hounds || []; if (R.endless) { const n = Math.min(spawnList.length, 4 + Math.floor((st.depth || 0) / 2) + (mod === "Crowded" ? 3 : 0)); spawnList = spawnList.slice(0, n).map((q, i) => (i === 0 && (st.depth || 0) % 5 === 4 ? [q[0], q[1], q[2], 3] : q)); } hounds = spawnList.map(([x, y, ai, scale = 1]) => { const kind = R.delve ? ai : sc.monster || "hound", f = rpg.stats(R.delve ? ({ melee: "hound", shoot: "follower", charge: "clump" })[ai] : kind), power = R.endless ? (st.depth || 0) * .5 : sc.power || 0, pow = R.delve ? .8 * (1 + power * .24) * (mod === "Armoured" ? 1.4 : mod === "Brittle" ? .7 : 1) : 1, max = Math.round(f.max * pow * (scale > 1 ? scale : 1)); return { size: scale, hx: (x + .5) * T, hy: (y + .5) * T, x: (x + .5) * T, y: (y + .5) * T, kind, ai: R.delve ? ai : "", tier: f.tier + (R.delve ? 1 : 0), hp: max, max, hit: f.hit + (R.delve ? Math.floor(power / 3) : 0) + (scale > 1 ? 1 : 0) + (mod === "Frenzied" ? 1 : 0), speed: f.speed * (mod === "Swift" ? 1.22 : 1), kx: 0, ky: 0, stun: 0, bite: 0, fire: 0, cd: 0 }; }); };
  const go = (to, x, y) => { sc = scenes[to]; st.scene = to; st.x = (x + .5) * T; st.y = (y + .5) * T; drop = null; spawnHounds(); invuln = performance.now() + 900; hud(); save(); ctx.ping("open"); };
  const blockedTile = (x, y) => x < 0 || y < 0 || x >= sc.w || y >= sc.h || sc.solid[y * sc.w + x];
  const blocked = (x, y) => [[-9, 2], [9, 2], [-9, 13], [9, 13]].some(([a, b]) => blockedTile(Math.floor((x + a) / T), Math.floor((y + b) / T)));
  if (R.delve) { st.clear = {}; st.wave = 0; } if (R.endless) { st.depth = 0; st.mod = 0; st.scene = R.start[0]; st.x = (R.start[1] + .5) * T; st.y = (R.start[2] + .5) * T; sc = scenes[st.scene]; } rpg = createRpg(ctx.rpg, R.rpgKind || id, { px: () => st.x, py: () => st.y, dir: () => dir, ping: ctx.ping, toast: ctx.toast, reward: ctx.reward, blocked: (x, y) => blockedTile(Math.floor(x / T), Math.floor(y / T)), changed: () => { hud(); save(); } });
  if (blocked(st.x, st.y)) { sc = scenes[R.start[0]]; st.scene = R.start[0]; st.x = (R.start[1] + .5) * T; st.y = (R.start[2] + .5) * T; } spawnHounds();

  if (id === "blackwood") bestie = createBestie(st, { scene: () => sc, scenes, px: () => st.x, py: () => st.y, ping: ctx.ping, toast: ctx.toast, reward: ctx.reward, trophy: ctx.trophy, hud: () => hud(), say: (...a) => say(...a), closeTalk: () => closeTalk(), heal: (n) => { rpg.S.hp = Math.min(rpg.maxHp(), rpg.S.hp + n); }, flash: () => { flash.hidden = false; flash.className = "rm-flash rm-pink on"; setTimeout(() => { if (alive) { flash.hidden = true; flash.className = "rm-flash"; } }, 900); } });
  if (id === "incarnate") song = createSong(st, { scene: () => sc, scenes, px: () => st.x, py: () => st.y, ping: ctx.ping, toast: ctx.toast, reward: ctx.reward, hud: () => hud(), say: (...a) => say(...a), closeTalk: () => closeTalk(), heal: (n) => { rpg.S.hp = Math.min(rpg.maxHp(), rpg.S.hp + n); }, hurt: (n) => { if (rpg.hurt(n)) die(R.meterLine); }, flash: () => { flash.hidden = false; flash.className = "rm-flash rm-pink on"; setTimeout(() => { if (alive) { flash.hidden = true; flash.className = "rm-flash"; } }, 900); } });
  if (id === "blackwood" || id === "blackwood2") powers = createPowers(st, { scene: () => sc, px: () => st.x, py: () => st.y, setPos: (x, y) => { st.x = x; st.y = y; }, bestie, ping: ctx.ping, toast: ctx.toast, hud: () => hud(), say: (...a) => say(...a), closeTalk: () => closeTalk() });
  const closeTalk = () => { talkEl.hidden = true; talkEl.innerHTML = ""; el.focus({ preventScroll: true }); };
  function say(n, text, btns = []) {
    const list = [...btns, ...(btns.some((b) => b[2]) ? [] : [["Leave it", closeTalk]])]; talkEl.hidden = false; ctx.ping("blip");
    const face = n && (n.cast || n.look) && !R.delve ? `<div class="wd-face">${characterSvg(n.cast || n.name, design(n), n.mood || "calm")}</div>` : "";
    talkEl.innerHTML = `${face}<div class="wd-say">${n ? `<strong>${esc(n.name)}</strong>` : ""}<p>${esc(text)}</p><div class="wd-opts">${list.map(([l], i) => `<button class="btn${i === 0 && list.length > 1 ? " btn-accent" : ""}" type="button" data-o="${i}"><kbd>${i + 1}</kbd> ${esc(l)}</button>`).join("")}</div></div>`;
    talkEl.querySelectorAll("[data-o]").forEach((b) => (b.onclick = () => list[+b.dataset.o][1]())); talkEl.querySelector("[data-o]")?.focus({ preventScroll: true });
  }
  const readBtn = (sid) => { const t = sid && ctx.title(sid); return t ? [[`Read ${t}`, () => ctx.openStory(sid)]] : []; };
  function advance(n, q) {
    st.step++; ctx.reward(q.pay || 15); hud(); save(); ctx.ping("done");
    if (st.step >= R.quest.length) { ctx.reward(250); return say(n, R.ending, [["It's over", closeTalk, 1], ...readBtn(R.endStory)]); }
    if (q.after) return say(n, q.after, [["Go on", closeTalk, 1], ...readBtn(q.story)]); closeTalk();
  }
  const aiChatBtn = (e) => {
    if (settings.world?.aiDialogue === false || !e || e.relic) return [];
    const btns = [["Chat (AI Voice)", async () => {
      const line = await askChatLine(e.name, "What's going on here?");
      if (!line) return;
      ctx.toast(`${e.name} is thinking…`);
      speakAs({ id: e.id, name: e.name, realm: R.title, lines: e.lines, story: e.story }, line, `scene=${sc.name}, step=${st.step + 1}/${R.quest.length}, hp=${rpg.S.hp}/${rpg.maxHp()}`).then(({ text, cmds, provider }) => {
        const notes = execVoiceCmds(cmds, {
          add: (n) => (bestie || song)?.add(n),
          free: () => { bestie?.free?.(); song?.free?.(); },
          heal: (n) => { rpg.S.hp = Math.min(rpg.maxHp(), rpg.S.hp + n); },
          hurt: (n) => { if (rpg.hurt(n)) die(R.meterLine); },
          reward: (n) => ctx.reward(n),
          buff: (stat) => { if (stat === "atk") rpg.bonus.dmg++; else if (stat === "spd") rpg.bonus.spd += .08; else if (stat === "hp") { rpg.bonus.hp += 3; rpg.S.hp += 3; } else return false; return true; },
          power: (pid) => powers?.castById?.(pid) || false,
          goto: (sid) => { const dst = scenes[sid]; if (!dst) return false; go(sid, Math.floor(dst.w / 2), Math.floor(dst.h / 2)); return true; },
          task: (t) => { st.aiTask = { who: e.name, text: t }; hud(); save(); },
          follow: () => { rpg.bonus.dmg++; ctx.toast(`${e.name} lends you their strength! (+1 DMG)`); return true; },
        });
        hud();
        const tag = provider && provider !== "offline" ? ` [${provider}]` : "";
        const extra = notes.length ? ` (${notes.join(" · ")})` : "";
        say(e, `${text}${extra}${tag}`, [...aiChatBtn(e)]);
      });
    }]];
    if (st.aiTask) btns.push([`Complete Order (+25 mon)`, () => { st.aiTask = null; ctx.reward(25); ctx.ping("done"); hud(); save(); say(e, "Order completed. (+25 mon)", [["Nice", closeTalk, 1]]); }]);
    return btns;
  };
  function interact(e) {
    if (e.relic) { st.found[e.relic.id] = 1; ctx.reward(25); hud(); save(); ctx.ping("done"); return say(null, `You found ${e.relic.name}. ${e.relic.text}${Object.keys(st.found).length === relicTotal ? " That was the last relic here. (+200 mon)" : ""}`, [["Keep it", closeTalk, 1], ...readBtn(e.relic.story)]), void (Object.keys(st.found).length === relicTotal && ctx.reward(200)); }
    const q = quest();
    if (bestie && !(q && q.who === e.id) && bestie.interact(e)) return;
    if (song && !(q && q.who === e.id) && song.interact(e)) return;
    if (e.boss && !(q && q.who === e.id)) { const B = BOSSES[e.boss]; if (!hasStep(B.need)) return say(e, B.lock, aiChatBtn(e)); return say(e, `${B.intro}${st.beat?.[e.boss] ? ` (Beaten ${st.beat[e.boss]} times, best ${st.best[e.boss]}s)` : ""}`, [[B.fight, () => beginBoss(e.boss)], ...readBtn(B.story), ...aiChatBtn(e)]); }
    if (q && q.who === e.id) return say(e, q.say, [[q.btn || "Go on", () => advance(e, q)], ...readBtn(q.story), ...(powers ? powers.buttons(e) : []), ...aiChatBtn(e)]);
    e.i = e.i || 0; const lines = e.lines || ["…"], text = lines[e.i++ % lines.length]; say(e, text, [...readBtn(e.story), ...(powers ? powers.buttons(e) : []), ...aiChatBtn(e)]);
  }
  let boss = null;
  function endBoss(won, secs, bid) {
    boss = null; el.classList.remove("rm-fight"); keys.clear(); invuln = performance.now() + 1200; if (won === undefined) { el.focus({ preventScroll: true }); return; }
    const B = BOSSES[bid], n = sc.npcs.find((x) => x.boss === bid); st.beat ||= {}; st.best ||= {};
    if (!won) return say(n, B.lose, [["Try again", () => beginBoss(bid)], ["Back away", closeTalk, 1]]);
    const first = !st.beat[bid]; st.beat[bid] = (st.beat[bid] || 0) + 1; st.best[bid] = Math.min(st.best[bid] || 1e9, Math.round(secs)); if (first) ctx.trophy(B.hat, B.furn); else ctx.reward(40); hud(); save(); ctx.ping("done");
    say(n, `${B.win} (${Math.round(secs)}s, best ${st.best[bid]}s)${first ? ` You won the ${B.hatName} and the ${B.furnName}, plus 300 mon. Wear it from Foxfire Goods, and the trophy is in your house tray.` : " +40 mon."}`, [["Done", closeTalk, 1], ...readBtn(B.story)]);
  }
  function beginBoss(bid) { closeTalk(); keys.clear(); target = null; promptEl.hidden = true; el.classList.add("rm-fight"); boss = startBoss(bid, { ping: ctx.ping, end: (won, secs) => endBoss(won, secs, bid), fox: (a, x, y, d, s, m, t) => drawFox(a, x, y, d, s, ctx.fur, ctx.tails, ctx.hat, t, m) }); el.__realm.boss = boss; }
  function endRun() { const reached = st.depth || 0; if (reached > 0) ctx.onStair?.(reached, st); st.best = Math.max(st.best || 0, reached); st.depth = 0; st.mod = 0; st.clear = {}; rpg.bonus.dmg = rpg.bonus.spd = rpg.bonus.hp = 0; rpg.S.hp = Math.min(rpg.S.hp, rpg.maxHp()); return reached; }
  function descend(d) { const pool = [...STAIR_BOONS].sort(() => Math.random() - .5).slice(0, 3); const pick = (b) => { if (b[0] === "dmg") rpg.bonus.dmg++; if (b[0] === "fury") rpg.bonus.dmg += 2; if (b[0] === "hp") { rpg.bonus.hp += 3; rpg.S.hp += 3; } if (b[0] === "bastion") { rpg.bonus.hp += 6; rpg.S.hp += 6; } if (b[0] === "spd") rpg.bonus.spd += .08; if (b[0] === "wind") rpg.bonus.spd += .15; if (b[0] === "heal") rpg.S.hp = Math.min(rpg.maxHp(), rpg.S.hp + 8); if (b[0] === "flask") rpg.r.flasks += 2; if (b[0] === "sta") { rpg.S.hp = rpg.maxHp(); rpg.S.sta = 100; } if (b[0] === "cache") ctx.reward(45); st.depth = (st.depth || 0) + 1; st.best = Math.max(st.best || 0, st.depth); st.mod = st.depth % 2 ? 1 + Math.floor(Math.random() * (STAIR_MODS.length - 1)) : 0; delete st.clear[d.to]; closeTalk(); ctx.ping("done"); go(d.to, d.tx, d.ty); if (st.depth % 5 === 4) ctx.toast("Something big is on this floor."); }; say(null, `Depth ${(st.depth || 0) + 1} cleared. Choose a boon before you go down.`, pool.map((b) => [`${b[1]}: ${b[2]}`, () => pick(b), 1])); }
  function die(text) {
    if (performance.now() < invuln) return; st.deaths++; keys.clear(); ctx.ping("blip"); flash.hidden = false; flash.className = "rm-flash on"; setTimeout(() => { if (alive) { flash.hidden = true; flash.className = "rm-flash"; } }, 900);
    let stairLine = ""; if (R.endless) { const n = endRun(); stairLine = ` You cleared ${n} ${n === 1 ? "floor" : "floors"}. Your best is ${st.best || 0}.`; rpg.S.hp = rpg.maxHp(); text = (text || "") + stairLine + " The stair starts again."; } const [s, x, y] = R.respawn; go(s, x, y); if (R.delve) st.clear = st.clear || {}; say(R.deathBy, R.deathLine(st.deaths, text), [["Get up", closeTalk, 1]]);
  }
  const closeLog = () => { panelEl.hidden = true; panelEl.innerHTML = ""; el.focus({ preventScroll: true }); };
  const closeSheet = closeLog;
  function sheet() { panelEl.hidden = false; panelEl.innerHTML = `<header><h2>Your fox</h2><button class="btn" type="button" id="rm-x">Close <kbd>Esc</kbd></button></header><div class="wd-pbody">${rpg.sheet()}</div>`; panelEl.querySelector("#rm-x").onclick = closeSheet; rpg.bindSheet(panelEl, sheet); panelEl.querySelector("#rm-x").focus({ preventScroll: true }); }
  const keyAxis = () => [(keys.has("d") || keys.has("ArrowRight") ? 1 : 0) - (keys.has("a") || keys.has("ArrowLeft") ? 1 : 0) || joy?.x || 0, (keys.has("s") || keys.has("ArrowDown") ? 1 : 0) - (keys.has("w") || keys.has("ArrowUp") ? 1 : 0) || joy?.y || 0];
  const combat = (k, aim) => { if (busy() || boss) return; const charmed = bestie?.on || song?.on; if (k === "attack") { if (charmed && hounds.some((h) => !h.dead && Math.hypot(h.x - st.x, h.y - st.y) < 90)) ctx.toast(song?.on ? "You could never. They're humming along." : "You could never. They look just like her."); rpg.attack(charmed ? [] : hounds, aim); } else if (k === "dash") rpg.dash(...keyAxis()); else if (k === "skill") rpg.skill(charmed ? [] : hounds); else if (k === "drink") rpg.drink(); else if (k === "bolt") rpg.shoot(aim, charmed ? [] : hounds); else if (k === "sheet") sheet(); };
  el.querySelectorAll("[data-c]").forEach((b) => (b.onclick = () => combat(b.dataset.c)));
  c.addEventListener("pointerdown", (e) => { if (busy() || boss || e.button !== 0 || e.pointerType === "touch") return; const r = c.getBoundingClientRect(), wx = (e.clientX - r.left) / zoom + lastCam[0], wy = (e.clientY - r.top) / zoom + lastCam[1]; combat("attack", Math.atan2(wy - st.y, wx - st.x)); });
  function log() {
    const rows = R.quest.map((q, i) => `<li class="${i < st.step ? "ok" : ""}"><strong>${i <= st.step ? esc(q.title) : "???"}</strong><span>${i < st.step ? "Done" : i === st.step ? esc(q.goal) : ""}</span></li>`).join("");
    panelEl.hidden = false; panelEl.innerHTML = `<header><h2>${esc(R.title)}</h2><button class="btn" type="button" id="rm-x">Close <kbd>Esc</kbd></button></header><div class="wd-pbody"><ol class="wd-list">${rows}</ol>${bestie ? bestie.memHtml() : ""}${song ? song.memHtml() : ""}${relicTotal ? `<h3 class="h3">Relics ${Object.keys(st.found).length}/${relicTotal}</h3><ul class="wd-list">${R.relics.map((r) => `<li class="${st.found[r.id] ? "ok" : ""}"><strong>${st.found[r.id] ? esc(r.name) : "???"}</strong><span>${st.found[r.id] ? esc(r.text) : esc(scenes[r.s].name)}</span></li>`).join("")}</ul>` : ""}<p class="muted">${esc(R.deathWord)}: ${st.deaths}.</p></div>`; panelEl.querySelector("#rm-x").onclick = closeLog; panelEl.querySelector("#rm-x").focus({ preventScroll: true });
  }
  function find() {
    const bt = bestie?.target() || song?.target(); if (bt) return bt;
    let best = null, bd = 56; for (const n of sc.npcs || []) { if (hiddenNpc(n)) continue; const d = Math.hypot((n.x + .5) * T - st.x, (n.y + .5) * T - st.y); if (d < bd) { bd = d; best = { label: `${n.verb || "Talk to"} ${n.name}`, go: () => interact(n), n }; } } if (best) return best;
    for (const d of sc.doors) if (Math.hypot((d.x + .5) * T - st.x, (d.y + .5) * T - st.y) < 44) { const open = (!d.need || hasStep(d.need)) && (!d.clear || !hounds.some((h) => !h.dead)); return { label: d.clear && !open ? `${d.label} (sealed)` : d.label, go: () => (!open ? say(null, d.lock || "It won't open yet.") : d.descend ? descend(d) : go(d.to, d.tx, d.ty)) }; }
    return null;
  }
  const act = () => { if (!busy() && target) target.go(); };
  const leave = () => { if (R.endless) endRun(); save(); finish(); ctx.close(); };
  $(".rm-leave").onclick = () => (boss ? endBoss() : leave()); $(".rm-log").onclick = log; promptEl.onclick = act; $(".rm-act").onclick = act;
  const pad = $(".rm-pad"), knob = pad.querySelector("i");
  pad.onpointerdown = (e) => { pad.setPointerCapture(e.pointerId); joy = { x: 0, y: 0 }; pad.onpointermove(e); };
  pad.onpointermove = (e) => { if (!joy) return; const r = pad.getBoundingClientRect(), x = (e.clientX - r.left - r.width / 2) / (r.width / 2), y = (e.clientY - r.top - r.height / 2) / (r.height / 2), m = Math.max(1, Math.hypot(x, y)); joy = { x: x / m, y: y / m }; knob.style.transform = `translate(${joy.x * 30}px,${joy.y * 30}px)`; };
  pad.onpointerup = pad.onpointercancel = () => { joy = null; knob.style.transform = ""; };
  const onKey = (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey || document.querySelector(".modal") || e.target.matches?.("input,textarea,select")) return; const k = e.key.length === 1 ? e.key.toLowerCase() : e.key; if (k === "Tab") return; e.stopPropagation();
    if (k === "Escape") { e.preventDefault(); if (boss) endBoss(); else if (!panelEl.hidden) closeLog(); else if (!talkEl.hidden) closeTalk(); else leave(); return; }
    if (!talkEl.hidden) { if (/^[1-9]$/.test(k)) { e.preventDefault(); talkEl.querySelectorAll("[data-o]")[+k - 1]?.click(); } else if (k === "e") { e.preventDefault(); if (!e.repeat) talkEl.querySelector("[data-o]")?.click(); } return; }
    if (!panelEl.hidden) { if (k === "j" || k === "k") { e.preventDefault(); closeLog(); } return; }
    if (["w", "a", "s", "d", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Shift"].includes(k)) { e.preventDefault(); keys.add(k); return; }
    if (boss) return; if (k === "e" || k === " " || k === "Enter") { e.preventDefault(); if (!e.repeat) act(); } else if (k === "j") log(); else if (k === "f") { e.preventDefault(); combat("attack"); } else if (k === "q") { e.preventDefault(); if (!e.repeat) combat("dash"); } else if (k === "r") { e.preventDefault(); if (!e.repeat) combat("skill"); } else if (k === "c") { e.preventDefault(); if (!e.repeat) combat("drink"); } else if (k === "v") { e.preventDefault(); combat("bolt"); } else if (k === "k") { e.preventDefault(); sheet(); }
  };
  const onUp = (e) => keys.delete(e.key.length === 1 ? e.key.toLowerCase() : e.key), onBlur = () => keys.clear();
  document.addEventListener("keydown", onKey, true); document.addEventListener("keyup", onUp, true); addEventListener("blur", onBlur);

  const biting = (now, t) => Math.sin(now / 520 + t[0] * .9) > .15;
  function update(dt, now) {
    let ax = 0, ay = 0; if (!busy()) { if (keys.has("a") || keys.has("ArrowLeft")) ax--; if (keys.has("d") || keys.has("ArrowRight")) ax++; if (keys.has("w") || keys.has("ArrowUp")) ay--; if (keys.has("s") || keys.has("ArrowDown")) ay++; if (joy && Math.hypot(joy.x, joy.y) > .18) { ax = joy.x; ay = joy.y; } }
    if (boss) return boss.update(dt, ax, ay, keys.has("Shift"), now);
    if (bestie && !busy()) { bestie.update(dt); [ax, ay] = bestie.steer(ax, ay); }
    if (song && !busy()) { song.update(dt); const [sx, sy] = song.pull(st.x, st.y); ax += sx; ay += sy; }
    if (powers && !busy()) { powers.update(dt); [ax, ay] = powers.steer(ax, ay, dt); }
    if (performance.now() < rpg.S.dashEnd) { ax = rpg.S.dashX; ay = rpg.S.dashY; }
    moving = !!(ax || ay); if (moving) { const m = Math.max(1, Math.hypot(ax, ay)), v = (keys.has("Shift") ? 300 : 185) * rpg.speedMul() * (settings.world?.walkSpeed || 1) * (bestie?.on ? .86 : 1) * (powers ? powers.speedMul() : 1) * dt, nx = st.x + ax / m * v, ny = st.y + ay / m * v; if (!blocked(nx, st.y)) st.x = nx; if (!blocked(st.x, ny)) st.y = ny; dir = Math.abs(ax) > Math.abs(ay) ? (ax < 0 ? "left" : "right") : ay < 0 ? "up" : "down"; step += dt * 13; }
    if (settings.world?.autoHeal && !busy() && (healT += dt) >= 8) { healT = 0; if (rpg.S.hp < rpg.maxHp()) rpg.S.hp++; }
    if (!busy()) {
      if (!bestie?.on) for (const t of sc.teeth || []) if (biting(now, t) && Math.floor(st.x / T) === t[0] && Math.floor((st.y + 8) / T) === t[1] && rpg.hurt(3)) return die(sc.toothLine);
      if (rpg.update(dt, hounds)) return die(R.meterLine); for (const h of hounds) { if (h.dead) { if (sc.noRespawn || settings.world?.realmRespawn === false) continue; if (now > h.back) { Object.assign(h, { dead: false, x: h.hx, y: h.hy, hp: h.max, stun: 0, burn: 0, kx: 0, ky: 0 }); } continue; } if (h.kx || h.ky) { const nx = h.x + h.kx * dt, ny = h.y + h.ky * dt; if (!blocked(nx, h.y)) h.x = nx; if (!blocked(h.x, ny)) h.y = ny; h.kx *= Math.max(0, 1 - dt * 9); h.ky *= Math.max(0, 1 - dt * 9); if (Math.hypot(h.kx, h.ky) < 8) h.kx = h.ky = 0; } if (now < h.stun) continue; if (h.ai === "shoot") { const sd = Math.hypot(st.x - h.x, st.y - h.y) || 1; if (sd < 7.5 * T && now > h.fire) { h.fire = now + 1500; const a = Math.atan2(st.y - h.y, st.x - h.x); foeShots.push({ x: h.x, y: h.y - 8, vx: Math.cos(a) * 215, vy: Math.sin(a) * 215, life: 2.4, hit: h.hit }); } if (sd < 112) { const nx = h.x - (st.x - h.x) / sd * 95 * dt, ny = h.y - (st.y - h.y) / sd * 95 * dt; if (!blocked(nx, h.y)) h.x = nx; if (!blocked(h.x, ny)) h.y = ny; } continue; } if (h.ai === "charge") { const sd = Math.hypot(st.x - h.x, st.y - h.y) || 1; if (h.cState === "dash") { const nx = h.x + h.ax * 440 * dt, ny = h.y + h.ay * 440 * dt, hitWall = blocked(nx, ny); if (!hitWall) { h.x = nx; h.y = ny; } if (hitWall) { h.stun = now + 750; h.cState = ""; h.cd = now + 1500; } else if (now > h.cEnd) { h.cState = ""; h.cd = now + 1300; } if (sd < (h.size > 1 ? 42 : 27) && now > h.bite) { h.bite = now + 850; if (rpg.hurt(h.hit + 1)) return die(sc.houndLine); } continue; } if (h.cState === "wind") { if (now > h.cEnd) { h.cState = "dash"; h.cEnd = now + 430; } continue; } if (sd < 5.6 * T && now > h.cd) { h.cState = "wind"; h.cEnd = now + 580; h.ax = (st.x - h.x) / sd; h.ay = (st.y - h.y) / sd; continue; } } if (bestie?.on && h.kind === "mini") { const fd = Math.hypot(st.x - h.x, st.y - h.y); if (fd > 58 && fd < 12 * T) { h.x += (st.x - h.x) / fd * h.speed * dt; h.y += (st.y - h.y) / fd * h.speed * dt; } continue; } const d = Math.hypot(st.x - h.x, st.y - h.y), chase = d < 6 * T, tx = chase ? st.x : h.hx, ty = chase ? st.y : h.hy, q = Math.hypot(tx - h.x, ty - h.y); if (q > 2) { const v = (chase ? h.speed * (settings.world?.houndAggro || 1) : 70) * dt, nx = h.x + (tx - h.x) / q * v, ny = h.y + (ty - h.y) / q * v; if (!blocked(nx, h.y)) h.x = nx; if (!blocked(h.x, ny)) h.y = ny; } if (d < (h.size > 1 ? 40 : 25) && now > h.bite) { h.bite = now + 850; if (h.kind === "mini") bestie?.add(9); if (busy()) return; if (rpg.hurt(h.hit)) return die(sc.houndLine); } }
      if (sc.gargoyles) { if (!drop && now > dropT && moving) drop = { x: st.x, y: st.y, at: now + 1050 }; if (drop && now > drop.at) { const hit = Math.hypot(st.x - drop.x, st.y - drop.y) < 34; drop = null; dropT = now + 7000 + Math.random() * 9000; if (hit && rpg.hurt(4)) return die("A gargoyle dropped off the Great Hall and flattened you. Your coffee landed perfectly upright."); } }
    }
    const nt = busy() ? null : find(); if (nt?.label !== target?.label) { promptEl.hidden = !nt; if (nt) promptEl.innerHTML = `<kbd>E</kbd> ${esc(nt.label)}`; } target = nt;
    if (!busy() && !boss) { for (const b of foeShots) { b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt; if (blocked(b.x, b.y - 2)) b.life = 0; else if (Math.hypot(b.x - st.x, b.y - st.y + 4) < 17) { b.life = 0; if (rpg.hurt(b.hit)) return die(sc.houndLine); } } foeShots = foeShots.filter((b) => b.life > 0); if (R.delve && sc.hounds?.length && !st.clear[sc.id] && hounds.length && hounds.every((h) => h.dead)) { if (sc.waves && st.wave < sc.waves.length) { st.wave++; spawnHounds(sc.waves[st.wave - 1]); ctx.ping("choice"); ctx.toast(st.wave === sc.waves.length ? `${sc.name} is here!` : `Wave ${st.wave + 1}`); hud(); } else { st.clear[sc.id] = 1; if (R.bountyId) { st.beat = (st.beat || 0) + 1; ctx.onBounty?.(R.bountyId); } else { ctx.reward(10 + Math.round((sc.power || 0) * 6)); ctx.toast("Floor cleared. The stairs are open."); ctx.ping("done"); } hud(); } } }
    if (now > barsT) { barsT = now + 110; $(".rm-bars").innerHTML = rpg.bars() + (bestie?.bar() || "") + (powers?.bar() || ""); }
    if ((saveT += dt) > 6) { saveT = 0; save(); }
  }
  const pal = ctx.pet ? { x: st.x - 30, y: st.y + 8, cd: 0, healAt: performance.now() + 7000, flip: 1 } : null;
  function palTick(dt, now) { if (!pal) return; const foes = (bestie?.on ? [] : hounds).filter((h) => !h.dead); let tgt = null, bd = 190; for (const h of foes) { const q = Math.hypot(h.x - st.x, h.y - st.y); if (q < bd) { bd = q; tgt = h; } } const gx = tgt ? tgt.x + (pal.x < tgt.x ? -24 : 24) : st.x - 30, gy = tgt ? tgt.y : st.y + 8, d = Math.hypot(gx - pal.x, gy - pal.y); if (d > 4) { const v = Math.min(d, (tgt ? 250 : 215) * dt); pal.x += (gx - pal.x) / d * v; pal.y += (gy - pal.y) / d * v; pal.flip = gx < pal.x ? -1 : 1; } if (Math.hypot(st.x - pal.x, st.y - pal.y) > 420) { pal.x = st.x - 30; pal.y = st.y + 8; } if (tgt && Math.hypot(tgt.x - pal.x, tgt.y - pal.y) < 36 && now > pal.cd) { pal.cd = now + 1050; pal.hit = now + 140; const role = ctx.pet.role; rpg.strike(tgt, ctx.pet.dmg, now); if (role === "stun" && !tgt.dead && Math.random() < .3) tgt.stun = now + 900; if (role === "burn" && !tgt.dead) tgt.burn = now + 1800; if (role === "frost" && !tgt.dead && Math.random() < .45) tgt.stun = now + 520; } if (ctx.pet.role === "heal" && now > pal.healAt && rpg.S.hp < rpg.maxHp()) { pal.healAt = now + 8000; rpg.S.hp = Math.min(rpg.maxHp(), rpg.S.hp + 1 + Math.floor(ctx.pet.dmg / 3)); rpg.float(st.x, st.y - 44, `${ctx.pet.name} heals you`, "#7dff8a"); } }
  function frame(now) {
    if (!alive) return; const dt = Math.min(.05, (now - last) / 1000); last = now; update(dt, now); if (!boss && !busy()) palTick(dt, now); if (boss) { boss.draw(g, cw, ch, now, calm()); raf = requestAnimationFrame(frame); return; }
    const vw = cw / zoom, vh = ch / zoom, mw = sc.w * T, mh = sc.h * T, camX = mw < vw ? (mw - vw) / 2 : Math.max(0, Math.min(mw - vw, st.x - vw / 2)), camY = mh < vh ? (mh - vh) / 2 : Math.max(0, Math.min(mh - vh, st.y - vh / 2)), still = calm();
    lastCam = [camX, camY]; g.save(); g.fillStyle = sc.bg || "#0b0a10"; g.fillRect(0, 0, cw, ch); g.scale(zoom, zoom); g.translate(-Math.round(camX), -Math.round(camY));
    const x0 = Math.max(0, Math.floor(camX / T)), x1 = Math.min(sc.w - 1, Math.ceil((camX + vw) / T)), y0 = Math.max(0, Math.floor(camY / T)), y1 = Math.min(sc.h - 1, Math.ceil((camY + vh) / T));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const k = sc.grid[y * sc.w + x], t = TILES[k] || TILES.stone, n = (x * 7 + y * 13) % 5; g.fillStyle = t[0]; g.fillRect(x * T, y * T, T + .5, T + .5); g.fillStyle = n % 2 ? "rgba(255,255,255,.035)" : "rgba(0,0,0,.07)"; g.fillRect(x * T + n * 4, y * T + (n * 5) % 22, 7, 3); if (t[2]) t[2](g, x * T, y * T, now, still, x, y); }
    for (const t of sc.teeth || []) { const on = biting(now, t), px = t[0] * T, py = t[1] * T; g.fillStyle = on ? "#3b0c14" : "#4a3d3d"; g.fillRect(px, py, T, T); g.fillStyle = "#efe6d2"; for (let i = 0; i < 4; i++) { const a = px + i * 8, h = on ? 13 : 4; g.beginPath(); g.moveTo(a, py); g.lineTo(a + 4, py + h); g.lineTo(a + 8, py); g.fill(); g.beginPath(); g.moveTo(a, py + T); g.lineTo(a + 4, py + T - h); g.lineTo(a + 8, py + T); g.fill(); } }
    const things = [];
    for (const b of sc.b || []) things.push([(b.y + b.h) * T, () => R.building(g, b, now, still)]);
    for (const p of sc.props || []) things.push([(p[2] + 1) * T, () => drawProp(g, p, now, still)]);
    for (const n of sc.npcs || []) { if (hiddenNpc(n)) continue; const px = (n.x + .5) * T, py = (n.y + .5) * T; things.push([py + 13, () => { const b = still ? 0 : Math.sin(now / 620 + n.x) * 1.2; g.fillStyle = "rgba(0,0,0,.3)"; g.beginPath(); g.ellipse(px, py + 14, 14, 5, 0, 0, 7); g.fill(); if (n.art) drawProp(g, [n.art, n.x, n.y], now, still); else { const i = sprite(n); if (i.complete && i.naturalWidth) g.drawImage(i, px - 25, py - 54 + b, 50, 70); } if (quest()?.who === n.id) { g.fillStyle = "#ffd27a"; g.strokeStyle = "#111"; g.lineWidth = 2; g.beginPath(); g.arc(px, py - 64 + b, 9, 0, 7); g.fill(); g.stroke(); g.fillStyle = "#111"; g.font = "900 13px system-ui"; g.textAlign = "center"; g.fillText("!", px, py - 59 + b); } }]); }
    for (const h of hounds) if (!h.dead) things.push([h.y + 10, () => { if (R.monsters?.[h.kind]) { if (h.size > 1) { g.save(); g.translate(h.x, h.y); g.scale(1.9, 1.9); g.translate(-h.x, -h.y); R.monsters[h.kind](g, h, now, still); g.restore(); return; } return R.monsters[h.kind](g, h, now, still); } const q = still ? 0 : Math.sin(now / 80) * 2; g.fillStyle = "#16080c"; g.beginPath(); g.ellipse(h.x, h.y + 3, 18, 10, 0, 0, 7); g.fill(); g.fillRect(h.x - 14, h.y + 6 + q, 4, 9); g.fillRect(h.x + 10, h.y + 6 - q, 4, 9); g.beginPath(); g.arc(h.x + 15, h.y - 5, 8, 0, 7); g.fill(); g.fillStyle = "#ff2a3c"; g.fillRect(h.x + 16, h.y - 8, 3, 3); g.fillStyle = "#f4ead8"; g.fillRect(h.x + 12, h.y - 1, 10, 2); }]);
    if (pal && ctx.pet.img?.complete && ctx.pet.img.naturalWidth) things.push([pal.y + 13, () => { const j = now < (pal.hit || 0) ? -6 : still ? 0 : Math.sin(now / 130) * 1.2; g.fillStyle = "rgba(0,0,0,.25)"; g.beginPath(); g.ellipse(pal.x, pal.y + 13, 11, 4, 0, 0, 7); g.fill(); g.save(); g.translate(pal.x, pal.y + j); g.scale(pal.flip, 1); g.drawImage(ctx.pet.img, -19, -25, 38, 38); g.restore(); }]);
    things.push([st.y + 14, () => drawFox(g, st.x, st.y - (powers?.has("zeroG") ? 10 : 0), dir, step, ctx.fur, ctx.tails, ctx.hat, still ? 0 : now, moving)]);
    things.sort((a, b) => a[0] - b[0]); for (const t of things) t[1]();
    for (const h of hounds) { if (h.dead) continue; if (now < h.hurt) { g.fillStyle = "rgba(255,255,255,.55)"; g.beginPath(); g.arc(h.x, h.y - 4, 21, 0, 7); g.fill(); } if (now < h.stun) { g.fillStyle = "#ffe28a"; g.font = "900 13px system-ui"; g.textAlign = "center"; g.fillText("✦ ✦", h.x, h.y - 36); } if (h.burn > now) { g.fillStyle = "rgba(255,130,40,.6)"; g.beginPath(); g.arc(h.x, h.y - 2, 15 + (still ? 0 : Math.sin(now / 60) * 3), 0, 7); g.fill(); } if (h.hp < h.max) { g.fillStyle = "#111"; g.fillRect(h.x - 19, h.y - 31, 38, 6); g.fillStyle = "#ff4a5a"; g.fillRect(h.x - 18, h.y - 30, 36 * Math.max(0, h.hp) / h.max, 4); } }
    for (const b of foeShots) { g.fillStyle = "rgba(255,70,90,.3)"; g.beginPath(); g.arc(b.x, b.y, 11, 0, 7); g.fill(); g.fillStyle = "#ffd0d6"; g.beginPath(); g.arc(b.x, b.y, 5, 0, 7); g.fill(); } for (const h of hounds) if (!h.dead && h.cState === "wind") { g.strokeStyle = "rgba(255,60,70,.75)"; g.lineWidth = 16; g.lineCap = "round"; g.beginPath(); g.moveTo(h.x, h.y); g.lineTo(h.x + h.ax * 190, h.y + h.ay * 190); g.stroke(); g.lineCap = "butt"; }
    bestie?.draw(g, now, still); song?.draw(g, now); powers?.draw(g, now, still); rpg.draw(g, now, still);
    if (drop) { const k = 1 - Math.max(0, (drop.at - now) / 1050); g.fillStyle = `rgba(0,0,0,${.2 + k * .4})`; g.beginPath(); g.ellipse(drop.x, drop.y + 12, 34 * (.5 + k / 2), 15 * (.5 + k / 2), 0, 0, 7); g.fill(); }
    g.restore(); if (sc.tint && settings.world?.weatherEffects !== false) { g.fillStyle = sc.tint; g.fillRect(0, 0, cw, ch); } bestie?.overlay(g, cw, ch); powers?.overlay(g, cw, ch);
    raf = requestAnimationFrame(frame);
  }
  function finish() { if (!alive) return; alive = false; cancelAnimationFrame(raf); ro.disconnect(); document.removeEventListener("keydown", onKey, true); document.removeEventListener("keyup", onUp, true); removeEventListener("blur", onBlur); el.remove(); }
  el.__realm = { pal, descend, R, get foeShots() { return foeShots; }, state: st, scenes, go, interact, die, quest, beginBoss, rpg, combat, bestie, get hounds() { return hounds; }, get scene() { return sc; }, talk: talkEl };
  hud(); el.focus({ preventScroll: true }); raf = requestAnimationFrame(frame);
  if (!st.seen) { st.seen = 1; save(); say(null, `${R.intro} (F or click to attack, Q to dodge, R for your skill, C to drink Almond Water, V for bolts once learned, K for perks and weapons.)`, [["Walk in", closeTalk, 1]]); }
  return { close: () => { save(); finish(); }, el };
}
