// The Emerald Root-Vault: a 5-chamber emerald palace vault beneath The Land of Oz.
const npc = (id, cast, name, x, y, story, lines, o = {}) => ({ id, cast, name, x, y, story, lines, ...o });

export const OZVAULT = {
  title: "The Emerald Root-Vault",
  series: "kitsune",
  rpgKind: "delve",
  start: ["oz_steps", 9, 10],
  respawn: ["oz_steps", 9, 10],
  deathWord: "Sparks dimmed",
  endStory: "",
  doneGoal: "The Green Heart hums cleanly beneath the Emerald Palace. Every glass pane in Oz shines.",
  deathBy: npc("oz_glindad", "Glinda", "Glinda", 0, 0),
  deathLine: (n, t) => `${t} Glinda lifts you out of the emerald mist with one hand. That's ${n} dimmed sparks.`,
  intro: "Beneath the Emerald Palace, five chambers of cut green glass, patchwork silk, and living crystal guard the root of Oz's light.",
  ending: "The Emerald Automaton kneels on the green tile, and the Great Book opens to a clean new page.",
  building: (g, b) => {
    const T = 32, x = b.x * T, y = b.y * T, w = b.w * T, h = b.h * T;
    g.fillStyle = "#123828"; g.fillRect(x, y + 10, w, h - 10);
    g.strokeStyle = "#35d68a"; g.lineWidth = 2.5; g.strokeRect(x, y + 10, w, h - 10);
    g.fillStyle = "#1f5a3e"; g.fillRect(x - 3, y, w + 6, 14);
    g.font = "800 11px system-ui"; g.textAlign = "center";
    g.fillStyle = "#d8fff0"; g.fillText(b.name, x + w / 2, y + 10);
  },
  scenes: {
    oz_steps: {
      name: "The Emerald Steps", room: 1, w: 19, h: 12, base: "glass", bg: "#06140e", tint: "rgba(53,214,138,.09)",
      props: [["lampost", 4, 2], ["lampost", 14, 2], ["statue", 5, 8], ["statue", 13, 8]],
      npcs: [npc("glinda_env", "Glinda", "Glinda's Envoy", 9, 5, "", ["Every lantern in Oz draws its green from this vault.", "Visit Bungle in the west conservatory or Scraps in the east loft."])],
      doors: [{ x: 9, y: 0, to: "emerald_armory", tx: 9, ty: 9, label: "North to the Oz Armory" }, { x: 0, y: 6, to: "prism_conservatory", tx: 17, ty: 5, label: "West to the Glass Conservatory" }, { x: 18, y: 6, to: "patchwork_loft", tx: 1, ty: 5, label: "East to the Patchwork Loft" }],
    },
    prism_conservatory: {
      name: "The Glass Conservatory", room: 1, w: 19, h: 11, base: "glass", bg: "#081a14", tint: "rgba(120,255,200,.08)",
      props: [["plant", 4, 2], ["plant", 14, 2], ["bench", 9, 8]],
      npcs: [npc("bungle_env", "Bungle", "Bungle (Polishing)", 9, 5, "", ["Observe the reflection! Not a single smudge on these emerald panes."])],
      doors: [{ x: 18, y: 5, to: "oz_steps", tx: 1, ty: 6, label: "Back to the Emerald Steps" }],
    },
    patchwork_loft: {
      name: "The Patchwork Loft", room: 1, w: 19, h: 11, base: "carpet", bg: "#14101c", tint: "rgba(255,140,190,.07)",
      props: [["sofa", 4, 2], ["sofa", 14, 2], ["table", 9, 3]],
      npcs: [npc("scraps_env", "Scraps", "Scraps", 9, 5, "", ["I stitched three curtains down here! Go north to the Oz Armory and grab something shiny!"])],
      doors: [{ x: 0, y: 5, to: "oz_steps", tx: 17, ty: 6, label: "Back to the Emerald Steps" }],
    },
    emerald_armory: {
      name: "The Oz Armory", room: 1, w: 19, h: 11, base: "stone", bg: "#091810", tint: "rgba(53,214,138,.08)",
      monster: "mini", hounds: [[5, 5], [13, 5]], houndLine: "A green glass sentinel knocked your lantern sideways.",
      props: [["rack", 4, 2], ["rack", 14, 2], ["kilnring", 9, 3]],
      npcs: [npc("oz_smith", "Ignis", "The Tin Smith", 9, 6, "", ["Polished to a mirror edge. Take this Emerald Greatsword—the Automaton in the Green Heart respects weight."], { giveWeapon: "emeraldsword" })],
      doors: [{ x: 9, y: 10, to: "oz_steps", tx: 9, ty: 1, label: "Back to the Emerald Steps" }, { x: 9, y: 0, to: "green_heart", tx: 10, ty: 10, label: "Enter the Green Heart" }],
    },
    green_heart: {
      name: "The Green Heart", room: 1, w: 21, h: 12, base: "glass", bg: "#04100a", tint: "rgba(53,214,138,.12)",
      props: [["statue", 4, 2], ["statue", 16, 2], ["kilnring", 10, 3]],
      npcs: [npc("oz_boss", null, "The Emerald Automaton", 10, 5, "", [], { art: "kilnring", verb: "Face", boss: "oz_warden" })],
      doors: [{ x: 10, y: 11, to: "emerald_armory", tx: 9, ty: 1, label: "Back to the Oz Armory" }, { x: 20, y: 6, to: "poppy_garden", tx: 1, ty: 4, label: "Into the Poppy Conservatory" }],
    },
    poppy_garden: {
      name: "The Poppy Conservatory", room: 1, w: 18, h: 9, base: "lawn", bg: "#101e14", tint: "rgba(255,100,120,.08)",
      props: [["plant", 4, 2], ["plant", 13, 2], ["bench", 9, 6]],
      npcs: [npc("oz_gardener", "Glinda", "Ozma's Gardener", 9, 4, "", ["Glass poppies bloom all winter down here without putting anyone to sleep."])],
      doors: [{ x: 0, y: 4, to: "green_heart", tx: 19, ty: 6, label: "Back to the Green Heart" }],
    },
  },
  quest: [
    { id: "glinda_env", title: "Beneath the Palace", who: "glinda_env", goal: "Speak to Glinda's Envoy on The Emerald Steps.", say: "Check on Bungle in the Glass Conservatory west before heading north.", btn: "Go west", story: "" },
    { id: "bungle_env", title: "Cut Emerald", who: "bungle_env", goal: "Visit Bungle in The Glass Conservatory.", say: "Every pane is spotless! Go say hello to Scraps in the east loft.", btn: "Go east", story: "" },
    { id: "scraps_env", title: "Quilted Silk", who: "scraps_env", goal: "Visit Scraps in The Patchwork Loft.", say: "Head north from the steps to the Oz Armory—the Tin Smith forged something for you!", btn: "Head north", story: "" },
    { id: "oz_smith", title: "Emerald Edge", who: "oz_smith", goal: "Speak to the Tin Smith in The Oz Armory.", say: "Take this Emerald Greatsword and step north into the Green Heart.", btn: "Take greatsword", story: "" },
  ],
  relics: [
    { id: "oz_key", s: "oz_steps", x: 14, y: 7, name: "an emerald skeleton key", text: "Cut from a single green quartz crystal." },
    { id: "oz_glass", s: "prism_conservatory", x: 5, y: 7, name: "a pair of green spectacles", text: "Makes everything look twice as grand." },
    { id: "oz_patch", s: "patchwork_loft", x: 14, y: 7, name: "a swatch of plaid silk", text: "Scraps was saving this for a rainy day." },
    { id: "oz_oilcan", s: "emerald_armory", x: 14, y: 7, name: "a silver oil-can", text: "Still half full of clock-grade oil." },
    { id: "oz_heart", s: "green_heart", x: 15, y: 8, name: "a shard of the Green Heart", text: "Warm and bright as a summer leaf." },
    { id: "oz_poppy", s: "poppy_garden", x: 14, y: 6, name: "a blown-glass poppy", text: "Crimson petals that never wilt." },
  ],
};
