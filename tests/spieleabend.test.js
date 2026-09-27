/* Tests für die Spiellogik des Spieleabends. */
const test = require('node:test');
const assert = require('node:assert/strict');

const logik = require('../spieleabend/logik.js');
const woerter = require('../spieleabend/woerter.js');

/* Reproduzierbarer Zufall. */
function zufallAus(seed) {
  let s = seed >>> 0;
  return function () {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

test('mischen behält alle Elemente und ändert das Original nicht', () => {
  const liste = [1, 2, 3, 4, 5, 6];
  const gemischt = logik.mischen(liste, zufallAus(1));
  assert.deepEqual(liste, [1, 2, 3, 4, 5, 6]);
  assert.deepEqual(gemischt.slice().sort(), liste);
});

test('stapel zieht jede Karte einmal, bevor sich etwas wiederholt', () => {
  const s = logik.stapel(['a', 'b', 'c', 'd'], zufallAus(7));
  const erste = [s.ziehen(), s.ziehen(), s.ziehen(), s.ziehen()];
  assert.deepEqual(erste.slice().sort(), ['a', 'b', 'c', 'd']);
});

test('stapel legt nach dem Neumischen nicht dieselbe Karte zweimal hintereinander', () => {
  for (let seed = 1; seed < 200; seed++) {
    const s = logik.stapel(['a', 'b', 'c'], zufallAus(seed));
    let vorher = null;
    for (let i = 0; i < 30; i++) {
      const karte = s.ziehen();
      assert.notEqual(karte, vorher, `Seed ${seed}, Zug ${i}`);
      vorher = karte;
    }
  }
});

test('imposterRunde: genau die gewünschte Zahl Imposter, Wort aus der Kategorie', () => {
  const spieler = ['Ali', 'Bea', 'Can', 'Dana', 'Emil'];
  for (let seed = 1; seed < 100; seed++) {
    const runde = logik.imposterRunde(spieler, woerter.imposter, { imposter: 2 }, zufallAus(seed));
    assert.equal(runde.rollen.filter((r) => r.imposter).length, 2);
    assert.ok(woerter.imposter[runde.kategorie].includes(runde.wort));
    assert.ok(spieler.includes(runde.starter));
    assert.deepEqual(runde.rollen.map((r) => r.name), spieler);
  }
});

test('imposterRunde: nie mehr Imposter als Spieler minus zwei', () => {
  const runde = logik.imposterRunde(['A', 'B', 'C'], woerter.imposter, { imposter: 3 }, zufallAus(3));
  assert.equal(runde.rollen.filter((r) => r.imposter).length, 1);
});

test('imposterRunde: hält sich an die gewählten Kategorien', () => {
  for (let seed = 1; seed < 50; seed++) {
    const runde = logik.imposterRunde(['A', 'B', 'C'], woerter.imposter, { kategorien: ['Tiere'] }, zufallAus(seed));
    assert.equal(runde.kategorie, 'Tiere');
  }
});

test('imposterRunde: unter drei Spielern gibt es einen Fehler', () => {
  assert.throws(() => logik.imposterRunde(['A', 'B'], woerter.imposter, {}, Math.random));
});

test('bombenZeit liegt im Rahmen', () => {
  const z = zufallAus(9);
  for (let i = 0; i < 100; i++) {
    const ms = logik.bombenZeit(z, 20, 40);
    assert.ok(ms >= 20000 && ms <= 40000, String(ms));
  }
});

test('tickAbstand wird zum Ende hin kürzer', () => {
  assert.ok(logik.tickAbstand(0, 1000) > logik.tickAbstand(900, 1000));
  assert.equal(logik.tickAbstand(5000, 1000), logik.tickAbstand(1000, 1000));
});

test('neigung: nach unten richtig, nach oben weiter, erst wieder nach der Mitte', () => {
  let r = logik.neigung(-9, true, false);
  assert.equal(r.ereignis, 'richtig');
  r = logik.neigung(-9, r.bereit, false);
  assert.equal(r.ereignis, null, 'hält man weiter nach unten, zählt es nicht nochmal');
  r = logik.neigung(0.5, r.bereit, false);
  assert.equal(r.bereit, true);
  r = logik.neigung(9, r.bereit, false);
  assert.equal(r.ereignis, 'weiter');
  assert.equal(logik.neigung(9, true, true).ereignis, 'richtig', 'umgekehrt tauscht die Richtung');
});

test('reflexTipp: zu früh kostet einen Punkt, aber nicht unter null', () => {
  let r = logik.reflexTipp([0, 2], 0, 'warten');
  assert.deepEqual(r.punkte, [0, 2]);
  assert.equal(r.ergebnis, 'frueh');
  r = logik.reflexTipp([0, 2], 1, 'warten');
  assert.deepEqual(r.punkte, [0, 1]);
  r = logik.reflexTipp([0, 2], 1, 'los');
  assert.deepEqual(r.punkte, [0, 3]);
  assert.equal(logik.reflexSieger(r.punkte, 3), 1);
  assert.equal(logik.reflexSieger([1, 2], 3), -1);
});

test('spielerBereinigen entfernt Leere und nummeriert Doppelte', () => {
  assert.deepEqual(logik.spielerBereinigen([' Lea ', '', 'lea', 'Tom', null]), ['Lea', 'lea 2', 'Tom']);
});

test('Wortlisten sind nicht leer und ohne Dopplungen je Kategorie', () => {
  for (const gruppe of [woerter.imposter, woerter.stirnraten, woerter.werEher]) {
    for (const [name, liste] of Object.entries(gruppe)) {
      assert.ok(liste.length >= 10, name);
      assert.equal(new Set(liste).size, liste.length, `Doppelt in ${name}`);
    }
  }
  assert.equal(new Set(woerter.bombe).size, woerter.bombe.length);
});
