/* Erzeugt aus index.html die Fassung für eine veröffentlichte Ansicht.
   Dort liefert die Plattform <!doctype>, <html>, <head> und <body> selbst -
   die Seite darf diese Hülle also nicht mitbringen, Titel und Stylesheet
   stehen stattdessen direkt am Anfang der Datei.

   Aufruf: node tools/artifact-seite.mjs [Zieldatei]
   Die Quelle bleibt index.html - hier wird nichts doppelt gepflegt. */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const ziel = process.argv[2] || 'build/artifact-index.html';
const quelle = readFileSync('index.html', 'utf8');

const titel = quelle.match(/<title>([\s\S]*?)<\/title>/)[1].trim();
const rumpf = quelle.match(/<body>([\s\S]*?)<\/body>/)[1].trim();

const seite = [
  `<title>${titel}</title>`,
  '<link rel="stylesheet" href="styles.css">',
  '',
  rumpf,
  ''
].join('\n');

mkdirSync(dirname(ziel), { recursive: true });
writeFileSync(ziel, seite);
console.log(`${ziel} geschrieben (${seite.length} Zeichen, Titel: „${titel}")`);
