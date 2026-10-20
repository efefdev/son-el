// SON EL — 3B oyun akışı: kurallar (rules.js) + dünya (scene.js) + arayüz
import { World } from './scene.js';

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const pick = a => a[secureInt(a.length)];

const SETTINGS = (() => {
  let s = { speed: 1, sound: true };
  try { Object.assign(s, JSON.parse(localStorage.getItem('sonel-settings') || '{}')); } catch (e) {}
  return s;
})();
function saveSettings() { try { localStorage.setItem('sonel-settings', JSON.stringify(SETTINGS)); } catch (e) {} }

const PASSES = 2;
let W = null;   // 3B dünya
let G = null;   // koşu
let R = null;   // masa
// her koşunun kimliği: çıkışta artar, eski akışlar sessizce donar
let RUN = 0;
const halt = () => new Promise(() => {});
const sleep = ms => { const t = RUN; return W.wait(ms / 1000).then(() => (t === RUN ? undefined : halt())); };
const alive = t => t === RUN;

// ================= AÇILIŞ =================
async function boot() {
  try {
    await Promise.race([
      Promise.all([
        document.fonts.load('400 150px "Bebas Neue"'),
        document.fonts.load('900 74px "Playfair Display"'),
        document.fonts.load('700 40px "Courier Prime"'),
      ]),
      new Promise(r => setTimeout(r, 2500)),
    ]);
    W = new World($('#c'));
    W.speed = SETTINGS.speed;
    W.frameHooks.push(updateLabels);
    W.setOpponent(OPPONENTS[0]);
    // sahne birkaç kare çizilsin (oyun zamanlayıcısından bağımsız: sıfırlanınca takılmaz)
    await new Promise(r => setTimeout(r, 600));
    document.body.classList.remove('loading');
    setTimeout(() => { $('#loader').style.display = 'none'; }, 1400);
    if (!G) { show('title'); renderRecord(); }
  } catch (e) {
    console.error(e);
    $('.ld-txt').classList.add('err');
    $('.ld-txt').textContent = 'WebGL başlatılamadı ya da Three.js yüklenemedi (internet bağlantısı gerekli). Hata: ' + e.message;
  }
}

function show(id) {
  $$('.overlay').forEach(o => o.classList.toggle('active', o.id === id));
}

// ================= KOŞU =================
async function newRun() {
  SFX.init();
  RUN++;
  W.hardReset();
  SFX.heartStop();
  finishPull();
  G = { idx: 0, stats: { hands: 0, won: 0, lost: 0, pulls: 0, survived: 0 } };
  W.resetAfterDeath();
  document.body.classList.remove('pulling', 'cine');
  show('hud');
  hideHUDBits();
  await W.toSeat();
  showIntro();
}

function hideHUDBits() {
  $('#lbl-a').textContent = ''; $('#lbl-p').textContent = '';
  setMsg('');
  $('#actions').classList.add('hide');
}

function ladderHtml() {
  return `<div class="ladder">${OPPONENTS.map((o, i) => `<span class="${i < G.idx ? 'dead' : i === G.idx ? 'now' : 'later'}" title="${o.name}">${o.icon}</span>`).join('')}</div>`;
}

async function showIntro() {
  const o = OPPONENTS[G.idx];
  if (!W.opp || W.opp.o !== o || W.opp.dead) {
    // ışıklar söner, eski ceset götürülür, yeni rakip oturur
    const t = RUN;
    await W.setBullets('p', 0); await W.setBullets('a', 0);
    await W.swapOpponent(o);
    if (!alive(t)) return halt();
  }
  $('#h-table').textContent = G.idx + 1;
  $('#o-name').textContent = o.name;
  $('#o-quirk').textContent = o.quirk;
  await modal(`<div class="stamp">${o.title}</div>
    <div class="photo"><span>${o.icon}</span></div>
    <h2>${o.name}</h2>
    <p><i>${o.quirk}</i></p>
    ${ladderHtml()}`, [{ label: 'Otur' }]);
  startDuel();
}

