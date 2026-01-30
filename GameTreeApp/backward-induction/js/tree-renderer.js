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

export function renderTree(root, allNodes) {
  const svg = document.getElementById('tree-svg');

  svg.innerHTML = `
    <defs>
      <filter id="drop-shadow" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="2" dy="2" stdDeviation="2" flood-opacity="0.3"/>
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
      node.children.forEach(child => {
        renderEdge(node, child);
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

function renderEdge(parent, child) {
  const layer = document.getElementById('edges-layer');

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("id", `edge-${parent.id}-${child.id}`);
  path.setAttribute("d", getEdgePath(parent, child));
  path.setAttribute("fill", "none");
  path.setAttribute("stroke", "#374151");
  path.setAttribute("stroke-width", "2");
  path.setAttribute("marker-end", "url(#arrowhead)");

  layer.appendChild(path);
}

function getEdgePath(parent, child) {
  const x1 = parent.x;
  const y1 = parent.y;
  const x2 = child.x;
  const y2 = child.y;

  const startX = x1 + 24;
  const endX = x2 - 24;

  const midX = (startX + endX) / 2;
  const midY = (y1 + y2) / 2;
  const offset = (y2 - y1) * 0.15;

  return `M ${startX} ${y1} Q ${midX} ${midY - offset} ${endX} ${y2}`;
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
  label.setAttribute("font-size", "16");
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

  const yPositions = [-14, 0, 14];
  node.payoffs.forEach((payoff, i) => {
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("y", yPositions[i]);
    text.setAttribute("fill", "#374151");
    text.setAttribute("font-size", "12");
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("dominant-baseline", "central");
    text.textContent = payoff;
    group.appendChild(text);
  });

  layer.appendChild(group);
}
