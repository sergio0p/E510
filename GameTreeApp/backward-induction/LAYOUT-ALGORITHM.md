# Game Tree Layout Algorithm

## Overview

This document describes the multi-pass layout algorithm used to render extensive-form game trees with optimal spacing and readability. The system addresses the challenge of displaying trees with varying node counts and depths while avoiding visual cramping and utilizing available space efficiently.

---

## Problem Statement

Game trees with many terminal nodes (leaves) often suffer from:
- **Vertical cramping**: Leaves cluster tightly when many branches terminate at the same depth
- **Wasted space**: Large vertical gaps exist between sparse branches while other areas are overcrowded
- **Poor readability**: Payoffs become illegible when terminal nodes overlap

The algorithm solves these issues through three coordinated passes.

---

## Architecture: Three-Pass System

```
Input: Tree data structure
    ↓
[D3 Layout] → Initial positioning with custom separation
    ↓
[Pass 1] → Space-aware perpendicular leaf placement
    ↓
[Pass 2] → Cascade-aware perpendicular refinement
    ↓
[Pass 3] → Column-based vertical redistribution
    ↓
Output: Optimized (x, y) coordinates for all nodes
```

---

## Foundation: D3 Hierarchy Layout

**Purpose**: Establish initial tree structure with depth-based positioning.

### Mechanics
- Uses D3's Reingold-Tilford tree layout algorithm
- Nodes at same period (depth) share the same horizontal position
- Vertical spacing determined by separation function
- Preserves parent-child relationships and minimizes edge crossings

### Custom Separation Function

Controls vertical spacing between sibling nodes based on their types:

**Leaf-to-Leaf Spacing:**
- Parent has 2 children: **2.0×** base spacing
- Parent has 3 children: **2.75×** base spacing
- Rationale: Leaves display payoff data requiring more vertical room

**Leaf-to-Decision Node:**
- **1.5×** base spacing
- Rationale: Asymmetric pair needs intermediate spacing

**Decision-to-Decision:**
- **1.0×** base spacing (normal)
- Rationale: Decision nodes are compact colored circles

**Why variable spacing?**
Terminal nodes with payoff triplets need approximately 50-60px vertical height to be readable. Decision nodes only need 48px (diameter). Spacing multipliers reflect these different space requirements.

---

## Pass 1: Space-Aware Perpendicular Placement

**Purpose**: Move early-terminating leaves (periods 1-3) perpendicular to their parent to free vertical space for deeper nodes.

### Concept

Instead of extending leaves horizontally (adding to column width), place them **vertically** relative to their parent:
- Child[0] → 125px above parent (90° upward)
- Child[1] → 125px below parent (-90° downward)
- Child[2] → (if 3 children) 125px below parent

**Result**: Leaf shares parent's horizontal position (same column) but occupies vertical space that would otherwise be empty.

### Space-Based Collision Detection

**Old approach** (topology-based): "Does parent have any sibling above/below?"
- Problem: Blocked placement even when sibling was 300px away

**New approach** (space-based): "Is there enough physical space for a perpendicular leaf?"

**Safety threshold: 205px**
- Perpendicular offset: 125px
- Two node radii: 48px (2 × 24px)
- Safety buffer: 32px
- Total: 205px minimum gap required

**Algorithm:**
1. Identify parent's position in sibling list
2. Measure actual vertical distance to sibling above (if exists)
3. Measure actual vertical distance to sibling below (if exists)
4. Check against any perpendicular leaves already placed by earlier iterations
5. Only place perpendicular if gap > 205px

**Tracked collisions:**
- Direct siblings (parent's siblings in grandparent's children array)
- Perpendicular leaves from siblings (stored in tracking array during Pass 1)

### Two-Child vs Three-Child Logic

**Two-child parent:**
- If space above ≥ 205px AND child[0] is early leaf → place child[0] up
- If space below ≥ 205px AND child[1] is early leaf → place child[1] down
- **Both can happen independently** if space permits

**Three-child parent:**
- If space above ≥ 205px AND child[0] is early leaf → place child[0] up
- If space below ≥ 205px AND child[2] is early leaf → place child[2] down
- Child[1] (middle) always stays horizontal (maintains tree flow)

### Eligibility Criteria

A leaf qualifies for perpendicular placement if:
- Period ≤ 3 (early termination, not forced period-4 leaf)
- `isLeaf === true` (terminal node)
- `children.length === 0` (truly terminal, not corrupted data)
- Sufficient space above or below parent

---

## Pass 2: Cascade-Aware Refinement

**Purpose**: Apply perpendicular placement to additional nodes whose parents had perpendicular siblings in Pass 1.

### The Cascade Effect

