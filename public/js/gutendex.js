// Project Gutenberg search. Gutendex blocks some cloud servers, so the browser
// asks it directly first and falls back to Kitsune's own /api/books.
import { api } from "./util.js";

function summary(b) {
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

async function direct(path) {
  const r = await fetch("https://gutendex.com/books/" + path, { signal: AbortSignal.timeout(9_000) });
  if (!r.ok) throw new Error(`gutendex.com answered ${r.status}`);
  return r.json();
}

// Gutendex can take 15–20 s on a fresh query, so remember results for 6 hours.
const TTL = 6 * 3600_000;
function cacheGet(key) {
  try { const v = JSON.parse(localStorage.getItem("kitsune.gx." + key) || "null"); return v && Date.now() - v.at < TTL ? v.d : null; } catch { return null; }
}
function cachePut(key, d) {
  try {
    localStorage.setItem("kitsune.gx." + key, JSON.stringify({ at: Date.now(), d }));
    const keys = Object.keys(localStorage).filter((k) => k.startsWith("kitsune.gx."));
    if (keys.length > 40) keys.slice(0, keys.length - 40).forEach((k) => localStorage.removeItem(k));
  } catch {}
}

export async function searchBooks(params) {
  const p = new URLSearchParams(params);
  if (!p.get("languages")) p.set("languages", "en");
  if (!p.get("sort")) p.set("sort", "popular");
  p.sort();
  const key = p.toString();
  const hit = cacheGet(key);
  if (hit) return hit;
  // Ask Gutendex directly and Kitsune's API (which falls back to gutenberg.org) at the same time.
  const d = await Promise.any([
    direct("?" + p).then((raw) => ({ count: raw.count || 0, hasNext: !!raw.next, results: (raw.results || []).map(summary) })),
    api("books?" + p),
  ]).catch(() => { throw new Error("Project Gutenberg's catalog isn't answering right now. Try again in a minute."); });
  cachePut(key, d);
  return d;
}

export async function getBook(id) {
  return Promise.any([direct(String(Number(id))).then(summary), api("books/" + Number(id))])
    .catch(() => { throw new Error("This book's details didn't load. Try again in a minute."); });
}
