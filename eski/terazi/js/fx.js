// TERAZİ — parçacık efektleri: kıvılcım, kor, mürekkep, duman, toz
const FX = (() => {
  const cv = document.createElement('canvas');
  cv.id = 'fxcanvas';
  document.body.appendChild(cv);
  const g = cv.getContext('2d');
  let W = 0, H = 0, dpr = 1;
  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = innerWidth; H = innerHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  addEventListener('resize', resize);

  const P = [];
  const rnd = (a, b) => a + Math.random() * (b - a);
  const speed = () => (typeof SETTINGS !== 'undefined' ? SETTINGS.speed : 1);

  function add(p) { if (P.length < 900) P.push(p); }

  // ortamda süzülen kor ve toz
  let ambientT = 0;
  function ambient(dt) {
    ambientT += dt;
    if (ambientT > 0.12) {
      ambientT = 0;
      add({ k: 'mote', x: rnd(0, W), y: H + 10, vx: rnd(-8, 8), vy: rnd(-25, -12), life: rnd(6, 11), t: 0, r: rnd(0.6, 1.8), hue: rnd(28, 42) });
    }
  }

  function burst(x, y, o = {}) {
    const n = o.count || 18;
    for (let i = 0; i < n; i++) {
      const a = rnd(0, Math.PI * 2), s = rnd(o.min || 60, o.max || 260);
      add({ k: 'spark', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - (o.lift || 60), life: rnd(0.4, 0.9) * (o.life || 1), t: 0,
            r: rnd(1, o.size || 2.6), col: o.color || [255, 190, 90], g: o.gravity ?? 220 });
    }
  }
  function embers(x, y, n = 20, spread = 40) {
    for (let i = 0; i < n; i++) {
      add({ k: 'ember', x: x + rnd(-spread, spread), y: y + rnd(-6, 6), vx: rnd(-30, 30), vy: rnd(-180, -60), life: rnd(0.8, 1.8), t: 0,
            r: rnd(1.2, 3), wob: rnd(0, 6) });
    }
  }
  function ink(x, y, n = 14) {
    for (let i = 0; i < n; i++) {
      const a = rnd(0, Math.PI * 2), s = rnd(40, 220);
      add({ k: 'ink', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rnd(0.5, 1.1), t: 0, r: rnd(1.5, 5) });
    }
  }
  function smoke(x, y, n = 8) {
    for (let i = 0; i < n; i++) {
      add({ k: 'smoke', x: x + rnd(-20, 20), y: y + rnd(-10, 10), vx: rnd(-15, 15), vy: rnd(-50, -20), life: rnd(1, 2), t: 0, r: rnd(10, 22) });
    }
  }
  function atEl(el, fn, ...args) {
    if (!el) return;
    const r = el.getBoundingClientRect();
    fn(r.left + r.width / 2, r.top + r.height / 2, ...args);
  }

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000) * Math.min(3, speed()); last = now;
    g.clearRect(0, 0, W, H);
    ambient(dt / Math.min(3, speed()));
    g.globalCompositeOperation = 'lighter';
    for (let i = P.length - 1; i >= 0; i--) {
      const p = P[i];
      p.t += dt;
      const f = p.t / p.life;
      if (f >= 1) { P.splice(i, 1); continue; }
      if (p.k === 'spark') {
        p.vy += p.g * dt; p.vx *= 0.98; p.x += p.vx * dt; p.y += p.vy * dt;
        const [r, gg, b] = p.col;
        g.globalCompositeOperation = 'lighter';
        g.fillStyle = `rgba(${r},${gg},${b},${(1 - f) * 0.95})`;
        g.beginPath(); g.arc(p.x, p.y, p.r * (1 - f * 0.5), 0, 7); g.fill();
      } else if (p.k === 'ember' || p.k === 'mote') {
        p.x += (p.vx + Math.sin((p.t + (p.wob || 0)) * 3) * 12) * dt; p.y += p.vy * dt;
        const a = p.k === 'mote' ? Math.sin(f * Math.PI) * 0.55 : (1 - f);
        g.globalCompositeOperation = 'lighter';
        const hue = p.hue || rnd(20, 40);
        g.fillStyle = `hsla(${hue},100%,${p.k === 'mote' ? 70 : 60}%,${a})`;
        g.beginPath(); g.arc(p.x, p.y, p.r, 0, 7); g.fill();
        if (p.k === 'ember') { g.fillStyle = `hsla(30,100%,60%,${a * 0.25})`; g.beginPath(); g.arc(p.x, p.y, p.r * 3, 0, 7); g.fill(); }
      } else if (p.k === 'ink') {
        p.vx *= 0.9; p.vy *= 0.9; p.x += p.vx * dt; p.y += p.vy * dt;
        g.globalCompositeOperation = 'source-over';
        g.fillStyle = `rgba(20,8,8,${(1 - f) * 0.85})`;
        g.beginPath(); g.arc(p.x, p.y, p.r * (1 + f * 0.6), 0, 7); g.fill();
      } else if (p.k === 'smoke') {
        p.x += p.vx * dt; p.y += p.vy * dt;
        g.globalCompositeOperation = 'source-over';
        g.fillStyle = `rgba(150,140,130,${(1 - f) * 0.16})`;
        g.beginPath(); g.arc(p.x, p.y, p.r * (1 + f * 1.8), 0, 7); g.fill();
      }
    }
    g.globalCompositeOperation = 'source-over';
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  function flash(color = '#ff6a2a', strength = 0.35) {
    const d = document.createElement('div');
    d.className = 'flash';
    d.style.background = `radial-gradient(ellipse at center, ${color} 0%, transparent 70%)`;
    d.style.setProperty('--fs', strength);
    document.body.appendChild(d);
    setTimeout(() => d.remove(), 700);
  }
  function flare() {
    document.body.classList.remove('flare'); void document.body.offsetWidth;
    document.body.classList.add('flare');
    setTimeout(() => document.body.classList.remove('flare'), 1400);
  }

  return { burst, embers, ink, smoke, atEl, flash, flare };
})();
