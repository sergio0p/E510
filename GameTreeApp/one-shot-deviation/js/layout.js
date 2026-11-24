// Tree layout: the three-pass pipeline from backward-induction/js/tree-renderer.js
// (d3 tidy tree -> perpendicular early leaves -> column redistribution), copied
// verbatim apart from the console logging. Do not tune one pass without tracing
// all three (see ../../LESSONS_FROM_STATIC_GRID.md). Spacing constants come from
// config.js so they scale with the node radius.

import { NODE_R, SPACING } from './config.js';
import { hierarchy, tree } from 'https://cdn.jsdelivr.net/npm/d3-hierarchy@3/+esm';
export function computeLayout(root, width, height) {
  const margin = 60;

  const h = hierarchy(root, d => d.children);

  const treeLayout = tree()
    .size([height - margin * 2, width - margin * 2])
    .separation((a, b) => {
      // Increase spacing for leaf nodes to prevent cramping
      if (a.data.isLeaf && b.data.isLeaf) {
        // Adjust spacing based on parent's child count
        const siblingCount = a.parent.children.length;
        if (siblingCount === 3) {
          return 2.75;  // Extra spacing for 3-leaf clusters
        }
        return 2.0;  // Normal spacing for 2-leaf pairs
      }
      if (a.data.isLeaf || b.data.isLeaf) {
        return 1.5;  // Extra spacing if one is a leaf
      }
      return 1.0;    // Normal spacing for decision nodes
    });

  treeLayout(h);

  h.each(d => {
    d.data.x = d.y + margin;
    d.data.y = d.x + margin;
  });
}

export function redistributeColumns(allNodes) {
  // Pass 3: Redistribute nodes within columns to use available vertical space
  const MIN_SPACING = SPACING.minSpacing;       // Minimum acceptable gap between nodes
  const MAX_SPACING = SPACING.maxSpacing;       // Gap considered "excess" that can be borrowed
  const TARGET_SPACING = SPACING.targetSpacing; // Ideal spacing


  // Group nodes by column (x-position)
  const columnMap = new Map();
  allNodes.forEach(node => {
    const colKey = Math.round(node.x / 10) * 10; // Group by approximate x
    if (!columnMap.has(colKey)) {
      columnMap.set(colKey, []);
    }
    columnMap.get(colKey).push(node);
  });

  // Process each column (sorted by x-position, left to right)
  const columns = Array.from(columnMap.entries())
    .sort((a, b) => a[0] - b[0]);

  columns.forEach(([colX, nodes], colIndex) => {
    if (nodes.length < 2) return; // Need at least 2 nodes to have gaps


    // Sort nodes by y-position
    const sortedNodes = nodes.slice().sort((a, b) => a.y - b.y);

    // Calculate gaps between consecutive nodes
    const gaps = [];
    for (let i = 0; i < sortedNodes.length - 1; i++) {
      const gap = {
        index: i,
        node1: sortedNodes[i],
        node2: sortedNodes[i + 1],
        size: sortedNodes[i + 1].y - sortedNodes[i].y
      };
      gaps.push(gap);
    }

    // Identify cramped gaps (too little space)
    const crampedGaps = gaps.filter(g => g.size < MIN_SPACING);
    if (crampedGaps.length === 0) {
      return; // Column spacing is acceptable
    }

    // Identify excess gaps (space available to borrow)
    const excessGaps = gaps.filter(g => g.size > MAX_SPACING);
    if (excessGaps.length === 0) {
      return; // No excess space to redistribute
    }

    // Calculate space available
    const totalExcess = excessGaps.reduce((sum, g) =>
      sum + (g.size - TARGET_SPACING), 0);

    // Calculate space needed
    const totalNeeded = crampedGaps.reduce((sum, g) =>
      sum + (MIN_SPACING - g.size), 0);


    if (totalExcess < totalNeeded * 0.3) {
      return; // Not enough excess to make difference
    }

    // Distribute space: move nodes downward from cramped regions
    let cumulativeShift = 0;
    let nodesMoved = 0;

    for (let i = 0; i < sortedNodes.length; i++) {
      if (cumulativeShift > 0) {
        moveSubtreeVertical(sortedNodes[i], cumulativeShift, allNodes);
        nodesMoved++;
      }

      // Check if gap after this node is cramped
      if (i < gaps.length && gaps[i].size < MIN_SPACING) {
        const spaceToAdd = MIN_SPACING - gaps[i].size;
        cumulativeShift += spaceToAdd;
      }
    }

    if (nodesMoved > 0) {
    }
  });

}

