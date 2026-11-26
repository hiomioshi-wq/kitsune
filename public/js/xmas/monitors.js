// Monitor Sanctuary Event: Crocodile Monitor, Ackie Monitor, Argus Monitor & 9 more Varanus pets with Cricket Catch minigame & Field Guide.
import { esc, today } from "../util.js";
import { species, RARITY } from "./data.js";
import { petSvg } from "./art.js";
import { xs, loadXmas, save as saveXmas, earn, grant, isSeason } from "./core.js";
import { settings } from "../store.js";

export const MONITOR_META = {
  savannahmonitor: ["Varanus exanthematicus", "Sub-Saharan Savanna"],
  ackiemonitor: ["Varanus acanthurus", "Australian Outback"],
  nilemonitor: ["Varanus niloticus", "Riverbanks & Reeds"],
  watermonitor: ["Varanus salvator", "Mangroves & Lagoons"],
  argusmonitor: ["Varanus panoptes", "Northern Grasslands"],
  lacemonitor: ["Varanus varius", "Eucalyptus Canopy"],
  perentie: ["Varanus giganteus", "Red Desert Outcrops"],
  treemonitor: ["Varanus prasinus", "Emerald Rainforest"],
  bluemonitor: ["Varanus doreanus", "Papuan River Forests"],
  crocmonitor: ["Varanus salvadorii", "High Papuan Canopy (Hatch/Mastery)"],
  blackdragon: ["Varanus salvator (Melanistic Morph)", "Rare Water Monitor Variant"],
  komodo: ["Varanus komodoensis", "Sunlit Volcanic Isles (Hatch/Mastery)"],
};

export const MONITOR_IDS = Object.keys(MONITOR_META);
const ADOPT_POOL = MONITOR_IDS.filter((id) => species(id)?.[2] !== "l");

function adoptMonitor(X) {
  const s = X.xs();
  const weighted = [];
  for (const id of ADOPT_POOL) {
    const r = species(id)?.[2] || "c";
    const w = r === "c" ? 6 : r === "r" ? 3 : 1;
    for (let i = 0; i < w; i++) weighted.push(id);
  }
  let pick = weighted[Math.floor(Math.random() * weighted.length)];
  // 0.4% rare chase variant (~1 in 2,080 adoptions): rolling an Asian Water Monitor can produce the melanistic Black Dragon morph!
  if (pick === "watermonitor" && Math.random() < 0.004) pick = "blackdragon";
  const sp = species(pick);
  if (s.pets[pick]) {
    s.pets[pick].xp = (s.pets[pick].xp || 0) + 50;
    s.pets[pick].joy = 100;
    X.save();
    return { dupe: true, sp };
  }
  s.pets[pick] = { sp: pick, name: sp[1], xp: 0, hunger: 90, joy: 95, at: Date.now(), born: today() };
  if (!s.active) s.active = pick;
  X.save();
  return { dupe: false, sp };
}

