// World Cartography Desk: triangulate regional map bearings + daily survey stamp for mon and Renown.
import { esc, today } from "../util.js";

const CHARTS = [
  { region: "Saltwick Shore", bearing: "SE", landmark: "Tidepool Arch" },
  { region: "Brask Clockwork", bearing: "NW", landmark: "Brass Pendulum" },
  { region: "Sakura Ridge", bearing: "NE", landmark: "Lantern Torii" },
  { region: "Oz Emerald Road", bearing: "SW", landmark: "Poppy Gate" },
  { region: "Moonwake Lake", bearing: "N", landmark: "Sunken Pier" },
  { region: "Blackwood Quad", bearing: "N", landmark: "East Stairwell" },
  { region: "Meridian Sector 4", bearing: "NE", landmark: "The Wall Yuki Opened" },
  { region: "Moonwake Bay", bearing: "SE", landmark: "Tide-Glass Watch" },
  { region: "Palm-Drift Cay", bearing: "SW", landmark: "Driftwood Atoll" },
  { region: "Hell's Peak Estates", bearing: "NW", landmark: "HOA Flagpole" },
];

const BEARINGS = ["N", "NE", "SE", "SW", "NW"];

export function createCartography(o) {
  const { s, panel, toast, ping, save, hud, addRenown } = o;
  const st = (s.cartography ||= {});
  st.charted ||= 0;
  st.stampDay ||= "";

  let survey = null;

  function startSurvey() {
    const pick = CHARTS[Math.floor(Math.random() * CHARTS.length)];
    const decoys = CHARTS.filter((c) => c.region !== pick.region).slice(0, 2);
    const landmarks = [pick.landmark, ...decoys.map((d) => d.landmark)].sort(() => Math.random() - 0.5);
    survey = { pick, landmarks, bearing: "", landmark: "", done: false };
    open();
  }

  function open() {
    const canStamp = st.stampDay !== today();
    if (st.chartDay !== today()) { st.chartDay = today(); st.chartN = 0; }
    const canChart = (st.chartN || 0) < 5;
    let body = "";

    if (!survey) {
      body = `
        <p class="muted">Triangulate regional surveys by pairing each expedition's compass bearing and landmark. Completing a chart pays <strong>55 mon</strong> &amp; <strong>+25 Renown</strong> (up to 5/day).</p>
        <p>Charts published: <strong>${st.charted}</strong> · Today: <strong>${st.chartN}/5</strong></p>
        <div class="px-row">
          <button type="button" class="btn btn-accent" id="cg-go" ${canChart ? "" : "disabled"}>${canChart ? "Draft New Chart" : "Daily Limit Reached"}</button>
          <button type="button" class="btn" id="cg-stamp" ${canStamp ? "" : "disabled"}>${canStamp ? "Daily Survey Stamp (+20 mon)" : "Stamped Today ✓"}</button>
        </div>`;
    } else {
      body = `
        <p class="muted">Expedition Target: <strong>🧭 ${esc(survey.pick.region)}</strong> (Clue: Bearing <em>${esc(survey.pick.bearing)}</em> toward <em>${esc(survey.pick.landmark)}</em>)</p>
        <div class="se-mkt" style="margin:10px 0">
          <div class="se-good">
            <span><strong>Compass Bearing</strong></span>
            <div style="display:flex;gap:4px;flex-wrap:wrap">
              ${BEARINGS.map((b) => `<button type="button" class="btn btn-sm ${survey.bearing === b ? "btn-accent" : ""}" data-b="${b}" ${survey.done ? "disabled" : ""}>${b}</button>`).join("")}
            </div>
          </div>
          <div class="se-good">
            <span><strong>Landmark</strong></span>
            <div style="display:flex;gap:4px;flex-wrap:wrap">
              ${survey.landmarks.map((lm) => `<button type="button" class="btn btn-sm ${survey.landmark === lm ? "btn-accent" : ""}" data-lm="${esc(lm)}" ${survey.done ? "disabled" : ""}>${esc(lm)}</button>`).join("")}
            </div>
          </div>
        </div>
        <div class="px-row">
          <button type="button" class="btn btn-accent" id="cg-pub" ${survey.done || !survey.bearing || !survey.landmark ? "disabled" : ""}>Publish Chart</button>
          ${survey.done ? `<button type="button" class="btn" id="cg-go">Next Survey</button>` : ""}
        </div>`;
    }

    panel("World Cartography Desk", body, (e) => {
      const go = e.querySelector("#cg-go");
      if (go) go.onclick = startSurvey;

      const stamp = e.querySelector("#cg-stamp");
      if (stamp) stamp.onclick = () => {
        if (st.stampDay === today()) return;
        st.stampDay = today();
        s.mon += 20;
        addRenown?.(15);
        ping("done");
        toast("Stamped the daily royal survey ledger! +20 mon & +15 Renown.");
        save(); hud(); open();
      };

      e.querySelectorAll("[data-b]").forEach((btn) => {
        btn.onclick = () => {
          if (!survey || survey.done) return;
          survey.bearing = btn.dataset.b;
          ping("choice");
          open();
        };
      });

      e.querySelectorAll("[data-lm]").forEach((btn) => {
        btn.onclick = () => {
          if (!survey || survey.done) return;
          survey.landmark = btn.dataset.lm;
          ping("choice");
          open();
        };
      });

      const pub = e.querySelector("#cg-pub");
      if (pub) pub.onclick = () => {
        if (!survey || survey.done) return;
        survey.done = true;
        if (survey.bearing === survey.pick.bearing && survey.landmark === survey.pick.landmark) {
          st.charted++;
          st.chartN = (st.chartN || 0) + 1;
          s.mon += 55;
          addRenown?.(25);
          ping("done");
          toast(`Charted ${survey.pick.region}! +55 mon & +25 Renown.`);
          save(); hud();
        } else {
          ping("close");
          toast("The ink smudged — bearing and landmark did not match.");
        }
        open();
      };
    });
  }

  return { open };
}
