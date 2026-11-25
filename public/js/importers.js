// Turn files and links you own into library items.
import { IMG_RE, naturalCompare, uid, getJSZip, getPdfjs, api } from "./util.js";
import { saveItem, makeCoverBlob, lib } from "./store.js";
import { openEpub, epubComicPages, epubCover } from "./epub.js";
import { iaToItem } from "./views/books.js";

const now = () => Math.floor(Date.now() / 1000);
const stem = (name) => name.replace(/\.[^.]+$/, "");
export const guessSeries = (name) => stem(name).replace(/[\s_\-.]*(v|vol|volume|ch|chapter|#)?\.?\s*\d+(\.\d+)?\s*(\(.*\)|\[.*\])?\s*$/i, "").replace(/[_]+/g, " ").replace(/\s*[\[(].*?[\])]\s*/g, " ").trim() || stem(name);
const IMG_TYPES = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif", avif: "image/avif", svg: "image/svg+xml", bmp: "image/bmp" };

function base(opts) {
  return { id: uid("v-"), added: now(), link: opts.link || null, tags: opts.tags || [], status: "unread", rating: 0 };
}

async function readArchive(file, onStep) {
  const JSZip = await getJSZip();
  const zip = await JSZip.loadAsync(file);
  const entries = Object.values(zip.files)
    .filter((f) => !f.dir && IMG_RE.test(f.name) && !f.name.startsWith("__MACOSX") && !f.name.split("/").pop().startsWith("."))
    .sort((a, b) => naturalCompare(a.name, b.name));
  const comicInfo = zip.file(/ComicInfo\.xml$/i)[0];
  let info = {};
  if (comicInfo) {
    const x = new DOMParser().parseFromString(await comicInfo.async("string"), "application/xml");
    const g = (t) => x.querySelector(t)?.textContent?.trim();
    info = { series: g("Series"), title: g("Title"), number: g("Number"), volume: g("Volume"), summary: g("Summary"), writer: g("Writer"), manga: g("Manga"), notes: g("Notes") };
  }
  const blobs = [];
  for (const [i, f] of entries.entries()) {
    blobs.push(new Blob([await f.async("arraybuffer")], { type: IMG_TYPES[f.name.split(".").pop().toLowerCase()] || "image/jpeg" }));
    if (i % 10 === 0) onStep?.(i / entries.length);
  }
  return { blobs, info };
}

// files: File[] (from input, drop or folder). Returns the saved items.
export async function importFiles(files, opts = {}, onStatus = () => {}) {
  const out = [];
  const errors = [];
  // Skip documents that are already on the shelf (same file name and size).
  const dupes = files.filter((f) => !IMG_RE.test(f.name) && lib.items.some((i) => i.fileName === f.name && i.size === f.size));
  if (dupes.length) {
    errors.push(`${dupes.map((f) => f.name).join(", ")}: already in your library, skipped.`);
    files = files.filter((f) => !dupes.includes(f));
  }
  const archives = files.filter((f) => /\.(cbz|zip)$/i.test(f.name));
  const pdfs = files.filter((f) => /\.pdf$/i.test(f.name));
  const epubs = files.filter((f) => /\.epub$/i.test(f.name));
  const texts = files.filter((f) => /\.(txt|md|text)$/i.test(f.name));
  const images = files.filter((f) => IMG_RE.test(f.name));
  const unsupported = files.filter((f) => /\.(cbr|rar|cb7|7z|mobi|azw3?|kfx)$/i.test(f.name));
  const single = files.length === 1;
  let n = 0;
  const total = archives.length + pdfs.length + epubs.length + texts.length + (images.length ? 1 : 0);

  for (const f of archives) {
    onStatus(`Reading ${f.name}…`, n++ / total);
    try {
      const { blobs, info } = await readArchive(f, (p) => onStatus(`Reading ${f.name}… ${Math.round(p * 100)}%`, (n - 1 + p) / total));
      if (!blobs.length) throw new Error("no page images inside");
      const title = (single && opts.title) || (info.title && info.series ? `${info.series} ${info.volume ? "Vol. " + info.volume : info.number ? "#" + info.number : ""}`.trim() : stem(f.name));
      out.push(await saveItem({ ...base(opts), type: "manga", title, series: opts.series || info.series || guessSeries(f.name), author: info.writer,
        description: info.summary, dir: info.manga === "YesAndRightToLeft" ? "rtl" : null,
        credit: info.writer || /License:/i.test(info.notes || "") ? { creator: info.writer || "", license: (info.notes || "").match(/License:\s*(.+?)(?:\.\s*Shared with Kitsune.*|\.?\s*$)/is)?.[1]?.trim() || "" } : undefined,
        source: { kind: "blobs", blobs }, pages: blobs.length, origin: f.name.toLowerCase().endsWith(".cbz") ? "CBZ file" : "ZIP file", size: f.size, fileName: f.name }));
    } catch (e) { errors.push(`${f.name}: ${e.message}`); }
  }
  for (const f of pdfs) {
    onStatus(`Opening ${f.name}…`, n++ / total);
    try {
      const pdfjs = await getPdfjs();
      const doc = await pdfjs.getDocument({ data: new Uint8Array(await f.arrayBuffer()) }).promise;
      const meta = await doc.getMetadata().catch(() => ({}));
      const item = { ...base(opts), type: "manga", title: (single && opts.title) || meta.info?.Title || stem(f.name), series: opts.series || guessSeries(f.name), author: meta.info?.Author || "",
        source: { kind: "pdf", blob: f }, pages: doc.numPages, origin: "PDF file", size: f.size, fileName: f.name };
      // Cover from page 1
      const page = await doc.getPage(1);
      const vp = page.getViewport({ scale: 480 / page.getViewport({ scale: 1 }).width });
      const c = document.createElement("canvas"); c.width = vp.width; c.height = vp.height;
      await page.render({ canvasContext: c.getContext("2d"), viewport: vp }).promise;
      item.coverBlob = await new Promise((r) => c.toBlob(r, "image/jpeg", 0.85));
      doc.destroy();
      out.push(await saveItem(item));
    } catch (e) { errors.push(`${f.name}: ${e.message || "couldn't open this PDF"}`); }
  }
  for (const f of epubs) {
    onStatus(`Opening ${f.name}…`, n++ / total);
    try {
      const ep = await openEpub(f);
      const cover = await epubCover(ep);
      const comic = await epubComicPages(ep);
      if (comic) {
        out.push(await saveItem({ ...base(opts), type: "manga", title: (single && opts.title) || ep.title || stem(f.name), series: opts.series || guessSeries(ep.title || f.name), author: ep.author,
          description: ep.description, dir: ep.rtl ? "rtl" : null, source: { kind: "blobs", blobs: comic }, pages: comic.length, coverBlob: cover || undefined, origin: "EPUB (comic)", size: f.size, fileName: f.name }));
      } else {
        out.push(await saveItem({ ...base(opts), type: "book", title: (single && opts.title) || ep.title || stem(f.name), author: ep.author, description: ep.description,
          credit: ep.rights ? { creator: ep.author, license: ep.rights } : undefined,
          source: { kind: "epub", blob: f }, coverBlob: cover || undefined, origin: "EPUB file", size: f.size, fileName: f.name }));
      }
    } catch (e) { errors.push(`${f.name}: ${e.message || "couldn't open this EPUB"}`); }
  }
  for (const f of texts) {
    onStatus(`Reading ${f.name}…`, n++ / total);
    const text = await f.text();
    out.push(await saveItem({ ...base(opts), type: "book", title: (single && opts.title) || stem(f.name), author: opts.series || "", source: { kind: "text", text }, origin: "Text file", size: f.size, fileName: f.name }));
  }
  if (images.length) {
    onStatus("Collecting page images…", n++ / total);
    const groups = new Map();
    for (const f of images) {
      const rel = f.webkitRelativePath || f.name;
      const dir = rel.includes("/") ? rel.slice(0, rel.lastIndexOf("/")) : "";
      if (!groups.has(dir)) groups.set(dir, []);
      groups.get(dir).push(f);
    }
    for (const [dir, list] of [...groups].sort((a, b) => naturalCompare(a[0], b[0]))) {
      list.sort((a, b) => naturalCompare(a.webkitRelativePath || a.name, b.webkitRelativePath || b.name));
      const parts = dir.split("/").filter(Boolean);
      const name = parts.at(-1) || opts.title || stem(list[0].name);
      out.push(await saveItem({ ...base(opts), type: "manga", title: groups.size === 1 && opts.title ? opts.title : name,
        series: opts.series || (parts.length > 1 ? parts[0] : guessSeries(name)), source: { kind: "blobs", blobs: list }, pages: list.length, origin: "Image files" }));
    }
  }
  if (unsupported.length) errors.push(`${unsupported.map((f) => f.name).join(", ")}: RAR, 7z and Kindle formats can't be opened in a browser. Convert them to CBZ or EPUB first.`);
  return { items: out, errors };
}

// Expands "https://x/p{001..120}.jpg" into 120 links.
export function expandLinks(text) {
  const out = [];
  for (const line of text.split(/\s+/).map((l) => l.trim()).filter(Boolean)) {
    const m = line.match(/\{(\d+)\.\.(\d+)\}/);
    if (m) {
      const [a, b] = [Number(m[1]), Number(m[2])], pad = m[1].length;
      if (Math.abs(b - a) > 3000) throw new Error("A range can have at most 3,000 pages.");
      for (let i = a; a <= b ? i <= b : i >= b; a <= b ? i++ : i--) out.push(line.replace(m[0], String(i).padStart(pad, "0")));
    } else if (/^https?:\/\//i.test(line)) out.push(line);
  }
  return out;
}

export async function importLinks(text, opts = {}) {
  const urls = expandLinks(text);
  if (!urls.length) throw new Error("Paste at least one link that starts with http:// or https://.");
  const folder = (() => { try { return decodeURIComponent(new URL(urls[0]).pathname.split("/").slice(-2, -1)[0] || "Linked volume"); } catch { return "Linked volume"; } })();
  return saveItem({ ...base(opts), type: "manga", title: opts.title || folder, series: opts.series || guessSeries(folder),
    source: { kind: "urls", urls }, pages: urls.length, origin: "Image links (" + new URL(urls[0]).hostname + ")" });
}

// IIIF Presentation manifest (v2 or v3) from a library, museum or your own server.
export async function importIIIF(url, opts = {}) {
  let res;
  try { res = await fetch(url, { headers: { Accept: "application/ld+json, application/json" } }); }
  catch { throw new Error("That server didn't allow Kitsune to read the manifest (no CORS). Most IIIF servers do; check the link."); }
  if (!res.ok) throw new Error(`The manifest link answered ${res.status}.`);
  const m = await res.json();
  const label = (l) => (typeof l === "string" ? l : Array.isArray(l) ? label(l[0]) : l && typeof l === "object" ? (l["@value"] ?? label(Object.values(l)[0])) : "");
  const svcUrl = (s) => { s = Array.isArray(s) ? s[0] : s; return s && (s["@id"] || s.id); };
  let pages = [];
  if (m.sequences) {
    for (const c of m.sequences[0]?.canvases || []) {
      const r = c.images?.[0]?.resource;
      const svc = svcUrl(r?.service);
      pages.push(svc ? `${svc.replace(/\/$/, "")}/full/1400,/0/default.jpg` : r?.["@id"]);
    }
  } else if (m.items) {
    for (const c of m.items) {
      const body = c.items?.[0]?.items?.[0]?.body;
      const b = Array.isArray(body) ? body[0] : body;
      const svc = svcUrl(b?.service);
      pages.push(svc ? `${svc.replace(/\/$/, "")}/full/1400,/0/default.jpg` : b?.id);
    }
  }
  pages = pages.filter(Boolean);
  if (!pages.length) throw new Error("That manifest has no page images.");
  const rtl = (m.viewingDirection || m.sequences?.[0]?.viewingDirection) === "right-to-left";
  const title = opts.title || label(m.label) || "IIIF volume";
  return saveItem({ ...base(opts), type: "manga", title, series: opts.series || title, source: { kind: "urls", urls: pages }, pages: pages.length,
    dir: rtl ? "rtl" : null, origin: opts.origin || "IIIF (" + new URL(url).hostname + ")", description: label(m.summary || m.description) });
}

// One box for any library link: works out which library it is and loads it.
export async function importLibraryLink(input, opts = {}) {
  const url = input.trim();
  let m;
  if ((m = url.match(/(?:dl\.ndl\.go\.jp\/(?:info:ndljp\/)?pid|ndljp\/pid)\/(\d+)/))) {
    return importIIIF(`https://dl.ndl.go.jp/api/iiif/${m[1]}/manifest.json`, { ...opts, origin: "National Diet Library" });
  }
  if ((m = url.match(/loc\.gov\/(?:item|resource)\/([\w.-]+)/))) {
    const { locToItem } = await import("./views/books.js");
    const s = await api("loc/" + encodeURIComponent(m[1]));
    return saveItem({ ...locToItem(s), ...(opts.link ? { link: opts.link } : {}), ...(opts.series ? { series: opts.series } : {}) });
  }
  if ((m = url.match(/gallica\.bnf\.fr\/(?:iiif\/)?ark:\/12148\/([\w]+)/))) {
    return importIIIF(`https://gallica.bnf.fr/iiif/ark:/12148/${m[1]}/manifest.json`, { ...opts, origin: "Gallica (BnF)" });
  }
  if ((m = url.match(/gutenberg\.org\/(?:ebooks|etext|cache\/epub)\/(\d+)/))) {
    const { getBook } = await import("./gutendex.js");
    const { gutenbergItem } = await import("./views/books.js");
    const b = await getBook(m[1]);
    return lib.items.find((i) => i.id === "gb-" + b.id) || saveItem({ ...gutenbergItem(b), status: "reading" });
  }
  if ((m = url.match(/\/\/(\w+)\.wikisource\.org\/wiki\/([^?#]+)/))) {
    const lang = m[1], title = (() => { try { return decodeURIComponent(m[2]); } catch { return m[2]; } })().replace(/_/g, " ");
    const id = `ws-${lang}-${title}`.slice(0, 120);
    return lib.items.find((i) => i.id === id) || saveItem({ id, type: "book", title: title.split("/")[0], author: "", lang, source: { kind: "wikisource", lang, title: title.split("/")[0] }, origin: "Wikisource", tags: [], status: "reading", rating: 0, added: now() });
  }
  if (/archive\.org\/(details|download|embed)\//.test(url) || /^[\w.-]+$/.test(url)) return importArchiveItem(url, opts);
  if (/manifest|iiif/i.test(url) || /\.json(\?|$)/.test(url)) return importIIIF(url, opts);
  if (IMG_RE.test(url.split("?")[0]) || /\{\d+\.\.\d+\}/.test(url)) return importLinks(url, opts);
  throw new Error("Kitsune doesn't recognise that link. It understands archive.org, NDL Digital Collections, the Library of Congress, Gallica, Project Gutenberg, Wikisource, IIIF manifests and image links.");
}

export async function importArchiveItem(input, opts = {}) {
  const id = (input.match(/archive\.org\/(?:details|download|embed)\/([^/?#\s]+)/)?.[1] || input).trim();
  const s = await api("ia/" + encodeURIComponent(id));
  const item = iaToItem(s);
  if (opts.link) item.link = opts.link;
  if (opts.series) item.series = opts.series;
  if (opts.title) item.title = opts.title;
  return saveItem(item);
}
