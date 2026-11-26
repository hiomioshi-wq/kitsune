// Winterfest art: every pet at three growth stages, eggs, ornaments and the tree. All drawn here, no image files.
import { species, RARITY, ORNAMENTS, TREE_SLOTS } from "./data.js";
import { REPTILE_FAMILIES, reptileSvg } from "./reptileart.js";

const ears = (k, c, a, b) => ({
  fox: `<path d="M36 44L30 14L56 32Z" fill="${c}"/><path d="M84 44L90 14L64 32Z" fill="${c}"/><path d="M38 36L35 22L49 32Z" fill="${a}"/><path d="M82 36L85 22L71 32Z" fill="${a}"/>`,
  cat: `<path d="M34 46L32 18L56 34Z" fill="${c}"/><path d="M86 46L88 18L64 34Z" fill="${c}"/><path d="M38 38L37 26L48 34Z" fill="${a}"/><path d="M82 38L83 26L72 34Z" fill="${a}"/>`,
  bunny: `<ellipse cx="46" cy="20" rx="9" ry="24" fill="${c}" transform="rotate(-10 46 20)"/><ellipse cx="74" cy="20" rx="9" ry="24" fill="${c}" transform="rotate(10 74 20)"/><ellipse cx="46" cy="22" rx="4" ry="16" fill="${a}" transform="rotate(-10 46 22)"/><ellipse cx="74" cy="22" rx="4" ry="16" fill="${a}" transform="rotate(10 74 22)"/>`,
  round: `<circle cx="37" cy="33" r="11" fill="${c}"/><circle cx="83" cy="33" r="11" fill="${c}"/><circle cx="37" cy="33" r="5" fill="${a}"/><circle cx="83" cy="33" r="5" fill="${a}"/>`,
  antler: `<path d="M44 34C38 22 30 22 24 12M34 22L26 26M38 26L40 12M76 34C82 22 90 22 96 12M86 22L94 26M82 26L80 12" stroke="${a}" stroke-width="4" stroke-linecap="round" fill="none"/><ellipse cx="31" cy="44" rx="10" ry="5" fill="${c}"/><ellipse cx="89" cy="44" rx="10" ry="5" fill="${c}"/>`,
  tuft: `<path d="M38 38L30 16L52 30Z" fill="${c}"/><path d="M82 38L90 16L68 30Z" fill="${c}"/>`,
  horn: `<path d="M44 32L38 8L54 28Z" fill="${a}"/><path d="M76 32L82 8L66 28Z" fill="${a}"/><path d="M28 48L12 38L30 58Z" fill="${b}"/><path d="M92 48L108 38L90 58Z" fill="${b}"/>`,
  spirit: `<path d="M60 4L66 22L84 22L70 33L75 50L60 40L45 50L50 33L36 22L54 22Z" fill="${a}"/>`,
  none: "",
})[k] || "";
const tail = (k, c, a, b) => {
  if (k === "fluff") return `<path d="M82 92C108 92 112 66 100 52C96 72 86 78 74 80Z" fill="${c}"/><path d="M100 52C106 60 106 68 103 75C99 68 98 60 100 52Z" fill="${a}"/>`;
  if (k === "puff") return `<circle cx="90" cy="92" r="10" fill="${b}"/>`;
  if (k === "thin") return `<path d="M80 96C102 98 108 80 98 66" stroke="${c}" stroke-width="7" stroke-linecap="round" fill="none"/><circle cx="98" cy="66" r="4" fill="${a}"/>`;
  if (k === "spike") return `<path d="M78 90C100 96 110 84 112 68L100 76L98 66L88 78Z" fill="${c}"/>`;
  if (k === "wisp") return `<path d="M60 100C52 112 66 112 60 120C76 112 72 104 70 98Z" fill="${a}" opacity=".8"/>`;
  if (k === "nine") return Array.from({ length: 9 }, (_, i) => `<path transform="rotate(${-112 + i * 28} 60 84)" d="M60 84C50 62 52 44 60 26C68 44 70 62 60 84Z" fill="${i % 2 ? c : b}" stroke="${a}" stroke-width="1.2"/>`).join("");
  return `<ellipse cx="86" cy="94" rx="7" ry="5" fill="${c}"/>`;
};
const eyes = (mood, sp) => { const ink = sp === "penguin" ? "#fff" : "#1b1d33", dot = (x) => `<circle cx="${x}" cy="56" r="4.6" fill="${ink === "#fff" ? "#14152a" : ink}"/><circle cx="${x + 1.6}" cy="54.4" r="1.5" fill="#fff"/>`, ring = sp === "penguin" ? `<circle cx="47" cy="56" r="8" fill="#fff"/><circle cx="73" cy="56" r="8" fill="#fff"/>` : ""; if (mood === "sleepy") return `${ring}<path d="M42 57q5 4 10 0M68 57q5 4 10 0" stroke="#1b1d33" stroke-width="2.6" fill="none" stroke-linecap="round"/>`; if (mood === "love") return `${ring}<path d="M47 60l-5 -5a3 3 0 0 1 5 -3a3 3 0 0 1 5 3ZM73 60l-5 -5a3 3 0 0 1 5 -3a3 3 0 0 1 5 3Z" fill="#e0343e"/>`; if (mood === "sad") return `${ring}${dot(47)}${dot(73)}<path d="M40 48l10 -3M80 48l-10 -3" stroke="#1b1d33" stroke-width="2"/>`; return ring + dot(47) + dot(73); };

