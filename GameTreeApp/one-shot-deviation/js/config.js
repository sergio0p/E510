// Single source of truth for tree sizes. The layout space (LAYOUT_W x LAYOUT_H)
// fixes where nodes go, and therefore how big a tree is on screen; everything
// drawn inside it (nodes, type, strokes) scales with NODE_R. The spacing rules of
// the layout passes are expressed in the same units, so they scale with it too.
//
// The backward-induction app uses NODE_R = 24; at the ~0.6x rendering scale of a
// full-width tree that left payoffs and labels near 9px. NODE_R = 34 (factor 1.4,
// the same scaling static-grid/ tested) keeps the trees' footprint and makes the
// type readable.

export const LAYOUT_W = 1400;
export const LAYOUT_H = 900;

export const NODE_R = 34;
const K = NODE_R / 24;              // scale relative to the original app

// Leaf discs are drawn larger than decision nodes so the payoffs, three
// numbers stacked in one disc for 3-player games, can use bigger type. The
// layout keeps spacing nodes by NODE_R, which is what sets the tree's size.
export const LEAF_R = 40;
export const radius = node => (node.isLeaf ? LEAF_R : NODE_R);

export const SPACING = {
  collision: 65 * K,                // minimum centre distance between non-adjacent nodes
  minGapFromObstacle: 30 * K,       // perpendicular-leaf breathing room
  defaultOffset: 125 * K,           // perpendicular-leaf offset when space is unlimited
  minSpacing: 80 * K,               // column redistribution: cramped below this
  maxSpacing: 250 * K,              //   ... excess above this
  targetSpacing: 120 * K,           //   ... ideal gap
};
