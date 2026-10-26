/* ---------- Transfermarkt ---------- */
const MIN_SQUAD = 14, MAX_SQUAD = 24;
function genMarket(n){
  const out = [];
  const others = CLUBS.filter(c => !isHuman(c.id) && c.lg !== 4);
  for (let i = 0; i < n; i++){
    if (Math.random() < 0.6){
      const c = pick(others), sq = S.squads[c.id];
      const xi = new Set(lineup(c.id).map(p => p.id));
      const cnt = pos => sq.filter(p => p.pos === pos).length;
      const cands = sq.filter(p => !xi.has(p.id) && !p.inj && cnt(p.pos) > ({TOR:2, ABW:4, MIT:4, ANG:2})[p.pos] && sq.length > 15 && !out.some(o => o.pid === p.id) && !(S.market || []).some(o => o.pid === p.id));
      if (cands.length){ const p = pick(cands); out.push({pid:p.id, from:c.id, price:Math.round(value(p) * rnd(1.05, 1.35) / 5000) * 5000}); continue; }
    }
    const pos = wpick(["TOR","ABW","MIT","ANG"], [1,3,3,3]);
    const p = newPlayer(Math.random, pos, rnd(48, 80));
    p.age = 19 + Math.floor(Math.random() * 15); p.vt = 3;
    out.push({free:p, from:null, price:Math.round(value(p) * rnd(0.45, 0.7) / 5000) * 5000});
  }
  return out;
}
function marketPlayer(o){ return o.free || (S.squads[o.from] || []).find(p => p.id === o.pid); }
function refreshMarket(){
  S.market = (S.market || []).filter(o => marketPlayer(o));
  const drop = Math.min(S.market.length, 2 + Math.floor(Math.random() * 2));
  for (let i = 0; i < drop; i++) S.market.splice(Math.floor(Math.random() * S.market.length), 1);
  S.market.push(...genMarket(12 - S.market.length));
  S.mgrs.forEach(m => m.sellOffers = {});
}
function renderTransfer(){
  const sq = S.squads[S.my];
  $("#tf-kv").innerHTML = `<span>Kontostand</span><span class="v">${dm(S.fin.cash)}</span><span>Kader</span><span class="v">${sq.length} Spieler (min. ${MIN_SQUAD}, max. ${MAX_SQUAD})</span>`;
  if (!S.market || !S.market.length) S.market = genMarket(12);
  const full = sq.length >= MAX_SQUAD;
  $("#tf-buy").innerHTML = S.market.map((o, i) => {
    const p = marketPlayer(o); if (!p) return "";
    const [fa, fc] = formArrow(p.form);
    return `<div class="offer"><div class="nm"><b>${p.name}</b> · <span class="pos">${p.pos}</span> · Stärke ${p.st} <span style="color:${fc}">${fa}</span><small>${p.age} Jahre · ${o.from ? "von " + byId[o.from].short : "vereinslos"} · Gehalt ${dm(demandOf(p))}/Spt., Vertrag bis Saison ${S.season + 2}</small></div><button type="button" class="btn sm" data-buy="${i}" ${S.fin.cash >= o.price && !full ? "" : "disabled"}>${fmt(o.price)} DM</button></div>`;
  }).join("") + (full ? `<p class="hint">Kader voll. Erst Spieler verkaufen.</p>` : "");
  $$("[data-buy]").forEach(b => b.onclick = () => buy(+b.dataset.buy));
  const order = {TOR:0, ABW:1, MIT:2, ANG:3};
  S.sellOffers = S.sellOffers || {};
  $("#tf-sell").innerHTML = sq.slice().sort((a,b) => order[a.pos] - order[b.pos] || b.st - a.st).map(p => {
    const off = S.sellOffers[p.id];
    const btn = off ? (off.no ? `<button type="button" class="btn sm" disabled>Kein Interesse</button>` :
        `<button type="button" class="btn sm" data-accept="${p.id}">${byId[off.club].short} bietet ${fmt(off.price)}</button>`)
      : `<button type="button" class="btn sm ghost" data-ask="${p.id}">Anbieten</button>`;
    return `<div class="offer"><div class="nm"><b>${p.name}</b> · <span class="pos">${p.pos}</span> · Stärke ${p.st}<small>${p.age} Jahre · Marktwert ${dm(value(p))}${p.inj ? " · verletzt" : ""}</small></div><div class="btns">${btn}</div></div>`;
  }).join("");
  $$("[data-ask]").forEach(b => b.onclick = () => {
    const p = sq.find(x => x.id === b.dataset.ask);
    if (Math.random() < (p.inj ? 0.6 : 0.2)) S.sellOffers[p.id] = {no:true};
    else S.sellOffers[p.id] = {club:pick(CLUBS.filter(c => !isHuman(c.id) && c.lg !== 4)).id, price:Math.round(value(p) * rnd(0.7, 1.08) * (p.inj ? 0.7 : 1) / 5000) * 5000};
    save(); renderTransfer();
  });
  $$("[data-accept]").forEach(b => b.onclick = () => sell(b.dataset.accept));
}
function buy(i){
  const o = S.market[i], p = marketPlayer(o), sq = S.squads[S.my];
  if (!p || S.fin.cash < o.price || sq.length >= MAX_SQUAD) return;
  S.fin.cash -= o.price;
  if (o.from) S.squads[o.from] = S.squads[o.from].filter(x => x.id !== p.id);
  p.nr = Math.max(0, ...sq.map(x => x.nr || 0)) + 1; p.goals = 0; p.laune = clamp(p.laune + 15, 0, 100);
  p.gehalt = demandOf(p); p.vt = 3; p.neg = null;
  sq.push(p);
  S.market.splice(i, 1);
  $("#tf-msg").textContent = `${p.name} verpflichtet für ${dm(o.price)}. Gehalt ${dm(p.gehalt)} pro Spieltag bis Saison ${S.season + 2}.`;
  save(); renderTransfer();
}
function sell(pid){
  const sq = S.squads[S.my], p = sq.find(x => x.id === pid), off = S.sellOffers[pid];
  if (!p || !off || off.no) return;
  if (sq.length <= MIN_SQUAD){ $("#tf-msg").textContent = `Mindestens ${MIN_SQUAD} Spieler müssen im Kader bleiben.`; return; }
  if (p.pos === "TOR" && sq.filter(x => x.pos === "TOR").length <= 2){ $("#tf-msg").textContent = "Sie brauchen mindestens zwei Torhüter."; return; }
  S.squads[S.my] = sq.filter(x => x.id !== pid);
  p.goals = 0; S.squads[off.club].push(p);
  S.fin.cash += off.price; delete S.sellOffers[pid];
  $("#tf-msg").textContent = `${p.name} für ${dm(off.price)} an ${byId[off.club].name} verkauft.`;
  save(); renderTransfer();
}
