// Subscriptions, library cards and stores you use, plus optional API keys.
// Most services have no public API, so "linking" means Kitsune remembers you use them
// and builds search links straight into each one. Where an account can really be read
// (AniList, Open Library reading lists, your OPDS server) it's linked properly.
import { kvGet, kvSet } from "./store.js";

// kind: manga | books | audio · access: sub (subscription) | free | library | store
export const SERVICES = [
  { id: "viz", name: "VIZ Shonen Jump", kind: "manga", access: "sub", search: "https://www.viz.com/search?search={q}" },
  { id: "mangaplus", name: "MANGA Plus", kind: "manga", access: "free", search: "https://mangaplus.shueisha.co.jp/search_result?keyword={q}" },
  { id: "kmanga", name: "K MANGA", kind: "manga", access: "sub", search: "https://kmanga.kodansha.com/search?keyword={q}" },
  { id: "azuki", name: "Azuki", kind: "manga", access: "sub", search: "https://www.azuki.co/series?q={q}" },
  { id: "comikey", name: "Comikey", kind: "manga", access: "sub", search: "https://comikey.com/comics/?q={q}" },
  { id: "webtoon", name: "WEBTOON", kind: "manga", access: "free", search: "https://www.webtoons.com/en/search?keyword={q}" },
  { id: "tapas", name: "Tapas", kind: "manga", access: "free", search: "https://tapas.io/search?q={q}" },
  { id: "bookwalker", name: "BOOK☆WALKER", kind: "manga", access: "store", search: "https://global.bookwalker.jp/search/?word={q}" },
  { id: "kindle", name: "Kindle", kind: "books", access: "store", search: "https://www.amazon.com/s?k={q}&i=digital-text" },
  { id: "kindleunlimited", name: "Kindle Unlimited", kind: "books", access: "sub", search: "https://www.amazon.com/s?k={q}+kindle+unlimited&i=digital-text" },
  { id: "kobo", name: "Kobo", kind: "books", access: "store", search: "https://www.kobo.com/us/en/search?query={q}" },
  { id: "playbooks", name: "Google Play Books", kind: "books", access: "store", search: "https://play.google.com/store/search?q={q}&c=books" },
  { id: "everand", name: "Everand", kind: "books", access: "sub", search: "https://www.everand.com/search?query={q}" },
  { id: "libby", name: "Libby (your library)", kind: "books", access: "library", search: "https://libbyapp.com/search/{libby}/search/query-{q}/page-1", needs: "libby" },
  { id: "hoopla", name: "Hoopla (your library)", kind: "books", access: "library", search: "https://www.hoopladigital.com/search?q={q}" },
  { id: "audible", name: "Audible", kind: "audio", access: "sub", search: "https://www.audible.com/search?keywords={q}" },
  { id: "spotify", name: "Spotify audiobooks", kind: "audio", access: "sub", search: "https://open.spotify.com/search/{q}/audiobooks" },
];
export const ACCESS_LABEL = { sub: "Subscription", free: "Free app", library: "Library card", store: "Store" };

export async function getSubs() { return { services: [], libby: "", olUser: "", ...(await kvGet("subscriptions", {})) }; }
export async function setSubs(s) { kvSet("subscriptions", s); }
export async function getKeys() { return { google: "", europeana: "", dpla: "", ...(await kvGet("apiKeys", {})) }; }
export async function setKeys(k) { kvSet("apiKeys", k); }

export function serviceLink(svc, q, subs) {
  if (svc.needs === "libby" && !subs.libby) return null;
  return svc.search.replace("{q}", encodeURIComponent(q)).replace("{libby}", encodeURIComponent(subs.libby || ""));
}

