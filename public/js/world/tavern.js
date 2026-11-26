// The Fox & Lantern Tavern: Blackjack, Foxfire Dice, Lantern Slots, and Tavern Tonics & Rumors.
import { esc } from "../util.js";

const SUITS = ["♠", "♥", "♦", "♣"];
const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
const REEL_ICONS = ["🦊", "🏮", "🍒", "⭐", "💎", "🔔"];

function handVal(cards) {
  let sum = 0, aces = 0;
  for (const c of cards) {
    if (c.r === "A") { sum += 11; aces++; }
    else if (["K", "Q", "J"].includes(c.r)) sum += 10;
    else sum += +c.r;
  }
  while (sum > 21 && aces > 0) { sum -= 10; aces--; }
  return sum;
}

export function createTavern(o) {
  const { s, panel, toast, ping, save, hud, giveHat, giveFurn, addRenown, LANTERNS, REGIONS, BOUNTIES, nameOf } = o;
  const st = (s.tavern ||= {});
  st.plays ||= 0;
  st.wins ||= 0;
  st.jackpot ||= 250;

  let tab = "bj"; // "bj" | "dice" | "slots" | "bar"
  let bj = null;
  let wager = 25;
  let diceRes = null;
  let slotRes = ["🦊", "🏮", "⭐"];
  let spinning = false;

  const newDeck = () => {
    const d = [];
    for (const su of SUITS) for (const r of RANKS) d.push({ r, su, red: su === "♥" || su === "♦" });
    for (let i = d.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [d[i], d[j]] = [d[j], d[i]]; }
    return d;
  };

  const cardHtml = (c, hide = false) => hide
    ? `<span style="display:inline-flex;align-items:center;justify-content:center;width:48px;height:68px;border-radius:8px;border:2px solid #d9a84e;background:#2b1d36;color:#ffd84d;font:800 18px system-ui">🦊</span>`
    : `<span style="display:inline-flex;flex-direction:column;align-items:center;justify-content:center;width:48px;height:68px;border-radius:8px;border:2px solid #d9a84e;background:#fff8eb;color:${c.red ? "#c82838" : "#1a1824"};font:800 15px system-ui"><span>${c.r}</span><small>${c.su}</small></span>`;

  const rewardUnlock = () => {
    if (st.wins >= 3 && !s.hats.includes("tavernhat")) {
      giveHat?.("tavernhat");
      toast("3 Tavern wins! You earned the Fox & Lantern Cap!");
    }
    if (st.plays >= 10 && !s.furn?.taverntable) {
      giveFurn?.("taverntable");
      toast("Tavern Regular! An Oak Tavern Table was sent to your house.");
    }
  };

  function open(nextTab = tab) {
    tab = nextTab;
    const tabs = [
      ["bj", "Blackjack 21"],
      ["dice", "Foxfire Dice"],
      ["slots", "Lantern Slots"],
      ["bar", "Tonics & Rumors"],
    ].map(([k, l]) => `<button type="button" class="chip${tab === k ? " on" : ""}" data-tab="${k}">${l}</button>`).join("");

    const wagerRow = [10, 25, 50, 100].map((v) =>
      `<button type="button" class="chip${wager === v ? " on" : ""}" data-wg="${v}">${v} mon</button>`
    ).join("");

    let body = "";
    if (tab === "bj") {
      if (!bj) {
        body = `<p class="muted">Beat the Fox Croupier without going over 21. Natural Blackjack pays 2.5×.</p>
          <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin:10px 0"><strong>Wager:</strong>${wagerRow}</div>
          <button type="button" class="btn btn-accent" id="tv-deal" ${s.mon < wager ? "disabled" : ""}>Deal (${wager} mon)</button>`;
      } else {
        const pv = handVal(bj.p), dv = handVal(bj.d);
        body = `
          <div style="display:flex;flex-direction:column;gap:12px">
            <div><strong>Croupier ${bj.over ? `(${dv})` : ""}</strong><div style="display:flex;gap:8px;margin-top:6px;flex-wrap:wrap">${bj.d.map((c, i) => cardHtml(c, !bj.over && i === 1)).join("")}</div></div>
            <div><strong>Your Hand (${pv})</strong><div style="display:flex;gap:8px;margin-top:6px;flex-wrap:wrap">${bj.p.map((c) => cardHtml(c)).join("")}</div></div>
            ${bj.msg ? `<p><strong>${esc(bj.msg)}</strong></p>` : ""}
            <div class="px-row">
              ${bj.over
                ? `<button type="button" class="btn btn-accent" id="tv-again">Play Again</button>`
                : `<button type="button" class="btn btn-accent" id="tv-hit">Hit</button>
                   <button type="button" class="btn" id="tv-stand">Stand</button>
                   ${bj.p.length === 2 && s.mon >= bj.bet ? `<button type="button" class="btn" id="tv-dbl">Double (${bj.bet})</button>` : ""}`}
            </div>
          </div>`;
      }
    } else if (tab === "dice") {
      body = `<p class="muted">Roll three foxfire dice (3–18). Guess Under 10 (2×), Over 11 (2×), 10 or 11 (4×), or Triple (30×)!</p>
        <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin:10px 0"><strong>Wager:</strong>${wagerRow}</div>
        ${diceRes ? `<div style="font-size:28px;margin:10px 0">${diceRes.dice.map((d) => ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"][d - 1]).join(" ")} <strong style="font-size:16px">Total: ${diceRes.sum}</strong> — <span class="muted">${esc(diceRes.msg)}</span></div>` : ""}
        <div class="chips" style="margin-top:8px">
          <button type="button" class="btn btn-accent" data-dice="low" ${s.mon < wager ? "disabled" : ""}>Under 10 (2×)</button>
          <button type="button" class="btn btn-accent" data-dice="mid" ${s.mon < wager ? "disabled" : ""}>10 or 11 (4×)</button>
          <button type="button" class="btn btn-accent" data-dice="high" ${s.mon < wager ? "disabled" : ""}>Over 11 (2×)</button>
          <button type="button" class="btn" data-dice="triple" ${s.mon < wager ? "disabled" : ""}>Any Triple (30×)</button>
        </div>`;
    } else if (tab === "slots") {
      body = `<p class="muted">Match 2 for 2×, match 3 for 12×, or hit 🦊🦊🦊 for the progressive Tavern Jackpot!</p>
        <div class="pill" style="border-color:#ffd84d;margin:6px 0">🏆 Tavern Jackpot: <strong>${st.jackpot} mon</strong></div>
        <div id="tv-reels" style="display:flex;gap:12px;justify-content:center;padding:18px;background:rgba(0,0,0,.35);border:2px solid #d9a84e;border-radius:14px;font-size:44px;margin:10px 0">${slotRes.map((r) => `<span>${r}</span>`).join("")}</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin:10px 0"><strong>Wager:</strong>${wagerRow}</div>
        <button type="button" class="btn btn-accent" id="tv-pull" ${spinning || s.mon < wager ? "disabled" : ""}>Pull Lever (${wager} mon)</button>`;
    } else {
      const nextLantern = LANTERNS?.find((l) => !s.lit?.[l.id]);
      const unvisited = REGIONS ? Object.entries(REGIONS).find(([k]) => !s.visited?.[k]) : null;
      const openBounty = BOUNTIES?.find((b) => !s.bounty?.done?.[b.id]);
      const rumors = [
        nextLantern ? `The ${nextLantern.name} lantern is still out — ${nameOf ? nameOf(nextLantern.who) : nextLantern.who} knows the way.` : "All eight country lanterns are burning bright!",
        unvisited ? `Travelers say ${unvisited[1][0]} lies waiting off the beaten path.` : "You've set foot in every major region of the country!",
        openBounty ? `A bounty notice hangs by the door: "${openBounty.name}" (recommended level ${openBounty.lv}).` : "Every bounty board in the country has been cleared!",
      ];
      body = `
        <div class="se-mkt">
          <div class="se-good"><span><strong>🍺 Spiced Harvest Cider</strong><small>+5 Lucky Ripples for easier fishing</small></span><button type="button" class="btn btn-accent" id="tv-cider" ${s.mon < 15 ? "disabled" : ""}>15 mon</button></div>
          <div class="se-good"><span><strong>☕ Foxfire Espresso</strong><small>+40 mon Reading/Tavern tip &amp; instant cheer</small></span><button type="button" class="btn btn-accent" id="tv-esp" ${s.mon < 25 ? "disabled" : ""}>25 mon</button></div>
        </div>
        <h3 style="margin-top:14px">Tavern Rumors</h3>
        <ul class="wd-list">${rumors.map((r) => `<li><span>${esc(r)}</span></li>`).join("")}</ul>`;
    }

    panel(`Fox & Lantern Tavern · ${s.mon} mon`, `
      <p class="muted" style="margin:0 0 8px">Plays: <strong>${st.plays}</strong> · Wins: <strong>${st.wins}</strong> (3 wins unlocks a Hat; 10 plays unlocks an Oak Table)</p>
      <div class="chips" style="margin-bottom:12px">${tabs}</div>
      ${body}
    `, (e) => {
      e.querySelectorAll("[data-tab]").forEach((b) => (b.onclick = () => { if (!spinning) open(b.dataset.tab); }));
      e.querySelectorAll("[data-wg]").forEach((b) => (b.onclick = () => { if (!spinning) { wager = +b.dataset.wg; open(); } }));

      const dealBtn = e.querySelector("#tv-deal");
      if (dealBtn) dealBtn.onclick = () => {
        if (s.mon < wager) return toast("Not enough mon.");
        s.mon -= wager; st.plays++;
        const deck = newDeck();
        bj = { deck, p: [deck.pop(), deck.pop()], d: [deck.pop(), deck.pop()], bet: wager, over: false, msg: "" };
        if (handVal(bj.p) === 21) {
          bj.over = true;
          const won = Math.round(bj.bet * 2.5);
          s.mon += won; st.wins++; addRenown?.(20);
          bj.msg = `Blackjack! Won ${won} mon!`;
          ping("done"); rewardUnlock();
        } else ping("choice");
        save(); hud(); open();
      };

      const finishBj = (stand = false) => {
        const pv = handVal(bj.p);
        if (pv > 21) {
          bj.over = true; bj.msg = `Bust (${pv})! House wins.`; ping("blip");
        } else if (stand) {
          while (handVal(bj.d) < 17) bj.d.push(bj.deck.pop());
          const dv = handVal(bj.d);
          bj.over = true;
          if (dv > 21 || pv > dv) {
            const won = bj.bet * 2;
            s.mon += won; st.wins++; addRenown?.(12);
            bj.msg = `You win ${won} mon! (${pv} vs ${dv})`; ping("done"); rewardUnlock();
          } else if (pv === dv) {
            s.mon += bj.bet;
            bj.msg = `Push (${pv}). Bet returned.`; ping("choice");
          } else {
            bj.msg = `Croupier wins (${dv} vs ${pv}).`; ping("blip");
          }
        }
        save(); hud(); open();
      };

      const hitBtn = e.querySelector("#tv-hit");
      if (hitBtn) hitBtn.onclick = () => { bj.p.push(bj.deck.pop()); if (handVal(bj.p) >= 21) finishBj(handVal(bj.p) === 21); else { ping("blip"); open(); } };
      const standBtn = e.querySelector("#tv-stand");
      if (standBtn) standBtn.onclick = () => finishBj(true);
      const dblBtn = e.querySelector("#tv-dbl");
      if (dblBtn) dblBtn.onclick = () => {
        if (s.mon < bj.bet) return;
        s.mon -= bj.bet; bj.bet *= 2;
        bj.p.push(bj.deck.pop());
        finishBj(true);
      };
      const againBtn = e.querySelector("#tv-again");
      if (againBtn) againBtn.onclick = () => { bj = null; open(); };

      e.querySelectorAll("[data-dice]").forEach((b) => {
        b.onclick = () => {
          if (s.mon < wager) return toast("Not enough mon.");
          s.mon -= wager; st.plays++;
          const d1 = 1 + Math.floor(Math.random() * 6), d2 = 1 + Math.floor(Math.random() * 6), d3 = 1 + Math.floor(Math.random() * 6);
          const sum = d1 + d2 + d3, pick = b.dataset.dice;
          const isTriple = d1 === d2 && d2 === d3;
          let mul = 0;
          if (pick === "low" && sum < 10) mul = 2;
          else if (pick === "mid" && (sum === 10 || sum === 11)) mul = 4;
          else if (pick === "high" && sum > 11) mul = 2;
          else if (pick === "triple" && isTriple) mul = 30;
          const won = wager * mul;
          if (won > 0) {
            s.mon += won; st.wins++; addRenown?.(mul >= 30 ? 50 : 10);
            diceRes = { dice: [d1, d2, d3], sum, msg: `Won ${won} mon!` };
            ping("done"); rewardUnlock();
          } else {
            diceRes = { dice: [d1, d2, d3], sum, msg: "No luck this roll." };
            ping("blip");
          }
          save(); hud(); open();
        };
      });

      const pullBtn = e.querySelector("#tv-pull");
      if (pullBtn) pullBtn.onclick = () => {
        if (spinning || s.mon < wager) return;
        spinning = true;
        s.mon -= wager; st.plays++;
        st.jackpot += Math.max(4, Math.round(wager * 0.15));
        save(); hud(); ping("choice");
        const reelsEl = e.querySelector("#tv-reels");
        let ticks = 0;
        const timer = setInterval(() => {
          if (!reelsEl.isConnected) { clearInterval(timer); spinning = false; return; }
          const r = [0, 1, 2].map(() => REEL_ICONS[Math.floor(Math.random() * REEL_ICONS.length)]);
          reelsEl.innerHTML = r.map((x) => `<span>${x}</span>`).join("");
          if (++ticks >= 12) {
            clearInterval(timer);
            spinning = false;
            slotRes = r;
            const [a, b, c] = r;
            let won = 0;
            if (a === "🦊" && b === "🦊" && c === "🦊") {
              won = st.jackpot; st.jackpot = 250;
              toast(`FOXFIRE JACKPOT! +${won} mon!`);
            } else if (a === b && b === c) {
              won = wager * 12;
              toast(`Triple ${a}! +${won} mon!`);
            } else if (a === b || b === c || a === c) {
              won = wager * 2;
              toast(`Pair! +${won} mon!`);
            }
            if (won > 0) { s.mon += won; st.wins++; addRenown?.(15); ping("done"); rewardUnlock(); }
            else ping("blip");
            save(); hud(); open();
          }
        }, 85);
      };

      const ciderBtn = e.querySelector("#tv-cider");
      if (ciderBtn) ciderBtn.onclick = () => {
        if (s.mon < 15) return;
        s.mon -= 15; s.luck = (s.luck || 0) + 5;
        ping("done"); toast("Warm spiced cider! +5 Lucky Ripples for fishing.");
        save(); hud(); open();
      };
      const espBtn = e.querySelector("#tv-esp");
      if (espBtn) espBtn.onclick = () => {
        if (s.mon < 25) return;
        s.mon -= 25; addRenown?.(25);
        ping("done"); toast("Foxfire Espresso! +25 Renown.");
        save(); hud(); open();
      };
    });
  }

  return { open, state: st };
}
