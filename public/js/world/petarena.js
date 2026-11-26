// Companion Training Yard: train your fox/pet in 3 drills and spar against resident companions for Bond XP, mon, and Renown.
import { esc } from "../util.js";

const RIVALS = [
  { id: "kitsu_kit", name: "Kitsu's Courier Kit", pwr: 12, pay: 30, ren: 15, icon: "🦊" },
  { id: "ponzu_spirit", name: "Ponzu's Teacup Spirit", pwr: 22, pay: 50, ren: 25, icon: "🍵" },
  { id: "wren_moth", name: "Wren's Radio Moth", pwr: 34, pay: 75, ren: 35, icon: "🦋" },
  { id: "lux_owl", name: "Lux's Library Owl", pwr: 48, pay: 110, ren: 50, icon: "🦉" },
];

export function createPetArena(o) {
  const { s, panel, toast, ping, save, hud, activePet, addRenown } = o;
  const st = (s.petArena ||= {});
  st.lv ||= 1;
  st.xp ||= 0;
  st.wins ||= 0;
  st.drills ||= 0;

  const needXp = (lv) => lv * 40;
  const power = () => 10 + st.lv * 6 + (activePet?.() ? 6 : 0);

  function gainXp(n) {
    st.xp += n;
    while (st.xp >= needXp(st.lv)) {
      st.xp -= needXp(st.lv);
      st.lv++;
      toast(`Companion Rank Up! Rank ${st.lv} (Power ${power()})!`);
    }
  }

  function open() {
    const pet = activePet?.();
    const petName = pet ? pet.name : "Your Fox Spirit";
    const pwr = power();

    const drills = [
      ["dash", "Agility Dash", "Quick sprint through Hollow Pine", 12, 10],
      ["fetch", "Foxfire Fetch", "Catch drifting embers", 18, 15],
      ["guard", "Lantern Guard", "Hold the shrine perimeter", 24, 22],
    ].map(([id, name, desc, xp, mon]) =>
      `<div class="se-good">
        <span><strong>${esc(name)}</strong><small>${esc(desc)} · +${xp} XP, +${mon} mon</small></span>
        <button type="button" class="btn btn-sm btn-accent" data-dr="${id}">Train</button>
      </div>`
    ).join("");

    const spars = RIVALS.map((r) => {
      const chance = Math.min(95, Math.max(15, Math.round(50 + (pwr - r.pwr) * 2)));
      return `<div class="se-good">
        <span><strong>${r.icon} ${esc(r.name)}</strong><small>Power ${r.pwr} · Win chance ~${chance}% · +${r.pay} mon, +${r.ren} Renown</small></span>
        <button type="button" class="btn btn-sm btn-accent" data-sp="${r.id}">Spar</button>
      </div>`;
    }).join("");

    panel("Companion Training Yard", `
      <div class="se-mkt" style="margin-bottom:12px">
        <div class="se-good">
          <span><strong>🐾 ${esc(petName)} · Rank ${st.lv}</strong><small>Power: <b>${pwr}</b> · XP: ${st.xp}/${needXp(st.lv)} · Spar Wins: ${st.wins}</small></span>
          <span class="pill">Drills: ${st.drills}</span>
        </div>
      </div>
      <h4>Training Drills</h4>
      <div class="se-mkt" style="margin-bottom:12px">${drills}</div>
      <h4>Sparring Matches</h4>
      <div class="se-mkt">${spars}</div>
    `, (e) => {
      e.querySelectorAll("[data-dr]").forEach((b) => {
        b.onclick = () => {
          const map = { dash: [12, 10], fetch: [18, 15], guard: [24, 22] };
          const [xp, mon] = map[b.dataset.dr] || [10, 10];
          st.drills++;
          s.mon += mon;
          gainXp(xp);
          addRenown?.(8);
          ping("done");
          toast(`Training complete! +${xp} XP & +${mon} mon.`);
          save(); hud(); open();
        };
      });

      e.querySelectorAll("[data-sp]").forEach((b) => {
        b.onclick = () => {
          const r = RIVALS.find((x) => x.id === b.dataset.sp);
          if (!r) return;
          const chance = Math.min(0.95, Math.max(0.15, 0.5 + (power() - r.pwr) * 0.02));
          if (Math.random() < chance) {
            st.wins++;
            s.mon += r.pay;
            gainXp(25);
            addRenown?.(r.ren);
            ping("done");
            toast(`Victory over ${r.name}! +${r.pay} mon & +${r.ren} Renown!`);
          } else {
            gainXp(10);
            ping("blip");
            toast(`${r.name} won this round, but you gained +10 training XP!`);
          }
          save(); hud(); open();
        };
      });
    });
  }

  return { open, state: st };
}
