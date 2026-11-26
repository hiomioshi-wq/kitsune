// Night Market Raffle: buy tickets or use your daily free ticket for instant-draw mon, Lucky Ripples, and the Raffle Hat.
import { today } from "../util.js";

export function createRaffle(o) {
  const { s, panel, toast, ping, save, hud, giveHat, addRenown } = o;
  const st = (s.raffle ||= {});
  st.draws ||= 0;
  st.wins ||= 0;
  st.freeDay ||= "";

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

  function open() {
    const canFree = st.freeDay !== today();
    panel(`Night Market Raffle · ${s.mon} mon`, `
      <p class="muted">Draw a ticket from the Foxfire Drum! Win up to <strong>200 mon</strong>, Lucky Ripples, or the <strong>Lantern Master's Hat</strong>.</p>
      <p>Draws: <strong>${st.draws}</strong> · Prizes won: <strong>${st.wins}</strong></p>
      ${lastRes ? `<div class="hint" style="margin:10px 0">${lastRes}</div>` : ""}
      <div class="px-row">
        <button type="button" class="btn btn-accent" id="rf-go" ${!canFree && s.mon < 15 ? "disabled" : ""}>${canFree ? "Daily Free Ticket" : "Buy & Draw Ticket (15 mon)"}</button>
      </div>
    `, (e) => {
      e.querySelector("#rf-go").onclick = () => drawTicket(st.freeDay !== today() ? 0 : 15);
    });
  }

  return { open, state: st };
}
