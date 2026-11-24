import { makeRound } from './rounds.js';
import { TreeView } from './render.js';
import { subgamePolygon, polygonPath } from './outline.js';
import {
  deviationPayoffs, diffNodes, isAncestor, nodeName, pathIds,
  playerList, profileNotation, shotWord, subgamePhrase,
} from './game.js';

const $ = id => document.getElementById(id);

const STEPS = [
  { key: 'q1',  num: '1',   label: 'One-shot deviations' },
  { key: 'q2',  num: '2',   label: 'Subgame perfect?' },
  { key: 'q3',  num: '3',   label: 'Find a deviation' },
  { key: 'q4',  num: '4',   label: 'Whose deviation' },
  { key: 'q5',  num: '5',   label: 'Its subgame' },
];

let R = null;      // current round (see rounds.js)
let view = null;   // the main tree
let step = null;
let working = null;   // profile being edited in question 3
let q5Choice = null;
let q3Reset = null;   // the Reset button of question 3
const skipped = new Set();

// ---------- page furniture ----------

function setStem(html) { $('q-stem').innerHTML = html; }
function setBody(node) { const b = $('q-body'); b.innerHTML = ''; if (node) b.appendChild(node); }
function setCaption(html) { $('tree-caption').innerHTML = html; }

function feedback(kind, text) {
  const f = $('feedback');
  f.className = kind ? `feedback fb-${kind}` : 'feedback';
  f.innerHTML = text || '';
  f.hidden = !text;
}

function primary(label, handler) {
  const b = $('primary');
  b.hidden = !label;
  b.textContent = label || '';
  b.onclick = handler || null;
}

function h(tag, attrs = {}, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') e.className = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v);
  }
  kids.flat().forEach(k => e.append(k));
  return e;
}

function renderStepper() {
  const ol = $('stepper');
  ol.innerHTML = '';
  const idx = STEPS.findIndex(s => s.key === step);
  STEPS.forEach((s, i) => {
    let state = i < idx ? 'done' : i === idx ? 'current' : 'todo';
    if (skipped.has(s.key)) state = 'skipped';
    if (step === 'end' && !skipped.has(s.key)) state = 'done';
    const li = h('li', { class: `step step-${state}` },
      h('span', { class: 'step-num' }, s.num), h('span', { class: 'step-label' }, s.label));
    if (state === 'current') li.setAttribute('aria-current', 'step');
    ol.append(li);
  });
}

function goto(key) {
  step = key;
  stopFollowing({ home: true });
  view.setEdgeHandler(null);
  view.setNodeHandler(null);
  feedback(null);
  primary(null);
  const meta = STEPS.find(s => s.key === key);
  $('q-num').textContent = meta ? `Question ${meta.num}` : 'Done';
  renderStepper();
  ({ q1: stepQ1, q2: stepQ2, q3: stepQ3, q4: stepQ4, q5: stepQ5 })[key]();
}

function finishRound(message) {
  step = 'end';
  renderStepper();
  if (message) feedback('ok', message);
  primary('New game', newGame);
}

function newGame() {
  R = makeRound();
  skipped.clear();
  if (R.numPlayers === 1) skipped.add('q4');
  view = new TreeView($('main-tree'), R.tree, { prefix: 'main', mode: 'full' });
  view.setProfile(R.s);
  goto('q1');
}

// Test hook: with #debug in the URL, expose the round to scripted tests.
if (location.hash === '#debug') window.__osd = { round: () => R, step: () => step };

const joinAnd = list => (list.length < 2 ? list.join('') : `${list.slice(0, -1).join(', ')} and ${list[list.length - 1]}`);

const notation = () => profileNotation(R.tree.decisionNodes, R.s, R.numPlayers);

// ---------- question 1: keep the profile s in view among the options ----------
//
// While the options are being answered, the figure of s hops between option
// rows so it stays next to whatever the student is looking at:
//   slot 0 = its home above the options, slot k = between row k and row k+1.
// Scrolling down, once the figure has left the top of the window it moves just
// below the row now at the top. Scrolling up, once the top edge of the row
// above it comes back into view, it moves back above that row: the exact
// reverse, with a small dead band (HYSTERESIS) so it cannot flicker. Each hop
// corrects the scroll position so the row on screen does not move. Checking
// the answers ends the hopping.

