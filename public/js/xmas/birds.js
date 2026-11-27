// Dawn Aviary shared UI: Nest Pods, the 48-bird codex, signature behaviour theatre, the Dawn Chorus
// echo game and the Winterfest "Bird House" tab. The walkable house (world/birdhouse.js) reuses these.
import { esc, today } from "../util.js";
import { species } from "./data.js";
import { petSvg } from "./art.js";
import { xs, loadXmas, save as saveXmas, earn, grant, isSeason } from "./core.js";
import { settings } from "../store.js";
import {
  BIRD_TIERS,
  BIRD_HABITATS,
  BIRD_LIST,
  BIRD_META,
  BIRD_IDS,
  BIRD_BEHAVIOURS,
  BIRD_SHOWCASE,
  DAILY_NEST_CAP,
  DAILY_CHORUS_CAP,
  NEST_PRICE,
  CHORUS_FREE_AT,
  ensureDawnAviary,
  rollBirdPod,
} from "./birddata.js";

const adapter = { xs, save: saveXmas, earn, grant, isSeason };
const ownedCount = (s) => BIRD_IDS.filter((id) => !!s?.pets?.[id]).length;
const tierSummary = () => Object.values(BIRD_TIERS).map((t) => `${t.label} ${t.totalPct} (${t.count})`).join(" · ");

function champion(s) {
  if (s.birdChamp || ownedCount(s) < BIRD_IDS.length) return "";
  s.birdChamp = 1;
  grant(1000);
  saveXmas();
  return ` 👑 Master of the Dawn Chorus! All ${BIRD_IDS.length} birds: +1,000 Snowbells!`;
}

/**
 * Buy and open one Nest Pod. `wallet` is only needed for mon: { mon(), spendMon(n) }.
 * Returns { error } or { ...pod result, note }.
 */
export function buyNest(currency, wallet = {}) {
  const s = xs();
  if (!s) return { error: "Could not access pet storage." };
  const a = ensureDawnAviary(s);
  if (a.adopts >= DAILY_NEST_CAP) return { error: `Daily Nest Pod limit reached (${DAILY_NEST_CAP}/${DAILY_NEST_CAP}). Come back tomorrow.` };
  if (currency === "mon") {
    if ((wallet.mon?.() || 0) < NEST_PRICE.mon) return { error: `Need ${NEST_PRICE.mon} mon to open a Nest Pod.` };
    wallet.spendMon(NEST_PRICE.mon);
  } else {
    if (s.bells < NEST_PRICE.bells) return { error: `Need ${NEST_PRICE.bells} Snowbells to open a Nest Pod.` };
    s.bells -= NEST_PRICE.bells;
  }
  a.adopts++;
  const res = rollBirdPod(adapter);
  return { ...res, note: champion(s) };
}

export const podMessage = (r) => {
  const t = BIRD_TIERS[r.tier];
  return `${r.dupe ? `${r.sp[1]} (${t.label} · ${r.meta.chance}) again → +60 XP & full joy!` : `${r.sp[1]} (${t.label} · ${r.meta.chance}) hatched!`}${r.note || ""}`;
};

export const oddsTable = () => `<table class="xm-odds" style="margin-top:8px;width:100%">${Object.values(BIRD_TIERS).map((t) => `<tr><th style="color:${t.color}">${esc(t.label)} (${t.count})</th><td><strong>${esc(t.totalPct)}</strong></td><td>${esc(t.note)}</td></tr>`).join("")}</table>`;

export const oddsTiles = () => `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;margin:12px 0">${Object.values(BIRD_TIERS).map((t) => `<div style="padding:8px;border-radius:10px;border:1px solid ${t.color}66;background:rgba(128,128,128,.08)"><strong style="color:${t.color}">${esc(t.label)}</strong><div style="font-size:16px;font-weight:800">${esc(t.totalPct)}</div><small class="muted">${esc(t.perPct)} each</small></div>`).join("")}</div>`;

export function birdCard(r, s) {
  const sp = species(r.id), t = BIRD_TIERS[r.tier], hab = BIRD_HABITATS[r.zone], got = !!s?.pets?.[r.id], sig = BIRD_BEHAVIOURS[r.id];
  return `<article style="padding:10px;border:1px solid ${got ? t.color : "rgba(128,128,128,.3)"};border-radius:12px;opacity:${got ? 1 : 0.86}">
    <div style="display:flex;gap:10px;align-items:center">
      <div data-art="${r.id}" style="width:82px;height:82px;flex:0 0 82px">${petSvg(r.id, got ? 2 : 1, got ? "happy" : "sleepy", { size: 82 })}</div>
      <div style="min-width:0;flex:1">
        <strong>${esc(sp[1])}</strong>
        <div><span class="pill" style="color:${t.color};border-color:${t.color}66">${esc(t.label)} · ${esc(r.chance)}</span></div>
        <small class="muted" style="display:block;margin-top:3px"><i>${esc(r.sci)}</i> · ${hab.badge} ${esc(r.habit)}</small>
        <small style="display:block;margin-top:3px">${got ? "In your aviary ✓" : esc(sp[8])}</small>
        ${sig ? `<button type="button" class="btn btn-sm" data-sig="${r.id}" style="margin-top:6px;white-space:normal;max-width:100%">🎭 ${esc(sig.btn)}</button>` : ""}
      </div>
    </div>
  </article>`;
}

