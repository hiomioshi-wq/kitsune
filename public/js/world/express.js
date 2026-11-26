// Platform Zero Express: fast-travel sleeper train timetable & daily Conductor Shift.
import { esc, today } from "../util.js";

const STOPS = ["village", "clock", "shore", "market", "oz"];
const BRIDGE_STATIONS = [
  { id: "bay", name: "Moonwake Bay Pier", cost: 80 },
  { id: "pine", name: "Hollow Pine Viaduct", cost: 140 },
  { id: "sky", name: "Skyward Isles Terminus", cost: 220 },
];

export function createExpress(o) {
  const { s, REGIONS, panel, closePanel, toast, ping, save, hud, teleport, T, addRenown } = o;
  const st = (s.express ||= {});
  st.rides ||= 0;
  st.shiftDay ||= "";
  st.stations ||= {};

  function open() {
    const canShift = st.shiftDay !== today();
    const allStops = [...STOPS, ...BRIDGE_STATIONS.filter((b) => st.stations[b.id]).map((b) => b.id)];
    const rows = allStops.map((rk) => {
      const r = REGIONS[rk];
      if (!r) return "";
      const seen = !!s.visited?.[rk] || !!st.stations[rk];
      return `<div class="se-good">
        <span><strong>🚂 ${esc(r[0])}</strong><small>${seen ? "Express service · 10 mon" : "Visit on foot first to unlock rail pass"}</small></span>
        <button type="button" class="btn btn-sm btn-accent" data-ride="${rk}" ${!seen || s.mon < 10 ? "disabled" : ""}>Board (10)</button>
      </div>`;
    }).join("");

    const bridgeRows = BRIDGE_STATIONS.map((b, i) => {
      const built = !!st.stations[b.id];
      const prevBuilt = i === 0 || !!st.stations[BRIDGE_STATIONS[i - 1].id];
      return `<div class="se-good">
        <span><strong>🌉 ${esc(b.name)}</strong><small>${built ? "Bridge station open · Spirit Express route unlocked ✓" : prevBuilt ? `Fund construction (${b.cost} mon) for +30 Renown` : "Complete previous station first"}</small></span>
        ${built ? `<span class="pill pill-done">Built ✓</span>` : `<button type="button" class="btn btn-sm btn-accent" data-fund="${b.id}" ${!prevBuilt || s.mon < b.cost ? "disabled" : ""}>Fund (${b.cost})</button>`}
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
      <div class="se-mkt" style="margin-bottom:12px">${rows}</div>
      <h4>🌉 Build-a-Bridge Rail (Moonwake Bay → Skyward Isles)</h4>
      <p class="muted">Fund rail stations across the sky-bridge to unlock new Spirit Express routes.</p>
      <div class="se-mkt">${bridgeRows}</div>
    `, (e) => {
      e.querySelectorAll("[data-fund]").forEach((btn) => {
        btn.onclick = () => {
          const b = BRIDGE_STATIONS.find((q) => q.id === btn.dataset.fund);
          if (!b || st.stations[b.id] || s.mon < b.cost) return;
          s.mon -= b.cost;
          st.stations[b.id] = true;
          addRenown?.(30);
          ping("done");
          toast(`Built ${b.name}! New Spirit Express route unlocked & +30 Renown.`);
          save(); hud(); open();
        };
      });
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
