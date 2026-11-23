// Kitsune Browser, v103: every match with context, search the selection elsewhere, paste and go,
// bookmark all open tabs, and keys for moving between headings.
import { $, esc, toast, modal, plural } from "./util.js";
import { kvGet, kvSet } from "./store.js";

const ENG = [
  ["Web (default engine)", null], ["DuckDuckGo", "https://duckduckgo.com/html/?q={q}"], ["Wikipedia", "https://en.wikipedia.org/w/index.php?search={q}"], ["Wiktionary", "https://en.wiktionary.org/w/index.php?search={q}"],
  ["Internet Archive", "https://archive.org/search?query={q}"], ["Standard Ebooks", "https://standardebooks.org/ebooks?query={q}"], ["Project Gutenberg", "https://www.gutenberg.org/ebooks/search/?query={q}"],
  ["Wikisource", "https://en.wikisource.org/w/index.php?search={q}"], ["OpenStreetMap", "https://www.openstreetmap.org/search?query={q}"], ["Hacker News (Algolia)", "https://hn.algolia.com/?q={q}"], ["Open Library", "https://openlibrary.org/search?q={q}"],
];

export function items(c) {
  const { T, root, scroller, host, B, go, find, keys } = c;
  const needPage = () => { const r = root(); if (!r || !T().url) { toast("Open a page first."); return null; } return r; };
  const selText = () => (getSelection()?.toString() || "").trim().replace(/\s+/g, " ");

  // ---- every match, with context ----
  const matches = () => {
    const r = needPage(); if (!r) return;
    const m = modal({ title: "List every match", wide: true, body: `<input class="field" id="mt-q" placeholder="A word or phrase…" value="${esc(selText().slice(0, 80))}" autofocus><p class="muted" id="mt-n" style="margin:6px 0"></p><div class="kb-list" id="mt-l" style="max-height:50vh;overflow:auto"></div>` });
    const draw = () => {
      const q = $("#mt-q", m.root).value.trim(); if (q.length < 2) { $("#mt-n", m.root).textContent = ""; return ($("#mt-l", m.root).innerHTML = ""); }
      const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), hits = [], blocks = [...r.querySelectorAll("p, li, h1, h2, h3, h4, td, dd, blockquote, figcaption, pre")].filter((b) => !b.querySelector("p, li"));
      for (const b of blocks) { const tx = (b.textContent || "").replace(/\s+/g, " "); re.lastIndex = 0; const x = re.exec(tx); if (x) { const n = tx.match(re).length; hits.push({ b, n, snip: tx.slice(Math.max(0, x.index - 60), x.index + q.length + 80), at: x.index - Math.max(0, x.index - 60) }); } if (hits.length >= 300) break; }
      const total = hits.reduce((a, h) => a + h.n, 0); $("#mt-n", m.root).textContent = hits.length ? `${plural(total, "match", "matches")} in ${plural(hits.length, "place")}` : "No matches.";
      $("#mt-l", m.root).innerHTML = hits.map((h, i) => `<button type="button" class="kb-li" data-i="${i}">…${esc(h.snip.slice(0, h.at))}<mark>${esc(h.snip.slice(h.at, h.at + q.length))}</mark>${esc(h.snip.slice(h.at + q.length))}…</button>`).join("");
      m._hits = hits;
    };
    $("#mt-q", m.root).oninput = draw; m.root.addEventListener("click", (e) => { const b = e.target.closest("[data-i]"); if (!b) return; const h = m._hits[+b.dataset.i]; m.close(); h.b.scrollIntoView({ block: "center", behavior: "smooth" }); const o = h.b.style.outline; h.b.style.outline = "3px solid #ffd43b"; setTimeout(() => (h.b.style.outline = o), 1800); }); draw();
  };

  // ---- search the selection somewhere else ----
  const searchSel = () => {
    const q = selText() || (T().title || "");
    const m = modal({ title: "Search for…", body: `<input class="field" id="ss-q" value="${esc(q.slice(0, 200))}"><div class="kb-list" style="margin-top:10px">${ENG.map(([n], i) => `<button type="button" class="kb-li" data-e="${i}">${esc(n)}</button>`).join("")}</div>` });
    m.root.addEventListener("click", (e) => { const b = e.target.closest("[data-e]"); if (!b) return; const text = $("#ss-q", m.root).value.trim(); if (!text) return; const t = ENG[+b.dataset.e][1]; m.close(); go(t ? t.replace("{q}", encodeURIComponent(text)) : text); });
  };

  // ---- paste and go ----
  const pasteGo = async () => {
    let t = ""; try { t = (await Promise.race([navigator.clipboard.readText(), new Promise((r) => setTimeout(() => r(""), 700))])).trim(); } catch {}
    if (!t) return toast("Nothing on the clipboard (or it isn’t allowed here). Paste into the address bar instead.");
    toast(/^https?:\/\//i.test(t) ? "Opening the copied link." : "Searching for the copied text."); go(t.slice(0, 500));
  };

  // ---- bookmark all open tabs ----
  const markAll = async () => {
    const tabs = B.tabs.filter((t) => t.url); if (!tabs.length) return toast("No open pages.");
    const cur = (await kvGet("webBookmarks", [])) || [], have = new Set(cur.map((b) => b.url)), add = tabs.filter((t) => !have.has(t.url)).map((t) => ({ url: t.url, title: t.title || host(t.url), t: Date.now() }));
    await kvSet("webBookmarks", [...add, ...cur]); toast(add.length ? `Bookmarked ${plural(add.length, "tab")}.` : "They’re all bookmarked already.");
  };

  // ---- extra keys: [ and ] jump headings, / opens find, ? shows shortcuts ----
  if (!window.__kbKeys6) {
    window.__kbKeys6 = true;
    addEventListener("keydown", (e) => {
      if (!B.view?.isConnected || !location.hash.startsWith("#web") || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.target.matches?.("input, textarea, select, [contenteditable]") || document.querySelector(".modal, #kb-lb, #kb-hints")) return;
      if (e.key === "/") { e.preventDefault(); find(); }
      else if (e.key === "?") { e.preventDefault(); keys(); }
      else if (e.key === "]" || e.key === "[") {
        const r = root(), sc = scroller(); if (!r || !sc) return;
        const hs = [...r.querySelectorAll("h1,h2,h3")].filter((h) => h.offsetParent !== null), top = sc.getBoundingClientRect().top;
        const pos = hs.map((h) => h.getBoundingClientRect().top - top);
        const next = e.key === "]" ? hs[pos.findIndex((p) => p > 24)] : hs[pos.map((p, i) => (p < -8 ? i : -1)).filter((i) => i >= 0).pop()];
        if (next) { e.preventDefault(); next.scrollIntoView({ block: "start", behavior: "smooth" }); }
      }
    });
  }

  return [
    { label: "List every match of a word (with context)", icon: "search", run: matches },
    { label: "Search the selection somewhere else…", icon: "search", run: searchSel },
    { label: "Paste and go (open or search the clipboard)", icon: "link", run: pasteGo },
    { label: "Bookmark all open tabs", icon: "bookmark", run: markAll },
  ];
}
