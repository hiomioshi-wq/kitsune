// Moonwake Aquarium: view your caught fish collection, feed the tank daily, and play Guess the Catch.
import { esc, today } from "../util.js";

const SPECIMENS = [
  { name: "Lantern Carp", clue: "Glows faint amber near sunken steps", zone: "Moonwake Lake" },
  { name: "Saltwick Ray", clue: "Glides flat over shallow tidepools", zone: "Saltwick Shore" },
  { name: "Glacier Trout", clue: "Thrives in icy northern currents", zone: "Whiteback Peaks" },
  { name: "Emerald Koi", clue: "Swims through Oz's green canals", zone: "Emerald Road" },
  { name: "Clockwork Eel", clue: "Coils around submerged brass gears", zone: "Brask Canal" },
];

export function createAquarium(o) {
  const { s, panel, toast, ping, save, hud, addRenown } = o;
  const st = (s.aquarium ||= {});
  st.trivia ||= 0;
  st.feedDay ||= "";

  let round = null;

  function startQuiz() {
    const pick = SPECIMENS[Math.floor(Math.random() * SPECIMENS.length)];
    const opts = [pick, ...SPECIMENS.filter((x) => x.name !== pick.name).slice(0, 2)].sort(() => Math.random() - 0.5);
    round = { pick, opts, done: false };
    open();
  }

  function open() {
    const canFeed = st.feedDay !== today();
    const caught = Object.keys(s.fish || {}).length;
    let body = "";

    if (!round) {
      body = `
        <p class="muted">A glass-walled sanctuary beneath Moonwake Lake. Species in your personal catch log: <strong>${caught}</strong> · Aquarium quizzes solved: <strong>${st.trivia}</strong>.</p>
        <div class="px-row">
          <button type="button" class="btn btn-accent" id="aq-go">Guess the Specimen</button>
          <button type="button" class="btn" id="aq-feed" ${canFeed ? "" : "disabled"}>${canFeed ? "Daily Tank Feeding (+20 mon)" : "Fed Today ✓"}</button>
        </div>`;
    } else {
      body = `
        <div class="se-mkt" style="margin-bottom:12px">
          <div class="se-good">
            <span><strong>🐠 Tank Clue (${esc(round.pick.zone)})</strong><small>${esc(round.pick.clue)}</small></span>
          </div>
        </div>
        <div class="px-row">
          ${round.opts.map((sp) => `<button type="button" class="btn btn-accent" data-aq="${esc(sp.name)}" ${round.done ? "disabled" : ""}>${esc(sp.name)}</button>`).join("")}
        </div>
        ${round.done ? `<div style="margin-top:10px"><button type="button" class="btn btn-accent" id="aq-go">Next Specimen</button></div>` : ""}`;
    }

    panel("Moonwake Aquarium", body, (e) => {
      const go = e.querySelector("#aq-go");
      if (go) go.onclick = startQuiz;

      const feed = e.querySelector("#aq-feed");
      if (feed) feed.onclick = () => {
        if (st.feedDay === today()) return;
        st.feedDay = today();
        s.mon += 20;
        addRenown?.(15);
        ping("done");
        toast("The koi swirl in a bright lantern ring! +20 mon & +15 Renown.");
        save(); hud(); open();
      };

      e.querySelectorAll("[data-aq]").forEach((btn) => {
        btn.onclick = () => {
          if (!round || round.done) return;
          round.done = true;
          if (btn.dataset.aq === round.pick.name) {
            st.trivia++;
            s.mon += 45;
            addRenown?.(20);
            ping("done");
            toast(`Correct — ${round.pick.name}! +45 mon & +20 Renown.`);
            save(); hud();
          } else {
            ping("close");
            toast(`Not quite! That was the ${round.pick.name}.`);
          }
          open();
        };
      });
    });
  }

  return { open };
}
