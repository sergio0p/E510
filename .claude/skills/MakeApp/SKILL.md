---
name: make-app
description: Interactive single-page teaching apps for ECON courses using Bootstrap, KaTeX, Plotly, and vanilla JS.
---

# Interactive Teaching App Composition

This skill provides patterns for building interactive, single-page educational apps for ECON courses (101, 416, 510, etc.).

## Design Philosophy

Apps are **self-contained single HTML files** with inline CSS/JS (beyond shared resources). They use Bootstrap accordion for progressive disclosure, KaTeX for math rendering, and optionally Plotly for graphs. All interactivity is vanilla JavaScript — no React, Vue, or jQuery.

### Typical App Types
| Type | Example | Key Libraries |
|------|---------|---------------|
| Calculation drill | Recursive Utility, Discounting | Bootstrap + KaTeX |
| Guided multi-step | KKT Optimization | Bootstrap + KaTeX + Plotly + math.js |
| Slider exploration | PPF, Preference-Based Trade | Bootstrap + KaTeX + Plotly |
| Fill-in-the-blank | Cost Functions Table | KaTeX (no Bootstrap CSS) |
| Sorting / drag-drop | GDP Sorting Game | Bootstrap JS only (no Bootstrap CSS) |

---

## Theme Menu

Choose one of three themes when creating a new app. **Ask the user which theme to use** if not specified.

### Theme A: Solarized Light
Used by: KKT, Discounting, Recursive Utility, Arbitrage, PPF, Crusoe-Friday Trade

Requires `shared-bootstrap-edu.css` + Bootstrap CSS.

```css
:root {
    --base03: #002b36;  --base02: #073642;
    --base01: #586e75;  /* bold text/labels */
    --base00: #657b83;  /* primary text */
    --base0:  #839496;  --base1:  #93a1a1;
    --base2:  #eee8d5;  /* header/card bg */
    --base3:  #fdf6e3;  /* page bg */
    --yellow: #b58900;  /* warning */
    --orange: #cb4b16;  /* h1/primary accent */
    --red:    #dc322f;  /* error */
    --magenta:#d33682;  /* h4-h5 */
    --violet: #6c71c4;
    --blue:   #268bd2;  /* h2/actions */
    --cyan:   #2aa198;  /* h3/info, success accent */
    --green:  #859900;  /* success */
}
```

### Theme B: Carolina Blue
Used by: GDP Sorting Game. Self-contained CSS — no `shared-bootstrap-edu.css`, no Bootstrap CSS (Bootstrap JS only).

```css
:root {
    --unc-navy: #13294B;           /* headings/dark bg */
    --carolina-blue: #4B9CD3;     /* accents/buttons */
    --carolina-blue-light: #7AB8E0;
    --carolina-blue-pale: #E8F4FA; /* info panels */
    --bg-primary: #ffffff;         /* container bg */
    --bg-secondary: #f8f9fa;      /* page bg */
    --text-primary: #13294B;
    --text-secondary: #4a5568;
    --text-muted: #718096;
    --border-color: #e2e8f0;
    --success: #48bb78;
    --error: #f56565;
}
.btn-carolina { background: var(--carolina-blue); color: white; border: none; border-radius: 8px; padding: 10px 24px; font-weight: 600; }
.btn-outline  { background: transparent; color: var(--carolina-blue); border: 2px solid var(--carolina-blue); border-radius: 8px; padding: 10px 24px; font-weight: 600; }
.tile         { background: linear-gradient(145deg, #ffffff 0%, #f0f4f8 50%, #e8eef3 100%); }
.tile-correct { background: linear-gradient(145deg, #f0fff4 0%, #c6f6d5 100%); }
.tile-wrong   { background: linear-gradient(145deg, #fff5f5 0%, #fed7d7 100%); }
```

### Theme C: Black & White
Used by: Cost Functions Table. Self-contained CSS — no `shared-bootstrap-edu.css`, no Bootstrap CSS.

