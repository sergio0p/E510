// The stage-game matrix, drawn as on the ECON 416 extra-credit page: each
// payoff cell its own square box with a short solidus, Player 1's payoff upper
// left and Player 2's lower right; action names above the columns and left of
// the rows; a corner diagonal with "Player 2" above it and "Player 1" below.
// Player 3 picks the matrix: one slice per Player 3 action.
//
// Built in HTML (not SVG) so payoffs can be typed in place and shown in KaTeX.

import { PLAYER_COLORS, keyOf, payoff, payoffTex, profileText, stateTex } from './model.js';
import { tex } from './tex.js';

const CELL = { 1: 66, 2: 96, 3: 118 };
const SCALE = { lg: 1, md: 0.8, sm: 0.66 };
const SPOTS = {
  1: [[0.5, 0.5]],
  2: [[0.32, 0.3], [0.68, 0.7]],
  3: [[0.24, 0.22], [0.5, 0.5], [0.76, 0.78]],
};
// Solidus strokes, in a 0–100 box: lower left to upper right.
const SOLIDI = {
  1: [],
  2: [[30, 70, 70, 30]],
  3: [[24, 49, 50, 23], [50, 77, 76, 51]],
};

function el(tag, cls, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html != null) e.innerHTML = html;
  return e;
}

/**
 * renderMatrix(host, game, opts)
 *   mode: 'edit' | 'view' | 'pick'
 *   size: 'lg' | 'md' | 'sm'
 *   onEdit(profile, i, text)  — edit mode, on every keystroke
 *   onPick(profile)           — pick mode
 *   tags: Map(profileKey → [state indices]) — pick mode chips
 *   current: profileKey of the current state's choice (pick mode)
 */
export function renderMatrix(host, g, opts = {}) {
  const mode = opts.mode || 'view';
  const cell = Math.round(CELL[g.n] * SCALE[opts.size || 'lg']);
  host.innerHTML = '';
  const root = el('div', `mx mx-n${g.n} mx-${mode}`);
  root.style.setProperty('--cell', `${cell}px`);
  const cols = g.n >= 2 ? g.m[1] : 1;
  const slices = g.n >= 3 ? g.m[2] : 1;

  for (let z = 0; z < slices; z++) {
    const slice = el('div', 'mx-slice');
    if (g.n >= 3) {
      slice.append(el('div', 'mx-slice-title',
        `Player 3 plays <span class="mx-p3name">${tex(nameTex(g.names[2][z]))}</span>`));
    }
    const grid = el('div', 'mx-grid');
    grid.style.gridTemplateColumns = `auto repeat(${cols}, var(--cell))`;
    grid.style.gridTemplateRows = `auto repeat(${g.m[0]}, var(--cell))`;

    grid.append(corner(g.n));
    for (let c = 0; c < cols; c++) {
      grid.append(el('div', 'mx-colhead', g.n >= 2 ? tex(nameTex(g.names[1][c])) : ''));
    }
    for (let r = 0; r < g.m[0]; r++) {
      grid.append(el('div', 'mx-rowhead', tex(nameTex(g.names[0][r]))));
      for (let c = 0; c < cols; c++) grid.append(cellBox(g, [r, c, z], mode, opts));
    }
    slice.append(grid);
    root.append(slice);
  }
  host.append(root);
  return root;
}

const nameTex = a => (a.length === 1 ? a : `\\text{${a}}`);

function corner(n) {
  const box = el('div', 'mx-corner');
  box.innerHTML =
    `<svg class="mx-diag" viewBox="0 0 100 100" aria-hidden="true"><line x1="100" y1="100" x2="4" y2="4"/></svg>` +
    (n >= 2 ? '<span class="mx-plabel mx-p2">Player 2</span>' : '') +
    '<span class="mx-plabel mx-p1">Player 1</span>';
  return box;
}

function cellBox(g, p, mode, opts) {
  const key = keyOf(p);
  const box = el('div', 'mx-cell');
  box.dataset.key = key;
  const lines = SOLIDI[g.n].map(([x1, y1, x2, y2]) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`).join('');
  if (lines) box.innerHTML = `<svg class="mx-solidus" viewBox="0 0 100 100" aria-hidden="true">${lines}</svg>`;

  SPOTS[g.n].forEach(([fx, fy], i) => {
    const color = PLAYER_COLORS[i];
    if (mode === 'edit') {
      const inp = document.createElement('input');
      inp.type = 'text';
      inp.inputMode = 'decimal';
      inp.autocomplete = 'off';
      inp.spellcheck = false;
      inp.className = 'mx-input';
      inp.style.left = `${fx * 100}%`;
      inp.style.top = `${fy * 100}%`;
      inp.style.color = color;
      inp.value = (payoff(g, p, i) || '').replace(/-/g, '−');
      inp.dataset.player = i;
      inp.setAttribute('aria-label', `Payoff of player ${i + 1} at ${profileText(g, p)}`);
      inp.classList.toggle('filled', inp.value.trim() !== '');
      inp.addEventListener('input', () => {
        inp.classList.toggle('filled', inp.value.trim() !== '');
        inp.classList.remove('invalid');
        opts.onEdit && opts.onEdit(p, i, inp.value);
      });
      inp.addEventListener('blur', () => {
        const v = inp.value.replace(/-/g, '−').trim();
        if (v !== inp.value) inp.value = v;
      });
      box.append(inp);
    } else {
      const s = payoff(g, p, i);
      const span = el('span', 'mx-pay', s ? tex(payoffTex(s)) : '');
      span.style.left = `${fx * 100}%`;
      span.style.top = `${fy * 100}%`;
      span.style.color = color;
      box.append(span);
    }
  });

  if (mode === 'pick') {
    box.tabIndex = 0;
    box.setAttribute('role', 'button');
    box.setAttribute('aria-label', `Profile ${profileText(g, p)}`);
    const states = (opts.tags && opts.tags.get(key)) || [];
    if (states.length) {
      const chips = el('div', 'mx-chips');
      states.forEach(k => {
        const chip = el('span', `mx-chip${k === opts.currentState ? ' is-current' : ''}`, tex(stateTex(k)));
        chips.append(chip);
      });
      box.append(chips);
    }
    if (key === opts.current) box.classList.add('is-current');
    const pick = () => opts.onPick && opts.onPick(p);
    box.addEventListener('click', pick);
    box.addEventListener('keydown', e => {
      if ((e.key === 'Enter' && !e.shiftKey) || e.key === ' ') { e.preventDefault(); pick(); }
    });
  }
  return box;
}
