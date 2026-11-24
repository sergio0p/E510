// Random extensive-form games, adapted from backward-induction/js/tree-generator.js.
//
// Changes from the original:
//  - the number of players is chosen up front (1, 2 or 3) and every one of them
//    must move somewhere in the tree;
//  - with a single player, that player moves at every decision node, so moving
//    twice in a row is allowed. With two or three players, no player moves twice
//    in a row (the original rule).
// Branching probabilities, the depth limit and the payoff rule are unchanged.

const ACTION_PROBABILITIES = {
  1: { 0: 0.30, 2: 0.525, 3: 0.175 },
  2: { 0: 0.50, 2: 0.375, 3: 0.125 },
  3: { 0: 0.70, 2: 0.225, 3: 0.075 },
};

function makeNode(id, player, period, parent, isLeaf) {
  return {
    id, player, period, parent, isLeaf,
    actions: 0, payoffs: null, children: [], x: 0, y: 0,
  };
}

function pick(arr, rng) {
  return arr[Math.floor(rng() * arr.length)];
}

function weightedChoice(probabilities, rng) {
  const r = rng();
  let cumulative = 0;
  for (const [value, prob] of Object.entries(probabilities)) {
    cumulative += prob;
    if (r < cumulative) return parseInt(value, 10);
  }
  return parseInt(Object.keys(probabilities)[0], 10);
}

function shuffle(arr, rng) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function choosePlayer(parent, numPlayers, seen, rng) {
  if (numPlayers === 1) return 1;
  // Progression rule: Player k can enter only after Player k-1 has.
  let available = [];
  for (let p = 1; p <= numPlayers; p++) {
    if (p === 1 || seen.has(p - 1)) available.push(p);
  }
  available = available.filter(p => p !== parent.player);
  return pick(available, rng);
}

function expand(node, numPlayers, seen, rng) {
  for (let i = 0; i < node.actions; i++) {
    const childId = `${node.id}_${i}`;
    const period = node.period + 1;
    let child;

    if (period === 4) {
      child = makeNode(childId, null, period, node, true);
    } else {
      let actions;
      if (node.period === 0 && i === 0) {
        // The root's first child is always a decision node.
        const p2 = ACTION_PROBABILITIES[period][2];
        const p3 = ACTION_PROBABILITIES[period][3];
        actions = weightedChoice({ 2: p2 / (p2 + p3), 3: p3 / (p2 + p3) }, rng);
      } else {
        actions = weightedChoice(ACTION_PROBABILITIES[period], rng);
      }

      if (actions === 0) {
        child = makeNode(childId, null, period, node, true);
      } else {
        const player = choosePlayer(node, numPlayers, seen, rng);
        seen.add(player);
        child = makeNode(childId, player, period, node, false);
        child.actions = actions;
        expand(child, numPlayers, seen, rng);
      }
    }
    node.children.push(child);
  }
}

function collect(node, allNodes) {
  allNodes.push(node);
  node.children.forEach(c => collect(c, allNodes));
}

function assignPayoffs(leaves, numPlayers, rng) {
  const range = [];
  for (let v = -20; v <= 20; v++) range.push(v);
  leaves.forEach(l => { l.payoffs = []; });
  for (let p = 0; p < numPlayers; p++) {
    // Distinct values per player, so every player's preferences are strict
    // and the subgame perfect equilibrium is unique.
    const values = shuffle(range.slice(), rng).slice(0, leaves.length);
    leaves.forEach((leaf, i) => { leaf.payoffs[p] = values[i]; });
  }
}

// One attempt. Returns null when the draw misses the size window or leaves a
// player out; the caller retries.
export function generateTree(numPlayers, { minDecision = 3, maxDecision = 6 } = {}, rng = Math.random) {
  const seen = new Set([1]);
  const root = makeNode('n0', 1, 0, null, false);
  root.actions = pick([2, 3], rng);
  expand(root, numPlayers, seen, rng);

  if (seen.size !== numPlayers) return null;

  const allNodes = [];
  collect(root, allNodes);
  const decisionNodes = allNodes.filter(n => !n.isLeaf);
  const allLeaves = allNodes.filter(n => n.isLeaf);
  if (decisionNodes.length < minDecision || decisionNodes.length > maxDecision) return null;

  assignPayoffs(allLeaves, numPlayers, rng);
  return { root, allNodes, allLeaves, decisionNodes, numPlayers };
}
