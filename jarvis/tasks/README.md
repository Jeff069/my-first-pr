# Aufgaben

Zeitpläne werden nicht in Dateien konfiguriert, sondern mit `ncl tasks create` angelegt.
Die Prompts hier sind die Vorlagen dafür — versioniert, damit du siehst, was sich
wann geändert hat.

## Anlegen

```bash
ncl tasks create \
  --group <deine-gruppen-id> \
  --name "morgenbriefing" \
  --recurrence "0 7 * * 1-5" \
  --prompt "$(cat morgenbriefing.prompt.md)"
```

`--recurrence` ist ein Cron-Ausdruck in der Zeitzone der NanoClaw-Installation.
Für einen einmaligen Lauf stattdessen `--process-after "2026-08-01T09:00:00+02:00"`.

Immer zuerst testen:

```bash
ncl tasks run <task-id>
```

## Cron-Spickzettel

| Ausdruck | Wann |
|---|---|
| `0 7 * * 1-5` | werktags 7:00 |
| `0 17 * * 5` | freitags 17:00 |
| `0 * * * *` | jede volle Stunde |
| `*/15 * * * *` | alle 15 Minuten |
| `0 9 1 * *` | am 1. jedes Monats, 9:00 |

## Vorhandene Vorlagen

| Datei | Empfohlener Zeitplan | Zweck |
|---|---|---|
| `morgenbriefing.prompt.md` | `0 7 * * 1-5` | Termine, offene Antworten, Fristen |
| `gate-beispiel.sh` | `0 * * * *` | stündlich prüfen, nur bei Änderung wecken |

## Nächste sinnvolle Aufgaben

Nicht alle auf einmal — erst wenn das Morgenbriefing eine Woche lang getaugt hat:

- **Wochenrückblick**, freitags 17:00: was wurde erledigt, was bleibt liegen
- **Posteingang sortieren**, zweimal täglich: was braucht Antwort, was kann warten
- **Überwachung** per Script Gate: Preis, Verfügbarkeit, Serverstatus
- **Wochenvorschau**, sonntags abends: was kommt, wo fehlt Vorbereitung

## Regeln, die sich bewährt haben

1. **Ein Zeitplan pro Woche neu.** Wer fünf auf einmal anlegt, weiß bei Fehlern nicht,
   welcher schuld ist — und zahlt für vier, die er nicht liest.
2. **Jede Aufgabe braucht einen Abbruch.** Sag im Prompt, was der Agent tun soll,
   wenn es nichts zu melden gibt. Sonst schreibt er trotzdem etwas.
3. **Gate vor Häufigkeit.** Alles, was öfter als täglich läuft, gehört hinter ein
   Script Gate.
4. **Nach zwei Wochen aufräumen.** `ncl tasks list` — was du nicht liest, `pause`.
