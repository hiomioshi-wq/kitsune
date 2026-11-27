import { esc, today } from "../util.js";

const N = 9;
function hash(str) { let h = 2166136261 >>> 0; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function prng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

function buildMaze(day) {
  const walls = Array.from({ length: N }, () => Array.from({ length: N }, () => ({ t: true, r: true, b: true, l: true })));
  const seen = Array.from({ length: N }, () => Array(N).fill(false));
  const rnd = prng(hash("hedgemaze:" + day));
  const stack = [[0, 0]];
  seen[0][0] = true;
  while (stack.length) {
    const [x, y] = stack[stack.length - 1];
    const nb = [];
    if (y > 0 && !seen[y - 1][x]) nb.push([x, y - 1, "t", "b"]);
    if (y < N - 1 && !seen[y + 1][x]) nb.push([x, y + 1, "b", "t"]);
    if (x > 0 && !seen[y][x - 1]) nb.push([x - 1, y, "l", "r"]);
    if (x < N - 1 && !seen[y][x + 1]) nb.push([x + 1, y, "r", "l"]);
    if (!nb.length) { stack.pop(); continue; }
    const [nx, ny, a, b] = nb[Math.floor(rnd() * nb.length)];
    walls[y][x][a] = false;
    walls[ny][nx][b] = false;
    seen[ny][nx] = true;
    stack.push([nx, ny]);
  }
  return walls;
}

function lanternSpots(day) {
  const rnd = prng(hash("hedgemaze-lan:" + day));
  const out = [];
  while (out.length < 3) {
    const x = Math.floor(rnd() * N), y = Math.floor(rnd() * N);
    if ((x === 0 && y === 0) || (x === N - 1 && y === N - 1)) continue;
    if (out.some((p) => p[0] === x && p[1] === y)) continue;
    out.push([x, y]);
  }
  return out;
}

export function createHedgeMaze(o) {
  const { s, panel, toast, ping, save, hud, giveHat, giveFurn, addRenown } = o;
  const st = (s.hedgemaze ||= {});
  st.solves ??= 0;
  st.done ||= {};
  let last = "";

  function open() {
    const day = today();
    if (st.day !== day) { st.day = day; st.run = null; }
    const walls = buildMaze(day);
    const lanterns = lanternSpots(day);
    if (!st.run || typeof st.run.x !== "number") st.run = { x: 0, y: 0, got: [], moves: 0 };
    const run = st.run;
    const at = (x, y) => lanterns.some((p) => p[0] === x && p[1] === y);
    const solved = !!st.done[day];

    function finish() {
      const first = !st.done[day];
      st.done[day] = 1;
      if (first) {
        st.solves++;
        s.mon += 70;
        addRenown?.(20);
        if (st.solves >= 5 && !st.hat) { st.hat = 1; giveHat?.("mazehat"); }
        if (st.solves >= 15 && !st.furn) { st.furn = 1; giveFurn?.("hedgegate"); }
        last = `Maze solved in ${run.moves} steps. +70 mon and +20 Renown.`;
        toast(last);
        ping("done");
      } else {
        last = `Maze walked again in ${run.moves} steps. The prize was already claimed today.`;
        toast(last);
        ping("blip");
      }
      st.run = { x: 0, y: 0, got: [], moves: 0 };
      save(); hud(); open();
    }

    function tryMove(x, y) {
      if (x < 0 || y < 0 || x >= N || y >= N) return;
      const dx = x - run.x, dy = y - run.y;
      if (Math.abs(dx) + Math.abs(dy) !== 1) return;
      const w = walls[run.y][run.x];
      if (dx === 1 && w.r) return;
      if (dx === -1 && w.l) return;
      if (dy === 1 && w.b) return;
      if (dy === -1 && w.t) return;
      run.x = x; run.y = y; run.moves++;
      const key = `${x},${y}`;
      if (at(x, y) && !run.got.includes(key)) {
        run.got.push(key);
        ping("blip");
        toast(`Lantern ${run.got.length} of 3 found.`);
      }
      if (x === N - 1 && y === N - 1) {
        if (run.got.length >= 3) { save(); finish(); return; }
        toast(`The gate needs all three lanterns — ${run.got.length} of 3 found.`);
      }
      save(); open();
    }

    const cells = [];
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const w = walls[y][x];
      const here = run.x === x && run.y === y;
      const goal = x === N - 1 && y === N - 1;
      const hasLantern = at(x, y) && !run.got.includes(`${x},${y}`);
      const bg = here ? "rgba(255,216,77,.32)" : goal ? "rgba(53,214,138,.18)" : "transparent";
      const label = here ? "🦊" : goal ? "⛩️" : hasLantern ? "🏮" : "";
      cells.push(`<button type="button" data-mx="${x}" data-my="${y}" aria-label="${here ? "You" : goal ? "Maze gate" : hasLantern ? "Lantern" : "Maze path"}" style="width:100%;height:100%;min-height:0;display:flex;align-items:center;justify-content:center;font-size:14px;background:${bg};padding:0;min-width:0;border-radius:0;border-style:solid;border-width:2px;border-color:${w.t ? "#2f5a3a" : "transparent"};border-top-color:${w.t ? "#2f5a3a" : "transparent"};border-right-color:${w.r ? "#2f5a3a" : "transparent"};border-bottom-color:${w.b ? "#2f5a3a" : "transparent"};border-left-color:${w.l ? "#2f5a3a" : "transparent"}">${label}</button>`);
    }

    const step = (dx, dy) => tryMove(run.x + dx, run.y + dy);

    panel(`Lantern Hedge Maze · ${st.solves} solved`, `
      <p class="muted">Walk from the fox to the gate, collecting all three lanterns. Tap an adjacent square or use the buttons. A fresh maze grows every day.</p>
      <div><div style="display:grid;grid-template-columns:repeat(${N},1fr);grid-template-rows:repeat(${N},minmax(0,1fr));aspect-ratio:1;flex:none;box-sizing:border-box;width:100%;max-width:360px;margin:10px auto;border:2px solid #2f5a3a;border-radius:6px;overflow:hidden">${cells.join("")}</div></div>
      <div class="chips" style="justify-content:center">
        <button type="button" class="btn" data-step="0:-1">Up</button>
        <button type="button" class="btn" data-step="-1:0">Left</button>
        <button type="button" class="btn" data-step="1:0">Right</button>
        <button type="button" class="btn" data-step="0:1">Down</button>
      </div>
      <p style="text-align:center;margin:8px 0"><strong>Lanterns:</strong> ${run.got.length}/3 · <strong>Steps:</strong> ${run.moves}${solved ? " · <strong>Prize claimed today</strong>" : ""}</p>
      <div class="chips" style="justify-content:center"><button type="button" class="btn" id="hm-reset">Start this walk over</button></div>
      ${last ? `<div class="hint" style="margin-top:10px">${esc(last)}</div>` : ""}
    `, (e) => {
      e.querySelectorAll("[data-mx]").forEach((b) => (b.onclick = () => tryMove(+b.dataset.mx, +b.dataset.my)));
      e.querySelectorAll("[data-step]").forEach((b) => (b.onclick = () => { const [dx, dy] = b.dataset.step.split(":").map(Number); step(dx, dy); }));
      e.querySelector("#hm-reset").onclick = () => { st.run = { x: 0, y: 0, got: [], moves: 0 }; save(); open(); };
    });
  }

  return { open, state: st };
}
