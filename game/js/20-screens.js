/* ---------- Screens ---------- */
const RENDER = {euro:()=>renderCups(), camp:()=>renderCamp(), training:()=>renderTraining(), transfer:()=>renderTransfer(), menu:()=>renderMenu(),
  table:()=>renderTable(), squad:()=>renderSquad(), stadium:()=>renderStadium(), bank:()=>renderBank(), sponsor:()=>renderSponsor(),
  start:()=>renderStart(), handover:()=>renderHandover(), editor:()=>renderEditor(), opts:()=>renderOpts()};
function show(name){
  if (name !== "match") SFX.stop();
  $$("section.screen").forEach(s => { s.hidden = s.id !== "scr-" + name; });
  if (RENDER[name]) RENDER[name]();
  window.scrollTo(0,0);
}
document.addEventListener("click", e => { const g = e.target.closest("[data-go]"); if (g) show(g.dataset.go); });

function onOff(el, val, set){
  el.innerHTML = `<button type="button" aria-pressed="${val}">AN</button><button type="button" aria-pressed="${!val}">AUS</button>`;
  el.children[0].onclick = () => { set(true); saveOpts(); renderSegs(); };
  el.children[1].onclick = () => { set(false); saveOpts(); renderSegs(); };
}
function renderSegs(){
  $$('.seg[data-opt="scenes"]').forEach(el => onOff(el, OPTS.scenes, v => OPTS.scenes = v));
  $$('.seg[data-opt="sound"]').forEach(el => onOff(el, OPTS.sound, v => { OPTS.sound = v; if (v) SFX.unlock(); else SFX.stop(); }));
  $$('.seg[data-opt="speed"]').forEach(el => {
    el.innerHTML = ["L","2","3","S"].map((l,i) => `<button type="button" aria-label="Tempo ${i+1}" aria-pressed="${OPTS.speed===i}">${l}</button>`).join("");
    [...el.children].forEach((b,i) => b.onclick = () => { OPTS.speed = i; saveOpts(); renderSegs(); });
  });
}
function renderOpts(){ renderSegs(); }

