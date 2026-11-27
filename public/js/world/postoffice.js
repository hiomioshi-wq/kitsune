// Foxhold Post Office: accept regional parcel contracts, claim deliveries, and send gift parcels to residents for Friendship Hearts.
import { esc, today } from "../util.js";

export function createPostOffice(o) {
  const { s, people, REGIONS, panel, toast, ping, save, hud, extras, giveHat, addRenown } = o;
  const st = (s.postOffice ||= {});
  st.done ||= 0;
  st.day ||= "";
  st.contracts ||= [];
  st.postcards ||= [];
  st.postcardDay ||= "";
  st.secretRoomUnlocked ||= false;
  st.secretRoomClaimed ||= false;
  st.letters ||= [];

  const LETTER_BODIES = [
    ["Tea & Rain", "The roof over the lantern-shed leaked onto my ledger again. How are the roads holding up on your end?"],
    ["A Strange Feather", "Found a silver-tipped owl feather by the milestone. Did your fox drop by Hollow Pine last night?"],
    ["Saltwick Tide", "The morning tide brought in three glass floats and a very stubborn crab. Write back when you're in town!"],
    ["Night Market Soup", "Ponzu tried adding star-anise to the turnip broth. Let me know if you survive a bowl!"],
    ["Returned from Tray Three", "A beige intake form stamped 'PROBABLY EATEN' washed onto our sorting table. We dried it out and pinned it to the board."],
    ["Eight Pawprints", "Someone's eight-legged dog ran straight through the clover field behind the post box. Left a stick by the door."],
    ["Postage Due · 1997", "A letter from the Retrospect Express arrived three seconds before we unlocked the mailbox. The conductor says keep the change."],
    ["Dead Letter Backlog", "Inspector Yuki dropped off three crates from the cardboard cathedral. Even the Printer was helping sort."],
    ["Bottle from Moonwake", "A corked bottle from Tide-Glass Watch rolled up the pier with a sea-glass charm inside."],
    ["Uncharted Atoll", "Our courier skiff spotted a palm sandbar past Saltwick with a fresh drift chest on the shore."],
  ];

  function ensureLetters() {
    const now = Date.now();
    let changed = false;
    // Queue a new letter if none pending/unread and fewer than 4 active
    if (!st.letters.some((l) => !l.replied) && st.letters.length < 12) {
      const npc = people[(st.done + st.letters.length * 3) % people.length];
      const tpl = LETTER_BODIES[st.letters.length % LETTER_BODIES.length];
      st.letters.unshift({
        id: `let_${now}`,
        fromId: npc?.id || "kitsu",
        from: npc?.n?.[2] || "Kitsu",
        subject: tpl[0],
        body: tpl[1],
        sentAt: now,
        deliverAt: now + 15000, // 15s real-time delivery delay
        replied: false,
        reminded: false,
      });
      changed = true;
    }
    for (const l of st.letters) {
      if (!l.replied && !l.reminded && now > l.deliverAt + 60000) {
        l.reminded = true;
        changed = true;
      }
    }
    if (changed) save();
  }

  const POSTCARDS = [
    { id: "pine-latch", clue: "Heard a soft foxfire click behind the third birch in Hollow Pine." },
    { id: "moss-key", clue: "Left a brass pine-cone key tucked under the lantern moss." },
    { id: "radio-dial", clue: "Tune the morning wireless to 108.4 kHz when the cedar mist rolls in." },
    { id: "owl-perch", clue: "The night owl drops cedar tokens on the hidden attic sill." },
    { id: "ember-note", clue: "Warm tea stains mark the trapdoor above the Hollow Pine hearth." },
    { id: "star-map", clue: "Six postmarks aligned reveal the secret room in Hollow Pine." },
  ];

  const regKeys = Object.keys(REGIONS);

  function ensureDay() {
    const t = today();
    let changed = false;
    if (st.postcardDay !== t && st.postcards.length < POSTCARDS.length) {
      const remaining = POSTCARDS.filter((p) => !st.postcards.some((got) => got.id === p.id));
      let ph = 71;
      for (const c of t) ph = (ph * 33 + c.charCodeAt(0)) >>> 0;
      const pick = remaining[ph % remaining.length];
      const sender = people[ph % people.length];
      st.postcards.push({ id: pick.id, from: sender?.n?.[2] || "Radio Fox", clue: pick.clue, day: t });
      st.postcardDay = t;
      if (st.postcards.length >= POSTCARDS.length) st.secretRoomUnlocked = true;
      changed = true;
    }
    if (st.day !== t || !st.contracts.length) {
      st.day = t;
      let h = 23;
      for (const c of t) h = (h * 31 + c.charCodeAt(0)) >>> 0;
      st.contracts = [0, 1, 2].map((i) => {
        h = (Math.imul(h ^ (h >>> 13), 1274126177) + 11) >>> 0;
        const rk = regKeys[h % regKeys.length];
        const npc = people[(h + i * 5) % people.length];
        const pay = 45 + (h % 55);
        return { id: `${t}:${i}`, region: rk, regionName: REGIONS[rk][0], to: npc.n[2], toId: npc.id, pay, claimed: false };
      });
      changed = true;
    }
    if (changed) save();
  }

  function open() {
    ensureDay();
    ensureLetters();
    const now = Date.now();
    const letterRows = st.letters.slice(0, 6).map((l, idx) => {
      const arrived = now >= l.deliverAt;
      const rem = arrived ? 0 : Math.ceil((l.deliverAt - now) / 1000);
      return `<div class="se-good">
        <span>
          <strong>✉️ ${esc(l.subject)} — from ${esc(l.from)}</strong>
          <small>${arrived ? `“${esc(l.body)}”` : `In transit by fox courier (${rem}s remaining)...`}</small>
          ${l.reminded && !l.replied ? `<small style="color:#f59e0b">💬 ${esc(l.from)} noticed you haven't written back yet!</small>` : ""}
        </span>
        ${!arrived ? `<span class="pill">In Transit</span>` : l.replied ? `<span class="pill pill-done">Replied ✓</span>` : `<button type="button" class="btn btn-sm btn-accent" data-reply="${idx}">Write Back (+20 mon)</button>`}
      </div>`;
    }).join("");

    const lostRows = (s.lostProperty || []).slice(0, 6).map((lp, idx) => `<div class="se-good">
      <span><strong>🧳 ${esc(lp.name)}</strong><small>${esc(lp.detail)}</small></span>
      ${lp.claimed ? `<span class="pill pill-done">Checked ✓</span>` : `<button type="button" class="btn btn-sm" data-lost="${idx}">Check In (+15 Renown)</button>`}
    </div>`).join("");
    const rows = st.contracts.map((c, i) => {
      const visited = !!s.visited?.[c.region];
      return `<div class="se-good">
        <span>
          <strong>📦 Parcel for ${esc(c.to)}</strong>
          <small>Destination: <b>${esc(c.regionName)}</b> · Pays <b>${c.pay} mon</b> + 20 Renown</small>
          <small class="muted">${visited ? "Route discovered ✓" : "Visit this region on the map to complete"}</small>
        </span>
        ${c.claimed
          ? `<span class="pill pill-done">Delivered ✓</span>`
          : `<button type="button" class="btn btn-sm btn-accent" data-del="${i}" ${visited ? "" : "disabled"}>${visited ? "Deliver" : "Locked"}</button>`}
      </div>`;
    }).join("");

    const giftCost = 20;
    const heartsMap = extras?.state ? (extras.state.hearts ||= {}) : null;
    const giftRows = people.slice(0, 8).map((p) => {
      const hrt = heartsMap?.[p.id] || 0;
      return `<button type="button" class="btn btn-sm" data-gift="${p.id}" ${!heartsMap || s.mon < giftCost || hrt >= 5 ? "disabled" : ""}>🎁 ${esc(p.n[2])} (${hrt}/5 ♥)</button>`;
    }).join("");

    const pcRows = st.postcards.map((pc) => `<div class="se-good">
      <span><strong>📻 Postcard from ${esc(pc.from)}</strong><small>“${esc(pc.clue)}”</small><small class="muted">Received ${esc(pc.day)}</small></span>
      <span class="pill pill-done">Collected</span>
    </div>`).join("");

    panel(`Foxhold Post Office · ${st.done} Delivered`, `
      <p class="muted">Deliver daily parcels to residents across discovered regions (5 deliveries unlocks the <strong>Express Courier Cap</strong>), or send a 20 mon Gift Parcel for +1 Friendship Heart.</p>
      <div class="se-mkt" style="margin-bottom:12px">${rows}</div>
      <h4>📻 Morning Radio Postcards (${st.postcards.length}/${POSTCARDS.length})</h4>
      <p class="muted">Each morning the town radio sends a handwritten mystery postcard from a resident. Collect all ${POSTCARDS.length} to unlock the secret room in Hollow Pine.</p>
      <div class="se-mkt" style="margin-bottom:10px">${pcRows || `<p class="muted">Tune in tomorrow morning for your next radio postcard.</p>`}</div>
      ${st.secretRoomUnlocked ? `<div class="se-good" style="margin-bottom:12px"><span><strong>🌲 Hollow Pine Secret Room</strong><small>The Postcard Attic is open! ${st.secretRoomClaimed ? "Attic archive visited ✓" : "Claim +150 mon & +60 Renown inside."}</small></span><button type="button" class="btn btn-sm btn-accent" id="po-room">${st.secretRoomClaimed ? "Visit Attic" : "Open Secret Room"}</button></div>` : ""}
      <h4>✉️ Fox Letters (Real-Time Courier)</h4>
      <div class="se-mkt" style="margin-bottom:12px">${letterRows}</div>
      <h4>🧳 Lost Property Office (${(s.lostProperty || []).length})</h4>
      <p class="muted">Items you sell, critters you fuse, or things you discard end up here with a resident.</p>
      <div class="se-mkt" style="margin-bottom:12px">${lostRows || `<p class="muted">Nothing misplaced yet.</p>`}</div>
      <h4>Send a Gift Parcel (20 mon → +1 ♥)</h4>
      <div class="chips">${giftRows}</div>
    `, (e) => {
      e.querySelectorAll("[data-reply]").forEach((b) => {
        b.onclick = () => {
          const l = st.letters[+b.dataset.reply];
          if (!l || l.replied || Date.now() < l.deliverAt) return;
          l.replied = true;
          s.mon += 20;
          addRenown?.(15);
          if (extras?.state?.hearts) extras.state.hearts[l.fromId] = Math.min(5, (extras.state.hearts[l.fromId] || 0) + 1);
          ping("done");
          toast(`Wrote back to ${l.from}! +20 mon & +1 Heart.`);
          save(); hud(); open();
        };
      });
      e.querySelectorAll("[data-lost]").forEach((b) => {
        b.onclick = () => {
          const lp = s.lostProperty?.[+b.dataset.lost];
          if (!lp || lp.claimed) return;
          lp.claimed = true;
          addRenown?.(15);
          ping("choice");
          toast(`${lp.finder} in ${lp.town} is thrilled you checked in on ${lp.name}! +15 Renown.`);
          save(); open();
        };
      });
      const roomBtn = e.querySelector("#po-room");
      if (roomBtn) {
        roomBtn.onclick = () => {
          if (!st.secretRoomClaimed) {
            st.secretRoomClaimed = true;
            s.mon += 150;
            addRenown?.(60);
            save(); hud();
            toast("Unlocked the Hollow Pine Postcard Attic! +150 mon & +60 Renown!");
          } else {
            toast("You step into the quiet Hollow Pine Postcard Attic, lined with glowing foxfire stamps.");
          }
          ping("done"); open();
        };
      }
      e.querySelectorAll("[data-del]").forEach((b) => {
        b.onclick = () => {
          const c = st.contracts[+b.dataset.del];
          if (!c || c.claimed || !s.visited?.[c.region]) return;
          c.claimed = true;
          st.done++;
          s.mon += c.pay;
          addRenown?.(20);
          if (st.done >= 5 && !s.hats.includes("posthat")) {
            giveHat?.("posthat");
            toast(`Delivered to ${c.to}! +${c.pay} mon & Express Courier Cap!`);
          } else {
            toast(`Delivered parcel to ${c.to}! +${c.pay} mon & +20 Renown!`);
          }
          ping("done"); save(); hud(); open();
        };
      });

      e.querySelectorAll("[data-gift]").forEach((b) => {
        b.onclick = () => {
          const id = b.dataset.gift;
          const hearts = extras?.state?.hearts;
          if (!hearts || s.mon < giftCost || (hearts[id] || 0) >= 5) return;
          s.mon -= giftCost;
          hearts[id] = (hearts[id] || 0) + 1;
          addRenown?.(10);
          ping("done");
          toast(`Sent a gift parcel! +1 Heart (${hearts[id]}/5 ♥).`);
          save(); hud(); open();
        };
      });
    });
  }

  return { open, state: st };
}
