// Book reader comfort: a searchable quick menu (K), a chapter map (V), this book's highlights sheet (H),
// a preview and bookmark/highlight marks on the position slider.
import { $, esc, toast, modal, fmtMinutes } from "../util.js";

const chapters = (c) => {
  const toc = (c.toc() || []).filter((x) => Number.isFinite(x.p)).sort((a, b) => a.p - b.p), cum = c.cum(), total = c.total();
  return toc.map((t, k) => { const end = toc[k + 1]?.p ?? c.blocks().length, words = Math.max(0, (toc[k + 1] ? cum[end] || total : total) - (cum[t.p] || 0)); return { ...t, end, words }; });
};
const labelAt = (c, p) => [...(c.toc() || [])].filter((x) => Number.isFinite(x.p) && x.p <= p).sort((a, b) => b.p - a.p)[0]?.label || "";

export function quickMenu(c) {
  const list = c.actions();
  const m = modal({ title: "Quick menu", body: `<input class="field" type="text" id="bq-q" placeholder="What do you want to do?" aria-label="Search book actions" style="width:100%"><div id="bq-l" role="listbox" aria-label="Book actions" style="display:grid;gap:2px;margin-top:8px;max-height:52vh;overflow:auto"></div>` });
  const q = $("#bq-q", m.root), l = $("#bq-l", m.root); let at = 0, shown = [];
  const draw = () => { const s = q.value.toLowerCase().trim(); shown = list.filter((x) => !s || x[0].toLowerCase().includes(s)); at = Math.min(at, Math.max(0, shown.length - 1)); l.innerHTML = shown.map((x, k) => `<button type="button" role="option" aria-selected="${k === at}" data-i="${k}" style="all:unset;box-sizing:border-box;cursor:pointer;display:flex;justify-content:space-between;gap:10px;padding:8px 10px;border-radius:8px;${k === at ? "background:rgba(127,127,160,.22)" : ""}"><span>${esc(x[0])}</span>${x[1] ? `<kbd style="font:12px var(--f-mono,monospace);opacity:.7">${esc(x[1])}</kbd>` : ""}</button>`).join("") || `<p class="muted">Nothing matches.</p>`; l.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: "nearest" }); };
  const run = (x) => { if (!x) return; m.close(); x[2](); };
  q.oninput = () => { at = 0; draw(); };
  q.addEventListener("keydown", (e) => { if (e.key === "ArrowDown") { e.preventDefault(); at = Math.min(shown.length - 1, at + 1); draw(); } else if (e.key === "ArrowUp") { e.preventDefault(); at = Math.max(0, at - 1); draw(); } else if (e.key === "Enter") { e.preventDefault(); run(shown[at]); } });
  l.onclick = (e) => { const b = e.target.closest("[data-i]"); if (b) run(shown[+b.dataset.i]); };
  draw();
}

