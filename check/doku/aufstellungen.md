# Aufstellungen

Nicht jeder Durchlauf braucht alle Agenten. Die Leitung schlägt anhand
des Projekts eine Aufstellung vor — du entscheidest.

Die Zahlen sind Richtwerte: Der `advocatus-diaboli` läuft einmal **pro
S1/S2-Befund**, seine Anzahl steht also erst während des Durchlaufs fest.

## Kleine Runde (~7 Agenten, schnell)

Für kleine Projekte, frühe Phase, oder wenn du nur schnell wissen willst,
wie es steht.

`lead-code` → `pruefer-code`, `pruefer-bugs`
`lead-funktion` → `pruefer-funktionen`
`advocatus-diaboli` · `archivar`

## Standard (~18 Agenten)

Der übliche Durchlauf für ein Projekt mit Oberfläche und Nutzern.

`lead-code` → `pruefer-code`, `pruefer-bugs`, `pruefer-tests`
`lead-funktion` → `pruefer-funktionen`, `pruefer-api`
`lead-oberflaeche` → `pruefer-dashboard`, `pruefer-design`
`lead-betrieb` → `pruefer-sicherheit`, `pruefer-abhaengigkeiten`
`lead-produkt` → `pruefer-doku`
`advocatus-diaboli` · `pruefer-vollstaendigkeit` · `archivar`

## Vollprüfung (alle, gründlich)

Vor einem Release, vor einer Übergabe, vor dem ersten echten Nutzer.
Alle fünf Gruppen mit allen Prüfern, plus alle Sonderprüfer:
`advocatus-diaboli`, `pruefer-vollstaendigkeit`, `neuer-entwickler`,
`chaos-agent`, `richter` (nur bei Konflikten), `archivar`.

## Einzelprüfung

Eine einzelne Frage, ein einzelner Agent: „nur Sicherheit", „nur Design",
„nur die Nutzerreise beim Anmelden". Ohne Gruppenleiter, ohne Overhead.
Für den Alltag oft die beste Wahl.

## Anlassbezogene Aufstellungen

| Anlass | Aufstellung |
|--------|-----------|
| vor dem ersten öffentlichen Start | `pruefer-sicherheit`, `pruefer-recht`, `pruefer-nutzerreise`, `pruefer-texte`, `pruefer-ci` |
| Rechnung zu hoch | `pruefer-kosten`, `pruefer-performance` |
| „keiner versteht das Projekt" | `neuer-entwickler`, `pruefer-doku`, `pruefer-code` |
| „es fühlt sich langsam an" | `pruefer-performance`, `pruefer-daten`, `pruefer-dashboard` |
| „es sieht zusammengestückelt aus" | `pruefer-design`, `pruefer-texte`, `pruefer-barrierefreiheit` |
| vor einer Übergabe an andere | `pruefer-doku`, `neuer-entwickler`, `pruefer-tests`, `pruefer-ci` |

## Faustregeln

- Lieber **weniger Agenten, gründlicher**. Zwanzig oberflächliche Berichte sind
  schlechter als fünf belegte.
- `advocatus-diaboli` ist bei jedem größeren Durchlauf dabei — er verhindert,
  dass der Bericht sich mit Falschmeldungen entwertet.
- `pruefer-vollstaendigkeit` läuft immer als Letzter vor dem Archivar. Sein Satz
  „geprüft wurde X gründlich, Y oberflächlich, Z gar nicht" gehört in jeden
  Endbericht.
- `archivar` läuft **immer** — sonst lernt der Check nichts.
