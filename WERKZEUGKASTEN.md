# 🧰 Der Entwickler-Werkzeugkasten

Alles, was du auf deinem Laptop brauchst, um sauber und professionell Software zu
entwickeln — inklusive Claude Code als KI-Entwicklungspartner. Alle Links und
Befehle stammen aus den offiziellen Quellen (Stand: August 2026).

**So gehst du vor:** Arbeite die Abschnitte von oben nach unten durch. Die
Grundausstattung brauchst du immer; Laufzeiten und Codequalitäts-Werkzeuge
installierst du, sobald du mit JavaScript oder Python loslegst.

---

## ✅ Schnellstart-Checkliste

1. [ ] Terminal einrichten (Windows: Windows Terminal / macOS: vorinstalliert)
2. [ ] Paketmanager (Windows: `winget` ist vorinstalliert / macOS: Homebrew)
3. [ ] Git installieren und konfigurieren
4. [ ] Visual Studio Code installieren
5. [ ] GitHub CLI installieren und anmelden
6. [ ] Claude Code installieren und anmelden
7. [ ] Bei Bedarf: Node.js (fnm) und/oder Python (uv)
8. [ ] Bei Bedarf: Formatter & Linter (Prettier, ESLint, Ruff)

---

## 1. Grundausstattung

### Homebrew (nur macOS/Linux) — Paketmanager

Der De-facto-Standard-Paketmanager für macOS, über den sich fast alle
Entwicklerwerkzeuge per Befehl installieren lassen. Unter Windows übernimmt das
vorinstallierte `winget` diese Rolle.

- Offizielle Seite: <https://brew.sh>

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

> Nach der Installation die im Terminal angezeigten „Next steps" ausführen,
> damit `brew` im PATH landet.

### Git — Versionskontrolle

Das Fundament von allem: verfolgt jede Änderung an deinem Code und ermöglicht
Zusammenarbeit über Branches und Pull Requests.

- Offizielle Seite: <https://git-scm.com/downloads>

| System  | Befehl                                           |
| ------- | ------------------------------------------------ |
| Windows | `winget install --id Git.Git -e --source winget` |
| macOS   | `brew install git`                               |
| Linux   | `sudo apt-get install git`                       |

Danach einmalig konfigurieren (wichtig für saubere Commits):

```bash
git config --global user.name "Dein Name"
git config --global user.email "deine@email.de"
git config --global init.defaultBranch main
```

### Visual Studio Code — Editor

Kostenloser, erweiterbarer Code-Editor mit integriertem Debugging,
Git-Integration und riesigem Extension-Marktplatz.

- Offizielle Seite: <https://code.visualstudio.com>

| System  | Befehl                                                                                           |
| ------- | ------------------------------------------------------------------------------------------------ |
| Windows | `winget install -e --id Microsoft.VisualStudioCode`                                              |
| macOS   | `brew install --cask visual-studio-code`                                                         |
| Linux   | `.deb` von <https://code.visualstudio.com/download> laden, dann `sudo apt install ./<datei>.deb` |

> Wenn du dieses Repository in VS Code öffnest, schlägt dir der Editor
> automatisch die empfohlenen Erweiterungen vor (definiert in
> `.vscode/extensions.json`) — einfach auf „Installieren" klicken.

### Windows Terminal (nur Windows)

Modernes Terminal mit Tabs und Profilen für PowerShell und WSL. Auf Windows 11
meist schon vorinstalliert.

- Offizielle Doku: <https://learn.microsoft.com/windows/terminal/install>

```powershell
winget install --id Microsoft.WindowsTerminal -e
```

---

## 2. GitHub-Werkzeuge

### GitHub CLI (gh)

Offizielles Kommandozeilen-Tool von GitHub: Pull Requests, Issues und Repos
direkt aus dem Terminal verwalten — perfekt zum Üben des PR-Workflows aus
diesem Repository.

- Offizielle Seite: <https://cli.github.com>

| System  | Befehl                                                                   |
| ------- | ------------------------------------------------------------------------ |
| Windows | `winget install --id GitHub.cli --source winget`                         |
| macOS   | `brew install gh`                                                        |
| Linux   | Anleitung: <https://github.com/cli/cli/blob/trunk/docs/install_linux.md> |

Danach anmelden:

```bash
gh auth login
```

---

## 3. Claude Code — dein KI-Entwicklungspartner

### Claude Code CLI

Anthropics offizielles agentisches Coding-Tool für das Terminal: versteht dein
Projekt, bearbeitet Dateien, führt Befehle aus und übernimmt komplette
Entwicklungsaufgaben.

- Quickstart: <https://code.claude.com/docs/en/quickstart>

| System  | Befehl                                                  |
| ------- | ------------------------------------------------------- |
| Windows | `irm https://claude.ai/install.ps1 \| iex` (PowerShell) |
| macOS   | `curl -fsSL https://claude.ai/install.sh \| bash`       |
| Linux   | `curl -fsSL https://claude.ai/install.sh \| bash`       |

Alternativ überall: `npm install -g @anthropic-ai/claude-code` (benötigt Node.js 22+).
Der native Installer wird offiziell empfohlen und aktualisiert sich automatisch.

