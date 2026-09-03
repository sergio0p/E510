#!/bin/bash
set -e

# Find up to 3 most recently modified HTML files in subdirs, excluding hidden/build dirs
FILES=$(find . -name "*.html" \
  -not -path "*/.git/*" \
  -not -path "*/.claude/*" \
  -not -path "*/node_modules/*" \
  -print0 2>/dev/null \
  | xargs -0 ls -t 2>/dev/null \
  | head -3)

if [ -z "$FILES" ]; then
  echo "No HTML files found under $(pwd)"
  exit 1
fi

echo "Opening in Chrome incognito:"
echo "$FILES"

# Get usable screen bounds (logical pixels, excludes menu bar and dock)
SCREEN=$(osascript -e 'tell application "Finder" to get bounds of window of desktop')
SW=$(echo "$SCREEN" | tr -d ' ' | cut -d',' -f3)
SH=$(echo "$SCREEN" | tr -d ' ' | cut -d',' -f4)
HALF=$((SW / 2))

# Build AppleScript: open incognito window, load files as tabs, position on right half
ASCRIPT='tell application "Google Chrome"
  make new window with properties {mode:"incognito"}'

FIRST=1
while IFS= read -r f; do
  ABS=$(cd "$(dirname "$f")" && pwd)/$(basename "$f")
  URL="file://$ABS"
  if [ $FIRST -eq 1 ]; then
    ASCRIPT="$ASCRIPT
  set URL of active tab of front window to \"$URL\""
    FIRST=0
  else
    ASCRIPT="$ASCRIPT
  make new tab at end of tabs of front window with properties {URL:\"$URL\"}"
  fi
done <<< "$FILES"

ASCRIPT="$ASCRIPT
  set bounds of front window to {$HALF, 0, $SW, $SH}
end tell"

osascript -e "$ASCRIPT"
