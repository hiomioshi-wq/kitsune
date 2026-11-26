// Winterfest data: pets, shop stock, quests, goals, advent gifts, well odds and the daily snowfall forecast.
import { today } from "../util.js";
export const RARITY = { c: ["Common", "#8aa0b8", 1], r: ["Rare", "#3f8fe0", 3], e: ["Epic", "#9a5be0", 5], l: ["Legendary", "#f2a81d", 8] };

// id, name, rarity, body, belly, accent, ears, tail, personality
export const SPECIES = [
  ["kit", "Snow Kit", "c", "#f4f6fa", "#ffffff", "#ff9a5c", "fox", "fluff", "Follows you everywhere and pretends it was going that way anyway."],
  ["bunny", "Frost Bunny", "c", "#dfeaf6", "#ffffff", "#f6a8c0", "bunny", "puff", "Thumps once for yes, twice for more cookies."],
  ["penguin", "Waddle", "c", "#2c3350", "#f6f7fb", "#f2a33a", "none", "stub", "Takes every journey very seriously, and very slowly."],
  ["robin", "Pip the Robin", "c", "#8a6a50", "#e8522e", "#f2c23c", "none", "stub", "Sits on the top of whatever you were about to use."],
  ["ermine", "Little Ermine", "c", "#fbfbf6", "#ffffff", "#23233a", "round", "thin", "Vanishes in snow. Reappears near snacks."],
  ["fawn", "Bramble Fawn", "r", "#b4784a", "#f0dcc0", "#6a4528", "antler", "puff", "Practises flying when it thinks nobody is looking."],
  ["cub", "Polar Cub", "r", "#f6f3ea", "#ffffff", "#2a2a38", "round", "stub", "Falls asleep mid-sentence, usually yours."],
  ["owl", "Hush Owl", "r", "#c9cfdc", "#f4f4f8", "#f2b23a", "tuft", "stub", "Reads over your shoulder and judges the ending."],
  ["cat", "Ginger Biscuit", "r", "#e8913f", "#fff0dc", "#b5602a", "cat", "thin", "Knocks exactly one ornament off the tree per day."],
  ["yeti", "Baby Yeti", "e", "#c9e4f4", "#eaf6fc", "#5a7fa8", "tuft", "puff", "Tiny, gentle, and responsible for all your missing socks."],
  ["gingerbread", "Crumb", "e", "#b8743a", "#d9a06a", "#ffffff", "round", "stub", "A biscuit who woke up and refuses to discuss it."],
  ["dragon", "Ice Dragonling", "e", "#7fd0ea", "#dff6fb", "#3b7fb8", "horn", "spike", "Sneezes snow. Quite proud of it."],
  ["spirit", "Star Spirit", "l", "#fff2b8", "#fffbe6", "#ffb52e", "spirit", "wisp", "The light on top of the tree, out for a walk."],
  ["ninefox", "Midwinter Kitsune", "l", "#e9f3ff", "#ffffff", "#7fb0ff", "fox", "nine", "Nine tails of falling snow. Nobody knows how old it is."],
  ["narwhal", "Frost Narwhal", "r", "#8fd0ec", "#eef8ff", "#ffd84d", "horn", "stub", "Polishes its spiral horn on icicles every morning."],
  ["arcticfox", "Aurora Fox", "e", "#9fe8ff", "#ffffff", "#7dffd0", "fox", "fluff", "Its tail glows green whenever the northern lights wake up."],
  ["krampus", "Tinsel Imp", "e", "#c83a48", "#ffe8d8", "#ffd84d", "horn", "thin", "Swaps every bell in the village just to hear the tune change."],
  ["snowleopard", "Cloud Leopard", "e", "#dfe6ef", "#ffffff", "#6a7fa8", "cat", "fluff", "Leaps across rooftops without shaking a single icicle loose."],
  ["celestialowl", "Solstice Owl", "l", "#2e3b6e", "#ffe8b0", "#ffd84d", "tuft", "wisp", "Counts every lantern lit before the longest night ends."],
  ["winternine", "Grand Midwinter", "l", "#ffd84d", "#ffffff", "#9fe8ff", "fox", "nine", "Crowned in midwinter starlight, guardian of the Solstice Sanctum."],
  ["snowhare", "Snowshoe Hare", "c", "#f6f8fc", "#ffffff", "#8fb0d8", "bunny", "puff", "Leaves giant pawprints across fresh drifts just to confuse scouts."],
  ["walrus", "Tusk Walrus", "r", "#8a7a6a", "#d8cfc4", "#fff4d6", "round", "stub", "Naps on floating ice floes and hums along to sleigh bells."],
  ["puffin", "Frost Puffin", "r", "#222430", "#ffffff", "#ff7a3a", "none", "stub", "Delivers fish-shaped cookies to every lighthouse along the coast."],
  ["caribou", "Starlight Caribou", "e", "#9a6a42", "#e8dcc8", "#ffd84d", "antler", "puff", "Its antlers catch falling stardust before it hits the snow."],
  ["frostwyrm", "Glacier Wyrm", "l", "#7fe8ff", "#eefaff", "#4a7ab8", "horn", "spike", "Breathes harmless diamond mist that turns puddles into skating rinks."],
  ["auroraqueen", "Aurora Empress", "l", "#5cf0c0", "#ffffff", "#b58cff", "fox", "nine", "Weaves green and violet ribbons across the midnight sky."],
  ["seal", "Ribbon Seal", "c", "#8aa0b8", "#f2f6fa", "#5cf0c0", "round", "stub", "Slides headfirst down every snowbank in Hollow Pine."],
  ["lynx", "Snow Lynx", "r", "#d8ccb8", "#ffffff", "#8a5a32", "tuft", "puff", "Balances a single snowflake on each ear-tuft for luck."],
  ["albatross", "Gale Albatross", "r", "#f4f6fb", "#ffffff", "#4a7ab0", "none", "stub", "Carries winter postcards across the southern sea in record time."],
  ["stoat", "Velvet Stoat", "e", "#f6f3ea", "#ffffff", "#b5303a", "round", "thin", "Wears a tiny red scarf and inspects every wrapped parcel."],
  ["polarphoenix", "Frost Phoenix", "l", "#9fe8ff", "#ffffff", "#ff9a3a", "tuft", "wisp", "Its feathers glow warm amber inside the coldest blizzards."],
  ["celestialkitsune", "Astral Midwinter", "l", "#b58cff", "#ffffff", "#ffd84d", "fox", "nine", "Keeper of the North Pole Spire and the hundredth bell."],
  ["muskox", "Woolly Muskox", "c", "#6a5a4a", "#d8ccb8", "#fff4d6", "horn", "stub", "Stands like a warm furry boulder against any wind."],
  ["snowfox", "Silver Fox", "r", "#cfd8e6", "#ffffff", "#7fa8d8", "fox", "fluff", "Collects fallen icicles and lines them up by size."],
  ["gull", "Frost Gull", "r", "#eef4fb", "#ffffff", "#f2a33a", "none", "stub", "Knows every harbor baker along the winter coast."],
  ["wolverine", "Pine Badger", "e", "#4a3a30", "#c9a87a", "#e0343e", "round", "stub", "Digs warm burrows under the deepest pine drifts."],
  ["glacierstag", "Diamond Stag", "l", "#9fe8ff", "#ffffff", "#ffd84d", "antler", "wisp", "Its antlers chime softly like glass wind-bells."],
  ["solsticefox", "Solstice Empress", "l", "#ffd84d", "#ffffff", "#b58cff", "fox", "nine", "Sovereign of the Eternal Midwinter and the 120th star."],
  ["snowhare2", "Timber Hare", "c", "#9a8a78", "#e8dfd2", "#e0343e", "bunny", "bob", "Leaves neat clover-shaped tracks around the woodpile."],
  ["frostseraph", "Frost Seraph", "l", "#e8f6ff", "#ffffff", "#7fd0ff", "spirit", "wisp", "Six wings of crystalline snow that hum like a glass harmonica."],
  ["voidkitsune", "Eclipse Kitsune", "l", "#18142c", "#2a2448", "#ffd84d", "fox", "nine", "Nine tails of midnight velvet, seen only during a winter eclipse."],
  ["cometstag", "Comet Stag", "l", "#bfe6f7", "#ffffff", "#ff9a3a", "antler", "wisp", "Leaves a trail of golden stardust across frozen lakes."],
  ["chronocat", "Clockwork Lynx", "l", "#c79a2e", "#f4e6c0", "#5cf0c0", "tuft", "thin", "Ticks softly at midnight and always knows when the snow will stop."],
  ["emberwyrm", "Hearth Wyrm", "l", "#e0483c", "#ffd27a", "#fff4b8", "horn", "spike", "Curls around chimney tops to keep the whole village warm."],
  ["prismowl", "Prism Owl", "l", "#f4f8ff", "#ffffff", "#b58cff", "tuft", "wisp", "Its feathers split moonlight into seven quiet colours."],
  ["starwhale", "Astral Narwhal", "l", "#2a3b7a", "#cfe6ff", "#ffd84d", "horn", "wisp", "Swims through high-altitude clouds above the northern ridge."],
  ["bellspirit", "Hundredth Bell", "l", "#ffd84d", "#fffbe6", "#e0343e", "spirit", "wisp", "Born from the echo of the hundredth Winterfest bell."],
  ["velvetfox", "Crimson Kitsune", "l", "#a82038", "#fff0f2", "#ffd84d", "fox", "nine", "Wears nine tails of winterberry silk and guards the Great Shelf."],
  ["glacierbear", "Crystal Ursid", "l", "#9fe8ff", "#eefaff", "#ffffff", "round", "stub", "Sleeps inside a hollow glacier and dreams of spring."],
  ["lanternmoth", "Solstice Moth", "l", "#fff27a", "#ffffff", "#7dffd0", "tuft", "wisp", "Follows the Nine Lanterns from Hollow Pine to Moonwake Bay."],
  ["crownfox", "Sovereign Kitsune", "l", "#ffffff", "#eef6ff", "#ffd84d", "fox", "nine", "The rarest Winterfest companion — crowned in pure starlight."],
  ["polarbear2", "Frost Cub", "r", "#eaf6ff", "#ffffff", "#7fe8ff", "round", "stub", "Naps inside freshly scooped snowbanks with a scarf."],
  ["snowowl2", "Boreal Owl", "r", "#c4b49a", "#fff8ea", "#ffd84d", "tuft", "thin", "Hoots softly whenever a lantern is lit in the village."],
  ["icewolf", "Glacier Wolf", "e", "#7aa4cc", "#dceeff", "#5cf0c0", "fox", "fluff", "Runs along frozen riverbeds faster than sleigh bells."],
  ["cometdeer", "Violet Comet Stag", "l", "#b58cff", "#fff4bf", "#ffd84d", "antler", "wisp", "Trails ribbons of violet stardust when leaping drifts."],
  ["yulekitsune", "Chronicle Kitsune", "l", "#ff9a3a", "#fff8ea", "#ffd84d", "fox", "nine", "Records every Winterfest wish in a book of starlight."],
  ["ptarmigan", "Blizzard Ptarmigan", "r", "#eef4fa", "#ffffff", "#c8562e", "none", "stub", "Buries itself in the freshest drift and naps through the whole blizzard."],
  ["savannahmonitor", "Savannah Monitor", "c", "#b89c74", "#e8dcc4", "#6a5438", "monitor", "thick", "A chunky, gentle sun-basker who naps on warm rocks all afternoon."],
  ["ackiemonitor", "Ackie Monitor", "c", "#c95b32", "#f5deb8", "#f4c842", "monitor", "spiny", "Tiny spiny-tailed Australian explorer who burrows under every cushion."],
  ["nilemonitor", "Nile Monitor", "r", "#4a5c3a", "#d8e0b8", "#f2cf46", "monitor", "whip", "Sprints across riverbanks with bright yellow V-stripes flashing."],
  ["watermonitor", "Asian Water Monitor", "r", "#383e48", "#f0e8d0", "#ffd24d", "monitor", "whip", "Swims laps in the pond and politely inspects every picnic basket."],
  ["argusmonitor", "Argus Monitor", "r", "#9c7a48", "#f4e6c8", "#ffe082", "monitor", "whip", "Stands tall in a tripod stance on its hind legs to survey the horizon."],
  ["lacemonitor", "Lace Monitor", "e", "#2c2e38", "#f4ecd8", "#e8c468", "monitor", "whip", "Clad in cream-and-gold lace bands; climbs pine trees in two seconds flat."],
  ["perentie", "Perentie", "e", "#b87a42", "#f6ebd8", "#f4d284", "monitor", "whip", "Australia's desert giant — covered in neat cream leopard-ocelli."],
  ["treemonitor", "Emerald Tree Monitor", "e", "#28b862", "#a8f0b8", "#186e3b", "monitor", "curl", "Vivid jade-green canopy acrobat with a curled prehensile tail."],
  ["bluemonitor", "Blue-Tailed Monitor", "e", "#2b3242", "#c8d8f0", "#3b8cff", "monitor", "bluetail", "Flicks a bright sky-blue tongue and trails an electric cobalt tail."],
  ["crocmonitor", "Crocodile Monitor", "l", "#262b26", "#cde888", "#b8f23a", "monitor", "croctail", "Papuan canopy legend with chartreuse spots and the longest banded tail."],
  ["blackdragon", "Black Dragon (Water Monitor)", "l", "#181a20", "#2d303c", "#ffb830", "monitor", "whip", "Ultra-rare melanistic morph of the Asian Water Monitor with gleaming golden-amber eyes."],
  ["komodo", "Komodo Dragon", "l", "#6e685c", "#bfb4a0", "#d89c48", "monitor", "heavy", "Armored island sovereign — surprisingly affectionate when offered snacks."],
];
export const species = (id) => SPECIES.find((x) => x[0] === id);

