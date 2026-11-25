// Builds the Originals fan wiki's data from the texts themselves: who speaks where, songs, places, quotes,
// chapters and word counts. Run: node tools/build-lore.mjs  →  public/originals/lore-data.json
import fs from "fs";
import path from "path";
import vm from "vm";

import { fileURLToPath } from "url";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PUB = path.join(ROOT, "public");

// ---------- the catalogue, read straight out of originals.js ----------
const src = fs.readFileSync(path.join(PUB, "js/originals.js"), "utf8");
const start = src.indexOf("export const ORIGINALS"), end = src.indexOf("export const CLASSICS");
const block = src.slice(start, end).replace(/export const /g, "const ").replace(/^export (async )?function[\s\S]*?^}/gm, "");
const { ORIGINALS, SERIES } = vm.runInNewContext(block + "\n;({ ORIGINALS, SERIES });", Object.create(null));

const works = [];
works.push(...ORIGINALS.map((o, i) => ({ id: o.id, series: "kitsune", order: i, title: o.title, label: o.type === "manga" ? "Illustrated manga" : "Story", kind: o.type === "manga" ? "manga" : "text", file: o.file || null, cover: o.cover, blurb: o.blurb, minutes: o.minutes })));
for (const s of SERIES) s.items.forEach((it, i) => works.push({ id: it.id, series: s.id, order: i, title: it.title, label: it.label || "", kind: it.kind, file: it.file, cover: it.cover, blurb: it.blurb || "" }));
const seriesInfo = [{ id: "kitsune", title: "Kitsune Originals", blurb: "Short illustrated stories and manga written for Kitsune: fox couriers, lantern-lit mountain towns, libraries under lakes, and four new tales of Oz.", rights: "Text released under Creative Commons Attribution 4.0." },
  ...SERIES.map((s) => ({ id: s.id, title: s.title, blurb: s.blurb, rights: s.rights, note: s.note || "", mature: !!s.mature }))];

