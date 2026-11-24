// SVG rendering for one laid-out tree. Visual vocabulary follows the final
// window of the backward-induction app: coloured player nodes, grey payoff
// discs, thin ink edges, red for the action a profile picks at each node.
//
// Several views can share one page (the main tree plus the option trees of
// question 1), so every id inside a view carries the view's prefix and all
// lookups go through data attributes scoped to the view's own <svg>.

import { actionLabel } from './game.js';
import { NODE_R, LEAF_R, radius } from './config.js';

const NS = 'http://www.w3.org/2000/svg';
const COLORS = { 1: '#DC2626', 2: '#16A34A', 3: '#2563EB' };
const INK = '#374151';
const RED = '#DC2626';

// Type sizes in layout units. A full-width tree renders at roughly 0.6x, an
// option tree of question 1 at roughly 0.3x.
const MODES = {
  full:  { label: 25, labelLift: 15, labelSide: 19, digit: 29, payoffs: true,  arrow: [15, 11], ring: 46, pad: 70 },
  thumb: { label: 44, labelLift: 26, labelSide: 32, digit: 42, payoffs: false, arrow: [24, 17], ring: 48, pad: 56 },
};

// Payoff text inside a leaf disc of radius LEAF_R (40): font size, row
// positions and divider rows, by number of players.
const PAYOFF_LAYOUT = {
  1: { size: 32, ys: [0], dividers: [] },
  2: { size: 28, ys: [-16, 16], dividers: [0] },
  3: { size: 24, ys: [-25, 0, 25], dividers: [-12.5, 12.5] },
};

function el(tag, attrs = {}, parent = null) {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  if (parent) parent.appendChild(e);
  return e;
}

