// Deep Blackwood Expansion: Retrospect Express, Kevin Slides (Beige Void, HRS, Dead Letter Office, Hell's Peak Estates), Horsemen's Tokyo & Architect's Tower, and Aftermath.
const npc = (id, cast, name, x, y, story, lines, o = {}) => ({ id, cast, name, x, y, story, lines, ...o });

export const DBW_EXTRA_SCENES = {
  // --- THE RETROSPECT EXPRESS (ep14) ---
  express_reception: {
    name: "Retrospect Express · Reception Car", room: 1, w: 17, h: 9, base: "carpet", bg: "#140c14", tint: "rgba(255,200,120,.08)",
    props: [["desk", 4, 2], ["seat", 8, 2], ["seat", 12, 2], ["lampost", 2, 6], ["lampost", 14, 6]],
    npcs: [npc("express_steward", null, "The Express Steward", 8, 4, "bw-ep14", ["Welcome aboard the Retrospect Express. Please surrender all unresolved grudges at the Disarmament Car ahead."], { look: { c: "#4a1c28", a: "#ffd27a", st: 6, sk: 2, h: "#2a2020", e: "#222", f: "uniform" } })],
    doors: [
      { x: 16, y: 4, to: "train_car", tx: 1, ty: 4, label: "Back to the 1997 Rewrite Coach" },
      { x: 0, y: 4, to: "express_disarmament", tx: 15, ty: 4, label: "Forward to the Disarmament Car" },
    ],
  },
  express_disarmament: {
    name: "Retrospect Express · Disarmament Car", room: 1, w: 17, h: 9, base: "wood", bg: "#121016",
    props: [["cabinet", 3, 2], ["cabinet", 6, 2], ["rack", 11, 2], ["table", 8, 6]],
    npcs: [
      npc("velvette_train", "Velvette", "Velvette (Checking Weapons)", 7, 4, "bw-ep14", ["They tried to confiscate my chains, two knives, and Gerald the ruler. I kept Gerald in my boot."]),
      npc("disarm_clerk", null, "Disarmament Clerk", 12, 5, "bw-ep14", ["No crossbows, no sharpened stationery, no emotional baggage over twelve pounds."], { look: { c: "#3a3844", a: "#e8dcc0", st: 5, sk: 2, h: "#8a867c", e: "#222", f: "smart" } }),
    ],
    doors: [
      { x: 16, y: 4, to: "express_reception", tx: 1, ty: 4, label: "Back to Reception Car" },
      { x: 0, y: 4, to: "express_threesecond", tx: 17, ty: 5, label: "Into The Three-Second Car" },
    ],
  },
  express_threesecond: {
    name: "The Three-Second Car", room: 1, w: 19, h: 10, base: "white", bg: "#101218", tint: "rgba(255,90,90,.08)",
    props: [["bench", 4, 2], ["bench", 9, 2], ["bench", 14, 2], ["bench", 4, 7], ["bench", 14, 7], ["screen", 9, 1]],
    npcs: [
      npc("threesecond_boss", null, "The Three-Second Attendant", 9, 5, "bw-ep14", [], { art: "armor", verb: "Face", boss: "threeseconds" }),
      npc("lux_threesecond", "Lux", "Lux (Counting Seconds)", 5, 5, "bw-ep14", ["Response window: three seconds. Don't answer early, darling, it doubles the brass figures."]),
    ],
    doors: [
      { x: 18, y: 5, to: "express_disarmament", tx: 1, ty: 4, label: "Back to Disarmament Car" },
      { x: 0, y: 5, to: "express_dining", tx: 17, ty: 5, label: "Forward to The Infernal Dining Car" },
    ],
  },
  express_dining: {
    name: "The Infernal Dining Car", room: 1, w: 19, h: 10, base: "carpet", bg: "#1a0a0e", tint: "rgba(255,150,60,.09)",
    props: [["table", 4, 3], ["table", 9, 3], ["table", 14, 3], ["stove", 16, 7], ["lampost", 3, 7]],
    npcs: [
      npc("dining_chef", null, "The Infernal Chef", 12, 6, "bw-ep14", ["Tonight's tasting menu: course one is unspoken apologies, course two is Saffron's aubergine napkins."], { look: { c: "#e8e2d0", a: "#b5303a", st: 6, sk: 2, h: "#2a2020", e: "#222", f: "apron" } }),
    ],
    doors: [
      { x: 18, y: 5, to: "express_threesecond", tx: 1, ty: 5, label: "Back to Three-Second Car" },
      { x: 0, y: 5, to: "express_conservatory", tx: 16, ty: 4, label: "Forward to The Conservatory Car" },
    ],
  },
  express_conservatory: {
    name: "The Conservatory Car", room: 1, w: 18, h: 9, base: "lawn", bg: "#0a1612", tint: "rgba(100,220,160,.08)",
    r: [[2, 2, 14, 5, "glass"]],
    props: [["plant", 4, 2], ["plant", 13, 2], ["tree", 6, 6], ["tree", 11, 6]],
    npcs: [npc("train_botanist", null, "Night Botanist", 9, 4, "bw-ep14", ["These ferns only bloom between two drafts of the same scene."], { look: { c: "#2f6b44", a: "#e8f0d8", st: 5, sk: 2, h: "#6a4a2c", e: "#222", f: "apron" } })],
    doors: [
      { x: 17, y: 4, to: "express_dining", tx: 1, ty: 5, label: "Back to Infernal Dining Car" },
      { x: 0, y: 4, to: "express_sleeper", tx: 15, ty: 4, label: "Forward to Luxury Sleeper Suite" },
    ],
  },
  express_sleeper: {
    name: "Retrospect Express · Luxury Sleeper Suite", room: 1, w: 17, h: 9, base: "carpet", bg: "#180e1a",
    props: [["mattress", 4, 2], ["sofa", 12, 2], ["table", 8, 5], ["lampost", 3, 6]],
    npcs: [npc("sleeper_porter", null, "Night Porter", 9, 4, "bw-ep14", ["Lux and Velvette booked the whole car just to argue about the wine list in peace."], { look: { c: "#3a2438", a: "#ffd27a", st: 5, sk: 1, h: "#2a2020", e: "#222", f: "uniform" } })],
    doors: [
      { x: 16, y: 4, to: "express_conservatory", tx: 1, ty: 4, label: "Back to Conservatory Car" },
      { x: 0, y: 4, to: "express_observation", tx: 16, ty: 5, label: "Out to the Observation Car" },
    ],
  },
  express_observation: {
    name: "Retrospect Express · Observation Car", room: 1, w: 18, h: 10, base: "glass", bg: "#05070e", tint: "rgba(120,170,255,.1)",
    props: [["bench", 4, 3], ["bench", 13, 3], ["lampost", 4, 7], ["lampost", 13, 7]],
    npcs: [npc("obs_watcher", "Yuki", "Yuki (Tail Balcony)", 9, 5, "bw-ep14", ["Watch the mileposts peel away behind us. Every rewrite leaves a platform behind."])],
    doors: [{ x: 17, y: 5, to: "express_sleeper", tx: 1, ty: 4, label: "Back to Luxury Sleeper Suite" }],
  },

  // --- KEVIN SLIDES · BEIGE VOID, GRAVEYARD, CATHEDRAL, MOTEL, GAS STATION ---
  last_stop_motel: {
    name: "The Last Stop Motel · Room Six", room: 1, w: 18, h: 10, base: "wood", bg: "#141016", tint: "rgba(255,140,80,.08)",
    props: [["desk", 4, 2], ["mattress", 13, 2], ["lampost", 2, 7], ["vend", 15, 7]],
    npcs: [
      npc("motel_clerk", null, "Night Desk Clerk", 5, 4, "bw-kevin-slides-1", ["Room Six is quiet, the ice machine is haunted, and Kevin's cardboard box refuses to sign the register."], { look: { c: "#4a3828", a: "#ffd27a", st: 6, sk: 2, h: "#8a867c", e: "#222", f: "casual" } }),
      npc("quiet_listener", null, "The Quiet Room Listener", 12, 5, "bw-kevin-slides-1", ["Put your ear to the drywall. You can hear every apology Kevin ever swallowed."], { look: { c: "#2e2c36", a: "#e4e0d8", st: 4, sk: 1, h: "#2a2020", e: "#222", f: "coat" } }),
    ],
    doors: [
      { x: 8, y: 0, to: "laststop", tx: 9, ty: 8, label: "Back to The Last Stop" },
      { x: 17, y: 5, to: "dots_gas_station", tx: 1, ty: 5, label: "Down the Highway to Dot's Gas Station" },
    ],
  },
  dots_gas_station: {
    name: "Dot's Gas Station · Nowhere, Nevada-ish", room: 1, w: 19, h: 10, base: "ash", bg: "#1a120c", tint: "rgba(255,154,60,.1)",
    props: [["pump", 4, 2], ["pump", 8, 2], ["fridge", 15, 2], ["vend", 16, 6], ["bench", 4, 7]],
    npcs: [
      npc("madison_nomad", "Madison", "Madison (Nomad)", 11, 5, "bw-madison-nomad", ["I re-formed out of a cup of instant ramen at three in the morning. My cupcakes don't work anymore, and honestly? It's quieter."]),
      npc("dot_keeper", null, "Dot", 14, 4, "bw-madison-nomad", ["Gas is four-ninety-nine, ramen's a dollar, and don't feed the stray moths behind the dumpster."], { look: { c: "#6a4528", a: "#ffe8b0", st: 6, sk: 2, h: "#b9b6b0", e: "#222", f: "apron" } }),
    ],
    doors: [{ x: 0, y: 5, to: "last_stop_motel", tx: 16, ty: 5, label: "Back to The Last Stop Motel" }],
  },
  beige_void: {
    name: "The Beige Void · No Time", room: 1, w: 20, h: 11, base: "plain", bg: "#d9d4c6", tint: "rgba(180,165,130,.12)",
    props: [["cabinet", 4, 2], ["cabinet", 15, 2], ["desk", 10, 2]],
    npcs: [
      npc("sentient_box", null, "The Sentient Cardboard Box", 10, 5, "bw-kevin-slides-1", ["Ten minutes to deliver me. Do not drop me, do not open me, and stop apologizing to the wallpaper."], { art: "book", verb: "Talk to" }),
    ],
    doors: [
      { x: 9, y: 0, to: "lower_screaming", tx: 10, ty: 9, label: "Back up to Sub-Tray 9" },
      { x: 19, y: 5, to: "kevin_graveyard", tx: 1, ty: 6, label: "Through the Wallpaper to Kevin's Graveyard" },
      { x: 0, y: 5, to: "hrs_intake", tx: 18, ty: 5, label: "Enter Hereafter Revenue Service" },
      { x: 10, y: 10, to: "hells_peak_culdesac", tx: 10, ty: 1, label: "Step into Hell's Peak Estates" },
    ],
  },
  kevin_graveyard: {
    name: "The Graveyard of Kevins", room: 1, w: 22, h: 12, base: "dead", bg: "#080c10", tint: "rgba(120,160,200,.08)",
    props: [["monument", 4, 3], ["monument", 8, 3], ["monument", 13, 3], ["monument", 17, 3], ["monument", 5, 8], ["monument", 16, 8], ["plant", 11, 8]],
    npcs: [
      npc("kevin_grave", "Kevin", "Kevin (Sitting on Stone #47,019)", 11, 6, "bw-kevin-slides-1", ["HERE LIES KEVIN (BORN: TUESDAY). HERE LIES KEVIN (EATEN BY A STAIRWELL). HERE LIES KEVIN (THE PLANT).", "Forty-seven thousand and nineteen of me. The wilted plant is my favorite."]),
    ],
    doors: [
      { x: 0, y: 6, to: "beige_void", tx: 18, ty: 5, label: "Back to The Beige Void" },
      { x: 21, y: 6, to: "quarterly_cathedral", tx: 1, ty: 6, label: "To the Cathedral of Quarterly Results" },
    ],
  },
  quarterly_cathedral: {
    name: "The Cathedral of Quarterly Results", room: 1, w: 22, h: 13, base: "white", bg: "#10141c", tint: "rgba(180,210,255,.08)",
    props: [["screen", 11, 1], ["bench", 5, 4], ["bench", 16, 4], ["bench", 5, 8], ["bench", 16, 8]],
    npcs: [
      npc("priestess_yuki", "Yuki", "High Priestess Yuki (Operations)", 11, 4, "bw-kevin-slides-1", ["TODAY'S SERMON: SYNERGY. THE SOUL IS A DELIVERABLE.", "Brother Kevin, you are late for your Q3 performance review."]),
      npc("gantt_singer", null, "Beige Congregationalist", 7, 7, "bw-kevin-slides-1", ["Bless this meeting, bless this memo, bless the Gantt chart's sacred scroll."], { look: { c: "#c9bda9", a: "#fff", st: 4, sk: 2, h: "#4a3a2a", e: "#222", f: "smart" } }),
    ],
    doors: [{ x: 0, y: 6, to: "kevin_graveyard", tx: 20, ty: 6, label: "Back to the Graveyard of Kevins" }],
  },

  // --- HEREAFTER REVENUE SERVICE & DEAD LETTER OFFICE (kevin-slides-ep2) ---
  hrs_intake: {
    name: "Hereafter Revenue Service · Intake Hall", room: 1, w: 20, h: 11, base: "white", bg: "#14181e", tint: "rgba(150,180,200,.1)",
    props: [["desk", 4, 2], ["desk", 15, 2], ["cabinet", 9, 1], ["bench", 5, 7], ["bench", 14, 7]],
    npcs: [
      npc("kevina_hrs", "Kevin", "Kevina (Translucent Spare)", 10, 5, "bw-kevin-slides-2", ["Shh! Stop breathing so loud! Being alive is a felony in this building.", "DEATH IS CERTAIN. SO IS THE FORM."]),
    ],
    doors: [
      { x: 19, y: 5, to: "beige_void", tx: 1, ty: 5, label: "Back to The Beige Void" },
      { x: 0, y: 5, to: "hrs_courtroom", tx: 17, ty: 5, label: "Into the HRS Courtroom" },
    ],
  },
  hrs_courtroom: {
    name: "HRS Courtroom · On Trial for Breathing", room: 1, w: 19, h: 11, base: "wood", bg: "#121016",
    props: [["table", 9, 3], ["chair144", 9, 2], ["bench", 4, 7], ["bench", 14, 7]],
    npcs: [
      npc("hrs_bailiff_boss", null, "The HRS Bailiff", 9, 5, "bw-kevin-slides-2", [], { art: "statue", verb: "Face", boss: "hrs_bailiff" }),
      npc("breathing_judge", null, "Magistrate of the Unfiled", 5, 3, "bw-kevin-slides-2", ["Charge: unauthorized respiration in a tax-exempt afterlife. How do you plead?"], { look: { c: "#26262c", a: "#ffd27a", st: 7, sk: 1, h: "#c8c8d0", e: "#222", f: "robe" } }),
    ],
    doors: [
      { x: 18, y: 5, to: "hrs_intake", tx: 1, ty: 5, label: "Back to HRS Intake Hall" },
      { x: 0, y: 5, to: "hrs_tubes", tx: 16, ty: 4, label: "Into the Corridor of Tubes" },
    ],
  },
  hrs_tubes: {
    name: "HRS · Corridor of Pneumatic Tubes", room: 1, w: 18, h: 9, base: "linoG", bg: "#0e1216",
    props: [["tank", 3, 2], ["tank", 7, 2], ["tank", 11, 2], ["tank", 15, 2]],
    npcs: [npc("tube_dispatcher", null, "Tube Dispatcher", 9, 5, "bw-kevin-slides-2", ["Hold your breath and tuck your mop in—Tube 7 drops straight into the Dead Letter Office."], { look: { c: "#3a444a", a: "#9fe8ff", st: 5, sk: 2, h: "#2a2020", e: "#222", f: "uniform" } })],
    doors: [
      { x: 17, y: 4, to: "hrs_courtroom", tx: 1, ty: 5, label: "Back to HRS Courtroom" },
      { x: 0, y: 4, to: "dead_letter_office", tx: 20, ty: 6, label: "Slide down Tube 7 to Dead Letter Office" },
    ],
  },
  dead_letter_office: {
    name: "The Dead Letter Office · Cardboard Cathedral", room: 1, w: 22, h: 13, base: "wood", bg: "#0c0a08", tint: "rgba(255,210,120,.08)",
    props: [["cabinet", 3, 2], ["cabinet", 6, 2], ["cabinet", 15, 2], ["cabinet", 18, 2], ["printer", 11, 3], ["desk", 11, 8]],
    npcs: [
      npc("inspector_yuki", "Yuki", "Inspector Yuki (Two Bailiff Bells)", 11, 5, "bw-kevin-slides-2", ["One million, two hundred and nine thousand undelivered letters. The Revenue Service burns the backlog at dawn for a tax write-off.", "Grab a stack. We're delivering all of them before sunrise."]),
      npc("postmaster_dlo", null, "The Postmaster", 6, 7, "bw-kevin-slides-2", ["Even the Printer is helping tonight, squeaking on three castors."], { look: { c: "#3a3244", a: "#ffd27a", st: 6, sk: 2, h: "#8a867c", e: "#222", f: "coat" } }),
    ],
    doors: [{ x: 21, y: 6, to: "hrs_tubes", tx: 1, ty: 4, label: "Back up to the Corridor of Tubes" }],
  },

  // --- HELL'S PEAK ESTATES (kevin-slides-ep3) ---
  hells_peak_culdesac: {
    name: "Hell's Peak Estates · Cul-de-Sac", room: 1, w: 21, h: 12, base: "lawn", bg: "#98c4e0", tint: "rgba(255,240,180,.06)",
    r: [[2, 5, 17, 2, "path"]],
    props: [["tree", 3, 2], ["tree", 17, 2], ["lampost", 10, 3], ["bench", 6, 9], ["bench", 14, 9]],
    npcs: [
      npc("hoa_warden", null, "HOA Warden (Number Seven)", 10, 7, "bw-kevin-slides-3", ["Lawns trimmed to two and a half inches. A VIOLATION HAS BEEN RECORDED.", "Drop dead birds only in bins marked COMPOST (APPROVED)."], { look: { c: "#f2a8c0", a: "#fff", st: 4, sk: 1, h: "#c9b48a", e: "#222", f: "apron" } }),
    ],
    doors: [
      { x: 10, y: 0, to: "beige_void", tx: 10, ty: 9, label: "Back to The Beige Void" },
      { x: 20, y: 6, to: "hells_peak_garden", tx: 1, ty: 5, label: "To the Community Garden" },
      { x: 0, y: 6, to: "hells_peak_hall", tx: 16, ty: 5, label: "Into the HOA Community Hall" },
    ],
  },
  hells_peak_garden: {
    name: "Hell's Peak · Community Garden", room: 1, w: 18, h: 10, base: "lawn", bg: "#8ab8d0",
    props: [["plant", 4, 2], ["plant", 13, 2], ["plant", 4, 7], ["plant", 13, 7], ["bench", 9, 4]],
    npcs: [
      npc("lux_suburban", "Lux", "Lux (HOA President)", 7, 5, "bw-kevin-slides-3", ["Saying 'please' is banned by the by-laws, darling. It's the only wall holding the apocalypse out."]),
      npc("velvette_suburban", "Velvette", "Velvette (Weeding)", 11, 5, "bw-kevin-slides-3", ["It's always Saturday here. Nobody touches the hydrangeas."]),
    ],
    doors: [{ x: 0, y: 5, to: "hells_peak_culdesac", tx: 19, ty: 6, label: "Back to the Cul-de-Sac" }],
  },
  hells_peak_hall: {
    name: "Hell's Peak · Community Hall", room: 1, w: 18, h: 10, base: "wood", bg: "#201a16",
    props: [["table", 6, 4], ["table", 11, 4], ["chair144", 9, 2], ["stove", 15, 2]],
    npcs: [npc("kevina_hoa", "Kevin", "Kevina (HOA Rebel)", 9, 6, "bw-kevin-slides-3", ["Three casseroles and a laminated notice. Somebody's about to say the P-word."])],
    doors: [{ x: 17, y: 5, to: "hells_peak_culdesac", tx: 1, ty: 6, label: "Back out to the Cul-de-Sac" }],
  },

  // --- HORSEMEN CHRONICLES: TOKYO & ARCHITECT'S TOWER ---
  tokyo_kabukicho: {
    name: "Kabukicho · 2:47 A.M.", room: 1, w: 20, h: 11, base: "road", bg: "#080814", tint: "rgba(255,60,120,.1)",
    props: [["lampost", 3, 2], ["lampost", 16, 2], ["vend", 5, 2], ["vend", 14, 2], ["table", 10, 7]],
    npcs: [
      npc("conquest_tokyo", null, "Conquest (In Human Skin)", 8, 5, "bw-horsemen-1", ["Rain tastes like rust in Tokyo. Have it your way."], { look: { c: "#f4f1e6", a: "#b5303a", st: 6, sk: 1, h: "#e8e6df", e: "#d9302e", f: "coat" } }),
      npc("ena_tokyo", "Ena", "Ena (Shinjuku Rain)", 12, 5, "bw-horsemen-2", ["Four monks volunteered to carry the end of the world. We're still paying for the cab fare."]),
    ],
    doors: [
      { x: 0, y: 5, to: "horsemen_vault", tx: 16, ty: 4, label: "Back to Fifth Horseman's Room" },
      { x: 19, y: 5, to: "architect_lobby", tx: 1, ty: 5, label: "Through the Revolving Door to Architect's Tower" },
      { x: 10, y: 10, to: "hell_high_water", tx: 9, ty: 1, label: "Down to Hell or High Water" },
    ],
  },
  architect_lobby: {
    name: "Architect's Tower · Server Hall", room: 1, w: 19, h: 10, base: "glass", bg: "#060810", tint: "rgba(100,180,255,.08)",
    props: [["screen", 3, 2], ["screen", 7, 2], ["screen", 11, 2], ["screen", 15, 2], ["cabinet", 4, 7], ["cabinet", 14, 7]],
    npcs: [npc("server_juno", null, "Server Rack · Juno Pell", 9, 4, "bw-horsemen-3", ["A schedule with Death's name on it since 1347. One server blade hums like a moth."], { art: "screen", verb: "Inspect" })],
    doors: [
      { x: 0, y: 5, to: "tokyo_kabukicho", tx: 18, ty: 5, label: "Back out to Kabukicho" },
      { x: 18, y: 5, to: "seventh_floor", tx: 1, ty: 5, label: "Take Lift to the Seventh Floor (Not a Floor)" },
    ],
  },
  seventh_floor: {
    name: "The Seventh Floor (Not a Floor)", room: 1, w: 18, h: 10, base: "white", bg: "#040408", tint: "rgba(255,255,255,.06)",
    props: [["chair144", 9, 3], ["screen", 4, 2], ["screen", 13, 2]],
    npcs: [
      npc("compliance_boss", null, "The Compliance Agent", 9, 5, "bw-horsemen-3", [], { art: "assignor", verb: "Face", boss: "compliance_agent" }),
      npc("death_nine", "Death", "Death (1347 Schedule)", 5, 6, "bw-horsemen-3", ["I was nine. I mean—I don't have a voice. I have a stamp."], { look: { c: "#181820", a: "#e4e4e8", st: 3, sk: 0, h: "#111", e: "#7fd0ff", f: "robe" } }),
    ],
    doors: [{ x: 0, y: 5, to: "architect_lobby", tx: 17, ty: 5, label: "Back down to Server Hall" }],
  },
  hell_high_water: {
    name: "Hell or High Water · Basement", room: 1, w: 18, h: 10, base: "flesh", bg: "#080306", tint: "rgba(255,70,120,.1)",
    props: [["lampost", 4, 2], ["lampost", 13, 2], ["tank", 9, 3], ["sofa", 4, 7]],
    npcs: [npc("lantern_girl", null, "Girl with Lantern Eyes", 9, 5, "bw-horsemen-4", ["She sings quietly to a moth in the basement while Compliance cleaners sweep the stairs above."], { look: { c: "#2a1428", a: "#ffd84d", st: 4, sk: 1, h: "#1c1818", e: "#ffd84d", f: "robe" } })],
    doors: [{ x: 9, y: 0, to: "tokyo_kabukicho", tx: 10, ty: 9, label: "Back up to Kabukicho" }],
  },

  // --- REAPER'S OFFICE, HARROW HOUSE NURSERY, CONTINUITY CAMPUS ---
  reaper_office: {
    name: "The Reaper's Office & Kitchen", room: 1, w: 18, h: 10, base: "wood", bg: "#100e14", tint: "rgba(255,210,140,.08)",
    props: [["desk", 4, 3], ["stove", 13, 2], ["fridge", 15, 2], ["table", 10, 6], ["book", 4, 4]],
    npcs: [
      npc("imogen_off", "Imani", "Imogen Vale (The Reaper)", 9, 4, "bw-kevin-slides-4", ["Tea's on. My mother's parcel finally arrived from Meridian, and nobody has to carry a scythe today."]),
    ],
    doors: [
      { x: 8, y: 0, to: "archivist_annex", tx: 10, ty: 10, label: "Back to the Unfiled Annex" },
      { x: 17, y: 5, to: "harrow_nursery", tx: 1, ty: 4, label: "Through to Harrow House · Nursery" },
      { x: 0, y: 5, to: "continuity_campus", tx: 17, ty: 5, label: "Step onto Continuity Campus" },
    ],
  },
  harrow_nursery: {
    name: "Harrow House · Lux's Childhood Nursery", room: 1, w: 16, h: 9, base: "carpet", bg: "#1c1018", tint: "rgba(255,160,200,.08)",
    props: [["mattress", 3, 2], ["desk", 12, 2], ["book", 12, 3], ["lampost", 4, 6]],
    npcs: [npc("lux_notebook", "Lux", "Nine-Year-Old's Notebook", 8, 5, "bw-ep01", ["'When I grow up I will own a school and everyone in it will love me.' Written in neat violet ink."], { art: "book", verb: "Read" })],
    doors: [{ x: 0, y: 4, to: "reaper_office", tx: 16, ty: 5, label: "Back to The Reaper's Office" }],
  },
  continuity_campus: {
    name: "Continuity Campus · Control Core", room: 1, w: 18, h: 10, base: "glass", bg: "#080c14", tint: "rgba(120,200,255,.09)",
    props: [["screen", 4, 2], ["screen", 9, 2], ["screen", 14, 2], ["desk", 9, 6]],
    npcs: [
      npc("smart_kevin", "Kevin", "Smart Kevin", 6, 5, "bw-kevin-slides-4", ["I calculated the exact probability of a happy ending across forty-seven thousand timelines. It rounded up to one."]),
      npc("kevina_corner", "Kevin", "Kevina's Interview Corner", 12, 5, "bw-kevin-slides-4", ["Tell the camera: how does it feel to finally finish the filing?"]),
    ],
    doors: [{ x: 17, y: 5, to: "reaper_office", tx: 1, ty: 5, label: "Back to The Reaper's Office" }],
  },
};

