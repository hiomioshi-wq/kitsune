// The Mosaic Court: turning a tile also turns its neighbours. Turn the whole floor sun-side up.
import { dailyHouse, seeded } from "./puzzlekit.js";

export const SIDE = 5;
export const PRESSES = 7;

/** The tile itself and the ones sharing an edge with it. */
export function turned(i) {
  const x = i % SIDE, y = Math.floor(i / SIDE);
  return [[x, y], [x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]
    .filter(([a, b]) => a >= 0 && a < SIDE && b >= 0 && b < SIDE)
    .map(([a, b]) => b * SIDE + a);
}
export function press(floor, i) {
  const next = [...floor];
  for (const j of turned(i)) next[j] = next[j] ? 0 : 1;
  return next;
}
/** 1 = moon side up. Built by pressing a solved floor, so it can always be solved. */
export function floorFor(day) {
  const random = seeded(`mosaic:${day}`);
  for (;;) {
    const picks = new Set();
    while (picks.size < PRESSES) picks.add(Math.floor(random() * SIDE * SIDE));
    const floor = [...picks].reduce(press, Array(SIDE * SIDE).fill(0));
    if (floor.some(Boolean)) return { floor, answer: [...picks] };
  }
}

export function createMosaic(o) {
  const { panel, ping, save } = o;
  const house = dailyHouse(o, { key: "mosaic", hat: "mosaicband", furn: "mosaictable", fresh: (day) => ({ floor: floorFor(day).floor, moves: 0, pressed: [], hint: false }) });
  let note = "";

  /** Presses that still need making: today's answer, with every press you've made toggled in or out. */
  const remaining = (run) => {
    const need = new Set(floorFor(house.st.day).answer);
    for (const i of run.pressed) if (need.has(i)) need.delete(i); else need.add(i);
    return [...need];
  };

  function open() {
    const run = house.run();
    const clear = !run.floor.some(Boolean);
    const next = run.hint && !clear ? remaining(run)[0] : -1;
    const tiles = run.floor.map((v, i) => `<button type="button" data-key="t${i}" data-tile="${i}" ${clear ? "disabled" : ""} aria-label="Row ${Math.floor(i / SIDE) + 1}, column ${(i % SIDE) + 1}: ${v ? "moon" : "sun"}${i === next ? ", suggested" : ""}" style="aspect-ratio:1;border-radius:8px;cursor:pointer;font-size:22px;padding:0;min-width:0;background:${v ? "#2f3a6a" : "#f2b84a"};border:3px ${i === next ? "dashed #35d68a" : `solid ${v ? "#8a9ad8" : "#fff0c0"}`}">${v ? "🌙" : "☀️"}</button>`).join("");

    panel(`Mosaic Court · ${house.st.solves} floor${house.st.solves === 1 ? "" : "s"} laid`, `
      <p class="muted">Tap a tile to turn it over, along with the tiles touching its sides. Get every tile sun-side up. A fresh floor is laid every day.</p>
      <div><div style="display:grid;grid-template-columns:repeat(${SIDE},1fr);gap:5px;flex:none;width:100%;max-width:330px;margin:10px auto">${tiles}</div></div>
      <p style="text-align:center;margin:8px 0"><strong>Moons left:</strong> ${run.floor.filter(Boolean).length} · <strong>Turns:</strong> ${run.moves}${house.paid() ? " · <strong>Fee paid today</strong>" : ""}</p>
      <div class="chips" style="justify-content:center">
        <button type="button" class="btn" data-key="hint" ${clear ? "disabled" : ""}>${run.hint ? "Hide the mason's hint" : "Mason's hint (halves the fee)"}</button>
        <button type="button" class="btn" data-key="reset">Lay it again</button>
      </div>
      ${note ? `<p class="hint" aria-live="polite">${note}</p>` : ""}
    `, (e) => {
      e.querySelectorAll("[data-tile]").forEach((b) => (b.onclick = () => {
        const i = +b.dataset.tile;
        run.floor = press(run.floor, i);
        run.pressed.push(i);
        run.moves++;
        if (!run.floor.some(Boolean)) {
          const fee = run.usedHint ? 40 : 80;
          note = house.reward(fee, 20, `Sunlit in ${run.moves} turns.`);
        } else ping("blip");
        save();
        open();
      }));
      e.querySelector('[data-key="hint"]').onclick = () => { run.hint = !run.hint; run.usedHint = true; save(); open(); };
      e.querySelector('[data-key="reset"]').onclick = () => {
        Object.assign(run, { floor: floorFor(house.st.day).floor, moves: 0, pressed: [] });
        note = "";
        save();
        open();
      };
    });
  }

  return { open: () => { note = ""; open(); }, state: house.st };
}
