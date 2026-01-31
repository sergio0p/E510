# Phase 3: Explosion + Contraction Animations

## Overview

Phase 3 completes the backward induction visualization by animating the resolution of solved frontier nodes. After users correctly identify all optimal edges in a frontier, the non-optimal branches explode into particles while the optimal leaf contracts back to replace its parent. This process repeats until the root node is reached.

---

## Core Animation Sequence

For each solved frontier node, the following sequence plays:

### Phase 1: Black Ink Fill (0.3s)
All nodes in non-optimal subtrees turn completely black, covering payoffs and player numbers. This "marks for death" effect signals which parts of the tree will be eliminated.

### Phase 2: Explosion (2.5s)
Non-optimal edges and subtrees explode into black particles that scatter and fade:
- 20 particles per node
- 4 particles per 5 points along each edge
- Particles fly outward 20-60px in random directions
- Black color palette: `#000000`, `#1F1F1F`, `#3F3F3F`
- Elements fade to opacity 0 during explosion

### Phase 3: Contraction (1.0s)
The optimal leaf moves toward its parent along the shrinking red edge:
- **Dynamic path recalculation**: Edge path updates every frame
- Edge physically contracts as leaf approaches parent
- Arrowhead stays at moving leaf throughout
- Edge only fades out at the very end (last 15%)
- Parent node fades out as leaf arrives

### Phase 4: Replacement (instant)
- Parent node data replaced with optimal child's payoffs
- Parent becomes new terminal node
- Old SVG elements removed
- New terminal node rendered at parent's position

### Phase 5: Pause Between Nodes (2.0s)
Brief pause before animating next node in frontier (if multiple).

---

## Configuration Parameters

```javascript
const CONFIG = {
  particleCount: 20,
  particleColors: ['#000000', '#1F1F1F', '#3F3F3F'],
  explosionDuration: 2.5,
  explosionSpread: 60,
  contractionDuration: 1.0,
  pauseBetweenNodes: 2.0,
  blackFillDuration: 0.3
};
```

**Note**: All durations calibrated for 0.2x playback speed (5x slower than normal). Original intended speeds:
- Explosion: 0.5s → 2.5s (at 0.2x)
- Contraction: 0.2s → 1.0s (at 0.2x)
- Black fill: 0.06s → 0.3s (at 0.2x)

---

## Dynamic Edge Contraction

The contraction phase uses GSAP's `onUpdate` callback to recalculate edge paths every frame:

```javascript
tl.to(leafPos, {
  x: node.x,
  y: node.y,
  duration: CONFIG.contractionDuration,
  ease: "power2.inOut",
  onUpdate: () => {
    // Update leaf position
    optimalNodeGroup.setAttribute('transform', `translate(${leafPos.x}, ${leafPos.y})`);

    // Recalculate edge from parent to current leaf position
    const paths = calculateEdgePaths(node.x, node.y, leafPos.x, leafPos.y);
    mainPath.setAttribute('d', paths.mainPath);
    taperPath.setAttribute('d', paths.taperPath);
  }
});
```

### Edge Path Calculation

The `calculateEdgePaths()` function maintains the same curve shape and split-path taper as the static edges:

**Vertical edges:**
- Straight line from parent to leaf
- Split at 90% (main) / 10% (taper)

**Horizontal edges:**
- Quadratic Bézier curve
- Split at 97% (main) / 3% (taper)
- 15% vertical offset for natural curve

As the leaf moves closer, the edge literally gets shorter while maintaining its proper shape and arrowhead positioning.

---

## Multi-Round Flow

After all nodes in a frontier are animated:

1. **Update frontier**: Recalculate which nodes are now frontier nodes
2. **Check completion**:
   - If frontier exists → transition back to interaction phase, set up new clickable edges
   - If no frontier (root reached) → game complete

```javascript
onAllAnimationsComplete: () => {
  gameState.frontierNodes = updateFrontier(state.allNodes);

  if (gameState.frontierNodes.length > 0) {
    gameState.phase = 'interaction';
    setupInteraction();
  } else {
    gameState.phase = 'complete';
  }
}
```

---

## File Structure

```
/backward-induction/
  index.html              (added GSAP CDN)
  style.css               (added particle styles)
  js/
    main.js               (animation triggers, frontier loop)
    tree-generator.js     (unchanged from Phase 2)
    tree-renderer.js      (particles layer, edge groups, updated interaction)
    game-logic.js         (unchanged from Phase 2)
    animations.js         (NEW - all GSAP animation logic)
  LAYOUT-ALGORITHM.md     (Phase 1 documentation)
  PHASE2-INTERACTION.md   (Phase 2 documentation)
  PHASE3-ANIMATIONS.md    (this file)
```

