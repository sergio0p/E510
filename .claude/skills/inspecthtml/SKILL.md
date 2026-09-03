---
name: inspecthtml
description: Opens the most recently modified HTML files in the working directory tree in a Chrome incognito window positioned on the right half of the screen, bypassing browser cache.
context: fork
disable-model-invocation: true
allowed-tools: Bash
---

Run the script to open recently modified HTML files in Chrome incognito:

```bash
bash .claude/skills/inspecthtml/scripts/open-in-chrome.sh
```

Report which files were opened and confirm the Chrome window was launched.
