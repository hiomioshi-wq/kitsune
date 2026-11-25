// Moonwake Bay: Crystal Cavern (gem mining), Starlight Wishing Well (Prism blessings), and Moonwake Lighthouse.
import { SPECIES, specie, addPet, activePet, petMult } from "./baycore.js";

export const GEMS = [
  ["quartz", "Sea Quartz", "🤍", 14, .45, "#e8eef4"],
  ["aqua", "Aquamarine", "🩵", 26, .28, "#6cd8e8"],
  ["topaz", "Sun Topaz", "💛", 44, .15, "#ffd25a"],
  ["opal", "Tide Opal", "🩷", 75, .08, "#ff9fd0"],
  ["sapphire", "Star Sapphire", "💙", 140, .04, "#5a88ff"],
];

export const PICKS = [
  ["drift", "Driftwood Pick", 0, 1, "Starts you off in the cavern."],
  ["copper", "Copper Tide Pick", 220, 1.35, "+35% gem yield and faster swings."],
  ["silver", "Silver Reef Pick", 650, 1.75, "+75% gem yield and higher Opal odds."],
  ["prism", "Prism Core Pick", 1600, 2.3, "Double gems + Star Sapphire luck."],
];

export function ensureCavern(b) {
  b.mine ||= { pick: 0, gems: {}, total: 0 };
  b.mine.gems ||= {};
  const d = new Date().toDateString();
  if (b.well?.d !== d) b.well = { d, wishes: 0, blessed: 0 };
  if (b.light?.d !== d) b.light = { d, lit: 0 };
  return b;
}

function rollGem(pick, r = Math.random) {
  const weights = GEMS.map((g, i) => g[4] + (i >= 2 ? pick * .045 : i === 0 ? -pick * .09 : 0));
  const sum = weights.reduce((a, x) => a + Math.max(.01, x), 0);
  let q = r() * sum;
  for (let i = 0; i < GEMS.length; i++) {
    q -= Math.max(.01, weights[i]);
    if (q <= 0) return GEMS[i];
  }
  return GEMS[0];
}