export const TREATS = { cookie: ["Sugar cookie", 8, 12, 6, "#e8c078"], cocoa: ["Hot cocoa", 14, 18, 12, "#6a3f25"], cane: ["Candy cane", 20, 10, 18, "#e0343e"], feast: ["Midwinter feast", 45, 60, 40, "#c8863a"] }; // name, price, hunger, xp, colour

// id, kind, name, price, value, and "well" when it can only come from the Wishing Well
export const CATALOG = [
  ["egg-c", "egg", "Common egg", 120, "c"], ["egg-r", "egg", "Rare egg", 320, "r"], ["egg-e", "egg", "Epic egg", 800, "e"],
  ["th-night", "theme", "Silent Night theme", 240, { name: "Silent Night", mode: "dark", bg: "#0d1730", surface: "#16233f", ink: "#eef4ff", muted: "#9db0cf", line: "#263a5e", accent: "#ffd27a", font: "body", display: "display" }],
  ["th-cane", "theme", "Candy Cane theme", 240, { name: "Candy Cane", mode: "light", bg: "#fff4f2", surface: "#ffffff", ink: "#3a1418", muted: "#86565c", line: "#f3d3d0", accent: "#c8202e", font: "body", display: "display" }],
  ["th-pine", "theme", "Evergreen theme", 240, { name: "Evergreen", mode: "dark", bg: "#0e1f18", surface: "#163026", ink: "#f2f6ea", muted: "#a2bda9", line: "#27493a", accent: "#e8524a", font: "body", display: "mincho" }],
  ["th-aurora", "theme", "Aurora theme", 0, { name: "Winter Aurora", mode: "dark", bg: "#0a1226", surface: "#121d3a", ink: "#ecfff8", muted: "#93c0b8", line: "#20355a", accent: "#5cf0c0", font: "body", display: "display" }, "well"],
  ["x_candy", "cursor", "Candy cane cursor", 60], ["x_holly", "cursor", "Holly cursor", 60], ["x_gift", "cursor", "Present cursor", 60], ["x_mitten", "cursor", "Mitten cursor", 60], ["x_bell", "cursor", "Sleigh bell cursor", 60], ["x_ginger", "cursor", "Gingerbread cursor", 60], ["x_star", "cursor", "Tree star cursor", 0, null, "well"],
  ["xsnow", "wallpaper", "Snowflake wallpaper", 90], ["xholly", "wallpaper", "Holly wallpaper", 90], ["xtrees", "wallpaper", "Pine forest wallpaper", 90],
  ["sleigh", "sound", "Sleigh bells sounds", 120], ["musicbox", "sound", "Music box sounds", 120],
  ["santa", "worldhat", "Santa hat (World)", 80], ["antlers", "worldhat", "Reindeer antlers (World)", 80], ["earmuffs", "worldhat", "Earmuffs (World)", 70], ["holly", "worldhat", "Holly crown (World)", 0, null, "well"],
  ["xtree", "worldfurn", "Tiny fir tree (house)", 70], ["snowman", "worldfurn", "Snowman (house)", 60], ["stocking", "worldfurn", "Stocking (house)", 35], ["gifts", "worldfurn", "Pile of presents (house)", 50],
  ["th-solstice", "theme", "Solstice Gold theme", 360, { name: "Solstice Gold", mode: "dark", bg: "#141022", surface: "#201936", ink: "#fff6e6", muted: "#b9a8d8", line: "#362b5c", accent: "#ffd84d", font: "body", display: "display" }],
  ["th-glacier", "theme", "Glacier Ice theme", 360, { name: "Glacier Ice", mode: "dark", bg: "#0b1f2e", surface: "#122f46", ink: "#eaf8ff", muted: "#8eb8d0", line: "#224d6c", accent: "#7fe8ff", font: "body", display: "display" }],
  ["x_aurora", "cursor", "Aurora crystal cursor", 120],
  ["grandtree", "worldfurn", "Grand Yule Tree (house)", 220],
  ["th-midnight", "theme", "Midnight Star theme", 420, { name: "Midnight Star", mode: "dark", bg: "#080b1c", surface: "#111736", ink: "#eef2ff", muted: "#9aa8d4", line: "#24305e", accent: "#b58cff", font: "body", display: "display" }],
  ["th-crimson", "theme", "Yule Crimson theme", 420, { name: "Yule Crimson", mode: "dark", bg: "#220c10", surface: "#34141a", ink: "#fff4ec", muted: "#d4a4a8", line: "#5a242c", accent: "#ffd27a", font: "body", display: "display" }],
  ["x_crown", "cursor", "Solstice Crown cursor", 160],
  ["yulehearth", "worldfurn", "Grand Yule Hearth (house)", 260],
  ["th-northpole", "theme", "North Pole theme", 480, { name: "North Pole", mode: "dark", bg: "#071024", surface: "#0e1c3a", ink: "#eef8ff", muted: "#8eb2d8", line: "#1f3868", accent: "#7fe8ff", font: "body", display: "display" }],
  ["th-frostfire", "theme", "Frostfire theme", 480, { name: "Frostfire", mode: "dark", bg: "#180d22", surface: "#281538", ink: "#fff4ec", muted: "#c4a4d8", line: "#462662", accent: "#ff9a3a", font: "body", display: "display" }],
  ["x_comet", "cursor", "Comet Trail cursor", 190],
  ["frostfountain", "worldfurn", "Ice Fountain (house)", 300],
  ["th-celestial", "theme", "Celestial Snow theme", 540, { name: "Celestial Snow", mode: "dark", bg: "#080b18", surface: "#10162e", ink: "#eef6ff", muted: "#98aad4", line: "#202e5e", accent: "#c8b4ff", font: "body", display: "display" }],
  ["th-yulegold", "theme", "Yule Gold theme", 540, { name: "Yule Gold", mode: "dark", bg: "#1a1208", surface: "#2a1e10", ink: "#fff8ea", muted: "#cbb898", line: "#4c361a", accent: "#ffd84d", font: "body", display: "display" }],
  ["x_halo", "cursor", "Starlight Halo cursor", 220],
  ["yuleorgan", "worldfurn", "Yule Pipe Organ (house)", 360],
  ["th-twilight", "theme", "Winter Twilight theme", 600, { name: "Winter Twilight", mode: "dark", bg: "#0a091a", surface: "#141230", ink: "#f6eefc", muted: "#b0a0cc", line: "#2c2458", accent: "#ff9ac2", font: "body", display: "display" }],
  ["th-everfrost", "theme", "Everfrost theme", 600, { name: "Everfrost", mode: "dark", bg: "#071820", surface: "#0f2836", ink: "#e8fff8", muted: "#8ab8c4", line: "#1f4858", accent: "#5cf0c0", font: "body", display: "display" }],
  ["x_snowflake", "cursor", "Diamond Flake cursor", 250],
  ["solsticeclock", "worldfurn", "Solstice Grandfather Clock (house)", 420],
  ["th-yulelantern", "theme", "Yule Lantern theme", 660, { name: "Yule Lantern", mode: "dark", bg: "#131022", surface: "#221c34", ink: "#fff4dc", muted: "#c8b494", line: "#3e3252", accent: "#ffb54a", font: "body", display: "display" }],
  ["x_skate", "cursor", "Ice skate cursor", 280],
  ["icecarousel", "worldfurn", "Ice Carousel (house)", 480],
];
export const item = (id) => CATALOG.find((x) => x[0] === id);

