/* Spiellogik ohne DOM – damit sie sich ohne Browser testen lässt.
   Zufall kommt immer über `zufall` (eine Funktion wie Math.random) herein. */
(function (global) {
  'use strict';

  function ganzzahl(zufall, max) {
    return Math.floor(zufall() * max);
  }

  /* Fisher-Yates auf einer Kopie. */
  function mischen(liste, zufall) {
    var kopie = liste.slice();
    for (var i = kopie.length - 1; i > 0; i--) {
      var j = ganzzahl(zufall, i + 1);
      var t = kopie[i]; kopie[i] = kopie[j]; kopie[j] = t;
    }
    return kopie;
  }

  /* Ein Stapel zieht ohne Wiederholung; ist er leer, wird neu gemischt –
     ohne dass die letzte Karte gleich wieder oben liegt. */
  function stapel(liste, zufall) {
    var rest = mischen(liste, zufall);
    var zuletzt = null;
    return {
      ziehen: function () {
        if (rest.length === 0) {
          rest = mischen(liste, zufall);
          if (rest.length > 1 && rest[rest.length - 1] === zuletzt) {
            rest.unshift(rest.pop());
          }
        }
        zuletzt = rest.pop();
        return zuletzt;
      },
      uebrig: function () { return rest.length; }
    };
  }

  /* Imposter: alle kennen das Wort, außer den Imposter(n).
     `kategorien` ist ein Objekt { Kategorie: [Wörter] }, `gewaehlt` die
     erlaubten Kategorien (leer = alle). */
  function imposterRunde(spieler, kategorien, optionen, zufall) {
    optionen = optionen || {};
    if (spieler.length < 3) throw new Error('Imposter braucht mindestens 3 Spieler');
    var anzahl = Math.max(1, Math.min(optionen.imposter || 1, spieler.length - 2));
    var erlaubt = (optionen.kategorien && optionen.kategorien.length)
      ? optionen.kategorien.filter(function (k) { return kategorien[k]; })
      : Object.keys(kategorien);
    if (erlaubt.length === 0) erlaubt = Object.keys(kategorien);

    var kategorie = erlaubt[ganzzahl(zufall, erlaubt.length)];
    var woerter = kategorien[kategorie];
    var wort = woerter[ganzzahl(zufall, woerter.length)];

    var indizes = mischen(spieler.map(function (_, i) { return i; }), zufall).slice(0, anzahl);
    var rollen = spieler.map(function (name, i) {
      return { name: name, imposter: indizes.indexOf(i) !== -1 };
    });
    return {
      kategorie: kategorie,
      wort: wort,
      rollen: rollen,
      starter: spieler[ganzzahl(zufall, spieler.length)]
    };
  }

  /* Bombe: versteckte Zündzeit in Millisekunden. */
  function bombenZeit(zufall, minSek, maxSek) {
    minSek = minSek || 25;
    maxSek = maxSek || 70;
    return Math.round((minSek + zufall() * (maxSek - minSek)) * 1000);
  }

  /* Tick-Abstand: wird schneller, je näher die Explosion rückt. */
  function tickAbstand(vergangen, gesamt) {
    var anteil = Math.min(1, Math.max(0, vergangen / gesamt));
    return Math.round(900 - anteil * 780);
  }

  /* Stirnraten per Neigen. `z` ist die Erdbeschleunigung senkrecht zum
     Display (accelerationIncludingGravity.z). Handy an der Stirn: z ≈ 0.
     Display zum Boden: stark negativ → richtig. Display zur Decke: stark
     positiv → weiter. Erst nach Rückkehr in die Mitte wird wieder scharf
     geschaltet, sonst zählt eine Bewegung mehrfach. */
  function neigung(z, bereit, umgekehrt) {
    var AUSLOESEN = 6.5, ZURUECK = 3;
    if (umgekehrt) z = -z;
    if (!bereit) {
      return { bereit: Math.abs(z) < ZURUECK, ereignis: null };
    }
    if (z < -AUSLOESEN) return { bereit: false, ereignis: 'richtig' };
    if (z > AUSLOESEN) return { bereit: false, ereignis: 'weiter' };
    return { bereit: true, ereignis: null };
  }

  /* Reflex-Duell: wer tippt, bevor es grün wird, bekommt einen Punkt Abzug;
     wer nach Grün als Erster tippt, bekommt einen Punkt. */
  function reflexTipp(punkte, spieler, phase) {
    var neu = punkte.slice();
    if (phase === 'warten') {
      neu[spieler] = Math.max(0, neu[spieler] - 1);
      return { punkte: neu, ergebnis: 'frueh' };
    }
    if (phase === 'los') {
      neu[spieler] += 1;
      return { punkte: neu, ergebnis: 'treffer' };
    }
    return { punkte: neu, ergebnis: null };
  }

  function reflexSieger(punkte, ziel) {
    for (var i = 0; i < punkte.length; i++) if (punkte[i] >= ziel) return i;
    return -1;
  }

  function reflexWartezeit(zufall) {
    return Math.round(1500 + zufall() * 3500);
  }

  /* Namen aufräumen: leere raus, doppelte durchnummerieren. */
  function spielerBereinigen(namen) {
    var gesehen = {};
    return namen.map(function (n) { return String(n || '').trim().slice(0, 20); })
      .filter(function (n) { return n.length > 0; })
      .map(function (n) {
        var schluessel = n.toLowerCase();
        if (!gesehen[schluessel]) { gesehen[schluessel] = 1; return n; }
        gesehen[schluessel] += 1;
        return n + ' ' + gesehen[schluessel];
      });
  }

  var api = {
    mischen: mischen,
    stapel: stapel,
    imposterRunde: imposterRunde,
    bombenZeit: bombenZeit,
    tickAbstand: tickAbstand,
    neigung: neigung,
    reflexTipp: reflexTipp,
    reflexSieger: reflexSieger,
    reflexWartezeit: reflexWartezeit,
    spielerBereinigen: spielerBereinigen
  };

  global.SA = global.SA || {};
  global.SA.logik = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
