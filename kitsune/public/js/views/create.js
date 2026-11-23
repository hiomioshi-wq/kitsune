// Your works: publish comics and writing you made, with credit and a licence, and share them as files.
import { $, $$, esc, icon, toast, modal, coverHtml, getJSZip, plural, uid, timeAgo } from "../util.js";
import { lib, saveItem, coverSrc, pageSrc } from "../store.js";
import { openItem, emptyState } from "./common.js";
import { setCrumbs } from "../main.js";

export const LICENSES = {
  arr: ["All rights reserved", "Readers can read and keep their copy, but not share or reuse it without asking you.", null],
  "cc-by": ["CC BY 4.0", "Anyone can share and adapt it, as long as they credit you.", "https://creativecommons.org/licenses/by/4.0/"],
  "cc-by-sa": ["CC BY-SA 4.0", "Share and adapt with credit; adaptations must use the same licence.", "https://creativecommons.org/licenses/by-sa/4.0/"],
  "cc-by-nc": ["CC BY-NC 4.0", "Share and adapt with credit, but not for money.", "https://creativecommons.org/licenses/by-nc/4.0/"],
  "cc-by-nd": ["CC BY-ND 4.0", "Share with credit, unchanged.", "https://creativecommons.org/licenses/by-nd/4.0/"],
  cc0: ["CC0 (public domain)", "You give up your rights; anyone can do anything with it.", "https://creativecommons.org/publicdomain/zero/1.0/"],
};
export const licenseLine = (w) => `${LICENSES[w.license]?.[0] || w.license}${LICENSES[w.license]?.[2] ? ` (${LICENSES[w.license][2]})` : ""}`;

export async function render(view) {
  setCrumbs([["Create", "create"]]);
  const works = lib.items.filter((i) => i.work).sort((a, b) => (b.added || 0) - (a.added || 0));
  view.innerHTML = `
    <div class="page-head"><div><p class="eyebrow">Yours</p><h1 class="h1">Create</h1>
      <p class="lede">Publish comics and writing you made. Kitsune keeps your name and licence with the work, and packages it as a CBZ or EPUB that anyone can open, in Kitsune or any other reader.</p></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><a class="btn" href="#panels">${icon("grid")}Panel studio</a><button class="btn btn-accent" type="button" id="cr-new">${icon("plus")}New work</button></div></div>
    ${works.length ? `<div class="list">${works.map((w) => `<div class="row" style="grid-template-columns:52px minmax(0,1fr) auto;cursor:default">
        ${coverHtml(coverSrc(w), w.title)}
        <div class="row-main"><strong>${esc(w.title)}</strong><span class="sub">${esc([`by ${w.work.creator}`, w.type === "manga" ? plural(w.pages, "page") : "Writing", LICENSES[w.work.license]?.[0], timeAgo(w.added)].filter(Boolean).join(" · "))}</span></div>
        <div class="row-side" style="flex-wrap:wrap;justify-content:flex-end"><button class="btn btn-sm" type="button" data-read="${esc(w.id)}">Read</button><button class="btn btn-sm" type="button" data-edit="${esc(w.id)}">Edit</button><button class="btn btn-sm btn-accent" type="button" data-share="${esc(w.id)}">${icon("upload")}Share</button></div></div>`).join("")}</div>`
      : emptyState("Nothing published yet.", "Add the pages of a comic you drew, or a story you wrote. You choose how others may use it.", `<button class="btn btn-accent" type="button" data-new>${icon("plus")}New work</button>`)}
    <section class="section"><div class="panel"><h3 class="h3">How sharing works</h3>
      <p class="muted" style="margin:0">Share makes one file (CBZ for comics, EPUB for writing) with your name, description and licence written inside. Send it however you like: on phones it opens the share sheet; elsewhere it downloads. When someone opens it in Kitsune, your credit and licence show on its page. Only publish work you made or have the right to share.</p></div></section>`;
  view.addEventListener("click", (e) => {
    if (e.target.closest("#cr-new, [data-new]")) return editWork(view, null);
    const r = e.target.closest("[data-read]"); if (r) return openItem(lib.items.find((i) => i.id === r.dataset.read));
    const ed = e.target.closest("[data-edit]"); if (ed) return editWork(view, lib.items.find((i) => i.id === ed.dataset.edit));
    const sh = e.target.closest("[data-share]"); if (sh) return shareWork(lib.items.find((i) => i.id === sh.dataset.share));
  });
}

