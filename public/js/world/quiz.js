// Lantern Quiz Hall: 5-question trivia rounds covering Kitsune World, Blackwood University, and Originals lore.
import { esc } from "../util.js";

const QUESTIONS = [
  ["How many country lanterns must be lit before the Lantern Shrine accepts the ninth?", ["Six", "Eight", "Nine", "Twelve"], 1],
  ["Who delivers Kitsu's mail round across the country?", ["Kitsu", "Yuki", "Mina", "Bracken"], 0],
  ["What is the currency used in Kitsune World?", ["Gold", "Mon", "Shells", "Credits"], 1],
  ["In Blackwood University, which department handles campus fatalities and paperwork?", ["Student Council", "Mortality Services", "The Dean's Office", "Campus Security"], 1],
  ["Who is Kevin's favorite place to get accidentally stuck or lost?", ["The Library", "A shelf / cardboard box", "The Rooftop", "The Cafeteria"], 1],
  ["What did Madison use to win the Student Council election in Episode 4?", ["Posters", "Friendship cupcakes", "Campaign flyers", "A megaphone"], 1],
  ["Which region lies over the eastern bridge into the Emerald lands?", ["Saltwick Shore", "Emerald City / Oz", "The High Post", "Brask"], 1],
  ["What is the name of the resort island reached by ferry from Kitsune World?", ["Moonwake Bay", "Hollow Pine", "Platform Zero", "Skyward Isles"], 0],
  ["Which Horseman is known for always being hungry in Horsemen Chronicles?", ["Conquest", "War", "Famine", "Death"], 2],
  ["What creature runs the Lantern Courier's wind-blown mail event?", ["A heron", "A nightjar", "A crow", "An owl"], 1],
  ["In Foxfire Roulette, what color is pocket 0?", ["Red", "Black", "Gold", "Green"], 3],
  ["Which town has a clock tower that runs three seconds behind?", ["Hollow Pine", "Brask", "Saltwick", "Night Market"], 1],
  ["What do you press in Kitsune World to dig for buried treasure?", ["E", "G", "B", "R"], 1],
  ["What is the name of the abyssal vehicle at the southern shore?", ["Starlight Airship", "Diving Bell", "Moonwake Ferry", "Bottomless Stair"], 1],
  ["In Incarnate, what is the name of the prophecy's corruption virus?", ["Corruption-027", "Shadow-14", "Mire-99", "Seam-01"], 0],
  ["Who is the Student Council President at Blackwood University?", ["Yuki", "Lux", "Becca", "Mina"], 1],
  ["What boosts your fishing reel bar width in Kitsune World?", ["Lucky Ripples", "Heavy Boots", "Iron Ores", "Snowballs"], 0],
  ["Which building in Kitsune World lets you browse your real reading library?", ["Foxfire Goods", "The Great Shelf", "Lantern Guild", "Your House"], 1],
];

export function createQuiz(o) {
  const { s, panel, toast, ping, save, hud, giveHat, addRenown } = o;
  const st = (s.quiz ||= {});
  st.plays ||= 0;
  st.best ||= 0;
  st.perfects ||= 0;

  let round = null;

  function startRound() {
    const pool = [...QUESTIONS].sort(() => Math.random() - 0.5).slice(0, 5);
    round = { q: pool, idx: 0, score: 0, picked: null };
    open();
  }

  function open() {
    if (!round) {
      panel("Lantern Quiz Hall", `
        <p class="muted">Answer 5 rapid-fire questions about Kitsune World and Originals lore. Each correct answer pays <strong>15 mon</strong> and <strong>+8 Renown</strong>. A 5/5 sweep earns a bonus and the Scholar's Mortarboard!</p>
        <p>Games played: <strong>${st.plays}</strong> · Best score: <strong>${st.best}/5</strong> · Perfect rounds: <strong>${st.perfects}</strong></p>
        <button type="button" class="btn btn-accent" id="qz-start">Start 5-Question Quiz</button>
      `, (e) => {
        e.querySelector("#qz-start").onclick = startRound;
      });
      return;
    }

    if (round.idx >= round.q.length) {
      const sc = round.score;
      const bonus = sc === 5 ? 50 : 0;
      const pay = sc * 15 + bonus;
      st.plays++;
      st.best = Math.max(st.best, sc);
      if (sc === 5) st.perfects++;
      s.mon += pay;
      addRenown?.(sc * 8 + (sc === 5 ? 25 : 0));
      if (sc === 5 && !s.hats.includes("scholarhat")) {
        giveHat?.("scholarhat");
        toast(`5/5 Perfect! +${pay} mon and the Scholar's Mortarboard!`);
      } else if (pay > 0) {
        toast(`Quiz complete: ${sc}/5! +${pay} mon!`);
      }
      ping(sc >= 3 ? "done" : "blip");
      save(); hud();
      const finalScore = sc;
      round = null;

      panel("Quiz Results", `
        <h3>You scored ${finalScore} out of 5!</h3>
        <p class="muted">Earned <strong>+${pay} mon</strong>${bonus ? " (includes +50 mon Perfect Bonus!)" : ""}.</p>
        <div class="px-row">
          <button type="button" class="btn btn-accent" id="qz-again">Play Again</button>
        </div>
      `, (e) => {
        e.querySelector("#qz-again").onclick = startRound;
      });
      return;
    }

    const [prompt, opts, ans] = round.q[round.idx];
    const btns = opts.map((opt, i) => {
      let cls = "btn";
      if (round.picked !== null) {
        if (i === ans) cls = "btn btn-accent";
      }
      return `<button type="button" class="${cls}" data-opt="${i}" ${round.picked !== null ? "disabled" : ""} style="justify-content:flex-start;text-align:left">${esc(opt)}${round.picked !== null && i === ans ? " ✓" : round.picked === i && i !== ans ? " ✗" : ""}</button>`;
    }).join("");

    panel(`Lantern Quiz · Question ${round.idx + 1}/5`, `
      <p class="muted" style="margin:0 0 8px">Current score: <strong>${round.score}</strong></p>
      <h3 style="margin:0 0 12px">${esc(prompt)}</h3>
      <div style="display:flex;flex-direction:column;gap:8px">${btns}</div>
      ${round.picked !== null ? `<div class="px-row" style="margin-top:12px"><button type="button" class="btn btn-accent" id="qz-next">${round.idx === 4 ? "Finish Quiz" : "Next Question"}</button></div>` : ""}
    `, (e) => {
      e.querySelectorAll("[data-opt]").forEach((b) => {
        b.onclick = () => {
          if (round.picked !== null) return;
          round.picked = +b.dataset.opt;
          if (round.picked === ans) { round.score++; ping("done"); }
          else ping("blip");
          open();
        };
      });
      const nx = e.querySelector("#qz-next");
      if (nx) nx.onclick = () => { round.idx++; round.picked = null; open(); };
    });
  }

  return { open, state: st };
}