// ================= MASA =================
function startDuel() {
  const o = OPPONENTS[G.idx];
  R = {
    opp: o, shoe: newShoe(), handNo: 0, first: 'p', phase: 'idle', busy: true,
    p: { cards: [], bullets: o.id === 'tefeci' ? 1 : 0, passes: PASSES },
    a: { cards: [], bullets: 0, healed: false },
    doubled: null, hole: null, over: false,
  };
  renderCyl();
  W.setBullets('p', R.p.bullets);
  W.setOppFocus('player');
  SFX.shuffle();
  say('start');
  if (o.id !== 'sarhos') tip('quirk-' + o.id, `<b>${o.name}</b>: ${o.quirk}`);
  if (o.id === 'tefeci') setMsg('Borç: silindirinde 1 mermi', 'lose small');
  sleep(1400).then(nextHand);
}

function renderCyl() {
  const cyl = n => { let s = ''; for (let k = 0; k < 6; k++) s += `<i class="${k < n ? 'b' : ''}" style="--k:${k}"></i>`; return s; };
  $('#p-cyl').innerHTML = cyl(R.p.bullets);
  $('#o-cyl').innerHTML = cyl(R.a.bullets);
  $('#p-odds').textContent = `${R.p.bullets}/6`;
  $('#o-odds').textContent = `${R.a.bullets}/6`;
  $('#p-pass').innerHTML = `Pas hakkı: <b>${'●'.repeat(R.p.passes)}${'○'.repeat(PASSES - R.p.passes)}</b>`;
  const tension = Math.max(R.p.bullets, R.a.bullets) / 6;
  W.setOppFear(R.a.bullets / 6);
  W.setTension(R.p.bullets / 6);
  SFX.tension(tension);
}

function totalText(cards, hidden) {
  if (!cards.length) return '';
  if (hidden) return `${cardVal(cards[0])} + ?`;
  const v = handValue(cards);
  return v.soft && v.total < 21 ? `${v.total - 10} / ${v.total}` : String(v.total);
}
function renderTotals() {
  const lp = $('#lbl-p'), la = $('#lbl-a');
  lp.textContent = totalText(R.p.cards);
  la.textContent = totalText(R.a.cards, R.hole && R.hole.down);
  const cls = (cards, el, hidden) => {
    el.className = 'tlabel';
    if (hidden || !cards.length) return;
    if (handValue(cards).total > 21) el.classList.add('bust');
    else if (isBlackjack(cards)) el.classList.add('bj');
  };
  cls(R.p.cards, lp); cls(R.a.cards, la, R.hole && R.hole.down);
}
function updateLabels() {
  if (!R || !W || W.mode !== 'seat') return;
  const a = W.anchor('a'), p = W.anchor('p');
  $('#lbl-a').style.left = a.x + 'px'; $('#lbl-a').style.top = a.y + 'px';
  $('#lbl-p').style.left = p.x + 'px'; $('#lbl-p').style.top = p.y + 'px';
}

function setButtons() {
  const can = R && R.phase === 'player' && !R.busy;
  $('#actions').classList.toggle('hide', !can);
  $('#btn-hit').disabled = !can;
  $('#btn-stand').disabled = !can;
  $('#btn-double').disabled = !can || R.p.cards.length !== 2;
}
function setMsg(text, cls = '') {
  const m = $('#msg');
  m.textContent = text;
  m.className = 'msg ' + cls;
  if (text) { void m.offsetWidth; m.classList.add('pulse'); }
}
function setTurnInfo() {
  $('#turn-info').innerHTML = `El ${R.handNo} · ${leanHint()}<br>` + (R.first === 'p'
    ? '<b>Önce sen</b> oynuyorsun. Rakibin bir kartı kapalı.'
    : '<b>Önce rakip</b> oynuyor. Senin ikinci kartını göremez; sen onun elini görerek karar verirsin.');
}

