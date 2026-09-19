/* Tests für den Rechenkern. Laufen ohne npm: `node --test tests/` */
const test = require('node:test');
const assert = require('node:assert/strict');

const format = require('../js/format.js');
const store = require('../js/store.js');
const model = require('../js/model.js');

function buchung(datum, art, betrag, extra) {
  return Object.assign({ id: datum + art + betrag, datum, art, betrag, kategorieId: 'kat_lebensmittel', notiz: '', person: 'a', quelle: null }, extra || {});
}

function datenMit(buchungen, dauerauftraege) {
  const daten = store.leereDaten();
  daten.buchungen = buchungen || [];
  daten.dauerauftraege = dauerauftraege || [];
  return daten;
}

test('Beträge werden aus deutscher und englischer Schreibweise gelesen', () => {
  assert.equal(format.parseBetrag('12,50'), 1250);
  assert.equal(format.parseBetrag('1.234,56'), 123456);
  assert.equal(format.parseBetrag('1234.56'), 123456);
  assert.equal(format.parseBetrag('1.234'), 123400, 'Punkt vor drei Ziffern ist ein Tausenderpunkt');
  assert.equal(format.parseBetrag('89,90 €'), 8990);
  assert.equal(format.parseBetrag(''), null);
  assert.equal(format.parseBetrag('keine Zahl'), null);
});

/* Intl setzt vor das Euro-Zeichen ein geschuetztes Leerzeichen - fuer den Vergleich normalisiert. */
function euroText(cent) {
  return format.eur(cent).replace(/[\u00a0\u202f]/g, ' ');
}

test('Cent-Arithmetik bleibt exakt', () => {
  assert.equal(format.parseBetrag('0,10') + format.parseBetrag('0,20'), 30);
  assert.equal(euroText(30), '0,30 €');
  assert.equal(euroText(123456), '1.234,56 €');
});

test('Monatssummen filtern nach Monat und bilden den Saldo', () => {
  const daten = datenMit([
    buchung('2026-09-01', 'einnahme', 300000),
    buchung('2026-09-05', 'ausgabe', 120000),
    buchung('2026-09-20', 'ausgabe', 30000),
    buchung('2026-08-15', 'ausgabe', 999999)
  ]);
  const u = model.monatsUebersicht(daten, '2026-09', '2026-09-30');
  assert.equal(u.einnahmen, 300000);
  assert.equal(u.ausgaben, 150000);
  assert.equal(u.saldo, 150000);
  assert.equal(u.sparquote, 50);
  assert.equal(u.anzahl, 3, 'der August darf nicht mitzählen');
});

test('Geplante Abbuchungen werden von bereits gebuchten getrennt', () => {
  const daten = datenMit([
    buchung('2026-09-03', 'ausgabe', 50000),
    buchung('2026-09-28', 'ausgabe', 20000)
  ]);
  const u = model.monatsUebersicht(daten, '2026-09', '2026-09-15');
  assert.equal(u.gebuchteAusgaben, 50000);
  assert.equal(u.geplanteAusgaben, 20000);
  assert.equal(u.geplanteBuchungen.length, 1);
  assert.equal(u.geplanteBuchungen[0].datum, '2026-09-28');
});

test('Sparquote ohne Einnahmen ist 0 statt einer Division durch null', () => {
  const daten = datenMit([buchung('2026-09-05', 'ausgabe', 10000)]);
  const u = model.monatsUebersicht(daten, '2026-09', '2026-09-30');
  assert.equal(u.sparquote, 0);
  assert.equal(Number.isFinite(u.sparquote), true);
});

