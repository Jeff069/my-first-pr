---
name: cine-presets
description: Kinematografische Preset-Bibliothek und Befehlssprache für KI-Videogenerierung im Stil professioneller Video-Studios (Kamerafahrten, VFX, Film-Looks, Shot-Befehle). Laden, wenn Video-Prompts gebaut, Shots geplant oder /shot-, /scene- oder /storyboard-Befehle verarbeitet werden sollen.
---

# CinePresets — Preset-Katalog & Befehlssprache

Diese Skill-Datei ist die zentrale Wissensbasis für den `cine-director`-Agenten und seine
Spezialisten. Sie definiert (1) die Befehlssprache, (2) den vollständigen Preset-Katalog
und (3) die Prompt-Baupläne pro Zielmodell.

## 1. Befehlssprache

Der Nutzer arbeitet mit kurzen Befehlen, der Agent übersetzt sie in fertige Prompts:

```
/shot   --subject "<Was passiert?>" --motion <preset[,preset2]> [--vfx <preset>]
        [--look <preset>] [--target <modell>] [--ar 16:9|9:16|1:1] [--dur 5s|8s|10s]
/scene  --idea "<Grobe Idee>"            → Agent schlägt Motion/Look/VFX selbst vor
/storyboard --idea "<Idee>" --shots N    → N zusammenhängende Shots als Sequenz
/remix  --shot <nr> --change "<Änderung>" → Variante eines vorherigen Shots
/presets [kamera|vfx|look]               → Katalog anzeigen
```

Regeln:
- Maximal 2 Kamera-Motions pro Shot kombinieren (mehr wird matschig).
- Fehlt `--target`, wird das universelle Prompt-Format ausgegeben.
- Prompts werden IMMER auf Englisch gebaut (Videomodelle verstehen Englisch am besten),
  die Erklärung dazu in der Sprache des Nutzers.

## 2. Preset-Katalog

### Kamera-Motion (Kategorie `kamera`)

| ID | Name | Prompt-Baustein (EN) |
|---|---|---|
| crash-zoom-in | Crash Zoom In | aggressive crash zoom in toward the subject, rapid focal punch |
| crash-zoom-out | Crash Zoom Out | violent crash zoom out revealing the surroundings |
| dolly-in | Dolly In | smooth dolly in, camera physically gliding toward the subject |
| dolly-out | Dolly Out | slow dolly out, gradually revealing the environment |
| super-dolly-in | Super Dolly In | dramatic long-throw dolly in from wide to close-up in one continuous move |
| dolly-zoom | Dolly Zoom (Vertigo) | vertigo dolly zoom, background warping while subject stays fixed |
| push-in | Push In | gentle push in on the subject's face, building intimacy |
| pull-back | Pull Back | steady pull back through the scene |
| orbit-360 | 360° Orbit | full 360 degree orbit around the subject, constant radius |
| arc-left | Arc Left | camera arcs left around the subject in a semicircle |
| arc-right | Arc Right | camera arcs right around the subject in a semicircle |
| pan-left | Pan Left | smooth pan left across the scene |
| pan-right | Pan Right | smooth pan right across the scene |
| whip-pan | Whip Pan | fast whip pan with motion blur transition |
| tilt-up | Tilt Up | slow tilt up from ground level to reveal the subject |
| tilt-down | Tilt Down | tilt down from above onto the subject |
| crane-up | Crane Up | crane rises vertically, scene shrinking below |
| crane-down | Crane Down | crane descends from high above toward the subject |
| overhead | Crane Overhead | top-down overhead shot, camera looking straight down |
| fpv-drone | FPV Drone | high-speed FPV drone shot weaving through the scene |
| drone-flyover | Drone Flyover | cinematic aerial flyover, smooth and wide |
| bullet-time | Bullet Time | frozen-moment bullet time, camera sweeping around suspended action |
| robo-arm | Robo Arm | precise robotic arm camera move, fast mechanical repositioning |
| snorricam | Snorricam | snorricam rig, camera fixed to the subject's body, world moving around them |
| handheld | Handheld | raw handheld camera, subtle shake, documentary energy |
| static | Static Tripod | locked-off static tripod shot, all motion within the frame |
| lazy-susan | Lazy Susan | subject on a slowly rotating turntable, camera static |
| head-tracking | Head Tracking | camera locked to the subject's head movement |
| object-pov | Object POV | point-of-view shot from the object itself |
| through-object | Through Object | camera passes impossibly through an object into the next space |
| eyes-in | Eyes In | extreme push into the subject's eye, transitioning through the iris |
| fisheye | Fisheye | ultra-wide fisheye lens, curved edges, exaggerated depth |
| dutch-angle | Dutch Angle | tilted dutch angle, unsettling diagonal horizon |
| car-grip | Car Grip Mount | vehicle-mounted grip shot alongside a moving car, road rushing past |
| buckle-up | Buckle Up | inside-vehicle POV, mounted behind the windshield |

