// Saltwick Tidepool Dive: 5x4 shell-flipping board. Uncover pearls and sea loot before hitting 2 sea urchins!
import { today } from "../util.js";

export function createTidepool(o) {
  const { s, panel, toast, ping, save, hud, extras, addRenown } = o;
  const st = (s.tidepool ||= {});
  st.plays ||= 0;
  st.pearls ||= 0;
  st.freeDay ||= "";

  let board = null;
  const addLoot = (id, n = 1) => {
    const bag = extras?.state?.bag || ((s.x2 ||= {}).bag ||= {});
    bag[id] = (bag[id] || 0) + n;
  };

  function startBoard(cost) {
    if (cost > 0 && s.mon < cost) return toast("Not enough mon.");
    if (cost > 0) s.mon -= cost;
    else st.freeDay = today();
    st.plays++;

    const pool = [
      "pearl", "pearl", "pearl", "pearl",
      "shell", "shell", "shell", "shell",
      "kelp", "kelp", "kelp",
      "mon", "mon", "mon", "mon", "mon",
      "urchin", "urchin", "urchin", "urchin",
    ].sort(() => Math.random() - 0.5);

    board = {
      cells: pool.map((k) => ({ k, open: false })),
      pearls: 0,
      urchins: 0,
      over: false,
      wonMon: 0,
    };
    ping("choice"); save(); hud(); open();
  }

  function open() {
    const canFree = st.freeDay !== today();
    const icons = { pearl: "🦪", shell: "🐚", kelp: "🌿", mon: "🪙", urchin: "🟣" };

    let body = "";
    if (!board) {
      body = `
        <p class="muted">Flip tiles in the Saltwick Tidepool! Find <strong>3 Pearls</strong> (🦪) for a +75 mon bonus &amp; real Pearl loot. Hit <strong>2 Sea Urchins</strong> (🟣) and the dive ends!</p>
        <p>Dives: <strong>${st.plays}</strong> · Pearls found: <strong>${st.pearls}</strong></p>
        <button type="button" class="btn btn-accent" id="tp-go" ${!canFree && s.mon < 10 ? "disabled" : ""}>${canFree ? "Daily Free Dive" : "Dive Tidepool (10 mon)"}</button>`;
    } else {
      const grid = board.cells.map((c, i) => `
        <button type="button" data-tp="${i}" ${c.open || board.over ? "disabled" : ""} style="height:64px;border-radius:10px;border:2px solid ${c.open ? (c.k === "urchin" ? "#ff5a6a" : "#7fe0d0") : "#3d8fc4"};background:${c.open ? "rgba(20,50,70,.6)" : "rgba(61,143,196,.25)"};font-size:26px;cursor:pointer">
          ${c.open ? icons[c.k] : "🌊"}
        </button>`).join("");

      body = `
        <p class="muted">Pearls: <strong>${board.pearls}/3</strong> · Urchins: <strong>${board.urchins}/2</strong> · Dive Mon: <strong>+${board.wonMon}</strong></p>
        <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin:10px 0">${grid}</div>
        ${board.over
          ? `<div class="px-row"><button type="button" class="btn btn-accent" id="tp-go" ${!canFree && s.mon < 10 ? "disabled" : ""}>${canFree ? "Daily Free Dive" : "Dive Again (10 mon)"}</button></div>`
          : ""}`;
    }

    panel(`Saltwick Tidepool · ${s.mon} mon`, body, (e) => {
      const go = e.querySelector("#tp-go");
      if (go) go.onclick = () => startBoard(st.freeDay !== today() ? 0 : 10);

      e.querySelectorAll("[data-tp]").forEach((b) => {
        b.onclick = () => {
          if (!board || board.over) return;
          const c = board.cells[+b.dataset.tp];
          if (c.open) return;
          c.open = true;

          if (c.k === "urchin") {
            board.urchins++;
            ping("blip");
            if (board.urchins >= 2) {
              board.over = true;
              toast("Ouch! 2 Sea Urchins ended the dive.");
            }
          } else if (c.k === "pearl") {
            board.pearls++;
            st.pearls++;
            addLoot("pearl", 1);
            s.mon += 20;
            board.wonMon += 20;
            ping("done");
            if (board.pearls >= 3) {
              board.over = true;
              s.mon += 75;
              board.wonMon += 75;
              addRenown?.(25);
              toast("3 Pearls! +75 mon bonus & +25 Renown!");
            }
          } else if (c.k === "shell") {
            addLoot("shell", 1);
            s.mon += 6;
            board.wonMon += 6;
            ping("choice");
          } else if (c.k === "kelp") {
            addLoot("kelp", 1);
            s.mon += 4;
            board.wonMon += 4;
            ping("choice");
          } else {
            s.mon += 12;
            board.wonMon += 12;
            ping("choice");
          }
          save(); hud(); open();
        };
      });
    });
  }

  return { open, state: st };
}
