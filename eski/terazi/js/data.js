// TERAZİ — oyun verisi: elementler, eller, tılsımlar, büyüler, rakipler

const ELS = ['ates', 'su', 'yaprak', 'tas'];
const EL = {
  ates:   { name: 'Ateş',   color: '#e0532f', dark: '#7a2210', soft: '#f6d2c4' },
  su:     { name: 'Su',     color: '#3b7bd0', dark: '#173a70', soft: '#cfe0f5' },
  yaprak: { name: 'Yaprak', color: '#46955a', dark: '#1f5229', soft: '#d3ead3' },
  tas:    { name: 'Taş',    color: '#a9813f', dark: '#53391a', soft: '#ecdcbf' },
};
// Ateş yaprağı yakar, yaprak (kök) taşı çatlatır, taş suyu durdurur, su ateşi söndürür
const BEATS = { ates: 'yaprak', yaprak: 'tas', tas: 'su', su: 'ates' };
const BEATEN_BY = { yaprak: 'ates', tas: 'yaprak', su: 'tas', ates: 'su' };

const EL_PATHS = {
  ates: '<path d="M12 1.5c.8 3.6 4.6 5.7 5.6 9.6.9 3.6-1 8.6-5.6 9.4-4.6.8-7.8-2.6-7.4-6.9.3-2.7 2-4.1 2.6-6.4 1.3 1.1 1.8 2.6 1.8 4 1.5-1.5 2.9-5.4 3-9.7z"/><path d="M12 20.4c-2 0-3.2-1.5-3-3.3.2-1.6 1.5-2.4 1.8-3.8 1.4 1 2.4 2.4 2.3 3.6.8-.6 1.3-1.5 1.4-2.3 1 1.2 1.3 2.4 1 3.4-.4 1.4-1.8 2.4-3.5 2.4z" fill="#fff6" />',
  su: '<path d="M12 1.8C9.2 6.6 4.8 10.3 4.8 15a7.2 7.2 0 0 0 14.4 0c0-4.7-4.4-8.4-7.2-13.2z"/><path d="M8.6 14.6c0 2.4 1.5 4 3.4 4.4" fill="none" stroke="#fff8" stroke-width="1.6" stroke-linecap="round"/>',
  yaprak: '<path d="M3.5 20.5C3 11 9.4 3.6 20.6 3.4c.4 10.8-6.4 17.6-17.1 17.1z"/><path d="M4.2 19.8L15.5 8.5M9 15h4.6M7 12.6V9" fill="none" stroke="#fff8" stroke-width="1.4" stroke-linecap="round"/>',
  tas: '<path d="M12 1.6l8.6 5v10.8L12 22.4l-8.6-5V6.6z"/><path d="M12 1.6v9.6m0 0l8.6-4.6M12 11.2L3.4 6.6M12 11.2v11.2" fill="none" stroke="#fff7" stroke-width="1.2"/>',
};
function elIcon(el, size = 18, extra = '') {
  return `<svg class="elicon ${extra}" viewBox="0 0 24 24" width="${size}" height="${size}" fill="${EL[el].color}">${EL_PATHS[el]}</svg>`;
}

const RANK_LABEL = { 11: 'J', 12: 'Q', 13: 'K', 14: 'A' };
const RANK_NAME = { 11: 'Vale', 12: 'Kız', 13: 'Papaz', 14: 'As' };
function rankLabel(r) { return RANK_LABEL[r] || String(r); }
function cardChips(r) { return r <= 10 ? r : (r < 14 ? 10 : 11); }
function isFace(c) { return c.rank >= 11 && c.rank <= 13; }

