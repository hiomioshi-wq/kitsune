// The shared pet-house shop: hatch pods, codex cards, behaviour theatre, mini-game rewards and the
// Winterfest page for any house built from a pack. world/pethouse.js is the walkable version.
import { esc, today } from "../util.js";
import { species } from "./data.js";
import { petSvg } from "./art.js";
import { xs, loadXmas, save as saveXmas, earn, grant } from "./core.js";
import { settings } from "../store.js";
import { rollHouseId } from "./houses/shared.js";

export const DAILY_POD_CAP = 12;
export const DAILY_GAME_CAP = 3;
export const POD_PRICE = { bells: 50, mon: 75 };

export function ensureHouse(s, slug) {
  const all = (s.houses ||= {});
  const a = (all[slug] ||= { day: "", adopts: 0, plays: 0, freeDay: "", treatDay: "", best: 0, champ: 0 });
  if (a.day !== today()) {
    a.day = today();
    a.adopts = 0;
    a.plays = 0;
  }
  return a;
}

export const owned = (house, s = xs()) => house.ids.filter((id) => !!s?.pets?.[id]);

function champion(house, s) {
  const a = ensureHouse(s, house.slug);
  if (a.champ || owned(house, s).length < house.ids.length) return "";
  a.champ = 1;
  grant(1000);
  saveXmas();
  return ` 👑 Every one of the ${house.ids.length} ${house.noun} at ${house.name}: +1,000 Snowbells!`;
}

/** Hatch one pet for free (used by pods and game bonuses). */
export function welcome(house) {
  const s = xs(), id = rollHouseId(house), sp = species(id), meta = house.meta[id];
  const dupe = !!s.pets[id];
  if (dupe) {
    s.pets[id].xp = (s.pets[id].xp || 0) + 60;
    s.pets[id].joy = 100;
  } else {
    s.pets[id] = { sp: id, name: sp[1], xp: 0, hunger: 92, joy: 96, at: Date.now(), born: today() };
    if (!s.active) s.active = id;
  }
  const note = champion(house, s);
  saveXmas();
  return { id, dupe, sp, meta, tier: meta.tier, note };
}

/** Buy and open one pod. `wallet` is only needed for mon: { mon(), spendMon(n) }. */
export function buyPod(house, currency, wallet = {}) {
  const s = xs();
  if (!s) return { error: "Could not access pet storage." };
  const a = ensureHouse(s, house.slug);
  if (a.adopts >= DAILY_POD_CAP) return { error: `Daily ${house.pod} limit reached (${DAILY_POD_CAP}/${DAILY_POD_CAP}). Come back tomorrow.` };
  if (currency === "mon") {
    if ((wallet.mon?.() || 0) < POD_PRICE.mon) return { error: `Need ${POD_PRICE.mon} mon to open a ${house.pod}.` };
    wallet.spendMon(POD_PRICE.mon);
  } else {
    if (s.bells < POD_PRICE.bells) return { error: `Need ${POD_PRICE.bells} Snowbells to open a ${house.pod}.` };
    s.bells -= POD_PRICE.bells;
  }
  a.adopts++;
  return welcome(house);
}

export const podMessage = (house, r) => {
  const t = house.tiers[r.tier];
  return `${r.dupe ? `${r.sp[1]} (${t.label} · ${r.meta.chance}) again → +60 XP & full joy!` : `${r.sp[1]} (${t.label} · ${r.meta.chance}) joined you!`}${r.note || ""}`;
};

export const tierSummary = (house) => Object.values(house.tiers).map((t) => `${t.label} ${t.totalPct} (${t.count})`).join(" · ");
export const oddsTable = (house) => `<table class="xm-odds" style="margin-top:8px;width:100%">${Object.values(house.tiers).map((t) => `<tr><th style="color:${t.color}">${esc(t.label)} (${t.count})</th><td><strong>${esc(t.totalPct)}</strong></td><td>${esc(t.note)}</td></tr>`).join("")}</table>`;
export const oddsTiles = (house) => `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;margin:12px 0">${Object.values(house.tiers).map((t) => `<div style="padding:8px;border-radius:10px;border:1px solid ${t.color}66;background:rgba(128,128,128,.08)"><strong style="color:${t.color}">${esc(t.label)}</strong><div style="font-size:16px;font-weight:800">${esc(t.totalPct)}</div><small class="muted">${esc(t.perPct)} each</small></div>`).join("")}</div>`;

