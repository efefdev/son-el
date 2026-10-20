// TERAZİ — oyun akışı ve arayüz

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const fmt = n => Math.floor(n).toLocaleString('tr-TR');
const fmtM = m => (m >= 1000 ? Math.floor(m) : +m.toFixed(2)).toLocaleString('tr-TR', { maximumFractionDigits: 2 });
const other = s => (s === 'p' ? 'a' : 'p');

const SETTINGS = (() => {
  let s = { speed: 1, sound: true };
  try { Object.assign(s, JSON.parse(localStorage.getItem('terazi-settings') || '{}')); } catch (e) {}
  return s;
})();
function saveSettings() { try { localStorage.setItem('terazi-settings', JSON.stringify(SETTINGS)); } catch (e) {} }
SFX.on = SETTINGS.sound;

const sleep = ms => new Promise(r => setTimeout(r, ms / SETTINGS.speed));

let G = null;   // koşu durumu
let D = null;   // düello durumu

// ============ KOŞU ============
function newRun() {
  const mids = shuffle(OPPONENTS.slice(1)).slice(0, 6);
  G = {
    ante: 1, lives: 3, gold: 4,
    deck: makeDeck(), tals: [], spells: [], levels: {},
    talSlots: 5, spellSlots: 2,
    opps: [OPPONENTS[0], ...mids, FINAL_OPP],
    stats: { best: 0, bestType: null, wins: 0, losses: 0 },
    nextAi: null, shop: null,
  };
  prepareAi();
  showScreen('game-screen');
  clearBoard();
  showIntro();
}

function addTal(id) {
  const t = newTal(id); t.uid = _uid++;
  G.tals.push(t);
  return t;
}

function prepareAi() {
  const a = G.ante - 1;
  const opp = G.opps[a];
  const pool = TALISMANS.filter(t => !t.aiNo);
  const n = ANTE.tals[a] + (opp.final ? 1 : 0);
  const tals = [];
  const ids = shuffle(pool.map(t => t.id)).slice(0, n);
  for (const id of ids) { const t = newTal(id); t.uid = _uid++; tals.push(t); }
  const levels = {};
  for (let k = 0; k < ANTE.levels[a]; k++) {
    const h = pick(HANDS.slice(1, 7)).id;
    levels[h] = (levels[h] || 1) + 1;
  }
  G.nextAi = { tals, levels, power: ANTE.power[a] * (opp.final ? 1.15 : 1), iq: ANTE.iq[a] };
}

// ============ DÜELLO ============
function pHandSize() { return Math.max(5, 8 + passive(G.tals, 'handSize')); }

function startDuel() {
  const opp = G.opps[G.ante - 1];
  const ai = G.nextAi;
  D = {
    opp, ai, V: 0, T: Math.round(ANTE.koBase * ai.power),
    p: { draw: shuffle(G.deck.slice()), hand: [], hands: 4 + passive(G.tals, 'hands') - (opp.id === 'saatci' ? 1 : 0),
         disc: opp.id === 'kumarbaz' ? 0 : 3 + passive(G.tals, 'discards'), total: 0, lastEl: null, lastScore: 0 },
    a: { draw: shuffle(makeDeck()), hand: [], hands: 4 + passive(ai.tals, 'hands'), disc: 3 + passive(ai.tals, 'discards'),
         total: 0, lastEl: null, lastScore: 0 },
    turnNo: 0, first: G.ante % 2 === 1 ? 'p' : 'a', turn: null,
    sealed: new Set(), hidden: new Set(), sel: new Set(), cursed: false, over: false, busy: true,
    sort: SETTINGS.sort || 'rank', fresh: new Set(), angle: 0,
  };
  if (opp.id === 'muhurcu') D.sealed.add(pick(ELS));
  drawTo('p'); drawTo('a');
  clearZones();
  setScale(true);
  renderAll();
  say('start');
  nextTurn();
}

function pDebuff(c) {
  if (!D) return false;
  if (D.opp.id === 'papaz' && isFace(c)) return true;
  return D.sealed.has(c.el);
}

function scFor(side, played, held, preview) {
  const me = D[side], op = D[other(side)];
  const myTals = side === 'p' ? G.tals : D.ai.tals;
  const opTals = side === 'p' ? D.ai.tals : G.tals;
  const lead = side === 'p' ? D.V : -D.V;
  return {
    talismans: myTals, levels: side === 'p' ? G.levels : D.ai.levels, held,
    deckLeft: me.draw.length, discardsLeft: me.disc, behind: lead < 0,
    oppTalCount: opTals.length, oppLastEl: op.lastEl, oppLastScore: op.lastScore,
    oppShield: !!passive(opTals, 'shield'),
    isDebuffed: side === 'p' ? pDebuff : null,
    forceAdv: side === 'a' && D.opp.id === 'cadi',
    power: side === 'a' ? D.ai.power : 1,
    cursed: side === 'a' && D.cursed,
    flatMult: side === 'p' && D.opp.id === 'kumarbaz' ? 5 : 0,
    preview, rng: Math.random,
  };
}

function sortHand() {
  if (D.sort === 'rank') D.p.hand.sort((a, b) => b.rank - a.rank || ELS.indexOf(a.el) - ELS.indexOf(b.el));
  else D.p.hand.sort((a, b) => ELS.indexOf(a.el) - ELS.indexOf(b.el) || b.rank - a.rank);
}

function drawTo(side, extra = 0) {
  const s = D[side];
  const hs = side === 'p' ? pHandSize() : 8 + passive(D.ai.tals, 'handSize');
  const target = extra ? s.hand.length + extra : hs;
  D.fresh = new Set();
  while (s.hand.length < target && s.draw.length) {
    const c = s.draw.pop();
    s.hand.push(c);
    if (side === 'p') {
      D.fresh.add(c.id);
      if (D.opp.id === 'sis' && Math.random() < 0.25) D.hidden.add(c.id);
    }
  }
  if (side === 'p') sortHand();
}

function whoNext() {
  const order = D.turnNo % 2 === 0 ? D.first : other(D.first);
  if (D[order].hands > 0) return order;
  if (D[other(order)].hands > 0) return other(order);
  return null;
}

async function nextTurn() {
  if (D.over) return;
  if (Math.abs(D.V) >= D.T) return endDuel(D.V > 0 ? 'win' : 'lose', true);
  const w = whoNext();
  if (!w) return endDuel(D.V > 0 ? 'win' : D.V < 0 ? 'lose' : 'draw', false);
  // tıkanma: kart kalmadıysa el yanar
  if (!D[w].hand.length) { D[w].hands = 0; D.turnNo++; return nextTurn(); }
  D.turn = w;
  if (w === 'p') {
    D.busy = false;
    banner('Sıra sende');
    renderAll();
  } else {
    D.busy = true;
    renderAll();
    await aiTurn();
  }
}

function selectedCards() { return D.p.hand.filter(c => D.sel.has(c.id)); }

async function playerPlay() {
  if (!D || D.busy || D.turn !== 'p') return;
  const sel = selectedCards();
  if (!sel.length) { SFX.error(); return; }
  D.busy = true;
  sel.forEach(c => D.hidden.delete(c.id));
  const held = D.p.hand.filter(c => !D.sel.has(c.id));
  D.p.hand = held;
  D.sel.clear();
  D.p.hands--;
  renderMe();
  const sc = scFor('p', sel, held, false);
  const r = scoreHand(sel, sc);
  renderHand(); renderSide();
  await animateScore('p', sel, r);
  runAfter(r, sc);
  D.p.total += r.total; D.V += r.total;
  D.p.lastEl = r.dom; D.p.lastScore = r.total;
  if (r.gold) G.gold += r.gold;
  if (r.total > G.stats.best) { G.stats.best = r.total; G.stats.bestType = r.type; }
  // cam kırılması
  for (const c of r.scoring) {
    if (c.enh === 'cam' && !pDebuff(c) && Math.random() < 0.2) {
      G.deck = G.deck.filter(k => k !== c);
      const el = $(`#pzone .card[data-id="${c.id}"]`);
      if (el) el.classList.add('shatter');
      popAt(el, 'Kırıldı!', 'note'); SFX.break();
      await sleep(500);
    }
  }
  if (D.opp.id === 'tutulma' && r.dom && !D.sealed.has(r.dom)) {
    D.sealed.add(r.dom);
    banner(`${EL[r.dom].name} mühürlendi`);
  }
  await settleScale();
  if (r.total >= Math.max(D.a.lastScore, 1) * 1.5 && r.total > 0) say('hurt');
  drawTo('p');
  D.turnNo++;
  renderAll();
  await sleep(250);
  nextTurn();
}

