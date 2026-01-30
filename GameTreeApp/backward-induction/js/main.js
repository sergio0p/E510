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
