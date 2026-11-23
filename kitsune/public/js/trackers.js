// Trackers beyond AniList: link a series to MyAnimeList, Kitsu and MangaUpdates, see their scores,
// and export your shelf in the MyAnimeList list format (which MyAnimeList and Kitsu both import).
import { $, $$, esc, icon, modal, toast, api } from "./util.js";
import { kvGet, kvSet, seriesGroups, allProgress, progressPct } from "./store.js";

export const TRACKERS = {
  mal: { name: "MyAnimeList", short: "MAL", color: "#2e51a2" },
  kitsu: { name: "Kitsu", short: "Kitsu", color: "#f75239" },
  mu: { name: "MangaUpdates", short: "MU", color: "#e98a2e" },
};

export async function getLinks(key) { return (await kvGet("seriesTrackers", {}))[key] || {}; }
async function setLink(key, kind, rec) {
  const all = await kvGet("seriesTrackers", {});
  const cur = { ...(all[key] || {}) };
  if (rec) cur[kind] = rec; else Reflect.deleteProperty(cur, kind);
  kvSet("seriesTrackers", { ...all, [key]: cur });
}

async function getJson(url, opts) {
  const r = await fetch(url, opts);
  if (!r.ok) throw new Error(`${r.status}`);
  return r.json();
}
async function direct(kind, q) {
  if (kind === "mal") {
    const d = await getJson(`https://api.jikan.moe/v4/manga?limit=8&q=${encodeURIComponent(q)}`);
    return d.data.map((m) => ({ id: m.mal_id, title: m.title_english || m.title, url: m.url, cover: m.images?.jpg?.image_url, score: m.score ? `${m.score} / 10` : "", vols: m.volumes || null, year: m.published?.prop?.from?.year || "" }));
  }
  if (kind === "kitsu") {
    const d = await getJson(`https://kitsu.io/api/edge/manga?page[limit]=8&filter[text]=${encodeURIComponent(q)}`);
    return d.data.map((m) => ({ id: m.id, title: m.attributes.canonicalTitle, url: `https://kitsu.app/manga/${m.attributes.slug}`, cover: m.attributes.posterImage?.small, score: m.attributes.averageRating ? `${m.attributes.averageRating}%` : "", vols: m.attributes.volumeCount || null, year: (m.attributes.startDate || "").slice(0, 4) }));
  }
  const d = await getJson("https://api.mangaupdates.com/v1/series/search", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ search: q, perpage: 8 }) });
  return d.results.map(({ record: m }) => ({ id: m.series_id, title: m.title, url: m.url, cover: m.image?.url?.thumb || m.image?.url?.original, score: m.bayesian_rating ? `${m.bayesian_rating} / 10` : "", vols: null, year: m.year || "" }));
}
// A pasted link works too, for when a site's search can't be reached from the browser.
export function parseLink(text) {
  const t = text.trim();
  let m;
  if ((m = t.match(/myanimelist\.net\/manga\/(\d+)/))) return ["mal", { id: Number(m[1]), url: `https://myanimelist.net/manga/${m[1]}` }];
  if ((m = t.match(/kitsu\.(?:app|io)\/manga\/([\w-]+)/))) return ["kitsu", { id: m[1], url: `https://kitsu.app/manga/${m[1]}` }];
  if ((m = t.match(/mangaupdates\.com\/series\/([\w-]+)/))) return ["mu", { id: m[1], url: `https://www.mangaupdates.com/series/${m[1]}` }];
  return null;
}

export function linksHtml(links) {
  return `<div class="trk-row">${Object.entries(TRACKERS).map(([k, t]) => {
    const l = links[k];
    return l ? `<a class="trk-chip on" href="${esc(l.url)}" target="_blank" rel="noopener" style="--trk:${t.color}"><b>${t.short}</b><span>${esc(l.title || "Linked")}</span>${l.score ? `<em>${esc(l.score)}</em>` : ""}</a>`
      : `<button class="trk-chip" type="button" data-trk="${k}" style="--trk:${t.color}"><b>${t.short}</b><span>Link ${t.name}</span></button>`;
  }).join("")}<button class="btn btn-sm btn-ghost" type="button" data-trk="manage">${icon("edit")} Manage</button></div>`;
}

export function wireLinks(root, key, title, redraw) {
  root.addEventListener("click", (e) => {
    const b = e.target.closest("[data-trk]");
    if (b) linkDialog(key, title, b.dataset.trk === "manage" ? "mal" : b.dataset.trk, redraw);
  });
}

