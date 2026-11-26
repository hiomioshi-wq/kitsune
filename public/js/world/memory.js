// Foxfire Memory Match: 4x4 card-matching game with par bonus, mon + Renown rewards, and a daily free game.
import { today } from "../util.js";

const PAIRS = ["🦊", "🏮", "🌸", "💎", "⛵", "🕰️", "🦉", "👑"];

export function createMemory(o) {
  const { s, panel, toast, ping, save, hud, addRenown } = o;
  const st = (s.memory ||= {});
  st.wins ||= 0;
  st.bestMoves ||= 0;
  st.freeDay ||= "";

  let game = null;

  function startGame(cost) {
    if (cost > 0 && s.mon < cost) return toast("Not enough mon.");
    if (cost > 0) s.mon -= cost;
    else st.freeDay = today();

    const deck = [...PAIRS, ...PAIRS].sort(() => Math.random() - 0.5);
    game = {
      cards: deck.map((sym) => ({ sym, open: false, matched: false })),
      flipped: [],
      moves: 0,
      locked: false,
      over: false,
    };
    ping("choice"); save(); hud(); open();
  }

  function open() {
    const canFree = st.freeDay !== today();
    let body = "";

    if (!game) {
      body = `
        <p class="muted">Match all 8 Kitsune pairs in as few moves as possible! Clear in 14 moves or fewer for a +30 mon Par Bonus.</p>
        <p>Games won: <strong>${st.wins}</strong>${st.bestMoves ? ` · Best: <strong>${st.bestMoves} moves</strong>` : ""}</p>
        <button type="button" class="btn btn-accent" id="mm-go" ${!canFree && s.mon < 10 ? "disabled" : ""}>${canFree ? "Daily Free Match" : "Play Match (10 mon)"}</button>`;
    } else {
      const grid = game.cards.map((c, i) => {
        const show = c.open || c.matched;
        return `<button type="button" data-mm="${i}" ${c.matched || game.locked ? "disabled" : ""} style="height:68px;border-radius:10px;border:2px solid ${c.matched ? "#7dff8a" : show ? "#ffd84d" : "#8a7ac8"};background:${c.matched ? "rgba(60,140,80,.28)" : show ? "rgba(255,216,77,.16)" : "rgba(90,70,130,.3)"};font-size:28px;cursor:pointer">${show ? c.sym : "❓"}</button>`;
      }).join("");

      body = `
        <p class="muted">Moves: <strong>${game.moves}</strong> · Matched: <strong>${game.cards.filter((c) => c.matched).length / 2}/8</strong></p>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;max-width:340px;margin:10px 0">${grid}</div>
        ${game.over ? `<button type="button" class="btn btn-accent" id="mm-go" ${!canFree && s.mon < 10 ? "disabled" : ""}>${canFree ? "Daily Free Match" : "Play Again (10 mon)"}</button>` : ""}`;
    }

    panel(`Foxfire Memory Match · ${s.mon} mon`, body, (e) => {
      const go = e.querySelector("#mm-go");
      if (go) go.onclick = () => startGame(st.freeDay !== today() ? 0 : 10);

      e.querySelectorAll("[data-mm]").forEach((b) => {
        b.onclick = () => {
          if (!game || game.locked || game.over) return;
          const idx = +b.dataset.mm;
          const c = game.cards[idx];
          if (c.open || c.matched) return;
          c.open = true;
          game.flipped.push(idx);
          ping("blip");

          if (game.flipped.length === 2) {
            game.moves++;
            const [a, bIdx] = game.flipped;
            const ca = game.cards[a], cb = game.cards[bIdx];
            if (ca.sym === cb.sym) {
              ca.matched = cb.matched = true;
              game.flipped = [];
              ping("choice");
              if (game.cards.every((x) => x.matched)) {
                game.over = true;
                st.wins++;
                if (!st.bestMoves || game.moves < st.bestMoves) st.bestMoves = game.moves;
                const bonus = game.moves <= 14 ? 30 : 0;
                const pay = 35 + bonus;
                s.mon += pay;
                addRenown?.(20 + (bonus ? 10 : 0));
                ping("done");
                toast(`All 8 pairs in ${game.moves} moves! +${pay} mon!`);
                save(); hud();
              }
              open();
            } else {
              game.locked = true;
              open();
              setTimeout(() => {
                if (!game) return;
                ca.open = cb.open = false;
                game.flipped = [];
                game.locked = false;
                if (e.isConnected) open();
              }, 650);
            }
            return;
          }
          open();
        };
      });
    });
  }

  return { open, state: st };
}
