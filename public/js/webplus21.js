// Kitsune Browser, v130:
//  - "Continue reading" on the start page: long pages you left part-way, with how far you got
//  - a magnifier for pictures: hover a picture to see it up close, at its full resolution
import { esc, toast } from "./util.js";
import { kvGet } from "./store.js";

export async function continueReading(container, go) {
  if (!container || container.querySelector("#kb-cont")) return;
  const [scroll, hist] = await Promise.all([kvGet("webScroll", {}), kvGet("webHistory", [])]);
  const titles = new Map((hist || []).map((h) => [h.url.split("#")[0], h.title]));
  const seen = new Set(), rows = Object.entries(scroll || {}).map(([k, v]) => ({ mode: k.slice(0, 1), url: k.slice(2), ...v }))
    .filter((x) => x.p > 0.08 && x.p < 0.92 && x.y > 900 && Date.now() - x.t < 30 * 864e5 && /^https?:/.test(x.url))
    .sort((a, b) => b.t - a.t).filter((x) => !seen.has(x.url) && seen.add(x.url)).slice(0, 6);
  if (!rows.length) return;
  const host = (u) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return ""; } };
  const sec = document.createElement("section"); sec.id = "kb-cont"; sec.style.cssText = "margin:0 0 22px";
  sec.innerHTML = `<h3 style="margin:0 0 10px;font-size:15px">Continue reading</h3><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:10px">${rows.map((x) => `<button type="button" data-u="${esc(x.url)}" style="text-align:left;border:1px solid var(--line,#3a3e66);border-radius:12px;padding:10px 12px;background:var(--surface,transparent);color:inherit;cursor:pointer;font:inherit"><b style="display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:14px">${esc(titles.get(x.url) || host(x.url))}</b><small style="opacity:.65">${esc(host(x.url))} · ${Math.round(x.p * 100)}% read${x.mode === "r" ? " · reader" : ""}</small><span style="display:block;height:4px;border-radius:2px;background:rgba(127,127,160,.25);margin-top:8px;overflow:hidden"><i style="display:block;height:100%;width:${Math.round(x.p * 100)}%;background:var(--accent,#f2a03f)"></i></span></button>`).join("")}</div>`;
  sec.onclick = (e) => { const b = e.target.closest("[data-u]"); if (b) go(b.dataset.u); };
  const start = container.querySelector(".kb-start") || container; const first = start.querySelector("form, .kb-dial, section");
  first?.nextSibling ? start.insertBefore(sec, first.nextSibling) : start.prepend(sec);
}

// ---------- picture magnifier ----------
const magOn = () => localStorage.getItem("kitsune.webMagnifier") === "1";
export function magnifier(root) {
  if (!root?.addEventListener || root.__kbMag) return; root.__kbMag = true;
  let lens = null, cur = null;
  const hide = () => { if (lens) lens.style.display = "none"; cur = null; };
  root.addEventListener("mousemove", (e) => {
    if (!magOn()) return hide();
    const img = e.target.closest?.("img"); if (!img || !img.naturalWidth || img.naturalWidth < img.clientWidth * 1.15 && img.clientWidth > 300) return hide();
    if (!lens) { lens = document.createElement("div"); lens.style.cssText = "position:fixed;z-index:99;width:200px;height:200px;border-radius:50%;border:3px solid #fff;box-shadow:0 8px 30px rgba(0,0,0,.45);pointer-events:none;background-repeat:no-repeat;background-color:#fff"; (root.querySelector(".kb-html") || root).append(lens); }
    const r = img.getBoundingClientRect(), z = Math.max(2, img.naturalWidth / r.width * 1.1), fx = (e.clientX - r.left) / r.width, fy = (e.clientY - r.top) / r.height;
    if (cur !== img) { lens.style.backgroundImage = `url("${(img.currentSrc || img.src).replace(/"/g, "%22")}")`; cur = img; }
    lens.style.backgroundSize = `${r.width * z}px ${r.height * z}px`; lens.style.backgroundPosition = `${-(fx * r.width * z - 100)}px ${-(fy * r.height * z - 100)}px`;
    lens.style.left = e.clientX - 100 + "px"; lens.style.top = e.clientY - 100 + "px"; lens.style.display = "block";
  }, { passive: true });
  root.addEventListener("mouseleave", hide, { passive: true });
  root.addEventListener("scroll", hide, { passive: true, capture: true });
}

export function items({ root }) {
  return [{ label: magOn() ? "Picture magnifier: on (turn off)" : "Picture magnifier (hover to zoom)", icon: "zoom", run: () => { try { magOn() ? localStorage.removeItem("kitsune.webMagnifier") : localStorage.setItem("kitsune.webMagnifier", "1"); } catch {} magnifier(root()); toast(magOn() ? "Hover a picture to see it up close." : "Picture magnifier off."); } }];
}
