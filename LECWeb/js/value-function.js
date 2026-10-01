// The Value Function and the Envelope Trick — Examples frame.
//
// Callout stage, ported from 416 probabilities-and-beliefs.html: click an
// example's ▸ bullet and the canvas widens and pans left, so the graph of
// that problem slides in from the right, joined to the example by an amber
// tail. Click the graph (or press Escape) to pan back. The tail and both
// graphs are tikz-svg.
//
// The graphs carry KaTeX labels, so tikz-svg re-renders them once the KaTeX
// webfonts load; nothing here touches their rendered children afterwards.
import { render } from '../tikz-svg/dist/tikz-svg.min.js';

const MACROS = (typeof katexMacros !== 'undefined' ? katexMacros : undefined);
const draw = (svg, config) => {
  try { render(svg, config); }
  catch (e) { console.error(`${svg.id || 'figure'} render failed`, e); }
};

// Solarized Light, as in the 416 graphs
const BLUE = '#268bd2', BLUE_LIGHT = '#79b0dd';
const RED = '#dc322f', RED_LIGHT = '#eb9593';
const GREEN = '#859900';
const GUIDE = '#586e75', DASH = '4 2 1 2';   // dash-dotted guide lines
const AMBER = '#f9a825';                     // block-title amber, for the tail

// ── Figure building blocks ────────────────────────────────────────────
// Arguments are data coordinates (y up). tikz-svg nodes and paths are y-down,
// so y is negated here; plots take y-up values and flip them themselves.
const figure = (p) => {
  const label = (id, x, y, tex, anchor, extra = {}) => ({
    type: 'node', id: `${p}-${id}`, position: { x, y: -y }, label: tex, anchor,
    shape: 'rectangle', innerSep: 2, fill: 'none', stroke: 'none', fontSize: 16, ...extra,
  });
  const line = (pts, extra = {}) => ({
    type: 'path', points: pts.map(([x, y]) => ({ x, y: -y })), ...extra,
  });
  return {
    label,
    line,
    axes: (xMax, yMax, xTex, yTex) => [
      line([[0, 0], [xMax, 0]], { arrow: '->', stroke: '#000', strokeWidth: 1.6 }),
      line([[0, 0], [0, yMax]], { arrow: '->', stroke: '#000', strokeWidth: 1.6 }),
      label('xlab', xMax, 0, xTex, 'west'),
      label('ylab', 0, yMax, yTex, 'south'),
    ],
    // dash-dotted guides from the optimum down and across to the axes
    guides: (x, y) => line([[x, 0], [x, y], [0, y]], { dashed: DASH, stroke: GUIDE, strokeWidth: 1.4 }),
    dot: (x, y) => ({
      type: 'node', id: `${p}-opt`, position: { x, y: -y }, label: '', shape: 'circle',
      radius: 4.5, innerSep: 0, fill: '#000', stroke: 'none',
    }),
  };
};

// The level curve x·y = c (a hyperbola) from x0 to x1, sampled geometrically
// in x so the steep end gets as many points as the flat end.
const hyperbola = (c, x0, x1, extra) => {
  const n = 40;
  return {
    type: 'plot', expr: x => c / x, handler: 'smooth',
    samplesAt: Array.from({ length: n }, (_, j) => x0 * (x1 / x0) ** (j / (n - 1))),
    ...extra,
  };
};

