# Static Grid Game-Tree Renderer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a sibling app `static-grid/` that renders a 4×3 grid of twelve mini extensive-form game trees, each highlighting a different strategy profile or outcome path in red, suitable for screenshot/print into an exam.

**Architecture:** New folder `Projects/E510/GameTreeApp/static-grid/`, duplicating the relevant rendering code from `backward-induction/` rather than refactoring the original to share modules. The duplicated `tree-renderer.js` is minimally modified: accept an SVG element parameter (so multiple SVGs can coexist on one page), change edge labels from `['a','b','c']` to `['U','D']`, and drop interaction/animation hooks.

**Tech Stack:** Vanilla JS ES6 modules, D3 hierarchy (via CDN), CSS Grid. No build step. Loaded via a localhost static server (per project convention — file:// won't work for ES modules).

---

## Spec reference

`docs/superpowers/specs/2026-04-29-static-grid-design.md` — read this before starting.

## Repo context

- Git root: `/Users/sergiop/Dropbox/Teaching/Projects/E510`
- Working dir for this app: `/Users/sergiop/Dropbox/Teaching/Projects/E510/GameTreeApp/static-grid/`
- Existing app to duplicate from: `/Users/sergiop/Dropbox/Teaching/Projects/E510/GameTreeApp/backward-induction/`
- Localhost server convention: serve from `/Users/sergiop/Dropbox/Teaching/Projects/E510/GameTreeApp/` so URLs like `http://localhost:8000/static-grid/index.html` work.
- Commit style (from `git log`): `Add ECON 510 GameTreeApp: <subject>` or `Update ECON 510 GameTreeApp: <subject>`. Each task ends with one commit.

## File structure

```
static-grid/
├── index.html              (Task 1)
├── style.css               (Task 7)
├── tests.html              (Task 9 — simple browser-based assertions)
└── js/
    ├── tree-builder.js     (Task 2 — hand-coded 2x2 game)
    ├── shuffle.js          (Task 3 — mulberry32 + Fisher-Yates)
    ├── highlight-spec.js   (Task 4 — 12 variation specs)
    ├── tree-renderer.js    (Task 5 — duplicated + modified)
    └── main.js             (Task 6 — orchestrator)
```

Each file has one responsibility; no cross-imports between `static-grid/` and `backward-induction/`.

---

## Task 1: Folder skeleton + minimal index.html

**Files:**
- Create: `static-grid/index.html`

- [ ] **Step 1.1: Create the folder**

```bash
mkdir -p /Users/sergiop/Dropbox/Teaching/Projects/E510/GameTreeApp/static-grid/js
```

- [ ] **Step 1.2: Write index.html**

Path: `static-grid/index.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Game Tree — 12-variation grid</title>
  <link href="https://fonts.googleapis.com/css2?family=STIX+Two+Text:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <main id="grid"></main>
  <footer id="instructor-area">
    <div id="seed-display">Seed: <span id="seed-value">…</span></div>
    <button id="reroll">Re-roll seed</button>
    <details id="answer-key">
      <summary>Answer key (instructor only)</summary>
      <ol id="answer-key-list"></ol>
    </details>
  </footer>
  <script type="module" src="js/main.js"></script>
</body>
</html>
```

- [ ] **Step 1.3: Verify the file loads**

Start a localhost server from the parent dir (skip if one is already running):

```bash
cd /Users/sergiop/Dropbox/Teaching/Projects/E510/GameTreeApp && python3 -m http.server 8000
```

Open `http://localhost:8000/static-grid/index.html` in Chrome. Expected: blank page, no console errors except possibly "404 style.css" and "404 main.js" (those come in later tasks). Stop the server with Ctrl+C when done.

- [ ] **Step 1.4: Commit**

```bash
git -C /Users/sergiop/Dropbox/Teaching/Projects/E510 add GameTreeApp/static-grid/index.html
git -C /Users/sergiop/Dropbox/Teaching/Projects/E510 commit -m "Add ECON 510 GameTreeApp: static-grid skeleton index.html"
```

---

## Task 2: Tree builder (hand-coded 2x2 game)

**Files:**
- Create: `static-grid/js/tree-builder.js`

- [ ] **Step 2.1: Write tree-builder.js**

Path: `static-grid/js/tree-builder.js`

```js
// Hand-coded 2-player sequential game.
// Structure:
//   root P1 (period 0) → 2 children (P2 nodes, period 1)
//   each P2 node     → 2 leaves (period 2) with payoffs (P1, P2)
//
// At every decision node: child[0] is "U" (upper), child[1] is "D" (lower).
//
// `idPrefix` namespaces node ids so multiple instances can coexist on one page
// without DOM id collisions (e.g. prefix "a" → ids "a-n0", "a-n0_0", ...).

const PAYOFFS = {
  // Keys are "<P1 action><P2 action>"
  UU: [4, 3],
  UD: [1, 1],
  DU: [3, 4],
  DD: [0, 2],
};

export function buildGameTree(idPrefix = '') {
  const prefix = idPrefix ? `${idPrefix}-` : '';

  function makeLeaf(id, period, payoffs) {
    return {
      id, player: null, period, actions: 0,
      payoffs: [...payoffs], children: [], parent: null,
      isLeaf: true, x: 0, y: 0,
    };
  }

  function makeDecision(id, player, period, actions) {
    return {
      id, player, period, actions,
      payoffs: null, children: [], parent: null,
      isLeaf: false, x: 0, y: 0,
    };
  }

  // Build leaves
  const leafUU = makeLeaf(`${prefix}n0_0_0`, 2, PAYOFFS.UU);
  const leafUD = makeLeaf(`${prefix}n0_0_1`, 2, PAYOFFS.UD);
  const leafDU = makeLeaf(`${prefix}n0_1_0`, 2, PAYOFFS.DU);
  const leafDD = makeLeaf(`${prefix}n0_1_1`, 2, PAYOFFS.DD);

  // Build P2 subgame nodes
  const p2U = makeDecision(`${prefix}n0_0`, 2, 1, 2);
  const p2D = makeDecision(`${prefix}n0_1`, 2, 1, 2);

  // Build root
  const root = makeDecision(`${prefix}n0`, 1, 0, 2);

  // Wire up parent/child
  p2U.children = [leafUU, leafUD];
  leafUU.parent = p2U;
  leafUD.parent = p2U;

  p2D.children = [leafDU, leafDD];
  leafDU.parent = p2D;
  leafDD.parent = p2D;

  root.children = [p2U, p2D];
  p2U.parent = root;
  p2D.parent = root;

  const allNodes = [root, p2U, p2D, leafUU, leafUD, leafDU, leafDD];
  const allLeaves = [leafUU, leafUD, leafDU, leafDD];

  return { root, allNodes, allLeaves };
}

// Returns the canonical (unprefixed) node ids in the order they are needed
// elsewhere — useful for highlight specs that reference edges by id.
export const NODE_IDS = {
  root: 'n0',
  p2U: 'n0_0',
  p2D: 'n0_1',
  leafUU: 'n0_0_0',
  leafUD: 'n0_0_1',
  leafDU: 'n0_1_0',
  leafDD: 'n0_1_1',
};
```

- [ ] **Step 2.2: Commit**

```bash
git -C /Users/sergiop/Dropbox/Teaching/Projects/E510 add GameTreeApp/static-grid/js/tree-builder.js
git -C /Users/sergiop/Dropbox/Teaching/Projects/E510 commit -m "Add ECON 510 GameTreeApp: static-grid tree-builder"
```

---

## Task 3: Seeded shuffle

**Files:**
- Create: `static-grid/js/shuffle.js`

- [ ] **Step 3.1: Write shuffle.js**

Path: `static-grid/js/shuffle.js`

```js
// mulberry32 — small, fast, deterministic PRNG.
// Public domain. Seed is a 32-bit unsigned int.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Fisher-Yates shuffle using a provided PRNG.
// Returns a new array; does not mutate the input.
export function shuffleWithPrng(arr, prng) {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(prng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// Convenience: shuffle by integer seed.
export function shuffleWithSeed(arr, seed) {
  return shuffleWithPrng(arr, mulberry32(seed));
}

// Generate a fresh random seed in [0, 2^32).
export function randomSeed() {
  return Math.floor(Math.random() * 0x100000000) >>> 0;
}
```

- [ ] **Step 3.2: Commit**

```bash
git -C /Users/sergiop/Dropbox/Teaching/Projects/E510 add GameTreeApp/static-grid/js/shuffle.js
git -C /Users/sergiop/Dropbox/Teaching/Projects/E510 commit -m "Add ECON 510 GameTreeApp: static-grid shuffle utility"
```

---

## Task 4: 12 variation specs

**Files:**
- Create: `static-grid/js/highlight-spec.js`

- [ ] **Step 4.1: Write highlight-spec.js**

Path: `static-grid/js/highlight-spec.js`

```js
// Each variation specifies which edges to paint red.
// `redEdges` lists pairs [parentId, childIndex] (childIndex 0 = U, 1 = D).
// `kind` is either 'profile' (3 edges, full strategy profile) or
// 'path' (2 edges, root-to-leaf outcome path).
//
// `label` is shown in the instructor-only answer key.

import { NODE_IDS } from './tree-builder.js';

const ROOT = NODE_IDS.root;
const P2U  = NODE_IDS.p2U;
const P2D  = NODE_IDS.p2D;

// Helpers: at every node, child index 0 = "U", child index 1 = "D".
const U = 0;
const D = 1;

// 8 strategy profiles: (P1's action, P2's action after U, P2's action after D).
// Each is 3 red edges (one at root, one at p2U, one at p2D).
const STRATEGY_PROFILES = [
  { kind: 'profile', code: 'UUU', label: 'Strategy profile (U, U, U) — SPE',
    redEdges: [[ROOT, U], [P2U, U], [P2D, U]] },
  { kind: 'profile', code: 'UUD', label: 'Strategy profile (U, U, D) — NE, not SPE (same outcome as SPE)',
    redEdges: [[ROOT, U], [P2U, U], [P2D, D]] },
  { kind: 'profile', code: 'UDU', label: 'Strategy profile (U, D, U) — not NE',
    redEdges: [[ROOT, U], [P2U, D], [P2D, U]] },
  { kind: 'profile', code: 'UDD', label: 'Strategy profile (U, D, D) — not NE',
    redEdges: [[ROOT, U], [P2U, D], [P2D, D]] },
  { kind: 'profile', code: 'DUU', label: 'Strategy profile (D, U, U) — not NE',
    redEdges: [[ROOT, D], [P2U, U], [P2D, U]] },
  { kind: 'profile', code: 'DUD', label: 'Strategy profile (D, U, D) — not NE',
    redEdges: [[ROOT, D], [P2U, U], [P2D, D]] },
  { kind: 'profile', code: 'DDU', label: 'Strategy profile (D, D, U) — NE, not SPE (different outcome)',
    redEdges: [[ROOT, D], [P2U, D], [P2D, U]] },
  { kind: 'profile', code: 'DDD', label: 'Strategy profile (D, D, D) — not NE',
    redEdges: [[ROOT, D], [P2U, D], [P2D, D]] },
];

// 4 outcome paths: 2 red edges from root to a leaf.
const OUTCOME_PATHS = [
  { kind: 'path', code: 'path-UU', label: 'Outcome path U→U (not a strategy profile)',
    redEdges: [[ROOT, U], [P2U, U]] },
  { kind: 'path', code: 'path-UD', label: 'Outcome path U→D (not a strategy profile)',
    redEdges: [[ROOT, U], [P2U, D]] },
  { kind: 'path', code: 'path-DU', label: 'Outcome path D→U (not a strategy profile)',
    redEdges: [[ROOT, D], [P2D, U]] },
  { kind: 'path', code: 'path-DD', label: 'Outcome path D→D (not a strategy profile)',
    redEdges: [[ROOT, D], [P2D, D]] },
];

export const VARIATIONS = [...STRATEGY_PROFILES, ...OUTCOME_PATHS];

if (VARIATIONS.length !== 12) {
  throw new Error(`Expected 12 variations, got ${VARIATIONS.length}`);
}
```

- [ ] **Step 4.2: Commit**

```bash
git -C /Users/sergiop/Dropbox/Teaching/Projects/E510 add GameTreeApp/static-grid/js/highlight-spec.js
git -C /Users/sergiop/Dropbox/Teaching/Projects/E510 commit -m "Add ECON 510 GameTreeApp: static-grid 12 variation specs"
```

---

## Task 5: Duplicate and minimally modify tree-renderer.js

**Files:**
- Create: `static-grid/js/tree-renderer.js`

The strategy: copy `backward-induction/js/tree-renderer.js` verbatim, then make four targeted edits. After the copy, total lines should be lower (only the edits below subtract code; nothing is added beyond a small `applyHighlight` function).

- [ ] **Step 5.1: Copy the file verbatim**

```bash
cp /Users/sergiop/Dropbox/Teaching/Projects/E510/GameTreeApp/backward-induction/js/tree-renderer.js \
   /Users/sergiop/Dropbox/Teaching/Projects/E510/GameTreeApp/static-grid/js/tree-renderer.js
```

- [ ] **Step 5.2: Make `renderTree` accept an SVG element parameter**

Currently `renderTree(root, allNodes)` calls `document.getElementById('tree-svg')`. We need it to accept the SVG element directly so multiple trees can coexist.

Edit `static-grid/js/tree-renderer.js`:

Find:
```js
export function renderTree(root, allNodes) {
  const svg = document.getElementById('tree-svg');
```

Replace with:
```js
export function renderTree(root, allNodes, svg) {
```

The `svg` variable is now a parameter. The rest of `renderTree` works unchanged because it already uses the local `svg` reference.

- [ ] **Step 5.3: Pass `svg` into the per-edge and per-node helpers**

The internal helpers (`renderEdge`, `renderEdgeLabel`, `renderDecisionNode`, `renderTerminalNode`) all call `document.getElementById('edges-layer')` or `'nodes-layer'`. They need to look up layers within the right SVG instead.

Edit the calls inside `renderTree` to pass `svg`:

Find:
```js
  allNodes.forEach(node => {
    if (!node.isLeaf) {
      node.children.forEach((child, index) => {
        renderEdge(node, child, index);
      });
    }
  });

  allNodes.forEach(node => {
    if (node.isLeaf) {
      renderTerminalNode(node);
    } else {
      renderDecisionNode(node);
    }
  });
}
```

Replace with:
```js
  allNodes.forEach(node => {
    if (!node.isLeaf) {
      node.children.forEach((child, index) => {
        renderEdge(node, child, index, svg);
      });
    }
  });

  allNodes.forEach(node => {
    if (node.isLeaf) {
      renderTerminalNode(node, svg);
    } else {
      renderDecisionNode(node, svg);
    }
  });
}
```

- [ ] **Step 5.4: Update each helper to accept and use the svg parameter**

Find:
```js
function renderEdge(parent, child, childIndex) {
  const layer = document.getElementById('edges-layer');
```
Replace with:
```js
function renderEdge(parent, child, childIndex, svg) {
  const layer = svg.querySelector('#edges-layer');
```

In the body of `renderEdge`, find the call:
```js
  renderEdgeLabel(parent, child, label);
```
Replace with:
```js
  renderEdgeLabel(parent, child, label, svg);
```

Find:
```js
function renderEdgeLabel(parent, child, label) {
  const layer = document.getElementById('edges-layer');
```
Replace with:
```js
function renderEdgeLabel(parent, child, label, svg) {
  const layer = svg.querySelector('#edges-layer');
```

Find:
```js
function renderDecisionNode(node) {
  const layer = document.getElementById('nodes-layer');
```
Replace with:
```js
function renderDecisionNode(node, svg) {
  const layer = svg.querySelector('#nodes-layer');
```

Find:
```js
function renderTerminalNode(node) {
  const layer = document.getElementById('nodes-layer');
```
Replace with:
```js
function renderTerminalNode(node, svg) {
  const layer = svg.querySelector('#nodes-layer');
```

- [ ] **Step 5.5: Change edge labels from a/b/c to U/D**

In `renderEdge`, find:
```js
  const labels = ['a', 'b', 'c'];
  const label = labels[childIndex];
```
Replace with:
```js
  const labels = ['U', 'D'];
  const label = labels[childIndex] ?? '';
```

(The fallback is defensive; our 2x2 game only has childIndex 0 and 1.)

- [ ] **Step 5.6: Add `applyHighlight` and remove unused interaction exports**

At the bottom of `static-grid/js/tree-renderer.js`, **delete** the three unused exports (already in the file from the copy):
- `setupClickableEdges`
- `markEdgeOptimal`
- `shakeEdge`

Just remove these three function definitions in their entirety. The file should end with `renderTerminalNode` and `getEdgePath` only.

Then **append** this new function:

```js
// Paint a set of edges red after rendering. Each entry in redEdges is
// [parentId, childIndex]. parentId must be the actual node id used in the
// rendered tree (i.e. with the per-instance prefix already applied).
export function applyHighlight(svg, redEdges, idPrefix = '') {
  redEdges.forEach(([parentId, childIndex]) => {
    const fullParentId = idPrefix ? `${idPrefix}-${parentId}` : parentId;
    // Find the parent node's data via the rendered DOM.
    // We locate the edge group by parent id + child index data attribute.
    const edgeGroup = svg.querySelector(
      `g[data-parent-id="${fullParentId}"][data-child-index="${childIndex}"]`
    );
    if (!edgeGroup) {
      console.warn(`applyHighlight: no edge for parent=${fullParentId}, child=${childIndex}`);
      return;
    }
    const mainPath  = edgeGroup.querySelector('.edge-main');
    const taperPath = edgeGroup.querySelector('.edge-taper');
    if (mainPath)  mainPath.classList.add('optimal');
    if (taperPath) {
      taperPath.classList.add('optimal');
      taperPath.setAttribute('marker-end', 'url(#arrowhead-red)');
    }
  });
}
```

`renderEdge` already sets `data-parent-id` and `data-child-index` attributes on the edge group (see `backward-induction/js/tree-renderer.js:623-624`), so `applyHighlight` can find edges purely by data attributes — no need for the highlight specs to know the prefix-augmented child ids.

- [ ] **Step 5.7: Verify the file**

```bash
node --check /Users/sergiop/Dropbox/Teaching/Projects/E510/GameTreeApp/static-grid/js/tree-renderer.js
```

Expected: no output (syntax OK).

Also visually confirm: open the file and ensure `setupClickableEdges`, `markEdgeOptimal`, and `shakeEdge` are gone.

- [ ] **Step 5.8: Commit**

```bash
git -C /Users/sergiop/Dropbox/Teaching/Projects/E510 add GameTreeApp/static-grid/js/tree-renderer.js
git -C /Users/sergiop/Dropbox/Teaching/Projects/E510 commit -m "Add ECON 510 GameTreeApp: static-grid duplicated renderer with U/D labels"
```

---

## Task 6: Orchestrator (main.js)

**Files:**
- Create: `static-grid/js/main.js`

- [ ] **Step 6.1: Write main.js**

Path: `static-grid/js/main.js`

```js
import { buildGameTree } from './tree-builder.js';
import { computeLayout, adjustEarlyLeaves, redistributeColumns, renderTree, applyHighlight } from './tree-renderer.js';
import { VARIATIONS } from './highlight-spec.js';
import { mulberry32, shuffleWithPrng, randomSeed } from './shuffle.js';

const LETTERS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l'];
const CELL_SVG_WIDTH  = 1400;   // logical layout width (viewBox-scaled to fit cell)
const CELL_SVG_HEIGHT = 900;    // logical layout height

function getSeed() {
  const params = new URLSearchParams(window.location.search);
  const fromUrl = params.get('seed');
  if (fromUrl !== null) {
    const n = parseInt(fromUrl, 10);
    if (Number.isFinite(n) && n >= 0) return n >>> 0;
  }
  return randomSeed();
}

function setSeedDisplay(seed) {
  document.getElementById('seed-value').textContent = String(seed);
}

function fillAnswerKey(orderedVariations) {
  const list = document.getElementById('answer-key-list');
  list.innerHTML = '';
  orderedVariations.forEach((v, i) => {
    const li = document.createElement('li');
    li.textContent = `${LETTERS[i]}) ${v.label}`;
    list.appendChild(li);
  });
}

function renderCell(letter, variation, gridEl) {
  // Cell wrapper
  const cell = document.createElement('section');
  cell.className = 'cell';

  const labelDiv = document.createElement('div');
  labelDiv.className = 'cell-label';
  labelDiv.textContent = `${letter})`;
  cell.appendChild(labelDiv);

  // Build a fresh tree for this cell, namespaced by letter prefix
  const { root, allNodes } = buildGameTree(letter);

  // SVG element for this cell
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.classList.add('cell-svg');
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  cell.appendChild(svg);

  // Run layout passes (same as backward-induction app, minus collision retry)
  computeLayout(root, CELL_SVG_WIDTH, CELL_SVG_HEIGHT);
  adjustEarlyLeaves(allNodes);
  redistributeColumns(allNodes);

  // Compute viewBox to fit all nodes with padding
  const NODE_RADIUS = 24;
  const PADDING = 100;
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  allNodes.forEach(n => {
    minX = Math.min(minX, n.x - NODE_RADIUS);
    maxX = Math.max(maxX, n.x + NODE_RADIUS);
    minY = Math.min(minY, n.y - NODE_RADIUS);
    maxY = Math.max(maxY, n.y + NODE_RADIUS);
  });
  minX -= PADDING; maxX += PADDING; minY -= PADDING; maxY += PADDING;
  svg.setAttribute('viewBox', `${minX} ${minY} ${maxX - minX} ${maxY - minY}`);

  // Render and highlight
  renderTree(root, allNodes, svg);
  applyHighlight(svg, variation.redEdges, letter);

  gridEl.appendChild(cell);
}

function init() {
  const seed = getSeed();
  setSeedDisplay(seed);

  const prng = mulberry32(seed);
  const ordered = shuffleWithPrng(VARIATIONS, prng);

  fillAnswerKey(ordered);

  const gridEl = document.getElementById('grid');
  gridEl.innerHTML = '';
  ordered.forEach((variation, i) => {
    renderCell(LETTERS[i], variation, gridEl);
  });

  document.getElementById('reroll').addEventListener('click', () => {
    const newSeed = randomSeed();
    const url = new URL(window.location.href);
    url.searchParams.set('seed', newSeed);
    window.location.href = url.toString();
  });
}

document.addEventListener('DOMContentLoaded', init);
```

