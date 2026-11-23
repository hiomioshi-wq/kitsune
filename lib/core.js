// Kitsune API core. Shared by the local server (server.js) and the Vercel function (api/router.js).
// Every route returns { status, type, body, cache } so each host can send it its own way.

import { AsyncLocalStorage } from "node:async_hooks";
const UA = "Kitsune/2.0 (manga and public-domain reader)";
// Per-request details every outbound fetch can use (your browser's language preference).
const REQ = new AsyncLocalStorage();
const reqLang = () => { const l = REQ.getStore()?.lang || ""; return /^[\w\-,;=.* ]{1,200}$/.test(l) ? l : "en;q=0.9, *;q=0.5"; };
// Request headers a page may send through Kitsune (what a browser would send for it); everything else is dropped.
const PASS_REQ = /^(accept|authorization|content-type|if-none-match|if-modified-since|cache-control|pragma|range|x-(?!forwarded|real-ip|kb-|host)[\w-]{1,60})$/i;
function safeHeaders(h) {
  const out = {}; if (!h || typeof h !== "object") return out;
  for (const [k, v] of Object.entries(h).slice(0, 40)) { const val = String(v); if (PASS_REQ.test(k) && val.length < 4000 && !/[\r\n]/.test(val)) out[k.toLowerCase()] = val; }
  return out;
}
// US public domain: works published before 1931 (as of 2026).
export const PD_CUTOFF_YEAR = new Date().getFullYear() - 96;

export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

// ---------- outbound fetch with a small in-memory cache ----------

const memo = new Map();
export async function cachedFetch(url, { body, headers, ttl = 3600_000, as = "json", timeout = 25_000, jsonErrors = false } = {}) {
  const key = as + url + (body || "");
  const hit = memo.get(key);
  if (hit && hit.exp > Date.now()) return hit.val;
  let res;
  try {
    res = await fetch(url, {
      method: body ? "POST" : "GET", body,
      headers: { "User-Agent": UA, ...(headers || {}) },
      signal: AbortSignal.timeout(timeout),
      redirect: "follow",
    });
  } catch {
    throw new HttpError(502, `Couldn't reach ${new URL(url).hostname}. Try again in a moment.`);
  }
  if (!res.ok && jsonErrors && /json/.test(res.headers.get("content-type") || "")) return res.json();
  if (res.status === 404) throw new HttpError(404, "Not found at the source.");
  if (!res.ok) throw new HttpError(502, `${new URL(url).hostname} answered ${res.status}. Try again shortly.`);
  const val = as === "json" ? await res.json() : as === "text" ? await res.text() : Buffer.from(await res.arrayBuffer());
  memo.set(key, { exp: Date.now() + ttl, val });
  if (memo.size > 300) for (const k of [...memo.keys()].slice(0, 80)) memo.delete(k);
  return val;
}

const decodeEntities = (s) => s
  .replace(/&(lt|gt|amp|quot|#39|#039|apos|nbsp|mdash|ndash|hellip|rsquo|lsquo|rdquo|ldquo);/g, (_, e) =>
    ({ lt: "<", gt: ">", amp: "&", quot: '"', "#39": "'", "#039": "'", apos: "'", nbsp: " ", mdash: "—", ndash: "–", hellip: "…", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“" }[e]))
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)));
const stripHtml = (s) => decodeEntities(String(s || "").replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>/gi, "\n\n").replace(/<[^>]+>/g, "")).replace(/\n{3,}/g, "\n\n").trim();
const first = (v) => (Array.isArray(v) ? v[0] : v);
const yearOf = (d) => { const m = String(first(d) || "").match(/\d{4}/); return m ? Number(m[0]) : null; };

// ---------- Project Gutenberg (via Gutendex) ----------

function bookSummary(b) {
  const fm = b.formats || {};
  return {
    id: b.id, title: b.title || "Untitled",
    authors: (b.authors || []).map((a) => a.name),
    authorYears: (b.authors || []).map((a) => [a.birth_year, a.death_year]),
    summary: ((b.summaries || [])[0] || "").replace(/\s*\(This is an automatically generated summary\.\)\s*$/i, ""),
    subjects: (b.subjects || []).slice(0, 8),
    shelves: (b.bookshelves || []).map((s) => s.replace(/^Category: /, "")).slice(0, 6),
    languages: b.languages || [],
    downloads: b.download_count || 0,
    cover: Object.entries(fm).find(([k]) => k.startsWith("image/"))?.[1] || null,
    hasEpub: !!fm["application/epub+zip"],
    copyright: b.copyright,
    source: `https://www.gutenberg.org/ebooks/${b.id}`,
  };
}

async function booksSearch(q) {
  const p = new URLSearchParams();
  p.set("languages", q.languages || "en");
  for (const k of ["search", "topic", "page", "author_year_start", "author_year_end"]) if (q[k]) p.set(k, q[k]);
  p.set("sort", q.sort || "popular");
  try {
    const raw = await cachedFetch(`https://gutendex.com/books/?${p}`, { ttl: 6 * 3600_000, timeout: 8_000 });
    return { count: raw.count || 0, hasNext: !!raw.next, results: (raw.results || []).map(bookSummary) };
  } catch {
    return gutenbergOpdsSearch(q); // Gutendex is slow or down: use gutenberg.org's own search
  }
}

// gutenberg.org OPDS search. Supports "a." author, "s." subject and "l." language prefixes.
const ISO = { en: "english", fr: "french", de: "german", es: "spanish", it: "italian", pt: "portuguese", nl: "dutch", fi: "finnish", ja: "japanese", zh: "chinese", la: "latin", el: "greek", ru: "russian", sv: "swedish" };
async function gutenbergOpdsSearch(q) {
  const terms = [];
  if (q.search) terms.push(q.search);
  if (q.topic) terms.push("s." + q.topic);
  if (q.languages && ISO[q.languages]) terms.push("l." + ISO[q.languages]);
  const page = Math.max(1, Number(q.page) || 1);
  const sortOrder = q.sort === "descending" ? "release_date" : q.sort === "ascending" ? "title" : "downloads";
  const url = terms.length
    ? `https://www.gutenberg.org/ebooks/search.opds/?query=${encodeURIComponent(terms.join(" "))}&sort_order=${sortOrder}&start_index=${(page - 1) * 25 + 1}`
    : `https://www.gutenberg.org/ebooks/search.opds/?sort_order=downloads&start_index=${(page - 1) * 25 + 1}`;
  const xml = await cachedFetch(url, { as: "text", ttl: 6 * 3600_000, timeout: 20_000 });
  const results = [];
  for (const entry of xml.split("<entry>").slice(1)) {
    const id = Number(entry.match(/<id>https?:\/\/www\.gutenberg\.org\/ebooks\/(\d+)\.opds<\/id>/)?.[1]);
    if (!id) continue;
    const title = decodeEntities(entry.match(/<title>([^<]*)<\/title>/)?.[1] || "Untitled");
    const author = decodeEntities(entry.match(/<content type="text">([^<]*)<\/content>/)?.[1] || "");
    const downloads = Number(entry.match(/(\d+) downloads/)?.[1]) || 0;
    results.push({
      id, title, authors: author ? [author.split(/,\s*\d/)[0]] : [], authorYears: [], summary: "", subjects: [], shelves: [],
      languages: q.languages ? [q.languages] : [], downloads, cover: `https://www.gutenberg.org/cache/epub/${id}/pg${id}.cover.medium.jpg`,
      hasEpub: true, copyright: false, source: `https://www.gutenberg.org/ebooks/${id}`,
    });
  }
  return { count: results.length, hasNext: /rel="next"/.test(xml), results, via: "gutenberg.org" };
}

// One book when Gutendex is down: read its OPDS entry on gutenberg.org.
async function gutenbergOpdsBook(id) {
  const xml = await cachedFetch(`https://www.gutenberg.org/ebooks/${id}.opds`, { as: "text", ttl: 24 * 3600_000, timeout: 20_000 });
  const entry = xml.split("<entry>")[1] || xml;
  const pick = (re) => decodeEntities(entry.match(re)?.[1] || "");
  const subjects = [...entry.matchAll(/<category[^>]*term="([^"]+)"/g)].map((m) => decodeEntities(m[1])).slice(0, 8);
  const author = pick(/<author>\s*<name>([^<]+)<\/name>/);
  return {
    id, title: pick(/<title>([^<]+)<\/title>/) || "Untitled", authors: author ? [author] : [], authorYears: [],
    summary: pick(/<summary[^>]*>([^<]+)<\/summary>/), subjects, shelves: [], languages: [pick(/<dcterms:language[^>]*>([^<]+)</) || "en"],
    downloads: Number(entry.match(/(\d+) downloads/)?.[1]) || 0, cover: `https://www.gutenberg.org/cache/epub/${id}/pg${id}.cover.medium.jpg`,
    hasEpub: true, copyright: false, source: `https://www.gutenberg.org/ebooks/${id}`,
  };
}

async function bookText(id) {
  id = Number(id);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, "Book id must be a number.");
  let raw;
  for (const u of [`https://www.gutenberg.org/cache/epub/${id}/pg${id}.txt`, `https://www.gutenberg.org/ebooks/${id}.txt.utf-8`]) {
    try { raw = await cachedFetch(u, { as: "text", ttl: 600_000, timeout: 25_000 }); break; } catch (e) { if (u.includes("ebooks/")) throw e; }
  }
  raw = raw.replace(/\r\n/g, "\n");
  const start = raw.match(/\*\*\*\s*START OF (THE|THIS) PROJECT GUTENBERG EBOOK[^\n]*\n/i);
  if (start) raw = raw.slice(start.index + start[0].length);
  const end = raw.match(/\*\*\*\s*END OF (THE|THIS) PROJECT GUTENBERG EBOOK/i);
  if (end) raw = raw.slice(0, end.index);
  return raw.trim();
}

// ---------- Internet Archive scans (pre-1931, freely viewable) ----------

const LENDING = new Set(["inlibrary", "printdisabled", "lendinglibrary", "internetarchivebooks", "browserlending"]);
const isLending = (cols) => (Array.isArray(cols) ? cols : [cols]).some((c) => LENDING.has(String(c || "")));

