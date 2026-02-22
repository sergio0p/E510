// ============================================================
// Module 6: step4-solutions.js — Solution Analysis
// ============================================================

function initStep4() {
    const [m1, m2] = state.studentMultipliers;
    const caseNum = state.selectedCase;
    const sol = state.caseSolution;
    const caseDesc = getCaseDescription(caseNum, m1, m2);

    // Build solution display based on case
    let solLatex = `x^* = ${formatNumber(sol.x)}, \\quad y^* = ${formatNumber(sol.y)}`;
    if (caseNum === 1) {
        solLatex += `, \\quad ${m1}^* = ${formatNumber(sol.l1)}, \\quad ${m2}^* = ${formatNumber(sol.l2)}`;
    } else if (caseNum === 2) {
        solLatex += `, \\quad ${m2}^* = ${formatNumber(sol.l2)}`;
    } else if (caseNum === 3) {
        solLatex += `, \\quad ${m1}^* = ${formatNumber(sol.l1)}`;
    }
    // Case 4: no lambdas to show

    const content = document.getElementById('step-4-content');
    content.innerHTML = `
        <div class="alert alert-info text-center">
            <strong>Case ${caseNum}:</strong> ${caseDesc}
        </div>
        <p><strong>Solutions from FOCs:</strong></p>
        <div class="text-center mb-3" id="step4-solution-display"></div>
        <hr>
        <div id="step4-question-area"></div>
    `;

    // Render solution
    const solDisplay = document.getElementById('step4-solution-display');
    solDisplay.innerHTML = katexHTML(solLatex, true);

    // Question 1: Are there real solutions?
    showRealSolutionQuestion();
}

function showRealSolutionQuestion() {
    const area = document.getElementById('step4-question-area');
    // For this problem all solutions are always real (linear system), but we follow the interface
    const sol = state.caseSolution;
    const isReal = isFinite(sol.x) && isFinite(sol.y) && isFinite(sol.l1) && isFinite(sol.l2);

    area.innerHTML = `
        <p><strong>Are there real solutions to the FOCs?</strong></p>
        <div class="d-flex justify-content-center gap-2 mb-3">
            <button class="btn btn-outline-primary" id="btn-real-yes">Yes</button>
            <button class="btn btn-outline-primary" id="btn-real-no">No</button>
        </div>
        <div id="step4-q1-feedback" class="feedback-area"></div>
    `;

    document.getElementById('btn-real-yes').addEventListener('click', () => {
        if (isReal) {
            showFeedback('step4-q1-feedback', 'Correct! There are real solutions.', 'success');
            document.getElementById('btn-real-yes').classList.add('active');
            // After a moment, show question 2 or proceed
            setTimeout(() => showLambdaQuestion(), 4000);
        } else {
            showFeedback('step4-q1-feedback', 'Incorrect. Check the solutions again.', 'danger');
        }
    });

    document.getElementById('btn-real-no').addEventListener('click', () => {
        if (!isReal) {
            showFeedback('step4-q1-feedback', 'Correct! There are no real solutions. This case is discarded.', 'success');
            document.getElementById('btn-real-no').classList.add('active');
            state.lambdaCheckFailed = true;
            markStepComplete(4);
            unlockStep(6);
            scheduleStepTransition(() => { openStep(6); initStep6(); }, 4000);
        } else {
            showFeedback('step4-q1-feedback', 'Incorrect. Look at the solutions again — they are real.', 'danger');
        }
    });
}

function showLambdaQuestion() {
    const [m1, m2] = state.studentMultipliers;
    const caseNum = state.selectedCase;
    const sol = state.caseSolution;

    // Case 4: no lambdas to check — go straight to step 5
    if (caseNum === 4) {
        markStepComplete(4);
        unlockStep(5);
        scheduleStepTransition(() => { openStep(5); initStep5(); }, 4000);
        return;
    }

    // Determine which lambdas to check and whether they're positive
    let lambdasToCheck = [];
    if (caseNum === 1) {
        lambdasToCheck = [
            { name: m1, value: sol.l1 },
            { name: m2, value: sol.l2 }
        ];
    } else if (caseNum === 2) {
        lambdasToCheck = [{ name: m2, value: sol.l2 }];
    } else if (caseNum === 3) {
        lambdasToCheck = [{ name: m1, value: sol.l1 }];
    }

    const allPositive = lambdasToCheck.every(l => l.value > 0);

    const multiplierNames = lambdasToCheck.map(l => l.name).join(' and ');

    const area = document.getElementById('step4-question-area');
    area.innerHTML += `
        <hr>
        <div id="step4-q2-anchor"></div>
        <p><strong>Is/are the value(s) of ${multiplierNames} consistent with this case's assumptions (i.e., &gt; 0)?</strong></p>
        <div class="d-flex justify-content-center gap-2 mb-3">
            <button class="btn btn-outline-primary" id="btn-lambda-yes">Yes</button>
            <button class="btn btn-outline-primary" id="btn-lambda-no">No</button>
        </div>
        <div id="step4-q2-feedback" class="feedback-area"></div>
    `;

    scrollIntoViewIfNeeded('step4-q2-anchor');

    document.getElementById('btn-lambda-yes').addEventListener('click', () => {
        if (allPositive) {
            showFeedback('step4-q2-feedback', 'Correct! The Lagrange multiplier values are consistent with the case assumptions.', 'success');
            state.lambdaCheckFailed = false;
            markStepComplete(4);
            unlockStep(5);
            scheduleStepTransition(() => { openStep(5); initStep5(); }, 4000);
        } else {
            const bad = lambdasToCheck.filter(l => l.value <= 0)
                .map(l => `${l.name} = ${formatNumber(l.value)}`).join(', ');
            showFeedback('step4-q2-feedback',
                `Incorrect. Check the Lagrange multiplier value(s): ${bad}. This case assumes them &gt; 0.`,
                'danger');
        }
    });

    document.getElementById('btn-lambda-no').addEventListener('click', () => {
        if (!allPositive) {
            const bad = lambdasToCheck.filter(l => l.value <= 0)
                .map(l => `${l.name} = ${formatNumber(l.value)}`).join(', ');
            showFeedback('step4-q2-feedback',
                `Correct! ${bad} — not consistent. This case should be discarded.`,
                'success');
            state.lambdaCheckFailed = true;
            markStepComplete(4);
            // Skip step 5, go to step 6
            unlockStep(6);
            scheduleStepTransition(() => { openStep(6); initStep6(); }, 4000);
        } else {
            showFeedback('step4-q2-feedback',
                'Incorrect. The Lagrange multiplier values are actually positive as required by this case.',
                'danger');
        }
    });
}