async function dealTo(side, hidden = false) {
  const c = R.shoe.pop();
  R[side].cards.push(c);
  const n = R[side].cards.length;
  SFX.card();
  const p = W.dealCard(c, side, n - 1, n, hidden);
  if (hidden) R.hole = { down: true, rec: null, p };
  const rec = await p;
  if (hidden) R.hole.rec = rec;
  renderTotals();
  await sleep(120);
}

async function nextHand() {
  if (R.over) return;
  R.busy = true; R.phase = 'deal'; setButtons();
  if (R.p.cards.length || R.a.cards.length) { SFX.slide(); await W.clearCards(); }
  R.p.cards = []; R.a.cards = []; R.hole = null;
  renderTotals();
  if (R.shoe.length < 15) { R.shoe = newShoe(); setMsg('Deste karıldı', 'small'); SFX.shuffle(); await sleep(1300); }
  R.handNo++; G.stats.hands++;
  R.first = R.handNo % 2 === 1 ? 'p' : 'a';
  R.doubled = null;
  setTurnInfo();
  setMsg('');
  await dealTo('p'); await dealTo('a');
  await dealTo('p'); await dealTo('a', R.first === 'p');
  if (isBlackjack(R.p.cards) || isBlackjack(R.a.cards)) { await revealHole(); return resolve(); }
  if (R.first === 'a') {
    await aiTurn(false);
    if (handValue(R.a.cards).total > 21) return resolve();
  }
  R.phase = 'player'; R.busy = false;
  setMsg('Senin hamlen', 'small');
  setButtons();
  if (R.handNo === 1) tip('first', '21\'e yaklaş ama geçme. <b>Kart Çek</b> ya da <b>Dur</b>. Kartları okumakta zorlanırsan ' + (W.mobile ? '<b>👁</b> düğmesine dokunup masaya eğil.' : '<b>Shift</b> ya da <b>sağ tık</b> basılı tutarak masaya eğil.'));
  else if (R.first === 'a') tip('second', 'Bu el <b>önce rakip</b> oynadı. Onun toplamını görüyorsun: geçmen gereken sayı belli.');
}

async function revealHole() {
  if (!R.hole || !R.hole.down) return;
  R.hole.down = false;
  SFX.flip();
  await W.flipCard(R.hole.rec);
  renderTotals();
  await sleep(300);
}

async function aiTurn(second) {
  R.busy = true; setButtons();
  W.opp.think = 1;
  W.setOppFocus('cards');
  setMsg(`${R.opp.name} düşünüyor…`, 'small');
  await sleep(900);
  if (!second && aiWantsDouble(R.opp.ai, R.a.cards, R.p.cards)) {
    R.doubled = 'a';
    SFX.chip();
    setMsg('Rakip ikiye katladı!', 'lose small');
    await sleep(800);
    await dealTo('a');
  } else {
    let guard = 0;
    while (aiWantsHit(R.opp.ai, R.a.cards, R.p.cards, second, R.shoe) && guard++ < 10) {
      setMsg('Kart istiyor', 'small');
      await W.oppGesture('hit');
      await dealTo('a');
      await sleep(300);
    }
    const t = handValue(R.a.cards).total;
    if (t <= 21) await W.oppGesture('stand');
    setMsg(t > 21 ? 'Rakip patladı!' : `Rakip ${t}'de durdu`, t > 21 ? 'win small' : 'small');
  }
  W.opp.think = 0;
  W.setOppFocus('player');
  await sleep(700);
}

