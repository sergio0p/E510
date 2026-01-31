// Animation configuration (at 0.2x playback speed - very slow)
const CONFIG = {
  particleCount: 20,
  particleColors: ['#000000', '#1F1F1F', '#3F3F3F'], // Black shades instead of grey
  explosionDuration: 2.5,        // 0.5 / 0.2
  explosionSpread: 60,
  contractionDuration: 1.0,      // Reduced from 2.0
  pauseBetweenNodes: 0.5,        // Reduced from 2.0
  blackFillDuration: 0.3         // Duration to fill nodes with black before explosion
};

// Main animation controller for a single frontier round
export function animateFrontierResolution(solvedNodes, state, callbacks) {
  // Create a queue of nodes to animate sequentially
  const queue = [...solvedNodes];

  function animateNext() {
    if (queue.length === 0) {
      // All animations complete
      callbacks.onAllAnimationsComplete();
      return;
    }

    const node = queue.shift();
    animateNodeResolution(node, state, () => {
      // Small pause before next node
      gsap.delayedCall(CONFIG.pauseBetweenNodes, animateNext);
    });
  }

  // Start the chain
  animateNext();
}

// Animate a single node's resolution
function animateNodeResolution(node, state, onComplete) {
  const optimalChild = node.children[node.optimalChildIndex];
  const nonOptimalChildren = node.children.filter((_, i) => i !== node.optimalChildIndex);

  // Create timeline for this node
  const tl = gsap.timeline({
    onComplete: onComplete
  });

  // Phase 1a: Fill non-optimal nodes with black ink (covering payoffs)
  nonOptimalChildren.forEach(child => {
    const subtreeNodes = getSubtreeNodes(child);

    subtreeNodes.forEach(nodeId => {
      const nodeGroup = document.getElementById(`node-${nodeId}`);
      if (nodeGroup) {
        const circle = nodeGroup.querySelector('circle');
        if (circle) {
          tl.to(circle, {
            fill: '#000000',
            duration: CONFIG.blackFillDuration,
            ease: "power2.in"
          }, 0);
        }
      }
    });
  });

  // Phase 1b: Brief pause to see the black marking
  const blackFillEndTime = CONFIG.blackFillDuration;

  // Phase 1c: Explode non-optimal branches
  nonOptimalChildren.forEach(child => {
    // Get all elements in this subtree
    const subtreeElements = getSubtreeElements(child);
    const edgeId = `edge-${node.id}-${child.id}`;
    const edgeLabelId = `edge-label-${node.id}-${child.id}`;

    // Create particles at each element position
    subtreeElements.forEach(elId => {
      const el = document.getElementById(elId);
      if (el) {
        createExplosionParticles(el, tl, blackFillEndTime);
      }
    });

    // Create particles for the edge
    const edgeGroup = document.getElementById(edgeId);
    if (edgeGroup) {
      createEdgeExplosionParticles(edgeGroup, tl, blackFillEndTime);
    }

    // Fade out the actual elements
    subtreeElements.forEach(elId => {
      const el = document.getElementById(elId);
      if (el) {
        tl.to(el, {
          opacity: 0,
          duration: CONFIG.explosionDuration,
          ease: "power2.out"
        }, blackFillEndTime);
      }
    });

    // Fade out the edge
    if (edgeGroup) {
      tl.to(edgeGroup, {
        opacity: 0,
        duration: CONFIG.explosionDuration,
        ease: "power2.out"
      }, blackFillEndTime);
    }

    // Fade out the edge label
    const edgeLabel = document.getElementById(edgeLabelId);
    if (edgeLabel) {
      tl.to(edgeLabel, {
        opacity: 0,
        duration: CONFIG.explosionDuration,
        ease: "power2.out"
      }, blackFillEndTime);
    }
  });

  // Phase 2: Contract optimal leaf toward parent
  const optimalEdgeGroup = document.getElementById(`edge-${node.id}-${optimalChild.id}`);
  const optimalEdgeLabel = document.getElementById(`edge-label-${node.id}-${optimalChild.id}`);
  const optimalNodeGroup = document.getElementById(`node-${optimalChild.id}`);
  const parentNodeGroup = document.getElementById(`node-${node.id}`);

  if (optimalNodeGroup && parentNodeGroup) {
    // Get edge paths
    const mainPath = optimalEdgeGroup ? optimalEdgeGroup.querySelector('.edge-main') : null;
    const taperPath = optimalEdgeGroup ? optimalEdgeGroup.querySelector('.edge-taper') : null;

    // Track current leaf position for edge contraction
    const leafPos = { x: optimalChild.x, y: optimalChild.y };

    // Move the leaf from its current position to the parent's position
    tl.to(leafPos, {
      x: node.x,
      y: node.y,
      duration: CONFIG.contractionDuration,
      ease: "power2.inOut",
      onUpdate: () => {
        // Update the node position
        optimalNodeGroup.setAttribute('transform', `translate(${leafPos.x}, ${leafPos.y})`);

        // Dynamically recalculate edge path as leaf moves
        if (mainPath && taperPath) {
          const paths = calculateEdgePaths(node.x, node.y, leafPos.x, leafPos.y);
          mainPath.setAttribute('d', paths.mainPath);
          taperPath.setAttribute('d', paths.taperPath);
        }
      }
    });

    // Fade out the optimal edge label
    if (optimalEdgeLabel) {
      tl.to(optimalEdgeLabel, {
        opacity: 0,
        duration: CONFIG.contractionDuration * 0.5,
        ease: "power2.inOut"
      }, "<");
    }

    // Fade out the parent node as the leaf arrives
    tl.to(parentNodeGroup, {
      opacity: 0,
      duration: CONFIG.contractionDuration * 0.4,
      ease: "power2.in"
    }, `-=${CONFIG.contractionDuration * 0.25}`);

    // Fade out the edge at the very end when leaf reaches parent
    if (optimalEdgeGroup) {
      tl.to(optimalEdgeGroup, {
        opacity: 0,
        duration: CONFIG.contractionDuration * 0.15,
        ease: "power2.inOut"
      }, `-=${CONFIG.contractionDuration * 0.15}`);
    }
  }

  // Phase 4: Replace parent with leaf (handled in callback via state update)
  tl.call(() => {
    replaceParentWithLeaf(node, optimalChild, state);
  });
}

