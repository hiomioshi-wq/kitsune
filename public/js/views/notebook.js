// Notebook: every highlight, note and bookmark across your library.
import { $, $$, esc, icon, coverHtml, toast, timeAgo, plural } from "../util.js";
import { kvGet, getItem, coverSrc } from "../store.js";
import { openItem, emptyState } from "./common.js";
import { setCrumbs } from "../main.js";

const COLORS = { yellow: "#e8c34a", green: "#6fbf6f", blue: "#6f9fe0", pink: "#e07aa5" };

const nbTabs = (cur, due) => `<div class="tabs" role="tablist"><button role="tab" type="button" data-nb="" aria-selected="${cur === ""}">Highlights &amp; bookmarks</button><button role="tab" type="button" data-nb="vocab" aria-selected="${cur === "vocab"}">Vocabulary${due ? ` <span class="pill reading">${due} due</span>` : ""}</button><button role="tab" type="button" data-nb="web" aria-selected="${cur === "web"}">Web clips</button></div>`;
const wireNb = (view) => $$("[data-nb]", view).forEach((b) => (b.onclick = () => (location.hash = "notebook" + (b.dataset.nb ? "/" + b.dataset.nb : ""))));

export async function render(view, _name, params = []) {
  const { getVocab, dueWords } = await import("../lookup.js");
  const due = dueWords(await getVocab()).length;
  if (params[0] === "vocab") return renderVocab(view, due);
  if (params[0] === "web") return renderWebClips(view, due);
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
let _stage = null; import("../lookup.js").then((m) => (_stage = m));
const stageOf = (v) => (_stage ? _stage.stage(v) : ["New", "Learning", "Learning", "Familiar", "Known", "Mastered"][v.box || 0]);
const stageTip = (v) => { const r = _stage?.recallNow(v); return r == null ? "Not reviewed yet" : `Chance you remember it now: ${Math.round(r * 100)}%`; };
function statsPanel(s) {
  const max = Math.max(1, ...s.forecast), bar = (n, i) => `<rect x="${i * 22}" y="${52 - (n / max) * 48}" width="16" height="${(n / max) * 48}" rx="3" fill="currentColor" opacity="${i === 0 ? 1 : .55}"><title>${i === 0 ? "Today or overdue" : `In ${i} day${i > 1 ? "s" : ""}`}: ${n}</title></rect>`;
  return `<div class="panel" style="display:flex;gap:28px;flex-wrap:wrap;align-items:flex-end;margin:12px 0"><div><p class="eyebrow" style="margin:0">Due over the next 14 days</p><svg width="308" height="56" viewBox="0 0 308 56" style="color:var(--accent, #f2a03f)" role="img" aria-label="Reviews due each day">${s.forecast.map(bar).join("")}</svg></div>
    <div><p class="eyebrow" style="margin:0">Recall right now</p><strong style="font-size:26px">${s.retention == null ? "–" : Math.round(s.retention * 100) + "%"}</strong><small class="muted"> average chance</small></div>
    <div><p class="eyebrow" style="margin:0">Answered right</p><strong style="font-size:26px">${s.accuracy == null ? "–" : Math.round(s.accuracy * 100) + "%"}</strong><small class="muted"> of ${s.reviews} reviews</small></div></div>`;
}
const BOX_LABEL = ["New", "Learning", "Learning", "Familiar", "Known", "Mastered"];
async function renderVocab(view, due) {
  setCrumbs([["Notebook", "notebook"], ["Vocabulary", ""]]);
  const { getVocab, deleteWord } = await import("../lookup.js");
  const list = (await getVocab()).sort((a, b) => b.created - a.created);
  const { vocabStats } = await import("../lookup.js"), vstats = vocabStats(list);
  let q = "";
  view.innerHTML = `
    <div class="page-head"><div><p class="eyebrow">Yours</p><h1 class="h1">Notebook</h1>
      <p class="lede">${plural(list.length, "word")} saved from your reading. Review them with flashcards; words you know come back less often.</p></div>
      ${list.length ? `<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" type="button" id="vc-csv">${icon("download")}Export for Anki (CSV)</button>
        <button class="btn" type="button" id="vc-add">${icon("plus")}Add a word</button><button class="btn btn-accent" type="button" id="vc-review" ${due ? "" : "disabled"}>${icon("play")}${due ? `Review ${due} ${due === 1 ? "word" : "words"}` : "Nothing due"}</button></div>` : ""}</div>
    ${nbTabs("vocab", due)}
    ${list.length ? `<div class="toolbar"><div class="search" style="flex:1 1 260px;max-width:360px">${icon("search")}<input class="field" id="vc-q" type="search" placeholder="Search your words"></div>
      <span class="muted" style="font-size:13px">${["New", "Learning", "Familiar", "Known", "Mastered"].map((x) => `${x}: ${vstats.stages[x]}`).join(" · ")}</span></div>
      ${statsPanel(vstats)}<div class="list" id="vc-list"></div>`
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
      <div class="row-side"><span class="pill ${(v.box || 0) >= 4 ? "completed" : (v.box || 0) >= 1 ? "reading" : ""}" title="${stageTip(v)}">${stageOf(v)}</span><button class="icon-btn" type="button" data-del="${esc(v.id)}" aria-label="Delete ${esc(v.word)}">${icon("trash")}</button></div></div>`).join("") || `<p class="status">Nothing matches.</p>`;
  };
  $("#vc-q", view).oninput = (e) => { q = e.target.value.trim().toLowerCase(); draw(); };
  $("#vc-list", view).onclick = async (e) => { const b = e.target.closest("[data-del]"); if (b) { await deleteWord(b.dataset.del); list.splice(list.findIndex((v) => v.id === b.dataset.del), 1); draw(); } };
  $("#vc-review", view).onclick = () => review(view);
  $("#vc-add", view).onclick = async () => {
    const { modal } = await import("../util.js"), { saveWord, define } = await import("../lookup.js");
    const m = modal({ title: "Add a word", body: `<form class="form" id="aw-f"><label class="lbl" for="aw-w">Word</label><input class="field" id="aw-w" required autofocus><label class="lbl" for="aw-d">Meaning (leave empty to look it up)</label><input class="field" id="aw-d"><label class="lbl" for="aw-c">A sentence with it (optional, makes a fill-in-the-blank card)</label><input class="field" id="aw-c"><p class="status" id="aw-s"></p></form>`, actions: `<button class="btn" type="button" data-close>Cancel</button><button class="btn btn-accent" form="aw-f">Save</button>` });
    $("#aw-f", m.root).onsubmit = async (e) => {
      e.preventDefault(); const word = $("#aw-w", m.root).value.trim(); let def = $("#aw-d", m.root).value.trim(), pos = "";
      if (!def) { $("#aw-s", m.root).textContent = "Looking it up…"; try { const d = await define(word); def = d.senses[0].defs[0] || ""; pos = d.senses[0].pos || ""; } catch (err) { $("#aw-s", m.root).textContent = err.message + " Type a meaning instead."; return; } }
      const ok = await saveWord({ word, def, pos, context: $("#aw-c", m.root).value.trim(), book: "Added by hand" });
      m.close(); toast(ok ? "Saved." : "You already have that word."); render(view, "notebook", ["vocab"]);
    };
  };
  $("#vc-csv", view).onclick = () => {
    const cell = (s) => `"${String(s || "").replace(/"/g, '""')}"`;
    const csv = list.map((v) => [v.word, `${v.pos ? v.pos + ": " : ""}${v.def || ""}${v.context ? `<br><i>${v.context}</i>` : ""}`, v.book].map(cell).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = "kitsune-vocabulary.csv";
    document.body.append(a); a.click(); a.remove();
  };
  draw();
}

