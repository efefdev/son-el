// SON EL — oyun akışı ve arayüz

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const pick = a => a[Math.floor(Math.random() * a.length)];

const SETTINGS = (() => {
  let s = { speed: 1, sound: true };
  try { Object.assign(s, JSON.parse(localStorage.getItem('sonel-settings') || '{}')); } catch (e) {}
  return s;
})();
function saveSettings() { try { localStorage.setItem('sonel-settings', JSON.stringify(SETTINGS)); } catch (e) {} }
SFX.on = SETTINGS.sound;
const sleep = ms => new Promise(r => setTimeout(r, ms / SETTINGS.speed));

const PASSES = 2;
let G = null;   // koşu
let R = null;   // masa (düello)

// ================= ÇİZİMLER =================
function gunSvg(p = 'g') {
  return `<svg viewBox="0 0 300 150" class="gun">
  <defs>
    <linearGradient id="${p}gm" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#9aa0a8"/><stop offset=".45" stop-color="#4c5158"/><stop offset="1" stop-color="#1c1e22"/></linearGradient>
    <linearGradient id="${p}gm2" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#7a8088"/><stop offset="1" stop-color="#202226"/></linearGradient>
    <linearGradient id="${p}wd" x1="0" x2="1"><stop offset="0" stop-color="#5a2e14"/><stop offset=".5" stop-color="#8a4a22"/><stop offset="1" stop-color="#3a1c0a"/></linearGradient>
    <pattern id="${p}chk" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0h6M0 0v6" stroke="#0005" stroke-width="1.2"/></pattern>
  </defs>
  <path d="M60 66 C50 90 40 118 46 140 L86 142 C84 120 90 96 104 80 Z" fill="url(#${p}wd)" stroke="#1a0c04" stroke-width="2"/>
  <path d="M58 76 C52 96 48 118 52 134 L80 136 C80 116 86 98 96 84 Z" fill="url(#${p}chk)"/>
  <circle cx="68" cy="104" r="3" fill="#c9a050"/>
  <path d="M96 78 q2 26 28 26 q14 0 16 -14" fill="none" stroke="url(#${p}gm2)" stroke-width="5"/>
  <path d="M114 80 q-4 12 4 20" fill="none" stroke="#2a2c30" stroke-width="4" stroke-linecap="round"/>
  <path d="M56 54 L140 40 L150 82 L100 84 L66 74 Z" fill="url(#${p}gm)" stroke="#111" stroke-width="2"/>
  <path d="M60 52 L48 30 L58 28 L72 50 Z" fill="url(#${p}gm2)" stroke="#111" stroke-width="1.5"/>
  <rect x="98" y="38" width="50" height="40" rx="7" fill="url(#${p}gm)" stroke="#111" stroke-width="2"/>
  <path d="M104 44 h38 M104 52 h38 M104 64 h38 M104 72 h38" stroke="#0007" stroke-width="2.5"/>
  <rect x="146" y="40" width="146" height="17" rx="3" fill="url(#${p}gm)" stroke="#111" stroke-width="2"/>
  <rect x="150" y="58" width="104" height="8" rx="3" fill="url(#${p}gm2)" stroke="#111" stroke-width="1.5"/>
  <path d="M282 40 l4 -8 h5 l-1 8 Z" fill="#33363b"/>
  <rect x="289" y="43" width="5" height="11" rx="1" fill="#0a0a0a"/>
  <path d="M150 44 H286" stroke="#ffffff55" stroke-width="2"/>
  <path d="M100 41 H146" stroke="#ffffff44" stroke-width="2"/>
  </svg>`;
}

