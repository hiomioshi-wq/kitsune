// Search inside your books: every word of the texts saved on this device (Project Gutenberg books you've opened,
// Wikisource works, text files, scripts, saved wiki articles and EPUBs), not just their titles.
import { $, $$, esc, icon, modal, debounce, plural } from "./util.js";
import { lib, getItem } from "./store.js";

const strip = (html) => html.replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"');

const cache = new Map();
async function textOf(it) {
  if (cache.has(it.id)) return cache.get(it.id);
  const s = it.source || {};
  let t = "";
  if (s.cachedText) t = s.cachedText;
  else if (typeof s.text === "string") t = s.text;
  else if (s.cachedChapters) t = s.cachedChapters.map((c) => strip(c.html || "")).join("\n");
  else if (s.cachedHtml) t = strip(s.cachedHtml);
  else if (s.kind === "epub" || s.epubBlob || (s.blob && /epub/.test(s.blob.type || ""))) {
    try {
      const { openEpub, epubChapters } = await import("./epub.js");
      const ch = await epubChapters(await openEpub(s.epubBlob || s.blob), async () => "");
      t = (ch || []).map((c) => strip(c.html || "")).join("\n");
    } catch { t = ""; }
  } else if (s.blob && /^text\//.test(s.blob.type || "")) t = await s.blob.text();
  cache.set(it.id, t);
  return t;
}

export async function search(q, { limitPerBook = 3, onBook } = {}) {
  const needle = q.trim().toLowerCase();
  if (needle.length < 3) return [];
  const books = lib.items.filter((i) => i.type === "book");
  const out = [];
  for (const it of books) {
    const t = await textOf(it);
    if (!t) continue;
    const low = t.toLowerCase();
    let at = low.indexOf(needle), n = 0;
    const hits = [];
    while (at >= 0) {
      n++;
      if (hits.length < limitPerBook) {
        const a = Math.max(0, at - 70), b = Math.min(t.length, at + needle.length + 90);
        hits.push({ before: (a ? "…" : "") + t.slice(a, at).replace(/\s+/g, " "), match: t.slice(at, at + needle.length), after: t.slice(at + needle.length, b).replace(/\s+/g, " ") + (b < t.length ? "…" : "") });
      }
      at = low.indexOf(needle, at + needle.length);
    }
    if (n) { out.push({ it, n, hits }); onBook?.(out); }
  }
  return out.sort((a, b) => b.n - a.n);
}

export function openFullText(initial = "") {
  const searchable = lib.items.filter((i) => i.type === "book").length;
  const m = modal({ title: "Search inside your books", wide: true, body: `
    <form class="search" id="ft-f" style="max-width:none">${icon("search")}<input class="field" id="ft-q" type="search" placeholder="A word, a name, a line you half remember" value="${esc(initial)}" autocomplete="off" aria-label="Search inside your books"></form>
    <p class="hint" style="margin:8px 0 0">Searches the full text of ${plural(searchable, "book")} on this device. Project Gutenberg books are searchable once you've opened them, and so are comics whose pages you've read with Page text in the reader.</p>
    <p style="margin:8px 0 0"><button class="btn btn-sm" type="button" id="ft-index">Read the text of all my comics</button> <span class="hint" id="ft-ist"></span></p>
    <div class="ft-results" id="ft-res" aria-live="polite"></div>` });
  let job = null;
  $("#ft-index", m.root).onclick = async (e) => {
    const btn = e.currentTarget, st = $("#ft-ist", m.root);
    if (job) { job.stop = true; return; }
    job = { stop: false }; btn.textContent = "Stop reading";
    try {
      const { indexLibrary } = await import("./pagetext.js");
      const r = await indexLibrary({ job, onProgress: (p) => (st.textContent = `${p.title}: page ${p.page} of ${p.of} · ${p.pages} read so far`) });
      st.textContent = r.stopped ? `Stopped after ${r.pages} pages. They’re saved.` : `Done: ${r.pages} pages read${r.skipped ? `, ${r.skipped} comics skipped (pages from other sites can’t be read)` : ""}.`;
    } catch (err) { st.textContent = err.message; }
    job = null; btn.textContent = "Read the text of all my comics"; if (input.value.trim()) input.dispatchEvent(new Event("input"));
  };
  m.root.addEventListener("close", () => job && (job.stop = true));
  const res = $("#ft-res", m.root), input = $("#ft-q", m.root);
  let seq = 0;
  const run = async () => {
    const q = input.value, my = ++seq;
    if (q.trim().length < 3) { res.innerHTML = q.trim() ? `<p class="status">Type at least three letters.</p>` : ""; return; }
    res.innerHTML = `<p class="status">Searching…</p>`;
    const [list, comics] = await Promise.all([search(q), import("./pagetext.js").then((m) => m.searchComics(q)).catch(() => [])]);
    if (my !== seq) return;
    const total = list.reduce((a, r) => a + r.n, 0) + comics.reduce((a, r) => a + r.n, 0);
    const comicHtml = comics.map((r) => `<div class="ft-book"><div class="ft-head"><strong>${esc(r.it.title)}</strong><span class="muted">comic · ${plural(r.n, "match", "matches")}</span></div>${r.hits.map((h) => `<button class="ft-hit" type="button" data-id="${esc(r.it.id)}" data-page="${h.page}">p. ${h.page + 1} · ${esc(h.before)}<mark>${esc(h.match)}</mark>${esc(h.after)}</button>`).join("")}</div>`).join("");
    res.innerHTML = list.length || comics.length ? `<p class="status">${plural(total, "match", "matches")} in ${plural(list.length + comics.length, "book")}</p>` + list.map((r) => `
      <div class="ft-book"><div class="ft-head"><strong>${esc(r.it.title)}</strong><span class="muted">${esc(r.it.author || "")} · ${plural(r.n, "match", "matches")}</span></div>
        ${r.hits.map((h) => `<button class="ft-hit" type="button" data-id="${esc(r.it.id)}">${esc(h.before)}<mark>${esc(h.match)}</mark>${esc(h.after)}</button>`).join("")}</div>`).join("") + comicHtml
      : `<p class="status">No book on this device contains “${esc(q.trim())}”.</p>`;
  };
  input.addEventListener("input", debounce(run, 280));
  $("#ft-f", m.root).onsubmit = (e) => { e.preventDefault(); run(); };
  res.addEventListener("click", async (e) => {
    const b = e.target.closest("[data-id]"); if (!b) return;
    const it = getItem(b.dataset.id); if (!it) return;
    m.close();
    (await import("./views/common.js")).openItem(it, b.dataset.page != null ? { from: Number(b.dataset.page) } : { find: input.value.trim() });
  });
  setTimeout(() => input.focus(), 30);
  if (initial) run();
}
void $$;
