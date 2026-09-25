/* Tests für „Für wen?“ und den Ausgleich zwischen beiden. Laufen ohne npm: `node --test` */
const test = require('node:test');
const assert = require('node:assert/strict');

const store = require('../js/store.js');
const model = require('../js/model.js');

const HEUTE = '2026-09-25';

function buchung(datum, art, betrag, extra) {
  return Object.assign({ id: datum + art + betrag, datum, art, betrag, kategorieId: 'kat_lebensmittel', notiz: '', person: 'a', quelle: null }, extra || {});
}

function datenMit(buchungen, dauerauftraege) {
  const daten = store.leereDaten();
  daten.buchungen = buchungen || [];
  daten.dauerauftraege = dauerauftraege || [];
  return daten;
}

/* Die Beispieldaten aus dem Demo-Knopf (js/app.js) für September 2026,
   mit den fuer-Markierungen aus dem Konzept. */
function demoDaten(mitFuer) {
  const beispiele = [
    { tag: '01', art: 'einnahme', betrag: 285000, kategorieId: 'kat_gehalt', notiz: 'Gehalt', person: 'a' },
    { tag: '01', art: 'einnahme', betrag: 214000, kategorieId: 'kat_gehalt', notiz: 'Gehalt', person: 'b' },
    { tag: '02', art: 'ausgabe', betrag: 128000, kategorieId: 'kat_wohnen', notiz: 'Miete', person: 'gemeinsam' },
    { tag: '03', art: 'ausgabe', betrag: 9850, kategorieId: 'kat_abos', notiz: 'Internet', person: 'gemeinsam' },
    { tag: '05', art: 'ausgabe', betrag: 8740, kategorieId: 'kat_lebensmittel', notiz: 'REWE Wocheneinkauf', person: 'b', fuer: 'beide' },
    { tag: '09', art: 'ausgabe', betrag: 6520, kategorieId: 'kat_mobilitaet', notiz: 'Tanken', person: 'a', fuer: 'a' },
    { tag: '12', art: 'ausgabe', betrag: 12300, kategorieId: 'kat_lebensmittel', notiz: 'Großeinkauf', person: 'gemeinsam' },
    { tag: '14', art: 'ausgabe', betrag: 4500, kategorieId: 'kat_freizeit', notiz: 'Kino und Essen', person: 'gemeinsam' },
    { tag: '18', art: 'ausgabe', betrag: 21000, kategorieId: 'kat_versicherung', notiz: 'Haftpflicht', person: 'a', fuer: 'beide' },
    { tag: '24', art: 'ausgabe', betrag: 7600, kategorieId: 'kat_gesundheit', notiz: 'Apotheke', person: 'b', fuer: 'b' }
  ];
  return datenMit(beispiele.map((b, i) => {
    const eintrag = { id: 'demo_' + i, datum: '2026-09-' + b.tag, art: b.art, betrag: b.betrag, kategorieId: b.kategorieId, notiz: b.notiz, person: b.person, quelle: null };
    if (mitFuer && b.fuer) eintrag.fuer = b.fuer;
    return eintrag;
  }));
}

/* ---------------- fuerVon ---------------- */

test('Aus dem gemeinsamen Topf ist es immer für beide, egal was in fuer steht', () => {
  assert.equal(model.fuerVon({ person: 'gemeinsam', fuer: 'a' }), 'beide');
});

test('Alte Daten ohne fuer sind die eigene Sache - keine Schulden', () => {
  assert.equal(model.fuerVon({ person: 'a' }), 'a');
});

test('Ein gültiges fuer gilt', () => {
  assert.equal(model.fuerVon({ person: 'a', fuer: 'beide' }), 'beide');
  assert.equal(model.fuerVon({ person: 'a', fuer: 'b' }), 'b');
});

test('Ein ungültiges fuer fällt auf die Person zurück', () => {
  assert.equal(model.fuerVon({ person: 'b', fuer: 'unsinn' }), 'b');
});

/* ---------------- ausgleich ---------------- */

test('Beispieldaten: Partnerin gibt Ich 61,30 € zurück', () => {
  const g = model.ausgleich(demoDaten(true), '2026-09', HEUTE);
  assert.equal(g.betrag, 6130);
  assert.equal(g.von, 'b');
  assert.equal(g.an, 'a');
  assert.deepEqual(g.bezahltFuerAnderen, { a: 10500, b: 4370 });
  assert.equal(g.posten.length, 2);
  assert.equal(g.posten[0].notiz, 'REWE Wocheneinkauf', 'nach Datum aufsteigend: 05.09. zuerst');
  assert.equal(g.posten[0].datum, '2026-09-05');
  assert.equal(g.posten[1].anteil, 10500);
});

test('Dieselben Daten ohne fuer-Felder ergeben keinen Ausgleich', () => {
  const g = model.ausgleich(demoDaten(false), '2026-09', HEUTE);
  assert.equal(g.betrag, 0);
  assert.equal(g.von, null);
  assert.equal(g.an, null);
  assert.deepEqual(g.posten, []);
});

test('Gemeinsam bezahlt erzeugt keinen Ausgleich, auch nicht mit fuer', () => {
  const daten = datenMit([buchung('2026-09-10', 'ausgabe', 100000, { person: 'gemeinsam', fuer: 'a' })]);
  assert.equal(model.ausgleich(daten, '2026-09', HEUTE).betrag, 0);
});

