// A 3D cover flow: the centre book faces you, the rest fan away on either side.
// Click or tap a side book to bring it forward, click the centre one to open it.
// Arrow keys, horizontal scroll and swiping all move through the stack.
import { esc, icon, coverHtml } from "../util.js";
import { coverSrc, progressPct } from "../store.js";

export function coverflowHtml(items, prog, { label = "Books" } = {}) {
  if (!items.length) return "";
  return `<div class="flow-wrap">
    <div class="flow" tabindex="0" role="listbox" aria-label="${esc(label)}" data-active="0">
      ${items.map((i, k) => {
        const pct = progressPct(prog[i.id]);
        return `<button class="flow-item" type="button" role="option" data-id="${esc(i.id)}" data-k="${k}" aria-label="${esc(i.title)}${pct ? `, ${pct}% read` : ""}">
          ${coverHtml(coverSrc(i), i.title, { pct })}
          <span class="flow-cap"><strong>${esc(i.title)}</strong><small>${esc(i.series || i.author || "")}${pct ? ` · ${pct}%` : ""}</small></span>
        </button>`;
      }).join("")}
    </div>
    <button class="flow-nav flow-prev" type="button" aria-label="Previous">${icon("back")}</button>
    <button class="flow-nav flow-next" type="button" aria-label="Next">${icon("next")}</button>
  </div>`;
}

export function wireCoverflow(root, onOpen) {
  const flow = root?.querySelector(".flow");
  if (!flow) return;
  const items = [...flow.querySelectorAll(".flow-item")];
  let active = Math.min(1, items.length - 1);
  const narrow = () => flow.clientWidth < 560;
  const place = () => {
    const gap = narrow() ? 92 : 150, side = narrow() ? 56 : 70;
    items.forEach((el, k) => {
      const d = k - active, a = Math.abs(d);
      const x = d === 0 ? 0 : Math.sign(d) * (side + a * gap * 0.62);
      const rot = d === 0 ? 0 : -Math.sign(d) * 52;
      const z = d === 0 ? 90 : -40 - a * 34;
      el.style.transform = `translateX(${x}px) translateZ(${z}px) rotateY(${rot}deg)`;
      el.style.zIndex = String(100 - a);
      el.style.opacity = a > 4 ? "0" : String(1 - a * 0.12);
      el.style.pointerEvents = a > 4 ? "none" : "";
      el.classList.toggle("is-active", d === 0);
      el.setAttribute("aria-selected", String(d === 0));
      el.tabIndex = -1;
    });
    flow.dataset.active = String(active);
    root.querySelector(".flow-prev").disabled = active === 0;
    root.querySelector(".flow-next").disabled = active === items.length - 1;
  };
  const go = (k) => { active = Math.max(0, Math.min(items.length - 1, k)); place(); };

  flow.addEventListener("click", (e) => {
    const b = e.target.closest(".flow-item");
    if (!b || dragged) return;
    const k = Number(b.dataset.k);
    if (k === active) onOpen(b.dataset.id); else go(k);
  });
  root.querySelector(".flow-prev").onclick = () => go(active - 1);
  root.querySelector(".flow-next").onclick = () => go(active + 1);
  flow.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") { e.preventDefault(); go(active - 1); }
    else if (e.key === "ArrowRight") { e.preventDefault(); go(active + 1); }
    else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(items[active].dataset.id); }
    else if (e.key === "Home") { e.preventDefault(); go(0); }
    else if (e.key === "End") { e.preventDefault(); go(items.length - 1); }
  });
  // Horizontal trackpad scroll moves one book per gesture step.
  let wheelAt = 0;
  flow.addEventListener("wheel", (e) => {
    if (Math.abs(e.deltaX) < Math.abs(e.deltaY) || Math.abs(e.deltaX) < 8) return;
    e.preventDefault();
    const now = Date.now();
    if (now - wheelAt < 220) return;
    wheelAt = now;
    go(active + Math.sign(e.deltaX));
  }, { passive: false });
  // Swipe or drag.
  let startX = null, dragged = false;
  flow.addEventListener("pointerdown", (e) => { startX = e.clientX; dragged = false; });
  flow.addEventListener("pointermove", (e) => { if (startX != null && Math.abs(e.clientX - startX) > 12) dragged = true; });
  flow.addEventListener("pointerup", (e) => {
    if (startX == null) return;
    const dx = e.clientX - startX;
    startX = null;
    if (Math.abs(dx) > 40) go(active - Math.round(dx / (narrow() ? 90 : 140)) || active - Math.sign(dx));
    setTimeout(() => (dragged = false), 0);
  });
  flow.addEventListener("pointercancel", () => { startX = null; dragged = false; });
  const onResize = () => { if (!flow.isConnected) return removeEventListener("resize", onResize); place(); };
  addEventListener("resize", onResize, { passive: true });
  place();
}
