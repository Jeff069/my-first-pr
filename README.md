# Haushaltsbuch

Eine kleine Web-App, die zeigt, **wohin das Geld im Haushalt fließt** – gedacht für zwei Personen,
die gemeinsam wirtschaften.

Einnahmen und Ausgaben erfassen, wiederkehrende Abbuchungen mit ihrem Tag im Monat hinterlegen und
auf einen Blick sehen, was diesen Monat noch vom Konto geht.

Kein Build, kein npm, kein Konto, keine Cloud: eine HTML-Datei, ein Stylesheet und etwas
JavaScript. Die Daten bleiben im Browser.

## Starten

Zwei Wege – beide funktionieren:

1. **`index.html` doppelklicken.** Mehr braucht es nicht.
2. Oder einen lokalen Server starten, falls die App über das Netzwerk erreichbar sein soll:

   ```bash
   python3 -m http.server 8000
   # danach http://localhost:8000 im Browser öffnen
   ```

Über *Einstellungen → Beispielmonat anlegen* lässt sich die Auswertung sofort mit erfundenen
Zahlen ausprobieren.

## Was drin ist

| Bereich | Was er kann |
|---|---|
| **Übersicht** | Einnahmen, Ausgaben, Saldo und Sparquote des Monats · Liste „Kommt diesen Monat noch" · Ausgaben nach Kategorie · Vergleich der letzten sechs Monate · Aufteilung nach Person |
| **Buchungen** | Erfassen, bearbeiten, löschen – mit Datum, Betrag, Kategorie, Notiz und der Angabe, wer gezahlt hat; Filter nach Kategorie, Person und Notiztext |
| **Wiederkehrend** | Daueraufträge mit Abbuchungstag und Rhythmus (monatlich, vierteljährlich, jährlich); sie erzeugen die Buchungen des Monats automatisch. Dazu die monatliche Fixkostenlast, bei der Jahresbeiträge anteilig umgelegt sind |
| **Einstellungen** | Namen der beiden Personen, eigene Kategorien mit Farbe, Backup exportieren und einlesen |

Ein paar Details, die im Alltag zählen:

- **Abbuchungstag 31** rutscht in kurzen Monaten auf den letzten Tag, statt in den Folgemonat zu fallen.
- **Keine doppelte Miete:** ein Dauerauftrag erzeugt pro Monat genau eine Buchung, egal wie oft die
  Seite neu geladen wird. Eine bewusst gelöschte Buchung kommt nicht zurück.
- **Jahresbeiträge werden umgelegt** – 600 € Versicherung im Jahr zählen als 50 € im Monat.
- Beträge liegen intern als ganze Cent vor, damit sich keine Rundungsfehler ansammeln.
- Dunkelmodus, Bedienung per Tastatur und ein Layout, das auf dem Handy funktioniert.

## Als App aufs Handy

Die App ist installierbar: eigenes Symbol auf dem Startbildschirm, Start im Vollbild ohne
Browserleiste, Start auch ohne Internetverbindung.

**Sie läuft bereits hier: https://jeff069.github.io/my-first-pr/**

Auf dem Telefon öffnen und ablegen:

- **Android (Chrome):** Menü ⋮ → *App installieren*
- **iPhone (Safari):** Teilen-Symbol → *Zum Home-Bildschirm*

Danach startet das Haushaltsbuch wie eine normale App. Die Dateien liegen dann im Gerät
(`sw.js`), es funktioniert also auch im Funkloch – der Kontostand im Supermarkt ist erreichbar,
ohne Empfang.

### Eine neue Fassung veröffentlichen

GitHub Pages liefert den Branch `gh-pages` aus. Nach Änderungen auf `main` genügt:

```bash
git push origin main:gh-pages
```

GitHub baut die Seite daraufhin selbst neu; nach ein bis zwei Minuten ist sie aktuell.

Wer etwas am Code ändert, zählt in `sw.js` die `VERSION` hoch; sonst zeigt das installierte
Exemplar noch die alte Fassung. Die Symbole liegen in `icons/` und lassen sich mit
`node tools/symbole.mjs` neu erzeugen.

## Gestaltung und Barrierefreiheit

