// The Skyward Isles Expansion: The Kite Works, Wind-Reader's Watch, Windmill Sanctum, and Aurora Pavilion.
export const KITES = [
  ["paper", "Paper Swift", "🪁", 0, 1, "Light starter kite for gentle updrafts."],
  ["cloud", "Cloud Glider", "☁️", 4, 1.35, "+35% thermal score and calmer gusts."],
  ["delta", "Starlight Delta", "✨", 10, 1.75, "+75% thermal score and Relic luck."],
  ["phoenix", "Aurora Phoenix", "🔥", 20, 2.3, "Double rewards + golden thermal magnet."],
];

export const VOYAGES = [
  ["nimbus", "Nimbus Drift", "⛵", 20, 45, 2, "Quick run through the lower cloud banks."],
  ["comet", "Comet Tail", "☄️", 40, 110, 5, "High-altitude sweep with Relic odds."],
  ["aurora", "Aurora Rim", "🌌", 65, 240, 10, "Deep sky expedition for rare Cloud Relics."],
];

export const RELICS = [
  ["bell", "Thunder Bell", "🔔", "Echoes across Galeharbor."],
  ["pearl", "Cumulus Pearl", "🫧", "Condensed from dawn mist."],
  ["feather", "Zephyr Feather", "🪶", "Never touches the ground."],
  ["compass", "Star Compass", "🧭", "Always points toward the Dome."],
  ["prism", "Aurora Prism", "💎", "Splits moonlight into seven winds."],
  ["sunstone", "Sunstone Core", "🌞", "Keeps the Windmill Sanctum warm."],
];

export const TURBINES = [
  ["rotor", "Breeze Rotor", "🌬️", "+15% Airship & Kite mon per level"],
  ["dynamo", "Gale Dynamo", "⚡", "+1 bonus Shard chance on Expeditions"],
  ["condenser", "Aurora Condenser", "✨", "Generates Sky Dust for Relic rolls"],
];

export const WINGS = [
  ["none", "Walker's Cloak", "🧥", 0, 1.0, "Standard island stride."],
  ["gull", "Gullwing Mantle", "🕊️", 5, 1.12, "+12% walk & sprint speed in Skyward Isles."],
  ["star", "Starwoven Pinions", "🌠", 12, 1.24, "+24% walk & sprint speed across bridges."],
  ["aurora", "Aurora Seraph Wings", "🌈", 24, 1.38, "+38% speed & shimmering trail."],
];

export function ensureSkyPlus(sk) {
  const p = (sk.plus ||= {
    kite: 0,
    kitesOwned: [0],
    kiteBest: 0,
    soars: 0,
    voyage: null,
    voyagesDone: 0,
    relics: {},
    turbines: { rotor: 0, dynamo: 0, condenser: 0 },
    dust: 0,
    wing: 0,
    wingsOwned: [0],
    bountyDay: "",
    bounties: {},
    shows: 0,
  });
  p.kitesOwned ||= [0];
  p.wingsOwned ||= [0];
  p.relics ||= {};
  p.turbines ||= { rotor: 0, dynamo: 0, condenser: 0 };
  const d = new Date().toDateString();
  if (p.bountyDay !== d) {
    p.bountyDay = d;
    p.bounties = {};
  }
  return p;
}

export function skyWingMult(sk) {
  const p = ensureSkyPlus(sk);
  return (WINGS[p.wing] || WINGS[0])[4];
}

export function skyMonMult(sk) {
  const p = ensureSkyPlus(sk);
  return 1 + (p.turbines.rotor || 0) * 0.15 + Object.keys(p.relics).length * 0.08;
}

function awardRelic(sk, p, chance = 0.25) {
  if (Math.random() > chance) return null;
  const r = RELICS[Math.floor(Math.random() * RELICS.length)];
  const isNew = !p.relics[r[0]];
  p.relics[r[0]] = (p.relics[r[0]] || 0) + 1;
  return { r, isNew };
}