/* ---------- Start: Spielstände und neues Spiel ---------- */
let setup = [{name:"", club:"wes"}], activeMgr = 0, startLg = 1, newSlot = 0, confirmSlot = 0, delAsk = 0;
function renderStart(){
  renderSegs();
  // Spielstände
  let rows = "";
  for (let n = 1; n <= SLOTS; n++){
    const m = slotInfo(n);
    if (!m){ rows += `<div class="offer slot"><div class="nm"><b>Platz ${n}</b> · frei</div></div>`; continue; }
    const cur = S && S.slot === n;
    rows += `<div class="offer slot${cur ? " signed" : ""}"><div class="nm"><b>Platz ${n}</b> · ${esc(m.clubs.join(", "))}<small>Saison ${m.season} · ${m.md}. Spieltag gespielt${m.names && m.names.length > 1 ? " · " + esc(m.names.join(", ")) : ""}${cur ? " · gerade geöffnet" : ""}</small></div>
      <div class="btns"><button type="button" class="btn sm" data-load="${n}">${cur ? "Weiter" : "Laden"}</button><button type="button" class="btn sm ghost" data-exp="${n}">Export</button><button type="button" class="btn sm ghost" data-del="${n}">${delAsk === n ? "Wirklich?" : "Löschen"}</button></div></div>`;
  }
  $("#slots").innerHTML = rows;
  $$("[data-load]").forEach(b => b.onclick = () => {
    const n = +b.dataset.load;
    if (!(S && S.slot === n) && !loadSlot(n)){ $("#slot-msg").textContent = "Dieser Spielstand ließ sich nicht laden."; return; }
    beginTurnsIfNeeded();
    show(multi() ? "handover" : "menu");
  });
  $$("[data-del]").forEach(b => b.onclick = () => {
    const n = +b.dataset.del;
    if (delAsk !== n){ delAsk = n; renderStart(); return; }
    deleteSlot(n); delAsk = 0; if (S && S.slot === n) S = null;
    $("#slot-msg").textContent = `Platz ${n} gelöscht.`; renderStart();
  });
  $$("[data-exp]").forEach(b => b.onclick = () => exportSlot(+b.dataset.exp));
  // Neues Spiel
  $("#mgr-n").innerHTML = [1,2,3,4].map(n => `<button type="button" aria-pressed="${setup.length === n}">${n}</button>`).join("");
  [...$("#mgr-n").children].forEach((b, i) => b.onclick = () => {
    const n = i + 1;
    while (setup.length < n){ const taken = new Set(setup.map(x => x.club)); setup.push({name:"", club:CLUBS.find(c => c.lg === startLg && !taken.has(c.id)).id}); }
    setup.length = n; activeMgr = Math.min(activeMgr, n - 1); renderStart();
  });
  $("#mgr-rows").innerHTML = setup.map((x, i) => `<div class="mrow${i === activeMgr ? " on" : ""}">
      <button type="button" class="mpick" data-mi="${i}" aria-pressed="${i === activeMgr}" aria-label="Verein für Manager ${i+1} wählen"><span class="tile">${crest(byId[x.club])}</span></button>
      <input type="text" id="mname-${i}" maxlength="14" placeholder="Manager ${i+1}" value="${esc(x.name)}" aria-label="Name von Manager ${i+1}">
      <span class="mclub">${esc(byId[x.club].short)} · ${LNAME[byId[x.club].lg]}</span></div>`).join("");
  $$("[data-mi]").forEach(b => b.onclick = () => { activeMgr = +b.dataset.mi; startLg = byId[setup[activeMgr].club].lg; renderStart(); });
  setup.forEach((x, i) => { const inp = $("#mname-" + i); inp.oninput = () => x.name = inp.value; inp.onfocus = () => { if (activeMgr !== i){ activeMgr = i; $$(".mrow").forEach((r, k) => r.classList.toggle("on", k === i)); $("#pick-t").textContent = pickTitle(); renderClubGrid(); } }; });
  $("#pick-t").textContent = pickTitle();
  $("#lg-tabs").innerHTML = [1,2,3].map(n => `<button type="button" aria-pressed="${startLg===n}">${LNAME[n]}</button>`).join("");
  [...$("#lg-tabs").children].forEach((b, i) => b.onclick = () => { startLg = i + 1; renderClubGrid(); [...$("#lg-tabs").children].forEach((x, k) => x.setAttribute("aria-pressed", k === i)); });
  renderClubGrid();
  // Speicherplatz
  if (!newSlot) newSlot = freeSlot() || 1;
  $("#slot-pick").innerHTML = Array.from({length:SLOTS}, (_, i) => `<button type="button" aria-pressed="${newSlot === i+1}">${i+1}${slotInfo(i+1) ? " ●" : ""}</button>`).join("");
  [...$("#slot-pick").children].forEach((b, i) => b.onclick = () => { newSlot = i + 1; confirmSlot = 0; renderStart(); });
  $("#slot-warn").textContent = slotInfo(newSlot) ? `Platz ${newSlot} ist belegt und wird überschrieben.` : `Das Spiel wird auf Platz ${newSlot} gespeichert. ● = belegt.`;
  $("#btn-new").textContent = confirmSlot === newSlot ? `Platz ${newSlot} überschreiben und starten` : "Saison starten";
}
const pickTitle = () => setup.length > 1 ? `Verein für ${setup[activeMgr].name.trim() || "Manager " + (activeMgr + 1)} wählen` : "Verein wählen";
function renderClubGrid(){
  const taken = new Map(setup.map((x, i) => [x.club, i]));
  $("#clubs").innerHTML = CLUBS.filter(c => c.lg === startLg).map(c => {
    const t = taken.get(c.id), other = t !== undefined && t !== activeMgr;
    return `<button type="button" class="club" data-id="${c.id}" aria-pressed="${t === activeMgr}" ${other ? "disabled" : ""}><div class="tile">${crest(c)}</div><span>${esc(c.short)}${other ? ` <em>M${t+1}</em>` : ""}</span></button>`;
  }).join("");
  $$("#clubs .club").forEach(b => b.onclick = () => { setup[activeMgr].club = b.dataset.id; renderStart(); });
}
$("#btn-new").onclick = () => {
  if (slotInfo(newSlot) && confirmSlot !== newSlot){ confirmSlot = newSlot; renderStart(); return; }
  confirmSlot = 0;
  SFX.unlock();
  newGame(setup.map(x => ({...x})), newSlot);
  newSlot = 0;
  show(multi() ? "handover" : "menu");
};
function beginTurnsIfNeeded(){ const ord = turnOrder(); if (ord.length && !ord.includes(S.cur)) beginTurns(); }

/* Export / Import */
function exportSlot(n){
  const raw = localStorage.getItem(slotKey(n)); if (!raw) return;
  const txt = JSON.stringify({libero91:2, S:JSON.parse(raw)});
  const meta = slotInfo(n);
  const file = `Libero91-${(meta?.clubs?.[0] || "Spielstand").replace(/[^\wäöüÄÖÜß-]+/g, "")}-Saison${meta?.season || 1}.json`;
  if (window.Android && Android.exportSave){ Android.exportSave(file, txt); return; }
  $("#exp-box").hidden = false; $("#imp-box").hidden = true;
  $("#exp-hint").textContent = `Platz ${n}: Text kopieren und z. B. in einer Notiz oder Mail sichern. Zum Wiederherstellen unter „Spielstand importieren“ einfügen.`;
  $("#exp-text").value = txt;
}
$("#exp-copy").onclick = async () => {
  const t = $("#exp-text");
  try { await navigator.clipboard.writeText(t.value); $("#slot-msg").textContent = "Spielstand kopiert."; }
  catch(e){ t.focus(); t.select(); $("#slot-msg").textContent = "Text ist markiert – jetzt kopieren."; }
};
$("#exp-close").onclick = () => { $("#exp-box").hidden = true; };
$("#imp-btn").onclick = () => {
  if (!freeSlot()){ $("#slot-msg").textContent = "Alle Plätze sind belegt. Bitte erst einen Spielstand löschen."; return; }
  if (window.Android && Android.importSave){ Android.importSave(); return; }
  $("#imp-box").hidden = false; $("#exp-box").hidden = true;
};
$("#imp-cancel").onclick = () => { $("#imp-box").hidden = true; };
$("#imp-file").onchange = () => {
  const f = $("#imp-file").files[0]; if (!f) return;
  const r = new FileReader(); r.onload = () => libImport(String(r.result)); r.readAsText(f);
};
$("#imp-go").onclick = () => libImport($("#imp-text").value);
/* wird auch von der Android-App nach der Dateiauswahl aufgerufen */
function libImport(txt){
  const n = freeSlot();
  if (!n){ $("#slot-msg").textContent = "Alle Plätze sind belegt. Bitte erst einen Spielstand löschen."; return; }
  const err = importText(txt, n);
  $("#slot-msg").textContent = err || `Spielstand auf Platz ${n} importiert.`;
  if (!err){ $("#imp-box").hidden = true; $("#imp-text").value = ""; }
  renderStart();
}
window.libImport = libImport;

