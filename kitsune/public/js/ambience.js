// Reading soundscapes, generated live with Web Audio: no files to download, so they work offline.
// Each one is a bed of shaped noise plus small scheduled events (raindrops, crackles, crickets).

export const SOUNDSCAPES = [
  ["", "Off", "–"],
  ["rain", "Rain", "☂︎"],
  ["fire", "Fire", "♨︎"],
  ["waves", "Waves", "≈"],
  ["night", "Night", "☾︎"],
  ["deep", "Deep", "◎︎"],
];

let ctx = null, master = null, bus = null, current = "", timers = [], sources = [];
const bufs = {};

function ensure() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.4;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}

// Four seconds of stereo noise: white, pink or brown.
function noise(kind) {
  if (bufs[kind]) return bufs[kind];
  const len = ctx.sampleRate * 4, buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    let last = 0, b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      if (kind === "brown") { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
      else if (kind === "pink") {
        b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.969 * b2 + w * 0.153852;
        b3 = 0.8665 * b3 + w * 0.3104856; b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898;
        d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11; b6 = w * 0.115926;
      } else d[i] = w;
    }
  }
  return (bufs[kind] = buf);
}

const filt = (type, freq, q = 0.7) => { const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q; return f; };
const amp = (v) => { const g = ctx.createGain(); g.gain.value = v; return g; };

// A looping noise bed through a chain of nodes, into the current bus.
function bed(kind, ...chain) {
  const s = ctx.createBufferSource();
  s.buffer = noise(kind); s.loop = true;
  let n = s;
  for (const node of chain) { n.connect(node); n = node; }
  n.connect(bus);
  s.start(0, Math.random() * 3);
  sources.push(s);
  return s;
}

// A short shaped burst of noise: a raindrop, an ember pop.
function burst({ dur, freq, q = 1, gain = 0.3, type = "bandpass", pan = 0 }) {
  if (!bus) return;
  const t = ctx.currentTime, s = ctx.createBufferSource(), f = filt(type, freq, q), g = ctx.createGain();
  s.buffer = noise("white");
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + 0.003);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  let out = g;
  if (ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = pan; g.connect(p); out = p; }
  s.connect(f); f.connect(g); out.connect(bus);
  s.start(t, Math.random() * 3, dur + 0.05);
}

// A cricket: a few quick high pulses.
function chirp(pan) {
  if (!bus) return;
  const t0 = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
  o.frequency.value = 4200 + Math.random() * 500;
  g.gain.value = 0;
  for (let k = 0; k < 3; k++) { const t = t0 + k * 0.07; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.035, t + 0.012); g.gain.linearRampToValueAtTime(0, t + 0.045); }
  let out = g;
  if (ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = pan; g.connect(p); out = p; }
  o.connect(g); out.connect(bus);
  o.start(t0); o.stop(t0 + 0.3);
}

// Run fn at random intervals between min and max milliseconds until the soundscape stops.
function every(fn, min, max) {
  const h = { id: 0 };
  const tick = () => { if (!bus) return; try { fn(); } catch {} h.id = setTimeout(tick, min + Math.random() * (max - min)); };
  h.id = setTimeout(tick, Math.random() * min);
  timers.push(h);
}

// A slow swell on a gain node, for waves and wind.
function swell(g, low, high, period) {
  const t = ctx.currentTime;
  for (let k = 0; k < 400; k++) {
    const at = t + k * period / 2;
    g.gain.setTargetAtTime(k % 2 ? low : high, at, period / 5);
  }
}

const BUILD = {
  rain() {
    bed("pink", filt("highpass", 500), filt("lowpass", 7000), amp(0.55));
    bed("brown", filt("lowpass", 400), amp(0.35));
    every(() => burst({ dur: 0.03 + Math.random() * 0.04, freq: 2500 + Math.random() * 3500, q: 2, gain: 0.05 + Math.random() * 0.12, pan: Math.random() * 1.6 - 0.8 }), 25, 110);
  },
  fire() {
    const g = amp(0.6);
    bed("brown", filt("lowpass", 520), g);
    swell(g, 0.45, 0.7, 3.2);
    every(() => burst({ dur: 0.008 + Math.random() * 0.03, freq: 1800 + Math.random() * 4000, q: 1.5, gain: 0.15 + Math.random() * 0.35, pan: Math.random() * 0.8 - 0.4 }), 60, 420);
    every(() => { for (let k = 0; k < 4; k++) setTimeout(() => burst({ dur: 0.012, freq: 3000 + Math.random() * 3000, q: 2, gain: 0.12, pan: Math.random() * 0.6 - 0.3 }), k * (20 + Math.random() * 40)); }, 1800, 5200);
  },
  waves() {
    const g = amp(0.2), lp = filt("lowpass", 900);
    bed("brown", lp, g);
    swell(g, 0.08, 0.85, 9);
    const t = ctx.currentTime;
    for (let k = 0; k < 400; k++) lp.frequency.setTargetAtTime(k % 2 ? 400 : 1600, t + k * 4.5, 1.6);
    bed("pink", filt("highpass", 2500), amp(0.03));
  },
  night() {
    const g = amp(0.12);
    bed("pink", filt("lowpass", 700), g);
    swell(g, 0.06, 0.18, 7);
    every(() => chirp(-0.6), 700, 1500);
    every(() => chirp(0.55), 900, 2100);
  },
  deep() {
    bed("brown", filt("lowpass", 900), amp(0.7));
  },
};

export function currentSoundscape() { return current; }

export function setSoundscapeVolume(v) {
  if (!ctx) return;
  master.gain.setTargetAtTime(Math.max(0, Math.min(1, v)) * 0.9, ctx.currentTime, 0.15);
}

export function stopSoundscape() {
  timers.forEach((h) => clearTimeout(h.id)); timers = [];
  if (bus && ctx) {
    const old = bus, olds = sources;
    old.gain.setTargetAtTime(0, ctx.currentTime, 0.25);
    setTimeout(() => { olds.forEach((s) => { try { s.stop(); } catch {} }); try { old.disconnect(); } catch {} }, 1400);
  }
  bus = null; sources = []; current = "";
}

// Start a soundscape by name ("" stops). Volume is 0–1.
export function playSoundscape(kind, volume = 0.4) {
  stopSoundscape();
  if (!kind || !BUILD[kind]) return false;
  if (!ensure()) return false;
  bus = ctx.createGain();
  bus.gain.value = 0;
  bus.connect(master);
  setSoundscapeVolume(volume);
  BUILD[kind]();
  bus.gain.setTargetAtTime(1, ctx.currentTime, 0.6);
  current = kind;
  return true;
}
