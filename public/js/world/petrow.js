// Pet Row: a lantern-lit street of pet-house storefronts. Walk to a door (or tap it) to go inside.
import { esc } from "../util.js";
import { petUrl } from "../xmas/art.js";
import { xs, loadXmas } from "../xmas/core.js";

// Two rows of shopfronts, each facing its own lane. The street grows sideways as shops are added and the
// view follows the fox; every gap between columns joins the two lanes.
const SHOP_W = 168, SHOP_H = 132, PITCH = 212, LEFT = 34;
const ROW_TOP = [10, 232];
const VIEW_W = 760;

export function enterPetRow(o) {
  const { root, s, drawFox, fur, tailsN, ping, onLeave, onVisit, shops, from } = o;
  const box = document.createElement("div");
  box.className = "rm rm-explore";
  box.tabIndex = -1;
  box.innerHTML = `
    <div style="position:relative;width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;background:radial-gradient(circle at top,#34305c,#100e1e);padding:12px;box-sizing:border-box;overflow:auto">
      <div style="display:flex;justify-content:space-between;align-items:center;width:100%;max-width:820px;margin-bottom:8px;color:#fff;gap:8px;flex-wrap:wrap">
        <strong style="font-size:15px">🏮 Pet Row</strong>
        <button type="button" class="btn btn-sm" data-out>Exit (Esc)</button>
      </div>
      <div style="position:relative;width:100%;max-width:820px;aspect-ratio:760/460">
        <canvas width="760" height="460" aria-label="Pet Row, a street of pet shops" style="width:100%;height:100%;border-radius:14px;border:2px solid #ffd27a;box-shadow:0 18px 46px rgba(0,0,0,.55);background:#b9a58c;cursor:pointer;display:block;touch-action:none"></canvas>
      </div>
      <nav class="chips" aria-label="Pet shops" style="margin-top:8px;justify-content:center">${shops.map((h, i) => `<button type="button" class="chip" data-shop="${i}">${h.icon} ${esc(h.name)}</button>`).join("")}</nav>
      <div data-prompt style="margin-top:6px;min-height:36px;display:flex;align-items:center;justify-content:center;color:#fff"></div>
    </div>`;
  root.appendChild(box);

  const cv = box.querySelector("canvas"), g = cv.getContext("2d"), promptEl = box.querySelector("[data-prompt]");
  const cols = Math.max(4, Math.ceil(shops.length / 2));
  const streetW = Math.max(VIEW_W, LEFT * 2 + (cols - 1) * PITCH + SHOP_W);
  const plots = shops.map((h, i) => {
    // Fill column by column so neighbouring entries stand face to face across the street.
    const x = LEFT + Math.floor(i / 2) * PITCH, y = ROW_TOP[i % 2];
    const sprites = h.show.slice(0, 2).map((id) => { const im = new Image(); im.src = petUrl(id, 1, "happy"); return im; });
    return { ...h, x, y, door: { x: x + SHOP_W / 2, y: y + SHOP_H + 12 }, sprites };
  });
  // Come back out of the same door you went in by.
  const start = plots.find((h) => h.slug === from);
  let px = start ? start.door.x : 380, py = start ? start.door.y + 14 : 190, dir = "down", step = 0, alive = true, raf = 0, last = performance.now();
  let walkTarget = null, camX = 0;
  const keys = new Set();

  const isSolid = (x, y) => x < 14 || x > streetW - 14 || y < 150 || y > 446 || plots.some((h) => x > h.x - 6 && x < h.x + SHOP_W + 6 && y > h.y - 6 && y < h.y + SHOP_H + 4);

  const leave = () => {
    if (!alive) return;
    alive = false;
    cancelAnimationFrame(raf);
    window.removeEventListener("keydown", onKey, true);
    window.removeEventListener("keyup", onUp, true);
    box.remove();
    onLeave?.();
  };
  const visit = (h) => {
    if (!alive) return;
    ping?.("open");
    onVisit(h.slug);
  };

  box.querySelector("[data-out]").onclick = leave;
  box.querySelectorAll("[data-shop]").forEach((b) => (b.onclick = () => visit(plots[+b.dataset.shop])));
  cv.addEventListener("pointerdown", (e) => {
    const r = cv.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * VIEW_W + camX, y = ((e.clientY - r.top) / r.height) * 460;
    const shop = plots.find((h) => x > h.x && x < h.x + SHOP_W && y > h.y && y < h.y + SHOP_H);
    // Tapping a shopfront goes straight in; tapping the street walks there.
    if (shop) return visit(shop);
    walkTarget = { x: Math.max(20, Math.min(streetW - 20, x)), y: Math.max(154, Math.min(442, y)) };
  });

  const near = () => plots.find((h) => Math.hypot(h.door.x - px, h.door.y - py) < 40);
  const onKey = (e) => {
    if (!alive || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key.toLowerCase();
    if (k === "tab") return;
    e.stopPropagation();
    if (k === "escape") { e.preventDefault(); leave(); return; }
    if (k === "e" || k === " " || k === "enter") {
      if (k !== "e" && e.target.closest?.("button")) return;
      e.preventDefault();
      const h = near();
      if (h && !e.repeat) visit(h);
      return;
    }
    if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(k)) {
      e.preventDefault();
      walkTarget = null;
      keys.add(k);
    }
  };
  const onUp = (e) => keys.delete(e.key.toLowerCase());
  window.addEventListener("keydown", onKey, true);
  window.addEventListener("keyup", onUp, true);
  loadXmas().catch(() => {});
  box.focus({ preventScroll: true });

  function pill(x, y, w, h, fill, stroke, r = 6) {
    g.beginPath();
    g.roundRect(x, y, w, h, r);
    g.fillStyle = fill;
    g.fill();
    if (stroke) { g.strokeStyle = stroke; g.lineWidth = 2; g.stroke(); }
  }
  function label(text, x, y, color = "#fff", font = "700 10px system-ui", max) {
    g.fillStyle = color;
    g.font = font;
    g.textAlign = "center";
    g.fillText(text, x, y, max);
  }

  function drawShop(h, now) {
    const { x, y } = h;
    pill(x + 6, y + 34, SHOP_W - 12, SHOP_H - 34, h.front, "rgba(0,0,0,.3)", [4, 4, 2, 2]);
    // Scalloped awning roof
    pill(x, y + 10, SHOP_W, 30, h.roof, h.accent, [18, 18, 2, 2]);
    g.fillStyle = h.roof;
    for (let i = 0; i < 7; i++) { g.beginPath(); g.arc(x + 12 + i * 24, y + 40, 12, 0, Math.PI); g.fill(); }
    pill(x + 10, y, SHOP_W - 20, 24, "rgba(24,18,38,.94)", h.accent, 8);
    label(`${h.icon} ${h.name}`, x + SHOP_W / 2, y + 16, "#fff", "700 11px system-ui", SHOP_W - 30);
    // Two lit windows with residents, and the door
    [x + 14, x + SHOP_W - 64].forEach((wx, i) => {
      pill(wx, y + 60, 50, 50, "#fff2c8", h.accent, [22, 22, 4, 4]);
      const im = h.sprites[i];
      if (im?.complete && im.naturalWidth) g.drawImage(im, wx + 3, y + 64 + Math.sin(now / 600 + wx) * 2, 44, 45);
    });
    pill(x + SHOP_W / 2 - 17, y + 74, 34, SHOP_H - 74, "#4a2c1c", h.accent, [17, 17, 0, 0]);
    g.fillStyle = h.accent;
    g.beginPath(); g.arc(x + SHOP_W / 2 + 9, y + 106, 2.5, 0, 7); g.fill();
    const have = h.ids.filter((id) => !!xs()?.pets?.[id]).length;
    pill(x + SHOP_W / 2 - 24, y + 47, 48, 16, "rgba(24,18,38,.85)", null, 8);
    label(`${have}/${h.ids.length}`, x + SHOP_W / 2, y + 58, "#ffe896");
    pill(x + SHOP_W / 2 - 20, y + SHOP_H, 40, 8, "#8a3632", null, 2);
  }

  const frame = (now) => {
    if (!alive) return;
    if (!box.isConnected) return leave();
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    let ax = (keys.has("d") || keys.has("arrowright") ? 1 : 0) - (keys.has("a") || keys.has("arrowleft") ? 1 : 0);
    let ay = (keys.has("s") || keys.has("arrowdown") ? 1 : 0) - (keys.has("w") || keys.has("arrowup") ? 1 : 0);
    if (!ax && !ay && walkTarget) {
      const dx = walkTarget.x - px, dy = walkTarget.y - py, d = Math.hypot(dx, dy);
      if (d < 6) walkTarget = null;
      else { ax = dx / d; ay = dy / d; }
    }
    const moving = !!(ax || ay);
    if (moving) {
      const m = Math.hypot(ax, ay), nx = px + (ax / m) * 220 * dt, ny = py + (ay / m) * 220 * dt;
      let went = false;
      if (!isSolid(nx, py)) { px = nx; went = true; }
      if (!isSolid(px, ny)) { py = ny; went = true; }
      if (!went) walkTarget = null;
      dir = Math.abs(ax) > Math.abs(ay) ? (ax < 0 ? "left" : "right") : ay < 0 ? "up" : "down";
      step += dt * 12;
    }

    camX = Math.max(0, Math.min(streetW - VIEW_W, px - VIEW_W / 2));
    g.save();
    g.translate(-Math.round(camX), 0);
    // Cobbled street
    g.fillStyle = "#b9a58c";
    g.fillRect(0, 0, streetW, 460);
    g.fillStyle = "rgba(90,70,56,.16)";
    for (let ty = 0; ty < 460; ty += 18) for (let tx = (ty / 18) % 2 ? -12 : 0; tx < streetW; tx += 26) { g.beginPath(); g.roundRect(tx + 1, ty + 1, 23, 15, 6); g.fill(); }
    // Lantern strings across the middle
    g.strokeStyle = "#4a3426";
    g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(0, 186); for (let i = 0; i * 100 < streetW; i++) g.quadraticCurveTo(i * 100 + 50, 206, i * 100 + 100, 186); g.stroke();
    for (let i = 0; 26 + i * 51 < streetW; i++) {
      const lx = 26 + i * 51, ly = 196 + Math.sin(now / 700 + i) * 2;
      g.globalAlpha = 0.25; g.fillStyle = "#ffd27a"; g.beginPath(); g.arc(lx, ly, 12, 0, 7); g.fill();
      g.globalAlpha = 1; pill(lx - 5, ly - 7, 10, 14, i % 2 ? "#e8483c" : "#ffb83c", null, 5);
    }
    plots.forEach((h) => drawShop(h, now));
    drawFox(g, px, py, dir, step, fur, tailsN, s.hat, now, moving);
    g.restore();
    // Chevrons hint that the street carries on
    if (camX > 4) label("‹", 16, 200, "#7a2f2a", "900 30px system-ui");
    if (camX < streetW - VIEW_W - 4) label("›", VIEW_W - 16, 200, "#7a2f2a", "900 30px system-ui");

    const hit = near();
    const lbl = hit ? hit.slug : "";
    if (promptEl.dataset.lbl !== lbl || !promptEl.firstChild) {
      promptEl.dataset.lbl = lbl;
      promptEl.innerHTML = hit
        ? `<button type="button" class="btn btn-accent btn-sm" data-act><kbd>E</kbd> Enter ${esc(hit.name)}</button>`
        : `<span class="muted">Walk to a door, or tap any shopfront.</span>`;
      const act = promptEl.querySelector("[data-act]");
      if (act) act.onclick = () => visit(hit);
    }
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);
  return leave;
}
