// SON EL — kurallar: deste, el değeri, rakipler ve yapay zekâ

const SUITS = ['♠', '♥', '♦', '♣'];
const RED = { '♥': true, '♦': true };
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const CHAMBERS = 6;

let _cid = 1;
function newShoe(decks = 2) {
  const s = [];
  for (let d = 0; d < decks; d++) for (const suit of SUITS) for (const r of RANKS) s.push({ id: _cid++, r, s: suit });
  return shuffle(s);
}
function shuffle(a, rng = Math.random) {
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
function cardVal(c) { return c.r === 'A' ? 11 : (c.r === 'J' || c.r === 'Q' || c.r === 'K') ? 10 : +c.r; }

// { total, soft } — soft: en az bir As hâlâ 11 sayılıyor
function handValue(cards) {
  let t = 0, aces = 0;
  for (const c of cards) { t += cardVal(c); if (c.r === 'A') aces++; }
  while (t > 21 && aces) { t -= 10; aces--; }
  return { total: t, soft: aces > 0 };
}
function isBlackjack(cards) { return cards.length === 2 && handValue(cards).total === 21; }

// Rakipler: sırayla zorlaşır
// ai: 'drunk' | 'dealer' | 'h17' | 'peek' | 'smart' | 'boss'
const OPPONENTS = [
  { id: 'sarhos', name: 'Sarhoş Vasıf', icon: '🥃', ai: 'drunk', title: 'Birinci masa',
    quirk: 'Ne yaptığını bilmiyor. Bazen 13\'te durur, bazen 19\'da kart ister.',
    lines: { start: ['Hık... tabanca dolu mu bu?', 'Bir el daha... son bir el...'], win: ['Hah! Tanrı sarhoşları sever.'], lose: ['Kartlar... ikişer görünüyor.'],
      pull: ['Ellerim titriyor, ondan...'], survive: ['Hâlâ buradayım! Bir kadeh daha!'], die: ['...'] } },
  { id: 'kor', name: 'Kör Necmi', icon: '🕶️', ai: 'dealer', title: 'İkinci masa',
    quirk: 'Kuralın kölesi: 17\'ye kadar kart çeker, sonra durur. Asla değişmez.',
    lines: { start: ['Ben görmem. Kural görür.', 'On yedi. Hep on yedi.'], win: ['Kural kazandı.'], lose: ['Kural böyle istedi.'],
      pull: ['Karanlıkta bir karanlık daha.'], survive: ['Sessizlik.'], die: ['...'] } },
  { id: 'kasap', name: 'Kasap Rıza', icon: '🔪', ai: 'h17', title: 'Üçüncü masa',
    quirk: 'Yumuşak 17\'de bile kart çeker. Onun Blackjack\'i sana 2 mermi yükletir.',
    lines: { start: ['Etin kilosu kaç, biliyor musun?', 'Masama kan damlatma.'], win: ['Kemiğe kadar.'], lose: ['Bıçağım körelmiş.'],
      pull: ['Bunu da keseriz.'], survive: ['Daha kesilecek çok et var.'], die: ['...'] } },
  { id: 'falci', name: 'Madam Zehra', icon: '🔮', ai: 'peek', title: 'Dördüncü masa',
    quirk: 'Çoğu zaman destenin en üstündeki kartı görür ve kararını ona göre verir.',
    lines: { start: ['Fincanında barut kokusu var.', 'Bir sonraki kart... ah, görüyorum.'], win: ['Söylemiştim.'], lose: ['Telve yalan söyledi.'],
      pull: ['Bunu fincanda görmemiştim.'], survive: ['Kader bana borçlu.'], die: ['...'] } },
  { id: 'doktor', name: 'Doktor Sermet', icon: '🩺', ai: 'smart', title: 'Beşinci masa',
    quirk: 'Senin elini okur. Düelloda bir kez kendi silindirinden bir mermi çıkarır.',
    lines: { start: ['Nabzın hızlı. Endişelenme, ben doktorum.', 'Teşhis: şanssızlık.'], win: ['Ameliyat başarılı.'], lose: ['İkinci görüş alacağım.'],
      pull: ['Klinik olarak... riskli.'], survive: ['Tıp bir mucizedir.'], die: ['...'] } },
  { id: 'tefeci', name: 'Tefeci Hamdi', icon: '💰', ai: 'smart', title: 'Altıncı masa',
    quirk: 'Masaya borçlu oturursun: silindirinde 1 mermiyle başlarsın.',
    lines: { start: ['Faizi unutma, evlat.', 'Borç bir mermi. Ödemesi kolay.'], win: ['Tahsilat yapıldı.'], lose: ['Defterime yazıyorum.'],
      pull: ['Bu kur farkı...'], survive: ['Vade uzadı.'], die: ['...'] } },
  { id: 'patron', name: 'Patron', icon: '🎩', ai: 'boss', title: 'Son masa', final: true,
    quirk: 'Bu kumarhanenin sahibi. Elini okur, destenin üstünü görür.',
    lines: { start: ['Buraya kadar gelen olmamıştı.', 'Otur. Bu masadan biri kalkacak.'], win: ['Ev her zaman kazanır.'], lose: ['İlginç.'],
      pull: ['Kumarhanemde ilk kez...'], survive: ['Ev kazanır, demiştim.'], die: ['Ev... kaybetti...'] } },
];

function upVal(c) { return c.r === 'A' ? 11 : Math.min(10, +c.r || 10); }

// Temel strateji: karşı tarafın açık kartına bakarak kart çekilsin mi?
function basicHit(me, up) {
  const v = handValue(me), t = v.total, u = upVal(up);
  if (v.soft) return t < 18 || (t === 18 && u >= 9);
  if (t <= 11) return true;
  if (t === 12) return !(u >= 4 && u <= 6);
  if (t <= 16) return u >= 7;
  return false;
}
function basicDouble(me, up) {
  const t = handValue(me).total, u = upVal(up);
  return me.length === 2 && (t === 11 || (t === 10 && u < 10) || (t === 9 && u >= 3 && u <= 6));
}

// Rakibin kararı: true = kart çek
// me: rakibin kartları; you: oyuncunun kartları; youDone: oyuncu oynadı mı (rakip ikinci ise true)
// shoe: kalan deste (son eleman = sıradaki kart)
function aiWantsHit(ai, me, you, youDone, shoe, rng = Math.random) {
  const v = handValue(me), t = v.total;
  if (t >= 21) return false;
  const yt = handValue(you).total;
  const next = shoe[shoe.length - 1];
  const nv = next ? handValue(me.concat([next])).total : 99;
  switch (ai) {
    case 'drunk': {
      if (t < 12) return true;
      const r = rng();
      if (t <= 14) return r < 0.75;
      if (t <= 16) return r < 0.6;
      if (t <= 18) return r < 0.3;
      return r < 0.12;
    }
    case 'dealer': return t < 17;
    case 'h17': return t < 17 || (t === 17 && v.soft);
    case 'peek': return rng() < 0.6 ? (nv <= 21 && (t < 17 || nv >= 19)) : t < 17;
    case 'smart':
      if (youDone) return t < yt || (t === yt && t < 17);
      return basicHit(me, you[0]);
    case 'boss':
      if (youDone) { if (t > yt) return false; return nv <= 21 || t < yt; }
      return nv <= 21 && (basicHit(me, you[0]) || nv >= 19);
  }
  return t < 17;
}
function aiWantsDouble(ai, me, you) {
  if (ai === 'smart' || ai === 'boss') return basicDouble(me, you[0]);
  if (ai === 'h17') return me.length === 2 && handValue(me).total === 11;
  return false;
}

if (typeof module !== 'undefined') module.exports = { newShoe, handValue, isBlackjack, aiWantsHit, aiWantsDouble, basicHit, basicDouble, OPPONENTS, cardVal };
