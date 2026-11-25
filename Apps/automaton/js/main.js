import {
  MAX_ACTIONS, MAX_STATES, PLAYER_COLORS, actionSetTex, defaultNames, deviationProfile,
  fromKey, keyOf, missingPayoff, nameProblem, newGame, nextState, parseProfile, payoff, payoffTex,
  profileArgTex, profileTex, profileText, profiles, shuffle, stateTex, tauComplete,
} from './model.js';
import { renderMatrix } from './matrix.js';
import { drawAutomaton } from './automaton.js';
import { allCode, osdCode, valueCode } from './mathematica.js';
import { m, tex } from './tex.js';

const $ = id => document.getElementById(id);

const STEPS = [
  { key: 'game',  label: 'Stage game' },
  { key: 'count', label: 'Number of states' },
  { key: 'alpha', label: 'Outcome function' },
  { key: 'tau',   label: 'Transition function' },
  { key: 'value', label: 'Value function' },
  { key: 'solve', label: 'Solve for V' },
  { key: 'osd',   label: 'One-shot deviations' },
  { key: 'test',  label: 'Test deviations' },
  { key: 'all',   label: 'All conditions' },
];
const idx = key => STEPS.findIndex(s => s.key === key);

const S = {
  g: newGame(),
  K: 0, Kpick: null,
  alpha: [],      // alpha[k] = profile key or null
  tau: [],        // tau[k] = { profileKey: target }
  cur: 0,         // state being defined in the outcome step
  tk: 0,          // state whose transition table is shown
  mode: null,     // transition shortcut: 'all' | 'butone-profile' | 'butone-state'
  excluded: null, // profile key left out by "every profile but one"
  edges: false,   // edges drawn on the diagram
  step: 'game',
  reached: 0,
  vq: null,       // value-function questions
  oq: null,       // one-shot deviation questions
  submit: null,
};

// ---------- page furniture ----------

function h(tag, attrs = {}, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') e.className = v;
    else if (k === 'html') e.innerHTML = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v === true ? '' : v);
  }
  kids.flat().forEach(k => k != null && e.append(k));
  return e;
}
const setTitle = t => { $('q-title').textContent = t; };
const setStem = html => { $('q-stem').innerHTML = html; };
function setBody(...nodes) { const b = $('q-body'); b.innerHTML = ''; nodes.forEach(n => n && b.append(n)); }

function feedback(kind, html) {
  const f = $('feedback');
  f.className = kind ? `feedback fb-${kind}` : 'feedback';
  f.innerHTML = html || '';
  f.hidden = !html;
}
function primary(label, handler) {
  const b = $('primary');
  b.hidden = !label;
  b.innerHTML = label || '';
  b.onclick = handler || null;
  S.submit = handler || null;
}
const sk = k => m(stateTex(k));
const P = key => m(profileTex(S.g, fromKey(key)));
const kbdShiftEnter = () => '<kbd>Shift</kbd>+<kbd>Enter</kbd>';

function renderStepper() {
  const ol = $('stepper');
  ol.innerHTML = '';
  const cur = idx(S.step);
  STEPS.forEach((s, i) => {
    const state = i === cur ? 'current' : i <= S.reached ? 'done' : 'todo';
    const inner = [h('span', { class: 'step-num' }, String(i + 1)), h('span', { class: 'step-label' }, s.label)];
    const li = h('li', { class: `step step-${state}` });
    if (state === 'done') li.append(h('button', { type: 'button', class: 'step-btn', onclick: () => goto(s.key) }, inner));
    else li.append(...inner);
    if (state === 'current') li.setAttribute('aria-current', 'step');
    ol.append(li);
  });
}

function goto(key) {
  S.step = key;
  S.reached = Math.max(S.reached, idx(key));
  S.mode = null; S.excluded = null;
  feedback(null);
  primary(null);
  BUILD[key]();
  renderStepper();
  const card = document.querySelector('.q-card');
  if (card.getBoundingClientRect().top < 0) card.scrollIntoView({ block: 'start' });
}

// Anything downstream of the stage game's shape is void once it changes.
function shapeChanged() {
  S.alpha = S.alpha.map(() => null);
  S.tau = S.alpha.map(() => ({}));
  S.edges = false;
  S.vq = null; S.oq = null;
  S.reached = Math.min(S.reached, idx('count'));
}
function automatonChanged() { S.vq = null; S.oq = null; }

// ---------- figures ----------

function figBox(cls, ...kids) { return h('figure', { class: `fig-box ${cls || ''}` }, kids); }

function matrixFigure(size) {
  const host = h('div', { class: 'mx-host' });
  renderMatrix(host, S.g, { mode: 'view', size });
  return figBox('fig-game', host);
}

function diagramFigure(caption) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'automaton-svg');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', 'State diagram of the automaton');
  const cap = h('figcaption', { class: 'fig-caption', html: caption || '' });
  const fig = figBox('fig-automaton', svg, cap);
  fig.draw = () => drawAutomaton(svg, S.g, S.alpha, S.tau, { edges: S.edges });
  fig.caption = html => { cap.innerHTML = html; };
  return fig;
}

function referencePanel() {
  const d = diagramFigure('');
  const wrap = h('div', { class: 'ref-row' }, matrixFigure('sm'), d);
  return { wrap, draw: d.draw };
}

