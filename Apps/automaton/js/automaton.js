// The automaton, drawn as in the ECON 510 lecture notes (repeated-games.html):
// green states with a drop shadow, s1 red with the initial arrow, the outcome
// α(s) as the state's label, and the state's name s_k in small grey underneath.
// Edges follow the lecture's labels ($CC$, $\neq CC$, or none).

import { render } from '../../../LECWeb/tikz-svg/dist/tikz-svg.min.js?v=20261111';
import { edgeGroups, fromKey, profileTex, profileText } from './model.js';

const GREEN = '#2e7d32', RED = '#dc322f', GRAY = '#586e75';
const FONT = "'Times New Roman', serif";

// Fit the viewBox to what is drawn (the library sizes it from the curves'
// control points); redo once fonts load, since KaTeX label boxes change then.
function renderTight(svg, cfg, pad = 6) {
  const fit = () => {
    render(svg, cfg);
    const b = svg.getBBox();
    if (b.width && b.height) {
      render(svg, { ...cfg, viewBox: [b.x - pad, b.y - pad, b.width + 2 * pad, b.height + 2 * pad] });
      svg.style.maxWidth = `${Math.round((b.width + 2 * pad) * 1.0)}px`;
    }
  };
  fit();
  if (document.fonts) document.fonts.ready.then(fit);
}

const approxWidth = text => text.length * 12 + 6;

/**
 * drawAutomaton(svg, game, alpha, tau, { edges: bool })
 * alpha[k] = profile key; tau[k] = { profileKey: target }.
 */
export function drawAutomaton(svg, g, alpha, tau, { edges = false } = {}) {
  const K = alpha.length;
  const labels = alpha.map(key => (key ? profileText(g, fromKey(key)) : '?'));
  const r = Math.max(28, Math.ceil(Math.max(...labels.map(approxWidth)) / 2) + 6);

  const groups = edges ? alpha.flatMap((_, k) => edgeGroups(g, tau, k)) : [];
  const has = (a, b) => groups.some(e => e.from === a && e.to === b);
  const adjLabelW = Math.max(0, ...groups
    .filter(e => Math.abs(e.from - e.to) === 1)
    .map(e => approxWidth(e.label.replace(/\$|\\neq |\\text\{|\}/g, '').replace(/\\,/g, ''))));
  const D = Math.max(2 * r + 84, 2 * r + adjLabelW + 40);

  const states = {};
  alpha.forEach((key, k) => {
    const st = {
      position: { x: k * D, y: 0 },
      label: key ? `$${profileTex(g, fromKey(key))}$` : '$?$',
    };
    if (k === 0) { st.initial = true; st.fill = RED; }
    states[`s${k}`] = st;
    // the state's name, small and grey, underneath
    states[`n${k}`] = {
      position: { x: k * D, y: r + 17 },
      label: `$s_{${k + 1}}$`,
      fill: 'none', stroke: 'none', shadow: false, labelColor: GRAY, fontSize: 17, radius: 9,
    };
  });

  const edgeList = groups.map(({ from, to, label }) => {
    const e = { from: `s${from}`, to: `s${to}` };
    if (label) e.label = label;
    const span = Math.abs(to - from);
    if (from === to) {
      e.loop = 'above';
    } else if (span === 1) {
      if (has(to, from)) e.bend = 'left';      // a pair: one above, one below
    } else {
      // Longer jumps arc over (forward) or under (backward) the row, higher
      // the farther they go so nested arcs stay apart and clear the loops.
      const chord = span * D - 0.85 * r;
      const forward = to > from;
      const apex = forward ? r + 66 + 24 * (span - 2) : r + 44 + 24 * (span - 2);
      const L = Math.min(2.6, Math.max(0.35, (apex - 0.9 * r) / (0.266 * chord)));
      if (forward) Object.assign(e, { out: 65, in: 115, looseness: L });
      else Object.assign(e, { out: -115, in: -65, looseness: L });
    }
    return e;
  });

  renderTight(svg, {
    padding: 4,
    stateStyle: {
      radius: r, fill: GREEN, stroke: 'none', labelColor: '#fff',
      shadow: { dx: 2, dy: 3, blur: 4, color: 'rgba(0,0,0,0.35)' },
      fontSize: 22, fontFamily: FONT,
    },
    edgeStyle: { stroke: GRAY, strokeWidth: 1.5, arrow: 'stealth', labelDistance: 6, fontSize: 20 },
    states,
    edges: edgeList,
  });
}
