---
name: lecture-compose
description: Web lecture notes composition using GSAP scroll animations, SVG graphs, and KaTeX math.
---

# Web Lecture Notes Composition

Patterns for composing scroll-based, animated lecture notes for ECON courses.

**Content role:** Focus on implementing the user's content into HTML. Offer content suggestions only when explicitly requested.

## Startup Steps

### Step 0: Base directory

```
/Users/sergiop/Dropbox/Teaching/Projects/LECWeb
```

**Every relative path in this skill** — `416/`, `css/beamer-theme.css`, `balance_blocks.py` — is relative to that root, **not** to the current working directory. This skill is installed globally (`~/.claude/skills/`), so it can fire from any cwd. Resolve paths against the base directory explicitly; never assume cwd is already correct.

### Step 1: Identify target course
Ask the user which course: **416** or **510**.

| Course | Working dir | GitHub Pages repo |
|--------|-------------|-------------------|
| 416 | `<base>/416/` | `/Users/sergiop/Dropbox/Teaching/Projects/E416/LECWeb/` |
| 510 | `<base>/510/` | `/Users/sergiop/Dropbox/Teaching/Projects/E510/LECWeb/` |

The working dir has **no git remote**. The GitHub Pages repos have remotes. To deploy, use the **sync-deploy** agent.

### Step 2: Start local server and open preview
Lectures using tikz-svg ES module imports **require an HTTP server**. Port: `8{course}` — i.e., `8416` for course 416, `8510` for course 510.

```bash
# Start server only if nothing is already listening on the port
lsof -ti:8[course] >/dev/null 2>&1 || python3 -m http.server 8[course] --directory /Users/sergiop/Dropbox/Teaching/Projects/LECWeb &>/dev/null &
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --incognito --window-size=500,1080 "http://localhost:8[course]/[course]/index.html" &>/dev/null &
```

Narrow width (500px) minimizes screen footprint. Always use Chrome binary — the Chrome extension can't handle `file://` URLs.

## Design Philosophy

### Alternating Rhythm
| Mode | Student Role | Feeling |
|------|--------------|---------|
| Animation plays | Passive viewer | "Watch this" |
| Scroll to continue | Active participant | "My turn to move forward" |
| Next animation triggers | Reward | Micro-reset |

**All animation** = zones out. **All scrolling** = reading a document. **Alternating** = engagement.

### Color Scheme
**Text pages (Crane theme):** bg `#ffffff`, title boxes `#f9a825` (amber), text `#000000`, bullets `#c17900`

**Graph colors:** See the `graph-compose` skill for the Solarized Light palette.

## HTML Boilerplate

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Topic | ECON 416</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js"></script>
  <link rel="stylesheet" href="css/beamer-theme.css">
  <script src="js/katex-macros.js"></script>
  <script src="js/scroll-animations.js"></script>
</head>
<body>
  <!-- Content sections here -->
</body>
</html>
```

**KaTeX init** (required in every lecture):
```js
renderMathInElement(document.body, {
  delimiters: [{left: '$$', right: '$$', display: true}, {left: '$', right: '$', display: false}],
  macros: katexMacros, throwOnError: false
});
```

**Available macros** (defined in `js/katex-macros.js`):

| Group | Macro | Output |
|---|---|---|
| Calculus | `\diff{f}{x}` | `∂f/∂x` (display) |
| | `\sdiff{f}{x}` | `∂f/∂x` (textstyle) |
| | `\ddiff{f}{x}` | `df/dx` (display) |
| | `\sddiff{f}{x}` | `df/dx` (textstyle) |
| Brackets | `\set{x}` | `{ x }` |
| | `\abs{x}` | `\|x\|` |
| | `\norm{x}` | `‖x‖` |
| | `\paren{x}` | `( x )` |
| | `\bracket{x}` | `[ x ]` |
| Optimization | `\argmax{x}` / `\argmin{x}` | `arg max_x` / `arg min_x` |
| Economics | `\MU \MR \MC \AC \ATC \AVC \AFC` | upright `MU`, `MR`, etc. |
| | `\TR \TC \TVC \TFC` | upright `TR`, `TC`, etc. |
| | `\CS \PS \DWL` | upright `CS`, `PS`, `DWL` |
| Sets | `\R \N \Z \Q \E` | blackboard-bold `ℝ ℕ ℤ ℚ 𝔼` |
| | `\Var \Cov` | upright `Var`, `Cov` |
| Greek | `\eps` `\vphi` | `ε` `φ` |
| Text | `\st \and \or \for \where` | ` s.t. `, ` and `, etc. |

Note: `\max` and `\min` are KaTeX built-ins — do not redefine.

## Page Sections

### Title Slide
```html
<section class="title-slide">
  <div class="title-box">
    <h1>Topic Title</h1>
    <h2>Optional subtitle</h2>
  </div>
</section>
```
No author/date — those appear only on the index page.

### Content Frame (Beamer-style)
```html
<section class="frame">
  <div class="frame-title-bar">
    <h2 class="frame-title">Frame Title</h2>
    <p class="frame-subtitle">Optional subtitle</p>
  </div>
  <div class="frame-content">
    <!-- Content with $math$ and lists -->
  </div>
</section>
```

### Overlay Frame (Scroll-Triggered Reveal)
Beamer `\pause` equivalent. Items reveal on scroll; frame pins.
```html
<section class="frame overlay-frame">
  <div class="frame-title-bar">
    <h2 class="frame-title">Title</h2>
  </div>
  <div class="frame-content">
    <ul>
      <li class="overlay" data-overlay="1">First item (visible immediately)</li>
      <li class="overlay" data-overlay="2">Second item (revealed on scroll)</li>
      <li class="overlay" data-overlay="3">Third item</li>
    </ul>
  </div>
