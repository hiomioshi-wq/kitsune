// Kitsune World: Unique interactive interiors for Hollow Pine, Brask, Saltwick, Night Market, Platform Zero, and Oz buildings.
import { dayKey } from "./lifecore.js";

export function createInteriors({ s, panel, toast, ping, save, hud, esc }) {
  const iv = (s.interiors ||= {
    teaDay: "",
    radioDay: "",
    clockDay: "",
    bindDay: "",
    booksBound: [],
    umbDay: "",
    passDay: "",
    libDay: "",
    obsDay: "",
    stuDay: "",
    glassDay: "",
    postDay: "",
    palDay: "",
    lodgeDay: "",
    dojoDay: "",
    petalDay: "",
    caraDay: "",
    stiltDay: "",
    forgeDay: "",
    clightDay: "",
    archDay: "",
    reefDay: "",
    grotDay: "",
    cratDay: "",
    ambDay: "",
    saltDay: "",
    basDay: "",
    kelpDay: "",
    priDay: "",
    stmDay: "",
    jadDay: "",
    sunInDay: "",
    horDay: "",
    atoDay: "",
    mirDay: "",
    cinDay: "",
    lstDay: "",
    aurDay: "",
    velDay: "",
    spfDay: "",
    cusDay: "",
    tmpDay: "",
    celDay: "",
    cryDay: "",
    crmDay: "",
    oasDay: "",
    ashDay: "",
    prlDay: "",
    drfDay: "",
    eclDay: "",
    trmDay: "",
    silDay: "",
    eldDay: "",
    verDay: "",
    abyDay: "",
    chpDay: "",
    mstDay: "",
    vodDay: "",
    sovDay: "",
    astDay: "",
    hgtDay: "",
    dunDay: "",
    magDay: "",
    mprDay: "",
    fogDay: "",
    trnDay: "",
    aslDay: "",
    cmtDay: "",
    lotDay: "",
    safDay: "",
    ccfDay: "",
    stfDay: "",
    redDay: "",
    cobDay: "",
    zenDay: "",
    nebDay: "",
    plmDay: "",
    ochDay: "",
    pyrDay: "",
    shlDay: "",
    wilDay: "",
    iceDay: "",
    tdwDay: "",
    ortDay: "",
    gdoDay: "",
    ecfDay: "",
    mtfDay: "",
    prgDay: "",
    elyDay: "",
    empDay: "",
    qzwDay: "",
    farDay: {},
  });
  iv.booksBound ||= [];
  iv.farDay ||= {};

  const today = () => dayKey();

  function tea() {
    const d = today(), ready = iv.teaDay !== d;
    const shelf = [
      ["One Green Button", "A hedgehog left a note asking if it turned up between Seat 4 and the window."],
      ["A Half-Note Flat Bell", "Polished brass. Ponzu insists it rings in C-sharp only on Tuesdays."],
      ["A Damp Paper Ticket", "Stamped for Saltwick Shore, 1994. Still smells faintly of cedar."],
    ];
    panel("Inside The Tea Shop", `<p class="muted">Steam curls from a dented kettle. Behind the counter, Ponzu keeps a shelf of everything left on the little seaside train.</p><div class="se-mkt"><div class="se-good"><span><strong>🍵 Over-Steeped Cup</strong><small>Daily · +20 mon & +1 Lucky Ripple</small></span><button class="btn btn-accent" type="button" id="in-tea" ${ready ? "" : "disabled"}>${ready ? "Drink Tea" : "Steeped Today ✓"}</button></div>${shelf.map(([n, desc]) => `<div class="se-good"><span><strong>${esc(n)}</strong><small>${esc(desc)}</small></span><em>On Shelf</em></div>`).join("")}</div>`, (e) => {
      e.querySelector("#in-tea").onclick = () => {
        if (!ready) return;
        iv.teaDay = d; s.mon += 20; s.luck = (s.luck || 0) + 1;
        ping("done"); save(); hud(); toast("Steeped too long, just right. +20 mon & +1 Luck!"); tea();
      };
    });
  }

  function radio() {
    const d = today(), ready = iv.radioDay !== d;
    let freq = 94.2;
    const stations = [
      [89.5, "Hollow Pine Weather Loop — light mist over the reservoir."],
      [94.2, "Static... and a faint tap-tap-tap from someone listening at 2 a.m."],
      [103.7, "Platform Zero Midnight Express — arriving three minutes early."],
    ];
    panel("Inside Moth Radio", `<p class="muted">A washing machine drum hums beside three wired toasters. Wren's red ON AIR bulb flickers softly.</p><div class="se-mkt">${stations.map(([f, desc]) => `<div class="se-good"><span><strong>📻 ${f} MHz</strong><small>${esc(desc)}</small></span><button class="btn" type="button" data-fq="${f}">Tune</button></div>`).join("")}<div class="se-good"><span><strong>🎙️ Broadcast 2 a.m. Note</strong><small>Daily · +35 mon</small></span><button class="btn btn-accent" type="button" id="in-rad" ${ready ? "" : "disabled"}>${ready ? "Broadcast" : "Sent Today ✓"}</button></div></div>`, (e) => {
      e.querySelectorAll("[data-fq]").forEach((x) => (x.onclick = () => { freq = +x.dataset.fq; ping("blip"); toast(`Tuned to ${freq} MHz.`); }));
      e.querySelector("#in-rad").onclick = () => {
        if (!ready) return;
        iv.radioDay = d; s.mon += 35;
        ping("done"); save(); hud(); toast(`Broadcast sent on ${freq} MHz! Somebody wrote back (+35 mon).`); radio();
      };
    });
  }

  function clock() {
    const d = today(), ready = iv.clockDay !== d;
    let offset = -1;
    panel("Inside The Great Clock", `<p class="muted">Brass gears the size of cartwheels turn above Brask. Every town clock sets itself three seconds slow by this escapement.</p><div class="px-grid"><button type="button" class="px-tile" id="in-clk" ${ready ? "" : "disabled"}><strong>🕰️ Escapement Weight</strong><small id="in-clklbl">${ready ? `Currently ${offset}s — Tap to set to -3s` : "Calibrated to -3s Today ✓"}</small></button></div>`, (e) => {
      e.querySelector("#in-clk").onclick = () => {
        if (iv.clockDay === d) return;
        offset = offset === -1 ? -2 : offset === -2 ? -3 : -1;
        ping("blip");
        if (offset === -3) {
          iv.clockDay = d; s.mon += 40;
          if (s.square?.ore) s.square.ore.Silver = (s.square.ore.Silver || 0) + 1;
          e.querySelector("#in-clklbl").textContent = "Calibrated (-3s)! +40 mon & +1 Silver Ore";
          e.querySelector("#in-clk").disabled = true;
          ping("done"); save(); hud();
        } else e.querySelector("#in-clklbl").textContent = `Currently ${offset}s — Tap to set to -3s`;
      };
    });
  }

  function bindery() {
    const d = today(), ready = iv.bindDay !== d;
    panel("Inside The Bookbinder", `<p class="muted">Thread, bone folders, and glue pots line Pell's bench. Bind a pocket folio today.</p><div class="px-row"><input class="field" id="bn-tit" maxlength="28" placeholder="Folio title (e.g. Rain Notes)" aria-label="Folio title"><button class="btn btn-accent" type="button" id="bn-go" ${ready ? "" : "disabled"}>${ready ? "Stitch Folio (+30 mon)" : "Bound Today ✓"}</button></div><h3 style="margin-top:12px">Bound Folios (${iv.booksBound.length})</h3><div class="se-mkt">${iv.booksBound.slice(-5).reverse().map((b) => `<div class="se-good"><span><strong>📕 ${esc(b.t)}</strong><small>${esc(b.d)}</small></span><em>Mended</em></div>`).join("") || "<p class=\"muted\">No folios bound yet.</p>"}</div>`, (e) => {
      e.querySelector("#bn-go").onclick = () => {
        if (!ready) return;
        const t = e.querySelector("#bn-tit").value.trim() || "Untitled Pocket Folio";
        iv.bindDay = d; iv.booksBound.push({ t, d }); iv.booksBound = iv.booksBound.slice(-20);
        s.mon += 30; ping("done"); save(); hud(); toast(`Bound "${t}"! +30 mon`); bindery();
      };
    });
  }

  function umbrella() {
    const d = today(), ready = iv.umbDay !== d;
    const nine = ["First: Clear Rain", "Second: Harbor Fog", "Third: Cedar Wind", "Fourth: Brass Midnight", "Fifth: Saltwick Mist", "Sixth: Paper Lantern", "Seventh: The Borrowed Cloud", "Eighth: High Pass Snow", "Ninth: Dry Sun"];
    panel("Inside Tamba's Umbrellas", `<p class="muted">Nine painted umbrellas stand in tall cedar crocks. None are for sale.</p><div class="se-mkt"><div class="se-good"><span><strong>☂️ Borrow Today's Lucky Umbrella</strong><small>Daily · +25 mon & +1 Lucky Ripple</small></span><button class="btn btn-accent" type="button" id="in-umb" ${ready ? "" : "disabled"}>${ready ? "Inspect Stand" : "Visited Today ✓"}</button></div>${nine.map((u) => `<div class="se-good"><span><strong>${esc(u)}</strong></span><em>Not for sale</em></div>`).join("")}</div>`, (e) => {
      e.querySelector("#in-umb").onclick = () => {
        if (!ready) return;
        iv.umbDay = d; s.mon += 25; s.luck = (s.luck || 0) + 1;
        ping("done"); save(); hud(); toast("Tamba tips his hat! +25 mon & +1 Luck"); umbrella();
      };
    });
  }

  function station() {
    const d = today(), ready = iv.passDay !== d;
    panel("Inside Platform Zero", `<p class="muted">A quiet half-moon platform with brass benches and no ticket window. Leave one true line to stamp a sleeper pass.</p><div class="px-row"><input class="field" id="st-ln" maxlength="48" placeholder="One true thing..." aria-label="One true thing"><button class="btn btn-accent" type="button" id="st-go" ${ready ? "" : "disabled"}>${ready ? "Stamp Pass (+50 mon)" : "Stamped Today ✓"}</button></div>`, (e) => {
      e.querySelector("#st-go").onclick = () => {
        if (!ready) return;
        iv.passDay = d; s.mon += 50;
        ping("done"); save(); hud(); toast("Half-moon pass stamped! +50 mon"); station();
      };
    });
  }

  function sunken() {
    const d = today(), ready = iv.libDay !== d;
    panel("The Library Under the Lake", `<p class="muted">Waterproof glass cases glow pale green. The Carp Librarian adjusts his spectacles over the return slot.</p><div class="se-mkt"><div class="se-good"><span><strong>📖 Settle 1998 Overdue Fine</strong><small>Pay 10 mon · Draw an Archive Scroll (+25–65 mon & +1 Luck)</small></span><button class="btn btn-accent" type="button" id="in-lib" ${ready && s.mon >= 10 ? "" : "disabled"}>${ready ? "Pay 10 mon" : "Settled Today ✓"}</button></div></div>`, (e) => {
      e.querySelector("#in-lib").onclick = () => {
        if (!ready || s.mon < 10) return;
        s.mon -= 10; iv.libDay = d;
        const found = 25 + Math.floor(Math.random() * 41);
        s.mon += found; s.luck = (s.luck || 0) + 1;
        ping("done"); save(); hud(); toast(`Archive Scroll tucked with ${found} mon & +1 Luck!`); sunken();
      };
    });
  }

  function observatory() {
    const d = today(), ready = iv.obsDay !== d;
    panel("Inside The Weather Office", `<p class="muted">Rolled parchment maps of fog, frost, and a 140-year drizzle cover Odo's drafting table.</p><div class="se-mkt"><div class="se-good"><span><strong>🗺️ Log Barometric Reading</strong><small>Daily · +35 mon & +1 Copper Ore</small></span><button class="btn btn-accent" type="button" id="in-obs" ${ready ? "" : "disabled"}>${ready ? "Log Chart" : "Logged Today ✓"}</button></div></div>`, (e) => {
      e.querySelector("#in-obs").onclick = () => {
        if (!ready) return;
        iv.obsDay = d; s.mon += 35;
        if (s.square?.ore) s.square.ore.Copper = (s.square.ore.Copper || 0) + 1;
        ping("done"); save(); hud(); toast("Chart logged! +35 mon & +1 Copper Ore"); observatory();
      };
    });
  }

  function studio() {
    const d = today(), ready = iv.stuDay !== d;
    panel("Inside Haru's Studio", `<p class="muted">Stacks of ink-wash pages dry on clotheslines. On the center desk, a blank sheet waits for one brushstroke.</p><div class="se-mkt"><div class="se-good"><span><strong>🖌️ Ink One Stroke on Page Zero</strong><small>Daily · +30 mon</small></span><button class="btn btn-accent" type="button" id="in-stu" ${ready ? "" : "disabled"}>${ready ? "Draw Stroke" : "Drawn Today ✓"}</button></div></div>`, (e) => {
      e.querySelector("#in-stu").onclick = () => {
        if (!ready) return;
        iv.stuDay = d; s.mon += 30;
        ping("done"); save(); hud(); toast("The page sketched a tiny fox back! +30 mon"); studio();
      };
    });
  }

  function glass() {
    const d = today(), ready = iv.glassDay !== d;
    panel("The Wizard's Glasshouse", `<p class="muted">Warm humidity and emerald glass panes. Cephalotus the polite pitcher plant perks up beside Billina's nest.</p><div class="se-mkt"><div class="se-good"><span><strong>🪴 Mist & Feed Cephalotus</strong><small>15 mon · Polite thank-you + 35–55 mon & +1 Luck</small></span><button class="btn btn-accent" type="button" id="in-gls" ${ready && s.mon >= 15 ? "" : "disabled"}>${ready ? "Feed (15 mon)" : "Fed Today ✓"}</button></div></div>`, (e) => {
      e.querySelector("#in-gls").onclick = () => {
        if (!ready || s.mon < 15) return;
        s.mon -= 15; iv.glassDay = d;
        const tip = 35 + Math.floor(Math.random() * 21);
        s.mon += tip; s.luck = (s.luck || 0) + 1;
        ping("done"); save(); hud(); toast(`"Much obliged!" +${tip} mon & +1 Luck`); glass();
      };
    });
  }

  function post() {
    const d = today(), ready = iv.postDay !== d;
    panel("Inside The High Post Office", `<p class="muted">Forty miles of winter mail sorted into pine pigeonholes. Fennick's spare satchel hangs by the stove.</p><div class="se-mkt"><div class="se-good"><span><strong>📮 Sort Mountain Parcels</strong><small>Daily · +40 mon & +1 Lucky Ripple</small></span><button class="btn btn-accent" type="button" id="in-pst" ${ready ? "" : "disabled"}>${ready ? "Sort Rack" : "Sorted Today ✓"}</button></div></div>`, (e) => {
      e.querySelector("#in-pst").onclick = () => {
        if (!ready) return;
        iv.postDay = d; s.mon += 40; s.luck = (s.luck || 0) + 1;
        ping("done"); save(); hud(); toast("Sorted the High Post rack! +40 mon & +1 Luck"); post();
      };
    });
  }

  function palace() {
    const d = today(), ready = iv.palDay !== d;
    panel("Inside The Emerald Palace", `<p class="muted">Green marble pillars reflect the Great Book of Oz, open on a brass lectern.</p><div class="se-mkt"><div class="se-good"><span><strong>📖 Consult the Great Book</strong><small>Daily · +45 mon & +1 Lucky Ripple</small></span><button class="btn btn-accent" type="button" id="in-pal" ${ready ? "" : "disabled"}>${ready ? "Read Entry" : "Consulted Today ✓"}</button></div></div>`, (e) => {
      e.querySelector("#in-pal").onclick = () => {
        if (!ready) return;
        iv.palDay = d; s.mon += 45; s.luck = (s.luck || 0) + 1;
        ping("done"); save(); hud(); toast("Glinda sends her regards! +45 mon & +1 Luck"); palace();
      };
    });
  }

  function lodge() {
    const d = today(), ready = iv.lodgeDay !== d;
    panel("Inside Whiteback Lodge", `<p class="muted">A cedar fire crackles beside Old Bram's snowshoe rack and the high-ridge trail log.</p><div class="se-mkt"><div class="se-good"><span><strong>🥾 Sign the Trail Ledger</strong><small>Daily · +35 mon & +1 Silver Ore</small></span><button class="btn btn-accent" type="button" id="in-ldg" ${ready ? "" : "disabled"}>${ready ? "Sign Log" : "Signed Today ✓"}</button></div></div>`, (e) => {
      e.querySelector("#in-ldg").onclick = () => {
        if (!ready) return;
        iv.lodgeDay = d; s.mon += 35;
        if (s.square?.ore) s.square.ore.Silver = (s.square.ore.Silver || 0) + 1;
        ping("done"); save(); hud(); toast("Trail logged! +35 mon & +1 Silver Ore"); lodge();
      };
    });
  }

  function dojo() {
    const d = today(), ready = iv.dojoDay !== d;
    panel("Inside The Bamboo Dojo", `<p class="muted">Woven tatami mats smell of green bamboo. Sensei Kuro nods from the cedar dais.</p><div class="se-mkt"><div class="se-good"><span><strong>🥋 Complete Morning Kata</strong><small>Daily · +45 mon & +1 Lucky Ripple</small></span><button class="btn btn-accent" type="button" id="in-doj" ${ready ? "" : "disabled"}>${ready ? "Practice Kata" : "Practiced Today ✓"}</button></div></div>`, (e) => {
      e.querySelector("#in-doj").onclick = () => {
        if (!ready) return;
        iv.dojoDay = d; s.mon += 45; s.luck = (s.luck || 0) + 1;
        ping("done"); save(); hud(); toast("Sharp focus! +45 mon & +1 Luck"); dojo();
      };
    });
  }

  function teahouse() {
    const d = today(), ready = iv.petalDay !== d;
    panel("Inside The Petal Teahouse", `<p class="muted">Nine-day sakura petals drift past the paper screens while Ren mumbles over a poem.</p><div class="se-mkt"><div class="se-good"><span><strong>🌸 Sip Blossom Tea</strong><small>Daily · +35 mon & +1 Lucky Ripple</small></span><button class="btn btn-accent" type="button" id="in-ptl" ${ready ? "" : "disabled"}>${ready ? "Sip Tea" : "Visited Today ✓"}</button></div></div>`, (e) => {
      e.querySelector("#in-ptl").onclick = () => {
        if (!ready) return;
        iv.petalDay = d; s.mon += 35; s.luck = (s.luck || 0) + 1;
        ping("done"); save(); hud(); toast("Blossom tea! +35 mon & +1 Luck"); teahouse();
      };
    });
  }

  function caravan() {
    const d = today(), ready = iv.caraDay !== d;
    panel("Inside Caravanserai", `<p class="muted">Cool sandstone arches, hanging brass lamps, and Zaira's water-jars lined in neat rows.</p><div class="se-mkt"><div class="se-good"><span><strong>🐪 Trade Caravan Parcel</strong><small>20 mon · Daily 45–80 mon & +1 Gold Ore</small></span><button class="btn btn-accent" type="button" id="in-car" ${ready && s.mon >= 20 ? "" : "disabled"}>${ready ? "Trade (20 mon)" : "Traded Today ✓"}</button></div></div>`, (e) => {
      e.querySelector("#in-car").onclick = () => {
        if (!ready || s.mon < 20) return;
        s.mon -= 20; iv.caraDay = d;
        const ret = 45 + Math.floor(Math.random() * 36);
        s.mon += ret;
        if (s.square?.ore) s.square.ore.Gold = (s.square.ore.Gold || 0) + 1;
        ping("done"); save(); hud(); toast(`Caravan profit: +${ret} mon & +1 Gold Ore!`); caravan();
      };
    });
  }

  function stilt() {
    const d = today(), ready = iv.stiltDay !== d;
    panel("Inside The Stilt Inn", `<p class="muted">Lanterns sway over the mire planks while frogs chorus beneath the floorboards.</p><div class="se-mkt"><div class="se-good"><span><strong>🐸 Light Bog Hearth</strong><small>Daily · +35 mon & +1 Copper Ore</small></span><button class="btn btn-accent" type="button" id="in-stl" ${ready ? "" : "disabled"}>${ready ? "Tend Hearth" : "Tended Today ✓"}</button></div></div>`, (e) => {
      e.querySelector("#in-stl").onclick = () => {
        if (!ready) return;
        iv.stiltDay = d; s.mon += 35;
        if (s.square?.ore) s.square.ore.Copper = (s.square.ore.Copper || 0) + 1;
        ping("done"); save(); hud(); toast("Hearth lit! +35 mon & +1 Copper Ore"); stilt();
      };
    });
  }

  function forge() {
    const d = today(), ready = iv.forgeDay !== d;
    panel("Inside The Caldera Forge", `<p class="muted">Volcanic heat rises from the anvil pit while Ignis turns glowing tongs.</p><div class="se-mkt"><div class="se-good"><span><strong>🔥 Pump the Bellows</strong><small>Daily · +45 mon & +1 Ruby Ore</small></span><button class="btn btn-accent" type="button" id="in-frg" ${ready ? "" : "disabled"}>${ready ? "Pump Bellows" : "Forged Today ✓"}</button></div></div>`, (e) => {
      e.querySelector("#in-frg").onclick = () => {
        if (!ready) return;
        iv.forgeDay = d; s.mon += 45;
        if (s.square?.ore) s.square.ore.Ruby = (s.square.ore.Ruby || 0) + 1;
        ping("done"); save(); hud(); toast("Hot sparks! +45 mon & +1 Ruby Ore"); forge();
      };
    });
  }

  function lighthouse() {
    const d = today(), ready = iv.clightDay !== d;
    panel("Inside Cloudmere Light", `<p class="muted">Brass Fresnel lenses gleam above the cloud sea while Captain Gull checks his charts.</p><div class="se-mkt"><div class="se-good"><span><strong>🗼 Trim the Sky Wick</strong><small>Daily · +40 mon & +2 Lucky Ripples</small></span><button class="btn btn-accent" type="button" id="in-clg" ${ready ? "" : "disabled"}>${ready ? "Trim Wick" : "Trimmed Today ✓"}</button></div></div>`, (e) => {
      e.querySelector("#in-clg").onclick = () => {
        if (!ready) return;
        iv.clightDay = d; s.mon += 40; s.luck = (s.luck || 0) + 2;
        ping("done"); save(); hud(); toast("Beam burning bright! +40 mon & +2 Luck"); lighthouse();
      };
    });
  }

  function archive() {
    const d = today(), ready = iv.archDay !== d;
    panel("Inside The Drowned Archive", `<p class="muted">Tall obsidian shelves hold the capital's surviving scrolls, guarded by a sleek black cat.</p><div class="se-mkt"><div class="se-good"><span><strong>📜 File Capital Scroll</strong><small>Daily · +50 mon & +1 Moonstone Ore</small></span><button class="btn btn-accent" type="button" id="in-arc" ${ready ? "" : "disabled"}>${ready ? "File Scroll" : "Filed Today ✓"}</button></div></div>`, (e) => {
      e.querySelector("#in-arc").onclick = () => {
        if (!ready) return;
        iv.archDay = d; s.mon += 50;
        if (s.square?.ore) s.square.ore.Moonstone = (s.square.ore.Moonstone || 0) + 1;
        ping("done"); save(); hud(); toast("Filed neatly! +50 mon & +1 Moonstone Ore"); archive();
      };
    });
  }

  function reefhall() {
    const d = today(), ready = iv.reefDay !== d;
    let rubs = 0;
    panel("Inside The Tidehouse", `<p class="muted">Salt-crusted diving bells hang from driftwood rafters while Old Barnaby polishes his favorite brass bell.</p><div class="px-grid"><button type="button" class="px-tile" id="in-rfb" ${ready ? "" : "disabled"}><strong>🔔 Polish Brass Bell</strong><small id="in-rfbl">${ready ? "0/5 polishes" : "Gleaming Today ✓"}</small></button></div>`, (e) => {
      e.querySelector("#in-rfb").onclick = () => {
        if (iv.reefDay === d) return;
        rubs++; ping("blip");
        if (rubs >= 5) {
          iv.reefDay = d; s.mon += 45;
          if (s.square?.haven?.gems) s.square.haven.gems.opal = (s.square.haven.gems.opal || 0) + 1;
          e.querySelector("#in-rfbl").textContent = "Gleaming! +45 mon & +1 Mist Opal";
          e.querySelector("#in-rfb").disabled = true;
          ping("done"); save(); hud();
        } else e.querySelector("#in-rfbl").textContent = `${rubs}/5 polishes`;
      };
    });
  }

  function grotto() {
    const d = today(), ready = iv.grotDay !== d;
    panel("Inside The Crystal Grotto", `<p class="muted">Bioluminescent mushrooms pulse along damp quartz walls. Every whisper echoes back twice.</p><div class="se-mkt"><div class="se-good"><span><strong>🍄 Quiet Echo</strong><small>Daily · +35 mon & +1 Silver Ore</small></span><button class="btn btn-accent" type="button" id="in-gr1" ${ready ? "" : "disabled"}>${ready ? "Whisper" : "Visited Today ✓"}</button></div><div class="se-good"><span><strong>💎 Crystal Hum</strong><small>Daily · +2 Mountain Quartz & +1 Luck</small></span><button class="btn btn-accent" type="button" id="in-gr2" ${ready ? "" : "disabled"}>${ready ? "Hum" : "Visited Today ✓"}</button></div></div>`, (e) => {
      e.querySelector("#in-gr1").onclick = () => { if (!ready) return; iv.grotDay = d; s.mon += 35; if (s.square?.ore) s.square.ore.Silver = (s.square.ore.Silver || 0) + 1; ping("done"); save(); hud(); toast("+35 mon & +1 Silver Ore!"); grotto(); };
      e.querySelector("#in-gr2").onclick = () => { if (!ready) return; iv.grotDay = d; s.luck = (s.luck || 0) + 1; if (s.square?.haven?.gems) s.square.haven.gems.quartz = (s.square.haven.gems.quartz || 0) + 2; ping("done"); save(); hud(); toast("+2 Quartz & +1 Luck!"); grotto(); };
    });
  }

  function crater() {
    const d = today(), ready = iv.cratDay !== d;
    panel("Inside Starfall Crater", `<p class="muted">A warm iron meteor rests in a cradle of blue glacial ice. A wooden sign warns: DO NOT LICK.</p><div class="se-mkt"><div class="se-good"><span><strong>☄️ Warm Paws by Meteor</strong><small>Daily · +40 mon, +2 Luck & +1 Sun Topaz</small></span><button class="btn btn-accent" type="button" id="in-crt" ${ready ? "" : "disabled"}>${ready ? "Warm Up" : "Warmed Today ✓"}</button></div></div>`, (e) => {
      e.querySelector("#in-crt").onclick = () => { if (!ready) return; iv.cratDay = d; s.mon += 40; s.luck = (s.luck || 0) + 2; if (s.square?.haven?.gems) s.square.haven.gems.topaz = (s.square.haven.gems.topaz || 0) + 1; ping("done"); save(); hud(); toast("+40 mon, +2 Luck & +1 Sun Topaz!"); crater(); };
    });
  }

  function amberlodge() {
    const d = today(), ready = iv.ambDay !== d;
    panel("Inside Amber Lodge", `<p class="muted">Golden resin lanterns light Sylva's forestry desk and shelves of fossilized beetles.</p><div class="se-mkt"><div class="se-good"><span><strong>🪲 Inspect Amber Specimen</strong><small>Daily · +45 mon & +1 Sun Topaz</small></span><button class="btn btn-accent" type="button" id="in-amb" ${ready ? "" : "disabled"}>${ready ? "Inspect" : "Inspected Today ✓"}</button></div></div>`, (e) => {
      e.querySelector("#in-amb").onclick = () => { if (!ready) return; iv.ambDay = d; s.mon += 45; if (s.square?.haven?.gems) s.square.haven.gems.topaz = (s.square.haven.gems.topaz || 0) + 1; ping("done"); save(); hud(); toast("+45 mon & +1 Sun Topaz!"); amberlodge(); };
    });
  }

  function saltobs() {
    const d = today(), ready = iv.saltDay !== d;
    let step = 0;
    const stages = ["Cloudy", "Clear", "Crystal"];
    panel("Inside Salt Observatory", `<p class="muted">A telescope carved from rock salt points toward the outer sea.</p><div class="px-grid"><button type="button" class="px-tile" id="in-slt" ${ready ? "" : "disabled"}><strong>🔭 Focus Salt Lens</strong><small id="in-sltl">${ready ? `Stage: ${stages[step]}` : "Focused Today ✓"}</small></button></div>`, (e) => {
      e.querySelector("#in-slt").onclick = () => {
        if (iv.saltDay === d) return;
        step++; ping("blip");
        if (step >= 2) {
          iv.saltDay = d; s.mon += 50;
          if (s.square?.haven?.gems) s.square.haven.gems.opal = (s.square.haven.gems.opal || 0) + 1;
          e.querySelector("#in-sltl").textContent = "Crystal Clear! +50 mon & +1 Mist Opal";
          e.querySelector("#in-slt").disabled = true;
          ping("done"); save(); hud();
        } else e.querySelector("#in-sltl").textContent = `Stage: ${stages[step]}`;
      };
    });
  }

  function basaltlight() {
    const d = today(), ready = iv.basDay !== d;
    panel("Inside Basalt Lighthouse", `<p class="muted">Black volcanic blocks frame a roaring obsidian brazier.</p><div class="se-mkt"><div class="se-good"><span><strong>🔥 Stoke Brazier (1 Copper Ore)</strong><small>Daily · +65 mon & +2 Lucky Ripples</small></span><button class="btn btn-accent" type="button" id="in-bas" ${ready && (s.square?.ore?.Copper || 0) >= 1 ? "" : "disabled"}>${ready ? "Stoke" : "Stoked Today ✓"}</button></div></div>`, (e) => {
      e.querySelector("#in-bas").onclick = () => { if (!ready || (s.square?.ore?.Copper || 0) < 1) return; s.square.ore.Copper--; iv.basDay = d; s.mon += 65; s.luck = (s.luck || 0) + 2; ping("done"); save(); hud(); toast("+65 mon & +2 Luck!"); basaltlight(); };
    });
  }

  function kelpharbor() {
    const d = today(), ready = iv.kelpDay !== d;
    panel("Inside Kelp Harbor", `<p class="muted">Bundles of dried sea-kelp hang above woven fishing nets.</p><div class="se-mkt"><div class="se-good"><span><strong>🕸️ Weave Kelp Net</strong><small>Daily · +35 mon & +2 Lucky Ripples</small></span><button class="btn btn-accent" type="button" id="in-klp" ${ready ? "" : "disabled"}>${ready ? "Weave" : "Woven Today ✓"}</button></div></div>`, (e) => {
      e.querySelector("#in-klp").onclick = () => { if (!ready) return; iv.kelpDay = d; s.mon += 35; s.luck = (s.luck || 0) + 2; ping("done"); save(); hud(); toast("+35 mon & +2 Luck!"); kelpharbor(); };
    });
  }

  function prismspire() {
    const d = today(), ready = iv.priDay !== d;
    panel("Inside Prism Spire", `<p class="muted">Sunlight splits into seven beams through a giant suspended prism. Choose a beam to attune today.</p><div class="se-mkt"><div class="se-good"><span><strong>🔴 Ruby Beam</strong><small>Daily · +1 Ruby Ore & +25 mon</small></span><button class="btn btn-accent" type="button" id="in-pr1" ${ready ? "" : "disabled"}>Attune</button></div><div class="se-good"><span><strong>🟡 Gold Beam</strong><small>Daily · +1 Gold Ore & +30 mon</small></span><button class="btn btn-accent" type="button" id="in-pr2" ${ready ? "" : "disabled"}>Attune</button></div><div class="se-good"><span><strong>🟣 Opal Beam</strong><small>Daily · +1 Mist Opal & +20 mon</small></span><button class="btn btn-accent" type="button" id="in-pr3" ${ready ? "" : "disabled"}>Attune</button></div></div>`, (e) => {
      e.querySelector("#in-pr1").onclick = () => { if (!ready) return; iv.priDay = d; s.mon += 25; if (s.square?.ore) s.square.ore.Ruby = (s.square.ore.Ruby || 0) + 1; ping("done"); save(); hud(); toast("+1 Ruby Ore & +25 mon!"); prismspire(); };
      e.querySelector("#in-pr2").onclick = () => { if (!ready) return; iv.priDay = d; s.mon += 30; if (s.square?.ore) s.square.ore.Gold = (s.square.ore.Gold || 0) + 1; ping("done"); save(); hud(); toast("+1 Gold Ore & +30 mon!"); prismspire(); };
      e.querySelector("#in-pr3").onclick = () => { if (!ready) return; iv.priDay = d; s.mon += 20; if (s.square?.haven?.gems) s.square.haven.gems.opal = (s.square.haven.gems.opal || 0) + 1; ping("done"); save(); hud(); toast("+1 Mist Opal & +20 mon!"); prismspire(); };
    });
  }

  function stormwatch() {
    const d = today(), ready = iv.stmDay !== d;
    panel("Inside Storm Watch", `<p class="muted">Spinning brass anemometers click against copper gale gauges.</p><div class="se-mkt"><div class="se-good"><span><strong>🌪️ Log Gale Pressure</strong><small>Daily · +45 mon & +1 Silver Ore</small></span><button class="btn btn-accent" type="button" id="in-stm" ${ready ? "" : "disabled"}>${ready ? "Log Gale" : "Logged Today ✓"}</button></div></div>`, (e) => {
      e.querySelector("#in-stm").onclick = () => { if (!ready) return; iv.stmDay = d; s.mon += 45; if (s.square?.ore) s.square.ore.Silver = (s.square.ore.Silver || 0) + 1; ping("done"); save(); hud(); toast("+45 mon & +1 Silver Ore!"); stormwatch(); };
    });
  }

  function jadepavilion() {
    const d = today(), ready = iv.jadDay !== d;
    panel("Inside Jade Pavilion", `<p class="muted">Cool mist drifts from the jade falls over a polished stone basin.</p><div class="se-mkt"><div class="se-good"><span><strong>🪷 Toss Jade Pebble</strong><small>Daily · +40 mon & +20 Companion Bond XP</small></span><button class="btn btn-accent" type="button" id="in-jad" ${ready ? "" : "disabled"}>${ready ? "Toss Pebble" : "Visited Today ✓"}</button></div></div>`, (e) => {
      e.querySelector("#in-jad").onclick = () => {
        if (!ready) return;
        iv.jadDay = d; s.mon += 40;
        if (s.square?.haven) s.square.haven.compXp = (s.square.haven.compXp || 0) + 20;
        ping("done"); save(); hud(); toast("+40 mon & +20 Companion Bond XP!"); jadepavilion();
      };
    });
  }

  function sunspireinn() {
    const d = today(), ready = iv.sunInDay !== d;
    panel("Inside Sunspire Caravanserai", `<p class="muted">Woven awnings shade brass spice jars and tall water gourds.</p><div class="se-mkt"><div class="se-good"><span><strong>🌶️ Barter Sun-Spices</strong><small>15 mon · Daily +55 mon & +1 Sun Topaz</small></span><button class="btn btn-accent" type="button" id="in-sni" ${ready && s.mon >= 15 ? "" : "disabled"}>${ready ? "Barter (15 mon)" : "Bartered Today ✓"}</button></div></div>`, (e) => {
      e.querySelector("#in-sni").onclick = () => { if (!ready || s.mon < 15) return; s.mon -= 15; iv.sunInDay = d; s.mon += 55; if (s.square?.haven?.gems) s.square.haven.gems.topaz = (s.square.haven.gems.topaz || 0) + 1; ping("done"); save(); hud(); toast("+55 mon & +1 Sun Topaz!"); sunspireinn(); };
    });
  }

  function horizonlight() {
    const d = today(), ready = iv.horDay !== d;
    let sweeps = 0;
    panel("Inside Horizon Light", `<p class="muted">The lantern room looks out over the drop where the sea meets the stars.</p><div class="px-grid"><button type="button" class="px-tile" id="in-hrz" ${ready ? "" : "disabled"}><strong>🔦 Sweep Abyssal Beam</strong><small id="in-hrzl">${ready ? "0/3 sweeps" : "Swept Today ✓"}</small></button></div>`, (e) => {
      e.querySelector("#in-hrz").onclick = () => {
        if (iv.horDay === d) return;
        sweeps++; ping("blip");
        if (sweeps >= 3) { iv.horDay = d; s.mon += 50; s.luck = (s.luck || 0) + 2; e.querySelector("#in-hrzl").textContent = "Spotted! +50 mon & +2 Luck"; e.querySelector("#in-hrz").disabled = true; ping("done"); save(); hud(); }
        else e.querySelector("#in-hrzl").textContent = `${sweeps}/3 sweeps`;
      };
    });
  }

  function atollhouse() {
    const d = today(), ready = iv.atoDay !== d;
    panel("Inside Atoll Boathouse", `<p class="muted">Amber-varnished skiffs hang from hemp slings above clear reef water.</p><div class="se-mkt"><div class="se-good"><span><strong>🛶 Caulk Amber Skiff</strong><small>Daily · +40 mon & +1 Mist Opal</small></span><button class="btn btn-accent" type="button" id="in-ato" ${ready ? "" : "disabled"}>${ready ? "Caulk Skiff" : "Repaired Today ✓"}</button></div></div>`, (e) => {
      e.querySelector("#in-ato").onclick = () => { if (!ready) return; iv.atoDay = d; s.mon += 40; if (s.square?.haven?.gems) s.square.haven.gems.opal = (s.square.haven.gems.opal || 0) + 1; ping("done"); save(); hud(); toast("+40 mon & +1 Mist Opal!"); atollhouse(); };
    });
  }

  function mirrorlight() {
    const d = today(), ready = iv.mirDay !== d;
    let deg = 90;
    panel("Inside Mirror Lighthouse", `<p class="muted">A concave silver mirror reflects starlight across the Glass Sea.</p><div class="px-grid"><button type="button" class="px-tile" id="in-mir" ${ready ? "" : "disabled"}><strong>🪞 Angle Silver Mirror</strong><small id="in-mirl">${ready ? `${deg}° — Tap to align 0°` : "Aligned Today ✓"}</small></button></div>`, (e) => {
      e.querySelector("#in-mir").onclick = () => {
        if (iv.mirDay === d) return;
        deg = (deg + 90) % 360; ping("blip");
        if (deg === 0) { iv.mirDay = d; s.mon += 55; s.luck = (s.luck || 0) + 1; e.querySelector("#in-mirl").textContent = "Aligned! +55 mon & +1 Luck"; e.querySelector("#in-mir").disabled = true; ping("done"); save(); hud(); }
        else e.querySelector("#in-mirl").textContent = `${deg}° — Tap to align 0°`;
      };
    });
  }

  function cinderwatch() {
    const d = today(), ready = iv.cinDay !== d;
    panel("Inside Volcanic Watch", `<p class="muted">Copper pyrometers tick softly above the glowing cinder vents.</p><div class="se-mkt"><div class="se-good"><span><strong>🌋 Log Vent Temperature</strong><small>Daily · +45 mon & +1 Ruby Ore</small></span><button class="btn btn-accent" type="button" id="in-cin" ${ready ? "" : "disabled"}>${ready ? "Log Heat" : "Logged Today ✓"}</button></div></div>`, (e) => {
      e.querySelector("#in-cin").onclick = () => { if (!ready) return; iv.cinDay = d; s.mon += 45; if (s.square?.ore) s.square.ore.Ruby = (s.square.ore.Ruby || 0) + 1; ping("done"); save(); hud(); toast("+45 mon & +1 Ruby Ore!"); cinderwatch(); };
    });
  }

  function lastlight() {
    const d = today(), ready = iv.lstDay !== d;
    panel("Inside The Last Lanternhouse", `<p class="muted">At the very edge of the world, a single blue lantern burns without wind.</p><div class="se-mkt"><div class="se-good"><span><strong>🏮 Kindle Edge Vigil</strong><small>Daily · +60 mon & +25 Companion Bond XP</small></span><button class="btn btn-accent" type="button" id="in-lst" ${ready ? "" : "disabled"}>${ready ? "Kindle Vigil" : "Kindled Today ✓"}</button></div></div>`, (e) => {
      e.querySelector("#in-lst").onclick = () => { if (!ready) return; iv.lstDay = d; s.mon += 60; if (s.square?.haven) s.square.haven.compXp = (s.square.haven.compXp || 0) + 25; ping("done"); save(); hud(); toast("+60 mon & +25 Companion Bond XP!"); lastlight(); };
    });
  }

  function auroraobs() {
    const d = today(), ready = iv.aurDay !== d;
    panel("Inside Aurora Observatory", `<p class="muted">Ribbons of green and violet light shimmer through the glass cupola. Record a band today.</p><div class="se-mkt"><div class="se-good"><span><strong>💚 Emerald Ribbon</strong><small>Daily · +1 Silver Ore & +35 mon</small></span><button class="btn btn-accent" type="button" id="in-au1" ${ready ? "" : "disabled"}>Record</button></div><div class="se-good"><span><strong>💜 Violet Ribbon</strong><small>Daily · +1 Mist Opal & +25 mon</small></span><button class="btn btn-accent" type="button" id="in-au2" ${ready ? "" : "disabled"}>Record</button></div></div>`, (e) => {
      e.querySelector("#in-au1").onclick = () => { if (!ready) return; iv.aurDay = d; s.mon += 35; if (s.square?.ore) s.square.ore.Silver = (s.square.ore.Silver || 0) + 1; ping("done"); save(); hud(); toast("+35 mon & +1 Silver Ore!"); auroraobs(); };
      e.querySelector("#in-au2").onclick = () => { if (!ready) return; iv.aurDay = d; s.mon += 25; if (s.square?.haven?.gems) s.square.haven.gems.opal = (s.square.haven.gems.opal || 0) + 1; ping("done"); save(); hud(); toast("+25 mon & +1 Mist Opal!"); auroraobs(); };
    });
  }

  function velvetshrine() {
    const d = today(), ready = iv.velDay !== d;
    panel("Inside Velvet Pagoda", `<p class="muted">Deep crimson eaves shelter a velvet-wrapped bronze gong.</p><div class="se-mkt"><div class="se-good"><span><strong>🔔 Sound Velvet Gong</strong><small>Daily · +40 mon & +2 Lucky Ripples</small></span><button class="btn btn-accent" type="button" id="in-vel" ${ready ? "" : "disabled"}>${ready ? "Sound Gong" : "Sounded Today ✓"}</button></div></div>`, (e) => {
      e.querySelector("#in-vel").onclick = () => { if (!ready) return; iv.velDay = d; s.mon += 40; s.luck = (s.luck || 0) + 2; ping("done"); save(); hud(); toast("+40 mon & +2 Luck!"); velvetshrine(); };
    });
  }

  function spirefoundry() {
    const d = today(), ready = iv.spfDay !== d;
    panel("Inside Spire Foundry", `<p class="muted">White-hot crucibles pour ember-gold into basalt molds.</p><div class="se-mkt"><div class="se-good"><span><strong>⚒️ Temper Copper (1 Copper Ore)</strong><small>Daily · +70 mon & +1 Gold Ore</small></span><button class="btn btn-accent" type="button" id="in-spf" ${ready && (s.square?.ore?.Copper || 0) >= 1 ? "" : "disabled"}>${ready ? "Temper" : "Tempered Today ✓"}</button></div></div>`, (e) => {
      e.querySelector("#in-spf").onclick = () => { if (!ready || (s.square?.ore?.Copper || 0) < 1) return; s.square.ore.Copper--; iv.spfDay = d; s.mon += 70; if (s.square?.ore) s.square.ore.Gold = (s.square.ore.Gold || 0) + 1; ping("done"); save(); hud(); toast("+70 mon & +1 Gold Ore!"); spirefoundry(); };
    });
  }

  function starcustoms() {
    const d = today(), ready = iv.cusDay !== d;
    panel("Inside Starlight Customs", `<p class="muted">Brass ink stamps and starship manifests line the harbourmaster's counter.</p><div class="se-mkt"><div class="se-good"><span><strong>🛃 Stamp Harbor Manifest</strong><small>Daily · +50 mon & +1 Moonstone Ore</small></span><button class="btn btn-accent" type="button" id="in-cus" ${ready ? "" : "disabled"}>${ready ? "Stamp" : "Stamped Today ✓"}</button></div></div>`, (e) => {
      e.querySelector("#in-cus").onclick = () => { if (!ready) return; iv.cusDay = d; s.mon += 50; if (s.square?.ore) s.square.ore.Moonstone = (s.square.ore.Moonstone || 0) + 1; ping("done"); save(); hud(); toast("+50 mon & +1 Moonstone Ore!"); starcustoms(); };
    });
  }

  function tempestkeep() {
    const d = today(), ready = iv.tmpDay !== d;
    let taps = 0;
    panel("Inside Tempest Beacon", `<p class="muted">Copper lightning rods crackle along the storm-atoll roof.</p><div class="px-grid"><button type="button" class="px-tile" id="in-tmp" ${ready ? "" : "disabled"}><strong>⚡ Ground Storm Charge</strong><small id="in-tmpl">${ready ? "0/3 discharges" : "Grounded Today ✓"}</small></button></div>`, (e) => {
      e.querySelector("#in-tmp").onclick = () => {
        if (iv.tmpDay === d) return;
        taps++; ping("blip");
        if (taps >= 3) { iv.tmpDay = d; s.mon += 55; s.luck = (s.luck || 0) + 2; e.querySelector("#in-tmpl").textContent = "Grounded! +55 mon & +2 Luck"; e.querySelector("#in-tmp").disabled = true; ping("done"); save(); hud(); }
        else e.querySelector("#in-tmpl").textContent = `${taps}/3 discharges`;
      };
    });
  }

  function celestiallight() {
    const d = today(), ready = iv.celDay !== d;
    panel("Inside Celestial Lighthouse", `<p class="muted">A domed lens of indigo glass overlooks the furthest cape.</p><div class="se-mkt"><div class="se-good"><span><strong>🌌 Chart Cape Horizon</strong><small>Daily · +50 mon & +1 Mist Opal</small></span><button class="btn btn-accent" type="button" id="in-cel" ${ready ? "" : "disabled"}>${ready ? "Chart Sky" : "Charted Today ✓"}</button></div></div>`, (e) => {
      e.querySelector("#in-cel").onclick = () => { if (!ready) return; iv.celDay = d; s.mon += 50; if (s.square?.haven?.gems) s.square.haven.gems.opal = (s.square.haven.gems.opal || 0) + 1; ping("done"); save(); hud(); toast("+50 mon & +1 Mist Opal!"); celestiallight(); };
    });
  }

  function crystalspire() {
    const d = today(), ready = iv.cryDay !== d;
    let step = 0;
    const notes = ["Do Pipe", "Mi Pipe", "Sol Pipe"];
    panel("Inside Crystal Spire", `<p class="muted">Play the three quartz organ pipes in order (Do → Mi → Sol).</p><div class="px-grid">${notes.map((n, i) => `<button type="button" class="px-tile" data-cp="${i}" ${ready ? "" : "disabled"}><strong>💎 ${n}</strong><small>Pipe ${i + 1}</small></button>`).join("")}</div><p class="muted" id="cp-st" style="margin-top:8px">${ready ? "Tap Do Pipe first." : "Tuned Today ✓"}</p>`, (e) => {
      const stEl = e.querySelector("#cp-st");
      e.querySelectorAll("[data-cp]").forEach((x) => (x.onclick = () => {
        if (iv.cryDay === d) return;
        const i = +x.dataset.cp;
        if (i === step) {
          step++; ping("blip");
          if (step >= 3) {
            iv.cryDay = d; s.mon += 60;
            if (s.square?.haven?.gems) s.square.haven.gems.quartz = (s.square.haven.gems.quartz || 0) + 2;
            stEl.textContent = "Resonance! +60 mon & +2 Mountain Quartz!";
            e.querySelectorAll("[data-cp]").forEach((b) => (b.disabled = true));
            ping("done"); save(); hud();
          } else stEl.textContent = `Good! Now tap ${notes[step]}.`;
        } else { step = 0; ping("close"); stEl.textContent = "Off-key! Start from Do Pipe."; }
      }));
    });
  }

  function crimsonshrine() {
    const d = today(), ready = iv.crmDay !== d;
    panel("Inside Crimson Shrine", `<p class="muted">Red maple boughs frame an ancient wooden bell-stand.</p><div class="se-mkt"><div class="se-good"><span><strong>🍁 Receive Maple Blessing</strong><small>Daily · +45 mon & +20 Companion Bond XP</small></span><button class="btn btn-accent" type="button" id="in-crm" ${ready ? "" : "disabled"}>${ready ? "Receive Blessing" : "Blessed Today ✓"}</button></div></div>`, (e) => {
      e.querySelector("#in-crm").onclick = () => { if (!ready) return; iv.crmDay = d; s.mon += 45; if (s.square?.haven) s.square.haven.compXp = (s.square.haven.compXp || 0) + 20; ping("done"); save(); hud(); toast("+45 mon & +20 Companion Bond XP!"); crimsonshrine(); };
    });
  }

  function goldenoasis() {
    const d = today(), ready = iv.oasDay !== d;
    panel("Inside Golden Oasis", `<p class="muted">Clear spring water wells up beneath gilt sandstone pillars.</p><div class="se-mkt"><div class="se-good"><span><strong>💧 Draw Spring Water</strong><small>Daily · +50 mon & +1 Gold Ore</small></span><button class="btn btn-accent" type="button" id="in-oas" ${ready ? "" : "disabled"}>${ready ? "Draw Water" : "Drawn Today ✓"}</button></div></div>`, (e) => {
      e.querySelector("#in-oas").onclick = () => { if (!ready) return; iv.oasDay = d; s.mon += 50; if (s.square?.ore) s.square.ore.Gold = (s.square.ore.Gold || 0) + 1; ping("done"); save(); hud(); toast("+50 mon & +1 Gold Ore!"); goldenoasis(); };
    });
  }

  function ashfoundry() {
    const d = today(), ready = iv.ashDay !== d;
    panel("Inside Obsidian Foundry", `<p class="muted">Black volcanic glass cools beside shimmering slag troughs.</p><div class="se-mkt"><div class="se-good"><span><strong>🖤 Cast Glass (1 Silver Ore)</strong><small>Daily · +75 mon & +1 Mist Opal</small></span><button class="btn btn-accent" type="button" id="in-ash" ${ready && (s.square?.ore?.Silver || 0) >= 1 ? "" : "disabled"}>${ready ? "Cast Glass" : "Cast Today ✓"}</button></div></div>`, (e) => {
      e.querySelector("#in-ash").onclick = () => { if (!ready || (s.square?.ore?.Silver || 0) < 1) return; s.square.ore.Silver--; iv.ashDay = d; s.mon += 75; if (s.square?.haven?.gems) s.square.haven.gems.opal = (s.square.haven.gems.opal || 0) + 1; ping("done"); save(); hud(); toast("+75 mon & +1 Mist Opal!"); ashfoundry(); };
    });
  }

  function pearlpier() {
    const d = today(), ready = iv.prlDay !== d;
    panel("Inside Pearl Pier", `<p class="muted">Baskets of iridescent shells line the salt-bleached planks.</p><div class="se-mkt"><div class="se-good"><span><strong>🦪 Check Pearl Basket</strong><small>Daily · +45 mon & +1 Mist Opal</small></span><button class="btn btn-accent" type="button" id="in-prl" ${ready ? "" : "disabled"}>${ready ? "Open Basket" : "Checked Today ✓"}</button></div></div>`, (e) => {
      e.querySelector("#in-prl").onclick = () => { if (!ready) return; iv.prlDay = d; s.mon += 45; if (s.square?.haven?.gems) s.square.haven.gems.opal = (s.square.haven.gems.opal || 0) + 1; ping("done"); save(); hud(); toast("+45 mon & +1 Mist Opal!"); pearlpier(); };
    });
  }

  function driftwoodhaven() {
    const d = today(), ready = iv.drfDay !== d;
    panel("Inside Driftwood Haven", `<p class="muted">Hand-carved seabirds perch along every windowsill.</p><div class="se-mkt"><div class="se-good"><span><strong>🪵 Carve Driftwood Charm</strong><small>Daily · +35 mon & +2 Lucky Ripples</small></span><button class="btn btn-accent" type="button" id="in-drf" ${ready ? "" : "disabled"}>${ready ? "Carve Charm" : "Carved Today ✓"}</button></div></div>`, (e) => {
      e.querySelector("#in-drf").onclick = () => { if (!ready) return; iv.drfDay = d; s.mon += 35; s.luck = (s.luck || 0) + 2; ping("done"); save(); hud(); toast("+35 mon & +2 Luck!"); driftwoodhaven(); };
    });
  }

  function eclipsewatch() {
    const d = today(), ready = iv.eclDay !== d;
    panel("Inside Eclipse Watch", `<p class="muted">Silver shadow-dials track the slow drift of the moon across the bay.</p><div class="se-mkt"><div class="se-good"><span><strong>🌑 Log Lunar Shadow</strong><small>Daily · +55 mon & +1 Moonstone Ore</small></span><button class="btn btn-accent" type="button" id="in-ecl" ${ready ? "" : "disabled"}>${ready ? "Log Shadow" : "Logged Today ✓"}</button></div></div>`, (e) => {
      e.querySelector("#in-ecl").onclick = () => { if (!ready) return; iv.eclDay = d; s.mon += 55; if (s.square?.ore) s.square.ore.Moonstone = (s.square.ore.Moonstone || 0) + 1; ping("done"); save(); hud(); toast("+55 mon & +1 Moonstone Ore!"); eclipsewatch(); };
    });
  }

  function terminuslight() {
    const d = today(), ready = iv.trmDay !== d;
    panel("Inside Terminus Lighthouse", `<p class="muted">Forty-nine regions behind you, and a quiet silver bell at the end of the line.</p><div class="se-mkt"><div class="se-good"><span><strong>🔔 Ring Terminus Bell</strong><small>Daily · +65 mon & +25 Companion Bond XP</small></span><button class="btn btn-accent" type="button" id="in-trm" ${ready ? "" : "disabled"}>${ready ? "Ring Bell" : "Rung Today ✓"}</button></div></div>`, (e) => {
      e.querySelector("#in-trm").onclick = () => { if (!ready) return; iv.trmDay = d; s.mon += 65; if (s.square?.haven) s.square.haven.compXp = (s.square.haven.compXp || 0) + 25; ping("done"); save(); hud(); toast("+65 mon & +25 Companion Bond XP!"); terminuslight(); };
    });
  }

  function silverwatch() {
    const d = today(), ready = iv.silDay !== d;
    panel("Inside Silvercrest Watch", `<p class="muted">Silver wind-flags snap outside frosted ridge windows.</p><div class="se-mkt"><div class="se-good"><span><strong>🏔️ Check Ridge Beacon</strong><small>Daily · +45 mon & +1 Silver Ore</small></span><button class="btn btn-accent" type="button" id="in-sil" ${ready ? "" : "disabled"}>${ready ? "Check Beacon" : "Checked Today ✓"}</button></div></div>`, (e) => {
      e.querySelector("#in-sil").onclick = () => { if (!ready) return; iv.silDay = d; s.mon += 45; if (s.square?.ore) s.square.ore.Silver = (s.square.ore.Silver || 0) + 1; ping("done"); save(); hud(); toast("+45 mon & +1 Silver Ore!"); silverwatch(); };
    });
  }

  function elderdojo() {
    const d = today(), ready = iv.eldDay !== d;
    panel("Inside Elder Dojo", `<p class="muted">Master Taro's bamboo flutes rest beside smooth river stones.</p><div class="se-mkt"><div class="se-good"><span><strong>🎋 Meditate by Bamboo</strong><small>Daily · +50 mon & +20 Companion Bond XP</small></span><button class="btn btn-accent" type="button" id="in-eld" ${ready ? "" : "disabled"}>${ready ? "Meditate" : "Meditated Today ✓"}</button></div></div>`, (e) => {
      e.querySelector("#in-eld").onclick = () => { if (!ready) return; iv.eldDay = d; s.mon += 50; if (s.square?.haven) s.square.haven.compXp = (s.square.haven.compXp || 0) + 20; ping("done"); save(); hud(); toast("+50 mon & +20 Companion Bond XP!"); elderdojo(); };
    });
  }

  function vermilioninn() {
    const d = today(), ready = iv.verDay !== d;
    panel("Inside Vermilion Inn", `<p class="muted">Red-clay lanterns warm the canyon dining hall.</p><div class="se-mkt"><div class="se-good"><span><strong>🍲 Share Canyon Stew (15 mon)</strong><small>Daily · +55 mon & +1 Sun Topaz</small></span><button class="btn btn-accent" type="button" id="in-ver" ${ready && s.mon >= 15 ? "" : "disabled"}>${ready ? "Share Stew" : "Dined Today ✓"}</button></div></div>`, (e) => {
      e.querySelector("#in-ver").onclick = () => { if (!ready || s.mon < 15) return; s.mon -= 15; iv.verDay = d; s.mon += 55; if (s.square?.haven?.gems) s.square.haven.gems.topaz = (s.square.haven.gems.topaz || 0) + 1; ping("done"); save(); hud(); toast("+55 mon & +1 Sun Topaz!"); vermilioninn(); };
    });
  }

  function abyssfoundry() {
    const d = today(), ready = iv.abyDay !== d;
    panel("Inside Abyss Foundry", `<p class="muted">Basalt crucibles glow deep orange beneath the spire.</p><div class="se-mkt"><div class="se-good"><span><strong>🗡️ Quench Blade (1 Copper Ore)</strong><small>Daily · +70 mon & +1 Ruby Ore</small></span><button class="btn btn-accent" type="button" id="in-aby" ${ready && (s.square?.ore?.Copper || 0) >= 1 ? "" : "disabled"}>${ready ? "Quench" : "Quenched Today ✓"}</button></div></div>`, (e) => {
      e.querySelector("#in-aby").onclick = () => { if (!ready || (s.square?.ore?.Copper || 0) < 1) return; s.square.ore.Copper--; iv.abyDay = d; s.mon += 70; if (s.square?.ore) s.square.ore.Ruby = (s.square.ore.Ruby || 0) + 1; ping("done"); save(); hud(); toast("+70 mon & +1 Ruby Ore!"); abyssfoundry(); };
    });
  }

  function coralhorpier() {
    const d = today(), ready = iv.chpDay !== d;
    panel("Inside Horizon Pier", `<p class="muted">Salt-bleached buoys swing gently above clear coral shallows.</p><div class="se-mkt"><div class="se-good"><span><strong>🐚 Haul Horizon Net</strong><small>Daily · +45 mon & +2 Lucky Ripples</small></span><button class="btn btn-accent" type="button" id="in-chp" ${ready ? "" : "disabled"}>${ready ? "Haul Net" : "Hauled Today ✓"}</button></div></div>`, (e) => {
      e.querySelector("#in-chp").onclick = () => { if (!ready) return; iv.chpDay = d; s.mon += 45; s.luck = (s.luck || 0) + 2; ping("done"); save(); hud(); toast("+45 mon & +2 Luck!"); coralhorpier(); };
    });
  }

  function misthaven() {
    const d = today(), ready = iv.mstDay !== d;
    panel("Inside Mistwater Haven", `<p class="muted">Glass phials catch silver fog drifting through open shutters.</p><div class="se-mkt"><div class="se-good"><span><strong>🌫️ Bottle Morning Mist</strong><small>Daily · +40 mon & +1 Mist Opal</small></span><button class="btn btn-accent" type="button" id="in-mst" ${ready ? "" : "disabled"}>${ready ? "Bottle Mist" : "Bottled Today ✓"}</button></div></div>`, (e) => {
      e.querySelector("#in-mst").onclick = () => { if (!ready) return; iv.mstDay = d; s.mon += 40; if (s.square?.haven?.gems) s.square.haven.gems.opal = (s.square.haven.gems.opal || 0) + 1; ping("done"); save(); hud(); toast("+40 mon & +1 Mist Opal!"); misthaven(); };
    });
  }

  function voidtower() {
    const d = today(), ready = iv.vodDay !== d;
    let taps = 0;
    panel("Inside Voidlight Tower", `<p class="muted">A dark-glass prism focuses starlight over the Void Sea.</p><div class="px-grid"><button type="button" class="px-tile" id="in-vod" ${ready ? "" : "disabled"}><strong>🔮 Calibrate Deep Prism</strong><small id="in-vodl">${ready ? "0/3 turns" : "Calibrated Today ✓"}</small></button></div>`, (e) => {
      e.querySelector("#in-vod").onclick = () => {
        if (iv.vodDay === d) return;
        taps++; ping("blip");
        if (taps >= 3) { iv.vodDay = d; s.mon += 65; if (s.square?.ore) s.square.ore.Moonstone = (s.square.ore.Moonstone || 0) + 1; e.querySelector("#in-vodl").textContent = "Aligned! +65 mon & +1 Moonstone Ore"; e.querySelector("#in-vod").disabled = true; ping("done"); save(); hud(); }
        else e.querySelector("#in-vodl").textContent = `${taps}/3 turns`;
      };
    });
  }

  function sovereignlight() {
    const d = today(), ready = iv.sovDay !== d;
    panel("Inside The Sovereign Beacon", `<p class="muted">Fifty-seven regions stretch behind this quiet crown-lit tower.</p><div class="se-mkt"><div class="se-good"><span><strong>👑 Salute the Crown Lamp</strong><small>Daily · +60 mon & +25 Companion Bond XP</small></span><button class="btn btn-accent" type="button" id="in-sov" ${ready ? "" : "disabled"}>${ready ? "Salute" : "Visited Today ✓"}</button></div></div>`, (e) => {
      e.querySelector("#in-sov").onclick = () => { if (!ready) return; iv.sovDay = d; s.mon += 60; if (s.square?.haven) s.square.haven.compXp = (s.square.haven.compXp || 0) + 25; ping("done"); save(); hud(); toast("+60 mon & +25 Companion Bond XP!"); sovereignlight(); };
    });
  }

  function astralpost() {
    const d = today(), ready = iv.astDay !== d;
    panel("Inside Astral Ridge Post", `<p class="muted">Star-charts and brass pigeonholes line the high ridge post.</p><div class="se-mkt"><div class="se-good"><span><strong>✉️ Dispatch Star-Mail</strong><small>Daily · +45 mon & +2 Lucky Ripples</small></span><button class="btn btn-accent" type="button" id="in-ast" ${ready ? "" : "disabled"}>${ready ? "Dispatch" : "Dispatched Today ✓"}</button></div></div>`, (e) => {
      e.querySelector("#in-ast").onclick = () => { if (!ready) return; iv.astDay = d; s.mon += 45; s.luck = (s.luck || 0) + 2; ping("done"); save(); hud(); toast("+45 mon & +2 Luck!"); astralpost(); };
    });
  }

  function heightstea() {
    const d = today(), ready = iv.hgtDay !== d;
    panel("Inside Heights Teahouse", `<p class="muted">High-altitude cherry blossoms drift past warm cedar tables.</p><div class="se-mkt"><div class="se-good"><span><strong>🍵 Steep High-Peak Tea</strong><small>Daily · +45 mon & +1 Sun Topaz</small></span><button class="btn btn-accent" type="button" id="in-hgt" ${ready ? "" : "disabled"}>${ready ? "Steep Tea" : "Steeped Today ✓"}</button></div></div>`, (e) => {
      e.querySelector("#in-hgt").onclick = () => { if (!ready) return; iv.hgtDay = d; s.mon += 45; if (s.square?.haven?.gems) s.square.haven.gems.topaz = (s.square.haven.gems.topaz || 0) + 1; ping("done"); save(); hud(); toast("+45 mon & +1 Sun Topaz!"); heightstea(); };
    });
  }

  function duneobs() {
    const d = today(), ready = iv.dunDay !== d;
    panel("Inside Dune Observatory", `<p class="muted">Brass astrolabes catch the warm glow of the amber dunes.</p><div class="se-mkt"><div class="se-good"><span><strong>🌟 Chart Sand-Stars</strong><small>Daily · +45 mon & +1 Gold Ore</small></span><button class="btn btn-accent" type="button" id="in-dun" ${ready ? "" : "disabled"}>${ready ? "Chart Stars" : "Charted Today ✓"}</button></div></div>`, (e) => {
      e.querySelector("#in-dun").onclick = () => { if (!ready) return; iv.dunDay = d; s.mon += 45; if (s.square?.ore) s.square.ore.Gold = (s.square.ore.Gold || 0) + 1; ping("done"); save(); hud(); toast("+45 mon & +1 Gold Ore!"); duneobs(); };
    });
  }

  function magmaforge() {
    const d = today(), ready = iv.magDay !== d;
    panel("Inside Magma Forge", `<p class="muted">Molten stone channels glow beneath heavy iron tongs.</p><div class="se-mkt"><div class="se-good"><span><strong>💍 Cast Magma Ring (1 Copper Ore)</strong><small>Daily · +75 mon & +1 Ruby Ore</small></span><button class="btn btn-accent" type="button" id="in-mag" ${ready && (s.square?.ore?.Copper || 0) >= 1 ? "" : "disabled"}>${ready ? "Cast Ring" : "Cast Today ✓"}</button></div></div>`, (e) => {
      e.querySelector("#in-mag").onclick = () => { if (!ready || (s.square?.ore?.Copper || 0) < 1) return; s.square.ore.Copper--; iv.magDay = d; s.mon += 75; if (s.square?.ore) s.square.ore.Ruby = (s.square.ore.Ruby || 0) + 1; ping("done"); save(); hud(); toast("+75 mon & +1 Ruby Ore!"); magmaforge(); };
    });
  }

  function moonpearlpier() {
    const d = today(), ready = iv.mprDay !== d;
    panel("Inside Moon-Pearl Pier", `<p class="muted">Silver tide-lanterns sway over moonlit shell traps.</p><div class="se-mkt"><div class="se-good"><span><strong>🦪 Lift Moon-Shell Trap</strong><small>Daily · +50 mon & +1 Mist Opal</small></span><button class="btn btn-accent" type="button" id="in-mpr" ${ready ? "" : "disabled"}>${ready ? "Lift Trap" : "Lifted Today ✓"}</button></div></div>`, (e) => {
      e.querySelector("#in-mpr").onclick = () => { if (!ready) return; iv.mprDay = d; s.mon += 50; if (s.square?.haven?.gems) s.square.haven.gems.opal = (s.square.haven.gems.opal || 0) + 1; ping("done"); save(); hud(); toast("+50 mon & +1 Mist Opal!"); moonpearlpier(); };
    });
  }

  function foghaven() {
    const d = today(), ready = iv.fogDay !== d;
    let pulls = 0;
    panel("Inside Fog Haven", `<p class="muted">Thick white mist wraps the brass foghorn chain.</p><div class="px-grid"><button type="button" class="px-tile" id="in-fog" ${ready ? "" : "disabled"}><strong>📯 Pull Foghorn Chain</strong><small id="in-fogl">${ready ? "0/3 pulls" : "Sounded Today ✓"}</small></button></div>`, (e) => {
      e.querySelector("#in-fog").onclick = () => {
        if (iv.fogDay === d) return;
        pulls++; ping("blip");
        if (pulls >= 3) { iv.fogDay = d; s.mon += 50; s.luck = (s.luck || 0) + 2; e.querySelector("#in-fogl").textContent = "Sounded! +50 mon & +2 Luck"; e.querySelector("#in-fog").disabled = true; ping("done"); save(); hud(); }
        else e.querySelector("#in-fogl").textContent = `${pulls}/3 pulls`;
      };
    });
  }

  function trenchwatch() {
    const d = today(), ready = iv.trnDay !== d;
    panel("Inside Trench Watch", `<p class="muted">Deep-sea winches hum beside pressure gauges.</p><div class="se-mkt"><div class="se-good"><span><strong>🔦 Lower Depth Lantern</strong><small>Daily · +55 mon & +1 Moonstone Ore</small></span><button class="btn btn-accent" type="button" id="in-trn" ${ready ? "" : "disabled"}>${ready ? "Lower Lantern" : "Lowered Today ✓"}</button></div></div>`, (e) => {
      e.querySelector("#in-trn").onclick = () => { if (!ready) return; iv.trnDay = d; s.mon += 55; if (s.square?.ore) s.square.ore.Moonstone = (s.square.ore.Moonstone || 0) + 1; ping("done"); save(); hud(); toast("+55 mon & +1 Moonstone Ore!"); trenchwatch(); };
    });
  }

  function astrallight() {
    const d = today(), ready = iv.aslDay !== d;
    panel("Inside The Astral Lighthouse", `<p class="muted">Starlight pools across a circular floor of inlaid silver.</p><div class="se-mkt"><div class="se-good"><span><strong>🌠 Align Astral Lens</strong><small>Daily · +60 mon & +25 Companion Bond XP</small></span><button class="btn btn-accent" type="button" id="in-asl" ${ready ? "" : "disabled"}>${ready ? "Align Lens" : "Aligned Today ✓"}</button></div></div>`, (e) => {
      e.querySelector("#in-asl").onclick = () => { if (!ready) return; iv.aslDay = d; s.mon += 60; if (s.square?.haven) s.square.haven.compXp = (s.square.haven.compXp || 0) + 25; ping("done"); save(); hud(); toast("+60 mon & +25 Companion Bond XP!"); astrallight(); };
    });
  }

  function cometpost() {
    const d = today(), ready = iv.cmtDay !== d;
    panel("Inside Comet Ridge Post", `<p class="muted">Mailbags stamped with silver comets lean against the hearth.</p><div class="se-mkt"><div class="se-good"><span><strong>☄️ Stamp Comet Express</strong><small>Daily · +45 mon & +1 Sun Topaz</small></span><button class="btn btn-accent" type="button" id="in-cmt" ${ready ? "" : "disabled"}>${ready ? "Stamp" : "Stamped Today ✓"}</button></div></div>`, (e) => {
      e.querySelector("#in-cmt").onclick = () => { if (!ready) return; iv.cmtDay = d; s.mon += 45; if (s.square?.haven?.gems) s.square.haven.gems.topaz = (s.square.haven.gems.topaz || 0) + 1; ping("done"); save(); hud(); toast("+45 mon & +1 Sun Topaz!"); cometpost(); };
    });
  }

  function lotustea() {
    const d = today(), ready = iv.lotDay !== d;
    panel("Inside Lotus Heights Teahouse", `<p class="muted">Steaming lotus bowls rest on low cedar trays.</p><div class="se-mkt"><div class="se-good"><span><strong>🪷 Steep Lotus Nectar</strong><small>Daily · +45 mon & +2 Lucky Ripples</small></span><button class="btn btn-accent" type="button" id="in-lot" ${ready ? "" : "disabled"}>${ready ? "Steep Nectar" : "Steeped Today ✓"}</button></div></div>`, (e) => {
      e.querySelector("#in-lot").onclick = () => { if (!ready) return; iv.lotDay = d; s.mon += 45; s.luck = (s.luck || 0) + 2; ping("done"); save(); hud(); toast("+45 mon & +2 Luck!"); lotustea(); };
    });
  }

  function saffronobs() {
    const d = today(), ready = iv.safDay !== d;
    panel("Inside Saffron Observatory", `<p class="muted">Warm spice-scented wind blows through brass wind-vanes.</p><div class="se-mkt"><div class="se-good"><span><strong>🏜️ Measure Saffron Wind</strong><small>Daily · +50 mon & +1 Gold Ore</small></span><button class="btn btn-accent" type="button" id="in-saf" ${ready ? "" : "disabled"}>${ready ? "Measure" : "Measured Today ✓"}</button></div></div>`, (e) => {
      e.querySelector("#in-saf").onclick = () => { if (!ready) return; iv.safDay = d; s.mon += 50; if (s.square?.ore) s.square.ore.Gold = (s.square.ore.Gold || 0) + 1; ping("done"); save(); hud(); toast("+50 mon & +1 Gold Ore!"); saffronobs(); };
    });
  }

  function cindercrestforge() {
    const d = today(), ready = iv.ccfDay !== d;
    let hits = 0;
    panel("Inside Cinder Crest Forge", `<p class="muted">Strike the glowing crest anvil four times in steady rhythm.</p><div class="px-grid"><button type="button" class="px-tile" id="in-ccf" ${ready ? "" : "disabled"}><strong>🔨 Strike Crest Anvil</strong><small id="in-ccfl">${ready ? "0/4 strikes" : "Forged Today ✓"}</small></button></div>`, (e) => {
      e.querySelector("#in-ccf").onclick = () => {
        if (iv.ccfDay === d) return;
        hits++; ping("blip");
        if (hits >= 4) { iv.ccfDay = d; s.mon += 65; if (s.square?.ore) s.square.ore.Ruby = (s.square.ore.Ruby || 0) + 1; e.querySelector("#in-ccfl").textContent = "Forged! +65 mon & +1 Ruby Ore"; e.querySelector("#in-ccf").disabled = true; ping("done"); save(); hud(); }
        else e.querySelector("#in-ccfl").textContent = `${hits}/4 strikes`;
      };
    });
  }

  function starfishpier() {
    const d = today(), ready = iv.stfDay !== d;
    panel("Inside Starfish Pier", `<p class="muted">Starfish dry on cedar racks beside clear coral tidepools.</p><div class="se-mkt"><div class="se-good"><span><strong>⭐ Check Tidepool Net</strong><small>Daily · +45 mon & +2 Lucky Ripples</small></span><button class="btn btn-accent" type="button" id="in-stf" ${ready ? "" : "disabled"}>${ready ? "Check Net" : "Checked Today ✓"}</button></div></div>`, (e) => {
      e.querySelector("#in-stf").onclick = () => { if (!ready) return; iv.stfDay = d; s.mon += 45; s.luck = (s.luck || 0) + 2; ping("done"); save(); hud(); toast("+45 mon & +2 Luck!"); starfishpier(); };
    });
  }

  function reedhaven() {
    const d = today(), ready = iv.redDay !== d;
    panel("Inside Reed Haven", `<p class="muted">Bundles of golden marsh reeds hang from the beamed ceiling.</p><div class="se-mkt"><div class="se-good"><span><strong>🧺 Weave Reed Basket</strong><small>Daily · +40 mon & +1 Sun Topaz</small></span><button class="btn btn-accent" type="button" id="in-red" ${ready ? "" : "disabled"}>${ready ? "Weave" : "Woven Today ✓"}</button></div></div>`, (e) => {
      e.querySelector("#in-red").onclick = () => { if (!ready) return; iv.redDay = d; s.mon += 40; if (s.square?.haven?.gems) s.square.haven.gems.topaz = (s.square.haven.gems.topaz || 0) + 1; ping("done"); save(); hud(); toast("+40 mon & +1 Sun Topaz!"); reedhaven(); };
    });
  }

  function cobaltwatch() {
    const d = today(), ready = iv.cobDay !== d;
    panel("Inside Cobalt Watch", `<p class="muted">Blue-tinted glass panes look down into the cobalt trench.</p><div class="se-mkt"><div class="se-good"><span><strong>🔵 Inspect Cobalt Gauge</strong><small>Daily · +50 mon & +1 Silver Ore</small></span><button class="btn btn-accent" type="button" id="in-cob" ${ready ? "" : "disabled"}>${ready ? "Inspect" : "Inspected Today ✓"}</button></div></div>`, (e) => {
      e.querySelector("#in-cob").onclick = () => { if (!ready) return; iv.cobDay = d; s.mon += 50; if (s.square?.ore) s.square.ore.Silver = (s.square.ore.Silver || 0) + 1; ping("done"); save(); hud(); toast("+50 mon & +1 Silver Ore!"); cobaltwatch(); };
    });
  }

  function zenithlight() {
    const d = today(), ready = iv.zenDay !== d;
    panel("Inside The Zenith Lighthouse", `<p class="muted">A tall brass beacon crowns the quiet end of the Zenith ridge.</p><div class="se-mkt"><div class="se-good"><span><strong>🌟 Signal Zenith Lantern</strong><small>Daily · +65 mon & +25 Companion Bond XP</small></span><button class="btn btn-accent" type="button" id="in-zen" ${ready ? "" : "disabled"}>${ready ? "Signal" : "Signaled Today ✓"}</button></div></div>`, (e) => {
      e.querySelector("#in-zen").onclick = () => { if (!ready) return; iv.zenDay = d; s.mon += 65; if (s.square?.haven) s.square.haven.compXp = (s.square.haven.compXp || 0) + 25; ping("done"); save(); hud(); toast("+65 mon & +25 Companion Bond XP!"); zenithlight(); };
    });
  }

  function nebulapost() {
    const d = today(), ready = iv.nebDay !== d;
    panel("Inside Nebula Ridge Post", `<p class="muted">Violet wax seals and starlight envelopes fill the sorting rack.</p><div class="se-mkt"><div class="se-good"><span><strong>✉️ Stamp Nebula Post</strong><small>Daily · +45 mon & +1 Mist Opal</small></span><button class="btn btn-accent" type="button" id="in-neb" ${ready ? "" : "disabled"}>${ready ? "Stamp" : "Stamped Today ✓"}</button></div></div>`, (e) => {
      e.querySelector("#in-neb").onclick = () => { if (!ready) return; iv.nebDay = d; s.mon += 45; if (s.square?.haven?.gems) s.square.haven.gems.opal = (s.square.haven.gems.opal || 0) + 1; ping("done"); save(); hud(); toast("+45 mon & +1 Mist Opal!"); nebulapost(); };
    });
  }

  function plumtea() {
    const d = today(), ready = iv.plmDay !== d;
    panel("Inside Plum Heights Teahouse", `<p class="muted">Plum blossoms scent the warm steam rising from cast-iron kettles.</p><div class="se-mkt"><div class="se-good"><span><strong>🍵 Steep Spiced Plum Tea</strong><small>Daily · +45 mon & +2 Lucky Ripples</small></span><button class="btn btn-accent" type="button" id="in-plm" ${ready ? "" : "disabled"}>${ready ? "Steep Tea" : "Steeped Today ✓"}</button></div></div>`, (e) => {
      e.querySelector("#in-plm").onclick = () => { if (!ready) return; iv.plmDay = d; s.mon += 45; s.luck = (s.luck || 0) + 2; ping("done"); save(); hud(); toast("+45 mon & +2 Luck!"); plumtea(); };
    });
  }

  function ochreobs() {
    const d = today(), ready = iv.ochDay !== d;
    panel("Inside Ochre Observatory", `<p class="muted">Ochre sandstone arches frame a polished brass sundial.</p><div class="se-mkt"><div class="se-good"><span><strong>🏜️ Log Ochre Dust</strong><small>Daily · +50 mon & +1 Gold Ore</small></span><button class="btn btn-accent" type="button" id="in-och" ${ready ? "" : "disabled"}>${ready ? "Log Dust" : "Logged Today ✓"}</button></div></div>`, (e) => {
      e.querySelector("#in-och").onclick = () => { if (!ready) return; iv.ochDay = d; s.mon += 50; if (s.square?.ore) s.square.ore.Gold = (s.square.ore.Gold || 0) + 1; ping("done"); save(); hud(); toast("+50 mon & +1 Gold Ore!"); ochreobs(); };
    });
  }

  function pyrecrestforge() {
    const d = today(), ready = iv.pyrDay !== d;
    let hits = 0;
    panel("Inside Pyre Crest Forge", `<p class="muted">Strike the pyre anvil four times to temper glowing steel.</p><div class="px-grid"><button type="button" class="px-tile" id="in-pyr" ${ready ? "" : "disabled"}><strong>🔨 Hammer Pyre Anvil</strong><small id="in-pyrl">${ready ? "0/4 strikes" : "Tempered Today ✓"}</small></button></div>`, (e) => {
      e.querySelector("#in-pyr").onclick = () => {
        if (iv.pyrDay === d) return;
        hits++; ping("blip");
        if (hits >= 4) { iv.pyrDay = d; s.mon += 70; if (s.square?.ore) s.square.ore.Ruby = (s.square.ore.Ruby || 0) + 1; e.querySelector("#in-pyrl").textContent = "Tempered! +70 mon & +1 Ruby Ore"; e.querySelector("#in-pyr").disabled = true; ping("done"); save(); hud(); }
        else e.querySelector("#in-pyrl").textContent = `${hits}/4 strikes`;
      };
    });
  }

  function shellpier() {
    const d = today(), ready = iv.shlDay !== d;
    panel("Inside Shell Pier", `<p class="muted">Forty-two polished shells sit in numbered cedar trays.</p><div class="se-mkt"><div class="se-good"><span><strong>🐚 Sort Shell Tray</strong><small>Daily · +50 mon & +1 Mist Opal</small></span><button class="btn btn-accent" type="button" id="in-shl" ${ready ? "" : "disabled"}>${ready ? "Sort Tray" : "Sorted Today ✓"}</button></div></div>`, (e) => {
      e.querySelector("#in-shl").onclick = () => { if (!ready) return; iv.shlDay = d; s.mon += 50; if (s.square?.haven?.gems) s.square.haven.gems.opal = (s.square.haven.gems.opal || 0) + 1; ping("done"); save(); hud(); toast("+50 mon & +1 Mist Opal!"); shellpier(); };
    });
  }

  function willowhaven() {
    const d = today(), ready = iv.wilDay !== d;
    panel("Inside Willow Haven", `<p class="muted">Trailing willow fronds sway above the quiet marsh hearth.</p><div class="se-mkt"><div class="se-good"><span><strong>🌿 Braid Willow Charm</strong><small>Daily · +45 mon & +20 Companion Bond XP</small></span><button class="btn btn-accent" type="button" id="in-wil" ${ready ? "" : "disabled"}>${ready ? "Braid Charm" : "Visited Today ✓"}</button></div></div>`, (e) => {
      e.querySelector("#in-wil").onclick = () => { if (!ready) return; iv.wilDay = d; s.mon += 45; if (s.square?.haven) s.square.haven.compXp = (s.square.haven.compXp || 0) + 20; ping("done"); save(); hud(); toast("+45 mon & +20 Companion Bond XP!"); willowhaven(); };
    });
  }

  function icefallshrine() {
    const d = today(), ready = iv.iceDay !== d;
    panel("Inside Icefall Shrine", `<p class="muted">Icicles chime softly over a frost-rimmed stone altar.</p><div class="se-mkt"><div class="se-good"><span><strong>❄️ Ring Frozen Chime</strong><small>Daily · +55 mon & +25 Companion Bond XP</small></span><button class="btn btn-accent" type="button" id="in-ice" ${ready ? "" : "disabled"}>${ready ? "Ring Chime" : "Rung Today ✓"}</button></div></div>`, (e) => {
      e.querySelector("#in-ice").onclick = () => { if (!ready) return; iv.iceDay = d; s.mon += 55; if (s.square?.haven) s.square.haven.compXp = (s.square.haven.compXp || 0) + 25; ping("done"); save(); hud(); toast("+55 mon & +25 Companion Bond XP!"); icefallshrine(); };
    });
  }

  function tidewrack() {
    const d = today(), ready = iv.tdwDay !== d;
    panel("Inside Tidewrack Post", `<p class="muted">Sea-glass bottles and washed-up compasses fill the sorting table.</p><div class="se-mkt"><div class="se-good"><span><strong>🪵 Sort Tide Salvage</strong><small>Daily · +45 mon & +1 Mist Opal</small></span><button class="btn btn-accent" type="button" id="in-tdw" ${ready ? "" : "disabled"}>${ready ? "Sort Salvage" : "Sorted Today ✓"}</button></div></div>`, (e) => {
      e.querySelector("#in-tdw").onclick = () => { if (!ready) return; iv.tdwDay = d; s.mon += 45; if (s.square?.haven?.gems) s.square.haven.gems.opal = (s.square.haven.gems.opal || 0) + 1; ping("done"); save(); hud(); toast("+45 mon & +1 Mist Opal!"); tidewrack(); };
    });
  }

  function orchardtea() {
    const d = today(), ready = iv.ortDay !== d;
    panel("Inside Orchard Teahouse", `<p class="muted">Sweet sunberry steam curls around woven bamboo tea-trays.</p><div class="se-mkt"><div class="se-good"><span><strong>🍓 Brew Fruit-Leaf Tea</strong><small>Daily · +45 mon & +2 Lucky Ripples</small></span><button class="btn btn-accent" type="button" id="in-ort" ${ready ? "" : "disabled"}>${ready ? "Brew Tea" : "Brewed Today ✓"}</button></div></div>`, (e) => {
      e.querySelector("#in-ort").onclick = () => { if (!ready) return; iv.ortDay = d; s.mon += 45; s.luck = (s.luck || 0) + 2; ping("done"); save(); hud(); toast("+45 mon & +2 Luck!"); orchardtea(); };
    });
  }

  function glassduneobs() {
    const d = today(), ready = iv.gdoDay !== d;
    let turns = 0;
    panel("Inside Glassdune Observatory", `<p class="muted">Polish the fused-sand telescope lens three times to clear the horizon.</p><div class="px-grid"><button type="button" class="px-tile" id="in-gdo" ${ready ? "" : "disabled"}><strong>🔭 Polish Quartz Lens</strong><small id="in-gdol">${ready ? "0/3 polishes" : "Polished Today ✓"}</small></button></div>`, (e) => {
      e.querySelector("#in-gdo").onclick = () => {
        if (iv.gdoDay === d) return;
        turns++; ping("blip");
        if (turns >= 3) { iv.gdoDay = d; s.mon += 60; if (s.square?.ore) s.square.ore.Gold = (s.square.ore.Gold || 0) + 1; e.querySelector("#in-gdol").textContent = "Crystal Clear! +60 mon & +1 Gold Ore"; e.querySelector("#in-gdo").disabled = true; ping("done"); save(); hud(); }
        else e.querySelector("#in-gdol").textContent = `${turns}/3 polishes`;
      };
    });
  }

  function eclipseforge() {
    const d = today(), ready = iv.ecfDay !== d;
    panel("Inside Eclipse Forge", `<p class="muted">Silver-rimmed tongs rest beside dark eclipse-iron ingots.</p><div class="se-mkt"><div class="se-good"><span><strong>🌑 Smelt Shadow Ore (1 Copper Ore)</strong><small>Daily · +75 mon & +1 Moonstone Ore</small></span><button class="btn btn-accent" type="button" id="in-ecf" ${ready && (s.square?.ore?.Copper || 0) >= 1 ? "" : "disabled"}>${ready ? "Smelt" : "Smelted Today ✓"}</button></div></div>`, (e) => {
      e.querySelector("#in-ecf").onclick = () => { if (!ready || (s.square?.ore?.Copper || 0) < 1) return; s.square.ore.Copper--; iv.ecfDay = d; s.mon += 75; if (s.square?.ore) s.square.ore.Moonstone = (s.square.ore.Moonstone || 0) + 1; ping("done"); save(); hud(); toast("+75 mon & +1 Moonstone Ore!"); eclipseforge(); };
    });
  }

  function meteorforge() {
    const d = today(), ready = iv.mtfDay !== d;
    let hits = 0;
    panel("Inside Meteor Forge", `<p class="muted">Strike the fallen star-iron four times while it glows white-hot.</p><div class="px-grid"><button type="button" class="px-tile" id="in-mtf" ${ready ? "" : "disabled"}><strong>☄️ Hammer Star-Iron</strong><small id="in-mtfl">${ready ? "0/4 strikes" : "Forged Today ✓"}</small></button></div>`, (e) => {
      e.querySelector("#in-mtf").onclick = () => {
        if (iv.mtfDay === d) return;
        hits++; ping("blip");
        if (hits >= 4) { iv.mtfDay = d; s.mon += 75; if (s.square?.ore) s.square.ore.Ruby = (s.square.ore.Ruby || 0) + 1; e.querySelector("#in-mtfl").textContent = "Forged! +75 mon & +1 Ruby Ore"; e.querySelector("#in-mtf").disabled = true; ping("done"); save(); hud(); }
        else e.querySelector("#in-mtfl").textContent = `${hits}/4 strikes`;
      };
    });
  }

  function paragonlight() {
    const d = today(), ready = iv.prgDay !== d;
    panel("Inside Paragon Lighthouse", `<p class="muted">Twin mirrors cast a bright golden arc across the far sea.</p><div class="se-mkt"><div class="se-good"><span><strong>✨ Kindle Paragon Beacon</strong><small>Daily · +65 mon & +2 Lucky Ripples</small></span><button class="btn btn-accent" type="button" id="in-prg" ${ready ? "" : "disabled"}>${ready ? "Kindle" : "Kindled Today ✓"}</button></div></div>`, (e) => {
      e.querySelector("#in-prg").onclick = () => { if (!ready) return; iv.prgDay = d; s.mon += 65; s.luck = (s.luck || 0) + 2; ping("done"); save(); hud(); toast("+65 mon & +2 Luck!"); paragonlight(); };
    });
  }

  function elysianlight() {
    const d = today(), ready = iv.elyDay !== d;
    panel("Inside Elysian Lighthouse", `<p class="muted">Quiet starlight fills the domed observatory of the Elysian cape.</p><div class="se-mkt"><div class="se-good"><span><strong>🌟 Align Elysian Prism</strong><small>Daily · +65 mon & +25 Companion Bond XP</small></span><button class="btn btn-accent" type="button" id="in-ely" ${ready ? "" : "disabled"}>${ready ? "Align Prism" : "Aligned Today ✓"}</button></div></div>`, (e) => {
      e.querySelector("#in-ely").onclick = () => { if (!ready) return; iv.elyDay = d; s.mon += 65; if (s.square?.haven) s.square.haven.compXp = (s.square.haven.compXp || 0) + 25; ping("done"); save(); hud(); toast("+65 mon & +25 Companion Bond XP!"); elysianlight(); };
    });
  }

  function empyreanlight() {
    const d = today(), ready = iv.empDay !== d;
    panel("Inside Empyrean Lighthouse", `<p class="muted">A high silver sky-bell hangs beside brass wind charts.</p><div class="se-mkt"><div class="se-good"><span><strong>🔔 Sound Sky Bell</strong><small>Daily · +60 mon & +1 Mist Opal</small></span><button class="btn btn-accent" type="button" id="in-emp" ${ready ? "" : "disabled"}>${ready ? "Sound Bell" : "Sounded Today ✓"}</button></div></div>`, (e) => {
      e.querySelector("#in-emp").onclick = () => { if (!ready) return; iv.empDay = d; s.mon += 60; if (s.square?.haven?.gems) s.square.haven.gems.opal = (s.square.haven.gems.opal || 0) + 1; ping("done"); save(); hud(); toast("+60 mon & +1 Mist Opal!"); empyreanlight(); };
    });
  }

  function quartzwatch() {
    const d = today(), ready = iv.qzwDay !== d;
    panel("Inside Quartz Watch", `<p class="muted">Clear mountain quartz crystals line every shelf of the watchtower.</p><div class="se-mkt"><div class="se-good"><span><strong>🤍 Gather Ridge Quartz</strong><small>Daily · +45 mon & +2 Mountain Quartz</small></span><button class="btn btn-accent" type="button" id="in-qzw" ${ready ? "" : "disabled"}>${ready ? "Gather Quartz" : "Gathered Today ✓"}</button></div></div>`, (e) => {
      e.querySelector("#in-qzw").onclick = () => { if (!ready) return; iv.qzwDay = d; s.mon += 45; if (s.square?.haven?.gems) s.square.haven.gems.quartz = (s.square.haven.gems.quartz || 0) + 2; ping("done"); save(); hud(); toast("+45 mon & +2 Mountain Quartz!"); quartzwatch(); };
    });
  }

  const rooms = { tea, radio, clock, bindery, umbrella, station, sunken, observatory, studio, glass, post, palace, lodge, dojo, teahouse, caravan, stilt, forge, lighthouse, archive, reefhall, grotto, crater, amberlodge, saltobs, basaltlight, kelpharbor, prismspire, stormwatch, jadepavilion, sunspireinn, horizonlight, atollhouse, mirrorlight, cinderwatch, lastlight, auroraobs, velvetshrine, spirefoundry, starcustoms, tempestkeep, celestiallight, crystalspire, crimsonshrine, goldenoasis, ashfoundry, pearlpier, driftwoodhaven, eclipsewatch, terminuslight, silverwatch, elderdojo, vermilioninn, abyssfoundry, coralhorpier, misthaven, voidtower, sovereignlight, astralpost, heightstea, duneobs, magmaforge, moonpearlpier, foghaven, trenchwatch, astrallight, cometpost, lotustea, saffronobs, cindercrestforge, starfishpier, reedhaven, cobaltwatch, zenithlight, nebulapost, plumtea, ochreobs, pyrecrestforge, shellpier, willowhaven, icefallshrine, tidewrack, orchardtea, glassduneobs, eclipseforge, meteorforge, paragonlight, elysianlight, empyreanlight, quartzwatch };

  function open(b) {
    if (rooms[b[0]]) return rooms[b[0]]();
    const d = today(), ready = iv.farDay[b[0]] !== d;
    panel(`Inside ${b[6]}`, `<p class="muted">A quiet ${b[5]} outpost in the Far Lands. Sign the guestbook and rest your paws.</p><div class="se-mkt"><div class="se-good"><span><strong>📖 Sign Outpost Guestbook</strong><small>Daily · +30 mon & +1 Lucky Ripple</small></span><button class="btn btn-accent" type="button" id="in-far" ${ready ? "" : "disabled"}>${ready ? "Sign Guestbook" : "Visited Today ✓"}</button></div></div>`, (e) => {
      e.querySelector("#in-far").onclick = () => {
        if (!ready) return;
        iv.farDay[b[0]] = d; s.mon += 30; s.luck = (s.luck || 0) + 1;
        ping("done"); save(); hud(); toast(`Signed ${b[6]}'s guestbook! +30 mon & +1 Luck`); open(b);
      };
    });
  }

  return { ...rooms, open };
}
