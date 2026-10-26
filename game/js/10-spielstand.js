/* ---------- Spielstand ---------- */
const SPEEDS = [520, 260, 120, 45];
const AD_LEVELS = [0, 25000, 50000, 100000];
const AD_BOOST = [1, 1.05, 1.1, 1.16];
const LOAN_TERMS = [[3,7],[6,5],[9,4],[12,3],[15,2],[18,2]];
const LOAN_AMTS = [250000, 500000, 1000000];
const MAX_DEBT = 3000000;
const SLOTS = 5;
let OPTS = {scenes:true, speed:1, sound:true};
let S = null;
const blankRow = () => ({sp:0,s:0,u:0,n:0,tf:0,tg:0,pk:0});

/* ---------- Manager (Hotseat) ----------
   Alles, was einem Manager gehört, liegt in S.mgrs[i]. S.fin, S.my usw. zeigen immer auf den aktiven Manager S.cur. */
const MGR_KEYS = ["my","mname","fin","stadium","spons","tactic","einsatz","camp","train","taktik","xi","sellOffers","trainLog","tabView","youth","report"];
function bindMgrs(){
  for (const k of MGR_KEYS) Object.defineProperty(S, k, {configurable:true, enumerable:false,
    get(){ return S.mgrs[S.cur][k]; }, set(v){ S.mgrs[S.cur][k] = v; }});
}
function withMgr(i, fn){ const o = S.cur; S.cur = i; try { return fn(); } finally { S.cur = o; } }
const humans = () => S.mgrs.map(m => m.my);
const isHuman = id => !!S && S.mgrs.some(m => m.my === id);
const mgrIdx = id => S.mgrs.findIndex(m => m.my === id);
const multi = () => S.mgrs.length > 1;

function newGame(setup, slot){
  usedNames.clear();
  S = {slot, md:0, ev:0, week:0, season:1, lg:{}, table:{}, squads:{}, news:[], market:[], cur:0, ready:[],
       edit:{clubs:{}, comps:{}, leagues:{}},
       mgrs:setup.map((x, i) => ({my:x.club, mname:(x.name || "").trim() || `Manager ${i + 1}`}))};
  bindMgrs();
  applyEdits();
  CLUBS.forEach((c, i) => { S.lg[c.id] = c.lg; if (c.lg >= 1 && c.lg <= 3) S.table[c.id] = blankRow(); S.squads[c.id] = makeSquad(c, i); });
  buildSeason();
  const l1 = leagueIds(1).sort((a,b) => (byId[b].att + byId[b].def) - (byId[a].att + byId[a].def));
  setupEuro([l1[0]], l1.slice(1, 4));
  setupPokal();
  S.mgrs.forEach((m, i) => withMgr(i, () => { S.tabView = myLg(); initEconomy(); }));
  beginTurns();
  save();
}
function buildSeason(){
  S.sched = {}; for (const n of [1,2,3]) S.sched[n] = makeSchedule(leagueIds(n));
  S.cal = [];
  for (let md = 0; md < 34; md++){
    S.cal.push({t:"liga", md});
    POKAL_AFTER.filter(x => x[0] === md).forEach(([, r]) => S.cal.push({t:"pokal", r, md}));
    EURO_AFTER.filter(x => x[0] === md).forEach(([, r, leg]) => S.cal.push({t:"euro", r, leg, md}));
  }
  S.ev = 0; S.md = 0;
}
/* Fehlende Werte des aktiven Managers ergänzen (neues Spiel oder älterer Spielstand) */
function initEconomy(){
  const c = byId[S.my];
  if (!S.fin) S.fin = {cash: Math.round((800000 + c.cap * 22) / 10000) * 10000, loans:[], ads:0, cheat:0, cheatSum:0, last:null};
  if (!S.stadium){
    const steh = Math.round(c.cap * 0.7 / 500) * 500, sitz = Math.round(c.cap * 0.3 / 500) * 500;
    S.stadium = {steh, sitz, roof: Math.round(c.cap * 0.25 / 500) * 500, light: c.cap > 40000, board: false, cond: 62, price: 12};
  }
  if (!S.stadium.jobs) S.stadium.jobs = [];
  if (!S.tactic) S.tactic = "4-4-2";
  if (S.einsatz === undefined) S.einsatz = 1;
  if (S.camp === undefined) S.camp = 0;
  if (!S.sellOffers) S.sellOffers = {};
  if (S.youth === undefined) S.youth = 1;
  if (!S.report) S.report = [];
  initTraining();
  if (!S.spons) S.spons = {trikot:null, bande:[], offers:{}};
  if (!Array.isArray(S.spons.bande)) S.spons.bande = S.spons.bande ? [S.spons.bande] : [];
  if (!S.spons.offers) S.spons.offers = {};
  if (!S.spons.trikot && !(S.spons.offers.trikot || []).length) S.spons.offers.trikot = genOffers("trikot", N_OFF.trikot);
  if (!(S.spons.offers.bande || []).length || S.spons.offers.bande.length < 4) S.spons.offers.bande = genOffers("bande", N_OFF.bande);
}

