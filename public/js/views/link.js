import { $, $$, esc, icon, modal, toast, plural, coverHtml, fmtBytes, uid } from "../util.js";
import { lib, kvGet, kvSet, saveItem, rescanFolder } from "../store.js";
import { importFiles, importLinks, importIIIF, importLibraryLink, expandLinks } from "../importers.js";
import { setCrumbs, go } from "../main.js";

const SOURCES = [
  ["files", "upload", "Files you own", "CBZ, ZIP, PDF, EPUB, TXT or loose page images. Drop as many as you like.", ".cbz .zip .pdf .epub .txt .jpg .png .webp"],
  ["folder", "folder", "A folder of pages", "Pick a folder; each subfolder becomes its own chapter or volume.", "Folders of images"],
  ["links", "link", "Image links", "Pages you host yourself: cloud storage, a NAS, your own site. Ranges like {001..180} expand for you.", "Any https image links"],
  ["shelf", "zoom", "Scan your shelf", "Point your camera at the barcodes of the physical books and manga you own to catalog them. Or type ISBNs.", "Barcodes · ISBN"],
  ["kindle", "highlight", "Kindle highlights", "Import My Clippings.txt from your Kindle: every highlight and note lands in Notebook.", "My Clippings.txt"],
  ["libby", "clock", "Libby history", "Bring in every book you borrowed from your library through Libby.", "Libby timeline JSON · CSV"],
  ["opds", "server", "Your comic server", "Browse and stream from Komga, Kavita, Calibre-Web, Ubooquity or any OPDS catalog.", "OPDS 1.2 · OPDS-PSE streaming"],
  ["iiif", "globe", "IIIF manifest", "Digitized books from libraries and museums (Library of Congress, BnF, Wellcome, many Japanese archives).", "IIIF Presentation v2 and v3"],
  ["archive", "book", "Internet Archive item", "Paste any freely readable archive.org book link to read its scanned pages here.", "archive.org/details/…"],
  ["accounts", "gear", "Subscriptions & accounts", "VIZ, K MANGA, Kindle, Kobo, Libby, Hoopla, Audible and more, plus Open Library lists and optional API keys.", "Search links · reading lists · keys"],
  ["custom", "sliders", "Custom sources", "Teach Kitsune a new source: a search API, a webcomic feed, a IIIF collection or a URL pattern for your own server.", "JSON · RSS/Atom · IIIF · patterns"],
  ["anilist", "star", "AniList list", "Import your public manga list to see what you follow beside what you own.", "Read-only, by username"],
  ["backup", "download", "Backup & restore", "Move your library, progress, highlights and notes to another browser.", "Kitsune backup (.zip)"],
];