/* ---------- Managerwechsel ---------- */
function renderHandover(){
  const c = byId[S.my], e = nextUserEvent();
  $("#ho-crest").innerHTML = crest(c);
  $("#ho-name").textContent = S.mname;
  $("#ho-club").textContent = `${c.name} · ${LNAME[myLg()]}`;
  $("#ho-next").textContent = e ? `Als Nächstes: ${e.t === "liga" ? `${e.md + 1}. Spieltag` : COMPS[cupComps(e).find(k => myTie(e, k)) || cupComps(e)[0]]}` : "Die Saison ist beendet.";
}
$("#ho-go").onclick = () => show("menu");

/* ---------- Kalender ---------- */
function eventDate(e){
  const d = mdDate(e.md);
  if (e.t === "euro") d.setDate(d.getDate() + 4);
  if (e.t === "pokal") d.setDate(d.getDate() + (e.r === lastRound("dfb") ? 7 : 3));
  return d;
}
const WEEKDAY = e => e.t === "euro" ? "Mittwoch" : e.t === "pokal" && e.r !== lastRound("dfb") ? "Dienstag" : "Samstag";
function myTie(e, only){
  for (const k of only ? [only] : cupComps(e)){
    const C = cupOf(k); if (!C || C.champ || C.round !== e.r) continue;
    const t = C.ties.find(t => !t.win && (t.a === S.my || t.b === S.my)); if (t) return {k, t};
  }
  return null;
}
function seasonVerdict(){
  const lg = myLg(), p = myPlace();
  if (lg === 1) return p === 1 ? `Meister! Startplatz im ${COMPS.mp}.` : p <= 4 ? `Startplatz im ${COMPS.ep}.` : p > LSIZE - 3 ? `Abstieg in die ${LNAME[2]}.` : "Klassenerhalt geschafft.";
  if (lg === 2) return p <= 3 ? `Aufstieg in die ${LNAME[1]}!` : p > LSIZE - 3 ? `Abstieg in die ${LNAME[3]}.` : `Platz im Mittelfeld der ${LNAME[2]}.`;
  return p <= 3 ? `Aufstieg in die ${LNAME[2]}!` : `Nächstes Jahr wieder in der ${LNAME[3]}.`;
}

/* ---------- Hauptmenü ---------- */
function renderMenu(){
  const c = byId[S.my];
  $("#m-crest").innerHTML = crest(c);
  $("#m-name").textContent = c.name;
  $("#m-mgr").hidden = !multi();
  $("#m-mgr").textContent = `${S.mname} · Manager ${S.cur + 1} von ${S.mgrs.length}`;
  const e = nextUserEvent();
  const cash = $("#m-cash"); cash.textContent = dm(S.fin.cash); cash.classList.toggle("neg", S.fin.cash < 0);
  const kick = $("#t-kick");
  const rep = $("#m-rep");
  rep.hidden = !(S.report && S.report.length);
  if (!rep.hidden) $("#m-rep-list").innerHTML = S.report.map(l => `<div>${esc(l)}</div>`).join("");
  const expiring = S.squads[S.my].filter(p => p.vt <= 1).length, warns = [];
  if (!S.spons.trikot) warns.push("Noch kein Trikotsponsor – Angebote unter Sponsoren.");
  else if (S.spons.bande.length < MAX_BANDE) warns.push(`${MAX_BANDE - S.spons.bande.length} Banden noch frei – Angebote unter Sponsoren.`);
  if (expiring && S.md >= 17) warns.push(`${expiring} ${expiring === 1 ? "Vertrag läuft" : "Verträge laufen"} zum Saisonende aus. Im Kader verhandeln.`);
  $("#m-warn").hidden = !warns.length;
  $("#m-warn").textContent = warns.join(" ");
  if (!e){
    $("#m-md").textContent = `Saison ${S.season} beendet · ${LNAME[myLg()]}`;
    const d = mdDate(34);
    $("#m-cal").innerHTML = `<small>Saisonende</small><b>${d.getDate()}.</b><small>${MONTHS[d.getMonth()]} ${d.getFullYear()}</small>`;
    $("#m-next").textContent = `Platz ${myPlace()}: ${seasonVerdict()}`;
    kick.innerHTML = `${whistleSvg()}Neue Saison`;
    kick.onclick = newSeason;
    return;
  }
  const d = eventDate(e);
  $("#m-cal").innerHTML = `<small>${WEEKDAY(e)}</small><b>${d.getDate()}.</b><small>${MONTHS[d.getMonth()]} ${d.getFullYear()}</small>`;
  const mine = involved(e).includes(S.cur);
  if (!mine){
    $("#m-md").textContent = `${COMPS[cupComps(e)[0]]} · ${RN[cupComps(e)[0]][e.r]}`;
    $("#m-next").textContent = "Ihr Verein spielt an diesem Termin nicht.";
  } else if (e.t === "liga"){
    $("#m-md").textContent = `${e.md+1}. Spieltag · ${LNAME[myLg()]} · Saison ${S.season}`;
    const [h,a] = S.sched[myLg()][e.md].find(p => p.includes(S.my));
    const home = h === S.my, opp = byId[home ? a : h];
    $("#m-next").textContent = `Gegner: ${opp.short} (${home ? "Heim" : "Auswärts"})${isHuman(opp.id) ? " – Duell der Manager!" : ""}`;
  } else {
    const {k, t} = myTie(e);
    const final = e.r === lastRound(k);
    const home = k === "dfb" ? t.a === S.my : final ? t.a === S.my : (e.leg === 1 ? t.a === S.my : t.b === S.my);
    const opp = byId[t.a === S.my ? t.b : t.a];
    $("#m-md").textContent = `${COMPS[k]} · ${roundName(k, e.r, e.leg, final)}`;
    $("#m-next").textContent = `Gegner: ${opp.name}${tag(opp.id)}${final ? " (Endspiel)" : home ? " (Heim)" : " (Auswärts)"}`;
  }
  const rest = pendingAfterMe();
  kick.innerHTML = rest.length ? `${whistleSvg()}Fertig · weiter an ${esc(S.mgrs[rest[0]].mname)}` : `${whistleSvg()}Anpfiff${e.t === "euro" ? " Europapokal" : e.t === "pokal" ? " " + COMPS.dfb : ""}`;
  kick.onclick = endTurn;
}
$("#m-rep-ok").onclick = () => { S.report = []; save(); renderMenu(); };
function whistleSvg(){ return `<svg viewBox="0 0 40 40" aria-hidden="true"><rect x="8" y="14" width="20" height="14" fill="#d8dbe6"/><rect x="26" y="14" width="10" height="6" fill="#d8dbe6"/><rect x="12" y="18" width="8" height="6" fill="#1c2578"/><rect x="4" y="18" width="5" height="3" fill="#ffd23a"/></svg>`; }

