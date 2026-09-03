import { buildGameTree } from './tree-builder.js';
import { computeLayout, adjustEarlyLeaves, redistributeColumns, renderTree, applyHighlight } from './tree-renderer.js';
import { VARIATIONS } from './highlight-spec.js';
import { mulberry32, shuffleWithPrng, randomSeed } from './shuffle.js';

const LETTERS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l'];
const CELL_SVG_WIDTH  = 700;
const CELL_SVG_HEIGHT = 900;

function getSeed() {
  const params = new URLSearchParams(window.location.search);
  const fromUrl = params.get('seed');
  if (fromUrl !== null) {
    const n = parseInt(fromUrl, 10);
    if (Number.isFinite(n) && n >= 0) return n >>> 0;
  }
  return randomSeed();
}

function setSeedDisplay(seed) {
  document.getElementById('seed-value').textContent = String(seed);
}

function fillAnswerKey(orderedVariations) {
  const list = document.getElementById('answer-key-list');
  list.innerHTML = '';
  orderedVariations.forEach((v, i) => {
    const li = document.createElement('li');
    li.textContent = `${LETTERS[i]}) ${v.label}`;
    list.appendChild(li);
  });
}

function renderCell(letter, variation, gridEl) {
  const cell = document.createElement('section');
  cell.className = 'cell';

  const { root, allNodes } = buildGameTree(letter);

  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.classList.add('cell-svg');
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  cell.appendChild(svg);

  computeLayout(root, CELL_SVG_WIDTH, CELL_SVG_HEIGHT);
  adjustEarlyLeaves(allNodes);
  redistributeColumns(allNodes);

  const NODE_RADIUS = 34;
  const PADDING = 30;
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  allNodes.forEach(n => {
    minX = Math.min(minX, n.x - NODE_RADIUS);
    maxX = Math.max(maxX, n.x + NODE_RADIUS);
    minY = Math.min(minY, n.y - NODE_RADIUS);
    maxY = Math.max(maxY, n.y + NODE_RADIUS);
  });
  minX -= PADDING; maxX += PADDING; minY -= PADDING; maxY += PADDING;
  svg.setAttribute('viewBox', `${minX} ${minY} ${maxX - minX} ${maxY - minY}`);

  renderTree(root, allNodes, svg);
  applyHighlight(svg, variation.redEdges, letter);

  // In-SVG cell label, offset SE from top-left of viewBox
  const label = document.createElementNS(svgNS, 'text');
  label.setAttribute('x', minX + 80);
  label.setAttribute('y', minY + 80);
  label.setAttribute('font-size', '44');
  label.setAttribute('font-weight', 'bold');
  label.setAttribute('fill', '#111827');
  label.setAttribute('dominant-baseline', 'hanging');
  label.textContent = `${letter})`;
  svg.appendChild(label);

  gridEl.appendChild(cell);
}

function init() {
  const seed = getSeed();
  setSeedDisplay(seed);

  const prng = mulberry32(seed);
  const ordered = shuffleWithPrng(VARIATIONS, prng);

  fillAnswerKey(ordered);

  const gridEl = document.getElementById('grid');
  gridEl.innerHTML = '';
  ordered.forEach((variation, i) => {
    renderCell(LETTERS[i], variation, gridEl);
  });

  document.getElementById('reroll').addEventListener('click', () => {
    const newSeed = randomSeed();
    const url = new URL(window.location.href);
    url.searchParams.set('seed', newSeed);
    window.location.href = url.toString();
  });
}

document.addEventListener('DOMContentLoaded', init);