**Erste Schritte:**

```bash
claude --version   # Installation prüfen
cd mein-projekt
claude             # startet Claude Code; Anmeldung per Browser mit deinem Claude-Konto
```

> Voraussetzungen: macOS 13+, Windows 10 (1809)+ oder Ubuntu 20.04+/Debian 10+;
> ein Claude-Abo (Pro, Max, Team oder Enterprise) oder Console-Zugang.
> Unter Windows wird Git for Windows empfohlen.

### Claude Code VS-Code-Erweiterung

Integriert Claude Code als grafisches Panel mit Inline-Diffs und Plan-Review
direkt in VS Code.

- Doku: <https://code.claude.com/docs/en/vs-code>
- Installation: In VS Code `Strg/Cmd+Umschalt+X` → „Claude Code" suchen →
  Install (Erweiterungs-ID: `anthropic.claude-code`)

### So „optimierst" du Claude Code in einem Projekt

Claude Code wird umso besser, je mehr Kontext dein Projekt mitliefert. In
diesem Repository ist das bereits eingerichtet:

- **`CLAUDE.md`** — liest Claude beim Start automatisch: Projektbeschreibung,
  Konventionen, Arbeitsweise. Lege in jedem deiner Projekte eine an
  (oder lass sie dir mit dem Befehl `/init` in Claude Code erzeugen).
- **`.editorconfig`** — einheitliche Formatierungsregeln für alle Editoren.
- **`.gitignore`** — hält Build-Artefakte und Geheimnisse aus Git heraus.
- **`.vscode/extensions.json`** — empfiehlt jedem, der das Projekt öffnet,
  die passenden Erweiterungen.

---

## 4. Sprachen & Laufzeiten

### Node.js (über fnm)

JavaScript-Laufzeitumgebung inkl. Paketmanager `npm`. Installiert wird sie über
den Versionsmanager **fnm** — der aktuell von <https://nodejs.org/en/download>
empfohlene Weg, mit dem du mehrere Node-Versionen parallel verwalten kannst.

| System  | Befehl                                                                                         |
| ------- | ---------------------------------------------------------------------------------------------- |
| Windows | `winget install Schniz.fnm`, Terminal neu starten, dann `fnm install 24`                       |
| macOS   | `brew install fnm && fnm install 24`                                                           |
| Linux   | `curl -o- https://fnm.vercel.app/install \| bash`, Terminal neu starten, dann `fnm install 24` |

Prüfen mit `node -v` und `npm -v`.

### Python (über uv)

**uv** ist der extrem schnelle Python-Paket- und Projektmanager von Astral —
er installiert auch Python selbst und ersetzt pip, virtualenv und pyenv in
einem Werkzeug.

- Offizielle Doku: <https://docs.astral.sh/uv/getting-started/installation/>

| System  | Befehl                                             |
| ------- | -------------------------------------------------- |
| Windows | `winget install --id=astral-sh.uv -e`              |
| macOS   | `brew install uv`                                  |
| Linux   | `curl -LsSf https://astral.sh/uv/install.sh \| sh` |

Danach Python installieren:

```bash
uv python install
```

---

## 5. Codequalität — sauber bleiben

Sauberer Code ist kein Zufall: Formatter und Linter erledigen das automatisch.

| Werkzeug                                                     | Für                                             | Installation                                   | Nutzung                      |
| ------------------------------------------------------------ | ----------------------------------------------- | ---------------------------------------------- | ---------------------------- |
| [Prettier](https://prettier.io/docs/install)                 | JS/TS, CSS, HTML, JSON, Markdown — Formatierung | `npm install --save-dev --save-exact prettier` | `npx prettier . --write`     |
| [ESLint](https://eslint.org/docs/latest/use/getting-started) | JS/TS — findet Fehler & Anti-Patterns           | `npm init @eslint/config@latest`               | `npx eslint .`               |
| [Ruff](https://docs.astral.sh/ruff/installation/)            | Python — Linter **und** Formatter in einem      | `uv tool install ruff`                         | `ruff check` / `ruff format` |

> Tipp: Formatter nicht diskutieren, sondern einfach laufen lassen — das
> beendet jede Stil-Debatte im Team.

---

## 6. Für später (optional)

Diese Werkzeuge brauchst du als Einsteiger noch nicht sofort, sie gehören aber
zur vollen Profi-Ausstattung:

- **WSL 2** (nur Windows) — vollwertige Linux-Umgebung direkt unter Windows:
  `wsl --install` in einer Administrator-PowerShell, dann neu starten.
  Doku: <https://learn.microsoft.com/windows/wsl/install>
- **Docker Desktop** — Container für reproduzierbare Entwicklungsumgebungen
  und lokale Dienste (z. B. Datenbanken). Windows: `winget install -e --id
Docker.DockerDesktop` (nutzt WSL 2), macOS: `brew install --cask
docker-desktop`. Doku: <https://docs.docker.com/desktop/>

---

## Fertig? So prüfst du dein Setup

```bash
git --version
code --version
gh --version
claude --version
node -v        # falls installiert
uv --version   # falls installiert
```

Wenn diese Befehle alle eine Versionsnummer ausgeben, ist dein Laptop bereit. 🚀
