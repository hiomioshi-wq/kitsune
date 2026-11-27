// Expanded Blackwood University locations, quests, and relics drawn directly from the Blackwood books and spinoffs.
const npc = (id, cast, name, x, y, story, lines, o = {}) => ({ id, cast, name, x, y, story, lines, ...o });

export const BW_EXTRA_SCENES = {
  stadium: {
    name: "Blackwood Stadium · Fifty-Yard Line", room: 1, w: 24, h: 14, base: "lawn", bg: "#101812", tint: "rgba(60,180,90,.08)",
    r: [[2, 4, 20, 6, "line"], [11, 2, 2, 10, "white"]],
    props: [["bench", 4, 2], ["bench", 18, 2], ["bench", 4, 11], ["bench", 18, 11], ["lampost", 2, 2], ["lampost", 21, 2], ["lampost", 2, 11], ["lampost", 21, 11]],
    npcs: [
      npc("sugarrush_boss", null, "Captain Sugar Rush", 12, 6, "bw-ep02", [], { art: "armor", verb: "Face", boss: "sugarrush" }),
      npc("velvette_qb", "Velvette", "Velvette (Quarterback)", 8, 7, "bw-ep02", ["Lakewood's captain steals souls by touch. Keep your gloves on and aim for the ribs.", "If she tries to drink from the trophy, let it bite her."]),
      npc("coach_vance", null, "Coach Vance", 16, 4, "bw-ep02", ["Murder-football championship, fourth quarter. Nobody leaves the turf with all their organs."], { look: { c: "#3a2820", a: "#ffd27a", st: 6, sk: 2, h: "#2a2020", e: "#222", f: "coat" } }),
    ],
    doors: [
      { x: 0, y: 7, to: "stadium_locker", tx: 14, ty: 4, label: "Into the Stadium Locker Room" },
      { x: 23, y: 7, to: "stadium_tunnel", tx: 1, ty: 4, label: "Down the Stadium Tunnel" },
      { x: 12, y: 0, to: "stadium_vip", tx: 8, ty: 8, label: "Up to the VIP Box" },
    ],
  },
  stadium_locker: {
    name: "Blackwood Stadium Locker Room", room: 1, w: 16, h: 9, base: "linoG", bg: "#121618",
    props: [["cabinet", 2, 1], ["cabinet", 4, 1], ["cabinet", 11, 1], ["cabinet", 13, 1], ["bench", 5, 5], ["bench", 10, 5], ["armor", 8, 2]],
    npcs: [
      npc("halftime_trainer", null, "Halftime Trainer", 6, 4, "bw-ep02", ["Ice packs for sprains, salt circles for soul-possession. Don't mix them up."], { look: { c: "#2f4f38", a: "#e8e8e0", st: 5, sk: 3, h: "#3a2a1c", e: "#222", f: "casual" } }),
      npc("concussed_frosh", null, "Concussed Freshman", 11, 6, "bw-ep02", ["I tackled Sugar Rush's shadow and now I remember my childhood in reverse."], { look: { c: "#5a3d6e", a: "#e8dff0", st: 3, sk: 1, h: "#4a3220", e: "#222", f: "hoodie" } }),
    ],
    doors: [{ x: 15, y: 4, to: "stadium", tx: 1, ty: 7, label: "Back out to the Fifty-Yard Line" }],
  },
  stadium_vip: {
    name: "Blackwood Stadium · VIP Box", room: 1, w: 17, h: 10, base: "carpet", bg: "#1c1018", tint: "rgba(255,200,120,.08)",
    r: [[2, 7, 13, 2, "glass"]],
    props: [["sofa", 4, 2], ["sofa", 11, 2], ["table", 8, 4], ["screen", 14, 2]],
    npcs: [
      npc("dean_sterling", "Dean Ashdown", "Dean Sterling (VIP Box)", 6, 4, "bw-ep02", ["The endowment covers three ambulances and one exorcist per quarter."]),
      npc("lux_vip", "Lux", "Lux (VIP Box)", 10, 4, "bw-ep02", ["Darling, if Lakewood wins, I'm buying their stadium and turning it into a parking lot."]),
    ],
    doors: [{ x: 8, y: 9, to: "stadium", tx: 12, ty: 1, label: "Back down to the Field" }],
  },
  stadium_tunnel: {
    name: "Blackwood Stadium Tunnel", room: 1, w: 18, h: 9, base: "stone", bg: "#0c0c10",
    props: [["lampost", 3, 2], ["lampost", 14, 2], ["bench", 8, 6]],
    npcs: [npc("tunnel_guard", null, "Tunnel Security", 9, 4, "bw-ep02", ["Press room's to the east. The Abyss Bar's through the service door south—tip all four hands."], { look: { c: "#2f3a4c", a: "#e8e8e8", st: 6, sk: 2, h: "#1c1818", e: "#222", f: "uniform" } })],
    doors: [
      { x: 0, y: 4, to: "stadium", tx: 22, ty: 7, label: "Back to the Fifty-Yard Line" },
      { x: 17, y: 4, to: "press_room", tx: 1, ty: 4, label: "Into the Postgame Press Room" },
      { x: 9, y: 8, to: "abyss_bar", tx: 9, ty: 1, label: "Through the Service Door to The Abyss" },
    ],
  },
  press_room: {
    name: "Postgame Press Room", room: 1, w: 16, h: 9, base: "carpet", bg: "#14121a",
    props: [["desk", 7, 2], ["screen", 3, 1], ["screen", 12, 1], ["seat", 4, 6], ["seat", 8, 6], ["seat", 12, 6]],
    npcs: [npc("postgame_rep", null, "Postgame Reporter", 8, 4, "bw-ep02", ["Headline: BLACKWOOD TROPHY BITES OPPOSING CAPTAIN, REFUSES TO APOLOGIZE.", "No comment from the Dean, though the vending machine issued a statement."], { look: { c: "#4a4452", a: "#e8dcc0", st: 4, sk: 2, h: "#3a2820", e: "#222", f: "smart" } })],
    doors: [{ x: 0, y: 4, to: "stadium_tunnel", tx: 16, ty: 4, label: "Back to the Stadium Tunnel" }],
  },
  abyss_bar: {
    name: "The Abyss Bar", room: 1, w: 19, h: 11, base: "flesh", bg: "#090408", tint: "rgba(180,30,70,.12)",
    props: [["desk", 4, 2], ["desk", 5, 2], ["desk", 6, 2], ["screen", 14, 2], ["sofa", 14, 6], ["sofa", 4, 7], ["table", 9, 6]],
    npcs: [
      npc("fourarm_bartender", null, "The Four-Armed Bartender", 5, 3, "bw-ep02", ["NO SUMMONING. NO EXORCISMS. NO SOUL CONTRACTS WITHOUT CONSENT. TIP ALL FOUR HANDS.", "The jukebox only plays songs that have started at least two wars."], { look: { c: "#3a1420", a: "#ff9a3a", st: 7, sk: 5, h: "#111", e: "#ff4858", f: "apron" } }),
      npc("velvette_bar", "Velvette", "Velvette (At the Bar)", 13, 7, "bw-ep02", ["I take cash, crypto, or favors that would embarrass a bishop. Mostly bourbon tonight."]),
      npc("offduty_god", null, "Off-Duty Minor God", 9, 7, "bw-ep02", ["I've been arguing over this six-century bar tab since the Ming dynasty. Don't touch my olives."], { look: { c: "#3a2f18", a: "#ffd84d", st: 6, sk: 1, h: "#c8c8d0", e: "#7fd0ff", f: "robe" } }),
    ],
    doors: [{ x: 9, y: 0, to: "stadium_tunnel", tx: 9, ty: 7, label: "Back up to the Stadium Tunnel" }],
  },
  bw_coffee: {
    name: "Blackwood Coffee · The Counter", room: 1, w: 17, h: 10, base: "wood", bg: "#1c1410", tint: "rgba(255,190,120,.08)",
    props: [["desk", 3, 2], ["desk", 4, 2], ["stove", 6, 2], ["shelf", 13, 1], ["table", 5, 6], ["table", 11, 6]],
    npcs: [
      npc("imani_barista", "Imani", "Imani (Counter Shift)", 4, 3, "bw-ep10", ["One leaf in the foam. Don't ask for oat milk after midnight, the carton starts humming."]),
      npc("saffron_coffee", "Saffron", "Saffron (Sampling)", 11, 7, "bw-ep05", ["I'm only here for the cardamom syrup, sweet pea. Don't look at the back alley."]),
    ],
    doors: [{ x: 16, y: 5, to: "bw_coffee_alley", tx: 1, ty: 4, label: "Out the Backroom to the Alley" }],
  },
  bw_coffee_alley: {
    name: "Blackwood Coffee · Back Alley", room: 1, w: 16, h: 9, base: "stone", bg: "#141418", tint: "rgba(210,190,150,.08)",
    props: [["cabinet", 3, 2], ["lampost", 12, 2], ["bench", 8, 6]],
    npcs: [npc("alley_void_seam", null, "Peeling Beige Seam", 12, 5, "bw-kevin-slides-1", ["Behind the espresso grounds bin, the brick wall peels back like beige wallpaper. Kevin fell through here on Monday."], { art: "book", verb: "Inspect" })],
    doors: [{ x: 0, y: 4, to: "bw_coffee", tx: 15, ty: 5, label: "Back into Blackwood Coffee" }],
  },
  room_217: {
    name: "East Dorm · Room 217", room: 1, w: 15, h: 9, base: "wood", bg: "#120c16", tint: "rgba(180,80,140,.08)",
    props: [["mattress", 3, 2], ["desk", 11, 2], ["shelf", 7, 1], ["lampost", 12, 6]],
    npcs: [
      npc("madison_217", "Madison", "Freshman Madison (3:00 A.M.)", 7, 5, "bw-ep01", ["Nobody knocks at three in the morning unless they brought frosting.", "The closet door only opens from the inside on Tuesdays."]),
    ],
    doors: [{ x: 0, y: 4, to: "dorms", tx: 16, ty: 3, label: "Back to Hall of Residence" }],
  },
  west_kitchen: {
    name: "West Dorm Communal Kitchen", room: 1, w: 16, h: 9, base: "lino", bg: "#181614",
    props: [["stove", 3, 2], ["stove", 5, 2], ["fridge", 12, 2], ["table", 8, 5]],
    npcs: [npc("saffron_dorm", "Saffron", "Saffron (Dorm Kitchen)", 8, 3, "bw-ep05", ["If the aubergine napkins catch fire again, blame the sophomore with the toaster."])],
    doors: [{ x: 15, y: 4, to: "dorms", tx: 1, ty: 3, label: "Back to Hall of Residence" }],
  },
  hawthorne_402: {
    name: "Hawthorne Hall · Room 402", room: 1, w: 15, h: 9, base: "wood", bg: "#161220",
    props: [["typewriter", 7, 2], ["shelf", 3, 1], ["shelf", 11, 1], ["mattress", 3, 6], ["sofa", 11, 6]],
    npcs: [npc("becca_402", null, "Becca Quill (Drafting)", 7, 4, "bw-ep03", ["I wrote a chapter where the Quad was shaped like an octagon and now half the sidewalks are diagonal.", "Please don't touch the Ribbon key."], { look: { c: "#7a5a9a", a: "#efe0ff", st: 4, sk: 1, h: "#7a3f22", e: "#2a4a6a", f: "hoodie" } })],
    doors: [{ x: 7, y: 8, to: "dorms", tx: 9, ty: 1, label: "Down to Hall of Residence" }],
  },
  med_center: {
    name: "Blackwood Medical Center", room: 1, w: 18, h: 10, base: "white", bg: "#d8e4e8", tint: "rgba(90,170,200,.08)",
    props: [["tank", 3, 2], ["tank", 14, 2], ["cabinet", 7, 1], ["cabinet", 10, 1], ["mattress", 4, 6], ["mattress", 13, 6]],
    npcs: [
      npc("marlowe_night", null, "Nurse Marlowe (Night Shift)", 9, 4, "bw-ep02", ["Three soul reattachments before midnight and two students who swallowed their own lanyards.", "Take a saltine and sit down."], { look: { c: "#f4f2ec", a: "#3a7a6a", st: 5, sk: 3, h: "#4a2a20", e: "#222", f: "apron" } }),
      npc("linebacker_med", null, "Reattached Linebacker", 5, 7, "bw-ep02", ["My soul's back in, mostly. Left knee still hums whenever Lakewood scores."], { look: { c: "#3f6f94", a: "#fff", st: 6, sk: 2, h: "#2a2020", e: "#222", f: "casual" } }),
    ],
    doors: [{ x: 0, y: 5, to: "counseling", tx: 14, ty: 4, label: "Back to Student Wellness" }],
  },
  digital_office: {
    name: "Humanities · Digital Engagement Office", room: 1, w: 16, h: 9, base: "office", bg: "#181a20",
    props: [["screen", 3, 2], ["screen", 7, 2], ["screen", 11, 2], ["printer", 13, 6], ["desk", 4, 6]],
    npcs: [npc("digital_intern", null, "Acting Engagement Intern", 8, 4, "bw-ep07", ["Do NOT click Reply All. The last person who clicked Reply All accidentally enrolled forty-two ducks.", "The Chandelier's old desk is still warm."], { look: { c: "#4a5a7a", a: "#d8e4f0", st: 3, sk: 1, h: "#3a2a1c", e: "#222", f: "smart" } })],
    doors: [{ x: 0, y: 4, to: "newspaper", tx: 15, ty: 4, label: "Back to The Blackwood Gazette" }],
  },
  admin_boardroom: {
    name: "Administration · Boardroom", room: 1, w: 18, h: 10, base: "carpet", bg: "#1a141c",
    props: [["table", 6, 4], ["table", 8, 4], ["table", 10, 4], ["chair144", 12, 4], ["board", 4, 1], ["board", 13, 1]],
    npcs: [
      npc("holloway_board", "Holloway", "Augustine Holloway (QAA)", 9, 3, "bw-ep09", ["Thirty-one years with the Quality Assurance Agency. Show me the fire exits and the soup."]),
      npc("accred_clerk", null, "Accreditation Clerk", 5, 6, "bw-ep09", ["We lost half a star for the hungry stairwell, but gained a full star for ample parking."], { look: { c: "#3a3844", a: "#e8dcc0", st: 5, sk: 2, h: "#8a867c", e: "#222", f: "smart" } }),
    ],
    doors: [
      { x: 0, y: 5, to: "admin", tx: 16, ty: 5, label: "Back to Administration" },
      { x: 17, y: 5, to: "sasha_office", tx: 1, ty: 4, label: "Sasha Vale's Office (2:16 A.M.)" },
      { x: 9, y: 9, to: "financial_annex", tx: 8, ty: 1, label: "Down to the Financial Annex" },
    ],
  },
  sasha_office: {
    name: "Sasha Vale's Office · 2:16 A.M.", room: 1, w: 16, h: 9, base: "wood", bg: "#100c14", tint: "rgba(255,210,140,.07)",
    props: [["desk", 8, 3], ["cabinet", 2, 1], ["cabinet", 4, 1], ["cabinet", 12, 1], ["book", 8, 4], ["lampost", 13, 6]],
    npcs: [npc("sasha_216", "Sasha", "Sasha Vale (2:16 A.M.)", 8, 5, "bw-sasha", ["I'm drafting Lux and Velvette's marriage contract, billing by the clause, and ignoring an offer from the enemy.", "Do not touch the Second Schedule folder."])],
    doors: [{ x: 0, y: 4, to: "admin_boardroom", tx: 16, ty: 5, label: "Back to the Boardroom" }],
  },
  financial_annex: {
    name: "Blackwood Financial Annex", room: 1, w: 17, h: 9, base: "office", bg: "#141618",
    props: [["cabinet", 3, 2], ["cabinet", 13, 2], ["printer", 8, 2], ["desk", 5, 5], ["desk", 11, 5]],
    npcs: [npc("bursar_thorne", null, "Bursar Thorne", 8, 5, "bw-ep18", ["Your best years are non-refundable. Dying during midterms counts as an excused absence, not a tuition waiver."], { look: { c: "#2e2c36", a: "#e4e0d8", st: 6, sk: 2, h: "#8a8a8e", e: "#222", f: "smart" } })],
    doors: [{ x: 8, y: 0, to: "admin_boardroom", tx: 9, ty: 8, label: "Back up to the Boardroom" }],
  },
  seminar_9: {
    name: "Seminar Room 9 · Oral Examination", room: 1, w: 16, h: 9, base: "wood", bg: "#141018",
    props: [["board", 7, 1], ["board", 8, 1], ["table", 8, 4], ["seat", 4, 6], ["seat", 8, 6], ["seat", 12, 6]],
    npcs: [npc("oral_examiner", null, "Examiner Vance", 8, 3, "bw-ep17", ["Answer in pen, speak clearly, and do not contradict the chalkboard—it has tenure."], { look: { c: "#3a3444", a: "#d8d0c0", st: 6, sk: 1, h: "#8a867c", e: "#222", f: "smart" } })],
    doors: [{ x: 0, y: 4, to: "examhall", tx: 16, ty: 3, label: "Back to Exam Hall 2B" }],
  },
  fire_practical: {
    name: "Fire Safety Practical Room · 9:00 A.M.", room: 1, w: 17, h: 9, base: "kiln", bg: "#180808", tint: "rgba(255,100,40,.12)",
    props: [["fire", 4, 2], ["fire", 12, 2], ["kilnring", 8, 4], ["tank", 3, 6], ["tank", 13, 6]],
    npcs: [
      npc("violet_practical", "Violet", "Violet Cinder (Demonstrating)", 6, 5, "bw-ep12", ["Nine o'clock: fire safety briefing. Nine oh-one: the extinguisher caught fire. Consequences are audience participation."]),
      npc("panicked_ta", null, "Panicked TA", 11, 5, "bw-ep12", ["The syllabus said 'controlled burn'—it did not specify the ceiling!"], { look: { c: "#4a3828", a: "#ffd27a", st: 3, sk: 2, h: "#2a2020", e: "#222", f: "casual" } }),
    ],
    doors: [{ x: 0, y: 4, to: "kiln", tx: 16, ty: 3, label: "Back to South Kiln Hall" }],
  },
  diamond_bunny: {
    name: "Diamond Bunny Studios · Main Set", room: 1, w: 19, h: 10, base: "carpet", bg: "#240a1a", tint: "rgba(255,110,170,.12)",
    props: [["screen", 4, 1], ["screen", 14, 1], ["lampost", 6, 2], ["lampost", 12, 2], ["sofa", 9, 6]],
    npcs: [
      npc("hero_set", "Hero", "Captain Hero (Live Set)", 9, 4, "bw-ep16", ["Welcome to Diamond Bunny Studios! Don't look at the comment section, it's all one-star reviews!"]),
      npc("rating_algo", null, "The Rating Feed", 14, 5, "bw-ep16", ["ONE STAR. TOO MANY GARGOYLES. WOULD NOT BE DEVOURED AGAIN."], { art: "screen", verb: "Check" }),
    ],
    doors: [
      { x: 0, y: 5, to: "livestream", tx: 15, ty: 4, label: "Back to the Filming Deck" },
      { x: 18, y: 5, to: "diamond_greenroom", tx: 1, ty: 4, label: "Into the Green Room" },
    ],
  },
  diamond_greenroom: {
    name: "Diamond Bunny Studios · Green Room", room: 1, w: 15, h: 9, base: "carpet", bg: "#1e0c18",
    props: [["sofa", 3, 2], ["sofa", 11, 2], ["fridge", 13, 6], ["table", 7, 5]],
    npcs: [npc("stagehand_4", null, "Stagehand #4", 7, 3, "bw-horsemen-5", ["We keep extra ring lights and a fire axe behind the couch, just in case the Horsemen show up for sweeps week."], { look: { c: "#2a2430", a: "#ff9aa2", st: 4, sk: 2, h: "#1c1818", e: "#222", f: "casual" } })],
    doors: [{ x: 0, y: 4, to: "diamond_bunny", tx: 17, ty: 5, label: "Back to Main Set" }],
  },
  lux_conservatory: {
    name: "Lux's Conservatory", room: 1, w: 18, h: 10, base: "lawn", bg: "#101c18", tint: "rgba(120,230,170,.08)",
    r: [[2, 2, 14, 6, "glass"]],
    props: [["plant", 4, 2], ["plant", 13, 2], ["tree", 5, 7], ["tree", 12, 7], ["bench", 9, 4]],
    npcs: [
      npc("lux_orchids", "Lux", "Lux (Conservatory)", 7, 5, "bw-lux-velvette", ["Every orchid in here cost a semester of someone else's tuition. Tell Velvette dinner is at eight."]),
      npc("gerald_ruler", null, "Gerald (Sharpened Ruler)", 11, 5, "bw-lux-velvette", ["Twelve inches of clear acrylic, filed to a scalpel edge. Velvette's favorite."], { art: "book", verb: "Inspect" }),
    ],
    doors: [{ x: 0, y: 5, to: "penthouse", tx: 15, ty: 5, label: "Back to the Penthouse" }],
  },
  seraphim: {
    name: "Seraphim Boutique · Luxury District", room: 1, w: 16, h: 9, base: "white", bg: "#1e1820", tint: "rgba(255,190,220,.08)",
    props: [["rack", 3, 2], ["rack", 6, 2], ["rack", 12, 2], ["sofa", 4, 6], ["sofa", 11, 6]],
    npcs: [npc("boutique_clerk", null, "Seraphim Clerk", 9, 4, "bw-ep01", ["We carry silk, Kevlar-lined velvet, and emergency formalwear for unexpected coronations."], { look: { c: "#f2a8c0", a: "#fff", st: 4, sk: 1, h: "#2a2020", e: "#222", f: "smart" } })],
    doors: [
      { x: 0, y: 4, to: "penthouse", tx: 15, ty: 2, label: "Back to the Penthouse" },
      { x: 15, y: 4, to: "le_corbeau", tx: 1, ty: 4, label: "Walk to Le Corbeau" },
    ],
  },
  le_corbeau: {
    name: "Le Corbeau · South Quad", room: 1, w: 17, h: 9, base: "wood", bg: "#141016",
    props: [["table", 4, 3], ["table", 12, 3], ["table", 4, 6], ["stove", 14, 6], ["lampost", 8, 2]],
    npcs: [npc("sommelier_9", null, "Nine-Course Sommelier", 9, 4, "bw-lux-velvette", ["Course four is a vintage 1642 red. Course seven is mild poison, per Lux and Velvette's anniversary tradition."], { look: { c: "#1c1820", a: "#ffd27a", st: 5, sk: 1, h: "#111", e: "#222", f: "smart" } })],
    doors: [{ x: 0, y: 4, to: "seraphim", tx: 14, ty: 4, label: "Back to Seraphim Boutique" }],
  },
  platform_null: {
    name: "Blackwood Platform Null", room: 1, w: 20, h: 10, base: "glass", bg: "#080a10", tint: "rgba(150,180,220,.09)",
    r: [[1, 4, 18, 2, "line"]],
    props: [["lampost", 3, 2], ["lampost", 16, 2], ["bench", 6, 7], ["bench", 13, 7]],
    npcs: [npc("platform_porter", null, "Platform Null Porter", 10, 3, "bw-ep14", ["This platform isn't on the campus map. The Retrospect Express only stops for people who forgot to finish their third act."], { look: { c: "#28344a", a: "#ffd27a", st: 6, sk: 2, h: "#8a867c", e: "#222", f: "uniform" } })],
    doors: [{ x: 0, y: 5, to: "outside", tx: 4, ty: 14, label: "Back out to The Outside" }],
  },
};

