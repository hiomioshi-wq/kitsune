// Living World & Reading-Driven Systems:
// - Ink Weather (genre tags -> fog/crows, pink Moonwake sunsets, manga paper-lantern storms)
// - The Ninth Tail (1 tail per finished book series + 9th tail from returning to an abandoned backlog book)
// - Marginalia Ghosts (wandering spirits quoting local highlights & bookmarks)
// - Rumour Mill (drifting town gossip with confront / embrace choices)
// - Lost Property Office (tracks sold, fused, or discarded items & critters)
// - The Kitsune Tax Spirit (smug tanuki collector who upgrades the town when paid)

import { seriesKey } from "../store.js";
import { today } from "../util.js";

const GENRE_TEXT = (it) =>
  [it.title, it.series, it.type, it.description, ...(it.genres || []), ...(it.tags || [])]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

export function inkWeather(items = []) {
  const pool = [...items].sort((a, b) => {
    const ar = a.status === "reading" ? 1 : 0;
    const br = b.status === "reading" ? 1 : 0;
    if (ar !== br) return br - ar;
    return (b.lastRead || 0) - (a.lastRead || 0);
  });
  const active = pool[0];
  if (!active) return { kind: "clear", label: "Clear Ink Sky", desc: "Start reading a book or manga to tint the sky." };
  const txt = GENRE_TEXT(active);
  if (/horror|mystery|thriller|gothic|ghost|dark|noir/.test(txt)) {
    return { kind: "horror", label: "Horror Fog & Crows", desc: `Inspired by “${active.title}” — drifting mist and crows gather over Blackwood.`, title: active.title };
  }
  if (/romance|love|drama|slice of life|shoujo|josei/.test(txt)) {
    return { kind: "romance", label: "Rose-Pink Moonwake Sunset", desc: `Inspired by “${active.title}” — warm rose-pink dusk bathes Moonwake & the shore.`, title: active.title };
  }
  if (active.type === "manga" || /manga|shonen|seinen|fantasy|adventure|action/.test(txt)) {
    return { kind: "lanternstorm", label: "Paper-Lantern Storm", desc: `Inspired by “${active.title}” — glowing paper lanterns drift across the night sky.`, title: active.title };
  }
  return { kind: "clear", label: "Gentle Prose Breeze", desc: `Reading “${active.title}” keeps the sky crisp and calm.`, title: active.title };
}

export function tailStatus(items = [], progressMap = {}, s = {}) {
  const groups = new Map();
  for (const it of items) {
    const k = seriesKey(it);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(it);
  }
  let finishedSeries = 0;
  const abandoned = [];
  for (const [, list] of groups) {
    const allDone = list.length > 0 && list.every((it) => {
      const p = progressMap[it.id];
      return it.status === "completed" || (p && p.total && p.pos >= p.total - 1);
    });
    if (allDone) finishedSeries++;
    for (const it of list) {
      const p = progressMap[it.id];
      const started = p && p.pos > 0 && !(p.total && p.pos >= p.total - 1);
      if (it.status !== "completed" && started) abandoned.push(it);
    }
  }
  if (s.backlogFinished) s.ninthTail = true;
  const baseTails = Math.min(8, Math.max(1, finishedSeries));
  const tails = s.ninthTail ? 9 : baseTails;
  return {
    tails,
    finishedSeries,
    abandoned,
    ninthUnlocked: !!s.ninthTail,
  };
}