export async function linkDialog(key, title, start = "mal", onDone = () => {}) {
  let kind = start;
  const links = await getLinks(key);
  const m = modal({ title: "Link to trackers", wide: true, body: `<div class="trk-dlg">
      <div class="seg" id="trk-tabs">${Object.entries(TRACKERS).map(([k, t]) => `<button type="button" data-k="${k}" aria-pressed="${k === kind}">${t.name}${links[k] ? " ✓" : ""}</button>`).join("")}</div>
      <form class="search" id="trk-f" style="max-width:none;margin-top:12px">${icon("search")}<input class="field" id="trk-q" value="${esc(title)}" aria-label="Search"><button class="btn btn-accent">Search</button></form>
      <p class="hint" style="margin:8px 0 0">Or paste a link from MyAnimeList, Kitsu or MangaUpdates into the box.</p>
      <div id="trk-cur"></div><div class="trk-results" id="trk-res" aria-live="polite"></div></div>` });
  const root = m.root;
  const cur = () => { const l = links[kind]; $("#trk-cur", root).innerHTML = l ? `<p class="status">Linked to <a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.title || l.url)}</a> · <button class="link-btn" type="button" id="trk-un">Unlink</button></p>` : ""; $("#trk-un", root)?.addEventListener("click", async () => { await setLink(key, kind, null); delete links[kind]; cur(); onDone(); toast(`Unlinked from ${TRACKERS[kind].name}.`); }); };
  const run = async () => {
    const q = $("#trk-q", root).value.trim(), res = $("#trk-res", root);
    if (!q) return;
    const pasted = parseLink(q);
    if (pasted) { const [k, rec] = pasted; await setLink(key, k, { ...rec, title }); links[k] = { ...rec, title }; kind = k; tabs(); cur(); onDone(); toast(`Linked to ${TRACKERS[k].name}.`); return; }
    res.innerHTML = `<p class="status">Searching ${TRACKERS[kind].name}…</p>`;
    try {
      const list = await search(kind, q);
      res.innerHTML = list.length ? list.map((r, i) => `<button class="trk-hit" type="button" data-i="${i}">${r.cover ? `<img src="${esc(r.cover)}" alt="" loading="lazy">` : `<span class="trk-noimg"></span>`}<span><strong>${esc(r.title)}</strong><small>${[r.year, r.vols ? r.vols + " volumes" : "", r.score].filter(Boolean).map(esc).join(" · ")}</small></span></button>`).join("") : `<p class="status">Nothing found. Try a shorter title, or paste a link.</p>`;
      $$(".trk-hit", res).forEach((b) => b.onclick = async () => { const r = list[Number(b.dataset.i)]; const rec = { id: r.id, url: r.url, title: r.title, score: r.score, vols: r.vols }; await setLink(key, kind, rec); links[kind] = rec; tabs(); cur(); onDone(); toast(`Linked to ${TRACKERS[kind].name}.`); });
    } catch { res.innerHTML = `<p class="status err">${TRACKERS[kind].name} couldn't be searched from here right now. Open <a href="${kind === "mal" ? "https://myanimelist.net/manga.php?q=" : kind === "kitsu" ? "https://kitsu.app/manga?text=" : "https://www.mangaupdates.com/search.html?search="}${encodeURIComponent(q)}" target="_blank" rel="noopener">its search</a>, copy the series link and paste it above.</p>`; }
  };
  const tabs = () => $$("#trk-tabs button", root).forEach((b) => { b.setAttribute("aria-pressed", String(b.dataset.k === kind)); b.textContent = TRACKERS[b.dataset.k].name + (links[b.dataset.k] ? " ✓" : ""); });
  $("#trk-tabs", root).onclick = (e) => { const b = e.target.closest("[data-k]"); if (!b) return; kind = b.dataset.k; tabs(); cur(); run(); };
  $("#trk-f", root).onsubmit = (e) => { e.preventDefault(); run(); };
  cur(); run();
}

// Your shelf in the MyAnimeList XML format. MyAnimeList (Import list) and Kitsu (Import from MyAnimeList) both read it.
export async function exportMalXml() {
  const all = await kvGet("seriesTrackers", {}), prog = await allProgress();
  const rows = [];
  for (const g of seriesGroups()) {
    const mal = all[g.key]?.mal;
    if (!mal) continue;
    const read = g.items.filter((i) => progressPct(prog[i.id]) >= 100).length;
    const started = g.items.some((i) => progressPct(prog[i.id]) > 0);
    const status = mal.vols && read >= mal.vols ? "Completed" : started ? "Reading" : "Plan to Read";
    rows.push(`  <manga>\n    <manga_mangadb_id>${mal.id}</manga_mangadb_id>\n    <manga_title><![CDATA[${String(mal.title || g.title).replace(/]]>/g, "")}]]></manga_title>\n    <my_read_volumes>${read}</my_read_volumes>\n    <my_read_chapters>0</my_read_chapters>\n    <my_score>0</my_score>\n    <my_status>${status}</my_status>\n    <update_on_import>1</update_on_import>\n  </manga>`);
  }
  if (!rows.length) throw new Error("No series are linked to MyAnimeList yet. Open a series and link it first.");
  const xml = `<?xml version="1.0" encoding="UTF-8" ?>\n<myanimelist>\n  <myinfo><user_export_type>2</user_export_type></myinfo>\n${rows.join("\n")}\n</myanimelist>\n`;
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([xml], { type: "application/xml" }));
  a.download = "kitsune-mangalist.xml";
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 30_000);
  return rows.length;
}

// Search through Kitsune's server first (some trackers block browsers), then straight from the browser.
export async function search(kind, q) {
  try { return (await api(`trackers/${kind}?q=${encodeURIComponent(q)}`)).results; }
  catch { return direct(kind, q); }
}