function codeBlock(code) {
  const btn = h('button', { type: 'button', class: 'btn btn-outline-olive btn-sm copy-btn' }, 'Copy code');
  const pre = h('pre', { class: 'code' }, h('code', {}, code));
  btn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      const r = document.createRange(); r.selectNodeContents(pre);
      const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r);
      document.execCommand('copy');
    }
    btn.textContent = 'Copied';
    setTimeout(() => { btn.textContent = 'Copy code'; }, 1600);
  });
  return h('div', { class: 'code-box' }, h('div', { class: 'code-bar' }, btn), pre);
}

// ---------- step 1: stage game ----------

function buildGame() {
  setTitle('Stage game');
  setStem(`Choose how many players the stage game has and how many actions each one has, then
    type the payoffs into the matrix. Player 1 picks the row, Player 2 the column and Player 3
    the matrix. You can rename the actions.`);
  const g = S.g;
  const setup = h('div', { class: 'setup' });
  const mxHost = h('div', { class: 'mx-host mx-host-edit' });

  const seg = (values, current, onPick, label) => h('div', { class: 'seg', role: 'group', 'aria-label': label },
    values.map(v => h('button', {
      type: 'button', class: `btn btn-outline-olive btn-sm${v === current ? ' active' : ''}`,
      'aria-pressed': String(v === current), onclick: () => onPick(v),
    }, String(v))));

  const drawSetup = () => {
    setup.innerHTML = '';
    setup.append(h('div', { class: 'setup-row' },
      h('span', { class: 'setup-label' }, 'Players'),
      seg([1, 2, 3], g.n, v => {
        if (v === g.n) return;
        g.n = v;
        for (let i = 0; i < v; i++) if (g.m[i] < 2) g.m[i] = 2;
        for (let i = 0; i < v; i++) g.m[i] = Math.min(g.m[i], MAX_ACTIONS[v]);
        fixNames();
        shapeChanged();
        drawSetup(); drawMatrix();
      }, 'Number of players')));
    for (let i = 0; i < g.n; i++) {
      const counts = Array.from({ length: MAX_ACTIONS[g.n] - 1 }, (_, j) => j + 2);
      const names = h('div', { class: 'names' }, g.names[i].slice(0, g.m[i]).map((a, j) => h('input', {
        type: 'text', class: 'name-input', value: a, maxlength: 6, spellcheck: 'false',
        'aria-label': `Name of action ${j + 1} of player ${i + 1}`,
        style: `color:${PLAYER_COLORS[i]}`,
        oninput: e => { g.names[i][j] = e.target.value.trim(); drawMatrix(); },
      })));
      setup.append(h('div', { class: 'setup-row' },
        h('span', { class: 'setup-label' },
          h('span', { class: 'pdot', style: `background:${PLAYER_COLORS[i]}` }), `Player ${i + 1}`),
        h('span', { class: 'setup-sub' }, 'actions'),
        seg(counts, g.m[i], v => {
          if (v === g.m[i]) return;
          g.m[i] = v; fixNames(); shapeChanged(); drawSetup(); drawMatrix();
        }, `Number of actions of player ${i + 1}`),
        names));
    }
  };
  const fixNames = () => {
    for (let i = 0; i < 3; i++) {
      const d = defaultNames(Math.max(g.m[i], 1));
      while (g.names[i].length < g.m[i]) g.names[i].push(d[g.names[i].length]);
    }
  };
  const drawMatrix = () => renderMatrix(mxHost, g, {
    mode: 'edit', size: 'lg',
    onEdit: (p, i, text) => {
      const key = keyOf(p);
      if (!g.pay[key]) g.pay[key] = ['', '', ''];
      g.pay[key][i] = text.trim();
    },
  });
  // Enter moves to the next payoff box
  mxHost.addEventListener('keydown', e => {
    if (e.key !== 'Enter' || e.shiftKey || !e.target.classList.contains('mx-input')) return;
    e.preventDefault();
    const all = [...mxHost.querySelectorAll('.mx-input')];
    const nxt = all[all.indexOf(e.target) + 1];
    if (nxt) nxt.focus(); else e.target.blur();
  });

  drawSetup(); drawMatrix();
  setBody(setup, figBox('fig-edit', mxHost));
  primary(`Done with the stage game`, submitGame);
  setHint(`Press ${kbdShiftEnter()} when the matrix is complete.`);

  function submitGame() {
    const np = nameProblem(g);
    if (np) { feedback('bad', np.msg); return; }
    const miss = missingPayoff(g);
    if (miss) {
      const sel = `.mx-cell[data-key="${keyOf(miss.p)}"] .mx-input[data-player="${miss.i}"]`;
      const inp = mxHost.querySelector(sel);
      if (inp) { inp.classList.add('invalid'); inp.focus(); }
      feedback('bad', `Type a number for Player ${miss.i + 1}'s payoff at ${m(profileTex(g, miss.p))}.
        Integers, decimals and fractions such as 1/2 all work.`);
      return;
    }
    goto('count');
  }
}

