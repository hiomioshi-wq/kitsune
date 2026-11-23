// Search everything (⌘K / Ctrl+K / "/").
import { $, $$, esc, icon, modal } from "./util.js";
import { lib, coverSrc, kvGet } from "./store.js";

const PAGES = [
  ["Home", "home", "home"], ["Ask AI", "ai", "spark"], ["Originals wiki", "lore", "list"], ["Blackwood University wiki", "lore/s/blackwood", "list"], ["Incarnate wiki", "lore/s/incarnate", "list"], ["Imagine pictures (AI)", "ai/imagine", "star"], ["Library", "library", "shelf"], ["Series", "library/series", "shelf"], ["AniList tracking", "library/tracking", "star"],
  ["Discover: trending", "discover", "compass"], ["Classic manga (public domain)", "discover/classic", "compass"],
  ["Ebooks (Project Gutenberg)", "books", "book"], ["Scanned books (Internet Archive)", "books/scans", "book"], ["Audiobooks (LibriVox)", "books/audio", "headphones"],
  ["Link & import", "link", "link"], ["Up next", "library/queue", "clock"], ["Notebook: highlights & notes", "notebook", "highlight"],
  ["Stats & achievements", "stats", "chart"], ["Den: your nine-tailed fox", "den", "tails"], ["Atlas: your library as a star map", "atlas", "atlas"], ["Settings", "settings", "gear"], ["Backup & restore", "settings/data", "download"],
];

