// Game-theoretic bookkeeping. A strategy profile is a Map from decision-node id
// to the index of the child that the mover picks there.

export const ACTION_LABELS = ['a', 'b', 'c'];

export function actionLabel(index) {
  return ACTION_LABELS[index];
}

// Follow the profile from `node` down to a leaf.
export function outcome(node, profile) {
  let n = node;
  while (!n.isLeaf) n = n.children[profile.get(n.id)];
  return n;
}

// Backward induction. Payoffs are distinct per player, so there are no ties.
export function backwardInduction(root) {
  const profile = new Map();
  (function solve(node) {
    if (node.isLeaf) return node.payoffs;
    const values = node.children.map(solve);
    const p = node.player - 1;
    let best = 0;
    for (let i = 1; i < values.length; i++) {
      if (values[i][p] > values[best][p]) best = i;
    }
    profile.set(node.id, best);
    return values[best];
  })(root);
  return profile;
}

export function profileKey(decisionNodes, profile) {
  return decisionNodes.map(n => profile.get(n.id)).join('');
}

export function diffNodes(decisionNodes, p, q) {
  return decisionNodes.filter(n => p.get(n.id) !== q.get(n.id));
}

// Decision nodes reached when everybody follows the profile from the root.
export function pathIds(root, profile) {
  const ids = new Set();
  let n = root;
  while (!n.isLeaf) {
    ids.add(n.id);
    n = n.children[profile.get(n.id)];
  }
  return ids;
}

export function isAncestor(a, b) {
  for (let n = b.parent; n; n = n.parent) if (n === a) return true;
  return false;
}

export function subtreeNodes(node) {
  const out = [];
  (function walk(n) { out.push(n); n.children.forEach(walk); })(node);
  return out;
}

// Actions taken from the root to reach `node`.
export function historyLabels(node) {
  const labels = [];
  for (let n = node; n.parent; n = n.parent) {
    labels.unshift(actionLabel(n.parent.children.indexOf(n)));
  }
  return labels;
}

// "the root" / "the node after a, b"
export function nodeName(node) {
  const h = historyLabels(node);
  return h.length === 0 ? 'the root' : `the node after ${h.join(', ')}`;
}

// "in the whole game" / "in the subgame after a, b"
export function subgamePhrase(node) {
  const h = historyLabels(node);
  return h.length === 0 ? 'in the whole game' : `in the subgame after ${h.join(', ')}`;
}

// Payoffs in the subgame at `node` when the mover switches to `newIndex` there
// and the profile is followed everywhere else.
export function deviationPayoffs(node, profile, newIndex) {
  const before = outcome(node, profile).payoffs;
  const after = outcome(node.children[newIndex], profile).payoffs;
  const mover = node.player;
  return { mover, before, after, profitable: after[mover - 1] > before[mover - 1] };
}

export function playerList(players) {
  const sorted = [...players].sort();
  if (sorted.length === 1) return `Player ${sorted[0]}`;
  if (sorted.length === 2) return `Players ${sorted[0]} and ${sorted[1]}`;
  return `Players ${sorted.slice(0, -1).join(', ')} and ${sorted[sorted.length - 1]}`;
}

const SHOT_WORDS = { 2: 'two', 3: 'three', 4: 'four', 5: 'five', 6: 'six' };
export function shotWord(k) {
  return SHOT_WORDS[k] ?? String(k);
}

// Compact notation, e.g. (a, (ab)): one entry per player, that player's actions
// listed in reading order (left to right, then top to bottom).
export function profileNotation(decisionNodes, profile, numPlayers) {
  const ordered = decisionNodes.slice().sort((u, v) => (u.x - v.x) || (u.y - v.y));
  const groups = [];
  for (let p = 1; p <= numPlayers; p++) {
    const acts = ordered.filter(n => n.player === p).map(n => actionLabel(profile.get(n.id)));
    groups.push(acts.length === 1 ? acts[0] : `(${acts.join('')})`);
  }
  if (numPlayers === 1) return groups[0].startsWith('(') ? groups[0] : `(${groups[0]})`;
  return `(${groups.join(', ')})`;
}
