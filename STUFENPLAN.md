# ED WorkOS — Stufenplanung (Excalidraw)

Aufbereitung des Dokuments *ED WorkOS – Stufenbeschreibung für die Planung in Excalidraw*
als fertiges Excalidraw-Board.

**Ziel:** monday.com und Kraaft langfristig durch eine zentrale interne Arbeitsplattform
ergänzen bzw. ersetzen.

## Dateien

| Datei | Zweck |
|---|---|
| `ED_WorkOS_Stufenplan.excalidraw` | Das Board — in [excalidraw.com](https://excalidraw.com) über *Menü → Öffnen* laden |
| `ED_WorkOS_Stufenplan_preview.svg` | Vorschau ohne Excalidraw (Browser genügt) |
| `tools/build_stufenplan.py` | Generator — Inhalte hier ändern und neu erzeugen |
| `tools/preview_svg.py` | Erzeugt die SVG-Vorschau aus der `.excalidraw`-Datei |

Neu erzeugen:

```bash
python3 tools/build_stufenplan.py
python3 tools/preview_svg.py
```

## Aufbau des Boards

Horizontaler Hauptfluss von links nach rechts. Jede Stufe ist eine Spalte mit vier
Bereichen — genau wie im Quelldokument vorgeschlagen:

- **ZIEL** (gelb) — wozu die Stufe dient
- **AUFGABEN** (weiß) — die Arbeitspakete
- **ERGEBNIS** (grün) — das Abnahmekriterium der Stufe
- **Abhängigkeit** (grau, gestrichelt) — welche Stufe vorher fertig sein muss

Darunter eine Meilenstein-Achse, das Planungsprinzip, die Leitplanken und eine Legende.

## Phasen und Stufen

| Phase | Stufen | Inhalt |
|---|---|---|
| **A — Fundament** | 0–2 | IST-Analyse, ED Datenmodell, Benutzer & Rechte |
| **B — Kernplattform** | 3–5 | Projektzentrale, Büro-Modul, Baustellen-Modul |
| **C — Auswertung & Automatisierung** | 6–8 | Finanz & Controlling, n8n Automation, KI / Paperclip |
| **D — Einführung** | 9–10 | Pilotprojekt, Migration & Rollout |

### Abhängigkeiten

```
0 → 1 → 2 → 3 ┬→ 4 ┬→ 6 ┬→ 8
              └→ 5 ┘    │
                 └──────┴→ 7 → 8
              4 + 5 → 9 → 10
```

### Meilensteine

| | Meilenstein | erreicht |
|---|---|---|
| M1 | Fundament steht | nach Stufe 2 |
| M2 | Plattform nutzbar | nach Stufe 5 |
| M3 | Steuerung & Automation | nach Stufe 8 |
| M4 | Go-Live | nach Stufe 10 |

## Planungsprinzip

Nicht monday.com und Kraaft vollständig nachbauen. Zuerst die tatsächlich genutzten
Kernfunktionen identifizieren und daraus ein schlankes ED-System entwickeln.

### Leitplanken

- Reihenfolge einhalten: Daten und Rechte vor Oberflächen, Oberflächen vor Automation.
- Jede Stufe hat ein abnehmbares Ergebnis — erst dann startet die nächste.
- Automation (7) und KI (8) erst, wenn die Basisprozesse stabil laufen.
- Altsysteme erst kündigen, wenn Stufe 9 den Nachweis erbracht hat.
