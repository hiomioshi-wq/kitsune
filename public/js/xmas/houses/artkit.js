// Shared drawing kit for the pet-house art packs. Everything draws into viewBox 0 0 120 124,
// with the ground at about y = 118, so every house's pets sit at the same size.
export const INK = "#1b1d33";
export const el = (cx, cy, rx, ry, fill, x = "") => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" ${x}/>`;
export const dot = (cx, cy, r, fill, x = "") => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" ${x}/>`;
export const p = (d, fill, x = "") => `<path d="${d}" fill="${fill}" ${x}/>`;
export const ln = (d, col, w = 2, x = "") => `<path d="${d}" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" fill="none" ${x}/>`;
export const dots = (list, r, fill) => list.map(([x, y]) => dot(x, y, r, fill)).join("");
/** Draw a left-side part and its mirror image on the right. */
export const both = (svg) => `${svg}<g transform="matrix(-1 0 0 1 120 0)">${svg}</g>`;
export const wrap = (cls, svg) => `<g class="${cls}">${svg}</g>`;

/** One eye that reacts to mood. o: { r, iris, ring, dark, rim, lid } */
export function eye(x, y, mood, o = {}) {
  if (mood === "sleepy") return ln(`M${x - 5} ${y}q5 4.5 10 0`, o.lid || INK, 2.4);
  if (mood === "love") return p(`M${x} ${y + 5}l-5.5 -5.5a3.2 3.2 0 0 1 5.5 -3.2a3.2 3.2 0 0 1 5.5 3.2Z`, "#ff3d5e", `stroke="#fff" stroke-width="1"`);
  const r = o.r || 4.6;
  const ring = o.ring ? dot(x, y, r + 2.2, o.ring) : "";
  const iris = o.iris ? dot(x, y, r, o.iris) + dot(x, y, r * 0.6, "#14131f") : dot(x, y, r, o.dark || "#14131f", `stroke="#ffffff" stroke-width="${o.rim ?? 0.7}"`);
  const brow = mood === "sad" ? ln(`M${x - 5} ${y - 7}L${x + 4} ${y - 9.5}`, o.lid || INK, 2, x > 60 ? `transform="matrix(-1 0 0 1 ${2 * x} 0)"` : "") : "";
  return `${ring}${iris}${dot(x + r * 0.34, y - r * 0.36, r * 0.34, "#fff")}${dot(x - r * 0.3, y + r * 0.36, r * 0.16, "#fff")}${brow}`;
}
export const blush = (x1 = 40, x2 = 80, y = 60) => el(x1, y, 4, 2.5, "#ff7f9c", `opacity=".45"`) + el(x2, y, 4, 2.5, "#ff7f9c", `opacity=".45"`);

/** Stage 2 scarf centred on a neck point; stage 3 hat sitting on a head-top point. */
export const scarf = (x, y, w) => `${p(`M${x - w} ${y - 4}Q${x} ${y + 7} ${x + w} ${y - 4}L${x + w + 1.5} ${y + 2.5}Q${x} ${y + 15} ${x - w - 1.5} ${y + 2.5}Z`, "#d3312f")}${p(`M${x + w * 0.42} ${y + 5}l7 15l-7.5 -1.5l-5.5 -11Z`, "#b52228")}${ln(`M${x - w * 0.6} ${y + 2}v4M${x - w * 0.1} ${y + 4}v4M${x + w * 0.4} ${y + 3}v4`, "#fff", 1.8)}`;
export const hat = (x, y, k = 1) => `<g transform="translate(${x} ${y}) scale(${k})">${p("M-17 4Q-8 -22 13 -17Q21 -13 22 3Q2 -7 -17 4Z", "#d3312f")}${ln("M-19 5Q1 -6 24 4", "#fff", 5.5)}${dot(22, -15, 4.8, "#fff")}</g>`;

/** Idle animations every pack can use: bd-breathe, bd-bob, bd-wag, bd-flap, bd-glow. */
export const IDLE_CSS = `.bd-breathe{transform-origin:60px 112px;animation:pkBreathe 3.2s ease-in-out infinite}.bd-bob{animation:pkBob 3s ease-in-out infinite}.bd-wag{transform-box:fill-box;transform-origin:50% 100%;animation:pkWag 1.8s ease-in-out infinite}.bd-flap{transform-box:fill-box;transform-origin:100% 50%;animation:pkFlap 1.4s ease-in-out infinite}.bd-glow{animation:pkGlow 2.6s ease-in-out infinite}@keyframes pkBreathe{0%,100%{transform:scale(1,1)}50%{transform:scale(1.012,.988)}}@keyframes pkBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-2.4px)}}@keyframes pkWag{0%,100%{transform:rotate(-5deg)}50%{transform:rotate(5deg)}}@keyframes pkFlap{0%,100%{transform:rotate(-4deg)}50%{transform:rotate(7deg)}}@keyframes pkGlow{0%,100%{opacity:.25}50%{opacity:.6}}`;

/**
 * Assemble the finished SVG.
 * o: { name, size, tier, accent, stage, body, neck:[x,y,halfWidth] | null, cap:[x,y,scale], css, wrapClass, shadow }
 * `css` is extra CSS for the signature animation only; scope every selector to a class that appears only in that art.
 */
export function frame(o) {
  const scale = o.stage === 1 ? 0.84 : o.stage === 2 ? 0.93 : 1;
  const glow = o.tier === "l" ? dot(60, 64, 55, o.accent, `opacity=".13"`) : "";
  const wear = (o.stage >= 2 && o.neck ? scarf(...o.neck) : "") + (o.stage >= 3 && o.cap ? hat(...o.cap) : "");
  const css = `${IDLE_CSS}${o.css || ""}@media (prefers-reduced-motion:reduce){[class^="bd-"]{animation:none!important}}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 124" ${o.size ? `width="${o.size}" height="${o.size}"` : ""} overflow="hidden" role="img" aria-label="${o.name}"><style>${css}</style>${glow}<g transform="translate(${60 - 60 * scale} ${124 - 124 * scale}) scale(${scale})">${o.shadow === false ? "" : el(60, 119, 32, 4, "#000", `opacity=".15"`)}<g class="bd-all${o.wrapClass ? ` ${o.wrapClass}` : ""}">${o.body}${wear}${o.top || ""}</g></g></svg>`;
}