async function playerDiscard() {
  if (!D || D.busy || D.turn !== 'p' || D.p.disc <= 0) { if (D && D.p.disc <= 0) SFX.error(); return; }
  const sel = selectedCards();
  if (!sel.length) { SFX.error(); return; }
  D.busy = true;
  sel.forEach(c => {
    const el = $(`#hand .card[data-id="${c.id}"]`);
    if (el) { el.classList.add('toss'); FX.atEl(el, (x, y) => { FX.embers(x, y, 12, 30); FX.smoke(x, y - 20, 4); }); }
  });
  SFX.discard();
  await sleep(320);
  D.p.hand = D.p.hand.filter(c => !D.sel.has(c.id));
  sel.forEach(c => D.hidden.delete(c.id));
  D.sel.clear();
  D.p.disc--;
  drawTo('p');
  D.busy = false;
  renderAll();
}

async function aiTurn() {
  banner(`${D.opp.name} düşünüyor…`);
  $('#o-portrait').classList.add('thinking');
  await sleep(650);
  const scf = (pl, h) => scFor('a', pl, h, true);
  for (let k = 0; k < 3 && D.a.disc > 0; k++) {
    const d = aiChooseDiscard(D.a.hand, D.a.draw, scf, D.ai.iq);
    if (!d) break;
    D.a.hand = D.a.hand.filter(c => !d.includes(c));
    D.a.disc--;
    drawTo('a');
    SFX.discard();
    banner(`${D.opp.name} ${d.length} kart attı`);
    renderOpp();
    $('#o-hand').classList.add('shuffle');
    await sleep(700);
    $('#o-hand').classList.remove('shuffle');
  }
  $('#o-portrait').classList.remove('thinking');
  const pl = aiChoosePlay(D.a.hand, scf, D.ai.iq);
  const held = D.a.hand.filter(c => !pl.includes(c));
  D.a.hand = held;
  D.a.hands--;
  const sc = scFor('a', pl, held, false);
  const r = scoreHand(pl, sc);
  D.cursed = false;
  renderOpp();
  await animateScore('a', pl, r);
  runAfter(r, sc);
  D.a.total += r.total; D.V -= r.total;
  const beatMe = r.total > D.p.lastScore && D.p.lastScore > 0;
  D.a.lastEl = r.dom; D.a.lastScore = r.total;
  if (D.opp.id === 'saksagan' && beatMe && G.gold > 0) {
    G.gold--;
    popAt($('#s-gold'), '−1 Altın', 'mult');
    banner('Saksağan 1 altın çaldı!');
    SFX.gold();
  }
  await settleScale();
  if (r.total >= Math.max(D.p.lastScore, 1) * 1.3) say('big');
  drawTo('a');
  D.turnNo++;
  renderAll();
  await sleep(300);
  nextTurn();
}

async function endDuel(outcome, ko) {
  D.over = true; D.busy = true;
  renderAll();
  await sleep(500);
  const lines = [];
  let gain = 0;
  const cap = Math.max(5, passive(G.tals, 'interestCap') || 5);
  const interest = Math.min(Math.floor(G.gold / 5), cap);
  if (outcome === 'win') {
    const base = 4 + Math.ceil(G.ante / 2);
    lines.push(['Zafer ödülü', base]); gain += base;
    if (D.p.hands > 0) { lines.push([`Kalan eller (${D.p.hands})`, D.p.hands]); gain += D.p.hands; }
    if (ko) { lines.push(['Nakavt bonusu', 2]); gain += 2; }
    G.stats.wins++;
  } else {
    lines.push([outcome === 'draw' ? 'Beraberlik tesellisi' : 'Teselli', 3]); gain += 3;
  }
  if (interest) { lines.push([`Faiz (her 5 altına 1)`, interest]); gain += interest; }
  for (const t of G.tals) if (t.def.roundEnd) { const v = t.def.roundEnd(t); lines.push([t.def.name, v]); gain += v; }
  G.gold += gain;
  if (outcome === 'lose') { G.lives--; G.stats.losses++; }
  say(outcome === 'win' ? 'lose' : 'win');
  outcome === 'win' ? SFX.win() : SFX.lose();
  if (outcome === 'win') { FX.flash('#ffb44d', 0.45); FX.flare(); FX.atEl($('#scale-wrap'), (x, y) => { FX.embers(x, y, 60, 200); FX.burst(x, y, { count: 50, max: 420 }); }); }
  else if (outcome === 'lose') { FX.flash('#5a0010', 0.5); FX.atEl($('#scale-wrap'), FX.smoke, 20); }
  saveRecord();

  const finalWin = outcome === 'win' && G.ante === MAX_ANTE;
  const dead = G.lives <= 0;
  const title = outcome === 'win' ? (ko ? 'Nakavt!' : 'Zafer') : outcome === 'draw' ? 'Berabere' : 'Yenilgi';
  const sub = outcome === 'win' ? `${D.opp.name} terazide yenildi.` :
    outcome === 'draw' ? 'Terazi kılı kılına dengede kaldı. Can kaybetmedin.' :
    `${D.opp.name} kazandı. Bir can kaybettin.`;
  const html = `
    <div class="res res-${outcome}">
      <div class="res-portrait">${D.opp.icon}</div>
      <h2>${title}</h2>
      <p>${sub}</p>
      <div class="res-score"><span>Sen <b>${fmt(D.p.total)}</b></span><span>Rakip <b>${fmt(D.a.total)}</b></span></div>
      <table class="res-lines">${lines.map(([a, b]) => `<tr><td>${a}</td><td class="g">+${b}</td></tr>`).join('')}
        <tr class="sum"><td>Toplam</td><td class="g">+${gain} Altın</td></tr></table>
      <div class="lives big">${livesHtml()}</div>
    </div>`;
  const btn = dead ? 'Sonu gör' : finalWin ? 'Zaferi gör' : 'Çarşıya git';
  await modal(html, [{ label: btn, cls: 'btn-big' }]);
  if (dead) return gameOver(false);
  if (finalWin) return gameOver(true);
  // son rakibe kaybettiyse aynı ante tekrar
  if (!(outcome !== 'win' && G.ante === MAX_ANTE)) G.ante++;
  prepareAi();
  openShop();
}

async function gameOver(won) {
  const s = G.stats;
  const html = `
    <div class="res res-${won ? 'win' : 'lose'} final">
      <div class="res-portrait">${won ? '🌞' : '🌑'}</div>
      <h2>${won ? 'Tutulma Sona Erdi' : 'Karanlık Çöktü'}</h2>
      <p>${won ? 'Terazi senden yana eğildi. Şafak söküyor.' : 'Canların tükendi. Terazi bir daha dengelenmeyecek… bu gece.'}</p>
      <table class="res-lines">
        <tr><td>Ulaştığın düello</td><td>${Math.min(G.ante, MAX_ANTE)} / ${MAX_ANTE}</td></tr>
        <tr><td>Kazanılan düello</td><td>${s.wins}</td></tr>
        <tr><td>En iyi el</td><td>${fmt(s.best)} ${s.bestType ? '(' + HAND_BY_ID[s.bestType].name + ')' : ''}</td></tr>
        <tr><td>Tılsımlar</td><td>${G.tals.map(t => t.def.icon).join(' ') || '—'}</td></tr>
      </table>
    </div>`;
  await modal(html, [{ label: 'Ana Menü', cls: 'btn-big' }]);
  showScreen('title-screen');
  renderRecord();
}