const ACTIONS = [
  ["Add files you own", "upload", async () => (await import("./views/link.js")).openImport()],
  ["Switch to dark theme", "moon", async () => { const s = await import("./store.js"); s.settings.theme = "dark"; s.saveSettings(); }],
  ["Switch to light theme", "sun", async () => { const s = await import("./store.js"); s.settings.theme = "light"; s.saveSettings(); }],
  ["Follow the system theme", "gear", async () => { const s = await import("./store.js"); s.settings.theme = "system"; s.saveSettings(); }],
  ["Library tools: Pick for me", "shelf", () => (location.hash = "tools/pick")],
  ["Library tools: Almost done", "shelf", () => (location.hash = "tools/almost")],
  ["Library tools: Gone quiet", "shelf", () => (location.hash = "tools/quiet")],
  ["Library tools: Up next queue", "shelf", () => (location.hash = "tools/next")],
  ["Library tools: Reading plan", "shelf", () => (location.hash = "tools/plan")],
  ["Library tools: Series gaps", "shelf", () => (location.hash = "tools/gaps")],
  ["Library tools: Find duplicates", "shelf", () => (location.hash = "tools/dupes")],
  ["Library tools: Tidy up library", "shelf", () => (location.hash = "tools/tidy")],
  ["Library tools: Bulk tags", "shelf", () => (location.hash = "tools/tags")],
  ["Library tools: All my notes", "shelf", () => (location.hash = "tools/notes")],
  ["Library tools: Resurface a highlight", "shelf", () => (location.hash = "tools/resurface")],
  ["Library tools: Top shelf", "shelf", () => (location.hash = "tools/top")],
  ["Library tools: Backlog maths", "shelf", () => (location.hash = "tools/backlog")],
  ["Library tools: Library report", "shelf", () => (location.hash = "tools/report")],
  ["Library tools: Export library", "shelf", () => (location.hash = "tools/export")],
  ["Library tools: Reading bingo", "shelf", () => (location.hash = "tools/bingo")],
  ["Library tools: Reading journal", "shelf", () => (location.hash = "tools/journal")],
  ["Library tools: Lending log", "shelf", () => (location.hash = "tools/loans")],
  ["Library tools: Smart shelves", "shelf", () => (location.hash = "tools/smart")],
  ["Library tools: Release radar", "shelf", () => (location.hash = "tools/radar")],
  ["Library tools: Series progress", "shelf", () => (location.hash = "tools/series")],
  ["Library tools: Cast notebook", "shelf", () => (location.hash = "tools/cast")],
  ["Library tools: Reading timeline", "shelf", () => (location.hash = "tools/timeline")],
  ["Library tools: For you: recommendations", "shelf", () => (location.hash = "tools/foryou")],
  ["Library tools: Tag manager", "shelf", () => (location.hash = "tools/tagman")],
  ["Settings: Browser", "gear", () => (location.hash = "settings/browser")],
  ["Settings: Visual novels and character gallery", "gear", () => (location.hash = "settings/vn")],
  ["Settings: Sound effects", "gear", () => (location.hash = "settings/sounds")],
  ["Visual novels: play any story", "book", () => (location.hash = "vn")],
  ["Story games: play The Thirteenth Letter", "spark", () => (location.hash = "story/the-thirteenth-letter")],
  ["Review vocabulary flashcards", "star", () => (location.hash = "notebook/vocab")],
  ["Surprise me with a classic manga", "compass", () => { location.hash = "discover/classic"; setTimeout(() => document.querySelector("#c-surprise")?.click(), 900); }],
  ["Surprise me with a free ebook", "book", () => { location.hash = "books/ebooks"; setTimeout(() => document.querySelector("#b-surprise")?.click(), 900); }],
  ["Continue reading", "book", async () => {
    const s = await import("./store.js"); const p = await s.allProgress();
    const it = s.lib.items.filter((i) => p[i.id] && s.progressPct(p[i.id]) < 100).sort((a, b) => p[b.id].updated - p[a.id].updated)[0];
    if (it) (await import("./views/common.js")).openItem(it); else location.hash = "library";
  }],
  ["Make a backup", "download", () => (location.hash = "settings/data")],
  ["Incognito: turn on or off", "moon", async () => { const p = await import("./privacy.js"); p.setIncognito(!p.isIncognito()); }],
  ["Lock Kitsune now", "x", async () => (await import("./privacy.js")).lockNow()],
  ["Search inside my books", "search", async () => (await import("./fulltext.js")).openFullText()],
  ["Review my highlights", "highlight", async () => (await import("./recall.js")).openReview()],
  ["Writing studio: my stories", "edit", () => (location.hash = "write")],
  ["New writing project", "plus", async () => (await import("./views/write.js")).newProject()],
  ["New drawing in the Ink studio", "edit", async () => { location.hash = "create"; setTimeout(() => document.querySelector('[data-cs="draw"]')?.click(), 500); }],
  ["Panel studio: lay out a comic", "grid", () => (location.hash = "panels")],
  ["Browser: open the web inside Kitsune", "browser", () => (location.hash = "web")],
  ["Search a website…", "search", () => { location.hash = "web"; setTimeout(() => { const u = document.querySelector("#kb-url"); if (u) { u.value = " @"; u.focus(); u.setSelectionRange(0, 0); } }, 600); }],
  ["Comics: webcomics, xkcd, Pepper&Carrot", "comics", () => (location.hash = "comics")],
  ["Random xkcd", "compass", async () => { const { api } = await import("./util.js"); const l = await api("comics/xkcd/latest"); location.hash = "comics/xkcd/" + (1 + Math.floor(Math.random() * l.num)); }],
  ["Pepper&Carrot: read the whole series", "comics", () => (location.hash = "comics/pepper")],
  ["Favourite comic strips", "star", () => (location.hash = "comics/favs")],
  ["Recently deleted", "trash", () => (location.hash = "library/trash")],
  ["Reading reminder", "clock", () => (location.hash = "settings/reminder")],
  ["Find duplicates in my library", "list", async () => (await import("./views/common.js")).findDuplicates()],
  ["Focus timer: 25 minutes", "clock", async () => (await import("./focus.js")).startFocus(25)],
  ["Focus timer: 45 minutes", "clock", async () => (await import("./focus.js")).startFocus(45)],
  ["Stop the focus timer", "x", async () => (await import("./focus.js")).stopFocus()],
  ["Keyboard shortcuts", "type", async () => (await import("./main.js")).showShortcuts()],
  ["Show the welcome tour again", "star", async () => (await import("./welcome.js")).showWelcome()],
  ["Switch or add a profile", "gear", () => (location.hash = "settings/profiles")],
  ["Theme studio: themes, fonts, cursors", "sliders", () => (location.hash = "studio")],
  ["Custom sources", "link", () => (location.hash = "sources")],
  ["Accounts, subscriptions & API keys", "gear", () => (location.hash = "accounts")],
  ["Publish my own work", "edit", () => (location.hash = "create")],
  ["Panel studio: make comic pages", "grid", () => (location.hash = "panels")],
  ["Wikis: Wikipedia, Fandom, Miraheze…", "globe", () => (location.hash = "wiki")],
  ["My year in review (Wrapped)", "chart", async () => (await import("./wrapped.js")).openWrapped()],
  ["Rescan library folder", "folder", async () => { const s = await import("./store.js"); if (!s.lib.features.libraryFolder) return (await import("./util.js")).toast("The library folder only exists when Kitsune runs on your computer."); const n = await s.rescanFolder(); (await import("./util.js")).toast(`Found ${n} volumes.`); }],
];

