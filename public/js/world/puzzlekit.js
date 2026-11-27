// Shared bits for the daily puzzle houses: a seeded random source, the once-a-day payout and the
// hat and furniture milestones. The puzzle logic in each house stays pure so it can be checked alone.
import { today } from "../util.js";

export function hash(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

/** Deterministic numbers in [0, 1) from any string, so everyone's puzzle is fixed for the day. */
export function seeded(text) {
  let a = hash(text);
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * State and rewards for one house. `o` is the object world.js passes to every location.
 * cfg: { key, hat, furn, fresh(day) → today's run }
 */
export function dailyHouse(o, cfg) {
  const { s, toast, ping, save, hud, giveHat, giveFurn, addRenown } = o;
  const st = (s[cfg.key] ||= {});
  st.solves ??= 0;
  st.done ||= {};

  /** Today's run, started over automatically when the day changes. */
  function run(day = today()) {
    if (st.day !== day || !st.run) { st.day = day; st.run = cfg.fresh(day); }
    return st.run;
  }

  /** Pay the first solve of the day. Returns the message to show. */
  function reward(mon, renown, note) {
    const day = st.day;
    if (st.done[day]) {
      ping("blip");
      return `${note} Today's fee was already paid.`;
    }
    st.done[day] = 1;
    st.solves++;
    s.mon += mon;
    addRenown?.(renown);
    if (st.solves >= 5 && !st.hat) { st.hat = 1; giveHat?.(cfg.hat); }
    if (st.solves >= 15 && !st.furn) { st.furn = 1; giveFurn?.(cfg.furn); }
    ping("done");
    const message = `${note} +${mon} mon and +${renown} Renown.`;
    toast(message);
    save();
    hud();
    return message;
  }

  return { st, run, reward, paid: () => !!st.done[st.day] };
}
