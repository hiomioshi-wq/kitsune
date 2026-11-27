// Foxfire Roulette: multi-bet animated 19-pocket (0–18) roulette table with dozens, streak multiplier, and a progressive 0-pocket jackpot.
import { esc, today } from "../util.js";

const POCKETS = [
  0, 14, 7, 18, 3, 12, 9, 16, 5, 10, 1, 15, 4, 17, 2, 13, 6, 11, 8,
];
const RED = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18]);
const colorOf = (n) => (n === 0 ? "green" : RED.has(n) ? "red" : "black");
const hexOf = (n) => (n === 0 ? "#248f5a" : RED.has(n) ? "#c83848" : "#1e2030");

export function createRoulette(o) {
  const { s, panel, toast, ping, save, hud, giveHat, addRenown } = o;
  const st = (s.roulette ||= {});
  st.spins ||= 0;
  st.wins ||= 0;
  st.best ||= 0;
  st.streak ||= 0;
  st.pot ||= 150;
  st.hist ||= [];
  st.freeDay ||= "";

  // Multi-bet map: key -> total mon staked on that bet
  let bets = { red: 25 };
  let lastBets = { red: 25 };
  let chip = 25;
  let spinning = false;
  let raf = 0;

  const canFree = () => st.freeDay !== today();
  const totalStake = () => Object.values(bets).reduce((a, b) => a + b, 0);
  const streakMul = () => (st.streak >= 4 ? 2 : st.streak === 3 ? 1.5 : st.streak === 2 ? 1.25 : 1);

  const betMul = (key, landed) => {
    if (key.startsWith("n:")) return +key.slice(2) === landed ? 18 : 0;
    if (landed === 0) return 0;
    if (key === "red") return RED.has(landed) ? 2 : 0;
    if (key === "black") return !RED.has(landed) ? 2 : 0;
    if (key === "even") return landed % 2 === 0 ? 2 : 0;
    if (key === "odd") return landed % 2 === 1 ? 2 : 0;
    if (key === "low") return landed >= 1 && landed <= 9 ? 2 : 0;
    if (key === "high") return landed >= 10 && landed <= 18 ? 2 : 0;
    if (key === "d1") return landed >= 1 && landed <= 6 ? 3 : 0;
    if (key === "d2") return landed >= 7 && landed <= 12 ? 3 : 0;
    if (key === "d3") return landed >= 13 && landed <= 18 ? 3 : 0;
    return 0;
  };

  function drawWheel(g, wAng, bAng, bRad, landed) {
    const cx = 140, cy = 140, R = 124;
    g.clearRect(0, 0, 280, 280);

    g.fillStyle = "#2b1d12";
    g.beginPath();
    g.arc(cx, cy, R + 10, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = "#d9a84e";
    g.lineWidth = 4;
    g.stroke();

    const slice = (Math.PI * 2) / POCKETS.length;
    for (let i = 0; i < POCKETS.length; i++) {
      const n = POCKETS[i];
      const a0 = wAng + i * slice - slice / 2;
      const a1 = a0 + slice;
      g.fillStyle = hexOf(n);
      g.beginPath();
      g.moveTo(cx, cy);
      g.arc(cx, cy, R, a0, a1);
      g.closePath();
      g.fill();
      g.strokeStyle = "#d9a84e";
      g.lineWidth = 1.2;
      g.stroke();

      const mid = (a0 + a1) / 2;
      g.save();
      g.translate(cx + Math.cos(mid) * (R - 20), cy + Math.sin(mid) * (R - 20));
      g.rotate(mid + Math.PI / 2);
      g.fillStyle = n === landed ? "#ffd84d" : "#fff4d6";
      g.font = "800 11px system-ui";
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillText(String(n), 0, 0);
      g.restore();
    }

    g.fillStyle = "#1b1420";
    g.beginPath();
    g.arc(cx, cy, 46, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = "#d9a84e";
    g.lineWidth = 3;
    g.stroke();

    g.fillStyle = "#ffd84d";
    g.font = "900 20px Georgia,serif";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(landed != null ? String(landed) : "🦊", cx, cy);

    const bx = cx + Math.cos(bAng) * bRad;
    const by = cy + Math.sin(bAng) * bRad;
    g.fillStyle = "#fff9ec";
    g.strokeStyle = "#3a2a10";
    g.lineWidth = 1.5;
    g.beginPath();
    g.arc(bx, by, 6, 0, Math.PI * 2);
    g.fill();
    g.stroke();
  }

  function open() {
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
    spinning = false;
    const free = canFree();
    const stake = totalStake();
    const mul = streakMul();

    const histHtml = st.hist.length
      ? st.hist.slice(0, 10).map((n) => `<span class="pill" style="background:${hexOf(n)};color:#fff;border-color:#d9a84e">${n}</span>`).join(" ")
      : `<span class="muted">No spins yet</span>`;

    const outsideBtns = [
      ["red", "Red 2×", "#c83848"],
      ["black", "Black 2×", "#1e2030"],
      ["even", "Even 2×", ""],
      ["odd", "Odd 2×", ""],
      ["low", "1–9 2×", ""],
      ["high", "10–18 2×", ""],
      ["d1", "1–6 3×", ""],
      ["d2", "7–12 3×", ""],
      ["d3", "13–18 3×", ""],
    ].map(([k, lbl, bg]) => {
      const amt = bets[k] || 0;
      return `<button type="button" class="btn${amt ? " btn-accent" : ""}" data-add="${k}" style="${bg && !amt ? `background:${bg};color:#fff;` : ""}">${lbl}${amt ? ` (${amt})` : ""}</button>`;
    }).join("");

    const numBtns = Array.from({ length: 19 }, (_, n) => {
      const k = "n:" + n;
      const amt = bets[k] || 0;
      return `<button type="button" data-add="${k}" title="${amt ? `${amt} mon on ${n}` : `Bet ${chip} on ${n}`}" style="min-width:34px;padding:6px 4px;border-radius:8px;border:2px solid ${amt ? "#ffd84d" : "#d9a84e55"};background:${hexOf(n)};color:#fff;font:800 12px system-ui;cursor:pointer">${n}${amt ? `·${amt}` : ""}</button>`;
    }).join("");

    const chips = [5, 10, 25, 50, 100].map((v) =>
      `<button type="button" class="chip${chip === v ? " on" : ""}" data-wg="${v}">+${v}</button>`
    ).join("");

    panel(`Foxfire Roulette · ${s.mon} mon`, `
      <div style="display:flex;flex-wrap:wrap;gap:16px;align-items:flex-start">
        <div style="display:flex;flex-direction:column;align-items:center;gap:8px;flex:0 1 280px;min-width:0;margin:0 auto">
          <canvas id="rl-cv" width="280" height="280" style="width:280px;max-width:100%;height:auto;aspect-ratio:1"></canvas>
          <div id="rl-res" class="muted" style="text-align:center;min-height:22px">Tap bets to place chips, then spin.</div>
          <div class="pill" style="border-color:#248f5a">🍀 0-Pocket Jackpot: <strong>${st.pot} mon</strong></div>
        </div>
        <div style="display:flex;flex-direction:column;gap:10px;flex:1 1 240px;min-width:0">
          <p class="muted" style="margin:0">Spins: <strong>${st.spins}</strong> · Wins: <strong>${st.wins}</strong> · Best: <strong>${st.best} mon</strong>${st.streak > 1 ? ` · 🔥 Streak ×${mul}` : ""}</p>
          <div><strong>Outside &amp; Dozens</strong><div class="chips" style="margin-top:6px">${outsideBtns}</div></div>
          <div><strong>Numbers (18×)</strong><div style="display:flex;flex-wrap:wrap;gap:5px;margin-top:6px">${numBtns}</div></div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
            <strong>Chip:</strong><div class="chips">${chips}</div>
            <button type="button" class="btn btn-sm" id="rl-dbl">2×</button>
            <button type="button" class="btn btn-sm" id="rl-rebet">Rebet</button>
            <button type="button" class="btn btn-sm" id="rl-clr">Clear</button>
          </div>
          <div class="px-row" style="margin-top:4px">
            <button type="button" class="btn btn-accent" id="rl-spin" ${!stake || (!free && s.mon < stake) ? "disabled" : ""}>${free ? `Daily Free Spin (covers up to 25 mon)` : `Spin · Total bet ${stake} mon`}</button>
          </div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center"><small class="muted">Recent:</small>${histHtml}</div>
        </div>
      </div>
    `, (e) => {
      const cv = e.querySelector("#rl-cv");
      const g = cv.getContext("2d");
      const resEl = e.querySelector("#rl-res");
      let wAng = 0;
      drawWheel(g, wAng, -Math.PI / 2, 114, st.hist[0] ?? null);

      e.querySelectorAll("[data-add]").forEach((b) => {
        b.onclick = () => {
          if (spinning) return;
          const k = b.dataset.add;
          bets[k] = (bets[k] || 0) + chip;
          ping("blip");
          open();
        };
      });
      e.querySelectorAll("[data-wg]").forEach((b) => {
        b.onclick = () => { if (spinning) return; chip = +b.dataset.wg; open(); };
      });
      e.querySelector("#rl-clr").onclick = () => { if (spinning) return; bets = {}; open(); };
      e.querySelector("#rl-rebet").onclick = () => { if (spinning) return; bets = { ...lastBets }; open(); };
      e.querySelector("#rl-dbl").onclick = () => {
        if (spinning) return;
        for (const k of Object.keys(bets)) bets[k] *= 2;
        open();
      };

      e.querySelector("#rl-spin").onclick = () => {
        if (spinning) return;
        const curStake = totalStake();
        if (!curStake) return toast("Place at least one bet first.");
        const useFree = canFree();
        const cost = useFree ? Math.max(0, curStake - 25) : curStake;
        if (s.mon < cost) return toast("Not enough mon.");

        spinning = true;
        lastBets = { ...bets };
        if (useFree) st.freeDay = today();
        s.mon -= cost;
        st.pot += Math.max(5, Math.round(curStake * 0.1));
        st.spins++;
        save();
        hud();
        ping("choice");

        const idx = Math.floor(Math.random() * POCKETS.length);
        const landed = POCKETS[idx];
        const slice = (Math.PI * 2) / POCKETS.length;
        const wStart = wAng;
        const wEnd = wStart + Math.PI * 4 + Math.random() * 2;
        const bStart = -Math.PI / 2;
        const bEnd = wEnd + idx * slice - Math.PI * 8;

        const t0 = performance.now();
        const dur = 2400;

        const settle = () => {
          spinning = false;
          wAng = wEnd % (Math.PI * 2);
          st.hist.unshift(landed);
          st.hist = st.hist.slice(0, 20);

          let baseWon = 0;
          let hitStraight = false;
          for (const [k, amt] of Object.entries(bets)) {
            const m = betMul(k, landed);
            if (m > 0) {
              baseWon += amt * m;
              if (k.startsWith("n:")) hitStraight = true;
            }
          }

          let won = Math.round(baseWon * streakMul());
          let potWon = 0;
          if (landed === 0 && hitStraight) {
            potWon = st.pot;
            st.pot = 150;
            won += potWon;
          }

          if (won > 0) {
            s.mon += won;
            st.wins++;
            st.streak++;
            st.best = Math.max(st.best, won);
            addRenown?.(hitStraight ? 40 : 12);
            if (hitStraight) {
              s.luck = (s.luck || 0) + 3;
              if (!s.hats.includes("roulettehat")) {
                giveHat?.("roulettehat");
                toast(`JACKPOT ${landed}! +${won} mon, +3 Lucky Ripples, and the High Roller's Hat!`);
              } else {
                toast(`${potWon ? "0-POCKET JACKPOT! " : ""}Hit ${landed}! +${won} mon & +3 Lucky Ripples!`);
              }
            } else {
              toast(`${landed} (${colorOf(landed)})! Won ${won} mon!`);
            }
            ping("done");
          } else {
            st.streak = 0;
            toast(`Ball landed on ${landed} (${colorOf(landed)}).`);
            ping("blip");
          }
          save(); hud();
        };

        const tick = (now) => {
          if (!cv.isConnected) { settle(); return; }
          const p = Math.min(1, (now - t0) / dur);
          const ease = 1 - Math.pow(1 - p, 3);
          const curW = wStart + (wEnd - wStart) * ease;
          const curB = bStart + (bEnd - bStart) * ease;
          const rad = 114 - ease * 32;
          drawWheel(g, curW, curB, rad, p >= 1 ? landed : null);

          if (p < 1) {
            raf = requestAnimationFrame(tick);
            return;
          }

          settle();
          open();
        };
        raf = requestAnimationFrame(tick);
      };
    });
  }

  return { open, state: st };
}
