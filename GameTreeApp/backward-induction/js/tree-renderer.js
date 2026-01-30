import { hierarchy, tree } from 'https://cdn.jsdelivr.net/npm/d3-hierarchy@3/+esm';

const COLORS = {
  1: '#DC2626',
  2: '#16A34A',
  3: '#2563EB'
};

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
  const MIN_SPACING = 80;   // Minimum acceptable gap between nodes
  const MAX_SPACING = 250;  // Gap considered "excess" that can be borrowed
  const TARGET_SPACING = 120; // Ideal spacing

  console.log('🔄 Starting column redistribution...');

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

    console.log(`  Column ${colIndex + 1} (x≈${Math.round(colX)}): ${nodes.length} nodes`);

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
      console.log(`    ✓ No cramped gaps`);
      return; // Column spacing is acceptable
    }

    // Identify excess gaps (space available to borrow)
    const excessGaps = gaps.filter(g => g.size > MAX_SPACING);
    if (excessGaps.length === 0) {
      console.log(`    ⚠ ${crampedGaps.length} cramped gaps but no excess space`);
      return; // No excess space to redistribute
    }

    // Calculate space available
    const totalExcess = excessGaps.reduce((sum, g) =>
      sum + (g.size - TARGET_SPACING), 0);

    // Calculate space needed
    const totalNeeded = crampedGaps.reduce((sum, g) =>
      sum + (MIN_SPACING - g.size), 0);

    console.log(`    📊 ${crampedGaps.length} cramped gaps need ${Math.round(totalNeeded)}px`);
    console.log(`    📊 ${excessGaps.length} excess gaps have ${Math.round(totalExcess)}px available`);

    if (totalExcess < totalNeeded * 0.3) {
      console.log(`    ⚠ Not enough excess space to redistribute`);
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
      console.log(`    ✅ Moved ${nodesMoved} subtrees (total shift: ${Math.round(cumulativeShift)}px)`);
    }
  });

  console.log('✓ Column redistribution complete');
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
  const PERPENDICULAR_OFFSET = 125;
  const SAFE_GAP = 205; // PERPENDICULAR_OFFSET + 2*radius + buffer = 125 + 48 + 32

  console.log('🔄 Starting space-aware perpendicular placement...');

  // PASS 1: Identify which nodes will move perpendicular (space-based detection)
  const perpendicularNodes = new Set();
  const perpendicularPositions = []; // Track where perpendicular leaves will be

  allNodes.forEach(node => {
    if (node.isLeaf) return;

    const children = node.children;
    const leafChildren = children.filter(c => c.isLeaf && c.period <= 3);

    if (leafChildren.length === 0) return;

    // Determine if there's enough SPACE for perpendicular placement
    let canPlaceAbove, canPlaceBelow;

    if (!node.parent) {
      // Root node - assume infinite space
      canPlaceAbove = true;
      canPlaceBelow = true;
    } else {
      const grandparent = node.parent;
      const siblings = grandparent.children;
      const myIndex = siblings.indexOf(node);

      // Check space above
      if (myIndex > 0) {
        const siblingAbove = siblings[myIndex - 1];
        let gapAbove = node.y - siblingAbove.y;

        // Check perpendicular leaves IN THE GAP (between sibling and node)
        const perpInGap = perpendicularPositions.filter(p =>
          Math.abs(p.x - node.x) < 5 &&
          p.y > siblingAbove.y &&
          p.y < node.y
        );
        if (perpInGap.length > 0) {
          const closestPerp = Math.max(...perpInGap.map(p => p.y));
          gapAbove = Math.min(gapAbove, node.y - closestPerp);
        }

        canPlaceAbove = gapAbove > SAFE_GAP;
        if (!canPlaceAbove) {
          console.log(`    ⚠ Node ${node.id}: gap above ${Math.round(gapAbove)}px < ${SAFE_GAP}px`);
        }
      } else {
        canPlaceAbove = true; // First child, no sibling above
      }

      // Check space below
      if (myIndex < siblings.length - 1) {
        const siblingBelow = siblings[myIndex + 1];
        let gapBelow = siblingBelow.y - node.y;

        // Check perpendicular leaves IN THE GAP (between node and sibling)
        const perpInGap = perpendicularPositions.filter(p =>
          Math.abs(p.x - node.x) < 5 &&
          p.y > node.y &&
          p.y < siblingBelow.y
        );
        if (perpInGap.length > 0) {
          const closestPerp = Math.min(...perpInGap.map(p => p.y));
          gapBelow = Math.min(gapBelow, closestPerp - node.y);
        }

        canPlaceBelow = gapBelow > SAFE_GAP;
        if (!canPlaceBelow) {
          console.log(`    ⚠ Node ${node.id}: gap below ${Math.round(gapBelow)}px < ${SAFE_GAP}px`);
        }
      } else {
        canPlaceBelow = true; // Last child, no sibling below
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
          perpendicularPositions.push({ x: node.x, y: node.y - PERPENDICULAR_OFFSET, node: children[0] });
          console.log(`    ✓ Node ${node.id}: child[0] can go UP`);
        }
        if (canPlaceBelow) {
          perpendicularNodes.add(children[1]);
          perpendicularPositions.push({ x: node.x, y: node.y + PERPENDICULAR_OFFSET, node: children[1] });
          console.log(`    ✓ Node ${node.id}: child[1] can go DOWN`);
        }

      } else if (child0IsLeaf && !child1IsLeaf) {
        // Only child[0] is leaf - use best available direction
        if (canPlaceAbove) {
          perpendicularNodes.add(children[0]);
          perpendicularPositions.push({ x: node.x, y: node.y - PERPENDICULAR_OFFSET, node: children[0] });
          console.log(`    ✓ Node ${node.id}: child[0] (only leaf) can go UP`);
        } else if (canPlaceBelow) {
          perpendicularNodes.add(children[0]);
          perpendicularPositions.push({ x: node.x, y: node.y + PERPENDICULAR_OFFSET, node: children[0] });
          console.log(`    ✓ Node ${node.id}: child[0] (only leaf) can go DOWN`);
        }

      } else if (!child0IsLeaf && child1IsLeaf) {
        // Only child[1] is leaf - use best available direction
        if (canPlaceAbove) {
          perpendicularNodes.add(children[1]);
          perpendicularPositions.push({ x: node.x, y: node.y - PERPENDICULAR_OFFSET, node: children[1] });
          console.log(`    ✓ Node ${node.id}: child[1] (only leaf) can go UP`);
        } else if (canPlaceBelow) {
          perpendicularNodes.add(children[1]);
          perpendicularPositions.push({ x: node.x, y: node.y + PERPENDICULAR_OFFSET, node: children[1] });
          console.log(`    ✓ Node ${node.id}: child[1] (only leaf) can go DOWN`);
        }
      }
    } else if (children.length === 3) {
      const child0IsLeaf = children[0].isLeaf && children[0].period <= 3 && children[0].children.length === 0;
      const child2IsLeaf = children[2].isLeaf && children[2].period <= 3 && children[2].children.length === 0;

      if (canPlaceAbove && child0IsLeaf) {
        perpendicularNodes.add(children[0]);
        perpendicularPositions.push({ x: node.x, y: node.y - PERPENDICULAR_OFFSET, node: children[0] });
        console.log(`    ✓ Node ${node.id}: child[0] can go UP`);
      }
      if (canPlaceBelow && child2IsLeaf) {
        perpendicularNodes.add(children[2]);
        perpendicularPositions.push({ x: node.x, y: node.y + PERPENDICULAR_OFFSET, node: children[2] });
        console.log(`    ✓ Node ${node.id}: child[2] can go DOWN`);
      }
    }
  });

  console.log(`  Total perpendicular leaves: ${perpendicularNodes.size}`);

  // PASS 2: Apply positioning using space-based detection with cascade awareness
  allNodes.forEach(node => {
    if (node.isLeaf) return;

    const children = node.children;
    const leafChildren = children.filter(c => c.isLeaf && c.period <= 3);

    if (leafChildren.length === 0) return;

    // Determine if there's enough SPACE for perpendicular placement (accounting for Pass 1 placements)
    let canPlaceAbove, canPlaceBelow;

    if (!node.parent) {
      canPlaceAbove = true;
      canPlaceBelow = true;
    } else {
      const grandparent = node.parent;
      const siblings = grandparent.children;
      const myIndex = siblings.indexOf(node);

      // Check space above
      if (myIndex > 0) {
        const siblingAbove = siblings[myIndex - 1];
        let gapAbove = node.y - siblingAbove.y;

        // Check if sibling above is perpendicular (effectively not blocking)
        if (perpendicularNodes.has(siblingAbove)) {
          // Sibling won't be at its original position, check further up
          if (myIndex > 1) {
            const nextSiblingAbove = siblings[myIndex - 2];
            gapAbove = node.y - nextSiblingAbove.y;
          } else {
            gapAbove = Infinity; // Only perpendicular sibling above
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
          gapAbove = Math.min(gapAbove, node.y - closestPerp);
        }

        canPlaceAbove = gapAbove > SAFE_GAP;
      } else {
        canPlaceAbove = true;
      }

      // Check space below
      if (myIndex < siblings.length - 1) {
        const siblingBelow = siblings[myIndex + 1];
        let gapBelow = siblingBelow.y - node.y;

        // Check if sibling below is perpendicular
        if (perpendicularNodes.has(siblingBelow)) {
          if (myIndex < siblings.length - 2) {
            const nextSiblingBelow = siblings[myIndex + 2];
            gapBelow = nextSiblingBelow.y - node.y;
          } else {
            gapBelow = Infinity;
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
          gapBelow = Math.min(gapBelow, closestPerp - node.y);
        }

        canPlaceBelow = gapBelow > SAFE_GAP;
      } else {
        canPlaceBelow = true;
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
          children[0].y = node.y - PERPENDICULAR_OFFSET;
          child0Perpendicular = true;
        }
        if (canPlaceBelow) {
          children[1].x = node.x;
          children[1].y = node.y + PERPENDICULAR_OFFSET;
          child1Perpendicular = true;
        }
        // If only one direction available, both try to use it (handled above)

      } else if (child0IsLeaf && !child1IsLeaf) {
        // Only child[0] is leaf - place it in best available direction
        if (canPlaceAbove) {
          children[0].x = node.x;
          children[0].y = node.y - PERPENDICULAR_OFFSET;
          child0Perpendicular = true;
        } else if (canPlaceBelow) {
          children[0].x = node.x;
          children[0].y = node.y + PERPENDICULAR_OFFSET;
          child0Perpendicular = true;
        }

      } else if (!child0IsLeaf && child1IsLeaf) {
        // Only child[1] is leaf - place it in best available direction
        if (canPlaceAbove) {
          children[1].x = node.x;
          children[1].y = node.y - PERPENDICULAR_OFFSET;
          child1Perpendicular = true;
        } else if (canPlaceBelow) {
          children[1].x = node.x;
          children[1].y = node.y + PERPENDICULAR_OFFSET;
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
        children[0].y = node.y - PERPENDICULAR_OFFSET;
        child0Perpendicular = true;
      }

      if (canPlaceBelow && child2IsLeaf) {
        children[2].x = node.x;
        children[2].y = node.y + PERPENDICULAR_OFFSET;
        child2Perpendicular = true;
      }

      // Force middle child horizontal if either outer child goes perpendicular
      if (child0Perpendicular || child2Perpendicular) {
        children[1].y = node.y; // Force horizontal (0° angle)
      }
      // If neither outer child perpendicular, preserve D3's natural layout
    }
  });

  console.log('✓ Space-aware perpendicular placement complete');
}

export function renderTree(root, allNodes) {
  const svg = document.getElementById('tree-svg');

  svg.innerHTML = `
    <defs>
      <filter id="drop-shadow" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="2" dy="2" stdDeviation="3" flood-opacity="0.4"/>
      </filter>
      <marker id="arrowhead" markerWidth="10" markerHeight="7"
              refX="9" refY="3.5" orient="auto" markerUnits="strokeWidth">
        <polygon points="0 0, 10 3.5, 0 7" fill="#374151"/>
      </marker>
    </defs>
    <g id="edges-layer"></g>
    <g id="nodes-layer"></g>
  `;

  allNodes.forEach(node => {
    if (!node.isLeaf) {
      node.children.forEach((child, index) => {
        renderEdge(node, child, index);
      });
    }
  });

  allNodes.forEach(node => {
    if (node.isLeaf) {
      renderTerminalNode(node);
    } else {
      renderDecisionNode(node);
    }
  });
}

function renderEdge(parent, child, childIndex) {
  const layer = document.getElementById('edges-layer');

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("id", `edge-${parent.id}-${child.id}`);
  path.setAttribute("d", getEdgePath(parent, child));
  path.setAttribute("fill", "none");
  path.setAttribute("stroke", "#374151");
  path.setAttribute("stroke-width", "2");
  path.setAttribute("marker-end", "url(#arrowhead)");

  layer.appendChild(path);

  // Add edge label
  const labels = ['a', 'b', 'c'];
  const label = labels[childIndex];

  renderEdgeLabel(parent, child, label);
}

function renderEdgeLabel(parent, child, label) {
  const layer = document.getElementById('edges-layer');

  const x1 = parent.x;
  const y1 = parent.y;
  const x2 = child.x;
  const y2 = child.y;

  const NODE_RADIUS = 24;
  const GAP = 1;
  const ARROW_EXTENSION = 2;

  const isPerpendicular = Math.abs(x2 - x1) < 5;

  let labelX, labelY;

  if (isPerpendicular) {
    // Vertical edge - label to the left of the edge
    const direction = y2 > y1 ? 1 : -1;
    const startY = y1 + (NODE_RADIUS * direction);
    const endY = y2 - ((NODE_RADIUS + GAP + ARROW_EXTENSION) * direction);

    labelX = x1 - 12; // 12px to the left
    labelY = (startY + endY) / 2; // Midpoint of actual edge (excluding arrow)
  } else {
    // Horizontal curved edge - label above the curve at parametric midpoint
    const startX = x1 + NODE_RADIUS;
    const endX = x2 - (NODE_RADIUS + GAP + ARROW_EXTENSION);

    const midY = (y1 + y2) / 2;
    const offset = (y2 - y1) * 0.15; // Same offset as the curve

    // At parametric t=0.5, the curve is at:
    // x = (startX + endX) / 2
    // y = midY - 0.5 * offset
    labelX = (startX + endX) / 2;
    labelY = (midY - 0.5 * offset) - 8; // 8px above the curve at its midpoint
  }

  const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
  text.setAttribute("x", labelX);
  text.setAttribute("y", labelY);
  text.setAttribute("fill", "#374151");
  text.setAttribute("font-size", "12");
  text.setAttribute("font-weight", "normal");
  text.setAttribute("text-anchor", "middle");
  text.setAttribute("dominant-baseline", "central");
  text.textContent = label;

  layer.appendChild(text);
}

function getEdgePath(parent, child) {
  const x1 = parent.x;
  const y1 = parent.y;
  const x2 = child.x;
  const y2 = child.y;

  const NODE_RADIUS = 24;
  const GAP = 1; // Gap between arrow tip and child node
  const ARROW_EXTENSION = 2; // Arrowhead extends beyond line endpoint

  // Check if this is a perpendicular edge (90° placement)
  const isPerpendicular = Math.abs(x2 - x1) < 5; // Nearly same x position

  if (isPerpendicular) {
    // Vertical edge for perpendicular leaves
    const direction = y2 > y1 ? 1 : -1; // Down or up
    const startY = y1 + (NODE_RADIUS * direction); // Start at edge of parent circle
    const endY = y2 - ((NODE_RADIUS + GAP + ARROW_EXTENSION) * direction); // Gap only at arrow tip

    return `M ${x1} ${startY} L ${x2} ${endY}`;
  } else {
    // Normal curved edge for horizontal layout
    const startX = x1 + NODE_RADIUS; // Start at edge of parent circle
    const endX = x2 - (NODE_RADIUS + GAP + ARROW_EXTENSION); // Gap only at arrow tip

    const midX = (startX + endX) / 2;
    const midY = (y1 + y2) / 2;
    const offset = (y2 - y1) * 0.15;

    return `M ${startX} ${y1} Q ${midX} ${midY - offset} ${endX} ${y2}`;
  }
}

function renderDecisionNode(node) {
  const layer = document.getElementById('nodes-layer');

  const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
  group.setAttribute("id", `node-${node.id}`);
  group.setAttribute("transform", `translate(${node.x}, ${node.y})`);

  const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  circle.setAttribute("r", "24");
  circle.setAttribute("fill", COLORS[node.player]);
  circle.setAttribute("filter", "url(#drop-shadow)");

  const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
  label.setAttribute("fill", "white");
  label.setAttribute("font-size", "18");
  label.setAttribute("font-weight", "bold");
  label.setAttribute("text-anchor", "middle");
  label.setAttribute("dominant-baseline", "central");
  label.textContent = node.player;

  group.appendChild(circle);
  group.appendChild(label);
  layer.appendChild(group);
}

function renderTerminalNode(node) {
  const layer = document.getElementById('nodes-layer');

  const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
  group.setAttribute("id", `node-${node.id}`);
  group.setAttribute("transform", `translate(${node.x}, ${node.y})`);

  const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  circle.setAttribute("r", "24");
  circle.setAttribute("fill", "#E5E7EB");
  circle.setAttribute("stroke", "#9CA3AF");
  circle.setAttribute("stroke-width", "2");
  circle.setAttribute("filter", "url(#drop-shadow)");
  group.appendChild(circle);

  [-8, 8].forEach(yPos => {
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", "-18");
    line.setAttribute("x2", "18");
    line.setAttribute("y1", yPos);
    line.setAttribute("y2", yPos);
    line.setAttribute("stroke", "#9CA3AF");
    line.setAttribute("stroke-width", "1");
    group.appendChild(line);
  });

  const yPositions = [-16, 0, 16];
  node.payoffs.forEach((payoff, i) => {
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("y", yPositions[i]);
    text.setAttribute("fill", "#374151");
    text.setAttribute("font-size", "14");
    text.setAttribute("font-weight", "bold");
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("dominant-baseline", "central");
    text.textContent = payoff;
    group.appendChild(text);
  });

  layer.appendChild(group);
}
