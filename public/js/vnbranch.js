// Hand-written branches for the visual novels. New scenes are added after the story's own text, and each choice
// can leave the original plot, come back to it later, or end somewhere else entirely.
const norm = (s) => String(s || "").replace(/[“”"]/g, "").replace(/’/g, "'").replace(/\s+/g, " ").trim();

export function findStop(story, stops, anchor, last = false) {
  const a = norm(anchor), hit = (s) => norm(story.beats[s.i]?.x).startsWith(a);
  if (last) { for (let k = stops.length - 1; k >= 0; k--) if (hit(stops[k])) return k; return -1; }
  return stops.findIndex(hit);
}

export function applyBranches(story, spec, stops) {
  const canon = stops.length, B = story.beats, ends = [], endIds = new Set();
  Object.assign(story.cast, spec.cast || {});
  const addScene = (lines, from, bg) => {
    const start = stops.length; let on = [];
    lines.forEach((l) => {
      const say = Array.isArray(l), beat = say ? { k: "s", w: l[0], x: l[1], m: l[2] || "calm" } : { k: "n", x: l };
      if (say) { story.cast[l[0]] ||= {}; if (!story.cast[l[0]].hide) on = [l[0], ...on.filter((n) => n !== l[0])].slice(0, 2); }
      B.push(beat); stops.push({ i: B.length - 1, bg: bg || from.bg, cap: "", fade: "", on: [...on], who: say ? l[0] : "", page: "", branch: true });
    });
    return { start, last: stops.length - 1 };
  };
  const choices = (spec.choices || []).map((c) => {
    const k = findStop(story, stops.slice(0, canon), c.after, c.last); if (k < 0) throw new Error("No line: " + c.after);
    const opts = c.opts.map((o) => {
      const out = { t: o.t, set: o.set, need: o.need, not: o.not, main: !!o.main };
      if (o.to) { out.toStop = findStop(story, stops.slice(0, canon), o.to, o.toLast); if (out.toStop < 0) throw new Error("No line: " + o.to); }
      if (o.scene?.length) { const r = addScene(o.scene, stops[k], o.bg); out.start = r.start; const tail = stops[r.last]; if (o.end) tail.end = o.end; else tail.jump = out.toStop ?? k + 1; }
      if (o.end && !endIds.has(o.end.id)) { endIds.add(o.end.id); ends.push({ id: o.end.id, title: o.end.title, kind: o.end.kind, line: o.end.line }); }
      return out;
    });
    return { at: stops[k].i, stop: k, prompt: c.prompt, opts };
  });
  const echoes = new Map();
  for (const e of spec.echoes || []) {
    const k = findStop(story, stops.slice(0, canon), e.after, e.last); if (k < 0) throw new Error("No line: " + e.after);
    const r = addScene(e.scene, stops[k]); stops[r.last].jump = k + 1;
    if (!echoes.has(k)) echoes.set(k, []); echoes.get(k).push({ need: e.need, start: r.start });
  }
  ends.push({ id: "canon", title: spec.canonEnd || "As It Was Written", kind: "The original ending", line: "" });
  return { canon, choices, ends, echoes };
}

export const flagsOf = (G, picks) => { const f = new Set(); for (const c of G.choices) { const o = c.opts[picks[c.at]]; if (o?.set) f.add(o.set); } return f; };