export function kiteWorksPage(ctx, tab = "fly") {
  const { sk, api, page, esc, sayToast, hud } = ctx;
  const p = ensureSkyPlus(sk);
  const k = KITES[p.kite] || KITES[0];
  const tabs = `<div class="dy-tabs"><button type="button" class="${tab === "fly" ? "on" : ""}" data-t="fly">Soaring Trial</button><button type="button" class="${tab === "craft" ? "on" : ""}" data-t="craft">Kite Hangar</button></div>`;

  if (tab === "craft") {
    const html = `${tabs}<div class="by-jobtop"><strong>Equipped: ${k[1]}</strong><span>Best Score: ${p.kiteBest} · Flights: ${p.soars}</span></div><div class="by-list">${KITES.map(([id, name, ic, cost, mult, desc], i) => {
      const own = p.kitesOwned.includes(i), eq = p.kite === i;
      return `<div><i>${ic}</i><span><strong>${name} (${mult}×)</strong><small>${desc}</small></span>${own ? `<button class="btn${eq ? " btn-accent" : ""}" type="button" data-eq="${i}">${eq ? "Equipped" : "Equip"}</button>` : `<button class="btn btn-accent" type="button" data-buy="${i}" ${sk.shards >= cost ? "" : "disabled"}>Craft (${cost} ✦)</button>`}</div>`;
    }).join("")}</div>`;
    page("The Kite Works · Hangar", html, (e) => {
      e.querySelectorAll("[data-t]").forEach((x) => (x.onclick = () => kiteWorksPage(ctx, x.dataset.t)));
      e.querySelectorAll("[data-eq]").forEach((x) => (x.onclick = () => { p.kite = +x.dataset.eq; api.save(); api.ping("choice"); kiteWorksPage(ctx, "craft"); }));
      e.querySelectorAll("[data-buy]").forEach((x) => (x.onclick = () => {
        const i = +x.dataset.buy, def = KITES[i];
        if (!def || sk.shards < def[3]) return;
        sk.shards -= def[3]; p.kitesOwned.push(i); p.kite = i;
        api.save(); api.ping("done"); hud(); sayToast(`Crafted ${def[1]}!`); kiteWorksPage(ctx, "craft");
      }));
    });
    return;
  }

  let time = 24, score = 0, list = [], uid = 1, timer = 0, spawn = 0;
  const html = `${tabs}<div class="by-jobtop"><strong id="kt-t">24s</strong><strong id="kt-s">0 pts · ${k[2]} ${k[1]}</strong></div><p class="muted">Tap Golden Thermals (☀️) and Star Currents (✦) while dodging Storm Squalls (⛈️).</p><div class="by-sea" id="kt-sky" style="background:linear-gradient(180deg,#1d3566,#4e86c8)"></div>`;
  page("The Kite Works", html, (e) => {
    e.querySelectorAll("[data-t]").forEach((x) => (x.onclick = () => { clearInterval(timer); kiteWorksPage(ctx, x.dataset.t); }));
    const area = e.querySelector("#kt-sky");
    const paint = () => {
      e.querySelector("#kt-t").textContent = `${Math.ceil(time)}s`;
      e.querySelector("#kt-s").textContent = `${score} pts · ${k[2]} ${k[1]}`;
    };
    area.onpointerdown = (ev) => {
      const btn = ev.target.closest("[data-kt]");
      if (!btn) return;
      const q = list.find((w) => w.u === +btn.dataset.kt);
      if (!q) return;
      list = list.filter((w) => w !== q);
      btn.remove();
      if (q.bad) { score = Math.max(0, score - 12); time -= 1.5; api.ping("close"); }
      else { score += Math.round((q.gold ? 22 : 10) * k[4]); api.ping("choice"); }
      paint();
    };
    timer = setInterval(() => {
      time -= 0.1; spawn -= 0.1;
      if (spawn <= 0) {
        spawn = 0.45;
        const bad = Math.random() < (p.kite >= 1 ? 0.18 : 0.24), gold = !bad && Math.random() < 0.25;
        const q = { u: uid++, bad, gold, life: bad ? 2.1 : 2.5, max: 0 };
        q.max = q.life;
        const d = document.createElement("button");
        d.type = "button"; d.dataset.kt = q.u; d.className = bad ? "shark" : "swim";
        d.style.left = `${8 + Math.random() * 78}%`; d.style.top = `${10 + Math.random() * 72}%`;
        d.innerHTML = `${bad ? "⛈️" : gold ? "☀️" : "✦"}<u></u>`;
        area.appendChild(d); q.el = d; list.push(q);
      }
      for (const q of [...list]) {
        q.life -= 0.1;
        const u = q.el.querySelector("u");
        if (u) u.style.width = `${(q.life / q.max) * 100}%`;
        if (q.life <= 0) { q.el.remove(); list = list.filter((w) => w !== q); }
      }
      paint();
      if (time <= 0) {
        clearInterval(timer);
        p.soars++;
        if (score > p.kiteBest) p.kiteBest = score;
        const monGot = Math.round((15 + score * 0.85) * skyMonMult(sk));
        const shardGot = score >= 120 ? 3 : score >= 50 ? 2 : score > 0 ? 1 : 0;
        api.addMon(monGot);
        sk.shards += shardGot;
        p.dust += Math.floor(score / 25);
        const rel = score >= 80 ? awardRelic(sk, p, p.kite >= 2 ? 0.4 : 0.2) : null;
        api.save(); api.ping(score > 0 ? "done" : "close"); hud();
        page("Flight Complete", `<p class="by-big">${score} points</p><p>+${monGot} mon · +${shardGot} ✦ shards${rel ? ` · Found ${rel.r[2]} ${rel.r[1]}!` : ""}</p><button class="btn btn-accent" type="button" id="kt-ag">Fly Again</button>`, (z) => {
          z.querySelector("#kt-ag").onclick = () => kiteWorksPage(ctx, "fly");
        });
      }
    }, 100);
    return () => clearInterval(timer);
  });
}

