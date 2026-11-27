// The Stained Glass Studio: colour every pane so no two panes that share an edge match.
import { dailyHouse, seeded } from "./puzzlekit.js";

export const SIDE = 6;
export const PANES = 11;
export const GLASS = [
  { name: "Ruby", hex: "#d8414f", mark: "◆" },
  { name: "Amber", hex: "#f2a81d", mark: "●" },
  { name: "Leaf", hex: "#3fa860", mark: "▲" },
  { name: "Cobalt", hex: "#3f6fd8", mark: "■" },
];

const sides = (i) => {
  const x = i % SIDE, y = Math.floor(i / SIDE);
  return [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]].filter(([a, b]) => a >= 0 && a < SIDE && b >= 0 && b < SIDE).map(([a, b]) => b * SIDE + a);
};

/** Grow PANES connected panes over the grid. Grid regions form a flat map, so four colours always suffice. */
export function windowFor(day) {
  const random = seeded(`glass:${day}`);
  const owner = Array(SIDE * SIDE).fill(-1);
  const take = (n) => Math.floor(random() * n);
  for (let p = 0; p < PANES; ) {
    const i = take(owner.length);
    if (owner[i] < 0) owner[i] = p++;
  }
  while (owner.includes(-1)) {
    const grow = [];
    owner.forEach((p, i) => { if (p < 0) for (const j of sides(i)) if (owner[j] >= 0) grow.push([i, owner[j]]); });
    const [i, p] = grow[take(grow.length)];
    owner[i] = p;
  }
  const touching = Array.from({ length: PANES }, () => new Set());
  owner.forEach((p, i) => { for (const j of sides(i)) if (owner[j] !== p) touching[p].add(owner[j]); });
  const near = touching.map((set) => [...set]);
  const answer = solve(near);
  // The glazier has already leaded in three panes.
  const fixed = {};
  while (Object.keys(fixed).length < 3) { const p = take(PANES); fixed[p] = answer[p]; }
  return { owner, near, fixed };
}

/** Backtracking four-colouring, honouring any panes already coloured. */
export function solve(near, given = {}) {
  const colour = near.map((_, p) => given[p] ?? -1);
  const order = near.map((_, p) => p).sort((a, b) => near[b].length - near[a].length);
  const place = (k) => {
    if (k === order.length) return true;
    const p = order[k];
    if (colour[p] >= 0) return place(k + 1);
    for (let c = 0; c < GLASS.length; c++) {
      if (near[p].some((q) => colour[q] === c)) continue;
      colour[p] = c;
      if (place(k + 1)) return true;
      colour[p] = -1;
    }
    return false;
  };
  return place(0) ? colour : null;
}

/** Panes that clash with a neighbour. */
export const clashes = (near, colour) => near.map((list, p) => colour[p] >= 0 && list.some((q) => colour[q] === colour[p]));
export const finished = (near, colour) => colour.every((c) => c >= 0) && !clashes(near, colour).some(Boolean);

export function createStainedGlass(o) {
  const { panel, ping, save } = o;
  const fresh = (day) => { const w = windowFor(day); return { colour: w.near.map((_, p) => w.fixed[p] ?? -1), brush: 0, done: false }; };
  const house = dailyHouse(o, { key: "stainedglass", hat: "glazierhat", furn: "suncatcher", fresh });
  let note = "";

  function open() {
    const run = house.run();
    const { owner, near, fixed } = windowFor(house.st.day);
    const bad = clashes(near, run.colour);
    const first = new Map();
    owner.forEach((p, i) => { if (!first.has(p)) first.set(p, i); });
    // One button per square; the lead lines only show where two panes meet.
    const cells = owner.map((p, i) => {
      const x = i % SIDE, y = Math.floor(i / SIDE), c = run.colour[p];
      const lead = (j, inside) => (inside && owner[j] === p ? "0 solid transparent" : "3px solid #1c1826");
      const head = first.get(p) === i;
      return `<button type="button" data-key="c${i}" data-pane="${p}" ${head ? "" : 'tabindex="-1" aria-hidden="true"'} ${run.done || p in fixed ? 'aria-disabled="true"' : ""} ${head ? `aria-label="Pane ${p + 1}: ${c < 0 ? "clear" : GLASS[c].name}${p in fixed ? ", set by the glazier" : ""}${bad[p] ? ", clashes with a neighbour" : ""}"` : ""} style="width:100%;height:100%;min-height:0;padding:0;min-width:0;border-radius:0;cursor:${p in fixed ? "default" : "pointer"};font-size:15px;color:#fff;text-shadow:0 1px 2px #000;background:${c < 0 ? "rgba(220,235,255,.18)" : GLASS[c].hex};border-left:${lead(i - 1, x > 0)};border-right:${lead(i + 1, x < SIDE - 1)};border-top:${lead(i - SIDE, y > 0)};border-bottom:${lead(i + SIDE, y < SIDE - 1)}">${head ? (p in fixed ? "📌" : bad[p] ? "✕" : c < 0 ? "" : GLASS[c].mark) : ""}</button>`;
    }).join("");
    const brushes = GLASS.map((g, i) => `<button type="button" class="btn${run.brush === i ? " btn-accent" : ""}" data-key="g${i}" data-glass="${i}" aria-pressed="${run.brush === i}"><span style="color:${g.hex}">${g.mark}</span> ${g.name}</button>`).join("");

    panel(`Stained Glass Studio · ${house.st.solves} window${house.st.solves === 1 ? "" : "s"}`, `
      <p class="muted">Pick a glass, then tap panes to fit it. Panes that share an edge must be different colours. Tap a pane again to clear it. Panes marked 📌 are already set.</p>
      <div class="chips" style="justify-content:center">${brushes}</div>
      <div><div style="display:grid;grid-template-columns:repeat(${SIDE},1fr);grid-template-rows:repeat(${SIDE},minmax(0,1fr));aspect-ratio:1;flex:none;box-sizing:border-box;width:100%;max-width:330px;margin:10px auto;border:5px solid #1c1826;border-radius:10px;overflow:hidden">${cells}</div></div>
      <p style="text-align:center;margin:8px 0"><strong>Panes fitted:</strong> ${run.colour.filter((c) => c >= 0).length}/${PANES} · <strong>Clashing:</strong> ${bad.filter(Boolean).length}${house.paid() ? " · <strong>Fee paid today</strong>" : ""}</p>
      <div class="chips" style="justify-content:center"><button type="button" class="btn" data-key="reset">Take the glass out</button></div>
      ${note ? `<p class="hint" aria-live="polite">${note}</p>` : ""}
    `, (e) => {
      e.querySelectorAll("[data-glass]").forEach((b) => (b.onclick = () => { run.brush = +b.dataset.glass; save(); open(); }));
      e.querySelectorAll("[data-pane]").forEach((b) => (b.onclick = () => {
        const p = +b.dataset.pane;
        if (run.done || p in fixed) return;
        run.colour[p] = run.colour[p] === run.brush ? -1 : run.brush;
        if (finished(near, run.colour)) {
          run.done = true;
          note = house.reward(85, 20, "The window catches the light.");
        } else ping("blip");
        save();
        open();
      }));
      e.querySelector('[data-key="reset"]').onclick = () => {
        Object.assign(run, fresh(house.st.day), { brush: run.brush });
        note = "";
        save();
        open();
      };
    });
  }

  return { open: () => { note = ""; open(); }, state: house.st };
}
