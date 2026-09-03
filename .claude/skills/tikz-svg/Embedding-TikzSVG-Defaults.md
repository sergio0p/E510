# Embedding tikz-svg in Lecture Frames

Two layout patterns for placing tikz-svg `render()` graphs inside beamer-style lecture frames.

## Pattern 1: Side-by-Side Columns (Text + Graph)

Text on one side, graph on the other. Used when bullet points reveal alongside graph elements.

```html
<section class="frame overlay-frame">
  <div class="frame-title-bar">
    <h2 class="frame-title">Title</h2>
    <p class="frame-subtitle">Subtitle</p>
  </div>
  <div class="frame-content">
    <div class="columns">
      <div class="column">
        <p>Introductory text</p>
        <ul>
          <li class="overlay">First point</li>
          <li class="overlay">Second point</li>
        </ul>
      </div>
      <div class="column">
        <svg id="my-graph" style="display: block; width: 100%;"></svg>
      </div>
    </div>
  </div>
</section>
```

Graph elements sync with overlay reveals via `frame:` specs in the `draw` array.

## Pattern 2: Horizontal Insert (Inline Between Text)

Graph inserted between paragraphs. Used for diagrams that illustrate a point before the text continues.

```html
<section class="frame">
  <div class="frame-title-bar">
    <h2 class="frame-title">Title</h2>
    <p class="frame-subtitle">Subtitle</p>
  </div>
  <div class="frame-content">
    <p>Text before the diagram.</p>
    <svg id="my-diagram" style="max-width: 420px; width: 100%; display: block; margin: 0.75rem auto 0.75rem 2rem;"></svg>
    <script type="module">
      import { render } from './tikz-svg/src-v2/index.js';
      render(document.getElementById('my-diagram'), {
        // config here
      });
    </script>
    <p>Text continues after the diagram.</p>
  </div>
</section>
```

The left margin (`2rem`) indents the diagram to align with list content. Adjust `max-width` to fit: 350-420px for automata/trees, up to 500px for wider graphs.

## SVG Container Rules

- **Never** use fixed `width`/`height` (e.g., `width: 500px; height: 200px`).
- Use `max-width` + `width: 100%` -- tikz-svg sets the viewBox automatically.
- For column layout: `style="display: block; width: 100%;"` (column constrains width).
- For inline insert: `style="max-width: 420px; width: 100%; display: block; margin: 0.75rem auto 0.75rem 2rem;"`.

## Script Placement

- **Column layout:** Place `<script type="module">` at the end of the file in a single block (see `supply-demand.html`).
- **Inline insert:** Place `<script type="module">` immediately after its `<svg>` element (see `arbitrage.html`). This keeps render calls close to the element they target.
