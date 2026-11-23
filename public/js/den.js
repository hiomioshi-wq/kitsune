// The Den: your reading grows a fox. Every level adds a tail, up to the nine-tailed kitsune.
// XP is worked out from the reading stats already on this device, so it can't drift or be lost.
import { esc, icon, today } from "./util.js";
import { kvGet, kvSet, settings } from "./store.js";

export const LEVELS = [0, 150, 400, 800, 1400, 2300, 3600, 5400, 8000];
export const RANKS = [
  ["Kit", "A small fox with one tail and a lot of curiosity."],
  ["Two-tail", "The first book-smell memories are setting in."],
  ["Three-tail", "You know where the good chapters hide."],
  ["Four-tail", "Foxfire follows you between stories."],
  ["Five-tail", "Half a legend. The library whispers your name."],
  ["Six-tail", "You read in the dark and the dark reads back."],
  ["Seven-tail", "Shelves rearrange themselves when you walk in."],
  ["Eight-tail", "One tail from myth."],
  ["Nine-tailed kitsune", "A thousand stories old. The den is yours."],
];
// Fur unlocks: one new coat per tail. [id, name, main, shade, cream]
export const FURS = [
  ["amber", "Amber", "#e0782c", "#a8481a", "#fff3e2"],
  ["silver", "Silver", "#b8bfcc", "#7c8496", "#ffffff"],
  ["crimson", "Crimson", "#c8323c", "#86182a", "#ffe9e4"],
  ["midnight", "Midnight", "#3a3f6e", "#1f2245", "#d9dcff"],
  ["jade", "Jade", "#3c9a7a", "#1f624c", "#eafff4"],
  ["spirit", "Spirit blue", "#4aa8ff", "#2560c9", "#eaf6ff"],
  ["sakura", "Sakura", "#f09ab8", "#c45b84", "#fff3f8"],
  ["gold", "Gold", "#e6b53a", "#a77812", "#fffbe8"],
  ["aurora", "Aurora", "url(#den-aurora)", "#5b3db8", "#f6f1ff"],
];
// Daily quests, checked against one day of reading.
export const QUESTS = [
  ["pages10", "Read 10 pages", (v) => [v.pages || 0, 10]],
  ["mins15", "Read or listen for 15 minutes", (v) => [Math.floor(((v.secs || 0) + (v.listen || 0)) / 60), 15]],
  ["two", "Open two different stories", (v) => [(v.items || []).length, 2]],
  ["goal", "Hit your daily page goal", (v) => [v.pages || 0, settings.goal || 20]],
];
const QUEST_XP = 20;

export async function denState() {
  const st = await kvGet("stats", { days: {}, finished: [] });
  const days = st.days || {};
  const hl = Object.values(await kvGet("highlights", {})).reduce((a, l) => a + l.length, 0);
  const activeDays = Object.values(days).filter((v) => v.pages || v.secs > 60 || v.listen > 60).length;
  let questsDone = 0;
  for (const v of Object.values(days)) for (const [, , f] of QUESTS) { const [a, b] = f(v); if (a >= b) questsDone++; }
  const parts = [
    ["Pages read", Object.values(days).reduce((a, v) => a + (v.pages || 0), 0), 1],
    ["Minutes reading and listening", Math.floor(Object.values(days).reduce((a, v) => a + (v.secs || 0) + (v.listen || 0), 0) / 60), 1],
    ["Days you read", activeDays, 15],
    ["Titles finished", (st.finished || []).length, 120],
    ["Highlights", hl, 8],
    ["Daily quests done", questsDone, QUEST_XP],
  ];
  const xp = parts.reduce((a, [, n, per]) => a + n * per, 0);
  let level = 1;
  while (level < LEVELS.length && xp >= LEVELS[level]) level++;
  const lo = LEVELS[level - 1], hi = LEVELS[level] ?? null;
  const t = days[today()] || {};
  const quests = QUESTS.map(([id, label, f]) => { const [have, need] = f(t); return { id, label, have: Math.min(have, need), need, done: have >= need }; });
  return { xp, level, lo, hi, pct: hi ? (xp - lo) / (hi - lo) : 1, parts, quests, rank: RANKS[level - 1], fur: await currentFur(level) };
}

export async function currentFur(level) {
  const id = await kvGet("denFur", "amber");
  const i = FURS.findIndex((f) => f[0] === id);
  return i >= 0 && i < level ? FURS[i] : FURS[0];
}
export const setFur = (id) => kvSet("denFur", id);

