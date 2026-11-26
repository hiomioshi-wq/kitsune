// Registry of the pet houses built from packs. Add a house by importing its data and art here.
// Packs are pure data and art only imports artkit.js, so data.js can depend on this file without cycles.
import { buildHouse } from "./shared.js";
import cats from "./cats.js";
import catsArt from "./cats-art.js";
import burrow from "./burrow.js";
import burrowArt from "./burrow-art.js";
import barn from "./barn.js";
import barnArt from "./barn-art.js";
import pups from "./pups.js";
import pupsArt from "./pups-art.js";
import reef from "./reef.js";
import reefArt from "./reef-art.js";
import grotto from "./grotto.js";
import grottoArt from "./grotto-art.js";
import glow from "./glow.js";
import glowArt from "./glow-art.js";

// [pack, art, lazy game loader], in Pet Row street order.
const PACKS = [
  [cats, catsArt, () => import("./cats-game.js")],
  [pups, pupsArt, () => import("./pups-game.js")],
  [burrow, burrowArt, () => import("./burrow-game.js")],
  [barn, barnArt, () => import("./barn-game.js")],
  [reef, reefArt, () => import("./reef-game.js")],
  [grotto, grottoArt, () => import("./grotto-game.js")],
  [glow, glowArt, () => import("./glow-game.js")],
];

export const HOUSES = PACKS.map(([pack, art, loadGame]) => buildHouse({ ...pack, loadGame }, art));
export const HOUSE_BY_SLUG = Object.fromEntries(HOUSES.map((h) => [h.slug, h]));
export const HOUSE_SPECIES = HOUSES.flatMap((h) => h.species);
export const HOUSE_BEHAVIOURS = Object.assign({}, ...HOUSES.map((h) => h.behaviours));
export const HOUSE_CHASE = HOUSES.flatMap((h) => h.chaseIds);

/** Draw a pet whose SPECIES row has family "house:<slug>". */
export function housePetSvg(family, id, name, tier, c, b, a, stage, mood, size, act) {
  const house = HOUSE_BY_SLUG[family.slice(6)];
  return house ? house.art({ id, name, tier, c, b, a, stage, mood, size, act }) : "";
}
