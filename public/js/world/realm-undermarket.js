// The Lantern Under-Market: a 6-scene subterranean night bazaar beneath The Night Market.
const npc = (id, cast, name, x, y, story, lines, o = {}) => ({ id, cast, name, x, y, story, lines, ...o });

export const UNDERMARKET = {
  title: "The Lantern Under-Market",
  series: "kitsune",
  rpgKind: "delve",
  start: ["market_steps", 9, 10],
  respawn: ["market_steps", 9, 10],
  deathWord: "Bargains lost",
  endStory: "",
  doneGoal: "The Mask Broker's ledger is open to all. Every stall in the Under-Market burns bright.",
  deathBy: npc("um_guide", "Tamba", "Broker Tamba", 0, 0),
  deathLine: (n, t) => `${t} A lantern-bearer sweeps you back up to the steps. That's ${n} lost bargains.`,
  intro: "Beneath the cobbles of The Night Market, paper lanterns hang from carved stone ribs over six bustling subterranean alleys.",
  ending: "The Mask Broker bows and stamps your pass in gold leaf. Tonight, nothing in the Under-Market is off-limits.",
  building: (g, b) => {
    const T = 32, x = b.x * T, y = b.y * T, w = b.w * T, h = b.h * T;
    g.fillStyle = "#22182c"; g.fillRect(x, y + 10, w, h - 10);
    g.strokeStyle = "#ff8a3a"; g.lineWidth = 2.5; g.strokeRect(x, y + 10, w, h - 10);
    g.fillStyle = "#4a2238"; g.fillRect(x - 3, y, w + 6, 14);
    g.font = "800 11px system-ui"; g.textAlign = "center";
    g.fillStyle = "#ffe8b0"; g.fillText(b.name, x + w / 2, y + 10);
  },
  scenes: {
    market_steps: {
      name: "The Lantern Steps", room: 1, w: 19, h: 12, base: "stone", bg: "#0a0612", tint: "rgba(255,140,60,.08)",
      props: [["lampost", 4, 2], ["lampost", 14, 2], ["bench", 4, 9], ["bench", 14, 9]],
      npcs: [npc("um_tamba", "Tamba", "Lantern Warden", 9, 5, "", ["Mind your umbrella—the ceiling's low until Mask-Maker's Alley.", "Speak to the Mask-Maker west, or visit the Tea Vault east."])],
      doors: [{ x: 9, y: 0, to: "auction_hall", tx: 10, ty: 10, label: "Enter the Whispering Auction" }, { x: 0, y: 6, to: "mask_alley", tx: 17, ty: 5, label: "West to Mask-Maker's Alley" }, { x: 18, y: 6, to: "tea_vault", tx: 1, ty: 5, label: "East to the Midnight Tea Vault" }],
    },
    mask_alley: {
      name: "Mask-Maker's Alley", room: 1, w: 19, h: 11, base: "wood", bg: "#0d0814", tint: "rgba(200,120,255,.08)",
      props: [["shelf", 3, 2], ["shelf", 15, 2], ["table", 9, 3], ["lampost", 9, 8]],
      npcs: [npc("um_masker", "Pell", "Master Mask-Maker", 9, 5, "", ["Every fox in Hollow Pine owes us at least one mask.", "The Broker won't see anyone without a Whispering Stamp from the Auction."])],
      doors: [{ x: 18, y: 5, to: "market_steps", tx: 1, ty: 6, label: "Back to the Lantern Steps" }, { x: 9, y: 0, to: "forge_bazaar", tx: 9, ty: 9, label: "North to the Ember Bazaar" }],
    },
    tea_vault: {
      name: "The Midnight Tea Vault", room: 1, w: 19, h: 11, base: "carpet", bg: "#120a10", tint: "rgba(255,180,100,.08)",
      props: [["stove", 4, 2], ["table", 9, 4], ["table", 14, 4], ["shelf", 15, 2]],
      npcs: [npc("um_steep", "Ponzu", "Vault Brewer", 9, 6, "", ["Steeped for twelve years in clay jars under the Night Market.", "Warm enough to wake a statue."])],
      doors: [{ x: 0, y: 5, to: "market_steps", tx: 17, ty: 6, label: "Back to the Lantern Steps" }],
    },
    forge_bazaar: {
      name: "The Ember Bazaar", room: 1, w: 19, h: 11, base: "kiln", bg: "#140608", tint: "rgba(255,90,40,.11)",
      monster: "mini", hounds: [[5, 5], [13, 5]], houndLine: "A cinder-puppet from the back stalls singed your whiskers.",
      props: [["kilnring", 4, 2], ["kilnring", 14, 2], ["rack", 9, 2]],
      npcs: [npc("um_smith", "Ignis", "Ember-Smith", 9, 5, "", ["We temper blades in foxfire and river jade. Take this Foxfire Halberd—it'll clear the Auction floor in one swing."], { giveWeapon: "halberd" })],
      doors: [{ x: 9, y: 10, to: "mask_alley", tx: 9, ty: 1, label: "Back to Mask-Maker's Alley" }],
    },
    auction_hall: {
      name: "The Whispering Auction", room: 1, w: 21, h: 12, base: "stone", bg: "#080610", tint: "rgba(140,120,255,.08)",
      props: [["desk", 10, 3], ["bench", 5, 7], ["bench", 15, 7], ["lampost", 4, 3], ["lampost", 16, 3]],
      npcs: [npc("um_auctioneer", "Vesper", "The Whispering Auctioneer", 10, 5, "", ["Lot forty-nine: one unspoken promise, going once, going twice...", "Here's your Whispering Stamp. The Broker's Sanctum is straight north."])],
      doors: [{ x: 10, y: 11, to: "market_steps", tx: 9, ty: 1, label: "Back to the Lantern Steps" }, { x: 10, y: 0, to: "lantern_throne", tx: 10, ty: 10, label: "Enter the Broker's Sanctum" }],
    },
    lantern_throne: {
      name: "The Broker's Sanctum", room: 1, w: 21, h: 12, base: "carpet", bg: "#06040a", tint: "rgba(255,120,160,.09)",
      props: [["lampost", 4, 2], ["lampost", 16, 2], ["statue", 5, 6], ["statue", 15, 6]],
      npcs: [npc("um_broker", null, "The Mask Broker", 10, 4, "", [], { art: "statue", verb: "Face", boss: "mask_broker" })],
      doors: [{ x: 10, y: 11, to: "auction_hall", tx: 10, ty: 1, label: "Back to the Auction Hall" }, { x: 20, y: 6, to: "jade_cellar", tx: 1, ty: 4, label: "Into the Jade Tea Vault" }, { x: 0, y: 6, to: "porcelain_gallery", tx: 16, ty: 4, label: "Into the Porcelain Gallery" }],
    },
    jade_cellar: {
      name: "The Jade Tea Vault", room: 1, w: 18, h: 9, base: "stone", bg: "#0a1210", tint: "rgba(80,220,160,.08)",
      props: [["shelf", 4, 2], ["shelf", 13, 2], ["table", 9, 4]],
      npcs: [npc("um_cellar", "Ponzu", "Cellar Master", 9, 6, "", ["Every tea leaf steeped below Hollow Pine is aged in river jade."])],
      doors: [{ x: 0, y: 4, to: "lantern_throne", tx: 19, ty: 6, label: "Back to the Broker's Sanctum" }],
    },
    porcelain_gallery: {
      name: "The Porcelain Gallery", room: 1, w: 18, h: 9, base: "carpet", bg: "#0c0616", tint: "rgba(210,150,255,.09)",
      props: [["shelf", 3, 2], ["shelf", 6, 2], ["shelf", 11, 2], ["shelf", 14, 2], ["lampost", 9, 2]],
      npcs: [npc("um_porcelain", "Pell", "The Porcelain Warden", 9, 5, "", ["Every porcelain fox the Broker ever sealed a bargain into sits on these shelves, white and listening.", "Hold one to your ear and you'll hear the whisper it was paid with."])],
      doors: [{ x: 17, y: 4, to: "lantern_throne", tx: 1, ty: 6, label: "Back to the Broker's Sanctum" }],
    },
  },
  quest: [
    { id: "um_tamba", title: "Below the Cobbles", who: "um_tamba", goal: "Speak to the Lantern Warden on The Lantern Steps.", say: "Welcome below the Night Market. Visit the Master Mask-Maker in Mask-Maker's Alley first.", btn: "Go west", story: "" },
    { id: "um_masker", title: "Nine Masks", who: "um_masker", goal: "Visit the Master Mask-Maker in Mask-Maker's Alley.", say: "Before you enter the Auction, visit the Ember-Smith north in the Ember Bazaar for a real weapon.", btn: "Head north", story: "" },
    { id: "um_smith", title: "Jade & Foxfire", who: "um_smith", goal: "Speak to the Ember-Smith in The Ember Bazaar.", say: "Take this Foxfire Halberd. Now head to the Whispering Auction north of the Steps.", btn: "Take halberd", story: "" },
    { id: "um_auctioneer", title: "Lot Forty-Nine", who: "um_auctioneer", goal: "Get a Whispering Stamp from The Whispering Auctioneer.", say: "Stamped and sealed. Step north into the Broker's Sanctum whenever you're ready.", btn: "Face the Broker", story: "" },
    { id: "um_porcelain", title: "White and Listening", who: "um_porcelain", goal: "Find the Porcelain Warden in The Porcelain Gallery, west of the Broker's Sanctum.", say: "Every bargain the Broker ever sealed sits shelved here, white and listening. Set the unpainted fox from Mask-Maker's Alley among them—the Under-Market remembers every mask that finds its shelf.", btn: "Shelve the mask", story: "" },
  ],
  relics: [
    { id: "um_coin", s: "market_steps", x: 14, y: 7, name: "a notched jade coin", text: "Accepted only below ground." },
    { id: "um_mask", s: "mask_alley", x: 5, y: 7, name: "an unpainted fox mask", text: "Smells of cedar and fresh lacquer." },
    { id: "um_kettle", s: "tea_vault", x: 14, y: 7, name: "a twelve-year clay kettle", text: "Still warm without a stove." },
    { id: "um_tongs", s: "forge_bazaar", x: 14, y: 7, name: "foxfire smithing tongs", text: "Glowing faintly at the tips." },
    { id: "um_gavel", s: "auction_hall", x: 16, y: 8, name: "a velvet-wrapped gavel", text: "Makes no sound at all when struck." },
    { id: "um_ledger", s: "lantern_throne", x: 15, y: 8, name: "the Broker's Gold Ledger", text: "Every bargain ever struck in Hollow Pine, balanced to zero." },
    { id: "um_jade", s: "jade_cellar", x: 14, y: 6, name: "a carved jade teacup", text: "Cool to the touch, even filled with boiling tea." },
    { id: "um_whisper", s: "porcelain_gallery", x: 14, y: 6, name: "a whisper-white porcelain mask", text: "Hold it to your ear and hear a bargain you never made." },
  ],
};
