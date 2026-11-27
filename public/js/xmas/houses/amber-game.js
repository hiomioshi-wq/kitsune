// Fossil Dig: three stone slabs, each hiding three fossils. A limited number of brush strokes per slab;
// an empty square shows how many bone squares touch it. No clock, so it can be played at any pace.
export const COLS = 6, ROWS = 5, SLABS = 3;
export const SIZES = [4, 3, 2];
export const BONUS = 2;
const NAMES = { 4: "backbone", 3: "claw", 2: "tooth" };

/** Squares touching `i`, diagonals included. */
export function around(i) {
  const x = i % COLS, y = Math.floor(i / COLS), list = [];
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
    const nx = x + dx, ny = y + dy;
    if ((dx || dy) && nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS) list.push(ny * COLS + nx);
  }
  return list;
}

/** Bury straight, non-overlapping fossils. `random` is injectable for testing. */
export function bury(random = Math.random) {
  for (;;) {
    const taken = new Set(), fossils = [];
    for (const size of SIZES) {
      for (let tries = 0; tries < 60; tries++) {
        const across = random() < 0.5;
        const x = Math.floor(random() * (across ? COLS - size + 1 : COLS));
        const y = Math.floor(random() * (across ? ROWS : ROWS - size + 1));
        const cells = Array.from({ length: size }, (_, k) => (y + (across ? 0 : k)) * COLS + x + (across ? k : 0));
        if (cells.some((c) => taken.has(c))) continue;
        cells.forEach((c) => taken.add(c));
        fossils.push({ size, cells, across });
        break;
      }
    }
    if (fossils.length === SIZES.length) return fossils;
  }
}

const bone = (end0, end1, across) => `<svg viewBox="0 0 40 40" width="100%" height="100%" aria-hidden="true" style="display:block"><g ${across ? "" : 'transform="rotate(90 20 20)"'} fill="#fdf2d4" stroke="#7a5428" stroke-width="1.6"><path d="M${end0 ? 9 : -2} 15H${end1 ? 31 : 42}V25H${end0 ? 9 : -2}Z"/>${end0 ? '<circle cx="9" cy="14" r="6"/><circle cx="9" cy="26" r="6"/>' : ""}${end1 ? '<circle cx="31" cy="14" r="6"/><circle cx="31" cy="26" r="6"/>' : ""}</g></svg>`;

