// Kitsune Browser, v133: ebooks on web pages.
//  - a page that offers an ebook (Standard Ebooks, Project Gutenberg, Internet Archive, authors' sites, publishers'
//    free books) gets an "Add this ebook" button that downloads it straight into your library
//  - "Add the ebooks linked on this page": pick several from an author or catalogue page and add them in one go
import { $, esc, toast, modal } from "./util.js";

const EXT = /\.(epub|pdf|cbz|cbr|txt)(?:[?#]|$)/i;
function ebookLinks(root, base) {
  const out = [], seen = new Set();
  for (const a of root?.querySelectorAll?.("a[href]") || []) {
    let u; try { u = new URL(a.getAttribute("href"), base).href; } catch { continue; }
    if (!EXT.test(u) && !/\/ebooks\/\d+\.epub|\/epub\/\d+|\/download\/epub/i.test(u)) continue;
    if (/kepub|_advanced|\.azw3|\.mobi|\.images/i.test(u) || seen.has(u)) continue; seen.add(u);
    const label = (a.textContent || a.getAttribute("title") || "").replace(/\s+/g, " ").trim();
    out.push({ u, label, kind: (u.match(EXT)?.[1] || "epub").toLowerCase(), size: (a.closest("tr, li, p")?.textContent.match(/(\d+(?:\.\d+)?)\s*(MB|KB)/i) || [])[0] || "" });
  }
  // best first: EPUB, then PDF, then the rest
  return out.sort((x, y) => ["epub", "pdf", "cbz", "txt", "cbr"].indexOf(x.kind) - ["epub", "pdf", "cbz", "txt", "cbr"].indexOf(y.kind));
}
async function addOne(u, name, retried = false) {
  const r = await fetch("/api/browse/file?url=" + encodeURIComponent(u));
  if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || "That file didn't download."); }
  let blob = await r.blob();
  if (/html/.test(blob.type) && !retried) { const d = new DOMParser().parseFromString(await blob.text(), "text/html"); const meta = d.querySelector('meta[http-equiv="refresh" i]')?.getAttribute("content")?.match(/url=(.+)$/i)?.[1]; const file = name.split("?")[0]; const link = [...d.querySelectorAll("a[href]")].map((x) => x.getAttribute("href")).find((h) => h.split("?")[0].endsWith(file) && h !== u); if (meta || link) return addOne(new URL((meta || link).replace(/^['"]|['"]$/g, ""), u).href, name, true); throw new Error("That link led to a web page, not a file."); }
  const { importFiles } = await import("./importers.js");
  const { items, errors } = await importFiles([new File([blob], name, { type: blob.type })], {});
  if (!items.length) throw new Error(errors.join(" ") || "Kitsune couldn't read that file.");
  return items[0];
}
const nameOf = (u) => decodeURIComponent(u.split(/[?#]/)[0].split("/").pop() || "book.epub") + (/\.(epub|pdf|cbz|cbr|txt)$/i.test(u.split(/[?#]/)[0]) ? "" : ".epub");

async function addBest(root, t) {
  const l = ebookLinks(root, t.url); if (!l.length) return toast("This page doesn't link to an ebook file.");
  toast("Downloading the ebook…", { ms: 2000 });
  try { const it = await addOne(l[0].u, nameOf(l[0].u)); toast(`Added “${it.title}” to your library.`, { action: "Read", onAction: async () => (await import("./views/common.js")).openItem(it) }); } catch (e) { toast(e.message); }
}
function addMany(root, t) {
  const l = ebookLinks(root, t.url); if (!l.length) return toast("This page doesn't link to any ebook files.");
  const m = modal({ title: `Ebooks linked on this page (${l.length})`, wide: true, body: `<p class="hint" style="margin-top:0">Add only books that are free to share or that you own.</p><div style="max-height:55vh;overflow:auto">${l.map((x, i) => `<label class="check" style="display:flex;gap:8px;align-items:flex-start;word-break:break-all"><input type="checkbox" data-i="${i}" ${i < 5 ? "checked" : ""}> <span><b>${esc(x.label || nameOf(x.u))}</b> <small class="muted">${x.kind.toUpperCase()}${x.size ? " · " + esc(x.size) : ""} · ${esc(nameOf(x.u))}</small></span></label>`).join("")}</div><p class="status" id="eb-s"></p>`, actions: `<button class="btn" type="button" data-close>Cancel</button><button class="btn btn-accent" type="button" id="eb-go">Add ticked books</button>` });
  $("#eb-go", m.root).onclick = async () => {
    const pick = [...m.root.querySelectorAll("[data-i]:checked")].map((c) => l[+c.dataset.i]), s = $("#eb-s", m.root); if (!pick.length) return;
    $("#eb-go", m.root).disabled = true; let ok = 0; const errs = [];
    for (const [i, x] of pick.entries()) { s.textContent = `Adding ${i + 1} of ${pick.length}: ${x.label || nameOf(x.u)}…`; try { await addOne(x.u, nameOf(x.u)); ok++; } catch (e) { errs.push(`${nameOf(x.u)}: ${e.message}`); } }
    m.close(); toast(`Added ${ok} book${ok === 1 ? "" : "s"} to your library.${errs.length ? ` ${errs.length} didn't work.` : ""}`, { action: "Library", onAction: () => (location.hash = "library") });
  };
}

export function afterRender({ root, t, B }) {
  $("#kb-ebook", B.view)?.remove(); if (localStorage.getItem("kitsune.webNoEbookChip") === "1" || !t?.url) return;
  const l = ebookLinks(root, t.url); if (!l.length || l.length > 12) return; // a long list is a catalogue, not a book page
  const el = document.createElement("button"); el.id = "kb-ebook"; el.type = "button"; el.textContent = `📚 Add this ebook (${l[0].kind.toUpperCase()})`;
  const below = ["#kb-schema", "#kb-schema2", "#kb-comic"].filter((s) => $(s, B.view)).length;
  el.style.cssText = `position:absolute;right:14px;top:${44 + below * 40}px;z-index:19;font:600 12px system-ui,sans-serif;padding:6px 12px;border-radius:99px;border:1px solid var(--line,#3a3e66);background:var(--surface,#1c1d33);color:inherit;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.25)`;
  el.onclick = () => addBest(root, t);
  ($("#kb-body", B.view) || B.view).append(el);
}

export function items({ T, root }) {
  return [
    { label: "Add this page's ebook to my library", icon: "plus", run: () => addBest(root(), T()) },
    { label: "Add the ebooks linked on this page…", icon: "book", run: () => addMany(root(), T()) },
  ];
}
