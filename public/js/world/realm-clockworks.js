// The Hollow Clockworks: a 5-chamber mechanical realm beneath Brask's Great Clock.
const npc = (id, cast, name, x, y, story, lines, o = {}) => ({ id, cast, name, x, y, story, lines, ...o });

export const CLOCKWORKS = {
  title: "The Hollow Clockworks",
  series: "kitsune",
  rpgKind: "delve",
  start: ["pendulum_hall", 9, 10],
  respawn: ["pendulum_hall", 9, 10],
  deathWord: "Seconds lost",
  endStory: "",
  doneGoal: "The Grand Pendulum swings in true time again. Brask's Great Clock hasn't missed a beat.",
  deathBy: npc("cw_tibb", "Tibb", "Clockmaker Tibb", 0, 0),
  deathLine: (n, t) => `${t} Tibb resets the escapement and pulls you back to the Pendulum Hall. That's ${n} lost seconds.`,
  intro: "Behind the brass face of Brask's Great Clock, five vast chambers of interlocking gears, chimes, and copper pendulums turn in the dark.",
  ending: "The Grand Horologist steps aside as the escapement clicks cleanly into noon. Every bell in Brask answers at once.",
  building: (g, b) => {
    const T = 32, x = b.x * T, y = b.y * T, w = b.w * T, h = b.h * T;
    g.fillStyle = "#241d18"; g.fillRect(x, y + 10, w, h - 10);
    g.strokeStyle = "#c79a2e"; g.lineWidth = 2.5; g.strokeRect(x, y + 10, w, h - 10);
    g.fillStyle = "#5a4220"; g.fillRect(x - 3, y, w + 6, 14);
    g.font = "800 11px system-ui"; g.textAlign = "center";
    g.fillStyle = "#fff1c8"; g.fillText(b.name, x + w / 2, y + 10);
  },
  scenes: {
    pendulum_hall: {
      name: "The Pendulum Hall", room: 1, w: 19, h: 12, base: "stone", bg: "#0d0b08", tint: "rgba(210,160,70,.08)",
      props: [["lampost", 4, 2], ["lampost", 14, 2], ["bench", 4, 9], ["bench", 14, 9]],
      npcs: [npc("cw_tibb", "Tibb", "Apprentice Tibb", 9, 5, "", ["Every gear in Brask turns from this hall, three seconds behind the rest of the world.", "Visit the Gear Gallery west, or climb to the Chime Tower east."])],
      doors: [{ x: 9, y: 0, to: "escapement_vault", tx: 9, ty: 9, label: "North to the Escapement Vault" }, { x: 0, y: 6, to: "gear_gallery", tx: 17, ty: 5, label: "West to the Gear Gallery" }, { x: 18, y: 6, to: "chime_tower", tx: 1, ty: 5, label: "East to the Chime Tower" }],
    },
    gear_gallery: {
      name: "The Gear Gallery", room: 1, w: 19, h: 11, base: "wood", bg: "#0f0c08", tint: "rgba(255,190,80,.07)",
      monster: "mini", hounds: [[6, 5], [12, 5]], houndLine: "A wind-up sentinel clipped your heels between two brass teeth.",
      props: [["rack", 4, 2], ["rack", 14, 2], ["kilnring", 9, 3]],
      npcs: [npc("cw_smith", "Ignis", "Brass-Smith", 9, 6, "", ["We temper clock-springs until they sing. Take this Clockwork Rapier—fastest blade in the gears."], { giveWeapon: "rapier" })],
      doors: [{ x: 18, y: 5, to: "pendulum_hall", tx: 1, ty: 6, label: "Back to the Pendulum Hall" }],
    },
    chime_tower: {
      name: "The Chime Tower", room: 1, w: 19, h: 11, base: "stone", bg: "#0a0c12", tint: "rgba(150,200,255,.07)",
      props: [["statue", 4, 2], ["statue", 14, 2], ["lampost", 9, 2], ["bench", 9, 8]],
      npcs: [npc("cw_ringer", "Wren", "Chime-Tuner Wren", 9, 5, "", ["If the noon bell rings flat, every lantern in Brask flickers.", "Head north from the Pendulum Hall to reach the Escapement Vault."])],
      doors: [{ x: 0, y: 5, to: "pendulum_hall", tx: 17, ty: 6, label: "Back to the Pendulum Hall" }, { x: 18, y: 5, to: "belfry_loft", tx: 1, ty: 4, label: "Climb to the Grand Belfry Loft" }],
    },
    belfry_loft: {
      name: "The Grand Belfry Loft", room: 1, w: 18, h: 9, base: "stone", bg: "#0e1018", tint: "rgba(255,210,120,.08)",
      props: [["kilnring", 9, 4], ["lampost", 4, 2], ["lampost", 13, 2]],
      npcs: [npc("cw_caster", "Wren", "Bell-Caster", 9, 6, "", ["Cast in 1892 from melted pocketwatches and river brass."])],
      doors: [{ x: 0, y: 4, to: "chime_tower", tx: 17, ty: 5, label: "Back to the Chime Tower" }],
    },
    escapement_vault: {
      name: "The Escapement Vault", room: 1, w: 19, h: 11, base: "stone", bg: "#0b090c", tint: "rgba(210,170,80,.08)",
      props: [["desk", 9, 3], ["screen", 4, 2], ["screen", 14, 2]],
      npcs: [npc("cw_keeper", "Vesper", "Time-Ledger Clerk", 9, 5, "", ["Every lost second in Hollow Pine is logged in these copper books.", "The Grand Horologist awaits through the north arch."])],
      doors: [{ x: 9, y: 10, to: "pendulum_hall", tx: 9, ty: 1, label: "Back to the Pendulum Hall" }, { x: 9, y: 0, to: "chronos_heart", tx: 10, ty: 10, label: "Enter the Chronos Heart" }],
    },
    chronos_heart: {
      name: "The Chronos Heart", room: 1, w: 21, h: 12, base: "carpet", bg: "#08060a", tint: "rgba(255,210,90,.09)",
      props: [["kilnring", 10, 3], ["lampost", 4, 2], ["lampost", 16, 2]],
      npcs: [npc("cw_boss", null, "The Grand Horologist", 10, 5, "", [], { art: "kilnring", verb: "Face", boss: "horologist" })],
      doors: [{ x: 10, y: 11, to: "escapement_vault", tx: 9, ty: 1, label: "Back to the Escapement Vault" }, { x: 20, y: 5, to: "lost_seconds", tx: 1, ty: 5, label: "Into the Lost Seconds Chamber" }],
    },
    lost_seconds: {
      name: "The Lost Seconds Chamber", room: 1, w: 19, h: 11, base: "stone", bg: "#0b0a0e", tint: "rgba(255,220,120,.08)",
      props: [["kilnring", 9, 3], ["screen", 4, 2], ["screen", 14, 2], ["lampost", 9, 2], ["bench", 4, 8], ["bench", 14, 8]],
      npcs: [npc("cw_seconds", "Tibb", "Second-Keeper Tibb", 9, 6, "", ["The three lost seconds tick in that brass jar, where nobody can spend them. The Horologist checks the seal every noon.", "Every clock in Brask runs behind because these three won't move. They like it in here."])],
      doors: [{ x: 0, y: 5, to: "chronos_heart", tx: 18, ty: 5, label: "Back to the Chronos Heart" }],
    },
  },
  quest: [
    { id: "cw_tibb", title: "Three Seconds Slow", who: "cw_tibb", goal: "Speak to Apprentice Tibb in The Pendulum Hall.", say: "Brask's Great Clock is losing time. Visit the Brass-Smith west in the Gear Gallery first.", btn: "Go west", story: "" },
    { id: "cw_smith", title: "Tempered Springs", who: "cw_smith", goal: "Meet the Brass-Smith in The Gear Gallery.", say: "Take this Clockwork Rapier, then check on Chime-Tuner Wren in the east tower.", btn: "Take rapier", story: "" },
    { id: "cw_ringer", title: "Noon Chime", who: "cw_ringer", goal: "Speak to Chime-Tuner Wren in The Chime Tower.", say: "The chimes are tuned! Head north through the Pendulum Hall to the Escapement Vault.", btn: "Head north", story: "" },
    { id: "cw_keeper", title: "True Time", who: "cw_keeper", goal: "Meet the Time-Ledger Clerk in The Escapement Vault.", say: "The ledger is balanced. Step north into the Chronos Heart and face the Grand Horologist.", btn: "Enter Chronos Heart", story: "" },
    { id: "cw_seconds", title: "The Brass Jar", who: "cw_seconds", goal: "Find Second-Keeper Tibb in The Lost Seconds Chamber, east of the Chronos Heart.", say: "The three lost seconds tick in their brass jar, safe from anyone who'd spend them. Give the seal one full turn—Brask's noon will land true for another hundred years.", btn: "Turn the seal", story: "" },
  ],
  relics: [
    { id: "cw_pendulum", s: "pendulum_hall", x: 14, y: 7, name: "a miniature brass pendulum", text: "Swings once every three seconds, even when held still." },
    { id: "cw_spring", s: "gear_gallery", x: 14, y: 7, name: "a coiled mainspring", text: "Hums with six hundred years of wound tension." },
    { id: "cw_fork", s: "chime_tower", x: 14, y: 7, name: "a silver tuning fork", text: "Rings in the exact pitch of Brask's noon bell." },
    { id: "cw_ledger", s: "escapement_vault", x: 5, y: 7, name: "a copper second-ledger", text: "Lists every afternoon nap taken in 1974." },
    { id: "cw_key", s: "chronos_heart", x: 15, y: 8, name: "the Grand Winding Key", text: "Heavy solid gold, stamped BRASK 1892." },
    { id: "cw_chime", s: "belfry_loft", x: 14, y: 6, name: "a pocketwatch chime", text: "Ticks three seconds ahead of noon." },
    { id: "cw_second", s: "lost_seconds", x: 15, y: 6, name: "a caught lost second", text: "Warm as a struck bell, and three seconds behind your own heartbeat." },
  ],
};
