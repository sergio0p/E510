import { generateTree } from './tree-generator.js';
import { computeLayout, adjustEarlyLeaves, redistributeColumns, renderTree, setupClickableEdges, markEdgeOptimal, shakeEdge } from './tree-renderer.js';
import { updateFrontier, handleEdgeClick } from './game-logic.js';
import { animateFrontierResolution, animateTreeGrowth } from './animations.js';

// Deep copy tree structure for replay
function deepCopyTree(node, parent = null) {
  const copy = {
    id: node.id,
    player: node.player,
    period: node.period,
    isLeaf: node.isLeaf,
    payoffs: node.payoffs ? [...node.payoffs] : null,
    x: node.x,
    y: node.y,
    children: [],
    parent: parent,
    isSolved: node.isSolved,
    optimalChildIndex: node.optimalChildIndex
  };

  if (node.children && node.children.length > 0) {
    copy.children = node.children.map(child => deepCopyTree(child, copy));
  }

  return copy;
}

// Game state
const gameState = {
  root: null,
  allNodes: [],
  allLeaves: [],
  frontierNodes: [],
  phase: 'interaction',
  contractionHistory: [],  // Track order of contractions for replay
  originalTreeData: null   // Deep copy of original tree structure
};

function setupInteraction() {
  setupClickableEdges(gameState.frontierNodes, (parentNode, childIndex) => {
    handleEdgeClick(parentNode, childIndex, gameState, {
      onCorrect: (node, index) => {
        const child = node.children[index];
        markEdgeOptimal(node.id, child.id, node);
        console.log(`✓ Correct! Player ${node.player} chooses child ${index} (payoff: ${child.payoffs[node.player - 1]})`);
      },
      onWrong: (node, index) => {
        const child = node.children[index];
        shakeEdge(node.id, child.id);
        console.log(`✗ Wrong. Player ${node.player} would not choose child ${index} (payoff: ${child.payoffs[node.player - 1]})`);
      },
      onFrontierComplete: (state) => {
        console.log('🎉 All frontier nodes solved! Starting animation phase...');

        // Transition to animation phase
        gameState.phase = 'animating';

        // Collect all solved nodes (current frontier)
        const solvedNodes = state.frontierNodes.filter(n => n.isSolved);

        // Record this frontier level for replay (before contraction)
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

        // Start animation sequence
        animateFrontierResolution(solvedNodes, state, {
          onAllAnimationsComplete: () => {
            console.log('✅ Animation phase complete!');

            // Update frontier for next round
            gameState.frontierNodes = updateFrontier(state.allNodes);

            if (gameState.frontierNodes.length > 0) {
              console.log('🔄 New frontier identified. Ready for next round.');
              gameState.phase = 'interaction';
              setupInteraction();
            } else {
              console.log('🏁 Backward induction complete! Root reached.');
              gameState.phase = 'complete';

              // Wait 2 seconds, then start growth replay
              gsap.delayedCall(2.0, () => {
                console.log('🌱 Starting tree growth replay...');
                gameState.phase = 'replay';
                animateTreeGrowth(gameState.contractionHistory, gameState.originalTreeData, gameState, {
                  onReplayComplete: () => {
                    console.log('✨ Replay complete! SPNE path highlighted.');
                    gameState.phase = 'complete';
                  }
                });
              });
            }
          }
        });
      }
    });
  });
}