/* ---------- Saisonwechsel ---------- */
const RET = {33:0.15, 34:0.3, 35:0.5, 36:0.75, 37:0.95};
function newSeason(){
  flushRest();
  const ids = n => sortedTable(n).map(r => r.c.id);
  const t1 = ids(1), t2 = ids(2), t3 = ids(3);
  const was = S.mgrs.map(m => S.lg[m.my]);
  t1.slice(-3).forEach(id => S.lg[id] = 2); t2.slice(0, 3).forEach(id => S.lg[id] = 1);
  t2.slice(-3).forEach(id => S.lg[id] = 3); t3.slice(0, 3).forEach(id => S.lg[id] = 2);
  const cupWin = S.dfb && S.dfb.champ;
  const ep = t1.slice(1, 4);
  if (cupWin && cupWin !== t1[0] && !ep.includes(cupWin)) ep.push(cupWin);
  setupEuro([t1[0]], ep);
  setupPokal();
  pushNews([`Saison ${S.season}: Meister ${byId[t1[0]].name}.`,
    ...(cupWin ? [`${COMPS.dfb}-Sieger: ${byId[cupWin].name}.`] : []),
    `Aufsteiger in die ${LNAME[1]}: ${t2.slice(0,3).map(id => byId[id].short).join(", ")}.`,
    `Aufsteiger in die ${LNAME[2]}: ${t3.slice(0,3).map(id => byId[id].short).join(", ")}.`]);
  S.season++;
  GER().forEach(c => { if (S.lg[c.id] <= 3) S.table[c.id] = blankRow(); });
  const retired = developPlayers();
  aiContracts();
  S.mgrs.forEach((mg, i) => withMgr(i, () => {
    const now = myLg(), rep = [];
    rep.push(now < was[i] ? `Aufgestiegen! ${byId[S.my].short} spielt jetzt in der ${LNAME[now]}.` : now > was[i] ? `Abgestiegen. Neustart in der ${LNAME[now]}.` : `Saison ${S.season} beginnt in der ${LNAME[now]}.`);
    rep.push(...(retired[S.my] || []));
    contractsAtSeasonEnd(rep);
    youthIntake(rep);
    fillSquad(rep);
    S.fin.cheat = 0;
    if (S.spons.trikot){ S.spons.trikot.left--; if (S.spons.trikot.left <= 0){ rep.push(`Trikotsponsor ${S.spons.trikot.name}: Vertrag ausgelaufen.`); S.spons.trikot = null; } }
    S.spons.bande.forEach(b => b.left--);
    S.spons.bande = S.spons.bande.filter(b => b.left > 0);
    S.spons.offers = {};
    if (!S.spons.trikot) S.spons.offers.trikot = genOffers("trikot", N_OFF.trikot);
    S.spons.offers.bande = genOffers("bande", N_OFF.bande);
    S.tabView = now;
    S.report = rep;
  }));
  buildSeason();
  beginTurns();
  save();
  show(multi() ? "handover" : "menu");
}
/* Alterung, Entwicklung und Karriereende für alle Vereine */
function developPlayers(){
  const out = {};
  for (const id in S.squads){
    const sq = S.squads[id], human = isHuman(id), club = byId[id];
    for (const p of sq){
      p.age++; p.goals = 0;
      const a = p.age, t = p.tal || 0;
      const d = a <= 21 ? rnd(1, 4) + t : a <= 24 ? rnd(0, 3) + t * 0.5 : a <= 29 ? rnd(-1, 1.2) : a <= 32 ? rnd(-3, 0) : rnd(-5, -1);
      p.st = clamp(Math.round(p.st + d), 30, 95);
      if (a >= 25) p.tal = 0;
      p.neg = null;
    }
    const ret = sq.filter(p => (p.age >= 33 && Math.random() < RET[Math.min(37, p.age)]) || (p.age >= 31 && p.st < 42 && Math.random() < 0.5));
    if (!ret.length) continue;
    S.squads[id] = sq.filter(p => !ret.includes(p));
    if (human){ out[id] = ret.map(p => `Karriereende: ${p.name} (${p.age} Jahre) hängt die Schuhe an den Nagel.`); continue; }
    for (const p of ret){
      const base = (p.pos === "ANG" || p.pos === "MIT") ? club.att : club.def;
      const np = newPlayer(Math.random, p.pos, base - 4, POOLS[LANDPOOL[club.land]] || SURN);
      np.age = 18 + Math.floor(Math.random() * 4); np.gehalt = wageFor(np.st, S.lg[id]); np.vt = 3;
      S.squads[id].push(np);
    }
  }
  return out;
}
/* Ablaufende Verträge: eigene Spieler gehen ablösefrei, KI-Vereine verlängern */
function contractsAtSeasonEnd(rep){
  const sq = S.squads[S.my];
  const gone = sq.filter(p => p.vt <= 1);
  S.squads[S.my] = sq.filter(p => p.vt > 1);
  S.squads[S.my].forEach(p => p.vt--);
  gone.forEach(p => {
    rep.push(`${p.name} verlässt den Verein ablösefrei.`);
    p.vt = 3; p.laune = 60;
    S.market.push({free:p, from:null, price:Math.round(value(p) * 0.5 / 5000) * 5000});
  });
  if (S.xi) S.xi = S.xi.filter(id => S.squads[S.my].some(p => p.id === id));
}
function aiContracts(){
  for (const id in S.squads) if (!isHuman(id)) S.squads[id].forEach(p => { p.vt = p.vt <= 1 ? 1 + Math.floor(Math.random() * 4) : p.vt - 1; });
}
/* Nachwuchs aus der eigenen Jugend */
function youthIntake(rep){
  const Y = YOUTH[S.youth], sq = S.squads[S.my];
  for (let k = 0; k < Y.n; k++){
    if (sq.length >= MAX_SQUAD){ rep.push("Ein Jugendspieler wäre bereit, aber im Kader ist kein Platz."); break; }
    const cnt = pos => sq.filter(p => p.pos === pos).length;
    const pos = wpick(["TOR","ABW","MIT","ANG"], [cnt("TOR") < 2 ? 4 : 0.5, 6 - Math.min(5, cnt("ABW")), 6 - Math.min(5, cnt("MIT")), 5 - Math.min(4, cnt("ANG"))].map(w => Math.max(0.3, w)));
    const p = newPlayer(Math.random, pos, Y.base + rnd(-3, 7));
    p.age = 17 + (Math.random() < 0.5 ? 1 : 0);
    p.tal = Math.random() < Y.tal ? (Math.random() < 0.35 ? 3 : 2) : (Math.random() < 0.5 ? 1 : 0);
    p.vt = 3; p.laune = 80; p.gehalt = Math.round(wageFor(p.st, myLg()) * 0.5 / 500) * 500;
    p.nr = Math.max(0, ...sq.map(x => x.nr || 0)) + 1;
    sq.push(p);
    rep.push(`Aus der Jugend: ${p.name} (${p.pos}, ${p.age} J., Stärke ${p.st}${p.tal >= 2 ? ", großes Talent" : ""}).`);
  }
}
/* Kader auffüllen, falls er zu klein geworden ist */
function fillSquad(rep){
  const sq = S.squads[S.my];
  while (sq.length < MIN_SQUAD || sq.filter(p => p.pos === "TOR").length < 2){
    const pos = sq.filter(p => p.pos === "TOR").length < 2 ? "TOR" : pick(["ABW","MIT","ANG"]);
    const p = newPlayer(Math.random, pos, 44);
    p.age = 20 + Math.floor(Math.random() * 8); p.vt = 2; p.gehalt = Math.round(wageFor(p.st, myLg()) * 0.6 / 500) * 500;
    sq.push(p);
    rep.push(`Aus dem Amateurlager rückt ${p.name} (${p.pos}) in den Kader.`);
  }
}

