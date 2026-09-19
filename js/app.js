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
      : 'Achtung: Dieser Browser speichert nichts dauerhaft (privates Fenster?). Bitte vor dem Schließen ein Backup exportieren.';
    hinweis.className = erfolg ? '' : 'fehler';
    abgleichAnstossen();
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
      .forEach(function (k) { select.appendChild(option(k.id, (k.emoji || '🏷️') + '  ' + k.name)); });
    if (gewaehlt) select.value = gewaehlt;
  }

  var PERSON_EMOJI = { a: '👤', b: '👤', gemeinsam: '👥' };

  function fuellePersonen(select, mitAlle, gewaehlt) {
    leeren(select);
    if (mitAlle) select.appendChild(option('', 'Alle'));
    ['a', 'b', 'gemeinsam'].forEach(function (p) {
      select.appendChild(option(p, PERSON_EMOJI[p] + '  ' + personName(p)));
    });
    select.value = gewaehlt || (mitAlle ? '' : 'gemeinsam');
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
    diagrammeAnimieren = true;
    alleszeigen();
  }

  q('buchungFormOeffnen').addEventListener('click', function () {
    var offen = klappe('buchungFormOeffnen', 'buchungFormBereich');
    q('buchungFormOeffnen').lastChild.nodeValue = offen ? ' Formular zuklappen' : ' Neue Buchung eintragen';
    if (offen) q('buchungBetrag').focus();
  });

  q('dauerFormOeffnen').addEventListener('click', function () {
    var offen = klappe('dauerFormOeffnen', 'dauerFormBereich');
    q('dauerFormOeffnen').lastChild.nodeValue = offen ? ' Formular zuklappen' : ' Regelmäßige Zahlung eintragen';
    if (offen) q('dauerBezeichnung').focus();
  });

  q('filterOeffnen').addEventListener('click', function () {
    var offen = klappe('filterOeffnen', 'filterBereich');
    q('filterOeffnen').textContent = offen ? 'Filter zuklappen' : 'Filtern und suchen';
  });

  q('kategorieMehr').addEventListener('click', function () {
    var bereich = q('kategorieDiagramm');
    var alle = bereich.classList.toggle('alle');
    q('kategorieMehr').textContent = alle ? 'Nur die größten fünf zeigen' : 'Alle Kategorien anzeigen';
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

    zaehleHoch(q('kzEinnahmen'), u.einnahmen, format.eur);
    zaehleHoch(q('kzAusgaben'), u.ausgaben, format.eur);

    var saldo = q('kzSaldo');
    zaehleHoch(saldo, u.saldo, format.eur);
    saldo.className = 'hero-zahl';
    saldo.parentNode.classList.toggle('negativ', u.saldo < 0);
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
      q('geplantSumme').textContent = format.eur(u.geplanteAusgaben);
      q('geplantFuss').textContent = 'stehen noch aus · in diesem Monat bereits gebucht: '
        + format.eur(u.gebuchteAusgaben);
      u.geplanteBuchungen.forEach(function (b) {
        var li = document.createElement('li');
        li.appendChild(neu('span', format.datum(b.datum) + ' · ' + (b.notiz || model.kategorieVon(daten, b.kategorieId).name)));
        li.appendChild(neu('strong', format.eur(b.betrag)));
        geplantListe.appendChild(li);
      });
    } else {
      q('geplantSumme').textContent = format.eur(0);
      q('geplantFuss').textContent = 'Für den Rest des Monats steht nichts mehr aus.';
    }

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
        frischeZeile = b.id;
        sichern();
        alleszeigen();
        meldung('↩️ Wiederhergestellt.');
      }
    });
  }

  q('buchungArt').addEventListener('change', function () {
    fuelleKategorien(q('buchungKategorie'), q('buchungArt').value);
  });

  q('buchungAbbrechen').addEventListener('click', function () {
    buchungFormZuruecksetzen();
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
      quelle: null,
      geaendert: merge.jetzt()
    };

    if (bearbeiteBuchung) {
      daten.buchungen = daten.buchungen.map(function (b) {
        return b.id === bearbeiteBuchung ? Object.assign({}, b, eintrag) : b;
      });
    } else {
      daten.buchungen.push(eintrag);
    }

    var warBearbeitung = !!bearbeiteBuchung;
    aktuellerMonat = eintrag.datum.slice(0, 7);
    frischeZeile = eintrag.id;
    sichern();
    buchungFormZuruecksetzen();
    klappe('buchungFormOeffnen', 'buchungFormBereich', false);
    q('buchungFormOeffnen').lastChild.nodeValue = ' Neue Buchung eintragen';
    alleszeigen();

    /* Sagen, was die Buchung bewirkt hat - sonst ändert sich die Übersicht
       unbemerkt im Hintergrund. */
    var stand = model.monatsUebersicht(daten, aktuellerMonat);
    meldung((warBearbeitung ? '✏️ Geändert' : '✅ Gespeichert')
      + ': ' + (eintrag.art === 'einnahme' ? '+ ' : '− ') + format.eur(eintrag.betrag)
      + ' · bleibt diesen Monat ' + format.eur(stand.saldo));
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

      tr.appendChild(neu('td', format.datum(b.datum)));

      var notizZelle = neu('td', b.notiz || '–');
      if (b.quelle) notizZelle.appendChild(neu('span', 'Dauerauftrag', 'marke'));
      if (b.datum > heute) notizZelle.appendChild(neu('span', 'geplant', 'marke'));
      tr.appendChild(notizZelle);

      var katZelle = document.createElement('td');
      var huelle = neu('span', null, 'kategorie-zelle');
      huelle.appendChild(neu('span', kat.emoji || '🏷️', 'emoji'));
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
      var verschicken = neu('button', 'Teilen', 'zeilen-knopf');
      verschicken.type = 'button';
      verschicken.addEventListener('click', function () { buchungTeilen(b); });

      var loeschen = neu('button', 'Löschen', 'zeilen-knopf gefahr');
      loeschen.type = 'button';
      loeschen.addEventListener('click', function () { buchungLoeschen(b); });
      aktionen.appendChild(bearbeiten);
      aktionen.appendChild(verschicken);
      aktionen.appendChild(loeschen);
      tr.appendChild(aktionen);

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
    q('dauerTag').value = '1';
    q('dauerIntervall').value = 'monatlich';
    q('dauerStart').value = aktuellerMonat;
    q('dauerEnde').value = '';
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
  });

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
      tagImMonat: tag,
      intervall: q('dauerIntervall').value,
      startMonat: q('dauerStart').value,
      endMonat: q('dauerEnde').value || null,
      aktiv: true,
      geaendert: merge.jetzt()
    };

    if (bearbeiteDauer) {
      daten.dauerauftraege = daten.dauerauftraege.map(function (d) {
        return d.id === bearbeiteDauer ? Object.assign({}, d, eintrag) : d;
      });
    } else {
      daten.dauerauftraege.push(eintrag);
    }

    var warBearbeitungDauer = !!bearbeiteDauer;
    sichern();
    dauerFormZuruecksetzen();
    klappe('dauerFormOeffnen', 'dauerFormBereich', false);
    q('dauerFormOeffnen').lastChild.nodeValue = ' Regelmäßige Zahlung eintragen';
    alleszeigen();

    meldung((warBearbeitungDauer ? '„' + eintrag.bezeichnung + '" geändert' : '„' + eintrag.bezeichnung + '" eingetragen')
      + ' · feste Kosten jetzt ' + format.eur(model.fixkostenProMonat(daten, 'ausgabe')) + ' im Monat');
  });

  function zeigeDaueraufraege() {
    var tbody = q('dauerListe');
    leeren(tbody);
    q('dauerLeer').hidden = daten.dauerauftraege.length > 0;
    q('dauerTabelle').hidden = daten.dauerauftraege.length === 0;
    q('fixkostenSumme').textContent = format.eur(model.fixkostenProMonat(daten, 'ausgabe')) + ' im Monat';

    var rhythmus = { monatlich: 'jeden Monat', vierteljaehrlich: 'alle 3 Monate', jaehrlich: 'einmal im Jahr' };

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
        meldung(d.aktiv
          ? '„' + d.bezeichnung + '" läuft wieder · feste Kosten ' + format.eur(model.fixkostenProMonat(daten, 'ausgabe')) + ' im Monat'
          : '„' + d.bezeichnung + '" pausiert · feste Kosten ' + format.eur(model.fixkostenProMonat(daten, 'ausgabe')) + ' im Monat');
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

  q('personenForm').addEventListener('submit', function (e) {
    e.preventDefault();
    daten.einstellungen.personA = q('personA').value.trim() || 'Ich';
    daten.einstellungen.personB = q('personB').value.trim() || 'Partnerin';
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
    diagrammeAnimieren = true;
    alleszeigen();
    meldung('💾 Sicherung übernommen: ' + daten.buchungen.length + ' Buchungen.');
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
    var vorher = daten.buchungen.length;
    beispiele.forEach(function (b) {
      daten.buchungen.push({
        id: store.neueId('b'),
        geaendert: merge.jetzt(),
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
    diagrammeAnimieren = true;
    alleszeigen();
    meldung('🧪 ' + (daten.buchungen.length - vorher) + ' Beispielbuchungen angelegt.');
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
    global.addEventListener('load', function () {
      global.navigator.serviceWorker.register('sw.js').catch(function () {
        /* Ohne Service Worker läuft die App genauso, nur nicht offline. */
      });
    });
  }
})(window);
