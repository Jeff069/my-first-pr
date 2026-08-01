#!/usr/bin/env bash
# Installiert die Prüf-Agenten (/check) global nach ~/.claude/
# Das geprüfte Projekt bleibt dabei unberührt — dort wird nichts abgelegt.
#
#   bash install.sh            # verknüpft (symlink) — Updates per git pull
#   bash install.sh --copy     # kopiert stattdessen
#   bash install.sh --entfernen
set -euo pipefail

QUELLE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/check"
ZIEL="${CLAUDE_HOME:-$HOME/.claude}"
MODUS="${1:---link}"

agentenliste() { find "$QUELLE/agents" -maxdepth 1 -name '*.md' -print; }

entfernen() {
  local n=0 z
  while IFS= read -r datei; do
    z="$ZIEL/agents/$(basename "$datei")"
    if [ -e "$z" ] || [ -L "$z" ]; then rm -f "$z"; n=$((n+1)); fi
  done < <(agentenliste)
  rm -rf "$ZIEL/skills/check"
  echo "Entfernt: $n Agenten und die Skill /check."
  echo "Erhalten bleibt: $ZIEL/check (Gedächtnis, Playbook, Berichte)."
  echo "Das löschst du bei Bedarf selbst — dann ist alles Gelernte weg."
}

if [ "$MODUS" = "--entfernen" ] || [ "$MODUS" = "--uninstall" ]; then
  entfernen; exit 0
fi

mkdir -p "$ZIEL/agents" "$ZIEL/skills" "$ZIEL/check/projekte"

# 1. Agenten
anzahl=0
while IFS= read -r datei; do
  ziel="$ZIEL/agents/$(basename "$datei")"
  if [ "$MODUS" = "--copy" ]; then cp -f "$datei" "$ziel"; else ln -sfn "$datei" "$ziel"; fi
  anzahl=$((anzahl+1))
done < <(agentenliste)

# 2. Skill /check
rm -rf "$ZIEL/skills/check"
if [ "$MODUS" = "--copy" ]; then
  cp -R "$QUELLE/skills/check" "$ZIEL/skills/check"
else
  ln -sfn "$QUELLE/skills/check" "$ZIEL/skills/check"
fi

# 3. Doku und Vorlagen — nur anlegen, nie überschreiben (dein Gelerntes bleibt)
cp -f "$QUELLE/doku/aufstellungen.md" "$ZIEL/check/aufstellungen.md"
cp -f "$QUELLE/doku/README.md"      "$ZIEL/check/README.md"
[ -f "$ZIEL/check/playbook.md" ] || cp "$QUELLE/vorlagen/playbook.md" "$ZIEL/check/playbook.md"

echo "Check installiert nach $ZIEL"
echo "  $anzahl Agenten in  $ZIEL/agents/"
echo "  Skill /check in $ZIEL/skills/check/"
echo "  Archiv in           $ZIEL/check/projekte/<projektname>/"
[ "$MODUS" = "--copy" ] || echo "  (verknüpft — 'git pull' hier aktualisiert die Agenten sofort)"
echo
echo "Claude Code im Projektordner starten und /check aufrufen."
echo "Im Projekt selbst wird nichts angelegt."
