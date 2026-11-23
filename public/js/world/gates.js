// The two ways out of Kitsune World: Blackwood's iron gate and the crack in the Seam. Hidden on kids' profiles.
import { W, T } from "./data.js";

export const GATES = [
  { id: "blackwood", name: "The Blackwood Gate", x: 66, y: 60, cx: 67.5, cy: 61, label: "Enter Blackwood University", warn: "Blackwood University. Rated R, like the show: strong language, gore, death, grief and suicide as a theme, with no method shown. Everyone here is already dead, and that includes you in about four minutes." },
  { id: "blackwood2", name: "The Meridian Gate", x: 74, y: 60, cx: 75.5, cy: 61, label: "Enter Deep Blackwood", warn: "Deep Blackwood · Meridian & The Lower Archive. Rated R, like the late Blackwood episodes: Meridian Station, the Lower Screaming, and the wall Yuki opened." },
  { id: "backrooms", name: "The Wrong Wall", x: 43, y: 50, cx: 44.5, cy: 51, label: "Lean on the wall", warn: "Backrooms: No Wind Resistance. The scripts' own warning applies: abandonment, people traded as goods, body horror, cults, drug use and adult language. Never trust a smile in the dark." },
  { id: "incarnate", name: "The Crack in the Seam", x: 34, y: 50, cx: 35.5, cy: 51, label: "Step through the Seam", warn: "The Corruption Saga. The book's own warning applies: self-harm themes, twisted religious ideals, survivor's guilt, PTSD, trauma, adult language, murder and body horror. Read at your own risk." },
  { id: "express", name: "The Spirit Express", x: 99, y: 76, cx: 100.5, cy: 77, label: "Board the Spirit Express", warn: "The Spirit Express · Midnight Line. A 6-car starlight train departing from Platform Zero toward the Star-Coal Locomotive." },
  { id: "citadel", name: "The Starlight Gate", x: 60, y: 18, cx: 61.5, cy: 19, label: "Ascend to The Starlight Citadel", warn: "The Starlight Citadel. Five suspended halls of frost, glass, and nine-tail starlight high above The High Post." },
  { id: "undermarket", name: "The Lantern Under-Market", x: 60, y: 74, cx: 61.5, cy: 75, label: "Descend to the Under-Market", warn: "The Lantern Under-Market. Six subterranean bazaar halls beneath The Night Market." },
  { id: "clockworks", name: "The Hollow Clockworks", x: 19, y: 45, cx: 20.5, cy: 46, label: "Enter The Hollow Clockworks", warn: "The Hollow Clockworks. Five brass gear-chambers turning beneath Brask's Great Clock." },
  { id: "emeraldvault", name: "The Emerald Root-Vault", x: 104, y: 42, cx: 105.5, cy: 43, label: "Enter The Emerald Root-Vault", warn: "The Emerald Root-Vault. Five crystal chambers beneath The Emerald Palace in Oz." },
];
export function applyGates(map) {
  const { g, solid, reach } = map;
  for (const p of GATES) for (let y = p.y - 1; y <= p.y + 3; y++) for (let x = p.x - 1; x <= p.x + 4; x++) { const i = y * W + x; if (solid[i] && g[i] !== 2) g[i] = 0; if (g[i] !== 2) { solid[i] = 0; reach[i] = 1; } }
}
const plate = (g, text, x, y, bg, ink) => { g.font = "800 12px system-ui"; g.textAlign = "center"; const w = g.measureText(text).width + 14; g.fillStyle = bg; g.fillRect(x - w / 2, y - 14, w, 19); g.fillStyle = ink; g.fillText(text, x, y); };
export function drawGate(g, p, now, still) {
  const x = p.cx * T, y = p.cy * T;
  if (p.id === "blackwood") {
    g.fillStyle = "#23212b"; g.fillRect(x - 54, y - 62, 15, 76); g.fillRect(x + 39, y - 62, 15, 76); g.fillStyle = "#3a3744"; g.beginPath(); g.moveTo(x - 58, y - 62); g.lineTo(x - 46, y - 80); g.lineTo(x - 35, y - 62); g.moveTo(x + 35, y - 62); g.lineTo(x + 46, y - 80); g.lineTo(x + 58, y - 62); g.fill();
    g.strokeStyle = "#17161d"; g.lineWidth = 3; for (let i = -36; i <= 36; i += 9) { g.beginPath(); g.moveTo(x + i, y + 12); g.lineTo(x + i, y - 44 - Math.cos(i / 36 * 1.57) * 18); g.stroke(); } g.beginPath(); g.moveTo(x - 39, y - 18); g.lineTo(x + 39, y - 18); g.moveTo(x - 39, y - 44); g.quadraticCurveTo(x, y - 76, x + 39, y - 44); g.stroke();
    g.fillStyle = "#57525f"; for (const a of [-46, 46]) { g.beginPath(); g.arc(x + a, y - 88, 7, 0, 7); g.fill(); g.fillRect(x + a - 9, y - 86, 18, 6); }
    plate(g, "BLACKWOOD UNIVERSITY", x, y - 88, "#141219", "#e8dcc0"); plate(g, "STILL ACCREDITED", x, y + 30, "#7a1422", "#fff");
    return;
  }
  if (p.id === "blackwood2") {
    g.fillStyle = "#182034"; g.fillRect(x - 42, y - 62, 12, 74); g.fillRect(x + 30, y - 62, 12, 74);
    g.fillStyle = "#0b101c"; g.fillRect(x - 30, y - 56, 60, 68);
    g.strokeStyle = "#49d0ff"; g.lineWidth = 2.5; g.strokeRect(x - 30, y - 56, 60, 68);
    g.fillStyle = `rgba(73,208,255,${still ? .35 : .25 + Math.sin(now / 360) * .15})`; g.fillRect(x - 26, y - 52, 52, 60);
    plate(g, "DEEP BLACKWOOD", x, y - 74, "#0b101c", "#9fe8ff"); plate(g, "MERIDIAN GATE", x, y + 28, "#182034", "#49d0ff");
    return;
  }
  if (p.id === "backrooms") { g.fillStyle = "#c8b655"; g.fillRect(x - 40, y - 62, 80, 74); g.strokeStyle = "#6f6228"; g.lineWidth = 3; g.strokeRect(x - 40, y - 62, 80, 74); g.fillStyle = "#a8963f"; for (let i = -34; i < 40; i += 11) g.fillRect(x + i, y - 61, 2, 72); g.fillStyle = "#6f6228"; g.fillRect(x - 40, y + 3, 80, 9); const f = still || Math.sin(now / 70) > -.85; g.fillStyle = f ? "#fff6c2" : "#7d7444"; g.fillRect(x - 24, y - 72, 48, 6); if (!still && Math.sin(now / 900) > .55) { g.fillStyle = "rgba(0,0,0,.55)"; g.fillRect(x - 8 + Math.sin(now / 40) * 3, y - 40, 18, 52); } plate(g, "DON'T LEAN ON THIS", x, y + 30, "#2a2510", "#ffe98a"); return; }
  if (p.id === "express") { g.fillStyle = "#2b1d18"; g.fillRect(x - 44, y - 58, 88, 70); g.strokeStyle = "#d9a84e"; g.lineWidth = 3; g.strokeRect(x - 44, y - 58, 88, 70); g.fillStyle = "#7a1c28"; g.fillRect(x - 46, y - 66, 92, 12); g.fillStyle = `rgba(255,216,120,${still ? .65 : .55 + Math.sin(now / 320) * .2})`; g.beginPath(); g.arc(x, y - 34, 13, 0, 7); g.fill(); plate(g, "SPIRIT EXPRESS", x, y - 78, "#2b1d18", "#ffe8b0"); plate(g, "BOARDING NOW", x, y + 28, "#7a1c28", "#ffe8b0"); return; }
  if (p.id === "citadel") { g.fillStyle = "#1c2440"; g.fillRect(x - 42, y - 60, 84, 72); g.strokeStyle = "#9fe0ff"; g.lineWidth = 3; g.strokeRect(x - 42, y - 60, 84, 72); g.fillStyle = `rgba(159,224,255,${still ? .45 : .35 + Math.sin(now / 280) * .18})`; g.beginPath(); g.arc(x, y - 24, 16, 0, 7); g.fill(); plate(g, "STARLIGHT CITADEL", x, y - 74, "#040814", "#9fe0ff"); plate(g, "HIGH POST GATE", x, y + 28, "#1c2440", "#e8f4ff"); return; }
  if (p.id === "undermarket") { g.fillStyle = "#22182c"; g.fillRect(x - 42, y - 58, 84, 70); g.strokeStyle = "#ff8a3a"; g.lineWidth = 3; g.strokeRect(x - 42, y - 58, 84, 70); g.fillStyle = `rgba(255,138,58,${still ? .5 : .4 + Math.sin(now / 300) * .2})`; g.beginPath(); g.arc(x, y - 24, 14, 0, 7); g.fill(); plate(g, "UNDER-MARKET", x, y - 72, "#22182c", "#ffe8b0"); plate(g, "NIGHT BAZAAR", x, y + 28, "#4a2238", "#ff8a3a"); return; }
  if (p.id === "clockworks") { g.fillStyle = "#241d18"; g.fillRect(x - 42, y - 58, 84, 70); g.strokeStyle = "#c79a2e"; g.lineWidth = 3; g.strokeRect(x - 42, y - 58, 84, 70); g.fillStyle = "#fff4d6"; g.beginPath(); g.arc(x, y - 24, 16, 0, 7); g.fill(); g.strokeStyle = "#111"; g.beginPath(); g.moveTo(x, y - 24); g.lineTo(x, y - 34); g.moveTo(x, y - 24); g.lineTo(x + 8, y - 24); g.stroke(); plate(g, "CLOCKWORKS", x, y - 72, "#241d18", "#fff1c8"); plate(g, "BRASK VAULT", x, y + 28, "#5a4220", "#ffd84d"); return; }
  if (p.id === "emeraldvault") { g.fillStyle = "#123828"; g.fillRect(x - 42, y - 58, 84, 70); g.strokeStyle = "#35d68a"; g.lineWidth = 3; g.strokeRect(x - 42, y - 58, 84, 70); g.fillStyle = `rgba(53,214,138,${still ? .5 : .4 + Math.sin(now / 260) * .2})`; g.beginPath(); g.moveTo(x, y - 44); g.lineTo(x + 16, y - 24); g.lineTo(x, y - 4); g.lineTo(x - 16, y - 24); g.closePath(); g.fill(); plate(g, "EMERALD VAULT", x, y - 72, "#123828", "#d8fff0"); plate(g, "LAND OF OZ", x, y + 28, "#1f5a3e", "#35d68a"); return; }
  const t = still ? 0 : now / 260; g.save(); g.shadowColor = "#ff2a3c"; g.shadowBlur = 18 + Math.sin(t) * 6; g.fillStyle = "#12060c"; g.beginPath(); g.moveTo(x + 2, y - 74); for (let i = 1; i <= 8; i++) g.lineTo(x + (i % 2 ? 14 + i : -3) + Math.sin(t + i) * 1.5, y - 74 + i * 11); g.lineTo(x, y + 18); for (let i = 8; i >= 1; i--) g.lineTo(x - (i % 2 ? 4 : 17 + i) + Math.sin(t + i) * 1.5, y - 74 + i * 11); g.closePath(); g.fill(); g.strokeStyle = "#ff3a48"; g.lineWidth = 2.5; g.stroke(); g.restore();
  for (let i = 0; i < 9; i++) { const a = (i * 2.4 + (still ? 0 : now / 1400)) % 6.28, r = 20 + (i * 7) % 28; g.fillStyle = i % 3 ? "#ff3a48" : "#ffd27a"; g.fillRect(x + Math.cos(a) * r - 2, y - 30 + Math.sin(a) * r * 1.3 - 2, 4, 4); }
  plate(g, "THE SEAM", x, y - 84, "#16060c", "#ff8a92");
}
