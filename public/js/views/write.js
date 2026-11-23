// Writing studio: a manuscript editor for stories and books. Chapters you can reorder, an outline corkboard,
// a story bible, word goals and sprints, snapshots of every chapter, and one-tap publishing or EPUB export.
import { $, $$, esc, icon, toast, modal, uid, plural, debounce, today, fmtMinutes, confirmBox } from "../util.js";
import { kvGet, kvSet, saveItem, getItem } from "../store.js";
import { setCrumbs } from "../main.js";

const STATUS = { idea: ["Idea", "#9a9db0"], draft: ["Draft", "#e8913c"], revised: ["Revised", "#3c7fc8"], final: ["Final", "#5aa05a"] };
const BIBLE = { character: "Character", place: "Place", thing: "Thing", note: "Note" };
const W = { proj: null, ch: null, tab: "chapters", side: true, focus: false, typewriter: false, sprint: null, session: { words: 0, t: Date.now() } };

// ---------- storage ----------
export async function allProjects() { return Object.values((await kvGet("writeProjects", {})) || {}).sort((a, b) => b.updated - a.updated); }
async function saveProject(p) { p.updated = Date.now(); const all = { ...((await kvGet("writeProjects", {})) || {}) }; all[p.id] = p; await kvSet("writeProjects", all); }
async function getText(chId) { return ((await kvGet("write:" + chId, null)) || { text: "", snaps: [] }); }
async function putText(chId, data) { await kvSet("write:" + chId, data); }
export const countWords = (s) => (String(s).match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu) || []).length;
async function logWords(n) {
  if (n <= 0) return;
  const log = { ...((await kvGet("writeLog", {})) || {}) };
  log[today()] = (log[today()] || 0) + n;
  await kvSet("writeLog", log);
}
export async function writeLog() { return (await kvGet("writeLog", {})) || {}; }
export function writingStreak(log) {
  let n = 0; const d = new Date();
  if (!log[today(d)]) d.setDate(d.getDate() - 1);
  while (log[today(d)]) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

// ---------- Markdown-lite <-> editor HTML ----------
// Paragraphs, *italic*, **bold**, ## headings, > quotes and *** scene breaks. Simple enough to read as plain text.
const inline = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/(^|[^*])\*(?!\s)(.+?)\*/g, "$1<em>$2</em>");
export function mdToHtml(md) {
  const blocks = String(md || "").replace(/\r/g, "").split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  if (!blocks.length) return "<p><br></p>";
  return blocks.map((b) => {
    if (/^(\*\s*\*\s*\*|-{3,}|#)$/.test(b)) return `<hr>`;
    if (b.startsWith("## ")) return `<h2>${inline(b.slice(3))}</h2>`;
    if (b.startsWith("> ")) return `<blockquote>${inline(b.replace(/^>\s?/gm, ""))}</blockquote>`;
    return `<p>${inline(b).replace(/\n/g, "<br>")}</p>`;
  }).join("");
}
function nodeMd(n) {
  if (n.nodeType === 3) return n.nodeValue.replace(/ /g, " ");
  if (n.nodeType !== 1) return "";
  const inner = [...n.childNodes].map(nodeMd).join("");
  switch (n.tagName) {
    case "STRONG": case "B": return inner.trim() ? `**${inner}**` : inner;
    case "EM": case "I": return inner.trim() ? `*${inner}*` : inner;
    case "BR": return "\n";
    default: return inner;
  }
}
export function htmlToMd(root) {
  const out = [];
  for (const n of root.childNodes) {
    if (n.nodeType === 3) { if (n.nodeValue.trim()) out.push(n.nodeValue.trim()); continue; }
    if (n.nodeType !== 1) continue;
    const t = n.tagName, txt = nodeMd(n).replace(/\n+$/, "").trim();
    if (t === "HR") out.push("***");
    else if (/^H[1-6]$/.test(t)) { if (txt) out.push("## " + txt.replace(/\n/g, " ")); }
    else if (t === "BLOCKQUOTE") { if (txt) out.push(txt.split("\n").map((l) => "> " + l).join("\n")); }
    else if (txt) out.push(txt);
  }
  return out.join("\n\n");
}

// ---------- view ----------
export async function render(view, _n, params = []) {
  const id = params[0] ? decodeURIComponent(params[0]) : null;
  if (!id) return renderList(view);
  const all = (await kvGet("writeProjects", {})) || {};
  W.proj = all[id];
  if (!W.proj) { location.hash = "write"; return; }
  W.ch = W.proj.chapters.find((c) => c.id === W.proj.last) || W.proj.chapters[0];
  W.session = { words: 0, t: Date.now() };
  W.side = innerWidth >= 1100;
  setCrumbs([["Create", "create"], ["Writing studio", "write"], [W.proj.title, ""]]);
  await drawStudio(view);
}

async function renderList(view) {
  setCrumbs([["Create", "create"], ["Writing studio", ""]]);
  const list = await allProjects(), log = await writeLog();
  const totals = {};
  for (const p of list) totals[p.id] = p.chapters.reduce((a, c) => a + (c.words || 0), 0);
  view.innerHTML = `
    <div class="page-head"><div><p class="eyebrow">Creator studio</p><h1 class="h1">Writing studio</h1>
      <p class="lede">Write your story chapter by chapter, with an outline, a story bible, goals and snapshots. Publish it to your shelf or as an EPUB whenever you like. Everything stays on this device.</p></div>
      <button class="btn btn-accent" type="button" id="wr-new">${icon("plus")}New project</button></div>
    <div class="wr-stats">
      <div class="stat"><span class="k">${icon("edit")}Today</span><span class="v">${(log[today()] || 0).toLocaleString()}</span><span class="s">words written</span></div>
      <div class="stat"><span class="k">${icon("fire")}Writing streak</span><span class="v">${writingStreak(log)}</span><span class="s">days in a row</span></div>
      <div class="stat"><span class="k">${icon("pages")}All projects</span><span class="v">${Object.values(totals).reduce((a, b) => a + b, 0).toLocaleString()}</span><span class="s">words in ${plural(list.length, "project")}</span></div>
    </div>
    ${list.length ? `<div class="wr-grid">${list.map((p) => { const w = totals[p.id], pct = p.target ? Math.min(100, Math.round((w / p.target) * 100)) : 0; return `
      <a class="wr-proj" href="#write/${encodeURIComponent(p.id)}" style="--h:${p.hue ?? 20}">
        <span class="wr-spine" aria-hidden="true"><b>${esc(p.title.slice(0, 1).toUpperCase())}</b></span>
        <span class="wr-pbody"><strong>${esc(p.title)}</strong><small>${esc([p.genre, plural(p.chapters.length, "chapter"), `${w.toLocaleString()} words`].filter(Boolean).join(" · "))}</small>
          ${p.target ? `<span class="wr-bar"><i style="width:${pct}%"></i></span><small>${pct}% of ${p.target.toLocaleString()} words</small>` : ""}
          <small class="muted">Edited ${new Date(p.updated).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</small></span></a>`; }).join("")}</div>`
    : `<div class="empty"><h3>Your first story starts here.</h3><p>Make a project, then write one chapter at a time. Kitsune counts your words, keeps snapshots and saves as you type.</p><button class="btn btn-accent" type="button" data-new>${icon("plus")}New project</button></div>`}`;
  view.onclick = (e) => { if (e.target.closest("#wr-new, [data-new]")) newProject(); };
}

export function newProject() {
  const m = modal({ title: "New writing project", body: `<form class="form" id="wn">
      <div><label class="lbl" for="wn-t">Title</label><input class="field" id="wn-t" required autofocus placeholder="The Lantern Fox"></div>
      <div class="row2"><div><label class="lbl" for="wn-g">Kind of story</label><select class="field" id="wn-g">${["Novel", "Short story", "Novella", "Fan fiction", "Light novel", "Poetry", "Screenplay notes", "Non-fiction"].map((g) => `<option>${g}</option>`).join("")}</select></div>
        <div><label class="lbl" for="wn-w">Word target</label><input class="field" id="wn-w" type="number" min="0" step="1000" placeholder="e.g. 50000"></div></div>
      <div><label class="lbl" for="wn-d">Daily goal (words)</label><input class="field" id="wn-d" type="number" min="0" step="50" value="500"></div></form>`,
    actions: `<button class="btn" type="button" data-close>Cancel</button><button class="btn btn-accent" form="wn">Start writing</button>` });
  $("#wn", m.root).onsubmit = async (e) => {
    e.preventDefault();
    const ch = { id: uid("wc-"), title: "Chapter One", status: "draft", synopsis: "", words: 0 };
    const p = { id: uid("wp-"), title: $("#wn-t", m.root).value.trim(), genre: $("#wn-g", m.root).value, target: Number($("#wn-w", m.root).value) || 0, daily: Number($("#wn-d", m.root).value) || 0,
      creator: localStorage.getItem("kitsune.creatorName") || "", hue: Math.floor(Math.random() * 360), created: Date.now(), updated: Date.now(), chapters: [ch], bible: [], last: ch.id };
    await saveProject(p);
    m.close();
    location.hash = "write/" + encodeURIComponent(p.id);
  };
}

// ---------- the studio ----------
async function drawStudio(view) {
  const p = W.proj;
  view.innerHTML = `
    <div class="wr ${W.focus ? "wr-focus" : ""} ${W.side ? "" : "wr-noside"}" id="wr">
      <aside class="wr-nav" id="wr-nav"></aside>
      <main class="wr-main" id="wr-main"></main>
      <aside class="wr-side" id="wr-side"></aside>
    </div>`;
  drawNav(view);
  await drawMain(view);
  drawSide(view);
  view.onclick = (e) => onClick(e, view);
  void p;
}

function drawNav(view) {
  const p = W.proj, nav = $("#wr-nav", view);
  nav.innerHTML = `
    <div class="wr-proj-h"><a href="#write" class="wr-back" aria-label="All projects">${icon("back")}</a><strong title="${esc(p.title)}">${esc(p.title)}</strong>
      <button class="icon-btn" type="button" data-w="proj" aria-label="Project settings" title="Project settings">${icon("sliders")}</button></div>
    <div class="tabs wr-tabs" role="tablist">${[["chapters", "Chapters"], ["outline", "Outline"], ["bible", "Bible"]].map(([k, l]) => `<button role="tab" type="button" data-tab="${k}" aria-selected="${W.tab === k}">${l}</button>`).join("")}</div>
    ${W.tab === "chapters" ? `<ol class="wr-chs" id="wr-chs">${p.chapters.map((c, i) => `<li draggable="true" data-ci="${i}" class="${c.id === W.ch?.id ? "on" : ""}">
        <button type="button" data-ch="${esc(c.id)}"><span class="wr-dot" style="--c:${STATUS[c.status || "draft"][1]}" title="${STATUS[c.status || "draft"][0]}"></span><span class="wr-cht">${esc(c.title || `Chapter ${i + 1}`)}</span><em>${(c.words || 0).toLocaleString()}</em></button></li>`).join("")}</ol>
      <button class="btn btn-sm wr-addch" type="button" data-w="addch">${icon("plus")}Chapter</button>`
    : W.tab === "outline" ? `<p class="hint">Your chapters as index cards. Drag to reorder; write a line about each so you always know where the story goes.</p><button class="btn btn-sm" type="button" data-w="board">${icon("grid")}Open the corkboard</button>`
    : `<p class="hint">The people, places and things in your story. Kitsune counts how often each one comes up.</p><button class="btn btn-sm" type="button" data-w="biblefull">${icon("list")}Open the bible</button>`}
    <div class="wr-total"><span>${p.chapters.reduce((a, c) => a + (c.words || 0), 0).toLocaleString()} words</span>${p.target ? `<span class="wr-bar"><i style="width:${Math.min(100, Math.round((p.chapters.reduce((a, c) => a + (c.words || 0), 0) / p.target) * 100))}%"></i></span>` : ""}</div>`;
  // drag to reorder chapters
  let from = -1;
  $$("#wr-chs li", nav).forEach((li) => {
    li.addEventListener("dragstart", (e) => { from = Number(li.dataset.ci); e.dataTransfer.effectAllowed = "move"; li.classList.add("drag"); });
    li.addEventListener("dragend", () => li.classList.remove("drag"));
    li.addEventListener("dragover", (e) => { e.preventDefault(); li.classList.add("over"); });
    li.addEventListener("dragleave", () => li.classList.remove("over"));
    li.addEventListener("drop", async (e) => {
      e.preventDefault(); li.classList.remove("over");
      const to = Number(li.dataset.ci); if (from < 0 || from === to) return;
      const [m] = p.chapters.splice(from, 1); p.chapters.splice(to, 0, m);
      await saveProject(p); drawNav(view);
    });
  });
}

let editorSave = null;
async function drawMain(view) {
  const main = $("#wr-main", view), ch = W.ch;
  if (!ch) { main.innerHTML = `<div class="empty"><p>Add a chapter to start.</p></div>`; return; }
  const data = await getText(ch.id);
  W.text = data;
  W.baseWords = countWords(data.text);
  main.innerHTML = `
    <div class="wr-tb" role="toolbar" aria-label="Formatting">
      <button class="icon-btn" type="button" data-w="nav" aria-label="Show or hide chapters" title="Chapters">${icon("list")}</button>
      <span class="wr-tsep"></span>
      <button type="button" class="wr-fmt" data-fmt="bold" aria-label="Bold (⌘B)" title="Bold (⌘B)"><b>B</b></button>
      <button type="button" class="wr-fmt" data-fmt="italic" aria-label="Italic (⌘I)" title="Italic (⌘I)"><i>I</i></button>
      <button type="button" class="wr-fmt" data-fmt="h2" aria-label="Section heading" title="Section heading">H</button>
      <button type="button" class="wr-fmt" data-fmt="quote" aria-label="Quote" title="Quote">“”</button>
      <button type="button" class="wr-fmt" data-fmt="break" aria-label="Scene break" title="Scene break">⁂</button>
      <span class="wr-tsep"></span>
      <button type="button" class="wr-fmt" data-w="find" aria-label="Find and replace (⌘F)" title="Find and replace (⌘F)">${icon("search")}</button>
      <button type="button" class="wr-fmt" data-w="focus" aria-pressed="${W.focus}" aria-label="Focus mode (⌘⇧F)" title="Focus mode: only the paragraph you're on stays bright (⌘⇧F)">${icon("expand")}</button>
      <button type="button" class="wr-fmt" data-w="type" aria-pressed="${W.typewriter}" aria-label="Typewriter scrolling" title="Typewriter scrolling: keep the line you're typing in the middle">${icon("type")}</button>
      <button type="button" class="wr-fmt" data-w="listen" aria-label="Read it back to me" title="Read it back to me, to catch clumsy sentences">${icon("speak")}</button>
      <span style="flex:1"></span>
      <span class="wr-save" id="wr-save" aria-live="polite">Saved</span>
      <button class="icon-btn" type="button" data-w="side" aria-label="Show or hide goals and notes" title="Goals, snapshots and notes">${icon("sliders")}</button>
    </div>
    <div class="wr-scroll" id="wr-scroll">
      <div class="wr-page">
        <input class="wr-chtitle" id="wr-cht" value="${esc(ch.title)}" aria-label="Chapter title" placeholder="Chapter title">
        <div class="wr-ed" id="wr-ed" contenteditable="true" spellcheck="true" role="textbox" aria-multiline="true" aria-label="Chapter text">${mdToHtml(data.text)}</div>
      </div>
    </div>
    <div class="wr-foot"><span id="wr-wc"></span><span id="wr-sess"></span>${W.sprint ? `<span class="wr-sprint" id="wr-sprint"></span>` : ""}</div>`;
  const ed = $("#wr-ed", main);
  W.ed = ed; W.edCh = ch;
  try { document.execCommand("defaultParagraphSeparator", false, "p"); } catch {}
  const paintCount = () => {
    const words = countWords(ed.innerText);
    const delta = words - W.baseWords;
    $("#wr-wc", main).textContent = `${words.toLocaleString()} words${ch.target ? ` of ${ch.target.toLocaleString()}` : ""} · ${Math.max(1, Math.round(words / 250))} min read`;
    $("#wr-sess", main).textContent = `This session: ${(W.session.words + Math.max(0, delta)).toLocaleString()} words · ${fmtMinutes((Date.now() - W.session.t) / 1000)}`;
    return { words, delta };
  };
  editorSave = debounce(async () => {
    await flushSave();
    const words = ch.words || 0;
    const s = $("#wr-save"); if (s) s.textContent = "Saved";
    const li = $(`#wr-chs [data-ch="${CSS.escape(ch.id)}"] em`); if (li) li.textContent = words.toLocaleString();
    paintGoal(view);
  }, 700);
  ed.addEventListener("input", () => {
    $("#wr-save").textContent = "Saving…";
    paintCount(); editorSave(); markCurrent(ed); if (W.typewriter) typewriter(ed);
  });
  ed.addEventListener("paste", (e) => {
    // paste as plain text, keeping paragraph breaks
    e.preventDefault();
    const t = (e.clipboardData || window.clipboardData).getData("text/plain");
    const html = t.split(/\n\s*\n/).map((p, i) => (i ? "<p>" : "") + esc(p).replace(/\n/g, "<br>") + (i ? "</p>" : "")).join("");
    document.execCommand("insertHTML", false, html);
  });
  ed.addEventListener("keydown", (e) => {
    const mod = e.metaKey || e.ctrlKey;
    if (mod && (e.key === "b" || e.key === "B")) { e.preventDefault(); fmt("bold"); }
    else if (mod && (e.key === "i" || e.key === "I")) { e.preventDefault(); fmt("italic"); }
    else if (mod && e.key === "s") { e.preventDefault(); flushSave().then(() => { const s = $("#wr-save"); if (s) s.textContent = "Saved"; toast("Saved."); }); }
    else if (mod && (e.key === "f" || e.key === "F") && !e.shiftKey) { e.preventDefault(); findReplace(ed); }
    else if (mod && e.shiftKey && (e.key === "f" || e.key === "F")) { e.preventDefault(); toggleFocus(view); }
    else if (e.key === "Tab") { e.preventDefault(); }
    // smart quotes and dashes, the way typeset books have them
    else if (e.key === '"' || e.key === "'") {
      e.preventDefault();
      const sel = getSelection(), r = sel.rangeCount && sel.getRangeAt(0);
      const before = r ? (r.startContainer.nodeType === 3 ? r.startContainer.nodeValue.slice(0, r.startOffset) : "") : "";
      const open = !before || /[\s(\[{—–-]$/.test(before);
      document.execCommand("insertText", false, e.key === '"' ? (open ? "“" : "”") : (open ? "‘" : "’"));
    } else if (e.key === "-") {
      const sel = getSelection(), r = sel.rangeCount && sel.getRangeAt(0);
      if (r && r.startContainer.nodeType === 3 && r.startContainer.nodeValue[r.startOffset - 1] === "-") {
        e.preventDefault();
        const n = r.startContainer, o = r.startOffset;
        n.nodeValue = n.nodeValue.slice(0, o - 1) + "—" + n.nodeValue.slice(o);
        const rr = document.createRange(); rr.setStart(n, o); rr.collapse(true); sel.removeAllRanges(); sel.addRange(rr);
        ed.dispatchEvent(new Event("input"));
      }
    }
  });
  $("#wr-cht", main).addEventListener("change", async (e) => { ch.title = e.target.value.trim() || ch.title; await saveProject(W.proj); drawNav(view); });
  paintCount();
  if (!countWords(data.text)) setTimeout(() => ed.focus(), 50);
  tickSprint(view);
}

function markCurrent(ed) {
  const sel = getSelection(); if (!sel.rangeCount) return;
  let n = sel.anchorNode; while (n && n.parentNode !== ed) n = n.parentNode;
  $$(".cur", ed).forEach((x) => x !== n && x.classList.remove("cur"));
  if (n?.nodeType === 1) n.classList.add("cur");
}
function typewriter(ed) {
  const sel = getSelection(); if (!sel.rangeCount) return;
  const r = sel.getRangeAt(0).getClientRects()[0]; if (!r) return;
  const sc = $("#wr-scroll"), sr = sc.getBoundingClientRect();
  sc.scrollBy({ top: r.top - (sr.top + sr.height * 0.45), behavior: "auto" });
  void ed;
}
function fmt(kind) {
  const ed = $("#wr-ed"); if (!ed) return;
  ed.focus();
  if (kind === "bold" || kind === "italic") document.execCommand(kind);
  else if (kind === "h2") document.execCommand("formatBlock", false, document.queryCommandValue("formatBlock") === "h2" ? "p" : "h2");
  else if (kind === "quote") document.execCommand("formatBlock", false, document.queryCommandValue("formatBlock") === "blockquote" ? "p" : "blockquote");
  else if (kind === "break") document.execCommand("insertHTML", false, "<hr><p><br></p>");
  ed.dispatchEvent(new Event("input"));
}
function toggleFocus(view) {
  W.focus = !W.focus;
  $("#wr", view).classList.toggle("wr-focus", W.focus);
  $("[data-w=focus]", view)?.setAttribute("aria-pressed", String(W.focus));
  if (W.focus) { markCurrent($("#wr-ed", view)); toast("Focus mode. Press ⌘⇧F to leave."); }
}

// ---------- right panel: goals, sprint, snapshots, notes ----------
async function drawSide(view) {
  const side = $("#wr-side", view), ch = W.ch, p = W.proj;
  const log = await writeLog();
  const days = Array.from({ length: 14 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - 13 + i); return { k: today(d), d }; });
  const max = Math.max(p.daily || 1, ...days.map((x) => log[x.k] || 0));
  side.innerHTML = `
    <section class="wr-card"><h4>Today</h4><div class="wr-goal" id="wr-goal"></div></section>
    <section class="wr-card"><h4>Last two weeks</h4>
      <div class="wr-chart" role="img" aria-label="Words written each day for the last 14 days">${days.map((x) => `<span title="${x.d.toLocaleDateString(undefined, { month: "short", day: "numeric" })}: ${(log[x.k] || 0).toLocaleString()} words"><i style="height:${Math.round(((log[x.k] || 0) / max) * 100)}%" class="${(log[x.k] || 0) >= (p.daily || Infinity) ? "hit" : ""}"></i></span>`).join("")}</div>
      <p class="hint">${icon("fire")} ${plural(writingStreak(log), "day")} writing in a row</p></section>
    <section class="wr-card"><h4>Sprint</h4>
      ${W.sprint ? `<p class="wr-sprint-big" id="wr-sprint-big"></p><button class="btn btn-sm" type="button" data-w="sprintstop">Stop the sprint</button>`
      : `<p class="hint">Write without stopping for a set time. No editing, just words.</p><div class="seg">${[10, 20, 30].map((n) => `<button type="button" data-sprint="${n}">${n} min</button>`).join("")}</div>`}</section>
    ${ch ? `<section class="wr-card"><h4>This chapter</h4>
      <div class="seg wr-status">${Object.entries(STATUS).map(([k, [n, c]]) => `<button type="button" data-status="${k}" aria-pressed="${(ch.status || "draft") === k}" style="--c:${c}">${n}</button>`).join("")}</div>
      <label class="lbl" for="wr-syn">Synopsis</label><textarea class="field" id="wr-syn" rows="3" placeholder="What happens in this chapter, in a line or two">${esc(ch.synopsis || "")}</textarea>
      <div class="wr-chbtns"><button class="btn btn-sm" type="button" data-w="snap">${icon("bookmark")}Take a snapshot</button>
        <button class="btn btn-sm btn-ghost" type="button" data-w="delch" style="color:var(--bad)">${icon("trash")}Delete chapter</button></div>
      ${W.text?.snaps?.length ? `<h4 style="margin-top:12px">Snapshots</h4><div class="wr-snaps">${W.text.snaps.slice().reverse().map((s, i) => `<div class="wr-snap"><span><strong>${new Date(s.t).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</strong><small>${s.words.toLocaleString()} words${s.label ? ` · ${esc(s.label)}` : ""}</small></span><button class="btn btn-sm" type="button" data-restore="${W.text.snaps.length - 1 - i}">Restore</button></div>`).join("")}</div>` : ""}
    </section>` : ""}
    <section class="wr-card"><h4>Share it</h4>
      <div class="wr-chbtns"><button class="btn btn-sm btn-accent" type="button" data-w="publish">${icon("upload")}${p.itemId && getItem(p.itemId) ? "Update on my shelf" : "Publish to my shelf"}</button>
        <button class="btn btn-sm" type="button" data-w="epub">${icon("download")}EPUB</button><button class="btn btn-sm" type="button" data-w="md">${icon("download")}Markdown</button><button class="btn btn-sm" type="button" data-w="zine">Make a zine</button></div></section>`;
  paintGoal(view);
  $("#wr-syn", side)?.addEventListener("change", async (e) => { ch.synopsis = e.target.value.trim(); await saveProject(p); });
}
async function paintGoal(view) {
  const host = $("#wr-goal", view); if (!host) return;
  const log = await writeLog(), done = log[today()] || 0, goal = W.proj.daily || 0;
  const pct = goal ? Math.min(1, done / goal) : 0, R = 30, C = 2 * Math.PI * R;
  host.innerHTML = `<svg viewBox="0 0 76 76" class="wr-ring" aria-hidden="true"><circle cx="38" cy="38" r="${R}" class="bg"/><circle cx="38" cy="38" r="${R}" class="fg" style="stroke-dasharray:${C};stroke-dashoffset:${C * (1 - pct)}"/></svg>
    <div><strong>${done.toLocaleString()}</strong><span>${goal ? `of ${goal.toLocaleString()} words${done >= goal ? " · goal met" : ""}` : "words today"}</span></div>`;
  if (goal && done >= goal && !W.celebrated && W.session.words > 0) { W.celebrated = true; toast(`Daily goal reached: ${done.toLocaleString()} words. Lovely work.`); }
}

let sprintT = 0;
function tickSprint(view) {
  clearInterval(sprintT);
  if (!W.sprint) return;
  const paint = () => {
    const left = Math.max(0, W.sprint.end - Date.now()), m = Math.floor(left / 60000), s = Math.floor((left % 60000) / 1000);
    const txt = `${m}:${String(s).padStart(2, "0")} · ${W.sprint.words.toLocaleString()} words`;
    const a = $("#wr-sprint", view), b = $("#wr-sprint-big", view);
    if (a) a.textContent = "Sprint " + txt; if (b) b.textContent = txt;
    if (!left) {
      const w = W.sprint.words, mins = W.sprint.mins; W.sprint = null; clearInterval(sprintT);
      toast(`Sprint done: ${w.toLocaleString()} words in ${mins} minutes${w ? ` (${Math.round(w / mins)} a minute)` : ""}.`, { ms: 8000 });
      drawSide(view); $("#wr-sprint", view)?.remove();
    }
  };
  paint(); sprintT = setInterval(paint, 1000);
}

// ---------- actions ----------
async function onClick(e, view) {
  const t = e.target.closest("button, [data-tab]"); if (!t) return;
  const p = W.proj;
  if (t.dataset.tab) { W.tab = t.dataset.tab; drawNav(view); if (W.tab === "outline") openBoard(view); if (W.tab === "bible") openBible(view); return; }
  if (t.dataset.ch) { await flushSave(); W.ch = p.chapters.find((c) => c.id === t.dataset.ch); p.last = W.ch.id; await saveProject(p); drawNav(view); await drawMain(view); drawSide(view); return; }
  if (t.dataset.fmt) return fmt(t.dataset.fmt);
  if (t.dataset.status) { W.ch.status = t.dataset.status; await saveProject(p); drawNav(view); drawSide(view); return; }
  if (t.dataset.sprint) { W.sprint = { end: Date.now() + Number(t.dataset.sprint) * 60000, words: 0, mins: Number(t.dataset.sprint) }; await drawMain(view); drawSide(view); $("#wr-ed", view)?.focus(); return; }
  if (t.dataset.restore != null) {
    const s = W.text.snaps[Number(t.dataset.restore)]; if (!s) return;
    await flushSave();
    W.text.snaps.push({ t: Date.now(), text: W.text.text, words: countWords(W.text.text), label: "before restoring" });
    W.text.text = s.text; W.ch.words = s.words;
    await putText(W.ch.id, W.text); await saveProject(p);
    await drawMain(view); drawSide(view); drawNav(view);
    toast("Restored. What you had before is kept as a snapshot too.");
    return;
  }
  const a = t.dataset.w; if (!a) return;
  if (a === "nav") { $("#wr", view).classList.toggle("wr-nonav"); return; }
  if (a === "side") { W.side = !W.side; $("#wr", view).classList.toggle("wr-noside", !W.side); return; }
  if (a === "focus") return toggleFocus(view);
  if (a === "type") { W.typewriter = !W.typewriter; t.setAttribute("aria-pressed", String(W.typewriter)); toast(W.typewriter ? "Typewriter scrolling on." : "Typewriter scrolling off."); return; }
  if (a === "find") return findReplace($("#wr-ed", view));
  if (a === "listen") return listen(t);
  if (a === "addch") {
    await flushSave();
    const ch = { id: uid("wc-"), title: `Chapter ${p.chapters.length + 1}`, status: "draft", synopsis: "", words: 0 };
    const at = p.chapters.findIndex((c) => c.id === W.ch?.id);
    p.chapters.splice(at + 1, 0, ch); W.ch = ch; p.last = ch.id;
    await saveProject(p); drawNav(view); await drawMain(view); drawSide(view);
    $("#wr-cht", view)?.select();
    return;
  }
  if (a === "delch") {
    if (p.chapters.length <= 1) return toast("A project needs at least one chapter.");
    const ok = await confirmBox(`Delete “${W.ch.title}”?`, `Its ${plural(W.ch.words || 0, "word")} and snapshots are removed. This can't be undone.`, "Delete chapter");
    if (!ok) return;
    const i = p.chapters.findIndex((c) => c.id === W.ch.id);
    p.chapters.splice(i, 1); await kvSet("write:" + W.ch.id, null);
    W.ch = p.chapters[Math.max(0, i - 1)]; p.last = W.ch.id;
    await saveProject(p); drawNav(view); await drawMain(view); drawSide(view);
    return;
  }
  if (a === "snap") {
    await flushSave();
    W.text.snaps = [...(W.text.snaps || []), { t: Date.now(), text: W.text.text, words: countWords(W.text.text) }].slice(-30);
    await putText(W.ch.id, W.text); drawSide(view); toast("Snapshot taken. Restore it any time from this panel.");
    return;
  }
  if (a === "sprintstop") { W.sprint.end = Date.now(); return; }
  if (a === "proj") return projectSettings(view);
  if (a === "board") return openBoard(view);
  if (a === "biblefull") return openBible(view);
  if (a === "zine") { const C = await import("../plus/core.js"), txt = (c) => { const v = Object.entries(c).filter(([k, x]) => typeof x === "string" && !["id", "title", "note", "summary", "status"].includes(k)).map(([, x]) => x).sort((p, q) => q.length - p.length)[0] || ""; return new DOMParser().parseFromString(v, "text/html").body.textContent; }; C.zineInbox.text = W.proj.chapters.map(txt).join("\n\n").slice(0, 5200); location.hash = "plus/zine"; return; }
  if (a === "publish") return publish(view);
  if (a === "epub") return exportEpub();
  if (a === "md") return exportMd();
}
async function flushSave() {
  const ed = W.ed, ch = W.edCh;
  if (!ed || !ch || !W.text) return;
  const md = htmlToMd(ed);
  if (md === W.text.text) return;
  const words = countWords(md), delta = words - W.baseWords;
  if (delta > 0) { await logWords(delta); W.session.words += delta; if (W.sprint) W.sprint.words += delta; }
  W.baseWords = words; W.text.text = md; ch.words = words;
  await putText(ch.id, W.text); await saveProject(W.proj);
}

function listen(btn) {
  if (!("speechSynthesis" in window)) return toast("Reading aloud isn't available in this browser.");
  if (speechSynthesis.speaking) { speechSynthesis.cancel(); btn.setAttribute("aria-pressed", "false"); return; }
  const ed = $("#wr-ed"), sel = getSelection()?.toString().trim();
  const u = new SpeechSynthesisUtterance(sel || ed.innerText);
  u.onend = () => btn.setAttribute("aria-pressed", "false");
  speechSynthesis.speak(u); btn.setAttribute("aria-pressed", "true");
  toast(sel ? "Reading your selection." : "Reading the chapter. Tap again to stop.");
}

function findReplace(ed) {
  const m = modal({ title: "Find and replace", body: `<form class="form" id="fr">
      <div class="row2"><div><label class="lbl" for="fr-a">Find</label><input class="field" id="fr-a" required autofocus value="${esc(getSelection()?.toString() || "")}"></div>
        <div><label class="lbl" for="fr-b">Replace with</label><input class="field" id="fr-b"></div></div>
      <label class="check"><input type="checkbox" id="fr-case"> Match case</label><label class="check"><input type="checkbox" id="fr-word" checked> Whole words only</label>
      <label class="check"><input type="checkbox" id="fr-all"> In every chapter</label>
      <p class="status" id="fr-s"></p></form>`,
    actions: `<button class="btn" type="button" data-close>Close</button><button class="btn" type="button" id="fr-count">Count</button><button class="btn btn-accent" form="fr">Replace all</button>` });
  const re = () => {
    const a = $("#fr-a", m.root).value; if (!a) return null;
    const src = a.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp($("#fr-word", m.root).checked ? `(?<![\\p{L}\\p{N}])${src}(?![\\p{L}\\p{N}])` : src, "gu" + ($("#fr-case", m.root).checked ? "" : "i"));
  };
  const chapters = async () => $("#fr-all", m.root).checked ? W.proj.chapters : [W.ch];
  $("#fr-count", m.root).onclick = async () => {
    const r = re(); if (!r) return; await flushSave();
    let n = 0; for (const c of await chapters()) n += ((await getText(c.id)).text.match(r) || []).length;
    $("#fr-s", m.root).textContent = `${plural(n, "match", "matches")}.`;
  };
  $("#fr", m.root).onsubmit = async (e) => {
    e.preventDefault();
    const r = re(); if (!r) return; await flushSave();
    const to = $("#fr-b", m.root).value; let n = 0;
    for (const c of await chapters()) {
      const d = await getText(c.id), k = (d.text.match(r) || []).length; if (!k) continue;
      d.snaps = [...(d.snaps || []), { t: Date.now(), text: d.text, words: countWords(d.text), label: "before replace" }].slice(-30);
      d.text = d.text.replace(r, to); c.words = countWords(d.text); n += k;
      await putText(c.id, d);
    }
    await saveProject(W.proj);
    $("#fr-s", m.root).textContent = n ? `Replaced ${plural(n, "match", "matches")}. A snapshot of each changed chapter was kept.` : "Nothing matched.";
    const view = $("#view"); W.text = await getText(W.ch.id); await drawMain(view); drawNav(view); drawSide(view);
  };
  void ed;
}

function projectSettings(view) {
  const p = W.proj;
  const m = modal({ title: "Project settings", body: `<form class="form" id="ps">
    <div><label class="lbl" for="ps-t">Title</label><input class="field" id="ps-t" required value="${esc(p.title)}"></div>
    <div class="row2"><div><label class="lbl" for="ps-c">Pen name</label><input class="field" id="ps-c" value="${esc(p.creator || "")}"></div>
      <div><label class="lbl" for="ps-g">Kind of story</label><input class="field" id="ps-g" value="${esc(p.genre || "")}"></div></div>
    <div class="row2"><div><label class="lbl" for="ps-w">Word target</label><input class="field" id="ps-w" type="number" min="0" step="1000" value="${p.target || ""}"></div>
      <div><label class="lbl" for="ps-d">Daily goal</label><input class="field" id="ps-d" type="number" min="0" step="50" value="${p.daily || ""}"></div></div>
    <div><label class="lbl" for="ps-b">Blurb</label><textarea class="field" id="ps-b" rows="3">${esc(p.blurb || "")}</textarea></div></form>
    <hr class="sep"><button class="btn btn-sm btn-ghost" type="button" id="ps-del" style="color:var(--bad)">${icon("trash")}Delete this project</button>`,
    actions: `<button class="btn" type="button" data-close>Cancel</button><button class="btn btn-accent" form="ps">Save</button>` });
  $("#ps", m.root).onsubmit = async (e) => {
    e.preventDefault();
    Object.assign(p, { title: $("#ps-t", m.root).value.trim(), creator: $("#ps-c", m.root).value.trim(), genre: $("#ps-g", m.root).value.trim(), target: Number($("#ps-w", m.root).value) || 0, daily: Number($("#ps-d", m.root).value) || 0, blurb: $("#ps-b", m.root).value.trim() });
    await saveProject(p); m.close(); drawNav(view); drawSide(view);
    setCrumbs([["Create", "create"], ["Writing studio", "write"], [p.title, ""]]);
  };
  $("#ps-del", m.root).onclick = async () => {
    if (!(await confirmBox(`Delete “${p.title}”?`, `All ${plural(p.chapters.length, "chapter")}, snapshots and notes are removed from this device. Anything you published to your shelf stays there.`, "Delete project"))) return;
    for (const c of p.chapters) await kvSet("write:" + c.id, null);
    const all = { ...((await kvGet("writeProjects", {})) || {}) }; delete all[p.id]; await kvSet("writeProjects", all);
    m.close(); location.hash = "write";
  };
}

// ---------- outline corkboard ----------
function openBoard(view) {
  const p = W.proj;
  const m = modal({ title: `Outline · ${p.title}`, wide: true, body: `<p class="hint" style="margin-top:0">Drag cards to reorder chapters. Click a card's text to edit its synopsis; tap Open to write it.</p><div class="wr-board" id="wr-board"></div>` });
  const draw = () => {
    $("#wr-board", m.root).innerHTML = p.chapters.map((c, i) => `<article class="wr-card-ix" draggable="true" data-i="${i}" style="--c:${STATUS[c.status || "draft"][1]}">
      <header><span class="wr-n">${i + 1}</span><strong>${esc(c.title)}</strong><em>${STATUS[c.status || "draft"][0]}</em></header>
      <textarea class="wr-ix-syn" data-syn="${i}" rows="4" placeholder="What happens here?" aria-label="Synopsis of ${esc(c.title)}">${esc(c.synopsis || "")}</textarea>
      <footer><small>${(c.words || 0).toLocaleString()} words</small><button class="btn btn-sm" type="button" data-open="${esc(c.id)}">Open</button></footer></article>`).join("")
      + `<button class="wr-card-ix wr-card-add" type="button" data-addcard>${icon("plus")}Add a chapter</button>`;
  };
  draw();
  const board = $("#wr-board", m.root);
  let from = -1;
  board.addEventListener("dragstart", (e) => { const c = e.target.closest("[data-i]"); if (c) { from = Number(c.dataset.i); c.classList.add("drag"); } });
  board.addEventListener("dragend", (e) => e.target.closest?.("[data-i]")?.classList.remove("drag"));
  board.addEventListener("dragover", (e) => e.preventDefault());
  board.addEventListener("drop", async (e) => {
    e.preventDefault(); const c = e.target.closest("[data-i]"); if (!c || from < 0) return;
    const to = Number(c.dataset.i); if (to === from) return;
    const [x] = p.chapters.splice(from, 1); p.chapters.splice(to, 0, x); from = -1;
    await saveProject(p); draw(); drawNav(view);
  });
  board.addEventListener("change", async (e) => { const s = e.target.closest("[data-syn]"); if (s) { p.chapters[Number(s.dataset.syn)].synopsis = s.value.trim(); await saveProject(p); if (W.ch === p.chapters[Number(s.dataset.syn)]) drawSide(view); } });
  board.addEventListener("click", async (e) => {
    const o = e.target.closest("[data-open]");
    if (o) { m.close(); await flushSave(); W.ch = p.chapters.find((c) => c.id === o.dataset.open); W.tab = "chapters"; drawNav(view); await drawMain(view); drawSide(view); return; }
    if (e.target.closest("[data-addcard]")) { p.chapters.push({ id: uid("wc-"), title: `Chapter ${p.chapters.length + 1}`, status: "idea", synopsis: "", words: 0 }); await saveProject(p); draw(); drawNav(view); }
  });
}

// ---------- story bible ----------
async function mentionCounts(names) {
  const texts = []; for (const c of W.proj.chapters) texts.push((await getText(c.id)).text);
  const all = texts.join("\n");
  return names.map((n) => {
    const first = n.trim().split(/\s+/)[0]; if (!first) return 0;
    const r = new RegExp(`(?<![\\p{L}])${first.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\p{L}])`, "gu");
    return (all.match(r) || []).length;
  });
}
async function openBible(view) {
  const p = W.proj; p.bible ||= [];
  await flushSave();
  const m = modal({ title: `Story bible · ${p.title}`, wide: true, body: `<div class="toolbar" style="margin:0 0 12px">${Object.entries(BIBLE).map(([k, l]) => `<button class="btn btn-sm" type="button" data-addb="${k}">${icon("plus")}${l}</button>`).join("")}</div><div class="wr-bible" id="wr-bible"></div>` });
  const draw = async () => {
    const counts = await mentionCounts(p.bible.map((b) => b.name));
    $("#wr-bible", m.root).innerHTML = p.bible.length ? p.bible.map((b, i) => `<article class="wr-bcard k-${b.kind}">
      <header><span class="wr-bk">${BIBLE[b.kind]}</span><input class="wr-bname" data-bf="name" data-bi="${i}" value="${esc(b.name)}" placeholder="Name" aria-label="Name"><em title="Mentions in your chapters">${counts[i] ? `${counts[i]}×` : "not yet in the text"}</em></header>
      <input class="field" data-bf="role" data-bi="${i}" value="${esc(b.role || "")}" placeholder="${b.kind === "character" ? "Role: hero, rival, mentor…" : b.kind === "place" ? "Where it is, what it's like" : "In a few words"}" aria-label="Role">
      <textarea class="field" data-bf="notes" data-bi="${i}" rows="4" placeholder="Looks, voice, history, secrets…" aria-label="Notes">${esc(b.notes || "")}</textarea>
      <button class="btn btn-sm btn-ghost" type="button" data-delb="${i}" style="color:var(--bad);justify-self:start">${icon("trash")}Remove</button></article>`).join("")
      : `<p class="hint">Nothing yet. Add your characters and places so their details are always one tap away.</p>`;
  };
  await draw();
  m.root.addEventListener("click", async (e) => {
    const a = e.target.closest("[data-addb]");
    if (a) { p.bible.unshift({ id: uid("wb-"), kind: a.dataset.addb, name: "", role: "", notes: "" }); await saveProject(p); await draw(); $("[data-bf=name]", m.root)?.focus(); return; }
    const d = e.target.closest("[data-delb]");
    if (d) { p.bible.splice(Number(d.dataset.delb), 1); await saveProject(p); await draw(); }
  });
  m.root.addEventListener("change", async (e) => { const f = e.target.closest("[data-bf]"); if (!f) return; p.bible[Number(f.dataset.bi)][f.dataset.bf] = f.value.trim(); await saveProject(p); if (f.dataset.bf === "name") draw(); });
  void view;
}

// ---------- publishing ----------
async function manuscript() {
  await flushSave();
  const parts = [];
  for (const c of W.proj.chapters) {
    const t = (await getText(c.id)).text.trim();
    parts.push(`# ${c.title}\n\n${t.replace(/^## /gm, "")}`);
  }
  return parts.join("\n\n");
}
async function publish(view) {
  const p = W.proj, { LICENSES } = await import("./create.js");
  const existing = p.itemId && getItem(p.itemId);
  const m = modal({ title: existing ? "Update on your shelf" : "Publish to your shelf", body: `<form class="form" id="pb">
    <div class="row2"><div><label class="lbl" for="pb-c">Pen name</label><input class="field" id="pb-c" required value="${esc(p.creator || localStorage.getItem("kitsune.creatorName") || "")}"></div>
      <div><label class="lbl" for="pb-l">Licence</label><select class="field" id="pb-l">${Object.entries(LICENSES).map(([k, [n]]) => `<option value="${k}" ${(p.license || "arr") === k ? "selected" : ""}>${n}</option>`).join("")}</select></div></div>
    <p class="hint">${plural(p.chapters.length, "chapter")}, ${p.chapters.reduce((a, c) => a + (c.words || 0), 0).toLocaleString()} words. ${existing ? "The copy on your shelf is replaced with this version; reading positions may shift." : "It appears in your library like any book, with your name and licence."}</p></form>`,
    actions: `<button class="btn" type="button" data-close>Cancel</button><button class="btn btn-accent" form="pb">${existing ? "Update" : "Publish"}</button>` });
  $("#pb", m.root).onsubmit = async (e) => {
    e.preventDefault();
    p.creator = $("#pb-c", m.root).value.trim(); p.license = $("#pb-l", m.root).value;
    try { localStorage.setItem("kitsune.creatorName", p.creator); } catch {}
    const text = await manuscript();
    const work = { creator: p.creator, license: p.license, created: existing?.work?.created || Math.floor(Date.now() / 1000) };
    const item = existing
      ? Object.assign(existing, { title: p.title, author: p.creator, description: p.blurb || "", source: { kind: "text", text }, work })
      : { id: uid("v-"), type: "book", title: p.title, author: p.creator, description: p.blurb || "", source: { kind: "text", text }, work, origin: "Made in Writing studio", tags: ["my works"], status: "unread", rating: 0, link: null, added: Math.floor(Date.now() / 1000) };
    await saveItem(item);
    p.itemId = item.id; await saveProject(p);
    m.close(); drawSide(view);
    toast(existing ? `Updated “${p.title}” on your shelf.` : `Published “${p.title}” to your shelf.`, { action: "Read it", onAction: async () => (await import("./common.js")).openItem(item) });
  };
}
async function exportEpub() {
  const p = W.proj, { packText } = await import("./create.js");
  const file = await packText({ title: p.title, description: p.blurb || "", work: { creator: p.creator || "Anonymous", license: p.license || "arr", created: Math.floor(p.created / 1000) }, source: { text: await manuscript() } });
  download(file, file.name); toast("EPUB saved. It opens in Kitsune, Apple Books, Kobo and most readers.");
}
async function exportMd() {
  const p = W.proj, text = `# ${p.title}\n\n${p.creator ? `by ${p.creator}\n\n` : ""}${(await manuscript()).replace(/^# /gm, "## ")}`;
  download(new Blob([text], { type: "text/markdown" }), `${p.title.replace(/[^\w\s-]/g, "").trim() || "manuscript"}.md`);
}
function download(blob, name) {
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name;
  document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 20_000);
}

// Leaving the page saves what's in the editor (it works from the editor we kept, even once the view has changed).
addEventListener("hashchange", () => { flushSave().then(() => { if (!W.ed?.isConnected) { W.ed = null; W.edCh = null; } }); });
addEventListener("pagehide", () => { flushSave(); });
document.addEventListener("selectionchange", () => { if (W.ed?.isConnected && W.focus) markCurrent(W.ed); });