function setHint(html) {
  let el = $('q-hint');
  if (!el) {
    el = h('p', { id: 'q-hint', class: 'hint' });
    $('primary').after(el);
  }
  el.innerHTML = html || '';
  el.hidden = !html;
}

// ---------- step 2: number of states ----------

function buildCount() {
  setTitle('Number of states');
  setStem(`How many states does the strategy profile have? Pick a number from 1 to ${MAX_STATES};
    you can also press the digit on the keyboard.`);
  S.Kpick = S.Kpick || S.K || null;
  const seg = h('div', { class: 'seg seg-lg', role: 'group', 'aria-label': 'Number of states' });
  const draw = () => {
    seg.innerHTML = '';
    for (let k = 1; k <= MAX_STATES; k++) {
      seg.append(h('button', {
        type: 'button', class: `btn btn-outline-olive${k === S.Kpick ? ' active' : ''}`,
        'aria-pressed': String(k === S.Kpick), onclick: () => { S.Kpick = k; draw(); },
      }, String(k)));
    }
  };
  draw();
  S.digit = k => { if (k <= MAX_STATES) { S.Kpick = k; draw(); } };
  setBody(matrixFigure('md'), h('div', { class: 'count-row' }, seg));
  primary('Done', () => {
    if (!S.Kpick) { feedback('info', 'Pick the number of states first.'); return; }
    resize(S.Kpick);
    goto('alpha');
  });
  setHint(`Press ${kbdShiftEnter()} when you have picked.`);
}

function resize(K) {
  if (K !== S.K) {
    S.edges = false;
    automatonChanged();
  }
  S.K = K;
  S.alpha = Array.from({ length: K }, (_, k) => S.alpha[k] ?? null);
  S.tau = Array.from({ length: K }, (_, k) => {
    const old = S.tau[k] || {};
    return Object.fromEntries(Object.entries(old).filter(([, t]) => t < K));
  });
  const empty = S.alpha.findIndex(a => !a);
  S.cur = empty >= 0 ? empty : 0;
  if (S.alpha.some(a => !a)) S.reached = Math.min(S.reached, idx('alpha'));
  else if (S.tau.some((_, k) => !tauComplete(S.g, S.tau, k))) S.reached = Math.min(S.reached, idx('tau'));
}

// ---------- step 3: outcome function ----------

function buildAlpha() {
  const g = S.g;
  setTitle('Outcome function');
  const example = profileText(g, profiles(g)[Math.min(1, profiles(g).length - 1)]);
  setStem(`Define the outcome function ${m('\\alpha : S \\to A')}: it gives the action profile
    the players play in each state. Click the profile played in state ${sk(0)}, then the one in
    ${sk(1 % Math.max(S.K, 1))}, and so on. Click a row of the table to go back to a state; you
    can also type a profile into the table, such as ${example}.`);

  const mxHost = h('div', { class: 'mx-host' });
  const table = h('table', { class: 'alpha-table' });
  const thead = h('thead', {}, h('tr', {},
    h('th', { scope: 'col', html: m('s') }), h('th', { scope: 'col', html: m('\\alpha(s)') })));
  const tbody = h('tbody');
  table.append(thead, tbody);
  const list = h('datalist', { id: 'profile-list' },
    profiles(g).map(p => h('option', { value: profileText(g, p) })));

  S.alpha.forEach((key, k) => {
    const inp = h('input', {
      type: 'text', class: 'alpha-input', list: 'profile-list', autocomplete: 'off',
      spellcheck: 'false', value: key ? profileText(g, fromKey(key)) : '',
      'aria-label': `Profile played in state s${k + 1}`,
    });
    const echo = h('span', { class: 'alpha-echo', html: key ? P(key) : '' });
    const row = h('tr', { 'data-k': k },
      h('th', { scope: 'row', html: sk(k) }),
      h('td', {}, h('div', { class: 'alpha-cellwrap' }, inp, echo)));
    row.addEventListener('click', e => { if (e.target !== inp) { S.cur = k; refresh(); } });
    inp.addEventListener('focus', () => { if (S.cur !== k) { S.cur = k; refresh(false); } });
    inp.addEventListener('input', () => {
      const p = parseProfile(g, inp.value);
      inp.classList.remove('invalid');
      if (p) { setAlpha(k, keyOf(p)); echo.innerHTML = P(keyOf(p)); refreshMatrix(); }
      else echo.innerHTML = '';
    });
    inp.addEventListener('keydown', e => {
      if (e.key !== 'Enter' || e.shiftKey) return;
      e.preventDefault();
      const p = parseProfile(g, inp.value);
      if (!p) {
        inp.classList.add('invalid');
        feedback('bad', `Type one action per player, such as ${example}.`);
        return;
      }
      feedback(null);
      inp.value = profileText(g, p);
      const nxt = tbody.querySelector(`tr[data-k="${k + 1}"] .alpha-input`);
      if (nxt) nxt.focus();
    });
    inp.addEventListener('blur', () => {
      const p = parseProfile(g, inp.value);
      if (p) inp.value = profileText(g, p);
      else if (inp.value.trim()) inp.classList.add('invalid');
    });
    tbody.append(row);
  });

  const refreshMatrix = () => {
    const tags = new Map();
    S.alpha.forEach((key, k) => { if (key) { if (!tags.has(key)) tags.set(key, []); tags.get(key).push(k); } });
    renderMatrix(mxHost, g, {
      mode: 'pick', size: 'lg', tags, current: S.alpha[S.cur], currentState: S.cur,
      onPick: p => {
        const k = S.cur;
        setAlpha(k, keyOf(p));
        const inp = tbody.querySelector(`tr[data-k="${k}"] .alpha-input`);
        inp.value = profileText(g, p); inp.classList.remove('invalid');
        tbody.querySelector(`tr[data-k="${k}"] .alpha-echo`).innerHTML = P(keyOf(p));
        const nxt = nextEmpty(k);
        if (nxt != null) S.cur = nxt;
        refresh();
        const cell = mxHost.querySelector(`.mx-cell[data-key="${keyOf(p)}"]`);
        if (cell && document.activeElement && document.activeElement.classList.contains('mx-cell')) cell.focus();
      },
    });
  };
  const refresh = (matrix = true) => {
    tbody.querySelectorAll('tr').forEach(tr => tr.classList.toggle('is-current', Number(tr.dataset.k) === S.cur));
    if (matrix) refreshMatrix(); else refreshMatrix();
    $('alpha-now').innerHTML = `Now defining ${m(`\\alpha(${stateTex(S.cur)})`)}`;
  };

  const tablePane = h('div', { class: 'alpha-pane' }, h('p', { id: 'alpha-now', class: 'alpha-now' }), table, list);
  setBody(h('div', { class: 'alpha-layout' }, figBox('fig-pick', mxHost), tablePane));
  refresh();

  primary('Done with the outcome function', () => {
    const k = S.alpha.findIndex(a => !a);
    if (k >= 0) {
      S.cur = k; refresh();
      feedback('info', `Pick a profile for ${sk(k)} first.`);
      return;
    }
    goto('tau');
  });
  setHint(`Press ${kbdShiftEnter()} when every state has a profile.`);
}

