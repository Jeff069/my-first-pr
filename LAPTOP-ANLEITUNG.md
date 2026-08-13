# Schritt-für-Schritt: Vom instabilen ERP zur sauberen Fix-Routine (direkt am Laptop)

Diese Anleitung ist die praktische Reihenfolge für den Laptop, auf dem das ERP-System liegt.
Die Begründungen und die Langfassung stehen im [Stabilitäts-Playbook](STABILITAETS-PLAYBOOK.md),
die Kurzfassung für jeden einzelnen Bug in der [Bugfix-Checkliste](docs/BUGFIX-CHECKLISTE.md).

---

## Phase 0 — Sicherung (heute, ca. 1 Stunde)

**Ziel: Ab heute ist jeder Zustand des Systems wiederherstellbar. Ohne das ist jeder Fix ein Risiko ohne Rückweg.**

### Schritt 1: Prüfen, ob Git schon da ist

```bash
cd /pfad/zum/erp-system
git status
```

- Kommt eine Ausgabe mit Branch und Dateien → Git ist da, weiter zu Schritt 3.
- Kommt `fatal: not a git repository` → weiter zu Schritt 2.

### Schritt 2: Git initialisieren

Zuerst eine `.gitignore` anlegen, damit Unnötiges und Geheimes draußen bleibt:

```gitignore
# Build-Artefakte und Abhängigkeiten (an dein System anpassen)
bin/
obj/
build/
dist/
node_modules/
vendor/
__pycache__/
*.log

# Geheimnisse — NIEMALS committen
.env
*.env
appsettings.*.json
config/secrets.*
```

**Wichtig:** Vor dem ersten Commit prüfen, ob Passwörter, Datenbank-Zugangsdaten oder
API-Schlüssel im Code stehen. Wenn ja: in eine Konfigurationsdatei auslagern, die in
der `.gitignore` steht. Erst dann:

```bash
git init
git add .
git status          # Kontrolle: Sind wirklich keine Geheimnisse dabei?
git commit -m "Ausgangszustand: komplettes ERP-System"
```

### Schritt 3: Privates GitHub-Repository als Sicherung

1. Auf github.com → **New repository** → Name z. B. `erp-system` → **Private** → ohne README anlegen.
2. Dann am Laptop:

```bash
git remote add origin https://github.com/Jeff069/erp-system.git
git push -u origin main
```

Ab jetzt gilt: **Der Laptop darf kaputtgehen, das System nicht mehr.** Und jeder
missglückte Fix ist mit `git restore` bzw. `git revert` in Sekunden rückgängig gemacht.

---

## Phase 1 — Claude Code am Laptop installieren (heute, 15 Minuten)

**macOS / Linux:**

```bash
curl -fsSL https://claude.ai/install.sh | bash
```

**Windows (PowerShell):**

```powershell
irm https://claude.ai/install.ps1 | iex
```

(Alternativ über npm: `npm install -g @anthropic-ai/claude-code`, oder die Desktop-App
von claude.ai/download.)

Dann im ERP-Ordner starten und mit dem Claude-Konto anmelden:

```bash
cd /pfad/zum/erp-system
claude
```

Claude arbeitet jetzt direkt auf dem echten Code — nichts verlässt den Laptop,
außer Sie pushen es selbst.

---

## Phase 2 — Regeln ins Projekt legen (heute, 30 Minuten)

**Ziel: Die Regeln stehen im Projekt selbst, damit jede Claude-Session (und Sie selbst) sich automatisch daran hält.**

### Schritt 4: Die Dateien aus diesem Repository in den ERP-Ordner übernehmen

`STABILITAETS-PLAYBOOK.md`, `docs/BUGFIX-CHECKLISTE.md` und `.github/pull_request_template.md`
in den ERP-Ordner kopieren (herunterladen oder Repo klonen).

### Schritt 5: `CLAUDE.md` im ERP-Ordner anlegen

Diese Datei liest Claude Code bei jedem Start automatisch. Vorlage — die drei
`<...>`-Stellen ausfüllen:

```markdown
# ERP-System — Arbeitsregeln

## Projekt
Selbstentwickeltes ERP-System, ca. 300.000 Zeilen, <Sprache/Framework eintragen>.
Kritische Kette: Auftrag → Lieferschein → Lagerbestand → Rechnung → Buchung → Zahlung.

## Befehle
- Tests ausführen: <Testbefehl eintragen, z. B. dotnet test / npm test / phpunit>
- Build: <Build-Befehl eintragen>

## Regeln für JEDE Änderung (nicht verhandelbar)
1. Vor jedem Fix: alle Aufrufer/Verwender der zu ändernden Stelle finden und auflisten.
2. Erst einen Test schreiben, der den Bug zeigt (rot), dann fixen.
3. Minimaler Fix: kein Refactoring, kein Umbenennen, keine Nebenänderungen im selben Commit.
   Verbesserungsideen als TODO-Issue notieren statt umsetzen.
4. Nach jedem Fix die komplette Testsuite ausführen und das Ergebnis berichten.
5. Bei Änderungen an Berechnungslogik (Preise, Steuern, Rabatte, Bestände) immer prüfen:
   Existiert dieselbe Logik noch an anderer Stelle? Alle Fundstellen nennen.
6. Ein Bug = ein Branch (fix/<nr>-<kurzname>). Niemals direkt auf main arbeiten.
```

---

## Phase 3 — Das Sicherheitsnetz aufbauen (diese Woche)

**Ziel: Ein Alarm, der sofort losgeht, wenn ein Fix die Kette woanders zerstört. Genau das fehlt heute.**

### Schritt 6: Den ersten Kettentest bauen (der wichtigste Einzelschritt überhaupt)

