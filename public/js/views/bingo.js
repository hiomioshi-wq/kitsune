// Reading & World Bingo (#bingo): 5x5 interactive challenge board with line detection and Shrine Seals.
import { $, $$, esc, toast } from "../util.js";
import { setCrumbs } from "../main.js";

const STORE_KEY = "kitsune.bingo.v1";

const TILES = [
  ["Open any story or script", "orig"],
  ["Visit Kitsune World", "world"],
  ["Visit Astral Nexus", "nexus"],
  ["Cook a Thanksgiving dish", "thanks"],
  ["Start a Sanctuary timer", "sanct"],
  ["Make a wish at the Observatory", "const"],
  ["Equip a Mythic Pet", "mythic"],
  ["Light a Lantern in World", "lantern"],
  ["Catch a fish at the pier", "fish"],
  ["Forage 5 items in World", "forage"],
  ["Hang a Gratitude Leaf", "leaf"],
  ["Play Turkey & Leaf Trot", "trot"],
  ["FREE SPACE · Kitsune", "free"],
  ["Try the Ambient Sound Mixer", "sound"],
  ["Draw a custom constellation", "draw"],
  ["Set a Reading Mood", "mood"],
  ["Save a Reading Note", "note"],
  ["Charter a Caravan route", "caravan"],
  ["Forge an Astral Relic", "relic"],
  ["Attune a Zodiac Tail", "zodiac"],
  ["Set Muted Trigger Keywords", "cw"],
  ["Open Winterfest", "xmas"],
  ["Visit Blackwood Banquet Hall", "bw"],
  ["Clear a Star-Rift Floor", "rift"],
  ["Finish a chapter tonight", "chap"],
];

const LINES = [
  [0,1,2,3,4], [5,6,7,8,9], [10,11,12,13,14], [15,16,17,18,19], [20,21,22,23,24],
  [0,5,10,15,20], [1,6,11,16,21], [2,7,12,17,22], [3,8,13,18,23], [4,9,14,19,24],
  [0,6,12,18,24], [4,8,12,16,20],
];

function loadBingo() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORE_KEY) || "{}");
    return { done: { 12: 1, ...(raw.done || {}) }, seals: raw.seals || 0, bingos: raw.bingos || 0 };
  } catch {
    return { done: { 12: 1 }, seals: 0, bingos: 0 };
  }
}

function saveBingo(st) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(st)); } catch {}
}

export async function render(view) {
  setCrumbs([["Kitsune Bingo", "bingo"]]);
  const st = loadBingo();

  const countBingos = () => LINES.filter((line) => line.every((i) => st.done[i])).length;

  const paint = () => {
    const curBingos = countBingos();
    const checked = Object.keys(st.done).filter((k) => st.done[k]).length;

    view.innerHTML = `
      <div class="page-head">
        <div>
          <p class="eyebrow">Challenge Board</p>
          <h1 class="h1">Kitsune 5×5 Bingo</h1>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
          <span class="pill">✨ Bingos: <strong>${curBingos}/12</strong></span>
          <span class="pill">🏮 Shrine Seals: <strong>${st.seals}</strong></span>
          <a class="btn" href="#world">Kitsune World</a>
        </div>
      </div>

      <div class="panel">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:12px">
          <p class="muted" style="margin:0">Tap tiles as you complete them across Kitsune (${checked}/25 completed). Each new Bingo awards <strong>+10 Shrine Seals</strong>!</p>
          <button type="button" class="btn btn-sm" id="bg-reset">Reset Board</button>
        </div>

        <div style="display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px">
          ${TILES.map(([label], i) => {
            const on = !!st.done[i];
            return `<button type="button" data-tile="${i}" style="min-height:82px;padding:8px;border-radius:10px;border:1px solid ${on ? "#ffd84d" : "rgba(255,255,255,.16)"};background:${on ? "rgba(255,216,77,.18)" : "rgba(255,255,255,.04)"};color:inherit;font:600 12.5px/1.25 system-ui;cursor:pointer;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;gap:4px">
              <span>${on ? "★" : "○"}</span>
              <span>${esc(label)}</span>
            </button>`;
          }).join("")}
        </div>
      </div>
    `;

    $$("[data-tile]", view).forEach((b) => {
      b.onclick = () => {
        const idx = +b.dataset.tile;
        if (idx === 12) return;
        const before = countBingos();
        if (st.done[idx]) delete st.done[idx];
        else st.done[idx] = 1;
        const after = countBingos();
        if (after > before) {
          const gained = (after - before) * 10;
          st.seals += gained;
          st.bingos = Math.max(st.bingos, after);
          toast(`BINGO! (${after} line${after > 1 ? "s" : ""}) +${gained} Shrine Seals!`);
        }
        saveBingo(st);
        paint();
      };
    });

    $("#bg-reset", view).onclick = () => {
      st.done = { 12: 1 };
      saveBingo(st);
      toast("Bingo board reset.");
      paint();
    };
  };

  paint();
}
