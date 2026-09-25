/* Reine Auswertungslogik: nimmt Daten, gibt Zahlen zurück. Kein DOM, kein Speicher.
   Genau deshalb ist alles hier mit `node --test` prüfbar. */
(function (global) {
  'use strict';

  var format = (typeof require !== 'undefined' && typeof module !== 'undefined')
    ? require('./format.js')
    : global.HB.format;

  var INTERVALL_SCHRITT = { monatlich: 1, vierteljaehrlich: 3, jaehrlich: 12 };

  function monatVon(datumIso) {
    return String(datumIso || '').slice(0, 7);
  }

  function tageImMonat(monat) {
    var t = String(monat).split('-');
    return new Date(Number(t[0]), Number(t[1]), 0).getDate();
  }

  function monatPlus(monat, versatz) {
    var t = String(monat).split('-');
    var index = Number(t[0]) * 12 + (Number(t[1]) - 1) + versatz;
    return Math.floor(index / 12) + '-' + format.padZwei((index % 12) + 1);
  }

  function monatsDifferenz(von, bis) {
    var a = String(von).split('-');
    var b = String(bis).split('-');
    return (Number(b[0]) - Number(a[0])) * 12 + (Number(b[1]) - Number(a[1]));
  }

  function buchungenImMonat(daten, monat) {
    return (daten.buchungen || []).filter(function (b) {
      return monatVon(b.datum) === monat;
    });
  }

  function summe(liste) {
    return liste.reduce(function (s, b) { return s + b.betrag; }, 0);
  }

  /* Buchungen mit Datum <= heute gelten als gebucht, spätere als geplant.
     Daraus entsteht die Aussage "so viel geht diesen Monat noch ab". */
  function monatsUebersicht(daten, monat, heute) {
    var stichtag = heute || format.heuteIso();
    var imMonat = buchungenImMonat(daten, monat);
    var einnahmenListe = imMonat.filter(function (b) { return b.art === 'einnahme'; });
    var ausgabenListe = imMonat.filter(function (b) { return b.art === 'ausgabe'; });
    var geplanteAusgaben = ausgabenListe.filter(function (b) { return b.datum > stichtag; });

    var einnahmen = summe(einnahmenListe);
    var ausgaben = summe(ausgabenListe);
    var saldo = einnahmen - ausgaben;

    return {
      monat: monat,
      einnahmen: einnahmen,
      ausgaben: ausgaben,
      saldo: saldo,
      /* Ohne Einnahmen gibt es keine sinnvolle Quote - 0 statt Division durch null. */
      sparquote: einnahmen > 0 ? Math.round((saldo / einnahmen) * 1000) / 10 : 0,
      gebuchteAusgaben: ausgaben - summe(geplanteAusgaben),
      geplanteAusgaben: summe(geplanteAusgaben),
      geplanteBuchungen: geplanteAusgaben.slice().sort(function (a, b) {
        return a.datum < b.datum ? -1 : a.datum > b.datum ? 1 : 0;
      }),
      anzahl: imMonat.length
    };
  }

  function kategorieVon(daten, id) {
    var treffer = (daten.kategorien || []).filter(function (k) { return k.id === id; })[0];
    return treffer || { id: null, name: 'Ohne Kategorie', slot: 0, emoji: '🏷️' };
  }

  /* Absteigend sortiert: die größten Posten zuerst - das ist die Frage dahinter. */
  function nachKategorie(daten, monat, art) {
    var typ = art || 'ausgabe';
    var relevant = buchungenImMonat(daten, monat).filter(function (b) { return b.art === typ; });
    var gesamt = summe(relevant);
    var nachId = {};

    relevant.forEach(function (b) {
      var schluessel = b.kategorieId || '__ohne__';
      if (!nachId[schluessel]) {
        var kat = kategorieVon(daten, b.kategorieId);
        nachId[schluessel] = { kategorieId: b.kategorieId || null, name: kat.name, slot: kat.slot || 0, emoji: kat.emoji || '🏷️', betrag: 0, anzahl: 0 };
      }
      nachId[schluessel].betrag += b.betrag;
      nachId[schluessel].anzahl += 1;
    });

    return Object.keys(nachId).map(function (k) {
      var eintrag = nachId[k];
      eintrag.anteil = gesamt > 0 ? Math.round((eintrag.betrag / gesamt) * 1000) / 10 : 0;
      return eintrag;
    }).sort(function (a, b) { return b.betrag - a.betrag; });
  }

  /* Gemeinsame Buchungen werden eigens ausgewiesen, nicht stillschweigend halbiert. */
  function nachPerson(daten, monat, art) {
    var typ = art || 'ausgabe';
    var relevant = buchungenImMonat(daten, monat).filter(function (b) { return b.art === typ; });
    var e = daten.einstellungen || {};
    var gesamt = summe(relevant);

    return [
      { person: 'a', name: e.personA || 'Ich' },
      { person: 'b', name: e.personB || 'Partnerin' },
      { person: 'gemeinsam', name: 'Gemeinsam' }
    ].map(function (eintrag) {
      eintrag.betrag = summe(relevant.filter(function (b) { return b.person === eintrag.person; }));
      eintrag.anteil = gesamt > 0 ? Math.round((eintrag.betrag / gesamt) * 1000) / 10 : 0;
      return eintrag;
    });
  }

  function monatsVerlauf(daten, bisMonat, anzahl) {
    var n = anzahl || 6;
    var reihe = [];
    for (var i = n - 1; i >= 0; i--) {
      var monat = monatPlus(bisMonat, -i);
      var u = monatsUebersicht(daten, monat, '9999-12-31');
      reihe.push({ monat: monat, einnahmen: u.einnahmen, ausgaben: u.ausgaben, saldo: u.saldo });
    }
    return reihe;
  }

  /* „Für wen ist die Ausgabe?“ - eine Regel für alte und neue Daten. Aus dem
     gemeinsamen Topf streckt keiner vor, deshalb dort immer 'beide'; fehlt das
     Feld bei a/b, ist es die eigene Sache (alte Buchungen erzeugen keine Schulden). */
  function fuerVon(eintrag) {
    var e = eintrag || {};
    if (e.person !== 'a' && e.person !== 'b') return 'beide';
    if (e.fuer === 'a' || e.fuer === 'b' || e.fuer === 'beide') return e.fuer;
    return e.person;
  }

  /* Wer hat für den anderen ausgelegt, und wer gibt wem am Ende etwas zurück?
     Zählt nur bereits Bezahltes (datum <= heute), immer halbe-halbe. Gerundet
     wird je Posten, damit die Liste exakt auf die Kennzahl aufgeht. */
  function ausgleich(daten, monat, heute) {
    var stichtag = heute || format.heuteIso();
    var bezahltFuerAnderen = { a: 0, b: 0 };

    var posten = buchungenImMonat(daten, monat).filter(function (b) {
      return b.art === 'ausgabe' && b.datum <= stichtag
        && (b.person === 'a' || b.person === 'b') && fuerVon(b) !== b.person;
    }).sort(function (a, b) {
      return a.datum < b.datum ? -1 : a.datum > b.datum ? 1 : 0;
    }).map(function (b) {
      var fuer = fuerVon(b);
      var anteil = fuer === 'beide' ? Math.round(b.betrag / 2) : b.betrag;
      bezahltFuerAnderen[b.person] += anteil;
      return {
        id: b.id,
        datum: b.datum,
        notiz: b.notiz,
        kategorieId: b.kategorieId,
        betrag: b.betrag,
        zahler: b.person,
        fuer: fuer,
        anteil: anteil
      };
    });

    var netto = bezahltFuerAnderen.a - bezahltFuerAnderen.b;
    return {
      betrag: Math.abs(netto),
      von: netto > 0 ? 'b' : netto < 0 ? 'a' : null,
      an: netto > 0 ? 'a' : netto < 0 ? 'b' : null,
      bezahltFuerAnderen: bezahltFuerAnderen,
      posten: posten
    };
  }

  function dauerauftragFaelligIm(dauer, monat) {
    if (!dauer.aktiv) return false;
    if (monat < dauer.startMonat) return false;
    if (dauer.endMonat && monat > dauer.endMonat) return false;
    var schritt = INTERVALL_SCHRITT[dauer.intervall] || 1;
    /* Quartal und Jahr zählen ab dem Startmonat, nicht ab Januar. */
    return monatsDifferenz(dauer.startMonat, monat) % schritt === 0;
  }

  /* Tag 31 gibt es nicht in jedem Monat - dann der letzte Tag, statt in den Folgemonat zu rutschen. */
  function buchungsDatum(monat, tagImMonat) {
    var tag = Math.min(tagImMonat, tageImMonat(monat));
    return monat + '-' + format.padZwei(tag);
  }

  /* Erzeugt die noch fehlenden Buchungen eines Monats. Idempotent über quelle.dauerId +
     quelle.monat: mehrfaches Aufrufen verdoppelt die Miete nicht. Bewusst gelöschte
     Buchungen stehen auf `ausgeblendet` und kommen ebenfalls nicht zurück. */
  function faelligeBuchungen(daten, monat) {
    var vorhanden = {};
    (daten.buchungen || []).forEach(function (b) {
      if (b.quelle && b.quelle.dauerId) vorhanden[b.quelle.dauerId + '|' + b.quelle.monat] = true;
    });
    (daten.ausgeblendet || []).forEach(function (schluessel) { vorhanden[schluessel] = true; });

    return (daten.dauerauftraege || []).filter(function (d) {
      return dauerauftragFaelligIm(d, monat) && !vorhanden[d.id + '|' + monat];
    }).map(function (d) {
      return {
        id: 'b_' + d.id + '_' + monat,
        datum: buchungsDatum(monat, d.tagImMonat),
        art: d.art,
        betrag: d.betrag,
        kategorieId: d.kategorieId,
        notiz: d.bezeichnung,
        person: d.person,
        /* Klassiker: Miete geht von einem Konto ab, ist aber für beide. */
        fuer: fuerVon(d),
        quelle: { dauerId: d.id, monat: monat }
      };
    });
  }

  /* Jahresbeiträge anteilig umgelegt (600 €/Jahr = 50 €/Monat), sonst lügt die Monatssicht. */
  function fixkostenProMonat(daten, art) {
    var typ = art || 'ausgabe';
    return (daten.dauerauftraege || []).filter(function (d) {
      return d.aktiv && d.art === typ;
    }).reduce(function (s, d) {
      return s + Math.round(d.betrag / (INTERVALL_SCHRITT[d.intervall] || 1));
    }, 0);
  }

  var api = {
    monatVon: monatVon,
    tageImMonat: tageImMonat,
    monatPlus: monatPlus,
    monatsDifferenz: monatsDifferenz,
    buchungenImMonat: buchungenImMonat,
    monatsUebersicht: monatsUebersicht,
    kategorieVon: kategorieVon,
    nachKategorie: nachKategorie,
    nachPerson: nachPerson,
    monatsVerlauf: monatsVerlauf,
    fuerVon: fuerVon,
    ausgleich: ausgleich,
    dauerauftragFaelligIm: dauerauftragFaelligIm,
    buchungsDatum: buchungsDatum,
    faelligeBuchungen: faelligeBuchungen,
    fixkostenProMonat: fixkostenProMonat
  };

  global.HB = global.HB || {};
  global.HB.model = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
