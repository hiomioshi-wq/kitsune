// Kitsune Browser, v132: comics on web pages.
//  - Read as comic: the big pictures on a page (a webcomic, a webtoon chapter, an artist's page) open in Kitsune's
//    manga reader, with its page turning, spreads, long-strip mode, zoom and bookmarks
//  - Save to my library as a comic: the pictures are downloaded and kept on this device, so they read offline
//  - Save the pictures as a CBZ comic file
// Only for pictures you're allowed to keep (your own, free or openly licensed comics).
import { $, esc, toast, modal, uid } from "./util.js";

export function comicPages(root) {
  if (!root?.querySelectorAll) return [];
  const imgs = [...root.querySelectorAll("img")].map((img) => ({ img, src: img.currentSrc || img.src || img.getAttribute("data-src") || "" })).filter((x) => x.src && !x.src.startsWith("data:") && !/(logo|avatar|icon|sprite|banner|ad[sx]?[-_/]|button|badge|emoji)/i.test(x.src));
  const dir = (u) => u.replace(/[?#].*$/, "").replace(/[^/]*$/, "");
  const big = (x) => { const w = x.img.naturalWidth || +x.img.getAttribute("width") || 0, h = x.img.naturalHeight || +x.img.getAttribute("height") || 0; return w >= 300 && h >= 300 ? { w, h } : null; };
  // pictures that have loaded and are big, plus not-yet-loaded ones from the same folder as those (lazy-loaded pages)
  const confirmed = imgs.filter(big), dirs = new Map(); confirmed.forEach((x) => dirs.set(dir(x.src), (dirs.get(dir(x.src)) || 0) + 1));
  const mainDir = [...dirs.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const seen = new Set(), out = [];
  for (const x of imgs) {
    if (seen.has(x.src)) continue; const sz = big(x);
    if (sz || (mainDir && dirs.get(mainDir) >= 2 && dir(x.src) === mainDir && !x.img.naturalWidth)) { seen.add(x.src); out.push({ src: x.src, w: sz?.w || 0, h: sz?.h || 0 }); }
  }
  return out;
}
const isStrip = (pages) => pages.filter((p) => p.h > p.w * 1.6).length > pages.length / 2;
const titleOf = (t) => (t.custom || t.title || "Web comic").replace(/\s[-|·–—]\s[^-|·–—]*$/, "").slice(0, 120);
const hostOf = (u) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return ""; } };

async function readAsComic(root, t) {
  const pages = comicPages(root); if (pages.length < 2) return toast("This page doesn't have enough big pictures to read as a comic.");
  const item = { id: "webcomic-" + (t.url || "").replace(/[^\w]+/g, "-").slice(-80), type: "manga", title: titleOf(t), series: hostOf(t.url), pages: pages.length, dir: isStrip(pages) ? "scroll" : "ltr", source: { kind: "urls", urls: pages.map((p) => p.src) }, origin: "Read from " + hostOf(t.url), tags: [], added: Math.floor(Date.now() / 1000) };
  (await import("./views/common.js")).openItem(item);
}
async function fetchBlob(src) {
  try { const r = await fetch(src, { mode: "cors" }); if (r.ok) { const b = await r.blob(); if (/^image\//.test(b.type)) return b; } } catch {}
  const r = await fetch("/api/browse/img?url=" + encodeURIComponent(src)); if (!r.ok) throw new Error("blocked"); return r.blob();
}
async function download(root, t, onEach) {
  const pages = comicPages(root); if (pages.length < 1) throw new Error("There are no big pictures on this page.");
  const blobs = []; let fail = 0;
  for (let i = 0; i < pages.length; i++) { onEach(i, pages.length); try { blobs.push(await fetchBlob(pages[i].src)); } catch { fail++; } }
  return { blobs, fail, strip: isStrip(pages) };
}
function saveDialog(root, t, asCbz) {
  const n = comicPages(root).length; if (n < 1) return toast("There are no big pictures on this page.");
  const m = modal({ title: asCbz ? "Save as a CBZ comic file" : "Save to my library as a comic", body: `<p style="margin-top:0">${n} picture${n === 1 ? "" : "s"} from <b>${esc(hostOf(t.url))}</b>.</p><label class="lbl">Title</label><input class="field" id="wc-t" value="${esc(titleOf(t))}"><p class="hint">Only keep comics you're allowed to: your own, free to share, or openly licensed.</p><p class="status" id="wc-s"></p>`, actions: `<button class="btn" type="button" data-close>Cancel</button><button class="btn btn-accent" type="button" id="wc-go">${asCbz ? "Save file" : "Save"}</button>` });
  $("#wc-go", m.root).onclick = async () => {
    const s = $("#wc-s", m.root), title = $("#wc-t", m.root).value.trim() || titleOf(t); $("#wc-go", m.root).disabled = true;
    try {
      const { blobs, fail, strip } = await download(root, t, (i, all) => (s.textContent = `Downloading picture ${i + 1} of ${all}…`));
      if (!blobs.length) throw new Error("None of the pictures could be downloaded: that site doesn't allow it.");
      if (asCbz) {
        s.textContent = "Packing the file…"; const { getJSZip } = await import("./util.js"); const JSZip = await getJSZip(), zip = new JSZip();
        blobs.forEach((b, i) => zip.file(`${String(i + 1).padStart(3, "0")}.${(b.type.split("/")[1] || "jpg").replace("jpeg", "jpg").replace(/\+.*$/, "")}`, b));
        zip.file("ComicInfo.xml", `<?xml version="1.0"?><ComicInfo><Title>${esc(title)}</Title><Web>${esc(t.url)}</Web><PageCount>${blobs.length}</PageCount></ComicInfo>`);
        const out = await zip.generateAsync({ type: "blob" }), a = document.createElement("a"); a.href = URL.createObjectURL(out); a.download = title.replace(/[^\w.-]+/g, "_").slice(0, 80) + ".cbz"; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
        m.close(); toast(`Saved ${blobs.length} pages as a CBZ file${fail ? ` (${fail} couldn't be downloaded)` : ""}.`);
      } else {
        const { saveItem } = await import("./store.js");
        const item = await saveItem({ id: uid("v-"), type: "manga", title, series: hostOf(t.url), pages: blobs.length, dir: strip ? "scroll" : null, source: { kind: "blobs", blobs }, origin: "Saved from " + hostOf(t.url), link: null, tags: ["web comics"], status: "unread", rating: 0, added: Math.floor(Date.now() / 1000) });
        m.close(); toast(`Saved “${item.title}” (${blobs.length} pages) to your library${fail ? `. ${fail} pictures couldn't be downloaded` : ""}.`, { action: "Read", onAction: async () => (await import("./views/common.js")).openItem(item) });
      }
    } catch (e) { s.textContent = e.message; $("#wc-go", m.root).disabled = false; }
  };
}

export function afterRender({ root, t, B }) {
  $("#kb-comic", B.view)?.remove(); if (localStorage.getItem("kitsune.webNoComicChip") === "1") return;
  const pages = comicPages(root); if (pages.length < 3 || pages.filter((p) => !p.w || p.h > p.w * 1.15).length < 3) return;
  const el = document.createElement("button"); el.id = "kb-comic"; el.type = "button"; el.textContent = `📖 Read as comic (${pages.length})`;
  el.style.cssText = `position:absolute;right:14px;top:${$("#kb-schema", B.view) || $("#kb-schema2", B.view) ? 124 : 44}px;z-index:19;font:600 12px system-ui,sans-serif;padding:6px 12px;border-radius:99px;border:1px solid var(--line,#3a3e66);background:var(--surface,#1c1d33);color:inherit;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.25)`;
  el.onclick = () => readAsComic(root, t);
  ($("#kb-body", B.view) || B.view).append(el);
}

export function items({ T, root }) {
  return [
    { label: "Read this page's pictures as a comic", icon: "comics", run: () => readAsComic(root(), T()) },
    { label: "Save this page's pictures to my library as a comic…", icon: "plus", run: () => saveDialog(root(), T(), false) },
    { label: "Save this page's pictures as a CBZ file…", icon: "download", run: () => saveDialog(root(), T(), true) },
  ];
}
