// Detective puzzles: every case is generated from a seed and checked so exactly one culprit fits the evidence.
const permsOf = (n) => { const out = [], a = [...Array(n).keys()], go = (k) => { if (k === n) return void out.push(a.slice()); for (let i = k; i < n; i++) { [a[k], a[i]] = [a[i], a[k]]; go(k + 1); [a[k], a[i]] = [a[i], a[k]]; } }; go(0); return out; };
const PERMS = {}, perms = (n) => (PERMS[n] ||= permsOf(n));
const rngOf = (seed) => { let h = seed >>> 0 || 1; return () => { h = (h + 0x6d2b79f5) >>> 0; let t = Math.imul(h ^ (h >>> 15), 1 | h); t ^= t + Math.imul(t ^ (t >>> 7), 61 | t); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
const shuffle = (a, r) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
export const holds = (c, p, it) => { switch (c.k) { case "at": return p[c.s] === c.v; case "nat": return p[c.s] !== c.v; case "had": return it[c.s] === c.v; case "nhad": return it[c.s] !== c.v; case "pair": return it[p.indexOf(c.p)] === c.v; case "npair": return it[p.indexOf(c.p)] !== c.v; } return false; };
export const clueText = (c, x) => { const S = x.suspects, P = x.places, I = x.items; switch (c.k) { case "at": return `${S[c.s]} was in ${P[c.v]}.`; case "nat": return `${S[c.s]} was nowhere near ${P[c.v]}.`; case "had": return `${S[c.s]} was carrying ${I[c.v]}.`; case "nhad": return `${S[c.s]} did not have ${I[c.v]}.`; case "pair": return `Whoever was in ${P[c.p]} had ${I[c.v]}.`; case "npair": return `Nobody in ${P[c.p]} had ${I[c.v]}.`; } return ""; };
const culpritOf = (p, it, P, I) => { const s = p.indexOf(P); return it[s] === I ? s : -1; };
const allClues = (n, tp, ti, cul, P, I) => { const out = []; for (let s = 0; s < n; s++) for (let v = 0; v < n; v++) { if (tp[s] === v) { if (!(s === cul && v === P)) out.push({ k: "at", s, v }); } else out.push({ k: "nat", s, v }); if (ti[s] === v) { if (!(s === cul && v === I)) out.push({ k: "had", s, v }); } else out.push({ k: "nhad", s, v }); } for (let q = 0; q < n; q++) for (let v = 0; v < n; v++) { if (q === P && v === I) continue; const has = ti[tp.indexOf(q)] === v; out.push({ k: has ? "pair" : "npair", p: q, v }); } return out; };
// Returns the suspects who could be guilty given statements (one per suspect, the guilty one lies) and true evidence.
export function possible(n, P, I, evidence, statements = null) { const A = perms(n), found = new Set(); for (const p of A) { if (!p.includes(P)) continue; for (const it of A) { const c = culpritOf(p, it, P, I); if (c < 0 || found.has(c)) continue; if (!evidence.every((e) => holds(e, p, it))) continue; if (statements && !statements.every((e, s) => holds(e, p, it) === (s !== c))) continue; found.add(c); } } return [...found].sort(); }
export function genCase(seed, level = 0) {
  const r = rngOf(seed), n = level < 1 ? 4 : 5, liar = level >= 2, A = perms(n);
  for (let tries = 0; tries < 40; tries++) {
    const tp = A[Math.floor(r() * A.length)], ti = A[Math.floor(r() * A.length)], cul = Math.floor(r() * n), P = tp[cul], I = ti[cul], direct = (c) => (level >= 1 && ((c.k === "nat" && c.v === P) || (c.k === "nhad" && c.v === I)) ? 1 : 0), pool = shuffle(allClues(n, tp, ti, cul, P, I), r).sort((a, b) => direct(a) - direct(b));
    let statements = null;
    if (liar) { statements = []; for (let s = 0; s < n; s++) { if (s === cul) { const v = shuffle([...Array(n).keys()].filter((q) => q !== P), r)[0]; statements.push({ k: "at", s, v }); } else { const own = pool.filter((c) => c.s === s && (c.k === "nat" || c.k === "nhad" || c.k === "at" || c.k === "had")); statements.push(own[Math.floor(r() * own.length)]); } } }
    const ev = []; let left = possible(n, P, I, ev, statements);
    for (const c of pool) { if (left.length === 1) break; const next = possible(n, P, I, [...ev, c], statements); if (next.length < left.length) { ev.push(c); left = next; } }
    if (left.length !== 1 || left[0] !== cul) continue;
    for (let i = ev.length - 1; i >= 0; i--) { const t = ev.filter((_, q) => q !== i); if (possible(n, P, I, t, statements).length === 1) ev.splice(i, 1); }
    if (!liar && ev.length < 3) continue;
    const decoys = pool.filter((c) => !ev.includes(c) && !(c.k === "nat" && c.v === P) && !(c.k === "nhad" && c.v === I)).slice(0, 2 + level); ev.push(...decoys); shuffle(ev, r);
    const talk = liar ? statements.map((c, s) => ({ from: s, c })) : [], rooms = [];
    ev.forEach((c, i) => { if (!liar && i % 2 === 0) talk.push({ from: (i / 2 + Math.floor(r() * n)) % n, c }); else rooms.push({ room: Math.floor(r() * n), spot: Math.floor(r() * 6), c }); });
    return { seed, level, n, liar, P, I, culprit: cul, truthP: tp.slice(), truthI: ti.slice(), talk, rooms, evidence: ev, statements };
  }
  throw new Error("case generation failed");
}
