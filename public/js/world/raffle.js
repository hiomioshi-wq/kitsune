// Night Market Raffle: buy tickets or use your daily free ticket for instant-draw mon, Lucky Ripples, and the Raffle Hat.
import { today } from "../util.js";

export function createRaffle(o) {
  const { s, panel, toast, ping, save, hud, giveHat, addRenown } = o;
  const st = (s.raffle ||= {});
  st.draws ||= 0;
  st.wins ||= 0;
  st.freeDay ||= "";
  st.forgeries ||= [];

  const FORGE_NAMES = [
    "Replica Lantern Crown",
    "Faux Foxfire Beret",
    "Counterfeit Courier Cap",
    "Gilded Starlight Tricorne",
    "Replica Meridian Visor",
    "Faux Accreditation Goose Cap",
    "Counterfeit Sovereign Tricorne",
    "Replica Pink Ribbon Beret",
  ];

  function craftForgery() {
    if (s.mon < 25) return toast("Need 25 mon for replica silk and gilt thread.");
    s.mon -= 25;
    const bonus = Math.min(18, (s.hats?.length || 0) * 2);
    const quality = Math.min(99, 45 + bonus + Math.floor(Math.random() * 45));
    const name = FORGE_NAMES[st.forgeries.length % FORGE_NAMES.length];
    st.forgeries.push({ id: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, name, quality });
    lastRes = `🪡 Crafted <strong>${name}</strong> (craft: ${quality}%). Take it to the Detective Agency for appraisal!`;
    ping("choice"); toast(`Crafted ${name}! Have the Detective Agency appraise it.`);
    save(); hud(); open();
  }

  let lastRes = null;

  function drawTicket(cost) {
    if (cost > 0 && s.mon < cost) return toast("Not enough mon.");
    if (cost > 0) s.mon -= cost;
    else st.freeDay = today();
    st.draws++;

    const roll = Math.random();
    if (roll < 0.02) {
      const won = 200;
      s.mon += won;
      st.wins++;
      addRenown?.(45);
      if (!s.hats.includes("lanternmaster")) {
        giveHat?.("lanternmaster");
        lastRes = `🌟 GRAND PRIZE! +${won} mon & Lantern Master's Hat!`;
      } else {
        lastRes = `🌟 GRAND PRIZE! +${won} mon!`;
      }
      ping("done");
    } else if (roll < 0.07) {
      s.mon += 75;
      st.wins++;
      addRenown?.(20);
      lastRes = "🎉 Second Prize! +75 mon & +20 Renown!";
      ping("done");
    } else if (roll < 0.22) {
      s.mon += 30;
      st.wins++;
      addRenown?.(10);
      lastRes = "🏮 Third Prize! +30 mon!";
      ping("choice");
    } else {
      s.luck = (s.luck || 0) + 1;
      lastRes = "🍀 Consolation Prize: +1 Lucky Ripple for fishing!";
      ping("blip");
    }
    toast(lastRes);
    save(); hud(); open();
  }

  function drawBundle() {
    if (s.mon < 65) return toast("Need 65 mon for a 5-ticket bundle.");
    s.mon -= 65;
    let wonTotal = 0, luckTotal = 0, big = false;
    for (let i = 0; i < 5; i++) {
      st.draws++;
      const roll = Math.random();
      if (roll < 0.02) {
        wonTotal += 200; st.wins++; addRenown?.(45); big = true;
        if (!s.hats.includes("lanternmaster")) giveHat?.("lanternmaster");
      } else if (roll < 0.07) { wonTotal += 75; st.wins++; addRenown?.(20); }
      else if (roll < 0.22) { wonTotal += 30; st.wins++; addRenown?.(10); }
      else { luckTotal++; }
    }
    s.mon += wonTotal; s.luck = (s.luck || 0) + luckTotal;
    lastRes = `🎟️ 5-Ticket Bundle: +${wonTotal} mon & +${luckTotal} Lucky Ripples${big ? " (GRAND PRIZE!)" : ""}!`;
    ping(wonTotal ? "done" : "blip"); toast(lastRes);
    save(); hud(); open();
  }

  function open() {
    const canFree = st.freeDay !== today();
    const forgeList = st.forgeries.map((f) => `<span class="pill">🎩 ${f.name} (${f.quality}%)</span>`).join(" ");
    panel(`Night Market Raffle · ${s.mon} mon`, `
      <p class="muted">Draw a ticket from the Foxfire Drum! Win up to <strong>200 mon</strong>, Lucky Ripples, or the <strong>Lantern Master's Hat</strong>.</p>
      <p>Draws: <strong>${st.draws}</strong> · Prizes won: <strong>${st.wins}</strong></p>
      ${lastRes ? `<div class="hint" style="margin:10px 0">${lastRes}</div>` : ""}
      <div class="px-row" style="margin-bottom:12px">
        <button type="button" class="btn btn-accent" id="rf-go" ${!canFree && s.mon < 15 ? "disabled" : ""}>${canFree ? "Daily Free Ticket" : "Buy & Draw Ticket (15 mon)"}</button>
        <button type="button" class="btn btn-accent" id="rf-5" ${s.mon < 65 ? "disabled" : ""}>5-Ticket Bundle (65 mon)</button>
        <button type="button" class="btn" id="rf-forge" ${s.mon < 25 ? "disabled" : ""}>Forge Replica Hat (25 mon)</button>
      </div>
      <h4>🎩 Night Market Forgeries (${st.forgeries.length})</h4>
      <p class="muted">Stitch a replica hat blank here, then visit the <strong>Foxglove Detective Agency</strong> to see if your forgery passes inspection (+95 mon if quality ≥ 65%).</p>
      ${forgeList ? `<div class="chips">${forgeList}</div>` : ""}
    `, (e) => {
      e.querySelector("#rf-go").onclick = () => drawTicket(st.freeDay !== today() ? 0 : 15);
      e.querySelector("#rf-5").onclick = drawBundle;
      e.querySelector("#rf-forge").onclick = craftForgery;
    });
  }

  return { open, state: st };
}
