// Winterfest Village: the event as a real place in Kitsune World. Only laid over the map during the season,
// so saved foxfire, presents and positions from the normal map all stay valid.
import { W, T, TILE, regionAt } from "./data.js";

export const VILLAGE = { x0: 73, y0: 9, x1: 89, y1: 46, cx: 82, cy: 41 };
export const inVillage = (x, y) => x >= VILLAGE.x0 && x <= VILLAGE.x1 && y >= VILLAGE.y0 && y <= VILLAGE.y1;
export const BRACKEN = { x: 82.5, y: 40.5 };
export const SPOTS = [
  { id: "shop", tab: "shop", x: 74, y: 37, w: 4, h: 3, name: "Snowbell Shop", label: "Enter the Snowbell Shop", wall: "#fff1d8", roof: "#c8283a" },
  { id: "well", tab: "well", x: 79, y: 38, w: 3, h: 2, name: "Wishing Well", label: "Make a wish at the well" },
  { id: "advent", tab: "advent", x: 84, y: 37, w: 4, h: 3, name: "Advent House", label: "Open the Advent House", wall: "#e8f0f8", roof: "#256b44" },
  { id: "lodge", tab: "pets", x: 74, y: 42, w: 4, h: 3, name: "Pet Lodge", label: "Enter the Pet Lodge", wall: "#b98a5c", roof: "#eef4fa" },
  { id: "board", tab: "quests", x: 80, y: 43, w: 2, h: 1, name: "Quest Board", label: "Read the Quest Board" },
  { id: "rink", tab: "catch", x: 84, y: 42, w: 4, h: 3, name: "Snow Catch Rink", label: "Play Snow Catch" },
  { id: "frost", tab: "frostbound", x: 78, y: 43, w: 2, h: 1, name: "Frostbound", label: "Set out on Frostbound" },
  { id: "g-sled", tab: "game/sled", booth: "#3f8fe0", x: 74, y: 25, w: 2, h: 1, name: "Sled Run", label: "Play Sled Run" },
  { id: "g-snowball", tab: "game/snowball", booth: "#6cc8ff", x: 77, y: 25, w: 2, h: 1, name: "Snowball Showdown", label: "Play Snowball Showdown" },
  { id: "g-carol", tab: "game/carol", booth: "#9a5be0", x: 80, y: 25, w: 2, h: 1, name: "Carol Hero", label: "Play Carol Hero" },
  { id: "g-chimney", tab: "game/chimney", booth: "#e0343e", x: 83, y: 25, w: 2, h: 1, name: "Chimney Drop", label: "Play Chimney Drop" },
  { id: "g-skate", tab: "game/skate", booth: "#35b8c8", x: 86, y: 25, w: 2, h: 1, name: "Frozen Lake Skate", label: "Play Frozen Lake Skate" },
  { id: "g-stack", tab: "game/stack", booth: "#3fae6a", x: 74, y: 28, w: 2, h: 1, name: "Tree Stacker", label: "Play Tree Stacker" },
  { id: "g-wrap", tab: "game/wrap", booth: "#f2a33a", x: 77, y: 28, w: 2, h: 1, name: "Wrapping Rush", label: "Play Wrapping Rush" },
  { id: "g-memory", tab: "game/memory", booth: "#d3478a", x: 80, y: 28, w: 2, h: 1, name: "Ornament Match", label: "Play Ornament Match" },
  { id: "g-cookie", tab: "game/cookie", booth: "#c98f4e", x: 83, y: 28, w: 2, h: 1, name: "Cookie Copy", label: "Play Cookie Copy" },
  { id: "g-scramble", tab: "game/scramble", booth: "#5a6ae0", x: 86, y: 28, w: 2, h: 1, name: "Carol Scramble", label: "Play Carol Scramble" },
  { id: "g-reindeer", tab: "game/reindeer", booth: "#ffd84d", x: 74, y: 22, w: 2, h: 1, name: "Reindeer Dash", label: "Play Reindeer Dash" },
  { id: "g-icicles", tab: "game/icicles", booth: "#7fe8ff", x: 77, y: 22, w: 2, h: 1, name: "Icicle Dodge", label: "Play Icicle Dodge" },
  { id: "g-bells", tab: "game/bells", booth: "#e05a7a", x: 80, y: 22, w: 2, h: 1, name: "Bell Chorus", label: "Play Sleigh Bell Chorus" },
  { id: "g-snowfort", tab: "game/snowfort", booth: "#3fae6a", x: 83, y: 22, w: 2, h: 1, name: "Snowfort Defense", label: "Play Snowfort Defense" },
  { id: "g-cocoa", tab: "game/cocoa", booth: "#a85a32", x: 74, y: 19, w: 2, h: 1, name: "Cocoa Rush", label: "Play Cocoa Rush" },
  { id: "g-snowplow", tab: "game/snowplow", booth: "#e0343e", x: 77, y: 19, w: 2, h: 1, name: "Snowplow Sweep", label: "Play Snowplow Sweep" },
  { id: "g-ornament", tab: "game/ornament", booth: "#3fae6a", x: 80, y: 19, w: 2, h: 1, name: "Tree Tosser", label: "Play Tree Tosser" },
  { id: "g-lanterns", tab: "game/lanterns", booth: "#ff9a3a", x: 83, y: 19, w: 2, h: 1, name: "Sky Lanterns", label: "Play Sky Lanterns" },
  { id: "g-icicleclimb", tab: "game/icicleclimb", booth: "#7fe8ff", x: 74, y: 16, w: 2, h: 1, name: "Icicle Climb", label: "Play Icicle Climb" },
  { id: "g-giftdrop", tab: "game/giftdrop", booth: "#e0343e", x: 77, y: 16, w: 2, h: 1, name: "Sleigh Drop", label: "Play Sleigh Drop" },
  { id: "g-snowmaze", tab: "game/snowmaze", booth: "#5cf0c0", x: 80, y: 16, w: 2, h: 1, name: "Frost Dash", label: "Play Frost Dash" },
  { id: "g-carolbell", tab: "game/carolbell", booth: "#b58cff", x: 83, y: 16, w: 2, h: 1, name: "Starlight Chime", label: "Play Starlight Chime" },
  { id: "northspire", tab: "frostbound", x: 86, y: 16, w: 3, h: 2, name: "North Pole Spire", label: "Enter North Pole Spire", wall: "#1f3868", roof: "#7fe8ff" },
  { id: "g-sleighrace", tab: "game/sleighrace", booth: "#ff7282", x: 74, y: 13, w: 2, h: 1, name: "Starlight Sleigh", label: "Play Starlight Sleigh" },
  { id: "g-snowglobe", tab: "game/snowglobe", booth: "#7fe8ff", x: 77, y: 13, w: 2, h: 1, name: "Globe Shakers", label: "Play Globe Shakers" },
  { id: "g-presentpile", tab: "game/presentpile", booth: "#ffb54a", x: 80, y: 13, w: 2, h: 1, name: "Present Pile", label: "Play Present Pile" },
  { id: "g-icehockey", tab: "game/icehockey", booth: "#5ef2b6", x: 83, y: 13, w: 2, h: 1, name: "Rink Slapshot", label: "Play Rink Slapshot" },
  { id: "eternalhall", tab: "frostbound", x: 86, y: 13, w: 3, h: 2, name: "Hall of Midwinter", label: "Enter Hall of Midwinter", wall: "#2b2054", roof: "#ffd76a" },
  { id: "g-icecastles", tab: "game/icecastles", booth: "#7fe8ff", x: 74, y: 10, w: 2, h: 1, name: "Glacier Bastion", label: "Play Glacier Bastion" },
  { id: "g-starfetch", tab: "game/starfetch", booth: "#b58cff", x: 77, y: 10, w: 2, h: 1, name: "Comet Fetch", label: "Play Comet Fetch" },
  { id: "g-bellsprint", tab: "game/bellsprint", booth: "#ffd84d", x: 80, y: 10, w: 2, h: 1, name: "Bell Sprint", label: "Play Bell Sprint" },
  { id: "g-frostslide", tab: "game/frostslide", booth: "#5cf0c0", x: 83, y: 10, w: 2, h: 1, name: "Frost Slide", label: "Play Frost Slide" },
  { id: "chroniclevault", tab: "frostbound", x: 86, y: 10, w: 3, h: 2, name: "Chronicle Vault", label: "Enter Chronicle Vault", wall: "#1a2444", roof: "#ff9a3a" },
  { id: "yulehall", tab: "pass", x: 86, y: 19, w: 3, h: 2, name: "Yule Feast Hall", label: "Enter Yule Feast Hall", wall: "#8a2f2c", roof: "#ffd84d" },
  { id: "solstice", tab: "tree", x: 86, y: 22, w: 3, h: 2, name: "Grand Yule Tree", label: "Decorate the Grand Yule Tree", wall: "#2f7a4e", roof: "#ffd84d" },
  { id: "arcade", tab: "arcade", x: 74, y: 31, w: 5, h: 3, name: "Winterfest Arcade", label: "Enter the Arcade", wall: "#3a2a6a", roof: "#e0343e" },
  { id: "workshop", tab: "workshop", x: 80, y: 31, w: 4, h: 3, name: "Santa's Workshop", label: "Enter the Workshop", wall: "#a5703a", roof: "#2f6b48" },
  { id: "pass", tab: "pass", x: 85, y: 31, w: 4, h: 3, name: "Winter Pass Lodge", label: "Check your Winter Pass", wall: "#d8e6f2", roof: "#3f6fb8" },
];
export const spotDoor = (p) => [(p.x + p.w / 2) * T, (p.y + p.h + .45) * T];

