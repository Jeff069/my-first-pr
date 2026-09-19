/* Eine einzelne Buchung verschicken - über WhatsApp, SMS, Mail, egal.
   Die Buchung steckt im Link selbst; es gibt keinen Server, der etwas
   zwischenspeichert. Wer den Link öffnet, bekommt sie zum Übernehmen angeboten.

   Reine Umwandlung, kein DOM: unter Node testbar. */
(function (global) {
  'use strict';

  var MARKE = '#teilen=';

  /* Base64 in der URL-Variante: ohne +, / und = , damit nichts am Link zerbricht. */
  function kodieren(objekt) {
    var bytes = new TextEncoder().encode(JSON.stringify(objekt));
    var roh = '';
    for (var i = 0; i < bytes.length; i++) roh += String.fromCharCode(bytes[i]);
    return btoa(roh).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function dekodieren(text) {
    try {
      var base = String(text).replace(/-/g, '+').replace(/_/g, '/');
      while (base.length % 4) base += '=';
      var roh = atob(base);
      var bytes = new Uint8Array(roh.length);
      for (var i = 0; i < roh.length; i++) bytes[i] = roh.charCodeAt(i);
      return JSON.parse(new TextDecoder().decode(bytes));
    } catch (e) {
      return null;
    }
  }

  /* Was aus einem Link kommt, ist fremde Eingabe: erst prüfen, dann übernehmen. */
  function pruefen(inhalt) {
    if (!inhalt || typeof inhalt !== 'object') return null;
    var b = inhalt.b;
    if (!b || typeof b !== 'object') return null;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(b.datum || '')) return null;

    var betrag = Math.round(Number(b.betrag));
    if (!isFinite(betrag) || betrag <= 0) return null;

    var buchung = {
      id: typeof b.id === 'string' && b.id ? b.id.slice(0, 64) : null,
      datum: b.datum,
      art: b.art === 'einnahme' ? 'einnahme' : 'ausgabe',
      betrag: betrag,
      kategorieId: typeof b.kategorieId === 'string' ? b.kategorieId.slice(0, 64) : null,
      notiz: typeof b.notiz === 'string' ? b.notiz.slice(0, 200) : '',
      person: b.person === 'a' || b.person === 'b' ? b.person : 'gemeinsam',
      quelle: null
    };
    if (!buchung.id) return null;

    var kategorie = null;
    if (inhalt.k && typeof inhalt.k === 'object' && typeof inhalt.k.id === 'string') {
      kategorie = {
        id: inhalt.k.id.slice(0, 64),
        name: String(inhalt.k.name || 'Geteilt').slice(0, 60),
        typ: inhalt.k.typ === 'einnahme' ? 'einnahme' : 'ausgabe',
        slot: Math.min(8, Math.max(1, parseInt(inhalt.k.slot, 10) || 8))
      };
    }

    return { buchung: buchung, kategorie: kategorie };
  }

  function paket(buchung, kategorie) {
    return {
      b: {
        id: buchung.id,
        datum: buchung.datum,
        art: buchung.art,
        betrag: buchung.betrag,
        kategorieId: buchung.kategorieId,
        notiz: buchung.notiz,
        person: buchung.person
      },
      k: kategorie ? { id: kategorie.id, name: kategorie.name, typ: kategorie.typ, slot: kategorie.slot } : null
    };
  }

  function linkFuer(buchung, kategorie, basis) {
    var adresse = String(basis || '').split('#')[0];
    return adresse + MARKE + kodieren(paket(buchung, kategorie));
  }

  /* Liest den Anhang aus einer Adresse; null, wenn keiner da ist. */
  function ausAdresse(adresse) {
    var stelle = String(adresse || '').indexOf(MARKE);
    if (stelle === -1) return null;
    return pruefen(dekodieren(String(adresse).slice(stelle + MARKE.length)));
  }

  var api = {
    MARKE: MARKE,
    kodieren: kodieren,
    dekodieren: dekodieren,
    pruefen: pruefen,
    paket: paket,
    linkFuer: linkFuer,
    ausAdresse: ausAdresse
  };

  global.HB = global.HB || {};
  global.HB.teilen = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
