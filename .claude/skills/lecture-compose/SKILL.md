---
name: lecture-compose
description: Web lecture notes composition using GSAP scroll animations, SVG graphs, and KaTeX math.
---

# Web Lecture Notes Composition

This skill provides patterns for composing scroll-based, animated lecture notes for ECON courses.

## Startup Steps

This repo is **E510** (ECON 510 GitHub Pages). Lecture notes live in `LECWeb/`.

### Step 1: Identify working directory

Lecture files are in `LECWeb/` at the repo root:
```
LECWeb/
├── index.html
├── arbitrage.html, equilibrium.html, ...
├── css/beamer-theme.css
├── js/katex-macros.js, scroll-animations.js
├── fonts/
└── svg/
```

## Design Philosophy

### Alternating Rhythm
Alternate between animation and scrolling to maintain student attention:

| Mode | Student Role | Feeling |
|------|--------------|---------|
| Animation plays | Passive viewer | "Watch this" |
| Scroll to continue | Active participant | "My turn to move forward" |
| Next animation triggers | Reward | Micro-reset, attention renewed |

**All animation** = student zones out. **All scrolling** = feels like reading a document. **Alternating** = engagement.

### Color Scheme

**Text pages (Crane theme):** bg `#ffffff`, title boxes `#f9a825` (amber), text `#000000`, bullets `#c17900`

**Graphs (Solarized Light):** bg `#fdf6e3`, axes/labels `#586e75`
| Role | Color |
|------|-------|
| Demand | `#dc322f` (red) |
| Supply | `#268bd2` (blue) |
| ATC/cost | `#859900` (green) |
| Additional | `#2aa198` (cyan), `#cb4b16` (orange), `#d33682` (magenta), `#6c71c4` (violet) |

## HTML Boilerplate

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Topic | ECON 510</title>
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

## Page Sections

### Title Slide
```html
<section class="title-slide">
  <div class="title-box">
    <h1>Topic Title</h1>
    <h2>ECON 510: Microeconomic Theory</h2>
  </div>
  <p class="author">Sergio O. Parreiras</p>
  <p class="institute">Economics Department, UNC at Chapel Hill</p>
  <p class="date">Spring 2026</p>
</section>
```

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
Beamer `\pause` / `\item<N->` equivalent. Items reveal progressively on scroll; frame pins at top.
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
Use `data-overlay-only` instead of `data-overlay` for Beamer `\only<N>` (visible at that step only, hidden after).

### Block Environment (Definition/Theorem)
```html
<div class="block">
  <div class="block-title">Definition</div>
  <div class="block-body">Content with $math$...</div>
</div>
```

### Description List (Beamer-style, inline dt/dd)
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

Apply to `.frame-content`: `<div class="frame-content fs-10pt">`

Vertical spacing (reduce padding below title bar):
- `.vspace-neg-9mm` — padding-top: 0
- `.vspace-neg-5mm` — padding-top: 0.4rem
- `.vspace-neg-3mm` — padding-top: 0.7rem

Apply to `.frame`: `<section class="frame vspace-neg-3mm">`

### KaTeX Gotcha
`$k<n$` is parsed as an HTML tag. Use `$k\lt n$` instead. Same for `>`: use `\gt`.

### Em Dash Typography
Em dashes must have **no space** between the dash and the surrounding text: `word—phrase—word`, never `word — phrase — word`. This applies even when the interior content is a `<span>` or inline element.

### Graph Frame (Full-viewport SVG)
```html
<section class="scroll-frame graph-frame" id="my-graph">
  <div class="scroll-frame-inner" style="position: relative;">
    <svg id="graph-svg" viewBox="-45 -20 585 400" style="max-width: 700px; width: 100%;">
      <!-- SVG content -->
    </svg>
  </div>
</section>
```

### Section Header
```html
<section class="section-header">
  <div class="section-title-box"><h1>Section Name</h1></div>
  <h2>Optional description</h2>
</section>
```

## SVG Graph Specifications

### Standard ViewBox & Coordinates

`viewBox="-45 -20 585 400"` — extends left/up for labels; 585×400 total.