export function applyVillage(map) {
  const { g, solid, reach, orbs } = map, V = VILLAGE;
  for (let y = V.y0; y <= V.y1; y++) for (let x = V.x0; x <= V.x1; x++) { const i = y * W + x; if (g[i] === TILE.water) continue; g[i] = y === V.cy || y === 35 || y === 27 || y === 24 || y === 21 || y === 18 || y === 15 || y === 12 || y === 30 || x === 79 && y >= 12 && y <= 35 || x === 84 && y >= 30 && y <= 35 || (x === V.cx || x === V.cx + 1) && y >= 35 ? TILE.plaza : TILE.snow; solid[i] = 0; reach[i] = 1; }
  for (const p of SPOTS) for (let y = p.y; y < p.y + p.h; y++) for (let x = p.x; x < p.x + p.w; x++) { const i = y * W + x; solid[i] = 1; reach[i] = 0; }
  for (const o of orbs) { const p = SPOTS.find((q) => o.x >= q.x && o.x < q.x + q.w && o.y >= q.y && o.y < q.y + q.h); if (p) { o.x = p.x; o.y = p.y + p.h; } }
}

// One lost reindeer per region, on ground the player can always reach.
const DEER = ["Dasher-by-the-Door", "Mistle", "Comet's Cousin", "Old Tinsel", "Nutmeg", "Sleet", "Juniper", "Little Thursday"];
export function deerSpots(map) {
  const out = [], seen = new Set();
  map.orbs.forEach((o, i) => { if (i % 3 !== 2 || inVillage(o.x, o.y) || o.x >= 120 || o.y >= 90) return; const r = regionAt(o.x, o.y); if (seen.has(r)) return; seen.add(r); out.push({ id: r, name: DEER[out.length], x: (o.x + .5) * T, y: (o.y + .5) * T }); });
  map.orbs.forEach((o) => { if (inVillage(o.x, o.y) || o.x >= 120 || o.y >= 90) return; const r = regionAt(o.x, o.y); if (seen.has(r)) return; seen.add(r); out.push({ id: r, name: DEER[out.length], x: (o.x + .5) * T, y: (o.y + .5) * T }); });
  return out;
}