function setAlpha(k, key) {
  if (S.alpha[k] === key) return;
  S.alpha[k] = key;
  automatonChanged();
}
function nextEmpty(k) {
  for (let j = 1; j <= S.K; j++) {
    const t = (k + j) % S.K;
    if (!S.alpha[t]) return t;
  }
  return null;
}

// ---------- steps 4–6: states, transition function, edges ----------

function buildTau() {
  const g = S.g;
  setTitle('Transition function');
  setStem(`Define the transition function ${m('\\tau : S \\times A \\to S')}: in each state it
    gives the next state after every action profile, including the profiles the strategy does
    not prescribe. In the table of each state, click the next state in every row. The shortcuts
    fill every row, or every row but one, with the state you click next.`);

  const diagram = diagramFigure('');
  const tabs = h('div', { class: 'tau-tabs', role: 'tablist', 'aria-label': 'States' });
  const allBtn = h('button', { type: 'button', class: 'btn btn-outline-olive btn-sm' }, 'Every profile');
  const butBtn = h('button', { type: 'button', class: 'btn btn-outline-olive btn-sm' }, 'Every profile but one');
  const modeHint = h('span', { class: 'mode-hint', role: 'status', 'aria-live': 'polite' });
  const tools = h('div', { class: 'tau-tools' }, allBtn, butBtn, modeHint);
  const host = h('div', { class: 'tau-host' });
  const legend = h('p', { class: 'tau-legend' });

  const caption = () => (S.edges
    ? `Each edge carries the profiles that take it; no label when every profile does, and
       ${m('\\neq')} before the profiles that do not.`
    : 'The edges appear once the transition function is complete.');
  const redraw = () => { diagram.caption(caption()); diagram.draw(); };

  const allDone = () => S.alpha.every((_, k) => tauComplete(g, S.tau, k));

  const setMode = mode => {
    S.mode = mode;
    if (mode !== 'butone-state') S.excluded = mode === 'butone-profile' ? null : S.excluded;
    if (!mode) S.excluded = null;
    allBtn.classList.toggle('active', mode === 'all');
    butBtn.classList.toggle('active', mode === 'butone-profile' || mode === 'butone-state');
    modeHint.innerHTML =
      mode === 'all' ? `Click the state that every profile leads to. <kbd>Esc</kbd> cancels.`
      : mode === 'butone-profile' ? `Click the profile to leave out. <kbd>Esc</kbd> cancels.`
      : mode === 'butone-state' ? `Click the state that every profile other than ${P(S.excluded)} leads to.`
      : '';
    drawTable();
  };
  allBtn.addEventListener('click', () => setMode(S.mode === 'all' ? null : 'all'));
  butBtn.addEventListener('click', () => setMode(S.mode && S.mode.startsWith('butone') ? null : 'butone-profile'));
  S.escape = () => { if (S.mode) setMode(null); };

  const drawTabs = () => {
    tabs.innerHTML = '';
    S.alpha.forEach((_, k) => {
      const done = tauComplete(g, S.tau, k);
      tabs.append(h('button', {
        type: 'button', role: 'tab', 'aria-selected': String(k === S.tk),
        class: `tau-tab${k === S.tk ? ' is-current' : ''}${done ? ' is-done' : ''}`,
        onclick: () => { S.tk = k; setMode(null); drawTabs(); },
        html: `${sk(k)}${done ? '<span class="tick" aria-label="complete">✓</span>' : ''}`,
      }));
    });
  };

  const drawTable = (focus) => {
    const k = S.tk;
    const ps = profiles(g);
    const onPath = S.alpha[k];
    const cls = S.mode === 'all' || S.mode === 'butone-state' ? 'pick-state'
      : S.mode === 'butone-profile' ? 'pick-profile' : '';
    let html = `<table class="tau-table ${cls}"><thead><tr><th class="tau-corner" scope="col">${sk(k)}</th>`;
    S.alpha.forEach((_, t) => { html += `<th class="tau-colhead" scope="col" data-t="${t}">${sk(t)}</th>`; });
    html += '</tr></thead><tbody>';
    ps.forEach(p => {
      const key = keyOf(p);
      const sel = nextState(S.tau, k, p);
      const rowCls = [key === onPath ? 'on-path' : '', key === S.excluded ? 'excluded' : '',
        Number.isInteger(sel) ? '' : 'empty'].join(' ');
      html += `<tr class="${rowCls}" data-key="${key}"><th class="tau-rowhead" scope="row" data-key="${key}">${P(key)}</th>`;
      S.alpha.forEach((_, t) => {
        const on = sel === t;
        html += `<td><button type="button" class="tau-cell${on ? ' on' : ''}" data-key="${key}" data-t="${t}"
          aria-pressed="${on}" aria-label="tau(s${k + 1}, ${profileText(g, p)}) = s${t + 1}"></button></td>`;
      });
      html += '</tr>';
    });
    html += '</tbody></table>';
    host.innerHTML = html;
    legend.innerHTML = `The row marked in red is ${m(`\\alpha(${stateTex(k)}) = ${profileTex(g, fromKey(onPath))}`)},
      the profile the strategy plays in ${sk(k)}.`;
    if (focus) {
      const b = host.querySelector(`.tau-cell[data-key="${focus.key}"][data-t="${focus.t}"]`);
      if (b) b.focus();
    }
  };

  const change = (fn, focus) => {
    const k = S.tk;
    const was = tauComplete(g, S.tau, k);
    if (!S.tau[k]) S.tau[k] = {};
    fn(S.tau[k]);
    automatonChanged();
    drawTabs(); drawTable(focus);
    if (S.edges && !allDone()) S.edges = false;
    if (S.edges) redraw();
    if (!was && tauComplete(g, S.tau, k)) {
      const nxt = S.alpha.findIndex((_, j) => !tauComplete(g, S.tau, j));
      if (nxt >= 0) {
        feedback('info', `The table of ${sk(k)} is complete. On to ${sk(nxt)}.`);
        setTimeout(() => { if (S.step === 'tau' && S.tk === k) { S.tk = nxt; drawTabs(); drawTable(); } }, 450);
      } else if (!S.edges) {
        feedback('info', `Every state has its transitions. Press ${kbdShiftEnter()} or click
          <i>Done with the transition function</i> to draw the edges.`);
      }
    }
  };

  host.addEventListener('click', e => {
    const k = S.tk;
    const cell = e.target.closest('.tau-cell');
    const col = e.target.closest('.tau-colhead');
    const row = e.target.closest('.tau-rowhead');
    if (S.mode === 'butone-profile') {
      const key = (cell || row) && (cell || row).dataset.key;
      if (!key) return;
      S.excluded = key;
      setMode('butone-state');
      return;
    }
    const t = cell ? Number(cell.dataset.t) : col ? Number(col.dataset.t) : null;
    if (t == null) return;
    if (S.mode === 'all') {
      change(map => profiles(g).forEach(p => { map[keyOf(p)] = t; }));
      setMode(null);
    } else if (S.mode === 'butone-state') {
      const ex = S.excluded;
      change(map => profiles(g).forEach(p => { if (keyOf(p) !== ex) map[keyOf(p)] = t; }));
      setMode(null);
      if (!Number.isInteger(S.tau[k][ex])) {
        feedback('info', `Now pick the next state for ${P(ex)}.`);
        const b = host.querySelector(`.tau-cell[data-key="${ex}"]`);
        if (b) b.focus();
      }
    } else if (cell) {
      const key = cell.dataset.key;
      change(map => { map[key] = t; }, { key, t });
    }
  });

  setBody(diagram, h('div', { class: 'tau-panel' }, tabs, tools, host, legend));
  drawTabs(); drawTable();
  redraw();

  primary('Done with the transition function', () => {
    const k = S.alpha.findIndex((_, j) => !tauComplete(g, S.tau, j));
    if (k >= 0) {
      const left = profiles(g).filter(p => !Number.isInteger(nextState(S.tau, k, p))).length;
      S.tk = k; setMode(null); drawTabs();
      feedback('info', `The table of ${sk(k)} still has ${left} row${left > 1 ? 's' : ''} without a next state.`);
      return;
    }
    if (!S.edges) {
      S.edges = true;
      redraw();
      feedback('ok', `The edges are on the diagram: this is your automaton ${m('(S, \\alpha, \\tau)')}.`);
      primary('Continue to the value function', () => goto('value'));
      S.reached = Math.max(S.reached, idx('tau'));
      return;
    }
    goto('value');
  });
  if (S.edges && allDone()) primary('Continue to the value function', () => goto('value'));
  setHint(`Press ${kbdShiftEnter()} when every table is complete.`);
}

