// SON EL — 3B dünya (Three.js): bodrum odası, masa, lamba, tabanca, kartlar, rakip
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export const TABLE_Y = 0.78;
const CARD_W = 0.11, CARD_H = 0.154, CARD_T = 0.0016;
const rnd = (a, b) => a + secureRandom() * (b - a);

// ================= YARDIMCILAR =================
const ease = {
  linear: k => k,
  inOut: k => k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2,
  out: k => 1 - Math.pow(1 - k, 3),
  in: k => k * k * k,
  back: k => { const c = 1.6; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); },
};
function canvasTex(w, h, draw, opts = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d');
  draw(g, w, h);
  const t = new THREE.CanvasTexture(c);
  if (opts.color !== false) t.colorSpace = THREE.SRGBColorSpace;
  if (opts.repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...opts.repeat); }
  t.anisotropy = 8;
  return t;
}
function speckle(g, w, h, n, color, rmax = 1.5, alpha = 0.08) {
  g.fillStyle = color;
  for (let i = 0; i < n; i++) {
    g.globalAlpha = secureRandom() * alpha;
    g.beginPath(); g.arc(secureRandom() * w, secureRandom() * h, secureRandom() * rmax, 0, 7); g.fill();
  }
  g.globalAlpha = 1;
}
function roundRect(g, x, y, w, h, r) {
  g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}

// ================= DOKULAR =================
function feltTexture() {
  return canvasTex(2048, 2048, (g, w, h) => {
    const grd = g.createRadialGradient(w / 2, h * 0.45, 50, w / 2, h / 2, w * 0.62);
    grd.addColorStop(0, '#2f7550'); grd.addColorStop(0.55, '#1d5236'); grd.addColorStop(1, '#0c2a1a');
    g.fillStyle = grd; g.fillRect(0, 0, w, h);
    speckle(g, w, h, 60000, '#000', 1.6, 0.18);
    speckle(g, w, h, 30000, '#7fc79a', 1.2, 0.07);
    // basılı yazılar
    g.save(); g.translate(w / 2, h / 2);
    g.strokeStyle = 'rgba(230,200,120,.22)'; g.lineWidth = 6;
    g.beginPath(); g.ellipse(0, 0, 640, 470, 0, 0, 7); g.stroke();
    g.lineWidth = 2; g.beginPath(); g.ellipse(0, 0, 610, 445, 0, 0, 7); g.stroke();
    g.fillStyle = 'rgba(230,200,120,.18)'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = '900 150px "Bebas Neue", Impact, sans-serif'; g.fillText('SON EL', 0, -10);
    g.font = '700 40px "Courier Prime", monospace'; g.fillText('KAYBEDEN  TETİĞİ  ÇEKER', 0, 100);
    g.font = '700 30px "Courier Prime", monospace';
    g.fillText('BLACKJACK ÖDER — HAYATINI', 0, -330); g.fillText('KASA HER ZAMAN KAZANIR', 0, 330);
    g.restore();
    // lekeler ve sigara yanıkları
    for (let i = 0; i < 9; i++) {
      const x = rnd(250, w - 250), y = rnd(250, h - 250), r = rnd(30, 90);
      g.strokeStyle = `rgba(40,20,5,${rnd(0.12, 0.3)})`; g.lineWidth = rnd(4, 12);
      g.beginPath(); g.arc(x, y, r, 0, 7); g.stroke();
    }
    for (let i = 0; i < 14; i++) {
      const x = rnd(200, w - 200), y = rnd(200, h - 200), r = rnd(6, 16);
      const bg = g.createRadialGradient(x, y, 0, x, y, r * 2);
      bg.addColorStop(0, 'rgba(5,3,2,.95)'); bg.addColorStop(0.45, 'rgba(60,30,10,.7)'); bg.addColorStop(1, 'rgba(60,30,10,0)');
      g.fillStyle = bg; g.beginPath(); g.ellipse(x, y, r * 2, r * 1.4, rnd(0, 3), 0, 7); g.fill();
    }
    // yıpranma: koyu bir halka
    const v = g.createRadialGradient(w / 2, h / 2, w * 0.3, w / 2, h / 2, w * 0.52);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.55)');
    g.fillStyle = v; g.fillRect(0, 0, w, h);
  });
}
function woodTexture(repeat = [1, 1], tone = 1) {
  return canvasTex(1024, 256, (g, w, h) => {
    g.fillStyle = `rgb(${70 * tone},${40 * tone},${20 * tone})`; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 140; i++) {
      const y = secureRandom() * h;
      g.strokeStyle = `rgba(${rnd(10, 40)},${rnd(5, 20)},0,${rnd(0.1, 0.5)})`; g.lineWidth = rnd(0.5, 3);
      g.beginPath(); g.moveTo(0, y);
      for (let x = 0; x <= w; x += 32) g.lineTo(x, y + Math.sin(x * 0.01 + i) * rnd(1, 5));
      g.stroke();
    }
    speckle(g, w, h, 4000, '#000', 1, 0.2);
    for (let i = 0; i < 3; i++) {
      const x = rnd(100, w - 100), y = rnd(40, h - 40);
      g.strokeStyle = 'rgba(20,8,0,.5)'; g.lineWidth = 2;
      for (let r = 4; r < 26; r += 4) { g.beginPath(); g.ellipse(x, y, r * 2.2, r, 0, 0, 7); g.stroke(); }
    }
  }, { repeat });
}
function concreteTexture(repeat, bricks) {
  return canvasTex(1024, 1024, (g, w, h) => {
    g.fillStyle = '#3a3631'; g.fillRect(0, 0, w, h);
    speckle(g, w, h, 70000, '#000', 2, 0.25);
    speckle(g, w, h, 20000, '#9a948a', 1.5, 0.12);
    for (let i = 0; i < 40; i++) {
      const x = secureRandom() * w, y = secureRandom() * h;
      const s = g.createRadialGradient(x, y, 0, x, y, rnd(40, 160));
      s.addColorStop(0, `rgba(0,0,0,${rnd(0.1, 0.35)})`); s.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = s; g.fillRect(0, 0, w, h);
    }
    if (bricks) {
      g.strokeStyle = 'rgba(0,0,0,.55)'; g.lineWidth = 6;
      const bh = 64;
      for (let y = 0, row = 0; y < h; y += bh, row++) {
        g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke();
        for (let x = (row % 2) * 96; x < w; x += 192) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + bh); g.stroke(); }
      }
    }
    // su lekeleri (aşağı akan)
    for (let i = 0; i < 12; i++) {
      const x = secureRandom() * w;
      const s = g.createLinearGradient(0, 0, 0, h);
      s.addColorStop(0, 'rgba(10,8,5,.35)'); s.addColorStop(1, 'rgba(10,8,5,0)');
      g.fillStyle = s; g.fillRect(x, 0, rnd(8, 40), h * rnd(0.3, 0.9));
    }
  }, { repeat });
}

