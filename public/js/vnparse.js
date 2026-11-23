// Turns any Kitsune story (prose or screenplay) into a visual novel: chapters, scenes, who is speaking,
// how they feel and where they are. No browser APIs here, so every story can be checked automatically.
const MAX = 235;
export function chunks(text, max = MAX) {
  const t = text.replace(/\s+/g, " ").trim(); if (!t) return []; if (t.length <= max) return [t];
  const parts = t.match(/[^.!?…]+(?:[.!?…]+["”’)\]]*\s*|$)/g) || [t], out = []; let cur = "";
  const push = (s) => { if (s.trim()) out.push(s.trim()); };
  for (let p of parts) {
    while (p.length > max) { let cut = p.lastIndexOf(", ", max); if (cut < max * .45) cut = p.lastIndexOf(" ", max); if (cut < 1) cut = max; if (cur) { push(cur); cur = ""; } push(p.slice(0, cut + 1)); p = p.slice(cut + 1); }
    if ((cur + p).length > max) { push(cur); cur = p; } else cur += p;
  }
  push(cur); return out;
}

const PLACES = [
  ["void", /\bbackrooms?\b|level \d|liminal|fluorescent|yellow (?:hall|room|wall|carpet)|endless (?:hall|corridor)|\bthe void\b|nothingness|heat death|afterlife|limbo/i],
  ["lighthouse", /lighthouse|beacon\b/i], ["train", /\btrain\b|carriage|railway|sleeper car|platform\b|subway|\bmetro\b/i],
  ["sea", /\bsea\b|\bocean\b|\bbeach\b|\bshore\b|\bharbou?r\b|jetty|\bdock|\bferry\b|\bboat\b|\bship\b|\bstrait\b|\blake\b|\bcoast\b|\bpier\b/i],
  ["market", /night market|\bmarket\b|\bstall\b|\bbazaar\b|festival|carnival|fairground/i], ["library", /\blibrary\b|bookshop|bookstore|archives?\b|bindery|\bshelves\b/i],
  ["classroom", /classroom|\bclass\b|lecture|\bschool\b|university|campus|\bdorm|quad\b|academy|auditorium/i], ["hospital", /hospital|\bward\b|infirmary|morgue|clinic|\bmedical\b|operating (?:room|theat)/i],
  ["cafe", /tea shop|\bcaf[eé]\b|diner|\bbar\b|\bpub\b|restaurant|kitchen|bakery|dining|cafeteria|\bcounter\b/i], ["office", /\boffice\b|post office|boardroom|headquarters|\blab\b|laborator|server room|control room|bureau|mortality services/i],
  ["castle", /castle|palace|throne|emerald city|cathedral|\bchurch\b|\bchapel\b|temple|shrine|\bhell\b|tower\b|\bgate\b/i], ["street", /\bstreet\b|\broad\b|alley|\bcity\b|\btown\b|sidewalk|parking|\bcar\b|highway|rooftop|\bpark\b|stadium|\bfield\b/i],
  ["forest", /forest|\bwoods?\b|\btrees?\b|garden|marsh|swamp|meadow|orchard|jungle|poppy|\bfarm\b/i], ["mountain", /mountain|\bpass\b|\bcliff|\bpeak\b|summit|\bhill\b|valley|tunnel|\bcave\b|desert/i],
  ["room", /\bbedroom\b|apartment|penthouse|living room|\bhouse\b|cottage|attic|basement|\broom\b|hallway|corridor|stairwell|\bstairs\b|\bcottage\b|\bhome\b/i],
];
export function placeOf(text, prev = "room") { for (const [k, re] of PLACES) if (re.test(text)) return k; return prev; }
const timeOf = (s, prev = "day") => /\bnight|midnight|\b2 ?a\.?m|\bdark\b|moon|stars?\b/i.test(s) ? "night" : /dusk|sunset|evening|twilight/i.test(s) ? "dusk" : /dawn|sunrise|first light/i.test(s) ? "dawn" : /\bday\b|morning|noon|afternoon|sunlight/i.test(s) ? "day" : prev;
const weatherOf = (s, prev = "") => /\bsnow|blizzard|frost|\bice\b/i.test(s) ? "snow" : /\brain|storm|downpour|drizzle/i.test(s) ? "rain" : /\binferno|in flames|engulfed|ablaze|bonfire|burning (?:building|house|city)/i.test(s) ? "embers" : /\bclear\b|sunny/i.test(s) ? "" : prev;
export function moodOf(t, note = "") {
  const s = `${note} ${t}`;
  if (/furious|angr|snarl|yell|shout|screams?\b|rage|through (?:his|her|their) teeth/i.test(note) || /[A-Z]{4,}!|!!/.test(t)) return "angry";
  if (/sob|cry|tear|whisper(?:s|ed)? brok|grief|quiet(?:ly)? devastat|sad|sorry|forgive|miss you|goodbye/i.test(s)) return "sad";
  if (/shock|stun|horror|terrif|gasp|what\?!|wait, what|oh no|oh god|\?!/i.test(s)) return "shock";
  if (/laugh|grin|smil|delight|cheer|haha|wonderful|thank you|beam/i.test(s) || (/!$/.test(t) && t.length < 60)) return "happy";
  if (/smirk|smug|wry|sly|teas|coy|knowing/i.test(note)) return "smug";
  if (/shy|embarrass|blush|fluster|mumbl|sheepish|awkward|nervous/i.test(note)) return "shy";
  if (/flat|deadpan|dry|sigh|unimpress|bored|tired/i.test(note)) return "flat";
  return "calm";
}

const HAIR = /(platinum|blonde?|black|raven|red|ginger|auburn|silver|white|grey|gray|brown|brunette|pink|blue|green|purple|violet|teal)[- ](?:\w+[- ]){0,2}?hair|hair (?:the colou?r of |of )?(platinum|blonde?|black|red|silver|white|grey|brown|pink|blue|green|purple)/i;
const NOT_CUE = /^(INT|EXT|FADE|CUT|SMASH|DISSOLVE|TEASER|TAG|ACT|END|THE END|COLD OPEN|TITLE|TITLES|CREDITS|SUPER|MONTAGE|FLASHBACK|BACK TO|LATER|CONTINUOUS|BLACK|WHITE|SILENCE|BEAT|PREMISE|LOGLINE|NOTE|EPISODE|CHAPTER|PART|PROLOGUE|EPILOGUE|INTERCUT|ON|CLOSE|WIDE|ANGLE|POV|MATCH|CHYRON|CARD|SONG|CHORUS|VERSE|BRIDGE|OUTRO|INTRO|MUSIC|SFX|TO BE CONTINUED|MID|POST|STINGER|SCENE|NEXT|WE|A|AN|THE|AND|BUT|NO|YES|IT|IS|NOT|OPENING|CLOSING|CONTENT WARNING|PREVIOUSLY|OVER|HARD CUT|TIME CUT)\b/;
const HEADING = /^(?:TEASER|COLD OPEN|TAG|STINGER|EPILOGUE|PROLOGUE|FINALE|ACT [A-Z0-9]+(?:\s*[—:-].*)?|PART [A-Z0-9]+(?:\s*[—:-].*)?|CHAPTER [A-Z0-9]+(?:\s*[—:-].*)?|EPISODE [A-Z0-9]+(?:\s*[—:-].*)?|MID-?CREDITS?.*|POST-?CREDITS?.*|ONE|TWO|THREE|FOUR|FIVE|SIX|SEVEN|EIGHT|NINE|TEN|ELEVEN|TWELVE|THIRTEEN|FOURTEEN|FIFTEEN|SIXTEEN|SEVENTEEN|EIGHTEEN|NINETEEN|TWENTY)[.:]?$/;
const cleanCue = (s) => s.replace(/\s*\([^)]*\)\s*/g, " ").replace(/\s+/g, " ").trim();
const titleCase = (s) => s.toLowerCase().replace(/(^|[\s.'’-])(\p{L})/gu, (m, a, b) => a + b.toUpperCase()).replace(/\b(Ii|Iii|Iv)\b/g, (x) => x.toUpperCase());
const isCue = (l) => { const raw = l.trim(); if (raw.length < 2 || raw.length > 42 || /[a-z]{2}/.test(raw.replace(/\([^)]*\)/g, "")) || !/^[A-Z0-9“"]/.test(raw) || /[.!?:]$/.test(raw.replace(/\([^)]*\)/g, "").trim())) return false; const c = cleanCue(raw); return c.length > 1 && c.split(" ").length <= 4 && !NOT_CUE.test(c) && /^[A-Z][\p{Lu}0-9 .'’&-]*$/u.test(c); };

// Capitals are also used for on-screen text and shouting, so a "speaker" has to look like a person or group.
const CUE_WORDS = /\b(?:TO|THE|ME|MY|YOUR|OUR|WITH|FOR|FROM|SHE|HE|THEY|IT|IS|ARE|WAS|LET|GIVE|GET|DO|DON'T|DON’T|NOT|YOU|I|WE|THIS|THAT|WHAT|WHY|HOW|AMOUNT|BEGIN|ESCAPE|FALLS|MEMORY|WELCOME|UNIVERSITY|FUCKING)\b/;
const GROUP = /^(?:MAN|WOMAN|GUY|GIRL|BOY|ENSEMBLE|CHORUS|VOICE|STUDENT|STUDENTS|CROWD|GROUP|KID|TEACHER|OFFICER|NURSE|DOCTOR|OLD)\b/;
const goodCue = (c) => !CUE_WORDS.test(c) && (!/\b(?:OF|IN|A|AN)\b/.test(c) || GROUP.test(c));

function scriptBeats(text) {
  const out = [], lines = text.replace(/\r/g, "").split("\n"); let place = "room", time = "day", wx = "", i = 0, para = [], names = new Set();
  const addN = (x) => { for (const c of chunks(x)) out.push({ k: "n", x: c }); };
  const flush = () => { if (!para.length) return; const raw = para.join(" "); para = []; const nw = weatherOf(raw, wx); if (nw !== wx && nw) { wx = nw; out.push({ k: "b", b: `${place}:${time}:${wx}` }); } addN(raw); };
  while (i < lines.length) {
    const l = lines[i].trim();
    if (!l) { flush(); i++; continue; }
    if (/^(INT\.?|EXT\.?|INT\/EXT|I\/E)[\s./]/.test(l)) { flush(); place = placeOf(l, place); time = timeOf(l, time); wx = weatherOf(l, ""); out.push({ k: "b", b: `${place}:${time}:${wx}`, cap: l }); i++; continue; }
    if (HEADING.test(l)) { flush(); out.push({ k: "c", x: titleCase(l.replace(/[.:]$/, "")) }); i++; continue; }
    if (/^(FADE|CUT|SMASH CUT|DISSOLVE|HARD CUT|MATCH CUT|TIME CUT)\b.*[.:]?$/.test(l) && !/[a-z]/.test(l)) { flush(); out.push({ k: "f", x: /BLACK|OUT/.test(l) ? "black" : "white", t: l }); i++; continue; }
    if (isCue(l) && goodCue(cleanCue(l)) && lines[i + 1]?.trim() && !HEADING.test(lines[i + 1].trim())) {
      flush(); const before = out.length; const who = titleCase(cleanCue(l)); i++; let note = "", said = []; const tag = [...l.matchAll(/\(([^)]+)\)/g)].map((m) => m[1]).join(", ");
      let noteOpen = false; const emit = () => { const t = said.join(" ").trim(); if (t) noteOpen = false; if (t) for (const c of chunks(t)) out.push({ k: "s", w: who, x: c, m: moodOf(c, note), ...(note ? { n: note } : {}), ...(tag ? { t: tag } : {}) }); said = []; };
      while (i < lines.length && lines[i].trim()) { const x = lines[i].trim(); if (/^\(.*\)$/.test(x)) { emit(); if (noteOpen && note) out.push({ k: "n", x: `(${note})` }); note = x.slice(1, -1); noteOpen = true; } else if (isCue(x) && goodCue(cleanCue(x)) && lines[i + 1]?.trim()) break; else said.push(x); i++; }
      emit(); if (noteOpen && note) for (const c of chunks(`${who}: (${note})`)) out.push({ k: "n", x: c });
      if (out.length === before) out.push({ k: "n", x: l }); else if (out.slice(before).some((b) => b.w)) names.add(who); continue;
    }
    const one = l.match(/^([A-Z][\p{Lu}0-9.'’&-]*(?: [\p{Lu}0-9.'’&-]+){0,3})(?: \(([^)]+)\))? ((?:[A-Z“"‘'(][\p{Ll}’' ,.!?…—-]|I |A |[“"]).*)$/u);
    if (one && !NOT_CUE.test(one[1]) && goodCue(one[1]) && one[1].length > 1 && !para.length) { flush(); const who = titleCase(one[1]); names.add(who); const body = one[3].replace(/^\(([^)]+)\)\s*/, (m, n) => { one[2] = one[2] ? `${one[2]}; ${n}` : n; return ""; }); for (const c of chunks(body)) out.push({ k: "s", w: who, x: c, m: moodOf(c, one[2] || ""), ...(one[2] ? { n: one[2] } : {}) }); i++; continue; }
    para.push(l); i++;
  }
  flush(); return { beats: out, names: [...names] };
}

const STOP = new Set("The A An And But Then He She It They We You I His Her Their Our Your My Its This That These Those There Here What When Where Why How Who Which If So Or Nor For At In On Of To By With From As Is Was Were Be Not No Yes Well Oh Ah One Two Three Four Five Six Seven Eight Nine Ten Dear Yours Nobody Somebody Someone Everyone Everybody Anyone Nothing Something Everything After Before Once While Still Just Only Even Some Most All Each Every Both Other Another Now Today Tonight Tomorrow Monday Tuesday Wednesday Thursday Friday Saturday Sunday January February March April May June July August September October November December Part Chapter The God Mister Sir Madam".split(" "));
const NAME_RE = "(?:(?:Mrs?\\.|Ms\\.|Dr\\.|Master|Mother|Father|Professor|Captain|Aunt|Uncle|Grandmother|Grandfather|Old|Princess|Queen|King|Lady|Lord)\\s)?[A-Z][\\p{Ll}'’-]{1,}";
const VERB = "said|asked|replied|answered|whispered|called|shouted|cried|murmured|muttered|added|agreed|sighed|snapped|laughed|told|went on|continued|repeated|breathed|demanded|insisted|explained|wondered|announced|croaked|grunted|groaned|sniffed|yelled|hissed";
const after = new RegExp(`^[,\\s]*(?:(${VERB})\\s+(?:the\\s+\\w+\\s+)?(${NAME_RE})|(${NAME_RE})\\s+(?:${VERB}))`, "u"), before = new RegExp(`(${NAME_RE})\\s+(?:${VERB}|looked|turned|smiled|nodded|shook|paused|stopped|leaned|put|took|held)[^.“"]{0,60}[.,:]?\\s*$`, "u"), pron = new RegExp(`^[,\\s]*(?:(?:${VERB})\\s+(?:he|she|they)|(?:he|she|they)\\s+(?:${VERB}))\\b`, "i");
const SPECIES = "fox|vixen|kitsune|tanuki|badger|hedgehog|mouse|stoat|ibex|owl|squirrel|heron|crane|marmot|hare|rabbit|frog|toad|cat|kitten|dog|puppy|wolf|bear|deer|stag|tortoise|turtle|otter|moth|crow|raven|sparrow|goose|duck|goat|sheep|lamb|mole|bat|weasel|ferret|beaver|raccoon|lion|tiger|monkey|horse|pony|donkey|pig|cow|snake|lizard|dragon|scarecrow|robot";
const proper = (s) => { const w = s.replace(/^(?:Mrs?\.|Ms\.|Dr\.|Master|Mother|Father|Professor|Captain|Aunt|Uncle|Grandmother|Grandfather|Old|Princess|Queen|King|Lady|Lord)\s/, ""); return !STOP.has(w) && !STOP.has(s); };

function proseBeats(text) {
  if (text.split("\n").length < 12 && text.length > 3000) text = text.replace(/([.!?…”"])\s+(?=[A-Z][\p{L}’'-]+(?: [A-Z][\p{L}’'-]+){0,2}:\s)/gu, "$1\n\n").replace(/([”"])\s+(?=[“"])/g, "$1\n\n").replace(/([.!?…]”)\s+(?=[A-Z])/g, "$1\n\n");
  const out = [], paras = text.replace(/\r/g, "").split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean), seen = {};
  for (const m of text.matchAll(new RegExp(`[a-z,;“"] (${NAME_RE})`, "gu"))) if (proper(m[1])) seen[m[1]] = (seen[m[1]] || 0) + 1;
  const known = (n) => n && proper(n) && (seen[n] || 0) >= 1;
  let place = placeOf(paras.slice(0, 6).join(" "), "room"), time = timeOf(paras.slice(0, 6).join(" "), "day"), wx = weatherOf(paras.slice(0, 6).join(" "), ""), lastA = null, lastB = null, prevDialog = false;
  out.push({ k: "b", b: `${place}:${time}:${wx}` });
  const addSay = (who, q, ctx) => { const t = q.replace(/^[“"]|[”"]$/g, ""); for (const c of chunks(t)) out.push(who ? { k: "s", w: who, x: `“${c}”`, m: moodOf(c, ctx) } : { k: "s", w: "", x: `“${c}”`, m: "calm" }); };
  paras.forEach((para, pi) => {
    const oneLine = para.replace(/\s*\n\s*/g, " ");
    if (HEADING.test(oneLine) || (oneLine.length < 46 && oneLine === oneLine.toUpperCase() && /[A-Z]{3}/.test(oneLine) && !/[“"]/.test(oneLine))) { if (/^THE END/.test(oneLine)) { out.push({ k: "n", x: "The End" }); return; } out.push({ k: "c", x: titleCase(oneLine.replace(/[.:]$/, "")) }); const win = paras.slice(pi + 1, pi + 5).join(" "), np = placeOf(win, place), nt = timeOf(win, time), nw = weatherOf(win, ""); if (`${np}${nt}${nw}` !== `${place}${time}${wx}`) { place = np; time = nt; wx = nw; out.push({ k: "b", b: `${place}:${time}:${wx}` }); } lastA = lastB = null; prevDialog = false; return; }
    if (oneLine.length > 60) { const hits = PLACES.filter(([k, re]) => k !== place && new RegExp("\\b(?:into|through|reached|arrived (?:at|in)|came to|stepped (?:in|out|onto|into)|entered|walked (?:to|into|through|down|up)|climbed|ran (?:to|into)|up to|down to|back to|out onto|made (?:her|his|their) way to)\\b[^.!?]{0,34}(?:" + re.source + ")", "i").test(oneLine)); if (hits.length) { place = hits[0][0]; time = timeOf(oneLine, time); wx = weatherOf(oneLine, wx); out.push({ k: "b", b: `${place}:${time}:${wx}` }); } else { const nw = weatherOf(oneLine, wx); if (nw && nw !== wx) { wx = nw; out.push({ k: "b", b: `${place}:${time}:${wx}` }); } } }
    const parts = oneLine.split(/(“[^”]*”|"[^"]*")/).filter((s) => s.trim());
    if (!parts.some((s) => /^[“"]/.test(s))) { prevDialog = false; if (/^[A-Z][\p{L}’'-]+:\s/u.test(oneLine) && oneLine.length < 500 && !STOP.has(oneLine.split(":")[0])) { const w = oneLine.split(":")[0], t = oneLine.slice(w.length + 1).trim(); for (const c of chunks(t)) out.push({ k: "n", x: `${w}: ${c}` }); return; } for (const c of chunks(oneLine)) out.push({ k: "n", x: c }); return; }
    const tagged = oneLine.match(/^([A-Z][\p{L}’'-]+(?: [A-Z][\p{L}’'-]+){0,2}):\s/u);
    let paraWho = tagged && !STOP.has(tagged[1]) ? tagged[1] : null;
    for (let k = 0; k < parts.length && !paraWho; k++) { if (/^[“"]/.test(parts[k])) continue; const a = parts[k].match(after), b = parts[k].match(before); const n = a ? a[2] || a[3] : b ? b[1] : null; if (known(n)) paraWho = n; }
    let who = paraWho; if (!who && prevDialog && lastB && parts.some((s) => pron.test(s) === false)) who = lastB; if (!who && !prevDialog && parts.some((s) => pron.test(s))) who = lastA;
    parts.forEach((p) => { if (/^[“"]/.test(p)) addSay(who, p, oneLine); else { const t = p.replace(/^[\s,]+/, "").replace(/^[A-Z][\p{L}’'-]+(?: [A-Z][\p{L}’'-]+){0,2}:\s*/u, (m) => (tagged && m.startsWith(tagged[1]) ? "" : m)); if (t.replace(/[^\p{L}]/gu, "").length > 2) for (const c of chunks(t[0].toUpperCase() + t.slice(1))) out.push({ k: "n", x: c }); } });
    if (who && who !== lastA) { lastB = lastA; lastA = who; } else if (who === lastA && lastB) { /* the same person spoke again */ } prevDialog = true;
  });
  const names = [...new Set(out.filter((b) => b.k === "s" && b.w).map((b) => b.w))];
  return { beats: out, names };
}

// Comics: each page is shown whole, with its captions and speech read out line by line underneath.
export function parseComic(pages) {
  const beats = [{ k: "b", b: "room:day:" }], ent = (s) => s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'");
  pages.forEach((p, n) => {
    const lines = [...p.svg.matchAll(/<text\b([^>]*)>([\s\S]*?)<\/text>/g)].filter((m) => !/fill="#888"/.test(m[1])).map((m) => ({ a: m[1], t: ent(m[2].replace(/<\/tspan>\s*<tspan[^>]*>/g, " ").replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim() })).filter((x) => x.t);
    beats.push({ k: "c", x: `Page ${n + 1}`, page: p.url });
    if (!lines.length) beats.push({ k: "n", x: "…", page: p.url });
    for (const l of lines) for (const c of chunks(l.t)) beats.push(/font-style="italic"/.test(l.a) ? { k: "n", x: c, page: p.url } : { k: "s", w: "", x: c, m: moodOf(c), page: p.url });
  });
  const chapters = beats.map((b, i) => (b.k === "c" ? { i, t: b.x } : null)).filter(Boolean);
  return { beats, cast: {}, chapters, script: false, comic: true };
}

export function parseStory(raw, kindHint) {
  let text = String(raw || "").replace(/^﻿/, "").replace(/\r/g, "").replace(/^.*\n+A Kitsune Original\..*\n+/, "");
  const cueCount = (text.match(/^[A-Z][A-Z .'’-]{1,28}(?: \([^)]*\))?\n(?=\S)/gm) || []).length, slugs = (text.match(/^(INT\.|EXT\.)/gm) || []).length;
  const script = text.split("\n").length >= 12 && (kindHint === "script" || slugs >= 2 || cueCount > 12);
  const { beats, names } = script ? scriptBeats(text) : proseBeats(text);
  const cast = {};
  for (const n of names) {
    const key = n.replace(/^(?:Mrs?\.|Ms\.|Dr\.|Professor|Master|Captain)\s/, ""), esc2 = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), re = new RegExp(`\\b${esc2}\\b`, "i"), at = text.search(re), near = at >= 0 ? text.slice(at, at + 170) : "", info = {};
    const sp = !script && (text.match(new RegExp(`\\b${esc2}\\b[^.\\n]{0,45}?\\b(?:a|an|the)\\s(?:[\\w-]+\\s){0,3}?(${SPECIES})\\b`, "i")) || text.match(new RegExp(`\\b(?:a|an)\\s(?:[\\w-]+\\s){0,3}?(${SPECIES})\\s(?:called|named)\\s${esc2}\\b`, "i")) || text.match(new RegExp(`\\b${esc2}\\b\\s*\\((${SPECIES})\\)`, "i")));
    if (sp) info.sp = sp[1].toLowerCase(); const h = near.match(HAIR); if (h) info.hair = (h[1] || h[2]).toLowerCase(); cast[n] = info;
  }
  // a first beat that always sets the scene, and chapter stops for the menu
  if (beats[0]?.k !== "b") beats.unshift({ k: "b", b: "room:day:" });
  const list = beats.filter((b) => b.k !== "n" || b.x.trim()), chapters = []; list.forEach((b, i) => { if (b.k === "c") chapters.push({ i, t: b.x }); }); if (!chapters.length || chapters[0].i > 12) chapters.unshift({ i: 0, t: "Beginning" });
  return { beats: list, cast, chapters, script };
}
