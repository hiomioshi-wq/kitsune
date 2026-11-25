// Things you can just do in the snow: throw snowballs at the residents and build snowmen that stay where you put them.
import { W, T, TILE } from "./data.js";

const REPLY = ["Oi!", "Right. That's war.", "Who threw that?!", "I felt that in my soul.", "Very mature.", "You'll pay for that.", "My good scarf!", "Do it again, I dare you.", "Ha! Terrible aim. Oh, wait.", "That went down my neck.", "I'm telling Kitsu.", "Snow in the ear. Lovely."];
const HITBACK = ["Take that!", "Got you back!", "Fair's fair!"];
const FACE = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const MAX = 12;

export function createWinterPlay(api) {
  const { s, map, people, ping, toast, dir, burst, calm, award } = api; s.snowmen ||= [];
  let balls = [], bubbles = [], incoming = [], cool = 0;
  const say = (x, y, t) => { bubbles = bubbles.filter((b) => Math.hypot(b.x - x, b.y - y) > 10); bubbles.push({ x, y, t, life: 2.4 }); };
  function toss() { if (cool > 0) return; cool = .32; const [a, b] = FACE[dir()]; balls.push({ x: s.x + a * 14, y: s.y - 6 + b * 10, vx: a * 470, vy: b * 470, life: .95 }); ping("blip"); }
  function snowman() {
    const near = s.snowmen.findIndex((m) => Math.hypot(m.x - s.x, m.y - s.y) < 44); if (near >= 0) { const m = s.snowmen[near]; s.snowmen.splice(near, 1); burst({ x: m.x, y: m.y + 20 }, 16); api.save(); ping("choice"); return toast("You knocked your snowman over."); }
    if (s.snowmen.length >= MAX) return toast(`You've built all ${MAX}. Press P next to one to knock it down.`);
    const [a, b] = FACE[dir()], x = s.x + a * 38, y = s.y + b * 38 + 4, tx = Math.floor(x / T), ty = Math.floor(y / T); if (tx < 0 || ty < 0 || map.solid[ty * W + tx] || map.g[ty * W + tx] === TILE.water) return toast("You can't build there.");
    s.snowmen.push({ x, y, hat: s.snowmen.length % 4, at: Date.now() }); burst({ x, y: y + 20 }, 12); ping("done"); api.bump("snowman"); api.save(); if (s.snowmen.length === MAX) toast("A whole snowman army. Stand proud."); else toast(`Snowman built (${s.snowmen.length} of ${MAX}). P next to it knocks it down.`);
  }
  function update(dt) {
    cool -= dt; for (const b of balls) { b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt; const tx = Math.floor(b.x / T), ty = Math.floor((b.y + 10) / T); if (tx >= 0 && ty >= 0 && tx < W && map.solid[ty * W + tx] && ![TILE.water].includes(map.g[ty * W + tx])) { b.life = 0; burst({ x: b.x, y: b.y + 20 }, 5); continue; }
      for (const p of people) if (Math.hypot(p.x - b.x, p.y - 18 - b.y) < 26) { b.life = 0; burst({ x: p.x, y: p.y }, 9); ping("blip"); say(p.x, p.y - 74, REPLY[Math.floor(Math.random() * REPLY.length)]); api.hit(p); if (Math.random() < .45) incoming.push({ x: p.x, y: p.y - 20, tx: s.x, ty: s.y - 8, t: 0, from: p, delay: .55 }); break; }
      for (const m of s.snowmen) if (Math.hypot(m.x - b.x, m.y - 10 - b.y) < 22) { b.life = 0; burst({ x: m.x, y: m.y + 8 }, 7); m.wob = 1; break; } }
    balls = balls.filter((b) => b.life > 0); for (const m of s.snowmen) if (m.wob) m.wob = Math.max(0, m.wob - dt * 2);
    for (const q of incoming) { if ((q.delay -= dt) > 0) continue; q.t += dt * 2.4; q.cx = q.x + (q.tx - q.x) * Math.min(1, q.t); q.cy = q.y + (q.ty - q.y) * Math.min(1, q.t) - Math.sin(Math.min(1, q.t) * 3.14) * 34; if (q.t >= 1) { q.done = 1; if (Math.hypot(q.tx - s.x, q.ty - (s.y - 8)) < 24) { burst({ x: s.x, y: s.y + 8 }, 10); ping("blip"); say(q.from.x, q.from.y - 74, HITBACK[Math.floor(Math.random() * HITBACK.length)]); } } }
    incoming = incoming.filter((q) => !q.done); for (const b of bubbles) b.life -= dt; bubbles = bubbles.filter((b) => b.life > 0);
  }
  function draw(g, things, camX, camY, vw, vh, now) {
    const see = (x, y) => x > camX - 40 && x < camX + vw + 40 && y > camY - 60 && y < camY + vh + 40;
    for (const m of s.snowmen) if (see(m.x, m.y)) things.push([m.y + 12, () => { const w = m.wob && !calm() ? Math.sin(now / 40) * m.wob * 4 : 0; g.fillStyle = "rgba(0,0,0,.2)"; g.beginPath(); g.ellipse(m.x, m.y + 13, 15, 5, 0, 0, 7); g.fill(); g.fillStyle = "#fff"; g.strokeStyle = "#b8c8d8"; g.lineWidth = 1.5; g.beginPath(); g.arc(m.x, m.y + 2, 14, 0, 7); g.fill(); g.stroke(); g.beginPath(); g.arc(m.x + w, m.y - 17, 10, 0, 7); g.fill(); g.stroke(); g.fillStyle = "#1b1d33"; g.fillRect(m.x + w - 4, m.y - 20, 2, 2); g.fillRect(m.x + w + 2, m.y - 20, 2, 2); g.fillStyle = "#f2892e"; g.fillRect(m.x + w, m.y - 17, 7, 2); g.fillStyle = ["#d3312f", "#3f8fe0", "#3fae6a", "#9a5be0"][m.hat]; g.fillRect(m.x - 11, m.y - 9, 22, 4); if (m.hat % 2) { g.fillStyle = "#23233a"; g.fillRect(m.x + w - 7, m.y - 35, 14, 10); g.fillRect(m.x + w - 11, m.y - 26, 22, 2); } else { g.beginPath(); g.moveTo(m.x + w - 9, m.y - 25); g.lineTo(m.x + w, m.y - 38); g.lineTo(m.x + w + 9, m.y - 25); g.fill(); } }]);
    for (const b of balls) things.push([b.y + 16, () => { g.fillStyle = "rgba(0,0,0,.18)"; g.beginPath(); g.ellipse(b.x, b.y + 18, 5, 2, 0, 0, 7); g.fill(); g.fillStyle = "#fff"; g.strokeStyle = "#9ab8cc"; g.lineWidth = 1.5; g.beginPath(); g.arc(b.x, b.y, 6, 0, 7); g.fill(); g.stroke(); }]);
    for (const q of incoming) if (q.cx != null) things.push([q.cy + 30, () => { g.fillStyle = "#fff"; g.strokeStyle = "#9ab8cc"; g.beginPath(); g.arc(q.cx, q.cy, 6, 0, 7); g.fill(); g.stroke(); }]);
  }
  function overlay(g) { g.font = "800 12px system-ui"; g.textAlign = "center"; for (const b of bubbles) { const w = g.measureText(b.t).width + 16; g.globalAlpha = Math.min(1, b.life * 2); g.fillStyle = "#fff8ea"; g.strokeStyle = "#1b1d33"; g.lineWidth = 2; g.beginPath(); g.roundRect(b.x - w / 2, b.y - 18, w, 24, 8); g.fill(); g.stroke(); g.beginPath(); g.moveTo(b.x - 5, b.y + 6); g.lineTo(b.x, b.y + 13); g.lineTo(b.x + 5, b.y + 6); g.fill(); g.fillStyle = "#262033"; g.fillText(b.t, b.x, b.y); } g.globalAlpha = 1; }
  void award; return { toss, snowman, update, draw, overlay, get balls() { return balls; }, get bubbles() { return bubbles; } };
}
