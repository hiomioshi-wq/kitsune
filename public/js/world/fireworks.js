// Pyrotechnics Tent: design custom firework shells, launch them into the World sky, and fulfill festival orders.
import { esc, today } from "../util.js";

const COLORS = [["gold", "Foxfire Gold"], ["crimson", "Lantern Crimson"], ["azure", "Starlight Blue"], ["emerald", "Oz Emerald"]];
const SHAPES = [["ring", "Crown Ring"], ["star", "Nine-Tail Burst"], ["willow", "Weeping Willow"]];

export function createFireworks(o) {
  const { s, panel, toast, ping, save, hud, fireworks, addRenown } = o;
  const st = (s.pyro ||= {});
  st.launched ||= 0;
  st.orderDay ||= "";

  let color = "gold";
  let shape = "ring";

  function open() {
    const canOrder = st.orderDay !== today();
    const colBtns = COLORS.map(([k, l]) => `<button type="button" class="chip${color === k ? " on" : ""}" data-cl="${k}">${esc(l)}</button>`).join("");
    const shpBtns = SHAPES.map(([k, l]) => `<button type="button" class="chip${shape === k ? " on" : ""}" data-sh="${k}">${esc(l)}</button>`).join("");

    panel(`Pyrotechnics Tent · ${st.launched} Launched`, `
      <p class="muted">Craft a custom firework shell and launch it over Kitsune World, or fulfill today's Festival Order for mon &amp; Renown.</p>
      <div style="margin:8px 0"><strong>Shell Color:</strong><div class="chips" style="margin-top:6px">${colBtns}</div></div>
      <div style="margin:8px 0"><strong>Burst Pattern:</strong><div class="chips" style="margin-top:6px">${shpBtns}</div></div>
      <div class="px-row" style="margin-top:12px">
        <button type="button" class="btn btn-accent" id="py-go" ${s.mon < 10 ? "disabled" : ""}>Launch Shell (10 mon)</button>
        <button type="button" class="btn" id="py-ord" ${canOrder ? "" : "disabled"}>${canOrder ? "Fulfill Daily Festival Order (+35 mon)" : "Order Filled Today ✓"}</button>
      </div>
    `, (e) => {
      e.querySelectorAll("[data-cl]").forEach((b) => (b.onclick = () => { color = b.dataset.cl; open(); }));
      e.querySelectorAll("[data-sh]").forEach((b) => (b.onclick = () => { shape = b.dataset.sh; open(); }));
      e.querySelector("#py-go").onclick = () => {
        if (s.mon < 10) return;
        s.mon -= 10;
        st.launched++;
        fireworks?.();
        addRenown?.(10);
        ping("done");
        toast(`Launched a ${color} ${shape} shell! +10 Renown.`);
        save(); hud(); open();
      };
      e.querySelector("#py-ord").onclick = () => {
        if (st.orderDay === today()) return;
        st.orderDay = today();
        st.launched++;
        s.mon += 35;
        fireworks?.();
        addRenown?.(25);
        ping("done");
        toast("Festival order launched! +35 mon & +25 Renown!");
        save(); hud(); open();
      };
    });
  }

  return { open, state: st };
}
