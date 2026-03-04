# Game Tree SVG Specification

Reference document for rendering static game trees as inline SVG in ECON 510 web lectures. TikZ automata/trees library syntax serves as the **description language** for specifying tree structure; **SVG rendering specs** are derived from the backward-induction app (`E510/GameTreeApp/backward-induction/`).

Covers three TikZ styles found in `E510_LEC_SPR26.tex`:
1. **Automata-style** — `\node[state]` + `\path edge` (General/President, SPE decomposition, Filtration)
2. **Tree-style** — `child{}` + `\edge from parent` (Entry Deterrence, Centipede, Bargaining)
3. **Information trees** — rectangle nodes, no payoffs (Filtration)

---

## Part 1: TikZ Description Language Reference

### 1.1 Automata-Style Syntax

Loading (line 35 of `E510_LEC_SPR26.tex`):
```latex
\usetikzlibrary{external,matrix,automata,trees,positioning,shadows,arrows,
                 shapes.geometric,shapes.multipart,trees,calc,fit,
                 decorations.pathmorphing}
```

Tikzpicture options:
```latex
[->,>=stealth',shorten >=1pt,auto,node distance=3.5cm,semithick]
```

Custom styles:
```latex
\tikzstyle{every state}=[fill,draw=none,green!50!black,text=white,drop shadow]
\tikzstyle{payoff}=[circle split, draw,text=black,inner sep=0.05cm,drop shadow]
\tikzstyle{initial}=[red,text=white,drop shadow]
```

Node syntax:
```latex
\node[state,initial] (ID)  {LABEL};                                          % first-mover
\node[state]         (ID)  [right of=REF, yshift=Ycm] {LABEL};              % decision
\node[payoff]        (ID)  [right of=REF, yshift=Ycm] {TOP \nodepart{lower} BOT}; % terminal
```

Edge syntax:
```latex
\path (FROM) edge node [above/below, xshift=X] {ACTION} (TO);
\path (FROM) edge[red] node [above] {ACTION} (TO);   % highlighted (SPE)
```

Node types:

| Style | Shape | Meaning |
|-------|-------|---------|
| `state` | Filled circle | Decision node (player label inside) |
| `state, initial` | Filled circle (red) | First-mover decision node |
| `payoff` (circle split) | Split circle | Terminal node (top=P1, bottom=P2) |

Positioning keys: `right of`, `above right of`, `below right of`, `xshift`, `yshift`

### 1.2 Tree-Style Syntax

Tikzpicture options:
```latex
[grow=right, sloped]
```

Level styles:
```latex
\tikzstyle{level 1}=[level distance=3.5cm, sibling distance=3.5cm]
\tikzstyle{level 2}=[level distance=3.5cm, sibling distance=2cm]
```

Custom styles:
```latex
\tikzstyle{dec} = [text width=4em, text centered]           % decision node
\tikzstyle{end} = [circle, minimum width=3pt,fill, inner sep=0pt] % terminal dot
```

Tree syntax:
```latex
\node[dec]{Player $1$}
  child{
    node[dec]{Player $2$}
      child{ node[end,label=right:{$payoffs$}]{} edge from parent node[above]{action} }
      child{ node[end,label=right:{$payoffs$}]{} edge from parent node[above]{action} }
    edge from parent node[above]{action}
  }
  child{
    node[end,label=right:{$payoffs$}]{}
    edge from parent node[above]{action}
  };
```

Centipede variant (mixed grow directions):
```latex
\tikzstyle{level 1}=[level distance=2cm, sibling distance=2cm]
\tikzstyle{dec} = [text width=1em, text centered]
\tikzstyle{end} = [circle, minimum width=3pt,fill, inner sep=0pt,black]

child[grow=right]{ ... child[grow=down]{ ... } child[grow=right]{ ... } }
```

### 1.3 Information Tree Syntax (Non-Game)

Rectangle nodes with math content:
```latex
\tikzstyle{every state}=[rectangle, rounded corners, draw, drop shadow,
                         minimum width=2.5cm, minimum height=0.8cm,
                         align=center, fill=white]

\node[state] (A) [xshift=-1cm] {$\Omega$};
\node[state] (B) [above right of=A,xshift=15mm] {$\{\omega_1, \omega_2\}$};
\path (A) edge node[above left]{L Infl.} (B);
```