function editWork(view, item) {
  const w = item?.work || { creator: localStorage.getItem("kitsune.creatorName") || "", license: "arr" };
  const m = modal({ title: item ? `Edit “${item.title}”` : "New work", wide: true, body: `<form class="form" id="cw">
    ${item ? "" : `<div class="seg" id="cw-kind"><button type="button" data-k="comic" aria-pressed="true">${icon("pages")}Comic or manga</button><button type="button" data-k="writing" aria-pressed="false">${icon("book")}Writing</button></div>`}
    <div class="row2"><div><label class="lbl" for="cw-title">Title</label><input class="field" id="cw-title" required value="${esc(item?.title || "")}" autofocus></div>
      <div><label class="lbl" for="cw-creator">Your name or pen name</label><input class="field" id="cw-creator" required value="${esc(w.creator)}"></div></div>
    <div><label class="lbl" for="cw-desc">Description</label><textarea class="field" id="cw-desc" rows="2" style="font-family:var(--f-body);font-size:14px">${esc(item?.description || "")}</textarea></div>
    <div><label class="lbl" for="cw-lic">Licence</label><select class="field" id="cw-lic">${Object.entries(LICENSES).map(([k, [n]]) => `<option value="${k}" ${w.license === k ? "selected" : ""}>${n}</option>`).join("")}</select><p class="hint" id="cw-lic-h"></p></div>
    ${item ? "" : `<div id="cw-comic"><label class="drop">${icon("upload")}<input type="file" id="cw-files" multiple accept="image/*,.cbz,.zip,.pdf"><strong>Add your pages</strong><span>Images in reading order, or a CBZ or PDF</span></label><p class="hint" id="cw-n"></p>
        <label class="lbl" for="cw-dir" style="margin-top:10px">Reading direction</label><select class="field" id="cw-dir" style="max-width:260px"><option value="ltr">Left to right</option><option value="rtl">Right to left (manga)</option><option value="scroll">Long strip (webtoon)</option></select></div>
      <div id="cw-writing" hidden><label class="drop">${icon("upload")}<input type="file" id="cw-doc" accept=".epub,.txt,.md"><strong>Add an EPUB or text file</strong><span>Or write below</span></label>
        <label class="lbl" for="cw-text" style="margin-top:12px">Or write it here</label><textarea class="field" id="cw-text" rows="10" style="font-family:var(--f-book, Georgia);font-size:15px" placeholder="# Chapter one&#10;&#10;Start your story… Lines starting with # become chapter titles."></textarea></div>`}
    <p class="status" id="cw-s"></p></form>`,
    actions: `<button class="btn" type="button" data-close>Cancel</button><button class="btn btn-accent" form="cw">${item ? "Save" : "Publish to my shelf"}</button>` });
  const root = m.root;
  let kind = "comic";
  const licHelp = () => ($("#cw-lic-h", root).textContent = LICENSES[$("#cw-lic", root).value][1]);
  $("#cw-lic", root).onchange = licHelp; licHelp();
  $("#cw-kind", root)?.addEventListener("click", (e) => { const b = e.target.closest("[data-k]"); if (!b) return; kind = b.dataset.k; $$("#cw-kind button", root).forEach((x) => x.setAttribute("aria-pressed", String(x === b))); $("#cw-comic", root).hidden = kind !== "comic"; $("#cw-writing", root).hidden = kind !== "writing"; });
  $("#cw-files", root)?.addEventListener("change", (e) => ($("#cw-n", root).textContent = `${plural(e.target.files.length, "file")} ready.`));
  $("#cw", root).onsubmit = async (e) => {
    e.preventDefault();
    const st = $("#cw-s", root);
    const work = { creator: $("#cw-creator", root).value.trim(), license: $("#cw-lic", root).value, created: item?.work?.created || Math.floor(Date.now() / 1000) };
    const title = $("#cw-title", root).value.trim(), description = $("#cw-desc", root).value.trim();
    try { localStorage.setItem("kitsune.creatorName", work.creator); } catch {}
    try {
      if (item) { Object.assign(item, { title, description, work }); await saveItem(item); m.close(); toast("Saved."); return render(view); }
      const { importFiles } = await import("../importers.js");
      let made;
      if (kind === "comic") {
        const files = [...($("#cw-files", root).files || [])];
        if (!files.length) throw new Error("Add your pages first.");
        st.textContent = "Adding pages…";
        const { items, errors } = await importFiles(files, { title, series: title });
        if (!items.length) throw new Error(errors.join(" ") || "Those files couldn't be read.");
        made = items[0];
        if (items.length > 1) toast(`Only the first file was used. Add each volume as its own work.`);
        const d = $("#cw-dir", root).value; made.dir = d === "ltr" ? "ltr" : d;
      } else {
        const doc = $("#cw-doc", root).files[0], text = $("#cw-text", root).value.trim();
        if (doc) { const { items } = await importFiles([doc], { title }); made = items[0]; if (!made) throw new Error("That file couldn't be read."); }
        else if (text) made = await saveItem({ id: uid("v-"), type: "book", title, author: work.creator, source: { kind: "text", text }, origin: "Your writing", tags: [], status: "unread", rating: 0, added: Math.floor(Date.now() / 1000) });
        else throw new Error("Add a file or write something first.");
      }
      Object.assign(made, { title, description, author: work.creator, series: made.type === "manga" ? title : made.series, work, origin: "Your work", tags: [...new Set([...(made.tags || []), "my works"])] });
      await saveItem(made);
      m.close(); toast(`Published “${title}” to your shelf.`, { action: "Share", onAction: () => shareWork(made) });
      render(view);
    } catch (err) { st.className = "status err"; st.textContent = err.message; }
  };
}

