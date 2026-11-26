// The Lantern Exchange: buy and sell 6 Kitsune World commodities with daily shifting prices and P/L tracking.
import { esc, today } from "../util.js";

const GOODS = [
  { id: "oil", name: "Foxfire Oil", icon: "🕯️", base: 24, swing: 12 },
  { id: "brass", name: "Clockwork Brass", icon: "⚙️", base: 38, swing: 18 },
  { id: "silk", name: "Sakura Silk", icon: "🌸", base: 52, swing: 24 },
  { id: "glass", name: "Emerald Glass", icon: "💎", base: 74, swing: 34 },
  { id: "pearl", name: "Saltwick Pearls", icon: "🐚", base: 95, swing: 45 },
  { id: "dust", name: "Astral Dust", icon: "✨", base: 130, swing: 60 },
];

export function createExchange(o) {
  const { s, panel, toast, ping, save, hud, giveHat, addRenown } = o;
  const st = (s.exchange ||= {});
  st.day ||= "";
  st.shift ||= 0;
  st.hold ||= {};
  st.cost ||= {};
  st.profit ||= 0;

  function priceOf(g, shift = st.shift) {
    let h = 17 + shift * 97;
    for (const c of st.day + g.id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    const t = ((h % 1000) / 1000) * 2 - 1;
    return Math.max(8, Math.round(g.base + t * g.swing));
  }

  function prevPriceOf(g) {
    return st.shift > 0 ? priceOf(g, st.shift - 1) : g.base;
  }

  function ensureDay() {
    const t = today();
    if (st.day !== t) {
      st.day = t;
      st.shift = 0;
      st.bellDay = "";
      save();
    }
  }

  function open() {
    ensureDay();
    const canBell = st.bellDay !== today();
    const portVal = GOODS.reduce((a, g) => a + (st.hold[g.id] || 0) * priceOf(g), 0);

    const rows = GOODS.map((g) => {
      const p = priceOf(g), prev = prevPriceOf(g), diff = p - prev;
      const qty = st.hold[g.id] || 0;
      const avg = qty ? Math.round((st.cost[g.id] || 0) / qty) : 0;
      const trend = diff > 0 ? `<span style="color:#7dff8a">▲ +${diff}</span>` : diff < 0 ? `<span style="color:#ff7a8a">▼ ${diff}</span>` : `<span>—</span>`;
      return `<div class="se-good">
        <span>
          <strong>${g.icon} ${esc(g.name)} · ${p} mon</strong> ${trend}
          <small>Held: <b>${qty}</b>${qty ? ` (avg ${avg} mon)` : ""}</small>
        </span>
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          <button type="button" class="btn btn-accent" data-buy="${g.id}" ${s.mon < p ? "disabled" : ""}>Buy 1</button>
          <button type="button" class="btn" data-buy5="${g.id}" ${s.mon < p * 5 ? "disabled" : ""}>×5</button>
          <button type="button" class="btn" data-sell="${g.id}" ${qty < 1 ? "disabled" : ""}>Sell 1</button>
          <button type="button" class="btn" data-sella="${g.id}" ${qty < 1 ? "disabled" : ""}>All</button>
        </div>
      </div>`;
    }).join("");

    panel(`Lantern Exchange · ${s.mon} mon`, `
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:10px">
        <span class="muted">Portfolio: <strong>${portVal} mon</strong> · Realized Profit: <strong>${st.profit} mon</strong></span>
        <button type="button" class="btn btn-sm" id="ex-bell" ${canBell ? "" : "disabled"}>${canBell ? "🔔 Ring Market Bell (New Quotes)" : "Bell Rung Today"}</button>
      </div>
      <div class="se-mkt">${rows}</div>
    `, (e) => {
      const buyN = (id, n) => {
        const g = GOODS.find((x) => x.id === id);
        if (!g) return;
        const p = priceOf(g), total = p * n;
        if (s.mon < total) return toast("Not enough mon.");
        s.mon -= total;
        st.hold[id] = (st.hold[id] || 0) + n;
        st.cost[id] = (st.cost[id] || 0) + total;
        ping("choice"); save(); hud(); open();
      };

      const sellN = (id, n) => {
        const g = GOODS.find((x) => x.id === id);
        const qty = st.hold[id] || 0;
        if (!g || qty < n) return;
        const p = priceOf(g), rev = p * n;
        const avgCost = (st.cost[id] || 0) / qty;
        const gain = Math.round(rev - avgCost * n);
        st.hold[id] = qty - n;
        st.cost[id] = Math.max(0, Math.round((st.cost[id] || 0) - avgCost * n));
        s.mon += rev;
        st.profit += gain;
        if (gain > 0) addRenown?.(Math.min(25, Math.max(4, Math.floor(gain / 10))));
        if (st.profit >= 300 && !s.hats.includes("merchanthat")) {
          giveHat?.("merchanthat");
          toast(`+${rev} mon! 300+ trading profit unlocked the Merchant's Monocle!`);
        } else {
          toast(`Sold ${n} ${g.name} for ${rev} mon (${gain >= 0 ? "+" : ""}${gain} profit).`);
        }
        ping("done"); save(); hud(); open();
      };

      e.querySelectorAll("[data-buy]").forEach((b) => (b.onclick = () => buyN(b.dataset.buy, 1)));
      e.querySelectorAll("[data-buy5]").forEach((b) => (b.onclick = () => buyN(b.dataset.buy5, 5)));
      e.querySelectorAll("[data-sell]").forEach((b) => (b.onclick = () => sellN(b.dataset.sell, 1)));
      e.querySelectorAll("[data-sella]").forEach((b) => (b.onclick = () => sellN(b.dataset.sella, st.hold[b.dataset.sella] || 0)));
      const bell = e.querySelector("#ex-bell");
      if (bell) bell.onclick = () => {
        if (st.bellDay === today()) return;
        st.bellDay = today();
        st.shift++;
        ping("choice");
        toast("The Market Bell rings! New commodity quotes posted.");
        save(); open();
      };
    });
  }

  return { open, state: st };
}