function saveRecord() {
  try {
    const r = JSON.parse(localStorage.getItem('terazi-best') || '{}');
    r.ante = Math.max(r.ante || 0, G.ante);
    r.best = Math.max(r.best || 0, G.stats.best);
    if (G.ante === MAX_ANTE && G.stats.wins >= MAX_ANTE) r.won = (r.won || 0) + 1;
    localStorage.setItem('terazi-best', JSON.stringify(r));
  } catch (e) {}
}
function renderRecord() {
  let r = {};
  try { r = JSON.parse(localStorage.getItem('terazi-best') || '{}'); } catch (e) {}
  $('#record').innerHTML = r.ante ? `Rekor: ${r.ante}. düello · En iyi el ${fmt(r.best || 0)}${r.won ? ` · ${r.won} zafer` : ''}` : '';
}

// ============ YAPAY ZEKÂ KONUŞMASI ============
let bubbleTimer = null;
function say(kind) {
  if (!D) return;
  const ls = D.opp.lines && D.opp.lines[kind];
  if (!ls) return;
  const b = $('#o-bubble');
  b.textContent = pick(ls);
  b.classList.add('show');
  clearTimeout(bubbleTimer);
  bubbleTimer = setTimeout(() => b.classList.remove('show'), 2600 / SETTINGS.speed + 600);
  if (kind === 'hurt') { $('#o-portrait').classList.remove('hit'); void $('#o-portrait').offsetWidth; $('#o-portrait').classList.add('hit'); }
}

// ============ BÜYÜLER ============
function canUseSpell(sp, inShop) {
  const def = SPELL_BY_ID[sp.id];
  if (inShop) return def.need[1] === 0 && !def.duel;
  if (!D || D.busy || D.turn !== 'p' || D.over) return false;
  const n = D.sel.size;
  if (def.need[1] === 0) return true;
  return n >= def.need[0] && n <= def.need[1];
}

async function useSpell(idx, inShop) {
  const sp = G.spells[idx];
  if (!sp || !canUseSpell(sp, inShop)) { SFX.error(); return; }
  const def = SPELL_BY_ID[sp.id];
  const sel = inShop ? [] : selectedCards();
  let msg = def.name;
  if (def.id.startsWith('muhur_')) { const el = def.icon; sel.forEach(c => c.el = el); }
  else if (def.id === 'ors') sel.forEach(c => { if (c.rank < 14) c.rank++; });
  else if (def.id === 'yak') {
    const ids = new Set(sel.map(c => c.id));
    G.deck = G.deck.filter(c => !ids.has(c.id));
    D.p.hand = D.p.hand.filter(c => !ids.has(c.id));
    D.sel.clear();
  }
  else if (def.id === 'ayna') { const c = sel[0]; const k = makeCard(c.rank, c.el, c.enh); G.deck.push(k); D.p.hand.push(k); sortHand(); }
  else if (def.id === 'cam') sel.forEach(c => c.enh = 'cam');
  else if (def.id === 'kehribar') sel.forEach(c => c.enh = 'bonus');
  else if (def.id === 'yakut') sel.forEach(c => c.enh = 'mult');
  else if (def.id === 'celik') sel.forEach(c => c.enh = 'celik');
  else if (def.id === 'yaldiz') sel.forEach(c => c.enh = 'altin');
  else if (def.id === 'lanet') { D.cursed = true; msg = 'Rakip lanetlendi'; }
  else if (def.id === 'zaman') { D.p.hands++; msg = '+1 El'; }
  else if (def.id === 'ruzgar') { drawTo('p', 3); }
  else if (def.id === 'hazine') {
    if (G.tals.length >= G.talSlots) { toast('Tılsım yuvan dolu'); SFX.error(); return; }
    const pool = TALISMANS.filter(t => !G.tals.some(x => x.id === t.id));
    const t = addTal(pick(pool).id);
    msg = `${t.def.icon} ${t.def.name}`;
  }
  G.spells.splice(idx, 1);
  SFX.magic();
  toast(msg);
  if (inShop) renderShop(); else renderAll();
}

// ============ DÜKKÂN ============
function rollTal(exclude) {
  const owned = new Set([...G.tals.map(t => t.id), ...exclude]);
  const roll = Math.random();
  const r = roll < 0.6 ? 1 : roll < 0.92 ? 2 : 3;
  let pool = TALISMANS.filter(t => !owned.has(t.id) && t.r === r);
  if (!pool.length) pool = TALISMANS.filter(t => !owned.has(t.id));
  return pool.length ? pick(pool) : null;
}
function rollMisc() {
  const roll = Math.random();
  if (roll < 0.4) {
    const weights = [3, 5, 4, 4, 3, 3, 3, 2, 1, 0.5, 0.5, 0.5];
    let s = Math.random() * weights.reduce((a, b) => a + b), i = 0;
    while (s > weights[i]) s -= weights[i++];
    return { kind: 'star', id: HANDS[i].id, price: 3 };
  }
  if (roll < 0.8) { const sp = pick(SPELLS); return { kind: 'spell', id: sp.id, price: sp.price }; }
  const enh = pick([null, 'cam', 'bonus', 'mult', 'celik', 'altin', 'bonus', 'mult']);
  const c = makeCard(2 + Math.floor(Math.random() * 13), pick(ELS), enh);
  return { kind: 'card', card: c, price: enh ? 4 : 2 };
}
function genShop(keepReroll) {
  const items = [];
  const ex = [];
  for (let i = 0; i < 3; i++) { const t = rollTal(ex); if (t) { ex.push(t.id); items.push({ kind: 'tal', id: t.id, price: t.price }); } }
  const misc = [rollMisc(), rollMisc(), rollMisc()];
  G.shop = { tals: items, misc, reroll: keepReroll || 2 };
}
function openShop() {
  genShop();
  showScreen('shop-screen');
  renderShop();
}
function buy(kind, i) {
  const it = kind === 'tal' ? G.shop.tals[i] : G.shop.misc[i];
  if (!it || it.sold) return;
  if (G.gold < it.price) { SFX.error(); toast('Yeterli altının yok'); return; }
  if (it.kind === 'tal') {
    if (G.tals.length >= G.talSlots) { SFX.error(); toast('Tılsım yuvan dolu — önce birini sat'); return; }
    addTal(it.id);
  } else if (it.kind === 'spell') {
    if (G.spells.length >= G.spellSlots) { SFX.error(); toast('Büyü kesen dolu'); return; }
    G.spells.push({ id: it.id, uid: _uid++ });
  } else if (it.kind === 'star') {
    G.levels[it.id] = (G.levels[it.id] || 1) + 1;
    toast(`${HAND_BY_ID[it.id].name} → seviye ${G.levels[it.id]}`);
  } else if (it.kind === 'card') {
    G.deck.push(it.card);
    toast('Kart destene eklendi');
  }
  G.gold -= it.price;
  it.sold = true;
  SFX.buy();
  renderShop();
}
function sellTal(i) {
  const t = G.tals[i]; if (!t) return;
  const v = Math.max(1, Math.floor(t.def.price / 2));
  G.gold += v;
  G.tals.splice(i, 1);
  SFX.gold();
  toast(`${t.def.name} satıldı (+${v})`);
  hideTip();
  renderShop();
}
function sellSpell(i) {
  G.spells.splice(i, 1);
  G.gold += 1;
  SFX.gold();
  hideTip();
  renderShop();
}
function reroll() {
  const c = G.shop.reroll;
  if (G.gold < c) { SFX.error(); return; }
  G.gold -= c;
  genShop(c + 1);
  SFX.deal();
  renderShop();
}

