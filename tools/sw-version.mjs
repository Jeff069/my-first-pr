/* Stempelt eine Version aus dem Inhalt der App in sw.js.
   Aufruf: node tools/sw-version.mjs   (vor jeder Veröffentlichung)

   Warum automatisch: Der Service Worker liefert die Dateien aus dem Gerät
   aus und erneuert sie nur, wenn sich sw.js selbst ändert. Von Hand
   hochzählen wird vergessen - genau das ist passiert. Die Version ist jetzt
   eine Prüfsumme über die ausgelieferten Dateien: Ändert sich eine davon,
   ändert sich die Version, und die App holt sich alles neu. */

import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';

const DATEIEN = [
  'index.html', 'styles.css', 'manifest.webmanifest',
  'js/konfig.js', 'js/format.js', 'js/store.js', 'js/model.js',
  'js/merge.js', 'js/teilen.js', 'js/wolke.js', 'js/charts.js', 'js/app.js'
];

const hash = createHash('sha256');
for (const datei of DATEIEN) hash.update(readFileSync(datei));
const version = 'haushaltsbuch-' + hash.digest('hex').slice(0, 12);

const alt = readFileSync('sw.js', 'utf8');
const neu = alt.replace(/var VERSION = '[^']*';/, `var VERSION = '${version}';`);

if (alt === neu) {
  console.log(`sw.js unverändert (${version})`);
} else {
  writeFileSync('sw.js', neu);
  console.log(`sw.js auf ${version} gestempelt`);
}