// ---------- helpers ----------
const read = (f) => { try { return fs.readFileSync(path.join(PUB, f.replace(/^\//, "")), "utf8"); } catch { return ""; } };
const slug = (s) => s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-").replace(/-+/g, "-").slice(0, 60);
const titleCase = (s) => s.toLowerCase().replace(/(^|[\s\-(])([a-z])/g, (m, a, b) => a + b.toUpperCase()).replace(/\bOf\b/g, "of").replace(/\bThe\b(?!^)/g, (m, i) => (i ? "the" : m));
const NOT_NAMES = new Set(["INT", "EXT", "ACT", "TEASER", "TAG", "CUT TO", "CUT TO BLACK", "END", "THE END", "FADE IN", "FADE OUT", "TITLE", "CUT TO TITLE", "SMASH CUT", "MONTAGE", "LATER", "CONTINUOUS", "SUPER", "BEAT", "SILENCE", "INTERCUT", "BACK TO SCENE", "DISSOLVE TO", "MATCH CUT", "BLACKWOOD UNIVERSITY", "SEASON TWO", "SEASON ONE", "END OF EPISODE", "ON SCREEN", "OVER BLACK", "TITLE CARD", "FLASHBACK", "END FLASHBACK", "PRESENT DAY", "THE NEXT MORNING", "MOMENTS LATER", "SAME TIME", "NIGHT", "DAY", "MORNING", "EVENING", "APPROVED", "PENDING", "COLD OPEN", "INSERT", "VISUAL", "LEVEL", "SPLASH", "CRASH", "FLASH", "BACKROOMS", "FRONTROOMS", "SOUND", "THUD", "BANG", "BOOM", "CLICK", "DING", "SILENCE", "PAUSE", "LATER THAT NIGHT", "SCREEN", "TEXT", "CAPTION", "NOTE", "LYRICS"]);
const GROUP = /^(ALL|ENSEMBLE|STUDENTS?|CROWD|EVERYONE|BOTH|CHORUS|ALL THREE|ALL FOUR|GHOST CHORUS|GHOST ENSEMBLE|PAPERS|MINI-MADISONS|OBJECTS|ALL OBJECTS|PROTESTERS|FACULTY|BAND|CHOIR|VOICES?|KIDS|GIRLS|BOYS|SOLDIERS|GUARDS|FANS|AUDIENCE|ENSEMBLE OF .*)$/;
const cleanCue = (raw) => raw.replace(/\s*\((?:V\.O\.|O\.S\.|CONT'?D|CONT’D|O\.C\.|ON PHONE|ON SCREEN|SINGING|FILTERED|PRE-LAP|OVER RADIO|INTO RADIO|ON RADIO|THROUGH THE GARGOYLE)\)/gi, "").replace(/\s*\(.*$/, "").replace(/,\s*(SINGING|O\.S\.|V\.O\.|FROM .*|ON .*|INTO .*|THROUGH .*|OVER .*|WHISPERING|QUIETLY|MUFFLED|FADING|IN .*|AT .*|DISTANTLY|VERY .*|SOFTLY|SUNG|CONT.*|LOUDLY|ALOUD|STILL .*|NOW .*|HALF .*|WITH .*|UNDER .*|BEHIND .*|AS .*|TO .*|PRE CHORUS.*|CHORUS.*|VERSE.*|BRIDGE.*|OUTRO.*|INTRO.*|[A-Z ]{2,}VOICE.*)$/i, "").replace(/\s+(V\.O\.|O\.S\.)$/, "").replace(/[.:!?,;]+$/, "").trim();

function parseScript(text) {
  const lines = text.replace(/\r/g, "").split("\n");
  const speakers = new Map(), songs = [], places = new Map(), quotes = new Map(), order = [];
  let currentSong = null, curSpeaker = null, scenes = 0, acts = [];
  const sceneList = [], said = new Map(), pendingInline = []; let sc = null, act = "", ownCues = 0;
  const add = (name, line) => {
    if (!speakers.has(name)) { speakers.set(name, 0); order.push(name); }
    speakers.set(name, speakers.get(name) + 1);
    if (line) (said.get(name) || said.set(name, []).get(name)).push(line);
    if (sc && !GROUP.test(name)) { sc.who.add(name); sc.lines++; }
    if (line && line.length >= 22 && line.length <= 140 && !/^[“"(]/.test(line)) (quotes.get(name) || quotes.set(name, []).get(name)).push(line);
  };
  for (let i = 0; i < lines.length; i++) {
    const L = lines[i].trim();
    if (!L) { curSpeaker = null; continue; }
    const scene = L.match(/^(INT\.|EXT\.|INT\/EXT\.?|I\/E\.?)\s*(.+)$/);
    if (scene) {
      scenes++; currentSong = null;
      sc = { h: scene[2].trim().slice(0, 90), act, who: new Set(), lines: 0, first: "", songs: [] }; sceneList.push(sc);
      let place = scene[2].split(/\s[—–-]{1,2}\s|\s-\s/)[0].replace(/[.,]+$/, "").trim();
      place = place.replace(/^Blackwood University\s*[–—-]\s*/i, "").replace(/^(Blackwood University )?Quad$/i, "Blackwood Quad").replace(/^Blackwood University Quad$/i, "Blackwood Quad");
      if (place && place.length < 70) places.set(titleCase(place), (places.get(titleCase(place)) || 0) + 1);
      continue;
    }
    if (/^ACT [A-Z]+$|^TEASER$|^TAG$/.test(L)) { acts.push(L); act = L; currentSong = null; continue; }
    // a song title on its own line: “JUST FOLLOWING UP”
    const song = L.match(/^[“"]([A-Z0-9][A-Z0-9 ,.!?'’&\-:]{2,60})[”"]$/);
    if (song) { currentSong = { title: titleCase(song[1]), singers: new Set(), lines: 0 }; songs.push(currentSong); sc?.songs.push(currentSong.title); continue; }
    if (sc && !sc.first && L.length > 25 && L !== L.toUpperCase()) sc.first = L.slice(0, 200);
    // a character cue on its own line
    if (/^[A-Z][A-Z0-9 .'’&\-]{1,40}(\s*\(.*\))?(,\s*[A-Z ,.'’\-]+)?$/.test(L) && L === L.toUpperCase() && !/^(INT|EXT)\b/.test(L)) {
      const name = cleanCue(L);
      if (name && !NOT_NAMES.has(name) && !/^END OF|^EPISODE|^SPECIAL|^PART|^CHAPTER|^SCENE|^ACT\b|^\d/.test(name) && name.length <= 32 && name.split(" ").length <= 4) {
        curSpeaker = name;
        if (currentSong && !GROUP.test(name)) currentSong.singers.add(name);
        // the line itself is the next non-empty line
        let j = i + 1; while (j < lines.length && !lines[j].trim()) j++;
        const nxt = (lines[j] || "").trim();
        // a heading, an act, a song or another all-caps line is not this speaker's line
        if (!nxt || /^(ACT [A-Z]+$|TEASER$|TAG$|INT\.|EXT\.|[“"][A-Z])/.test(nxt) || (nxt === nxt.toUpperCase() && /[A-Z]/.test(nxt) && !/[.!?…”"]$/.test(nxt) && nxt.split(/\s+/).length <= 4)) { continue; }
        ownCues++;
        add(name, nxt);
        if (currentSong) currentSong.lines++;
        i = j; continue;
      }
    }
    // inline cues in wrapped scripts: "MADISON: Hello" or "LUX (Voice like honey) Darling..."
    const inline = [...L.matchAll(/(?:^|[.!?”"]\s+)([A-Z][A-Z .'’\-]{2,28}?)(?::|\s\([^)]{0,80}\))\s+([A-Z][^]{0,160}?)(?=\s+[A-Z][A-Z .'’\-]{2,28}(?::|\s\()|$)/g)];
    for (const m of inline) { const name = cleanCue(m[1]); if (name && !NOT_NAMES.has(name) && name.split(" ").length <= 4 && !/^(INT|EXT|CUT|ACT)\b/.test(name)) pendingInline.push([name, m[2].trim(), sc]); }
  }
  // wrapped scripts put names inline ("LUX: Darling…"); properly formatted ones only use that for on-screen text
  if (ownCues < 40) for (const [name, line, scene] of pendingInline) { const keep = sc; sc = scene; add(name, line); sc = keep; }
  return { speakers, songs, places, quotes, order, scenes, acts: acts.length, sceneList, said };
}

// prose: names are capitalized words that turn up mid-sentence often
const PROSE_STOP = new Set("I The A An And But Or Then When What Where Who Why How It Its He She They We You Your His Her Their Our My Mr Mrs Ms Miss Dr Sir Lady Lord King Queen Emerald City Oz Land Wizard Good Bad Old New Little Great North South East West Monday Tuesday Wednesday Thursday Friday Saturday Sunday January February March April May June July August September October November December Christmas God Yes No Oh Not Nobody Everybody Somebody Anybody Everyone Someone One Two Three Four Five Six Seven Eight Nine Ten First Last Chapter Part Book Act End This That These Those There Here If So For In On At By With From Into Of To As All Some Any Every Each Most More Less Very Just Only Even Still Also Too Well Now Soon Never Always Once Twice Again Before After While Because Although Though Since Until Unless Whether Kitsune Original Creative Commons Attribution Text".split(" "));
const NOT_PROSE = new Set(["Desert", "Level", "Life", "Powder", "Twenty", "Sound", "Visual", "Princess", "Mayor", "Doctor", "Mom", "Dad", "Sister", "Brother", "Death", "Horseman", "Nursery", "Corruption", "Chapter", "Part", "Book"]);
export const PLACE_RE = /(Country|Desert|Pine|Hollow|Road|Lane|Street|Mountains?|River|Lake|City|Town|Village|Forest|Woods|Kansas|Station|Bridge|Harbou?r|Market|Fold|Saltwick|Fennel|Illinois|Ohio|Phoenix|Columbus|Tokyo|Purgatory|Terra|Halcyon|Florence|Venice)$/;
function parseProse(text) {
  const names = new Map();
  for (const m of text.matchAll(/(?<=[a-z,;:]\s|[a-z][’']s\s|\bto\s|\bof\s|\band\s)([A-Z][a-z’']+(?:\s[A-Z][a-z’']+)?)/g)) {
    const n = m[1].replace(/[’']s$/, ""); const first = n.split(" ")[0];
    if (PROSE_STOP.has(first) || PROSE_STOP.has(n) || n.length < 3 || /^I['’]/.test(n) || NOT_PROSE.has(n)) continue;
    names.set(n, (names.get(n) || 0) + 1);
  }
  const chapters = [...text.matchAll(/^\s*(?:(?:\d+|[IVXLC]+)\.\s+(.+)|CHAPTER\s+([\w-]+)[.:]?\s*(.*))$/gm)].map((m) => (m[1] || [m[2], m[3]].filter(Boolean).join(": ")).trim()).filter((x) => x && x.length < 80);
  return { names: [...names].filter(([, c]) => c >= 4).sort((a, b) => b[1] - a[1]).slice(0, 30), chapters };
}

// ---------- run over every work ----------
const chars = new Map(); // key series::NAME
const coScene = new Map(), allSaid = new Map();
const allSongs = [], allPlaces = new Map();
for (const w of works) {
  const text = w.file ? read(w.file) : "";
  w.words = text ? text.split(/\s+/).filter(Boolean).length : 0;
  if (!w.minutes) w.minutes = Math.max(1, Math.round(w.words / 230));
  w.cast = []; w.songs = []; w.places = []; w.chapters = [];
  if (!text) continue;
  const isScript = w.kind === "script" || /^(INT\.|EXT\.)/m.test(text) && (text.match(/^(INT\.|EXT\.)/gm) || []).length > 3;
  if (isScript) {
    const r = parseScript(text);
    w.scenes = r.scenes; w.acts = r.acts;
    w.sceneList = r.sceneList.slice(0, 220).map((x) => ({ h: x.h, a: x.act, who: [...x.who].slice(0, 12), n: x.lines, f: x.first, s: x.songs }));
    for (const x of r.sceneList) { const who = [...x.who]; for (let i = 0; i < who.length; i++) for (let j = 0; j < who.length; j++) if (i !== j) { const k = w.series + "::" + who[i]; const m = coScene.get(k) || coScene.set(k, new Map()).get(k); m.set(who[j], (m.get(who[j]) || 0) + 1); } }
    for (const [n, ls] of r.said) { if (GROUP.test(n)) continue; const k = w.series + "::" + n; (allSaid.get(k) || allSaid.set(k, []).get(k)).push(...ls); }
    const longest = [...r.said].filter(([n]) => !GROUP.test(n)).flatMap(([n, ls]) => ls.map((t) => [n, t])).sort((a, b) => b[1].length - a[1].length)[0];
    w.trivia = { swears: (text.match(/\bfuck\w*/gi) || []).length, longest: longest ? { n: longest[0], t: longest[1].slice(0, 420) } : null, opening: (r.said.values().next().value || [])[0]?.slice(0, 200) || "" };
    w.cast = [...r.speakers].filter(([n, c]) => c >= 2 || !GROUP.test(n)).sort((a, b) => b[1] - a[1]).map(([n, c]) => ({ name: n, lines: c, group: GROUP.test(n) }));
    w.songs = r.songs.map((s) => ({ title: s.title, singers: [...s.singers].slice(0, 12) }));
    w.places = [...r.places].sort((a, b) => b[1] - a[1]).slice(0, 25).map(([p, c]) => ({ name: p, scenes: c }));
    for (const [n, c] of r.speakers) {
      if (GROUP.test(n) || c < 1) continue;
      const k = w.series + "::" + n;
      const ch = chars.get(k) || { series: w.series, name: n, slug: slug(n), lines: 0, works: [], quotes: [], songs: [] };
      ch.lines += c; ch.works.push({ id: w.id, lines: c });
      const q = (r.quotes.get(n) || []).filter((x) => !/^\(/.test(x));
      // a few lines from each work, preferring short, sharp ones
      ch.quotes.push(...q.sort((a, b) => a.length - b.length).slice(0, 4).map((t) => ({ t, w: w.id })));
      chars.set(k, ch);
    }
    for (const s of w.songs) { allSongs.push({ ...s, work: w.id, series: w.series }); for (const n of s.singers) chars.get(w.series + "::" + n)?.songs.push({ title: s.title, work: w.id }); }
    for (const p of w.places) { const k = w.series + "::" + p.name; const e = allPlaces.get(k) || { series: w.series, name: p.name, scenes: 0, works: [] }; e.scenes += p.scenes; e.works.push(w.id); allPlaces.set(k, e); }
  } else {
    const r = parseProse(text);
    w.chapters = r.chapters;
    const body = text.split(/\n{2,}/).map((p) => p.replace(/\s+/g, " ").trim()).filter((p) => p.length > 80 && !/Creative Commons|Kitsune Original|^[A-Z0-9 .:'’,-]+$/.test(p));
    w.trivia = { opening: (body[0] || "").split(/(?<=[.!?])\s+/).slice(0, 3).join(" ").slice(0, 420), dialogue: (text.match(/[“"][^”"]{2,}[”"]/g) || []).length };
    w.cast = r.names.map(([n, c]) => ({ name: n, lines: c, mentions: true }));
    w.cast = w.cast.filter((x) => !PLACE_RE.test(x.name));
    for (const [n, c] of r.names.filter(([n]) => PLACE_RE.test(n))) { const k = w.series + "::" + n; const e = allPlaces.get(k) || { series: w.series, name: n, scenes: 0, mentions: 0, works: [] }; e.mentions = (e.mentions || 0) + c; e.works.push(w.id); allPlaces.set(k, e); }
    for (const [n, c] of r.names.filter(([n]) => !PLACE_RE.test(n))) {
      const k = w.series + "::" + n.toUpperCase();
      const ch = chars.get(k) || { series: w.series, name: n.toUpperCase(), slug: slug(n), lines: 0, mentions: 0, works: [], quotes: [], songs: [] };
      ch.mentions = (ch.mentions || 0) + c; ch.works.push({ id: w.id, mentions: c });
      chars.set(k, ch);
    }
  }
}
// how common each word is across everyone, to find a character's signature words
const GLOBAL = new Map(); let GLOBAL_TOTAL = 0;
for (const ls of allSaid.values()) for (const l of ls) { GLOBAL_TOTAL++; for (const x of new Set(l.toLowerCase().replace(/[^a-z0-9'’ ]+/g, " ").split(/\s+/))) if (x.length >= 4) GLOBAL.set(x, (GLOBAL.get(x) || 0) + 1); }
const STOP = new Set("i you he she it we they me him her us them my your his its our their the a an and or but so if then than that this these those to of in on at by for with from as is are was were be been being am do does did done have has had having will would shall should can could may might must not no yes oh what who whom which when where why how all any some just very really too also only even still now here there up down out about into over again ever never get got go going gonna wanna want know like okay ok well right yeah fucking fuck shit".split(" "));
const slugOf = (n) => slug(n);
// co-stars: who shares the most works with whom
const charList = [...chars.values()].filter((c) => c.lines >= 3 || (c.mentions || 0) >= 6 || c.works.length >= 2);
for (const c of charList) {
  const mine = new Set(c.works.map((x) => x.id)), score = [];
  for (const o of charList) { if (o === c || o.series !== c.series) continue; const n = o.works.filter((x) => mine.has(x.id)).length; if (n) score.push([o.slug, n]); }
  c.related = score.sort((a, b) => b[1] - a[1]).slice(0, 10).map(([s]) => s);
  c.first = c.works[0]?.id; c.appearances = c.works.length;
  const co = coScene.get(c.series + "::" + c.name); if (co) c.coScenes = [...co].filter(([n]) => charList.some((o) => o.series === c.series && o.name === n)).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([n, k]) => [slugOf(n), k]);
  const lines = allSaid.get(c.series + "::" + c.name) || [];
  if (lines.length >= 8) {
    const grams = new Map(), words = new Map();
    for (const l of lines) {
      const t = l.toLowerCase().replace(/[“”"()…—–-]/g, " ").replace(/[^a-z0-9'’ ]+/g, " ").split(/\s+/).filter(Boolean);
      const seen = new Set();
      for (let n = 2; n <= 4; n++) for (let i = 0; i + n <= t.length; i++) { const g = t.slice(i, i + n); if (g.every((x) => STOP.has(x))) continue; const k = g.join(" "); if (!seen.has(k)) { seen.add(k); grams.set(k, (grams.get(k) || 0) + 1); } }
      for (const x of new Set(t)) if (x.length >= 4 && !STOP.has(x)) words.set(x, (words.get(x) || 0) + 1);
    }
    c.phrases = [...grams].filter(([g, k]) => k >= 3 && !/^(i|you|it|the|a|and|to|of|that)\b.*\b(the|a|to|of|and|is)$/.test(g)).sort((a, b) => b[1] * b[0].split(" ").length - a[1] * a[0].split(" ").length).reduce((kept, x) => { const w = x[0].split(" "), heads = [w.slice(0, 2).join(" "), w.slice(-2).join(" ")]; if (!kept.some((y) => y[0].includes(x[0]) || heads.some((h) => y[0].includes(h)))) kept.push(x); return kept; }, []).slice(0, 8);
    c.signature = [...words].map(([x, k]) => [x, k / ((GLOBAL.get(x) || 1) / GLOBAL_TOTAL * lines.length + 1)]).filter(([x]) => (words.get(x) || 0) >= 4).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([x]) => [x, words.get(x)]);
    c.swears = lines.reduce((n, l) => n + (l.match(/\bfuck\w*/gi) || []).length, 0);
  }
  // keep the quote list varied and short
  const seen = new Set(); c.quotes = c.quotes.filter((q) => !seen.has(q.t) && seen.add(q.t)).slice(0, 18);
}
const out = {
  built: new Date().toISOString(),
  series: seriesInfo.map((s) => ({ ...s, works: works.filter((w) => w.series === s.id).length, words: works.filter((w) => w.series === s.id).reduce((n, w) => n + w.words, 0) })),
  works,
  characters: charList.sort((a, b) => (b.lines + (b.mentions || 0)) - (a.lines + (a.mentions || 0))),
  songs: allSongs,
  places: [...allPlaces.values()].filter((p) => p.scenes >= 2 || p.works.length >= 2 || (p.mentions || 0) >= 4).sort((a, b) => b.scenes - a.scenes),
};
fs.writeFileSync(path.join(PUB, "originals/lore-data.json"), JSON.stringify(out));
console.log(`works ${works.length} · characters ${out.characters.length} · songs ${out.songs.length} · places ${out.places.length} · ${Math.round(JSON.stringify(out).length / 1024)} KB`);
