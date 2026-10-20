// SON EL — WebAudio ses efektleri (dosya gerektirmez)
const SFX = (() => {
  let ctx = null, on = true, hbTimer = null;
  function ac() {
    if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function tone(freq, dur = 0.12, type = 'sine', vol = 0.12, slide = 0, delay = 0) {
    if (!on) return; const a = ac(); if (!a) return;
    const t = a.currentTime + delay;
    const o = a.createOscillator(), g = a.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq * slide), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(a.destination);
    o.start(t); o.stop(t + dur + 0.02);
  }
  function noise(dur = 0.15, vol = 0.08, freq = 800, type = 'highpass', delay = 0, decay = 1) {
    if (!on) return; const a = ac(); if (!a) return;
    const len = Math.max(1, Math.floor(a.sampleRate * dur));
    const buf = a.createBuffer(1, len, a.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    const s = a.createBufferSource(); s.buffer = buf;
    const f = a.createBiquadFilter(); f.type = type; f.frequency.value = freq;
    const g = a.createGain(); g.gain.value = vol;
    s.connect(f).connect(g).connect(a.destination); s.start(a.currentTime + delay);
  }
  return {
    get on() { return on; }, set on(v) { on = v; if (!v) this.heartStop(); },
    card() { noise(0.06, 0.12, 2500, 'highpass', 0, 2); },
    flip() { noise(0.09, 0.1, 1800, 'bandpass', 0, 1.5); },
    chip() { tone(1800, 0.05, 'square', 0.03); tone(2400, 0.06, 'triangle', 0.04, 0, 0.03); },
    win() { [392, 494, 587].forEach((f, i) => tone(f, 0.25, 'triangle', 0.08, 0, i * 0.09)); },
    lose() { [220, 185, 147].forEach((f, i) => tone(f, 0.35, 'sawtooth', 0.04, 0, i * 0.13)); },
    push() { tone(330, 0.2, 'triangle', 0.06); },
    slide() { noise(0.5, 0.05, 400, 'lowpass', 0, 0.6); },
    cock() { noise(0.04, 0.35, 3000, 'highpass', 0, 3); noise(0.05, 0.3, 1500, 'bandpass', 0.09, 3); },
    spin(n = 18) { for (let i = 0; i < n; i++) noise(0.02, 0.18, 4000, 'highpass', i * (0.035 + i * 0.004), 4); },
    click() { noise(0.03, 0.6, 2500, 'highpass', 0, 5); tone(900, 0.04, 'square', 0.05); },
    bang() {
      noise(0.9, 1.2, 1200, 'lowpass', 0, 2.5);
      noise(0.15, 0.9, 3000, 'highpass', 0, 4);
      tone(70, 0.6, 'sine', 0.6, 0.4);
      noise(2.5, 0.08, 6000, 'highpass', 0.15, 1); // kulak çınlaması gibi
      tone(4200, 2.2, 'sine', 0.015, 0, 0.2);
    },
    beat() { tone(55, 0.14, 'sine', 0.5, 0.6); tone(50, 0.16, 'sine', 0.4, 0.6, 0.18); },
    heartStart(bpm = 70) {
      this.heartStop();
      let cur = bpm;
      const loop = () => { this.beat(); cur = Math.min(150, cur + 6); hbTimer = setTimeout(loop, 60000 / cur); };
      loop();
    },
    heartStop() { clearTimeout(hbTimer); hbTimer = null; },
    error() { tone(140, 0.12, 'square', 0.05); },
  };
})();
