// ============================================================
// Module 5: step3-focs.js — FOC Identification
// ============================================================

function initStep3() {
    const [m1, m2] = state.studentMultipliers;
    const caseNum = state.selectedCase;
    const c1 = formatNumber(state.c1);
    const c2 = formatNumber(state.c2);

    // Case header description
    const caseDesc = getCaseDescription(caseNum, m1, m2);

    // FOC expressions using student multiplier names
    const focXLatex = `10 - 2x - ${m1} - 2${m2}`;
    const focYLatex = `10 - 2y - 2${m1} - ${m2}`;
    const focL1Latex = `${c1} - x - 2y`;
    const focL2Latex = `${c2} - 2x - y`;

    const content = document.getElementById('step-3-content');
    content.innerHTML = `
        <div class="alert alert-info text-center">
            <strong>Case ${caseNum}:</strong> ${caseDesc}
        </div>
        <p><strong>Select all First Order Conditions (FOCs) that must be considered for this case:</strong></p>
        <div class="border rounded p-3 bg-white mb-3" style="max-width: 500px; margin: 0 auto;">
            <div class="form-check d-flex align-items-center" style="line-height:4em">
                <input class="form-check-input mt-0" type="checkbox" id="foc-dx" value="dx">
                <label class="form-check-label" for="foc-dx">
                    ${katexHTML(`\\dfrac{\\partial L}{\\partial x} = ${focXLatex} = 0`, false)}
                </label>
            </div>
            <div class="form-check d-flex align-items-center" style="line-height:4em">
                <input class="form-check-input mt-0" type="checkbox" id="foc-dy" value="dy">
                <label class="form-check-label" for="foc-dy">
                    ${katexHTML(`\\dfrac{\\partial L}{\\partial y} = ${focYLatex} = 0`, false)}
                </label>
            </div>
            <div class="form-check d-flex align-items-center" style="line-height:4em">
                <input class="form-check-input mt-0" type="checkbox" id="foc-dl1" value="dl1">
                <label class="form-check-label" for="foc-dl1">
                    ${katexHTML(`\\dfrac{\\partial L}{\\partial ${m1}} = ${focL1Latex} = 0`, false)}
                </label>
            </div>
            <div class="form-check d-flex align-items-center" style="line-height:4em">
                <input class="form-check-input mt-0" type="checkbox" id="foc-dl2" value="dl2">
                <label class="form-check-label" for="foc-dl2">
                    ${katexHTML(`\\dfrac{\\partial L}{\\partial ${m2}} = ${focL2Latex} = 0`, false)}
                </label>
            </div>
        </div>
        <div class="text-center">
            <button id="btn-check-focs" class="btn btn-action fw-bold">Check Selection</button>
        </div>
    `;

    document.getElementById('btn-check-focs').addEventListener('click', checkFOCs);
}

function getCaseDescription(caseNum, m1, m2) {
    switch (caseNum) {
        case 1: return `${m1} &gt; 0, ${m2} &gt; 0`;
        case 2: return `${m1} = 0, ${m2} &gt; 0`;
        case 3: return `${m1} &gt; 0, ${m2} = 0`;
        case 4: return `${m1} = 0, ${m2} = 0`;
    }
}

function checkFOCs() {
    clearFeedback('step-3-feedback');
    const [m1, m2] = state.studentMultipliers;
    const caseNum = state.selectedCase;

    const dx = document.getElementById('foc-dx').checked;
    const dy = document.getElementById('foc-dy').checked;
    const dl1 = document.getElementById('foc-dl1').checked;
    const dl2 = document.getElementById('foc-dl2').checked;

    const errors = [];

    // ∂L/∂x and ∂L/∂y must always be selected
    if (!dx) errors.push('You must always include ∂L/∂x = 0 in the FOCs.');
    if (!dy) errors.push('You must always include ∂L/∂y = 0 in the FOCs.');

    // ∂L/∂m1 should be selected iff m1 > 0 (cases 1, 3)
    const shouldIncludeDL1 = (caseNum === 1 || caseNum === 3);
    // ∂L/∂m2 should be selected iff m2 > 0 (cases 1, 2)
    const shouldIncludeDL2 = (caseNum === 1 || caseNum === 2);

    if (!shouldIncludeDL1 && dl1)
        errors.push(`This case assumes ${m1} = 0, so you should NOT include ∂L/∂${m1} = 0 in the FOCs.`);
    if (shouldIncludeDL1 && !dl1)
        errors.push(`This case assumes ${m1} > 0, so you MUST include ∂L/∂${m1} = 0 in the FOCs.`);
    if (!shouldIncludeDL2 && dl2)
        errors.push(`This case assumes ${m2} = 0, so you should NOT include ∂L/∂${m2} = 0 in the FOCs.`);
    if (shouldIncludeDL2 && !dl2)
        errors.push(`This case assumes ${m2} > 0, so you MUST include ∂L/∂${m2} = 0 in the FOCs.`);

    if (errors.length > 0) {
        showFeedback('step-3-feedback', errors.join('<br><br>'), 'danger');
        return;
    }

    // All correct
    showFeedback('step-3-feedback',
        'Correct! You have selected all the necessary FOCs for this case.',
        'success');

    markStepComplete(3);
    unlockStep(4);

    scheduleStepTransition(() => {
        openStep(4);
        initStep4();
    }, 4000);
}