export const DBW_EXTRA_QUESTS = [
  { id: "express_steward", title: "The Retrospect Express", who: "express_steward", goal: "Board the Retrospect Express west of the 1997 Rewrite Coach.", say: "Next stop: the Three-Second Car. Do not answer the brass figures early—wait for the three-second bell.", btn: "Board the train", story: "bw-ep14" },
  { id: "sentient_box", title: "Return to Sender", who: "sentient_box", goal: "Peel back the beige wallpaper beneath Sub-Tray 9 to enter The Beige Void.", say: "Ten minutes on the clock. Deliver me across the Graveyard of Kevins, the Hereafter Revenue Service, or Hell's Peak Estates.", btn: "Take the box", story: "bw-kevin-slides-1" },
  { id: "priestess_yuki", title: "Quarterly Synergy", who: "priestess_yuki", goal: "Cross the Graveyard of Kevins to the Cathedral of Quarterly Results.", say: "Brother Kevin, the soul is a deliverable. Sign the Q3 performance review and move along.", btn: "Sign it", story: "bw-kevin-slides-1" },
  { id: "inspector_yuki", title: "Before Dawn", who: "inspector_yuki", goal: "Pass through the Hereafter Revenue Service and ride Tube 7 to the Dead Letter Office.", say: "One million, two hundred and nine thousand letters. Grab a bundle—we're delivering them before the Revenue Service burns the backlog.", btn: "Deliver the mail", story: "bw-kevin-slides-2" },
  { id: "lux_suburban", title: "No Saying Please", who: "lux_suburban", goal: "Visit Hell's Peak Estates south of the Beige Void.", say: "Saying 'please' is an HOA violation here, darling. Keep the grass at two and a half inches.", btn: "Obey the HOA", story: "bw-kevin-slides-3" },
  { id: "conquest_tokyo", title: "Kabukicho Rain", who: "conquest_tokyo", goal: "Step east from the Fifth Horseman's Room into Kabukicho.", say: "Four monks, one rainy fast-food joint, and the Architect's Tower just down the street.", btn: "Walk to the tower", story: "bw-horsemen-1" },
  { id: "death_nine", title: "Not a Floor", who: "death_nine", goal: "Take the lift in Architect's Tower up to the Seventh Floor.", say: "I was scheduled in 1347. Face the Compliance Agent if you want your memories back.", btn: "Face Compliance", story: "bw-horsemen-3" },
  { id: "imogen_off", title: "Forwarding Address", who: "imogen_off", goal: "Visit the Reaper's Office & Kitchen south of the Unfiled Annex.", say: "The kettle's boiled, the parcel's open, and Smart Kevin is waiting at Continuity Campus.", btn: "Have some tea", story: "bw-kevin-slides-4" },
];

