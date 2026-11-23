// Builds public/originals/vn-cast.json: one unique design for every speaking character in every visual novel.
// Details come from how the stories and the lore describe them; everything else is assigned so no two look alike.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../public"); process.chdir(root);
const { parseStory } = await import(path.join(root, "js/vnparse.js"));
const { CHARACTERS } = await import(path.join(root, "js/lore-curated.js"));
const src = fs.readFileSync("js/originals.js", "utf8").replace(/^import .*$/gm, "").replace(/export const/g, "const").split("export async function addSeriesItem")[0];
const { ORIGINALS: O, SERIES: S } = new Function(src + ";return {ORIGINALS,SERIES}")();
const list = [...O.filter((x) => x.type === "book").map((x) => ({ f: x.file, k: "text", sid: "kitsune" })), ...S.flatMap((s) => s.items.map((x) => ({ f: x.file, k: x.kind, sid: s.id })))];
const OVERRIDES = JSON.parse(fs.existsSync("../tools/vn-cast-overrides.json") ? fs.readFileSync("../tools/vn-cast-overrides.json", "utf8") : "{}");
const branches = JSON.parse(fs.readFileSync("originals/vn-branches.json", "utf8"));

const HASH = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const TITLE = /^(?:Mrs?\.|Ms\.|Dr\.|Professor|Master|Captain|Old|Lady|Lord|Queen|King|Princess|Prince)\s/;
export const keyName = (n) => n.replace(TITLE, "").trim();
const OFF = /^(?:Ensemble|Chorus|Crowd|Students|Everyone|All|Group|Narrator|Announcer|Intercom|Pa|P\.A\.|Radio|Tv|Television|Phone|Computer|Machine|System|Speaker|Speakers|Voice|Voices|Plant|Typewriter|Printer|Sign|Door|Elevator|Alarm|Song|Choir|Audience|Band)\b|\b(?:Voice|Voices|Crowd|Chorus|Intercom|Radio|Speaker|Tv|Announcement|Machine|Phone)$/;
const HAIR = { platinum: "#efe6c8", blonde: "#e2c070", blond: "#e2c070", golden: "#e6b94f", black: "#17151a", raven: "#17151a", red: "#b5301f", crimson: "#a3142c", ginger: "#c9622a", copper: "#b8622c", auburn: "#853a20", silver: "#c8ccd6", white: "#f0ede6", grey: "#92949e", gray: "#92949e", brown: "#5e3b22", brunette: "#4b2e1b", chestnut: "#6e3a1e", pink: "#e684b4", blue: "#4a78dc", green: "#3aa07c", purple: "#7d4fc6", violet: "#8c5bd6", lavender: "#b49ae0", teal: "#2f9c9c" };
const COLOR = { red: "#b5303a", crimson: "#96162e", scarlet: "#c2282e", black: "#1d1c22", white: "#e9e6df", grey: "#6b6d78", gray: "#6b6d78", silver: "#a8adb8", gold: "#c79a2e", golden: "#c79a2e", yellow: "#d8b52e", orange: "#d4702a", green: "#2f7a56", emerald: "#1d8058", olive: "#6b7033", blue: "#2c5aa8", navy: "#1f2a55", teal: "#1f7f85", purple: "#60379a", violet: "#6d44b0", pink: "#d6608f", brown: "#6a4528", tan: "#a98558", cream: "#e4d8bc", champagne: "#d8c79c", burgundy: "#6e1f33", maroon: "#6b1f2a" };
const EYES = { blue: "#3b78c9", green: "#2f8a5c", brown: "#5e3b22", hazel: "#8a6a2e", grey: "#6f7a86", gray: "#6f7a86", amber: "#c98a1e", gold: "#d4a11e", golden: "#d4a11e", red: "#c22a2a", crimson: "#a3142c", violet: "#7b4fc6", purple: "#7b4fc6", black: "#1b1a22", silver: "#aab0bc", white: "#d8dce4" };
const SP = { puffin: "puffin", carp: "carp", fox: "fox", vixen: "fox", kitsune: "kitsune", tanuki: "tanuki", badger: "badger", hedgehog: "hedgehog", mouse: "mouse", stoat: "stoat", ibex: "ibex", owl: "owl", squirrel: "squirrel", heron: "heron", crane: "crane", marmot: "marmot", hare: "hare", rabbit: "rabbit", frog: "frog", toad: "toad", cat: "cat", dog: "dog", wolf: "wolf", bear: "bear", deer: "deer", tortoise: "tortoise", turtle: "turtle", otter: "otter", moth: "moth", crow: "crow", raven: "raven", goat: "goat", mole: "mole", bat: "bat", weasel: "weasel", lion: "lion", tiger: "tiger", monkey: "monkey", horse: "horse", donkey: "donkey", pig: "pig", cow: "cow", dragon: "dragon", scarecrow: "scarecrow", robot: "robot", magpie: "crow", vole: "mouse", hen: "duck", duck: "duck", goose: "goose" };
const OVERLAY = [["demon", /\b(?:demon|devil|fiend|hellspawn)\b/i], ["angel", /\b(?:angel|seraph)\b/i], ["ghost", /\b(?:ghost|spirit|phantom|spectre|specter|wraith)\b/i], ["reaper", /\b(?:reaper|death incarnate|lich)\b/i], ["vampire", /\bvampir/i], ["siren", /\bsiren\b/i], ["witch", /\b(?:witch|warlock|sorcer)/i], ["elf", /\belf\b|\belven\b/i], ["android", /\b(?:android|cyborg|automaton)\b/i]];
const STYLES = 12, SKINS = 7, FITS = ["casual", "smart", "hoodie", "robe", "uniform", "apron"], ACCS = ["", "", "glasses", "round", "earrings", "scarf", "bow", "headband", "freckles", "beanie", "flower", "scar", "cap", "beard", "moustache", "eyepatch", "choker", "hairpin"];

