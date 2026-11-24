// Builds one round: a game, a strategy profile s, and the option profiles for
// question 1.
//
// Answer patterns are varied with decks: each deck is shuffled, dealt one card
// per round and reshuffled when empty, so a student working through several
// games meets every kind of case instead of the same shape repeatedly:
//  - players: 1, 2, 3;
//  - which way s is wrong (or not) for question 2 onward;
//  - how many options of question 1 are one-shot deviations.

import { generateTree } from './generator.js';
import { computeLayout, adjustEarlyLeaves, redistributeColumns, hasCollisions } from './layout.js';
import { subgamePolygon, outlineIsClear } from './outline.js';
import { backwardInduction, pathIds, diffNodes, profileKey } from './game.js';
import { LAYOUT_W, LAYOUT_H, SPACING } from './config.js';

const COLLISION = SPACING.collision;
const OPTION_COUNT = 6;

class Deck {
  constructor(cards) { this.cards = cards; this.pile = []; }
  next() {
    if (this.pile.length === 0) this.pile = shuffle(this.cards.slice());
    return this.pile.pop();
  }
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

const playerDeck = new Deck([1, 2, 3]);
// yes: s is the SPNE. The others say where s departs from it.
const scenarioDeck = new Deck(['yes', 'yes', 'off-path', 'root', 'deep', 'multi']);
const correctCountDeck = new Deck([1, 2, 2, 3, 3, 4]);

function otherAction(node, current) {
  const choices = node.children.map((_, i) => i).filter(i => i !== current);
  return pick(choices);
}

function changed(profile, nodes) {
  const q = new Map(profile);
  nodes.forEach(n => q.set(n.id, otherAction(n, profile.get(n.id))));
  return q;
}

// The profile s for a scenario, or null if this tree cannot host it.
function scenarioProfile(tree, spne, scenario) {
  const { root, decisionNodes } = tree;
  const onPath = pathIds(root, spne);
  switch (scenario) {
    case 'yes':
      return new Map(spne);
    case 'off-path': {
      // Wrong only where the equilibrium path never goes.
      const off = decisionNodes.filter(n => !onPath.has(n.id));
      if (off.length === 0) return null;
      const k = Math.min(off.length, pick([1, 1, 2]));
      return changed(spne, shuffle(off.slice()).slice(0, k));
    }
    case 'root':
      return changed(spne, [root]);
    case 'deep': {
      // One wrong choice at the deepest level of the tree.
      const maxP = Math.max(...decisionNodes.map(n => n.period));
      if (maxP === 0) return null;
      return changed(spne, [pick(decisionNodes.filter(n => n.period === maxP))]);
    }
    case 'multi': {
      if (decisionNodes.length < 3) return null;
      const k = pick([2, 2, 3]);
      return changed(spne, shuffle(decisionNodes.slice()).slice(0, k));
    }
    default:
      return null;
  }
}

// ---- question 1 options ----

function osdCategory(tree, s, node) {
  if (node === tree.root) return `root`;
  const onPath = pathIds(tree.root, s).has(node.id);
  return `${onPath ? 'on' : 'off'}-${node.player}`;
}

function allOSDs(tree, s) {
  const out = [];
  tree.decisionNodes.forEach(n => {
    n.children.forEach((_, i) => {
      if (i === s.get(n.id)) return;
      const q = new Map(s);
      q.set(n.id, i);
      out.push({ profile: q, changed: [n], category: osdCategory(tree, s, n) });
    });
  });
  return out;
}

function distractors(tree, s) {
  const nodes = tree.decisionNodes;
  const out = [{ profile: new Map(s), changed: [], category: 'identical' }];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const pair = [nodes[i], nodes[j]];
      const samePlayer = nodes[i].player === nodes[j].player;
      out.push({ profile: changed(s, pair), changed: pair, category: samePlayer ? 'two-same' : 'two-players' });
      for (let k = j + 1; k < nodes.length; k++) {
        const triple = [nodes[i], nodes[j], nodes[k]];
        const players = new Set(triple.map(n => n.player));
        out.push({ profile: changed(s, triple), changed: triple, category: players.size === 1 ? 'three-same' : 'three-players' });
      }
    }
  }
  return out;
}

// Pick `count` items, spreading across categories before repeating one.
function spread(items, count, keyOf, used) {
  const chosen = [];
  const byCat = new Map();
  shuffle(items.slice()).forEach(it => {
    const key = keyOf(it);
    if (used.has(key)) return;
    if (!byCat.has(it.category)) byCat.set(it.category, []);
    byCat.get(it.category).push(it);
  });
  const cats = shuffle([...byCat.keys()]);
  while (chosen.length < count && cats.some(c => byCat.get(c).length)) {
    for (const c of cats) {
      if (chosen.length >= count) break;
      const list = byCat.get(c);
      while (list.length) {
        const it = list.pop();
        const key = keyOf(it);
        if (used.has(key)) continue;
        used.add(key);
        chosen.push(it);
        break;
      }
    }
  }
  return chosen;
}

function buildOptions(tree, s, wantCorrect) {
  const key = it => profileKey(tree.decisionNodes, it.profile);
  const used = new Set();
  const osds = allOSDs(tree, s);
  const nCorrect = Math.min(wantCorrect, osds.length);
  const correct = spread(osds, nCorrect, key, used);

  let pool = distractors(tree, s);
  // s itself is a sharp distractor but should not show up every time.
  if (Math.random() < 0.6) pool = pool.filter(d => d.category !== 'identical');
  const wrong = spread(pool, OPTION_COUNT - correct.length, key, used);
  if (correct.length + wrong.length < 4) return null;

  const options = shuffle([
    ...correct.map(o => ({ ...o, isOSD: true })),
    ...wrong.map(o => ({ ...o, isOSD: false })),
  ]);
  options.forEach((o, i) => { o.letter = 'ABCDEF'[i]; });
  return options;
}

// ---- the round ----

function layOut(tree) {
  computeLayout(tree.root, LAYOUT_W, LAYOUT_H);
  adjustEarlyLeaves(tree.allNodes);
  redistributeColumns(tree.allNodes);
  if (hasCollisions(tree.allNodes, COLLISION)) return false;
  // Question 5 may outline any subgame: all of them must be drawable.
  return tree.decisionNodes.every(n => outlineIsClear(n, tree.allNodes, subgamePolygon(n)));
}

export function makeRound() {
  const numPlayers = playerDeck.next();
  const scenario = scenarioDeck.next();
  const wantCorrect = correctCountDeck.next();

  for (let attempt = 0; attempt < 2000; attempt++) {
    const tree = generateTree(numPlayers, { minDecision: 3, maxDecision: 6 });
    if (!tree) continue;
    const spne = backwardInduction(tree.root);
    const s = scenarioProfile(tree, spne, scenario);
    if (!s) continue;
    const options = buildOptions(tree, s, wantCorrect);
    if (!options) continue;
    if (!layOut(tree)) continue;
    const wrongNodes = diffNodes(tree.decisionNodes, s, spne);
    return { tree, spne, s, scenario, options, numPlayers, wrongNodes, attempts: attempt + 1 };
  }
  throw new Error(`No ${numPlayers}-player game for scenario ${scenario} after 2000 attempts`);
}