// ---- kart yüzü: gerçek iskambil tasarımı ----
const PIPS = {
  2: [[50, 0], [50, 100, 1]], 3: [[50, 0], [50, 50], [50, 100, 1]],
  4: [[0, 0], [100, 0], [0, 100, 1], [100, 100, 1]], 5: [[0, 0], [100, 0], [50, 50], [0, 100, 1], [100, 100, 1]],
  6: [[0, 0], [100, 0], [0, 50], [100, 50], [0, 100, 1], [100, 100, 1]],
  7: [[0, 0], [100, 0], [50, 25], [0, 50], [100, 50], [0, 100, 1], [100, 100, 1]],
  8: [[0, 0], [100, 0], [50, 25], [0, 50], [100, 50], [50, 75, 1], [0, 100, 1], [100, 100, 1]],
  9: [[0, 0], [100, 0], [0, 33.3], [100, 33.3], [50, 50], [0, 66.7, 1], [100, 66.7, 1], [0, 100, 1], [100, 100, 1]],
  10: [[0, 0], [100, 0], [50, 16.7], [0, 33.3], [100, 33.3], [0, 66.7, 1], [100, 66.7, 1], [50, 83.3, 1], [0, 100, 1], [100, 100, 1]],
};
const RED = { '♥': 1, '♦': 1 };
const INK_RED = '#b3161b', INK_BLK = '#121212';
const suitCol = s => RED[s] ? INK_RED : INK_BLK;
// vektör takım işaretleri (100 birimlik, merkezde)
function suitPath(g, s, x, y, size, flip = false) {
  g.save(); g.translate(x, y); if (flip) g.rotate(Math.PI);
  const k = size / 100; g.scale(k, k);
  g.beginPath();
  if (s === '♥') {
    g.moveTo(0, 40); g.bezierCurveTo(-16, 26, -50, 4, -50, -18); g.bezierCurveTo(-50, -38, -34, -48, -22, -48);
    g.bezierCurveTo(-10, -48, -2, -40, 0, -30); g.bezierCurveTo(2, -40, 10, -48, 22, -48);
    g.bezierCurveTo(34, -48, 50, -38, 50, -18); g.bezierCurveTo(50, 4, 16, 26, 0, 40);
  } else if (s === '♦') {
    g.moveTo(0, -50); g.quadraticCurveTo(12, -22, 38, 0); g.quadraticCurveTo(12, 22, 0, 50);
    g.quadraticCurveTo(-12, 22, -38, 0); g.quadraticCurveTo(-12, -22, 0, -50);
  } else if (s === '♠') {
    g.moveTo(0, -50); g.bezierCurveTo(-10, -32, -50, -12, -50, 10); g.bezierCurveTo(-50, 28, -34, 36, -22, 36);
    g.bezierCurveTo(-13, 36, -7, 32, -4, 26); g.bezierCurveTo(-5, 38, -12, 46, -22, 50); g.lineTo(22, 50);
    g.bezierCurveTo(12, 46, 5, 38, 4, 26); g.bezierCurveTo(7, 32, 13, 36, 22, 36);
    g.bezierCurveTo(34, 36, 50, 28, 50, 10); g.bezierCurveTo(50, -12, 10, -32, 0, -50);
  } else {
    g.moveTo(22, -24); g.arc(0, -24, 22, 0, Math.PI * 2);
    g.moveTo(-2, 8); g.arc(-24, 8, 22, 0, Math.PI * 2);
    g.moveTo(46, 8); g.arc(24, 8, 22, 0, Math.PI * 2);
    g.moveTo(-6, 0); g.bezierCurveTo(-6, 30, -12, 44, -22, 50); g.lineTo(22, 50); g.bezierCurveTo(12, 44, 6, 30, 6, 0); g.closePath();
  }
  g.fill('nonzero'); g.restore();
}
function cardPaper(g, w, h) {
  g.clearRect(0, 0, w, h);
  roundRect(g, 4, 4, w - 8, h - 8, 52); g.save(); g.clip();
  g.fillStyle = '#f7f3ea'; g.fillRect(0, 0, w, h);
  speckle(g, w, h, 2500, '#7a6a50', 1, 0.07);
  // kenarlara doğru hafif kirlenme
  const v = g.createRadialGradient(w / 2, h / 2, w * 0.45, w / 2, h / 2, w * 0.9);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(120,95,55,.22)');
  g.fillStyle = v; g.fillRect(0, 0, w, h);
}
function cardEdge(g, w, h) {
  g.restore();
  g.strokeStyle = 'rgba(70,55,35,.45)'; g.lineWidth = 3; roundRect(g, 5, 5, w - 10, h - 10, 51); g.stroke();
}
// saray figürü (J/Q/K): klasik iki başlı, aynalı tasarım
function courtHalf(g, x, y, w, h, r, s) {
  const red = '#c0261d', blue = '#22458e', yel = '#e3b13b', ink = '#141414', skin = '#f4dcbc', white = '#f6f1e4';
  const main = RED[s] ? red : blue, alt = RED[s] ? blue : red;
  const cx = x + w / 2;
  g.lineJoin = 'round'; g.lineCap = 'round';
  const outline = (fill, lw = 4) => { g.fillStyle = fill; g.fill(); g.strokeStyle = ink; g.lineWidth = lw; g.stroke(); };
  // cüppe
  g.beginPath(); g.moveTo(x, y + h * 0.5); g.lineTo(x, y + h * 0.33);
  g.bezierCurveTo(x + w * 0.12, y + h * 0.25, cx - w * 0.22, y + h * 0.25, cx, y + h * 0.27);
  g.bezierCurveTo(cx + w * 0.22, y + h * 0.25, x + w * 0.88, y + h * 0.25, x + w, y + h * 0.33);
  g.lineTo(x + w, y + h * 0.5); g.closePath(); outline(main);
  // desenli şerit ve yaka
  g.save(); g.clip();
  g.beginPath(); g.moveTo(x + w * 0.1, y + h * 0.5); g.lineTo(cx + w * 0.05, y + h * 0.27); g.lineTo(cx + w * 0.18, y + h * 0.27); g.lineTo(x + w * 0.26, y + h * 0.5); g.closePath(); outline(yel, 3);
  for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(x + w * (0.17 + i * 0.03), y + h * (0.47 - i * 0.035), 6, 0, 7); outline(alt, 2); }
  g.beginPath(); g.moveTo(x + w * 0.6, y + h * 0.5); g.lineTo(x + w * 0.66, y + h * 0.3); g.lineTo(x + w * 0.78, y + h * 0.32); g.lineTo(x + w * 0.74, y + h * 0.5); outline(white, 3);
  for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) { g.fillStyle = ink; g.fillRect(x + w * (0.67 + j * 0.025), y + h * (0.34 + i * 0.04), 5, 5); }
  g.restore();
  g.beginPath(); g.moveTo(cx - w * 0.16, y + h * 0.265); g.quadraticCurveTo(cx, y + h * 0.33, cx + w * 0.16, y + h * 0.265); g.quadraticCurveTo(cx, y + h * 0.29, cx - w * 0.16, y + h * 0.265); outline(alt, 3);
  // boyun ve kafa
  const hy = y + h * 0.17, hr = w * 0.115;
  g.beginPath(); g.rect(cx - hr * 0.35, hy + hr * 0.7, hr * 0.7, h * 0.07); outline(skin, 3);
  if (r === 'K') { // sakal
    g.beginPath(); g.moveTo(cx - hr * 0.95, hy); g.quadraticCurveTo(cx - hr * 1.0, hy + hr * 1.9, cx, hy + hr * 2.1);
    g.quadraticCurveTo(cx + hr * 1.0, hy + hr * 1.9, cx + hr * 0.95, hy); g.closePath(); outline('#efe9dc', 3);
    for (let i = -3; i <= 3; i++) { g.beginPath(); g.moveTo(cx + i * hr * 0.22, hy + hr * 0.9); g.lineTo(cx + i * hr * 0.18, hy + hr * 1.8); g.strokeStyle = '#9a8f80'; g.lineWidth = 2; g.stroke(); }
  }
  if (r === 'Q') { // uzun saç
    g.beginPath(); g.moveTo(cx - hr * 1.15, hy - hr * 0.2); g.quadraticCurveTo(cx - hr * 1.5, hy + hr * 1.6, cx - hr * 0.8, hy + hr * 2.3);
    g.lineTo(cx + hr * 0.8, hy + hr * 2.3); g.quadraticCurveTo(cx + hr * 1.5, hy + hr * 1.6, cx + hr * 1.15, hy - hr * 0.2); g.closePath(); outline(yel, 3);
  }
  g.beginPath(); g.ellipse(cx, hy, hr * 0.82, hr, 0, 0, 7); outline(skin, 4);
  // yüz
  g.strokeStyle = ink; g.lineWidth = 3;
  g.beginPath(); g.moveTo(cx - hr * 0.45, hy - hr * 0.12); g.quadraticCurveTo(cx - hr * 0.3, hy - hr * 0.22, cx - hr * 0.15, hy - hr * 0.12); g.stroke();
  g.beginPath(); g.moveTo(cx + hr * 0.15, hy - hr * 0.12); g.quadraticCurveTo(cx + hr * 0.3, hy - hr * 0.22, cx + hr * 0.45, hy - hr * 0.12); g.stroke();
  g.fillStyle = ink; g.beginPath(); g.arc(cx - hr * 0.3, hy - hr * 0.06, 4, 0, 7); g.fill(); g.beginPath(); g.arc(cx + hr * 0.3, hy - hr * 0.06, 4, 0, 7); g.fill();
  g.beginPath(); g.moveTo(cx, hy - hr * 0.05); g.lineTo(cx - hr * 0.1, hy + hr * 0.3); g.lineTo(cx + hr * 0.05, hy + hr * 0.32); g.stroke();
  g.strokeStyle = red; g.lineWidth = 4; g.beginPath(); g.moveTo(cx - hr * 0.22, hy + hr * 0.55); g.quadraticCurveTo(cx, hy + hr * 0.62, cx + hr * 0.22, hy + hr * 0.55); g.stroke();
  if (r === 'K') { g.strokeStyle = ink; g.lineWidth = 3; g.beginPath(); g.moveTo(cx - hr * 0.4, hy + hr * 0.45); g.quadraticCurveTo(cx, hy + hr * 0.35, cx + hr * 0.4, hy + hr * 0.45); g.stroke(); }
  // başlık
  if (r === 'K' || r === 'Q') {
    const cw = hr * (r === 'K' ? 1.7 : 1.4), ch = hr * (r === 'K' ? 0.9 : 0.7), by = hy - hr * 0.75;
    g.beginPath(); g.moveTo(cx - cw / 2, by); g.lineTo(cx - cw / 2, by - ch * 0.4);
    for (let i = 0; i <= 4; i++) { const px = cx - cw / 2 + cw * i / 4; g.lineTo(px, by - ch * (i % 2 ? 0.55 : 1)); }
    g.lineTo(cx + cw / 2, by); g.closePath(); outline(yel, 3);
    g.beginPath(); g.rect(cx - cw / 2, by - ch * 0.15, cw, ch * 0.22); outline(alt, 3);
    for (let i = 0; i <= 4; i += 2) { g.beginPath(); g.arc(cx - cw / 2 + cw * i / 4, by - ch, 7, 0, 7); outline(red, 2); }
  } else {
    g.beginPath(); g.ellipse(cx - hr * 0.1, hy - hr * 0.75, hr * 1.1, hr * 0.42, -0.15, 0, 7); outline(alt, 3);
    g.beginPath(); g.rect(cx - hr * 0.95, hy - hr * 0.62, hr * 1.8, hr * 0.2); outline(yel, 3);
    g.beginPath(); g.moveTo(cx + hr * 0.6, hy - hr * 0.95); g.bezierCurveTo(cx + hr * 1.6, hy - hr * 2.1, cx + hr * 2.4, hy - hr * 1.2, cx + hr * 2.2, hy - hr * 0.4);
    g.bezierCurveTo(cx + hr * 1.9, hy - hr * 1.1, cx + hr * 1.3, hy - hr * 1.2, cx + hr * 0.6, hy - hr * 0.95); outline(red, 3);
    g.beginPath(); g.moveTo(cx - hr * 0.85, hy - hr * 0.4); g.quadraticCurveTo(cx - hr * 1.1, hy + hr * 0.5, cx - hr * 0.7, hy + hr * 0.6); g.lineTo(cx - hr * 0.75, hy - hr * 0.2); outline(yel, 2);
  }
  // nesne: Papaz kılıç, Kız çiçek, Vale balta
  if (r === 'K') {
    g.beginPath(); g.rect(x + w * 0.82, y + h * 0.02, w * 0.035, h * 0.36); outline('#c9ced6', 3);
    g.beginPath(); g.rect(x + w * 0.76, y + h * 0.36, w * 0.15, h * 0.025); outline(yel, 3);
  } else if (r === 'Q') {
    const fx = x + w * 0.2, fy = y + h * 0.3;
    g.strokeStyle = '#2e7a3a'; g.lineWidth = 5; g.beginPath(); g.moveTo(fx, fy + h * 0.15); g.quadraticCurveTo(fx - 10, fy + 30, fx, fy); g.stroke();
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; g.beginPath(); g.ellipse(fx + Math.cos(a) * 14, fy + Math.sin(a) * 14, 11, 7, a, 0, 7); outline(red, 2); }
    g.beginPath(); g.arc(fx, fy, 8, 0, 7); outline(yel, 2);
  } else {
    g.beginPath(); g.rect(x + w * 0.83, y + h * 0.04, w * 0.025, h * 0.4); outline('#7a4a22', 3);
    g.beginPath(); g.moveTo(x + w * 0.84, y + h * 0.06); g.quadraticCurveTo(x + w * 0.99, y + h * 0.1, x + w * 0.95, y + h * 0.18); g.lineTo(x + w * 0.85, y + h * 0.14); g.closePath(); outline('#c9ced6', 3);
  }
  // panelin köşesindeki küçük takım işareti
  g.fillStyle = suitCol(s); suitPath(g, s, x + w * 0.13, y + h * 0.08, w * 0.13);
}
function drawCourt(g, x, y, w, h, r, s) {
  g.save();
  g.beginPath(); g.rect(x, y, w, h); g.clip();
  g.fillStyle = '#faf5e9'; g.fillRect(x, y, w, h);
  g.save(); g.beginPath(); g.rect(x, y, w, h / 2); g.clip(); courtHalf(g, x, y, w, h, r, s); g.restore();
  g.save(); g.translate(x + w / 2, y + h / 2); g.rotate(Math.PI); g.translate(-(x + w / 2), -(y + h / 2));
  g.beginPath(); g.rect(x, y, w, h / 2); g.clip(); courtHalf(g, x, y, w, h, r, s); g.restore();
  g.strokeStyle = '#141414'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(x + w * 0.04, y + h / 2); g.lineTo(x + w * 0.96, y + h / 2); g.stroke();
  g.restore();
  g.strokeStyle = suitCol(s); g.lineWidth = 6; g.strokeRect(x, y, w, h);
  g.strokeStyle = '#141414'; g.lineWidth = 2; g.strokeRect(x + 7, y + 7, w - 14, h - 14);
}
const texCache = {};
let maxAniso = 8;
function cardFaceTex(c) {
  const key = c.r + c.s;
  if (texCache[key]) return texCache[key];
  const t = canvasTex(768, 1076, (g, w, h) => {
    cardPaper(g, w, h);
    const col = suitCol(c.s);
    g.fillStyle = col;
    const index = (rot) => {
      g.save(); if (rot) { g.translate(w, h); g.rotate(Math.PI); }
      g.textAlign = 'center'; g.textBaseline = 'alphabetic';
      const ten = c.r === '10';
      g.font = `900 ${ten ? 128 : 150}px "Playfair Display", Georgia, serif`;
      if (ten) { g.save(); g.translate(86, 160); g.scale(0.78, 1); g.fillText('10', 0, 0); g.restore(); }
      else g.fillText(c.r, 86, 160);
      suitPath(g, c.s, 86, 232, 86);
      g.restore();
    };
    index(false); index(true);
    const px = 190, py = 120, pw = w - 380, ph = h - 240;
    if (c.r === 'A') {
      if (c.s === '♠') {
        g.strokeStyle = col; g.lineWidth = 4;
        g.beginPath(); g.arc(w / 2, h / 2, 230, 0, 7); g.stroke();
        g.lineWidth = 1.5; g.beginPath(); g.arc(w / 2, h / 2, 216, 0, 7); g.stroke();
        for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; g.save(); g.translate(w / 2 + Math.cos(a) * 223, h / 2 + Math.sin(a) * 223); g.rotate(a); g.fillRect(-2, -8, 4, 16); g.restore(); }
        suitPath(g, '♠', w / 2, h / 2, 330);
        g.font = '700 30px "Courier Prime", monospace'; g.textAlign = 'center';
        g.fillText('SON EL · KUMARHANE', w / 2, h / 2 + 290);
      } else suitPath(g, c.s, w / 2, h / 2, 300);
    } else if (['J', 'Q', 'K'].includes(c.r)) {
      drawCourt(g, 150, 110, w - 300, h - 220, c.r, c.s);
    } else {
      const size = +c.r >= 9 ? 118 : 128;
      for (const [x, y, f] of PIPS[+c.r]) suitPath(g, c.s, px + pw * x / 100, py + 50 + (ph - 100) * y / 100, size, !!f);
    }
    cardEdge(g, w, h);
  });
  t.anisotropy = maxAniso;
  texCache[key] = t;
  return t;
}
let backTexCache = null;
function cardBackTex() {
  if (backTexCache) return backTexCache;
  backTexCache = canvasTex(768, 1076, (g, w, h) => {
    cardPaper(g, w, h);
    const ix = 44, iy = 44, iw = w - 88, ih = h - 88;
    g.fillStyle = '#7d1111'; roundRect(g, ix, iy, iw, ih, 22); g.fill();
    g.save(); roundRect(g, ix, iy, iw, ih, 22); g.clip();
    g.strokeStyle = 'rgba(246,228,200,.5)'; g.lineWidth = 2;
    for (let i = -h; i < w + h; i += 24) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + h, h); g.stroke(); g.beginPath(); g.moveTo(i, h); g.lineTo(i + h, 0); g.stroke(); }
    g.fillStyle = 'rgba(246,228,200,.35)';
    for (let yy = 0; yy < h; yy += 24) for (let xx = (yy / 24 % 2) * 12; xx < w; xx += 24) { g.beginPath(); g.arc(xx, yy, 2.2, 0, 7); g.fill(); }
    // orta madalyon: dönen maçalar
    g.fillStyle = '#7d1111'; g.beginPath(); g.ellipse(w / 2, h / 2, 190, 250, 0, 0, 7); g.fill();
    g.strokeStyle = '#f2e3c6'; g.lineWidth = 6; g.stroke(); g.lineWidth = 2; g.beginPath(); g.ellipse(w / 2, h / 2, 174, 234, 0, 0, 7); g.stroke();
    g.fillStyle = '#f2e3c6';
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; g.save(); g.translate(w / 2 + Math.cos(a) * 110, h / 2 + Math.sin(a) * 140); g.rotate(a + Math.PI / 2); suitPath(g, '♠', 0, 0, 48); g.restore(); }
    suitPath(g, '♠', w / 2, h / 2, 120);
    g.restore();
    g.strokeStyle = '#f2e3c6'; g.lineWidth = 6; roundRect(g, ix + 16, iy + 16, iw - 32, ih - 32, 14); g.stroke();
    g.lineWidth = 2; roundRect(g, ix + 26, iy + 26, iw - 52, ih - 52, 10); g.stroke();
    cardEdge(g, w, h);
  });
  backTexCache.anisotropy = maxAniso;
  return backTexCache;
}
// keten doku kabartması (gerçek oyun kartlarındaki ince ızgara)
let linenTex = null;
function linenBump() {
  if (linenTex) return linenTex;
  linenTex = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#808080'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < w; i += 4) {
      g.fillStyle = `rgba(255,255,255,${0.18 + secureRandom() * 0.1})`; g.fillRect(i, 0, 1.5, h);
      g.fillStyle = `rgba(0,0,0,${0.18 + secureRandom() * 0.1})`; g.fillRect(0, i, w, 1.5);
    }
  }, { color: false, repeat: [6, 8] });
  return linenTex;
}
function radialSprite(inner, outer = 'rgba(0,0,0,0)', size = 128) {
  return canvasTex(size, size, (g, w) => {
    const r = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
    r.addColorStop(0, inner); r.addColorStop(1, outer);
    g.fillStyle = r; g.fillRect(0, 0, w, w);
  });
}
function faceTex(o) {
  // maske: solgun deri, oyuk göz çukurları, ince ağız. Yüz dokunun ortasına çizilir.
  return canvasTex(1024, 512, (g, w, h) => {
    g.fillStyle = o.skin || '#b9ab97'; g.fillRect(0, 0, w, h);
    speckle(g, w, h, 30000, '#3a2a20', 1.5, 0.12);
    const cx = w / 2, cy = h * 0.52;
    const sock = (x) => {
      const s = g.createRadialGradient(x, cy - 30, 4, x, cy - 30, 62);
      s.addColorStop(0, 'rgba(5,3,2,1)'); s.addColorStop(0.55, 'rgba(20,10,8,.85)'); s.addColorStop(1, 'rgba(40,20,15,0)');
      g.fillStyle = s; g.beginPath(); g.ellipse(x, cy - 30, 66, 52, 0, 0, 7); g.fill();
    };
    sock(cx - 70); sock(cx + 70);
    // burun gölgesi
    const n = g.createLinearGradient(cx - 20, 0, cx + 30, 0);
    n.addColorStop(0, 'rgba(40,25,20,0)'); n.addColorStop(1, 'rgba(40,25,20,.5)');
    g.fillStyle = n; g.beginPath(); g.moveTo(cx, cy - 20); g.lineTo(cx + 22, cy + 60); g.lineTo(cx - 14, cy + 66); g.fill();
    // dikişli ağız
    g.strokeStyle = 'rgba(25,8,6,.9)'; g.lineWidth = 5; g.lineCap = 'round';
    const my = cy + 122 + (o.smile || 0) * 0.3;
    g.beginPath(); g.moveTo(cx - 64, my - (o.smile || 0) * 0.4); g.quadraticCurveTo(cx, my + (o.smile || 0), cx + 64, my - (o.smile || 0) * 0.4); g.stroke();
    g.lineWidth = 3;
    for (let i = -5; i <= 5; i++) { const x = cx + i * 11; g.beginPath(); g.moveTo(x - 2, my - 12); g.lineTo(x + 2, my + 12); g.stroke(); }
    // porselen çatlakları
    g.strokeStyle = 'rgba(40,20,15,.55)'; g.lineWidth = 2;
    for (let n = 0; n < 4; n++) {
      let x = cx + rnd(-140, 140), y = cy - rnd(120, 200);
      g.beginPath(); g.moveTo(x, y);
      for (let k = 0; k < 7; k++) { x += rnd(-22, 22); y += rnd(10, 28); g.lineTo(x, y); }
      g.stroke();
    }
    // kırışıklar / yara
    g.strokeStyle = 'rgba(50,25,20,.35)'; g.lineWidth = 3;
    for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(cx - 90, cy - 120 - i * 14); g.quadraticCurveTo(cx, cy - 130 - i * 14, cx + 90, cy - 120 - i * 14); g.stroke(); }
    if (o.scar) { g.strokeStyle = 'rgba(120,30,30,.8)'; g.lineWidth = 6; g.beginPath(); g.moveTo(cx + 40, cy - 110); g.lineTo(cx + 110, cy + 60); g.stroke(); }
    // yanaklarda gölge
    const ch = g.createRadialGradient(cx, cy + 40, 60, cx, cy + 40, 260);
    ch.addColorStop(0, 'rgba(0,0,0,0)'); ch.addColorStop(1, 'rgba(0,0,0,.45)');
    g.fillStyle = ch; g.fillRect(0, 0, w, h);
  });
}
function eyeTex() {
  return canvasTex(1024, 512, (g, w, h) => {
    g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
    const cx = w / 2, cy = h * 0.52 - 30;
    for (const x of [cx - 70, cx + 70]) {
      const e = g.createRadialGradient(x, cy, 0, x, cy, 16);
      e.addColorStop(0, '#fff'); e.addColorStop(0.4, '#fff'); e.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = e; g.beginPath(); g.arc(x, cy, 16, 0, 7); g.fill();
    }
  }, { color: false });
}

