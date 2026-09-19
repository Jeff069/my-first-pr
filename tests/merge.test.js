/* Tests für das Zusammenführen zweier Stände. */
const test = require('node:test');
const assert = require('node:assert/strict');

const merge = require('../js/merge.js');
const store = require('../js/store.js');

function stand(teile) {
  return Object.assign({
    version: 1,
    einstellungen: { personA: 'Ich', personB: 'Partnerin', startsaldo: 0, geaendert: '2026-09-01T00:00:00.000Z' },
    kategorien: [],
    buchungen: [],
    dauerauftraege: [],
    ausgeblendet: [],
    geloescht: []
  }, teile);
}

function buchung(id, betrag, geaendert) {
  return { id, datum: '2026-09-05', art: 'ausgabe', betrag, kategorieId: 'kat_lebensmittel', notiz: id, person: 'a', quelle: null, geaendert };
}

test('Beide Seiten behalten ihre eigenen neuen Buchungen', () => {
  const meins = stand({ buchungen: [buchung('b1', 1000, '2026-09-10T10:00:00.000Z')] });
  const ihres = stand({ buchungen: [buchung('b2', 2000, '2026-09-10T11:00:00.000Z')] });

  const ergebnis = merge.staendeMischen(meins, ihres);
  assert.deepEqual(ergebnis.buchungen.map((b) => b.id).sort(), ['b1', 'b2']);
});

test('Bei zwei Fassungen derselben Buchung gewinnt die jüngere', () => {
  const alt = stand({ buchungen: [buchung('b1', 1000, '2026-09-10T10:00:00.000Z')] });
  const neu = stand({ buchungen: [buchung('b1', 4200, '2026-09-10T12:00:00.000Z')] });

  assert.equal(merge.staendeMischen(alt, neu).buchungen[0].betrag, 4200);
  assert.equal(merge.staendeMischen(neu, alt).buchungen[0].betrag, 4200, 'unabhängig von der Reihenfolge');
});

test('Gelöschtes kommt nicht vom anderen Gerät zurück', () => {
  const geloescht = stand({
    buchungen: [],
    geloescht: [{ id: 'b1', zeit: '2026-09-10T12:00:00.000Z' }]
  });
  const kenntEsNoch = stand({ buchungen: [buchung('b1', 1000, '2026-09-10T10:00:00.000Z')] });

  assert.equal(merge.staendeMischen(geloescht, kenntEsNoch).buchungen.length, 0);
  assert.equal(merge.staendeMischen(kenntEsNoch, geloescht).buchungen.length, 0);
});

test('Wird ein gelöschter Eintrag später bearbeitet, bleibt die Bearbeitung', () => {
  const geloescht = stand({ geloescht: [{ id: 'b1', zeit: '2026-09-10T10:00:00.000Z' }] });
  const spaeterBearbeitet = stand({ buchungen: [buchung('b1', 7700, '2026-09-10T15:00:00.000Z')] });

  const ergebnis = merge.staendeMischen(geloescht, spaeterBearbeitet);
  assert.equal(ergebnis.buchungen.length, 1);
  assert.equal(ergebnis.buchungen[0].betrag, 7700);
});

test('Grabsteine beider Seiten bleiben erhalten', () => {
  const a = stand({ geloescht: [{ id: 'b1', zeit: merge.jetzt() }] });
  const b = stand({ geloescht: [{ id: 'b2', zeit: merge.jetzt() }] });

  assert.deepEqual(merge.staendeMischen(a, b).geloescht.map((e) => e.id).sort(), ['b1', 'b2']);
});

test('Alte Grabsteine werden aufgeräumt, junge nicht', () => {
  const alt = { id: 'b1', zeit: '2020-01-01T00:00:00.000Z' };
  const jung = { id: 'b2', zeit: merge.jetzt() };

  const uebrig = merge.grabsteineAufraeumen([alt, jung]);
  assert.deepEqual(uebrig.map((e) => e.id), ['b2']);
});

test('Einstellungen übernimmt die jüngere Fassung', () => {
  const alt = stand({ einstellungen: { personA: 'Ich', personB: 'Partnerin', startsaldo: 0, geaendert: '2026-09-01T00:00:00.000Z' } });
  const neu = stand({ einstellungen: { personA: 'Jeff', personB: 'Sara', startsaldo: 0, geaendert: '2026-09-18T00:00:00.000Z' } });

  assert.equal(merge.staendeMischen(alt, neu).einstellungen.personB, 'Sara');
  assert.equal(merge.staendeMischen(neu, alt).einstellungen.personB, 'Sara');
});

test('Ausgeblendete Dauerauftrags-Monate werden vereinigt', () => {
  const a = stand({ ausgeblendet: ['d1|2026-09'] });
  const b = stand({ ausgeblendet: ['d1|2026-10'] });

  assert.deepEqual(merge.staendeMischen(a, b).ausgeblendet.sort(), ['d1|2026-09', 'd1|2026-10']);
});

test('Kategorien mischen sich wie Buchungen', () => {
  const a = stand({ kategorien: [{ id: 'kat_a', name: 'Alt', typ: 'ausgabe', slot: 1, geaendert: '2026-09-01T00:00:00.000Z' }] });
  const b = stand({ kategorien: [{ id: 'kat_a', name: 'Neu', typ: 'ausgabe', slot: 2, geaendert: '2026-09-09T00:00:00.000Z' }] });

  assert.equal(merge.staendeMischen(a, b).kategorien[0].name, 'Neu');
});

test('Ein leerer Gegenstand ändert nichts', () => {
  const meins = stand({ buchungen: [buchung('b1', 1000, merge.jetzt())] });
  assert.equal(merge.staendeMischen(meins, null).buchungen.length, 1);
  assert.equal(merge.staendeMischen(null, meins).buchungen.length, 1);
});

test('Der gemischte Stand übersteht Speichern und Laden', () => {
  const a = stand({ buchungen: [buchung('b1', 1000, merge.jetzt())] });
  const b = stand({ buchungen: [buchung('b2', 2000, merge.jetzt())] });

  const ergebnis = store.importJson(JSON.stringify(merge.staendeMischen(a, b)));
  assert.equal(ergebnis.ok, true);
  assert.equal(ergebnis.daten.buchungen.length, 2);
  assert.ok(ergebnis.daten.buchungen.every((x) => x.geaendert > '2020-01-01'), 'Zeitstempel überleben das Laden');
  assert.deepEqual(ergebnis.daten.geloescht, []);
});

test('Grabsteine und Zeitstempel ueberstehen Speichern und Laden', () => {
  const eingang = stand({
    buchungen: [buchung('b1', 500, '2026-09-11T08:00:00.000Z')],
    geloescht: [{ id: 'b9', zeit: '2026-09-11T09:00:00.000Z' }]
  });
  const ergebnis = store.importJson(JSON.stringify(eingang));
  assert.equal(ergebnis.daten.buchungen[0].geaendert, '2026-09-11T08:00:00.000Z');
  assert.deepEqual(ergebnis.daten.geloescht, [{ id: 'b9', zeit: '2026-09-11T09:00:00.000Z' }]);
});