const PIPS = {
  2: [[50, 0], [50, 100, 1]],
  3: [[50, 0], [50, 50], [50, 100, 1]],
  4: [[0, 0], [100, 0], [0, 100, 1], [100, 100, 1]],
  5: [[0, 0], [100, 0], [50, 50], [0, 100, 1], [100, 100, 1]],
  6: [[0, 0], [100, 0], [0, 50], [100, 50], [0, 100, 1], [100, 100, 1]],
  7: [[0, 0], [100, 0], [50, 25], [0, 50], [100, 50], [0, 100, 1], [100, 100, 1]],
  8: [[0, 0], [100, 0], [50, 25], [0, 50], [100, 50], [50, 75, 1], [0, 100, 1], [100, 100, 1]],
  9: [[0, 0], [100, 0], [0, 33], [100, 33], [50, 50], [0, 67, 1], [100, 67, 1], [0, 100, 1], [100, 100, 1]],
  10: [[0, 0], [100, 0], [50, 17], [0, 33], [100, 33], [0, 67, 1], [100, 67, 1], [50, 83, 1], [0, 100, 1], [100, 100, 1]],
};
const FACE_GLYPH = { J: '♞', Q: '♛', K: '♚' };

function cardHtml(c, opts = {}) {
  const red = RED[c.s] ? 'red' : 'black';
  let mid;
  if (c.r === 'A') mid = `<div class="pips"><span class="pip ace" style="left:50%;top:50%">${c.s}</span></div>`;
  else if (FACE_GLYPH[c.r]) mid = `<div class="facebox"><span class="fs">${c.s}</span><span class="fg">${FACE_GLYPH[c.r]}</span><span class="fs2">${c.s}</span></div>`;
  else mid = `<div class="pips">${PIPS[+c.r].map(([x, y, f]) => `<span class="pip ${f ? 'flip' : ''}" style="left:${x}%;top:${y}%">${c.s}</span>`).join('')}</div>`;
  return `<div class="card ${red} ${opts.down ? 'down' : ''} ${opts.deal ? 'deal' : ''}" data-id="${c.id}" style="${opts.style || ''}">
    <div class="face"><div class="cor tl"><b>${c.r}</b><i>${c.s}</i></div>${mid}<div class="cor br"><b>${c.r}</b><i>${c.s}</i></div></div>
    <div class="back"></div></div>`;
}

function cylHtml(bullets, loadedSet) {
  let s = '';
  for (let k = 0; k < CHAMBERS; k++) {
    const b = loadedSet ? loadedSet.has(k) : k < bullets;
    s += `<i class="${b ? 'b' : ''}" style="--k:${k}"></i>`;
  }
  return s;
}

function mugHtml(o, extra = '') {
  return `<div class="mugshot ${extra}"><div class="mug-lines"></div><span>${o.icon}</span><div class="mug-plate">${o.id.toUpperCase()}-${String(OPPONENTS.indexOf(o) + 1).padStart(2, '0')}</div></div>`;
}

// ================= KOŞU =================
function newRun() {
  G = { idx: 0, stats: { hands: 0, won: 0, lost: 0, pulls: 0, survived: 0, kills: 0 } };
  document.body.classList.remove('dead', 'danger');
  $('#cracks').classList.remove('show');
  showScreen('game-screen');
  clearTable();
  showIntro();
}

function ladderHtml() {
  return `<div class="ladder">${OPPONENTS.map((o, i) => `<span class="${i < G.idx ? 'dead' : i === G.idx ? 'now' : 'later'}" title="${o.name}">${o.icon}</span>`).join('')}</div>`;
}

async function showIntro() {
  const o = OPPONENTS[G.idx];
  const html = `<div class="stamp">${o.title}</div>
    ${mugHtml(o)}
    <h2>${o.name}</h2>
    <p><i>${o.quirk}</i></p>
    ${ladderHtml()}`;
  await modal(html, [{ label: 'Otur' }]);
  startDuel();
}