// ---- oyuncu ----
async function playerHit() {
  if (!R || R.phase !== 'player' || R.busy) return;
  R.busy = true; setButtons();
  await dealTo('p');
  const t = handValue(R.p.cards).total;
  if (t > 21) { setMsg('Patladın!', 'lose'); await sleep(700); return afterPlayer(); }
  if (t === 21) { await sleep(300); return afterPlayer(); }
  R.busy = false; setButtons();
}
function playerStand() {
  if (!R || R.phase !== 'player' || R.busy) return;
  R.busy = true; setButtons();
  afterPlayer();
}
async function playerDouble() {
  if (!R || R.phase !== 'player' || R.busy || R.p.cards.length !== 2) return;
  R.busy = true; setButtons();
  R.doubled = 'p';
  SFX.chip();
  setMsg('İkiye katladın: kaybeden 2 mermi yükler', 'push small');
  await sleep(800);
  await dealTo('p');
  if (handValue(R.p.cards).total > 21) { setMsg('Patladın!', 'lose'); await sleep(700); }
  afterPlayer();
}
async function afterPlayer() {
  R.phase = 'ai';
  if (R.first === 'p') {
    await revealHole();
    if (handValue(R.p.cards).total <= 21) await aiTurn(true);
  }
  resolve();
}

// ---- sonuç ----
async function resolve() {
  R.phase = 'result'; R.busy = true; setButtons();
  await revealHole();
  const pt = handValue(R.p.cards).total, at = handValue(R.a.cards).total;
  const pbj = isBlackjack(R.p.cards), abj = isBlackjack(R.a.cards);
  let res, extra = 0, why = '';
  if (pbj && abj) { res = 0; why = 'İki Blackjack'; }
  else if (pbj) { res = 1; extra = 1; why = 'BLACKJACK! Rakip 2 mermi yükler'; }
  else if (abj) { res = -1; extra = R.opp.id === 'kasap' ? 1 : 0; why = 'Rakip Blackjack yaptı' + (extra ? ': 2 mermi!' : ''); }
  else if (pt > 21 && at > 21) { res = 0; why = 'İkiniz de patladınız'; }
  else if (pt > 21) { res = -1; why = 'Patladın'; }
  else if (at > 21) { res = 1; why = 'Rakip patladı'; }
  else if (pt > at) { res = 1; why = `${pt} > ${at}`; }
  else if (pt < at) { res = -1; why = `${pt} < ${at}`; }
  else { res = 0; why = `${pt} = ${at}`; }
  if (res !== 0 && R.doubled) extra += 1;

  if (res === 0) {
    setMsg('BERABERE', 'push'); SFX.push();
    await sleep(1600);
    return nextHand();
  }
  const loser = res === 1 ? 'a' : 'p';
  W.markCards(loser, 'lost'); W.markCards(loser === 'p' ? 'a' : 'p', 'won');
  if (res === 1) { G.stats.won++; SFX.win(); setMsg('KAZANDIN', 'win'); say('lose'); }
  else { G.stats.lost++; SFX.lose(); setMsg('KAYBETTİN', 'lose'); say('win'); }
  await sleep(900);
  setMsg(why, (res === 1 ? 'win' : 'lose') + ' small');
  await sleep(700);
  setMsg('');
  await W.spinGunTo(loser);
  R[loser].bullets = Math.min(6, R[loser].bullets + 1 + extra);
  renderCyl();
  await W.setBullets(loser, R[loser].bullets);
  await sleep(300);
  await pullScene(loser);
}

