// Ponzu's Teahouse: brew 4 signature teas from forage or order a cup for speed, Lucky Ripples, Renown, and daily tea fortunes.
import { esc, today } from "../util.js";
import { item as findItem } from "./extras.js";

const TEAS = [
  { id: "matcha", name: "Hollow Pine Matcha", icon: "🍵", cost: 14, need: { herb: 2 }, speed: 120, luck: 2, ren: 10 },
  { id: "chamomile", name: "Moth-Wing Chamomile", icon: "🌼", cost: 18, need: { herb: 1, honey: 1 }, speed: 150, luck: 2, ren: 15 },
  { id: "oolong", name: "Saltwick Sea-Salt Oolong", icon: "🫖", cost: 22, need: { herb: 1, kelp: 1 }, speed: 180, luck: 3, ren: 15 },
  { id: "jasmine", name: "Midnight Jasmine", icon: "🌙", cost: 26, need: { herb: 2, poppy: 1 }, speed: 210, luck: 3, ren: 25 },
];

const FORTUNES = [
  "Your next cast at the water will feel unusually light.",
  "Something lost on the sleeper train is waiting for you.",
  "The bell over the door is still a half-note flat.",
  "A steep of three minutes makes a better cup than thirty.",
];

export function createTeahouse(o) {
  const { s, panel, toast, ping, save, hud, extras, addRenown } = o;
  const st = (s.teahouse ||= {});
  st.cups ||= 0;
  st.fortuneDay ||= "";

  const bag = () => extras.state.bag;

  function serve(t) {
    st.cups++;
    extras.state.buff = Math.max(extras.state.buff, Date.now()) + t.speed * 1000;
    s.luck = (s.luck || 0) + t.luck;
    addRenown?.(t.ren);
    ping("done");
    const fort = st.fortuneDay !== today() ? ` Fortune: "${FORTUNES[st.cups % FORTUNES.length]}"` : "";
    st.fortuneDay = today();
    toast(`Steeped ${t.name}! +${t.speed}s speed, +${t.luck} Luck.${fort}`);
    save(); hud(); open();
  }

  function open() {
    if (st.buyDay !== today()) { st.buyDay = today(); st.buyN = 0; }
    const canBuy = (st.buyN || 0) < 5;
    const canBrew = (reqs) => Object.entries(reqs).every(([k, n]) => (bag()[k] || 0) >= n);
    const reqTxt = (reqs) => Object.entries(reqs).map(([k, n]) => `${esc(findItem(k)?.[1] || k)} ${bag()[k] || 0}/${n}`).join(" · ");

    const rows = TEAS.map((t) => {
      const ok = canBrew(t.need);
      return `<div class="se-good">
        <span>
          <strong>${t.icon} ${esc(t.name)}</strong>
          <small>+${t.speed}s speed, +${t.luck} Luck, +${t.ren} Renown · Brew: ${reqTxt(t.need)}</small>
        </span>
        <div style="display:flex;gap:6px">
          <button type="button" class="btn btn-sm btn-accent" data-br="${t.id}" ${ok ? "" : "disabled"}>Brew</button>
          <button type="button" class="btn btn-sm" data-od="${t.id}" ${!canBuy || s.mon < t.cost ? "disabled" : ""}>Order ${t.cost}</button>
        </div>
      </div>`;
    }).join("");

    panel(`Ponzu's Teahouse · ${st.cups} Cups Steeped`, `
      <p class="muted">Steeped too long, as Ponzu insists. Brew from your herbs or order a warm cup for speed, Lucky Ripples, and Renown.</p>
      <div class="se-mkt">${rows}</div>
    `, (e) => {
      e.querySelectorAll("[data-br]").forEach((b) => {
        b.onclick = () => {
          const t = TEAS.find((x) => x.id === b.dataset.br);
          if (!t || !canBrew(t.need)) return;
          for (const [k, n] of Object.entries(t.need)) bag()[k] -= n;
          serve(t);
        };
      });
      e.querySelectorAll("[data-od]").forEach((b) => {
        b.onclick = () => {
          const t = TEAS.find((x) => x.id === b.dataset.od);
          if (!t || s.mon < t.cost || (st.buyN || 0) >= 5) return;
          s.mon -= t.cost;
          st.buyN = (st.buyN || 0) + 1;
          serve(t);
        };
      });
    });
  }

  return { open, state: st };
}
