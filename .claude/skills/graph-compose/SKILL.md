---
name: graph-compose
description: Use when composing animated economics SVG graphs for lecture pages. Covers tikz-svg render() API, hand-drawn SVG specs, scroll-driven GSAP animation patterns, and common diagram recipes.
---

# Graph Composition — Economics Diagrams

Two approaches: **tikz-svg `render()`** (preferred) or **hand-drawn SVG** (legacy). For tikz-svg library setup and API reference, see the `/tikz-svg` skill.

## Color Scheme (Solarized Light)

| Role | Color | Hex |
|------|-------|-----|
| Graph background | base3 | `#fdf6e3` |
| Axes/text | base01 | `#586e75` |
| Demand / CS | red | `#dc322f` |
| Supply / PS | blue | `#268bd2` |
| MC / profit | green | `#859900` |
| DWL / warning | yellow | `#b58900` |
| Highlight | magenta | `#d33682` |
| Additional | cyan `#2aa198`, orange `#cb4b16`, violet `#6c71c4` |

Welfare areas: `fill-opacity: 0.3` on `<polygon>`.

## Graph Frame Template

```html
<section class="scroll-frame graph-frame" id="my-graph">
  <div class="scroll-frame-inner" style="position: relative; background: #fdf6e3;">
    <div id="katex-label" style="position: absolute;">$P^*$</div>
    <svg id="graph-svg" style="max-width: 700px; width: 100%;"></svg>
  </div>
</section>
```

## tikz-svg Graphs

All positions use tikz-svg coordinates — no raw SVG pixel math. Use `config.draw` for ordered paint:

```js
render(svgEl, {
  scale: 200, originX: 100, originY: 90,
  draw: [
    { type: 'path', points: [{x:0,y:-0.1},{x:0,y:1.5}], arrow: '->' },
    { type: 'path', points: [{x:-0.1,y:0},{x:1.5,y:0}], arrow: '->' },
    { type: 'node', id: 'ylabel', position: {x:-0.15, y:1.5}, label: '$P$', anchor: 'east', fill: 'none', stroke: 'none' },
    { type: 'node', id: 'xlabel', position: {x:1.5, y:-0.1}, label: '$Q$', anchor: 'north', fill: 'none', stroke: 'none' },
    { type: 'plot', expr: x => 1.2 - 0.8*x, domain: [0,1.4], stroke: '#dc322f' },
    { type: 'plot', expr: x => 0.2 + 0.8*x, domain: [0,1.4], stroke: '#268bd2' },
  ],
});
```

Assign `id` to elements for GSAP targeting: `#node-{id}`, `#path-{id}`. Use invisible nodes (`fill: 'none', stroke: 'none'`) as positioned KaTeX labels.

**Convention**: y-up (math). `scale` and `originX/Y` handle mapping to SVG y-down.

## Hand-Drawn SVG (Legacy)

For graphs not using tikz-svg. Standard viewBox:

`viewBox="-45 -20 585 400"` — 585×400 total, extends left/up for labels.

```js
const toX = Q => 20 + Q * 3.133;   // xOrigin=20, xScale=470/150
const toY = P => 350 - P * 2.46;   // yOrigin=350
```

### Axes
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

### CSS Classes
```css
.demand-line { stroke: #dc322f; stroke-width: 5; fill: none; }
.supply-line { stroke: #268bd2; stroke-width: 5; fill: none; }
.atc-line    { stroke: #859900; stroke-width: 5; fill: none; }
.dotted-line { stroke: #586e75; stroke-width: 3; stroke-dasharray: 8, 6; fill: none; }
.axis-label  { font-family: 'Times New Roman', serif; font-size: 24px; font-style: italic; fill: #586e75; }
.eq-label    { font-family: 'Times New Roman', serif; font-size: 20px; font-style: italic; fill: #586e75; }
```

### Label Positioning
- **Y-axis**: x=-5, text-anchor="end"
- **X-axis**: y=375, text-anchor="middle"
- **Curves**: near endpoint, matching curve color

## KaTeX Labels in SVG

SVG `<text>` can't render KaTeX. Use absolutely positioned HTML divs over the SVG:

```html
<div class="scroll-frame-inner" style="position: relative;">
  <div id="price-label" style="position: absolute; font-size: 0.9rem; color: #586e75;">$P^*=$</div>
  <svg id="graph" viewBox="...">...</svg>
</div>
```

Position with `positionKatexLabel(svgId, labelId, svgX, svgY)` from `js/scroll-animations.js`.

