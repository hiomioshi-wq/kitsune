// Moonwake Bay: Moonwake Orchard (farming), Wonder Wheel & Streak, and Pearl Reef & Aquarium.
import { SPECIES, addPet, activePet, CRATES, rollCrate } from "./baycore.js";

export const SEEDS = [
  ["sunberry", "Sunberry", "🍓", 25, 22, 65, 18],
  ["melon", "Coral Melon", "🍈", 60, 35, 150, 35],
  ["starfruit", "Starfruit", "⭐", 130, 50, 320, 70],
  ["peach", "Crystal Peach", "🍑", 240, 70, 580, 130],
  ["moonflower", "Moonflower", "🪷", 450, 95, 1100, 240],
];

export const WHEEL_PRIZES = [
  { id: "shells_sm", label: "150 Shells", icon: "🐚", w: 30 },
  { id: "shells_lg", label: "500 Shells", icon: "💰", w: 14 },
  { id: "diamonds", label: "35 Diamonds", icon: "💎", w: 20 },
  { id: "crate", label: "Moon Crate Pet", icon: "📦", w: 14 },
  { id: "xp", label: "+120 Critter XP", icon: "✨", w: 16 },
  { id: "jackpot", label: "1,500 Shells + Rare Pet!", icon: "👑", w: 6 },
];

export const REEF_FINDS = [
  ["pearl", "Sea Pearl", "🫧", 45, .42],
  ["conch", "Royal Conch", "🐚", 85, .26],
  ["clam", "Starlight Clam", "🦪", 140, .18],
  ["amber", "Tide Amber", "🟠", 240, .10],
  ["goldpearl", "Golden Pearl", "🌟", 480, .04],
];

export function ensureOrchard(b) {
  const o = (b.ov2 ||= {
    plots: Array.from({ length: 6 }, () => null),
    crops: {},
    harvested: 0,
    wheelDay: "",
    spins: 0,
    streak: 0,
    lastStreakDay: "",
    pots: Array.from({ length: 4 }, () => null),
    aquarium: {},
    pearlsSold: 0,
  });
  if (!Array.isArray(o.plots) || o.plots.length < 6) o.plots = Array.from({ length: 6 }, (_, i) => o.plots?.[i] || null);
  if (!Array.isArray(o.pots) || o.pots.length < 4) o.pots = Array.from({ length: 4 }, (_, i) => o.pots?.[i] || null);
  o.crops ||= {};
  o.aquarium ||= {};
  const d = new Date().toDateString();
  if (o.wheelDay !== d) {
    o.wheelDay = d;
    o.freeSpin = 1;
  }
  return o;
}

function rollReef(r = Math.random) {
  let q = r();
  for (const f of REEF_FINDS) {
    q -= f[4];
    if (q <= 0) return f;
  }
  return REEF_FINDS[0];
}

