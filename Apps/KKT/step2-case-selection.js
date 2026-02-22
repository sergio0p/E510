// ============================================================
// Module 4: step2-case-selection.js — KKT Case Selection
// ============================================================

function initStep2() {
    const [m1, m2] = state.studentMultipliers;
    const content = document.getElementById('step-2-content');

    // Build completed badges
    let completedInfo = '';
    if (state.completedCases.size > 0) {
        const badges = Array.from(state.completedCases).sort().map(c =>
            `<span class="badge bg-secondary me-1">Case ${c}</span>`
        ).join('');
        completedInfo = `<p class="mt-2 mb-0">Completed: ${badges}</p>`;
    }

    content.innerHTML = `
        <p><strong>Select a case to analyze:</strong></p>
        <table class="table table-bordered text-center" style="max-width: 400px; margin: 0 auto;">
            <thead>
                <tr>
                    <th></th>
                    <th>${katexHTML(m1, false)}</th>
                    <th>${katexHTML(m2, false)}</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><button class="btn btn-outline-primary case-btn" data-case="1">Case 1</button></td>
                    <td>${katexHTML('> 0', false)}</td>
                    <td>${katexHTML('> 0', false)}</td>
                </tr>
                <tr>
                    <td><button class="btn btn-outline-primary case-btn" data-case="2">Case 2</button></td>
                    <td>${katexHTML('= 0', false)}</td>
                    <td>${katexHTML('> 0', false)}</td>
                </tr>
                <tr>
                    <td><button class="btn btn-outline-primary case-btn" data-case="3">Case 3</button></td>
                    <td>${katexHTML('> 0', false)}</td>
                    <td>${katexHTML('= 0', false)}</td>
                </tr>
                <tr>
                    <td><button class="btn btn-outline-primary case-btn" data-case="4">Case 4</button></td>
                    <td>${katexHTML('= 0', false)}</td>
                    <td>${katexHTML('= 0', false)}</td>
                </tr>
            </tbody>
        </table>
        ${completedInfo}
    `;

    // Highlight completed cases
    content.querySelectorAll('.case-btn').forEach(btn => {
        const c = parseInt(btn.dataset.case);
        if (state.completedCases.has(c)) {
            btn.classList.remove('btn-outline-primary');
            btn.classList.add('btn-success');
            btn.textContent += ' \u2713';
        }
        btn.addEventListener('click', () => selectCase(c));
    });
}

function selectCase(caseNum) {
    state.selectedCase = caseNum;
    state.lambdaCheckFailed = false;

    // Compute case solution
    const sol = lagrangianSol(caseNum);
    state.caseSolution = sol;

    showFeedback('step-2-feedback',
        `Selected <strong>Case ${caseNum}</strong>. Proceeding to FOC identification...`,
        'success');

    markStepComplete(2);
    unlockStep(3);

    // Reset steps 3-6 content for new case analysis
    for (let i = 3; i <= 6; i++) {
        const c = document.getElementById(`step-${i}-content`);
        if (c) c.innerHTML = '';
        clearFeedback(`step-${i}-feedback`);
        unmarkStepComplete(i);
        if (i > 3) lockStep(i);
    }

    scheduleStepTransition(() => {
        openStep(3);
        initStep3();
    }, 4000);
}
