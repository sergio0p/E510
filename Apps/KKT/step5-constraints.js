// ============================================================
// Module 7: step5-constraints.js — Constraint Verification
// ============================================================

function initStep5() {
    const [m1, m2] = state.studentMultipliers;
    const caseNum = state.selectedCase;
    const sol = state.caseSolution;
    const caseDesc = getCaseDescription(caseNum, m1, m2);

    // Build solution display
    let solText = `x^* = ${formatNumber(sol.x)}, \\; y^* = ${formatNumber(sol.y)}`;
    if (caseNum === 1) {
        solText += `, \\; ${m1}^* = ${formatNumber(sol.l1)}, \\; ${m2}^* = ${formatNumber(sol.l2)}`;
    } else if (caseNum === 2) {
        solText += `, \\; ${m2}^* = ${formatNumber(sol.l2)}`;
    } else if (caseNum === 3) {
        solText += `, \\; ${m1}^* = ${formatNumber(sol.l1)}`;
    }

    const content = document.getElementById('step-5-content');
    content.innerHTML = `
        <div class="alert alert-info text-center">
            <strong>Case ${caseNum}:</strong> ${caseDesc}
        </div>
        <div class="text-center mb-3">${katexHTML(solText, true)}</div>
        <div id="step5-part-a"></div>
    `;

    // Part A: Which constraints need verification?
    showConstraintSelectionPartA();
}

function showConstraintSelectionPartA() {
    const [m1, m2] = state.studentMultipliers;
    const caseNum = state.selectedCase;
    const c1 = formatNumber(state.c1);
    const c2 = formatNumber(state.c2);

    // If λ is 0, that constraint is NOT guaranteed binding → must verify
    // If λ > 0, constraint is binding by assumption → no need to verify
    const l1IsZero = (caseNum === 2 || caseNum === 4);
    const l2IsZero = (caseNum === 3 || caseNum === 4);

    const partA = document.getElementById('step5-part-a');
    partA.innerHTML = `
        <p><strong>Which constraints need to be verified as satisfied by this solution?</strong></p>
        <div class="border rounded p-3 bg-white mb-3" style="max-width: 450px; margin: 0 auto;">
            <div class="form-check mb-2">
                <input class="form-check-input" type="checkbox" id="check-c1" value="c1">
                <label class="form-check-label" for="check-c1">
                    ${katexHTML(`x + 2y \\leq ${c1}`, false)}
                </label>
            </div>
            <div class="form-check mb-2">
                <input class="form-check-input" type="checkbox" id="check-c2" value="c2">
                <label class="form-check-label" for="check-c2">
                    ${katexHTML(`2x + y \\leq ${c2}`, false)}
                </label>
            </div>
        </div>
        <div class="text-center">
            <button id="btn-check-constraints" class="btn btn-action fw-bold">All selections done</button>
        </div>
        <div id="step5-a-feedback" class="feedback-area"></div>
    `;

    document.getElementById('btn-check-constraints').addEventListener('click', () => {
        checkConstraintSelection(l1IsZero, l2IsZero);
    });
}

function checkConstraintSelection(l1IsZero, l2IsZero) {
    clearFeedback('step5-a-feedback');
    const [m1, m2] = state.studentMultipliers;

    const checkC1 = document.getElementById('check-c1').checked;
    const checkC2 = document.getElementById('check-c2').checked;

    const errors = [];

    if (l1IsZero && !checkC1)
        errors.push(`This case assumes ${m1} = 0, so you must verify constraint 1 is satisfied.`);
    if (!l1IsZero && checkC1)
        errors.push(`This case assumes ${m1} > 0, which means constraint 1 is binding. You don't need to verify it.`);
    if (l2IsZero && !checkC2)
        errors.push(`This case assumes ${m2} = 0, so you must verify constraint 2 is satisfied.`);
    if (!l2IsZero && checkC2)
        errors.push(`This case assumes ${m2} > 0, which means constraint 2 is binding. You don't need to verify it.`);

    if (errors.length > 0) {
        showFeedback('step5-a-feedback', errors.join('<br><br>'), 'danger');
        return;
    }

    showFeedback('step5-a-feedback', 'Correct!', 'success');
    setTimeout(() => showConstraintEvaluation(), 4000);
}