// ── Example 1: max xy subject to 2x+3y ≤ i, drawn at i = 12 ────────────
// Budget line (0,4)–(6,0); optimum (3,2) = (i/4, i/6); V(12) = 6 = 12²/24.
// The light curves are a suboptimal indifference curve, u = 3 < V(i), which
// crosses the budget line (affordable, but worse), and an unaffordable one,
// u = 10 > V(i), wholly above it. The budget set is labelled by its inequality,
// near the origin: the suboptimal curve runs through the corner under the line.
{
  const f = figure('u');
  const XM = 7.8, YM = 5.6, TOP = 5.3, RIGHT = 7.4;   // axis ends; where the curves stop
  const V = 6, U_LIGHT = [3, 10];
  draw(document.getElementById('fig-utility'), {
    scale: 52, padding: 8, katexMacros: MACROS,
    draw: [
      ...f.axes(XM, YM, '$x$', '$y$'),
      f.guides(3, 2),
      ...U_LIGHT.map(u => hyperbola(u, u / TOP, RIGHT, { stroke: BLUE_LIGHT, strokeWidth: 2 })),
      f.line([[0, 4], [6, 0]], { stroke: RED, strokeWidth: 3 }),
      hyperbola(V, V / TOP, RIGHT, { stroke: BLUE, strokeWidth: 3 }),
      f.dot(3, 2),
      f.label('x-opt', 3, -0.1, '$i/4$', 'north'),
      f.label('x-int', 6, -0.1, '$i/2$', 'north'),
      f.label('y-opt', -0.1, 2, '$i/6$', 'east'),
      f.label('y-int', -0.1, 4, '$i/3$', 'east'),
      f.label('budget', 0.25, 0.3, '$2x+3y\\le i$', 'south west', { labelColor: RED }),
      f.label('value', RIGHT + 0.08, V / RIGHT, '$u=V(i)$', 'west', { labelColor: BLUE }),
    ],
  });
}

// ── Example 2: min 7k+2l subject to √(kl) = Q, drawn at Q = 2 ──────────
// Isoquant k = Q²/l; optimum (l, k) = (√(7/2)·Q, √(2/7)·Q); the tangent
// isocost 7k+2l = V(Q), V(Q) = 2√14·Q, is labelled by its intercepts V(Q)/7
// and V(Q)/2, as the budget line of Example 1 is by i/3 and i/2 (there is no
// room beside the line for its equation). The light lines are the other two
// isocosts, evenly spaced about it: a cheaper one wholly below the isoquant
// (it cannot produce Q) and a dearer, suboptimal one, which crosses the
// isoquant but costs more than V(Q). Labour on the horizontal axis, capital
// on the vertical, as in the textbooks; the axes are scaled separately so the
// flat isocosts (slope −2/7) do not crowd the axis.
{
  const f = figure('c');
  const Q = 2, LM = 9.8, KM = 3.9, TOP = 3.65, RIGHT = 9.4;
  const lS = Math.sqrt(7 / 2) * Q, kS = Math.sqrt(2 / 7) * Q, C = 2 * Math.sqrt(14) * Q;
  const C_LIGHT = [11.5, 18.5];   // V(2) = 4√14 ≈ 14.97 halfway between
  draw(document.getElementById('fig-cost'), {
    scaleX: 46, scaleY: 75, padding: 8, katexMacros: MACROS,
    draw: [
      ...f.axes(LM, KM, '$l$', '$k$'),
      f.guides(lS, kS),
      ...C_LIGHT.map(c => f.line([[0, c / 7], [c / 2, 0]], { stroke: RED_LIGHT, strokeWidth: 2 })),
      f.line([[0, C / 7], [C / 2, 0]], { stroke: RED, strokeWidth: 3 }),
      hyperbola(Q * Q, Q * Q / TOP, RIGHT, { stroke: GREEN, strokeWidth: 3 }),
      f.dot(lS, kS),
      f.label('l-opt', lS, -0.1, '$\\sqrt{7/2}\\,Q$', 'north'),
      f.label('k-opt', -0.1, kS, '$\\sqrt{2/7}\\,Q$', 'east'),
      f.label('l-int', C / 2, -0.1, '$V(Q)/2$', 'north'),
      f.label('k-int', -0.1, C / 7, '$V(Q)/7$', 'east'),
      f.label('isoquant', Q * Q / TOP + 0.12, TOP, '$\\sqrt{kl}=Q$', 'west', { labelColor: GREEN }),
    ],
  });
}

// ── Callout stage ─────────────────────────────────────────────────────
const BOX_MAX = 560;   // widest the graph balloon gets (px)
const MIN_GAP = 48;    // shortest tail (px)
const PAN = 0.9;       // pan duration (s)
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

