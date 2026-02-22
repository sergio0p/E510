// ============================================================
// Module 3: step1-lagrangian.js — Lagrangian Input & Validation
// ============================================================

function initStep1() {
    const content = document.getElementById('step-1-content');
    content.innerHTML = `
        <p class="mb-2"><strong>Enter the Lagrangian for this problem:</strong></p>
        <p class="text-muted fst-italic mb-3">You may use any names for the Lagrangian multipliers (e.g., l1, l2 or mu, lambda, a, b, etc.)</p>
        <div class="mb-3">
            <label for="lagrangian-input" class="form-label">L =</label>
            <input type="text" class="form-control math-input" id="lagrangian-input"
                   placeholder="e.g. 10x - x^2 + 10y - y^2 + a*(${formatNumber(state.c1)} - x - 2y) + b*(${formatNumber(state.c2)} - 2x - y)"
                   autocomplete="off">
        </div>
        <button id="btn-check-lagrangian" class="btn btn-action fw-bold">Check Answer</button>
    `;
    document.getElementById('btn-check-lagrangian').addEventListener('click', checkLagrangian);
}

// Pre-process input: insert * for implicit multiplication
// 2x → 2*x, 3y → 3*y, but keep multi-char names like lambda1 intact
function preprocessExpr(input) {
    let s = input;
    // number followed by letter: 10x → 10*x
    s = s.replace(/(\d)([a-zA-Z])/g, '$1*$2');
    // letter/digit followed by (: x( → x*(
    s = s.replace(/([a-zA-Z0-9])(\()/g, '$1*$2');
    // ) followed by ( or letter or digit: )(  → )*(
    s = s.replace(/\)([a-zA-Z0-9(])/g, ')*$1');
    return s;
}

// Extract all symbol names from a math.js expression node
function extractSymbols(node) {
    const symbols = new Set();
    node.traverse(function (n) {
        if (n.isSymbolNode) {
            symbols.add(n.name);
        }
    });
    return symbols;
}

function checkLagrangian() {
    clearFeedback('step-1-feedback');
    const input = document.getElementById('lagrangian-input').value.trim();
    if (!input) {
        showFeedback('step-1-feedback', 'Please enter an expression.', 'danger');
        return;
    }

    let processed = preprocessExpr(input);
    let studentNode;
    try {
        studentNode = math.parse(processed);
    } catch (e) {
        showFeedback('step-1-feedback',
            'Could not parse your expression. Check syntax (use ^ for exponents, * for multiplication).',
            'danger');
        return;
    }

    // Extract symbols, filter out x and y
    const allSymbols = extractSymbols(studentNode);
    allSymbols.delete('x');
    allSymbols.delete('y');

    const multipliers = Array.from(allSymbols);

    if (multipliers.length < 2) {
        showFeedback('step-1-feedback',
            `Expected 2 multiplier symbols besides x and y, but found ${multipliers.length}. Make sure you use two distinct variable names for the multipliers.`,
            'danger');
        return;
    }
    if (multipliers.length > 2) {
        showFeedback('step-1-feedback',
            `Expected 2 multiplier symbols, but found ${multipliers.length}: ${multipliers.join(', ')}. Use exactly two.`,
            'danger');
        return;
    }

    // Check neither multiplier is x or y
    if (multipliers.includes('x') || multipliers.includes('y')) {
        showFeedback('step-1-feedback',
            'Your multiplier names cannot be x or y.',
            'danger');
        return;
    }

    // Numerical validation: try both assignments of multiplier → λ1, λ2
    const c1 = state.c1;
    const c2 = state.c2;
    const m1 = multipliers[0];
    const m2 = multipliers[1];

    // Compile student expression
    const studentCompiled = studentNode.compile();

    // Build correct Lagrangian: 10x - x^2 + 10y - y^2 + L1*(c1 - x - 2y) + L2*(c2 - 2x - y)
    function correctLagrangian(xv, yv, l1v, l2v) {
        return 10 * xv - xv * xv + 10 * yv - yv * yv
             + l1v * (c1 - xv - 2 * yv)
             + l2v * (c2 - 2 * xv - yv);
    }

    // Test with random points
    function testAssignment(assignM1toL1) {
        let maxDiff = 0;
        for (let i = 0; i < 15; i++) {
            const xv = Math.random() * 10 - 2;
            const yv = Math.random() * 10 - 2;
            const v1 = Math.random() * 10 - 3;
            const v2 = Math.random() * 10 - 3;

            const scope = { x: xv, y: yv };
            scope[m1] = v1;
            scope[m2] = v2;

            let studentVal;
            try {
                studentVal = studentCompiled.evaluate(scope);
            } catch (e) {
                return Infinity;
            }

            let correctVal;
            if (assignM1toL1) {
                correctVal = correctLagrangian(xv, yv, v1, v2);
            } else {
                correctVal = correctLagrangian(xv, yv, v2, v1);
            }

            maxDiff = Math.max(maxDiff, Math.abs(studentVal - correctVal));
        }
        return maxDiff;
    }

    const diff1 = testAssignment(true);   // m1→λ1, m2→λ2
    const diff2 = testAssignment(false);  // m1→λ2, m2→λ1

    const tol = 1e-6;

    if (diff1 < tol) {
        // m1 is λ1, m2 is λ2
        state.studentMultipliers = [m1, m2];
        onLagrangianCorrect();
    } else if (diff2 < tol) {
        // m1 is λ2, m2 is λ1 (swapped)
        state.studentMultipliers = [m2, m1];
        onLagrangianCorrect();
    } else {
        showFeedback('step-1-feedback',
            'Incorrect. Check your Lagrangian formulation. Make sure you have the correct objective function and constraint terms.',
            'danger');
    }
}

function onLagrangianCorrect() {
    const [m1, m2] = state.studentMultipliers;
    showFeedback('step-1-feedback',
        `Correct! Multipliers identified: <strong>${m1}</strong> (constraint 1) and <strong>${m2}</strong> (constraint 2).`,
        'success');
    markStepComplete(1);
    unlockStep(2);
    // Auto-open step 2 after short delay
    scheduleStepTransition(() => {
        openStep(2);
        initStep2();
    }, 4000);
}