// ---------- step 7: value function (multiple choice) ----------

function valueOptions(k) {
  const g = S.g;
  const p = fromKey(S.alpha[k]);
  const t = nextState(S.tau, k, p);
  const u = q => `u(${profileArgTex(g, q)})`;
  const V = j => `V(${stateTex(j)})`;
  const lhs = `${V(k)} = `;
  const opts = [{ tex: `${lhs}${u(p)} + \\delta\\, ${V(t)}`, right: true }];
  const others = profiles(g).filter(q => keyOf(q) !== keyOf(p));
  const off = others.find(q => nextState(S.tau, k, q) !== t);
  let tWrong = off ? nextState(S.tau, k, off) : (S.K > 1 ? (t + 1) % S.K : null);
  if (tWrong != null) opts.push({ tex: `${lhs}${u(p)} + \\delta\\, ${V(tWrong)}` });
  const qWrong = off || others[0];
  if (qWrong) opts.push({ tex: `${lhs}${u(qWrong)} + \\delta\\, ${V(t)}` });
  opts.push({ tex: `${lhs}\\delta\\, ${u(p)} + ${V(t)}` });
  opts.push({ tex: `${lhs}${u(p)} + ${V(t)}` });
  const seen = new Set();
  return shuffle(opts.filter(o => !seen.has(o.tex) && seen.add(o.tex)).slice(0, 5));
}