Time-period labels (plain nodes, no border):
```latex
\node (t0) [below of=A, yshift=-2cm] {$t=0$};
```

---

## Part 2: SVG Rendering Specification

### 2.0 Math Text Rule

**Never use Unicode symbols** inside SVG `<text>` elements. Any expression containing math — Greek letters, subscripts, set braces, payoff tuples — must be rendered as a **single KaTeX expression** in an absolutely positioned HTML span over the SVG. The entire expression stays in KaTeX, not just individual symbols:
- `$\Omega$` — not `Ω`
- `$\{\omega_1, \omega_2\}$` — not `{ω₁, ω₂}`
- `$(-25, -5)$` — not `(−25, −5)`

Plain ASCII action labels (e.g., "enter", "fight", "L Infl.") may remain as SVG `<text>`.

**Never use `<foreignObject>` for KaTeX inside SVG.** KaTeX auto-render cannot properly size content inside the scaled SVG coordinate system — labels either vanish or overflow. Always use the HTML overlay pattern described in Section 2.8.

### 2.1 Canvas & Layout

- Background: `#fdf6e3` (Solarized base3) — consistent with all 510 graphs
- Border-radius: `8px`
- **ViewBox**: use a **landscape** aspect ratio (e.g., `2000 1100`). Portrait viewBox ratios render tiny on wide screens.
- Font: `'STIX Two Text', serif` for SVG text labels; KaTeX for all math
- **Two font-size systems**: SVG `<text>` font-sizes are in viewBox units (scale with the SVG). KaTeX label font-sizes are in CSS units like `em` (do NOT scale with SVG). These must be tuned independently.

### 2.2 Decision Nodes

Source: `tree-renderer.js` lines 752–775.

```svg
<circle r="24" cx="{x}" cy="{y}" fill="{PLAYER_COLOR}" filter="url(#drop-shadow)"/>
<text x="{x}" y="{y}" text-anchor="middle" dominant-baseline="central"
      font-size="18" font-weight="bold" fill="white">{LABEL}</text>
```

Player colors:

| Player | Color | Hex |
|--------|-------|-----|
| P1 | Red | `#DC2626` |
| P2 | Green | `#16A34A` |
| P3 | Blue | `#2563EB` |

Drop shadow filter (use generous values — subtle shadows are invisible at typical render sizes):
```svg
<filter id="drop-shadow" x="-50%" y="-50%" width="200%" height="200%">
  <feDropShadow dx="4" dy="4" stdDeviation="6" flood-opacity="0.5"/>
</filter>
```

For `initial` (first-mover) nodes: same circle, P1 color (`#DC2626`).

For **information trees** (non-game): use rectangles:
```svg
<rect x="{x-w/2}" y="{y-h/2}" width="{w}" height="{h}" rx="8" ry="8"
      fill="#ffffff" stroke="#586e75" stroke-width="1.5" filter="url(#drop-shadow)"/>
```
Math labels via KaTeX HTML divs positioned absolutely (same pattern as `101/GRAPH-SPECS.md`).

### 2.3 Terminal Nodes (Payoff Nodes)

Source: `tree-renderer.js` lines 777–843.

**Split-circle style** (automata-style trees):
```svg
<circle r="24" cx="{x}" cy="{y}" fill="#E5E7EB" stroke="#9CA3AF"
        stroke-width="2" filter="url(#drop-shadow)"/>
```

Divider lines inside the circle:

| Players | Lines | y-positions |
|---------|-------|-------------|
| 2 | 1 horizontal at y=0 | Payoffs at y=−10, y=10 |
| 3 | 2 horizontal at y=−8, y=8 | Payoffs at y=−16, y=0, y=16 |

```svg
<!-- 2-player divider -->
<line x1="{x-18}" y1="{y}" x2="{x+18}" y2="{y}" stroke="#9CA3AF" stroke-width="1"/>
<!-- Payoff text -->
<text x="{x}" y="{y-10}" text-anchor="middle" dominant-baseline="central"
      font-size="14" font-weight="bold" fill="#374151">{P1_PAYOFF}</text>
<text x="{x}" y="{y+10}" text-anchor="middle" dominant-baseline="central"
      font-size="14" font-weight="bold" fill="#374151">{P2_PAYOFF}</text>
```

