# Blender Demo Addon (MediaURL-Beispiel)

Ein kleines Beispiel-Addon für [MediaURL](https://github.com/mediaurl/mediaurl-js),
gebaut mit `@mediaurl/sdk`. Es stellt die frei lizenzierten Open Movies der
Blender Foundation als Katalog bereit — inklusive Suche, Detailansicht und
abspielbarer MP4-Quelle.

## Was das Addon kann

| Aktion    | Handler in `src/index.ts` | Funktion                                          |
| --------- | ------------------------- | ------------------------------------------------- |
| `catalog` | Catalog-Handler           | Liste der 4 Filme, Suche wird unterstützt         |
| `item`    | Item-Handler              | Detailansicht eines Films (Beschreibung, Poster)  |
| `source`  | Source-Handler            | Abspielquelle (direkter MP4-Link, 1080p)          |

## Starten

```bash
npm install

# Entwicklung (mit ts-node, Standard-Port 3000):
npm run develop

# Oder Produktion:
npm run build
npm start
```

Danach läuft der Addon-Server unter `http://localhost:3000`.
Die Startseite zeigt eine Übersicht aller gemounteten Addons.

## Endpunkte testen

Addon-Manifest:

```bash
curl http://localhost:3000/blender.demo/mediaurl.json
```

Katalog abrufen (mit Suche):

```bash
curl -X POST http://localhost:3000/blender.demo/mediaurl-catalog.json \
  -H 'Content-Type: application/json' \
  -d '{"catalogId":"blender-movies","search":"sintel","filter":{},"cursor":null}'
```

Abspielquelle für einen Film:

```bash
curl -X POST http://localhost:3000/blender.demo/mediaurl-source.json \
  -H 'Content-Type: application/json' \
  -d '{"type":"movie","ids":{"blender.demo":"sintel"},"name":"Sintel"}'
```

## In der App verwenden

In einer MediaURL-kompatiblen App (z. B. WATCHED) den Entwicklermodus
aktivieren und die Addon-URL `http://<deine-ip>:3000/blender.demo` hinzufügen.

## Wie es funktioniert

Der komplette Code steckt in `src/index.ts`:

1. `createAddon({...})` definiert das Manifest (ID, Name, Katalog, Aktionen).
2. `registerActionHandler("catalog" | "item" | "source", ...)` registriert
   die Handler, die die App aufruft.
3. `runCli([addon])` startet den Express-Server mit allen Routen.

Die Filmdaten liegen hier als statisches Array im Code — in einem echten
Addon würden die Handler stattdessen eine externe API oder Website abfragen
(dafür bringt das SDK `ctx.fetch` und ein flexibles Caching mit).
