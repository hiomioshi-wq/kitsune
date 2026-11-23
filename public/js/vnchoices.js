// Choices for the visual novels. Each story's full text always plays. Your choices decide who you stand with,
// which of their earlier lines come back to you, and which of the story's endings you reach.
const seedOf = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const clean = (x) => String(x || "").replace(/^[“"]|[”"]$/g, "").trim();
const quotable = (x) => { const t = clean(x); return t.length >= 18 && t.length <= 175 && !/\b(?:fuck\w*|sex\w*|naked|cock|pussy|tits|cum|orgasm\w*)\b/i.test(t); };
export const STANCES = {
  hope: { label: "Hope it turns out all right", title: "The Bright Reading", line: "You kept hoping, all the way through. This is the line you carried out with you:" },
  wary: { label: "Brace for something worse", title: "The Long Shadow", line: "You never quite let your guard down. This is the line that stayed with you:" },
  curious: { label: "Look closer", title: "The Open Question", line: "You kept looking under things. This is the question you left with:" },
  watch: { label: "Hang back and watch", title: "The Witness", line: "You stayed out of it and saw everything. This is how you remember it:" },
};
const ASIDE = {
  hope: ["You let yourself believe it might be all right.", "Something in you leans toward the light of it.", "It could still go well. You decide to think so.", "You hold on to the good version of this for a little longer."],
  wary: ["You've read enough stories to know this feeling.", "Something about this sits wrong, and you keep it close.", "You make a note of the exits.", "You don't relax. Not yet."],
  curious: ["You look again, more slowly. There's more here than the first glance gave you.", "You turn the moment over, looking for the seam.", "A small detail snags on you. You keep it for later.", "You start to wonder who hasn't said what."],
  watch: ["You say nothing, and you miss nothing.", "You stay where you are and let it happen.", "Nobody is looking at you. That suits you.", "You keep your hands in your pockets and your eyes open."],
};
const PROMPTS = { many: ["Who do you stay with?", "Whose side are you on right now?", "Who do you believe?", "Who are you watching?", "Who do you follow from here?"], one: ["What do you make of {n}?", "Do you believe {n}?", "How do you feel about {n} right now?"], none: ["How does this feel to you?", "Where do you think this is going?", "What do you do with this moment?"] };

