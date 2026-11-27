// The walkable interior shared by every pet house built from a pack: four habitats, three hatch pods,
// roaming pets, a daily treat station, the behaviour theatre, the codex and the house's mini-game.
import { esc, today } from "../util.js";
import { species } from "../xmas/data.js";
import { petSvg, petUrl } from "../xmas/art.js";
import { xs, loadXmas, save as saveXmas } from "../xmas/core.js";
import { DAILY_POD_CAP, POD_PRICE, ensureHouse, owned, buyPod, tierSummary, oddsTiles, petCard, cardGrid, bindSignatures, filterChips, filterPets, mountGame } from "../xmas/petshop.js";

const TREAT_MON = 15;
const BAY_AT = [[54, 72], [536, 72], [54, 286], [536, 286]];

export function enterPetHouse(house, o) {
  const { root, s, drawFox, fur, tailsN, toast, ping, save, hud, onLeave } = o;
  const th = house.theme;
  const roam = house.roam || "walk";

  const box = document.createElement("div");
  box.className = "rm rm-explore";
  box.tabIndex = -1;
  box.innerHTML = `
    <div style="position:relative;width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;background:radial-gradient(circle at top,${th.wall},#0e0c18);padding:12px;box-sizing:border-box;overflow:hidden">
      <div style="display:flex;justify-content:space-between;align-items:center;width:100%;max-width:820px;margin-bottom:8px;color:#fff;gap:8px;flex-wrap:wrap">
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
          <strong style="font-size:15px">${house.icon} ${esc(house.name)}</strong>
          <span class="pill" data-count></span><span class="pill" data-mon></span><span class="pill" data-bells></span>
        </div>
        <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">
          <button type="button" class="btn btn-sm btn-accent" data-theatre>🎭 Behaviours</button>
          <button type="button" class="btn btn-sm" data-codex-open>Odds &amp; ${house.ids.length} Codex</button>
          <button type="button" class="btn btn-sm" data-out>Exit (Esc)</button>
        </div>
      </div>
      <div style="position:relative;width:100%;max-width:820px;aspect-ratio:760/460">
        <canvas width="760" height="460" aria-label="Inside ${esc(house.name)}" style="width:100%;height:100%;border-radius:14px;border:2px solid ${th.accent};box-shadow:0 18px 46px rgba(0,0,0,.55);background:${th.floor};cursor:pointer;display:block;touch-action:none"></canvas>
        <div data-modal role="dialog" hidden style="position:absolute;inset:10px;border-radius:12px;background:rgba(20,18,32,.97);border:2px solid ${th.accent};padding:14px;overflow:auto;color:#fff;z-index:4;box-shadow:0 16px 40px rgba(0,0,0,.7)"></div>
      </div>
      <div data-prompt style="margin-top:8px;min-height:36px;display:flex;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap;color:#fff"></div>
    </div>`;
  root.appendChild(box);

  const $ = (sel) => box.querySelector(sel);
  const cv = $("canvas"), g = cv.getContext("2d"), promptEl = $("[data-prompt]"), modalEl = $("[data-modal]");
  let px = 380, py = 386, dir = "up", step = 0, alive = true, raf = 0, last = performance.now();
  let walkTarget = null, gameCleanup = null, treat = null, roamers = [];
  const keys = new Set(), sparks = [], hearts = [], imgCache = new Map();

  const sprite = (id, act = "") => {
    const key = `${id}:${act}`;
    if (!imgCache.has(key)) {
      const im = new Image();
      im.src = petUrl(id, 1, "happy", act);
      imgCache.set(key, im);
    }
    return imgCache.get(key);
  };
  house.habitats.forEach((h) => h.showcase.forEach((id) => { sprite(id); if (house.behaviours[id]) sprite(id, "signature"); }));

  const mine = () => owned(house);
  function refreshHeader() {
    $("[data-count]").textContent = `${mine().length}/${house.ids.length} found`;
    $("[data-mon]").textContent = `${Number(s.mon || 0).toLocaleString()} mon`;
    $("[data-bells]").textContent = `${Number(xs()?.bells || 0).toLocaleString()} Bells`;
  }

  // Solid furniture [x0, y0, x1, y1]
  const OBSTACLES = [[54, 72, 224, 152], [536, 72, 706, 152], [54, 286, 224, 366], [536, 286, 706, 366], [338, 200, 422, 258], [322, 68, 438, 108]];
  const isSolidPt = (x, y) => x < 40 || x > 720 || y < 104 || y > 432 || OBSTACLES.some(([x0, y0, x1, y1]) => x > x0 - 10 && x < x1 + 10 && y > y0 - 8 && y < y1 + 8);
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
    const have = mine(), active = xs()?.active;
    const pool = [...(have.includes(active) ? [active] : []), ...have.filter((id) => house.behaviours[id]), ...have, ...house.ambassadors];
    roamers = [...new Set(pool)].slice(0, 8).map((id, i) => {
      const at = randomSpot();
      sprite(id);
      if (house.behaviours[id]) sprite(id, "signature");
      return { id, owned: have.includes(id), x: at.x, y: at.y, to: null, wait: 0.4 + i * 0.35, facing: i % 2 ? 1 : -1, act: "", actTimer: 0, bubble: "", idle: 4 + Math.random() * 9 };
    });
  }

  function addBurst(x, y, col, n) {
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
  const podsLeft = () => Math.max(0, DAILY_POD_CAP - (xs() ? ensureHouse(xs(), house.slug).adopts : DAILY_POD_CAP));

  async function openPod(currency) {
    await loadXmas().catch(() => {});
    if (!alive) return;
    const res = buyPod(house, currency, wallet);
    if (res.error) return toast(res.error);
    addBurst(380, 224, house.tiers[res.tier].color, res.tier === "chase" ? 90 : 42);
    ping?.("done");
    if (res.note) toast(res.note.trim());
    refreshHeader();
    rebuildRoamers();
    hud?.();
    showHatch(res);
  }
  const podButtons = () => `<button type="button" class="btn btn-accent" data-buy="mon" ${podsLeft() && (s.mon || 0) >= POD_PRICE.mon ? "" : "disabled"}>Open ${esc(house.pod)} · ${POD_PRICE.mon} mon</button>
    <button type="button" class="btn btn-accent" data-buy="bell" ${podsLeft() && (xs()?.bells || 0) >= POD_PRICE.bells ? "" : "disabled"}>Open ${esc(house.pod)} · ${POD_PRICE.bells} Snowbells</button>
    <button type="button" class="btn" data-codex>Full odds &amp; codex</button>`;
  function bindPods(el) {
    el.querySelectorAll("[data-buy]").forEach((b) => (b.onclick = () => { b.disabled = true; openPod(b.dataset.buy); }));
    el.querySelector("[data-codex]").onclick = () => showCodex();
  }

  function showPods() {
    if (!xs()) return toast("Give the house a moment to open up.");
    openModal(`${head(`${house.icon} ${esc(house.pod)}s`)}
      <p class="muted" style="margin-top:0">Each ${esc(house.pod)} welcomes one of <strong>${house.ids.length} ${esc(house.noun)}</strong> into your collection (${podsLeft()}/${DAILY_POD_CAP} left today).</p>
      ${oddsTiles(house)}<div style="display:flex;gap:10px;flex-wrap:wrap">${podButtons()}</div>`, bindPods);
  }
  function showHatch(res) {
    const t = house.tiers[res.tier], m = res.meta;
    openModal(`${head(esc(res.sp[1]), `<i>${esc(m.sci)}</i> · ${esc(m.habit)}`)}
      <div style="display:flex;gap:18px;align-items:center;flex-wrap:wrap;margin:12px 0">
        <div style="width:150px;height:150px;flex:0 0 150px;background:radial-gradient(circle,${t.color}55,transparent 70%);border-radius:16px;display:grid;place-items:center">${petSvg(res.id, 2, "love", { size: 140, act: house.behaviours[res.id] ? "signature" : "" })}</div>
        <div style="flex:1;min-width:220px">
          <span class="pill" style="color:${t.color};border-color:${t.color}">${esc(t.label)} · ${esc(m.chance)}</span>
          <p style="margin:8px 0">${esc(res.sp[8])}</p>
          <p style="margin:0;font-weight:700;color:${res.dupe ? "#ffd84d" : "#8cff98"}">${res.dupe ? "Already yours → +60 XP &amp; 100% Joy!" : "New friend! Added to your collection and Winterfest Pets."}</p>
          <small class="muted">${podsLeft()}/${DAILY_POD_CAP} left today</small>
        </div>
      </div><div style="display:flex;gap:8px;flex-wrap:wrap">${podButtons()}</div>`, bindPods);
  }
  function showHabitat(hab) {
    const list = house.rows.filter((r) => r.zone === hab.id), x = xs();
    openModal(`${head(`${hab.badge} ${esc(hab.name)} (${list.filter((r) => !!x?.pets?.[r.id]).length}/${list.length})`, esc(hab.desc))}${cardGrid(house, list, x)}`, (el) => bindSignatures(house, el, x, ping));
  }
  function showCodex(filter = "all") {
    const x = xs();
    openModal(`${head(`📋 Rarity Board &amp; Codex (${mine().length}/${house.ids.length})`, esc(tierSummary(house)))}
      <div class="chips" style="margin-bottom:10px">${filterChips(house, filter)}</div>${cardGrid(house, filterPets(house, filter), x)}`, (el) => {
      bindSignatures(house, el, x, ping);
      el.querySelectorAll("[data-pf]").forEach((b) => (b.onclick = () => showCodex(b.dataset.pf)));
    });
  }
  function showTheatre() {
    const x = xs(), stars = filterPets(house, "behaviours");
    openModal(`${head(`🎭 Signature Behaviour Theatre (${stars.length} stars)`, "Press a button to watch the habit each one is known for.")}
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(min(250px,100%),1fr));gap:10px">${stars.map((r) => `<div>${petCard(house, r, x)}<small class="muted" style="display:block;padding:4px 6px"><strong style="color:#ffd84d">${esc(house.behaviours[r.id].tag)}:</strong> ${esc(house.behaviours[r.id].desc)}</small></div>`).join("")}</div>`, (el) => bindSignatures(house, el, x, ping));
  }
  function showGame() {
    if (!xs()) return toast("Give the house a moment to open up.");
    openModal(`${head(`${house.game.icon} ${esc(house.game.name)}`, esc(house.game.blurb))}<div data-stage></div>`, (el) => {
      gameCleanup = mountGame(house, el.querySelector("[data-stage]"), {
        ping,
        worldMon: true,
        addMon: (n) => { s.mon += n; save(); },
        hud: () => { refreshHeader(); rebuildRoamers(); hud?.(); },
        onDone: (m) => { toast(m); closeModal(); },
      });
    });
  }

  function giveTreat() {
    const x = xs();
    if (!x) return toast("Give the house a moment to open up.");
    const a = ensureHouse(x, house.slug);
    treat = { x: px, y: Math.min(400, py + 4), life: 6, bits: Array.from({ length: 24 }, () => [(Math.random() - 0.5) * 54, (Math.random() - 0.5) * 24]) };
    roamers.forEach((b, i) => { b.to = { x: clampX(treat.x + Math.cos(i * 0.8) * 42), y: clampY(treat.y + Math.sin(i * 0.8) * 24) }; b.wait = 0; });
    ping?.("choice");
    if (a.treatDay === today()) return toast(`Everyone comes over for seconds. (Today's keeper tip is already paid.)`);
    a.treatDay = today();
    s.mon += TREAT_MON;
    let fed = 0;
    for (const id of mine()) {
      x.pets[id].joy = Math.min(100, (x.pets[id].joy || 0) + 8);
      x.pets[id].hunger = Math.min(100, (x.pets[id].hunger || 0) + 8);
      fed++;
    }
    save();
    saveXmas();
    refreshHeader();
    hud?.();
    toast(`${house.treat.line} +${TREAT_MON} mon${fed ? `, and ${fed} of yours feel fuller` : ""}.`);
  }

  function perform(b) {
    const sig = house.behaviours[b.id];
    if (!sig) return false;
    Object.assign(b, { act: "signature", actTimer: 4, to: null, wait: 4, bubble: `✨ ${sig.tag}!` });
    return true;
  }
  function greet(b) {
    const sp = species(b.id), x = xs();
    hearts.push({ x: b.x, y: b.y - 24, vy: -32, life: 1 });
    ping?.("blip");
    const did = perform(b);
    if (!did) Object.assign(b, { bubble: "♪ hello!", actTimer: 1.6, wait: 1.6 });
    if (b.owned && x?.pets?.[b.id]) {
      const pet = x.pets[b.id], now = Date.now();
      if (now - (pet.patAt || 0) >= 1500) { pet.patAt = now; pet.joy = Math.min(100, (pet.joy || 0) + 4); pet.xp = (pet.xp || 0) + 2; saveXmas(); }
      if (!did) toast(`${pet.name} looks delighted.`);
    } else if (!did) toast(`${sp[1]} says hello.`);
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
  $("[data-out]").onclick = leave;
  $("[data-codex-open]").onclick = () => showCodex();
  $("[data-theatre]").onclick = showTheatre;
  cv.addEventListener("pointerdown", (e) => {
    if (!modalEl.hidden) return;
    const r = cv.getBoundingClientRect();
    walkTarget = { x: Math.max(46, Math.min(714, ((e.clientX - r.left) / r.width) * 760)), y: Math.max(112, Math.min(426, ((e.clientY - r.top) / r.height) * 460)) };
  });

  const [h0, h1, h2, h3] = house.habitats;
  const STATIONS = [
    { x: 380, y: 230, r: 80, label: `Open ${/^[aeiou]/i.test(house.pod) ? "an" : "a"} ${house.pod} (${house.ids.length} ${house.noun})`, go: showPods },
    { x: 140, y: 158, r: 62, label: `Visit ${h0.name}`, go: () => showHabitat(h0) },
    { x: 620, y: 158, r: 62, label: `Visit ${h1.name}`, go: () => showHabitat(h1) },
    { x: 140, y: 280, r: 62, label: `Visit ${h2.name}`, go: () => showHabitat(h2) },
    { x: 620, y: 280, r: 62, label: `Visit ${h3.name}`, go: () => showHabitat(h3) },
    { x: 380, y: 120, r: 52, label: "Rarity Board & Codex", go: () => showCodex() },
    { x: 497, y: 124, r: 46, label: "Watch the Behaviour Theatre", go: showTheatre },
    { x: 266, y: 124, r: 46, label: `Play ${house.game.name}`, go: showGame },
    { x: 254, y: 408, r: 44, label: house.treat.name, go: giveTreat },
    { x: 380, y: 428, r: 34, label: `Exit ${house.name} to Kitsune World`, go: leave },
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
        const sig = house.behaviours[b.id];
        best = { label: `${species(b.id)[1]}: ${sig ? sig.btn : "Say hello"}${b.owned ? "" : " (House Ambassador)"}`, go: () => greet(b) };
      }
    }
    return best;
  }

  const onKey = (e) => {
    if (!alive || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key.toLowerCase();
    if (k === "tab") return;
    if (k === "escape") {
      e.preventDefault();
      e.stopPropagation();
      if (!modalEl.hidden) closeModal();
      else leave();
      return;
    }
    // While a panel is open its own controls (and any mini-game) receive the keys.
    if (!modalEl.hidden) return;
    e.stopPropagation();
    if (k === "e" || k === " " || k === "enter") {
      if (k !== "e" && e.target.closest?.("button")) return;
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

  // Habitat backdrops. decor: "meadow" | "water" | "wood" | "rock" | "leaf" | "cozy" | "night"
  function drawDecor(kind, x, y, w, h, now) {
    g.lineCap = "round";
    if (kind === "water") {
      g.strokeStyle = "rgba(255,255,255,.5)";
      g.lineWidth = 1.5;
      for (let i = 0; i < 10; i++) { const by = y + h - ((now / 40 + i * 19) % (h - 8)); g.beginPath(); g.arc(x + 10 + ((i * 47) % (w - 20)), by, 1.5 + (i % 3), 0, 7); g.stroke(); }
      g.strokeStyle = "#2f8a5a";
      g.lineWidth = 3;
      for (let i = 0; i < 5; i++) { const wx = x + 10 + i * 38; g.beginPath(); g.moveTo(wx, y + h - 2); g.quadraticCurveTo(wx + Math.sin(now / 700 + i) * 9, y + h - 20, wx + Math.sin(now / 900 + i) * 5, y + h - 34); g.stroke(); }
    } else if (kind === "night") {
      g.fillStyle = "#fff6c0";
      for (let i = 0; i < 14; i++) { g.globalAlpha = 0.35 + 0.5 * Math.abs(Math.sin(now / 600 + i)); g.beginPath(); g.arc(x + 8 + ((i * 53) % (w - 16)), y + 10 + ((i * 29) % (h - 30)), 1.4, 0, 7); g.fill(); }
      g.globalAlpha = 1;
      g.strokeStyle = "#3a5a3a";
      g.lineWidth = 4;
      g.beginPath(); g.moveTo(x + 8, y + h - 10); g.quadraticCurveTo(x + w / 2, y + h - 22, x + w - 8, y + h - 12); g.stroke();
    } else if (kind === "rock") {
      g.fillStyle = "rgba(60,40,30,.55)";
      for (let i = 0; i < 6; i++) { g.beginPath(); g.ellipse(x + 18 + i * 28, y + h - 6, 17, 9 + (i % 3) * 4, 0, Math.PI, 0); g.fill(); }
    } else if (kind === "wood") {
      g.strokeStyle = "#5a3a20";
      g.lineWidth = 6;
      g.beginPath(); g.moveTo(x + 8, y + h - 14); g.quadraticCurveTo(x + w / 2, y + h - 26, x + w - 8, y + h - 12); g.stroke();
      g.lineWidth = 2;
      g.strokeStyle = "rgba(60,40,24,.4)";
      for (let i = 1; i < 5; i++) { g.beginPath(); g.moveTo(x + i * 34, y + 6); g.lineTo(x + i * 34, y + h - 22); g.stroke(); }
    } else if (kind === "cozy") {
      for (let i = 0; i < 4; i++) { g.fillStyle = ["#e86a7a", "#ffd27a", "#7ab8e8", "#9ad08a"][i]; g.beginPath(); g.ellipse(x + 26 + i * 40, y + h - 8, 19, 7, 0, 0, 7); g.fill(); }
      g.strokeStyle = "rgba(255,255,255,.45)";
      g.lineWidth = 1.5;
      g.beginPath(); g.moveTo(x + 6, y + 16); for (let i = 0; i < 8; i++) g.quadraticCurveTo(x + 16 + i * 21, y + 26, x + 27 + i * 21, y + 16); g.stroke();
    } else {
      g.fillStyle = kind === "leaf" ? "#2fa860" : "#6ab04a";
      for (let i = 0; i < 9; i++) { g.beginPath(); g.ellipse(x + 12 + i * 18, y + h - 7 + (i % 2) * 3, 11, kind === "leaf" ? 6 : 4, i + Math.sin(now / 900 + i) * 0.15, 0, 7); g.fill(); }
      if (kind === "meadow") for (let i = 0; i < 7; i++) { g.fillStyle = ["#fff", "#ffd84d", "#ff9ac2"][i % 3]; g.beginPath(); g.arc(x + 20 + i * 22, y + h - 10 - (i % 3) * 3, 2.4, 0, 7); g.fill(); }
    }
  }

  function drawBay(hab, x, y, now) {
    const w = 170, h = 80;
    const grd = g.createLinearGradient(x, y, x, y + h);
    grd.addColorStop(0, hab.sky[0]);
    grd.addColorStop(1, hab.sky[1]);
    pill(x, y, w, h, grd, null, 10);
    g.save();
    g.beginPath();
    g.roundRect(x, y, w, h, 10);
    g.clip();
    drawDecor(hab.decor, x, y, w, h, now);
    hab.showcase.slice(0, 3).forEach((id, i) => {
      const act = house.behaviours[id] && Math.floor(now / 3600 + i) % 3 === 0 ? "signature" : "";
      const im = sprite(id, act);
      const float = hab.decor === "water" ? Math.sin(now / 500 + i * 2) * 4 : Math.sin(now / 800 + i * 2) * 1.5;
      if (im.complete && im.naturalWidth) g.drawImage(im, x + 8 + i * 52, y + 18 + float, 50, 52);
    });
    g.restore();
    g.beginPath();
    g.roundRect(x, y, w, h, 10);
    g.strokeStyle = hab.color;
    g.lineWidth = 3;
    g.stroke();
    pill(x + 8, y - 10, w - 16, 18, "rgba(22,18,34,.9)");
    label(`${hab.badge} ${hab.name}`, x + w / 2, y + 3, "#fff", "700 10.5px system-ui");
  }

  function drawRoom(now) {
    g.fillStyle = th.wall;
    g.fillRect(0, 0, 760, 88);
    for (let wx = 44; wx < 720; wx += 112) {
      const sky = g.createLinearGradient(0, 8, 0, 66);
      sky.addColorStop(0, th.window?.[0] || "#8ab4f0");
      sky.addColorStop(1, th.window?.[1] || "#ffd8b0");
      pill(wx, 8, 82, 58, sky, th.accent, [30, 30, 4, 4]);
      g.fillStyle = "rgba(255,255,255,.7)";
      g.beginPath();
      g.arc(wx + 20 + ((now / 300 + wx) % 44), 34 + Math.sin(now / 800 + wx) * 4, 3, 0, 7);
      g.fill();
    }
    g.fillStyle = th.floor;
    g.fillRect(0, 88, 760, 372);
    g.fillStyle = th.plank || "rgba(0,0,0,.05)";
    for (let ty = 88; ty < 460; ty += 34) for (let tx = ((ty - 88) / 34) % 2 ? 34 : 0; tx < 760; tx += 68) g.fillRect(tx, ty, 34, 34);
    g.fillStyle = "rgba(255,246,214,.2)";
    for (const sx of [160, 380, 590]) { g.beginPath(); g.moveTo(sx - 42, 88); g.lineTo(sx + 42, 88); g.lineTo(sx + 106, 444); g.lineTo(sx, 444); g.closePath(); g.fill(); }
    // Rug and the three pods on their stand
    g.fillStyle = th.rug;
    g.beginPath(); g.ellipse(380, 234, 116, 78, 0, 0, 7); g.fill();
    g.strokeStyle = th.accent;
    g.lineWidth = 3;
    g.stroke();
    g.fillStyle = "#5c3e26";
    g.beginPath(); g.ellipse(380, 242, 44, 24, 0, 0, 7); g.fill();
    g.stroke();
    [["#7fe8ff", 356, 232], ["#ffd84d", 380, 220], ["#ff84c8", 404, 232]].forEach(([col, ex, ey], i) => {
      const bob = Math.sin(now / 420 + i * 2) * 2.5;
      g.globalAlpha = 0.28;
      g.fillStyle = col;
      g.beginPath(); g.arc(ex, ey + bob, 17, 0, 7); g.fill();
      g.globalAlpha = 1;
      g.fillStyle = "#fff9ec";
      g.beginPath(); g.ellipse(ex, ey + bob, 10, 12.5, 0, 0, 7); g.fill();
      g.strokeStyle = col;
      g.lineWidth = 2;
      g.stroke();
      g.font = "11px system-ui";
      g.textAlign = "center";
      g.fillText(house.icon, ex, ey + bob + 4);
    });
    pill(322, 72, 116, 32, "#6c482c", th.accent);
    label("📋 ODDS & CODEX", 380, 92);
    pill(226, 76, 82, 28, "#40366a", th.accent);
    label(`${house.game.icon} PLAY`, 267, 94);
    pill(458, 76, 78, 28, "#6a2a40", th.accent);
    label("🎭 THEATRE", 497, 94);
    pill(228, 412, 52, 24, "#8a5a32", th.accent);
    label(`${house.treat.icon} TREATS`, 254, 428, "#fff", "700 9px system-ui");
    house.habitats.forEach((hab, i) => drawBay(hab, BAY_AT[i][0], BAY_AT[i][1], now));
    pill(344, 424, 72, 24, "#8a3632", th.accent, 0);
    label("EXIT", 380, 440);
  }

  function moveRoamers(dt) {
    const speed = roam === "walk" ? 30 : roam === "hop" ? 40 : 24;
    for (const b of roamers) {
      if (b.actTimer > 0) {
        b.actTimer -= dt;
        if (b.actTimer <= 0) { b.act = ""; b.bubble = ""; }
      }
      b.idle -= dt;
      if (b.idle <= 0 && !b.act && !treat) {
        b.idle = 8 + Math.random() * 12;
        if (Math.random() < 0.6) perform(b);
      }
      if (b.wait > 0) { b.wait -= dt; continue; }
      if (!b.to) b.to = { x: clampX(b.x + (Math.random() - 0.5) * 120), y: clampY(b.y + (Math.random() - 0.5) * 76) };
      const dx = b.to.x - b.x, dy = b.to.y - b.y, d = Math.hypot(dx, dy);
      if (d < 3) { b.to = null; b.wait = 0.6 + Math.random() * 2.2; continue; }
      const nx = b.x + (dx / d) * speed * dt, ny = b.y + (dy / d) * speed * dt;
      // Swimmers and flyers drift over the furniture; walkers and hoppers go around it.
      if ((roam === "walk" || roam === "hop") && isSolidPt(nx, ny)) { b.to = null; b.wait = 0.3; continue; }
      b.x = nx;
      b.y = ny;
      b.facing = dx < 0 ? -1 : 1;
    }
  }

  function drawRoamer(b, now) {
    const im = sprite(b.id, b.act);
    const going = !!b.to && b.wait <= 0 && !b.act;
    const lift = roam === "swim" ? 10 + Math.sin(now / 520 + b.x / 30) * 5
      : roam === "flutter" ? 16 + Math.sin(now / 240 + b.y / 20) * 7
      : roam === "hop" ? (going ? Math.abs(Math.sin(now / 170 + b.x / 40)) * 13 : 0)
      : going ? Math.abs(Math.sin(now / 110 + b.x)) * 3.5 : 0;
    g.fillStyle = `rgba(0,0,0,${lift > 8 ? 0.09 : 0.17})`;
    g.beginPath(); g.ellipse(b.x, b.y + 15, 13, 4, 0, 0, 7); g.fill();
    if (roam === "swim") {
      g.fillStyle = "rgba(150,220,255,.3)";
      g.strokeStyle = "rgba(255,255,255,.75)";
      g.lineWidth = 1.2;
      g.beginPath(); g.arc(b.x, b.y - 5 - lift, 27, 0, 7); g.fill(); g.stroke();
    }
    if (im.complete && im.naturalWidth) {
      g.save();
      g.translate(b.x, b.y - lift);
      if (b.facing < 0 && !b.act) g.scale(-1, 1);
      g.drawImage(im, -23, -29, 46, 48);
      g.restore();
    }
    if (b.owned) label("★", b.x + 20, b.y - 20 - lift, "#ffb800");
    if (b.bubble) {
      g.font = "700 9.5px system-ui";
      const tw = g.measureText(b.bubble).width + 12;
      pill(b.x - tw / 2, b.y - 48 - lift, tw, 16, "rgba(22,18,34,.9)");
      label(b.bubble, b.x, b.y - 36 - lift, "#ffe896", "700 9.5px system-ui");
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
      moveRoamers(dt);
      if (treat && (treat.life -= dt) <= 0) treat = null;
    }
    drawRoom(now);
    if (treat) {
      g.globalAlpha = Math.min(1, treat.life);
      g.font = "9px system-ui";
      g.textAlign = "center";
      for (const [dx, dy] of treat.bits.slice(0, 9)) g.fillText(house.treat.icon, treat.x + dx, treat.y + 16 + dy);
      g.globalAlpha = 1;
    }
    const ents = roamers.map((b) => [b.y, () => drawRoamer(b, now)]);
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
        ? `<button type="button" class="btn btn-accent btn-sm" data-act><kbd>E</kbd> ${esc(hit.label)}</button>`
        : `<span class="muted">Walk or tap to explore: pods, habitats, the game table, the treat bin and the ${esc(house.noun)} themselves.</span>`;
    }
    const act = hit && promptEl.querySelector("[data-act]");
    if (act) act.onclick = hit.go;
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);
  return leave;
}
