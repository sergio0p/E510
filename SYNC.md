# Deploy Targets

This repo is a **deploy target** for GitHub Pages. The primary working copy is in `Projects/LECWeb/510/`.

## Full Sync Documentation

See **[Projects/LECWeb/SYNC-POLICY.md](../LECWeb/SYNC-POLICY.md)** for complete sync workflows.

## Quick Reference

| Location | Purpose | Path |
|----------|---------|------|
| **Working Copy** | Edit files here | `Projects/LECWeb/510/` |
| **GitHub Pages** | Public deployment | `Projects/E510/LECWeb/` (this repo) |
| **Dropbox Local** | Local access | `~/Dropbox/Teaching/510/LECWeb/` |

## Sync Commands

```bash
# From Projects/LECWeb/510/, copy HTML to deploy targets:
cp *.html ../E510/LECWeb/
cp *.html ~/Dropbox/Teaching/510/LECWeb/

# Then commit and push this repo for GitHub Pages deployment
```
