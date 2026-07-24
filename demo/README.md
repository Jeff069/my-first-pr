# Demo: lokale Dokumentenverarbeitung

Unstrukturierter Text rein, saubere Daten raus — komplett auf deinem Rechner,
ohne Cloud. Das ist das Stück, das du im Kundengespräch aufklappst.

## Sofort, ohne alles

Für Rechnungen und Quittungen braucht es kein Modell und keine Installation:

```bash
python3 demo/ohne_modell.py demo/beispiele/beleg.txt
```

Reine Mustererkennung, nur Standardbibliothek. Erfindet grundsätzlich nichts —
jeder Wert wird wörtlich aus dem Text genommen. Bei sauberen deutschen Rechnungen
ist sie dem kleinen Sprachmodell überlegen.

Ist Ollama nicht erreichbar, schalten `extract.py` und `stapel.py` bei Belegen
automatisch darauf um.

Grenzen: ungewöhnliche Layouts, Fließtext, Fremdsprachen — und alles, was kein
Beleg ist (Angebotsnotizen, Pflegedokumentation). Dafür ist das Modell da.

## Mit Modell starten

**Windows** (PowerShell im Ordner `demo` öffnen):

```powershell
powershell -ExecutionPolicy Bypass -File start.ps1
```

**Linux und macOS:**

```bash
bash start.sh
```

Das ist alles. Das Skript prüft deine Hardware, wählt das passende Modell,
installiert Ollama falls nötig, lädt das Modell und führt die Demo vor.
Nichts zu entscheiden.

Auf Windows heißt Python meist `python` statt `python3` — das Skript findet das
selbst heraus. Fehlt Python ganz: `winget install Python.Python.3.12`

## Danach benutzen

```bash
python3 extract.py --vorlage beleg   beispiele/beleg.txt
python3 extract.py --vorlage angebot beispiele/angebot.txt
python3 extract.py --vorlage pflege  beispiele/pflege.txt
```

Das Modell wird automatisch zur Hardware gewählt. Was erkannt wurde:

```bash
python3 hardware.py
```

| Speicher | Modell |
|---|---|
| ab 32 GB | `qwen2.5:14b` |
| ab 16 GB | `llama3.1:8b` |
| ab 8 GB | `llama3.2:3b` |
| darunter | `llama3.2:1b` (ungenau) |

Überstimmen geht mit `--modell name`.

PDFs gehen auch, dafür braucht es `pdftotext` (Paket `poppler-utils`).
Gescannte PDFs vorher durch `ocrmypdf` schicken.

Keine Python-Pakete nötig — nur Standardbibliothek.

## Was drin ist

| Datei | Zweck |
|---|---|
| `start.sh` | Ein Befehl für Linux und macOS |
| `start.ps1` | Dasselbe für Windows |
| `hardware.py` | Erkennt RAM und Grafikkarte, wählt das Modell |
| `selbsttest.py` | Prüft den ganzen Ablauf ohne Ollama |
| `pruefer.py` | Rechnet nach und schlägt im Original nach |
| `stapel.py` | Ganzen Ordner verarbeiten, Ergebnis als CSV |
| `extract.py` | Der Ablauf: Datei lesen → lokales Modell → geprüftes JSON |
| `ohne_modell.py` | Belegerkennung per Muster, ganz ohne Modell |
| `vorlagen/beleg.md` | Steuerkanzlei: Rechnungen und Belege auslesen |
| `vorlagen/angebot.md` | Handwerk: aus Notizen ein Angebot strukturieren |
| `vorlagen/pflege.md` | Pflege: Einsatznotizen dokumentieren |
| `beispiele/` | Testdaten, damit die Demo ohne Kundendaten läuft |

Alle drei Vorlagen nutzen denselben Ablauf. Eine neue Branche heißt: eine neue
Datei in `vorlagen/`, sonst nichts.

## Ganzen Ordner verarbeiten

```bash
python3 stapel.py ./belege --csv maerz.csv --json-ordner ./ergebnisse
```

Ergebnis ist eine Tabelle mit einer Zeile pro Beleg, Spalte `geprueft` steht auf
`ok` oder `PRUEFEN`. Semikolon-getrennt und mit BOM — Excel öffnet sie ohne
Nachfragen. Fehlgeschlagene Dateien werden am Ende einzeln aufgeführt, nichts
verschwindet still.

## Die Prüfung — das eigentliche Verkaufsargument

Nach jeder Extraktion läuft `pruefer.py`, ganz ohne Modell:

- **Nachrechnen:** Netto + Steuer = Brutto? Passt der Steuerbetrag zum Satz?
  Ergeben die Positionen die Nettosumme?
- **Nachschlagen:** Steht jeder Betrag, die Rechnungsnummer, die USt-ID und der
  Lieferantenname überhaupt im Originaltext — oder hat das Modell sie erfunden?
- **Datum:** gültiges Format, plausibler Zeitraum?
- **Vollständigkeit:** fehlen Nummer, Datum und Betrag komplett, ist es kein Beleg —
  leere Felder widersprechen nichts und würden sonst als „ok" durchrutschen.

Was auffällt, landet im Feld `pruefung` und setzt `sicherheit` auf `niedrig`.
Werte werden nie stillschweigend korrigiert.

Das ist der Unterschied zwischen „KI liest Belege" und etwas, das man in einer
Kanzlei einsetzen kann: Ein erfundener Betrag wird gleich doppelt gefangen —
die Rechnung geht nicht auf, und die Zahl steht nicht im Original.

## Warum die Vorlagen so streng sind

Jede Vorlage zwingt das Modell zu einem festen JSON-Schema, verbietet Erfundenes
und hat ein Feld `pruefen` bzw. `rueckfragen`. Das ist kein Beiwerk, sondern das
Verkaufsargument: Ein Werkzeug, das offenlegt, wo es unsicher ist, kann man in
einer Kanzlei einsetzen. Eines, das immer selbstbewusst antwortet, nicht.

Bei der Pflege-Vorlage kommt dazu: keine Bewertung, keine Diagnose, Verantwortung
bleibt bei der Pflegekraft. Sag das im Gespräch von dir aus — es ist der erste
Einwand, der kommt.

## Wenn etwas klemmt

```bash
python3 selbsttest.py
```

Der Selbsttest ersetzt Ollama durch einen Nachbau und prüft den ganzen Ablauf:
Vorlage laden, Platzhalter ersetzen, Anfrage bauen, Antwort auswerten.

- **Selbsttest läuft, echter Lauf nicht** → das Problem liegt bei Ollama oder am
  Modell, nicht am Code.
- **Selbsttest schlägt fehl** → Fehlermeldung hierher kopieren.

## Stand

Der Selbsttest deckt vier Bereiche ab und läuft grün: Einzellauf, Prüfungen,
Stapellauf mit CSV und die modellfreie Erkennung. Letztere ist gegen vier
verschiedene Belegarten geprüft — Handwerkerrechnung, Kleinunternehmer nach
§ 19 UStG, Kassenbon und Kanzleirechnung mit Stundenpositionen.

Gegen ein echtes Sprachmodell gelaufen ist es noch nicht.
Wenn die Ausgabe bei deinen eigenen Belegen daneben liegt, liegt es fast immer
an der Vorlage, nicht am Modell: Schema schärfen, Regeln ergänzen.

## Danach

Der nächste Ausbauschritt ist ein Ordner, den man überwacht: Datei rein →
automatisch verarbeitet → Ergebnis als CSV für die Buchhaltung. Das ist der
Punkt, an dem aus der Demo ein Produkt wird, für das jemand zahlt.
