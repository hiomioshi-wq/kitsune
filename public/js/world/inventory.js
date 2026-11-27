// Inventory, Equipment & Crafting System: manage gear slots (Hat, Trinket, Lantern), categorized items, consumables, and crafting.
import { esc } from "../util.js";
import { ITEMS, MEALS, item as findItem } from "./extras.js";
import { HATS } from "./data.js";
import { recordLostProperty } from "./living.js";
import { xs, save as saveXmas, petLevel as xPetLevel, petStage as xPetStage, pat as xPat, feed as xFeed } from "../xmas/core.js";
import { petUrl as xPetUrl } from "../xmas/art.js";
import { species as xSpecies, RARITY as X_RARITY, TREATS as X_TREATS } from "../xmas/data.js";
import { ensureBay, specie as baySpecie, petLevel as bayPetLevel, RARITY as BAY_RARITY } from "./baycore.js";
import { petUrl as bayPetUrl } from "./bay.js";

export const TRINKETS = [
  ["swift_anklet", "Swift Anklet", "+10% walking speed in Kitsune World", { copper: 0, iron: 2, spring: 2, silk: 1 }, { speed: 0.10 }],
  ["angler_lure", "Angler's Lure", "+2 Lucky Ripples when equipped & wider reel", { shell: 2, pearl: 1, reed: 2 }, { fish: 0.15 }],
  ["lucky_clover", "Golden Clover", "+15% bonus mon from foraging & chests", { gold: 1, honey: 2, poppy: 2 }, { mon: 0.15 }],
  ["scholar_quill", "Scholar's Quill", "+20% bonus Renown from activities", { ink: 2, page: 2, gold: 1 }, { renown: 0.20 }],
  ["meridian_compass", "Meridian Compass", "+15% walking speed & +10% bonus mon", { quartz: 2, iron: 2, ink: 1 }, { speed: 0.15, mon: 0.10 }],
  ["tide_glass_charm", "Tide-Glass Charm", "+20% fishing luck & +10% Renown", { shell: 3, pearl: 2, quartz: 1 }, { fish: 0.20, renown: 0.10 }],
];

export const LANTERN_GEAR = [
  ["std", "Standard Lantern", "Warm paper glow (1.0× radius)", {}, 1.0],
  ["blue", "Foxfire Blue Lantern", "Cool blue flame (1.25× night radius)", { quartz: 2, ink: 1 }, 1.25],
  ["amber", "Amber Hearth Lantern", "Bright golden glow (1.4× night radius)", { honey: 2, gold: 1, mushroom: 2 }, 1.4],
  ["astral", "Astral Violet Lantern", "Starlight beacon (1.6× night radius)", { emerald: 1, pearl: 1, quartz: 2 }, 1.6],
];

