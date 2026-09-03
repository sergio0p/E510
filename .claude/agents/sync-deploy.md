---
name: sync-deploy
description: Syncs lecture files from LECWeb to GitHub Pages and Dropbox deploy targets. Use when the user says "sync", "deploy", "push", "make copies", or after finishing lecture composition.
tools: Read, Write, Edit, Bash, Glob, Grep
model: haiku
---

Fast deployment agent. Copy changed files, commit, push. Minimize tool calls.

## Repos

| Repo | Path | Push? |
|------|------|-------|
| **LECWeb** (working copy) | `Projects/LECWeb/` | NEVER (no remote) |
| **GitHub Pages 101** | `Projects/E101H/LECWeb/` | Yes |
| **GitHub Pages 510** | `Projects/E510/LECWeb/` | Yes |
| **Dropbox 101** | `~/Dropbox/Teaching/101/LECWeb/` | NEVER |
| **Dropbox 510** | `~/Dropbox/Teaching/510/LECWeb/` | NEVER |

## Steps

Do everything in as few Bash calls as possible. Batch commands with `&&`.

### 1. Detect changes + update timestamp

```bash
cd Projects/LECWeb && git diff --name-only HEAD
```

Update `[course]/index.html` Last Update timestamp with `date "+%H:%M - %Y-%m-%d"`.

### 2. Commit LECWeb (if not already committed)

```bash
cd Projects/LECWeb && git add [changed files] && git commit -m "message"
```

### 3. Copy + commit + push (one batch per course)

**For 101:**
```bash
cp Projects/LECWeb/101/*.html Projects/E101H/LECWeb/ && cp -r Projects/LECWeb/101/css Projects/E101H/LECWeb/ && cp Projects/LECWeb/101/*.html ~/Dropbox/Teaching/101/LECWeb/ && cp -r Projects/LECWeb/101/css ~/Dropbox/Teaching/101/LECWeb/ && git -C Projects/E101H add -A && git -C Projects/E101H commit -m "message" && git -C Projects/E101H push && git -C ~/Dropbox/Teaching/101/LECWeb add -A && git -C ~/Dropbox/Teaching/101/LECWeb commit -m "message"
```

**For 510:**
```bash
cp Projects/LECWeb/510/*.html Projects/E510/LECWeb/ && cp -r Projects/LECWeb/510/css Projects/E510/LECWeb/ && cp -r Projects/LECWeb/510/js Projects/E510/LECWeb/ && cp Projects/LECWeb/510/*.html ~/Dropbox/Teaching/510/LECWeb/ && cp -r Projects/LECWeb/510/css ~/Dropbox/Teaching/510/LECWeb/ && cp -r Projects/LECWeb/510/js ~/Dropbox/Teaching/510/LECWeb/ && git -C Projects/E510 add -A && git -C Projects/E510 commit -m "message" && git -C Projects/E510 push && git -C ~/Dropbox/Teaching/510/LECWeb add -A && git -C ~/Dropbox/Teaching/510/LECWeb commit -m "message"
```

Also copy `svg/`, `images/` if any were modified.

### 4. Post-deploy Canvas update

```bash
open -a Terminal && osascript -e 'tell application "Terminal" to do script "python3 /Users/sergiop/Dropbox/Scripts/Canvas/lecweb_update.py --course [COURSE]"'
```

### 5. Print summary table

Done. Target: under 5 tool calls total.
