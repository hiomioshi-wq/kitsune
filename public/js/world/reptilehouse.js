// Explorable 2D Sunscale Reptile House interior: sunlit conservatory pet shop with 4 live glass biome bays,
// central Terrarium Egg Pods, wandering hatched reptiles, Rarity Odds & 63-Species Codex, and Cricket Catch.
import { esc, today } from "../util.js";
import { species, RARITY } from "../xmas/data.js";
import { petSvg, petUrl } from "../xmas/art.js";
import { xs, loadXmas, save as saveXmas, earn, grant, isSeason } from "../xmas/core.js";
import { settings } from "../store.js";
import {
  REPTILE_TIERS,
  HABITATS,
  REPTILE_LIST,
  REPTILE_META,
  REPTILE_IDS,
  DAILY_POD_CAP,
  DAILY_CRICKET_CAP,
  ensureSanctuary,
  rollReptilePod,
} from "../xmas/reptiledata.js";

const BAY_SPECIES = {
  mesa: ["beardeddragon", "leopardgecko", "uromastyx", "radiatedtortoise", "gilamonster", "spiderviper"],
  canopy: ["pantherchameleon", "veiledchameleon", "emeraldtreeboa", "bluepitviper", "leaftailgecko", "boomslang"],
  lagoon: ["gharial", "pignoseturtle", "matamata", "alligatorsnapper", "fwc_lavender", "spectacledcaiman"],
  outback: ["crocmonitor", "ackiemonitor", "komodo", "blackdragon", "frilledlizard", "bluetongueskink"],
};

const AMBASSADORS = ["leopardgecko", "crestedgecko", "boxturtle", "ackiemonitor"];

