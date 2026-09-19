/* Diagramme von Hand: keine Bibliothek, kein CDN.
   Farben kommen als CSS-Variablen (--serie-1..8) aus styles.css, damit der
   Dunkelmodus eigene, gegen den dunklen Hintergrund geprüfte Farbwerte bekommt. */
(function (global) {
  'use strict';

  var SVG_NS = 'http://www.w3.org/2000/svg';
  var format = global.HB.format;

  function farbe(slot) {
    return 'var(--serie-' + (slot > 0 ? slot : 'neutral') + ')';
  }

  function leeren(el) {
    while (el.firstChild) el.removeChild(el.firstChild);
  }

  function element(tag, klasse, text) {
    var el = document.createElement(tag);
    if (klasse) el.className = klasse;
    if (text != null) el.textContent = text; /* nie innerHTML: Notizen sind Nutzereingabe */
    return el;
  }

  function svgElement(tag, attribute) {
    var el = document.createElementNS(SVG_NS, tag);
    Object.keys(attribute || {}).forEach(function (name) {
      el.setAttribute(name, attribute[name]);
    });
    return el;
  }

  function hinweis(el, text) {
    leeren(el);
    el.appendChild(element('p', 'leer-hinweis', text));
  }

  /* Ein Tooltip-Element für alle Diagramme, am Zeiger ausgerichtet. */
  var tooltip = null;
  function tooltipZeigen(text, x, y) {
    if (!tooltip) {
      tooltip = element('div', 'diagramm-tooltip');
      tooltip.setAttribute('role', 'status');
      document.body.appendChild(tooltip);
    }
    tooltip.textContent = text;
    tooltip.style.left = x + 'px';
    tooltip.style.top = y + 'px';
    tooltip.hidden = false;
    /* Ein Bildaufbau Verzögerung, sonst greift der Übergang beim ersten Mal nicht. */
    requestAnimationFrame(function () { tooltip.classList.add('sichtbar'); });
  }
  function tooltipVerbergen() {
    if (!tooltip) return;
    tooltip.classList.remove('sichtbar');
    tooltip.hidden = true;
  }
  function tooltipAn(el, text) {
    el.addEventListener('mouseenter', function (e) { tooltipZeigen(text, e.clientX + 12, e.clientY + 12); });
    el.addEventListener('mousemove', function (e) { tooltipZeigen(text, e.clientX + 12, e.clientY + 12); });
    el.addEventListener('mouseleave', tooltipVerbergen);
    el.addEventListener('focus', function () {
      var r = el.getBoundingClientRect();
      tooltipZeigen(text, r.left, r.bottom + 6);
    });
    el.addEventListener('blur', tooltipVerbergen);
    el.tabIndex = 0;
  }

  /* Waagerechte Balken, absteigend, mit Name und Betrag direkt am Balken.
     Direktbeschriftung ist hier Pflicht: einzelne Palettenfarben liegen im hellen
     Modus unter 3:1 Kontrast, die Farbe allein darf die Aussage nicht tragen. */
  function kategorieBalken(el, eintraege) {
    leeren(el);
    if (!eintraege.length) {
      hinweis(el, 'Für diesen Monat sind noch keine Ausgaben erfasst.');
      return;
    }
    var groesster = eintraege[0].betrag || 1;
    var liste = element('ul', 'balken-liste');

    eintraege.forEach(function (eintrag) {
      var zeile = element('li', 'balken-zeile');

      var kopf = element('div', 'balken-kopf');
      var name = element('span', 'balken-name');
      /* Kein Farbpunkt: Der Balken darunter trägt die Farbe bereits. */
      name.appendChild(element('span', 'emoji', eintrag.emoji || '🏷️'));
      name.appendChild(document.createTextNode(eintrag.name));
      kopf.appendChild(name);

      var wert = element('span', 'balken-wert');
      wert.appendChild(element('strong', null, format.eur(eintrag.betrag)));
      wert.appendChild(element('span', 'anteil', format.prozent(eintrag.anteil)));
      kopf.appendChild(wert);

      var spur = element('div', 'balken-spur');
      var fuellung = element('div', 'balken-fuellung');
      fuellung.style.width = Math.max(2, (eintrag.betrag / groesster) * 100) + '%';
      fuellung.style.background = farbe(eintrag.slot);
      spur.appendChild(fuellung);

      tooltipAn(zeile, eintrag.name + ': ' + format.eur(eintrag.betrag) +
        ' (' + format.prozent(eintrag.anteil) + ', ' + eintrag.anzahl + ' Buchungen)');

      zeile.appendChild(kopf);
      zeile.appendChild(spur);
      liste.appendChild(zeile);
    });

    el.appendChild(liste);
  }

  /* Gestapelter Balken für die Aufteilung nach Person, mit Legende statt Farbe allein. */
  function personBalken(el, eintraege) {
    leeren(el);
    var gesamt = eintraege.reduce(function (s, e) { return s + e.betrag; }, 0);
    if (!gesamt) {
      hinweis(el, 'Noch keine Ausgaben in diesem Monat.');
      return;
    }

    var stapel = element('div', 'stapel');
    var legende = element('ul', 'legende');

    eintraege.forEach(function (eintrag, i) {
      var slot = [1, 5, 3][i] || 8;
      if (eintrag.betrag > 0) {
        var teil = element('div', 'stapel-teil');
        teil.style.width = (eintrag.betrag / gesamt) * 100 + '%';
        teil.style.background = farbe(slot);
        tooltipAn(teil, eintrag.name + ': ' + format.eur(eintrag.betrag) + ' (' + format.prozent(eintrag.anteil) + ')');
        stapel.appendChild(teil);
      }
      var punkt = element('span', 'farb-punkt');
      punkt.style.background = farbe(slot);
      var li = element('li', null);
      li.appendChild(punkt);
      li.appendChild(document.createTextNode(eintrag.name + ' · '));
      li.appendChild(element('strong', null, format.eur(eintrag.betrag)));
      legende.appendChild(li);
    });

    el.appendChild(stapel);
    el.appendChild(legende);
  }

  /* Monatsvergleich: zwei Reihen (Einnahmen, Ausgaben) als gruppierte Säulen.
     Eine einzige Werteachse - zwei Skalen wären an dieser Stelle irreführend. */
  function verlaufBalken(el, reihe) {
    leeren(el);
    var maximum = reihe.reduce(function (m, p) { return Math.max(m, p.einnahmen, p.ausgaben); }, 0);
    if (!maximum) {
      hinweis(el, 'Sobald mehrere Monate erfasst sind, erscheint hier der Vergleich.');
      return;
    }

    /* Die Zeichenfläche skaliert auf die Breite des Blattes. Bei einem festen
       Koordinatensystem von 640 schrumpfte die Beschriftung auf dem Handy auf
       etwa 6 Pixel - deshalb wird das System selbst schmaler. */
    var schmal = el.clientWidth && el.clientWidth < 460;
    var B = schmal ? 330 : 640;
    var H = schmal ? 210 : 240;
    var obenAbstand = 16, untenAbstand = 34, linksAbstand = 8;
    var zeichenHoehe = H - obenAbstand - untenAbstand;
    var gruppenBreite = (B - linksAbstand * 2) / reihe.length;
    var balkenBreite = Math.min(26, (gruppenBreite - (schmal ? 6 : 10)) / 2);

    var svg = svgElement('svg', {
      viewBox: '0 0 ' + B + ' ' + H, class: 'verlauf-svg',
      role: 'img', 'aria-label': 'Einnahmen und Ausgaben der letzten ' + reihe.length + ' Monate'
    });

    /* Zurückhaltende Hilfslinien bei Hälfte und Maximum */
    [0.5, 1].forEach(function (anteil) {
      var y = obenAbstand + zeichenHoehe - zeichenHoehe * anteil;
      svg.appendChild(svgElement('line', {
        x1: linksAbstand, x2: B - linksAbstand, y1: y, y2: y, class: 'gitterlinie'
      }));
      var beschriftung = svgElement('text', { x: linksAbstand, y: y - 4, class: 'achsen-text' });
      beschriftung.textContent = format.eur(Math.round(maximum * anteil));
      svg.appendChild(beschriftung);
    });

    reihe.forEach(function (punkt, i) {
      var mitte = linksAbstand + gruppenBreite * i + gruppenBreite / 2;
      var basis = obenAbstand + zeichenHoehe;

      [
        { wert: punkt.einnahmen, slot: 1, name: 'Einnahmen', versatz: -balkenBreite - 1 },
        { wert: punkt.ausgaben, slot: 2, name: 'Ausgaben', versatz: 1 }
      ].forEach(function (serie) {
        var hoehe = Math.max(serie.wert > 0 ? 3 : 0, (serie.wert / maximum) * zeichenHoehe);
        if (!hoehe) return;
        var rect = svgElement('rect', {
          x: mitte + serie.versatz, y: basis - hoehe, width: balkenBreite, height: hoehe,
          rx: 3, fill: farbe(serie.slot), tabindex: '0', class: 'saeule',
          style: 'animation-delay: ' + (i * 60 + 40) + 'ms'
        });
        tooltipAn(rect, format.monatLabel(punkt.monat) + ' · ' + serie.name + ': ' + format.eur(serie.wert));
        svg.appendChild(rect);
      });

      var monatsText = svgElement('text', {
        x: mitte, y: H - 12, class: 'achsen-text', 'text-anchor': 'middle'
      });
      monatsText.textContent = format.monatLabel(punkt.monat).slice(0, 3) + ' ' + punkt.monat.slice(2, 4);
      svg.appendChild(monatsText);
    });

    el.appendChild(svg);

    var legende = element('ul', 'legende');
    [{ name: 'Einnahmen', slot: 1 }, { name: 'Ausgaben', slot: 2 }].forEach(function (serie) {
      var punkt = element('span', 'farb-punkt');
      punkt.style.background = farbe(serie.slot);
      var li = element('li', null);
      li.appendChild(punkt);
      li.appendChild(document.createTextNode(serie.name));
      legende.appendChild(li);
    });
    el.appendChild(legende);
  }

  global.HB = global.HB || {};
  global.HB.charts = {
    kategorieBalken: kategorieBalken,
    personBalken: personBalken,
    verlaufBalken: verlaufBalken,
    farbe: farbe
  };
})(window);
