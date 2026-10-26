/* ---------- Spielsimulation ---------- */
const TYPES   = ["konter","flanke","ecke","fernschuss","doppelpass","dribbling","elfmeter","fallrueckzieher","freistoss"];
const TYPE_W  = [16, 17, 14, 13, 11, 11, 8, 3, 9];
const HOW = {flanke:" per Kopf", ecke:" per Kopf nach Ecke", fernschuss:" aus der Distanz", elfmeter:" per Elfmeter", fallrueckzieher:" per Fallrückzieher!", konter:" nach Konter", doppelpass:" nach Doppelpass", dribbling:" nach Solo", freistoss:" per Freistoß"};
const MAX_SUBS = 2;
let MKEY = "k", NEWINJ = new Set();

/* Werte eines menschlichen Managers für eine Seite des Spiels */
function sideSetup(club){
  const i = mgrIdx(club);
  if (i < 0) return {xi:lineup(club), str:null, eins:EINSATZ[1]};
  return withMgr(i, () => {
    const xi = lineup(club);
    return {xi, str:strOf(xi, myForm(), EINSATZ[S.einsatz], tacBonus()), eins:EINSATZ[S.einsatz]};
  });
}
function newMatch(h, a, extra = {}){
  const cup = !!extra.comp;
  let spec;
  if (extra.final) spec = Math.round(rnd(62000, 76000) / 50) * 50;
  else if (isHuman(h)) spec = withMgr(mgrIdx(h), () => Math.min(usableCap(), Math.round(attendanceMine() * (cup ? 1.3 : 1) / 50) * 50));
  else spec = Math.round(byId[h].cap * rnd(cup ? 0.75 : 0.55, 1) / 50) * 50;
  const m = {h, a, gh:0, ga:0, y:[0,0], r:[0,0], ch:[0,0], inj:[0,0], spec, form:[rnd(0.94,1.06), rnd(0.94,1.06)], ...extra};
  const H = sideSetup(h), A = sideSetup(a);
  m.xi = [H.xi, A.xi];
  m.eins = [H.eins, A.eins];
  m.str = [H.str || strOf(H.xi, FORMS["4-4-2"], EINSATZ[1], 1), A.str || strOf(A.xi, FORMS["4-4-2"], EINSATZ[1], 1)];
  return m;
}
/* Stärke einer menschlichen Seite nach Wechsel, Taktik- oder Einsatzänderung neu berechnen */
function restrSide(m, s){
  const club = [m.h, m.a][s], i = mgrIdx(club);
  if (i < 0) return;
  withMgr(i, () => { m.str[s] = strOf(m.xi[s], myForm(), EINSATZ[S.einsatz], tacBonus()); m.eins[s] = EINSATZ[S.einsatz]; });
}
const sideOf = (m, club) => m.h === club ? 0 : m.a === club ? 1 : -1;
function pickShooter(xi, type){
  const pool = xi.filter(p => p.pos !== "TOR");
  if (type === "elfmeter" || type === "freistoss") return pool.filter(p => p.pos !== "ABW").sort((a,b) => eff(b) - eff(a))[type === "freistoss" && Math.random() < 0.4 ? 1 : 0] || pool[0];
  const w = (type === "flanke" || type === "ecke") ? {ABW:2, MIT:1.5, ANG:4} : {ABW:0.6, MIT:2, ANG:4.2};
  return wpick(pool, pool.map(p => w[p.pos] * Math.max(1, eff(p))));
}
const STANDARD = new Set(["elfmeter","freistoss","fallrueckzieher"]);
function stepMinute(m){
  const order = Math.random() < 0.5 ? [0,1] : [1,0];
  for (const s of order){
    const att = m.str[s].att * m.form[s] * (s || m.final ? 1 : 1.05);
    const def = m.str[1-s].def * m.form[1-s];
    const ratio = att / def;
    const p = 0.043 * Math.pow(ratio, 2.2) * (1 - 0.18*m.r[s] + 0.12*m.r[1-s]);
    if (Math.random() < p){
      m.ch[s]++;
      let type = wpick(TYPES, TYPE_W);
      const gp = type === "elfmeter" ? 0.76 : type === "fallrueckzieher" ? 0.22 : type === "freistoss" ? 0.24 : Math.min(0.6, 0.3 * Math.pow(ratio, 1.3));
      let outcome, variant = null;
      if (Math.random() < gp){
        outcome = "tor";
        if (!STANDARD.has(type)){
          const v = Math.random();
          if (v < 0.05){ variant = "eigentor"; type = "flanke"; }
          else if (v < 0.12) variant = "abpraller";
          else if (v < 0.16){ variant = "patzer"; type = "fernschuss"; }
        }
      } else {
        const y = Math.random(), noOff = type === "elfmeter" || type === "freistoss" || type === "ecke";
        outcome = y < 0.42 ? "parade" : y < 0.77 ? "vorbei" : y < 0.85 ? "pfosten" : y < 0.92 || noOff ? "latte" : "abseits";
      }
      const ev = {kind:"chance", side:s, outcome, type, variant, player:pickShooter(m.xi[s], type)};
      if (variant === "eigentor"){
        const d = m.xi[1-s].filter(p => p.pos === "ABW");
        ev.player = pick(d.length ? d : m.xi[1-s]); ev.og = true;
      }
      return ev;
    }
  }
  for (const s of order){
    const e = m.eins[s];
    const x = Math.random();
    if (x < 0.0018 * (0.6 + 0.4 * e.kond)){
      const pl = pick(m.xi[s].filter(p => !p.inj && p.pos !== "TOR")); if (!pl) continue;
      m.inj[s]++; return {kind:"inj", side:s, player:pl};
    }
    if (x < 0.0018 + 0.018 * e.card){
      const pl = pick(m.xi[s].filter(p => p.pos !== "TOR")); if (!pl) continue;
      if (Math.random() < 0.06 || (pl.yc === MKEY && Math.random() < 0.5)){ m.r[s]++; return {kind:"red", side:s, player:pl}; }
      m.y[s]++; return {kind:"yellow", side:s, player:pl};
    }
  }
  return null;
}
/* Folgen eines Ereignisses für den Spielstand (ohne Ticker) */
function applyCore(m, ev){
  if (ev.kind === "chance" && ev.outcome === "tor"){ if (ev.side) m.ga++; else m.gh++; if (!ev.og) ev.player.goals = (ev.player.goals || 0) + 1; }
  else if (ev.kind === "yellow") ev.player.yc = MKEY;
  else if (ev.kind === "red") m.xi[ev.side] = m.xi[ev.side].filter(p => p !== ev.player);
  else if (ev.kind === "inj"){
    ev.player.inj = 1 + Math.floor(Math.random() * 4); NEWINJ.add(ev.player.id);
    const club = [m.h, m.a][ev.side];
    if (!isHuman(club)){
      const bench = S.squads[club].filter(p => !p.inj && !m.xi[ev.side].includes(p) && p.pos === ev.player.pos);
      if (bench.length){ const i = m.xi[ev.side].indexOf(ev.player); if (i >= 0) m.xi[ev.side][i] = bench[0]; }
    }
  }
}
function quickSim(m){
  for (let i = 1; i <= 90; i++){ const ev = stepMinute(m); if (ev) applyCore(m, ev); }
  if (needsET(m)){ m.et = true; for (let i = 91; i <= 120; i++){ const ev = stepMinute(m); if (ev) applyCore(m, ev); } }
  if (m.et && needsET(m)) m.pen = shootout(m);
  return m;
}
function shootout(m){
  const sk = s => { const xi = m.xi[s]; const best = xi.filter(p => p.pos !== "TOR").reduce((a,p) => a + eff(p), 0) / Math.max(1, xi.length - 1); return 0.7 + (best - 60) * 0.002; };
  const p = [sk(0), sk(1)]; const g = [0,0];
  for (let i = 0; i < 5; i++){ for (const s of [0,1]) if (Math.random() < p[s]) g[s]++; }
  while (g[0] === g[1]){ const a = Math.random() < p[0], b = Math.random() < p[1]; g[0] += a; g[1] += b; }
  return g;
}