function monitorSvg(id, name, rar, c, b, a, tl, stage, mood, size) {
  const scale = stage === 1 ? .84 : stage === 2 ? .92 : 1;
  const glow = rar === "l" ? `<circle cx="60" cy="64" r="54" fill="${a}" opacity=".14"/>` : "";
  const tailCol = tl === "bluetail" ? "#3b8cff" : c;
  const tailPath =
    tl === "curl"
      ? `<path d="M76 88C104 92 114 70 104 52C96 40 82 48 86 60C89 67 97 65 95 57" stroke="${c}" stroke-width="8" stroke-linecap="round" fill="none"/><path d="M98 68L104 54" stroke="${a}" stroke-width="2" stroke-linecap="round" opacity=".6"/>`
      : tl === "croctail"
      ? `<path d="M74 90C106 96 116 74 112 44C110 30 100 26 96 34" stroke="${c}" stroke-width="9" stroke-linecap="round" fill="none"/><path d="M88 92l4 -6M98 84l6 -5M106 70l7 -3M110 56l6 -1M106 42l5 2" stroke="${a}" stroke-width="3" stroke-linecap="round"/>`
      : tl === "spiny"
      ? `<path d="M72 90C98 94 112 82 106 64C102 54 94 58 96 66" stroke="${c}" stroke-width="10" stroke-linecap="round" fill="none"/><path d="M84 88l3 -6M93 84l4 -5M100 76l5 -4M104 68l5 -2" stroke="${a}" stroke-width="2.5" stroke-linecap="round"/>`
      : `<path d="M74 90C102 95 114 78 108 56C105 46 97 48 98 56" stroke="${tailCol}" stroke-width="${tl === "heavy" || tl === "thick" ? 11 : 8.5}" stroke-linecap="round" fill="none"/><path d="M88 90l3 -5M98 82l5 -4M106 70l5 -3" stroke="${a}" stroke-width="2.5" stroke-linecap="round" opacity=".7"/>`;

  const pat =
    id === "crocmonitor" || id === "ackiemonitor" || id === "argusmonitor" || id === "perentie" || id === "watermonitor"
      ? `<circle cx="44" cy="78" r="3.4" fill="none" stroke="${a}" stroke-width="2"/><circle cx="56" cy="74" r="3.8" fill="none" stroke="${a}" stroke-width="2"/><circle cx="67" cy="80" r="3.2" fill="none" stroke="${a}" stroke-width="2"/><circle cx="50" cy="88" r="3" fill="${a}" opacity=".75"/>`
      : id === "nilemonitor" || id === "treemonitor" || id === "lacemonitor" || id === "savannahmonitor"
      ? `<path d="M40 76Q56 70 72 76M42 86Q56 80 70 86M45 94Q56 89 67 94" stroke="${a}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".85"/>`
      : id === "komodo"
      ? `<path d="M44 76q6 -3 12 0M54 84q6 -3 12 0M42 88q6 -3 12 0" stroke="#4a443b" stroke-width="2" fill="none"/>`
      : "";

  const snout = id === "crocmonitor" || id === "savannahmonitor"
    ? `<path d="M32 48C32 30 44 22 60 22C76 22 88 30 88 48C88 60 76 70 60 70C44 70 32 60 32 48Z" fill="${c}"/>`
    : `<path d="M33 46C35 28 48 20 60 20C72 20 85 28 87 46C88 60 72 70 60 71C48 70 32 60 33 46Z" fill="${c}"/>`;

  const eyeIris = id === "blackdragon" ? "#ffb830" : "#181a24";
  const mEyes = mood === "sleepy"
    ? `<path d="M41 44q5 4 10 0M69 44q5 4 10 0" stroke="#181a24" stroke-width="2.5" fill="none" stroke-linecap="round"/>`
    : mood === "love"
    ? `<path d="M46 47l-4 -4a2.5 2.5 0 0 1 4 -2.5a2.5 2.5 0 0 1 4 2.5ZM74 47l-4 -4a2.5 2.5 0 0 1 4 -2.5a2.5 2.5 0 0 1 4 2.5Z" fill="#e0343e"/>`
    : `<circle cx="46" cy="44" r="5" fill="${eyeIris}"/><circle cx="74" cy="44" r="5" fill="${eyeIris}"/><circle cx="47.6" cy="42.4" r="1.7" fill="#fff"/><circle cx="75.6" cy="42.4" r="1.7" fill="#fff"/>${mood === "sad" ? `<path d="M39 37l9 -2M81 37l-9 -2" stroke="#181a24" stroke-width="2"/>` : ""}`;

  const tongueCol = id === "bluemonitor" ? "#54a8ff" : "#ff6e8a";
  const tongue = mood === "sad" ? "" : `<path d="M60 67L60 76M60 76L56 80M60 76L64 80" stroke="${tongueCol}" stroke-width="2.3" stroke-linecap="round" fill="none"/>`;
  const scarf = stage >= 2 ? `<path d="M40 66Q60 76 80 66L82 73Q60 83 38 73Z" fill="#d3312f"/><path d="M68 72l8 15l-8 -2l-5 -10Z" fill="#b52228"/>` : "";
  const hat = stage >= 3 ? `<g><path d="M44 26Q54 6 74 12Q80 16 80 28Q62 20 44 26Z" fill="#d3312f"/><path d="M40 28Q60 20 82 28" stroke="#fff" stroke-width="5.5" stroke-linecap="round" fill="none"/><circle cx="82" cy="14" r="5" fill="#fff"/></g>` : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 124" ${size ? `width="${size}" height="${size}"` : ""} role="img" aria-label="${name}">${glow}<g transform="translate(${60 - 60 * scale} ${124 - 122 * scale}) scale(${scale})"><ellipse cx="60" cy="116" rx="34" ry="4.5" fill="#000" opacity=".16"/>${tailPath}<path d="M34 84L22 96L28 102L40 92Z" fill="${c}"/><path d="M86 84L98 96L92 102L80 92Z" fill="${c}"/><path d="M38 102L26 112L34 115L46 106Z" fill="${c}"/><path d="M82 102L94 112L86 115L74 106Z" fill="${c}"/><path d="M22 96l-3 4M25 99l-2 4M98 96l3 4M95 99l2 4M26 112l-3 3M94 112l3 3" stroke="#222" stroke-width="1.6" stroke-linecap="round"/><ellipse cx="60" cy="88" rx="24" ry="20" fill="${c}"/><ellipse cx="60" cy="92" rx="15" ry="14" fill="${b}"/>${pat}<path d="M46 66Q60 76 74 66Q70 58 60 58Q50 58 46 66Z" fill="${b}"/>${snout}<ellipse cx="60" cy="58" rx="14" ry="9" fill="${b}" opacity=".9"/><circle cx="54" cy="30" r="1.5" fill="#181a24" opacity=".65"/><circle cx="66" cy="30" r="1.5" fill="#181a24" opacity=".65"/><ellipse cx="38" cy="53" rx="4.5" ry="2.6" fill="#ff8fa8" opacity=".5"/><ellipse cx="82" cy="53" rx="4.5" ry="2.6" fill="#ff8fa8" opacity=".5"/>${mEyes}${tongue}${scarf}${hat}</g></svg>`;
}