```javascript
// Coordinate conversion
const toX = Q => 20 + Q * 3.133;   // xOrigin=20, xScale=470/150
const toY = P => 350 - P * 2.46;   // yOrigin=350
// Q-axis: 0–150 (x=20–490, arrow at 495). P-axis: 0–140 (y=350–6, arrow at 6).
```

### Axis Drawing
```html
<defs>
  <marker id="arrowhead" markerWidth="12" markerHeight="5" refX="11" refY="2.5" orient="auto">
    <polygon points="0 0, 12 2.5, 0 5" fill="#586e75"/>
  </marker>
</defs>
<line x1="20" y1="350" x2="20" y2="6" stroke="#586e75" stroke-width="3" marker-end="url(#arrowhead)"/>
<line x1="20" y1="350" x2="495" y2="350" stroke="#586e75" stroke-width="3" marker-end="url(#arrowhead)"/>
<text x="20" y="-2" text-anchor="middle" class="axis-label">P</text>
<text x="505" y="355" class="axis-label">Q</text>
```

### Curve & Label Styling
```css
.demand-line { stroke: #dc322f; stroke-width: 5; fill: none; }
.supply-line { stroke: #268bd2; stroke-width: 5; fill: none; }
.atc-line    { stroke: #859900; stroke-width: 5; fill: none; }
.dotted-line { stroke: #586e75; stroke-width: 3; stroke-dasharray: 8, 6; fill: none; }
.axis-label  { font-family: 'Times New Roman', serif; font-size: 24px; font-style: italic; fill: #586e75; }
.eq-label    { font-family: 'Times New Roman', serif; font-size: 20px; font-style: italic; fill: #586e75; }
```

### Label Positioning
- **Y-axis price labels**: x=-5, text-anchor="end"
- **X-axis quantity labels**: y=375, text-anchor="middle"
- **Curve labels**: near endpoint, matching curve color

## GSAP Animation Patterns

### Pinned Scroll Animation
```javascript
gsap.registerPlugin(ScrollTrigger);

const tl = gsap.timeline({
  scrollTrigger: {
    trigger: '#my-graph', start: 'top top', end: '+=680%',
    pin: true, scrub: 1, anticipatePin: 1
  }
});

// Phase 1: Draw equilibrium lines (position 0, duration 1)
tl.to('#eq-line-h', { attr: { x2: 200 }, duration: 1, ease: 'none' }, 0);
tl.to('#eq-line-v', { attr: { y2: 350 }, duration: 1, ease: 'none' }, 0);
// Phase 2: Pause (position 1–2)
// Phase 3: Draw ATC curve (position 2, duration 1)
tl.to('#atc-path', { strokeDashoffset: 0, duration: 1, ease: 'none' }, 2);
// Phase 4: Show label (position 3)
tl.to('#atc-label', { opacity: 1, duration: 0.3 }, 3);
```

### Path Drawing Animation
```javascript
const path = document.querySelector('#my-curve');
const length = path.getTotalLength();
gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
tl.to('#my-curve', { strokeDashoffset: 0, duration: 1, ease: 'none' }, 2);
```

### Side Comment (Slide-In Annotation)
```css
.side-comment {
  position: fixed; top: 50%; right: -500px; transform: translateY(-50%);
  width: 350px; padding: 1.5rem; background: #fff8e1;
  border-left: 4px solid #f9a825; border-radius: 8px;
  box-shadow: -8px 8px 30px rgba(0,0,0,0.25); font-size: 0.95rem; z-index: 100; opacity: 0;
}
```
```html
<div class="side-comment" id="my-comment">
  <div class="side-comment-title">Compare: Topic</div>
  Annotation text here...
</div>
```
```javascript
tl.to('#my-comment', { right: 20, opacity: 1, duration: 1, ease: 'power2.out' }, 2);
tl.to('#my-comment', { right: -500, opacity: 0, duration: 1, ease: 'power2.in' }, 3.5);
```

