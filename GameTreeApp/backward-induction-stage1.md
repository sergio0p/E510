# Stage 1: Tree Generation + Static SVG Rendering

## Instructions for Claude Code

Build a browser-based visualization that generates a random extensive-form game tree and renders it as a static SVG. No interaction, no animation yet — just generate and display.

**Create these files:**
```
/backward-induction/
  index.html
  style.css
  js/
    main.js
    tree-generator.js
    tree-renderer.js
```

**Do NOT implement yet:**
- Click handlers on edges
- Any animations (shake, explosion, contraction)
- GSAP
- Game state machine
- Frontier detection
- Best response calculation

Just generate a tree and draw it.

---

## Game Tree Rules

1. **Periods:** 0, 1, 2, 3, 4
2. **Players:** {1, 2, 3}
3. **Actions per node:** {0, 2, 3} where 0 = leaf (terminal node)
4. **Root (period 0):** Must have 2 or 3 actions (never 0)
5. **Periods 1–3:** Randomly choose 0, 2, or 3 actions
6. **Period 4:** Forced leaves (no choices)
7. **Player constraint:** A node's player cannot equal its parent's player
8. **Payoffs:** Each leaf has 3 integers (one per player). Each player must have all distinct payoff values across leaves (guarantees unique SPNE)

---

## index.html

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Backward Induction</title>
  <link href="https://fonts.googleapis.com/css2?family=STIX+Two+Text:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div id="container">
    <svg id="tree-svg"></svg>
  </div>
  <button id="new-game">New Game</button>
  <script type="module" src="js/main.js"></script>
</body>
</html>
```

---

## style.css

```css
* {
  box-sizing: border-box;
}

body {
  font-family: 'STIX Two Text', serif;
  background: #FAFAFA;
  margin: 0;
  padding: 20px;
}

#container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}

#tree-svg {
  width: 100%;
  height: 700px;
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
}

#new-game {
  margin-top: 20px;
  padding: 10px 24px;
  font-family: inherit;
  font-size: 16px;
  background: #374151;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

#new-game:hover {
  background: #1F2937;
}
```

---

## js/tree-generator.js

```javascript
// Generate complete random tree
export function generateTree() {
  const root = createRootNode();
  expandNode(root);
  
  const allNodes = [];
  const allLeaves = [];
  collectNodes(root, allNodes, allLeaves);
  
  assignPayoffs(allLeaves);
  
  return { root, allNodes, allLeaves };
}

function createRootNode() {
  return {
    id: 'n0',
    player: randomChoice([1, 2, 3]),
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

function expandNode(node) {
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
      const actions = randomChoice([0, 2, 3]);
      
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
        // Decision node
        const possiblePlayers = [1, 2, 3].filter(p => p !== node.player);
        child = {
          id: childId,
          player: randomChoice(possiblePlayers),
          period: childPeriod,
          actions: actions,
          payoffs: null,
          children: [],
          parent: node,
          isLeaf: false,
          x: 0,
          y: 0
        };
        expandNode(child);
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

function assignPayoffs(leaves) {
  const n = leaves.length;
  
  const range = [];
  for (let i = -20; i <= 20; i++) {
    range.push(i);
  }
  
  for (let playerIndex = 0; playerIndex < 3; playerIndex++) {
    const shuffled = shuffle([...range]);
    const values = shuffled.slice(0, n);
    
    for (let i = 0; i < n; i++) {
      if (!leaves[i].payoffs) {
        leaves[i].payoffs = [null, null, null];
      }
      leaves[i].payoffs[playerIndex] = values[i];
    }
  }
}

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
```

---

## js/tree-renderer.js

```javascript
import { hierarchy, tree } from 'https://cdn.jsdelivr.net/npm/d3-hierarchy@3/+esm';

const COLORS = {
  1: '#DC2626',
  2: '#16A34A',
  3: '#2563EB'
};

export function computeLayout(root, width, height) {
  const margin = 60;
  
  const h = hierarchy(root, d => d.children);
  
  const treeLayout = tree().size([height - margin * 2, width - margin * 2]);
  
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
```

---

## js/main.js

```javascript
import { generateTree } from './tree-generator.js';
import { computeLayout, renderTree } from './tree-renderer.js';

function init() {
  const svg = document.getElementById('tree-svg');
  const width = svg.clientWidth || 1200;
  const height = svg.clientHeight || 700;
  
  const { root, allNodes, allLeaves } = generateTree();
  
  // Debug logging
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
  
  computeLayout(root, width, height);
  renderTree(root, allNodes);
}

document.addEventListener('DOMContentLoaded', () => {
  init();
  document.getElementById('new-game').onclick = init;
});
```

---

## Testing Checklist

After building, open the page and click "New Game" several times. Verify:

- [ ] Root has 2 or 3 children (never 0 or 1)
- [ ] Root is colored red, green, or blue with player number
- [ ] No two consecutive nodes on any path have the same player
- [ ] No node has exactly 1 child (always 0, 2, or 3)
- [ ] Terminal nodes show 3 payoffs with divider lines
- [ ] Edges are curved with arrowheads
- [ ] Nodes have drop shadows
- [ ] Console shows "Player X payoffs unique: true" for all 3 players
- [ ] "New Game" generates a fresh tree
- [ ] No overlapping nodes

---

When all checks pass, return for Stage 2.