// gather who speaks, and where they're described
const people = new Map(), texts = {};
for (const x of list) { const raw = fs.readFileSync("." + x.f, "utf8"); (texts[x.sid] ||= []).push(raw); const r = parseStory(raw, x.k); for (const b of r.beats) if (b.k === "s" && b.w) for (const n of b.w.split(/ And /)) { if (OFF.test(n)) continue; const k = `${x.sid}:${keyName(n)}`; const p = people.get(k) || { sid: x.sid, name: keyName(n), lines: 0, sp: "" }; p.lines++; if (r.cast[n]?.sp && !p.sp) p.sp = r.cast[n].sp; people.set(k, p); } }
for (const [id, sp] of Object.entries(branches)) for (const [n, c] of Object.entries(sp.cast || {})) { const nm = keyName(c.key || n), k = `kitsune:${nm}`; const p = people.get(k) || { sid: "kitsune", name: nm, lines: 0, sp: "" }; if (c.sp) p.sp = c.sp; if (c.sp || c.key) p.forceSp = c.sp || ""; people.set(k, p); }
for (const sp of Object.values(branches)) for (const ch of sp.choices || []) for (const o of ch.opts) for (const l of o.scene || []) if (Array.isArray(l)) { const k = `kitsune:${keyName(l[0])}`; if (!people.has(k)) people.set(k, { sid: "kitsune", name: keyName(l[0]), lines: 1, sp: "" }); }
const lore = {}; for (const [k, c] of Object.entries(CHARACTERS)) { const sid = k.split(":")[0]; for (const n of [c.title, ...(c.aka || [])]) if (n) lore[`${sid}:${keyName(n)}`.toLowerCase()] = c; const first = keyName(c.title).split(" ")[0]; lore[`${sid}:${first}`.toLowerCase()] ||= c; }

