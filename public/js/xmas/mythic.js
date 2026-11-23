// Mythic Pets & App-Wide Buffs System: 16 Mythic companions, 3-slot Blessing Altar, Star Ascension, and Summoning.
import { $, $$, esc, toast } from "../util.js";
import { setCrumbs } from "../main.js";

const STORE_KEY = "kitsune.mythic.v1";

export const MYTHIC_RARITY = {
  id: "m",
  label: "Mythic",
  color: "#ff4fd8",
  weight: 15,
};

// id, name, title, element, buffKey, buffLabel, baseVal, perStar, color, accent, lore
export const MYTHIC_PETS = [
  [
    "astral_kitsune",
    "Inari of the Ninth Bell",
    "Sovereign of Lanterns",
    "Starlight",
    "mon_mult",
    "+{v}% Mon earned across Kitsune World",
    20,
    8,
    "#ffe8a3",
    "#ff4fd8",
    "Born when all nine lanterns were lit at once; its footsteps leave warm gold in the snow.",
  ],
  [
    "eclipse_wyrm",
    "Ouroboros of Brask",
    "Keeper of Lost Seconds",
    "Clockwork",
    "speed_mult",
    "+{v}% Movement & Derby speed",
    12,
    4,
    "#2a214a",
    "#ffd84d",
    "Coils around the Great Clock's pendulum, bending every three-second delay in your favour.",
  ],
  [
    "celestial_crane",
    "Origami Seraph",
    "Messenger of Paper",
    "Paper",
    "xp_mult",
    "+{v}% Pet & RPG XP gain",
    25,
    10,
    "#f7f4eb",
    "#7fd0ff",
    "Folded from the very first letter Kitsu ever delivered; never forgets a reader's name.",
  ],
  [
    "tide_leviathan",
    "Moonwake Sovereign",
    "Deepwater Oracle",
    "Tide",
    "fish_luck",
    "+{v}% Fishing & Rare Catch luck",
    25,
    10,
    "#1c4c7a",
    "#5cf0c0",
    "Swims beneath Moonwake Bay's pier, nudging Legendary fish toward patient lines.",
  ],
  [
    "hearth_phoenix",
    "Solstice Phoenix",
    "Ember of Hollow Pine",
    "Flame",
    "stamina_mult",
    "+{v}% Max Stamina & Energy regen",
    20,
    8,
    "#ff7a3a",
    "#fff27a",
    "Nests in the rafters of Foxhold, keeping winter chill off every traveller.",
  ],
  [
    "prism_stag",
    "Aurelia the Prism Stag",
    "Warden of the High Post",
    "Prism",
    "forage_mult",
    "+{v}% Forage & Chest loot bonus",
    20,
    8,
    "#bfe6f7",
    "#b58cff",
    "Each tine of its antlers refracts aurora light into hidden treasure.",
  ],
  [
    "void_moth",
    "Velvet Archive Moth",
    "Reader in the Dark",
    "Ink",
    "read_bonus",
    "+{v}% Reading Bank & Goal progress",
    25,
    10,
    "#1e1830",
    "#e88fb8",
    "Sleeps between the pages of unread books and wakes when you turn a chapter.",
  ],
  [
    "emerald_sphinx",
    "Ozma's Emerald Sphinx",
    "Riddler of the Palace",
    "Emerald",
    "shop_disc",
    "{v}% Shop & Upgrade discount",
    10,
    3,
    "#259a62",
    "#ffd27a",
    "Knows the true price of everything in the Emerald City and shares it with friends.",
  ],
  [
    "sakura_kirin",
    "Springtide Kirin",
    "Blossom Herald",
    "Petal",
    "crop_mult",
    "+{v}% Farm Crop & Cooking value",
    25,
    10,
    "#f7a8c6",
    "#fff4f8",
    "Where its hooves touch frost, cherry petals bloom before sunrise.",
  ],
  [
    "frost_valkyrie",
    "Valkyrie of the Glacier",
    "Shield of Sector 0",
    "Frost",
    "arena_pwr",
    "+{v}% Arena & Boss fight power",
    18,
    7,
    "#cfe8ff",
    "#4a7ab8",
    "Forged from six-hundred-year-old ice that never melts.",
  ],
  [
    "star_whale",
    "Calypso's Sky Whale",
    "Singer of the Ridge",
    "Aether",
    "shell_mult",
    "+{v}% Shells earned at Moonwake Bay",
    20,
    8,
    "#2a3b7a",
    "#9fe0ff",
    "Its low song echoes across the clouds above the northern lighthouse.",
  ],
  [
    "iron_automaton",
    "Gearsong Fox",
    "Masterwork Companion",
    "Brass",
    "mine_luck",
    "+{v}% Mining & Digging treasure luck",
    22,
    8,
    "#c79a2e",
    "#35d68a",
    "Built by the Clockmaker's apprentice to sniff out deep-earth veins.",
  ],
  [
    "dream_tapir",
    "Baku of the Sanctuary",
    "Eater of Nightmares",
    "Dream",
    "critter_luck",
    "+{v}% Rare Critter spawn & catch rate",
    20,
    8,
    "#60379a",
    "#ffd84d",
    "Keeps bad dreams away from Foxhold and leaves starlight dust behind.",
  ],
  [
    "card_archon",
    "The Tenth Suit",
    "Patron of Lantern Cards",
    "Arcana",
    "card_pwr",
    "+{v}% Card Duel & Trial rewards",
    20,
    8,
    "#c8452a",
    "#ffe8b0",
    "A living card that stepped off the felt table and chose its own deck.",
  ],
  [
    "echo_lynx",
    "Echoes of the Cavern",
    "Listener in Stone",
    "Echo",
    "bounty_mult",
    "+{v}% Bounty & Quest payout",
    20,
    8,
    "#7b8290",
    "#b58cff",
    "Hears footsteps three valleys away and guides hunters straight to the mark.",
  ],
  [
    "sovereign_dawn",
    "Dawn-Crowned Kitsune",
    "The First & Last",
    "Dawn",
    "all_mult",
    "+{v}% All-around luck, rewards & speed",
    10,
    5,
    "#ffffff",
    "#ffd84d",
    "The rarest Mythic companion — its nine tails hold the light of every sunrise.",
  ],
];