export function enterReptileHouse(o) {
  const { root, s, drawFox, fur, tailsN, toast, ping, save, hud, onLeave } = o;

  const box = document.createElement("div");
  box.className = "rm rm-explore";
  box.innerHTML = `
    <div style="position:relative;width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;background:radial-gradient(circle at top,#1c3528,#0b1512);padding:12px;box-sizing:border-box;overflow:hidden">
      <div style="display:flex;justify-content:space-between;align-items:center;width:100%;max-width:820px;margin-bottom:8px;color:#fff;gap:8px;flex-wrap:wrap">
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
          <strong style="font-size:15px">🦎 Sunscale Reptile House</strong>
          <span class="pill" id="rh-count" style="background:rgba(184,242,58,.16);border-color:rgba(184,242,58,.45);color:#d8ffb0">0/63 Collected</span>
          <span class="pill" id="rh-mon">0 mon</span>
          <span class="pill" id="rh-bells">0 Bells</span>
        </div>
        <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">
          <button type="button" class="btn btn-sm" id="rh-codex-btn">Odds &amp; 63 Codex</button>
          <button type="button" class="btn btn-sm" id="rh-out">Exit (Esc)</button>
        </div>
      </div>
      <div style="position:relative;width:100%;max-width:820px;aspect-ratio:760/460">
        <canvas id="rh-cv" width="760" height="460" style="width:100%;height:100%;border-radius:14px;border:2px solid #9be36d;box-shadow:0 18px 46px rgba(0,0,0,.55);background:#f4e6cf;cursor:pointer;display:block"></canvas>
        <div id="rh-modal" hidden style="position:absolute;inset:10px;border-radius:12px;background:rgba(16,24,20,.96);border:2px solid #8ad876;padding:14px;overflow:auto;color:#fff;z-index:4;box-shadow:0 16px 40px rgba(0,0,0,.7)"></div>
      </div>
      <div id="rh-prompt" style="margin-top:8px;min-height:36px;display:flex;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap"></div>
    </div>
  `;
  root.appendChild(box);

  const cv = box.querySelector("#rh-cv");
  const g = cv.getContext("2d");
  const promptEl = box.querySelector("#rh-prompt");
  const modalEl = box.querySelector("#rh-modal");

  let px = 380, py = 398, dir = "up", step = 0, alive = true, raf = 0, last = performance.now();
  let walkTarget = null;
  const keys = new Set();
  const sparks = [];
  const hearts = [];
  const imgCache = new Map();
  let roamers = [];
  let cricketCleanup = null;

  const sprite = (id) => {
    if (!imgCache.has(id)) {
      const im = new Image();
      im.src = petUrl(id, 2, "happy");
      imgCache.set(id, im);
    }
    return imgCache.get(id);
  };

  // Warm showcase tank sprites immediately
  Object.values(BAY_SPECIES).flat().forEach(sprite);

  function refreshHeader() {
    const xsState = xs();
    const collected = xsState ? REPTILE_IDS.filter((id) => !!xsState.pets?.[id]).length : 0;
    box.querySelector("#rh-count").textContent = `${collected}/${REPTILE_IDS.length} Reptiles`;
    box.querySelector("#rh-mon").textContent = `${Number(s.mon || 0).toLocaleString()} mon`;
    box.querySelector("#rh-bells").textContent = `${Number(xsState?.bells || 0).toLocaleString()} Bells`;
  }

  function rebuildRoamers() {
    const xsState = xs();
    const owned = xsState ? REPTILE_IDS.filter((id) => !!xsState.pets?.[id]) : [];
    const list = (owned.length ? owned.slice(0, 8) : AMBASSADORS);
    roamers = list.map((id, i) => {
      const ang = (i / list.length) * Math.PI * 2;
      const rx = 380 + Math.cos(ang) * 105;
      const ry = 232 + Math.sin(ang) * 70;
      sprite(id);
      return {
        id,
        owned: owned.includes(id),
        x: Math.max(230, Math.min(530, rx)),
        y: Math.max(150, Math.min(350, ry)),
        vx: (i % 2 ? 1 : -1) * (16 + (i % 3) * 5),
        vy: ((i + 1) % 2 ? 1 : -1) * (11 + (i % 4) * 3),
        pause: 0.4 * (i % 3),
        facing: i % 2 ? 1 : -1,
      };
    });
  }

  loadXmas().then(() => {
    if (!alive) return;
    refreshHeader();
    rebuildRoamers();
  }).catch(() => {});

  // Solid interior obstacles [x0, y0, x1, y1]
  const OBSTACLES = [
    [54, 72, 224, 152],   // Top-left Mesa terrarium
    [536, 72, 706, 152],  // Top-right Canopy terrarium
    [54, 286, 224, 366],  // Bottom-left Lagoon terrarium
    [536, 286, 706, 366], // Bottom-right Outback terrarium
    [340, 198, 420, 260], // Central Terrarium Pod rotunda plinth
    [322, 68, 438, 108],  // Keeper counter
  ];

  const isSolidPt = (x, y) => {
    if (x < 40 || x > 720 || y < 104 || y > 432) return true;
    return OBSTACLES.some(([x0, y0, x1, y1]) => x > x0 - 10 && x < x1 + 10 && y > y0 - 8 && y < y1 + 8);
  };

  function addBurst(x, y, col = "#ffd84d", n = 26) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = 45 + Math.random() * 110;
      sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1, col });
    }
  }

  function closeModal() {
    cricketCleanup?.();
    cricketCleanup = null;
    modalEl.hidden = true;
    modalEl.innerHTML = "";
    box.focus?.();
  }

  function openModal(html, bind) {
    cricketCleanup?.();
    cricketCleanup = null;
    keys.clear();
    walkTarget = null;
    modalEl.hidden = false;
    modalEl.innerHTML = html;
    bind?.(modalEl);
  }

  const XAdapter = { xs, save: saveXmas, earn, grant, isSeason };

  async function doHatch(currency) {
    await loadXmas().catch(() => {});
    const xsState = xs();
    if (!xsState) return toast("Could not access pet storage.");
    const sc = ensureSanctuary(xsState);
    if ((sc.adopts || 0) >= DAILY_POD_CAP) {
      return toast(`Daily Terrarium Pod limit reached (${DAILY_POD_CAP}/${DAILY_POD_CAP}). Come back tomorrow or play Cricket Catch!`);
    }
    if (currency === "mon") {
      if ((s.mon || 0) < 75) return toast("Need 75 mon to hatch a Terrarium Pod.");
      s.mon -= 75;
      save();
    } else {
      if ((xsState.bells || 0) < 50) return toast("Need 50 Snowbells to hatch a Terrarium Pod.");
      xsState.bells -= 50;
    }
    sc.adopts = (sc.adopts || 0) + 1;
    const res = rollReptilePod(XAdapter);
    if (REPTILE_IDS.every((id) => !!xsState.pets?.[id]) && !xsState.herpChamp) {
      xsState.herpChamp = 1;
      grant(1000);
      saveXmas();
      toast("👑 Grand Herpetologist! Collected all 63 reptiles: +1,000 Snowbells!");
    }
    addBurst(380, 224, REPTILE_TIERS[res.tier].color, 42);
    ping?.("done");
    refreshHeader();
    rebuildRoamers();
    hud?.();
    showHatchModal(res);
  }

  function showPodMenu() {
    const xsState = xs();
    const sc = xsState ? ensureSanctuary(xsState) : { adopts: 0 };
    const left = Math.max(0, DAILY_POD_CAP - (sc.adopts || 0));
    const monOk = (s.mon || 0) >= 75 && left > 0;
    const bellOk = (xsState?.bells || 0) >= 50 && left > 0;
    openModal(`
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <h2 style="margin:0">🥚 Central Terrarium Egg Pods</h2>
        <button type="button" class="btn btn-sm" id="rh-mclose">Close</button>
      </div>
      <p class="muted" style="margin-top:0">Hatch one of our glass botanical Terrarium Pods to welcome one of <strong>63 anatomically faithful reptiles</strong> into your collection (${left}/${DAILY_POD_CAP} hatches remaining today).</p>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px;margin:12px 0">
        ${Object.values(REPTILE_TIERS).map((t) => `
          <div style="padding:8px;border-radius:10px;border:1px solid ${t.color}66;background:rgba(255,255,255,.04)">
            <strong style="color:${t.color}">${esc(t.label)}</strong>
            <div style="font-size:16px;font-weight:800">${esc(t.totalPct)}</div>
            <small class="muted">${esc(t.perPct)} each</small>
          </div>
        `).join("")}
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:12px">
        <button type="button" class="btn btn-accent" id="rh-buy-mon" ${monOk ? "" : "disabled"}>Hatch Terrarium Pod · 75 mon</button>
        <button type="button" class="btn btn-accent" id="rh-buy-bell" ${bellOk ? "" : "disabled"}>Hatch Terrarium Pod · 50 Snowbells</button>
        <button type="button" class="btn" id="rh-see-codex">Inspect Full Odds &amp; 63 Codex</button>
      </div>
    `, (el) => {
      el.querySelector("#rh-mclose").onclick = closeModal;
      el.querySelector("#rh-buy-mon").onclick = () => doHatch("mon");
      el.querySelector("#rh-buy-bell").onclick = () => doHatch("bell");
      el.querySelector("#rh-see-codex").onclick = () => showCodex();
    });
  }

  function showHatchModal(res) {
    const tierInfo = REPTILE_TIERS[res.tier];
    const [sci, habit, , chance] = res.meta;
    const xsState = xs();
    const sc = xsState ? ensureSanctuary(xsState) : { adopts: 0 };
    const left = Math.max(0, DAILY_POD_CAP - (sc.adopts || 0));
    openModal(`
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span class="pill" style="color:${tierInfo.color};border-color:${tierInfo.color}">${esc(tierInfo.label)} · ${esc(chance)}</span>
        <button type="button" class="btn btn-sm" id="rh-mclose">Close</button>
      </div>
      <div style="display:flex;gap:18px;align-items:center;flex-wrap:wrap;margin:12px 0">
        <div style="width:128px;height:128px;flex:0 0 128px;background:radial-gradient(circle,${tierInfo.color}33,transparent);border-radius:16px;display:grid;place-items:center">
          ${petSvg(res.id, 2, "happy", { size: 116 })}
        </div>
        <div style="flex:1;min-width:220px">
          <h2 style="margin:0 0 4px">${esc(res.sp[1])}</h2>
          <p class="muted" style="margin:0 0 6px"><i>${esc(sci)}</i> · ${esc(habit)}</p>
          <p style="margin:0 0 8px">${esc(res.sp[8])}</p>
          <p style="margin:0;color:${res.dupe ? "#ffd84d" : "#8cff98"};font-weight:700">
            ${res.dupe ? "Duplicate hatch → +60 XP &amp; 100% Joy!" : "New discovery! Added to your Herpetarium &amp; Winterfest Pets!"}
          </p>
        </div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button type="button" class="btn btn-accent" id="rh-again-mon" ${left > 0 && (s.mon || 0) >= 75 ? "" : "disabled"}>Hatch Again (75 mon)</button>
        <button type="button" class="btn btn-accent" id="rh-again-bell" ${left > 0 && (xsState?.bells || 0) >= 50 ? "" : "disabled"}>Hatch Again (50 Snowbells)</button>
        <button type="button" class="btn" id="rh-codex">View 63 Codex</button>
      </div>
    `, (el) => {
      el.querySelector("#rh-mclose").onclick = closeModal;
      el.querySelector("#rh-again-mon").onclick = () => doHatch("mon");
      el.querySelector("#rh-again-bell").onclick = () => doHatch("bell");
      el.querySelector("#rh-codex").onclick = () => showCodex();
    });
  }

  function showHabitatModal(zoneId) {
    const hab = HABITATS[zoneId];
    const list = REPTILE_LIST.filter((r) => r.zone === zoneId);
    const xsState = xs();
    const gotN = list.filter((r) => !!xsState?.pets?.[r.id]).length;
    openModal(`
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;gap:8px">
        <div>
          <h2 style="margin:0">${hab.badge} ${esc(hab.name)} (${gotN}/${list.length})</h2>
          <small class="muted">${esc(hab.desc)}</small>
        </div>
        <button type="button" class="btn btn-sm" id="rh-mclose">Close</button>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:8px;margin-top:10px">
        ${list.map((r) => {
          const sp = species(r.id);
          const t = REPTILE_TIERS[r.tier];
          const got = !!xsState?.pets?.[r.id];
          return `
            <div style="display:flex;gap:8px;align-items:center;padding:8px;border-radius:10px;border:1px solid ${got ? t.color : "rgba(255,255,255,.15)"};background:rgba(255,255,255,${got ? ".07" : ".02"})">
              <div style="width:62px;height:62px;flex:0 0 62px">${petSvg(r.id, got ? 2 : 1, got ? "happy" : "sleepy", { size: 62 })}</div>
              <div style="min-width:0">
                <strong style="font-size:13px">${esc(sp[1])}</strong>
                <div><span class="pill" style="color:${t.color};font-size:10px">${esc(t.label)} · ${esc(r.chance)}</span></div>
                <small class="muted" style="display:block"><i>${esc(r.sci)}</i></small>
                <small style="color:${got ? "#9effa8" : "#aaa"}">${got ? "In Collection ✓" : "Terrarium Pod / Egg"}</small>
              </div>
            </div>`;
        }).join("")}
      </div>
    `, (el) => {
      el.querySelector("#rh-mclose").onclick = closeModal;
    });
  }

  function showCodex(filterTier = "all") {
    const xsState = xs();
    const list = filterTier === "all" ? REPTILE_LIST : REPTILE_LIST.filter((r) => r.tier === filterTier);
    const totalOwned = REPTILE_IDS.filter((id) => !!xsState?.pets?.[id]).length;
    openModal(`
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:8px;flex-wrap:wrap">
        <div>
          <h2 style="margin:0">📋 Sunscale Rarity Board &amp; Herpetarium Codex (${totalOwned}/63)</h2>
          <small class="muted">Common 55% (13) · Rare 28% (12) · Epic 12% (19) · Legendary 4.845% (15) · Chase 0.155% (4)</small>
        </div>
        <button type="button" class="btn btn-sm" id="rh-mclose">Close</button>
      </div>
      <div class="chips" style="margin-bottom:10px">
        <button type="button" class="chip${filterTier === "all" ? " on" : ""}" data-tf="all">All (63)</button>
        ${Object.values(REPTILE_TIERS).map((t) => `<button type="button" class="chip${filterTier === t.key ? " on" : ""}" data-tf="${t.key}" style="color:${t.color}">${esc(t.label)} · ${esc(t.totalPct)}</button>`).join("")}
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:8px">
        ${list.map((r) => {
          const sp = species(r.id);
          const t = REPTILE_TIERS[r.tier];
          const got = !!xsState?.pets?.[r.id];
          return `
            <div style="display:flex;gap:8px;align-items:center;padding:8px;border-radius:10px;border:1px solid ${got ? t.color : "rgba(255,255,255,.15)"};opacity:${got ? 1 : 0.78}">
              <div style="width:58px;height:58px;flex:0 0 58px">${petSvg(r.id, got ? 2 : 1, got ? "happy" : "sleepy", { size: 58 })}</div>
              <div style="min-width:0">
                <strong style="font-size:12.5px">${esc(sp[1])}</strong>
                <div><span class="pill" style="color:${t.color};font-size:10px">${esc(t.label)} · ${esc(r.chance)}</span></div>
                <small class="muted" style="display:block"><i>${esc(r.sci)}</i></small>
                <small style="color:${got ? "#9effa8" : "#bbb"}">${got ? "Owned ✓" : esc(HABITATS[r.zone].name)}</small>
              </div>
            </div>`;
        }).join("")}
      </div>
    `, (el) => {
      el.querySelector("#rh-mclose").onclick = closeModal;
      el.querySelectorAll("[data-tf]").forEach((btn) => {
        btn.onclick = () => showCodex(btn.dataset.tf);
      });
    });
  }

  function showCricketModal() {
    const xsState = xs();
    const sc = xsState ? ensureSanctuary(xsState) : { plays: 0, freeDay: "" };
    const runsLeft = Math.max(0, DAILY_CRICKET_CAP - (sc.plays || 0));
    const freeLeft = sc.freeDay !== today();
    const unhurried = !!settings.world?.unhurried;
    let left = unhurried ? 28 : 20;
    let score = 0;
    openModal(`
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <div>
          <h2 style="margin:0">🦗 Feeder Cricket Catch</h2>
          <small class="muted">${runsLeft}/${DAILY_CRICKET_CAP} rewarded runs today${freeLeft ? " · Score 12+ for 1 free Terrarium Pod!" : ""}</small>
        </div>
        <button type="button" class="btn btn-sm" id="rh-mclose">Close</button>
      </div>
      <div style="display:flex;justify-content:space-between;margin:8px 0;font-size:16px">
        <strong id="rh-ck-sc">Crickets: 0</strong>
        <strong id="rh-ck-tm">${left}s</strong>
      </div>
      <div id="rh-ck-arena" style="position:relative;height:220px;border-radius:12px;border:2px solid #9be36d;background:radial-gradient(circle at 30% 30%,#38543f,#272219);overflow:hidden;cursor:pointer">
        <button type="button" id="rh-ck-bug" style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);font-size:30px;background:none;border:none;cursor:pointer;padding:8px">🦗</button>
      </div>
    `, (el) => {
      const bug = el.querySelector("#rh-ck-bug");
      const hop = () => {
        bug.style.left = `${12 + Math.random() * 76}%`;
        bug.style.top = `${16 + Math.random() * 68}%`;
      };
      bug.onclick = () => {
        score++;
        el.querySelector("#rh-ck-sc").textContent = `Crickets: ${score}`;
        ping?.("blip");
        hop();
      };
      const hopT = setInterval(hop, unhurried ? 1550 : 1000);
      const secT = setInterval(() => {
        left--;
        const tmEl = el.querySelector("#rh-ck-tm");
        if (tmEl) tmEl.textContent = `${left}s`;
        if (left <= 0) {
          clearInterval(hopT);
          clearInterval(secT);
          let bells = 0;
          let bonusMon = 0;
          let freeMsg = "";
          const rewarded = (sc.plays || 0) < DAILY_CRICKET_CAP;
          if (rewarded) {
            sc.plays = (sc.plays || 0) + 1;
            if (xsState) bells = earn(Math.min(40, 8 + score * 2), { bonus: false });
            bonusMon = Math.min(35, 10 + score);
            s.mon += bonusMon;
            save();
          }
          if (xsState && score >= 12 && sc.freeDay !== today()) {
            sc.freeDay = today();
            const r = rollReptilePod(XAdapter);
            freeMsg = r.dupe ? ` Daily Free Pod: ${r.sp[1]} (+60 XP)!` : ` Daily Free Pod hatched: ${r.sp[1]}!`;
          }
          saveXmas();
          ping?.("done");
          refreshHeader();
          rebuildRoamers();
          hud?.();
          toast(`Caught ${score} crickets! ${rewarded ? `+${bonusMon} mon${bells ? `, +${bells} Snowbells` : ""}.` : "(Daily reward cap reached.)"}${freeMsg}`);
          closeModal();
        }
      }, 1000);
      cricketCleanup = () => {
        clearInterval(hopT);
        clearInterval(secT);
      };
      el.querySelector("#rh-mclose").onclick = closeModal;
    });
  }

  const leave = () => {
    if (!alive) return;
    alive = false;
    cricketCleanup?.();
    cancelAnimationFrame(raf);
    window.removeEventListener("keydown", onKey, true);
    window.removeEventListener("keyup", onUp, true);
    box.remove();
    onLeave?.();
  };

  box.querySelector("#rh-out").onclick = leave;
  box.querySelector("#rh-codex-btn").onclick = () => showCodex();

  cv.addEventListener("pointerdown", (e) => {
    if (!modalEl.hidden) return;
    const rect = cv.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 760;
    const y = ((e.clientY - rect.top) / rect.height) * 460;
    walkTarget = { x: Math.max(46, Math.min(714, x)), y: Math.max(112, Math.min(426, y)) };
  });

  const STATIONS = [
    { id: "pods", x: 380, y: 232, r: 84, label: "Hatch Terrarium Egg Pod (63 Reptiles)", go: showPodMenu },
    { id: "mesa", x: 140, y: 158, r: 62, label: "Inspect Arid Basking Mesa", go: () => showHabitatModal("mesa") },
    { id: "canopy", x: 620, y: 158, r: 62, label: "Inspect Emerald Canopy Atrium", go: () => showHabitatModal("canopy") },
    { id: "lagoon", x: 140, y: 280, r: 62, label: "Inspect Sunlit Mangrove Lagoon", go: () => showHabitatModal("lagoon") },
    { id: "outback", x: 620, y: 280, r: 62, label: "Inspect Outback Varanid Pavilion", go: () => showHabitatModal("outback") },
    { id: "keeper", x: 380, y: 120, r: 54, label: "Rarity Odds Board & 63-Species Codex", go: () => showCodex() },
    { id: "cricket", x: 266, y: 124, r: 46, label: "Play Cricket Catch Feeder Table", go: showCricketModal },
    { id: "door", x: 380, y: 428, r: 34, label: "Exit Reptile House to Kitsune World", go: leave },
  ];

  function nearbyTarget() {
    let best = null;
    let bd = 1e9;
    for (const st of STATIONS) {
      const d = Math.hypot(st.x - px, st.y - py);
      if (d < st.r && d < bd) {
        bd = d;
        best = st;
      }
    }
    if (best) return best;
    for (const rm of roamers) {
      const d = Math.hypot(rm.x - px, rm.y - py);
      if (d < 46 && d < bd) {
        bd = d;
        const sp = species(rm.id);
        best = {
          label: `Pet ${sp ? sp[1] : rm.id}${rm.owned ? "" : " (House Ambassador)"}`,
          go: () => {
            hearts.push({ x: rm.x, y: rm.y - 18, vy: -32, life: 1 });
            ping?.("blip");
            const xsState = xs();
            if (rm.owned && xsState?.pets?.[rm.id]) {
              xsState.pets[rm.id].joy = Math.min(100, (xsState.pets[rm.id].joy || 0) + 4);
              xsState.pets[rm.id].xp = (xsState.pets[rm.id].xp || 0) + 2;
              saveXmas();
              toast(`${sp[1]} basks happily (+2 XP)!`);
            } else {
              toast(`${sp ? sp[1] : "Little reptile"} flicks a cheerful tongue hello!`);
            }
          },
        };
      }
    }
    return best;
  }

  const onKey = (e) => {
    if (!alive || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key.toLowerCase();
    e.stopPropagation();
    if (k === "escape") {
      e.preventDefault();
      if (!modalEl.hidden) closeModal();
      else leave();
      return;
    }
    if (!modalEl.hidden) return;
    if (k === "e" || k === " " || k === "enter") {
      e.preventDefault();
      if (!e.repeat) nearbyTarget()?.go();
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

  function drawTerrariumBay(x, y, w, h, hab, zoneId, now) {
    const bgCols = {
      mesa: ["#d88f54", "#8f4d28"],
      canopy: ["#267848", "#103a24"],
      lagoon: ["#227aa0", "#0e3c56"],
      outback: ["#b85838", "#583420"],
    }[zoneId];
    const grd = g.createLinearGradient(x, y, x, y + h);
    grd.addColorStop(0, bgCols[0]);
    grd.addColorStop(1, bgCols[1]);
    g.fillStyle = grd;
    g.beginPath();
    g.roundRect(x, y, w, h, 10);
    g.fill();

    // Soft heat/sun basking glow
    g.fillStyle = "rgba(255,240,180,.18)";
    g.beginPath();
    g.arc(x + w * 0.5, y + 18, 42, 0, Math.PI * 2);
    g.fill();

    // Habitat decor silhouettes
    g.fillStyle = "rgba(0,0,0,.22)";
    if (zoneId === "mesa") {
      g.fillRect(x + 12, y + 48, 44, 18);
      g.fillRect(x + w - 58, y + 44, 46, 22);
    } else if (zoneId === "canopy") {
      g.strokeStyle = "#4d341f";
      g.lineWidth = 5;
      g.beginPath();
      g.moveTo(x + 12, y + 54);
      g.quadraticCurveTo(x + w / 2, y + 32, x + w - 12, y + 50);
      g.stroke();
    } else if (zoneId === "lagoon") {
      g.fillStyle = "rgba(110,235,255,.26)";
      g.fillRect(x + 8, y + h - 24, w - 16, 18);
    } else {
      g.fillStyle = "rgba(210,120,70,.35)";
      g.fillRect(x + 20, y + 48, w - 40, 20);
    }

    // Showcase live SVG sprites basking inside the tank
    const ids = BAY_SPECIES[zoneId].slice(0, 3);
    ids.forEach((id, i) => {
      const im = sprite(id);
      const sx = x + 12 + i * 50;
      const sy = y + 20 + Math.sin(now / 900 + i * 2) * 2;
      if (im.complete && im.naturalWidth) g.drawImage(im, sx, sy, 44, 44);
    });

    // Glass frame + nameplate
    g.strokeStyle = hab.color;
    g.lineWidth = 3;
    g.beginPath();
    g.roundRect(x, y, w, h, 10);
    g.stroke();

    g.fillStyle = "rgba(14,22,18,.88)";
    g.beginPath();
    g.roundRect(x + 12, y - 10, w - 24, 18, 6);
    g.fill();
    g.fillStyle = "#fff";
    g.font = "700 10.5px system-ui";
    g.textAlign = "center";
    g.fillText(`${hab.badge} ${hab.name}`, x + w / 2, y + 2);
  }

  const frame = (now) => {
    if (!alive || !box.isConnected) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    if (modalEl.hidden) {
      let ax = 0;
      let ay = 0;
      if (keys.has("a") || keys.has("arrowleft")) ax--;
      if (keys.has("d") || keys.has("arrowright")) ax++;
      if (keys.has("w") || keys.has("arrowup")) ay--;
      if (keys.has("s") || keys.has("arrowdown")) ay++;

      if (!ax && !ay && walkTarget) {
        const dx = walkTarget.x - px;
        const dy = walkTarget.y - py;
        const dist = Math.hypot(dx, dy);
        if (dist < 6) {
          walkTarget = null;
        } else {
          ax = dx / dist;
          ay = dy / dist;
        }
      }

      const moving = !!(ax || ay);
      if (moving) {
        const m = Math.hypot(ax, ay);
        const nx = px + (ax / m) * 210 * dt;
        const ny = py + (ay / m) * 210 * dt;
        if (!isSolidPt(nx, py)) px = nx;
        if (!isSolidPt(px, ny)) py = ny;
        dir = Math.abs(ax) > Math.abs(ay) ? (ax < 0 ? "left" : "right") : (ay < 0 ? "up" : "down");
        step += dt * 12;
      }

      // Move wandering reptiles gently around aisles
      for (const rm of roamers) {
        rm.pause -= dt;
        if (rm.pause <= 0) {
          const nx = rm.x + rm.vx * dt;
          const ny = rm.y + rm.vy * dt;
          if (nx < 230 || nx > 530 || isSolidPt(nx, rm.y)) {
            rm.vx = -rm.vx;
          } else {
            rm.x = nx;
          }
          if (ny < 145 || ny > 375 || isSolidPt(rm.x, ny)) {
            rm.vy = -rm.vy;
          } else {
            rm.y = ny;
          }
          rm.facing = rm.vx < 0 ? -1 : 1;
          if (Math.random() < 0.008) rm.pause = 0.8 + Math.random() * 1.4;
        }
      }
    }

    // Update particles
    for (let i = sparks.length - 1; i >= 0; i--) {
      const p = sparks[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt * 1.4;
      if (p.life <= 0) sparks.splice(i, 1);
    }
    for (let i = hearts.length - 1; i >= 0; i--) {
      const h = hearts[i];
      h.y += h.vy * dt;
      h.life -= dt * 1.1;
      if (h.life <= 0) hearts.splice(i, 1);
    }

    // 1. Bright Warm Timber & Glass Skylight Header Wall
    g.fillStyle = "#224634";
    g.fillRect(0, 0, 760, 88);
    g.fillStyle = "#f4e6cf";
    g.fillRect(0, 88, 760, 372);

    // Checkerboard boutique conservatory tile floor
    for (let ty = 88; ty < 460; ty += 34) {
      for (let tx = 0; tx < 760; tx += 34) {
        if (((tx / 34) + (ty / 34)) % 2 === 0) {
          g.fillStyle = "rgba(214,186,144,.32)";
          g.fillRect(tx, ty, 34, 34);
        }
      }
    }

    // Sunbeam conservatory skylights across floor
    g.save();
    g.fillStyle = "rgba(255,248,204,.24)";
    for (const sx of [160, 380, 590]) {
      g.beginPath();
      g.moveTo(sx - 50, 88);
      g.lineTo(sx + 50, 88);
      g.lineTo(sx + 100, 440);
      g.lineTo(sx - 10, 440);
      g.closePath();
      g.fill();
    }
    g.restore();

    // Arched Skylight Panes along top wall
    for (let wx = 44; wx < 720; wx += 112) {
      g.fillStyle = "#aee6e8";
      g.beginPath();
      g.roundRect(wx, 12, 82, 54, [24, 24, 4, 4]);
      g.fill();
      g.strokeStyle = "#d9a84e";
      g.lineWidth = 2;
      g.stroke();
    }

    // Center Botanical Rug
    g.fillStyle = "#2b6e52";
    g.beginPath();
    g.ellipse(380, 232, 118, 80, 0, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = "#ffd27a";
    g.lineWidth = 3;
    g.stroke();

    // Central Incubator Rotunda (3 glowing Terrarium Egg Pods)
    g.fillStyle = "#5c3e26";
    g.beginPath();
    g.ellipse(380, 238, 42, 26, 0, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = "#f2c652";
    g.lineWidth = 2.5;
    g.stroke();

    const podCols = ["#7fe8ff", "#ffd84d", "#ff84c8"];
    [
      [356, 224],
      [380, 212],
      [404, 224],
    ].forEach(([px0, py0], i) => {
      const bob = Math.sin(now / 450 + i * 2) * 2.5;
      g.fillStyle = podCols[i];
      g.globalAlpha = 0.25;
      g.beginPath();
      g.arc(px0, py0 + bob, 14, 0, Math.PI * 2);
      g.fill();
      g.globalAlpha = 1;
      g.fillStyle = "#fff9ec";
      g.strokeStyle = podCols[i];
      g.lineWidth = 2;
      g.beginPath();
      g.ellipse(px0, py0 + bob, 8.5, 11.5, 0, 0, Math.PI * 2);
      g.fill();
      g.stroke();
    });

    // Keeper Counter & Odds Board
    g.fillStyle = "#6c482c";
    g.beginPath();
    g.roundRect(322, 72, 116, 32, 6);
    g.fill();
    g.strokeStyle = "#ffd27a";
    g.lineWidth = 2;
    g.stroke();
    g.fillStyle = "#fff";
    g.font = "700 10px system-ui";
    g.textAlign = "center";
    g.fillText("📋 ODDS & CODEX", 380, 92);

    // Cricket Catch Bench
    g.fillStyle = "#3f6a3c";
    g.beginPath();
    g.roundRect(236, 76, 62, 28, 6);
    g.fill();
    g.strokeStyle = "#b8f23a";
    g.stroke();
    g.fillStyle = "#fff";
    g.font = "700 10px system-ui";
    g.fillText("🦗 CRICKETS", 267, 94);

    // 4 Live Glass Terrarium Exhibits
    drawTerrariumBay(54, 72, 170, 80, HABITATS.mesa, "mesa", now);
    drawTerrariumBay(536, 72, 170, 80, HABITATS.canopy, "canopy", now);
    drawTerrariumBay(54, 286, 170, 80, HABITATS.lagoon, "lagoon", now);
    drawTerrariumBay(536, 286, 170, 80, HABITATS.outback, "outback", now);

    // Exit Mat
    g.fillStyle = "#8a3632";
    g.fillRect(344, 424, 72, 24);
    g.strokeStyle = "#ffd27a";
    g.lineWidth = 2;
    g.strokeRect(344, 424, 72, 24);
    g.fillStyle = "#fff";
    g.font = "700 10px system-ui";
    g.textAlign = "center";
    g.fillText("EXIT", 380, 440);

    // Depth-sorted Entities (Roaming Reptiles + Player Fox)
    const ents = [];
    for (const rm of roamers) {
      ents.push([rm.y, () => {
        const im = sprite(rm.id);
        g.fillStyle = "rgba(0,0,0,.16)";
        g.beginPath();
        g.ellipse(rm.x, rm.y + 12, 13, 5, 0, 0, Math.PI * 2);
        g.fill();
        if (im.complete && im.naturalWidth) {
          g.save();
          g.translate(rm.x, rm.y + Math.sin(now / 180 + rm.x) * 1.6);
          if (rm.facing < 0) g.scale(-1, 1);
          g.drawImage(im, -18, -22, 36, 36);
          g.restore();
        }
      }]);
    }
    ents.push([py, () => drawFox(g, px, py, dir, step, fur, tailsN, s.hat, now, !modalEl.hidden ? false : !!(keys.size || walkTarget))]);
    ents.sort((a, b) => a[0] - b[0]);
    for (const e of ents) e[1]();

    // Particles
    for (const p of sparks) {
      g.globalAlpha = Math.max(0, p.life);
      g.fillStyle = p.col;
      g.fillRect(p.x - 2.5, p.y - 2.5, 5, 5);
    }
    g.globalAlpha = 1;
    for (const h of hearts) {
      g.globalAlpha = Math.max(0, h.life);
      g.fillStyle = "#ff4f7a";
      g.font = "700 15px system-ui";
      g.textAlign = "center";
      g.fillText("♥", h.x, h.y);
    }
    g.globalAlpha = 1;

    // Bottom prompt
    const hit = modalEl.hidden ? nearbyTarget() : null;
    const lbl = hit ? hit.label : "";
    if (promptEl.dataset.lbl !== lbl) {
      promptEl.dataset.lbl = lbl;
      if (hit) {
        promptEl.innerHTML = `<button type="button" class="btn btn-accent btn-sm" id="rh-act"><kbd>E</kbd> ${esc(hit.label)}</button>`;
        promptEl.querySelector("#rh-act").onclick = hit.go;
      } else {
        promptEl.innerHTML = `<span class="muted">Walk or click/tap to explore the conservatory — approach pods, terrariums, keeper counter, or roaming reptiles!</span>`;
      }
    } else if (hit) {
      const btn = promptEl.querySelector("#rh-act");
      if (btn) btn.onclick = hit.go;
    }

    raf = requestAnimationFrame(frame);
  };

  raf = requestAnimationFrame(frame);
  return leave;
}
