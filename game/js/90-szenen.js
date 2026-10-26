/* ---------- Torszenen-Engine (Canvas 320x180) ---------- */
const cv = $("#cv"), outx = cv.getContext("2d");
const wc = document.createElement("canvas"); wc.width = 320; wc.height = 180;
const cx = wc.getContext("2d");
let DIR = 1;
const W = 320, H = 180;
const SKIN = "#e0b088", HAIR = "#3a2414", KEEPER = {shirt:"#8a3fc0", shorts:"#202020"};
const GY0 = 28.34, GY1 = 35.66, GH = 2.44, GX = 105;

function P(x, y, z = 0){
  const d = y / 64, s = 0.72 + 0.28 * d;
  return [160 + (x - 77) * 5.3 * s, 60 + d * 116 - z * 6.5 * s, s];
}
const bg = document.createElement("canvas"); bg.width = W; bg.height = H;
const bgL = document.createElement("canvas"); bgL.width = W; bgL.height = H;
const curBg = () => DIR > 0 ? bg : bgL;
const crowd = document.createElement("canvas"); crowd.width = W; crowd.height = 50;
function buildBackground(home){
  const c = crowd.getContext("2d");
  c.fillStyle = "#231c2a"; c.fillRect(0,0,W,50);
  const cols = ["#c43b3b","#e7d36a","#3b5bc4","#e8e8e8","#6b3d2a","#2f7d3a","#d98a3c","#8a8fa8","#a04a8a","#f0f0f0"];
  const r = seeded(91);
  for (let y = 0; y < 50; y += 2) for (let x = 0; x < W; x += 2){
    if (r() < 0.82){ c.fillStyle = cols[Math.floor(r()*cols.length)]; c.fillRect(x, y, 2, 2); }
  }
  c.fillStyle = "rgba(0,0,0,.45)"; for (let y = 7; y < 50; y += 9) c.fillRect(0, y, W, 1);

  const g = bg.getContext("2d");
  g.fillStyle = "#231c2a"; g.fillRect(0,0,W,H);
  const ads = [["KICK-COLA","#c81e1e","#fff"],["STADTWERKE","#1d3fa8","#ffd23a"],["DISKETTEN 2000","#f2c200","#151515"],["KRONE BRÄU","#ffffff","#b01010"],["SPORT-ECHO","#151515","#e8e8e8"],["AUTOHAUS LANGE","#1f8a3a","#fff"]];
  const mi = S && home ? mgrIdx(home) : -1;
  if (mi >= 0){
    const mg = S.mgrs[mi], mc = byId[mg.my];
    mg.spons.bande.forEach(b => ads.unshift([b.name.toUpperCase(), mc.c1, lum(mc.c1) > .6 ? "#151515" : "#fff"]));
    if (mg.spons.trikot) ads.splice(2, 0, [mg.spons.trikot.name.toUpperCase(), "#f1ead6", "#1c2578"]);
  }
  const drawAds = (g2, mirror) => {
    g2.font = "7px Silkscreen, monospace"; g2.textBaseline = "middle"; g2.textAlign = "center";
    for (let i = 0, x = -10; x < W; i++, x += 66){
      const [t, b, f] = ads[i % ads.length];
      g2.fillStyle = b; g2.fillRect(x, 48, 64, 10);
      g2.fillStyle = f; const tx = t.length > 14 ? t.slice(0, 14) : t;
      if (mirror){ g2.save(); g2.translate(x + 32, 53.5); g2.scale(-1, 1); g2.fillText(tx, 0, 0); g2.restore(); }
      else g2.fillText(tx, x + 32, 53.5);
    }
  };
  drawAds(g, false);
  g.fillStyle = "#151515"; g.fillRect(0, 58, W, 2);
  const quad = (x0,x1,y0,y1,col) => { const a=P(x0,y0),b=P(x1,y0),c2=P(x1,y1),d=P(x0,y1); g.fillStyle=col; g.beginPath(); g.moveTo(a[0],a[1]); g.lineTo(b[0],b[1]); g.lineTo(c2[0],c2[1]); g.lineTo(d[0],d[1]); g.closePath(); g.fill(); };
  g.fillStyle = "#3d8a2c"; g.fillRect(0, 59, W, H-59);
  for (let x = 30, k = 0; x < GX; x += 5.25, k++) quad(x, Math.min(x+5.25, GX), -1, 70, k % 2 ? "#3d8a2c" : "#46992f");
  quad(GX, 130, -1, 70, "#357a27");
  g.strokeStyle = "rgba(255,255,255,.9)"; g.lineWidth = 1;
  const L = (x1,y1,x2,y2) => { const a = P(x1,y1), b = P(x2,y2); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); };
  L(30,0,GX,0); L(30,64,GX,64); L(GX,0,GX,64);
  L(88.5,11.85,GX,11.85); L(88.5,52.15,GX,52.15); L(88.5,11.85,88.5,52.15);
  L(99.5,22.85,GX,22.85); L(99.5,41.15,GX,41.15); L(99.5,22.85,99.5,41.15);
  L(52.5,0,52.5,64);
  const arc = (cxw, cyw, r, a0, a1) => { g.beginPath(); for (let i = 0; i <= 32; i++){ const a = a0 + (a1-a0)*i/32; const p = P(cxw + Math.cos(a)*r, cyw + Math.sin(a)*r); i ? g.lineTo(p[0],p[1]) : g.moveTo(p[0],p[1]); } g.stroke(); };
  arc(52.5, 32, 9.15, 0, Math.PI*2);
  const t = Math.acos(5.5/9.15); arc(94, 32, 9.15, Math.PI - t, Math.PI + t);
  arc(GX, 0, 1, Math.PI/2, Math.PI); arc(GX, 64, 1, Math.PI, Math.PI*1.5);
  const sp = P(94,32); g.fillStyle = "#fff"; g.fillRect(Math.round(sp[0]), Math.round(sp[1]), 2, 1);
  // Eckfahnen
  for (const y of [0, 64]){ const p = P(GX, y), q = P(GX, y, 1.6); g.fillStyle = "#e8e8e8"; g.fillRect(Math.round(p[0]), Math.round(q[1]), 1, Math.round(p[1]-q[1])); g.fillStyle = "#ffd23a"; g.fillRect(Math.round(p[0]) + 1, Math.round(q[1]), 4, 3); }
  const gl = bgL.getContext("2d"); gl.clearRect(0, 0, W, H); gl.drawImage(bg, 0, 0); drawAds(gl, true);
}

