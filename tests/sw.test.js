/* Tests für den Service Worker: alles, was die Seite lädt, muss im Bestand
   stehen - sonst startet die installierte App ohne Netz mit leerem Kopf. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const WURZEL = path.join(__dirname, '..');
function lesen(datei) { return fs.readFileSync(path.join(WURZEL, datei), 'utf8'); }

function alleTreffer(text, muster) {
  var liste = [], m;
  while ((m = muster.exec(text)) !== null) liste.push(m[1]);
  return liste;
}

/* Alles, was index.html und das Manifest tatsächlich anfordern. */
function seitenDateien() {
  var html = lesen('index.html');
  var manifest = JSON.parse(lesen('manifest.webmanifest'));
  return [].concat(
    alleTreffer(html, /<script src="([^"]+)"/g),
    alleTreffer(html, /<link rel="stylesheet" href="([^"]+)"/g),
    alleTreffer(html, /<link rel="manifest" href="([^"]+)"/g),
    alleTreffer(html, /<link rel="apple-touch-icon" href="([^"]+)"/g),
    manifest.icons.map(function (i) { return i.src; })
  );
}

function bestand() {
  var sw = lesen('sw.js');
  var treffer = sw.match(/var BESTAND = \[([^\]]*)\];/);
  assert.ok(treffer, 'sw.js enthält var BESTAND = [ … ];');
  return alleTreffer(treffer[1], /'([^']+)'/g);
}

test('sw.js hält alles im Bestand, was index.html und das Manifest laden', () => {
  var vorhanden = bestand();
  assert.ok(vorhanden.includes('./'), 'Startadresse ./ fehlt im Bestand');
  assert.ok(vorhanden.includes('./index.html'), './index.html fehlt im Bestand');
  var fehlend = seitenDateien().filter(function (pfad) { return !vorhanden.includes('./' + pfad); });
  assert.deepEqual(fehlend, [], 'fehlt im BESTAND von sw.js');
});

test('tools/sw-version.mjs kennt alle Skripte und Stile aus index.html', () => {
  var quelle = lesen('tools/sw-version.mjs');
  var treffer = quelle.match(/const DATEIEN = \[([^\]]*)\];/);
  assert.ok(treffer, 'sw-version.mjs enthält const DATEIEN = [ … ];');
  var dateien = alleTreffer(treffer[1], /'([^']+)'/g);
  var html = lesen('index.html');
  var erwartet = [].concat(
    alleTreffer(html, /<script src="([^"]+)"/g),
    alleTreffer(html, /<link rel="stylesheet" href="([^"]+)"/g),
    alleTreffer(html, /<link rel="manifest" href="([^"]+)"/g),
    ['index.html']
  );
  var fehlend = erwartet.filter(function (pfad) { return !dateien.includes(pfad); });
  assert.deepEqual(fehlend, [], 'fehlt in DATEIEN von tools/sw-version.mjs');
});
