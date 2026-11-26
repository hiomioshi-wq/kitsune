// Foxhold Museum: donate collected World items and artifacts to complete 4 themed exhibition wings for mon, Renown, and Curator rewards.
import { esc } from "../util.js";
import { item as findItem } from "./extras.js";

const EXHIBITS = [
  { id: "ex_lantern", wing: "Lantern Era", name: "Amber Mushroom", item: "mushroom", qty: 3, mon: 35, ren: 15, desc: "Bioluminescent cap from Hollow Pine." },
  { id: "ex_honey", wing: "Lantern Era", name: "Hollow Pine Comb", item: "honey", qty: 2, mon: 45, ren: 20, desc: "Golden wildflower honey." },
  { id: "ex_berry", wing: "Lantern Era", name: "Preserved Snowberry", item: "berry", qty: 3, mon: 40, ren: 15, desc: "Frost-sweetened winter berry." },
  { id: "ex_herb", wing: "Lantern Era", name: "Pressed Tea Leaf", item: "herb", qty: 4, mon: 30, ren: 15, desc: "Steeped too long, as Ponzu insists." },

  { id: "ex_gear", wing: "Clockwork & Rails", name: "Three-Second Gear", item: "gear", qty: 2, mon: 50, ren: 20, desc: "Always three seconds behind noon." },
  { id: "ex_spring", wing: "Clockwork & Rails", name: "Mainspring Coil", item: "spring", qty: 2, mon: 45, ren: 20, desc: "Recovered from Brask's clock tower." },
  { id: "ex_ticket", wing: "Clockwork & Rails", name: "Unpunched Sleeper Ticket", item: "ticket", qty: 2, mon: 55, ren: 25, desc: "Destination: Tsukimi, Platform Zero." },
  { id: "ex_coal", wing: "Clockwork & Rails", name: "Midnight Locomotive Coal", item: "coal", qty: 3, mon: 40, ren: 15, desc: "Burns with a faint blue spark." },

  { id: "ex_shell", wing: "Sunken & Sea", name: "Saltwick Spiral Shell", item: "shell", qty: 3, mon: 40, ren: 15, desc: "Echoes the Moonwake ferry bell." },
  { id: "ex_pearl", wing: "Sunken & Sea", name: "Tide-Worn Pearl", item: "pearl", qty: 1, mon: 65, ren: 30, desc: "Found along Saltwick Shore." },
  { id: "ex_lily", wing: "Sunken & Sea", name: "Drowned Reservoir Lily", item: "lily", qty: 2, mon: 55, ren: 25, desc: "Blooms only over sunken rooftops." },
  { id: "ex_page", wing: "Sunken & Sea", name: "Waterlogged Folio", item: "page", qty: 2, mon: 50, ren: 20, desc: "Recovered from the Lake Library." },

  { id: "ex_emerald", wing: "Oz & Astral", name: "Emerald Bottle-Glass", item: "emerald", qty: 1, mon: 75, ren: 35, desc: "Cut in Master Indigo's workshop." },
  { id: "ex_poppy", wing: "Oz & Astral", name: "Pressed Sleepy Poppy", item: "poppy", qty: 3, mon: 45, ren: 20, desc: "Fragrant crimson petal from Oz." },
  { id: "ex_quartz", wing: "Oz & Astral", name: "High Post Frost Quartz", item: "quartz", qty: 2, mon: 55, ren: 25, desc: "Refracts winter starlight." },
  { id: "ex_gold", wing: "Oz & Astral", name: "Starlight Gold Fleck", item: "gold", qty: 1, mon: 70, ren: 30, desc: "Panned from the high mountain melt." },
];

export function createMuseum(o) {
  const { s, panel, toast, ping, save, hud, extras, giveHat, giveFurn, addRenown } = o;
  const st = (s.museum ||= {});
  st.donated ||= {};

  const bag = () => extras.state.bag;

  function open(wingFilter = "All") {
    const wings = ["All", "Lantern Era", "Clockwork & Rails", "Sunken & Sea", "Oz & Astral"];
    const totalDone = EXHIBITS.filter((e) => st.donated[e.id]).length;

    const tabs = wings.map((w) =>
      `<button type="button" class="chip${wingFilter === w ? " on" : ""}" data-w="${esc(w)}">${esc(w)}</button>`
    ).join("");

    const list = EXHIBITS.filter((e) => wingFilter === "All" || e.wing === wingFilter);
    const rows = list.map((ex) => {
      const done = !!st.donated[ex.id];
      const have = bag()[ex.item] || 0;
      const itemName = findItem(ex.item)?.[1] || ex.item;
      return `<div class="se-good">
        <span>
          <strong>${esc(ex.name)}</strong> <small class="muted">(${esc(ex.wing)})</small>
          <small>${esc(ex.desc)}</small>
          <small>Needs: ${ex.qty}× ${esc(itemName)} (${have}/${ex.qty}) · Reward: +${ex.mon} mon, +${ex.ren} Renown</small>
        </span>
        ${done
          ? `<span class="pill pill-done">Exhibited ✓</span>`
          : `<button type="button" class="btn btn-sm btn-accent" data-don="${ex.id}" ${have < ex.qty ? "disabled" : ""}>Donate</button>`}
      </div>`;
    }).join("");

    panel(`Foxhold Museum · ${totalDone}/${EXHIBITS.length} Exhibits`, `
      <p class="muted">Donate items from your inventory to complete all 4 museum wings. Completing any wing awards the <strong>Display Pedestal</strong>; 12+ exhibits earns the <strong>Curator's Beret</strong>!</p>
      <div class="chips" style="margin-bottom:10px">${tabs}</div>
      <div class="se-mkt">${rows}</div>
    `, (e) => {
      e.querySelectorAll("[data-w]").forEach((b) => (b.onclick = () => open(b.dataset.w)));
      e.querySelectorAll("[data-don]").forEach((b) => {
        b.onclick = () => {
          const ex = EXHIBITS.find((x) => x.id === b.dataset.don);
          if (!ex || st.donated[ex.id] || (bag()[ex.item] || 0) < ex.qty) return;
          bag()[ex.item] -= ex.qty;
          st.donated[ex.id] = Date.now();
          s.mon += ex.mon;
          addRenown?.(ex.ren);

          const wingDone = EXHIBITS.filter((x) => x.wing === ex.wing).every((x) => st.donated[x.id]);
          const count = EXHIBITS.filter((x) => st.donated[x.id]).length;
          if (wingDone && !s.furn?.pedestal) {
            giveFurn?.("pedestal");
            toast(`${ex.wing} Wing complete! +${ex.mon} mon & Display Pedestal for your house!`);
          } else if (count >= 12 && !s.hats.includes("curatorhat")) {
            giveHat?.("curatorhat");
            toast(`12 Exhibits! +${ex.mon} mon & Curator's Beret!`);
          } else {
            toast(`Donated ${ex.name}! +${ex.mon} mon & +${ex.ren} Renown.`);
          }
          ping("done");
          save(); hud(); open(wingFilter);
        };
      });
    });
  }

  return { open, state: st };
}