function buildValue() {
  setTitle('Value function');
  if (!S.vq) S.vq = { k: 0, opts: {}, answered: {} };
  const ref = referencePanel();
  const qa = h('div', { class: 'qa' });
  setBody(ref.wrap, qa);
  ref.draw();
  setStem(`For each state, pick the recursive equation the value function satisfies there.`);
  valueQuestion(qa);
}

function valueQuestion(qa) {
  const g = S.g;
  const k = S.vq.k;
  if (!S.vq.opts[k]) S.vq.opts[k] = valueOptions(k);
  const opts = S.vq.opts[k];
  const name = `vq-${k}`;
  qa.innerHTML = '';
  qa.append(
    h('p', { class: 'qa-progress' }, `State ${k + 1} of ${S.K}`),
    h('p', { class: 'qa-q', html: `Which recursive equation does the value function satisfy at state ${sk(k)}?` }),
    h('div', { class: 'choice-list' }, opts.map((o, j) => h('label', { class: 'choice' },
      h('input', { type: 'radio', name, value: j, class: 'form-check-input' }),
      h('span', { class: 'choice-text', html: tex(o.tex) })))),
  );
  feedback(null);
  primary('Check', () => {
    const picked = qa.querySelector(`input[name="${name}"]:checked`);
    if (!picked) { feedback('info', 'Pick an equation first.'); return; }
    const o = opts[Number(picked.value)];
    const p = fromKey(S.alpha[k]);
    const t = nextState(S.tau, k, p);
    const why = `In ${sk(k)} the players play ${P(S.alpha[k])}, and
      ${m(`\\tau(${stateTex(k)}, ${profileArgTex(g, p)}) = ${stateTex(t)}`)}, so
      ${m(`V(${stateTex(k)}) = u(${profileArgTex(g, p)}) + \\delta\\, V(${stateTex(t)})`)}.`;
    qa.querySelectorAll('.choice').forEach((lab, j) => {
      lab.classList.toggle('is-right', !!opts[j].right);
      lab.classList.toggle('is-wrong', j === Number(picked.value) && !o.right);
      lab.querySelector('input').disabled = true;
    });
    feedback(o.right ? 'ok' : 'bad', (o.right ? 'Right. ' : 'Not quite. ') + why);
    if (k + 1 < S.K) primary('Next state', () => { S.vq.k++; valueQuestion(qa); });
    else primary('Continue', () => goto('solve'));
  });
}

// ---------- step 8: solve for V in Mathematica ----------

function buildSolve() {
  setTitle('Solve for V');
  setStem(`The value function satisfies one equation per state, written below first in symbols
    and then with the payoffs of your stage game, one entry per player.`);
  setBody(
    h('div', { class: 'value-system', html: tex(valueSystemTex(), true) }),
    h('p', { class: 'code-intro', html: `Copy the code into a Mathematica notebook and evaluate it.
      It solves this system for the values as functions of ${m('\\delta')}. In the code,
      <code>V[i, s]</code> denotes the value of player ${m('i')} at state ${m('s')}.` }),
    codeBlock(valueCode(S.g, S.alpha, S.tau)));
  primary('Continue', () => goto('osd'));
}

// V(s_k) = u(α(s_k)) + δ V(τ(s_k, α(s_k))) = (u_1, u_2) + δ V(τ(s_k, α(s_k)))
function valueSystemTex() {
  const g = S.g;
  const rows = S.alpha.map((key, k) => {
    const p = fromKey(key);
    const next = `\\delta\\, V(${stateTex(nextState(S.tau, k, p))})`;
    const us = Array.from({ length: g.n }, (_, i) => payoffTex(payoff(g, p, i)));
    const vec = g.n === 1 ? us[0] : `(${us.join(', ')})`;
    return `V(${stateTex(k)}) &= u(${profileArgTex(g, p)}) + ${next} &&= ${vec} + ${next}`;
  });
  return `\\begin{aligned} ${rows.join(' \\\\[0.3em] ')} \\end{aligned}`;
}