// ================= TETİK =================
async function pullScene(who) {
  const me = who === 'p';
  const o = R.opp;
  if (!me && o.id === 'doktor' && !R.a.healed && R.a.bullets >= 2) {
    R.a.healed = true; R.a.bullets--;
    renderCyl(); await W.setBullets('a', R.a.bullets);
    setMsg('Doktor bir mermiyi çıkardı', 'lose small');
    await sleep(1400); setMsg('');
  }
  const n = R[who].bullets;
  const loaded = new Set();
  while (loaded.size < n) loaded.add(secureInt(6));
  W.setChambers(loaded);
  document.body.classList.add('pulling');
  resetLean();
  $('#pull-who').textContent = me ? 'TETİK SENDE' : `TETİK ${o.name.toLocaleUpperCase('tr-TR')}'DA`;
  $('#pull-odds').innerHTML = `${n} / 6<small>${me ? 'ölme ihtimalin' : 'ölme ihtimali'} %${Math.round(n / 6 * 100)}</small>`;
  $('#pull-btns').innerHTML = '';
  $('#pull').classList.add('show');
  SFX.heartStart(me ? 78 : 64);
  if (me) {
    SFX.breath(); SFX.lift(); W.setOppFocus('gun'); await W.gunToPlayerHead();
    tip('pull', 'Eli kaybettin. Silindirde <b>' + n + '</b> mermi var. Tetiği çekebilir ya da masada <b>2 kez</b> kullanabileceğin <b>Pas</b> hakkını harcayabilirsin; mermi yine de silindirde kalır.');
  }
  else { say('pull'); W.opp.think = 1; await W.gunToOppHead(); }
  W.trembleGun(true);

  let pass = false;
  if (me) {
    pass = await new Promise(res => {
      $('#pull-btns').innerHTML = `<button class="chipbtn red big" id="pull-fire"><span>Tetiği<br>Çek</span><kbd>Boşluk</kbd></button>` +
        (R.p.passes > 0 ? `<button class="chipbtn black big" id="pull-pass"><span>Pas<br>(${R.p.passes})</span><kbd>P</kbd></button>` : '');
      $('#pull-fire').onclick = () => res(false);
      if ($('#pull-pass')) $('#pull-pass').onclick = () => res(true);
      R.waitKey = res;
    });
    R.waitKey = null;
    $('#pull-btns').innerHTML = '';
  } else {
    await sleep(1300);
  }
  if (pass) {
    R.p.passes--;
    SFX.heartStop();
    bigword('PAS', 'pas');
    W.trembleGun(false);
    await W.gunBackToTable();
    finishPull();
    renderCyl();
    setMsg('Pas geçtin. Mermi silindirde kaldı.', 'push small');
    await sleep(1100);
    return nextHand();
  }
  G.stats.pulls++;
  // silindiri çevir: her hazne geçişinde bir tık (animasyonla birebir)
  await W.spinDrum(() => SFX.tick());
  await sleep(250);
  await W.cockHammer(() => SFX.cockHalf(), () => SFX.cockLock());
  await sleep(me ? 900 : 1300);
  const k = secureInt(6);   // tetik anında güvenli üreteçle seçilen hazne
  const dies = loaded.has(k);
  W.trembleGun(false);
  SFX.heartStop();
  if (!dies) {
    // horoz iğneye çarptığı anda kuru tık
    await W.fire(false, () => { SFX.click(); bigword('TIK.', 'click'); });
    if (me) G.stats.survived++;
    await sleep(1500);
    if (!me) { W.opp.think = 0; say('survive'); }
    await W.gunBackToTable();
    finishPull();
    setMsg(me ? 'Hâlâ yaşıyorsun' : `${o.name} hâlâ yaşıyor`, (me ? 'win' : 'lose') + ' small');
    await sleep(1200);
    return nextHand();
  }
  // BANG — ses, parlama ve yazı horozun düştüğü karede
  R.over = true;
  await new Promise(res => W.fire(true, () => { SFX.bang(); bigword('BANG', 'bang'); res(); }));
  if (me) {
    $('#pull').classList.remove('show');
    document.body.classList.add('cine');
    await W.playerDie();
    finishPull();
    return gameOver();
  }
  await sleep(150);
  await W.oppDie();
  await W.lampFlicker(1.0);
  finishPull();
  await sleep(1200);
  return duelWon();
}
function leanHint() { return W && W.mobile ? '<b>👁</b>: yakından bak' : '<b>Shift</b> / sağ tık: yakından bak'; }
function resetLean() { if (W) W.leanTarget = 0; $('#btn-lean').classList.remove('on'); }
function finishPull() {
  if (W) W.setOppFocus('player');
  $('#pull').classList.remove('show');
  document.body.classList.remove('pulling');
  W.setChambers(null);
}
function bigword(text, cls) {
  const b = $('#bigword');
  b.textContent = text; b.className = 'bigword';
  void b.offsetWidth; b.classList.add(cls);
  clearTimeout(bigword.t);
  bigword.t = setTimeout(() => { b.className = 'bigword'; }, 1800);
}