// El türleri (zayıftan güçlüye) — chips/mult taban, lc/lm seviye başına artış
const HANDS = [
  { id: 'high',       name: 'Yüksek Kart',  chips: 5,   mult: 1,  lc: 10, lm: 1, star: 'Utarid' },
  { id: 'pair',       name: 'Çift',         chips: 10,  mult: 2,  lc: 15, lm: 1, star: 'Merih' },
  { id: 'twopair',    name: 'İki Çift',     chips: 20,  mult: 2,  lc: 20, lm: 1, star: 'Zühre' },
  { id: 'three',      name: 'Üçlü',         chips: 30,  mult: 3,  lc: 20, lm: 2, star: 'Müşteri' },
  { id: 'straight',   name: 'Kent',         chips: 30,  mult: 4,  lc: 30, lm: 3, star: 'Zuhal' },
  { id: 'flush',      name: 'Renk',         chips: 35,  mult: 4,  lc: 15, lm: 2, star: 'Ülker' },
  { id: 'full',       name: 'Ful',          chips: 40,  mult: 4,  lc: 25, lm: 2, star: 'Demirkazık' },
  { id: 'four',       name: 'Kare',         chips: 60,  mult: 7,  lc: 30, lm: 3, star: 'Kervankıran' },
  { id: 'sflush',     name: 'Sıralı Renk',  chips: 100, mult: 8,  lc: 40, lm: 4, star: 'Samanyolu' },
  { id: 'five',       name: 'Beşli',        chips: 120, mult: 12, lc: 35, lm: 3, star: 'Süreyya' },
  { id: 'flushhouse', name: 'Renkli Ful',   chips: 140, mult: 14, lc: 40, lm: 4, star: 'Kehkeşan' },
  { id: 'flushfive',  name: 'Renkli Beşli', chips: 160, mult: 16, lc: 50, lm: 3, star: 'Kuyrukluyıldız' },
];
const HAND_BY_ID = Object.fromEntries(HANDS.map(h => [h.id, h]));

const ENH = {
  cam:    { name: 'Cam',          desc: '×2 Çarpan. Puanlanınca 1/5 ihtimalle kırılır.' },
  bonus:  { name: 'Kehribar',     desc: '+30 Çip' },
  mult:   { name: 'Yakut',        desc: '+4 Çarpan' },
  celik:  { name: 'Çelik',        desc: 'Oynanmayıp elde tutulursa ×1.5 Çarpan' },
  altin:  { name: 'Altın Yaldız', desc: 'Puanlanınca +1 Altın' },
};

const RARITY = { 1: 'Sıradan', 2: 'Nadir', 3: 'Efsanevi' };