export function orchardPage(ctx, tab = "plots") {
  const { b, page, esc, ping, save, pay, checkGoals, say } = ctx;
  const o = ensureOrchard(b);
  const now = Date.now();
  const tabs = `<div class="dy-tabs"><button type="button" class="${tab === "plots" ? "on" : ""}" data-t="plots">Garden Plots</button><button type="button" class="${tab === "basket" ? "on" : ""}" data-t="basket">Harvest Basket</button></div>`;

  if (tab === "basket") {
    const html = `${tabs}<div class="by-jobtop"><strong>Total Harvested: ${o.harvested}</strong><span>${b.shells} shells</span></div><p class="muted">Sell harvested crops for shells or feed them to your active critter for huge XP!</p><div class="by-list">${SEEDS.map(([id, name, ic, , , sell, xp]) => {
      const cnt = o.crops[id] || 0;
      return `<div><i>${ic}</i><span><strong>${name} (×${cnt})</strong><small>Sell ${sell} shells · Feed +${xp} XP</small></span><button class="btn" type="button" data-sell="${id}" ${cnt ? "" : "disabled"}>Sell 1</button><button class="btn btn-accent" type="button" data-feed="${id}" ${cnt && activePet(b) ? "" : "disabled"}>Feed Critter</button></div>`;
    }).join("")}</div>`;
    page("Moonwake Orchard · Basket", html, (e) => {
      e.querySelectorAll("[data-t]").forEach((x) => (x.onclick = () => orchardPage(ctx, x.dataset.t)));
      e.querySelectorAll("[data-sell]").forEach((x) => (x.onclick = () => {
        const s = SEEDS.find((q) => q[0] === x.dataset.sell);
        if (!s || !o.crops[s[0]]) return;
        o.crops[s[0]]--;
        const got = pay(b, s[5]);
        save(); ping("choice"); say(`Sold ${s[1]} for +${got} shells!`); orchardPage(ctx, "basket");
      }));
      e.querySelectorAll("[data-feed]").forEach((x) => (x.onclick = () => {
        const s = SEEDS.find((q) => q[0] === x.dataset.feed), pet = activePet(b);
        if (!s || !o.crops[s[0]] || !pet) return;
        o.crops[s[0]]--;
        pet.xp = (pet.xp || 0) + s[6];
        save(); ping("done"); checkGoals(); say(`${pet.name || "Your critter"} loved the ${s[1]}! +${s[6]} XP`); orchardPage(ctx, "basket");
      }));
    });
    return;
  }

  let selSeed = SEEDS[0][0];
  const html = `${tabs}<div class="by-jobtop"><strong>Select Seed to Plant</strong><span>Harvested: ${o.harvested}</span></div><div class="by-flav" id="or-seeds">${SEEDS.map(([id, name, ic, cost, sec]) => `<button type="button" data-s="${id}" style="background:rgba(120,200,90,.22)">${ic} ${name} (${cost}s · ${sec}s)</button>`).join("")}</div><div class="by-crates" id="or-plots"></div>`;
  page("Moonwake Orchard", html, (e) => {
    e.querySelectorAll("[data-t]").forEach((x) => (x.onclick = () => orchardPage(ctx, x.dataset.t)));
    const plotsEl = e.querySelector("#or-plots");
    const paint = () => {
      const t = Date.now();
      plotsEl.innerHTML = o.plots.map((pl, i) => {
        if (!pl) return `<button type="button" class="by-crate" data-pl="${i}"><span>🌱</span><strong>Empty Plot #${i + 1}</strong><small>Tap to plant ${SEEDS.find((q) => q[0] === selSeed)[1]}</small></button>`;
        const def = SEEDS.find((q) => q[0] === pl.id) || SEEDS[0];
        const left = Math.max(0, Math.ceil((pl.ready - t) / 1000));
        return `<button type="button" class="by-crate" data-pl="${i}" style="border-color:${left === 0 ? "#67d6a4" : "#888"}"><span>${left === 0 ? def[2] : "🪴"}</span><strong>${esc(def[1])}</strong><small>${left === 0 ? "Ready! Tap to harvest" : `${left}s · Tap to water (-6s)`}</small></button>`;
      }).join("");
      e.querySelectorAll("#or-seeds [data-s]").forEach((btn) => {
        btn.style.outline = btn.dataset.s === selSeed ? "2px solid #67d6a4" : "";
      });
    };
    e.querySelectorAll("#or-seeds [data-s]").forEach((x) => (x.onclick = () => { selSeed = x.dataset.s; ping("blip"); paint(); }));
    plotsEl.onclick = (ev) => {
      const btn = ev.target.closest("[data-pl]");
      if (!btn) return;
      const i = +btn.dataset.pl, pl = o.plots[i], t = Date.now();
      if (!pl) {
        const def = SEEDS.find((q) => q[0] === selSeed);
        if (b.shells < def[3]) return say(`Need ${def[3]} shells for ${def[1]} seeds.`);
        b.shells -= def[3];
        o.plots[i] = { id: def[0], ready: t + def[4] * 1000 };
        save(); ping("choice"); paint();
      } else if (t >= pl.ready) {
        const def = SEEDS.find((q) => q[0] === pl.id) || SEEDS[0];
        o.crops[def[0]] = (o.crops[def[0]] || 0) + 1;
        o.harvested++;
        o.plots[i] = null;
        save(); ping("done"); checkGoals(); say(`Harvested ${def[1]}!`); paint();
      } else {
        pl.ready -= 6000;
        save(); ping("blip"); paint();
      }
    };
    paint();
    const timer = setInterval(paint, 500);
    return () => clearInterval(timer);
  });
}