const SCAN_KINDS = {
  manga: '(title:(manga OR ehon OR hokusai OR hiroshige OR kuniyoshi OR utamaro OR kyosai OR kibyoshi) OR subject:("Japanese picture books" OR ehon OR "Woodblock prints, Japanese" OR "Ukiyoe" OR "Ukiyo-e" OR "Color prints, Japanese" OR "Illustrated books, Japanese" OR "Comic books, strips, etc. -- Japan"))',
  books: "",
  // Themed Internet Archive shelves (still limited to the public-domain years).
  comics: '(collection:comics OR subject:("Comic books, strips, etc." OR "Comic strips" OR cartoons OR caricatures))',
  pulps: '(collection:pulpmagazinearchive OR subject:("Pulp literature" OR "Dime novels"))',
  magazines: "(collection:(magazine_rack OR periodicals) OR subject:(periodicals))",
  newspapers: "collection:newspapers",
  children: '(subject:("Picture books for children" OR "Children\'s literature" OR "Children\'s stories" OR "Nursery rhymes"))',
  music: '(collection:sheetmusic OR subject:("Sheet music" OR "Popular music" OR songs))',
  maps: "(subject:(maps OR atlases))",
  japanese: "(language:(jpn OR Japanese))",
  folklore: '(subject:("Fairy tales" OR folklore OR mythology OR legends))',
  genre: '(subject:("Science fiction" OR "Detective and mystery stories" OR "Horror tales" OR "Ghost stories" OR "Adventure stories"))',
  cookery: '(subject:(cookery OR cooking OR recipes))',
};

async function scansSearch(q) {
  const kind = SCAN_KINDS[q.kind] !== undefined ? q.kind : "books";
  const parts = [];
  if (q.q) parts.push(`(${String(q.q).replace(/[()"]/g, " ").trim()})`);
  // "många" (Swedish for "many") folds to "manga" in the search index, so leave Swedish out of manga results.
  if (SCAN_KINDS[kind]) parts.push(SCAN_KINDS[kind], ...(kind === "manga" ? ["-language:(swe OR Swedish OR sv)"] : []));
  if (!parts.length) parts.push("collection:(americana OR library_of_congress OR smithsonian OR wellcomelibrary)");
  parts.push("mediatype:texts", `date:[1000-01-01 TO ${PD_CUTOFF_YEAR - 1}-12-31]`, "imagecount:[4 TO 2000]",
    "-collection:(inlibrary OR printdisabled OR lendinglibrary OR internetarchivebooks)");
  const p = new URLSearchParams({ q: parts.join(" AND "), rows: "24", page: String(Number(q.page) || 1), output: "json" });
  for (const f of ["identifier", "title", "creator", "date", "imagecount", "subject", "language", "collection"]) p.append("fl[]", f);
  p.append("sort[]", q.sort === "date" ? "date asc" : "downloads desc");
  const raw = await cachedFetch(`https://archive.org/advancedsearch.php?${p}`, { ttl: 6 * 3600_000 });
  const docs = (raw.response?.docs || []).filter((d) => !isLending(d.collection));
  return {
    count: raw.response?.numFound || 0,
    hasNext: (Number(q.page) || 1) * 24 < (raw.response?.numFound || 0),
    results: docs.map((d) => ({
      id: d.identifier, title: decodeEntities(first(d.title) || d.identifier), creator: first(d.creator) || "",
      year: yearOf(d.date), pages: Number(d.imagecount) || 0, language: first(d.language) || "",
      subjects: (Array.isArray(d.subject) ? d.subject : [d.subject]).filter(Boolean).slice(0, 5),
      cover: `https://archive.org/services/img/${encodeURIComponent(d.identifier)}`,
      source: `https://archive.org/details/${encodeURIComponent(d.identifier)}`,
    })),
  };
}

// ---------- Museum open-access books and prints (The Met, Cleveland Museum of Art) ----------
// Only public-domain / CC0 objects. Each result carries its page images, ready to read as a volume.
async function museumSearch(q) {
  const src = q.src === "cma" ? "cma" : "met";
  const text = String(q.q || "illustrated book").slice(0, 120);
  const page = Math.max(1, Number(q.page) || 1), per = 18;
  if (src === "cma") {
    const p = new URLSearchParams({ q: text, has_image: "1", cc0: "1", limit: String(per), skip: String((page - 1) * per), fields: "id,title,creation_date,creators,images,alternate_images,share_license_status,url,type,culture" });
    const raw = await cachedFetch(`https://openaccess-api.clevelandart.org/api/artworks/?${p}`, { ttl: 12 * 3600_000 });
    const total = raw.info?.total || 0;
    return { count: total, hasNext: page * per < total, results: (raw.data || []).filter((d) => d.images?.web?.url).map((d) => ({
      id: "cma-" + d.id, title: d.title || "Untitled", creator: (d.creators?.[0]?.description || "").replace(/\s*\(.*$/, ""), year: d.creation_date || "",
      kind: d.type || "", culture: (d.culture || [])[0] || "", license: "CC0 (public domain)", source: d.url,
      cover: d.images.web.url, pages: [d.images.web.url, ...(d.alternate_images || []).map((a) => a.web?.url).filter(Boolean)].slice(0, 300),
    })) };
  }
  const ids = (await cachedFetch(`https://collectionapi.metmuseum.org/public/collection/v1.1/search?${new URLSearchParams({ q: text, hasImages: "true", isPublicDomain: "true" })}`, { ttl: 12 * 3600_000 })).objectIDs || [];
  const slice = ids.slice((page - 1) * per, page * per);
  const objs = await Promise.all(slice.map((id) => cachedFetch(`https://collectionapi.metmuseum.org/public/collection/v1/objects/${id}`, { ttl: 24 * 3600_000, timeout: 12_000 }).catch(() => null)));
  return { count: ids.length, hasNext: page * per < ids.length, results: objs.filter((o) => o?.isPublicDomain && o.primaryImage).map((o) => ({
    id: "met-" + o.objectID, title: o.title || "Untitled", creator: o.artistDisplayName || "", year: o.objectDate || "", kind: o.objectName || o.classification || "",
    culture: o.culture || "", license: "Public domain (Open Access)", source: o.objectURL,
    // "web-large" copies are about 1/25 the size of the originals and plenty for reading.
    cover: o.primaryImageSmall || o.primaryImage, pages: [o.primaryImage, ...(o.additionalImages || [])].filter(Boolean).slice(0, 300).map((u) => u.replace("/original/", "/web-large/")),
  })) };
}

// ---------- National Diet Library (Japan): digitized books via NDL Next ----------
// Keeps classical books and anything published before the public-domain year; opens through IIIF.
async function ndlSearch(q) {
  const text = String(q.q || "絵本").slice(0, 120);
  const page = Math.max(1, Number(q.page) || 1), per = 60;
  const raw = await cachedFetch(`https://lab.ndl.go.jp/dl/api/book/search?${new URLSearchParams({ keyword: text, size: String(per), from: String((page - 1) * per) })}`, { ttl: 12 * 3600_000, timeout: 20_000 });
  const results = (raw.list || []).filter((b) => b.isClassic || (b.publishyear && b.publishyear < PD_CUTOFF_YEAR)).map((b) => ({
    id: String(b.id), title: b.title + (b.volume ? " " + b.volume : ""), creator: String(b.responsibility || "").split("||")[0], year: b.publishyear || "",
    pages: b.page || 0, classic: !!b.isClassic,
    cover: `https://dl.ndl.go.jp/api/iiif/${b.id}/R0000001/full/300,/0/default.jpg`,
    manifest: `https://dl.ndl.go.jp/api/iiif/${b.id}/manifest.json`, source: `https://dl.ndl.go.jp/pid/${b.id}`,
  }));
  return { count: raw.hit || 0, hasNext: page * per < (raw.hit || 0), results };
}

async function iaItem(id) {
  if (!/^[\w.\-]+$/.test(id)) throw new HttpError(400, "That doesn't look like an Internet Archive item id.");
  const raw = await cachedFetch(`https://archive.org/metadata/${id}`, { ttl: 24 * 3600_000 });
  const m = raw.metadata;
  if (!m) throw new HttpError(404, "No Internet Archive item with that id.");
  if (isLending(m.collection)) throw new HttpError(403, "That item is borrow-only on Internet Archive, so it can't be read here. Open it on archive.org instead.");
  const year = yearOf(m.date);
  const pages = Number(m.imagecount) || 0;
  if (!pages) throw new HttpError(422, "That item has no page images Kitsune can show (it may be audio, video or a single file).");
  return {
    id, title: decodeEntities(first(m.title) || id), creator: first(m.creator) || "", year,
    publicDomain: !!year && year < PD_CUTOFF_YEAR,
    pages, rtl: m["page-progression"] === "rl" || m.page_progression === "rl",
    description: stripHtml(first(m.description)).slice(0, 1200),
    language: first(m.language) || "",
    cover: `https://archive.org/services/img/${id}`,
    pageTemplate: `https://archive.org/download/${id}/page/n{n}_w1400.jpg`,
    source: `https://archive.org/details/${id}`,
  };
}

// Binary fetch without the shared cache (page images and EPUBs are too big to keep in memory).
async function fetchBinary(url, { timeout = 25_000, max = 4_400_000 } = {}) {
  let res;
  try { res = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(timeout), redirect: "follow" }); }
  catch { throw new HttpError(502, `Couldn't reach ${new URL(url).hostname}.`); }
  if (!res.ok) throw new HttpError(res.status === 404 ? 404 : 502, `${new URL(url).hostname} answered ${res.status}.`);
  const len = Number(res.headers.get("content-length") || 0);
  if (len > max) throw new HttpError(413, "That file is too large to pass through Kitsune's server.");
  const body = Buffer.from(await res.arrayBuffer());
  if (body.length > max) throw new HttpError(413, "That file is too large to pass through Kitsune's server.");
  return { body, type: res.headers.get("content-type") || "application/octet-stream" };
}

// One page image of a freely readable Internet Archive item (used to save scans for offline reading).
async function iaPage(id, n, w) {
  const item = await iaItem(id); // validates the id and refuses borrow-only items
  n = Number(n);
  if (!Number.isInteger(n) || n < 0 || n >= item.pages) throw new HttpError(404, "No such page.");
  const width = [400, 800, 1200, 1400].includes(Number(w)) ? Number(w) : 1200;
  const { body } = await fetchBinary(`https://archive.org/download/${id}/page/n${n}_w${width}.jpg`, { timeout: 40_000 });
  return { status: 200, type: "image/jpeg", body, cache: "public, max-age=86400, s-maxage=2592000, immutable" };
}

// The recognized (OCR) text of a freely readable Internet Archive scan.
async function iaText(id) {
  await iaItem(id); // validates the id and refuses borrow-only items
  try {
    const { body } = await fetchBinary(`https://archive.org/download/${id}/${id}_djvu.txt`, { timeout: 40_000 });
    const text = body.toString("utf8").replace(/\r\n/g, "\n");
    if (text.replace(/\s/g, "").length < 200) throw new HttpError(404, "short");
    return { status: 200, type: "text/plain; charset=utf-8", body: text, cache: "public, max-age=86400, s-maxage=604800" };
  } catch (e) {
    if (e.status === 413) throw e;
    throw new HttpError(404, "This scan has no recognized text to read. Read the page images instead.");
  }
}

