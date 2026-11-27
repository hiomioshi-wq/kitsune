// Foxfire Memory Match: 4x4 Classic & 5x4 Blackwood Hard Mode card-matching game with par bonus, mon + Renown rewards, and a daily free game.
import { today } from "../util.js";

const PAIRS = ["🦊", "🏮", "🌸", "💎", "⛵", "🕰️", "🦉", "👑"];
const HARD_PAIRS = ["🧁", "🦆", "📦", "🗝️", "🐕", "🐚", "🔭", "🌺", "☄️", "🪑"];

export function createMemory(o) {
  const { s, panel, toast, ping, save, hud, addRenown } = o;
  const st = (s.memory ||= {});
  st.wins ||= 0;
  st.bestMoves ||= 0;
  st.freeDay ||= "";
  st.capsuleRoute ||= [];
  st.capsuleDate ||= today();

  let game = null;

  function startGame(cost, hard = false) {
    if (cost > 0 && s.mon < cost) return toast("Not enough mon.");
    if (cost > 0) s.mon -= cost;
    else if (!hard) st.freeDay = today();

    const pool = hard ? HARD_PAIRS : PAIRS;
    const deck = [...pool, ...pool].sort(() => Math.random() - 0.5);
    game = {
      hard,
      pairs: pool.length,
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
        <p class="muted">Match all 8 Kitsune pairs (4×4) or try <strong>Blackwood 5×4 Hard Mode</strong> (10 pairs, up to +110 mon)!</p>
        <p>Games won: <strong>${st.wins}</strong>${st.bestMoves ? ` · Best: <strong>${st.bestMoves} moves</strong>` : ""}</p>
        <div class="px-row" style="margin-bottom:10px">
          <button type="button" class="btn btn-accent" id="mm-go" ${!canFree && s.mon < 10 ? "disabled" : ""}>${canFree ? "Daily Free Match" : "4×4 Classic (10 mon)"}</button>
          <button type="button" class="btn btn-accent" id="mm-hard" ${s.mon < 20 ? "disabled" : ""}>5×4 Blackwood Hard (20 mon)</button>
          <button type="button" class="btn" id="mm-cap">${s.capsulePlayback ? "Hide Route Ghost" : `Summon Time Capsule Ghost (${st.capsuleRoute.length} pts)`}</button>
        </div>`;
    } else {
      const cols = game.hard ? 5 : 4;
      const grid = game.cards.map((c, i) => {
        const show = c.open || c.matched;
        return `<button type="button" data-mm="${i}" ${c.matched || game.locked ? "disabled" : ""} style="height:64px;border-radius:10px;border:2px solid ${c.matched ? "#7dff8a" : show ? "#ffd84d" : "#8a7ac8"};background:${c.matched ? "rgba(60,140,80,.28)" : show ? "rgba(255,216,77,.16)" : "rgba(90,70,130,.3)"};font-size:26px;cursor:pointer">${show ? c.sym : "❓"}</button>`;
      }).join("");

      body = `
        <p class="muted">Moves: <strong>${game.moves}</strong> · Matched: <strong>${game.cards.filter((c) => c.matched).length / 2}/${game.pairs}</strong></p>
        <div style="display:grid;grid-template-columns:repeat(${cols},1fr);gap:8px;max-width:${game.hard ? 420 : 340}px;margin:10px 0">${grid}</div>
        ${game.over ? `<div class="px-row"><button type="button" class="btn btn-accent" id="mm-go" ${!canFree && s.mon < 10 ? "disabled" : ""}>${canFree ? "Daily Free Match" : "4×4 Classic (10 mon)"}</button><button type="button" class="btn btn-accent" id="mm-hard" ${s.mon < 20 ? "disabled" : ""}>5×4 Blackwood Hard (20 mon)</button></div>` : ""}`;
    }

    panel(`Foxfire Memory Match · ${s.mon} mon`, body, (e) => {
      const go = e.querySelector("#mm-go");
      if (go) go.onclick = () => startGame(st.freeDay !== today() ? 0 : 10, false);
      const hardBtn = e.querySelector("#mm-hard");
      if (hardBtn) hardBtn.onclick = () => startGame(20, true);

      const cap = e.querySelector("#mm-cap");
      if (cap) cap.onclick = () => {
        s.capsulePlayback = !s.capsulePlayback;
        ping("choice");
        toast(s.capsulePlayback ? "Your Time Capsule ghost now walks your saved route beside you!" : "Time Capsule ghost dismissed.");
        save(); open();
      };

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
                if (!game.hard && (!st.bestMoves || game.moves < st.bestMoves)) st.bestMoves = game.moves;
                const par = game.hard ? 18 : 14;
                const bonus = game.moves <= par ? (game.hard ? 45 : 30) : 0;
                const pay = (game.hard ? 65 : 35) + bonus;
                s.mon += pay;
                addRenown?.((game.hard ? 35 : 20) + (bonus ? 15 : 0));
                ping("done");
                toast(`All ${game.pairs} pairs in ${game.moves} moves! +${pay} mon!`);
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
                if (e.isConnected && !e.closest("[hidden]")) open();
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