export async function render(view) {
  setCrumbs([["Link & import", "link"]]);
  const servers = await kvGet("sources", []);
  view.innerHTML = `
    <div class="page-head"><div><p class="eyebrow">Bring your own</p><h1 class="h1">Link &amp; import</h1>
      <p class="lede">Read the manga and books you own, wherever they live. Files you add stay in this browser. Kitsune never uploads them.</p></div></div>
    <div class="sources">${SOURCES.map(([k, ic, t, d, f]) => `<button class="source" type="button" data-src="${k}"><span class="ico">${icon(ic)}</span><strong>${t}</strong><p>${d}</p><span class="fmts">${f}</span></button>`).join("")}
      ${lib.features.libraryFolder ? `<button class="source" type="button" data-src="folderlib"><span class="ico">${icon("folder")}</span><strong>Library folder</strong><p>Kitsune is running on this computer and reads straight from a folder on disk.</p><span class="fmts">${esc(lib.features.folder || "")}</span></button>` : ""}
    </div>
    ${servers.length ? `<section class="section"><div class="section-head"><h2 class="h2">Your servers</h2></div><div class="list">${servers.map((s) => `
      <div class="row" style="grid-template-columns:40px minmax(0,1fr) auto"><span class="ico" style="display:grid;place-items:center">${icon("server")}</span>
        <div class="row-main"><strong>${esc(s.name)}</strong><span class="sub">${esc(s.url)}</span></div>
        <div class="row-side"><button class="btn btn-sm btn-accent" type="button" data-browse="${esc(s.id)}">Browse</button><button class="icon-btn" type="button" data-rm="${esc(s.id)}" aria-label="Remove ${esc(s.name)}">${icon("trash")}</button></div></div>`).join("")}</div></section>` : ""}
    <section class="section"><div class="panel"><h3 class="h3">What counts as yours</h3>
      <p class="muted" style="margin:0">Scans you made of books you bought, DRM-free purchases (many publishers and Humble Bundle sell CBZ and EPUB), files from your own server, and public-domain works. Kitsune doesn't search or download manga from scanlation or piracy sites.</p></div></section>`;
  view.addEventListener("click", async (e) => {
    const s = e.target.closest("[data-src]");
    if (s) {
      const k = s.dataset.src;
      if (k === "shelf") return go("own/scan");
      if (k === "kindle") return go("own/kindle");
      if (k === "libby") return go("own/libby");
      if (k === "anilist") return go("library/tracking");
      if (k === "custom") return go("sources");
      if (k === "accounts") return go("accounts");
      if (k === "backup") return go("settings/data");
      if (k === "opds") return addServer(() => render(view));
      if (k === "folderlib") { try { const n = await rescanFolder(); toast(`Found ${plural(n, "volume")} in your library folder.`, { action: "View", onAction: () => go("library") }); } catch (err) { toast(err.message); } return; }
      return openImport(null, { mode: k });
    }
    const b = e.target.closest("[data-browse]");
    if (b) return browseServer(servers.find((x) => x.id === b.dataset.browse));
    const r = e.target.closest("[data-rm]");
    if (r) { kvSet("sources", servers.filter((x) => x.id !== r.dataset.rm)); render(view); }
  });
}