**Payoff alignment** — use `text-anchor="end"` instead of `text-anchor="middle"` to right-align payoff numbers within the split circle. This aligns digits on the right so that positive numbers (e.g., "3") and negative numbers (e.g., "-1") line up naturally, with the minus sign extending left. Set `x` slightly right of center (e.g., `x + 22` for `r=67`). This replaces the LaTeX `\phantom{-}` trick:
```svg
<text x="{x+22}" y="{y-29}" text-anchor="end" dominant-baseline="central"
      font-size="43" font-weight="bold" fill="#374151">{P1_PAYOFF}</text>
<text x="{x+22}" y="{y+29}" text-anchor="end" dominant-baseline="central"
      font-size="43" font-weight="bold" fill="#374151">{P2_PAYOFF}</text>
```

**Dot style** (tree-style trees):
```svg
<circle r="3" cx="{x}" cy="{y}" fill="black"/>
<text x="{x+10}" y="{y}" font-size="14" fill="#374151">{payoff string}</text>
```

### 2.4 Edges (Arrows)

Source: `tree-renderer.js` lines 565–664.

Arrowhead markers:
```svg
<marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
  <polygon points="0 0, 10 3.5, 0 7" fill="#374151"/>
</marker>
<marker id="arrowhead-red" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
  <polygon points="0 0, 10 3.5, 0 7" fill="#DC2626"/>
</marker>
```

**Horizontal edges** — quadratic Bézier with 15% vertical offset:
```
startX = x1 + R
endX   = x2 - R - GAP - ARROW_EXT
midX   = (startX + endX) / 2
midY   = (y1 + y2) / 2
offset = (y2 - y1) * 0.15

M startX y1  Q midX (midY - offset)  endX y2
```

**Vertical edges** — straight lines:
```
direction = y2 > y1 ? 1 : -1
startY = y1 + (R * direction)
endY   = y2 - ((R + GAP + ARROW_EXT) * direction)

M x1 startY  L x1 endY
```

Constants: `R = 24`, `GAP = 1`, `ARROW_EXT = 2`

Stroke styles:

| State | Stroke | Width | Marker |
|-------|--------|-------|--------|
| Default | `#374151` | 2px | `url(#arrowhead)` |
| Optimal/SPE | `#DC2626` | 3px | `url(#arrowhead-red)` |

### 2.5 Edge Labels (Action Names)

Source: `tree-renderer.js` lines 666–717.

**Horizontal edges**: label centered above curve midpoint, offset 8px up.
```
labelX = (startX + endX) / 2
labelY = midY - 0.5 * offset - 8
```

**Vertical edges**: label 12px to the left of edge midpoint.
```
labelX = x1 - 12
labelY = (startY + endY) / 2
```

```svg
<text x="{labelX}" y="{labelY}" text-anchor="middle" dominant-baseline="central"
      font-size="12" fill="#374151">{ACTION}</text>
```

For math labels (probabilities, etc.): use KaTeX HTML divs positioned absolutely.

### 2.6 Subgame Indicators

For SPE decomposition diagrams:
```svg
<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}"
         stroke="#268bd2" stroke-dasharray="6,4" fill="none" stroke-width="1.5"/>
```
Fit around a group of nodes using calculated bounding box + padding.

### 2.7 Time-Period / Annotation Labels

Plain text below the tree:
```svg
<text x="{x}" y="{y}" font-size="16" fill="#586e75" font-style="italic"
      text-anchor="middle">{label}</text>
```
Use `<text>` in SVG for simple labels; KaTeX HTML divs for math.

### 2.8 KaTeX HTML Overlay Pattern

**This is the only reliable method for rendering math labels on SVG trees.**

Structure:
```html
<div style="position: relative; width: 100%; overflow: visible;">
  <svg viewBox="0 0 2000 1100" style="display: block; width: 100%;
       background: #fdf6e3; border-radius: 8px;">
    <!-- edges, rects, plain-ASCII text labels only — NO math in SVG -->
  </svg>

  <!-- KaTeX labels positioned as percentage of viewBox dimensions -->
  <span style="position: absolute;
               left: {x / viewBoxWidth * 100}%;
               top: {y / viewBoxHeight * 100}%;
               transform: translate(-50%, -50%);
               color: #586e75; font-size: 0.9em;
               pointer-events: none; white-space: nowrap;">
    $\{\omega_1, \omega_2\}$
  </span>
</div>
```

