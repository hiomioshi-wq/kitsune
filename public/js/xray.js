// X-Ray: the people and places a book keeps mentioning, found in its own text, on this device.
// Spoiler-safe by default: only what you've already read counts.
import { $, $$, esc } from "./util.js";

const SKIP = new Set(("I I'm I'll I've I'd The A An And But Or Nor So Then When Where What Whom Who Why How Which Whose This That These Those There Here " +
  "He She It We You They His Her Hers Its Our Ours Your Yours Their Him Them Me My Mine Us Yes No Not Oh Ah Ay Alas Well Now Never Ever Only Just " +
  "Chapter Book Part Volume Act Scene Canto Section Letter Preface Introduction Contents Footnote Note Illustration Page Index Appendix End Finis " +
  "Mr Mrs Ms Miss Dr Sir Madam Madame Lady Lord St Saint Mount Monsieur Mademoiselle Captain Colonel General Professor Aunt Uncle King Queen Prince Princess Count " +
  "Monday Tuesday Wednesday Thursday Friday Saturday Sunday January February March April May June July August September October November December " +
  "God Lord Heaven Christmas English French German Latin Greek Italian Spanish Christian Englishman Frenchman " +
  "If As At In On Of To For From By With Upon After Before Since Until Unless While Though Although Because All One Two Three Four Five Ten First Last " +
  "Some Any Every Each Yet Still Do Did Does Don't Didn't Is Was Were Be Been Have Had Has Let Come Go Look See Say Tell Good Dear Poor Old Young Little Great " +
  "Very Perhaps Indeed Nay Aye Thou Thee Thy Thine Ye Project Gutenberg Ebook EBook Gutenberg's Why Whatever However Besides Nothing Something Everything " +
  "Mamma Papa Mama Sir Ma'am Hm Hush Hullo Hello Pray Thank Thanks Please Ha Oh O Pooh Bah Hurrah Whoever Wherever Can Could Shall Should Will Would May Might Must " +
  "Such Many Much More Most Both Either Neither Another Other Again Also Even Too Quite Rather Soon Once Twice Away Down Up Out Off Over Under Between Into Through " +
  "Copyright Ladyship Lordship Majesty Highness Excellency Bible Illustrated Transcriber Transcriber's Ii Iii Iv Vi Vii Viii Ix Xi Xii Xiii Xiv Xv").split(/\s+/));