### Scroll Reveal (No Pinning)
Fade elements in/out as they scroll into/out of view. No frame pinning — the page scrolls naturally. Bidirectional: shows on scroll down, hides on scroll up.
```html
<li class="scroll-reveal">First point revealed on scroll</li>
<li class="scroll-reveal">Second point revealed on scroll</li>
<div class="scroll-reveal">Any element can be revealed</div>
```
```javascript
gsap.utils.toArray('.scroll-reveal').forEach(el => {
  gsap.set(el, { opacity: 0, y: 15 });
  ScrollTrigger.create({
    trigger: el,
    start: 'top 85%',
    end: 'top 85%',
    onEnter: () => gsap.to(el, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }),
    onLeaveBack: () => gsap.to(el, { opacity: 0, y: 15, duration: 0.3, ease: 'power2.in' }),
  });
});
```
Prefer this over overlay-frame when items don't need to appear on a pinned screen. Simpler and avoids ScrollTrigger pin conflicts.

### Horizontal Panel Transition
```html
<section class="scroll-frame graph-frame" id="panel-container">
  <div class="scroll-frame-inner" style="background: #fdf6e3;">
    <svg id="primary-graph">...</svg>
  </div>
  <div id="secondary-panel" style="position: absolute; left: -100%; top: 0; width: 100%; height: 100%;">
    <svg id="secondary-graph">...</svg>
  </div>
</section>
```
```javascript
tl.to('#secondary-panel', { left: '0%', duration: 1, ease: 'none' }, 5);
tl.to('#primary-graph', { x: '100vw', duration: 1, ease: 'none' }, 5);
```

## KaTeX Math Labels in SVG

SVG `<text>` doesn't support KaTeX. Use absolutely positioned HTML divs over the SVG:

```html
<div class="scroll-frame-inner" style="position: relative;">
  <div id="price-label" style="position: absolute; font-size: 0.9rem; color: #586e75;">$P^*=$</div>
  <svg id="graph" viewBox="...">
    <text id="price-num" x="50" y="200" text-anchor="end">97</text>
  </svg>
</div>
```

Position labels using `positionKatexLabel(svgId, labelId, svgX, svgY)` from `js/scroll-animations.js`. It converts SVG viewBox coordinates to screen pixels relative to the container.

**KaTeX init options (required):**
```javascript
renderMathInElement(el, {
  delimiters: [{left: '$$', right: '$$', display: true}, {left: '$', right: '$', display: false}],
  throwOnError: false
});
```

## KaTeX Custom Macros

```javascript
const katexMacros = {
  "\\diff": "\\frac{\\partial #1}{\\partial #2}",
  "\\sdiff": "\\tfrac{\\partial #1}{\\partial #2}",
  "\\set": "\\left\\{ #1 \\right\\}",
  "\\abs": "\\left| #1 \\right|",
  "\\norm": "\\left\\| #1 \\right\\|",
  "\\argmax": "\\mathop{\\mathrm{arg\\,max}}\\limits_{#1}",
  "\\argmin": "\\mathop{\\mathrm{arg\\,min}}\\limits_{#1}",
  "\\MU": "\\mathrm{MU}", "\\MC": "\\mathrm{MC}", "\\ATC": "\\mathrm{ATC}",
  "\\CS": "\\mathrm{CS}", "\\PS": "\\mathrm{PS}", "\\DWL": "\\mathrm{DWL}",
  "\\R": "\\mathbb{R}", "\\E": "\\mathbb{E}", "\\st": "\\text{ s.t. }"
};
```

## File Structure

```
LECWeb/
├── index.html
├── arbitrage.html, equilibrium.html, financial-markets.html, ...
├── css/beamer-theme.css
├── js/katex-macros.js, scroll-animations.js
├── fonts/
└── svg/
```

## Checklist for New Lectures

- [ ] Correct viewBox and coordinate system
- [ ] Axis labels at standard positions (P at y=-2, Q at x=505)
- [ ] 25px spacing for axis value labels
- [ ] Solarized colors for graph elements
- [ ] Timeline phases have clear pauses between them
- [ ] Side comments have slide-in and slide-out with gap
- [ ] KaTeX labels positioned outside SVG
- [ ] Mobile test at 768px width
- [ ] Print CSS shows final state cleanly

## Related Skills

- **tikz-svg** — automata (`renderAutomaton`), inline SVG node-edge diagrams (decision/game trees), and callout annotations. Use `/tikz-svg` for state machines, tree diagrams, or speech-bubble callouts.