function showConstraintEvaluation() {
    const [m1, m2] = state.studentMultipliers;
    const caseNum = state.selectedCase;
    const sol = state.caseSolution;
    const c1 = state.c1;
    const c2 = state.c2;

    const l1IsZero = (caseNum === 2 || caseNum === 4);
    const l2IsZero = (caseNum === 3 || caseNum === 4);

    const lhs1 = sol.x + 2 * sol.y;
    const lhs2 = 2 * sol.x + sol.y;
    const c1Satisfied = lhs1 <= c1 + 1e-9; // small tolerance
    const c2Satisfied = lhs2 <= c2 + 1e-9;

    let evalHTML = '';

    if (l1IsZero) {
        const sym = c1Satisfied ? '\\leq' : '>';
        const icon = c1Satisfied ? '&#10003;' : '&#10007;';
        evalHTML += `
            <div class="mb-2">
                ${katexHTML(`x + 2y \\leq ${formatNumber(c1)}`, false)}<br>
                ${katexHTML(`${formatNumber(sol.x)} + 2(${formatNumber(sol.y)}) = ${formatNumber(lhs1)} ${sym} ${formatNumber(c1)}`, false)}
                <span class="${c1Satisfied ? 'text-success' : 'text-danger'} fw-bold ms-2">${icon}</span>
            </div>
        `;
    }

    if (l2IsZero) {
        const sym = c2Satisfied ? '\\leq' : '>';
        const icon = c2Satisfied ? '&#10003;' : '&#10007;';
        evalHTML += `
            <div class="mb-2">
                ${katexHTML(`2x + y \\leq ${formatNumber(c2)}`, false)}<br>
                ${katexHTML(`2(${formatNumber(sol.x)}) + ${formatNumber(sol.y)} = ${formatNumber(lhs2)} ${sym} ${formatNumber(c2)}`, false)}
                <span class="${c2Satisfied ? 'text-success' : 'text-danger'} fw-bold ms-2">${icon}</span>
            </div>
        `;
    }

    // For case 1 (both binding, nothing to verify)
    if (!l1IsZero && !l2IsZero) {
        evalHTML = `<p class="text-muted fst-italic">Both constraints are binding by assumption — no verification needed.</p>`;
    }

    const allSatisfied = (!l1IsZero || c1Satisfied) && (!l2IsZero || c2Satisfied);

    const partA = document.getElementById('step5-part-a');
    partA.innerHTML += `
        <hr>
        <p><strong>Constraint Verification:</strong></p>
        <div class="text-center mb-3">${evalHTML}</div>
        <div id="step5-satisfaction-question"></div>
    `;

    scrollIntoViewIfNeeded('step5-satisfaction-question');

    // If there are constraints to check, ask if satisfied
    if (l1IsZero || l2IsZero) {
        showSatisfactionQuestion(allSatisfied);
    } else {
        // Case 1: skip to final decision
        showFinalDecision(true);
    }
}

function showSatisfactionQuestion(allSatisfied) {
    const area = document.getElementById('step5-satisfaction-question');
    area.innerHTML = `
        <div id="step5-sat-anchor"></div>
        <p><strong>Are the constraints satisfied?</strong></p>
        <div class="d-flex justify-content-center gap-2 mb-3">
            <button class="btn btn-outline-primary" id="btn-sat-yes">Yes</button>
            <button class="btn btn-outline-primary" id="btn-sat-no">No</button>
        </div>
        <div id="step5-sat-feedback" class="feedback-area"></div>
    `;

    scrollIntoViewIfNeeded('step5-sat-anchor');

    document.getElementById('btn-sat-yes').addEventListener('click', () => {
        if (allSatisfied) {
            showFeedback('step5-sat-feedback', 'Correct! All constraints are satisfied.', 'success');
            setTimeout(() => showFinalDecision(true), 2000);
        } else {
            showFeedback('step5-sat-feedback', 'Incorrect. Check the constraint evaluation above.', 'danger');
        }
    });

    document.getElementById('btn-sat-no').addEventListener('click', () => {
        if (!allSatisfied) {
            showFeedback('step5-sat-feedback', 'Correct! One or more constraints are violated.', 'success');
            setTimeout(() => showFinalDecision(false), 2000);
        } else {
            showFeedback('step5-sat-feedback', 'Incorrect. All constraints are actually satisfied.', 'danger');
        }
    });
}

function showFinalDecision(isSolution) {
    const area = document.getElementById('step5-satisfaction-question');
    area.innerHTML += `
        <hr>
        <div id="step5-decision-anchor"></div>
        <p><strong>Does this case correspond to a solution?</strong></p>
        <div class="d-flex justify-content-center gap-2 mb-3">
            <button class="btn btn-outline-primary" id="btn-decision-yes">Yes</button>
            <button class="btn btn-outline-primary" id="btn-decision-no">No</button>
        </div>
        <div id="step5-decision-feedback" class="feedback-area"></div>
    `;

    scrollIntoViewIfNeeded('step5-decision-anchor');

    document.getElementById('btn-decision-yes').addEventListener('click', () => {
        if (isSolution) {
            showFeedback('step5-decision-feedback', 'Correct! This case corresponds to a valid solution.', 'success');
            finishStep5();
        } else {
            showFeedback('step5-decision-feedback',
                'Incorrect. Check if all constraints that need to be verified are actually satisfied.',
                'warning');
        }
    });

    document.getElementById('btn-decision-no').addEventListener('click', () => {
        if (!isSolution) {
            showFeedback('step5-decision-feedback', 'Correct! This case does not yield a valid solution.', 'success');
            finishStep5();
        } else {
            showFeedback('step5-decision-feedback',
                'Incorrect. Check if all constraints that need to be verified are actually satisfied.',
                'warning');
        }
    });
}

function finishStep5() {
    markStepComplete(5);
    unlockStep(6);
    scheduleStepTransition(() => { openStep(6); initStep6(); }, 4000);
}