export function loadMythicState() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORE_KEY) || "{}");
    return {
      owned: { astral_kitsune: { stars: 1, unlockedAt: Date.now() }, ...(raw.owned || {}) },
      equipped: Array.isArray(raw.equipped) ? raw.equipped.slice(0, 3) : ["astral_kitsune"],
      shards: typeof raw.shards === "number" ? raw.shards : 120,
      summons: typeof raw.summons === "number" ? raw.summons : 0,
    };
  } catch {
    return {
      owned: { astral_kitsune: { stars: 1, unlockedAt: Date.now() } },
      equipped: ["astral_kitsune"],
      shards: 120,
      summons: 0,
    };
  }
}

export function saveMythicState(st) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(st)); } catch {}
}

export function petBuffValue(pet, stars = 1) {
  return pet[6] + (Math.max(1, stars) - 1) * pet[7];
}

export function getActiveMythicBuffs() {
  const st = loadMythicState();
  const totals = {};
  for (const id of st.equipped) {
    const pet = MYTHIC_PETS.find((p) => p[0] === id);
    const rec = st.owned[id];
    if (!pet || !rec) continue;
    const val = petBuffValue(pet, rec.stars || 1);
    totals[pet[4]] = (totals[pet[4]] || 0) + val;
  }
  return totals;
}

export function getMythicBuff(key) {
  const buffs = getActiveMythicBuffs();
  return (buffs[key] || 0) + (buffs.all_mult || 0);
}

export function mythicMultiplier(key) {
  return 1 + getMythicBuff(key) / 100;
}

function mythicSvg(pet) {
  const [, name, , , , , , , body, accent] = pet;
  return `<svg viewBox="0 0 80 80" width="64" height="64" aria-hidden="true">
    <defs>
      <radialGradient id="mg-${esc(pet[0])}" cx="50%" cy="45%" r="55%">
        <stop offset="0%" stop-color="${esc(accent)}" stop-opacity="0.45"/>
        <stop offset="100%" stop-color="${esc(body)}" stop-opacity="0.1"/>
      </radialGradient>
    </defs>
    <circle cx="40" cy="40" r="36" fill="url(#mg-${esc(pet[0])})" stroke="${esc(accent)}" stroke-width="2"/>
    <polygon points="22,30 28,12 36,26" fill="${esc(body)}" stroke="${esc(accent)}" stroke-width="1.5"/>
    <polygon points="58,30 52,12 44,26" fill="${esc(body)}" stroke="${esc(accent)}" stroke-width="1.5"/>
    <circle cx="40" cy="44" r="18" fill="${esc(body)}" stroke="${esc(accent)}" stroke-width="2"/>
    <circle cx="34" cy="42" r="2.5" fill="#181828"/>
    <circle cx="46" cy="42" r="2.5" fill="#181828"/>
    <path d="M36 49 Q40 53 44 49" fill="none" stroke="#181828" stroke-width="2" stroke-linecap="round"/>
    <circle cx="40" cy="18" r="3" fill="${esc(accent)}"/>
    <title>${esc(name)}</title>
  </svg>`;
}