// The fox itself. Tails fan out behind it; foxfire wisps orbit when it has more than one.
export function foxSvg(level, fur = FURS[0], { size = 320, wisps = true, cls = "" } = {}) {
  const [, , main, shade, cream] = fur;
  const n = Math.max(1, Math.min(9, level));
  const spread = n === 1 ? [58] : Array.from({ length: n }, (_, i) => -78 + (156 * i) / (n - 1));
  const len = 0.86 + n * 0.035;
  const tails = spread.map((a, i) => `<g transform="translate(200 292) rotate(${a.toFixed(1)}) scale(${len.toFixed(3)})"><g class="den-tail" style="--i:${i}">
      <path d="M0 0 C-46 -36 -62 -118 -26 -176 C-12 -198 18 -200 26 -178 C34 -150 14 -126 22 -88 C30 -50 26 -20 0 0 Z" fill="${main}" stroke="${shade}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M-26 -176 C-12 -198 18 -200 26 -178 C30 -164 22 -150 12 -146 C0 -152 -16 -150 -30 -160 Z" fill="${cream}"/></g></g>`).join("");
  const fire = wisps && n > 1 ? `<g class="den-wisps">${Array.from({ length: n }, (_, i) => `<g class="den-wisp" style="--i:${i};--n:${n}"><circle r="7" fill="#9fd8ff"/><circle r="14" fill="#6cc4ff" opacity=".25"/></g>`).join("")}</g>` : "";
  return `<svg class="den-fox ${cls}" viewBox="0 0 400 380" width="${size}" height="${Math.round(size * 0.95)}" role="img" aria-label="A fox with ${n} ${n === 1 ? "tail" : "tails"}">
    <defs><linearGradient id="den-aurora" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7b5cff"/><stop offset=".5" stop-color="#2ec4b6"/><stop offset="1" stop-color="#f06fb0"/></linearGradient>
      <radialGradient id="den-glow"><stop offset="0" stop-color="#ffd27a" stop-opacity=".55"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient></defs>
    <ellipse cx="200" cy="352" rx="150" ry="22" fill="url(#den-glow)"/>
    <g class="den-tails">${tails}</g>
    <g class="den-body">
      <path d="M200 182 C140 190 126 262 138 318 C144 340 170 348 200 348 C230 348 256 340 262 318 C274 262 260 190 200 182 Z" fill="${main}" stroke="${shade}" stroke-width="3"/>
      <path d="M200 210 C170 222 164 280 176 330 C184 342 216 342 224 330 C236 280 230 222 200 210 Z" fill="${cream}"/>
      <ellipse cx="176" cy="342" rx="20" ry="12" fill="${shade}"/><ellipse cx="224" cy="342" rx="20" ry="12" fill="${shade}"/>
      <g class="den-head">
        <path d="M146 132 L144 54 L196 104 Z" fill="${main}" stroke="${shade}" stroke-width="3" stroke-linejoin="round"/><path d="M154 118 L153 74 L182 104 Z" fill="${shade}"/>
        <path d="M254 132 L256 54 L204 104 Z" fill="${main}" stroke="${shade}" stroke-width="3" stroke-linejoin="round"/><path d="M246 118 L247 74 L218 104 Z" fill="${shade}"/>
        <path d="M134 146 C134 108 168 96 200 96 C232 96 266 108 266 146 C266 186 232 214 200 222 C168 214 134 186 134 146 Z" fill="${main}" stroke="${shade}" stroke-width="3"/>
        <path d="M140 160 C158 200 186 214 200 220 C214 214 242 200 260 160 C238 182 220 186 200 186 C180 186 162 182 140 160 Z" fill="${cream}"/>
        <path class="den-eye" d="M164 148 q12 -10 24 0" fill="none" stroke="#2a1a14" stroke-width="5" stroke-linecap="round"/>
        <path class="den-eye" d="M212 148 q12 -10 24 0" fill="none" stroke="#2a1a14" stroke-width="5" stroke-linecap="round"/>
        <ellipse cx="200" cy="184" rx="9" ry="6.5" fill="#2a1a14"/>
        <path class="den-mark" d="M200 112 l7 12 -7 12 -7 -12 Z" fill="#ffe08a"/>
      </g>
    </g>
    ${fire}
  </svg>`;
}

// Called after each page change: if the fox gained a tail since you last looked, celebrate.
let checking = false;
export async function checkLevelUp() {
  if (checking || document.querySelector(".den-levelup")) return;
  checking = true;
  try {
    const s = await denState();
    const seen = await kvGet("denSeenLevel", null);
    if (seen == null) { kvSet("denSeenLevel", s.level); return; }
    if (s.level > seen) { kvSet("denSeenLevel", s.level); celebrate(s); }
  } finally { checking = false; }
}

export function celebrate(s) {
  const fur = FURS[s.level - 1];
  const el = document.createElement("div");
  el.className = "den-levelup";
  el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true"); el.setAttribute("aria-labelledby", "den-lu-h");
  el.innerHTML = `<div class="den-lu-sparks" aria-hidden="true">${Array.from({ length: 28 }, (_, i) => `<i style="--a:${(i * 360) / 28}deg;--d:${(i % 7) * 0.05}s;--r:${140 + (i % 5) * 40}px"></i>`).join("")}</div>
    <div class="den-lu-card">
      <p class="den-lu-k">Level ${s.level}</p>
      <div class="den-lu-fox">${foxSvg(s.level, s.fur, { size: 260 })}</div>
      <h2 id="den-lu-h">${s.level === 9 ? "Nine tails. You're a legend." : `Your fox grew a ${["", "", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth"][s.level]} tail`}</h2>
      <p class="den-lu-rank">${esc(s.rank[0])} · ${esc(s.rank[1])}</p>
      ${fur ? `<p class="den-lu-unlock"><span class="den-swatch" style="background:${fur[2].startsWith("url") ? "linear-gradient(135deg,#7b5cff,#2ec4b6,#f06fb0)" : fur[2]}"></span> New coat unlocked: <strong>${esc(fur[1])}</strong></p>` : ""}
      <div class="den-lu-actions"><a class="btn btn-accent" href="#den" data-lu-close>${icon("star")} Visit your den</a><button class="btn" type="button" data-lu-close>Keep reading</button></div>
    </div>`;
  document.body.appendChild(el);
  const close = () => { el.classList.add("closing"); setTimeout(() => el.remove(), 260); removeEventListener("keydown", onKey, true); };
  const onKey = (e) => { if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); close(); } };
  addEventListener("keydown", onKey, true);
  el.addEventListener("click", (e) => { if (e.target === el || e.target.closest("[data-lu-close]")) close(); });
  el.querySelector("[data-lu-close]").focus({ preventScroll: true });
}