export const ORNAMENTS = [["red", "Red bauble", "#e0343e", 12], ["gold", "Gold bauble", "#f2c23c", 12], ["blue", "Ice bauble", "#6cc8ff", 12], ["green", "Green bauble", "#3fae6a", 12], ["purple", "Plum bauble", "#9a5be0", 18], ["silver", "Silver bauble", "#d8dde8", 18], ["pink", "Sugar bauble", "#ff8fb8", 18], ["fox", "Fox bauble", "#e8862e", 40], ["emerald", "Emerald bauble", "#35d68a", 28], ["aurora", "Aurora bauble", "#5cf0c0", 35], ["crystal", "Ice crystal bauble", "#9fe8ff", 35], ["crown", "Solstice crown", "#ffd84d", 65], ["sapphire", "Sapphire bauble", "#3f8fe0", 40], ["ruby", "Ruby bauble", "#e0345e", 40], ["comet", "Comet bauble", "#b58cff", 55], ["starlight", "Starlight finial", "#fff4bf", 85], ["amethyst", "Amethyst bauble", "#b58cff", 50], ["opal", "Opal bauble", "#eef8ff", 55], ["polar", "Polar star", "#7fe8ff", 70], ["astral", "Astral finial", "#ffd84d", 110], ["garnet", "Garnet bauble", "#c8283a", 60], ["topaz", "Topaz bauble", "#f2a33a", 65], ["moonstone", "Moonstone bauble", "#d8e4ff", 85], ["eternity", "Eternity crown", "#ffd84d", 140], ["peridot", "Peridot bauble", "#6ee05a", 75], ["citrine", "Citrine bauble", "#ffcf4a", 80], ["obsidian", "Obsidian bauble", "#4a4e68", 95], ["chronicle", "Chronicle star", "#ffd84d", 160]];
export const TREE_SLOTS = [[150, 88], [132, 112], [170, 116], [108, 146], [150, 150], [192, 144], [92, 186], [130, 188], [172, 190], [212, 184], [76, 228], [116, 232], [158, 236], [200, 230], [230, 226], [58, 272], [100, 278], [142, 282], [186, 280], [228, 274], [84, 322], [130, 328], [176, 328], [222, 320], [150, 68], [118, 128], [184, 128], [150, 192], [106, 256], [194, 256], [150, 114], [150, 270], [72, 304], [228, 304], [112, 344], [190, 344], [150, 48], [96, 166], [204, 166], [150, 214], [88, 252], [212, 252], [122, 92], [178, 92], [86, 208], [214, 208], [66, 294], [234, 294], [136, 74], [164, 74], [102, 214], [198, 214], [52, 294], [248, 294]];