// Tılsımlar. Kancalar:
//  card(ctx, card, api, t)  — puanlanan her kart için
//  hand(ctx, api, t)        — kartlardan sonra, soldan sağa
//  after(ctx, result, t)    — gerçek oyundan sonra (önizlemede değil)
//  passive: { handSize, discards, hands, advMult, shield, interestCap }
//  roundEnd(t) → altın
const TALISMANS = [
  { id: 'kor', name: 'Kor', icon: '🔥', r: 1, price: 4, desc: '+4 Çarpan',
    hand: (c, a, t) => a.mult(4, t) },
  { id: 'alev', name: 'Alev Ruhu', icon: '🕯️', r: 1, price: 5, desc: 'Puanlanan her <b class="e-ates">Ateş</b> kartı +3 Çarpan',
    card: (c, k, a, t) => { if (k.el === 'ates') a.mult(3, t, k); } },
  { id: 'dalga', name: 'Dalga Ruhu', icon: '🌊', r: 1, price: 5, desc: 'Puanlanan her <b class="e-su">Su</b> kartı +30 Çip',
    card: (c, k, a, t) => { if (k.el === 'su') a.chips(30, t, k); } },
  { id: 'orman', name: 'Orman Ruhu', icon: '🌿', r: 1, price: 5, desc: 'Puanlanan her <b class="e-yaprak">Yaprak</b> kartı +12 Çip ve +2 Çarpan',
    card: (c, k, a, t) => { if (k.el === 'yaprak') { a.chips(12, t, k); a.mult(2, t, k); } } },
  { id: 'dag', name: 'Dağ Ruhu', icon: '⛰️', r: 2, price: 7, desc: 'Puanlanan her <b class="e-tas">Taş</b> kartı ×1.2 Çarpan',
    card: (c, k, a, t) => { if (k.el === 'tas') a.x(1.2, t, k); } },
  { id: 'kumru', name: 'Kumru Çifti', icon: '🕊️', r: 1, price: 4, desc: 'El bir <b>Çift</b> içeriyorsa +8 Çarpan',
    hand: (c, a, t) => { if (c.has.pair) a.mult(8, t); } },
  { id: 'uckardes', name: 'Üç Kardeş', icon: '🎎', r: 2, price: 6, desc: 'El bir <b>Üçlü</b> içeriyorsa ×2 Çarpan',
    hand: (c, a, t) => { if (c.has.three) a.x(2, t); } },
  { id: 'merdiven', name: 'Merdiven', icon: '🪜', r: 1, price: 5, desc: 'El bir <b>Kent</b> içeriyorsa +14 Çarpan',
    hand: (c, a, t) => { if (c.has.straight) a.mult(14, t); } },
  { id: 'kazan', name: 'Boya Kazanı', icon: '🎨', r: 1, price: 5, desc: 'El bir <b>Renk</b> içeriyorsa +12 Çarpan',
    hand: (c, a, t) => { if (c.has.flush) a.mult(12, t); } },
  { id: 'mevsim', name: 'Dört Mevsim', icon: '🍂', r: 2, price: 6, desc: 'Oynanan kartlarda 4 element de varsa ×3 Çarpan',
    hand: (c, a, t) => { if (new Set(c.played.map(k => k.el)).size === 4) a.x(3, t); } },
  { id: 'az', name: 'Az Çoktur', icon: '🪶', r: 1, price: 4, desc: '3 ya da daha az kart oynarsan +16 Çarpan',
    hand: (c, a, t) => { if (c.played.length <= 3) a.mult(16, t); } },
  { id: 'saray', name: 'Saray Muhafızı', icon: '💂', r: 1, price: 5, desc: 'Puanlanan her J, Q, K +30 Çip',
    card: (c, k, a, t) => { if (isFace(k)) a.chips(30, t, k); } },
  { id: 'asias', name: 'Asi As', icon: '🎯', r: 1, price: 5, desc: 'Puanlanan her As +20 Çip ve +4 Çarpan',
    card: (c, k, a, t) => { if (k.rank === 14) { a.chips(20, t, k); a.mult(4, t, k); } } },
  { id: 'kumbara', name: 'Kumbara', icon: '🏺', r: 1, price: 4, desc: 'Her düello sonunda +3 Altın', aiNo: true,
    roundEnd: () => 3 },
  { id: 'sarraf', name: 'Sarraf', icon: '💰', r: 1, price: 5, desc: 'Faiz üst sınırı 5 yerine 10 Altın', aiNo: true,
    passive: { interestCap: 10 } },
  { id: 'rovans', name: 'Rövanş', icon: '⚔️', r: 2, price: 6, desc: 'Terazi aleyhine eğikken ×2 Çarpan',
    hand: (c, a, t) => { if (c.behind) a.x(2, t); } },
  { id: 'kahin', name: 'Kâhin Gözü', icon: '👁️', r: 2, price: 7, desc: 'Element üstünlüğün ×1.5 yerine ×3',
    passive: { advMult: 3 } },
  { id: 'kalkan', name: 'Kalkan', icon: '🛡️', r: 2, price: 5, desc: 'Rakibin element üstünlüğü sana işlemez. +4 Çarpan',
    passive: { shield: true }, hand: (c, a, t) => a.mult(4, t) },
  { id: 'aynakirigi', name: 'Ayna Kırığı', icon: '🔷', r: 2, price: 7, desc: 'İlk puanlanan kart iki kez tetiklenir' },
  { id: 'kemanci', name: 'Gezgin Kemancı', icon: '🎻', r: 2, price: 6, desc: 'Puanlanan 2, 3, 4 ve 5\'ler iki kez tetiklenir' },
  { id: 'sarkac', name: 'Sarkaç', icon: '🕰️', r: 2, price: 6, desc: 'Oynadığın her elden sonra kalıcı +1 Çarpan kazanır',
    init: t => { t.n = 0; }, stat: t => `şu an +${t.n}`,
    hand: (c, a, t) => { if (t.n > 0) a.mult(t.n, t); }, after: (c, r, t) => { t.n += 1; } },
  { id: 'tekgoz', name: 'Tek Göz', icon: '🧿', r: 2, price: 7, desc: '×2 Çarpan, ama el boyutun −1',
    passive: { handSize: -1 }, hand: (c, a, t) => a.x(2, t) },
  { id: 'zar', name: 'Kader Zarı', icon: '🎲', r: 1, price: 4, desc: '+1 ile +15 arası rastgele Çarpan',
    hand: (c, a, t) => a.mult(c.preview ? 8 : 1 + Math.floor(c.rng() * 15), t) },
  { id: 'sabir', name: 'Sabır Taşı', icon: '🪨', r: 1, price: 5, desc: 'Destende kalan her kart için +3 Çip',
    hand: (c, a, t) => { if (c.deckLeft > 0) a.chips(3 * c.deckLeft, t); } },
  { id: 'tutulma', name: 'Tutulma', icon: '🌘', r: 2, price: 6, desc: 'Baskın elementin rakibin son elementiyle aynıysa ×2.5 Çarpan',
    hand: (c, a, t) => { if (c.dom && c.dom === c.oppLastEl) a.x(2.5, t); } },
  { id: 'vampir', name: 'Vampir', icon: '🦇', r: 3, price: 9, desc: 'Rakibin son elinden yüksek puan yaparsan kalıcı +×0.25 kazanır',
    init: t => { t.x = 1; }, stat: t => `şu an ×${t.x.toFixed(2)}`,
    hand: (c, a, t) => { if (t.x > 1) a.x(t.x, t); },
    after: (c, r, t) => { if (r.total > c.oppLastScore && c.oppLastScore > 0) t.x += 0.25; } },
  { id: 'cep', name: 'Açgözlü Cep', icon: '👝', r: 2, price: 6, desc: 'El boyutu +1', passive: { handSize: 1 } },
  { id: 'copcu', name: 'Çöpçü', icon: '🧹', r: 2, price: 6, desc: '+1 Atış hakkı. Kalan her atış hakkı için +3 Çarpan',
    passive: { discards: 1 }, hand: (c, a, t) => { if (c.discardsLeft > 0) a.mult(3 * c.discardsLeft, t); } },
  { id: 'kumsaati', name: 'Kum Saati', icon: '⏳', r: 3, price: 8, desc: 'Her düelloda +1 El', passive: { hands: 1 } },
  { id: 'karakedi', name: 'Kara Kedi', icon: '🐈‍⬛', r: 3, price: 8, desc: 'Rakibin sahip olduğu her tılsım için +×0.5 Çarpan',
    hand: (c, a, t) => { if (c.oppTalCount > 0) a.x(1 + 0.5 * c.oppTalCount, t); } },
  { id: 'yildizci', name: 'Müneccim', icon: '🔭', r: 2, price: 6, desc: 'Oynadığın el türünün her seviyesi için +3 Çarpan',
    hand: (c, a, t) => a.mult(3 * c.level, t) },
  { id: 'simyaci', name: 'Simyacı', icon: '⚗️', r: 3, price: 8, desc: 'Puanlanan her geliştirilmiş kart ×1.3 Çarpan',
    card: (c, k, a, t) => { if (k.enh) a.x(1.3, t, k); } },
  { id: 'cift_el', name: 'Çift Kişilik', icon: '🎭', r: 1, price: 4, desc: 'Oynanan kartların hepsi aynı elementse +60 Çip',
    hand: (c, a, t) => { if (c.played.length >= 2 && new Set(c.played.map(k => k.el)).size === 1) a.chips(60, t); } },
];
const TAL_BY_ID = Object.fromEntries(TALISMANS.map(t => [t.id, t]));

