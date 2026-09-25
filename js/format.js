/* Formatierung und Eingabe-Parsing. Kein DOM-Zugriff, damit unter Node testbar. */
(function (global) {
  'use strict';

  var eurFormat = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });
  var eurGanzFormat = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
  var monatFormat = new Intl.DateTimeFormat('de-DE', { month: 'long', year: 'numeric' });
  var datumFormat = new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });

  /* Beträge liegen überall als ganzzahlige Cent vor und werden erst hier zu Euro. */
  function eur(cent) {
    return eurFormat.format((Number(cent) || 0) / 100);
  }

  /* Für Achsen: "2.000 €" statt "2.000,00 €" - dort zählen runde Werte, nicht Cent. */
  function eurGanz(cent) {
    return eurGanzFormat.format((Number(cent) || 0) / 100);
  }

  function prozent(wert) {
    return (Math.round((Number(wert) || 0) * 10) / 10).toLocaleString('de-DE') + ' %';
  }

  /* Akzeptiert "12,50", "1.234,56", "1234.56", "1 234,56 €" und Zahlen. null = unlesbar. */
  function parseBetrag(eingabe) {
    if (typeof eingabe === 'number') {
      return isFinite(eingabe) ? Math.round(eingabe * 100) : null;
    }
    var text = String(eingabe == null ? '' : eingabe).trim().replace(/[\s €]/g, '');
    if (!text) return null;

    var negativ = text.charAt(0) === '-';
    text = text.replace(/^[-+]/, '');
    if (!/^[0-9]+([.,][0-9]+)*$/.test(text)) return null;

    if (text.indexOf(',') !== -1) {
      /* Komma vorhanden -> Komma ist der Dezimaltrenner, Punkte sind Tausenderpunkte. */
      text = text.replace(/\./g, '');
      var ersteKomma = text.indexOf(',');
      text = text.slice(0, ersteKomma) + '.' + text.slice(ersteKomma + 1).replace(/,/g, '');
    } else {
      /* Nur Punkte: mehrere Punkte oder genau drei Nachkommastellen -> Tausenderpunkte. */
      var teile = text.split('.');
      if (teile.length > 2 || (teile.length === 2 && teile[1].length === 3)) {
        text = teile.join('');
      }
    }

    var zahl = Number(text);
    if (!isFinite(zahl)) return null;
    var cent = Math.round(zahl * 100);
    return negativ ? -cent : cent;
  }

  /* "2026-09-14" -> "14.09.2026" */
  function datum(iso) {
    var teile = String(iso || '').split('-');
    if (teile.length !== 3) return String(iso || '');
    return datumFormat.format(new Date(Number(teile[0]), Number(teile[1]) - 1, Number(teile[2])));
  }

  /* "2026-09" -> "September 2026" */
  function monatLabel(monat) {
    var teile = String(monat || '').split('-');
    if (teile.length < 2) return String(monat || '');
    return monatFormat.format(new Date(Number(teile[0]), Number(teile[1]) - 1, 1));
  }

  function padZwei(zahl) {
    return (zahl < 10 ? '0' : '') + zahl;
  }

  /* Lokales Datum, nicht UTC: toISOString() würde abends einen Tag zurückspringen. */
  function heuteIso(jetzt) {
    var d = jetzt || new Date();
    return d.getFullYear() + '-' + padZwei(d.getMonth() + 1) + '-' + padZwei(d.getDate());
  }

  var api = {
    eur: eur,
    eurGanz: eurGanz,
    prozent: prozent,
    parseBetrag: parseBetrag,
    datum: datum,
    monatLabel: monatLabel,
    padZwei: padZwei,
    heuteIso: heuteIso
  };

  global.HB = global.HB || {};
  global.HB.format = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