/* ---------- Pokalwettbewerbe: Meister-Pokal, Euro-Pokal, Vereinspokal ---------- */
const EURO_AFTER = [[2,0,1],[4,0,2],[8,1,1],[10,1,2],[16,2,1],[18,2,2],[24,3,1]];
const POKAL_AFTER = [[0,0],[5,1],[12,2],[19,3],[26,4],[33,5]];
const ROUNDS = ["Achtelfinale","Viertelfinale","Halbfinale","Finale"];
const RN = {mp:ROUNDS, ep:ROUNDS, dfb:["1. Runde","2. Runde","Achtelfinale","Viertelfinale","Halbfinale","Finale"]};
const COMPS = {mp:"Meister-Pokal", ep:"Euro-Pokal", dfb:"Vereinspokal"};
const COMPS_DEF = {...COMPS};
const CODE = {mp:"MP", ep:"EP", dfb:"VP"};
const PRIZE = {mp:300000, ep:150000}, WINPRIZE = {mp:2000000, ep:1000000, dfb:1500000};
const POKAL_PRIZE = [25000, 50000, 100000, 200000, 400000, 800000];
const lastRound = k => RN[k].length - 1;
const cupOf = k => k === "dfb" ? S.dfb : S.euro[k];
const roundName = (k, r, leg, final) => `${RN[k][r]}${final || k === "dfb" ? "" : leg === 1 ? ", Hinspiel" : ", Rückspiel"}`;

