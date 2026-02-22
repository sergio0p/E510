// ============================================================
// Module 1: state.js — Global State & Problem Generation
// ============================================================

const state = {
    // Problem parameters
    c1: null,
    c2: null,
    solutionCase: null, // which of the 4 cases is the true solution (1-4)

    // True solution (computed from c1, c2)
    xopt: null,
    yopt: null,
    l1opt: null,
    l2opt: null,

    // Contour spacing
    xtick: null,
    ytick: null,

    // Student progress
    currentStep: 1,
    studentMultipliers: [null, null], // symbol names chosen by student
    selectedCase: null,              // which case student is analyzing (1-4)
    lambdaCheckFailed: false,        // if lambda check failed, skip to graphs
    completedCases: new Set(),       // track which cases have been analyzed

    // Per-case solutions (computed by lagrangianSol)
    caseSolution: { x: null, y: null, l1: null, l2: null }
};

// Generate random float rounded to 2 decimal places
function cleanRandomReal(a, b) {
    const n = a + Math.random() * (b - a);
    return Math.round(n * 100) / 100;
}

// Pick a case 1–4 and generate valid c1, c2
function initializeProblem() {
    const caseNum = Math.floor(Math.random() * 4) + 1;
    let C1, C2;

    switch (caseNum) {
        case 1: // λ1 > 0, λ2 > 0
            C1 = cleanRandomReal(0, 15);
            // C2 in ((-15 + 5*C1)/4, (15 + 4*C1)/5)
            C2 = cleanRandomReal((-15 + 5 * C1) / 4, (15 + 4 * C1) / 5);
            break;
        case 2: // λ1 = 0, λ2 > 0
            C2 = cleanRandomReal(0, 15);
            // C1 > (15 + 4*C2)/5
            C1 = cleanRandomReal((15 + 4 * C2) / 5, 20);
            break;
        case 3: // λ1 > 0, λ2 = 0
            C1 = cleanRandomReal(0, 15);
            // C2 > (15 + 4*C1)/5
            C2 = cleanRandomReal((15 + 4 * C1) / 5, 20);
            break;
        case 4: // λ1 = 0, λ2 = 0
            C1 = cleanRandomReal(15, 20);
            C2 = cleanRandomReal(15, 20);
            break;
    }

    state.c1 = C1;
    state.c2 = C2;
    state.solutionCase = caseNum;
}

// Compute the true optimal solution given c1, c2
// Port of objsol from Mathematica
function objsol(d1, d2) {
    let x, y, l1, l2;

    if (d2 <= 15) {
        if (d1 <= (-15 + 5 * d2) / 4) {
            // constraint 1 binding, unconstrained on 2 side
            x = (10 + d1) / 5;
        } else if (d1 <= (15 + 4 * d2) / 5) {
            // both constraints binding
            x = (-d1 + 2 * d2) / 3;
        } else {
            // constraint 2 binding, λ1 = 0
            x = (-5 + 2 * d2) / 5;
        }
    } else {
        // d2 > 15
        if (d1 <= 15) {
            x = (10 + d1) / 5;
        } else {
            x = 5; // unconstrained
        }
    }

    // Determine if we're in the λ1 = 0 branch
    if ((d2 <= 15 && d1 > (15 + 4 * d2) / 5) || (d2 > 15 && d1 > 15)) {
        // λ1 = 0 branch
        y = (10 + 0.5 * (-10 + 2 * x)) / 2;
        l1 = 0;
    } else {
        // λ1 > 0 branch (constraint 1 binding: x + 2y = c1)
        y = (d1 - x) / 2;
        l1 = (10 + 2 * x - 4 * y) / 3;
    }

    l2 = (10 - l1 - 2 * x) / 2;

    return { x: x, y: y, l1: l1, l2: l2 };
}

