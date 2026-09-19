/* Persistenz: die EINZIGE Stelle im Projekt mit localStorage-Zugriff.
   Für eine spätere Synchronisierung müsste nur diese Datei ausgetauscht werden. */
(function (global) {
  'use strict';

  var SCHLUESSEL = 'hb.daten.v1';
  var VERSION = 1;

  /* Fällt auf den Speicher im Arbeitsspeicher zurück, wenn localStorage fehlt
     (privater Modus, blockierte Website-Daten) - die App bleibt dann benutzbar. */
  var speicherVerfuegbar = (function () {
    try {
      var probe = '__hb_test__';
      global.localStorage.setItem(probe, '1');
      global.localStorage.removeItem(probe);
      return true;
    } catch (e) {
      return false;
    }
  })();
  var ersatzSpeicher = null;

  function neueId(praefix) {
    return praefix + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
  }

  /* `slot` verweist auf einen der acht gepruefeten Palettenplaetze (--serie-1..8 in styles.css).
     Kein freies Hex: die Plaetze sind auf Farbfehlsichtigkeit und Kontrast geprueft und haben
     je einen eigenen Wert fuer hellen und dunklen Hintergrund. */
  var SLOTS = 8;

  function standardKategorien() {
    return [
      { id: 'kat_wohnen', name: 'Wohnen & Miete', typ: 'ausgabe', slot: 1 },
      { id: 'kat_lebensmittel', name: 'Lebensmittel', typ: 'ausgabe', slot: 2 },
      { id: 'kat_mobilitaet', name: 'Auto & Mobilität', typ: 'ausgabe', slot: 3 },
      { id: 'kat_versicherung', name: 'Versicherungen', typ: 'ausgabe', slot: 4 },
      { id: 'kat_abos', name: 'Abos & Verträge', typ: 'ausgabe', slot: 5 },
      { id: 'kat_freizeit', name: 'Freizeit', typ: 'ausgabe', slot: 6 },
      { id: 'kat_gesundheit', name: 'Gesundheit', typ: 'ausgabe', slot: 7 },
      { id: 'kat_sonstiges', name: 'Sonstiges', typ: 'ausgabe', slot: 8 },
      { id: 'kat_gehalt', name: 'Gehalt', typ: 'einnahme', slot: 6 },
      { id: 'kat_sonstige_einnahme', name: 'Sonstige Einnahmen', typ: 'einnahme', slot: 3 }
    ];
  }

  function leereDaten() {
    return {
      version: VERSION,
      einstellungen: { personA: 'Ich', personB: 'Partnerin', startsaldo: 0 },
      kategorien: standardKategorien(),
      buchungen: [],
      dauerauftraege: [],
      /* Merkzettel für gelöschte Dauerauftrags-Buchungen ("dauerId|monat"),
         damit eine bewusst entfernte Buchung nicht beim nächsten Laden zurückkehrt. */
      ausgeblendet: []
    };
  }

  /* Repariert unvollständige oder ältere Stände, statt an ihnen zu scheitern. */
  function migrieren(roh) {
    var vorlage = leereDaten();
    if (!roh || typeof roh !== 'object') return vorlage;

    var daten = {
      version: VERSION,
      einstellungen: Object.assign({}, vorlage.einstellungen, roh.einstellungen || {}),
      kategorien: Array.isArray(roh.kategorien) && roh.kategorien.length
        ? roh.kategorien.filter(function (k) { return k && k.id; }).map(function (k) {
            return {
              id: k.id,
              name: k.name || 'Ohne Namen',
              typ: k.typ === 'einnahme' ? 'einnahme' : 'ausgabe',
              slot: Math.min(SLOTS, Math.max(1, parseInt(k.slot, 10) || 8))
            };
          })
        : vorlage.kategorien,
      buchungen: Array.isArray(roh.buchungen) ? roh.buchungen : [],
      dauerauftraege: Array.isArray(roh.dauerauftraege) ? roh.dauerauftraege : [],
      ausgeblendet: Array.isArray(roh.ausgeblendet) ? roh.ausgeblendet.filter(function (e) { return typeof e === 'string'; }) : []
    };

    daten.buchungen = daten.buchungen.filter(function (b) {
      return b && typeof b.datum === 'string' && isFinite(Number(b.betrag));
    }).map(function (b) {
      return {
        id: b.id || neueId('b'),
        datum: b.datum,
        art: b.art === 'einnahme' ? 'einnahme' : 'ausgabe',
        betrag: Math.abs(Math.round(Number(b.betrag))),
        kategorieId: b.kategorieId || null,
        notiz: typeof b.notiz === 'string' ? b.notiz : '',
        person: b.person === 'a' || b.person === 'b' ? b.person : 'gemeinsam',
        quelle: b.quelle && b.quelle.dauerId ? { dauerId: b.quelle.dauerId, monat: b.quelle.monat } : null
      };
    });

    daten.dauerauftraege = daten.dauerauftraege.filter(function (d) {
      return d && isFinite(Number(d.betrag));
    }).map(function (d) {
      return {
        id: d.id || neueId('d'),
        bezeichnung: d.bezeichnung || 'Ohne Namen',
        art: d.art === 'einnahme' ? 'einnahme' : 'ausgabe',
        betrag: Math.abs(Math.round(Number(d.betrag))),
        kategorieId: d.kategorieId || null,
        person: d.person === 'a' || d.person === 'b' ? d.person : 'gemeinsam',
        tagImMonat: Math.min(31, Math.max(1, parseInt(d.tagImMonat, 10) || 1)),
        intervall: d.intervall === 'vierteljaehrlich' || d.intervall === 'jaehrlich' ? d.intervall : 'monatlich',
        startMonat: d.startMonat || '2000-01',
        endMonat: d.endMonat || null,
        aktiv: d.aktiv !== false
      };
    });

    daten.einstellungen.startsaldo = Math.round(Number(daten.einstellungen.startsaldo) || 0);
    return daten;
  }

  function laden() {
    if (!speicherVerfuegbar) return ersatzSpeicher ? migrieren(ersatzSpeicher) : leereDaten();
    try {
      var roh = global.localStorage.getItem(SCHLUESSEL);
      if (!roh) return leereDaten();
      return migrieren(JSON.parse(roh));
    } catch (e) {
      /* Kaputter Stand darf die App nicht blockieren - lieber leer starten. */
      return leereDaten();
    }
  }

  function speichern(daten) {
    daten.version = VERSION;
    if (!speicherVerfuegbar) {
      ersatzSpeicher = JSON.parse(JSON.stringify(daten));
      return false;
    }
    try {
      global.localStorage.setItem(SCHLUESSEL, JSON.stringify(daten));
      return true;
    } catch (e) {
      return false;
    }
  }

  function alleLoeschen() {
    ersatzSpeicher = null;
    if (!speicherVerfuegbar) return;
    try {
      global.localStorage.removeItem(SCHLUESSEL);
    } catch (e) { /* nichts zu tun */ }
  }

  function exportJson(daten) {
    return JSON.stringify(daten, null, 2);
  }

  /* Gibt { ok, daten, fehler } zurück, damit die Oberfläche eine Vorschau zeigen kann,
     bevor der bestehende Stand überschrieben wird. */
  function importJson(text) {
    try {
      var roh = JSON.parse(text);
      if (!roh || typeof roh !== 'object' || (!Array.isArray(roh.buchungen) && !Array.isArray(roh.dauerauftraege))) {
        return { ok: false, fehler: 'Das sieht nicht nach einem Haushaltsbuch-Backup aus.' };
      }
      return { ok: true, daten: migrieren(roh) };
    } catch (e) {
      return { ok: false, fehler: 'Die Datei ist kein gültiges JSON.' };
    }
  }

  var api = {
    SCHLUESSEL: SCHLUESSEL,
    VERSION: VERSION,
    SLOTS: SLOTS,
    neueId: neueId,
    leereDaten: leereDaten,
    standardKategorien: standardKategorien,
    migrieren: migrieren,
    laden: laden,
    speichern: speichern,
    alleLoeschen: alleLoeschen,
    exportJson: exportJson,
    importJson: importJson,
    speicherVerfuegbar: speicherVerfuegbar
  };

  global.HB = global.HB || {};
  global.HB.store = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
