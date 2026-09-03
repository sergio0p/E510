# Lessons from `static-grid/` — for the next game-creator app

Distilled while building `static-grid/` (12-cell grid of pre-defined extensive-form game trees) and intended as input for a future "instructor-driven game creator" app — i.e., one where the instructor specifies a game on the fly and the app renders it for classroom use.

The folder this references is `static-grid/`, a sibling of `backward-induction/`.

---

## What's reusable as-is

| Module | What to copy | Why |
|---|---|---|
| `tree-renderer.js` | Whole file | Layout + SVG rendering. Already handles multi-SVG-per-page, namespaced IDs, and the perpendicular-leaf trick. |
| `shuffle.js` | Whole file | mulberry32 PRNG + seeded Fisher-Yates. Handy for any "random presentation order" of instructor-defined items. |
| `applyHighlight()` (in `tree-renderer.js`) | The function + the `.optimal` CSS class | Declarative red-edge painting via `data-parent-id` / `data-child-index` attribute selectors. |
| Variation-spec pattern | The shape from `highlight-spec.js` | `{ kind, code, label, redEdges: [[parentId, childIndex], ...] }` — extensible to any highlight system. |
| Per-cell ID prefix | `buildGameTree(prefix)` pattern | Lets you put many trees on one page without DOM ID collisions. The prefix gets applied to canonical IDs at lookup time. |

## What needs to be parameterized for a creator app

| Currently hardcoded | Needs to become |
|---|---|
| `tree-builder.js` literal tree (P1 → 2× P2 → 4 leaves, fixed payoffs) | Input as JSON / object spec — possibly built by a GUI tree editor. |
| Edge labels `'U' / 'D'` in `renderEdge()` (line ~658) | Per-edge label from the spec. |
| Player count = 2, payoff vector length = 2 | Already loosely supports 3-player (see `numPlayers === 3` branches in `renderTerminalNode`). Test with 2 vs 3. |
| `STRATEGY_PROFILES` enumeration | If you keep the "highlight every strategy profile" feature, generate combinatorially from the tree shape. |

---

## The layout pipeline — read this before touching layout

There are **three sequential passes** in `tree-renderer.js`. Each can override the previous one. Knowing what runs when saved hours during this build:

1. **`computeLayout(root, w, h)`** — d3-hierarchy `tree()` layout, left-to-right.
   - `.size([h, w])` — first dim = sibling axis (vertical on screen), second = depth axis (horizontal).
   - `.separation((a, b) => …)` — controls *relative* sibling spacing. d3 then normalizes to fit `.size()`.
   - **Pitfall:** because d3 normalizes to fit, increasing one separation factor squeezes others; you can't simply "add space" globally here.

