// The Emerald City Understories: six story locations from the new Oz originals — the Melody Bank,
// the Royal Weather Office, the courthouse, Master Indigo's colorsmith shop, the nine-window attic
// and the signpost of the migrating meadow. State lives in s.oz.
const DAY = () => new Date().toDateString();
const hash = (t) => { let h = 2166136261; for (let i = 0; i < t.length; i++) h = Math.imul(h ^ t.charCodeAt(i), 16777619); return h >>> 0; };
const rngFor = (k) => { let h = hash(k); return () => { h = (Math.imul(h ^ (h >>> 13), 1274126177) + 7) >>> 0; return h / 4294967296; }; };

export const MEADOW_SPOTS = [[95, 66], [108, 63], [117, 62], [101, 68], [124, 58], [90, 60], [114, 67]];
export const meadowAt = () => { const r = rngFor("meadow" + DAY()); return MEADOW_SPOTS[Math.floor(r() * MEADOW_SPOTS.length)]; };

const OFFICIAL = ["Munchkin Blue", "Emerald Green", "Quadling Red", "Winkie Yellow", "Gillikin Purple", "Sunset Orange", "Poppy", "Cornflower", "Peapod", "Pumpkin", "Sapphire", "Thunder Grey", "Rose"];
const FORECAST = ["A gentle drizzle is booked for the Gillikin wedding, in a hundred and forty years. It will be worth the wait.", "Roland has filed the thunder under T, where it rattles the drawer below.", "The Sandman delivers the fog tonight. Sacks are labeled. Please do not untie them indoors.", "Mrs. Cumulus reports the horizon is behaving itself, and asks that nobody lean on it.", "A sun-shower, double-booked by mistake, will fall in two places at once and neither will mind.", "Snow is out of season and knows it. Expect it anyway, briefly, on a dare.", "The barometer on the roof has not moved all week, which the Office regards as a compliment.", "A breeze has come in over its schedule, and will be seen to after lunch."];
const CASES = [
  { who: "The Signpost of the Winkie Road", charge: "Found pointing at itself", kind: "Being wrong on purpose can be a kindness. The signpost is complimented and asked to keep it up.", stern: "The signpost is repainted with correct directions, and every traveler after is poorer for it." },
  { who: "The Birdbath of the Migrating Meadow", charge: "Littering the Registry with invitations", kind: "An invitation is not litter, whatever the map says. Case dismissed; the birdbath reads the verdict aloud to the bees.", stern: "The birdbath is ordered to stop reading the small print. Everyone feels smaller." },
  { who: "A Very Literal Sandman", charge: "Delivering sleep instead of mist", kind: "The fern society of Yellow Gorse has written in to request the same mistake weekly. Mistaken for the better is still the better. Commended.", stern: "The Sandman is reassigned to the fog, and the fern society naps never again." },
  { who: "The Fourteenth Color", charge: "Humming without a licence", kind: "It is named now, by vote, in a garden. You cannot licence what was never for sale. Case dismissed with a hum.", stern: "The color is filed under H for Hum, and the hum stops, and nobody hums it again." },
  { who: "Hengist the Clockwork Clerk", charge: "Filing a lullaby under Hush", kind: "The only filing that survives the ages is by what a thing is for. Hengist is commended and the vault hums all night.", stern: "Hengist is ordered to file by title. The waltzes never dance again." },
  { who: "The Wedding Drizzle", charge: "Arriving a hundred and forty years early", kind: "It is never the rain's fault. The paperweight is admonished; the rain is thanked for its promptness.", stern: "The rain is fined one rainbow and returns to the drawer embarrassed, which no rain should be." },
  { who: "The Ninth Window", charge: "Showing strangers other people's yesterdays", kind: "A letter that cannot be delivered goes on wanting to arrive. The window is doing what the letters would have done. Dismissed.", stern: "The window is curtained. The hand on the latch is never seen, even once, again." },
];
const WINDOWS = [
  (st) => [`The fourth window, the pie window: through it, a farmhouse kitchen, and a Winkie woman lifting a pie out of an oven — and there on the table, if you squint, your own satchel, set down for a moment, in a summer you will get to eventually.`, 12],
  (st) => [`The schoolroom window: a lesson is always just ending, and the chalk on the board reads, in your handwriting, a number — ${Object.keys(st.lit || {}).length} — which happens to be the count of lanterns you have lit.`, 12],
  (st) => [`The garden window: it has just stopped raining, and the drops still hanging on the leaves catch the light, and each one holds a little picture. In the nearest drop, a fox with a spade: ${st.dig?.total || 0} buried boxes found, and the fox in the drop looks very pleased about it.`, 12],
  (st) => [`The sixth window, which is everyone's favourite and nobody's: a fair on a green, and the little foxfire orbs strung between the stalls, and one of the orbs is brighter than the rest. You have found ${Object.keys(st.orbs || {}).length} of them, says the window. The bright one is yours.`, 12],
  (st) => [`The smallest window shows a shop counter at dusk, and on the counter a strongbox, and in the strongbox — the window is always a little vague about money — a number that keeps changing, which at the moment reads ${st.mon || 0}. "It was less yesterday," says the window, "and it will be more tomorrow," and this is what passes, in glass, for a compliment.`, 12],
];

