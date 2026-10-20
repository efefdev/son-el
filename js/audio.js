// SON EL — ses motoru: oda yankısı, ortam uğultusu, katmanlı silah sesi, kulak çınlaması
// Hiç ses dosyası yok; her şey WebAudio ile anında sentezlenir.
const SFX = (() => {
  let A = null, on = true;
  let master, comp, muffle, dry, wet, verb, ambGain, musicGain;
  let hbTimer = null, ambStarted = false;

  function init() {
    if (A) { if (A.state === 'suspended') A.resume(); return A; }
    try { A = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; }
    comp = A.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 4; comp.attack.value = 0.003; comp.release.value = 0.25;
    master = A.createGain(); master.gain.value = on ? 0.9 : 0;
    muffle = A.createBiquadFilter(); muffle.type = 'lowpass'; muffle.frequency.value = 20000; muffle.Q.value = 0.7;
    dry = A.createGain(); dry.gain.value = 1;
    wet = A.createGain(); wet.gain.value = 0.32;
    verb = A.createConvolver(); verb.buffer = impulse(2.6, 2.8);
    dry.connect(muffle); wet.connect(verb).connect(muffle);
    muffle.connect(comp).connect(master).connect(A.destination);
    ambGain = A.createGain(); ambGain.gain.value = 0; ambGain.connect(muffle);
    musicGain = A.createGain(); musicGain.gain.value = 0; musicGain.connect(dry); musicGain.connect(wet);
    return A;
  }
  // beton bir bodrumun yankısı: üstel sönen gürültü
  function impulse(sec, decay) {
    const len = Math.floor(A.sampleRate * sec);
    const b = A.createBuffer(2, len, A.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = b.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        const t = i / len;
        // erken yansımalar + geç kuyruk
        const early = i < A.sampleRate * 0.06 && Math.random() < 0.004 ? (Math.random() * 2 - 1) * 0.9 : 0;
        d[i] = early + (Math.random() * 2 - 1) * Math.pow(1 - t, decay) * 0.5;
      }
    }
    return b;
  }
  function out(node, verbAmt = 1) {
    const g = A.createGain(); g.gain.value = verbAmt;
    node.connect(dry); node.connect(g).connect(wet);
  }
  function noiseBuf(sec) {
    const len = Math.max(1, Math.floor(A.sampleRate * sec));
    const b = A.createBuffer(1, len, A.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }
  // zarflı gürültü vuruşu
  function hit({ t = 0, dur = 0.1, vol = 0.3, type = 'bandpass', f = 2000, q = 1, f2 = null, attack = 0.001, curve = 3, verbAmt = 1, pan = 0 }) {
    if (!A || !on) return;
    const now = A.currentTime + t;
    const s = A.createBufferSource(); s.buffer = noiseBuf(dur + 0.05);
    const fl = A.createBiquadFilter(); fl.type = type; fl.frequency.setValueAtTime(f, now); fl.Q.value = q;
    if (f2) fl.frequency.exponentialRampToValueAtTime(f2, now + dur);
    const g = A.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(vol, now + attack);
    g.gain.setTargetAtTime(0.0001, now + attack, dur / curve);
    let n = s.connect(fl).connect(g);
    if (pan && A.createStereoPanner) { const p = A.createStereoPanner(); p.pan.value = pan; n = n.connect(p); }
    out(n, verbAmt);
    s.start(now); s.stop(now + dur * 2 + 0.1);
  }
  function tone({ t = 0, f = 440, f2 = null, dur = 0.2, vol = 0.1, type = 'sine', attack = 0.005, verbAmt = 0.6, dest = null }) {
    if (!A || !on) return;
    const now = A.currentTime + t;
    const o = A.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, now);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, now + dur);
    const g = A.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(vol, now + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    o.connect(g);
    if (dest) g.connect(dest); else out(g, verbAmt);
    o.start(now); o.stop(now + dur + 0.05);
  }

  // ---- ortam: elektrik uğultusu, havalandırma, ampul vızıltısı + karanlık drone ----
  function startAmbience() {
    if (!A || ambStarted) return;
    ambStarted = true;
    // kahverengi gürültü (havalandırma)
    const len = A.sampleRate * 4, b = A.createBuffer(1, len, A.sampleRate), d = b.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3.5; }
    const room = A.createBufferSource(); room.buffer = b; room.loop = true;
    const rf = A.createBiquadFilter(); rf.type = 'lowpass'; rf.frequency.value = 320;
    const rg = A.createGain(); rg.gain.value = 0.22;
    room.connect(rf).connect(rg).connect(ambGain); room.start();
    // 50 Hz şebeke uğultusu + ampul vızıltısı
    const hum = A.createOscillator(); hum.type = 'sawtooth'; hum.frequency.value = 50;
    const hf = A.createBiquadFilter(); hf.type = 'bandpass'; hf.frequency.value = 150; hf.Q.value = 6;
    const hg = A.createGain(); hg.gain.value = 0.018;
    hum.connect(hf).connect(hg).connect(ambGain); hum.start();
    const buzz = A.createOscillator(); buzz.type = 'square'; buzz.frequency.value = 100;
    const bf = A.createBiquadFilter(); bf.type = 'highpass'; bf.frequency.value = 2400;
    const bg = A.createGain(); bg.gain.value = 0.004;
    buzz.connect(bf).connect(bg).connect(ambGain); buzz.start();
    // karanlık drone (müzik): ayrık akort, yavaş filtre salınımı
    [55, 55.4, 82.4, 110.2].forEach((f, i) => {
      const o = A.createOscillator(); o.type = i < 2 ? 'sawtooth' : 'triangle'; o.frequency.value = f;
      const fl = A.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = 220; fl.Q.value = 4;
      const lfo = A.createOscillator(); lfo.frequency.value = 0.04 + i * 0.013;
      const lg = A.createGain(); lg.gain.value = 120;
      lfo.connect(lg).connect(fl.frequency); lfo.start();
      const g = A.createGain(); g.gain.value = i < 2 ? 0.05 : 0.03;
      o.connect(fl).connect(g).connect(musicGain); o.start();
    });
    ambGain.gain.setTargetAtTime(1, A.currentTime, 2);
    musicGain.gain.setTargetAtTime(0.6, A.currentTime, 4);
    // ara sıra uzaktan damla / gıcırtı
    const drip = () => {
      if (!ambStarted) return;
      if (Math.random() < 0.6) tone({ f: 1400 + Math.random() * 900, f2: 700, dur: 0.12, vol: 0.02, verbAmt: 2.5 });
      else hit({ dur: 0.6, vol: 0.015, type: 'bandpass', f: 300, f2: 500, q: 8, attack: 0.2, verbAmt: 2 });
      setTimeout(drip, 4000 + Math.random() * 9000);
    };
    setTimeout(drip, 3000);
  }

  return {
    get on() { return on; },
    set on(v) { on = v; if (A) master.gain.setTargetAtTime(v ? 0.9 : 0, A.currentTime, 0.05); if (!v) this.heartStop(); },
    init() { init(); startAmbience(); },
    tension(level) { if (A) musicGain.gain.setTargetAtTime(0.6 + level * 0.9, A.currentTime, 1.5); },

    card() { // kartın kayması + çuhaya düşmesi
      hit({ dur: 0.08, vol: 0.25, type: 'highpass', f: 2500, verbAmt: 0.3 });
      hit({ t: 0.06, dur: 0.05, vol: 0.35, type: 'bandpass', f: 900, q: 1.5, verbAmt: 0.4 });
    },
    flip() { hit({ dur: 0.07, vol: 0.3, type: 'bandpass', f: 1600, f2: 3200, q: 2, verbAmt: 0.3 }); },
    chip() {
      for (let i = 0; i < 3; i++) tone({ t: i * 0.045, f: 3200 + Math.random() * 900, dur: 0.05, vol: 0.06, type: 'triangle', verbAmt: 0.5 });
      hit({ dur: 0.04, vol: 0.2, type: 'highpass', f: 4000 });
    },
    slide() { hit({ dur: 0.45, vol: 0.12, type: 'bandpass', f: 600, f2: 300, q: 0.8, attack: 0.05, curve: 2, verbAmt: 0.4 }); },
    gunDrop() { // tabancanın masaya bırakılması
      hit({ dur: 0.15, vol: 0.5, type: 'lowpass', f: 400 });
      tone({ f: 900, f2: 860, dur: 0.25, vol: 0.05, type: 'triangle' });
      hit({ t: 0.01, dur: 0.06, vol: 0.25, type: 'bandpass', f: 2500, q: 3 });
    },
    win() { [196, 247, 294].forEach((f, i) => tone({ t: i * 0.1, f, dur: 0.6, vol: 0.05, type: 'triangle', verbAmt: 1.5 })); },
    lose() { [147, 139, 98].forEach((f, i) => tone({ t: i * 0.16, f, dur: 0.8, vol: 0.05, type: 'sawtooth', verbAmt: 1.5 })); },
    push() { tone({ f: 220, dur: 0.5, vol: 0.05, type: 'triangle', verbAmt: 1.2 }); },
    spin() { // silindirin cırcır sesi, yavaşlayarak
      let t = 0;
      for (let i = 0; i < 26; i++) {
        hit({ t, dur: 0.018, vol: 0.4, type: 'highpass', f: 3500, verbAmt: 0.3 });
        tone({ t, f: 2600, dur: 0.012, vol: 0.03, type: 'square', verbAmt: 0.2 });
        t += 0.028 + i * i * 0.0006;
      }
      hit({ dur: t, vol: 0.08, type: 'bandpass', f: 1200, q: 2, attack: 0.02, curve: 1.5, verbAmt: 0.2 });
    },
    tick() { // silindirin tek hazne atlaması (cırcır)
      hit({ dur: 0.018, vol: 0.45, type: 'highpass', f: 3600, verbAmt: 0.3 });
      tone({ f: 2500 + Math.random() * 300, dur: 0.012, vol: 0.035, type: 'square', verbAmt: 0.2 });
    },
    cockHalf() { hit({ dur: 0.03, vol: 0.6, type: 'highpass', f: 3000, verbAmt: 0.5 }); tone({ f: 1800, dur: 0.03, vol: 0.06, type: 'square' }); },
    cockLock() { hit({ dur: 0.04, vol: 0.95, type: 'bandpass', f: 2200, q: 2, verbAmt: 0.7 }); tone({ f: 1200, dur: 0.05, vol: 0.08, type: 'square' }); hit({ dur: 0.08, vol: 0.25, type: 'lowpass', f: 400 }); },
    cock() { // horozun iki aşamalı kurulması
      hit({ dur: 0.03, vol: 0.6, type: 'highpass', f: 3000, verbAmt: 0.5 });
      tone({ f: 1800, dur: 0.03, vol: 0.06, type: 'square' });
      hit({ t: 0.11, dur: 0.04, vol: 0.9, type: 'bandpass', f: 2200, q: 2, verbAmt: 0.7 });
      tone({ t: 0.11, f: 1200, dur: 0.05, vol: 0.08, type: 'square' });
    },
    click() { // boş hazne: kuru metal vuruşu
      hit({ dur: 0.025, vol: 1.0, type: 'highpass', f: 2600, verbAmt: 1.6 });
      tone({ f: 3100, f2: 2900, dur: 0.09, vol: 0.06, type: 'triangle', verbAmt: 1.6 });
      tone({ f: 640, dur: 0.05, vol: 0.08, type: 'square', verbAmt: 1 });
    },
    bang() {
      if (!A || !on) return;
      // 1) keskin patlama
      hit({ dur: 0.05, vol: 1.6, type: 'highpass', f: 1500, attack: 0.0005, curve: 6, verbAmt: 2.2 });
      // 2) gövde
      hit({ dur: 0.5, vol: 1.4, type: 'lowpass', f: 2200, f2: 300, attack: 0.001, curve: 3, verbAmt: 2.5 });
      // 3) alt frekans darbesi
      tone({ f: 120, f2: 32, dur: 0.6, vol: 0.9, type: 'sine', verbAmt: 1 });
      tone({ f: 70, f2: 28, dur: 0.9, vol: 0.6, type: 'sine', verbAmt: 1 });
      // 4) mekanik çatırtı
      hit({ t: 0.002, dur: 0.02, vol: 0.6, type: 'bandpass', f: 4500, q: 3 });
      // 5) kulak çınlaması: dünya boğuklaşır, tiz bir ton kalır
      const now = A.currentTime;
      muffle.frequency.cancelScheduledValues(now);
      muffle.frequency.setValueAtTime(20000, now);
      muffle.frequency.exponentialRampToValueAtTime(380, now + 0.12);
      muffle.frequency.setTargetAtTime(20000, now + 2.5, 1.6);
      const ring = A.createOscillator(); ring.type = 'sine'; ring.frequency.value = 5800;
      const rg = A.createGain(); rg.gain.setValueAtTime(0.0001, now);
      rg.gain.exponentialRampToValueAtTime(0.05, now + 0.15);
      rg.gain.exponentialRampToValueAtTime(0.0001, now + 5);
      ring.connect(rg).connect(comp); ring.start(now); ring.stop(now + 5.1);
      this.heartStop();
    },
    beat() {
      hit({ dur: 0.12, vol: 0.9, type: 'lowpass', f: 90, attack: 0.01, verbAmt: 0.2 });
      hit({ t: 0.2, dur: 0.14, vol: 0.7, type: 'lowpass', f: 80, attack: 0.01, verbAmt: 0.2 });
    },
    heartStart(bpm = 70) {
      this.heartStop();
      let cur = bpm;
      const loop = () => { this.beat(); cur = Math.min(160, cur + 7); hbTimer = setTimeout(loop, 60000 / cur); };
      loop();
    },
    heartStop() { clearTimeout(hbTimer); hbTimer = null; },
    breath() { hit({ dur: 1.2, vol: 0.06, type: 'bandpass', f: 900, q: 0.6, attack: 0.4, curve: 2, verbAmt: 0.2 }); },
    thud() { // gövdenin masaya düşmesi
      hit({ dur: 0.4, vol: 1.0, type: 'lowpass', f: 180, attack: 0.005, verbAmt: 1.5 });
      hit({ t: 0.05, dur: 0.2, vol: 0.3, type: 'bandpass', f: 700, q: 1, verbAmt: 1.2 });
    },
    flicker() { for (let i = 0; i < 4; i++) hit({ t: i * 0.07, dur: 0.03, vol: 0.12, type: 'bandpass', f: 3000 + Math.random() * 2000, q: 4 }); },
    knock() { hit({ dur: 0.06, vol: 0.7, type: 'lowpass', f: 420, attack: 0.002, verbAmt: 0.6 }); hit({ dur: 0.03, vol: 0.2, type: 'bandpass', f: 1500, q: 2 }); },
    lift() { hit({ dur: 0.2, vol: 0.15, type: 'bandpass', f: 2600, f2: 1800, q: 4, verbAmt: 0.5 }); tone({ f: 1400, f2: 1300, dur: 0.3, vol: 0.02, type: 'triangle' }); },
    shuffle() { // kartların karıştırılması (riffle)
      for (let i = 0; i < 40; i++) hit({ t: 0.2 + i * 0.022 + Math.random() * 0.01, dur: 0.02, vol: 0.25, type: 'highpass', f: 2600 + Math.random() * 1500, verbAmt: 0.3 });
      hit({ t: 1.15, dur: 0.12, vol: 0.4, type: 'bandpass', f: 900, q: 1, verbAmt: 0.5 });
    },
    drag() { // karanlıkta bir şey sürüklenir
      hit({ dur: 1.6, vol: 0.18, type: 'bandpass', f: 220, f2: 160, q: 1.5, attack: 0.3, curve: 1.3, verbAmt: 1.5 });
      for (let i = 0; i < 5; i++) hit({ t: 0.2 + i * 0.3, dur: 0.15, vol: 0.12, type: 'lowpass', f: 300, verbAmt: 1.5 });
    },
    chair() { // sandalye gıcırtısı
      hit({ dur: 0.5, vol: 0.12, type: 'bandpass', f: 700, f2: 1100, q: 12, attack: 0.05, curve: 2, verbAmt: 1 });
      hit({ t: 0.45, dur: 0.2, vol: 0.4, type: 'lowpass', f: 250, verbAmt: 1 });
    },
    // rakibin mırıltısı: sözcük sayısı kadar hece, perde rakibe göre
    mumble(pitch = 110, words = 6) {
      if (!A || !on) return;
      let t = 0;
      for (let i = 0; i < Math.min(14, words * 2); i++) {
        const dur = 0.07 + Math.random() * 0.12;
        const now = A.currentTime + t;
        const o = A.createOscillator(); o.type = 'sawtooth';
        const f0 = pitch * (0.85 + Math.random() * 0.35);
        o.frequency.setValueAtTime(f0, now); o.frequency.linearRampToValueAtTime(f0 * (0.9 + Math.random() * 0.2), now + dur);
        const f1 = A.createBiquadFilter(); f1.type = 'bandpass'; f1.frequency.value = 500 + Math.random() * 400; f1.Q.value = 5;
        const f2 = A.createBiquadFilter(); f2.type = 'bandpass'; f2.frequency.value = 1200 + Math.random() * 900; f2.Q.value = 7;
        const g = A.createGain();
        g.gain.setValueAtTime(0.0001, now); g.gain.exponentialRampToValueAtTime(0.1, now + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
        o.connect(f1).connect(g); o.connect(f2).connect(g);
        const lp = A.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1800;
        out(g.connect(lp), 0.6);
        o.start(now); o.stop(now + dur + 0.02);
        t += dur + (Math.random() < 0.25 ? 0.12 : 0.03);
      }
    },
    error() { tone({ f: 140, dur: 0.12, vol: 0.06, type: 'square' }); },
    ui() { tone({ f: 900, dur: 0.05, vol: 0.03, type: 'triangle', verbAmt: 0.3 }); },
  };
})();
