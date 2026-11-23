// Cast notebook: your own who's-who for a series, so you can come back after months and remember everyone.
import { $, esc, toast, modal } from "./util.js";
import { kvGet, kvSet, seriesKey } from "./store.js";
import { gone, ungone } from "./syncgone.js";

export async function castEditor(box, key) {
  const all = (await kvGet("castNotes", {})) || {}, cast = (all[key] ||= {});
  const save = () => { if (!Object.keys(cast).length) delete all[key]; else all[key] = cast; kvSet("castNotes", all); };
  box.innerHTML = `<form data-c="f" style="display:grid;gap:6px"><div style="display:flex;gap:6px;flex-wrap:wrap"><input class="field" data-c="n" required maxlength="60" placeholder="Name" aria-label="Character name" style="flex:1 1 130px"><input class="field" data-c="r" maxlength="60" placeholder="Who they are (rival, mentor…)" aria-label="Who they are" style="flex:2 1 170px"></div><textarea class="field" data-c="t" maxlength="1000" placeholder="What you want to remember. First seen, secrets, theories…" aria-label="Notes" style="min-height:58px"></textarea><div><button class="btn btn-accent btn-sm">Save character</button></div></form><input class="field" data-c="q" placeholder="Search the cast" aria-label="Search the cast" style="width:100%;margin-top:10px"><div data-c="l" style="margin-top:6px"></div>`;
  const q = (c) => box.querySelector(`[data-c="${c}"]`);
  const draw = () => { const s = q("q").value.toLowerCase(), l = Object.entries(cast).filter(([n, x]) => !s || `${n} ${x.role} ${x.text}`.toLowerCase().includes(s)).sort((a, b) => a[0].localeCompare(b[0])); q("l").innerHTML = l.map(([n, x]) => `<div style="padding:8px 0;border-bottom:1px solid var(--line)"><b>${esc(n)}</b>${x.role ? ` <small class="muted">${esc(x.role)}</small>` : ""} <button class="btn btn-sm" type="button" data-edit="${esc(n)}" style="margin-left:6px">Edit</button> <button class="btn btn-sm" type="button" data-del="${esc(n)}">Delete</button>${x.text ? `<div style="white-space:pre-wrap;font-size:14px">${esc(x.text)}</div>` : ""}</div>`).join("") || `<p class="muted">${Object.keys(cast).length ? "No one matches." : "No characters yet."}</p>`; };
  q("f").onsubmit = (e) => { e.preventDefault(); const n = q("n").value.trim(); if (!n) return; ungone("cast", key + ":" + n); cast[n] = { role: q("r").value.trim(), text: q("t").value.trim(), at: Date.now() }; save(); e.target.reset(); draw(); q("n").focus(); };
  q("q").oninput = draw;
  q("l").onclick = (e) => { const ed = e.target.closest("[data-edit]"), d = e.target.closest("[data-del]"); if (ed) { const x = cast[ed.dataset.edit]; q("n").value = ed.dataset.edit; q("r").value = x.role || ""; q("t").value = x.text || ""; q("n").focus(); } else if (d && confirm(`Delete ${d.dataset.del} from your cast notes?`)) { gone("cast", key + ":" + d.dataset.del); delete cast[d.dataset.del]; save(); draw(); toast("Deleted."); } };
  draw();
}
export async function castDialog(item) {
  const m = modal({ title: `Cast: ${item.series || item.title}`, wide: true, body: `<div id="cast-box"></div>` });
  await castEditor($("#cast-box", m.root), seriesKey(item));
}