function renderShop() {
  $('#sh-gold').textContent = G.gold;
  $('#sh-reroll').textContent = `Yenile (${G.shop.reroll})`;
  $('#sh-tals').innerHTML = G.shop.tals.map((it, i) => offerHtml(it, 'tal', i)).join('') || '<p class="empty">Tükendi</p>';
  $('#sh-misc').innerHTML = G.shop.misc.map((it, i) => offerHtml(it, 'misc', i)).join('');
  $('#sh-mytals').innerHTML = talRowHtml(G.tals, true);
  $('#sh-talcount').textContent = `${G.tals.length}/${G.talSlots}`;
  $('#sh-myspells').innerHTML = spellRowHtml(true);
  const opp = G.opps[G.ante - 1];
  const ai = G.nextAi;
  $('#sh-next').innerHTML = `
    <div class="lbl">Sıradaki rakip · ${G.ante}/${MAX_ANTE}</div>
    <div class="medallion big"><span>${opp.icon}</span></div>
    <div class="opp-name">${opp.name}</div>
    <div class="opp-quirk">${opp.quirk}</div>
    <div class="np-stats">Güç <b>×${fmtM(ai.power)}</b> · KO <b>${fmt(ANTE.koBase * ai.power)}</b></div>
    <div class="np-tals">${ai.tals.map(t => `<span class="mini-tal" data-tip="${tipTal(t)}">${t.def.icon}</span>`).join('') || '<i>Tılsımı yok</i>'}</div>
    <div class="lives">${livesHtml()}</div>`;
}

function offerHtml(it, kind, i) {
  let inner, tip, label;
  if (it.kind === 'tal') { const d = TAL_BY_ID[it.id]; inner = talCardHtml({ def: d, id: it.id }); tip = tipTal({ def: d }); label = d.name; }
  else if (it.kind === 'spell') { const d = SPELL_BY_ID[it.id]; inner = sealHtml(d); tip = `<b>${d.name}</b><br>${d.desc}`; label = d.name; }
  else if (it.kind === 'star') {
    const h = HAND_BY_ID[it.id]; const lv = G.levels[it.id] || 1;
    inner = `<div class="star"><div class="star-glyph">✦</div><div class="star-name">${h.star}</div></div>`;
    tip = `<b>Yıldız: ${h.star}</b><br>${h.name} el türünü 1 seviye yükseltir.<br><small>Şu an: Sv.${lv} — +${h.lc} Çip, +${h.lm} Çarpan</small>`;
    label = `${h.name} +1`;
  } else { inner = cardHtml(it.card); tip = tipCard(it.card); label = 'Kart'; }
  return `<div class="offer ${it.sold ? 'sold' : ''}" data-buy="${kind}" data-i="${i}" data-tip="${esc(tip)}">
    ${inner}<div class="offer-lbl">${label}</div>
    <div class="price ${G.gold < it.price ? 'poor' : ''}">${it.sold ? 'Alındı' : it.price + '<i class="coin"></i>'}</div></div>`;
}

// ============ ÇİZİM ============
function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

function cardHtml(c, opts = {}) {
  const st = `style="${opts.style || ''}"`;
  if (opts.hidden) return `<div class="card back" data-id="${c.id}" ${opts.drag ? 'draggable="true"' : ''} ${st}><div class="ci">${backArt()}</div></div>`;
  const cls = ['card', 'el-' + c.el];
  if (c.enh) cls.push('enh-' + c.enh);
  if (opts.sel) cls.push('sel');
  if (opts.debuff) cls.push('debuff');
  if (opts.fresh) cls.push('deal');
  if (c.rank >= 11) cls.push('face');
  const rl = rankLabel(c.rank);
  const title = c.rank >= 11 ? `${RANK_NAME[c.rank]} ${elIcon(c.el, 12)}` : EL[c.el].name;
  return `<div class="${cls.join(' ')}" data-id="${c.id}" ${opts.drag ? 'draggable="true"' : ''} ${st}>
    <div class="ci">
      <div class="frame"></div>
      <div class="numeral">${ROMAN[c.rank]}</div>
      <div class="corner tl"><span>${rl}</span>${elIcon(c.el, 12)}</div>
      <div class="corner br"><span>${rl}</span>${elIcon(c.el, 12)}</div>
      <div class="art">${inkArt(c)}</div>
      <div class="ttl">${title}</div>
      ${c.enh ? `<div class="enh-tag">${ENH[c.enh].name}</div>` : ''}
      <div class="sheen"></div>
    </div>
  </div>`;
}
function talCardHtml(t, opts = {}) {
  const d = t.def;
  return `<div class="tal r${d.r} ${opts.cls || ''}" data-uid="${t.uid || ''}" ${opts.drag ? 'draggable="true"' : ''}>
    <div class="tal-num">${toRoman(TALISMANS.indexOf(d) + 1)}</div><div class="tal-icon">${d.icon}</div><div class="tal-name">${d.name}</div></div>`;
}
function sealHtml(d) {
  const isEl = ELS.includes(d.icon);
  const icon = isEl ? elIcon(d.icon, 28) : `<span>${d.icon}</span>`;
  return `<div class="seal ${isEl ? 'el-seal' : ''}" ${isEl ? `style="--sc:${EL[d.icon].color}"` : ''}>${icon}</div>`;
}
function tipTal(t) {
  const d = t.def;
  const stat = d.stat && t.n !== undefined || (d.stat && t.x !== undefined) ? `<br><i>${d.stat(t)}</i>` : '';
  return `<b>${d.icon} ${d.name}</b> <small class="rar r${d.r}">${RARITY[d.r]}</small><br>${d.desc}${stat}`;
}
function tipCard(c) {
  let s = `<b>${RANK_NAME[c.rank] || c.rank} · ${EL[c.el].name}</b><br>+${cardChips(c.rank)} Çip`;
  if (c.enh) s += `<br><b>${ENH[c.enh].name}:</b> ${ENH[c.enh].desc}`;
  if (D && !D.over && pDebuff(c)) s += `<br><span class="bad">Bu düelloda etkisiz</span>`;
  return s;
}
function livesHtml() {
  let s = '';
  for (let i = 0; i < 3; i++) s += `<span class="life ${i < G.lives ? 'on' : ''}">☀</span>`;
  return s;
}
function talRowHtml(tals, sell) {
  let s = '';
  tals.forEach((t, i) => {
    const tip = tipTal(t) + (sell ? `<br><small>Tıkla: sat (+${Math.max(1, Math.floor(t.def.price / 2))} altın)</small>` : '');
    s += `<div class="slot" data-tal="${i}" data-tip="${esc(tip)}">${talCardHtml(t, { drag: true })}</div>`;
  });
  for (let i = tals.length; i < G.talSlots; i++) s += `<div class="slot empty"></div>`;
  return s;
}
function spellRowHtml(inShop) {
  let s = '';
  G.spells.forEach((sp, i) => {
    const d = SPELL_BY_ID[sp.id];
    const usable = canUseSpell(sp, inShop);
    const how = inShop ? (usable ? 'Tıkla: kullan · Sağ tık: sat (+1)' : 'Düelloda kullanılır · Sağ tık: sat (+1)')
      : (d.need[1] ? `${d.need[0] === d.need[1] ? d.need[0] : d.need[0] + '–' + d.need[1]} kart seç, sonra tıkla` : 'Tıkla: kullan');
    s += `<div class="sslot ${usable ? 'usable' : ''}" data-spell="${i}" data-tip="${esc(`<b>${d.name}</b><br>${d.desc}<br><small>${how}</small>`)}">${sealHtml(d)}</div>`;
  });
  for (let i = G.spells.length; i < G.spellSlots; i++) s += `<div class="sslot empty"></div>`;
  return s;
}

function renderAll() { renderSide(); renderOpp(); renderHand(); renderMe(); renderElHint(); }

function renderSide() {
  if (!G) return;
  $('#s-ante').textContent = G.ante;
  $('#s-lives').innerHTML = livesHtml();
  $('#s-gold').textContent = G.gold;
  if (D) {
    $('#s-hands').textContent = D.p.hands;
    $('#s-disc').textContent = D.p.disc;
    $('#s-deck').textContent = `${D.p.draw.length}/${G.deck.length}`;
    $('#s-sealed').innerHTML = D.sealed.size ? `<span class="lbl">Mühürlü</span> ${[...D.sealed].map(e => elIcon(e, 20)).join('')}` : '';
  }
  if (D && !D.animating) updatePreview();
}