// Get all node IDs in a subtree (for filling with black)
function getSubtreeNodes(node) {
  const nodeIds = [node.id];

  if (!node.isLeaf && node.children) {
    node.children.forEach(child => {
      nodeIds.push(...getSubtreeNodes(child));
    });
  }

  return nodeIds;
}

// Get all SVG element IDs in a subtree
function getSubtreeElements(node) {
  const elements = [`node-${node.id}`];

  if (!node.isLeaf && node.children) {
    node.children.forEach(child => {
      elements.push(`edge-${node.id}-${child.id}`);
      elements.push(`edge-label-${node.id}-${child.id}`);
      elements.push(...getSubtreeElements(child));
    });
  }

  return elements;
}

// Create explosion particles for a node
function createExplosionParticles(element, timeline, startTime) {
  const bbox = element.getBBox();
  const transform = element.getAttribute('transform');

  // Parse transform to get actual position
  let cx = bbox.x + bbox.width / 2;
  let cy = bbox.y + bbox.height / 2;

  if (transform) {
    const match = transform.match(/translate\(([^,]+),\s*([^)]+)\)/);
    if (match) {
      cx = parseFloat(match[1]);
      cy = parseFloat(match[2]);
    }
  }

  const particlesLayer = document.getElementById('particles-layer');
  if (!particlesLayer) return;

  for (let i = 0; i < CONFIG.particleCount; i++) {
    const particle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    const size = Math.random() * 4 + 2;
    const color = CONFIG.particleColors[Math.floor(Math.random() * CONFIG.particleColors.length)];

    particle.setAttribute("r", size);
    particle.setAttribute("cx", cx);
    particle.setAttribute("cy", cy);
    particle.setAttribute("fill", color);
    particle.setAttribute("opacity", "1");
    particle.classList.add("particle");

    particlesLayer.appendChild(particle);

    // Random direction and distance
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * CONFIG.explosionSpread + 20;
    const targetX = cx + Math.cos(angle) * distance;
    const targetY = cy + Math.sin(angle) * distance;

    // Animate particle
    timeline.to(particle, {
      attr: { cx: targetX, cy: targetY },
      opacity: 0,
      duration: CONFIG.explosionDuration,
      ease: "power2.out",
      onComplete: () => particle.remove()
    }, startTime);
  }
}

