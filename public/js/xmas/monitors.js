// Sunscale Reptile House Hub: 63 reptiles across 5 tiers, exact drop probabilities, Terrarium Egg Pods, and Cricket Catch.
import { esc, today } from "../util.js";
import { species } from "./data.js";
import { petSvg } from "./art.js";
import { xs, loadXmas, save as saveXmas, earn, grant, isSeason } from "./core.js";
import { settings } from "../store.js";
import {
  REPTILE_TIERS,
  HABITATS,
  REPTILE_LIST,
  REPTILE_META,
  REPTILE_IDS,
  SIGNATURE_BEHAVIOURS,
  DAILY_POD_CAP,
  DAILY_CRICKET_CAP,
  ensureSanctuary,
  rollReptilePod,
} from "./reptiledata.js";

export { REPTILE_TIERS, HABITATS, REPTILE_LIST, REPTILE_META, REPTILE_IDS, rollReptilePod };
export const MONITOR_META = REPTILE_META;
export const MONITOR_IDS = REPTILE_IDS;

export async function mountMonitorEvent(host, ui = {}) {
  await loadXmas().catch(() => {});
  const X = { xs, save: saveXmas, earn, grant, isSeason };
  let playing = false;
  let lastRes = "";
  let filterTier = "all";
  const cardState = new Map();

  function render() {
    const s = xs();
    if (!s) {
      host.innerHTML = `<p class="muted">Could not load Sunscale Reptile House.</p>`;
      return;
    }
    const sc = ensureSanctuary(s);
    const owned = REPTILE_IDS.filter((id) => !!s.pets[id]);
    const allDone = owned.length === REPTILE_IDS.length;
    if (allDone && !s.herpChamp) {
      s.herpChamp = 1;
      grant(1000);
      saveXmas();
      lastRes = "👑 Grand Herpetologist! Collected all 63 Sunscale Reptile House pets: +1,000 Snowbells!";
    }

    const filtered =
      filterTier === "all" ? REPTILE_LIST
      : filterTier === "behaviours" ? REPTILE_LIST.filter((r) => !!SIGNATURE_BEHAVIOURS[r.id])
      : REPTILE_LIST.filter((r) => r.tier === filterTier);
    const cards = filtered.map((r) => {
      const sp = species(r.id);
      const got = s.pets[r.id];
      const t = REPTILE_TIERS[r.tier];
      const hab = HABITATS[r.zone];
      const sig = SIGNATURE_BEHAVIOURS[r.id];
      const st = cardState.get(r.id) || { act: "", mood: got ? "happy" : "sleepy" };
      const previewMood = sig ? st.mood : (got ? "happy" : "sleepy");
      const previewStage = got ? 2 : 1;
      return `
        <article class="xm-petcard" style="padding:10px;border:1px solid ${got ? t.color : "rgba(255,255,255,.14)"};border-radius:12px;opacity:${got ? 1 : 0.85}">
          <div style="display:flex;gap:10px;align-items:center">
            <div data-art="${r.id}" style="width:82px;height:82px;flex:0 0 82px">${petSvg(r.id, previewStage, previewMood, { size: 82, act: st.act })}</div>
            <div style="min-width:0;flex:1">
              <strong>${esc(sp[1])}</strong>
              <div>
                <span class="pill" style="color:${t.color};border-color:${t.color}66">${esc(t.label)} · ${esc(r.chance)}</span>
              </div>
              <small class="muted" style="display:block;margin-top:3px"><i>${esc(r.sci)}</i> · ${hab.badge} ${esc(hab.name)}</small>
              <small style="display:block;margin-top:3px">${got ? "In your Herpetarium ✓" : esc(sp[8])}</small>
              ${sig ? `<div style="margin-top:6px;display:flex;gap:6px;flex-wrap:wrap;align-items:center"><button type="button" class="btn btn-sm ${st.act ? "btn-accent" : ""}" data-sig="${r.id}">🎭 ${esc(sig.btn)}</button></div>` : ""}
            </div>
          </div>
        </article>`;
    }).join("");

    const playsLeft = Math.max(0, DAILY_CRICKET_CAP - (sc.plays || 0));
    const adoptsLeft = Math.max(0, DAILY_POD_CAP - (sc.adopts || 0));
    const freeLeft = sc.freeDay !== today();

    const tierCount = (k) => REPTILE_LIST.filter((r) => r.tier === k).length;

    host.innerHTML = `
      <div class="xm-card" style="margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap">
          <div>
            <h2 style="margin:0">🦎 Sunscale Reptile House (${owned.length}/${REPTILE_IDS.length})</h2>
            <p class="muted" style="margin:4px 0 0">Hatch glass Terrarium Pods for 63 faithful reptiles across 5 tiers (${adoptsLeft}/${DAILY_POD_CAP} hatches left today). Cricket Catch: ${playsLeft}/${DAILY_CRICKET_CAP} rewarded runs today${freeLeft ? " · Free pod ready at 12+!" : ""}.</p>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            ${ui.enterHouse
              ? `<button type="button" class="btn btn-accent" id="mn-walk">Walk Inside Reptile House</button>`
              : `<a class="btn btn-accent" href="#world/reptilehouse">Walk Inside Reptile House</a>`}
            <button type="button" class="btn" id="mn-adopt" ${playing || !adoptsLeft || s.bells < 50 ? "disabled" : ""}>Hatch Pod (50 Snowbells)</button>
            ${ui.worldMon ? `<button type="button" class="btn" id="mn-adopt-mon" ${playing || !adoptsLeft || ui.mon() < 75 ? "disabled" : ""}>Hatch Pod (75 mon)</button>` : ""}
            <button type="button" class="btn" id="mn-game">${playing ? "Close Cricket Catch" : "Play Cricket Catch"}</button>
          </div>
        </div>
        ${lastRes ? `<p class="xm-res" style="margin-top:8px">${esc(lastRes)}</p>` : ""}
        <div id="mn-stage" ${playing ? "" : "hidden"} style="margin-top:12px"></div>
        <details style="margin-top:10px">
          <summary style="cursor:pointer">Drop Probabilities (Exact 100% Terrarium Pod Odds Table)</summary>
          <table class="xm-odds" style="margin-top:8px;width:100%">
            ${Object.values(REPTILE_TIERS).map((t) => `
              <tr>
                <th style="color:${t.color}">${esc(t.label)} (${tierCount(t.key)})</th>
                <td><strong>${esc(t.totalPct)}</strong></td>
                <td>${esc(t.note)}</td>
              </tr>
            `).join("")}
          </table>
        </details>
      </div>
      <div class="chips" style="margin-bottom:10px">
        <button type="button" class="chip${filterTier === "all" ? " on" : ""}" data-rt="all">All (${REPTILE_IDS.length})</button>
        <button type="button" class="chip${filterTier === "behaviours" ? " on" : ""}" data-rt="behaviours">🎭 Behaviours (${Object.keys(SIGNATURE_BEHAVIOURS).length})</button>
        ${Object.values(REPTILE_TIERS).map((t) => `<button type="button" class="chip${filterTier === t.key ? " on" : ""}" data-rt="${t.key}" style="color:${t.color}">${esc(t.label)} · ${esc(t.totalPct)} (${tierCount(t.key)})</button>`).join("")}
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(min(260px,100%),1fr));gap:10px">${cards}</div>
    `;

    host.querySelectorAll("[data-sig]").forEach((btn) => {
      btn.onclick = () => {
        const id = btn.dataset.sig;
        const got = !!s.pets[id];
        const prev = cardState.get(id) || { act: "", mood: got ? "happy" : "sleepy" };
        const moods = ["happy", "love", "sleepy", "sad"];
        let next;
        if (id === "pantherchameleon" || id === "veiledchameleon") {
          if (prev.act === "signature") next = { act: "", mood: "happy" };
          else {
            const ni = moods.indexOf(prev.mood) + 1;
            next = ni < moods.length ? { act: "", mood: moods[ni] } : { act: "signature", mood: "happy" };
          }
        } else if (id === "leaftailgecko") {
          next = { ...prev, act: prev.act === "" ? "camo" : prev.act === "camo" ? "signature" : "" };
        } else {
          next = { ...prev, act: prev.act === "signature" ? "" : "signature" };
        }
        cardState.set(id, next);
        const box = host.querySelector(`[data-art="${id}"]`);
        if (box) box.innerHTML = petSvg(id, got ? 2 : 1, next.mood, { size: 82, act: next.act });
        const sig = SIGNATURE_BEHAVIOURS[id];
        btn.classList.toggle("btn-accent", !!(next.act || (id.includes("chameleon") && next.mood !== "happy")));
        btn.textContent = id === "leaftailgecko"
          ? `🎭 ${next.act === "camo" ? "Reveal Gecko!" : next.act === "signature" ? "Calm" : sig.btn}`
          : id.includes("chameleon")
          ? `🎭 ${next.act === "signature" ? "Reset Chameleon" : `Mood: ${next.mood}`}`
          : `🎭 ${next.act ? "Reset Pose" : sig.btn}`;
        ui.ping?.("blip");
      };
    });

    host.querySelectorAll("[data-rt]").forEach((btn) => {
      btn.onclick = () => {
        filterTier = btn.dataset.rt;
        render();
      };
    });

    const walkBtn = host.querySelector("#mn-walk");
    if (walkBtn) walkBtn.onclick = () => ui.enterHouse?.();

    host.querySelector("#mn-adopt").onclick = () => {
      if (playing || (sc.adopts || 0) >= DAILY_POD_CAP || s.bells < 50) return;
      s.bells -= 50;
      sc.adopts = (sc.adopts || 0) + 1;
      const r = rollReptilePod(X);
      const t = REPTILE_TIERS[r.tier];
      lastRes = r.dupe
        ? `${r.sp[1]} (${t.label} · ${r.meta[3]}) duplicate → +60 XP & full joy!`
        : `Hatched ${r.sp[1]} (${t.label} · ${r.meta[3]})!`;
      ui.ping?.("done");
      ui.hud?.();
      render();
    };

    const monBtn = host.querySelector("#mn-adopt-mon");
    if (monBtn) {
      monBtn.onclick = () => {
        if (playing || (sc.adopts || 0) >= DAILY_POD_CAP || !ui.spendMon?.(75)) return;
        sc.adopts = (sc.adopts || 0) + 1;
        const r = rollReptilePod(X);
        const t = REPTILE_TIERS[r.tier];
        lastRes = r.dupe
          ? `${r.sp[1]} (${t.label} · ${r.meta[3]}) duplicate → +60 XP & full joy!`
          : `Hatched ${r.sp[1]} (${t.label} · ${r.meta[3]})!`;
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
      if (!stageEl.isConnected || !playing) {
        clearInterval(hopT);
        clearInterval(secT);
        return;
      }
      left--;
      const el = stageEl.querySelector("#mn-tm");
      if (el) el.textContent = `${left}s`;
      if (left <= 0) {
        clearInterval(hopT);
        clearInterval(secT);
        const s = xs();
        const sc = ensureSanctuary(s);
        let bells = 0;
        let bonusMon = 0;
        if (sc.plays < DAILY_CRICKET_CAP) {
          sc.plays++;
          bells = earn(Math.min(40, 8 + score * 2), { bonus: false });
          bonusMon = ui.worldMon ? Math.min(35, 10 + score) : 0;
          if (bonusMon) ui.addMon?.(bonusMon);
        }
        let msg = `Cricket Catch over! ${score} caught${bells || bonusMon ? `: +${bells} Snowbells${bonusMon ? ` & +${bonusMon} mon` : ""}` : " (daily reward cap reached)"}.`;
        if (score >= 12 && sc.freeDay !== today()) {
          sc.freeDay = today();
          const r = rollReptilePod(X);
          msg += ` Daily Bonus: ${r.dupe ? `${r.sp[1]} +60 XP` : `Hatched ${r.sp[1]}!`}!`;
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
