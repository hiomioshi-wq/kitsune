// Kitsune Browser, v106: paged sites. Next / previous page buttons and keys, loading the next pages onto the one you're on,
// endless scroll for sites that only have "Next", and a hint when a page is in another language.
import { $, esc, toast, modal, plural } from "./util.js";
import { fixDoc } from "./webcompat.js";
import { fixDoc2 } from "./webcompat2.js";

const NEXT_TXT = /^\s*(next( page)?|older( posts?| entries| comments?)?|more( results| posts)?|continue( reading)?|forward|[›»→>]+|next\s*[›»→>]+)\s*$/i;
const PREV_TXT = /^\s*(prev(ious)?( page)?|newer( posts?| entries)?|back|[‹«←<]+|[‹«←<]+\s*prev(ious)?)\s*$/i;

function findNav(html, root, base) {
  const abs = (u) => { try { const x = new URL(u, base); return /^https?:/.test(x.protocol) ? x.href : ""; } catch { return ""; } };
  const doc = html ? new DOMParser().parseFromString(html, "text/html") : null, out = { next: "", prev: "" };
  for (const k of ["next", "prev"]) {
    const sel = k === "next" ? 'link[rel~="next"], a[rel~="next"]' : 'link[rel~="prev"], link[rel~="previous"], a[rel~="prev"], a[rel~="previous"]';
    const el = doc?.querySelector(sel) || root?.querySelector?.(sel.replace(/link\[[^\]]+\],\s*/g, "")); const h = el?.getAttribute("href"); if (h) out[k] = abs(h);
  }
  const anchors = [...(root?.querySelectorAll?.("a[href]") || [])];
  const tryFind = (k, re) => { if (out[k]) return; const a = anchors.find((x) => { const t = (x.textContent || "").trim(), al = (x.getAttribute("aria-label") || x.getAttribute("title") || "").trim(), cl = (x.className || "").toString(); return t.length < 24 && (re.test(t) || re.test(al) || new RegExp(`(^|[\\s_-])${k}(ious)?([\\s_-]|$)`, "i").test(cl)); }); if (a) out[k] = abs(a.getAttribute("href")); };
  tryFind("next", NEXT_TXT); tryFind("prev", PREV_TXT);
  if (out.next === base) out.next = ""; if (out.prev === base) out.prev = "";
  return out;
}

const langName = (code) => { try { return new Intl.DisplayNames([navigator.language || "en"], { type: "language" }).of(code); } catch { return code; } };

