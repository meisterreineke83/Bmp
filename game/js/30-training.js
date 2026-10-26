/* ---------- Trainingslager ---------- */
const CAMPS = [
  {f:"Kondition", n:"Waldlauf im Sauerland",          cost:15000,  kond:12, form:0,   laune:-2,  takt:0,    risk:0.01, st:0,    d:"Billig, etwas Kondition."},
  {f:"Kondition", n:"Konditionslager Schwarzwald",    cost:120000, kond:28, form:0.2, laune:-3,  takt:0,    risk:0.05, st:0,    d:"Solide Kondition, geringes Risiko."},
  {f:"Kondition", n:"Härtetest in der Kaserne",       cost:90000,  kond:38, form:0.3, laune:-15, takt:0,    risk:0.12, st:0,    d:"Sehr viel Kondition, schlechte Laune, Verletzungsgefahr."},
  {f:"Technik",   n:"Hallenturnier-Woche",            cost:40000,  kond:0,  form:0.4, laune:5,   takt:0,    risk:0.02, st:0.12, d:"Ballgefühl und gute Stimmung."},
  {f:"Technik",   n:"Technik-Lehrgang Sportschule",   cost:150000, kond:0,  form:0.6, laune:0,   takt:0,    risk:0.02, st:0.3,  d:"Junge Spieler können stärker werden."},
  {f:"Technik",   n:"Ballzauber-Camp in Brasilien",   cost:380000, kond:5,  form:0.9, laune:12,  takt:0,    risk:0.03, st:0.5,  d:"Teuer, aber die Technik macht große Sprünge."},
  {f:"Taktik",    n:"Videoanalyse mit dem Co-Trainer",cost:20000,  kond:0,  form:0.2, laune:-3,  takt:0.2,  risk:0,    st:0,    d:"Trocken, aber lehrreich."},
  {f:"Taktik",    n:"Taktikseminar Sportschule",      cost:70000,  kond:0,  form:0.4, laune:0,   takt:0.4,  risk:0,    st:0,    d:"Das Team versteht das System besser."},
  {f:"Taktik",    n:"Taktik-Camp am Gardasee",        cost:210000, kond:6,  form:0.6, laune:15,  takt:0.6,  risk:0.01, st:0,    d:"Taktik büffeln mit Seeblick: auch gut für die Laune."},
  {f:"Alles",     n:"Höhentraining in den Alpen",     cost:340000, kond:25, form:0.9, laune:4,   takt:0.3,  risk:0.04, st:0.2,  d:"Teuer, stärkt alle Bereiche."},
];
const CAMP_PAUSE = 3;
function teamAvg(k){ const sq = S.squads[S.my]; return Math.round(sq.reduce((a,p) => a + p[k], 0) / sq.length * 10) / 10; }
function stateKv(){
  const f = teamAvg("form");
  return `<span>Ø Kondition</span><span class="v" style="color:${kondColor(teamAvg("kond"))}">${Math.round(teamAvg("kond"))}</span>
    <span>Ø Form</span><span class="v" style="color:${formArrow(f)[1]}">${formArrow(f)[0]} (${f > 0 ? "+" : ""}${f})</span>
    <span>Ø Laune</span><span class="v" style="color:${moodLabel(teamAvg("laune"))[1]}">${moodLabel(teamAvg("laune"))[0]}</span>
    <span>Taktisches Verständnis</span><span class="v">${taktLabel()}</span>`;
}
const taktLabel = () => { const t = S.taktik || 0; return t >= 1.5 ? "überragend" : t >= 1 ? "gut" : t >= 0.5 ? "ordentlich" : "dürftig"; };
function renderCamp(){
  const wait = S.camp || 0;
  $("#tr-status").textContent = wait > 0 ? `Nächstes Trainingslager in ${spt(wait)} möglich.` : "Die Mannschaft ist bereit für ein Trainingslager.";
  $("#tr-kv").innerHTML = stateKv() + `<span>Kontostand</span><span class="v">${dm(S.fin.cash)}</span>`;
  const groups = ["Kondition","Technik","Taktik","Alles"];
  $("#tr-list").innerHTML = groups.map(g => `<h3>${g === "Alles" ? "Alle Bereiche" : "Schwerpunkt " + g}</h3>` + CAMPS.map((c, i) => c.f !== g ? "" :
    `<div class="offer"><div class="nm"><b>${c.n}</b> · ${dm(c.cost)}<small>${c.d}</small></div><button type="button" class="btn sm" data-camp="${i}" ${wait > 0 || S.fin.cash < c.cost ? "disabled" : ""}>Buchen</button></div>`).join("")).join("");
  $$("[data-camp]").forEach(b => b.onclick = () => runCamp(CAMPS[+b.dataset.camp]));
}
function runCamp(c){
  if ((S.camp || 0) > 0 || S.fin.cash < c.cost) return;
  S.fin.cash -= c.cost; S.camp = CAMP_PAUSE;
  S.taktik = clamp((S.taktik || 0) + c.takt, 0, 2);
  const hurt = [], better = [];
  for (const p of S.squads[S.my]){
    if (p.inj) continue;
    p.kond = clamp(Math.round(p.kond + c.kond * rnd(0.7, 1.2)), 0, 100);
    p.form = clamp(Math.round((p.form + c.form * rnd(0.6, 1.3)) * 10) / 10, -3, 3);
    p.laune = clamp(Math.round(p.laune + c.laune * rnd(0.7, 1.2)), 0, 100);
    const yf = p.age <= 23 ? 1.4 : p.age <= 28 ? 0.8 : 0.25;
    if (c.st && Math.random() < c.st * yf){ p.st = Math.min(95, p.st + 1 + (Math.random() < 0.3 ? 1 : 0)); better.push(p.name); }
    if (Math.random() < c.risk){ p.inj = 1 + Math.floor(Math.random() * 3); hurt.push(`${p.name} (${spt(p.inj)})`); }
  }
  $("#tr-msg").innerHTML = `<b>${c.n}</b> abgeschlossen.` + (c.takt ? " Das taktische Verständnis steigt." : "") +
    (better.length ? ` Stärker geworden: ${better.join(", ")}.` : "") +
    (hurt.length ? ` <span style="color:var(--bad)">Verletzt: ${hurt.join(", ")}.</span>` : " Keine Verletzungen.");
  save(); renderCamp();
}