- [ ] **Step 6.2: Commit**

```bash
git -C /Users/sergiop/Dropbox/Teaching/Projects/E510 add GameTreeApp/static-grid/js/main.js
git -C /Users/sergiop/Dropbox/Teaching/Projects/E510 commit -m "Add ECON 510 GameTreeApp: static-grid orchestrator main.js"
```

---

## Task 7: CSS — 4×3 grid layout

**Files:**
- Create: `static-grid/style.css`

- [ ] **Step 7.1: Write style.css**

Path: `static-grid/style.css`

```css
* { box-sizing: border-box; }

body {
  font-family: 'STIX Two Text', serif;
  background: #FAFAFA;
  margin: 0;
  padding: 16px;
}

#grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(3, 1fr);
  gap: 8px;
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
}

.cell {
  position: relative;
  background: white;
  border: 1px solid #D1D5DB;
  border-radius: 4px;
  aspect-ratio: 4 / 3;
  display: flex;
  flex-direction: column;
  padding: 4px;
}

.cell-label {
  font-weight: bold;
  font-size: 14px;
  color: #111827;
  padding-left: 4px;
  flex: 0 0 auto;
}

.cell-svg {
  flex: 1 1 auto;
  width: 100%;
  height: 100%;
  display: block;
}

/* Edge styles — duplicated from backward-induction/style.css for the
   `.optimal` class used by applyHighlight() */
.edge.optimal {
  stroke: #DC2626;
  stroke-width: 3px;
  pointer-events: none;
}

/* Instructor area — easily croppable */
#instructor-area {
  margin-top: 16px;
  padding: 12px 16px;
  background: #F3F4F6;
  border-radius: 4px;
  max-width: 1400px;
  margin-left: auto;
  margin-right: auto;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  font-size: 14px;
  color: #374151;
}

#seed-display {
  display: inline-block;
  margin-right: 16px;
}

#reroll {
  background: #2563EB;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font: inherit;
}

#reroll:hover { background: #1D4ED8; }

#answer-key {
  margin-top: 12px;
}

#answer-key summary {
  cursor: pointer;
  font-weight: 600;
}

#answer-key-list {
  margin: 8px 0 0 20px;
  padding: 0;
}

@media print {
  body { padding: 0; background: white; }
  #instructor-area { display: none; }
  .cell { border-color: #9CA3AF; }
  @page { size: landscape; margin: 0.4in; }
}
```