export function petCard(house, r, s) {
  const t = house.tiers[r.tier], hab = house.habitats.find((h) => h.id === r.zone), got = !!s?.pets?.[r.id], sig = house.behaviours[r.id];
  return `<article style="padding:10px;border:1px solid ${got ? t.color : "rgba(128,128,128,.3)"};border-radius:12px;opacity:${got ? 1 : 0.86}">
    <div style="display:flex;gap:10px;align-items:center">
      <div data-art="${r.id}" style="width:82px;height:82px;flex:0 0 82px">${petSvg(r.id, got ? 2 : 1, got ? "happy" : "sleepy", { size: 82 })}</div>
      <div style="min-width:0;flex:1">
        <strong>${esc(r.name)}</strong>
        <div><span class="pill" style="color:${t.color};border-color:${t.color}66">${esc(t.label)} · ${esc(r.chance)}</span></div>
        <small class="muted" style="display:block;margin-top:3px"><i>${esc(r.sci)}</i> · ${hab.badge} ${esc(r.habit)}</small>
        <small style="display:block;margin-top:3px">${got ? "In your collection ✓" : esc(r.personality)}</small>
        ${sig ? `<button type="button" class="btn btn-sm" data-sig="${r.id}" style="margin-top:6px;white-space:normal;max-width:100%">🎭 ${esc(sig.btn)}</button>` : ""}
      </div>
    </div>
  </article>`;
}
export const cardGrid = (house, list, s) => `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(min(250px,100%),1fr));gap:10px">${list.map((r) => petCard(house, r, s)).join("")}</div>`;

/** Toggle signature art on any [data-sig] button inside `el`. */
export function bindSignatures(house, el, s, ping) {
  el.querySelectorAll("[data-sig]").forEach((btn) => {
    let on = false;
    btn.onclick = () => {
      on = !on;
      const id = btn.dataset.sig, got = !!s?.pets?.[id];
      const art = el.querySelector(`[data-art="${id}"]`);
      if (art) art.innerHTML = petSvg(id, got || on ? 2 : 1, got || on ? "happy" : "sleepy", { size: 82, act: on ? "signature" : "" });
      btn.classList.toggle("btn-accent", on);
      btn.textContent = on ? "🎭 Settle Down" : `🎭 ${house.behaviours[id].btn}`;
      ping?.("blip");
    };
  });
}

export const filterChips = (house, current) => [["all", `All (${house.ids.length})`], ["behaviours", `🎭 Behaviours (${Object.keys(house.behaviours).length})`], ...Object.values(house.tiers).map((t) => [t.key, `${t.label} · ${t.totalPct} (${t.count})`, t.color])]
  .map(([k, l, col]) => `<button type="button" class="chip${current === k ? " on" : ""}" data-pf="${k}"${col ? ` style="color:${col}"` : ""}>${esc(l)}</button>`).join("");
export const filterPets = (house, f) => (f === "all" ? house.rows : f === "behaviours" ? house.rows.filter((r) => house.behaviours[r.id]) : house.rows.filter((r) => r.tier === f));

/**
 * Mount the house's mini-game in `el`, paying out when it reports a score.
 * ui: { ping, hud, addMon, worldMon, onDone(message) }. Returns cleanup.
 */