/* ---------- Tabelle ---------- */
function sortedTable(n = myLg()){
  return leagueIds(n).map(id => ({c:byId[id], ...S.table[id]})).sort((x,y) => y.pk-x.pk || (y.tf-y.tg)-(x.tf-x.tg) || y.tf-x.tf || x.c.name.localeCompare(y.c.name));
}
function zone(n, i){
  if (n === 1) return i === 0 ? [CODE.mp,"var(--gold)"] : i <= 3 ? [CODE.ep,"var(--cyan)"] : i >= LSIZE - 3 ? ["↓","var(--bad)"] : null;
  if (n === 2) return i <= 2 ? ["↑","var(--good)"] : i >= LSIZE - 3 ? ["↓","var(--bad)"] : null;
  return i <= 2 ? ["↑","var(--good)"] : null;
}
function renderTable(){
  const n = S.tabView || myLg();
  $("#tb-tabs").innerHTML = [1,2,3].map(k => `<button type="button" aria-pressed="${n===k}">${LNAME[k]}</button>`).join("");
  [...$("#tb-tabs").children].forEach((b, i) => b.onclick = () => { S.tabView = i + 1; renderTable(); });
  $("#tb-title").textContent = `${LNAME[n]}${S.md ? ` · nach dem ${S.md}. Spieltag` : ""}`;
  $("#tb").innerHTML = `<tr><th class="n">Pl</th><th></th><th>Verein</th><th class="n">Sp</th><th class="n">S</th><th class="n">U</th><th class="n">N</th><th class="n">Tore</th><th class="n">Diff</th><th class="n">Pkt</th></tr>` +
    sortedTable(n).map((r,i) => { const z = zone(n, i); const hm = isHuman(r.c.id);
      return `<tr class="${r.c.id===S.my ? "mine" : hm ? "rival" : ""}"><td class="n pos">${i+1}.</td><td style="color:${z ? z[1] : "inherit"}">${z ? z[0] : ""}</td><td>${esc(r.c.name)}${hm && multi() ? ` <small>(${esc(S.mgrs[mgrIdx(r.c.id)].mname)})</small>` : ""}</td><td class="n">${r.sp}</td><td class="n">${r.s}</td><td class="n">${r.u}</td><td class="n">${r.n}</td><td class="n">${r.tf}:${r.tg}</td><td class="n">${r.tf-r.tg>0?"+":""}${r.tf-r.tg}</td><td class="n">${r.pk}</td></tr>`; }).join("");
  $("#tb-hint").textContent = n === 1 ? `${CODE.mp} = ${COMPS.mp}, ${CODE.ep} = ${COMPS.ep}, ↓ = Abstieg. 3 Punkte pro Sieg.` : n === 2 ? `↑ = Aufstieg in die ${LNAME[1]}, ↓ = Abstieg in die ${LNAME[3]}.` : `↑ = Aufstieg in die ${LNAME[2]}.`;
}