function line3(a, b){ const p = P(...a), q = P(...b); cx.beginPath(); cx.moveTo(p[0], p[1]); cx.lineTo(q[0], q[1]); cx.stroke(); }
function drawGoalBack(ripple){
  const D = 1.9, rb = ripple;
  cx.strokeStyle = "rgba(235,235,240,.5)"; cx.lineWidth = 1;
  for (let i = 0; i <= 8; i++){ const y = GY0 + (GY1-GY0)*i/8; const b = rb * Math.sin(Math.PI*i/8); line3([GX+D+b, y, 0], [GX+D+b*0.8, y, GH*0.9]); }
  for (let k = 0; k <= 4; k++){ const z = GH*0.9*k/4; line3([GX+D+rb*0.3, GY0, z], [GX+D+rb*0.3, GY1, z]); }
  for (let k = 1; k <= 3; k++){ const x = GX + D*k/4; line3([x, GY0, GH - (GH*0.1)*k/4], [x, GY1, GH - (GH*0.1)*k/4]); line3([x, GY0, 0], [x, GY0, GH]); }
  line3([GX, GY0, GH], [GX+D, GY0, GH*0.9]); line3([GX, GY1, GH], [GX+D, GY1, GH*0.9]);
  line3([GX, GY0, 0], [GX+D, GY0, 0]); line3([GX, GY1, 0], [GX+D, GY1, 0]);
}
function drawGoalFront(){
  cx.strokeStyle = "#ffffff"; cx.lineWidth = 2;
  line3([GX, GY0, 0], [GX, GY0, GH]); line3([GX, GY1, 0], [GX, GY1, GH]); line3([GX, GY0, GH], [GX, GY1, GH]);
}
function drawPlayer(p){
  const [sx, sy, s] = P(p.x, p.y, 0);
  const X = Math.round(sx), Y = Math.round(sy);
  const h = Math.round(15 * s), w = Math.max(4, Math.round(6 * s));
  cx.fillStyle = "rgba(0,0,0,.3)"; cx.fillRect(X - w/2 - 1, Y, w + 3, 2);
  const lift = Math.round((p.z || 0) * 6.5 * s);
  const Yb = Y - lift;
  if (p.dive){
    const [, dy] = P(p.x, p.y, p.diveZ || 0);
    const Yd = Math.round(dy), len = Math.round(h * 0.85), th = Math.max(3, Math.round(w * 0.7)), dir = p.diveDir || 1;
    const x0 = X - len/2;
    cx.fillStyle = p.kit.shirt; cx.fillRect(x0, Yd - th, len, th);
    cx.fillStyle = p.kit.shorts; cx.fillRect(dir > 0 ? x0 - 2 : x0 + len - 2, Yd - th, 4, th);
    cx.fillStyle = SKIN; cx.fillRect(dir > 0 ? x0 + len : x0 - 3, Yd - th, 3, th);
    cx.fillRect(dir > 0 ? x0 + len + 1 : x0 - 5, Yd - th - 2, 2, 2);
    return;
  }
  if (p.bike){
    // Fallrückzieher: Körper waagerecht, Kopf Richtung Tor, Beine schwingen nach oben
    const len = Math.round(h * 0.42), th = Math.max(3, Math.round(w * 0.65)), hd = Math.max(3, Math.round(h * 0.2));
    const xs = X - Math.round(len / 2);
    cx.fillStyle = p.kit.shorts; cx.fillRect(xs - 3, Yb - th, 4, th);
    cx.fillStyle = p.kit.shirt; cx.fillRect(xs + 1, Yb - th, len, th);
    cx.fillStyle = SKIN; cx.fillRect(xs + 1 + len, Yb - th, hd, hd);
    cx.fillStyle = HAIR; cx.fillRect(xs + 1 + len + hd - 1, Yb - th, 1, hd);
    const swing = p.bikeU || 0, legLen = Math.round(h * 0.45);
    for (let k = 0; k < legLen; k++){
      const ang = Math.PI * (0.55 + 0.35 * swing);
      const lx = xs - 2 + Math.round(Math.cos(ang) * -k * 0.6 + k * 0.5 * swing), ly = Yb - th - Math.round(Math.sin(ang) * k);
      cx.fillStyle = k > legLen * 0.6 ? p.kit.shirt : SKIN; cx.fillRect(lx, ly, 2, 1);
      cx.fillRect(lx - 2, ly + 1, 1, 1);
    }
    return;
  }
  const leg = Math.round(h * 0.34), sh = Math.max(2, Math.round(h * 0.17)), shirt = Math.round(h * 0.32), hd = Math.max(3, Math.round(h * 0.2));
  const ph = p.moving && !lift ? Math.round(Math.sin(p.phase) * w * 0.35) : 0;
  const lw = s > 0.86 ? 2 : 1;
  const lx = X - Math.round(w/4) - Math.round(lw/2), rx = X + Math.round(w/4) - Math.round(lw/2);
  cx.fillStyle = SKIN; cx.fillRect(lx + ph, Yb - leg, lw, Math.ceil(leg/2)); cx.fillRect(rx - ph, Yb - leg, lw, Math.ceil(leg/2));
  cx.fillStyle = p.kit.shirt; cx.fillRect(lx + ph, Yb - Math.floor(leg/2), lw, Math.floor(leg/2)); cx.fillRect(rx - ph, Yb - Math.floor(leg/2), lw, Math.floor(leg/2));
  const top = Yb - leg - sh - shirt;
  cx.fillStyle = p.kit.shorts; cx.fillRect(X - Math.floor(w/2), Yb - leg - sh, w, sh);
  cx.fillStyle = p.kit.shirt; cx.fillRect(X - Math.floor(w/2), top, w, shirt);
  cx.fillStyle = SKIN; const arm = (p.cheer || lift) ? -3 : 1;
  cx.fillRect(X - Math.floor(w/2) - 1, top + arm, 1, Math.round(shirt*0.8)); cx.fillRect(X + Math.ceil(w/2), top + arm, 1, Math.round(shirt*0.8));
  cx.fillRect(X - Math.floor(hd/2), top - hd, hd, hd);
  cx.fillStyle = HAIR; cx.fillRect(X - Math.floor(hd/2), top - hd, hd, Math.max(1, Math.round(hd/3)));
}
function drawBall(b){
  const sh = P(b.x, b.y, 0), p = P(b.x, b.y, b.z);
  cx.fillStyle = "rgba(0,0,0,.35)"; cx.fillRect(Math.round(sh[0]) - 1, Math.round(sh[1]), 3, 1);
  const X = Math.round(p[0]) - 1, Y = Math.round(p[1]) - 3;
  cx.fillStyle = "#fff"; cx.fillRect(X, Y, 3, 3);
  cx.fillStyle = "#222"; cx.fillRect(X + 1, Y + 1, 1, 1);
}
function drawCrowd(cheer, t){
  const j = cheer ? (Math.floor(t * 8) % 2 ? -2 : 0) : 0;
  cx.fillStyle = "#231c2a"; cx.fillRect(0, 0, W, 48);
  cx.drawImage(crowd, 0, j, W, 48, 0, 0, W, 48);
}
function caption(txt, big){
  if (txt){
    outx.fillStyle = "rgba(10,12,40,.82)"; outx.fillRect(0, H - 15, W, 15);
    outx.font = "8px Silkscreen, monospace"; outx.textAlign = "center"; outx.textBaseline = "middle";
    outx.fillStyle = "#e8ecff"; outx.fillText(txt, W/2, H - 7.5, W - 8);
  }
  if (big){
    outx.font = "700 22px Silkscreen, monospace"; outx.textAlign = "center"; outx.textBaseline = "middle";
    outx.fillStyle = "#3b0000"; outx.fillText(big.t, W/2 + 2, 28, W - 10);
    outx.fillStyle = big.c; outx.fillText(big.t, W/2, 26, W - 10);
  }
}
function blit(){
  outx.save(); outx.setTransform(1, 0, 0, 1, 0, 0);
  if (DIR < 0){ outx.translate(W, 0); outx.scale(-1, 1); }
  outx.drawImage(wc, 0, 0); outx.restore();
}
function drawIdle(big){
  cx.drawImage(curBg(), 0, 0); drawCrowd(false, 0); drawGoalBack(0);
  if (M && M.kits){
    const [hk, ak] = M.kits;
    const ps = [
      {x:84,y:20,kit:ak},{x:86,y:33,kit:ak},{x:85,y:46,kit:ak},{x:76,y:27,kit:ak},
      {x:72,y:38,kit:hk},{x:79,y:14,kit:hk},{x:66,y:30,kit:hk},{x:80,y:52,kit:hk},
      {x:104.2,y:32,kit:KEEPER}
    ].sort((a,b) => a.y - b.y);
    ps.forEach(drawPlayer);
    if (!big) drawBall({x:68,y:31,z:0});
  }
  drawGoalFront();
  blit();
  if (big) caption(null, {t:big, c:"#ffd23a"});
}