const line = (g, w = 3) => { g.strokeStyle = "#1b1d33"; g.lineWidth = w; };
const sign = (g, text, x, y) => { g.font = "800 12px system-ui"; g.textAlign = "center"; const w = g.measureText(text).width + 14; g.fillStyle = "rgba(20,24,52,.88)"; g.fillRect(x - w / 2, y - 14, w, 19); g.fillStyle = "#ffe9b0"; g.fillText(text, x, y); };
function lights(g, x, y, w, now, still) { for (let i = 0; i <= 8; i++) { const a = x + w * i / 8, b = y + Math.sin(i / 8 * Math.PI * 4) * 3 + 4; g.fillStyle = (Math.floor(now / 480) + i) % 2 && !still ? "#fff4bf" : ["#e0343e", "#ffd27a", "#3fae6a", "#6cc8ff"][i % 4]; g.beginPath(); g.arc(a, b, 3, 0, 7); g.fill(); } }

export function drawSpot(g, p, now, night, still) {
  const x = p.x * T, y = p.y * T, w = p.w * T, h = p.h * T, cx = x + w / 2;
  g.fillStyle = "rgba(0,0,0,.18)"; g.fillRect(x + 4, y + h - 5, w, 10);
  if (p.booth) {
    g.fillStyle = "#6a4528"; g.fillRect(x + 4, y - 30, 5, 60); g.fillRect(x + w - 9, y - 30, 5, 60); g.fillStyle = "#7c5a38"; g.fillRect(x + 1, y + 8, w - 2, 22); line(g, 2); g.strokeRect(x + 1, y + 8, w - 2, 22); for (let i = 0; i < 4; i++) { g.fillStyle = i % 2 ? "#fff" : p.booth; g.fillRect(x - 3 + i * (w + 6) / 4, y - 36, (w + 6) / 4, 14); } line(g, 2); g.strokeRect(x - 3, y - 36, w + 6, 14); g.fillStyle = p.booth; g.beginPath(); g.arc(cx, y - 4, 8 + (still ? 0 : Math.sin(now / 300 + x) * 1.5), 0, 7); g.fill(); g.fillStyle = "#fff"; g.fillRect(cx - 2, y - 6, 4, 4); g.font = "800 10px system-ui"; g.textAlign = "center"; const bw = g.measureText(p.name).width + 10; g.fillStyle = "rgba(20,24,52,.9)"; g.fillRect(cx - bw / 2, y - 53, bw, 15); g.fillStyle = "#ffe9b0"; g.fillText(p.name, cx, y - 42); return;
  }
  if (p.id === "well") {
    g.fillStyle = "#6a4528"; g.fillRect(x + 14, y - 22, 7, 62); g.fillRect(x + w - 21, y - 22, 7, 62); g.fillStyle = "#7a3f2c"; g.beginPath(); g.moveTo(x, y - 18); g.lineTo(cx, y - 52); g.lineTo(x + w, y - 18); g.fill(); line(g); g.stroke(); g.fillStyle = "#fff"; g.fillRect(x + 8, y - 21, w - 16, 4);
    g.fillStyle = "#8f94a8"; g.beginPath(); g.ellipse(cx, y + h - 22, w / 2 - 2, 20, 0, 0, 7); g.fill(); g.fillRect(x + 2, y + h - 22, w - 4, 20); line(g); g.stroke(); g.fillStyle = "#1c4d82"; g.beginPath(); g.ellipse(cx, y + h - 25, w / 2 - 12, 11, 0, 0, 7); g.fill(); if (!still) { g.strokeStyle = "#9fdcff"; g.lineWidth = 2; g.beginPath(); g.ellipse(cx, y + h - 25, ((now / 40) % 28) + 3, ((now / 40) % 9) + 1, 0, 0, 7); g.stroke(); }
  } else if (p.id === "frost") {
    g.fillStyle = "#2a3f6a"; g.beginPath(); g.moveTo(x + 4, y + 30); g.lineTo(x + 4, y - 18); g.quadraticCurveTo(cx, y - 52, x + w - 4, y - 18); g.lineTo(x + w - 4, y + 30); g.fill(); line(g); g.stroke(); g.fillStyle = still ? "#8fd8ff" : `hsl(${195 + Math.sin(now / 500) * 18} 90% 72%)`; g.beginPath(); g.moveTo(x + 12, y + 30); g.lineTo(x + 12, y - 14); g.quadraticCurveTo(cx, y - 40, x + w - 12, y - 14); g.lineTo(x + w - 12, y + 30); g.fill();
  } else if (p.id === "board") {
    g.fillStyle = "#6a4528"; g.fillRect(x + 6, y - 6, 6, 38); g.fillRect(x + w - 12, y - 6, 6, 38); g.fillStyle = "#a97b52"; g.fillRect(x, y - 24, w, 36); line(g); g.strokeRect(x, y - 24, w, 36); [["#fff4d8", 7, -19], ["#ffd9d4", 26, -17], ["#dff0dc", 45, -20]].forEach(([c, a, b]) => { g.fillStyle = c; g.fillRect(x + a, y + b, 13, 19); }); g.fillStyle = "#fff"; g.fillRect(x - 2, y - 28, w + 4, 5);
  } else if (p.id === "rink") {
    g.fillStyle = "#bfe6f7"; g.beginPath(); g.roundRect(x, y + 4, w, h - 6, 16); g.fill(); line(g); g.stroke(); g.strokeStyle = "rgba(255,255,255,.9)"; g.lineWidth = 2; for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(x + 34 + i * 30, y + 44 + (i % 2) * 14, 16, .4, 4); g.stroke(); } const t = still ? 0 : now / 800; g.fillStyle = "#e0343e"; g.fillRect(cx + Math.sin(t) * 34 - 7, y + 40 + Math.cos(t) * 16, 14, 13); g.fillStyle = "#ffd27a"; g.fillRect(cx + Math.sin(t) * 34 - 2, y + 40 + Math.cos(t) * 16, 4, 13);
  } else {
    const top = y + h * .38; g.fillStyle = p.wall; g.fillRect(x, top, w, h - h * .38); line(g); g.strokeRect(x, top, w, h - h * .38); g.fillStyle = p.roof; g.beginPath(); g.moveTo(x - 10, top + 3); g.lineTo(x + 14, y - 8); g.lineTo(x + w - 14, y - 8); g.lineTo(x + w + 10, top + 3); g.closePath(); g.fill(); g.stroke(); g.fillStyle = "#fff"; g.beginPath(); g.moveTo(x + 14, y - 8); g.lineTo(x + w - 14, y - 8); g.lineTo(x + w - 7, y + 3); g.quadraticCurveTo(cx, y + 12, x + 7, y + 3); g.fill();
    for (const a of [x + 12, x + w - 34]) { g.fillStyle = night ? "#ffd982" : "#a8d8ee"; g.fillRect(a, top + 12, 22, 20); line(g, 2); g.strokeRect(a, top + 12, 22, 20); }
    g.fillStyle = "#7a3a2a"; g.fillRect(cx - 13, y + h - 38, 26, 38); line(g, 2); g.strokeRect(cx - 13, y + h - 38, 26, 38); g.strokeStyle = "#2f7a4e"; g.lineWidth = 5; g.beginPath(); g.arc(cx, y + h - 24, 7, 0, 7); g.stroke(); g.fillStyle = "#e0343e"; g.beginPath(); g.arc(cx, y + h - 17, 3, 0, 7); g.fill(); lights(g, x, top - 2, w, now, still);
  }
  sign(g, p.name, cx, p.id === "well" ? y - 56 : p.id === "frost" ? y - 44 : p.id === "board" ? y - 34 : p.id === "rink" ? y - 4 : y - 14);
}