export function mountGame(house, el, ui = {}) {
  let stop = null, dead = false, paid = false;
  const s = xs();
  const a = s ? ensureHouse(s, house.slug) : { plays: 0, freeDay: "", best: 0 };
  const G = house.game;
  const info = () => `${Math.max(0, DAILY_GAME_CAP - a.plays)}/${DAILY_GAME_CAP} rewarded runs today${a.freeDay !== today() ? ` · ${G.freeAt}+ ${G.unit} earns a free ${house.pod}` : ""} · Best ${a.best || 0}`;
  el.innerHTML = `<small class="muted" data-info style="display:block;margin-bottom:6px">${esc(info())}</small><div data-play></div><div data-result hidden style="text-align:center;margin-top:10px"><p data-msg aria-live="polite" style="font-weight:700"></p><button type="button" class="btn btn-accent" data-back>Back to ${esc(house.name)}</button></div>`;
  // Grab our own elements before the game mounts: games are free to reuse these attribute names.
  const [infoEl, playEl, resultEl, msgEl, backEl] = ["info", "play", "result", "msg", "back"].map((k) => el.querySelector(`[data-${k}]`));

  function done(raw) {
    if (paid || dead) return;
    paid = true;
    const score = Math.max(0, Math.floor(Number(raw) || 0));
    let msg = `${G.name} over: ${score} ${G.unit}`;
    if (s) {
      a.best = Math.max(a.best || 0, score);
      if (a.plays < DAILY_GAME_CAP && score > 0) {
        a.plays++;
        const bells = earn(Math.min(40, 6 + Math.round(score * G.pay)), { bonus: false });
        const mon = ui.worldMon ? Math.min(35, 6 + Math.round(score * G.pay * 0.75)) : 0;
        if (mon) ui.addMon?.(mon);
        if (bells || mon) msg += `: ${[bells && `+${bells} Snowbells`, mon && `+${mon} mon`].filter(Boolean).join(" & ")}`;
      } else if (score > 0) msg += " (daily reward cap reached)";
      msg += ".";
      if (score >= G.freeAt && a.freeDay !== today()) {
        a.freeDay = today();
        msg += ` Free ${house.pod}: ${podMessage(house, welcome(house))}`;
      }
      saveXmas();
    } else msg += ".";
    ui.ping?.("done");
    ui.hud?.();
    infoEl.textContent = info();
    msgEl.textContent = msg;
    resultEl.hidden = false;
    backEl.onclick = () => ui.onDone?.(msg);
  }

  house.loadGame().then((m) => {
    if (dead) return;
    stop = m.default(playEl, {
      done,
      ping: (n) => ui.ping?.(n),
      unhurried: !!settings.world?.unhurried,
      svg: (id, o = {}) => petSvg(id, o.stage || 1, o.mood || "happy", { size: o.size || 64, act: o.act || "" }),
      volume: Math.max(0, Math.min(1, (settings.uiSoundVol ?? 40) / 100)),
    });
  }).catch((err) => {
    console.error(err);
    if (!dead) playEl.innerHTML =`<p class="muted">The game didn't load. Try again.</p>`;
  });

  return () => {
    if (dead) return;
    dead = true;
    stop?.();
    stop = null;
  };
}

/** The Winterfest page for one house. */
export async function mountShop(house, host, ui = {}) {
  await loadXmas().catch(() => {});
  let filter = "all", playing = false, last = "", stopGame = null;

  function render() {
    stopGame?.();
    stopGame = null;
    const s = xs();
    if (!s) {
      host.innerHTML = `<p class="muted">Could not load ${esc(house.name)}.</p>`;
      return;
    }
    const a = ensureHouse(s, house.slug);
    last += champion(house, s);
    const pods = Math.max(0, DAILY_POD_CAP - a.adopts);
    host.innerHTML = `
      <div class="xm-card" style="margin-bottom:12px;display:block">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap">
          <div>
            <h2 style="margin:0">${house.icon} ${esc(house.name)} (${owned(house, s).length}/${house.ids.length})</h2>
            <p class="muted" style="margin:4px 0 0">${esc(house.blurb)} ${pods}/${DAILY_POD_CAP} ${esc(house.pod)}s left today.</p>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <a class="btn btn-accent" href="#world/${house.slug}">Walk Inside</a>
            <button type="button" class="btn" data-buy ${playing || !pods || s.bells < POD_PRICE.bells ? "disabled" : ""}>Open ${esc(house.pod)} (${POD_PRICE.bells} Snowbells)</button>
            <button type="button" class="btn" data-game>${playing ? "Close" : "Play"} ${esc(house.game.name)}</button>
          </div>
        </div>
        ${last ? `<p class="xm-res" style="margin-top:8px" aria-live="polite">${esc(last)}</p>` : ""}
        <div data-stage ${playing ? "" : "hidden"} style="margin-top:12px"></div>
        <details style="margin-top:10px">
          <summary style="cursor:pointer">Drop Probabilities (exact ${esc(house.pod)} odds)</summary>
          ${oddsTable(house)}
          <p class="hint">${esc(tierSummary(house))}. Chase pets only come from ${esc(house.pod)}s.</p>
        </details>
      </div>
      <div class="chips" style="margin-bottom:10px">${filterChips(house, filter)}</div>
      ${cardGrid(house, filterPets(house, filter), s)}`;

    bindSignatures(house, host, s, ui.ping);
    host.querySelectorAll("[data-pf]").forEach((b) => (b.onclick = () => { filter = b.dataset.pf; playing = false; render(); }));
    host.querySelector("[data-buy]").onclick = () => {
      const r = buyPod(house, "bells");
      last = r.error || podMessage(house, r);
      if (!r.error) ui.ping?.("done");
      render();
    };
    host.querySelector("[data-game]").onclick = () => { playing = !playing; render(); };
    if (playing) stopGame = mountGame(house, host.querySelector("[data-stage]"), { ...ui, onDone: (m) => { last = m; playing = false; render(); } });
  }

  render();
  return () => { stopGame?.(); stopGame = null; };
}