function drawTies(ids){ const a = ids.slice().sort(() => Math.random() - .5), t = []; for (let i = 0; i < a.length; i += 2) t.push({a:a[i], b:a[i+1], l1:null, l2:null, win:null, pen:null, et:false}); return t; }
/* Pokal: der klassentiefere Verein hat Heimrecht */
function drawPokal(ids){
  return drawTies(ids).map(t => { if ((S.lg[t.b] || 0) > (S.lg[t.a] || 0)) [t.a, t.b] = [t.b, t.a]; return t; });
}
function setupEuro(mp, ep){
  const foreign = CLUBS.filter(c => c.lg === 0).map(c => c.id).sort(() => Math.random() - .5);
  const mpT = [...mp, ...foreign.splice(0, 16 - mp.length)], epT = [...ep, ...foreign.splice(0, 16 - ep.length)];
  S.euro = {mp:{teams:mpT, round:0, ties:drawTies(mpT), champ:null}, ep:{teams:epT, round:0, ties:drawTies(epT), champ:null}};
}
function setupPokal(){
  const teams = CLUBS.filter(c => c.land === "GER").map(c => c.id);
  S.dfb = {teams, round:0, ties:drawPokal(teams), champ:null};
}
function cupComps(e){ return e.t === "euro" ? ["mp","ep"] : e.t === "pokal" ? ["dfb"] : []; }
function cupMatches(e){
  const out = [];
  for (const k of cupComps(e)){
    const C = cupOf(k); if (!C || C.champ || C.round !== e.r) continue;
    const final = e.r === lastRound(k);
    C.ties.forEach(t => {
      if (t.win) return;
      if (k === "dfb"){ out.push(newMatch(t.a, t.b, {comp:k, tie:t, leg:1, rd:e.r, final, single:true, decisive:true})); return; }
      const [h, a] = e.leg === 2 ? [t.b, t.a] : [t.a, t.b];
      out.push(newMatch(h, a, {comp:k, tie:t, leg:e.leg, rd:e.r, final, single:final, decisive: final || e.leg === 2}));
    });
  }
  return out;
}
/* Welche menschlichen Manager haben bei diesem Termin ein Spiel? */
function involved(e){
  if (e.t === "liga") return S.mgrs.map((_, i) => i);
  return S.mgrs.map((m, i) => i).filter(i => cupComps(e).some(k => {
    const C = cupOf(k), my = S.mgrs[i].my;
    return C && !C.champ && C.round === e.r && C.ties.some(t => !t.win && (t.a === my || t.b === my));
  }));
}
function needsET(m){
  if (!m.decisive) return false;
  if (m.single) return m.gh === m.ga;
  const t = m.tie, aggA = t.l1[0] + m.ga, aggB = t.l1[1] + m.gh;
  if (aggA !== aggB) return false;
  return m.et ? true : m.ga === t.l1[1];
}
function recordLeg(m){
  const t = m.tie;
  if (m.single){ t.l1 = [m.gh, m.ga]; t.win = m.gh > m.ga ? m.h : m.ga > m.gh ? m.a : (m.pen[0] > m.pen[1] ? m.h : m.a); }
  else if (m.leg === 1){ t.l1 = [m.gh, m.ga]; return; }
  else {
    t.l2 = [m.gh, m.ga];
    const aggA = t.l1[0] + t.l2[1], aggB = t.l1[1] + t.l2[0];
    if (aggA !== aggB) t.win = aggA > aggB ? t.a : t.b;
    else if (!m.et && t.l2[1] !== t.l1[1]) t.win = t.l2[1] > t.l1[1] ? t.a : t.b;
    else if (m.pen) t.win = m.pen[0] > m.pen[1] ? t.b : t.a;
    else t.win = t.a;
  }
  t.pen = m.pen || null; t.et = !!m.et;
}
function cupLine(m){
  return `${CODE[m.comp]} ${roundName(m.comp, m.rd, m.leg, m.final)}: ${byId[m.h].short} ${m.gh}:${m.ga} ${byId[m.a].short}${m.pen ? ` (${m.pen[0]}:${m.pen[1]} i.E.)` : m.et ? " n.V." : ""}`;
}
function advanceCups(lines){
  for (const k of ["mp","ep","dfb"]){
    const C = cupOf(k);
    if (!C || C.champ || !C.ties.every(t => t.win)) continue;
    if (C.round === lastRound(k)){ C.champ = C.ties[0].win; lines.push(`${COMPS[k]}-Sieger: ${byId[C.champ].name}!`); }
    else {
      C.round++;
      const winners = C.ties.map(t => t.win);
      C.ties = k === "dfb" ? drawPokal(winners) : drawTies(winners);
      lines.push(`${COMPS[k]}: ${RN[k][C.round]} ausgelost.`);
    }
  }
}
function simCupEvent(e){
  MKEY = uid(); NEWINJ = new Set();
  const lines = [];
  cupMatches(e).forEach(m => { quickSim(m); recordLeg(m); if (m.comp !== "dfb" || m.rd >= 2 || S.lg[m.h] === 1 || S.lg[m.a] === 1) lines.push(cupLine(m)); });
  advanceCups(lines);
  return lines;
}
function pushNews(lines){ S.news = [...lines.slice().reverse(), ...(S.news || [])].slice(0, 60); }
