# Higgsfield-Leitfaden

Zusammengefasst aus den offiziellen Higgsfield-Skills (github.com/higgsfield-ai/skills), zwei Praxis-Repos
(nigo-studio/ai-film-skills, LearnPrompt/awesome-seedance) und den Fehlern aus unseren eigenen Versuchen.

## 1. Welches Modell wofür

| Aufgabe | Modell | Hinweis |
|---|---|---|
| Comic-/gezeichnete Figuren | **Nano Banana 2** | offizielle Empfehlung für Cartoon/Illustration |
| Charakter-Sheets | **Seedream 5.0 Pro** | bis 10 Referenzen, auf der Website unlimited |
| Orte ohne Personen | **Soul Location** | nur Text, keine Referenzbilder möglich |
| Schwierige Bilder, Text im Bild | **Nano Banana Pro** | höchste Genauigkeit |
| Video, Bewegung, Mehrfach-Shots, Lippensynchronität | **Seedance 2.5** | 4–30 s, bis 1080p, Audio-Referenz für Lipsync |
| Sprache, Dialog mit 2 Stimmen | **Eleven v4** | `dialogue`-Liste, bis 10 Stimmen |
| Fertiges Video bewerten (Hook, Aufmerksamkeit) | **Virality Predictor** | kostet Credits, erst bei fertiger Folge |

