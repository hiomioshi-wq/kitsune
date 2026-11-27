// Kitsune Bell Foundry: forge & temper bronze temple bells at peak heat + daily resonance test.
import { esc, today } from "../util.js";

const BELLS = [
  { name: "Dawn Chime", min: 640, max: 760 },
  { name: "Harbor Bell", min: 700, max: 820 },
  { name: "Shrine Gong", min: 760, max: 880 },
  { name: "Tuesday Noon Bell", min: 680, max: 780 },
  { name: "Glass Stair Bell", min: 620, max: 720 },
  { name: "Dented Bailiff Bell", min: 740, max: 840 },
  { name: "Elysian Buoy Bell", min: 780, max: 900 },
];

export function createBellFoundry(o) {
  const { s, panel, toast, ping, save, hud, addRenown } = o;
  const st = (s.bellFoundry ||= {});
  st.cast ||= 0;
  st.ringDay ||= "";

  let mold = null;

  function startCast() {
    const spec = BELLS[Math.floor(Math.random() * BELLS.length)];
    mold = { spec, temp: 520, strikes: 0, over: false };
    open();
  }

  function open() {
    const canRing = st.ringDay !== today();
    let body = "";

    if (!mold) {
      body = `
        <p class="muted">Heat molten bronze into the target tempering band, then quench &amp; strike to cast a resonant bell. Casting pays <strong>50 mon</strong> &amp; <strong>+20 Renown</strong>.</p>
        <p>Bells cast: <strong>${st.cast}</strong></p>
        <div class="px-row">
          <button type="button" class="btn btn-accent" id="bf-go">Prepare Mold</button>
          <button type="button" class="btn" id="bf-ring" ${canRing ? "" : "disabled"}>${canRing ? "Daily Resonance (+20 mon)" : "Tested Today ✓"}</button>
        </div>`;
    } else {
      const inBand = mold.temp >= mold.spec.min && mold.temp <= mold.spec.max;
      body = `
        <div class="se-mkt" style="margin-bottom:12px">
          <div class="se-good">
            <span><strong>🔔 ${esc(mold.spec.name)}</strong><small>Target Band: ${mold.spec.min}°C – ${mold.spec.max}°C</small></span>
            <strong>${mold.temp}°C ${inBand ? "✓" : ""}</strong>
          </div>
        </div>
        <p class="muted">Bellows steps: <strong>${mold.strikes}/6</strong></p>
        <div class="px-row">
          <button type="button" class="btn" id="bf-cool" ${mold.over || mold.strikes >= 6 ? "disabled" : ""}>Cool (−70°C)</button>
          <button type="button" class="btn" id="bf-heat" ${mold.over || mold.strikes >= 6 ? "disabled" : ""}>Stoke (+90°C)</button>
          <button type="button" class="btn btn-accent" id="bf-strike" ${mold.over ? "disabled" : ""}>Quench &amp; Cast</button>
        </div>
        ${mold.over ? `<div style="margin-top:10px"><button type="button" class="btn btn-accent" id="bf-go">New Mold</button></div>` : ""}`;
    }

    panel("Kitsune Bell Foundry", body, (e) => {
      const go = e.querySelector("#bf-go");
      if (go) go.onclick = startCast;

      const ring = e.querySelector("#bf-ring");
      if (ring) ring.onclick = () => {
        if (st.ringDay === today()) return;
        st.ringDay = today();
        s.mon += 20;
        addRenown?.(15);
        ping("done");
        toast("A clear bronze tone carries across the square! +20 mon & +15 Renown.");
        save(); hud(); open();
      };

      const stepTemp = (delta) => {
        if (!mold || mold.over) return;
        mold.temp = Math.max(300, Math.min(1050, mold.temp + delta));
        mold.strikes++;
        ping("blip");
        if (mold.strikes >= 6 && !(mold.temp >= mold.spec.min && mold.temp <= mold.spec.max)) {
          mold.over = true;
          ping("close");
          toast("The bronze cooled unevenly before casting.");
        }
        open();
      };

      const cool = e.querySelector("#bf-cool");
      if (cool) cool.onclick = () => stepTemp(-70);

      const heat = e.querySelector("#bf-heat");
      if (heat) heat.onclick = () => stepTemp(90);

      const strike = e.querySelector("#bf-strike");
      if (strike) strike.onclick = () => {
        if (!mold || mold.over) return;
        mold.over = true;
        if (mold.temp >= mold.spec.min && mold.temp <= mold.spec.max) {
          st.cast++;
          s.mon += 50;
          addRenown?.(20);
          ping("done");
          toast(`Cast a pure ${mold.spec.name}! +50 mon & +20 Renown.`);
          save(); hud();
        } else {
          ping("close");
          toast(`Off-temperature (${mold.temp}°C) — the bell cracked on quench.`);
        }
        open();
      };
    });
  }

  return { open };
}
