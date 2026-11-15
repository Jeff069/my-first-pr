# Serien-Bibel – Ben Akho

## Format
- Vertikale Kurzvideos **9:16** für TikTok, Instagram Reels und YouTube Shorts
- Ben Akho erklärt **Alltagsthemen** (Schufa, Steuern, Bewerbung …) auf seine Art: frech, Frankfurter Straße, aber **inhaltlich korrekt**
- Gegenspieler und Fragesteller: **Kevin**
- Ziellänge pro Folge: ca. **60 Sekunden**

## Stil (verbindlich)
Gezeichneter Großstadt-Comic. Originaltext des Nutzers:

> Vertikaler filmischer Großstadt-Comic mit räumlicher Tiefe. Gezeichnete Figuren und Umgebungen mit klaren dunklen Konturen, kontrollierten Texturen und plastischer, weich abgestufter Schattierung. Glaubhafte erwachsene Körperproportionen, markante Gesichter und ausdrucksstarke, zurückhaltende Mimik. Detaillierte Haare, Bärte und Kleidung entsprechend den beigefügten Charakterreferenzen. Authentische urbane Alltagsumgebung mit dezenten Gebrauchsspuren. Gedämpfte Grundfarben, gezielte kräftige Farbakzente und motiviertes Licht aus sichtbaren oder nachvollziehbaren Lichtquellen. Gesicht und Hände klar lesbar. Einheitlicher Zeichenstil für Figuren und Hintergrund. Filmische Bildkomposition mit eindeutiger Hauptaktion und ruhigem Hintergrund. Keine eingeblendeten Untertitel, Sprechblasen oder Wasserzeichen.

**Stil-Baustein für Prompts** (kurz, positiv formuliert – an jeden Prompt anhängen):

```
Style: cinematic urban graphic novel, hand-drawn with clean dark outlines, controlled textures, soft finely graded shading, believable adult proportions, distinctive faces, restrained expressions, subtle signs of wear, muted base colors with bold color accents, light from visible sources, faces and hands clearly readable, calm background, clean image.
```

Sobald das **Stil-Referenzbild** existiert, wird es bei jeder Generierung als Stil-Referenz mitgegeben.

**Style Lock (Castkit-Methode, wortwörtlich in jeden Figuren- und Umgebungs-Prompt):**

```
Rendered as a cinematic urban graphic-novel illustration: believable adult human proportions and bone structure, simplified in execution; clean confident dark outlines with varying line weight; matte, poreless skin with soft, finely graded shading carrying the form; controlled hand-drawn textures; hair drawn as grouped locks with a few separate strands; beards and fabric rendered in detail, cloth with real weight and folds; muted base colors with one or two bold color accents; distinctive faces with restrained, expressive features; one consistent drawing style across the entire image.
```

**Figuren nach Castkit:** Face Lock (Brustbild, 3:4, schwarzes Tanktop, flaches 18-%-Grau, kein Licht) → Outfit → 3-Felder-Blatt. Figuren tragen kein Licht, die Szene (Kiosk) macht das Licht.

## Figuren

### Ben Akho
- Mitte 20, Frankfurt, selbstbewusst, trocken, gelangweilt-überlegen, erklärt korrekt
- **Haare (festgelegt):** schwarz, Skin Fade an Seiten und Hinterkopf, Deckhaar lang mit offenen Locken bis zu den Schultern
- Gepflegter schwarzer Vollbart, kurz, scharfe Wangenlinie
- **Kein Muttermal** (vom Nutzer so entschieden)
- **Schwarzer Pullover** mit **nur „069"** in gotischer Schrift auf der Brust, verwaschene Jeans, rot-weiße Sneaker
- **Immer:** Energydrink-Dose (Red Bull) und **Zigarette hinterm Ohr** (nie im Mund – stört die Lippensynchronität)
- Spricht tief, ruhig, Frankfurter Slang („Babbel net", „Ischwör", „Lan", „Moruk")

### Kevin
- Ca. 20, **eindeutig erwachsen**, groß, schlaksig, dünn, leicht gebückt, nervös
- Blass, kurze unordentliche hellbraune Haare, dunkle Cap **nach vorne**, dünner Flaum-Schnurrbart
- Zu weiter hellgrauer Jogginganzug, kleine schwarze Umhängetasche, **altes Handy mit gesprungenem Display**, weiße No-Name-Sneaker
- Spricht höher, schneller, panisch

## Orte
- **Kiosk „KRANKFURT" innen** (Haupt-Set): Eingang **links** (Glastür mit Glocke), Getränkekühlschrank **rechts hinten**, kleine Theke, Regale mit Chips und Süßem, rotes Neonschild **„KRANKFURT"**. Nachts, draußen nasse Straße.
- **Kiosk außen**: Ladeneingang, Neonschild „KRANKFURT", Kopfsteinpflaster, Frankfurter Skyline im Hintergrund.

## Feste Regeln
- Kein Alkohol im Bild (im Prompt positiv: „only energy drinks and soft drinks")
- Nichts Religiöses (kein „Wallah")
- Kevin muss immer klar erwachsen wirken
- Keine eingeblendeten Texte in generierten Bildern; Untertitel kommen erst im Schnitt
- Marken (Red Bull, Nike, Gucci) im Prompt möglichst generisch beschreiben („blue-silver energy drink can"), sonst drohen IP-Sperren

## Stimmen (Higgsfield)
| Figur | Stimme | voice_type | voice_id |
|---|---|---|---|
| Ben | „Ben-Akho" (eigener Klon) | element | `7ac62ff9-696b-4f19-a295-ef84c2a31724` |
| Kevin | „Kevin" (Higgsfield-Preset) | preset | `f1373f24-3b96-433f-9a68-e595810ef608` |

Bewährt für Dialoge: Modell **Eleven v4** (`elevenlabs_v4`) mit `dialogue`-Liste, beide Stimmen in einer Datei, Stabilität 0,35.

## Arbeitsregeln
- **Vor jeder Generierung, die Credits kostet: Kosten nennen und auf Okay warten.**
- **Unlimited** des Nutzers gilt auf higgsfield.ai sowie im Claude-Chat, in Claude-Projekten und in Cowork (`use_unlim: true`), **nicht** in Claude Code. Im Claude-Projekt darf Claude also mit Unlimited direkt generieren; greift Unlimited für ein Modell nicht, erst Kosten nennen und fragen.
- Schritt für Schritt: ein Schritt muss sitzen, bevor der nächste kommt. Nicht raten – Ergebnisse vom Nutzer ansehen und konkret bewerten.

## Vorhandene Dateien in Higgsfield (Stand Folge-1-Vorarbeit)
Diese gehören zur alten 3D-Version und dienen nur noch als Vorlage:
- Ben-Charakter-Sheet (3D-Vorlage des Nutzers), media `eafa857e-3f77-45e2-b972-20c7a38aa0f1`
- Ben + Kevin vor „KRANKFURT" (3D), media `c27993b7-4ede-4ff9-ae52-0f2c6d567ad0`
