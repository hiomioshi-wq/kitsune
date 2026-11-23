// Word definitions (Wiktionary, then Free Dictionary) and Wikipedia summaries.
// Both services allow requests straight from the browser.

const strip = (s) => String(s || "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
const memo = new Map();

export async function define(word, lang = "en") {
  word = word.trim().replace(/^[^\p{L}]+|[^\p{L}'-]+$/gu, "");
  if (!word) throw new Error("Select a single word to look it up.");
  const key = lang + ":" + word.toLowerCase();
  if (memo.has(key)) return memo.get(key);
  let result = null;
  for (const w of [word, word.toLowerCase()]) {
    try {
      const r = await fetch(`https://en.wiktionary.org/api/rest_v1/page/definition/${encodeURIComponent(w)}`, { signal: AbortSignal.timeout(10_000) });
      if (!r.ok) continue;
      const d = await r.json();
      const entries = d[lang] || d.en || Object.values(d)[0] || [];
      const senses = entries.map((e) => ({ pos: e.partOfSpeech, defs: (e.definitions || []).map((x) => strip(x.definition)).filter(Boolean).slice(0, 3), language: e.language })).filter((e) => e.defs.length);
      if (senses.length) { result = { word: w, senses: senses.slice(0, 4), source: `https://en.wiktionary.org/wiki/${encodeURIComponent(w)}`, via: "Wiktionary" }; break; }
    } catch {}
  }
  if (!result && lang === "en") {
    try {
      const r = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word.toLowerCase())}`, { signal: AbortSignal.timeout(10_000) });
      if (r.ok) {
        const d = await r.json();
        const senses = d.flatMap((e) => e.meanings.map((m) => ({ pos: m.partOfSpeech, defs: m.definitions.map((x) => x.definition).slice(0, 3) }))).slice(0, 4);
        if (senses.length) result = { word: d[0].word, phonetic: d[0].phonetic, senses, source: d[0].sourceUrls?.[0], via: "Free Dictionary" };
      }
    } catch {}
  }
  if (!result) throw new Error(`No definition found for “${word}”. Old spellings and names often aren't in dictionaries.`);
  memo.set(key, result);
  return result;
}

export async function wikipedia(query, lang = "en") {
  const key = "wp:" + lang + ":" + query.toLowerCase();
  if (memo.has(key)) return memo.get(key);
  const host = `https://${lang}.wikipedia.org`;
  const s = await fetch(`${host}/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srlimit=1&format=json&origin=*`, { signal: AbortSignal.timeout(10_000) }).then((r) => r.json()).catch(() => null);
  const title = s?.query?.search?.[0]?.title;
  if (!title) throw new Error(`Wikipedia has no article for “${query}”.`);
  const d = await fetch(`${host}/api/rest_v1/page/summary/${encodeURIComponent(title)}`, { signal: AbortSignal.timeout(10_000) }).then((r) => r.json());
  const result = { title: d.title, description: d.description, extract: d.extract, thumb: d.thumbnail?.source, url: d.content_urls?.desktop?.page || `${host}/wiki/${encodeURIComponent(title)}` };
  memo.set(key, result);
  return result;
}

// ---------- translation (MyMemory, free, up to 500 characters) ----------
export const LANGUAGES = { en: "English", es: "Spanish", fr: "French", de: "German", it: "Italian", pt: "Portuguese", ja: "Japanese", zh: "Chinese", ko: "Korean", ru: "Russian", ar: "Arabic", hi: "Hindi", nl: "Dutch", sv: "Swedish", pl: "Polish", tr: "Turkish", la: "Latin", el: "Greek" };
export async function translate(text, from = "en", to = "es") {
  text = text.trim().slice(0, 480);
  if (!text) throw new Error("Select some text to translate.");
  if (from === to) throw new Error("Pick a different language to translate into.");
  const key = `tr:${from}:${to}:${text}`;
  if (memo.has(key)) return memo.get(key);
  let r;
  try { r = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`, { signal: AbortSignal.timeout(12_000) }); }
  catch { throw new Error("The translation service didn't answer. Try again in a moment."); }
  const d = await r.json().catch(() => ({}));
  if (d.quotaFinished) throw new Error("Today's free translation allowance is used up. It resets tomorrow.");
  const out = d.responseData?.translatedText;
  if (!out || d.responseStatus !== 200) throw new Error(d.responseDetails || "That couldn't be translated.");
  const res = { text: out.replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&"), via: "MyMemory" };
  memo.set(key, res);
  return res;
}

// ---------- vocabulary with spaced repetition (Leitner boxes) ----------
const INTERVAL_DAYS = [0, 1, 3, 7, 16, 35];
export async function getVocab() { const { kvGet } = await import("./store.js"); return (await kvGet("vocab", [])).slice(); }
async function setVocab(list) { const { kvSet } = await import("./store.js"); kvSet("vocab", list); }
export async function saveWord({ word, def, pos, context, itemId, book }) {
  const list = await getVocab();
  const key = word.toLowerCase();
  if (list.some((v) => v.word.toLowerCase() === key)) return false;
  list.push({ id: Date.now().toString(36), word, def, pos, context: (context || "").slice(0, 300), itemId, book, created: Math.floor(Date.now() / 1000), box: 0, due: 0 });
  await setVocab(list);
  return true;
}
export async function deleteWord(id) { await setVocab((await getVocab()).filter((v) => v.id !== id)); }
export const dueWords = (list) => list.filter((v) => (v.due || 0) <= Date.now() / 1000);
export async function gradeWord(id, knewIt) {
  const list = await getVocab();
  const v = list.find((x) => x.id === id); if (!v) return;
  v.box = knewIt ? Math.min(INTERVAL_DAYS.length - 1, (v.box || 0) + 1) : 0;
  v.due = Math.floor(Date.now() / 1000) + INTERVAL_DAYS[v.box] * 86400;
  v.reviewed = (v.reviewed || 0) + 1;
  await setVocab(list);
}

// ---------- quote cards ----------
// Draws a highlight as a square image you can save and share.
export async function quoteCard({ text, title, author }, theme = "night") {
  const T = { night: ["#171a2e", "#ecebf6", "#f2a03f", "#9a9dbd"], paper: ["#f7f4ec", "#2a2730", "#c9661a", "#7a7480"], sepia: ["#f1e5cc", "#4a3a26", "#9c4a14", "#85704f"], matcha: ["#e8eedf", "#26301f", "#4f7a28", "#66735a"] }[theme] || ["#171a2e", "#ecebf6", "#f2a03f", "#9a9dbd"];
  const [bg, ink, accent, muted] = T;
  await document.fonts?.load?.('600 40px "Literata"').catch(() => {});
  const S = 1080, P = 110, c = document.createElement("canvas");
  c.width = S; c.height = S;
  const g = c.getContext("2d");
  g.fillStyle = bg; g.fillRect(0, 0, S, S);
  g.fillStyle = accent; g.fillRect(P, P, 90, 8);
  g.font = '700 120px "Literata", Georgia, serif'; g.fillStyle = accent; g.fillText("“", P - 8, P + 130);
  // Fit the quote: shrink the type until it fits the box.
  const words = text.replace(/\s+/g, " ").trim().split(" ");
  let size = 64, lines = [];
  const wrap = () => {
    g.font = `500 ${size}px "Literata", Georgia, serif`;
    lines = []; let line = "";
    for (const w of words) { const t = line ? line + " " + w : w; if (g.measureText(t).width > S - P * 2 && line) { lines.push(line); line = w; } else line = t; }
    if (line) lines.push(line);
  };
  for (wrap(); lines.length * size * 1.35 > S - 470 && size > 26; size -= 2) wrap();
  g.fillStyle = ink; g.textBaseline = "top";
  lines.forEach((l, i) => g.fillText(l, P, P + 170 + i * size * 1.35));
  g.font = '700 30px "Zen Kaku Gothic New", system-ui, sans-serif'; g.fillStyle = ink;
  g.fillText(title.length > 48 ? title.slice(0, 46) + "…" : title, P, S - P - 74);
  g.font = '400 26px "Zen Kaku Gothic New", system-ui, sans-serif'; g.fillStyle = muted;
  g.fillText(author || "", P, S - P - 32);
  // Small fox mark
  g.save(); g.translate(S - P - 30, S - P - 40); g.scale(0.32, 0.32);
  g.beginPath(); [[-90, -40], [-60, -150], [-10, -70], [10, -70], [60, -150], [90, -40], [60, 50], [0, 90], [-60, 50]].forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath();
  g.fillStyle = accent; g.fill(); g.restore();
  g.font = '500 20px "IBM Plex Mono", monospace'; g.fillStyle = muted; g.textAlign = "right"; g.fillText("KITSUNE", S - P - 70, S - P - 50);
  return new Promise((res) => c.toBlob(res, "image/png"));
}
export function saveBlob(blob, name) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = name;
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 20_000);
}

// Author biography: Gutenberg names look like "Shelley, Mary Wollstonecraft".
export async function authorBio(name, years) {
  const [last, first] = String(name).split(", ");
  const full = first ? `${first.replace(/\s*\(.*?\)/g, "")} ${last}` : name;
  const born = years?.[0];
  const bio = await wikipedia(`${full}${born ? " " + born : ""} writer`);
  // Make sure we found a person, not a book with the same words.
  if (!/\d{3,4}/.test(bio.description || "") && !bio.extract.toLowerCase().includes(last.toLowerCase())) throw new Error("No biography found.");
  return bio;
}