export function windWatchPage(ctx, tab = "voyage") {
  const { sk, api, page, esc, sayToast, hud } = ctx;
  const p = ensureSkyPlus(sk);
  const tabs = `<div class="dy-tabs"><button type="button" class="${tab === "voyage" ? "on" : ""}" data-t="voyage">Airship Expeditions</button><button type="button" class="${tab === "bounty" ? "on" : ""}" data-t="bounty">Wind Bounties</button></div>`;

  if (tab === "bounty") {
    const tasks = [
      ["sh10", "Gather 10 Total Star-Shards", () => (sk.totalShards || 0) >= 10, 65, 2],
      ["fish3", "Catch 3 Cloud-Fish", () => Object.values(sk.fish || {}).reduce((a, n) => a + n, 0) >= 3, 85, 3],
      ["kite1", "Complete a Kite Soaring Flight", () => p.soars >= 1, 75, 2],
      ["voy1", "Finish an Airship Expedition", () => p.voyagesDone >= 1, 110, 4],
    ];
    const html = `${tabs}<div class="by-jobtop"><strong>Daily Wind Bounties</strong><span>Voyages Done: ${p.voyagesDone}</span></div><div class="by-list">${tasks.map(([id, lbl, ok, m, sh]) => {
      const claimed = !!p.bounties[id], ready = ok();
      return `<div><i>📜</i><span><strong>${lbl}</strong><small>Reward: +${m} mon, +${sh} ✦</small></span>${claimed ? "<em>Claimed ✓</em>" : `<button class="btn btn-accent" type="button" data-cl="${id}" ${ready ? "" : "disabled"}>${ready ? "Claim" : "Locked"}</button>`}</div>`;
    }).join("")}</div>`;
    page("Wind-Reader's Watch · Bounties", html, (e) => {
      e.querySelectorAll("[data-t]").forEach((x) => (x.onclick = () => windWatchPage(ctx, x.dataset.t)));
      e.querySelectorAll("[data-cl]").forEach((x) => (x.onclick = () => {
        const t = tasks.find((q) => q[0] === x.dataset.cl);
        if (!t || p.bounties[t[0]] || !t[2]()) return;
        p.bounties[t[0]] = 1;
        api.addMon(t[3]); sk.shards += t[4];
        api.save(); api.ping("done"); hud(); sayToast(`Bounty claimed! +${t[3]} mon, +${t[4]} ✦`); windWatchPage(ctx, "bounty");
      }));
    });
    return;
  }

  const now = Date.now(), v = p.voyage;
  const vLeft = v ? Math.max(0, Math.ceil((v.ready - now) / 1000)) : 0;
  const html = `${tabs}<div class="by-jobtop"><strong>Expeditions Completed: ${p.voyagesDone}</strong><span>Relics: ${Object.keys(p.relics).length}/${RELICS.length}</span></div>${v ? `<div class="by-list"><div><i>${v.ic}</i><span><strong>${esc(v.name)}</strong><small>${vLeft === 0 ? "Airship returned with cargo!" : `${vLeft}s until return`}</small></span><button class="btn btn-accent" type="button" id="vw-claim" ${vLeft === 0 ? "" : "disabled"}>${vLeft === 0 ? "Collect Cargo" : "En Route..."}</button></div></div>` : `<div class="by-list">${VOYAGES.map(([id, name, ic, sec, mon, sh, desc]) => `<div><i>${ic}</i><span><strong>${name} (${sec}s)</strong><small>${desc} · ~${mon} mon, +${sh} ✦</small></span><button class="btn btn-accent" type="button" data-go="${id}">Launch</button></div>`).join("")}</div>`}`;
  page("Wind-Reader's Watch", html, (e) => {
    e.querySelectorAll("[data-t]").forEach((x) => (x.onclick = () => windWatchPage(ctx, x.dataset.t)));
    e.querySelectorAll("[data-go]").forEach((x) => (x.onclick = () => {
      const def = VOYAGES.find((q) => q[0] === x.dataset.go);
      if (!def || p.voyage) return;
      p.voyage = { id: def[0], name: def[1], ic: def[2], ready: Date.now() + def[3] * 1000, mon: def[4], sh: def[5] };
      api.save(); api.ping("choice"); windWatchPage(ctx, "voyage");
    }));
    const cl = e.querySelector("#vw-claim");
    if (cl) cl.onclick = () => {
      if (!p.voyage || Date.now() < p.voyage.ready) return;
      const monGot = Math.round(p.voyage.mon * skyMonMult(sk));
      const shGot = p.voyage.sh + (p.turbines.dynamo || 0);
      api.addMon(monGot); sk.shards += shGot;
      p.dust += 2 + (p.turbines.condenser || 0);
      p.voyagesDone++;
      const rel = awardRelic(sk, p, p.voyage.id === "aurora" ? 0.65 : p.voyage.id === "comet" ? 0.38 : 0.18);
      p.voyage = null;
      api.save(); api.ping("done"); hud();
      sayToast(`Cargo collected: +${monGot} mon, +${shGot} ✦${rel ? ` & ${rel.r[1]}!` : ""}`);
      windWatchPage(ctx, "voyage");
    };
    if (v && vLeft > 0) {
      const tmr = setInterval(() => { if (Date.now() >= v.ready) { clearInterval(tmr); windWatchPage(ctx, "voyage"); } }, 1000);
      return () => clearInterval(tmr);
    }
  });
}

