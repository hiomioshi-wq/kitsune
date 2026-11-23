// Kitsune Browser, v128:
//  - voice: search or open a page by speaking, and simple spoken commands (back, forward, reload, next page, scroll)
//  - paragraph focus: the paragraph you're reading stays bright and the rest fades back
//  - bilingual reading: a translation under each paragraph, keeping the original
//  - find with a pattern (regular expression) across the page, with match count and next / previous
import { $, esc, toast, modal } from "./util.js";

// ---------- voice ----------
function voice({ go, B, scroller }) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return toast("This browser can't listen. Chrome, Edge and Safari can.");
  const rec = new SR(); rec.lang = navigator.language || "en-US"; rec.interimResults = true; rec.maxAlternatives = 1;
  const m = modal({ title: "Listening…", body: `<p style="font-size:22px;min-height:2.2em;margin:0" id="vo-t">Say a search, a website, or a command.</p><p class="hint">Commands: “go back”, “go forward”, “reload”, “next page”, “previous page”, “scroll down”, “scroll up”, “top”, “bottom”, “new tab”. Anything else is searched or opened.</p>`, onClose: () => { try { rec.abort(); } catch {} } });
  const show = (s) => { const el = $("#vo-t", m.root); if (el) el.textContent = s; };
  rec.onresult = (e) => {
    const r = e.results[e.results.length - 1], said = r[0].transcript.trim(); show(said);
    if (!r.isFinal) return;
    const s = said.toLowerCase().replace(/[.!?]$/, ""), click = (sel) => $(sel, B.view)?.click(), sc = scroller();
    const cmd = [
      [/^(go )?back$/, () => click('[data-b="back"]')], [/^(go )?forward$/, () => click('[data-b="fwd"]')], [/^(reload|refresh)( the page)?$/, () => click('[data-b="reload"]')],
      [/^next( page)?$/, () => click('[data-pg="next"]')], [/^previous( page)?$/, () => click('[data-pg="prev"]')],
      [/^scroll down$/, () => sc?.scrollBy({ top: sc.clientHeight * 0.85, behavior: "smooth" })], [/^scroll up$/, () => sc?.scrollBy({ top: -sc.clientHeight * 0.85, behavior: "smooth" })],
      [/^(go to the )?top$/, () => sc?.scrollTo({ top: 0, behavior: "smooth" })], [/^(go to the )?bottom$/, () => sc?.scrollTo({ top: sc.scrollHeight, behavior: "smooth" })], [/^new tab$/, () => click('[data-b="newtab"]')],
    ].find(([re]) => re.test(s));
    setTimeout(() => { m.close(); if (cmd) { cmd[1](); toast(`“${said}”`); } else { const site = s.replace(/^(open|go to|search( for)?)\s+/, ""); const asUrl = /^[\w-]+(\s?dot\s?|\.)[a-z]{2,}$/.test(site) ? site.replace(/\s?dot\s?/g, ".") : null; go(asUrl || site); } }, 350);
  };
  rec.onerror = (e) => { show(e.error === "not-allowed" ? "Kitsune needs the microphone. Allow it and try again." : "Didn't catch that. Try again."); };
  rec.onend = () => {};
  try { rec.start(); } catch {}
}

// ---------- paragraph focus ----------
const FP_CSS = `.kb-fp-on p, .kb-fp-on li, .kb-fp-on h2, .kb-fp-on h3, .kb-fp-on blockquote, .kb-fp-on figure, .kb-fp-on pre { opacity: .3; transition: opacity .25s; } .kb-fp-on .kb-fp-cur, .kb-fp-on .kb-fp-cur * { opacity: 1 !important; }`;
const fpOn = () => localStorage.getItem("kitsune.webParaFocus") === "1";
export function paragraphFocus(root, sc) {
  const html = root?.querySelector(".kb-html"); if (!html) return;
  html.classList.toggle("kb-fp-on", fpOn()); if (!fpOn() || root.__kbFp) return; root.__kbFp = true;
  if (!root.querySelector("#kbfp-style")) { const st = document.createElement("style"); st.id = "kbfp-style"; st.textContent = FP_CSS; html.append(st); }
  let cur = null; const set = (el) => { if (el === cur) return; cur?.classList.remove("kb-fp-cur"); cur = el; el?.classList.add("kb-fp-cur"); };
  const blockAt = (x, y) => { const el = root.elementFromPoint ? root.elementFromPoint(x, y) : document.elementFromPoint(x, y); return el?.closest?.("p, li, h2, h3, blockquote, figure, pre"); };
  root.addEventListener("mousemove", (e) => { if (fpOn()) set(e.target.closest?.("p, li, h2, h3, blockquote, figure, pre")); }, { passive: true });
  sc?.addEventListener("scroll", () => { if (!fpOn() || matchMedia("(hover: hover)").matches) return; const r = sc.getBoundingClientRect(); set(blockAt(r.left + r.width / 2, r.top + r.height * 0.4)); }, { passive: true });
}