---

## Key Functions Reference

### animations.js

**`animateFrontierResolution(solvedNodes, state, callbacks)`**
- Sequential animation controller
- Processes nodes one at a time with pauses between
- Calls `onAllAnimationsComplete` when done

**`animateNodeResolution(node, state, onComplete)`**
- Main timeline for single node animation
- Orchestrates: black fill → explosion → contraction → replacement

**`createExplosionParticles(element, timeline, startTime)`**
- Generates 20 particles at node center
- Random directions and distances
- Animates to target position with fade out

**`createEdgeExplosionParticles(edgeGroup, timeline, startTime)`**
- Samples 5 points along edge path
- Creates 4 particles at each point (20 total)
- Same explosion behavior as node particles

**`calculateEdgePaths(x1, y1, x2, y2)`**
- Recalculates main and taper paths between two points
- Maintains split-path structure for consistent appearance
- Returns `{ mainPath, taperPath }` as SVG path strings

**`replaceParentWithLeaf(parentNode, optimalChild, state)`**
- Updates data structure: parent becomes terminal node
- Inherits optimal child's payoffs
- Removes old SVG elements
- Updates state arrays (allNodes, allLeaves)
- Renders new terminal node

**`renderReplacementLeaf(node)`**
- Creates SVG group for new terminal node
- Renders grey circle with payoff dividers
- Displays inherited payoffs

**`getSubtreeNodes(node)`**
- Recursively collects all node IDs in subtree
- Used for black fill phase

**`getSubtreeElements(node)`**
- Recursively collects all element IDs (nodes, edges, labels)
- Used for fade-out during explosion

---

## SVG Structure Changes

### Added Particles Layer

```html
<svg id="tree-svg">
  <defs>...</defs>
  <g id="edges-layer"></g>
  <g id="particles-layer"></g>  <!-- NEW -->
  <g id="nodes-layer"></g>
</svg>
```

**Purpose**: Isolated layer for explosion particles
- Sits between edges and nodes (z-index)
- Prevents particles from interfering with interactions
- Easy to target for particle creation/removal

### Edge Grouping

Before Phase 3:
```html
<path class="edge-hit" id="edge-hit-1-2" .../>
<path class="edge-main" id="edge-main-1-2" .../>
<path class="edge-taper" id="edge-taper-1-2" .../>
```

After Phase 3:
```html
<g id="edge-1-2" data-parent-id="1" data-child-index="0">
  <path class="edge-hit" .../>
  <path class="edge-main" .../>
  <path class="edge-taper" .../>
</g>
```

**Benefits:**
- Single ID lookup instead of three separate elements
- GSAP can animate entire group's opacity
- Easier to fade out all components together
- `querySelector()` finds paths within group

### Edge Label IDs

```html
<text id="edge-label-1-2" ...>a</text>
```

Labels now have IDs so they can be:
- Faded out during explosions
- Faded out during contraction
- Removed during cleanup

---

## Interaction Function Updates

All three interaction functions in `tree-renderer.js` were updated to work with the new group-based structure:

### setupClickableEdges()
```javascript
// Before: Direct ID lookup
const hitArea = document.getElementById(`edge-hit-${node.id}-${child.id}`);

// After: Group lookup + querySelector
const edgeGroup = document.getElementById(`edge-${node.id}-${child.id}`);
const hitArea = edgeGroup.querySelector('.edge-hit');
```

### markEdgeOptimal()
Same pattern - find group, then query within it for hit area, main path, taper path.

### shakeEdge()
Same pattern - find group, query for paths, apply shake animation.

---

## CSS Additions

```css
/* Particles (used in explosion animations) */
.particle {
  pointer-events: none;
}
```

Ensures explosion particles don't interfere with mouse events or clickable edges.

---

## Design Decisions

### Why Black Ink Before Explosion?

**Visual narrative:** The sequence tells a story:
1. "Mark these branches for elimination" (black fill)
2. "Destroy marked branches" (explosion)
3. "Consolidate optimal path" (contraction)

**Contrast:** Black particles against white background are more dramatic than grey.

**Clarity:** Brief moment of black marking gives user time to register which parts will explode.

### Why Dynamic Edge Contraction?

**Alternatives considered:**
1. Fade out edge immediately → leaf floats awkwardly through empty space
2. Keep edge static → visually disconnected from leaf movement
3. Stroke dash animation → doesn't maintain proper arrowhead positioning