export const BW_RELICS = [
  { id: "bw_lanyard", s: "campus", x: 26, y: 27, name: "Kevin's Spare Lanyard", text: "Stamped EMPLOYEE 0041-K. Smells faintly of printer toner and apologies.", story: "bw-ep01" },
  { id: "bw_cupcake", s: "hall", x: 10, y: 8, name: "a Pink Frosting Cupcake", text: "Bestie! Probably safe if you already had lunch.", story: "bw-oneshot" },
  { id: "bw_tooth", s: "stairs", x: 14, y: 4, name: "a 1952 Canoe Oar", text: "Chewed slightly at the blade by the third step.", story: "bw-ep09" },
  { id: "bw_trophy", s: "stadium", x: 12, y: 9, name: "the Biting Championship Trophy", text: "Still has a toothmark from Sugar Rush's postgame interview.", story: "bw-ep02" },
  { id: "bw_coasters", s: "abyss_bar", x: 9, y: 4, name: "an Abyss Bar Coaster", text: "Printed on demon hide: TIP ALL FOUR HANDS.", story: "bw-ep02" },
  { id: "bw_cardboard", s: "bw_coffee_alley", x: 9, y: 5, name: "a Beige Wallpaper Scrap", text: "Peeled off the alley brick. Behind it, nothing at all.", story: "bw-kevin-slides-1" },
  { id: "bw_quill", s: "hawthorne_402", x: 12, y: 4, name: "Becca's Misspelled Map", text: "Blackwood Quad drawn as a hexagon with two oceans.", story: "bw-ep03" },
  { id: "bw_replyall", s: "digital_office", x: 9, y: 6, name: "a Printed Reply-All Thread", text: "Four thousand messages, all reading 'Please remove me from this list.'", story: "bw-ep07" },
  { id: "bw_soupgrade", s: "admin_boardroom", x: 14, y: 7, name: "Holloway's Soup Rubric", text: "Grade: B+. Ample parking.", story: "bw-ep09" },
  { id: "bw_contract", s: "sasha_office", x: 12, y: 6, name: "the Second Schedule Footnote", text: "Footnote 31, highlighted in yellow and billed at six hundred an hour.", story: "bw-sasha" },
  { id: "bw_receipt", s: "financial_annex", x: 8, y: 7, name: "a Non-Refundable Receipt", text: "TUITION PAID IN FULL. NO REFUNDS FOR POSSESSION OR DEATH.", story: "bw-ep18" },
  { id: "bw_extinguisher", s: "fire_practical", x: 8, y: 7, name: "a Scorched Fire Extinguisher", text: "Inspected 9:00 A.M. Caught fire 9:01 A.M.", story: "bw-ep12" },
  { id: "bw_onestar", s: "diamond_bunny", x: 9, y: 8, name: "a Teacup-Sized Ring Light", text: "Poppy dropped it after getting one star on campus.", story: "bw-ep16" },
  { id: "bw_orchid", s: "lux_conservatory", x: 9, y: 7, name: "a Blackwood Orchid", text: "Watered with endowment interest.", story: "bw-lux-velvette" },
  { id: "bw_saltine", s: "med_center", x: 9, y: 7, name: "Nurse Marlowe's Saltine Tin", text: "Cures mild possession, concussions, and Tuesday.", story: "bw-ep02" },
  { id: "bw_platformpass", s: "platform_null", x: 15, y: 7, name: "a Platform Null Boarding Stub", text: "Destination: THE THIRD ACT.", story: "bw-ep14" },
];