/* Szenen-Skripte: Ballkontakte [t, x, y, z, Spieler] */
function script(type){
  switch (type){
    case "konter": return {
      intro: n => `Konter! ${n} zieht davon ...`,
      touches:[[0,58,30,0,0],[0.5,65,29.5,0,0],[1.0,72,29,0,0],[1.5,79,28,0,0],[2.0,86,27,0,0]],
      runs:{1:[[0,56,42],[2.4,90,40]], 2:[[0,60,18],[2.4,84,16]]},
      defs:[[74,24],[78,34],[72,44],[86,30]], dsp:8};
    case "flanke": return {
      intro: n => `Flanke von außen ... ${n} steigt hoch!`,
      touches:[[0,70,7,0,1],[0.6,78,6,0,1],[1.2,86,5,0,1],[2.1,97,31,1.9,0]],
      arcs:{2:3.2},
      runs:{0:[[0,82,26],[1.4,90,30],[2.1,97,31]], 2:[[0,80,40],[2.2,95,38]]},
      defs:[[92,26],[93,36],[88,44],[80,10]], dsp:7, header:true};
    case "ecke": return {
      intro: n => `Ecke! ${n} lauert im Strafraum ...`,
      touches:[[0.5,104.4,0.9,0,1],[1.6,98,31,2.0,0]],
      arcs:{0:3.4},
      ballStart:[104.4,0.9,0],
      runs:{1:[[0,102.6,-0.4],[0.5,104,0.6],[1.2,103,4]], 0:[[0,92,36],[0.9,94,34],[1.6,98,31]], 2:[[0,93,26],[1.6,96,36]]},
      defs:[[97,29],[96,35],[93,32],[100,38]], dsp:5, header:true};
    case "fallrueckzieher": return {
      intro: n => `Flanke ... ${n} versucht es artistisch!`,
      touches:[[0,74,6,0,1],[0.7,82,5,0,1],[1.65,95,32,2.0,0]],
      arcs:{1:3.4},
      runs:{0:[[0,86,30],[1.1,93,31],[1.65,95.4,32]], 2:[[0,80,42],[1.8,94,42]]},
      defs:[[93,28],[94,37],[89,42],[84,12]], dsp:6, bike:true};
    case "fernschuss": return {
      intro: n => `${n} fasst sich ein Herz – aus der Distanz!`,
      touches:[[0,66,46,0,1],[0.7,72,42,0,1],[1.4,78,34,0,0],[1.9,80,33,0,0]],
      runs:{0:[[0,72,30],[1.4,78,34]], 2:[[0,74,18],[2.2,88,20]]},
      defs:[[88,30],[89,38],[86,22],[84,46]], dsp:5};
    case "doppelpass": return {
      intro: n => `Doppelpass ... ${n} ist durch!`,
      touches:[[0,70,24,0,0],[0.6,75,24,0,0],[1.2,82,38,0,1],[1.85,91,31,0,0]],
      runs:{0:[[0.6,75,24],[1.85,91,31]], 1:[[0,74,40],[1.2,82,38],[2.2,88,40]], 2:[[0,72,50],[2.2,86,50]]},
      defs:[[84,26],[86,34],[83,44],[90,30]], dsp:8};
    case "dribbling": return {
      intro: n => `${n} tanzt seine Gegenspieler aus!`,
      touches:[[0,70,44,0,0],[0.5,75,41,0,0],[1.0,80,44,0,0],[1.5,85,40,0,0],[2.0,90,37,0,0]],
      runs:{1:[[0,72,24],[2.2,90,26]], 2:[[0,66,32],[2.2,80,32]]},
      defs:[[78,42],[84,43],[88,36],[82,30]], dsp:5};
    case "elfmeter": return {
      intro: n => `Foul im Strafraum – Elfmeter! ${n} tritt an ...`,
      touches:[[2.4,94,32,0,0]],
      runs:{0:[[0,89,29],[1.1,89,29],[2.4,93.6,31.7]], 1:[[0,87.5,20],[2.8,87.5,20]], 2:[[0,87.5,44],[2.8,87.5,44]]},
      defs:[[87,16],[87.5,26],[87.5,38],[87,48]], dsp:0, hold:true, pen:true, ballStart:[94,32,0]};
    case "freistoss": return {
      intro: n => `Freistoß! ${n} gegen die Mauer ...`,
      touches:[[2.1,84,25,0,0]],
      ballStart:[84,25,0],
      runs:{0:[[0,80.5,22],[1.1,80.5,22],[2.1,83.6,24.7]], 1:[[0,95,38],[2.6,98,36]], 2:[[0,94,45],[2.6,97,43]]},
      defs:[[93.4,27.2],[93.4,28.2],[93.4,29.2],[93.4,30.2],[96,40]], dsp:0, hold:true, wall:4, fk:true, shotArc:2.0, shotDur:0.95};
  }
}

