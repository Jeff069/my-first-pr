/* Erzeugt die App-Symbole aus einer Zeichnung im Code - kein Bildprogramm nötig.
   Aufruf: node tools/symbole.mjs
   Ergebnis: icons/symbol-192.png, symbol-512.png, symbol-maskierbar-512.png,
             apple-touch-icon.png */

import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { mkdirSync } from 'node:fs';

const GRUEN = '#14563f';
const PAPIER = '#f6f1e7';
const KUPFER = '#b4623a';

/* `anteil` verkleinert den Inhalt für maskierbare Symbole: Android schneidet
   davon bis zu 20 % am Rand ab, der Inhalt muss also in der Mitte bleiben. */
function zeichnung(groesse, anteil) {
  const m = groesse / 2;
  const s = (groesse * anteil) / 2;
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${groesse}" height="${groesse}" viewBox="0 0 ${groesse} ${groesse}">
  <rect width="${groesse}" height="${groesse}" fill="${GRUEN}"/>
  <g transform="translate(${m} ${m}) scale(${anteil}) translate(${-m} ${-m})">
    <text x="${m}" y="${m + s * 0.18}" font-family="Georgia, 'Times New Roman', serif"
          font-size="${s * 1.25}" font-weight="600" fill="${PAPIER}"
          text-anchor="middle" dominant-baseline="middle">€</text>
    <rect x="${m - s * 0.62}" y="${m + s * 0.48}" width="${s * 1.24}" height="${groesse * 0.016}" rx="${groesse * 0.008}" fill="${PAPIER}" opacity="0.9"/>
    <rect x="${m - s * 0.62}" y="${m + s * 0.68}" width="${s * 0.74}" height="${groesse * 0.016}" rx="${groesse * 0.008}" fill="${KUPFER}"/>
  </g>
</svg>`;
}

mkdirSync('icons', { recursive: true });
const browser = await chromium.launch();

const aufgaben = [
  { datei: 'icons/symbol-192.png', groesse: 192, anteil: 0.74 },
  { datei: 'icons/symbol-512.png', groesse: 512, anteil: 0.74 },
  { datei: 'icons/symbol-maskierbar-512.png', groesse: 512, anteil: 0.56 },
  { datei: 'icons/apple-touch-icon.png', groesse: 180, anteil: 0.74 }
];

for (const { datei, groesse, anteil } of aufgaben) {
  const seite = await browser.newPage({ viewport: { width: groesse, height: groesse } });
  await seite.setContent(
    `<style>html,body{margin:0;padding:0;background:${GRUEN};}</style>` + zeichnung(groesse, anteil)
  );
  await seite.screenshot({ path: datei, omitBackground: false });
  await seite.close();
  console.log(`${datei} (${groesse}×${groesse})`);
}

await browser.close();