// Büyüler (tek kullanımlık). need: [min,max] seçili kart; duel: sadece düelloda
const SPELLS = [
  { id: 'muhur_ates',   name: 'Alev Mührü',   icon: 'ates',   price: 3, need: [1, 3], desc: 'Seçili en fazla 3 kartı <b class="e-ates">Ateş</b> yapar' },
  { id: 'muhur_su',     name: 'Su Mührü',     icon: 'su',     price: 3, need: [1, 3], desc: 'Seçili en fazla 3 kartı <b class="e-su">Su</b> yapar' },
  { id: 'muhur_yaprak', name: 'Yaprak Mührü', icon: 'yaprak', price: 3, need: [1, 3], desc: 'Seçili en fazla 3 kartı <b class="e-yaprak">Yaprak</b> yapar' },
  { id: 'muhur_tas',    name: 'Taş Mührü',    icon: 'tas',    price: 3, need: [1, 3], desc: 'Seçili en fazla 3 kartı <b class="e-tas">Taş</b> yapar' },
  { id: 'ors',      name: 'Örs',           icon: '⚒️', price: 3, need: [1, 2], desc: 'Seçili en fazla 2 kartın değerini 1 artırır' },
  { id: 'yak',      name: 'Ateşe Ver',     icon: '🗡️', price: 3, need: [1, 2], desc: 'Seçili en fazla 2 kartı destenden kalıcı olarak yok eder' },
  { id: 'ayna',     name: 'Sihirli Ayna',  icon: '🪞', price: 4, need: [1, 1], desc: 'Seçili 1 kartın kopyasını eline ve destene ekler' },
  { id: 'cam',      name: 'Cam Üfleyici',  icon: '🫧', price: 4, need: [1, 1], desc: 'Seçili 1 kartı <b>Cam</b> yapar (×2 Çarpan, kırılabilir)' },
  { id: 'kehribar', name: 'Kehribar',      icon: '🟠', price: 3, need: [1, 2], desc: 'Seçili en fazla 2 kartı <b>Kehribar</b> yapar (+30 Çip)' },
  { id: 'yakut',    name: 'Yakut Tozu',    icon: '♦️', price: 3, need: [1, 2], desc: 'Seçili en fazla 2 kartı <b>Yakut</b> yapar (+4 Çarpan)' },
  { id: 'celik',    name: 'Çelik Döküm',   icon: '🔩', price: 4, need: [1, 1], desc: 'Seçili 1 kartı <b>Çelik</b> yapar (elde tutulunca ×1.5)' },
  { id: 'yaldiz',   name: 'Yaldız',        icon: '✨', price: 3, need: [1, 2], desc: 'Seçili en fazla 2 kartı <b>Altın Yaldız</b> yapar (+1 Altın)' },
  { id: 'lanet',    name: 'Kara Büyü',     icon: '🕷️', price: 4, need: [0, 0], duel: true, desc: 'Rakibin bir sonraki eli ×0.5 puan alır' },
  { id: 'zaman',    name: 'Zaman Çalmak',  icon: '⌚', price: 4, need: [0, 0], duel: true, desc: 'Bu düelloda +1 El' },
  { id: 'ruzgar',   name: 'Rüzgâr',        icon: '🌬️', price: 3, need: [0, 0], duel: true, desc: 'Destenden hemen 3 kart çek' },
  { id: 'hazine',   name: 'Hazine Haritası', icon: '🗺️', price: 5, need: [0, 0], desc: 'Rastgele bir tılsım yaratır (yer varsa)' },
];
const SPELL_BY_ID = Object.fromEntries(SPELLS.map(s => [s.id, s]));

