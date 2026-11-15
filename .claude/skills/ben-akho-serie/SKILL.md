---
name: ben-akho-serie
description: Projektwissen für die KI-Videoserie "Ben Akho" (Higgsfield, vertikale Comic-Kurzvideos, Kiosk "KRANKFURT", Figuren Ben und Kevin). Use whenever the user talks about Ben Akho, Kevin, the KRANKFURT kiosk, Higgsfield images/videos/voices for the series, a new episode, prompts for Nano Banana / Seedream / Seedance, or asks to continue the video project.
---

# Ben Akho – Videoserie

Bevor du irgendetwas vorschlägst, schreibst oder generierst, lies diese Dateien im Repository:

1. `ben-akho/README.md` – aktueller Stand und Fortschritts-Checkliste
2. `ben-akho/SERIEN-BIBEL.md` – Stil, Figuren, Orte, feste Regeln, Stimmen-IDs, Arbeitsregeln
3. `ben-akho/HIGGSFIELD-LEITFADEN.md` – Modellwahl, Prompt-Regeln, Kosten, Lehren aus Fehlern
4. `ben-akho/FIGUREN-BRIEFS.md` – ausgefüllte Character Briefs und Prompt-Vorlagen für Ben und Kevin
5. Die Folge, an der gearbeitet wird, z. B. `ben-akho/FOLGE-01-SCHUFA.md`

## Arbeitsweise (vom Nutzer verlangt)
- Der Nutzer ist Laie. Antworte auf Deutsch, Schritt für Schritt, ein Schritt nach dem anderen. Nicht raten: Ergebnisse vom Nutzer ansehen und konkret bewerten.
- **Keine Credits ausgeben, ohne vorher die genauen Kosten zu nennen und ein Okay abzuwarten.**
- Der Nutzer generiert selbst auf higgsfield.ai mit **Unlimited**. Über Claude Code gibt es kein Unlimited. Liefere ihm deshalb kopierfertige Prompts plus exakte Einstellungen (Modell, Format, Auflösung, Referenzbilder in Reihenfolge, Anzahl Versionen) und eine Checkliste zum Bewerten.
- Prompts auf Englisch, Erklärungen auf Deutsch.

## Passende Skills in diesem Repository
- `character-consistency` – Figuren über alle Shots gleich halten (Brief → Nahaufnahme → 3-Felder-Sheet)
- `video-prompt-director` – einzelne Seedance-2.5-Prompts mit Referenz-Rollen, Stufen, Kamera, Audio
- `seedance-meme-comedy` – Comedy-Struktur mit sichtbarer Pointe
- `seedance-storyboard-grid-to-video` – nummeriertes Storyboard-Blatt als Referenz für Mehrfach-Shots
- `seedance-production-workflow` – ganze Folge planen, prüfen, gezielt reparieren

Offizielle Higgsfield-Doku (Modelle, Parameter, Thumbnails): `ben-akho/quellen/higgsfield/`.
Hinweis: Die offizielle Doku beschreibt die Higgsfield-CLI. In dieser Umgebung läuft Higgsfield stattdessen über den Higgsfield-Connector (MCP-Tools `mcp__Higgsfield__*`); die Modell- und Prompt-Hinweise gelten trotzdem.