const reEsc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
function cloze(v, flipped) {
  const ctx = (v.context || "").trim(), re = ctx && new RegExp(reEsc(v.word), "i");
  if (!flipped && re && re.test(ctx) && localStorage.getItem("kitsune.cloze") !== "0") return `<p style="margin:0;font-family:Literata,Georgia,serif;font-size:20px;line-height:1.5">“${esc(ctx.slice(0, 220)).replace(new RegExp(reEsc(esc(v.word)), "i"), '<span style="border-bottom:2px solid currentColor;padding:0 1.4em">&nbsp;</span>')}”</p><span class="muted" style="font-size:13px">What word fits here?</span>`;
  return `<strong style="font-family:Literata,Georgia,serif;font-size:32px">${esc(v.word)} <button class="icon-btn" type="button" data-say aria-label="Say the word" title="Say it (S)">🔊</button></strong>`;
}
async function review(view) {
  const L = await import("../lookup.js"), { modal } = await import("../util.js");
  const queue = L.dueWords(await L.getVocab()).sort((a, b) => (a.due || 0) - (b.due || 0)).slice(0, 40);
  const total = queue.length, tally = { 1: 0, 2: 0, 3: 0, 4: 0 }; let done = 0, last = null;
  const m = modal({ title: "Review", body: `<div id="fc"></div>`, onClose: () => render(view, "notebook", ["vocab"]) });
  const show = (flipped = false) => {
    const fc = $("#fc", m.root), v = queue[0];
    if (!v) {
      fc.innerHTML = `<div style="text-align:center;display:grid;gap:12px;padding:20px 0"><p class="eyebrow">Done</p><p class="h2">${done} cards reviewed</p><p class="muted" style="margin:0">Again ${tally[1]} · Hard ${tally[2]} · Good ${tally[3]} · Easy ${tally[4]}</p><p class="muted" style="margin:0">Each word comes back just before you'd forget it.</p><button class="btn btn-accent" type="button" data-close>Close</button></div>`; return;
    }
    const pv = L.previews(v), lbl = (g) => (g === 1 && pv[1] < 3600 ? "<10m" : L.fmtDue(pv[g]));
    fc.innerHTML = `<div style="display:flex;justify-content:space-between;margin:0 0 12px"><span class="muted mono" style="font-size:12px">${done} / ${total}${queue.length < total - done ? "" : ""}</span><span class="muted mono" style="font-size:12px">${L.stage(v)}${last ? ' · <a href="#" id="fc-undo">undo (Z)</a>' : ""}</span></div>
      <div style="min-height:220px;display:grid;place-items:center;text-align:center;padding:24px;border-radius:12px;background:var(--surface);border:1px solid var(--line)">
        <div style="display:grid;gap:12px">${cloze(v, flipped)}
        ${flipped ? `<span class="muted">${esc(v.pos || "")}</span><p style="margin:0;font-size:16px">${esc(v.def || "")}</p>${v.context ? `<p class="muted" style="margin:0;font-style:italic;font-size:14px">“${esc(v.context.slice(0, 200))}”</p>` : ""}`
          : `<span class="muted" style="font-size:14px">Do you remember what it means?</span>`}</div></div>
      <div style="display:flex;gap:8px;justify-content:center;margin-top:16px;flex-wrap:wrap">
        ${flipped ? [[1, "Again"], [2, "Hard"], [3, "Good"], [4, "Easy"]].map(([g, name]) => `<button class="btn ${g === 3 ? "btn-accent" : ""} btn-lg" type="button" data-g="${g}" style="display:grid;gap:2px;min-width:78px"><span>${name}</span><small style="opacity:.7;font-size:11px">${lbl(g)} · ${g}</small></button>`).join("")
          : `<button class="btn btn-accent btn-lg" type="button" id="fc-flip">Show meaning (space)</button>`}</div>`;
    if (!flipped) $("#fc-flip", m.root).onclick = () => show(true);
    $("#fc-undo", m.root)?.addEventListener("click", (e) => { e.preventDefault(); undo(); });
  };
  const grade = async (g) => {
    const v = queue.shift(); if (!v) return;
    const r = await L.gradeWord(v.id, g); tally[g]++; last = { v, before: r?.before, g };
    if (g === 1) { queue.push(v); } else done++;
    show(false);
  };
  const undo = async () => {
    if (!last) return; const { v, before, g } = last; last = null;
    await L.undoGrade(v.id, before); tally[g]--; if (g === 1) { const i = queue.lastIndexOf(v); if (i >= 0) queue.splice(i, 1); } else done--;
    queue.unshift(v); show(false);
  };
  const say = (v) => { try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(v.word); u.lang = document.documentElement.lang || "en"; speechSynthesis.speak(u); } catch {} };
  m.root.addEventListener("click", (e) => { if (e.target.closest("[data-say]")) return say(queue[0]); const b = e.target.closest("[data-g]"); if (b) grade(Number(b.dataset.g)); });
  m.root.addEventListener("keydown", (e) => {
    if (e.key === " " && $("#fc-flip", m.root)) { e.preventDefault(); $("#fc-flip", m.root).click(); }
    else if (/^[1-4]$/.test(e.key) && $("[data-g]", m.root)) grade(Number(e.key));
    else if ((e.key === "z" || e.key === "Z") && last) undo();
    else if ((e.key === "s" || e.key === "S") && queue[0]) say(queue[0]);
    else if (e.key === "c" || e.key === "C") { localStorage.setItem("kitsune.cloze", localStorage.getItem("kitsune.cloze") === "0" ? "1" : "0"); show(!!$("[data-g]", m.root)); }
  });
  show(false);
}

