// Foxhold Lantern Arcade: Reaction Reflex Tap & Number Oracle (1–100 in 7 guesses) for mon and Renown.
export function createArcade(o) {
  const { s, panel, toast, ping, save, hud, addRenown } = o;
  const st = (s.arcade ||= {});
  st.bestReflex ||= 0;
  st.oracleWins ||= 0;

  let tab = "reflex";
  let oracle = null;

  function open(nextTab = tab) {
    tab = nextTab;
    const tabs = [
      ["reflex", "Foxfire Reflex"],
      ["oracle", "Number Oracle (1–100)"],
    ].map(([k, l]) => `<button type="button" class="chip${tab === k ? " on" : ""}" data-tab="${k}">${l}</button>`).join("");

    let body = "";
    if (tab === "reflex") {
      body = `
        <p class="muted">Click the glowing lantern pad as soon as it lights up! Wait for green — clicking early resets. Best reaction: <strong>${st.bestReflex ? `${st.bestReflex} ms` : "—"}</strong></p>
        <div style="display:flex;flex-direction:column;align-items:center;gap:12px;margin:14px 0">
          <button type="button" id="ar-pad" style="width:220px;height:120px;border-radius:16px;border:3px solid #d9a84e;background:#2a1d36;color:#fff;font:900 18px system-ui;cursor:pointer">Start Reflex Test</button>
          <div id="ar-msg" class="muted">Fast reflexes (< 320 ms) win +35 mon!</div>
        </div>`;
    } else {
      if (!oracle) {
        body = `
          <p class="muted">Guess the secret number between <strong>1 and 100</strong> in 7 tries or fewer to win <strong>45 mon</strong> &amp; <strong>+20 Renown</strong>!</p>
          <p>Oracle wins: <strong>${st.oracleWins}</strong></p>
          <button type="button" class="btn btn-accent" id="or-go">Start New Game</button>`;
      } else {
        body = `
          <p class="muted">Tries left: <strong>${7 - oracle.tries}</strong> · ${oracle.hint}</p>
          ${oracle.over
            ? `<button type="button" class="btn btn-accent" id="or-go">Play Again</button>`
            : `<form id="or-f" class="px-row"><input type="number" id="or-in" class="field" min="1" max="100" required placeholder="1–100" style="max-width:120px" autofocus><button class="btn btn-accent">Guess</button></form>`}`;
      }
    }

    panel(`Foxhold Lantern Arcade · ${s.mon} mon`, `
      <div class="chips" style="margin-bottom:12px">${tabs}</div>
      ${body}
    `, (e) => {
      e.querySelectorAll("[data-tab]").forEach((b) => (b.onclick = () => open(b.dataset.tab)));

      const pad = e.querySelector("#ar-pad");
      const msg = e.querySelector("#ar-msg");
      if (pad) {
        let state = "idle", timer = 0, t0 = 0;
        pad.onclick = () => {
          if (state === "idle") {
            state = "wait";
            pad.style.background = "#8a2832";
            pad.textContent = "Wait for Green…";
            timer = setTimeout(() => {
              if (!pad.isConnected) return;
              state = "go";
              t0 = performance.now();
              pad.style.background = "#248f5a";
              pad.textContent = "CLICK NOW!";
              ping("choice");
            }, 900 + Math.random() * 1900);
          } else if (state === "wait") {
            clearTimeout(timer);
            state = "idle";
            pad.style.background = "#2a1d36";
            pad.textContent = "Too early! Retry";
            ping("blip");
          } else if (state === "go") {
            const ms = Math.round(performance.now() - t0);
            state = "idle";
            pad.style.background = "#2a1d36";
            pad.textContent = `${ms} ms · Play Again`;
            if (!st.bestReflex || ms < st.bestReflex) st.bestReflex = ms;
            const pay = ms < 240 ? 45 : ms < 320 ? 35 : ms < 450 ? 15 : 5;
            s.mon += pay;
            addRenown?.(pay >= 35 ? 15 : 5);
            ping("done");
            msg.textContent = `${ms} ms! Earned +${pay} mon!`;
            save(); hud();
          }
        };
      }

      const orGo = e.querySelector("#or-go");
      if (orGo) orGo.onclick = () => {
        oracle = { ans: 1 + Math.floor(Math.random() * 100), tries: 0, hint: "Pick a number 1–100.", over: false };
        open();
      };

      const orForm = e.querySelector("#or-f");
      if (orForm) orForm.onsubmit = (ev) => {
        ev.preventDefault();
        const val = +e.querySelector("#or-in").value;
        if (!val || val < 1 || val > 100) return;
        oracle.tries++;
        if (val === oracle.ans) {
          oracle.over = true;
          oracle.hint = `Correct! It was ${oracle.ans}!`;
          st.oracleWins++;
          s.mon += 45;
          addRenown?.(20);
          ping("done");
          toast(`Oracle solved in ${oracle.tries} tries! +45 mon & +20 Renown!`);
          save(); hud();
        } else if (oracle.tries >= 7) {
          oracle.over = true;
          oracle.hint = `Out of tries! The number was ${oracle.ans}.`;
          ping("blip");
        } else {
          oracle.hint = val < oracle.ans ? `${val} is too LOW!` : `${val} is too HIGH!`;
          ping("blip");
        }
        open();
      };
    });
  }

  return { open, state: st };
}