// key, label, need, reward
export const DAILY = [["pages", "Read 20 pages", 20, 30], ["mins", "Read for 10 minutes", 10, 30], ["well", "Make a wish at the Wishing Well", 1, 10], ["feed", "Feed your pet", 1, 10], ["pat", "Pet your pet 3 times", 3, 10], ["play", "Play a round of Snow Catch", 1, 15], ["world", "Visit Kitsune World", 1, 10], ["fish", "Catch a fish in Kitsune World", 1, 20], ["present", "Find a present in Kitsune World", 1, 25], ["vn", "Open a visual novel", 1, 15], ["story", "Open a story game", 1, 15], ["shrine", "Visit the Fox Shrine", 1, 10], ["den", "Visit your Den", 1, 8], ["lib", "Browse your library", 1, 8], ["web", "Open the browser", 1, 8], ["stats", "Check your reading stats", 1, 8], ["tree", "Hang an ornament on your tree", 1, 10], ["arcade", "Play an Arcade game", 1, 15], ["toy", "Deliver a toy order", 1, 25], ["snowball", "Hit a resident with a snowball", 1, 10], ["snowman", "Build a snowman in Kitsune World", 1, 10], ["crafted", "Craft something in the Workshop", 1, 15], ["fbrun", "Start a Frostbound run", 1, 20], ["reindeer", "Play Reindeer Dash in the Arcade", 1, 20], ["snowfort", "Play Snowfort Defense in the Arcade", 1, 20], ["fbkill", "Defeat 6 foes in Frostbound", 6, 30], ["bellrun", "Earn 60 Snowbells in one day", 60, 25], ["cocoa", "Serve drinks in Cocoa Rush", 1, 20], ["snowplow", "Sweep drifts in Snowplow Sweep", 1, 20], ["ornament", "Toss baubles in Tree Tosser", 1, 20], ["lanterns", "Light Sky Lanterns in the Arcade", 1, 20], ["icicleclimb", "Climb ledges in Icicle Climb", 1, 20], ["giftdrop", "Catch parcels in Sleigh Drop", 1, 20], ["snowmaze", "Collect stars in Frost Dash", 1, 20], ["carolbell", "Ring chimes in Starlight Chime", 1, 20], ["sleighrace", "Carve gates in Sleigh Slalom", 1, 20], ["snowglobe", "Catch flakes in Globe Catcher", 1, 20], ["presentpile", "Stack parcels in Gift Stack", 1, 20], ["icehockey", "Score goals in Pond Puck", 1, 20], ["icecastles", "Defend walls in Glacier Bastion", 1, 20], ["starfetch", "Catch comets in Comet Fetch", 1, 20], ["bellsprint", "Ring bells in Bell Sprint", 1, 20], ["frostslide", "Dodge drifts in Frost Slide", 1, 20]];
export const GOALS = [["pages", "Read 500 pages this Winterfest", 500, 300], ["mins", "Read for 5 hours", 300, 300], ["done", "Finish 3 titles", 3, 250], ["advent", "Open 12 advent doors", 12, 150], ["adventAll", "Open all 25 advent doors", 25, 600], ["well", "Make 50 wishes", 50, 200], ["hatched", "Hatch 3 pets", 3, 200], ["hatchedAll", "Collect all 69 pets", 69, 9000], ["petlv", "Raise a pet to level 12", 12, 300], ["present", "Find all 25 World presents", 25, 400], ["fish", "Catch 20 fish in Kitsune World", 20, 150], ["tree", "Fill your tree with 54 ornaments", 54, 1500], ["play", "Play Snow Catch 15 times", 15, 120], ["quests", "Finish 30 daily quests", 30, 350], ["arcade", "Play 120 Arcade games", 120, 1500], ["toy", "Deliver 25 toy orders", 25, 500], ["crafted", "Craft 40 things in the Workshop", 40, 350], ["snowball", "Land 50 snowballs", 50, 150], ["snowman", "Build 12 snowmen", 12, 120], ["fbrun", "Start 10 Frostbound runs", 10, 250], ["fbwin", "Beat The Chronicle Vault", 1, 3000], ["fbkill", "Defeat 100 Frostbound foes", 100, 600], ["pass80", "Reach Winter Pass Tier 80", 80, 1200], ["allpets18", "Raise 10 pets to level 5", 10, 800], ["wells100", "Make 100 wishes at the Wishing Well", 100, 600], ["crafts75", "Craft 75 items in the Workshop", 75, 700], ["pass100", "Reach Winter Pass Tier 100", 100, 2000], ["snowball100", "Land 100 snowballs", 100, 350], ["toys50", "Deliver 50 toy orders", 50, 1000], ["fish50", "Catch 50 fish in Kitsune World", 50, 450], ["pass120", "Reach Winter Pass Tier 120", 120, 3000], ["snowman24", "Build 24 snowmen", 24, 300], ["quests60", "Finish 60 daily quests", 60, 800], ["fbkill200", "Defeat 200 Frostbound foes", 200, 1200], ["pass140", "Reach Winter Pass Tier 140", 140, 4000], ["arcade200", "Play 200 Arcade games", 200, 2000], ["toys75", "Deliver 75 toy orders", 75, 1400], ["wells150", "Make 150 wishes at the Wishing Well", 150, 900]];

