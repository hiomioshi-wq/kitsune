// Word definitions (Wiktionary, then Free Dictionary) and Wikipedia summaries.
// Both services allow requests straight from the browser.
// Added: 2-5 word selections render Wiktionary's "Idiom" section as a first "Is it an idiom?" line, and a single word naming one of the 118 chemical elements gets an element card (symbol + atomic number from a local table, linked out via Wikipedia's summary endpoint).

const strip = (s) => String(s || "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
const memo = new Map();

export function idiomSenses(entries) { return (entries || []).filter((e) => /idiom/i.test(e.partOfSpeech || "")).map((e) => ({ pos: "Is it an idiom?", defs: (e.definitions || []).map((x) => strip(x.definition)).filter(Boolean).slice(0, 3), language: e.language })).filter((e) => e.defs.length); }

export async function define(word, lang = "en") {
  word = word.trim().replace(/^[^\p{L}]+|[^\p{L}'-]+$/gu, "");
  if (!word) throw new Error("Select a single word to look it up.");
  const key = lang + ":" + word.toLowerCase();
  if (memo.has(key)) return memo.get(key);
  const words = word.split(/\s+/).length; let result = null;
  for (const w of [word, word.toLowerCase()]) {
    try {
      const r = await fetch(`https://en.wiktionary.org/api/rest_v1/page/definition/${encodeURIComponent(w)}`, { signal: AbortSignal.timeout(10_000) });
      if (!r.ok) continue;
      const d = await r.json();
      const entries = d[lang] || d.en || Object.values(d)[0] || [];
      const idiomatic = words >= 2 && words <= 5, idioms = idiomatic ? idiomSenses(entries) : [];
      const senses = (idiomatic ? entries.filter((e) => !/idiom/i.test(e.partOfSpeech || "")) : entries).map((e) => ({ pos: e.partOfSpeech, defs: (e.definitions || []).map((x) => strip(x.definition)).filter(Boolean).slice(0, 3), language: e.language })).filter((e) => e.defs.length);
      if (idioms.length || senses.length) { result = { word: w, senses: [...idioms, ...senses].slice(0, 4), source: `https://en.wiktionary.org/wiki/${encodeURIComponent(w)}`, via: "Wiktionary" }; break; }
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

const ELEMENTS = [["hydrogen","H",1],["helium","He",2],["lithium","Li",3],["beryllium","Be",4],["boron","B",5],["carbon","C",6],["nitrogen","N",7],["oxygen","O",8],["fluorine","F",9],["neon","Ne",10],["sodium","Na",11],["magnesium","Mg",12],["aluminium","Al",13],["silicon","Si",14],["phosphorus","P",15],["sulfur","S",16],["chlorine","Cl",17],["argon","Ar",18],["potassium","K",19],["calcium","Ca",20],["scandium","Sc",21],["titanium","Ti",22],["vanadium","V",23],["chromium","Cr",24],["manganese","Mn",25],["iron","Fe",26],["cobalt","Co",27],["nickel","Ni",28],["copper","Cu",29],["zinc","Zn",30],["gallium","Ga",31],["germanium","Ge",32],["arsenic","As",33],["selenium","Se",34],["bromine","Br",35],["krypton","Kr",36],["rubidium","Rb",37],["strontium","Sr",38],["yttrium","Y",39],["zirconium","Zr",40],["niobium","Nb",41],["molybdenum","Mo",42],["technetium","Tc",43],["ruthenium","Ru",44],["rhodium","Rh",45],["palladium","Pd",46],["silver","Ag",47],["cadmium","Cd",48],["indium","In",49],["tin","Sn",50],["antimony","Sb",51],["tellurium","Te",52],["iodine","I",53],["xenon","Xe",54],["caesium","Cs",55],["barium","Ba",56],["lanthanum","La",57],["cerium","Ce",58],["praseodymium","Pr",59],["neodymium","Nd",60],["promethium","Pm",61],["samarium","Sm",62],["europium","Eu",63],["gadolinium","Gd",64],["terbium","Tb",65],["dysprosium","Dy",66],["holmium","Ho",67],["erbium","Er",68],["thulium","Tm",69],["ytterbium","Yb",70],["lutetium","Lu",71],["hafnium","Hf",72],["tantalum","Ta",73],["tungsten","W",74],["rhenium","Re",75],["osmium","Os",76],["iridium","Ir",77],["platinum","Pt",78],["gold","Au",79],["mercury","Hg",80],["thallium","Tl",81],["lead","Pb",82],["bismuth","Bi",83],["polonium","Po",84],["astatine","At",85],["radon","Rn",86],["francium","Fr",87],["radium","Ra",88],["actinium","Ac",89],["thorium","Th",90],["protactinium","Pa",91],["uranium","U",92],["neptunium","Np",93],["plutonium","Pu",94],["americium","Am",95],["curium","Cm",96],["berkelium","Bk",97],["californium","Cf",98],["einsteinium","Es",99],["fermium","Fm",100],["mendelevium","Md",101],["nobelium","No",102],["lawrencium","Lr",103],["rutherfordium","Rf",104],["dubnium","Db",105],["seaborgium","Sg",106],["bohrium","Bh",107],["hassium","Hs",108],["meitnerium","Mt",109],["darmstadtium","Ds",110],["roentgenium","Rg",111],["copernicium","Cn",112],["nihonium","Nh",113],["flerovium","Fl",114],["moscovium","Mc",115],["livermorium","Lv",116],["tennessine","Ts",117],["oganesson","Og",118]];
export function elementInfo(w) { w = String(w || "").trim(); if (!w) return null; const e = ELEMENTS.find((x) => x[0] === w.toLowerCase()) || ELEMENTS.find((x) => x[1] === w); return e ? { name: e[0], symbol: e[1], number: e[2] } : null; }

export async function wikipedia(query, lang = "en") {
  const key = "wp:" + lang + ":" + query.toLowerCase();
  if (memo.has(key)) return memo.get(key);
  const host = `https://${lang}.wikipedia.org`;
  const el = /\s/.test(query) ? null : elementInfo(query);
  if (el) {
    const name = el.name[0].toUpperCase() + el.name.slice(1), card = { element: true, name: el.name, symbol: el.symbol, number: el.number, title: name, description: `Chemical element with symbol ${el.symbol} and atomic number ${el.number}`, extract: "", thumb: null, url: `https://en.wikipedia.org/wiki/${encodeURIComponent(name)}` };
    for (const h of lang === "en" ? [host] : [host, "https://en.wikipedia.org"]) {
      try {
        const r = await fetch(`${h}/api/rest_v1/page/summary/${encodeURIComponent(el.name)}`, { signal: AbortSignal.timeout(10_000) });
        if (!r.ok) continue;
        const d = await r.json();
        Object.assign(card, { title: d.title || card.title, description: d.description || card.description, extract: d.extract || "", thumb: d.thumbnail?.source, url: d.content_urls?.desktop?.page || `${h}/wiki/${encodeURIComponent(el.name)}` });
        break;
      } catch {}
    }
    memo.set(key, card);
    return card;
  }
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

// ---------- vocabulary with spaced repetition (FSRS) ----------
// Scheduling uses FSRS 4.5, the open-source algorithm behind modern Anki. Each word has a stability S (the number of days
// until your chance of remembering falls to 90%), a difficulty D (1 to 10), and a due date. Rating a card Again, Hard, Good
// or Easy updates S and D from how well you remembered it, so words you find easy return less and less often.
const W = [0.4872, 1.4003, 3.7145, 13.8206, 5.1618, 1.2298, 0.8975, 0.031, 1.6474, 0.1367, 1.0461, 2.1072, 0.0793, 0.3246, 1.587, 0.2272, 2.8755];
const DECAY = -0.5, FACTOR = 19 / 81, RETENTION = 0.9, MAX_DAYS = 36500;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
export const retrievability = (t, s) => Math.pow(1 + (FACTOR * t) / s, DECAY);
const intervalFor = (s) => clamp(Math.round((s / FACTOR) * (Math.pow(RETENTION, 1 / DECAY) - 1)), 1, MAX_DAYS);
const d0 = (g) => clamp(W[4] - W[5] * (g - 3), 1, 10);
const s0 = (g) => Math.max(0.1, W[g - 1]);
const nextD = (d, g) => clamp(W[7] * W[4] + (1 - W[7]) * (d - W[6] * (g - 3)), 1, 10);
const recallS = (d, s, r, g) => s * (1 + Math.exp(W[8]) * (11 - d) * Math.pow(s, -W[9]) * (Math.exp(W[10] * (1 - r)) - 1) * (g === 2 ? W[15] : 1) * (g === 4 ? W[16] : 1));
const forgetS = (d, s, r) => Math.max(0.1, Math.min(s, W[11] * Math.pow(d, -W[12]) * (Math.pow(s + 1, W[13]) - 1) * Math.exp(W[14] * (1 - r))));
const now = () => Math.floor(Date.now() / 1000);

// Words saved before FSRS used five boxes; carry them over with a matching stability.
function ensureCard(v) {
  if (v.fsrs) return v.fsrs;
  const BOX_DAYS = [0, 1, 3, 7, 16, 35];
  if ((v.box || 0) > 0) { const days = BOX_DAYS[v.box] || 1; v.fsrs = { s: days, d: 5, state: 2, reps: v.reviewed || 1, lapses: 0, last: (v.due || now()) - days * 86400 }; }
  else v.fsrs = { s: 0, d: 0, state: 0, reps: 0, lapses: 0, last: 0 };
  return v.fsrs;
}
// What each answer would do: { 1: seconds-until-due, … }, used to label the buttons.
export function previews(v) {
  const c = ensureCard({ ...v, fsrs: v.fsrs && { ...v.fsrs } }), out = {};
  for (const g of [1, 2, 3, 4]) out[g] = step(c, g, now()).dueIn;
  return out;
}
function step(c, g, t) {
  let s, d, state = 2, lapses = c.lapses || 0, dueIn;
  if (c.state === 0 || !c.s) { s = s0(g); d = d0(g); if (g === 1) { state = 1; dueIn = 600; } }
  else {
    const days = Math.max(0, (t - c.last) / 86400), r = retrievability(days, c.s);
    d = nextD(c.d, g);
    if (g === 1) { s = forgetS(c.d, c.s, r); state = 3; lapses++; dueIn = 600; } else s = recallS(c.d, c.s, r, g);
  }
  if (dueIn == null) {
    let days = intervalFor(s);
    if (g === 2 && c.state === 0) days = Math.max(1, Math.min(days, 1)); // a hard first answer comes back tomorrow
    dueIn = days * 86400;
  }
  return { s, d, state, lapses, dueIn };
}

export async function getVocab() { const { kvGet } = await import("./store.js"); return (await kvGet("vocab", [])).slice(); }
async function setVocab(list) { const { kvSet } = await import("./store.js"); kvSet("vocab", list); }
export async function saveWord({ word, def, pos, context, itemId, book }) {
  const list = await getVocab();
  const key = word.toLowerCase();
  if (list.some((v) => v.word.toLowerCase() === key)) return false;
  list.push({ id: Date.now().toString(36), word, def, pos, context: (context || "").slice(0, 300), itemId, book, created: now(), box: 0, due: 0, fsrs: { s: 0, d: 0, state: 0, reps: 0, lapses: 0, last: 0 } });
  await setVocab(list);
  return true;
}
export async function deleteWord(id) { await setVocab((await getVocab()).filter((v) => v.id !== id)); }
export const dueWords = (list) => list.filter((v) => (v.due || 0) <= now());
// Grade with 1 Again, 2 Hard, 3 Good, 4 Easy. A plain true or false still works (Good or Again).
export async function gradeWord(id, rating) {
  const g = rating === true ? 3 : rating === false ? 1 : rating;
  const list = await getVocab();
  const v = list.find((x) => x.id === id); if (!v) return;
  const c = ensureCard(v), t = now(), before = { ...c, due: v.due };
  const r = step(c, g, t);
  Object.assign(c, { s: r.s, d: r.d, state: r.state, lapses: r.lapses, reps: (c.reps || 0) + 1, last: t });
  v.due = t + r.dueIn; v.reviewed = (v.reviewed || 0) + 1;
  v.box = c.s >= 35 ? 5 : c.s >= 16 ? 4 : c.s >= 7 ? 3 : c.s >= 2 ? 2 : c.state === 0 ? 0 : 1;
  (v.log ||= []).push({ t, g }); if (v.log.length > 40) v.log.shift();
  await setVocab(list);
  return { before, after: { ...c, due: v.due } };
}
export async function undoGrade(id, before) {
  const list = await getVocab(); const v = list.find((x) => x.id === id); if (!v) return;
  const { due, ...card } = before; v.fsrs = card; v.due = due; v.reviewed = Math.max(0, (v.reviewed || 1) - 1); v.log?.pop();
  await setVocab(list);
}
// How a word is doing, in plain words.
export function stage(v) {
  const c = v.fsrs; if (!c) return ["New", "Learning", "Learning", "Familiar", "Known", "Mastered"][v.box || 0]; if (c.state === 0) return "New";
  if (c.state === 1 || c.state === 3) return "Learning";
  return c.s >= 90 ? "Mastered" : c.s >= 21 ? "Known" : c.s >= 7 ? "Familiar" : "Learning";
}
export function recallNow(v) { const c = v.fsrs; if (!c || !c.s || !c.last) return null; return retrievability(Math.max(0, (now() - c.last) / 86400), c.s); }
export const fmtDue = (secs) => (secs < 3600 ? Math.max(1, Math.round(secs / 60)) + "m" : secs < 86400 ? Math.round(secs / 3600) + "h" : secs < 86400 * 30 ? Math.round(secs / 86400) + "d" : secs < 86400 * 365 ? Math.round(secs / 86400 / 30) + "mo" : (secs / 86400 / 365).toFixed(1) + "y");
// Numbers for the stats panel: cards by stage, expected retention, and how many fall due each day.
export function vocabStats(list) {
  const stages = { New: 0, Learning: 0, Familiar: 0, Known: 0, Mastered: 0 }; let rs = 0, rn = 0;
  for (const v of list) { stages[stage(v)]++; const r = recallNow(v); if (r != null) { rs += r; rn++; } }
  const days = Array.from({ length: 14 }, () => 0), t = now(), start = new Date(); start.setHours(0, 0, 0, 0);
  const sod = Math.floor(start.getTime() / 1000);
  for (const v of list) { if (!v.fsrs || v.fsrs.state === 0) continue; const k = Math.floor(((v.due || t) - sod) / 86400); days[clamp(k, 0, 13)]++; }
  const reviews = list.reduce((a, v) => a + (v.log?.length || 0), 0), good = list.reduce((a, v) => a + (v.log || []).filter((x) => x.g > 1).length, 0);
  return { stages, retention: rn ? rs / rn : null, forecast: days, reviews, accuracy: reviews ? good / reviews : null };
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