function init() {
  const svg = document.getElementById('tree-svg');
  const width = 1400; // Layout space - viewBox will scale to fit
  const height = 900; // Layout space - viewBox will scale to fit

  const MAX_ATTEMPTS = 50;
  const COLLISION_THRESHOLD = 65; // Minimum distance between node centers

  let attempt = 0;
  let collisionFree = false;
  let root, allNodes, allLeaves;

  while (!collisionFree && attempt < MAX_ATTEMPTS) {
    attempt++;

    if (attempt > 1) {
      console.log(`\n🔄 Attempt ${attempt}: Regenerating due to collisions...`);
    }

    // Generate tree
    const treeData = generateTree();
    root = treeData.root;
    allNodes = treeData.allNodes;
    allLeaves = treeData.allLeaves;

    // Debug logging
    if (attempt === 1) {
      console.log('--- New Tree ---');
      console.log('Total nodes:', allNodes.length);
      console.log('Total leaves:', allLeaves.length);
      console.log('Root player:', root.player);
      console.log('Root children:', root.children.length);

      // Verify payoff uniqueness
      for (let p = 0; p < 3; p++) {
        const payoffs = allLeaves.map(l => l.payoffs[p]);
        const unique = new Set(payoffs);
        console.log(`Player ${p + 1} payoffs unique:`, unique.size === payoffs.length);
      }
    }

    // VALIDATION: Check for invalid child counts AFTER generation
    if (attempt === 1) {
      console.log('\n=== VALIDATION: After generateTree() ===');
      validateTreeStructure(allNodes, 'after generation');

      // Check root constraint
      const rootChildren = root.children;
      const allLeaves = rootChildren.every(c => c.isLeaf);
      if (allLeaves) {
        console.error('❌ CONSTRAINT VIOLATION: All root children are leaves!');
        console.error('   Root children:', rootChildren.map(c => ({ id: c.id, isLeaf: c.isLeaf, actions: c.actions })));
      } else {
        console.log('✅ Root has at least one decision node child');
      }
    }

    // Layout passes
    computeLayout(root, width, height);

    if (attempt === 1) {
      console.log('\n=== VALIDATION: After computeLayout() ===');
      validateTreeStructure(allNodes, 'after D3 layout');
    }

    adjustEarlyLeaves(allNodes);

    if (attempt === 1) {
      console.log('\n=== VALIDATION: After adjustEarlyLeaves() ===');
      validateTreeStructure(allNodes, 'after perpendicular adjustment');
    }

    redistributeColumns(allNodes);

    if (attempt === 1) {
      console.log('\n=== VALIDATION: After redistributeColumns() ===');
      validateTreeStructure(allNodes, 'after column redistribution');
    }

    // PASS 4: Collision Detection
    collisionFree = checkCollisions(allNodes, COLLISION_THRESHOLD);

    if (!collisionFree && attempt >= MAX_ATTEMPTS) {
      console.warn(`⚠️ Could not generate collision-free tree after ${MAX_ATTEMPTS} attempts. Using best effort.`);
      collisionFree = true; // Accept the tree anyway
    }
  }

  if (attempt > 1) {
    console.log(`✅ Collision-free tree generated on attempt ${attempt}`);
  }

  // PASS 5: Adjust canvas to fit all nodes
  adjustCanvasSize(allNodes, svg);

  renderTree(root, allNodes);

  // Store in game state
  gameState.root = root;
  gameState.allNodes = allNodes;
  gameState.allLeaves = allLeaves;
  gameState.phase = 'interaction';

  // Reset solved state on all nodes
  allNodes.forEach(node => {
    node.isSolved = false;
    node.optimalChildIndex = null;
  });

  // Find initial frontier
  gameState.frontierNodes = updateFrontier(allNodes);

  console.log('Frontier nodes:', gameState.frontierNodes.map(n => n.id));
  console.log('Frontier node players:', gameState.frontierNodes.map(n => `${n.id}: Player ${n.player}`));

  // Save original tree for replay (deep copy before any contractions)
  gameState.originalTreeData = deepCopyTree(root);
  gameState.contractionHistory = [];

  // Set up click handlers
  setupInteraction();
}

