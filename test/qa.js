// SON EL — tarayıcı içi otomatik test botu
// Kullanım (konsolda): import('/test/qa.js').then(m => m.start({ runs: 3, speed: 6 }))
// Panel gizliyken requestAnimationFrame durduğu için kareleri kendisi sürer.

export const Q = { errs: [], warns: [], log: [], runs: [], checks: 0 };
let bot = null, pumping = false;

function pump(W) {
  if (pumping) return;
  pumping = true;
  const mc = new MessageChannel(); let last = 0;
  mc.port1.onmessage = () => {
    if (!pumping) return;
    const now = performance.now();
    if (now - last > 15) { last = now; try { W.frame(); } catch (e) { Q.errs.push('frame: ' + e.message); } }
    mc.port2.postMessage(0);
  };
  mc.port2.postMessage(0);
}

// her adımda tutarlılık denetimi
function check(S) {
  const R = S.R, W = S.W;
  if (!R || !W) return;
  Q.checks++;
  const warn = m => { if (!Q.warns.includes(m)) Q.warns.push(m); };
  const cp = W.camera.position;
  if (![cp.x, cp.y, cp.z].every(Number.isFinite)) warn('kamera NaN');
  if (R.phase === 'player' && !R.busy) {
    const n = R.p.cards.length + R.a.cards.length;
    if (W.cards.length !== n) warn(`kart sayısı uyuşmuyor: sahne ${W.cards.length} / durum ${n}`);
    if (W.bullets.p.length !== R.p.bullets) warn(`oyuncu mermi: sahne ${W.bullets.p.length} / durum ${R.p.bullets}`);
    if (W.bullets.a.length !== R.a.bullets) warn(`rakip mermi: sahne ${W.bullets.a.length} / durum ${R.a.bullets}`);
    if (document.querySelector('#btn-hit').disabled) warn('oyuncu sırası ama düğme kapalı');
    if (W.gun.parent !== W.scene) warn('oyuncu sırasında tabanca masada değil');
    const lp = document.querySelector('#lbl-p').textContent;
    if (!lp) warn('oyuncu toplam etiketi boş');
    const r = document.querySelector('#lbl-p').getBoundingClientRect();
    const b = document.querySelector('#actions').getBoundingClientRect();
    if (r.bottom > b.top + 4 && r.right > b.left && r.left < b.right) warn('oyuncu etiketi düğmelerin altında kalıyor');
    if (r.top < 0 || r.bottom > innerHeight) warn('oyuncu etiketi ekran dışında');
    const ra = document.querySelector('#lbl-a').getBoundingClientRect();
    if (ra.top < 110) warn('rakip etiketi üst başlığın altında kalıyor');
  }
}

function decide(S) {
  const R = S.R; const p = R.p.cards, a = R.a.cards;
  if (R.first === 'a') {
    const at = handValue(a).total, pt = handValue(p).total;
    return (pt < at || (pt === at && pt <= 16)) ? 'hit' : 'stand';
  }
  if (basicDouble(p, a[0])) return 'double';
  return basicHit(p, a[0]) ? 'hit' : 'stand';
}

export function start(opts = {}) {
  const S = window.__sonel;
  const runs = opts.runs ?? 2, speed = opts.speed ?? 6;
  addEventListener('error', e => Q.errs.push(e.message));
  addEventListener('unhandledrejection', e => Q.errs.push('rej ' + (e.reason && e.reason.stack || e.reason)));
  pump(S.W);
  S.W.speed = speed;
  let started = false;
  bot = setInterval(() => {
    try {
      check(S);
      const mb = document.querySelector('#modal-root .modal-bg:not(.out) .mbtn');
      if (mb) {
        const h = document.querySelector('#modal-root .modal-bg:not(.out) h2')?.textContent || '';
        Q.log.push(`${S.G ? S.G.idx : '-'}: ${h}`);
        if (/Öldün|Son el senindi/.test(h)) {
          Q.runs.push({ reached: S.G.idx, won: /Son el/.test(h), hands: S.G.stats.hands });
          if (Q.runs.length >= runs) { stop(); return; }
        }
        mb.click(); return;
      }
      const fire = document.querySelector('#pull-fire');
      if (fire) {
        const pass = document.querySelector('#pull-pass');
        (pass && S.R.p.bullets >= 2 ? pass : fire).click();
        return;
      }
      if (!started && document.querySelector('#title.active')) { started = true; document.querySelector('#btn-new').click(); return; }
      if (S.R && S.R.phase === 'player' && !S.R.busy) {
        const d = decide(S);
        d === 'hit' ? S.playerHit() : d === 'double' ? S.playerDouble() : S.playerStand();
      }
    } catch (e) { Q.errs.push('bot: ' + e.stack); }
  }, 120);
  return Q;
}
export function stop() { clearInterval(bot); bot = null; }
export function stopPump() { pumping = false; }
window.__qa = { Q, start, stop, stopPump };

// 3B sahnenin anlık görüntüsünü yerel test sunucusuna gönderir (panel gizliyken de çalışır)
export function shot(name, port = 8766) {
  const W = window.__sonel.W;
  W.composer.render();
  return new Promise(res => W.renderer.domElement.toBlob(b => {
    fetch(`http://127.0.0.1:${port}/?name=${encodeURIComponent(name)}`, { method: 'POST', body: b }).then(() => res('ok'), e => res('err ' + e));
  }, 'image/jpeg', 0.88));
}
window.__qa.shot = shot;