export async function loadMarginaliaGhosts(kvGet, items = [], center = { x: 1800, y: 1800 }) {
  const [hl, bm] = await Promise.all([kvGet("highlights", {}), kvGet("bookmarks", {})]);
  const itemMap = new Map(items.map((i) => [i.id, i]));
  const ghosts = [];
  for (const [id, list] of Object.entries(hl || {})) {
    const book = itemMap.get(id)?.title || "an old volume";
    for (const h of list || []) {
      const text = (h.note || h.text || "").trim();
      if (text) ghosts.push({ book, text: text.slice(0, 140), kind: "Highlight" });
    }
  }
  for (const [id, list] of Object.entries(bm || {})) {
    const book = itemMap.get(id)?.title || "a library book";
    for (const b of list || []) {
      const text = (b.label || b.note || "").trim();
      if (text) ghosts.push({ book, text: text.slice(0, 140), kind: "Bookmark" });
    }
  }
  if (!ghosts.length) {
    ghosts.push({ book: "Your Library", text: "Add a highlight or bookmark while reading — it will wander here as a spirit.", kind: "Marginalia" });
  }
  return ghosts.slice(0, 6).map((g, i) => {
    const ang = (i / Math.max(1, Math.min(6, ghosts.length))) * Math.PI * 2;
    const rad = 110 + (i % 3) * 70;
    return { ...g, x: center.x + Math.cos(ang) * rad, y: center.y + Math.sin(ang) * rad, phase: i * 1.4 };
  });
}

const RUMOUR_DRIFT = {
  race_loss: [
    "heard you finished behind the pack at Fox Derby.",
    "says you tripped over a turnip halfway through the Fox Derby.",
    "swears you were run over by a rogue goose during the race!",
  ],
  tax_dodge: [
    "spotted you sprinting past the Tanuki Tax Spirit.",
    "claims you hid your coin purse inside a hollow pumpkin.",
    "insists you bribed the Tanuki Collector with three turnips!",
  ],
  rare_catch: [
    "heard you pulled a shimmering trophy fish from the water.",
    "says the fish was twice as tall as your fox's ears.",
    "swears you wrestled a sea-serpent bare-pawed at Saltwick!",
  ],
};

export function addRumour(s, kind, customBase) {
  s.rumours ||= [];
  if (s.rumours.some((r) => r.kind === kind && !r.confronted && r.day === today())) return;
  const stages = RUMOUR_DRIFT[kind] || [customBase || "heard a wild story about you.", "claims it happened in the middle of a storm.", "swears a goose was somehow involved!"];
  s.rumours.unshift({
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    kind,
    stages,
    stage: 0,
    day: today(),
    createdAt: Date.now(),
    confronted: false,
    legend: false,
  });
  if (s.rumours.length > 8) s.rumours.length = 8;
}

export function activeRumour(s) {
  const list = s.rumours || [];
  for (const r of list) {
    if (r.confronted) continue;
    const days = Math.max(0, Math.floor((Date.now() - (r.createdAt || Date.now())) / 86400000));
    const idx = Math.min(r.stages.length - 1, Math.max(r.stage || 0, days));
    r.stage = idx;
    return r;
  }
  return null;
}

const FINDERS = [
  ["a kid in Saltwick", "Saltwick"],
  ["Nana Sunbright", "Moonwake Bay"],
  ["a sleepy owl in Hollow Pine", "Hollow Pine"],
  ["the Night Market lantern-keeper", "Night Market"],
  ["an archivist at the Great Shelf", "Foxhold"],
];

export function recordLostProperty(s, kind, name, detail = "") {
  if (!s) return;
  s.lostProperty ||= [];
  const [finder, town] = FINDERS[s.lostProperty.length % FINDERS.length];
  s.lostProperty.unshift({
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
    kind,
    name,
    detail: detail || (kind === "critter" ? `Adopted by ${finder} in ${town}, and it's thriving!` : `Found near ${town} by ${finder}.`),
    finder,
    town,
    at: Date.now(),
    claimed: false,
  });
  if (s.lostProperty.length > 20) s.lostProperty.length = 20;
}

export const TAX_UPGRADES = [
  { id: "lanterns", name: "New Foxhold Street Lanterns", desc: "Extra warm streetlamps along the plaza" },
  { id: "bridge", name: "Saltwick Timber Bridge Repaired", desc: "Fresh oak planks & brass railings" },
  { id: "festival", name: "Midnight Lantern Festival Funded", desc: "Extra foxfire bursts & town banners" },
  { id: "fountain", name: "Gilded Tanuki & Fox Fountain", desc: "A gleaming centerpiece in Foxhold Square" },
];

export function taxDue(s) {
  if ((s.mon || 0) < 500) return 0;
  return Math.min(350, Math.max(75, Math.round(s.mon * 0.18)));
}