/** Toggle signature art on any [data-sig] button inside `host`. */
export function bindSignatures(host, s, ping, size = 82) {
  host.querySelectorAll("[data-sig]").forEach((btn) => {
    let on = false;
    btn.onclick = () => {
      on = !on;
      const id = btn.dataset.sig, got = !!s?.pets?.[id];
      const art = host.querySelector(`[data-art="${id}"]`);
      if (art) art.innerHTML = petSvg(id, got || on ? 2 : 1, got || on ? "happy" : "sleepy", { size, act: on ? "signature" : "" });
      btn.classList.toggle("btn-accent", on);
      btn.textContent = on ? "🎭 Settle Down" : `🎭 ${BIRD_BEHAVIOURS[id].btn}`;
      ping?.("blip");
    };
  });
}

export const cardGrid = (list, s) => `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(min(250px,100%),1fr));gap:10px">${list.map((r) => birdCard(r, s)).join("")}</div>`;

export const FILTERS = (current) => [["all", `All (${BIRD_IDS.length})`], ["behaviours", `🎭 Behaviours (${Object.keys(BIRD_BEHAVIOURS).length})`], ...Object.values(BIRD_TIERS).map((t) => [t.key, `${t.label} · ${t.totalPct} (${t.count})`, t.color])]
  .map(([k, l, col]) => `<button type="button" class="chip${current === k ? " on" : ""}" data-bf="${k}"${col ? ` style="color:${col}"` : ""}>${esc(l)}</button>`).join("");

export const filterBirds = (f) => (f === "all" ? BIRD_LIST : f === "behaviours" ? BIRD_SHOWCASE.concat(Object.keys(BIRD_BEHAVIOURS).filter((id) => !BIRD_SHOWCASE.includes(id))).map((id) => BIRD_META[id]) : BIRD_LIST.filter((r) => r.tier === f));

// ---------- Dawn Chorus: hear four birds sing, then echo the song back ----------
export const SINGERS = [
  { id: "sparrow", color: "#c8945a", call: [[2600, 0, 0.07, 0.8], [2900, 0.1, 0.07, 0.75], [2500, 0.2, 0.08, 0.8]], text: "chirp-chirp" },
  { id: "canary", color: "#f2c81e", call: [[1900, 0, 0.1, 1.5], [2400, 0.09, 0.06, 1.2], [2400, 0.16, 0.06, 1.2], [3000, 0.23, 0.14, 0.85]], text: "trill" },
  { id: "barnowl", color: "#d8a868", call: [[430, 0, 0.2, 0.92], [360, 0.28, 0.3, 0.86]], text: "hoo-hooo" },
  { id: "kookaburra", color: "#5aa8d8", call: [[700, 0, 0.09, 1.35], [820, 0.1, 0.09, 1.3], [950, 0.2, 0.09, 1.25], [760, 0.3, 0.14, 0.7]], text: "koo-ka-ka" },
];

function singer() {
  let ac = null;
  return {
    play(i) {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        ac ||= new AC();
        if (ac.state === "suspended") ac.resume();
        const vol = Math.max(0.05, Math.min(1, (settings.uiSoundVol ?? 40) / 100)) * 0.35;
        for (const [f, at, len, slide] of SINGERS[i].call) {
          const o = ac.createOscillator(), a = ac.createGain(), t = ac.currentTime + at + 0.005;
          o.type = f < 600 ? "sine" : "triangle";
          o.frequency.setValueAtTime(f, t);
          o.frequency.exponentialRampToValueAtTime(f * slide, t + len);
          a.gain.setValueAtTime(0.0001, t);
          a.gain.exponentialRampToValueAtTime(vol, t + 0.012);
          a.gain.exponentialRampToValueAtTime(0.0001, t + len);
          o.connect(a).connect(ac.destination);
          o.start(t);
          o.stop(t + len + 0.02);
        }
      } catch { /* sound is a bonus: the perches also light up and caption each call */ }
    },
    close() { ac?.close?.().catch?.(() => {}); ac = null; },
  };
}

/**
 * Mount the echo game in `el`. ui: { ping, hud, addMon, worldMon, onDone(message) }.
 * Returns a cleanup function that stops every pending timer.
 */