export default function mount(el, api) {
  const STROKES = api.unhurried ? 18 : 14;
  el.innerHTML = `
    <div data-stage style="max-width:420px;margin:0 auto;padding:10px;border-radius:14px;background:linear-gradient(#5a3a28,#2e1c14);color:#fff;font:600 13px system-ui,sans-serif;user-select:none;-webkit-user-select:none">
      <div style="display:flex;justify-content:space-between;gap:6px;margin-bottom:8px"><span data-score></span><span data-slab></span><span data-strokes></span></div>
      <div data-cover style="display:flex;flex-direction:column;align-items:center;gap:10px;padding:18px 8px;text-align:center">
        <strong style="font-size:17px">Fossil Dig</strong>
        <span style="max-width:280px;line-height:1.45">Each slab hides a backbone (4 squares), a claw (3) and a tooth (2), in straight lines. Every bone square is a point, and a whole fossil adds ${BONUS} more.</span>
        ${api.svg("amber_protoceratops", { size: 80, stage: 1, mood: "happy" })}
        <button type="button" class="btn btn-accent" data-start>Start digging</button>
        <small style="color:#ecd8b8">Tap a square, or move with the arrow keys and press Enter</small>
      </div>
      <div data-grid hidden role="group" aria-label="Stone slab" style="display:grid;grid-template-columns:repeat(${COLS},1fr);gap:4px"></div>
      <div style="text-align:center;margin-top:8px"><button type="button" class="btn btn-accent" data-next hidden></button></div>
    </div>
    <p data-say aria-live="polite" style="margin:6px 0 0;text-align:center;min-height:1.4em;color:#ffe8b8;font-weight:600"></p>`;

  const q = (s) => el.querySelector(s);
  const grid = q("[data-grid]"), cover = q("[data-cover]"), nextBtn = q("[data-next]"), say = q("[data-say]");
  let slab = 0, score = 0, strokes = STROKES, fossils = [], dug = new Set(), open = false, over = false, dead = false;

  const tiles = Array.from({ length: COLS * ROWS }, (_, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.style.cssText = "aspect-ratio:1;padding:0;border-radius:8px;cursor:pointer;font:800 17px system-ui,sans-serif;overflow:hidden";
    b.onclick = () => brush(i);
    grid.appendChild(b);
    return b;
  });

  function hud() {
    q("[data-score]").textContent = `${score} points`;
    q("[data-slab]").textContent = `Slab ${Math.min(slab + 1, SLABS)}/${SLABS}`;
    q("[data-strokes]").textContent = `${strokes} strokes`;
  }

  function paint(i, buried = false) {
    const b = tiles[i], where = `Row ${Math.floor(i / COLS) + 1}, column ${(i % COLS) + 1}`;
    const f = fossils.find((x) => x.cells.includes(i));
    const shown = dug.has(i) || buried;
    b.style.opacity = buried && !dug.has(i) ? "0.45" : "1";
    if (!shown) {
      b.style.background = (i + Math.floor(i / COLS)) % 2 ? "#a88460" : "#b8946c";
      b.style.border = "2px solid #d8bc90";
      b.innerHTML = "";
      b.setAttribute("aria-label", `${where}, stone`);
    } else if (f) {
      const k = f.cells.indexOf(i);
      b.style.background = f.cells.every((c) => dug.has(c)) ? "#c8861c" : "#6a4428";
      b.style.border = "2px solid #ffc84a";
      b.innerHTML = bone(k === 0, k === f.cells.length - 1, f.across);
      b.setAttribute("aria-label", `${where}, ${NAMES[f.size]} bone`);
    } else {
      const n = around(i).filter((c) => fossils.some((x) => x.cells.includes(c))).length;
      b.style.background = "#3c281c";
      b.style.border = "2px solid #6a4c34";
      b.style.color = ["#8a7460", "#9ad8ff", "#a8f08a", "#ffd84d", "#ff9a6a", "#ff7ab0"][Math.min(5, n)];
      b.textContent = String(n);
      b.setAttribute("aria-label", `${where}, empty, ${n} bone squares touching`);
    }
  }

  function layout() {
    fossils = bury();
    dug = new Set();
    strokes = STROKES;
    open = true;
    nextBtn.hidden = true;
    tiles.forEach((b, i) => { b.disabled = false; paint(i); });
    say.textContent = "Brush a square.";
    hud();
  }

  function brush(i) {
    if (!open || over || dead || dug.has(i)) return;
    dug.add(i);
    strokes--;
    const f = fossils.find((x) => x.cells.includes(i));
    if (f) {
      score++;
      if (f.cells.every((c) => dug.has(c))) {
        score += BONUS;
        say.textContent = `Whole ${NAMES[f.size]} uncovered! +${BONUS} bonus.`;
        f.cells.forEach((c) => paint(c));
        api.ping("done");
      } else {
        say.textContent = "Bone!";
        paint(i);
        api.ping("blip");
      }
    } else {
      paint(i);
      say.textContent = "Just stone.";
      api.ping("choice");
    }
    hud();
    const cleared = fossils.every((x) => x.cells.every((c) => dug.has(c)));
    if (cleared || strokes <= 0) endSlab(cleared);
  }

  function endSlab(cleared) {
    open = false;
    tiles.forEach((b, i) => { paint(i, true); b.disabled = true; });
    const last = slab === SLABS - 1;
    say.textContent = cleared ? "Every fossil found on this slab!" : "Out of strokes. The faded bones were still buried.";
    nextBtn.textContent = last ? "Finish the dig" : "Next slab";
    nextBtn.hidden = false;
    nextBtn.focus?.({ preventScroll: true });
  }

  function advance() {
    if (open || over || dead) return;
    slab++;
    if (slab < SLABS) {
      layout();
      tiles[0].focus?.({ preventScroll: true });
      return;
    }
    over = true;
    nextBtn.hidden = true;
    grid.hidden = true;
    strokes = 0;
    hud();
    cover.innerHTML = `<strong style="font-size:18px">Dig complete!</strong><span>${score} dig points</span>${api.svg("amber_protoceratops", { size: 96, stage: 1, mood: score >= 28 ? "love" : "happy" })}`;
    cover.style.display = "flex";
    say.textContent = "";
    globalThis.removeEventListener("keydown", onKey, true);
    api.done(score);
  }

  function start() {
    if (open || over || dead || slab) return;
    cover.style.display = "none";
    grid.hidden = false;
    layout();
    tiles[0].focus?.({ preventScroll: true });
  }

  function onKey(e) {
    if (!el.isConnected) return cleanup();
    if (e.metaKey || e.ctrlKey || e.altKey || !open) return;
    const step = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
    if (!step) return;
    e.preventDefault();
    e.stopPropagation();
    const at = Math.max(0, tiles.indexOf(document.activeElement));
    const x = Math.max(0, Math.min(COLS - 1, (at % COLS) + step[0])), y = Math.max(0, Math.min(ROWS - 1, Math.floor(at / COLS) + step[1]));
    tiles[y * COLS + x].focus({ preventScroll: true });
  }

  function cleanup() {
    if (dead) return;
    dead = true;
    open = false;
    globalThis.removeEventListener("keydown", onKey, true);
  }

  q("[data-start]").onclick = start;
  nextBtn.onclick = advance;
  globalThis.addEventListener("keydown", onKey, true);
  hud();
  return cleanup;
}
