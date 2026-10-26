/* ---------- Wirtschaft ---------- */
const capacity = () => S.stadium.steh + S.stadium.sitz;
const siteLoss = () => S.stadium.jobs.filter(j => j.k === "steh" || j.k === "sitz").length * 2000;
const usableCap = () => Math.max(0, capacity() - siteLoss());
function myPlace(){ return sortedTable().findIndex(r => r.c.id === S.my) + 1; }
function demand(){
  const c = byId[S.my], st = S.stadium;
  const place = S.md ? myPlace() : 4;
  const attr = 0.78 + 0.45 * (1 - (place - 1) / (LSIZE - 1));
  const priceF = clamp(1.35 - st.price / 30, 0.25, 1.3);
  const condF = 0.8 + 0.25 * st.cond / 100;
  const roofF = 1 + 0.12 * st.roof / Math.max(1, capacity());
  const extra = (st.light ? 1.04 : 1) * (st.board ? 1.03 : 1);
  return c.cap * 1.25 * attr * priceF * condF * roofF * extra * AD_BOOST[S.fin.ads];
}
function attendanceMine(){
  return Math.min(usableCap(), Math.round(demand() * rnd(0.9, 1.08) / 50) * 50);
}
function ticketIncome(spec){
  const st = S.stadium, sitzShare = st.sitz / Math.max(1, capacity());
  const sitz = Math.round(spec * sitzShare), steh = spec - sitz;
  return steh * st.price + sitz * Math.round(st.price * 1.8);
}
const tvMoney = place => { const lg = myLg(); return lg === 1 ? 60000 + (LSIZE - place) * 14000 : lg === 2 ? 25000 + (LSIZE - place) * 5000 : 8000 + (LSIZE - place) * 1500; };
const wages = () => S.squads[S.my].reduce((a,p) => a + (p.gehalt || 0), 0);
const upkeep = () => Math.round(capacity() * 1.2 + (S.stadium.light ? 5000 : 0) + (S.stadium.board ? 2000 : 0));
const loanInterest = l => Math.round(l.amt * l.rate / 100 / 4);
const debt = () => S.fin.loans.reduce((a,l) => a + l.amt, 0);

function genOffers(kind, n){
  const c = byId[S.my];
  const place = S.md ? myPlace() : 4;
  const posF = 0.85 + 0.35 * (1 - (place - 1) / (LSIZE - 1));
  const base = (kind === "trikot" ? c.cap * 2.3 : c.cap * 0.5) * posF;
  const sp = S.spons || {};
  const taken = new Set([sp.trikot?.name, ...(sp.bande || []).map(b => b.name),
    ...((sp.offers && sp.offers.trikot) || []).map(o => o.name), ...((sp.offers && sp.offers.bande) || []).map(o => o.name)].filter(Boolean));
  const names = SPONSORS.filter(x => !taken.has(x)).sort(() => Math.random() - 0.5).slice(0, n);
  return names.map(name => {
    const seasons = 1 + Math.floor(Math.random() * 3);
    const perMd = Math.round(base * rnd(0.75, 1.3) * (1 - 0.06 * (seasons - 1)) / 1000) * 1000;
    return {name, perMd, seasons};
  }).sort((a, b) => b.perMd - a.perMd);
}
function refreshOffers(){
  for (const k of ["trikot", "bande"]){
    if (k === "trikot" && S.spons.trikot) continue;
    let list = S.spons.offers[k] || [];
    const drop = Math.min(list.length, 1 + Math.floor(Math.random() * 2));
    for (let i = 0; i < drop; i++) list.splice(Math.floor(Math.random() * list.length), 1);
    S.spons.offers[k] = list;
    const add = genOffers(k, N_OFF[k] - list.length);
    S.spons.offers[k] = [...list, ...add].sort((a, b) => b.perMd - a.perMd);
  }
}
const bandeSum = () => S.spons.bande.reduce((a, b) => a + b.perMd, 0);

/* Abrechnung nach jedem Spieltag */
function settle(m){
  const home = m.h === S.my;
  const items = [];
  if (home){ items.push(["Eintrittsgelder", ticketIncome(m.spec)]); }
  if (S.spons.trikot) items.push(["Trikotwerbung", S.spons.trikot.perMd]);
  if (S.spons.bande.length) items.push([`Bandenwerbung (${S.spons.bande.length})`, bandeSum()]);
  items.push(["TV-Übertragung", tvMoney(myPlace())]);
  items.push(["Gehälter", -wages()]);
  if (home) items.push(["Stadionunterhalt", -upkeep()]);
  if (S.fin.ads) items.push(["Werbeausgaben", -AD_LEVELS[S.fin.ads]]);
  if (YOUTH[S.youth].cost) items.push(["Jugendarbeit", -YOUTH[S.youth].cost]);
  const zins = S.fin.loans.reduce((a,l) => a + loanInterest(l), 0);
  if (zins) items.push(["Kreditzinsen", -zins]);
  if (S.fin.cash < 0) items.push(["Dispozinsen", -Math.round(-S.fin.cash * 0.02)]);
  let sum = items.reduce((a,[,v]) => a + v, 0);
  S.fin.cash += sum;
  // fällige Kredite
  const due = S.fin.loans.filter(l => l.due <= S.week);
  due.forEach(l => { S.fin.cash -= l.amt; items.push([`Tilgung Kredit (${fmt(l.amt)} DM)`, -l.amt]); sum -= l.amt; });
  S.fin.loans = S.fin.loans.filter(l => l.due > S.week);
  if (home) S.stadium.cond = Math.max(10, S.stadium.cond - rnd(0.8, 2));
  // Baustellen
  const st = S.stadium, done = [];
  st.jobs.forEach(j => j.left--);
  st.jobs.filter(j => j.left <= 0).forEach(j => {
    if (j.k === "reno") st.cond = 100;
    else if (j.flag) st[j.k] = true;
    else st[j.k] += j.add;
    done.push(j.label);
  });
  st.jobs = st.jobs.filter(j => j.left > 0);
  if (S.camp > 0) S.camp--;
  refreshOffers();
  S.fin.last = {md:S.md, items, sum, done};
  return S.fin.last;
}