export async function mountMonitorEvent(host, ui = {}) {
  await loadXmas().catch(() => {});
  const X = { xs, save: saveXmas, earn, grant, isSeason };
  let playing = false;
  let lastRes = "";

  function ensureSanctuary(s) {
    const sc = (s.sanctuary ||= { day: "", plays: 0, freeDay: "", adopts: 0 });
    if (sc.day !== today()) { sc.day = today(); sc.plays = 0; sc.adopts = 0; }
    return sc;
  }

  function render() {
    const s = xs();
    if (!s) { host.innerHTML = `<p class="muted">Could not load Monitor Sanctuary.</p>`; return; }
    const sc = ensureSanctuary(s);
    const owned = MONITOR_IDS.filter((id) => !!s.pets[id]);
    const allDone = owned.length === MONITOR_IDS.length;
    if (allDone && !s.monitorChamp) {
      s.monitorChamp = 1;
      grant(500);
      saveXmas();
      lastRes = "👑 Grand Monitor Keeper! Collected all 12 Varanus forms: +500 Snowbells!";
    }

    const cards = MONITOR_IDS.map((id) => {
      const sp = species(id);
      const got = s.pets[id];
      const [sci, hab] = MONITOR_META[id];
      const rar = RARITY[sp[2]];
      return `<article class="xm-petcard" style="padding:10px;border:1px solid ${got ? rar[1] : "rgba(255,255,255,.14)"};border-radius:12px;opacity:${got ? 1 : 0.72}">
        <div style="display:flex;gap:10px;align-items:center">
          <div style="width:76px;height:76px;flex:0 0 76px">${petSvg(id, got ? 2 : 1, got ? "happy" : "sleepy", { size: 76 })}</div>
          <div style="min-width:0">
            <strong>${esc(sp[1])}</strong>
            <div><span class="pill" style="color:${rar[1]}">${rar[0]}</span> <small class="muted"><i>${esc(sci)}</i></small></div>
            <small class="muted" style="display:block;margin-top:3px">${esc(hab)}</small>
            <small style="display:block;margin-top:3px">${got ? "In your Sanctuary ✓" : sp[2] === "l" ? "Legendary — Egg Hatch / Rare Morph" : esc(sp[8])}</small>
          </div>
        </div>
      </article>`;
    }).join("");

    const playsLeft = Math.max(0, 3 - sc.plays);
    const adoptsLeft = Math.max(0, 10 - (sc.adopts || 0));
    const freeLeft = sc.freeDay !== today();

    host.innerHTML = `
      <div class="xm-card" style="margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap">
          <div>
            <h2 style="margin:0">🦎 Monitor Sanctuary Event (${owned.length}/${MONITOR_IDS.length})</h2>
            <p class="muted" style="margin:4px 0 0">Adopt Common–Epic Varanus monitors (~1-in-2,000 chase chance for the melanistic Black Dragon morph! · ${adoptsLeft}/10 adoptions left today). Crocodile Monitor &amp; Komodo Dragon are hatch-only Legendaries. Cricket Catch: ${playsLeft}/3 rewarded runs today${freeLeft ? " · Free adoption ready at 12+!" : ""}.</p>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button type="button" class="btn btn-accent" id="mn-adopt" ${playing || !adoptsLeft || s.bells < 50 ? "disabled" : ""}>Adopt Monitor (50 Snowbells)</button>
            ${ui.worldMon ? `<button type="button" class="btn btn-accent" id="mn-adopt-mon" ${playing || !adoptsLeft || ui.mon() < 75 ? "disabled" : ""}>Adopt Monitor (75 mon)</button>` : ""}
            <button type="button" class="btn" id="mn-game">${playing ? "Close Cricket Catch" : "Play Cricket Catch"}</button>
          </div>
        </div>
        ${lastRes ? `<p class="xm-res" style="margin-top:8px">${esc(lastRes)}</p>` : ""}
        <div id="mn-stage" ${playing ? "" : "hidden"} style="margin-top:12px"></div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:10px">${cards}</div>
    `;

    host.querySelector("#mn-adopt").onclick = () => {
      if (playing || (sc.adopts || 0) >= 10 || s.bells < 50) return;
      s.bells -= 50;
      sc.adopts = (sc.adopts || 0) + 1;
      const r = adoptMonitor(X);
      lastRes = r.dupe ? `${r.sp[1]} duplicate → +50 XP & full joy!` : `Adopted ${r.sp[1]} (${RARITY[r.sp[2]][0]})!`;
      ui.ping?.("done");
      ui.hud?.();
      render();
    };

    const monBtn = host.querySelector("#mn-adopt-mon");
    if (monBtn) {
      monBtn.onclick = () => {
        if (playing || (sc.adopts || 0) >= 10 || !ui.spendMon?.(75)) return;
        sc.adopts = (sc.adopts || 0) + 1;
        const r = adoptMonitor(X);
        lastRes = r.dupe ? `${r.sp[1]} duplicate → +50 XP & full joy!` : `Adopted ${r.sp[1]} (${RARITY[r.sp[2]][0]})!`;
        ui.ping?.("done");
        ui.hud?.();
        render();
      };
    }

    host.querySelector("#mn-game").onclick = () => {
      playing = !playing;
      render();
      if (playing) startCricketGame(host.querySelector("#mn-stage"));
    };
  }

  function startCricketGame(stageEl) {
    const unhurried = !!settings.world?.unhurried;
    let left = unhurried ? 28 : 20;
    let score = 0;
    stageEl.innerHTML = `
      <div style="padding:12px;border-radius:12px;border:2px solid #8a7ac8;background:rgba(20,28,24,.88)">
        <div style="display:flex;justify-content:space-between;margin-bottom:8px">
          <strong id="mn-sc">Crickets: 0</strong>
          <strong id="mn-tm">${left}s</strong>
        </div>
        <div id="mn-rock" style="position:relative;height:160px;border-radius:10px;background:linear-gradient(180deg,#2d4034,#4a3b2a);overflow:hidden;cursor:pointer">
          <button type="button" id="mn-bug" style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);font-size:26px;background:none;border:none;cursor:pointer;padding:6px">🦗</button>
        </div>
      </div>`;
    const bug = stageEl.querySelector("#mn-bug");
    const hop = () => {
      bug.style.left = `${12 + Math.random() * 76}%`;
      bug.style.top = `${18 + Math.random() * 64}%`;
    };
    bug.onclick = () => {
      score++;
      stageEl.querySelector("#mn-sc").textContent = `Crickets: ${score}`;
      ui.ping?.("blip");
      hop();
    };
    const hopT = setInterval(hop, unhurried ? 1600 : 1050);
    const secT = setInterval(() => {
      if (!stageEl.isConnected || !playing) { clearInterval(hopT); clearInterval(secT); return; }
      left--;
      const el = stageEl.querySelector("#mn-tm");
      if (el) el.textContent = `${left}s`;
      if (left <= 0) {
        clearInterval(hopT);
        clearInterval(secT);
        const s = xs();
        const sc = ensureSanctuary(s);
        let bells = 0, bonusMon = 0;
        if (sc.plays < 3) {
          sc.plays++;
          bells = earn(Math.min(40, 8 + score * 2), { bonus: false });
          bonusMon = ui.worldMon ? Math.min(35, 10 + score) : 0;
          if (bonusMon) ui.addMon?.(bonusMon);
        }
        let msg = `Cricket Catch over! ${score} caught${bells || bonusMon ? `: +${bells} Snowbells${bonusMon ? ` & +${bonusMon} mon` : ""}` : " (daily reward cap reached)"}.`;
        if (score >= 12 && sc.freeDay !== today()) {
          sc.freeDay = today();
          const r = adoptMonitor(X);
          msg += ` Daily Bonus: ${r.dupe ? `${r.sp[1]} +50 XP` : `Adopted ${r.sp[1]}!`}!`;
        }
        saveXmas();
        lastRes = msg;
        playing = false;
        ui.ping?.("done");
        ui.hud?.();
        render();
      }
    }, 1000);
  }

  render();
}