// ================= MASA =================
function startDuel() {
  const o = OPPONENTS[G.idx];
  R = {
    opp: o, shoe: newShoe(), handNo: 0, first: 'p', phase: 'idle', busy: true,
    p: { cards: [], bullets: o.id === 'tefeci' ? 1 : 0, passes: PASSES },
    a: { cards: [], bullets: 0, healed: false },
    doubled: null, gunAngle: 0, holeHidden: false, over: false,
  };
  $('#h-table').textContent = G.idx + 1;
  $('#o-icon').textContent = o.icon;
  $('#o-plate').textContent = `${o.id.toUpperCase()}-${String(G.idx + 1).padStart(2, '0')}`;
  $('#o-mug').className = 'mugshot';
  $('#o-name').textContent = o.name;
  $('#o-quirk').textContent = o.quirk;
  $('#gun-table').style.transform = 'rotate(0deg)';
  renderCyl();
  renderTotals();
  setMsg('');
  say('start');
  if (o.id === 'tefeci') setTimeout(() => setMsg('Borç: silindirinde 1 mermi', 'lose'), 600);
  setTimeout(nextHand, 1200 / SETTINGS.speed);
}

function renderCyl() {
  $('#p-cyl').innerHTML = cylHtml(R.p.bullets);
  $('#o-cyl').innerHTML = cylHtml(R.a.bullets);
  $('#p-odds').textContent = `${R.p.bullets}/6`;
  $('#o-odds').textContent = `${R.a.bullets}/6`;
  $('#p-pass').innerHTML = `Pas hakkı: <b>${'●'.repeat(R.p.passes)}${'○'.repeat(PASSES - R.p.passes)}</b> <small>(tetiği bir kez atla)</small>`;
  $('#shoe-n').textContent = R.shoe.length;
  document.body.classList.toggle('danger', R.p.bullets >= 3);
}

function renderTotals() {
  const pv = handValue(R.p.cards), av = handValue(R.a.cards);
  const pt = $('#p-total'), at = $('#a-total');
  pt.textContent = R.p.cards.length ? (pv.soft && pv.total < 21 ? `${pv.total - 10}/${pv.total}` : pv.total) : '';
  pt.className = 'total' + (pv.total > 21 ? ' bust' : isBlackjack(R.p.cards) ? ' bj' : '');
  if (!R.a.cards.length) { at.textContent = ''; at.className = 'total'; return; }
  if (R.holeHidden) {
    at.textContent = `${cardVal(R.a.cards[0])} + ?`;
    at.className = 'total';
  } else {
    at.textContent = av.soft && av.total < 21 ? `${av.total - 10}/${av.total}` : av.total;
    at.className = 'total' + (av.total > 21 ? ' bust' : isBlackjack(R.a.cards) ? ' bj' : '');
  }
}

function renderHands(fresh) {
  const fx = (row) => {
    const shoe = $('#shoe-box') || $('.shoe-box');
    const s = shoe.getBoundingClientRect(), r = $(row).getBoundingClientRect();
    return `--fx:${Math.round(s.left - r.left - r.width / 2)}px;--fy:${Math.round(s.top - r.top)}px`;
  };
  const draw = (sel, cards, hiddenIdx) => {
    $(sel).innerHTML = cards.map((c, i) => cardHtml(c, { down: i === hiddenIdx, deal: fresh && fresh.has(c.id), style: fx(sel) })).join('');
  };
  draw('#p-cards', R.p.cards, -1);
  draw('#a-cards', R.a.cards, R.holeHidden ? 1 : -1);
  renderTotals();
}

function setButtons() {
  const can = R && R.phase === 'player' && !R.busy;
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
  const firstTxt = R.first === 'p' ? '<b>Önce sen</b> oynuyorsun. Rakibin bir kartı kapalı.' : '<b>Önce rakip</b> oynuyor. Senin ikinci kartını göremez; sen onun elini görerek karar verirsin.';
  $('#turn-info').innerHTML = `El ${R.handNo}<br>${firstTxt}`;
}

function clearTable() {
  $('#p-cards').innerHTML = ''; $('#a-cards').innerHTML = '';
  $('#p-cards').className = 'cards'; $('#a-cards').className = 'cards';
  if (R) { R.p.cards = []; R.a.cards = []; renderTotals(); }
}

async function dealTo(side, hidden) {
  const c = R.shoe.pop();
  R[side].cards.push(c);
  if (hidden) R.holeHidden = true;
  renderHands(new Set([c.id]));
  SFX.card();
  $('#shoe-n').textContent = R.shoe.length;
  await sleep(330);
  return c;
}

