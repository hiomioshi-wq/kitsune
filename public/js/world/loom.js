import { esc, today } from "../util.js";

const COLORS = [
  { id: "o", name: "Ochre", hex: "#e0a23a" },
  { id: "m", name: "Moss", hex: "#6fa04a" },
  { id: "b", name: "Blue", hex: "#5f8fd8" },
  { id: "r", name: "Rose", hex: "#d06a86" },
];
const PUZZLES = [
  { answer: ["o", "m", "b", "r"], clues: ["The rose row is at the bottom.", "Moss is directly above blue.", "The top row is ochre."] },
  { answer: ["b", "r", "m", "o"], clues: ["Ochre is not in the top two rows.", "Rose is directly above moss.", "Blue is above rose."] },
  { answer: ["m", "o", "r", "b"], clues: ["Blue is at the bottom.", "Ochre is directly below moss.", "Rose is below ochre."] },
  { answer: ["r", "b", "o", "m"], clues: ["Moss is at the bottom.", "Blue is above ochre.", "Rose is at the top."] },
  { answer: ["o", "b", "m", "r"], clues: ["Moss is directly above rose.", "The top row is ochre.", "Blue is not at the bottom."] },
  { answer: ["b", "m", "o", "r"], clues: ["Rose is at the bottom.", "Moss is directly above ochre.", "Blue is not below moss."] },
  { answer: ["r", "o", "b", "m"], clues: ["Blue is directly above moss.", "Rose is at the top.", "Ochre is not at the bottom."] },
  { answer: ["m", "r", "o", "b"], clues: ["Ochre is directly above blue.", "Moss is at the top.", "Rose is not at the bottom."] },
];
const dayNum = (d = today()) => Math.floor(Date.parse(d) / 86400000);

export function createLoom(o) {
  const { s, panel, toast, ping, save, hud, giveHat, giveFurn, addRenown } = o;
  const st = (s.loom ||= {});
  st.woven ??= 0;
  st.cloth ??= 0;
  st.perfect ??= 0;
  st.done ||= {};
  st.tries ||= {};
  st.history ||= {};
  let last = "";

  const puzzleFor = (day) => PUZZLES[((dayNum(day) % PUZZLES.length) + PUZZLES.length) % PUZZLES.length];

  function check(day, guess) {
    const { answer } = puzzleFor(day);
    let exact = 0;
    for (let i = 0; i < 4; i++) if (guess[i] === answer[i]) exact++;
    const pool = { ...answer.reduce((a, c) => ((a[c] = (a[c] || 0) + 1), a), {}) };
    let color = 0;
    for (const g of guess) if (pool[g] > 0) { pool[g]--; color++; }
    color -= exact;
    return { exact, color };
  }

  function submit(e, day) {
    const guess = [0, 1, 2, 3].map((i) => e.querySelector(`#lm-${i}`)?.value || "o");
    const tries = (st.tries[day] = (st.tries[day] || 0) + 1);
    const { exact, color } = check(day, guess);
    (st.history[day] ||= []).push({ guess, exact, color });
    if (exact === 4) {
      const first = !st.done[day];
      st.done[day] = 1;
      st.woven++;
      const cloth = tries === 1 ? 3 : 2;
      st.cloth += cloth;
      const pay = tries === 1 ? 110 : tries <= 3 ? 70 : 40;
      const bonus = tries === 1 ? 20 : 0;
      if (tries === 1) st.perfect++;
      if (first) { s.mon += pay + bonus; addRenown?.(20); }
      if (st.woven >= 10 && !st.hat) { st.hat = 1; giveHat?.("weaverhat"); }
      if (st.perfect >= 5 && !st.furn) { st.furn = 1; giveFurn?.("tapestry"); }
      last = first ? `The pattern holds! +${pay + bonus} mon, ${cloth} bolts of cloth.` : `Practice weave complete. ${cloth} bolt${cloth === 1 ? "" : "s"} of cloth.`;
      toast(first ? `Commission woven in ${tries} ${tries === 1 ? "try" : "tries"}! +${pay + bonus} mon.` : `Practice weave complete. +${cloth} cloth.`);
      ping("done");
    } else {
      last = `Weave checked: ${exact} in the right row, ${color} right colour but wrong row.`;
      toast(last);
      ping("blip");
    }
    save(); hud(); open();
  }

  function practice() {
    if (s.mon < 8) return toast("Need 8 mon for a practice warp.");
    s.mon -= 8;
    st.cloth++;
    addRenown?.(1);
    last = "A plain practice bolt is cut from the loom. +1 cloth.";
    ping("blip"); save(); hud(); open();
  }

  function open() {
    const day = today();
    const puzzle = puzzleFor(day);
    const tries = st.tries[day] || 0;
    const solved = !!st.done[day];
    const palette = COLORS.map((c) => `<span class="pill" style="color:${c.hex};border-color:${c.hex}">${esc(c.name)}</span>`).join(" ");
    const selects = [0, 1, 2, 3].map((i) => `<label style="display:flex;gap:8px;align-items:center;margin:4px 0"><span style="width:64px">Row ${i + 1}</span><select class="field" id="lm-${i}">${COLORS.map((c) => `<option value="${c.id}">${esc(c.name)}</option>`).join("")}</select><i style="width:18px;height:18px;border-radius:4px;display:inline-block" data-swatch="${i}"></i></label>`).join("");
    const history = (st.history[day] || []).map((h, i) => `<div class="se-good"><span><strong>Weave ${i + 1}: ${h.guess.map((g) => COLORS.find((c) => c.id === g)?.name).join(" · ")}</strong><small>${h.exact} in the right row · ${h.color} right colour, wrong row</small></span></div>`).join("");

    panel(`Lantern Loom · ${st.woven} commissions`, `
      <p class="muted">A four-row tapestry commission waits on the frame. Read the clues, choose one colour per row, and weave. Exact rows and misplaced colours are reported after each attempt.</p>
      <h4>Today's clues</h4>
      <ol class="wd-list">${puzzle.clues.map((c) => `<li><strong>${esc(c)}</strong></li>`).join("")}</ol>
      <p>${palette}</p>
      ${solved ? `<div class="hint" style="margin:10px 0">${esc(last || "Today's commission is complete.")}</div>` : `<div style="max-width:320px;margin:10px 0">${selects}</div><div class="chips"><button type="button" class="btn btn-accent" id="lm-go">Weave this pattern</button><button type="button" class="btn" id="lm-practice" ${s.mon >= 8 ? "" : "disabled"}>Cut practice cloth (8 mon)</button></div>`}
      <p style="margin-top:10px"><strong>Cloth:</strong> ${st.cloth} bolts · <strong>Perfect weaves:</strong> ${st.perfect} · <strong>Attempts today:</strong> ${tries}</p>
      ${history ? `<h4>Today's attempts</h4><div class="se-mkt">${history}</div>` : ""}
    `, (e) => {
      const paint = () => [0, 1, 2, 3].forEach((i) => { const v = e.querySelector(`#lm-${i}`).value; const sw = e.querySelector(`[data-swatch="${i}"]`); if (sw) sw.style.background = COLORS.find((c) => c.id === v)?.hex || "#888"; });
      [0, 1, 2, 3].forEach((i) => e.querySelector(`#lm-${i}`)?.addEventListener("change", paint));
      paint();
      const go = e.querySelector("#lm-go");
      if (go) go.onclick = () => submit(e, day);
      const practiceBtn = e.querySelector("#lm-practice");
      if (practiceBtn) practiceBtn.onclick = practice;
    });
  }

  return { open, state: st };
}
