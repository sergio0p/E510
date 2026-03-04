# ECON 510 Beamer → HTML Conversion Log

## Conversion Date
February 11, 2026

## Source Materials
- LaTeX: /Users/sergioparreiras/Dropbox/Teaching/510/E510_LEC_SPR26.tex
- PDF: /Users/sergioparreiras/Dropbox/Teaching/510/E510_LEC_SPR26.pdf

---

## Conversion Rules

### 1. Font Size Changes

Every `\fontsize{X}{Y}\selectfont` or `\Large`, `\small`, etc. in the LaTeX source **must** be reflected in the HTML using CSS classes on a wrapping `<div>`.

| LaTeX | CSS Class | Effect |
|-------|-----------|--------|
| `\fontsize{14pt}{14pt}\selectfont` | `.fs-14pt` | `font-size: 1.27em; line-height: 1.3` |
| `\fontsize{11pt}{11pt}\selectfont` | `.fs-11pt` | `font-size: 1em; line-height: 1.5` |
| `\fontsize{11pt}{13pt}\selectfont` | `.fs-11pt` | `font-size: 1em; line-height: 1.5` |
| `\fontsize{10pt}{12pt}\selectfont` | `.fs-10pt` | `font-size: 0.91em; line-height: 1.4` |
| `\fontsize{9pt}{11pt}\selectfont` | `.fs-10pt` | `font-size: 0.91em; line-height: 1.4` (closest match) |

**Usage pattern:**
```html
<div class="fs-14pt" style="text-align: center; margin: 1.5rem 0;">
  $$\max_{\mathbf{x}} f(\mathbf{x})$$
</div>
<div class="fs-11pt">
  <ul>
    <li>Bullet at 11pt size</li>
  </ul>
</div>
```

**Rule:** If the LaTeX source switches font size mid-frame, wrap each font-size zone in a `<div>` with the appropriate class. Do NOT leave all content at the default size.

### 2. Vertical Spacing Changes

Every `\vspace{Xmm}` in the LaTeX source **must** be reflected in the HTML.

| LaTeX | CSS Class (on `<section>`) | Effect |
|-------|---------------------------|--------|
| `\vspace{-9mm}` after title | `.vspace-neg-9mm` | `padding-top: 0` on `.frame-content` |
| `\vspace{-5mm}` after title | `.vspace-neg-5mm` | `padding-top: 0.4rem` on `.frame-content` |
| `\vspace{-3mm}` after title | `.vspace-neg-3mm` | `padding-top: 0.7rem` on `.frame-content` |

**Usage pattern (negative vspace after title bar):**
```html
<section class="frame vspace-neg-9mm">
  <div class="frame-title-bar">...</div>
  <div class="frame-content">
    <!-- content starts closer to title bar -->
  </div>
</section>
```

**For vspace within content** (between paragraphs, after lists, etc.), use inline `margin-top` or `margin-bottom` styles:
```html
<div style="margin-top: 1.5rem;">...</div>   <!-- positive vspace -->
<div style="margin-top: -0.5rem;">...</div>  <!-- negative vspace -->
```

**Rule:** Do not skip spacing commands. If the LaTeX source adds or removes vertical space, the HTML must reflect it. Default padding is `calc(var(--frame-padding) / 2)` = `1rem`.

### 3. Overlay Commands

| LaTeX | HTML | Animation |
|-------|------|-----------|
| `\pause` | Separate `<div class="overlay" data-overlay="N">` elements | Sequential reveal on scroll |
| `\uncover<N->{text}` | `<div class="overlay" data-overlay="N">text</div>` | Reveal at step N |
| `\only<N>{text}` | `<div class="overlay" data-overlay="N" data-overlay-only style="position: absolute;">` | Show exclusively at step N, hide at all other steps |
| `\item<N->` | `<li class="overlay" data-overlay="N">` | Reveal at step N |
| No overlays | No `overlay` class, no `overlay-frame` on section | Static frame, no animation |

**Overlay frame setup:**
```html
<section class="frame overlay-frame">
  <div class="frame-title-bar">...</div>
  <div class="frame-content">
    <p class="overlay" data-overlay="1">First content (visible from start)</p>
    <p class="overlay" data-overlay="2">After first \pause</p>
    <p class="overlay" data-overlay="3">After second \pause</p>
  </div>
</section>
```