## Animation Patterns

GSAP + ScrollTrigger setup:

```js
gsap.registerPlugin(ScrollTrigger);
const tl = gsap.timeline({
  scrollTrigger: {
    trigger: '#section-id', start: 'top top',
    end: '+=N%',   // 200-300% simple, 400-600% medium, 700-900% complex
    pin: true, scrub: 1, anticipatePin: 1
  }
});
```

### Assigning IDs for Animation

tikz-svg elements get predictable IDs. Assign `id` in config, target via GSAP:

```js
// In render config
{ type: 'node', id: 'eq-dot', ... }
// In GSAP
gsap.set('#node-eq-dot', { opacity: 0 });
tl.to('#node-eq-dot', { opacity: 1, duration: 0.3 }, 2);
```

### Pattern 1: Equilibrium Reveal
Dot → dashed lines extend → labels fade. **VERY COMMON**.
```
Phase N:   eq-dot opacity 0→1 (0.3s)
Phase N+1: dashed lines extend to axes (1s each)
Phase N+2: P*, Q* labels fade in (0.3s)
```

### Pattern 2: Curve Draw-In
Stroke-dashoffset animation. **COMMON**.
```js
const path = svg.querySelector('#my-curve');
const len = path.getTotalLength();
gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
tl.to(path, { strokeDashoffset: 0, duration: 1, ease: 'none' }, 0);
```

### Pattern 3: Welfare Polygon
Shaded CS/PS/DWL areas. Reveal in sequence. **COMMON**.
```js
tl.to('#cs-area', { opacity: 1, duration: 0.5 }, 3);
```

### Pattern 4: Multi-Phase Erase-and-Reverse
Phase 1 fades to `opacity: 0.25`, Phase 2 appears. **MODERATE**.

### Pattern 5: Side Comment Slide-In
Fixed panel from screen edge. **RARE but impactful**.
```css
.side-comment {
  position: fixed; top: 50%; right: -500px; transform: translateY(-50%);
  width: 350px; padding: 1.5rem; background: #fff8e1;
  border-left: 4px solid #f9a825; border-radius: 8px;
  box-shadow: -8px 8px 30px rgba(0,0,0,0.25); font-size: 0.95rem; z-index: 100; opacity: 0;
}
```
```js
tl.to('#comment', { right: 20, opacity: 1, duration: 1, ease: 'power2.out' }, 2);
// Reading pause (1.5 units)
tl.to('#comment', { right: -500, opacity: 0, duration: 1, ease: 'power2.in' }, 3.5);
```
**Variant**: opposing panels from opposite sides for direct comparison.

### Pattern 6: Horizontal Panel Transition
Swap graph views. **VERY RARE**.
```js
tl.to('#panel-2', { left: '0%', duration: 1, ease: 'none' }, 5);
tl.to('#panel-1', { x: '100vw', duration: 1, ease: 'none' }, 5);
```

### Pattern 7: Arrow Key Interactive
Parameter control gated by ScrollTrigger. **COMMON**.
```js
let navEnabled = false;
ScrollTrigger.create({
  trigger: '#section', start: 'top top', end: '+=200%', pin: true,
  onEnter: () => { navEnabled = true; },
  onLeave: () => { navEnabled = false; },
  onEnterBack: () => { navEnabled = true; },
  onLeaveBack: () => { navEnabled = false; },
});
document.addEventListener('keydown', e => {
  if (!navEnabled) return;
  if (e.key === 'ArrowRight') { param++; update(); e.preventDefault(); }
  if (e.key === 'ArrowLeft') { param--; update(); e.preventDefault(); }
});
```

### Pattern 8: Callout Annotation
Polar-positioned callouts via `callouts.js`. **RARE**.
```js
ellipseCallout(targetPoint, ["Line 1", "Line 2"], {
  angle: -151, distance: 188, fill: '#dc322f', textColor: '#fff'
});
```

## Animation Budget

Reserve animation for moments where the transition teaches something static text cannot. ~Half of lecture pages are appropriately static.

## Checklist

- [ ] Solarized colors for all graph elements
- [ ] Timeline phases have pauses between them
- [ ] Side comments have slide-in AND slide-out with gap
- [ ] Arrow key handlers gated by ScrollTrigger
- [ ] Animation used purposefully, not decoratively
- [ ] KaTeX labels positioned outside SVG when needed
- [ ] Correct viewBox for hand-drawn SVG
