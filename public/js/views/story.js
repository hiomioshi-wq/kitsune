// Story games: original branching stories. Your choices, what you're carrying and which endings you've found are saved.
import { $, esc, toast, topModal } from "../util.js";
import { kvGet, kvSet, settings } from "../store.js";
import { setCrumbs } from "../main.js";

export const GAMES = ["the-midwinter-parcel", "the-thirteenth-letter"];
const cache = new Map();
const load = async (id) => { if (!cache.has(id)) { const r = await fetch(`/originals/interactive/${id}.json`); if (!r.ok) throw new Error("That story didn't load. Check your connection and try again."); cache.set(id, await r.json()); } return cache.get(id); };
const allSaves = async () => (await kvGet("gamebooks", {})) || {};
const blank = (g) => ({ node: g.start, flags: [], hist: [], endings: {}, seen: [g.start], taken: [], at: Date.now() });
const put = async (id, s) => { if (settings.incognito) return; const all = await allSaves(); all[id] = { ...s, at: Date.now() }; kvSet("gamebooks", all); };
const allEndings = (g) => Object.values(g.nodes).filter((n) => n.end).map((n) => n.end);
const open = (c, f) => (c.need || []).every((x) => f.includes(x)) && !(c.not || []).some((x) => f.includes(x));
const CSS = `<style>.sg-wrap{max-width:44rem;margin:0 auto}.sg-card{display:block;padding:18px;border:1px solid var(--line);border-radius:14px;background:var(--surface);color:inherit;text-decoration:none}.sg-card:hover{border-color:var(--muted)}.sg-bar{height:6px;border-radius:99px;background:var(--line);overflow:hidden}.sg-bar i{display:block;height:100%;background:var(--accent)}.sg-top{display:flex;gap:6px;flex-wrap:wrap;align-items:center;justify-content:space-between;margin-bottom:12px}.sg-items{display:flex;gap:5px;flex-wrap:wrap;min-height:26px;margin-bottom:14px}.sg-item{font:600 12px system-ui;padding:3px 9px;border-radius:99px;border:1px solid var(--line);background:var(--surface)}.sg-text{font:400 clamp(18px,2.2vw,20px)/1.72 var(--f-serif,Georgia,serif)}.sg-text p{margin:0 0 1em}.sg-text:focus{outline:none}.sg-ch{display:grid;gap:8px;margin-top:18px}.sg-c{display:flex;gap:10px;text-align:left;padding:13px 15px;border-radius:12px;border:1px solid var(--line);background:var(--surface);color:inherit;font:500 16px/1.35 var(--f-body);cursor:pointer}.sg-c:hover,.sg-c:focus-visible{border-color:var(--accent)}.sg-c kbd{font:600 12px var(--f-mono,monospace);opacity:.6;padding-top:3px}.sg-c small{margin-left:auto;opacity:.6;white-space:nowrap;padding-top:2px}.sg-end{margin-top:18px;padding:18px;border-radius:14px;border:1px solid var(--accent);background:var(--accent-soft,var(--surface))}.sg-gal{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:6px;margin-top:10px}.sg-e{padding:9px 11px;border:1px solid var(--line);border-radius:10px;font-size:13px;background:var(--surface)}.sg-e small{display:block;opacity:.65}</style>`;

export async function render(view, _n, params = []) {
  setCrumbs([["Story games", "story"]]);
  if (params[0] && GAMES.includes(params[0])) return play(view, params[0]);
  const saves = await allSaves();
  view.innerHTML = `${CSS}<div class="page-head"><div><p class="eyebrow">Kitsune Originals</p><h1 class="h1">Story games</h1><p class="muted" style="margin:6px 0 0">Stories where you decide what happens. Every ending is worth finding.</p></div></div><div id="sg-l" style="display:grid;gap:12px;margin-top:16px;max-width:44rem"><p class="muted">Loading…</p></div><p style="max-width:44rem;margin-top:14px"><a class="btn" href="#vn">Play every story as a visual novel</a></p>`;
  try {
    const list = await Promise.all(GAMES.map(load));
    $("#sg-l", view).innerHTML = list.map((g) => { const s = saves[g.id], e = allEndings(g), got = Object.keys(s?.endings || {}).length, pct = Math.round(((s?.seen?.length || 0) / Object.keys(g.nodes).length) * 100); return `<a class="sg-card" href="#story/${esc(g.id)}"><small class="muted">${esc(g.byline)} · about ${g.minutes} minutes a playthrough</small><h2 class="h2" style="margin:4px 0 6px">${esc(g.title)}</h2><p style="margin:0 0 12px">${esc(g.blurb)}</p><div class="sg-bar" aria-hidden="true"><i style="width:${pct}%"></i></div><small class="muted">${got} of ${e.length} endings found · ${pct}% of scenes seen${s && !g.nodes[s.node]?.end && s.hist?.length ? " · game in progress" : ""}</small></a>`; }).join("");
  } catch (e) { $("#sg-l", view).innerHTML = `<p class="muted">${esc(e.message)}</p>`; }
}

