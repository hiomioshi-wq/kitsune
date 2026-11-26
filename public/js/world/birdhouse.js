// Explorable Dawn Aviary Bird House: a glass-domed bird shop with 4 live habitat flights, woven Nest Pods,
// free-flying hatched birds, a seed scoop, the behaviour theatre, the 48-bird codex and the Dawn Chorus.
import { esc, today } from "../util.js";
import { species } from "../xmas/data.js";
import { petSvg, petUrl } from "../xmas/art.js";
import { xs, loadXmas, save as saveXmas } from "../xmas/core.js";
import {
  BIRD_HABITATS,
  BIRD_TIERS,
  BIRD_LIST,
  BIRD_IDS,
  BIRD_BEHAVIOURS,
  BIRD_SHOWCASE,
  DAILY_NEST_CAP,
  NEST_PRICE,
  ensureDawnAviary,
} from "../xmas/birddata.js";
import { buyNest, podMessage, oddsTiles, cardGrid, birdCard, bindSignatures, FILTERS, filterBirds, mountChorus } from "../xmas/birds.js";

const BAY_BIRDS = {
  song: ["cardinal", "goldfinch", "bluetit"],
  raptor: ["barnowl", "harpyeagle", "amberkestrel"],
  water: ["flamingo", "kingfisher", "mandarinduck"],
  tropic: ["scarletmacaw", "cockatoo", "peacock"],
};
const AMBASSADORS = ["cockatoo", "africangrey", "mallard", "bluetit", "peacock", "kookaburra", "sparrow", "toucan"];
const SEED_MON = 15;
const BAYS = [
  ["song", 54, 72],
  ["raptor", 536, 72],
  ["water", 54, 286],
  ["tropic", 536, 286],
];