/* ---------- Speichern & Laden (5 Speicherplätze) ---------- */
const slotKey = n => "libero91-slot" + n;
function save(){
  saveOpts();
  if (!S) return;
  try {
    localStorage.setItem(slotKey(S.slot), JSON.stringify(S));
    localStorage.setItem(slotKey(S.slot) + "-meta", JSON.stringify(metaOf(S)));
  } catch(e){
    const m = document.querySelector("#save-err"); if (m) m.hidden = false;
  }
}
function saveOpts(){ try { localStorage.setItem("libero91-opts", JSON.stringify(OPTS)); } catch(e){} }
function loadOpts(){ try { const o = JSON.parse(localStorage.getItem("libero91-opts") || "null"); if (o) OPTS = {...OPTS, ...o}; } catch(e){} }
/* Kurzinfo für die Spielstand-Liste; funktioniert auch mit Rohdaten älterer Versionen */
function metaOf(d){
  const mg = d.mgrs || [{my:d.my, mname:"Manager 1"}];
  const nm = id => d.edit?.clubs?.[id]?.short || CLUB_DEF.find(c => c.id === id)?.short || id;
  return {clubs:mg.map(m => nm(m.my)), names:mg.map(m => m.mname), season:d.season || 1, md:d.md || 0, saved:Date.now()};
}
function slotInfo(n){
  try {
    const raw = localStorage.getItem(slotKey(n));
    if (!raw) return null;
    const meta = localStorage.getItem(slotKey(n) + "-meta");
    return meta ? JSON.parse(meta) : metaOf(JSON.parse(raw));
  } catch(e){ return null; }
}
function freeSlot(){ for (let n = 1; n <= SLOTS; n++) if (!slotInfo(n)) return n; return 0; }
function deleteSlot(n){ try { localStorage.removeItem(slotKey(n)); localStorage.removeItem(slotKey(n) + "-meta"); } catch(e){} }
function loadSlot(n){
  try { const j = localStorage.getItem(slotKey(n)); return j ? adopt(JSON.parse(j), n) : false; } catch(e){ return false; }
}
/* Spielstand übernehmen und auf den aktuellen Stand bringen */
function adopt(d, slot){
  if (!d || !d.lg || !d.cal || !d.squads || !d.table) return false;
  S = d; S.slot = slot;
  if (!S.mgrs){ const m = {}; for (const k of MGR_KEYS) if (k in S){ m[k] = S[k]; delete S[k]; } S.mgrs = [m]; }
  S.mgrs.forEach((m, i) => { if (!m.mname) m.mname = `Manager ${i + 1}`; });
  if (!(S.cur >= 0 && S.cur < S.mgrs.length)) S.cur = 0;
  if (!Array.isArray(S.ready)) S.ready = [];
  if (S.week === undefined) S.week = S.md;
  bindMgrs();
  if (!S.edit) S.edit = {clubs:{}, comps:{}, leagues:{}};
  applyEdits();
  migratePlayers();
  CLUBS.forEach((c, i) => { if (!S.squads[c.id]) S.squads[c.id] = makeSquad(c, i); if (S.lg[c.id] === undefined) S.lg[c.id] = c.lg; });
  if (S.dfb === undefined) S.dfb = null;          // ältere Spielstände: Pokal startet mit der nächsten Saison
  S.mgrs.forEach((m, i) => withMgr(i, () => initEconomy()));
  return true;
}
/* Ältere Spielstände (vor den Speicherplätzen) nach Platz 1 übernehmen */
function migrateLegacy(){
  try {
    const old = localStorage.getItem("libero91");
    if (!old || localStorage.getItem(slotKey(1))) return;
    const d = JSON.parse(old);
    if (d.OPTS) OPTS = {...OPTS, ...d.OPTS};
    if (d.S && d.S.lg){ localStorage.setItem(slotKey(1), JSON.stringify(d.S)); localStorage.setItem(slotKey(1) + "-meta", JSON.stringify(metaOf(d.S))); }
  } catch(e){}
}
function exportText(){ return JSON.stringify({libero91:2, S}); }
function importText(txt, slot){
  let d; try { d = JSON.parse(txt); } catch(e){ return "Die Datei ist kein Libero-Spielstand."; }
  const st = d && (d.S || d);
  if (!st || !st.lg || !st.cal) return "Die Datei ist kein Libero-Spielstand.";
  try { localStorage.setItem(slotKey(slot), JSON.stringify(st)); localStorage.setItem(slotKey(slot) + "-meta", JSON.stringify(metaOf(st))); }
  catch(e){ return "Kein Speicherplatz mehr frei im Browser."; }
  return "";
}
