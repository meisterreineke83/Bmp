/* ---------- Sound (Web Audio, alles synthetisch) ---------- */
const SFX = (() => {
  let ctx = null, master = null, noise = null, crowd = null, crowdGain = null, base = 0.05;
  const on = () => OPTS.sound !== false;
  function ac(){
    if (!on()) return null;
    if (!ctx){
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      ctx = new C();
      master = ctx.createGain(); master.gain.value = 0.8; master.connect(ctx.destination);
      const len = ctx.sampleRate * 2, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < len; i++){ const w = Math.random() * 2 - 1; b0 = 0.997 * b0 + w * 0.03; b1 = 0.985 * b1 + w * 0.06; b2 = 0.9 * b2 + w * 0.2; d[i] = (b0 + b1 + b2) * 0.6; }
      noise = buf;
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }
  const now = () => ctx.currentTime;
  function env(g, t, peak, a, hold, r){ g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.setValueAtTime(peak, t + a + hold); g.gain.exponentialRampToValueAtTime(0.0001, t + a + hold + r); }
  function noiseSrc(){ const s = ctx.createBufferSource(); s.buffer = noise; s.loop = true; s.loopStart = Math.random(); return s; }
  function burst(freq, q, peak, a, hold, r, sweepTo){
    if (!ac()) return;
    const t = now(), s = noiseSrc(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    f.type = "bandpass"; f.frequency.setValueAtTime(freq, t); f.Q.value = q;
    if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, t + a + hold + r);
    s.connect(f); f.connect(g); g.connect(master); env(g, t, peak, a, hold, r);
    s.start(t, Math.random()); s.stop(t + a + hold + r + 0.05);
  }
  function tone(type, f0, f1, peak, a, hold, r, delay = 0){
    if (!ac()) return;
    const t = now() + delay, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + a + hold + r);
    o.connect(g); g.connect(master); env(g, t, peak, a, hold, r);
    o.start(t); o.stop(t + a + hold + r + 0.05);
  }
  /* „O-lé, o-lé“: ein paar verstimmte Stimmen durch Vokal-Filter */
  function chant(){
    if (!ac()) return;
    const notes = [[392, 0.32, "o"], [523, 0.5, "e"], [392, 0.32, "o"], [523, 0.32, "e"], [494, 0.32, "o"], [440, 0.55, "e"]];
    const F = {o:[480, 850], e:[420, 1950]};
    let t = now() + 0.9;
    const out = ctx.createGain(); out.gain.value = 0.09; out.connect(master);
    for (const [hz, dur, vow] of notes){
      for (let v = 0; v < 6; v++){
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = "sawtooth"; o.frequency.value = hz * (1 + (Math.random() - 0.5) * 0.025) / (v % 2 ? 2 : 1);
        const f1 = ctx.createBiquadFilter(), f2 = ctx.createBiquadFilter();
        f1.type = f2.type = "bandpass"; f1.Q.value = 6; f2.Q.value = 8;
        f1.frequency.value = F[vow][0]; f2.frequency.value = F[vow][1];
        o.connect(f1); o.connect(f2); f1.connect(g); f2.connect(g); g.connect(out);
        const st = t + Math.random() * 0.04;
        env(g, st, 0.5, 0.05, dur * 0.6, dur * 0.35);
        o.start(st); o.stop(st + dur + 0.1);
      }
      t += dur;
    }
  }
  return {
    unlock(){ ac(); },
    matchStart(){
      if (!ac()) return;
      this.stop();
      crowd = noiseSrc();
      const f = ctx.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = 650; f.Q.value = 0.6;
      crowdGain = ctx.createGain(); crowdGain.gain.value = 0.0001;
      crowd.connect(f); f.connect(crowdGain); crowdGain.connect(master);
      crowd.start();
      crowdGain.gain.exponentialRampToValueAtTime(base, now() + 1.2);
      this.whistle(1);
    },
    crowdLevel(k){ if (crowdGain && ac()) crowdGain.gain.linearRampToValueAtTime(base * k, now() + 0.8); },
    swell(peak, hold){
      if (!crowdGain || !ac()) return;
      const g = crowdGain.gain, t = now();
      g.cancelScheduledValues(t); g.setValueAtTime(Math.max(0.0001, g.value), t);
      g.linearRampToValueAtTime(peak, t + 0.25); g.setValueAtTime(peak, t + 0.25 + hold); g.linearRampToValueAtTime(base, t + 1.5 + hold);
    },
    matchEnd(){ if (crowdGain && ac()){ const t = now(); crowdGain.gain.cancelScheduledValues(t); crowdGain.gain.linearRampToValueAtTime(0.0001, t + 3); const c = crowd; setTimeout(() => { try { c.stop(); } catch(e){} }, 3200); crowd = crowdGain = null; } },
    stop(){ if (crowd){ try { crowd.stop(); } catch(e){} } crowd = crowdGain = null; },
    whistle(n){
      if (!ac()) return;
      for (let i = 0; i < n; i++){
        const long = i === n - 1 && n === 3, d = i * 0.42;
        tone("sine", 2950, 2900, 0.12, 0.01, long ? 0.6 : 0.2, 0.06, d);
        tone("sine", 3180, 3120, 0.06, 0.01, long ? 0.6 : 0.2, 0.06, d);
      }
    },
    kick(){ tone("sine", 140, 45, 0.5, 0.005, 0.02, 0.12); burst(1800, 1, 0.08, 0.002, 0.01, 0.05); },
    thud(){ tone("sine", 110, 60, 0.35, 0.005, 0.02, 0.1); },
    post(){ tone("triangle", 880, 860, 0.25, 0.002, 0.02, 0.7); tone("sine", 1320, 1300, 0.12, 0.002, 0.02, 0.5); },
    ooh(){ burst(900, 1.2, 0.22, 0.12, 0.25, 0.7, 380); this.swell(base * 3, 0.3); },
    roar(k = 1){ burst(700, 0.7, 0.3 * k, 0.08, 0.8 * k, 1.2, 1100); this.swell(base * (1 + 3 * k), 0.6 * k); },
    goal(own){ this.roar(own ? 0.6 : 1); if (!own) chant(); },
  };
})();
