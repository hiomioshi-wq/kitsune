// Interface sound effects, synthesised on the device (no audio files). Off until you pick a pack.
// Fairground extras — ticket, spin, fortune and plush — ride the same packs; only their note patterns differ.
export const SOUND_PACKS = { sleigh: "Sleigh bells", musicbox: "Music box", off: "Off", soft: "Soft taps", paper: "Paper", wood: "Wooden block", bell: "Wind chime", retro: "8-bit", typewriter: "Typewriter", thock: "Mechanical keys", glass: "Glass", kalimba: "Kalimba", marimba: "Marimba", koto: "Koto", bubble: "Bubbles", drop: "Raindrops", coin: "Arcade coins", space: "Space console" };
export const SFX_EVENTS = { tap: "Button taps", toggle: "Switches and sliders", hover: "Hovering over buttons", open: "Opening a pop-up", close: "Closing a pop-up", turn: "Page turns", done: "Finishing a story", bookmark: "Bookmarks", success: "Saved and done messages", error: "Error messages", choice: "Visual novel choices", blip: "Visual novel text blips", ticket: "Prize tickets", spin: "Wheel spins", fortune: "Fortunes", plush: "Plush pops" };
const OFF_BY_DEFAULT = new Set(["hover", "blip"]);
const PATTERN = { tap: [1], toggle: [1, 1.5], hover: [1.5], open: [1, 1.34], close: [1.34, 1], turn: [.75, 1], done: [1, 1.26, 1.5, 2], bookmark: [1.5, 2], success: [1, 1.26, 1.5], error: [.75, .71], choice: [1, 1.13], blip: [1.26], ticket: [1, 1.5, 2, 3], spin: [1, 1.12, 1.26, 1.42], fortune: [1, 1.19, 1.42, 1.9], plush: [.75] };
const QUIET = { hover: .32, blip: .24, tap: .75, plush: .5 };

