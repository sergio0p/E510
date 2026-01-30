import { generateTree } from './tree-generator.js';
import { computeLayout, adjustEarlyLeaves, redistributeColumns, renderTree, setupClickableEdges, markEdgeOptimal, shakeEdge } from './tree-renderer.js';
import { updateFrontier, handleEdgeClick } from './game-logic.js';
import { animateFrontierResolution } from './animations.js';

// Game state
const gameState = {
  root: null,
  allNodes: [],
  allLeaves: [],
  frontierNodes: [],
  phase: 'interaction'
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
            }
          }
        });
      }
    });
  });
}

function init() {
  const svg = document.getElementById('tree-svg');
  const width = svg.clientWidth || 1200;
  const height = 840; // Start with default, will adjust dynamically later

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

  // Set up click handlers
  setupInteraction();
}

function adjustCanvasSize(allNodes, svg) {
  console.log('\n=== PASS 5: Canvas Size Adjustment ===');

  // Find actual bounds of all nodes
  let minY = Infinity;
  let maxY = -Infinity;

  allNodes.forEach(node => {
    const nodeRadius = 24;
    minY = Math.min(minY, node.y - nodeRadius);
    maxY = Math.max(maxY, node.y + nodeRadius);
  });

  const padding = 60; // Extra padding top and bottom
  const requiredHeight = (maxY - minY) + (padding * 2);

  console.log(`  Node bounds: y ∈ [${Math.round(minY)}, ${Math.round(maxY)}]`);
  console.log(`  Required height: ${Math.round(requiredHeight)}px`);

  // If nodes go above y=0 or extend beyond current height, adjust
  if (minY < padding || requiredHeight > svg.clientHeight) {
    // Shift all nodes down if some are too high
    const shiftDown = minY < padding ? padding - minY : 0;

    if (shiftDown > 0) {
      console.log(`  Shifting all nodes down by ${Math.round(shiftDown)}px`);
      allNodes.forEach(node => {
        node.y += shiftDown;
      });
      minY += shiftDown;
      maxY += shiftDown;
    }

    // Update SVG height
    const newHeight = Math.max(840, Math.ceil(requiredHeight));
    svg.style.height = newHeight + 'px';
    console.log(`  ✅ Canvas height adjusted to ${newHeight}px (was ${svg.clientHeight}px)`);
  } else {
    console.log(`  ✅ Current height sufficient (${svg.clientHeight}px)`);
  }
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
  document.getElementById('new-game').onclick = init;
});