// ---------- import dialog ----------
const MODES = [["files", "Files"], ["folder", "Folder"], ["links", "Image links"], ["iiif", "IIIF"], ["archive", "Library link"]];
export function openImport(files = null, opts = {}) {
  let mode = opts.mode || "files";
  let picked = files || [];
  const m = modal({
    title: opts.link ? `Add volumes of ${opts.link.title}` : "Add to your library", wide: true,
    body: `<div class="seg" role="tablist" style="margin-bottom:18px">${MODES.map(([k, l]) => `<button type="button" role="tab" data-mode="${k}" aria-selected="${mode === k}">${l}</button>`).join("")}</div>
      <div data-pane="files"><label class="drop" id="im-drop">${icon("upload")}<input type="file" id="im-files" multiple accept=".cbz,.zip,.pdf,.epub,.txt,.md,image/*"><strong>Drop files here or click to choose</strong><span>CBZ · ZIP · PDF · EPUB · TXT · JPG · PNG · WEBP. Each archive or document becomes one item.</span></label></div>
      <div data-pane="folder"><label class="drop">${icon("folder")}<input type="file" id="im-folder" webkitdirectory multiple><strong>Choose a folder</strong><span>Subfolders become separate volumes, in name order.</span></label></div>
      <div data-pane="links"><label class="lbl" for="im-links">Page image links, in reading order</label>
        <textarea class="field" id="im-links" rows="6" placeholder="https://my-nas.local/manga/v01/{001..196}.jpg&#10;or one link per line"></textarea>
        <p class="hint" id="im-links-n">Use <code>{001..196}</code> to expand a numbered range. Links must point to images you're allowed to read.</p></div>
      <div data-pane="iiif"><label class="lbl" for="im-iiif">IIIF manifest link</label><input class="field" id="im-iiif" type="url" placeholder="https://…/manifest.json">
        <p class="hint">Find it on the item's page in a library or museum's online collection, usually behind a IIIF logo.</p></div>
      <div data-pane="archive"><label class="lbl" for="im-ia">Link from a library</label><input class="field" id="im-ia" placeholder="https://dl.ndl.go.jp/pid/1301430 · https://archive.org/details/… · https://www.loc.gov/item/…">
        <p class="hint">Works with Internet Archive, NDL Digital Collections (Japan), the Library of Congress, Gallica (France), Project Gutenberg, Wikisource and any IIIF manifest. Only items that are free to read can be opened.</p></div>
      <div class="filelist" id="im-list" style="margin-top:12px"></div>
      <div class="form" style="margin-top:18px">
        <div class="row2"><div><label class="lbl" for="im-series">Series</label><input class="field" id="im-series" value="${esc(opts.series || "")}" placeholder="From file names if blank"></div>
          <div><label class="lbl" for="im-title">Title</label><input class="field" id="im-title" placeholder="From file names if blank"></div></div>
        <div><label class="lbl" for="im-tags">Collections (optional)</label><input class="field" id="im-tags" placeholder="favorites, box set"></div>
        <label class="check"><input type="checkbox" id="im-own"> I own these or they're in the public domain, and I'm adding them for my own reading.</label>
        <div class="progressbar" id="im-bar" hidden><i></i></div>
        <p class="status" id="im-status" role="status"></p>
      </div>`,
    actions: `<button class="btn" type="button" data-close>Cancel</button><button class="btn btn-accent" type="button" id="im-go">${icon("plus")}Add to library</button>`,
  });
  const root = m.root;
  const showMode = () => {
    $$("[data-mode]", root).forEach((b) => b.setAttribute("aria-selected", String(b.dataset.mode === mode)));
    $$("[data-pane]", root).forEach((p) => (p.hidden = p.dataset.pane !== mode));
    drawList();
  };
  const drawList = () => {
    const show = (mode === "files" || mode === "folder") && picked.length;
    $("#im-list", root).innerHTML = show ? picked.slice(0, 200).map((f) => `<div><span>${esc(f.webkitRelativePath || f.name)}</span><span>${fmtBytes(f.size)}</span></div>`).join("") + (picked.length > 200 ? `<div><span>…and ${picked.length - 200} more</span></div>` : "") : "";
  };
  $$("[data-mode]", root).forEach((b) => (b.onclick = () => { mode = b.dataset.mode; showMode(); }));
  $("#im-files", root).onchange = (e) => { picked = [...e.target.files]; drawList(); };
  $("#im-folder", root).onchange = (e) => { picked = [...e.target.files]; drawList(); };
  const drop = $("#im-drop", root);
  ["dragenter", "dragover"].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.add("over"); }));
  ["dragleave", "drop"].forEach((t) => drop.addEventListener(t, () => drop.classList.remove("over")));
  drop.addEventListener("drop", (e) => { e.preventDefault(); picked = [...e.dataTransfer.files]; drawList(); });
  $("#im-links", root).oninput = (e) => { try { const n = expandLinks(e.target.value).length; $("#im-links-n", root).textContent = n ? `${plural(n, "page")} ready.` : "Use {001..196} to expand a numbered range."; } catch (err) { $("#im-links-n", root).textContent = err.message; } };

  $("#im-go", root).onclick = async () => {
    const status = $("#im-status", root), bar = $("#im-bar", root), btn = $("#im-go", root);
    status.className = "status";
    if (!$("#im-own", root).checked) { status.className = "status err"; status.textContent = "Tick the box to confirm these are yours to read."; return; }
    const o = { series: $("#im-series", root).value.trim(), title: $("#im-title", root).value.trim(), link: opts.link || null, tags: $("#im-tags", root).value.split(",").map((t) => t.trim()).filter(Boolean) };
    btn.disabled = true; bar.hidden = false;
    try {
      let items = [], errors = [];
      if (mode === "files" || mode === "folder") {
        if (!picked.length) throw new Error(mode === "folder" ? "Choose a folder first." : "Choose or drop some files first.");
        ({ items, errors } = await importFiles(picked, o, (msg, p) => { status.textContent = msg; $("i", bar).style.width = Math.round(p * 100) + "%"; }));
      } else if (mode === "links") { status.textContent = "Saving links…"; items = [await importLinks($("#im-links", root).value, o)]; }
      else if (mode === "iiif") { status.textContent = "Reading the manifest…"; items = [await importIIIF($("#im-iiif", root).value.trim(), o)]; }
      else if (mode === "archive") { status.textContent = "Looking up the item…"; items = [await importLibraryLink($("#im-ia", root).value.trim(), o)]; }
      $("i", bar).style.width = "100%";
      if (!items.length) throw new Error(errors.join(" ") || "Nothing could be added.");
      m.close();
      toast(`Added ${plural(items.length, "item")} to your library.${errors.length ? ` ${errors.length} couldn't be read.` : ""}`, { action: items.length === 1 ? "Open" : "View", onAction: async () => {
        if (items.length === 1) (await import("./common.js")).openItem(items[0]); else go("library");
      }, ms: 6000 });
      if (errors.length) console.warn(errors);
      if (location.hash.startsWith("#library") || location.hash === "" || location.hash === "#home") (await import("../main.js")).refresh();
    } catch (err) { status.className = "status err"; status.textContent = err.message; btn.disabled = false; }
  };
  if (opts.prefill) {
    const field = { links: "#im-links", iiif: "#im-iiif", archive: "#im-ia" }[mode];
    if (field) { $(field, root).value = opts.prefill; $(field, root).dispatchEvent(new Event("input")); }
  }
  showMode();
}

