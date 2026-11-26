// Brask Clocktower: align 3 brass gears to target positions + daily chime check-in for mon and Renown.
import { today } from "../util.js";

export function createClocktower(o) {
  const { s, panel, toast, ping, save, hud, addRenown } = o;
  const st = (s.clocktower ||= {});
  st.solves ||= 0;
  st.chimeDay ||= "";

  let puzzle = null;

  function startPuzzle() {
    puzzle = {
      gears: [0, 1, 2].map(() => Math.floor(Math.random() * 6)),
      target: [0, 1, 2].map(() => Math.floor(Math.random() * 6)),
      moves: 0,
      over: false,
    };
    if (puzzle.gears.every((v, i) => v === puzzle.target[i])) puzzle.gears[0] = (puzzle.gears[0] + 1) % 6;
    open();
  }

  function open() {
    const canChime = st.chimeDay !== today();
    let body = "";

    if (!puzzle) {
      body = `
        <p class="muted">Synchronize the three brass gears of Brask's clocktower (0–5) to match the target chime. Solving awards <strong>55 mon</strong> &amp; <strong>+25 Renown</strong>!</p>
        <p>Clocktowers synchronized: <strong>${st.solves}</strong></p>
        <div class="px-row">
          <button type="button" class="btn btn-accent" id="ct-go">Align Gears</button>
          <button type="button" class="btn" id="ct-chime" ${canChime ? "" : "disabled"}>${canChime ? "Daily Chime (+20 mon)" : "Chimed Today ✓"}</button>
        </div>`;
    } else {
      const rows = [0, 1, 2].map((i) =>
        `<div class="se-good">
          <span><strong>⚙️ Gear ${i + 1}: ${puzzle.gears[i]}</strong> <small>(Target: ${puzzle.target[i]})</small></span>
          <div style="display:flex;gap:6px">
            <button type="button" class="btn btn-sm" data-rot="${i}:-1" ${puzzle.over ? "disabled" : ""}>−1</button>
            <button type="button" class="btn btn-sm btn-accent" data-rot="${i}:1" ${puzzle.over ? "disabled" : ""}>+1</button>
          </div>
        </div>`
      ).join("");

      body = `
        <p class="muted">Moves: <strong>${puzzle.moves}/12</strong> · Rotating Gear 1 nudges Gear 2; rotating Gear 2 nudges Gear 3.</p>
        <div class="se-mkt" style="margin:10px 0">${rows}</div>
        ${puzzle.over ? `<button type="button" class="btn btn-accent" id="ct-go">New Alignment</button>` : ""}`;
    }

    panel("Brask Clocktower", body, (e) => {
      const go = e.querySelector("#ct-go");
      if (go) go.onclick = startPuzzle;

      const ch = e.querySelector("#ct-chime");
      if (ch) ch.onclick = () => {
        if (st.chimeDay === today()) return;
        st.chimeDay = today();
        s.mon += 20;
        addRenown?.(15);
        ping("done");
        toast("The Brask bell chimes three seconds behind noon! +20 mon & +15 Renown.");
        save(); hud(); open();
      };

      e.querySelectorAll("[data-rot]").forEach((b) => {
        b.onclick = () => {
          if (!puzzle || puzzle.over) return;
          const [idx, dir] = b.dataset.rot.split(":").map(Number);
          puzzle.moves++;
          puzzle.gears[idx] = (puzzle.gears[idx] + dir + 6) % 6;
          if (idx === 0) puzzle.gears[1] = (puzzle.gears[1] + dir + 6) % 6;
          if (idx === 1) puzzle.gears[2] = (puzzle.gears[2] + dir + 6) % 6;
          ping("blip");

          if (puzzle.gears.every((v, i) => v === puzzle.target[i])) {
            puzzle.over = true;
            st.solves++;
            s.mon += 55;
            addRenown?.(25);
            ping("done");
            toast(`Clocktower synchronized in ${puzzle.moves} moves! +55 mon & +25 Renown!`);
            save(); hud();
          } else if (puzzle.moves >= 12) {
            puzzle.over = true;
            toast("Out of moves! The gears reset.");
          }
          open();
        };
      });
    });
  }

  return { open, state: st };
}