// Create particles along an edge path
function createEdgeExplosionParticles(edgeGroup, timeline, startTime) {
  const pathElement = edgeGroup.querySelector('path.edge-main') || edgeGroup.querySelector('path');
  if (!pathElement) return;

  const particlesLayer = document.getElementById('particles-layer');
  if (!particlesLayer) return;

  // Get points along the path
  const pathLength = pathElement.getTotalLength();
  const numPoints = 5;

  for (let i = 0; i < numPoints; i++) {
    const point = pathElement.getPointAtLength((i / numPoints) * pathLength);

    // Create fewer particles per point along edge
    for (let j = 0; j < 4; j++) {
      const particle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      const size = Math.random() * 3 + 1;
      const color = CONFIG.particleColors[Math.floor(Math.random() * CONFIG.particleColors.length)];

      particle.setAttribute("r", size);
      particle.setAttribute("cx", point.x);
      particle.setAttribute("cy", point.y);
      particle.setAttribute("fill", color);
      particle.setAttribute("opacity", "1");
      particle.classList.add("particle");

      particlesLayer.appendChild(particle);

      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * 30 + 10;
      const targetX = point.x + Math.cos(angle) * distance;
      const targetY = point.y + Math.sin(angle) * distance;

      timeline.to(particle, {
        attr: { cx: targetX, cy: targetY },
        opacity: 0,
        duration: CONFIG.explosionDuration,
        ease: "power2.out",
        onComplete: () => particle.remove()
      }, startTime);
    }
  }
}

// Replace parent node with the optimal leaf
function replaceParentWithLeaf(parentNode, optimalChild, state) {
  // Update data structure
  parentNode.isLeaf = true;
  parentNode.payoffs = optimalChild.payoffs;
  parentNode.player = null;
  parentNode.children = [];
  parentNode.isSolved = false; // Reset for potential future rounds
  parentNode.optimalChildIndex = null;

  // Remove old SVG elements
  const oldParentGroup = document.getElementById(`node-${parentNode.id}`);
  const oldChildGroup = document.getElementById(`node-${optimalChild.id}`);
  const oldEdgeGroup = document.getElementById(`edge-${parentNode.id}-${optimalChild.id}`);
  const oldEdgeLabel = document.getElementById(`edge-label-${parentNode.id}-${optimalChild.id}`);

  if (oldParentGroup) oldParentGroup.remove();
  if (oldChildGroup) oldChildGroup.remove();
  if (oldEdgeGroup) oldEdgeGroup.remove();
  if (oldEdgeLabel) oldEdgeLabel.remove();

  // Update state arrays - remove the optimal child from tracking
  state.allNodes = state.allNodes.filter(n => n !== optimalChild);
  state.allLeaves = state.allLeaves.filter(l => l !== optimalChild);

  // Add parent to leaves if not already there
  if (!state.allLeaves.includes(parentNode)) {
    state.allLeaves.push(parentNode);
  }

  // Render new leaf node at parent's position
  renderReplacementLeaf(parentNode);
}