// Gutenberg's illustrated EPUB edition.
async function bookEpub(id) {
  id = Number(id);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, "Book id must be a number.");
  let last;
  for (const u of [`https://www.gutenberg.org/cache/epub/${id}/pg${id}-images-3.epub`, `https://www.gutenberg.org/ebooks/${id}.epub3.images`, `https://www.gutenberg.org/ebooks/${id}.epub.images`]) {
    try { const { body } = await fetchBinary(u, { timeout: 40_000 }); return { status: 200, type: "application/epub+zip", body, cache: "public, max-age=86400, s-maxage=604800" }; }
    catch (e) { last = e; if (e.status === 413) throw e; }
  }
  throw last;
}

// ---------- LibriVox audiobooks ----------

const FEATURED_AUDIO = ["Pride and Prejudice", "Alice's Adventures in Wonderland", "Frankenstein", "Dracula", "The Adventures of Sherlock Holmes",
  "Kwaidan", "The Time Machine", "Treasure Island", "The Art of War", "Little Women", "The Odyssey", "Japanese Fairy Tales"];

function audioNorm(b) {
  const ia = (b.url_iarchive || "").match(/details\/([^/?#]+)/)?.[1];
  return {
    id: Number(b.id), title: decodeEntities(b.title || "Untitled"),
    authors: (b.authors || []).map((a) => `${(a.first_name || "").trim()} ${(a.last_name || "").trim()}`.trim()).filter(Boolean),
    description: stripHtml(b.description).slice(0, 1500),
    language: b.language, totalTime: b.totaltime, totalSecs: Number(b.totaltimesecs) || 0,
    sections: Number(b.num_sections) || (b.sections || []).length,
    cover: ia ? `https://archive.org/services/img/${ia}` : null,
    genres: (b.genres || []).map((g) => g.name).slice(0, 4),
    source: b.url_librivox, textSource: b.url_text_source,
    chapters: (b.sections || []).map((s) => ({
      n: Number(s.section_number), title: decodeEntities(s.title || `Section ${s.section_number}`),
      url: (s.listen_url || "").replace(/^http:/, "https:").replace("//www.archive.org", "//archive.org"),
      secs: Number(s.playtime) || 0,
      readers: (s.readers || []).map((r) => r.display_name),
    })).filter((c) => c.url),
  };
}

async function librivox(params) {
  const p = new URLSearchParams({ format: "json", ...params });
  const raw = await cachedFetch(`https://librivox.org/api/feed/audiobooks?${p}`, { ttl: 24 * 3600_000 }).catch((e) => {
    if (e.status === 404) return { books: [] };
    throw e;
  });
  return Array.isArray(raw.books) ? raw.books : [];
}

async function audioSearch(q) {
  let books;
  if (!q.q) {
    const lists = await Promise.all(FEATURED_AUDIO.map((t) => librivox({ title: "^" + t, limit: "1" }).catch(() => [])));
    books = lists.flat();
  } else {
    const [byTitle, byAuthor] = await Promise.all([
      librivox({ title: "^" + q.q, limit: "24" }).catch(() => []),
      librivox({ author: q.q.split(/\s+/).pop(), limit: "24" }).catch(() => []),
    ]);
    const seen = new Set();
    books = [...byTitle, ...byAuthor].filter((b) => !seen.has(b.id) && seen.add(b.id));
  }
  return { results: books.map((b) => { const n = audioNorm(b); delete n.chapters; return n; }) };
}

async function audioDetail(id) {
  const [b] = await librivox({ id: String(Number(id)), extended: "1" });
  if (!b) throw new HttpError(404, "No LibriVox audiobook with that id.");
  return audioNorm(b);
}

// ---------- AniList ----------

const FIELDS = `
  id siteUrl format status chapters volumes averageScore popularity genres countryOfOrigin
  title { romaji english native }
  coverImage { large extraLarge color }
  bannerImage
  description(asHtml: false)
  startDate { year }
  staff(perPage: 4, sort: RELEVANCE) { edges { role node { name { full } } } }
  externalLinks { site url type }`;

async function anilist(query, variables, ttl = 1800_000) {
  const raw = await cachedFetch("https://graphql.anilist.co", {
    body: JSON.stringify({ query, variables }),
    headers: { "Content-Type": "application/json", Accept: "application/json" }, ttl, jsonErrors: true,
  });
  if (raw.errors?.length) {
    const msg = raw.errors[0].message || "AniList error";
    throw new HttpError(/not found/i.test(msg) ? 404 : 502, /not found/i.test(msg) ? "AniList has no user or title by that name." : msg);
  }
  return raw.data;
}

function mangaNorm(m) {
  const t = m.title || {};
  return {
    id: m.id, title: t.english || t.romaji || t.native, altTitle: t.english ? t.romaji : t.native, native: t.native,
    cover: m.coverImage?.extraLarge || m.coverImage?.large, color: m.coverImage?.color, banner: m.bannerImage,
    description: stripHtml(m.description), format: m.format, status: m.status, chapters: m.chapters, volumes: m.volumes,
    score: m.averageScore, popularity: m.popularity, genres: m.genres || [], year: m.startDate?.year, country: m.countryOfOrigin,
    staff: (m.staff?.edges || []).map((e) => ({ name: e.node.name.full, role: e.role })),
    links: (m.externalLinks || []).filter((l) => l.url),
    source: m.siteUrl,
  };
}

const SORTS = { trending: "TRENDING_DESC", popular: "POPULARITY_DESC", score: "SCORE_DESC", new: "START_DATE_DESC", match: "SEARCH_MATCH" };
async function mangaBrowse(q) {
  const vars = { p: Number(q.page) || 1, sort: [SORTS[q.sort] || (q.q ? "SEARCH_MATCH" : "TRENDING_DESC")] };
  const args = ["type:MANGA", "isAdult:false", "page:$p", "sort:$sort"];
  const defs = ["$p:Int", "$sort:[MediaSort]"];
  if (q.q) { vars.q = q.q; defs.push("$q:String"); args.push("search:$q"); }
  if (q.genre) { vars.genre = q.genre; defs.push("$genre:String"); args.push("genre:$genre"); }
  if (q.country) { vars.country = q.country; defs.push("$country:CountryCode"); args.push("countryOfOrigin:$country"); }
  if (q.status) { vars.status = q.status; defs.push("$status:MediaStatus"); args.push("status:$status"); }
  const query = `query(${defs.join(",")}){Page(page:$p,perPage:24){pageInfo{hasNextPage}
    media(${args.filter((a) => a !== "page:$p").join(",")}){${FIELDS}}}}`;
  const d = await anilist(query, vars);
  return { hasNext: d.Page.pageInfo.hasNextPage, results: d.Page.media.map(mangaNorm) };
}
const mangaDetail = async (id) => {
  const d = await anilist(`query($id:Int){Media(id:$id,type:MANGA){${FIELDS}
    recommendations(perPage:8,sort:RATING_DESC){nodes{mediaRecommendation{${FIELDS}}}}}}`, { id: Number(id) });
  const m = mangaNorm(d.Media);
  m.recommendations = (d.Media.recommendations?.nodes || []).map((n) => n.mediaRecommendation).filter(Boolean).map(mangaNorm);
  return m;
};

async function anilistUser(name) {
  if (!/^[\w-]{2,30}$/.test(name)) throw new HttpError(400, "AniList usernames are 2–30 letters, numbers, - or _.");
  const d = await anilist(`query($u:String){MediaListCollection(userName:$u,type:MANGA){user{name avatar{medium} siteUrl}
    lists{name status entries{status progress progressVolumes score(format:POINT_10) updatedAt media{${FIELDS}}}}}}`, { u: name }, 300_000);
  const c = d.MediaListCollection;
  return {
    user: { name: c.user.name, avatar: c.user.avatar?.medium, url: c.user.siteUrl },
    entries: c.lists.flatMap((l) => l.entries.map((e) => ({
      status: e.status, progress: e.progress, progressVolumes: e.progressVolumes, score: e.score, updatedAt: e.updatedAt, media: mangaNorm(e.media),
    }))),
  };
}

// Standard Ebooks: carefully typeset public-domain ebooks. We read their public
// search page only; downloads stay on their site, as their robots.txt asks.
async function standardEbooks(q) {
  const p = new URLSearchParams({ "per-page": "24", page: String(Math.max(1, Number(q.page) || 1)) });
  if (q.q) p.set("query", String(q.q).slice(0, 100)); else p.set("sort", q.sort === "new" ? "newest" : "popularity");
  const html = await cachedFetch(`https://standardebooks.org/ebooks?${p}`, { as: "text", ttl: 12 * 3600_000 });
  const results = [];
  for (const block of html.split(/<li[^>]*typeof="schema:Book"/).slice(1)) {
    const path = block.match(/about="(\/ebooks\/[^"]+)"/)?.[1];
    const title = block.match(/property="schema:url"><span property="schema:name">([^<]+)/)?.[1];
    if (!path || !title) continue;
    const authors = [...block.matchAll(/property="schema:author"[\s\S]*?<span property="schema:name">([^<]+)/g)].map((m) => decodeEntities(m[1]));
    const cover = block.match(/<img[^>]+src="(\/images\/covers\/[^"]+)"/)?.[1];
    results.push({ id: path.replace(/^\/ebooks\//, ""), title: decodeEntities(title), authors, cover: cover ? "https://standardebooks.org" + cover : null, url: "https://standardebooks.org" + path });
  }
  const hasNext = /rel="next"/.test(html);
  return { results, hasNext };
}

// ---------- Library of Congress (scanned books, before 1931) ----------
async function locSearch(q) {
  const p = new URLSearchParams({ fo: "json", c: "24", sp: String(Math.max(1, Number(q.page) || 1)),
    fa: "online-format:image|access-restricted:false", dates: `1500/${PD_CUTOFF_YEAR - 1}`, at: "results,pagination" });
  if (q.q) p.set("q", String(q.q).slice(0, 120));
  const d = await cachedFetch(`https://www.loc.gov/books/?${p}`, { ttl: 12 * 3600_000, timeout: 25_000 });
  const results = (d.results || []).filter((r) => r.id && !r.access_restricted).map((r) => {
    const id = String(r.id).match(/\/item\/([^/]+)/)?.[1];
    const img = (r.image_url || [])[0] || null;
    return id && {
      id, title: decodeEntities(String(r.title || "Untitled").replace(/[,.;:\s]+$/, "")), creator: (r.contributor || [])[0] || "",
      year: yearOf(r.date), cover: img ? img.replace(/\/full\/[^/]+\//, "/full/400,/").replace(/#.*$/, "") : null,
      source: `https://www.loc.gov/item/${id}/`, subjects: (r.subject || []).slice(0, 4),
    };
  }).filter(Boolean);
  return { results, hasNext: !!d.pagination?.next, count: d.pagination?.of || results.length };
}

async function locItem(id) {
  if (!/^[\w.-]+$/.test(id)) throw new HttpError(400, "That isn't a Library of Congress item id.");
  const d = await cachedFetch(`https://www.loc.gov/item/${id}/?fo=json&at=item,resources`, { ttl: 24 * 3600_000, timeout: 30_000 });
  const res = (d.resources || []).find((r) => r.files?.length) || {};
  // Each page lists several sizes; build a IIIF URL at reading size from any of them.
  const pages = (res.files || []).map((variants) => {
    const v = variants.find((x) => /image-services\/iiif/.test(x.url || "")) || variants.find((x) => /jpe?g/.test(x.mimetype || ""));
    return v?.url ? v.url.replace(/\/full\/[^/]+\/0\/default\.jpg.*/, "/full/1400,/0/default.jpg") : null;
  }).filter(Boolean);
  if (!pages.length) throw new HttpError(422, "This Library of Congress item has no page images Kitsune can show.");
  const it = d.item || {};
  const year = yearOf(it.date);
  return {
    id, title: decodeEntities(String(it.title || "Untitled").replace(/[,.;:\s]+$/, "")), creator: (it.contributors || it.contributor_names || [])[0] || "",
    year, publicDomain: !!year && year < PD_CUTOFF_YEAR, pages, description: stripHtml(first(it.summary) || first(it.description) || "").slice(0, 1200),
    source: `https://www.loc.gov/item/${id}/`, rights: stripHtml(first(it.rights_advisory) || first(it.rights) || "").slice(0, 300),
  };
}

// Open Library "public scan" works point at several Internet Archive copies;
// return the first one that is freely readable (not borrow-only).
async function openLibraryScan(idsParam) {
  const ids = String(idsParam || "").split(",").map((s) => s.trim()).filter((s) => /^[\w.-]+$/.test(s)).slice(0, 8);
  for (const id of ids) {
    try { const it = await iaItem(id); return { id: it.id }; } catch {}
  }
  throw new HttpError(404, "None of this book's scans are free to read online. Open it on Open Library to borrow it instead.");
}

// RSS/Atom feeds for custom sources. Many feeds don't allow browser requests, so
// this fetches them, but only feeds: public http(s) hosts, XML replies, 1.5 MB max.
function isPrivateHost(host) {
  host = host.toLowerCase().replace(/^\[|\]$/g, "");
  if (/^(localhost|.*\.local|.*\.internal|.*\.localhost|metadata\.google\.internal)$/.test(host)) return true;
  if (/^(127\.|10\.|0\.|169\.254\.|192\.168\.)/.test(host)) return true;
  const m = host.match(/^172\.(\d+)\./); if (m && +m[1] >= 16 && +m[1] <= 31) return true;
  if (/^(::1?|fc|fd|fe80:)/.test(host) || /^\d+$/.test(host)) return true;
  return false;
}
async function feed(urlStr, as = "xml") {
  let u;
  try { u = new URL(String(urlStr || "")); } catch { throw new HttpError(400, "Give the full link, starting with https://"); }
  if (!/^https?:$/.test(u.protocol) || isPrivateHost(u.hostname) || (u.port && !["80", "443", ""].includes(u.port))) throw new HttpError(400, "Only public http(s) links can be loaded.");
  if (as === "json") {
    // Search APIs for custom sources that don't allow browser requests. JSON replies only, 2 MB max.
    const r = await guardedFetch(u.href, { accept: "application/json", maxBytes: 2_000_000, timeout: 15_000 });
    if (r.status >= 400) throw new HttpError(502, `${u.hostname} answered ${r.status}.`);
    const body = r.buf.toString("utf8").slice(0, 2_000_000);
    try { JSON.parse(body); } catch { throw new HttpError(415, "That link didn't return JSON."); }
    return { status: 200, type: "application/json; charset=utf-8", body, cache: "public, max-age=300, s-maxage=600" };
  }
  const res = await guardedFetch(u.href, { accept: "application/rss+xml, application/atom+xml, application/xml, text/xml", maxBytes: 1_500_000, timeout: 15_000 });
  if (res.status >= 400) throw new HttpError(502, `${u.hostname} answered ${res.status}.`);
  const text = res.buf.toString("utf8").slice(0, 1_500_000);
  const type = res.type || "";
  if (!/xml|rss|atom/i.test(type) && !/^\s*(<\?xml|<rss|<feed)/i.test(text)) throw new HttpError(415, "That link isn't an RSS or Atom feed.");
  return { status: 200, type: "application/xml; charset=utf-8", body: text, cache: "public, max-age=600, s-maxage=900" };
}

// ---------- the in-app browser ----------
// Pages are fetched here and rendered by Kitsune itself, without their scripts. Every hop of a redirect, and every
// address a name resolves to, is checked, so a page can't steer the server into a private network.
const BROWSER_UA = "Mozilla/5.0 (compatible; KitsuneReader/2.0; +reading app)";
const CHROME_UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const MOBILE_UA = "Mozilla/5.0 (compatible; KitsuneReader/2.0; Mobile; +reading app)";
// Cookies you allowed for a site only ever go to that site (or its own subdomains).
const MULTI_PSL = /^(co|com|org|net|edu|gov|ac)\.[a-z]{2}$|^(github\.io|gitlab\.io|vercel\.app|netlify\.app|herokuapp\.com|appspot\.com|pages\.dev)$/i;
const regDomain = (h) => { const p = h.toLowerCase().split("."); return p.length >= 3 && MULTI_PSL.test(p.slice(-2).join(".")) ? p.slice(-3).join(".") : p.slice(-2).join("."); };
const sameSite = (a, b) => regDomain(a) === regDomain(b);
async function safeUrl(raw) {
  let u;
  try { u = new URL(String(raw || "")); } catch { throw new HttpError(400, "That isn't a web address."); }
  if (!/^https?:$/.test(u.protocol)) throw new HttpError(400, "Only http and https pages can be opened.");
  if (u.port && !["80", "443"].includes(u.port)) throw new HttpError(400, "Kitsune only opens pages on the standard web ports.");
  if (u.username || u.password) throw new HttpError(400, "Links with passwords in them can't be opened.");
  if (isPrivateHost(u.hostname)) throw new HttpError(400, "That address is on a private network.");
  try {
    const { lookup } = await import("node:dns/promises");
    const addrs = await lookup(u.hostname.replace(/^\[|\]$/g, ""), { all: true });
    if (!addrs.length || addrs.some((a) => isPrivateHost(a.address) || /^(::ffff:)?(127|10|0|169\.254|192\.168)\./.test(a.address) || /^::ffff:172\.(1[6-9]|2\d|3[01])\./.test(a.address))) throw new HttpError(400, "That address is on a private network.");
  } catch (e) { if (e instanceof HttpError) throw e; throw new HttpError(502, `Couldn't find ${u.hostname}.`); }
  return u;
}
async function guardedFetch(raw, { accept = "*/*", maxBytes = 3_000_000, timeout = 15_000, method = "GET", body = null, contentType = "", cookie = "", ua = "", referer = "", headers: extra = null, truncate = false } = {}) {
  let u = await safeUrl(raw), res;
  const firstHost = u.hostname, setCookies = [], more = safeHeaders(extra); let altUa = false;
  for (let hop = 0; hop < 6; hop++) {
    const first = hop === 0, m = first ? method : method === "HEAD" ? "HEAD" : "GET"; // after a redirect, a plain GET, like browsers do
    const sendBody = first && body != null && !/^(GET|HEAD)$/.test(m);
    const headers = { "User-Agent": altUa || ua === "chrome" ? CHROME_UA : ua === "mobile" ? MOBILE_UA : BROWSER_UA, Accept: accept, "Accept-Language": reqLang(), ...(sendBody && contentType ? { "Content-Type": contentType } : {}), ...(cookie && sameSite(u.hostname, firstHost) ? { Cookie: cookie } : {}), ...(referer && /^https?:/.test(referer) ? { Referer: referer } : {}), ...(first ? more : {}) };
    for (const k of Object.keys(headers)) { const l = k.toLowerCase(); if (l !== k) { if (!(l in headers)) headers[l] = headers[k]; delete headers[k]; } } // one value per header; the page's own wins
    if (!sendBody) delete headers["content-type"];
    for (let tries = 0; ; tries++) {
      try { res = await fetch(u, { method: m, body: sendBody ? body : undefined, redirect: "manual", headers, signal: AbortSignal.timeout(timeout) }); }
      catch { if (m === "GET" && tries < 1) { await new Promise((r) => setTimeout(r, 400)); continue; } throw new HttpError(502, `Couldn't reach ${u.hostname}.`); }
      // some sites turn away anything that calls itself an app: once, try again as an ordinary browser
      if (m === "GET" && [403, 406].includes(res.status) && !altUa && !res.headers.get("cf-mitigated") && !more["user-agent"] && !more["User-Agent"]) { altUa = true; headers["user-agent"] = CHROME_UA; try { await res.body?.cancel(); } catch {} continue; }
      if (m === "GET" && res.status === 429 && tries < 1 && Number(res.headers.get("retry-after") || 99) <= 3) { try { await res.body?.cancel(); } catch {} await new Promise((r) => setTimeout(r, Number(res.headers.get("retry-after")) * 1000 + 200)); continue; }
      if (m === "GET" && [502, 503, 504].includes(res.status) && tries < 1 && !res.headers.get("cf-mitigated")) { try { await res.body?.cancel(); } catch {} await new Promise((r) => setTimeout(r, 700)); continue; }
      break;
    }
    for (const c of res.headers.getSetCookie?.() || []) setCookies.push({ host: u.hostname, raw: c.slice(0, 4096) });
    if (res.status >= 300 && res.status < 400 && res.headers.get("location")) { u = await safeUrl(new URL(res.headers.get("location"), u).href); continue; }
    break;
  }
  if (res.status >= 300 && res.status < 400 && res.status !== 304) throw new HttpError(502, "Too many redirects.");
  const len = Number(res.headers.get("content-length") || 0);
  if (len > maxBytes && !truncate) throw new HttpError(413, `That's too big to open here (${Math.round(len / 1e6)} MB).`);
  const reader = res.body?.getReader(); const chunks = []; let got = 0, truncated = false;
  if (reader) for (;;) { const { done, value } = await reader.read(); if (done) break; got += value.length; if (got > maxBytes) { reader.cancel().catch(() => {}); if (truncate) { truncated = true; break; } throw new HttpError(413, "That's too big to open here."); } chunks.push(value); }
  return { url: u.href, status: res.status, type: res.headers.get("content-type") || "", buf: Buffer.concat(chunks), headers: res.headers, setCookies, truncated };
}
const FILE_TYPES = /(epub|pdf|zip|cbz|cbr|x-cbr|comicbook|octet-stream|image\/|audio\/|video\/)/i;
// the web's real label spellings (WHATWG aliases plus the ones old pages use), so TextDecoder never sees a name it can't read
const CS_ALIAS = { gb2312: "gbk", gb_2312: "gbk", "gb2312-80": "gbk", "gbk-0": "gbk", cp936: "gbk", ms936: "gbk", "ks_c_5601-1987": "euc-kr", ksc5601: "euc-kr", ksx1001: "euc-kr", cp949: "euc-kr", "windows-949": "euc-kr", "x-euc-kr": "euc-kr", "euc_kr": "euc-kr", "big5-hkscs": "big5", "cn-big5": "big5", "ms-big5": "big5", cp950: "big5", "x-x-big5": "big5", "x-big5": "big5", "sjis": "shift_jis", "x-sjis": "shift_jis", "shift-jis": "shift_jis", "csshiftjis": "shift_jis", "ms_kanji": "shift_jis", "windows-31j": "shift_jis", cp932: "shift_jis", "eucjp": "euc-jp", "x-euc-jp": "euc-jp", "euc_jp": "euc-jp", "iso-2022-jp": "iso-2022-jp", "windows-1250": "windows-1250", "windows-1252": "windows-1252", "cp1252": "windows-1252", "latin1": "windows-1252", l1: "windows-1252", "iso8859-1": "windows-1252", "iso-8859-1": "windows-1252", "iso88592": "iso-8859-2", "iso-8859-15": "iso-8859-15", "koi8": "koi8-r", "windows-1251": "windows-1251", "cp1251": "windows-1251", "x-cp1251": "windows-1251", "windows-874": "windows-874", "tis-620": "windows-874", "macintosh": "macintosh", "x-mac-roman": "macintosh", "us-ascii": "windows-1252", "ascii": "windows-1252", "utf8": "utf-8" };
const csLabel = (raw) => { const k = String(raw || "").trim().toLowerCase().replace(/["']/g, "").replace(/\s+/g, ""); return CS_ALIAS[k] || CS_ALIAS[k.replace(/-/g, "")] || k; };
function decodeHtml(buf, type) {
  if (buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) return new TextDecoder("utf-8").decode(buf);
  if (buf[0] === 0xff && buf[1] === 0xfe) return new TextDecoder("utf-16le").decode(buf);
  if (buf[0] === 0xfe && buf[1] === 0xff) return new TextDecoder("utf-16be").decode(buf);
  let cs = (type.match(/charset=["']?([\w:.-]+)/i) || [])[1];
  // a page's own <meta charset> can sit deep in a heavy <head>; the old 4 KB window missed them
  if (!cs) { const head = buf.subarray(0, 65536).toString("latin1"); cs = (head.match(/<meta[^>]+charset=["']?([\w:.-]+)/i) || head.match(/<\?xml[^>]+encoding=["']([\w:.-]+)/i) || [])[1]; }
  if (cs) cs = csLabel(cs);
  // a server that says UTF-8 for text that isn't: trust the page's own declaration (or Windows-1252, the web's old default)
  if (!cs || /^utf-?8$/i.test(cs)) { try { return new TextDecoder("utf-8", { fatal: true }).decode(buf); } catch { const head = buf.subarray(0, 65536).toString("latin1"); const own = (head.match(/<meta[^>]+charset=["']?([\w:.-]+)/i) || [])[1]; cs = own && !/^utf-?8$/i.test(own) ? csLabel(own) : "windows-1252"; } }
  for (const c of [cs, "windows-1252", "iso-8859-1"]) { if (!c) continue; try { return new TextDecoder(c.toLowerCase()).decode(buf); } catch {} }
  return new TextDecoder("utf-8").decode(buf);
}
async function browsePage(raw, cookie = "", ua = "") {
  const slow = /(^|\.)archive\.org$/.test((() => { try { return new URL(raw).hostname; } catch { return ""; } })());
  const r = await guardedFetch(raw, { accept: "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.5", timeout: slow ? 35_000 : 15_000, cookie, ua, maxBytes: 4_000_000, truncate: true });
  const ctype = r.type.split(";")[0].trim().toLowerCase();
  const sc = { ctype, ...(r.setCookies.length ? { setCookies: r.setCookies } : {}), ...(r.headers.get("refresh") ? { refresh: r.headers.get("refresh").slice(0, 500) } : {}) };
  const name = decodeURIComponent(new URL(r.url).pathname.split("/").pop() || "");
  const head = r.buf.subarray(0, 600).toString("latin1").trimStart().toLowerCase(), looksHtml = /^(<!doctype html|<html|<head|<body|<!--)/.test(head);
  if (looksHtml && /octet-stream|^$|binary/.test(r.type.split(";")[0].trim() || "")) r.type = "text/html";
  if (FILE_TYPES.test(r.type) || /\.(epub|pdf|cbz|cbr|zip|mobi|azw3?)$/i.test(name)) return { ...sc, url: r.url, status: r.status, file: { type: r.type.split(";")[0], size: r.buf.length, name: name || new URL(r.url).hostname } };
  if (/json/.test(r.type)) return { ...sc, url: r.url, status: r.status, text: r.buf.toString("utf8").slice(0, 400_000), kind: "json" };
  if (/^text\/(?!html|xml|plain|markdown)|^application\/(x-)?(javascript|ecmascript|yaml|toml|sql|x-sh|x-ndjson|ics)/.test(ctype)) return { ...sc, url: r.url, status: r.status, text: decodeHtml(r.buf, r.type).slice(0, 2_000_000), kind: "text" };
  if (/text\/plain|text\/markdown/.test(r.type)) return { ...sc, url: r.url, status: r.status, text: decodeHtml(r.buf, r.type), kind: "text" };
  if (/xml|rss|atom/.test(r.type) && !/html/.test(r.type)) return { ...sc, url: r.url, status: r.status, text: decodeHtml(r.buf, r.type), kind: "xml" };
  let html = decodeHtml(r.buf, r.type), final = r;
  // a thin page that says it is a robot check or needs a script: ask once more as an ordinary browser, keep whichever is fuller
  if (ua !== "chrome" && html.length < 6000 && /(are you a (robot|human)|captcha|access denied|bot detect|unusual traffic|checking your browser|enable javascript|request blocked|pardon our interruption)/i.test(html)) {
    try { const r2 = await guardedFetch(raw, { accept: "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.5", timeout: 15_000, cookie, ua: "chrome", maxBytes: 4_000_000, truncate: true }); const h2 = decodeHtml(r2.buf, r2.type); if (h2.length > html.length * 2 && !/text\/(plain|css)/.test(r2.type)) { html = h2; final = r2; } } catch {}
  }
  return { ...sc, url: final.url, status: final.status, html, kind: "html", ...(final.truncated ? { truncated: true } : {}) };
}
async function browseImg(raw, ref = "") {
  const r = await guardedFetch(raw, { accept: "image/avif,image/webp,image/*,*/*;q=0.5", maxBytes: 4_000_000, referer: ref });
  if (!/^image\//i.test(r.type)) throw new HttpError(415, "That isn't a picture.");
  return { status: 200, type: r.type, body: r.buf, cache: "public, max-age=86400", headers: { "X-Content-Type-Options": "nosniff", "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox" } };
}
async function browseCss(raw) {
  const r = await guardedFetch(raw, { accept: "text/css,*/*;q=0.1", maxBytes: 900_000 });
  return { status: 200, type: "text/css; charset=utf-8", body: decodeHtml(r.buf, r.type), cache: "public, max-age=3600, s-maxage=86400" };
}
// Live mode: the page with its scripts, served sandboxed. The Content-Security-Policy sandbox header seals it even if
// this address were opened on its own, so it can never reach Kitsune's origin, storage or cookies.
const TRACKER_HOSTS = /(^|\.)(google-analytics\.com|googletagmanager\.com|doubleclick\.net|googlesyndication\.com|googleadservices\.com|facebook\.net|hotjar\.com|clarity\.ms|segment\.(com|io)|mixpanel\.com|amplitude\.com|fullstory\.com|nr-data\.net|newrelic\.com|scorecardresearch\.com|quantserve\.com|chartbeat\.(com|net)|parsely\.com|taboola\.com|outbrain\.com|criteo\.(com|net)|adnxs\.com|amazon-adsystem\.com|pubmatic\.com|rubiconproject\.com|moatads\.com|ads-twitter\.com|licdn\.com|bat\.bing\.com|mxpnl\.com|cloudflareinsights\.com|plausible\.io|matomo\.cloud)$/i;
const INLINE_TRACKING = /googletagmanager|google-analytics\.com|gtag\(|fbq\(|connect\.facebook\.net|hotjar|_paq\.push|clarity\.ms|mixpanel|amplitude\.getInstance|_hsq|plausible\(/;
// The helper is written straight into the page (a sealed page may not fetch anything from Kitsune's own address).
let SHIM_TEXT = null;
async function shimText() {
  if (SHIM_TEXT != null) return SHIM_TEXT;
  try { const { readFile } = await import("node:fs/promises"); SHIM_TEXT = (await readFile(new URL("../public/js/live-shim.js", import.meta.url), "utf8")).replace(/<\//g, "<\\/"); }
  catch { SHIM_TEXT = ""; }
  return SHIM_TEXT;
}
async function browseLive(raw, origin = "", cookie = "", user = { scripts: [], styles: [] }, opts = {}) {
  const post = opts.method === "POST";
  const r = await guardedFetch(raw, { accept: "text/html,application/xhtml+xml", cookie, ua: opts.ua, method: post ? "POST" : "GET", body: post ? opts.body : null, contentType: opts.ctype || "" });
  if (!/html/i.test(r.type) && !/^\s*</.test(r.buf.subarray(0, 200).toString())) throw new HttpError(415, "Only web pages can run live.");
  let html = decodeHtml(r.buf, r.type), blocked = 0;
  html = html.replace(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi, (m, attrs, body) => {
    const src = attrs.match(/\bsrc\s*=\s*["']?([^"'\s>]+)/i)?.[1];
    if (src) { try { if (TRACKER_HOSTS.test(new URL(src, r.url).hostname)) { blocked++; return ""; } } catch {} return m; }
    if (INLINE_TRACKING.test(body)) { blocked++; return ""; }
    return m;
  });
  html = html.replace(/<meta[^>]+http-equiv=["']?(content-security-policy|refresh)["']?[^>]*>/gi, "").replace(/<base\b[^>]*>/gi, "");
  html = html.replace(/<link\b[^>]*>/gi, (t) => t.replace(/\sintegrity\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/i, "")).replace(/<style[^>]*id=["']?anti-?clickjack["']?[^>]*>[\s\S]*?<\/style>/gi, "");
  const page = new URL(r.url), sameSite = (u) => { try { const x = new URL(u, r.url); return x.protocol === "https:" && (x.hostname === page.hostname || regDomain(x.hostname) === regDomain(page.hostname)); } catch { return false; } };
  let relayed = 0;
  if (origin && page.protocol === "https:") {
    const rewrite = async (tag, attr) => {
      const re = new RegExp(`(\\b${attr}\\s*=\\s*)(["']?)([^"'\\s>]+)\\2`, "i"), m = tag.match(re);
      if (!m || !sameSite(m[3])) return tag;
      relayed++;
      return tag.replace(re, `$1"${(await relayUrl(origin, new URL(m[3].replace(/&amp;/g, "&"), r.url).href)).replace(/"/g, "&quot;")}"`);
    };
    const swaps = [];
    html.replace(/<script\b[^>]*\btype\s*=\s*["']?module["']?[^>]*>/gi, (t) => { swaps.push([t, "src"]); return t; });
    html.replace(/<link\b[^>]*\brel\s*=\s*["']?(modulepreload|stylesheet|preload)["']?[^>]*>/gi, (t, rel) => { if (rel.toLowerCase() !== "preload" || /\bas\s*=\s*["']?(font|script|style)/i.test(t)) swaps.push([t, "href"]); return t; });
    for (const [t, a] of swaps) { const n = await rewrite(t, a); if (n !== t) html = html.split(t).join(n); }
    // inline <style> blocks: fonts through the relay
    const styles = []; html.replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gi, (m, c) => { if (/@font-face|url\(/i.test(c)) styles.push([m, c]); return m; });
    for (const [m, c] of styles) html = html.split(m).join(m.replace(c, await relayCss(c, r.url, origin)));
    const more = [];
    html.replace(/<(img|script|source|video|audio|link|iframe)\b[^>]*>/gi, (t, tag) => {
      const attr = /^link$/i.test(tag) ? "href" : "src", m = t.match(new RegExp(`\\b${attr}\\s*=\\s*["']?([^"'\\s>]+)`, "i"));
      if (!m || /^iframe$/i.test(tag) && !/^http:/i.test(m[1])) return t;
      let abs; try { abs = new URL(m[1].replace(/&amp;/g, "&"), r.url).href; } catch { return t; }
      if (/^http:/.test(abs) && !/^iframe$/i.test(tag) || (/\bcrossorigin\b/i.test(t) && sameSite(abs))) more.push([t, m[1], abs]);
      return t;
    });
    html = await (async () => {
      const frames = []; html.replace(/<iframe\b[^>]*\bsrc\s*=\s*["']?([^"'\s>]+)[^>]*>/gi, (t, src) => { frames.push([t, src]); return t; });
      for (const [t, src] of frames.slice(0, 8)) { let abs; try { abs = new URL(src.replace(/&amp;/g, "&"), r.url).href; } catch { continue; } if (!/^https?:/.test(abs) || !sameSite(abs)) continue; html = html.split(t).join(t.split(src).join(`${origin}/api/browse/live?url=${encodeURIComponent(abs)}`)); }
      return html;
    })();
    for (const [t, raw, abs] of more) { const n = t.split(raw).join(await relayUrl(origin, abs)); if (n !== t) { html = html.split(t).join(n); relayed++; } }
  }
  const importMap = origin && page.protocol === "https:" ? `<script type="importmap">${JSON.stringify({ imports: { [page.origin + "/"]: (await relayUrl(origin, page.origin + "/")) } })}</script>` : "";
  const esc2 = (x) => x.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  // the helper gets Kitsune's full address: browsers look ahead for <base>, so a relative one would point at the site
  const code = await shimText();
  const relayPrefix = origin && page.protocol === "https:" ? (await relayUrl(origin, page.origin + "/")).replace(/\/$/, "") : "";
  const store = opts.storage ? `data-storage="${Buffer.from(String(opts.storage)).toString("base64")}"` : "";
  const ck = `${store} data-trk="${esc2(TRACKER_HOSTS.source)}" data-relay="${esc2(relayPrefix)}" data-relayed="${relayed}" data-cookie="${esc2(cookie.split("; ").filter(Boolean).join("; "))}" data-setcookies="${r.setCookies.length ? Buffer.from(JSON.stringify(r.setCookies)).toString("base64") : ""}"`;
  const helper = code ? `<script ${ck} data-real="${esc2(r.url)}" data-blocked="${blocked}">${code}</script>` : `<script src="${esc2(origin)}/js/live-shim.js" data-real="${esc2(r.url)}" data-blocked="${blocked}"></script>`;
  const inject = `${helper}<base href="${esc2(r.url)}"><meta name="referrer" content="no-referrer">${importMap}`;
  // your userscripts and styles, after the helper (which provides their GM_* functions)
  const safe = (x) => String(x).replace(/<\//g, "<\\/");
  const userCode = (user.styles || []).map((c) => `<style data-kb-userstyle>${String(c).replace(/<\/style/gi, "<\\/style")}</style>`).join("") + (user.scripts || []).map((c) => `<script data-kb-userscript>${safe(c)}</script>`).join("");
  html = /<head[^>]*>/i.test(html) ? html.replace(/<head[^>]*>/i, (h) => h + inject + userCode) : inject + userCode + html;
  return { status: 200, type: "text/html; charset=utf-8", body: html, cache: "no-store",
    headers: { "Content-Security-Policy": "sandbox allow-scripts allow-modals allow-pointer-lock", "Referrer-Policy": "no-referrer", "X-Content-Type-Options": "nosniff" } };
}

// ---------- the asset relay for live pages ----------
// A sealed page can't load a site's ES modules or web fonts from the site itself (both need CORS), so it loads them
// from here. Addresses are signed per site and per day, so the relay only works for pages Kitsune itself served.
import { randomBytes } from "node:crypto";
const RELAY_SECRET = process.env.KB_SECRET || randomBytes(32).toString("hex");
async function relaySig(host, day = Math.floor(Date.now() / 86_400_000)) {
  const { createHmac } = await import("node:crypto");
  return createHmac("sha256", RELAY_SECRET).update(host.toLowerCase() + ":" + day).digest("hex").slice(0, 20);
}
async function relayUrl(origin, abs) {
  const u = new URL(abs), seg = (u.protocol === "http:" ? "_http_" : "") + u.hostname;
  return `${origin}/api/browse/x/${await relaySig(seg)}/${seg}${u.pathname}${u.search}`;
}
const RELAY_TYPES = /javascript|ecmascript|css|json|wasm|font|woff|ttf|otf|opentype|image\/|svg|text\/plain|octet-stream/i;
async function browseRelay(parts, q, origin) {
  const [, , sig, host, ...path] = parts;
  const day = Math.floor(Date.now() / 86_400_000);
  if (!host || !(sig === (await relaySig(host, day)) || sig === (await relaySig(host, day - 1)))) throw new HttpError(403, "That relay link has expired.");
  const qs = new URLSearchParams(q).toString();
  const plain = host.startsWith("_http_"), realHost = plain ? host.slice(6) : host;
  const target = `${plain ? "http" : "https"}://${realHost}/${path.map(encodeURIComponent).join("/")}${qs ? "?" + qs : ""}`;
  const r = await guardedFetch(target, { maxBytes: 4_000_000, timeout: 20_000 });
  const type = r.type || "application/octet-stream";
  if (/text\/html/i.test(type) || !RELAY_TYPES.test(type)) throw new HttpError(415, "The relay only carries scripts, styles, fonts and images.");
  let body = r.buf;
  // stylesheets: fonts and nested stylesheets come through the relay too
  if (/css/i.test(type)) body = Buffer.from(await relayCss(decodeHtml(r.buf, type), r.url, origin));
  return { status: r.status >= 400 ? r.status : 200, type, body, cache: "public, max-age=3600, s-maxage=86400",
    headers: { "Access-Control-Allow-Origin": "*", "Cross-Origin-Resource-Policy": "cross-origin", "X-Content-Type-Options": "nosniff", ...(/svg/i.test(type) ? { "Content-Security-Policy": "sandbox; default-src 'none'" } : {}) } };
}
async function relayCss(css, base, origin) {
  const jobs = [];
  css.replace(/url\(\s*(["']?)([^"')]+)\1\s*\)|@import\s+["']([^"']+)["']/gi, (m, q, u1, u2) => { jobs.push(u1 || u2); return m; });
  const map = new Map();
  for (const u of new Set(jobs)) { if (/^(data|blob|#)/i.test(u)) continue; try { const abs = new URL(u, base).href; if (/^https:/.test(abs)) map.set(u, await relayUrl(origin, abs)); } catch {} }
  return css.replace(/url\(\s*(["']?)([^"')]+)\1\s*\)/gi, (m, q, u) => (map.has(u) ? `url("${map.get(u)}")` : m)).replace(/@import\s+["']([^"']+)["']/gi, (m, u) => (map.has(u) ? `@import "${map.get(u)}"` : m));
}

// Live mode's data requests: whatever the page asked for, exactly as the site sent it (reads only).
const PASS_RES = /^(content-language|content-disposition|etag|last-modified|link|location|cache-control|expires|retry-after|www-authenticate|content-range|accept-ranges|x-(?!frame|xss|content-type-options|powered|kb-)[\w-]{1,60})$/i;
async function browseRaw(raw, { method = "GET", body = null, contentType = "", cookie = "", ua = "", headers = null, referer = "" } = {}) {
  if (body && body.length > 1_800_000) throw new HttpError(413, "That request is too big for live mode."); // the page's own requests stay small
  const r = await guardedFetch(raw, { maxBytes: 4_000_000, timeout: 20_000, method, body, contentType, cookie, ua, headers, referer });
  const keep = {}; let size = 0;
  for (const [k, v] of r.headers) { if (!PASS_RES.test(k)) continue; const val = String(v).slice(0, 2000); if ((size += k.length + val.length) > 6000) break; keep[k] = val; }
  return { status: r.status >= 200 && r.status < 600 ? r.status : 502, type: r.type || "application/octet-stream", body: method === "HEAD" ? Buffer.alloc(0) : r.buf, cache: cookie || headers ? "private, no-store" : "private, max-age=60",
    headers: { ...(r.setCookies.length ? { "X-KB-Set-Cookie": Buffer.from(JSON.stringify(r.setCookies)).toString("base64") } : {}), "X-KB-Headers": Buffer.from(JSON.stringify(keep)).toString("base64") } };
}
async function browseFile(raw) {
  const r = await guardedFetch(raw, { maxBytes: 4_200_000, timeout: 25_000 });
  const name = decodeURIComponent(new URL(r.url).pathname.split("/").pop() || "file");
  return { status: 200, type: r.type || "application/octet-stream", body: r.buf, cache: "private, max-age=600", headers: { "Content-Disposition": `inline; filename="${name.replace(/[^\w.-]/g, "_")}"`, "X-Content-Type-Options": "nosniff", "Content-Security-Policy": "sandbox; default-src 'none'", "Referrer-Policy": "no-referrer" } };
}

// Previews for embeds and links: the provider's own oEmbed answer when it has one, else the page's
// oEmbed link or its Open Graph tags. Everything goes through the same guarded fetch as the browser.
const OEMBED = [
  [/^(www\.|m\.)?(youtube\.com|youtu\.be)$/, (u) => `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(u)}`],
  [/^(www\.|player\.)?vimeo\.com$/, (u) => `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(u)}`],
  [/^(www\.|m\.)?soundcloud\.com$/, (u) => `https://soundcloud.com/oembed?format=json&url=${encodeURIComponent(u)}`],
  [/^open\.spotify\.com$/, (u) => `https://open.spotify.com/oembed?url=${encodeURIComponent(u)}`],
  [/^(www\.|mobile\.)?(twitter\.com|x\.com)$/, (u) => `https://publish.twitter.com/oembed?omit_script=1&dnt=true&url=${encodeURIComponent(u)}`],
  [/^bsky\.app$/, (u) => `https://embed.bsky.app/oembed?url=${encodeURIComponent(u)}`],
  [/^(www\.)?tiktok\.com$/, (u) => `https://www.tiktok.com/oembed?url=${encodeURIComponent(u)}`],
  [/^(www\.)?flickr\.com$|^flic\.kr$/, (u) => `https://www.flickr.com/services/oembed/?format=json&url=${encodeURIComponent(u)}`],
  [/^(www\.)?reddit\.com$/, (u) => `https://www.reddit.com/oembed?url=${encodeURIComponent(u)}`],
];
const metaAttr = (html, keys) => {
  for (const k of keys) {
    const m = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${k}["'][^>]*content=["']([^"']+)["']`, "i")) || html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${k}["']`, "i"));
    if (m) return decodeEntities(m[1]).trim();
  }
  return "";
};
const plainText = (html) => decodeEntities(String(html || "").replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>/gi, "\n").replace(/<[^>]+>/g, "")).replace(/\n{3,}/g, "\n\n").trim();
// Titles where an accented letter was saved as its code ("Invasiu00f3n") get the letter back.
const unmangle = (t) => t.replace(/(?<=[A-Za-z])u00([c-f][0-9a-f])/gi, (_, h) => String.fromCharCode(parseInt(h, 16)));
function fromOembed(o, url) {
  const text = o.type === "rich" || /twitter|bluesky|mastodon|reddit/i.test(o.provider_name || "") ? plainText(o.html).replace(/\s*pic\.twitter\.com\/\S+/g, "").replace(/^Post by @\S+.*$/s, "").slice(0, 600) : "";
  const iframe = String(o.html || "").match(/<iframe[^>]+src=["']([^"']+)["']/i)?.[1] || "";
  const bsky = String(o.html || "").match(/data-bluesky-uri=["']at:\/\/([^/]+)\/app\.bsky\.feed\.post\/([^"']+)["']/i);
  return { url, via: "oembed", type: o.type || "link", provider: o.provider_name || "", title: unmangle(decodeEntities(o.title || "")), author: unmangle(decodeEntities(o.author_name || "")), authorUrl: o.author_url || "",
    thumb: o.thumbnail_url || (o.type === "photo" ? o.url : "") || "", width: Number(o.width) || 0, height: Number(o.height) || 0, text,
    embed: iframe ? decodeEntities(iframe) : bsky ? `https://embed.bsky.app/embed/${bsky[1]}/app.bsky.feed.post/${bsky[2]}` : "" };
}
async function browsePreview(raw) {
  const u = await safeUrl(raw), h = u.hostname.toLowerCase();
  const key = "pv:" + u.href, hit = memo.get(key);
  if (hit && hit.exp > Date.now()) return hit.val;
  let val = null;
  const known = OEMBED.find(([re]) => re.test(h));
  const tryOembed = async (endpoint) => { const r = await guardedFetch(endpoint, { accept: "application/json", maxBytes: 400_000, timeout: 10_000 }); if (r.status >= 400) return null; return fromOembed(JSON.parse(r.buf.toString("utf8")), u.href); };
  if (known) { try { val = await tryOembed(known[1](u.href)); } catch {} }
  // Wikipedia articles: the official summary, with the lead picture
  const wp = !val && h.match(/^([a-z-]+)\.(?:m\.)?wikipedia\.org$/) && u.pathname.match(/^\/wiki\/([^:]+)$/);
  if (wp) {
    try {
      const r = await guardedFetch(`https://${h.split(".")[0]}.wikipedia.org/api/rest_v1/page/summary/${wp[1]}`, { accept: "application/json", maxBytes: 200_000 });
      const d = JSON.parse(r.buf.toString("utf8"));
      if (d.title) val = { url: u.href, via: "wikipedia", type: "link", provider: "Wikipedia", title: d.title, author: d.description || "", text: (d.extract || "").slice(0, 400), thumb: d.thumbnail?.source || "", embed: "", width: 0, height: 0 };
    } catch {}
  }
  // Mastodon and other fediverse servers answer at /api/oembed on their own host
  if (!val && /^\/@[\w.]+\/\d+/.test(u.pathname)) { try { val = await tryOembed(`https://${u.host}/api/oembed?url=${encodeURIComponent(u.href)}`); } catch {} }
  if (!val) {
    const r = await guardedFetch(u.href, { accept: "text/html", maxBytes: 1_200_000, timeout: 12_000 });
    const html = decodeHtml(r.buf, r.type).slice(0, 600_000);
    const disc = html.match(/<link[^>]+type=["']application\/json\+oembed["'][^>]*>/i)?.[0]?.match(/href=["']([^"']+)["']/i)?.[1];
    if (disc) { try { val = await tryOembed(new URL(decodeEntities(disc), r.url).href); } catch {} }
    if (!val) {
      const img = metaAttr(html, ["og:image", "og:image:url", "twitter:image", "twitter:image:src"]);
      const video = metaAttr(html, ["og:video:secure_url", "og:video:url", "og:video", "twitter:player"]);
      val = { url: r.url, via: "meta", type: video ? "video" : "link", provider: metaAttr(html, ["og:site_name", "application-name"]) || new URL(r.url).hostname.replace(/^www\./, ""),
        title: metaAttr(html, ["og:title", "twitter:title"]) || decodeEntities((html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] || "").trim()),
        author: metaAttr(html, ["author", "article:author", "twitter:creator"]), text: metaAttr(html, ["og:description", "twitter:description", "description"]).slice(0, 400),
        thumb: img ? new URL(img, r.url).href : "", embed: /^https:/.test(video) && !/\.(mp4|webm|m3u8)(\?|$)/i.test(video) ? video : "", media: /\.(mp4|webm)(\?|$)/i.test(video) ? new URL(video, r.url).href : "", width: 0, height: 0 };
    }
  }
  memo.set(key, { exp: Date.now() + 6 * 3600_000, val });
  return val;
}

// ---------- open comics ----------
// xkcd (CC BY-NC 2.5): its JSON API doesn't allow browser requests, so Kitsune passes it along.
async function xkcdComic(n) {
  const url = n === "latest" ? "https://xkcd.com/info.0.json" : `https://xkcd.com/${Number(n)}/info.0.json`;
  if (n !== "latest" && !(Number(n) > 0)) throw new HttpError(400, "Give a comic number.");
  if (Number(n) === 404) return { num: 404, title: "404", safe_title: "Not Found", alt: "There is no comic 404. That's the joke.", img: "", year: "2008", month: "4", day: "1" };
  const d = await cachedFetch(url, { ttl: n === "latest" ? 20 * 60_000 : 7 * 86400_000 });
  return { num: d.num, title: decodeEntities(d.safe_title || d.title || ""), alt: decodeEntities(d.alt || ""), img: d.img, date: `${d.year}-${String(d.month).padStart(2, "0")}-${String(d.day).padStart(2, "0")}`, link: `https://xkcd.com/${d.num}/`, transcript: d.transcript || "" };
}
// Every comic's number, title and date, from xkcd's own archive page, for browsing and search.
async function xkcdArchive() {
  const html = await cachedFetch("https://xkcd.com/archive/", { as: "text", ttl: 6 * 3600_000 });
  const out = [];
  for (const m of html.matchAll(/<a href="\/(\d+)\/" title="(\d{4}-\d{1,2}-\d{1,2})">([^<]*)<\/a>/g)) out.push({ num: Number(m[1]), date: m[2], title: decodeEntities(m[3]) });
  return { count: out.length, comics: out };
}
// Pepper&Carrot by David Revoy (CC BY 4.0): every episode, in every language it's been translated into.
const PC = "https://www.peppercarrot.com/0_sources/";
async function pepperEpisodes() {
  const [eps, langs] = await Promise.all([cachedFetch(PC + "episodes.json", { ttl: 12 * 3600_000 }), cachedFetch(PC + "langs.json", { ttl: 24 * 3600_000 })]);
  return {
    langs: Object.entries(langs).map(([k, v]) => ({ code: k, name: v.name, local: v.local_name || v.name })).sort((a, b) => a.name.localeCompare(b.name)),
    episodes: eps.map((e, i) => {
      const n = String(i + 1).padStart(2, "0");
      return { n: i + 1, slug: e.name, title: e.name.replace(/^ep\d+_/, "").replace(/-/g, " "), pages: e.total_pages, langs: e.translated_languages || [],
        cover: `${PC}${e.name}/low-res/gfx-only/gfx_Pepper-and-Carrot_by-David-Revoy_E${n}.jpg` };
    }),
  };
}
// One episode's pages in a language. A few episodes end with a near-empty credits image, which is left out.
async function pepperEpisode(num, lang) {
  const { episodes } = await pepperEpisodes();
  const e = episodes.find((x) => x.n === Number(num));
  if (!e) throw new HttpError(404, "No such episode.");
  const lg = e.langs.includes(lang) ? lang : "en";
  const n = String(e.n).padStart(2, "0");
  const url = (p, res = "low-res") => `${PC}${e.slug}/${res}/${lg}_Pepper-and-Carrot_by-David-Revoy_E${n}P${String(p).padStart(2, "0")}.jpg`;
  const key = "pc:" + e.n + ":" + lg, hit = memo.get(key);
  if (hit && hit.exp > Date.now()) return hit.val;
  const checks = await Promise.all(Array.from({ length: e.pages }, (_, i) => i + 1).map(async (p) => {
    try { const r = await fetch(url(p), { method: "HEAD", headers: { "User-Agent": UA }, signal: AbortSignal.timeout(8000) }); const len = Number(r.headers.get("content-length") || 99999); return r.ok && len > 4000 ? p : null; }
    catch { return p; }
  }));
  const pages = checks.filter(Boolean);
  const val = { n: e.n, title: e.title, lang: lg, header: url(0), pages: pages.map((p) => url(p)), hires: pages.map((p) => url(p, "hi-res")), link: `https://www.peppercarrot.com/${lg}/webcomic/${e.slug}.html`,
    credit: "Pepper&Carrot by David Revoy, www.peppercarrot.com. Licensed CC BY 4.0." };
  memo.set(key, { exp: Date.now() + 24 * 3600_000, val });
  return val;
}

// MyAnimeList ids -> AniList series (for importing a MAL list export).
async function malToAnilist(idsParam) {
  const ids = [...new Set(String(idsParam || "").split(",").map(Number).filter((n) => Number.isInteger(n) && n > 0))].slice(0, 50);
  if (!ids.length) throw new HttpError(400, "Give up to 50 MyAnimeList ids, separated by commas.");
  const d = await anilist(`query($ids:[Int]){Page(perPage:50){media(idMal_in:$ids,type:MANGA){idMal ${FIELDS}}}}`, { ids }, 24 * 3600_000);
  return { results: d.Page.media.map((m) => ({ idMal: m.idMal, media: mangaNorm(m) })) };
}

// ---------- router ----------

const json = (body, cache = "no-store", status = 200) => ({ status, type: "application/json; charset=utf-8", body: JSON.stringify(body), cache });
const pub = (h) => `public, max-age=${Math.min(h * 3600, 3600)}, s-maxage=${h * 3600}, stale-while-revalidate=86400`;

// Series search on MyAnimeList (via Jikan), Kitsu and MangaUpdates, for linking a series on its page.
async function trackerSearch(kind, query) {
  const term = String(query || "").trim().slice(0, 120);
  if (!term) throw new HttpError(400, "Add a title to search for.");
  if (kind === "mal") {
    try {
      const d = await cachedFetch(`https://api.jikan.moe/v4/manga?limit=8&q=${encodeURIComponent(term)}`, { timeout: 5_000 });
      return { results: (d.data || []).map((m) => ({ id: m.mal_id, title: m.title_english || m.title, url: m.url, cover: m.images?.jpg?.image_url, score: m.score ? `${m.score} / 10` : "", vols: m.volumes || null, year: m.published?.prop?.from?.year || "" })) };
    } catch {
      // Jikan is often unreachable from cloud servers. AniList stores each title's MyAnimeList ID, so search there instead.
      const d = await anilist(`query ($q: String) { Page(perPage: 10) { media(search: $q, type: MANGA) { idMal title { romaji english } coverImage { medium } volumes startDate { year } } } }`, { q: term });
      return { results: d.Page.media.filter((m) => m.idMal).slice(0, 8).map((m) => ({ id: m.idMal, title: m.title.english || m.title.romaji, url: `https://myanimelist.net/manga/${m.idMal}`, cover: m.coverImage?.medium, score: "", vols: m.volumes || null, year: m.startDate?.year || "" })) };
    }
  }
  if (kind === "kitsu") {
    const d = await cachedFetch(`https://kitsu.io/api/edge/manga?page[limit]=8&filter[text]=${encodeURIComponent(term)}`, { timeout: 12_000, headers: { Accept: "application/vnd.api+json" } });
    return { results: (d.data || []).map((m) => ({ id: m.id, title: m.attributes.canonicalTitle, url: `https://kitsu.app/manga/${m.attributes.slug}`, cover: m.attributes.posterImage?.small, score: m.attributes.averageRating ? `${m.attributes.averageRating}%` : "", vols: m.attributes.volumeCount || null, year: (m.attributes.startDate || "").slice(0, 4) })) };
  }
  if (kind === "mu") {
    const d = await cachedFetch("https://api.mangaupdates.com/v1/series/search", { timeout: 12_000, body: JSON.stringify({ search: term, perpage: 8 }), headers: { "Content-Type": "application/json" } });
    return { results: (d.results || []).slice(0, 8).map(({ record: m }) => ({ id: m.series_id, title: m.title, url: m.url, cover: m.image?.url?.thumb || m.image?.url?.original, score: m.bayesian_rating ? `${m.bayesian_rating} / 10` : "", vols: null, year: m.year || "" })) };
  }
  throw new HttpError(404, "Unknown tracker.");
}

export function handleApi(method, parts, q, ctx = {}) { return REQ.run({ lang: ctx.lang || "" }, () => handleApiInner(method, parts, q, ctx)); }
async function handleApiInner(method, parts, q, { features = {}, body = null, contentType = "", origin = "", cookie = "", ua = "", kbMethod = "", kbHeaders = "", kbReferer = "" } = {}) {
  const kb = { method: String(kbMethod).toUpperCase(), headers: (() => { if (!kbHeaders) return null; try { return JSON.parse(Buffer.from(kbHeaders, "base64").toString("utf8")); } catch { return null; } })(), referer: /^https?:\/\//.test(kbReferer) ? kbReferer : "" };
  const is = (...p) => p.length === parts.length && p.every((x, i) => x === "*" || x === parts[i]);
  if (method === "GET" && parts[0] === "browse" && parts[1] === "x" && parts.length >= 4) return browseRelay(parts, q, origin);
  if (method === "POST" && is("browse", "raw")) return browseRaw(q.url, { method: /^(PUT|PATCH|DELETE)$/.test(kb.method) ? kb.method : "POST", body, contentType, cookie, ua, headers: kb.headers, referer: kb.referer });
  if (method === "POST" && is("browse", "live")) {
    const f = new URLSearchParams(body ? body.toString("utf8") : "");
    let user = { scripts: [], styles: [] };
    try { user = { scripts: JSON.parse(f.get("scripts") || "[]").slice(0, 40).map(String), styles: JSON.parse(f.get("styles") || "[]").slice(0, 40).map(String) }; } catch {}
    const method = f.get("method") === "POST" ? "POST" : "GET", pbody = method === "POST" ? Buffer.from(f.get("body") || "", "base64") : null;
    if (pbody && pbody.length > 1_048_576) throw new HttpError(413, "That form is too big to send.");
    return browseLive(f.get("url") || q.url, origin, (f.get("cookie") || "").slice(0, 8000), user, { ua: f.get("ua") || "", storage: (f.get("storage") || "").slice(0, 1_048_576), method, body: pbody, ctype: (f.get("ctype") || "").slice(0, 300) });
  }
  if (method !== "GET") throw new HttpError(405, "Only GET is supported here.");

  if (is("health")) return json({ ok: true, name: "Kitsune", version: 2, pdCutoff: PD_CUTOFF_YEAR, features });
  if (is("books")) return json(await booksSearch(q), pub(6));
  if (is("books", "*")) {
    const id = Number(parts[1]);
    try { return json(bookSummary(await cachedFetch(`https://gutendex.com/books/${id}`, { timeout: 12_000 })), pub(24)); }
    catch { return json(await gutenbergOpdsBook(id), pub(6)); }
  }
  if (is("books", "*", "text")) return { status: 200, type: "text/plain; charset=utf-8", body: await bookText(parts[1]), cache: pub(168) };
  if (is("scans")) return json(await scansSearch(q), pub(6));
  if (is("ia", "*")) return json(await iaItem(parts[1]), pub(24));
  if (is("ia", "*", "page", "*")) return iaPage(parts[1], parts[3], q.w);
  if (is("ia", "*", "text")) return iaText(parts[1]);
  if (is("books", "*", "epub")) return bookEpub(parts[1]);
  if (is("audio")) return json(await audioSearch(q), pub(24));
  if (is("audio", "*")) return json(await audioDetail(parts[1]), pub(24));
  if (is("manga")) return json(await mangaBrowse(q), pub(1));
  if (is("manga", "*")) return json(await mangaDetail(parts[1]), pub(6));
  if (is("anilist", "user", "*")) return json(await anilistUser(parts[2]));
  if (is("anilist", "mal")) return json(await malToAnilist(q.ids), pub(24));
  if (is("standard")) return json(await standardEbooks(q), pub(12));
  if (is("feed")) return feed(q.url, q.as === "json" ? "json" : "xml");
  if (is("loc")) return json(await locSearch(q), pub(12));
  if (is("loc", "*")) return json(await locItem(parts[1]), pub(24));
  if (is("museum")) return json(await museumSearch(q), pub(12));
  if (is("ndl")) return json(await ndlSearch(q), pub(12));
  if (is("ol", "scan")) return json(await openLibraryScan(q.ids), pub(24));
  if (is("trackers", "*")) return json(await trackerSearch(parts[1], q.q), pub(24));
  if (is("browse")) { const page = await browsePage(q.url, cookie, ua); return json(page, cookie || page.setCookies ? "private, no-store" : "private, max-age=120"); }
  if (is("browse", "css")) return browseCss(q.url);
  if (is("browse", "img")) return browseImg(q.url, q.ref || "");
  if (is("browse", "preview")) return json(await browsePreview(q.url), "private, max-age=3600");
  if (is("browse", "file")) return browseFile(q.url);
  if (is("browse", "raw")) return browseRaw(q.url, { method: kb.method === "HEAD" ? "HEAD" : "GET", cookie, ua, headers: kb.headers, referer: kb.referer });
  if (is("browse", "live")) return browseLive(q.url, origin);
  if (is("comics", "xkcd", "archive")) return json(await xkcdArchive(), pub(6));
  if (is("comics", "xkcd", "*")) return json(await xkcdComic(parts[2]), pub(parts[2] === "latest" ? 0.3 : 168));
  if (is("comics", "peppercarrot")) return json(await pepperEpisodes(), pub(12));
  if (is("comics", "peppercarrot", "*")) return json(await pepperEpisode(parts[2], String(q.lang || "en").slice(0, 5)), pub(24));
  throw new HttpError(404, "No such endpoint. See /api/health and the README for the list.");
}

export function errorResult(e) {
  return json({ error: e.message || "Something went wrong." }, "no-store", e.status || 500);
}