export function openPalette() {
  if ($(".palette")) return;
  const m = modal({ title: "Search", body: "" });
  m.root.classList.add("palette");
  const card = $(".modal-card", m.root);
  card.innerHTML = `<div class="palette-input">${icon("search")}<input id="pal-q" type="search" placeholder="Search your library, or type to search the web sources" autocomplete="off" aria-label="Search"><kbd>esc</kbd></div>
    <div class="palette-list" id="pal-list" role="listbox"></div>
    <div class="palette-foot"><span><kbd>↑</kbd> <kbd>↓</kbd> move</span><span><kbd>↵</kbd> open</span></div>`;
  const input = $("#pal-q", card), list = $("#pal-list", card);
  let results = [], sel = 0, inside = [], insideQ = "", insideT;
  // Full-text search through books whose text is stored on this device.
  const searchInside = (q) => {
    clearTimeout(insideT);
    if (q.length < 3) { inside = []; insideQ = ""; return; }
    insideT = setTimeout(() => {
      const hits = [];
      const needle = q.toLowerCase();
      for (const it of lib.items) {
        const text = it.type === "book" && (it.source?.cachedText || (it.source?.kind === "text" && it.source.text));
        if (!text) continue;
        const lower = text.toLowerCase();
        let at = lower.indexOf(needle), n = 0;
        while (at >= 0 && n < 2) {
          hits.push({ group: "Inside your books", label: it.title, sub: "…" + text.slice(Math.max(0, at - 50), at + needle.length + 70).replace(/\s+/g, " ") + "…", img: coverSrc(it), run: async () => (await import("./views/common.js")).openItem(it, { find: q }) });
          at = lower.indexOf(needle, at + needle.length + 400); n++;
        }
        if (hits.length >= 8) break;
      }
      inside = hits; insideQ = q;
      if (input.value.trim().toLowerCase() === q.toLowerCase()) draw();
    }, 250);
  };

  let webPages = [];
  Promise.all([kvGet("webBookmarks", []), kvGet("webHistory", [])]).then(([b, h]) => { const seen = new Set(); webPages = [...(b || []).map((x) => ({ ...x, mark: true })), ...(h || [])].filter((x) => x?.url && !seen.has(x.url) && seen.add(x.url)); if (input.value.trim()) draw(); }).catch(() => {});
  const draw = () => {
    const q = input.value.trim().toLowerCase();
    const hostOf = (u) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return ""; } };
    const webHits = q.length > 1 ? webPages.filter((p) => ((p.title || "") + " " + p.url).toLowerCase().includes(q)).slice(0, 5).map((p) => ({ group: "From your browser", label: p.title || p.url, sub: (p.mark ? "Bookmark · " : "") + hostOf(p.url), icon: p.mark ? "bookmark" : "browser", href: "web/" + encodeURIComponent(p.url) })) : [];
    const items = lib.items.filter((i) => !q || [i.title, i.series, i.author, i.link?.title, ...(i.tags || [])].join(" ").toLowerCase().includes(q))
      .sort((a, b) => (b.lastRead || 0) - (a.lastRead || 0)).slice(0, 8)
      .map((i) => ({ group: "Your library", label: i.title, sub: [i.series || i.author, i.type].filter(Boolean).join(" · "), img: coverSrc(i), href: "item/" + encodeURIComponent(i.id) }));
    const pages = PAGES.filter(([l]) => !q || l.toLowerCase().includes(q)).slice(0, q ? 4 : 12).map(([label, href, ic]) => ({ group: "Go to", label, icon: ic, href }));
    const web = q ? [
      { group: `Search the web for “${input.value.trim()}”`, label: "Search everywhere: every free source at once", icon: "search", href: "search/" + encodeURIComponent(input.value.trim()) },
      { group: "", label: "Where can I read it? (shops and services)", icon: "search", href: "find/" + encodeURIComponent(input.value.trim()) },
      { group: "", label: "Ask AI", sub: "Uses the AI engine you chose (optional)", icon: "spark", run: async () => (await import("./ai.js")).askPanel({ prompt: input.value.trim() }) },
      { group: "", label: "Wikipedia", icon: "globe", href: "wiki/en-wikipedia-org/" + encodeURIComponent(input.value.trim()).replace(/%20/g, "_") },
      { group: "", label: "Manga on AniList", icon: "compass", href: "discover/search/" + encodeURIComponent(input.value.trim()) },
      { group: "", label: "Ebooks on Project Gutenberg", icon: "book", href: "books/ebooks/" + encodeURIComponent(input.value.trim()) },
      { group: "", label: "Scanned books on Internet Archive", icon: "book", href: "books/scans/" + encodeURIComponent(input.value.trim()) },
      { group: "", label: "Audiobooks on LibriVox", icon: "headphones", href: "books/audio/" + encodeURIComponent(input.value.trim()) },
    ] : [];
    const actions = ACTIONS.filter(([l]) => !q || l.toLowerCase().includes(q)).slice(0, q ? 4 : 6).map(([label, ic, run]) => ({ group: "Actions", label, icon: ic, run }));
    results = [...items, ...(insideQ && insideQ.toLowerCase() === q ? inside : []), ...webHits, ...web, ...actions, ...pages];
    sel = Math.min(sel, Math.max(0, results.length - 1));
    let lastGroup = null;
    list.innerHTML = results.map((r, i) => {
      const g = r.group !== lastGroup && r.group ? `<div class="palette-group">${esc(r.group)}</div>` : "";
      if (r.group) lastGroup = r.group;
      return g + `<button class="palette-item" type="button" role="option" data-i="${i}" aria-selected="${i === sel}">
        ${r.img ? `<img src="${esc(r.img)}" alt="" loading="lazy">` : `<span class="ph">${icon(r.icon || "book")}</span>`}
        <div><strong>${esc(r.label)}</strong>${r.sub ? `<span>${esc(r.sub)}</span>` : ""}</div></button>`;
    }).join("") || `<p class="status" style="padding:16px">Nothing matches.</p>`;
  };
  const openSel = (i = sel) => { const r = results[i]; if (!r) return; m.close(); if (r.run) r.run(); else location.hash = r.href; };
  input.addEventListener("input", () => { sel = 0; draw(); searchInside(input.value.trim()); });
  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); sel = Math.min(results.length - 1, sel + 1); draw(); $$('[aria-selected="true"]', list)[0]?.scrollIntoView({ block: "nearest" }); }
    if (e.key === "ArrowUp") { e.preventDefault(); sel = Math.max(0, sel - 1); draw(); $$('[aria-selected="true"]', list)[0]?.scrollIntoView({ block: "nearest" }); }
    if (e.key === "Enter") { e.preventDefault(); openSel(); }
  });
  list.addEventListener("click", (e) => { const b = e.target.closest("[data-i]"); if (b) openSel(Number(b.dataset.i)); });
  draw();
  input.focus();
}