// Render a terminal node at the parent's position
function renderReplacementLeaf(node) {
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

  const numPlayers = node.payoffs.length;

  // Draw divider lines based on number of players
  if (numPlayers === 2) {
    // Single divider line for 2 players
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", "-18");
    line.setAttribute("x2", "18");
    line.setAttribute("y1", "0");
    line.setAttribute("y2", "0");
    line.setAttribute("stroke", "#9CA3AF");
    line.setAttribute("stroke-width", "1");
    group.appendChild(line);
  } else if (numPlayers === 3) {
    // Two divider lines for 3 players
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
  }

  // Position payoffs based on number of players
  let yPositions;
  if (numPlayers === 2) {
    yPositions = [-10, 10];
  } else if (numPlayers === 3) {
    yPositions = [-16, 0, 16];
  } else {
    // Fallback for single player
    yPositions = [0];
  }

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

// Calculate edge paths between two points (for dynamic contraction)
function calculateEdgePaths(x1, y1, x2, y2) {
  const NODE_RADIUS = 24;
  const GAP = 1;
  const ARROW_EXTENSION = 2;
  const SPLIT_POINT_HORIZONTAL = 0.97;
  const SPLIT_POINT_VERTICAL = 0.90;

  const isPerpendicular = Math.abs(x2 - x1) < 5;

  let mainPath, taperPath;

  if (isPerpendicular) {
    // Vertical edge
    const direction = y2 > y1 ? 1 : -1;
    const startY = y1 + (NODE_RADIUS * direction);
    const endY = y2 - ((NODE_RADIUS + GAP + ARROW_EXTENSION) * direction);
    const splitY = startY + (endY - startY) * SPLIT_POINT_VERTICAL;

    mainPath = `M ${x1} ${startY} L ${x1} ${splitY}`;
    taperPath = `M ${x1} ${splitY} L ${x1} ${endY}`;
  } else {
    // Horizontal curved edge
    const startX = x1 + NODE_RADIUS;
    const endX = x2 - (NODE_RADIUS + GAP + ARROW_EXTENSION);
    const midX = (startX + endX) / 2;
    const midY = (y1 + y2) / 2;
    const offset = (y2 - y1) * 0.15;

    // Split quadratic Bézier at specified point
    const t = SPLIT_POINT_HORIZONTAL;
    const splitX = (1-t)*(1-t)*startX + 2*(1-t)*t*midX + t*t*endX;
    const splitY = (1-t)*(1-t)*y1 + 2*(1-t)*t*(midY - offset) + t*t*y2;

    // Control points for the two segments
    const mainCtrlX = (1-t)*startX + t*midX;
    const mainCtrlY = (1-t)*y1 + t*(midY - offset);

    const taperCtrlX = (1-t)*midX + t*endX;
    const taperCtrlY = (1-t)*(midY - offset) + t*y2;

    mainPath = `M ${startX} ${y1} Q ${mainCtrlX} ${mainCtrlY} ${splitX} ${splitY}`;
    taperPath = `M ${splitX} ${splitY} Q ${taperCtrlX} ${taperCtrlY} ${endX} ${y2}`;
  }

  return { mainPath, taperPath };
}

// Growth/replay animation after completion
export function animateTreeGrowth(contractionHistory, originalTreeData, state, callbacks) {
  console.log('Growth replay:', contractionHistory.length, 'levels to restore');

  // Build SPNE path (set of edges that are part of optimal solution)
  const spnePath = new Set();
  contractionHistory.forEach(levelData => {
    levelData.forEach(nodeData => {
      const optimalChild = nodeData.children[nodeData.optimalChildIndex];
      const edgeKey = `${String(nodeData.nodeId)}-${String(optimalChild.id)}`;
      spnePath.add(edgeKey);
      console.log('SPNE edge:', edgeKey);
    });
  });
  console.log('Complete SPNE path:', Array.from(spnePath));

  // Reverse the history to replay in opposite order
  const growthSequence = [...contractionHistory].reverse();

  const GROWTH_DURATION = 0.5; // Half of contraction speed (faster)
  const PAUSE_BETWEEN_LEVELS = 1.0;

  let currentLevel = 0;

  // Helper to find node in original tree by id
  function findNodeInOriginalTree(node, id) {
    if (node.id === id) return node;
    if (node.children) {
      for (const child of node.children) {
        const found = findNodeInOriginalTree(child, id);
        if (found) return found;
      }
    }
    return null;
  }

  function growNextLevel() {
    if (currentLevel >= growthSequence.length) {
      // All levels grown
      callbacks.onReplayComplete();
      return;
    }

    const levelData = growthSequence[currentLevel];
    console.log(`Growing level ${currentLevel + 1}/${growthSequence.length}:`, levelData.map(n => n.nodeId));

    const tl = gsap.timeline({
      onComplete: () => {
        currentLevel++;
        gsap.delayedCall(PAUSE_BETWEEN_LEVELS, growNextLevel);
      }
    });

    // For each node in this level, restore it and grow its children
    levelData.forEach(nodeData => {
      const parentNode = state.allNodes.find(n => n.id === nodeData.nodeId);
      if (!parentNode) return;

      // Find parent in original tree to get correct data
      const originalParent = findNodeInOriginalTree(originalTreeData, nodeData.nodeId);
      if (!originalParent) return;

      // Restore parent as decision node (use original data)
      parentNode.isLeaf = false;
      parentNode.player = originalParent.player;
      parentNode.payoffs = null;
      parentNode.children = [];
      parentNode.optimalChildIndex = nodeData.optimalChildIndex;

      // Remove old leaf representation
      const oldLeafGroup = document.getElementById(`node-${parentNode.id}`);
      if (oldLeafGroup) oldLeafGroup.remove();

      // Render parent as decision node
      renderDecisionNodeForGrowth(parentNode);

      // Create and grow children (use ORIGINAL tree's full children, not history)
      originalParent.children.forEach((originalChild, childIndex) => {
        const originalChildData = originalChild;

        // Check if child already exists in state (was restored in previous level)
        let childNode = state.allNodes.find(n => n.id === originalChildData.id);
        let nodeAlreadyExists = false;

        if (childNode) {
          // Child already exists (was a parent in previous level)
          // Update its parent reference but DON'T remove from DOM
          childNode.parent = parentNode;
          nodeAlreadyExists = true;
        } else {
          // Child is new, create it
          childNode = {
            id: originalChildData.id,
            x: originalChildData.x,
            y: originalChildData.y,
            payoffs: originalChildData.payoffs ? [...originalChildData.payoffs] : null,
            isLeaf: originalChildData.isLeaf,
            player: originalChildData.player,
            parent: parentNode,
            children: []
          };

          state.allNodes.push(childNode);
          if (childNode.isLeaf) {
            state.allLeaves.push(childNode);
          }
        }

        parentNode.children.push(childNode);

        // Check if this edge is part of SPNE
        const edgeKey = `${parentNode.id}-${childNode.id}`;
        const isOptimal = spnePath.has(edgeKey);

        // Only render if node doesn't already exist
        if (!nodeAlreadyExists) {
          // Render child at parent position initially (for animation)
          renderChildForGrowth(childNode, parentNode, isOptimal);
        } else {
          // Node already exists - it might have been faded out during contraction
          // Reset its opacity and color (might have been filled black before explosion)
          const existingChildGroup = document.getElementById(`node-${childNode.id}`);
          if (existingChildGroup) {
            // Reset circle fill if it's a leaf node (was filled black before explosion)
            if (childNode.isLeaf) {
              const circle = existingChildGroup.querySelector('circle');
              if (circle) {
                // Animate color back to grey
                tl.to(circle, {
                  fill: '#E5E7EB',
                  duration: GROWTH_DURATION * 0.5,
                  ease: "power2.out"
                }, 0);
              }
            }

            // Fade in opacity
            tl.to(existingChildGroup, {
              opacity: 1,
              duration: GROWTH_DURATION * 0.5,
              ease: "power2.out"
            }, 0);
          }
        }

        // Always render edge (edges were not preserved from previous level)
        renderEdgeForGrowth(parentNode, childNode, childIndex, isOptimal);

        // Animate child growing from parent position to final position
        const childGroup = document.getElementById(`node-${childNode.id}`);
        if (childGroup && !nodeAlreadyExists) {
          // New node - animate from parent position
          tl.to(childGroup, {
            attr: { transform: `translate(${childNode.x}, ${childNode.y})` },
            opacity: 1,
            duration: GROWTH_DURATION,
            ease: "power2.out"
          }, 0);
        } else if (childGroup && nodeAlreadyExists) {
          // Existing node - already at correct position, but ensure it's visible
          gsap.set(childGroup, { opacity: 1 });
        }

        // Animate edge growing
        const edgeGroup = document.getElementById(`edge-${parentNode.id}-${childNode.id}`);
        if (edgeGroup) {
          const mainPath = edgeGroup.querySelector('.edge-main');
          const taperPath = edgeGroup.querySelector('.edge-taper');

          if (mainPath && taperPath) {
            // Animate edge from zero-length to full-length
            const growPos = { progress: 0 };
            tl.to(growPos, {
              progress: 1,
              duration: GROWTH_DURATION,
              ease: "power2.out",
              onUpdate: () => {
                const currentX = parentNode.x + (childNode.x - parentNode.x) * growPos.progress;
                const currentY = parentNode.y + (childNode.y - parentNode.y) * growPos.progress;
                const paths = calculateEdgePaths(parentNode.x, parentNode.y, currentX, currentY);
                mainPath.setAttribute('d', paths.mainPath);
                taperPath.setAttribute('d', paths.taperPath);
              }
            }, 0);
          }
        }

        // Render edge label and fade it in alongside edge growth
        renderEdgeLabelForGrowth(parentNode, childNode, childIndex);
        const edgeLabel = document.getElementById(`edge-label-${parentNode.id}-${childNode.id}`);
        if (edgeLabel) {
          tl.to(edgeLabel,
            { opacity: 1, duration: GROWTH_DURATION, ease: "power2.out" },
            0  // Start at same time as edge growth
          );
        }
      });
    });
  }

  // Start the growth sequence
  growNextLevel();
}

// Helper functions for growth rendering
function renderDecisionNodeForGrowth(node) {
  const layer = document.getElementById('nodes-layer');
  const COLORS = { 1: '#DC2626', 2: '#16A34A', 3: '#2563EB' };

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

function renderChildForGrowth(node, parent, isOptimal) {
  const layer = document.getElementById('nodes-layer');
  const COLORS = { 1: '#DC2626', 2: '#16A34A', 3: '#2563EB' };

  const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
  group.setAttribute("id", `node-${node.id}`);
  group.setAttribute("transform", `translate(${parent.x}, ${parent.y})`); // Start at parent position

  if (node.isLeaf) {
    // Terminal node with payoffs
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("r", "24");
    circle.setAttribute("fill", "#E5E7EB");
    circle.setAttribute("stroke", "#9CA3AF");
    circle.setAttribute("stroke-width", "2");
    circle.setAttribute("filter", "url(#drop-shadow)");
    group.appendChild(circle);

    const numPlayers = node.payoffs ? node.payoffs.length : 3;

    // Draw divider lines based on number of players
    if (numPlayers === 2) {
      // Single divider line for 2 players
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", "-18");
      line.setAttribute("x2", "18");
      line.setAttribute("y1", "0");
      line.setAttribute("y2", "0");
      line.setAttribute("stroke", "#9CA3AF");
      line.setAttribute("stroke-width", "1");
      group.appendChild(line);
    } else if (numPlayers === 3) {
      // Two divider lines for 3 players
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
    }

    // Position payoffs based on number of players
    let yPositions;
    if (numPlayers === 2) {
      yPositions = [-10, 10];
    } else if (numPlayers === 3) {
      yPositions = [-16, 0, 16];
    } else {
      yPositions = [0];
    }

    if (node.payoffs) {
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
    }
  } else {
    // Decision node with player number and color
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
  }

  layer.appendChild(group);
}

function renderEdgeForGrowth(parent, child, childIndex, isOptimal) {
  const layer = document.getElementById('edges-layer');

  // Check if edge already exists (might have been faded out during contraction)
  let group = document.getElementById(`edge-${parent.id}-${child.id}`);

  if (group) {
    // Edge already exists - just reset its opacity and color
    group.style.opacity = '1';
    const mainPath = group.querySelector('.edge-main');
    const taperPath = group.querySelector('.edge-taper');
    if (mainPath) {
      mainPath.setAttribute("stroke", isOptimal ? "#DC2626" : "#374151");
      mainPath.setAttribute("stroke-width", isOptimal ? "3" : "2");
    }
    if (taperPath) {
      taperPath.setAttribute("stroke", isOptimal ? "#DC2626" : "#374151");
      taperPath.setAttribute("stroke-width", isOptimal ? "3" : "2");
      taperPath.setAttribute("marker-end", isOptimal ? "url(#arrowhead-red)" : "url(#arrowhead)");
    }
    return;
  }

  // Create new edge
  group = document.createElementNS("http://www.w3.org/2000/svg", "g");
  group.setAttribute("id", `edge-${parent.id}-${child.id}`);

  // Start with zero-length edge (will be animated)
  const hitArea = document.createElementNS("http://www.w3.org/2000/svg", "path");
  hitArea.setAttribute("class", "edge-hit");
  hitArea.setAttribute("d", `M ${parent.x} ${parent.y} L ${parent.x} ${parent.y}`);
  hitArea.setAttribute("fill", "none");
  hitArea.setAttribute("stroke", "transparent");
  hitArea.setAttribute("stroke-width", "10");
  hitArea.setAttribute("pointer-events", "none");

  const visibleMain = document.createElementNS("http://www.w3.org/2000/svg", "path");
  visibleMain.setAttribute("class", "edge edge-main");
  visibleMain.setAttribute("d", `M ${parent.x} ${parent.y} L ${parent.x} ${parent.y}`);
  visibleMain.setAttribute("fill", "none");
  visibleMain.setAttribute("stroke", isOptimal ? "#DC2626" : "#374151");
  visibleMain.setAttribute("stroke-width", isOptimal ? "3" : "2");
  visibleMain.setAttribute("pointer-events", "none");

  const visibleTaper = document.createElementNS("http://www.w3.org/2000/svg", "path");
  visibleTaper.setAttribute("class", "edge edge-taper");
  visibleTaper.setAttribute("d", `M ${parent.x} ${parent.y} L ${parent.x} ${parent.y}`);
  visibleTaper.setAttribute("fill", "none");
  visibleTaper.setAttribute("stroke", isOptimal ? "#DC2626" : "#374151");
  visibleTaper.setAttribute("stroke-width", isOptimal ? "3" : "2");
  visibleTaper.setAttribute("marker-end", isOptimal ? "url(#arrowhead-red)" : "url(#arrowhead)");
  visibleTaper.setAttribute("pointer-events", "none");

  group.appendChild(hitArea);
  group.appendChild(visibleMain);
  group.appendChild(visibleTaper);
  layer.appendChild(group);
}

function renderEdgeLabelForGrowth(parent, child, childIndex) {
  const layer = document.getElementById('edges-layer');
  const labels = ['a', 'b', 'c'];
  const label = labels[childIndex];

  // Check if label already exists (might have been faded out during contraction)
  const existingLabel = document.getElementById(`edge-label-${parent.id}-${child.id}`);
  if (existingLabel) {
    existingLabel.style.opacity = '0'; // Start from 0 for animation
    return;
  }

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
    const direction = y2 > y1 ? 1 : -1;
    const startY = y1 + (NODE_RADIUS * direction);
    const endY = y2 - ((NODE_RADIUS + GAP + ARROW_EXTENSION) * direction);
    labelX = x1 - 12;
    labelY = (startY + endY) / 2;
  } else {
    const startX = x1 + NODE_RADIUS;
    const endX = x2 - (NODE_RADIUS + GAP + ARROW_EXTENSION);
    const midY = (y1 + y2) / 2;
    const offset = (y2 - y1) * 0.15;
    labelX = (startX + endX) / 2;
    labelY = (midY - 0.5 * offset) - 8;
  }

  const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
  text.setAttribute("id", `edge-label-${parent.id}-${child.id}`);
  text.setAttribute("x", labelX);
  text.setAttribute("y", labelY);
  text.setAttribute("fill", "#374151");
  text.setAttribute("font-size", "12");
  text.setAttribute("font-weight", "normal");
  text.setAttribute("text-anchor", "middle");
  text.setAttribute("dominant-baseline", "central");
  text.setAttribute("opacity", "0"); // Start invisible
  text.textContent = label;

  layer.appendChild(text);
}

// Export config for potential tweaking
export { CONFIG as ANIMATION_CONFIG };
