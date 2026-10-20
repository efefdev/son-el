// TERAZİ — mürekkep çizimli tarot sanatı (inline SVG)
// Çizgiler mürekkep rengiyle (currentColor), boyama element rengiyle (--wash)

const ROMAN = { 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI', 7: 'VII', 8: 'VIII', 9: 'IX', 10: 'X', 11: 'XI', 12: 'XII', 13: 'XIII', 14: 'I' };

// 60x60 viewBox. w = boya katmanı, s = mürekkep çizgileri
const INK_ART = {
  ates: {
    w: '<path d="M30 6c3 9 13 14 13 27 0 10-6 18-13 18s-13-8-13-18c0-7 4-10 6-16 2 4 3 7 3 10 3-4 5-12 4-21z"/>',
    s: `<path d="M30 6c3 9 13 14 13 27 0 10-6 18-13 18s-13-8-13-18c0-7 4-10 6-16 2 4 3 7 3 10 3-4 5-12 4-21z"/>
        <path d="M30 50c-5 0-8-4-7-9 1-4 4-6 4-10 4 3 7 7 6 11 2-1 3-3 3-5 2 3 2 6 1 8-1 3-4 5-7 5z"/>
        <path d="M37 22c2 3 3 6 3 9M22 30c-1 2-1 4-1 6M34 14c1 2 2 3 3 5" opacity=".6"/>
        <path d="M18 54h24M22 57h16" opacity=".5"/>`,
  },
  su: {
    w: '<path d="M30 6C25 16 16 24 16 34a14 14 0 0 0 28 0c0-10-9-18-14-28z"/>',
    s: `<path d="M30 6C25 16 16 24 16 34a14 14 0 0 0 28 0c0-10-9-18-14-28z"/>
        <path d="M22 35c0 5 3 9 8 10" />
        <path d="M33 20l3 6M36 28l2 5M26 22l-2 4" opacity=".55"/>
        <path d="M8 54c4-3 8-3 12 0s8 3 12 0 8-3 12 0 8 3 10 1" opacity=".7"/>
        <path d="M14 58c3-2 6-2 9 0s6 2 9 0 6-2 9 0" opacity=".45"/>`,
  },
  yaprak: {
    w: '<path d="M12 50C10 28 24 12 50 10c2 26-14 40-38 40z"/>',
    s: `<path d="M12 50C10 28 24 12 50 10c2 26-14 40-38 40z"/>
        <path d="M12 50L44 17"/>
        <path d="M20 42l-1-9M26 36l-1-11M32 30l-1-10M38 24l0-8M20 42l9 1M26 36l11 1M32 30l10 0M38 24l8 0" opacity=".6"/>
        <path d="M12 50c-2 3-4 5-7 6" />`,
  },
  tas: {
    w: '<path d="M6 50l14-26 8 10 9-22 17 38z"/>',
    s: `<path d="M6 50l14-26 8 10 9-22 17 38z"/>
        <path d="M37 12l-3 16 6 6M20 24l2 12-6 14M28 34l4 16" opacity=".75"/>
        <path d="M40 22l3 8M44 30l3 8M47 38l2 6M12 42l3-5M10 46l2-3" opacity=".5"/>
        <path d="M2 54h56" opacity=".6"/><path d="M8 57h44" opacity=".35"/>`,
  },
};

const FACE_ART = {
  // Vale — dik kılıç
  11: `<path d="M30 4l4 8v28h-8V12z" class="w"/>
       <path d="M30 4l4 8v28h-8V12z"/><path d="M30 8v30" opacity=".5"/>
       <path d="M18 40h24M20 40c0 3 4 4 10 4s10-1 10-4" />
       <path d="M27 44h6v8h-6z"/><circle cx="30" cy="56" r="3" class="w"/><circle cx="30" cy="56" r="3"/>
       <path d="M14 22l4 2M46 22l-4 2M12 30l5 1M48 30l-5 1" opacity=".5"/>`,
  // Kız — hilal ve kadeh
  12: `<path d="M38 6a12 12 0 1 0 6 20 10 10 0 1 1-6-20z" class="w"/>
       <path d="M38 6a12 12 0 1 0 6 20 10 10 0 1 1-6-20z"/>
       <path d="M18 30h24c0 9-5 14-12 14s-12-5-12-14z" class="w"/>
       <path d="M18 30h24c0 9-5 14-12 14s-12-5-12-14z"/>
       <path d="M30 44v8M22 56h16M24 52h12"/><path d="M22 34c2 4 5 6 8 6" opacity=".5"/>`,
  // Papaz — taç
  13: `<path d="M10 44L8 18l11 12 11-20 11 20 11-12-2 26z" class="w"/>
       <path d="M10 44L8 18l11 12 11-20 11 20 11-12-2 26z"/>
       <path d="M10 44h40v7H10z"/><circle cx="30" cy="10" r="2.5"/><circle cx="8" cy="17" r="2"/><circle cx="52" cy="17" r="2"/>
       <circle cx="20" cy="47.5" r="1.6"/><circle cx="30" cy="47.5" r="1.6"/><circle cx="40" cy="47.5" r="1.6"/>
       <path d="M16 36l4 4M26 34l2 6M36 34l-2 6M44 36l-4 4" opacity=".5"/>`,
  // As — göz taşıyan güneş
  14: `<circle cx="30" cy="30" r="13" class="w"/><circle cx="30" cy="30" r="13"/>
       <path d="M30 2v9M30 49v9M2 30h9M49 30h9M10 10l6 6M44 44l6 6M50 10l-6 6M16 44l-6 6"/>
       <path d="M20 4l3 7M40 4l-3 7M56 20l-7 3M56 40l-7-3M40 56l-3-7M20 56l3-7M4 40l7-3M4 20l7 3" opacity=".55"/>
       <path d="M21 30c4-5 14-5 18 0-4 5-14 5-18 0z"/><circle cx="30" cy="30" r="2.8" class="f"/>`,
};

function inkArt(c) {
  if (c.rank >= 11) {
    return `<svg viewBox="0 0 60 60" class="ink face-art">${FACE_ART[c.rank]}</svg>`;
  }
  const a = INK_ART[c.el];
  return `<svg viewBox="0 0 60 60" class="ink"><g class="w">${a.w}</g><g>${a.s}</g></svg>`;
}

// Kart sırtı: ay, güneş ve yıldızlar
function backArt() {
  return `<svg viewBox="0 0 60 84" class="back-svg">
    <rect x="3" y="3" width="54" height="78" rx="4" fill="none" stroke="currentColor" stroke-width=".8"/>
    <rect x="6" y="6" width="48" height="72" rx="3" fill="none" stroke="currentColor" stroke-width=".4" stroke-dasharray="1 2"/>
    <g fill="none" stroke="currentColor" stroke-width=".9">
      <circle cx="30" cy="42" r="14"/><circle cx="30" cy="42" r="9" stroke-dasharray="1.5 1.5"/>
      <path d="M33 34a8 8 0 1 0 0 16 6.5 6.5 0 1 1 0-16z" fill="currentColor" opacity=".8"/>
      <path d="M30 22v-6M30 62v6M16 42h-6M44 42h6"/>
      <path d="M30 12l1 2 2 .3-1.5 1.4.4 2.1-1.9-1-1.9 1 .4-2.1L27 14.3l2-.3z" fill="currentColor"/>
      <path d="M30 66l1 2 2 .3-1.5 1.4.4 2.1-1.9-1-1.9 1 .4-2.1L27 68.3l2-.3z" fill="currentColor"/>
      <circle cx="12" cy="14" r=".9" fill="currentColor"/><circle cx="48" cy="14" r=".9" fill="currentColor"/>
      <circle cx="12" cy="70" r=".9" fill="currentColor"/><circle cx="48" cy="70" r=".9" fill="currentColor"/>
    </g></svg>`;
}

function toRoman(n) {
  const t = [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
  let s = '';
  for (const [v, r] of t) while (n >= v) { s += r; n -= v; }
  return s;
}
