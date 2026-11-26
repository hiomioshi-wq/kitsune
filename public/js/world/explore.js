// Walkable 2D Building Interiors: enter any building in Kitsune World to walk around, search daily chests/shelves for inventory items, inspect lore, and use the building's service.
import { esc, today } from "../util.js";

const THEMES = {
  tea: { floor: "#5a3c24", wall: "#2e1c10", rug: "#a83a32", accent: "#ffd27a" },
  tower: { floor: "#282236", wall: "#161220", rug: "#60379a", accent: "#9fe0ff" },
  clock: { floor: "#3b2c1a", wall: "#1e160c", rug: "#c79a2e", accent: "#ffe49e" },
  palace: { floor: "#143828", wall: "#081c14", rug: "#35d68a", accent: "#ffd84d" },
  glass: { floor: "#1c363e", wall: "#0e1e24", rug: "#7fe0d0", accent: "#bfeaff" },
  observatory: { floor: "#141a32", wall: "#090d1c", rug: "#4970c8", accent: "#ffd84d" },
  bank: { floor: "#382428", wall: "#1e1214", rug: "#b5303a", accent: "#ffd84d" },
  studio: { floor: "#44362a", wall: "#261c14", rug: "#d97a4a", accent: "#fff1d0" },
  default: { floor: "#4a3624", wall: "#241a12", rug: "#8a3832", accent: "#ffd27a" },
};

const LOOT_POOL = ["acorn", "mushroom", "berry", "herb", "honey", "shell", "kelp", "quartz", "iron", "gear", "spring", "silk", "spice", "ink", "ticket", "emerald", "poppy", "gold", "pearl"];