function moveSubtreeVertical(node, deltaY, allNodes) {
  // Move node
  node.y += deltaY;

  // Move all descendants recursively
  if (!node.isLeaf && node.children) {
    node.children.forEach(child => {
      moveSubtreeVertical(child, deltaY, allNodes);
    });
  }

  // Also move perpendicular leaves that share this node's x-position
  // (They are children but at same x-coordinate due to 90° placement)
  if (!node.isLeaf && node.children) {
    node.children.forEach(child => {
      if (Math.abs(child.x - node.x) < 5) {
        // This is a perpendicular leaf at same x, already moved above
        // No additional action needed
      }
    });
  }
}

export function adjustEarlyLeaves(allNodes) {
  // Adjust position of early leaves (periods 1-3) to save vertical space
  const NODE_RADIUS = NODE_R;
  const MIN_GAP_FROM_OBSTACLE = SPACING.minGapFromObstacle; // breathing room from any obstacle
  const MIN_TOTAL_SPACE = (NODE_RADIUS + MIN_GAP_FROM_OBSTACLE) * 2;
  const DEFAULT_OFFSET = SPACING.defaultOffset; // perpendicular offset when space is unlimited


  // PASS 1: Identify which nodes will move perpendicular (space-based detection)
  const perpendicularNodes = new Set();
  const perpendicularPositions = []; // Track where perpendicular leaves will be

  allNodes.forEach(node => {
    if (node.isLeaf) return;

    const children = node.children;
    const leafChildren = children.filter(c => c.isLeaf && c.period <= 3);

    if (leafChildren.length === 0) return;

    // Calculate available space for adaptive placement
    let canPlaceAbove, canPlaceBelow, adaptiveYAbove, adaptiveYBelow;

    if (!node.parent) {
      // Root node - assume infinite space
      canPlaceAbove = true;
      canPlaceBelow = true;
      adaptiveYAbove = node.y - DEFAULT_OFFSET;
      adaptiveYBelow = node.y + DEFAULT_OFFSET;
    } else {
      const grandparent = node.parent;
      const siblings = grandparent.children;
      const myIndex = siblings.indexOf(node);

      // Check space above
      if (myIndex > 0) {
        const siblingAbove = siblings[myIndex - 1];
        let obstacleAbove = siblingAbove.y + NODE_RADIUS; // Bottom of sibling above

        // Check perpendicular leaves IN THE GAP (between sibling and node)
        const perpInGap = perpendicularPositions.filter(p =>
          Math.abs(p.x - node.x) < 5 &&
          p.y > siblingAbove.y &&
          p.y < node.y
        );
        if (perpInGap.length > 0) {
          const closestPerp = Math.max(...perpInGap.map(p => p.y));
          obstacleAbove = Math.max(obstacleAbove, closestPerp + NODE_RADIUS);
        }

        const availableSpace = (node.y - NODE_RADIUS) - obstacleAbove;
        canPlaceAbove = availableSpace >= MIN_TOTAL_SPACE;

        if (canPlaceAbove) {
          // Place midway between obstacle and parent
          adaptiveYAbove = obstacleAbove + availableSpace / 2;
        } else {
        }
      } else {
        canPlaceAbove = true;
        adaptiveYAbove = node.y - DEFAULT_OFFSET;
      }

      // Check space below
      if (myIndex < siblings.length - 1) {
        const siblingBelow = siblings[myIndex + 1];
        let obstacleBelow = siblingBelow.y - NODE_RADIUS; // Top of sibling below

        // Check perpendicular leaves IN THE GAP (between node and sibling)
        const perpInGap = perpendicularPositions.filter(p =>
          Math.abs(p.x - node.x) < 5 &&
          p.y > node.y &&
          p.y < siblingBelow.y
        );
        if (perpInGap.length > 0) {
          const closestPerp = Math.min(...perpInGap.map(p => p.y));
          obstacleBelow = Math.min(obstacleBelow, closestPerp - NODE_RADIUS);
        }

        const availableSpace = obstacleBelow - (node.y + NODE_RADIUS);
        canPlaceBelow = availableSpace >= MIN_TOTAL_SPACE;

        if (canPlaceBelow) {
          // Place midway between parent and obstacle
          adaptiveYBelow = (node.y + NODE_RADIUS) + availableSpace / 2;
        } else {
        }
      } else {
        canPlaceBelow = true;
        adaptiveYBelow = node.y + DEFAULT_OFFSET;
      }
    }

    // Mark which children will move - GREEDY strategy
    if (children.length === 2) {
      const child0IsLeaf = children[0].isLeaf && children[0].period <= 3 && children[0].children.length === 0;
      const child1IsLeaf = children[1].isLeaf && children[1].period <= 3 && children[1].children.length === 0;

      if (child0IsLeaf && child1IsLeaf) {
        // Both leaves - try both directions
        if (canPlaceAbove) {
          perpendicularNodes.add(children[0]);
          perpendicularPositions.push({ x: node.x, y: adaptiveYAbove, node: children[0] });
        }
        if (canPlaceBelow) {
          perpendicularNodes.add(children[1]);
          perpendicularPositions.push({ x: node.x, y: adaptiveYBelow, node: children[1] });
        }

      } else if (child0IsLeaf && !child1IsLeaf) {
        // Only child[0] is leaf - use best available direction
        if (canPlaceAbove) {
          perpendicularNodes.add(children[0]);
          perpendicularPositions.push({ x: node.x, y: adaptiveYAbove, node: children[0] });
        } else if (canPlaceBelow) {
          perpendicularNodes.add(children[0]);
          perpendicularPositions.push({ x: node.x, y: adaptiveYBelow, node: children[0] });
        }

      } else if (!child0IsLeaf && child1IsLeaf) {
        // Only child[1] is leaf - use best available direction
        if (canPlaceAbove) {
          perpendicularNodes.add(children[1]);
          perpendicularPositions.push({ x: node.x, y: adaptiveYAbove, node: children[1] });
        } else if (canPlaceBelow) {
          perpendicularNodes.add(children[1]);
          perpendicularPositions.push({ x: node.x, y: adaptiveYBelow, node: children[1] });
        }
      }
    } else if (children.length === 3) {
      const child0IsLeaf = children[0].isLeaf && children[0].period <= 3 && children[0].children.length === 0;
      const child2IsLeaf = children[2].isLeaf && children[2].period <= 3 && children[2].children.length === 0;

      if (canPlaceAbove && child0IsLeaf) {
        perpendicularNodes.add(children[0]);
        perpendicularPositions.push({ x: node.x, y: adaptiveYAbove, node: children[0] });
      }
      if (canPlaceBelow && child2IsLeaf) {
        perpendicularNodes.add(children[2]);
        perpendicularPositions.push({ x: node.x, y: adaptiveYBelow, node: children[2] });
      }
    }
  });


  // PASS 2: Apply positioning using space-based detection with cascade awareness
  allNodes.forEach(node => {
    if (node.isLeaf) return;

    const children = node.children;
    const leafChildren = children.filter(c => c.isLeaf && c.period <= 3);

    if (leafChildren.length === 0) return;

    // Calculate available space for adaptive placement (accounting for Pass 1 placements)
    let canPlaceAbove, canPlaceBelow, adaptiveYAbove, adaptiveYBelow;

    if (!node.parent) {
      canPlaceAbove = true;
      canPlaceBelow = true;
      adaptiveYAbove = node.y - DEFAULT_OFFSET;
      adaptiveYBelow = node.y + DEFAULT_OFFSET;
    } else {
      const grandparent = node.parent;
      const siblings = grandparent.children;
      const myIndex = siblings.indexOf(node);

      // Check space above
      if (myIndex > 0) {
        const siblingAbove = siblings[myIndex - 1];
        let obstacleAbove = siblingAbove.y + NODE_RADIUS;

        // Check if sibling above is perpendicular (effectively not blocking)
        if (perpendicularNodes.has(siblingAbove)) {
          // Sibling won't be at its original position, check further up
          if (myIndex > 1) {
            const nextSiblingAbove = siblings[myIndex - 2];
            obstacleAbove = nextSiblingAbove.y + NODE_RADIUS;
          } else {
            obstacleAbove = -Infinity; // Only perpendicular sibling above, infinite space
          }
        }

        // Check perpendicular leaves IN THE GAP (between sibling and node)
        const perpInGap = perpendicularPositions.filter(p =>
          Math.abs(p.x - node.x) < 5 &&
          p.y > siblingAbove.y &&
          p.y < node.y &&
          p.node !== node
        );
        if (perpInGap.length > 0) {
          const closestPerp = Math.max(...perpInGap.map(p => p.y));
          obstacleAbove = Math.max(obstacleAbove, closestPerp + NODE_RADIUS);
        }

        const availableSpace = (node.y - NODE_RADIUS) - obstacleAbove;

        if (!isFinite(availableSpace)) {
          // Infinite space - use default offset
          canPlaceAbove = true;
          adaptiveYAbove = node.y - DEFAULT_OFFSET;
        } else {
          canPlaceAbove = availableSpace >= MIN_TOTAL_SPACE;
          if (canPlaceAbove) {
            adaptiveYAbove = obstacleAbove + availableSpace / 2;
          }
        }
      } else {
        canPlaceAbove = true;
        adaptiveYAbove = node.y - DEFAULT_OFFSET;
      }

      // Check space below
      if (myIndex < siblings.length - 1) {
        const siblingBelow = siblings[myIndex + 1];
        let obstacleBelow = siblingBelow.y - NODE_RADIUS;

        // Check if sibling below is perpendicular
        if (perpendicularNodes.has(siblingBelow)) {
          if (myIndex < siblings.length - 2) {
            const nextSiblingBelow = siblings[myIndex + 2];
            obstacleBelow = nextSiblingBelow.y - NODE_RADIUS;
          } else {
            obstacleBelow = Infinity; // Only perpendicular sibling below, infinite space
          }
        }

        // Check perpendicular leaves IN THE GAP (between node and sibling)
        const perpInGap = perpendicularPositions.filter(p =>
          Math.abs(p.x - node.x) < 5 &&
          p.y > node.y &&
          p.y < siblingBelow.y &&
          p.node !== node
        );
        if (perpInGap.length > 0) {
          const closestPerp = Math.min(...perpInGap.map(p => p.y));
          obstacleBelow = Math.min(obstacleBelow, closestPerp - NODE_RADIUS);
        }

        const availableSpace = obstacleBelow - (node.y + NODE_RADIUS);

        if (!isFinite(availableSpace)) {
          // Infinite space - use default offset
          canPlaceBelow = true;
          adaptiveYBelow = node.y + DEFAULT_OFFSET;
        } else {
          canPlaceBelow = availableSpace >= MIN_TOTAL_SPACE;
          if (canPlaceBelow) {
            adaptiveYBelow = (node.y + NODE_RADIUS) + availableSpace / 2;
          }
        }
      } else {
        canPlaceBelow = true;
        adaptiveYBelow = node.y + DEFAULT_OFFSET;
      }
    }

    // Apply positioning - greedy placement in available directions
    if (children.length === 2) {
      const child0IsLeaf = children[0].isLeaf && children[0].period <= 3 && children[0].children.length === 0;
      const child1IsLeaf = children[1].isLeaf && children[1].period <= 3 && children[1].children.length === 0;

      let child0Perpendicular = false;
      let child1Perpendicular = false;

      // GREEDY STRATEGY: Prioritize using available space
      // Try to place ANY leaf in the best available direction

      if (child0IsLeaf && child1IsLeaf) {
        // Both are leaves - try to place both perpendicular if space allows
        if (canPlaceAbove) {
          children[0].x = node.x;
          children[0].y = adaptiveYAbove;
          child0Perpendicular = true;
        }
        if (canPlaceBelow) {
          children[1].x = node.x;
          children[1].y = adaptiveYBelow;
          child1Perpendicular = true;
        }
        // If only one direction available, both try to use it (handled above)

      } else if (child0IsLeaf && !child1IsLeaf) {
        // Only child[0] is leaf - place it in best available direction
        if (canPlaceAbove) {
          children[0].x = node.x;
          children[0].y = adaptiveYAbove;
          child0Perpendicular = true;
        } else if (canPlaceBelow) {
          children[0].x = node.x;
          children[0].y = adaptiveYBelow;
          child0Perpendicular = true;
        }

      } else if (!child0IsLeaf && child1IsLeaf) {
        // Only child[1] is leaf - place it in best available direction
        if (canPlaceAbove) {
          children[1].x = node.x;
          children[1].y = adaptiveYAbove;
          child1Perpendicular = true;
        } else if (canPlaceBelow) {
          children[1].x = node.x;
          children[1].y = adaptiveYBelow;
          child1Perpendicular = true;
        }
      }
      // If neither is a leaf, no perpendicular placement

      // Force horizontal positioning for sibling when one goes perpendicular
      if (child0Perpendicular && !child1Perpendicular) {
        children[1].y = node.y; // Force horizontal (0° angle)
      }
      if (child1Perpendicular && !child0Perpendicular) {
        children[0].y = node.y; // Force horizontal (0° angle)
      }
      // If neither perpendicular, preserve D3's natural bifurcation
      // If both perpendicular, both already positioned

    } else if (children.length === 3) {
      const child0IsLeaf = children[0].isLeaf && children[0].period <= 3 && children[0].children.length === 0;
      const child2IsLeaf = children[2].isLeaf && children[2].period <= 3 && children[2].children.length === 0;

      let child0Perpendicular = false;
      let child2Perpendicular = false;

      if (canPlaceAbove && child0IsLeaf) {
        children[0].x = node.x;
        children[0].y = adaptiveYAbove;
        child0Perpendicular = true;
      }

      if (canPlaceBelow && child2IsLeaf) {
        children[2].x = node.x;
        children[2].y = adaptiveYBelow;
        child2Perpendicular = true;
      }

      // Force middle child horizontal if either outer child goes perpendicular
      if (child0Perpendicular || child2Perpendicular) {
        children[1].y = node.y; // Force horizontal (0° angle)
      }
      // If neither outer child perpendicular, preserve D3's natural layout
    }
  });

}

// Pass 4: reject trees whose nodes sit too close together (parent-child pairs excepted).
export function hasCollisions(allNodes, threshold) {
  for (let i = 0; i < allNodes.length; i++) {
    for (let j = i + 1; j < allNodes.length; j++) {
      const a = allNodes[i], b = allNodes[j];
      if (a.parent === b || b.parent === a) continue;
      if (Math.hypot(a.x - b.x, a.y - b.y) < threshold) return true;
    }
  }
  return false;
}