// ================= SONUÇLAR =================
async function duelWon() {
  G.idx++;
  saveRecord();
  const o = OPPONENTS[G.idx - 1];
  if (G.idx >= OPPONENTS.length) return victory();
  hideHUDBits();
  await W.clearCards();
  await modal(`<div class="stamp">Öldü</div>
    <div class="photo dead"><span>${o.icon}</span></div>
    <h2>${o.name} masadan kalkamadı</h2>
    <p>Cesedi karanlığa sürükleniyor. Silindirin boşaltıldı. Sıradaki masa seni bekliyor.</p>
    ${ladderHtml()}`, [{ label: 'Sıradaki masa' }]);
  showIntro();
}

async function gameOver() {
  saveRecord();
  const s = G.stats;
  const i = await modal(`<div class="stamp">Kayıt kapandı</div>
    <h2>Öldün</h2>
    <p><b>${R.opp.name}</b> masasında, ${R.handNo}. elde.</p>
    ${ladderHtml()}
    <table class="stats">
      <tr><td>Geçtiğin masa</td><td>${G.idx} / ${OPPONENTS.length}</td></tr>
      <tr><td>Oynanan el</td><td>${s.hands}</td></tr>
      <tr><td>Kazanılan / kaybedilen</td><td>${s.won} / ${s.lost}</td></tr>
      <tr><td>Boşa çıkan tetik</td><td>${s.survived}</td></tr>
    </table>`, [{ label: 'Tekrar otur' }, { label: 'Ana menü', cls: 'alt' }]);
  document.body.classList.remove('cine');
  await W.clearCards();
  W.resetAfterDeath();
  W.setBullets('p', 0); W.setBullets('a', 0);
  if (i === 0) { W.setOpponent(OPPONENTS[0]); newRun(); }
  else { W.setOpponent(OPPONENTS[0]); W.toTitle(); show('title'); renderRecord(); }
}

async function victory() {
  const s = G.stats;
  try { const r = JSON.parse(localStorage.getItem('sonel-best') || '{}'); r.wins = (r.wins || 0) + 1; localStorage.setItem('sonel-best', JSON.stringify(r)); } catch (e) {}
  hideHUDBits();
  const i = await modal(`<div class="stamp">Sağ çıktın</div>
    <h2>Son el senindi</h2>
    <p>Kumarhanenin sahibi masada yatıyor. Kapı aralık. Arkana bakmadan çık.</p>
    ${ladderHtml()}
    <table class="stats">
      <tr><td>Oynanan el</td><td>${s.hands}</td></tr>
      <tr><td>Kazanılan / kaybedilen</td><td>${s.won} / ${s.lost}</td></tr>
      <tr><td>Boşa çıkan tetik</td><td>${s.survived}</td></tr>
    </table>`, [{ label: 'Yeniden' }, { label: 'Ana menü', cls: 'alt' }]);
  await W.clearCards();
  W.setOpponent(OPPONENTS[0]);
  W.placeGunOnTable(0.3);
  W.setBullets('p', 0); W.setBullets('a', 0);
  if (i === 0) newRun(); else { W.toTitle(); show('title'); renderRecord(); }
}

function saveRecord() {
  try {
    const r = JSON.parse(localStorage.getItem('sonel-best') || '{}');
    r.best = Math.max(r.best || 0, G.idx);
    localStorage.setItem('sonel-best', JSON.stringify(r));
  } catch (e) {}
}
function renderRecord() {
  let r = {};
  try { r = JSON.parse(localStorage.getItem('sonel-best') || '{}'); } catch (e) {}
  $('#record').textContent = r.best ? `En uzak: ${r.best}. masa${r.wins ? ` · ${r.wins} kez sağ çıktın` : ''}` : '';
}