export function sanctumPage(ctx, tab = "turbines") {
  const { sk, api, page, sayToast, hud } = ctx;
  const p = ensureSkyPlus(sk);
  const tabs = `<div class="dy-tabs"><button type="button" class="${tab === "turbines" ? "on" : ""}" data-t="turbines">Sky Turbines</button><button type="button" class="${tab === "relics" ? "on" : ""}" data-t="relics">Relic Museum (${Object.keys(p.relics).length}/${RELICS.length})</button></div>`;

  if (tab === "relics") {
    const html = `${tabs}<div class="by-jobtop"><strong>Sky Dust: ${p.dust}</strong><span>Museum Bonus: +${Object.keys(p.relics).length * 8}% Mon</span><button class="btn btn-accent" type="button" id="sn-roll" ${p.dust >= 5 ? "" : "disabled"}>Condense Relic (5 Dust)</button></div><div class="by-list">${RELICS.map(([id, name, ic, desc]) => `<div><i>${ic}</i><span><strong>${name}</strong><small>${desc}</small></span><em>${p.relics[id] ? `Collected (×${p.relics[id]})` : "Missing"}</em></div>`).join("")}</div>`;
    page("Windmill Sanctum · Relics", html, (e) => {
      e.querySelectorAll("[data-t]").forEach((x) => (x.onclick = () => sanctumPage(ctx, x.dataset.t)));
      e.querySelector("#sn-roll").onclick = () => {
        if (p.dust < 5) return;
        p.dust -= 5;
        const rel = awardRelic(sk, p, 1);
        api.save(); api.ping("done"); sayToast(`Condensed ${rel.r[1]}!`); sanctumPage(ctx, "relics");
      };
    });
    return;
  }

  const html = `${tabs}<div class="by-jobtop"><strong>Skyward Mon Mult: ${Math.round(skyMonMult(sk) * 100)}%</strong><span>✦ ${sk.shards} Shards</span></div><div class="by-list">${TURBINES.map(([id, name, ic, desc]) => {
    const lv = p.turbines[id] || 0, cost = 4 + lv * 5;
    return `<div><i>${ic}</i><span><strong>${name} Lv.${lv}/5</strong><small>${desc}</small></span>${lv < 5 ? `<button class="btn btn-accent" type="button" data-up="${id}" data-c="${cost}" ${sk.shards >= cost ? "" : "disabled"}>Upgrade (${cost} ✦)</button>` : "<em>Maxed</em>"}</div>`;
  }).join("")}</div>`;
  page("Windmill Sanctum", html, (e) => {
    e.querySelectorAll("[data-t]").forEach((x) => (x.onclick = () => sanctumPage(ctx, x.dataset.t)));
    e.querySelectorAll("[data-up]").forEach((x) => (x.onclick = () => {
      const id = x.dataset.up, c = +x.dataset.c;
      if (sk.shards < c || (p.turbines[id] || 0) >= 5) return;
      sk.shards -= c; p.turbines[id] = (p.turbines[id] || 0) + 1;
      api.save(); api.ping("done"); hud(); sayToast("Turbine upgraded!"); sanctumPage(ctx, "turbines");
    }));
  });
}

