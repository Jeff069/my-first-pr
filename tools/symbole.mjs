/* Erzeugt die App-Symbole aus einer Zeichnung im Code - kein Bildprogramm nötig.
   Aufruf: node tools/symbole.mjs
   Ergebnis: icons/symbol-192.png, symbol-512.png, symbol-maskierbar-512.png,
             apple-touch-icon.png

   Optik wie die App selbst: violette Fläche (--lila), darauf ein abgerundetes
   Feld wie die Kategorie-Chips und ein weißes „€“ in der Systemschrift. */

import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { mkdirSync } from 'node:fs';

const LILA = '#3b2f6b';
const FELD = 'rgba(255, 255, 255, 0.14)';
const WEISS = '#ffffff';

/* `anteil` ist die Kantenlänge des Feldes im Verhältnis zum Symbol. Maskierbare
   Symbole schneidet Android am Rand bis zu 20 % ab, der Inhalt muss also in
   den inneren 60 % bleiben - dort ist der Anteil deshalb kleiner. */
function zeichnung(groesse, anteil) {
  const m = groesse / 2;
  const feld = groesse * anteil;
  const rund = feld * 0.31; /* wie .chip: 13px bei 42px */
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${groesse}" height="${groesse}" viewBox="0 0 ${groesse} ${groesse}">
  <rect width="${groesse}" height="${groesse}" fill="${LILA}"/>
  <rect x="${m - feld / 2}" y="${m - feld / 2}" width="${feld}" height="${feld}" rx="${rund}" fill="${FELD}"/>
  <text x="${m}" y="${m}" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
        font-size="${feld * 0.78}" font-weight="700" fill="${WEISS}"
        text-anchor="middle" dominant-baseline="central">€</text>
</svg>`;
}

mkdirSync('icons', { recursive: true });
const browser = await chromium.launch();

const aufgaben = [
  { datei: 'icons/symbol-192.png', groesse: 192, anteil: 0.72 },
  { datei: 'icons/symbol-512.png', groesse: 512, anteil: 0.72 },
  { datei: 'icons/symbol-maskierbar-512.png', groesse: 512, anteil: 0.58 },
  { datei: 'icons/apple-touch-icon.png', groesse: 180, anteil: 0.72 }
];

for (const { datei, groesse, anteil } of aufgaben) {
  const seite = await browser.newPage({ viewport: { width: groesse, height: groesse } });
  await seite.setContent(
    `<style>html,body{margin:0;padding:0;background:${LILA};}</style>` + zeichnung(groesse, anteil)
  );
  await seite.screenshot({ path: datei, omitBackground: false });
  await seite.close();
  console.log(`${datei} (${groesse}×${groesse})`);
}

await browser.close();
