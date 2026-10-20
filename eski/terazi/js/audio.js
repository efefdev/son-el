// Küçük WebAudio sentezleyici — dosya gerektirmez
const SFX = (() => {
  let ctx = null, on = true;
  function ac() {
    if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function tone(freq, dur = 0.12, type = 'sine', vol = 0.12, slide = 0, delay = 0) {
    if (!on) return;
    const a = ac(); if (!a) return;
    const t = a.currentTime + delay;
    const o = a.createOscillator(), g = a.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq * slide), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(a.destination);
    o.start(t); o.stop(t + dur + 0.02);
  }
  function noise(dur = 0.15, vol = 0.08, hp = 800) {
    if (!on) return;
    const a = ac(); if (!a) return;
    const len = Math.floor(a.sampleRate * dur);
    const buf = a.createBuffer(1, len, a.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const s = a.createBufferSource(); s.buffer = buf;
    const f = a.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp;
    const g = a.createGain(); g.gain.value = vol;
    s.connect(f).connect(g).connect(a.destination); s.start();
  }
  let step = 0;
  return {
    get on() { return on; }, set on(v) { on = v; },
    resetPitch() { step = 0; },
    select() { tone(660, 0.06, 'triangle', 0.06); },
    deselect() { tone(440, 0.06, 'triangle', 0.05); },
    deal() { noise(0.07, 0.05, 2500); },
    chips() { tone(520 * Math.pow(1.06, step++), 0.09, 'triangle', 0.09); },
    mult() { tone(330 * Math.pow(1.05, step++), 0.12, 'square', 0.05); },
    x() { tone(392, 0.25, 'sawtooth', 0.05); tone(587, 0.25, 'sawtooth', 0.04, 0, 0.04); tone(784, 0.3, 'sine', 0.06, 0, 0.08); },
    gold() { tone(1320, 0.08, 'sine', 0.08); tone(1760, 0.12, 'sine', 0.06, 0, 0.06); },
    thud() { tone(110, 0.35, 'sine', 0.25, 0.5); noise(0.12, 0.06, 300); },
    total() { tone(523, 0.12, 'triangle', 0.1); tone(659, 0.12, 'triangle', 0.1, 0, 0.08); tone(784, 0.25, 'triangle', 0.1, 0, 0.16); },
    win() { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.3, 'triangle', 0.1, 0, i * 0.12)); },
    lose() { [392, 330, 262, 196].forEach((f, i) => tone(f, 0.35, 'sine', 0.1, 0, i * 0.15)); },
    buy() { tone(880, 0.06, 'square', 0.04); tone(1320, 0.1, 'sine', 0.07, 0, 0.05); },
    error() { tone(160, 0.15, 'square', 0.05); },
    discard() { noise(0.18, 0.06, 1200); },
    magic() { [700, 900, 1200, 1600].forEach((f, i) => tone(f, 0.15, 'sine', 0.05, 1.2, i * 0.05)); },
    break() { noise(0.3, 0.12, 3000); tone(2000, 0.2, 'square', 0.03, 0.3); },
  };
})();
