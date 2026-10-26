/* ---------- Spieltag-Ablauf ---------- */
let M = null;
function nextUserEvent(){
  for (let i = S.ev; i < S.cal.length; i++){ const e = S.cal[i]; if (involved(e).length) return e; }
  return null;
}
/* Reihum-Züge: jeder beteiligte Manager macht seinen Zug, dann wird angepfiffen */
function turnOrder(){ const e = nextUserEvent(); return e ? involved(e) : []; }
function beginTurns(){
  S.ready = [];
  const ord = turnOrder();
  if (ord.length) S.cur = ord[0];
}
function pendingAfterMe(){ return turnOrder().filter(i => i !== S.cur && !(S.ready || []).includes(i)); }
function endTurn(){
  if (!S.ready.includes(S.cur)) S.ready.push(S.cur);
  const nxt = turnOrder().find(i => !S.ready.includes(i));
  if (nxt !== undefined){ S.cur = nxt; save(); show("handover"); return; }
  S.ready = [];
  save();
  kickoff();
}
function afterMatch(){
  beginTurns(); save();
  show(multi() ? "handover" : "menu");
}
/* Restliche Termine ohne menschliche Beteiligung (z. B. ein Pokalfinale) im Hintergrund ausspielen */
function flushRest(){
  if (nextUserEvent()) return;
  const news = [];
  while (S.ev < S.cal.length){ const e = S.cal[S.ev]; if (e.t !== "liga") news.push(...simCupEvent(e)); S.ev++; }
  if (news.length) pushNews(news);
}
function kickoff(){
  const news = [];
  while (S.ev < S.cal.length && S.cal[S.ev].t !== "liga" && !involved(S.cal[S.ev]).length){ news.push(...simCupEvent(S.cal[S.ev])); S.ev++; }
  if (news.length) pushNews(news);
  save();
  if (S.ev >= S.cal.length){ show("menu"); return; }
  startEvent(S.cal[S.ev], news);
}
function eventTitle(e, m){
  if (e.t === "liga") return `${e.md + 1}. Spieltag`;
  return `${COMPS[m.comp]}, ${roundName(m.comp, m.rd, m.leg, m.final)}`;
}
function startEvent(e, news = []){
  if (M && M.timer) clearTimeout(M.timer);
  MKEY = uid(); NEWINJ = new Set();
  let matches;
  if (e.t === "liga"){
    const lgs = [...new Set(humans().map(id => S.lg[id]))].sort();
    matches = lgs.flatMap(n => S.sched[n][e.md].map(([h,a]) => newMatch(h,a)));
  } else matches = cupMatches(e);
  M = {kind:e.t, e, min:0, end:90, ht:false, done:false, busy:false, paused:false, timer:null, subs:{}, played:{}, matches};
  M.hm = matches.filter(m => isHuman(m.h) || isHuman(m.a));
  M.hm.forEach(m => [m.h, m.a].forEach((c, s) => { if (isHuman(c)){ M.played[c] = new Set(m.xi[s].map(p => p.id)); M.subs[c] = 0; } }));
  $("#log").innerHTML = "";
  $("#after").hidden = true;
  $("#mm").hidden = true;
  $("#mm-open").hidden = false;
  $("#konf-t").textContent = e.t === "liga" ? "Konferenz" : e.t === "pokal" ? `${COMPS.dfb}-Abend` : "Europapokal-Abend";
  setFocus(M.hm.find(m => sideOf(m, S.my) >= 0) || M.hm[0]);
  show("match");
  news.forEach(l => logLine(l, "", "EC"));
  for (const m of M.hm){
    if (m.comp && m.leg === 2 && !m.single){ const t = m.tie; logLine(`Hinspiel: ${byId[t.a].short} ${t.l1[0]}:${t.l1[1]} ${byId[t.b].short}`, "me"); }
    const full = isHuman(m.h) && withMgr(mgrIdx(m.h), () => m.spec >= usableCap());
    logLine(`${eventTitle(e, m)} – ${fmt(m.spec)} Zuschauer${full ? " (ausverkauft!)" : ""}${m.final ? " beim Endspiel" : ""} sehen ${byId[m.h].short} gegen ${byId[m.a].short}.`, "me");
  }
  SFX.matchStart();
  drawIdle("ANPFIFF!");
  M.timer = setTimeout(tick, 1100);
}
/* Welches menschliche Spiel wird groß gezeigt? */
function setFocus(m){
  M.mine = m;
  M.kits = kitsFor(m);
  buildBackground(m.h);
  const h = byId[m.h], a = byId[m.a];
  $("#b-hc").innerHTML = crest(h); $("#b-ac").innerHTML = crest(a);
  $("#b-hn").textContent = (h.name + tag(h.id)).toUpperCase(); $("#b-an").textContent = (a.name + tag(a.id)).toUpperCase();
  for (const [el, c] of [["#b-hc", h], ["#b-ac", a]]){
    $(el).classList.toggle("mine", isHuman(c.id));
    $(el).setAttribute("aria-label", isHuman(c.id) ? `Taktik und Wechsel für ${c.name}` : c.name);
  }
  renderFocusTabs();
}
function renderFocusTabs(){
  const el = $("#mt-tabs");
  el.hidden = !M || M.hm.length < 2;
  if (el.hidden) return;
  el.innerHTML = M.hm.map((m, i) => {
    const who = [m.h, m.a].filter(isHuman).map(id => S.mgrs[mgrIdx(id)].mname).join(" & ");
    return `<button type="button" aria-pressed="${m === M.mine}">${esc(who)}: ${byId[m.h].short} ${m.gh}:${m.ga} ${byId[m.a].short}</button>`;
  }).join("");
  [...el.children].forEach((b, i) => b.onclick = () => {
    if (M.busy){ M.wantFocus = M.hm[i]; return; }
    setFocus(M.hm[i]); renderMatch(); if (!M.done) drawIdle(null);
  });
}
function tick(){
  if (!M || M.done || M.busy || M.paused) return;
  if (M.min === 45 && !M.ht){
    M.ht = true;
    const m = M.mine;
    logLine("Seitenwechsel.", "me", "HZ");
    logLine(`Halbzeit: ${byId[m.h].short} ${m.gh}:${m.ga} ${byId[m.a].short}`, "me", "HZ");
    SFX.whistle(2); SFX.crowdLevel(0.35);
    drawIdle("HALBZEIT");
    renderMatch("Halbzeit");
    M.timer = setTimeout(tick, OPTS.speed === 3 ? 600 : 1600);
    return;
  }
  if (M.min === 45 || M.min === 90 && M.end > 90){ SFX.whistle(1); SFX.crowdLevel(1); }
  M.min++;
  let pending = null;
  for (const m of M.matches){
    if (M.min > 90 && !m.et) continue;
    const ev = stepMinute(m);
    if (!ev) continue;
    if (m === M.mine && ev.kind === "chance" && OPTS.scenes) pending = ev;
    else applyEvent(m, ev);
  }
  renderMatch();
  if (pending){
    M.busy = true;
    const m = M.mine;
    const firstHalf = M.min <= 45 || (M.min > 90 && M.min <= 105);
    DIR = ((pending.side === 0) === firstHalf) ? 1 : -1;
    playScene(pending, M.kits[pending.side], M.kits[1-pending.side], byId[pending.side ? m.a : m.h]).then(() => {
      applyEvent(m, pending);
      M.busy = false;
      if (M.wantFocus){ setFocus(M.wantFocus); M.wantFocus = null; }
      drawIdle(null);
      renderMatch();
      if (M.wantMenu){ const c = M.wantMenu; M.wantMenu = null; openMatchMenu(c); } else next();
    });
    return;
  }
  next();
}
function next(){
  if (M.paused) return;
  if (M.min === 90 && M.end === 90 && M.kind !== "liga"){
    const et = M.matches.filter(m => needsET(m));
    if (et.length){
      et.forEach(m => m.et = true); M.end = 120;
      logLine(et.includes(M.mine) ? "Verlängerung! 30 Minuten mehr." : `Verlängerung in ${et.length} Spiel(en).`, "me", "90'");
      SFX.whistle(2);
      if (et.includes(M.mine)) drawIdle("VERLÄNGERUNG");
      M.timer = setTimeout(tick, 1500); return;
    }
  }
  if (M.min >= M.end){ finish(); return; }
  M.timer = setTimeout(tick, SPEEDS[OPTS.speed]);
}
function applyEvent(m, ev){
  const mine = m === M.mine, hum = M.hm.includes(m), club = [m.h, m.a][ev.side], human = isHuman(club);
  const team = byId[club], opp = byId[[m.h, m.a][1 - ev.side]];
  applyCore(m, ev);
  const score = () => `${byId[m.h].short} ${m.gh}:${m.ga} ${byId[m.a].short}`;
  if (ev.kind === "chance"){
    if (ev.outcome === "tor"){
      const txt = ev.og ? `EIGENTOR! ${ev.player.name} (${opp.short}) – ${score()}`
        : ev.variant === "abpraller" ? `TOR! ${ev.player.name} staubt nach Abpraller ab – ${score()}`
        : ev.variant === "patzer" ? `TOR! ${ev.player.name}, der Torwart patzt – ${score()}`
        : `TOR! ${ev.player.name}${HOW[ev.type] || ""} – ${score()}`;
      logLine(txt, hum ? "me goal" : "goal");
      if (!mine){ flashKonf(m); if (hum) SFX.roar(0.5); }
      renderFocusTabs();
    } else if (mine){
      const how = {fallrueckzieher:" (Fallrückzieher)", flanke:" (Kopfball)", ecke:" (Kopfball)", freistoss:" (Freistoß)", elfmeter:" (Elfmeter)"}[ev.type] || "";
      const t = {parade:`Glanzparade gegen ${ev.player.name}${how}`, vorbei:`Vorbei! Chance für ${ev.player.name}${how}`, pfosten:`Pfosten! Pech für ${ev.player.name}${how}`,
        latte:`Latte! ${ev.player.name}${how} trifft das Gebälk`, abseits:`Tor von ${ev.player.name} zählt nicht – Abseits!`}[ev.outcome];
      logLine(`${t} (${team.short})`, "me");
    }
  } else if (ev.kind === "yellow"){
    if (hum) logLine(`Gelbe Karte: ${ev.player.name} (${team.short})`, "me");
  } else if (ev.kind === "red"){
    logLine(`Rote Karte! ${ev.player.name} (${team.short})`, hum ? "me" : "");
    if (human) restrSide(m, ev.side);
  } else if (ev.kind === "inj"){
    if (hum) logLine(`Verletzt: ${ev.player.name} (${team.short}), fällt ${spt(ev.player.inj)} aus${human && M.subs[club] < MAX_SUBS ? " – Tipp aufs Wappen zum Auswechseln" : ""}`, "me");
    if (human) restrSide(m, ev.side);
  }
}
function logLine(text, cls = "", min){
  const d = document.createElement("div");
  d.className = cls;
  d.innerHTML = `<b>${min ?? (M.min ? M.min + "'" : "–")}</b> `;
  d.appendChild(document.createTextNode(text));
  $("#log").prepend(d);
}
function flashKonf(m){
  const el = document.querySelector(`.kr[data-h="${m.h}"]`);
  if (!el) return; el.classList.remove("flash"); void el.offsetWidth; el.classList.add("flash");
}
function renderMatch(label){
  const m = M.mine;
  $("#b-score").innerHTML = `${m.gh}<i>:</i>${m.ga}`;
  $("#b-stats").innerHTML = `<span>Zuschauer</span><span class="v" style="grid-column:span 2;color:var(--led)">${fmt(m.spec)}</span>` + [
    ["Gelbe Karten", m.y[0], m.y[1]], ["Rote Karten", m.r[0], m.r[1]], ["Verletzt", m.inj[0], m.inj[1]],
    ["Spieler", 11 - m.r[0], 11 - m.r[1]], ["Chancen", m.ch[0], m.ch[1]],
  ].map(([k,a,b]) => `<span>${k}</span><span class="v">${a}</span><span class="v">${b}</span>`).join("") +
  (m.tie && m.leg === 2 && !m.single ? `<span>Gesamt (Hinspiel ${m.tie.l1[1]}:${m.tie.l1[0]})</span><span class="v">${m.gh + m.tie.l1[1]}</span><span class="v">${m.ga + m.tie.l1[0]}</span>` : "");
  $("#b-min").textContent = label || (M.done ? "Abpfiff" : M.paused ? "Unterbrechung" : M.min ? `${M.min}. Minute` : "Anpfiff");
  const ang = (Math.min(M.min, 90) / 45) * 360;
  $("#dial1").style.setProperty("--a", Math.min(ang,360) + "deg");
  $("#dial2").style.setProperty("--a", Math.max(0, ang-360) + "deg");
  $("#konf").innerHTML = M.matches.filter(x => x !== m).map(x =>
    `<div class="kr${M.hm.includes(x) ? " hum" : ""}" data-h="${x.h}"><span class="h">${x.comp ? `<small class="ct">${CODE[x.comp]}</small> ` : ""}${byId[x.h].short}</span><span class="s">${x.gh}:${x.ga}${x.et ? "*" : ""}</span><span class="a">${byId[x.a].short}</span></div>`).join("") || `<p class="hint" style="margin:0">Keine weiteren Spiele.</p>`;
  if (M.hm.length > 1) renderFocusTabs();
}