Key rules:
1. **Wrapper div**: `position: relative; width: 100%`. Never use `aspect-ratio` + `max-height` — this constrains the SVG to a tiny box.
2. **SVG**: `display: block; width: 100%`. No `height` attribute — let the viewBox determine height naturally.
3. **Label spans**: `position: absolute` with `left` and `top` as percentages. Use `transform: translate(-50%, -50%)` to center on the coordinate. Always include `white-space: nowrap` to prevent wrapping near edges.
4. **Font-size**: in CSS units (e.g., `0.9em`). These do NOT scale with the SVG — tune independently from SVG `<text>` font-sizes.

---

## Part 3: Layout Algorithm Summary

Source: `backward-induction/LAYOUT-ALGORITHM.md`

### For static trees (no D3, no interactivity):

| Parameter | Value | Notes |
|-----------|-------|-------|
| Horizontal spacing | ~200px per level | Maps from `level distance` |
| Vertical spacing | ~120px between siblings | Maps from `sibling distance` |
| Node radius | 24px | All circular nodes |
| Minimum gap | 80px | Between non-parent-child nodes |
| Edge curves | 15% offset | Quadratic Bézier on horizontal edges |
| Collision threshold | 65px | Minimum distance between nodes |

### For hand-crafted static SVGs:

Follow TikZ positioning hints (`right of`, `above right of`, `xshift`, `yshift`) and convert to pixel coordinates. Typical mapping: 1cm ≈ 60px.

**Column spacing guideline**: use 600+ viewBox units between columns to keep edge angles gentle (under 30° from horizontal). Steep angles make trees hard to read. For a 3-column tree (e.g., t=0, t=1, t=2), place columns at roughly x = 10%, 42%, 80% of viewBox width.

---

## Part 4: Complete Examples

### Example 1: General vs President (Automata-Style)

TikZ source (`E510_LEC_SPR26.tex` lines 364–395):
```latex
\begin{tikzpicture}[->,>=stealth',shorten >=1pt,auto,node distance=3.5cm,semithick]
  \tikzstyle{every state}=[fill,draw=none,green!50!black,text=white,drop shadow]
  \tikzstyle{payoff}=[circle split, draw,text=black,inner sep=0.05cm,drop shadow]
  \tikzstyle{initial}=[red,text=white,drop shadow]

  \node[state,initial] (G)  {G};
  \node[state] (P1) [right of=G, yshift=2cm]  {P};
  \node[state] (P2) [right of=G, yshift=-2cm] {P};
  \node[payoff] (T1) [right of=P1, yshift=0.8cm]  {$\phantom{-}3$ \nodepart{lower} $-1$};
  \node[payoff] (T2) [right of=P1, yshift=-0.8cm] {$-2$ \nodepart{lower} $-2$};
  \node[payoff] (T3) [right of=P2, yshift=0.8cm]  {$\phantom{-}0$ \nodepart{lower} $-3$};
  \node[payoff] (T4) [right of=P2, yshift=-0.8cm] {$-1$ \nodepart{lower} $\phantom{-}3$};

  \path (G)  edge node [above, xshift=-0.8cm] {nuke USSR} (P1)
             edge node [below, xshift=-0.8cm] {don't nuke} (P2);
  \path (P1) edge node [above, yshift=+2mm, xshift=-2mm] {nuke USSR} (T1)
             edge node [below, yshift=-2mm, xshift=-2mm] {don't nuke} (T2);
  \path (P2) edge node [above, yshift=+2mm, xshift=-2mm] {nuke USSR} (T3)
             edge node [below, yshift=-2mm, xshift=-2mm] {don't nuke} (T4);
\end{tikzpicture}
```

SVG rendering: 7 nodes (1 initial `#DC2626` + 2 decision `#16A34A` + 4 terminal split-circles), 6 curved edges with action labels.

### Example 2: Entry Deterrence (Tree-Style)

