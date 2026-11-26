// Lantern Photo Club: daily photography prompts based on your World region and time of day, building a Postcard Album.
import { esc, today } from "../util.js";

const PROMPTS = [
  { id: "oz_pic", title: "Emerald Skyline", desc: "Snap a photo while standing in Emerald City / Oz.", check: (s, reg) => reg === "oz", pay: 55 },
  { id: "shore_pic", title: "Saltwick Tide", desc: "Snap a photo along Saltwick Shore.", check: (s, reg) => reg === "shore", pay: 50 },
  { id: "peaks_pic", title: "High Post Snow", desc: "Snap a photo up at The High Post.", check: (s, reg) => reg === "peaks", pay: 55 },
  { id: "market_pic", title: "Market Lanterns", desc: "Snap a photo in The Night Market.", check: (s, reg) => reg === "market", pay: 50 },
  { id: "village_pic", title: "Hollow Pine Hearth", desc: "Snap a photo in Hollow Pine Village.", check: (s, reg) => reg === "village", pay: 35 },
  { id: "night_pic", title: "Nightfall Glow", desc: "Snap a photo when darkness falls (or switch Time to Night).", check: (s, reg, dark) => dark > 0.25, pay: 45 },
];

export function createPhotoClub(o) {
  const { s, REGIONS, panel, toast, ping, save, hud, regionNow, darkness, addRenown } = o;
  const st = (s.photoClub ||= {});
  st.album ||= [];
  st.day ||= "";
  st.snappedDay ||= "";

  function todayPrompt() {
    const t = today();
    let h = 31;
    for (const c of t) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    return PROMPTS[h % PROMPTS.length];
  }

  function open() {
    const pr = todayPrompt();
    const reg = regionNow?.() || "village";
    const regLabel = REGIONS?.[reg]?.[0] || reg;
    const dark = darkness?.() || 0;
    const doneToday = st.snappedDay === today();
    const ready = !doneToday && pr.check(s, reg, dark);

    const albumRows = st.album.slice(0, 12).map((p) =>
      `<div class="se-good"><span><strong>📸 ${esc(p.title)}</strong><small>${esc(p.where)} · ${esc(p.day)}</small></span><span class="pill pill-done">+${p.pay} mon</span></div>`
    ).join("");

    panel(`Lantern Photo Club · ${st.album.length} Postcards`, `
      <div class="se-mkt" style="margin-bottom:12px">
        <div class="se-good">
          <span>
            <strong>Today's Assignment: ${esc(pr.title)}</strong>
            <small>${esc(pr.desc)}</small>
            <small class="muted">You are currently in: <b>${esc(regLabel)}</b></small>
          </span>
          ${doneToday
            ? `<span class="pill pill-done">Submitted ✓</span>`
            : `<button type="button" class="btn btn-accent" id="pc-snap" ${ready ? "" : "disabled"}>${ready ? `Snap (+${pr.pay} mon)` : "Go to location"}</button>`}
        </div>
      </div>
      <h4>Postcard Album</h4>
      <div class="se-mkt">${albumRows || `<p class="muted">No postcards yet. Complete today's assignment to start your album!</p>`}</div>
    `, (e) => {
      const btn = e.querySelector("#pc-snap");
      if (btn) btn.onclick = () => {
        if (st.snappedDay === today() || !pr.check(s, reg, dark)) return;
        st.snappedDay = today();
        st.album.unshift({ title: pr.title, where: regLabel, day: today(), pay: pr.pay });
        st.album = st.album.slice(0, 30);
        s.mon += pr.pay;
        addRenown?.(25);
        ping("done");
        toast(`Postcard "${pr.title}" saved! +${pr.pay} mon & +25 Renown!`);
        save(); hud(); open();
      };
    });
  }

  return { open, state: st };
}