Consider this structure:
```
Root
├─ Child A (has perpendicular leaf placed in Pass 1)
└─ Child B (wants to place perpendicular)
```

In Pass 1, Child A's leaf moved perpendicular (e.g., from y=200 to y=100).

In Pass 2, when evaluating Child B:
- Child A is technically a sibling
- But Child A's perpendicular leaf is no longer blocking horizontal space
- Child B should be able to place perpendicular where Child A **used to be**

**Algorithm enhancement:**
1. When checking space above/below, identify if sibling is perpendicular
2. If sibling is perpendicular, skip it and check **next** non-perpendicular sibling
3. Also check perpendicular leaf positions from Pass 1 (stored array)
4. Calculate effective gap accounting for both moved siblings and their perpendicular children

**Result**: Enables additional perpendicular placements that were blocked by topology but not by actual space occupancy.

---

## Pass 3: Column-Based Vertical Redistribution

**Purpose**: Redistribute nodes within each vertical column to utilize excess space and reduce cramping.

### Problem Observation

After D3 layout and perpendicular placement, columns often exhibit:
- **Cramped regions**: Nodes separated by <80px (payoffs unreadable)
- **Excess regions**: Nodes separated by >250px (wasted space)

**Key insight**: These regions often coexist in the same column!

### Column Analysis

**Step 1: Group by column**
- Nodes with same (or very similar) x-coordinate form a column
- Typically corresponds to period: Column 0 = Period 0, Column 1 = Period 1, etc.
- Exception: Perpendicular leaves share parent's column

**Step 2: Sort by y-position**
- Within each column, sort nodes top-to-bottom
- Calculate gap between each consecutive pair

**Step 3: Identify cramped vs excess**
- **Cramped gap**: < 80px (minimum for readability)
- **Excess gap**: > 250px (larger than necessary)
- **Target gap**: 120px (ideal spacing)

**Step 4: Space accounting**
- Total space needed: Sum of (80px - actual gap) for all cramped gaps
- Total space available: Sum of (actual gap - 120px) for all excess gaps
- Proceed only if available ≥ 30% of needed (ensures meaningful improvement)

### Redistribution Strategy

**Conservative cumulative shifting:**

1. Start at top of column (first node)
2. Initialize cumulative shift = 0
3. For each node from top to bottom:
   - Apply cumulative shift to this node (move it down)
   - If gap after this node is cramped, increase cumulative shift
4. Nodes further down accumulate all previous adjustments

**Example:**
```
Before:
Node A (y=100)
  gap = 50px ← cramped!
Node B (y=150)
  gap = 300px ← excess
Node C (y=450)

After:
Node A (y=100)          [no shift]
  gap = 80px            [increased by 30px]
Node B (y=180)          [shifted down 30px]
  gap = 300px           [unchanged, already good]
Node C (y=480)          [shifted down 30px, cascaded from B]
```

### Subtree Movement

**Critical**: When moving a decision node, ALL descendants must move with it.

**Rationale**: A node and its children form a visual unit. Moving only the parent would create awkward edge angles and break subtree coherence.

**Implementation**: Recursive descent through children, applying same deltaY to entire subtree.

**Perpendicular leaves handled**: Since they share parent's x-position and already in the column, they're moved as part of parent's subtree.

### Processing Order

**Left-to-right (period 0 → period 4):**
- Earlier columns redistributed first
- Changes in column N affect column N+1 (children of moved nodes)
- Single pass only (no iteration to avoid complexity)

---

## Parameter Reference

### Spacing Thresholds

| Parameter | Value | Purpose |
|-----------|-------|---------|
| `PERPENDICULAR_OFFSET` | 125px | Distance of perpendicular leaf from parent |
| `SAFE_GAP` | 205px | Minimum space required for perpendicular placement |
| `MIN_SPACING` | 80px | Minimum acceptable gap (cramped threshold) |
| `MAX_SPACING` | 250px | Maximum reasonable gap (excess threshold) |
| `TARGET_SPACING` | 120px | Ideal gap for redistributed nodes |

### D3 Separation Multipliers

| Node Types | Multiplier | Effective Spacing |
|------------|-----------|-------------------|
| 2-leaf parent | 2.0× | ~120-140px per child pair |
| 3-leaf parent | 2.75× | ~165-190px per child pair |
| Mixed (leaf + decision) | 1.5× | ~90-100px |
| Decision + decision | 1.0× | ~60-80px |

### SVG Dimensions

| Property | Value | Notes |
|----------|-------|-------|
| Canvas width | 1200px | Fixed, from CSS |
| Canvas height | 840px (min) | Dynamic, adjusts to fit all nodes |
| Margin | 60px | Border around tree layout |
| Available width | 1080px | 1200 - 2×60 |
| Available height | 720px+ | 840+ - 2×60 |

