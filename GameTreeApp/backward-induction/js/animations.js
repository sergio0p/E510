// Animation configuration (at 0.2x playback speed - very slow)
const CONFIG = {
  particleCount: 20,
  particleColors: ['#000000', '#1F1F1F', '#3F3F3F'], // Black shades instead of grey
  explosionDuration: 2.5,        // 0.5 / 0.2
  explosionSpread: 60,
  contractionDuration: 1.0,      // Reduced from 2.0
  pauseBetweenNodes: 2.0,        // 0.4 / 0.2
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

  // Divider lines for 3 players
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

  // Payoff text
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

// Export config for potential tweaking
export { CONFIG as ANIMATION_CONFIG };