export function buildChoices(story, id, isOff = () => false) {
  const B = story.beats, stops = []; B.forEach((b, i) => { if (b.k === "s" || b.k === "n") stops.push(i); }); const n = stops.length; if (n < 12) return [];
  const want = Math.max(4, Math.min(16, Math.round(n / 65))), seed = seedOf(id), pick = (l, k) => l[(seed + k * 7) % l.length];
  // natural places: the last line before a new chapter or scene
  const natural = []; stops.forEach((bi, k) => { const nx = stops[k + 1]; if (nx == null) return; for (let j = bi + 1; j < nx; j++) if (B[j].k === "c" || (B[j].k === "b" && B[j].cap)) { natural.push(k); break; } });
  const lo = Math.ceil(n * .06), hi = Math.floor(n * .97), used = [], gap = Math.max(3, Math.floor(n / (want * 2.2)));
  for (let t = 1; t <= want; t++) { const target = Math.round((t / (want + 1)) * n); let best = natural.filter((k) => k >= lo && k <= hi && !used.some((u) => Math.abs(u - k) < gap)).sort((a, b) => Math.abs(a - target) - Math.abs(b - target))[0]; if (best == null || Math.abs(best - target) > n / want) { best = target; for (let d = 0; d < 12; d++) { const k = target + d; if (k < n && /\?[”"]?$/.test(B[stops[k]].x)) { best = k; break; } } } if (best >= lo && best <= hi && !used.some((u) => Math.abs(u - best) < gap)) used.push(best); }
  used.sort((a, b) => a - b);
  return used.map((k, idx) => {
    const counts = {}; for (let j = Math.max(0, k - 45); j <= k; j++) { const w = B[stops[j]].w; if (w && !/ And /.test(w) && !isOff(w)) counts[w] = (counts[w] || 0) + 1; }
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3).map((x) => x[0]), memory = (name) => { for (let j = k - 3; j >= 0; j--) { const b = B[stops[j]]; if (b.w === name && quotable(b.x)) return `You remember what ${name} said: “${clean(b.x)}”`; } return `You keep ${name} in the corner of your eye.`; };
    let prompt, opts;
    if (top.length >= 2) { prompt = pick(PROMPTS.many, idx); opts = [...top.map((name) => ({ t: `${pick(["Stay close to", "Side with", "Listen to"], idx)} ${name}`, who: name, aside: memory(name) })), { t: STANCES.watch.label, st: "watch", aside: pick(ASIDE.watch, idx) }]; }
    else if (top.length === 1) { const name = top[0]; prompt = pick(PROMPTS.one, idx).replace("{n}", name); opts = [{ t: `Trust ${name}`, who: name, aside: memory(name) }, { t: `Don't trust ${name} yet`, st: "wary", aside: pick(ASIDE.wary, idx) }, { t: STANCES.curious.label, st: "curious", aside: pick(ASIDE.curious, idx) }]; }
    else { prompt = pick(PROMPTS.none, idx); opts = ["hope", "wary", "curious", "watch"].map((s) => ({ t: STANCES[s].label, st: s, aside: pick(ASIDE[s], idx) })); }
    return { at: stops[k], prompt, opts };
  });
}

const bestLine = (story, test, from = .35) => { const B = story.beats, start = Math.floor(B.length * from); let found = ""; for (let i = B.length - 1; i >= start; i--) { const b = B[i]; if ((b.k === "s" || b.k === "n") && quotable(b.x) && test(b)) { found = clean(b.x); break; } } return found; };
export function allEndings(story, choices) {
  const out = [], names = new Set(); for (const c of choices) for (const o of c.opts) if (o.who) names.add(o.who);
  const lines = {}; for (const b of story.beats) if (b.w) lines[b.w] = (lines[b.w] || 0) + 1;
  for (const n of [...names].sort((a, b) => (lines[b] || 0) - (lines[a] || 0)).slice(0, 6)) out.push({ id: "c:" + n, who: n, title: `${n}'s Ending` });
  const st = new Set(choices.flatMap((c) => c.opts.map((o) => o.st).filter(Boolean))); for (const s of ["hope", "wary", "curious", "watch"]) if (st.has(s)) out.push({ id: "s:" + s, st: s, title: STANCES[s].title });
  return out;
}
export function endingFor(story, choices, picks) {
  const all = allEndings(story, choices); if (!all.length) return null; const tally = {}; let last = null;
  for (const c of choices) { const o = c.opts[picks[c.at]]; if (!o) continue; const key = o.who ? "c:" + o.who : "s:" + o.st; tally[key] = (tally[key] || 0) + 1; last = key; }
  const known = Object.entries(tally).filter(([k]) => all.some((e) => e.id === k)).sort((a, b) => b[1] - a[1] || (a[0] === last ? -1 : b[0] === last ? 1 : 0));
  const e = all.find((x) => x.id === known[0]?.[0]) || all.find((x) => x.st === "watch") || all[0];
  if (e.who) { const q = bestLine(story, (b) => b.w === e.who && b.m !== "calm") || bestLine(story, (b) => b.w === e.who, 0) || clean(story.beats.filter((b) => b.w === e.who).at(-1)?.x).slice(0, 175); return { ...e, intro: `You stayed closest to ${e.who}. This is the line you carried out of the story:`, quote: q, tally }; }
  const test = { hope: (b) => b.m === "happy", wary: (b) => b.m === "sad" || b.m === "shock" || b.m === "angry", curious: (b) => /\?[”"]?$/.test(b.x), watch: (b) => b.k === "n" }[e.st];
  return { ...e, intro: STANCES[e.st].line, quote: bestLine(story, test) || bestLine(story, () => true, 0) || clean(story.beats.filter((b) => (b.k === "s" || b.k === "n") && b.x.length > 3).at(-1)?.x).slice(0, 175), tally };
}