async function nextHand() {
  if (R.over) return;
  R.busy = true; R.phase = 'deal';
  // eski kartları topla
  $$('#p-cards .card, #a-cards .card').forEach(el => el.classList.add('gone'));
  if (R.p.cards.length) { SFX.slide(); await sleep(450); }
  clearTable();
  if (R.shoe.length < 15) { R.shoe = newShoe(); setMsg('Deste karıldı'); SFX.slide(); await sleep(700); }
  R.handNo++; G.stats.hands++;
  R.first = R.handNo % 2 === 1 ? 'p' : 'a';
  R.doubled = null; R.holeHidden = false;
  setTurnInfo();
  setMsg('');
  setButtons();
  // dağıt: ilk oynayanın rakibi (ikinci oynayan) bir kartını kapalı tutar
  await dealTo('p'); await dealTo('a');
  await dealTo('p'); await dealTo('a', R.first === 'p');
  const pbj = isBlackjack(R.p.cards), abj = isBlackjack(R.a.cards);
  if (pbj || abj) {
    if (R.holeHidden) await revealHole();
    return resolve();
  }
  if (R.first === 'p') {
    R.phase = 'player'; R.busy = false;
    setMsg('Senin hamlen');
    setButtons();
  } else {
    await aiTurn(false);
    if (handValue(R.a.cards).total > 21) return resolve();
    R.phase = 'player'; R.busy = false;
    setMsg('Senin hamlen');
    setButtons();
  }
}

async function revealHole() {
  R.holeHidden = false;
  const el = $('#a-cards .card.down');
  if (el) { el.classList.remove('down'); SFX.flip(); }
  renderTotals();
  await sleep(500);
}

async function aiTurn(second) {
  R.busy = true; setButtons();
  $('#o-mug').classList.add('thinking');
  setMsg(`${R.opp.name} düşünüyor…`);
  await sleep(700);
  if (!second && aiWantsDouble(R.opp.ai, R.a.cards, R.p.cards)) {
    R.doubled = 'a';
    setMsg('Rakip ikiye katladı!', 'lose');
    SFX.chip();
    await sleep(700);
    await dealTo('a');
  } else {
    let guard = 0;
    while (aiWantsHit(R.opp.ai, R.a.cards, R.p.cards, second, R.shoe) && guard++ < 10) {
      setMsg('Kart çekiyor');
      await dealTo('a');
      await sleep(250);
    }
    const t = handValue(R.a.cards).total;
    setMsg(t > 21 ? 'Rakip patladı!' : `Rakip ${t}'de durdu`, t > 21 ? 'win' : '');
  }
  $('#o-mug').classList.remove('thinking');
  await sleep(600);
}