// ---------- step 9: one-shot deviations (multiple choice) ----------

function osdOptions(i, k) {
  const g = S.g;
  const mi = g.m[i];
  const a0 = fromKey(S.alpha[k])[i];
  const all = Array.from({ length: mi }, (_, a) => a);
  const correct = all.filter(a => a !== a0);
  const sets = [];
  const add = s => {
    const key = [...s].sort((x, y) => x - y).join(',');
    if (s.length && !sets.some(o => o.key === key)) sets.push({ key, set: [...s] });
  };
  add(correct);
  if (mi === 2) { add([0]); add([1]); add(all); }
  else {
    add(all);
    add([a0]);
    const drop = correct[Math.floor(Math.random() * correct.length)];
    add(correct.filter(a => a !== drop));
    const pool = [];
    for (let mask = 1; mask < (1 << mi); mask++) pool.push(all.filter(a => mask & (1 << a)));
    shuffle(pool);
    for (const s of pool) { if (sets.length >= 5) break; add(s); }
  }
  const ck = correct.join(',');
  return shuffle(sets.slice(0, 5).map(o => ({ tex: actionSetTex(g, i, o.set), right: o.key === ck })));
}

function buildOsd() {
  setTitle('One-shot deviations');
  if (!S.oq) S.oq = { i: 0, k: 0, opts: {}, done: new Set(), choosing: false };
  const ref = referencePanel();
  const qa = h('div', { class: 'qa' });
  setBody(ref.wrap, qa);
  ref.draw();
  setStem(`A one-shot deviation changes a player's action in one state only, then follows the
    strategy again.`);
  if (S.oq.choosing) osdChooser(qa); else osdQuestion(qa);
}

function osdQuestion(qa) {
  const g = S.g;
  const { i, k } = S.oq;
  const id = `${i},${k}`;
  if (!S.oq.opts[id]) S.oq.opts[id] = osdOptions(i, k);
  const opts = S.oq.opts[id];
  const name = `oq-${i}-${k}`;
  qa.innerHTML = '';
  qa.append(
    h('p', { class: 'qa-progress' }, `Player ${i + 1}, state ${k + 1} of ${S.K}`),
    h('p', { class: 'qa-q', html: `Which are the one-shot deviations of Player ${i + 1} in state ${sk(k)}?` }),
    h('div', { class: 'choice-list' }, opts.map((o, j) => h('label', { class: 'choice' },
      h('input', { type: 'radio', name, value: j, class: 'form-check-input' }),
      h('span', { class: 'choice-text', html: tex(o.tex) })))),
  );
  feedback(null);
  primary('Check', () => {
    const picked = qa.querySelector(`input[name="${name}"]:checked`);
    if (!picked) { feedback('info', 'Pick an answer first.'); return; }
    const o = opts[Number(picked.value)];
    const p = fromKey(S.alpha[k]);
    const a0 = p[i];
    const rest = Array.from({ length: g.m[i] }, (_, a) => a).filter(a => a !== a0);
    const why = `In ${sk(k)} the strategy plays ${P(S.alpha[k])}, so Player ${i + 1} plays
      ${m(actionSetTex(g, i, [a0]))}. Any other action, played once, is a one-shot deviation:
      ${m(actionSetTex(g, i, rest))}.`;
    qa.querySelectorAll('.choice').forEach((lab, j) => {
      lab.classList.toggle('is-right', !!opts[j].right);
      lab.classList.toggle('is-wrong', j === Number(picked.value) && !o.right);
      lab.querySelector('input').disabled = true;
    });
    feedback(o.right ? 'ok' : 'bad', (o.right ? 'Right. ' : 'Not quite. ') + why);
    if (k + 1 < S.K) primary('Next state', () => { S.oq.k++; osdQuestion(qa); });
    else primary('Continue', () => {
      S.oq.done.add(i);
      const left = Array.from({ length: g.n }, (_, j) => j).filter(j => !S.oq.done.has(j));
      if (!left.length) { goto('test'); return; }
      S.oq.choosing = true;
      osdChooser(qa);
    });
  });
}

function osdChooser(qa) {
  const g = S.g;
  const left = Array.from({ length: g.n }, (_, j) => j).filter(j => !S.oq.done.has(j));
  qa.innerHTML = '';
  feedback(null);
  qa.append(
    h('p', { class: 'qa-q' }, 'Look at the same question for another player?'),
    h('div', { class: 'chooser' },
      left.map(j => h('button', {
        type: 'button', class: 'btn btn-olive',
        onclick: () => { S.oq.i = j; S.oq.k = 0; S.oq.choosing = false; osdQuestion(qa); },
      }, `Player ${j + 1}`)),
      h('button', { type: 'button', class: 'btn btn-outline-olive', onclick: () => goto('test') }, 'Skip')),
  );
  primary(null);
  S.submit = () => goto('test');
}

