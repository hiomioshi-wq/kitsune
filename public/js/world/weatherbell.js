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

    panel("Weather & Time Shrine", `
      <p class="muted">Adjust the sky over Kitsune World, ring the shrine bell for celebratory foxfire, and claim your daily forecast blessing.</p>
      <div style="margin:10px 0"><strong>Time of Day:</strong><div class="chips" style="margin-top:6px">${times}</div></div>
      <div class="se-mkt" style="margin-top:12px">
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