Der erste Test deckt die Kernkette ab. Geben Sie Claude Code am Laptop diesen Auftrag:

> Analysiere, wie in diesem System der Prozess Auftrag → Lieferschein → Rechnung
> implementiert ist. Baue dann einen automatisierten End-to-End-Test, der mit festen
> Testdaten einen Auftrag anlegt, den Lieferschein erzeugt, die Rechnung erstellt und
> am Ende alle entstandenen Werte prüft: Nettobetrag, Steuer, Bruttobetrag,
> Lagerbestandsänderung, offener Posten. Verwende eine Testdatenbank, niemals die
> Produktivdaten. Richte das Test-Framework ein, falls noch keines existiert.

Danach denselben Auftrag für die nächsten Ketten wiederholen — Ziel sind 5–10 Tests:
Storno, Gutschrift, Teillieferung, Zahlung/Ausgleich, Inventur.

**Diese Tests sind der Kern der Lösung:** Ab jetzt sagt Ihnen ein roter Test *sofort und
vor dem Einsatz*, dass ein Fix die Kette zerstört hat — nicht mehr der Anwender Wochen später.

### Schritt 7: Feste Testdaten

Eine kleine, versionierte Testdatenbank (SQL-Dump oder Seed-Skript) mit ins Repo:
ein paar Artikel, Kunden, ein Lager mit Beständen. Jeder Testlauf startet mit
identischen Daten — sonst sind Testergebnisse nicht vergleichbar.

### Schritt 8: Ein Befehl, der alles prüft — und CI

Erst lokal: ein Skript (`test.sh` / `test.ps1`), das die komplette Testsuite ausführt.
Dann automatisch bei jedem Push, GitHub Actions unter `.github/workflows/ci.yml`:

```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      # Hier Laufzeitumgebung einrichten, z. B.:
      # - uses: actions/setup-dotnet@v4   # oder setup-node, setup-php, setup-python
      - name: Tests ausführen
        run: ./test.sh   # <- deinen Testbefehl eintragen
```

Regel ab dann: **Rot wird nicht gemerged und nicht eingesetzt. Keine Ausnahmen.**

---

## Phase 4 — Ab jetzt: jeder Bug nach demselben Ritual (laufend)

### Schritt 9: Bugs sammeln statt jagen

Alle bekannten Bugs als GitHub-Issues erfassen (reicht stichpunktartig), mit Priorität:

| Priorität | Kriterium | Beispiel |
|---|---|---|
| P1 | Falsche Zahlen / Datenverlust | Rechnung rechnet Steuer falsch |
| P2 | Prozess blockiert | Lieferschein lässt sich nicht buchen |
| P3 | Kosmetik / Umweg vorhanden | Spalte falsch sortiert |

**Immer nur ein Bug gleichzeitig in Arbeit.** Halbfertige Fixes an drei Stellen sind
eine der Hauptquellen für Kettenbrüche.

### Schritt 10: Pro Bug die 8 Schritte der Checkliste

Reproduzieren → Wirkungsbereich klären → Test rot → minimaler Fix → alle Tests grün →
Kette durchklicken → Branch + CI → mergen. Details: [docs/BUGFIX-CHECKLISTE.md](docs/BUGFIX-CHECKLISTE.md).

Bewährte Aufträge an Claude Code dabei:

> Finde alle Stellen, die `<Funktion/Tabelle>` verwenden, direkt und indirekt.
> Welche Module wären von einer Änderung betroffen?

> Schreibe zuerst einen Test, der diesen Bug nachstellt: <Reproduktionsschritte>.
> Er muss jetzt fehlschlagen. Danach machst du den minimalsten Fix, der ihn grün macht —
> ohne irgendetwas anderes anzufassen.

> Wird diese Berechnung noch irgendwo anders im System gemacht? Suche nach
> Duplikaten dieser Logik und liste jede Fundstelle.

### Schritt 11: Wöchentlich 30 Minuten Rückblick

Welcher Fix hat trotzdem etwas gebrochen? → Genau dafür einen neuen Kettentest
schreiben, damit dieselbe Lücke nie wieder unbemerkt bleibt. So wächst das Netz genau
dort, wo Ihr System tatsächlich reißt.

---

## Phase 5 — Mittelfristig (ab Monat 2)

Wenn die Routine sitzt und Regressionen seltener werden, die Ursache angehen —
Reihenfolge und Details im [Stabilitäts-Playbook](STABILITAETS-PLAYBOOK.md):

- Duplizierte Geschäftslogik (Preise, Steuern, Rabatte) auf je eine Funktion zusammenziehen
- Datenbank-Constraints (Foreign Keys, NOT NULL, CHECK) — Datenfehler an der Wurzel stoppen
- Modulgrenzen ziehen: Module reden nur über definierte Funktionen, nie über fremde Tabellen
- Nächtliches Invarianten-Skript (z. B. „Summe offene Posten = Summe unbezahlter Rechnungen")
- **Keinen Big-Bang-Rewrite anfangen** — der scheitert bei 300k Zeilen fast immer

---

## Die Kurzform

1. **Heute:** Git + privates GitHub-Repo (Rollback + Backup), Claude Code installieren, `CLAUDE.md` mit Regeln anlegen.
2. **Diese Woche:** 1. Kettentest Auftrag→Rechnung, dann 5–10 Kettentests, Testdaten, CI. Das ist der Alarm, der Kettenbrüche sofort meldet.
3. **Ab sofort, für immer:** Jeder Bug einzeln, nach der 8-Schritte-Checkliste, minimaler Fix, nur grün wird gemerged.
4. **Ab Monat 2:** Duplikate zusammenziehen, DB-Constraints, Modulgrenzen — damit Fehler sich gar nicht mehr fortpflanzen können.
