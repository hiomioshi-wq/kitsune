// The Bookworm Tunnels: a chapter-generated delve built from whatever book you're reading.
import { esc } from "../util.js";
import { lib } from "../store.js";

function chaptersFor(item) {
  if (!item) {
    return [
      "Ch. 1: The Dusty Index",
      "Ch. 2: Footnote Hollow",
      "Ch. 3: The Uncut Margins",
      "Ch. 4: The Final Chapter",
    ];
  }
  const raw = item.toc || item.chapters;
  if (Array.isArray(raw) && raw.length >= 2) {
    return raw.slice(0, 6).map((c, i) => (typeof c === "string" ? c : c?.title || `Chapter ${i + 1}`));
  }
  const base = item.series || item.title || "Untitled Volume";
  const count = Math.max(3, Math.min(5, Math.ceil((item.pages || 60) / 30)));
  const names = ["Opening Margin", "Folded Spine", "Inkwell Crossing", "Climax Archive", "Epilogue Vault"];
  return Array.from({ length: count }, (_, i) => `Ch. ${i + 1}: ${base} — ${names[i] || `Section ${i + 1}`}`);
}

export function createBookworm(o) {
  const { s, panel, toast, ping, save, hud, addRenown } = o;
  const st = (s.bookworm ||= {});
  st.clears ||= 0;
  st.done ||= {};

  let run = null;

  function pickBook() {
    const items = lib?.items || [];
    return items.find((i) => i.status === "reading") || items[0] || null;
  }

  function startRun() {
    const book = pickBook();
    const chs = chaptersFor(book);
    run = {
      bookId: book?.id || "sample",
      title: book?.title || "The Bookworm's Primer",
      chapters: chs,
      floor: 0,
      hp: 10,
      maxHp: 10,
      bossHp: 6,
      over: false,
      log: `Descended into ${chs[0]}.`,
    };
    open();
  }

  function open() {
    if (!run) {
      const book = pickBook();
      const chs = chaptersFor(book);
      panel("The Bookworm Tunnels", `
        <p class="muted">A living delve carved from the table of contents of what you're reading: <strong>${esc(book?.title || "Sample Volume")}</strong>.</p>
        <p>Tunnels cleared: <strong>${st.clears}</strong></p>
        <h4>Generated Floors (${chs.length})</h4>
        <ol class="wd-list" style="margin-bottom:12px">${chs.map((c, i) => `<li><strong>${esc(c)}</strong><span>${i === chs.length - 1 ? "Final Chapter Boss" : "Tunnel Room"}</span></li>`).join("")}</ol>
        <button type="button" class="btn btn-accent" id="bw-go">Enter Bookworm Tunnels</button>
      `, (e) => {
        e.querySelector("#bw-go").onclick = startRun;
      });
      return;
    }

    const ch = run.chapters[run.floor];
    const isBoss = run.floor === run.chapters.length - 1;
    const bossName = `Guardian of ${ch}`;

    panel(`Bookworm Tunnels · Floor ${run.floor + 1}/${run.chapters.length}`, `
      <p class="muted"><strong>${esc(run.title)}</strong> · Room: <b>${esc(ch)}</b></p>
      <p>Fox HP: <strong>${run.hp}/${run.maxHp}</strong>${isBoss ? ` · <b>${esc(bossName)}</b> HP: <strong>${run.bossHp}/6</strong>` : ""}</p>
      <div class="hint" style="margin:10px 0">${esc(run.log)}</div>
      <div class="px-row">
        ${run.over
          ? `<button type="button" class="btn btn-accent" id="bw-again">Delve Again</button><button type="button" class="btn" id="bw-exit">Leave</button>`
          : isBoss
            ? `<button type="button" class="btn btn-accent" id="bw-strike">Strike Boss</button><button type="button" class="btn" id="bw-mend">Read Margin (+3 HP)</button>`
            : `<button type="button" class="btn btn-accent" id="bw-step">Advance to Next Chapter</button><button type="button" class="btn" id="bw-mend">Read Margin (+3 HP)</button>`}
      </div>
    `, (e) => {
      const exit = e.querySelector("#bw-exit");
      if (exit) exit.onclick = () => { run = null; open(); };
      const again = e.querySelector("#bw-again");
      if (again) again.onclick = startRun;

      const mend = e.querySelector("#bw-mend");
      if (mend) mend.onclick = () => {
        run.hp = Math.min(run.maxHp, run.hp + 3);
        run.log = "A calm margin note restores +3 HP.";
        ping("blip"); open();
      };

      const step = e.querySelector("#bw-step");
      if (step) step.onclick = () => {
        const dmg = Math.random() < 0.4 ? 2 : 1;
        run.hp = Math.max(1, run.hp - dmg);
        run.floor++;
        const nextCh = run.chapters[run.floor];
        run.log = `Cleared ${ch} (-${dmg} HP from paper-mites). Entered ${nextCh}!`;
        ping("choice"); open();
      };

      const strike = e.querySelector("#bw-strike");
      if (strike) strike.onclick = () => {
        const hit = 2 + Math.floor(Math.random() * 2);
        run.bossHp = Math.max(0, run.bossHp - hit);
        if (run.bossHp <= 0) {
          run.over = true;
          st.clears++;
          st.done[run.bookId] = true;
          s.mon += 120;
          addRenown?.(40);
          run.log = `Defeated ${bossName}! +120 mon & +40 Renown!`;
          ping("done"); save(); hud();
          toast(`Cleared The Bookworm Tunnels (${run.title})! +120 mon`);
        } else {
          const hurt = 1 + Math.floor(Math.random() * 2);
          run.hp -= hurt;
          if (run.hp <= 0) {
            run.hp = 0;
            run.over = true;
            run.log = `${bossName} overwhelmed you on the final page!`;
            ping("close");
          } else {
            run.log = `Struck ${bossName} for ${hit} dmg! It countered for ${hurt} HP.`;
            ping("blip");
          }
        }
        open();
      };
    });
  }

  return { open, state: st };
}