export function wheelPage(ctx) {
  const { b, page, esc, ping, save, pay, checkGoals, say } = ctx;
  const o = ensureOrchard(b);
  const today = new Date().toDateString();
  const canStreak = o.lastStreakDay !== today;

  const spinWheel = (free) => {
    if (free) {
      if (!o.freeSpin) return;
      o.freeSpin = 0;
    } else {
      if (b.shells < 200) return say("Need 200 shells for an extra spin.");
      b.shells -= 200;
    }
    o.spins++;
    const sum = WHEEL_PRIZES.reduce((a, p) => a + p.w, 0);
    let r = Math.random() * sum, pick = WHEEL_PRIZES[0];
    for (const p of WHEEL_PRIZES) { r -= p.w; if (r <= 0) { pick = p; break; } }
    let msg = "";
    if (pick.id === "shells_sm") msg = `+${pay(b, 150)} shells!`;
    else if (pick.id === "shells_lg") msg = `+${pay(b, 500)} shells!`;
    else if (pick.id === "diamonds") { b.yard ||= { diamonds: 0 }; b.yard.diamonds = (b.yard.diamonds || 0) + 35; msg = "+35 Diamonds!"; }
    else if (pick.id === "crate") { const pet = addPet(b, rollCrate(CRATES[2])); msg = `Won a ${pet.sp} critter!`; }
    else if (pick.id === "xp") { const pet = activePet(b); if (pet) { pet.xp = (pet.xp || 0) + 120; msg = "+120 XP for your active critter!"; } else msg = `+${pay(b, 180)} shells!`; }
    else if (pick.id === "jackpot") {
      const got = pay(b, 1500);
      const rare = SPECIES.filter((s) => s.r >= 3);
      addPet(b, rare[Math.floor(Math.random() * rare.length)].id);
      msg = `JACKPOT! +${got} shells & a Rare+ Critter!`;
    }
    save(); ping("done"); checkGoals(); say(`Wonder Wheel: ${pick.label} — ${msg}`); wheelPage(ctx);
  };

  const html = `<div class="by-jobtop"><strong>Total Spins: ${o.spins}</strong><span>Streak: Day ${o.streak}</span></div><div class="by-crates">${WHEEL_PRIZES.map((p) => `<div class="by-crate"><span>${p.icon}</span><strong>${esc(p.label)}</strong><small>${p.w}% odds</small></div>`).join("")}</div><div class="by-row" style="margin-top:12px"><button class="btn btn-accent" type="button" id="wh-free" ${o.freeSpin ? "" : "disabled"}>${o.freeSpin ? "Free Daily Spin!" : "Daily Spin Used"}</button><button class="btn" type="button" id="wh-buy" ${b.shells >= 200 ? "" : "disabled"}>Extra Spin (200 shells)</button><button class="btn btn-accent" type="button" id="wh-str" ${canStreak ? "" : "disabled"}>${canStreak ? `Claim Day ${o.streak + 1} Streak` : "Streak Claimed Today"}</button></div>`;
  page("Wonder Wheel & Streak", html, (e) => {
    e.querySelector("#wh-free").onclick = () => spinWheel(true);
    e.querySelector("#wh-buy").onclick = () => spinWheel(false);
    e.querySelector("#wh-str").onclick = () => {
      if (!canStreak) return;
      o.lastStreakDay = today;
      o.streak++;
      const bonus = 100 + o.streak * 60;
      const got = pay(b, bonus);
      if (b.yard) b.yard.diamonds = (b.yard.diamonds || 0) + 15 + o.streak * 5;
      save(); ping("done"); checkGoals(); say(`Day ${o.streak} Streak! +${got} shells & Diamonds!`); wheelPage(ctx);
    };
  });
}