// ---- oyuncu hamleleri ----
async function playerHit() {
  if (!R || R.phase !== 'player' || R.busy) return;
  R.busy = true; setButtons();
  await dealTo('p');
  const t = handValue(R.p.cards).total;
  if (t > 21) { setMsg('Patladın!', 'lose'); await sleep(600); return afterPlayer(); }
  if (t === 21) { await sleep(200); return afterPlayer(); }
  R.busy = false; setButtons();
}
async function playerStand() {
  if (!R || R.phase !== 'player' || R.busy) return;
  R.busy = true; setButtons();
  afterPlayer();
}
async function playerDouble() {
  if (!R || R.phase !== 'player' || R.busy || R.p.cards.length !== 2) return;
  R.busy = true; setButtons();
  R.doubled = 'p';
  SFX.chip();
  setMsg('İkiye katladın: kaybeden 2 mermi yükler', 'push');
  await sleep(600);
  await dealTo('p');
  if (handValue(R.p.cards).total > 21) { setMsg('Patladın!', 'lose'); await sleep(600); }
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
  if (R.holeHidden) await revealHole();
  const pt = handValue(R.p.cards).total, at = handValue(R.a.cards).total;
  const pbj = isBlackjack(R.p.cards), abj = isBlackjack(R.a.cards);
  let res, extra = 0, why = '';
  if (pbj && abj) { res = 0; why = 'İki Blackjack'; }
  else if (pbj) { res = 1; extra = 1; why = 'BLACKJACK! Rakip 2 mermi yükler'; }
  else if (abj) { res = -1; extra = R.opp.id === 'kasap' ? 1 : 0; why = 'Rakip Blackjack yaptı' + (extra ? ' — 2 mermi!' : ''); }
  else if (pt > 21 && at > 21) { res = 0; why = 'İkiniz de patladınız'; }
  else if (pt > 21) { res = -1; why = 'Patladın'; }
  else if (at > 21) { res = 1; why = 'Rakip patladı'; }
  else if (pt > at) { res = 1; why = `${pt} > ${at}`; }
  else if (pt < at) { res = -1; why = `${pt} < ${at}`; }
  else { res = 0; why = `${pt} = ${at}`; }
  if (res !== 0 && R.doubled) extra += 1;

  if (res === 0) {
    setMsg('BERABERE', 'push');
    SFX.push();
    await sleep(1400);
    return nextHand();
  }
  const loser = res === 1 ? 'a' : 'p';
  $(loser === 'p' ? '#p-cards' : '#a-cards').classList.add('lost');
  $(loser === 'p' ? '#a-cards' : '#p-cards').classList.add('won');
  if (res === 1) { G.stats.won++; SFX.win(); setMsg('KAZANDIN', 'win'); say('lose'); }
  else { G.stats.lost++; SFX.lose(); setMsg('KAYBETTİN', 'lose'); say('win'); }
  await sleep(700);
  setMsg(why, res === 1 ? 'win' : 'lose');
  await sleep(900);
  // tabanca masada döner ve kaybedeni gösterir
  await spinGun(loser);
  R[loser].bullets = Math.min(CHAMBERS, R[loser].bullets + 1 + extra);
  renderCyl();
  $(loser === 'p' ? '#p-cyl' : '#o-cyl').classList.add('pop');
  setTimeout(() => $$('.mini-cyl').forEach(e => e.classList.remove('pop')), 500);
  await sleep(500);
  await pullScene(loser);
}

async function spinGun(loser) {
  const g = $('#gun-table');
  const base = R.gunAngle - (R.gunAngle % 360);
  const target = base + 1080 + (loser === 'p' ? 90 : -90) + (Math.random() * 16 - 8);
  R.gunAngle = target;
  g.style.transitionDuration = (1.6 / SETTINGS.speed) + 's';
  g.style.transform = `rotate(${target}deg)`;
  SFX.slide();
  await sleep(1700);
}

