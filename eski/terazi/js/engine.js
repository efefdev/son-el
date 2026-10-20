// TERAZİ — kural motoru: deste, el değerlendirme, puanlama, yapay zekâ

let _uid = 1;
function makeCard(rank, el, enh = null) { return { id: _uid++, rank, el, enh }; }
function makeDeck() {
  const d = [];
  for (const el of ELS) for (let r = 2; r <= 14; r++) d.push(makeCard(r, el));
  return d;
}
function shuffle(a, rng = Math.random) {
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
function pick(a, rng = Math.random) { return a[Math.floor(rng() * a.length)]; }
function newTal(id) {
  const t = { id, def: TAL_BY_ID[id] };
  if (t.def.init) t.def.init(t);
  return t;
}
function passive(tals, key) {
  let s = 0;
  for (const t of tals) if (t.def.passive && t.def.passive[key] !== undefined) {
    const v = t.def.passive[key];
    if (typeof v === 'number') s += v; else if (v) s = true;
  }
  return s;
}

// ---- El değerlendirme ----
function evaluate(cards) {
  const n = cards.length;
  if (!n) return null;
  const byRank = {};
  for (const c of cards) (byRank[c.rank] = byRank[c.rank] || []).push(c);
  const groups = Object.values(byRank).sort((a, b) => b.length - a.length || b[0].rank - a[0].rank);
  const g0 = groups[0].length, g1 = groups[1] ? groups[1].length : 0;
  const flush = n === 5 && cards.every(c => c.el === cards[0].el);
  let straight = false;
  if (n === 5 && groups.length === 5) {
    const rs = cards.map(c => c.rank).sort((a, b) => a - b);
    straight = rs[4] - rs[0] === 4 || (rs.join() === '2,3,4,5,14');
  }
  let type, scoring;
  if (g0 === 5) { type = flush ? 'flushfive' : 'five'; scoring = cards; }
  else if (g0 === 3 && g1 === 2 && flush) { type = 'flushhouse'; scoring = cards; }
  else if (straight && flush) { type = 'sflush'; scoring = cards; }
  else if (g0 === 4) { type = 'four'; scoring = groups[0]; }
  else if (g0 === 3 && g1 === 2) { type = 'full'; scoring = cards; }
  else if (flush) { type = 'flush'; scoring = cards; }
  else if (straight) { type = 'straight'; scoring = cards; }
  else if (g0 === 3) { type = 'three'; scoring = groups[0]; }
  else if (g0 === 2 && g1 === 2) { type = 'twopair'; scoring = groups[0].concat(groups[1]); }
  else if (g0 === 2) { type = 'pair'; scoring = groups[0]; }
  else { type = 'high'; scoring = [cards.reduce((m, c) => c.rank > m.rank ? c : m)]; }
  // puanlama sırası oynanan sıraya göre
  const set = new Set(scoring);
  scoring = cards.filter(c => set.has(c));
  const has = {
    pair: g0 >= 2,
    three: g0 >= 3,
    straight: straight,
    flush: flush,
  };
  return { type, scoring, has };
}

function dominantElement(cards) {
  if (!cards.length) return null;
  const cnt = {};
  for (const c of cards) cnt[c.el] = (cnt[c.el] || 0) + 1;
  let best = null;
  for (const el of ELS) {
    if (!cnt[el]) continue;
    if (!best || cnt[el] > cnt[best]) best = el;
    else if (cnt[el] === cnt[best]) {
      const mb = Math.max(...cards.filter(c => c.el === best).map(c => c.rank));
      const me = Math.max(...cards.filter(c => c.el === el).map(c => c.rank));
      if (me > mb) best = el;
    }
  }
  return best;
}

// ---- Puanlama ----
// sc: { talismans, levels, held, deckLeft, discardsLeft, behind, oppTalCount, oppLastEl,
//       oppLastScore, oppShield, isDebuffed, forceAdv, power, cursed, flatMult, rng, preview }
function scoreHand(played, sc) {
  const ev = evaluate(played);
  const H = HAND_BY_ID[ev.type];
  const level = sc.levels[ev.type] || 1;
  const S = { chips: H.chips + H.lc * (level - 1), mult: H.mult + H.lm * (level - 1) };
  const events = [];
  let gold = 0;
  const push = e => events.push(Object.assign(e, { chips: S.chips, mult: S.mult }));
  const api = {
    chips(n, src, card) { S.chips += n; push({ k: 'chips', v: n, src, card }); },
    mult(n, src, card) { S.mult += n; push({ k: 'mult', v: n, src, card }); },
    x(n, src, card) { S.mult *= n; push({ k: 'x', v: n, src, card }); },
    gold(n, src, card) { gold += n; push({ k: 'gold', v: n, src, card }); },
    note(text, src, card) { push({ k: 'note', text, src, card }); },
  };
  push({ k: 'base', type: ev.type, level });
  const deb = c => sc.isDebuffed ? sc.isDebuffed(c) : false;
  const live = ev.scoring.filter(c => !deb(c));
  const dom = dominantElement(live.length ? live : ev.scoring);
  const ctx = {
    type: ev.type, level, has: ev.has, played, scoring: ev.scoring, dom,
    deckLeft: sc.deckLeft || 0, discardsLeft: sc.discardsLeft || 0, behind: !!sc.behind,
    oppTalCount: sc.oppTalCount || 0, oppLastEl: sc.oppLastEl || null, oppLastScore: sc.oppLastScore || 0,
    rng: sc.rng || Math.random, preview: !!sc.preview,
  };
  const tals = sc.talismans || [];
  const hasTal = id => tals.some(t => t.id === id);
  let firstDone = false;
  for (const c of ev.scoring) {
    if (deb(c)) { api.note('Etkisiz', null, c); continue; }
    let trig = 1;
    if (!firstDone && hasTal('aynakirigi')) trig++;
    if (c.rank <= 5 && hasTal('kemanci')) trig++;
    firstDone = true;
    for (let i = 0; i < trig; i++) {
      if (i > 0) api.note('Tekrar!', null, c);
      api.chips(cardChips(c.rank), 'card', c);
      if (c.enh === 'bonus') api.chips(30, 'enh', c);
      if (c.enh === 'mult') api.mult(4, 'enh', c);
      if (c.enh === 'cam') api.x(2, 'enh', c);
      if (c.enh === 'altin') api.gold(1, 'enh', c);
      for (const t of tals) if (t.def.card) t.def.card(ctx, c, api, t);
    }
  }
  for (const c of sc.held || []) if (c.enh === 'celik' && !deb(c)) api.x(1.5, 'held', c);
  if (sc.flatMult) api.mult(sc.flatMult, 'quirk');
  for (const t of tals) if (t.def.hand) t.def.hand(ctx, api, t);
  let adv = false;
  if (dom && ((ctx.oppLastEl && BEATS[dom] === ctx.oppLastEl) || sc.forceAdv) && !sc.oppShield) {
    adv = true;
    const am = passive(tals, 'advMult') || 1.5;
    api.x(am, 'adv');
  }
  if (sc.power && sc.power !== 1) api.x(sc.power, 'power');
  if (sc.cursed) api.x(0.5, 'curse');
  const total = Math.floor(S.chips * S.mult);
  return { type: ev.type, level, scoring: ev.scoring, events, total, dom, adv, gold, ctx, chips: S.chips, mult: S.mult };
}

function runAfter(result, sc) {
  for (const t of sc.talismans || []) if (t.def.after) t.def.after(result.ctx, result, t);
}

// ---- Yapay zekâ ----
function* combos(n, kmax) {
  const idx = [];
  function* rec(start, k) {
    if (idx.length === k) { yield idx.slice(); return; }
    for (let i = start; i < n; i++) { idx.push(i); yield* rec(i + 1, k); idx.pop(); }
  }
  for (let k = 1; k <= Math.min(kmax, n); k++) yield* rec(0, k);
}

// En iyi oyunu bul. scFor(played, held) → sc
function bestPlay(hand, scFor) {
  let best = null;
  for (const ix of combos(hand.length, 5)) {
    const played = ix.map(i => hand[i]);
    const set = new Set(ix);
    const held = hand.filter((_, i) => !set.has(i));
    const r = scoreHand(played, scFor(played, held));
    // eşit puanda daha az kart oyna (kartları sakla)
    const val = r.total - played.length * 0.01;
    if (!best || val > best.val) best = { val, played, total: r.total, type: r.type };
  }
  return best;
}

function aiChoosePlay(hand, scFor, iq, rng = Math.random) {
  const all = [];
  for (const ix of combos(hand.length, 5)) {
    const played = ix.map(i => hand[i]);
    const set = new Set(ix);
    const held = hand.filter((_, i) => !set.has(i));
    const r = scoreHand(played, scFor(played, held));
    all.push({ played, total: r.total, n: played.length });
  }
  // zekâ düşükse gürültü ekle
  const noise = (1 - iq) * 1.5;
  let best = null, bv = -1;
  for (const o of all) {
    const v = o.total * Math.exp((rng() * 2 - 1) * noise) - o.n * 0.01;
    if (v > bv) { bv = v; best = o; }
  }
  return best.played;
}

// Atış kararı: birkaç aday atış setini Monte Carlo ile dener
function aiChooseDiscard(hand, drawPile, scFor, iq, rng = Math.random) {
  if (!drawPile.length) return null;
  if (rng() > 0.4 + iq * 0.6) return null;
  const cur = bestPlay(hand, scFor);
  const cands = [];
  // a) en iyi elin dışında kalanlar
  const evA = evaluate(cur.played);
  const scA = new Set(evA.scoring);
  cands.push(hand.filter(c => !scA.has(c)));
  // b) renk peşinde: en çok olan elementin dışındakiler
  const cnt = {};
  for (const c of hand) cnt[c.el] = (cnt[c.el] || 0) + 1;
  const topEl = ELS.reduce((a, b) => (cnt[b] || 0) > (cnt[a] || 0) ? b : a);
  if ((cnt[topEl] || 0) >= 3) cands.push(hand.filter(c => c.el !== topEl));
  // c) en düşük kartlar (çift/üçlü hariç)
  const rc = {};
  for (const c of hand) rc[c.rank] = (rc[c.rank] || 0) + 1;
  const singles = hand.filter(c => rc[c.rank] === 1).sort((a, b) => a.rank - b.rank);
  cands.push(singles.slice(0, 4));
  let best = null, bestV = cur.total * (1.12 + (1 - iq) * 0.3);
  const sims = 10;
  for (let cd of cands) {
    cd = cd.slice(0, 5);
    if (!cd.length || cd.length === hand.length) continue;
    const keep = hand.filter(c => !cd.includes(c));
    let sum = 0;
    for (let s = 0; s < sims; s++) {
      const pool = shuffle(drawPile.slice(), rng);
      const nh = keep.concat(pool.slice(0, cd.length));
      sum += bestPlay(nh, scFor).total;
    }
    const avg = sum / sims;
    if (avg > bestV) { bestV = avg; best = cd; }
  }
  return best;
}

if (typeof module !== 'undefined') module.exports = {};
