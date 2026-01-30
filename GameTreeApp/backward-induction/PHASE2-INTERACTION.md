# Phase 2: Interactive Best Response Selection

## Overview

Phase 2 adds click interaction to the game tree, allowing users to identify best responses through trial and error. Users click on edges at "frontier" nodes (decision nodes whose children are all terminal), receiving immediate visual feedback for correct and incorrect choices.

---

## Core Concepts

### Frontier Nodes

A **frontier node** is a decision node where ALL children are leaves (terminal nodes). These represent the "bottom" of backward induction - the first decisions to be resolved.

**Identification criteria:**
- `node.isLeaf === false` (is a decision node)
- `node.children.every(child => child.isLeaf)` (all children are terminal)
- `!node.isSolved` (not yet resolved)

**Example:**
```
Player 1 (frontier)
├─ Leaf: (5, 3, -1)
└─ Leaf: (2, 7, 4)
```

### Best Response

For any frontier node, the **best response** is the child that maximizes the payoff for the player moving at that node.

**Algorithm:**
```javascript
function getBestResponseIndex(node) {
  const playerIndex = node.player - 1;  // 1,2,3 → 0,1,2

  let bestIndex = 0;
  let bestPayoff = node.children[0].payoffs[playerIndex];

  for (let i = 1; i < node.children.length; i++) {
    const payoff = node.children[i].payoffs[playerIndex];
    if (payoff > bestPayoff) {
      bestPayoff = payoff;
      bestIndex = i;
    }
  }

  return bestIndex;
}
```

**Uniqueness guarantee:** Since each player has unique payoffs across all leaves (enforced during generation), there's always exactly one best response.

---

## Visual Feedback System

### Edge States

Each edge can be in one of several states:

| State | Appearance | Behavior |
|-------|-----------|----------|
| **Default** | 2px gray stroke, 10×7 arrowhead | No interaction |
| **Clickable** | Cursor changes to pointer | 10px invisible hit area |
| **Hover** | 8px → 4px tapered stroke, 22×20 arrowhead | Triggered by 10px hit area |
| **Optimal (correct)** | 3px red stroke, red arrowhead | No hover, permanent |
| **Shake (wrong)** | 0.3s horizontal shake animation | Returns to clickable |

### Hit Area System

To improve clickability, each edge uses a **two-path rendering**:

1. **Invisible hit area**: 10px wide transparent stroke
   - Receives all mouse events (click, hover)
   - Makes edges easier to target