/* ---------- Training (wöchentlich, 10 Bälle je Seite) ---------- */
const TPOS = [["TOR","Torwart"],["ABW","Abwehr"],["MIT","Mittelfeld"],["ANG","Sturm"]];
const TINH = [["tech","Technik"],["kond","Kondition"],["takt","Taktik"]];
const TINT = [{l:"Leicht", m:0.6, laune:2, risk:0.003}, {l:"Normal", m:1, laune:0, risk:0.008}, {l:"Hart", m:1.4, laune:-2, risk:0.02}];
const BALLS = 10;
const YOUTH = [
  {l:"Keine", cost:0,     n:0, base:0,  tal:0,    d:"Keine Kosten, aber auch kein Nachwuchs."},
  {l:"Klein", cost:15000, n:1, base:44, tal:0.15, d:"Ein Jugendspieler pro Saison."},
  {l:"Mittel", cost:35000, n:2, base:49, tal:0.3, d:"Zwei Jugendspieler pro Saison, ab und zu ein Talent."},
  {l:"Groß",  cost:70000, n:3, base:54, tal:0.5,  d:"Drei Jugendspieler pro Saison, oft mit großem Talent."},
];
const tacBonus = () => 1 + 0.05 * (S.taktik || 0);
function initTraining(){
  if (!S.train) S.train = {pos:{TOR:1, ABW:3, MIT:3, ANG:3}, inh:{tech:4, kond:3, takt:3}, int:1};
  if (S.taktik === undefined) S.taktik = 0.5;
}
function weeklyTraining(){
  const T = S.train, I = TINT[T.int];
  const tech = T.inh.tech / BALLS, kond = T.inh.kond / BALLS, takt = T.inh.takt / BALLS;
  const better = [], hurt = [];
  for (const p of S.squads[S.my]){
    if (p.inj) continue;
    const g = 0.4 + 0.6 * Math.min(2, T.pos[p.pos] / BALLS * 4);
    p.kond = clamp(Math.round(p.kond + 14 * kond * g * I.m), 0, 100);
    p.form = clamp(Math.round((p.form + 0.45 * takt * g * I.m * rnd(0.5, 1.2)) * 10) / 10, -3, 3);
    p.laune = clamp(Math.round(p.laune + I.laune), 0, 100);
    const yf = p.age <= 23 ? 1.5 : p.age <= 29 ? 1 : 0.35;
    if (Math.random() < 0.07 * tech * g * I.m * yf){ p.st = Math.min(95, p.st + 1); better.push(p.name); }
    if (Math.random() < I.risk * (0.5 + kond)){ p.inj = 1 + Math.floor(Math.random() * 2); hurt.push(p.name); }
  }
  S.taktik = clamp((S.taktik || 0) * 0.96 + 0.1 * takt * I.m, 0, 2);
  S.trainLog = {better, hurt};
}
function ballsHtml(n){ return Array.from({length:BALLS}, (_, i) => `<span class="ball${i < n ? "" : " off"}"></span>`).join(""); }
function renderTraining(){
  const T = S.train;
  const side = (list, key, el, freeEl) => {
    const used = list.reduce((a, [k]) => a + T[key][k], 0);
    $(freeEl).textContent = used < BALLS ? `· noch ${BALLS - used} frei` : "· alle verteilt";
    $(el).innerHTML = list.map(([k, l]) => `<div class="trow"><span class="tl">${l}</span>
      <button type="button" class="tb" data-t="${key}:${k}:-1" aria-label="${l} weniger" ${T[key][k] ? "" : "disabled"}>−</button>
      <span class="balls" aria-label="${T[key][k]} Bälle">${ballsHtml(T[key][k])}</span>
      <button type="button" class="tb" data-t="${key}:${k}:1" aria-label="${l} mehr" ${used < BALLS ? "" : "disabled"}>+</button></div>`).join("");
  };
  side(TPOS, "pos", "#tp-pos", "#tp-free1");
  side(TINH, "inh", "#tp-inh", "#tp-free2");
  $$("[data-t]").forEach(b => b.onclick = () => {
    const [key, k, d] = b.dataset.t.split(":");
    T[key][k] = clamp(T[key][k] + +d, 0, BALLS);
    save(); renderTraining();
  });
  $("#tp-int").innerHTML = TINT.map((x, i) => `<button type="button" aria-pressed="${T.int === i}">${x.l}</button>`).join("");
  [...$("#tp-int").children].forEach((b, i) => b.onclick = () => { T.int = i; save(); renderTraining(); });
  $("#tp-kv").innerHTML = stateKv();
  $("#yt-seg").innerHTML = YOUTH.map((y, i) => `<button type="button" aria-pressed="${S.youth === i}">${y.l}</button>`).join("");
  [...$("#yt-seg").children].forEach((b, i) => b.onclick = () => { S.youth = i; save(); renderTraining(); });
  const Y = YOUTH[S.youth];
  $("#yt-info").textContent = `${Y.d} Kosten: ${dm(Y.cost)} pro Spieltag. Die Jugendspieler kommen zu Beginn jeder Saison in den Kader; Talente (★) entwickeln sich besonders schnell.`;
  const L = S.trainLog;
  $("#tp-log").innerHTML = !L ? "Nach dem nächsten Spieltag steht hier, was das Training gebracht hat." :
    (L.better.length ? `Stärker geworden: ${L.better.join(", ")}. ` : "Diese Woche ist niemand stärker geworden. ") +
    (L.hurt.length ? `<span style="color:var(--bad)">Im Training verletzt: ${L.hurt.join(", ")}.</span>` : "Keine Trainingsverletzungen.");
}