2. **`adjustEarlyLeaves(allNodes)`** — places leaves at period ≤ 3 *perpendicular* to their parent (same x, offset y).
   - **This silently overrides the d3 positions for those leaves.** I bumped the leaf-pair `separation` from 2.0 → 3.0 expecting wider spread; nothing changed because the leaves were perpendicular and got their y from `DEFAULT_OFFSET` instead.
   - "Above" placement: `parent.y - DEFAULT_OFFSET` (when there's no obstacle).
   - "Below" placement: **midpoint between parent and the next sibling node**, *not* `+ DEFAULT_OFFSET`. So bumping `DEFAULT_OFFSET` only stretches one direction. To stretch the other direction you have to push the *parent's siblings* apart (i.e., touch d3 layout or `CELL_SVG_HEIGHT`).
   - Constants: `NODE_RADIUS`, `MIN_GAP_FROM_OBSTACLE`, `MIN_TOTAL_SPACE`, `DEFAULT_OFFSET`. **All four are duplicated locally in this function** — don't assume they track the global node radius.

3. **`redistributeColumns(allNodes)`** — only kicks in when a column has gaps below `MIN_SPACING`. Borrows space from gaps above `MAX_SPACING`. For our 4-leaf column it usually does nothing.

**Implication for a creator app:** if the instructor's tree has different topology (asymmetric, deeper, 3-way splits at non-root), the perpendicular-leaf logic and its constants will need re-tuning. The current values were hand-fit for the 7-node shape.

---

## Pitfalls encountered (in chronological order)

### 1. Single-SVG assumptions in the original renderer
`backward-induction/js/tree-renderer.js` uses `document.getElementById('edges-layer'|'nodes-layer')` everywhere. With 12 SVGs on one page these IDs collide. Fix: pass `svg` to all helpers and use `svg.querySelector(…)`. **Cost: edited every renderer helper.**

### 2. Node IDs collide across SVGs
Same root cause. Fix: `buildGameTree(prefix)` namespaces every node ID with a per-cell prefix (e.g. `a-n0`, `b-n0`). Highlight specs store canonical (un-prefixed) IDs; the prefix is applied at lookup time inside `applyHighlight`.

### 3. Hardcoded NODE_RADIUS in 4+ places
Scaling visuals 1.4× missed the `NODE_RADIUS = 24` inside `adjustEarlyLeaves` (it's not the same constant as the one in `main.js` or in the circle `r=` attributes). The leaves got bigger but the perpendicular-placement obstacle math kept using 24. **Audit every duplicate before scaling.**

### 4. d3 `separation` change had no effect
See pipeline pitfall above. **Always trace through all three passes before assuming a knob does anything.**

### 5. Asymmetric "above" vs "below" perpendicular placement
`adaptiveYAbove = parent.y − DEFAULT_OFFSET` but `adaptiveYBelow = midpoint(parent, sibling)`. They are not symmetric formulas. If the spec ever requires equal U-distances, this needs unification.

### 6. CELL_SVG_WIDTH halving doesn't behave like a uniform zoom
Halving `CELL_SVG_WIDTH` shrinks d3's depth spread, but the auto-fit viewBox in `main.js` then becomes *more square*. The cell has a fixed aspect ratio in CSS — so "meet" letterboxes the result and changes the apparent scale. Layout dimensions and rendered scale are coupled through cell aspect-ratio. **Adjust both together or expect surprises.**

### 7. CSS overrides SVG presentation attributes
`element.setAttribute("stroke-width", "3")` is a presentation attribute. A CSS rule like `.edge.optimal { stroke-width: 6px }` overrides it. This is *useful* (it's how the highlight thickening works) but counter-intuitive if you're used to inline-style precedence. Don't set the same property both ways.

### 8. `PADDING` letterboxes the trees inside the cell
The auto-fit viewBox in `main.js` adds `PADDING` on all sides of the node bounding box. Big padding = small-looking tree inside the cell. Started at 100, dropped to 30. **First lever to reach for when "trees look small."**

### 9. HTML cell label ate vertical space
Originally each cell had `<div class="cell-label">a)</div>` above the SVG via flex. In a tight grid this stole real estate. Moved the label *inside* the SVG as `<text>` at `(minX + offset, minY + offset)` with `dominant-baseline="hanging"`. The viewBox already includes `PADDING` so there's room without further adjustment.

### 10. Don't auto-couple values just because it "seems cleaner"
When the user asked to bump label font-size from 36 → 44, I helpfully refactored offset = `font-size * 2`. They wanted the offset to stay where they put it. **Lesson: when a value was set by explicit choice, don't reach for a derived formula on a follow-up change unless asked.**

### 11. The grid layout is HTML, not SVG
12 separate SVGs inside a CSS Grid. There's no composite SVG to export. PNG export = page screenshot (Chrome DevTools "Capture full size screenshot" or `Cmd+Shift+4`). For headless / scripted rendering you'd need to either composite all 12 into one root `<svg>` with `<g transform>` blocks, or use Playwright/Puppeteer.

### 12. d3-hierarchy via CDN (`+esm`)
Works fine, requires localhost (`file://` blocks ES module imports). The local server (`python3 -m http.server`) is non-optional. The hash in `https://cdn.jsdelivr.net/npm/d3-hierarchy@3/+esm` pins to v3 — a future major bump in d3 could break the layout.

---

## Sizing knobs cheat sheet

| What you want to change | Where to look |
|---|---|
| Tree compactness horizontally | `CELL_SVG_WIDTH` in `main.js` |
| Tree compactness vertically | `CELL_SVG_HEIGHT` in `main.js` (also affects below-perpendicular leaf placement via the U-D gap) |
| Distance from P2-node to its "above" leaf | `DEFAULT_OFFSET` in `adjustEarlyLeaves` |
| Distance from P2-node to its "below" leaf | Indirect — push P2 nodes apart via `CELL_SVG_HEIGHT` or d3 separation for non-leaves |
| Padding around tree inside cell | `PADDING` in `main.js` |
| Cell shape (squat vs tall) | `aspect-ratio` of `.cell` in `style.css` |
| Node circle size | `r="…"` in `renderDecisionNode` and `renderTerminalNode`; **also** `NODE_RADIUS` in `main.js` (viewBox auto-fit) **and** in `adjustEarlyLeaves` (obstacle math) |
| Edge thickness (regular) | `stroke-width` in `renderEdge` (set on `visibleMain` and `visibleTaper`) |
| Edge thickness (highlighted) | `.edge.optimal { stroke-width }` in `style.css` (CSS wins over inline) |
| Text sizes | `font-size` set inline in three places: edge labels (`renderEdgeLabel`), decision-node digit (`renderDecisionNode`), payoff numbers (`renderTerminalNode`) |
| Cell letter label (a, b, …) | Inline `font-size` in `main.js` `renderCell` |

---

## Suggestions for the creator app

1. **Single source of truth for sizes.** All the duplicated `NODE_RADIUS` etc. should live in one config object that `main.js`, `tree-renderer.js`, and `adjustEarlyLeaves` share. Several pitfalls above stem from missing one of the duplicates.

2. **Decouple layout from visuals.** Currently `CELL_SVG_WIDTH` controls d3's coord system *and* the apparent scale via viewBox. Better: a "logical units" coord system + an explicit scale factor.

3. **Tree input as JSON.** Replace `tree-builder.js` with a small schema (nodes: `{id, player, children?, payoffs?}`). Validate at load time. Then a separate authoring UI can produce that JSON.

4. **Highlight specs as named overlays.** The `{ kind, code, label, redEdges }` pattern generalizes to any "show me strategy X" feature. For an instructor app, pre-compute SPE / NE / arbitrary user-defined paths.

5. **PNG export inline.** Keep the "screenshot the page" workflow for now — it works, it's lossless, and Chrome DevTools is one shortcut away. Only invest in headless rendering if classroom workflow demands it.

6. **Test layouts on diverse trees early.** The 3-pass layout was tuned on one shape. Run it on: asymmetric trees, depth ≥ 4, 3-way splits at non-root, single-leaf siblings. Expect to revisit `adjustEarlyLeaves` constants.

7. **Don't reinvent the perpendicular-leaf trick.** It's the secret sauce that makes these trees look readable in narrow cells. Don't replace it with naive d3 layout.
