// Notebook: every highlight, note and bookmark across your library.
import { $, $$, esc, icon, coverHtml, toast, timeAgo, plural } from "../util.js";
import { kvGet, getItem, coverSrc } from "../store.js";
import { openItem, emptyState } from "./common.js";
import { setCrumbs } from "../main.js";

const COLORS = { yellow: "#e8c34a", green: "#6fbf6f", blue: "#6f9fe0", pink: "#e07aa5" };

const nbTabs = (cur, due) => `<div class="tabs" role="tablist"><button role="tab" type="button" data-nb="" aria-selected="${cur === ""}">Highlights &amp; bookmarks</button><button role="tab" type="button" data-nb="vocab" aria-selected="${cur === "vocab"}">Vocabulary${due ? ` <span class="pill reading">${due} due</span>` : ""}</button></div>`;
const wireNb = (view) => $$("[data-nb]", view).forEach((b) => (b.onclick = () => (location.hash = "notebook" + (b.dataset.nb ? "/" + b.dataset.nb : ""))));

export async function render(view, _name, params = []) {
  const { getVocab, dueWords } = await import("../lookup.js");
  const due = dueWords(await getVocab()).length;
  if (params[0] === "vocab") return renderVocab(view, due);
  setCrumbs([["Notebook", "notebook"]]);
  const hl = await kvGet("highlights", {}), bm = await kvGet("bookmarks", {});
  const entries = [];
  for (const [id, list] of Object.entries(hl)) { const it = getItem(id); if (it) list.forEach((h) => entries.push({ kind: "hl", it, ...h })); }
  for (const [id, list] of Object.entries(bm)) { const it = getItem(id); if (it) list.forEach((b) => entries.push({ kind: "bm", it, ...b })); }
  const items = [...new Map(entries.map((e) => [e.it.id, e.it])).values()];
  const f = { q: "", item: "", kind: "", color: "" };

  view.innerHTML = `
    <div class="page-head"><div><p class="eyebrow">Yours</p><h1 class="h1">Notebook</h1>
      <p class="lede">${plural(entries.filter((e) => e.kind === "hl").length, "highlight")} and ${plural(entries.filter((e) => e.kind === "bm").length, "bookmark")} across ${plural(items.length, "title")}.</p></div>
      ${entries.length ? `<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" type="button" id="nb-review">${icon("star")}Review a few</button><button class="btn" type="button" id="nb-copy">Copy as text</button><button class="btn btn-accent" type="button" id="nb-export">${icon("download")}Export Markdown</button><button class="btn" type="button" id="nb-readwise" title="Import it at readwise.io/import_bulk">${icon("download")}Export for Readwise (CSV)</button></div>` : ""}</div>
    ${nbTabs("", due)}
    ${entries.length ? `<div class="toolbar">
      <div class="search" style="flex:1 1 260px;max-width:360px">${icon("search")}<input class="field" id="nb-q" type="search" placeholder="Search highlights and notes"></div>
      <select class="field" id="nb-item" style="width:auto"><option value="">All titles</option>${items.map((i) => `<option value="${esc(i.id)}">${esc(i.title)}</option>`).join("")}</select>
      <div class="seg" id="nb-kind"><button type="button" data-k="" aria-pressed="true">All</button><button type="button" data-k="hl" aria-pressed="false">Highlights</button><button type="button" data-k="bm" aria-pressed="false">Bookmarks</button><button type="button" data-k="note" aria-pressed="false">With notes</button></div>
      <div class="chips" id="nb-color">${Object.entries(COLORS).map(([c, hex]) => `<button class="chip" type="button" data-c="${c}" aria-pressed="false" aria-label="${c} highlights"><span style="width:10px;height:10px;border-radius:50%;background:${hex};display:inline-block"></span></button>`).join("")}</div>
    </div><div id="nb-out"></div>` : emptyState("Your notebook is empty.", "Select text in any book to highlight it or add a note. Press B in a reader to bookmark a page.", `<a class="btn" href="#books">Find a book</a>`)}`;
  wireNb(view);
  if (!entries.length) return;

  const filtered = () => entries.filter((e) => {
    if (f.item && e.it.id !== f.item) return false;
    if (f.kind === "note" ? !(e.kind === "hl" && e.note) : f.kind && e.kind !== f.kind) return false;
    if (f.color && (e.kind !== "hl" || (e.color || "yellow") !== f.color)) return false;
    if (f.q) { const s = `${e.text || ""} ${e.note || ""} ${e.label || ""} ${e.it.title}`.toLowerCase(); if (!s.includes(f.q.toLowerCase())) return false; }
    return true;
  }).sort((a, b) => (b.created || 0) - (a.created || 0));

  const draw = () => {
    const list = filtered();
    const groups = new Map();
    for (const e of list) { if (!groups.has(e.it.id)) groups.set(e.it.id, []); groups.get(e.it.id).push(e); }
    $("#nb-out", view).innerHTML = list.length ? [...groups.values()].map((g) => `
      <section class="section" style="margin-top:28px"><div style="display:grid;grid-template-columns:44px minmax(0,1fr) auto;gap:14px;align-items:center;margin-bottom:12px">
        ${coverHtml(coverSrc(g[0].it), g[0].it.title)}<div style="min-width:0"><h3 class="h3">${esc(g[0].it.title)}</h3><span class="muted" style="font-size:13px">${esc(g[0].it.author || g[0].it.series || "")} · ${plural(g.length, "entry", "entries")}</span></div>
        <button class="btn btn-sm" type="button" data-openitem="${esc(g[0].it.id)}">Open</button></div>
        <div class="list">${g.map((e) => `<button class="b-note" type="button" data-jump="${esc(e.it.id)}" data-p="${e.kind === "hl" ? e.p : e.pos}" data-t="${e.t ?? ""}" data-kind="${e.kind}" style="background:var(--surface);border:1px solid var(--line)">
          ${e.kind === "hl" ? `<q style="border-color:${COLORS[e.color] || COLORS.yellow}">${esc(e.text)}</q>${e.note ? `<span style="font-family:var(--f-body);color:var(--ink);font-size:14px">${esc(e.note)}</span>` : ""}`
            : `<span style="font-family:var(--f-body);color:var(--ink);font-size:14px;display:flex;gap:8px;align-items:center">${icon(e.it.type === "audio" ? "headphones" : "bookmark")}${esc(e.label || (e.it.type === "manga" ? `Page ${e.pos + 1}` : "Bookmark"))}</span>${e.note ? `<span style="font-family:var(--f-body);color:var(--ink);font-size:14px">${esc(e.note)}</span>` : ""}`}
          <span style="display:flex;justify-content:space-between;gap:8px;align-items:center">${timeAgo(e.created)}${e.kind === "hl" ? `<span role="button" tabindex="0" class="link-btn" data-card="${esc(e.it.id)}" data-text="${esc(e.text)}">Quote card</span>` : `<span role="button" tabindex="0" class="link-btn" data-bmnote="${esc(e.it.id)}" data-created="${e.created}">${e.note ? "Edit note" : "Add note"}</span>`}</span></button>`).join("")}</div></section>`).join("") : `<p class="status">Nothing matches.</p>`;
  };
  $("#nb-q", view).oninput = (e) => { f.q = e.target.value.trim(); draw(); };
  $("#nb-item", view).onchange = (e) => { f.item = e.target.value; draw(); };
  $("#nb-kind", view).onclick = (e) => { const b = e.target.closest("[data-k]"); if (!b) return; f.kind = b.dataset.k; $$("#nb-kind button", view).forEach((x) => x.setAttribute("aria-pressed", String(x === b))); draw(); };
  $("#nb-color", view).onclick = (e) => { const b = e.target.closest("[data-c]"); if (!b) return; f.color = f.color === b.dataset.c ? "" : b.dataset.c; $$("#nb-color .chip", view).forEach((x) => x.setAttribute("aria-pressed", String(x.dataset.c === f.color))); draw(); };
  $("#nb-out", view).onclick = async (e) => {
    const card = e.target.closest("[data-card]");
    if (card) {
      e.stopPropagation();
      const it = getItem(card.dataset.card);
      const { quoteCard, saveBlob } = await import("../lookup.js");
      saveBlob(await quoteCard({ text: card.dataset.text, title: it.title, author: it.author }, document.documentElement.dataset.theme === "light" ? "paper" : "night"), `${it.title.slice(0, 40).replace(/[^\w\s-]/g, "")} quote.png`);
      return toast("Quote card saved as an image.");
    }
    const bn = e.target.closest("[data-bmnote]");
    if (bn) {
      e.stopPropagation();
      const { getMarks, setMarks } = await import("../store.js");
      const { modal } = await import("../util.js");
      const list = await getMarks("bookmarks", bn.dataset.bmnote);
      const b = list.find((x) => String(x.created) === bn.dataset.created); if (!b) return;
      const m = modal({ title: "Bookmark", body: `<form class="form" id="bm-f"><div><label class="lbl" for="bm-l">Label</label><input class="field" id="bm-l" value="${esc(b.label || "")}" placeholder="${b.pos != null ? `Page ${b.pos + 1}` : ""}"></div>
        <div><label class="lbl" for="bm-n">Note</label><textarea class="field" id="bm-n" rows="4" style="font-family:var(--f-body);font-size:14px" autofocus>${esc(b.note || "")}</textarea></div></form>`,
        actions: `<button class="btn btn-ghost" type="button" id="bm-del" style="margin-right:auto;color:var(--bad)">Delete bookmark</button><button class="btn btn-accent" form="bm-f">Save</button>` });
      $("#bm-f", m.root).onsubmit = async (ev) => { ev.preventDefault(); b.label = $("#bm-l", m.root).value.trim() || b.label; b.note = $("#bm-n", m.root).value.trim(); await setMarks("bookmarks", bn.dataset.bmnote, list); m.close(); render(view, "notebook", []); };
      $("#bm-del", m.root).onclick = async () => { await setMarks("bookmarks", bn.dataset.bmnote, list.filter((x) => x !== b)); m.close(); render(view, "notebook", []); };
      return;
    }
    const o = e.target.closest("[data-openitem]"); if (o) return openItem(getItem(o.dataset.openitem));
    const j = e.target.closest("[data-jump]"); if (!j) return;
    const it = getItem(j.dataset.jump), p = Number(j.dataset.p);
    openItem(it, it.type === "book" ? { para: p } : it.type === "audio" ? { chapter: p, t: j.dataset.t ? Number(j.dataset.t) : 0 } : { from: p });
  };
  const asMarkdown = () => {
    const list = filtered();
    const byItem = new Map();
    for (const e of list) { if (!byItem.has(e.it.id)) byItem.set(e.it.id, []); byItem.get(e.it.id).push(e); }
    return `# Kitsune notebook\n\nExported ${new Date().toLocaleDateString()}\n\n` + [...byItem.values()].map((g) =>
      `## ${g[0].it.title}${g[0].it.author ? ` — ${g[0].it.author}` : ""}\n\n` + g.map((e) => e.kind === "hl"
        ? `> ${e.text.replace(/\n/g, "\n> ")}\n${e.note ? `\n${e.note}\n` : ""}`
        : `- Bookmark: ${e.label || (e.it.type === "manga" ? `page ${e.pos + 1}` : `paragraph ${e.pos + 1}`)}`).join("\n\n")).join("\n\n");
  };
  $("#nb-export", view).onclick = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([asMarkdown()], { type: "text/markdown" }));
    a.download = `kitsune-notebook-${new Date().toISOString().slice(0, 10)}.md`;
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 20_000);
  };
  $("#nb-review", view)?.addEventListener("click", async () => (await import("../recall.js")).openReview());
  $("#nb-readwise", view)?.addEventListener("click", () => {
    const cell = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const rows = filtered().filter((e) => e.kind === "hl").map((e) => [e.text, e.it.title, e.it.author || e.it.series || "", "", e.note || "", "", e.created ? new Date(e.created * 1000).toISOString().slice(0, 19).replace("T", " ") : ""]);
    if (!rows.length) return toast("There are no highlights to export yet.");
    const csv = ["Highlight,Title,Author,URL,Note,Location,Date", ...rows.map((r) => r.map(cell).join(","))].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = "kitsune-highlights-readwise.csv";
    document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 30_000);
    toast(`Exported ${rows.length} highlights. Upload the file at readwise.io/import_bulk.`);
  });
  $("#nb-copy", view).onclick = async function () { try { await navigator.clipboard.writeText(asMarkdown()); toast("Notebook copied."); } catch { toast("Couldn't copy. Your browser blocked the clipboard."); } };
  draw();
}