```css
:root {
    --bg-primary: #ffffff;    /* container/cell bg */
    --bg-secondary: #f5f5f5; /* page bg */
    --bg-tertiary: #e8e8e8;
    --text-primary: #1a1a1a;
    --text-secondary: #4a4a4a;
    --text-muted: #888888;
    --border-color: #d0d0d0;
    --border-dark: #333333;   /* dark borders/headers */
    --success: #2d2d2d;
    --error: #1a1a1a;
}
.btn-dark-outline { background: transparent; color: var(--text-primary); border: 2px solid var(--border-dark); border-radius: 6px; padding: 8px 20px; font-weight: 600; }
.btn-dark-solid   { background: var(--text-primary); color: var(--bg-primary); border: 2px solid var(--text-primary); border-radius: 6px; padding: 8px 20px; font-weight: 600; }
.cell-filled  { background: linear-gradient(145deg, #ffffff 0%, #e8e8e8 50%, #d8d8d8 100%); }
.cell-correct { background: linear-gradient(145deg, #f0f0f0 0%, #e0e0e0 50%, #d0d0d0 100%); }
.cell-shake   { background: #ffeeee; }
```

---

## HTML Boilerplate

All apps share this structure. Adjust CDN links and classes per theme.

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>App Title | ECON XXXH</title>

    <!-- Solarized only: Bootstrap CSS + shared theme -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
    <link rel="stylesheet" href="shared-bootstrap-edu.css">

    <!-- Always: KaTeX -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">

    <!-- Optional: Plotly (graphs) -->
    <script src="https://cdn.jsdelivr.net/npm/plotly.js-dist-min@2.27.0/plotly.min.js"></script>
    <!-- Optional: math.js (symbolic parsing) -->
    <script src="https://cdn.jsdelivr.net/npm/mathjs@12.2.1/lib/browser/math.min.js"></script>

    <style>
        /* Carolina Blue / B&W themes: full self-contained CSS here (see Theme B/C above) */
        /* Carolina Blue / B&W themes: also add body + container base styles: */
        /* body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: var(--bg-secondary); color: var(--text-primary); padding: 20px; line-height: 1.6; } */
        /* .container { max-width: 900px; margin: 0 auto; background: var(--bg-primary); padding: 30px; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.1); } */
    </style>
</head>
<body>

<div class="container mt-4" data-app="app-name">
    <!-- Solarized: use Bootstrap classes (d-flex, btn, etc.) -->
    <!-- Carolina/B&W: use inline styles or theme-specific classes -->

    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-3">
        <h1 class="mb-0">App Title</h1>
        <div class="btn-toolbar gap-1">
            <button class="btn btn-sm btn-outline-secondary" onclick="expandAll()">Expand All</button>
            <button class="btn btn-sm btn-outline-secondary" onclick="collapseAll()">Collapse All</button>
            <button class="btn btn-sm btn-outline-secondary" onclick="resetApp()">Reset</button>
            <button class="btn btn-sm btn-outline-secondary" onclick="window.print()">Print</button>
        </div>
    </div>

    <!-- Instructor Info -->
    <div class="edu-instructor-info">
        <p><strong>Sergio O. Parreiras</strong> | Economics Department, UNC at Chapel Hill</p>
        <p>ECON XXXH: Course Title | Spring 2026</p>
    </div>

    <!-- Main Accordion -->
    <div class="accordion" id="mainAccordion">
        <!-- Sections here -->
    </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js"></script>
<script>
// App code here
</script>
</body>
</html>
```

---

## Accordion Patterns

### Standard 3-Section (Calculation Apps — Solarized theme)
```html
<div class="accordion" id="mainAccordion">
    <!-- Section 1: Problem Setup (always open) -->
    <div class="accordion-item">
        <h2 class="accordion-header" id="headingSetup">
            <button class="accordion-button" type="button"
                    data-bs-toggle="collapse" data-bs-target="#collapseSetup">
                Problem Setup
            </button>
        </h2>
        <div id="collapseSetup" class="accordion-collapse collapse show"
             data-bs-parent="#mainAccordion">
            <div class="accordion-body" id="setup-content"></div>
        </div>
    </div>

    <!-- Section 2: Your Calculations (always open) -->
    <div class="accordion-item">
        <h2 class="accordion-header" id="headingCalc">
            <button class="accordion-button" type="button"
                    data-bs-toggle="collapse" data-bs-target="#collapseCalc">
                Your Calculations
            </button>
        </h2>
        <div id="collapseCalc" class="accordion-collapse collapse show"
             data-bs-parent="#mainAccordion">
            <div class="accordion-body">
                <div class="d-flex gap-2 mt-3">
                    <button class="btn btn-outline-secondary" onclick="generateNewProblem()">New Problem</button>
                    <button class="btn" onclick="checkAnswers()" style="background-color: var(--cyan); border-color: var(--cyan); color: var(--base3);">Check Answers</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Section 3: Solution (starts collapsed) -->
    <div class="accordion-item">
        <h2 class="accordion-header" id="headingSolution">
            <button class="accordion-button collapsed" type="button"
                    data-bs-toggle="collapse" data-bs-target="#collapseSolution">
                Solution
            </button>
        </h2>
        <div id="collapseSolution" class="accordion-collapse collapse"
             data-bs-parent="#mainAccordion">
            <div class="accordion-body">
                <div id="feedback"></div>
            </div>
        </div>
    </div>
