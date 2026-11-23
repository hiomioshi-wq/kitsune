// Shareable reading lists. The whole list lives in the link (#list/<data>),
// so there's no account or server involved. Files people own travel as titles only.
import { $, $$, esc, icon, coverHtml, toast, modal, api, plural } from "../util.js";
import { lib, getItem, saveItem } from "../store.js";
import { openItem, emptyState } from "./common.js";
import { setCrumbs } from "../main.js";

const b64 = {
  enc: (s) => btoa(String.fromCharCode(...new TextEncoder().encode(s))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""),
  dec: (s) => new TextDecoder().decode(Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0))),
};

// One entry per item; only public sources carry an id others can open.
export function shareEntry(it) {
  const s = it.source || {};
  if (s.kind === "gutenberg") return { t: "gb", id: s.gid, n: it.title, a: it.author };
  if (s.ia) return { t: "ia", id: s.ia, n: it.title };
  if (it.id.startsWith("loc-")) return { t: "loc", id: it.id.slice(4), n: it.title };
  if (s.kind === "wikisource") return { t: "ws", l: s.lang, id: s.title, n: it.title };
  if (s.kind === "librivox") return { t: "lv", id: s.lid, n: it.title, a: it.author };
  if (it.link?.anilistId) return { t: "al", id: it.link.anilistId, n: it.link.title || it.series || it.title };
  return { t: "own", n: it.title, a: it.series || it.author };
}

export function shareListDialog(items, name = "") {
  // Several volumes of one AniList series collapse into one entry.
  const seen = new Set();
  const entries = items.map(shareEntry).filter((e) => { const k = e.t + ":" + (e.id ?? e.n); return !seen.has(k) && seen.add(k); });
  const m = modal({
    title: "Share a reading list",
    body: `<form class="form" id="sl-f">
      <div><label class="lbl" for="sl-name">List name</label><input class="field" id="sl-name" value="${esc(name)}" placeholder="Autumn reads" autofocus></div>
      <div><label class="lbl" for="sl-note">Note (optional)</label><input class="field" id="sl-note" placeholder="Start with the ghost stories"></div>
      <p class="hint">${plural(entries.length, "entry", "entries")}. ${entries.filter((e) => e.t === "own").length ? `${plural(entries.filter((e) => e.t === "own").length, "item")} you added from your own files will show as titles only.` : "Everything on it is free for the person you send it to."}</p>
      <label class="lbl" for="sl-url">Link</label><textarea class="field" id="sl-url" rows="3" readonly></textarea>
    </form>`,
    actions: `<button class="btn" type="button" id="sl-open">Preview</button><button class="btn btn-accent" type="button" id="sl-copy">${icon("link")}Copy link</button>`,
  });
  const build = () => {
    const data = b64.enc(JSON.stringify({ v: 1, n: $("#sl-name", m.root).value.trim() || "Reading list", note: $("#sl-note", m.root).value.trim(), e: entries }));
    const url = `${location.origin}/#list/${data}`;
    $("#sl-url", m.root).value = url;
    return url;
  };
  $("#sl-name", m.root).oninput = build; $("#sl-note", m.root).oninput = build;
  build();
  $("#sl-copy", m.root).onclick = async () => {
    const url = build();
    try { await navigator.clipboard.writeText(url); toast("Link copied. Anyone with it can see this list."); }
    catch { $("#sl-url", m.root).select(); toast("Select the link and copy it."); }
  };
  $("#sl-open", m.root).onclick = () => { const url = build(); m.close(); location.hash = url.split("#")[1]; };
}

const coverFor = (e) => e.t === "gb" ? `https://www.gutenberg.org/cache/epub/${e.id}/pg${e.id}.cover.medium.jpg`
  : e.t === "ia" ? `https://archive.org/services/img/${encodeURIComponent(e.id)}` : null;
const hrefFor = (e) => ({ gb: `gutenberg/${e.id}`, ia: `scan/${encodeURIComponent(e.id)}`, loc: `loc/${encodeURIComponent(e.id)}`, lv: `audiobook/${e.id}`, al: `manga/${e.id}` }[e.t]);
const KIND = { gb: "Ebook · Project Gutenberg", ia: "Scan · Internet Archive", loc: "Scan · Library of Congress", ws: "Text · Wikisource", lv: "Audiobook · LibriVox", al: "Manga series", own: "From their own shelf" };