export function items(c) {
  const { T, root, scroller, go, B, host, translate } = c;
  const nav = () => { const t = T(); return t.url ? (t._nav ||= findNav(t.data?.html, root(), t.url)) : { next: "", prev: "" }; };
  const next = () => { const n = nav().next; n ? go(n) : toast("This page doesn’t have a next page."); };
  const prev = () => { const n = nav().prev; n ? go(n) : toast("This page doesn’t have a previous page."); };

  const grab = (d) => { const pick = d.querySelector("article, main, [role=main], #content, #main, .post, .entry-content, .article") || d.body; return pick; };
  async function loadPages(count, { quiet = false } = {}) {
    const t = T(), body = root(); if (!body || !t.url) return 0;
    let url = t._pgNext ?? nav().next, done = 0; const seen = (t._pgSeen ||= new Set([t.url]));
    for (let i = 0; i < count && url && !seen.has(url); i++) {
      seen.add(url);
      let r; try { r = await (await fetch("/api/browse?url=" + encodeURIComponent(url))).json(); } catch { break; }
      if (!r.html) break;
      const d = new DOMParser().parseFromString(r.html, "text/html"), abs = (u) => { try { return new URL(u, r.url).href; } catch { return ""; } };
      try { await fixDoc(d, abs, false); } catch {}
      try { fixDoc2(d, abs); } catch {}
      const src = grab(d); src.querySelectorAll("script,style,iframe,form,nav,header,footer,aside,noscript,link,meta,[class*=cookie],[class*=consent],[class*=newsletter]").forEach((n) => n.remove());
      src.querySelectorAll("[href]").forEach((a) => a.setAttribute("href", abs(a.getAttribute("href")) || "#")); src.querySelectorAll("[src]").forEach((a) => a.setAttribute("src", abs(a.getAttribute("src")) || ""));
      src.querySelectorAll("[srcset]").forEach((a) => a.removeAttribute("srcset"));
      const sec = document.createElement("section"); sec.className = "kb-more"; sec.style.cssText = "margin-top:32px;padding-top:16px;border-top:3px double #8888";
      sec.innerHTML = `<p style="font-size:.85em;opacity:.7;margin:0 0 12px">Next page · <a href="${esc(r.url)}">${esc(host(r.url))}${esc(new URL(r.url).pathname.slice(0, 60))}</a></p>${src.innerHTML}`;
      body.append(sec); done++;
      const nn = findNav(r.html, sec, r.url).next; url = nn; t._pgNext = nn;
    }
    if (!url) t._pgNext = "";
    if (!quiet) toast(done ? `Added ${plural(done, "more page")} below.${t._pgNext ? "" : " That was the last one."}` : "No more pages to add.");
    return done;
  }
  const loadMore = () => {
    if (!nav().next && !T()._pgNext) return toast("This page doesn’t have a next page.");
    const m = modal({ title: "Load the next pages onto this one", body: `<p class="muted">They’re added below, so you can read straight on (and search the lot with Find).</p><div style="display:flex;gap:8px;flex-wrap:wrap">${[1, 3, 5, 10, 25].map((n) => `<button class="btn" data-n="${n}">${n} page${n > 1 ? "s" : ""}</button>`).join("")}</div>` });
    m.root.addEventListener("click", async (e) => { const b = e.target.closest("[data-n]"); if (!b) return; m.close(); toast("Loading…", { ms: 1500 }); await loadPages(+b.dataset.n); });
  };

  const endless = () => { const on = localStorage.getItem("kitsune.webEndless") !== "1"; try { on ? localStorage.setItem("kitsune.webEndless", "1") : localStorage.removeItem("kitsune.webEndless"); } catch {} toast(on ? "Endless scroll on: pages with a Next link keep loading as you read." : "Endless scroll off."); hookScroll(); };
  let hooked = null, busy = false;
  function hookScroll() {
    const sc = scroller(); if (hooked?.el === sc) return; if (hooked) hooked.el.removeEventListener("scroll", hooked.fn);
    if (!sc) return;
    const fn = () => { if (busy || localStorage.getItem("kitsune.webEndless") !== "1") return; if (sc.scrollHeight - sc.scrollTop - sc.clientHeight < 700 && (T()._pgNext ?? nav().next)) { busy = true; loadPages(1, { quiet: true }).finally(() => (busy = false)); } };
    sc.addEventListener("scroll", fn, { passive: true }); hooked = { el: sc, fn };
  }

  // the little Prev / Next pill
  function pager() {
    $("#kb-pager", B.view)?.remove(); const t = T(); if (!t.url || !t.data?.html) return;
    t._nav = null; const n = nav(); if (!n.next && !n.prev) return;
    const el = document.createElement("div"); el.id = "kb-pager"; el.style.cssText = "position:absolute;right:14px;bottom:14px;z-index:20;display:flex;gap:6px;opacity:.92";
    const btn = (label, key, t2) => `<button type="button" class="btn btn-sm" data-pg="${key}" title="${t2}">${label}</button>`;
    el.innerHTML = (n.prev ? btn("← Prev", "prev", "Previous page (P)") : "") + (n.next ? btn("Next →", "next", "Next page (N)") : "");
    el.onclick = (e) => { const b = e.target.closest("[data-pg]"); if (b) (b.dataset.pg === "next" ? next : prev)(); };
    ($("#kb-body", B.view) || B.view).append(el); hookScroll();
  }

  // a page in another language
  function langHint() {
    const t = T(); const m = (t.data?.html || "").slice(0, 3000).match(/<html[^>]*\blang=["']?([a-zA-Z]{2,3})/i); if (!m) return;
    const lang = m[1].toLowerCase(), mine = (navigator.language || "en").slice(0, 2).toLowerCase(); if (lang === mine || lang === "und") return;
    let dis = []; try { dis = JSON.parse(localStorage.getItem("kitsune.langDismiss") || "[]"); } catch {}
    if (dis.includes(host(t.url))) return;
    toast(`This page is in ${langName(lang)}.`, { ms: 9000, action: "Translate", onAction: () => translate() });
  }

  if (!window.__kbPg) {
    window.__kbPg = true;
    addEventListener("keydown", (e) => {
      if (!B.view?.isConnected || !location.hash.startsWith("#web") || e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
      if (e.target.matches?.("input, textarea, select, [contenteditable]") || document.querySelector(".modal, #kb-lb, #kb-hints")) return;
      if (e.key === "n") { e.preventDefault(); next(); } else if (e.key === "p") { e.preventDefault(); prev(); }
    });
  }

  return {
    menu: [
      { label: "Next page (N)", icon: "play", run: next },
      { label: "Previous page (P)", icon: "back", run: prev },
      { label: "Load the next pages onto this one…", icon: "plus", run: loadMore },
      { label: localStorage.getItem("kitsune.webEndless") === "1" ? "Endless scroll: on (turn off)" : "Endless scroll for paged sites", icon: "play", run: endless },
    ],
    afterRender: () => { try { T()._pgNext = undefined; T()._pgSeen = null; pager(); langHint(); } catch {} },
  };
}