// ================= İLK OYUN İPUÇLARI =================
const seenTips = (() => { try { return JSON.parse(localStorage.getItem('sonel-tips') || '{}'); } catch (e) { return {}; } })();
let tipT = null;
function tip(key, html) {
  if (seenTips[key]) return;
  seenTips[key] = 1;
  try { localStorage.setItem('sonel-tips', JSON.stringify(seenTips)); } catch (e) {}
  const el = $('#tipbox');
  el.innerHTML = html;
  el.classList.add('show');
  clearTimeout(tipT);
  tipT = setTimeout(() => el.classList.remove('show'), 7000);
}

// ================= YARDIMCILAR =================
let sayT = null;
function say(kind) {
  if (!R) return;
  const ls = R.opp.lines[kind];
  if (!ls) return;
  const el = $('#say');
  const line = pick(ls);
  el.innerHTML = `<b>${R.opp.name}:</b>“${line}”`;
  if (kind !== 'die') SFX.mumble(R.opp.look.voice || 110, line.split(' ').length);
  el.classList.add('show');
  clearTimeout(sayT);
  sayT = setTimeout(() => el.classList.remove('show'), 2800);
}

function modal(html, buttons = [{ label: 'Tamam' }], opts = {}) {
  return new Promise(res => {
    const m = document.createElement('div');
    m.className = 'modal-bg';
    m.innerHTML = `<div class="modal ${opts.cls || ''}">${html}<div class="modal-btns">${buttons.map((b, i) => `<button class="mbtn ${b.cls || ''}" data-mb="${i}">${b.label}</button>`).join('')}</div></div>`;
    $('#modal-root').appendChild(m);
    let done = false;
    m.addEventListener('click', e => {
      const b = e.target.closest('[data-mb]');
      if (!b || done) return;
      done = true; SFX.ui();
      m.classList.add('out');
      setTimeout(() => m.remove(), 200);
      res(+b.dataset.mb);
    });
  });
}

function showRules() {
  return modal(`<h2>Masanın kuralları</h2>
    <div class="rules">
      <div><h4>Blackjack</h4><p>21'e en yakın olan kazanır, 21'i geçen patlar. J, Q ve K 10 sayılır, As 1 ya da 11'dir. İlk iki kartla 21 yaparsan Blackjack olur.</p></div>
      <div><h4>Sırayla</h4><p>Eller sırayla başlar. Önce oynayanın rakibi bir kartını kapalı tutar. İkinci oynayan, ilkinin elini görerek karar verir.</p></div>
      <div><h4>Tetik</h4><p>Eli kaybeden silindirine bir mermi ekler ve tetiği çeker. Mermiler birikir: 1/6, 2/6, 3/6… Berabere biterse kimse tetiğe dokunmaz.</p></div>
      <div><h4>Ağır eller</h4><p>İkiye katlarsan ya da Blackjack yaparsan kaybeden 2 mermi yükler. İkiye katlayınca tek bir kart daha çekersin.</p></div>
      <div><h4>Pas</h4><p>Her masada 2 kez tetiği atlayabilirsin. Ama yüklenen mermi silindirde kalır.</p></div>
      <div><h4>Yedi masa</h4><p>Her masada daha usta bir rakip var. Ölen kalkamaz. Patron'u da devirirsen kapı açılır.</p></div>
    </div>
    <p style="margin-top:14px;font-size:13px">${W && W.mobile ? '👁 düğmesi: masaya eğil · ☰: menü (duraklat, ses, kurallar)' : 'Kısayollar: H kart çek · S dur · D ikiye katla · Boşluk tetiği çek · P pas · Shift / sağ tık basılı: masaya eğil · Esc: duraklat'}</p>`, [{ label: 'Anladım' }], { cls: 'wide' });
}

