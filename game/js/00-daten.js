"use strict";
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

/* ---------- Daten ---------- */
const CLUBS = [
  {id:"isa", name:"FC Isarmünchen",      short:"Isarmünchen",  stadium:"Isar-Arena",           c1:"#c8102e", c2:"#ffffff", shape:"circle",  ini:"FCI", att:81, def:78, cap:63000},
  {id:"pfa", name:"1. FC Pfalzberg",     short:"Pfalzberg",    stadium:"Am Pfalzberg",         c1:"#c41a1a", c2:"#ffffff", shape:"shield",  ini:"FCP", att:76, def:74, cap:38000},
  {id:"ems", name:"BV Emschertal",       short:"Emschertal",   stadium:"Rote-Erde-Kampfbahn",  c1:"#f5c800", c2:"#151515", shape:"circle",  ini:"BV",  att:77, def:72, cap:54000},
  {id:"wes", name:"SV Weserstadt",       short:"Weserstadt",   stadium:"Weserufer-Stadion",    c1:"#1f8a3a", c2:"#ffffff", shape:"diamond", ini:"W",   att:74, def:73, cap:32000},
  {id:"mai", name:"Eintracht Mainfurt",  short:"Mainfurt",     stadium:"Waldstadion Mainfurt", c1:"#b01010", c2:"#151515", shape:"circle",  ini:"E",   att:75, def:69, cap:45000},
  {id:"nec", name:"VfB Neckarstadt",     short:"Neckarstadt",  stadium:"Neckarwiesen",         c1:"#ffffff", c2:"#c8102e", shape:"shield",  ini:"VfB", att:74, def:71, cap:52000},
  {id:"che", name:"SV Chemie Rhein",     short:"Chemie Rhein", stadium:"Werksstadion",         c1:"#d42020", c2:"#151515", shape:"circle",  ini:"SVC", att:72, def:72, cap:24000},
  {id:"dom", name:"1. FC Domstadt",      short:"Domstadt",     stadium:"Rheinwiesen-Stadion",  c1:"#e02222", c2:"#ffffff", shape:"shield",  ini:"FC",  att:70, def:70, cap:55000},
  {id:"als", name:"Alster SV",           short:"Alster SV",    stadium:"Volkspark am Teich",   c1:"#1b3f8f", c2:"#ffffff", shape:"diamond", ini:"ASV", att:69, def:70, cap:58000},
  {id:"nie", name:"Borussia Niersfeld",  short:"Niersfeld",    stadium:"Am Niersberg",         c1:"#151515", c2:"#e8e8e8", shape:"diamond", ini:"B",   att:71, def:66, cap:34500},
  {id:"kna", name:"FC Knappenstadt",     short:"Knappenstadt", stadium:"Glückauf-Kampfbahn",   c1:"#1a4fc8", c2:"#ffffff", shape:"circle",  ini:"FCK", att:67, def:69, cap:60000},
  {id:"fra", name:"1. FC Frankenburg",   short:"Frankenburg",  stadium:"Burgwald-Stadion",     c1:"#7a0f1a", c2:"#151515", shape:"shield",  ini:"FCF", att:66, def:67, cap:44000},
  {id:"spr", name:"SV Spreeathen",       short:"Spreeathen",   stadium:"Spreestadion",         c1:"#2a5fd0", c2:"#ffffff", shape:"diamond", ini:"SV",  att:65, def:66, cap:70000},
  {id:"fae", name:"Fächerstadt SC",      short:"Fächerstadt",  stadium:"Hardtwald-Kampfbahn",  c1:"#1a5bd6", c2:"#ffffff", shape:"circle",  ini:"FSC", att:64, def:67, cap:33000},
  {id:"ruh", name:"VfL Ruhrtal",         short:"Ruhrtal",      stadium:"Zechenstadion",        c1:"#1d3fa8", c2:"#ffffff", shape:"shield",  ini:"VfL", att:63, def:65, cap:28000},
  {id:"for", name:"Fortuna Rheinufer",   short:"Rheinufer",    stadium:"Rheinbogen-Stadion",   c1:"#e8e8e8", c2:"#c8102e", shape:"diamond", ini:"F",   att:62, def:63, cap:50000},
  {id:"elb", name:"SC Elbflorenz",       short:"Elbflorenz",   stadium:"Elbauen-Stadion",      c1:"#f2c200", c2:"#151515", shape:"shield",  ini:"SC",  att:64, def:61, cap:36000},
  {id:"han", name:"FC Hansa Ostsee",     short:"Hansa Ostsee", stadium:"Ostseestadion",        c1:"#0f3f9a", c2:"#ffffff", shape:"shield",  ini:"H",   att:62, def:62, cap:25000},
];
CLUBS.forEach(c => { c.lg = 1; c.land = "GER"; });
const PAL = [["#c8102e","#ffffff"],["#1d3fa8","#ffffff"],["#1f8a3a","#ffffff"],["#151515","#ffffff"],["#f2c200","#151515"],["#6a1b9a","#ffffff"],["#e8e8e8","#1d3fa8"],["#d06a10","#151515"],["#0f7a8a","#ffffff"],["#7a0f1a","#f2c200"],["#2a5fd0","#f2c200"],["#e8e8e8","#c8102e"],["#3d7a2a","#f2c200"],["#8a1538","#ffffff"]];
const SHAPES = ["circle","shield","diamond"];
function iniOf(name){
  const w = name.replace(/^1\.\s*/, "").split(/[\s-]+/).filter(Boolean);
  return w.map(x => x[0]).join("").toUpperCase().slice(0, 3);
}
function addClubs(list, lg, lo, hi, capLo, capHi, seed){
  const r = seeded(seed);
  list.forEach(([name, short, land], i) => {
    const [c1, c2] = PAL[Math.floor(r() * PAL.length)];
    const top = ["ENG","ESP","ITA","FRA","NED","POR"].includes(land);
    const L = land ? (top ? lo + 6 : lo) : lo, Hh = land ? (top ? hi : hi - 6) : hi;
    const base = L + r() * (Hh - L);
    CLUBS.push({id:(land ? "x" : "l" + lg) + i, name, short, stadium: land ? `${short} Stadium` : `Sportpark ${short}`,
      c1, c2, shape:SHAPES[Math.floor(r() * 3)], ini:iniOf(name),
      att:Math.round(base + (r() - .5) * 6), def:Math.round(base + (r() - .5) * 6),
      cap:Math.round((capLo + r() * (capHi - capLo)) / 500) * 500, lg: land ? 0 : lg, land: land || "GER"});
  });
}
addClubs([["Arminia Teutoburg","Teutoburg"],["SV Leinestadt","Leinestadt"],["Kickers Offenstadt","Offenstadt"],["Rot-Weiss Ruhrort","Ruhrort"],["Schwebebahn SV","Schwebebahn"],["1. FC Saarstadt","Saarstadt"],["Eintracht Oker","Oker"],["VfL Hasetal","Hasetal"],["SV Waldhof Kurpfalz","Kurpfalz"],["SC Breisgau","Breisgau"],["Kickers Neckarhöhe","Neckarhöhe"],["FC Lahntal","Lahntal"],["TSV Isarvorstadt","Isarvorstadt"],["Union Spreewald","Spreewald"],["Lok Pleiße","Pleiße"],["FC Saaletal","Saaletal"],["1. FC Elbebrücke","Elbebrücke"],["Holstein Förde","Förde"]], 2, 55, 66, 12000, 30000, 202);
addClubs([["SV Moorland","Moorland"],["TuS Heidekreis","Heidekreis"],["FC Eifelland","Eifelland"],["SpVgg Allgäu","Allgäu"],["VfR Bodensee","Bodensee"],["SC Erzgebirge","Erzgebirge"],["TSV Rhön","Rhön"],["FC Westerwald","Westerwald"],["SV Harzburg","Harzburg"],["Viktoria Sauerland","Sauerland"],["Germania Emsland","Emsland"],["TuS Mosel","Mosel"],["FC Spessart","Spessart"],["SV Vogtland","Vogtland"],["ASV Altmühl","Altmühl"],["SC Uckermark","Uckermark"],["FV Odenwald","Odenwald"],["Borussia Lippe","Lippe"]], 3, 45, 56, 4000, 14000, 303);
addClubs([["Mersey United","Mersey","ENG"],["Thames Athletic","Thames","ENG"],["Wessex Rovers","Wessex","ENG"],["Real Meseta","Meseta","ESP"],["CD Andalucía Sur","Andalucía","ESP"],["Atlético Cantábrico","Cantábrico","ESP"],["AC Lombardia","Lombardia","ITA"],["FC Vesuvio","Vesuvio","ITA"],["Sporting Laguna","Laguna","ITA"],["Olympique Côte Bleue","Côte Bleue","FRA"],["AS Loire","Loire","FRA"],["Racing Lorraine","Lorraine","FRA"],["Polder Rotterdam","Polder","NED"],["Grachten Amsterdam","Grachten","NED"],["Sporting Tejo","Tejo","POR"],["FC Douro","Douro","POR"],["Clyde Thistle","Clyde","SCO"],["Highland Rovers","Highland","SCO"],["RSC Brabant","Brabant","BEL"],["SK Donaustadt","Donaustadt","AUT"],["FC Alpenrhein","Alpenrhein","SUI"],["IFK Norrland","Norrland","SWE"],["Øresund BK","Øresund","DEN"],["Dynamo Wolga","Wolga","URS"],["FK Adria","Adria","YUG"],["Bohemia Moldau","Moldau","TCH"],["Panakropolis FC","Akropolis","GRE"],["Bosporus SK","Bosporus","TUR"]], 0, 62, 82, 30000, 80000, 404);
addClubs([["SV Grünau 09","Grünau"],["TuS Bergfelde","Bergfelde"],["FC Mühlbach","Mühlbach"],["SpVgg Weidenau","Weidenau"],["TSV Lindenhof","Lindenhof"],["VfR Steinbach","Steinbach"],["BSC Rosenthal","Rosenthal"],["SC Birkenhain","Birkenhain"],["FV Ahornberg","Ahornberg"],["Germania Waldkirchen","Waldkirchen"]], 4, 36, 46, 1500, 5000, 505);
const POOLS = {
  ENG:["Smith","Barnes","Walker","Hughes","Platt","Wright","Clarke","Adams","Lee","Stone","Webb","Parker","Bell","Hall","Tyler","Cole","Fox","Gray"],
  ESP:["García","Martín","López","Sánchez","Pérez","Gómez","Ruiz","Navarro","Moreno","Romero","Torres","Serrano","Blanco","Vidal","Castro","Ortega"],
  ITA:["Rossi","Bianchi","Ferri","Galli","Conti","Costa","Greco","Lombardi","Moretti","Barbieri","Fontana","Rinaldi","Caruso","Marini","Vitale","Serra"],
  FRA:["Martin","Bernard","Durand","Petit","Moreau","Laurent","Simon","Michel","Lefèvre","Roux","Fournier","Girard","Bonnet","Dupont","Lambert","Mercier"],
  NED:["de Jong","Jansen","de Vries","van Dijk","Bakker","Visser","Smit","Meijer","de Boer","Mulder","Bos","Vos","Peeters","Hendriks","Dekker","Kok"],
  POR:["Silva","Santos","Ferreira","Pereira","Oliveira","Costa","Rodrigues","Martins","Sousa","Fernandes","Gonçalves","Gomes","Lopes","Marques","Alves","Pinto"],
  SCO:["MacLeod","Campbell","Stewart","Robertson","Thomson","Anderson","MacDonald","Scott","Reid","Murray","Ross","Paterson","Young","Watson","Fraser","Kerr"],
  NORD:["Andersson","Johansson","Karlsson","Nilsson","Larsen","Hansen","Pedersen","Nielsen","Lindqvist","Berg","Holm","Dahl","Lund","Strand","Eklund","Sørensen"],
  OST:["Petrov","Ivanov","Kovač","Novák","Horvat","Popović","Jovanović","Dvořák","Kuznetsov","Marković","Babić","Svoboda","Nikolić","Volkov","Hájek","Popescu"],
  SUD:["Papadopoulos","Georgiou","Yılmaz","Demir","Kaya","Şahin","Nikolaou","Dimitriou","Çelik","Aydın","Christou","Öztürk","Vlachos","Arslan","Kostas","Koç"],
  AUT:["Huber","Gruber","Pichler","Moser","Steiner","Hofer","Leitner","Berger","Eder","Brunner","Auer","Wimmer","Egger","Mayr","Hager","Lechner"],
};
const LANDPOOL = {ENG:"ENG",ESP:"ESP",ITA:"ITA",FRA:"FRA",NED:"NED",BEL:"NED",POR:"POR",SCO:"SCO",AUT:"AUT",SUI:"AUT",SWE:"NORD",DEN:"NORD",URS:"OST",YUG:"OST",TCH:"OST",GRE:"SUD",TUR:"SUD"};
const byId = Object.fromEntries(CLUBS.map(c => [c.id, c]));
const CLUB_DEF = CLUBS.map(c => ({...c}));
const EDIT_FIELDS = ["name","short","stadium","c1","c2","shape","ini"];
const LSIZE = 18;
const LNAME = {1:"1. Liga", 2:"2. Liga", 3:"3. Liga", 4:"Amateure"};
const LNAME_DEF = {...LNAME};
/* Editor-Änderungen des Spielstands anwenden (vorher immer auf die Grundwerte zurücksetzen) */
function applyEdits(){
  CLUB_DEF.forEach(d => { const c = byId[d.id]; EDIT_FIELDS.forEach(f => c[f] = d[f]); });
  Object.assign(LNAME, LNAME_DEF); Object.assign(COMPS, COMPS_DEF);
  const E = S && S.edit; if (!E) return;
  for (const id in E.clubs || {}) if (byId[id]) Object.assign(byId[id], E.clubs[id]);
  Object.assign(LNAME, E.leagues || {}); Object.assign(COMPS, E.comps || {});
}
const GER = () => CLUBS.filter(c => c.lg > 0);
const myLg = () => S.lg[S.my];
const leagueIds = n => GER().map(c => c.id).filter(id => S.lg[id] === n);
const tag = id => byId[id].land !== "GER" ? ` (${byId[id].land})` : "";

