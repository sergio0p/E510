// ============================================================
// Module 9: main.js — Initialization & Event Wiring
// ============================================================

document.addEventListener('DOMContentLoaded', function () {
    // Initialize first problem
    initializeProblem();
    computeSolution();

    // Render problem display
    renderProblemDisplay();

    // Setup accordion guards (prevent opening locked steps)
    setupAccordionGuards();

    // Setup auto-scroll when panels finish expanding
    setupScrollOnOpen();

    // Initialize step 1
    initStep1();

    // Lock steps 2-6
    for (let i = 2; i <= 6; i++) {
        lockStep(i);
    }

    // Wire "Generate New Problem" button
    document.getElementById('btn-new-problem').addEventListener('click', function () {
        if (!confirm('Start a new problem? Current progress will be lost.')) return;

        resetProblem();
        renderProblemDisplay();
        resetAllSteps();
        initStep1();
    });
});

function renderProblemDisplay() {
    const display = document.getElementById('problem-display');
    const c1 = formatNumber(state.c1);
    const c2 = formatNumber(state.c2);

    const latex = `\\max\\limits_{\\substack{\\phantom{.} \\\\ x,\\,y \\\\ \\phantom{.} \\\\ \\mathrm{subject\\, to} \\\\ \\phantom{.} \\\\ x \\,+\\, 2y \\;\\leq\\; ${c1} \\\\ \\phantom{.} \\\\ 2x \\,+\\, y \\;\\leq\\; ${c2}}} \\quad 10x - x^2 + 10y - y^2`;

    display.innerHTML = '';
    katex.render(latex, display, { throwOnError: false, displayMode: true });
}
