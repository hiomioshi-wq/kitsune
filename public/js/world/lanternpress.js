// Lantern Printing Press: typeset regional gazettes + daily ink stamp for mon and Renown.
import { esc, today } from "../util.js";

export function gazetteHeadline(s) {
  const bits = [];
  const derbyWins = Object.keys(s.derby?.wins || {}).length;
  const litN = Object.keys(s.lit || {}).length;
  const fishN = Object.keys(s.fish || {}).length;
  if (derbyWins) bits.push(`Local fox wins ${derbyWins} Fox Derby course${derbyWins > 1 ? "s" : ""}`);
  if ((s.roulette?.wins || 0) > 0) bits.push(`takes ${s.roulette.best || 50} mon at Foxfire Roulette`);
  if ((s.taxUpgrades || []).length) bits.push(`funds ${s.taxUpgrades.length} Foxhold civic upgrade${s.taxUpgrades.length > 1 ? "s" : ""}`);
  if (fishN) bits.push(`logs ${fishN} fish species`);
  if (litN) bits.push(`lights ${litN} Country Lantern${litN > 1 ? "s" : ""}`);
  const bwRooms = Object.keys(s.realm?.blackwood?.visited || {}).length;
  const seaIslands = Object.keys(s.sea?.islands || {}).length;
  if (bwRooms >= 10) bits.push(`charts ${bwRooms} Blackwood halls`);
  if (seaIslands) bits.push(`maps ${seaIslands} Ocean Island${seaIslands > 1 ? "s" : ""}`);
  if (s.gazetteExtra) bits.push(s.gazetteExtra);
  return bits.length ? `Kitsune Gazette: “${bits.slice(0, 3).join(", ")}!”` : "Kitsune Gazette: “Quiet morning in Foxhold — lanterns burn steady.”";
}

const EDITIONS = [
  { title: "Foxhold Morning Post", blocks: ["Lanterns", "Lit", "Early"] },
  { title: "Saltwick Tide Sheet", blocks: ["Harbor", "Fog", "Clears"] },
  { title: "Brask Chime Extra", blocks: ["Clock", "Three", "Late"] },
  { title: "Night Market Flyer", blocks: ["Silk", "Spices", "Arrive"] },
  { title: "The Blackwood Gazette (1983)", blocks: ["East", "Stairwell", "Hungry"] },
  { title: "Meridian Thermal Bulletin", blocks: ["Four", "Hundred", "Days"] },
  { title: "Moonwake Regatta Extra", blocks: ["Gull", "Edged", "Out"] },
  { title: "High Seas Lloyd's Sheet", blocks: ["Twelve", "Islands", "Charted"] },
];

export function createLanternPress(o) {
  const { s, panel, toast, ping, save, hud, addRenown } = o;
  const st = (s.lanternPress ||= {});
  st.printed ||= 0;
  st.inkDay ||= "";

  let job = null;

  function startPrint() {
    const ed = EDITIONS[Math.floor(Math.random() * EDITIONS.length)];
    const tray = [...ed.blocks].sort(() => Math.random() - 0.5);
    if (tray.every((w, i) => w === ed.blocks[i])) [tray[0], tray[1]] = [tray[1], tray[0]];
    job = { ed, tray, picked: [], done: false };
    open();
  }

  function open() {
    const canInk = st.inkDay !== today();
    if (st.printDay !== today()) { st.printDay = today(); st.printN = 0; }
    const canPrint = (st.printN || 0) < 5;
    let body = "";

  const headline = gazetteHeadline(s);
  if (!job) {
      body = `
        <div class="hint" style="margin-bottom:10px"><strong>📰 Today's Front Page</strong><br>${esc(headline)}</div>
        <p class="muted">Set wooden type blocks in the right headline order to print a fresh edition. Each print run pays <strong>50 mon</strong> &amp; <strong>+20 Renown</strong> (up to 5/day).</p>
        <p>Editions printed: <strong>${st.printed}</strong> · Today: <strong>${st.printN}/5</strong></p>
        <div class="px-row">
          <button type="button" class="btn btn-accent" id="lp-go" ${canPrint ? "" : "disabled"}>${canPrint ? "Set Type" : "Press Resting Today"}</button>
          <button type="button" class="btn" id="lp-ink" ${canInk ? "" : "disabled"}>${canInk ? "Daily Ink Stamp (+20 mon)" : "Stamped Today ✓"}</button>
        </div>`;
    } else {
      body = `
        <p class="muted">Edition: <strong>📰 ${esc(job.ed.title)}</strong> · Arrange the <strong>${job.ed.blocks.length}</strong> headline blocks in order.</p>
        <div class="se-mkt" style="margin:10px 0">
          <div class="se-good">
            <span><strong>Composing Stick</strong><small>${job.picked.length ? esc(job.picked.join(" ")) : "Tap words in order..."}</small></span>
          </div>
        </div>
        <div class="px-row">
          ${job.tray.map((w, idx) => `<button type="button" class="btn btn-accent" data-lp="${idx}" ${job.done || job.picked.includes(w) ? "disabled" : ""}>${esc(w)}</button>`).join("")}
          ${job.done ? `<button type="button" class="btn" id="lp-go">Next Edition</button>` : ""}
        </div>`;
    }

    panel("Lantern Printing Press", body, (e) => {
      const go = e.querySelector("#lp-go");
      if (go) go.onclick = startPrint;

      const ink = e.querySelector("#lp-ink");
      if (ink) ink.onclick = () => {
        if (st.inkDay === today()) return;
        st.inkDay = today();
        s.mon += 20;
        addRenown?.(15);
        ping("done");
        toast("Fresh midnight ink rolled onto the press! +20 mon & +15 Renown.");
        save(); hud(); open();
      };

      e.querySelectorAll("[data-lp]").forEach((btn) => {
        btn.onclick = () => {
          if (!job || job.done) return;
          const word = job.tray[Number(btn.dataset.lp)];
          if (!word || job.picked.includes(word)) return;
          job.picked.push(word);
          ping("blip");
          if (job.picked.length === job.ed.blocks.length) {
            job.done = true;
            if (job.picked.every((w, i) => w === job.ed.blocks[i])) {
              st.printed++;
              st.printN = (st.printN || 0) + 1;
              s.mon += 50;
              addRenown?.(20);
              ping("done");
              toast(`Printed ${job.ed.title}! +50 mon & +20 Renown.`);
              save(); hud();
            } else {
              ping("close");
              toast("Misprint! The headline came out scrambled.");
            }
          }
          open();
        };
      });
    });
  }

  return { open };
}