// ================= DÜNYA =================
export class World {
  constructor(canvas) {
    this.speed = 1;
    this.tweens = [];
    this.frameHooks = [];
    this.mouse = new THREE.Vector2();
    this.shakeAmt = 0;
    this.clock = new THREE.Clock();
    this.mode = 'title';
    this.cards = [];
    this.smoke = [];

    // telefon/tablet: dokunmatik ve küçük ekranlarda daha hafif ayarlar
    this.mobile = matchMedia('(pointer: coarse)').matches || Math.min(innerWidth, innerHeight) < 520;
    const R = this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.maxDpr = Math.min(this.mobile ? 1.5 : 1.75, devicePixelRatio);
    R.setPixelRatio(this.maxDpr);
    this.perf = { ema: 1 / 60, t: 0 };
    R.setSize(innerWidth, innerHeight);
    R.shadowMap.enabled = true;
    R.shadowMap.type = THREE.PCFSoftShadowMap;
    R.toneMapping = THREE.ACESFilmicToneMapping;
    R.toneMappingExposure = 1.0;
    maxAniso = R.capabilities.getMaxAnisotropy();

    const S = this.scene = new THREE.Scene();
    S.background = new THREE.Color('#050404');
    S.fog = new THREE.FogExp2('#070605', 0.16);
    const pm = new THREE.PMREMGenerator(R);
    // ortam yansıması sadece metallere: sahneyi aydınlatmasın, karanlık kalsın
    this.envMap = pm.fromScene(new RoomEnvironment(R), 0.04).texture;

    const C = this.camera = new THREE.PerspectiveCamera(52, innerWidth / innerHeight, 0.02, 30);
    S.add(C);
    // elde tutulan tabancayı aydınlatan zayıf dolgu ışığı (kamerayla gezer)
    this.handLight = new THREE.PointLight('#ffcf9a', 0, 0.7, 2);
    this.handLight.position.set(0.05, 0.12, -0.05);
    C.add(this.handLight);
    this.camBase = { pos: new THREE.Vector3(0, 1.28, 0.92), look: new THREE.Vector3(0, 0.95, -0.45) };
    this.baseFov = 52;
    this.frameForAspect();
    this.camCur = { pos: this.camBase.pos.clone(), look: this.camBase.look.clone(), roll: 0 };
    this.titleT = 0;

    this.buildLights();
    this.buildRoom();
    this.buildTable();
    this.buildLamp();
    this.buildProps();
    this.buildGun();
    this.buildDust();
    this.buildBullets();
    this.buildPost();
    if (this.mobile) this.lowerQuality(this.scene);

    addEventListener('resize', () => this.resize());
    // yakından bak: Shift basılıyken ya da sağ tık basılıyken masaya eğil
    this.lean = 0; this.leanTarget = 0;
    addEventListener('keydown', e => { if (e.key === 'Shift') this.leanTarget = 1; });
    addEventListener('keyup', e => { if (e.key === 'Shift') this.leanTarget = 0; });
    addEventListener('mousedown', e => { if (e.button === 2) this.leanTarget = 1; });
    addEventListener('mouseup', e => { if (e.button === 2) this.leanTarget = 0; });
    addEventListener('contextmenu', e => e.preventDefault());
    addEventListener('blur', () => { this.leanTarget = 0; });
    addEventListener('mousemove', e => { this.mouse.set(e.clientX / innerWidth * 2 - 1, e.clientY / innerHeight * 2 - 1); });
    R.setAnimationLoop(() => this.frame());
  }

  // ---------------- ışık ----------------
  buildLights() {
    const S = this.scene;
    this.hemi = new THREE.HemisphereLight('#3a3a50', '#120a06', 0.18);
    S.add(this.hemi);
    // rakibin arkasından soğuk kenar ışığı
    const rim = new THREE.SpotLight('#5a7aff', 6, 6, 0.6, 0.8, 2);
    rim.position.set(0.6, 2.2, -2.4); rim.target.position.set(0, 1.3, -1.0);
    S.add(rim, rim.target);
    this.rim = rim;
    // kapı aralığından sızan ışık
    const door = new THREE.PointLight('#ffb070', 1.2, 4, 2);
    door.position.set(-1.9, 1.0, -2.3);
    S.add(door);
  }