## 2. Prompt-Regeln (offiziell + Praxis)
1. **Kurz:** höchstens ca. 200 Wörter. Lange Prompts verzerren.
2. **Positiv formulieren:** „only energy drinks and soft drinks" statt „no alcohol". Jedes „no X" schreibt X ins Bild.
3. **Bild aus Startbild (Image-to-Video):** nur die **Bewegung** beschreiben, nicht das Bild nochmal.
4. **Bearbeitung:** nur die **Änderung** beschreiben.
5. **Bewegung statt Ergebnis:** „geht zur Tür", nicht „wird kleiner".
6. **Nur Sichtbares:** Was außerhalb des Bildes passiert, als Wirkung (Lichtstreifen) oder Ton beschreiben.
7. **Gefühle sichtbar machen:** Blick, Mund, Atem, Pause – kein „er ist wütend". Auslöser vor Reaktion.
8. **Kamera konkret:** Einstellungsgröße + Bewegung + Richtung + Ziel („halbnah, Kamera fährt langsam auf Ben zu").
9. **Keine Effektwörter für Humor** („funny"): Die Pointe muss eine sichtbare Handlung oder ein Objekt sein. Kamera und Physik bleiben todernst, vor der Pointe eine stille Sekunde.
10. **Mit einem gehaltenen Zustand enden**, damit das Modell nichts dazuerfindet.
11. **Keine Texte rendern lassen** (Titel, Abspann): kommen im Schnitt dazu.
12. **Marken meiden** (IP-Sperre möglich).

## 3. Seedance-2.5-Prompt-Struktur (für jeden Video-Shot)

```text
[Generation Goal]
Ein bis zwei Sätze: Art des Videos, Hauptfigur, Hauptereignis.

[Reference Material Roles]
@Image 1 defines Ben's facial features, hairstyle, and clothing. Do not use the grey background or the panel layout.
@Image 2 defines Kevin's facial features, hairstyle, and clothing. Do not use the grey background or the panel layout.
@Image 3 is the first frame.

[Subjects and Relationships]
Wer steht wo, relativ zu festen Objekten (Tür, Theke, Kühlschrank), Blickrichtung.

[Event Script]
Stage 1 - <Name>: Opening state: ... <eine Hauptaktion> ... End state: ...
Stage 2 - ...: Continue from the previous stage. ... End state: ...

[Visual and Camera Treatment]
Einstellungsgröße, Bewegung, Lichtquellen.

[Audio]
<Soundeffekte> in spitzen Klammern, {Dialog} in geschweiften Klammern.
Ben says in a deep, calm voice, {Anfrage abgelehnt.} Only Ben speaks.

[Maintain Consistency]
Was nicht abweichen darf: Gesichter, Kleidung, Dose in Bens rechter Hand, Seite der Kamera.
```

- `@Image N` = Reihenfolge, in der die Bilder hochgeladen werden.
- `@Image N is the first frame.` / `is the last frame.` als eigener Satz fixiert Start-/Endbild.
- Dialog: nur exakt die Worte aus dem Skript in `{...}`.
- Anschluss zwischen Clips: letztes Bild des vorigen Clips als erstes Bild des nächsten.
- Kamera bleibt auf einer Seite der Handlungsachse (sonst springen die Figuren).

## 4. Figuren gleich halten (Methode)
1. **Character Brief** ausfüllen: Name, Alter/Statur, Gesicht, Haare, Outfit Stück für Stück. Was nicht im Text steht, existiert für das Modell nicht.
2. **Nahaufnahme fixieren** (Brustbild, frontal, grauer Hintergrund), mehrere Versionen, die beste wird „die Figur".
3. **Charakter-Sheet** im Querformat 16:9 mit der Nahaufnahme als Referenz: Brustbild vorne, Ganzkörper vorne, Ganzkörper hinten, **kühles Grau**, Sheet **neutral** halten.
4. In jedem späteren Prompt: Referenz-Rolle + Merkmale in Worten wiederholen, ohne der Referenz zu widersprechen.
5. Neues Outfit = neues Sheet.

## 5. Lehren aus unseren Versuchen
- **Format prüfen:** Sheets in 16:9, sonst zeichnet das Modell 4-mal dieselbe Ansicht.
- **Nur eine Referenz für Sheets,** sonst rutscht der Hintergrund des zweiten Bildes hinein.
- **Referenz-Reihenfolge** entscheidet, welches Bild als Basis gilt.
- **Bearbeitungen nicht stapeln:** Jede Bearbeitung macht das Bild weicher und matschiger. Nach 1–2 Bearbeitungen lieber frisch generieren.
- **Beim Einfügen einer zweiten Figur** Größe und Alter ausdrücklich festlegen („adult, his head is higher than …"), sonst wirkt sie wie ein Kind.
- **Stil-Ansteckung:** Eine gezeichnete Referenz färbt die ganze Szene. Mit „Take only face and clothes, not the drawing style" gegensteuern – oder alle Assets im gleichen Stil bauen.
- **Kippe hinterm Ohr** wandert gern in den Mund: ausdrücklich „tucked behind his ear" und Mund geschlossen.
- **Lange Wörter im Neonschild** (KRANKFURT) buchstabieren: `K-R-A-N-K-F-U-R-T`.

## 6. Kosten (über die Claude-Verbindung, Stand Nov. 2026)
| Was | Kosten |
|---|---|
| GPT Image 2.6, low, 1K | 0,25 Credits/Bild |
| Nano Banana Pro, 2K | 2 Credits/Bild |
| Eleven v4 Dialog, ca. 25 s | ca. 2 Credits |
| Seedance 2.0 Fast, 480p | ca. 1 Credit/s |
| Wan 2.7, 720p | ca. 1,5 Credits/s |
| Seedance 2.5, 480p / 720p | ca. 3 / 7 Credits/s |
| Intone, 480p, 30 s | ca. 90 Credits |

Auf der Website sind Nano Banana Pro, Seedream 5.0 Pro, Seedance 2.5 und Text-to-Speech für den Nutzer **unlimited**.

## 7. Technische Notizen für Claude
- Higgsfield-Workspace muss ausgewählt sein, sonst sind eigene Stimmen nicht sichtbar (`select_workspace`).
- Erlaubte Hosts in der Umgebung: `upload.higgsfield.ai` (Uploads), `d8j0ntlcm91z4.cloudfront.net` (Ergebnisse ansehen).
- Uploads: `media_upload` → `curl -X PUT` mit `If-None-Match: *` → `media_confirm`.
