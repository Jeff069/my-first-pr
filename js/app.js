/* Oberfläche: Zustand, Ereignisse, Rendering. Gerechnet wird ausschließlich in model.js,
   gespeichert ausschließlich über store.js. */
(function (global) {
  'use strict';

  var format = global.HB.format;
  var store = global.HB.store;
  var model = global.HB.model;
  var charts = global.HB.charts;
  var merge = global.HB.merge;
  var teilen = global.HB.teilen;
  var wolke = global.HB.wolke;

  var daten = store.laden();
  var aktuellerMonat = format.heuteIso().slice(0, 7);
  var bearbeiteBuchung = null;
  /* Die Balken wachsen beim Monatswechsel und beim Öffnen der Übersicht -
     aber nicht bei jedem Speichern, sonst zappelt die Seite. */
  var diagrammeAnimieren = true;
  var frischeZeile = null;
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

  /* Ein Grabstein hält fest, dass dieser Eintrag bewusst weg ist - sonst käme er
     beim nächsten Abgleich vom anderen Gerät zurück. */
  function grabstein(id) {
    daten.geloescht = (daten.geloescht || []).filter(function (e) { return e.id !== id; });
    daten.geloescht.push({ id: id, zeit: merge.jetzt() });
  }

  function grabsteinEntfernen(id) {
    daten.geloescht = (daten.geloescht || []).filter(function (e) { return e.id !== id; });
  }

  function sichern() {
    daten.aktualisiert = merge.jetzt();
    var erfolg = store.speichern(daten);
    var hinweis = q('speicherHinweis');
    hinweis.textContent = erfolg
      ? ''
      : 'Dieser Browser merkt sich nichts dauerhaft (privates Fenster?). Vor dem Schließen unter Einstellungen „Als Datei sichern“ tippen.';
    hinweis.className = erfolg ? '' : 'fehler';
    abgleichAnstossen();
  }

  function personName(schluessel) {
    if (schluessel === 'a') return daten.einstellungen.personA || store.VORGABE_NAMEN.a;
    if (schluessel === 'b') return daten.einstellungen.personB || store.VORGABE_NAMEN.b;
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
      .forEach(function (k) { select.appendChild(option(k.id, (k.emoji || '🏷️') + '  ' + k.name)); });
    if (gewaehlt) select.value = gewaehlt;
  }

  /* Passt zu den Diagrammfarben (Blau, Rosé, Türkis), damit man die Personen
     im Kopf, in den Karten und in der Auswahl an derselben Farbe erkennt. */
  var PERSON_EMOJI = { a: '🔵', b: '🩷', gemeinsam: '🟢' };

  function fuellePersonen(select, mitAlle, gewaehlt) {
    leeren(select);
    if (mitAlle) select.appendChild(option('', 'Alle'));
    ['a', 'b', 'gemeinsam'].forEach(function (p) {
      select.appendChild(option(p, PERSON_EMOJI[p] + '  ' + personName(p)));
    });
    select.value = gewaehlt || (mitAlle ? '' : 'gemeinsam');
  }

  /* „Für wen?“ - Vorgabe ist „Beide“, damit ein Paar im Normalfall nichts umstellen muss. */
  function fuellePersonenFuer(select, gewaehlt) {
    leeren(select);
    select.appendChild(option('beide', '🤝  Beide'));
    ['a', 'b'].forEach(function (p) {
      select.appendChild(option(p, PERSON_EMOJI[p] + '  ' + personName(p)));
    });
    select.value = gewaehlt || 'beide';
  }

  /* Bei Einnahmen und beim gemeinsamen Topf gibt es nichts aufzuteilen:
     Feld weg und Wert auf „beide“, damit nie eine Schuld aus dem Nichts entsteht. */
  function fuerFeldSchalten(artSelect, personSelect, feldDiv, fuerSelect) {
    var ohne = artSelect.value === 'einnahme'
      || (personSelect.value !== 'a' && personSelect.value !== 'b');
    feldDiv.hidden = ohne;
    if (ohne) fuerSelect.value = 'beide';
  }

  function buchungFuerSchalten() {
    fuerFeldSchalten(q('buchungArt'), q('buchungPerson'), q('buchungFuerFeld'), q('buchungFuer'));
  }

  function dauerFuerSchalten() {
    fuerFeldSchalten(q('dauerArt'), q('dauerPerson'), q('dauerFuerFeld'), q('dauerFuer'));
  }

  /* Kurzmeldung am unteren Rand: sagt, was passiert ist, und bietet bei
     Löschungen das Rückgängigmachen an - das ersetzt die Rückfrage vorher. */
  var meldungen = [];

  function meldungSchliessen(eintrag) {
    if (!eintrag.el.parentNode) return;
    clearTimeout(eintrag.uhr);
    eintrag.el.classList.add('geht');
    setTimeout(function () {
      if (eintrag.el.parentNode) eintrag.el.parentNode.removeChild(eintrag.el);
    }, wenigerBewegung ? 0 : 240);
    meldungen = meldungen.filter(function (m) { return m !== eintrag; });
  }

  function meldung(text, aktion) {
    var el = neu('div', null, 'meldung');
    el.appendChild(neu('span', text, 'meldung-text'));

    var eintrag = { el: el, uhr: null };

    if (aktion) {
      var knopf = neu('button', aktion.text, 'meldung-aktion');
      knopf.type = 'button';
      knopf.addEventListener('click', function () {
        meldungSchliessen(eintrag);
        aktion.tun();
      });
      el.appendChild(knopf);
    }

    q('meldungen').appendChild(el);
    meldungen.push(eintrag);
    /* Mit Rückgängig etwas länger stehen lassen - man muss es ja lesen können. */
    eintrag.uhr = setTimeout(function () { meldungSchliessen(eintrag); }, aktion ? 7000 : 3500);

    /* Nie mehr als zwei auf einmal - auf dem Handy verdecken drei schon die halbe Liste. */
    while (meldungen.length > 2) meldungSchliessen(meldungen[0]);
  }

  /* Formulare und Filter sind zugeklappt, bis man sie braucht - so sieht man
     zuerst, was man hat, und nicht ein Formular. */
  function klappe(knopfId, bereichId, offen) {
    var knopf = q(knopfId);
    var bereich = q(bereichId);
    var jetztOffen = offen === undefined ? bereich.hidden : offen;
    bereich.hidden = !jetztOffen;
    knopf.setAttribute('aria-expanded', jetztOffen ? 'true' : 'false');
    return jetztOffen;
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
    if (ziel === q('tab-uebersicht')) diagrammeAnimieren = true;
    /* Die Kennzahlen im Kopf gehören zur Übersicht; sonst bleibt nur Titel und Monat. */
    q('bilanz').hidden = ziel !== q('tab-uebersicht');
    tabs.forEach(function (tab) {
      var aktiv = tab === ziel;
      tab.setAttribute('aria-selected', aktiv ? 'true' : 'false');
      tab.tabIndex = aktiv ? 0 : -1;
      q(tab.getAttribute('aria-controls')).hidden = !aktiv;
    });
    indikatorSetzen();
    if (fokussieren !== false) ziel.focus();
    /* Wurde die Übersicht gezeichnet, während ihr Reiter versteckt war (Speichern
       im Reiter Buchungen), maß der Verlauf Breite 0; jetzt ist die echte Breite da. */
    if (ziel === q('tab-uebersicht') && daten) zeigeUebersicht();
  }

  /* Nach Drehen oder Größenänderung passen Markierung und Diagramm sich an.
     Die Handy-Tastatur ändert nur die Höhe - dann bleibt das Diagramm stehen. */
  var neuZeichnen = null;
  var letzteBreite = global.innerWidth;
  global.addEventListener('resize', function () {
    indikatorSetzen();
    if (global.innerWidth === letzteBreite) return;
    letzteBreite = global.innerWidth;
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

  /* Heute, solange der angezeigte Monat der laufende ist - sonst der Monatserste,
     damit ein Nachtrag beim Blättern nicht im falschen Monat landet. */
  function datumVorgabe() {
    return aktuellerMonat === format.heuteIso().slice(0, 7)
      ? format.heuteIso()
      : aktuellerMonat + '-01';
  }

  /* Die Formulare folgen dem Monat - außer man bearbeitet gerade etwas. */
  function formularDatenAnMonat() {
    if (!bearbeiteBuchung) q('buchungDatum').value = datumVorgabe();
    if (!bearbeiteDauer) q('dauerStart').value = aktuellerMonat;
  }

  /* Ein Filter darf nie unsichtbar weiterwirken - sonst sieht ein Monat leer aus,
     der es nicht ist, und man trägt Dinge doppelt ein. */
  function filterLeeren() {
    ['filterKategorie', 'filterPerson', 'filterText'].forEach(function (id) { q(id).value = ''; });
  }

  function monatSetzen(monat) {
    aktuellerMonat = monat;
    diagrammeAnimieren = true;
    formularDatenAnMonat();
    filterLeeren();
    alleszeigen();
  }

  /* Von der Übersicht aus mit einem Tipp ins leere Formular, Betrag zuerst. */
  function neueBuchungOeffnen() {
    tabWaehlen(q('tab-buchungen'), false);
    buchungFormZuruecksetzen();
    klappe('buchungFormOeffnen', 'buchungFormBereich', true);
    q('buchungFormOeffnen').lastChild.nodeValue = ' Formular zuklappen';
    q('buchungBetrag').focus();
  }

  q('schnellEintragen').addEventListener('click', neueBuchungOeffnen);
  q('einstiegKnopf').addEventListener('click', neueBuchungOeffnen);
  q('einstiegDemo').addEventListener('click', function () { q('demoKnopf').click(); });

  q('buchungFormOeffnen').addEventListener('click', function () {
    var offen = klappe('buchungFormOeffnen', 'buchungFormBereich');
    q('buchungFormOeffnen').lastChild.nodeValue = offen ? ' Formular zuklappen' : ' Neue Buchung eintragen';
    /* Zuklappen beendet auch das Bearbeiten - sonst überschreibt die nächste
       „neue“ Buchung still den zuletzt geöffneten Eintrag. */
    if (!offen) buchungFormZuruecksetzen();
    if (offen) q('buchungBetrag').focus();
  });

  q('dauerFormOeffnen').addEventListener('click', function () {
    var offen = klappe('dauerFormOeffnen', 'dauerFormBereich');
    q('dauerFormOeffnen').lastChild.nodeValue = offen ? ' Formular zuklappen' : ' Regelmäßige Zahlung eintragen';
    if (!offen) dauerFormZuruecksetzen();
    if (offen) q('dauerBezeichnung').focus();
  });

  q('filterOeffnen').addEventListener('click', function () {
    var offen = klappe('filterOeffnen', 'filterBereich');
    q('filterOeffnen').textContent = offen ? 'Filter zuklappen' : 'Filtern und suchen';
    if (!offen) { filterLeeren(); zeigeBuchungen(); }
  });

  q('filterZuruecksetzen').addEventListener('click', function () {
    filterLeeren();
    zeigeBuchungen();
    q('filterOeffnen').focus();
  });

  q('kategorieMehr').addEventListener('click', function () {
    var bereich = q('kategorieDiagramm');
    var alle = bereich.classList.toggle('alle');
    q('kategorieMehr').textContent = alle ? 'Nur die größten fünf zeigen' : 'Alle Kategorien anzeigen';
  });

  q('agMehr').addEventListener('click', function () {
    var alle = q('agListe').classList.toggle('alle');
    q('agMehr').textContent = alle ? 'Nur die ersten fünf zeigen' : 'Alle anzeigen';
  });

  q('monatZurueck').addEventListener('click', function () { monatSetzen(model.monatPlus(aktuellerMonat, -1)); });
  q('monatVor').addEventListener('click', function () { monatSetzen(model.monatPlus(aktuellerMonat, 1)); });
  q('monatHeute').addEventListener('click', function () { monatSetzen(format.heuteIso().slice(0, 7)); });

  /* Fällige Daueraufträge nachtragen - aber nicht für Monate, die noch nicht begonnen haben. */
  function faelligesNachtragen(monat) {
    if (monat > format.heuteIso().slice(0, 7)) return;
    var neue = model.faelligeBuchungen(daten, monat);
    if (!neue.length) return;
    neue.forEach(function (b) { b.geaendert = merge.jetzt(); });
    daten.buchungen = daten.buchungen.concat(neue);
    sichern();
  }

  /* ---------------- Übersicht ---------------- */

  function zeigeUebersicht() {
    var u = model.monatsUebersicht(daten, aktuellerMonat);
    var g = model.ausgleich(daten, aktuellerMonat);

    q('namenHinweis').hidden = !(daten.einstellungen.personA === store.VORGABE_NAMEN.a
      && daten.einstellungen.personB === store.VORGABE_NAMEN.b);

    /* Ganz am Anfang sagt eine Karte, was zu tun ist - leere Diagramme sagen es nicht. */
    var leer = !model.buchungenImMonat(daten, aktuellerMonat).length && !daten.dauerauftraege.length;
    q('einstiegKarte').hidden = !leer;
    q('schnellEintragen').hidden = leer;
    document.querySelectorAll('#panel-uebersicht .uebersicht-karte').forEach(function (k) { k.hidden = leer; });

    zaehleHoch(q('kzEinnahmen'), u.einnahmen, format.eur);
    zaehleHoch(q('kzAusgaben'), u.ausgaben, format.eur);

    var saldo = q('kzSaldo');
    zaehleHoch(saldo, u.saldo, format.eur);
    saldo.className = 'hero-zahl';
    saldo.parentNode.classList.toggle('negativ', u.saldo < 0);
    q('kzSaldoFuss').textContent = u.einnahmen === 0 && u.ausgaben === 0
      ? 'Noch nichts eingetragen.'
      : u.saldo < 0
        ? 'Mehr raus als rein.'
        : Math.round(u.sparquote) + ' % von dem, was reinkam.';

    zaehleHoch(q('kzAusgleich'), g.betrag, format.eur);
    /* Nur der Geber - der Empfänger ist der andere; so passt auch ein langer Name in die Kachel. */
    q('kzAusgleichWer').textContent = g.von ? 'von ' + personName(g.von) : 'alles fair ✅';

    /* Was noch abgeht, zeigt sich nur, wenn wirklich etwas aussteht. */
    var stehtAus = u.geplanteAusgaben > 0;
    q('kommtNochChip').hidden = !stehtAus;
    q('kommtNochChip').textContent = '⏳ ' + format.eur(u.geplanteAusgaben) + ' gehen noch ab';
    q('geplantKarte').hidden = leer || !stehtAus;
    q('geplantTitel').textContent = 'Geht noch ab: ' + format.eur(u.geplanteAusgaben);
    var geplantListe = q('geplantListe');
    leeren(geplantListe);
    u.geplanteBuchungen.forEach(function (b) {
      var kat = model.kategorieVon(daten, b.kategorieId);
      var li = document.createElement('li');
      li.appendChild(neu('span', kurzDatum(b.datum) + ' · ' + (kat.emoji || '🏷️') + ' ' + (b.notiz || kat.name)));
      li.appendChild(neu('strong', format.eur(b.betrag)));
      geplantListe.appendChild(li);
    });

    zeigeAusgleich(g);

    var kategorien = model.nachKategorie(daten, aktuellerMonat, 'ausgabe');
    q('kategorieDiagramm').classList.toggle('ohne-bewegung', !diagrammeAnimieren);
    q('personDiagramm').classList.toggle('ohne-bewegung', !diagrammeAnimieren);
    q('verlaufDiagramm').classList.toggle('ohne-bewegung', !diagrammeAnimieren);
    diagrammeAnimieren = false;
    charts.kategorieBalken(q('kategorieDiagramm'), kategorien);
    q('kategorieMehr').hidden = kategorien.length <= 5;
    charts.verlaufBalken(q('verlaufDiagramm'), model.monatsVerlauf(daten, aktuellerMonat, 6));
    charts.personBalken(q('personDiagramm'), model.nachPerson(daten, aktuellerMonat, 'ausgabe'));
  }

  /* Innerhalb der Monatsansicht ist das Jahr überflüssig - so passt die Zeile aufs Handy. */
  function kurzDatum(iso) {
    return iso.slice(8, 10) + '.' + iso.slice(5, 7) + '.';
  }

  /* Eine Marke als Zeichen: Screenreader und Tooltip bekommen das Wort dazu. */
  function symbolMarke(zeichen, bedeutung) {
    var marke = neu('span', zeichen, 'marke marke-symbol');
    marke.setAttribute('role', 'img');
    marke.setAttribute('aria-label', bedeutung);
    marke.title = bedeutung;
    return marke;
  }

  function personMitEmoji(p) {
    return PERSON_EMOJI[p] + ' ' + personName(p);
  }

  /* Karte „Wer gibt wem“: ein Satz mit dem Ergebnis, zwei Sätze mit dem, was jeder
     für den anderen ausgelegt hat, und die Posten dahinter. */
  function zeigeAusgleich(g) {
    var leer = g.posten.length === 0;

    q('agErgebnis').textContent = g.von
      ? personMitEmoji(g.von) + ' gibt ' + personMitEmoji(g.an) + ' ' + format.eur(g.betrag) + ' zurück'
      : leer ? '✅ Alles fair' : '✅ Alles fair – ihr habt gleich viel füreinander ausgelegt.';

    ['a', 'b'].forEach(function (p) {
      var andere = p === 'a' ? 'b' : 'a';
      var li = q(p === 'a' ? 'agA' : 'agB');
      leeren(li);
      li.appendChild(neu('span', personMitEmoji(p) + ' hat für ' + personMitEmoji(andere) + ' ausgelegt: '));
      li.appendChild(neu('strong', format.eur(g.bezahltFuerAnderen[p])));
      li.hidden = leer;
    });
    q('agLeer').hidden = !leer;

    var liste = q('agListe');
    leeren(liste);
    liste.classList.remove('alle');
    g.posten.forEach(function (p) {
      var kat = model.kategorieVon(daten, p.kategorieId);
      var andere = p.zahler === 'a' ? 'b' : 'a';
      var li = neu('li', null, 'ag-posten');
      li.appendChild(neu('span', kurzDatum(p.datum) + ' · ' + (kat.emoji || '🏷️') + ' ' + (p.notiz || kat.name)));
      li.appendChild(neu('strong', format.eur(p.betrag)));
      li.appendChild(neu('span', p.fuer === 'beide'
        ? '→ davon ' + format.eur(p.anteil) + ' für ' + personName(andere)
        : '→ ganz für ' + personName(andere), 'ag-anteil'));
      liste.appendChild(li);
    });
    q('agMehr').hidden = g.posten.length <= 5;
    q('agMehr').textContent = 'Alle anzeigen';
  }

  /* ---------------- Buchungen ---------------- */

  function buchungFormZuruecksetzen() {
    bearbeiteBuchung = null;
    q('buchungId').value = '';
    q('buchungBetrag').value = '';
    q('buchungNotiz').value = '';
    q('buchungDatum').value = datumVorgabe();
    q('buchungArt').value = 'ausgabe';
    /* Die zuletzt genutzte Kategorie statt „Wohnen & Miete“: Miete kommt von allein,
       der Wocheneinkauf nicht. Ist sie inzwischen gelöscht, die erste. */
    fuelleKategorien(q('buchungKategorie'), 'ausgabe', store.geraetLesen().letzteKategorie || 'kat_lebensmittel');
    if (!q('buchungKategorie').value) q('buchungKategorie').selectedIndex = 0;
    q('buchungPerson').value = 'gemeinsam';
    q('buchungFuer').value = 'beide';
    buchungFuerSchalten();
    q('buchungFormTitel').textContent = 'Neue Buchung';
    q('buchungTeilen').hidden = true;
    q('buchungLoeschen').hidden = true;
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
    q('buchungFuer').value = model.fuerVon(b);
    buchungFuerSchalten();
    q('buchungNotiz').value = b.notiz;
    q('buchungFormTitel').textContent = 'Buchung bearbeiten';
    q('buchungTeilen').hidden = false;
    q('buchungLoeschen').hidden = false;
    q('tab-buchungen').click();
    klappe('buchungFormOeffnen', 'buchungFormBereich', true);
    q('buchungFormOeffnen').lastChild.nodeValue = ' Formular zuklappen';
    q('buchungBetrag').focus();
  }

  function buchungLoeschen(b) {
    var warQuelle = b.quelle ? b.quelle.dauerId + '|' + b.quelle.monat : null;

    daten.buchungen = daten.buchungen.filter(function (x) { return x.id !== b.id; });
    grabstein(b.id);
    /* Aus einem Dauerauftrag erzeugte Buchungen dürfen nicht nachwachsen. */
    if (warQuelle) daten.ausgeblendet = (daten.ausgeblendet || []).concat(warQuelle);
    if (bearbeiteBuchung === b.id) buchungFormZuruecksetzen();

    sichern();
    alleszeigen();

    meldung('🗑️ „' + (b.notiz || model.kategorieVon(daten, b.kategorieId).name) + '" gelöscht', {
      text: 'Rückgängig',
      tun: function () {
        daten.buchungen.push(Object.assign({}, b, { geaendert: merge.jetzt() }));
        grabsteinEntfernen(b.id);
        if (warQuelle) {
          daten.ausgeblendet = (daten.ausgeblendet || []).filter(function (e) { return e !== warQuelle; });
        }
        aktuellerMonat = b.datum.slice(0, 7);
        formularDatenAnMonat();
        frischeZeile = b.id;
        sichern();
        alleszeigen();
        meldung('↩️ Wiederhergestellt.');
      }
    });
  }

  q('buchungArt').addEventListener('change', function () {
    fuelleKategorien(q('buchungKategorie'), q('buchungArt').value);
    /* Gehalt hat einen Empfänger, der Einkauf den gemeinsamen Topf - die Vorgabe folgt der Art. */
    q('buchungPerson').value = q('buchungArt').value === 'einnahme'
      ? (daten.einstellungen.letzteEinnahmePerson || 'a')
      : 'gemeinsam';
    buchungFuerSchalten();
  });
  q('buchungPerson').addEventListener('change', buchungFuerSchalten);

  q('buchungAbbrechen').addEventListener('click', function () {
    buchungFormZuruecksetzen();
    klappe('buchungFormOeffnen', 'buchungFormBereich', false);
    q('buchungFormOeffnen').lastChild.nodeValue = ' Neue Buchung eintragen';
  });

  function bearbeiteteBuchung() {
    return daten.buchungen.filter(function (b) { return b.id === bearbeiteBuchung; })[0] || null;
  }
  q('buchungTeilen').addEventListener('click', function () {
    var b = bearbeiteteBuchung();
    if (b) buchungTeilen(b);
  });
  q('buchungLoeschen').addEventListener('click', function () {
    var b = bearbeiteteBuchung();
    if (!b) return;
    buchungLoeschen(b);
    /* Die Buchung ist weg - ein leeres Formular hätte hier nichts mehr zu tun. */
    klappe('buchungFormOeffnen', 'buchungFormBereich', false);
    q('buchungFormOeffnen').lastChild.nodeValue = ' Neue Buchung eintragen';
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
      fuer: q('buchungFuerFeld').hidden ? 'beide' : q('buchungFuer').value,
      quelle: null,
      geaendert: merge.jetzt()
    };

    if (bearbeiteBuchung) {
      /* Die Herkunft bleibt: sonst legt faelligesNachtragen die korrigierte
         Miete gleich noch einmal an. */
      daten.buchungen = daten.buchungen.map(function (b) {
        return b.id === bearbeiteBuchung ? Object.assign({}, b, eintrag, { quelle: b.quelle }) : b;
      });
    } else {
      daten.buchungen.push(eintrag);
    }

    var warBearbeitung = !!bearbeiteBuchung;
    aktuellerMonat = eintrag.datum.slice(0, 7);
    frischeZeile = eintrag.id;
    if (eintrag.art === 'einnahme') daten.einstellungen.letzteEinnahmePerson = eintrag.person;
    else store.geraetSchreiben({ letzteKategorie: eintrag.kategorieId });
    sichern();
    buchungFormZuruecksetzen();
    klappe('buchungFormOeffnen', 'buchungFormBereich', false);
    q('buchungFormOeffnen').lastChild.nodeValue = ' Neue Buchung eintragen';
    alleszeigen();

    /* Sagen, was die Buchung bewirkt hat - sonst ändert sich die Übersicht
       unbemerkt im Hintergrund. */
    var stand = model.monatsUebersicht(daten, aktuellerMonat);
    /* Ohne Einnahmen wäre „bleibt −42,90 €“ nur ein Schreck - dann die Ausgabensumme. */
    var text = (warBearbeitung ? '✏️ Geändert' : '✅ Gespeichert')
      + ': ' + (eintrag.art === 'einnahme' ? '+ ' : '− ') + format.eur(eintrag.betrag)
      + (stand.einnahmen > 0
        ? ' · bleibt uns am Monatsende ' + format.eur(stand.saldo)
        : ' · Ausgaben diesen Monat ' + format.eur(stand.ausgaben));
    /* Hat jemand für den anderen ausgelegt, ändert sich die Ausgleich-Kachel,
       die man vom Reiter Buchungen aus nicht sieht - also mitsagen. */
    if (eintrag.art === 'ausgabe' && (eintrag.person === 'a' || eintrag.person === 'b')
        && model.fuerVon(eintrag) !== eintrag.person) {
      var g = model.ausgleich(daten, aktuellerMonat);
      text += g.von
        ? ' · Ausgleich jetzt ' + format.eur(g.betrag) + ' ' + personName(g.von) + ' → ' + personName(g.an)
        : ' · Ausgleich: alles fair ✅';
    }
    meldung(text);
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

    var alle = model.buchungenImMonat(daten, aktuellerMonat);
    var gefiltert = !!(katFilter || personFilter || suche);

    var liste = alle.filter(function (b) {
      if (katFilter && b.kategorieId !== katFilter) return false;
      if (personFilter && b.person !== personFilter) return false;
      if (suche && (b.notiz || '').toLowerCase().indexOf(suche) === -1) return false;
      return true;
    }).sort(function (a, b) { return a.datum < b.datum ? -1 : a.datum > b.datum ? 1 : 0; });

    q('buchungLeer').hidden = liste.length > 0;
    q('buchungLeerText').textContent = gefiltert
      ? 'Kein Treffer – ' + alle.length + ' Buchungen ausgeblendet.'
      : 'In diesem Monat ist noch nichts eingetragen. Tippe oben auf ➕.';
    q('filterZuruecksetzen').hidden = !gefiltert;
    var hervorheben = frischeZeile;
    frischeZeile = null;
    q('buchungTabelle').hidden = liste.length === 0;

    liste.forEach(function (b) {
      var kat = model.kategorieVon(daten, b.kategorieId);
      var tr = document.createElement('tr');
      if (b.datum > heute) tr.className = 'geplant';
      if (b.id === hervorheben) {
        tr.classList.add('frisch');
        setTimeout(function () {
          if (tr.scrollIntoView) tr.scrollIntoView({ block: 'center', behavior: wenigerBewegung ? 'auto' : 'smooth' });
        }, 60);
      }

      /* Die ganze Zeile öffnet das Bearbeiten - Teilen und Löschen stehen dort im Formular,
         statt bei jeder Zeile griffbereit zu liegen. */
      var titel = b.notiz || kat.name;
      tr.tabIndex = 0;
      tr.setAttribute('role', 'button');
      tr.setAttribute('aria-label', 'Buchung ändern: ' + titel + ', ' + format.eur(b.betrag) + ', ' + format.datum(b.datum));
      tr.addEventListener('click', function () { buchungBearbeiten(b); });
      tr.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); buchungBearbeiten(b); }
      });

      /* Aufs Handy passt die Zeile nur ohne Jahr - der Monat steht ohnehin im Kopf.
         Die Marken stehen beim Datum, damit der Titel neben dem Betrag einzeilig bleibt -
         als Zeichen statt als Wort, sonst wird die Unterzeile dreizeilig: 🔁 wie der
         Reiter Monatliches, ⏳ wie der Chip „gehen noch ab“ in der Übersicht. */
      var datumZelle = neu('td', kurzDatum(b.datum));
      datumZelle.appendChild(neu('span', b.datum.slice(0, 4), 'jahr'));
      if (b.quelle) datumZelle.appendChild(symbolMarke('🔁', 'automatisch'));
      if (b.datum > heute) datumZelle.appendChild(symbolMarke('⏳', 'geplant'));
      tr.appendChild(datumZelle);

      tr.appendChild(neu('td', titel));

      var katZelle = document.createElement('td');
      var huelle = neu('span', null, 'kategorie-zelle');
      huelle.appendChild(neu('span', kat.emoji || '🏷️', 'emoji'));
      var punkt = neu('span', null, 'farb-punkt');
      punkt.style.background = charts.farbe(kat.slot || 0);
      huelle.appendChild(punkt);
      /* Ohne Notiz ist der Kategoriename schon der Titel - nicht zweimal zeigen. */
      if (b.notiz) huelle.appendChild(neu('span', kat.name));
      katZelle.appendChild(huelle);
      tr.appendChild(katZelle);

      /* Gemeinsam ist der Normalfall - auf dem Handy steht nur die Ausnahme (Ich, Partnerin). */
      tr.appendChild(neu('td', personName(b.person), b.person === 'gemeinsam' ? 'wer-gemeinsam' : null));

      tr.appendChild(neu('td', (b.art === 'einnahme' ? '+' : '−') + ' ' + format.eur(b.betrag),
        b.art === 'einnahme' ? 'rechts positiv' : 'rechts'));

      tbody.appendChild(tr);
    });
  }

  /* ---------------- Buchung verschicken und übernehmen ---------------- */

  function buchungTeilen(b) {
    var kategorie = daten.kategorien.filter(function (k) { return k.id === b.kategorieId; })[0] || null;
    var link = teilen.linkFuer(b, kategorie, global.location.href);
    var beschreibung = (b.notiz || model.kategorieVon(daten, b.kategorieId).name)
      + ' · ' + format.eur(b.betrag) + ' · ' + format.datum(b.datum);
    var text = beschreibung + '\nÜbernehmen: ' + link;

    /* Auf dem Handy die Teilen-Auswahl des Systems (WhatsApp, SMS, Mail),
       sonst in die Zwischenablage. */
    if (global.navigator && global.navigator.share) {
      global.navigator.share({ title: 'Buchung fürs Haushaltsbuch', text: text }).catch(function () {
        /* Abgebrochen ist kein Fehler. */
      });
      return;
    }
    if (global.navigator && global.navigator.clipboard) {
      global.navigator.clipboard.writeText(text).then(function () {
        meldung('📋 Kopiert – jetzt in WhatsApp oder eine E-Mail einfügen.');
      }, function () {
        global.prompt('Diesen Text verschicken:', text);
      });
      return;
    }
    global.prompt('Diesen Text verschicken:', text);
  }

  var geteiltesAngebot = null;

  function geteiltesPruefen() {
    var angebot = teilen.ausAdresse(global.location.href);
    /* Die Adresse sofort säubern, damit ein Neuladen nicht erneut fragt. */
    if (angebot && global.history && global.history.replaceState) {
      global.history.replaceState(null, '', global.location.href.split('#')[0]);
    }
    if (!angebot) return;

    geteiltesAngebot = angebot;
    var schonDa = daten.buchungen.some(function (b) { return b.id === angebot.buchung.id; });
    var kategorieName = angebot.kategorie ? angebot.kategorie.name
      : model.kategorieVon(daten, angebot.buchung.kategorieId).name;

    q('geteiltText').textContent = (angebot.buchung.notiz || kategorieName)
      + ' · ' + format.eur(angebot.buchung.betrag)
      + ' · ' + format.datum(angebot.buchung.datum)
      + ' · ' + kategorieName
      + ' · ' + personName(angebot.buchung.person)
      + (angebot.buchung.person === 'a' || angebot.buchung.person === 'b'
        ? ' · für ' + (angebot.buchung.fuer === 'beide' ? 'beide' : personName(angebot.buchung.fuer))
        : '')
      + (schonDa ? ' — diese Buchung ist bereits erfasst.' : '');
    q('geteiltUebernehmen').hidden = schonDa;
    q('geteiltKarte').hidden = false;
  }

  q('geteiltUebernehmen').addEventListener('click', function () {
    if (!geteiltesAngebot) return;

    /* Fehlt die Kategorie hier, wird sie mit angelegt - sonst stünde die
       Buchung ohne Einordnung da. */
    if (geteiltesAngebot.kategorie
        && !daten.kategorien.some(function (k) { return k.id === geteiltesAngebot.kategorie.id; })) {
      daten.kategorien.push(Object.assign({}, geteiltesAngebot.kategorie, { geaendert: merge.jetzt() }));
    }

    daten.buchungen.push(Object.assign({}, geteiltesAngebot.buchung, { geaendert: merge.jetzt() }));
    aktuellerMonat = geteiltesAngebot.buchung.datum.slice(0, 7);
    formularDatenAnMonat();
    frischeZeile = geteiltesAngebot.buchung.id;
    meldung('📥 Übernommen: ' + format.eur(geteiltesAngebot.buchung.betrag));
    geteiltesAngebot = null;
    q('geteiltKarte').hidden = true;
    sichern();
    alleszeigen();
  });

  q('geteiltVerwerfen').addEventListener('click', function () {
    geteiltesAngebot = null;
    q('geteiltKarte').hidden = true;
  });

  /* ---------------- Daueraufträge ---------------- */

  function dauerFormZuruecksetzen() {
    bearbeiteDauer = null;
    q('dauerId').value = '';
    q('dauerBezeichnung').value = '';
    q('dauerBetrag').value = '';
    q('dauerArt').value = 'ausgabe';
    fuelleKategorien(q('dauerKategorie'), 'ausgabe');
    q('dauerPerson').value = 'gemeinsam';
    q('dauerTag').value = '1';
    q('dauerIntervall').value = 'monatlich';
    q('dauerStart').value = aktuellerMonat;
    q('dauerEnde').value = '';
    q('dauerFuer').value = 'beide';
    dauerFuerSchalten();
    q('dauerFormTitel').textContent = 'Neue regelmäßige Zahlung';
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
    q('dauerFuer').value = model.fuerVon(d);
    dauerFuerSchalten();
    q('dauerTag').value = d.tagImMonat;
    q('dauerIntervall').value = d.intervall;
    q('dauerStart').value = d.startMonat;
    q('dauerEnde').value = d.endMonat || '';
    q('dauerFormTitel').textContent = 'Zahlung bearbeiten';
    klappe('dauerFormOeffnen', 'dauerFormBereich', true);
    q('dauerFormOeffnen').lastChild.nodeValue = ' Formular zuklappen';
    q('dauerBezeichnung').focus();
  }

  q('dauerArt').addEventListener('change', function () {
    fuelleKategorien(q('dauerKategorie'), q('dauerArt').value);
    dauerFuerSchalten();
  });
  q('dauerPerson').addEventListener('change', dauerFuerSchalten);

  q('dauerAbbrechen').addEventListener('click', function () {
    dauerFormZuruecksetzen();
    klappe('dauerFormOeffnen', 'dauerFormBereich', false);
    q('dauerFormOeffnen').lastChild.nodeValue = ' Regelmäßige Zahlung eintragen';
  });

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
      fuer: q('dauerFuerFeld').hidden ? 'beide' : q('dauerFuer').value,
      tagImMonat: tag,
      intervall: q('dauerIntervall').value,
      startMonat: q('dauerStart').value,
      endMonat: q('dauerEnde').value || null,
      aktiv: true,
      geaendert: merge.jetzt()
    };

    var alt = daten.dauerauftraege.filter(function (d) { return d.id === bearbeiteDauer; })[0];

    if (bearbeiteDauer) {
      daten.dauerauftraege = daten.dauerauftraege.map(function (d) {
        return d.id === bearbeiteDauer ? Object.assign({}, d, eintrag) : d;
      });
    } else {
      daten.dauerauftraege.push(eintrag);
    }

    /* Die Buchung des laufenden Monats zieht mit - sonst bleibt die Übersicht bis
       zum Monatsende falsch. Ist die Zahlung jetzt beendet oder beginnt sie erst
       später, fällt die Buchung weg; von Hand Angepasstes bleibt (siehe model). */
    var heuteMonat = format.heuteIso().slice(0, 7);
    var abgleich = model.erzeugteBuchungAbgleichen(daten, alt, eintrag, heuteMonat, merge.jetzt());
    if (abgleich && abgleich.was === 'entfernt') grabstein(abgleich.vorher.id);

    var warBearbeitungDauer = !!bearbeiteDauer;
    sichern();
    dauerFormZuruecksetzen();
    klappe('dauerFormOeffnen', 'dauerFormBereich', false);
    q('dauerFormOeffnen').lastChild.nodeValue = ' Regelmäßige Zahlung eintragen';
    alleszeigen();

    if (abgleich) {
      var vorher = abgleich.vorher;
      var entfernt = abgleich.was === 'entfernt';
      meldung('🔁 „' + eintrag.bezeichnung + '" geändert · ' + (entfernt ? 'die' : 'auch die') + ' Buchung vom '
        + format.datum(vorher.datum) + (entfernt ? ' entfernt' : ' angepasst'), {
        text: 'Rückgängig',
        tun: function () {
          daten.dauerauftraege = daten.dauerauftraege.map(function (d) {
            return d.id === alt.id ? Object.assign({}, alt, { geaendert: merge.jetzt() }) : d;
          });
          var zurueck = Object.assign({}, vorher, { geaendert: merge.jetzt() });
          if (entfernt) {
            daten.buchungen.push(zurueck);
            grabsteinEntfernen(vorher.id);
          } else {
            daten.buchungen = daten.buchungen.map(function (b) { return b.id === vorher.id ? zurueck : b; });
          }
          if (bearbeiteDauer === alt.id) dauerFormZuruecksetzen();
          sichern();
          alleszeigen();
          meldung('↩️ Zurückgesetzt.');
        }
      });
      return;
    }
    meldung('🔁 ' + (warBearbeitungDauer ? '„' + eintrag.bezeichnung + '" geändert' : '„' + eintrag.bezeichnung + '" eingetragen')
      + ' · feste Kosten jetzt ' + format.eur(model.fixkostenProMonat(daten, 'ausgabe', heuteMonat)) + ' im Monat');
  });

  function zeigeDaueraufraege() {
    var tbody = q('dauerListe');
    leeren(tbody);
    q('dauerLeer').hidden = daten.dauerauftraege.length > 0;
    q('dauerTabelle').hidden = daten.dauerauftraege.length === 0;
    /* Der Reiter hängt nicht am geblätterten Monat: feste Kosten sind die von heute. */
    var heuteMonat = format.heuteIso().slice(0, 7);
    q('fixkostenSumme').textContent = format.eur(model.fixkostenProMonat(daten, 'ausgabe', heuteMonat)) + ' im Monat';

    var rhythmus = { monatlich: 'jeden Monat', vierteljaehrlich: 'alle 3 Monate', jaehrlich: 'einmal im Jahr' };

    daten.dauerauftraege.forEach(function (d) {
      var beendet = !!d.endMonat && d.endMonat < heuteMonat;
      var kuenftig = d.startMonat > heuteMonat;
      var tr = document.createElement('tr');
      if (!d.aktiv || beendet || kuenftig) tr.className = 'inaktiv';

      var nameZelle = neu('td', d.bezeichnung);
      if (!d.aktiv) nameZelle.appendChild(neu('span', 'pausiert', 'marke'));
      if (beendet) nameZelle.appendChild(neu('span', 'beendet', 'marke'));
      else if (d.endMonat) nameZelle.appendChild(neu('span', 'bis ' + format.monatLabel(d.endMonat), 'marke'));
      if (kuenftig) nameZelle.appendChild(neu('span', 'ab ' + format.monatLabel(d.startMonat), 'marke'));
      tr.appendChild(nameZelle);

      tr.appendChild(neu('td', rhythmus[d.intervall] || d.intervall));
      tr.appendChild(neu('td', d.tagImMonat + '.'));
      var dauerKat = model.kategorieVon(daten, d.kategorieId);
      var katZelle = document.createElement('td');
      var katHuelle = neu('span', null, 'kategorie-zelle');
      katHuelle.appendChild(neu('span', dauerKat.emoji || '🏷️', 'emoji'));
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
        d.geaendert = merge.jetzt();
        sichern();
        alleszeigen();
        var fixkosten = format.eur(model.fixkostenProMonat(daten, 'ausgabe', format.heuteIso().slice(0, 7)));
        meldung(d.aktiv
          ? '▶️ „' + d.bezeichnung + '" läuft wieder · feste Kosten ' + fixkosten + ' im Monat'
          : '⏸️ „' + d.bezeichnung + '" pausiert · feste Kosten ' + fixkosten + ' im Monat');
      });

      var loeschen = neu('button', 'Löschen', 'zeilen-knopf gefahr');
      loeschen.type = 'button';
      loeschen.addEventListener('click', function () {
        daten.dauerauftraege = daten.dauerauftraege.filter(function (x) { return x.id !== d.id; });
        grabstein(d.id);
        if (bearbeiteDauer === d.id) dauerFormZuruecksetzen();
        sichern();
        alleszeigen();

        meldung('🗑️ „' + d.bezeichnung + '" gelöscht. Bereits erzeugte Buchungen bleiben stehen.', {
          text: 'Rückgängig',
          tun: function () {
            daten.dauerauftraege.push(Object.assign({}, d, { geaendert: merge.jetzt() }));
            grabsteinEntfernen(d.id);
            sichern();
            alleszeigen();
            meldung('↩️ Wiederhergestellt.');
          }
        });
      });

      aktionen.appendChild(bearbeiten);
      aktionen.appendChild(pause);
      aktionen.appendChild(loeschen);
      tr.appendChild(aktionen);
      tbody.appendChild(tr);
    });
  }

  /* ---------------- Einstellungen ---------------- */

  q('namenLink').addEventListener('click', function () {
    tabWaehlen(q('tab-einstellungen'), false);
    q('personA').focus();
    q('personA').scrollIntoView({ block: 'center' });
  });

  q('personenForm').addEventListener('submit', function (e) {
    e.preventDefault();
    daten.einstellungen.personA = q('personA').value.trim() || store.VORGABE_NAMEN.a;
    daten.einstellungen.personB = q('personB').value.trim() || store.VORGABE_NAMEN.b;
    daten.einstellungen.geaendert = merge.jetzt();
    sichern();
    alleszeigen();
    meldung('🙋 Namen gespeichert.');
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

      var emojiFeld = document.createElement('input');
      emojiFeld.type = 'text';
      emojiFeld.value = k.emoji || '🏷️';
      emojiFeld.maxLength = 8;
      emojiFeld.className = 'kat-emoji';
      emojiFeld.setAttribute('aria-label', 'Emoji für ' + k.name);
      emojiFeld.addEventListener('change', function () {
        k.emoji = emojiFeld.value.trim() || '🏷️';
        emojiFeld.value = k.emoji;
        k.geaendert = merge.jetzt();
        sichern();
        alleszeigen();
      });
      li.appendChild(emojiFeld);

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
        k.geaendert = merge.jetzt();
        name.value = k.name;
        sichern();
        alleszeigen();
      });
      li.appendChild(name);

      li.appendChild(neu('span', k.typ === 'einnahme' ? 'Einnahme' : 'Ausgabe', 'marke'));

      li.appendChild(farbAuswahl(k.slot, function (slot) {
        k.slot = slot;
        k.geaendert = merge.jetzt();
        sichern();
        alleszeigen();
      }));

      var benutzt = daten.buchungen.filter(function (b) { return b.kategorieId === k.id; }).length
        + daten.dauerauftraege.filter(function (d) { return d.kategorieId === k.id; }).length;

      var loeschen = neu('button', 'Löschen', 'zeilen-knopf gefahr');
      loeschen.type = 'button';
      loeschen.addEventListener('click', function () {
        /* Merken, wer die Kategorie trug - fürs Rückgängigmachen. */
        var betroffeneBuchungen = daten.buchungen.filter(function (b) { return b.kategorieId === k.id; })
          .map(function (b) { return b.id; });
        var betroffeneDauer = daten.dauerauftraege.filter(function (d) { return d.kategorieId === k.id; })
          .map(function (d) { return d.id; });

        daten.kategorien = daten.kategorien.filter(function (x) { return x.id !== k.id; });
        grabstein(k.id);
        daten.buchungen.forEach(function (b) {
          if (b.kategorieId === k.id) { b.kategorieId = null; b.geaendert = merge.jetzt(); }
        });
        daten.dauerauftraege.forEach(function (d) {
          if (d.kategorieId === k.id) { d.kategorieId = null; d.geaendert = merge.jetzt(); }
        });
        sichern();
        alleszeigen();

        meldung(benutzt
          ? '„' + k.name + '" gelöscht. ' + benutzt + ' Einträge stehen jetzt unter „Ohne Kategorie".'
          : '„' + k.name + '" gelöscht.', {
          text: 'Rückgängig',
          tun: function () {
            daten.kategorien.push(Object.assign({}, k, { geaendert: merge.jetzt() }));
            grabsteinEntfernen(k.id);
            daten.buchungen.forEach(function (b) {
              if (betroffeneBuchungen.indexOf(b.id) !== -1) { b.kategorieId = k.id; b.geaendert = merge.jetzt(); }
            });
            daten.dauerauftraege.forEach(function (d) {
              if (betroffeneDauer.indexOf(d.id) !== -1) { d.kategorieId = k.id; d.geaendert = merge.jetzt(); }
            });
            sichern();
            alleszeigen();
            meldung('↩️ Wiederhergestellt.');
          }
        });
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
      slot: parseInt(q('katSlot').value, 10) || 8,
      emoji: q('katEmoji').value.trim() || '🏷️',
      geaendert: merge.jetzt()
    });
    q('katName').value = '';
    q('katEmoji').value = '🏷️';
    sichern();
    alleszeigen();
    meldung('🎨 Kategorie „' + name + '" angelegt.');
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
        + importStand.dauerauftraege.length + ' regelmäßige Zahlungen, ' + importStand.kategorien.length
        + ' Kategorien. Damit wird der jetzige Stand in diesem Browser ersetzt.';
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
      + importStand.dauerauftraege.length + ' regelmäßige Zahlungen, ' + importStand.kategorien.length
      + ' Kategorien. Damit wird der jetzige Stand in diesem Browser ersetzt.';
  });

  q('importBestaetigen').addEventListener('click', function () {
    if (!importStand) return;
    daten = importStand;
    importStand = null;
    q('importVorschau').hidden = true;
    q('textBereich').hidden = true;
    sichern();
    diagrammeAnimieren = true;
    alleszeigen();
    meldung('💾 Sicherung übernommen: ' + daten.buchungen.length + ' Buchungen.');
  });

  q('importAbbrechen').addEventListener('click', function () {
    importStand = null;
    q('importVorschau').hidden = true;
  });

  q('loeschenKnopf').addEventListener('click', function () {
    if (!global.confirm('Wirklich alle Buchungen, regelmäßigen Zahlungen und Einstellungen löschen? Das lässt sich nicht rückgängig machen.')) return;
    store.alleLoeschen();
    daten = store.leereDaten();
    sichern();
    alleszeigen();
  });

  q('demoKnopf').addEventListener('click', function () {
    var heute = format.heuteIso();
    var heuteMonat = heute.slice(0, 7);
    /* In der Zukunft trägt faelligesNachtragen nichts nach - der Beispielmonat
       landet deshalb spätestens im laufenden Monat. */
    var monat = aktuellerMonat > heuteMonat ? heuteMonat : aktuellerMonat;
    var heuteTag = parseInt(heute.slice(8, 10), 10);

    var beispiele = [
      { tag: '01', art: 'einnahme', betrag: 214000, kategorieId: 'kat_gehalt', notiz: 'Gehalt', person: 'b' },
      { tag: '05', art: 'ausgabe', betrag: 8740, kategorieId: 'kat_lebensmittel', notiz: 'REWE Wocheneinkauf', person: 'b', fuer: 'beide' },
      { tag: '09', art: 'ausgabe', betrag: 6520, kategorieId: 'kat_mobilitaet', notiz: 'Tanken', person: 'a', fuer: 'a' },
      { tag: '12', art: 'ausgabe', betrag: 12300, kategorieId: 'kat_lebensmittel', notiz: 'Großeinkauf', person: 'gemeinsam' },
      { tag: '14', art: 'ausgabe', betrag: 4500, kategorieId: 'kat_freizeit', notiz: 'Kino und Essen', person: 'gemeinsam' },
      { tag: '18', art: 'ausgabe', betrag: 21000, kategorieId: 'kat_versicherung', notiz: 'Haftpflicht', person: 'a', fuer: 'beide' },
      { tag: '24', art: 'ausgabe', betrag: 7600, kategorieId: 'kat_gesundheit', notiz: 'Apotheke', person: 'b', fuer: 'b' }
    ];
    /* Was jeden Monat von allein kommt, steht als regelmäßige Zahlung - so zeigt
       der Beispielmonat auch Abbuchungstag und „Geht noch ab“. Strom liegt bewusst
       ein paar Tage in der Zukunft. */
    var beispielDauer = [
      { bezeichnung: 'Gehalt', art: 'einnahme', betrag: 285000, kategorieId: 'kat_gehalt', person: 'a', tagImMonat: 1 },
      { bezeichnung: 'Miete', art: 'ausgabe', betrag: 128000, kategorieId: 'kat_wohnen', person: 'gemeinsam', tagImMonat: 1 },
      { bezeichnung: 'Internet', art: 'ausgabe', betrag: 9850, kategorieId: 'kat_abos', person: 'gemeinsam', tagImMonat: 3 },
      { bezeichnung: 'Strom', art: 'ausgabe', betrag: 9000, kategorieId: 'kat_wohnen', person: 'gemeinsam', tagImMonat: Math.min(heuteTag + 3, model.tageImMonat(monat)) }
    ];

    var vorher = daten.buchungen.length;
    var neueBuchungen = [];
    var neueDauer = [];

    beispiele.forEach(function (b) {
      var id = store.neueId('b');
      neueBuchungen.push(id);
      daten.buchungen.push({
        id: id,
        geaendert: merge.jetzt(),
        datum: monat + '-' + b.tag,
        art: b.art,
        betrag: b.betrag,
        kategorieId: b.kategorieId,
        notiz: b.notiz,
        person: b.person,
        fuer: model.fuerVon(b),
        quelle: null
      });
    });
    beispielDauer.forEach(function (d) {
      var id = store.neueId('d');
      neueDauer.push(id);
      daten.dauerauftraege.push({
        id: id,
        geaendert: merge.jetzt(),
        bezeichnung: d.bezeichnung,
        art: d.art,
        betrag: d.betrag,
        kategorieId: d.kategorieId,
        person: d.person,
        /* Wie im Formular: Einnahme und gemeinsamer Topf haben nichts aufzuteilen. */
        fuer: 'beide',
        tagImMonat: d.tagImMonat,
        intervall: 'monatlich',
        startMonat: monat,
        endMonat: null,
        aktiv: true
      });
    });
    faelligesNachtragen(monat);
    sichern();
    monatSetzen(monat);

    meldung('🧪 Beispielmonat angelegt: ' + (daten.buchungen.length - vorher) + ' Buchungen, '
      + neueDauer.length + ' regelmäßige Zahlungen', {
      text: 'Rückgängig',
      tun: function () {
        /* Auch die aus den Beispiel-Zahlungen erzeugten Buchungen gehen mit -
           sonst liefe eine erfundene Miete in echte Folgemonate. */
        daten.buchungen = daten.buchungen.filter(function (b) {
          var weg = neueBuchungen.indexOf(b.id) !== -1
            || !!(b.quelle && neueDauer.indexOf(b.quelle.dauerId) !== -1);
          if (weg) grabstein(b.id);
          return !weg;
        });
        daten.dauerauftraege = daten.dauerauftraege.filter(function (d) { return neueDauer.indexOf(d.id) === -1; });
        neueDauer.forEach(grabstein);
        if (bearbeiteBuchung && !daten.buchungen.some(function (b) { return b.id === bearbeiteBuchung; })) buchungFormZuruecksetzen();
        if (bearbeiteDauer && neueDauer.indexOf(bearbeiteDauer) !== -1) dauerFormZuruecksetzen();
        sichern();
        diagrammeAnimieren = true;
        alleszeigen();
        meldung('↩️ Beispielmonat entfernt.');
      }
    });
  });

  /* ---------------- Gemeinsamer Stand ---------------- */

  var abgleichLaeuft = false;
  var abgleichGeplant = null;
  var abgleichTakt = null;

  function statusZeigen(text, art) {
    var zeile = q('abgleichStatus');
    zeile.hidden = !text;
    zeile.textContent = text || '';
    zeile.className = 'abgleich-status' + (art ? ' ' + art : '');
  }

  function wolkeFehlerZeigen(text) {
    var feld = q('wolkeFehler');
    feld.hidden = !text;
    feld.textContent = text || '';
  }

  /* Holen, mit dem eigenen Stand zusammenführen, zurückschreiben.
     Der Abgleich ist absichtlich in dieser Reihenfolge: erst lesen, dann
     mischen, dann schreiben - so überschreibt niemand die Einträge des anderen. */
  async function abgleichen(stillOderLaut) {
    if (!wolke.eingerichtet() || !wolke.angemeldet() || abgleichLaeuft) return;
    abgleichLaeuft = true;
    if (stillOderLaut !== 'still') statusZeigen('Gleicht ab …', 'laeuft');

    try {
      var fern = await wolke.holen();
      var gemischt = merge.staendeMischen(daten, fern);
      var veraendert = JSON.stringify(gemischt) !== JSON.stringify(daten);

      daten = store.migrieren(gemischt);
      store.speichern(daten);
      await wolke.sichern(daten);

      if (veraendert) alleszeigen();
      statusZeigen('Gemeinsamer Stand · zuletzt ' + new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }));
      wolkeFehlerZeigen('');
    } catch (fehler) {
      /* Kein Netz ist kein Drama: lokal ist alles gespeichert, der nächste
         Versuch holt es nach. */
      statusZeigen('Nicht abgeglichen – letzter Versuch fehlgeschlagen', 'fehler');
      if (stillOderLaut !== 'still') wolkeFehlerZeigen('Abgleich fehlgeschlagen: ' + fehler.message);
    } finally {
      abgleichLaeuft = false;
    }
  }

  /* Nach einer Änderung kurz warten, damit eine Folge von Eingaben
     zu einem einzigen Abgleich wird. */
  function abgleichAnstossen() {
    if (!wolke.eingerichtet() || !wolke.angemeldet()) return;
    clearTimeout(abgleichGeplant);
    abgleichGeplant = setTimeout(function () { abgleichen('still'); }, 1500);
  }

  function wolkeAnsichtSetzen() {
    if (!wolke.eingerichtet()) return;
    q('wolkeKarte').hidden = false;

    var an = wolke.angemeldet();
    q('wolkeForm').hidden = an;
    q('wolkeAngemeldet').hidden = !an;
    if (an) {
      q('wolkeStatus').textContent = 'Angemeldet als ' + wolke.benutzer()
        + '. Änderungen gehen automatisch an den gemeinsamen Stand.';
    } else {
      statusZeigen('');
    }
  }

  function taktSetzen() {
    clearInterval(abgleichTakt);
    if (!wolke.eingerichtet() || !wolke.angemeldet()) return;
    /* Alle 25 Sekunden nachschauen, ob der andere etwas eingetragen hat. */
    abgleichTakt = setInterval(function () {
      if (!document.hidden) abgleichen('still');
    }, 25000);
  }

  if (global.HB.wolke.eingerichtet()) {
    q('wolkeForm').addEventListener('submit', async function (e) {
      e.preventDefault();
      wolkeFehlerZeigen('');
      try {
        await wolke.anmelden(q('wolkeEmail').value.trim(), q('wolkePasswort').value);
        q('wolkePasswort').value = '';
        wolkeAnsichtSetzen();
        taktSetzen();
        await abgleichen();
      } catch (fehler) {
        wolkeFehlerZeigen('Anmeldung fehlgeschlagen: ' + fehler.message);
      }
    });

    q('wolkeRegistrieren').addEventListener('click', async function () {
      wolkeFehlerZeigen('');
      var meldung = q('wolkeMeldung');
      meldung.hidden = true;

      var email = q('wolkeEmail').value.trim();
      var passwort = q('wolkePasswort').value;
      if (!email || passwort.length < 6) {
        wolkeFehlerZeigen('Bitte E-Mail eintragen und ein Passwort mit mindestens sechs Zeichen wählen.');
        return;
      }

      try {
        var ergebnis = await wolke.registrieren(email, passwort);
        q('wolkePasswort').value = '';
        if (ergebnis.angemeldet) {
          wolkeAnsichtSetzen();
          taktSetzen();
          await abgleichen();
          return;
        }
        meldung.hidden = false;
        meldung.textContent = 'Konto angelegt. Schau in dein E-Mail-Postfach und klick den Bestätigungslink – '
          + 'danach hier anmelden.';
      } catch (fehler) {
        wolkeFehlerZeigen('Konto anlegen fehlgeschlagen: ' + fehler.message);
      }
    });

    q('wolkeAbmelden').addEventListener('click', function () {
      wolke.abmelden();
      clearInterval(abgleichTakt);
      statusZeigen('');
      wolkeAnsichtSetzen();
    });

    q('wolkeJetzt').addEventListener('click', function () { abgleichen(); });

    /* Beim Zurückkehren auf die Seite sofort nachschauen. */
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) abgleichen('still');
    });
  }

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
    daten.kategorien.forEach(function (k) {
      q('filterKategorie').appendChild(option(k.id, (k.emoji || '🏷️') + '  ' + k.name));
    });
    q('filterKategorie').value = filterKat;

    fuellePersonen(q('buchungPerson'), false, q('buchungPerson').value);
    fuellePersonen(q('dauerPerson'), false, q('dauerPerson').value);
    fuellePersonen(q('filterPerson'), true, q('filterPerson').value);
    fuellePersonenFuer(q('buchungFuer'), q('buchungFuer').value);
    fuellePersonenFuer(q('dauerFuer'), q('dauerFuer').value);
    buchungFuerSchalten();
    dauerFuerSchalten();

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
  q('bilanz').hidden = q('tab-uebersicht').getAttribute('aria-selected') !== 'true';
  wolkeAnsichtSetzen();
  taktSetzen();
  abgleichen('still');
  geteiltesPruefen();

  /* Service Worker: macht die App installierbar und offline lauffähig.
     Nur auf einer echten Adresse und nicht in einer eingebetteten Ansicht -
     dort ist die Registrierung ohnehin gesperrt. */
  if (global.navigator && 'serviceWorker' in global.navigator
      && global.location.protocol.indexOf('http') === 0
      && global.top === global.self) {
    /* Gab es schon einen Service Worker, bedeutet ein Wechsel: neue Fassung da.
       Dann einmal neu laden, damit sie sofort sichtbar wird - sonst zeigte die
       App die alte Gestaltung, bis man sie zweimal startet. */
    var hatteBereitsEinen = !!global.navigator.serviceWorker.controller;
    var schonNeuGeladen = false;

    global.navigator.serviceWorker.addEventListener('controllerchange', function () {
      if (!hatteBereitsEinen || schonNeuGeladen) return;
      schonNeuGeladen = true;
      global.location.reload();
    });

    global.addEventListener('load', function () {
      global.navigator.serviceWorker.register('sw.js').then(function (anmeldung) {
        /* Beim Öffnen nachsehen, ob es eine neue Fassung gibt. */
        anmeldung.update().catch(function () { /* ohne Netz nicht möglich */ });
      }).catch(function () {
        /* Ohne Service Worker läuft die App genauso, nur nicht offline. */
      });
    });
  }
})(window);
