// Resurfacing: your old highlights come back to you, a few at a time, so they don't sink to the bottom of the notebook.
import { $, esc, icon, modal, toast, today } from "./util.js";
import { kvGet, kvSet, getItem, coverSrc } from "./store.js";

const keyOf = (h) => `${h.it.id}:${h.p}:${(h.text || "").slice(0, 40)}`;

export async function allHighlights() {
  const hl = await kvGet("highlights", {}), out = [];
  for (const [id, list] of Object.entries(hl)) { const it = getItem(id); if (it) for (const h of list) if (h.text?.trim()) out.push({ it, ...h }); }
  return out;
}

// Seen dates and "less often" flags, per highlight.
const memo = async () => ({ ...((await kvGet("recall", {})) || {}) });
// One write at a time, so two quick taps never overwrite each other.
let chain = Promise.resolve();
function mark(h, patch) { chain = chain.then(async () => { const m = await memo(); m[keyOf(h)] = { ...(m[keyOf(h)] || {}), ...patch }; await kvSet("recall", { ...m }); }).catch(() => {}); return chain; }

// Least recently seen first, and the ones you asked to see less often only every few weeks.
function rank(list, m) {
  const now = Date.now();
  return list.map((h) => {
    const r = m[keyOf(h)] || {}, seen = r.seen || 0, gap = (now - seen) / 86400_000;
    return { h, score: (r.less ? (gap > 30 ? 1 : 0) : 1) * (seen ? Math.min(gap, 365) : 400) + Math.random() };
  }).sort((a, b) => b.score - a.score).map((x) => x.h);
}

// One highlight a day: the same one all day, until you ask for another.
export async function todaysHighlight(skip = 0) {
  const list = await allHighlights();
  if (!list.length) return null;
  const m = await memo(), day = today(), pinned = m.__today;
  if (!skip && pinned?.day === day) { const h = list.find((x) => keyOf(x) === pinned.k); if (h) return { h, total: list.length }; }
  const h = rank(list.filter((x) => keyOf(x) !== pinned?.k || list.length === 1), m)[0];
  await mark(h, { seen: Date.now() });
  chain = chain.then(async () => { const m2 = await memo(); m2.__today = { day, k: keyOf(h) }; await kvSet("recall", m2); }).catch(() => {});
  await chain;
  return { h, total: list.length };
}

const quoteHtml = (h) => `<blockquote class="rc-quote c-${esc(h.color || "yellow")}">${esc(h.text.length > 420 ? h.text.slice(0, 420) + "…" : h.text)}</blockquote>
  ${h.note ? `<p class="rc-note">${icon("edit")}${esc(h.note)}</p>` : ""}
  <p class="rc-src"><strong>${esc(h.it.title)}</strong>${h.it.author ? ` · ${esc(h.it.author)}` : ""}${h.created ? ` · highlighted ${new Date(h.created * 1000).toLocaleDateString(undefined, { month: "short", year: "numeric" })}` : ""}</p>`;

const openAt = async (h) => (await import("./views/common.js")).openItem(h.it, h.it.type === "book" ? { para: h.p } : { from: h.p });

/** The Home card. */
export async function homeCard(host) {
  const draw = async (skip) => {
    const r = await todaysHighlight(skip);
    if (!r) { host.hidden = true; return; }
    host.hidden = false;
    host.innerHTML = `<div class="section-head"><div><h2 class="h2">From your notebook</h2><p class="lede" style="margin-top:4px">A highlight of yours, back for another look. One of ${r.total}.</p></div><a href="#notebook">Notebook ${icon("next")}</a></div>
      <div class="rc-card">${coverSrc(r.h.it) ? `<img class="rc-cover" src="${esc(coverSrc(r.h.it))}" alt="" loading="lazy" onerror="this.remove()">` : ""}<div class="rc-body">${quoteHtml(r.h)}
        <div class="rc-actions"><button class="btn btn-sm" type="button" data-rc="open">${icon("book")}Open in the book</button><button class="btn btn-sm" type="button" data-rc="next">Another</button><button class="btn btn-sm btn-accent" type="button" data-rc="review">Review a few</button></div></div></div>`;
    host.onclick = (e) => {
      const b = e.target.closest("[data-rc]"); if (!b) return;
      if (b.dataset.rc === "open") openAt(r.h);
      if (b.dataset.rc === "next") draw(1);
      if (b.dataset.rc === "review") openReview();
    };
  };
  await draw(0);
}

/** A short review: five highlights, one at a time. Keep them coming, or see one less often. */
export async function openReview(n = 5) {
  const list = await allHighlights();
  if (!list.length) return toast("Highlight something in a book first. Select text while reading.");
  const queue = rank(list, await memo()).slice(0, n);
  let i = 0, kept = 0;
  const m = modal({ title: "Review your highlights", wide: true, body: `<div class="rc-review" id="rc-r" aria-live="polite"></div>` });
  const host = $("#rc-r", m.root);
  const draw = () => {
    if (i >= queue.length) {
      host.innerHTML = `<div class="rc-done"><p class="eyebrow">Done</p><h3 class="h2">${queue.length} ${queue.length === 1 ? "highlight" : "highlights"} revisited</h3><p class="muted">${kept ? `${kept} will keep coming back.` : ""} Highlights you see less often still return every month or so.</p><button class="btn btn-accent" type="button" data-rv="close">Done</button></div>`;
      return;
    }
    const h = queue[i];
    mark(h, { seen: Date.now() });
    host.innerHTML = `<div class="rc-step"><span class="rc-count">${i + 1} of ${queue.length}</span>${quoteHtml(h)}
      <div class="rc-actions"><button class="btn btn-sm" type="button" data-rv="open">${icon("book")}Open in the book</button><span style="flex:1"></span>
        <button class="btn btn-sm" type="button" data-rv="less">Show less often</button><button class="btn btn-sm btn-accent" type="button" data-rv="keep">Keep it coming</button></div></div>`;
  };
  host.onclick = (e) => {
    const b = e.target.closest("[data-rv]"); if (!b) return;
    const h = queue[i];
    if (b.dataset.rv === "close") return m.close();
    if (b.dataset.rv === "open") { m.close(); return openAt(h); }
    if (b.dataset.rv === "less") mark(h, { less: true });
    if (b.dataset.rv === "keep") { kept++; mark(h, { less: false }); }
    i++; draw();
  };
  draw();
}