// ================= TETİK =================
async function pullScene(who) {
  const scene = $('#gun-scene');
  const me = who === 'p';
  const o = R.opp;
  // Doktor kendini iyileştirir
  if (!me && o.id === 'doktor' && !R.a.healed && R.a.bullets >= 2) {
    R.a.healed = true; R.a.bullets--;
    renderCyl();
    setMsg('Doktor bir mermiyi çıkardı', 'lose');
    await sleep(1200);
  }
  const n = R[who].bullets;
  const loaded = new Set();
  while (loaded.size < n) loaded.add(Math.floor(Math.random() * CHAMBERS));
  const cyl = $('#gs-cyl');
  cyl.style.transition = 'none';
  cyl.style.transform = 'rotate(0deg)';
  cyl.innerHTML = cylHtml(n, loaded);
  $('#gs-who').textContent = me ? 'TETİK SENDE' : `TETİK ${o.name.toLocaleUpperCase('tr-TR')}'DA`;
  $('#gs-portrait').className = 'gs-portrait' + (me ? ' me' : '');
  $('#gs-portrait').innerHTML = me ? '' : mugHtml(o, 'thinking');
  $('#gs-odds').innerHTML = `${n} / 6<small>${me ? 'ölme ihtimalin' : 'ölme ihtimali'} %${Math.round(n / 6 * 100)}</small>`;
  $('#gs-result').className = 'gs-result'; $('#gs-result').textContent = '';
  $('#gs-btns').innerHTML = '';
  scene.classList.add('show');
  SFX.heartStart(me ? 80 : 65);
  if (!me) say('pull');

  let pass = false;
  if (me) {
    pass = await new Promise(res => {
      $('#gs-btns').innerHTML = `<button class="chipbtn red big" id="gs-fire"><span>Tetiği<br>Çek</span></button>` +
        (R.p.passes > 0 ? `<button class="chipbtn black big" id="gs-pass"><span>Pas<br>(${R.p.passes})</span></button>` : '');
      $('#gs-fire').onclick = () => res(false);
      if ($('#gs-pass')) $('#gs-pass').onclick = () => res(true);
      R.waitKey = res;
    });
    R.waitKey = null;
    $('#gs-btns').innerHTML = '';
  } else {
    await sleep(1200);
  }
  if (pass) {
    R.p.passes--;
    SFX.heartStop();
    $('#gs-result').textContent = 'PAS';
    $('#gs-result').className = 'gs-result click';
    await sleep(900);
    scene.classList.remove('show');
    renderCyl();
    setMsg('Pas geçtin. Mermi silindirde kaldı.', 'push');
    await sleep(1000);
    return nextHand();
  }

  // silindiri çevir: rastgele bir hazne en üste gelir
  G.stats.pulls++;
  const k = Math.floor(Math.random() * CHAMBERS);
  const turns = 3 + Math.floor(Math.random() * 3);
  SFX.spin(20);
  void cyl.offsetWidth;
  cyl.style.transition = `transform ${1.6 / SETTINGS.speed}s cubic-bezier(.15,.8,.25,1)`;
  cyl.style.transform = `rotate(${-(turns * 360 + k * 60)}deg)`;
  await sleep(1700);
  SFX.cock();
  await sleep(me ? 900 : 1100);
  SFX.heartStop();
  const dies = loaded.has(k);
  if (!dies) {
    SFX.click();
    $('#gs-result').textContent = 'TIK.';
    $('#gs-result').className = 'gs-result click';
    if (me) G.stats.survived++;
    await sleep(1500);
    scene.classList.remove('show');
    if (!me) say('survive');
    setMsg(me ? 'Hâlâ yaşıyorsun' : `${o.name} hâlâ yaşıyor`, me ? 'win' : 'lose');
    await sleep(1000);
    return nextHand();
  }
  // BANG
  SFX.bang();
  FX.flash('#ffffff', 0.95);
  setTimeout(() => FX.flash('#ff2a1a', 0.5), 120);
  $('#gs-result').textContent = 'BANG';
  $('#gs-result').className = 'gs-result bang';
  scene.classList.remove('shake'); void scene.offsetWidth; scene.classList.add('shake');
  const pin = $('.gs-pin').getBoundingClientRect();
  FX.burst(pin.left + pin.width / 2, pin.top + 20, { count: 60, max: 600, color: [255, 210, 120], size: 3.5, gravity: 400 });
  FX.smoke(pin.left + pin.width / 2, pin.top + 20, 18, { spread: 40, size: 1.6, alpha: 0.35, life: 2 });
  R.over = true;
  if (me) {
    $('#cracks').innerHTML = cracksSvg();
    $('#cracks').classList.add('show');
    document.body.classList.add('dead');
    await sleep(2600);
    scene.classList.remove('show');
    return gameOver();
  }
  const mug = $('#gs-portrait .mugshot');
  if (mug) { mug.classList.remove('thinking'); mug.classList.add('dead'); }
  $('#o-mug').classList.add('dead');
  G.stats.kills++;
  await sleep(2400);
  scene.classList.remove('show');
  return duelWon();
}