</div>
```

### Multi-Step with Locking (Guided Workflow)
For apps like KKT where steps must be completed in order:

```html
<div class="accordion-item locked" id="step-N">
    <h2 class="accordion-header">
        <button class="accordion-button collapsed" type="button"
                data-bs-toggle="collapse" data-bs-target="#collapse-N">
            Step N: Title
        </button>
    </h2>
    <div id="collapse-N" class="accordion-collapse collapse">
        <div class="accordion-body">
            <div id="step-N-content"></div>
            <div id="step-N-feedback" class="feedback-area"></div>
        </div>
    </div>
</div>
```

**Required CSS for locking:**
```css
.accordion-item.locked .accordion-button { opacity: 0.5; pointer-events: none; }
.accordion-item.completed { border-left: 4px solid var(--cyan); }
.step-check { color: var(--cyan); margin-left: 8px; }
```

**Required JS for locking:**
```javascript
function setupAccordionGuards() {
    document.querySelectorAll('.accordion-collapse').forEach(el => {
        el.addEventListener('show.bs.collapse', e => {
            const item = el.closest('.accordion-item');
            if (item && item.classList.contains('locked')) { e.preventDefault(); e.stopPropagation(); }
        });
    });
}
function unlockStep(n) { const s = document.getElementById('step-' + n); if (s) s.classList.remove('locked'); }
function markStepComplete(n) {
    const step = document.getElementById('step-' + n);
    if (step) {
        step.classList.add('completed');
        const btn = step.querySelector('.accordion-button');
        if (btn && !btn.querySelector('.step-check')) btn.insertAdjacentHTML('beforeend', '<span class="step-check">&#10003;</span>');
    }
}
function openStep(n) { const c = document.getElementById('collapse-' + n); if (c) new bootstrap.Collapse(c, { toggle: false }).show(); }
```

### Standalone Collapsibles (non-Solarized themes)
When not using Bootstrap CSS, build collapsibles with Bootstrap JS:
```html
<div class="section-header" data-bs-toggle="collapse" data-bs-target="#section1" style="cursor: pointer;">
    <h2>Section Title <span class="collapse-arrow">▸</span></h2>
</div>
<div id="section1" class="collapse show">
    <div class="section-body"><!-- Content --></div>
</div>
```

---

## UI Components

### Number Input with KaTeX Label
```html
<div style="display: flex; align-items: center; margin-bottom: 0.5rem;">
    <label style="margin-right: 8px;">$U_2 =$</label>
    <input type="number" step="0.01" style="width: 150px; padding: 6px 10px; border: 1px solid var(--border-color); border-radius: 4px;" id="u2-input">
</div>
```
(Solarized: use `class="form-control"` + `class="d-flex align-items-center mb-2"`)

### Toggle Buttons (YES/NO or Multiple Choice)
```css
.toggle-btn { padding: 12px 35px; font-weight: 600; border: 2px solid currentColor; background: transparent; border-radius: 6px; cursor: pointer; }
.toggle-btn.selected { background: var(--blue); border-color: var(--blue); color: var(--base3); }
/* Carolina: use --carolina-blue + white. B&W: use --text-primary + --bg-primary */
```

```javascript
function selectOption(btn, value) {
    btn.parentElement.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
}
```

### Bidirectional Slider + Number Input
```html
<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 0.5rem;">
    <label style="min-width: 60px;">$L =$</label>
    <input type="range" style="flex-grow: 1;" id="labor-slider"
           min="0" max="100" value="50" oninput="updateFromSlider('labor-slider', 'labor-input')">
    <input type="number" style="width: 80px;" id="labor-input"
           min="0" max="100" value="50" oninput="updateFromInput('labor-input', 'labor-slider')">