const follow = { active: false, slot: 0, lastY: 0, ticking: false };
const HYSTERESIS = 40; // px

const figureEl = () => document.querySelector('.tree-host');

// Option cards grouped into visual rows (two per row, one on narrow screens).
function optionRows() {
  const rows = [];
  document.querySelectorAll('.opt-grid .opt-card').forEach(card => {
    const top = card.offsetTop;
    const row = rows.find(r => Math.abs(r.top - top) < 4);
    if (row) row.cards.push(card); else rows.push({ top, cards: [card] });
  });
  return rows.sort((a, b) => a.top - b.top).map(r => r.cards);
}

function placeFigure(slot, rows) {
  const fig = figureEl();
  if (slot === 0) {
    fig.classList.remove('in-grid');
    $('q-body').before(fig);
  } else {
    fig.classList.add('in-grid');
    rows[slot - 1][rows[slot - 1].length - 1].after(fig);
  }
  follow.slot = slot;
}

// Move the figure while keeping `anchor` (a card on screen) where it is.
function hopFigure(slot, rows, anchor) {
  const before = anchor.getBoundingClientRect().top;
  placeFigure(slot, rows);
  const shift = anchor.getBoundingClientRect().top - before;
  window.scrollTo({ top: window.scrollY + shift, behavior: 'instant' });
  follow.lastY = window.scrollY;
  const fig = figureEl();
  fig.classList.remove('just-moved');
  void fig.offsetWidth; // restart the fade
  fig.classList.add('just-moved');
}

function followScroll() {
  follow.ticking = false;
  if (!follow.active) return;
  const y = window.scrollY;
  const down = y > follow.lastY;
  const up = y < follow.lastY;
  follow.lastY = y;
  const rows = optionRows();
  const maxSlot = rows.length - 1;
  for (let guard = 0; guard <= rows.length; guard++) {
    const box = figureEl().getBoundingClientRect();
    if (down && follow.slot < maxSlot && box.bottom <= 0) {
      hopFigure(follow.slot + 1, rows, rows[follow.slot][0]);
    } else if (up && follow.slot > 0 && rows[follow.slot - 1][0].getBoundingClientRect().top >= HYSTERESIS) {
      hopFigure(follow.slot - 1, rows, rows[follow.slot - 1][0]);
    } else {
      break;
    }
  }
}

window.addEventListener('scroll', () => {
  if (follow.active && !follow.ticking) {
    follow.ticking = true;
    requestAnimationFrame(followScroll);
  }
}, { passive: true });

window.addEventListener('resize', () => {
  if (follow.slot === 0) return;
  const rows = optionRows();
  placeFigure(Math.min(follow.slot, rows.length - 1), rows);
});

function startFollowing() {
  follow.active = true;
  follow.slot = 0;
  follow.lastY = window.scrollY;
}

function stopFollowing({ home }) {
  follow.active = false;
  if (home && follow.slot !== 0) placeFigure(0, []);
}

// ---------- question 1: which options are one-shot deviations ----------

function explainOption(o) {
  if (o.isOSD) {
    const n = o.changed[0];
    const off = !pathIds(R.tree.root, R.s).has(n.id);
    return `Only Player ${n.player}'s action at ${nodeName(n)} changes: a one-shot deviation.`
      + (off ? ' That node is off the path of <i>s</i>, and the deviation still counts.' : '');
  }
  if (o.changed.length === 0) return 'This is <i>s</i> itself. Nothing changes, so it is not a deviation.';
  const players = new Set(o.changed.map(n => n.player));
  if (players.size === 1) {
    const k = o.changed.length;
    return `Player ${o.changed[0].player}'s actions change at ${shotWord(k)} nodes: a ${shotWord(k)}-shot deviation, not a one-shot deviation.`;
  }
  return `The actions of ${playerList(players)} change. A one-shot deviation changes one player's action at one node.`;
}

