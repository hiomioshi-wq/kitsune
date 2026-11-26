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
      <h4>Send a Gift Parcel (20 mon → +1 ♥)</h4>
      <div class="chips">${giftRows}</div>
    `, (e) => {
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