**Dynamic path benefits:**
- Leaf visually "travels along" the edge
- Edge physically shrinks (not just fades)
- Arrowhead stays correctly positioned at moving leaf
- Reinforces the concept of "pulling the optimal payoff back"

### Why Sequential Node Animation?

Processing nodes one at a time with pauses:
- **Clarity**: User can follow each step
- **Reduced chaos**: Multiple simultaneous explosions would be confusing
- **Natural pacing**: Matches human problem-solving (solve one decision at a time)

### Why No Pause Between Explosion and Contraction?

The `onUpdate` callback runs every frame during contraction, performing:
- DOM manipulation (setAttribute)
- Path recalculation (quadratic Bézier math)
- Multiple element updates

This computational overhead creates a natural buffer, making an explicit pause unnecessary.

---

## Game State Phases

```javascript
gameState.phase = 'interaction' | 'animating' | 'complete'
```

**interaction:**
- User clicks on frontier edges
- Hover effects active
- Visual feedback (red edges, shake animation)

**animating:**
- Animations playing
- No user interaction
- Sequential node resolution

**complete:**
- Root reached
- No more frontiers
- Backward induction finished

---

## Performance Considerations

### Frame-by-Frame Updates

The contraction phase updates the DOM every frame (typically 60fps):
- 2 `setAttribute()` calls per frame (transform + path)
- Path string generation (quadratic Bézier calculations)
- ~60-120 updates per 1-second contraction

**Optimization opportunities:**
- Could use `transform` CSS instead of attribute
- Could reduce update frequency (every 2-3 frames)
- Could pre-calculate path keyframes

Current performance is acceptable for typical game trees (20-30 nodes).

### Particle Count

20 particles per node × typical frontier of 3-5 nodes = 60-100 particles.

Each particle:
- Creates SVG circle element
- Animates position and opacity
- Self-removes on completion

Memory usage is transient - particles are garbage collected after animation.

---

## Testing Checklist

### Animation Flow
- [x] Black ink fills non-optimal nodes before explosion
- [x] Payoffs disappear under black ink
- [x] Particles explode outward in random directions
- [x] Particles use black color palette
- [x] Edge labels fade out during explosion
- [x] Optimal leaf moves toward parent
- [x] Edge contracts dynamically with leaf movement
- [x] Arrowhead stays at leaf throughout contraction
- [x] Parent node fades as leaf arrives
- [x] New terminal node appears at parent position
- [x] Pause between multiple frontier nodes

### Multi-Round
- [x] New frontier calculated after animations
- [x] Interaction re-enabled for next frontier
- [x] Process continues until root reached
- [x] Game completes when no frontier remains

### Edge Cases
- [x] Multiple children (2-3) per frontier node
- [x] Perpendicular (vertical) edge contraction
- [x] Horizontal (curved) edge contraction
- [x] Deep subtree explosions (recursive)
- [x] Simultaneous multi-node frontiers

---

---

## Phase 4: Growth Replay Animation

After backward induction completes (root is reached), the application automatically plays a replay animation showing the tree growing back to its original structure. This helps students visualize the complete game tree and the Subgame Perfect Nash Equilibrium (SPNE) path.

### Timing and Flow

1. **Completion pause (2.0s)**: After root is reached, brief pause
2. **Growth animation**: Tree grows back level by level in reverse order of contraction
3. **Level pause (1.0s)**: Pause between each growth level
4. **Growth speed**: 0.5s per level (half the contraction speed - faster)

### Visual Representation

