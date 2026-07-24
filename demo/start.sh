#!/usr/bin/env bash
# Ein Befehl, der alles erledigt: Hardware pruefen, Ollama installieren,
# passendes Modell laden, Demo starten.
#
#   bash start.sh
#
# Nichts zu entscheiden. Laeuft unter Linux und macOS.
# Windows: erst WSL2 oeffnen, dann hier weitermachen.

set -euo pipefail
cd "$(dirname "$0")"

echo "== 1/4  Hardware =="
python3 hardware.py
MODELL="$(python3 hardware.py --nur-modell)"
echo

echo "== 2/4  Ollama =="
if command -v ollama >/dev/null 2>&1; then
  echo "bereits installiert: $(ollama --version 2>/dev/null | head -1)"
else
  echo "wird installiert ..."
  curl -fsSL https://ollama.com/install.sh | sh
fi

# Dienst starten, falls er nicht laeuft.
if ! curl -fsS http://localhost:11434/api/tags >/dev/null 2>&1; then
  echo "starte Dienst im Hintergrund ..."
  nohup ollama serve >/tmp/ollama.log 2>&1 &
  for _ in $(seq 1 30); do
    sleep 1
    curl -fsS http://localhost:11434/api/tags >/dev/null 2>&1 && break
  done
fi

if ! curl -fsS http://localhost:11434/api/tags >/dev/null 2>&1; then
  echo "Ollama laeuft nicht. Log ansehen: cat /tmp/ollama.log" >&2
  exit 1
fi
echo "laeuft"
echo

echo "== 3/4  Modell $MODELL =="
if ollama list 2>/dev/null | grep -q "^${MODELL%%:*}"; then
  echo "bereits vorhanden"
else
  echo "wird geladen, das dauert je nach Leitung ein paar Minuten ..."
  ollama pull "$MODELL"
fi
echo

echo "== 4/4  Demo: Beleg auslesen =="
echo "Eingabe: beispiele/beleg.txt"
echo
python3 extract.py --vorlage beleg beispiele/beleg.txt
echo
echo "Fertig. Kein Byte hat diesen Rechner verlassen."
echo
echo "Weiter geht es so:"
echo "  python3 extract.py --vorlage angebot beispiele/angebot.txt"
echo "  python3 extract.py --vorlage beleg   eigene_rechnung.pdf"
