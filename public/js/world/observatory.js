// Foxhold Observatory: tune telescope dials to track celestial bodies + daily sky log for mon and Renown.
import { esc, today } from "../util.js";

const TARGETS = [
  { name: "Comet Kitsune", icon: "☄️" },
  { name: "Amber Nebula", icon: "🌌" },
  { name: "Moonwake Ring", icon: "🪐" },
  { name: "Nine-Tail Cluster", icon: "✨" },
];

const DIALS = ["Aperture", "Focus", "Filter"];

export function createObservatory(o) {
  const { s, panel, toast, ping, save, hud, addRenown } = o;
  const st = (s.observatory ||= {});
  st.logged ||= 0;
  st.logDay ||= "";

  let scope = null;

  function startScope() {
    const pick = TARGETS[Math.floor(Math.random() * TARGETS.length)];
    const target = [0, 1, 2].map(() => 1 + Math.floor(Math.random() * 5));
    const dials = [0, 1, 2].map(() => 1 + Math.floor(Math.random() * 5));
    if (dials.every((v, i) => v === target[i])) dials[0] = (dials[0] % 5) + 1;
    scope = { pick, target, dials, steps: 0, over: false };
    open();
  }

  function open() {
    const canLog = st.logDay !== today();
    let body = "";

    if (!scope) {
      body = `
        <p class="muted">Calibrate the brass telescope's three dials (1–5) to lock onto passing celestial bodies. Each sighting pays <strong>60 mon</strong> &amp; <strong>+25 Renown</strong>.</p>
        <p>Celestial sightings logged: <strong>${st.logged}</strong></p>
        <div class="px-row">
          <button type="button" class="btn btn-accent" id="ob-go">Aim Telescope</button>
          <button type="button" class="btn" id="ob-day" ${canLog ? "" : "disabled"}>${canLog ? "Daily Sky Log (+20 mon)" : "Logged Today ✓"}</button>
        </div>`;
    } else {
      const rows = DIALS.map((label, i) => {
        const diff = Math.abs(scope.dials[i] - scope.target[i]);
        const hint = diff === 0 ? "Locked ✓" : diff === 1 ? "Warm" : "Cold";
        return `<div class="se-good">
          <span><strong>🔭 ${esc(label)}: ${scope.dials[i]}</strong> <small>${hint}</small></span>
          <div style="display:flex;gap:6px">
            <button type="button" class="btn btn-sm" data-dial="${i}:-1" ${scope.over ? "disabled" : ""}>−</button>
            <button type="button" class="btn btn-sm btn-accent" data-dial="${i}:1" ${scope.over ? "disabled" : ""}>+</button>
          </div>
        </div>`;
      }).join("");

      body = `
        <p class="muted">Tracking: <strong>${scope.pick.icon} ${esc(scope.pick.name)}</strong> · Adjustments: <strong>${scope.steps}/10</strong></p>
        <div class="se-mkt" style="margin:10px 0">${rows}</div>
        ${scope.over ? `<button type="button" class="btn btn-accent" id="ob-go">Track Another</button>` : ""}`;
    }

    panel("Foxhold Observatory", body, (e) => {
      const go = e.querySelector("#ob-go");
      if (go) go.onclick = startScope;

      const dayBtn = e.querySelector("#ob-day");
      if (dayBtn) dayBtn.onclick = () => {
        if (st.logDay === today()) return;
        st.logDay = today();
        s.mon += 20;
        addRenown?.(15);
        ping("done");
        toast("Recorded tonight's horizon starlight! +20 mon & +15 Renown.");
        save(); hud(); open();
      };

      e.querySelectorAll("[data-dial]").forEach((b) => {
        b.onclick = () => {
          if (!scope || scope.over) return;
          const [idx, dir] = b.dataset.dial.split(":").map(Number);
          scope.steps++;
          scope.dials[idx] = ((scope.dials[idx] - 1 + dir + 5) % 5) + 1;
          ping("blip");

          if (scope.dials.every((v, i) => v === scope.target[i])) {
            scope.over = true;
            st.logged++;
            s.mon += 60;
            addRenown?.(25);
            ping("done");
            toast(`${scope.pick.icon} ${scope.pick.name} locked in! +60 mon & +25 Renown.`);
            save(); hud();
          } else if (scope.steps >= 10) {
            scope.over = true;
            ping("close");
            toast(`${scope.pick.name} drifted behind cloud cover.`);
          }
          open();
        };
      });
    });
  }

  return { open };
}
