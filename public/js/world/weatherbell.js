// Weather & Time Shrine: toggle Time of Day (Auto/Day/Night), ring the Weather Bell for fireworks, and claim a daily forecast blessing.
import { today } from "../util.js";

export function createWeatherBell(o) {
  const { s, panel, toast, ping, save, hud, timeChanged, fireworks, addRenown } = o;
  const st = (s.weatherBell ||= {});
  st.day ||= "";

  function open() {
    const canBless = st.day !== today();
    const times = [
      ["auto", "Real Time"],
      ["day", "Always Day"],
      ["night", "Always Night"],
    ].map(([k, l]) =>
      `<button type="button" class="chip${s.time === k ? " on" : ""}" data-tm="${k}">${l}</button>`
    ).join("");

    const seasons = [
      ["starfall", "✨ Starfall Week", "Falling Stars, Meteor Shower, Aurora Blooms & Foxfire Swarm"],
      ["lantern", "🏮 Lantern Breeze", "Drifting Lanterns, Lantern Parade, Regatta & Kite Regatta"],
      ["gale", "🌬️ Desert & Gale", "Bead Storm, Mirrorshards, Nightjar Courier & Foxfire Storm"],
      ["tide", "🦀 Tide & Ledger", "Tidepool Tag, Moth Migration, Ledger Rain & Golden Fox"],
    ];
    const activeSeason = st.season && st.season.until > Date.now() ? st.season : null;
    const daysLeft = activeSeason ? Math.max(1, Math.ceil((activeSeason.until - Date.now()) / 86400000)) : 0;
    const canSeason = !activeSeason;

    panel("Weather & Time Shrine", `
      <p class="muted">Adjust the sky over Kitsune World, ring the shrine bell for celebratory foxfire, and ring the <strong>Seasonal Weather Bell</strong> once a week to shift which world events spawn for 7 days.</p>
      <div style="margin:10px 0"><strong>Time of Day:</strong><div class="chips" style="margin-top:6px">${times}</div></div>
      <div class="se-mkt" style="margin-top:12px">
        <div class="se-good">
          <span><strong>🔔 Seasonal Weather Bell</strong><small>${activeSeason ? `${activeSeason.name} active (${daysLeft}d left)` : "Ring once a week to shift world event spawns for 7 days"}</small></span>
          <button type="button" class="btn btn-sm btn-accent" id="wb-sn" ${canSeason ? "" : "disabled"}>${canSeason ? "Ring Weekly Bell" : `${daysLeft}d Left`}</button>
        </div>
        <div class="se-good">
          <span><strong>🎆 Ring Foxfire Sky-Bell</strong><small>Launch celebratory fireworks across the sky</small></span>
          <button type="button" class="btn btn-sm btn-accent" id="wb-fw">Ring Bell</button>
        </div>
        <div class="se-good">
          <span><strong>🌦️ Daily Forecast Blessing</strong><small>Once per day · +25 mon &amp; +15 Renown</small></span>
          <button type="button" class="btn btn-sm btn-accent" id="wb-bl" ${canBless ? "" : "disabled"}>${canBless ? "Claim Blessing" : "Claimed Today ✓"}</button>
        </div>
      </div>
    `, (e) => {
      e.querySelector("#wb-sn").onclick = () => {
        if (st.season && st.season.until > Date.now()) return;
        const idx = st.season ? (seasons.findIndex((q) => q[0] === st.season.id) + 1) % seasons.length : 0;
        const pick = seasons[idx];
        st.season = { id: pick[0], name: pick[1], until: Date.now() + 7 * 86400000 };
        fireworks?.();
        ping("done");
        toast(`Town bell rings! ${pick[1]} begins for 7 days (${pick[2]}).`);
        save(); open();
      };
      e.querySelectorAll("[data-tm]").forEach((b) => {
        b.onclick = () => {
          s.time = b.dataset.tm;
          timeChanged?.();
          ping("choice"); save(); open();
        };
      });
      e.querySelector("#wb-fw").onclick = () => {
        fireworks?.();
        ping("done");
        toast("Foxfire fireworks burst across the sky!");
      };
      e.querySelector("#wb-bl").onclick = () => {
        if (st.day === today()) return;
        st.day = today();
        s.mon += 25;
        addRenown?.(15);
        ping("done");
        toast("Forecast blessing! +25 mon & +15 Renown.");
        save(); hud(); open();
      };
    });
  }

  return { open, state: st };
}
