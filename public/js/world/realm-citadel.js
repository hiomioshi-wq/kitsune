// The Starlight Citadel: high above The High Post, guarding the northern astral currents.
const npc = (id, cast, name, x, y, story, lines, o = {}) => ({ id, cast, name, x, y, story, lines, ...o });

export const CITADEL = {
  title: "The Starlight Citadel",
  series: "kitsune",
  rpgKind: "delve",
  start: ["citadel_gate", 10, 10],
  respawn: ["citadel_gate", 10, 10],
  deathWord: "Starfalls endured",
  endStory: "",
  doneGoal: "The Astral Warden's lens is aligned. Starlight runs cleanly from the High Post to the Maelstrom Rim.",
  deathBy: npc("star_guide", "Odo", "Astronomer Odo", 0, 0),
  deathLine: (n, t) => `${t} The citadel's updraft catches you and sets you back on the threshold. That's ${n} now.`,
  intro: "You climb the frost-lit steps above The High Post into The Starlight Citadel—five suspended halls of glass, brass, and nine-tail starlight.",
  ending: "Nine mirrors turn in unison. Across the whole country, every lantern burns a shade brighter.",
  building: (g, b) => {
    const T = 32, x = b.x * T, y = b.y * T, w = b.w * T, h = b.h * T;
    g.fillStyle = "#1c2440"; g.fillRect(x, y + 10, w, h - 10);
    g.strokeStyle = "#9fe0ff"; g.lineWidth = 2.5; g.strokeRect(x, y + 10, w, h - 10);
    g.fillStyle = "#2f4a7a"; g.fillRect(x - 3, y, w + 6, 14);
    g.font = "800 11px system-ui"; g.textAlign = "center";
    g.fillStyle = "#e8f4ff"; g.fillText(b.name, x + w / 2, y + 10);
  },
  scenes: {
    citadel_gate: {
      name: "The Starlight Gate", room: 1, w: 21, h: 13, base: "frost", bg: "#040814", tint: "rgba(130,200,255,.08)",
      props: [["lampost", 4, 3], ["lampost", 16, 3], ["statue", 6, 6], ["statue", 14, 6]],
      npcs: [npc("cit_herald", null, "The Gate Herald", 10, 6, "", ["Beyond this gate lies the Bridge of Nine Tails.", "Speak to the Star-Smith in the Astral Armory before facing the Warden."], { look: { c: "#243a6a", a: "#e8f4ff", st: 5, sk: 1, h: "#cfe6ff", e: "#222", f: "robe" } })],
      doors: [{ x: 10, y: 0, to: "bridge_hall", tx: 12, ty: 10, label: "Cross the Bridge of Nine Tails" }],
    },
    bridge_hall: {
      name: "Bridge of Nine Tails", room: 1, w: 25, h: 12, base: "glass", bg: "#030610", tint: "rgba(160,210,255,.09)",
      monster: "mini", hounds: [[7, 5], [17, 5]], houndLine: "A starlight echo knocked you back to the gate.",
      props: [["lampost", 5, 2], ["lampost", 19, 2], ["lampost", 5, 9], ["lampost", 19, 9]],
      npcs: [npc("cit_keeper", "Astrid", "Watcher Astrid", 12, 5, "", ["East leads to the Astral Armory. North leads to the Star-Heart Sanctum.", "West opens onto the High Terrace."])],
      doors: [{ x: 12, y: 11, to: "citadel_gate", tx: 10, ty: 1, label: "Back to the Starlight Gate" }, { x: 24, y: 6, to: "armory_hall", tx: 1, ty: 5, label: "Enter the Astral Armory" }, { x: 0, y: 6, to: "sky_terrace", tx: 17, ty: 5, label: "Step out to the High Terrace" }, { x: 12, y: 0, to: "sanctum_core", tx: 10, ty: 11, label: "Ascend to the Star-Heart Sanctum" }],
    },
    armory_hall: {
      name: "The Astral Armory", room: 1, w: 19, h: 11, base: "stone", bg: "#090c18", tint: "rgba(255,210,120,.07)",
      props: [["rack", 4, 2], ["rack", 14, 2], ["kilnring", 9, 4], ["desk", 9, 8]],
      npcs: [npc("starsmith", "Ignis", "Star-Smith Kael", 9, 6, "", ["Forged from fallen meteor iron and High Post frost. Take this Starlight Lance—you'll need the reach."], { giveWeapon: "starlance" })],
      doors: [{ x: 0, y: 5, to: "bridge_hall", tx: 23, ty: 6, label: "Back to the Bridge" }],
    },
    sky_terrace: {
      name: "The High Terrace", room: 1, w: 19, h: 11, base: "white", bg: "#050a18", tint: "rgba(180,220,255,.1)",
      props: [["bench", 5, 3], ["bench", 13, 3], ["screen", 9, 2]],
      npcs: [npc("cit_poet", "Ren the Poet", "Starlight Chronicler", 9, 5, "", ["From up here, Hollow Pine looks like a single warm candle in the snow."])],
      doors: [{ x: 18, y: 5, to: "bridge_hall", tx: 1, ty: 6, label: "Back to the Bridge" }, { x: 0, y: 5, to: "cloud_gallery", tx: 16, ty: 4, label: "Into the Cloud Gallery" }],
    },
    cloud_gallery: {
      name: "The Cloud Gallery", room: 1, w: 18, h: 9, base: "glass", bg: "#080e20", tint: "rgba(180,220,255,.08)",
      props: [["statue", 4, 2], ["statue", 13, 2], ["bench", 9, 6]],
      npcs: [npc("cit_mirror", "Astrid", "Mirror-Keeper Pip", 9, 4, "", ["Every mirror here shows a different season in Hollow Pine."])],
      doors: [{ x: 17, y: 4, to: "sky_terrace", tx: 1, ty: 5, label: "Back to the High Terrace" }],
    },
    sanctum_core: {
      name: "The Star-Heart Sanctum", room: 1, w: 21, h: 13, base: "glass", bg: "#02040c", tint: "rgba(120,190,255,.1)",
      props: [["statue", 4, 3], ["statue", 16, 3], ["kilnring", 10, 3]],
      npcs: [npc("starwardenboss", null, "The Astral Warden", 10, 5, "", [], { art: "kilnring", verb: "Face", boss: "star_warden" })],
      doors: [{ x: 10, y: 12, to: "bridge_hall", tx: 12, ty: 1, label: "Back down to the Bridge" }, { x: 20, y: 5, to: "lens_loft", tx: 1, ty: 5, label: "Climb to the Brass Lens Loft" }],
    },
    lens_loft: {
      name: "The Brass Lens Loft", room: 1, w: 19, h: 11, base: "glass", bg: "#060a1c", tint: "rgba(200,230,255,.1)",
      props: [["kilnring", 9, 3], ["lampost", 4, 2], ["lampost", 14, 2], ["statue", 4, 8], ["statue", 14, 8]],
      npcs: [npc("cit_odo", "Odo", "Astronomer Odo", 9, 5, "", ["Last of the suspended halls, first of the starlight—when the great brass lens turns, one clean beam pours from the High Post to the Maelstrom Rim.", "The Astral Warden checks my polish twice a night. Not one smudge in a hundred years; mind your paws if you'd like to help."])],
      doors: [{ x: 0, y: 5, to: "sanctum_core", tx: 18, ty: 5, label: "Back down to the Sanctum" }],
    },
  },
  quest: [
    { id: "cit_herald", title: "Above the Post", who: "cit_herald", goal: "Speak to the Gate Herald at The Starlight Gate.", say: "Welcome to the Starlight Citadel. Cross the Bridge of Nine Tails and speak with Watcher Astrid.", btn: "Cross the bridge", story: "" },
    { id: "cit_keeper", title: "Nine Mirrors", who: "cit_keeper", goal: "Meet Watcher Astrid on the Bridge of Nine Tails.", say: "Visit Star-Smith Kael in the east Armory before you challenge the Astral Warden in the north Sanctum.", btn: "Visit the Armory", story: "" },
    { id: "starsmith", title: "Starlight Steel", who: "starsmith", goal: "Speak to Star-Smith Kael in The Astral Armory.", say: "Take this Starlight Lance. Now ascend to the Star-Heart Sanctum and test your footing against the Astral Warden.", btn: "Take the lance", story: "" },
    { id: "cit_poet", title: "Candle in the Snow", who: "cit_poet", goal: "Visit the Starlight Chronicler on The High Terrace.", say: "Nine lanterns below, nine mirrors above. Everything in Kitsune World is connected.", btn: "Look out", story: "" },
    { id: "cit_odo", title: "The Brass Lens", who: "cit_odo", goal: "Climb to the Brass Lens Loft off the Star-Heart Sanctum.", say: "Nine mirrors feed one lens, and one beam pours down the currents to every lantern below. Give the brass a wipe with the frost-cloth—starlight runs cleanest off a smudgeless turn.", btn: "Wipe the lens", story: "" },
  ],
  relics: [
    { id: "cit_key", s: "citadel_gate", x: 15, y: 9, name: "a frost-silver gate key", text: "Cold enough to frost your whiskers." },
    { id: "cit_feather", s: "bridge_hall", x: 19, y: 6, name: "a crystal crane feather", text: "Left on the glass railing by a passing messenger." },
    { id: "cit_ingot", s: "armory_hall", x: 14, y: 7, name: "a star-iron ingot", text: "Hums softly when held near a lantern." },
    { id: "cit_chart", s: "sky_terrace", x: 5, y: 7, name: "a panoramic sky map", text: "Marks all 25 regions of Kitsune World below." },
    { id: "cit_lens", s: "sanctum_core", x: 15, y: 8, name: "a ninth-mirror prism", text: "Splits starlight into nine distinct tails." },
    { id: "cit_crown", s: "cloud_gallery", x: 14, y: 6, name: "a silver cloud-wreath", text: "Light as mist, cold as high-altitude frost." },
    { id: "cit_lenscap", s: "lens_loft", x: 15, y: 6, name: "a brass lens-cap", text: "Keeps the frost off the great lens between turnings." },
  ],
};
