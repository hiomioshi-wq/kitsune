// The Lantern Auction House: daily rotating lots of rare hats, furniture, luck charms, and materials with rival NPC bidding.
import { esc, today } from "../util.js";

const LOTS_POOL = [
  { id: "hat_witch", kind: "hat", ref: "witch", name: "Good Witch's Hat", desc: "A pointed brimmed hat from the Oz border.", start: 45, buyout: 110 },
  { id: "hat_crown", kind: "hat", ref: "crown", name: "Emerald Crown", desc: "Cut from Emerald City bottle-glass.", start: 80, buyout: 195 },
  { id: "furn_cat", kind: "furn", ref: "cat", name: "Glass Cat", desc: "A translucent centerpiece for your house.", start: 55, buyout: 135 },
  { id: "furn_radio", kind: "furn", ref: "radio", name: "Moth Radio", desc: "Hums softly when left near a window.", start: 30, buyout: 75 },
  { id: "luck_5", kind: "luck", ref: 5, name: "Jar of 5 Lucky Ripples", desc: "Makes your next 5 fish catches much easier.", start: 20, buyout: 55 },
  { id: "motes_40", kind: "motes", ref: 40, name: "40 Astral Motes", desc: "For forging relics at the Astral Nexus.", start: 35, buyout: 95 },
  { id: "renown_80", kind: "renown", ref: 80, name: "Sealed Guild Chronicle", desc: "Grants +80 Renown immediately.", start: 40, buyout: 100 },
  { id: "hat_top", kind: "hat", ref: "top", name: "Clockmaker's Top Hat", desc: "Runs three seconds fast.", start: 35, buyout: 90 },
];

export function createAuction(o) {
  const { s, people, panel, toast, ping, save, hud, giveHat, addRenown } = o;
  const st = (s.auction ||= {});
  st.day ||= "";
  st.lots ||= [];
  st.won ||= 0;

  function ensureDay() {
    const t = today();
    if (st.day === t && st.lots.length) return;
    st.day = t;
    let h = 19;
    for (const c of t) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    const pool = [...LOTS_POOL];
    const picked = [];
    for (let i = 0; i < 3 && pool.length; i++) {
      h = (Math.imul(h ^ (h >>> 13), 1274126177) + 7) >>> 0;
      const idx = h % pool.length;
      const lot = pool.splice(idx, 1)[0];
      const rival = people[(h + i * 3) % people.length]?.n[2] || "A Collector";
      picked.push({ ...lot, cur: lot.start, leader: rival, sold: false, mine: false });
    }
    st.lots = picked;
    save();
  }

  function grantLot(lot) {
    if (lot.kind === "hat") giveHat?.(lot.ref);
    else if (lot.kind === "furn") s.furn[lot.ref] = (s.furn[lot.ref] || 0) + 1;
    else if (lot.kind === "luck") s.luck = (s.luck || 0) + lot.ref;
    else if (lot.kind === "motes") { s.nexus ||= {}; s.nexus.motes = (s.nexus.motes || 0) + lot.ref; }
    else if (lot.kind === "renown") addRenown?.(lot.ref);
  }

  function open() {
    ensureDay();
    const cards = st.lots.map((lot, i) => {
      if (lot.sold) {
        return `<div class="se-good"><span><strong>${esc(lot.name)}</strong><small>${lot.mine ? "Won by you!" : `Sold to ${esc(lot.leader)}`} for ${lot.cur} mon</small></span><span class="pill ${lot.mine ? "pill-done" : ""}">${lot.mine ? "Yours ✓" : "Sold"}</span></div>`;
      }
      return `<div class="se-good">
        <span>
          <strong>${esc(lot.name)}</strong>
          <small>${esc(lot.desc)}</small>
          <small>Current bid: <b>${lot.cur} mon</b> (${lot.mine ? "You lead!" : `Leader: ${esc(lot.leader)}`})</small>
        </span>
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          <button type="button" class="btn btn-accent" data-bid="${i}" ${lot.mine || s.mon < lot.cur + 10 ? "disabled" : ""}>Bid ${lot.cur + 10}</button>
          <button type="button" class="btn" data-buy="${i}" ${s.mon < lot.buyout ? "disabled" : ""}>Buyout ${lot.buyout}</button>
          ${lot.mine ? `<button type="button" class="btn btn-accent" data-gavel="${i}">Hammer!</button>` : ""}
        </div>
      </div>`;
    }).join("");

    panel(`Lantern Auction House · ${s.mon} mon`, `
      <p class="muted">Three daily lots. Outbid rival collectors and strike the hammer to claim, or pay Buyout to take it immediately. (${st.won} auctions won)</p>
      <div class="se-mkt">${cards}</div>
    `, (e) => {
      e.querySelectorAll("[data-bid]").forEach((b) => {
        b.onclick = () => {
          const lot = st.lots[+b.dataset.bid];
          if (!lot || lot.sold || lot.mine || lot.cur >= lot.buyout - 1) return;
          const next = Math.min(lot.buyout - 1, lot.cur + 10);
          if (s.mon < next) return toast("Not enough mon.");
          lot.cur = next;
          lot.mine = true;
          lot.leader = "You";
          ping("choice");
          // Rival may counter-bid if below 75% of buyout
          if (lot.cur < Math.floor(lot.buyout * 0.72) && Math.random() < 0.5) {
            const rival = people[Math.floor(Math.random() * people.length)]?.n[2] || "A Collector";
            lot.cur += 5;
            lot.mine = false;
            lot.leader = rival;
            toast(`${rival} counter-bid ${lot.cur} mon!`);
          }
          save(); open();
        };
      });

      e.querySelectorAll("[data-gavel]").forEach((b) => {
        b.onclick = () => {
          const lot = st.lots[+b.dataset.gavel];
          if (!lot || lot.sold || !lot.mine) return;
          if (s.mon < lot.cur) return toast("Not enough mon.");
          s.mon -= lot.cur;
          lot.sold = true;
          st.won++;
          grantLot(lot);
          ping("done");
          toast(`Sold! Claimed ${lot.name} for ${lot.cur} mon.`);
          save(); hud(); open();
        };
      });

      e.querySelectorAll("[data-buy]").forEach((b) => {
        b.onclick = () => {
          const lot = st.lots[+b.dataset.buy];
          if (!lot || lot.sold) return;
          if (s.mon < lot.buyout) return toast("Not enough mon.");
          s.mon -= lot.buyout;
          lot.cur = lot.buyout;
          lot.sold = true;
          lot.mine = true;
          st.won++;
          grantLot(lot);
          ping("done");
          toast(`Bought out ${lot.name} for ${lot.buyout} mon!`);
          save(); hud(); open();
        };
      });
    });
  }

  return { open, state: st };
}