export async function render(view, _name, params) {
  let list;
  try { list = JSON.parse(b64.dec(params[0] || "")); } catch { list = null; }
  if (!list?.e?.length) { setCrumbs([["Reading list", ""]]); view.innerHTML = emptyState("This list link is broken.", "It may have been cut off when it was copied. Ask for the link again.", `<a class="btn" href="#home">Go home</a>`); return; }
  setCrumbs([["Shared list", ""], [list.n, ""]]);
  const addable = list.e.filter((e) => e.t !== "own");
  view.innerHTML = `
    <div class="page-head"><div><p class="eyebrow">Shared reading list</p><h1 class="h1">${esc(list.n)}</h1>
      ${list.note ? `<p class="lede">${esc(list.note)}</p>` : ""}<p class="lede">${plural(list.e.length, "entry", "entries")} · ${addable.length} you can open for free.</p></div>
      ${addable.length ? `<button class="btn btn-accent" type="button" id="ls-all">${icon("plus")}Add free ones to Up Next</button>` : ""}</div>
    <div class="list" id="ls-list">${list.e.map((e, i) => `<div class="row" style="grid-template-columns:52px minmax(0,1fr) auto;cursor:default">
      ${coverHtml(coverFor(e), e.n)}
      <div class="row-main"><strong>${esc(e.n)}</strong><span class="sub">${esc([e.a, KIND[e.t]].filter(Boolean).join(" · "))}</span></div>
      <div class="row-side">${e.t === "own" ? `<span class="muted" style="font-size:12px">Not shareable</span>` : e.t === "ws" ? `<button class="btn btn-sm" type="button" data-ws="${i}">Read</button>` : `<a class="btn btn-sm" href="#${hrefFor(e)}">Open</a>`}</div></div>`).join("")}</div>
    <p class="status" id="ls-status" style="margin-top:14px"></p>`;

  const ensure = async (e) => {
    if (e.t === "ws") { const id = `ws-${e.l}-${e.id}`.slice(0, 120); return getItem(id) || saveItem({ id, type: "book", title: e.n, author: "", lang: e.l, source: { kind: "wikisource", lang: e.l, title: e.id }, origin: "Wikisource", tags: [], status: "plan", rating: 0, added: Math.floor(Date.now() / 1000) }); }
    if (e.t === "gb") { const ex = getItem("gb-" + e.id); if (ex) return ex; const { getBook } = await import("../gutendex.js"); const { gutenbergItem } = await import("./books.js"); return saveItem({ ...gutenbergItem(await getBook(e.id)), status: "plan" }); }
    if (e.t === "ia") { const ex = getItem("ia-" + e.id); if (ex) return ex; const { iaToItem } = await import("./books.js"); return saveItem({ ...iaToItem(await api("ia/" + encodeURIComponent(e.id))), status: "plan" }); }
    if (e.t === "loc") { const ex = getItem("loc-" + e.id); if (ex) return ex; const { locToItem } = await import("./books.js"); return saveItem({ ...locToItem(await api("loc/" + encodeURIComponent(e.id))), status: "plan" }); }
    if (e.t === "lv") { const ex = getItem("lv-" + e.id); if (ex) return ex; const { audioToItem } = await import("./books.js"); return saveItem({ ...audioToItem(await api("audio/" + e.id)), status: "plan" }); }
    return null; // manga series: they need their own copies
  };
  $$("[data-ws]", view).forEach((b) => (b.onclick = async () => openItem(await ensure(list.e[Number(b.dataset.ws)]))));
  $("#ls-all", view)?.addEventListener("click", async (ev) => {
    const btn = ev.currentTarget; btn.disabled = true;
    const status = $("#ls-status", view);
    const { getQueue, setQueue, kvGet, kvSet } = await import("../store.js");
    const q = await getQueue();
    let added = 0, wished = 0, failed = 0;
    for (const e of addable) {
      status.textContent = `Adding ${added + wished + failed + 1} of ${addable.length}…`;
      try {
        if (e.t === "al") {
          const wl = await kvGet("wishlist", []);
          if (!wl.some((w) => w.id === e.id)) { wl.unshift({ id: e.id, title: e.n, links: [], added: Math.floor(Date.now() / 1000) }); kvSet("wishlist", wl); }
          wished++;
        } else { const it = await ensure(e); if (it && !q.includes(it.id)) q.push(it.id); added++; }
      } catch { failed++; }
    }
    await setQueue(q);
    status.textContent = `Added ${plural(added, "title")} to Up Next${wished ? `, ${plural(wished, "manga series", "manga series")} to your wishlist` : ""}${failed ? `. ${failed} couldn't be loaded right now` : ""}.`;
    toast("Done.", { action: "Up Next", onAction: () => (location.hash = "library/queue") });
  });
}