// Edge geometry (same curve as the backward-induction renderer). `at(t)`
// samples the drawn curve, used by the subgame outline.
export function edgeGeometry(p, c) {
  const R = radius(p), Rc = radius(c), GAP = 1, EXT = 2;
  if (Math.abs(c.x - p.x) < 5) {
    const dir = c.y > p.y ? 1 : -1;
    const y0 = p.y + R * dir;
    const y1 = c.y - (Rc + GAP + EXT) * dir;
    return {
      vertical: true,
      d: `M ${p.x} ${y0} L ${p.x} ${y1}`,
      at: t => ({ x: p.x, y: y0 + (y1 - y0) * t }),
      mid: { x: p.x, y: (y0 + y1) / 2 },
    };
  }
  const x0 = p.x + R;
  const x1 = c.x - (Rc + GAP + EXT);
  const qx = (x0 + x1) / 2;
  const qy = (p.y + c.y) / 2 - (c.y - p.y) * 0.15;
  const at = t => ({
    x: (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * qx + t * t * x1,
    y: (1 - t) * (1 - t) * p.y + 2 * (1 - t) * t * qy + t * t * c.y,
  });
  return { vertical: false, d: `M ${x0} ${p.y} Q ${qx} ${qy} ${x1} ${c.y}`, at, mid: at(0.5) };
}

export class TreeView {
  constructor(svg, tree, { prefix, mode = 'full' }) {
    this.svg = svg;
    this.tree = tree;
    this.prefix = prefix;
    this.mode = mode;
    this.cfg = MODES[mode];
    this.edges = new Map();   // nodeId -> [{ g, line }]
    this.nodeEls = new Map(); // nodeId -> g
    this.edgeHandler = null;
    this.nodeHandler = null;
    this.draw();
  }

  id(name) { return `${this.prefix}-${name}`; }

  draw() {
    const { svg, tree, cfg } = this;
    svg.innerHTML = '';
    svg.classList.add('tree-svg', `tree-${this.mode}`);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

    const [aw, ah] = cfg.arrow;
    const defs = el('defs', {}, svg);
    const shadow = el('filter', { id: this.id('shadow'), x: '-50%', y: '-50%', width: '200%', height: '200%' }, defs);
    el('feDropShadow', { dx: 2, dy: 2, stdDeviation: 3, 'flood-opacity': 0.4 }, shadow);
    for (const [name, fill] of [['arrow', INK], ['arrow-red', RED]]) {
      const m = el('marker', {
        id: this.id(name), markerWidth: aw, markerHeight: ah, refX: aw - 1, refY: ah / 2,
        orient: 'auto', markerUnits: 'userSpaceOnUse',
      }, defs);
      el('polygon', { points: `0 0, ${aw} ${ah / 2}, 0 ${ah}`, fill }, m);
    }

    this.outlineLayer = el('g', { class: 'outline-layer' }, svg);
    this.edgeLayer = el('g', { class: 'edge-layer' }, svg);
    this.markLayer = el('g', { class: 'mark-layer' }, svg);
    this.nodeLayer = el('g', { class: 'node-layer' }, svg);

    tree.decisionNodes.forEach(node => {
      const list = node.children.map((child, i) => this.drawEdge(node, child, i));
      this.edges.set(node.id, list);
    });
    tree.allNodes.forEach(node => {
      this.nodeEls.set(node.id, node.isLeaf ? this.drawLeaf(node) : this.drawDecision(node));
    });

    this.fitViewBox();

    svg.addEventListener('click', e => this.onClick(e));
  }

  drawEdge(parent, child, index) {
    const geo = edgeGeometry(parent, child);
    const g = el('g', { class: 'edge-g', 'data-node': parent.id, 'data-index': index }, this.edgeLayer);
    el('path', { class: 'edge-hit', d: geo.d }, g);
    const line = el('path', { class: 'edge-line', d: geo.d, 'marker-end': `url(#${this.id('arrow')})` }, g);

    const { label, labelLift, labelSide } = this.cfg;
    const pos = geo.vertical
      ? { x: geo.mid.x - labelSide, y: geo.mid.y }
      : { x: geo.mid.x, y: geo.mid.y - labelLift };
    const text = el('text', {
      class: 'edge-label', x: pos.x, y: pos.y, 'font-size': label,
      'text-anchor': 'middle', 'dominant-baseline': 'central',
    }, g);
    text.textContent = actionLabel(index);
    return { g, line };
  }

  drawDecision(node) {
    const g = el('g', { class: 'node-g decision', 'data-node': node.id, transform: `translate(${node.x}, ${node.y})` }, this.nodeLayer);
    el('circle', { r: NODE_R, fill: COLORS[node.player], filter: `url(#${this.id('shadow')})` }, g);
    const t = el('text', {
      class: 'node-digit', 'font-size': this.cfg.digit, 'text-anchor': 'middle', 'dominant-baseline': 'central',
    }, g);
    t.textContent = node.player;
    return g;
  }

  drawLeaf(node) {
    const g = el('g', { class: 'node-g leaf', 'data-node': node.id, transform: `translate(${node.x}, ${node.y})` }, this.nodeLayer);
    el('circle', { r: LEAF_R, fill: '#E5E7EB', stroke: '#9CA3AF', 'stroke-width': 2.8, filter: `url(#${this.id('shadow')})` }, g);
    if (!this.cfg.payoffs) return g;

    const lay = PAYOFF_LAYOUT[node.payoffs.length];
    lay.dividers.forEach(y => el('line', { x1: -30, x2: 30, y1: y, y2: y, stroke: '#9CA3AF', 'stroke-width': 1.4 }, g));
    node.payoffs.forEach((v, i) => {
      const t = el('text', {
        class: 'payoff', y: lay.ys[i], 'font-size': lay.size,
        'text-anchor': 'middle', 'dominant-baseline': 'central',
      }, g);
      t.textContent = v;
    });
    return g;
  }

  fitViewBox() {
    const pad = this.cfg.pad;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    this.tree.allNodes.forEach(n => {
      const r = radius(n);
      minX = Math.min(minX, n.x - r); maxX = Math.max(maxX, n.x + r);
      minY = Math.min(minY, n.y - r); maxY = Math.max(maxY, n.y + r);
    });
    minX -= pad; maxX += pad; minY -= pad; maxY += pad;
    this.svg.setAttribute('viewBox', `${minX} ${minY} ${maxX - minX} ${maxY - minY}`);
  }

  // Paint a profile. `ghost` (optional Map) marks, at nodes where the shown
  // profile departs from s, the action s took there: a dashed red trace.
  setProfile(profile, ghost = null) {
    this.edges.forEach((list, nodeId) => {
      const chosen = profile.get(nodeId);
      const was = ghost ? ghost.get(nodeId) : undefined;
      list.forEach(({ g, line }, i) => {
        const isChosen = i === chosen;
        const isGhost = was !== undefined && was !== chosen && i === was;
        g.classList.toggle('chosen', isChosen);
        g.classList.toggle('ghost', isGhost);
        line.setAttribute('marker-end', isChosen ? `url(#${this.id('arrow-red')})` : `url(#${this.id('arrow')})`);
      });
    });
  }

  // handler(node, childIndex) or null to switch edge clicking off.
  setEdgeHandler(handler) {
    this.edgeHandler = handler;
    this.svg.classList.toggle('edges-live', !!handler);
  }

  // handler(node) for decision-node clicks, or null.
  setNodeHandler(handler) {
    this.nodeHandler = handler;
    this.svg.classList.toggle('nodes-live', !!handler);
  }

  onClick(e) {
    const nodeG = e.target.closest('.node-g.decision');
    if (nodeG && this.nodeHandler) {
      this.nodeHandler(this.findNode(nodeG.dataset.node));
      return;
    }
    const edgeG = e.target.closest('.edge-g');
    if (edgeG && this.edgeHandler) {
      this.edgeHandler(this.findNode(edgeG.dataset.node), Number(edgeG.dataset.index));
    }
  }

  findNode(id) {
    return this.tree.allNodes.find(n => n.id === id);
  }

  // Dash-dotted rings around the given decision nodes.
  markNodes(nodes) {
    this.markLayer.innerHTML = '';
    nodes.forEach(n => el('circle', { class: 'node-ring', cx: n.x, cy: n.y, r: this.cfg.ring }, this.markLayer));
  }

  setOutline(d) {
    this.outlineLayer.innerHTML = '';
    if (d) el('path', { class: 'subgame-outline', d }, this.outlineLayer);
  }

  setSelectedNode(node) {
    this.nodeEls.forEach(g => g.classList.remove('selected'));
    if (node) this.nodeEls.get(node.id).classList.add('selected');
  }
}
