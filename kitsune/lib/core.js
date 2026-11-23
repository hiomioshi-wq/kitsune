// Kitsune API core. Shared by the local server (server.js) and the Vercel function (api/router.js).
// Every route returns { status, type, body, cache } so each host can send it its own way.

const UA = "Kitsune/2.0 (manga and public-domain reader)";
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
    let r;
    try { r = await fetch(u, { headers: { "User-Agent": UA, Accept: "application/json" }, redirect: "follow", signal: AbortSignal.timeout(15_000) }); }
    catch { throw new HttpError(502, `Couldn't reach ${u.hostname}.`); }
    if (isPrivateHost(new URL(r.url).hostname)) throw new HttpError(400, "That link redirects somewhere Kitsune won't follow.");
    if (!r.ok) throw new HttpError(502, `${u.hostname} answered ${r.status}.`);
    const body = (await r.text()).slice(0, 2_000_000);
    try { JSON.parse(body); } catch { throw new HttpError(415, "That link didn't return JSON."); }
    return { status: 200, type: "application/json; charset=utf-8", body, cache: "public, max-age=300, s-maxage=600" };
  }
  let res;
  try { res = await fetch(u, { headers: { "User-Agent": UA, Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml" }, redirect: "follow", signal: AbortSignal.timeout(15_000) }); }
  catch { throw new HttpError(502, `Couldn't reach ${u.hostname}.`); }
  if (!res.ok) throw new HttpError(502, `${u.hostname} answered ${res.status}.`);
  if (isPrivateHost(new URL(res.url).hostname)) throw new HttpError(400, "That feed redirects somewhere Kitsune won't follow.");
  const len = Number(res.headers.get("content-length") || 0);
  if (len > 1_500_000) throw new HttpError(413, "That feed is too large.");
  const text = (await res.text()).slice(0, 1_500_000);
  const type = res.headers.get("content-type") || "";
  if (!/xml|rss|atom/i.test(type) && !/^\s*(<\?xml|<rss|<feed)/i.test(text)) throw new HttpError(415, "That link isn't an RSS or Atom feed.");
  return { status: 200, type: "application/xml; charset=utf-8", body: text, cache: "public, max-age=600, s-maxage=900" };
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

export async function handleApi(method, parts, q, { features = {} } = {}) {
  const is = (...p) => p.length === parts.length && p.every((x, i) => x === "*" || x === parts[i]);
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
  throw new HttpError(404, "No such endpoint. See /api/health and the README for the list.");
}

export function errorResult(e) {
  return json({ error: e.message || "Something went wrong." }, "no-store", e.status || 500);
}
