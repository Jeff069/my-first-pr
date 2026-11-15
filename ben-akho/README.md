# Ben Akho – Videoserie

Wissensordner für die KI-Videoserie **„Ben Akho erklärt …"** (Higgsfield).
Hier steht alles, was in neuen Sitzungen nicht verloren gehen darf.

| Datei | Inhalt |
|---|---|
| [`SERIEN-BIBEL.md`](./SERIEN-BIBEL.md) | Figuren, Stil, Orte, feste Regeln, Stimmen, vorhandene Assets |
| [`HIGGSFIELD-LEITFADEN.md`](./HIGGSFIELD-LEITFADEN.md) | Modellwahl, Prompt-Regeln, Seedance-2.5-Struktur, Kosten, Fehler aus der Praxis |
| [`FIGUREN-BRIEFS.md`](./FIGUREN-BRIEFS.md) | Ausgefüllte Character Briefs, Nahaufnahme- und Sheet-Prompts für Ben und Kevin |
| [`FOLGE-01-SCHUFA.md`](./FOLGE-01-SCHUFA.md) | Drehbuch Folge 1 (Schufa), 60 Sekunden |
| [`QUELLEN.md`](./QUELLEN.md) | Herkunft und Lizenzen der eingebundenen Skills und Dokus |
| [`quellen/higgsfield/`](./quellen/higgsfield/) | Offizielle Higgsfield-Doku als Nachschlagewerk |

**Aktive Skills** für Claude liegen in `.claude/skills/` im Hauptverzeichnis und werden in neuen Sitzungen automatisch erkannt:
`ben-akho-serie`, `character-consistency`, `video-prompt-director`, `seedance-meme-comedy`, `seedance-storyboard-grid-to-video`, `seedance-production-workflow`.

**Für Claude in einer neuen Sitzung:** Lies zuerst diese Dateien, bevor du Prompts schreibst oder etwas generierst.

## Aktueller Stand (Fundament-Aufbau)

Wir bauen zuerst das Fundament, dann erst die Folgen:

1. [ ] **Stil-Referenzbild** (Kiosk innen, ohne Figuren) – Schritt 1
2. [ ] **Kiosk innen** in 3 Blickwinkeln (Totale, Richtung Eingang, Richtung Kühlschrank)
3. [ ] **Kiosk außen**
4. [ ] **Ben** – erst Nahaufnahme, dann 3-Felder-Sheet im Comic-Stil (Prompts in `FIGUREN-BRIEFS.md`)
5. [ ] **Kevin** – erst Nahaufnahme, dann 3-Felder-Sheet im Comic-Stil (Prompts in `FIGUREN-BRIEFS.md`)
6. [ ] Alles als **Elements** in Higgsfield speichern
7. [ ] Erst dann: Folge 1 verfilmen