export function createInventory(o) {
  const { s, panel, toast, ping, save, hud, extras } = o;
  const g = (s.gear ||= {});
  g.trinkets ||= {};
  g.lanterns ||= { std: 1 };
  g.trinket ||= "";
  g.lantern ||= "std";

  let tab = "items"; // "items" | "gear" | "pets" | "craft"
  let cat = "all";   // "all" | "mat" | "meal"
  let petCat = "all"; // "all" | "world" | "bay"
  let query = "";

  const bag = () => extras.state.bag;
  const itemName = (id) => findItem(id)?.[1] || id;
  const itemVal = (q) => (MEALS.includes(q) ? q[5] : q[4]);

  const speedBonus = () => {
    const t = TRINKETS.find((x) => x[0] === g.trinket);
    return 1 + (t?.[4]?.speed || 0);
  };
  const lightRadius = () => {
    const l = LANTERN_GEAR.find((x) => x[0] === g.lantern);
    return l?.[4] || 1.0;
  };

  function open(nextTab = tab) {
    tab = nextTab;
    const totalCount = Object.values(bag()).reduce((a, n) => a + n, 0);
    const xState = xs(), bayState = s.bay ? ensureBay(s.bay) : null;
    const worldPets = Object.values(xState?.pets || {}), bayPets = bayState?.pets || [];
    const tabs = [
      ["items", `Inventory (${totalCount})`],
      ["gear", "Equipment"],
      ["pets", `Pets (${worldPets.length + bayPets.length})`],
      ["craft", "Workbench"],
      ["legacy", "Critters & Bounties"],
    ].map(([k, l]) => `<button type="button" class="chip${tab === k ? " on" : ""}" data-tab="${k}">${l}</button>`).join("");

    let body = "";
    if (tab === "items") {
      const q = query.trim().toLowerCase();
      const entries = Object.entries(bag())
        .filter(([, n]) => n > 0)
        .map(([id, n]) => ({ id, n, q: findItem(id), isMeal: MEALS.some((m) => m[0] === id) }))
        .filter((x) => x.q)
        .filter((x) => cat === "all" || (cat === "meal" ? x.isMeal : !x.isMeal))
        .filter((x) => !q || x.q[1].toLowerCase().includes(q));

      const cats = [["all", "All"], ["mat", "Materials & Loot"], ["meal", "Meals & Consumables"]].map(([k, l]) =>
        `<button type="button" class="chip${cat === k ? " on" : ""}" data-cat="${k}">${l}</button>`
      ).join("");

      const grid = entries.length
        ? `<div class="wx-grid">${entries.map(({ id, n, q: it, isMeal }) => `
            <article>
              <i class="wx-dot" style="background:${it[2]}"></i>
              <strong>${esc(it[1])} × ${n}</strong>
              <small class="muted">${isMeal ? `Consumable · ${it[4]}s speed` : "Material"} · ${itemVal(it)} mon</small>
              <div class="wx-row">
                ${isMeal ? `<button class="btn btn-sm btn-accent" type="button" data-eat="${id}">Use</button>` : ""}
                <button class="btn btn-sm" type="button" data-sell="${id}">Sell 1</button>
                ${n > 1 ? `<button class="btn btn-sm" type="button" data-sella="${id}">All</button>` : ""}
              </div>
            </article>`).join("")}</div>`
        : `<p class="muted">No matching items in your inventory. Forage outdoors, fish, dig, or search inside buildings!</p>`;

      body = `
        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:10px">
          <input type="search" class="field" id="inv-q" placeholder="Filter items…" value="${esc(query)}" style="max-width:220px">
          <div class="chips">${cats}</div>
        </div>
        ${grid}`;
    } else if (tab === "gear") {
      const ownedHats = HATS.filter((h) => s.hats.includes(h[0]));
      const curTrinket = TRINKETS.find((t) => t[0] === g.trinket);
      const curLantern = LANTERN_GEAR.find((l) => l[0] === g.lantern) || LANTERN_GEAR[0];

      body = `
        <div class="se-mkt" style="margin-bottom:12px">
          <div class="se-good"><span><strong>🎩 Equipped Hat</strong><small>${esc(HATS.find((h) => h[0] === s.hat)?.[1] || "None")}</small></span><span class="pill">${ownedHats.length} owned</span></div>
          <div class="se-good"><span><strong>🧿 Equipped Trinket</strong><small>${curTrinket ? `${esc(curTrinket[1])} (${esc(curTrinket[2])})` : "None equipped"}</small></span>${g.trinket ? `<button type="button" class="btn btn-sm" id="inv-untr">Unequip</button>` : ""}</div>
          <div class="se-good"><span><strong>🏮 Equipped Lantern</strong><small>${esc(curLantern[1])} (${esc(curLantern[2])})</small></span><span class="pill">${curLantern[4]}× light</span></div>
        </div>
        <h4>Trinkets</h4>
        <div class="se-mkt" style="margin-bottom:12px">
          ${TRINKETS.map(([id, name, desc]) => {
            const own = !!g.trinkets[id], on = g.trinket === id;
            return `<div class="se-good"><span><strong>${esc(name)}</strong><small>${esc(desc)}</small></span>${own ? `<button type="button" class="btn btn-sm${on ? "" : " btn-accent"}" data-eqt="${id}">${on ? "Equipped ✓" : "Equip"}</button>` : `<span class="pill">Craft in Workbench</span>`}</div>`;
          }).join("")}
        </div>
        <h4>Lanterns</h4>
        <div class="se-mkt" style="margin-bottom:12px">
          ${LANTERN_GEAR.map(([id, name, desc]) => {
            const own = !!g.lanterns[id], on = g.lantern === id;
            return `<div class="se-good"><span><strong>${esc(name)}</strong><small>${esc(desc)}</small></span>${own ? `<button type="button" class="btn btn-sm${on ? "" : " btn-accent"}" data-eql="${id}">${on ? "Equipped ✓" : "Equip"}</button>` : `<span class="pill">Craft in Workbench</span>`}</div>`;
          }).join("")}
        </div>
        <h4>Hats</h4>
        <div class="chips">${ownedHats.map((h) => `<button type="button" class="chip${s.hat === h[0] ? " on" : ""}" data-hat="${h[0]}">${esc(h[1])}</button>`).join("") || `<span class="muted">No hats yet — buy one at Foxfire Goods or win minigames!</span>`}</div>`;
    } else if (tab === "pets") {
      const q = query.trim().toLowerCase();
      const petCats = [["all", `All (${worldPets.length + bayPets.length})`], ["world", `World Companions (${worldPets.length})`], ["bay", `Bay Critters (${bayPets.length})`]].map(([k, l]) =>
        `<button type="button" class="chip${petCat === k ? " on" : ""}" data-pcat="${k}">${l}</button>`
      ).join("");
      const treatKeys = Object.entries(xState?.treats || {}).filter(([, n]) => n > 0).map(([k]) => k);
      const bestTreat = treatKeys[0] || "";

      const wFiltered = (petCat === "all" || petCat === "world") ? worldPets.filter((p) => {
        const sp = xSpecies(p.sp);
        return !q || (p.name || "").toLowerCase().includes(q) || (sp?.[1] || "").toLowerCase().includes(q);
      }) : [];
      const bFiltered = (petCat === "all" || petCat === "bay") ? bayPets.filter((p) => {
        const sp = baySpecie(p.sp);
        return !q || (p.name || "").toLowerCase().includes(q) || (sp?.name || "").toLowerCase().includes(q);
      }) : [];

      const wHtml = wFiltered.length ? `<h4>World Companions</h4><div class="wx-grid" style="margin-bottom:12px">${wFiltered.map((p) => {
        const sp = xSpecies(p.sp), lv = xPetLevel(p), stg = xPetStage(lv.level), rar = X_RARITY[sp?.[2] || "c"]?.[0] || "Common", on = xState?.active === p.sp;
        return `<article>
          <img src="${xPetUrl(p.sp, stg, "happy")}" alt="" style="width:52px;height:52px;object-fit:contain;margin:0 auto 4px;display:block">
          <strong>${esc(p.name || sp?.[1] || p.sp)} ${on ? "★" : ""}</strong>
          <small class="muted">${esc(rar)} · Lv.${lv.level} · Hunger ${Math.round(p.hunger ?? 100)}% · Joy ${Math.round(p.joy ?? 100)}%</small>
          <div class="wx-row">
            <button class="btn btn-sm${on ? "" : " btn-accent"}" type="button" data-wact="${esc(p.sp)}">${on ? "Active ✓" : "Summon"}</button>
            <button class="btn btn-sm" type="button" data-wpat="${esc(p.sp)}">Pat</button>
            ${bestTreat ? `<button class="btn btn-sm" type="button" data-wfeed="${esc(p.sp)}">Feed (${esc(X_TREATS[bestTreat]?.[0] || bestTreat)})</button>` : ""}
          </div>
        </article>`;
      }).join("")}</div>` : "";

      const bHtml = bFiltered.length ? `<h4>Moonwake Bay Critters</h4><div class="wx-grid">${bFiltered.map((p) => {
        const sp = baySpecie(p.sp), lv = bayPetLevel(p), rar = BAY_RARITY[sp?.r || "c"] || "Common", on = bayState?.active === p.id;
        const tags = [p.gold && "Gold", p.rainbow && "Rainbow", p.huge && "Huge", p.prism && "Prism", p.moon && "Moonlit", p.eclipse && "Eclipse", p.ride && (p.glide ? "Glider" : "Mount")].filter(Boolean).join(" · ");
        return `<article>
          <img src="${bayPetUrl(p.sp)}" alt="" style="width:52px;height:52px;object-fit:contain;margin:0 auto 4px;display:block">
          <strong>${esc(p.name || sp?.name || p.sp)} ${on ? "★" : ""}</strong>
          <small class="muted">${esc(rar)} · Lv.${lv}${tags ? ` · ${esc(tags)}` : ""}</small>
          <div class="wx-row">
            <button class="btn btn-sm${on ? "" : " btn-accent"}" type="button" data-bact="${esc(p.id)}">${on ? "Walking ✓" : "Walk With"}</button>
          </div>
        </article>`;
      }).join("")}</div>` : "";

      body = `
        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:10px">
          <input type="search" class="field" id="inv-q" placeholder="Filter pets…" value="${esc(query)}" style="max-width:220px">
          <div class="chips">${petCats}</div>
        </div>
        ${xState?.eggs?.length ? `<p class="hint">Incubating ${xState.eggs.length} egg${xState.eggs.length > 1 ? "s" : ""} — keep exploring to warm them!</p>` : ""}
        ${wHtml}${bHtml}${!wHtml && !bHtml ? `<p class="muted">No matching pets found. Hatch eggs in Winter/World or adopt critters at Moonwake Bay's Tidepool Shelter!</p>` : ""}`;
    } else {
      const canMake = (reqs) => Object.entries(reqs).every(([k, n]) => (bag()[k] || 0) >= n);
      const reqText = (reqs) => Object.entries(reqs).map(([k, n]) => `${esc(itemName(k))} ${bag()[k] || 0}/${n}`).join(" · ");

      body = `
        <h4>Craft Trinkets &amp; Lanterns</h4>
        <div class="se-mkt" style="margin-bottom:12px">
          ${TRINKETS.map(([id, name, desc, reqs]) => {
            const own = !!g.trinkets[id], ok = !own && canMake(reqs);
            return `<div class="se-good"><span><strong>${esc(name)}</strong><small>${esc(desc)} · ${reqText(reqs)}</small></span>${own ? `<span class="pill pill-done">Owned ✓</span>` : `<button type="button" class="btn btn-sm btn-accent" data-crt="${id}" ${ok ? "" : "disabled"}>Craft</button>`}</div>`;
          }).join("")}
          ${LANTERN_GEAR.slice(1).map(([id, name, desc, reqs]) => {
            const own = !!g.lanterns[id], ok = !own && canMake(reqs);
            return `<div class="se-good"><span><strong>${esc(name)}</strong><small>${esc(desc)} · ${reqText(reqs)}</small></span>${own ? `<span class="pill pill-done">Owned ✓</span>` : `<button type="button" class="btn btn-sm btn-accent" data-crl="${id}" ${ok ? "" : "disabled"}>Craft</button>`}</div>`;
          }).join("")}
        </div>
        <h4>Quick-Cook Meals</h4>
        <div class="wx-grid">
          ${MEALS.slice(0, 8).map((m) => {
            const ok = canMake(m[3]);
            return `<article><i class="wx-dot" style="background:${m[2]}"></i><strong>${esc(m[1])}</strong><small>${reqText(m[3])}</small><button type="button" class="btn btn-sm${ok ? " btn-accent" : ""}" data-cook="${m[0]}" ${ok ? "" : "disabled"}>Cook</button></article>`;
          }).join("")}
        </div>`;
    }

    panel(`Inventory & Gear · ${s.mon} mon`, `
      <div class="chips" style="margin-bottom:10px">${tabs}</div>
      ${extras.state.buff > Date.now() ? `<p class="hint">Well fed: ${Math.ceil((extras.state.buff - Date.now()) / 1000)}s of speed boost remaining.</p>` : ""}
      ${body}
    `, (e) => {
      e.querySelectorAll("[data-tab]").forEach((b) => (b.onclick = () => {
        if (b.dataset.tab === "legacy") return extras.bag("critters");
        open(b.dataset.tab);
      }));
      e.querySelectorAll("[data-cat]").forEach((b) => (b.onclick = () => { cat = b.dataset.cat; open(); }));
      e.querySelectorAll("[data-pcat]").forEach((b) => (b.onclick = () => { petCat = b.dataset.pcat; open(); }));
      e.querySelectorAll("[data-wact]").forEach((b) => (b.onclick = () => { if (!xState) return; xState.active = b.dataset.wact; saveXmas(); ping("choice"); hud(); open(); }));
      e.querySelectorAll("[data-wpat]").forEach((b) => (b.onclick = () => { if (xPat(b.dataset.wpat)) { ping("done"); hud(); open(); } else toast("Give them a moment before patting again!"); }));
      e.querySelectorAll("[data-wfeed]").forEach((b) => (b.onclick = () => { const tk = Object.entries(xState?.treats || {}).find(([, n]) => n > 0)?.[0]; if (tk && xFeed(b.dataset.wfeed, tk)) { ping("done"); toast(`Fed ${X_TREATS[tk][0]}!`); hud(); open(); } }));
      e.querySelectorAll("[data-bact]").forEach((b) => (b.onclick = () => { if (!bayState) return; bayState.active = b.dataset.bact; ping("choice"); save(); hud(); open(); }));
      const qEl = e.querySelector("#inv-q");
      if (qEl) qEl.oninput = (ev) => {
        const pos = ev.target.selectionStart ?? ev.target.value.length;
        query = ev.target.value;
        open();
        const next = document.querySelector("#inv-q");
        if (next) { next.focus(); try { next.setSelectionRange(pos, pos); } catch {} }
      };

      e.querySelectorAll("[data-eat]").forEach((b) => (b.onclick = () => {
        const it = findItem(b.dataset.eat);
        if (!it || !(bag()[it[0]] > 0)) return;
        bag()[it[0]]--;
        extras.state.buff = Math.max(extras.state.buff, Date.now()) + it[4] * 1000;
        ping("done"); save(); hud(); open();
      }));
      e.querySelectorAll("[data-sell]").forEach((b) => (b.onclick = () => {
        const it = findItem(b.dataset.sell);
        if (!it || !(bag()[it[0]] > 0)) return;
        bag()[it[0]]--;
        s.mon += itemVal(it);
        recordLostProperty(s, "item", it[1], `Sold at Foxfire Goods — spotted in a resident's basket.`);
        ping("blip"); save(); hud(); open();
      }));
      e.querySelectorAll("[data-sella]").forEach((b) => (b.onclick = () => {
        const it = findItem(b.dataset.sella), n = bag()[it?.[0]] || 0;
        if (!it || n < 1) return;
        bag()[it[0]] = 0;
        s.mon += itemVal(it) * n;
        recordLostProperty(s, "item", `${n}× ${it[1]}`, `Sold in bulk — distributed across town by the courier.`);
        ping("choice"); save(); hud(); toast(`Sold ${n}× ${it[1]} for ${itemVal(it) * n} mon.`); open();
      }));

      const untr = e.querySelector("#inv-untr");
      if (untr) untr.onclick = () => { g.trinket = ""; save(); open(); };
      e.querySelectorAll("[data-eqt]").forEach((b) => (b.onclick = () => { g.trinket = g.trinket === b.dataset.eqt ? "" : b.dataset.eqt; ping("choice"); save(); open(); }));
      e.querySelectorAll("[data-eql]").forEach((b) => (b.onclick = () => { g.lantern = b.dataset.eql; ping("choice"); save(); open(); }));
      e.querySelectorAll("[data-hat]").forEach((b) => (b.onclick = () => { s.hat = s.hat === b.dataset.hat ? "" : b.dataset.hat; ping("choice"); save(); open(); }));

      e.querySelectorAll("[data-crt]").forEach((b) => (b.onclick = () => {
        const t = TRINKETS.find((x) => x[0] === b.dataset.crt);
        if (!t || g.trinkets[t[0]] || !Object.entries(t[3]).every(([k, n]) => (bag()[k] || 0) >= n)) return;
        for (const [k, n] of Object.entries(t[3])) if (n > 0) bag()[k] = (bag()[k] || 0) - n;
        g.trinkets[t[0]] = 1; g.trinket = t[0];
        ping("done"); toast(`Crafted & equipped ${t[1]}!`); save(); hud(); open();
      }));
      e.querySelectorAll("[data-crl]").forEach((b) => (b.onclick = () => {
        const l = LANTERN_GEAR.find((x) => x[0] === b.dataset.crl);
        if (!l || g.lanterns[l[0]] || !Object.entries(l[3]).every(([k, n]) => (bag()[k] || 0) >= n)) return;
        for (const [k, n] of Object.entries(l[3])) if (n > 0) bag()[k] = (bag()[k] || 0) - n;
        g.lanterns[l[0]] = 1; g.lantern = l[0];
        ping("done"); toast(`Crafted & equipped ${l[1]}!`); save(); hud(); open();
      }));
      e.querySelectorAll("[data-cook]").forEach((b) => (b.onclick = () => {
        const m = MEALS.find((x) => x[0] === b.dataset.cook);
        if (!m || !Object.entries(m[3]).every(([k, n]) => (bag()[k] || 0) >= n)) return;
        for (const [k, n] of Object.entries(m[3])) if (n > 0) bag()[k] = (bag()[k] || 0) - n;
        extras.addItem(m[0], 1);
        ping("done"); toast(`Cooked ${m[1]}!`); save(); hud(); open();
      }));
    });
  }

  return { open, speedBonus, lightRadius, state: g };
}
