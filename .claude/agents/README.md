# Claude-Code-Subagenten

In diesem Ordner liegen Subagenten für [Claude Code](https://code.claude.com/docs/en/sub-agents).
Jede `.md`-Datei definiert einen Agenten: Der Frontmatter-Block legt Name, Beschreibung
und erlaubte Tools fest, der Text darunter ist der System-Prompt des Agenten.

## Verfügbare Agenten

| Agent | Zweck |
|---|---|
| `code-reviewer` | Prüft Code-Änderungen und Pull Requests auf Fehler und Stil |
| `doku-autor` | Schreibt und verbessert Dokumentation |
| `test-autor` | Schreibt automatisierte Tests für bestehenden Code |

## Verwendung

Claude Code erkennt die Agenten automatisch, sobald das Repository geöffnet ist.
Du kannst sie direkt ansprechen, z.B.:

> „Nutze den code-reviewer, um meinen Branch zu prüfen."

Oder Claude wählt selbst den passenden Agenten anhand der `description` aus.

## Eigenen Agenten erstellen

1. Neue Datei `.claude/agents/mein-agent.md` anlegen
2. Frontmatter mit `name`, `description` und optional `tools` ausfüllen
3. Darunter den System-Prompt schreiben, der das Verhalten des Agenten beschreibt