  // ---------------- oda ----------------
  buildRoom() {
    const S = this.scene;
    const wallTex = concreteTexture([3, 1.5], true), floorTex = concreteTexture([4, 4], false);
    const wallMat = new THREE.MeshStandardMaterial({ map: wallTex, bumpMap: wallTex, bumpScale: 3, roughness: 0.95, color: '#8a8580' });
    const floorMat = new THREE.MeshStandardMaterial({ map: floorTex, bumpMap: floorTex, bumpScale: 2, roughness: 0.8, color: '#6a6560' });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), floorMat);
    floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; S.add(floor);
    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), new THREE.MeshStandardMaterial({ color: '#0d0c0b', roughness: 1 }));
    ceil.rotation.x = Math.PI / 2; ceil.position.y = 3.1; S.add(ceil);
    const mk = (w, x, z, ry) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, 3.1), wallMat); m.position.set(x, 1.55, z); m.rotation.y = ry; m.receiveShadow = true; S.add(m); };
    mk(6, 0, -2.6, 0); mk(6, -2.7, 0, Math.PI / 2); mk(6, 2.7, 0, -Math.PI / 2); mk(6, 0, 2.4, Math.PI);
    // kapı ve altından sızan ışık
    const door = new THREE.Mesh(new THREE.BoxGeometry(0.9, 2.0, 0.06), new THREE.MeshStandardMaterial({ color: '#1e1814', roughness: 0.7, metalness: 0.3 }));
    door.position.set(-1.6, 1.0, -2.57); S.add(door);
    const gap = new THREE.Mesh(new THREE.PlaneGeometry(0.92, 0.02), new THREE.MeshBasicMaterial({ color: '#5a3418', transparent: true, opacity: 0.8 }));
    gap.position.set(-1.6, 0.006, -2.53); gap.rotation.x = -Math.PI / 2; S.add(gap);
    const side = new THREE.Mesh(new THREE.PlaneGeometry(0.006, 2.0), new THREE.MeshBasicMaterial({ color: '#3a2210' }));
    side.position.set(-1.14, 1.0, -2.53); S.add(side);
    // borular
    const pipeMat = new THREE.MeshStandardMaterial({ color: '#3a2a22', metalness: 0.7, roughness: 0.5 });
    for (let i = 0; i < 2; i++) {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.05 - i * 0.015, 0.05 - i * 0.015, 6, 16), pipeMat);
      p.rotation.z = Math.PI / 2; p.position.set(0, 2.85 - i * 0.14, -2.45 + i * 0.05); S.add(p);
    }
    // rafta şişeler
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.04, 0.25), new THREE.MeshStandardMaterial({ map: woodTexture([1, 1], 0.8), roughness: 0.8 }));
    shelf.position.set(1.4, 1.5, -2.45); shelf.castShadow = true; S.add(shelf);
    const glass = (col) => new THREE.MeshPhysicalMaterial({ color: col, roughness: 0.1, metalness: 0, transmission: 0.6, thickness: 0.02, transparent: true, opacity: 0.85 });
    [['#2a5a2a', 1.0], ['#5a3a10', 1.15], ['#1a3a3a', 1.3], ['#4a1a1a', 1.48], ['#2a5a2a', 1.62], ['#6a5020', 1.78]].forEach(([c, x], i) => {
      const h = rnd(0.2, 0.32);
      const pts = [new THREE.Vector2(0, 0), new THREE.Vector2(0.04, 0), new THREE.Vector2(0.042, h * 0.62), new THREE.Vector2(0.014, h * 0.82), new THREE.Vector2(0.013, h), new THREE.Vector2(0, h)];
      const b = new THREE.Mesh(new THREE.LatheGeometry(pts, 18), glass(c));
      b.position.set(x, 1.52, -2.45); b.castShadow = true; S.add(b);
    });
    // duvarda eski bir saat
    const clock = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.04, 32), new THREE.MeshStandardMaterial({ map: canvasTex(256, 256, (g, w) => {
      g.fillStyle = '#d8ccb0'; g.fillRect(0, 0, w, w); g.fillStyle = '#222'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.font = 'bold 22px serif';
      for (let i = 1; i <= 12; i++) { const a = i / 12 * Math.PI * 2 - Math.PI / 2; g.fillText(i, w / 2 + Math.cos(a) * 100, w / 2 + Math.sin(a) * 100); }
      g.lineWidth = 6; g.lineCap = 'round'; g.strokeStyle = '#111';
      g.beginPath(); g.moveTo(w / 2, w / 2); g.lineTo(w / 2 + 50, w / 2 - 30); g.stroke();
      g.beginPath(); g.moveTo(w / 2, w / 2); g.lineTo(w / 2 - 10, w / 2 - 80); g.stroke();
      speckle(g, w, w, 2000, '#4a3a20', 2, 0.3);
    }), roughness: 0.6 }));
    clock.rotation.x = Math.PI / 2; clock.position.set(0.0, 2.25, -2.56); S.add(clock);
  }

  // ---------------- masa ----------------
  buildTable() {
    const S = this.scene;
    const g = new THREE.Group(); S.add(g);
    const rx = 0.95, rz = 0.7;
    const felt = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.04, 96), [
      new THREE.MeshStandardMaterial({ color: '#0e2a1b', roughness: 1 }),
      new THREE.MeshStandardMaterial({ map: (() => { const t = feltTexture(); t.center.set(0.5, 0.5); t.rotation = Math.PI / 2; return t; })(), roughness: 0.95, metalness: 0,
        bumpMap: canvasTex(512, 512, (g, w, h) => { g.fillStyle = '#808080'; g.fillRect(0, 0, w, h); speckle(g, w, h, 40000, '#fff', 1.2, 0.35); speckle(g, w, h, 40000, '#000', 1.2, 0.35); }, { color: false, repeat: [14, 14] }), bumpScale: 0.6 }),
      new THREE.MeshStandardMaterial({ color: '#0e2a1b', roughness: 1 }),
    ]);
    felt.scale.set(rx, 1, rz); felt.position.y = TABLE_Y - 0.02; felt.receiveShadow = true;
    g.add(felt);
    // ahşap kenar (oval simit)
    const railTex = woodTexture([12, 1], 1.1);
    const rail = new THREE.Mesh(new THREE.TorusGeometry(1, 0.07, 32, 160), new THREE.MeshPhysicalMaterial({ map: railTex, bumpMap: railTex, bumpScale: 1.5, roughness: 0.42, clearcoat: 0.6, clearcoatRoughness: 0.35, color: '#a07050' }));
    rail.rotation.x = Math.PI / 2; rail.scale.set(rx + 0.04, rz + 0.055, 0.8); rail.position.y = TABLE_Y + 0.005;
    rail.castShadow = true; rail.receiveShadow = true; g.add(rail);
    // gövde
    const base = new THREE.Mesh(new THREE.CylinderGeometry(1, 0.96, 0.16, 64), new THREE.MeshStandardMaterial({ map: woodTexture([8, 1], 0.6), roughness: 0.7 }));
    base.scale.set(rx, 1, rz); base.position.y = TABLE_Y - 0.11; base.castShadow = true; g.add(base);
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.3, TABLE_Y - 0.15, 24), new THREE.MeshStandardMaterial({ color: '#1a100a', roughness: 0.6 }));
    leg.position.y = (TABLE_Y - 0.15) / 2; leg.castShadow = true; g.add(leg);
    this.table = g;
  }

  // ---------------- lamba ----------------
  buildLamp() {
    const S = this.scene;
    const pivot = new THREE.Group(); pivot.position.set(0, 3.1, 0.02); S.add(pivot);
    const cordLen = 1.12;
    const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, cordLen, 6), new THREE.MeshStandardMaterial({ color: '#111' }));
    cord.position.y = -cordLen / 2; pivot.add(cord);
    const shadeMat = new THREE.MeshStandardMaterial({ color: '#23382a', metalness: 0.6, roughness: 0.4, side: THREE.DoubleSide });
    const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.28, 0.2, 48, 1, true), shadeMat);
    shade.position.y = -cordLen - 0.08; shade.castShadow = true; pivot.add(shade);
    const inner = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.276, 0.198, 48, 1, true), new THREE.MeshStandardMaterial({ color: '#d8d0b0', side: THREE.BackSide, emissive: '#ffcf8a', emissiveIntensity: 0.25 }));
    inner.position.copy(shade.position); pivot.add(inner);
    const bulbMat = new THREE.MeshStandardMaterial({ color: '#fff', emissive: '#ffd08a', emissiveIntensity: 9 });
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.045, 24, 16), bulbMat);
    bulb.position.y = -cordLen - 0.17; pivot.add(bulb);
    this.bulbMat = bulbMat;
    const spot = new THREE.SpotLight('#ffd9a0', 10, 7, 0.75, 0.65, 1.6);
    spot.position.copy(bulb.position);
    spot.castShadow = true;
    spot.shadow.mapSize.set(this.mobile ? 1024 : 2048, this.mobile ? 1024 : 2048);
    spot.shadow.bias = -0.0004; spot.shadow.normalBias = 0.02; spot.shadow.radius = 4;
    spot.shadow.camera.near = 0.1; spot.shadow.camera.far = 5;
    pivot.add(spot);
    spot.target.position.set(0, TABLE_Y, 0.02); S.add(spot.target);
    const glow = new THREE.PointLight('#ffcf8a', 0.6, 2, 2);
    glow.position.y = -cordLen - 0.05; pivot.add(glow);
    // ışık hüzmesi (hacimsel ışık hissi)
    const beamMat = new THREE.MeshBasicMaterial({ color: '#ffd9a0', transparent: true, opacity: 0.007, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending });
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.95, 1.95, 48, 1, true), beamMat);
    beam.position.y = -cordLen - 0.2 - 0.97; pivot.add(beam);
    this.beamMat = beamMat;
    this.lamp = { pivot, spot, glow, base: 10 };
  }

  // ---------------- dekor ----------------
  buildProps() {
    const S = this.scene;
    // kart kutusu (shoe)
    const shoe = new THREE.Group();
    const wood = new THREE.MeshStandardMaterial({ map: woodTexture([1, 1], 0.7), roughness: 0.6 });
    const box = new THREE.Mesh(new RoundedBoxGeometry(0.14, 0.09, 0.2, 3, 0.012), wood);
    box.position.y = 0.045; box.castShadow = true; shoe.add(box);
    const stack = new THREE.Mesh(new THREE.BoxGeometry(CARD_W * 0.98, 0.05, CARD_H * 0.98), [
      new THREE.MeshStandardMaterial({ color: '#e8dfca' }), new THREE.MeshStandardMaterial({ color: '#e8dfca' }),
      new THREE.MeshStandardMaterial({ map: cardBackTex(), roughness: 0.6 }), new THREE.MeshStandardMaterial({ color: '#e8dfca' }),
      new THREE.MeshStandardMaterial({ color: '#e8dfca' }), new THREE.MeshStandardMaterial({ color: '#e8dfca' }),
    ]);
    stack.position.set(0, 0.075, 0); stack.rotation.x = -0.25; shoe.add(stack);
    shoe.position.set(0.6, TABLE_Y, -0.18); shoe.rotation.y = -0.5;
    S.add(shoe);
    this.shoe = shoe;
    // fiş kuleleri
    const chipCols = ['#9a1a14', '#1a5a32', '#141414', '#c8902a', '#2a3a8a'];
    const chipTex = (col) => canvasTex(256, 32, (g, w, h) => {
      g.fillStyle = col; g.fillRect(0, 0, w, h);
      g.fillStyle = '#efe6d0';
      for (let x = 0; x < w; x += 32) g.fillRect(x, 0, 10, h);
    });
    const chipMats = chipCols.map(c => [new THREE.MeshStandardMaterial({ map: chipTex(c), roughness: 0.4 }), new THREE.MeshStandardMaterial({ color: c, roughness: 0.5 }), new THREE.MeshStandardMaterial({ color: c, roughness: 0.5 })]);
    const chipGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.0035, 28);
    const stackAt = (x, z, n, ci) => {
      for (let i = 0; i < n; i++) {
        const m = new THREE.Mesh(chipGeo, chipMats[(ci + (i % 3 === 2 ? 1 : 0)) % chipMats.length]);
        m.position.set(x + rnd(-0.002, 0.002), TABLE_Y + 0.002 + i * 0.0036, z + rnd(-0.002, 0.002));
        m.castShadow = true; m.receiveShadow = true; S.add(m);
      }
    };
    stackAt(-0.6, -0.42, 14, 0); stackAt(-0.55, -0.47, 9, 2); stackAt(-0.66, -0.36, 6, 3);
    stackAt(0.52, 0.38, 8, 1); stackAt(0.57, 0.33, 12, 4);
    // küllük ve sigara
    const tray = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.025, 32), new THREE.MeshPhysicalMaterial({ color: '#8a9a9a', roughness: 0.15, transmission: 0.5, thickness: 0.02, transparent: true, opacity: 0.9 }));
    tray.position.set(-0.68, TABLE_Y + 0.0125, 0.2); tray.castShadow = true; S.add(tray);
    const cig = new THREE.Group();
    const paper = new THREE.Mesh(new THREE.CylinderGeometry(0.0045, 0.0045, 0.07, 12), new THREE.MeshStandardMaterial({ color: '#eee', roughness: 0.8 }));
    paper.rotation.z = Math.PI / 2; cig.add(paper);
    const filt = new THREE.Mesh(new THREE.CylinderGeometry(0.0046, 0.0046, 0.022, 12), new THREE.MeshStandardMaterial({ color: '#c8803a', roughness: 0.8 }));
    filt.rotation.z = Math.PI / 2; filt.position.x = -0.045; cig.add(filt);
    const ember = new THREE.Mesh(new THREE.SphereGeometry(0.005, 10, 8), new THREE.MeshStandardMaterial({ color: '#300', emissive: '#ff4a10', emissiveIntensity: 6 }));
    ember.position.x = 0.036; cig.add(ember);
    cig.position.set(-0.62, TABLE_Y + 0.03, 0.2); cig.rotation.y = -0.4; cig.rotation.z = 0.12;
    S.add(cig);
    this.ember = ember;
    this.smokeSrc = new THREE.Vector3(-0.585, TABLE_Y + 0.04, 0.185);
    this.smokeTex = radialSprite('rgba(200,200,200,.5)');
    // içki bardağı
    const tumbler = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.03, 0.08, 24, 1, true), new THREE.MeshPhysicalMaterial({ color: '#fff', roughness: 0.05, transmission: 0.9, thickness: 0.01, transparent: true, opacity: 0.5, side: THREE.DoubleSide }));
    tumbler.position.set(0.66, TABLE_Y + 0.04, 0.05); S.add(tumbler);
    const whisky = new THREE.Mesh(new THREE.CylinderGeometry(0.031, 0.029, 0.03, 24), new THREE.MeshPhysicalMaterial({ color: '#b8641a', roughness: 0.1, transmission: 0.4, transparent: true, opacity: 0.8 }));
    whisky.position.set(0.66, TABLE_Y + 0.017, 0.05); S.add(whisky);
    // namlu ışığı
    this.flashLight = new THREE.PointLight('#ffb060', 0, 6, 2);
    S.add(this.flashLight);
    this.flashSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: radialSprite('rgba(255,240,200,1)', 'rgba(255,120,20,0)'), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 }));
    this.flashSprite.scale.set(0.35, 0.35, 1);
    S.add(this.flashSprite);
  }

  // ---------------- tabanca: tek etkili altıpatlar (milimetre ölçülerle) ----------------
  buildGun() {
    const env = this.envMap;
    // dokular
    const engrave = canvasTex(512, 512, (g, w, h) => {
      g.fillStyle = '#d9d6cf'; g.fillRect(0, 0, w, h);
      g.strokeStyle = '#5c5a55'; g.lineCap = 'round';
      // kıvrımlı gravür: spiraller ve yapraklar
      for (let n = 0; n < 26; n++) {
        const cx = secureRandom() * w, cy = secureRandom() * h, r0 = rnd(18, 46), dir = secureRandom() < 0.5 ? 1 : -1;
        g.lineWidth = rnd(1.6, 2.6); g.beginPath();
        for (let a = 0; a < Math.PI * 3.2; a += 0.08) {
          const r = r0 * (1 - a / (Math.PI * 3.6));
          const x = cx + Math.cos(a * dir) * r, y = cy + Math.sin(a * dir) * r;
          a === 0 ? g.moveTo(x, y) : g.lineTo(x, y);
        }
        g.stroke();
        for (let k = 0; k < 4; k++) {
          const a = rnd(0, 7), x = cx + Math.cos(a) * r0, y = cy + Math.sin(a) * r0;
          g.lineWidth = 1.4; g.beginPath(); g.ellipse(x, y, 9, 3.5, a, 0, 7); g.stroke();
        }
      }
      speckle(g, w, h, 6000, '#3a3834', 0.8, 0.25);
    }, { repeat: [1 / 70, 1 / 70] });
    const engraveBump = engrave.clone(); engraveBump.colorSpace = THREE.NoColorSpace; engraveBump.needsUpdate = true;
    const walnut = canvasTex(512, 512, (g, w, h) => {
      g.fillStyle = '#4a2410'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 160; i++) {
        const y = secureRandom() * h; g.strokeStyle = `rgba(${rnd(20, 70)},${rnd(8, 25)},0,${rnd(0.15, 0.5)})`; g.lineWidth = rnd(0.6, 3);
        g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= w; x += 16) g.lineTo(x, y + Math.sin(x * 0.02 + i) * 6); g.stroke();
      }
      // baklava kesim (checkering)
      g.strokeStyle = 'rgba(15,6,0,.75)'; g.lineWidth = 1.6;
      for (let i = -h; i < w + h; i += 7) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + h * 0.6, h); g.stroke(); g.beginPath(); g.moveTo(i + h * 0.6, 0); g.lineTo(i, h); g.stroke(); }
    }, { repeat: [1 / 55, 1 / 55] });
    const walnutBump = walnut.clone(); walnutBump.colorSpace = THREE.NoColorSpace; walnutBump.needsUpdate = true;
    const blueNoise = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#7a7a7a'; g.fillRect(0, 0, w, h); speckle(g, w, h, 8000, '#fff', 1.4, 0.25); speckle(g, w, h, 8000, '#000', 1.4, 0.25); }, { color: false, repeat: [1 / 30, 1 / 30] });

    const blued = new THREE.MeshPhysicalMaterial({ color: '#1c222c', metalness: 1, roughness: 0.32, roughnessMap: blueNoise, envMap: env, envMapIntensity: 0.6, clearcoat: 0.4, clearcoatRoughness: 0.25 });
    const bluedDark = new THREE.MeshStandardMaterial({ color: '#12161c', metalness: 1, roughness: 0.45, envMap: env, envMapIntensity: 0.6 });
    const nickel = new THREE.MeshStandardMaterial({ color: '#8f8c86', map: engrave, bumpMap: engraveBump, bumpScale: 2.2, metalness: 1, roughness: 0.3, envMap: env, envMapIntensity: 0.55 });
    const wood = new THREE.MeshPhysicalMaterial({ map: walnut, color: '#9a7a66', bumpMap: walnutBump, bumpScale: 2.5, roughness: 0.55, clearcoat: 0.5, clearcoatRoughness: 0.4, envMap: env, envMapIntensity: 0.3 });
    const gold = new THREE.MeshStandardMaterial({ color: '#c8963e', metalness: 1, roughness: 0.25, envMap: env, envMapIntensity: 0.7 });
    const brass = new THREE.MeshStandardMaterial({ color: '#d4a24a', metalness: 1, roughness: 0.28, envMap: env, envMapIntensity: 1 });
    const copper = new THREE.MeshStandardMaterial({ color: '#b5703a', metalness: 1, roughness: 0.35, envMap: env, envMapIntensity: 0.9 });
    const black = new THREE.MeshBasicMaterial({ color: '#030303' });
    const ext = (shape, depth, mat, bevel = 1.2, segs = 3) => {
      const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: segs, curveSegments: 24 });
      geo.translate(0, 0, -depth / 2);
      const m = new THREE.Mesh(geo, mat); m.castShadow = true; m.receiveShadow = true; return m;
    };
    const model = new THREE.Group();   // milimetre cinsinden kurulur
    model.scale.setScalar(0.001);

    // gövde (gravürlü nikel), silindir penceresiyle
    const fr = new THREE.Shape();
    fr.moveTo(57, 10); fr.lineTo(57, -9); fr.quadraticCurveTo(55, -21, 47, -31); fr.lineTo(43, -37);
    fr.lineTo(8, -39); fr.quadraticCurveTo(0, -39, -4, -43); fr.lineTo(-15, -45);
    fr.bezierCurveTo(-21, -62, -27, -92, -31, -121); fr.quadraticCurveTo(-33, -128, -41, -128);
    fr.lineTo(-58, -127); fr.quadraticCurveTo(-67, -126, -65, -117);
    fr.bezierCurveTo(-63, -90, -55, -60, -43, -41); fr.quadraticCurveTo(-36, -28, -32, -14);
    fr.quadraticCurveTo(-28, 1, -17, 8); fr.lineTo(-6, 13); fr.lineTo(45, 13); fr.quadraticCurveTo(53, 13, 57, 10);
    const win = new THREE.Path();
    win.moveTo(-1, 7.5); win.lineTo(41, 7.5); win.lineTo(41, -34); win.lineTo(-1, -34); win.closePath();
    fr.holes.push(win);
    model.add(ext(fr, 24, nickel, 1.6, 4));
    // geri tepme kalkanı (silindirin arkası)
    const shield = new THREE.Mesh(new THREE.CylinderGeometry(19, 19, 4, 40), nickel);
    shield.rotation.z = Math.PI / 2; shield.position.set(-1.5, -14, 0); model.add(shield);

    // kabza panelleri (ceviz, baklava kesimli) + altın madalyon
    const gp = new THREE.Shape();
    gp.moveTo(-17, -47); gp.bezierCurveTo(-23, -63, -28, -92, -31.5, -117); gp.quadraticCurveTo(-33.5, -123, -41, -123);
    gp.lineTo(-56, -122.5); gp.quadraticCurveTo(-61.5, -121.5, -60.5, -115);
    gp.bezierCurveTo(-58.5, -90, -51, -62, -40, -45); gp.quadraticCurveTo(-29, -39, -17, -47);
    model.add(ext(gp, 30, wood, 3, 5));
    for (const z of [-19, 19]) {
      const med = new THREE.Mesh(new THREE.CylinderGeometry(5.5, 5.5, 1.2, 28), gold);
      med.rotation.x = Math.PI / 2; med.position.set(-42, -70, z); model.add(med);
      const sc = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 1, 16), gold);
      sc.rotation.x = Math.PI / 2; sc.position.set(-44, -98, z); model.add(sc);
    }
    // gövde vidaları
    for (const [x, y] of [[-4, -22], [-21, -4], [49, -22], [10, -36]]) for (const z of [-13.6, 13.6]) {
      const sc = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.1, 0.8, 16), blued);
      sc.rotation.x = Math.PI / 2; sc.position.set(x, y, z); model.add(sc);
      const slot = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.6, 0.4), black);
      slot.position.set(x, y, z + Math.sign(z) * 0.5); slot.rotation.z = rnd(0, 3); model.add(slot);
    }

    // horoz (mahmuzlu) — kendi mili etrafında döner
    const hammerPivot = new THREE.Group(); hammerPivot.position.set(-14, 2, 0); model.add(hammerPivot);
    const hs = new THREE.Shape();
    hs.moveTo(0, 6); hs.lineTo(4, 14); hs.quadraticCurveTo(5, 20, 1, 24); hs.quadraticCurveTo(-6, 30, -14, 30);
    hs.quadraticCurveTo(-20, 30, -20, 26); hs.quadraticCurveTo(-12, 24, -8, 18); hs.lineTo(-7, 6); hs.quadraticCurveTo(-4, 1, 0, 6);
    const hammer = ext(hs, 7, blued, 0.8, 2);
    hammerPivot.add(hammer);
    for (let i = 0; i < 5; i++) { const ln = new THREE.Mesh(new THREE.BoxGeometry(0.6, 3, 8.4), bluedDark); ln.position.set(-17 + i * 2.2, 27.5, 0); ln.rotation.z = 0.6; hammerPivot.add(ln); }
    this.gunHammer = hammerPivot;

    // tetik ve korkuluk
    const ts = new THREE.Shape();
    ts.moveTo(2, -38); ts.quadraticCurveTo(6, -48, 0, -60); ts.quadraticCurveTo(-3, -63, -6, -60); ts.quadraticCurveTo(-1, -50, -3, -38); ts.closePath();
    model.add(ext(ts, 5, blued, 0.6, 2));
    const guard = new THREE.Mesh(new THREE.TorusGeometry(13, 2.4, 12, 40, Math.PI * 1.45), nickel);
    guard.scale.set(1.2, 1, 1); guard.position.set(-2, -50, 0); guard.rotation.z = -Math.PI * 0.22; guard.castShadow = true; model.add(guard);

    // namlu (mavileştirilmiş), ağız halkası, arpacık
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(8.6, 8.9, 125, 48), blued);
    barrel.rotation.z = -Math.PI / 2; barrel.position.set(118.5, 0, 0); barrel.castShadow = true; model.add(barrel);
    const crown = new THREE.Mesh(new THREE.TorusGeometry(7.2, 1.5, 12, 40), blued);
    crown.rotation.y = Math.PI / 2; crown.position.set(181, 0, 0); model.add(crown);
    const bore = new THREE.Mesh(new THREE.CircleGeometry(5.8, 32), black);
    bore.rotation.y = Math.PI / 2; bore.position.set(181.3, 0, 0); model.add(bore);
    const sight = new THREE.Shape(); sight.moveTo(0, 0); sight.lineTo(9, 0); sight.quadraticCurveTo(8, 5, 2, 6); sight.closePath();
    const sightM = ext(sight, 2, blued, 0.4, 1); sightM.position.set(168, 8, 0); model.add(sightM);
    const bushing = new THREE.Mesh(new THREE.CylinderGeometry(10.2, 10.2, 8, 40), nickel);
    bushing.rotation.z = Math.PI / 2; bushing.position.set(61, 0, 0); model.add(bushing);
    // ejektör yuvası ve topuzu
    const ejHouse = new THREE.Mesh(new THREE.CylinderGeometry(4.6, 4.6, 92, 24), blued);
    ejHouse.rotation.z = Math.PI / 2; ejHouse.position.set(106, -12, 3); ejHouse.castShadow = true; model.add(ejHouse);
    const ejRod = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 96, 12), nickel);
    ejRod.rotation.z = Math.PI / 2; ejRod.position.set(104, -12, -1); model.add(ejRod);
    const knob = new THREE.Mesh(new THREE.SphereGeometry(4.5, 20, 14), nickel);
    knob.scale.set(1, 1, 0.6); knob.position.set(145, -14, 7); model.add(knob);
    const pin = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.4, 10, 16), nickel);
    pin.rotation.z = Math.PI / 2; pin.position.set(47, -14, 0); model.add(pin);

    // silindir: pahlı lathe gövde, 6 oluk, hazneler
    const drum = new THREE.Group(); drum.position.set(0, -14, 0); model.add(drum);
    const prof = [[0, 0], [18.5, 0], [21, 2.6], [21, 37.4], [19.2, 40], [0, 40]].map(([r, hh]) => new THREE.Vector2(r, hh));
    const body = new THREE.Mesh(new THREE.LatheGeometry(prof, 64), blued);
    body.rotation.z = -Math.PI / 2; body.castShadow = true; drum.add(body);
    this.chambers = [];
    for (let k = 0; k < 6; k++) {
      const a = k / 6 * Math.PI * 2;
      const y = Math.cos(a) * 14, z = Math.sin(a) * 14;
      const fa = a + Math.PI / 6;
      // oluk: silindir ekseni boyunca uzanan, yüzeye gömülü yassı kapsül
      const fg = new THREE.Group(); fg.rotation.x = fa;
      const flute = new THREE.Mesh(new THREE.CapsuleGeometry(3.6, 18, 6, 12), bluedDark);
      flute.rotation.z = Math.PI / 2; flute.scale.set(0.45, 1, 1); flute.position.set(21, 20.4, 0);
      fg.add(flute); drum.add(fg);
      const hole = new THREE.Mesh(new THREE.CircleGeometry(5.6, 24), black);
      hole.rotation.y = Math.PI / 2; hole.position.set(40.2, y, z); drum.add(hole);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(5.8, 0.7, 8, 24), blued);
      ring.rotation.y = Math.PI / 2; ring.position.set(40, y, z); drum.add(ring);
      const tip = new THREE.Mesh(new THREE.SphereGeometry(4.9, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2), copper);
      tip.rotation.z = -Math.PI / 2; tip.position.set(37.5, y, z); tip.visible = false; drum.add(tip);
      const shell = new THREE.Mesh(new THREE.CylinderGeometry(5.6, 5.6, 1.2, 24), brass);
      shell.rotation.z = Math.PI / 2; shell.position.set(-0.4, y, z); shell.visible = false; drum.add(shell);
      this.chambers.push({ shell, tip });
    }
    this.drum = drum;

    // modeli döndürme noktasına ortala
    model.position.set(-0.04, 0.032, 0);
    this.gunModel = model;
    this.muzzleLocal = new THREE.Vector3(0.181 - 0.04, 0.032, 0);
    const pivot = new THREE.Group();
    pivot.add(model);
    this.gun = pivot;
    this.scene.add(pivot);
    this.gunRestPos = new THREE.Vector3(-0.3, TABLE_Y + 0.022, -0.2);
    this.gunYaw = 0.3;
    this.placeGunOnTable(this.gunYaw);
    this.buildPlayerArm();
  }
  // birinci şahıs: tabancayı tutan eldivenli el ve palto kolu (sadece elde tutulurken görünür)
  buildPlayerArm() {
    const glove = new THREE.MeshStandardMaterial({ color: '#1b1511', roughness: 0.45, metalness: 0.05 });
    const sleeve = new THREE.MeshStandardMaterial({ color: '#241f1b', roughness: 0.9 });
    const hand = new THREE.Group();
    // kabzayı saran yumruk: avuç gövdesi + kabzanın önünde boğumlar
    const fist = new THREE.Mesh(new RoundedBoxGeometry(0.06, 0.095, 0.058, 5, 0.022), glove);
    fist.position.set(-0.084, -0.064, 0); fist.rotation.z = -0.41; fist.castShadow = true; hand.add(fist);
    for (let i = 0; i < 3; i++) {
      const k = new THREE.Mesh(new THREE.SphereGeometry(0.016, 14, 10), glove);
      k.scale.set(0.9, 0.75, 1.75);
      const tY = -0.04 - i * 0.022, tX = -0.054 - i * 0.009;
      k.position.set(tX, tY, 0); hand.add(k);
    }
    const index = new THREE.Mesh(new THREE.CapsuleGeometry(0.0085, 0.03, 4, 10), glove); // tetikteki işaret parmağı
    index.rotation.z = Math.PI / 2 - 0.5; index.position.set(-0.037, -0.024, 0.0); hand.add(index);
    const thumb = new THREE.Mesh(new THREE.CapsuleGeometry(0.0095, 0.032, 4, 10), glove);
    thumb.rotation.z = 1.0; thumb.position.set(-0.066, -0.026, 0.028); hand.add(thumb);
    hand.visible = false;
    this.gun.add(hand);
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(1, 1.15, 1, 20, 1, true), sleeve);
    arm.visible = false; arm.castShadow = false;
    this.camera.add(arm);
    const cuff = new THREE.Mesh(new THREE.TorusGeometry(1, 0.25, 8, 20), sleeve);
    cuff.visible = false; this.camera.add(cuff);
    this.playerArm = { hand, arm, cuff };
  }
  updatePlayerArm() {
    const A = this.playerArm; if (!A) return;
    const held = this.gun.parent === this.camera;
    A.hand.visible = A.arm.visible = A.cuff.visible = held;
    if (!held) return;
    const wrist = this.camera.worldToLocal(this.gun.localToWorld(new THREE.Vector3(-0.1, -0.1, 0)));
    const shoulder = new THREE.Vector3(0.34, -0.5, 0.18);
    const d = wrist.clone().sub(shoulder), len = d.length();
    A.arm.position.copy(shoulder).addScaledVector(d, 0.5);
    A.arm.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), d.clone().normalize());
    A.arm.scale.set(0.05, len, 0.05);
    A.cuff.position.copy(wrist).addScaledVector(d.normalize(), -0.01);
    A.cuff.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), d);
    A.cuff.scale.setScalar(0.047);
  }
  tableQuat(yaw) {
    const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
    const flat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2);
    return q.multiply(flat);
  }
  placeGunOnTable(yaw) {
    if (this.gun.parent !== this.scene) this.scene.attach(this.gun);
    this.gun.position.copy(this.gunRestPos);
    this.gun.quaternion.copy(this.tableQuat(yaw));
  }
  setChambers(loaded) {
    this.chambers.forEach((c, k) => { const b = loaded ? loaded.has(k) : false; c.shell.visible = b; c.tip.visible = b; });
  }

  // ---------------- toz ----------------
  buildDust() {
    const n = 500, pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const y = rnd(0.82, 1.95), r = ((1.95 - y) * 0.45 + 0.06) * 0.9;
      const a = rnd(0, 7), d = Math.sqrt(secureRandom()) * r;
      pos[i * 3] = Math.cos(a) * d; pos[i * 3 + 1] = y; pos[i * 3 + 2] = Math.sin(a) * d + 0.02;
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({ size: 0.0045, map: radialSprite('rgba(255,235,200,1)'), transparent: true, opacity: 0.22, depthWrite: false, blending: THREE.AdditiveBlending, color: '#ffe6c0' });
    this.dust = new THREE.Points(geo, mat);
    this.scene.add(this.dust);
  }

  // ---------------- masadaki mermiler ----------------
  buildBullets() {
    const brass = new THREE.MeshStandardMaterial({ color: '#c8963e', metalness: 1, roughness: 0.28, envMap: this.envMap, envMapIntensity: 0.5 });
    const lead = new THREE.MeshStandardMaterial({ color: '#7a6a5a', metalness: 0.7, roughness: 0.4 });
    this.bulletGeo = { case: new THREE.CylinderGeometry(0.0055, 0.0055, 0.026, 16), tip: new THREE.SphereGeometry(0.0053, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), brass, lead };
    this.bullets = { p: [], a: [] };
  }
  makeBullet() {
    const g = new THREE.Group();
    const c = new THREE.Mesh(this.bulletGeo.case, this.bulletGeo.brass); c.position.y = 0.013; c.castShadow = true; g.add(c);
    const t = new THREE.Mesh(this.bulletGeo.tip, this.bulletGeo.lead); t.position.y = 0.026; t.scale.y = 1.6; t.castShadow = true; g.add(t);
    return g;
  }
  bulletSpot(side, i) {
    return side === 'p' ? new THREE.Vector3(-0.5 + i * 0.03, TABLE_Y, 0.28) : new THREE.Vector3(0.3 + i * 0.03, TABLE_Y, -0.48);
  }
  async setBullets(side, n) {
    const arr = this.bullets[side];
    while (arr.length > n) { const b = arr.pop(); this.scene.remove(b); }
    const adds = [];
    while (arr.length < n) {
      const b = this.makeBullet();
      const target = this.bulletSpot(side, arr.length);
      b.position.copy(target).add(new THREE.Vector3(0, 0.25, 0));
      b.rotation.set(rnd(-1, 1), 0, rnd(-1, 1));
      this.scene.add(b); arr.push(b);
      adds.push(this.tween(0.45, k => {
        b.position.lerpVectors(target.clone().add(new THREE.Vector3(0, 0.25, 0)), target, k);
        b.rotation.x *= 0.85; b.rotation.z *= 0.85;
      }, ease.in).then(() => { b.rotation.set(0, 0, 0); window.SFX && SFX.chip(); }));
      await this.wait(0.12);
    }
    await Promise.all(adds);
  }

  // ---------------- son işlem ----------------
  buildPost() {
    const sz = this.renderer.getDrawingBufferSize(new THREE.Vector2());
    const rt = new THREE.WebGLRenderTarget(sz.x, sz.y, { type: THREE.HalfFloatType, samples: this.mobile ? 2 : 4 });
    const C = this.composer = new EffectComposer(this.renderer, rt);
    C.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.45, 0.55, 1.6);
    C.addPass(this.bloom);
    C.addPass(new OutputPass());
    this.fxPass = new ShaderPass({
      uniforms: {
        tDiffuse: { value: null }, time: { value: 0 }, grain: { value: 0.06 }, vignette: { value: 1.1 },
        chroma: { value: 0.0015 }, red: { value: 0 }, fade: { value: 0 }, flash: { value: 0 }, res: { value: new THREE.Vector2(innerWidth, innerHeight) },
      },
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `
        uniform sampler2D tDiffuse; uniform float time, grain, vignette, chroma, red, fade, flash; uniform vec2 res;
        varying vec2 vUv;
        float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
        void main(){
          vec2 d = vUv - 0.5;
          float r2 = dot(d,d);
          vec2 off = d * chroma * (1.0 + r2 * 4.0);
          vec3 col;
          col.r = texture2D(tDiffuse, vUv + off).r;
          col.g = texture2D(tDiffuse, vUv).g;
          col.b = texture2D(tDiffuse, vUv - off).b;
          float n = hash(vUv * res + fract(time) * 100.0) - 0.5;
          col += n * grain;
          col *= 1.0 - smoothstep(0.15, 0.85, r2 * vignette * 1.6);
          float lum = dot(col, vec3(0.299,0.587,0.114));
          col = mix(col, vec3(lum * 1.4, lum * 0.15, lum * 0.1), red);
          col = mix(col, vec3(1.0), flash);
          col *= 1.0 - fade;
          gl_FragColor = vec4(col, 1.0);
        }`,
    });
    C.addPass(this.fxPass);
  }

  // kare süresi uzunsa çözünürlüğü kademeli düşür, hızlıysa geri yükselt
  adaptQuality(dt) {
    if (document.hidden || this.noAdapt) return;
    const P = this.perf;
    P.ema += (dt - P.ema) * 0.05;
    P.t += dt;
    if (P.t < 2.5) return;
    P.t = 0;
    const R = this.renderer, cur = R.getPixelRatio();
    let next = cur;
    if (P.ema > 1 / 40 && cur > 1) next = Math.max(1, cur - 0.25);
    else if (P.ema < 1 / 58 && cur < this.maxDpr) next = Math.min(this.maxDpr, cur + 0.25);
    if (next !== cur) { R.setPixelRatio(next); this.composer.setSize(innerWidth, innerHeight); this.composer.setPixelRatio && this.composer.setPixelRatio(next); }
  }
  // dikey ekranda masanın tamamı görünsün: kamera geri ve yukarı çekilir, görüş açısı genişler
  frameForAspect() {
    const a = innerWidth / innerHeight;
    const p = Math.max(0, Math.min(1, (1.3 - a) / 0.8));
    this.camBase.pos.set(0, 1.28 + 0.01 * p, 0.92 - 0.12 * p);
    this.camBase.look.set(0, 0.95 - 0.08 * p, -0.45 + 0.15 * p);
    const hfov = 62 - 16 * p; // en az bu kadar yatay görüş
    const vfov = 2 * Math.atan(Math.tan(hfov / 2 * Math.PI / 180) / a) * 180 / Math.PI;
    // çok geniş (yatay telefon) ekranlarda dikey açıyı daraltarak masayı büyüt
    const wide = Math.max(0, Math.min(1, (a - 1.8) / 0.4));
    // alçak ekranda alttaki düğmelere yer aç: kamera biraz yükselip daha aşağı bakar
    const low = Math.max(0, Math.min(1, (520 - innerHeight) / 160));
    this.baseFov = Math.max(52 - 9 * wide * (1 - low) - 0 * low, Math.min(95, vfov));
    this.camBase.pos.y += 0.04 * low; this.camBase.pos.z += 0.02 * low;
    this.camBase.look.y -= 0.02 * low;
    this.pRowZ = 0.02 - 0.12 * low;   // oyuncunun kartları masada biraz ileri

    if (this.camCur && this.mode === 'seat') { this.camCur.pos.copy(this.camBase.pos); this.camCur.look.copy(this.camBase.look); }
  }
  // telefonda: cam ve geçirgen malzemeler sadeleşir
  lowerQuality(root) {
    root.traverse(o => {
      const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
      for (const m of ms) if (m.transmission > 0) { m.transmission = 0; m.transparent = true; m.opacity = Math.min(m.opacity ?? 1, 0.6); m.needsUpdate = true; }
    });
  }
  resize() {
    this.frameForAspect();
    this.camera.aspect = innerWidth / innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(innerWidth, innerHeight);
    this.composer.setSize(innerWidth, innerHeight);
    this.fxPass.uniforms.res.value.set(innerWidth, innerHeight);
  }

  // ---------------- zaman / animasyon ----------------
  tween(dur, fn, e = ease.inOut) {
    return new Promise(res => this.tweens.push({ t: 0, dur: Math.max(0.001, dur), fn, e, res }));
  }
  wait(sec) { return this.tween(sec, () => {}); }
  moveObj(obj, pos, quat, dur, e = ease.inOut, arc = 0) {
    const p0 = obj.position.clone(), q0 = obj.quaternion.clone();
    return this.tween(dur, k => {
      obj.position.lerpVectors(p0, pos, k);
      if (arc) obj.position.y += Math.sin(Math.PI * k) * arc;
      if (quat) obj.quaternion.slerpQuaternions(q0, quat, k);
    }, e);
  }
  shake(a) { this.shakeAmt = Math.max(this.shakeAmt, a); }

  frame() {
    const rawDt = Math.min(0.05, this.clock.getDelta());
    this.adaptQuality(rawDt);
    const dt = rawDt * this.speed;
    const t = this.clock.elapsedTime;
    for (let i = this.tweens.length - 1; i >= 0; i--) {
      const tw = this.tweens[i];
      tw.t += dt;
      const k = Math.min(1, tw.t / tw.dur);
      tw.fn(tw.e(k));
      if (k >= 1) { this.tweens.splice(i, 1); tw.res(); }
    }
    // lamba salınımı ve titreme
    const L = this.lamp;
    L.pivot.rotation.z = Math.sin(t * 0.7) * 0.035;
    L.pivot.rotation.x = Math.sin(t * 0.53 + 1) * 0.02;
    let flick = 1;
    if (secureRandom() < 0.004) this.flickT = 0.25;
    if (this.flickT > 0) { this.flickT -= rawDt; flick = secureRandom() < 0.5 ? 0.25 : 1; }
    L.spot.intensity = L.base * flick * (this.dim ?? 1);
    this.hemi.intensity = 0.18 * (this.dim ?? 1);
    if (this.opp) this.opp.root.traverse(l => { if (l.isLight && l.userData.base !== undefined) l.intensity = l.userData.base * (this.dim ?? 1) * flick; });
    this.rim.intensity = 6 * (this.dim ?? 1);
    this.bulbMat.emissiveIntensity = 9 * flick * (this.dim ?? 1);
    this.beamMat.opacity = 0.007 * flick * (this.dim ?? 1);
    this.ember.material.emissiveIntensity = 5 + Math.sin(t * 3) * 1.5;
    // toz
    this.dust.rotation.y = t * 0.01;
    this.dust.position.y = Math.sin(t * 0.2) * 0.02;
    // duman
    this.updateSmoke(rawDt, t);
    // kamera
    this.updateCamera(rawDt, t);
    this.updatePlayerArm();
    for (const h of this.frameHooks) h(dt, t);
    this.fxPass.uniforms.time.value = t;
    this.composer.render();
  }

  updateCamera(dt, t) {
    const C = this.camera;
    if (this.mode === 'title') {
      this.titleT += dt * 0.08;
      const a = this.titleT;
      const pos = new THREE.Vector3(Math.sin(a) * 1.7, 1.55 + Math.sin(a * 0.7) * 0.1, Math.cos(a) * 1.5);
      C.position.lerp(pos, 0.05);
      C.lookAt(0, 0.95, -0.1);
      if (Math.abs(C.fov - this.baseFov) > 0.01) { C.fov = this.baseFov; C.updateProjectionMatrix(); }
      return;
    }
    if (this.mode === 'free') return; // ölüm sinematiği kamerayı yönetir
    const base = this.camCur;
    this.lean += (this.leanTarget - this.lean) * (1 - Math.pow(0.002, dt));
    const L = this.lean;
    // fare ile hafif bakınma + nefes; eğilince kartlara yaklaş
    const look = base.look.clone().lerp(new THREE.Vector3(0, TABLE_Y, -0.16), L).add(new THREE.Vector3(this.mouse.x * 0.16 * (1 - L * 0.5), -this.mouse.y * 0.09, 0));
    const pos = base.pos.clone().lerp(new THREE.Vector3(0, 1.16, 0.62), L).add(new THREE.Vector3(this.mouse.x * 0.03, Math.sin(t * 1.1) * 0.004, 0));
    if (this.shakeAmt > 0.0001) {
      pos.add(new THREE.Vector3(rnd(-1, 1), rnd(-1, 1), rnd(-1, 1)).multiplyScalar(this.shakeAmt * 0.03));
      look.add(new THREE.Vector3(rnd(-1, 1), rnd(-1, 1), 0).multiplyScalar(this.shakeAmt * 0.05));
      this.shakeAmt *= Math.pow(0.02, dt);
    }
    // sinematik odak (ör. rakip tetiği çekerken yüzüne yakınlaş)
    this.focusW = (this.focusW || 0) + ((this.focusTarget ? 1 : 0) - (this.focusW || 0)) * (1 - Math.pow(0.02, dt));
    if (this.focusTarget) this._focusPt = this.focusTarget.clone();
    if (this._focusPt && this.focusW > 0.001) look.lerp(this._focusPt, this.focusW * 0.85);
    const fov = this.baseFov * (1 - 0.27 * L - 0.3 * this.focusW);
    if (Math.abs(C.fov - fov) > 0.01) { C.fov = fov; C.updateProjectionMatrix(); }
    C.position.lerp(pos, 1 - Math.pow(0.0005, dt));
    this._look = (this._look || look.clone()).lerp(look, 1 - Math.pow(0.0005, dt));
    C.lookAt(this._look);
    if (base.roll) C.rotateZ(base.roll);
  }
  async toSeat() {
    this.mode = 'seat';
    const p0 = this.camera.position.clone();
    this.camCur.pos.copy(p0);
    await this.tween(2.2, k => this.camCur.pos.lerpVectors(p0, this.camBase.pos, k), ease.inOut);
  }
  toTitle() { this.mode = 'title'; }

  // ---------------- duman ----------------
  puff(pos, o = {}) {
    const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.smokeTex, transparent: true, depthWrite: false, opacity: 0, color: o.color || '#bbb' }));
    m.position.copy(pos);
    const s = o.size || 0.03; m.scale.set(s, s, 1);
    this.scene.add(m);
    this.smoke.push({ m, age: 0, life: o.life || rnd(2.5, 4), vel: o.vel || new THREE.Vector3(rnd(-0.004, 0.004), rnd(0.05, 0.08), rnd(-0.004, 0.004)), grow: o.grow || 0.06, op: o.opacity || 0.22 });
  }
  updateSmoke(dt, t) {
    this._smokeT = (this._smokeT || 0) + dt;
    if (this._smokeT > 0.22) { this._smokeT = 0; this.puff(this.smokeSrc); }
    for (let i = this.smoke.length - 1; i >= 0; i--) {
      const p = this.smoke[i];
      p.age += dt;
      const f = p.age / p.life;
      if (f >= 1) { this.scene.remove(p.m); p.m.material.dispose(); this.smoke.splice(i, 1); continue; }
      p.m.position.addScaledVector(p.vel, dt);
      p.m.position.x += Math.sin(t * 1.3 + i) * 0.0006;
      const s = p.m.scale.x + p.grow * dt; p.m.scale.set(s, s, 1);
      p.m.material.opacity = Math.sin(Math.PI * Math.min(1, f * 1.4)) * p.op * (1 - f);
      p.m.material.rotation += dt * 0.3;
    }
  }

  // ---------------- kartlar ----------------
  makeCardMesh(c) {
    const edge = new THREE.MeshStandardMaterial({ color: '#e6dcc4', roughness: 0.8 });
    const face = new THREE.MeshStandardMaterial({ map: cardFaceTex(c), color: '#c9c2b4', roughness: 0.82, bumpMap: linenBump(), bumpScale: 0.35, alphaTest: 0.5 });
    const back = new THREE.MeshStandardMaterial({ map: cardBackTex(), color: '#c9c2b4', roughness: 0.7, bumpMap: linenBump(), bumpScale: 0.35, alphaTest: 0.5 });
    const m = new THREE.Mesh(new THREE.BoxGeometry(CARD_W, CARD_T, CARD_H), [edge, edge, face, back, edge, edge]);
    m.castShadow = true; m.receiveShadow = true;
    return m;
  }
  cardSlot(side, i, n) {
    const z = side === 'p' ? (this.pRowZ ?? 0.02) : -0.43;
    const spread = 0.08;
    const x = (i - (n - 1) / 2) * spread;
    return new THREE.Vector3(x, TABLE_Y + 0.001 + i * 0.0018, z);
  }
  async dealCard(c, side, i, n, faceDown) {
    const m = this.makeCardMesh(c);
    const from = this.shoe.localToWorld(new THREE.Vector3(0, 0.1, 0.02));
    m.position.copy(from);
    m.quaternion.setFromEuler(new THREE.Euler(0, -0.5, Math.PI));
    this.scene.add(m);
    const rec = { c, m, side, down: faceDown };
    this.cards.push(rec);
    // önceki kartları kaydır
    this.relayout(side, n, i);
    const target = this.cardSlot(side, i, n);
    const yaw = rnd(-0.06, 0.06);
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, yaw, faceDown ? Math.PI : 0));
    await this.moveObj(m, target, q, 0.42, ease.out, 0.08);
    return rec;
  }
  relayout(side, n, skipIdx = -1) {
    this.cards.filter(r => r.side === side).forEach((r, i) => {
      if (i === skipIdx) return;
      const tgt = this.cardSlot(side, i, n);
      this.moveObj(r.m, tgt, null, 0.25, ease.out);
    });
  }
  async flipCard(rec) {
    rec.down = false;
    const q0 = rec.m.quaternion.clone();
    const e = new THREE.Euler().setFromQuaternion(q0);
    const q1 = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, e.y, 0));
    const p0 = rec.m.position.clone();
    await this.tween(0.4, k => {
      rec.m.quaternion.slerpQuaternions(q0, q1, k);
      rec.m.position.y = p0.y + Math.sin(Math.PI * k) * 0.06;
    }, ease.inOut);
  }
  async clearCards() {
    const recs = this.cards; this.cards = [];
    const dest = new THREE.Vector3(-0.75, TABLE_Y + 0.01, -0.05);
    await Promise.all(recs.map((r, i) => this.wait(i * 0.04).then(() => this.moveObj(r.m, dest.clone().add(new THREE.Vector3(0, i * 0.002, 0)), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, rnd(-0.3, 0.3), Math.PI)), 0.4, ease.inOut, 0.05))));
    recs.forEach(r => { this.scene.remove(r.m); r.m.geometry.dispose(); r.m.material.forEach(m => m.dispose()); });
  }
  markCards(side, state) {
    for (const r of this.cards) if (r.side === side) {
      const face = r.m.material[2];
      face.emissive = new THREE.Color(state === 'won' ? '#2a5a1a' : state === 'lost' ? '#000' : '#000');
      face.emissiveIntensity = state === 'won' ? 0.5 : 0;
      face.color = new THREE.Color(state === 'lost' ? '#7a7466' : '#c9c2b4');
    }
  }
  // toplam etiketi: kart sırasının sağ ucunun yanında
  anchor(side) {
    const n = Math.max(1, this.cards.filter(r => r.side === side).length);
    const last = this.cardSlot(side, n - 1, n);
    return this.project(new THREE.Vector3(last.x + CARD_W / 2 + 0.07, TABLE_Y, last.z));
  }
  project(v) {
    const p = v.clone().project(this.camera);
    return { x: (p.x + 1) / 2 * innerWidth, y: (1 - p.y) / 2 * innerHeight, visible: p.z < 1 };
  }

  // ---------------- tabanca hareketleri ----------------
  async spinGunTo(side) {
    const target = side === 'p' ? -Math.PI / 2 : Math.PI / 2;
    const y0 = this.gunYaw;
    let y1 = target + Math.PI * 2 * 3 + rnd(-0.12, 0.12);
    while (y1 - y0 < Math.PI * 4) y1 += Math.PI * 2;
    window.SFX && SFX.slide();
    await this.tween(1.8, k => { this.gunYaw = y0 + (y1 - y0) * k; this.gun.quaternion.copy(this.tableQuat(this.gunYaw)); }, ease.out);
    this.gunYaw = ((this.gunYaw % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  }
  // namluyu verilen hedefe çeviren dönüşüm
  aimQuat(dir, up = new THREE.Vector3(0, 1, 0)) {
    const x = dir.clone().normalize();
    const z = new THREE.Vector3().crossVectors(x, up).normalize();
    const y = new THREE.Vector3().crossVectors(z, x).normalize();
    return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
  }
  async gunToPlayerHead() {
    // kameraya bağla, sağ tarafta şakağa doğru tut
    this.camera.attach(this.gun);
    // namlu sağ şakağa döner: oyuncu namlunun içine bakar gibi görür
    const narrow = innerWidth / innerHeight < 1;
    const pos = narrow ? new THREE.Vector3(0.07, -0.09, -0.3) : new THREE.Vector3(0.15, -0.07, -0.27);
    const q = this.aimQuat(new THREE.Vector3(0.2, 0.04, 0.05).sub(pos));
    this.tween(1.0, k => { this.handLight.intensity = k * 0.6; });
    await this.moveObj(this.gun, pos, q, 1.0, ease.inOut);
  }
  // kolu (omuz + dirsek) eli şakağın yanına getirecek şekilde arayarak çöz
  solveHoldPose(target) {
    const P = this.opp, arm = P.armR, elbow = arm.userData.elbow;
    const save = { r: arm.rotation.clone(), e: elbow.rotation.x };
    const hand = new THREE.Vector3();
    const cost = (x, z, e) => {
      arm.rotation.set(x, 0, z); elbow.rotation.x = e; arm.updateMatrixWorld(true);
      return P.handR.getWorldPosition(hand).distanceTo(target);
    };
    let best = { x: 0, z: 0, e: 0, c: Infinity };
    for (let x = -2.6; x <= 0.4; x += 0.2) for (let z = -0.3; z <= 1.6; z += 0.15) for (let e = -2.4; e <= 0.6; e += 0.2) {
      const c = cost(x, z, e); if (c < best.c) best = { x, z, e, c };
    }
    for (let step = 0.08; step > 0.01; step /= 2) for (let it = 0; it < 3; it++) for (const [dx, dz, de] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) {
      const c = cost(best.x + dx * step, best.z + dz * step, best.e + de * step);
      if (c < best.c) best = { x: best.x + dx * step, z: best.z + dz * step, e: best.e + de * step, c };
    }
    cost(best.x, best.z, best.e);
    const handPos = P.handR.getWorldPosition(new THREE.Vector3());
    arm.rotation.copy(save.r); elbow.rotation.x = save.e; arm.updateMatrixWorld(true);
    return { pose: best, handPos };
  }
  async gunToOppHead() {
    const P = this.opp;
    P.root.updateMatrixWorld(true);
    const head = P.head.getWorldPosition(new THREE.Vector3());
    const { pose, handPos } = this.solveHoldPose(head.clone().add(new THREE.Vector3(0.17, -0.03, 0.05)));
    // namlu şakağa, kabza ele
    const q = this.aimQuat(head.clone().add(new THREE.Vector3(0.03, 0.01, 0)).sub(handPos));
    const pos = handPos.clone().sub(new THREE.Vector3(-0.085, -0.053, 0).applyQuaternion(q));
    P.holdPose = pose;
    P.holding = true;
    this.focusTarget = head.clone().add(new THREE.Vector3(0.05, -0.05, 0));
    await this.moveObj(this.gun, pos, q, 1.1, ease.inOut, 0.15);
    P.handR.attach(this.gun);
  }
  async gunBackToTable() {
    this.focusTarget = null;
    this.scene.attach(this.gun);
    this.handLight.intensity = 0;
    if (this.opp) this.opp.holding = false;
    await this.moveObj(this.gun, this.gunRestPos, this.tableQuat(this.gunYaw), 0.8, ease.inOut, 0.1);
    window.SFX && SFX.gunDrop();
  }
  // silindir her hazne geçtiğinde onTick çağrılır (cırcır sesi animasyonla birebir)
  async spinDrum(onTick) {
    const r0 = this.drum.rotation.x;
    const turns = 4 + secureInt(3);
    const step = Math.PI / 3;
    let last = Math.floor(r0 / step);
    await this.tween(1.7, k => {
      this.drum.rotation.x = r0 + k * turns * Math.PI * 2;
      const n = Math.floor(this.drum.rotation.x / step);
      if (n !== last) { last = n; onTick && onTick(); }
    }, ease.out);
  }
  // horoz geriye çekilir: yarı yolda ilk tık, sonda kilitlenme tıkı
  async cockHammer(onHalf, onLock) {
    const h = this.gunHammer;
    await this.tween(0.12, k => { h.rotation.z = k * 0.25; }, ease.in);
    onHalf && onHalf();
    await this.tween(0.1, k => { h.rotation.z = 0.25 + k * 0.3; }, ease.in);
    onLock && onLock();
    this.shake(0.05);
  }
  trembleGun(on) { this.gunTremble = on; }
  // horoz düşer; iğneye çarptığı anda onStrike çağrılır (ses + sonuç tam o anda)
  async fire(bang, onStrike) {
    const h = this.gunHammer;
    const h0 = h.rotation.z;
    await this.tween(0.045, k => { h.rotation.z = h0 * (1 - k); }, ease.in);
    h.rotation.z = 0;
    onStrike && onStrike();
    if (!bang) { this.shake(0.18); return; }
    const muzzle = this.gun.localToWorld(this.muzzleLocal.clone());
    this.flashLight.position.copy(muzzle);
    this.flashSprite.position.copy(muzzle);
    this.flashLight.intensity = 60;
    this.flashSprite.material.opacity = 1;
    this.fxPass.uniforms.flash.value = 0.9;
    this.fxPass.uniforms.chroma.value = 0.03;
    this.bloom.strength = 2.4;
    this.shake(1.6);
    for (let i = 0; i < 10; i++) this.puff(muzzle.clone().add(new THREE.Vector3(rnd(-0.03, 0.03), rnd(-0.02, 0.02), rnd(-0.03, 0.03))), { size: 0.08, grow: 0.25, life: rnd(1.5, 3), opacity: 0.35, vel: new THREE.Vector3(rnd(-0.08, 0.08), rnd(0.04, 0.12), rnd(-0.08, 0.08)) });
    await this.tween(0.6, k => {
      this.flashLight.intensity = 60 * (1 - k) * (1 - k);
      this.flashSprite.material.opacity = Math.max(0, 1 - k * 3);
      this.fxPass.uniforms.flash.value = 0.9 * (1 - k) * (1 - k);
      this.fxPass.uniforms.chroma.value = 0.0015 + 0.03 * (1 - k);
      this.bloom.strength = 0.45 + 1.9 * (1 - k);
    }, ease.linear);
    this.flashSprite.material.opacity = 0;
    this.flashLight.intensity = 0;
  }

  // ---------------- rakip ----------------
  disposeTree(obj) {
    obj.traverse(n => {
      if (n.geometry) n.geometry.dispose();
      const mats = n.material ? (Array.isArray(n.material) ? n.material : [n.material]) : [];
      for (const m of mats) {
        for (const k of ['map', 'emissiveMap', 'bumpMap', 'roughnessMap']) if (m[k] && !m[k].userData.shared) m[k].dispose();
        m.dispose();
      }
    });
  }
  setOpponent(o) {
    if (this.opp) {
      if (this.opp.droppedHat) { this.scene.remove(this.opp.droppedHat); this.disposeTree(this.opp.droppedHat); }
      this.scene.remove(this.opp.root); this.disposeTree(this.opp.root);
      if (this.opp.splat) { this.scene.remove(this.opp.splat); this.opp.splat.geometry.dispose(); this.opp.splat.material.dispose(); }
    }
    const root = new THREE.Group(); root.position.set(0, 0, -1.0);
    const body = new THREE.Group(); root.add(body);   // kalçadan döner
    body.position.y = 0.4;
    const look = o.look || {};
    const coat = new THREE.MeshStandardMaterial({ color: new THREE.Color(look.coat || '#1c1a1a').multiplyScalar(0.7), roughness: 0.92 });
    const shirt = new THREE.MeshStandardMaterial({ color: look.shirt || '#6a645a', roughness: 0.8 });
    const skinMat = new THREE.MeshStandardMaterial({ map: faceTex(look), emissiveMap: eyeTex(), emissive: new THREE.Color(look.eyes || '#ff5a3a'), emissiveIntensity: 3, roughness: 0.7 });
    // sandalye
    const chair = new THREE.Mesh(new RoundedBoxGeometry(0.62, 1.2, 0.08, 3, 0.02), new THREE.MeshStandardMaterial({ map: woodTexture([1, 2], 0.5), roughness: 0.7 }));
    chair.position.set(0, 1.0, -0.28); chair.castShadow = true; root.add(chair);
    // gövde: uzun paltolu, ince bir siluet (lathe ile)
    const prof = [[0, 0.12], [0.16, 0.12], [0.165, 0.2], [0.15, 0.36], [0.165, 0.5], [0.2, 0.6], [0.215, 0.66], [0.205, 0.71], [0.16, 0.75], [0.07, 0.775], [0, 0.78]]
      .map(([r, y]) => new THREE.Vector2(r, y));
    const torso = new THREE.Mesh(new THREE.LatheGeometry(prof, 48), coat);
    torso.scale.z = 0.62; torso.castShadow = true; body.add(torso);
    // gömlek, yaka devrikleri, kravat, düğmeler
    const vShape = new THREE.Shape(); vShape.moveTo(-0.055, 0.735); vShape.lineTo(0.055, 0.735); vShape.lineTo(0, 0.47); vShape.closePath();
    const shirtM = new THREE.Mesh(new THREE.ShapeGeometry(vShape), new THREE.MeshStandardMaterial({ color: new THREE.Color(look.shirt || '#6a645a').multiplyScalar(0.55), roughness: 0.85 }));
    shirtM.position.z = 0.104; body.add(shirtM);
    for (const sx of [-1, 1]) {
      const lp = new THREE.Shape(); lp.moveTo(0, 0); lp.lineTo(sx * 0.07, 0.02); lp.lineTo(sx * 0.045, -0.2); lp.lineTo(0, -0.27); lp.closePath();
      const lapel = new THREE.Mesh(new THREE.ExtrudeGeometry(lp, { depth: 0.008, bevelEnabled: false }), coat);
      lapel.position.set(sx * 0.052, 0.74, 0.1); lapel.rotation.y = sx * 0.25; lapel.castShadow = true; body.add(lapel);
    }
    if (look.tie) {
      const ts = new THREE.Shape(); ts.moveTo(-0.012, 0); ts.lineTo(0.012, 0); ts.lineTo(0.022, -0.2); ts.lineTo(0, -0.235); ts.lineTo(-0.022, -0.2); ts.closePath();
      const tie = new THREE.Mesh(new THREE.ShapeGeometry(ts), new THREE.MeshStandardMaterial({ color: look.tie, roughness: 0.45, side: THREE.DoubleSide }));
      tie.position.set(0, 0.725, 0.107); body.add(tie);
    }
    for (let i = 0; i < 2; i++) {
      const bt = new THREE.Mesh(new THREE.SphereGeometry(0.009, 10, 8), new THREE.MeshStandardMaterial({ color: '#1a1410', roughness: 0.4, metalness: 0.4 }));
      bt.position.set(0.03, 0.4 - i * 0.09, 0.095); bt.scale.z = 0.5; body.add(bt);
    }
    // dik palto yakası boynu saklar
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.066, 0.08, 0.075, 32, 1, true, Math.PI * 0.15, Math.PI * 1.7), new THREE.MeshStandardMaterial({ color: coat.color, roughness: 0.92, side: THREE.DoubleSide }));
    collar.position.y = 0.795; collar.rotation.y = Math.PI / 2 + Math.PI; collar.castShadow = true; body.add(collar);
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.05, 0.1, 16), new THREE.MeshStandardMaterial({ color: new THREE.Color(look.skin || '#b9ab97').multiplyScalar(0.28), roughness: 0.85 }));
    neck.position.y = 0.83; body.add(neck);
    const head = new THREE.Group(); head.position.y = 0.945; body.add(head);
    const skull = new THREE.Mesh(new THREE.SphereGeometry(0.12, 64, 48), skinMat);
    skull.scale.set(0.86, 1.08, 0.93); skull.rotation.y = -Math.PI / 2; skull.castShadow = true; head.add(skull);
    // kollar ve deri eldivenler
    const glove = new THREE.MeshStandardMaterial({ color: '#16110e', roughness: 0.42, metalness: 0.05 });
    const armL = new THREE.Group(), armR = new THREE.Group();
    const mkArm = (g, sx) => {
      g.position.set(sx * 0.2, 0.68, 0);
      const up = new THREE.Mesh(new THREE.CapsuleGeometry(0.047, 0.24, 6, 16), coat);
      up.position.set(-sx * 0.005, -0.14, 0.07); up.rotation.x = 0.55; up.rotation.z = sx * 0.05; up.castShadow = true; g.add(up);
      const elbow = new THREE.Group(); elbow.position.set(0, -0.245, 0.135); g.add(elbow); g.userData.elbow = elbow;
      const fore = new THREE.Mesh(new THREE.CapsuleGeometry(0.042, 0.24, 6, 16), coat);
      fore.position.set(-sx * 0.03, -0.01, 0.155); fore.rotation.x = 1.42; fore.castShadow = true; elbow.add(fore);
      const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.046, 0.046, 0.025, 20), new THREE.MeshStandardMaterial({ color: new THREE.Color(look.shirt || '#6a645a').multiplyScalar(0.6), roughness: 0.8 }));
      cuff.rotation.x = Math.PI / 2; cuff.position.set(-sx * 0.04, -0.017, 0.275); elbow.add(cuff);
      const hand = new THREE.Group(); hand.position.set(-sx * 0.05, -0.025, 0.315);
      const palm = new THREE.Mesh(new RoundedBoxGeometry(0.068, 0.026, 0.078, 3, 0.01), glove); palm.castShadow = true; hand.add(palm);
      for (let f = 0; f < 4; f++) {
        const fin = new THREE.Mesh(new THREE.CapsuleGeometry(0.0085, 0.05, 4, 10), glove);
        fin.rotation.x = Math.PI / 2 - 0.12; fin.position.set((f - 1.5) * 0.016, -0.006, 0.065 - Math.abs(f - 1.5) * 0.006);
        fin.castShadow = true; hand.add(fin);
      }
      const thumb = new THREE.Mesh(new THREE.CapsuleGeometry(0.009, 0.035, 4, 10), glove);
      thumb.rotation.set(Math.PI / 2, 0, sx * 0.7); thumb.position.set(sx * 0.04, -0.004, 0.02); hand.add(thumb);
      elbow.add(hand);
      body.add(g);
      return hand;
    };
    const handL = mkArm(armL, -1), handR = mkArm(armR, 1);
    // masadan yansıyan sıcak ışık yüzü aşağıdan aydınlatır
    const bounce = new THREE.PointLight('#ffb070', 0.45, 0.8, 2);
    bounce.userData.base = 0.45;
    bounce.position.set(0, 1.12, 0.32); root.add(bounce);
    const key = new THREE.SpotLight('#ffe0b0', 2.2, 2.5, 0.13, 0.85, 2);
    key.position.set(0.25, 1.2, 1.0); key.target.position.set(0, 1.38, 0); root.add(key, key.target);
    key.userData.base = 2.2;
    // aksesuarlar
    const acc = this.buildAccessory(o, head, root);
    this.scene.add(root);
    if (this.mobile) this.lowerQuality(root);
    this.opp = { root, body, head, skull, skinMat, armL, armR, handR, acc, o, dead: false, holding: false, think: 0, focus: 'player', fear: 0, pitch: 0.1, yaw: 0, armBase: { x: 0, z: 0 }, armOff: { x: 0, y: 0, z: 0 }, glanceT: 0 };
    if (!this._oppHook) {
      this._oppHook = (dt, t) => this.animateOpp(dt, t);
      this.frameHooks.push(this._oppHook);
    }
  }
  buildAccessory(o, head, root) {
    const id = o.id;
    const metal = new THREE.MeshStandardMaterial({ color: '#888', metalness: 1, roughness: 0.3 });
    const black = new THREE.MeshStandardMaterial({ color: '#0a0a0a', roughness: 0.4 });
    if (id === 'sarhos') {
      const pts = [[0, 0], [0.045, 0], [0.047, 0.17], [0.016, 0.25], [0.015, 0.31], [0, 0.31]].map(p => new THREE.Vector2(...p));
      const bottle = new THREE.Mesh(new THREE.LatheGeometry(pts, 20), new THREE.MeshPhysicalMaterial({ color: '#2a6a2a', roughness: 0.1, transmission: 0.6, thickness: 0.02, transparent: true, opacity: 0.85 }));
      bottle.position.set(-0.35, TABLE_Y, 0.42); bottle.castShadow = true; root.add(bottle);
      // kasket: basık tepe + siper
      const capMat = new THREE.MeshStandardMaterial({ color: '#3a2a1c', roughness: 0.95 });
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.118, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.5), capMat);
      const capG = new THREE.Group(); head.add(capG);
      cap.scale.set(1.0, 0.5, 1.08); cap.position.set(0, 0.06, -0.005); cap.rotation.x = -0.12; capG.add(cap);
      const peak = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.008, 24, 1, false, -Math.PI / 2, Math.PI), capMat);
      peak.position.set(0, 0.06, 0.07); peak.rotation.x = 0.25; capG.add(peak);
      this._sarhosHat = capG;
      return { hat: capG };
    } else if (id === 'kor') {
      for (const x of [-0.045, 0.045]) {
        const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.006, 24), new THREE.MeshStandardMaterial({ color: '#050505', metalness: 0.5, roughness: 0.05 }));
        lens.rotation.x = Math.PI / 2; lens.position.set(x, 0.025, 0.112); head.add(lens);
      }
      const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.004, 0.004), metal); bridge.position.set(0, 0.03, 0.114); head.add(bridge);
      const cane = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 1.0, 10), new THREE.MeshStandardMaterial({ color: '#ddd', roughness: 0.3 }));
      cane.position.set(0.45, 0.9, 0.1); cane.rotation.z = 0.25; root.add(cane);
    } else if (id === 'kasap') {
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.09, 0.003), new THREE.MeshStandardMaterial({ color: '#aab', metalness: 1, roughness: 0.25 }));
      blade.position.set(-0.3, TABLE_Y + 0.04, 0.48); blade.rotation.set(0.1, 0.5, 0); blade.castShadow = true; root.add(blade);
      const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.1, 10), new THREE.MeshStandardMaterial({ color: '#2a1a10' }));
      handle.rotation.z = Math.PI / 2; handle.position.set(-0.4, TABLE_Y + 0.07, 0.43); handle.rotation.y = 0.5; root.add(handle);
      const apron = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.36), new THREE.MeshStandardMaterial({ map: canvasTex(128, 256, (g, w, h) => { g.fillStyle = '#8a8070'; g.fillRect(0, 0, w, h); speckle(g, w, h, 3000, '#000', 1.5, 0.3); for (let i = 0; i < 30; i++) { g.fillStyle = `rgba(110,10,5,${rnd(0.2, 0.7)})`; g.beginPath(); g.arc(rnd(0, w), rnd(0, h), rnd(2, 12), 0, 7); g.fill(); } }), roughness: 0.9 }));
      apron.position.set(0, 0.36, 0.1); apron.material.roughness = 0.95; head.parent.add(apron);
    } else if (id === 'falci') {
      // başörtüsü: alnı ve başın arkasını örter, yüzü açık bırakır
      const scarf = new THREE.Mesh(new THREE.SphereGeometry(0.132, 40, 20, 0, Math.PI * 2, 0, Math.PI * 0.36), new THREE.MeshStandardMaterial({ color: '#3a0e30', roughness: 0.85, side: THREE.DoubleSide }));
      scarf.position.set(0, 0.025, -0.008); scarf.scale.set(0.95, 1.08, 1.02); head.add(scarf);
      const drape = new THREE.Mesh(new THREE.SphereGeometry(0.135, 40, 20, Math.PI * 1.1, Math.PI * 0.8, Math.PI * 0.25, Math.PI * 0.55), scarf.material);
      drape.scale.set(0.97, 1.1, 1.0); drape.position.y = 0.0; head.add(drape);
      for (const x of [-0.05, 0.05]) { const ear = new THREE.Mesh(new THREE.TorusGeometry(0.012, 0.0025, 8, 16), new THREE.MeshStandardMaterial({ color: '#d4a24a', metalness: 1, roughness: 0.25 })); ear.position.set(x * 2, -0.06, 0.01); head.add(ear); }
      const ball = new THREE.Mesh(new THREE.SphereGeometry(0.07, 32, 24), new THREE.MeshPhysicalMaterial({ color: '#b080ff', emissive: '#5a2a9a', emissiveIntensity: 1.5, roughness: 0, transmission: 0.8, thickness: 0.1, transparent: true }));
      ball.position.set(0.32, TABLE_Y + 0.08, 0.45); root.add(ball);
      const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.02, 20), new THREE.MeshStandardMaterial({ color: '#c8902a', metalness: 1, roughness: 0.3 }));
      stand.position.set(0.32, TABLE_Y + 0.01, 0.45); root.add(stand);
      const pl = new THREE.PointLight('#a060ff', 0.8, 1, 2); pl.position.set(0.32, TABLE_Y + 0.1, 0.45); root.add(pl);
      return { ball };
    } else if (id === 'doktor') {
      const mirror = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.005, 24), new THREE.MeshStandardMaterial({ color: '#ddd', metalness: 1, roughness: 0.05 }));
      mirror.rotation.x = Math.PI / 2 - 0.3; mirror.position.set(0, 0.075, 0.108); head.add(mirror);
      const band = new THREE.Mesh(new THREE.TorusGeometry(0.115, 0.006, 8, 48), black); band.rotation.x = Math.PI / 2 - 0.2; band.scale.set(0.9, 0.97, 1); band.position.y = 0.055; head.add(band);
      const syr = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.1, 10), new THREE.MeshPhysicalMaterial({ color: '#fff', transmission: 0.7, transparent: true, roughness: 0.1 }));
      syr.rotation.z = Math.PI / 2; syr.position.set(-0.32, TABLE_Y + 0.008, 0.45); root.add(syr);
    } else if (id === 'tefeci') {
      for (let i = 0; i < 4; i++) {
        const m = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.025, 0.07), new THREE.MeshStandardMaterial({ map: canvasTex(256, 64, (g, w, h) => { g.fillStyle = '#4a6a3a'; g.fillRect(0, 0, w, h); g.fillStyle = '#d8d0b0'; g.fillRect(w * 0.42, 0, w * 0.16, h); speckle(g, w, h, 500, '#000', 1, 0.3); }), roughness: 0.8 }));
        m.position.set(-0.32 + (i % 2) * 0.01, TABLE_Y + 0.0125 + Math.floor(i / 2) * 0.026 + (i % 2) * 0.026, 0.45);
        m.rotation.y = rnd(-0.2, 0.2); m.castShadow = true; root.add(m);
      }
      const gl = new THREE.Mesh(new THREE.TorusGeometry(0.018, 0.003, 8, 24), new THREE.MeshStandardMaterial({ color: '#c8902a', metalness: 1, roughness: 0.2 }));
      gl.position.set(0.04, 0.025, 0.11); head.add(gl);
    } else if (id === 'patron') {
      const hatMat = new THREE.MeshStandardMaterial({ color: '#0c0c0c', roughness: 0.5 });
      const hatG = new THREE.Group(); head.add(hatG);
      const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.01, 32), hatMat); brim.position.y = 0.105; brim.castShadow = true; hatG.add(brim);
      const top = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.105, 0.18, 32), hatMat); top.position.y = 0.2; top.castShadow = true; hatG.add(top);
      const ribbon = new THREE.Mesh(new THREE.CylinderGeometry(0.106, 0.106, 0.03, 32), new THREE.MeshStandardMaterial({ color: '#6a0a0a' })); ribbon.position.y = 0.13; hatG.add(ribbon);
      const cigar = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.1, 12), new THREE.MeshStandardMaterial({ color: '#4a2a14', roughness: 0.9 }));
      cigar.rotation.x = Math.PI / 2 - 0.2; cigar.rotation.z = 0.3; cigar.position.set(0.04, -0.06, 0.15); head.add(cigar);
      const tipM = new THREE.Mesh(new THREE.SphereGeometry(0.009, 10, 8), new THREE.MeshStandardMaterial({ emissive: '#ff4a10', emissiveIntensity: 5, color: '#200' }));
      tipM.position.set(0.055, -0.07, 0.2); head.add(tipM);
      return { cigarTip: tipM, hat: hatG };
    }
    return {};
  }
  animateOpp(dt, t) {
    const P = this.opp; if (!P) return;
    if (P.acc.ball) P.acc.ball.material.emissiveIntensity = 1.2 + Math.sin(t * 2) * 0.6;
    if (this.gunTremble && this.gun.parent === this.camera) {
      this.gun.position.x += Math.sin(t * 50) * 0.0006; this.gun.position.y += Math.cos(t * 43) * 0.0006;
    }
    if (P.dead) return;
    // korku arttıkça nefes hızlanır, kafa titrer
    const fear = P.fear;
    P.body.scale.y = 1 + Math.sin(t * (1.6 + fear * 3)) * (0.008 + fear * 0.006);
    // bakış: oyuncuya / kartlara / tabancaya
    P.glanceT -= dt;
    let tp = 0.06, ty = 0;
    if (P.focus === 'cards' || P.think) { tp = 0.62; ty = Math.sin(t * 0.8) * 0.12; }
    else if (P.focus === 'gun') { tp = 0.12; ty = -0.05; }
    else if (P.glanceT < 0) { if (P.glanceT < -0.9) P.glanceT = rnd(3, 7); tp = 0.55; }
    P.pitch += (tp - P.pitch) * (1 - Math.pow(0.02, dt));
    P.yaw += (ty - P.yaw) * (1 - Math.pow(0.05, dt));
    const shiver = fear * 0.012 * Math.sin(t * 31);
    P.head.rotation.x = P.pitch + Math.sin(t * 0.7) * 0.02;
    P.head.rotation.y = P.yaw + Math.sin(t * 0.4) * 0.06 + shiver;
    P.head.rotation.z = (P.o.id === 'sarhos' ? Math.sin(t * 0.9) * 0.12 : 0) + P.think * 0.06 + shiver;
    // kol: tabancayı tutma pozu + el işaretleri
    const hp = P.holding && P.holdPose ? P.holdPose : { x: 0, z: 0, e: 0 };
    const kk = 1 - Math.pow(0.001, dt);
    P.armBase.x += (hp.x - P.armBase.x) * kk;
    P.armBase.z += (hp.z - P.armBase.z) * kk;
    P.armBase.e = (P.armBase.e || 0) + (hp.e - (P.armBase.e || 0)) * kk;
    P.armR.rotation.set(P.armBase.x + P.armOff.x, P.armOff.y, P.armBase.z + P.armOff.z);
    P.armR.userData.elbow.rotation.x = P.armBase.e;
    if (P.holding) {
      const amp = 0.006 + fear * 0.012;
      P.armR.rotation.x += Math.sin(t * 38) * amp; P.armR.rotation.z += Math.cos(t * 33) * amp;
    }
  }
  // blackjack el işaretleri: kart için masaya vurma, durmak için el sallama
  async oppGesture(kind) {
    const P = this.opp; if (!P || P.dead) return;
    const o = P.armOff;
    if (kind === 'hit') {
      for (let i = 0; i < 2; i++) {
        await this.tween(0.12, k => { o.x = -0.22 * k; }, ease.out);
        await this.tween(0.1, k => { o.x = -0.22 * (1 - k); }, ease.in);
        window.SFX && SFX.knock();
      }
    } else {
      await this.tween(0.15, k => { o.x = -0.12 * k; }, ease.out);
      await this.tween(0.5, k => { o.y = Math.sin(k * Math.PI * 2) * 0.3; }, ease.inOut);
      await this.tween(0.15, k => { o.x = -0.12 * (1 - k); }, ease.in);
      o.y = 0;
    }
  }
  setOppFocus(f) { if (this.opp) this.opp.focus = f; }
  setOppFear(v) { if (this.opp) this.opp.fear = v; }
  // ölen rakibin ardındaki duvarda koyu bir iz
  splatter() {
    if (!this._splatTex) {
      this._splatTex = canvasTex(512, 512, (g, w, h) => {
        g.clearRect(0, 0, w, h);
        const drop = (x, y, r, a) => { g.fillStyle = `rgba(${rnd(55, 85)},4,4,${a})`; g.beginPath(); g.ellipse(x, y, r, r * rnd(0.6, 1), rnd(0, 3), 0, 7); g.fill(); };
        drop(w / 2, h / 2, 70, 0.9);
        for (let i = 0; i < 70; i++) { const a = rnd(0, 7), d = rnd(40, 230); drop(w / 2 + Math.cos(a) * d, h / 2 + Math.sin(a) * d * 0.8, rnd(3, 22) * (1 - d / 300), rnd(0.5, 0.9)); }
        for (let i = 0; i < 9; i++) { const x = w / 2 + rnd(-90, 90); g.fillStyle = 'rgba(60,3,3,.8)'; g.fillRect(x, h / 2, rnd(3, 7), rnd(60, 200)); }
      });
    }
    this._splatTex.userData.shared = true;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), new THREE.MeshStandardMaterial({ map: this._splatTex, transparent: true, roughness: 0.3, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
    m.position.set(rnd(-0.1, 0.1), 1.42, -1.235); m.rotation.z = rnd(0, 6); m.scale.setScalar(0.01);
    this.opp.root.parent.add(m);
    this.opp.splat = m;
    this.tween(0.12, k => m.scale.setScalar(0.01 + k), ease.out);
  }
  // ışıklar söner, ceset götürülür, yeni rakip oturur, ışıklar yanar
  async swapOpponent(o) {
    window.SFX && SFX.flicker();
    await this.tween(0.6, k => { this.dim = 1 - k; });
    this.dim = 0;
    if (this.opp && this.opp.dead) window.SFX && SFX.drag();
    await this.wait(0.9);
    if (this.opp && this.opp.splat) { this.scene.remove(this.opp.splat); }
    this.setOpponent(o);
    this.placeGunOnTable(0.3);
    window.SFX && SFX.chair();
    await this.wait(0.7);
    window.SFX && SFX.flicker();
    this.flickT = 0.5;
    await this.tween(0.8, k => { this.dim = k; });
    this.dim = 1;
  }
  async oppDie() {
    const P = this.opp;
    P.dead = true;
    P.skinMat.emissiveIntensity = 0;
    const h0 = P.head.rotation.x;
    // kafa geriye savrulur
    this.splatter();
    await this.tween(0.12, k => { P.head.rotation.x = h0 - k * 0.9; P.head.rotation.z = k * 0.4; }, ease.out);
    if (P.acc.hat) { // şapka kafadan uçup masaya düşer
      const hat = P.acc.hat; this.scene.attach(hat);
      const hp = hat.position.clone();
      this.moveObj(hat, new THREE.Vector3(hp.x + rnd(-0.25, 0.25), TABLE_Y + 0.1, hp.z + 0.32), new THREE.Quaternion().setFromEuler(new THREE.Euler(rnd(1.2, 1.7), rnd(0, 3), rnd(-0.3, 0.3))), 0.7, ease.in, 0.12);
      P.droppedHat = hat;
    }
    this.scene.attach(this.gun);
    P.holding = false;
    // tabanca düşer
    const gp = this.gun.position.clone();
    this.moveObj(this.gun, new THREE.Vector3(gp.x + 0.1, TABLE_Y + 0.016, -0.5), this.tableQuat(rnd(0, 6)), 0.6, ease.in).then(() => window.SFX && SFX.gunDrop());
    await this.wait(0.35);
    // gövde öne masaya yığılır
    const b0 = P.body.rotation.x;
    const a0 = P.armR.rotation.x, z0 = P.armR.rotation.z, e0 = P.armR.userData.elbow.rotation.x;
    await this.tween(0.55, k => { P.body.rotation.x = b0 + k * 0.95; P.head.rotation.x = h0 - 0.9 + k * 1.5; P.armR.rotation.x = a0 * (1 - k) + 0.4 * k; P.armR.rotation.z = z0 * (1 - k); P.armR.userData.elbow.rotation.x = e0 * (1 - k); }, ease.in);
    window.SFX && SFX.thud();
    this.shake(0.4);
    this.focusTarget = null;
    await this.tween(0.25, k => { P.body.rotation.x = b0 + 0.95 - Math.sin(k * Math.PI) * 0.05; }, ease.out);
    // gun position resets for next opponent
  }
  async playerDie() {
    this.mode = 'free';
    // tabanca elden kayıp masaya düşer
    if (this.gun.parent === this.camera) {
      this.scene.attach(this.gun);
      const gp = this.gun.position.clone();
      this.moveObj(this.gun, new THREE.Vector3(gp.x * 0.5 + 0.12, TABLE_Y + 0.022, 0.28), this.tableQuat(rnd(-1, 1)), 0.75, ease.in, 0.05)
        .then(() => { window.SFX && SFX.gunDrop(); });
    }
    const C = this.camera;
    const p0 = C.position.clone(), q0 = C.quaternion.clone();
    const p1 = new THREE.Vector3(0.35, TABLE_Y + 0.08, 0.55);
    const q1 = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.2, 0.9, 1.35));
    this.fxPass.uniforms.red.value = 0;
    await this.tween(1.2, k => {
      C.position.lerpVectors(p0, p1, k);
      C.quaternion.slerpQuaternions(q0, q1, k);
      this.fxPass.uniforms.red.value = k * 0.85;
    }, ease.in);
    window.SFX && SFX.thud();
    this.shake(0.3);
    await this.tween(2.2, k => { this.fxPass.uniforms.fade.value = k * 0.92; }, ease.inOut);
  }
  // tüm animasyonları kes ve sahneyi temiz bir masaya döndür (çıkış / yeniden başlatma)
  hardReset() {
    this.tweens.length = 0;
    this.focusTarget = null; this.focusW = 0;
    for (const r of this.cards) { this.scene.remove(r.m); r.m.geometry.dispose(); r.m.material.forEach(m => m.dispose()); }
    this.cards = [];
    this.gunTremble = false;
    if (this.opp) { this.opp.holding = false; this.opp.think = 0; }
    this.handLight.intensity = 0;
    this.flashLight.intensity = 0; this.flashSprite.material.opacity = 0;
    this.gunHammer.rotation.z = 0;
    this.setChambers(null);
    this.bloom.strength = 0.45;
    const u = this.fxPass.uniforms; u.flash.value = 0; u.red.value = 0; u.fade.value = 0; u.chroma.value = 0.0015;
    this.dim = 1; this.flickT = 0; this.shakeAmt = 0;
    this.leanTarget = 0; this.lean = 0;
    for (const side of ['p', 'a']) { for (const b of this.bullets[side]) this.scene.remove(b); this.bullets[side] = []; }
    this.mode = 'seat';
    this.placeGunOnTable(this.gunYaw);
  }
  resetAfterDeath() {
    this.fxPass.uniforms.red.value = 0;
    this.fxPass.uniforms.fade.value = 0;
    this.mode = 'seat';
    this.placeGunOnTable(this.gunYaw);
  }
  setTension(v) {
    this.fxPass.uniforms.vignette.value = 1.1 + v * 0.9;
    this.fxPass.uniforms.grain.value = 0.06 + v * 0.05;
  }
  async lampFlicker(sec = 0.8) {
    this.flickT = sec;
    window.SFX && SFX.flicker();
    await this.wait(sec);
  }
}