// Rakipler. 1. ve 8. sabit, aradakiler karışık
const OPPONENTS = [
  { id: 'falci', name: 'Pazar Falcısı', icon: '🔮', quirk: 'Özel bir kuralı yok. Isınma turu.',
    lines: { start: ['Fincanında kaybediş görüyorum...', 'Kartlar bana fısıldıyor.'], big: ['Fal tuttu!', 'Bunu da görmüştüm.'], hurt: ['Bu fincanda yoktu!', 'Hm. Telve yalan söyledi.'], win: ['Yıldızlar benden yanaydı.'], lose: ['Falıma güvenmemeliydim...'] } },
  { id: 'saksagan', name: 'Hırsız Saksağan', icon: '🐦‍⬛', quirk: 'Senden yüksek puan yaptığı her elde 1 Altınını çalar.',
    lines: { start: ['Parlak bir şeyler mi var orada?', 'Kese ağırsa yük olur, alırım.'], big: ['Şıngır şıngır!', 'Bu da benim!'], hurt: ['Gaak!', 'Tüylerimi diktin.'], win: ['Keseni bırak, git.'], lose: ['Uçuyorum, uçuyorum...'] } },
  { id: 'sis', name: 'Sis Kâhini', icon: '🌫️', quirk: 'Çektiğin kartların dörtte biri kapalı gelir.',
    lines: { start: ['Sisin içinde ne var, bilemezsin.', 'Gözlerin seni yanıltacak.'], big: ['Sis yoğunlaşıyor.'], hurt: ['Sis... dağılıyor mu?'], win: ['Kayboldun.'], lose: ['Görebiliyormuşsun meğer.'] } },
  { id: 'muhurcu', name: 'Mühürcü', icon: '📜', quirk: 'Düello başında bir elementi mühürler: senin o elementteki kartların puan vermez.',
    lines: { start: ['Bu ferman ile o element yasaklanmıştır!', 'Mühür basıldı.'], big: ['Kanun benim!'], hurt: ['Bu usulsüzlük!'], win: ['Dava kapanmıştır.'], lose: ['Fermanım yırtıldı...'] } },
  { id: 'saatci', name: 'Saatçi', icon: '⌛', quirk: 'Bu düelloda 1 el eksik oynarsın.',
    lines: { start: ['Tik tak. Vaktin az.', 'Zamanın bir kısmı benim.'], big: ['Tam vaktinde.'], hurt: ['Çarklarım takıldı!'], win: ['Zaman doldu.'], lose: ['Saatlerim geri kaldı...'] } },
  { id: 'cadi', name: 'Ayna Cadısı', icon: '🧙‍♀️', quirk: 'Ne oynarsa oynasın, element üstünlüğü her zaman ondadır.',
    lines: { start: ['Ne yaparsan sana döner.', 'Aynaya bak, kendini gör.'], big: ['Yansıma güçlüdür!'], hurt: ['Aynam çatladı!'], win: ['Kendinle savaşamazsın.'], lose: ['Yedi yıl uğursuzluk...'] } },
  { id: 'papaz', name: 'Kara Papaz', icon: '🤴', quirk: 'Senin resimli kartların (J, Q, K) puan vermez.',
    lines: { start: ['Sarayımda tek kral var.', 'Vale, Kız, Papaz — hepsi bana diz çöker.'], big: ['Huzurumda eğil!'], hurt: ['Bu bir isyan!'], win: ['Taht benimdir.'], lose: ['Tacım... düştü.'] } },
  { id: 'kumarbaz', name: 'Tek Kollu Kumarbaz', icon: '🎰', quirk: 'Atış hakkın yok. Ama her elinde +5 Çarpan alırsın.',
    lines: { start: ['Ne gelirse o!', 'Kart değiştirmek yok, evlat.'], big: ['Jackpot!'], hurt: ['Makine bozuk!'], win: ['Kasa her zaman kazanır.'], lose: ['Bugün şanslı günündü.'] } },
];
const FINAL_OPP = { id: 'tutulma', name: 'Kara Tutulma', icon: '🌑', final: true,
  quirk: 'Oynadığın her elin baskın elementi, düello sonuna kadar mühürlenir.',
  lines: { start: ['Güneş de sönecek, sen de.', 'Işığın son kez parlasın.'], big: ['Karanlık büyüyor.'], hurt: ['Bir ışık... nasıl?'], win: ['Gece sonsuzdur.'], lose: ['Şafak... söküyor...'] } };

// Ante başına rakip gücü
const ANTE = {
  // nihai skor çarpanı
  power: [0.7, 0.95, 1.3, 1.75, 2.3, 3.0, 4.0, 5.5],
  // rakibin zekâsı (0-1)
  iq:    [0.3, 0.5, 0.6, 0.7, 0.75, 0.8, 0.85, 0.95],
  // rakibin tılsım sayısı
  tals:  [0, 0, 1, 1, 2, 2, 3, 3],
  // rakibin bonus el seviyeleri
  levels:[0, 0, 0, 1, 1, 2, 3, 4],
  // KO eşiği = koBase * power
  koBase: 900,
};
const MAX_ANTE = 8;
