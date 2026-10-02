// The Value Function and the Envelope Trick — Examples frame, and Figure 1
// of the Envelope Trick frame (its block sits above the callout stage).
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

// ── Envelope Trick frame: Figure 1 ────────────────────────────────────
// U against θ, drawn as a circa-1970 pencil plate: greyscale only, a fixed
// ladder of graphite weights, every line with a small seeded hand wobble, the
// gap V − f toned with a grey watercolor wash. V re-optimizes at every θ; the
// frozen objective f(x*(θ̄), θ) keeps the choice made at θ̄. So V ≥ f, the two
// touch at θ̄, and touching from below forces a common tangent — the envelope
// theorem. Neither curve is a worked example: V is a convex quadratic, f is
// its tangent at θ̄ bent down by a concave quadratic.
{
  const e = figure('env');
  const INK = { heavy: '#242424', object: '#3d3d3d', mid: '#666666', thin: '#8e8e8e', wash: '#8a8a8a' };
  const RULED = { type: 'random steps', segmentLength: 26, amplitude: 0.3 };  // a pencil on a straightedge
  const SX = 380, SY = 300;                 // px per unit of θ, of U
  const tb = 0.5, fa = 0.10, fb = 0.96;     // θ̄; where f is drawn
  const V = t => 0.22 + 0.18 * t + 0.5 * t * t;
  const Vp = t => 0.18 + t;
  const f = t => V(tb) + Vp(tb) * (t - tb) - 0.6 * (t - tb) ** 2;
  const tan = t => V(tb) + Vp(tb) * (t - tb);
  const sample = (g, a, b, n = 90) => Array.from({ length: n + 1 }, (_, i) => {
    const t = a + (b - a) * (i / n);
    return [t, g(t)];
  });

  // The wash outline: V out to fb, f back to fa. The wash may bleed only across
  // the two open ends, so the tone stops hard on both curves; weight(t) takes
  // arc length round the outline as a fraction, so locate the ends in px.
  const top = sample(V, fa, fb), ring = [...top, ...sample(f, fa, fb).reverse()];
  const len = pts => pts.slice(1).reduce((s, [x, y], i) =>
    s + Math.hypot((x - pts[i][0]) * SX, (y - pts[i][1]) * SY), 0);
  const total = len([...ring, ring[0]]);
  const right = [len(top) / total, (len(top) + (V(fb) - f(fb)) * SY) / total];
  const left = 1 - (V(fa) - f(fa)) * SY / total;
  const bleed = t => ((t >= right[0] && t <= right[1]) || t >= left ? 1 : 0);

  const tex = (id, x, y, s, anchor, extra = {}) =>
    e.label(id, x, y, s, anchor, { fontSize: 16, labelColor: INK.object, ...extra });

  draw(document.getElementById('fig-envelope'), {
    scaleX: SX, scaleY: SY, padding: 8, seed: 23, katexMacros: MACROS,
    draw: [
      e.line(ring, {
        cycle: true, fill: INK.wash, stroke: 'none',
        decoration: { type: 'watercolor', layers: 8, opacity: 0.05, spread: 0.2, segmentLength: 18, rounds: 3, grain: true, weight: bleed },
      }),
      e.line([[-0.02, 0], [1.12, 0]], { arrow: '->', stroke: INK.mid, strokeWidth: 1.2, decoration: RULED }),
      e.line([[0, -0.02], [0, 1]], { arrow: '->', stroke: INK.mid, strokeWidth: 1.2, decoration: RULED }),
      e.line([[tb, 0], [tb, V(tb)]], { dashed: '2 4', stroke: INK.thin, strokeWidth: 0.9 }),
      // the common tangent, ruled long enough to part from both curves
      e.line([[0.16, tan(0.16)], [0.80, tan(0.80)]], { stroke: INK.mid, strokeWidth: 0.9, decoration: RULED }),
      e.line(sample(f, fa, fb), { stroke: INK.object, strokeWidth: 1.7, decoration: RULED }),
      e.line(sample(V, 0.04, 0.98), { stroke: INK.heavy, strokeWidth: 2.4, decoration: RULED }),
      {
        type: 'node', id: 'env-touch', position: { x: tb, y: -V(tb) }, label: '', shape: 'circle',
        radius: 3.4, innerSep: 0, fill: INK.heavy, stroke: 'none',
      },
      // leader from the equation down to the touch
      e.line([[0.39, 0.75], [tb - 4 / SX, V(tb) + 8 / SY]], { stroke: INK.thin, strokeWidth: 0.8 }),
      tex('theta', 1.125, 0, '$\\theta$', 'west'),
      tex('U', -0.015, 0.99, '$U$', 'east'),
      tex('tbar', tb, -0.015, '$\\overline{\\theta}$', 'north', { labelColor: INK.heavy }),
      tex('V', 0.995, V(0.98), '$V(c,\\theta)$', 'west', { labelColor: INK.heavy }),
      tex('f', fb + 0.015, f(fb), '$f(x^\\ast(\\overline{\\theta}),\\theta)$', 'west'),
      // clear of V above and f below across its whole width, not just at its centre
      tex('gap', 0.895, 0.668, '$V\\ge f$', 'center', { fontSize: 13 }),
      tex('eq', 0.05, 0.84,
        '$\\dfrac{dV}{d\\theta}=\\dfrac{\\partial f}{\\partial\\theta}\\quad'
        + '\\textcolor{#666666}{\\small\\text{at }\\theta=\\overline{\\theta}}$',
        'west', { fontSize: 17, labelColor: INK.heavy }),
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
