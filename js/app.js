/* Oberfläche: Zustand, Ereignisse, Rendering. Gerechnet wird ausschließlich in model.js,
   gespeichert ausschließlich über store.js. */
(function (global) {
  'use strict';

  var format = global.HB.format;
  var store = global.HB.store;
  var model = global.HB.model;
  var charts = global.HB.charts;

  var daten = store.laden();
  var aktuellerMonat = format.heuteIso().slice(0, 7);
  var bearbeiteBuchung = null;
  var bearbeiteDauer = null;
  var importStand = null;

  function q(id) { return document.getElementById(id); }

  var wenigerBewegung = global.matchMedia
    ? global.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  /* Zahlen laufen beim Monatswechsel auf ihren neuen Wert zu - beim ersten Aufbau von null aus.
     Bei "weniger Bewegung" springt der Wert sofort. */
  var letzterStand = {};
  function zaehleHoch(el, ziel, darstellen) {
    var von = letzterStand[el.id] == null ? 0 : letzterStand[el.id];
    letzterStand[el.id] = ziel;

    if (wenigerBewegung || von === ziel) {
      el.textContent = darstellen(ziel);
      return;
    }

    var beginn = null;
    var dauer = 460;
    function schritt(jetzt) {
      if (beginn === null) beginn = jetzt;
      var t = Math.min(1, (jetzt - beginn) / dauer);
      var weich = 1 - Math.pow(1 - t, 3);
      el.textContent = darstellen(Math.round(von + (ziel - von) * weich));
      if (t < 1) requestAnimationFrame(schritt);
    }
    requestAnimationFrame(schritt);
  }

  function leeren(el) {
    while (el.firstChild) el.removeChild(el.firstChild);
  }

  function neu(tag, text, klasse) {
    var el = document.createElement(tag);
    if (text != null) el.textContent = text; /* nie innerHTML: alles hier ist Nutzereingabe */
    if (klasse) el.className = klasse;
    return el;
  }

  function sichern() {
    var erfolg = store.speichern(daten);
    var hinweis = q('speicherHinweis');
    hinweis.textContent = erfolg
      ? ''
      : 'Achtung: Dieser Browser speichert nichts dauerhaft (privates Fenster?). Bitte vor dem Schließen ein Backup exportieren.';
    hinweis.className = erfolg ? '' : 'fehler';
  }

  function personName(schluessel) {
    if (schluessel === 'a') return daten.einstellungen.personA || 'Ich';
    if (schluessel === 'b') return daten.einstellungen.personB || 'Partnerin';
    return 'Gemeinsam';
  }

  function option(wert, text) {
    var o = document.createElement('option');
    o.value = wert;
    o.textContent = text;
    return o;
  }

  function fuelleKategorien(select, typ, gewaehlt) {
    leeren(select);
    daten.kategorien.filter(function (k) { return !typ || k.typ === typ; })
      .forEach(function (k) { select.appendChild(option(k.id, k.name)); });
    if (gewaehlt) select.value = gewaehlt;
  }

  function fuellePersonen(select, mitAlle, gewaehlt) {
    leeren(select);
    if (mitAlle) select.appendChild(option('', 'Alle'));
    ['a', 'b', 'gemeinsam'].forEach(function (p) { select.appendChild(option(p, personName(p))); });
    select.value = gewaehlt || (mitAlle ? '' : 'gemeinsam');
  }

  /* ---------------- Tabs ---------------- */

  var tabs = Array.prototype.slice.call(document.querySelectorAll('[role="tab"]'));

  function indikatorSetzen() {
    var aktiv = tabs.filter(function (t) { return t.getAttribute('aria-selected') === 'true'; })[0];
    if (!aktiv) return;
    var strich = q('tabIndikator');
    strich.style.width = aktiv.offsetWidth + 'px';
    strich.style.transform = 'translateX(' + aktiv.offsetLeft + 'px)';
  }

  function tabWaehlen(ziel, fokussieren) {
    tabs.forEach(function (tab) {
      var aktiv = tab === ziel;
      tab.setAttribute('aria-selected', aktiv ? 'true' : 'false');
      tab.tabIndex = aktiv ? 0 : -1;
      q(tab.getAttribute('aria-controls')).hidden = !aktiv;
    });
    indikatorSetzen();
    if (fokussieren !== false) ziel.focus();
  }

  /* Nach Drehen oder Größenänderung passen Markierung und Diagramm sich an. */
  var neuZeichnen = null;
  global.addEventListener('resize', function () {
    indikatorSetzen();
    clearTimeout(neuZeichnen);
    neuZeichnen = setTimeout(zeigeUebersicht, 200);
  });

  tabs.forEach(function (tab, i) {
    tab.addEventListener('click', function () { tabWaehlen(tab, false); });
    tab.addEventListener('keydown', function (e) {
      var ziel = null;
      if (e.key === 'ArrowRight') ziel = tabs[(i + 1) % tabs.length];
      if (e.key === 'ArrowLeft') ziel = tabs[(i - 1 + tabs.length) % tabs.length];
      if (e.key === 'Home') ziel = tabs[0];
      if (e.key === 'End') ziel = tabs[tabs.length - 1];
      if (ziel) { e.preventDefault(); tabWaehlen(ziel); }
    });
  });

  /* ---------------- Monatswahl ---------------- */

  function monatSetzen(monat) {
    aktuellerMonat = monat;
    alleszeigen();
  }

  q('monatZurueck').addEventListener('click', function () { monatSetzen(model.monatPlus(aktuellerMonat, -1)); });
  q('monatVor').addEventListener('click', function () { monatSetzen(model.monatPlus(aktuellerMonat, 1)); });
  q('monatHeute').addEventListener('click', function () { monatSetzen(format.heuteIso().slice(0, 7)); });

  /* Fällige Daueraufträge nachtragen - aber nicht für Monate, die noch nicht begonnen haben. */
  function faelligesNachtragen(monat) {
    if (monat > format.heuteIso().slice(0, 7)) return;
    var neue = model.faelligeBuchungen(daten, monat);
    if (!neue.length) return;
    daten.buchungen = daten.buchungen.concat(neue);
    sichern();
  }

  /* ---------------- Übersicht ---------------- */

  function zeigeUebersicht() {
    var u = model.monatsUebersicht(daten, aktuellerMonat);

    zaehleHoch(q('kzEinnahmen'), u.einnahmen, format.eur);
    zaehleHoch(q('kzAusgaben'), u.ausgaben, format.eur);

    var saldo = q('kzSaldo');
    zaehleHoch(saldo, u.saldo, format.eur);
    saldo.className = 'hero-zahl' + (u.saldo < 0 ? ' negativ' : u.saldo > 0 ? ' positiv' : '');
    q('kzSaldoFuss').textContent = u.saldo < 0
      ? 'In diesem Monat ist mehr abgeflossen als hereingekommen.'
      : 'So viel bleibt in diesem Monat übrig.';

    /* Zehntel mitzählen, damit die Quote nicht in ganzen Prozent springt. */
    zaehleHoch(q('kzSparquote'), Math.round(u.sparquote * 10), function (zehntel) {
      return format.prozent(zehntel / 10);
    });

    var geplantListe = q('geplantListe');
    leeren(geplantListe);
    if (u.geplanteBuchungen.length) {
      q('geplantSumme').textContent = format.eur(u.geplanteAusgaben) + ' stehen noch aus · bereits gebucht: '
        + format.eur(u.gebuchteAusgaben);
      u.geplanteBuchungen.forEach(function (b) {
        var li = document.createElement('li');
        li.appendChild(neu('span', format.datum(b.datum) + ' · ' + (b.notiz || model.kategorieVon(daten, b.kategorieId).name)));
        li.appendChild(neu('strong', format.eur(b.betrag)));
        geplantListe.appendChild(li);
      });
    } else {
      q('geplantSumme').textContent = 'Für diesen Monat steht nichts mehr aus.';
    }

    charts.kategorieBalken(q('kategorieDiagramm'), model.nachKategorie(daten, aktuellerMonat, 'ausgabe'));
    charts.verlaufBalken(q('verlaufDiagramm'), model.monatsVerlauf(daten, aktuellerMonat, 6));
    charts.personBalken(q('personDiagramm'), model.nachPerson(daten, aktuellerMonat, 'ausgabe'));
  }

  /* ---------------- Buchungen ---------------- */

  function buchungFormZuruecksetzen() {
    bearbeiteBuchung = null;
    q('buchungId').value = '';
    q('buchungBetrag').value = '';
    q('buchungNotiz').value = '';
    q('buchungDatum').value = aktuellerMonat === format.heuteIso().slice(0, 7)
      ? format.heuteIso()
      : aktuellerMonat + '-01';
    q('buchungFormTitel').textContent = 'Neue Buchung';
    q('buchungAbbrechen').hidden = true;
    q('buchungFehler').hidden = true;
  }

  function buchungBearbeiten(b) {
    bearbeiteBuchung = b.id;
    q('buchungId').value = b.id;
    q('buchungDatum').value = b.datum;
    q('buchungBetrag').value = (b.betrag / 100).toFixed(2).replace('.', ',');
    q('buchungArt').value = b.art;
    fuelleKategorien(q('buchungKategorie'), b.art, b.kategorieId);
    q('buchungPerson').value = b.person;
    q('buchungNotiz').value = b.notiz;
    q('buchungFormTitel').textContent = 'Buchung bearbeiten';
    q('buchungAbbrechen').hidden = false;
    q('tab-buchungen').click();
    q('buchungBetrag').focus();
  }

  function buchungLoeschen(b) {
    var text = b.quelle
      ? 'Diese Buchung stammt aus einem Dauerauftrag. Sie wird gelöscht und für diesen Monat nicht erneut angelegt. Fortfahren?'
      : 'Diese Buchung wirklich löschen?';
    if (!global.confirm(text)) return;
    if (b.quelle) {
      daten.ausgeblendet = (daten.ausgeblendet || []).concat(b.quelle.dauerId + '|' + b.quelle.monat);
    }
    daten.buchungen = daten.buchungen.filter(function (x) { return x.id !== b.id; });
    if (bearbeiteBuchung === b.id) buchungFormZuruecksetzen();
    sichern();
    alleszeigen();
  }

  q('buchungArt').addEventListener('change', function () {
    fuelleKategorien(q('buchungKategorie'), q('buchungArt').value);
  });

  q('buchungAbbrechen').addEventListener('click', function () {
    buchungFormZuruecksetzen();
  });

  q('buchungForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var betrag = format.parseBetrag(q('buchungBetrag').value);
    var fehler = q('buchungFehler');

    if (betrag === null || betrag <= 0) {
      fehler.textContent = 'Bitte einen Betrag größer als null eintragen, z. B. 42,90.';
      fehler.hidden = false;
      q('buchungBetrag').focus();
      return;
    }
    if (!q('buchungDatum').value) {
      fehler.textContent = 'Bitte ein Datum wählen.';
      fehler.hidden = false;
      return;
    }

    var eintrag = {
      id: bearbeiteBuchung || store.neueId('b'),
      datum: q('buchungDatum').value,
      art: q('buchungArt').value,
      betrag: betrag,
      kategorieId: q('buchungKategorie').value || null,
      notiz: q('buchungNotiz').value.trim(),
      person: q('buchungPerson').value,
      quelle: null
    };

    if (bearbeiteBuchung) {
      daten.buchungen = daten.buchungen.map(function (b) {
        return b.id === bearbeiteBuchung ? Object.assign({}, b, eintrag) : b;
      });
    } else {
      daten.buchungen.push(eintrag);
    }

    aktuellerMonat = eintrag.datum.slice(0, 7);
    sichern();
    buchungFormZuruecksetzen();
    alleszeigen();
  });

  ['filterKategorie', 'filterPerson', 'filterText'].forEach(function (id) {
    q(id).addEventListener('input', zeigeBuchungen);
  });

  function zeigeBuchungen() {
    var tbody = q('buchungListe');
    leeren(tbody);

    var katFilter = q('filterKategorie').value;
    var personFilter = q('filterPerson').value;
    var suche = q('filterText').value.trim().toLowerCase();
    var heute = format.heuteIso();

    var liste = model.buchungenImMonat(daten, aktuellerMonat).filter(function (b) {
      if (katFilter && b.kategorieId !== katFilter) return false;
      if (personFilter && b.person !== personFilter) return false;
      if (suche && (b.notiz || '').toLowerCase().indexOf(suche) === -1) return false;
      return true;
    }).sort(function (a, b) { return a.datum < b.datum ? -1 : a.datum > b.datum ? 1 : 0; });

    q('buchungLeer').hidden = liste.length > 0;

    liste.forEach(function (b) {
      var kat = model.kategorieVon(daten, b.kategorieId);
      var tr = document.createElement('tr');
      if (b.datum > heute) tr.className = 'geplant';

      tr.appendChild(neu('td', format.datum(b.datum)));

      var notizZelle = neu('td', b.notiz || '–');
      if (b.quelle) notizZelle.appendChild(neu('span', 'Dauerauftrag', 'marke'));
      if (b.datum > heute) notizZelle.appendChild(neu('span', 'geplant', 'marke'));
      tr.appendChild(notizZelle);

      var katZelle = document.createElement('td');
      var huelle = neu('span', null, 'kategorie-zelle');
      var punkt = neu('span', null, 'farb-punkt');
      punkt.style.background = charts.farbe(kat.slot || 0);
      huelle.appendChild(punkt);
      huelle.appendChild(neu('span', kat.name));
      katZelle.appendChild(huelle);
      tr.appendChild(katZelle);

      tr.appendChild(neu('td', personName(b.person)));

      tr.appendChild(neu('td', (b.art === 'einnahme' ? '+' : '−') + ' ' + format.eur(b.betrag),
        b.art === 'einnahme' ? 'rechts positiv' : 'rechts'));

      var aktionen = neu('td', null, 'rechts');
      var bearbeiten = neu('button', 'Bearbeiten', 'zeilen-knopf');
      bearbeiten.type = 'button';
      bearbeiten.addEventListener('click', function () { buchungBearbeiten(b); });
      var loeschen = neu('button', 'Löschen', 'zeilen-knopf gefahr');
      loeschen.type = 'button';
      loeschen.addEventListener('click', function () { buchungLoeschen(b); });
      aktionen.appendChild(bearbeiten);
      aktionen.appendChild(loeschen);
      tr.appendChild(aktionen);

      tbody.appendChild(tr);
    });
  }

  /* ---------------- Daueraufträge ---------------- */

  function dauerFormZuruecksetzen() {
    bearbeiteDauer = null;
    q('dauerId').value = '';
    q('dauerBezeichnung').value = '';
    q('dauerBetrag').value = '';
    q('dauerTag').value = '1';
    q('dauerIntervall').value = 'monatlich';
    q('dauerStart').value = aktuellerMonat;
    q('dauerEnde').value = '';
    q('dauerFormTitel').textContent = 'Neuer Dauerauftrag';
    q('dauerAbbrechen').hidden = true;
    q('dauerFehler').hidden = true;
  }

  function dauerBearbeiten(d) {
    bearbeiteDauer = d.id;
    q('dauerId').value = d.id;
    q('dauerBezeichnung').value = d.bezeichnung;
    q('dauerBetrag').value = (d.betrag / 100).toFixed(2).replace('.', ',');
    q('dauerArt').value = d.art;
    fuelleKategorien(q('dauerKategorie'), d.art, d.kategorieId);
    q('dauerPerson').value = d.person;
    q('dauerTag').value = d.tagImMonat;
    q('dauerIntervall').value = d.intervall;
    q('dauerStart').value = d.startMonat;
    q('dauerEnde').value = d.endMonat || '';
    q('dauerFormTitel').textContent = 'Dauerauftrag bearbeiten';
    q('dauerAbbrechen').hidden = false;
    q('dauerBezeichnung').focus();
  }

  q('dauerArt').addEventListener('change', function () {
    fuelleKategorien(q('dauerKategorie'), q('dauerArt').value);
  });

  q('dauerAbbrechen').addEventListener('click', dauerFormZuruecksetzen);

  q('dauerForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var fehler = q('dauerFehler');
    var betrag = format.parseBetrag(q('dauerBetrag').value);
    var tag = parseInt(q('dauerTag').value, 10);

    if (!q('dauerBezeichnung').value.trim()) {
      fehler.textContent = 'Bitte eine Bezeichnung eintragen, z. B. „Miete".';
      fehler.hidden = false;
      return;
    }
    if (betrag === null || betrag <= 0) {
      fehler.textContent = 'Bitte einen Betrag größer als null eintragen.';
      fehler.hidden = false;
      return;
    }
    if (!(tag >= 1 && tag <= 31)) {
      fehler.textContent = 'Der Abbuchungstag muss zwischen 1 und 31 liegen.';
      fehler.hidden = false;
      return;
    }
    if (!q('dauerStart').value) {
      fehler.textContent = 'Bitte einen Startmonat wählen.';
      fehler.hidden = false;
      return;
    }
    if (q('dauerEnde').value && q('dauerEnde').value < q('dauerStart').value) {
      fehler.textContent = 'Der Endmonat liegt vor dem Startmonat.';
      fehler.hidden = false;
      return;
    }

    var eintrag = {
      id: bearbeiteDauer || store.neueId('d'),
      bezeichnung: q('dauerBezeichnung').value.trim(),
      art: q('dauerArt').value,
      betrag: betrag,
      kategorieId: q('dauerKategorie').value || null,
      person: q('dauerPerson').value,
      tagImMonat: tag,
      intervall: q('dauerIntervall').value,
      startMonat: q('dauerStart').value,
      endMonat: q('dauerEnde').value || null,
      aktiv: true
    };

    if (bearbeiteDauer) {
      daten.dauerauftraege = daten.dauerauftraege.map(function (d) {
        return d.id === bearbeiteDauer ? Object.assign({}, d, eintrag) : d;
      });
    } else {
      daten.dauerauftraege.push(eintrag);
    }

    sichern();
    dauerFormZuruecksetzen();
    alleszeigen();
  });

  function zeigeDaueraufraege() {
    var tbody = q('dauerListe');
    leeren(tbody);
    q('dauerLeer').hidden = daten.dauerauftraege.length > 0;
    q('fixkostenSumme').textContent = format.eur(model.fixkostenProMonat(daten, 'ausgabe')) + ' pro Monat';

    var rhythmus = { monatlich: 'monatlich', vierteljaehrlich: 'vierteljährlich', jaehrlich: 'jährlich' };

    daten.dauerauftraege.forEach(function (d) {
      var tr = document.createElement('tr');
      if (!d.aktiv) tr.className = 'inaktiv';

      var nameZelle = neu('td', d.bezeichnung);
      if (!d.aktiv) nameZelle.appendChild(neu('span', 'pausiert', 'marke'));
      if (d.endMonat) nameZelle.appendChild(neu('span', 'bis ' + format.monatLabel(d.endMonat), 'marke'));
      tr.appendChild(nameZelle);

      tr.appendChild(neu('td', rhythmus[d.intervall] || d.intervall));
      tr.appendChild(neu('td', d.tagImMonat + '.'));
      var dauerKat = model.kategorieVon(daten, d.kategorieId);
      var katZelle = document.createElement('td');
      var katHuelle = neu('span', null, 'kategorie-zelle');
      var katPunkt = neu('span', null, 'farb-punkt');
      katPunkt.style.background = charts.farbe(dauerKat.slot || 0);
      katHuelle.appendChild(katPunkt);
      katHuelle.appendChild(neu('span', dauerKat.name));
      katZelle.appendChild(katHuelle);
      tr.appendChild(katZelle);
      tr.appendChild(neu('td', (d.art === 'einnahme' ? '+' : '−') + ' ' + format.eur(d.betrag), 'rechts'));

      var aktionen = neu('td', null, 'rechts');
      var bearbeiten = neu('button', 'Bearbeiten', 'zeilen-knopf');
      bearbeiten.type = 'button';
      bearbeiten.addEventListener('click', function () { dauerBearbeiten(d); });

      var pause = neu('button', d.aktiv ? 'Pausieren' : 'Fortsetzen', 'zeilen-knopf');
      pause.type = 'button';
      pause.addEventListener('click', function () {
        d.aktiv = !d.aktiv;
        sichern();
        alleszeigen();
      });

      var loeschen = neu('button', 'Löschen', 'zeilen-knopf gefahr');
      loeschen.type = 'button';
      loeschen.addEventListener('click', function () {
        if (!global.confirm('Dauerauftrag „' + d.bezeichnung + '" löschen? Bereits erzeugte Buchungen bleiben erhalten.')) return;
        daten.dauerauftraege = daten.dauerauftraege.filter(function (x) { return x.id !== d.id; });
        if (bearbeiteDauer === d.id) dauerFormZuruecksetzen();
        sichern();
        alleszeigen();
      });

      aktionen.appendChild(bearbeiten);
      aktionen.appendChild(pause);
      aktionen.appendChild(loeschen);
      tr.appendChild(aktionen);
      tbody.appendChild(tr);
    });
  }

  /* ---------------- Einstellungen ---------------- */

  q('personenForm').addEventListener('submit', function (e) {
    e.preventDefault();
    daten.einstellungen.personA = q('personA').value.trim() || 'Ich';
    daten.einstellungen.personB = q('personB').value.trim() || 'Partnerin';
    sichern();
    alleszeigen();
  });

  /* Namen statt Nummern - "Farbe 5" sagt niemandem etwas. Reihenfolge wie --serie-1..8. */
  var FARBNAMEN = ['Blau', 'Orange', 'Türkis', 'Gelb', 'Rosé', 'Grün', 'Violett', 'Rot'];

  function farbAuswahl(gewaehlt, beiAenderung) {
    var select = document.createElement('select');
    select.setAttribute('aria-label', 'Farbe');
    for (var i = 1; i <= store.SLOTS; i++) select.appendChild(option(String(i), FARBNAMEN[i - 1] || ('Farbe ' + i)));
    select.value = String(gewaehlt || 8);
    if (beiAenderung) select.addEventListener('change', function () { beiAenderung(parseInt(select.value, 10)); });
    return select;
  }

  function zeigeKategorien() {
    var liste = q('kategorieListe');
    leeren(liste);

    daten.kategorien.forEach(function (k) {
      var li = document.createElement('li');

      var punkt = neu('span', null, 'farb-punkt');
      punkt.style.background = charts.farbe(k.slot);
      li.appendChild(punkt);

      var name = document.createElement('input');
      name.type = 'text';
      name.value = k.name;
      name.className = 'kat-name';
      name.setAttribute('aria-label', 'Name der Kategorie');
      name.addEventListener('change', function () {
        k.name = name.value.trim() || k.name;
        name.value = k.name;
        sichern();
        alleszeigen();
      });
      li.appendChild(name);

      li.appendChild(neu('span', k.typ === 'einnahme' ? 'Einnahme' : 'Ausgabe', 'marke'));

      li.appendChild(farbAuswahl(k.slot, function (slot) {
        k.slot = slot;
        sichern();
        alleszeigen();
      }));

      var benutzt = daten.buchungen.filter(function (b) { return b.kategorieId === k.id; }).length
        + daten.dauerauftraege.filter(function (d) { return d.kategorieId === k.id; }).length;

      var loeschen = neu('button', 'Löschen', 'zeilen-knopf gefahr');
      loeschen.type = 'button';
      loeschen.addEventListener('click', function () {
        var text = benutzt
          ? 'Die Kategorie „' + k.name + '" wird in ' + benutzt + ' Einträgen verwendet. Diese behalten ihren Betrag und erscheinen künftig unter „Ohne Kategorie". Löschen?'
          : 'Kategorie „' + k.name + '" löschen?';
        if (!global.confirm(text)) return;
        daten.kategorien = daten.kategorien.filter(function (x) { return x.id !== k.id; });
        daten.buchungen.forEach(function (b) { if (b.kategorieId === k.id) b.kategorieId = null; });
        daten.dauerauftraege.forEach(function (d) { if (d.kategorieId === k.id) d.kategorieId = null; });
        sichern();
        alleszeigen();
      });
      li.appendChild(loeschen);

      liste.appendChild(li);
    });
  }

  q('kategorieForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var name = q('katName').value.trim();
    if (!name) return;
    daten.kategorien.push({
      id: store.neueId('kat'),
      name: name,
      typ: q('katTyp').value,
      slot: parseInt(q('katSlot').value, 10) || 8
    });
    q('katName').value = '';
    sichern();
    alleszeigen();
  });

  q('exportKnopf').addEventListener('click', function () {
    var blob = new Blob([store.exportJson(daten)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'haushaltsbuch-' + format.heuteIso() + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  });

  q('importDatei').addEventListener('change', function (e) {
    var datei = e.target.files && e.target.files[0];
    if (!datei) return;
    var leser = new FileReader();
    leser.onload = function () {
      var ergebnis = store.importJson(String(leser.result));
      var vorschau = q('importVorschau');
      if (!ergebnis.ok) {
        importStand = null;
        vorschau.hidden = false;
        q('importText').textContent = ergebnis.fehler;
        q('importBestaetigen').hidden = true;
        return;
      }
      importStand = ergebnis.daten;
      vorschau.hidden = false;
      q('importBestaetigen').hidden = false;
      q('importText').textContent = 'Gefunden: ' + importStand.buchungen.length + ' Buchungen, '
        + importStand.dauerauftraege.length + ' Daueraufträge, ' + importStand.kategorien.length
        + ' Kategorien. Der bisherige Stand in diesem Browser wird dabei ersetzt.';
    };
    leser.readAsText(datei);
    e.target.value = '';
  });

  /* Zweiter Weg für die Sicherung: als Text. Nötig überall dort, wo der Browser
     Downloads aus der Seite heraus unterbindet - etwa in eingebetteten Ansichten. */
  q('textKnopf').addEventListener('click', function () {
    var bereich = q('textBereich');
    var zeigen = bereich.hidden;
    bereich.hidden = !zeigen;
    if (!zeigen) return;
    q('backupText').value = store.exportJson(daten);
    q('textHinweis').textContent = '';
    q('backupText').focus();
    q('backupText').select();
  });

  q('kopierenKnopf').addEventListener('click', function () {
    var feld = q('backupText');
    feld.select();
    var melden = function (text) { q('textHinweis').textContent = text; };

    if (global.navigator && global.navigator.clipboard) {
      global.navigator.clipboard.writeText(feld.value).then(
        function () { melden('Kopiert.'); },
        function () { melden('Kopieren nicht erlaubt – bitte den markierten Text von Hand kopieren.'); }
      );
      return;
    }
    melden('Bitte den markierten Text von Hand kopieren.');
  });

  q('textImportKnopf').addEventListener('click', function () {
    var ergebnis = store.importJson(q('backupText').value);
    if (!ergebnis.ok) {
      q('textHinweis').textContent = ergebnis.fehler;
      return;
    }
    importStand = ergebnis.daten;
    q('textHinweis').textContent = '';
    q('importVorschau').hidden = false;
    q('importBestaetigen').hidden = false;
    q('importText').textContent = 'Gefunden: ' + importStand.buchungen.length + ' Buchungen, '
      + importStand.dauerauftraege.length + ' Daueraufträge, ' + importStand.kategorien.length
      + ' Kategorien. Der bisherige Stand in diesem Browser wird dabei ersetzt.';
  });

  q('importBestaetigen').addEventListener('click', function () {
    if (!importStand) return;
    daten = importStand;
    importStand = null;
    q('importVorschau').hidden = true;
    q('textBereich').hidden = true;
    sichern();
    alleszeigen();
  });

  q('importAbbrechen').addEventListener('click', function () {
    importStand = null;
    q('importVorschau').hidden = true;
  });

  q('loeschenKnopf').addEventListener('click', function () {
    if (!global.confirm('Wirklich alle Buchungen, Daueraufträge und Einstellungen löschen? Das lässt sich nicht rückgängig machen.')) return;
    store.alleLoeschen();
    daten = store.leereDaten();
    sichern();
    alleszeigen();
  });

  q('demoKnopf').addEventListener('click', function () {
    var monat = aktuellerMonat;
    var beispiele = [
      { tag: '01', art: 'einnahme', betrag: 285000, kategorieId: 'kat_gehalt', notiz: 'Gehalt', person: 'a' },
      { tag: '01', art: 'einnahme', betrag: 214000, kategorieId: 'kat_gehalt', notiz: 'Gehalt', person: 'b' },
      { tag: '02', art: 'ausgabe', betrag: 128000, kategorieId: 'kat_wohnen', notiz: 'Miete', person: 'gemeinsam' },
      { tag: '03', art: 'ausgabe', betrag: 9850, kategorieId: 'kat_abos', notiz: 'Internet', person: 'gemeinsam' },
      { tag: '05', art: 'ausgabe', betrag: 8740, kategorieId: 'kat_lebensmittel', notiz: 'REWE Wocheneinkauf', person: 'b' },
      { tag: '09', art: 'ausgabe', betrag: 6520, kategorieId: 'kat_mobilitaet', notiz: 'Tanken', person: 'a' },
      { tag: '12', art: 'ausgabe', betrag: 12300, kategorieId: 'kat_lebensmittel', notiz: 'Großeinkauf', person: 'gemeinsam' },
      { tag: '14', art: 'ausgabe', betrag: 4500, kategorieId: 'kat_freizeit', notiz: 'Kino und Essen', person: 'gemeinsam' },
      { tag: '18', art: 'ausgabe', betrag: 21000, kategorieId: 'kat_versicherung', notiz: 'Haftpflicht', person: 'a' },
      { tag: '24', art: 'ausgabe', betrag: 7600, kategorieId: 'kat_gesundheit', notiz: 'Apotheke', person: 'b' }
    ];
    beispiele.forEach(function (b) {
      daten.buchungen.push({
        id: store.neueId('b'),
        datum: monat + '-' + b.tag,
        art: b.art,
        betrag: b.betrag,
        kategorieId: b.kategorieId,
        notiz: b.notiz,
        person: b.person,
        quelle: null
      });
    });
    sichern();
    alleszeigen();
  });

  /* ---------------- Gesamtausgabe ---------------- */

  function alleszeigen() {
    faelligesNachtragen(aktuellerMonat);

    q('monatAnzeige').textContent = format.monatLabel(aktuellerMonat);
    q('kopfPersonen').textContent = personName('a') + ' & ' + personName('b');

    var buchungKat = q('buchungKategorie').value;
    var dauerKat = q('dauerKategorie').value;
    fuelleKategorien(q('buchungKategorie'), q('buchungArt').value, buchungKat);
    fuelleKategorien(q('dauerKategorie'), q('dauerArt').value, dauerKat);

    var filterKat = q('filterKategorie').value;
    leeren(q('filterKategorie'));
    q('filterKategorie').appendChild(option('', 'Alle'));
    daten.kategorien.forEach(function (k) { q('filterKategorie').appendChild(option(k.id, k.name)); });
    q('filterKategorie').value = filterKat;

    fuellePersonen(q('buchungPerson'), false, q('buchungPerson').value);
    fuellePersonen(q('dauerPerson'), false, q('dauerPerson').value);
    fuellePersonen(q('filterPerson'), true, q('filterPerson').value);

    q('personA').value = daten.einstellungen.personA;
    q('personB').value = daten.einstellungen.personB;

    zeigeUebersicht();
    zeigeBuchungen();
    zeigeDaueraufraege();
    zeigeKategorien();
  }

  /* ---------------- Start ---------------- */

  leeren(q('katSlot'));
  for (var i = 1; i <= store.SLOTS; i++) q('katSlot').appendChild(option(String(i), FARBNAMEN[i - 1] || ('Farbe ' + i)));
  q('katSlot').value = '1';

  buchungFormZuruecksetzen();
  dauerFormZuruecksetzen();
  alleszeigen();
  indikatorSetzen();

  /* Service Worker: macht die App installierbar und offline lauffähig.
     Nur auf einer echten Adresse und nicht in einer eingebetteten Ansicht -
     dort ist die Registrierung ohnehin gesperrt. */
  if (global.navigator && 'serviceWorker' in global.navigator
      && global.location.protocol.indexOf('http') === 0
      && global.top === global.self) {
    global.addEventListener('load', function () {
      global.navigator.serviceWorker.register('sw.js').catch(function () {
        /* Ohne Service Worker läuft die App genauso, nur nicht offline. */
      });
    });
  }
})(window);
