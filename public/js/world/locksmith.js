// The Locksmith: work out a four-pin combination from the clicks the lock gives back.
import { dailyHouse, seeded } from "./puzzlekit.js";

export const PINS = 4;
export const TRIES = 8;
export const CUTS = [
  { name: "Crescent", icon: "🌙" },
  { name: "Leaf", icon: "🍃" },
  { name: "Flame", icon: "🔥" },
  { name: "Drop", icon: "💧" },
  { name: "Star", icon: "⭐" },
  { name: "Shell", icon: "🐚" },
];

export function secretFor(day) {
  const random = seeded(`locksmith:${day}`);
  return Array.from({ length: PINS }, () => Math.floor(random() * CUTS.length));
}

/** { set: right cut in the right pin, loose: right cut in another pin }. */
export function judge(secret, guess) {
  let set = 0;
  const spare = [], rest = [];
  secret.forEach((cut, i) => { if (guess[i] === cut) set++; else { spare.push(cut); rest.push(guess[i]); } });
  let loose = 0;
  for (const cut of rest) {
    const at = spare.indexOf(cut);
    if (at >= 0) { spare.splice(at, 1); loose++; }
  }
  return { set, loose };
}

export function createLocksmith(o) {
  const { panel, toast, ping, save } = o;
  const house = dailyHouse(o, { key: "locksmith", hat: "locksmithcap", furn: "keycabinet", fresh: () => ({ rows: [], pick: [], over: "" }) });
  let note = "";

  function open() {
    const run = house.run();
    const secret = secretFor(house.st.day);
    // A saved pick may hold null for an empty pin.
    run.pick = Array.from({ length: PINS }, (_, i) => run.pick[i] ?? undefined);
    const slots = Array.from({ length: PINS }, (_, i) => `<button type="button" class="btn" data-key="pin${i}" data-pin="${i}" style="width:52px;height:52px;font-size:22px;padding:0;justify-content:center" aria-label="Pin ${i + 1}: ${run.pick[i] === undefined ? "empty" : `${CUTS[run.pick[i]].name}, press to clear`}">${run.pick[i] === undefined ? "·" : CUTS[run.pick[i]].icon}</button>`).join("");
    const keys = CUTS.map((c, i) => `<button type="button" class="btn" data-key="cut${i}" data-cut="${i}" ${run.over ? "disabled" : ""} ${i === 0 && run.rows.length && run.pick.every((c) => c === undefined) ? "data-refocus" : ""}>${c.icon} ${c.name}</button>`).join("");
    const history = run.rows.map((row, i) => {
      const r = judge(secret, row);
      return `<li style="display:flex;gap:10px;align-items:center;margin:4px 0"><small style="width:18px">${i + 1}</small><span style="font-size:20px;letter-spacing:4px">${row.map((c) => CUTS[c].icon).join("")}</span><span class="pill">${r.set} set</span><span class="pill">${r.loose} loose</span></li>`;
    }).join("");

    panel(`Foxhold Locksmith · ${house.st.solves} lock${house.st.solves === 1 ? "" : "s"} opened`, `
      <p class="muted">Today's lock has ${PINS} pins, and cuts may repeat. <strong>Set</strong> means a cut is in the right pin. <strong>Loose</strong> means it belongs in a different pin. You have ${TRIES} tries.</p>
      ${history ? `<ol style="list-style:none;padding:0;margin:8px 0">${history}</ol>` : ""}
      ${run.over ? `<p class="hint">${run.over === "open" ? "The lock is open." : `The lock held. It was ${secret.map((c) => CUTS[c].icon).join(" ")}. A new one arrives tomorrow.`}</p>` : `
        <div class="chips" style="justify-content:center;margin:10px 0">${slots}</div>
        <div class="chips" style="justify-content:center">${keys}</div>
        <div class="chips" style="justify-content:center;margin-top:10px"><button type="button" class="btn btn-accent" data-key="try" ${run.pick.every((c) => c !== undefined) ? "data-refocus" : "disabled"}>Turn the key</button><span class="pill">${TRIES - run.rows.length} tries left</span></div>`}
      ${note ? `<p class="hint" aria-live="polite">${note}</p>` : ""}
    `, (e) => {
      e.querySelectorAll("[data-cut]").forEach((b) => (b.onclick = () => {
        const at = run.pick.findIndex((c) => c === undefined);
        if (at < 0) return toast("All four pins are filled. Tap a pin to clear it.");
        run.pick[at] = +b.dataset.cut;
        ping("blip");
        save();
        open();
      }));
      e.querySelectorAll("[data-pin]").forEach((b) => (b.onclick = () => { run.pick[+b.dataset.pin] = undefined; save(); open(); }));
      const turn = e.querySelector('[data-key="try"]');
      if (turn) turn.onclick = () => {
        if (run.pick.some((c) => c === undefined)) return;
        const guess = [...run.pick];
        run.rows.push(guess);
        run.pick = Array(PINS).fill(undefined);
        const r = judge(secret, guess);
        if (r.set === PINS) {
          run.over = "open";
          note = house.reward(60 + (TRIES - run.rows.length) * 10, 20, `Opened in ${run.rows.length} ${run.rows.length === 1 ? "try" : "tries"}.`);
        } else if (run.rows.length >= TRIES) {
          run.over = "shut";
          note = "";
          ping("choice");
        } else {
          note = `${r.set} set, ${r.loose} loose.`;
          ping("choice");
        }
        save();
        open();
      };
    });
  }

  return { open: () => { note = ""; open(); }, state: house.st };
}
