/* Service Worker: legt die App im Gerät ab, damit sie ohne Netz startet.
   Bei Änderungen an den Dateien die VERSION hochzählen - dann wird der alte
   Bestand verworfen und neu geladen. */

var VERSION = 'haushaltsbuch-v1';

var BESTAND = [
  './',
  './index.html',
  './styles.css',
  './manifest.webmanifest',
  './js/format.js',
  './js/store.js',
  './js/model.js',
  './js/charts.js',
  './js/app.js',
  './icons/symbol-192.png',
  './icons/symbol-512.png',
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
        return treffer;
      });
      return treffer || ausDemNetz;
    })
  );
});
