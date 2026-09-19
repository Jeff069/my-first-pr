/* Anbindung an Supabase: Anmeldung, Laden und Speichern des gemeinsamen Standes.
   Bewusst über fetch statt über eine Bibliothek - kein CDN, keine zusätzliche
   Abhängigkeit, die Seite bleibt eine Handvoll eigener Dateien. */
(function (global) {
  'use strict';

  var konfig = global.HB.konfig || {};
  var SITZUNG = 'hb.sitzung.v1';
  var TABELLE = 'haushalte';

  function eingerichtet() {
    return !!(konfig.url && konfig.schluessel);
  }

  function sitzungLesen() {
    try {
      return JSON.parse(global.localStorage.getItem(SITZUNG));
    } catch (e) {
      return null;
    }
  }

  function sitzungSchreiben(sitzung) {
    try {
      if (sitzung) global.localStorage.setItem(SITZUNG, JSON.stringify(sitzung));
      else global.localStorage.removeItem(SITZUNG);
    } catch (e) { /* ohne Speicher gilt die Anmeldung nur für diesen Besuch */ }
  }

  var sitzung = sitzungLesen();

  function angemeldet() {
    return !!(sitzung && sitzung.access_token);
  }

  function benutzer() {
    return sitzung && sitzung.user && sitzung.user.email ? sitzung.user.email : null;
  }

  function kopf(mitToken, zusatz) {
    var h = { apikey: konfig.schluessel, 'Content-Type': 'application/json' };
    if (mitToken && sitzung) h.Authorization = 'Bearer ' + sitzung.access_token;
    return Object.assign(h, zusatz || {});
  }

  async function fehlerText(antwort) {
    try {
      var koerper = await antwort.json();
      return koerper.error_description || koerper.msg || koerper.message || ('Fehler ' + antwort.status);
    } catch (e) {
      return 'Fehler ' + antwort.status;
    }
  }

  async function anmelden(email, passwort) {
    var antwort = await fetch(konfig.url + '/auth/v1/token?grant_type=password', {
      method: 'POST',
      headers: kopf(false),
      body: JSON.stringify({ email: email, password: passwort })
    });
    if (!antwort.ok) throw new Error(await fehlerText(antwort));

    sitzung = await antwort.json();
    sitzungSchreiben(sitzung);
    return benutzer();
  }

  function abmelden() {
    sitzung = null;
    sitzungSchreiben(null);
  }

  /* Der Zugangsschlüssel läuft nach einer Stunde ab; dann still erneuern. */
  async function erneuern() {
    if (!sitzung || !sitzung.refresh_token) return false;
    var antwort = await fetch(konfig.url + '/auth/v1/token?grant_type=refresh_token', {
      method: 'POST',
      headers: kopf(false),
      body: JSON.stringify({ refresh_token: sitzung.refresh_token })
    });
    if (!antwort.ok) {
      abmelden();
      return false;
    }
    sitzung = await antwort.json();
    sitzungSchreiben(sitzung);
    return true;
  }

  async function anfrage(pfad, optionen, zweiterVersuch) {
    var einstellungen = Object.assign({}, optionen, { headers: kopf(true, optionen.zusatzKopf) });
    delete einstellungen.zusatzKopf;
    var antwort = await fetch(konfig.url + pfad, einstellungen);
    if (antwort.status === 401 && !zweiterVersuch && await erneuern()) {
      return anfrage(pfad, optionen, true);
    }
    return antwort;
  }

  async function holen() {
    var antwort = await anfrage(
      '/rest/v1/' + TABELLE + '?id=eq.' + encodeURIComponent(konfig.haushalt) + '&select=daten,aktualisiert',
      { method: 'GET' }
    );
    if (!antwort.ok) throw new Error(await fehlerText(antwort));

    var zeilen = await antwort.json();
    if (!zeilen.length) return null;
    return zeilen[0].daten;
  }

  async function sichern(daten) {
    var antwort = await anfrage('/rest/v1/' + TABELLE, {
      method: 'POST',
      /* Vorhandenen Datensatz ersetzen statt an einem doppelten Schlüssel zu scheitern. */
      zusatzKopf: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({
        id: konfig.haushalt,
        daten: daten,
        aktualisiert: new Date().toISOString()
      })
    });
    if (!antwort.ok) throw new Error(await fehlerText(antwort));
  }

  var api = {
    eingerichtet: eingerichtet,
    angemeldet: angemeldet,
    benutzer: benutzer,
    anmelden: anmelden,
    abmelden: abmelden,
    holen: holen,
    sichern: sichern
  };

  global.HB = global.HB || {};
  global.HB.wolke = api;
})(window);
