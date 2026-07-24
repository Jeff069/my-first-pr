#!/usr/bin/env bash
# Script Gate: entscheidet, ob der Agent überhaupt geweckt wird.
#
# Wird VOR dem Agenten ausgeführt. Die letzte Zeile auf stdout muss JSON sein:
#   { "wakeAgent": false }
#   { "wakeAgent": true, "data": { ... } }
#
# Grenzen: 30 Sekunden Laufzeit, 1 MB Ausgabe.
# Zustand zwischen Läufen gehört nach /workspace/agent (bleibt erhalten).
#
# Dieses Beispiel prüft stündlich, ob sich eine Seite geändert hat, und weckt den
# Agenten nur dann. Spart bei 24 Läufen am Tag 23 unnötige Modellaufrufe.

set -euo pipefail

URL="https://example.com/preise"
STATE_DIR="/workspace/agent/gate-state"
STATE_FILE="$STATE_DIR/preise.sha256"

mkdir -p "$STATE_DIR"

# Seite holen. Bei Netzfehler NICHT wecken – ein Ausfall ist keine Änderung.
if ! body=$(curl -fsSL --max-time 20 "$URL"); then
  echo '{ "wakeAgent": false }'
  exit 0
fi

new_hash=$(printf '%s' "$body" | sha256sum | cut -d' ' -f1)
old_hash=$(cat "$STATE_FILE" 2>/dev/null || echo "")

printf '%s' "$new_hash" > "$STATE_FILE"

# Erster Lauf: nur merken, nicht wecken.
if [ -z "$old_hash" ]; then
  echo '{ "wakeAgent": false }'
  exit 0
fi

if [ "$new_hash" = "$old_hash" ]; then
  echo '{ "wakeAgent": false }'
else
  # data landet im Kontext des Agenten – gib ihm mit, was er wissen muss.
  printf '{ "wakeAgent": true, "data": { "url": "%s", "aenderung": "Inhalt hat sich geaendert" } }\n' "$URL"
fi
