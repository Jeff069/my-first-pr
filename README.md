# my-first-pr

Willkommen zu meinem ersten GitHub Repository!

## Über dieses Projekt

Dieses Projekt wurde erstellt um den Pull Request Workflow zu üben.
Ein Pull Request ermöglicht es, Änderugnen vorzuschlagen und von anderen überprüfen zu lassen.

## Workflow

1. Repository forken oder klonen
2. Einen neuen Branch erstellen
3. Änderungen vornehmen und committen
4. Pull Request öffnen
5. Review abwarten und Feedback einarbeiten
6. Merge in den Hauptbranch

## Mitmachen

Jeder kan einen Beitrag leisten — egal ob Anfänger oder Profi!

---

## Das Prüf-Orchester

In diesem Repository liegt außerdem ein Ensemble aus 30 Prüf-Agenten für
Claude Code, das ein beliebiges Projekt durchgeht — Code, Bugs, Funktionen,
Dashboard, Design, Betrieb und Produkt.

Es wird **global** installiert und lebt nicht im geprüften Projekt:

```bash
bash install.sh              # verknüpft nach ~/.claude (Update per git pull)
bash install.sh --copy       # kopiert stattdessen
bash install.sh --entfernen  # wieder abbauen
```

Danach in **jedem** Projektordner Claude Code starten und `/orchester` aufrufen.
Der Dirigent schlägt eine Besetzung vor und wartet auf dein **GO** — vorher
läuft kein Agent. Im geprüften Projekt entsteht keine einzige Datei; Berichte,
Gedächtnis und Verlauf liegen unter `~/.claude/orchester/projekte/<name>/`.

Ausführliche Beschreibung: [`orchester/doku/README.md`](orchester/doku/README.md)
· Besetzungen: [`orchester/doku/besetzungen.md`](orchester/doku/besetzungen.md)
