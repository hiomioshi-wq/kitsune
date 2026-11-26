// Foxfire Keno & Lantern Scratch Cards: pick up to 6 numbers (1–30) for animated draws, or scratch 3x3 foil cards for instant prizes.
import { esc, today } from "../util.js";

const SCRATCH_ICONS = ["🏮", "🦊", "💎", "⭐", "🍀", "🔔"];
const KENO_PAY = {
  1: { 1: 3 },
  2: { 2: 8 },
  3: { 2: 2, 3: 18 },
  4: { 2: 1, 3: 6, 4: 35 },
  5: { 3: 3, 4: 12, 5: 50 },
  6: { 3: 2, 4: 8, 5: 25, 6: 75 },
};

export function createKeno(o) {
  const { s, panel, toast, ping, save, hud, giveHat, addRenown } = o;
  const st = (s.keno ||= {});
  st.plays ||= 0;
  st.wins ||= 0;
  st.best ||= 0;
  st.freeDay ||= "";

  let tab = "keno";
  let picks = [3, 7, 13, 21];
  let wager = 20;
  let drawn = [];
  let drawing = false;
  let card = null;

  const newCard = () => {
    const cells = Array.from({ length: 9 }, () => ({
      sym: SCRATCH_ICONS[Math.floor(Math.random() * SCRATCH_ICONS.length)],
      open: false,
    }));
    // Small chance to seed a guaranteed pair/triple for excitement
    if (Math.random() < 0.35) {
      const sym = SCRATCH_ICONS[Math.floor(Math.random() * SCRATCH_ICONS.length)];
      cells[0].sym = sym; cells[4].sym = sym; cells[8].sym = sym;
    }
    return { cells, settled: false };
  };

  function open(nextTab = tab) {
    tab = nextTab;
    const canFree = st.freeDay !== today();
    const tabs = [
      ["keno", "Foxfire Keno"],
      ["scratch", "Scratch Cards"],
    ].map(([k, l]) => `<button type="button" class="chip${tab === k ? " on" : ""}" data-tab="${k}">${l}</button>`).join("");

    let body = "";
    if (tab === "keno") {
      const drawnSet = new Set(drawn);
      const pickSet = new Set(picks);
      const grid = Array.from({ length: 30 }, (_, i) => {
        const n = i + 1;
        const p = pickSet.has(n), d = drawnSet.has(n), hit = p && d;
        const bg = hit ? "#248f5a" : p ? "#b86b24" : d ? "#3a3454" : "rgba(255,255,255,.06)";
        const bd = hit ? "#7dff8a" : p ? "#ffd84d" : "rgba(255,255,255,.16)";
        return `<button type="button" data-kn="${n}" style="padding:8px 4px;border-radius:8px;border:2px solid ${bd};background:${bg};color:#fff;font:800 13px system-ui;cursor:pointer">${n}</button>`;
      }).join("");

      const wagers = [10, 20, 50, 100].map((v) =>
        `<button type="button" class="chip${wager === v ? " on" : ""}" data-wg="${v}">${v} mon</button>`
      ).join("");

      const payHint = Object.entries(KENO_PAY[picks.length] || {}).map(([m, x]) => `${m} hits = ${x}×`).join(" · ") || "Pick 1–6 numbers";

      body = `
        <p class="muted">Pick 1–6 numbers from 1 to 30. Eight glowing numbers are drawn each round. (${esc(payHint)})</p>
        <div style="display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:6px;margin:10px 0">${grid}</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:10px">
          <strong>Wager:</strong><div class="chips">${wagers}</div>
          <button type="button" class="btn btn-sm" id="kn-qp">Quick Pick</button>
          <button type="button" class="btn btn-sm" id="kn-clr">Clear</button>
        </div>
        <button type="button" class="btn btn-accent" id="kn-go" ${drawing || !picks.length || (!canFree && s.mon < wager) ? "disabled" : ""}>${canFree ? "Daily Free Draw (20 mon value)" : `Draw 8 Numbers (${wager} mon)`}</button>
      `;
    } else {
      body = `
        <p class="muted">Buy a 3×3 Lantern Scratch Card for <strong>15 mon</strong>. Match 3 identical symbols to win up to 120 mon!</p>
        ${!card
          ? `<button type="button" class="btn btn-accent" id="sc-buy" ${s.mon < 15 ? "disabled" : ""}>Buy Scratch Card (15 mon)</button>`
          : `<div style="display:grid;grid-template-columns:repeat(3,86px);gap:10px;margin:12px 0">
              ${card.cells.map((c, i) => `<button type="button" data-sc="${i}" style="height:86px;border-radius:12px;border:2px solid ${c.open ? "#ffd84d" : "#8a7ac8"};background:${c.open ? "rgba(255,216,77,.14)" : "rgba(120,100,180,.28)"};font-size:34px;cursor:pointer">${c.open ? c.sym : "❓"}</button>`).join("")}
            </div>
            <div class="px-row">
              ${!card.settled ? `<button type="button" class="btn" id="sc-all">Reveal All</button>` : `<button type="button" class="btn btn-accent" id="sc-buy" ${s.mon < 15 ? "disabled" : ""}>Buy Another (15 mon)</button>`}
            </div>`}`;
    }

    panel(`Foxfire Keno & Scratch · ${s.mon} mon`, `
      <p class="muted" style="margin:0 0 8px">Plays: <strong>${st.plays}</strong> · Wins: <strong>${st.wins}</strong> · Best: <strong>${st.best} mon</strong></p>
      <div class="chips" style="margin-bottom:12px">${tabs}</div>
      ${body}
    `, (e) => {
      e.querySelectorAll("[data-tab]").forEach((b) => (b.onclick = () => { if (!drawing) open(b.dataset.tab); }));
      e.querySelectorAll("[data-wg]").forEach((b) => (b.onclick = () => { if (!drawing) { wager = +b.dataset.wg; open(); } }));

      e.querySelectorAll("[data-kn]").forEach((b) => {
        b.onclick = () => {
          if (drawing) return;
          const n = +b.dataset.kn;
          if (picks.includes(n)) picks = picks.filter((x) => x !== n);
          else if (picks.length < 6) picks = [...picks, n];
          else return toast("Maximum 6 numbers per ticket.");
          drawn = [];
          ping("blip");
          open();
        };
      });

      const qp = e.querySelector("#kn-qp");
      if (qp) qp.onclick = () => {
        if (drawing) return;
        const pool = Array.from({ length: 30 }, (_, i) => i + 1).sort(() => Math.random() - 0.5);
        picks = pool.slice(0, 5);
        drawn = [];
        open();
      };
      const clr = e.querySelector("#kn-clr");
      if (clr) clr.onclick = () => { if (!drawing) { picks = []; drawn = []; open(); } };

      const go = e.querySelector("#kn-go");
      if (go) go.onclick = () => {
        if (drawing || !picks.length) return;
        const useFree = st.freeDay !== today();
        const stake = useFree ? 20 : wager;
        if (!useFree && s.mon < stake) return toast("Not enough mon.");
        if (useFree) st.freeDay = today(); else s.mon -= stake;
        st.plays++;
        drawing = true;
        drawn = [];
        save(); hud(); ping("choice");

        const pool = Array.from({ length: 30 }, (_, i) => i + 1).sort(() => Math.random() - 0.5).slice(0, 8);
        let idx = 0;
        const timer = setInterval(() => {
          if (!e.isConnected) { clearInterval(timer); drawing = false; return; }
          drawn.push(pool[idx++]);
          ping("blip");
          if (idx >= pool.length) {
            clearInterval(timer);
            drawing = false;
            const hits = picks.filter((n) => drawn.includes(n)).length;
            const mul = KENO_PAY[picks.length]?.[hits] || 0;
            const won = stake * mul;
            if (won > 0) {
              s.mon += won; st.wins++; st.best = Math.max(st.best, won);
              addRenown?.(hits >= 4 ? 40 : 12);
              if (hits >= 4 && !s.hats.includes("cloverhat")) {
                giveHat?.("cloverhat");
                toast(`${hits} Keno hits! +${won} mon and the Four-Leaf Hat!`);
              } else {
                toast(`Matched ${hits} of ${picks.length}! +${won} mon!`);
              }
              ping("done");
            } else {
              toast(`Matched ${hits} of ${picks.length}. Try again!`);
            }
            save(); hud();
          }
          open();
        }, 160);
      };

      const buy = e.querySelector("#sc-buy");
      if (buy) buy.onclick = () => {
        if (s.mon < 15) return toast("Not enough mon.");
        s.mon -= 15; st.plays++;
        card = newCard();
        ping("choice");
        save(); hud(); open();
      };

      const settleCard = () => {
        if (!card || card.settled) return;
        card.settled = true;
        const counts = {};
        for (const c of card.cells) counts[c.sym] = (counts[c.sym] || 0) + 1;
        const prizes = { "💎": 120, "🦊": 90, "🏮": 60, "⭐": 45, "🍀": 35, "🔔": 25 };
        let won = 0;
        for (const [sym, n] of Object.entries(counts)) if (n >= 3) won = Math.max(won, prizes[sym] || 25);
        if (won > 0) {
          s.mon += won; st.wins++; st.best = Math.max(st.best, won);
          addRenown?.(15);
          if (won >= 120 && !s.hats.includes("cloverhat")) {
            giveHat?.("cloverhat");
            toast(`Triple Diamonds! +${won} mon and the Four-Leaf Hat!`);
          } else {
            toast(`Winner! +${won} mon!`);
          }
          ping("done");
        } else {
          toast("No triple match on this card.");
          ping("blip");
        }
        save(); hud();
      };

      e.querySelectorAll("[data-sc]").forEach((b) => {
        b.onclick = () => {
          if (!card || card.settled) return;
          const cell = card.cells[+b.dataset.sc];
          if (cell.open) return;
          cell.open = true;
          ping("blip");
          if (card.cells.every((c) => c.open)) settleCard();
          open();
        };
      });

      const revAll = e.querySelector("#sc-all");
      if (revAll) revAll.onclick = () => {
        if (!card) return;
        for (const c of card.cells) c.open = true;
        settleCard();
        open();
      };
    });
  }

  return { open, state: st };
}