- [ ] **Step 7.2: Verify visually**

Start localhost server (or reuse a running one):

```bash
cd /Users/sergiop/Dropbox/Teaching/Projects/E510/GameTreeApp && python3 -m http.server 8000
```

Open `http://localhost:8000/static-grid/index.html`. Expected:
- 4×3 grid of 12 mini trees
- Each cell labeled `a)` through `l)` in the top-left
- Each tree has 3 colored circles (P1 red root, P2 green nodes), 4 grey leaf circles with payoff pairs, and `U`/`D` labels on each edge
- One specific set of edges in red per cell, varying across cells
- Below the grid: a seed value, a "Re-roll seed" button, and a collapsed "Answer key" details block
- Re-rolling produces a different arrangement; `?seed=<N>` in URL pins it

Stop the server when done.

- [ ] **Step 7.3: Commit**

```bash
git -C /Users/sergiop/Dropbox/Teaching/Projects/E510 add GameTreeApp/static-grid/style.css
git -C /Users/sergiop/Dropbox/Teaching/Projects/E510 commit -m "Add ECON 510 GameTreeApp: static-grid CSS layout"
```

---

## Task 8: Lightweight tests

**Files:**
- Create: `static-grid/tests.html`

A single browser-loaded test page that exercises the deterministic logic. No test framework — plain assertions, PASS/FAIL printed to the page and console.

