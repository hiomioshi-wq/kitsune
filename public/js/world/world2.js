// Kitsune World 2 (The Astral Canopy): 720x540 world, 36 provinces, 30 Star-Bells, 43 NPCs,
// 1000 Star-Motes, 120 Relics, 72 wandering critters, 8-stop mail route, 4 Alchemy Charms,
// 8 daily treasure digs (G), Starfall Labyrinth (5 floors), 6 Bounties, Museum, Star-Garden,
// 9 minigame/shop buildings, Astral Rank progression, day/night cycle, and Sky-Ferry fast travel.
import {
  W2, H2, T2, W2_SPAWN, W2_TILES as TILE, W2_REGIONS, w2RegionAt,
  W2_BUILDINGS, w2Door, W2_NPCS, w2NpcPos, W2_BELLS, W2_FISH,
  W2_RELICS, W2_CRITTERS, W2_MAIL, W2_CHARMS, W2_BOUNTIES, W2_ACHIEVEMENTS, W2_FAMILIARS, W2_HATS, W2_FURNITURE,
} from "./world2data.js";
import { buildWorld2Map, w2TileSprites, drawW2Mesa, W2_COLORS } from "./world2map.js";
import {
  createW2Critters, digHereW2, openAlchemyUI, openStarWheelUI, openPearlDiveUI,
  openCardClashUI, openLabyrinthUI, openBountyBoardUI, openMuseumUI, createW2Garden,
  openWorkshopUI, openGuildUI, openArenaUI, openObservatoryUI, openStableUI,
  openVillaUI, openFortuneUI,
} from "./world2systems.js";
import { drawTree, drawBuilding, drawLantern, furnitureUrl } from "./art.js";
import { characterSvg } from "../vnchar.js";

const esc = (x) => String(x).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const today = () => new Date().toDateString();

export function ensureWorld2(s) {
  const w2 = (s.world2 ||= {});
  if (w2.x != null && !w2.v1600) {
    w2.x = (W2_SPAWN[0] + 0.5) * T2;
    w2.y = (W2_SPAWN[1] + 0.5) * T2;
  }
  w2.v1600 = 1;
  w2.x ??= (W2_SPAWN[0] + 0.5) * T2;
  w2.y ??= (W2_SPAWN[1] + 0.5) * T2;
  w2.motes ||= {};
  w2.relics ||= {};
  w2.bag ||= {};
  w2.took ||= {};
  w2.done ||= {};
  w2.lit ||= {};
  w2.fish ||= {};
  w2.critters ||= {};
  w2.charms ||= {};
  w2.milestones ||= {};
  w2.bounties ||= {};
  w2.museum ||= {};
  w2.garden ||= {};
  w2.perms ||= {};
  w2.ach ||= {};
  w2.fly ??= false;
  w2.boat ??= false;
  w2.caught ??= 0;
  w2.crittersCaught ??= 0;
  w2.mail ??= -1;
  w2.duelWins ??= 0;
  w2.labyrinthCleared ??= 0;
  w2.xp ??= 0;
  w2.level ??= 1;
  w2.visited ||= { crossing: 1 };
  w2.met ||= {};
  w2.final ??= 0;
  w2.ride ??= false;
  w2.time ??= "auto";
  const d = today();
  if (w2.day !== d) {
    w2.day = d;
    w2.forge = 0;
    w2.gears = 0;
    w2.tea = 0;
    w2.wheel = 0;
    w2.dive = 0;
  }
  return w2;
}