function makeScene(ev, attKit, defKit, club){
  const sc = script(ev.type);
  const flip = ev.type !== "elfmeter" && Math.random() < 0.5;
  const F = y => flip ? 64 - y : y;
  const name = ev.player.name;
  const out = ev.outcome, v = ev.variant;
  const own = v === "eigentor", reb = v === "abpraller", fumble = v === "patzer";
  const touches = sc.touches.map(([t,x,y,z,w]) => ({t, x, y:F(y), z, w}));
  const last = touches[touches.length - 1];

  const side = Math.random() < 0.5 ? -1 : 1;
  let gy = 32 + side * rnd(1.8, 3.3), gz = rnd(0.3, 1.7), after = [], target, kReach;
  if ((sc.header || sc.bike) && out !== "vorbei") gz = rnd(0.2, 1.1);
  if (reb){                       // erster Schuss wird abgewehrt, der Abpraller landet beim Mitspieler
    target = [GX - 0.6, gy, gz]; kReach = 1;
  } else if (fumble){             // harmloser Schuss, der Torwart lässt ihn durchrutschen
    gy = 32 + side * rnd(0.3, 1.1); gz = 0.35; target = [GX - 0.7, gy, gz]; kReach = 1;
    after = [[0.55, GX + 0.5, gy + side * 0.2, 0.12, 0.04], [0.35, GX + 1.5, gy + side * 0.3, 0, 0.04]];
  } else if (out === "tor" || out === "abseits"){
    target = [GX + 0.3, gy, gz]; after = [[0.2, GX+1.7, gy, Math.max(0.3, gz*0.5), 0], [0.6, GX+1.4, gy, 0, 0.15]];
    kReach = Math.random() < 0.3 ? -0.6 : 0.55;
  } else if (out === "parade"){ target = [GX - 0.6, gy, gz]; after = [[0.6, 99, gy + side*7, 0, 1.6]]; kReach = 1; }
  else if (out === "pfosten"){ gy = side < 0 ? GY0 : GY1; gz = rnd(0.6, 1.8); target = [GX, gy, gz]; after = [[0.6, 98, gy - side*5, 0, 1.0]]; kReach = 0.7; }
  else if (out === "latte"){ gy = 32 + side * rnd(0, 2.6); gz = GH; target = [GX - 0.05, gy, GH]; after = [[0.45, GX - 4, gy - side * 1.5, 0, 1.3], [0.5, 96, gy - side * 4, 0, 0.2]]; kReach = 0.6; }
  else if (Math.random() < 0.5){ gy = 32 + side * rnd(4.8, 6.5); target = [GX + 2, gy, rnd(0.3,1.2)]; after = [[0.4, GX + 5, gy + side, 0, 0.2]]; kReach = 0.45; }
  else { gy = 32 + side * rnd(0, 2.5); target = [GX + 2.5, gy, rnd(3.3, 4.2)]; after = [[0.4, GX + 6, gy, 0, 0.4]]; kReach = 0.45; }

  const segs = [];
  if (sc.ballStart){ const b = sc.ballStart; segs.push({t0:0, t1:touches[0].t, a:[b[0], F(b[1]), b[2]], b:[touches[0].x, touches[0].y, touches[0].z], arc:0}); }
  for (let i = 0; i < touches.length - 1; i++){
    const A = touches[i], B = touches[i+1];
    const arc = sc.arcs && sc.arcs[i] !== undefined ? sc.arcs[i] : (A.w === B.w ? 0.15 : 0.5);
    segs.push({t0:A.t, t1:B.t, a:[A.x, A.y, A.z], b:[B.x, B.y, B.z], arc});
  }
  const quick = sc.header || sc.bike;
  const dist = Math.hypot(target[0] - last.x, target[1] - last.y);
  const shotDur = fumble ? 0.75 : sc.shotDur || (quick ? 0.45 : Math.max(0.35, Math.min(0.85, dist / 32)));
  const tShot = last.t + 0.08;
  segs.push({t0:last.t, t1:tShot, a:[last.x,last.y,last.z], b:[last.x,last.y,last.z], arc:0});
  const tHit = tShot + shotDur;
  segs.push({t0:tShot, t1:tHit, a:[last.x, last.y, last.z], b:target, arc: sc.shotArc ?? (target[2] > 3 ? 0.6 : quick ? 0.1 : fumble ? 0.05 : 0.25)});
  let tp = tHit, prev = target, tGoal = tHit, tShot2 = null, R = null;
  if (reb){
    R = [97.5, 32 - side * rnd(4, 5.5), 0];
    segs.push({t0:tHit, t1:tHit + 0.5, a:target, b:R, arc:0.9});
    tShot2 = tHit + 0.62;
    segs.push({t0:tHit + 0.5, t1:tShot2, a:R, b:R, arc:0});
    const g2 = [GX + 0.3, 32 + side * rnd(1.5, 3), rnd(0.3, 1)];
    segs.push({t0:tShot2, t1:tShot2 + 0.3, a:R, b:g2, arc:0.1});
    tGoal = tShot2 + 0.3; tp = tGoal; prev = g2;
    after = [[0.2, GX + 1.7, g2[1], 0.3, 0], [0.6, GX + 1.4, g2[1], 0, 0.15]];
  } else if (fumble) tGoal = tHit + 0.55;
  for (const [dt, x, y, z, arc] of after){ segs.push({t0:tp, t1:tp+dt, a:prev, b:[x,y,z], arc}); tp += dt; prev = [x,y,z]; }

  const atts = [];
  for (let i = 0; i < 3; i++){
    let wps = touches.filter(tc => tc.w === i).map(tc => [tc.t, tc.x, tc.y]);
    if (sc.runs[i]) sc.runs[i].forEach(([t,x,y]) => wps.push([t, x, F(y)]));
    wps.sort((a,b) => a[0] - b[0]);
    if (!wps.length) wps.push([0, 70, F(20 + i*10)]);
    if (own && i === last.w) wps = wps.map(([t, x, y]) => t >= last.t - 0.6 ? [t, x - 1.6, y + 2.2] : [t, x, y]);
    const shooter = reb ? i === (last.w === 1 ? 2 : 1) : i === last.w;
    if (reb && shooter){ wps = wps.filter(w => w[0] < tHit - 0.4); wps.push([tHit - 0.2, R[0] - 3, R[1]], [tShot2, R[0] - 0.4, R[1]]); }
    const a = {wps, kit:attKit, x:wps[0][1], y:wps[0][2], phase:rnd(0,6), shooter};
    if (i === last.w && sc.header && !own) a.jump = {t:last.t, h:1.0};
    if (i === last.w && sc.bike) a.bikeAt = last.t;
    atts.push(a);
  }
  const defs = sc.defs.map(([x,y], i) => ({x, y:F(y), kit:defKit, off:[-4,0,4,-1.5][i] * (flip?-1:1), lag:rnd(1,4), sp:sc.dsp * rnd(0.85,1.1), phase:rnd(0,6)}));
  if (sc.header || sc.bike){ const d = defs[0]; d.jump = {t:last.t + 0.05, h:own ? 0.95 : 0.7}; }
  if (own){ const d = defs[0]; d.fixed = [[0, d.x, d.y], [last.t, last.x + 0.3, last.y + 0.2]]; }
  if (sc.wall) defs.slice(0, sc.wall).forEach((d, i) => d.jump = {t:last.t + 0.28 + i * 0.02, h:0.55});
  const keeper = {x:GX - 0.8, y:32, kit:KEEPER, phase:0};
  const celebrate = [97, flip ? 58 : 6];

  const intro = reb ? sc.intro("Der Stürmer") : own ? `Flanke von ${club.short} – gefährlich!` : sc.intro(name);
  const mid = reb ? "Abgewehrt ... der Abpraller!" : fumble ? "Den hat er sicher ... oder?" : null;
  const how = sc.bike ? " per Fallrückzieher" : sc.header ? " per Kopf" : sc.fk ? " per direktem Freistoß" : sc.pen ? " vom Punkt" : "";
  let outText, outCap;
  if (out === "tor"){
    outText = own ? {t:"EIGENTOR!", c:"#ff8a5a"} : fumble ? {t:"PATZER!", c:"#ffd23a"} : {t: sc.bike ? "TRAUMTOR!" : "TOR!", c:"#ffd23a"};
    outCap = own ? `${name} lenkt den Ball ins eigene Tor!` : reb ? `${name} staubt ab – Tor für ${club.short}!` : fumble ? `Der Ball rutscht durch – ${name} jubelt!` : `${name} trifft${how} für ${club.short}!`;
  } else if (out === "abseits"){ outText = {t:"ABSEITS!", c:"#ff8a5a"}; outCap = "Die Fahne ist oben – kein Tor!"; }
  else if (out === "parade"){ outText = {t:"GEHALTEN!", c:"#9fd8ff"}; outCap = sc.pen ? "Elfmeter gehalten!" : "Glanzparade des Torwarts!"; }
  else if (out === "pfosten"){ outText = {t:"PFOSTEN!", c:"#ff8a5a"}; outCap = `${name} trifft nur das Aluminium!`; }
  else if (out === "latte"){ outText = {t:"LATTE!", c:"#ff8a5a"}; outCap = `Lattenkracher von ${name}!`; }
  else { outText = {t: target[2] > 3 ? "DRÜBER!" : "VORBEI!", c:"#e8ecff"}; outCap = "Das war knapp ..."; }

  const reveal = out === "tor" || out === "abseits" ? tGoal : tHit;
  const cues = [{t:tShot, f:() => SFX.kick()}];
  if (tShot2) cues.push({t:tHit, f:() => SFX.thud()}, {t:tShot2, f:() => SFX.kick()});
  if (fumble) cues.push({t:tHit, f:() => SFX.thud()});
  if (out === "pfosten" || out === "latte") cues.push({t:tHit, f:() => SFX.post()});
  cues.push({t:reveal, f:() => out === "tor" ? SFX.goal(own) : out === "abseits" ? (SFX.ooh(), SFX.whistle(1)) : SFX.ooh(), reveal:true});
  return {segs, atts, defs, keeper, tShot, tHit, tGoal, reveal, end: tp + 1.6, out, gy, gz, kReach, celebrate, intro, mid, outText, outCap,
    hold: !!sc.hold, net: out === "tor" || out === "abseits", cheer: out === "tor", cues};
}

