// Period-dependent action probabilities
// Format: { 0: leafProb, 2: twoChildProb, 3: threeChildProb }
const ACTION_PROBABILITIES = {
  1: { 0: 0.30, 2: 0.525, 3: 0.175 },
  2: { 0: 0.50, 2: 0.375, 3: 0.125 },
  3: { 0: 0.70, 2: 0.225, 3: 0.075 }
};

// Generate complete random tree
export function generateTree() {
  const playersInGame = new Set([1]); // Start with Player 1 (root)
  const root = createRootNode(playersInGame);
  expandNode(root, playersInGame);

  const allNodes = [];
  const allLeaves = [];
  collectNodes(root, allNodes, allLeaves);

  const numPlayers = playersInGame.size;
  console.log(`Game has ${numPlayers} player(s): ${Array.from(playersInGame).sort().join(', ')}`);

  assignPayoffs(allLeaves, numPlayers);

  return { root, allNodes, allLeaves };
}

function createRootNode(playersInGame) {
  return {
    id: 'n0',
    player: 1, // Root must always be Player 1
    period: 0,
    actions: randomChoice([2, 3]),
    payoffs: null,
    children: [],
    parent: null,
    isLeaf: false,
    x: 0,
    y: 0
  };
}

function expandNode(node, playersInGame) {
  for (let i = 0; i < node.actions; i++) {
    const childId = `${node.id}_${i}`;
    const childPeriod = node.period + 1;

    let child;

    if (childPeriod === 4) {
      // Forced leaf
      child = {
        id: childId,
        player: null,
        period: childPeriod,
        actions: 0,
        payoffs: null,
        children: [],
        parent: node,
        isLeaf: true,
        x: 0,
        y: 0
      };
    } else {
      // Determine actions for this child
      let actions;

      if (node.period === 0 && i === 0) {
        // First child of root must be a decision node (never a leaf)
        // Choose only between 2 or 3 actions (proportional to their original weights)
        const prob2 = ACTION_PROBABILITIES[childPeriod][2];
        const prob3 = ACTION_PROBABILITIES[childPeriod][3];
        const total = prob2 + prob3;
        actions = weightedChoice({
          2: prob2 / total,
          3: prob3 / total
        });
        console.log(`🔒 Root constraint: Forced child[0] to have ${actions} actions (not 0)`);
      } else {
        // Normal probabilistic choice
        actions = weightedChoice(ACTION_PROBABILITIES[childPeriod]);
      }

      if (actions === 0) {
        // Early termination — leaf
        child = {
          id: childId,
          player: null,
          period: childPeriod,
          actions: 0,
          payoffs: null,
          children: [],
          parent: node,
          isLeaf: true,
          x: 0,
          y: 0
        };
      } else {
        // Decision node - determine available players based on progression rule
        let availablePlayers = [];

        // Player 1 is always available
        availablePlayers.push(1);

        // Player 2 is available only if Player 1 exists in the game
        if (playersInGame.has(1)) {
          availablePlayers.push(2);
        }

        // Player 3 is available only if Player 2 exists in the game
        if (playersInGame.has(2)) {
          availablePlayers.push(3);
        }

        // Remove current player (can't have same player in consecutive nodes)
        availablePlayers = availablePlayers.filter(p => p !== node.player);

        const selectedPlayer = randomChoice(availablePlayers);
        playersInGame.add(selectedPlayer);

        child = {
          id: childId,
          player: selectedPlayer,
          period: childPeriod,
          actions: actions,
          payoffs: null,
          children: [],
          parent: node,
          isLeaf: false,
          x: 0,
          y: 0
        };
        expandNode(child, playersInGame);
      }
    }

    node.children.push(child);
  }
}

function collectNodes(node, allNodes, allLeaves) {
  allNodes.push(node);
  if (node.isLeaf) {
    allLeaves.push(node);
  } else {
    node.children.forEach(child => collectNodes(child, allNodes, allLeaves));
  }
}

function assignPayoffs(leaves, numPlayers) {
  const n = leaves.length;

  const range = [];
  for (let i = -20; i <= 20; i++) {
    range.push(i);
  }

  for (let playerIndex = 0; playerIndex < numPlayers; playerIndex++) {
    const shuffled = shuffle([...range]);
    const values = shuffled.slice(0, n);

    for (let i = 0; i < n; i++) {
      if (!leaves[i].payoffs) {
        leaves[i].payoffs = [];
      }
      leaves[i].payoffs[playerIndex] = values[i];
    }
  }
}

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function weightedChoice(probabilities) {
  const rand = Math.random();
  let cumulative = 0;

  for (const [value, prob] of Object.entries(probabilities)) {
    cumulative += prob;
    if (rand < cumulative) {
      return parseInt(value);
    }
  }

  // Fallback (should never reach here if probabilities sum to 1)
  return parseInt(Object.keys(probabilities)[0]);
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
