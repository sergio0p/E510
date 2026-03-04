# ECON 510 Web Lectures — Quick-Start Guide for Claude

Read this file FIRST. It tells you what each reference file covers and when to read it. Do NOT read all files upfront — read only what you need for the current task.

## Project Overview

Beamer (LaTeX) lecture slides converted to scroll-animated HTML pages. Each HTML file is one lecture section with multiple "frames" (slides). The user provides content; Claude handles the HTML/CSS/JS coding.

## Reference Files — Read On Demand

### 1. `CONVERSION-LOG.md` — READ for any new frame
Core conversion rules: font-size classes, vspace classes, overlay system, math rendering, block environments, frame HTML structure, navigation links, HTML comments format.

### 2. `GAME-TREE-SPECS.md` — READ for game trees or SVG diagrams with nodes/edges
TikZ-to-SVG mapping for game trees: decision nodes (colored circles), terminal nodes (split circles or dots), edges (Bézier curves with arrowheads), KaTeX HTML overlay pattern, player colors, layout algorithm.

### 3. `../101/GRAPH-SPECS.md` — READ for economic graphs (supply/demand, curves, axes)
SVG coordinate system, axis construction, Solarized color palette for curves, animation timeline phases, side-comment pattern, horizontal scroll transitions, KaTeX label positioning method.

### 4. `css/beamer-theme.css` — READ when adjusting styling
All CSS classes: `.frame`, `.frame-title-bar`, `.overlay-frame`, `.section-header`, `.title-slide`, `.block`, `.fs-*pt`, `.vspace-neg-*`, `.columns`, lists, print/mobile styles.

### 5. `js/katex-macros.js` — READ when adding math
Custom macros: `\diff{}{}`, `\sdiff`, `\argmax`, `\set`, `\abs`, econ notation (`\MU`, `\CS`, etc.), `\ung`, `\Diff`, `\supp`, `\eqdf`, `\IID`. Note: do NOT redefine `\max` or `\min`.

### 6. Existing HTML files — READ the nearest similar page for patterns
- Frames with overlays: `methodology.html`, `choice-under-uncertainty.html`
- Frames with math: `unconstrained-optimization.html`, `constrained-optimization.html`, `inequality-constraints.html`
- Game trees (placeholder SVGs): `dynamic-games.html`
- SVG with KaTeX overlays: `choice-under-uncertainty.html` (info tree, lottery trees)
- Tables: `dynamic-games.html` (payoff matrix)
- Interactive graphs: `../101/perfect-competition.html`, `../101/taxes-subsidies.html`
- Description lists: `dynamic-games.html`, `choice-under-uncertainty.html`

## Architecture At A Glance

### HTML Frame Template
```html
<section class="frame [vspace-neg-Xmm] [overlay-frame]">
  <div class="frame-title-bar">
    <h2 class="frame-title">Title</h2>
    [<p class="frame-subtitle">Subtitle</p>]
  </div>
  <div class="frame-content [fs-10pt|fs-11pt|fs-14pt]">
    <!-- content -->
  </div>
</section>
```

### Overlay System (scroll-reveal)
- Add `overlay-frame` class to `<section>`
- Wrap content in `<div class="overlay" data-overlay="N">`
- `\pause` → sequential overlays (cumulative reveal)
- `\only` → add `data-overlay-only` attribute (exclusive show)
- JS at bottom of each page handles GSAP ScrollTrigger pinning

### SVG Graphs — Color Palette (Solarized)
| Element | Hex |
|---------|-----|
| Background | `#fdf6e3` |
| Demand / P1 | `#dc322f` (red) |
| Supply / P2 | `#268bd2` (blue) |
| ATC / green | `#859900` |
| Profits | `#2aa198` (cyan) |
| Losses | `#d33682` (magenta) |
| Axes / text | `#586e75` |
| Violet (MC) | `#6c71c4` |

### SVG + KaTeX Pattern (never use foreignObject)
```html
<div style="position: relative; width: 100%; overflow: visible;">
  <svg viewBox="0 0 W H" style="display: block; width: 100%; background: #fdf6e3; border-radius: 8px;">
    <!-- edges, shapes, plain-text labels only -->
  </svg>
  <!-- KaTeX labels as percentage-positioned spans -->
  <span style="position: absolute; left: X%; top: Y%; transform: translate(-50%,-50%);
               color: #586e75; font-size: 0.9em; pointer-events: none; white-space: nowrap;">
    $math$
  </span>
</div>
```

### Page Boilerplate (scripts at bottom)
```html
<!-- KaTeX JS -->
<script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js"></script>
<script src="js/katex-macros.js"></script>

<!-- GSAP -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js"></script>

<!-- Overlay animation system (copy from any existing page) -->
<script>
  gsap.registerPlugin(ScrollTrigger);
  document.querySelectorAll('.overlay-frame').forEach(frame => { ... });
</script>
```

### Navigation Links (bottom of every section page)
```html
<div style="max-width: var(--frame-max-width); margin: 0.5rem auto; padding: 0 0.5rem; display: flex; justify-content: space-between; font-size: 0.55rem;">
  <a href="prev.html" style="color: var(--crane-blue); text-decoration: none;">&larr; Prev</a>
  <a href="next.html" style="color: var(--crane-blue); text-decoration: none;">Next &rarr;</a>
</div>
```

### Key Differences from 101 Project
- Base font: 24px (not 18px)
- Frame padding: halved to 1rem
- Font-size helpers: `.fs-14pt`, `.fs-11pt`, `.fs-10pt`
- Uses overlay system (not scroll-frame pattern)
- `\max`/`\min` macros fixed (do NOT override KaTeX built-ins)

## Section Order in index.html
1. Mathematica Tutorial
2. Methodology
3. Unconstrained Optimization
4. Equilibrium
5. Constrained Optimization (equality)
6. Dynamic Games
7. Time Preferences
8. Choice Under Uncertainty
9. Inequality Constraints

## Placeholders Still Needed
- `dynamic-games.html`: 2 game tree SVGs (General vs President, SPE decomposition)
- `choice-under-uncertainty.html`: 1 risk aversion graph
