// Skyward Windvane Loft: align 3 windmill sails to incoming gusts + daily breeze check.
import { esc, today } from "../util.js";

const DIRS = ["N", "E", "S", "W"];

export function createWindvane(o) {
  const { s, panel, toast, ping, save, hud, addRenown } = o;
  const st = (s.windvane ||= {});
  st.tuned ||= 0;
  st.breezeDay ||= "";

  let rig = null;

  function startRig() {
    const target = [0, 1, 2].map(() => Math.floor(Math.random() * 4));
    const vanes = [0, 1, 2].map(() => Math.floor(Math.random() * 4));
    if (vanes.every((v, i) => v === target[i])) vanes[0] = (vanes[0] + 1) % 4;
    rig = { target, vanes, turns: 0, over: false };
    open();
  }

  function open() {
    const canCheck = st.breezeDay !== today();
    let body = "";

    if (!rig) {
      body = `
        <p class="muted">Turn the three canvas windmill sails (N, E, S, W) to catch the mountain gusts. Aligning all three pays <strong>55 mon</strong> &amp; <strong>+25 Renown</strong>.</p>
        <p>Gusts harnessed: <strong>${st.tuned}</strong></p>
        <div class="px-row">
          <button type="button" class="btn btn-accent" id="wv-go">Trim Sails</button>
          <button type="button" class="btn" id="wv-day" ${canCheck ? "" : "disabled"}>${canCheck ? "Daily Breeze Check (+20 mon)" : "Checked Today ✓"}</button>
        </div>`;
    } else {
      const rows = [0, 1, 2].map((i) => `
        <div class="se-good">
          <span><strong>🌬️ Sail ${i + 1}: ${DIRS[rig.vanes[i]]}</strong> <small>(Gust: ${DIRS[rig.target[i]]})</small></span>
          <button type="button" class="btn btn-sm btn-accent" data-wv="${i}" ${rig.over ? "disabled" : ""}>Rotate ↻</button>
        </div>`).join("");

      body = `
        <p class="muted">Rotations: <strong>${rig.turns}/10</strong></p>
        <div class="se-mkt" style="margin:10px 0">${rows}</div>
        ${rig.over ? `<button type="button" class="btn btn-accent" id="wv-go">Catch Next Gust</button>` : ""}`;
    }

    panel("Skyward Windvane Loft", body, (e) => {
      const go = e.querySelector("#wv-go");
      if (go) go.onclick = startRig;

      const dayBtn = e.querySelector("#wv-day");
      if (dayBtn) dayBtn.onclick = () => {
        if (st.breezeDay === today()) return;
        st.breezeDay = today();
        s.mon += 20;
        addRenown?.(15);
        ping("done");
        toast("Logged a brisk tailwind from Saltwick! +20 mon & +15 Renown.");
        save(); hud(); open();
      };

      e.querySelectorAll("[data-wv]").forEach((btn) => {
        btn.onclick = () => {
          if (!rig || rig.over) return;
          const idx = Number(btn.dataset.wv);
          rig.turns++;
          rig.vanes[idx] = (rig.vanes[idx] + 1) % 4;
          ping("blip");

          if (rig.vanes.every((v, i) => v === rig.target[i])) {
            rig.over = true;
            st.tuned++;
            s.mon += 55;
            addRenown?.(25);
            ping("done");
            toast("The sails catch the full updraft! +55 mon & +25 Renown.");
            save(); hud();
          } else if (rig.turns >= 10) {
            rig.over = true;
            ping("close");
            toast("The gust passed before the sails locked in.");
          }
          open();
        };
      });
    });
  }

  return { open };
}
