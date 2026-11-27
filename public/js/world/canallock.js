// The Canal Lock House: pour water between three unmarked basins until one holds exactly the target.
import { dailyHouse, seeded } from "./puzzlekit.js";

// Basin sizes; the largest starts full and the others empty.
export const BASINS = [[8, 5, 3], [10, 7, 3], [12, 7, 5], [12, 8, 5], [16, 9, 7], [14, 9, 5], [11, 7, 4], [13, 8, 5]];
export const NAMES = ["Upper basin", "Middle basin", "Little basin"];

export const startOf = (sizes) => [sizes[0], 0, 0];
export function pour(sizes, water, from, to) {
  const next = [...water];
  const amount = from === to ? 0 : Math.min(next[from], sizes[to] - next[to]);
  next[from] -= amount;
  next[to] += amount;
  return next;
}
/** Breadth-first search: fewest pours needed to get every reachable amount into some basin. */
export function distances(sizes) {
  const start = startOf(sizes), seen = new Set([start.join()]), best = new Map();
  let edge = [start];
  for (let depth = 0; edge.length; depth++) {
    const next = [];
    for (const water of edge) {
      for (const v of water) if (!best.has(v)) best.set(v, depth);
      for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) {
        const w = pour(sizes, water, a, b);
        if (!seen.has(w.join())) { seen.add(w.join()); next.push(w); }
      }
    }
    edge = next;
  }
  return best;
}
/** Today's basins and target. Targets that take fewer than three pours are too easy to be set. */
export function puzzleFor(day) {
  const random = seeded(`canal:${day}`);
  const sizes = BASINS[Math.floor(random() * BASINS.length)];
  const choices = [...distances(sizes)].filter(([v, d]) => v > 0 && d >= 3).sort((a, b) => a[0] - b[0]);
  const [target, par] = choices[Math.floor(random() * choices.length)];
  return { sizes, target, par };
}

export function createCanalLock(o) {
  const { panel, toast, ping, save } = o;
  const house = dailyHouse(o, { key: "canallock", hat: "lockkeeperhat", furn: "lockmodel", fresh: (day) => ({ water: startOf(puzzleFor(day).sizes), moves: 0, from: -1, done: false }) });
  let note = "";

  function open() {
    const run = house.run();
    const { sizes, target, par } = puzzleFor(house.st.day);
    const tanks = sizes.map((size, i) => `<button type="button" data-key="b${i}" data-basin="${i}" ${run.done ? "disabled" : ""} aria-pressed="${run.from === i}" aria-label="${NAMES[i]}: ${run.water[i]} of ${size} measures${run.from === i ? ", chosen to pour from" : ""}" style="display:flex;flex-direction:column;align-items:center;gap:6px;background:transparent;border:2px ${run.from === i ? "solid #ffd84d" : "solid transparent"};border-radius:12px;padding:8px;cursor:pointer;color:inherit;font:inherit">
        <span style="position:relative;display:block;width:68px;height:${40 + size * 9}px;border:3px solid #8a6a48;border-top-width:0;border-radius:0 0 14px 14px;overflow:hidden;background:rgba(120,140,170,.15)"><span style="position:absolute;left:0;right:0;bottom:0;height:${(run.water[i] / size) * 100}%;background:linear-gradient(#7fd8f0,#2f7ab0);transition:height .3s"></span></span>
        <strong style="font-size:18px">${run.water[i]} / ${size}</strong><small>${NAMES[i]}</small></button>`).join("");

    panel(`Canal Lock House · ${house.st.solves} lock${house.st.solves === 1 ? "" : "s"} set`, `
      <p class="muted">The lock-keeper needs exactly <strong>${target} ${target === 1 ? "measure" : "measures"}</strong> in any basin. Tap a basin to pour from, then the basin to pour into. Water pours until one is empty or the other is full.</p>
      <div style="display:flex;justify-content:center;align-items:flex-end;gap:10px;margin:12px 0">${tanks}</div>
      <p style="text-align:center;margin:8px 0"><strong>Target:</strong> ${target} · <strong>Pours:</strong> ${run.moves} · <strong>Best possible:</strong> ${par}${house.paid() ? " · <strong>Fee paid today</strong>" : ""}</p>
      <div class="chips" style="justify-content:center"><button type="button" class="btn" data-key="reset">Refill and start over</button></div>
      ${note ? `<p class="hint" aria-live="polite">${note}</p>` : ""}
    `, (e) => {
      e.querySelectorAll("[data-basin]").forEach((b) => (b.onclick = () => {
        const i = +b.dataset.basin;
        if (run.from < 0) {
          if (!run.water[i]) return toast("That basin is empty.");
          run.from = i;
        } else if (run.from === i) run.from = -1;
        else {
          const next = pour(sizes, run.water, run.from, i);
          run.from = -1;
          if (next.join() === run.water.join()) { toast("That basin is already full."); }
          else {
            run.water = next;
            run.moves++;
            if (next.includes(target)) {
              run.done = true;
              note = house.reward(run.moves <= par ? 100 : 65, 20, run.moves <= par ? `Perfect: ${run.moves} pours.` : `Set in ${run.moves} pours.`);
            } else ping("blip");
          }
        }
        save();
        open();
      }));
      e.querySelector('[data-key="reset"]').onclick = () => {
        Object.assign(run, { water: startOf(sizes), moves: 0, from: -1, done: false });
        note = "";
        save();
        open();
      };
    });
  }

  return { open: () => { note = ""; open(); }, state: house.st };
}
