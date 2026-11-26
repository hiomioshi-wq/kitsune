// The Blackwood Darwin Awards: the university's least dignified ceremony, held nightly in the
// Detention Wing cafeteria. Awards are given posthumously, honorary, or in one case annually.
// Deterministic by day; the crowd favourite vote pays mon, and the Golden Stairwell trophy hat
// goes to whoever can sit through an entire ceremony without learning anything.
export const DARWIN_CATEGORIES = ["Improvised Flight", "Cafeteria Science", "Stairwell Relations", "Fieldwork", "Unauthorized Pets", "Powers Misapplied", "Fire Safety", "Meridian Curiosity"];
export const DARWIN_NOMINEES = [
  ["Kevin", "Zero-G Drifted into the ceiling fan of a room with no ceiling fan, on the grounds that if there had been one, it would have been really dangerous."],
  ["Madison", "Rewrote her own memory so thoroughly that she forgot to hand in the memory-rewriting assignment."],
  ["Yuki", "Mortality Services paperwork filed in triplicate, in the drop box of the Hungry Stairwell, during closing hours, while the Stairwell was hungry."],
  ["Officer Rusk", "Issued detention to a manifestation of school spirit, then escorted it to Detention, where it escaped, because it is the size of the building."],
  ["Luna", "Time-snapped back to Tuesday to retake a quiz she had not yet failed."],
  ["Imani", "Grew one leaf. Ate the leaf. Filed a research paper about the leaf. The paper is very good. The leaf was poison ivy, which her own power had labelled."],
  ["Nurse Marlowe", "Attempted to cleanse the flu with the flu. It went how you'd expect. Twice."],
  ["War (guest lecturer)", "Ended the seminar. Then restarted it, because the syllabus said the seminar ends at three."],
  ["Biscuit", "Ate the Bunsen burner. Spent one week as a small kettle."],
  ["Poppy", "Told the truth to the Wall Yuki Opened, which was fine, except she told it in answers."],
  ["Kimiko", "Shadow-inked her homework directly into the syllabus, making it permanent, which is why everyone is now enrolled."],
  ["Saffron", "Blessed the toaster. Nobody has blessed the toaster since. Everyone remembers why."],
  ["Officer Rusk (again)", "Escorted himself out of the building, using the form he was supposed to be holding for the building."],
  ["The Detention Wing (as an entity)", "Detained itself for one afternoon for holding contraband: the detention slips."],
  ["Violet", "Kiln-miraged a pizza into the furnace. The furnace has opinions now. All of them are about pizza."],
];
export const DARWIN_OPENERS = ["The Dean of Discipline clears her throat. The room is already on fire, which is traditional.", "The trophy is carried in upside down. It is always carried in upside down; nobody remembers why, and the one year they fixed it, everyone fell down the stairs.", "The ceremony opens with the school song, performed by people who do not know it, in a key that Mortality Services has flagged as a hazard.", "The bins are provided for the customary heckling. The heckling is provided by the Stairwell, which is, as always, hungry and awake.", "Two seats are left empty at the front: one for Death (attending), one for the vending machine (out of order, again)."];
export const DARWIN_CLOSERS = ["The ceremony ends when the lights go out. The lights are not on a timer; they simply know.", "Everyone applauds. The applause sets off the sprinklers, which is the encore.", "The floor is opened for questions. The floor declines.", "Certificates are handed out to whoever is left standing. This year, as always, it is mostly the vending machine.", "The room is declared historic, which exempts it from the fire code, which explains the fire."];
export const nomineesFor = (day) => { const r = rngFor("darwin" + day), pool = [...DARWIN_NOMINEES]; return [0, 1, 2].map(() => pool.splice(Math.floor(r() * pool.length), 1)[0]); };
export const citationsFor = (day) => { const r = rngFor("darwin-cite" + day); return Array.from({ length: 5 }, () => { const cat = DARWIN_CATEGORIES[Math.floor(r() * DARWIN_CATEGORIES.length)], nom = DARWIN_NOMINEES[Math.floor(r() * DARWIN_NOMINEES.length)]; return { cat, nom }; }); };
export const crowdFavourite = (day) => { const r = rngFor("darwin-vote" + day); return Math.floor(r() * 3); };
const hash = (t) => { let h = 2166136261; for (let i = 0; i < t.length; i++) h = Math.imul(h ^ t.charCodeAt(i), 16777619); return h >>> 0; }, rngFor = (k) => { let h = hash(k); return () => { h = (Math.imul(h ^ (h >>> 13), 1274126177) + 7) >>> 0; return h / 4294967296; }; };