function cracksSvg() {
  const cx = 50 + (Math.random() * 20 - 10), cy = 45 + (Math.random() * 10 - 5);
  let lines = '';
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 + Math.random() * 0.3;
    let x = cx, y = cy, d = `M${cx} ${cy}`;
    for (let j = 0; j < 5; j++) {
      const len = 6 + Math.random() * 12;
      x += Math.cos(a + (Math.random() - 0.5) * 0.6) * len;
      y += Math.sin(a + (Math.random() - 0.5) * 0.6) * len * 0.8;
      d += ` L${x.toFixed(1)} ${y.toFixed(1)}`;
    }
    lines += `<path d="${d}"/>`;
  }
  let rings = '';
  for (let r = 3; r < 30; r += 6 + Math.random() * 5) rings += `<ellipse cx="${cx}" cy="${cy}" rx="${r}" ry="${r * 0.8}" stroke-dasharray="${2 + Math.random() * 4} ${2 + Math.random() * 6}"/>`;
  return `<svg viewBox="0 0 100 100" preserveAspectRatio="none" style="width:100%;height:100%">
    <defs><radialGradient id="bl" cx="${cx}%" cy="${cy}%" r="70%"><stop offset="0" stop-color="#7a0000" stop-opacity=".85"/><stop offset=".5" stop-color="#3a0000" stop-opacity=".7"/><stop offset="1" stop-color="#000" stop-opacity=".95"/></radialGradient></defs>
    <rect width="100" height="100" fill="url(#bl)"/>
    <g fill="none" stroke="#ffffffaa" stroke-width=".18">${lines}${rings}</g></svg>`;
}

// ================= SONUÇLAR =================
async function duelWon() {
  G.idx++;
  saveRecord();
  if (G.idx >= OPPONENTS.length) return victory();
  const o = OPPONENTS[G.idx - 1];
  const html = `<div class="stamp">Öldü</div>
    ${mugHtml(o, 'dead')}
    <h2>${o.name} masadan kalkamadı</h2>
    <p>Silindirin boşaltıldı. Sıradaki masa seni bekliyor.</p>
    ${ladderHtml()}`;
  await modal(html, [{ label: 'Sıradaki masa' }]);
  clearTable();
  showIntro();
}

async function gameOver() {
  saveRecord();
  const s = G.stats;
  const html = `<div class="stamp">Kayıt kapandı</div>
    <h2>Öldün</h2>
    <p><b>${R.opp.name}</b> masasında, ${R.handNo}. elde.</p>
    ${ladderHtml()}
    <table class="stats">
      <tr><td>Geçtiğin masa</td><td>${G.idx} / ${OPPONENTS.length}</td></tr>
      <tr><td>Oynanan el</td><td>${s.hands}</td></tr>
      <tr><td>Kazanılan / kaybedilen</td><td>${s.won} / ${s.lost}</td></tr>
      <tr><td>Boşa çıkan tetik</td><td>${s.survived}</td></tr>
    </table>`;
  const i = await modal(html, [{ label: 'Tekrar otur' }, { label: 'Ana menü', cls: 'alt' }]);
  document.body.classList.remove('dead', 'danger');
  $('#cracks').classList.remove('show');
  if (i === 0) newRun(); else { showScreen('title-screen'); renderRecord(); }
}

