// The stage game, the automaton (S, α, τ), and the notation that names them.
//
// game = { n, m: [m1, m2, m3], names: [[...], [...], [...]], pay: { "r,c,z": ["6", "6", ""] } }
// A profile is an index triple [r, c, z]: player 1's action r, player 2's c,
// player 3's z (unused players sit at 0). Its key is "r,c,z".

export const MAX_ACTIONS = { 1: 6, 2: 5, 3: 4 };
export const MAX_STATES = 9;
export const PLAYER_COLORS = ['#ff0000', '#0000ff', '#00cc00'];

export function defaultNames(k) {
  return Array.from({ length: k }, (_, i) => String.fromCharCode(65 + i));
}

export function newGame() {
  return { n: 2, m: [2, 2, 1], names: [defaultNames(2), defaultNames(2), ['A']], pay: {} };
}

export const keyOf = p => p.join(',');
export const fromKey = k => k.split(',').map(Number);

// All profiles, player 1's action varying slowest.
export function profiles(g) {
  const out = [];
  for (let r = 0; r < g.m[0]; r++)
    for (let c = 0; c < (g.n >= 2 ? g.m[1] : 1); c++)
      for (let z = 0; z < (g.n >= 3 ? g.m[2] : 1); z++) out.push([r, c, z]);
  return out;
}

const players = g => Array.from({ length: g.n }, (_, i) => i);
export const actionOf = (p, i) => p[i];

// ---------- notation ----------

const short = g => players(g).every(i => g.names[i].slice(0, g.m[i]).every(a => a.length === 1));
const texName = a => (a.length === 1 ? a : `\\text{${a}}`);

// "CD" when every action name is one character (as in the lecture), else "(Hi, Lo)".
export function profileTex(g, p) {
  const parts = players(g).map(i => texName(g.names[i][p[i]]));
  if (g.n === 1) return parts[0];
  return short(g) ? parts.join('') : `(${parts.join(',')})`;
}
// Argument form: u(CD), u(\text{Hi},\text{Lo}) — no doubled parentheses.
export function profileArgTex(g, p) {
  const parts = players(g).map(i => texName(g.names[i][p[i]]));
  return short(g) ? parts.join('') : parts.join(',');
}
export function profileText(g, p) {
  const parts = players(g).map(i => g.names[i][p[i]]);
  if (g.n === 1) return parts[0];
  return short(g) ? parts.join('') : `(${parts.join(', ')})`;
}
export const stateTex = k => `s_{${k + 1}}`;

// A set of player i's actions, comma-separated (never "and").
export function actionSetTex(g, i, set) {
  return [...set].sort((a, b) => a - b).map(a => texName(g.names[i][a])).join(', ');
}

// Parse a typed profile: "CD", "C D", "C,D", "(C, D)", "(Hi, Lo)". Case-insensitive.
export function parseProfile(g, text) {
  const t = text.replace(/[()\s]+/g, ' ').trim();
  if (!t) return null;
  let toks = t.split(/[\s,]+/).filter(Boolean);
  if (toks.length === 1 && g.n > 1 && short(g)) toks = [...toks[0]];
  if (toks.length !== g.n) return null;
  const p = [0, 0, 0];
  for (let i = 0; i < g.n; i++) {
    const a = g.names[i].slice(0, g.m[i]).findIndex(x => x.toLowerCase() === toks[i].toLowerCase());
    if (a < 0) return null;
    p[i] = a;
  }
  return p;
}

// ---------- payoffs ----------

// Accept integers, decimals and fractions a/b, with "-" or the true minus sign.
export function parseNumber(s) {
  if (s == null) return null;
  const t = String(s).replace(/−/g, '-').replace(/\s+/g, '');
  if (/^-?\d+(\.\d+)?$/.test(t)) return { kind: 'dec', text: t };
  if (/^-?\d+\/\d+$/.test(t) && !/\/0+$/.test(t)) return { kind: 'frac', text: t };
  if (/^-?\.\d+$/.test(t)) return { kind: 'dec', text: t.replace('.', '0.') };
  return null;
}

function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; }

// Exact rational as {num, den} (BigInt-free; payoffs are small).
export function rational(s) {
  const v = parseNumber(s);
  if (!v) return null;
  let num, den;
  if (v.kind === 'frac') {
    const [a, b] = v.text.split('/').map(Number);
    num = a; den = b;
  } else {
    const neg = v.text.startsWith('-');
    const [ip, fp = ''] = v.text.replace('-', '').split('.');
    den = 10 ** fp.length;
    num = Number(ip) * den + Number(fp || 0);
    if (neg) num = -num;
  }
  const g = gcd(num, den);
  return { num: num / g, den: den / g };
}

// Mathematica literal: 6, -3, 5/2.
export function mathematicaNumber(s) {
  const r = rational(s);
  return r.den === 1 ? String(r.num) : `${r.num}/${r.den}`;
}
// KaTeX for a payoff shown in the matrix.
export function payoffTex(s) {
  const r = rational(s);
  if (!r) return '';
  const v = parseNumber(s);
  if (v.kind === 'dec') return v.text;
  const sign = r.num < 0 ? '-' : '';
  return r.den === 1 ? `${r.num}` : `${sign}\\tfrac{${Math.abs(r.num)}}{${r.den}}`;
}

export function payoff(g, p, i) { return (g.pay[keyOf(p)] || [])[i]; }

export function missingPayoff(g) {
  for (const p of profiles(g)) for (let i = 0; i < g.n; i++) if (!parseNumber(payoff(g, p, i))) return { p, i };
  return null;
}

export function nameProblem(g) {
  for (let i = 0; i < g.n; i++) {
    const names = g.names[i].slice(0, g.m[i]);
    for (const a of names) {
      if (!/^[A-Za-z][A-Za-z0-9]{0,5}$/.test(a)) return { i, msg: `Action names start with a letter and use at most six letters or digits ("${a || ' '}" does not).` };
    }
    const low = names.map(a => a.toLowerCase());
    if (new Set(low).size !== low.length) return { i, msg: `Player ${i + 1} has two actions with the same name.` };
  }
  return null;
}

// ---------- automaton ----------
// alpha[k] = profile key or null; tau[k] = { profileKey: target state index }.

export function deviationProfile(p, i, a) { const q = [...p]; q[i] = a; return q; }

export function nextState(tau, k, p) { return tau[k] ? tau[k][keyOf(p)] : undefined; }

export function tauComplete(g, tau, k) {
  return profiles(g).every(p => Number.isInteger(nextState(tau, k, p)));
}

// Edge label for state k → state t, as in the lecture: the profiles that take
// the edge; nothing if every profile does; else the ones that do not, after ≠.
export function edgeGroups(g, tau, k) {
  const all = profiles(g);
  const by = new Map();
  for (const p of all) {
    const t = nextState(tau, k, p);
    if (!by.has(t)) by.set(t, []);
    by.get(t).push(p);
  }
  const out = [];
  for (const [t, ps] of by) {
    let label = '';
    if (ps.length < all.length) {
      const rest = all.filter(p => !ps.some(q => keyOf(q) === keyOf(p)));
      label = rest.length < ps.length
        ? `$\\neq ${rest.map(p => profileTex(g, p)).join(', ')}$`
        : `$${ps.map(p => profileTex(g, p)).join(', ')}$`;
    }
    out.push({ from: k, to: t, label });
  }
  return out;
}

export function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