export function ensureDarwin(s) { const st = (s.darwin ||= {}); st.picked ??= {}; const d = new Date().toDateString(); if (st.day?.d !== d) st.day = { d, voted: 0 }; return st; }

export function darwinPage(ctx) {
  const { s, panel, toast, ping, save, hud, esc, giveHat } = ctx, st = ensureDarwin(s);
  const day = new Date().toDateString(), noms = nomineesFor(day), cites = citationsFor(day), fav = crowdFavourite(day), opener = DARWIN_OPENERS[hash("darwin-open" + day) % DARWIN_OPENERS.length], closer = DARWIN_CLOSERS[hash("darwin-close" + day) % DARWIN_CLOSERS.length];
  const total = Object.keys(st.picked).length;
  const body = (voted) => `<p class="muted">${esc(opener)}</p>
    <h3 style="margin:10px 0 4px;color:var(--accent,#b3541e)">Tonight's citations</h3>
    <ol class="wd-list">${cites.map((q) => `<li><strong>${esc(q.nom[0])} · ${esc(q.cat)}</strong><span>${esc(q.nom[1])}</span></li>`).join("")}</ol>
    <h3 style="margin:12px 0 4px;color:var(--accent,#b3541e)">The Golden Stairwell: crowd favourite</h3>
    <p class="muted">One vote a night. The crowd is always right, except when it isn't, which is what the crowd is for.</p>
    <div class="by-grid">${voted ? noms.map((q, i) => `<div class="by-pet ${i === fav ? "on" : ""}" style="--r:${i === fav ? "#ffd84d" : "#b8c0c8"}"><span>${i === fav ? "🏆 " : ""}${esc(q[0])}</span><small>${i === fav ? "Golden Stairwell winner" : "Also present"}</small></div>`).join("") : noms.map((q, i) => `<button type="button" class="by-pet" style="--r:#b8c0c8" data-vote="${i}"><strong>${esc(q[0])}</strong><small>${esc(q[1].slice(0, 90))}${q[1].length > 90 ? "…" : ""}</small></button>`).join("")}</div>
    ${voted ? `<p class="muted" style="margin-top:8px">${esc(closer)}</p>` : ""}
    <p class="muted" style="margin-top:8px">Ceremonies attended: <strong>${total}</strong> · ${st.hat ? "The Golden Stairwell trophy hat is yours." : total >= 5 ? "Five ceremonies: the trophy hat is waiting to be claimed." : `Attend ${5 - total} more to earn the trophy hat.`}</p>
    ${total >= 5 && !st.hat ? `<button class="btn btn-accent" type="button" id="dw-claim">Claim the Golden Stairwell trophy hat</button>` : ""}`;
  panel("The Blackwood Darwin Awards", body(!!st.day.voted), (e) => {
    e.querySelectorAll("[data-vote]").forEach((b) => (b.onclick = () => {
      if (st.day.voted) return;
      const i = +b.dataset.vote; st.day.voted = 1; st.picked[day] = i;
      const won = i === fav; const pay = won ? 120 : 40; s.mon += pay; let hatLine = "";
      if (total + 1 >= 5 && !st.hat) { st.hat = 1; giveHat("darwinhat"); hatLine = " The Golden Stairwell trophy hat is yours — a small stairwell, plated, that you may wear."; }
      save(); hud(); ping(won ? "done" : "choice");
      toast(won ? `The crowd roars! +${pay} mon${hatLine}` : `The crowd disagrees, politely. +${pay} mon`);
      darwinPage(ctx);
    }));
    const cl = e.querySelector("#dw-claim"); if (cl) cl.onclick = () => { if (st.hat) return; st.hat = 1; giveHat("darwinhat"); save(); ping("done"); toast("The trophy stairwell is yours. Mind the steps."); darwinPage(ctx); };
  });
}