async function victory() {
  const s = G.stats;
  const html = `<div class="stamp">Sağ çıktın</div>
    <h2>Son el senindi</h2>
    <p>Kumarhanenin sahibi masada yatıyor. Kapı açık. Arkana bakmadan çık.</p>
    ${ladderHtml()}
    <table class="stats">
      <tr><td>Oynanan el</td><td>${s.hands}</td></tr>
      <tr><td>Kazanılan / kaybedilen</td><td>${s.won} / ${s.lost}</td></tr>
      <tr><td>Boşa çıkan tetik</td><td>${s.survived}</td></tr>
    </table>`;
  try { const r = JSON.parse(localStorage.getItem('sonel-best') || '{}'); r.wins = (r.wins || 0) + 1; localStorage.setItem('sonel-best', JSON.stringify(r)); } catch (e) {}
  await modal(html, [{ label: 'Yeniden' }, { label: 'Ana menü', cls: 'alt' }]).then(i => {
    if (i === 0) newRun(); else { showScreen('title-screen'); renderRecord(); }
  });
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

// ================= YARDIMCILAR =================
let bubbleT = null;
function say(kind) {
  if (!R) return;
  const ls = R.opp.lines[kind];
  if (!ls) return;
  const b = $('#o-bubble');
  b.textContent = `“${pick(ls)}”`;
  b.classList.add('show');
  clearTimeout(bubbleT);
  bubbleT = setTimeout(() => b.classList.remove('show'), 2400);
}

function showScreen(id) {
  document.body.dataset.screen = id;
  $$('.screen').forEach(s => s.classList.toggle('active', s.id === id));
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
      done = true;
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
      <div><h4>Tetik</h4><p>Eli kaybeden, silindirine bir mermi ekler ve tetiği çeker. Mermiler birikir: 1/6, 2/6, 3/6… Berabere biterse kimse tetiğe dokunmaz.</p></div>
      <div><h4>Ağır eller</h4><p>İkiye katlarsan ya da Blackjack yaparsan kaybeden 2 mermi yükler. İkiye katlayınca tek bir kart daha çekersin.</p></div>
      <div><h4>Pas</h4><p>Her masada 2 kez tetiği atlayabilirsin. Ama yüklenen mermi silindirde kalır.</p></div>
      <div><h4>Yedi masa</h4><p>Her masada daha usta bir rakip var. Ölen kalkamaz. Patron'u da devirirsen kapı açılır.</p></div>
    </div>`, [{ label: 'Anladım' }], { cls: 'wide' });
}

// ================= OLAYLAR =================
$('#btn-new').onclick = () => newRun();
$('#btn-how').onclick = showRules;
$('#btn-help').onclick = showRules;
$('#btn-hit').onclick = playerHit;
$('#btn-stand').onclick = playerStand;
$('#btn-double').onclick = playerDouble;
$('#btn-quit').onclick = async () => {
  const i = await modal('<h2>Masadan kalk?</h2><p>Bu koşu kaybolur.</p>', [{ label: 'Kalk' }, { label: 'Vazgeç', cls: 'alt' }]);
  if (i === 0) { if (R) R.over = true; SFX.heartStop(); $('#gun-scene').classList.remove('show'); document.body.classList.remove('danger'); showScreen('title-screen'); renderRecord(); }
};
$('#btn-speed').onclick = () => {
  SETTINGS.speed = SETTINGS.speed === 1 ? 2 : SETTINGS.speed === 2 ? 3 : 1;
  $('#btn-speed').textContent = `Hız ×${SETTINGS.speed}`; saveSettings();
};
$('#btn-sound').onclick = () => {
  SETTINGS.sound = !SETTINGS.sound; SFX.on = SETTINGS.sound;
  $('#btn-sound').textContent = `Ses: ${SETTINGS.sound ? 'Açık' : 'Kapalı'}`; saveSettings();
};
$('#btn-speed').textContent = `Hız ×${SETTINGS.speed}`;
$('#btn-sound').textContent = `Ses: ${SETTINGS.sound ? 'Açık' : 'Kapalı'}`;

document.addEventListener('keydown', e => {
  if ($('#modal-root').children.length) {
    if (e.key === 'Enter') { const b = $('#modal-root .mbtn'); if (b) b.click(); }
    return;
  }
  if (R && R.waitKey) {
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); R.waitKey(false); }
    else if (e.key === 'p' || e.key === 'P') { if (R.p.passes > 0) R.waitKey(true); }
    return;
  }
  const k = e.key.toLowerCase();
  if (k === 'h') playerHit();
  else if (k === 's') playerStand();
  else if (k === 'd') playerDouble();
});

// açılış
$('#title-gun').innerHTML = gunSvg('t');
$('#gun-table').innerHTML = gunSvg('m');
renderRecord();
setInterval(() => {
  const a = $('#ashtray');
  if (!a || document.hidden) return;
  const r = a.getBoundingClientRect();
  FX.smoke(r.left + 62, r.top + 6, 1, { spread: 3, size: 0.6, alpha: 0.12, life: 2.2, vx: 4 });
}, 260);
