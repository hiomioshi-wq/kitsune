// Foxhold Origami Studio: fold paper crafts from pages/silk or supplies and sell them to collectors for mon & Renown.
import { esc } from "../util.js";
import { item as findItem } from "./extras.js";

const MODELS = [
  { id: "fox", name: "Paper Fox", icon: "🦊", cost: 8, need: { page: 1 }, sell: 24, ren: 12 },
  { id: "boat", name: "Lantern Paper Boat", icon: "⛵", cost: 10, need: { page: 1, herb: 1 }, sell: 32, ren: 16 },
  { id: "crane", name: "Silk-Wing Crane", icon: "🕊️", cost: 16, need: { silk: 1 }, sell: 46, ren: 20 },
  { id: "star", name: "Nine-Tail Star", icon: "⭐", cost: 22, need: { page: 1, gold: 1 }, sell: 68, ren: 30 },
  { id: "moth", name: "Juno Pell Paper Moth", icon: "🦋", cost: 14, need: { page: 1, ink: 1 }, sell: 42, ren: 22 },
  { id: "hound8", name: "Eight-Legged Biscuit", icon: "🐕", cost: 18, need: { page: 2 }, sell: 52, ren: 26 },
  { id: "galleon", name: "Elysian Paper Galleon", icon: "🚢", cost: 24, need: { silk: 1, shell: 1 }, sell: 72, ren: 32 },
  { id: "quorum", name: "Quorum Paper Duck", icon: "🦆", cost: 28, need: { page: 2, gold: 1 }, sell: 84, ren: 38 },
];

export function createOrigami(o) {
  const { s, panel, toast, ping, save, hud, extras, addRenown } = o;
  const st = (s.origami ||= {});
  st.folded ||= 0;

  const bag = () => extras.state.bag;

  function open() {
    const canFold = (reqs) => Object.entries(reqs).every(([k, n]) => (bag()[k] || 0) >= n);
    const reqTxt = (reqs) => Object.entries(reqs).map(([k, n]) => `${esc(findItem(k)?.[1] || k)} ${bag()[k] || 0}/${n}`).join(" · ");

    const rows = MODELS.map((m) => {
      const ok = canFold(m.need);
      return `<div class="se-good">
        <span>
          <strong>${m.icon} ${esc(m.name)}</strong>
          <small>Sells for ${m.sell} mon &amp; +${m.ren} Renown · Needs: ${reqTxt(m.need)}</small>
        </span>
        <div style="display:flex;gap:6px">
          <button type="button" class="btn btn-sm btn-accent" data-fd="${m.id}" ${ok ? "" : "disabled"}>Fold &amp; Sell</button>
          <button type="button" class="btn btn-sm" data-by="${m.id}" ${s.mon < m.cost ? "disabled" : ""}>Paper (${m.cost})</button>
        </div>
      </div>`;
    }).join("");

    panel(`Foxhold Origami Studio · ${st.folded} Folded`, `
      <p class="muted">Fold paper crafts using Waterlogged Pages or Umbrella Silk from your inventory, or buy fresh craft paper at the desk.</p>
      <div class="se-mkt">${rows}</div>
    `, (e) => {
      const finish = (m) => {
        st.folded++;
        s.mon += m.sell;
        addRenown?.(m.ren);
        ping("done");
        toast(`Folded ${m.name}! Sold for +${m.sell} mon & +${m.ren} Renown!`);
        save(); hud(); open();
      };

      e.querySelectorAll("[data-fd]").forEach((b) => {
        b.onclick = () => {
          const m = MODELS.find((x) => x.id === b.dataset.fd);
          if (!m || !canFold(m.need)) return;
          for (const [k, n] of Object.entries(m.need)) bag()[k] -= n;
          finish(m);
        };
      });

      e.querySelectorAll("[data-by]").forEach((b) => {
        b.onclick = () => {
          const m = MODELS.find((x) => x.id === b.dataset.by);
          if (!m || s.mon < m.cost) return;
          const d = new Date().toDateString();
          if (st.paperDay !== d) { st.paperDay = d; st.paperN = 0; }
          if ((st.paperN || 0) >= 5) return toast("Desk is out of fresh paper for today (5/day).");
          s.mon -= m.cost;
          st.paperN++;
          bag().page = (bag().page || 0) + 1;
          ping("choice");
          toast(`Bought 1 craft paper (Waterlogged Page) for ${m.cost} mon.`);
          save(); hud(); open();
        };
      });
    });
  }

  return { open, state: st };
}