test('Kategorien werden absteigend mit Anteil aggregiert', () => {
  const daten = datenMit([
    buchung('2026-09-01', 'ausgabe', 20000, { kategorieId: 'kat_lebensmittel' }),
    buchung('2026-09-02', 'ausgabe', 10000, { kategorieId: 'kat_lebensmittel' }),
    buchung('2026-09-03', 'ausgabe', 70000, { kategorieId: 'kat_wohnen' })
  ]);
  const liste = model.nachKategorie(daten, '2026-09');
  assert.equal(liste[0].name, 'Wohnen & Miete');
  assert.equal(liste[0].betrag, 70000);
  assert.equal(liste[0].anteil, 70);
  assert.equal(liste[1].betrag, 30000);
  assert.equal(liste[1].anzahl, 2);
});

test('Auswertung nach Person weist Gemeinsames eigens aus', () => {
  const daten = datenMit([
    buchung('2026-09-01', 'ausgabe', 10000, { person: 'a' }),
    buchung('2026-09-02', 'ausgabe', 30000, { person: 'b' }),
    buchung('2026-09-03', 'ausgabe', 60000, { person: 'gemeinsam' })
  ]);
  const liste = model.nachPerson(daten, '2026-09');
  assert.deepEqual(liste.map((p) => p.betrag), [10000, 30000, 60000]);
  assert.equal(liste[2].anteil, 60);
});

test('Monatsverlauf liefert die letzten Monate in Reihenfolge', () => {
  const daten = datenMit([
    buchung('2026-07-01', 'ausgabe', 10000),
    buchung('2026-09-01', 'ausgabe', 20000)
  ]);
  const reihe = model.monatsVerlauf(daten, '2026-09', 3);
  assert.deepEqual(reihe.map((m) => m.monat), ['2026-07', '2026-08', '2026-09']);
  assert.equal(reihe[0].ausgaben, 10000);
  assert.equal(reihe[1].ausgaben, 0);
});

test('Abbuchungstag 31 rutscht auf den letzten Tag des Monats', () => {
  assert.equal(model.buchungsDatum('2026-02', 31), '2026-02-28');
  assert.equal(model.buchungsDatum('2024-02', 31), '2024-02-29', 'Schaltjahr');
  assert.equal(model.buchungsDatum('2026-04', 31), '2026-04-30');
  assert.equal(model.buchungsDatum('2026-01', 15), '2026-01-15');
});

test('Daueraufträge erzeugen den fehlenden Monat - und nur einmal', () => {
  const dauer = {
    id: 'd1', bezeichnung: 'Miete', art: 'ausgabe', betrag: 120000, kategorieId: 'kat_wohnen',
    person: 'gemeinsam', tagImMonat: 1, intervall: 'monatlich', startMonat: '2026-01', endMonat: null, aktiv: true
  };
  const daten = datenMit([], [dauer]);

  const ersteRunde = model.faelligeBuchungen(daten, '2026-09');
  assert.equal(ersteRunde.length, 1);
  assert.equal(ersteRunde[0].datum, '2026-09-01');
  assert.equal(ersteRunde[0].notiz, 'Miete');

  daten.buchungen = daten.buchungen.concat(ersteRunde);
  assert.equal(model.faelligeBuchungen(daten, '2026-09').length, 0, 'keine Verdopplung beim zweiten Lauf');
});

test('Bewusst geloeschte Dauerauftrags-Buchungen kehren nicht zurueck', () => {
  const dauer = {
    id: 'd1', bezeichnung: 'Miete', art: 'ausgabe', betrag: 120000, kategorieId: 'kat_wohnen',
    person: 'gemeinsam', tagImMonat: 1, intervall: 'monatlich', startMonat: '2026-01', endMonat: null, aktiv: true
  };
  const daten = datenMit([], [dauer]);
  daten.ausgeblendet = ['d1|2026-09'];
  assert.equal(model.faelligeBuchungen(daten, '2026-09').length, 0);
  assert.equal(model.faelligeBuchungen(daten, '2026-10').length, 1, 'andere Monate bleiben unberuehrt');
});

