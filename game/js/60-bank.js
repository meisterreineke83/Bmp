/* ---------- Bank ---------- */
let loanSel = 0, amtSel = 1;
function bankSvg(){
  return `<svg viewBox="0 0 320 150" role="img" aria-label="Bankgebäude">
    <rect width="320" height="150" fill="#6fa6e0"/>
    <rect x="30" y="20" width="260" height="130" fill="#a4553a"/>
    ${Array.from({length:16}, (_, i) => `<rect x="30" y="${24 + i*8}" width="260" height="1" fill="#7c3c26"/>`).join("")}
    <rect x="30" y="14" width="260" height="10" fill="#5b6073"/>
    <rect x="100" y="34" width="120" height="20" fill="#f1ead6"/><text x="160" y="49" text-anchor="middle" font-family="Silkscreen,monospace" font-size="14" font-weight="700" fill="#1c2578">BANK</text>
    <rect x="48" y="66" width="40" height="40" fill="#1c2578"/><rect x="67" y="66" width="2" height="40" fill="#f1ead6"/><rect x="48" y="85" width="40" height="2" fill="#f1ead6"/>
    <rect x="232" y="66" width="40" height="40" fill="#1c2578"/><rect x="251" y="66" width="2" height="40" fill="#f1ead6"/><rect x="232" y="85" width="40" height="2" fill="#f1ead6"/>
    <rect x="132" y="70" width="56" height="80" fill="#14206a"/><rect x="140" y="78" width="40" height="30" fill="#2a3a9a"/>
    <rect x="148" y="66" width="24" height="7" fill="#d8dbe6"/><rect x="174" y="112" width="4" height="4" fill="#ffd23a"/>
    <rect y="146" width="320" height="4" fill="#5b6073"/>
  </svg><button type="button" class="door" id="door" aria-label="Bank-Tür"></button>`;
}
function renderBank(){
  const f = S.fin;
  $("#bk-pic").innerHTML = bankSvg();
  $("#door").onclick = doorCheat;
  const zins = f.loans.reduce((a,l) => a + loanInterest(l), 0);
  $("#bk-kv").innerHTML = [
    ["Kontostand", `<span class="${f.cash < 0 ? "neg-v" : ""}">${dm(f.cash)}</span>`],
    ["Gesamtschulden", dm(debt())],
    ["Zinsen pro Spieltag", dm(zins)],
    ["Kreditrahmen frei", dm(Math.max(0, MAX_DEBT - debt()))]
  ].map(([k,v]) => `<span>${k}</span><span class="v">${v}</span>`).join("") + (f.cash < 0 ? `<span style="grid-column:1/-1;color:var(--bad)">Konto überzogen: 2 % Dispozinsen pro Spieltag.</span>` : "");
  $("#bk-rates").innerHTML = LOAN_TERMS.map(([n,r], i) => `<button type="button" aria-pressed="${i===loanSel}">${n} Spt. · ${r} %</button>`).join("");
  [...$("#bk-rates").children].forEach((b,i) => b.onclick = () => { loanSel = i; renderBank(); });
  $("#bk-amt").innerHTML = LOAN_AMTS.map((a,i) => `<button type="button" aria-pressed="${i===amtSel}">${fmt(a)}</button>`).join("");
  [...$("#bk-amt").children].forEach((b,i) => b.onclick = () => { amtSel = i; renderBank(); });
  const [n, r] = LOAN_TERMS[loanSel], amt = LOAN_AMTS[amtSel];
  $("#bk-info").textContent = `Kredit über ${dm(amt)} für ${n} Spieltage zu ${r} %: ${dm(loanInterest({amt, rate:r}))} Zinsen pro Spieltag, Rückzahlung am Ende der Laufzeit.`;
  const ok = debt() + amt <= MAX_DEBT;
  $("#bk-take").disabled = !ok;
  if (!ok) $("#bk-msg").textContent = "Die Bank gewährt keinen weiteren Kredit in dieser Höhe.";
  $("#bk-loans").innerHTML = f.loans.length ? f.loans.map((l, i) =>
    `<div class="offer"><div class="nm"><b>${dm(l.amt)}</b> zu ${l.rate} %<small>noch ${l.due - S.week} Spieltage · ${dm(loanInterest(l))} Zinsen pro Spieltag</small></div><button type="button" class="btn sm" data-repay="${i}" ${f.cash >= l.amt ? "" : "disabled"}>Tilgen</button></div>`).join("")
    : `<p class="hint" style="margin:0">Keine laufenden Kredite.</p>`;
  $$("[data-repay]").forEach(b => b.onclick = () => {
    const l = f.loans[+b.dataset.repay]; if (!l || f.cash < l.amt) return;
    f.cash -= l.amt; f.loans.splice(+b.dataset.repay, 1);
    $("#bk-msg").textContent = `Kredit über ${dm(l.amt)} zurückgezahlt.`; save(); renderBank();
  });
  renderBilanz($("#bk-bil"), $("#bk-bil-t"));
}
function renderBilanz(el, title){
  const L = S.fin.last;
  if (!L){ el.innerHTML = `<span style="grid-column:1/-1;color:var(--muted)">Noch kein Spieltag abgerechnet.</span>`; if (title) title.textContent = "Bilanz letzter Spieltag"; return; }
  if (title) title.textContent = `Bilanz ${L.label || (L.md + 1) + ". Spieltag"}`;
  el.innerHTML = L.items.map(([k,v]) => `<span>${k}</span><span class="v ${v < 0 ? "neg-v" : "pos-v"}">${v > 0 ? "+" : ""}${dm(v)}</span>`).join("") +
    `<span class="sum">Saldo</span><span class="v sum">${L.sum > 0 ? "+" : ""}${dm(L.sum)}</span>`;
}
$("#bk-take").onclick = () => {
  const [n, r] = LOAN_TERMS[loanSel], amt = LOAN_AMTS[amtSel];
  if (debt() + amt > MAX_DEBT) return;
  S.fin.loans.push({amt, rate:r, due:S.week + n});
  S.fin.cash += amt;
  $("#bk-msg").textContent = `Kredit über ${dm(amt)} zu ${r} % aufgenommen.`;
  save(); renderBank();
};
function doorCheat(){
  const f = S.fin;
  f.cheat++;
  if (f.cheat > 3 && Math.random() < 0.3){
    const fine = f.cheatSum + 250000;
    f.cash -= fine; f.cheatSum = 0; f.cheat = 0;
    const g = $("#guru"); g.hidden = false;
    g.innerHTML = `<h2>Der Mogel-Guru hat Sie erwischt!</h2><p style="margin:0">Das ergaunerte Geld ist weg, dazu kommt eine Strafe. Abgebucht: ${dm(fine)}.</p>`;
    save(); renderBank(); return;
  }
  f.cash += 100000; f.cheatSum += 100000;
  $("#bk-msg").textContent = "Klingeling ... 100.000 DM gutgeschrieben.";
  save(); renderBank();
}