export function createExplorer(o) {
  const { s, root, toast, ping, save, hud, drawFox, fur, tailsN, interiors, extras } = o;
  const st = (s.explore ||= {});
  st.looted ||= {};
  st.visited ||= {};

  function enter(b, onLeave) {
    const box = document.createElement("div");
    box.className = "rm rm-explore";
    box.innerHTML = `
      <div style="position:relative;width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(8,8,14,.94);padding:16px;box-sizing:border-box">
        <div style="display:flex;justify-content:space-between;align-items:center;width:100%;max-width:680px;margin-bottom:8px;color:#fff">
          <strong>🏠 ${esc(b[6])}</strong>
          <div style="display:flex;gap:8px;align-items:center">
            <small class="muted">WASD / Arrows to walk · E to interact</small>
            <button type="button" class="btn btn-sm" id="ex-out">Exit (Esc)</button>
          </div>
        </div>
        <canvas id="ex-cv" width="640" height="400" style="width:100%;max-width:680px;border-radius:12px;border:2px solid #d9a84e;background:#1a1410"></canvas>
        <div id="ex-prompt" style="margin-top:10px;min-height:36px;display:flex;align-items:center;gap:10px"></div>
      </div>
    `;
    root.appendChild(box);

    const cv = box.querySelector("#ex-cv");
    const g = cv.getContext("2d");
    const promptEl = box.querySelector("#ex-prompt");
    const th = THEMES[b[5]] || THEMES.default;

    if (!st.visited[b[0]]) {
      st.visited[b[0]] = 1;
      save();
    }

    let px = 320, py = 320, dir = "up", step = 0, alive = true, raf = 0, last = performance.now();
    const keys = new Set();

    const props = [
      { id: "keeper", x: 320, y: 120, r: 44, label: `Talk / Use ${b[6]}`, icon: "🗣️", go: () => { leave(); interiors.open(b); } },
      { id: "chest", x: 130, y: 150, r: 40, label: st.looted[b[0]] === today() ? "Empty Shelf (Searched today)" : "Search Supply Chest", icon: "🧰", go: () => {
        if (st.looted[b[0]] === today()) return toast("You already searched this shelf today.");
        st.looted[b[0]] = today();
        let h = 13;
        for (const c of b[0] + today()) h = (h * 31 + c.charCodeAt(0)) >>> 0;
        const itemId = LOOT_POOL[h % LOOT_POOL.length];
        const qty = 1 + (h % 3);
        const mon = 10 + (h % 25);
        extras?.addItem?.(itemId, qty);
        s.mon += mon;
        ping("done"); save(); hud();
        toast(`Found ${qty}× ${extras?.itemName?.(itemId) || itemId} and ${mon} mon!`);
      }},
      { id: "plaque", x: 510, y: 150, r: 40, label: "Read Wall Plaque", icon: "📜", go: () => {
        ping("choice");
        toast(`${b[6]} — Open to travelers of Kitsune World. Keep your lantern lit!`);
      }},
      { id: "door", x: 320, y: 370, r: 34, label: "Step Outside", icon: "🚪", go: () => leave() },
    ];

    const leave = () => {
      if (!alive) return;
      alive = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKey, true);
      window.removeEventListener("keyup", onUp, true);
      box.remove();
      onLeave?.();
    };

    const nearby = () => props.find((p) => Math.hypot(p.x - px, p.y - py) < p.r);

    const onKey = (e) => {
      if (!alive) return;
      const k = e.key.toLowerCase();
      e.stopPropagation();
      if (k === "escape") { e.preventDefault(); return leave(); }
      if (k === "e" || k === " " || k === "enter") {
        e.preventDefault();
        if (!e.repeat) nearby()?.go();
        return;
      }
      if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(k)) {
        e.preventDefault();
        keys.add(k);
      }
    };
    const onUp = (e) => keys.delete(e.key.toLowerCase());
    window.addEventListener("keydown", onKey, true);
    window.addEventListener("keyup", onUp, true);
    box.querySelector("#ex-out").onclick = leave;

    const frame = (now) => {
      if (!alive || !box.isConnected) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      let ax = 0, ay = 0;
      if (keys.has("a") || keys.has("arrowleft")) ax--;
      if (keys.has("d") || keys.has("arrowright")) ax++;
      if (keys.has("w") || keys.has("arrowup")) ay--;
      if (keys.has("s") || keys.has("arrowdown")) ay++;
      const moving = !!(ax || ay);
      if (moving) {
        const m = Math.hypot(ax, ay);
        px = Math.max(48, Math.min(592, px + (ax / m) * 200 * dt));
        py = Math.max(88, Math.min(372, py + (ay / m) * 200 * dt));
        dir = Math.abs(ax) > Math.abs(ay) ? (ax < 0 ? "left" : "right") : (ay < 0 ? "up" : "down");
        step += dt * 12;
      }

      // Draw room
      g.fillStyle = th.wall;
      g.fillRect(0, 0, 640, 80);
      g.fillStyle = th.floor;
      g.fillRect(0, 80, 640, 320);

      // Floor planks
      g.strokeStyle = "rgba(0,0,0,.18)";
      g.lineWidth = 1;
      for (let y = 100; y < 400; y += 28) { g.beginPath(); g.moveTo(0, y); g.lineTo(640, y); g.stroke(); }

      // Center rug
      g.fillStyle = th.rug;
      g.strokeStyle = th.accent;
      g.lineWidth = 3;
      g.fillRect(190, 170, 260, 140);
      g.strokeRect(190, 170, 260, 140);

      // Counter
      g.fillStyle = "#6a4528";
      g.fillRect(240, 96, 160, 28);
      g.strokeStyle = "#1b1410";
      g.strokeRect(240, 96, 160, 28);

      // Windows on back wall
      for (const wx of [120, 480]) {
        g.fillStyle = "#bfe6f7";
        g.fillRect(wx, 20, 40, 40);
        g.strokeStyle = th.accent;
        g.strokeRect(wx, 20, 40, 40);
      }

      // Props
      for (const p of props) {
        if (p.id === "door") {
          g.fillStyle = "#2b1d12";
          g.fillRect(p.x - 28, p.y - 10, 56, 22);
          g.strokeStyle = th.accent;
          g.strokeRect(p.x - 28, p.y - 10, 56, 22);
        } else {
          g.fillStyle = "rgba(0,0,0,.35)";
          g.beginPath(); g.arc(p.x, p.y, 18, 0, Math.PI * 2); g.fill();
          g.font = "22px system-ui";
          g.textAlign = "center";
          g.textBaseline = "middle";
          g.fillText(p.icon, p.x, p.y);
        }
      }

      // Player fox
      drawFox(g, px, py, dir, step, fur, tailsN, s.hat, now, moving);

      const n = nearby();
      if (n) {
        promptEl.innerHTML = `<button type="button" class="btn btn-accent btn-sm" id="ex-act"><kbd>E</kbd> ${esc(n.label)}</button>`;
        promptEl.querySelector("#ex-act").onclick = n.go;
      } else {
        promptEl.innerHTML = `<span class="muted">Explore ${esc(b[6])} — check the chest, plaque, or counter.</span>`;
      }

      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return leave;
  }

  return { enter, state: st };
}
