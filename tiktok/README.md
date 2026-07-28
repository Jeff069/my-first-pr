# TikTok-Schnitt ohne Abo

Schneidet eigene Clips zu und fuegt sie zu **einem** Video im TikTok-Format
(1080x1920, 9:16) zusammen. Keine Laengenbegrenzung, keine Credits, kein Abo —
nur `ffmpeg`.

## Installation

```bash
brew install ffmpeg          # macOS
sudo apt install ffmpeg      # Ubuntu/Debian
winget install Gyan.FFmpeg   # Windows (danach in Git Bash oder WSL nutzen)
```

## Benutzung

1. Clips in einen Ordner legen, z. B. `clips/`
2. `schnittliste.example.txt` nach `schnittliste.txt` kopieren und anpassen
3. Laufen lassen:

```bash
./tiktok-cut.sh schnittliste.txt mein-video.mp4
```

## Schnittliste

Eine Zeile pro Clip, in der Reihenfolge des fertigen Videos:

```
datei | startzeit | dauer
```

`dauer` leer lassen heisst "bis zum Ende des Clips". Zeitangaben als Sekunden
(`12`) oder `MM:SS` (`00:12`).

## Optionen

| Variable | Standard | Bedeutung |
|---|---|---|
| `MODUS` | `fill` | `fill` beschneidet auf 9:16, `fit` fuegt schwarze Balken hinzu |
| `MUSIK` | – | Pfad zu einer Audiodatei, die unter das ganze Video gelegt wird |
| `MUSIK_VOL` | `0.25` | Lautstaerke der Musik (0.0–1.0), Originalton bleibt erhalten |
| `FPS` | `30` | Bildrate des Ergebnisses |

Beispiel:

```bash
MUSIK=beat.mp3 MUSIK_VOL=0.2 MODUS=fill ./tiktok-cut.sh schnittliste.txt
```

## Warum jeder Clip neu kodiert wird

Handy-Aufnahmen unterscheiden sich fast immer in Aufloesung, Bildrate oder
Tonspur — teils sogar innerhalb derselben Aufnahmesession. Werden solche Clips
direkt aneinandergehaengt, bricht `ffmpeg` ab oder das Ergebnis hat Bild-/
Ton-Versatz. Das Skript normalisiert deshalb jeden Clip zuerst auf ein
einheitliches Format (inkl. Stille fuer Clips ohne Tonspur) und fuegt erst
danach verlustfrei zusammen.
