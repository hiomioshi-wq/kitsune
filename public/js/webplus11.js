// Kitsune Browser, v120:
//  - "Search everything I've read": a private full-text index of the pages you've opened, kept on this device
//  - earlier sets of tabs: the browser quietly keeps a few snapshots of your open tabs, so a closed set can come back
//  - open every link in the clipboard (or in the selected text) at once
//  - bookmarks as Markdown, and bookmarks in from a CSV (Pocket, Raindrop, Chrome exports)
//  - an offline / back-online notice, "reuse a tab that already has the page", and the most-used words on a page
import { $, esc, toast, modal } from "./util.js";
import { kvGet, kvSet } from "./store.js";

const on = (k) => localStorage.getItem(k) === "1";
const flip = (k) => { const v = !on(k); try { v ? localStorage.setItem(k, "1") : localStorage.removeItem(k); } catch {} return v; };
const hostOf = (u) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return ""; } };
const download = (name, text, type = "text/plain") => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 3000); };

// ================= full-text index of pages you've read =================
const INDEX_MAX = 400, TEXT_MAX = 6000;
let index = null, dirty = false, saveT = null;
async function loadIndex() { if (!index) index = (await kvGet("webTextIndex", [])) || []; return index; }
function persistIndex() { if (!dirty) return; dirty = false; kvSet("webTextIndex", index); }
export async function indexPage(t, { priv = false } = {}) {
  if (priv || !t?.url || !/^https?:/.test(t.url) || on("kitsune.webNoIndex")) return;
  const doc = t.doc; const body = doc?.body; if (!body) return;
  const clone = body.cloneNode(true); clone.querySelectorAll("script,style,noscript,nav,footer,header,aside,form,svg,[aria-hidden=true]").forEach((n) => n.remove());
  const text = (clone.textContent || "").replace(/\s+/g, " ").trim(); if (text.length < 200) return;
  await loadIndex(); const u = t.url.replace(/#.*$/, "");
  const entry = { u, title: (t.title || hostOf(u)).slice(0, 140), h: hostOf(u), t: Date.now(), x: text.slice(0, TEXT_MAX), n: text.length };
  const at = index.findIndex((e) => e.u === u); if (at >= 0) index.splice(at, 1);
  index.unshift(entry); if (index.length > INDEX_MAX) index.length = INDEX_MAX;
  dirty = true; clearTimeout(saveT); saveT = setTimeout(persistIndex, 20_000);
}
addEventListener("visibilitychange", () => { if (document.hidden) persistIndex(); });
function searchIndex(q) {
  const terms = q.toLowerCase().split(/\s+/).filter((w) => w.length > 1); if (!terms.length) return [];
  const out = [];
  for (const e of index) {
    const lt = e.title.toLowerCase(), lx = e.x.toLowerCase(); let score = 0, ok = true;
    for (const w of terms) { const inT = lt.includes(w), c = lx.split(w).length - 1; if (!inT && !c && !e.h.includes(w)) { ok = false; break; } score += (inT ? 6 : 0) + Math.min(c, 8) + (e.h.includes(w) ? 2 : 0); }
    if (!ok) continue;
    const at = lx.indexOf(terms.find((w) => lx.includes(w)) || terms[0]); const a = Math.max(0, at - 60);
    out.push({ e, score: score + (Date.now() - e.t < 7 * 864e5 ? 1 : 0), snip: at < 0 ? e.x.slice(0, 160) : (a ? "…" : "") + e.x.slice(a, a + 200) + "…" });
  }
  return out.sort((a, b) => b.score - a.score).slice(0, 40);
}
async function searchEverything(go) {
  await loadIndex();
  const m = modal({ title: "Search everything I've read", wide: true, body: `<input class="field" id="se-q" type="search" placeholder="A word or phrase from any page you've opened" autocomplete="off" style="width:100%"><p class="hint" id="se-s">${index.length} pages remembered on this device. Pages from sites you're signed in to, and private browsing, are never remembered.</p><div id="se-r" style="max-height:60vh;overflow:auto"></div><p><button class="btn btn-sm" type="button" id="se-clear">Forget all of it</button></p>` });
  const q = $("#se-q", m.root); setTimeout(() => q.focus(), 40);
  const hl = (s, terms) => esc(s).replace(new RegExp("(" + terms.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|") + ")", "gi"), "<mark>$1</mark>");
  let tm; q.oninput = () => { clearTimeout(tm); tm = setTimeout(() => { const v = q.value.trim(), r = searchIndex(v), terms = v.toLowerCase().split(/\s+/).filter((w) => w.length > 1);
    $("#se-s", m.root).textContent = v ? `${r.length} page${r.length === 1 ? "" : "s"} match` : `${index.length} pages remembered on this device.`;
    $("#se-r", m.root).innerHTML = r.map(({ e, snip }) => `<button type="button" data-u="${esc(e.u)}" class="btn" style="display:block;width:100%;text-align:left;margin-bottom:6px;white-space:normal"><b>${hl(e.title, terms)}</b> <small class="muted">${esc(e.h)} · ${new Date(e.t).toLocaleDateString()}</small><div style="font-size:13px;opacity:.8">${hl(snip, terms)}</div></button>`).join(""); }, 160); };
  m.root.onclick = (e) => { const b = e.target.closest("[data-u]"); if (b) { m.close(); go(b.dataset.u, { newTab: true }); } };
  $("#se-clear", m.root).onclick = async () => { index = []; dirty = true; persistIndex(); q.oninput(); toast("Forgot every remembered page."); };
}

// ================= earlier sets of tabs =================
let snapTimer = null, lastSnapKey = "";
async function snapshot(B) {
  const urls = B.tabs.filter((t) => t.url).map((t) => ({ u: t.url, t: t.custom || t.title || "", p: !!t.pinned })); if (!urls.length) return;
  const key = urls.map((x) => x.u).join("|"); if (key === lastSnapKey) return; lastSnapKey = key;
  const all = (await kvGet("webTabSnaps", [])) || [];
  if (all[0] && all[0].k === key) return;
  all.unshift({ k: key, at: Date.now(), tabs: urls.slice(0, 60) }); all.length = Math.min(all.length, 10);
  kvSet("webTabSnaps", all);
}
function startSnaps(B) { if (snapTimer) return; snapTimer = setInterval(() => { if (!document.hidden && B.view?.isConnected) snapshot(B); }, 120_000); setTimeout(() => snapshot(B), 15_000); }
async function earlierTabs(go) {
  const all = (await kvGet("webTabSnaps", [])) || []; if (!all.length) return toast("Nothing saved yet. Kitsune snapshots your tabs every couple of minutes while you browse.");
  const m = modal({ title: "Earlier sets of tabs", wide: true, body: `<p class="hint" style="margin-top:0">Kitsune quietly keeps your last ${all.length} sets of open tabs. Open one to bring them back as new tabs.</p>${all.map((s, i) => `<div style="padding:10px 0;border-bottom:1px solid rgba(127,127,160,.25)"><b>${new Date(s.at).toLocaleString(undefined, { weekday: "short", hour: "numeric", minute: "2-digit" })}</b> <span class="muted">· ${s.tabs.length} tab${s.tabs.length === 1 ? "" : "s"}</span><div class="muted" style="font-size:13px;margin:3px 0 6px">${s.tabs.slice(0, 6).map((t) => esc((t.t || hostOf(t.u)).slice(0, 36))).join(" · ")}${s.tabs.length > 6 ? " …" : ""}</div><button class="btn btn-sm" type="button" data-s="${i}">Open these tabs</button></div>`).join("")}` });
  m.root.onclick = async (e) => { const b = e.target.closest("[data-s]"); if (!b) return; const s = all[+b.dataset.s]; m.close(); for (const t of s.tabs) await go(t.u, { newTab: true }); toast(`Opened ${s.tabs.length} tabs.`); };
}

// ================= open many links at once =================
const URL_RE = /https?:\/\/[^\s<>"')\]]+/gi;
function openMany(urls, go, title) {
  const uniq = [...new Set(urls.map((u) => u.replace(/[.,;:!?]+$/, "")))].slice(0, 60); if (!uniq.length) return toast("No links found.");
  const m = modal({ title: `${title} (${uniq.length})`, wide: true, body: `<div style="margin-bottom:8px"><button class="btn btn-sm" type="button" id="om-all">All</button> <button class="btn btn-sm" type="button" id="om-none">None</button></div><div style="max-height:50vh;overflow:auto">${uniq.map((u, i) => `<label class="check" style="display:flex;gap:8px;word-break:break-all"><input type="checkbox" data-i="${i}" ${i < 12 ? "checked" : ""}> <span>${esc(u)}</span></label>`).join("")}</div><p class="hint">Opening many pages at once can be slow, so the first twelve are ticked.</p>`, actions: `<button class="btn" type="button" data-close>Cancel</button><button class="btn btn-accent" type="button" id="om-go">Open ticked links</button>` });
  $("#om-all", m.root).onclick = () => m.root.querySelectorAll("[data-i]").forEach((c) => (c.checked = true)); $("#om-none", m.root).onclick = () => m.root.querySelectorAll("[data-i]").forEach((c) => (c.checked = false));
  $("#om-go", m.root).onclick = async () => { const pick = [...m.root.querySelectorAll("[data-i]:checked")].map((c) => uniq[+c.dataset.i]); m.close(); for (const u of pick) await go(u, { newTab: true }); toast(`Opened ${pick.length} pages.`); };
}
async function clipboardLinks(go) {
  let text = ""; try { text = await Promise.race([navigator.clipboard.readText(), new Promise((_, r) => setTimeout(() => r(), 900))]); } catch { return toast("Couldn't read the clipboard. Allow clipboard access, or paste into the address bar."); }
  openMany(text.match(URL_RE) || [], go, "Links in your clipboard");
}

// ================= bookmarks in and out =================
async function bookmarksAsMarkdown() {
  const list = (await kvGet("webBookmarks", [])) || []; if (!list.length) return toast("You have no bookmarks yet.");
  const tags = (await kvGet("webTags", {})) || {}; const byHost = new Map();
  for (const b of list) { const h = hostOf(b.url) || "other"; (byHost.get(h) || byHost.set(h, []).get(h)).push(b); }
  let md = `# Bookmarks\n\n${list.length} pages, exported ${new Date().toLocaleDateString()}\n\n`;
  for (const [h, bs] of [...byHost.entries()].sort((a, b) => b[1].length - a[1].length)) { md += `## ${h}\n\n`; for (const b of bs) { const t = tags[b.url]; md += `- [${(b.title || b.url).replace(/[\[\]]/g, "")}](${b.url})${t?.length ? " " + t.map((x) => "#" + String(x).replace(/\s+/g, "-")).join(" ") : ""}\n`; } md += "\n"; }
  download("kitsune-bookmarks.md", md, "text/markdown"); toast(`Saved ${list.length} bookmarks as Markdown.`);
}
function csvRows(text) { const rows = []; let row = [], cell = "", q = false; for (let i = 0; i < text.length; i++) { const c = text[i]; if (q) { if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') q = false; else cell += c; } else if (c === '"') q = true; else if (c === ",") { row.push(cell); cell = ""; } else if (c === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; } else if (c !== "\r") cell += c; } if (cell || row.length) { row.push(cell); rows.push(row); } return rows; }
function importCsv() {
  const inp = document.createElement("input"); inp.type = "file"; inp.accept = ".csv,text/csv";
  inp.onchange = async () => {
    try {
      const rows = csvRows(await inp.files[0].text()).filter((r) => r.some((c) => c.trim())); if (rows.length < 2) return toast("That file has no rows.");
      const head = rows[0].map((h) => h.trim().toLowerCase()), ui = head.findIndex((h) => /^(url|link|href|address)$/.test(h)), ti = head.findIndex((h) => /^(title|name)$/.test(h));
      if (ui < 0) return toast("Couldn't find a url column. The first row should name the columns, like url,title.");
      const list = (await kvGet("webBookmarks", [])) || [], have = new Set(list.map((b) => b.url)); let n = 0;
      for (const r of rows.slice(1)) { const u = (r[ui] || "").trim(); if (!/^https?:\/\//i.test(u) || have.has(u)) continue; list.unshift({ url: u, title: (ti >= 0 && r[ti]?.trim()) || hostOf(u), t: Date.now() }); have.add(u); n++; }
      await kvSet("webBookmarks", list); toast(n ? `Added ${n} bookmarks.` : "Nothing new to add: they're all bookmarked already.");
    } catch (e) { toast(e.message); }
  };
  inp.click();
}

// ================= words on this page =================
const STOP = new Set("the of and to a in is that it for as with was on be by this are at from or an have not but they his her you all were we their which has had one can will its more about if there would what when so out up who said been also than into them some only other new these two may then like over such no my your our after how any those most just do does did could should while where between because very".split(" "));
function topWords(t) {
  const text = (t.doc?.body?.textContent || "").toLowerCase(); if (text.length < 100) return toast("Open a page with some text first.");
  const counts = new Map(); for (const w of text.match(/[\p{L}][\p{L}'’-]{2,}/gu) || []) { if (STOP.has(w) || /^\d/.test(w)) continue; counts.set(w, (counts.get(w) || 0) + 1); }
  const top = [...counts.entries()].filter(([, c]) => c > 1).sort((a, b) => b[1] - a[1]).slice(0, 40); if (!top.length) return toast("No repeated words to show.");
  const max = top[0][1], total = [...counts.values()].reduce((a, b) => a + b, 0);
  modal({ title: "Most-used words on this page", body: `<p class="hint" style="margin-top:0">${total.toLocaleString()} words counted (common words left out).</p>${top.map(([w, c]) => `<div style="display:flex;gap:8px;align-items:center;margin:3px 0"><span style="width:9em;overflow:hidden;text-overflow:ellipsis">${esc(w)}</span><span style="flex:1;height:12px;background:rgba(127,127,160,.2);border-radius:6px;overflow:hidden"><i style="display:block;height:100%;width:${(c / max) * 100}%;background:var(--accent,#f2a03f)"></i></span><b style="width:3em;text-align:right">${c}</b></div>`).join("")}` });
}

// ================= offline notice =================
let netWired = false;
function wireNet(go, T) {
  if (netWired) return; netWired = true;
  addEventListener("offline", () => { if (location.hash.startsWith("#web")) toast("You're offline. Pages you've already opened still work.", { ms: 5000 }); });
  addEventListener("online", () => { if (!location.hash.startsWith("#web")) return; const t = T(); toast("Back online.", { ms: 5000, ...(t?.url ? { action: "Reload this page", onAction: () => go(t.url, { push: false, fresh: true }) } : {}) }); });
}

export function items({ T, B, go }) {
  startSnaps(B); wireNet(go, T);
  return [
    { label: "Search everything I've read…", icon: "search", run: () => searchEverything(go) },
    { label: on("kitsune.webNoIndex") ? "Remember the pages I read: off (turn on)" : "Remember the pages I read: on (turn off)", icon: "sliders", run: () => { const off = flip("kitsune.webNoIndex"); toast(off ? "Pages won't be remembered from now on." : "Pages you read are remembered on this device, so you can search them later."); } },
    { label: "Earlier sets of tabs…", icon: "clock", run: () => earlierTabs(go) },
    { label: "Open every link in the clipboard…", icon: "link", run: () => clipboardLinks(go) },
    { label: "Open the links in the selected text…", icon: "link", run: () => { const s = getSelection(); const sel = [...(document.querySelectorAll("*"))].find((e) => e.shadowRoot && e.shadowRoot.querySelector(".kb-html"))?.shadowRoot?.getSelection?.()?.toString() || s?.toString() || ""; openMany(sel.match(URL_RE) || [], go, "Links in the selection"); } },
    { label: "Export bookmarks as Markdown", icon: "download", run: bookmarksAsMarkdown },
    { label: "Import bookmarks from a CSV (Pocket, Raindrop, Chrome)…", icon: "upload", run: importCsv },
    { label: on("kitsune.webReuseTab") ? "Reuse a tab that already has the page: on (turn off)" : "Reuse a tab that already has the page: off (turn on)", icon: "pages", run: () => { const v = flip("kitsune.webReuseTab"); toast(v ? "Opening a page that's already open jumps to that tab." : "Pages always open where you ask."); } },
    { label: "Most-used words on this page", icon: "chart", run: () => topWords(T()) },
  ];
}
