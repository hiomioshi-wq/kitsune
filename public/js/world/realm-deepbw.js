// Deep Blackwood: Meridian Station, The Lower Screaming, The Rewrite Platform and The Wall Yuki Opened.
const npc = (id, cast, name, x, y, story, lines, o = {}) => ({ id, cast, name, x, y, story, lines, ...o });

export const DBW = {
  title: "Deep Blackwood · Meridian & The Lower Archive",
  series: "blackwood",
  rpgKind: "blackwood",
  start: ["station", 14, 12],
  respawn: ["laststop", 8, 6],
  deathWord: "Forms misfiled",
  endStory: "bw-ep23",
  doneGoal: "The wall is open. Biscuit is running across the field. Nobody is counting the days of heat anymore.",
  deathBy: npc("yukid2", "Yuki", "Yuki Tanaka", 0, 0),
  deathLine: (n, t) => `${t} Deep Blackwood intake #${n}. Don't touch the thermal core, don't feed the printer, and don't ask what happened to the other nine hundred and fifty-nine thousand.`,
  intro: "“Meridian Station log, day four hundred. Four hundred days of heat with everybody. Thirty years with a hundred and forty-four. Somebody knocked three times from the outside.”",
  ending: "Yuki opens the wall. Eight-legged Biscuit runs across the grass. Out in the Great Hall, a hundred and four thousand people are asked what they want, and for the first time in six centuries, the furnace doesn't need grief to stay warm.",
  building: (g, b, now) => {
    const T = 32, x = b.x * T, y = b.y * T, w = b.w * T, h = b.h * T;
    g.fillStyle = "#262430"; g.fillRect(x, y + 12, w, h - 12);
    g.strokeStyle = "#111"; g.lineWidth = 2.5; g.strokeRect(x, y + 12, w, h - 12);
    g.fillStyle = b.roof || "#181620"; g.fillRect(x - 4, y, w + 8, 16); g.strokeRect(x - 4, y, w + 8, 16);
    g.fillStyle = "#49d0ff"; g.fillRect(x + w / 2 - 8, y + h - 24, 16, 24);
    g.font = "800 11px system-ui"; g.textAlign = "center";
    g.fillStyle = "#e8dcc0"; g.fillText(b.name, x + w / 2, y + 11);
  },
  scenes: {
    station: {
      name: "Meridian Station · Sector 4", w: 28, h: 16, base: "frost", bg: "#060810", tint: "rgba(90,150,255,.08)",
      r: [[4, 4, 20, 8, "white"], [11, 2, 6, 12, "glass"]],
      b: [{ x: 4, y: 2, w: 6, h: 4, name: "Airlock 13", to: "airlock" }, { x: 18, y: 2, w: 6, h: 4, name: "Last Stop", to: "laststop" }],
      props: [["screen", 12, 3], ["screen", 15, 3], ["tank", 6, 8], ["tank", 21, 8], ["bench", 10, 10], ["bench", 17, 10]],
      npcs: [
        npc("simone2", "Simone", "Simone Adeyemi-Park", 14, 7, "bw-ep21", ["Nine hundred and sixty thousand people. Four hundred days of heat.", "I locked the door. I kept her coat."]),
        npc("kwabena2", null, "Kwabena", 8, 10, "bw-ep21", ["The thermal charts don't lie. Grief burns hotter than coal."], { look: { c: "#23232b", a: "#ddd", st: 5, sk: 6, h: "#1a1818", e: "#111", f: "smart" } }),
      ],
      doors: [{ x: 14, y: 15, to: "cathedral", tx: 10, ty: 1, label: "Descend to the Cathedral Inside-Out" }, { x: 14, y: 0, to: "meridian_roof", tx: 11, ty: 10, label: "Up to the Observation Deck" }],
    },
    airlock: {
      name: "Airlock 13 · The Drift", room: 1, w: 18, h: 10, base: "void", bg: "#020308", tint: "rgba(70,150,255,.08)",
      r: [[2, 2, 14, 6, "glass"]],
      props: [["screen", 3, 2], ["screen", 14, 2], ["tank", 8, 2]],
      npcs: [npc("kevinair", "Kevin", "Kevin (Airlock 13)", 9, 5, "bw-ep13", ["I've been floating near Sector 4 since Tuesday. I still have my lanyard.", "Sorry about the stapler."])],
    },
    laststop: {
      name: "The Last Stop Rewrite", room: 1, w: 18, h: 10, base: "ash", bg: "#141418", tint: "rgba(180,180,200,.08)",
      r: [[1, 4, 16, 2, "line"]],
      props: [["bench", 4, 2], ["bench", 13, 2], ["lampost", 2, 2], ["lampost", 15, 2], ["typewriter", 9, 2]],
      npcs: [npc("rewriteclerk", null, "The Rewrite Clerk", 9, 5, "bw-ep14", ["Every train that didn't arrive at Blackwood stops here instead.", "We're rewriting the third act. Again."], { look: { c: "#3a3844", a: "#e8dcc0", st: 5, sk: 2, h: "#2a2020", e: "#222", f: "smart" } })],
      doors: [{ x: 17, y: 5, to: "lower_screaming", tx: 1, ty: 4, label: "Down to Sub-Tray 9" }, { x: 0, y: 5, to: "train_car", tx: 16, ty: 4, label: "Board the 1997 Rewrite Coach" }],
    },
    lower_screaming: {
      name: "The Lower Screaming · Sub-Tray 9", room: 1, w: 20, h: 11, base: "flesh", bg: "#080204", tint: "rgba(180,20,30,.12)",
      monster: "mini", hounds: [[11, 3], [14, 7], [7, 7]], houndLine: "Something in Sub-Tray 9 filed you under MISCELLANEOUS.",
      props: [["cabinet", 3, 2], ["cabinet", 16, 2], ["printer", 15, 7], ["canoe", 6, 7]],
      npcs: [npc("unfiled", null, "The Unfiled", 10, 5, "bw-ep05", ["Tray three was just the lobby. Down here is where the forms go when nobody says please."], { look: { c: "#4a242c", a: "#f2d8d8", st: 6, sk: 1, h: "#1a1418", e: "#ff3a48", f: "robe" } })],
      doors: [{ x: 0, y: 5, to: "laststop", tx: 16, ty: 5, label: "Back to Last Stop" }, { x: 19, y: 5, to: "horsemen_vault", tx: 1, ty: 4, label: "Through the Boiler Door" }],
    },
    horsemen_vault: {
      name: "The Fifth Horseman's Room", room: 1, w: 18, h: 10, base: "wood", bg: "#0c0a10",
      props: [["table", 8, 4], ["table", 9, 4], ["chair144", 8, 2], ["fridge", 15, 2], ["stove", 2, 2]],
      npcs: [
        npc("famine2", "Famine", "Famine", 6, 5, "bw-horsemen-1", ["I ate the leftovers from Ur. Still hungry."]),
        npc("war2", "War", "War", 11, 5, "bw-horsemen-2", ["Who moved the fifth chair?"], { look: { c: "#8a2424", a: "#f2d8d8", st: 5, sk: 2, h: "#1c1818", e: "#a82020", f: "coat" } }),
      ],
      doors: [{ x: 0, y: 4, to: "lower_screaming", tx: 18, ty: 5, label: "Back to Sub-Tray 9" }, { x: 9, y: 9, to: "furnace_core", tx: 11, ty: 1, label: "Down into the Grief Furnace" }],
    },
    cathedral: {
      name: "The Cathedral Inside-Out", room: 1, w: 21, h: 13, base: "lattice", bg: "#000", tint: "rgba(255,190,80,.06)",
      props: [["rings", 10.5, 6]],
      npcs: [
        npc("marisol2", null, "Marisol", 10, 5, "bw-ep21", ["A hundred and four thousand lamps. Each one's a person who didn't get to finish."], { look: { c: "#3f5a6a", a: "#c9d8e0", st: 5, sk: 3, h: "#2a2020", e: "#222", f: "apron" } }),
        npc("ruth2", null, "Old Ruth", 4, 9, "bw-ep21", ["I just wanted to see a star."], { look: { c: "#7a6a5a", a: "#c9bda9", st: 8, sk: 3, h: "#d8d8d8", e: "#222", f: "coat" } }),
      ],
      doors: [{ x: 10, y: 0, to: "station", tx: 14, ty: 14, label: "Up to Meridian Station" }, { x: 20, y: 6, to: "first_wall", tx: 1, ty: 5, label: "Through the Wall Yuki Opened" }, { x: 0, y: 6, to: "lamp_gallery", tx: 18, ty: 5, label: "West into the Lamp Gallery" }],
    },
    first_wall: {
      name: "The Wall Yuki Opened", room: 1, w: 20, h: 11, base: "lawn", bg: "#101820", tint: "rgba(120,200,255,.06)",
      props: [["mattress", 4, 3], ["plate", 6, 3], ["tree", 14, 3], ["tree", 16, 7]],
      npcs: [
        npc("sofia2", null, "Sofia", 10, 5, "bw-ep22", ["She drew a dog with eight legs because she couldn't do four. His name is Biscuit, and he's running across the grass."], { look: { c: "#f2a8c0", a: "#fff", st: 1, sk: 1, h: "#6a4a3a", e: "#222", f: "casual" } }),
        npc("halvorsen2", "Halvorsen", "Dr. Helen Halvorsen", 15, 5, "bw-ep22", ["I never said I was sorry. We're saying it now."]),
      ],
      doors: [{ x: 0, y: 5, to: "cathedral", tx: 19, ty: 6, label: "Back to the Cathedral" }, { x: 19, y: 5, to: "after_hall", tx: 1, ty: 6, label: "Enter the Hall of Questions" }, { x: 10, y: 0, to: "biscuit_meadow", tx: 12, ty: 12, label: "Walk out to Biscuit's Meadow" }],
    },
    after_hall: {
      name: "The Hall of 104,000 Questions", room: 1, w: 22, h: 13, base: "white", bg: "#090810", tint: "rgba(255,220,140,.08)",
      props: [["chair144", 11, 3], ["table", 7, 7], ["table", 14, 7]],
      npcs: [
        npc("imani2", "Imani", "Imani", 7, 6, "bw-ep23", ["What do you want? Take as long as you need."]),
        npc("yuki2", "Yuki", "Yuki Tanaka", 15, 6, "bw-ep22", ["I opened the wall. Somebody had to."]),
        npc("winterboss", null, "The First Winter", 11, 5, "bw-ep21", [], { art: "kilnring", verb: "Face", boss: "firstwinter" }),
      ],
      doors: [{ x: 0, y: 6, to: "first_wall", tx: 18, ty: 5, label: "Back to the Field" }, { x: 21, y: 6, to: "archivist_annex", tx: 1, ty: 6, label: "Into the Unfiled Annex" }],
    },
    furnace_core: {
      name: "The Grief Furnace", room: 1, w: 22, h: 14, base: "kiln", bg: "#140504", tint: "rgba(255,90,30,.12)",
      monster: "mini", hounds: [[6, 5], [16, 9]], houndLine: "A cinder-clerk from the Sixth Century tried to weigh your regrets.",
      props: [["kilnring", 11, 4], ["tank", 4, 3], ["tank", 17, 3], ["bench", 4, 10], ["bench", 17, 10]],
      npcs: [
        npc("furnaceengineer", null, "Engineer Lin", 6, 7, "bw-ep21", ["Six hundred years of radiators, and we finally found the shut-off valve."], { giveWeapon: "wrench", look: { c: "#4a241c", a: "#ffd27a", st: 5, sk: 2, h: "#1a1414", e: "#222", f: "apron" } }),
        npc("furnacekeeper", null, "The Furnace Warden", 11, 5, "bw-ep21", [], { art: "kilnring", verb: "Face", boss: "griefwarden" }),
      ],
      doors: [{ x: 11, y: 0, to: "horsemen_vault", tx: 9, ty: 8, label: "Back up to the Fifth Horseman's Room" }],
    },
    biscuit_meadow: {
      name: "Biscuit's Meadow", room: 1, w: 24, h: 14, base: "lawn", bg: "#1a2834", tint: "rgba(180,230,255,.08)",
      props: [["tree", 4, 3], ["tree", 19, 3], ["tree", 6, 10], ["tree", 18, 10], ["bench", 12, 4]],
      npcs: [
        npc("biscuit8", null, "Biscuit", 12, 7, "bw-ep22", ["Eight legs, all of them moving at once. He drops a stick at your paws and waits."], { look: { c: "#c98a4a", a: "#fff4d6", st: 2, sk: 1, h: "#8a5a2a", e: "#111", f: "fur" } }),
        npc("madison2", "Madison", "Madison", 15, 5, "bw-ep22", ["Don't look at me like that. I came out to see the dog.", "Okay, fine, the sky looks better without a ceiling."]),
      ],
      doors: [{ x: 12, y: 13, to: "first_wall", tx: 10, ty: 1, label: "Back to the Wall Yuki Opened" }, { x: 23, y: 7, to: "meadow_south", tx: 1, ty: 5, label: "Out to the Open Sky Overlook" }],
    },
    archivist_annex: {
      name: "The Unfiled Annex", room: 1, w: 20, h: 12, base: "stone", bg: "#0a0a10", tint: "rgba(160,140,220,.08)",
      props: [["cabinet", 4, 2], ["cabinet", 6, 2], ["cabinet", 14, 2], ["cabinet", 16, 2], ["typewriter", 10, 3]],
      npcs: [npc("sector0arch", null, "The Sector 0 Archivist", 10, 6, "bw-ep23", ["Every unasked question from the Great Hall ends up in these drawers.", "Now that the wall is open, we're shredding half of them into confetti."], { look: { c: "#4a3160", a: "#e8dcc0", st: 6, sk: 2, h: "#c8c8d0", e: "#222", f: "robe" } })],
      doors: [{ x: 0, y: 6, to: "after_hall", tx: 20, ty: 6, label: "Back to the Hall of Questions" }, { x: 19, y: 6, to: "sector0_core", tx: 1, ty: 5, label: "Descend to Sector 0 · The Cold Core" }],
    },
    meridian_roof: {
      name: "Meridian Observation Deck", room: 1, w: 22, h: 12, base: "void", bg: "#03050c", tint: "rgba(100,170,255,.1)",
      r: [[3, 2, 16, 8, "glass"]],
      props: [["screen", 6, 3], ["screen", 15, 3], ["bench", 11, 3]],
      npcs: [npc("cmdrpark", null, "Commander Park", 11, 5, "bw-ep21", ["Look up. Not at the thermal charts—the actual stars.", "Ninety-nine percent of Meridian didn't think we'd ever see them without glass."], { look: { c: "#28344a", a: "#49d0ff", st: 5, sk: 3, h: "#1a1820", e: "#222", f: "uniform" } })],
      doors: [{ x: 11, y: 11, to: "station", tx: 14, ty: 1, label: "Back down to Sector 4" }, { x: 21, y: 6, to: "glass_stair", tx: 1, ty: 5, label: "Out onto the Glass Stair" }],
    },
    sector0_core: {
      name: "Sector 0 · The Cold Core", room: 1, w: 20, h: 12, base: "kiln", bg: "#040812", tint: "rgba(80,170,255,.1)",
      props: [["kilnring", 10, 4], ["tank", 4, 3], ["tank", 15, 3], ["screen", 4, 8], ["screen", 15, 8]],
      npcs: [
        npc("arch0", null, "Archivist Zero", 6, 6, "bw-ep23", ["Take Yuki's crowbar. Nobody locks Sector 0 again."], { giveWeapon: "crowbar_yuki", look: { c: "#28344a", a: "#9fe8ff", st: 6, sk: 2, h: "#d8dde8", e: "#222", f: "robe" } }),
        npc("coreboss", null, "The Sixth-Century Core", 10, 5, "bw-ep23", [], { art: "kilnring", verb: "Face", boss: "thermalcore" }),
      ],
      doors: [{ x: 0, y: 5, to: "archivist_annex", tx: 18, ty: 6, label: "Back to the Unfiled Annex" }],
    },
    train_car: {
      name: "The 1997 Rewrite Coach", room: 1, w: 18, h: 9, base: "wood", bg: "#101016",
      monster: "mini", hounds: [[6, 3], [11, 5]], houndLine: "A ticket puncher from 1997 tried to void your pass.",
      props: [["seat", 3, 2], ["seat", 6, 2], ["seat", 9, 2], ["seat", 12, 2], ["lampost", 14, 6]],
      npcs: [npc("conductor97", null, "The 1997 Conductor", 9, 4, "bw-ep14", ["Last stop was Blackwood, twenty-nine drafts ago. Keep your feet off the velvet."], { look: { c: "#1c2438", a: "#ffd27a", st: 6, sk: 1, h: "#2a2020", e: "#222", f: "uniform" } })],
      doors: [{ x: 17, y: 4, to: "laststop", tx: 1, ty: 5, label: "Step back onto The Last Stop" }],
    },
    lamp_gallery: {
      name: "The Hundred Thousand Lamps", room: 1, w: 20, h: 11, base: "lattice", bg: "#020208", tint: "rgba(255,200,90,.07)",
      props: [["lampost", 4, 2], ["lampost", 9, 2], ["lampost", 14, 2], ["lampost", 4, 8], ["lampost", 14, 8]],
      npcs: [npc("lamplighter", null, "Lamplighter Sol", 10, 5, "bw-ep21", ["Every lamp here is a name someone remembered out loud. Half of them are flickering brighter now."], { look: { c: "#3f5a6a", a: "#ffd84d", st: 5, sk: 3, h: "#3a2a1c", e: "#222", f: "coat" } })],
      doors: [{ x: 19, y: 5, to: "cathedral", tx: 1, ty: 6, label: "Back to the Cathedral Inside-Out" }],
    },
    meadow_south: {
      name: "The Open Sky Overlook", room: 1, w: 20, h: 11, base: "lawn", bg: "#162434", tint: "rgba(160,220,255,.08)",
      props: [["tree", 4, 2], ["tree", 15, 2], ["bench", 10, 4]],
      npcs: [npc("yukisimone", "Yuki", "Yuki & Simone (Overlook)", 10, 6, "bw-ep23", ["No ceiling. No furnace. Just wind in the grass and Biscuit chasing a moth."])],
      doors: [{ x: 0, y: 5, to: "biscuit_meadow", tx: 22, ty: 7, label: "Back to Biscuit's Meadow" }, { x: 19, y: 5, to: "quiet_orchard", tx: 1, ty: 5, label: "Into the Quiet Orchard" }],
    },
    glass_stair: {
      name: "The Unending Glass Stair", room: 1, w: 18, h: 10, base: "glass", bg: "#040814", tint: "rgba(140,200,255,.1)",
      props: [["lampost", 4, 2], ["lampost", 13, 2], ["bench", 9, 7]],
      npcs: [npc("bellkeeper", null, "The Glass Bell-Keeper", 9, 4, "bw-ep21", ["Every step up here rings once when you think of home."], { look: { c: "#28344a", a: "#9fe8ff", st: 6, sk: 2, h: "#d8dde8", e: "#222", f: "coat" } })],
      doors: [{ x: 0, y: 5, to: "meridian_roof", tx: 20, ty: 6, label: "Back to Meridian Observation Deck" }] },
    quiet_orchard: {
      name: "The Orchard Beyond the Wall", room: 1, w: 20, h: 11, base: "lawn", bg: "#182838", tint: "rgba(180,240,200,.08)",
      props: [["tree", 4, 2], ["tree", 9, 2], ["tree", 14, 2], ["tree", 4, 8], ["tree", 14, 8]],
      npcs: [npc("quietgardener", null, "The Quiet Gardener", 10, 5, "bw-ep23", ["Apples grow out here without anybody having to cry for them."], { look: { c: "#3f6a48", a: "#e8f0d8", st: 5, sk: 2, h: "#4a3220", e: "#222", f: "apron" } })],
      doors: [{ x: 0, y: 5, to: "meadow_south", tx: 18, ty: 5, label: "Back to the Open Sky Overlook" }] },
  },
  quest: [
    { id: "simone2", title: "Day Four Hundred", who: "simone2", goal: "Speak to Simone in Meridian Station · Sector 4.", say: "Four hundred days with nine hundred and sixty thousand people. Thirty years with a hundred and forty-four. Check Airlock 13—Kevin's still drifting out there.", btn: "Check Airlock 13", story: "bw-ep21" },
    { id: "kevinair", title: "Kevin in Sector 4", who: "kevinair", goal: "Find Kevin in Airlock 13.", say: "I'm fine! Mostly! The rewrite train at the Last Stop has been idling since 1997. Go talk to the Rewrite Clerk.", btn: "Go to Last Stop", story: "bw-ep13" },
    { id: "rewriteclerk", title: "Last Stop Rewrite", who: "rewriteclerk", goal: "Talk to the Rewrite Clerk at The Last Stop.", say: "Every draft we cut drops straight into Sub-Tray 9. The Fifth Horseman's room is through the boiler door past it.", btn: "Head down", story: "bw-ep14" },
    { id: "marisol2", title: "Inside-Out", who: "marisol2", goal: "Descend from Meridian Station to the Cathedral Inside-Out and talk to Marisol.", say: "A hundred and four thousand lamps, and Yuki just took a crowbar to the east wall.", btn: "Go through the wall", story: "bw-ep21" },
    { id: "sofia2", title: "Biscuit", who: "sofia2", goal: "Step through the Wall Yuki Opened and speak to Sofia.", say: "Eight legs, running across the grass. Go into the Hall of Questions—the First Winter is still waiting at the center.", btn: "Enter the Hall", story: "bw-ep22" },
    { id: "imani2", title: "What Do You Want?", who: "imani2", goal: "Speak to Imani in the Hall of 104,000 Questions.", say: "Nobody's keeping score anymore. Face the First Winter if you're ready, or stay for coffee.", btn: "I'm ready", story: "bw-ep23" },
    { id: "furnaceengineer", title: "Shut the Grate", who: "furnaceengineer", goal: "Descend beneath the Fifth Horseman's Room to the Grief Furnace.", say: "Take this thermal wrench. If you can face the Furnace Warden at the grate, the whole Sixth-Century boiler finally cools down.", btn: "Take the wrench", story: "bw-ep21" },
    { id: "biscuit8", title: "Eight Legs", who: "biscuit8", goal: "Visit Biscuit's Meadow north of the Wall Yuki Opened.", say: "Biscuit bounds in an impossible circle, eight paws drumming the clover. Even Madison can't pretend she's not smiling.", btn: "Pet Biscuit", story: "bw-ep22" },
    { id: "sector0arch", title: "The Unfiled Annex", who: "sector0arch", goal: "Step east from the Hall of Questions into the Unfiled Annex.", say: "Half the forms in Sector 0 were never meant to be read—just shredded. Down east is the Sixth-Century Cold Core.", btn: "Into Sector 0", story: "bw-ep23" },
    { id: "cmdrpark", title: "No Ceiling", who: "cmdrpark", goal: "Climb to the Meridian Observation Deck above Sector 4.", say: "Look up. Actual stars, no glass between us and the dark. We're done counting days of heat.", btn: "Look up", story: "bw-ep21" },
  ],
  relics: [
    { id: "dbw_coat", s: "station", x: 6, y: 12, name: "a frozen station coat", text: "Meridian Station thermal lining, frosted stiff.", story: "bw-ep21" },
    { id: "dbw_stapler", s: "airlock", x: 14, y: 7, name: "a zero-g stapler", text: "Kevin's. Still has three staples left.", story: "bw-ep13" },
    { id: "dbw_script", s: "laststop", x: 4, y: 7, name: "a crossed-out page", text: "THE THIRD ACT, underlined four times.", story: "bw-ep14" },
    { id: "dbw_chair", s: "horsemen_vault", x: 13, y: 7, name: "a fifth place-setting", text: "Clean plate, unused fork. Nobody remembers whose.", story: "bw-horsemen-1" },
    { id: "dbw_lamp", s: "cathedral", x: 16, y: 10, name: "an unlit glass lamp", text: "Warm to the touch, waiting for a name.", story: "bw-ep21" },
    { id: "dbw_collar", s: "first_wall", x: 12, y: 8, name: "a dog collar labeled BISCUIT", text: "Eight little notches cut into the leather.", story: "bw-ep22" },
    { id: "dbw_radiator", s: "furnace_core", x: 14, y: 9, name: "a brass pressure gauge", text: "The needle sits peacefully at zero for the first time in six hundred years.", story: "bw-ep21" },
    { id: "dbw_leash", s: "biscuit_meadow", x: 9, y: 9, name: "a braided eight-loop leash", text: "Unused. Nobody here needs to be held back anymore.", story: "bw-ep22" },
    { id: "dbw_ledger", s: "archivist_annex", x: 15, y: 8, name: "a shredded redaction stamp", text: "Cut cleanly in half with a pair of office scissors.", story: "bw-ep23" },
    { id: "dbw_starchart", s: "meridian_roof", x: 16, y: 7, name: "a hand-drawn star chart", text: "Simone's handwriting in the margin: 'No ceiling.'", story: "bw-ep21" },
    { id: "dbw_ticket97", s: "train_car", x: 14, y: 4, name: "a 1997 rewrite ticket", text: "Punched three times: DRAFT ONE, DRAFT TWO, FINAL.", story: "bw-ep14" },
    { id: "dbw_lampwick", s: "lamp_gallery", x: 7, y: 6, name: "a silver lamp wick", text: "Still warm from a hundred thousand names.", story: "bw-ep21" },
    { id: "dbw_valvekey", s: "sector0_core", x: 15, y: 6, name: "a Sector 0 shutoff key", text: "Cold brass, stamped MERIDIAN MASTER.", story: "bw-ep23" },
    { id: "dbw_starphoto", s: "meadow_south", x: 14, y: 7, name: "a polaroid of open sky", text: "Nothing in the frame except grass and stars.", story: "bw-ep23" },
    { id: "dbw_glassbell", s: "glass_stair", x: 13, y: 6, name: "a clear glass handbell", text: "Rings softly whenever you say thank you.", story: "bw-ep21" },
    { id: "dbw_orchardapple", s: "quiet_orchard", x: 11, y: 7, name: "a crisp orchard apple", text: "Grown in open air, six miles past the Ring Road.", story: "bw-ep23" },
  ],
};