async function play(view, id) {
  view.innerHTML = `${CSS}<div class="sg-wrap"><p class="muted">Opening the story…</p></div>`;
  let g; try { g = await load(id); } catch (e) { view.innerHTML = `<p class="muted">${esc(e.message)}</p>`; return; }
  setCrumbs([["Story games", "story"], [g.title, "story/" + id]]);
  let s = (await allSaves())[id] || blank(g); if (!g.nodes[s.node]) s = { ...blank(g), endings: s.endings || {} };
  const box = view.querySelector(".sg-wrap");
  const stopVoice = () => { try { speechSynthesis.cancel(); } catch {} };
  const say = () => { const n = g.nodes[s.node]; try { if (speechSynthesis.speaking) return stopVoice(); const u = new SpeechSynthesisUtterance(n.text.join(" ") + (n.choices ? " Your choices: " + n.choices.filter((c) => open(c, s.flags)).map((c) => c.t).join(". ") : "")); speechSynthesis.speak(u); } catch { toast("Read aloud isn't available here."); } };
  const gallery = () => `<h3 class="h3" style="margin-top:18px">Endings (${Object.keys(s.endings).length} of ${allEndings(g).length})</h3><div class="sg-gal">${allEndings(g).map((e) => s.endings[e.id] ? `<div class="sg-e"><b>${esc(e.title)}</b><small>${esc(e.kind)}</small></div>` : `<div class="sg-e" style="opacity:.55"><b>???</b><small>Not found yet</small></div>`).join("")}</div>`;
  const draw = (focus) => {
    const n = g.nodes[s.node], here = (n.choices || []).map((c, i) => ({ c, i })).filter((x) => open(x.c, s.flags)), inv = s.flags.filter((f) => g.items[f]);
    const route = n.end ? [...s.hist.map((h) => h.pick).filter(Boolean)] : [];
    box.innerHTML = `<div class="sg-top"><a class="btn btn-sm" href="#story">All stories</a><strong style="flex:1;text-align:center;min-width:120px">${esc(g.title)}</strong><span style="display:flex;gap:4px"><button class="btn btn-sm" type="button" id="sg-say" aria-label="Read this scene aloud">Read aloud</button><button class="btn btn-sm" type="button" id="sg-back" ${s.hist.length ? "" : "disabled"}>Undo</button><button class="btn btn-sm" type="button" id="sg-new">Restart</button></span></div>
      <div class="sg-items" aria-label="What you're carrying">${inv.map((f) => `<span class="sg-item">${esc(g.items[f])}</span>`).join("") || `<small class="muted">${esc(g.emptyBag || "Carrying only the letter")}</small>`}</div>
      <article class="sg-text" id="sg-t" tabindex="-1">${n.text.map((p) => `<p>${esc(p)}</p>`).join("")}</article>
      ${n.end ? `<div class="sg-end"><small>${esc(n.end.kind)} · The End</small><h2 class="h2" style="margin:2px 0 8px">${esc(n.end.title)}</h2><div style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn btn-accent" type="button" id="sg-again">Play again</button><button class="btn" type="button" id="sg-undo2">Go back a choice</button></div>${route.length ? `<details style="margin-top:10px"><summary>The road you took</summary><ol style="margin:6px 0 0;padding-left:20px;font-size:14px">${route.map((r) => `<li>${esc(r)}</li>`).join("")}</ol></details>` : ""}${gallery()}</div>` : `<div class="sg-ch">${here.map(({ c, i }, k) => `<button class="sg-c" type="button" data-i="${i}"><kbd>${k + 1}</kbd><span>${esc(c.t)}</span>${s.taken.includes(`${s.node}>${i}`) ? "<small>tried</small>" : ""}</button>`).join("")}</div>`}`;
    if (focus) { $("#sg-t", box).focus({ preventScroll: true }); box.scrollIntoView({ block: "start" }); window.scrollBy(0, -70); }
  };
  const choose = (i) => {
    const n = g.nodes[s.node], c = n.choices?.[i]; if (!c || !open(c, s.flags)) return; stopVoice();
    s.hist.push({ node: s.node, flags: s.flags, pick: c.t }); s.taken = [...new Set([...s.taken, `${s.node}>${i}`])];
    s.flags = [...new Set([...s.flags.filter((x) => !(c.clear || []).includes(x)), ...(c.set || [])])]; s.node = c.to; s.seen = [...new Set([...s.seen, c.to])];
    const m = g.nodes[c.to]; if (m.end) { const fresh = !s.endings[m.end.id]; s.endings[m.end.id] = Date.now(); document.dispatchEvent(new Event("kitsune:done")); if (fresh) toast(`New ending found: ${m.end.title}`); } else document.dispatchEvent(new Event("kitsune:turn"));
    put(id, s); draw(true);
  };
  const undo = () => { const h = s.hist.pop(); if (!h) return; stopVoice(); s.node = h.node; s.flags = h.flags; put(id, s); draw(true); };
  const restart = () => { stopVoice(); s = { ...s, node: g.start, flags: [], hist: [] }; put(id, s); draw(true); };
  box.onclick = (e) => { const c = e.target.closest("[data-i]"); if (c) return choose(+c.dataset.i); const t = e.target.closest("button")?.id; if (t === "sg-back" || t === "sg-undo2") undo(); else if (t === "sg-again") restart(); else if (t === "sg-say") say(); else if (t === "sg-new") { if (s.hist.length && !g.nodes[s.node].end && !confirm("Start this story again? The endings you've found are kept.")) return; restart(); } };
  const keys = (e) => { if (e.metaKey || e.ctrlKey || e.altKey || topModal() || e.target.matches?.("input,textarea,select")) return; if (/^[1-9]$/.test(e.key)) { e.preventDefault(); e.stopPropagation(); /* in a story, numbers pick a choice instead of jumping to another page */ box.querySelectorAll("[data-i]")[+e.key - 1]?.click(); } else if (e.key === "u" || e.key === "U") undo(); };
  document.addEventListener("keydown", keys, true);
  draw(false); put(id, s);
  return () => { document.removeEventListener("keydown", keys, true); stopVoice(); };
}
