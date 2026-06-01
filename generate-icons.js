const fs = require('fs');
// Crée une icône SVG simple (cercle orange avec texte "K")
const svg192 = `<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192" viewBox="0 0 192 192">
  <rect width="192" height="192" rx="32" fill="#E67E22"/>
  <text x="96" y="120" font-size="96" font-weight="bold" font-family="Arial" fill="white" text-anchor="middle">K</text>
</svg>`;
const svg512 = svg192.replace(/width="192"/, 'width="512"').replace(/height="192"/, 'height="512"').replace(/viewBox="0 0 192 192"/, 'viewBox="0 0 512 512"').replace(/rx="32"/, 'rx="64"').replace(/font-size="96"/, 'font-size="256"').replace(/x="96" y="120"/, 'x="256" y="320"');
fs.mkdirSync('public/icons', { recursive: true });
fs.writeFileSync('public/icons/icon-192.svg', svg192);
fs.writeFileSync('public/icons/icon-512.svg', svg512);
// Génère des PNG à partir de SVGs ? On va simplement utiliser les SVG dans le manifest.
// Mieux : on va ajuster manifest.json pour utiliser les SVG (certains navigateurs acceptent).
// Mais pour la compatibilité, on va convertir en PNG avec canvas (si disponible) ou utiliser un service gratuit.
// Simplifions : on va utiliser les SVG et ajouter les PNG plus tard.
console.log('Icônes SVG créées dans public/icons/');