### VFX (Kategorie `vfx`)

| ID | Name | Prompt-Baustein (EN) |
|---|---|---|
| explosion | Explosion | massive practical explosion behind the subject, debris and shockwave |
| disintegration | Disintegration | subject disintegrating into drifting particles |
| levitation | Levitation | subject levitating slowly off the ground, hair and clothes floating |
| set-on-fire | Set on Fire | flames igniting across the scene, embers rising |
| melting | Melting | surfaces melting and dripping like wax |
| freeze-shatter | Freeze & Shatter | scene freezing over, then shattering like glass |
| thunder-god | Thunder God | lightning striking around the subject, electric arcs on skin |
| invisible | Invisibility | subject fading to invisibility, clothes collapsing |
| turn-metal | Turning Metal | subject's skin turning to liquid chrome |
| portal | Portal Jump | glowing portal opening, subject stepping through into another world |
| time-freeze | Time Freeze | time frozen around the subject who keeps moving |
| glitch | Reality Glitch | reality glitching, RGB-split datamosh artifacts |
| smoke-reveal | Smoke Reveal | subject revealed as thick smoke clears |
| petal-burst | Petal Burst | explosion of flower petals swirling around the subject |

### Film-Looks (Kategorie `look`)

| ID | Name | Prompt-Baustein (EN) |
|---|---|---|
| kodak-35mm | 35mm Kodak | shot on 35mm Kodak film, fine grain, warm halation |
| grain-16mm | 16mm Grain | gritty 16mm film, heavy grain, slightly unstable gate |
| vhs-88 | VHS 1988 | 1988 VHS camcorder look, tracking lines, washed color |
| noir | Film Noir | black-and-white film noir, hard shadows, venetian-blind light |
| neo-noir | Neo-Noir Neon | neo-noir, wet asphalt reflecting neon signage, deep blacks |
| golden-hour | Golden Hour | golden hour backlight, long soft shadows, warm haze |
| blue-hour | Blue Hour | blue hour twilight, cool ambient glow, practical lights on |
| teal-orange | Teal & Orange | blockbuster teal-and-orange grade, high contrast |
| bleach-bypass | Bleach Bypass | bleach bypass process, desaturated, silvery highlights |
| dreamcore | Dreamcore | soft-bloom dreamcore, milky highlights, pastel fog |
| infrared | Infrared | infrared photography look, foliage glowing white-pink |
| high-bw | High-Contrast B&W | high-contrast black and white, deep blacks, sculpted light |

## 3. Prompt-Bauplan

Universelle Reihenfolge (funktioniert bei allen Modellen):

```
[Kamera-Motion]. [Subjekt & Aktion in einem präzisen Satz]. [Setting/Atmosphäre].
[Film-Look]. [VFX]. [Technik: Dauer, Seitenverhältnis]
```

Modell-spezifische Anpassungen:

- **Veo 3.x**: Audio explizit beschreiben (`Audio: ...` mit Sound-Design, ggf. Dialog
  in Anführungszeichen). Volle, ausformulierte Sätze. Dialoge funktionieren.
- **Kling 2.x**: Motion-Beschreibung an den Anfang, kurze klare Sätze, negative
  Begriffe in ein separates Negative-Prompt-Feld denken.
- **Runway Gen-4**: So knapp wie möglich. Kamera zuerst, dann Subjekt, dann Stil.
  Keine Füllwörter.
- **Luma Ray2 / Hailuo / Wan**: Universalformat, Motion-Verben betonen.
- **Sora 2**: Erzählerischer Stil erlaubt, Szenenkontext und Physik beschreiben.

Qualitätsregeln:
- Ein Shot = eine Aktion. Niemals zwei Handlungen in einen 5-Sekunden-Shot packen.
- Konkrete Verben statt Adjektivlisten ("she spins and the coat flares" statt
  "dynamic, epic, amazing").
- Bei Storyboards: Anschlüsse beachten (Blickrichtung, Licht, Tageszeit konsistent).