/* ---------- Pokale ---------- */
function renderCups(){
  const nm = id => `${esc(byId[id].short)}${tag(id)}`;
  const cupPanel = k => {
    const C = cupOf(k);
    if (!C) return `<div class="panel"><h2>${COMPS[k]}</h2><p class="hint" style="margin:0">Startet mit der nächsten Saison.</p></div>`;
    const ties = C.ties.map(t => {
      const mine = isHuman(t.a) || isHuman(t.b);
      const r1 = t.l1 ? `${t.l1[0]}:${t.l1[1]}` : "–:–";
      const r2 = k !== "dfb" && C.round < lastRound(k) ? ` · ${t.l2 ? `${t.l2[1]}:${t.l2[0]}` : "–:–"}` : "";
      const ex = t.pen ? ` (${t.pen[0]}:${t.pen[1]} i.E.)` : t.et ? " n.V." : "";
      const w = id => t.win === id ? `<b style="color:var(--gold);font-weight:normal">${nm(id)}</b>` : t.win ? `<span style="color:var(--muted)">${nm(id)}</span>` : nm(id);
      const lgTag = id => k === "dfb" && byId[id].land === "GER" ? ` <small class="ct">${S.lg[id] === 4 ? "AM" : S.lg[id] + "L"}</small>` : "";
      return `<div class="tie${mine ? " mine" : ""}"><span class="h">${w(t.a)}${lgTag(t.a)}</span><span class="s">${r1}${r2}${ex}</span><span class="a">${w(t.b)}${lgTag(t.b)}</span></div>`;
    }).join("");
    const hint = k === "dfb" ? "Alle Vereine der drei Ligen und 10 Amateurvereine. Ein Spiel, der klassentiefere Verein hat Heimrecht. Bei Gleichstand Verlängerung und Elfmeterschießen. Der Sieger spielt im Euro-Pokal."
      : `Deutsche Teilnehmer: ${C.teams.filter(id => byId[id].land === "GER").map(id => esc(byId[id].short)).join(", ")}. Hin- und Rückspiel, bei Gleichstand zählen Auswärtstore, dann Verlängerung und Elfmeterschießen.`;
    return `<div class="panel"><h2>${COMPS[k]}</h2>
      <p style="margin:0 0 8px;color:var(--cyan)">${C.champ ? `Sieger: ${esc(byId[C.champ].name)}${tag(C.champ)}` : RN[k][C.round]}</p>
      <div class="konf">${ties}</div><p class="hint">${hint}</p></div>`;
  };
  $("#eu-comps").innerHTML = ["dfb","mp","ep"].map(cupPanel).join("");
  $("#eu-news").innerHTML = (S.news || []).length ? S.news.map(l => `<div>${esc(l)}</div>`).join("") : `<div>Noch keine Meldungen.</div>`;
}