function adjustCanvasSize(allNodes, svg) {
  console.log('\n=== PASS 5: Canvas Size Adjustment (ViewBox) ===');

  const NODE_RADIUS = 24;
  const PADDING = 150; // Large padding to account for edge labels, curves, and arrowheads

  // Find actual bounds of all nodes
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  allNodes.forEach(node => {
    if (typeof node.x !== 'number' || typeof node.y !== 'number') {
      console.error('Invalid node position:', node);
      return;
    }
    minX = Math.min(minX, node.x - NODE_RADIUS);
    maxX = Math.max(maxX, node.x + NODE_RADIUS);
    minY = Math.min(minY, node.y - NODE_RADIUS);
    maxY = Math.max(maxY, node.y + NODE_RADIUS);
  });

  // Validate bounds
  if (!isFinite(minX) || !isFinite(maxX) || !isFinite(minY) || !isFinite(maxY)) {
    console.error('❌ Invalid bounds calculated:', { minX, maxX, minY, maxY });
    console.error('   Falling back to fixed dimensions');
    svg.setAttribute('viewBox', '0 0 1400 900');
    svg.style.width = '100%';
    svg.style.height = '900px';
    return;
  }

  // Add padding
  minX -= PADDING;
  maxX += PADDING;
  minY -= PADDING;
  maxY += PADDING;

  const width = maxX - minX;
  const height = maxY - minY;

  console.log(`  Node bounds: x ∈ [${Math.round(minX)}, ${Math.round(maxX)}], y ∈ [${Math.round(minY)}, ${Math.round(maxY)}]`);
  console.log(`  ViewBox size: ${Math.round(width)}px × ${Math.round(height)}px`);

  // Set viewBox to show all content
  svg.setAttribute('viewBox', `${minX} ${minY} ${width} ${height}`);
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

  // Ensure SVG has explicit height for rendering
  const containerWidth = svg.parentElement.clientWidth || 1200;
  const aspectRatio = height / width;
  const svgHeight = containerWidth * aspectRatio;
  svg.style.height = `${svgHeight}px`;

  console.log(`  ✅ ViewBox set: "${Math.round(minX)} ${Math.round(minY)} ${Math.round(width)} ${Math.round(height)}"`);
  console.log(`  ✅ SVG height: ${Math.round(svgHeight)}px`);
}

function checkCollisions(allNodes, threshold) {
  console.log('\n=== PASS 4: Collision Detection ===');

  const collisions = [];
  const NODE_RADIUS = 24;

  for (let i = 0; i < allNodes.length; i++) {
    for (let j = i + 1; j < allNodes.length; j++) {
      const node1 = allNodes[i];
      const node2 = allNodes[j];

      // Calculate distance between centers
      const dx = node2.x - node1.x;
      const dy = node2.y - node1.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Check if too close (but not parent-child which are intentionally close)
      const isParentChild = node1.parent === node2 || node2.parent === node1;

      if (distance < threshold && !isParentChild) {
        collisions.push({
          node1: node1.id,
          node2: node2.id,
          distance: Math.round(distance),
          threshold: threshold
        });
      }
    }
  }

  if (collisions.length > 0) {
    console.log(`❌ Found ${collisions.length} collision(s):`);
    collisions.slice(0, 5).forEach(c => {
      console.log(`   ${c.node1} ↔ ${c.node2}: ${c.distance}px (threshold: ${c.threshold}px)`);
    });
    if (collisions.length > 5) {
      console.log(`   ... and ${collisions.length - 5} more`);
    }
    return false;
  } else {
    console.log('✅ No collisions detected');
    return true;
  }
}

function validateTreeStructure(allNodes, stage) {
  let invalidNodes = [];

  allNodes.forEach(node => {
    const childCount = node.children.length;

    // Check for invalid child counts (should be 0, 2, or 3)
    if (childCount === 1) {
      console.error(`❌ Node ${node.id} has EXACTLY 1 child at ${stage}!`, {
        id: node.id,
        period: node.period,
        player: node.player,
        isLeaf: node.isLeaf,
        children: node.children.map(c => ({ id: c.id, isLeaf: c.isLeaf }))
      });
      invalidNodes.push(node);
    }

    // Check for leaves with children
    if (node.isLeaf && childCount > 0) {
      console.error(`❌ LEAF node ${node.id} has ${childCount} children at ${stage}!`, {
        id: node.id,
        period: node.period,
        children: node.children.map(c => c.id)
      });
      invalidNodes.push(node);
    }
  });

  if (invalidNodes.length > 0) {
    console.error(`❌ Found ${invalidNodes.length} invalid nodes at ${stage}`);
  } else {
    console.log(`✅ All nodes valid at ${stage} (child counts: 0, 2, or 3)`);
  }

  // Distribution
  const distribution = { 0: 0, 1: 0, 2: 0, 3: 0, other: 0 };
  allNodes.forEach(node => {
    const count = node.children.length;
    if (count <= 3) {
      distribution[count]++;
    } else {
      distribution.other++;
    }
  });
  console.log(`   Child count distribution:`, distribution);

  return invalidNodes.length === 0;
}

document.addEventListener('DOMContentLoaded', () => {
  init();
});
