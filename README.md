# Son El

Bilgisayara karşı 3B blackjack. Eli kaybeden, masadaki altıpatları kendi şakağına dayar.

## Çalıştırma

Tarayıcıda açılır, kurulum gerekmez. Three.js internetten (jsDelivr) yüklendiği için bağlantı gerekir.
Dosyayı doğrudan açmak yerine yerel bir sunucu kullanın:

```bash
python3 -m http.server 8765 --directory /Users/efealtintas/Desktop/kartoyunu
```

Sonra `http://localhost:8765` adresine gidin. Kulaklıkla oynamanız önerilir.

## Kurallar

- 21'e en yakın olan kazanır, 21'i geçen patlar. J/Q/K 10, As 1 ya da 11 sayılır.
- Eller sırayla başlar: önce oynayanın rakibi bir kartını kapalı tutar, ikinci oynayan ilkinin elini görerek karar verir.
- Eli kaybeden silindire bir mermi ekler ve tetiği çeker. Mermiler birikir (1/6, 2/6, ...). Berabere biterse kimse tetiğe dokunmaz.
- İkiye katlarsan ya da Blackjack yaparsan kaybeden 2 mermi yükler.
- Her masada 2 kez **Pas** diyebilirsin: tetiği atlarsın ama mermi silindirde kalır.
- 7 masa, 7 rakip; her birinin kendi kuralı var. Ölen kalkamaz.

## Kontroller

| Tuş | İş |
| --- | --- |
| H | Kart çek |
| S | Dur |
| D | İkiye katla |
| Boşluk / Enter | Tetiği çek |
| P | Pas |
| Shift ya da sağ tık (basılı) | Masaya eğil, kartlara yakından bak |
| Esc | Duraklat |

**Telefon ve tablette:** düğmelere dokunarak oynanır. **👁** düğmesi masaya eğilip kartları yakından gösterir, **☰** menüsü duraklatma, ses ve kurallara açılır. Hem dikey hem yatay ekranda çalışır; kamera ekran oranına göre kendini ayarlar, telefonda grafik ayarları otomatik hafifler.

## Dosyalar

- `index.html`, `style.css`: arayüz katmanı
- `js/rules.js`: blackjack kuralları, rakipler ve yapay zekâ (Node ile de çalışır)
- `js/scene.js`: 3B dünya: oda, masa, lamba, tabanca, kartlar, rakip figürleri, efektler
- `js/main.js`: oyun akışı
- `js/audio.js`: ses motoru (dosyasız, WebAudio ile sentez)
- `test/qa.js`: tarayıcı içi test botu

## Test

Tarayıcı konsolunda:

```js
import('/test/qa.js').then(m => m.start({ runs: 3, speed: 8 }))
```

Bot oyunu kendi kendine oynar; her adımda kart/mermi/etiket/düğme tutarlılığını denetler.
Sonuçlar `__qa.Q` içinde (`errs`, `warns`, `runs`, `log`).

## Yayınlama

Site GitHub Pages'ten yayınlanır. JS/CSS dosyaları CDN'de saatlerce önbellekte kalabildiği için her yayından önce sürüm etiketini yenileyin:

```bash
./scripts/surum.sh && git commit -am "Yeni sürüm" && git push
```