export const DBW_EXTRA_RELICS = [
  { id: "dbw_gerald", s: "express_disarmament", x: 13, y: 7, name: "Gerald the Sharpened Ruler", text: "Twelve inches of clear acrylic. Confiscated twice, recovered thrice.", story: "bw-ep14" },
  { id: "dbw_brassbell3", s: "express_threesecond", x: 14, y: 4, name: "a Three-Second Brass Bell", text: "Rings if you interrupt a brass figure.", story: "bw-ep14" },
  { id: "dbw_expressmenu", s: "express_dining", x: 7, y: 6, name: "an Infernal Tasting Menu", text: "Course three: crispy onions in a separate bag.", story: "bw-ep14" },
  { id: "dbw_motelkey", s: "last_stop_motel", x: 15, y: 3, name: "Motel Key · Room Six", text: "Plastic diamond tag. Hums quietly when you hold it to the wall.", story: "bw-kevin-slides-1" },
  { id: "dbw_ramencup", s: "dots_gas_station", x: 11, y: 8, name: "Madison's Instant Ramen Cup", text: "Empty. Smells faintly of desert dusk and second chances.", story: "bw-madison-nomad" },
  { id: "dbw_wiltedplant", s: "kevin_graveyard", x: 13, y: 8, name: "Kevin's Potted Plant", text: "Slightly wilted. Still apologizes on Fridays.", story: "bw-kevin-slides-1" },
  { id: "dbw_ganttscroll", s: "quarterly_cathedral", x: 11, y: 9, name: "a Sacred Gantt Chart", text: "Q3 deliverables highlighted in fluorescent yellow.", story: "bw-kevin-slides-1" },
  { id: "dbw_kevmop", s: "hrs_intake", x: 13, y: 7, name: "Kevina's Translucent Mop", text: "Leaves the marble floor spotless and slightly existential.", story: "bw-kevin-slides-2" },
  { id: "dbw_bailiffbell", s: "dead_letter_office", x: 15, y: 8, name: "a Dented Bailiff Bell", text: "Taken by Inspector Yuki in the Corridor of Tubes.", story: "bw-kevin-slides-2" },
  { id: "dbw_hoaviolation", s: "hells_peak_culdesac", x: 12, y: 4, name: "a Laminated HOA Violation", text: "Grass measured at 2.6 inches. Fine: one casserole.", story: "bw-kevin-slides-3" },
  { id: "dbw_hydrangea", s: "hells_peak_garden", x: 9, y: 7, name: "a Polite Hydrangea", text: "Blooms exclusively on eternal Saturdays.", story: "bw-kevin-slides-3" },
  { id: "dbw_1347sched", s: "architect_lobby", x: 14, y: 4, name: "the 1347 Schedule", text: "Death's name penciled in at the top in neat ink.", story: "bw-horsemen-3" },
  { id: "dbw_junomoth", s: "seventh_floor", x: 13, y: 7, name: "a Paper Moth (Juno Pell)", text: "Warm wings folded neatly inside a server badge.", story: "bw-horsemen-3" },
  { id: "dbw_lanterndrop", s: "hell_high_water", x: 14, y: 6, name: "a Basement Song Sheet", text: "Sung softly so Compliance can't hear.", story: "bw-horsemen-4" },
  { id: "dbw_parceltag", s: "reaper_office", x: 6, y: 7, name: "Simone's Parcel Tag", text: "Addressed to Imogen Vale. Postage paid in full.", story: "bw-kevin-slides-4" },
  { id: "dbw_violetpen", s: "harrow_nursery", x: 10, y: 3, name: "a Nine-Year-Old's Violet Pen", text: "Still has ink left from the day Lux drew her first school.", story: "bw-ep01" },
];
