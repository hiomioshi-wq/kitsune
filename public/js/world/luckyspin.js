// Daily Lucky Spin: 8-wedge prize wheel with 1 free daily spin + 20 mon extra spins.
import { today } from "../util.js";

const WEDGES = [
  { label: "+15 mon", mon: 15, ren: 5, luck: 0, motes: 0 },
  { label: "+30 mon", mon: 30, ren: 10, luck: 0, motes: 0 },
  { label: "+60 mon", mon: 60, ren: 15, luck: 0, motes: 0 },
  { label: "+150 JACKPOT", mon: 150, ren: 35, luck: 2, motes: 0 },
  { label: "+4 Lucky Ripples", mon: 10, ren: 10, luck: 4, motes: 0 },
  { label: "+20 Astral Motes", mon: 10, ren: 10, luck: 0, motes: 20 },
  { label: "+40 Renown", mon: 15, ren: 40, luck: 0, motes: 0 },
  { label: "+25 mon", mon: 25, ren: 10, luck: 1, motes: 0 },
];

export function createLuckySpin(o) {
  const { s, panel, toast, ping, save, hud, addRenown } = o;
  const st = (s.luckySpin ||= {});
  st.spins ||= 0;
  st.freeDay ||= "";

  let last = null;

  function spin(cost) {
    if (cost > 0 && s.mon < cost) return toast("Not enough mon.");
    if (cost > 0) s.mon -= cost;
    else st.freeDay = today();
    st.spins++;

    const w = WEDGES[Math.floor(Math.random() * WEDGES.length)];
    s.mon += w.mon;
    if (w.ren) addRenown?.(w.ren);
    if (w.luck) s.luck = (s.luck || 0) + w.luck;
    if (w.motes) { s.nexus ||= {}; s.nexus.motes = (s.nexus.motes || 0) + w.motes; }
    last = w.label;
    ping("done");
    toast(`Lucky Wheel: ${w.label}!`);
    save(); hud(); open();
  }

  function open() {
    const canFree = st.freeDay !== today();
    panel(`Daily Lucky Wheel · ${st.spins} Spins`, `
      <p class="muted">Spin the 8-wedge Foxfire Wheel! Win up to <strong>150 mon</strong>, Lucky Ripples, Astral Motes, or Renown.</p>
      <div class="se-mkt" style="margin:10px 0">${WEDGES.map((w) => `<div class="se-good"><span><strong>🎡 ${w.label}</strong></span></div>`).join("")}</div>
      ${last ? `<div class="hint" style="margin:10px 0">Last spin: <strong>${last}</strong></div>` : ""}
      <button type="button" class="btn btn-accent" id="ls-go" ${!canFree && s.mon < 20 ? "disabled" : ""}>${canFree ? "Spin Daily Free Wheel" : "Spin Wheel (20 mon)"}</button>
    `, (e) => {
      e.querySelector("#ls-go").onclick = () => spin(st.freeDay !== today() ? 0 : 20);
    });
  }

  return { open, state: st };
}
