// Hollow Pine Overworld Expansion: Wishing Well, Crystal Grotto, Starlight Spin Pavilion, and Companion Orchard Terrace.
import { dayKey } from "./lifecore.js";

const GEMS = [
  ["quartz", "Mountain Quartz", "🤍", 12, .45],
  ["topaz", "Sun Topaz", "💛", 28, .28],
  ["opal", "Mist Opal", "🩷", 55, .17],
  ["sapphire", "Star Sapphire", "💙", 110, .10],
];

const PICKS = [
  ["iron", "Iron Pick", 0, 1],
  ["silver", "Silver Pick", 160, 1.4],
  ["prism", "Prism Pick", 480, 1.9],
];

const SEEDS = [
  ["sunberry", "Sunberry", "🍓", 18, 20, 48, 15],
  ["moonmelon", "Moonmelon", "🍈", 45, 35, 115, 35],
  ["starfruit", "Starfruit", "⭐", 95, 50, 240, 75],
];

const WHEEL = [
  { id: "mon_s", label: "80 Mon", icon: "🪙", w: 32 },
  { id: "mon_l", label: "260 Mon", icon: "💰", w: 14 },
  { id: "ore", label: "Silver & Gold Ore", icon: "⛏️", w: 22 },
  { id: "gem", label: "Mist Opal", icon: "🩷", w: 16 },
  { id: "luck", label: "2× Lucky Ripples", icon: "🍀", w: 12 },
  { id: "jackpot", label: "600 Mon Jackpot!", icon: "👑", w: 4 },
];