const HON = /^(Mr|Mrs|Ms|Miss|Dr|Sir|Lady|Lord|Captain|Colonel|General|Professor|Aunt|Uncle|Father|Mother|Brother|Sister|Saint|St|King|Queen|Prince|Princess|Count|Countess|Duke|Duchess|Madame|Monsieur|Mademoiselle|Herr|Frau|Señor|Señora|Don|Doña)$/;
const SPEECH_AFTER = /^,?\s*(said|says|asked|cried|replied|answered|thought|smiled|laughed|nodded|whispered|shouted|exclaimed|murmured|sighed|felt|knew|wanted|wondered|exclaimed|returned|continued|added|began|observed|remarked|interrupted|declared)\b/i;
const SPEECH_BEFORE = /\b(said|asked|cried|replied|answered|whispered|shouted|exclaimed|murmured|returned|continued|added|observed|remarked|dear|poor)\s*,?\s*$/i;
const PLACE_BEFORE = /\b(in|at|into|near|through|across|reached|around|outside|inside)\s+(?:the\s+)?$/i;
const PLACE_WEAK = /\b(to|from|left|leaving|visit|visited|toward|towards)\s+(?:the\s+)?$/i;
const START = /(^|[.!?:;"“”‘'(\[—–]\s*|\n\s*)$/;

/** Find the recurring names in a book. `texts` is one string per readable block. */
export function analyse(texts) {
  const ents = new Map(), low = new Map();
  const word = /[A-ZÀ-Þ][a-zà-ÿ]+(?:['’-][A-Za-zà-ÿ]+)*/g;
  texts.forEach((t, p) => {
    if (!t || t.length < 3) return;
    for (const w of t.match(/\b[a-zà-ÿ][a-zà-ÿ'’]+/g) || []) low.set(w, (low.get(w) || 0) + 1);
    let m;
    word.lastIndex = 0;
    while ((m = word.exec(t))) {
      let w = m[0].replace(/['’]s$/, "");
      if (w.length < 2 || SKIP.has(w) || HON.test(w)) {
        // An honorific joins the name after it: "Mr. Darcy" is its own entry, apart from "Darcy".
        const h = m[0];
        if (HON.test(h)) {
          const rest = t.slice(m.index + m[0].length).match(/^\.?\s+([A-ZÀ-Þ][a-zà-ÿ]+(?:['’-][A-Za-zà-ÿ]+)*)/);
          if (rest && !SKIP.has(rest[1].replace(/['’]s$/, ""))) {
            const name = rest[1].replace(/['’]s$/, "");
            const key = `${h}${/^(Mr|Mrs|Ms|Dr|St)$/.test(h) ? "." : ""} ${name}`;
            add(key, p, true, "person", false);
            word.lastIndex = m.index + m[0].length + rest[0].length; // don't count the name a second time on its own
          }
        }
        continue;
      }
      const before = t.slice(Math.max(0, m.index - 24), m.index), after = t.slice(m.index + m[0].length, m.index + m[0].length + 24);
      const atStart = START.test(before);
      const kind = SPEECH_AFTER.test(after) || SPEECH_BEFORE.test(before) ? "person" : PLACE_BEFORE.test(before) ? "place" : PLACE_WEAK.test(before) ? "weak" : "";
      add(w, p, !atStart, kind, atStart);
    }
  });
  function add(key, p, mid, kind, atStart) {
    let e = ents.get(key);
    if (!e) ents.set(key, (e = { name: key, hits: [], mid: 0, start: 0, person: 0, place: 0, hon: / /.test(key) }));
    if (e.hits.length < 4000 && e.hits[e.hits.length - 1] !== p) e.hits.push(p);
    if (mid) e.mid++; if (atStart) e.start++;
    if (kind === "weak") e.place += 0.4; else if (kind) e[kind]++;
  }
  const surnames = new Set([...ents.values()].filter((e) => e.hon).map((e) => e.name.replace(/^\S+\s/, "")));
  const out = [];
  for (const e of ents.values()) {
    const n = e.mid + e.start;
    if (e.hon ? n < 2 : e.mid < 3) continue;
    if (!e.hon && (low.get(e.name.toLowerCase()) || 0) > n * 0.2) continue; // an ordinary word that starts sentences
    if (!e.hon && e.start > e.mid * 3) continue;
    e.n = n;
    e.kind = e.hon || surnames.has(e.name) || e.person > Math.max(1, e.place * 1.5) ? "person" : e.place >= 2 && e.place > e.person ? "place" : "other";
    out.push(e);
  }
  return out.sort((a, b) => b.n - a.n).slice(0, 120);
}

const upTo = (hits, pos) => { let lo = 0, hi = hits.length; while (lo < hi) { const m = (lo + hi) >> 1; if (hits[m] <= pos) lo = m + 1; else hi = m; } return lo; };

/** The names that turn up most in the stretch just before `pos`. */
export function around(ents, pos, span = 120) {
  return ents.map((e) => ({ e, k: upTo(e.hits, pos) - upTo(e.hits, pos - span) })).filter((x) => x.k > 0).sort((a, b) => b.k - a.k).map((x) => x.e);
}

const BINS = 40;
function spark(e, total, pos, safe) {
  const bins = new Array(BINS).fill(0);
  for (const p of e.hits) { if (safe && p > pos) break; bins[Math.min(BINS - 1, Math.floor((p / total) * BINS))]++; }
  const max = Math.max(1, ...bins), here = Math.min(BINS - 1, Math.floor((pos / total) * BINS));
  return `<span class="xr-spark" aria-hidden="true">${bins.map((v, i) => `<i style="--h:${v ? Math.max(14, Math.round((v / max) * 100)) : 0}%" class="${i === here ? "here" : ""} ${safe && i > here ? "ahead" : ""}"></i>`).join("")}</span>`;
}

/** Draw the X-Ray panel into the reader's side panel. */
export function drawXray(side, ctx) {
  const { ents, texts, pos, total, goTo, lookUp, recap } = ctx;
  const st = (drawXray.st ||= { tab: "all", safe: true, q: "", open: "" });
  const draw = () => {
    const vis = ents.map((e) => ({ e, k: st.safe ? upTo(e.hits, pos) : e.hits.length })).filter((x) => x.k > 0)
      .filter((x) => st.tab === "all" || x.e.kind === st.tab).filter((x) => !st.q || x.e.name.toLowerCase().includes(st.q))
      .sort((a, b) => b.k - a.k);
    const hidden = st.safe ? ents.filter((e) => upTo(e.hits, pos) === 0).length : 0;
    side.innerHTML = `<h4>X-Ray</h4>
      <p class="xr-sub">The people and places this book keeps mentioning, found in its text.</p>
      <button class="btn btn-sm" type="button" id="xr-recap" style="justify-self:start">Recap: where was I?</button>
      <div class="seg" id="xr-tab">${[["all", "All"], ["person", "People"], ["place", "Places"]].map(([k, l]) => `<button type="button" data-t="${k}" aria-pressed="${st.tab === k}">${l}</button>`).join("")}</div>
      <input class="field" id="xr-q" type="search" placeholder="Filter names" value="${esc(st.q)}" aria-label="Filter names">
      <label class="check" style="font-size:13px"><input type="checkbox" id="xr-safe" ${st.safe ? "checked" : ""}> No spoilers: only count what I've read</label>
      ${vis.length ? `<div class="xr-list">${vis.slice(0, 80).map(({ e, k }) => `<div class="xr-ent ${st.open === e.name ? "open" : ""}">
        <button type="button" class="xr-row" data-n="${esc(e.name)}" aria-expanded="${st.open === e.name}"><span class="xr-kind k-${e.kind}" aria-hidden="true"></span><strong>${esc(e.name)}</strong><em>${k}</em>${spark(e, total, pos, st.safe)}</button>
        ${st.open === e.name ? mentions(e) : ""}</div>`).join("")}</div>`
      : `<p class="xr-sub">${st.q ? "No names match." : "No names yet. Read on a little and they'll show up here."}</p>`}
      ${hidden ? `<p class="xr-sub">${hidden} more appear later in the book.</p>` : ""}`;
  };
  const mentions = (e) => {
    const list = e.hits.filter((p) => !st.safe || p <= pos);
    const first = list[0];
    const snip = (p) => { const t = texts[p] || "", i = t.indexOf(e.name.replace(/^.*\s/, "")); const a = Math.max(0, i - 60); return (a ? "…" : "") + t.slice(a, i + 110).replace(/\s+/g, " ") + "…"; };
    return `<div class="xr-more">
      <p class="xr-sub">First mentioned at ${Math.round((first / total) * 100)}%. ${list.length} ${list.length === 1 ? "passage" : "passages"}${st.safe ? " so far" : ""}.</p>
      <div class="b-toc">${list.slice(-30).reverse().map((p) => `<button type="button" data-p="${p}"><span style="white-space:normal">${esc(snip(p))}</span><em>${Math.round((p / total) * 100)}%</em></button>`).join("")}</div>
      <button class="btn btn-sm" type="button" data-look="${esc(e.name)}" style="justify-self:start">Look it up</button></div>`;
  };
  draw();
  side.onclick = (e) => {
    const t = e.target.closest("[data-t]"); if (t) { st.tab = t.dataset.t; return draw(); }
    const r = e.target.closest(".xr-row"); if (r) { st.open = st.open === r.dataset.n ? "" : r.dataset.n; draw(); $(".xr-ent.open", side)?.scrollIntoView({ block: "nearest" }); return; }
    const p = e.target.closest("[data-p]"); if (p) return goTo(Number(p.dataset.p), $(".xr-ent.open strong", side)?.textContent || "");
    const lk = e.target.closest("[data-look]"); if (lk) return lookUp(lk.dataset.look);
    if (e.target.closest("#xr-recap")) recap();
  };
  side.onchange = (e) => { if (e.target.id === "xr-safe") { st.safe = e.target.checked; draw(); } };
  side.oninput = (e) => { if (e.target.id === "xr-q") { st.q = e.target.value.trim().toLowerCase(); const at = e.target.selectionStart; draw(); const q = $("#xr-q", side); q.focus(); q.setSelectionRange(at, at); } };
  void $$;
}

/** "Previously in…": a card that brings you back into a book after time away. */
export function recapHtml({ title, days, pct, chapter, lastText, hls, people }) {
  const ago = days == null ? "" : days < 1 ? "earlier today" : days < 2 ? "yesterday" : days < 14 ? `${Math.round(days)} days ago` : days < 60 ? `${Math.round(days / 7)} weeks ago` : `${Math.round(days / 30)} months ago`;
  return `<div class="b-recap" role="dialog" aria-modal="true" aria-labelledby="recap-h"><div class="b-recap-card">
    <p class="eyebrow">Previously in</p>
    <h2 id="recap-h">${esc(title)}</h2>
    <p class="b-recap-meta">${ago ? `You last read ${ago}. ` : ""}You're ${pct}% through${chapter ? `, in <strong>${esc(chapter)}</strong>` : ""}.</p>
    ${lastText ? `<h4>Where you stopped</h4><blockquote>${esc(lastText)}</blockquote>` : ""}
    ${people.length ? `<h4>Around lately</h4><div class="b-recap-ppl">${people.map((e) => `<span class="k-${e.kind}">${esc(e.name)}</span>`).join("")}</div>` : ""}
    ${hls.length ? `<h4>Your highlights so far</h4>${hls.map((h) => `<blockquote class="hl">${esc(h.text.length > 220 ? h.text.slice(0, 220) + "…" : h.text)}${h.note ? `<small>${esc(h.note)}</small>` : ""}</blockquote>`).join("")}` : ""}
    <div class="b-recap-go"><button class="btn" type="button" data-recap="back">Back a little</button><button class="btn btn-accent" type="button" data-recap="go">Keep reading</button></div>
  </div></div>`;
}