// ---------- OPDS servers ----------
function addServer(after) {
  const m = modal({
    title: "Connect your comic server",
    body: `<form class="form" id="sv-form">
      <div><label class="lbl" for="sv-url">OPDS catalog link</label><input class="field" id="sv-url" type="url" required autofocus placeholder="https://komga.example.com/opds/v1.2/catalog">
        <p class="hint">Komga: <code>/opds/v1.2/catalog</code> · Kavita: copy the OPDS link from your user settings (it contains your key) · Calibre-Web: <code>/opds</code></p></div>
      <div><label class="lbl" for="sv-name">Name</label><input class="field" id="sv-name" placeholder="My Komga"></div>
      <div class="row2"><div><label class="lbl" for="sv-user">Username (if needed)</label><input class="field" id="sv-user" autocomplete="off"></div>
        <div><label class="lbl" for="sv-pass">Password (if needed)</label><input class="field" id="sv-pass" type="password" autocomplete="new-password"></div></div>
      <p class="hint">Sign-in details stay in this browser and are only sent to your server. ${lib.features.proxy ? "Running locally, so servers without CORS work too." : "Your server must allow this site (CORS). Komga and Kavita have a setting for it."}</p>
    </form>`,
    actions: `<button class="btn" type="button" data-close>Cancel</button><button class="btn btn-accent" form="sv-form">Connect</button>`,
  });
  $("#sv-form", m.root).onsubmit = async (e) => {
    e.preventDefault();
    const url = $("#sv-url", m.root).value.trim(), user = $("#sv-user", m.root).value, pass = $("#sv-pass", m.root).value;
    const s = { id: uid("s-"), name: $("#sv-name", m.root).value.trim() || new URL(url).hostname, url, auth: user ? "Basic " + btoa(unescape(encodeURIComponent(user + ":" + pass))) : "" };
    try { await opdsFetch(s, url); }
    catch (err) { toast(err.message, { ms: 7000 }); return; }
    kvSet("sources", [...(await kvGet("sources", [])), s]);
    m.close(); toast(`Connected to ${s.name}.`); after(); browseServer(s);
  };
}

async function opdsFetch(server, url, as = "xml") {
  let sameOrigin = false;
  try { sameOrigin = new URL(url).origin === new URL(server.url).origin; } catch {}
  const headers = server.auth && sameOrigin ? { [lib.features.proxy ? "X-Kitsune-Auth" : "Authorization"]: server.auth } : {};
  const target = lib.features.proxy ? "/api/proxy?url=" + encodeURIComponent(url) : url;
  let r;
  try { r = await fetch(target, { headers, credentials: "omit" }); }
  catch { throw new Error(`Couldn't reach ${new URL(url).hostname}. If the link is right, the server needs to allow this site (CORS).`); }
  if (r.status === 401) throw new Error("The server asked for a username and password.");
  if (!r.ok) throw new Error(`The server answered ${r.status}.`);
  if (as === "blob") return r.blob();
  const text = await r.text();
  const doc = new DOMParser().parseFromString(text, "application/xml");
  if (doc.querySelector("parsererror") || !doc.querySelector("feed")) throw new Error("That link isn't an OPDS catalog.");
  return doc;
}

