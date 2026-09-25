/* Tests für das Teilen einzelner Buchungen. */
const test = require('node:test');
const assert = require('node:assert/strict');

const teilen = require('../js/teilen.js');

const BUCHUNG = {
  id: 'b_abc', datum: '2026-09-19', art: 'ausgabe', betrag: 1350,
  kategorieId: 'kat_freizeit', notiz: 'Blumen für Sära & Co', person: 'b', fuer: 'beide', quelle: null
};
const KATEGORIE = { id: 'kat_freizeit', name: 'Freizeit', typ: 'ausgabe', slot: 6 };
const BASIS = 'https://jeff069.github.io/my-first-pr/';

test('Eine Buchung übersteht den Weg durch den Link unverändert', () => {
  const zurueck = teilen.ausAdresse(teilen.linkFuer(BUCHUNG, KATEGORIE, BASIS));
  assert.deepEqual(zurueck.buchung, BUCHUNG);
  assert.deepEqual(zurueck.kategorie, KATEGORIE);
});

test('Umlaute und Sonderzeichen bleiben erhalten', () => {
  const eigen = Object.assign({}, BUCHUNG, { notiz: 'Grüße: 50 % Rabatt & mehr – "günstig"' });
  const zurueck = teilen.ausAdresse(teilen.linkFuer(eigen, null, BASIS));
  assert.equal(zurueck.buchung.notiz, eigen.notiz);
});

test('Der Link enthält keine Zeichen, die unterwegs zerbrechen', () => {
  const link = teilen.linkFuer(BUCHUNG, KATEGORIE, BASIS);
  const anhang = link.split('#teilen=')[1];
  assert.match(anhang, /^[A-Za-z0-9_-]+$/);
});

test('Die Kennung bleibt gleich - zweimal übernehmen erzeugt keine zwei Buchungen', () => {
  const a = teilen.ausAdresse(teilen.linkFuer(BUCHUNG, null, BASIS));
  const b = teilen.ausAdresse(teilen.linkFuer(BUCHUNG, null, BASIS));
  assert.equal(a.buchung.id, b.buchung.id);
});

test('„Für wen?“ übersteht den Link - ohne Angabe gilt die eigene Sache', () => {
  const beide = teilen.ausAdresse(teilen.linkFuer(BUCHUNG, null, BASIS));
  assert.equal(beide.buchung.fuer, 'beide');

  const ohne = teilen.pruefen({ b: { id: 'b1', datum: '2026-09-19', betrag: 100, person: 'a' } });
  assert.equal(ohne.buchung.fuer, 'a', 'alter Link ohne fuer: keine Schuld aus dem Nichts');

  const unsinn = teilen.pruefen({ b: { id: 'b1', datum: '2026-09-19', betrag: 100, person: 'a', fuer: 'oma' } });
  assert.equal(unsinn.buchung.fuer, 'a');

  const gemeinsam = teilen.pruefen({ b: { id: 'b1', datum: '2026-09-19', betrag: 100, person: 'gemeinsam', fuer: 'a' } });
  assert.equal(gemeinsam.buchung.fuer, 'beide', 'aus dem gemeinsamen Topf streckt keiner vor');
});

test('Ohne Anhang kommt nichts zurück', () => {
  assert.equal(teilen.ausAdresse(BASIS), null);
  assert.equal(teilen.ausAdresse(''), null);
});

test('Kaputte oder erfundene Anhänge werden abgewiesen', () => {
  assert.equal(teilen.ausAdresse(BASIS + '#teilen=nichtsinnvoll'), null);
  assert.equal(teilen.pruefen(teilen.dekodieren(teilen.kodieren({ b: { datum: 'morgen', betrag: 5 } }))), null);
  assert.equal(teilen.pruefen({ b: { id: 'x', datum: '2026-09-19', betrag: -5 } }), null, 'kein negativer Betrag');
  assert.equal(teilen.pruefen({ b: { id: 'x', datum: '2026-09-19', betrag: 'viel' } }), null);
  assert.equal(teilen.pruefen(null), null);
});

test('Fremde Felder werden nicht übernommen', () => {
  const boshaft = teilen.kodieren({
    b: { id: 'b1', datum: '2026-09-19', art: 'ausgabe', betrag: 100, notiz: 'ok', quelle: { dauerId: 'd1', monat: '2026-09' }, sonstwas: true }
  });
  const geprueft = teilen.pruefen(teilen.dekodieren(boshaft));
  assert.equal(geprueft.buchung.quelle, null, 'keine untergeschobene Dauerauftrags-Herkunft');
  assert.equal(geprueft.buchung.sonstwas, undefined);
});

test('Überlange Texte werden gekürzt statt übernommen', () => {
  const lang = teilen.pruefen({ b: { id: 'b1'.padEnd(500, 'x'), datum: '2026-09-19', betrag: 100, notiz: 'n'.repeat(5000) } });
  assert.equal(lang.buchung.id.length, 64);
  assert.equal(lang.buchung.notiz.length, 200);
});