**Rule:** Frames with overlays get `class="frame overlay-frame"`. Frames without overlays get `class="frame"` only.

**Custom scroll timelines with click + scroll interaction:**
When a frame combines click interactions with scroll-driven animation (e.g., click to extract subgames, then scroll to highlight best responses), use a GSAP timeline with `scrub` and `pin: true`. Add a **buffer** at the start of the timeline (empty time before the first tween) so the user can interact with click targets before the scroll animation begins. Without a buffer, any scroll within the pin range immediately triggers the animation.

```javascript
var tl = gsap.timeline({
  scrollTrigger: {
    trigger: '#my-frame',
    start: 'top top',
    end: '+=2000',   // total scroll distance
    pin: true,
    scrub: 0.5       // smooth follow
  }
});
// t=0–1: buffer (click phase, no animation)
// t=1–2: first animation step
tl.to('#element', { attr: { stroke: '#DC2626' }, duration: 1 }, 1);
// t=2–3: second animation step
tl.to('#other', { opacity: 1, duration: 1 }, 2);
```

### 4. Line Breaks

| LaTeX | HTML |
|-------|------|
| `\\` forced line break | `<br>` |
| Blank line (paragraph break) | New `<p>` element |
| `\newline` | `<br>` |

**Rule:** Preserve forced line breaks from the source. If a formula appears on its own line after text in the LaTeX, use `<br>` before the inline math or put it in a display math block.

### 5. Math Rendering

| LaTeX | HTML/KaTeX |
|-------|------------|
| `$...$` inline | `$...$` (auto-render) |
| `$$...$$` display | `$$...$$` (auto-render) |
| `\begin{align*}...\end{align*}` | `$$\begin{aligned}...\end{aligned}$$` |
| `\begin{equation}...\end{equation}` | `$$...$$` |

**Custom macros** available in `js/katex-macros.js`: `\diff`, `\sdiff`, `\argmax`, `\argmin`, `\set`, `\abs`, `\ung`, `\Diff`, `\supp`, `\eqdf`, `\IID`, etc.

**Rule:** Do NOT redefine `\max` or `\min` — KaTeX built-ins handle `\limits` and `\substack` correctly.

### 6. Block Environments

| LaTeX | HTML |
|-------|------|
| `\begin{block}{Title}...\end{block}` | `<div class="block"><div class="block-title">Title</div><div class="block-body">...</div></div>` |
| Plain `Definition:` text (no block env) | `<p>Definition: ...</p>` with appropriate font-size class |

**Rule:** Only use `<div class="block">` when the LaTeX source uses `\begin{block}`. If the definition is plain text with `\fontsize`, use a styled `<p>` or `<div>`.

### 7. Frame Structure

```html
<section class="frame [vspace-neg-Xmm] [overlay-frame]">
  <div class="frame-title-bar">
    <h2 class="frame-title">Title</h2>
    [<p class="frame-subtitle">Subtitle</p>]
  </div>
  <div class="frame-content">
    <!-- content with font-size divs, overlays, math -->
  </div>
</section>
```

### 8. Navigation Links

Every section page (except index.html) must have compact navigation links at the bottom:

```html
<div style="max-width: var(--frame-max-width); margin: 0.5rem auto; padding: 0 0.5rem; display: flex; justify-content: space-between; font-size: 0.55rem;">
  <a href="prev-section.html" style="color: var(--crane-blue); text-decoration: none;">&larr; Previous Section</a>
  <a href="next-section.html" style="color: var(--crane-blue); text-decoration: none;">Next Section &rarr;</a>
</div>
```

**Rules:**
- Font size: `0.55rem` (very small, unobtrusive)
- Padding: `0 0.5rem` (minimal)
- Links may point to non-existent pages (404 is acceptable for future sections)
- Do NOT touch the Table of Contents in `index.html` — it uses its own larger styling

### 9. Frame Padding

`.frame-content` uses `padding: calc(var(--frame-padding) / 2)` = `1rem` (half of the `--frame-padding` variable).