const SURN = ["Becker","Wagner","Hoffmann","Krämer","Lindner","Schwarz","Jansen","Vogt","Kessler","Brandt","Albers","Fuchs","Lorenz","Seidel","Hartwig","Kuhn","Ostermann","Pohl","Rademacher","Thiele","Ullrich","Winkler","Ziegler","Böhm","Dietz","Engel","Franke","Graf","Haas","Jung","Kraus","Lang","Mohr","Nowak","Petersen","Roth","Sommer","Timm","Voss","Witt","Brückner","Hagedorn","Kowalski","Lüders","Matthies","Neubert","Overath","Prinz","Reimann","Steffens","Tiedemann","Wolters","Zander","Bartels","Gerdes","Henke","Janßen","Knopp","Mertens","Rehbein","Dombrowski","Heldt","Karsten","Lehnhoff","Michalski","Nickel","Pagels","Quandt","Riedl","Schäfer","Trautmann","Urban","Vollmer","Wosz","Zeidler","Bremser","Eckert","Funk","Gruber","Hilbert","Iske","Jakobs","Kuntz","Lattek","Maier"];
SURN.push("Ahlers","Baumann","Claasen","Drews","Ehlers","Feldkamp","Gehrke","Hinz","Ilgner","Jürgens","Kampmann","Lohmann","Möller","Nagel","Otten","Plate","Rausch","Sander","Tegtmeier","Uhlig","Vierling","Wehmeyer","Bork","Dahms","Ewert","Fricke","Grote","Heuer","Kappel","Lemke","Mahnke","Nölle","Pape","Quast","Ritter","Schulte","Tönnies","Vogel","Weidner","Zorn","Bach","Dreher","Fiedler","Grabowski","Hölzenbein","Kremers","Lippert","Mill","Nerlinger","Pflügler","Rahn","Sammer","Thon","Völler","Wuttke","Allgöwer","Brehme","Dörner","Eilts","Flick");
const SPONSORS = ["Kick-Cola","Krone Bräu","Autohaus Lange","Disketten 2000","Stadtwerke","Nordstern Versicherung","Möbel Kraus","Elektro Blitz","Sport-Echo","Reifen Fischer","Bauhof Meyer","Brunnen Quell","Kaufhaus Wendt","Radio Welle 7","Bäckerei Korn","Fernseh-Huber","Stahlwerk Ost","Lotto-Kiosk","Pils Edelhopf","Computer-Markt","Sparkasse Nord","Optik Klarblick","Tankstelle Rasant","Hotel Zur Post","Gummi-Bär","Turbo-Kaugummi","Spedition Rollmann","Getränke Sprudel"];
const MAX_BANDE = 5, N_OFF = {trikot:5, bande:8};
const INI = "ABCDFGHJKLMNPRSTUW";
const uid = () => Math.random().toString(36).slice(2, 10);
const usedNames = new Set();