test('Quartals- und Jahresrhythmus zählen ab dem Startmonat', () => {
  const jaehrlich = {
    id: 'd2', bezeichnung: 'Hausrat', art: 'ausgabe', betrag: 60000, kategorieId: 'kat_versicherung',
    person: 'gemeinsam', tagImMonat: 10, intervall: 'jaehrlich', startMonat: '2026-03', endMonat: null, aktiv: true
  };
  assert.equal(model.dauerauftragFaelligIm(jaehrlich, '2026-03'), true);
  assert.equal(model.dauerauftragFaelligIm(jaehrlich, '2027-03'), true);
  assert.equal(model.dauerauftragFaelligIm(jaehrlich, '2027-01'), false);
  assert.equal(model.dauerauftragFaelligIm(jaehrlich, '2026-02'), false, 'vor dem Startmonat');

  const quartal = Object.assign({}, jaehrlich, { intervall: 'vierteljaehrlich' });
  assert.equal(model.dauerauftragFaelligIm(quartal, '2026-06'), true);
  assert.equal(model.dauerauftragFaelligIm(quartal, '2026-07'), false);

  const beendet = Object.assign({}, jaehrlich, { endMonat: '2026-12' });
  assert.equal(model.dauerauftragFaelligIm(beendet, '2027-03'), false);

  const inaktiv = Object.assign({}, jaehrlich, { aktiv: false });
  assert.equal(model.dauerauftragFaelligIm(inaktiv, '2026-03'), false);
});

test('Fixkosten legen Quartals- und Jahresbeiträge auf den Monat um', () => {
  const daten = datenMit([], [
    { id: 'd1', bezeichnung: 'Miete', art: 'ausgabe', betrag: 100000, intervall: 'monatlich', startMonat: '2026-01', aktiv: true },
    { id: 'd2', bezeichnung: 'Hausrat', art: 'ausgabe', betrag: 60000, intervall: 'jaehrlich', startMonat: '2026-01', aktiv: true },
    { id: 'd3', bezeichnung: 'Alt', art: 'ausgabe', betrag: 99999, intervall: 'monatlich', startMonat: '2026-01', aktiv: false }
  ]);
  assert.equal(model.fixkostenProMonat(daten), 105000, '1000 € + 600 €/12');
});

test('Export und Import ergeben denselben Stand', () => {
  const daten = datenMit(
    [buchung('2026-09-01', 'ausgabe', 12345, { notiz: 'REWE Großeinkauf' })],
    [{ id: 'd1', bezeichnung: 'Strom', art: 'ausgabe', betrag: 8900, kategorieId: 'kat_wohnen', person: 'gemeinsam', tagImMonat: 5, intervall: 'monatlich', startMonat: '2026-01', endMonat: null, aktiv: true }]
  );
  /* Gegen den normalisierten Stand vergleichen: beim Laden werden fehlende
     Felder wie die Zeitstempel für den Abgleich ergänzt. */
  const normalisiert = store.migrieren(daten);
  const ergebnis = store.importJson(store.exportJson(normalisiert));
  assert.equal(ergebnis.ok, true);
  assert.deepEqual(ergebnis.daten, normalisiert);
});

test('Kaputte oder fremde Dateien werden abgewiesen, nicht übernommen', () => {
  assert.equal(store.importJson('{nicht json').ok, false);
  assert.equal(store.importJson('{"foo":1}').ok, false);
  assert.match(store.importJson('{"foo":1}').fehler, /Backup/);
});

test('Unvollständige Datensätze werden repariert statt verworfen', () => {
  const repariert = store.migrieren({
    buchungen: [
      { datum: '2026-09-01', betrag: -5000, art: 'quatsch' },
      { betrag: 100 },
      null
    ]
  });
  assert.equal(repariert.buchungen.length, 1, 'nur die Buchung mit Datum bleibt');
  assert.equal(repariert.buchungen[0].betrag, 5000, 'Beträge sind immer positiv');
  assert.equal(repariert.buchungen[0].art, 'ausgabe');
  assert.equal(repariert.buchungen[0].person, 'gemeinsam');
  assert.equal(repariert.kategorien.length, 10, 'Standardkategorien werden ergänzt');
});