test('Geplante Buchungen zählen erst ab ihrem Tag mit', () => {
  const daten = datenMit([buchung('2026-09-30', 'ausgabe', 64000, { person: 'a', fuer: 'beide' })]);
  assert.equal(model.ausgleich(daten, '2026-09', '2026-09-25').betrag, 0);

  const spaeter = model.ausgleich(daten, '2026-09', '2026-09-30');
  assert.equal(spaeter.betrag, 32000);
  assert.equal(spaeter.von, 'b');
});

test('Rundung je Posten: die Liste geht exakt auf die Kennzahl auf', () => {
  const daten = datenMit([
    buchung('2026-09-01', 'ausgabe', 101, { id: 'p1', person: 'a', fuer: 'beide' }),
    buchung('2026-09-02', 'ausgabe', 101, { id: 'p2', person: 'a', fuer: 'beide' }),
    buchung('2026-09-03', 'ausgabe', 101, { id: 'p3', person: 'b', fuer: 'beide' })
  ]);
  const g = model.ausgleich(daten, '2026-09', HEUTE);
  assert.equal(g.betrag, 51);
  const summe = g.posten.reduce((s, p) => s + (p.zahler === 'a' ? p.anteil : -p.anteil), 0);
  assert.equal(summe, 51);
});

test('Ganz für die andere Person ausgelegt zählt voll', () => {
  const daten = datenMit([buchung('2026-09-10', 'ausgabe', 5000, { person: 'a', fuer: 'b' })]);
  const g = model.ausgleich(daten, '2026-09', HEUTE);
  assert.equal(g.betrag, 5000);
  assert.equal(g.von, 'b');
  assert.equal(g.an, 'a');
  assert.equal(g.posten[0].fuer, 'b');
  assert.equal(g.posten[0].anteil, 5000);
});

test('Eine Buchung im August zählt für den September nicht', () => {
  const daten = datenMit([buchung('2026-08-20', 'ausgabe', 5000, { person: 'a', fuer: 'b' })]);
  const g = model.ausgleich(daten, '2026-09', HEUTE);
  assert.equal(g.betrag, 0);
  assert.equal(g.posten.length, 0);
});

/* ---------------- faelligeBuchungen ---------------- */

function dauer(extra) {
  return Object.assign({
    id: 'd1', bezeichnung: 'Miete', art: 'ausgabe', betrag: 120000, kategorieId: 'kat_wohnen',
    person: 'a', tagImMonat: 1, intervall: 'monatlich', startMonat: '2026-01', endMonat: null, aktiv: true
  }, extra || {});
}

test('Die erzeugte Buchung übernimmt „Für wen?“ vom Dauerauftrag', () => {
  const fuerBeide = model.faelligeBuchungen(datenMit([], [dauer({ person: 'a', fuer: 'beide' })]), '2026-09');
  assert.equal(fuerBeide.length, 1);
  assert.equal(fuerBeide[0].fuer, 'beide');

  const ohneFuer = model.faelligeBuchungen(datenMit([], [dauer({ person: 'b' })]), '2026-09');
  assert.equal(ohneFuer[0].fuer, 'b');

  const gemeinsam = model.faelligeBuchungen(datenMit([], [dauer({ person: 'gemeinsam', fuer: 'a' })]), '2026-09');
  assert.equal(gemeinsam[0].fuer, 'beide');
});

/* ---------------- migrieren ---------------- */

test('Beim Laden wird fuer bei Buchungen normalisiert', () => {
  const daten = store.migrieren({
    buchungen: [
      buchung('2026-09-01', 'ausgabe', 1000, { id: 'g', person: 'gemeinsam', fuer: 'a' }),
      buchung('2026-09-02', 'ausgabe', 1000, { id: 'a_ohne', person: 'a' }),
      buchung('2026-09-03', 'ausgabe', 1000, { id: 'a_beide', person: 'a', fuer: 'beide' })
    ]
  });
  const nach = {};
  daten.buchungen.forEach((b) => { nach[b.id] = b.fuer; });
  assert.equal(nach.g, 'beide', 'gemeinsam erzwingt beide, auch wenn ein Import a liefert');
  assert.equal(nach.a_ohne, 'a');
  assert.equal(nach.a_beide, 'beide');
});

test('Beim Laden wird fuer bei Daueraufträgen normalisiert', () => {
  const daten = store.migrieren({
    dauerauftraege: [
      dauer({ id: 'd_a', person: 'b', fuer: 'a' }),
      dauer({ id: 'd_ohne', person: 'b' })
    ]
  });
  assert.equal(daten.dauerauftraege[0].fuer, 'a');
  assert.equal(daten.dauerauftraege[1].fuer, 'b');
});

test('Export und Import erhalten fuer', () => {
  const daten = datenMit(
    [buchung('2026-09-18', 'ausgabe', 21000, { notiz: 'Haftpflicht', person: 'a', fuer: 'beide' })],
    [dauer({ person: 'b', fuer: 'a' })]
  );
  const normalisiert = store.migrieren(daten);
  assert.equal(normalisiert.buchungen[0].fuer, 'beide');
  assert.equal(normalisiert.dauerauftraege[0].fuer, 'a');

  const ergebnis = store.importJson(store.exportJson(normalisiert));
  assert.equal(ergebnis.ok, true);
  assert.deepEqual(ergebnis.daten, normalisiert);
  assert.equal(ergebnis.daten.buchungen[0].fuer, 'beide');
  assert.equal(ergebnis.daten.dauerauftraege[0].fuer, 'a');
});
