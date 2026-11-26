// Platform Zero Express: fast-travel sleeper train timetable & daily Conductor Shift.
import { esc, today } from "../util.js";

const STOPS = ["village", "clock", "shore", "market", "oz"];

export function createExpress(o) {
  const { s, REGIONS, panel, closePanel, toast, ping, save, hud, teleport, T, addRenown } = o;
  const st = (s.express ||= {});
  st.rides ||= 0;
  st.shiftDay ||= "";

  function open() {
    const canShift = st.shiftDay !== today();
    const rows = STOPS.map((rk) => {
      const r = REGIONS[rk];
      if (!r) return "";
      const seen = !!s.visited?.[rk];
      return `<div class="se-good">
        <span><strong>🚂 ${esc(r[0])}</strong><small>${seen ? "Express service · 10 mon" : "Visit on foot first to unlock rail pass"}</small></span>
        <button type="button" class="btn btn-sm btn-accent" data-ride="${rk}" ${!seen || s.mon < 10 ? "disabled" : ""}>Board (10)</button>
      </div>`;
    }).join("");

    panel(`Platform Zero Express · ${st.rides} Rides`, `
      <div class="se-mkt" style="margin-bottom:12px">
        <div class="se-good">
          <span><strong>🎫 Daily Conductor Shift</strong><small>Punch tickets on the midnight sleeper · +40 mon &amp; +25 Renown</small></span>
          <button type="button" class="btn btn-sm btn-accent" id="ex-sh" ${canShift ? "" : "disabled"}>${canShift ? "Work Shift" : "Worked Today ✓"}</button>
        </div>
      </div>
      <h4>Sleeper Train Timetable</h4>
      <div class="se-mkt">${rows}</div>
    `, (e) => {
      const sh = e.querySelector("#ex-sh");
      if (sh) sh.onclick = () => {
        if (st.shiftDay === today()) return;
        st.shiftDay = today();
        s.mon += 40;
        addRenown?.(25);
        ping("done");
        toast("All aboard! Conductor shift complete: +40 mon & +25 Renown.");
        save(); hud(); open();
      };

      e.querySelectorAll("[data-ride]").forEach((b) => {
        b.onclick = () => {
          const r = REGIONS[b.dataset.ride];
          if (!r || s.mon < 10) return;
          s.mon -= 10;
          st.rides++;
          ping("choice");
          save(); hud(); closePanel();
          teleport?.((r[1] + 0.5) * T, (r[2] + 1.5) * T);
          toast(`Arrived at ${r[0]}!`);
        };
      });
    });
  }

  return { open, state: st };
}