// ---------- bilingual ----------
async function bilingual(root, t) {
  const html = root?.querySelector(".kb-html"); if (!html) return toast("Open a page first.");
  if (root.querySelector(".kb-bi")) { root.querySelectorAll(".kb-bi").forEach((n) => n.remove()); return toast("Translations removed."); }
  const from = (html.getAttribute("lang") || t.doc?.documentElement?.lang || "en").slice(0, 2).toLowerCase(), to0 = (navigator.language || "en").slice(0, 2).toLowerCase();
  const to = from === to0 ? (from === "en" ? "es" : "en") : to0;
  const blocks = [...root.querySelectorAll("p, li, h1, h2, h3, blockquote")].filter((b) => { const s = (b.textContent || "").trim(); return s.length > 25 && s.length < 480 && !b.closest("nav, header, footer, aside, .kb-bi") && b.offsetParent; });
  const sc = root.host?.closest?.(".kb-page") || root.host; const top = sc?.scrollTop || 0;
  blocks.sort((a, b) => Math.abs(a.getBoundingClientRect().top - 150) - Math.abs(b.getBoundingClientRect().top - 150) || 0); void top;
  const pick = blocks.slice(0, 40); if (!pick.length) return toast("No paragraphs to translate here.");
  const { translate } = await import("./lookup.js"); let done = 0, stop = false;
  toast(`Translating ${pick.length} paragraphs into ${to.toUpperCase()}…`, { ms: 2500 });
  const work = async () => { while (pick.length && !stop) { const b = pick.shift(); try { const r = await translate((b.textContent || "").trim(), from, to); const d = document.createElement("div"); d.className = "kb-bi"; d.lang = to; d.textContent = r.text; d.style.cssText = "margin:4px 0 12px;padding:4px 10px;border-left:3px solid #6f9fe0;color:#355;background:rgba(111,159,224,.10);font-size:.95em;border-radius:0 6px 6px 0"; b.after(d); done++; } catch (e) { stop = true; toast(e.message); } } };
  await Promise.all([work(), work()]);
  if (done) toast(`Added ${done} translations under the paragraphs near you. Run it again to remove them.`);
}

// ---------- find with a pattern ----------
function regexFind(root) {
  if (!root?.querySelector) return toast("Open a page first.");
  const m = modal({ title: "Find with a pattern", body: `<div style="display:flex;gap:6px"><input class="field" id="rf-p" placeholder="Pattern, e.g. \\d{4}|colou?r" spellcheck="false" style="flex:1;font-family:ui-monospace,Menlo,monospace"><input class="field" id="rf-f" value="gi" style="width:60px;font-family:ui-monospace,Menlo,monospace"></div><p class="status" id="rf-s"></p><div style="display:flex;gap:6px"><button class="btn btn-sm" type="button" id="rf-prev">↑ Previous</button><button class="btn btn-sm" type="button" id="rf-next">↓ Next</button><button class="btn btn-sm" type="button" id="rf-copy">Copy all matches</button></div>`, onClose: () => { try { CSS.highlights.delete("kb-find"); CSS.highlights.delete("kb-find-cur"); } catch {} } });
  let ranges = [], i = -1;
  const run = () => {
    const p = $("#rf-p", m.root).value, f = $("#rf-f", m.root).value.replace(/[^gimsuy]/g, ""), s = $("#rf-s", m.root); ranges = []; i = -1;
    try { CSS.highlights.delete("kb-find"); CSS.highlights.delete("kb-find-cur"); } catch {}
    if (!p) { s.textContent = ""; return; }
    let re; try { re = new RegExp(p, f.includes("g") ? f : f + "g"); } catch (e) { s.textContent = e.message; return; }
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: (n) => (n.parentElement?.closest("script,style,noscript") ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT) });
    let n; while ((n = w.nextNode()) && ranges.length < 2000) { re.lastIndex = 0; let mm; while ((mm = re.exec(n.nodeValue)) && ranges.length < 2000) { if (!mm[0].length) { re.lastIndex++; continue; } const r = document.createRange(); r.setStart(n, mm.index); r.setEnd(n, mm.index + mm[0].length); ranges.push(r); } }
    s.textContent = ranges.length ? `${ranges.length}${ranges.length >= 2000 ? "+" : ""} match${ranges.length === 1 ? "" : "es"}` : "No matches.";
    if (ranges.length) { try { CSS.highlights.set("kb-find", new Highlight(...ranges)); } catch {} move(1); }
  };
  const move = (d) => { if (!ranges.length) return; i = (i + d + ranges.length) % ranges.length; try { CSS.highlights.set("kb-find-cur", new Highlight(ranges[i])); } catch {} ranges[i].startContainer.parentElement?.scrollIntoView({ block: "center", behavior: "smooth" }); $("#rf-s", m.root).textContent = `${i + 1} of ${ranges.length}`; };
  let tm; $("#rf-p", m.root).oninput = $("#rf-f", m.root).oninput = () => { clearTimeout(tm); tm = setTimeout(run, 250); };
  $("#rf-next", m.root).onclick = () => move(1); $("#rf-prev", m.root).onclick = () => move(-1);
  $("#rf-copy", m.root).onclick = () => navigator.clipboard?.writeText(ranges.map((r) => r.toString()).join("\n")).then(() => toast(`Copied ${ranges.length} matches.`));
  setTimeout(() => $("#rf-p", m.root).focus(), 40);
}

export function items({ T, B, go, root, scroller }) {
  return [
    { label: "Search or open by voice…", icon: "search", run: () => voice({ go, B, scroller }) },
    { label: fpOn() ? "Paragraph focus: on (turn off)" : "Paragraph focus (dim the rest)", icon: "type", run: () => { try { fpOn() ? localStorage.removeItem("kitsune.webParaFocus") : localStorage.setItem("kitsune.webParaFocus", "1"); } catch {} paragraphFocus(root(), scroller()); toast(fpOn() ? "The paragraph you're reading stays bright; the rest fades back." : "Paragraph focus off."); } },
    { label: "Bilingual reading (translation under each paragraph)", icon: "globe", run: () => bilingual(root(), T()) },
    { label: "Find with a pattern (regular expression)…", icon: "search", run: () => regexFind(root()) },
  ];
}