function stepQ1() {
  view.setProfile(R.s);
  view.markNodes([]);
  view.setOutline(null);
  setCaption(`The strategy profile <i>s</i> = ${notation()}. At each decision node, the red edge is the action <i>s</i> picks.`);
  setStem('The red edges show the strategy profile <i>s</i>. Which of the profiles below are one-shot deviations from <i>s</i>? Check all that apply.');

  const grid = h('div', { class: 'opt-grid' });
  R.optionViews = R.options.map((o, i) => {
    const box = h('input', { type: 'checkbox', class: 'form-check-input', id: `opt-${i}` });
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', `Option ${o.letter}`);
    const note = h('p', { class: 'opt-note', hidden: '' });
    const card = h('label', { class: 'opt-card', for: `opt-${i}` },
      h('span', { class: 'opt-head' }, box, h('span', { class: 'opt-letter' }, o.letter)), svg, note);
    box.addEventListener('change', () => card.classList.toggle('picked', box.checked));
    grid.append(card);
    const v = new TreeView(svg, R.tree, { prefix: `opt${i}`, mode: 'thumb' });
    v.setProfile(o.profile);
    return { o, box, card, note, v };
  });
  setBody(grid);
  primary('Check answers', checkQ1);
  startFollowing();
}

function checkQ1() {
  stopFollowing({ home: false });
  let allRight = true;
  R.optionViews.forEach(({ o, box, card, note, v }) => {
    box.disabled = true;
    const right = box.checked === o.isOSD;
    allRight &&= right;
    card.classList.add(right ? 'is-right' : 'is-wrong');
    note.innerHTML = explainOption(o);
    note.hidden = false;
    v.markNodes(o.changed);
  });
  const letters = list => (list.length ? joinAnd(list) : 'none');
  const correct = R.options.filter(o => o.isOSD).map(o => o.letter);
  const picked = R.optionViews.filter(x => x.box.checked).map(x => x.o.letter);
  const which = correct.length === 1 ? `The one-shot deviation is ${correct[0]}.` : `The one-shot deviations are ${letters(correct)}.`;
  if (allRight) feedback('ok', `All correct. ${which} Rings mark the nodes where each option departs from <i>s</i>.`);
  else feedback('bad', `Not quite. ${which} You checked ${letters(picked)}. Rings mark the nodes where each option departs from <i>s</i>.`);
  primary('Continue to question 2', () => goto('q2'));
}

// ---------- question 2: is s subgame perfect ----------

function stepQ2() {
  view.setProfile(R.s);
  setCaption(`The strategy profile <i>s</i> = ${notation()}.`);
  setStem('Is <i>s</i> a subgame perfect Nash equilibrium?');
  const yes = h('button', { class: 'btn btn-outline-olive', type: 'button' }, 'Yes');
  const no = h('button', { class: 'btn btn-outline-olive', type: 'button' }, 'No');
  const answer = saidYes => {
    yes.disabled = no.disabled = true;
    (saidYes ? yes : no).classList.add('active');
    answerQ2(saidYes);
  };
  yes.addEventListener('click', () => answer(true));
  no.addEventListener('click', () => answer(false));
  setBody(h('div', { class: 'yes-no' }, yes, no));
}

function answerQ2(saidYes) {
  const isSPNE = R.wrongNodes.length === 0;
  const why = 'At every decision node, <i>s</i> picks the best action for the player who moves there, given what <i>s</i> does in the rest of the subgame.';
  if (isSPNE) {
    ['q3', 'q4', 'q5'].forEach(k => skipped.add(k));
    finishRound();
    feedback(saidYes ? 'ok' : 'bad', saidYes ? `Right. ${why}` : `It is. ${why} Backward induction picks exactly the red edges.`);
    return;
  }
  if (saidYes) feedback('bad', 'It is not. Some player gains by changing an action in some subgame. Question 3 asks you to find such a change.');
  else feedback('ok', 'Right, it is not.');
  primary('Continue to question 3', () => goto('q3'));
}

// ---------- question 3: build a profitable one-shot deviation ----------