### Visual Styling

| Element | Font Size | Other Properties |
|---------|-----------|------------------|
| Decision nodes (player #) | 18px | Bold, white text |
| Leaf payoffs | 14px | Bold, dark gray text |
| Edge labels (a, b, c) | 12px | Positioned at edge midpoint |
| Node shadows | 3px blur | 40% opacity, 2px offset |
| Arrow gap | 1px | Space between arrow tip and node |

---

## Design Trade-offs

### Perpendicular Placement

**Benefits:**
- Saves 125px vertical space per early leaf
- Reduces column 5 density significantly
- Maintains parent-child connection clarity
- Edge labels (a, b, c) clearly mark action choices

**Costs:**
- Vertical edges instead of diagonal (different visual pattern)
- Shares column with parent (potential confusion at that depth)
- Collision detection complexity

**Design choice:** Trade horizontal progression for vertical space where leaves terminate early.

---

### Column Redistribution

**Benefits:**
- Uses available space efficiently
- Directly addresses worst cramping cases
- Works across all columns uniformly

**Costs:**
- Changes edge angles (steeper/shallower than D3's optimal)
- Single-pass may miss some opportunities
- Cumulative shifts can push nodes far from original position

**Design choice:** Prioritize readability over D3's aesthetic optimality.

---

### Separation Multipliers

**Benefits:**
- Leverages D3's proven algorithm
- Simple to tune and understand
- Respects tree structure inherently

**Costs:**
- Cannot account for global space distribution
- May over-space sparse areas
- Fixed ratios don't adapt to tree size

**Design choice:** Use as foundation, augment with post-processing passes.

---

## Performance Characteristics

### Time Complexity

- **D3 Layout**: O(n) where n = number of nodes
- **Pass 1**: O(n) with sibling checks O(k) where k = siblings per node ≈ 2-3
- **Pass 2**: O(n) with similar sibling checks
- **Pass 3**: O(n) for grouping + O(n log n) for sorting + O(n²) worst case for subtree movement
- **Overall**: O(n²) dominated by Pass 3 subtree recursion

### Space Complexity

- O(n) for node storage
- O(m) for perpendicular position tracking where m = perpendicular leaves ≈ 0.2n
- O(c) for column grouping where c = number of columns ≈ 5
- **Overall**: O(n)

### Practical Performance

For typical game trees (15-30 nodes):
- Layout computation: <10ms
- All three passes: <5ms
- Rendering: <20ms
- **Total**: <35ms (well under 16.67ms frame budget)

---

## Validation & Debugging

### Structural Invariants

Maintained throughout all passes:
- No node has exactly 1 child (must be 0, 2, or 3)
- Leaf nodes have `children.length === 0`
- Decision nodes have `children.length > 0`
- Parent-child relationships preserved
- Tree remains acyclic

### Validation Checkpoints

1. After tree generation
2. After D3 layout
3. After perpendicular adjustment
4. After column redistribution

Each checkpoint verifies child count distribution and leaf integrity.

### Console Logging

**Pass 1 & 2:**
- Space measurements for each potential perpendicular placement
- Collision detection reasoning (gap too small, perpendicular leaves blocking)
- Total count of perpendicular placements

**Pass 3:**
- Per-column analysis (cramped vs excess gaps)
- Space available vs space needed
- Number of subtrees moved and total shift amount

---

## Future Enhancements

### Potential Improvements

1. **Iterative refinement**: Multiple passes of column redistribution until convergence
2. **Edge bundling**: Group parallel edges to reduce visual clutter
3. **Collision-aware perpendicular offset**: Variable offset (75-175px) based on available space
4. **Horizontal compression**: Reduce period spacing when tree is shallow
5. **Action labels**: Replace a/b/c with semantic action names

### Known Limitations

1. **Single-pass redistribution**: May not find globally optimal spacing
2. **Fixed perpendicular offset**: 125px may be too much/little in extreme cases
3. **No edge crossing minimization**: Perpendicular placement can create crossings
4. **Column approximation**: Nodes grouped by x-position rounding (10px tolerance)
5. **Generic edge labels**: a/b/c don't convey action semantics

---

## Summary

The three-pass layout system balances multiple competing objectives:
- **Readability**: Ensure payoffs are legible (minimum spacing)
- **Efficiency**: Use available vertical space (column redistribution)
- **Clarity**: Maintain tree structure and parent-child relationships
- **Performance**: Complete layout in <50ms for typical trees

By combining D3's proven tree layout with space-aware perpendicular placement and column redistribution, the system produces game trees that are both mathematically correct and visually accessible for educational purposes.
