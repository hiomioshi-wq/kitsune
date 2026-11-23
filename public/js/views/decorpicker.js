// Settings: wallpaper.
import { ls, esc } from "../util.js";
import { settings, saveSettings } from "../store.js";
import { WALLPAPERS, STRENGTHS } from "../decor.js";

export function mountDecor(box) {
  const data = (w) => (w.svg ? `url(&quot;data:image/svg+xml,${esc(encodeURIComponent(w.svg))}&quot;)` : "none");
  box.innerHTML = `<style>.dc-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(92px,1fr));gap:6px;margin-top:10px}.dc-t{display:grid;gap:4px;padding:5px;border-radius:10px;border:2px solid var(--line);background:var(--surface);color:inherit;font:500 11px/1.2 system-ui;text-align:center}.dc-t[aria-pressed=true]{border-color:var(--accent)}.dc-s{display:block;height:48px;border-radius:6px;overflow:hidden;background:var(--bg);position:relative}.dc-s i{position:absolute;inset:0;background:var(--ink);opacity:.45}</style>
    <div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:center"><div><strong>Wallpaper</strong><p class="muted" style="margin:2px 0 0;font-size:14px">A quiet pattern behind the app, in your theme's colours.</p></div><div class="seg" id="dc-str" role="group" aria-label="Wallpaper strength">${Object.entries(STRENGTHS).map(([v, l]) => `<button type="button" data-v="${v}" aria-pressed="${+v === (settings.wallStrength || 8)}">${l}</button>`).join("")}</div></div>
    <div class="dc-grid" id="dc-l">${Object.entries(WALLPAPERS).filter(([k, w]) => !w.xmas || ls.get("xmasOwned", []).includes(k)).map(([k, w]) => `<button class="dc-t" type="button" data-w="${k}" aria-pressed="${(settings.wallpaper || "none") === k}"><span class="dc-s">${w.svg ? `<i style="-webkit-mask:${data(w)} repeat;mask:${data(w)} repeat"></i>` : ""}</span>${esc(w.name)}</button>`).join("")}</div>`;
  const $ = (s) => box.querySelector(s), press = (sel, el) => box.querySelectorAll(sel).forEach((x) => x.setAttribute("aria-pressed", String(x === el)));
  $("#dc-l").onclick = (e) => { const b = e.target.closest("[data-w]"); if (!b) return; settings.wallpaper = b.dataset.w; saveSettings(); press("[data-w]", b); };
  $("#dc-str").onclick = (e) => { const b = e.target.closest("[data-v]"); if (!b) return; settings.wallStrength = +b.dataset.v; saveSettings(); press("#dc-str [data-v]", b); };
}
