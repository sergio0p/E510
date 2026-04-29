# Static Grid Game-Tree Renderer — Design

**Date:** 2026-04-29
**Status:** Draft, awaiting user review
**Context:** ECON 510 exam preparation

## Goal

Render a single static composite image: a 4-column × 3-row grid of twelve mini extensive-form game trees, each labeled `a)` through `l)`. Each cell shows the same fixed 2×2 sequential game with a different set of red-highlighted edges. The composite is for an exam question that asks students to identify which highlighted patterns are valid Nash equilibria, the SPE, etc.

## Approach summary

Build a new sibling app `Projects/E510/GameTreeApp/static-grid/`, **duplicating** the relevant code from `backward-induction/` rather than refactoring the original to share modules. The two apps share no state; coupling them would force every future visual change in either to be regression-tested against the other. The original interactive app remains untouched.

## The fixed game

Sequential 2-player game. Notation: at every decision node, `U` = upper child, `D` = lower child.

```
                    P1
                  /     \
                 U       D
                /         \
              P2           P2
             / \           / \
            U   D         U   D
          (4,3)(1,1)    (3,4)(0,2)
```

Payoffs are `(P1, P2)` and are hand-set (not random).

### Three pure-strategy Nash equilibria

A strategy profile is `(P1's action, P2's action after P1=U, P2's action after P1=D)`.

| Profile | Outcome | SPE? | Why it survives |
|---|---|---|---|
| `(U, U, U)` | leaf `(4,3)` | **yes — SPE** | P2 best-responds at both subgames; P1 prefers U (4 > 3) |
| `(U, U, D)` | leaf `(4,3)` | no | Same outcome as SPE. Off-path threat `D` after P1=D non-credible (P2 prefers U: 4 > 2). Threat sustained because subgame unreached. |
| `(D, D, U)` | leaf `(3,4)` | no | Different outcome. Off-path threat `D` after P1=U non-credible (P2 prefers U: 3 > 1). Threat induces P1 to choose D (3 > 1). |

Verified by enumeration: exactly three of the eight strategy profiles are Nash; the other five fail because either P1 or P2 has a profitable on-path deviation.

## The 12 variations

Same tree, same payoffs in all 12. Each variation differs only in which edges are painted red.

### 8 strategy profiles — 3 red edges each

One red edge at each of the three decision nodes (root, P2-after-U, P2-after-D), corresponding to the action taken in that profile. All 2³ = 8 profiles are rendered.

### 4 outcome paths — 2 red edges each

The 4 root-to-leaf paths (`U→U`, `U→D`, `D→U`, `D→D`). Distractors: visually plausible but not proper strategy profiles since they don't specify P2's off-path action.

## Architecture

```
Projects/E510/GameTreeApp/
├── backward-induction/   (existing — untouched)
└── static-grid/          (new)
    ├── index.html
    ├── style.css
    └── js/
        ├── main.js
        ├── tree-builder.js
        ├── tree-renderer.js   (duplicated from backward-induction, stripped)
        ├── highlight-spec.js
        └── shuffle.js
```

### File roles

- **`tree-builder.js`** — replaces `tree-generator.js`. Hand-coded `buildGameTree()` returns a node graph in the same shape the renderer expects: each node has `{ id, player, period, actions, payoffs, children, parent, isLeaf, x, y }`. Leaves carry the four hand-set payoffs. Period structure: root=0, P2 nodes=1, leaves=2 (the original generator's "force leaf at period 4" rule does not apply).

- **`tree-renderer.js`** — duplicated verbatim from `backward-induction/js/tree-renderer.js`, then trimmed:
  - Keep: `computeLayout`, `adjustEarlyLeaves`, `redistributeColumns`, `renderTree`.
  - Remove: `setupClickableEdges`, `markEdgeOptimal`, `shakeEdge`, all GSAP imports, and the random-regenerate-on-collision retry loop in the caller (the fixed structure cannot collide).
  - Add: `applyHighlight(svg, redEdgeIds)` — a small helper (~20 lines) that finds edge `<path>` elements by id and applies the same red stroke style the original app uses.

- **`highlight-spec.js`** — the 12 variation specs. Each variation is `{ kind: 'profile' | 'path', label: string, redEdges: string[] }`. Edge IDs follow the convention `<parent-node-id>→<U|D>`.

- **`shuffle.js`** — Fisher-Yates seeded with mulberry32 PRNG (~30 lines, no dependencies).

- **`main.js`** — orchestrator. On page load:
  1. Reads `?seed=` from URL; if absent, generates one from `Math.random()`.
  2. Calls `buildGameTree()` once and clones it 12 times (one per cell).
  3. Shuffles the 12 variation specs using the seed.
  4. For each grid cell `a` … `l`:
     - Inserts a new `<svg>` plus the letter label.
     - Runs the layout passes on its tree clone.
     - Calls `renderTree()` then `applyHighlight()` with the corresponding spec's `redEdges`.
  5. Writes the seed to the page (URL hint + meta tag) and populates the collapsible answer-key `<details>` block.

- **`index.html`** — the grid page (CSS Grid: `repeat(4, 1fr) × repeat(3, 1fr)`).

- **`style.css`** — duplicated from the original, plus grid-specific styles (cell borders, letter labels, answer-key block).

### Edge labeling

Every edge displays either `U` or `D` (upper/lower child), matching the convention used in the game spec. Same labels at all three decision nodes.

## Shuffle / seed mechanism

The 12 variations get shuffled before being assigned to cells `a)` through `l)`. Required properties:

- **Truly random** on first load: seed comes from `Math.random()` if no URL param.
- **Reproducible** once a seed is locked: appending `?seed=<value>` to the URL fixes the arrangement, so the answer key remains valid across reloads and screenshots.
- **Re-rollable**: a small button on the page generates a new seed and reloads.

Algorithm: Fisher-Yates with a mulberry32 PRNG seeded from the URL or generated value.

The page displays the active seed near the bottom so the instructor can copy it into the URL to lock the chosen arrangement.

## Grid page layout

Single HTML page, CSS Grid `repeat(4, 1fr) × repeat(3, 1fr)`. Each cell:

- **Letter label** (`a)`, `b)`, …) top-left in bold.
- **One SVG** below the label, viewBox auto-fitted to that mini tree.
- Thin grey border.

Below the grid (instructor area, easy to crop out):

- Active seed value with copy hint (`?seed=12345`).
- Re-roll button.
- Collapsible `<details>` answer key listing `a) → (U,U,U) [SPE]`, etc., closed by default.

Layout tuned so the grid fits cleanly on a single Letter/A4 page in landscape orientation when print-to-PDF'd.

## PNG export workflow

No in-app save buttons or external scripts. The browser already does this well:

1. Open `static-grid/index.html` in Chrome.
2. Re-roll until satisfied; lock the seed by appending `?seed=<value>` to the URL.
3. Confirm the answer-key `<details>` block is collapsed.
4. Either:
   - DevTools → "Capture full size screenshot" (Cmd+Shift+P → "screenshot") for PNG, or
   - Cmd+P → Save as PDF for vector quality.

If a higher-resolution composite is needed later, per-cell SVG-save buttons + ImageMagick `montage` is a future extension.

## Out of scope

- No animations, transitions, or interaction in the static-grid app.
- No JSON/YAML authoring path for new games (the eventual generic authoring tool is a separate, future project).
- No headless-Chrome batch script.
- No changes to `backward-induction/`.
- No shared modules between the two apps.

## Open questions

None at design time. All clarifying questions answered in the brainstorming session.