export function mountWorld2(host, api) {
  const s = api.state;
  const w2 = ensureWorld2(s);
  const map = buildWorld2Map();
  const tiles = w2TileSprites();
  const critters = createW2Critters(map, w2);
  const garden = createW2Garden(w2);
  const keys = new Set();

  host.innerHTML = `
    <canvas class="w2-c"></canvas>
    <div class="cv-hud w2-hud">
      <strong>🪙 <span id="w2-mon">${s.mon}</span> · ✨ <span id="w2-motes">0</span> · 🔔 <span id="w2-bells">0</span>/60 · ⭐ Lv.<span id="w2-lv">${w2.level}</span></strong>
      <p class="w2-obj" id="w2-obj"></p>
      <div class="cv-btns">
        <button type="button" data-h="journal">Journal <kbd>J</kbd></button>
        <button type="button" data-h="map">Map <kbd>M</kbd></button>
        <button type="button" data-h="bag">Bag <kbd>B</kbd></button>
        <button type="button" data-h="dig">Dig <kbd>G</kbd></button>
        <button type="button" data-h="ride">Cart <kbd>R</kbd></button>
        <button type="button" data-h="fly">Fly <kbd>V</kbd></button>
        <button type="button" data-h="boat">Boat <kbd>U</kbd></button>
        <button type="button" data-h="time" id="w2-time-btn">Time</button>
        <button type="button" data-h="leave">World 1 <kbd>Esc</kbd></button>
      </div>
    </div>
    <canvas class="w2-mini" id="w2-mini" width="216" height="162" aria-hidden="true"></canvas>
    <div class="wd-banner" id="w2-banner" hidden></div>
    <button type="button" class="by-prompt" id="w2-prompt" hidden></button>
    <div class="wd-pad cv-pad" id="w2-pad"><i></i></div>
    <button type="button" class="wd-act cv-act" id="w2-act">E</button>
    <div class="cv-toast" id="w2-toast" hidden></div>
    <div class="wd-talk" id="w2-talk" hidden role="dialog" aria-live="polite"></div>
    <section class="cv-page" id="w2-page" hidden></section>
  `;

  const c = host.querySelector(".w2-c"), g = c.getContext("2d");
  const miniC = host.querySelector("#w2-mini"), miniG = miniC.getContext("2d");
  const overlay = document.createElement("canvas"), og = overlay.getContext("2d");
  const pageEl = host.querySelector("#w2-page"), talkEl = host.querySelector("#w2-talk");
  const promptEl = host.querySelector("#w2-prompt"), toastEl = host.querySelector("#w2-toast"), bannerEl = host.querySelector("#w2-banner");

  let dir = "down", step = 0, moving = false, alive = true, raf = 0, last = performance.now();
  let cw = 0, ch = 0, zoom = 1.35, camX = 0, camY = 0;
  let target = null, region = "", bannerT = 0, toastT = 0, saveT = 0, miniT = 0, digAt = 0;
  let joy = null, pageOff = null, fishing = null, sparks = [], weather = [], fireworks = 0;
  let wispX = w2.x - 28, wispY = w2.y - 14;

  const moteCount = () => Object.keys(w2.motes).length;
  const bellCount = () => W2_BELLS.filter((b) => w2.lit[b.id]).length;
  const npcById = (id) => W2_NPCS.find((n) => n[0] === id);
  const nameOf = (id) => npcById(id)?.[2] || id;

  const blockedTile = (x, y) => x < 0 || y < 0 || x >= W2 || y >= H2 || map.solid[y * W2 + x];
  const blocked = (x, y) => [[-9, 2], [9, 2], [-9, 13], [9, 13]].some(([a, b]) => blockedTile(Math.floor((x + a) / T2), Math.floor((y + b) / T2)));
  if (blocked(w2.x, w2.y)) { w2.x = (W2_SPAWN[0] + 0.5) * T2; w2.y = (W2_SPAWN[1] + 0.5) * T2; }

  const people = W2_NPCS.map((n, i) => {
    const [nx, ny] = w2NpcPos(n);
    const svg = characterSvg(n[1], n[7], "calm");
    const img = new Image();
    img.src = "data:image/svg+xml," + encodeURIComponent(svg.replace('width="100%" height="100%"', 'width="300" height="420"'));
    return { n, id: n[0], x: (nx + 0.5) * T2, y: (ny + 0.5) * T2, img, tw: i * 1.1 };
  });

  const bells = W2_BELLS.map((b) => ({ b, x: (b.x + 0.5) * T2, y: (b.y + 0.5) * T2 }));
  const returnGate = { x: 800 * T2, y: 600 * T2 };

  const sayToast = (t) => { toastEl.textContent = t; toastEl.hidden = false; toastT = performance.now() + 3000; };
  const burst = (x, y, n = 18) => {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * 6.28, v = 45 + Math.random() * 125;
      sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1, c: ["#ffd27a", "#7fd0ff", "#ff8fd0", "#fff"][i % 4] });
    }
  };

  function addXp(n) {
    const fMul = w2.fortune?.day === today() && w2.fortune.buff === "xp" ? 1.35 : 1;
    const mul = (w2.constellations?.phoenixc ? 1.25 : 1) * (w2.familiar === "owlf" ? 1.35 : 1) * fMul;
    w2.xp = (w2.xp || 0) + Math.round(n * mul);
    while (w2.level < 20 && w2.xp >= w2.level * 100) {
      w2.xp -= w2.level * 100;
      w2.level++;
      api.addMon(50);
      sayToast(`Astral Rank Up! Lv.${w2.level} (+50 mon)`);
    }
    hud();
  }

  function darkness() {
    if (w2.time === "day") return 0;
    if (w2.time === "dusk") return 0.25;
    if (w2.time === "night") return 0.55;
    const h = new Date().getHours() + new Date().getMinutes() / 60;
    if (h >= 20 || h < 5) return 0.5;
    if (h >= 17.5 || h < 7) return 0.22;
    return 0;
  }

  function readyBell(b) {
    const n = b.need;
    return (!n.meet || w2.done[b.id])
      && (!n.motes || moteCount() >= n.motes)
      && (!n.fish || w2.caught >= n.fish)
      && (!n.critters || (w2.crittersCaught || 0) >= n.critters)
      && (!n.digs || (w2.dig?.total || 0) >= n.digs)
      && (!n.pay || s.mon >= n.pay);
  }

  function objectiveText() {
    if (w2.final) return "All 60 Star-Bells ring across World 2!";
    const b = W2_BELLS.find((x) => !w2.lit[x.id]);
    if (!b) return "All 60 Star-Bells are lit!";
    if (!w2.took[b.id]) return `Talk to ${nameOf(b.who)} (${b.name})`;
    if (readyBell(b)) return `Return to ${nameOf(b.who)} to ring ${b.name}`;
    const n = b.need, bits = [];
    if (n.meet && !w2.done[b.id]) bits.push(`meet ${nameOf(n.meet)}`);
    if (n.motes) bits.push(`motes ${moteCount()}/${n.motes}`);
    if (n.fish) bits.push(`fish ${w2.caught}/${n.fish}`);
    if (n.critters) bits.push(`critters ${w2.crittersCaught || 0}/${n.critters}`);
    if (n.digs) bits.push(`digs ${w2.dig?.total || 0}/${n.digs}`);
    if (n.pay) bits.push(`mon ${s.mon}/${n.pay}`);
    return `${b.name}: ${bits.join(", ")}`;
  }

  const hud = () => {
    host.querySelector("#w2-mon").textContent = s.mon;
    host.querySelector("#w2-motes").textContent = moteCount();
    host.querySelector("#w2-bells").textContent = bellCount();
    host.querySelector("#w2-lv").textContent = w2.level;
    host.querySelector("#w2-obj").textContent = objectiveText();
    host.querySelector("#w2-time-btn").textContent = `Time: ${w2.time}`;
  };

  const closeTalk = () => { talkEl.hidden = true; talkEl.innerHTML = ""; host.focus({ preventScroll: true }); };
  const closePage = () => { pageOff?.(); pageOff = null; fishing = null; pageEl.hidden = true; pageEl.innerHTML = ""; api.save(); hud(); host.focus({ preventScroll: true }); };
  const busy = () => !talkEl.hidden || !pageEl.hidden;

  function page(title, html, bind) {
    closeTalk();
    pageOff?.();
    pageOff = null;
    pageEl.hidden = false;
    pageEl.innerHTML = `<header><button class="btn" type="button" id="w2-back">Back</button><h2>${esc(title)}</h2><span>🪙 ${s.mon} · ✨ ${moteCount()}</span></header><div class="cv-body">${html}</div>`;
    pageEl.querySelector("#w2-back").onclick = closePage;
    pageOff = bind?.(pageEl) || null;
    api.ping("open");
  }

  function say(person, text, btns = []) {
    const list = [...btns, ["Goodbye", closeTalk]];
    talkEl.hidden = false;
    api.ping("blip");
    talkEl.innerHTML = `${person ? `<div class="wd-face">${characterSvg(person.n[1], person.n[7], /!/.test(text) ? "happy" : "calm")}</div>` : ""}<div class="wd-say">${person ? `<strong>${esc(person.n[2])}</strong>` : ""}<p>${esc(text)}</p><div class="wd-opts">${list.map(([l], i) => `<button class="btn${i === 0 && list.length > 1 ? " btn-accent" : ""}" type="button" data-o="${i}"><kbd>${i + 1}</kbd> ${esc(l)}</button>`).join("")}</div></div>`;
    talkEl.querySelectorAll("[data-o]").forEach((b) => (b.onclick = () => list[+b.dataset.o][1]()));
    talkEl.querySelector("[data-o]")?.focus({ preventScroll: true });
  }

  function talk(p) {
    const id = p.id;
    w2.met[id] = 1;
    if (w2.mail >= 0 && w2.mail < W2_MAIL.length && W2_MAIL[w2.mail][0] === id) {
      const msg = W2_MAIL[w2.mail][1];
      w2.mail++;
      api.addMon(40);
      addXp(25);
      api.ping("choice");
      api.save();
      hud();
      const next = W2_MAIL[w2.mail];
      return say(p, `${msg} (+40 mon${next ? `. Next letter: ${nameOf(next[0])}` : ". Mail route complete! +150 mon bonus!"})`, next ? [] : [["Claim Bonus", () => { api.addMon(150); api.ping("done"); closeTalk(); }]]);
    }
    if (id === "kaelen" && w2.mail < 0) {
      return say(p, "Want to run the Astral Mail Satchel? Eight letters across World 2, 40 mon each plus a 150 mon bonus!", [
        ["Take the Mail Satchel", () => { w2.mail = 0; api.save(); api.ping("choice"); say(p, `First letter is for ${nameOf(W2_MAIL[0][0])}!`); }],
      ]);
    }
    const meetQ = W2_BELLS.find((b) => b.need.meet === id && w2.took[b.id] && !w2.done[b.id] && !w2.lit[b.id]);
    if (meetQ) {
      w2.done[meetQ.id] = 1;
      api.save();
      hud();
      api.ping("choice");
      return say(p, meetQ.met);
    }
    const bell = W2_BELLS.find((b) => b.who === id && !w2.lit[b.id]);
    if (bell) {
      if (!w2.took[bell.id]) {
        return say(p, bell.ask, [["I'll ring it", () => { w2.took[bell.id] = 1; api.save(); hud(); api.ping("choice"); say(p, bell.wait); }]]);
      }
      if (readyBell(bell)) {
        return say(p, bell.need.pay ? `Ready to wind the bell for ${bell.need.pay} mon?` : "Everything is ready. Shall we ring the Star-Bell?", [
          [bell.need.pay ? `Pay ${bell.need.pay} mon` : "Ring the Star-Bell", () => {
            if (bell.need.pay) api.addMon(-bell.need.pay);
            w2.lit[bell.id] = 1;
            api.addMon(100);
            addXp(45);
            burst((bell.x + 0.5) * T2, (bell.y + 0.5) * T2, 42);
            api.ping("done");
            const n = bellCount();
            let extra = "";
            if (n === 5 && !w2.milestones[5]) { w2.milestones[5] = 1; api.addMon(250); extra = " (5-Bell Milestone: +250 mon!)"; }
            if (n === 10 && !w2.milestones[10]) { w2.milestones[10] = 1; api.addMon(500); api.giveFurn("w2_horizonbeacon"); extra = " (10-Bell Milestone: +500 mon & Mini Horizon Beacon!)"; }
            if (n === 15 && !w2.milestones[15]) { w2.milestones[15] = 1; api.addMon(750); extra = " (15-Bell Milestone: +750 mon!)"; }
            if (n === 20 && !w2.milestones[20]) { w2.milestones[20] = 1; api.addMon(1000); api.giveHat("w2_sovereign"); api.giveFurn("w2_twinmonument"); extra = " (20-Bell Milestone: +1000 mon, Astral Sovereign Crown & Twin-World Seal!)"; }
            if (n === 25 && !w2.milestones[25]) { w2.milestones[25] = 1; api.addMon(1500); extra = " (25-Bell Milestone: +1500 mon!)"; }
            if (n === 30 && !w2.milestones[30]) { w2.milestones[30] = 1; api.addMon(2000); api.giveHat("w2_elysian"); api.giveFurn("w2_elysianorb"); extra = " (30-Bell Milestone: +2000 mon, Elysian Crown & Orb!)"; }
            if (n === 35 && !w2.milestones[35]) { w2.milestones[35] = 1; api.addMon(2500); extra = " (35-Bell Milestone: +2500 mon!)"; }
            if (n === 40 && !w2.milestones[40]) { w2.milestones[40] = 1; api.addMon(3000); api.giveHat("w2_astralwings"); api.giveFurn("w2_terminuscrown"); extra = " (40-Bell Milestone: +3000 mon, Sovereign Astral Crown & Monument!)"; }
            if (n === 45 && !w2.milestones[45]) { w2.milestones[45] = 1; api.addMon(3500); extra = " (45-Bell Milestone: +3500 mon!)"; }
            if (n === W2_BELLS.length && !w2.final) {
              w2.final = 1;
              api.addMon(5000);
              api.giveHat("w2_omegacrown");
              api.giveFurn("w2_omegamonument");
              fireworks = 20;
              extra = " (+5000 mon, Omega Twin-World Crown & Omega Horizon Beacon!)";
            }
            api.save();
            hud();
            say(p, `${bell.thanks} (+100 mon)${extra}`);
          }],
        ]);
      }
      return say(p, bell.wait);
    }
    const lines = p.n[6];
    p.line = ((p.line || 0) + 1) % lines.length;
    say(p, lines[p.line]);
  }

  function outfitter(tab = "hats") {
    const body = tab === "hats"
      ? `<div class="wd-goods">${W2_HATS.filter((h) => h[2] || s.hats.includes(h[0])).map((h) => {
          const own = s.hats.includes(h[0]), on = s.hat === h[0];
          return `<div><strong>${esc(h[1])}</strong><button class="btn${on ? " btn-accent" : ""}" type="button" data-hat="${h[0]}" ${!own && s.mon < h[2] ? "disabled" : ""}>${on ? "Take off" : own ? "Wear" : `Buy · ${h[2]} mon`}</button></div>`;
        }).join("")}</div>`
      : `<div class="wd-goods">${W2_FURNITURE.filter((f) => f[2] || s.furn[f[0]]).map((f) => `<div><img src="${furnitureUrl(f[0], f[3])}" alt=""><strong>${esc(f[1])}</strong><span class="muted">Owned: ${s.furn[f[0]] || 0}</span>${f[2] ? `<button class="btn" type="button" data-f="${f[0]}" ${s.mon < f[2] ? "disabled" : ""}>Buy · ${f[2]} mon</button>` : `<span class="muted">Reward</span>`}</div>`).join("")}</div>`;

    page("Astral Outfitter", `<div class="wd-tabs"><button class="btn${tab === "hats" ? " btn-accent" : ""}" data-t="hats">World 2 Hats (${W2_HATS.length})</button><button class="btn${tab === "furn" ? " btn-accent" : ""}" data-t="furn">World 2 Furniture (${W2_FURNITURE.length})</button></div>${body}`, (el) => {
      el.querySelectorAll("[data-t]").forEach((b) => (b.onclick = () => outfitter(b.dataset.t)));
      el.querySelectorAll("[data-hat]").forEach((b) => (b.onclick = () => {
        const h = W2_HATS.find((x) => x[0] === b.dataset.hat);
        if (!s.hats.includes(h[0])) { if (s.mon < h[2]) return; api.addMon(-h[2]); api.giveHat(h[0]); api.ping("done"); }
        else { s.hat = s.hat === h[0] ? "" : h[0]; api.save(); }
        outfitter("hats");
      }));
      el.querySelectorAll("[data-f]").forEach((b) => (b.onclick = () => {
        const f = W2_FURNITURE.find((x) => x[0] === b.dataset.f);
        if (!f || s.mon < f[2]) return;
        api.addMon(-f[2]);
        api.giveFurn(f[0]);
        api.ping("choice");
        outfitter("furn");
      }));
    });
  }

  function forgeGame() {
    if (w2.forge >= 3) return sayToast("The Starlight Forge is cooling. Three charms a day!");
    w2.forge++;
    let pos = 0, vel = 105, tries = 0, hits = 0, z = 25 + Math.random() * 45, zw = 16;
    page("The Starlight Forge", `<p class="muted">Strike the meteor-iron while the spark rides inside the gold zone! 3 strikes per session.</p><div class="by-jobtop"><strong id="fg-n">Strikes left: 3</strong><strong id="fg-s">0 tempered</strong></div><div class="cv-bar"><i id="fg-m"></i><u id="fg-z"></u></div><button class="btn btn-accent" type="button" id="fg-hit">Strike Anvil</button>`, (el) => {
      const mark = el.querySelector("#fg-m"), zoneEl = el.querySelector("#fg-z");
      const paint = () => { mark.style.left = `${pos}%`; zoneEl.style.left = `${z}%`; zoneEl.style.width = `${zw}%`; };
      const iv = setInterval(() => { pos += vel * 0.05; if (pos > 100 || pos < 0) { pos = Math.max(0, Math.min(100, pos)); vel *= -1; } paint(); }, 45);
      el.querySelector("#fg-hit").onclick = () => {
        if (pos >= z && pos <= z + zw) { hits++; const pay = 25 + hits * 10; api.addMon(pay); addXp(15); api.ping("done"); burst(w2.x, w2.y, 12); sayToast(`Tempered! +${pay} mon`); zw = Math.max(8, zw - 2); }
        else api.ping("blip");
        tries++;
        el.querySelector("#fg-n").textContent = `Strikes left: ${3 - tries}`;
        el.querySelector("#fg-s").textContent = `${hits} tempered`;
        z = 20 + Math.random() * 55;
        if (tries >= 3) {
          clearInterval(iv);
          page("Forge Complete", `<p class="by-big">${hits} of 3 charms tempered</p><button class="btn btn-accent" type="button" id="fg-again">Forge Again</button>`, (q) => {
            q.querySelector("#fg-again").onclick = () => forgeGame();
          });
        }
      };
      paint();
      return () => clearInterval(iv);
    });
  }

  function gearGame() {
    if (w2.gears >= 3) return sayToast("The Brass Gearworks has wound down for today. (3/3)");
    w2.gears++;
    const rings = [Math.floor(Math.random() * 4), Math.floor(Math.random() * 4), Math.floor(Math.random() * 4)];
    if (rings.every((x) => x === 2)) rings[0] = 1;
    const syms = ["☀️", "🌙", "⭐", "⚙️"];
    const draw = (el) => el.querySelectorAll("[data-g]").forEach((b) => (b.textContent = syms[rings[+b.dataset.g]]));
    page("The Brass Gearworks", `<p class="muted">Align all three brass rings to ⭐ to wind the Gorge pendulum (+55 mon).</p><div style="display:flex;gap:14px;justify-content:center;margin:18px 0">${[0, 1, 2].map((i) => `<button class="btn" style="font-size:28px;padding:16px 24px" data-g="${i}">${syms[rings[i]]}</button>`).join("")}</div>`, (el) => {
      el.querySelectorAll("[data-g]").forEach((b) => (b.onclick = () => {
        const idx = +b.dataset.g;
        rings[idx] = (rings[idx] + 1) % 4;
        api.ping("blip");
        draw(el);
        if (rings.every((x) => x === 2)) {
          api.addMon(55);
          addXp(20);
          api.ping("done");
          api.save();
          page("Pendulum Wound!", `<p class="by-big">⚙️ ⭐ ⭐ ⭐ ⚙️</p><p>The Gorge chimes! +55 mon.</p><button class="btn btn-accent" type="button" id="gg-ok">Done</button>`, (q) => { q.querySelector("#gg-ok").onclick = closePage; });
        }
      }));
    });
  }

  function teaGame() {
    if (w2.tea >= 3) return sayToast("Sumi's kettle is resting until tomorrow. (3/3)");
    w2.tea++;
    const leaves = ["Plum Blossom", "Star-Mint", "Moon-Oolong", "Amber-Chamomile"];
    const pick = leaves[Math.floor(Math.random() * leaves.length)];
    page("Nine-Moons Teahouse", `<p class="muted">Sumi invites you to steep a pot of <strong>${pick}</strong>. Choose the water temperature:</p><div class="chips" style="justify-content:center;margin:16px 0"><button class="btn" data-temp="cool">Cool Spring (70°C)</button><button class="btn btn-accent" data-temp="warm">Moon-Warm (85°C)</button><button class="btn" data-temp="boil">Rolling Boil (100°C)</button></div>`, (el) => {
      el.querySelectorAll("[data-temp]").forEach((b) => (b.onclick = () => {
        const pay = b.dataset.temp === "warm" ? 45 : 22;
        api.addMon(pay);
        addXp(15);
        api.ping("done");
        api.save();
        page("Tea Served", `<p class="by-big">🍵 ${esc(pick)}</p><p>${b.dataset.temp === "warm" ? "Perfectly steeped!" : "A bit brisk, still comforting."} +${pay} mon</p><button class="btn btn-accent" type="button" id="tg-ok">Lovely</button>`, (q) => { q.querySelector("#tg-ok").onclick = closePage; });
      }));
    });
  }

  function fishGame(zone) {
    const pool = W2_FISH.filter((f) => f[2] === "any" || f[2] === zone);
    const total = pool.reduce((a, f) => a + 1 / f[3], 0);
    let r = Math.random() * total, fish = pool[0];
    for (const f of pool) { r -= 1 / f[3]; if (r <= 0) { fish = f; break; } }
    page("World 2 Fishing", `<div class="wd-fishing"><p id="w2f-msg">Your line drifts in ${esc(W2_REGIONS[zone]?.[0] || "the waters")}…</p><div class="wf-bar" hidden><i id="w2f-zone"></i><b id="w2f-mark"></b></div><button class="btn btn-accent" type="button" id="w2f-go"><kbd>E</kbd> Waiting…</button></div>`, (el) => {
      const msg = el.querySelector("#w2f-msg"), bar = el.querySelector(".wf-bar"), zoneEl = el.querySelector("#w2f-zone"), mark = el.querySelector("#w2f-mark"), go = el.querySelector("#w2f-go");
      const F = fishing = { phase: "wait", raf: 0, t0: performance.now(), biteAt: 850 + Math.random() * 2100 };
      const fLuck = w2.fortune?.day === today() && w2.fortune.buff === "fish" ? 1.3 : 1;
      const width = Math.min(0.84, fish[4] * (w2.charms?.lure ? 1.4 : 1) * fLuck), left = 0.1 + Math.random() * (0.8 - width);
      let pos = 0;
      const again = () => { go.textContent = "Cast again"; go.onclick = () => fishGame(zone); F.phase = "over"; };
      const hit = () => {
        if (F.phase === "wait") { msg.textContent = "Too soon!"; api.ping("blip"); again(); }
        else if (F.phase === "bite") { F.phase = "reel"; bar.hidden = false; zoneEl.style.left = left * 100 + "%"; zoneEl.style.width = width * 100 + "%"; msg.textContent = "Stop the marker in the gold!"; go.innerHTML = "<kbd>E</kbd> Reel in"; F.t0 = performance.now(); }
        else if (F.phase === "reel") {
          if (pos >= left && pos <= left + width) {
            w2.caught++;
            w2.fish[fish[0]] = (w2.fish[fish[0]] || 0) + 1;
            const pay = Math.round(fish[3] * (w2.charms?.lure ? 1.5 : 1) * (w2.constellations?.coralc ? 1.25 : 1));
            api.addMon(pay);
            addXp(14);
            api.save();
            hud();
            api.ping("done");
            msg.innerHTML = `Caught: <strong>${esc(fish[1])}</strong> (+${pay} mon)`;
          } else { api.ping("blip"); msg.textContent = "It slipped the hook."; }
          again();
        } else if (F.phase === "over") go.click();
      };
      F.hit = hit;
      go.onclick = hit;
      const tick = (now) => {
        if (fishing !== F || F.phase === "over") return;
        if (F.phase === "wait" && now - F.t0 > F.biteAt) { F.phase = "bite"; F.t0 = now; msg.textContent = "A bite! Strike now!"; go.innerHTML = "<kbd>E</kbd> Strike!"; api.ping("choice"); }
        else if (F.phase === "bite" && now - F.t0 > 1400) { msg.textContent = "It stole the bait."; again(); return; }
        else if (F.phase === "reel") { pos = (Math.sin((now - F.t0) / (260 + width * 850) - 1.57) + 1) / 2; mark.style.left = pos * 100 + "%"; }
        F.raf = requestAnimationFrame(tick);
      };
      F.raf = requestAnimationFrame(tick);
      return () => { cancelAnimationFrame(F.raf); fishing = null; };
    });
  }

  function showMap() {
    const here = w2RegionAt(Math.floor(w2.x / T2), Math.floor(w2.y / T2));
    const mapUrl = miniC.toDataURL();
    page("World 2: The Astral Canopy (1600×1200)", `
      <div class="wd-bigmap" style="max-width:740px;margin:0 auto">
        <img src="${mapUrl}" alt="World 2 Map">
        ${Object.entries(W2_REGIONS).map(([k, r]) => `<span style="left:${(r[1] / W2) * 100}%;top:${(r[2] / H2) * 100}%" class="${w2.visited[k] ? "seen" : ""}">${w2.visited[k] ? esc(r[0]) : "?"}</span>`).join("")}
        <i style="left:${(w2.x / T2 / W2) * 100}%;top:${(w2.y / T2 / H2) * 100}%"></i>
      </div>
      <p class="muted" style="margin-top:10px">Click any discovered province (${Object.keys(w2.visited).length}/72) to board the Sky-Ferry there.</p>
      <div class="chips" style="justify-content:center;margin:10px 0">
        ${Object.entries(W2_REGIONS).map(([k, r]) => {
          const seen = !!w2.visited[k];
          const lit = W2_BELLS.find((b) => b.id === k) ? (w2.lit[k] ? " 🔔" : " 🔕") : "";
          return `<button class="chip${k === here ? " on" : ""}" type="button" ${seen ? `data-go="${k}"` : "disabled"}>${seen ? esc(r[0]) + lit : "???"}</button>`;
        }).join("")}
      </div>
    `, (el) => {
      el.querySelectorAll("[data-go]").forEach((b) => (b.onclick = () => {
        const r = W2_REGIONS[b.dataset.go];
        let best = [r[1], r[2]], bd = 1e9;
        for (let y = r[2] - 8; y <= r[2] + 8; y++) {
          for (let x = r[1] - 8; x <= r[1] + 8; x++) {
            if (x >= 1 && y >= 1 && x < W2 - 1 && y < H2 - 1 && map.reach[y * W2 + x] && !blocked((x + 0.5) * T2, (y + 0.5) * T2)) {
              const q = (x - r[1]) ** 2 + (y - r[2]) ** 2;
              if (q < bd) { bd = q; best = [x, y]; }
            }
          }
        }
        w2.x = (best[0] + 0.5) * T2;
        w2.y = (best[1] + 0.5) * T2;
        api.ping("choice");
        closePage();
      }));
    });
  }

  function showJournal(tab = "bells") {
    const tabs = [["bells", `Star-Bells (${bellCount()}/60)`], ["stats", "Rank & Frontier"], ["ach", "Achievements"], ["dex", "Encyclopedia"], ["bounties", "Bounties & Museum"], ["help", "Guide"]];
    let body = "";
    if (tab === "bells") {
      body = `<div class="wd-goods">${W2_BELLS.map((b) => {
        const status = w2.lit[b.id] ? "🔔 Lit" : w2.took[b.id] ? "⏳ Active" : "🔕 Silent";
        return `<div><strong>${esc(b.name)}</strong><span class="muted">Keeper: ${esc(nameOf(b.who))}</span><span>${status}</span></div>`;
      }).join("")}</div>`;
    } else if (tab === "ach") {
      body = `<div class="wd-goods">${W2_ACHIEVEMENTS.map((a) => {
        const claimed = !!w2.ach?.[a.id], ready = !claimed && a.check(w2);
        return `<div><strong>${esc(a.name)}</strong><span class="muted">${esc(a.desc)} · +${a.pay} mon</span>${claimed ? `<span style="color:#7dff8a;font-weight:800">Claimed ✓</span>` : ready ? `<button class="btn btn-accent" data-ach="${a.id}">Claim</button>` : `<span class="muted">Locked</span>`}</div>`;
      }).join("")}</div>`;
    } else if (tab === "stats") {
      const mailText = w2.mail < 0 ? "Not started (talk to Captain Kaelen)" : w2.mail >= W2_MAIL.length ? "Complete ✓" : `Next: ${nameOf(W2_MAIL[w2.mail][0])} (${w2.mail}/${W2_MAIL.length})`;
      body = `<div class="wd-goods">
        <div><strong>Astral Rank</strong><span>Lv.${w2.level} (${w2.xp}/${w2.level * 100} XP)</span></div>
        <div><strong>Provinces Visited</strong><span>${Object.keys(w2.visited).length} / 72</span></div>
        <div><strong>Star-Motes</strong><span>${moteCount()} / ${map.motes.length}</span></div>
        <div><strong>Critters Caught</strong><span>${w2.crittersCaught || 0}</span></div>
        <div><strong>Fish Caught</strong><span>${w2.caught}</span></div>
        <div><strong>Treasures Dug</strong><span>${w2.dig?.total || 0}</span></div>
        <div><strong>Card Clash Wins</strong><span>${w2.duelWins || 0}</span></div>
        <div><strong>Labyrinth Clears</strong><span>${w2.labyrinthCleared || 0}</span></div>
        <div><strong>Astral Mail Route</strong><span>${esc(mailText)}</span></div>
        <div><strong>Active Charms</strong><span>${Object.keys(w2.charms || {}).length} / ${W2_CHARMS.length}</span></div>
      </div>`;
    } else if (tab === "dex") {
      body = `<h3>Fish (${W2_FISH.filter((f) => w2.fish[f[0]]).length}/${W2_FISH.length})</h3><div class="wd-goods">${W2_FISH.map((f) => `<div><strong>${esc(w2.fish[f[0]] ? f[1] : "???")}</strong><span>${w2.fish[f[0]] ? `Caught: ${w2.fish[f[0]]}` : "Undiscovered"}</span></div>`).join("")}</div>
        <h3 style="margin-top:14px">Critters (${W2_CRITTERS.filter((c) => w2.critters?.[c[0]]).length}/${W2_CRITTERS.length})</h3><div class="wd-goods">${W2_CRITTERS.map((c) => `<div><strong>${esc(w2.critters?.[c[0]] ? c[1] : "???")}</strong><span>${w2.critters?.[c[0]] ? `Caught: ${w2.critters[c[0]]}` : "Undiscovered"}</span></div>`).join("")}</div>`;
    } else if (tab === "bounties") {
      body = `<div class="wd-goods">
        ${W2_BOUNTIES.map((b) => `<div><strong>${esc(b.name)}</strong><span class="muted">${esc(b.region)}</span><span>${w2.bounties?.[b.id] ? "Defeated ✓" : "Active"}</span></div>`).join("")}
        <div><strong>Museum Donations</strong><span>${Object.keys(w2.museum || {}).length} / ${W2_RELICS.length + W2_FISH.length + W2_CRITTERS.length}</span></div>
      </div>`;
    } else {
      body = `<ul class="wd-help" style="text-align:left;max-width:620px;margin:0 auto">
        <li><b>Move</b>: W A S D or Arrows (Shift to sprint, R for Cart, V for Sky-Glider after 5 bells).</li>
        <li><b>Interact / Fish / Catch Critters / Garden</b>: E or Space.</li>
        <li><b>Dig Treasures</b>: Press G anywhere to use the Treasure Compass (12 daily treasures).</li>
        <li><b>Starfall Crossing Hub</b>: Starfall Labyrinth (5 floors), Astral Guild Hall, Starfall Workshop, Frontier Bounty Board, Starfall Museum, Starfall Alchemy, Star-Wheel Pavilion, Astral Outfitter, Star-Garden, Sky-Ferry Depot.</li>
        <li><b>Fast Travel</b>: Press M to open the 960×720 World 2 Map and fly to any discovered province.</li>
      </ul>`;
    }
    page("World 2 Journal", `<div class="wd-tabs">${tabs.map(([k, l]) => `<button class="btn${tab === k ? " btn-accent" : ""}" data-jt="${k}">${esc(l)}</button>`).join("")}</div>${body}`, (el) => {
      el.querySelectorAll("[data-jt]").forEach((b) => (b.onclick = () => showJournal(b.dataset.jt)));
      el.querySelectorAll("[data-ach]").forEach((b) => (b.onclick = () => {
        const a = W2_ACHIEVEMENTS.find((x) => x.id === b.dataset.ach);
        if (!a || w2.ach?.[a.id] || !a.check(w2)) return;
        w2.ach[a.id] = 1;
        api.addMon(a.pay);
        api.ping("done");
        api.save();
        sayToast(`${a.name} claimed! (+${a.pay} mon)`);
        showJournal("ach");
      }));
    });
  }

  function showBag() {
    const fishRows = W2_FISH.filter((f) => w2.fish[f[0]]).map((f) => `<div><strong>${esc(f[1])}</strong><span>×${w2.fish[f[0]]}</span></div>`).join("") || `<p class="muted">No World 2 fish caught yet.</p>`;
    const critterRows = W2_CRITTERS.filter((c) => w2.critters?.[c[0]]).map((c) => `<div><strong>${esc(c[1])}</strong><span>×${w2.critters[c[0]]}</span></div>`).join("") || `<p class="muted">No critters caught yet.</p>`;
    const relicRows = W2_RELICS.map((r) => `<div><strong>${esc(r[1])}</strong><span>×${w2.bag[r[0]] || 0}</span>${w2.bag[r[0]] ? `<button class="btn" data-sell="${r[0]}">Sell (${r[2]} mon)</button>` : ""}</div>`).join("");
    page("World 2 Satchel", `<h3>Relics (${W2_RELICS.length} types)</h3><div class="wd-goods">${relicRows}</div><h3 style="margin-top:16px">Critters</h3><div class="wd-goods">${critterRows}</div><h3 style="margin-top:16px">Fish Log</h3><div class="wd-goods">${fishRows}</div>`, (el) => {
      el.querySelectorAll("[data-sell]").forEach((b) => (b.onclick = () => {
        const r = W2_RELICS.find((x) => x[0] === b.dataset.sell);
        if (!r || !w2.bag[r[0]]) return;
        w2.bag[r[0]]--;
        api.addMon(r[2]);
        api.ping("choice");
        showBag();
      }));
    });
  }

  function facingWater() {
    const [a, b] = { up: [0, -26], down: [0, 34], left: [-28, 8], right: [28, 8] }[dir];
    const x = Math.floor((w2.x + a) / T2), y = Math.floor((w2.y + b) / T2);
    return x > 0 && y > 0 && x < W2 && y < H2 && map.g[y * W2 + x] === TILE.water;
  }

  function findTarget() {
    if (Math.hypot(returnGate.x - w2.x, returnGate.y - w2.y) < 54) {
      return { label: "Return to World 1 (Hollow Pine)", go: api.leave };
    }
    const gt = garden.target(w2.x, w2.y);
    if (gt) return { label: gt.label, go: () => garden.interact(gt, { s, api, page, closePage, sayToast, burst, hud }) };
    const nearCrit = critters.near(w2.x, w2.y);
    if (nearCrit) {
      return { label: `Catch ${nearCrit.sp[1]}`, go: () => critters.catch(nearCrit, api, burst, sayToast, hud, addXp) };
    }
    for (const p of people) {
      if (Math.hypot(p.x - w2.x, p.y - w2.y) < 48) return { label: `Talk to ${p.n[2]}`, go: () => talk(p) };
    }
    for (const b of W2_BUILDINGS) {
      const d = w2Door(b);
      if (Math.hypot((d[0] + 0.5) * T2 - w2.x, (d[1] + 0.5) * T2 - w2.y) < 46) {
        if (b[0] === "w2_outfitter") return { label: "Enter Astral Outfitter", go: () => outfitter("hats") };
        if (b[0] === "w2_hall") return { label: "Enter Starfall Town Hall", go: () => showJournal("bells") };
        if (b[0] === "w2_depot") return { label: "Board the Sky-Ferry", go: showMap };
        if (b[0] === "w2_alchemy") return { label: "Enter Starfall Alchemy", go: () => openAlchemyUI({ s, w2, api, page, sayToast }) };
        if (b[0] === "w2_pavilion") return { label: "Enter Star-Wheel Pavilion", go: () => openStarWheelUI({ s, w2, api, page, sayToast }) };
        if (b[0] === "w2_museum") return { label: "Enter Starfall Museum", go: () => openMuseumUI({ s, w2, api, page, sayToast }) };
        if (b[0] === "w2_guild") return { label: "Enter Astral Guild Hall", go: () => openGuildUI({ s, w2, todayStr: today(), api, page, sayToast, addXp }) };
        if (b[0] === "w2_workshop") return { label: "Enter Starfall Workshop", go: () => openWorkshopUI({ s, w2, api, page, sayToast, addXp }) };
        if (b[0] === "w2_arena") return { label: "Enter Starlight Arena", go: () => openArenaUI({ s, w2, api, page, addXp }) };
        if (b[0] === "w2_observatory") return { label: "Enter Constellation Dome", go: () => openObservatoryUI({ s, w2, api, page, sayToast }) };
        if (b[0] === "w2_stable") return { label: "Enter Familiar Stable", go: () => openStableUI({ s, w2, api, page, sayToast }) };
        if (b[0] === "w2_villa") return { label: "Enter Starfall Villa (House)", go: () => openVillaUI({ s, w2, api, page, sayToast }) };
        if (b[0] === "w2_shrine") return { label: "Bell-Keeper Shrine (Daily Fortune)", go: () => openFortuneUI({ w2, todayStr: today(), api, page, sayToast }) };
        if (b[0] === "w2_bounty") return { label: "Frontier Bounty Board", go: () => openBountyBoardUI({ s, w2, api, page, addXp }) };
        if (b[0] === "w2_labyrinth") return { label: "Descend Starfall Labyrinth", go: () => openLabyrinthUI({ s, w2, api, page, closePage, addXp }) };
        if (b[0] === "w2_pier") return { label: "Coral Crown Pearl Dive", go: () => openPearlDiveUI({ w2, api, page, sayToast }) };
        if (b[0] === "w2_archive") return { label: "Play Moon-Glass Card Clash", go: () => openCardClashUI({ w2, api, page }) };
        if (b[0] === "w2_forge") return { label: "Enter Starlight Forge", go: forgeGame };
        if (b[0] === "w2_gears") return { label: "Enter Brass Gearworks", go: gearGame };
        if (b[0] === "w2_teahouse") return { label: "Enter Nine-Moons Teahouse", go: teaGame };
        return { label: `Inspect ${b[6]}`, go: () => sayToast(`${b[6]} — open to all travelers of World 2.`) };
      }
    }
    if (facingWater()) {
      const reg = w2RegionAt(Math.floor(w2.x / T2), Math.floor(w2.y / T2));
      return { label: "Cast fishing line", go: () => fishGame(reg) };
    }
    return null;
  }

  function act() { if (target) target.go(); }
  function digNow() {
    const now2 = performance.now();
    if (now2 < digAt || busy()) return;
    digAt = now2 + 400;
    digHereW2({ map, w2, todayStr: today(), api, burst, sayToast, hud, addXp });
  }

  const resize = () => {
    const r = host.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
    cw = r.width; ch = r.height;
    c.width = cw * dpr; c.height = ch * dpr;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    overlay.width = Math.max(1, Math.ceil(cw / 2));
    overlay.height = Math.max(1, Math.ceil(ch / 2));
    zoom = cw < 700 ? 1.05 : cw > 1500 ? 1.65 : 1.35;
  };
  const ro = new ResizeObserver(resize);
  ro.observe(host);
  resize();

  function drawMini() {
    const mw = miniC.width, mh = miniC.height;
    miniG.fillStyle = "#16243a";
    miniG.fillRect(0, 0, mw, mh);
    for (let y = 0; y < H2; y += 4) {
      for (let x = 0; x < W2; x += 4) {
        const v = map.g[y * W2 + x];
        miniG.fillStyle = W2_COLORS[v] || "#3484ba";
        miniG.fillRect((x / W2) * mw, (y / H2) * mh, 2, 2);
      }
    }
    for (const b of W2_BELLS) {
      miniG.fillStyle = w2.lit[b.id] ? "#ffd27a" : "#ff6a6a";
      miniG.fillRect((b.x / W2) * mw - 1.5, (b.y / H2) * mh - 1.5, 3, 3);
    }
    miniG.fillStyle = "#ffffff";
    miniG.beginPath();
    miniG.arc((w2.x / T2 / W2) * mw, (w2.y / T2 / H2) * mh, 3.2, 0, 7);
    miniG.fill();
  }
  drawMini();

  function update(dt, now) {
    let ax = 0, ay = 0;
    if (!busy()) {
      if (keys.has("a") || keys.has("ArrowLeft")) ax--;
      if (keys.has("d") || keys.has("ArrowRight")) ax++;
      if (keys.has("w") || keys.has("ArrowUp")) ay--;
      if (keys.has("s") || keys.has("ArrowDown")) ay++;
      if (joy && Math.hypot(joy.x, joy.y) > 0.18) { ax = joy.x; ay = joy.y; }
    }
    moving = !!(ax || ay);
    if (moving) {
      const m = Math.max(1, Math.hypot(ax, ay));
      const flyMul = w2.fly ? (w2.perms?.glider ? 2.6 : 2.1) : 1;
      const famMul = w2.familiar === "glacierf" ? 1.15 : 1;
      const conMul = w2.constellations?.fox9 ? 1.1 : 1;
      const charmMul = (w2.charms?.swift ? 1.25 : 1) * (1 + (w2.level - 1) * 0.015) * famMul * conMul;
      const v = (keys.has("Shift") ? 350 : 215) * (w2.ride && !w2.fly ? 1.65 : 1) * flyMul * charmMul * dt;
      const nx = w2.x + (ax / m) * v, ny = w2.y + (ay / m) * v;
      if (w2.fly) {
        if (nx > T2 && nx < (W2 - 1) * T2) w2.x = nx;
        if (ny > T2 && ny < (H2 - 1) * T2) w2.y = ny;
      } else if (w2.boat) {
        const canBoat = (px, py) => {
          const tx = Math.floor(px / T2), ty = Math.floor(py / T2);
          return tx > 0 && ty > 0 && tx < W2 - 1 && ty < H2 - 1 && (map.g[ty * W2 + tx] === TILE.water || !map.solid[ty * W2 + tx]);
        };
        if (canBoat(nx, w2.y)) w2.x = nx;
        if (canBoat(w2.x, ny)) w2.y = ny;
      } else {
        if (!blocked(nx, w2.y)) w2.x = nx;
        if (!blocked(w2.x, ny)) w2.y = ny;
      }
      dir = Math.abs(ax) > Math.abs(ay) ? (ax < 0 ? "left" : "right") : ay < 0 ? "up" : "down";
      step += dt * 13;
    }

    critters.update(dt, blocked);

    const reach = w2.charms?.magnet ? 54 : 28;
    const motePay = 5 + (w2.charms?.flame ? 2 : 0) + (w2.constellations?.bellc ? 2 : 0) + (w2.familiar === "phoenixf" ? 3 : 0);
    let gotMote = 0;
    for (const m of map.motes) {
      if (!w2.motes[m.id] && Math.abs((m.x + 0.5) * T2 - w2.x) < reach && Math.abs((m.y + 0.5) * T2 - w2.y) < reach) {
        w2.motes[m.id] = 1;
        api.addMon(motePay);
        gotMote++;
        burst((m.x + 0.5) * T2, (m.y + 0.5) * T2, 10);
      }
    }
    if (gotMote) { addXp(gotMote * 5); api.ping("blip"); api.save(); hud(); }

    for (const rl of map.relics) {
      if (!w2.relics[rl.id] && Math.abs((rl.x + 0.5) * T2 - w2.x) < reach && Math.abs((rl.y + 0.5) * T2 - w2.y) < reach) {
        w2.relics[rl.id] = 1;
        const item = W2_RELICS[rl.id % W2_RELICS.length];
        w2.bag[item[0]] = (w2.bag[item[0]] || 0) + 1;
        addXp(12);
        api.ping("done");
        burst((rl.x + 0.5) * T2, (rl.y + 0.5) * T2, 14);
        sayToast(`Found ${item[1]}! (Check Bag [B])`);
        api.save();
      }
    }

    const tx = w2.x - 28 + Math.cos(now / 700) * 10, ty = w2.y - 18 + Math.sin(now / 600) * 8;
    wispX += (tx - wispX) * Math.min(1, dt * 6);
    wispY += (ty - wispY) * Math.min(1, dt * 6);

    const rk = w2RegionAt(Math.floor(w2.x / T2), Math.floor(w2.y / T2));
    if (rk !== region) {
      region = rk;
      if (!w2.visited[rk]) { w2.visited[rk] = 1; addXp(20); api.save(); }
      bannerEl.textContent = W2_REGIONS[rk]?.[0] || rk;
      bannerEl.hidden = false;
      bannerT = now + 2600;
    }
    if (bannerT && now > bannerT) { bannerEl.hidden = true; bannerT = 0; }
    if (toastT && now > toastT) { toastEl.hidden = true; toastT = 0; }

    if (!busy()) {
      const nt = findTarget();
      if (nt?.label !== target?.label) {
        promptEl.hidden = !nt;
        if (nt) promptEl.innerHTML = `<kbd>E</kbd> ${esc(nt.label)}`;
      }
      target = nt;
    } else { promptEl.hidden = true; target = null; }

    for (const sp of sparks) { sp.x += sp.vx * dt; sp.y += sp.vy * dt; sp.vy += 110 * dt; sp.life -= dt * 1.1; }
    sparks = sparks.filter((p) => p.life > 0);
    if (fireworks > 0) { fireworks -= dt; if (Math.random() < dt * 3) burst(w2.x + (Math.random() - 0.5) * 400, w2.y - 120, 32); }

    const wKind = ["glacier", "citadel", "aurora", "frostarch", "cometpeak"].includes(rk) ? "snow"
      : ["orchard", "lotus", "sakuraend"].includes(rk) ? "petal"
      : ["ember", "caldera2", "magmacore"].includes(rk) ? "ember" : "";
    if (wKind && weather.length < 70) {
      weather.push({ x: Math.random() * cw, y: -10, s: wKind === "snow" ? 45 + Math.random() * 40 : 60 + Math.random() * 50, k: wKind, p: Math.random() * 6 });
    }
    for (const w of weather) { w.y += w.s * dt; w.x += Math.sin(now / 600 + w.p) * 0.7; }
    weather = weather.filter((w) => w.y < ch + 10);

    if ((miniT += dt) > 0.35) { miniT = 0; drawMini(); }
    if ((saveT += dt) > 6) { saveT = 0; api.save(); }
  }

  function frame(now) {
    if (!alive) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    update(dt, now);

    const vw = cw / zoom, vh = ch / zoom;
    camX = Math.max(0, Math.min(W2 * T2 - vw, w2.x - vw / 2));
    camY = Math.max(0, Math.min(H2 * T2 - vh, w2.y - vh / 2));

    g.save();
    g.fillStyle = "#3484ba";
    g.fillRect(0, 0, cw, ch);
    g.scale(zoom, zoom);
    g.translate(-Math.round(camX), -Math.round(camY));
    g.imageSmoothingEnabled = false;

    const x0 = Math.max(0, Math.floor(camX / T2)), x1 = Math.min(W2 - 1, Math.ceil((camX + vw) / T2));
    const y0 = Math.max(0, Math.floor(camY / T2)), y1 = Math.min(H2 - 1, Math.ceil((camY + vh) / T2));
    const wave = Math.floor(now / 620) % 2;
    const things = [];
    const dark = darkness(), night = dark > 0.25;

    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const v = map.g[y * W2 + x];
        if (v === TILE.water) g.drawImage((x + y) % 3 ? tiles[v][(x * 7 + y) % 3] : tiles.wave[wave], x * T2, y * T2);
        else {
          const base = v === TILE.tree ? TILE.meadow : v === TILE.pine ? TILE.snow : v === TILE.mesa ? TILE.canyon : v;
          g.drawImage(tiles[base][(x * 7 + y * 13) % 3], x * T2, y * T2);
          if (v === TILE.lava) {
            const q = (Math.sin(now / 520 + x * 1.3 + y * 0.9) + 1) / 2;
            g.fillStyle = `rgba(255,214,90,${0.12 + q * 0.38})`;
            g.beginPath();
            g.ellipse((x + 0.5) * T2, (y + 0.5) * T2, 9 + q * 4, 4 + q * 2, 0, 0, 7);
            g.fill();
          }
        }
      }
    }

    g.imageSmoothingEnabled = true;
    if (792 * T2 < camX + vw && 798 * T2 > camX && 601 * T2 < camY + vh && 603 * T2 > camY) garden.drawGround(g);

    for (let y = Math.max(0, y0 - 1); y <= Math.min(H2 - 1, y1 + 3); y++) {
      for (let x = x0; x <= x1; x++) {
        const v = map.g[y * W2 + x];
        if (v === TILE.tree || v === TILE.pine) {
          const px = (x + 0.5) * T2, py = (y + 0.5) * T2;
          things.push([py + 13, () => drawTree(g, px, py, v === TILE.pine, Math.sin(now / 900 + x + y) * 1.1)]);
        } else if (v === TILE.mesa) {
          const reg = w2RegionAt(x, y);
          things.push([(y + 1) * T2, () => drawW2Mesa(g, x, y, ["citadel", "crystal2", "skylands", "crown", "stargrave", "elysium"].includes(reg))]);
        }
      }
    }

    for (const b of W2_BUILDINGS) {
      if (b[1] * T2 < camX + vw + 40 && (b[1] + b[3]) * T2 > camX - 40 && (b[2] - 2) * T2 < camY + vh && (b[2] + b[4]) * T2 > camY) {
        things.push([(b[2] + b[4]) * T2 - 1, () => drawBuilding(g, b, night, now)]);
      }
    }

    for (const a of bells) {
      if (Math.abs(a.x - w2.x) < vw && Math.abs(a.y - w2.y) < vh) {
        things.push([a.y + 16, () => drawLantern(g, a.x, a.y, !!w2.lit[a.b.id], now)]);
      }
    }

    if (Math.abs(returnGate.x - w2.x) < vw && Math.abs(returnGate.y - w2.y) < vh) {
      things.push([returnGate.y + 14, () => {
        const px = returnGate.x, py = returnGate.y;
        g.fillStyle = "rgba(127,208,255,0.28)";
        g.beginPath(); g.ellipse(px, py, 24, 10, 0, 0, 7); g.fill();
        g.strokeStyle = "#ffd84d"; g.lineWidth = 3;
        g.beginPath(); g.arc(px, py - 22, 18, 0, 7); g.stroke();
        g.fillStyle = "rgba(110,80,220,0.45)";
        g.beginPath(); g.arc(px, py - 22, 14, 0, 7); g.fill();
        g.font = "800 10px system-ui"; g.textAlign = "center";
        g.fillStyle = "#fff4d6"; g.fillText("World 1 Gate", px, py - 46);
      }]);
    }

    for (const m of map.motes) {
      if (!w2.motes[m.id]) {
        const px = (m.x + 0.5) * T2, py = (m.y + 0.5) * T2;
        if (px > camX - 20 && px < camX + vw + 20 && py > camY - 20 && py < camY + vh + 20) {
          things.push([py, () => {
            const b = Math.sin(now / 340 + m.id) * 3;
            g.fillStyle = "rgba(255,216,110,0.28)";
            g.beginPath(); g.arc(px, py + b, 11, 0, 7); g.fill();
            g.fillStyle = "#ffd84d";
            g.beginPath(); g.arc(px, py + b, 5, 0, 7); g.fill();
            g.fillStyle = "#fff";
            g.beginPath(); g.arc(px - 1, py - 1 + b, 2, 0, 7); g.fill();
          }]);
        }
      }
    }

    for (const rl of map.relics) {
      if (!w2.relics[rl.id]) {
        const px = (rl.x + 0.5) * T2, py = (rl.y + 0.5) * T2;
        if (px > camX - 20 && px < camX + vw + 20 && py > camY - 20 && py < camY + vh + 20) {
          things.push([py, () => {
            const b = Math.sin(now / 420 + rl.id) * 2;
            g.fillStyle = "#ff8fd0";
            g.beginPath(); g.moveTo(px, py - 8 + b); g.lineTo(px + 6, py + b); g.lineTo(px, py + 8 + b); g.lineTo(px - 6, py + b); g.closePath(); g.fill();
          }]);
        }
      }
    }

    critters.draw(g, things, w2.x, w2.y, vw, vh, now);

    for (const p of people) {
      if (Math.abs(p.x - w2.x) < vw && Math.abs(p.y - w2.y) < vh) {
        things.push([p.y + 13, () => {
          const b = Math.sin(now / 620 + p.tw) * 1.2;
          const bell = W2_BELLS.find((q) => q.who === p.id && !w2.lit[q.id]);
          const hasMail = w2.mail >= 0 && W2_MAIL[w2.mail]?.[0] === p.id;
          g.fillStyle = "rgba(0,0,0,0.25)";
          g.beginPath(); g.ellipse(p.x, p.y + 14, 14, 5, 0, 0, 7); g.fill();
          if (p.img.complete && p.img.naturalWidth) g.drawImage(p.img, p.x - 25, p.y - 54 + b, 50, 70);
          if (bell || hasMail) {
            g.fillStyle = "#ffd27a"; g.strokeStyle = "#1b1d33"; g.lineWidth = 2;
            g.beginPath(); g.arc(p.x, p.y - 64 + b, 9, 0, 7); g.fill(); g.stroke();
            g.fillStyle = "#1b1d33"; g.font = "900 13px system-ui"; g.textAlign = "center";
            g.fillText(bell && w2.took[bell.id] ? "?" : "!", p.x, p.y - 59 + b);
          }
        }]);
      }
    }

    if (bellCount() >= 3 || w2.charms?.magnet || w2.familiar) {
      const famCol = W2_FAMILIARS.find((f) => f.id === w2.familiar)?.col || "#9fe8ff";
      things.push([wispY + 12, () => {
        g.fillStyle = famCol + "55";
        g.beginPath(); g.arc(wispX, wispY, 10, 0, 7); g.fill();
        g.fillStyle = famCol;
        g.beginPath(); g.arc(wispX, wispY, 5, 0, 7); g.fill();
      }]);
    }

    if (w2.fly) {
      things.push([w2.y + 13.5, () => {
        g.fillStyle = "rgba(0,0,0,0.3)";
        g.beginPath(); g.ellipse(w2.x, w2.y + 16, 16, 6, 0, 0, 7); g.fill();
        g.fillStyle = "#7fd0ff";
        g.beginPath(); g.moveTo(w2.x - 26, w2.y - 16); g.lineTo(w2.x, w2.y - 26); g.lineTo(w2.x + 26, w2.y - 16); g.lineTo(w2.x, w2.y - 10); g.closePath(); g.fill();
      }]);
    } else if (w2.boat) {
      things.push([w2.y + 13.5, () => {
        g.fillStyle = "#7a4a24";
        g.beginPath(); g.moveTo(w2.x - 22, w2.y + 4); g.lineTo(w2.x + 22, w2.y + 4); g.lineTo(w2.x + 14, w2.y + 15); g.lineTo(w2.x - 14, w2.y + 15); g.closePath(); g.fill();
        g.strokeStyle = "#ffd84d"; g.lineWidth = 1.5; g.stroke();
      }]);
    } else if (w2.ride) {
      things.push([w2.y + 13.5, () => {
        g.fillStyle = "#8a4a2c"; g.fillRect(w2.x - 19, w2.y + 5, 38, 9);
        g.strokeStyle = "#1b1d33"; g.lineWidth = 2; g.strokeRect(w2.x - 19, w2.y + 5, 38, 9);
      }]);
    }
    things.push([w2.y + 14 + (w2.fly ? 120 : 0), () => api.drawFox(g, w2.x, w2.y - (w2.fly ? 14 : 0), dir, step, api.fur, api.tails, s.hat, now, moving)]);

    things.sort((a, b) => a[0] - b[0]);
    for (const [, fn] of things) fn();

    for (const sp of sparks) {
      g.globalAlpha = Math.max(0, sp.life);
      g.fillStyle = sp.c;
      g.beginPath(); g.arc(sp.x, sp.y, 3, 0, 7); g.fill();
    }
    g.globalAlpha = 1;
    g.restore();

    if (dark > 0.01 && overlay.width && overlay.height) {
      const k = zoom / 2, lr = w2.charms?.flame ? 1.45 : 1;
      const lightAt = (x, y, rad, a = 1) => {
        const X = (x - camX) * k, Y = (y - camY) * k, R = rad * k;
        const q = og.createRadialGradient(X, Y, R * 0.1, X, Y, R);
        q.addColorStop(0, `rgba(0,0,0,${a})`);
        q.addColorStop(1, "rgba(0,0,0,0)");
        og.fillStyle = q;
        og.fillRect(X - R, Y - R, R * 2, R * 2);
      };
      og.globalCompositeOperation = "source-over";
      og.clearRect(0, 0, overlay.width, overlay.height);
      og.fillStyle = `rgba(12,14,52,${dark})`;
      og.fillRect(0, 0, overlay.width, overlay.height);
      og.globalCompositeOperation = "destination-out";
      lightAt(w2.x, w2.y - 6, 170 * lr, 0.92);
      for (const a of bells) if (w2.lit[a.b.id] && Math.abs(a.x - w2.x) < vw) lightAt(a.x, a.y - 18, 220 * lr);
      g.imageSmoothingEnabled = true;
      g.drawImage(overlay, 0, 0, cw, ch);
    }

    for (const w of weather) {
      g.fillStyle = w.k === "snow" ? "rgba(255,255,255,0.8)" : w.k === "petal" ? "rgba(255,180,210,0.85)" : "rgba(255,140,60,0.8)";
      g.beginPath(); g.arc(w.x, w.y, w.k === "snow" ? 2.5 : 3, 0, 7); g.fill();
    }

    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  hud();

  host.querySelectorAll("[data-h]").forEach((b) => (b.onclick = () => {
    const h = b.dataset.h;
    if (h === "leave") api.leave();
    else if (h === "map") showMap();
    else if (h === "journal") showJournal("bells");
    else if (h === "bag") showBag();
    else if (h === "dig") digNow();
    else if (h === "ride") { w2.ride = !w2.ride; api.save(); sayToast(w2.ride ? "Cart out." : "Cart put away."); }
    else if (h === "fly") {
      if (bellCount() < 5 && !w2.fly) return sayToast("Light 5 Star-Bells to unlock the Sky-Glider!");
      w2.fly = !w2.fly;
      if (w2.fly) w2.boat = false;
      if (!w2.fly && blocked(w2.x, w2.y)) { w2.x = (W2_SPAWN[0] + 0.5) * T2; w2.y = (W2_SPAWN[1] + 0.5) * T2; sayToast("Landed at Starfall Crossing."); }
      else sayToast(w2.fly ? "Sky-Glider deployed!" : "Landed.");
      api.save();
    } else if (h === "boat") {
      w2.boat = !w2.boat;
      if (w2.boat) w2.fly = false;
      if (!w2.boat && blocked(w2.x, w2.y)) { w2.x = (W2_SPAWN[0] + 0.5) * T2; w2.y = (W2_SPAWN[1] + 0.5) * T2; }
      sayToast(w2.boat ? "Star-Skiff launched! (Sail over water)" : "Star-Skiff docked.");
      api.save();
    }
    else if (h === "time") {
      const modes = ["auto", "day", "dusk", "night"];
      w2.time = modes[(modes.indexOf(w2.time) + 1) % modes.length];
      api.save();
      hud();
    }
  }));
  promptEl.onclick = act;
  host.querySelector("#w2-act").onclick = act;

  const pad = host.querySelector("#w2-pad"), knob = pad.querySelector("i");
  pad.onpointerdown = (e) => {
    e.preventDefault();
    pad.setPointerCapture(e.pointerId);
    const mv = (ev) => {
      const r = pad.getBoundingClientRect(), dx = ev.clientX - (r.left + r.width / 2), dy = ev.clientY - (r.top + r.height / 2);
      const d = Math.hypot(dx, dy), max = r.width * 0.38, k = d > max ? max / d : 1;
      joy = { x: (dx * k) / max, y: (dy * k) / max };
      knob.style.transform = `translate(${dx * k}px,${dy * k}px)`;
    };
    const up = () => { joy = null; knob.style.transform = ""; pad.onpointermove = null; pad.onpointerup = null; pad.onpointercancel = null; };
    pad.onpointermove = mv;
    pad.onpointerup = up;
    pad.onpointercancel = up;
    mv(e);
  };

  const onKey = (e) => {
    if (!host.isConnected || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (k === "Tab") return;
    e.stopPropagation();
    if (k === "Escape") {
      e.preventDefault();
      if (!pageEl.hidden) closePage();
      else if (!talkEl.hidden) closeTalk();
      else api.leave();
      return;
    }
    if (fishing && (k === "e" || k === " " || k === "Enter")) { e.preventDefault(); if (!e.repeat) fishing.hit(); return; }
    if (!talkEl.hidden) {
      if (/^[1-9]$/.test(k)) { e.preventDefault(); talkEl.querySelectorAll("[data-o]")[+k - 1]?.click(); }
      else if (k === "e") { e.preventDefault(); if (!e.repeat) talkEl.querySelector("[data-o]")?.click(); }
      return;
    }
    if (!pageEl.hidden) {
      if (k === "m" || k === "j" || k === "b") { e.preventDefault(); closePage(); }
      return;
    }
    if (["w", "a", "s", "d", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Shift"].includes(k)) { e.preventDefault(); keys.add(k); return; }
    if (k === "e" || k === " " || k === "Enter") { e.preventDefault(); if (!e.repeat) act(); }
    else if (k === "m") showMap();
    else if (k === "j") showJournal("bells");
    else if (k === "b") showBag();
    else if (k === "g") { e.preventDefault(); if (!e.repeat) digNow(); }
    else if (k === "r") { w2.ride = !w2.ride; api.save(); sayToast(w2.ride ? "Cart out." : "Cart put away."); }
    else if (k === "v") {
      if (bellCount() < 5 && !w2.fly) return sayToast("Light 5 Star-Bells to unlock the Sky-Glider!");
      w2.fly = !w2.fly;
      if (w2.fly) w2.boat = false;
      if (!w2.fly && blocked(w2.x, w2.y)) { w2.x = (W2_SPAWN[0] + 0.5) * T2; w2.y = (W2_SPAWN[1] + 0.5) * T2; sayToast("Landed at Starfall Crossing."); }
      else sayToast(w2.fly ? "Sky-Glider deployed!" : "Landed.");
      api.save();
    } else if (k === "u") {
      w2.boat = !w2.boat;
      if (w2.boat) w2.fly = false;
      if (!w2.boat && blocked(w2.x, w2.y)) { w2.x = (W2_SPAWN[0] + 0.5) * T2; w2.y = (W2_SPAWN[1] + 0.5) * T2; }
      sayToast(w2.boat ? "Star-Skiff launched!" : "Star-Skiff docked.");
      api.save();
    }
  };
  const onUp = (e) => keys.delete(e.key.length === 1 ? e.key.toLowerCase() : e.key);
  const onBlur = () => keys.clear();
  document.addEventListener("keydown", onKey, true);
  document.addEventListener("keyup", onUp, true);
  addEventListener("blur", onBlur);

  host.tabIndex = 0;
  host.focus({ preventScroll: true });

  return () => {
    alive = false;
    cancelAnimationFrame(raf);
    ro.disconnect();
    pageOff?.();
    document.removeEventListener("keydown", onKey, true);
    document.removeEventListener("keyup", onUp, true);
    removeEventListener("blur", onBlur);
  };
}