export function mountChorus(el, ui = {}) {
  const unhurried = !!settings.world?.unhurried;
  const voice = singer();
  const timers = new Set();
  const later = (f, ms) => { const t = setTimeout(() => { timers.delete(t); f(); }, ms); timers.add(t); };
  let song = [], at = 0, listening = false, sung = 0, spare = unhurried ? 1 : 0, sound = true, dead = false;
  const s = xs();
  const a = s ? ensureDawnAviary(s) : { plays: 0, freeDay: "", best: 0 };
  const info = () => `${Math.max(0, DAILY_CHORUS_CAP - a.plays)}/${DAILY_CHORUS_CAP} rewarded runs today${a.freeDay !== today() ? ` · ${CHORUS_FREE_AT}+ verses earns a free Nest Pod` : ""} · Best ${a.best || 0}`;

  el.innerHTML = `
    <div style="padding:12px;border-radius:12px;border:2px solid #e0a23a;background:linear-gradient(180deg,#26304e,#5a3c4a 62%,#8a5a3c);color:#fff">
      <div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;align-items:center">
        <strong data-ch="score">Verses sung: 0</strong>
        <small data-ch="info">${info()}</small>
        <button type="button" class="btn btn-sm" data-ch="mute" aria-pressed="false">🔊 Sound on</button>
      </div>
      <p data-ch="msg" aria-live="polite" style="text-align:center;min-height:22px;margin:8px 0;font-weight:700">Listen to the chorus, then tap the birds in the same order.</p>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:8px">
        ${SINGERS.map((b, i) => `<button type="button" data-perch="${i}" disabled aria-label="${esc(species(b.id)[1])}, ${b.text}" style="border:3px solid ${b.color};border-radius:14px;background:rgba(255,255,255,.08);color:#fff;padding:6px;cursor:pointer;transition:transform .15s,background .15s"><span data-face="${i}" style="display:block;width:86px;height:86px;margin:0 auto">${petSvg(b.id, 1, "happy", { size: 86 })}</span><small style="display:block;font-weight:700">${i + 1} · ${esc(species(b.id)[1])}</small></button>`).join("")}
      </div>
      <div style="display:flex;justify-content:center;margin-top:10px"><button type="button" class="btn btn-accent" data-ch="start">Begin the chorus</button></div>
    </div>`;

  const q = (k) => el.querySelector(`[data-ch="${k}"]`);
  const perches = [...el.querySelectorAll("[data-perch]")];
  const enable = (on) => perches.forEach((b) => (b.disabled = !on));

  function light(i, ms = 420) {
    const b = perches[i];
    if (!b) return;
    b.style.background = `${SINGERS[i].color}aa`;
    b.style.transform = "translateY(-6px) scale(1.04)";
    if (sound) voice.play(i);
    q("msg").textContent = `${species(SINGERS[i].id)[1]}: “${SINGERS[i].text}”`;
    later(() => { b.style.background = "rgba(255,255,255,.08)"; b.style.transform = ""; }, ms);
  }

  function perform() {
    listening = false;
    enable(false);
    at = 0;
    const gap = unhurried ? 950 : Math.max(480, 780 - song.length * 30);
    song.forEach((i, k) => later(() => light(i, gap - 140), 500 + k * gap));
    later(() => {
      listening = true;
      enable(true);
      q("msg").textContent = "Your turn: sing it back!";
    }, 520 + song.length * gap);
  }

  const verse = () => { song.push(Math.floor(Math.random() * SINGERS.length)); perform(); };

  function finish() {
    listening = false;
    enable(false);
    let msg = `Dawn Chorus over: ${sung} verse${sung === 1 ? "" : "s"} sung`;
    if (s) {
      a.best = Math.max(a.best || 0, sung);
      if (a.plays < DAILY_CHORUS_CAP && sung > 0) {
        a.plays++;
        const bells = earn(Math.min(40, 6 + sung * 4), { bonus: false });
        const mon = ui.worldMon ? Math.min(35, 6 + sung * 3) : 0;
        if (mon) ui.addMon?.(mon);
        if (bells || mon) msg += `: ${[bells && `+${bells} Snowbells`, mon && `+${mon} mon`].filter(Boolean).join(" & ")}`;
      } else if (sung > 0) msg += " (daily reward cap reached)";
      msg += ".";
      if (sung >= CHORUS_FREE_AT && a.freeDay !== today()) {
        a.freeDay = today();
        const r = rollBirdPod(adapter);
        msg += ` Free Nest Pod: ${podMessage({ ...r, note: champion(s) })}`;
      }
      saveXmas();
    } else msg += ".";
    ui.ping?.("done");
    ui.hud?.();
    q("msg").textContent = msg;
    q("info").textContent = info();
    q("start").hidden = false;
    q("start").textContent = "Back to the aviary";
    q("start").onclick = () => ui.onDone?.(msg);
  }

  function tap(i) {
    if (!listening || dead) return;
    light(i, 220);
    if (song[at] !== i) {
      if (spare) {
        spare--;
        listening = false;
        enable(false);
        q("msg").textContent = "Not quite. The birds kindly sing it once more.";
        later(perform, 900);
        return;
      }
      finish();
      return;
    }
    at++;
    if (at === song.length) {
      sung++;
      q("score").textContent = `Verses sung: ${sung}`;
      listening = false;
      enable(false);
      later(verse, 700);
    }
  }

  perches.forEach((b) => (b.onclick = () => tap(+b.dataset.perch)));
  // Number keys 1-4 mirror the perches.
  const onKey = (e) => {
    if (!el.isConnected) return cleanup();
    const i = "1234".indexOf(e.key);
    if (i < 0 || !listening || e.metaKey || e.ctrlKey || e.altKey) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    tap(i);
  };
  window.addEventListener("keydown", onKey, true);
  q("mute").onclick = () => {
    sound = !sound;
    q("mute").textContent = sound ? "🔊 Sound on" : "🔇 Sound off";
    q("mute").setAttribute("aria-pressed", String(!sound));
  };
  q("start").onclick = () => { q("start").hidden = true; verse(); };

  function cleanup() {
    if (dead) return;
    dead = true;
    timers.forEach(clearTimeout);
    timers.clear();
    window.removeEventListener("keydown", onKey, true);
    voice.close();
  }
  return cleanup;
}

