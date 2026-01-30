// Find all decision nodes whose children are ALL leaves
export function updateFrontier(allNodes) {
  return allNodes.filter(node => {
    if (node.isLeaf) return false;
    if (node.isSolved) return false;
    return node.children.every(child => child.isLeaf);
  });
}

// Determine which child is the best response for this node's player
export function getBestResponseIndex(node) {
  const playerIndex = node.player - 1;  // Convert player 1,2,3 to index 0,1,2

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

// Handle edge click
export function handleEdgeClick(parentNode, childIndex, gameState, callbacks) {
  if (gameState.phase !== 'interaction') return;
  if (parentNode.isSolved) return;

  const correctIndex = getBestResponseIndex(parentNode);

  if (childIndex === correctIndex) {
    // Correct!
    parentNode.isSolved = true;
    parentNode.optimalChildIndex = correctIndex;

    callbacks.onCorrect(parentNode, childIndex);

    // Check if all frontier nodes are solved
    const allSolved = gameState.frontierNodes.every(n => n.isSolved);
    if (allSolved) {
      callbacks.onFrontierComplete(gameState);
    }
  } else {
    // Wrong
    callbacks.onWrong(parentNode, childIndex);
  }
}
