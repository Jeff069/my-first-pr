#!/usr/bin/env bash
#
# tiktok-cut.sh — eigene Clips zuschneiden und zu einem TikTok-Video zusammenfuegen.
#
# Braucht: ffmpeg + ffprobe (https://ffmpeg.org/download.html)
#
#   macOS:   brew install ffmpeg
#   Ubuntu:  sudo apt install ffmpeg
#   Windows: winget install Gyan.FFmpeg   (dann in Git Bash / WSL ausfuehren)
#
# Benutzung:
#   ./tiktok-cut.sh schnittliste.txt [ausgabe.mp4]
#
# Optionen ueber Umgebungsvariablen:
#   MODUS=fill|fit   fill = auf 9:16 beschneiden (Standard), fit = schwarze Balken
#   MUSIK=song.mp3   Hintergrundmusik unter das ganze Video legen
#   MUSIK_VOL=0.25   Lautstaerke der Musik (0.0-1.0), Standard 0.25
#   FPS=30           Bildrate, Standard 30
#
set -euo pipefail

BREITE=1080
HOEHE=1920
FPS="${FPS:-30}"
MODUS="${MODUS:-fill}"
MUSIK="${MUSIK:-}"
MUSIK_VOL="${MUSIK_VOL:-0.25}"

liste="${1:-}"
ausgabe="${2:-tiktok-final.mp4}"

if [[ -z "$liste" || ! -f "$liste" ]]; then
  echo "Fehler: Schnittliste fehlt oder nicht gefunden." >&2
  echo "Aufruf: $0 <schnittliste.txt> [ausgabe.mp4]" >&2
  exit 1
fi

for prog in ffmpeg ffprobe; do
  command -v "$prog" >/dev/null || { echo "Fehler: '$prog' ist nicht installiert." >&2; exit 1; }
done

# Alle Clips landen erst normalisiert in einem Temp-Ordner. Ohne diesen Schritt
# schlaegt das Zusammenfuegen fehl, sobald die Clips unterschiedliche Aufloesung,
# Bildrate oder Tonspur haben — was bei Handy-Aufnahmen die Regel ist.
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

case "$MODUS" in
  fill) skalierung="scale=${BREITE}:${HOEHE}:force_original_aspect_ratio=increase,crop=${BREITE}:${HOEHE}" ;;
  fit)  skalierung="scale=${BREITE}:${HOEHE}:force_original_aspect_ratio=decrease,pad=${BREITE}:${HOEHE}:(ow-iw)/2:(oh-ih)/2:black" ;;
  *)    echo "Fehler: MODUS muss 'fill' oder 'fit' sein (war: '$MODUS')." >&2; exit 1 ;;
esac
videofilter="${skalierung},setsar=1,fps=${FPS},format=yuv420p"

nummer=0
: > "$tmp/concat.txt"

while IFS= read -r zeile || [[ -n "$zeile" ]]; do
  zeile="${zeile%%#*}"                      # Kommentare ab '#' abschneiden
  zeile="$(echo "$zeile" | xargs 2>/dev/null || true)"
  [[ -z "$zeile" ]] && continue

  IFS='|' read -r datei start dauer <<< "$zeile"
  datei="$(echo "${datei:-}" | xargs)"
  start="$(echo "${start:-0}" | xargs)"
  dauer="$(echo "${dauer:-}" | xargs)"

  if [[ ! -f "$datei" ]]; then
    echo "Fehler: Datei nicht gefunden: '$datei'" >&2
    exit 1
  fi

  nummer=$((nummer + 1))
  teil="$tmp/teil_$(printf '%03d' "$nummer").mp4"
  printf 'Verarbeite [%d] %s (ab %s%s)\n' "$nummer" "$datei" "$start" "${dauer:+, ${dauer}s}"

  # Clips ohne Tonspur bekommen Stille, sonst bricht das Zusammenfuegen ab.
  hat_ton="$(ffprobe -v error -select_streams a -show_entries stream=index -of csv=p=0 "$datei" | head -1)"

  args=(-y -loglevel error -ss "$start")
  [[ -n "$dauer" ]] && args+=(-t "$dauer")
  args+=(-i "$datei")

  if [[ -z "$hat_ton" ]]; then
    args+=(-f lavfi -i "anullsrc=channel_layout=stereo:sample_rate=48000" -map 0:v:0 -map 1:a:0)
    [[ -n "$dauer" ]] && args+=(-t "$dauer")
  else
    args+=(-map 0:v:0 -map 0:a:0)
  fi

  args+=(
    -vf "$videofilter"
    -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p
    -c:a aac -b:a 192k -ar 48000 -ac 2
    -af "aresample=async=1:first_pts=0"
    -movflags +faststart
    "$teil"
  )

  ffmpeg "${args[@]}"
  printf "file '%s'\n" "$teil" >> "$tmp/concat.txt"
done < "$liste"

if [[ "$nummer" -eq 0 ]]; then
  echo "Fehler: Schnittliste enthaelt keine gueltigen Zeilen." >&2
  exit 1
fi

echo "Fuege $nummer Clips zusammen ..."

if [[ -n "$MUSIK" ]]; then
  [[ -f "$MUSIK" ]] || { echo "Fehler: Musikdatei nicht gefunden: '$MUSIK'" >&2; exit 1; }
  # Originalton bleibt drin, Musik wird leiser daruntergelegt und ggf. geloopt.
  ffmpeg -y -loglevel error \
    -f concat -safe 0 -i "$tmp/concat.txt" \
    -stream_loop -1 -i "$MUSIK" \
    -filter_complex "[1:a]volume=${MUSIK_VOL}[bg];[0:a][bg]amix=inputs=2:duration=first:dropout_transition=0[a]" \
    -map 0:v -map "[a]" \
    -c:v copy -c:a aac -b:a 192k -movflags +faststart \
    "$ausgabe"
else
  ffmpeg -y -loglevel error \
    -f concat -safe 0 -i "$tmp/concat.txt" \
    -c copy -movflags +faststart \
    "$ausgabe"
fi

laenge="$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$ausgabe" | cut -d. -f1)"
echo "Fertig: $ausgabe (${laenge}s, ${BREITE}x${HOEHE}, ${FPS}fps)"
