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
