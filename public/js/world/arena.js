// The Astral Arena: Boss Rush & 4-Champion Gauntlet using the boss engine.
import { BOSSES, startBoss } from "./boss.js";
import { drawFox } from "./art.js";
import { esc } from "../util.js";

export const ARENA_CHAMPS = ["paper_ronin", "tide_chimera", "meridian_mech", "nine_shadow", "glasswing", "kiln_wyrm", "tick_colossus"];
export const BW_CHAMPS = ["gargoyleking", "quorumgoose", "firstwinter", "griefwarden", "thermalcore", "paperwork", "sugarrush", "threeseconds", "hrs_bailiff", "compliance_agent"];
export const ALL_CHAMPS = [...ARENA_CHAMPS, ...BW_CHAMPS];

export function createArena(o) {
  const { s, root, panel, closePanel, toast, ping, save, hud, trophy, addRenown, fur, tailsN } = o;
  const st = (s.arena ||= {});
  st.beat ??= {};
  st.best ??= {};
  st.gauntlet ??= 0;

  let activeEl = null;

  function fight(id, gauntletIdx = -1, list = ARENA_CHAMPS) {
    closePanel();
    const B = BOSSES[id];
    if (!B) return;

    const el = document.createElement("div");
    el.className = "rm rm-fight";
    el.tabIndex = 0;
    el.innerHTML = `<div class="rm-top"><strong class="rm-place">Astral Arena · ${esc(B.name)}</strong><span class="rm-goal">${gauntletIdx >= 0 ? `Gauntlet Round ${gauntletIdx + 1}/${list.length}` : esc(B.intro)}</span><button class="btn btn-sm rm-leave" type="button">Forfeit <kbd>Esc</kbd></button></div><canvas class="rm-c"></canvas>`;
    root.appendChild(el);
    activeEl = el;

    const c = el.querySelector(".rm-c"), g = c.getContext("2d");
    const keys = new Set();
    let alive = true, raf = 0, last = performance.now(), cw = 800, ch = 500;
    const resize = () => { const r = el.getBoundingClientRect(); cw = c.width = Math.max(320, r.width); ch = c.height = Math.max(240, r.height - 44); };
    const ro = new ResizeObserver(resize); ro.observe(el); resize();

    const cleanup = () => {
      if (!alive) return;
      alive = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener("keydown", onKey, true);
      document.removeEventListener("keyup", onUp, true);
      el.remove();
      activeEl = null;
      root.focus({ preventScroll: true });
    };

    const boss = startBoss(id, {
      ping,
      fox: (a, x, y, d, step, m, t) => drawFox(a, x, y, d, step, fur(), tailsN(), s.hat, t, m),
      end: (won, secs) => {
        cleanup();
        if (won === undefined) return;
        if (!won) {
          toast(`${B.name} defeated you. ${B.lose}`);
          return board();
        }
        const first = !st.beat[id];
        st.beat[id] = (st.beat[id] || 0) + 1;
        st.best[id] = Math.min(st.best[id] || 1e9, Math.round(secs));
        if (first) {
          s.mon += 300;
          trophy(B.hat, B.furn);
          addRenown(150);
          toast(`Victory! Won ${B.hatName} & ${B.furnName}! (+300 mon)`);
        } else {
          s.mon += 90;
          addRenown(40);
          toast(`${B.name} defeated in ${Math.round(secs)}s! (+90 mon)`);
        }
        save(); hud();
        if (gauntletIdx >= 0) {
          if (gauntletIdx + 1 < list.length) {
            return fight(list[gauntletIdx + 1], gauntletIdx + 1, list);
          }
          const isBw = list === BW_CHAMPS;
          st.gauntlet++;
          if (isBw) st.bwGauntlet = (st.bwGauntlet || 0) + 1;
          s.mon += isBw ? 2000 : 1000;
          addRenown(isBw ? 500 : 300);
          save(); hud();
          toast(isBw ? "BLACKWOOD GAUNTLET CLEARED! +2,000 mon and +500 Renown!" : "GRAND GAUNTLET CLEARED! +1,000 mon and +300 Renown!");
        }
        board();
      },
    });

    const onKey = (e) => {
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      e.stopPropagation();
      if (k === "Escape") { e.preventDefault(); cleanup(); board(); return; }
      if (["w", "a", "s", "d", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Shift"].includes(k)) { e.preventDefault(); keys.add(k); }
    };
    const onUp = (e) => keys.delete(e.key.length === 1 ? e.key.toLowerCase() : e.key);
    document.addEventListener("keydown", onKey, true);
    document.addEventListener("keyup", onUp, true);
    el.querySelector(".rm-leave").onclick = () => { cleanup(); board(); };

    const frame = (now) => {
      if (!alive) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const ax = (keys.has("d") || keys.has("ArrowRight") ? 1 : 0) - (keys.has("a") || keys.has("ArrowLeft") ? 1 : 0);
      const ay = (keys.has("s") || keys.has("ArrowDown") ? 1 : 0) - (keys.has("w") || keys.has("ArrowUp") ? 1 : 0);
      boss.update(dt, ax, ay, keys.has("Shift"), now);
      boss.draw(g, cw, ch, now, false);
      raf = requestAnimationFrame(frame);
    };
    el.focus({ preventScroll: true });
    raf = requestAnimationFrame(frame);
  }

  function board() {
    const done = ALL_CHAMPS.filter((id) => st.beat[id]).length;
    panel("Astral Arena", `<p class="muted">Challenge the Astral & Blackwood Champions individually or clear a Gauntlet in one run. Cleared: <strong>${done}/${ALL_CHAMPS.length}</strong> · Gauntlets won: <strong>${st.gauntlet}</strong></p>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">
        <button class="btn btn-accent" type="button" id="ar-gauntlet" style="white-space:normal;max-width:100%">Astral Gauntlet (${ARENA_CHAMPS.length} Champions · +1,000 mon)</button>
        <button class="btn btn-accent" type="button" id="ar-bw-gauntlet" style="white-space:normal;max-width:100%">Blackwood Gauntlet (6 Champions · +2,000 mon)</button>
      </div>
      <div class="se-mkt">${ALL_CHAMPS.map((id) => {
        const B = BOSSES[id], best = st.best[id];
        return `<div class="se-good${st.beat[id] ? " cheap" : ""}"><span><strong>${esc(B.name)}</strong><small>${esc(B.hatName)} & ${esc(B.furnName)} · ${best ? `Best ${best}s` : "Unbeaten"}</small></span><button class="btn btn-accent" type="button" data-ar="${id}">${st.beat[id] ? "Rematch" : "Challenge"}</button></div>`;
      }).join("")}</div>`, (e) => {
      e.querySelector("#ar-gauntlet").onclick = () => fight(ARENA_CHAMPS[0], 0, ARENA_CHAMPS);
      e.querySelector("#ar-bw-gauntlet").onclick = () => fight(BW_CHAMPS[0], 0, BW_CHAMPS);
      e.querySelectorAll("[data-ar]").forEach((b) => (b.onclick = () => fight(b.dataset.ar)));
    });
  }

  return { board, fight, state: st, get active() { return !!activeEl; } };
}