function parseFeed(doc, baseUrl) {
  const abs = (h) => (h ? new URL(h, baseUrl).href : null);
  const title = doc.querySelector("feed > title")?.textContent || "Catalog";
  const links = [...doc.querySelectorAll("feed > link")];
  const next = abs(links.find((l) => l.getAttribute("rel") === "next")?.getAttribute("href"));
  const search = abs(links.find((l) => l.getAttribute("rel") === "search")?.getAttribute("href"));
  const entries = [...doc.querySelectorAll("entry")].map((e) => {
    const L = [...e.querySelectorAll("link")];
    const find = (fn) => L.find(fn);
    const nav = find((l) => /navigation|subsection/.test(l.getAttribute("rel") || "") || /profile=opds-catalog|kind=navigation|kind=acquisition/.test(l.getAttribute("type") || ""));
    const acq = L.filter((l) => /opds-spec\.org\/acquisition/.test(l.getAttribute("rel") || ""));
    const pse = find((l) => /vaemendis\.net\/opds-pse\/stream/.test(l.getAttribute("rel") || ""));
    const thumb = find((l) => /opds-spec\.org\/image(\/thumbnail)?/.test(l.getAttribute("rel") || ""));
    const pick = acq.find((l) => /cbz|zip|comicbook/.test(l.getAttribute("type") || "")) || acq.find((l) => /epub/.test(l.getAttribute("type") || "")) || acq.find((l) => /pdf/.test(l.getAttribute("type") || "")) || acq[0];
    return {
      title: e.querySelector("title")?.textContent || "Untitled",
      author: e.querySelector("author name")?.textContent || "",
      summary: (e.querySelector("summary, content")?.textContent || "").slice(0, 300),
      nav: !acq.length && !pse && nav ? abs(nav.getAttribute("href")) : null,
      acq: pick ? { href: abs(pick.getAttribute("href")), type: pick.getAttribute("type") || "" } : null,
      pse: pse ? { template: abs(pse.getAttribute("href")).replace(/%7B/gi, "{").replace(/%7D/gi, "}"), count: Number(pse.getAttribute("pse:count") || pse.getAttributeNS("http://vaemendis.net/opds-pse/ns", "count")) } : null,
      thumb: abs(thumb?.getAttribute("href")),
    };
  });
  return { title, entries, next, search };
}

