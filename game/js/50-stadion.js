/* ---------- Stadion ---------- */
const condLabel = c => c >= 85 ? "sehr gut" : c >= 70 ? "gut" : c >= 50 ? "befriedigend" : c >= 30 ? "ausreichend" : "mangelhaft";
function comfortLabel(){
  const st = S.stadium, cap = Math.max(1, capacity());
  const score = 0.6 * st.roof / cap + 0.4 * st.sitz / cap + (st.board ? 0.08 : 0);
  return score > 0.75 ? "sehr gut" : score > 0.55 ? "gut" : score > 0.35 ? "befriedigend" : "ausreichend";
}
const BUILD = [
  {k:"steh",  label:"Stehplätze",        cost:100000, max:45000, steps:[[1000,2],[5000,4]], hint:"100.000 DM je 1.000 Plätze"},
  {k:"sitz",  label:"Sitzplätze",        cost:250000, max:30000, steps:[[1000,3],[5000,6]], hint:"250.000 DM je 1.000 Plätze"},
  {k:"roof",  label:"Überdachte Plätze", cost:150000, steps:[[1000,2],[5000,4]], hint:"150.000 DM je 1.000 Plätze"},
  {k:"light", label:"Flutlicht",         flag:true, cost:1500000, dur:4, hint:"Mehr Zuschauer bei Abendspielen"},
  {k:"board", label:"Anzeigetafel",      flag:true, cost:800000,  dur:3, hint:"Steigert den Komfort"},
];
const jobOf = k => S.stadium.jobs.find(j => j.k === k);
const spt = n => `${n} ${n === 1 ? "Spieltag" : "Spieltage"}`;
function stadiumSvg(){
  const st = S.stadium, c = byId[S.my];
  const hSteh = 18 + 52 * clamp(st.steh / 45000, 0, 1), hSitz = 18 + 52 * clamp(st.sitz / 30000, 0, 1);
  const cap = Math.max(1, capacity()), roofShare = clamp(st.roof / cap, 0, 1);
  const grey = st.cond < 40 ? "#6e6a66" : "#9096aa";
  const r = seeded(st.steh + st.sitz);
  let dots = "";
  const fill = (x, y, w, h) => { for (let yy = y + 3; yy < y + h - 2; yy += 4) for (let xx = x + 3; xx < x + w - 2; xx += 4) if (r() < 0.75) dots += `<rect x="${xx}" y="${yy}" width="2" height="2" fill="${pick(["#c43b3b","#e7d36a","#3b5bc4","#e8e8e8",c.c1])}"/>`; };
  const yS = 100 - hSteh, yT = 100 - hSitz;
  fill(10, yS, 120, hSteh); fill(190, yT, 120, hSitz);
  const roofW = 120 * roofShare;
  return `<svg viewBox="0 0 320 130" role="img" aria-label="Stadionansicht">
    <rect width="320" height="130" fill="#6fa6e0"/><rect y="70" width="320" height="60" fill="#8cb8e8" opacity=".4"/>
    <rect x="10" y="${yS}" width="120" height="${hSteh}" fill="${grey}"/>
    <rect x="190" y="${yT}" width="120" height="${hSitz}" fill="${grey}"/>
    ${dots}
    ${roofW > 4 ? `<rect x="${190 + 120 - roofW}" y="${yT - 8}" width="${roofW}" height="6" fill="#5b6073"/><rect x="${190 + 120 - roofW}" y="${yT - 2}" width="2" height="6" fill="#5b6073"/>` : ""}
    ${st.light ? `<rect x="146" y="20" width="3" height="80" fill="#d8dbe6"/><rect x="140" y="14" width="15" height="8" fill="#ffd23a"/><rect x="172" y="20" width="3" height="80" fill="#d8dbe6"/><rect x="166" y="14" width="15" height="8" fill="#ffd23a"/>` : ""}
    ${st.board ? `<rect x="135" y="56" width="50" height="22" fill="#111"/><text x="160" y="71" text-anchor="middle" font-family="VT323,monospace" font-size="14" fill="#ff4433">1 : 0</text>` : ""}
    ${st.jobs.length ? `<rect x="250" y="6" width="3" height="94" fill="#ffd23a"/><rect x="200" y="6" width="80" height="3" fill="#ffd23a"/><rect x="214" y="9" width="1" height="${Math.max(10, yT - 14)}" fill="#222"/><rect x="211" y="${Math.max(19, yT - 5)}" width="7" height="5" fill="#9096aa"/>` : ""}
    <rect y="100" width="320" height="30" fill="#3d8a2c"/><rect y="100" width="320" height="2" fill="#e8e8e8"/>
    <rect y="104" width="320" height="8" fill="${c.c1}"/><text x="160" y="110.5" text-anchor="middle" font-family="Silkscreen,monospace" font-size="6" fill="${lum(c.c1) > .6 ? "#151515" : "#fff"}">${esc(c.stadium.toUpperCase())}</text>
  </svg>`;
}
function renderStadium(){
  const st = S.stadium, c = byId[S.my];
  $("#st-pic").innerHTML = stadiumSvg();
  $("#st-name").textContent = c.stadium;
  const jobs = st.jobs.map(j => [`Baustelle: ${j.label}`, `noch ${spt(j.left)}`]);
  $("#st-kv").innerHTML = [
    ["Gesamtkapazität", fmt(capacity()) + (siteLoss() ? ` (Baustelle −${fmt(siteLoss())})` : "")], ["Sitzplätze", fmt(st.sitz)], ["Stehplätze", fmt(st.steh)],
    ["Überdachte Plätze", fmt(st.roof)], ["Flutlicht", st.light ? "vorhanden" : "nicht vorhanden"],
    ["Anzeigetafel", st.board ? "vorhanden" : "nicht vorhanden"], ["Zustand", `${condLabel(st.cond)} (${Math.round(st.cond)} %)`],
    ["Komfort", comfortLabel()], ...jobs, ["Ihr Kontostand", dm(S.fin.cash)]
  ].map(([k,v]) => `<span>${k}</span><span class="v">${v}</span>`).join("");
  const pend = k => st.jobs.filter(j => j.k === k).reduce((a,j) => a + (j.add || 0), 0);
  const rows = BUILD.map(b => {
    const job = jobOf(b.k);
    let btns = "", val = "";
    if (job){
      btns = `<button type="button" class="btn sm" disabled>Im Bau · ${spt(job.left)}</button>`;
      val = job.add ? `+${fmt(job.add)} im Bau` : "im Bau";
    } else if (b.flag){
      val = st[b.k] ? "vorhanden" : "";
      btns = st[b.k] ? `<button type="button" class="btn sm" disabled>Fertig</button>` :
        `<button type="button" class="btn sm" data-build="${b.k}:0" ${S.fin.cash >= b.cost ? "" : "disabled"}>${fmt(b.cost)} · ${spt(b.dur)}</button>`;
    } else {
      const max = b.k === "roof" ? capacity() + pend("steh") + pend("sitz") : b.max;
      const free = max - st[b.k];
      val = `${fmt(st[b.k])} / max. ${fmt(max)}`;
      btns = b.steps.map(([n, d], i) => {
        const cost = b.cost * n / 1000;
        return `<button type="button" class="btn sm" data-build="${b.k}:${i}" ${free >= n && S.fin.cash >= cost ? "" : "disabled"}>+${fmt(n)} · ${spt(d)}</button>`;
      }).join("");
    }
    return `<div class="nm">${b.label}<small>${val ? `<span class="val">${val}</span> · ` : ""}${b.hint}</small></div><div class="btns">${btns}</div>`;
  });
  const renoCost = Math.round((100 - st.cond) * 18000 / 1000) * 1000;
  const rj = jobOf("reno");
  rows.push(`<div class="nm">Renovierung<small>Zustand auf 100 % bringen · ${fmt(renoCost)} DM · 2 Spieltage</small></div><div class="btns">${rj ? `<button type="button" class="btn sm" disabled>Im Bau · ${spt(rj.left)}</button>` : `<button type="button" class="btn sm" id="reno" ${st.cond < 99 && S.fin.cash >= renoCost ? "" : "disabled"}>${st.cond < 99 ? "Renovieren" : "Top"}</button>`}</div>`);
  $("#st-build").innerHTML = rows.join("");
  $$("[data-build]").forEach(btn => btn.onclick = () => {
    const [k, i] = btn.dataset.build.split(":");
    const b = BUILD.find(x => x.k === k);
    if (jobOf(k)) return;
    let cost, job;
    if (b.flag){ cost = b.cost; job = {k, flag:true, left:b.dur, label:b.label}; }
    else { const [n, d] = b.steps[+i]; cost = b.cost * n / 1000; job = {k, add:n, left:d, label:`${b.label} +${fmt(n)}`}; }
    if (S.fin.cash < cost) return;
    S.fin.cash -= cost; st.jobs.push(job);
    $("#st-msg").textContent = `Bauauftrag erteilt: ${job.label}, fertig in ${spt(job.left)} (−${fmt(cost)} DM).`;
    save(); renderStadium();
  });
  const reno = $("#reno");
  if (reno) reno.onclick = () => { S.fin.cash -= renoCost; st.jobs.push({k:"reno", left:2, label:"Renovierung"}); $("#st-msg").textContent = `Renovierung beauftragt, fertig in 2 Spieltagen (−${fmt(renoCost)} DM).`; save(); renderStadium(); };
  $("#st-price").textContent = `${st.price} DM`;
  $("#st-price2").textContent = `${Math.round(st.price * 1.8)} DM`;
  const est = Math.min(usableCap(), Math.round(demand() / 100) * 100);
  $("#st-est").textContent = `Erwartet beim nächsten Heimspiel: ca. ${fmt(est)} Zuschauer, Einnahmen ca. ${dm(ticketIncome(est))}.${siteLoss() ? " Wegen der Baustelle fehlen Plätze." : ""}`;
}
$("#pr-m").onclick = () => { S.stadium.price = Math.max(4, S.stadium.price - 1); save(); renderStadium(); };
$("#pr-p").onclick = () => { S.stadium.price = Math.min(45, S.stadium.price + 1); save(); renderStadium(); };
