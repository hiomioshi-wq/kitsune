// Lantern Photo Club: daily photography prompts based on your World region and time of day, building a Postcard Album.
import { esc, today } from "../util.js";

const PROMPTS = [
  { id: "oz_pic", title: "Emerald Skyline", desc: "Snap a photo while standing in Emerald City / Oz.", check: (s, reg) => reg === "oz", pay: 55 },
  { id: "shore_pic", title: "Saltwick Tide", desc: "Snap a photo along Saltwick Shore.", check: (s, reg) => reg === "shore", pay: 50 },
  { id: "peaks_pic", title: "High Post Snow", desc: "Snap a photo up at The High Post.", check: (s, reg) => reg === "peaks", pay: 55 },
  { id: "market_pic", title: "Market Lanterns", desc: "Snap a photo in The Night Market.", check: (s, reg) => reg === "market", pay: 50 },
  { id: "village_pic", title: "Hollow Pine Hearth", desc: "Snap a photo in Hollow Pine Village.", check: (s, reg) => reg === "village", pay: 35 },
  { id: "night_pic", title: "Nightfall Glow", desc: "Snap a photo when darkness falls (or switch Time to Night).", check: (s, reg, dark) => dark > 0.25, pay: 45 },
  { id: "clock_pic", title: "Three Seconds Behind", desc: "Snap a photo in Brask Clockwork.", check: (s, reg) => reg === "clock", pay: 55 },
  { id: "lake_pic", title: "Moonwake Pier", desc: "Snap a photo by Moonwake Lake.", check: (s, reg) => reg === "lake", pay: 45 },
  { id: "bw_pic", title: "Blackwood Graduate", desc: "Snap a photo after discovering 15 Blackwood locations.", check: (s) => Object.keys(s.realm?.blackwood?.visited || {}).length >= 15, pay: 75 },
  { id: "sea_pic", title: "Island Cartographer", desc: "Snap a photo after charting 2 High Seas Ocean Islands.", check: (s) => Object.keys(s.sea?.islands || {}).length >= 2, pay: 75 },
];

const FILTERS = [
  { id: "none", name: "Natural", css: "none" },
  { id: "sepia", name: "Warm Sepia", css: "sepia(0.85) saturate(1.1)" },
  { id: "moon", name: "Moonlit Indigo", css: "hue-rotate(190deg) saturate(0.95) brightness(0.9)" },
  { id: "sakura", name: "Sakura Pink", css: "sepia(0.35) hue-rotate(305deg) saturate(1.3)" },
  { id: "noir", name: "Ink Noir", css: "grayscale(1) contrast(1.25)" },
  { id: "gothic", name: "Gothic Gloom", css: "contrast(1.2) saturate(0.75) hue-rotate(250deg)" },
  { id: "meridian", name: "Meridian Frost", css: "saturate(0.8) brightness(1.08) hue-rotate(175deg)" },
  { id: "amber", name: "Amber Sunset", css: "sepia(0.55) saturate(1.45) contrast(1.08)" },
];

export function createPhotoClub(o) {
  const { s, REGIONS, panel, toast, ping, save, hud, regionNow, darkness, addRenown } = o;
  const st = (s.photoClub ||= {});
  st.album ||= [];
  st.day ||= "";
  st.snappedDay ||= "";
  let selFilter = FILTERS[0].id;
  let lastDataUrl = "";

  function capturePostcard(regLabel) {
    const src = document.querySelector("#wd-c");
    if (!src) return "";
    const out = document.createElement("canvas");
    out.width = 640;
    out.height = 420;
    const g = out.getContext("2d");
    g.fillStyle = "#f9f3e5";
    g.fillRect(0, 0, 640, 420);
    const f = FILTERS.find((x) => x.id === selFilter) || FILTERS[0];
    g.save();
    g.filter = f.css;
    g.drawImage(src, 18, 18, 604, 336);
    g.restore();
    g.strokeStyle = "#3a2415";
    g.lineWidth = 3;
    g.strokeRect(18, 18, 604, 336);
    g.fillStyle = "#3a2415";
    g.font = "700 18px Georgia, serif";
    g.fillText(`Kitsune Postcard · ${regLabel}`, 24, 386);
    g.font = "13px system-ui";
    g.fillStyle = "#6e5540";
    g.fillText(`${today()} · Filter: ${f.name}`, 24, 406);
    return out.toDataURL("image/png");
  }

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

    const filterChips = FILTERS.map((f) => `<button type="button" class="chip${f.id === selFilter ? " on" : ""}" data-pf="${f.id}">${esc(f.name)}</button>`).join("");

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
      <h4>📷 Camera Mode & Exportable Postcards</h4>
      <div class="chips" style="margin-bottom:8px">${filterChips}</div>
      <div class="px-row" style="margin-bottom:10px">
        <button type="button" class="btn btn-accent" id="pc-shot">Take Postcard Photo</button>
        ${lastDataUrl ? `<a class="btn" id="pc-dl" href="${lastDataUrl}" download="kitsune-postcard-${today()}.png">Download PNG</a>` : ""}
      </div>
      ${lastDataUrl ? `<img src="${lastDataUrl}" alt="Postcard preview" style="width:100%;max-width:440px;border-radius:10px;border:2px solid #8a7ac8;margin-bottom:10px">` : ""}
      <h4>Postcard Album</h4>
      <div class="se-mkt">${albumRows || `<p class="muted">No postcards yet. Complete today's assignment to start your album!</p>`}</div>
    `, (e) => {
      e.querySelectorAll("[data-pf]").forEach((b) => (b.onclick = () => { selFilter = b.dataset.pf; if (lastDataUrl) lastDataUrl = capturePostcard(regLabel); ping("blip"); open(); }));
      const shot = e.querySelector("#pc-shot");
      if (shot) shot.onclick = () => { lastDataUrl = capturePostcard(regLabel); ping("done"); toast("Postcard captured! Click Download PNG to save."); open(); };
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
