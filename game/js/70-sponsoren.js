/* ---------- Sponsoren ---------- */
function renderSponsor(){
  const sz = n => `${n} ${n === 1 ? "Saison" : "Saisons"}`;
  // Trikot
  const tel = $("#sp-trikot"), cur = S.spons.trikot;
  if (cur){
    tel.innerHTML = `<div class="offer signed"><div class="nm"><b>${esc(cur.name)}</b><small>Vertrag: noch ${sz(cur.left)}</small></div><span class="val" style="color:var(--gold)">${dm(cur.perMd)}</span></div>
      <p class="hint">Pro Spieltag. Neue Angebote gibt es, wenn der Vertrag ausläuft.</p>`;
  } else {
    const offers = S.spons.offers.trikot || (S.spons.offers.trikot = genOffers("trikot", N_OFF.trikot));
    tel.innerHTML = `<p class="hint" style="margin:0 0 8px">Noch kein Trikotsponsor. ${offers.length} Angebote pro Spieltag:</p>` + offers.map((o,i) =>
      `<div class="offer"><div class="nm"><b>${esc(o.name)}</b> · ${dm(o.perMd)}<small>Laufzeit ${sz(o.seasons)}</small></div><button type="button" class="btn sm" data-sign="trikot:${i}">Annehmen</button></div>`).join("");
  }
  // Banden
  const bs = S.spons.bande, full = bs.length >= MAX_BANDE;
  const bo = S.spons.offers.bande || (S.spons.offers.bande = genOffers("bande", N_OFF.bande));
  $("#sp-bande").innerHTML =
    `<p class="hint" style="margin:0 0 8px">Belegt: ${bs.length} von ${MAX_BANDE} Banden · zusammen ${dm(bandeSum())} pro Spieltag</p>` +
    bs.map(b => `<div class="offer signed"><div class="nm"><b>${esc(b.name)}</b><small>noch ${sz(b.left)}</small></div><span class="val" style="color:var(--gold)">${dm(b.perMd)}</span></div>`).join("") +
    `<h3>${bo.length} Angebote${full ? " · alle Banden belegt" : ""}</h3>` +
    bo.map((o,i) => `<div class="offer"><div class="nm"><b>${esc(o.name)}</b> · ${dm(o.perMd)}<small>Laufzeit ${sz(o.seasons)}</small></div><button type="button" class="btn sm" data-sign="bande:${i}" ${full ? "disabled" : ""}>Annehmen</button></div>`).join("") +
    `<p class="hint">Jeden Spieltag kommen neue Angebote dazu, alte verfallen.</p>`;
  $$("[data-sign]").forEach(b => b.onclick = () => {
    const [k, i] = b.dataset.sign.split(":");
    const o = S.spons.offers[k][+i]; if (!o) return;
    const c = {name:o.name, perMd:o.perMd, left:o.seasons};
    if (k === "trikot"){ S.spons.trikot = c; S.spons.offers.trikot = []; }
    else { if (S.spons.bande.length >= MAX_BANDE) return; S.spons.bande.push(c); S.spons.offers.bande.splice(+i, 1); }
    save(); renderSponsor();
  });
  $("#sp-ads").innerHTML = AD_LEVELS.map((a,i) => `<button type="button" aria-pressed="${S.fin.ads===i}">${a ? fmt(a) : "Keine"}</button>`).join("");
  [...$("#sp-ads").children].forEach((b,i) => b.onclick = () => { S.fin.ads = i; save(); renderSponsor(); });
  const tri = S.spons.trikot?.perMd || 0, ban = bandeSum(), tv = tvMoney(S.md ? myPlace() : 4), ads = AD_LEVELS[S.fin.ads];
  $("#sp-sum").innerHTML = `<span>Trikotwerbung</span><span class="v pos-v">${dm(tri)}</span><span>Bandenwerbung</span><span class="v pos-v">${dm(ban)}</span>
    <span>TV-Übertragung</span><span class="v pos-v">${dm(tv)}</span><span>Werbeausgaben</span><span class="v neg-v">${ads ? "−" + dm(ads) : dm(0)}</span>
    <span class="sum">Summe</span><span class="v sum">${dm(tri + ban + tv - ads)}</span>
    <span style="grid-column:1/-1;color:var(--muted);font-size:17px">TV-Geld richtet sich nach dem Tabellenplatz.</span>`;
}