/* ---------- Kader ---------- */
function playerCells(p){
  const [fa, fc] = formArrow(p.form), [ml, mc] = moodLabel(p.laune);
  return `<td class="n" style="color:${fc}">${fa}</td><td class="n" style="color:${kondColor(p.kond)}">${p.kond}</td><td style="color:${mc}">${ml}</td>`;
}
let lnSel = null;
const POS_ORDER = {TOR:0, ABW:1, MIT:2, ANG:3};
function renderLineup(){
  const xi = lineup(S.my), ids = new Set(xi.map(p => p.id));
  const res = S.squads[S.my].filter(p => !ids.has(p.id)).sort((a,b) => POS_ORDER[a.pos] - POS_ORDER[b.pos] || eff(b) - eff(a));
  const row = (p, attr, sel) => { const [fa, fc] = formArrow(p.form);
    return `<button type="button" class="pl" ${attr}="${p.id}" aria-pressed="${sel}" ${p.inj ? "disabled" : ""}><span class="pos">${p.pos}</span><span class="nm">${esc(p.name)}${p.inj ? ` <em style="color:var(--bad)">verletzt (${p.inj})</em>` : ""}</span><span>${Math.round(eff(p))}</span><span style="color:${fc}">${fa}</span><span style="color:${kondColor(p.kond)}">${p.kond}</span></button>`; };
  $("#ln-mode").textContent = (S.xi ? "Eigene Aufstellung. " : "Automatische Aufstellung nach Tagesform. ") + "Zum Tauschen erst einen Spieler der Startelf antippen, dann einen Reservisten. Spalten: Stärke heute, Form, Kondition.";
  $("#ln-xi").innerHTML = xi.slice().sort((a,b) => POS_ORDER[a.pos] - POS_ORDER[b.pos]).map(p => row(p, "data-lx", lnSel === p.id)).join("");
  $("#ln-res").innerHTML = res.map(p => row(p, "data-lr", false)).join("");
  const cnt = k => xi.filter(p => p.pos === k).length;
  const warn = [];
  if (!cnt("TOR")) warn.push("Kein Torwart in der Startelf!");
  if (cnt("TOR") > 1) warn.push("Zwei Torhüter in der Startelf.");
  if (S.xi && S.xi.some(id => { const p = S.squads[S.my].find(x => x.id === id); return !p || p.inj; })) warn.push("Verletzte oder verkaufte Spieler wurden automatisch ersetzt.");
  const msg = $("#ln-msg"); if (warn.length){ msg.textContent = warn.join(" "); msg.classList.add("bad"); } else if (msg.classList.contains("bad")){ msg.textContent = ""; msg.classList.remove("bad"); }
  $("#ln-auto").disabled = !S.xi;
  $$("[data-lx]").forEach(b => b.onclick = () => { lnSel = lnSel === b.dataset.lx ? null : b.dataset.lx; renderLineup(); });
  $$("[data-lr]").forEach(b => b.onclick = () => {
    if (!lnSel){ const m = $("#ln-msg"); m.classList.remove("bad"); m.textContent = "Erst einen Spieler der Startelf antippen."; return; }
    const cur = lineup(S.my).map(p => p.id), i = cur.indexOf(lnSel);
    if (i < 0) return;
    const outP = S.squads[S.my].find(p => p.id === lnSel), inP = S.squads[S.my].find(p => p.id === b.dataset.lr);
    cur[i] = b.dataset.lr; S.xi = cur; lnSel = null;
    save(); renderSquad();
    const m = $("#ln-msg"); if (!m.classList.contains("bad")) m.textContent = `${inP.name} spielt für ${outP.name}.`;
  });
}
$("#ln-auto").onclick = () => { S.xi = null; lnSel = null; save(); renderSquad(); $("#ln-msg").textContent = "Aufstellung wieder automatisch nach Tagesform."; };
function renderSquad(){
  renderTacticSegs();
  renderLineup();
  renderContracts();
  const xi = new Set(lineup(S.my).map(p => p.id));
  const sq = S.squads[S.my].slice().sort((a,b) => POS_ORDER[a.pos] - POS_ORDER[b.pos] || b.st - a.st);
  $("#sq").innerHTML = `<tr><th>Pos</th><th>Name</th><th class="n">Stärke</th><th class="n">Form</th><th class="n">Kond.</th><th>Laune</th><th class="n">Alter</th><th class="n">Tore</th><th class="n">Wert</th><th>Status</th></tr>` +
    sq.map(p => `<tr class="${xi.has(p.id)?"mine":""}"><td class="pos">${p.pos}</td><td>${esc(p.name)}${p.tal >= 2 ? ' <span title="Talent" style="color:var(--gold)">★</span>' : ""}</td><td class="n">${p.st}</td>${playerCells(p)}<td class="n">${p.age}</td><td class="n">${p.goals}</td><td class="n">${fmt(value(p)/1000)}T</td><td>${p.inj ? `<span style="color:var(--bad)">verletzt (${p.inj})</span>` : xi.has(p.id) ? "Im Team" : "Reserve"}</td></tr>`).join("");
  $("#sq-pay").textContent = dm(wages());
  const s = strOf(lineup(S.my), myForm(), EINSATZ[S.einsatz], tacBonus());
  $("#sq-str").textContent = `Angriff ${Math.round(s.att)} · Abwehr ${Math.round(s.def)}`;
}