async function browseServer(server, startUrl) {
  const stack = [];
  const m = modal({ title: server.name, wide: true, body: `<div class="toolbar" style="margin-bottom:12px"><button class="btn btn-sm" type="button" id="op-back" disabled>${icon("back")}Back</button><strong id="op-title" style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"></strong></div><p class="status" id="op-status"></p><div class="list" id="op-list"></div><div class="more"><button class="btn" type="button" id="op-more" hidden>Load more</button></div>` });
  const root = m.root;
  let current = null, feed = null;
  const thumbFor = async (img, url) => {
    if (!url) return;
    try { const b = await opdsFetch(server, url, "blob"); img.src = URL.createObjectURL(b); } catch {}
  };
  const draw = (append = false) => {
    $("#op-title", root).textContent = feed.title;
    $("#op-back", root).disabled = !stack.length;
    const html = feed.entries.map((e, i) => `<div class="opds-entry" data-i="${i}">${coverHtml("", e.title)}
      <div><strong>${esc(e.title)}</strong><span>${esc([e.author, e.pse ? plural(e.pse.count, "page") : e.acq ? (e.acq.type.split("/").pop() || "file").toUpperCase() : "Folder"].filter(Boolean).join(" · "))}</span></div>
      <div style="display:flex;gap:6px">${e.nav ? `<button class="btn btn-sm" type="button" data-open="${i}">Open</button>` : ""}
        ${e.pse ? `<button class="btn btn-sm btn-accent" type="button" data-stream="${i}">Add (stream)</button>` : ""}
        ${e.acq ? `<button class="btn btn-sm ${e.pse ? "" : "btn-accent"}" type="button" data-dl="${i}">${e.pse ? "Download" : "Add"}</button>` : ""}</div></div>`).join("");
    if (append) $("#op-list", root).insertAdjacentHTML("beforeend", html); else $("#op-list", root).innerHTML = html || `<p class="status">This folder is empty.</p>`;
    $$(".opds-entry", root).forEach((row) => { const e = feed.entries[Number(row.dataset.i)]; const c = $(".cover", row); if (e?.thumb && !$("img", c)) { const img = document.createElement("img"); c.prepend(img); thumbFor(img, e.thumb); } });
    $("#op-more", root).hidden = !feed.next;
  };
  const load = async (url, push = true, append = false) => {
    $("#op-status", root).className = "status"; $("#op-status", root).textContent = "Loading…";
    try {
      const doc = await opdsFetch(server, url);
      if (push && current && !append) stack.push(current);
      const parsed = parseFeed(doc, url);
      if (append) { feed.entries.push(...parsed.entries); feed.next = parsed.next; } else feed = parsed;
      current = url;
      $("#op-status", root).textContent = "";
      draw();
    } catch (e) { $("#op-status", root).className = "status err"; $("#op-status", root).textContent = e.message; }
  };
  $("#op-back", root).onclick = () => { const u = stack.pop(); if (u) { current = null; load(u, false); } };
  $("#op-more", root).onclick = () => feed.next && load(feed.next, false, true);
  $("#op-list", root).addEventListener("click", async (ev) => {
    const o = ev.target.closest("[data-open]"), s = ev.target.closest("[data-stream]"), d = ev.target.closest("[data-dl]");
    if (o) return load(feed.entries[Number(o.dataset.open)].nav);
    const e = feed.entries[Number((s || d)?.dataset.stream ?? (s || d)?.dataset.dl)];
    if (!e) return;
    const btn = s || d; btn.disabled = true; btn.textContent = "Adding…";
    try {
      if (s) {
        await saveItem({ id: uid("v-"), type: "manga", title: e.title, series: guessFrom(feed.title, e.title), author: e.author, description: e.summary,
          source: { kind: "template", template: e.pse.template, base: 0, auth: server.auth || "", proxy: !!lib.features.proxy, server: server.id }, pages: e.pse.count,
          origin: "Streamed from " + server.name, tags: [], status: "unread", rating: 0, link: null, added: Math.floor(Date.now() / 1000),
          coverBlob: e.thumb ? await opdsFetch(server, e.thumb, "blob").catch(() => undefined) : undefined });
      } else {
        const blob = await opdsFetch(server, e.acq.href, "blob");
        const ext = /epub/.test(e.acq.type) ? "epub" : /pdf/.test(e.acq.type) ? "pdf" : /cbz|zip|comic/.test(e.acq.type) ? "cbz" : (e.acq.href.split("?")[0].split(".").pop() || "cbz");
        const file = new File([blob], `${e.title}.${ext}`, { type: blob.type });
        const { items, errors } = await importFiles([file], { series: guessFrom(feed.title, e.title), title: e.title });
        if (!items.length) throw new Error(errors.join(" ") || "That file couldn't be read.");
        items.forEach((it) => { it.origin = "Downloaded from " + server.name; saveItem(it); });
      }
      btn.textContent = "Added ✓";
      toast(`Added “${e.title}”.`, { action: "Library", onAction: () => { m.close(); go("library"); } });
    } catch (err) { btn.disabled = false; btn.textContent = "Try again"; toast(err.message, { ms: 6000 }); }
  });
  load(startUrl || server.url, false);
}
const guessFrom = (feedTitle, title) => (/^(all|latest|recent|catalog|library|home|search)/i.test(feedTitle) ? title.replace(/[\s_\-.]*(v|vol|volume|ch|chapter|#)\.?\s*\d+.*$/i, "").trim() || title : feedTitle);
