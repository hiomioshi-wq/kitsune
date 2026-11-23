// Kitsune Browser, v98: a batch of extra tools. Each is a menu / command-palette item (type > in the address bar).
// Page stats, tables to CSV, contacts finder, citations, word highlighter, tab tidying, scratchpad, focus timer,
// quote copying, eyedropper, share, bookmark import/export, batch-open links, random page.
import { $, $$, esc, icon, toast, modal, plural } from "./util.js";
import { kvGet, kvSet } from "./store.js";

const words = (s) => (s.match(/[\p{L}\p{N}’']+/gu) || []);
const syll = (w) => { w = w.toLowerCase().replace(/[^a-z]/g, ""); if (!w) return 0; if (w.length <= 3) return 1; const m = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "").replace(/^y/, "").match(/[aeiouy]{1,2}/g); return Math.max(1, m ? m.length : 1); };
const STOP = new Set("the a an and or but of to in on at for with as by is are was were be been it its this that these those from not no so if then than which who whom what when where why how i you he she we they them his her our your their my me us do does did have has had will would can could should may might also just more most very into out up about over after before".split(" "));
const copy = (text, msg) => navigator.clipboard?.writeText(text).then(() => toast(msg || "Copied."), () => toast("Couldn’t copy."));
const download = (name, text, type = "text/plain") => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 5000); };
const csvCell = (s) => { s = String(s ?? "").replace(/\s+/g, " ").trim(); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
const slug = (s) => (s || "page").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "page";

export function items(c) {
  const { T, root, host, B, go, showTab, newTab, persistTabs } = c;
  const needPage = () => { const r = root(); if (!r || !T().url) { toast("Open a page first."); return null; } return r; };
  const pageText = (r) => (r.innerText ?? r.textContent ?? "").replace(/\s+\n/g, "\n").trim();

  // ---- page stats ----
  const stats = () => {
    const r = needPage(); if (!r) return;
    const text = pageText(r), w = words(text), n = w.length;
    if (!n) return toast("No readable text on this page.");
    const sentences = Math.max(1, (text.match(/[.!?]+(\s|$)/g) || []).length), sy = w.reduce((a, x) => a + syll(x), 0);
    const flesch = Math.round(206.835 - 1.015 * (n / sentences) - 84.6 * (sy / n));
    const level = flesch >= 90 ? "Very easy" : flesch >= 70 ? "Easy" : flesch >= 60 ? "Plain English" : flesch >= 50 ? "Fairly hard" : flesch >= 30 ? "Hard" : "Very hard";
    const freq = new Map(); w.forEach((x) => { const k = x.toLowerCase(); if (k.length > 3 && !STOP.has(k) && !/^\d+$/.test(k)) freq.set(k, (freq.get(k) || 0) + 1); });
    const top = [...freq].sort((a, b) => b[1] - a[1]).slice(0, 16), max = top[0]?.[1] || 1;
    const q = (s) => r.querySelectorAll(s).length;
    modal({ title: "Page statistics", wide: true, body: `<div class="kb-stats">
      <div class="kb-statrow"><b>${n.toLocaleString()}</b> words · <b>${Math.max(1, Math.round(n / 238))} min</b> to read · <b>${plural(sentences, "sentence")}</b></div>
      <div class="kb-statrow">Readability <b>${flesch}</b> (${level}) · about <b>${(n / sentences).toFixed(1)}</b> words per sentence · <b>${Math.round(w.reduce((a, x) => a + x.length, 0) / n * 10) / 10}</b> letters per word</div>
      <div class="kb-statrow">${plural(q("h1,h2,h3,h4,h5,h6"), "heading")} · ${plural(q("p"), "paragraph")} · ${plural(q("a[href]"), "link")} · ${plural(q("img"), "picture")} · ${plural(q("table"), "table")} · ${plural(q("li"), "list item")}</div>
      <h3 class="h3" style="margin:12px 0 6px">Most used words</h3>
      <div>${top.map(([k, v]) => `<div class="kb-bar"><span>${esc(k)}</span><i style="width:${Math.round((v / max) * 100)}%"></i><em>${v}</em></div>`).join("")}</div></div>
      <style>.kb-statrow{margin:4px 0}.kb-bar{display:grid;grid-template-columns:110px 1fr 36px;gap:8px;align-items:center;margin:3px 0}.kb-bar i{display:block;height:8px;border-radius:4px;background:var(--accent,#c0392b)}.kb-bar em{font-style:normal;text-align:right;opacity:.7}</style>`,
      actions: `<button class="btn btn-accent" type="button" data-close>Done</button>` });
  };

  // ---- tables to CSV ----
  const tables = () => {
    const r = needPage(); if (!r) return;
    const list = [...r.querySelectorAll("table")].filter((t) => t.rows.length > 1);
    if (!list.length) return toast("No tables on this page.");
    const csvOf = (t) => [...t.rows].map((row) => [...row.cells].map((x) => csvCell(x.textContent)).join(",")).join("\n");
    const m = modal({ title: `Tables on this page (${list.length})`, wide: true, body: `<div class="kb-list">${list.map((t, i) => `<div class="kb-li" style="display:flex;gap:8px;align-items:center"><span style="flex:1"><b>Table ${i + 1}</b> · ${plural(t.rows.length, "row")} × ${plural(t.rows[0]?.cells.length || 0, "column")}<br><small class="muted">${esc(t.rows[0]?.textContent.replace(/\s+/g, " ").trim().slice(0, 90) || "")}</small></span><button class="btn" data-cp="${i}">Copy CSV</button><button class="btn" data-dl="${i}">Download</button></div>`).join("")}</div>`, actions: `<button class="btn btn-accent" type="button" data-close>Done</button>` });
    m.root.addEventListener("click", (e) => { const a = e.target.closest("[data-cp]"), b = e.target.closest("[data-dl]"); if (a) copy(csvOf(list[+a.dataset.cp]), "Table copied as CSV."); if (b) download(`${slug(T().title)}-table-${+b.dataset.dl + 1}.csv`, csvOf(list[+b.dataset.dl]), "text/csv"); });
  };

  // ---- contacts and numbers ----
  const contacts = () => {
    const r = needPage(); if (!r) return;
    const t = pageText(r) + " " + [...r.querySelectorAll("a[href^='mailto:'],a[href^='tel:']")].map((a) => a.getAttribute("href")).join(" ");
    const uniq = (a) => [...new Set(a)];
    const emails = uniq(t.match(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g) || []), phones = uniq((t.match(/(?:\+\d{1,3}[\s.-]?)?(?:\(\d{2,4}\)[\s.-]?|\d{2,4}[\s.-])\d{3,4}[\s.-]?\d{3,4}/g) || []).map((x) => x.trim())).filter((x) => x.replace(/\D/g, "").length >= 8);
    const money = uniq(t.match(/[$€£¥]\s?\d[\d,]*(?:\.\d{1,2})?/g) || []).slice(0, 40), dates = uniq(t.match(/\b(?:\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{2,4}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.? \d{1,2}(?:, \d{4})?)\b/g) || []).slice(0, 40);
    const sec = (name, a) => a.length ? `<h3 class="h3" style="margin:12px 0 4px">${name} (${a.length}) <button class="btn" data-all="${esc(a.join("\n"))}" style="margin-left:6px">Copy all</button></h3><div>${a.map((x) => `<code style="display:inline-block;margin:2px 4px 2px 0">${esc(x)}</code>`).join("")}</div>` : "";
    const body = sec("Email addresses", emails) + sec("Phone numbers", phones) + sec("Prices", money) + sec("Dates", dates);
    const m = modal({ title: "Found on this page", wide: true, body: body || `<p class="muted">No emails, phone numbers, prices or dates found.</p>`, actions: `<button class="btn btn-accent" type="button" data-close>Done</button>` });
    m.root.addEventListener("click", (e) => { const b = e.target.closest("[data-all]"); if (b) copy(b.dataset.all, "Copied."); });
  };

  // ---- citation ----
  const meta = (n) => { const d = T().data?.html ? new DOMParser().parseFromString(T().data.html, "text/html") : (T().doc || null); const q = d?.querySelector?.(`meta[name="${n}"],meta[property="${n}"]`); return q?.getAttribute("content") || ""; };
  const cite = () => {
    const t = T(); if (!t.url) return toast("Open a page first.");
    const title = t.title || host(t.url), site = meta("og:site_name") || host(t.url), author = meta("author") || meta("article:author") || "", pub = meta("article:published_time") || meta("date") || "";
    const dt = pub && !isNaN(Date.parse(pub)) ? new Date(pub) : null, now = new Date();
    const mon = (d) => d.toLocaleString("en", { month: "long" }), mon3 = (d) => d.toLocaleString("en", { month: "short" });
    const last = author.includes(",") ? author.split(",")[0] : author.split(" ").slice(-1)[0], first = author.includes(",") ? author.split(",")[1].trim() : author.split(" ").slice(0, -1).join(" ");
    const apa = `${author ? `${last}, ${first.split(" ").map((x) => x[0] + ".").join(" ")} ` : ""}(${dt ? `${dt.getFullYear()}, ${mon(dt)} ${dt.getDate()}` : "n.d."}). ${title}. ${site}. ${t.url}`;
    const mla = `${author ? `${last}, ${first}. ` : ""}“${title}.” ${site}, ${dt ? `${dt.getDate()} ${mon3(dt)} ${dt.getFullYear()}, ` : ""}${t.url}. Accessed ${now.getDate()} ${mon3(now)} ${now.getFullYear()}.`;
    const chi = `${author ? `${last}, ${first}. ` : ""}“${title}.” ${site}. ${dt ? `${mon(dt)} ${dt.getDate()}, ${dt.getFullYear()}. ` : ""}${t.url}.`;
    const bib = `@online{${slug(last || site)}${dt ? dt.getFullYear() : "nd"},\n  title = {${title}},\n  ${author ? `author = {${author}},\n  ` : ""}url = {${t.url}},\n  urldate = {${now.toISOString().slice(0, 10)}}\n}`;
    const rows = [["APA 7", apa], ["MLA 9", mla], ["Chicago", chi], ["BibTeX", bib]];
    const m = modal({ title: "Cite this page", wide: true, body: rows.map(([k, v]) => `<div class="kb-li" style="display:block"><b>${k}</b><pre style="white-space:pre-wrap;margin:4px 0;font:inherit">${esc(v)}</pre><button class="btn" data-c="${esc(v)}">Copy</button></div>`).join(""), actions: `<button class="btn btn-accent" type="button" data-close>Done</button>` });
    m.root.addEventListener("click", (e) => { const b = e.target.closest("[data-c]"); if (b) copy(b.dataset.c, "Citation copied."); });
  };

  // ---- word highlighter ----
  const HL_COLORS = ["#ffe066", "#8ce99a", "#74c0fc", "#ffa8a8", "#d0bfff"];
  const clearHl = () => { const r = root(); r?.querySelectorAll("mark.kb-hl").forEach((m) => m.replaceWith(document.createTextNode(m.textContent))); r?.normalize?.(); };
  const highlighter = () => {
    const r = needPage(); if (!r) return;
    const m = modal({ title: "Highlight words", body: `<p class="muted">Type words separated by commas. Each gets its own colour.</p><input class="field" id="hl-q" placeholder="e.g. climate, 2024, budget" autofocus>`, actions: `<button class="btn" type="button" id="hl-x">Clear</button><button class="btn btn-accent" type="button" id="hl-go">Highlight</button>` });
    $("#hl-x", m.root).onclick = () => { clearHl(); m.close(); toast("Highlights cleared."); };
    $("#hl-go", m.root).onclick = () => {
      const terms = $("#hl-q", m.root).value.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 5); m.close(); if (!terms.length) return;
      clearHl(); let total = 0;
      terms.forEach((term, i) => {
        const re = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), walker = document.createTreeWalker(r, NodeFilter.SHOW_TEXT, { acceptNode: (n) => n.parentElement?.closest("script,style,mark.kb-hl,textarea") ? NodeFilter.FILTER_REJECT : re.test(n.nodeValue) ? (re.lastIndex = 0, NodeFilter.FILTER_ACCEPT) : NodeFilter.FILTER_REJECT });
        const nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
        nodes.slice(0, 600).forEach((n) => { const frag = document.createDocumentFragment(); let last = 0; n.nodeValue.replace(re, (hit, off) => { frag.append(n.nodeValue.slice(last, off)); const mk = document.createElement("mark"); mk.className = "kb-hl"; mk.style.cssText = `background:${HL_COLORS[i]};color:#111;border-radius:2px`; mk.textContent = hit; frag.append(mk); last = off + hit.length; total++; return hit; }); frag.append(n.nodeValue.slice(last)); n.replaceWith(frag); });
      });
      toast(total ? `Highlighted ${plural(total, "match", "matches")}.` : "No matches found.");
      r.querySelector("mark.kb-hl")?.scrollIntoView({ block: "center", behavior: "smooth" });
    };
    $("#hl-q", m.root).addEventListener("keydown", (e) => { if (e.key === "Enter") $("#hl-go", m.root).click(); });
  };

  // ---- tab tidying ----
  const closeDupes = () => {
    const seen = new Set(); let n = 0;
    for (let i = 0; i < B.tabs.length; i++) { const t = B.tabs[i], k = t.url ? t.url.replace(/#.*$/, "") : null; if (!k || t.pinned) continue; if (seen.has(k) && B.tabs.length > 1) { B.tabs.splice(i, 1); if (B.active >= i) B.active = Math.max(0, B.active - 1); i--; n++; } else seen.add(k); }
    if (!B.tabs.length) B.tabs.push(newTab(null));
    persistTabs(); showTab(); toast(n ? `Closed ${plural(n, "duplicate tab")}.` : "No duplicate tabs.");
  };
  const closeOthers = () => { const keep = B.tabs[B.active]; B.tabs = B.tabs.filter((t) => t === keep || t.pinned); B.active = B.tabs.indexOf(keep); persistTabs(); showTab(); toast("Closed the other tabs."); };
  const closeRight = () => { const cur = B.tabs[B.active]; B.tabs = B.tabs.filter((t, i) => i <= B.active || t.pinned); B.active = B.tabs.indexOf(cur); persistTabs(); showTab(); toast("Closed the tabs to the right."); };
  const sortTabs = () => { const cur = B.tabs[B.active]; const pin = B.tabs.filter((t) => t.pinned), rest = B.tabs.filter((t) => !t.pinned).sort((a, b) => host(a.url || "~").localeCompare(host(b.url || "~"))); B.tabs = [...pin, ...rest]; B.active = B.tabs.indexOf(cur); persistTabs(); showTab(); toast("Tabs grouped by site."); };
  const copyAllTabs = () => { const l = B.tabs.filter((t) => t.url); if (!l.length) return toast("No open pages."); copy(l.map((t) => `${t.title || host(t.url)}\n${t.url}`).join("\n\n"), `Copied ${plural(l.length, "tab")}.`); };

  // ---- batch open links ----
  const openLinks = async () => {
    let clip = ""; try { clip = await Promise.race([navigator.clipboard.readText(), new Promise((r) => setTimeout(() => r(""), 600))]); } catch {}
    const m = modal({ title: "Open several links", body: `<p class="muted">One address per line. Each opens in its own tab.</p><textarea class="field" id="ol-t" rows="8" placeholder="https://…">${esc((clip.match(/https?:\/\/[^\s<>"']+/g) || []).join("\n"))}</textarea>`, actions: `<button class="btn btn-accent" type="button" id="ol-go">Open all</button>` });
    $("#ol-go", m.root).onclick = async () => { const urls = [...new Set($("#ol-t", m.root).value.match(/https?:\/\/[^\s<>"']+/g) || [])].slice(0, 20); m.close(); if (!urls.length) return toast("No links found."); urls.slice(1).forEach((u) => B.tabs.push({ ...newTab(u) })); await go(urls[0], { newTab: true }); toast(`Opened ${plural(urls.length, "link")}.`); };
  };

  // ---- scratchpad ----
  const scratchpad = async () => {
    const cur = (await kvGet("webScratch", "")) || "";
    const m = modal({ title: "Scratchpad", wide: true, body: `<textarea class="field" id="sp-t" rows="14" placeholder="Jot anything: it saves as you type and stays with the browser." style="width:100%;font-family:ui-monospace,monospace">${esc(cur)}</textarea><p class="muted" id="sp-c" style="margin-top:6px"></p>`,
      actions: `<button class="btn" type="button" id="sp-add">Paste page link</button><button class="btn" type="button" id="sp-dl">Download</button><button class="btn btn-accent" type="button" data-close>Done</button>` });
    const ta = $("#sp-t", m.root), count = () => { $("#sp-c", m.root).textContent = `${plural(words(ta.value).length, "word")} · saved`; }; count();
    let tm; ta.oninput = () => { clearTimeout(tm); tm = setTimeout(() => { kvSet("webScratch", ta.value); count(); }, 400); };
    $("#sp-add", m.root).onclick = () => { const t = T(); if (!t.url) return; ta.value += `${ta.value && !ta.value.endsWith("\n") ? "\n" : ""}${t.title || host(t.url)} — ${t.url}\n`; ta.oninput(); };
    $("#sp-dl", m.root).onclick = () => download("scratchpad.txt", ta.value);
  };

  // ---- focus timer ----
  const timer = () => {
    if (window.__kbTimer) { clearInterval(window.__kbTimer.id); window.__kbTimer.el?.remove(); window.__kbTimer = null; return toast("Timer stopped."); }
    const m = modal({ title: "Focus timer", body: `<p class="muted">Read in a block, then take a break. A small countdown shows in the corner.</p><div style="display:flex;gap:8px;flex-wrap:wrap">${[10, 25, 45, 60].map((x) => `<button class="btn" data-min="${x}">${x} min</button>`).join("")}</div>` });
    m.root.addEventListener("click", (e) => {
      const b = e.target.closest("[data-min]"); if (!b) return; m.close();
      const end = Date.now() + +b.dataset.min * 60000, el = document.createElement("div");
      el.style.cssText = "position:fixed;right:14px;bottom:14px;z-index:9999;background:var(--surface,#222);color:var(--text,#fff);border:1px solid var(--border,#555);border-radius:999px;padding:6px 14px;font:600 14px ui-monospace,monospace;box-shadow:0 4px 14px #0005;cursor:pointer";
      el.title = "Click to stop"; document.body.append(el);
      const tick = () => { const s = Math.max(0, Math.round((end - Date.now()) / 1000)); el.textContent = `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`; if (!s) { clearInterval(window.__kbTimer?.id); el.remove(); window.__kbTimer = null; toast("Time’s up. Take a break.", { ms: 8000 }); try { new Notification("Kitsune", { body: "Time’s up. Take a break." }); } catch {} } };
      window.__kbTimer = { id: setInterval(tick, 1000), el }; el.onclick = timer; tick(); try { Notification?.requestPermission?.(); } catch {}
      toast(`Timer set for ${b.dataset.min} minutes.`);
    });
  };

  // ---- quotes, copy text, eyedropper, share ----
  const quote = () => {
    const sel = (root()?.getRootNode?.().getSelection?.() || getSelection())?.toString().trim() || getSelection()?.toString().trim();
    if (!sel) return toast("Select some text first.");
    const t = T(); copy(`“${sel.replace(/\s+/g, " ")}”\n— ${t.title || host(t.url)}, ${t.url}`, "Quote copied with its source.");
  };
  const copyText = () => { const r = needPage(); if (r) copy(pageText(r), "Page text copied."); };
  const eyedrop = async () => { if (!window.EyeDropper) return toast("Your browser doesn’t have an eyedropper."); try { const { sRGBHex } = await new EyeDropper().open(); copy(sRGBHex, `Copied ${sRGBHex}`); } catch {} };
  const share = async () => { const t = T(); if (!t.url) return toast("Open a page first."); if (navigator.share) { try { await navigator.share({ title: t.title, url: t.url }); } catch {} } else copy(t.url, "Link copied (sharing isn’t available here)."); };

  // ---- bookmarks import / export ----
  const exportMarks = async () => {
    const m = (await kvGet("webBookmarks", [])) || []; if (!m.length) return toast("No bookmarks yet.");
    download("kitsune-bookmarks.html", `<!DOCTYPE NETSCAPE-Bookmark-file-1>\n<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">\n<TITLE>Bookmarks</TITLE>\n<H1>Bookmarks</H1>\n<DL><p>\n${m.map((b) => `    <DT><A HREF="${esc(b.url)}" ADD_DATE="${Math.round((b.t || Date.now()) / 1000)}">${esc(b.title || b.url)}</A>`).join("\n")}\n</DL><p>\n`, "text/html");
    toast(`Exported ${plural(m.length, "bookmark")}.`);
  };
  const importMarks = () => {
    const i = document.createElement("input"); i.type = "file"; i.accept = ".html,.htm"; i.onchange = async () => {
      const f = i.files[0]; if (!f) return; const doc = new DOMParser().parseFromString(await f.text(), "text/html");
      const found = [...doc.querySelectorAll("a[href^='http']")].map((a) => ({ url: a.href, title: a.textContent.trim() || a.href, t: (+a.getAttribute("add_date") || 0) * 1000 || Date.now() }));
      const cur = (await kvGet("webBookmarks", [])) || [], have = new Set(cur.map((b) => b.url)), add = found.filter((b) => !have.has(b.url));
      await kvSet("webBookmarks", [...cur, ...add]); toast(`Imported ${plural(add.length, "new bookmark")}.`);
    }; i.click();
  };

  // ---- random page from history or bookmarks ----
  const surprise = async () => {
    const pool = [...((await kvGet("webBookmarks", [])) || []), ...((await kvGet("webHistory", [])) || [])].filter((x) => x.url && x.url !== T().url);
    if (!pool.length) return toast("Nothing saved yet to pick from.");
    const p = pool[Math.floor(Math.random() * pool.length)]; toast(`Taking you to ${p.title || host(p.url)}.`); go(p.url);
  };

  // ---- headings to markdown outline ----
  const outlineCopy = () => {
    const r = needPage(); if (!r) return; const hs = [...r.querySelectorAll("h1,h2,h3,h4")];
    if (!hs.length) return toast("No headings on this page.");
    copy(hs.map((h) => `${"  ".repeat(+h.tagName[1] - 1)}- ${h.textContent.replace(/\s+/g, " ").trim()}`).join("\n"), "Outline copied as a list.");
  };

  return [
    { label: "Page statistics (words, reading time, readability)", icon: "list", run: stats },
    { label: "Tables on this page → CSV", icon: "grid", run: tables },
    { label: "Find emails, phone numbers, prices, dates", icon: "search", run: contacts },
    { label: "Cite this page (APA, MLA, Chicago, BibTeX)", icon: "bookmark", run: cite },
    { label: "Highlight words on this page…", icon: "highlight", run: highlighter },
    { label: "Copy selection as a quote with source", icon: "link", run: quote },
    { label: "Copy page text", icon: "edit", run: copyText },
    { label: "Copy headings as an outline", icon: "toc", run: outlineCopy },
    { label: "Close duplicate tabs", icon: "x", run: closeDupes },
    { label: "Close other tabs", icon: "x", run: closeOthers },
    { label: "Close tabs to the right", icon: "x", run: closeRight },
    { label: "Group tabs by site", icon: "grid", run: sortTabs },
    { label: "Copy all tab links", icon: "link", run: copyAllTabs },
    { label: "Open several links at once…", icon: "plus", run: openLinks },
    { label: "Scratchpad (notes that stay)", icon: "edit", run: scratchpad },
    { label: window.__kbTimer ? "Stop focus timer" : "Focus timer…", icon: "clock", run: timer },
    { label: "Eyedropper (copy a colour)", icon: "highlight", run: eyedrop },
    { label: "Share this page", icon: "globe", run: share },
    { label: "Export bookmarks (HTML)", icon: "download", run: exportMarks },
    { label: "Import bookmarks (HTML)…", icon: "download", run: importMarks },
    { label: "Surprise me: random saved page", icon: "play", run: surprise },
  ];
}