/* Taktik & Wechsel während des Spiels – immer für den Verein, dessen Wappen angetippt wurde */
let subOut = null, subIn = null;
const matchOf = club => M.hm.find(x => sideOf(x, club) >= 0);
function requestMatchMenu(club){
  if (!M || M.done || !isHuman(club)) return;
  if (M.busy){ M.wantMenu = club; $("#b-min").textContent = "Wechsel nach der Szene ..."; return; }
  openMatchMenu(club);
}
function openMatchMenu(club){
  M.paused = true; clearTimeout(M.timer);
  M.prevCur = S.cur; S.cur = mgrIdx(club); M.menuClub = club;
  subOut = subIn = null;
  $("#mm").hidden = false;
  renderMatchMenu();
  renderMatch();
  $("#mm").scrollIntoView({block:"start", behavior:"smooth"});
}
function closeMatchMenu(){
  $("#mm").hidden = true;
  if (M.prevCur !== undefined) S.cur = M.prevCur;
  M.menuClub = null;
  M.paused = false;
  renderMatch();
  next();
}
function renderMatchMenu(){
  const club = M.menuClub, m = matchOf(club), s = sideOf(m, club), xi = m.xi[s];
  $("#mm-title").textContent = `Taktik & Wechsel · ${byId[club].short}${multi() ? ` (${S.mname})` : ""}`;
  renderTacticSegs();
  const bench = S.squads[club].filter(p => !xi.includes(p) && !p.inj && !M.played[club].has(p.id));
  const row = (p, sel, attr) => {
    const [fa, fc] = formArrow(p.form);
    return `<button type="button" class="pl" ${attr}="${p.id}" aria-pressed="${sel}"><span class="pos">${p.pos}</span><span class="nm">${p.name}${p.inj ? ' <em style="color:var(--bad)">verletzt</em>' : ""}${p.yc === MKEY ? ' <em style="color:var(--gold)">Gelb</em>' : ""}</span><span>${Math.round(eff(p))}</span><span style="color:${fc}">${fa}</span><span style="color:${kondColor(p.kond)}">${p.kond}</span></button>`;
  };
  $("#mm-subs").textContent = `Wechsel: ${M.subs[club]} von ${MAX_SUBS}`;
  $("#mm-out").innerHTML = xi.map(p => row(p, subOut === p.id, "data-out")).join("");
  $("#mm-in").innerHTML = bench.length ? bench.map(p => row(p, subIn === p.id, "data-in")).join("") : `<p class="hint" style="margin:0">Keine Spieler mehr auf der Bank.</p>`;
  $$("#mm-out [data-out]").forEach(b => b.onclick = () => { subOut = b.dataset.out; renderMatchMenu(); });
  $$("#mm-in [data-in]").forEach(b => b.onclick = () => { subIn = b.dataset.in; renderMatchMenu(); });
  const ok = subOut && subIn && M.subs[club] < MAX_SUBS;
  $("#mm-do").disabled = !ok;
  $("#mm-do").textContent = M.subs[club] >= MAX_SUBS ? "Kein Wechsel mehr möglich" : "Auswechseln";
}
$("#mm-do").onclick = () => {
  const club = M.menuClub, m = matchOf(club), s = sideOf(m, club), xi = m.xi[s];
  const out = xi.find(p => p.id === subOut), inn = S.squads[club].find(p => p.id === subIn);
  if (!out || !inn || M.subs[club] >= MAX_SUBS) return;
  xi[xi.indexOf(out)] = inn; M.subs[club]++; M.played[club].add(inn.id);
  restrSide(m, s);
  logLine(`Wechsel ${byId[club].short}: ${inn.name} kommt für ${out.name}`, "me");
  subOut = subIn = null;
  renderMatchMenu();
};
$("#mm-close").onclick = closeMatchMenu;
$("#a-next").onclick = () => afterMatch();
$("#mm-open").onclick = () => { if (M) requestMatchMenu([M.mine.h, M.mine.a].find(isHuman)); };
$("#b-hc").onclick = () => { if (M) requestMatchMenu(M.mine.h); };
$("#b-ac").onclick = () => { if (M) requestMatchMenu(M.mine.a); };
function renderTacticSegs(){
  const refresh = () => {
    save();
    if (M && !M.done && M.menuClub){ const mm = matchOf(M.menuClub); restrSide(mm, sideOf(mm, M.menuClub)); }
    renderTacticSegs();
    if (!$("#scr-squad").hidden) renderSquad();
  };
  $$('.seg[data-opt="tactic"]').forEach(el => {
    el.innerHTML = Object.keys(FORMS).map(k => `<button type="button" aria-pressed="${S.tactic===k}">${k}</button>`).join("");
    [...el.children].forEach((b, i) => b.onclick = () => { S.tactic = Object.keys(FORMS)[i]; refresh(); });
  });
  $$('.seg[data-opt="einsatz"]').forEach(el => {
    el.innerHTML = EINSATZ.map((e, i) => `<button type="button" aria-pressed="${S.einsatz===i}">${e.l}</button>`).join("");
    [...el.children].forEach((b, i) => b.onclick = () => { S.einsatz = i; refresh(); });
  });
}