// ================= OLAYLAR =================
$('#btn-new').onclick = () => newRun();
$('#btn-how').onclick = () => { SFX.init(); showRules(); };
$('#btn-help').onclick = showRules;
$('#btn-hit').onclick = playerHit;
$('#btn-menu').onclick = () => pauseGame();
// dokunmatik: göz düğmesi masaya eğilmeyi açar/kapatır
$('#btn-lean').onclick = () => {
  if (!W) return;
  W.leanTarget = W.leanTarget > 0.5 ? 0 : 1;
  $('#btn-lean').classList.toggle('on', W.leanTarget > 0.5);
  SFX.ui();
};
$('#btn-stand').onclick = playerStand;
$('#btn-double').onclick = playerDouble;
$('#btn-quit').onclick = async () => {
  const i = await modal('<h2>Masadan kalk?</h2><p>Bu koşu kaybolur.</p>', [{ label: 'Kalk' }, { label: 'Vazgeç', cls: 'alt' }]);
  if (i !== 0) return;
  if (R) R.over = true;
  RUN++;
  SFX.heartStop();
  finishPull();
  document.body.classList.remove('cine', 'pulling');
  W.hardReset();
  hideHUDBits();
  W.setOpponent(OPPONENTS[0]);
  W.toTitle(); show('title'); renderRecord();
};
const speedBtn = () => { $('#btn-speed').textContent = `Hız ×${SETTINGS.speed}`; };
$('#btn-speed').onclick = () => {
  SETTINGS.speed = SETTINGS.speed === 1 ? 1.6 : SETTINGS.speed === 1.6 ? 2.4 : 1;
  if (W) W.speed = SETTINGS.speed;
  speedBtn(); saveSettings();
};
const soundBtn = () => { $('#btn-sound').textContent = `Ses: ${SETTINGS.sound ? 'Açık' : 'Kapalı'}`; };
$('#btn-sound').onclick = () => { SETTINGS.sound = !SETTINGS.sound; SFX.on = SETTINGS.sound; soundBtn(); saveSettings(); };
speedBtn(); soundBtn();
SFX.on = SETTINGS.sound;

// Esc: duraklat — dünyanın zamanı durur, sesler kısılır
let paused = false;
async function pauseGame() {
  if (paused || !G || !$('#hud').classList.contains('active')) return;
  paused = true;
  const sp = W.speed; W.speed = 0;
  SFX.heartStop();
  const i = await modal('<div class="stamp">Mola</div><h2>Duraklatıldı</h2><p>Masa seni bekliyor. Tabanca da.</p>', [{ label: 'Devam' }, { label: 'Kurallar', cls: 'alt' }, { label: `Ses: ${SETTINGS.sound ? 'Açık' : 'Kapalı'}`, cls: 'alt' }, { label: 'Masadan kalk', cls: 'alt' }]);
  W.speed = sp; paused = false;
  if (document.body.classList.contains('pulling') && i !== 3) SFX.heartStart(90);
  if (i === 1) { await showRules(); }
  else if (i === 2) { $('#btn-sound').click(); }
  else if (i === 3) { $('#btn-quit').click(); }
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !$('#modal-root').children.length) { pauseGame(); return; }
  if ($('#modal-root').children.length) {
    if (e.key === 'Enter') { const b = $('#modal-root .mbtn'); if (b) b.click(); }
    return;
  }
  if (R && R.waitKey) {
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); R.waitKey(false); }
    else if ((e.key === 'p' || e.key === 'P') && R.p.passes > 0) R.waitKey(true);
    return;
  }
  const k = e.key.toLowerCase();
  if (k === 'h') playerHit();
  else if (k === 's') playerStand();
  else if (k === 'd') playerDouble();
});

// test ve hata ayıklama kancası: sadece yerel geliştirmede açık.
// Yayındaki sitede oyun durumu (deste sırası, mermiler) konsoldan erişilebilir olmasın.
const DEV = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
if (DEV) window.__sonel = { get W() { return W; }, get R() { return R; }, get G() { return G; }, newRun, playerHit, playerStand, playerDouble, pullScene, showIntro };

boot();