export function createOzCity(o) {
  const { s, panel, toast, ping, save, hud } = o;
  const st = (s.oz ||= {});
  const rollDay = () => { const d = DAY(); if (st.day?.d !== d) st.day = { d, court: 0, color: 0, attic: 0, meadow: 0, weather: 0 }; return st.day; };

  function bank() {
    const dep = st.bank ||= { dep: 0, at: 0, lots: [] };
    if (!dep.lots) dep.lots = dep.dep ? [{ amt: dep.dep, at: dep.at || Date.now() }] : [];
    const now = Date.now();
    const totalDep = dep.lots.reduce((a, l) => a + l.amt, 0);
    dep.dep = totalDep;
    const owed = Math.round(dep.lots.reduce((a, l) => a + l.amt * (1 + 0.1 * Math.min(8, Math.max(0, (now - l.at) / 36e5))), 0));
    const avgPct = totalDep ? Math.round(((owed - totalDep) / totalDep) * 100) : 0;
    panel("The Melody Bank", `<p class="muted">The vault hums behind the wall. Hengist, a copper-colored clockwork clerk, files everything by what it is for, and your hum is filed under H, for Honest.</p>
      <div class="se-mkt">
        <div class="se-good"><span><strong>On deposit</strong><small>${totalDep ? `${totalDep} mon across ${dep.lots.length} deposit${dep.lots.length === 1 ? "" : "s"}` : "No melody deposited yet"}</small></span><em>${totalDep ? `${owed} mon with interest` : "—"}</em></div>
        <div class="se-good"><span><strong>Interest</strong><small>Ten percent per hour, paid in harmonies, up to eight hours per deposit.</small></span><em>${totalDep ? `${avgPct}%` : "0%"}</em></div>
      </div>
      <div class="sg-acts" style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-top:10px">
        ${[10, 25, 50].map((n) => `<button class="btn" type="button" data-dep="${n}" ${s.mon >= n ? "" : "disabled"}>Deposit ${n} mon</button>`).join("")}
        ${totalDep ? `<button class="btn btn-accent" type="button" data-collect>Withdraw ${owed} mon</button>` : ""}
      </div>
      <p class="muted" style="margin-top:10px">"Coins forget their owner the moment they are spent," says the teller. "A song never does. That is the difference between our vault and the other banks."</p>`, (p) => {
      p.querySelectorAll("[data-dep]").forEach((b) => (b.onclick = () => { const n = +b.dataset.dep; if (s.mon < n) return; s.mon -= n; dep.lots.push({ amt: n, at: Date.now() }); dep.dep += n; if (!dep.at) dep.at = Date.now(); ping("choice"); save(); hud(); bank(); }));
      const c = p.querySelector("[data-collect]"); if (c) c.onclick = () => { if (!totalDep) return; s.mon += owed; dep.dep = 0; dep.at = 0; dep.lots = []; ping("done"); toast(`The lullaby pays out: +${owed} mon in harmonies.`); save(); hud(); bank(); };
    });
  }

  function weather() {
    const day = rollDay(), f = FORECAST[hash("forecast" + day.d) % FORECAST.length];
    const booked = st.booked && st.booked.arrive === day.d ? st.booked : null;
    const arrived = st.booked && st.booked.d === day.d ? null : null;
    const landed = st.booked && st.booked.arrive === day.d;
    panel("The Royal Weather Office", `<p class="muted">Roland does the paperwork (the inkwells tremble), Mrs. Cumulus reads the Schedule (she has retired twice, it didn't take), and the Sandman delivers the weather in sacks, labeled.</p>
      <p class="hint">Today's forecast: ${f}</p>
      ${landed ? `<p class="hint" style="font-weight:800">Your booked ${st.booked.kind} arrived this morning. The Office considers the debt settled.</p>` : ""}
      <div class="se-mkt"><div class="se-good"><span><strong>Book a personal weather</strong><small>One booking a day, delivered tomorrow morning: 40 mon on arrival, plus the memory.</small></span><em>${day.weather ? "Booked today" : "20 mon"}</em></div></div>
      <div class="sg-acts" style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-top:10px">
        ${["Drizzle", "Breeze", "Sun-shower", "Snow-fitting"].map((k) => `<button class="btn" type="button" data-w="${k}" ${!day.weather && !st.booked && s.mon >= 20 ? "" : "disabled"}>${k}</button>`).join("")}
        ${st.booked && st.booked.d !== day.d ? `<button class="btn btn-accent" type="button" data-claim>Collect your booked ${st.booked.kind} (+40 mon)</button>` : ""}
      </div>
      <p class="muted" style="margin-top:10px">"It is never the rain's fault," says a small card under the counter glass. "CHECK YOUR PAPERWEIGHTS."</p>`, (p) => {
      p.querySelectorAll("[data-w]").forEach((b) => (b.onclick = () => { if (day.weather || st.booked || s.mon < 20) return; s.mon -= 20; day.weather = 1; st.booked = { kind: b.dataset.w, d: day.d, arrive: new Date(Date.now() + 864e5).toDateString() }; ping("choice"); toast(`Booked: one ${st.booked.kind.toLowerCase()}, tomorrow morning, wherever you are.`); save(); hud(); weather(); }));
      const cl = p.querySelector("[data-claim]"); if (cl) cl.onclick = () => { if (!st.booked) return; s.mon += 40; st.booked = null; ping("done"); toast(`Your booked weather arrived overnight: +40 mon, and the smell of rain on a warm road.`); save(); hud(); weather(); };
    });
  }

  function court() {
    const day = rollDay(), c = CASES[hash("case" + day.d) % CASES.length];
    panel("The Courthouse of Oz", `<p class="muted">Judge Bahomet is mostly awake. The defense is a slightly opinionated sofa. The gavel is very new and enjoying itself far too much.</p>
      <div class="se-mkt"><div class="se-good"><span><strong>${c.who}</strong><small>Charge: ${c.charge}</small></span><em>Case ${day.court ? "heard" : "open"}</em></div></div>
      ${day.court ? `<p class="hint">Verdict delivered. The sofa is comfortable with it, which is the sofa's whole job.</p>` : `<div class="sg-acts" style="display:flex;gap:8px;justify-content:center;margin-top:10px"><button class="btn" type="button" data-v="stern">Correct and stern</button><button class="btn btn-accent" type="button" data-v="kind">Kind, on purpose</button></div>`}
      <p class="muted" style="margin-top:10px">"Everything in Oz wants something," the Judge reminds the room. "The question with a new thing is never what it is. The question is what it wants."</p>`, (p) => {
      p.querySelectorAll("[data-v]").forEach((b) => (b.onclick = () => { if (day.court) return; day.court = 1; const kind = b.dataset.v === "kind"; if (kind) { s.mon += 45; ping("done"); toast(`Verdict: ${c.kind} (+45 mon, and the room agrees.)`); } else ping("close"), toast(c.stern + " Come back tomorrow and try being kinder."); save(); hud(); court(); }));
    });
  }

  function colorsmith() {
    const day = rollDay(), r = rngFor("commission" + day.d);
    const mix = [OFFICIAL[Math.floor(r() * OFFICIAL.length)], OFFICIAL[Math.floor(r() * OFFICIAL.length)]].sort();
    const need = mix[0] === mix[1] ? [mix[0], mix[0], mix[0]] : [mix[0], mix[0], mix[1]];
    let made = [];
    panel("Master Indigo's Colorsmith Shop", `<p class="muted">Thirteen official colors on the rack, each with a seal and an opinion. The commission board today:</p>
      <p class="hint" style="font-weight:800">Wanted: three parts, two of ${need[0]}, one of ${need[1]}. Mix in any order.</p>
      <div class="sg-acts" style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center;margin-top:10px">${OFFICIAL.map((n) => `<button class="btn" type="button" data-c="${n}" style="min-height:34px">${n}</button>`).join("")}</div>
      <p class="hint">Your bowl: <strong id="oz-bowl">empty</strong></p>
      <div class="sg-acts" style="display:flex;gap:8px;justify-content:center;margin-top:6px"><button class="btn btn-accent" type="button" data-pour ${day.color ? "disabled" : ""}>Pour the bowl</button></div>
      ${day.color ? `<p class="muted">Commission attempted today. The rack's parliament is watching. Come back tomorrow.</p>` : ""}`, (p) => {
      const bowl = p.querySelector("#oz-bowl");
      p.querySelectorAll("[data-c]").forEach((b) => (b.onclick = () => { if (made.length >= 3 || day.color) return; made.push(b.dataset.c); bowl.textContent = made.join(" + "); ping("blip"); }));
      p.querySelector("[data-pour]").onclick = () => { if (day.color) return; day.color = 1; const want = [...need].sort().join(), got = [...made].sort().join(); if (made.length === 3 && got === want) { s.mon += 35; ping("done"); toast(`Master Indigo approves: the color is exactly right, and hums only a little. +35 mon`); } else { ping("close"); toast(`Pip winces. The bowl is ${made.length ? made.join(" + ") : "empty"} — it wanted ${need.join(" + ")}. Try again tomorrow.`); } made = []; save(); hud(); colorsmith(); };
    });
  }

  function attic() {
    const day = rollDay(), w = WINDOWS[hash("window" + day.d) % WINDOWS.length];
    const [line, pay] = day.attic ? ["The glass is resting. It showed you today's yesterday already, and it does not repeat itself for buttons.", 0] : w(s);
    panel("The Nine Windows", `<p class="muted">Nine windows blown from undeliverable letters and a jar of August millpond, each looking into somebody's yesterday. A button a look. Senna keeps the glass clean on Thursdays.</p>
      <div class="se-mkt"><div class="se-good"><span><strong>Look through today's window</strong><small>${day.attic ? "Already looked today" : "One button, refunded to you by the house, which likes visitors"}</small></span><em>${pay ? `+${pay} mon` : "—"}</em></div></div>
      ${line ? `<p class="hint" style="margin-top:10px">${line}</p>` : ""}
      <div class="sg-acts" style="display:flex;gap:8px;justify-content:center;margin-top:10px"><button class="btn btn-accent" type="button" data-look ${day.attic ? "disabled" : ""}>Look</button></div>
      <p class="muted" style="margin-top:10px">"A letter that cannot be delivered goes on wanting to arrive," says the Tabor family saying, painted on the attic door. "The glass is only doing what the letters would have done."</p>`, (p) => {
      p.querySelector("[data-look]").onclick = () => { if (day.attic) return; day.attic = 1; s.mon += pay; ping("done"); toast(`The window shows you yesterday kindly. +${pay} mon`); save(); hud(); attic(); };
    });
  }

  function meadowPage(found) {
    const day = rollDay(), at = meadowAt();
    if (found && !day.meadow) { day.meadow = 1; s.mon += 30; ping("done"); toast(`The birdbath reads you the small print, which is always an invitation. +30 mon`); save(); hud(); }
    panel("The Migrating Meadow", `<p class="muted">The signpost of the meadow stands at the edge of the city, and points somewhere new each day. Being wrong on purpose can be a kindness, so take its direction as a compliment.</p>
      <div class="se-mkt"><div class="se-good"><span><strong>Where the meadow is today</strong><small>${found ? "You are standing in it. The grass is breathing. The birdbath is reading your mail, which it does with your permission, obviously." : `The signpost points ${["south", "south-south-west", "at itself", "vaguely homeward"][hash("point" + day.d) % 4]}. The birdbath suggests walking around the Emerald City's green edge and listening for bees.`}</small></span><em>${day.meadow ? "Visited today" : "30 mon if found"}</em></div></div>
      ${found ? `<p class="hint">READ THE BACK, says the birdbath, of everything, always. It is the Registry's own rule, printed by a founder of unusual mercy.</p>` : ""}
      <p class="muted">The meadow is walking home at the speed of a thoughtful cow, in a spiral four hundred years wide. It will arrive in time. This is known.</p>`, () => {});
  }

  return { bank, weather, court, colorsmith, attic, meadowPage, meadowAt, state: st };
}
