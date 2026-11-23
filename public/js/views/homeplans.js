// Home: a small "today's reading plan" card, only when you've made a plan in Library tools.
import { esc } from "../util.js";
import { kvGet, allProgress, getItem } from "../store.js";
import { openItem } from "./common.js";

export async function homePlans(view) {
  const box = view.querySelector("#home-plans"); if (!box) return;
  const plans = (await kvGet("readingPlans", {})) || {}, ids = Object.keys(plans); if (!ids.length) return;
  const P = await allProgress(), now = Date.now();
  const rows = ids.map((id) => { const it = getItem(id); if (!it?.pages) return null; const left = it.pages - (P[id]?.pos != null ? P[id].pos + 1 : 0); if (left <= 0) return null; const days = Math.max(1, Math.ceil((plans[id].by - now) / 864e5)); return { it, left, days, n: Math.ceil(left / days) }; }).filter(Boolean).sort((a, b) => a.days - b.days).slice(0, 3);
  if (!rows.length || !view.contains(box)) return;
  box.innerHTML = `<section class="section"><div class="section-head"><h2 class="h2">Today's plan</h2><a href="#tools/plan">Edit plans</a></div><div style="display:grid;gap:8px">${rows.map((r) => `<div style="display:flex;gap:10px;align-items:center;padding:10px 12px;border:1px solid var(--line);border-radius:12px;background:var(--surface)"><div style="flex:1;min-width:0"><b style="display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(r.it.title)}</b><small class="muted">${r.n} page${r.n === 1 ? "" : "s"} today · ${r.left} left · ${r.days} day${r.days === 1 ? "" : "s"} to go</small></div><button class="btn btn-sm btn-accent" type="button" data-plan="${esc(r.it.id)}">Read</button></div>`).join("")}</div></section>`;
  box.onclick = (e) => { const b = e.target.closest("[data-plan]"); if (b) openItem(getItem(b.dataset.plan)); };
}
