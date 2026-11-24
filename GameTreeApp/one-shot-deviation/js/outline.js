// Outline of a subgame for question 5.
//
// The shape is the x-monotone envelope of the subgame: at every x it spans
// from the highest to the lowest point of any subgame node or edge (padded).
// Nodes sit in columns, and within a column the layout keeps a subgame's nodes
// contiguous, so the envelope hugs the subgame without swallowing outside nodes.
// `outlineIsClear` checks that promise for a given tree; the round generator
// rejects any tree where some subgame outline fails it.

import { edgeGeometry } from './render.js';
import { radius } from './config.js';
import { subtreeNodes } from './game.js';

const NODE_PAD = 22;   // clearance around node circles
const EDGE_PAD = 36;   // clearance around edges (wide enough to hold the action label)
const STEP = 3;      // envelope sampling step (user units)

export function subgamePolygon(rootNode) {
  const nodes = subtreeNodes(rootNode);
  const discs = nodes.map(n => ({ x: n.x, y: n.y, r: radius(n) + NODE_PAD }));
  nodes.forEach(n => {
    if (n.isLeaf) return;
    n.children.forEach(c => {
      const geo = edgeGeometry(n, c);
      for (let i = 0; i <= 32; i++) {
        const p = geo.at(i / 32);
        discs.push({ x: p.x, y: p.y, r: EDGE_PAD });
      }
    });
  });

  const xmin = Math.min(...discs.map(d => d.x - d.r));
  const xmax = Math.max(...discs.map(d => d.x + d.r));
  const top = [], bot = [];
  const xs = [];
  for (let x = xmin + 0.05; x < xmax - 0.05; x += STEP) xs.push(x);
  xs.push(xmax - 0.05);
  xs.forEach(x => {
    let lo = Infinity, hi = -Infinity;
    discs.forEach(d => {
      const dx = x - d.x;
      if (Math.abs(dx) >= d.r) return;
      const h = Math.sqrt(d.r * d.r - dx * dx);
      lo = Math.min(lo, d.y - h);
      hi = Math.max(hi, d.y + h);
    });
    if (lo === Infinity) return;
    top.push({ x, y: lo });
    bot.push({ x, y: hi });
  });
  return smooth(top.concat(bot.reverse()), 4);
}

// Moving average on a closed polygon: fills the notches where discs meet.
function smooth(pts, radius) {
  const n = pts.length;
  return pts.map((_, i) => {
    let sx = 0, sy = 0;
    for (let k = -radius; k <= radius; k++) {
      const p = pts[(i + k + n) % n];
      sx += p.x; sy += p.y;
    }
    const m = 2 * radius + 1;
    return { x: sx / m, y: sy / m };
  });
}

export function polygonPath(pts) {
  return 'M ' + pts.map(p => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' L ') + ' Z';
}

function inside(pt, poly) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i], b = poly[j];
    if ((a.y > pt.y) !== (b.y > pt.y) && pt.x < (b.x - a.x) * (pt.y - a.y) / (b.y - a.y) + a.x) c = !c;
  }
  return c;
}

function distToSegment(p, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

// True when no node outside the subgame touches the outline or its interior.
export function outlineIsClear(rootNode, allNodes, poly) {
  const inSub = new Set(subtreeNodes(rootNode));
  return allNodes.every(n => {
    if (inSub.has(n)) return true;
    if (inside(n, poly)) return false;
    let d = Infinity;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      d = Math.min(d, distToSegment(n, poly[j], poly[i]));
    }
    return d > radius(n) + 5;
  });
}
