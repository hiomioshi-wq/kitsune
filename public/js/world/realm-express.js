// The Spirit Express: a walkable 6-car starlight train departing from Platform Zero.
const npc = (id, cast, name, x, y, story, lines, o = {}) => ({ id, cast, name, x, y, story, lines, ...o });

export const EXPRESS = {
  title: "The Spirit Express · Midnight Line",
  series: "kitsune",
  rpgKind: "delve",
  start: ["caboose", 9, 5],
  respawn: ["caboose", 9, 5],
  deathWord: "Tickets dropped",
  endStory: "",
  doneGoal: "The Star-Coal Locomotive is stoked and singing across the night rails. Ride as far as you like.",
  deathBy: npc("haruexpd", "Haru", "Conductor Haru", 0, 0),
  deathLine: (n, t) => `${t} Haru catches you by the collar on the observation deck. That's ${n} dropped tickets.`,
  intro: "You step onto the brass rear platform as the Spirit Express pulls out of Platform Zero onto rails of silver starlight. Six cars stretch ahead toward the Star-Coal Locomotive.",
  ending: "The brass whistle clears the night sky from Hollow Pine to the Maelstrom Rim. Every lantern along the tracks answers back in gold.",
  building: (g, b) => {
    const T = 32, x = b.x * T, y = b.y * T, w = b.w * T, h = b.h * T;
    g.fillStyle = "#2b1d18"; g.fillRect(x, y + 10, w, h - 10);
    g.strokeStyle = "#d9a84e"; g.lineWidth = 2.5; g.strokeRect(x, y + 10, w, h - 10);
    g.fillStyle = "#7a1c28"; g.fillRect(x - 3, y, w + 6, 14);
    g.font = "800 11px system-ui"; g.textAlign = "center";
    g.fillStyle = "#ffe8b0"; g.fillText(b.name, x + w / 2, y + 10);
  },
  scenes: {
    caboose: {
      name: "Car 1 · The Lantern Caboose", room: 1, w: 18, h: 9, base: "wood", bg: "#070914", tint: "rgba(255,210,120,.06)",
      props: [["lampost", 3, 2], ["lampost", 14, 2], ["bench", 5, 6], ["bench", 12, 6]],
      npcs: [
        npc("haruexp", "Haru", "Conductor Haru", 9, 4, "", ["No tickets on the midnight line—just keep walking forward until the whistle blows.", "Chef Miso's waiting in the Dining Car if you're hungry."]),
      ],
      doors: [{ x: 17, y: 4, to: "dining", tx: 1, ty: 4, label: "Step forward to the Dining Car" }],
    },
    dining: {
      name: "Car 2 · Midnight Dining Car", room: 1, w: 22, h: 9, base: "carpet", bg: "#0a0710", tint: "rgba(255,170,90,.07)",
      props: [["stove", 4, 2], ["table", 8, 3], ["table", 13, 3], ["table", 8, 6], ["table", 13, 6]],
      npcs: [
        npc("chefmiso", null, "Chef Miso", 5, 4, "", ["Hot foxfire broth, fresh off the boiler! Sit a second and catch your breath."], { look: { c: "#f4f2ec", a: "#d9503a", st: 4, sk: 1, h: "#2a1c14", e: "#222", f: "apron" } }),
        npc("bramexp", "Bram", "Old Bram", 15, 5, "", ["I finally caught the train! Only took me sixty years of walking down the Whiteback."]),
      ],
      doors: [{ x: 0, y: 4, to: "caboose", tx: 16, ty: 4, label: "Back to the Caboose" }, { x: 21, y: 4, to: "sleeper", tx: 1, ty: 4, label: "Forward to the Sleeper Berths" }],
    },
    sleeper: {
      name: "Car 3 · The Sleeper Berths", room: 1, w: 22, h: 9, base: "wood", bg: "#060812", tint: "rgba(120,160,255,.07)",
      monster: "mini", hounds: [[10, 3], [15, 6]], houndLine: "A stowaway ticket-imp rattled your teeth until Haru tossed it off the train.",
      props: [["bench", 4, 2], ["bench", 9, 2], ["bench", 14, 2], ["screen", 18, 2]],
      npcs: [
        npc("kitsuexp", "Kitsu", "Kitsu", 7, 5, "", ["Even the midnight train gets mail. Somebody addressed a parcel to 'whichever car smells like tea'."]),
        npc("wrenexp", "Wren", "Wren", 17, 4, "", ["Moth Radio picks up signals from twenty miles above the clouds out here."]),
      ],
      doors: [{ x: 0, y: 4, to: "dining", tx: 20, ty: 4, label: "Back to the Dining Car" }, { x: 21, y: 4, to: "library_car", tx: 1, ty: 4, label: "Forward to the Rolling Archive" }],
    },
    library_car: {
      name: "Car 4 · The Rolling Archive", room: 1, w: 20, h: 9, base: "stone", bg: "#080710", tint: "rgba(170,130,240,.08)",
      props: [["shelf", 3, 2], ["shelf", 6, 2], ["shelf", 13, 2], ["shelf", 16, 2], ["desk", 10, 3]],
      npcs: [
        npc("clerkexp", "Vesper", "Travelling Archivist", 10, 5, "", ["Every timetable since 1892 is filed in these oak drawers.", "The Unpunched Conductor waits in the next car. Mind your footing."]),
      ],
      doors: [{ x: 0, y: 4, to: "sleeper", tx: 20, ty: 4, label: "Back to the Sleeper Berths" }, { x: 19, y: 4, to: "vault_car", tx: 1, ty: 4, label: "Enter the Ticket-Master's Vault" }],
    },
    vault_car: {
      name: "Car 5 · The Ticket-Master's Vault", room: 1, w: 20, h: 9, base: "carpet", bg: "#0d060a", tint: "rgba(255,90,90,.07)",
      props: [["lampost", 4, 2], ["lampost", 15, 2], ["desk", 10, 2]],
      npcs: [
        npc("conductorboss", null, "The Unpunched Conductor", 10, 4, "", [], { art: "plate", verb: "Face", boss: "ticketmaster" }),
      ],
      doors: [{ x: 0, y: 4, to: "library_car", tx: 18, ty: 4, label: "Back to the Rolling Archive" }, { x: 19, y: 4, to: "engine", tx: 1, ty: 5, label: "Step into the Star-Coal Locomotive" }],
    },
    engine: {
      name: "Car 6 · The Star-Coal Locomotive", room: 1, w: 22, h: 11, base: "kiln", bg: "#140804", tint: "rgba(255,140,40,.12)",
      props: [["kilnring", 16, 5], ["screen", 4, 2], ["screen", 9, 2], ["bench", 4, 8]],
      npcs: [
        npc("stoker", "Ignis", "Stoker Ash", 11, 5, "", ["Pure star-coal burning at four thousand degrees! Take this poker—it's good for more than stoking the firebox."], { giveWeapon: "poker" }),
      ],
      doors: [{ x: 0, y: 5, to: "vault_car", tx: 18, ty: 4, label: "Back to the Vault Car" }, { x: 21, y: 5, to: "obs_car", tx: 1, ty: 4, label: "Step out to the Observation Deck" }],
    },
    obs_car: {
      name: "Car 7 · The Observation Deck", room: 1, w: 18, h: 9, base: "glass", bg: "#040814", tint: "rgba(140,200,255,.1)",
      props: [["bench", 4, 2], ["bench", 13, 2], ["lampost", 9, 2]],
      npcs: [npc("obs_scout", "Haru", "Star-Deck Lookout", 9, 5, "", ["Nothing behind the caboose except open sky and nine lanterns winking below."])],
      doors: [{ x: 0, y: 4, to: "engine", tx: 20, ty: 5, label: "Back to the Locomotive" }, { x: 17, y: 4, to: "mail_car", tx: 1, ty: 4, label: "Step into the Dead-Letter Car" }],
    },
    mail_car: {
      name: "Car 8 · The Dead-Letter Car", room: 1, w: 20, h: 9, base: "wood", bg: "#0a0810", tint: "rgba(255,200,110,.08)",
      props: [["shelf", 3, 2], ["shelf", 7, 2], ["shelf", 12, 2], ["shelf", 16, 2], ["desk", 10, 6], ["lampost", 16, 6]],
      npcs: [
        npc("deadpost", null, "The Dead-Letter Clerk", 10, 4, "", ["Every parcel in this car is bound somewhere the midnight line never stops, so they ride the racks until they're needed.", "This one's been riding since 1892—addressed to the never-punched conductor. He never claims it; claiming would mean the line has an end."], { look: { c: "#e8e2d4", a: "#7a5c2e", st: 3, sk: 1, h: "#3a2c1c", e: "#222", f: "apron" } }),
      ],
      doors: [{ x: 0, y: 4, to: "obs_car", tx: 16, ty: 4, label: "Back to the Observation Deck" }],
    },
  },
  quest: [
    { id: "haruexp", title: "All Aboard", who: "haruexp", goal: "Speak to Conductor Haru in the Lantern Caboose.", say: "Welcome aboard the midnight line. Walk forward through the cars and check on Chef Miso in the Dining Car.", btn: "Walk forward", story: "" },
    { id: "chefmiso", title: "Midnight Broth", who: "chefmiso", goal: "Visit Chef Miso in the Midnight Dining Car.", say: "Old Bram's been eating noodles since Whiteback. Take a bowl for the road—the Sleeper Berths ahead have a few stowaways.", btn: "Keep moving", story: "" },
    { id: "kitsuexp", title: "Car Three Mail", who: "kitsuexp", goal: "Find Kitsu in the Sleeper Berths.", say: "I've got a parcel for the Travelling Archivist in Car 4. Watch out for the stowaways!", btn: "Take parcel", story: "" },
    { id: "clerkexp", title: "The Old Timetable", who: "clerkexp", goal: "Deliver the parcel to the Travelling Archivist in the Rolling Archive.", say: "Right on time! The Unpunched Conductor is blocking the Vault Car ahead—show him a real ticket.", btn: "Enter the Vault", story: "" },
    { id: "stoker", title: "Star-Coal Fire", who: "stoker", goal: "Reach the Star-Coal Locomotive and speak to Stoker Ash.", say: "You made it to the engine! Take this Star-Coal Poker and ring the station bell whenever you're ready.", btn: "Take the poker", story: "" },
    { id: "deadpost", title: "The Dead-Letter Parcel", who: "deadpost", goal: "Find the Dead-Letter Clerk in the car past the Observation Deck.", say: "One parcel left from 1892, addressed to the never-punched conductor. Set it on the star-coal rack—the sixth car delivers whatever the firebox sings for.", btn: "Leave the parcel", story: "" },
  ],
  relics: [
    { id: "exp_ticket", s: "caboose", x: 14, y: 6, name: "a golden half-moon ticket", text: "Punched in the shape of a tiny fox." },
    { id: "exp_menu", s: "dining", x: 18, y: 6, name: "a midnight ramen menu", text: "Only one item: 'Hot enough to see the stars.'" },
    { id: "exp_radio", s: "sleeper", x: 13, y: 6, name: "a pocket moth-crystal", text: "Hums softly when the train crosses a bridge." },
    { id: "exp_timetable", s: "library_car", x: 15, y: 6, name: "the 1892 Timetable", text: "Every stop says ARRIVES WHEN NEEDED." },
    { id: "exp_seal", s: "vault_car", x: 14, y: 6, name: "a brass ticket-punch", text: "Heavy, polished, and warm from a thousand journeys." },
    { id: "exp_coal", s: "engine", x: 18, y: 7, name: "a lump of unburnt star-coal", text: "Glows like a tiny lantern inside your pocket." },
    { id: "exp_compass", s: "obs_car", x: 14, y: 6, name: "a brass caboose compass", text: "Always points toward Platform Zero." },
    { id: "exp_blank", s: "mail_car", x: 17, y: 6, name: "a never-punched ticket blank", text: "The midnight line has no last stop, so it never needs punching." },
  ],
};