function seeded(seed){ return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const WAGE_F = {0:1.15, 1:1.15, 2:0.75, 3:0.4, 4:0.2};
const wageFor = (st, lg) => Math.max(500, Math.round(st * 330 * (WAGE_F[lg] ?? 1) / 500) * 500);
function newPlayer(r, pos, base, pool = SURN){
  let n, k = 0; do { n = INI[Math.floor(r()*INI.length)] + ". " + pool[Math.floor(r()*pool.length)]; if (++k > 300) n += " " + (k % 97); } while (usedNames.has(n));
  usedNames.add(n);
  return {id:uid(), pos, name:n, st:Math.max(35, Math.min(95, Math.round(base + (r() - 0.5) * 18))), age:18 + Math.floor(r()*16),
    goals:0, form:Math.round((r() * 2 - 1) * 10) / 10, kond:Math.round(85 + r() * 15), laune:Math.round(55 + r() * 30), inj:0,
    vt:1 + Math.floor(r() * 4), tal:0};
}
function makeSquad(club, idx){
  const r = seeded(4711 + idx * 97);
  const pos = ["TOR","TOR","ABW","ABW","ABW","ABW","ABW","ABW","MIT","MIT","MIT","MIT","MIT","ANG","ANG","ANG","ANG"];
  return pos.map((p, i) => { const pl = {nr:i+1, ...newPlayer(r, p, (p === "ANG" || p === "MIT") ? club.att : club.def, POOLS[LANDPOOL[club.land]] || SURN)}; pl.gehalt = wageFor(pl.st, club.lg); return pl; });
}
function migratePlayers(){
  for (const id in S.squads) S.squads[id].forEach(p => {
    if (!p.id) p.id = uid();
    if (p.form === undefined) p.form = 0;
    if (p.kond === undefined) p.kond = 95;
    if (p.laune === undefined) p.laune = 65;
    if (p.inj === undefined) p.inj = 0;
    if (p.vt === undefined) p.vt = 1 + Math.floor(Math.random() * 4);
    if (p.gehalt === undefined) p.gehalt = wageFor(p.st, S.lg[id] ?? 1);
    if (p.tal === undefined) p.tal = 0;
    usedNames.add(p.name);
  });
}

/* Spielerzustand */
function eff(p){ return p.st + p.form * 2 - Math.max(0, 70 - p.kond) * 0.25 + (p.laune - 50) * 0.04 - (p.inj ? p.st * 0.35 : 0); }
const FORMS = {
  "4-4-2":  {ABW:4, MIT:4, ANG:2, att:1.00, def:1.00},
  "4-3-3":  {ABW:4, MIT:3, ANG:3, att:1.07, def:0.95},
  "3-5-2":  {ABW:3, MIT:5, ANG:2, att:1.04, def:0.97},
  "5-3-2":  {ABW:5, MIT:3, ANG:2, att:0.93, def:1.07},
  "Libero": {ABW:5, MIT:4, ANG:1, att:0.87, def:1.12},
};
const EINSATZ = [
  {l:"Locker", m:0.94, card:0.5, kond:0.6},
  {l:"Normal", m:1.00, card:1.0, kond:1.0},
  {l:"Hart",   m:1.05, card:1.7, kond:1.3},
  {l:"Brutal", m:1.09, card:2.8, kond:1.6},
];
function bestXI(sq, f){
  const avail = sq.filter(p => !p.inj), used = new Set();
  const take = (pos, k) => { const r = avail.filter(p => p.pos === pos && !used.has(p.id)).sort((a,b) => eff(b) - eff(a)).slice(0, k); r.forEach(p => used.add(p.id)); return r; };
  const xi = [...take("TOR",1), ...take("ABW",f.ABW), ...take("MIT",f.MIT), ...take("ANG",f.ANG)];
  const rest = avail.filter(p => !used.has(p.id) && p.pos !== "TOR").sort((a,b) => eff(b) - eff(a));
  while (xi.length < 11 && rest.length) xi.push(rest.shift());
  return xi;
}
const myForm = () => FORMS[S.tactic] || FORMS["4-4-2"];
function lineup(id){
  if (id === S.my && S.xi) return manualXI();
  return bestXI(S.squads[id], id === S.my ? myForm() : FORMS["4-4-2"]);
}
function manualXI(){
  const sq = S.squads[S.my];
  const xi = S.xi.map(pid => sq.find(p => p.id === pid)).filter(p => p && !p.inj);
  if (xi.length < 11){
    const fill = [...bestXI(sq, myForm()), ...sq.filter(p => !p.inj).sort((a,b) => eff(b) - eff(a))];
    for (const p of fill){ if (xi.length >= 11) break; if (!xi.includes(p)) xi.push(p); }
  }
  return xi.slice(0, 11);
}
function strOf(xi, f, e, tb = 1){
  const avg = a => a.length ? a.reduce((s,p) => s + eff(p), 0) / a.length : 30;
  const g = xi.find(p => p.pos === "TOR"); const gk = g ? eff(g) : 30;
  const abw = xi.filter(p => p.pos === "ABW"), mit = xi.filter(p => p.pos === "MIT"), ang = xi.filter(p => p.pos === "ANG");
  const def = (gk * 1.5 + avg(abw) * abw.length + avg(mit) * mit.length * 0.4) / (1.5 + abw.length + mit.length * 0.4);
  const att = (avg(ang) * ang.length * 1.2 + avg(mit) * mit.length * 0.8 + avg(abw) * abw.length * 0.15) / Math.max(0.1, ang.length * 1.2 + mit.length * 0.8 + abw.length * 0.15);
  return {att: att * f.att * e.m * tb, def: def * f.def * e.m * tb};
}
function value(p){
  const ageF = p.age < 23 ? 1.25 : p.age < 30 ? 1 : p.age < 33 ? 0.65 : 0.35;
  return Math.max(25000, Math.round((Math.max(0, p.st - 35) ** 2) * 1100 * ageF / 5000) * 5000);
}
function formArrow(f){ return f >= 1.5 ? ["↑↑","var(--good)"] : f >= 0.5 ? ["↑","var(--good)"] : f > -0.5 ? ["→","var(--ink)"] : f > -1.5 ? ["↓","var(--bad)"] : ["↓↓","var(--bad)"]; }
function moodLabel(l){ return l >= 80 ? ["super","var(--good)"] : l >= 60 ? ["gut","var(--good)"] : l >= 40 ? ["okay","var(--ink)"] : l >= 20 ? ["mürrisch","var(--gold)"] : ["sauer","var(--bad)"]; }
const kondColor = k => k >= 80 ? "var(--good)" : k >= 60 ? "var(--ink)" : k >= 45 ? "var(--gold)" : "var(--bad)";

function makeSchedule(ids){
  const n = ids.length; let arr = ids.slice().sort(() => Math.random() - 0.5); const rounds = [];
  for (let r = 0; r < n - 1; r++){
    const m = [];
    for (let i = 0; i < n/2; i++){ let h = arr[i], a = arr[n-1-i]; if ((r + i) % 2 === 1) [h, a] = [a, h]; m.push([h, a]); }
    rounds.push(m);
    arr = [arr[0], arr[n-1], ...arr.slice(1, n-1)];
  }
  return rounds.concat(rounds.map(m => m.map(([h,a]) => [a,h])));
}

/* ---------- Hilfen ---------- */
function hexRgb(h){ const n = parseInt(h.slice(1),16); return [n>>16, (n>>8)&255, n&255]; }
function colDist(a,b){ const x = hexRgb(a), y = hexRgb(b); return Math.hypot(x[0]-y[0], x[1]-y[1], x[2]-y[2]); }
function lum(h){ const [r,g,b] = hexRgb(h); return (0.299*r + 0.587*g + 0.114*b)/255; }
function crest(c){
  const fg = lum(c.c1) > 0.6 ? c.c2 : c.c1;
  const fs = c.ini.length > 2 ? 11 : c.ini.length > 1 ? 14 : 20;
  const txt = `<text x="24" y="${24 + fs*0.36}" text-anchor="middle" font-family="Silkscreen,monospace" font-weight="700" font-size="${fs}" fill="${fg}">${c.ini}</text>`;
  let shape;
  if (c.shape === "circle") shape = `<circle cx="24" cy="24" r="21" fill="${c.c1}"/><circle cx="24" cy="24" r="16" fill="#fff"/>`;
  else if (c.shape === "diamond") shape = `<polygon points="24,2 46,24 24,46 2,24" fill="#fff" stroke="${c.c1}" stroke-width="4"/><polygon points="24,9 39,24 24,39 9,24" fill="none" stroke="${c.c1}" stroke-width="1.5"/>`;
  else shape = `<path d="M6 5 H42 V22 C42 34 33 41 24 45 C15 41 6 34 6 22 Z" fill="#fff" stroke="${c.c1}" stroke-width="4"/><path d="M6 5 H42 V12 H6 Z" fill="${c.c1}"/>`;
  return `<svg viewBox="0 0 48 48" aria-hidden="true">${shape}${txt}</svg>`;
}
const fmt = n => Math.round(n).toLocaleString("de-DE");
const dm = n => `${n < 0 ? "−" : ""}${fmt(Math.abs(n))} DM`;
const rnd = (a,b) => a + Math.random()*(b-a);
const pick = arr => arr[Math.floor(Math.random()*arr.length)];
const clamp = (v,a,b) => Math.max(a, Math.min(b, v));
function wpick(items, weights){ let s = weights.reduce((a,b)=>a+b,0), x = Math.random()*s; for (let i = 0; i < items.length; i++){ x -= weights[i]; if (x <= 0) return items[i]; } return items[items.length-1]; }
const MONTHS = ["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"];
function mdDate(md){ return new Date(1991, 7, 10 + 7*md); }
function esc(s){ return String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c])); }