function updatePreview() {
  const sel = selectedCards();
  const hn = $('#h-name'), hl = $('#h-lvl');
  $('#score-box').classList.remove('scoring');
  if (!sel.length) {
    hn.textContent = D.turn === 'p' ? 'Kart seç' : '—';
    hl.innerHTML = '&nbsp;'; $('#h-chips').textContent = '0'; $('#h-mult').textContent = '0';
    $('#h-total').innerHTML = '&nbsp;'; $('#h-adv').innerHTML = '&nbsp;';
    return;
  }
  const ev = evaluate(sel);
  const H = HAND_BY_ID[ev.type], lv = G.levels[ev.type] || 1;
  hn.textContent = H.name; hl.textContent = `Seviye ${lv}`;
  $('#h-chips').textContent = H.chips + H.lc * (lv - 1);
  $('#h-mult').textContent = H.mult + H.lm * (lv - 1);
  $('#h-total').innerHTML = '&nbsp;';
  const live = ev.scoring.filter(c => !pDebuff(c));
  const dom = dominantElement(live.length ? live : ev.scoring);
  const shield = passive(D.ai.tals, 'shield');
  let adv = '&nbsp;';
  if (dom) {
    const am = passive(G.tals, 'advMult') || 1.5;
    if (D.a.lastEl && BEATS[dom] === D.a.lastEl) adv = shield ? `${elIcon(dom, 16)} üstün ama rakibin Kalkanı var` : `${elIcon(dom, 16)} <b class="good">Üstünlük ×${fmtM(am)}</b>`;
    else adv = `Baskın: ${elIcon(dom, 16)} ${EL[dom].name}`;
  }
  $('#h-adv').innerHTML = adv;
}

function renderOpp() {
  if (!D) return;
  const o = D.opp;
  $('#o-portrait').innerHTML = `<span>${o.icon}</span>`;
  $('#o-name').textContent = o.name;
  let q = o.quirk;
  if (o.id === 'muhurcu') q = `Mühürlediği element: <b class="e-${[...D.sealed][0]}">${EL[[...D.sealed][0]].name}</b>. O elementteki kartların puan vermez.`;
  $('#o-quirk').innerHTML = q;
  $('#o-tals').innerHTML = D.ai.tals.map(t => `<div class="slot" data-tip="${esc(tipTal(t))}">${talCardHtml(t, { cls: 'small' })}</div>`).join('');
  $('#o-hand').innerHTML = D.a.hand.map((c, i) => `<div class="mini-back" style="--i:${i};--n:${D.a.hand.length}"></div>`).join('');
  $('#o-hands').textContent = D.a.hands;
  $('#o-disc').textContent = D.a.disc;
  const lv = Object.entries(D.ai.levels).map(([k, v]) => `${HAND_BY_ID[k].name} Sv.${v}`).join(', ');
  $('#o-pow').textContent = '×' + fmtM(D.ai.power);
  $('#o-pow').parentElement.dataset.tip = esc(`<b>Rakip gücü</b><br>Rakibin her eli ×${fmtM(D.ai.power)} ile çarpılır.${lv ? '<br>El seviyeleri: ' + lv : ''}${D.cursed ? '<br><span class="bad">Lanetli: sonraki eli ×0.5</span>' : ''}`);
  $('#opp').classList.toggle('active-turn', D.turn === 'a' && !D.over);
  $('#opp').classList.toggle('cursed', D.cursed);
}

function renderHand() {
  if (!D) return;
  const h = $('#hand');
  const n = D.p.hand.length;
  const w = h.clientWidth || 800;
  const cw = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--cw')) || 92;
  const overlap = n > 1 ? Math.min(10, (w - cw * n) / (n - 1)) : 0;
  h.style.setProperty('--gap', overlap + 'px');
  h.innerHTML = D.p.hand.map((c, i) => {
    const mid = (n - 1) / 2;
    const rot = (i - mid) * 1.6;
    const lift = Math.abs(i - mid) * Math.abs(i - mid) * 1.2;
    return cardHtml(c, {
      sel: D.sel.has(c.id), debuff: pDebuff(c), fresh: D.fresh.has(c.id), hidden: D.hidden.has(c.id), drag: true,
      style: `--rot:${rot}deg;--lift:${lift}px;--d:${i * 40}ms`,
    });
  }).join('');
  // kapalı kartlar seçilebilsin
  D.p.hand.forEach(c => { if (D.hidden.has(c.id) && D.sel.has(c.id)) { const el = h.querySelector(`[data-id="${c.id}"]`); if (el) el.classList.add('sel'); } });
  D.fresh = new Set();
}

function renderMe() {
  if (!D) return;
  $('#p-tals').innerHTML = talRowHtml(G.tals, false);
  $('#p-spells').innerHTML = spellRowHtml(false);
  const myTurn = D.turn === 'p' && !D.busy && !D.over;
  const n = D.sel.size;
  $('#btn-play').disabled = !myTurn || !n;
  $('#btn-disc').disabled = !myTurn || !n || D.p.disc <= 0;
  $('#me').classList.toggle('active-turn', myTurn);
  $('#sort-rank').classList.toggle('on', D.sort === 'rank');
  $('#sort-el').classList.toggle('on', D.sort === 'el');
}

function elWheel(hi = {}) {
  // saat yönünde: ates → yaprak → tas → su → ates
  const pos = { ates: [50, 12], yaprak: [88, 50], tas: [50, 88], su: [12, 50] };
  let s = `<svg viewBox="0 0 100 100" class="wheel">`;
  s += `<circle cx="50" cy="50" r="38" fill="none" stroke="#d8b25c33" stroke-width="1"/>`;
  const order = ['ates', 'yaprak', 'tas', 'su'];
  order.forEach((e, i) => {
    const a = (i * 90 - 90 + 45) * Math.PI / 180;
    const x = 50 + 38 * Math.cos(a), y = 50 + 38 * Math.sin(a);
    const rot = i * 90 + 45 + 90;
    s += `<path d="M-4 -3 L2 0 L-4 3" transform="translate(${x} ${y}) rotate(${rot - 90})" fill="none" stroke="#d8b25c" stroke-width="1.5"/>`;
  });
  for (const e of order) {
    const [x, y] = pos[e];
    const cls = hi[e] || '';
    s += `<g class="wnode ${cls}"><circle cx="${x}" cy="${y}" r="11" fill="#140f2a" stroke="${EL[e].color}" stroke-width="${cls ? 2.5 : 1}"/>
      <svg x="${x - 7}" y="${y - 7}" width="14" height="14" viewBox="0 0 24 24" fill="${EL[e].color}">${EL_PATHS[e]}</svg></g>`;
  }
  return s + '</svg>';
}

function renderElHint() {
  if (!D) return;
  const ae = D.a.lastEl, pe = D.p.lastEl;
  const hi = {};
  if (ae) { hi[ae] = 'opp'; hi[BEATEN_BY[ae]] = 'counter'; }
  let txt = '';
  if (ae) txt += `<div>Rakibin son elementi ${elIcon(ae, 16)} — <b>${elIcon(BEATEN_BY[ae], 16)} ${EL[BEATEN_BY[ae]].name}</b> ile yenersin</div>`;
  else txt += `<div>Rakip henüz element göstermedi</div>`;
  if (D.opp.id === 'cadi') txt += `<div class="bad">Ayna Cadısı her zaman üstün sayılır</div>`;
  else if (pe) txt += `<div class="dim">Senin son elementin ${elIcon(pe, 14)} — rakip ${elIcon(BEATEN_BY[pe], 14)} ile yener</div>`;
  $('#elhint').innerHTML = `${elWheel(hi)}<div class="eh-txt">${txt}</div>`;
}

function clearZones() {
  for (const z of ['#azone', '#pzone']) { $(z + ' .zone-cards').innerHTML = ''; $(z + ' .zone-res').innerHTML = ''; }
}
function clearBoard() {
  D = null;
  clearZones();
  $('#hand').innerHTML = '';
}