function stepQ3() {
  working = new Map(R.s);
  view.setProfile(working, R.s);
  setCaption('Clicking an edge makes it the action at that node. Where you change an action, a dashed red edge shows what <i>s</i> picked.');
  setStem('The profile <i>s</i> is not a subgame perfect equilibrium, so some player has a profitable one-shot deviation. Click edges to change actions until you have built one.');
  const reset = q3Reset = h('button', { class: 'btn btn-outline-olive btn-sm', type: 'button' }, 'Reset to ', h('i', {}, 's'));
  reset.addEventListener('click', () => {
    working = new Map(R.s);
    view.setProfile(working, R.s);
    feedback(null);
  });
  setBody(h('div', { class: 'tools' }, reset));
  view.setEdgeHandler(onQ3Edge);
}

function onQ3Edge(node, index) {
  if (working.get(node.id) === index) {
    if (R.s.get(node.id) === index) {
      feedback('info', `That is already the action <i>s</i> picks at ${nodeName(node)}. Click a different edge to change it.`);
    }
    return;
  }
  working.set(node.id, index);
  view.setProfile(working, R.s);

  const changed = diffNodes(R.tree.decisionNodes, R.s, working);
  if (changed.length === 0) {
    feedback('info', 'You have not changed anything yet.');
    return;
  }
  if (changed.length === 1) {
    const n = changed[0];
    const g = deviationPayoffs(n, R.s, working.get(n.id));
    const i = g.mover - 1;
    if (!g.profitable) {
      feedback('bad', `This is a one-shot deviation, but it is not profitable: Player ${g.mover} gets ${g.after[i]} instead of ${g.before[i]} ${subgamePhrase(n)}.`);
      return;
    }
    feedback('ok', `Correct: Player ${g.mover} gets ${g.after[i]} instead of ${g.before[i]} ${subgamePhrase(n)}. This is a profitable one-shot deviation.`);
    view.setEdgeHandler(null);
    q3Reset.disabled = true;
    R.deviation = { node: n, index: working.get(n.id), profile: new Map(working), payoffs: g };
    const next = skipped.has('q4') ? 'q5' : 'q4';
    primary(`Continue to question ${STEPS.find(x => x.key === next).num}`, () => goto(next));
    return;
  }
  const players = new Set(changed.map(n => n.player));
  if (players.size === 1) {
    const k = changed.length;
    feedback('bad', `This is a ${shotWord(k)}-shot deviation: Player ${changed[0].player}'s actions change at ${shotWord(k)} nodes. A one-shot deviation changes only one of them.`);
  } else {
    feedback('bad', `This changes the strategies of ${playerList(players)}. A one-shot deviation changes one player's action at one node.`);
  }
}

// ---------- question 4: whose deviation ----------

function subsets(n) {
  const out = [];
  for (let mask = 1; mask < (1 << n); mask++) {
    const set = [];
    for (let p = 1; p <= n; p++) if (mask & (1 << (p - 1))) set.push(p);
    out.push(set);
  }
  return out.sort((a, b) => a.length - b.length || a[0] - b[0] || (a[1] ?? 0) - (b[1] ?? 0));
}

function stepQ4() {
  view.setProfile(R.deviation.profile, R.s);
  setCaption('Your deviation. The dashed red edge is what <i>s</i> picked at the node you changed.');
  setStem('For the deviation you found, which player has a profitable one-shot deviation?');
  const list = h('div', { class: 'choice-list', role: 'radiogroup' });
  subsets(R.numPlayers).forEach((set, i) => {
    const input = h('input', { type: 'radio', name: 'q4', class: 'form-check-input', id: `q4-${i}`, value: set.join(',') });
    list.append(h('div', { class: 'form-check' }, input,
      h('label', { class: 'form-check-label', for: `q4-${i}` }, playerList(set))));
  });
  setBody(list);
  primary('Check answer', checkQ4);
}