export function cavernPage(ctx, tab = "mine") {
  const { b, page, esc, ping, save, pay, checkGoals, say } = ctx;
  ensureCavern(b);
  const m = b.mine, pk = PICKS[m.pick] || PICKS[0];
  const tabs = `<div class="dy-tabs"><button type="button" class="${tab === "mine" ? "on" : ""}" data-t="mine">Crystal Vein</button><button type="button" class="${tab === "bag" ? "on" : ""}" data-t="bag">Gem Pouch</button><button type="button" class="${tab === "shop" ? "on" : ""}" data-t="shop">Pickaxe Shop</button></div>`;
  const bindTabs = (e) => e.querySelectorAll("[data-t]").forEach((x) => (x.onclick = () => cavernPage(ctx, x.dataset.t)));

  if (tab === "mine") {
    page("Crystal Cavern", `${tabs}<p class="muted">Strike glowing crystal nodes before they fade. Equipped: <strong>${esc(pk[1])}</strong>. Total mined: ${m.total || 0}.</p><div class="by-jobtop"><strong id="cv-t">25s</strong><strong id="cv-n">0 gems</strong></div><div class="by-sea" id="cv-wall" style="background:linear-gradient(180deg,#161b33,#231a3d)"></div><div class="by-row"><button class="btn btn-accent" type="button" id="cv-go">Start mining shift</button></div>`, (e) => {
      bindTabs(e);
      const wall = e.querySelector("#cv-wall"), tEl = e.querySelector("#cv-t"), nEl = e.querySelector("#cv-n");
      let timer = 0, spawn = 0, t = 25, got = 0, list = [], uid = 1;
      const start = () => {
        if (timer) return;
        e.querySelector("#cv-go").disabled = true;
        t = 25; got = 0; list = []; wall.innerHTML = "";
        const paint = () => { tEl.textContent = `${Math.ceil(t)}s`; nEl.textContent = `${got} gems`; };
        paint();
        wall.onpointerdown = (ev) => {
          const btn = ev.target.closest("[data-gem]");
          if (!btn) return;
          ev.preventDefault();
          const q = list.find((w) => w.u === +btn.dataset.gem);
          if (!q) return;
          list = list.filter((w) => w !== q);
          btn.remove();
          const qty = Math.max(1, Math.round(pk[3] * (Math.random() < .35 ? 2 : 1)));
          m.gems[q.g[0]] = (m.gems[q.g[0]] || 0) + qty;
          m.total = (m.total || 0) + qty;
          b.t.gems = (b.t.gems || 0) + qty;
          got += qty;
          ping(q.g[0] === "sapphire" || q.g[0] === "opal" ? "done" : "choice");
          paint();
        };
        timer = setInterval(() => {
          t -= .1; spawn -= .1;
          if (spawn <= 0) {
            spawn = Math.max(.38, .82 - m.pick * .09);
            const g = rollGem(m.pick), q = { u: uid++, g, life: 1.5 + m.pick * .18, max: 1.5 + m.pick * .18 };
            const d = document.createElement("button");
            d.type = "button"; d.dataset.gem = q.u; d.className = "swim";
            d.style.left = `${8 + Math.random() * 76}%`; d.style.top = `${10 + Math.random() * 72}%`;
            d.style.borderColor = g[5];
            d.innerHTML = `${g[2]}<u></u>`;
            d.setAttribute("aria-label", g[1]);
            wall.appendChild(d);
            q.el = d; list.push(q);
          }
          for (const q of [...list]) {
            q.life -= .1;
            const u = q.el.querySelector("u");
            if (u) u.style.width = `${Math.max(0, q.life / q.max * 100)}%`;
            if (q.life <= 0) { q.el.remove(); list = list.filter((w) => w !== q); }
          }
          tEl.textContent = `${Math.ceil(t)}s`;
          if (t <= 0) {
            clearInterval(timer); timer = 0;
            list.forEach((q) => q.el.remove()); list = [];
            save(); checkGoals();
            say(`Cavern shift done! Mined ${got} crystal${got === 1 ? "" : "s"}.`);
            cavernPage(ctx, "bag");
          }
        }, 100);
      };
      e.querySelector("#cv-go").onclick = start;
      return () => clearInterval(timer);
    });
  } else if (tab === "bag") {
    const totalVal = GEMS.reduce((a, g) => a + (m.gems[g[0]] || 0) * g[3], 0);
    page("Crystal Cavern", `${tabs}<p class="muted">Sell raw crystals for shells, or save them for the Starlight Wishing Well.</p><div class="by-list">${GEMS.map((g) => {
      const n = m.gems[g[0]] || 0;
      return `<div><i>${g[2]}</i><span><strong>${esc(g[1])}</strong><small>${n} in pouch · ${g[3]} shells each</small></span><button class="btn" type="button" data-sell="${g[0]}" ${n ? "" : "disabled"}>Sell 1</button></div>`;
    }).join("")}</div><div class="by-row"><button class="btn btn-accent" type="button" id="cv-all" ${totalVal ? "" : "disabled"}>Sell all (${totalVal} shells)</button></div>`, (e) => {
      bindTabs(e);
      e.querySelectorAll("[data-sell]").forEach((x) => (x.onclick = () => {
        const g = GEMS.find((q) => q[0] === x.dataset.sell);
        if (!g || !(m.gems[g[0]] > 0)) return;
        m.gems[g[0]]--;
        const v = pay(b, g[3]);
        save(); ping("choice"); checkGoals(); say(`Sold ${g[1]} for +${v} shells.`); cavernPage(ctx, "bag");
      }));
      e.querySelector("#cv-all").onclick = () => {
        if (!totalVal) return;
        for (const g of GEMS) m.gems[g[0]] = 0;
        const v = pay(b, totalVal);
        save(); ping("done"); checkGoals(); say(`Sold the whole pouch for +${v} shells!`); cavernPage(ctx, "bag");
      };
    });
  } else {
    page("Crystal Cavern", `${tabs}<p class="muted">Better picks crack deeper crystal veins and boost rare gem odds.</p><div class="by-list">${PICKS.map((p, i) => {
      const own = m.pick >= i, next = i === m.pick + 1;
      return `<div class="${own ? "ok" : ""}"><i>⛏️</i><span><strong>${esc(p[1])}</strong><small>${esc(p[4])}</small></span>${own ? "<em>Owned</em>" : next ? `<button class="btn btn-accent" type="button" data-buy="${i}" ${b.shells >= p[2] ? "" : "disabled"}>${p[2]} shells</button>` : "<em>Later</em>"}</div>`;
    }).join("")}</div>`, (e) => {
      bindTabs(e);
      e.querySelectorAll("[data-buy]").forEach((x) => (x.onclick = () => {
        const i = +x.dataset.buy, p = PICKS[i];
        if (i !== m.pick + 1 || b.shells < p[2]) return;
        b.shells -= p[2]; m.pick = i; save(); ping("done"); say(`${p[1]} equipped!`); checkGoals(); cavernPage(ctx, "shop");
      }));
    });
  }
}

