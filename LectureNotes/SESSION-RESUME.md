# Session Resume — Game Trees (2026-02-17)

## What Was Done

### 1. Risk Aversion Graph (choice-under-uncertainty.html)
- **Completed**: Replaced y-coordinate clamping with SVG `<clipPath>` for the utility curve
- Clip rectangle: `x=20, y=6, width=475, height=369` (extends to y=375, allowing curve to dip slightly below x-axis)
- The curve now cleanly disappears outside the plot area instead of drawing to clamped bounds

### 2. Game Tree — Frame 1 (dynamic-games.html)
- **Completed**: Replaced placeholder SVG with full General vs President game tree
- **Location**: Frame 1, `<section>` starting around line 26

#### Layout
- ViewBox: `0 0 1400 850`
- Node columns: G at x=200, P nodes at x=700, Terminal nodes at x=1200
- Vertical: G at y=425 (center), P1 at y=225, P2 at y=625, T1-T4 spread at y=125,325,525,725
- Node radius: r=56 (doubled from 28; originally 24 from spec, +15%, then 2×)
- Font sizes: node labels 46, edge labels 30, payoff text 36
- Edges shortened ~15%: start/end pulled in by ~33px extra per side
- Terminal divider lines: x±42, payoff text ±24 from center

#### SVG Structure (designed for reuse)
```
<g id="gt1-tree">
  <g id="gt1-sub-upper">   ← Upper subgame (P1 → T1, T2) — self-contained
    edges, labels, P1 node, T1 node, T2 node
  </g>
  <g id="gt1-sub-lower">   ← Lower subgame (P2 → T3, T4) — self-contained
    edges, labels, P2 node, T3 node, T4 node
  </g>
  <g id="gt1-root-edges">  ← Root edges (G→P1, G→P2) + labels
  </g>
  <g id="gt1-node-G">      ← G decision node (drawn on top)
  </g>
</g>
```

All elements have unique IDs (e.g., `gt1-e-P1-T1`, `gt1-e-G-P2`) for GSAP targeting.

#### SVG Specs Used
- Decision nodes: colored circles with drop shadow (`#DC2626` red for G/P1, `#16A34A` green for P/P2)
- Terminal nodes: split circles (`#E5E7EB` fill, `#9CA3AF` stroke) with horizontal divider, payoff numbers above/below
- Edges: Quadratic Bézier with 15% vertical offset, arrowhead markers
- Edge labels: STIX Two Text/Times New Roman, positioned above upward edges and below downward edges
- Defs: `#gt-shadow` filter, `#gt-arrow` marker

## What Comes Next — Animation Plan

The user wants a **scroll-triggered animation** (likely for Frame 5: SPE) with this sequence:

1. **Step 1**: Show the full game tree (same structure as Frame 1)
2. **Step 2**: Subgames are **copied** (not removed) from the tree and animated/moved to a separate area — originals remain in the full tree
3. **Step 3**: Highlight the SPNE path in red (optimal edges)

**Key constraint**: Subgames do NOT explode/decompose — they stay as intact sub-trees when copied out.

**Why subgames are grouped in `<g>`**: So they can be cloned in JS and animated with GSAP to a new position while originals stay in place.

### TikZ Source for SPE Frame (lines 445-498)
The SPE decomposition TikZ has:
- Full tree (left) with shorter labels: "nuke"/"don't" and "n"/"d"
- `<2>`: Blue dashed ellipse around upper subgame + arrow to upper-right subgame copy
- `<3>`: Blue dashed ellipse around lower subgame + arrow to lower-right subgame copy
- Upper right: P → n (red optimal) / d, payoffs (3,-1) / (-2,-2)
- Lower right: P → n / d (red optimal), payoffs (0,-3) / (-1,3)
- Bottom: reduced game G → nuke (red) to (3,-1) / don't to (-1,3)

### Implementation Notes
- The animation should use GSAP (already loaded on page) with ScrollTrigger pinning
- Clone subgame `<g>` groups in JS, animate clones from original position to side area
- Then change edge stroke colors to red for SPE path
- Overlay system is already set up in the page's bottom script

## Files Modified This Session
- `choice-under-uncertainty.html` — clipPath added, clamp removed
- `dynamic-games.html` — Frame 1 placeholder replaced with full game tree SVG

## Reference Files
- `GAME-TREE-SPECS.md` — Full SVG rendering spec (nodes, edges, colors, layout)
- `E510_LEC_SPR26.tex` lines 364-395 — Simple tree TikZ
- `E510_LEC_SPR26.tex` lines 445-498 — SPE decomposition TikZ
