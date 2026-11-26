// World Achievements & Daily Streak: 16 milestone badges with claimable mon + Renown rewards and a daily check-in streak.
import { esc, today } from "../util.js";

const BADGES = [
  ["lantern1", "First Light", "Light your first country lantern", 40, 20, (s) => Object.keys(s.lit || {}).length >= 1],
  ["lantern8", "Keeper of the Nine", "Light all 8 country lanterns", 300, 120, (s) => Object.keys(s.lit || {}).length >= 8],
  ["angler", "River Angler", "Catch 10 fish in Kitsune World", 60, 25, (s) => (s.caught || 0) >= 10],
  ["rich", "Full Purse", "Hold 500 or more mon at once", 80, 30, (s) => (s.mon || 0) >= 500],
  ["cards", "Card Sharp", "Win 3 Lantern Card duels", 75, 30, (s) => Object.keys(s.cards?.wins || {}).length >= 3],
  ["roulette", "Wheel Watcher", "Spin Foxfire Roulette 5 times", 60, 25, (s) => (s.roulette?.spins || 0) >= 5],
  ["tavern", "Tavern Regular", "Win 3 games at the Fox & Lantern Tavern", 80, 35, (s) => (s.tavern?.wins || 0) >= 3],
  ["hats", "Haberdasher", "Collect 5 different hats", 70, 30, (s) => (s.hats || []).length >= 5],
  ["home", "Interior Designer", "Place 4 pieces of furniture in your house", 65, 25, (s) => Object.keys(s.room || {}).length >= 4],
  ["travel", "Country Walker", "Visit 8 different regions", 80, 35, (s) => Object.keys(s.visited || {}).length >= 8],
  ["delve", "Delve Clearer", "Clear any Far Land Delve", 120, 50, (s) => Object.values(s.realm || {}).some((r) => r?.beat)],
  ["trial", "Trial Medalist", "Earn any Trial medal", 90, 40, (s) => Object.values(s.trials || {}).some((t) => t?.medal >= 1)],
  ["bounty", "Bounty Hunter", "Bring down your first bounty target", 120, 50, (s) => Object.keys(s.bounty?.done || {}).length >= 1],
  ["town", "Town Builder", "Finish a Town Council project", 140, 60, (s) => Object.values(s.square?.projects || {}).some((p) => p?.done)],
  ["caravan", "Caravan Charter", "Open an Astral Nexus Caravan route", 100, 45, (s) => Object.keys(s.nexus?.routes || {}).length >= 1],
  ["events", "Storm Chaser", "Complete 3 World Events", 90, 40, (s) => (s.ev?.done || 0) >= 3],
];

export function createBadges(o) {
  const { s, panel, toast, ping, save, hud, addRenown } = o;
  const st = (s.badges ||= {});
  st.claimed ||= {};
  st.streak ||= 0;
  st.lastDay ||= "";

  function open() {
    const t = today();
    const canDaily = st.lastDay !== t;
    const nextStreak = canDaily ? Math.min(7, st.streak + 1) : st.streak;
    const dailyPay = 15 + nextStreak * 15;

    const doneCount = BADGES.filter((b) => b[5](s)).length;
    const claimedCount = BADGES.filter((b) => st.claimed[b[0]]).length;

    const rows = BADGES.map(([id, name, desc, mon, ren, check]) => {
      const ok = !!check(s);
      const got = !!st.claimed[id];
      const btn = got
        ? `<span class="pill pill-done">Claimed ✓</span>`
        : ok
          ? `<button type="button" class="btn btn-accent" data-claim="${id}">Claim +${mon} mon</button>`
          : `<span class="pill">Locked</span>`;
      return `<div class="se-good"><span><strong>${esc(name)}</strong><small>${esc(desc)} · +${mon} mon, +${ren} Renown</small></span>${btn}</div>`;
    }).join("");

    panel("Trophies & Daily Streak", `
      <div class="se-mkt" style="margin-bottom:12px">
        <div class="se-good">
          <span><strong>🔥 Daily Check-In Streak: ${st.streak} day${st.streak === 1 ? "" : "s"}</strong><small>${canDaily ? `Claim today's bonus: +${dailyPay} mon & +20 Renown` : "Already claimed today — come back tomorrow!"}</small></span>
          <button type="button" class="btn btn-accent" id="bd-daily" ${canDaily ? "" : "disabled"}>${canDaily ? `Check In (+${dailyPay} mon)` : "Checked In ✓"}</button>
        </div>
      </div>
      <p class="muted">Milestones unlocked: <strong>${doneCount}/${BADGES.length}</strong> · Rewards claimed: <strong>${claimedCount}/${BADGES.length}</strong></p>
      <div class="se-mkt">${rows}</div>
    `, (e) => {
      e.querySelector("#bd-daily").onclick = () => {
        if (st.lastDay === today()) return;
        st.lastDay = today();
        st.streak = Math.min(7, (st.streak || 0) + 1);
        const pay = 15 + st.streak * 15;
        s.mon += pay;
        addRenown?.(20);
        ping("done");
        toast(`Day ${st.streak} streak! +${pay} mon & +20 Renown.`);
        save(); hud(); open();
      };
      e.querySelectorAll("[data-claim]").forEach((b) => {
        b.onclick = () => {
          const item = BADGES.find((x) => x[0] === b.dataset.claim);
          if (!item || st.claimed[item[0]] || !item[5](s)) return;
          st.claimed[item[0]] = Date.now();
          s.mon += item[3];
          addRenown?.(item[4]);
          ping("done");
          toast(`${item[1]}! +${item[3]} mon & +${item[4]} Renown.`);
          save(); hud(); open();
        };
      });
    });
  }

  return { open, state: st };
}