TikZ source (`E510_LEC_SPR26.tex` lines 3592–3616):
```latex
\tikzstyle{level 1}=[level distance=3.5cm, sibling distance=3.5cm]
\tikzstyle{level 2}=[level distance=3.5cm, sibling distance=2cm]
\tikzstyle{dec} = [text width=4em, text centered]
\tikzstyle{end} = [circle, minimum width=3pt,fill, inner sep=0pt]

\begin{tikzpicture}[grow=right, sloped]
\node[dec]{Player $1$}
  child{
    node[dec]{Player $2$}
      child{ node[end,label=right:{$-25,-5$}]{} edge from parent node[above]{fight} }
      child{ node[end,label=right:{$50,50$}]{} edge from parent node[above]{accommodate} }
    edge from parent node[above]{enter}}
  child{
    node[end,label=right:{$0,100$}]{}
    edge from parent node[above]{stay out}};
\end{tikzpicture}
```

SVG rendering: 2 decision circles + 3 terminal dots, tree grows rightward with action labels on edges.

### Example 3: Centipede Game (5 moves, Mixed Grow)

TikZ source (`E510_LEC_SPR26.tex` lines 3708–3758):
```latex
\tikzstyle{dec} = [text width=1em, text centered]
\tikzstyle{end} = [circle, minimum width=3pt,fill, inner sep=0pt,black]

\node[dec]{$1$}
  child[grow=right]{
    node[dec]{$2$}
      child[grow=down]{ node[end,label=right:{$1,3$}]{} edge from parent node[left]{S} }
      child[grow=right]{
        node[dec]{$1$}
          child[grow=down]{ node[end,label=right:{$4,2$}]{} edge from parent node[left]{S} }
          child[grow=right]{ ... }
        edge from parent node[above]{C}
      }
    edge from parent node[above]{C}
  }
  child[grow=down]{
    node[end,label=right:{$2,0$}]{} edge from parent node[left]{S}
  };
```

SVG rendering: horizontal chain of decision nodes (alternating P1/P2 colors), vertical branches down to terminal dots. "C" labels on horizontal edges, "S" labels on vertical edges.

### Example 4: Filtration Information Tree

TikZ source (`E510_LEC_SPR26.tex` lines 817–843):
```latex
\tikzstyle{every state}=[rectangle, rounded corners, draw, drop shadow,
                         minimum width=2.5cm, minimum height=0.8cm,
                         align=center, fill=white]

\node[state] (A) [xshift=-1cm] {$\Omega$};
\node[state] (B) [above right of=A,xshift=15mm] {$\{\omega_1, \omega_2\}$};
\node[state] (C) [below right of=A,xshift=15mm] {$\{\omega_3, \omega_4\}$};
\node[state] (D) [above right of=B,xshift=27mm] {$\{\omega_1\}$};
\node[state] (E) [right of=B,xshift=22mm,yshift=-5mm] {$\{\omega_2\}$};
\node[state] (F) [right of=C,xshift=22mm,yshift=5mm] {$\{\omega_3\}$};
\node[state] (G) [below right of=C,xshift=29mm] {$\{\omega_4\}$};
\node       (t0) [below of=A,yshift=-2cm]{$t=0$};
\node       (t1) [right of=t0,xshift=7mm]{$t=1$};
\node       (t2) [right of=t1,xshift=20mm]{$t=2$};

\path (A) edge node[above left]{L Infl.} (B)
      (A) edge node[below left]{H Infl.} (C)
      (B) edge node[above left]{L Unemp.} (D)
      (B) edge node[below]{H Unemp.} (E)
      (C) edge node[above]{L Unemp.} (F)
      (C) edge node[below, xshift=-2mm]{H Unemp.} (G);
```

SVG rendering: 7 rounded-rectangle nodes (`<rect rx="8">`), 6 arrows, KaTeX math labels, italic time-period labels below.

---

## Quick Reference: Color Palette

| Element | Color | Hex |
|---------|-------|-----|
| Background | Solarized base3 | `#fdf6e3` |
| P1 decision node | Red | `#DC2626` |
| P2 decision node | Green | `#16A34A` |
| P3 decision node | Blue | `#2563EB` |
| Terminal node fill | Gray-200 | `#E5E7EB` |
| Terminal node stroke | Gray-400 | `#9CA3AF` |
| Edge / text default | Gray-700 | `#374151` |
| Optimal edge (SPE) | Red | `#DC2626` |
| Subgame ellipse | Sol-blue | `#268bd2` |
| Info-tree node stroke | Sol-base01 | `#586e75` |
| Annotation text | Sol-base01 | `#586e75` |