// ============ TERAZİ ============
const BEAM_L = 150, PIV = [220, 62];
let scaleAnim = null;
function scaleTarget() { return Math.max(-1, Math.min(1, D.V / D.T)) * 20; }
function drawBeam(a) {
  const r = a * Math.PI / 180;
  $('#beam').setAttribute('transform', `rotate(${a} ${PIV[0]} ${PIV[1]})`);
  const dx = BEAM_L * Math.cos(r), dy = BEAM_L * Math.sin(r);
  $('#panL').setAttribute('transform', `translate(${PIV[0] - dx} ${PIV[1] - dy})`);
  $('#panR').setAttribute('transform', `translate(${PIV[0] + dx} ${PIV[1] + dy})`);
}
function setScale(instant) {
  $('#panLtxt').textContent = fmt(D.a.total);
  $('#panRtxt').textContent = fmt(D.p.total);
  $('#v-T').textContent = fmt(D.T);
  const v = D.V;
  $('#v-text').innerHTML = v === 0 ? 'Terazi dengede' : v > 0 ? `Sen <b class="good">+${fmt(v)}</b> öndesin` : `Rakip <b class="bad">+${fmt(-v)}</b> önde`;
  const f = Math.max(-1, Math.min(1, v / D.T));
  $('#rope-knot').style.left = (50 + f * 50) + '%';
  const fill = $('#rope-fill');
  fill.style.left = (f >= 0 ? 50 : 50 + f * 50) + '%';
  fill.style.width = Math.abs(f * 50) + '%';
  fill.className = 'rope-fill ' + (f >= 0 ? 'me' : 'them');
  const target = scaleTarget();
  if (instant) { D.angle = target; drawBeam(target); return Promise.resolve(); }
  return new Promise(res => {
    cancelAnimationFrame(scaleAnim);
    let a = D.angle, vel = 0, last = performance.now(), settled = 0;
    const step = now => {
      const dt = Math.min(0.033, (now - last) / 1000) * SETTINGS.speed; last = now;
      const acc = 90 * (target - a) - 7 * vel;
      vel += acc * dt; a += vel * dt;
      drawBeam(a); D.angle = a;
      if (Math.abs(target - a) < 0.05 && Math.abs(vel) < 0.1) { settled++; } else settled = 0;
      if (settled > 3) { drawBeam(target); D.angle = target; res(); return; }
      scaleAnim = requestAnimationFrame(step);
    };
    scaleAnim = requestAnimationFrame(step);
    setTimeout(res, 1600 / SETTINGS.speed);
  });
}
async function settleScale() {
  SFX.thud();
  FX.atEl($(D.V >= 0 ? '#panR' : '#panL'), (x, y) => { FX.smoke(x, y + 20, 7); FX.burst(x, y + 16, { count: 10, max: 120, color: [230, 190, 120], gravity: 300 }); });
  $('#scale-wrap').classList.remove('bump'); void $('#scale-wrap').offsetWidth; $('#scale-wrap').classList.add('bump');
  await setScale(false);
}

// ============ PUAN ANİMASYONU ============
function popAt(el, text, kind) {
  if (!el) return;
  const r = el.getBoundingClientRect();
  const p = document.createElement('div');
  p.className = 'pop pop-' + kind;
  p.textContent = text;
  p.style.left = (r.left + r.width / 2) + 'px';
  p.style.top = (r.top + 4) + 'px';
  p.style.animationDuration = (900 / SETTINGS.speed) + 'ms';
  $('#fx').appendChild(p);
  setTimeout(() => p.remove(), 1000 / SETTINGS.speed + 100);
}
const FX_COL = { chips: [110, 170, 255], mult: [255, 90, 60], x: [200, 120, 255], gold: [255, 215, 90] };
function burstFor(el, kind, src) {
  if (!el) return;
  if (kind === 'note') { FX.atEl(el, FX.smoke, 4); return; }
  const big = kind === 'x';
  FX.atEl(el, (x, y) => {
    FX.burst(x, y, { color: FX_COL[kind], count: big ? 34 : 12, max: big ? 340 : 170, size: big ? 3.4 : 2.4 });
    if (big || kind === 'mult') FX.embers(x, y, big ? 16 : 5, 20);
  });
  if (big) FX.flash(src === 'adv' ? '#7ee08a' : '#9a40ff', 0.16);
}
function jiggle(el) {
  if (!el) return;
  el.classList.remove('jiggle'); void el.offsetWidth; el.classList.add('jiggle');
}
function bumpBox(sel) {
  const el = $(sel); el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump');
}

async function animateScore(side, played, r) {
  D.animating = true;
  SFX.resetPitch();
  const zone = $(side === 'p' ? '#pzone' : '#azone');
  const other_ = $(side === 'p' ? '#azone' : '#pzone');
  other_.classList.add('dim');
  zone.classList.remove('dim');
  zone.classList.add('live');
  const scoringSet = new Set(r.scoring);
  zone.querySelector('.zone-cards').innerHTML = played.map((c, i) => cardHtml(c, { debuff: side === 'p' && pDebuff(c), style: `--d:${i * 70}ms` })).join('');
  zone.querySelector('.zone-res').innerHTML = '';
  zone.querySelectorAll('.card').forEach(el => el.classList.add('fly-in'));
  SFX.deal();
  setTimeout(() => FX.atEl(zone.querySelector('.zone-cards'), (x, y) => FX.smoke(x, y + 30, 6)), 200 / SETTINGS.speed);
  const H = HAND_BY_ID[r.type];
  $('#score-box').classList.add('scoring');
  $('#score-box').classList.toggle('enemy', side === 'a');
  $('#h-name').textContent = (side === 'a' ? D.opp.name + ': ' : '') + H.name;
  $('#h-lvl').textContent = `Seviye ${r.level}`;
  $('#h-total').innerHTML = '&nbsp;';
  $('#h-adv').innerHTML = '&nbsp;';
  await sleep(550);
  zone.querySelectorAll('.card').forEach(el => {
    const c = played.find(k => String(k.id) === el.dataset.id);
    el.classList.remove('fly-in');
    el.classList.add(scoringSet.has(c) ? 'scores' : 'kicker');
  });
  await sleep(250);
  const talEl = t => t ? (side === 'p' ? $(`#p-tals [data-uid="${t.uid}"]`) : $(`#o-tals [data-uid="${t.uid}"]`)) : null;
  for (const e of r.events) {
    if (e.k === 'base') {
      $('#h-chips').textContent = fmt(e.chips); $('#h-mult').textContent = fmtM(e.mult);
      bumpBox('#h-chips'); bumpBox('#h-mult');
      continue;
    }
    let anchor = null;
    if (e.card) {
      anchor = zone.querySelector(`.card[data-id="${e.card.id}"]`);
      if (e.src === 'held') anchor = side === 'p' ? $(`#hand .card[data-id="${e.card.id}"]`) : $('#o-hand');
    }
    const tEl = (e.src && typeof e.src === 'object') ? talEl(e.src) : null;
    if (!anchor && tEl) anchor = tEl;
    if (e.src === 'adv') anchor = $('#elhint .wheel');
    if (e.src === 'power' || e.src === 'quirk') anchor = side === 'a' ? $('#o-portrait') : $('#o-portrait');
    if (e.src === 'curse') anchor = $('#o-portrait');
    if (!anchor) anchor = $('#score-box');
    if (tEl) jiggle(tEl);
    if (e.card && anchor) jiggle(anchor);
    let label = '';
    if (e.k === 'chips') { label = '+' + fmt(e.v); SFX.chips(); bumpBox('#h-chips'); }
    else if (e.k === 'mult') { label = '+' + fmtM(e.v) + ' Çarpan'; SFX.mult(); bumpBox('#h-mult'); }
    else if (e.k === 'x') { label = '×' + fmtM(e.v); SFX.x(); bumpBox('#h-mult'); }
    else if (e.k === 'gold') { label = '+' + e.v + ' Altın'; SFX.gold(); }
    else if (e.k === 'note') { label = e.text; }
    if (e.src === 'adv') label = 'Üstünlük ' + label;
    if (e.src === 'power') label = 'Güç ' + label;
    if (e.src === 'curse') label = 'Lanet ' + label;
    popAt(anchor, label, e.k);
    burstFor(anchor, e.k, e.src);
    $('#h-chips').textContent = fmt(e.chips);
    $('#h-mult').textContent = fmtM(e.mult);
    const delay = e.k === 'x' ? 480 : e.k === 'note' ? 300 : 330;
    await sleep(delay);
  }
  // toplam
  const tot = $('#h-total');
  tot.classList.add('show');
  const steps = 14;
  for (let i = 1; i <= steps; i++) {
    tot.textContent = fmt(r.total * i / steps);
    await sleep(28);
  }
  tot.textContent = fmt(r.total);
  SFX.total();
  FX.atEl(tot, (x, y) => { FX.embers(x, y, 26, 60); FX.burst(x, y, { count: 20, max: 220 }); });
  if (r.total >= D.T * 0.25) FX.flare();
  if (r.total >= D.T * 0.5) {
    $('#board').classList.remove('shake'); void $('#board').offsetWidth; $('#board').classList.add('shake');
    FX.flash(side === 'p' ? '#ff8a2a' : '#c4002b', 0.3);
  }
  zone.querySelector('.zone-res').innerHTML = `<span class="zr-type">${H.name}</span>${r.dom ? elIcon(r.dom, 18) : ''}<b class="zr-total">${fmt(r.total)}</b>${r.adv ? '<span class="zr-adv">üstün</span>' : ''}`;
  await sleep(600);
  tot.classList.remove('show');
  zone.classList.remove('live');
  other_.classList.remove('dim');
  $('#score-box').classList.remove('enemy');
  D.animating = false;
}

