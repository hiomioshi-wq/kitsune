// Starlight Observatory: trace 6 World constellations in order on a night-sky canvas for mon, Astral Motes, and Renown.
import { esc, today } from "../util.js";

const CONSTELLATIONS = [
  { id: "ninetail", name: "The Nine-Tail", pts: [[90, 180], [150, 140], [220, 150], [280, 110], [340, 140], [390, 90]], mon: 45, motes: 12 },
  { id: "boat", name: "The Paper Boat", pts: [[120, 170], [200, 210], [300, 210], [380, 170], [250, 95]], mon: 40, motes: 10 },
  { id: "owl", name: "The Clockwork Owl", pts: [[170, 90], [250, 120], [330, 90], [300, 190], [200, 190]], mon: 45, motes: 12 },
  { id: "crown", name: "The Emerald Crown", pts: [[110, 180], [150, 100], [250, 145], [350, 100], [390, 180]], mon: 50, motes: 14 },
  { id: "nightjar", name: "The Nightjar", pts: [[95, 130], [190, 110], [260, 155], [340, 120], [410, 145]], mon: 40, motes: 10 },
  { id: "lantern", name: "The Ninth Lantern", pts: [[250, 70], [195, 130], [210, 210], [290, 210], [305, 130]], mon: 60, motes: 16 },
];

export function createStargaze(o) {
  const { s, panel, toast, ping, save, hud, addRenown } = o;
  const st = (s.stargaze ||= {});
  st.done ||= {};
  st.day ||= "";

  let curIdx = 0;
  let step = 0;

  function open(idx = curIdx) {
    curIdx = (idx + CONSTELLATIONS.length) % CONSTELLATIONS.length;
    const c = CONSTELLATIONS[curIdx];
    const aligned = !!st.done[c.id];
    const count = CONSTELLATIONS.filter((x) => st.done[x.id]).length;

    panel(`Starlight Observatory · ${count}/${CONSTELLATIONS.length}`, `
      <p class="muted">Click the numbered stars in order (1 → ${c.pts.length}) to align <strong>${esc(c.name)}</strong>. Earns <strong>+${c.mon} mon</strong>, <strong>+${c.motes} Astral Motes</strong>, and <strong>+25 Renown</strong>!</p>
      <canvas id="sg-cv" width="500" height="270" style="width:100%;max-width:520px;border-radius:12px;border:2px solid #7fd0ff;background:#070b20;cursor:pointer"></canvas>
      <div class="px-row" style="margin-top:10px">
        <button type="button" class="btn" id="sg-pv">◀ Prev</button>
        <strong>${esc(c.name)} ${aligned ? "✓" : `(${step}/${c.pts.length})`}</strong>
        <button type="button" class="btn" id="sg-nx">Next ▶</button>
      </div>
    `, (e) => {
      const cv = e.querySelector("#sg-cv");
      const g = cv.getContext("2d");

      const draw = () => {
        g.fillStyle = "#070b20";
        g.fillRect(0, 0, 500, 270);
        g.fillStyle = "#fff";
        for (let i = 0; i < 90; i++) {
          g.globalAlpha = 0.2 + (i % 4) * 0.15;
          g.fillRect((i * 137) % 500, (i * 79) % 270, 1.5, 1.5);
        }
        g.globalAlpha = 1;

        const lim = aligned ? c.pts.length : step;
        if (lim > 1) {
          g.strokeStyle = aligned ? "#7dff8a" : "#7fd0ff";
          g.lineWidth = 2.5;
          g.beginPath();
          for (let i = 0; i < lim; i++) {
            const [x, y] = c.pts[i];
            if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
          }
          g.stroke();
        }

        c.pts.forEach(([x, y], i) => {
          const lit = aligned || i < step;
          const next = !aligned && i === step;
          g.fillStyle = lit ? "#ffd84d" : next ? "#7fd0ff" : "#5a6a9a";
          g.beginPath();
          g.arc(x, y, next ? 11 : 8, 0, Math.PI * 2);
          g.fill();
          g.fillStyle = "#070b20";
          g.font = "900 11px system-ui";
          g.textAlign = "center";
          g.textBaseline = "middle";
          g.fillText(String(i + 1), x, y);
        });
      };

      draw();

      cv.onclick = (ev) => {
        if (aligned) return;
        const r = cv.getBoundingClientRect();
        const mx = ((ev.clientX - r.left) * 500) / r.width;
        const my = ((ev.clientY - r.top) * 270) / r.height;
        const [tx, ty] = c.pts[step];
        if (Math.hypot(mx - tx, my - ty) < 26) {
          step++;
          ping("choice");
          if (step >= c.pts.length) {
            st.done[c.id] = today();
            s.mon += c.mon;
            s.nexus ||= {};
            s.nexus.motes = (s.nexus.motes || 0) + c.motes;
            addRenown?.(25);
            ping("done");
            toast(`Aligned ${c.name}! +${c.mon} mon & +${c.motes} Astral Motes!`);
            save(); hud();
            step = 0;
            open(curIdx);
            return;
          }
          draw();
        } else {
          ping("blip");
        }
      };

      e.querySelector("#sg-pv").onclick = () => { step = 0; open(curIdx - 1); };
      e.querySelector("#sg-nx").onclick = () => { step = 0; open(curIdx + 1); };
    });
  }

  return { open, state: st };
}