function fwcSvg(id, name, rar, c, b, a, tl, stage, mood, size) {
  const scale = stage === 1 ? .85 : stage === 2 ? .92 : 1;
  const glow = rar === "l" ? `<circle cx="60" cy="64" r="54" fill="${a}" opacity=".16"/>` : "";
  const ruby = id === "fwc_truehypo" || id === "fwc_lavender" || id === "fwc_patternless";
  const eyeCol = ruby ? "#9e2448" : "#181920";
  const fEyes = mood === "sleepy"
    ? `<path d="M43 44q4 4 9 0M68 44q4 4 9 0" stroke="${eyeCol}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`
    : mood === "love"
    ? `<path d="M47 47l-4 -4a2.5 2.5 0 0 1 4 -2.5a2.5 2.5 0 0 1 4 2.5ZM73 47l-4 -4a2.5 2.5 0 0 1 4 -2.5a2.5 2.5 0 0 1 4 2.5Z" fill="#e0343e"/>`
    : `<circle cx="47" cy="44" r="5" fill="${eyeCol}"/><circle cx="73" cy="44" r="5" fill="${eyeCol}"/><circle cx="48.6" cy="42.4" r="1.7" fill="#fff"/><circle cx="74.6" cy="42.4" r="1.7" fill="#fff"/>${mood === "sad" ? `<path d="M41 37l8 -2M79 37l-8 -2" stroke="${eyeCol}" stroke-width="2"/>` : ""}`;
  const eyeMask = tl === "patternless"
    ? ""
    : `<path d="M35 44L44 43L40 53L32 51Z" fill="${a}" opacity=".85"/><path d="M85 44L76 43L80 53L88 51Z" fill="${a}" opacity=".85"/>`;
  const saddles = tl === "patternless"
    ? `<path d="M34 94Q60 88 86 94" stroke="#ffffff" stroke-width="2" fill="none" opacity=".35"/>`
    : `<path d="M26 88Q36 80 46 88M52 84Q60 77 68 84M74 88Q84 80 94 88M34 102Q46 95 58 102M64 102Q76 95 88 102" stroke="${a}" stroke-width="4.5" stroke-linecap="round" fill="none" opacity=".88"/>`;
  const tongue = mood === "sad" ? "" : `<path d="M60 60L60 69M60 69L56 73M60 69L64 73" stroke="#ff6e8a" stroke-width="2.2" stroke-linecap="round" fill="none"/>`;
  const scarf = stage >= 2 ? `<path d="M42 64Q60 73 78 64L80 71Q60 80 40 71Z" fill="#d3312f"/>` : "";
  const hat = stage >= 3 ? `<g><path d="M44 26Q54 6 74 12Q80 16 80 28Q62 20 44 26Z" fill="#d3312f"/><path d="M40 28Q60 20 82 28" stroke="#fff" stroke-width="5.5" stroke-linecap="round" fill="none"/><circle cx="82" cy="14" r="5" fill="#fff"/></g>` : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 124" ${size ? `width="${size}" height="${size}"` : ""} role="img" aria-label="${name}">${glow}<g transform="translate(${60 - 60 * scale} ${124 - 122 * scale}) scale(${scale})"><ellipse cx="60" cy="116" rx="38" ry="5" fill="#000" opacity=".16"/><path d="M84 104C106 102 114 88 104 76C98 70 90 76 94 84" stroke="${c}" stroke-width="8" stroke-linecap="round" fill="none"/><ellipse cx="60" cy="96" rx="34" ry="16" fill="${c}"/><ellipse cx="60" cy="100" rx="25" ry="10" fill="${b}" opacity=".9"/><ellipse cx="60" cy="86" rx="28" ry="13" fill="${c}"/>${saddles}<path d="M38 66C32 54 34 42 46 38L74 38C86 42 88 54 82 66Q60 74 38 66Z" fill="${c}"/><path d="M46 66Q60 73 74 66Q70 54 60 54Q50 54 46 66Z" fill="${b}"/><ellipse cx="60" cy="45" rx="22" ry="16" fill="${c}"/>${eyeMask}<ellipse cx="60" cy="54" rx="14" ry="8" fill="${b}" opacity=".92"/><ellipse cx="40" cy="51" rx="4" ry="2.4" fill="#ff8fa8" opacity=".48"/><ellipse cx="80" cy="51" rx="4" ry="2.4" fill="#ff8fa8" opacity=".48"/>${fEyes}${tongue}${scarf}${hat}</g></svg>`;
}