2. **Visible edge paths** (split for taper effect):
   - **Main path** (97% horizontal, 90% vertical): Full thickness on hover
   - **Taper path** (3% horizontal, 10% vertical): Reduced thickness near arrow
   - `pointer-events: none` (don't receive mouse events)

**Rationale:** Without the hit area, users would need to click precisely on a 2px line. The 10px zone provides 5x more target area while keeping visual appearance clean.

### Hover Taper Effect

On hover, the edge puffs to 8px for most of its length, then tapers to 4px near the arrowhead:

**Parameters:**
- `SPLIT_POINT_HORIZONTAL = 0.97` (97% thick, 3% taper)
- `SPLIT_POINT_VERTICAL = 0.90` (90% thick, 10% taper)

**Why different values?**
- Horizontal edges: 200-400px long → minimal taper (3%)
- Vertical edges: ~74px long → longer taper (10%) to keep arrow visible

**Implementation:** Split the edge path into two segments at the split point, apply different `stroke-width` on hover.

---

## Interaction Flow

### 1. Initialization

On page load or "New Game" click:

```javascript
// Reset all nodes
allNodes.forEach(node => {
  node.isSolved = false;
  node.optimalChildIndex = null;
});

// Identify initial frontier
gameState.frontierNodes = updateFrontier(allNodes);

// Set up click handlers on frontier edges
setupClickableEdges(frontierNodes, handleClick);
```

### 2. User Hovers Over Edge

```
Mouse enters 10px hit area
  ↓
Hit area onmouseenter fires
  ↓
Main path: stroke-width → 8px
Taper path: stroke-width → 4px
Taper path: marker-end → url(#arrowhead-hover)  [22×20px]
```

### 3. User Clicks Edge

```
Click on hit area
  ↓
handleEdgeClick(parentNode, childIndex, gameState, callbacks)
  ↓
Compare with getBestResponseIndex(parentNode)
  ↓
┌─────────────────────┬─────────────────────┐
│ Correct             │ Wrong               │
├─────────────────────┼─────────────────────┤
│ Mark as solved      │ Shake animation     │
│ Turn edge red       │ 0.3s duration       │
│ Disable all edges   │ Return to clickable │
│ Check if complete   │                     │
└─────────────────────┴─────────────────────┘
```

### 4. Correct Answer Flow

```javascript
onCorrect: (node, index) => {
  // Mark node as solved
  node.isSolved = true;
  node.optimalChildIndex = index;

  // Visual feedback: red edge
  markEdgeOptimal(node.id, child.id, node);

  // Disable hover on all sibling edges
  // (Prevents puffing after node is solved)

  // Check frontier completion
  if (allFrontierNodesSolved) {
    onFrontierComplete();
  }
}
```

### 5. Wrong Answer Flow

```javascript
onWrong: (node, index) => {
  // Shake animation (0.3s)
  shakeEdge(node.id, child.id);

  // Edge remains clickable after shake
  // User can try again
}
```

---

## Game State Management

### State Object

```javascript
const gameState = {
  root: null,              // Root node of tree
  allNodes: [],            // All nodes (flat array)
  allLeaves: [],           // All terminal nodes
  frontierNodes: [],       // Current frontier (clickable)
  phase: 'interaction'     // Current phase
};
```

### Node Properties

Each node tracks its solution state:

```javascript
{
  isSolved: false,         // Has user selected optimal child?
  optimalChildIndex: null  // Which child is optimal (0, 1, or 2)
}
```

---

## File Structure

```
/backward-induction/
  index.html              (unchanged from Phase 1)
  style.css               (added interaction styles)
  js/
    main.js               (added game state, interaction setup)
    tree-generator.js     (unchanged from Phase 1)
    tree-renderer.js      (split-path rendering, hover, optimal marking)
    game-logic.js         (NEW - frontier, best response, click handling)
  LAYOUT-ALGORITHM.md     (Phase 1 documentation)
  PHASE2-INTERACTION.md   (this file)
```

---

## Key Parameters Reference

### Visual Feedback

| Parameter | Value | Purpose |
|-----------|-------|---------|
| `HIT_AREA_WIDTH` | 10px | Invisible clickable zone width |
| `NORMAL_STROKE` | 2px | Default edge thickness |
| `HOVER_MAIN_STROKE` | 8px | Main path thickness on hover |
| `HOVER_TAPER_STROKE` | 4px | Taper path thickness on hover |
| `OPTIMAL_STROKE` | 3px | Red edge thickness when correct |
| `SHAKE_DURATION` | 300ms | Wrong answer animation time |
| `SHAKE_DISTANCE` | 4px | Horizontal shake amplitude |

### Arrowheads

| Marker | Width × Height | Usage |
|--------|---------------|-------|
| `arrowhead` | 10px × 7px | Default state |
| `arrowhead-hover` | 22px × 20px | Hover state |
| `arrowhead-red` | 10px × 7px | Optimal (correct) edge |

### Split Points (Taper)

| Edge Type | Split Point | Main % | Taper % |
|-----------|------------|--------|---------|
| Horizontal | 0.97 | 97% | 3% |
| Vertical | 0.90 | 90% | 10% |

---

## CSS Classes

### Edge States

```css
.edge-hit.clickable
  - Applied to: Hit area paths on frontier edges
  - Effect: Cursor pointer

.edge-main.hover
  - Applied to: Main path during hover
  - Effect: 8px stroke width

.edge-taper.hover
  - Applied to: Taper path during hover
  - Effect: 4px stroke width

.edge.optimal
  - Applied to: Both paths when correct
  - Effect: Red stroke (3px), pointer-events none

.edge.shake
  - Applied to: Both paths when wrong
  - Effect: Horizontal shake animation
```

---

## Algorithms

### Frontier Detection

```javascript
function updateFrontier(allNodes) {
  return allNodes.filter(node => {
    if (node.isLeaf) return false;
    if (node.isSolved) return false;
    return node.children.every(child => child.isLeaf);
  });
}
```

**Complexity:** O(n×k) where n = nodes, k = children per node (2-3)

### Best Response Calculation

```javascript
function getBestResponseIndex(node) {
  const playerIndex = node.player - 1;
  let bestIndex = 0;
  let bestPayoff = node.children[0].payoffs[playerIndex];

  for (let i = 1; i < node.children.length; i++) {
    const payoff = node.children[i].payoffs[playerIndex];
    if (payoff > bestPayoff) {
      bestPayoff = payoff;
      bestIndex = i;
    }
  }

  return bestIndex;
}
```

**Complexity:** O(k) where k = children (2-3), effectively O(1)

### Split Path Rendering

**Vertical edges (straight):**
```javascript
const splitY = startY + (endY - startY) * SPLIT_POINT_VERTICAL;
mainPath = `M ${x} ${startY} L ${x} ${splitY}`;
taperPath = `M ${x} ${splitY} L ${x} ${endY}`;
```

**Horizontal edges (quadratic Bézier):**
```javascript
// Split at parametric t
const t = SPLIT_POINT_HORIZONTAL;
const splitX = (1-t)² * startX + 2(1-t)t * midX + t² * endX;
const splitY = (1-t)² * y1 + 2(1-t)t * (midY - offset) + t² * y2;

// Control points for first segment
const mainCtrlX = (1-t) * startX + t * midX;
const mainCtrlY = (1-t) * y1 + t * (midY - offset);

mainPath = `M ${startX} ${y1} Q ${mainCtrlX} ${mainCtrlY} ${splitX} ${splitY}`;
// (similar for taper path)
```

---

## Design Decisions

### Why Split Path Instead of Single Path?

**Attempted alternatives:**
1. **Stroke gradient**: Can only control color/opacity, not width
2. **Custom taper shape**: Complex polygon math, no longer compatible with markers
3. **Reduce overall hover size**: Lost dramatic puff effect on short vertical edges

**Split path benefits:**
- Simple linear interpolation for straight edges
- Standard quadratic Bézier split for curves
- Clean separation of concerns (main vs taper)
- Arrowhead remains visible even on thick edges

### Why Disable Hover After Correct Answer?

Once a node is solved, the other edges become irrelevant - the optimal path has been identified. Continuing to allow hover creates confusion:
- "Can I still click this?"
- "Is this interactive or not?"

Removing all interaction (hover + click) clearly signals "this decision is finished."

### Why 10px Hit Area?

**Tested values:**
- **5px**: Still requires precision, minimal improvement
- **10px**: Sweet spot - easy to target without overlapping adjacent edges
- **15-20px**: Collisions between parallel edges in dense regions

On typical game trees with 80-120px between edges, 10px provides comfortable targeting without false positives.

---

## Future Enhancements (Phase 3+)

Phase 2 establishes the interaction foundation. Planned features:

1. **Explosion animation**: Leaf nodes "explode" and disappear after correct answer
2. **Contraction animation**: Remaining edges contract, optimal payoff rises to parent
3. **Node replacement**: Parent becomes new terminal node with inherited payoff
4. **Frontier update**: Recalculate frontier after contraction
5. **Multi-round**: Continue until root is reached (complete backward induction)

---

## Testing Checklist

### Frontier Identification
- [x] Console logs frontier nodes after generation
- [x] Only decision nodes included
- [x] Only nodes with all-leaf children included
- [x] Solved nodes excluded

### Click Interaction
- [x] Hover changes cursor to pointer
- [x] Hover puffs edge (8px → 4px taper)
- [x] Hover enlarges arrowhead (22×20px)
- [x] Wrong click shakes edge (0.3s)
- [x] Correct click turns edge red
- [x] Correct click disables sibling edges
- [x] Console logs correct/wrong feedback

### Visual Quality
- [x] 10px hit area improves targeting
- [x] Taper prevents arrowhead from being obscured
- [x] Vertical edges use 90% split (longer taper)
- [x] Horizontal edges use 97% split (minimal taper)
- [x] Shake animation smooth and noticeable
- [x] Red edges remain visible after marking

### Game State
- [x] "New Game" resets all interaction state
- [x] Frontier updates after solving all nodes
- [x] Console shows "🎉 All frontier nodes solved!"

---

## Summary

Phase 2 transforms the static game tree from Phase 1 into an interactive learning tool. Through visual feedback (hover, shake, red edges) and intelligent hit detection (10px zones, split-path tapering), users can explore backward induction concepts hands-on.

The foundation is now in place for Phase 3's animation system, which will complete the backward induction loop by updating the tree structure after each correct answer.
