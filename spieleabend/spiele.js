/* Oberfläche des Spieleabends: Menü, Spieler und die fünf Spiele.
   Die Regeln stecken in logik.js, die Begriffe in woerter.js. */
(function () {
  'use strict';

  var L = window.SA.logik;
  var W = window.SA.woerter;
  var app = document.getElementById('app');
  var zufall = Math.random;

  /* ---------- Kleine Helfer ---------- */

  function esc(text) {
    return String(text).replace(/[&<>"']/g, function (z) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[z];
    });
  }

  function $(sel, wurzel) { return (wurzel || document).querySelector(sel); }
  function $$(sel, wurzel) { return Array.prototype.slice.call((wurzel || document).querySelectorAll(sel)); }

  /* Alles, was ein Bildschirm startet (Timer, Sensoren), wird beim Wechsel
     wieder abgeräumt – sonst tickt die Bombe im Menü weiter. */
  var aufraeumer = [];
  function spaeter(fn, ms) { var id = setTimeout(fn, ms); aufraeumer.push(function () { clearTimeout(id); }); return id; }
  function immer(fn, ms) { var id = setInterval(fn, ms); aufraeumer.push(function () { clearInterval(id); }); return id; }
  function beimVerlassen(fn) { aufraeumer.push(fn); }
  function aufraeumen() { var liste = aufraeumer; aufraeumer = []; liste.forEach(function (fn) { try { fn(); } catch (e) { /* egal */ } }); }

  function zeige(html) {
    aufraeumen();
    app.innerHTML = html;
    window.scrollTo(0, 0);
  }

  function kopf(titel) {
    return '<div class="kopf"><button class="zurueck" data-menue aria-label="Zurück zum Menü">←</button><h2>' + titel + '</h2></div>';
  }

  function klick(sel, fn) { $$(sel, app).forEach(function (el) { el.addEventListener('click', fn); }); }

  function menueKnoepfe() { klick('[data-menue]', zumMenue); }

  /* ---------- Speicher (nur Bequemlichkeit, darf fehlen) ---------- */

  var SCHLUESSEL = 'spieleabend.spieler';
  function spielerLaden() {
    try { var roh = localStorage.getItem(SCHLUESSEL); return roh ? L.spielerBereinigen(JSON.parse(roh)) : []; }
    catch (e) { return []; }
  }
  function spielerSpeichern() {
    try { localStorage.setItem(SCHLUESSEL, JSON.stringify(spieler)); } catch (e) { /* privat-Modus */ }
  }
  var spieler = spielerLaden();

  /* ---------- Ton, Vibration, Bildschirm wach halten ---------- */

  var audio = null;
  function audioBereit() {
    if (!audio) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      audio = new AC();
    }
    if (audio.state === 'suspended') audio.resume();
    return audio;
  }
  document.addEventListener('pointerdown', audioBereit, { once: true });

  function ton(freq, dauer, typ, laut) {
    var ac = audioBereit();
    if (!ac) return;
    var osc = ac.createOscillator(), gain = ac.createGain(), t = ac.currentTime;
    osc.type = typ || 'sine';
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(laut || 0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + (dauer || 0.15));
    osc.connect(gain).connect(ac.destination);
    osc.start(t);
    osc.stop(t + (dauer || 0.15) + 0.02);
  }
  function jingle(freqs, abstand) { freqs.forEach(function (f, i) { setTimeout(function () { ton(f, 0.18, 'triangle', 0.22); }, i * (abstand || 110)); }); }
  function knall() {
    var ac = audioBereit();
    if (!ac) return;
    var laenge = ac.sampleRate * 1.4, puffer = ac.createBuffer(1, laenge, ac.sampleRate), d = puffer.getChannelData(0);
    for (var i = 0; i < laenge; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / laenge, 2.5);
    var quelle = ac.createBufferSource(), filter = ac.createBiquadFilter(), gain = ac.createGain();
    quelle.buffer = puffer; filter.type = 'lowpass'; filter.frequency.value = 900; gain.gain.value = 0.9;
    quelle.connect(filter).connect(gain).connect(ac.destination);
    quelle.start();
    ton(60, 0.8, 'sine', 0.6);
  }
  function vibrieren(muster) { try { if (navigator.vibrate) navigator.vibrate(muster); } catch (e) { /* egal */ } }

  var wachSperre = null;
  function wachHalten() {
    try {
      if ('wakeLock' in navigator && !wachSperre) {
        navigator.wakeLock.request('screen').then(function (s) { wachSperre = s; s.addEventListener('release', function () { wachSperre = null; }); }).catch(function () {});
      }
    } catch (e) { /* egal */ }
  }
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible' && aktivesSpiel) wachHalten(); });

  function vollbild(an) {
    try {
      if (an && document.documentElement.requestFullscreen && !document.fullscreenElement) {
        return document.documentElement.requestFullscreen().catch(function () {});
      }
      if (!an && document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(function () {});
    } catch (e) { /* egal */ }
    return Promise.resolve();
  }

  /* ---------- Navigation: Zurück-Taste führt ins Menü ---------- */

  var aktivesSpiel = false;
  function spielBetreten() {
    wachHalten();
    if (!aktivesSpiel) { aktivesSpiel = true; history.pushState({ spiel: true }, ''); }
  }
  function zumMenue() {
    if (history.state && history.state.spiel) history.back();
    else start();
  }
  window.addEventListener('popstate', function () { aktivesSpiel = false; start(); });

  /* ================================================================
     START
     ================================================================ */

  var SPIELE = [
    { id: 'imposter', emoji: '🕵️', name: 'Imposter', text: 'Einer kennt das Wort nicht. Findet ihn!', f1: '#e11d74', f2: '#7c3aed', marke: 'Trend', min: 3 },
    { id: 'stirn', emoji: '🤳', name: 'Stirnraten', text: 'Handy an die Stirn, neigen, raten.', f1: '#0891b2', f2: '#6d28d9', marke: 'Neigen' },
    { id: 'bombe', emoji: '💣', name: 'Tick Tack Boom', text: 'Begriff sagen, weitergeben – bevor’s knallt.', f1: '#f97316', f2: '#db2777' },
    { id: 'eher', emoji: '👉', name: 'Wer würde eher …?', text: '3, 2, 1 – alle zeigen gleichzeitig.', f1: '#ca8a04', f2: '#e11d48' },
    { id: 'reflex', emoji: '⚡', name: 'Reflex-Duell', text: '2–4 Leute, ein Handy. Wer ist am schnellsten?', f1: '#059669', f2: '#0e7490', marke: '2–4' }
  ];

  function start() {
    aktivesSpiel = false;
    vollbild(false);
    zeige(
      '<header><h1 class="titel">Spiele&shy;abend</h1><p class="untertitel">Ein Handy, alle zusammen, null Installation.</p></header>' +
      '<section class="karte"><div class="label">Wer spielt mit?</div>' +
        '<div class="chips" id="chips"></div>' +
        '<form class="zeile" id="neu" style="margin-top:12px"><input type="text" id="name" placeholder="Name eingeben" maxlength="20" autocomplete="off" enterkeyhint="done"><button class="knopf klein" type="submit">+</button></form>' +
      '</section>' +
      '<section class="spiele">' + SPIELE.map(function (s) {
        return '<button class="spiel-kachel" data-spiel="' + s.id + '" style="--f1:' + s.f1 + ';--f2:' + s.f2 + '">' +
          (s.marke ? '<span class="marke">' + s.marke + '</span>' : '') +
          '<span class="emoji">' + s.emoji + '</span><span><strong>' + s.name + '</strong><small>' + s.text + '</small></span></button>';
      }).join('') + '</section>' +
      '<p class="fusszeile">Viel Spaß! 🎉 Tipp: Ton an und Handy-Helligkeit hoch.</p>'
    );

    function chipsZeichnen() {
      var box = $('#chips');
      box.innerHTML = spieler.length
        ? spieler.map(function (n, i) { return '<span class="chip">' + esc(n) + '<button data-weg="' + i + '" aria-label="' + esc(n) + ' entfernen">✕</button></span>'; }).join('')
        : '<p class="hinweis">Noch niemand da. Tragt eure Namen ein – für Imposter braucht ihr mindestens 3.</p>';
      $$('[data-weg]', box).forEach(function (b) {
        b.addEventListener('click', function () { spieler.splice(Number(b.dataset.weg), 1); spielerSpeichern(); chipsZeichnen(); });
      });
    }
    chipsZeichnen();

    $('#neu').addEventListener('submit', function (e) {
      e.preventDefault();
      var feld = $('#name');
      spieler = L.spielerBereinigen(spieler.concat([feld.value]));
      spielerSpeichern();
      feld.value = '';
      chipsZeichnen();
      feld.focus();
    });

    klick('[data-spiel]', function (e) {
      var id = e.currentTarget.dataset.spiel;
      spielBetreten();
      ({ imposter: imposterStart, stirn: stirnStart, bombe: bombeStart, eher: eherStart, reflex: reflexStart })[id]();
    });
  }

  /* ================================================================
     IMPOSTER
     ================================================================ */

  var imposterEinst = { imposter: 1, kategorien: [], tipp: true, zeit: 180 };

  function imposterStart() {
    if (spieler.length < 3) {
      zeige(kopf('🕵️ Imposter') +
        '<div class="karte"><p class="gross">Ihr braucht mindestens 3 Spieler.</p><p class="hinweis" style="margin-top:8px">Tragt im Menü eure Namen ein – dann geht’s los.</p></div>' +
        '<div class="aktionen"><button class="knopf breit" data-menue>Namen eintragen</button></div>');
      menueKnoepfe();
      return;
    }
    var maxImp = Math.max(1, Math.min(3, spieler.length - 2));
    if (imposterEinst.imposter > maxImp) imposterEinst.imposter = maxImp;
    var kats = Object.keys(W.imposter);

    zeige(kopf('🕵️ Imposter') +
      '<div class="karte"><p class="hinweis">Alle bekommen dasselbe geheime Wort – nur der Imposter nicht. Reihum sagt jeder <b>ein</b> Wort dazu. Der Imposter muss bluffen, die anderen müssen ihn entlarven, ohne das Wort zu verraten.</p></div>' +
      '<div class="karte"><div class="label">Anzahl Imposter</div><div class="optionen" id="anzahl">' +
        [1, 2, 3].filter(function (n) { return n <= maxImp; }).map(function (n) {
          return '<button class="pille" data-n="' + n + '" aria-pressed="' + (n === imposterEinst.imposter) + '">' + n + '</button>';
        }).join('') + '</div></div>' +
      '<div class="karte"><div class="label">Kategorien <span style="text-transform:none;letter-spacing:0">(keine = alle)</span></div><div class="optionen" id="kats">' +
        kats.map(function (k) { return '<button class="pille" data-k="' + esc(k) + '" aria-pressed="' + (imposterEinst.kategorien.indexOf(k) !== -1) + '">' + esc(k) + '</button>'; }).join('') +
      '</div></div>' +
      '<div class="karte"><div class="label">Extras</div><div class="optionen">' +
        '<button class="pille" id="tipp" aria-pressed="' + imposterEinst.tipp + '">💡 Imposter sieht die Kategorie</button>' +
        '<button class="pille" id="zeit" aria-pressed="' + (imposterEinst.zeit > 0) + '">⏱️ 3-Minuten-Timer</button>' +
      '</div></div>' +
      '<div class="aktionen"><button class="knopf breit" id="los">Rollen verteilen</button></div>');
    menueKnoepfe();

    $$('#anzahl .pille').forEach(function (b) {
      b.addEventListener('click', function () {
        imposterEinst.imposter = Number(b.dataset.n);
        $$('#anzahl .pille').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      });
    });
    $$('#kats .pille').forEach(function (b) {
      b.addEventListener('click', function () {
        var an = b.getAttribute('aria-pressed') !== 'true';
        b.setAttribute('aria-pressed', String(an));
        imposterEinst.kategorien = $$('#kats .pille').filter(function (x) { return x.getAttribute('aria-pressed') === 'true'; }).map(function (x) { return x.dataset.k; });
      });
    });
    $('#tipp').addEventListener('click', function (e) { imposterEinst.tipp = !imposterEinst.tipp; e.currentTarget.setAttribute('aria-pressed', String(imposterEinst.tipp)); });
    $('#zeit').addEventListener('click', function (e) { imposterEinst.zeit = imposterEinst.zeit ? 0 : 180; e.currentTarget.setAttribute('aria-pressed', String(imposterEinst.zeit > 0)); });
    $('#los').addEventListener('click', function () {
      imposterVerteilen(L.imposterRunde(spieler, W.imposter, imposterEinst, zufall), 0);
    });
  }

  function imposterVerteilen(runde, i) {
    if (i >= runde.rollen.length) { imposterDiskussion(runde); return; }
    var rolle = runde.rollen[i];
    zeige(kopf('🕵️ ' + (i + 1) + ' / ' + runde.rollen.length) +
      '<div class="buehne"><p class="hinweis">Gib das Handy an</p><p class="riesig leuchten">' + esc(rolle.name) + '</p>' +
      '<p class="hinweis">Niemand sonst darf aufs Display schauen 👀</p></div>' +
      '<div class="aktionen"><button class="knopf breit" id="bereit">Ich bin ' + esc(rolle.name) + '</button></div>');
    menueKnoepfe();

    $('#bereit').addEventListener('click', function () {
      var geheim = rolle.imposter
        ? '<span style="font-size:3.5rem">🤫</span><span class="riesig">IMPOSTER</span><span class="hinweis" style="color:#fff">' +
          (imposterEinst.tipp ? 'Kategorie: <b>' + esc(runde.kategorie) + '</b><br>' : '') + 'Bluffe dich durch!</span>'
        : '<span class="hinweis" style="color:#fff">Das geheime Wort</span><span class="riesig">' + esc(runde.wort) + '</span><span class="hinweis" style="color:#fff">' + esc(runde.kategorie) + '</span>';
      zeige(kopf('🕵️ ' + esc(rolle.name)) +
        '<button class="aufdecken" id="karte" aria-label="Gedrückt halten zum Aufdecken"><span style="font-size:3.5rem">👆</span><span class="gross">Gedrückt halten</span><span class="hinweis">Loslassen versteckt es wieder</span></button>' +
        '<div class="aktionen"><button class="knopf breit" id="weiter" disabled>Gesehen – weiter</button></div>');
      menueKnoepfe();
      var karte = $('#karte'), verdeckt = karte.innerHTML;
      function auf(e) { e.preventDefault(); karte.innerHTML = geheim; karte.classList.add('offen'); if (rolle.imposter) karte.classList.add('boese'); $('#weiter').disabled = false; vibrieren(30); }
      function zu() { karte.innerHTML = verdeckt; karte.classList.remove('offen', 'boese'); }
      karte.addEventListener('pointerdown', auf);
      ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (t) { karte.addEventListener(t, zu); });
      karte.addEventListener('contextmenu', function (e) { e.preventDefault(); });
      $('#weiter').addEventListener('click', function () { imposterVerteilen(runde, i + 1); });
    });
  }

  function imposterDiskussion(runde) {
    var anzahl = runde.rollen.filter(function (r) { return r.imposter; }).length;
    zeige(kopf('🕵️ Diskussion') +
      '<div class="buehne"><p class="hinweis">Alle haben ihre Rolle. Es beginnt:</p><p class="riesig leuchten">' + esc(runde.starter) + '</p>' +
      '<p class="hinweis">Reihum ein Wort sagen. Danach zeigen alle gleichzeitig auf ' + (anzahl > 1 ? 'die ' + anzahl + ' Imposter' : 'den Imposter') + '.</p>' +
      (imposterEinst.zeit ? '<div class="uhr" id="uhr">3:00</div>' : '') + '</div>' +
      '<div class="aktionen"><button class="knopf breit rot" id="aufloesen">🔍 Auflösen</button></div>');
    menueKnoepfe();
    jingle([523, 659, 784]);

    if (imposterEinst.zeit) {
      var ende = Date.now() + imposterEinst.zeit * 1000, uhr = $('#uhr');
      immer(function () {
        var rest = Math.max(0, Math.ceil((ende - Date.now()) / 1000));
        uhr.textContent = Math.floor(rest / 60) + ':' + String(rest % 60).padStart(2, '0');
        uhr.classList.toggle('knapp', rest <= 10);
        if (rest <= 10 && rest > 0) ton(880, 0.08, 'square', 0.1);
        if (rest === 0) { aufraeumen(); ton(220, 0.6, 'sawtooth', 0.25); vibrieren([200, 100, 200]); uhr.textContent = 'Zeit!'; }
      }, 1000);
    }
    $('#aufloesen').addEventListener('click', function () { imposterAufloesung(runde); });
  }

  function imposterAufloesung(runde) {
    var boese = runde.rollen.filter(function (r) { return r.imposter; }).map(function (r) { return esc(r.name); });
    zeige(kopf('🕵️ Auflösung') +
      '<div class="buehne"><p class="hinweis">' + (boese.length > 1 ? 'Die Imposter waren' : 'Der Imposter war') + '</p>' +
      '<p class="riesig" style="color:var(--rot)">' + boese.join(' &amp; ') + '</p>' +
      '<p class="hinweis">Das Wort war</p><p class="gross leuchten">' + esc(runde.wort) + '</p>' +
      '<p class="hinweis">Imposter erwischt? Dann darf er noch das Wort raten – trifft er, gewinnt er trotzdem!</p></div>' +
      '<div class="aktionen zwei"><button class="knopf leise" id="einst">Einstellungen</button><button class="knopf" id="nochmal">Neue Runde</button></div>');
    menueKnoepfe();
    knall();
    vibrieren([80, 60, 80]);
    $('#einst').addEventListener('click', imposterStart);
    $('#nochmal').addEventListener('click', function () {
      imposterVerteilen(L.imposterRunde(spieler, W.imposter, imposterEinst, zufall), 0);
    });
  }

  /* ================================================================
     STIRNRATEN
     ================================================================ */

  var stirnEinst = { kategorie: Object.keys(W.stirnraten)[0], dauer: 60, umgekehrt: false };
  var stirnStapel = {};

  function stirnStart() {
    zeige(kopf('🤳 Stirnraten') +
      '<div class="karte"><p class="hinweis">Handy quer an die Stirn halten, Display zu den anderen. Die erklären den Begriff (ohne ihn zu sagen!).<br><b>Nach unten kippen</b> = erraten ✅ · <b>nach oben kippen</b> = weiter ⏭️<br>Oder einfach tippen: rechts erraten, links weiter.</p></div>' +
      '<div class="karte"><div class="label">Kategorie</div><div class="optionen" id="kat">' +
        Object.keys(W.stirnraten).map(function (k) { return '<button class="pille" data-k="' + esc(k) + '" aria-pressed="' + (k === stirnEinst.kategorie) + '">' + esc(k) + '</button>'; }).join('') +
      '</div></div>' +
      '<div class="karte"><div class="label">Zeit</div><div class="optionen" id="dauer">' +
        [45, 60, 90].map(function (s) { return '<button class="pille" data-s="' + s + '" aria-pressed="' + (s === stirnEinst.dauer) + '">' + s + ' s</button>'; }).join('') +
      '</div><div class="optionen" style="margin-top:10px"><button class="pille" id="umkehr" aria-pressed="' + stirnEinst.umgekehrt + '">↕️ Neigung umdrehen</button></div>' +
      '<p class="hinweis" style="margin-top:8px">Zählt „richtig“ und „weiter“ vertauscht? Dann „Neigung umdrehen“ antippen.</p></div>' +
      '<div class="aktionen"><button class="knopf breit" id="los">Los geht’s!</button></div>');
    menueKnoepfe();

    $$('#kat .pille').forEach(function (b) { b.addEventListener('click', function () { stirnEinst.kategorie = b.dataset.k; $$('#kat .pille').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); }); });
    $$('#dauer .pille').forEach(function (b) { b.addEventListener('click', function () { stirnEinst.dauer = Number(b.dataset.s); $$('#dauer .pille').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); }); });
    $('#umkehr').addEventListener('click', function (e) { stirnEinst.umgekehrt = !stirnEinst.umgekehrt; e.currentTarget.setAttribute('aria-pressed', String(stirnEinst.umgekehrt)); });

    $('#los').addEventListener('click', function () {
      audioBereit();
      /* iOS fragt nach Bewegungssensoren nur direkt nach einem Tippen. */
      var erlaubnis = (window.DeviceMotionEvent && typeof DeviceMotionEvent.requestPermission === 'function')
        ? DeviceMotionEvent.requestPermission().catch(function () { return 'denied'; })
        : Promise.resolve('granted');
      vollbild(true).then(function () {
        try { if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(function () {}); } catch (e) { /* egal */ }
      });
      erlaubnis.then(function (status) { stirnSpiel(status === 'granted'); });
    });
  }

  function stirnSpiel(sensor) {
    var k = stirnEinst.kategorie;
    if (!stirnStapel[k]) stirnStapel[k] = L.stapel(W.stirnraten[k], zufall);
    var ergebnisse = [], aktuell = null, laeuft = false, bereit = false, ende = 0;

    zeige('<div class="vollbild" id="feld">' +
      '<div class="ecke"><span id="zeit"></span><button class="zurueck" id="abbruch" aria-label="Runde abbrechen">✕</button><span id="punkte"></span></div>' +
      '<div class="inhalt"><p class="riesig" id="wort">Handy an die Stirn!</p><p class="gross" id="unter">3</p></div>' +
      '<div class="tippzonen" id="zonen" hidden><button id="tweiter">⏭️ weiter</button><button id="trichtig">✅ richtig</button></div>' +
      '</div>');
    var feld = $('#feld'), wort = $('#wort'), unter = $('#unter');

    function neu() { aktuell = stirnStapel[k].ziehen(); wort.textContent = aktuell; unter.textContent = ''; }
    function werten(richtig) {
      if (!laeuft) return;
      ergebnisse.push({ wort: aktuell, ok: richtig });
      $('#punkte').textContent = '✅ ' + ergebnisse.filter(function (e) { return e.ok; }).length;
      feld.classList.add(richtig ? 'richtig' : 'weiter');
      wort.textContent = richtig ? 'Richtig!' : 'Weiter';
      if (richtig) jingle([784, 1047], 90); else ton(300, 0.25, 'sawtooth', 0.15);
      vibrieren(richtig ? 60 : [30, 40, 30]);
      laeuft = false;
      spaeter(function () { feld.classList.remove('richtig', 'weiter'); laeuft = true; neu(); }, 700);
    }

    /* 3-2-1 */
    var zahl = 3;
    ton(660, 0.12);
    immer(function () {
      if (zahl <= 0) return;
      zahl -= 1;
      if (zahl > 0) { unter.textContent = zahl; ton(660, 0.12); return; }
      rateStart();
    }, 900);
    function rateStart() {
      ton(990, 0.3, 'triangle', 0.25);
      laeuft = true;
      $('#zonen').hidden = false;
      neu();
      ende = Date.now() + stirnEinst.dauer * 1000;
      immer(function () {
        var rest = Math.max(0, Math.ceil((ende - Date.now()) / 1000));
        $('#zeit').textContent = '⏱️ ' + rest;
        if (rest <= 5 && rest > 0) ton(880, 0.06, 'square', 0.08);
        if (rest === 0) fertig();
      }, 250);
    }

    $('#abbruch').addEventListener('click', function () {
      try { if (screen.orientation && screen.orientation.unlock) screen.orientation.unlock(); } catch (e) { /* egal */ }
      vollbild(false);
      stirnStart();
    });
    $('#trichtig').addEventListener('click', function () { werten(true); });
    $('#tweiter').addEventListener('click', function () { werten(false); });

    if (sensor) {
      var bewegung = function (e) {
        var g = e.accelerationIncludingGravity;
        if (!g || g.z == null) return;
        var r = L.neigung(g.z, bereit, stirnEinst.umgekehrt);
        bereit = r.bereit;
        if (r.ereignis && laeuft) werten(r.ereignis === 'richtig');
      };
      window.addEventListener('devicemotion', bewegung);
      beimVerlassen(function () { window.removeEventListener('devicemotion', bewegung); });
    }

    function fertig() {
      if (aktuell && laeuft) ergebnisse.push({ wort: aktuell, ok: false });
      laeuft = false;
      knall();
      vibrieren([300, 100, 300]);
      try { if (screen.orientation && screen.orientation.unlock) screen.orientation.unlock(); } catch (e) { /* egal */ }
      vollbild(false);
      var treffer = ergebnisse.filter(function (e) { return e.ok; }).length;
      zeige(kopf('🤳 Zeit um!') +
        '<div class="buehne" style="flex:0"><p class="hinweis">Erraten</p><p class="uhr leuchten">' + treffer + '</p></div>' +
        '<div class="liste">' + ergebnisse.map(function (e) { return '<div><span class="' + (e.ok ? 'ok' : 'nein') + '">' + esc(e.wort) + '</span><span>' + (e.ok ? '✅' : '⏭️') + '</span></div>'; }).join('') + '</div>' +
        '<div class="aktionen zwei"><button class="knopf leise" id="einst">Kategorie</button><button class="knopf" id="nochmal">Nächste Person</button></div>');
      menueKnoepfe();
      $('#einst').addEventListener('click', stirnStart);
      $('#nochmal').addEventListener('click', function () { vollbild(true); stirnSpiel(sensor); });
    }
  }

  /* ================================================================
     TICK TACK BOOM
     ================================================================ */

  var bombenStapel = null;

  function bombeStart() {
    zeige(kopf('💣 Tick Tack Boom') +
      '<div class="karte"><p class="hinweis">Die Bombe zeigt eine Kategorie. Wer das Handy hat, nennt <b>einen passenden Begriff</b> und gibt es sofort weiter. Kein Begriff doppelt! Wann die Bombe hochgeht, weiß niemand … wer sie dann hält, verliert die Runde. 💥</p></div>' +
      '<div class="buehne"><div class="bombe">💣</div></div>' +
      '<div class="aktionen"><button class="knopf breit" id="los">Zünden!</button></div>');
    menueKnoepfe();
    $('#los').addEventListener('click', bombeRunde);
  }

  function bombeRunde() {
    if (!bombenStapel) bombenStapel = L.stapel(W.bombe, zufall);
    var gesamt = L.bombenZeit(zufall), beginn = Date.now();
    zeige(kopf('💣 Tick Tack Boom') +
      '<div class="buehne"><p class="gross" id="aufgabe"></p><div class="bombe tickt" id="bombe">💣</div><p class="hinweis">Begriff sagen und weitergeben!</p></div>' +
      '<div class="aktionen"><button class="knopf leise breit" id="andere">🔄 Andere Kategorie</button></div>');
    menueKnoepfe();
    var aufgabe = $('#aufgabe'), bombe = $('#bombe');
    aufgabe.textContent = bombenStapel.ziehen();
    $('#andere').addEventListener('click', function () { aufgabe.textContent = bombenStapel.ziehen(); ton(520, 0.1, 'triangle'); });

    var hoch = true;
    function tick() {
      var vergangen = Date.now() - beginn;
      if (vergangen >= gesamt) { explosion(); return; }
      var abstand = L.tickAbstand(vergangen, gesamt);
      bombe.style.setProperty('--tempo', (abstand * 2 / 1000) + 's');
      ton(hoch ? 1200 : 900, 0.04, 'square', 0.12);
      hoch = !hoch;
      spaeter(tick, abstand);
    }
    tick();

    function explosion() {
      knall();
      vibrieren([500, 100, 500]);
      zeige('<div class="boom"><p style="font-size:6rem;line-height:1">💥</p><p class="riesig">BOOM!</p>' +
        '<p class="gross" style="color:#1a0008">Wer die Bombe hält, hat verloren!</p>' +
        '<div class="aktionen zwei" style="width:100%;max-width:420px;margin-top:10px"><button class="knopf leise" data-menue>Menü</button><button class="knopf" id="nochmal">Nächste Runde</button></div></div>');
      menueKnoepfe();
      $('#nochmal').addEventListener('click', bombeRunde);
    }
  }

  /* ================================================================
     WER WÜRDE EHER …?
     ================================================================ */

  var eherModus = 'Beides';
  var eherStapel = {};

  function eherStart() {
    var modi = ['Chillig', 'Mutig', 'Beides'];
    zeige(kopf('👉 Wer würde eher …?') +
      '<div class="optionen" id="modus">' + modi.map(function (m) { return '<button class="pille" data-m="' + m + '" aria-pressed="' + (m === eherModus) + '">' + ({ Chillig: '😌 ', Mutig: '🔥 ', Beides: '🎲 ' })[m] + m + '</button>'; }).join('') + '</div>' +
      '<div class="frage-karte" id="karte"><p class="gross" id="frage"></p></div>' +
      '<div class="aktionen zwei"><button class="knopf leise" id="naechste">Nächste ⏭️</button><button class="knopf" id="zeigen">3 · 2 · 1 👉</button></div>');
    menueKnoepfe();

    function stapelFuer(m) {
      if (!eherStapel[m]) eherStapel[m] = L.stapel(m === 'Beides' ? W.werEher.Chillig.concat(W.werEher.Mutig) : W.werEher[m], zufall);
      return eherStapel[m];
    }
    function naechste() {
      aufraeumen();
      var karte = $('#karte');
      karte.style.animation = 'none'; void karte.offsetWidth; karte.style.animation = '';
      $('#frage').textContent = stapelFuer(eherModus).ziehen();
      $('#zeigen').disabled = false;
    }
    $$('#modus .pille').forEach(function (b) {
      b.addEventListener('click', function () { eherModus = b.dataset.m; $$('#modus .pille').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); naechste(); });
    });
    $('#naechste').addEventListener('click', naechste);
    $('#zeigen').addEventListener('click', function () {
      var frage = $('#frage').textContent, knopf = $('#zeigen'), zahl = 3;
      knopf.disabled = true;
      $('#frage').textContent = '3';
      ton(660, 0.12);
      immer(function () {
        zahl -= 1;
        if (zahl > 0) { $('#frage').textContent = String(zahl); ton(660, 0.12); return; }
        aufraeumen();
        $('#frage').innerHTML = '<span class="riesig">👉 JETZT!</span><br><span class="hinweis">' + esc(frage) + '</span>';
        jingle([784, 988, 1175]);
        vibrieren(120);
      }, 800);
    });
    naechste();
  }

  /* ================================================================
     REFLEX-DUELL
     ================================================================ */

  var FARBEN = ['#db2777', '#0891b2', '#ca8a04', '#7c3aed'];
  var reflexAnzahl = 2;

  function reflexStart() {
    zeige(kopf('⚡ Reflex-Duell') +
      '<div class="karte"><p class="hinweis">Legt das Handy flach in die Mitte, jeder bekommt ein Feld. Wartet, bis alles <b style="color:var(--gruen)">GRÜN</b> wird – dann so schnell wie möglich aufs eigene Feld tippen. Wer zu früh tippt, verliert einen Punkt. Wer zuerst 5 Punkte hat, gewinnt!</p></div>' +
      '<div class="karte"><div class="label">Wie viele spielen?</div><div class="optionen" id="anz">' +
        [2, 3, 4].map(function (n) { return '<button class="pille" data-n="' + n + '" aria-pressed="' + (n === reflexAnzahl) + '">' + n + ' Spieler</button>'; }).join('') +
      '</div></div>' +
      '<div class="aktionen"><button class="knopf breit gruen" id="los">⚡ Start</button></div>');
    menueKnoepfe();
    $$('#anz .pille').forEach(function (b) { b.addEventListener('click', function () { reflexAnzahl = Number(b.dataset.n); $$('#anz .pille').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); }); });
    $('#los').addEventListener('click', function () {
      audioBereit();
      vollbild(true);
      var namen = L.mischen(spieler, zufall).slice(0, reflexAnzahl);
      while (namen.length < reflexAnzahl) namen.push('Spieler ' + (namen.length + 1));
      reflexSpiel(namen);
    });
  }

  function reflexSpiel(namen) {
    var n = namen.length, ZIEL = 5;
    var punkte = namen.map(function () { return 0; });
    var phase = 'pause';
    /* Die obere Reihe sitzt gegenüber und bekommt ihr Feld gedreht. */
    var oben = n === 2 ? [0] : [0, 1];

    zeige('<div class="arena n' + n + '" id="arena">' + namen.map(function (name, i) {
      return '<div class="zone' + (oben.indexOf(i) !== -1 ? ' oben' : '') + '" data-i="' + i + '" style="--zf:' + FARBEN[i] + '">' +
        '<span class="name">' + esc(name) + '</span><span class="stand">0</span><span class="meldung">Gleich geht’s los …</span></div>';
    }).join('') + '<div class="arena-mitte"><button data-menue aria-label="Beenden">✕</button></div></div>');
    menueKnoepfe();
    var arena = $('#arena'), zonen = $$('.zone', arena);

    function melden(i, text) { $('.meldung', zonen[i]).textContent = text; }
    function alleMelden(text) { zonen.forEach(function (_, i) { melden(i, text); }); }
    function standZeigen() { zonen.forEach(function (z, i) { $('.stand', z).textContent = punkte[i]; }); }
    function phaseSetzen(p) { phase = p; arena.classList.toggle('warten', p === 'warten'); arena.classList.toggle('los', p === 'los'); }

    function runde() {
      zonen.forEach(function (z) { z.classList.remove('sieg', 'foul'); });
      phaseSetzen('warten');
      alleMelden('Warten … 🤚');
      spaeter(function () {
        phaseSetzen('los');
        alleMelden('JETZT! ⚡');
        ton(1320, 0.15, 'square', 0.2);
      }, L.reflexWartezeit(zufall));
    }

    zonen.forEach(function (z, i) {
      z.addEventListener('pointerdown', function (e) {
        e.preventDefault();
        if (phase !== 'warten' && phase !== 'los') return;
        var vorher = phase;
        var r = L.reflexTipp(punkte, i, phase);
        punkte = r.punkte;
        aufraeumen();
        phaseSetzen('pause');
        standZeigen();
        if (vorher === 'warten') {
          z.classList.add('foul');
          alleMelden('');
          melden(i, 'Zu früh! −1 😬');
          ton(180, 0.35, 'sawtooth', 0.2);
          vibrieren([60, 40, 60]);
          spaeter(runde, 1500);
          return;
        }
        z.classList.add('sieg');
        alleMelden('');
        melden(i, 'Erster! +1 🏆');
        jingle([784, 1047, 1319], 80);
        vibrieren(80);
        var sieger = L.reflexSieger(punkte, ZIEL);
        if (sieger !== -1) { spaeter(function () { reflexSieg(namen, sieger, punkte); }, 1200); return; }
        spaeter(runde, 1600);
      });
    });
    spaeter(runde, 1200);
  }

  function reflexSieg(namen, sieger, punkte) {
    vollbild(false);
    jingle([523, 659, 784, 1047, 1319], 120);
    zeige(kopf('⚡ Sieg!') +
      '<div class="buehne"><p style="font-size:5rem;line-height:1">🏆</p><p class="riesig leuchten">' + esc(namen[sieger]) + '</p><p class="hinweis">hat die schnellsten Finger!</p></div>' +
      '<div class="liste">' + namen.map(function (name, i) { return { name: name, p: punkte[i] }; }).sort(function (a, b) { return b.p - a.p; })
        .map(function (x) { return '<div><span>' + esc(x.name) + '</span><b>' + x.p + '</b></div>'; }).join('') + '</div>' +
      '<div class="aktionen zwei"><button class="knopf leise" id="einst">Einstellungen</button><button class="knopf gruen" id="nochmal">Revanche!</button></div>');
    menueKnoepfe();
    $('#einst').addEventListener('click', reflexStart);
    $('#nochmal').addEventListener('click', function () { vollbild(true); reflexSpiel(namen); });
  }

  start();
})();
