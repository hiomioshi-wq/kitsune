// Library tools, part three: cast notebook, reading timeline, For you, tag manager.
import { $, esc, toast } from "../util.js";
import { lib, kvGet, getItem, saveItem, seriesKey } from "../store.js";
import { row, none, items } from "./tools.js";
import { castEditor } from "../cast.js";

export const TOOLS3 = [
  ["cast", "Cast notebook", "Your own who's-who for each series."], ["timeline", "Reading timeline", "Everything you've finished, month by month."],
  ["foryou", "For you", "Recommendations based on what you rated highly."], ["tagman", "Tag manager", "Rename, merge or remove tags everywhere."],
];

export const panels3 = {
  async cast(b) {
    const seen = new Map(); for (const i of items()) { const k = seriesKey(i); if (!seen.has(k)) seen.set(k, i.series || i.title); }
    if (!seen.size) { b.innerHTML = none("Add something to your shelf first."); return; }
    const notes = (await kvGet("castNotes", {})) || {};
    b.innerHTML = `<select class="field" id="cn-s" style="width:100%" aria-label="Series">${[...seen].map(([k, t]) => `<option value="${esc(k)}">${esc(t)}${notes[k] ? ` (${Object.keys(notes[k]).length})` : ""}</option>`).join("")}</select><div id="cn-b" style="margin-top:12px"></div>`;
    const go = () => castEditor($("#cn-b", b), $("#cn-s", b).value); $("#cn-s", b).onchange = go; await go();
  },
  async timeline(b) {
    const st = (await kvGet("stats", { finished: [] })) || {}, l = (st.finished || []).filter((f) => f.at).sort((x, y) => y.at - x.at);
    if (!l.length) { b.innerHTML = none("Finish something and it starts your timeline."); return; }
    const by = new Map(); for (const f of l) { const d = new Date(f.at * 1000), k = d.toLocaleDateString(undefined, { month: "long", year: "numeric" }); (by.get(k) || by.set(k, []).get(k)).push({ ...f, d }); }
    b.innerHTML = `<p><b>${l.length}</b> finished</p>` + [...by].map(([m, x]) => `<h3 class="h3" style="margin-top:16px">${esc(m)} <small class="muted">${x.length}</small></h3>${x.map((f) => { const it = getItem(f.id), when = f.d.toLocaleDateString(undefined, { month: "short", day: "numeric" }); return it ? row(it, `${when}${it.rating ? " · " + "★".repeat(it.rating) : ""}`) : `<p class="muted">${when} · A title no longer on your shelf</p>`; }).join("")}`).join("");
  },
  async foryou(b) {
    const seeds = lib.items.filter((i) => i.link?.anilistId).sort((x, y) => (y.rating || 0) - (x.rating || 0)), ids = [...new Set(seeds.map((i) => +i.link.anilistId))].slice(0, 12);
    if (!ids.length) { b.innerHTML = none("Link a series on your shelf to AniList and rate it. Recommendations will come from those."); return; }
    b.innerHTML = `<p class="muted">Asking AniList…</p>`;
    try {
      const h = btoa(JSON.stringify({ "content-type": "application/json", accept: "application/json" })), r = await fetch("/api/browse/raw?url=" + encodeURIComponent("https://graphql.anilist.co"), { method: "POST", headers: { "content-type": "application/json", "x-kb-req-headers": h }, body: JSON.stringify({ query: `query($ids:[Int]){Page(perPage:12){media(id_in:$ids){id title{english romaji} recommendations(perPage:12,sort:RATING_DESC){nodes{rating mediaRecommendation{id type isAdult title{english romaji} coverImage{large} averageScore genres}}}}}}`, variables: { ids } }) }); if (!r.ok) throw 0;
      const j = await r.json(), list = (j.data ?? JSON.parse(j.text || "{}").data)?.Page?.media || [], have = new Set(ids), wt = Object.fromEntries(seeds.map((i) => [+i.link.anilistId, 1 + (i.rating || 0)])), score = new Map(), name = (x) => x.title?.english || x.title?.romaji || "";
      for (const s of list) for (const n of s.recommendations?.nodes || []) { const x = n.mediaRecommendation; if (!x || x.isAdult || x.type !== "MANGA" || have.has(x.id)) continue; const c = score.get(x.id) || { x, pts: 0, why: new Set() }; c.pts += (wt[s.id] || 1) * Math.max(1, Math.log2(2 + Math.max(0, n.rating || 0))); c.why.add(name(s)); score.set(x.id, c); }
      const top = [...score.values()].sort((p, q) => q.pts - p.pts).slice(0, 24);
      b.innerHTML = top.map(({ x, why }) => `<div class="tl-row"><a class="tl-cover" href="#manga/${x.id}" aria-label="${esc(name(x))}"><img src="${esc(x.coverImage?.large || "")}" alt="" loading="lazy" referrerpolicy="no-referrer"></a><div class="tl-main"><a href="#manga/${x.id}" style="font-weight:600;color:inherit;text-decoration:none">${esc(name(x))}</a><small class="muted">${x.averageScore ? x.averageScore + "% · " : ""}${esc((x.genres || []).slice(0, 3).join(", "))}</small><small class="muted">Because you have ${esc([...why].slice(0, 2).join(" and "))}</small></div></div>`).join("") || none("AniList had no new suggestions for these series.");
    } catch { b.innerHTML = none("AniList didn't answer. Try again in a minute."); }
  },
  tagman(b) {
    const draw = () => { const m = {}; for (const i of items()) for (const t of i.tags || []) m[t] = (m[t] || 0) + 1; const l = Object.entries(m).sort((x, y) => y[1] - x[1] || x[0].localeCompare(y[0])); b.innerHTML = l.map(([t, n]) => `<div class="tl-row"><div class="tl-main"><b>${esc(t)}</b><small class="muted">${n} title${n === 1 ? "" : "s"}</small></div><button class="btn btn-sm" type="button" data-ren="${esc(t)}">Rename or merge</button><button class="btn btn-sm" type="button" data-rem="${esc(t)}">Remove</button></div>`).join("") || none("No tags yet. Add some with Bulk tags."); };
    const change = async (from, to) => { let n = 0; for (const i of items()) { if (!(i.tags || []).includes(from)) continue; i.tags = [...new Set(i.tags.map((t) => (t === from ? to : t)).filter(Boolean))]; await saveItem(i); n++; } return n; };
    b.onclick = async (e) => { const r = e.target.closest("[data-ren]"), d = e.target.closest("[data-rem]"); if (r) { const to = prompt(`Rename “${r.dataset.ren}” to? (Use an existing tag to merge them.)`, r.dataset.ren)?.trim().toLowerCase(); if (!to || to === r.dataset.ren) return; const n = await change(r.dataset.ren, to); toast(`Updated ${n} title${n === 1 ? "" : "s"}.`); draw(); } else if (d) { if (!confirm(`Remove the tag “${d.dataset.rem}” from every title? The titles stay.`)) return; const n = await change(d.dataset.rem, ""); toast(`Removed from ${n} title${n === 1 ? "" : "s"}.`); draw(); } };
    draw();
  },
};
