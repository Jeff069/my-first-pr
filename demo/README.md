# Demo: lokale Dokumentenverarbeitung

Unstrukturierter Text rein, saubere Daten raus — komplett auf deinem Rechner,
ohne Cloud. Das ist das Stück, das du im Kundengespräch aufklappst.

## Starten

```bash
bash start.sh
```

Das ist alles. Das Skript prüft deine Hardware, wählt das passende Modell,
installiert Ollama falls nötig, lädt das Modell und führt die Demo vor.
Nichts zu entscheiden.

Windows: vorher WSL2 öffnen, dort denselben Befehl.

## Danach benutzen

```bash
python3 extract.py --vorlage beleg   beispiele/beleg.txt
python3 extract.py --vorlage angebot beispiele/angebot.txt
python3 extract.py --vorlage pflege  meine_notiz.txt
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
| `start.sh` | Ein Befehl: Hardware, Ollama, Modell, Demo |
| `hardware.py` | Erkennt RAM und Grafikkarte, wählt das Modell |
| `selbsttest.py` | Prüft den Ablauf ohne Ollama |
| `extract.py` | Der Ablauf: Datei lesen → lokales Modell → geprüftes JSON |
| `vorlagen/beleg.md` | Steuerkanzlei: Rechnungen und Belege auslesen |
| `vorlagen/angebot.md` | Handwerk: aus Notizen ein Angebot strukturieren |
| `vorlagen/pflege.md` | Pflege: Einsatznotizen dokumentieren |
| `beispiele/` | Testdaten, damit die Demo ohne Kundendaten läuft |

Alle drei Vorlagen nutzen denselben Ablauf. Eine neue Branche heißt: eine neue
Datei in `vorlagen/`, sonst nichts.

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

Ablauf, Fehlerbehandlung, Hardwareerkennung und Vorlagen sind geprüft, der
Selbsttest läuft durch. Gegen ein echtes Modell gelaufen ist es noch nicht.
Wenn die Ausgabe bei deinen eigenen Belegen daneben liegt, liegt es fast immer
an der Vorlage, nicht am Modell: Schema schärfen, Regeln ergänzen.

## Danach

Der nächste Ausbauschritt ist ein Ordner, den man überwacht: Datei rein →
automatisch verarbeitet → Ergebnis als CSV für die Buchhaltung. Das ist der
Punkt, an dem aus der Demo ein Produkt wird, für das jemand zahlt.