- [ ] **Step 8.1: Write tests.html**

Path: `static-grid/tests.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>static-grid tests</title>
  <style>
    body { font-family: monospace; padding: 16px; }
    .pass { color: #16A34A; }
    .fail { color: #DC2626; font-weight: bold; }
  </style>
</head>
<body>
<h1>static-grid tests</h1>
<ol id="results"></ol>
<script type="module">
  import { buildGameTree, NODE_IDS } from './js/tree-builder.js';
  import { mulberry32, shuffleWithSeed, shuffleWithPrng } from './js/shuffle.js';
  import { VARIATIONS } from './js/highlight-spec.js';

  const results = document.getElementById('results');
  let passes = 0, fails = 0;
  function check(name, cond, detail = '') {
    const li = document.createElement('li');
    if (cond) {
      li.className = 'pass';
      li.textContent = `PASS — ${name}`;
      passes++;
    } else {
      li.className = 'fail';
      li.textContent = `FAIL — ${name}${detail ? ' — ' + detail : ''}`;
      fails++;
    }
    results.appendChild(li);
  }

  // --- tree-builder ---
  {
    const { root, allNodes, allLeaves } = buildGameTree();
    check('builder: root is P1 at period 0', root.player === 1 && root.period === 0);
    check('builder: root has 2 children', root.children.length === 2);
    check('builder: both root children are P2 at period 1',
      root.children.every(c => c.player === 2 && c.period === 1));
    check('builder: 4 leaves at period 2', allLeaves.length === 4 && allLeaves.every(l => l.period === 2));
    check('builder: total node count is 7', allNodes.length === 7);
    check('builder: leaf payoffs match design (UU=4,3)',
      JSON.stringify(allLeaves[0].payoffs) === '[4,3]');
    check('builder: leaf payoffs match design (UD=1,1)',
      JSON.stringify(allLeaves[1].payoffs) === '[1,1]');
    check('builder: leaf payoffs match design (DU=3,4)',
      JSON.stringify(allLeaves[2].payoffs) === '[3,4]');
    check('builder: leaf payoffs match design (DD=0,2)',
      JSON.stringify(allLeaves[3].payoffs) === '[0,2]');
    check('builder: NODE_IDS.root matches root id', NODE_IDS.root === root.id);
  }

  // --- prefix namespacing ---
  {
    const t1 = buildGameTree('a');
    const t2 = buildGameTree('b');
    check('builder: prefix "a" applied to root id', t1.root.id === 'a-n0');
    check('builder: prefix "b" applied to root id', t2.root.id === 'b-n0');
    check('builder: prefix-isolated trees have distinct node ids',
      t1.allNodes.every(n1 => !t2.allNodes.some(n2 => n2.id === n1.id)));
  }

  // --- shuffle determinism ---
  {
    const a1 = shuffleWithSeed([1,2,3,4,5,6,7,8,9,10,11,12], 42);
    const a2 = shuffleWithSeed([1,2,3,4,5,6,7,8,9,10,11,12], 42);
    check('shuffle: same seed → identical output',
      JSON.stringify(a1) === JSON.stringify(a2));

    const a3 = shuffleWithSeed([1,2,3,4,5,6,7,8,9,10,11,12], 43);
    check('shuffle: different seed → different output',
      JSON.stringify(a1) !== JSON.stringify(a3));

    check('shuffle: preserves length', a1.length === 12);
    check('shuffle: preserves elements (multiset)',
      a1.slice().sort((x,y)=>x-y).join() === '1,2,3,4,5,6,7,8,9,10,11,12');

    // PRNG is reproducible
    const p1 = mulberry32(99); const p2 = mulberry32(99);
    check('mulberry32: same seed → same first 5 outputs',
      [0,0,0,0,0].every(() => p1() === p2()));
  }

  // --- highlight specs ---
  {
    check('highlight-spec: 12 variations total', VARIATIONS.length === 12);
    check('highlight-spec: 8 are profiles',
      VARIATIONS.filter(v => v.kind === 'profile').length === 8);
    check('highlight-spec: 4 are paths',
      VARIATIONS.filter(v => v.kind === 'path').length === 4);
    check('highlight-spec: every profile has 3 red edges',
      VARIATIONS.filter(v => v.kind === 'profile').every(v => v.redEdges.length === 3));
    check('highlight-spec: every path has 2 red edges',
      VARIATIONS.filter(v => v.kind === 'path').every(v => v.redEdges.length === 2));
    check('highlight-spec: codes are unique',
      new Set(VARIATIONS.map(v => v.code)).size === 12);
    const spe = VARIATIONS.find(v => v.code === 'UUU');
    check('highlight-spec: UUU is labeled SPE', spe && /SPE/.test(spe.label));
  }

  const summary = document.createElement('p');
  summary.innerHTML = fails === 0
    ? `<span class="pass">All ${passes} tests passed.</span>`
    : `<span class="fail">${fails} of ${passes + fails} tests failed.</span>`;
  document.body.appendChild(summary);
  console.log(`Tests: ${passes} pass, ${fails} fail`);
</script>
</body>
</html>
```