This was intentionally halved from the default `2rem` to better match the tighter Beamer layout. Combined with `.vspace-neg-*` classes, this gives fine-grained control over content proximity to the title bar.

### 10. Base Font and Proportional Sizing

- Base font: `html { font-size: 24px }` (set in `beamer-theme.css`)
- All `rem`-based sizes scale proportionally from this base
- Title: `1.4rem` (33.6px), semibold (`font-weight: 600`)
- Subtitle: `1.15rem` (27.6px), semibold (`font-weight: 600`)
- List item spacing: `margin-bottom: 0.9rem`
- Enumerate circles: filled amber with `border: 1.5px solid #000` and `box-shadow: 1px 1px 2px rgba(0,0,0,0.3)`

### 11. HTML Comments

Every frame must include a comment indicating:
- Source line numbers in the .tex file
- Whether overlays are present
- Any `\vspace` commands

```html
<!-- Frame N: Title (source: lines X-Y)
     \vspace{-9mm} after title
     NO OVERLAYS / HAS OVERLAYS: \pause x3 -->
```

---

## Section 2 Analysis (Methodology)

**Frame Count:** 5 frames (lines 218-277)

| # | Title | Overlays | vspace | Font sizes |
|---|-------|----------|--------|------------|
| 1 | On Exactitude in Science | Yes: 4 overlay steps | No | fs-11pt |
| 2 | Mont Sainte Victoire | Yes: 2 overlay steps (image swap) | No | — |
| 3 | Methodology | No | No | fs-10pt |
| 4 | Methodology | No | No | fs-10pt |
| 5 | Methodology / Building and analyzing models | No | No | default |

## Section 3 Analysis (Unconstrained Optimization)

**Frame Count:** 2 frames (lines 277-301)

| # | Title | Overlays | vspace | Font sizes |
|---|-------|----------|--------|------------|
| 1 | Unconstrained Optimization | No | -9mm | fs-14pt, fs-11pt, fs-10pt |
| 2 | Solving Unconstrained Optimization Problems / Basic Recipe #0 | No | -9mm | fs-14pt, fs-11pt |

**Custom Commands Used:**
- `\diff{}{}` (partial derivative fraction)
- Standard LaTeX: `\max`, `\nabla`, `\mathbf`, `\ldots`, `\alpha`, `\ge`

## Files

| File | Type | Purpose |
|------|------|---------|
| `index.html` | Created | Landing page with section navigation |
| `methodology.html` | Created | Section 2: 5 frames with overlays |
| `unconstrained-optimization.html` | Created | Section 3: 2 frames |
| `css/beamer-theme.css` | Local copy | Crane theme with all fixes |
| `js/katex-macros.js` | Local copy | Math macros (fixed \max/\min) |
| `js/scroll-animations.js` | Symlink → 101/ | GSAP scroll utilities |
| `svg/*.jpg` | Copied | Mont Sainte Victoire images |
| `CONVERSION-LOG.md` | Created | This file |

## Key Fixes Applied

1. **KaTeX `\max`/`\min` conflict** — Removed custom macro overrides that broke `\limits` and `\substack`
2. **Font size zones** — Added `.fs-14pt`, `.fs-11pt`, `.fs-10pt` CSS classes
3. **Definition not a block** — Changed from `<div class="block">` to plain `<p>` text
4. **Subtitle sizing** — Changed to `font-size: 1.15rem; font-weight: 600`
5. **Title weight** — Changed from `bold` (700) to `600` (semibold)
6. **Enumerate circles** — Added `border: 1.5px solid` and `box-shadow`
7. **Vertical spacing** — Increased `li margin-bottom` from `0.5rem` to `0.9rem`
8. **Base font** — Increased from `18px` to `24px`
9. **Frame padding** — Halved from `2rem` to `1rem`
10. **Negative vspace** — Added `.vspace-neg-*` utility classes for `\vspace` after title bars

## Conversion Completion

**Date:** February 11, 2026
**Status:** Complete — Sections 2 & 3 proof of concept
**Quality:** High fidelity to source content; font sizes, spacing, overlays, and math preserved