export function wellPage(ctx) {
  const { b, page, esc, ping, save, checkGoals, say } = ctx;
  ensureCavern(b);
  const p = activePet(b), m = b.mine;
  const canPrism = p && !p.prism && ((m.gems.sapphire || 0) >= 1 || (m.gems.opal || 0) >= 2);
  page("Starlight Wishing Well", `<p class="muted">Toss shells or crystals into the well. Today's wishes: ${b.well.wishes}/3.</p><div class="by-list">
    <div><i>🪙</i><span><strong>Toss 60 shells</strong><small>Grants XP to your active critter, warms your egg, or returns a surprise pouch.</small></span><button class="btn btn-accent" type="button" id="wl-coin" ${b.well.wishes >= 3 || b.shells < 60 ? "disabled" : ""}>Wish (60)</button></div>
    <div><i>🩵</i><span><strong>Toss an Aquamarine</strong><small>Guaranteed +35 XP for your active critter and +3 egg warmth.</small></span><button class="btn btn-accent" type="button" id="wl-aqua" ${b.well.wishes >= 3 || !(m.gems.aqua > 0) ? "disabled" : ""}>Toss 🩵</button></div>
    <div><i>🌈</i><span><strong>Prism Blessing</strong><small>${p ? (p.prism ? `${esc(p.name || specie(p.sp).name)} is already Prism-blessed.` : `Infuse ${esc(p.name || specie(p.sp).name)} with +45% shell bonus (costs 1 Star Sapphire or 2 Tide Opals).`) : "Walk a critter first."}</small></span>${p?.prism ? "<em>Blessed</em>" : `<button class="btn btn-accent" type="button" id="wl-prism" ${canPrism ? "" : "disabled"}>Bless Critter</button>`}</div>
  </div>`, (e) => {
    e.querySelector("#wl-coin").onclick = () => {
      if (b.well.wishes >= 3 || b.shells < 60) return;
      b.shells -= 60; b.well.wishes++; b.t.wishes = (b.t.wishes || 0) + 1;
      const roll = Math.random();
      if (roll < .35) {
        const bonus = 110 + Math.floor(Math.random() * 140);
        b.shells += bonus; say(`The well sparkles! +${bonus} shells washed up.`);
      } else if (roll < .7 && p) {
        p.xp = (p.xp || 0) + 28; p.care = (p.care || 0) + 4; say(`Starlight! ${p.name || specie(p.sp).name} gained +28 XP & +4 care.`);
      } else {
        const rar = SPECIES.filter((x) => x.r >= 2);
        const sp = rar[Math.floor(Math.random() * rar.length)];
        addPet(b, sp.id); say(`A stray ${sp.name} followed the starlight home!`);
      }
      save(); ping("done"); checkGoals(); wellPage(ctx);
    };
    e.querySelector("#wl-aqua").onclick = () => {
      if (b.well.wishes >= 3 || !(m.gems.aqua > 0)) return;
      m.gems.aqua--; b.well.wishes++; b.t.wishes = (b.t.wishes || 0) + 1;
      if (p) p.xp = (p.xp || 0) + 35;
      const egg = b.eggs?.find((x) => x.id === b.egg);
      if (egg) egg.have += 3;
      save(); ping("done"); checkGoals(); say("The aquamarine dissolves in blue light. +35 XP & +3 egg warmth!"); wellPage(ctx);
    };
    e.querySelector("#wl-prism").onclick = () => {
      if (!canPrism) return;
      if ((m.gems.sapphire || 0) >= 1) m.gems.sapphire--; else m.gems.opal -= 2;
      p.prism = true; b.t.prism = (b.t.prism || 0) + 1;
      save(); ping("done"); checkGoals(); say(`${p.name || specie(p.sp).name} is now Prism-blessed!`); wellPage(ctx);
    };
  });
}

export function lighthousePage(ctx) {
  const { b, page, ping, save, pay, checkGoals, say, digSpotsLeft } = ctx;
  ensureCavern(b);
  let rings = [Math.floor(Math.random() * 3) + 1, Math.floor(Math.random() * 3) + 1, Math.floor(Math.random() * 3) + 1];
  const aligned = () => rings.every((r) => r === 0);
  const draw = () => {
    const done = b.light.lit;
    page("Moonwake Lighthouse", `<p class="muted">Align all three brass lens rings to 0° to sweep the beacon across the bay once per day.</p>
      <div class="by-list">
        <div><i>🔭</i><span><strong>Bay Lookout</strong><small>Unfound sand treasures today: ${digSpotsLeft()} · Total gems mined: ${b.mine.total || 0} · Bay Book: ${Object.keys(b.dex).length}/${SPECIES.length}</small></span></div>
      </div>
      ${done ? `<p class="by-new"><strong>The beacon is shining across Moonwake Bay tonight.</strong> Come back tomorrow.</p>` : `<div class="by-row">${rings.map((r, i) => `<button class="btn btn-accent" type="button" data-ring="${i}">Ring ${i + 1}: ${r * 90}°</button>`).join("")}</div>`}`, (e) => {
      e.querySelectorAll("[data-ring]").forEach((x) => (x.onclick = () => {
        const i = +x.dataset.ring;
        rings[i] = (rings[i] + 1) % 4;
        ping("blip");
        if (aligned()) {
          b.light.lit = 1;
          b.t.beacon = (b.t.beacon || 0) + 1;
          const v = pay(b, 180);
          b.tickets = (b.tickets || 0) + 6;
          save(); ping("done"); checkGoals();
          say(`Beacon lit! +${v} shells and +6 arcade tickets.`);
        }
        draw();
      }));
    });
  };
  draw();
}