function finish(){
  M.done = true;
  $("#mm").hidden = true; $("#mm-open").hidden = true;
  SFX.whistle(3); SFX.matchEnd();
  for (const x of M.matches) if (x.et && needsET(x)){
    x.pen = shootout(x);
    if (M.hm.includes(x)) logLine(`Elfmeterschießen: ${byId[x.h].short} ${x.pen[0]}:${x.pen[1]} ${byId[x.a].short}`, "me goal");
  }
  const e = M.e, others = [];
  if (M.kind === "liga"){
    for (const x of M.matches) addResult(x.h, x.a, x.gh, x.ga);
    const live = new Set(M.matches.map(x => S.lg[x.h]));
    for (const n of [1,2,3]) if (!live.has(n)) S.sched[n][e.md].forEach(([hh, aa]) => { const q = quickSim(newMatch(hh, aa)); addResult(hh, aa, q.gh, q.ga); });
  } else {
    for (const x of M.matches){ recordLeg(x); if (!M.hm.includes(x) && (x.comp !== "dfb" || x.rd >= 2 || S.lg[x.h] === 1 || S.lg[x.a] === 1)) others.push(cupLine(x)); }
  }
  const d = eventDate(e);
  let paper = `<div class="mast"><span>DER KICKERBOTE</span><span>${d.getDate()}.${d.getMonth()+1}.${d.getFullYear()}</span></div>`;
  S.mgrs.forEach((mg, i) => {
    const m = matchOf(mg.my);
    if (!m) return;
    const s = sideOf(m, mg.my), mgf = s ? m.ga : m.gh, ogf = s ? m.gh : m.ga;
    let res = mgf > ogf ? 1 : mgf < ogf ? -1 : 0;
    if (m.pen) res = (s ? m.pen[1] > m.pen[0] : m.pen[0] > m.pen[1]) ? 1 : -1;
    withMgr(i, () => {
      afterMatchPlayers(res, M.played[mg.my]);
      if (M.kind === "liga") weeklyTraining();
      const bil = M.kind === "liga" ? settle(m) : settleCup(m);
      paper += paperBlock(m, s, res, bil);
    });
  });
  if (M.kind === "liga"){ aiAfterMatch(); refreshMarket(); S.md++; S.week++; }
  else { const adv = []; advanceCups(adv); pushNews([...M.hm.map(cupLine), ...others, ...adv]); }
  S.ev++;
  flushRest();
  beginTurns();
  save();
  renderMatch();
  drawIdle("ABPFIFF");
  $("#paper").innerHTML = paper;
  $("#after").hidden = false;
  const m = M.mine;
  logLine(`Abpfiff: ${byId[m.h].short} ${m.gh}:${m.ga} ${byId[m.a].short}${m.pen ? ` (${m.pen[0]}:${m.pen[1]} i.E.)` : m.et ? " n.V." : ""}`, "me", M.end + "'");
}
/* Zeitungsmeldung für den aktuellen Manager (läuft innerhalb von withMgr) */
function paperBlock(m, s, res, bil){
  const me = byId[S.my], opp = byId[s ? m.h : m.a], h = byId[m.h], a = byId[m.a];
  const mg = s ? m.ga : m.gh, og = s ? m.gh : m.ga;
  const scoreTxt = `${h.short} ${m.gh}:${m.ga} ${a.short}${m.pen ? ` (${m.pen[0]}:${m.pen[1]} i.E.)` : m.et ? " n.V." : ""}`;
  let head, extra;
  if (!m.comp){
    head = mg > og ? `${me.short} siegt ${mg}:${og} gegen ${opp.short}!` : mg < og ? `Bittere ${mg}:${og}-Pleite für ${me.short}` : `${mg}:${og} – Punkteteilung zwischen ${h.short} und ${a.short}`;
    extra = `${fmt(m.spec)} Zuschauer, ${m.ch[0]+m.ch[1]} Torchancen. ${me.short} steht jetzt auf Platz ${myPlace()} der ${LNAME[myLg()]}.`;
  } else {
    const t = m.tie;
    head = `${COMPS[m.comp]}: ${scoreTxt}`;
    const status = !t.win ? "Die Entscheidung fällt im Rückspiel." :
      t.win === S.my ? (m.final ? `${me.name} gewinnt den ${COMPS[m.comp]}!` : `${me.short} erreicht ${m.rd + 1 === lastRound(m.comp) ? "das" : "die"} ${RN[m.comp][m.rd + 1]}!`) :
      `Aus in der Runde „${RN[m.comp][m.rd]}“. ${byId[t.win].short} kommt weiter.`;
    extra = `${roundName(m.comp, m.rd, m.leg, m.final)} vor ${fmt(m.spec)} Zuschauern. ${status}`;
  }
  const gate = bil.items.find(x => x[0] === "Eintrittsgelder");
  const tired = S.squads[S.my].filter(p => p.kond < 55).length;
  return `${multi() ? `<p class="who">${esc(S.mname)} · ${esc(me.short)}</p>` : ""}<h3>${head}</h3><p>${extra}</p>
    <p>Kasse: ${gate ? `Eintritt ${dm(gate[1])}, ` : ""}Saldo ${bil.sum >= 0 ? "+" : ""}${dm(bil.sum)}. Kontostand ${dm(S.fin.cash)}.</p>
    ${bil.done && bil.done.length ? `<p>Stadion: ${bil.done.join(", ")} fertiggestellt.</p>` : ""}
    ${tired ? `<p>${tired} Spieler sind platt (Kondition unter 55).</p>` : ""}`;
}
function settleCup(m){
  const home = m.h === S.my && !m.final, items = [];
  if (home) items.push(["Eintrittsgelder", Math.round(ticketIncome(m.spec) * 1.5)]);
  if (m.final) items.push(["Anteil Endspiel-Einnahmen", Math.round(m.spec * 15 / 2)]);
  items.push([`Prämie ${COMPS[m.comp]}`, m.comp === "dfb" ? POKAL_PRIZE[m.rd] : PRIZE[m.comp]]);
  if (m.final && m.tie.win === S.my) items.push(["Siegprämie", WINPRIZE[m.comp]]);
  if (home) items.push(["Stadionunterhalt", -upkeep()]);
  const sum = items.reduce((a, [,v]) => a + v, 0);
  S.fin.cash += sum;
  S.fin.last = {label:`${COMPS[m.comp]}, ${RN[m.comp][m.rd]}`, items, sum, done:[]};
  return S.fin.last;
}
/* Nur der Kader des aktuellen Managers */
function afterMatchPlayers(res, played){
  const e = EINSATZ[S.einsatz];
  const sq = S.squads[S.my];
  const xiAvg = sq.filter(p => played.has(p.id)).reduce((a,p) => a + p.st, 0) / Math.max(1, played.size);
  for (const p of sq){
    if (played.has(p.id)){
      p.kond = clamp(Math.round(p.kond - rnd(8, 15) * e.kond * (M.end > 90 ? 1.3 : 1)), 20, 100);
      p.laune = clamp(Math.round(p.laune + (res > 0 ? 6 : res < 0 ? -4 : 1)), 0, 100);
    } else {
      p.kond = clamp(Math.round(p.kond + (M.kind === "liga" ? 12 : 6)), 0, 100);
      p.laune = clamp(Math.round(p.laune - (p.st >= xiAvg - 4 ? 5 : 1) + (res > 0 ? 2 : 0)), 0, 100);
    }
    p.form = clamp(Math.round((p.form * 0.85 + res * 0.35 + rnd(-0.8, 0.8)) * 10) / 10, -3, 3);
    if (M.kind === "liga" && p.inj && !NEWINJ.has(p.id)) p.inj--;
  }
}
function aiAfterMatch(){
  for (const id in S.squads){
    if (isHuman(id)) continue;
    S.squads[id].forEach(p => { if (p.inj && !NEWINJ.has(p.id)) p.inj--; p.form = clamp(Math.round((p.form * 0.8 + rnd(-0.6, 0.6)) * 10) / 10, -3, 3); });
  }
}
function addResult(h, a, gh, ga){
  const H = S.table[h], A = S.table[a];
  H.sp++; A.sp++; H.tf += gh; H.tg += ga; A.tf += ga; A.tg += gh;
  if (gh > ga){ H.s++; A.n++; H.pk += 3; } else if (gh < ga){ A.s++; H.n++; A.pk += 3; } else { H.u++; A.u++; H.pk++; A.pk++; }
}
function kitsFor(m){
  const h = byId[m.h], a = byId[m.a];
  const hk = {shirt:h.c1, shorts:h.c2};
  let ak = {shirt:a.c1, shorts:a.c2};
  if (colDist(h.c1, a.c1) < 150) ak = {shirt:a.c2, shorts:a.c1};
  if (colDist(hk.shirt, ak.shirt) < 150) ak = {shirt:"#e8e8e8", shorts:"#151515"};
  if (colDist(hk.shirt, ak.shirt) < 150) ak = {shirt:"#1a1a1a", shorts:"#e8e8e8"};
  return [hk, ak];
}