// ---------- Google Books (works without a key, but the shared free quota runs out) ----------
export async function googleBooks(q, { free = false, start = 0, max = 20 } = {}) {
  const keys = await getKeys();
  const p = new URLSearchParams({ q, maxResults: String(max), startIndex: String(start), printType: "books" });
  if (free) p.set("filter", "free-ebooks");
  if (keys.google) p.set("key", keys.google);
  let r;
  try { r = await fetch("https://www.googleapis.com/books/v1/volumes?" + p, { signal: AbortSignal.timeout(15_000) }); }
  catch { throw new Error("Google Books didn't answer."); }
  const d = await r.json().catch(() => ({}));
  if (r.status === 429 || d.error?.code === 429) throw Object.assign(new Error(keys.google ? "Your Google Books key has used today's quota." : "Google Books' shared free quota is used up for now. Add your own free API key in Accounts & keys to keep searching."), { quota: true });
  if (d.error) throw new Error(d.error.message || "Google Books returned an error.");
  return {
    total: d.totalItems || 0,
    results: (d.items || []).map((v) => {
      const i = v.volumeInfo || {}, a = v.accessInfo || {}, s = v.saleInfo || {};
      return {
        id: v.id, title: i.title + (i.subtitle ? `: ${i.subtitle}` : ""), authors: i.authors || [], year: (i.publishedDate || "").slice(0, 4),
        cover: (i.imageLinks?.thumbnail || i.imageLinks?.smallThumbnail || "").replace(/^http:/, "https:").replace("&edge=curl", "") || null,
        description: (i.description || "").replace(/<[^>]+>/g, ""), pages: i.pageCount, lang: i.language, isbn: (i.industryIdentifiers || []).find((x) => /ISBN/.test(x.type))?.identifier,
        view: a.viewability, publicDomain: !!a.publicDomain, readLink: a.webReaderLink || i.previewLink, preview: i.previewLink,
        epub: a.epub?.downloadLink || null, pdf: a.pdf?.downloadLink || null, saleability: s.saleability, price: s.retailPrice ? `${s.retailPrice.amount} ${s.retailPrice.currencyCode}` : null, buy: s.buyLink || null,
      };
    }),
  };
}

// ---------- Europeana (public demo key built in; your own key raises limits) ----------
export async function europeana(q, { start = 1, type = "TEXT" } = {}) {
  const keys = await getKeys();
  const p = new URLSearchParams({ wskey: keys.europeana || "api2demo", query: q, rows: "24", start: String(start), reusability: "open", media: "true", profile: "minimal" });
  if (type) p.append("qf", `TYPE:${type}`);
  const r = await fetch("https://api.europeana.eu/record/v2/search.json?" + p, { signal: AbortSignal.timeout(15_000) });
  const d = await r.json();
  if (!d.success) throw new Error(d.error || "Europeana returned an error.");
  return {
    total: d.totalResults || 0,
    results: (d.items || []).map((x) => ({ id: x.id, title: (x.title || [])[0] || "Untitled", creator: (x.dcCreator || [])[0] || "", year: (x.year || [])[0] || "", cover: (x.edmPreview || [])[0] || null,
      provider: (x.dataProvider || [])[0] || "", rights: (x.rights || [])[0] || "", manifest: `https://iiif.europeana.eu/presentation${x.id}/manifest`, link: x.guid })),
  };
}

// ---------- DPLA (needs your own free key) ----------
export async function dpla(q) {
  const keys = await getKeys();
  if (!keys.dpla) return null;
  const p = new URLSearchParams({ q, api_key: keys.dpla, page_size: "12", "sourceResource.type": "text" });
  const r = await fetch("https://api.dp.la/v2/items?" + p, { signal: AbortSignal.timeout(15_000) });
  const d = await r.json();
  if (d.error) throw new Error(d.message || "DPLA returned an error.");
  return (d.docs || []).map((x) => ({ title: [].concat(x.sourceResource?.title || "Untitled")[0], creator: [].concat(x.sourceResource?.creator || "")[0], link: x.isShownAt, cover: x.object || null, provider: x.provider?.name || "", rights: [].concat(x.rights || "")[0] }));
}

// ---------- Open Library public reading lists ----------
export async function openLibraryShelves(user) {
  const shelves = { "want-to-read": "Want to read", "currently-reading": "Reading", "already-read": "Read" };
  const out = {};
  for (const [k, label] of Object.entries(shelves)) {
    const r = await fetch(`https://openlibrary.org/people/${encodeURIComponent(user)}/books/${k}.json?limit=100`, { signal: AbortSignal.timeout(20_000) });
    if (r.status === 404) throw new Error("Open Library has no public reading log for that username.");
    const d = await r.json();
    out[label] = (d.reading_log_entries || []).map((e) => ({ title: e.work?.title, author: (e.work?.author_names || [])[0] || "", year: e.work?.first_publish_year, cover: e.work?.cover_id ? `https://covers.openlibrary.org/b/id/${e.work.cover_id}-M.jpg` : null, key: e.work?.key }));
  }
  return out;
}