export function chapterMap(c) {
  const ch = chapters(c); if (!ch.length) return toast("This book has no chapters Kitsune could find.");
  const pos = c.pos(), max = Math.max(...ch.map((x) => x.words), 1), hl = c.hls() || [], wpm = c.wpm();
  const m = modal({ title: "Chapter map", wide: true, body: `<div style="display:grid;gap:3px">${ch.map((x) => { const here = pos >= x.p && pos < x.end, done = pos >= x.end, inside = here ? Math.min(100, Math.round((((c.cum()[pos] || 0) - (c.cum()[x.p] || 0)) / Math.max(1, x.words)) * 100)) : done ? 100 : 0, n = hl.filter((h) => h.p >= x.p && h.p < x.end).length; return `<button type="button" data-p="${x.p}" ${here ? 'aria-current="true"' : ""} style="all:unset;box-sizing:border-box;cursor:pointer;display:grid;gap:3px;padding:7px 9px;border-radius:8px;${here ? "background:rgba(127,127,160,.2)" : ""}"><span style="display:flex;justify-content:space-between;gap:10px"><span style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;${done ? "opacity:.6" : ""}${here ? "font-weight:700" : ""}">${done ? "✓ " : ""}${esc(x.label || "Chapter")}</span><small class="muted" style="white-space:nowrap">${n ? `${n} highlight${n > 1 ? "s" : ""} · ` : ""}${x.words ? fmtMinutes((x.words / wpm) * 60) : ""}</small></span><span style="display:block;height:5px;border-radius:99px;background:rgba(127,127,160,.2);width:${Math.max(4, (x.words / max) * 100)}%;overflow:hidden"><span style="display:block;height:100%;width:${inside}%;background:var(--accent,#e0702f)"></span></span></button>`; }).join("")}</div>` });
  m.root.addEventListener("click", (e) => { const b = e.target.closest("[data-p]"); if (b) { m.close(); c.goTo(+b.dataset.p); } });
  m.root.querySelector('[aria-current="true"]')?.scrollIntoView({ block: "center" });
}

export function highlightsSheet(c) {
  const it = c.item(), l = [...(c.hls() || [])].sort((a, b) => a.p - b.p); if (!l.length) return toast("Select some text and highlight it first.");
  const groups = []; for (const h of l) { const t = labelAt(c, h.p) || "Highlights"; if (groups.at(-1)?.t !== t) groups.push({ t, l: [] }); groups.at(-1).l.push(h); }
  const md = () => `# ${it.title}${it.author ? `\n\n${it.author}` : ""}\n\n` + groups.map((g) => `## ${g.t}\n\n` + g.l.map((h) => `> ${h.text.replace(/\n+/g, " ")}${h.note ? `\n\n${h.note}` : ""}`).join("\n\n")).join("\n\n") + "\n";
  const m = modal({ title: `Highlights (${l.length})`, wide: true, body: groups.map((g) => `<h3 class="h3" style="margin-top:12px">${esc(g.t)}</h3>${g.l.map((h) => `<button type="button" data-p="${h.p}" style="all:unset;box-sizing:border-box;cursor:pointer;display:block;width:100%;padding:7px 0;border-bottom:1px solid var(--line)"><span style="font-style:italic">${esc(h.text)}</span>${h.note ? `<br><small class="muted">${esc(h.note)}</small>` : ""}</button>`).join("")}`).join(""), actions: `<button class="btn" type="button" id="hs-c">Copy</button><button class="btn btn-accent" type="button" id="hs-s">Save as Markdown</button>` });
  m.root.addEventListener("click", (e) => { const b = e.target.closest("[data-p]"); if (b) { m.close(); c.goTo(+b.dataset.p); } });
  $("#hs-c", m.root).onclick = () => navigator.clipboard.writeText(md()).then(() => toast("Copied."), () => toast("Couldn't copy here. Save it instead."));
  $("#hs-s", m.root).onclick = () => { const a = document.createElement("a"), u = URL.createObjectURL(new Blob([md()], { type: "text/markdown" })); a.href = u; a.download = `${String(it.title || "book").replace(/[^\w\s-]/g, "").trim().slice(0, 50)} highlights.md`; a.click(); setTimeout(() => URL.revokeObjectURL(u), 4000); toast("Saved."); };
}

export function attach(c) {
  const s = $("#b-scrub"); if (!s || s.parentElement.dataset.bkWrap) return { ticks() {} };
  const wrap = document.createElement("div"); wrap.dataset.bkWrap = "1"; wrap.style.cssText = "position:relative;flex:1;min-width:60px;display:flex;align-items:center"; s.before(wrap); wrap.append(s); s.style.width = "100%";
  const marks = document.createElement("div"); marks.setAttribute("aria-hidden", "true"); marks.style.cssText = "position:absolute;left:8px;right:8px;top:0;height:5px;pointer-events:none"; wrap.append(marks);
  const tip = document.createElement("div"); tip.hidden = true; tip.style.cssText = "position:absolute;bottom:28px;width:min(280px,80vw);transform:translateX(-50%);background:#1c1d33;color:#fff;border:1px solid #3a3e66;border-radius:8px;padding:7px 9px;pointer-events:none;z-index:9;font:12px/1.35 system-ui;text-align:left"; wrap.append(tip);
  let sig = "";
  const frac = (p) => (c.cum()[p] || 0) / Math.max(1, c.total());
  const ticks = () => { const m = c.marks() || [], h = c.hls() || [], k = `${m.map((x) => x.pos)}|${h.map((x) => x.p)}|${c.total()}`; if (k === sig) return; sig = k; marks.innerHTML = [...m.map((x) => [x.pos, "#e0702f"]), ...h.map((x) => [x.p, "#d9a441"])].map(([p, col]) => `<i style="position:absolute;left:${(frac(p) * 100).toFixed(2)}%;width:3px;height:5px;border-radius:2px;margin-left:-1px;background:${col}"></i>`).join(""); };
  const blockAt = (f) => { const cum = c.cum(), target = f * c.total(); let lo = 0, hi = cum.length - 1; while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (cum[mid] <= target) lo = mid; else hi = mid - 1; } return lo; };
  s.addEventListener("pointermove", (e) => { if (e.pointerType === "touch" && !e.buttons) return; const r = s.getBoundingClientRect(), f = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)), p = blockAt(f), ch = labelAt(c, p), snip = (c.blocks()[p]?.textContent || "").trim().slice(0, 90); tip.hidden = false; tip.style.left = Math.max(Math.min(140, wrap.clientWidth / 2), Math.min(wrap.clientWidth - Math.min(140, wrap.clientWidth / 2), e.clientX - r.left)) + "px"; tip.innerHTML = `<b>${Math.round(f * 100)}%${ch ? " · " + esc(ch) : ""}</b>${c.spoilerSafe(p) ? "" : `<br><span style="opacity:.8">${esc(snip)}…</span>`}`; });
  s.addEventListener("pointerleave", () => (tip.hidden = true)); s.addEventListener("pointerup", () => setTimeout(() => (tip.hidden = true), 500)); s.addEventListener("pointercancel", () => (tip.hidden = true));
  ticks(); return { ticks };
}
