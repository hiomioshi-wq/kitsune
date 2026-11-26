// Saltwick Lighthouse Beacon: guide ships safely through coastal fog using matching signal colors for mon, pearls, and Renown.
import { esc, today } from "../util.js";

const SIGNALS = [
  { id: "amber", name: "Amber Flash", icon: "🟡" },
  { id: "emerald", name: "Emerald Pulse", icon: "🟢" },
  { id: "azure", name: "Azure Sweep", icon: "🔵" },
];

export function createBeacon(o) {
  const { s, panel, toast, ping, save, hud, extras, addRenown } = o;
  const st = (s.beacon ||= {});
  st.guided ||= 0;
  st.shiftDay ||= "";

  let ship = null;

  function nextShip() {
    const need = SIGNALS[Math.floor(Math.random() * SIGNALS.length)];
    ship = { name: ["SS Moonwake", "Saltwick Cutter", "Lantern Barge", "Starlight Schooner"][Math.floor(Math.random() * 4)], need };
    open();
  }

  function open() {
    const canShift = st.shiftDay !== today();
    if (st.guideDay !== today()) { st.guideDay = today(); st.guideN = 0; }
    const canGuide = (st.guideN || 0) < 5;
    const sigBtns = SIGNALS.map((sg) =>
      `<button type="button" class="btn btn-accent" data-sg="${sg.id}">${sg.icon} ${esc(sg.name)}</button>`
    ).join("");

    panel(`Saltwick Coastline Beacon · ${st.guided} Ships Guided`, `
      <div class="se-mkt" style="margin-bottom:12px">
        <div class="se-good">
          <span><strong>🗼 Daily Lens Polish</strong><small>Polish the lighthouse prism once per day · +25 mon &amp; +1 Pearl</small></span>
          <button type="button" class="btn btn-sm btn-accent" id="bc-pol" ${canShift ? "" : "disabled"}>${canShift ? "Polish Lens" : "Polished Today ✓"}</button>
        </div>
      </div>
      ${ship
        ? `<p><strong>${esc(ship.name)}</strong> is signaling in the fog! Match its beacon request: <strong>${ship.need.icon} ${esc(ship.need.name)}</strong></p>
           <div class="chips" style="margin-top:8px">${sigBtns}</div>`
        : `<p class="muted">Guide incoming vessels safely into Saltwick Harbor for mon and Renown (${st.guideN}/5 today).</p>
           <button type="button" class="btn btn-accent" id="bc-watch" ${canGuide ? "" : "disabled"}>${canGuide ? "Watch the Horizon" : "Harbor Clear Today"}</button>`}
    `, (e) => {
      const pol = e.querySelector("#bc-pol");
      if (pol) pol.onclick = () => {
        if (st.shiftDay === today()) return;
        st.shiftDay = today();
        s.mon += 25;
        const bag = extras?.state?.bag || ((s.x2 ||= {}).bag ||= {});
        bag.pearl = (bag.pearl || 0) + 1;
        addRenown?.(15);
        ping("done");
        toast("Lens polished! +25 mon & +1 Pearl.");
        save(); hud(); open();
      };

      const w = e.querySelector("#bc-watch");
      if (w) w.onclick = () => { if (canGuide) nextShip(); };

      e.querySelectorAll("[data-sg]").forEach((b) => {
        b.onclick = () => {
          if (!ship) return;
          if (b.dataset.sg === ship.need.id) {
            st.guided++;
            st.guideN = (st.guideN || 0) + 1;
            s.mon += 24;
            addRenown?.(12);
            ping("done");
            toast(`${ship.name} docked safely! +24 mon & +12 Renown!`);
            ship = null;
          } else {
            ping("blip");
            toast("Wrong signal! Try matching the ship's color.");
          }
          save(); hud(); open();
        };
      });
    });
  }

  return { open, state: st };
}
