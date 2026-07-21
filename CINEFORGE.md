# CineForge — Dein KI-Video-Regie-System

CineForge ist ein komplettes Agenten-System für KI-Videogenerierung, aufgebaut nach dem
Workflow moderner Video-Studios wie Higgsfield: Presets statt Prompt-Raterei, Shots statt
Zufall. Es besteht aus drei Agenten, einer Wissensbasis und einer Studio-App.

> **Ehrlicher Hinweis:** CineForge ist nicht mit Higgsfield verbunden und ersetzt nicht
> deren proprietäre Modelle. Es repliziert den *Workflow* — Preset-Bibliothek,
> Shot-Denken, Befehlssprache — und erzeugt Prompts, die in jedem Videomodell
> funktionieren. Ist ein Generierungs-Tool (z.B. Videoslash Creative Studio) mit deiner
> Claude-Umgebung verbunden, generiert der Agent die Videos direkt.

## Die drei Agenten

| Agent | Rolle |
|---|---|
| `cine-director` | **Der Chef.** Nimmt deine Idee oder deinen Befehl entgegen, trifft Regie-Entscheidungen, baut Prompts, generiert Videos über verbundene Tools. Mit dem redest du. |
| `kamera-operator` | Spezialist für Kamerabewegung, Objektive, Kadrage. Wird vom Director bei kniffligen Shots hinzugezogen. |
| `prompt-schmied` | Übersetzt fertige Shot-Designs in das optimale Format für Veo, Kling, Runway, Luma, Sora & Co. |

## So benutzt du es

Öffne dieses Repository in Claude Code und sprich den Director einfach an:

```
Nutze den cine-director: Ich will ein Video von einem Boxer im leeren Ring, dramatisch.
```

Oder direkt mit Befehlen (die komplette Sprache steht in
`.claude/skills/cine-presets/SKILL.md`):

```
/shot --subject "Ein Boxer hebt langsam die Fäuste im leeren Ring"
      --motion super-dolly-in --look kodak-35mm --target veo --ar 16:9 --dur 8s

/scene --idea "Parfüm-Werbung, edel, nachts in Paris"

/storyboard --idea "Kurzfilm: Ein Roboter findet eine Blume" --shots 5

/presets kamera
```

## Die Studio-App

`studio/index.html` ist eine eigenständige Web-App (einfach im Browser öffnen —
keine Installation, kein Server):

- **Preset-Bibliothek**: 35 Kamera-Motions, 14 VFX, 12 Film-Looks — durchsuchbar
- **Shot-Builder**: Subjekt + Presets + Zielmodell + Format + Dauer
- **Prompt-Compiler**: baut den fertigen Prompt im Format des Zielmodells
  (Veo mit Audio-Zeile, Kling mit Negative-Prompt, Runway kompakt)
- **Agent-Befehl**: erzeugt parallel den passenden `/shot`-Befehl für den Director
- **Shot-Liste**: Shots sammeln und als Markdown-Storyboard exportieren
  (bleibt im Browser gespeichert)

## Wo die Videos herkommen

1. **Verbundene Tools**: Ist Videoslash Creative Studio (oder ein anderes
   Generierungs-MCP) mit Claude verbunden, generiert der `cine-director` direkt —
   er fragt vor jeder kostenpflichtigen Generierung nach deiner Freigabe.
2. **Gratis-Tiers**: Die Prompts aus App und Agent funktionieren 1:1 in den
   kostenlosen Kontingenten von Kling, Luma Dream Machine, Hailuo, Pika u.a.
3. **Eigene Abos**: Wer später doch ein Modell abonniert, nutzt dieselben Prompts.