export async function render(view) {
  setCrumbs([["Mythic Sanctuary", "mythic"]]);
  const st = loadMythicState();
  let filter = "all";

  const paint = () => {
    const buffs = getActiveMythicBuffs();
    const buffEntries = Object.entries(buffs);
    const list = MYTHIC_PETS.filter((p) => {
      if (filter === "owned") return !!st.owned[p[0]];
      if (filter === "equipped") return st.equipped.includes(p[0]);
      return true;
    });

    view.innerHTML = `
      <div class="page-head">
        <div>
          <p class="eyebrow" style="color:${MYTHIC_RARITY.color}">Mythic System</p>
          <h1 class="h1">Mythic Pets &amp; App-Wide Buffs</h1>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <a class="btn" href="#xmas">Winterfest</a>
          <a class="btn" href="#world">Kitsune World</a>
        </div>
      </div>

      <div class="settings">
        <div class="panel">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">
            <div>
              <h3 class="h3" style="margin:0">Blessing Altar (${st.equipped.length}/3 Active)</h3>
              <p class="muted" style="margin:4px 0 0">Equipped Mythic Pets grant passive buffs across Kitsune World, Moonwake Bay, and your Reading Goals.</p>
            </div>
            <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
              <span class="pill" style="border-color:${MYTHIC_RARITY.color}">Starlight Shards: <strong id="my-shards">${st.shards}</strong></span>
              <button type="button" class="btn btn-accent" id="my-summon" ${st.shards < 40 ? "disabled" : ""}>Summon Mythic (40 Shards)</button>
              <button type="button" class="btn" id="my-claim">+25 Daily Shards</button>
            </div>
          </div>

          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px;margin-top:14px">
            ${[0, 1, 2].map((slot) => {
              const id = st.equipped[slot];
              const pet = MYTHIC_PETS.find((p) => p[0] === id);
              const rec = id ? st.owned[id] : null;
              if (!pet || !rec) {
                return `<div style="padding:14px;border:1px dashed rgba(255,255,255,.2);border-radius:12px;text-align:center">
                  <strong class="muted">Empty Altar Slot ${slot + 1}</strong>
                  <p class="muted" style="margin:6px 0 0;font-size:13px">Equip any owned Mythic Pet below.</p>
                </div>`;
              }
              const val = petBuffValue(pet, rec.stars);
              return `<div style="padding:12px;border:1px solid ${MYTHIC_RARITY.color};border-radius:12px;display:flex;gap:10px;align-items:center">
                ${mythicSvg(pet)}
                <div style="min-width:0;flex:1">
                  <strong>${esc(pet[1])}</strong> <small style="color:#ffd84d">${"★".repeat(rec.stars)}</small>
                  <div class="muted" style="font-size:12px">${esc(pet[5].replace("{v}", val))}</div>
                  <button type="button" class="btn btn-sm" data-unequip="${esc(pet[0])}" style="margin-top:6px">Unequip</button>
                </div>
              </div>`;
            }).join("")}
          </div>

          <div style="margin-top:14px;padding-top:12px;border-top:1px solid rgba(255,255,255,.1)">
            <strong>Total Active App-Wide Buffs:</strong>
            ${buffEntries.length
              ? buffEntries.map(([k, v]) => `<span class="pill" style="margin-left:6px">${esc(k)}: +${v}%</span>`).join("")
              : `<span class="muted">None active — equip a Mythic Pet below.</span>`}
          </div>
        </div>

        <div class="panel">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:12px">
            <h3 class="h3" style="margin:0">Mythic Compendium (${Object.keys(st.owned).length}/${MYTHIC_PETS.length} Unlocked)</h3>
            <div class="chips">
              <button type="button" class="chip${filter === "all" ? " on" : ""}" data-mf="all">All (${MYTHIC_PETS.length})</button>
              <button type="button" class="chip${filter === "owned" ? " on" : ""}" data-mf="owned">Owned (${Object.keys(st.owned).length})</button>
              <button type="button" class="chip${filter === "equipped" ? " on" : ""}" data-mf="equipped">Equipped (${st.equipped.length})</button>
            </div>
          </div>

          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px">
            ${list.map((pet) => {
              const [id, name, title, elem, , desc] = pet;
              const rec = st.owned[id];
              const isEq = st.equipped.includes(id);
              const stars = rec?.stars || 0;
              const val = petBuffValue(pet, stars || 1);
              const ascCost = 30 + stars * 20;
              return `<article style="padding:14px;border-radius:12px;border:1px solid ${isEq ? MYTHIC_RARITY.color : "rgba(255,255,255,.14)"};opacity:${rec ? 1 : 0.72};display:flex;flex-direction:column;gap:8px">
                <div style="display:flex;gap:10px;align-items:center">
                  ${mythicSvg(pet)}
                  <div>
                    <small style="color:${MYTHIC_RARITY.color};font-weight:700">${esc(elem)} · Mythic</small>
                    <h4 style="margin:2px 0">${esc(name)}</h4>
                    <small class="muted">${esc(title)}</small>
                  </div>
                </div>
                <p style="margin:0;font-size:13px">${esc(pet[10])}</p>
                <div class="pill" style="align-self:flex-start">${esc(desc.replace("{v}", val))}</div>
                <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:auto">
                  ${rec
                    ? `
                      <button type="button" class="btn btn-sm ${isEq ? "" : "btn-accent"}" data-eq="${esc(id)}">${isEq ? "Unequip" : "Equip"}</button>
                      <button type="button" class="btn btn-sm" data-asc="${esc(id)}" ${stars >= 5 || st.shards < ascCost ? "disabled" : ""}>${stars >= 5 ? "Max 5★" : `Ascend (${ascCost} Shards)`}</button>
                    `
                    : `<span class="muted" style="font-size:12px">Locked — Summon above to unlock</span>`}
                </div>
              </article>`;
            }).join("")}
          </div>
        </div>
      </div>
    `;

    $$("[data-mf]", view).forEach((b) => {
      b.onclick = () => { filter = b.dataset.mf; paint(); };
    });

    $("#my-claim", view).onclick = () => {
      st.shards += 25;
      saveMythicState(st);
      toast("+25 Starlight Shards!");
      paint();
    };

    $("#my-summon", view).onclick = () => {
      if (st.shards < 40) return;
      st.shards -= 40;
      st.summons++;
      const locked = MYTHIC_PETS.filter((p) => !st.owned[p[0]]);
      const pool = locked.length ? locked : MYTHIC_PETS;
      const pick = pool[Math.floor(Math.random() * pool.length)];
      if (!st.owned[pick[0]]) {
        st.owned[pick[0]] = { stars: 1, unlockedAt: Date.now() };
        toast(`Summoned NEW Mythic: ${pick[1]}!`);
      } else {
        st.shards += 15;
        toast(`Duplicate ${pick[1]} converted to +15 Shards!`);
      }
      saveMythicState(st);
      paint();
    };

    $$("[data-eq]", view).forEach((b) => {
      b.onclick = () => {
        const id = b.dataset.eq;
        if (st.equipped.includes(id)) {
          st.equipped = st.equipped.filter((x) => x !== id);
        } else {
          if (st.equipped.length >= 3) st.equipped.shift();
          st.equipped.push(id);
        }
        saveMythicState(st);
        paint();
      };
    });

    $$("[data-unequip]", view).forEach((b) => {
      b.onclick = () => {
        st.equipped = st.equipped.filter((x) => x !== b.dataset.unequip);
        saveMythicState(st);
        paint();
      };
    });

    $$("[data-asc]", view).forEach((b) => {
      b.onclick = () => {
        const id = b.dataset.asc;
        const rec = st.owned[id];
        if (!rec || rec.stars >= 5) return;
        const cost = 30 + rec.stars * 20;
        if (st.shards < cost) return;
        st.shards -= cost;
        rec.stars++;
        saveMythicState(st);
        toast(`Ascended to ${rec.stars}★!`);
        paint();
      };
    });
  };

  paint();
}