- [ ] **Step 8.2: Run the tests**

```bash
cd /Users/sergiop/Dropbox/Teaching/Projects/E510/GameTreeApp && python3 -m http.server 8000
```

Open `http://localhost:8000/static-grid/tests.html`. Expected: every line green ("PASS"), final summary "All N tests passed." If any FAIL, fix the implementation referenced and re-run before continuing.

- [ ] **Step 8.3: Commit**

```bash
git -C /Users/sergiop/Dropbox/Teaching/Projects/E510 add GameTreeApp/static-grid/tests.html
git -C /Users/sergiop/Dropbox/Teaching/Projects/E510 commit -m "Add ECON 510 GameTreeApp: static-grid tests for builder/shuffle/specs"
```

---

## Task 9: Manual visual verification

No code changes. Eyeball-test the rendered output and confirm exam-readiness.

- [ ] **Step 9.1: Open the grid**

Start the server if needed and open `http://localhost:8000/static-grid/index.html` in Chrome.

- [ ] **Step 9.2: Verify each of the 12 cells**

Open the answer-key `<details>` block at the bottom and walk through each cell against its label. For each cell, confirm:
- The structure is identical (3 P1/P2 nodes plus 4 leaves with the same payoffs everywhere).
- The U/D edge labels are present on all 6 edges.
- The red edges match the spec for that cell:
  - **Strategy profiles (3 red edges):** one red edge from root, one from `n0_0` (P2-after-U), one from `n0_1` (P2-after-D).
  - **Outcome paths (2 red edges):** one red edge from root, one from the matching P2 subgame node, both connected to form a root→leaf path. The other P2 subgame has zero red edges.