let ac = null, cfg = { pack: "off", vol: 40, pitch: 100, on: {} }, bound = false, last = {};
const audio = () => { try { ac ||= new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === "suspended") ac.resume(); return ac; } catch { return null; } };
function tone(c, out, f, t, len, type = "sine", g = .3, slide = 0) { const o = c.createOscillator(), a = c.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f * slide), t + len); a.gain.setValueAtTime(.0001, t); a.gain.exponentialRampToValueAtTime(g, t + .004); a.gain.exponentialRampToValueAtTime(.0001, t + len); o.connect(a).connect(out); o.start(t); o.stop(t + len + .02); }
function noise(c, out, t, len, freq, g = .25, q = .8) { const n = Math.max(32, Math.ceil(c.sampleRate * len)), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; const s = c.createBufferSource(), f = c.createBiquadFilter(), a = c.createGain(); s.buffer = b; f.type = "bandpass"; f.frequency.setValueAtTime(freq, t); f.frequency.exponentialRampToValueAtTime(freq * 1.8, t + len); f.Q.value = q; a.gain.setValueAtTime(.0001, t); a.gain.exponentialRampToValueAtTime(g, t + Math.min(.006, len * .25)); a.gain.exponentialRampToValueAtTime(.0001, t + len); s.connect(f).connect(a).connect(out); s.start(t); }
// each pack: one way of striking a note, how far apart notes fall, and its base pitch
const PACK = {
  soft: { base: 520, gap: .08, hit: (c, o, t, f, g) => tone(c, o, f, t, .11, "sine", .18 * g) },
  sleigh: { base: 2349, gap: .075, hit: (c, o, t, f, g) => { for (const m of [1, 1.19, 1.5]) { tone(c, o, f * m, t, .16, "sine", .045 * g); tone(c, o, f * m * 2.76, t, .05, "sine", .012 * g); } noise(c, o, t, .02, 7000, .03 * g, 2); } },
  musicbox: { base: 1319, gap: .14, hit: (c, o, t, f, g) => { tone(c, o, f, t, .7, "sine", .1 * g); tone(c, o, f * 4, t, .08, "sine", .03 * g); } },
  paper: { base: 900, gap: .09, hit: (c, o, t, f, g) => noise(c, o, t, .07, f * 1.6, .17 * g) },
  wood: { base: 760, gap: .1, hit: (c, o, t, f, g) => tone(c, o, f, t, .07, "triangle", .28 * g, .7) },
  bell: { base: 1568, gap: .11, hit: (c, o, t, f, g) => { tone(c, o, f, t, .55, "sine", .07 * g); tone(c, o, f * 2.01, t, .24, "sine", .025 * g); } },
  retro: { base: 660, gap: .07, hit: (c, o, t, f, g) => tone(c, o, f, t, .07, "square", .06 * g) },
  typewriter: { base: 1900, gap: .075, hit: (c, o, t, f, g) => { noise(c, o, t, .018, f, .34 * g, 2.6); tone(c, o, 170, t, .024, "square", .05 * g); } },
  thock: { base: 240, gap: .08, hit: (c, o, t, f, g) => { tone(c, o, f, t, .05, "triangle", .34 * g, .6); noise(c, o, t, .02, 2600, .1 * g, 1.2); } },
  glass: { base: 2093, gap: .09, hit: (c, o, t, f, g) => { tone(c, o, f, t, .3, "sine", .06 * g); tone(c, o, f * 2.76, t, .14, "sine", .025 * g); tone(c, o, f * 5.4, t, .06, "sine", .012 * g); } },
  kalimba: { base: 784, gap: .11, hit: (c, o, t, f, g) => { tone(c, o, f, t, .42, "sine", .17 * g); tone(c, o, f * 3, t, .05, "sine", .05 * g); } },
  marimba: { base: 523, gap: .1, hit: (c, o, t, f, g) => { tone(c, o, f, t, .22, "sine", .24 * g); tone(c, o, f * 4, t, .04, "sine", .05 * g); } },
  koto: { base: 440, gap: .12, hit: (c, o, t, f, g) => { tone(c, o, f * 1.012, t, .5, "triangle", .12 * g, .99); tone(c, o, f * 2, t, .16, "sawtooth", .018 * g); } },
  bubble: { base: 420, gap: .08, hit: (c, o, t, f, g) => tone(c, o, f, t, .09, "sine", .22 * g, 2.3) },
  drop: { base: 1250, gap: .12, hit: (c, o, t, f, g) => tone(c, o, f, t, .09, "sine", .18 * g, .46) },
  coin: { base: 988, gap: .07, hit: (c, o, t, f, g) => { tone(c, o, f, t, .05, "square", .05 * g); tone(c, o, f * 1.335, t + .05, .16, "square", .05 * g); } },
  space: { base: 330, gap: .09, hit: (c, o, t, f, g) => { tone(c, o, f, t, .16, "sawtooth", .04 * g, 1.6); tone(c, o, f * 1.5, t, .16, "sine", .08 * g, 1.3); } },
};
export function playSound(kind, pack = cfg.pack, vol = cfg.vol, pitch = cfg.pitch) {
  const p = PACK[pack], notes = PATTERN[kind]; if (!p || !notes || document.hidden) return; const c = audio(); if (!c) return;
  const out = c.createGain(); out.gain.value = Math.max(0, Math.min(1, vol / 100)); out.connect(c.destination); const t0 = c.currentTime + .003, g = QUIET[kind] ?? 1;
  notes.forEach((r, k) => p.hit(c, out, t0 + k * p.gap, p.base * r * (pitch / 100), g)); setTimeout(() => out.disconnect(), 2400);
}
const fire = (kind, gap = 45) => { if (cfg.pack === "off" || !cfg.on[kind]) return; const n = performance.now(); if (n - (last[kind] || 0) < gap) return; last[kind] = n; playSound(kind); };
export const eventOn = (st, k) => (st.sfxOn?.[k] ?? (k === "tap" ? st.uiSoundTaps !== false : !OFF_BY_DEFAULT.has(k)));
export function applySounds(st) {
  cfg = { pack: st.uiSound || "off", vol: st.uiSoundVol ?? 40, pitch: st.uiSoundPitch ?? 100, on: Object.fromEntries(Object.keys(SFX_EVENTS).map((k) => [k, eventOn(st, k)])) };
  if (cfg.pack === "off" || bound) return; bound = true;
  const BTN = "button,a[href],[role=button],summary,.chip";
  document.addEventListener("pointerdown", (e) => { if (e.isPrimary && e.target.closest?.(BTN)) fire("tap"); }, { passive: true, capture: true });
  document.addEventListener("pointerover", (e) => { if (e.pointerType === "mouse" && e.target.closest?.(BTN) && !e.relatedTarget?.closest?.(BTN)) fire("hover", 90); }, { passive: true });
  document.addEventListener("change", (e) => { if (e.target.matches?.('input[type=checkbox],input[type=radio],input[type=range],select')) fire("toggle"); }, true);
  for (const [ev, k, g] of [["kitsune:turn", "turn"], ["kitsune:done", "done"], ["kitsune:open", "open"], ["kitsune:close", "close"], ["kitsune:choice", "choice"], ["kitsune:blip", "blip", 70], ["kitsune:ticket", "ticket"], ["kitsune:spin", "spin"], ["kitsune:fortune", "fortune"], ["kitsune:plush", "plush"]]) document.addEventListener(ev, () => fire(k, g));
  document.addEventListener("kitsune:toast", (e) => { const m = String(e.detail || ""); if (/\bbookmark/i.test(m)) fire("bookmark"); else if (/couldn['’]t|can['’]t|failed|error|didn['’]t|not found|isn['’]t/i.test(m)) fire("error"); else if (/\b(?:saved|copied|added|done|deleted|removed|loaded|tagged|new ending|goal reached)\b/i.test(m)) fire("success"); });
}
