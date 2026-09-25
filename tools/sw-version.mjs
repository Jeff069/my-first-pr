/* Stempelt Version und Bestand der App in sw.js.
   Aufruf: node tools/sw-version.mjs   (vor jeder Veröffentlichung)

   Warum automatisch: Der Service Worker liefert die Dateien aus dem Gerät
   aus und erneuert sie nur, wenn sich sw.js selbst ändert. Von Hand
   hochzählen wird vergessen - genau das ist passiert. Die Version ist jetzt
   eine Prüfsumme über die ausgelieferten Dateien: Ändert sich eine davon,
   ändert sich die Version, und die App holt sich alles neu.

   Der BESTAND entsteht aus derselben Liste: Eine von Hand gepflegte zweite
   Liste lief auseinander, und der Offline-Start brach mit leerem Kopf ab. */

import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';

const DATEIEN = [
  'index.html', 'styles.css', 'manifest.webmanifest',
  'js/konfig.js', 'js/format.js', 'js/store.js', 'js/model.js',
  'js/merge.js', 'js/teilen.js', 'js/wolke.js', 'js/charts.js', 'js/app.js'
];

const SYMBOLE = [
  'icons/symbol-192.png', 'icons/symbol-512.png',
  'icons/symbol-maskierbar-512.png', 'icons/apple-touch-icon.png'
];

const hash = createHash('sha256');
for (const datei of DATEIEN) hash.update(readFileSync(datei));
const version = 'haushaltsbuch-' + hash.digest('hex').slice(0, 12);

const bestand = ['./'].concat(DATEIEN.concat(SYMBOLE).map((pfad) => './' + pfad)).map((pfad) => `  '${pfad}'`);

const alt = readFileSync('sw.js', 'utf8');
const neu = alt
  .replace(/var VERSION = '[^']*';/, `var VERSION = '${version}';`)
  .replace(/var BESTAND = \[[^\]]*\];/, `var BESTAND = [\n${bestand.join(',\n')}\n];`);

if (alt === neu) {
  console.log(`sw.js unverändert (${version})`);
} else {
  writeFileSync('sw.js', neu);
  console.log(`sw.js auf ${version} gestempelt`);
}