- [ ] **Step 9.3: Lock the seed**

If the layout looks good, copy the seed from the bottom of the page into the URL: `?seed=<N>`. Confirm reload preserves the same arrangement. (If you don't like the arrangement, hit "Re-roll" until you do, then lock.)

- [ ] **Step 9.4: Capture the composite PNG**

Collapse the `<details>` block. In Chrome:
- Cmd+Shift+P → type "screenshot" → choose "Capture full size screenshot"
- File saves to Downloads. Open it and confirm the grid is sharp and all cells are present.

Optional alternative for vector quality: Cmd+P → "Save as PDF" → landscape orientation.

- [ ] **Step 9.5: Note the locked seed in a small README (optional)**

If you want to record the locked seed for future reference, append a line like `Locked seed for exam: 1234567890` to a new `static-grid/README.md`. Skip if unneeded.

- [ ] **Step 9.6: Final commit (if README added)**

```bash
git -C /Users/sergiop/Dropbox/Teaching/Projects/E510 add GameTreeApp/static-grid/README.md
git -C /Users/sergiop/Dropbox/Teaching/Projects/E510 commit -m "Update ECON 510 GameTreeApp: record locked seed for static-grid"
```

---

## Done criteria

- 12-cell grid renders cleanly at `http://localhost:8000/static-grid/index.html`.
- All 12 trees structurally identical; only red-edge sets differ.
- 8 cells show 3 red edges (strategy profiles), 4 show 2 red edges (outcome paths).
- Seed pinning via `?seed=` works; re-roll generates a fresh arrangement.
- Tests page is all green.
- Composite PNG/PDF can be captured cleanly with the answer key collapsed.
- `backward-induction/` is unchanged.

## Out of scope (per spec)

- No JSON-based authoring of additional games.
- No headless-Chrome batch script.
- No animations, transitions, or interactivity.
- No shared modules with `backward-induction/`.
