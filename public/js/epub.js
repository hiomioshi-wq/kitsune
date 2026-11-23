// Minimal EPUB reader: metadata, spine, table of contents and images.
import { getJSZip } from "./util.js";

const MIME = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", gif: "image/gif", webp: "image/webp", svg: "image/svg+xml", avif: "image/avif" };
const dirOf = (p) => (p.includes("/") ? p.slice(0, p.lastIndexOf("/") + 1) : "");
function resolve(base, rel) {
  if (!rel) return rel;
  rel = decodeURIComponent(rel.split("#")[0]);
  const parts = (dirOf(base) + rel).split("/");
  const out = [];
  for (const p of parts) { if (p === "..") out.pop(); else if (p !== "." && p !== "") out.push(p); }
  return out.join("/");
}
const parseXml = (s, type = "application/xml") => new DOMParser().parseFromString(s, type);

export async function openEpub(blob) {
  const JSZip = await getJSZip();
  const zip = await JSZip.loadAsync(blob);
  const container = await zip.file("META-INF/container.xml")?.async("string");
  if (!container) throw new Error("This EPUB is missing its table of contents file.");
  const opfPath = parseXml(container).querySelector("rootfile")?.getAttribute("full-path");
  const opf = parseXml(await zip.file(opfPath).async("string"));
  const meta = (n) => opf.getElementsByTagNameNS("*", n)[0]?.textContent?.trim() || "";
  const manifest = new Map();
  for (const it of opf.querySelectorAll("manifest > item")) manifest.set(it.getAttribute("id"), { href: resolve(opfPath, it.getAttribute("href")), type: it.getAttribute("media-type"), props: it.getAttribute("properties") || "" });
  const spine = [...opf.querySelectorAll("spine > itemref")].map((r) => manifest.get(r.getAttribute("idref"))).filter((x) => x && /html|xml/.test(x.type));
  const rtl = opf.querySelector("spine")?.getAttribute("page-progression-direction") === "rtl";
  const fixed = /pre-paginated/.test(opf.querySelector('meta[property="rendition:layout"]')?.textContent || "") ||
    !!opf.querySelector('meta[name="fixed-layout"][content="true"]') || !!opf.querySelector('meta[name="book-type"][content="comic"]');

  const coverId = opf.querySelector('meta[name="cover"]')?.getAttribute("content");
  const coverItem = [...manifest.values()].find((m) => m.props.includes("cover-image")) || (coverId && manifest.get(coverId));

  // table of contents: EPUB3 nav or EPUB2 NCX
  let toc = [];
  const nav = [...manifest.values()].find((m) => m.props.includes("nav"));
  if (nav) {
    const doc = parseXml(await zip.file(nav.href)?.async("string") || "", "application/xhtml+xml");
    const tocNav = [...doc.querySelectorAll("nav")].find((n) => (n.getAttribute("epub:type") || n.getAttributeNS("http://www.idpf.org/2007/ops", "type") || "").includes("toc")) || doc.querySelector("nav");
    toc = [...(tocNav?.querySelectorAll("a") || [])].map((a) => ({ label: a.textContent.trim(), href: resolve(nav.href, a.getAttribute("href")) }));
  } else {
    const ncxItem = [...manifest.values()].find((m) => m.type === "application/x-dtbncx+xml");
    if (ncxItem) {
      const doc = parseXml(await zip.file(ncxItem.href)?.async("string") || "");
      toc = [...doc.querySelectorAll("navPoint")].map((np) => ({ label: np.querySelector("navLabel text")?.textContent.trim() || "", href: resolve(ncxItem.href, np.querySelector("content")?.getAttribute("src")) }));
    }
  }

  const readFile = (p) => zip.file(p);
  return { zip, title: meta("title"), author: meta("creator"), language: meta("language"), description: meta("description").replace(/<[^>]+>/g, ""), rights: meta("rights"), spine, toc, rtl, fixed, coverItem, readFile };
}

// Decide whether an EPUB is a comic (one image per page) and return its page images.
export async function epubComicPages(ep) {
  const pages = [];
  let textChars = 0;
  for (const s of ep.spine) {
    const html = await ep.readFile(s.href)?.async("string");
    if (!html) continue;
    const doc = parseXml(html, "application/xhtml+xml");
    textChars += (doc.body?.textContent || "").replace(/\s+/g, "").length;
    const img = doc.querySelector("img")?.getAttribute("src") || doc.querySelector("image")?.getAttribute("xlink:href") || doc.querySelector("image")?.getAttributeNS("http://www.w3.org/1999/xlink", "href");
    if (img) pages.push(resolve(s.href, img));
  }
  const comic = ep.fixed || (pages.length >= ep.spine.length * 0.8 && textChars / Math.max(1, ep.spine.length) < 120);
  if (!comic || !pages.length) return null;
  return Promise.all(pages.map(async (p) => {
    const ext = p.split(".").pop().toLowerCase();
    return new Blob([await ep.readFile(p).async("arraybuffer")], { type: MIME[ext] || "image/jpeg" });
  }));
}

export async function epubCover(ep) {
  if (!ep.coverItem) return null;
  const f = ep.readFile(ep.coverItem.href);
  return f ? new Blob([await f.async("arraybuffer")], { type: ep.coverItem.type || "image/jpeg" }) : null;
}

// Clean, readable HTML for each chapter, with images as blob URLs.
const DROP = "script, style, link, meta, iframe, object, embed, form, input, button, video, audio, noscript";
export async function epubChapters(ep, urlFor) {
  const out = [];
  for (const [i, s] of ep.spine.entries()) {
    const raw = await ep.readFile(s.href)?.async("string");
    if (!raw) continue;
    let doc = parseXml(raw, "application/xhtml+xml");
    if (doc.querySelector("parsererror")) doc = parseXml(raw, "text/html");
    const body = doc.body || doc.querySelector("body");
    if (!body) continue;
    body.querySelectorAll(DROP).forEach((n) => n.remove());
    for (const el of body.querySelectorAll("*")) {
      for (const a of [...el.attributes]) {
        const n = a.name.toLowerCase();
        if (n.startsWith("on") || n === "style" || n === "class") el.removeAttribute(a.name);
      }
    }
    for (const img of body.querySelectorAll("img, image")) {
      const src = img.getAttribute("src") || img.getAttribute("xlink:href") || img.getAttributeNS?.("http://www.w3.org/1999/xlink", "href");
      const p = resolve(s.href, src);
      const f = p && ep.readFile(p);
      if (f) {
        const ext = p.split(".").pop().toLowerCase();
        const url = await urlFor(p, async () => new Blob([await f.async("arraybuffer")], { type: MIME[ext] || "image/jpeg" }));
        if (img.tagName.toLowerCase() === "image") { const n = document.createElement("img"); n.src = url; n.alt = ""; img.closest("svg")?.replaceWith(n) || img.replaceWith(n); }
        else img.setAttribute("src", url);
      } else img.remove();
    }
    for (const a of body.querySelectorAll("a[href]")) {
      const h = a.getAttribute("href");
      if (/^https?:/i.test(h)) { a.setAttribute("target", "_blank"); a.setAttribute("rel", "noopener"); }
      else { a.setAttribute("data-href", resolve(s.href, h) + (h.includes("#") ? "#" + h.split("#")[1] : "")); a.removeAttribute("href"); }
    }
    out.push({ i, href: s.href, html: new XMLSerializer().serializeToString(body).replace(/^<body[^>]*>|<\/body>$/g, "") });
  }
  return out;
}