/* ---------- Verträge ---------- */
let ctSel = null, ctYears = 2, ctOffer = 0;
function demandOf(p){
  const ageF = p.age <= 23 ? 0.9 : p.age <= 29 ? 1.1 : p.age <= 32 ? 1 : 0.8;
  const moodF = p.laune < 35 ? 1.15 : p.laune > 75 ? 0.95 : 1;
  let d = wageFor(p.st, myLg()) * ageF * (1 + 0.04 * p.form) * moodF;
  d = Math.max(d, (p.gehalt || 0) * (p.age >= 31 ? 0.85 : 1));
  return Math.round(d / 500) * 500;
}
const contractEnd = p => S.season + p.vt - 1;
function renderContracts(){
  const sq = S.squads[S.my].slice().sort((a,b) => a.vt - b.vt || POS_ORDER[a.pos] - POS_ORDER[b.pos] || b.st - a.st);
  $("#ct-list").innerHTML = sq.map(p => `<button type="button" class="pl ctr" data-ct="${p.id}" aria-pressed="${ctSel === p.id}"><span class="pos">${p.pos}</span><span class="nm">${esc(p.name)} <em>${p.age} J.</em></span><span>${fmt(p.gehalt)}</span><span style="color:${p.vt <= 1 ? "var(--bad)" : p.vt === 2 ? "var(--gold)" : "var(--ink)"}">${contractEnd(p)}</span></button>`).join("");
  $$("[data-ct]").forEach(b => b.onclick = () => { ctSel = ctSel === b.dataset.ct ? null : b.dataset.ct; ctOffer = 0; renderContracts(); });
  const box = $("#ct-neg"), p = S.squads[S.my].find(x => x.id === ctSel);
  box.hidden = !p;
  if (!p) return;
  if (!p.neg || p.neg.s !== S.season) p.neg = {s:S.season, tries:0, dem:demandOf(p), no:false};
  const N = p.neg;
  if (!ctOffer) ctOffer = N.dem;
  const step = Math.max(500, Math.round(N.dem * 0.025 / 500) * 500);
  const head = `<b>${esc(p.name)}</b>, ${p.age} Jahre, Stärke ${p.st} · bisher ${dm(p.gehalt)} pro Spieltag, Vertrag bis Saison ${contractEnd(p)}`;
  if (p.vt > 2){ box.innerHTML = `<p>${head}</p><p class="hint">Der Vertrag läuft noch lange. Verhandelt wird erst, wenn er in dieser oder der nächsten Saison endet.</p>`; return; }
  if (N.no){ box.innerHTML = `<p>${head}</p><p style="color:var(--bad)">${esc(p.name)} will in dieser Saison nicht mehr verhandeln.</p>`; return; }
  box.innerHTML = `<p>${head}</p>
    <div class="kv"><span>Forderung pro Spieltag</span><span class="v" style="color:var(--gold)">${dm(N.dem)}</span><span>Verhandlungsrunden</span><span class="v">${N.tries} von 3</span></div>
    <h3>Laufzeit (ab nächster Saison)</h3><div class="seg" id="ct-years">${[1,2,3,4].map(y => `<button type="button" aria-pressed="${ctYears === y}">${y} ${y === 1 ? "Saison" : "Saisons"}</button>`).join("")}</div>
    <h3>Ihr Angebot pro Spieltag</h3>
    <div class="opt"><span class="val" style="font-size:24px">${dm(ctOffer)}</span><div class="seg"><button type="button" id="ct-m" aria-label="Angebot senken">−</button><button type="button" id="ct-p" aria-label="Angebot erhöhen">+</button></div></div>
    <div class="row" style="margin-top:8px"><button type="button" class="btn" id="ct-go">Angebot machen</button><button type="button" class="btn ghost" id="ct-x">Schließen</button></div>`;
  [...$("#ct-years").children].forEach((b, i) => b.onclick = () => { ctYears = i + 1; renderContracts(); });
  $("#ct-m").onclick = () => { ctOffer = Math.max(500, ctOffer - step); renderContracts(); };
  $("#ct-p").onclick = () => { ctOffer += step; renderContracts(); };
  $("#ct-x").onclick = () => { ctSel = null; renderContracts(); };
  $("#ct-go").onclick = () => negotiate(p);
}
function negotiate(p){
  const N = p.neg, ratio = ctOffer / N.dem;
  let yf = 1;
  if (p.age >= 30 && ctYears > 2) yf = 0.7;
  if (p.age <= 23 && ctYears === 1) yf = 0.8;
  const moodF = 0.75 + p.laune / 200;
  const chance = ratio >= 1.15 ? 1 : clamp((ratio - 0.86) / 0.14, 0, 1) * moodF * yf;
  const msg = $("#ct-msg");
  if (Math.random() < chance){
    p.vt = 1 + ctYears;
    p.gehalt = ctOffer; p.laune = clamp(p.laune + 6, 0, 100); p.neg = null;
    msg.classList.remove("bad");
    msg.textContent = `${p.name} unterschreibt bis Saison ${contractEnd(p)} für ${dm(ctOffer)} pro Spieltag.`;
    ctSel = null;
  } else {
    N.tries++; p.laune = clamp(p.laune - 3, 0, 100); N.dem = Math.round(N.dem * 1.04 / 500) * 500;
    msg.classList.add("bad");
    if (N.tries >= 3){ N.no = true; msg.textContent = `${p.name} lehnt ab und bricht die Verhandlungen ab.`; }
    else msg.textContent = `${p.name} lehnt ab. Neue Forderung: ${dm(N.dem)}.`;
    ctOffer = N.dem;
  }
  save(); renderSquad();
}