// ---------- web clips: what you highlighted in Kitsune's browser ----------
const CLIP_HEX = { yellow: "#e8c34a", green: "#6fbf6f", blue: "#6f9fe0", pink: "#e07aa5" };
async function renderWebClips(view, due) {
  setCrumbs([["Notebook", "notebook"], ["Web clips", ""]]);
  const all = Object.values((await kvGet("webClips", {})) || {}).sort((a, b) => (b.t || 0) - (a.t || 0));
  const n = all.reduce((a, p) => a + p.clips.length, 0);
  view.innerHTML = `<div class="page-head"><div><p class="eyebrow">Yours</p><h1 class="h1">Notebook</h1><p class="lede">${plural(n, "highlight")} from ${plural(all.length, "web page")}. Select text in Kitsune's browser to add more.</p></div>
      ${n ? `<button class="btn" type="button" id="wc-copy">Copy as Markdown</button>` : ""}</div>
    ${nbTabs("web", due)}
    ${all.length ? `<div class="wc-pages">${all.map((p) => `<section class="panel wc-page"><a class="wc-h" href="#web/${encodeURIComponent(p.url)}"><strong>${esc(p.title || p.url)}</strong><small>${esc(new URL(p.url).hostname.replace(/^www\./, ""))}</small></a>
      ${p.clips.map((c) => `<blockquote class="wc-clip" style="--c:${CLIP_HEX[c.color] || CLIP_HEX.yellow}">${esc(c.text)}<small>${timeAgo(Math.floor((c.t || Date.now()) / 1000))}</small></blockquote>`).join("")}</section>`).join("")}</div>`
      : emptyState("No web clips yet.", "Open a page in the Browser, select some text and pick a colour. It shows up here.", `<a class="btn btn-accent" href="#web">Open the browser</a>`)}`;
  wireNb(view);
  $("#wc-copy", view)?.addEventListener("click", () => {
    const md = all.map((p) => `## [${p.title || p.url}](${p.url})\n\n${p.clips.map((c) => `> ${c.text}`).join("\n\n")}`).join("\n\n");
    navigator.clipboard?.writeText(md).then(() => toast("Copied as Markdown."));
  });
}
