// Wikisource: volunteer-transcribed public-domain texts in many languages.
// The MediaWiki API allows requests straight from the browser (origin=*).

export const WS_LANGS = { en: "English", ja: "日本語", zh: "中文", fr: "Français", de: "Deutsch", es: "Español", it: "Italiano", ru: "Русский", pt: "Português", la: "Latina", ko: "한국어" };
const host = (lang) => `https://${WS_LANGS[lang] ? lang : "en"}.wikisource.org`;
const strip = (s) => String(s || "").replace(/<[^>]+>/g, "").replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&#039;/g, "'").replace(/\s+/g, " ").trim();

export async function searchWikisource(q, lang = "en", offset = 0) {
  const p = new URLSearchParams({ action: "query", list: "search", srsearch: q, srnamespace: "0", srlimit: "24", sroffset: String(offset), srprop: "snippet|wordcount|timestamp", format: "json", origin: "*" });
  const r = await fetch(`${host(lang)}/w/api.php?${p}`, { signal: AbortSignal.timeout(15_000) });
  if (!r.ok) throw new Error(`Wikisource answered ${r.status}.`);
  const d = await r.json();
  const results = (d.query?.search || [])
    .filter((s) => !/\(disambiguation\)|^Author:|^Portal:/i.test(s.title))
    .map((s) => ({ title: s.title, work: s.title.split("/")[0], snippet: strip(s.snippet), words: s.wordcount, lang }));
  // Collapse chapters of the same work into one entry.
  const seen = new Set();
  return {
    total: d.query?.searchinfo?.totalhits || 0,
    next: d.continue?.sroffset ?? null,
    results: results.filter((r) => !seen.has(r.work) && seen.add(r.work)).map((r) => ({ ...r, title: r.work })),
  };
}

async function parse(lang, page) {
  const p = new URLSearchParams({ action: "parse", page, prop: "text|displaytitle", redirects: "1", format: "json", origin: "*", disableeditsection: "1" });
  const r = await fetch(`${host(lang)}/w/api.php?${p}`, { signal: AbortSignal.timeout(20_000) });
  const d = await r.json();
  if (d.error) throw new Error(d.error.code === "missingtitle" ? "That page isn't on Wikisource." : d.error.info);
  return { title: strip(d.parse.displaytitle) || page, html: d.parse.text["*"], resolved: d.parse.title };
}

const DROP = "script, style, link, .ws-noexport, #headertemplate, .headertemplate, .wst-header, .ws-header, .mw-editsection, .noprint, .navbox, .mw-references-wrap + .navbox, .licenseContainer, .licenseBanner, .ws-pagenum, .pagenum, .wst-pagenum, table.ambox, .mw-empty-elt, .sisterproject, .hiddenStructure";
function clean(html, lang) {
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, "text/html");
  const root = doc.body.firstElementChild;
  root.querySelectorAll(DROP).forEach((n) => n.remove());
  for (const el of root.querySelectorAll("*")) for (const a of [...el.attributes]) if (/^on|^style$|^class$/i.test(a.name)) el.removeAttribute(a.name);
  for (const img of root.querySelectorAll("img")) { const s = img.getAttribute("src") || ""; if (s.startsWith("//")) img.setAttribute("src", "https:" + s); img.removeAttribute("srcset"); img.setAttribute("loading", "lazy"); }
  for (const a of root.querySelectorAll("a")) {
    const href = a.getAttribute("href") || "";
    if (/^https?:/.test(href) && !href.includes("wikisource.org")) { a.target = "_blank"; a.rel = "noopener"; }
    else a.replaceWith(...a.childNodes); // internal wiki links become plain text
  }
  return root.innerHTML;
}

// Loads a work: the main page plus its chapter subpages, in the order they're linked.
export async function loadWork(lang, title, onStatus = () => {}) {
  onStatus("Opening Wikisource…");
  const main = await parse(lang, title);
  const doc = new DOMParser().parseFromString(main.html, "text/html");
  const prefix = "/wiki/" + encodeURIComponent(main.resolved.replace(/ /g, "_")).replace(/%2F/g, "/") + "/";
  const subpages = [];
  for (const a of doc.querySelectorAll("a[href]")) {
    const href = a.getAttribute("href");
    if (!href.startsWith(prefix)) continue;
    const page = decodeURIComponent(href.slice("/wiki/".length).split("#")[0]).replace(/_/g, " ");
    if (!subpages.includes(page)) subpages.push(page);
  }
  const mainText = doc.body.textContent.replace(/\s+/g, " ").length;
  const chapters = [];
  // Use the main page as text when it's substantial or has no chapters.
  if (!subpages.length || mainText > 3000) chapters.push({ title: main.title, html: clean(main.html, lang) });
  const list = subpages.slice(0, 150);
  let done = 0;
  const results = new Array(list.length);
  const worker = async () => {
    while (true) {
      const i = done++;
      if (i >= list.length) return;
      onStatus(`Loading chapter ${Math.min(i + 1, list.length)} of ${list.length}…`);
      try { const c = await parse(lang, list[i]); results[i] = { title: c.title.replace(main.resolved + "/", "").replace(/^.*\//, ""), html: clean(c.html, lang) }; } catch { results[i] = null; }
    }
  };
  await Promise.all([worker(), worker(), worker(), worker()]);
  chapters.push(...results.filter(Boolean));
  if (!chapters.length) throw new Error("That Wikisource page has no text Kitsune could load.");
  return { title: main.title, chapters, truncated: subpages.length > list.length, source: `${host(lang)}/wiki/${encodeURIComponent(main.resolved.replace(/ /g, "_"))}` };
}
