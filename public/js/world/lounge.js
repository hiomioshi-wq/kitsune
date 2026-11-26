// Foxhold Reading Lounge: connect your real Kitsune library to Kitsune World — read any title or host a daily Book Club session.
import { esc, today } from "../util.js";
import { lib, getItem } from "../store.js";
import { isKids } from "../profiles.js";

export function createLounge(o) {
  const { s, people, panel, toast, ping, save, hud, extras, openItem, addRenown } = o;
  const st = (s.lounge ||= {});
  st.sessions ||= 0;
  st.day ||= "";

  function open() {
    const canHost = st.day !== today();
    const items = (lib.items || []).filter((i) => ["manga", "book", "audio"].includes(i.type) && !(isKids() && i.mature)).slice(0, 24);

    const rows = items.map((it) =>
      `<div class="se-good">
        <span><strong>${esc(it.title)}</strong><small>${esc(it.series || it.author || it.type)}</small></span>
        <button type="button" class="btn btn-sm" data-read="${esc(it.id)}">Read</button>
      </div>`
    ).join("");

    panel(`Foxhold Reading Lounge · ${st.sessions} Sessions`, `
      <div class="se-mkt" style="margin-bottom:12px">
        <div class="se-good">
          <span><strong>📖 Host Daily Book Club</strong><small>Once per day · +30 mon, +20 Renown &amp; +1 ♥ with a resident</small></span>
          <button type="button" class="btn btn-sm btn-accent" id="lg-host" ${canHost ? "" : "disabled"}>${canHost ? "Host Session" : "Hosted Today ✓"}</button>
        </div>
      </div>
      <h4>From Your Real Shelf</h4>
      <div class="se-mkt">${rows || `<p class="muted">Add books or manga to your library to read them here.</p>`}</div>
    `, (e) => {
      e.querySelector("#lg-host").onclick = () => {
        if (st.day === today()) return;
        st.day = today();
        st.sessions++;
        s.mon += 30;
        addRenown?.(20);
        const guest = people[Math.floor(Math.random() * people.length)];
        if (guest && extras?.state?.hearts) {
          extras.state.hearts[guest.id] = Math.min(5, (extras.state.hearts[guest.id] || 0) + 1);
          toast(`Book club with ${guest.n[2]}! +30 mon, +20 Renown & +1 ♥!`);
        } else {
          toast("Book club hosted! +30 mon & +20 Renown!");
        }
        ping("done"); save(); hud(); open();
      };

      e.querySelectorAll("[data-read]").forEach((b) => {
        b.onclick = () => {
          const it = getItem(b.dataset.read);
          if (it) openItem?.(it);
        };
      });
    });
  }

  return { open, state: st };
}