// ============ ARAYÜZ YARDIMCILARI ============
function showScreen(id) {
  document.body.dataset.screen = id;
  $$('.screen').forEach(s => s.classList.toggle('active', s.id === id));
  hideTip();
}

let bannerT = null;
function banner(text) {
  const b = $('#banner');
  b.textContent = text;
  b.classList.remove('show'); void b.offsetWidth; b.classList.add('show');
  clearTimeout(bannerT);
  bannerT = setTimeout(() => b.classList.remove('show'), 1500);
}
function toast(text) {
  const t = document.createElement('div');
  t.className = 'toast'; t.innerHTML = text;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2200);
}

function modal(html, buttons = [{ label: 'Tamam' }], opts = {}) {
  return new Promise(res => {
    const root = $('#modal-root');
    const m = document.createElement('div');
    m.className = 'modal-bg';
    m.innerHTML = `<div class="modal ${opts.cls || ''}">${opts.close ? '<button class="mclose" data-mb="-1">×</button>' : ''}<div class="modal-body">${html}</div>
      <div class="modal-btns">${buttons.map((b, i) => `<button class="btn ${b.cls || ''}" data-mb="${i}">${b.label}</button>`).join('')}</div></div>`;
    root.appendChild(m);
    const done = i => { m.classList.add('out'); setTimeout(() => m.remove(), 200); res(i); };
    m.addEventListener('click', e => {
      const b = e.target.closest('[data-mb]');
      if (b) done(+b.dataset.mb);
      else if (opts.close && e.target === m) done(-1);
    });
    const firstBtn = m.querySelector('.modal-btns .btn');
    if (firstBtn) setTimeout(() => firstBtn.focus(), 50);
  });
}

async function showIntro() {
  const opp = G.opps[G.ante - 1];
  const ai = G.nextAi;
  const html = `
    <div class="intro">
      <div class="lbl">Düello ${G.ante} / ${MAX_ANTE}${opp.final ? ' · Son Düello' : ''}</div>
      <div class="medallion huge"><span>${opp.icon}</span></div>
      <h2>${opp.name}</h2>
      <p class="quirk">${opp.quirk}</p>
      <div class="intro-stats">
        <div><span>Güç</span><b>×${fmtM(ai.power)}</b></div>
        <div><span>KO eşiği</span><b>${fmt(ANTE.koBase * ai.power)}</b></div>
        <div><span>İlk hamle</span><b>${G.ante % 2 === 1 ? 'Sen' : 'Rakip'}</b></div>
      </div>
      ${ai.tals.length ? `<div class="intro-tals">${ai.tals.map(t => `<div class="itl">${talCardHtml(t, { cls: 'small' })}<div><b>${t.def.name}</b><br><small>${t.def.desc}</small></div></div>`).join('')}</div>` : '<p class="dim">Bu rakibin tılsımı yok.</p>'}
    </div>`;
  await modal(html, [{ label: 'Düelloya Başla', cls: 'btn-big' }]);
  startDuel();
}

function showHelp() {
  const html = `
  <div class="help">
    <h2>Nasıl Oynanır?</h2>
    <div class="help-grid">
      <div><h4>⚖️ Terazi</h4><p>Sen ve rakip <b>sırayla</b> el oynarsınız. Her elin puanı teraziyi senin tarafına, rakibinki onun tarafına indirir. Terazi <b>KO eşiğini</b> geçerse düello anında biter. Eller bitince terazi kimden yanaysa o kazanır.</p></div>
      <div><h4>🃏 El kurmak</h4><p>En fazla <b>5 kart</b> seç ve poker eli kur. Puan = <span class="c-chips">Çip</span> × <span class="c-mult">Çarpan</span>. Sadece eli oluşturan kartlar çip verir. <b>At</b> ile seçtiğin kartları değiştirebilirsin.</p></div>
      <div><h4>🔥 Elementler</h4><p>Dört element bir çember oluşturur:<br><b class="e-ates">Ateş</b> → <b class="e-yaprak">Yaprak</b> → <b class="e-tas">Taş</b> → <b class="e-su">Su</b> → <b class="e-ates">Ateş</b><br>Elinin <b>baskın elementi</b>, rakibin son elinin elementini yenerse <b>×1.5</b> alırsın. Rakip de aynısını sana yapar!</p></div>
      <div><h4>🎭 Rakipler</h4><p>8 rakip var, her birinin <b>kendine has bir kuralı</b> ve güç çarpanı var. İlerledikçe tılsım da kuşanırlar. Sonunda seni <b>Kara Tutulma</b> bekliyor.</p></div>
      <div><h4>💰 Çarşı</h4><p>Her düellodan sonra altınla <b>tılsım</b> (kalıcı güç), <b>büyü</b> (tek kullanımlık), <b>yıldız</b> (el seviyesi) ve yeni <b>kart</b> alırsın. Her 5 altın için 1 faiz kazanırsın.</p></div>
      <div><h4>☀ Canlar</h4><p>3 canın var. Kaybettiğin her düello bir can götürür ama yoluna devam edersin. Canların biterse oyun biter.</p></div>
    </div>
    <p class="dim">İpucu: Tılsımlar soldan sağa çalışır — sürükleyerek sırasını değiştir. Kartları da sürükleyebilirsin. Kısayollar: <kbd>Enter</kbd> oyna, <kbd>X</kbd> at.</p>
  </div>`;
  return modal(html, [{ label: 'Anladım' }], { cls: 'wide', close: true });
}

function showLevels() {
  const rows = HANDS.slice().reverse().map(h => {
    const lv = G.levels[h.id] || 1;
    return `<tr class="${lv > 1 ? 'up' : ''}"><td>${h.name}</td><td>Sv.${lv}</td><td class="c-chips">${h.chips + h.lc * (lv - 1)}</td><td class="c-mult">${h.mult + h.lm * (lv - 1)}</td><td class="dim">${h.star}</td></tr>`;
  }).join('');
  return modal(`<h2>El Tablosu</h2><table class="lvl-table"><tr><th>El</th><th>Seviye</th><th>Çip</th><th>Çarpan</th><th>Yıldız</th></tr>${rows}</table>`, [{ label: 'Kapat' }], { close: true });
}

