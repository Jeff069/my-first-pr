# Das Orchester

Ein hierarchisches Prüf-Ensemble aus 30 Agenten — 1 Dirigent, 5 Sektionsleiter,
19 Prüfer, 5 Solisten —, das dein Projekt gründlich durchgeht
**und erst losläuft, wenn du das GO gibst.**

## Starten

```
/orchester
```

Der Dirigent verschafft sich einen Überblick, schlägt dir eine **Besetzung** vor
(wer würde laufen, worüber, wie viele Agenten) — und hält an.
Erst dein **GO** setzt das Orchester in Bewegung.

Kürzen ist jederzeit erlaubt: „nur Sicherheit und Kosten", „nur `src/api`",
„Kammerkonzert".

## Aufbau

```
                            Dirigent  (/orchester)
                                 │
   ┌──────────┬─────────────┬────┴────────┬──────────────┐
lead-code  lead-funktion  lead-oberflaeche  lead-betrieb  lead-produkt
```

| Sektion | Prüfer | Frage |
|---------|--------|-------|
| **Code** | `pruefer-code`, `pruefer-bugs`, `pruefer-tests` | Ist es solide gebaut? |
| **Funktion** | `pruefer-funktionen`, `pruefer-api`, `pruefer-daten`, `chaos-agent` | Tut es, was es verspricht — auch wenn es schiefgeht? |
| **Oberfläche** | `pruefer-dashboard`, `pruefer-design`, `pruefer-barrierefreiheit` | Kann man es sehen und bedienen? |
| **Betrieb** | `pruefer-sicherheit`, `pruefer-performance`, `pruefer-abhaengigkeiten`, `pruefer-ci`, `pruefer-kosten` | Was passiert unter echter Last, mit echtem Geld? |
| **Produkt** | `pruefer-doku`, `pruefer-texte`, `pruefer-nutzerreise`, `pruefer-recht`, `pruefer-i18n` | Ist es verständlich, benutzbar, zulässig? |

**Solisten** stehen außerhalb der Sektionen, direkt beim Dirigenten — weil sie
unbeeinflusst bleiben müssen:

| Solist | Aufgabe |
|--------|---------|
| `advocatus-diaboli` | versucht jeden S1/S2-Befund zu **widerlegen**. Bekommt nur den Befund, nie die Begründung des Finders. |
| `pruefer-vollstaendigkeit` | fragt am Ende nur: *was wurde nicht geprüft?* |
| `neuer-entwickler` | sieht das Projekt bewusst zum ersten Mal — ohne Gedächtnis, ohne Vorwissen |
| `richter` | entscheidet, wenn zwei Sektionen sich widersprechen |
| `archivar` | läuft zuletzt und allein, schreibt das Gelernte fort |

Der Dirigent spricht nur mit Ebene 1, Ebene 1 nur mit Ebene 2. So bleibt jeder
Kontext klein genug für echte Gründlichkeit statt Überflug.

## Besetzungen

Nie laufen alle 30. Siehe [`besetzungen.md`](besetzungen.md):

- **Kammerkonzert** (~7) — schneller Blick auf den Stand
- **Standard** (~18) — der übliche Durchlauf
- **Sinfonie** (alle) — vor Release oder Übergabe
- **Solokonzert** (1) — eine Frage, ein Agent. Im Alltag oft das Beste.
- dazu anlassbezogene Besetzungen („Rechnung zu hoch", „fühlt sich langsam an")

## Wie das Orchester dazulernt

Nach jedem Durchlauf verdichtet der `archivar` drei Dateien:

- **`gedaechtnis.md`** — Wissen über *dein Projekt*: Eigenheiten, Fallen,
  wackelige Stellen, und was du als „so gewollt" bestätigt hast (wird dann nie
  wieder gemeldet).
- **`playbook.md`** — Wissen über *das Prüfen selbst*: was Befunde brachte, was
  Leerlauf war, welche Falschmeldung woran lag, welcher Zuschnitt zu groß war.
- **`verlauf.md`** — Befunde pro Durchlauf, damit sichtbar wird, ob es besser wird.

Beide ersten werden vor dem nächsten Durchlauf gelesen. Durchlauf 3 ist deshalb
deutlich schärfer als Durchlauf 1.

Braucht das Orchester dreimal denselben Ad-hoc-Spezialisten, legt der Archivar
einen fertigen Entwurf unter `vorschlaege/` ab — **fest ins Ensemble aufgenommen
wird er nur von dir.**

## Hausregeln

1. Kein Befund ohne `datei:zeile`.
2. Kein Bug ohne konkreten Auslöser („wenn X, dann Y").
3. Jeder S1/S2-Befund geht durch den `advocatus-diaboli`.
4. Was nicht geprüft werden konnte, wird namentlich genannt — und jedes
   Überspringen eines Prüfers wird begründet. Still weggelassen sieht im
   Ergebnis aus wie bestanden, und das ist der gefährlichste Fehler.
5. Geschmack wird als Vorschlag markiert, nie als Fehler.
6. **Kein Agent ändert Code.** Erst der Bericht, dann entscheidest du.
7. Der `chaos-agent` arbeitet nur gegen lokale Umgebungen, nie gegen Produktion.

## Modellwahl

Urteilslastige Agenten laufen auf Opus, mechanische (`pruefer-doku`, `-i18n`,
`-texte`, `-abhaengigkeiten`, `-ci`, `-kosten`) auf Sonnet. Änderbar in der
`model:`-Zeile der jeweiligen Agentendatei.

## Eigene Agenten ergänzen

Neue Datei unter `.claude/agents/<name>.md` mit dem Kopf:

```yaml
---
name: pruefer-xyz
description: Wann dieser Agent eingesetzt wird.
tools: Read, Grep, Glob, Bash, Write
model: opus
---
```

Darunter der Auftrag. Dann in `besetzungen.md` eintragen und beim passenden
Sektionsleiter unter „Deine Musiker" ergänzen — sonst wird er nie gerufen.