export function reefPage(ctx, tab = "pots") {
  const { b, page, esc, ping, save, pay, checkGoals, say } = ctx;
  const o = ensureOrchard(b);
  const tabs = `<div class="dy-tabs"><button type="button" class="${tab === "pots" ? "on" : ""}" data-t="pots">Pearl Pots</button><button type="button" class="${tab === "tank" ? "on" : ""}" data-t="tank">Bay Aquarium (${Object.keys(o.aquarium).length}/${REEF_FINDS.length})</button></div>`;

  if (tab === "tank") {
    const tankCount = Object.keys(o.aquarium).length;
    const html = `${tabs}<div class="by-jobtop"><strong>Aquarium Exhibits: ${tankCount}/${REEF_FINDS.length}</strong><span>Pearls Sold: ${o.pearlsSold}</span></div><p class="muted">Donate one of each rare reef find to complete the Bay Aquarium!</p><div class="by-list">${REEF_FINDS.map(([id, name, ic, val]) => `<div><i>${ic}</i><span><strong>${name}</strong><small>Value: ${val} shells</small></span><em>${o.aquarium[id] ? "On Display ✓" : "Not Found"}</em></div>`).join("")}</div>`;
    page("Bay Aquarium", html, (e) => e.querySelectorAll("[data-t]").forEach((x) => (x.onclick = () => reefPage(ctx, x.dataset.t))));
    return;
  }

  const html = `${tabs}<div class="by-jobtop"><strong>Pearl Pots (30s haul)</strong><span>${b.shells} shells</span></div><div class="by-crates" id="rf-pots"></div>`;
  page("Pearl Reef", html, (e) => {
    e.querySelectorAll("[data-t]").forEach((x) => (x.onclick = () => reefPage(ctx, x.dataset.t)));
    const potsEl = e.querySelector("#rf-pots");
    const paint = () => {
      const t = Date.now();
      potsEl.innerHTML = o.pots.map((pt, i) => {
        if (!pt) return `<button type="button" class="by-crate" data-pot="${i}"><span>🪤</span><strong>Empty Pot #${i + 1}</strong><small>Drop bait (30 shells)</small></button>`;
        const left = Math.max(0, Math.ceil((pt.ready - t) / 1000));
        return `<button type="button" class="by-crate" data-pot="${i}" style="border-color:${left === 0 ? "#38b8c8" : "#888"}"><span>${left === 0 ? "🦪" : "🫧"}</span><strong>Pot #${i + 1}</strong><small>${left === 0 ? "Haul Ready! Tap to pull" : `${left}s remaining`}</small></button>`;
      }).join("");
    };
    potsEl.onclick = (ev) => {
      const btn = ev.target.closest("[data-pot]");
      if (!btn) return;
      const i = +btn.dataset.pot, pt = o.pots[i], t = Date.now();
      if (!pt) {
        if (b.shells < 30) return say("Need 30 shells for pot bait.");
        b.shells -= 30;
        o.pots[i] = { ready: t + 30000 };
        save(); ping("choice"); paint();
      } else if (t >= pt.ready) {
        const find = rollReef();
        o.pots[i] = null;
        o.pearlsSold++;
        if (!o.aquarium[find[0]]) {
          o.aquarium[find[0]] = 1;
          save(); ping("done"); checkGoals(); say(`New Aquarium Exhibit: ${find[1]}!`);
        } else {
          const got = pay(b, find[3]);
          save(); ping("done"); checkGoals(); say(`Pulled ${find[1]}! Sold for +${got} shells.`);
        }
        paint();
      }
    };
    paint();
    const timer = setInterval(paint, 500);
    return () => clearInterval(timer);
  });
}
