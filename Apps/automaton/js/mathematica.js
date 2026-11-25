// Mathematica code built from the student's automaton. Plain ASCII only: δ is
// written \[Delta], Mathematica's own name for the character, so the code
// survives any copy path. V[i, s] is the value of player i at state s.

import {
  deviationProfile, fromKey, keyOf, mathematicaNumber, nextState, payoff, profileText,
} from './model.js';

const D = '\\[Delta]';
const st = k => `s${k + 1}`;
const pad = (s, w) => s + ' '.repeat(Math.max(1, w - s.length));

function rhs(g, i, p, t) {
  return `${mathematicaNumber(payoff(g, p, i))} + ${D} V[${i + 1}, ${st(t)}]`;
}

// Step "Solve for V": the value function as a linear system in δ.
export function valueCode(g, alpha, tau) {
  const K = alpha.length;
  const rows = [];
  for (let i = 0; i < g.n; i++) {
    for (let k = 0; k < K; k++) {
      const p = fromKey(alpha[k]);
      const t = nextState(tau, k, p);
      rows.push({
        code: `V[${i + 1}, ${st(k)}] == ${rhs(g, i, p, t)}`,
        note: `(* ${st(k)} plays ${profileText(g, p)}, next state ${st(t)} *)`,
      });
    }
  }
  const w = Math.max(...rows.map(r => r.code.length)) + 2;
  const body = rows.map((r, j) => '  ' + pad(r.code + (j < rows.length - 1 ? ',' : ''), w) + r.note).join('\n');
  const players = Array.from({ length: g.n }, (_, i) => i + 1).join(', ');
  const states = alpha.map((_, k) => st(k)).join(', ');
  return [
    '(* Value function: V[i, s] is the value of player i at state s *)',
    'eqs = {',
    body,
    '};',
    `vars = Flatten[Table[V[i, s], {i, {${players}}}, {s, {${states}}}]];`,
    'sol = Simplify[First[Solve[eqs, vars]]]',
  ].join('\n');
}

// One-shot deviation conditions: for each player i, state s and action a_i
// other than the one α(s) prescribes,
//   V[i, s] >= u_i(a_i, α_{-i}(s)) + δ V[i, τ(s, (a_i, α_{-i}(s)))].
export function osdLines(g, alpha, tau) {
  const out = [];
  for (let i = 0; i < g.n; i++) {
    for (let k = 0; k < alpha.length; k++) {
      const p = fromKey(alpha[k]);
      const devs = [];
      for (let a = 0; a < g.m[i]; a++) {
        if (a === p[i]) continue;
        const q = deviationProfile(p, i, a);
        const t = nextState(tau, k, q);
        devs.push({
          action: g.names[i][a],
          code: `V[${i + 1}, ${st(k)}] >= ${rhs(g, i, q, t)}`,
          note: `(* plays ${g.names[i][a]}: outcome ${profileText(g, q)}, next state ${st(t)} *)`,
        });
      }
      out.push({ i, k, devs });
    }
  }
  return out;
}

export function osdCode(g, alpha, tau) {
  const conds = osdLines(g, alpha, tau);
  const lines = ['(* Paste below the value-function code, in the same notebook. *)',
    '(* osd[i, s]: no one-shot deviation of player i at state s is profitable *)'];
  const all = [];
  conds.forEach(({ i, k, devs }) => {
    const head = `osd[${i + 1}, ${st(k)}] = `;
    devs.forEach((d, j) => {
      const lead = j === 0 ? head : ' '.repeat(head.length);
      const tail = j < devs.length - 1 ? ' &&' : ';';
      all.push({ code: lead + d.code + tail, note: d.note });
    });
  });
  const w = Math.max(...all.map(r => r.code.length)) + 2;
  all.forEach(r => lines.push(pad(r.code, w) + r.note));
  lines.push('');
  lines.push('(* Test each deviation for 0 < delta < 1. Each line prints what it tests, then the');
  lines.push('   discount factors for which it holds; N gives the cutoffs as decimals. *)');
  conds.forEach(({ i, k, devs }) => devs.forEach(d => {
    lines.push(`Print["Player ${i + 1} at state ${st(k)}, value of following the strategy \\[GreaterEqual] value of deviating to ${d.action}:   ",`);
    lines.push(`  N[Reduce[{${d.code} /. sol, 0 < ${D} < 1}, ${D}]]]`);
  }));
  return lines.join('\n');
}

export function allCode(g, alpha) {
  const names = [];
  for (let i = 0; i < g.n; i++) for (let k = 0; k < alpha.length; k++) names.push(`osd[${i + 1}, ${st(k)}]`);
  const chunks = [];
  for (let j = 0; j < names.length; j += 4) chunks.push(names.slice(j, j + 4).join(' && '));
  return [
    '(* Paste below the one-shot deviation code, in the same notebook. *)',
    '(* Is there a delta in (0, 1) that satisfies every condition at once? *)',
    'allOSD = ' + chunks.join(' &&\n         ') + ';',
    `N[Reduce[{allOSD /. sol, 0 < ${D} < 1}, ${D}]]`,
  ].join('\n');
}

export { keyOf };
