#!/bin/sh
# Yayından önce çalıştır: tüm dosya bağlantılarına yeni sürüm etiketi koyar,
# böylece tarayıcı ve CDN önbelleği eski JS/CSS'i vermez.
cd "$(dirname "$0")/.." || exit 1
V=$(date +%Y%m%d%H%M%S)
sed -i '' -E "s#(href=\"style\.css)(\?v=[0-9]+)?\"#\1?v=$V\"#; s#(src=\"js/[a-z]+\.js)(\?v=[0-9]+)?\"#\1?v=$V\"#g" index.html
sed -i '' -E "s#(from '\./scene\.js)(\?v=[0-9]+)?'#\1?v=$V'#" js/main.js
echo "sürüm: $V"
