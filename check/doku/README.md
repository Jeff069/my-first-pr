# Der Check

Ein hierarchisches Prüf-Team aus 30 Agenten — 1 Leitung, 5 Gruppenleiter,
19 Prüfer, 5 Sonderprüfer —, das dein Projekt gründlich durchgeht
**und erst losläuft, wenn du das GO gibst.**

## Installieren

Der Check wohnt in `~/.claude/` und **nicht** im geprüften Projekt.
Einmal installieren, in jedem Projekt verfügbar:

```bash
git clone <dieses-repo> ~/check && bash ~/check/install.sh
```

Danach in **jedem** Projektordner Claude Code starten und `/check` aufrufen.
Im Projekt selbst entsteht dabei keine einzige Datei — keine `.claude/`, keine
Berichte, kein Commit. Alles Geschriebene landet unter
`~/.claude/check/projekte/<projektname>/`.

Entfernen: `bash ~/check/install.sh --entfernen`

## Starten

```
/check
```

Die Leitung verschafft sich einen Überblick, schlägt dir eine **Aufstellung** vor
(wer würde laufen, worüber, wie viele Agenten) — und hält an.
Erst dein **GO** setzt den Check in Bewegung.

Kürzen ist jederzeit erlaubt: „nur Sicherheit und Kosten", „nur `src/api`",
„Kleine Runde".

## Aufbau

```
                            Leitung  (/check)
                                 │
   ┌──────────┬─────────────┬────┴────────┬──────────────┐
lead-code  lead-funktion  lead-oberflaeche  lead-betrieb  lead-produkt
```

| Gruppe | Prüfer | Frage |
|---------|--------|-------|
| **Code** | `pruefer-code`, `pruefer-bugs`, `pruefer-tests` | Ist es solide gebaut? |
| **Funktion** | `pruefer-funktionen`, `pruefer-api`, `pruefer-daten`, `chaos-agent` | Tut es, was es verspricht — auch wenn es schiefgeht? |
| **Oberfläche** | `pruefer-dashboard`, `pruefer-design`, `pruefer-barrierefreiheit` | Kann man es sehen und bedienen? |
| **Betrieb** | `pruefer-sicherheit`, `pruefer-performance`, `pruefer-abhaengigkeiten`, `pruefer-ci`, `pruefer-kosten` | Was passiert unter echter Last, mit echtem Geld? |
| **Produkt** | `pruefer-doku`, `pruefer-texte`, `pruefer-nutzerreise`, `pruefer-recht`, `pruefer-i18n` | Ist es verständlich, benutzbar, zulässig? |

**Sonderprüfer** stehen außerhalb der Gruppen, direkt bei der Leitung — weil sie
unbeeinflusst bleiben müssen:

| Sonderprüfer | Aufgabe |
|--------|---------|
| `advocatus-diaboli` | versucht jeden S1/S2-Befund zu **widerlegen**. Bekommt nur den Befund, nie die Begründung des Finders. |
| `pruefer-vollstaendigkeit` | fragt am Ende nur: *was wurde nicht geprüft?* |
| `neuer-entwickler` | sieht das Projekt bewusst zum ersten Mal — ohne Gedächtnis, ohne Vorwissen |
| `richter` | entscheidet, wenn zwei Gruppen sich widersprechen |
| `archivar` | läuft zuletzt und allein, schreibt das Gelernte fort |

Die Leitung spricht nur mit Ebene 1, Ebene 1 nur mit Ebene 2. So bleibt jeder
Kontext klein genug für echte Gründlichkeit statt Überflug.

## Aufstellungen

Nie laufen alle 30. Siehe [`aufstellungen.md`](aufstellungen.md):

- **Kleine Runde** (~7) — schneller Blick auf den Stand
- **Standard** (~18) — der übliche Durchlauf
- **Vollprüfung** (alle) — vor Release oder Übergabe
- **Einzelprüfung** (1) — eine Frage, ein Agent. Im Alltag oft das Beste.
- dazu anlassbezogene Aufstellungen („Rechnung zu hoch", „fühlt sich langsam an")

## Wie der Check dazulernt

Nach jedem Durchlauf verdichtet der `archivar` — alles außerhalb deines Projekts:

```
~/.claude/check/
  playbook.md                          ← projektübergreifend
  aufstellungen.md
  projekte/
    dein-projekt/
      gedaechtnis.md                   ← nur dieses Projekt
      verlauf.md
      berichte/    vorschlaege/
```

- **`gedaechtnis.md`** — Wissen über *dein Projekt*: Eigenheiten, Fallen,
  wackelige Stellen, und was du als „so gewollt" bestätigt hast (wird dann nie
  wieder gemeldet).
- **`playbook.md`** — Wissen über *das Prüfen selbst*: was Befunde brachte, was
  Leerlauf war, welche Falschmeldung woran lag. Gilt für **alle** deine Projekte —
  der Check wird also auch dadurch besser, dass du es anderswo benutzt.
- **`verlauf.md`** — Befunde pro Durchlauf, damit sichtbar wird, ob es besser wird.

Gedächtnis und Playbook werden vor dem nächsten Durchlauf gelesen. Durchlauf 3
ist deshalb deutlich schärfer als Durchlauf 1.

Braucht der Check dreimal denselben Ad-hoc-Spezialisten, legt der Archivar
einen fertigen Entwurf unter `vorschlaege/` ab — **fest ins Team aufgenommen
wird er nur von dir.**

## Hausregeln

1. Kein Befund ohne `datei:zeile`.
2. Kein Bug ohne konkreten Auslöser („wenn X, dann Y").
3. Jeder S1/S2-Befund geht durch den `advocatus-diaboli`.
4. Was nicht geprüft werden konnte, wird namentlich genannt — und jedes
   Überspringen eines Prüfers wird begründet. Still weggelassen sieht im
   Ergebnis aus wie bestanden, und das ist der gefährlichste Fehler.
5. Geschmack wird als Vorschlag markiert, nie als Fehler.
6. **Kein Agent ändert Code** und keiner legt etwas im Projekt ab. Erst der
   Bericht, dann entscheidest du.
7. Der `chaos-agent` arbeitet nur gegen lokale Umgebungen, nie gegen Produktion.

## Modellwahl

Urteilslastige Agenten laufen auf Opus, mechanische (`pruefer-doku`, `-i18n`,
`-texte`, `-abhaengigkeiten`, `-ci`, `-kosten`) auf Sonnet. Änderbar in der
`model:`-Zeile der jeweiligen Agentendatei.

## Eigene Agenten ergänzen

Neue Datei unter `check/agents/<name>.md` in diesem Repo (bei der
Symlink-Installation wirkt sie sofort; bei `--copy` einmal `install.sh` erneut
ausführen) mit dem Kopf:

```yaml
---
name: pruefer-xyz
description: Wann dieser Agent eingesetzt wird.
tools: Read, Grep, Glob, Bash, Write
model: opus
---
```

Darunter der Auftrag. Dann in `aufstellungen.md` eintragen und beim passenden
Gruppenleiter unter „Deine Prüfer" ergänzen — sonst wird er nie gerufen.