export function auroraPage(ctx) {
  const { sk, api, page, sayToast, hud, triggerFireworks } = ctx;
  const p = ensureSkyPlus(sk);
  const html = `<div class="by-jobtop"><strong>Speed Boost: ${Math.round((skyWingMult(sk) - 1) * 100)}%</strong><span>Firework Shows: ${p.shows}</span><button class="btn btn-accent" type="button" id="au-fw" ${sk.shards >= 3 ? "" : "disabled"}>Launch Aurora Show (3 ✦)</button></div><h3>Skyward Glider Wings</h3><div class="by-list">${WINGS.map(([id, name, ic, cost, mult, desc], i) => {
    const own = p.wingsOwned.includes(i), eq = p.wing === i;
    return `<div><i>${ic}</i><span><strong>${name}</strong><small>${desc}</small></span>${own ? `<button class="btn${eq ? " btn-accent" : ""}" type="button" data-wq="${i}">${eq ? "Equipped" : "Equip"}</button>` : `<button class="btn btn-accent" type="button" data-wb="${i}" ${sk.shards >= cost ? "" : "disabled"}>Weave (${cost} ✦)</button>`}</div>`;
  }).join("")}</div>`;
  page("Aurora Pavilion", html, (e) => {
    e.querySelector("#au-fw").onclick = () => {
      if (sk.shards < 3) return;
      sk.shards -= 3; p.shows++;
      const monGot = Math.round(90 * skyMonMult(sk));
      api.addMon(monGot);
      triggerFireworks?.();
      api.save(); api.ping("done"); hud(); sayToast(`Aurora Fireworks! +${monGot} mon!`); auroraPage(ctx);
    };
    e.querySelectorAll("[data-wq]").forEach((x) => (x.onclick = () => { p.wing = +x.dataset.wq; api.save(); api.ping("choice"); auroraPage(ctx); }));
    e.querySelectorAll("[data-wb]").forEach((x) => (x.onclick = () => {
      const i = +x.dataset.wb, def = WINGS[i];
      if (!def || sk.shards < def[3]) return;
      sk.shards -= def[3]; p.wingsOwned.push(i); p.wing = i;
      api.save(); api.ping("done"); hud(); sayToast(`Wove ${def[1]}!`); auroraPage(ctx);
    }));
  });
}
