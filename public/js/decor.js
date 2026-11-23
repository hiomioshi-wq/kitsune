// Wallpapers (quiet patterns behind the app, drawn in your theme's colours — falling maple,
// paper lanterns and fireflies included) and interface sounds
// (synthesised on the device, so there are no audio files to download). Both are off until you choose them.
import { ls } from "./util.js";

const s = (w, h, body) => ({ w, h, svg: `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}' viewBox='0 0 ${w} ${h}'><g fill='none' stroke='#000' stroke-width='1.2'>${body}</g></svg>` });
const arcs = (cx, cy) => [20, 14, 8].map((r) => `<circle cx='${cx}' cy='${cy}' r='${r}'/>`).join("");
const star = (x, y, r) => `<path fill='#000' stroke='none' d='M${x} ${y - r}L${x + r * .28} ${y - r * .28}L${x + r} ${y}L${x + r * .28} ${y + r * .28}L${x} ${y + r}L${x - r * .28} ${y + r * .28}L${x - r} ${y}L${x - r * .28} ${y - r * .28}Z'/>`;
const paw = (x, y) => `<g fill='#000' stroke='none' transform='translate(${x} ${y})'><ellipse cy='3' rx='5' ry='4'/><circle cx='-5.5' cy='-2' r='2'/><circle cx='-2' cy='-6' r='2'/><circle cx='2' cy='-6' r='2'/><circle cx='5.5' cy='-2' r='2'/></g>`;
const flower = (x, y, r) => [0, 72, 144, 216, 288].map((a) => `<path fill='#000' stroke='none' transform='translate(${x} ${y}) rotate(${a})' d='M0 0C${r * .55} ${-r * .3} ${r * .45} ${-r} 0 ${-r * .82}C${-r * .45} ${-r} ${-r * .55} ${-r * .3} 0 0Z'/>`).join("");
export const WALLPAPERS = {
  none: { name: "None" },
  xsnow: { name: "Snowflakes", xmas: 1, ...s(64, 64, [[16, 16], [48, 48]].map(([x, y]) => [0, 60, 120].map((r) => `<path transform='rotate(${r} ${x} ${y})' d='M${x} ${y - 11}V${y + 11}M${x - 3} ${y - 8}l3 3 3-3M${x - 3} ${y + 8}l3-3 3 3'/>`).join("")).join("")) },
  xholly: { name: "Holly", xmas: 1, ...s(72, 56, "<path d='M18 18C12 10 8 12 4 8C4 14 2 16 4 20C9 18 14 22 18 18C24 10 28 12 32 8C32 14 34 16 32 20C27 18 22 22 18 18Z'/><circle cx='18' cy='22' r='3' fill='#000'/><path transform='translate(36 28)' d='M18 18C12 10 8 12 4 8C4 14 2 16 4 20C9 18 14 22 18 18C24 10 28 12 32 8C32 14 34 16 32 20C27 18 22 22 18 18Z'/><circle cx='54' cy='50' r='3' fill='#000'/>") },
  xtrees: { name: "Pine forest", xmas: 1, ...s(60, 60, "<path d='M15 6L24 20H19L27 32H3L11 20H6Z'/><path d='M15 32V37'/><path d='M45 34L52 45H48L54 54H36L42 45H38Z'/><path d='M45 54V58'/>") },
  seigaiha: { name: "Seigaiha waves", ...s(40, 20, arcs(0, 20) + arcs(40, 20) + arcs(20, 10).replace(/<circle/g, "<circle")) },
  asanoha: { name: "Asanoha hemp", ...s(40, 70, "<path d='M20 0L40 11.7V35L20 46.7L0 35V11.7ZM20 0V46.7M0 11.7L40 35M40 11.7L0 35M20 46.7V70M0 35V58.3L20 70L40 58.3V35'/>") },
  shippo: { name: "Shippo circles", ...s(40, 40, "<circle cx='20' cy='20' r='20'/><circle cx='0' cy='0' r='20'/><circle cx='40' cy='0' r='20'/><circle cx='0' cy='40' r='20'/><circle cx='40' cy='40' r='20'/>") },
  kikko: { name: "Tortoise shell", ...s(42, 72, "<path d='M21 0L42 12V36L21 48L0 36V12ZM21 48V72M0 36V60M42 36V60M0 60L21 72L42 60'/>") },
  ichimatsu: { name: "Checker", w: 48, h: 48, svg: "<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48'><path d='M0 0h24v24H0zM24 24h24v24H24z'/></svg>" },
  yagasuri: { name: "Arrow feathers", ...s(32, 48, "<path d='M0 0L16 12L32 0M0 12L16 24L32 12M16 0V24M0 24V48M32 24V48M0 24L16 36L0 48M32 24L16 36L32 48'/>") },
  stars: { name: "Night stars", ...s(90, 90, star(18, 20, 5) + star(64, 12, 3) + star(44, 50, 6) + star(80, 66, 4) + star(14, 74, 3)) },
  sakura: { name: "Falling sakura", ...s(90, 90, flower(22, 24, 11) + flower(68, 62, 8)) },
  paws: { name: "Fox prints", ...s(80, 80, paw(20, 22) + paw(60, 60)) },
  dots: { name: "Polka dots", w: 24, h: 24, svg: "<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24'><circle cx='6' cy='6' r='2'/><circle cx='18' cy='18' r='2'/></svg>" },
  tone: { name: "Manga screentone", w: 8, h: 8, svg: "<svg xmlns='http://www.w3.org/2000/svg' width='8' height='8'><circle cx='2' cy='2' r='1.15'/><circle cx='6' cy='6' r='1.15'/></svg>" },
  lines: { name: "Speed lines", ...s(24, 24, "<path d='M-6 6L6 -6M0 24L24 0M18 30L30 18'/>") },
  grid: { name: "Graph paper", ...s(32, 32, "<path d='M32 0H0V32'/>") },
  ruled: { name: "Ruled notebook", ...s(32, 32, "<path d='M0 31.5H32'/>") },
  rain: { name: "Rain", ...s(60, 60, "<path stroke-linecap='round' d='M12 6L8 18M42 2L38 14M28 30L24 42M54 36L50 48M6 44L2 56'/>") },
  hills: { name: "Rolling hills", ...s(80, 30, "<path d='M0 20Q20 2 40 20T80 20M0 30Q20 12 40 30T80 30'/>") },
  maple: { name: "Falling maple", ...s(90, 90, [[4, 0, .95, 0], [66, 40, .85, 155], [17, 60, .75, 210]].map(([x, y, sc, r]) => `<path transform='translate(${x} ${y}) rotate(${r}) scale(${sc})' d='M17 5L19 11L24 9L22.5 15L28 16L23 20L25 24L18.5 23L18 30H16L15.5 23L9 24L11 20L6 16L11.5 15L10 9L15 11Z'/>`).join("")) },
  lanterns: { name: "Paper lanterns", ...s(64, 64, "<path d='M18 0V11M50 0V40'/><ellipse cx='18' cy='21' rx='8' ry='9'/><path d='M18 12v18M12.6 13.6c-2.6 4.3-2.6 10.6 0 14.8M23.4 13.6c2.6 4.3 2.6 10.6 0 14.8'/><path d='M14 12h8M14 30h8M18 30v5'/><ellipse cx='50' cy='49' rx='7' ry='8'/><path d='M50 41v16M45.3 42.4c-2.6 3.8-2.6 9.4 0 13.2M54.7 42.4c2.6 3.8 2.6 9.4 0 13.2'/><path d='M46.5 41h7M46.5 57h7M50 57v5'/>") },
  fireflies: { name: "Fireflies", ...s(96, 96, [[18, 20, 2, 6], [70, 14, 1.6, 5], [48, 52, 2.2, 7], [84, 70, 1.8, 5.5], [10, 78, 1.7, 5], [60, 88, 1.4, 4.5]].map(([x, y, r, ro]) => `<circle cx='${x}' cy='${y}' r='${r}' fill='#000' stroke='none'/><circle cx='${x}' cy='${y}' r='${ro}'/>`).join("")) },
};
export const STRENGTHS = { 4: "Faint", 8: "Soft", 14: "Bold" };

export function decorCss(id, strength = 8) {
  const w = WALLPAPERS[id]; if (!w?.svg) return "";
  const u = `url("data:image/svg+xml,${encodeURIComponent(w.svg)}")`;
  return `body::before{content:"";position:fixed;inset:0;z-index:-1;pointer-events:none;background:var(--ink);opacity:${strength / 100};-webkit-mask:${u} repeat;mask:${u} repeat}.main{background:transparent!important}`;
}
export function applyDecor(st) {
  document.getElementById("kt-decor")?.remove();
  const css = decorCss(st.wallpaper || "none", st.wallStrength || 8); ls.set("decorCss", css); if (!css) return;
  const el = document.createElement("style"); el.id = "kt-decor"; el.textContent = css; document.head.append(el);
}

export { SOUND_PACKS, playSound, applySounds } from "./sfx.js";