</div>
```

```javascript
function updateFromSlider(sliderId, inputId) {
    document.getElementById(inputId).value = document.getElementById(sliderId).value;
    recalculate();
}
function updateFromInput(inputId, sliderId) {
    const input = document.getElementById(inputId), slider = document.getElementById(sliderId);
    slider.value = Math.max(parseFloat(slider.min), Math.min(parseFloat(slider.max), parseFloat(input.value)));
    recalculate();
}
```

### Educational Callout Boxes (Solarized, from `shared-bootstrap-edu.css`)
```html
<div class="edu-question"><strong>Question:</strong> What is the equilibrium price?</div>
<div class="edu-formula">$U(x,y) = x^\alpha y^{1-\alpha}$</div>
<div class="edu-code">$$\frac{\partial \mathcal{L}}{\partial x} = 10 - 2x - \lambda_1 - 2\lambda_2 = 0$$</div>
```

### Feedback States
**Solarized** (via `shared-bootstrap-edu.css`): `edu-success`, `edu-error`, `edu-warning`
**Carolina Blue / B&W** (inline):
```css
.feedback-success { background: #f0fff4; border: 2px solid var(--success); color: var(--success); padding: 15px; border-radius: 6px; }
.feedback-error   { background: #fff5f5; border: 2px solid var(--error);   color: var(--error);   padding: 15px; border-radius: 6px; }
```

### Two-Column Layout
```css
/* Solarized: use .edu-two-column with .card > .card-header + .card-body */
/* All themes: */
.two-column { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
@media (max-width: 768px) { .two-column { grid-template-columns: 1fr; } }
```

---

## JavaScript Architecture

### Global State Pattern
```javascript
let currentProblem = {};

function generateNewProblem() {
    currentProblem = { params: { /* ... */ }, correctAnswers: { /* ... */ } };
    updateDisplay();
    clearInputs();
    document.getElementById('feedback').innerHTML = '';
    reRenderKaTeX();
}
```

### Answer Checking
```javascript
function checkAnswers() {
    const tolerance = 0.1;
    const userAnswer = parseFloat(document.getElementById('answer-input').value);
    const correct = currentProblem.correctAnswers.value;
    if (Math.abs(userAnswer - correct) < tolerance) {
        showFeedback(buildSolutionHTML(), 'success');
    } else {
        showFeedback('Incorrect. Try again.', 'error');
    }
}
```

### Feedback Display + Auto-Expand Solution
```javascript
function showFeedback(html, type) {
    const feedback = document.getElementById('feedback');
    feedback.innerHTML = html;
    // Solarized: 'edu-success'/'edu-error'. Carolina/B&W: 'feedback-success'/'feedback-error'
    feedback.className = (type === 'success') ? 'edu-success' : 'edu-error';
    const sol = document.getElementById('collapseSolution');
    if (sol) new bootstrap.Collapse(sol, { toggle: false }).show();
    reRenderKaTeX(feedback);
}
```

### KaTeX Rendering
```javascript
function reRenderKaTeX(container) {
    renderMathInElement(container || document.body, {
        delimiters: [{ left: '$$', right: '$$', display: true }, { left: '$', right: '$', display: false }],
        throwOnError: false
    });
}
```

**KaTeX gotcha:** `$k<n$` is parsed as HTML. Always use `$k \lt n$` and `$k \gt n$`.

### Utility Functions (include in every app)
```javascript
function expandAll() { document.querySelectorAll('.accordion-collapse, .collapse').forEach(el => new bootstrap.Collapse(el, { toggle: false }).show()); }
function collapseAll() { document.querySelectorAll('.accordion-collapse, .collapse').forEach(el => new bootstrap.Collapse(el, { toggle: false }).hide()); }
function resetApp() {
    document.querySelectorAll('input[type="text"], input[type="number"]').forEach(el => el.value = '');
    document.querySelectorAll('.toggle-btn.selected').forEach(el => el.classList.remove('selected'));
    const fb = document.getElementById('feedback'); if (fb) { fb.innerHTML = ''; fb.className = ''; }
}
function clearInputs() { document.querySelectorAll('input[type="text"], input[type="number"]').forEach(el => el.value = ''); }
```

### Initialization
```javascript
window.addEventListener('load', function() {
    setTimeout(function() { generateNewProblem(); reRenderKaTeX(); }, 100);
});
```

---

## Plotly Graph Patterns

### Standard Layout
Use theme-matched colors: Solarized bg `#fdf6e3`, grid `#eee8d5`; Carolina bg `#ffffff`, grid `#e2e8f0`.

```javascript
const layout = {
    xaxis: { title: 'x', range: [xMin, xMax], gridcolor: '#eee8d5' },
    yaxis: { title: 'y', range: [yMin, yMax], gridcolor: '#eee8d5' },
    showlegend: true,
    legend: { x: 1.02, y: 1, xanchor: 'left', bgcolor: 'rgba(253,246,227,0.85)', bordercolor: '#93a1a1', borderwidth: 1, font: { size: 11 } },
    margin: { t: 30, b: 50, l: 50, r: 180 },
    paper_bgcolor: '#fdf6e3', plot_bgcolor: '#fdf6e3'
};
Plotly.newPlot('plot-div', traces, layout, { responsive: true });
```

### Trace Templates
```javascript
// Line: { x, y, mode: 'lines', name, line: { color: '--blue', width: 2 } }
// Fill:  { x, y, mode: 'lines', fill: 'toself', fillcolor: 'rgba(42,161,152,0.2)', line: { color: 'rgba(42,161,152,0.4)', width: 1 }, name }
// Point: { x: [xStar], y: [yStar], mode: 'markers', marker: { size: 12, color: '--yellow', line: { color: '#073642', width: 2 } }, name }
```

Plot container: `<div id="plot-container" style="min-height: 420px;"></div>`

---

## SVG Callouts Library (Optional)

Source: `callouts.js` (from `/callout/` directory). See `/callout/USAGE.md` for full API.

```javascript
// Rectangle callout: rectangleCallout(center, pointerTarget, text, options)
// Polar mode: rectangleCallout(target, text, { angle, distance, pointerGap })
// Economics coords: rectangleCallout({Q,P}, {Q,P}, text, { coordSystem: { toX, toY } })
```

---

## Animations

```css
@keyframes popIn   { 0% { transform: scale(0.5); opacity: 0; } 70% { transform: scale(1.1); } 100% { transform: scale(1); opacity: 1; } }
@keyframes shake   { 0%,100% { transform: translateX(0); } 20% { transform: translateX(-6px); } 40% { transform: translateX(6px); } 60% { transform: translateX(-4px); } 80% { transform: translateX(4px); } }
@keyframes ticker-fall { 0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; } 100% { transform: translateY(100vh) rotate(720deg); opacity: 0; } }
```

---

## File Structure & Deployment

```
Projects/E101H/Apps/           # ECON 101 (GitHub Pages deploy)
├── index.html, shared-bootstrap-edu.css
├── PPF-bootstrap.html, crusoe-friday-trade.html
├── cost-table-app.html        # B&W (self-contained)
├── gdp-sorting-game.html      # Carolina Blue (self-contained)
└── KKT/index.html             # Multi-file apps get a subdirectory

Projects/E510/Apps/            # ECON 510 (GitHub Pages deploy)
├── index.html, shared-bootstrap-edu.css
├── 510discounting-app-dynamic-consistency-bootstrap.html
├── 510recursive-utility-app-bootstrap.html
└── KKT/index.html
```

Deployment = commit + push. Additional Dropbox copies at `~/Dropbox/Teaching/[course]/Apps/`.
**IMPORTANT:** Only copy/deploy when explicitly instructed.

**Naming:** Single-file: `[course][topic]-app-bootstrap.html`. Multi-file: subdirectory with `index.html`. Add `data-app="app-name"` on root container.

---

## Checklist for New Apps

- [ ] Theme chosen (Solarized / Carolina Blue / Black & White)
- [ ] `data-app="app-name"` attribute on root container
- [ ] Header with title + toolbar (Expand All, Collapse All, Reset, Print)
- [ ] Instructor info block
- [ ] Bootstrap accordion or collapsibles for progressive disclosure
- [ ] KaTeX renders after every DOM update (`reRenderKaTeX()`)
- [ ] `$\lt$` and `$\gt$` instead of `<` and `>` in inline KaTeX
- [ ] `generateNewProblem()` randomizes parameters and stores correct answers
- [ ] `checkAnswers()` validates with tolerance (typically 0.1)
- [ ] Solution section auto-expands on check
- [ ] Feedback uses theme-appropriate success/error/warning classes
- [ ] Responsive at 768px and 576px breakpoints
- [ ] All interactivity is vanilla JS (no frameworks)
- [ ] Plotly uses theme-matched colors if graphs are present
- [ ] Print button works (`window.print()`)