function describe(p) {
  const out = {}, c = lore[`${p.sid}:${p.name}`.toLowerCase()] || lore[`${p.sid}:${p.name.split(" ")[0]}`.toLowerCase()], first = c?.sections?.[0]?.b || "", all = (texts[p.sid] || []).join("\n"), up = p.name.toUpperCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const intro = all.match(new RegExp(`\\b${up}\\b[,:]? (?:[^.\\n]{0,180})`))?.[0] || "", around = `${first.slice(0, 500)} ${intro}`;
  const sp = String(c?.species || "").toLowerCase(); if (p.sid === "kitsune") for (const [w, v] of Object.entries(SP)) if (new RegExp(`\\b${w}\\b`).test(sp)) { out.sp = v; break; } if (!out.sp && p.sp && p.sid === "kitsune") out.sp = p.sp;
  for (const [o, re] of OVERLAY) if (re.test(sp) || re.test(c?.role || "") || re.test(p.name)) { out.k = o; break; }
  const h = around.match(/\b(platinum|blonde?|golden|black|raven|red|crimson|ginger|copper|auburn|silver|white|grey|gray|brown|brunette|chestnut|pink|blue|green|purple|violet|lavender|teal)[- ](?:[\w-]+[- ]){0,2}?(?:hair|curls|braid|ponytail|bob|mane)\b/i); if (h) out.h = HAIR[h[1].toLowerCase()];
  const e = around.match(/\b(blue|green|brown|hazel|grey|gray|amber|gold|golden|red|crimson|violet|purple|black|silver|white)[- ]eye/i); if (e) out.e = EYES[e[1].toLowerCase()];
  const w = around.match(/\b(red|crimson|scarlet|black|white|grey|gray|silver|gold|golden|yellow|orange|green|emerald|olive|blue|navy|teal|purple|violet|pink|brown|tan|cream|champagne|burgundy|maroon)(?: silk| leather| wool| linen| velvet| denim| utility| satin)? (?:shirt|coat|jacket|gown|dress|suit|hoodie|sweater|cardigan|blazer|robe|cloak|scarf|trousers|uniform|apron|vest|kimono)\b/i); if (w) out.c = COLOR[w[1].toLowerCase()];
  const a = []; if (/\bglasses|spectacles\b/i.test(around)) a.push("glasses"); if (/\bscarf\b/i.test(around)) a.push("scarf"); if (/\bbeard\b/i.test(around)) a.push("beard"); if (/\bmoustache|mustache\b/i.test(around)) a.push("moustache"); if (/\beyepatch\b/i.test(around)) a.push("eyepatch"); if (/\bfreckle/i.test(around)) a.push("freckles"); if (/\bbeanie\b/i.test(around)) a.push("beanie"); if (a.length) out.x = a.slice(0, 2);
  if (/\b(?:hood|hoodie)\b/i.test(around)) out.f = "hoodie"; else if (/\b(?:suit|blazer|tie)\b/i.test(around)) out.f = "smart"; else if (/\b(?:robe|cloak|kimono)\b/i.test(around)) out.f = "robe"; else if (/\bapron\b/i.test(around)) out.f = "apron";
  if (/\b(?:seventies|eighties|nineties|elderly|ancient|old (?:man|woman|lady))\b/i.test(around)) out.o = 1;
  if (p.forceSp !== undefined) { if (p.forceSp) out.sp = p.forceSp; else delete out.sp; }
  const ov = OVERRIDES[`${p.sid}:${p.name}`]; if (ov) { const r = { ...out, ...ov, lock: 1 }; for (const k of ["sp", "k"]) if (!r[k]) delete r[k]; if (!r.o) delete r.o; return r; }
  return out;
}
const PAL = Object.values(COLOR), HPAL = [...new Set(Object.values(HAIR))];
const out = {}, placed = {};
const parts = (d) => [d.sp || "human", d.st, d.h, d.c, (d.x || []).join("+"), d.sk, d.f];
const dist = (a, b) => parts(a).reduce((n, v, i) => n + (v === parts(b)[i] ? 0 : 1), 0);
for (const p of [...people.values()].sort((a, b) => b.lines - a.lines || a.name.localeCompare(b.name))) {
  const fixed = describe(p), base = HASH(`${p.sid}:${p.name}`), pool = (placed[p.sid] ||= []); let d = null;
  for (let t = 0; t < 900; t++) {
    const m = base + t * 2654435761, r = (k) => (Math.imul(m >>> 0, k * 2 + 1) >>> 7), c = { ...fixed };
    c.st ??= r(3) % STYLES; c.sk ??= r(5) % SKINS; c.h ??= HPAL[r(7) % HPAL.length]; c.c ??= PAL[r(11) % PAL.length]; c.a ??= PAL[r(13) % PAL.length]; c.e ??= Object.values(EYES)[r(17) % Object.keys(EYES).length]; c.f ??= FITS[r(19) % FITS.length]; c.x ??= [ACCS[r(23) % ACCS.length]].filter(Boolean);
    if (c.a === c.c) c.a = PAL[(PAL.indexOf(c.c) + 5) % PAL.length];
    if (pool.every((q) => dist(q, c) >= 3)) { d = c; break; } d ||= c;
  }
  pool.push(d); out[`${p.sid}:${p.name}`] = d;
}
fs.writeFileSync("originals/vn-cast.json", JSON.stringify(out));
const sigs = new Set(Object.values(out).map((d) => parts(d).join("|") + d.e + d.a));
let closest = 9; for (const pool of Object.values(placed)) for (let i = 0; i < pool.length; i++) for (let j = i + 1; j < pool.length; j++) closest = Math.min(closest, dist(pool[i], pool[j]));
console.log("characters", Object.keys(out).length, "unique designs", sigs.size, "closest pair differs in", closest, "traits", "size", fs.statSync("originals/vn-cast.json").size);
const show = (k) => console.log(k, JSON.stringify(out[k]));
["blackwood:Lux", "blackwood:Velvette", "blackwood:Yuki", "blackwood:Kevin", "blackwood:Grim Reaper", "blackwood:Madison", "blackwood:Famine", "blackwood:Luna", "incarnate:Calypso", "kitsune:Ponzu", "kitsune:Fennick"].forEach(show);