// ---------- step 10: test the deviations in Mathematica ----------

function buildTest() {
  setTitle('Test deviations');
  setStem(`The code below writes the one-shot deviation condition of each player at each state:
    for every action ${m('a_i \\neq \\alpha_i(s)')},
    ${m('V_i(s) \\ge u_i(a_i, \\alpha_{-i}(s)) + \\delta\\, V_i(\\tau(s, (a_i, \\alpha_{-i}(s))))')}.
    Paste it below the value-function code, in the same notebook, and evaluate it. The output
    has one line per deviation: it says which player, state and action it tests, then gives the
    discount factors ${m('0 < \\delta < 1')} for which the deviation is not profitable.`);
  setBody(codeBlock(osdCode(S.g, S.alpha, S.tau)));
  primary('Continue', () => goto('all'));
}

// ---------- step 11: all conditions at once ----------

function buildAll() {
  setTitle('All conditions');
  setStem(`Is there a discount factor that satisfies every one-shot deviation condition at once?
    Paste this below the previous code and evaluate it. <code>Reduce</code> returns the values of
    ${m('\\delta')} in ${m('(0, 1)')} for which all the conditions hold, or <code>False</code>
    when there are none.`);
  setBody(
    h('p', { class: 'slow-note' }, 'Mathematica may take a while to solve this. Close other apps while it runs.'),
    codeBlock(allCode(S.g, S.alpha)));
  primary(null);
  setHint('');
}

const BUILD = {
  game: buildGame, count: buildCount, alpha: buildAlpha, tau: buildTau, value: buildValue,
  solve: buildSolve, osd: buildOsd, test: buildTest, all: buildAll,
};

// ---------- keyboard ----------

document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && e.shiftKey) {
    if (S.submit) { e.preventDefault(); S.submit(); }
    return;
  }
  if (e.key === 'Escape' && S.step === 'tau' && S.escape) { S.escape(); return; }
  if (S.step === 'count' && /^[1-9]$/.test(e.key) && !e.target.matches('input, textarea')) S.digit(Number(e.key));
});

// ---------- signature rule: a row of states, as an automaton ----------

function drawRule() {
  const svg = $('automaton-rule');
  const NS = 'http://www.w3.org/2000/svg';
  const add = (tag, attrs, parent = svg) => {
    const e = document.createElementNS(NS, tag);
    Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
    parent.appendChild(e);
    return e;
  };
  const defs = add('defs', {});
  const mk = add('marker', { id: 'ar-tip', viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 5, markerHeight: 5, orient: 'auto' }, defs);
  add('path', { d: 'M0,1 L9,5 L0,9 z', class: 'ar-tip' }, mk);
  const W = 940, y = 22, r = 5.2, n = 24, gap = (W - 40) / (n - 1);
  add('line', { x1: 2, y1: y, x2: 20 - r - 2, y2: y, class: 'ar-edge', 'marker-end': 'url(#ar-tip)' });
  for (let i = 0; i < n; i++) {
    const x = 20 + i * gap;
    if (i < n - 1) add('line', { x1: x + r + 1.5, y1: y, x2: x + gap - r - 2, y2: y, class: 'ar-edge', 'marker-end': 'url(#ar-tip)' });
    if (i % 5 === 0 || i === n - 1) {
      add('path', { d: `M${x - 2.6},${y - r + 0.8} C${x - 9},${y - 20} ${x + 9},${y - 20} ${x + 2.6},${y - r + 0.8}`, class: 'ar-edge', 'marker-end': 'url(#ar-tip)' });
    }
    add('circle', { cx: x, cy: y, r, class: i === 0 ? 'ar-init' : 'ar-state' });
  }
}

// ---------- start ----------

function restart() {
  if (S.reached > 0 && !confirm('Start over? This clears the stage game and the automaton.')) return;
  Object.assign(S, { g: newGame(), K: 0, Kpick: null, alpha: [], tau: [], cur: 0, tk: 0,
    edges: false, reached: 0, vq: null, oq: null });
  goto('game');
}

// ?demo=pd loads the lecture's three-period punishment (for previews).
function demo() {
  const q = new URLSearchParams(location.search);
  if (q.get('demo') !== 'pd') return false;
  const g = S.g;
  g.n = 2; g.m = [2, 2, 1]; g.names = [['C', 'D'], ['C', 'D'], ['A']];
  g.pay = { '0,0,0': ['6', '6', ''], '0,1,0': ['0', '9', ''], '1,0,0': ['9', '0', ''], '1,1,0': ['1', '1', ''] };
  S.K = 4; S.Kpick = 4;
  S.alpha = ['0,0,0', '1,1,0', '1,1,0', '1,1,0'];
  const every = t => Object.fromEntries(profiles(g).map(p => [keyOf(p), t]));
  S.tau = [{ ...every(1), '0,0,0': 0 }, every(2), every(3), every(0)];
  S.edges = true;
  S.reached = STEPS.length - 1;
  goto(q.get('step') && idx(q.get('step')) >= 0 ? q.get('step') : 'tau');
  return true;
}

document.addEventListener('DOMContentLoaded', () => {
  drawRule();
  $('restart').addEventListener('click', restart);
  if (!demo()) goto('game');
});
