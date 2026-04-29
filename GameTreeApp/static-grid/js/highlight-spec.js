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