export function createHaven(o) {
  const { s, panel, toast, ping, save, hud, esc, st, ORES } = o;
  const hv = (st.haven ||= {
    pick: 0,
    gems: {},
    wellDay: "",
    wishes: 0,
    blessed: 0,
    wheelDay: "",
    freeSpin: 1,
    spins: 0,
    plots: [null, null, null, null],
    crops: {},
    compXp: 0,
    compLv: 1,
    exhibits: {},
    pots: [null, null, null],
    pearls: 0,
    baked: 0,
    streakDay: "",
    streak: 0,
    bounties: {},
    stars: {},
    spaDay: "",
    spaUsed: 0,
    curios: 0,
    festShows: 0,
    lightDay: "",
    lightLit: 0,
    picnics: 0,
    tonicUntil: 0,
    divDay: "",
    carved: 0,
    dives: 0,
    campDay: "",
    rewards: {},
    mistDay: "",
    bellDay: "",
    jadeDay: "",
    sunDay: "",
    cinderDay: "",
    treatyRead: 0,
    sunkDay: "",
    chimeDay: "",
  });
  hv.gems ||= {};
  hv.crops ||= {};
  hv.exhibits ||= {};
  hv.bounties ||= {};
  hv.stars ||= {};
  if (!Array.isArray(hv.plots) || hv.plots.length < 4) hv.plots = [null, null, null, null];
  if (!Array.isArray(hv.pots) || hv.pots.length < 3) hv.pots = [null, null, null];

  const syncDay = () => {
    const d = dayKey();
    if (hv.wellDay !== d) { hv.wellDay = d; hv.wishes = 0; }
    if (hv.wheelDay !== d) { hv.wheelDay = d; hv.freeSpin = 1; }
    if (hv.spaDay !== d) { hv.spaDay = d; hv.spaUsed = 0; }
    if (hv.lightDay !== d) { hv.lightDay = d; hv.lightLit = 0; }
  };

  const speedBonus = () => 1 + (hv.compLv - 1) * 0.025 + (hv.blessed ? 0.06 : 0) + (Date.now() < (hv.tonicUntil || 0) ? 0.15 : 0);
  const payBonus = () => 1 + Object.keys(hv.exhibits).length * 0.03;

  function well() {
    syncDay();
    const left = Math.max(0, 3 - hv.wishes);
    panel("Hollow Pine Wishing Well", `<p class="muted">Toss 25 mon into the moss-lined well (${left}/3 wishes left today). ${hv.blessed ? "Prism Blessing active (+6% walk speed)!" : "Offer a Star Sapphire for a permanent Prism Blessing."}</p><div class="se-mkt"><div class="se-good"><span><strong>Make a Wish</strong><small>25 mon · Grants mon, Lucky Ripples, or Grotto Gems</small></span><button class="btn btn-accent" type="button" id="hv-wish" ${left && s.mon >= 25 ? "" : "disabled"}>Toss 25 mon</button></div><div class="se-good"><span><strong>Prism Blessing</strong><small>1 Star Sapphire (have ${hv.gems.sapphire || 0}) · Permanent +6% Overworld speed</small></span><button class="btn btn-accent" type="button" id="hv-bless" ${!hv.blessed && (hv.gems.sapphire || 0) >= 1 ? "" : "disabled"}>${hv.blessed ? "Blessed ✓" : "Offer Sapphire"}</button></div></div>`, (e) => {
      e.querySelector("#hv-wish").onclick = () => {
        if (hv.wishes >= 3 || s.mon < 25) return;
        s.mon -= 25; hv.wishes++;
        const r = Math.random();
        if (r < 0.45) { const g = 35 + Math.floor(Math.random() * 55); s.mon += g; toast(`The well sparkles! +${g} mon`); }
        else if (r < 0.75) { s.luck = (s.luck || 0) + 2; toast("Lucky Ripple! +2 fishing luck"); }
        else { const gm = GEMS[1 + Math.floor(Math.random() * 3)]; hv.gems[gm[0]] = (hv.gems[gm[0]] || 0) + 1; toast(`The bucket hauled up a ${gm[1]}!`); }
        ping("done"); save(); hud(); well();
      };
      e.querySelector("#hv-bless").onclick = () => {
        if (hv.blessed || !(hv.gems.sapphire >= 1)) return;
        hv.gems.sapphire--; hv.blessed = 1;
        ping("done"); save(); hud(); toast("Prism Blessing granted! +6% Overworld speed."); well();
      };
    });
  }

  function grotto(tab = "mine") {
    const pk = PICKS[hv.pick] || PICKS[0];
    const tabs = `<div class="dy-tabs"><button type="button" class="${tab === "mine" ? "on" : ""}" data-t="mine">Gem Vein</button><button type="button" class="${tab === "bag" ? "on" : ""}" data-t="bag">Gem Pouch</button><button type="button" class="${tab === "shop" ? "on" : ""}" data-t="shop">Picks</button></div>`;
    if (tab === "bag") {
      panel("Crystal Grotto · Pouch", `${tabs}<div class="se-mkt">${GEMS.map(([id, name, ic, val]) => `<div class="se-good"><span><strong>${ic} ${name} (×${hv.gems[id] || 0})</strong><small>Value: ${val} mon</small></span><button class="btn btn-accent" type="button" data-sell="${id}" ${hv.gems[id] ? "" : "disabled"}>Sell All</button></div>`).join("")}</div>`, (e) => {
        e.querySelectorAll("[data-t]").forEach((x) => (x.onclick = () => grotto(x.dataset.t)));
        e.querySelectorAll("[data-sell]").forEach((x) => (x.onclick = () => {
          const gm = GEMS.find((q) => q[0] === x.dataset.sell), n = hv.gems[gm[0]] || 0;
          if (!n) return;
          hv.gems[gm[0]] = 0; s.mon += n * gm[3];
          ping("done"); save(); hud(); toast(`Sold ${n} ${gm[1]} for +${n * gm[3]} mon!`); grotto("bag");
        }));
      });
      return;
    }
    if (tab === "shop") {
      panel("Crystal Grotto · Picks", `${tabs}<div class="se-mkt">${PICKS.map(([id, name, cost, mult], i) => `<div class="se-good"><span><strong>${name} (${mult}× yield)</strong><small>${i <= hv.pick ? "Owned" : `${cost} mon`}</small></span>${i <= hv.pick ? "<em>Ready</em>" : `<button class="btn btn-accent" type="button" data-pk="${i}" ${s.mon >= cost ? "" : "disabled"}>Buy</button>`}</div>`).join("")}</div>`, (e) => {
        e.querySelectorAll("[data-t]").forEach((x) => (x.onclick = () => grotto(x.dataset.t)));
        e.querySelectorAll("[data-pk]").forEach((x) => (x.onclick = () => {
          const i = +x.dataset.pk, def = PICKS[i];
          if (i <= hv.pick || s.mon < def[2]) return;
          s.mon -= def[2]; hv.pick = i; ping("done"); save(); hud(); grotto("shop");
        }));
      });
      return;
    }
    let time = 18, hits = 0, got = {}, timer = 0;
    panel("Crystal Grotto", `${tabs}<p class="muted">Chip glowing veins before the lantern dims! Using ${pk[1]}.</p><div class="by-jobtop"><strong id="gr-t">18s</strong><strong id="gr-h">0 gems</strong></div><button class="btn btn-accent" type="button" id="gr-chip" style="width:100%;padding:18px;font-size:1.1rem">💎 Strike Gem Vein</button><p id="gr-log" class="muted" style="margin-top:8px"></p>`, (e) => {
      e.querySelectorAll("[data-t]").forEach((x) => (x.onclick = () => { clearInterval(timer); grotto(x.dataset.t); }));
      const chip = e.querySelector("#gr-chip"), log = e.querySelector("#gr-log");
      chip.onclick = () => {
        if (time <= 0) return;
        let q = Math.random(), pick = GEMS[0];
        for (const g of GEMS) { q -= g[4] + (hv.pick * 0.04); if (q <= 0) { pick = g; break; } }
        const qty = Math.random() < pk[3] - 1 ? 2 : 1;
        hv.gems[pick[0]] = (hv.gems[pick[0]] || 0) + qty;
        got[pick[1]] = (got[pick[1]] || 0) + qty;
        hits += qty;
        ping("blip");
        e.querySelector("#gr-h").textContent = `${hits} gems`;
        log.textContent = `Chipped +${qty} ${pick[2]} ${pick[1]}!`;
      };
      timer = setInterval(() => {
        time -= 0.2;
        if (time <= 0) {
          clearInterval(timer);
          chip.disabled = true;
          save(); ping("done");
          log.textContent = `Shift done! Found: ${Object.entries(got).map(([k, n]) => `${n}× ${k}`).join(", ") || "none"}.`;
          e.querySelector("#gr-t").textContent = "Done";
          return;
        }
        e.querySelector("#gr-t").textContent = `${Math.ceil(time)}s`;
      }, 200);
      return () => { clearInterval(timer); save(); };
    });
  }

  function wheel() {
    syncDay();
    const spin = (free) => {
      if (free) { if (!hv.freeSpin) return; hv.freeSpin = 0; }
      else { if (s.mon < 90) return; s.mon -= 90; }
      hv.spins++;
      const sum = WHEEL.reduce((a, p) => a + p.w, 0);
      let r = Math.random() * sum, pick = WHEEL[0];
      for (const p of WHEEL) { r -= p.w; if (r <= 0) { pick = p; break; } }
      if (pick.id === "mon_s") s.mon += 80;
      else if (pick.id === "mon_l") s.mon += 260;
      else if (pick.id === "ore") { st.ore.Silver = (st.ore.Silver || 0) + 2; st.ore.Gold = (st.ore.Gold || 0) + 1; }
      else if (pick.id === "gem") hv.gems.opal = (hv.gems.opal || 0) + 1;
      else if (pick.id === "luck") s.luck = (s.luck || 0) + 2;
      else if (pick.id === "jackpot") s.mon += 600;
      ping("done"); save(); hud(); toast(`Spin Pavilion: ${pick.label}!`); wheel();
    };
    panel("Starlight Spin Pavilion", `<p class="muted">One free spin every day! Total spins: ${hv.spins}.</p><div class="px-grid">${WHEEL.map((p) => `<div class="px-tile"><strong>${p.icon} ${esc(p.label)}</strong><small>${p.w}% odds</small></div>`).join("")}</div><div class="px-row" style="margin-top:10px"><button class="btn btn-accent" type="button" id="sp-free" ${hv.freeSpin ? "" : "disabled"}>${hv.freeSpin ? "Free Daily Spin!" : "Used Today"}</button><button class="btn" type="button" id="sp-buy" ${s.mon >= 90 ? "" : "disabled"}>Extra Spin (90 mon)</button></div>`, (e) => {
      e.querySelector("#sp-free").onclick = () => spin(true);
      e.querySelector("#sp-buy").onclick = () => spin(false);
    });
  }

  function terrace(tab = "plots") {
    const tabs = `<div class="dy-tabs"><button type="button" class="${tab === "plots" ? "on" : ""}" data-t="plots">Orchard Plots</button><button type="button" class="${tab === "bond" ? "on" : ""}" data-t="bond">Companion Bond (Lv.${hv.compLv})</button></div>`;
    if (tab === "bond") {
      const need = hv.compLv * 40;
      panel("Companion Terrace", `${tabs}<p class="muted">Feed Terrace fruit to bond with your companion. Each level adds +2.5% Overworld walking speed! (${hv.compXp}/${need} XP)</p><div class="se-mkt">${SEEDS.map(([id, name, ic, , , sell, xp]) => `<div class="se-good"><span><strong>${ic} ${name} (×${hv.crops[id] || 0})</strong><small>Sell ${sell} mon · Feed +${xp} XP</small></span><button class="btn" type="button" data-sl="${id}" ${hv.crops[id] ? "" : "disabled"}>Sell</button><button class="btn btn-accent" type="button" data-fd="${id}" ${hv.crops[id] ? "" : "disabled"}>Feed</button></div>`).join("")}</div>`, (e) => {
        e.querySelectorAll("[data-t]").forEach((x) => (x.onclick = () => terrace(x.dataset.t)));
        e.querySelectorAll("[data-sl]").forEach((x) => (x.onclick = () => {
          const def = SEEDS.find((q) => q[0] === x.dataset.sl);
          if (!def || !hv.crops[def[0]]) return;
          hv.crops[def[0]]--; s.mon += def[5]; ping("choice"); save(); hud(); terrace("bond");
        }));
        e.querySelectorAll("[data-fd]").forEach((x) => (x.onclick = () => {
          const def = SEEDS.find((q) => q[0] === x.dataset.fd);
          if (!def || !hv.crops[def[0]]) return;
          hv.crops[def[0]]--; hv.compXp += def[6];
          while (hv.compXp >= hv.compLv * 40 && hv.compLv < 10) { hv.compXp -= hv.compLv * 40; hv.compLv++; toast(`Companion Bond Level ${hv.compLv}!`); }
          ping("done"); save(); hud(); terrace("bond");
        }));
      });
      return;
    }
    let sel = SEEDS[0][0];
    panel("Orchard Terrace", `${tabs}<div class="px-row" id="tr-seeds">${SEEDS.map(([id, name, ic, cost, sec]) => `<button type="button" class="btn" data-s="${id}">${ic} ${name} (${cost}m · ${sec}s)</button>`).join("")}</div><div class="px-grid" id="tr-plots" style="margin-top:10px"></div>`, (e) => {
      e.querySelectorAll("[data-t]").forEach((x) => (x.onclick = () => terrace(x.dataset.t)));
      const plotsEl = e.querySelector("#tr-plots");
      const paint = () => {
        const t = Date.now();
        plotsEl.innerHTML = hv.plots.map((pl, i) => {
          if (!pl) return `<button type="button" class="px-tile" data-p="${i}"><strong>🌱 Empty Plot #${i + 1}</strong><small>Plant ${SEEDS.find((q) => q[0] === sel)[1]}</small></button>`;
          const def = SEEDS.find((q) => q[0] === pl.id) || SEEDS[0], left = Math.max(0, Math.ceil((pl.ready - t) / 1000));
          return `<button type="button" class="px-tile" data-p="${i}"><strong>${left === 0 ? def[2] : "🪴"} ${esc(def[1])}</strong><small>${left === 0 ? "Ready! Harvest" : `${left}s · Tap to water (-5s)`}</small></button>`;
        }).join("");
      };
      e.querySelectorAll("#tr-seeds [data-s]").forEach((x) => (x.onclick = () => { sel = x.dataset.s; ping("blip"); paint(); }));
      plotsEl.onclick = (ev) => {
        const b = ev.target.closest("[data-p]"); if (!b) return;
        const i = +b.dataset.p, pl = hv.plots[i], t = Date.now();
        if (!pl) {
          const def = SEEDS.find((q) => q[0] === sel);
          if (s.mon < def[3]) return toast(`Need ${def[3]} mon.`);
          s.mon -= def[3]; hv.plots[i] = { id: def[0], ready: t + def[4] * 1000 }; ping("choice"); save(); hud(); paint();
        } else if (t >= pl.ready) {
          const def = SEEDS.find((q) => q[0] === pl.id) || SEEDS[0];
          hv.crops[def[0]] = (hv.crops[def[0]] || 0) + 1; hv.plots[i] = null; ping("done"); save(); toast(`Harvested ${def[1]}!`); paint();
        } else { pl.ready -= 5000; save(); ping("blip"); paint(); }
      };
      paint();
      const timer = setInterval(paint, 500);
      return () => clearInterval(timer);
    });
  }

  function museum() {
    const items = [
      ...GEMS.map(([id, name, ic]) => ({ k: `gem_${id}`, name, ic, have: hv.gems[id] || 0, take: () => { hv.gems[id]--; } })),
      ...ORES.map(([name, , ,]) => ({ k: `ore_${name}`, name: `${name} Ore`, ic: "◆", have: st.ore[name] || 0, take: () => { st.ore[name]--; } })),
    ];
    const doneCount = Object.keys(hv.exhibits).length;
    panel("Relic & Mineral Hall", `<p class="muted">Donate 1 of each Gem and Ore to complete the Hall (${doneCount}/${items.length}). Each exhibit adds +3% Town Square minigame pay! (Current: +${doneCount * 3}%)</p><div class="se-mkt">${items.map((it) => `<div class="se-good"><span><strong>${it.ic} ${esc(it.name)}</strong><small>${hv.exhibits[it.k] ? "On Display ✓" : `In bag: ${it.have}`}</small></span>${hv.exhibits[it.k] ? "<em>Donated</em>" : `<button class="btn btn-accent" type="button" data-don="${it.k}" ${it.have >= 1 ? "" : "disabled"}>Donate 1</button>`}</div>`).join("")}</div>`, (e) => {
      e.querySelectorAll("[data-don]").forEach((x) => (x.onclick = () => {
        const it = items.find((q) => q.k === x.dataset.don);
        if (!it || hv.exhibits[it.k] || it.have < 1) return;
        it.take();
        hv.exhibits[it.k] = 1;
        s.mon += 45;
        ping("done"); save(); hud(); toast(`Donated ${it.name}! +45 mon & +3% pay`); museum();
      }));
    });
  }

  function tidePots() {
    const FINDS = [
      ["Sea Glass", "🩵", 34, .45],
      ["River Pearl", "🫧", 60, .30],
      ["Driftwood Relic", "🪵", 95, .17],
      ["Golden Conch", "🐚", 190, .08],
    ];
    panel("Saltwick Tide Pots", `<p class="muted">Drop baited pots off Saltwick Shore (25s) to haul coastal treasures. Total hauls: ${hv.pearls || 0}.</p><div class="px-grid" id="tp-grid"></div>`, (e) => {
      const grid = e.querySelector("#tp-grid");
      const paint = () => {
        const t = Date.now();
        grid.innerHTML = hv.pots.map((pt, i) => {
          if (!pt) return `<button type="button" class="px-tile" data-pt="${i}"><strong>🪤 Empty Pot #${i + 1}</strong><small>Bait pot (20 mon)</small></button>`;
          const left = Math.max(0, Math.ceil((pt.ready - t) / 1000));
          return `<button type="button" class="px-tile" data-pt="${i}"><strong>${left === 0 ? "🐚 Haul Ready!" : "🫧 Soaking..."}</strong><small>${left === 0 ? "Tap to pull" : `${left}s remaining`}</small></button>`;
        }).join("");
      };
      grid.onclick = (ev) => {
        const b = ev.target.closest("[data-pt]"); if (!b) return;
        const i = +b.dataset.pt, pt = hv.pots[i], t = Date.now();
        if (!pt) {
          if (s.mon < 20) return toast("Need 20 mon for bait.");
          s.mon -= 20; hv.pots[i] = { ready: t + 25000 }; ping("choice"); save(); hud(); paint();
        } else if (t >= pt.ready) {
          let r = Math.random(), pick = FINDS[0];
          for (const f of FINDS) { r -= f[3]; if (r <= 0) { pick = f; break; } }
          hv.pots[i] = null; hv.pearls = (hv.pearls || 0) + 1; s.mon += pick[2];
          ping("done"); save(); hud(); toast(`Hauled ${pick[1]} ${pick[0]}! +${pick[2]} mon`); paint();
        }
      };
      paint();
      const timer = setInterval(paint, 500);
      return () => clearInterval(timer);
    });
  }

  function treatBakery() {
    const RECIPES = [
      ["sunberry", "Sunberry Tart", "🥧", 15, 35, 1],
      ["moonmelon", "Moonmelon Roll", "🧁", 25, 80, 2],
      ["starfruit", "Starfruit Loaf", "🍞", 40, 165, 3],
    ];
    panel("Companion Treat Bakery", `<p class="muted">Bake harvested Orchard fruit into gourmet treats for double Companion Bond XP and Lucky Ripples! Baked: ${hv.baked || 0}.</p><div class="se-mkt">${RECIPES.map(([crop, name, ic, cost, xp, luck]) => {
      const cnt = hv.crops[crop] || 0;
      return `<div class="se-good"><span><strong>${ic} ${name}</strong><small>Needs 1 ${crop} (have ${cnt}) + ${cost} mon · +${xp} XP & +${luck} Luck</small></span><button class="btn btn-accent" type="button" data-bk="${crop}" ${cnt >= 1 && s.mon >= cost ? "" : "disabled"}>Bake & Feed</button></div>`;
    }).join("")}</div>`, (e) => {
      e.querySelectorAll("[data-bk]").forEach((x) => (x.onclick = () => {
        const rec = RECIPES.find((q) => q[0] === x.dataset.bk);
        if (!rec || !(hv.crops[rec[0]] >= 1) || s.mon < rec[3]) return;
        hv.crops[rec[0]]--; s.mon -= rec[3];
        hv.baked = (hv.baked || 0) + 1;
        hv.compXp += rec[4];
        s.luck = (s.luck || 0) + rec[5];
        while (hv.compXp >= hv.compLv * 40 && hv.compLv < 10) { hv.compXp -= hv.compLv * 40; hv.compLv++; toast(`Companion Bond Level ${hv.compLv}!`); }
        ping("done"); save(); hud(); toast(`Baked ${rec[1]}! +${rec[4]} Bond XP & +${rec[5]} Luck`); treatBakery();
      }));
    });
  }

  function bulletin() {
    const d = dayKey(), canStreak = hv.streakDay !== d;
    const MILESTONES = [
      ["w5", "Make 5 Wishing Well wishes", () => Object.keys(hv.gems).length >= 1 || hv.blessed || hv.wishes >= 3, 75],
      ["sp5", "Spin the Starlight Pavilion 5 times", () => hv.spins >= 5, 110],
      ["lv3", "Reach Companion Bond Lv.3", () => hv.compLv >= 3, 140],
      ["ex5", "Donate 5 Relic Hall exhibits", () => Object.keys(hv.exhibits).length >= 5, 220],
      ["pt4", "Pull 4 Saltwick Tide Pots", () => (hv.pearls || 0) >= 4, 120],
    ];
    panel("Brask Town Bulletin", `<p class="muted">Daily Streak: Day ${hv.streak || 0}. Claim your daily check-in and Overworld milestone bounties.</p><div class="se-mkt"><div class="se-good"><span><strong>Daily Streak Check-In</strong><small>Reward: ${55 + (hv.streak || 0) * 20} mon + 1 Lucky Ripple</small></span><button class="btn btn-accent" type="button" id="hv-str" ${canStreak ? "" : "disabled"}>${canStreak ? `Claim Day ${(hv.streak || 0) + 1}` : "Claimed Today"}</button></div>${MILESTONES.map(([id, lbl, ok, rew]) => `<div class="se-good"><span><strong>${lbl}</strong><small>Reward: +${rew} mon</small></span>${hv.bounties[id] ? "<em>Claimed ✓</em>" : `<button class="btn btn-accent" type="button" data-bn="${id}" ${ok() ? "" : "disabled"}>${ok() ? "Claim" : "In Progress"}</button>`}</div>`).join("")}</div>`, (e) => {
      e.querySelector("#hv-str").onclick = () => {
        if (!canStreak) return;
        hv.streakDay = d; hv.streak = (hv.streak || 0) + 1;
        const pay = 55 + (hv.streak - 1) * 20;
        s.mon += pay; s.luck = (s.luck || 0) + 1;
        ping("done"); save(); hud(); toast(`Day ${hv.streak} Streak! +${pay} mon & +1 Luck`); bulletin();
      };
      e.querySelectorAll("[data-bn]").forEach((x) => (x.onclick = () => {
        const m = MILESTONES.find((q) => q[0] === x.dataset.bn);
        if (!m || hv.bounties[m[0]] || !m[2]()) return;
        hv.bounties[m[0]] = 1; s.mon += m[3];
        ping("done"); save(); hud(); toast(`Milestone claimed! +${m[3]} mon`); bulletin();
      }));
    });
  }

  function starDeck() {
    const CONSTELLATIONS = [
      ["ninetail", "The Nine-Tail", "🦊", "quartz", 2, 40],
      ["lantern", "The Lantern", "🏮", "quartz", 3, 55],
      ["bell", "The Seventh Bell", "🔔", "topaz", 2, 75],
      ["foxglove", "The Foxglove", "🌸", "topaz", 3, 95],
      ["tideglass", "The Tide-Glass", "🫧", "opal", 2, 130],
      ["ember", "The Ember Crown", "🔥", "sapphire", 1, 200],
    ];
    const charted = Object.keys(hv.stars).length;
    panel("Oz Starlight Deck", `<p class="muted">Chart constellations using Grotto Gems (${charted}/${CONSTELLATIONS.length}). Each charted constellation boosts your daily Starlight Dividend!</p><div class="se-mkt">${CONSTELLATIONS.map(([id, name, ic, gem, req, rew]) => {
      const done = !!hv.stars[id], have = hv.gems[gem] || 0;
      return `<div class="se-good"><span><strong>${ic} ${name}</strong><small>${done ? `Charted ✓ (+${rew} mon earned)` : `Needs ${req} ${gem} (have ${have})`}</small></span>${done ? "<em>Charted</em>" : `<button class="btn btn-accent" type="button" data-st="${id}" ${have >= req ? "" : "disabled"}>Chart</button>`}</div>`;
    }).join("")}</div>`, (e) => {
      e.querySelectorAll("[data-st]").forEach((x) => (x.onclick = () => {
        const c = CONSTELLATIONS.find((q) => q[0] === x.dataset.st);
        if (!c || hv.stars[c[0]] || (hv.gems[c[3]] || 0) < c[4]) return;
        hv.gems[c[3]] -= c[4]; hv.stars[c[0]] = 1; s.mon += c[5];
        ping("done"); save(); hud(); toast(`Charted ${c[1]}! +${c[5]} mon`); starDeck();
      }));
    });
  }

  function petSpa() {
    syncDay();
    const left = Math.max(0, 2 - (hv.spaUsed || 0));
    const TREATMENTS = [
      ["bath", "Warm Bubble Bath", "🫧", 20, 22, 0],
      ["brush", "Starlight Brushing", "✨", 35, 42, 1],
    ];
    panel("Hollow Pine Companion Spa", `<p class="muted">Pamper your companion (${left}/2 visits left today). Current Bond: Lv.${hv.compLv}.</p><div class="se-mkt">${TREATMENTS.map(([id, name, ic, cost, xp, luck]) => `<div class="se-good"><span><strong>${ic} ${name}</strong><small>${cost} mon · +${xp} Bond XP${luck ? ` & +${luck} Luck` : ""}</small></span><button class="btn btn-accent" type="button" data-sp="${id}" ${left && s.mon >= cost ? "" : "disabled"}>Treat</button></div>`).join("")}<div class="se-good"><span><strong>💎 Prism Coat Polish</strong><small>1 Mist Opal (have ${hv.gems.opal || 0}) · +85 Bond XP & +2 Luck</small></span><button class="btn btn-accent" type="button" id="sp-op" ${(hv.gems.opal || 0) >= 1 ? "" : "disabled"}>Polish</button></div></div>`, (e) => {
      e.querySelectorAll("[data-sp]").forEach((x) => (x.onclick = () => {
        const t = TREATMENTS.find((q) => q[0] === x.dataset.sp);
        if (!t || hv.spaUsed >= 2 || s.mon < t[3]) return;
        s.mon -= t[3]; hv.spaUsed++; hv.compXp += t[4];
        if (t[5]) s.luck = (s.luck || 0) + t[5];
        while (hv.compXp >= hv.compLv * 40 && hv.compLv < 10) { hv.compXp -= hv.compLv * 40; hv.compLv++; toast(`Companion Bond Level ${hv.compLv}!`); }
        ping("done"); save(); hud(); toast(`${t[1]} complete! +${t[4]} Bond XP`); petSpa();
      }));
      e.querySelector("#sp-op").onclick = () => {
        if (!(hv.gems.opal >= 1)) return;
        hv.gems.opal--; hv.compXp += 85; s.luck = (s.luck || 0) + 2;
        while (hv.compXp >= hv.compLv * 40 && hv.compLv < 10) { hv.compXp -= hv.compLv * 40; hv.compLv++; toast(`Companion Bond Level ${hv.compLv}!`); }
        ping("done"); save(); hud(); toast("Prism Coat Polish! +85 Bond XP & +2 Luck"); petSpa();
      };
    });
  }

  function curioMarket() {
    panel("Night Market Curio Stall", `<p class="muted">Trade mon or Grotto Quartz for Mystery Curio Boxes and Lucky Bundles. Boxes opened: ${hv.curios || 0}.</p><div class="se-mkt"><div class="se-good"><span><strong>🎁 Mystery Curio Box</strong><small>65 mon · Rolls mon, Rare Ores, or Gems</small></span><button class="btn btn-accent" type="button" id="cu-box" ${s.mon >= 65 ? "" : "disabled"}>Open (65 mon)</button></div><div class="se-good"><span><strong>🍀 Lucky Charm Satchel</strong><small>2 Mountain Quartz (have ${hv.gems.quartz || 0}) · +3 Lucky Ripples</small></span><button class="btn btn-accent" type="button" id="cu-luck" ${(hv.gems.quartz || 0) >= 2 ? "" : "disabled"}>Trade 2 Quartz</button></div><div class="se-good"><span><strong>⛏️ Miner's Ore Crate</strong><small>80 mon · +3 Copper, +2 Silver, +1 Gold Ore</small></span><button class="btn btn-accent" type="button" id="cu-ore" ${s.mon >= 80 ? "" : "disabled"}>Buy (80 mon)</button></div></div>`, (e) => {
      e.querySelector("#cu-box").onclick = () => {
        if (s.mon < 65) return;
        s.mon -= 65; hv.curios = (hv.curios || 0) + 1;
        const r = Math.random();
        if (r < 0.4) { const g = 85 + Math.floor(Math.random() * 90); s.mon += g; toast(`Curio Box held ${g} mon!`); }
        else if (r < 0.75) { const gm = GEMS[1 + Math.floor(Math.random() * 3)]; hv.gems[gm[0]] = (hv.gems[gm[0]] || 0) + 1; toast(`Curio Box held a ${gm[1]}!`); }
        else { st.ore.Ruby = (st.ore.Ruby || 0) + 1; st.ore.Moonstone = (st.ore.Moonstone || 0) + 1; toast("Curio Box held Ruby & Moonstone Ore!"); }
        ping("done"); save(); hud(); curioMarket();
      };
      e.querySelector("#cu-luck").onclick = () => {
        if ((hv.gems.quartz || 0) < 2) return;
        hv.gems.quartz -= 2; s.luck = (s.luck || 0) + 3;
        ping("done"); save(); hud(); toast("+3 Lucky Ripples!"); curioMarket();
      };
      e.querySelector("#cu-ore").onclick = () => {
        if (s.mon < 80) return;
        s.mon -= 80; st.ore.Copper = (st.ore.Copper || 0) + 3; st.ore.Silver = (st.ore.Silver || 0) + 2; st.ore.Gold = (st.ore.Gold || 0) + 1;
        ping("done"); save(); hud(); toast("Miner's Ore Crate unpacked!"); curioMarket();
      };
    });
  }

  function festival() {
    panel("Sakura Fireworks Stand", `<p class="muted">Launch lantern fireworks over the Overworld! Shows launched: ${hv.festShows || 0}.</p><div class="se-mkt"><div class="se-good"><span><strong>🎆 Launch Lantern Fireworks</strong><small>50 mon · Lights the sky, grants +20 Bond XP & +2 Lucky Ripples</small></span><button class="btn btn-accent" type="button" id="fv-go" ${s.mon >= 50 ? "" : "disabled"}>Launch (50 mon)</button></div></div>`, (e) => {
      e.querySelector("#fv-go").onclick = () => {
        if (s.mon < 50) return;
        s.mon -= 50; hv.festShows = (hv.festShows || 0) + 1;
        hv.compXp += 20; s.luck = (s.luck || 0) + 2;
        while (hv.compXp >= hv.compLv * 40 && hv.compLv < 10) { hv.compXp -= hv.compLv * 40; hv.compLv++; toast(`Companion Bond Level ${hv.compLv}!`); }
        o.fireworks?.();
        ping("done"); save(); hud(); toast("Fireworks launched! +20 Bond XP & +2 Luck"); festival();
      };
    });
  }

  function picnic() {
    panel("Bamboo Grove Picnic", `<p class="muted">Spread a picnic blanket with Orchard fruit and share it with travelers! Picnics hosted: ${hv.picnics || 0}.</p><div class="se-mkt">${SEEDS.map(([id, name, ic, , , sell, xp]) => `<div class="se-good"><span><strong>${ic} ${name} Basket</strong><small>1 ${name} (have ${hv.crops[id] || 0}) · +${Math.round(sell * 1.25)} mon & +${xp} Bond XP</small></span><button class="btn btn-accent" type="button" data-pk="${id}" ${hv.crops[id] ? "" : "disabled"}>Host Picnic</button></div>`).join("")}</div>`, (e) => {
      e.querySelectorAll("[data-pk]").forEach((x) => (x.onclick = () => {
        const def = SEEDS.find((q) => q[0] === x.dataset.pk);
        if (!def || !hv.crops[def[0]]) return;
        hv.crops[def[0]]--; hv.picnics = (hv.picnics || 0) + 1;
        const pay = Math.round(def[5] * 1.25);
        s.mon += pay; hv.compXp += def[6];
        while (hv.compXp >= hv.compLv * 40 && hv.compLv < 10) { hv.compXp -= hv.compLv * 40; hv.compLv++; toast(`Companion Bond Level ${hv.compLv}!`); }
        ping("done"); save(); hud(); toast(`Lovely picnic! +${pay} mon & +${def[6]} Bond XP`); picnic();
      }));
    });
  }

  function lighthouse() {
    syncDay();
    let rings = [1, 2, 3];
    const html = `<p class="muted">Rotate the 3 beacon prisms until all point to 0° (North) to light Saltwick Beacon for today!</p><div class="px-grid" id="lh-rings"></div><p class="muted" id="lh-st" style="margin-top:8px">${hv.lightLit ? "Beacon already lit today ✓" : "Tap a ring to rotate it by 90°."}</p>`;
    panel("Saltwick Signal Beacon", html, (e) => {
      const box = e.querySelector("#lh-rings"), stEl = e.querySelector("#lh-st");
      const paint = () => {
        box.innerHTML = rings.map((r, i) => `<button type="button" class="px-tile" data-rg="${i}" ${hv.lightLit ? "disabled" : ""}><strong>Prism Ring ${i + 1}</strong><small>${r * 90}°</small></button>`).join("");
      };
      box.onclick = (ev) => {
        if (hv.lightLit) return;
        const b = ev.target.closest("[data-rg]"); if (!b) return;
        const i = +b.dataset.rg;
        rings[i] = (rings[i] + 1) % 4;
        ping("blip"); paint();
        if (rings.every((v) => v === 0)) {
          hv.lightLit = 1; s.mon += 120; s.luck = (s.luck || 0) + 2; hv.gems.opal = (hv.gems.opal || 0) + 1;
          stEl.textContent = "Beacon Lit! +120 mon, +2 Luck & +1 Mist Opal!";
          ping("done"); save(); hud(); paint();
        }
      };
      paint();
    });
  }

  function tonics() {
    const activeSec = Math.max(0, Math.ceil(((hv.tonicUntil || 0) - Date.now()) / 1000));
    panel("Platform Zero Tonic Stand", `<p class="muted">Brew quick travel tonics from Copper Ore & Quartz. ${activeSec ? `Swiftfoot Tonic active (${activeSec}s)!` : ""}</p><div class="se-mkt"><div class="se-good"><span><strong>⚡ Swiftfoot Tonic</strong><small>2 Copper Ore (have ${st.ore.Copper || 0}) · +15% walk speed for 3m</small></span><button class="btn btn-accent" type="button" id="tn-spd" ${(st.ore.Copper || 0) >= 2 ? "" : "disabled"}>Brew</button></div><div class="se-good"><span><strong>🍀 Lucky Draught</strong><small>2 Mountain Quartz (have ${hv.gems.quartz || 0}) · +4 Lucky Ripples</small></span><button class="btn btn-accent" type="button" id="tn-lck" ${(hv.gems.quartz || 0) >= 2 ? "" : "disabled"}>Brew</button></div><div class="se-good"><span><strong>💎 Crystal Transmute</strong><small>3 Silver Ore (have ${st.ore.Silver || 0}) · +2 Random Grotto Gems</small></span><button class="btn btn-accent" type="button" id="tn-gem" ${(st.ore.Silver || 0) >= 3 ? "" : "disabled"}>Brew</button></div></div>`, (e) => {
      e.querySelector("#tn-spd").onclick = () => {
        if ((st.ore.Copper || 0) < 2) return;
        st.ore.Copper -= 2; hv.tonicUntil = Date.now() + 180000;
        ping("done"); save(); hud(); toast("Swiftfoot Tonic! +15% speed for 3 minutes."); tonics();
      };
      e.querySelector("#tn-lck").onclick = () => {
        if ((hv.gems.quartz || 0) < 2) return;
        hv.gems.quartz -= 2; s.luck = (s.luck || 0) + 4;
        ping("done"); save(); hud(); toast("+4 Lucky Ripples!"); tonics();
      };
      e.querySelector("#tn-gem").onclick = () => {
        if ((st.ore.Silver || 0) < 3) return;
        st.ore.Silver -= 3;
        for (let i = 0; i < 2; i++) { const gm = GEMS[1 + Math.floor(Math.random() * 3)]; hv.gems[gm[0]] = (hv.gems[gm[0]] || 0) + 1; }
        ping("done"); save(); hud(); toast("Transmuted 2 Grotto Gems!"); tonics();
      };
    });
  }

  function vault() {
    const d = dayKey(), ready = hv.divDay !== d;
    const payout = 30 + (hv.compLv - 1) * 15 + Object.keys(hv.exhibits).length * 10 + Object.keys(hv.stars).length * 15;
    panel("Capital Dividend Vault", `<p class="muted">Collect your daily Overworld Dividend scaled by Companion Bond, Relic Hall Exhibits, and Charted Constellations.</p><div class="se-mkt"><div class="se-good"><span><strong>Daily Haven Dividend</strong><small>Bond Lv.${hv.compLv} · ${Object.keys(hv.exhibits).length} Exhibits · ${Object.keys(hv.stars).length} Constellations</small></span><button class="btn btn-accent" type="button" id="vl-cl" ${ready ? "" : "disabled"}>${ready ? `Collect ${payout} mon` : "Collected Today ✓"}</button></div></div>`, (e) => {
      e.querySelector("#vl-cl").onclick = () => {
        if (!ready) return;
        hv.divDay = d; s.mon += payout;
        ping("done"); save(); hud(); toast(`Collected +${payout} mon dividend!`); vault();
      };
    });
  }

  function rewards() {
    const giveHat = (id) => { if (!s.hats.includes(id)) s.hats.push(id); s.hat = id; };
    const giveFurn = (id) => { s.furn[id] = (s.furn[id] || 0) + 1; };
    const LIST = [
      ["rw1", "Wishing Well Crown (Hat)", () => hv.blessed >= 1, () => giveHat("wellcrown"), "Earn the Prism Blessing"],
      ["rw2", "Grotto Prism Helm (Hat)", () => hv.pick >= 2, () => giveHat("grottohelm"), "Own the Prism Pick"],
      ["rw3", "Orchard Sunhat (Hat)", () => hv.compLv >= 4, () => giveHat("orchardhat"), "Reach Companion Bond Lv.4"],
      ["rw4", "Mini Wishing Well (Furn)", () => (hv.bounties?.w5 || hv.wishes >= 3), () => giveFurn("wishwell"), "Make wishes at the Well"],
      ["rw5", "Grotto Sapphire Cluster (Furn)", () => (hv.gems.sapphire || 0) >= 1, () => giveFurn("gemcluster"), "Hold a Star Sapphire"],
      ["rw6", "Tabletop Spin Wheel (Furn)", () => hv.spins >= 3, () => giveFurn("spinwheel"), "Spin the Pavilion 3 times"],
      ["rw7", "Saltwick Pearl Basket (Furn)", () => (hv.pearls || 0) >= 3, () => giveFurn("tidebasket"), "Pull 3 Tide Pots"],
    ];
    hv.rewards ||= {};
    panel("Haven Trophy Pedestal", `<p class="muted">Unlock exclusive Overworld Hats and Furniture by exploring Haven activities.</p><div class="se-mkt">${LIST.map(([id, name, ok, , req]) => `<div class="se-good"><span><strong>${esc(name)}</strong><small>${esc(req)}</small></span>${hv.rewards[id] ? "<em>Claimed ✓</em>" : `<button class="btn btn-accent" type="button" data-rw="${id}" ${ok() ? "" : "disabled"}>${ok() ? "Claim" : "Locked"}</button>`}</div>`).join("")}</div>`, (e) => {
      e.querySelectorAll("[data-rw]").forEach((x) => (x.onclick = () => {
        const it = LIST.find((q) => q[0] === x.dataset.rw);
        if (!it || hv.rewards[it[0]] || !it[2]()) return;
        hv.rewards[it[0]] = 1; it[3]();
        ping("done"); save(); hud(); toast(`Unlocked ${it[1]}!`); rewards();
      }));
    });
  }

  function iceBench() {
    panel("Glacier Ice-Carving Bench", `<p class="muted">Carve shimmering star-ice sculptures for mon tips & Bond XP. Sculptures carved: ${hv.carved || 0}.</p><div class="se-mkt"><div class="se-good"><span><strong>❄️ Carve Fox Sculpture</strong><small>30 mon · Pays 45–85 mon + 18 Bond XP</small></span><button class="btn btn-accent" type="button" id="ic-carve" ${s.mon >= 30 ? "" : "disabled"}>Carve (30 mon)</button></div></div>`, (e) => {
      e.querySelector("#ic-carve").onclick = () => {
        if (s.mon < 30) return;
        s.mon -= 30; hv.carved = (hv.carved || 0) + 1;
        const tip = 45 + Math.floor(Math.random() * 41);
        s.mon += tip; hv.compXp += 18;
        while (hv.compXp >= hv.compLv * 40 && hv.compLv < 10) { hv.compXp -= hv.compLv * 40; hv.compLv++; toast(`Companion Bond Level ${hv.compLv}!`); }
        ping("done"); save(); hud(); toast(`Sculpture sold for ${tip} mon! +18 Bond XP`); iceBench();
      };
    });
  }

  function coralDive() {
    let time = 12, pearls = 0, timer = 0;
    panel("Coral Reef Dive", `<p class="muted">Tap pearl bubbles before your air runs out!</p><div class="by-jobtop"><strong id="cd-t">12s</strong><strong id="cd-p">0 pearls</strong></div><button class="btn btn-accent" type="button" id="cd-grab" style="width:100%;padding:16px">🫧 Grab Reef Pearl</button>`, (e) => {
      const btn = e.querySelector("#cd-grab");
      btn.onclick = () => {
        if (time <= 0) return;
        pearls++; ping("blip");
        e.querySelector("#cd-p").textContent = `${pearls} pearls`;
      };
      timer = setInterval(() => {
        time -= 0.2;
        if (time <= 0) {
          clearInterval(timer); btn.disabled = true;
          hv.dives = (hv.dives || 0) + 1;
          const got = pearls * 5; s.mon += got;
          if (pearls >= 15) { hv.gems.opal = (hv.gems.opal || 0) + 1; toast(`Great dive! +${got} mon & +1 Mist Opal!`); }
          else toast(`Dive complete! +${got} mon`);
          ping("done"); save(); hud();
          e.querySelector("#cd-t").textContent = "Done";
          return;
        }
        e.querySelector("#cd-t").textContent = `${Math.ceil(time)}s`;
      }, 200);
      return () => clearInterval(timer);
    });
  }

  function campfire() {
    const d = dayKey(), ready = hv.campDay !== d;
    panel("World's Edge Campfire", `<p class="muted">Warm up by the hearth at the edge of the map once a day.</p><div class="se-mkt"><div class="se-good"><span><strong>🔥 Rest & Toast Fruit</strong><small>Free daily · +18 Bond XP, +1 Lucky Ripple & +25 mon</small></span><button class="btn btn-accent" type="button" id="cf-rest" ${ready ? "" : "disabled"}>${ready ? "Rest by Fire" : "Rested Today ✓"}</button></div></div>`, (e) => {
      e.querySelector("#cf-rest").onclick = () => {
        if (!ready) return;
        hv.campDay = d; s.mon += 25; s.luck = (s.luck || 0) + 1; hv.compXp += 18;
        while (hv.compXp >= hv.compLv * 40 && hv.compLv < 10) { hv.compXp -= hv.compLv * 40; hv.compLv++; toast(`Companion Bond Level ${hv.compLv}!`); }
        ping("done"); save(); hud(); toast("Warm and rested! +25 mon, +18 Bond XP & +1 Luck"); campfire();
      };
    });
  }

  function sunFountain() {
    panel("Amber Sunstone Fountain", `<p class="muted">Offer 40 mon or 1 Sun Topaz to send a warm sunburst across your Orchard Terrace plots and Saltwick Tide Pots (-15s wait)!</p><div class="se-mkt"><div class="se-good"><span><strong>☀️ Warm Sunburst</strong><small>40 mon · -15s on all active plots & pots + 1 Lucky Ripple</small></span><button class="btn btn-accent" type="button" id="sf-mon" ${s.mon >= 40 ? "" : "disabled"}>Offer 40 mon</button></div><div class="se-good"><span><strong>💛 Topaz Surge</strong><small>1 Sun Topaz (have ${hv.gems.topaz || 0}) · Finishes all active plots & pots instantly!</small></span><button class="btn btn-accent" type="button" id="sf-top" ${(hv.gems.topaz || 0) >= 1 ? "" : "disabled"}>Offer Topaz</button></div></div>`, (e) => {
      e.querySelector("#sf-mon").onclick = () => {
        if (s.mon < 40) return;
        s.mon -= 40; s.luck = (s.luck || 0) + 1;
        for (const pl of hv.plots) if (pl) pl.ready -= 15000;
        for (const pt of hv.pots) if (pt) pt.ready -= 15000;
        ping("done"); save(); hud(); toast("Sunburst! Plots & pots sped up by 15s (+1 Luck)."); sunFountain();
      };
      e.querySelector("#sf-top").onclick = () => {
        if (!(hv.gems.topaz >= 1)) return;
        hv.gems.topaz--;
        const now = Date.now();
        for (const pl of hv.plots) if (pl) pl.ready = now;
        for (const pt of hv.pots) if (pt) pt.ready = now;
        ping("done"); save(); hud(); toast("Topaz Surge! All active plots & pots are ready!"); sunFountain();
      };
    });
  }

  function anvil() {
    panel("Caldera Forge Anvil", `<p class="muted">Transmute Quarry Ores into Grotto Gems.</p><div class="se-mkt"><div class="se-good"><span><strong>💛 Smelt Sun Topaz</strong><small>3 Copper + 1 Gold Ore (have ${st.ore.Copper || 0} Cu, ${st.ore.Gold || 0} Au)</small></span><button class="btn btn-accent" type="button" id="an-top" ${(st.ore.Copper || 0) >= 3 && (st.ore.Gold || 0) >= 1 ? "" : "disabled"}>Smelt</button></div><div class="se-good"><span><strong>🩷 Smelt Mist Opal</strong><small>2 Silver + 1 Ruby Ore (have ${st.ore.Silver || 0} Ag, ${st.ore.Ruby || 0} Ru)</small></span><button class="btn btn-accent" type="button" id="an-op" ${(st.ore.Silver || 0) >= 2 && (st.ore.Ruby || 0) >= 1 ? "" : "disabled"}>Smelt</button></div><div class="se-good"><span><strong>💙 Smelt Star Sapphire</strong><small>2 Gold + 1 Moonstone Ore (have ${st.ore.Gold || 0} Au, ${st.ore.Moonstone || 0} Mn)</small></span><button class="btn btn-accent" type="button" id="an-sap" ${(st.ore.Gold || 0) >= 2 && (st.ore.Moonstone || 0) >= 1 ? "" : "disabled"}>Smelt</button></div></div>`, (e) => {
      e.querySelector("#an-top").onclick = () => { if ((st.ore.Copper || 0) < 3 || (st.ore.Gold || 0) < 1) return; st.ore.Copper -= 3; st.ore.Gold--; hv.gems.topaz = (hv.gems.topaz || 0) + 1; ping("done"); save(); toast("Smelted 1 Sun Topaz!"); anvil(); };
      e.querySelector("#an-op").onclick = () => { if ((st.ore.Silver || 0) < 2 || (st.ore.Ruby || 0) < 1) return; st.ore.Silver -= 2; st.ore.Ruby--; hv.gems.opal = (hv.gems.opal || 0) + 1; ping("done"); save(); toast("Smelted 1 Mist Opal!"); anvil(); };
      e.querySelector("#an-sap").onclick = () => { if ((st.ore.Gold || 0) < 2 || (st.ore.Moonstone || 0) < 1) return; st.ore.Gold -= 2; st.ore.Moonstone--; hv.gems.sapphire = (hv.gems.sapphire || 0) + 1; ping("done"); save(); toast("Smelted 1 Star Sapphire!"); anvil(); };
    });
  }

  function mistPost() {
    const d = dayKey(), done = hv.mistDay === d;
    let lit = [1, 0, 1];
    panel("Mistwood Lantern Post", `<p class="muted">Toggle the three mist-lanterns until all three glow bright! Tapping one flips its neighbors too.</p><div class="px-grid" id="mp-grid"></div><p class="muted" id="mp-st" style="margin-top:8px">${done ? "Lit for today ✓" : "Light all 3 lanterns."}</p>`, (e) => {
      const box = e.querySelector("#mp-grid"), stEl = e.querySelector("#mp-st");
      const paint = () => { box.innerHTML = lit.map((on, i) => `<button type="button" class="px-tile" data-ln="${i}" ${done || hv.mistDay === d ? "disabled" : ""}><strong>${on ? "🏮 Lit" : "🌑 Dark"}</strong><small>Lantern ${i + 1}</small></button>`).join(""); };
      box.onclick = (ev) => {
        if (hv.mistDay === d) return;
        const b = ev.target.closest("[data-ln]"); if (!b) return;
        const i = +b.dataset.ln;
        lit[i] ^= 1; if (i > 0) lit[i - 1] ^= 1; if (i < 2) lit[i + 1] ^= 1;
        ping("blip"); paint();
        if (lit.every(Boolean)) {
          hv.mistDay = d; s.mon += 90; hv.compXp += 15; hv.gems.topaz = (hv.gems.topaz || 0) + 1;
          while (hv.compXp >= hv.compLv * 40 && hv.compLv < 10) { hv.compXp -= hv.compLv * 40; hv.compLv++; toast(`Companion Bond Level ${hv.compLv}!`); }
          stEl.textContent = "All 3 lit! +90 mon, +15 Bond XP & +1 Sun Topaz!";
          ping("done"); save(); hud(); paint();
        }
      };
      paint();
    });
  }

  function havenBell() {
    const d = dayKey(), ready = hv.bellDay !== d;
    const html = `<p class="muted">Overview of your Overworld Haven progress.</p><div class="se-mkt"><div class="se-good"><span><strong>🔔 Ring Haven Bell</strong><small>Daily chime · +20 mon & +10 Companion Bond XP</small></span><button class="btn btn-accent" type="button" id="hb-ring" ${ready ? "" : "disabled"}>${ready ? "Ring Bell" : "Rung Today ✓"}</button></div><div class="se-good"><span><strong>Companion Bond</strong><small>Lv.${hv.compLv}/10 · +${Math.round((speedBonus() - 1) * 100)}% walk speed</small></span><em>${hv.compXp}/${hv.compLv * 40} XP</em></div><div class="se-good"><span><strong>Relic & Mineral Hall</strong><small>+${Object.keys(hv.exhibits).length * 3}% Town Square minigame pay</small></span><em>${Object.keys(hv.exhibits).length}/11</em></div><div class="se-good"><span><strong>Oz Starlight Deck</strong><small>Constellations charted</small></span><em>${Object.keys(hv.stars).length}/6</em></div><div class="se-good"><span><strong>Haven Trophy Pedestal</strong><small>Exclusive Hats & Furniture</small></span><em>${Object.keys(hv.rewards || {}).length}/7</em></div></div>`;
    panel("Hollow Pine Haven Bell", html, (e) => {
      e.querySelector("#hb-ring").onclick = () => {
        if (!ready) return;
        hv.bellDay = d; s.mon += 20; hv.compXp += 10;
        while (hv.compXp >= hv.compLv * 40 && hv.compLv < 10) { hv.compXp -= hv.compLv * 40; hv.compLv++; toast(`Companion Bond Level ${hv.compLv}!`); }
        ping("done"); save(); hud(); toast("The Haven Bell chimes! +20 mon & +10 Bond XP"); havenBell();
      };
    });
  }

  function jadeTea() {
    const d = dayKey(), ready = hv.jadeDay !== d;
    panel("Jade Blossom Tea House", `<p class="muted">Steep a quiet cup of jade tea overlooking the waterfall.</p><div class="se-mkt"><div class="se-good"><span><strong>🍵 Steep Jade Tea</strong><small>25 mon · +25 Bond XP, +1 Lucky Ripple & daily fortune</small></span><button class="btn btn-accent" type="button" id="jt-go" ${ready && s.mon >= 25 ? "" : "disabled"}>${ready ? "Steep (25 mon)" : "Steeped Today ✓"}</button></div><div class="se-good"><span><strong>🍓 Sunberry Tea</strong><small>1 Sunberry (have ${hv.crops.sunberry || 0}) · +45 mon & +25 Bond XP</small></span><button class="btn btn-accent" type="button" id="jt-sb" ${(hv.crops.sunberry || 0) >= 1 ? "" : "disabled"}>Brew</button></div></div>`, (e) => {
      e.querySelector("#jt-go").onclick = () => {
        if (!ready || s.mon < 25) return;
        s.mon -= 25; hv.jadeDay = d; s.mon += 45; s.luck = (s.luck || 0) + 1; hv.compXp += 25;
        while (hv.compXp >= hv.compLv * 40 && hv.compLv < 10) { hv.compXp -= hv.compLv * 40; hv.compLv++; toast(`Companion Bond Level ${hv.compLv}!`); }
        ping("done"); save(); hud(); toast("Warm tea! +45 mon, +25 Bond XP & +1 Luck"); jadeTea();
      };
      e.querySelector("#jt-sb").onclick = () => {
        if (!(hv.crops.sunberry >= 1)) return;
        hv.crops.sunberry--; s.mon += 45; hv.compXp += 25;
        while (hv.compXp >= hv.compLv * 40 && hv.compLv < 10) { hv.compXp -= hv.compLv * 40; hv.compLv++; toast(`Companion Bond Level ${hv.compLv}!`); }
        ping("done"); save(); hud(); toast("Sunberry Tea! +45 mon & +25 Bond XP"); jadeTea();
      };
    });
  }

  function starAltar() {
    panel("Starfall Meteor Altar", `<p class="muted">Offer rare harvests or gems to call down a Meteor Blessing.</p><div class="se-mkt"><div class="se-good"><span><strong>⭐ Starfruit Offering</strong><small>1 Starfruit (have ${hv.crops.starfruit || 0}) · +280 mon, +30 Bond XP & +2 Luck</small></span><button class="btn btn-accent" type="button" id="sa-sf" ${(hv.crops.starfruit || 0) >= 1 ? "" : "disabled"}>Offer</button></div><div class="se-good"><span><strong>🩷 Mist Opal Offering</strong><small>1 Mist Opal (have ${hv.gems.opal || 0}) · +95 mon & +3 Lucky Ripples</small></span><button class="btn btn-accent" type="button" id="sa-op" ${(hv.gems.opal || 0) >= 1 ? "" : "disabled"}>Offer</button></div></div>`, (e) => {
      e.querySelector("#sa-sf").onclick = () => {
        if (!(hv.crops.starfruit >= 1)) return;
        hv.crops.starfruit--; s.mon += 280; s.luck = (s.luck || 0) + 2; hv.compXp += 30;
        while (hv.compXp >= hv.compLv * 40 && hv.compLv < 10) { hv.compXp -= hv.compLv * 40; hv.compLv++; toast(`Companion Bond Level ${hv.compLv}!`); }
        ping("done"); save(); hud(); toast("Meteor Blessing! +280 mon, +30 Bond XP & +2 Luck"); starAltar();
      };
      e.querySelector("#sa-op").onclick = () => {
        if (!(hv.gems.opal >= 1)) return;
        hv.gems.opal--; s.mon += 95; s.luck = (s.luck || 0) + 3;
        ping("done"); save(); hud(); toast("Opal Blessing! +95 mon & +3 Luck"); starAltar();
      };
    });
  }

  function sundial() {
    const d = dayKey(), done = hv.sunDay === d;
    let angle = 2;
    panel("Noon Sundial Plaza", `<p class="muted">Turn the bronze gnomon to 12:00 Noon (0°) to claim today's solar chime.</p><div class="px-grid"><button type="button" class="px-tile" id="sd-turn" ${done ? "disabled" : ""}><strong>☀️ Sundial Shadow</strong><small id="sd-lbl">${done ? "Aligned Today ✓" : `${angle * 90}° — Tap to turn`}</small></button></div>`, (e) => {
      e.querySelector("#sd-turn").onclick = () => {
        if (hv.sunDay === d) return;
        angle = (angle + 1) % 4;
        ping("blip");
        if (angle === 0) {
          hv.sunDay = d; s.mon += 75; hv.compXp += 15;
          while (hv.compXp >= hv.compLv * 40 && hv.compLv < 10) { hv.compXp -= hv.compLv * 40; hv.compLv++; toast(`Companion Bond Level ${hv.compLv}!`); }
          e.querySelector("#sd-lbl").textContent = "Aligned! +75 mon & +15 Bond XP";
          e.querySelector("#sd-turn").disabled = true;
          ping("done"); save(); hud();
        } else e.querySelector("#sd-lbl").textContent = `${angle * 90}° — Tap to turn`;
      };
    });
  }

  function gemExchange() {
    panel("Redcliff Gem Exchange", `<p class="muted">Refine 3 lower-tier Grotto Gems into 1 higher-tier Gem.</p><div class="se-mkt"><div class="se-good"><span><strong>🤍 3 Quartz → 💛 1 Sun Topaz</strong><small>Have ${hv.gems.quartz || 0} Quartz</small></span><button class="btn btn-accent" type="button" id="gx-1" ${(hv.gems.quartz || 0) >= 3 ? "" : "disabled"}>Refine</button></div><div class="se-good"><span><strong>💛 3 Sun Topaz → 🩷 1 Mist Opal</strong><small>Have ${hv.gems.topaz || 0} Topaz</small></span><button class="btn btn-accent" type="button" id="gx-2" ${(hv.gems.topaz || 0) >= 3 ? "" : "disabled"}>Refine</button></div><div class="se-good"><span><strong>🩷 3 Mist Opal → 💙 1 Star Sapphire</strong><small>Have ${hv.gems.opal || 0} Opal</small></span><button class="btn btn-accent" type="button" id="gx-3" ${(hv.gems.opal || 0) >= 3 ? "" : "disabled"}>Refine</button></div></div>`, (e) => {
      e.querySelector("#gx-1").onclick = () => { if ((hv.gems.quartz || 0) < 3) return; hv.gems.quartz -= 3; hv.gems.topaz = (hv.gems.topaz || 0) + 1; ping("done"); save(); toast("Refined 1 Sun Topaz!"); gemExchange(); };
      e.querySelector("#gx-2").onclick = () => { if ((hv.gems.topaz || 0) < 3) return; hv.gems.topaz -= 3; hv.gems.opal = (hv.gems.opal || 0) + 1; ping("done"); save(); toast("Refined 1 Mist Opal!"); gemExchange(); };
      e.querySelector("#gx-3").onclick = () => { if ((hv.gems.opal || 0) < 3) return; hv.gems.opal -= 3; hv.gems.sapphire = (hv.gems.sapphire || 0) + 1; ping("done"); save(); toast("Refined 1 Star Sapphire!"); gemExchange(); };
    });
  }

  function cinderCircle() {
    const d = dayKey(), ready = hv.cinderDay !== d;
    panel("Cinderbell Chalk Circle", `<p class="muted">A neat ring of golden chalk beside Hollow Pine's cobbles, signed by Sera Vale & Vesper Thorne.</p><div class="se-mkt"><div class="se-good"><span><strong>📜 Read Founders' Treaty Plaque</strong><small>${hv.treatyRead ? "Read ✓" : "First-time discovery: +50 mon"}</small></span><button class="btn btn-accent" type="button" id="cc-tr" ${hv.treatyRead ? "disabled" : ""}>${hv.treatyRead ? "Read" : "Read Plaque"}</button></div><div class="se-good"><span><strong>🔔 Draw Mutual Pact Charm</strong><small>20 mon · Daily +25 Bond XP & +1 Lucky Ripple</small></span><button class="btn btn-accent" type="button" id="cc-dr" ${ready && s.mon >= 20 ? "" : "disabled"}>${ready ? "Draw (20 mon)" : "Drawn Today ✓"}</button></div></div>`, (e) => {
      e.querySelector("#cc-tr").onclick = () => {
        if (hv.treatyRead) return;
        hv.treatyRead = 1; s.mon += 50;
        ping("done"); save(); hud(); toast("Founders' Treaty discovered! +50 mon"); cinderCircle();
      };
      e.querySelector("#cc-dr").onclick = () => {
        if (!ready || s.mon < 20) return;
        s.mon -= 20; hv.cinderDay = d; hv.compXp += 25; s.luck = (s.luck || 0) + 1;
        while (hv.compXp >= hv.compLv * 40 && hv.compLv < 10) { hv.compXp -= hv.compLv * 40; hv.compLv++; toast(`Companion Bond Level ${hv.compLv}!`); }
        ping("done"); save(); hud(); toast("Mutual Pact Charm! +25 Bond XP & +1 Luck"); cinderCircle();
      };
    });
  }

  function pearlBell() {
    const d = dayKey(), ready = hv.sunkDay !== d;
    panel("Sunken Reef Bell", `<p class="muted">An ancient bronze bell half-buried in coral sand. Ring it once a day to stir up reef gems.</p><div class="se-mkt"><div class="se-good"><span><strong>🔔 Ring Sunken Bell</strong><small>25 mon · +1 Mist Opal (or +2 Quartz) & +15 Bond XP</small></span><button class="btn btn-accent" type="button" id="pb-ring" ${ready && s.mon >= 25 ? "" : "disabled"}>${ready ? "Ring (25 mon)" : "Rung Today ✓"}</button></div></div>`, (e) => {
      e.querySelector("#pb-ring").onclick = () => {
        if (!ready || s.mon < 25) return;
        s.mon -= 25; hv.sunkDay = d; hv.compXp += 15;
        if (Math.random() < 0.45) { hv.gems.opal = (hv.gems.opal || 0) + 1; toast("Surfaced 1 Mist Opal! +15 Bond XP"); }
        else { hv.gems.quartz = (hv.gems.quartz || 0) + 2; toast("Surfaced 2 Mountain Quartz! +15 Bond XP"); }
        while (hv.compXp >= hv.compLv * 40 && hv.compLv < 10) { hv.compXp -= hv.compLv * 40; hv.compLv++; toast(`Companion Bond Level ${hv.compLv}!`); }
        ping("done"); save(); hud(); pearlBell();
      };
    });
  }

  function windChimes() {
    const d = dayKey(), done = hv.chimeDay === d;
    let step = 0;
    const notes = ["Low Wind", "Mid Wind", "High Star"];
    panel("Aurora Wind Chimes", `<p class="muted">Ring the three chimes in rising order (Low → Mid → High) for today's aurora blessing.</p><div class="px-grid" id="wc-grid">${notes.map((n, i) => `<button type="button" class="px-tile" data-wc="${i}" ${done ? "disabled" : ""}><strong>🎐 ${n}</strong><small>Chime ${i + 1}</small></button>`).join("")}</div><p class="muted" id="wc-st" style="margin-top:8px">${done ? "Chimed Today ✓" : "Tap Low Wind first."}</p>`, (e) => {
      const stEl = e.querySelector("#wc-st");
      e.querySelectorAll("[data-wc]").forEach((x) => (x.onclick = () => {
        if (hv.chimeDay === d) return;
        const i = +x.dataset.wc;
        if (i === step) {
          step++; ping("blip");
          if (step >= 3) {
            hv.chimeDay = d; s.mon += 95; s.luck = (s.luck || 0) + 2;
            stEl.textContent = "Harmony! +95 mon & +2 Lucky Ripples!";
            e.querySelectorAll("[data-wc]").forEach((b) => (b.disabled = true));
            ping("done"); save(); hud();
          } else stEl.textContent = `Good! Now tap ${notes[step]}.`;
        } else { step = 0; ping("close"); stEl.textContent = "Wrong pitch—start from Low Wind!"; }
      }));
    });
  }

  function caravan() {
    panel("Dune Caravan Post", `<p class="muted">Trade Orchard harvests or Copper Ore with passing desert merchants.</p><div class="se-mkt"><div class="se-good"><span><strong>🍈 Trade 1 Moonmelon</strong><small>Have ${hv.crops.moonmelon || 0} · Get +135 mon & +1 Sun Topaz</small></span><button class="btn btn-accent" type="button" id="cv-mm" ${(hv.crops.moonmelon || 0) >= 1 ? "" : "disabled"}>Trade</button></div><div class="se-good"><span><strong>⛏️ Trade 5 Copper Ore</strong><small>Have ${st.ore.Copper || 0} · Get +70 mon & +2 Quartz</small></span><button class="btn btn-accent" type="button" id="cv-cu" ${(st.ore.Copper || 0) >= 5 ? "" : "disabled"}>Trade</button></div></div>`, (e) => {
      e.querySelector("#cv-mm").onclick = () => { if (!(hv.crops.moonmelon >= 1)) return; hv.crops.moonmelon--; s.mon += 135; hv.gems.topaz = (hv.gems.topaz || 0) + 1; ping("done"); save(); hud(); toast("Traded Moonmelon! +135 mon & +1 Sun Topaz"); caravan(); };
      e.querySelector("#cv-cu").onclick = () => { if ((st.ore.Copper || 0) < 5) return; st.ore.Copper -= 5; s.mon += 70; hv.gems.quartz = (hv.gems.quartz || 0) + 2; ping("done"); save(); hud(); toast("Traded Copper! +70 mon & +2 Quartz"); caravan(); };
    });
  }

  return { well, grotto, wheel, terrace, museum, tidePots, treatBakery, bulletin, starDeck, petSpa, curioMarket, festival, picnic, lighthouse, tonics, vault, rewards, iceBench, coralDive, campfire, sunFountain, anvil, mistPost, havenBell, jadeTea, starAltar, sundial, gemExchange, cinderCircle, pearlBell, windChimes, caravan, speedBonus, payBonus };
}
