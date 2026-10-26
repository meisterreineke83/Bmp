/* ---------- Editor: Vereine, Spieler, Wettbewerbe ---------- */
const ED_COLORS = ["#c8102e","#e02222","#7a0f1a","#8a1538","#d06a10","#f2c200","#f5c800","#1f8a3a","#3d7a2a","#0f7a8a","#1d3fa8","#2a5fd0","#1b3f8f","#6a1b9a","#151515","#ffffff","#e8e8e8","#9096aa"];
const ED_SHAPES = [["circle","Kreis"],["shield","Schild"],["diamond","Raute"]];
let edTab = 0, edLg = 1, edClub = null, edDraft = null, edPClub = null, edFor = null;
function renderEditor(){
  if (edFor !== S){ edFor = S; edClub = edPClub = edDraft = null; }
  $("#ed-tabs").innerHTML = ["Vereine","Spieler","Wettbewerbe"].map((t, i) => `<button type="button" aria-pressed="${edTab === i}">${t}</button>`).join("");
  [...$("#ed-tabs").children].forEach((b, i) => b.onclick = () => { edTab = i; renderEditor(); });
  [edClubs, edPlayers, edComps][edTab]();
}
const edLeagueOf = id => byId[id].land !== "GER" ? 0 : S.lg[id];
function edClubs(){
  if (!edClub){ edClub = S.my; edLg = edLeagueOf(S.my); }
  if (!edDraft || edDraft.id !== edClub){ const c = byId[edClub]; edDraft = {id:c.id, ...Object.fromEntries(EDIT_FIELDS.map(f => [f, c[f]]))}; }
  const D = edDraft;
  const lgs = [[1, LNAME[1]], [2, LNAME[2]], [3, LNAME[3]], [4, LNAME[4]], [0, "Ausland"]];
  const sw = (key) => ED_COLORS.map(c => `<button type="button" class="sw" data-sw="${key}:${c}" style="background:${c}" aria-label="Farbe ${c}" aria-pressed="${D[key] === c}"></button>`).join("");
  $("#ed-body").innerHTML = `<div class="panel">
      <div class="seg" id="ed-lg" style="margin-bottom:10px">${lgs.map(([n, l]) => `<button type="button" aria-pressed="${edLg === n}">${esc(l)}</button>`).join("")}</div>
      <div class="clubs">${CLUBS.filter(c => edLeagueOf(c.id) === edLg).map(c => `<button type="button" class="club" data-ec="${c.id}" aria-pressed="${c.id === edClub}"><div class="tile">${crest(c)}</div><span>${esc(c.short)}</span></button>`).join("")}</div>
    </div>
    <div class="panel">
      <div class="edhead"><div class="tile big">${crest(D)}</div><div><b>${esc(D.name)}</b><div class="hint" style="margin:0">${esc(D.stadium)}</div></div></div>
      <div class="form">
        <label for="ed-name">Vereinsname</label><input type="text" id="ed-name" maxlength="28" value="${esc(D.name)}">
        <label for="ed-short">Kurzname</label><input type="text" id="ed-short" maxlength="14" value="${esc(D.short)}">
        <label for="ed-stad">Stadion</label><input type="text" id="ed-stad" maxlength="28" value="${esc(D.stadium)}">
        <label for="ed-ini">Wappen-Kürzel</label><input type="text" id="ed-ini" maxlength="3" value="${esc(D.ini)}">
      </div>
      <h3>Wappenform</h3><div class="seg" id="ed-shape">${ED_SHAPES.map(([k, l]) => `<button type="button" aria-pressed="${D.shape === k}">${l}</button>`).join("")}</div>
      <h3>Hauptfarbe (Trikot)</h3><div class="sws">${sw("c1")}</div>
      <h3>Zweitfarbe (Hose)</h3><div class="sws">${sw("c2")}</div>
      <div class="row" style="margin-top:10px"><button type="button" class="btn" id="ed-save">Übernehmen</button><button type="button" class="btn ghost" id="ed-reset">Original wiederherstellen</button></div>
      <div class="msg" id="ed-msg" role="status"></div>
    </div>`;
  [...$("#ed-lg").children].forEach((b, i) => b.onclick = () => { edLg = lgs[i][0]; renderEditor(); });
  $$("[data-ec]").forEach(b => b.onclick = () => { edClub = b.dataset.ec; edDraft = null; renderEditor(); });
  const grab = () => { D.name = $("#ed-name").value.trim() || D.name; D.short = $("#ed-short").value.trim() || D.short; D.stadium = $("#ed-stad").value.trim() || D.stadium; D.ini = ($("#ed-ini").value.trim() || D.ini).toUpperCase(); };
  [...$("#ed-shape").children].forEach((b, i) => b.onclick = () => { grab(); D.shape = ED_SHAPES[i][0]; renderEditor(); });
  $$("[data-sw]").forEach(b => b.onclick = () => { grab(); const [k, c] = b.dataset.sw.split(":"); D[k] = c; renderEditor(); });
  $("#ed-save").onclick = () => {
    grab();
    const def = CLUB_DEF.find(c => c.id === D.id), diff = {};
    EDIT_FIELDS.forEach(f => { if (D[f] !== def[f]) diff[f] = D[f]; });
    if (Object.keys(diff).length) S.edit.clubs[D.id] = diff; else delete S.edit.clubs[D.id];
    applyEdits(); save(); edDraft = null; renderEditor();
    $("#ed-msg").textContent = `${byId[D.id].name} gespeichert.`;
  };
  $("#ed-reset").onclick = () => { delete S.edit.clubs[D.id]; applyEdits(); save(); edDraft = null; renderEditor(); $("#ed-msg").textContent = "Originalwerte wiederhergestellt."; };
}
function edPlayers(){
  if (!edPClub) edPClub = S.my;
  const groups = [[1, LNAME[1]], [2, LNAME[2]], [3, LNAME[3]], [4, LNAME[4]], [0, "Ausland"]];
  const opts = groups.map(([n, l]) => `<optgroup label="${esc(l)}">${CLUBS.filter(c => edLeagueOf(c.id) === n).map(c => `<option value="${c.id}" ${c.id === edPClub ? "selected" : ""}>${esc(c.name)}</option>`).join("")}</optgroup>`).join("");
  const sq = S.squads[edPClub].slice().sort((a,b) => POS_ORDER[a.pos] - POS_ORDER[b.pos] || b.st - a.st);
  $("#ed-body").innerHTML = `<div class="panel">
      <label for="ed-pclub" class="lbl">Verein</label>
      <select id="ed-pclub">${opts}</select>
      <p class="hint">Namen antippen und ändern. Gespeichert wird beim Verlassen des Feldes.</p>
      <div class="form names">${sq.map(p => `<label for="ep-${p.id}" class="pos">${p.pos}</label><input type="text" id="ep-${p.id}" data-ep="${p.id}" maxlength="24" value="${esc(p.name)}">`).join("")}</div>
      <div class="msg" id="ed-msg" role="status"></div>
    </div>`;
  $("#ed-pclub").onchange = () => { edPClub = $("#ed-pclub").value; renderEditor(); };
  $$("[data-ep]").forEach(inp => inp.onchange = () => {
    const p = S.squads[edPClub].find(x => x.id === inp.dataset.ep), v = inp.value.trim();
    if (!p) return;
    if (!v){ inp.value = p.name; return; }
    p.name = v; save(); $("#ed-msg").textContent = `Gespeichert: ${v}.`;
  });
}
function edComps(){
  const rows = [["lg1", "Liga 1", LNAME[1]], ["lg2", "Liga 2", LNAME[2]], ["lg3", "Liga 3", LNAME[3]], ["dfb", "Nationaler Pokal", COMPS.dfb], ["mp", "Pokal der Meister", COMPS.mp], ["ep", "Zweiter Europapokal", COMPS.ep]];
  $("#ed-body").innerHTML = `<div class="panel">
      <p class="hint" style="margin-top:0">Eigene Namen für Ligen und Pokale, zum Beispiel die echten Namen von damals.</p>
      <div class="form">${rows.map(([k, l, v]) => `<label for="ec-${k}">${l}</label><input type="text" id="ec-${k}" maxlength="22" value="${esc(v)}">`).join("")}</div>
      <div class="row" style="margin-top:10px"><button type="button" class="btn" id="ec-save">Übernehmen</button><button type="button" class="btn ghost" id="ec-reset">Originalnamen</button></div>
      <div class="msg" id="ed-msg" role="status"></div>
    </div>`;
  $("#ec-save").onclick = () => {
    const E = S.edit; E.leagues = {}; E.comps = {};
    [1,2,3].forEach(n => { const v = $("#ec-lg" + n).value.trim(); if (v && v !== LNAME_DEF[n]) E.leagues[n] = v; });
    ["dfb","mp","ep"].forEach(k => { const v = $("#ec-" + k).value.trim(); if (v && v !== COMPS_DEF[k]) E.comps[k] = v; });
    applyEdits(); save(); renderEditor(); $("#ed-msg").textContent = "Namen gespeichert.";
  };
  $("#ec-reset").onclick = () => { S.edit.leagues = {}; S.edit.comps = {}; applyEdits(); save(); renderEditor(); $("#ed-msg").textContent = "Originalnamen wiederhergestellt."; };
}