</section>
```
Use `data-overlay-only` for Beamer `\only<N>` (visible at that step only).

### Block Environment
```html
<div class="block">
  <div class="block-title">Definition</div>
  <div class="block-body">Content with $math$...</div>
</div>
```

### Block Group (Left-Aligned with 1:3 Margin)
```html
<div class="block-group">
  <div class="block">
    <div class="block-title">Term 1</div>
    <div class="block-body">Definition text...</div>
  </div>
  <div class="block">
    <div class="block-title">Term 2</div>
    <div class="block-body">Another definition...</div>
  </div>
</div>
```
CSS grid `1fr auto 3fr`. Blocks use `width: fit-content`.

### Block Text Balancing
```bash
python3 balance_blocks.py 416/preferences.html
```
Splits block body text into 2 balanced lines via `<br>`. Preserves inline HTML. Re-balances on each run.

### Description List
```html
<dl class="beamer-description">
  <dt>Term</dt>
  <dd>Definition on the same line as the term.</dd>
</dl>
```

### Font Size & Spacing Helpers
| Class | Size | Use for |
|-------|------|---------|
| `.fs-14pt` | 1.27em | Enlarged equations |
| `.fs-11pt` | 1.0em | Normal body |
| `.fs-10pt` | 0.91em | Dense content |

Vertical spacing: `.vspace-neg-9mm` (0), `.vspace-neg-5mm` (0.4rem), `.vspace-neg-3mm` (0.7rem). Apply to `.frame`.

### tikz-svg Diagrams (Inline)
When embedding tikz-svg `render()` inside a content frame, use `max-width` + `width: 100%` — never fixed dimensions. The library auto-generates the viewBox:
```html
<svg id="my-diagram" style="max-width: 420px; width: 100%; display: block; margin: 0.75rem auto;"></svg>
```
Adjust `max-width` to fit content (350–500px for automata, 380–420px for trees).

### Section Header
```html
<section class="section-header">
  <div class="section-title-box"><h1>Section Name</h1></div>
  <h2>Optional subtitle</h2>
</section>
```

### Graph Frame
See the `graph-compose` skill for graph frame template, SVG specifications, color scheme, and GSAP animation patterns.

### Scroll Reveal (No Pinning)
Fade elements in/out on scroll. No pinning — page scrolls naturally. Bidirectional.
```html
<li class="scroll-reveal">First point revealed on scroll</li>
<div class="scroll-reveal">Any element can be revealed</div>
```
```js
gsap.utils.toArray('.scroll-reveal').forEach(el => {
  gsap.set(el, { opacity: 0, y: 15 });
  ScrollTrigger.create({
    trigger: el, start: 'top 85%', end: 'top 85%',
    onEnter: () => gsap.to(el, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }),
    onLeaveBack: () => gsap.to(el, { opacity: 0, y: 15, duration: 0.3, ease: 'power2.in' }),
  });
});
```
Prefer over overlay-frame when items don't need a pinned screen.

## Typography Notes
- `$k<n$` parses as HTML tag. Use `$k\lt n$` instead. Same for `>`: use `\gt`.
- Em dashes: **no space** — `word—phrase—word`, never `word — phrase — word`.

## File Structure

```
416/
├── index.html, preferences.html, behavioral-choice.html
├── css/beamer-theme.css
├── js/katex-macros.js (symlink → 101/js/), scroll-animations.js
└── svg/

510/
├── index.html, methodology.html, choice-under-uncertainty.html
├── css/ -> ../101/css
├── js/katex-macros.js (510-specific), scroll-animations.js -> ../../101/js/
└── svg/
```

## Common Mistakes

- **Don't add author/date to title slides** — they appear only on the index page.
- **Don't write `<` or `>` inside `$…$`** — use `\lt` and `\gt`. Same for `<=` (`\le`) and `>=` (`\ge`).
- **Don't put spaces around em dashes** — `word—phrase—word`, never `word — phrase — word`.
- **Don't redefine `\max` or `\min`** in KaTeX macros — they're built-ins with proper `\limits` support.
- **Don't use `file://` URLs** — module imports break and the Chrome extension can't navigate them; always serve via the local Python HTTP server.
- **Don't put inline styles on elements that have a CSS class** for the same property (e.g., colors, fonts, font-sizes). Edit `css/beamer-theme.css` instead.
- **Don't use fixed `width`/`height` on tikz-svg `<svg>`** — use `max-width` + `width: 100%` so the library's auto-generated viewBox controls scaling.
- **Don't run `balance_blocks.py` from a course subdir** — run it from the LECWeb root (Step 0) with the path as a positional arg (e.g. `python3 balance_blocks.py 416/preferences.html`).
- **Don't assume cwd is the LECWeb root** — this skill is global and fires from any directory. Resolve against the Step 0 base path.

## Checklist

- [ ] KaTeX `\lt`/`\gt` instead of `<`/`>`
- [ ] Em dashes with no spaces
- [ ] Block text balanced via `balance_blocks.py`
- [ ] Mobile test at 768px width

## Related Skills

- **tikz-svg** — automata, tree diagrams, inline node-edge diagrams. Use for `render()` and `renderAutomaton()`.
- **graph-compose** — animated economics graphs, SVG specs, GSAP patterns, color scheme. Use for supply-demand, welfare, and all graph composition.
