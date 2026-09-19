/* Zusammenführen zweier Stände - der Kern der Synchronisierung.
   Reine Logik, kein DOM, kein Netz: genau deshalb unter Node testbar.

   Grundregeln:
   - Jeder Eintrag trägt einen Zeitstempel `geaendert`. Bei zwei Fassungen
     gewinnt die jüngere.
   - Gelöschtes hinterlässt einen Grabstein (`geloescht`), sonst käme ein
     Eintrag beim nächsten Abgleich vom anderen Gerät zurück.
   - Wird ein gelöschter Eintrag später wieder bearbeitet, gewinnt die
     Bearbeitung - deshalb vergleichen Grabstein und Eintrag ihre Zeiten. */
(function (global) {
  'use strict';

  function jetzt() {
    return new Date().toISOString();
  }

  /* Grabsteine älter als ein halbes Jahr verschwinden - sonst wächst die Liste ewig. */
  function grabsteineAufraeumen(liste, stichtag) {
    var grenze = stichtag || new Date(Date.now() - 183 * 24 * 3600 * 1000).toISOString();
    return (liste || []).filter(function (e) {
      return e && e.id && e.zeit && e.zeit > grenze;
    });
  }

  function grabsteineSammeln(a, b) {
    var neueste = {};
    (a || []).concat(b || []).forEach(function (e) {
      if (!e || !e.id) return;
      var zeit = e.zeit || '';
      if (!neueste[e.id] || neueste[e.id] < zeit) neueste[e.id] = zeit;
    });
    return neueste;
  }

  function listeMischen(lokal, fern, grabsteine) {
    var nachId = {};
    (lokal || []).concat(fern || []).forEach(function (eintrag) {
      if (!eintrag || !eintrag.id) return;
      var bisher = nachId[eintrag.id];
      if (!bisher || (eintrag.geaendert || '') >= (bisher.geaendert || '')) {
        nachId[eintrag.id] = eintrag;
      }
    });

    return Object.keys(nachId).filter(function (id) {
      var grab = grabsteine[id];
      /* Gelöscht bleibt gelöscht, solange danach nichts mehr bearbeitet wurde. */
      return !(grab && grab >= (nachId[id].geaendert || ''));
    }).map(function (id) {
      return nachId[id];
    });
  }

  function neuer(a, b) {
    return (a || '') >= (b || '') ? a : b;
  }

  /* Führt zwei vollständige Stände zusammen. Das Ergebnis ist von der
     Reihenfolge unabhängig: mischen(a, b) und mischen(b, a) liefern dasselbe. */
  function staendeMischen(lokal, fern) {
    if (!fern) return lokal;
    if (!lokal) return fern;

    var grabsteine = grabsteineSammeln(lokal.geloescht, fern.geloescht);
    var einstellungenNeuer = (fern.einstellungen && fern.einstellungen.geaendert || '')
      > (lokal.einstellungen && lokal.einstellungen.geaendert || '');

    var vereinteGrabsteine = Object.keys(grabsteine).map(function (id) {
      return { id: id, zeit: grabsteine[id] };
    });

    var ausgeblendet = {};
    (lokal.ausgeblendet || []).concat(fern.ausgeblendet || []).forEach(function (e) {
      if (typeof e === 'string') ausgeblendet[e] = true;
    });

    return {
      version: lokal.version || fern.version,
      einstellungen: einstellungenNeuer ? fern.einstellungen : lokal.einstellungen,
      kategorien: listeMischen(lokal.kategorien, fern.kategorien, grabsteine),
      buchungen: listeMischen(lokal.buchungen, fern.buchungen, grabsteine),
      dauerauftraege: listeMischen(lokal.dauerauftraege, fern.dauerauftraege, grabsteine),
      ausgeblendet: Object.keys(ausgeblendet),
      geloescht: grabsteineAufraeumen(vereinteGrabsteine),
      aktualisiert: neuer(lokal.aktualisiert, fern.aktualisiert)
    };
  }

  var api = {
    jetzt: jetzt,
    staendeMischen: staendeMischen,
    listeMischen: listeMischen,
    grabsteineAufraeumen: grabsteineAufraeumen
  };

  global.HB = global.HB || {};
  global.HB.merge = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