document.querySelectorAll('.callout-stage').forEach(stage => {
  const canvas = stage.querySelector('.callout-canvas');
  const list   = stage.querySelector('.callout-list');
  const tails  = stage.querySelector('.callout-tails');
  const boxes  = Array.from(stage.querySelectorAll('.callout-box'));
  const itemFor = box => stage.querySelector(`.callout-item[data-callout="${box.id}"]`);
  let open = null, tween = null;

  // Pan to scrollLeft x through a proxy, writing the stage's scroll position
  // each frame (the stage's overflow is hidden; only the script scrolls it).
  function pan(x, onComplete) {
    if (tween) tween.kill();
    const pos = { x: stage.scrollLeft };
    tween = gsap.to(pos, {
      x, duration: reducedMotion.matches ? 0 : PAN, ease: 'power2.inOut',
      onUpdate: () => { stage.scrollLeft = pos.x; },
      onComplete,
    });
  }
  const panEnd = () => stage.scrollWidth - stage.clientWidth;

  // Sizes. The bullets keep the full stage width W. With a graph open the
  // canvas is W + gap + box + pad wide, where pad = (W − box)/2 and gap is the
  // same (at least MIN_GAP): panned all the way right, the view starts where
  // the bullets end, so the tail enters at its left edge, and the balloon sits
  // centred. On a phone the balloon nearly fills the view and the tail is a stub.
  function layout() {
    const W = stage.clientWidth;
    const boxW = Math.min(BOX_MAX, Math.round(W * 0.92));
    const pad = Math.max(0, Math.round((W - boxW) / 2));
    const gap = Math.max(MIN_GAP, pad);
    canvas.style.setProperty('--stage-w', `${W}px`);
    canvas.style.setProperty('--box-w', `${boxW}px`);
    canvas.style.setProperty('--stem-gap', `${gap}px`);
    canvas.style.width = open ? `${W + gap + boxW + pad}px` : '100%';
    if (open) drawTail(open);
  }

  // Tail: tip at the clicked bullet's right end, base on the balloon's title bar.
  // The overlay's viewBox is pinned to the canvas, so its units are pixels.
  function drawTail(box) {
    const c = canvas.getBoundingClientRect();
    const i = itemFor(box).getBoundingClientRect();
    const t = box.querySelector('.block-title').getBoundingClientRect();
    const baseX = t.left - c.left + 1;
    tails.style.display = 'block';
    draw(tails, {
      viewBox: [0, 0, c.width, c.height],
      draw: [{
        type: 'path', cycle: true, fill: AMBER, stroke: 'none',
        points: [
          { x: i.right - c.left + 8, y: (i.top + i.bottom) / 2 - c.top },
          { x: baseX, y: t.top - c.top + 5 },
          { x: baseX, y: t.bottom - c.top - 5 },
        ],
      }],
    });
  }

  function show(box) {
    boxes.forEach(b => { b.hidden = (b !== box); });
    open = box;
    list.inert = true;          // off screen while the graph is up: keep Tab out of it
    layout();
    pan(panEnd());
    box.focus({ preventScroll: true });
  }
  function close() {
    if (!open) return;
    const box = open;
    open = null;
    list.inert = false;
    pan(0, () => {
      box.hidden = true;
      tails.style.display = 'none';
      layout();
    });
    itemFor(box).focus({ preventScroll: true });
  }

  const activate = (el, fn) => {
    el.addEventListener('click', fn);
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(); }
    });
  };
  // One click on an example's ▸ bullet opens its graph (a second closes it);
  // the text itself does nothing, so it can be read and selected. The bullet
  // is the li's ::before, hung 1em to the left of the li's box, so a click on
  // it targets the li at an x left of that box. Keyboard: Enter or Space on
  // the focused example.
  stage.querySelectorAll('.callout-item').forEach(item => {
    const box = document.getElementById(item.dataset.callout);
    const li = item.closest('li');
    if (!box || !li) return;
    const toggle = () => (open === box ? close() : show(box));
    li.addEventListener('click', e => {
      if (e.target === li && e.clientX < li.getBoundingClientRect().left) toggle();
    });
    item.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
    });
  });
  boxes.forEach(box => activate(box, close));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && open) close(); });

  layout();
  window.addEventListener('resize', () => {
    layout();
    if (open) { if (tween) tween.kill(); stage.scrollLeft = panEnd(); }
  });
});
