// Foxhold Wishing Fountain: toss mon into the fountain for randomized blessings (Lucky Ripples, Astral Motes, Renown, or bonus mon) and log your wishes.
import { esc, today } from "../util.js";

export function createWishing(o) {
  const { s, panel, toast, ping, save, hud, fireworks, addRenown } = o;
  const st = (s.wishing ||= {});
  st.tosses ||= 0;
  st.wishes ||= [];

  function toss(amt, note) {
    if (s.mon < amt) return toast("Not enough mon.");
    s.mon -= amt;
    st.tosses++;
    if (note) {
      st.wishes.unshift({ text: note.slice(0, 80), at: today(), amt });
      st.wishes = st.wishes.slice(0, 20);
    }

    const r = Math.random();
    const scale = amt >= 50 ? 3 : amt >= 20 ? 2 : 1;
    if (r < 0.25) {
      const luck = 2 * scale;
      s.luck = (s.luck || 0) + luck;
      toast(`The water shimmers! +${luck} Lucky Ripples for fishing!`);
    } else if (r < 0.5) {
      const motes = 6 * scale;
      s.nexus ||= {};
      s.nexus.motes = (s.nexus.motes || 0) + motes;
      toast(`Starlight rises from the basin! +${motes} Astral Motes!`);
    } else if (r < 0.75) {
      const ren = 12 * scale;
      addRenown?.(ren);
      toast(`The fountain remembers your name! +${ren} Renown!`);
    } else {
      const back = amt * 2 + 10;
      s.mon += back;
      fireworks?.();
      toast(`Golden ripple! The fountain returns ${back} mon!`);
    }
    ping("done"); save(); hud(); open();
  }

  function open() {
    const wishRows = st.wishes.slice(0, 8).map((w) =>
      `<div class="se-good"><span><strong>💧 "${esc(w.text)}"</strong><small>${esc(w.at)} · ${w.amt} mon</small></span></div>`
    ).join("");

    panel(`Foxhold Wishing Fountain · ${st.tosses} Wishes`, `
      <p class="muted">Toss mon into the fountain for a blessing of Lucky Ripples, Astral Motes, Renown, or a Golden Ripple.</p>
      <div class="px-row" style="margin:10px 0">
        <input type="text" class="field" id="ws-note" maxlength="80" placeholder="Make a wish (optional)…" style="flex:1;min-width:180px">
      </div>
      <div class="chips" style="margin-bottom:14px">
        <button type="button" class="btn btn-accent" data-ts="5" ${s.mon < 5 ? "disabled" : ""}>Toss 5 mon</button>
        <button type="button" class="btn btn-accent" data-ts="20" ${s.mon < 20 ? "disabled" : ""}>Toss 20 mon (2×)</button>
        <button type="button" class="btn btn-accent" data-ts="50" ${s.mon < 50 ? "disabled" : ""}>Toss 50 mon (3×)</button>
      </div>
      <h4>Wish Ledger</h4>
      <div class="se-mkt">${wishRows || `<p class="muted">No wishes logged yet.</p>`}</div>
    `, (e) => {
      e.querySelectorAll("[data-ts]").forEach((b) => {
        b.onclick = () => toss(+b.dataset.ts, e.querySelector("#ws-note").value.trim());
      });
    });
  }

  return { open, state: st };
}