// ---------- Winterfest tab ----------
export async function mountBirdHouse(host, ui = {}) {
  await loadXmas().catch(() => {});
  let filter = "all", playing = false, lastRes = "", stopGame = null;

  function render() {
    stopGame?.();
    stopGame = null;
    const s = xs();
    if (!s) {
      host.innerHTML = `<p class="muted">Could not load the Dawn Aviary.</p>`;
      return;
    }
    const a = ensureDawnAviary(s);
    lastRes += champion(s);
    const nests = Math.max(0, DAILY_NEST_CAP - a.adopts);
    host.innerHTML = `
      <div class="xm-card" style="margin-bottom:12px;display:block">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap">
          <div>
            <h2 style="margin:0">🐦 Dawn Aviary Bird House (${ownedCount(s)}/${BIRD_IDS.length})</h2>
            <p class="muted" style="margin:4px 0 0">Open woven Nest Pods for ${BIRD_IDS.length} birds across 5 tiers (${nests}/${DAILY_NEST_CAP} pods left today). Dawn Chorus: ${Math.max(0, DAILY_CHORUS_CAP - a.plays)}/${DAILY_CHORUS_CAP} rewarded runs today.</p>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <a class="btn btn-accent" href="#world/birdhouse">Walk Inside Bird House</a>
            <button type="button" class="btn" id="bh-nest" ${playing || !nests || s.bells < NEST_PRICE.bells ? "disabled" : ""}>Open Nest Pod (${NEST_PRICE.bells} Snowbells)</button>
            <button type="button" class="btn" id="bh-game">${playing ? "Close Dawn Chorus" : "Play Dawn Chorus"}</button>
          </div>
        </div>
        ${lastRes ? `<p class="xm-res" style="margin-top:8px" aria-live="polite">${esc(lastRes)}</p>` : ""}
        <div id="bh-stage" ${playing ? "" : "hidden"} style="margin-top:12px"></div>
        <details style="margin-top:10px">
          <summary style="cursor:pointer">Drop Probabilities (exact Nest Pod odds)</summary>
          ${oddsTable()}
          <p class="hint">${esc(tierSummary())}. Chase birds only come from Nest Pods.</p>
        </details>
      </div>
      <div class="chips" style="margin-bottom:10px">${FILTERS(filter)}</div>
      ${cardGrid(filterBirds(filter), s)}`;

    bindSignatures(host, s, ui.ping);
    host.querySelectorAll("[data-bf]").forEach((b) => (b.onclick = () => { filter = b.dataset.bf; playing = false; render(); }));
    host.querySelector("#bh-nest").onclick = () => {
      const r = buyNest("bells");
      lastRes = r.error || podMessage(r);
      if (!r.error) { saveXmas(); ui.ping?.("done"); }
      render();
    };
    host.querySelector("#bh-game").onclick = () => { playing = !playing; render(); };
    if (playing) stopGame = mountChorus(host.querySelector("#bh-stage"), { ...ui, onDone: (m) => { lastRes = m; playing = false; render(); } });
  }

  render();
  return () => { stopGame?.(); stopGame = null; };
}