function showDeck() {
  const inDraw = D && !D.over ? new Set(D.p.draw.map(c => c.id)) : null;
  const rows = ELS.map(el => {
    const cs = G.deck.filter(c => c.el === el).sort((a, b) => b.rank - a.rank);
    return `<div class="deck-row"><div class="deck-el">${elIcon(el, 22)}<small>${cs.length}</small></div><div class="deck-cards">${cs.map(c => `<div class="dk ${inDraw && !inDraw.has(c.id) ? 'used' : ''}" data-tip="${esc(tipCard(c))}">${cardHtml(c)}</div>`).join('')}</div></div>`;
  }).join('');
  return modal(`<h2>Destem <small>${G.deck.length} kart${inDraw ? ` · ${inDraw.size} çekilecek` : ''}</small></h2><div class="deck-view">${rows}</div>`, [{ label: 'Kapat' }], { cls: 'wide', close: true });
}

// ---- tooltip ----
const tip = $('#tip');
function hideTip() { tip.classList.remove('show'); }
document.addEventListener('mouseover', e => {
  const t = e.target.closest('[data-tip]');
  if (!t) { hideTip(); return; }
  tip.innerHTML = t.dataset.tip;
  tip.classList.add('show');
});
document.addEventListener('mousemove', e => {
  if (!tip.classList.contains('show')) return;
  const w = tip.offsetWidth, h = tip.offsetHeight;
  let x = e.clientX + 16, y = e.clientY + 16;
  if (x + w > innerWidth - 8) x = e.clientX - w - 16;
  if (y + h > innerHeight - 8) y = e.clientY - h - 16;
  tip.style.left = x + 'px'; tip.style.top = y + 'px';
});

// ============ OLAYLAR ============
$('#btn-new').onclick = () => { SFX.select(); newRun(); };
$('#btn-how').onclick = showHelp;
$('#btn-help').onclick = showHelp;
$('#btn-levels').onclick = showLevels;
$('#sh-levels').onclick = showLevels;
$('#btn-deck').onclick = showDeck;
$('#sh-deck').onclick = showDeck;
$('#btn-play').onclick = playerPlay;
$('#btn-disc').onclick = playerDiscard;
$('#sh-reroll').onclick = reroll;
$('#sh-go').onclick = () => { showScreen('game-screen'); clearBoard(); showIntro(); };
$('#btn-quit').onclick = async () => {
  const i = await modal('<h2>Ana menüye dön?</h2><p>Bu koşu kaybolacak.</p>', [{ label: 'Evet, çık' }, { label: 'Vazgeç' }]);
  if (i === 0) { D && (D.over = true); showScreen('title-screen'); renderRecord(); }
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
$('#sort-rank').onclick = () => { if (!D) return; D.sort = SETTINGS.sort = 'rank'; saveSettings(); sortHand(); renderHand(); renderMe(); };
$('#sort-el').onclick = () => { if (!D) return; D.sort = SETTINGS.sort = 'el'; saveSettings(); sortHand(); renderHand(); renderMe(); };

$('#hand').addEventListener('click', e => {
  const el = e.target.closest('.card');
  if (!el || !D || D.over || D.animating) return;
  const id = +el.dataset.id;
  if (D.sel.has(id)) { D.sel.delete(id); SFX.deselect(); }
  else { if (D.sel.size >= 5) { SFX.error(); return; } D.sel.add(id); SFX.select(); }
  el.classList.toggle('sel', D.sel.has(id));
  renderSide(); renderMe();
});

$('#p-spells').addEventListener('click', e => {
  const s = e.target.closest('[data-spell]'); if (!s) return;
  useSpell(+s.dataset.spell, false);
});
$('#sh-myspells').addEventListener('click', e => {
  const s = e.target.closest('[data-spell]'); if (!s) return;
  useSpell(+s.dataset.spell, true);
});
$('#sh-myspells').addEventListener('contextmenu', e => {
  const s = e.target.closest('[data-spell]'); if (!s) return;
  e.preventDefault(); sellSpell(+s.dataset.spell);
});
$('#sh-mytals').addEventListener('click', async e => {
  const s = e.target.closest('[data-tal]'); if (!s) return;
  const t = G.tals[+s.dataset.tal];
  const v = Math.max(1, Math.floor(t.def.price / 2));
  const i = await modal(`<div class="sell-q">${talCardHtml(t)}<p>${tipTal(t)}</p></div>`, [{ label: `Sat (+${v} altın)` }, { label: 'Vazgeç' }]);
  if (i === 0) sellTal(+s.dataset.tal);
});
$('.shop-main').addEventListener('click', e => {
  const o = e.target.closest('[data-buy]'); if (!o) return;
  buy(o.dataset.buy, +o.dataset.i);
});

// sürükle-bırak: kartlar ve tılsımlar
let dragSrc = null;
document.addEventListener('dragstart', e => {
  const c = e.target.closest('#hand .card');
  const t = e.target.closest('[data-tal]');
  if (c) dragSrc = { kind: 'card', id: +c.dataset.id };
  else if (t) dragSrc = { kind: 'tal', i: +t.dataset.tal };
  else return;
  e.dataTransfer.effectAllowed = 'move';
  try { e.dataTransfer.setData('text/plain', 'x'); } catch (err) {}
  hideTip();
});
document.addEventListener('dragover', e => { if (dragSrc) e.preventDefault(); });
document.addEventListener('drop', e => {
  if (!dragSrc) return;
  e.preventDefault();
  if (dragSrc.kind === 'card' && D) {
    const tgt = e.target.closest('#hand .card');
    if (tgt && +tgt.dataset.id !== dragSrc.id) {
      const from = D.p.hand.findIndex(c => c.id === dragSrc.id);
      const [c] = D.p.hand.splice(from, 1);
      let to = D.p.hand.findIndex(k => k.id === +tgt.dataset.id);
      const r = tgt.getBoundingClientRect();
      if (e.clientX > r.left + r.width / 2) to++;
      D.p.hand.splice(to, 0, c);
      renderHand();
    }
  } else if (dragSrc.kind === 'tal') {
    const tgt = e.target.closest('[data-tal]');
    if (tgt && +tgt.dataset.tal !== dragSrc.i) {
      const [t] = G.tals.splice(dragSrc.i, 1);
      G.tals.splice(+tgt.dataset.tal, 0, t);
      if ($('#shop-screen').classList.contains('active')) renderShop(); else renderMe();
    }
  }
  dragSrc = null;
});
document.addEventListener('dragend', () => { dragSrc = null; });

document.addEventListener('keydown', e => {
  if ($('#modal-root').children.length) return;
  if (!$('#game-screen').classList.contains('active') || !D) return;
  if (e.key === 'Enter') { e.preventDefault(); playerPlay(); }
  else if (e.key === 'x' || e.key === 'X') playerDiscard();
});
window.addEventListener('resize', () => { if (D) renderHand(); });

renderRecord();
drawBeam(0);
document.body.dataset.screen = 'title-screen';
$('#title-fan').innerHTML = [makeCard(12, 'yaprak'), makeCard(14, 'ates'), makeCard(13, 'su')]
  .map((c, i) => cardHtml(c, { style: `--i:${i - 1}` })).join('');

// 3B eğilme: imlecin altındaki kart/tılsım ışığa doğru döner
let tiltEl = null;
document.addEventListener('mousemove', e => {
  const t = e.target.closest('.card .ci, .tal');
  if (tiltEl && tiltEl !== t) { tiltEl.style.removeProperty('--rx'); tiltEl.style.removeProperty('--ry'); tiltEl = null; }
  if (!t) return;
  const r = t.getBoundingClientRect();
  const px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
  t.style.setProperty('--ry', (px * 26).toFixed(1) + 'deg');
  t.style.setProperty('--rx', (-py * 26).toFixed(1) + 'deg');
  t.style.setProperty('--mx', ((px + 0.5) * 100).toFixed(0) + '%');
  t.style.setProperty('--my', ((py + 0.5) * 100).toFixed(0) + '%');
  tiltEl = t;
});
