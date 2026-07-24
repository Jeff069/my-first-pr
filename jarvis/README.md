# Jarvis — NanoClaw Setup-Paket

Dein persönlicher Assistent: erreichbar per Telegram, mit Gedächtnis, nach Zeitplan,
jeder Agent in einem eigenen Container.

Dieses Verzeichnis ist **kein** NanoClaw-Klon. Es enthält die Dateien und Befehle,
die du beim Einrichten brauchst, in der Reihenfolge, in der du sie brauchst.

---

## 0. Vorher entscheiden: lokal oder VPS?

| | Lokal (dein Rechner) | VPS |
|---|---|---|
| Kosten Infrastruktur | 0 € | ca. 5–10 €/Monat |
| Zeitpläne laufen | nur wenn der Rechner an ist | immer |
| Aufwand | gering | plus Server-Grundhärtung |

**Empfehlung für den Start:** lokal. Wenn das Morgenbriefing nach einer Woche
tatsächlich nützlich war, ziehst du auf einen VPS um — der Aufbau ist derselbe.

---

## 1. Voraussetzungen

- macOS oder Linux (Windows nur über WSL2)
- Node.js 20+ und pnpm 10+ — der Installer installiert beides, falls es fehlt
- Docker Desktop (macOS/Windows) oder Docker Engine (Linux)
- Claude Code (für Einrichtung und spätere Anpassungen)

Prüfen:

```bash
node --version      # v20 oder höher
docker --version    # Docker läuft?
docker ps           # muss ohne Fehler durchlaufen
```

Läuft `docker ps` nicht, ist alles andere sinnlos — erst Docker zum Laufen bringen.

---

## 2. Installation

```bash
git clone https://github.com/nanocoai/nanoclaw.git nanoclaw-v2
cd nanoclaw-v2
bash nanoclaw.sh
```

Das Skript installiert fehlende Abhängigkeiten, hinterlegt deine Anthropic-Zugangsdaten,
baut den Agenten-Container und koppelt den ersten Kanal.

Wichtig: **Zugangsdaten landen nicht im Container.** Ausgehende API-Aufrufe laufen über
den Agent Vault, der die Authentifizierung erst am Proxy einsetzt. Der Agent selbst
sieht deine Schlüssel nie — genau deshalb ist ein kompromittierter Container hier
nicht gleichbedeutend mit einem Schlüsseldiebstahl.

---

## 3. Telegram anbinden

Telegram zuerst, nicht WhatsApp. Begründung steht in `SICHERHEIT.md`.

1. In Telegram [@BotFather](https://t.me/BotFather) anschreiben → `/newbot` → Namen vergeben
2. Den Token, den BotFather ausgibt, bereithalten
3. In NanoClaw:

```
/add-telegram
```

Danach schreibst du deinem Bot in Telegram — und der Agent antwortet.

**Auslösewort:** Standard ist `@Andy`. Ändern geht im Chat, formlos:

```
Ändere das Auslösewort auf @Jarvis
```

---

## 4. Persönlichkeit und Gedächtnis einrichten

Zwei Dateien machen aus dem generischen Agenten *deinen*:

| Datei | Wo | Wozu |
|---|---|---|
| `instructions.prepend.md` | `/workspace/agent/` | Rolle, Ton, stehende Regeln |
| `memory/index.md` | `groups/<gruppe>/memory/` (Host) → `/workspace/agent/memory/` (Container) | dauerhafte Fakten |

In diesem Verzeichnis liegen Vorlagen für beide:

- [`instructions.prepend.md`](./instructions.prepend.md) — anpassen und übernehmen
- [`memory/index.md`](./memory/index.md) — Platzhalter ausfüllen

Zum Gedächtnis: Beim Start werden nur `index.md` und die Systemdefinition geladen.
Alles Weitere zieht sich der Agent über Links nach — deshalb darf das Gedächtnis
wachsen, ohne dass jeder Aufruf teurer wird. Halte `index.md` kurz und verweise
auf Unterdateien.

Format ist OKF v0.1: Markdown mit YAML-Frontmatter.

---

## 5. Erste Aufgabe: das Morgenbriefing

Der ganze Sinn der Sache — der Agent arbeitet, während du schläfst.

Zwei Wege, dasselbe Ergebnis:

**Formlos im Chat:**

```
@Jarvis schick mir werktags um 7 Uhr eine Übersicht über den Tag
```

**Oder präzise per CLI** (empfohlen, weil nachvollziehbar):

```bash
ncl tasks create \
  --group <deine-gruppen-id> \
  --name "morgenbriefing" \
  --recurrence "0 7 * * 1-5" \
  --prompt "$(cat tasks/morgenbriefing.prompt.md)"
```

Der Cron-Ausdruck wird in der Zeitzone der NanoClaw-Installation ausgewertet —
bei einem VPS im Ausland also unbedingt prüfen, sonst klingelt es um 4 Uhr früh.

Fertiger Prompt und weitere Aufgaben: [`tasks/`](./tasks/)

**Verwalten:**

```bash
ncl tasks list                  # was läuft?
ncl tasks run <task-id>         # sofort testen, ohne auf 7 Uhr zu warten
ncl tasks get <task-id>         # Läufe, Fehler, Logs
ncl tasks pause <task-id>       # Urlaub
```

Teste jede neue Aufgabe einmal mit `ncl tasks run`, bevor du sie laufen lässt.

---

## 6. Aufgaben, die nur bei Bedarf wecken

Ein Agent, der stündlich aufwacht und feststellt „nichts zu tun", kostet Geld für nichts.
Dafür gibt es Script Gates: ein Bash-Skript läuft **vor** dem Agenten und entscheidet,
ob er überhaupt geweckt wird.

Die letzte Zeile auf stdout muss JSON sein:

```json
{ "wakeAgent": false }
```

oder

```json
{ "wakeAgent": true, "data": { "alerts": 2 } }
```

Grenzen: 30 Sekunden Laufzeit, 1 MB Ausgabe. Zustand zwischen Läufen gehört nach
`/workspace/agent`. Beispiel: [`tasks/gate-beispiel.sh`](./tasks/gate-beispiel.sh)

---

## 7. Betrieb

```bash
ncl tasks list          # laufende Aufgaben
docker ps               # laufende Container
```

- **Updates:** regelmäßig `git pull` im NanoClaw-Verzeichnis. Das Projekt ist jung,
  Sicherheitskorrekturen kommen häufig.
- **Kosten:** Infrastruktur ist der kleine Posten, die Modellnutzung der große.
  Sieh nach der ersten Woche in der Anthropic-Konsole nach und rechne hoch, bevor
  du weitere Zeitpläne anlegst.
- **Neue Kanäle:** `/add-slack`, `/add-discord`, `/add-gmail` usw. — erst wenn
  Telegram sauber läuft.

NanoClaw arbeitet bewusst ohne Konfigurationsdateien: Anpassungen sagst du dem Agenten
im Chat oder machst sie mit Claude Code direkt im Code. `/customize` führt dich durch
die üblichen Änderungen.

---

## 8. Bevor du live gehst

Einmal durch [`SICHERHEIT.md`](./SICHERHEIT.md) — das sind zehn Minuten, und sie
unterscheiden dein Setup von den zehntausenden offen im Netz stehenden Instanzen,
die Sicherheitsforscher Anfang 2026 gefunden haben.
