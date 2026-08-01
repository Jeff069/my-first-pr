#!/usr/bin/env bash
# Installiert das Prüf-Orchester global nach ~/.claude/
# Das geprüfte Projekt bleibt dabei unberührt — dort wird nichts abgelegt.
#
#   bash install.sh            # verknüpft (symlink) — Updates per git pull
#   bash install.sh --copy     # kopiert stattdessen
#   bash install.sh --entfernen
set -euo pipefail

QUELLE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/orchester"
ZIEL="${CLAUDE_HOME:-$HOME/.claude}"
MODUS="${1:---link}"

agentenliste() { find "$QUELLE/agents" -maxdepth 1 -name '*.md' -print; }

entfernen() {
  local n=0 z
  while IFS= read -r datei; do
    z="$ZIEL/agents/$(basename "$datei")"
    if [ -e "$z" ] || [ -L "$z" ]; then rm -f "$z"; n=$((n+1)); fi
  done < <(agentenliste)
  rm -rf "$ZIEL/skills/orchester"
  echo "Entfernt: $n Agenten und die Skill /orchester."
  echo "Erhalten bleibt: $ZIEL/orchester (Gedächtnis, Playbook, Berichte)."
  echo "Das löschst du bei Bedarf selbst — dann ist alles Gelernte weg."
}

if [ "$MODUS" = "--entfernen" ] || [ "$MODUS" = "--uninstall" ]; then
  entfernen; exit 0
fi

mkdir -p "$ZIEL/agents" "$ZIEL/skills" "$ZIEL/orchester/projekte"

# 1. Agenten
anzahl=0
while IFS= read -r datei; do
  ziel="$ZIEL/agents/$(basename "$datei")"
  if [ "$MODUS" = "--copy" ]; then cp -f "$datei" "$ziel"; else ln -sfn "$datei" "$ziel"; fi
  anzahl=$((anzahl+1))
done < <(agentenliste)

# 2. Skill /orchester
rm -rf "$ZIEL/skills/orchester"
if [ "$MODUS" = "--copy" ]; then
  cp -R "$QUELLE/skills/orchester" "$ZIEL/skills/orchester"
else
  ln -sfn "$QUELLE/skills/orchester" "$ZIEL/skills/orchester"
fi

# 3. Doku und Vorlagen — nur anlegen, nie überschreiben (dein Gelerntes bleibt)
cp -f "$QUELLE/doku/besetzungen.md" "$ZIEL/orchester/besetzungen.md"
cp -f "$QUELLE/doku/README.md"      "$ZIEL/orchester/README.md"
[ -f "$ZIEL/orchester/playbook.md" ] || cp "$QUELLE/vorlagen/playbook.md" "$ZIEL/orchester/playbook.md"

echo "Orchester installiert nach $ZIEL"
echo "  $anzahl Agenten in  $ZIEL/agents/"
echo "  Skill /orchester in $ZIEL/skills/orchester/"
echo "  Archiv in           $ZIEL/orchester/projekte/<projektname>/"
[ "$MODUS" = "--copy" ] || echo "  (verknüpft — 'git pull' hier aktualisiert die Agenten sofort)"
echo
echo "Claude Code im Projektordner starten und /orchester aufrufen."
echo "Im Projekt selbst wird nichts angelegt."