// Solve the KKT system for a given case assumption
// Returns { x, y, l1, l2 }
function lagrangianSol(caseNum) {
    const c1 = state.c1;
    const c2 = state.c2;
    let x, y, l1, l2;

    switch (caseNum) {
        case 1:
            // Both constraints binding: x + 2y = c1, 2x + y = c2
            // Solve: x + 2y = c1, 2x + y = c2
            x = (2 * c2 - c1) / 3;
            y = (2 * c1 - c2) / 3;
            // From FOCs: 10 - 2x - l1 - 2*l2 = 0, 10 - 2y - 2*l1 - l2 = 0
            // l1 = (10 + 2x - 4y) / 3, l2 = (10 - l1 - 2x) / 2
            l1 = (10 + 2 * x - 4 * y) / 3;
            l2 = (10 - l1 - 2 * x) / 2;
            break;
        case 2:
            // λ1 = 0, constraint 2 binding: 2x + y = c2
            // FOCs: 10 - 2x - 2*l2 = 0, 10 - 2y - l2 = 0, 2x + y = c2
            // From FOC_x: l2 = (10 - 2x)/2 = 5 - x
            // From FOC_y: l2 = 10 - 2y
            // So: 5 - x = 10 - 2y → 2y - x = 5 → x = 2y - 5
            // Constraint: 2(2y-5) + y = c2 → 5y - 10 = c2 → y = (c2+10)/5
            y = (c2 + 10) / 5;
            x = 2 * y - 5;
            l1 = 0;
            l2 = 5 - x;
            break;
        case 3:
            // λ2 = 0, constraint 1 binding: x + 2y = c1
            // FOCs: 10 - 2x - l1 = 0, 10 - 2y - 2*l1 = 0, x + 2y = c1
            // From FOC_x: l1 = 10 - 2x
            // From FOC_y: l1 = (10 - 2y)/2 = 5 - y
            // So: 10 - 2x = 5 - y → y - 2x = -5 → y = 2x - 5
            // Constraint: x + 2(2x-5) = c1 → 5x - 10 = c1 → x = (c1+10)/5
            x = (c1 + 10) / 5;
            y = 2 * x - 5;
            l1 = 10 - 2 * x;
            l2 = 0;
            break;
        case 4:
            // Both λ = 0, unconstrained
            // FOCs: 10 - 2x = 0, 10 - 2y = 0
            x = 5;
            y = 5;
            l1 = 0;
            l2 = 0;
            break;
    }

    return { x: x, y: y, l1: l1, l2: l2 };
}

// Evaluate the objective function
function objFunc(x, y) {
    return 10 * x - x * x + 10 * y - y * y;
}

// Evaluate the Lagrangian
function lagrangianFunc(x, y, l1, l2) {
    return 10 * x - x * x + 10 * y - y * y
         + l1 * (state.c1 - x - 2 * y)
         + l2 * (state.c2 - 2 * x - y);
}

// Compute the true solution and store in state
function computeSolution() {
    const sol = objsol(state.c1, state.c2);
    state.xopt = sol.x;
    state.yopt = sol.y;
    state.l1opt = sol.l1;
    state.l2opt = sol.l2;

    // Contour spacing
    state.xtick = Math.min(state.c1, state.c2 / 2) / 10 + 0.001;
    state.ytick = Math.min(state.c1 / 2, state.c2) / 10 + 0.001;
}

// Reset everything for a new problem
function resetProblem() {
    initializeProblem();
    computeSolution();

    state.currentStep = 1;
    state.studentMultipliers = [null, null];
    state.selectedCase = null;
    state.lambdaCheckFailed = false;
    state.completedCases = new Set();
    state.caseSolution = { x: null, y: null, l1: null, l2: null };
}

// Format a number for display: strip trailing zeros, cap decimal places
function formatNumber(n) {
    if (n === null || n === undefined) return '?';
    if (Number.isInteger(n)) return n.toString();
    // Round to 4 decimal places, then strip trailing zeros
    return parseFloat(n.toFixed(4)).toString();
}