function checkQ4() {
  const picked = document.querySelector('input[name="q4"]:checked');
  if (!picked) { feedback('info', 'Choose one of the options first.'); return; }
  const chosen = picked.value.split(',').map(Number);
  const { node, payoffs } = R.deviation;
  const m = node.player;
  const gains = p => payoffs.after[p - 1] > payoffs.before[p - 1];
  const others = chosen.filter(p => p !== m);

  if (chosen.length === 1 && chosen[0] === m) {
    const freeRiders = [];
    for (let p = 1; p <= R.numPlayers; p++) if (p !== m && gains(p)) freeRiders.push(p);
    const extra = freeRiders.map(p => ` Player ${p} also profits, but the deviation does not change Player ${p}'s strategy.`).join('');
    feedback('ok', `Right. Only Player ${m}'s action changed, so this is Player ${m}'s deviation.${extra}`);
    document.querySelectorAll('input[name="q4"]').forEach(i => { i.disabled = true; });
    primary('Continue to question 5', () => goto('q5'));
    return;
  }
  const parts = [chosen.includes(m)
    ? 'A one-shot deviation changes one player\'s action at one node.'
    : `The action that changed belongs to Player ${m}.`];
  others.forEach(p => {
    parts.push(gains(p)
      ? `Although Player ${p} also profits from this deviation, it is not a deviation from Player ${p}'s strategy.`
      : `Player ${p} does not move at that node and does not gain from the change.`);
  });
  feedback('bad', `${parts.join(' ')} Try again.`);
}

// ---------- question 5: the subgame of the deviation ----------

function stepQ5() {
  q5Choice = null;
  view.setProfile(R.deviation.profile, R.s);
  view.setOutline(null);
  view.setSelectedNode(null);
  setCaption('Your deviation. The dashed red edge is what <i>s</i> picked at the node you changed.');
  setStem('Click the node that is the root of the subgame where your profitable one-shot deviation occurs.');
  setBody(h('p', { class: 'hint' }, 'Each click outlines the subgame that starts at that node. Click as often as you like, then press ',
    h('kbd', {}, 'Shift'), '+', h('kbd', {}, 'Enter'), ' to submit the outlined subgame.'));
  view.setNodeHandler(node => {
    q5Choice = node;
    view.setOutline(polygonPath(subgamePolygon(node)));
    view.setSelectedNode(node);
    feedback(null);
  });
}

function submitQ5() {
  if (!q5Choice) { feedback('info', 'Click a node first, then press Shift+Enter.'); return; }
  const target = R.deviation.node;
  if (q5Choice === target) {
    view.setNodeHandler(null);
    finishRound(`Right. The deviation happens at the root of this subgame, the node where Player ${target.player}'s action changed.`);
  } else if (isAncestor(q5Choice, target)) {
    feedback('bad', 'This subgame contains your deviation, but it starts higher up. A one-shot deviation happens at the root of its subgame, at the node where the action changed.');
  } else {
    feedback('bad', 'Your deviation is not inside this subgame.');
  }
}

document.addEventListener('keydown', e => {
  if (step === 'q5' && e.key === 'Enter' && e.shiftKey) {
    e.preventDefault();
    submitQ5();
  }
});

// ---------- signature rule under the header ----------

// A row of two-pronged forks, one red prong each: a strategy, drawn as a rule.
// One fork has switched prongs, with s's old choice left as a dashed trace:
// a one-shot deviation.
function drawForkRule() {
  const svg = $('fork-rule');
  const NS = 'http://www.w3.org/2000/svg';
  const W = 940, n = 31, gap = W / n;
  const dev = 6 + Math.floor(Math.random() * (n - 12));
  const add = (tag, attrs) => {
    const e = document.createElementNS(NS, tag);
    Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
    svg.appendChild(e);
  };
  add('line', { x1: 0, y1: 13, x2: W, y2: 13, class: 'fr-spine' });
  for (let i = 0; i < n; i++) {
    const x = i * gap + 6;
    const up = Math.random() < 0.5;
    const ends = [{ y: 4, isUp: true }, { y: 22, isUp: false }];
    ends.forEach(({ y, isUp }) => {
      const pickedHere = i === dev ? isUp !== up : isUp === up;
      const ghost = i === dev && isUp === up;
      add('line', { x1: x, y1: 13, x2: x + 15, y2: y, class: pickedHere ? 'fr-red' : ghost ? 'fr-ghost' : 'fr-ink' });
    });
    add('circle', { cx: x, cy: 13, r: 2.6, class: 'fr-node' });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  drawForkRule();
  $('new-game').addEventListener('click', newGame);
  newGame();
});