// ---------- packaging ----------
const xmlEsc = (s) => String(s ?? "").replace(/[<>&"']/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" }[c]));
const safeName = (s) => String(s).replace(/[^\w\s.-]/g, "").trim().slice(0, 60) || "work";

export async function packComic(item) {
  const JSZip = await getJSZip();
  const zip = new JSZip();
  const w = item.work;
  zip.file("ComicInfo.xml", `<?xml version="1.0" encoding="utf-8"?>
<ComicInfo xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <Title>${xmlEsc(item.title)}</Title><Series>${xmlEsc(item.series || item.title)}</Series><Writer>${xmlEsc(w.creator)}</Writer><Penciller>${xmlEsc(w.creator)}</Penciller>
  <Summary>${xmlEsc(item.description || "")}</Summary><Notes>License: ${xmlEsc(licenseLine(w))}. Shared with Kitsune.</Notes>
  <Year>${new Date(w.created * 1000).getFullYear()}</Year><PageCount>${item.pages}</PageCount>${item.dir === "rtl" ? "<Manga>YesAndRightToLeft</Manga>" : ""}
</ComicInfo>`);
  for (let i = 0; i < item.pages; i++) {
    const src = await pageSrc(item, i);
    const blob = await (await fetch(src)).blob();
    const ext = (blob.type.split("/")[1] || "jpg").replace("jpeg", "jpg").replace("svg+xml", "svg");
    zip.file(`${String(i + 1).padStart(4, "0")}.${ext}`, blob);
  }
  return new File([await zip.generateAsync({ type: "blob", mimeType: "application/vnd.comicbook+zip" })], `${safeName(item.title)}.cbz`, { type: "application/vnd.comicbook+zip" });
}