export function enterBirdHouse(o) {
  const { root, s, drawFox, fur, tailsN, toast, ping, save, hud, onLeave } = o;

  const box = document.createElement("div");
  box.className = "rm rm-explore";
  box.tabIndex = -1;
  box.innerHTML = `
    <div style="position:relative;width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;background:radial-gradient(circle at top,#3a3260,#141026);padding:12px;box-sizing:border-box;overflow:hidden">
      <div style="display:flex;justify-content:space-between;align-items:center;width:100%;max-width:820px;margin-bottom:8px;color:#fff;gap:8px;flex-wrap:wrap">
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
          <strong style="font-size:15px">🐦 Dawn Aviary Bird House</strong>
          <span class="pill" id="bd-count" style="background:rgba(255,200,90,.16);border-color:rgba(255,200,90,.5);color:#ffe2a8">0/${BIRD_IDS.length} Birds</span>
          <span class="pill" id="bd-mon">0 mon</span>
          <span class="pill" id="bd-bells">0 Bells</span>
        </div>
        <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">
          <button type="button" class="btn btn-sm btn-accent" id="bd-theatre-btn">🎭 Behaviours</button>
          <button type="button" class="btn btn-sm" id="bd-codex-btn">Odds &amp; ${BIRD_IDS.length} Codex</button>
          <button type="button" class="btn btn-sm" id="bd-out">Exit (Esc)</button>
        </div>
      </div>
      <div style="position:relative;width:100%;max-width:820px;aspect-ratio:760/460">
        <canvas id="bd-cv" width="760" height="460" aria-label="Inside the Bird House" style="width:100%;height:100%;border-radius:14px;border:2px solid #f2c652;box-shadow:0 18px 46px rgba(0,0,0,.55);background:#f4e6cf;cursor:pointer;display:block;touch-action:none"></canvas>
        <div id="bd-modal" role="dialog" hidden style="position:absolute;inset:10px;border-radius:12px;background:rgba(22,18,38,.97);border:2px solid #f2c652;padding:14px;overflow:auto;color:#fff;z-index:4;box-shadow:0 16px 40px rgba(0,0,0,.7)"></div>
      </div>
      <div id="bd-prompt" style="margin-top:8px;min-height:36px;display:flex;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap;color:#fff"></div>
    </div>`;
  root.appendChild(box);

  const $ = (sel) => box.querySelector(sel);
  const cv = $("#bd-cv"), g = cv.getContext("2d"), promptEl = $("#bd-prompt"), modalEl = $("#bd-modal");

  let px = 380, py = 386, dir = "up", step = 0, alive = true, raf = 0, last = performance.now();
  let walkTarget = null, gameCleanup = null, seeds = null;
  const keys = new Set(), sparks = [], hearts = [], imgCache = new Map();
  let roamers = [];

  const sprite = (id, act = "", mood = "happy") => {
    const key = `${id}:${act}:${mood}`;
    if (!imgCache.has(key)) {
      const im = new Image();
      im.src = petUrl(id, 1, mood, act);
      imgCache.set(key, im);
    }
    return imgCache.get(key);
  };
  Object.values(BAY_BIRDS).flat().forEach((id) => { sprite(id); if (BIRD_BEHAVIOURS[id]) sprite(id, "signature"); });

  const owned = () => BIRD_IDS.filter((id) => !!xs()?.pets?.[id]);

  function refreshHeader() {
    $("#bd-count").textContent = `${owned().length}/${BIRD_IDS.length} Birds`;
    $("#bd-mon").textContent = `${Number(s.mon || 0).toLocaleString()} mon`;
    $("#bd-bells").textContent = `${Number(xs()?.bells || 0).toLocaleString()} Bells`;
  }

  const clampX = (x) => Math.max(238, Math.min(522, x));
  const clampY = (y) => Math.max(140, Math.min(384, y));
  const randomSpot = () => {
    for (let i = 0; i < 20; i++) {
      const x = 238 + Math.random() * 284, y = 140 + Math.random() * 244;
      if (!isSolidPt(x, y)) return { x, y };
    }
    return { x: 270, y: 360 };
  };

  function rebuildRoamers() {
    // Your own birds first (newest favourites with behaviours leading), topped up with house ambassadors.
    const mine = owned();
    const active = xs()?.active;
    const pool = [...(mine.includes(active) ? [active] : []), ...mine.filter((id) => BIRD_BEHAVIOURS[id]), ...mine, ...AMBASSADORS];
    roamers = [...new Set(pool)].slice(0, 8).map((id, i) => {
      const at = randomSpot();
      sprite(id);
      if (BIRD_BEHAVIOURS[id]) sprite(id, "signature");
      return { id, owned: mine.includes(id), x: at.x, y: at.y, to: null, flying: 0, flyFrom: null, wait: 0.5 + i * 0.35, facing: i % 2 ? 1 : -1, act: "", actTimer: 0, bubble: "", idle: 4 + Math.random() * 9 };
    });
  }

  // Solid interior furniture [x0, y0, x1, y1]
  const OBSTACLES = [
    [54, 72, 224, 152],
    [536, 72, 706, 152],
    [54, 286, 224, 366],
    [536, 286, 706, 366],
    [338, 200, 422, 258], // Nest Pod rotunda
    [322, 68, 438, 108], // Keeper counter
  ];
  function isSolidPt(x, y) {
    if (x < 40 || x > 720 || y < 104 || y > 432) return true;
    return OBSTACLES.some(([x0, y0, x1, y1]) => x > x0 - 10 && x < x1 + 10 && y > y0 - 8 && y < y1 + 8);
  }

  function addBurst(x, y, col, n = 30) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = 45 + Math.random() * 110;
      sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1, col });
    }
  }

  function closeModal() {
    gameCleanup?.();
    gameCleanup = null;
    modalEl.hidden = true;
    modalEl.innerHTML = "";
    box.focus({ preventScroll: true });
  }
  const head = (title, sub = "") => `<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:8px"><div><h2 style="margin:0">${title}</h2>${sub ? `<small class="muted">${sub}</small>` : ""}</div><button type="button" class="btn btn-sm" data-close>Close</button></div>`;
  function openModal(html, bind) {
    gameCleanup?.();
    gameCleanup = null;
    keys.clear();
    walkTarget = null;
    modalEl.hidden = false;
    modalEl.innerHTML = html;
    modalEl.scrollTop = 0;
    modalEl.querySelector("[data-close]")?.addEventListener("click", closeModal);
    bind?.(modalEl);
  }

  const wallet = { mon: () => s.mon || 0, spendMon: (n) => { s.mon -= n; save(); } };
  const nestsLeft = () => Math.max(0, DAILY_NEST_CAP - (xs() ? ensureDawnAviary(xs()).adopts : DAILY_NEST_CAP));
  const canMon = () => nestsLeft() > 0 && (s.mon || 0) >= NEST_PRICE.mon;
  const canBell = () => nestsLeft() > 0 && (xs()?.bells || 0) >= NEST_PRICE.bells;

  async function openPod(currency) {
    await loadXmas().catch(() => {});
    if (!alive) return;
    const res = buyNest(currency, wallet);
    if (res.error) return toast(res.error);
    saveXmas();
    addBurst(380, 224, BIRD_TIERS[res.tier].color, res.tier === "chase" ? 90 : 42);
    ping?.("done");
    if (res.note) toast(res.note.trim());
    refreshHeader();
    rebuildRoamers();
    hud?.();
    showHatch(res);
  }

  function podButtons() {
    return `<button type="button" class="btn btn-accent" data-buy="mon" ${canMon() ? "" : "disabled"}>Open Nest Pod · ${NEST_PRICE.mon} mon</button>
      <button type="button" class="btn btn-accent" data-buy="bell" ${canBell() ? "" : "disabled"}>Open Nest Pod · ${NEST_PRICE.bells} Snowbells</button>
      <button type="button" class="btn" data-codex>Full odds &amp; codex</button>`;
  }
  function bindPods(el) {
    el.querySelectorAll("[data-buy]").forEach((b) => (b.onclick = () => { b.disabled = true; openPod(b.dataset.buy); }));
    el.querySelector("[data-codex]").onclick = () => showCodex();
  }

  function showPods() {
    if (!xs()) return toast("The Nest Pods are still warming. Try again in a moment.");
    openModal(`${head("🪺 Woven Nest Pods")}
      <p class="muted" style="margin-top:0">Each pod welcomes one of <strong>${BIRD_IDS.length} birds</strong> into your collection (${nestsLeft()}/${DAILY_NEST_CAP} pods left today).</p>
      ${oddsTiles()}
      <div style="display:flex;gap:10px;flex-wrap:wrap">${podButtons()}</div>`, bindPods);
  }

  function showHatch(res) {
    const t = BIRD_TIERS[res.tier], m = res.meta;
    openModal(`${head(esc(res.sp[1]), `<i>${esc(m.sci)}</i> · ${esc(m.habit)}`)}
      <div style="display:flex;gap:18px;align-items:center;flex-wrap:wrap;margin:12px 0">
        <div style="width:150px;height:150px;flex:0 0 150px;background:radial-gradient(circle,${t.color}55,transparent 70%);border-radius:16px;display:grid;place-items:center">${petSvg(res.id, 2, "love", { size: 140, act: BIRD_BEHAVIOURS[res.id] ? "signature" : "" })}</div>
        <div style="flex:1;min-width:220px">
          <span class="pill" style="color:${t.color};border-color:${t.color}">${esc(t.label)} · ${esc(m.chance)}</span>
          <p style="margin:8px 0">${esc(res.sp[8])}</p>
          <p style="margin:0;font-weight:700;color:${res.dupe ? "#ffd84d" : "#8cff98"}">${res.dupe ? "Already in your aviary → +60 XP &amp; 100% Joy!" : "New bird! Added to your aviary and Winterfest Pets."}</p>
          <small class="muted">${nestsLeft()}/${DAILY_NEST_CAP} pods left today</small>
        </div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">${podButtons()}</div>`, bindPods);
  }

  function showHabitat(zone) {
    const hab = BIRD_HABITATS[zone], list = BIRD_LIST.filter((r) => r.zone === zone), x = xs();
    const got = list.filter((r) => !!x?.pets?.[r.id]).length;
    openModal(`${head(`${hab.badge} ${esc(hab.name)} (${got}/${list.length})`, esc(hab.desc))}${cardGrid(list, x)}`, (el) => bindSignatures(el, x, ping));
  }

  function showCodex(filter = "all") {
    const x = xs();
    openModal(`${head(`📋 Rarity Board &amp; Field Codex (${owned().length}/${BIRD_IDS.length})`, Object.values(BIRD_TIERS).map((t) => `${t.label} ${t.totalPct} (${t.count})`).join(" · "))}
      <div class="chips" style="margin-bottom:10px">${FILTERS(filter)}</div>${cardGrid(filterBirds(filter), x)}`, (el) => {
      bindSignatures(el, x, ping);
      el.querySelectorAll("[data-bf]").forEach((b) => (b.onclick = () => showCodex(b.dataset.bf)));
    });
  }

  function showTheatre() {
    const x = xs();
    openModal(`${head(`🎭 Signature Behaviour Theatre (${BIRD_SHOWCASE.length} stars)`, "Press a button to watch the real habit each bird is famous for.")}
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:10px">${BIRD_SHOWCASE.map((id) => {
        const sig = BIRD_BEHAVIOURS[id], r = BIRD_LIST.find((q) => q.id === id);
        return `<div>${birdCard(r, x)}<small class="muted" style="display:block;padding:4px 6px"><strong style="color:#ffd84d">${esc(sig.tag)}:</strong> ${esc(sig.desc)}</small></div>`;
      }).join("")}</div>`, (el) => bindSignatures(el, x, ping));
  }

  function showChorus() {
    openModal(`${head("🎶 Dawn Chorus Stage", "Echo the birds' song back, one longer verse each time. Tap a perch or press 1–4.")}<div data-stage></div>`, (el) => {
      gameCleanup = mountChorus(el.querySelector("[data-stage]"), {
        ping,
        worldMon: true,
        addMon: (n) => { s.mon += n; save(); },
        hud: () => { refreshHeader(); rebuildRoamers(); hud?.(); },
        onDone: (m) => { toast(m); closeModal(); },
      });
    });
  }

  function scatterSeed() {
    const x = xs();
    if (!x) return toast("The seed bin is still being filled. Try again in a moment.");
    const a = ensureDawnAviary(x);
    seeds = { x: px, y: Math.min(400, py + 4), life: 6, bits: Array.from({ length: 26 }, () => [(Math.random() - 0.5) * 54, (Math.random() - 0.5) * 24]) };
    roamers.forEach((b, i) => { b.to = { x: clampX(seeds.x + Math.cos(i * 0.8) * 42), y: clampY(seeds.y + Math.sin(i * 0.8) * 24) }; b.wait = 0; });
    ping?.("choice");
    if (a.seedDay === today()) return toast("The flock hops over for another helping. (Today's keeper tip is already paid.)");
    a.seedDay = today();
    s.mon += SEED_MON;
    let fed = 0;
    for (const id of owned()) {
      x.pets[id].joy = Math.min(100, (x.pets[id].joy || 0) + 8);
      x.pets[id].hunger = Math.min(100, (x.pets[id].hunger || 0) + 8);
      fed++;
    }
    save();
    saveXmas();
    refreshHeader();
    hud?.();
    toast(`The keeper tips you +${SEED_MON} mon for the morning feed${fed ? ` and ${fed} of your birds feel fuller` : ""}.`);
  }

  function perform(b) {
    const sig = BIRD_BEHAVIOURS[b.id];
    if (!sig) return false;
    b.act = "signature";
    b.actTimer = 4;
    b.to = null;
    b.wait = 4;
    b.bubble = `✨ ${sig.tag}!`;
    return true;
  }

  function greet(b) {
    const sp = species(b.id), x = xs();
    hearts.push({ x: b.x, y: b.y - 24, vy: -32, life: 1 });
    ping?.("blip");
    const did = perform(b);
    if (!did) { b.bubble = "♪ chirp!"; b.actTimer = 1.6; b.wait = 1.6; }
    if (b.owned && x?.pets?.[b.id]) {
      const pet = x.pets[b.id], now = Date.now();
      if (now - (pet.patAt || 0) >= 1500) { pet.patAt = now; pet.joy = Math.min(100, (pet.joy || 0) + 4); pet.xp = (pet.xp || 0) + 2; saveXmas(); }
      if (!did) toast(`${pet.name} puffs up happily.`);
    } else if (!did) toast(`${sp[1]} tilts its head hello.`);
  }

  const leave = () => {
    if (!alive) return;
    alive = false;
    gameCleanup?.();
    cancelAnimationFrame(raf);
    window.removeEventListener("keydown", onKey, true);
    window.removeEventListener("keyup", onUp, true);
    box.remove();
    onLeave?.();
  };

  $("#bd-out").onclick = leave;
  $("#bd-codex-btn").onclick = () => showCodex();
  $("#bd-theatre-btn").onclick = showTheatre;

  cv.addEventListener("pointerdown", (e) => {
    if (!modalEl.hidden) return;
    const r = cv.getBoundingClientRect();
    walkTarget = { x: Math.max(46, Math.min(714, ((e.clientX - r.left) / r.width) * 760)), y: Math.max(112, Math.min(426, ((e.clientY - r.top) / r.height) * 460)) };
  });

  const STATIONS = [
    { x: 380, y: 230, r: 80, label: `Open a Nest Pod (${BIRD_IDS.length} birds)`, go: showPods },
    { x: 140, y: 158, r: 62, label: "Visit the Hedgerow Song Hall", go: () => showHabitat("song") },
    { x: 620, y: 158, r: 62, label: "Visit the High Raptor Loft", go: () => showHabitat("raptor") },
    { x: 140, y: 280, r: 62, label: "Visit the Reed & Shore Pool", go: () => showHabitat("water") },
    { x: 620, y: 280, r: 62, label: "Visit the Sun Canopy Court", go: () => showHabitat("tropic") },
    { x: 380, y: 120, r: 52, label: "Rarity Board & Field Codex", go: () => showCodex() },
    { x: 497, y: 124, r: 46, label: "Watch the Behaviour Theatre", go: showTheatre },
    { x: 266, y: 124, r: 46, label: "Sing at the Dawn Chorus Stage", go: showChorus },
    { x: 254, y: 408, r: 44, label: "Scatter a scoop of seed", go: scatterSeed },
    { x: 380, y: 428, r: 34, label: "Exit Bird House to Kitsune World", go: leave },
  ];

  function nearby() {
    let best = null, bd = 1e9;
    for (const st of STATIONS) {
      const d = Math.hypot(st.x - px, st.y - py);
      if (d < st.r && d < bd) { bd = d; best = st; }
    }
    if (best) return best;
    for (const b of roamers) {
      const d = Math.hypot(b.x - px, b.y - py);
      if (d < 46 && d < bd) {
        bd = d;
        const sig = BIRD_BEHAVIOURS[b.id];
        best = { label: `${species(b.id)[1]}: ${sig ? sig.btn : "Say hello"}${b.owned ? "" : " (House Ambassador)"}`, go: () => greet(b) };
      }
    }
    return best;
  }

  const onKey = (e) => {
    if (!alive || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key.toLowerCase();
    if (k === "tab") return;
    // The chorus stage listens for 1-4 itself; let those through.
    if (!modalEl.hidden && "1234".includes(k)) return;
    e.stopPropagation();
    if (k === "escape") {
      e.preventDefault();
      if (!modalEl.hidden) closeModal();
      else leave();
      return;
    }
    if (!modalEl.hidden) return;
    if (k === "e" || k === " " || k === "enter") {
      if (k !== "e" && e.target.closest?.("button")) return; // let a focused button press itself
      e.preventDefault();
      if (!e.repeat) nearby()?.go();
      return;
    }
    if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(k)) {
      e.preventDefault();
      walkTarget = null;
      keys.add(k);
    }
  };
  const onUp = (e) => keys.delete(e.key.toLowerCase());
  window.addEventListener("keydown", onKey, true);
  window.addEventListener("keyup", onUp, true);

  rebuildRoamers();
  loadXmas().then(() => { if (alive) { refreshHeader(); rebuildRoamers(); } }).catch(() => {});
  refreshHeader();
  box.focus({ preventScroll: true });

  function label(text, x, y, color = "#fff", font = "700 10px system-ui") {
    g.fillStyle = color;
    g.font = font;
    g.textAlign = "center";
    g.fillText(text, x, y);
  }
  function pill(x, y, w, h, fill, stroke, r = 6) {
    g.beginPath();
    g.roundRect(x, y, w, h, r);
    g.fillStyle = fill;
    g.fill();
    if (stroke) { g.strokeStyle = stroke; g.lineWidth = 2; g.stroke(); }
  }

  function drawBay(zone, x, y, now) {
    const w = 170, h = 80, hab = BIRD_HABITATS[zone];
    const sky = { song: ["#ffd9a0", "#8ab870"], raptor: ["#9ab8e8", "#7a5a44"], water: ["#bfeaf4", "#2f8ab0"], tropic: ["#7fe0b0", "#145a3a"] }[zone];
    const grd = g.createLinearGradient(x, y, x, y + h);
    grd.addColorStop(0, sky[0]);
    grd.addColorStop(1, sky[1]);
    pill(x, y, w, h, grd, null, 10);
    g.lineCap = "round";
    if (zone === "water") {
      g.strokeStyle = "rgba(255,255,255,.5)";
      g.lineWidth = 2;
      for (let i = 0; i < 4; i++) { g.beginPath(); g.ellipse(x + 30 + i * 38, y + h - 14 + Math.sin(now / 700 + i) * 2, 15, 3, 0, 0, 7); g.stroke(); }
      g.strokeStyle = "#4a7a3a";
      for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(x + w - 10 - i * 5, y + h - 8); g.lineTo(x + w - 14 - i * 5 + Math.sin(now / 900 + i) * 3, y + 34 + i * 3); g.stroke(); }
    } else {
      g.strokeStyle = zone === "raptor" ? "#4a3020" : "#6a4628";
      g.lineWidth = zone === "raptor" ? 7 : 5;
      g.beginPath();
      g.moveTo(x + 8, y + 66);
      g.quadraticCurveTo(x + w / 2, y + (zone === "tropic" ? 76 : 60), x + w - 8, y + 64);
      g.stroke();
      g.fillStyle = zone === "tropic" ? "#2fb06a" : "#5a9a4a";
      if (zone !== "raptor") for (let i = 0; i < 7; i++) { g.beginPath(); g.ellipse(x + 14 + i * 24, y + 70 + (i % 2) * 3, 8, 3.5, i, 0, 7); g.fill(); }
    }
    BAY_BIRDS[zone].forEach((id, i) => {
      const act = BIRD_BEHAVIOURS[id] && Math.floor(now / 3600 + i) % 3 === 0 ? "signature" : "";
      const im = sprite(id, act);
      if (im.complete && im.naturalWidth) g.drawImage(im, x + 8 + i * 52, y + 16 + Math.sin(now / 800 + i * 2) * 1.5, 50, 52);
    });
    g.beginPath();
    g.roundRect(x, y, w, h, 10);
    g.strokeStyle = hab.color;
    g.lineWidth = 3;
    g.stroke();
    pill(x + 12, y - 10, w - 24, 18, "rgba(24,18,40,.9)");
    label(`${hab.badge} ${hab.name}`, x + w / 2, y + 3, "#fff", "700 10.5px system-ui");
  }

  function drawRoom(now) {
    // Dawn sky behind the arched windows
    g.fillStyle = "#4a3a6a";
    g.fillRect(0, 0, 760, 88);
    for (let wx = 44; wx < 720; wx += 112) {
      const sky = g.createLinearGradient(0, 8, 0, 66);
      sky.addColorStop(0, "#8ab4f0");
      sky.addColorStop(1, "#ffc890");
      pill(wx, 8, 82, 58, sky, "#f2c652", [34, 34, 4, 4]);
      g.strokeStyle = "rgba(242,198,82,.7)";
      g.lineWidth = 1.5;
      g.beginPath();
      g.moveTo(wx + 41, 8);
      g.lineTo(wx + 41, 66);
      g.moveTo(wx, 40);
      g.lineTo(wx + 82, 40);
      g.stroke();
    }
    // Birds crossing the dawn outside
    g.strokeStyle = "#3a2c52";
    g.lineWidth = 1.6;
    for (let i = 0; i < 5; i++) {
      const bx = ((now / 28 + i * 173) % 840) - 40, by = 20 + (i % 3) * 10 + Math.sin(now / 500 + i) * 3, flap = Math.sin(now / 110 + i) * 3;
      g.beginPath();
      g.moveTo(bx - 6, by - flap);
      g.quadraticCurveTo(bx - 2, by - 2, bx, by);
      g.quadraticCurveTo(bx + 2, by - 2, bx + 6, by - flap);
      g.stroke();
    }
    // Herringbone timber floor
    g.fillStyle = "#e8d0a8";
    g.fillRect(0, 88, 760, 372);
    g.strokeStyle = "rgba(150,106,62,.22)";
    g.lineWidth = 2;
    for (let ty = 96; ty < 470; ty += 22) {
      for (let tx = (ty / 22) % 2 ? 0 : 22; tx < 780; tx += 44) {
        g.beginPath();
        g.moveTo(tx, ty);
        g.lineTo(tx + 22, ty + 11);
        g.lineTo(tx + 44, ty);
        g.stroke();
      }
    }
    // Morning light shafts
    g.fillStyle = "rgba(255,236,180,.26)";
    for (const sx of [160, 380, 590]) {
      g.beginPath();
      g.moveTo(sx - 42, 88);
      g.lineTo(sx + 42, 88);
      g.lineTo(sx + 106, 444);
      g.lineTo(sx, 444);
      g.closePath();
      g.fill();
    }
    // Central rug and woven Nest Pod rotunda
    g.fillStyle = "#7a3a52";
    g.beginPath();
    g.ellipse(380, 234, 116, 78, 0, 0, 7);
    g.fill();
    g.strokeStyle = "#ffd27a";
    g.lineWidth = 3;
    g.stroke();
    g.fillStyle = "#6a4426";
    g.beginPath();
    g.ellipse(380, 242, 44, 24, 0, 0, 7);
    g.fill();
    g.strokeStyle = "#c89a54";
    g.lineWidth = 2;
    for (let i = 0; i < 5; i++) { g.beginPath(); g.ellipse(380, 242, 40 - i * 3, 20 - i * 2, (i - 2) * 0.09, 0, 7); g.stroke(); }
    [["#7fe8ff", 358, 232], ["#ffd84d", 380, 220], ["#ff84c8", 402, 232]].forEach(([col, ex, ey], i) => {
      const wob = Math.sin(now / 420 + i * 2) * 0.12;
      g.save();
      g.translate(ex, ey + 8);
      g.rotate(wob);
      g.globalAlpha = 0.3;
      g.fillStyle = col;
      g.beginPath();
      g.arc(0, -10, 16, 0, 7);
      g.fill();
      g.globalAlpha = 1;
      g.fillStyle = "#fff9ec";
      g.beginPath();
      g.ellipse(0, -10, 9, 12.5, 0, 0, 7);
      g.fill();
      g.strokeStyle = col;
      g.stroke();
      g.fillStyle = col;
      for (const [dx, dy] of [[-3, -14], [4, -9], [-2, -5]]) { g.beginPath(); g.arc(dx, dy, 1.6, 0, 7); g.fill(); }
      g.restore();
    });
    // Counter, theatre and chorus stage
    pill(322, 72, 116, 32, "#6c482c", "#ffd27a");
    label("📋 ODDS & CODEX", 380, 92);
    pill(236, 76, 62, 28, "#4a3a78", "#e0a23a");
    label("🎶 CHORUS", 267, 94);
    pill(462, 76, 70, 28, "#6a2a40", "#ffd84d");
    label("🎭 THEATRE", 497, 94);
    // Seed bin
    pill(232, 412, 44, 24, "#8a5a32", "#ffd27a");
    label("🌻 SEED", 254, 428, "#fff", "700 9px system-ui");
    // Hanging perches
    for (const [hx, hy] of [[288, 150], [472, 150], [300, 330], [462, 330]]) {
      const sway = Math.sin(now / 900 + hx) * 3;
      g.strokeStyle = "rgba(90,60,40,.55)";
      g.lineWidth = 1.5;
      g.beginPath();
      g.moveTo(hx - 12, hy - 34);
      g.lineTo(hx - 14 + sway, hy);
      g.moveTo(hx + 12, hy - 34);
      g.lineTo(hx + 14 + sway, hy);
      g.stroke();
      pill(hx - 18 + sway, hy - 2, 36, 5, "#8a5a32", null, 3);
    }
    for (const [zone, bx, by] of BAYS) drawBay(zone, bx, by, now);
    // Exit mat
    pill(344, 424, 72, 24, "#8a3632", "#ffd27a", 0);
    label("EXIT", 380, 440);
  }

  function moveBirds(dt, moving) {
    for (const b of roamers) {
      if (b.actTimer > 0) {
        b.actTimer -= dt;
        if (b.actTimer <= 0) { b.act = ""; b.bubble = ""; }
      }
      if (b.flying > 0) {
        b.flying = Math.max(0, b.flying - dt / 1.1);
        const k = 1 - b.flying, ease = k * k * (3 - 2 * k);
        b.x = b.flyFrom.x + (b.to.x - b.flyFrom.x) * ease;
        b.y = b.flyFrom.y + (b.to.y - b.flyFrom.y) * ease;
        if (!b.flying) { b.to = null; b.wait = 1.5 + Math.random() * 2; }
        continue;
      }
      // Walking close and fast flushes a bird into a short flight.
      if (moving && !b.act && !seeds && Math.hypot(b.x - px, b.y - py) < 26) {
        b.flyFrom = { x: b.x, y: b.y };
        b.to = randomSpot();
        b.flying = 1;
        b.facing = b.to.x < b.x ? -1 : 1;
        continue;
      }
      b.idle -= dt;
      if (b.idle <= 0 && !b.act && !seeds) {
        b.idle = 8 + Math.random() * 12;
        if (Math.random() < 0.6) perform(b);
      }
      if (b.wait > 0) { b.wait -= dt; continue; }
      if (!b.to) b.to = { x: clampX(b.x + (Math.random() - 0.5) * 110), y: clampY(b.y + (Math.random() - 0.5) * 70) };
      const dx = b.to.x - b.x, dy = b.to.y - b.y, d = Math.hypot(dx, dy);
      if (d < 3) { b.to = null; b.wait = 0.6 + Math.random() * 2.2; continue; }
      const nx = b.x + (dx / d) * 26 * dt, ny = b.y + (dy / d) * 26 * dt;
      if (isSolidPt(nx, ny)) { b.to = null; b.wait = 0.3; continue; }
      b.x = nx;
      b.y = ny;
      b.facing = dx < 0 ? -1 : 1;
    }
  }

  function drawBird(b, now) {
    const im = sprite(b.id, b.act);
    const arc = b.flying > 0 ? Math.sin((1 - b.flying) * Math.PI) * 54 : 0;
    const hop = b.flying > 0 || b.act ? 0 : b.to && b.wait <= 0 ? Math.abs(Math.sin(now / 110 + b.x)) * 4 : 0;
    g.fillStyle = `rgba(0,0,0,${arc ? 0.08 : 0.17})`;
    g.beginPath();
    g.ellipse(b.x, b.y + 15, 13 - arc / 10, 4, 0, 0, 7);
    g.fill();
    if (im.complete && im.naturalWidth) {
      g.save();
      g.translate(b.x, b.y - hop - arc);
      if (b.facing < 0 && !b.act) g.scale(-1, 1);
      if (b.flying > 0) g.rotate(Math.sin(now / 60) * 0.18);
      g.drawImage(im, -23, -29, 46, 48);
      g.restore();
    }
    if (b.owned) { g.fillStyle = "#ffd84d"; g.font = "700 10px system-ui"; g.textAlign = "center"; g.fillText("★", b.x + 18, b.y - 18 - arc); }
    if (b.bubble) {
      g.font = "700 9.5px system-ui";
      const tw = g.measureText(b.bubble).width + 12;
      pill(b.x - tw / 2, b.y - 46, tw, 16, "rgba(24,18,40,.9)");
      label(b.bubble, b.x, b.y - 34, "#ffe896", "700 9.5px system-ui");
    }
  }

  const frame = (now) => {
    if (!alive) return;
    if (!box.isConnected) return leave();
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    let moving = false;
    if (modalEl.hidden) {
      let ax = (keys.has("d") || keys.has("arrowright") ? 1 : 0) - (keys.has("a") || keys.has("arrowleft") ? 1 : 0);
      let ay = (keys.has("s") || keys.has("arrowdown") ? 1 : 0) - (keys.has("w") || keys.has("arrowup") ? 1 : 0);
      if (!ax && !ay && walkTarget) {
        const dx = walkTarget.x - px, dy = walkTarget.y - py, d = Math.hypot(dx, dy);
        if (d < 6) walkTarget = null;
        else { ax = dx / d; ay = dy / d; }
      }
      moving = !!(ax || ay);
      if (moving) {
        const m = Math.hypot(ax, ay), nx = px + (ax / m) * 210 * dt, ny = py + (ay / m) * 210 * dt;
        let went = false;
        if (!isSolidPt(nx, py)) { px = nx; went = true; }
        if (!isSolidPt(px, ny)) { py = ny; went = true; }
        if (!went) walkTarget = null;
        dir = Math.abs(ax) > Math.abs(ay) ? (ax < 0 ? "left" : "right") : ay < 0 ? "up" : "down";
        step += dt * 12;
      }
      moveBirds(dt, moving);
      if (seeds && (seeds.life -= dt) <= 0) seeds = null;
    }

    drawRoom(now);
    if (seeds) {
      g.globalAlpha = Math.min(1, seeds.life);
      g.fillStyle = "#7a5a22";
      for (const [dx, dy] of seeds.bits) g.fillRect(seeds.x + dx, seeds.y + 14 + dy, 3, 2);
      g.globalAlpha = 1;
    }
    const ents = roamers.map((b) => [b.flying > 0 ? 1000 : b.y, () => drawBird(b, now)]);
    ents.push([py, () => drawFox(g, px, py, dir, step, fur, tailsN, s.hat, now, moving)]);
    ents.sort((a, b) => a[0] - b[0]);
    for (const e of ents) e[1]();
    for (const list of [sparks, hearts]) {
      for (let i = list.length - 1; i >= 0; i--) {
        const q = list[i];
        q.x += (q.vx || 0) * dt;
        q.y += q.vy * dt;
        q.life -= dt * 1.2;
        if (q.life <= 0) { list.splice(i, 1); continue; }
        g.globalAlpha = q.life;
        if (q.col) { g.fillStyle = q.col; g.fillRect(q.x - 2.5, q.y - 2.5, 5, 5); }
        else label("♥", q.x, q.y, "#ff4f7a", "700 15px system-ui");
      }
    }
    g.globalAlpha = 1;

    const hit = modalEl.hidden ? nearby() : null;
    const lbl = hit ? hit.label : "";
    if (promptEl.dataset.lbl !== lbl) {
      promptEl.dataset.lbl = lbl;
      promptEl.innerHTML = hit
        ? `<button type="button" class="btn btn-accent btn-sm" id="bd-act"><kbd>E</kbd> ${esc(hit.label)}</button>`
        : `<span class="muted">Walk or tap to explore: Nest Pods, habitat flights, the chorus stage, the seed bin and the birds themselves.</span>`;
    }
    const act = hit && promptEl.querySelector("#bd-act");
    if (act) act.onclick = hit.go;
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);
  return leave;
}