export function petSvg(id, stage = 1, mood = "happy", { size } = {}) {
  const x = species(id); if (!x) return ""; const [, name, rar, c, b, a, ear, tl] = x;
  if (ear === "monitor") return monitorSvg(id, name, rar, c, b, a, tl, stage, mood, size);
  if (ear === "fwc") return fwcSvg(id, name, rar, c, b, a, tl, stage, mood, size);
  if (REPTILE_FAMILIES.has(ear)) return reptileSvg(id, name, rar, c, b, a, ear, tl, stage, mood, size);
  const beak = ["penguin", "robin", "owl", "ptarmigan"].includes(id), scale = stage === 1 ? .82 : stage === 2 ? .92 : 1, mouth = beak ? `<path d="M54 63h12l-6 8Z" fill="${a}"/>` : mood === "sad" ? `<path d="M55 70q5 -4 10 0" stroke="#1b1d33" stroke-width="2.2" fill="none"/>` : `<ellipse cx="60" cy="63" rx="3" ry="2.2" fill="#1b1d33"/><path d="M54 67q3 3 6 0q3 3 6 0" stroke="#1b1d33" stroke-width="2" fill="none"/>`;
  const scarf = stage >= 2 ? `<path d="M36 80Q60 92 84 80L86 88Q60 100 34 88Z" fill="#d3312f"/><path d="M72 88l10 20l-10 -2l-6 -14Z" fill="#b52228"/><path d="M42 84v6M52 88v5M62 89v5M72 87v5" stroke="#fff" stroke-width="2"/>` : "";
  const top = stage >= 3 ? (id === "spirit" ? `<circle cx="60" cy="60" r="56" fill="#ffd27a" opacity=".16"/>` : `<g><path d="M40 34Q52 8 78 14Q88 18 88 36Q64 26 40 34Z" fill="#d3312f"/><path d="M36 36Q62 26 90 36" stroke="#fff" stroke-width="7" stroke-linecap="round" fill="none"/><circle cx="90" cy="16" r="6" fill="#fff"/></g>`) : "";
  const glow = x[2] === "l" ? `<circle cx="60" cy="66" r="54" fill="${a}" opacity=".14"/>` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 124" ${size ? `width="${size}" height="${size}"` : ""} role="img" aria-label="${name}">${glow}<g transform="translate(${60 - 60 * scale} ${124 - 122 * scale}) scale(${scale})">${tail(tl, c, a, b)}<ellipse cx="60" cy="118" rx="30" ry="4" fill="#000" opacity=".15"/><path d="M34 112C26 88 36 72 60 72C84 72 94 88 86 112Q60 120 34 112Z" fill="${c}"/><ellipse cx="60" cy="96" rx="17" ry="18" fill="${b}"/><ellipse cx="44" cy="114" rx="9" ry="5" fill="${id === "penguin" ? a : c}"/><ellipse cx="76" cy="114" rx="9" ry="5" fill="${id === "penguin" ? a : c}"/>${ears(ear, c, a, b)}<ellipse cx="60" cy="54" rx="31" ry="27" fill="${c}"/><ellipse cx="60" cy="64" rx="17" ry="12" fill="${b}"/><ellipse cx="37" cy="65" rx="5" ry="3" fill="#ff8fa8" opacity=".55"/><ellipse cx="83" cy="65" rx="5" ry="3" fill="#ff8fa8" opacity=".55"/>${eyes(mood, id)}${mouth}${scarf}${top}</g></svg>`;
}
export const petUrl = (id, stage, mood) => "data:image/svg+xml," + encodeURIComponent(petSvg(id, stage, mood, { size: 120 }));
export const eggSvg = (rar, pct = 0) => { const col = RARITY[rar][1], crack = pct >= 1 ? `<path d="M30 58l9 -7 7 8 8 -9 8 8 8 -7 8 7" stroke="#1b1d33" stroke-width="2.5" fill="none"/>` : pct > .6 ? `<path d="M46 40l6 7 -5 6 7 6" stroke="#1b1d33" stroke-width="2" fill="none"/>` : ""; return `<svg viewBox="0 0 100 120" role="img" aria-label="${RARITY[rar][0]} egg"><path d="M50 6C74 6 88 48 88 72C88 96 70 112 50 112C30 112 12 96 12 72C12 48 26 6 50 6Z" fill="#f6f4ee" stroke="${col}" stroke-width="4"/><path d="M15 62q9 -9 18 0t17 0t17 0t18 0" stroke="${col}" stroke-width="5" fill="none"/><circle cx="36" cy="38" r="5" fill="${col}"/><circle cx="64" cy="30" r="4" fill="${col}"/><circle cx="50" cy="88" r="6" fill="${col}"/>${crack}</svg>`; };
const orn = (x, y, col, id, r = 12) => `<g transform="translate(${x} ${y})"><rect x="-3" y="${-r - 5}" width="6" height="6" fill="#c9a43a"/><circle r="${r}" fill="${col}" stroke="#0003"/>${id === "fox" ? `<path d="M-7 -5L-8 -11L-2 -8ZM7 -5L8 -11L2 -8Z" fill="#fff"/><circle cx="-3" cy="-1" r="1.6" fill="#1b1d33"/><circle cx="3" cy="-1" r="1.6" fill="#1b1d33"/>` : `<ellipse cx="-4" cy="-4" rx="3" ry="4" fill="#fff" opacity=".6"/>`}</g>`;
export function treeSvg(tree, sel) {
  const tier = (y, w, h) => `<path d="M150 ${y}L${150 + w} ${y + h}Q150 ${y + h + 18} ${150 - w} ${y + h}Z" fill="#256b44" stroke="#17472d" stroke-width="3"/><path d="M${150 - w * .8} ${y + h - 3}Q150 ${y + h + 12} ${150 + w * .8} ${y + h - 3}" stroke="#e8f4f0" stroke-width="3" stroke-dasharray="2 6" fill="none"/>`;
  const full = Object.keys(tree).length >= TREE_SLOTS.length;
  return `<svg viewBox="0 0 300 400" role="group" aria-label="Your Winterfest tree"><ellipse cx="150" cy="384" rx="118" ry="12" fill="#fff" opacity=".5"/><rect x="132" y="344" width="36" height="40" fill="#6a4528"/>${tier(218, 118, 126)}${tier(138, 92, 100)}${tier(62, 66, 86)}<path d="M150 22l8 22 23 1 -18 14 6 22 -19 -13 -19 13 6 -22 -18 -14 23 -1Z" fill="${full ? "#ffd84d" : "#b9b6a6"}" stroke="#a8862a" stroke-width="2"/>${TREE_SLOTS.map(([x, y], i) => { const o = ORNAMENTS.find((q) => q[0] === tree[i]); return `<g data-slot="${i}" tabindex="0" role="button" aria-label="${o ? `Take down ${o[1]}` : `Empty spot ${i + 1}`}" style="cursor:pointer">${o ? orn(x, y, o[2], o[0]) : `<circle cx="${x}" cy="${y}" r="9" fill="#fff" opacity=".18" stroke="#fff" stroke-dasharray="3 3"/>`}</g>`; }).join("")}</svg>`;
}
export const ornSwatch = (o) => `<svg viewBox="-16 -20 32 36" width="30" height="34" aria-hidden="true">${orn(0, 0, o[2], o[0])}</svg>`;
export const bellIcon = (s = 16) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" aria-hidden="true"><path d="M12 3a2 2 0 0 1 2 2c3 .9 5 3.6 5 7v3l2 3H3l2 -3v-3c0-3.400 2-6.100 5-7a2 2 0 0 1 2-2Z" fill="#ffc93c" stroke="#a8761a" stroke-width="1.4"/><path d="M9.500 19a2.600 2.600 0 0 0 5 0Z" fill="#c9862e"/><path d="M8 10c.4-1.400 1.300-2.300 2.500-2.800" stroke="#fff" stroke-width="1.500" fill="none" stroke-linecap="round"/></svg>`;
export const giftSvg = (a = "#e0343e", b = "#ffd27a") => `<svg viewBox="0 0 40 40"><rect x="5" y="15" width="30" height="22" rx="2" fill="${a}"/><rect x="3" y="10" width="34" height="8" rx="2" fill="${a}" stroke="#0002"/><rect x="17" y="10" width="6" height="27" fill="${b}"/><path d="M20 10C14 2 6 4 9 9C11 12 17 11 20 10C23 11 29 12 31 9C34 4 26 2 20 10Z" fill="${b}"/></svg>`;