// Writing typed into Kitsune becomes a small, valid EPUB 3.
export async function packText(item) {
  const JSZip = await getJSZip();
  const zip = new JSZip();
  const w = item.work, idv = "urn:uuid:" + (crypto.randomUUID?.() || uid());
  const parts = item.source.text.split(/^#\s+/m).filter((s) => s.trim());
  const chapters = (item.source.text.trim().startsWith("#") ? parts : [item.source.text]).map((p, i) => {
    const [first, ...rest] = p.split("\n");
    const hasTitle = item.source.text.trim().startsWith("#");
    const title = hasTitle ? first.trim() : `Part ${i + 1}`;
    const body = (hasTitle ? rest.join("\n") : p).split(/\n\s*\n/).map((x) => x.trim()).filter(Boolean).map((x) => `<p>${xmlEsc(x).replace(/\n/g, "<br/>")}</p>`).join("\n");
    return { title, body };
  });
  zip.file("mimetype", "application/epub+zip", { compression: "STORE" });
  zip.file("META-INF/container.xml", `<?xml version="1.0"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>`);
  const page = (t, b) => `<?xml version="1.0" encoding="utf-8"?><!DOCTYPE html><html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops"><head><title>${xmlEsc(t)}</title></head><body>${b}</body></html>`;
  zip.file("OEBPS/title.xhtml", page(item.title, `<h1>${xmlEsc(item.title)}</h1><p>by ${xmlEsc(w.creator)}</p>${item.description ? `<p>${xmlEsc(item.description)}</p>` : ""}<p><small>${xmlEsc(licenseLine(w))}</small></p>`));
  chapters.forEach((c, i) => zip.file(`OEBPS/ch${i + 1}.xhtml`, page(c.title, `<h2>${xmlEsc(c.title)}</h2>\n${c.body}`)));
  zip.file("OEBPS/nav.xhtml", page("Contents", `<nav epub:type="toc"><ol>${chapters.map((c, i) => `<li><a href="ch${i + 1}.xhtml">${xmlEsc(c.title)}</a></li>`).join("")}</ol></nav>`));
  zip.file("OEBPS/content.opf", `<?xml version="1.0" encoding="utf-8"?><package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="id"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="id">${idv}</dc:identifier><dc:title>${xmlEsc(item.title)}</dc:title><dc:creator>${xmlEsc(w.creator)}</dc:creator><dc:language>en</dc:language>
    <dc:description>${xmlEsc(item.description || "")}</dc:description><dc:rights>${xmlEsc(licenseLine(w))}</dc:rights><meta property="dcterms:modified">${new Date().toISOString().replace(/\.\d+Z$/, "Z")}</meta></metadata>
    <manifest><item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/><item id="title" href="title.xhtml" media-type="application/xhtml+xml"/>${chapters.map((_, i) => `<item id="c${i + 1}" href="ch${i + 1}.xhtml" media-type="application/xhtml+xml"/>`).join("")}</manifest>
    <spine><itemref idref="title"/>${chapters.map((_, i) => `<itemref idref="c${i + 1}"/>`).join("")}</spine></package>`);
  return new File([await zip.generateAsync({ type: "blob", mimeType: "application/epub+zip" })], `${safeName(item.title)}.epub`, { type: "application/epub+zip" });
}

export async function shareWork(item) {
  if (!item) return;
  toast("Packaging your work…");
  let file;
  try {
    const s = item.source || {};
    if (item.type === "manga") file = await packComic(item);
    else if (s.kind === "text") file = await packText(item);
    else if (s.blob) file = new File([s.blob], `${safeName(item.title)}.${s.kind === "epub" ? "epub" : "pdf"}`, { type: s.blob.type });
    else throw new Error("This work can't be packaged.");
  } catch (e) { return toast(e.message || "Packaging failed."); }
  const credit = `“${item.title}” by ${item.work.creator}. ${licenseLine(item.work)}.`;
  if (navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], title: item.title, text: credit }); return; } catch (e) { if (e.name === "AbortError") return; }
  }
  const a = document.createElement("a");
  a.href = URL.createObjectURL(file); a.download = file.name;
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 30_000);
  toast(`Saved ${file.name}. Send it to anyone; Kitsune shows your credit when they open it.`, { ms: 7000 });
}