// ---------- vocabulary ----------
const BOX_LABEL = ["New", "Learning", "Learning", "Familiar", "Known", "Mastered"];
async function renderVocab(view, due) {
  setCrumbs([["Notebook", "notebook"], ["Vocabulary", ""]]);
  const { getVocab, deleteWord } = await import("../lookup.js");
  const list = (await getVocab()).sort((a, b) => b.created - a.created);
  let q = "";
  view.innerHTML = `
    <div class="page-head"><div><p class="eyebrow">Yours</p><h1 class="h1">Notebook</h1>
      <p class="lede">${plural(list.length, "word")} saved from your reading. Review them with flashcards; words you know come back less often.</p></div>
      ${list.length ? `<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" type="button" id="vc-csv">${icon("download")}Export for Anki (CSV)</button>
        <button class="btn btn-accent" type="button" id="vc-review" ${due ? "" : "disabled"}>${icon("play")}${due ? `Review ${due} ${due === 1 ? "word" : "words"}` : "Nothing due"}</button></div>` : ""}</div>
    ${nbTabs("vocab", due)}
    ${list.length ? `<div class="toolbar"><div class="search" style="flex:1 1 260px;max-width:360px">${icon("search")}<input class="field" id="vc-q" type="search" placeholder="Search your words"></div>
      <span class="muted" style="font-size:13px">${["New", "Learning", "Known", "Mastered"].map((l, i) => `${l}: ${list.filter((v) => [0, [1, 2], [3, 4], 5][i].toString().split(",").map(Number).includes(v.box || 0)).length}`).join(" · ")}</span></div>
      <div class="list" id="vc-list"></div>`
      : emptyState("No words yet.", "In a book, select a word, choose Define, then Save word. It shows up here for review.", `<a class="btn" href="#books">Find a book</a>`)}`;
  wireNb(view);
  if (!list.length) return;
  const draw = () => {
    const rows = list.filter((v) => !q || `${v.word} ${v.def} ${v.book}`.toLowerCase().includes(q));
    $("#vc-list", view).innerHTML = rows.map((v) => `<div class="row" style="grid-template-columns:minmax(0,1fr) auto;cursor:default">
      <div class="row-main"><strong style="font-family:var(--f-book, Georgia);font-size:17px">${esc(v.word)} <span class="muted" style="font-size:12px;font-family:var(--f-body);font-weight:400">${esc(v.pos || "")}</span></strong>
        <span style="font-size:14px;white-space:normal">${esc(v.def || "")}</span>
        ${v.context ? `<span class="sub" style="white-space:normal;font-style:italic">“${esc(v.context.length > 160 ? v.context.slice(0, 160) + "…" : v.context)}”</span>` : ""}
        <span class="sub">${esc(v.book || "")} · ${timeAgo(v.created)}</span></div>
      <div class="row-side"><span class="pill ${(v.box || 0) >= 4 ? "completed" : (v.box || 0) >= 1 ? "reading" : ""}">${BOX_LABEL[v.box || 0]}</span><button class="icon-btn" type="button" data-del="${esc(v.id)}" aria-label="Delete ${esc(v.word)}">${icon("trash")}</button></div></div>`).join("") || `<p class="status">Nothing matches.</p>`;
  };
  $("#vc-q", view).oninput = (e) => { q = e.target.value.trim().toLowerCase(); draw(); };
  $("#vc-list", view).onclick = async (e) => { const b = e.target.closest("[data-del]"); if (b) { await deleteWord(b.dataset.del); list.splice(list.findIndex((v) => v.id === b.dataset.del), 1); draw(); } };
  $("#vc-review", view).onclick = () => review(view);
  $("#vc-csv", view).onclick = () => {
    const cell = (s) => `"${String(s || "").replace(/"/g, '""')}"`;
    const csv = list.map((v) => [v.word, `${v.pos ? v.pos + ": " : ""}${v.def || ""}${v.context ? `<br><i>${v.context}</i>` : ""}`, v.book].map(cell).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = "kitsune-vocabulary.csv";
    document.body.append(a); a.click(); a.remove();
  };
  draw();
}

async function review(view) {
  const { getVocab, dueWords, gradeWord } = await import("../lookup.js");
  const { modal } = await import("../util.js");
  const queue = dueWords(await getVocab()).sort(() => Math.random() - 0.5).slice(0, 30);
  let i = 0, right = 0;
  const m = modal({ title: "Review", body: `<div id="fc"></div>`, onClose: () => render(view, "notebook", ["vocab"]) });
  const show = (flipped = false) => {
    const fc = $("#fc", m.root);
    if (i >= queue.length) {
      fc.innerHTML = `<div style="text-align:center;display:grid;gap:12px;padding:20px 0"><p class="eyebrow">Done</p><p class="h2">${right} of ${queue.length} right</p><p class="muted" style="margin:0">Words you missed come back tomorrow.</p><button class="btn btn-accent" type="button" data-close>Finish</button></div>`;
      return;
    }
    const v = queue[i];
    fc.innerHTML = `<p class="muted mono" style="margin:0 0 12px;font-size:12px">${i + 1} / ${queue.length}</p>
      <div style="min-height:220px;display:grid;place-items:center;text-align:center;padding:24px;border-radius:12px;background:var(--surface);border:1px solid var(--line)">
        <div style="display:grid;gap:12px"><strong style="font-family:Literata,Georgia,serif;font-size:32px">${esc(v.word)}</strong>
        ${flipped ? `<span class="muted">${esc(v.pos || "")}</span><p style="margin:0;font-size:16px">${esc(v.def || "")}</p>${v.context ? `<p class="muted" style="margin:0;font-style:italic;font-size:14px">“${esc(v.context.slice(0, 200))}”</p>` : ""}<span class="muted" style="font-size:12px">${esc(v.book || "")}</span>`
          : `<span class="muted" style="font-size:14px">Do you remember what it means?</span>`}</div></div>
      <div style="display:flex;gap:8px;justify-content:center;margin-top:16px">
        ${flipped ? `<button class="btn btn-lg" type="button" id="fc-no">Didn't know</button><button class="btn btn-accent btn-lg" type="button" id="fc-yes">${icon("check")}Knew it</button>`
          : `<button class="btn btn-accent btn-lg" type="button" id="fc-flip">Show meaning</button>`}</div>`;
    if (!flipped) { $("#fc-flip", m.root).onclick = () => show(true); $("#fc-flip", m.root).focus(); }
    else {
      const grade = async (ok) => { await gradeWord(v.id, ok); if (ok) right++; i++; show(false); };
      $("#fc-yes", m.root).onclick = () => grade(true); $("#fc-no", m.root).onclick = () => grade(false); $("#fc-yes", m.root).focus();
    }
  };
  m.root.addEventListener("keydown", (e) => {
    if (e.key === " " && $("#fc-flip", m.root)) { e.preventDefault(); $("#fc-flip", m.root).click(); }
    if (e.key === "1" && $("#fc-no", m.root)) $("#fc-no", m.root).click();
    if (e.key === "2" && $("#fc-yes", m.root)) $("#fc-yes", m.root).click();
  });
  show(false);
}