function ballAt(sc, t){
  let seg = sc.segs[sc.segs.length - 1];
  for (const s of sc.segs){ if (t <= s.t1){ seg = s; break; } }
  const u = seg.t1 > seg.t0 ? clamp((t - seg.t0) / (seg.t1 - seg.t0), 0, 1) : 1;
  return {
    x: seg.a[0] + (seg.b[0]-seg.a[0])*u,
    y: seg.a[1] + (seg.b[1]-seg.a[1])*u,
    z: Math.max(0, seg.a[2] + (seg.b[2]-seg.a[2])*u + seg.arc*4*u*(1-u))
  };
}
function interp(wps, t){
  if (t <= wps[0][0]) return [wps[0][1], wps[0][2]];
  for (let i = 0; i < wps.length - 1; i++){
    const a = wps[i], b = wps[i+1];
    if (t <= b[0]){ const u = (t - a[0]) / (b[0] - a[0] || 1); return [a[1] + (b[1]-a[1])*u, a[2] + (b[2]-a[2])*u]; }
  }
  const l = wps[wps.length - 1]; return [Math.min(100, l[1] + (t - l[0]) * 1.5), l[2]];
}
function jumpZ(j, t){ if (!j) return 0; const u = (t - (j.t - 0.32)) / 0.64; return u > 0 && u < 1 ? j.h * Math.sin(Math.PI * u) : 0; }
function updateScene(sc, t, dt){
  const ball = ballAt(sc, t);
  sc.ball = ball;
  const scored = sc.cheer && t > sc.tGoal;
  for (const a of sc.atts){
    let [x, y] = interp(a.wps, t);
    if (a.shooter && t > sc.tGoal + 0.3 && scored){
      const k = Math.min(1, (t - sc.tGoal - 0.3) / 1.4);
      const s0 = interp(a.wps, sc.tGoal);
      x = s0[0] + (sc.celebrate[0] - s0[0]) * k * 0.6; y = s0[1] + (sc.celebrate[1] - s0[1]) * k * 0.6;
      a.cheer = true;
    }
    a.z = jumpZ(a.jump, t);
    if (a.bikeAt !== undefined){
      const u = (t - (a.bikeAt - 0.28)) / 0.85;
      a.bike = u > 0 && u < 1;
      a.bikeU = clamp(u * 1.6, 0, 1);
      a.z = a.bike ? 1.35 * Math.sin(Math.PI * Math.min(1, u * 1.1)) : 0;
    }
    a.moving = Math.hypot(x - a.x, y - a.y) > 0.01;
    if (a.moving) a.phase += dt * 18;
    a.x = x; a.y = y;
  }
  for (const d of sc.defs){
    d.z = jumpZ(d.jump, t);
    if (d.fixed){ const [x, y] = interp(d.fixed, t); d.moving = Math.hypot(x - d.x, y - d.y) > 0.01; if (d.moving) d.phase += dt * 16; d.x = x; d.y = y; continue; }
    if (sc.hold){ d.moving = false; continue; }
    const tx = Math.min(102, ball.x + 3 + d.lag), ty = ball.y + d.off;
    const dx = tx - d.x, dy = ty - d.y, dd = Math.hypot(dx, dy), step = d.sp * dt;
    if (dd > 0.3){ const k = Math.min(1, step / dd); d.x += dx*k; d.y += dy*k; d.moving = true; d.phase += dt*16; } else d.moving = false;
  }
  const k = sc.keeper;
  if (t < sc.tShot){
    const ty = clamp(ball.y, 29.8, 34.2);
    k.y += (ty - k.y) * Math.min(1, dt * 3); k.dive = false; k.moving = Math.abs(ty - k.y) > 0.05; if (k.moving) k.phase += dt*14;
    k.y0 = k.y;
  } else {
    const u = clamp((t - sc.tShot) / ((sc.tHit - sc.tShot) * 0.9), 0, 1);
    const e = 1 - Math.pow(1 - u, 3);
    const want = sc.kReach >= 0 ? k.y0 + (sc.gy - k.y0) * sc.kReach : k.y0 - (sc.gy - k.y0) * 0.5;
    k.y = k.y0 + (want - k.y0) * e;
    k.dive = Math.abs(want - k.y0) > 0.9 && u > 0.12;
    k.diveDir = want > k.y0 ? 1 : -1;
    k.diveZ = Math.min(1.4, sc.gz * 0.6) * Math.sin(Math.min(1, u) * Math.PI * 0.85);
    k.moving = false;
  }
  const inNet = sc.net && t > sc.tGoal;
  sc.ripple = inNet ? Math.max(0, 1.2 * (1 - (t - sc.tGoal) / 0.9)) * (0.5 + 0.5*Math.sin((t - sc.tGoal) * 30)) : 0;
}
function renderScene(sc, t){
  const scored = sc.cheer && t > sc.tGoal + 0.1;
  cx.drawImage(curBg(), 0, 0);
  drawCrowd(scored, t);
  drawGoalBack(sc.ripple || 0);
  const ents = [...sc.atts, ...sc.defs, sc.keeper].map(p => ({p, y:p.y}));
  ents.push({ball:true, y:sc.ball.y + 0.01});
  ents.sort((a, b) => a.y - b.y);
  for (const e of ents){ if (e.ball) drawBall(sc.ball); else drawPlayer(e.p); }
  drawGoalFront();
  if (sc.ball.x > GX && sc.ball.y > GY0 && sc.ball.y < GY1 && sc.ball.z < GH) drawBall(sc.ball);
  blit();
  if (t > sc.reveal + 0.05){
    const blink = sc.out !== "tor" || Math.floor(t * 4) % 2 === 0 || matchMedia("(prefers-reduced-motion: reduce)").matches;
    caption(sc.outCap, blink ? sc.outText : null);
  } else caption(sc.mid && t > sc.tHit ? sc.mid : sc.intro, null);
}
function playScene(ev, attKit, defKit, club){
  return new Promise(res => {
    const sc = makeScene(ev, attKit, defKit, club);
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const start = performance.now() - (reduce ? (sc.end - 1.4) * 1000 : 0);
    let lastT = 0, skip = false;
    cv.onclick = () => { skip = true; };
    if (reduce){ for (let t = 0; t < sc.end - 1.4; t += 1/30) updateScene(sc, t, 1/30); lastT = sc.end - 1.4; sc.cues.forEach(c => c.done = !c.reveal); }
    function frame(now){
      const t = (now - start) / 1000;
      for (const c of sc.cues) if (!c.done && t >= c.t){ c.done = true; if (!skip) c.f(); }
      if (skip || t > sc.end){ cv.onclick = null; if (skip) sc.cues.forEach(c => { if (!c.done && c.reveal) c.f(); }); res(); return; }
      const dt = Math.min(0.05, Math.max(0, t - lastT)); lastT = t;
      updateScene(sc, t, dt);
      renderScene(sc, t);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  });
}
