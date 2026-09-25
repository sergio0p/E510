---
name: sync-deploy
description: Deploys lecture files from a course's GitHub Pages repo (the working copy) and mirrors them into the Dropbox copy. Use when the user says "sync", "deploy", "push", "make copies", or after finishing lecture composition.
tools: Read, Write, Edit, Bash, Glob, Grep
model: haiku
---

Fast deployment agent. Commit, push, mirror, confirm. Minimize tool calls: batch commands with `&&`, target under 5 Bash calls total.

## Where the files live

The GitHub Pages repo **is** the working copy. Lectures are edited there directly; there is no separate staging tree.

**Never copy from `Projects/LECWeb/`.** That tree is an old sandbox with no remote. It is behind the deploy repos, so copying from it reverts newer work. It is not a source and not a target.

| Course | Working copy = GitHub Pages repo | Dropbox mirror |
|--------|----------------------------------|----------------|
| 101 | `~/Dropbox/Teaching/Projects/E101H/` (lectures in `LECWeb/`) | `~/Dropbox/Teaching/101/LECWeb/` (repo root `~/Dropbox/Teaching/101`) |
| 416 | `~/Dropbox/Teaching/Projects/E416/` (lectures in `LECWeb/`) | `~/Dropbox/Teaching/416/LECWeb/` — **copy only, never commit** (its git root is `~/Dropbox/Teaching`, the scratch repo) |
| 510 | `~/Dropbox/Teaching/Projects/E510/` (lectures in `LECWeb/`) | `~/Dropbox/Teaching/510/LECWeb/` (repo root `~/Dropbox/Teaching/510`) |

- GitHub Pages repo: **commit and push**. Live at `https://soparreiras.org/E101H/LECWeb/`, `https://soparreiras.org/E416/LECWeb/` and `https://soparreiras.org/E510/LECWeb/`.
- Dropbox mirror: **copy and commit, never push** (no remote) — except 416, which is **copy only**: `~/Dropbox/Teaching/416/` has no repo of its own and a commit there lands in the scratch repo.
- Always `git -C <repo>`; never `cd`.

## Steps

### 1. Detect changes

```bash
git -C ~/Dropbox/Teaching/Projects/E[course] status --short LECWeb
```

If nothing changed, skip to step 3: the mirror may still be behind. Otherwise refresh the Last Update stamp in `LECWeb/index.html`:

```bash
sed -i '' "s|Last Update: [0-9:]* - [0-9-]*|Last Update: $(date '+%H:%M - %Y-%m-%d')|" LECWeb/index.html
```

### 2. Commit and push the GitHub Pages repo

Add the changed lecture files by name, plus `css/`, `js/`, `svg/`, `img/`, `fonts/` only when they changed. Do not use `add -A`.

```bash
git -C ~/Dropbox/Teaching/Projects/E[course] add LECWeb/<changed files> && git -C ~/Dropbox/Teaching/Projects/E[course] commit -m "<message>" && git -C ~/Dropbox/Teaching/Projects/E[course] push
```

### 3. Mirror into Dropbox

Bring the mirror level with **every file the deploy repo tracks** under `LECWeb/`, not only the files in this push. Copying only the changed files let the mirrors drift far behind: on 2026-09-24 the 510 mirror lacked 140 files, including live pages, and the 416 mirror had 9 of 156 files and no `css/` or `js/`.

```bash
L="${TMPDIR:-/tmp}/sync-deploy-[course].txt" && git -C ~/Dropbox/Teaching/Projects/E[course] ls-files LECWeb > "$L" && rsync -a --files-from="$L" ~/Dropbox/Teaching/Projects/E[course]/ ~/Dropbox/Teaching/[course]/ && while read p; do cmp -s ~/Dropbox/Teaching/Projects/E[course]/"$p" ~/Dropbox/Teaching/[course]/"$p" || echo "MISMATCH $p"; done < "$L"
```

- No `--delete`: files that exist only in the mirror stay.
- The deploy repo is the newer copy. If a differing mirror file has content the deploy repo lacks (not just an older version of the same page), stop and report instead of overwriting.
- Any `MISMATCH` line means the copy failed. Report it.

For 101 and 510, commit exactly the tracked list, never a blanket `add`: the mirror's repo root also holds `Data/` (participation and roster JSON) that must never be swept into a deploy commit. For 416, stop after the copy.

```bash
L="${TMPDIR:-/tmp}/sync-deploy-[course].txt" && git -C ~/Dropbox/Teaching/[course] add --pathspec-from-file="$L" && { git -C ~/Dropbox/Teaching/[course] diff --cached --quiet || git -C ~/Dropbox/Teaching/[course] commit -m "<message>"; }
```

### 4. Confirm live

GitHub Pages takes a minute or two to rebuild. Poll rather than assume:

```bash
for i in $(seq 1 9); do code=$(curl -s -o /dev/null -w '%{http_code}' https://soparreiras.org/E[course]/LECWeb/<new or changed file>); [ "$code" = "200" ] && break; sleep 20; done; echo "live: $code"
```

For a modified file, also `curl -s <url> | grep -cF '<distinctive new string>'` to confirm the new content is what is being served. Use `-F`: lecture text is full of `$` and `\\`, which plain `grep` reads as pattern syntax and then misses.

### 5. Summary table

| Repo | Files | Commit | Pushed | Live |
|------|-------|--------|--------|------|
