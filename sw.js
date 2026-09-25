/* Service Worker: legt die App im Gerät ab, damit sie ohne Netz startet.

   VERSION und BESTAND werden nicht von Hand gepflegt, sondern von
   tools/sw-version.mjs gestempelt: die Version aus dem Inhalt der Dateien,
   der Bestand aus deren Liste. Ändert sich eine Datei, ändert sich die
   Version, der alte Bestand wird verworfen und alles neu geladen. */

var VERSION = 'haushaltsbuch-37b9eeb4ee11';

var BESTAND = [
  './',
  './index.html',
  './styles.css',
  './manifest.webmanifest',
  './js/konfig.js',
  './js/format.js',
  './js/store.js',
  './js/model.js',
  './js/merge.js',
  './js/teilen.js',
  './js/wolke.js',
  './js/charts.js',
  './js/app.js',
  './icons/symbol-192.png',
  './icons/symbol-512.png',
  './icons/symbol-maskierbar-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (speicher) {
    return speicher.addAll(BESTAND);
  }).then(function () {
    return self.skipWaiting();
  }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (namen) {
    return Promise.all(namen.filter(function (name) {
      return name !== VERSION;
    }).map(function (name) {
      return caches.delete(name);
    }));
  }).then(function () {
    return self.clients.claim();
  }));
});

self.addEventListener('fetch', function (e) {
  var anfrage = e.request;
  if (anfrage.method !== 'GET' || new URL(anfrage.url).origin !== self.location.origin) return;

  /* Seitenaufrufe zuerst aus dem Netz, damit eine neue Fassung ankommt;
     ohne Netz aus dem Bestand. */
  if (anfrage.mode === 'navigate') {
    e.respondWith(
      fetch(anfrage).then(function (antwort) {
        var kopie = antwort.clone();
        caches.open(VERSION).then(function (speicher) { speicher.put('./index.html', kopie); });
        return antwort;
      }).catch(function () {
        return caches.match('./index.html');
      })
    );
    return;
  }

  /* Dateien sofort aus dem Bestand ausliefern und im Hintergrund auffrischen. */
  e.respondWith(
    caches.match(anfrage).then(function (treffer) {
      var ausDemNetz = fetch(anfrage).then(function (antwort) {
        if (antwort && antwort.status === 200) {
          var kopie = antwort.clone();
          caches.open(VERSION).then(function (speicher) { speicher.put(anfrage, kopie); });
        }
        return antwort;
      }).catch(function () {
        /* respondWith darf nie undefined bekommen, sonst bricht der Aufruf
           mit einem Fehler ab statt still ins Leere zu laufen. */
        return treffer || new Response('', { status: 503, statusText: 'offline' });
      });
      return treffer || ausDemNetz;
    })
  );
});
