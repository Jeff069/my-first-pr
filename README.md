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

## Der Check — 30 Prüf-Agenten

In diesem Repository liegt außerdem ein Team aus 30 Prüf-Agenten für
Claude Code, das ein beliebiges Projekt durchgeht — Code, Bugs, Funktionen,
Dashboard, Design, Betrieb und Produkt.

Es wird **global** installiert und lebt nicht im geprüften Projekt:

```bash
bash install.sh              # verknüpft nach ~/.claude (Update per git pull)
bash install.sh --copy       # kopiert stattdessen
bash install.sh --entfernen  # wieder abbauen
```

Danach in **jedem** Projektordner Claude Code starten und `/check` aufrufen.
Die Leitung schlägt eine Aufstellung vor und wartet auf dein **GO** — vorher
läuft kein Agent. Im geprüften Projekt entsteht keine einzige Datei; Berichte,
Gedächtnis und Verlauf liegen unter `~/.claude/check/projekte/<name>/`.

Ausführliche Beschreibung: [`check/doku/README.md`](check/doku/README.md)
· Aufstellungen: [`check/doku/aufstellungen.md`](check/doku/aufstellungen.md)
