# Demo: lokale Dokumentenverarbeitung

Unstrukturierter Text rein, saubere Daten raus — komplett auf deinem Rechner,
ohne Cloud. Das ist das Stück, das du im Kundengespräch aufklappst.

## Einrichten (einmalig, ~10 Minuten)

```bash
# 1. Ollama installieren
curl -fsSL https://ollama.com/install.sh | sh     # Linux/macOS
#    Windows: Installer von ollama.com

# 2. Modell holen (~5 GB)
ollama pull llama3.1:8b

# 3. Läuft es?
ollama list
```

## Benutzen

```bash
python3 extract.py --vorlage beleg   beispiele/beleg.txt
python3 extract.py --vorlage angebot beispiele/angebot.txt
python3 extract.py --vorlage pflege  meine_notiz.txt
```

PDFs gehen auch, dafür braucht es `pdftotext` (Paket `poppler-utils`).
Gescannte PDFs vorher durch `ocrmypdf` schicken.

Keine Python-Pakete nötig — nur Standardbibliothek.

## Was drin ist

| Datei | Zweck |
|---|---|
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

## Stand

Ablauf, Fehlerbehandlung und Vorlagen sind geprüft. Gegen ein echtes Modell
getestet ist noch nichts — das ist dein erster Schritt, sobald Ollama läuft.
Wenn die Ausgabe bei deinen eigenen Belegen daneben liegt, liegt es fast immer
an der Vorlage, nicht am Modell: Schema schärfen, Regeln ergänzen.

## Danach

Der nächste Ausbauschritt ist ein Ordner, den man überwacht: Datei rein →
automatisch verarbeitet → Ergebnis als CSV für die Buchhaltung. Das ist der
Punkt, an dem aus der Demo ein Produkt wird, für das jemand zahlt.