Die Oberfläche ist einem geführten Kassenbuch nachempfunden: Cremepapier statt Weiß,
Serifen-Überschriften, feine Linien statt Schatten, Beträge in Tabellenziffern, damit Spalten
untereinander stehen. Schriften kommen aus dem System – kein CDN, keine Nachladezeit, offline
identisch.

- **Kontrast geprüft:** alle Textfarben erreichen mindestens 4,5:1 gegen ihren Untergrund, in
  hellem wie dunklem Modus.
- **Diagrammfarben geprüft:** die acht Kategoriefarben sind auf Farbfehlsichtigkeit getestet
  (Deuteranopie, Protanopie, Tritanopie) und haben eigene Werte für hell und dunkel. Jeder Balken
  trägt zusätzlich Name und Betrag – die Farbe allein muss nie die Aussage tragen.
- **Bewegung mit Maß:** Balken wachsen, Zahlen laufen auf ihren Wert zu, die Reitermarkierung
  gleitet mit, Blätter blenden versetzt ein. Wer im System „weniger Bewegung" eingestellt hat,
  bekommt alles sofort und ohne Animation.
- **Bedienbar ohne Maus:** Reiter per Pfeiltasten, sichtbarer Fokusring auf allen Elementen,
  Sprungmarke zum Inhalt, Beschriftungen an jedem Feld, Ergebnisbereiche als `aria-live`.
  Klickflächen mindestens 44 px hoch.

## Wo die Daten liegen

Ausschließlich im `localStorage` deines Browsers. Nichts wird übertragen, es gibt keinen Server und
kein Konto. Das hat zwei Konsequenzen:

- **Sicherung nicht vergessen.** *Einstellungen → Als Datei sichern* schreibt den kompletten Stand
  in eine JSON-Datei.
- **Zwei Geräte haben zwei Stände.** Die Exportdatei ist zugleich der Weg, den Stand vom einen
  Browser in den anderen zu bringen (*Backup einlesen*).

Eine echte Synchronisierung zwischen zwei Geräten ließe sich später nachrüsten: sämtlicher
Datenzugriff läuft über `js/store.js`, nur diese Datei müsste dafür ausgetauscht werden.

## Aufbau

```
index.html          Seitenstruktur mit den vier Bereichen
styles.css          Gestaltung, heller und dunkler Modus
js/format.js        Beträge, Datums- und Monatsformate (deutsch)
js/store.js         Speichern, Laden, Export/Import – die einzige Stelle mit localStorage
js/model.js         Rechenkern: Summen, Auswertungen, Daueraufträge (ohne DOM)
js/charts.js        Diagramme als handgeschriebenes SVG bzw. CSS, ohne Bibliothek
js/app.js           Oberfläche: Rendering und Bedienung
tests/              Tests für den Rechenkern
manifest.webmanifest  Angaben für die Installation als App
sw.js               Service Worker: macht die App offline lauffähig
icons/              App-Symbole (erzeugt von tools/symbole.mjs)
tools/              Hilfsskripte: Symbole zeichnen, Ansicht für die Veröffentlichung
```

Die Trennung zwischen `model.js` (rechnet) und `app.js` (zeigt an) ist Absicht: nur dadurch lassen
sich die Rechenwege ohne Browser testen.

## Tests

```bash
node --test
```

Läuft ohne npm und ohne Abhängigkeiten – Node ab Version 18 genügt. Geprüft werden unter anderem
die Monatssummen, die Sparquote ohne Einnahmen, der Abbuchungstag 31 im Februar, die Idempotenz der
Daueraufträge und der Export/Import-Durchlauf.

## Veröffentlichen

Weil es sich um statische Dateien handelt, genügt GitHub Pages: *Settings → Pages → Branch* wählen,
fertig. Die App läuft anschließend unverändert im Browser – die Daten bleiben trotzdem lokal.

---

## Zum Ursprung dieses Repositories

Dieses Projekt wurde erstellt, um den Pull-Request-Workflow zu üben. Ein Pull Request ermöglicht es,
Änderungen vorzuschlagen und von anderen überprüfen zu lassen.

1. Repository forken oder klonen
2. Einen neuen Branch erstellen
3. Änderungen vornehmen und committen
4. Pull Request öffnen
5. Review abwarten und Feedback einarbeiten
6. Merge in den Hauptbranch

Jeder kann einen Beitrag leisten — egal ob Anfänger oder Profi!