**SPNE Path (Optimal Edges):**
- Color: Red (#DC2626)
- Stroke width: 3px
- Red arrowhead marker

**Non-Optimal Edges:**
- Color: Grey (#374151)
- Stroke width: 2px
- Standard grey arrowhead marker

### Key Implementation Details

#### 1. Original Tree Preservation

Before any contractions begin, the original tree is deep-copied:

```javascript
gameState.originalTreeData = deepCopyTree(root);
```

This preserves:
- All node positions (x, y)
- All payoffs
- Full tree structure including perpendicular leaves
- Player assignments

#### 2. Contraction History Recording

Each frontier level is recorded before contraction:

```javascript
const frontierRecord = solvedNodes.map(node => ({
  nodeId: node.id,
  children: node.children.map(child => ({
    id: child.id,
    x: child.x,
    y: child.y,
    payoffs: child.payoffs ? [...child.payoffs] : null,
    isLeaf: child.isLeaf,
    player: child.player
  })),
  optimalChildIndex: node.optimalChildIndex,
  x: node.x,
  y: node.y,
  player: node.player
}));
gameState.contractionHistory.push(frontierRecord);
```

#### 3. SPNE Path Detection

At the start of growth animation, build a set of optimal edges:

```javascript
const spnePath = new Set();
contractionHistory.forEach(levelData => {
  levelData.forEach(nodeData => {
    const optimalChild = nodeData.children[nodeData.optimalChildIndex];
    const edgeKey = `${nodeData.nodeId}-${optimalChild.id}`;
    spnePath.add(edgeKey);
  });
});
```

#### 4. Node and Edge Restoration

For each parent being restored:

```javascript
originalParent.children.forEach((originalChild, childIndex) => {
  // Check if child already exists (was parent in previous level)
  let childNode = state.allNodes.find(n => n.id === originalChild.id);

  if (childNode) {
    // Existing node - restore opacity and color
    childNode.parent = parentNode;

    // Reset opacity (may have been faded during contraction)
    const existingGroup = document.getElementById(`node-${childNode.id}`);
    existingGroup.style.opacity = '1';

    // Reset leaf color (may have been filled black before explosion)
    if (childNode.isLeaf) {
      const circle = existingGroup.querySelector('circle');
      tl.to(circle, { fill: '#E5E7EB', duration: GROWTH_DURATION * 0.5 });
    }
  } else {
    // New node - create from scratch
    childNode = { ...originalChild, parent: parentNode, children: [] };
    renderChildForGrowth(childNode, parentNode, isOptimal);
  }

  // Check if edge is part of SPNE
  const edgeKey = `${parentNode.id}-${childNode.id}`;
  const isOptimal = spnePath.has(edgeKey);

  // Restore edge
  renderEdgeForGrowth(parentNode, childNode, childIndex, isOptimal);
});
```

#### 5. Handling Faded Elements

During contraction, non-optimal elements were set to `opacity: 0`. During growth, these must be restored:

**Nodes:**
- Reset `opacity: 1`
- Reset leaf circle fill from black (#000000) to grey (#E5E7EB)

**Edges:**
- Check if edge already exists in DOM
- If exists: reset opacity and update colors based on `isOptimal`
- If new: create from scratch with correct colors

**Edge Labels:**
- Reset opacity to 0 for animation fade-in

### Growth Animation Sequence

For each level (in reverse order of contraction):

1. **Restore parent as decision node**
   - Remove old leaf representation
   - Render colored circle with player number

2. **Grow all children**
   - Render child nodes at parent position (invisible initially)
   - Render edges as zero-length lines
   - Animate children moving to final positions (0.5s)
   - Animate edges growing from parent to children (0.5s)
   - Fade in edge labels (0.5s)

3. **Pause before next level** (1.0s)

### Critical Bug Fixes

**Problem 1: Missing Non-Optimal Edges**
- During contraction, non-optimal edges were faded to `opacity: 0` but never restored
- Solution: Check for existing edges and reset opacity in `renderEdgeForGrowth()`

**Problem 2: Black Leaf Nodes**
- Leaves filled with black before explosion remained black during growth
- Solution: Animate circle fill back to grey (#E5E7EB) for existing leaf nodes

**Problem 3: Missing Perpendicular Leaves**
- Initially iterated over `nodeData.children` (from contraction history)
- History only contains terminal children, not full tree structure
- Solution: Iterate over `originalParent.children` from deep-copied original tree

### Configuration

```javascript
const GROWTH_DURATION = 0.5; // Half of contraction speed
const PAUSE_BETWEEN_LEVELS = 1.0;
```

### Player Progression Rules

The tree generator now enforces proper player introduction:

1. **Root is always Player 1**
2. **Player 2 can only appear after Player 1 exists**
3. **Player 3 can only appear after Player 2 exists**
4. **Payoff dimensions match number of players:**
   - 2 players: 2-dimensional payoffs
   - 3 players: 3-dimensional payoffs

**Visual Rendering:**
- 2 players: 1 divider line, payoffs at y = [-10, 10]
- 3 players: 2 divider lines, payoffs at y = [-16, 0, 16]

---

## Summary

Phase 3 brings the backward induction algorithm to life through carefully choreographed animations. The black ink marking, particle explosions, and dynamic edge contraction create an intuitive visual representation of the elimination and consolidation process. By animating nodes sequentially and maintaining smooth transitions between phases, users can follow each step of backward induction from the terminal nodes all the way to the root.

After completion, the growth replay animation reconstructs the full game tree with the SPNE path highlighted in red, allowing students to see the complete solution in context of all possible paths.

The implementation balances visual impact (dramatic explosions, smooth contraction, clear SPNE highlighting) with performance (frame-by-frame updates, efficient particle management, DOM element reuse) and educational clarity (slow playback speed, sequential processing, clear phase transitions, proper player progression).