// One door a day. Every door is a real gift.
export const ADVENT = Array.from({ length: 25 }, (_, i) => { const n = i + 1; if (n === 25) return { egg: "l", b: 250 }; if (n === 21) return { egg: "e", b: 60 }; if (n === 14) return { item: "x_star", b: 60 }; if (n === 7) return { egg: "r", b: 40 }; if (n % 6 === 0) return { treat: { feast: 1 }, b: 40 }; if (n % 4 === 0) return { treat: { cane: 2 }, b: 30 }; if (n % 3 === 0) return { treat: { cocoa: 2 }, b: 25 }; return { treat: { cookie: 2 }, b: 15 + n }; });

export const WISH_COST = 10, PITY = 40;
export const ODDS = [["Common", 62, "8 to 25 Snowbells"], ["Uncommon", 21, "Treats"], ["Rare", 12, "A common or rare egg, or an ornament"], ["Epic", 4, "An epic egg or a big Snowbell pouch"], ["Legendary", 1, "A legendary egg or a well-only prize"]];
export const WELL_ONLY = ["th-aurora", "x_star", "holly"];

// One snowfall forecast a day, picked deterministically from the date so every page agrees.
export const FORECAST = ["Light flurries until noon, then thick and storybook by dusk.", "Steady snow all day; the chimney smoke over Hollow Pine will lean east.", "A blizzard is building behind the north ridge. Batten the advent house.", "Clear and sharp tonight; every drift will sparkle like spilled stardust.", "Big lazy flakes from lunchtime onward. Perfect cocoa visibility."];
export const forecast = (d = today()) => { let h = 7; for (const c of String(d)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return `Snowfall Forecast: ${FORECAST[h % FORECAST.length]}`; };
