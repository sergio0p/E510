// ============================================================
// Module 2: ui-helpers.js — Shared UI Utilities
// ============================================================

// Pending auto-advance timer (can be cancelled by user click)
let pendingStepTimer = null;

function scheduleStepTransition(fn, delay) {
    if (pendingStepTimer) clearTimeout(pendingStepTimer);
    pendingStepTimer = setTimeout(() => {
        pendingStepTimer = null;
        fn();
    }, delay);
}

function cancelStepTimer() {
    if (pendingStepTimer) {
        clearTimeout(pendingStepTimer);
        pendingStepTimer = null;
    }
}

// Scroll an element into view if its bottom is below the viewport
function scrollIntoViewIfNeeded(elementId) {
    const el = document.getElementById(elementId);
    if (!el) return;
    setTimeout(() => {
        const rect = el.getBoundingClientRect();
        if (rect.bottom > window.innerHeight || rect.top < 0) {
            el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }, 100);
}

// Render LaTeX into a DOM element
function renderKaTeX(elementId, latexString, displayMode) {
    const el = document.getElementById(elementId);
    if (!el) return;
    katex.render(latexString, el, {
        throwOnError: false,
        displayMode: displayMode !== false
    });
}

// Render LaTeX and return the HTML string
function katexHTML(latexString, displayMode) {
    return katex.renderToString(latexString, {
        throwOnError: false,
        displayMode: displayMode !== false
    });
}

// Show Bootstrap alert with optional KaTeX math
function showFeedback(containerId, message, type) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const alertClass = type === 'success' ? 'alert-success'
                     : type === 'danger'  ? 'alert-danger'
                     : type === 'warning' ? 'alert-warning'
                     : 'alert-info';
    container.innerHTML = `<div class="alert ${alertClass}" role="alert">${message}</div>`;
}

// Clear feedback area
function clearFeedback(containerId) {
    const container = document.getElementById(containerId);
    if (container) container.innerHTML = '';
}

// Unlock an accordion step
function unlockStep(stepNumber) {
    const item = document.getElementById(`step-${stepNumber}`);
    if (item) item.classList.remove('locked');
}

// Lock an accordion step
function lockStep(stepNumber) {
    const item = document.getElementById(`step-${stepNumber}`);
    if (item) item.classList.add('locked');
}

// Mark a step as complete (green left border + checkmark)
function markStepComplete(stepNumber) {
    const item = document.getElementById(`step-${stepNumber}`);
    if (!item) return;
    item.classList.add('completed');
    // Add checkmark if not already present
    const btn = item.querySelector('.accordion-button');
    if (btn && !btn.querySelector('.step-check')) {
        const check = document.createElement('span');
        check.className = 'step-check';
        check.textContent = ' \u2713';
        btn.appendChild(check);
    }
}

// Remove completed status from a step
function unmarkStepComplete(stepNumber) {
    const item = document.getElementById(`step-${stepNumber}`);
    if (!item) return;
    item.classList.remove('completed');
    const btn = item.querySelector('.accordion-button');
    if (btn) {
        const check = btn.querySelector('.step-check');
        if (check) check.remove();
    }
}

// Programmatically open an accordion panel
function openStep(stepNumber) {
    const collapseEl = document.getElementById(`collapse-${stepNumber}`);
    if (collapseEl) {
        const bsCollapse = new bootstrap.Collapse(collapseEl, { toggle: false });
        bsCollapse.show();
    }
}

// After panel finishes expanding, scroll so the full content is visible
function setupScrollOnOpen() {
    for (let i = 1; i <= 6; i++) {
        const collapseEl = document.getElementById(`collapse-${i}`);
        if (collapseEl) {
            collapseEl.addEventListener('shown.bs.collapse', function () {
                const item = document.getElementById(`step-${i}`);
                if (!item) return;
                const rect = item.getBoundingClientRect();
                const bottom = rect.bottom;
                // If any part of the expanded panel is below the viewport, scroll
                if (rect.top < 0 || bottom > window.innerHeight) {
                    item.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        }
    }
}

// Programmatically close an accordion panel
function closeStep(stepNumber) {
    const collapseEl = document.getElementById(`collapse-${stepNumber}`);
    if (collapseEl) {
        const bsCollapse = new bootstrap.Collapse(collapseEl, { toggle: false });
        bsCollapse.hide();
    }
}

// Reset all steps: lock 2-6, clear content, open step 1
function resetAllSteps() {
    for (let i = 1; i <= 6; i++) {
        const content = document.getElementById(`step-${i}-content`);
        if (content) content.innerHTML = '';
        clearFeedback(`step-${i}-feedback`);
        unmarkStepComplete(i);
        if (i > 1) lockStep(i);
    }
    unlockStep(1);
    openStep(1);
}

// Prevent opening locked steps; cancel timer on manual open
function setupAccordionGuards() {
    const initFns = {
        1: initStep1, 2: initStep2, 3: initStep3,
        4: initStep4, 5: initStep5, 6: initStep6
    };
    for (let i = 1; i <= 6; i++) {
        const collapseEl = document.getElementById(`collapse-${i}`);
        if (collapseEl) {
            collapseEl.addEventListener('show.bs.collapse', function (e) {
                const item = document.getElementById(`step-${i}`);
                if (item && item.classList.contains('locked')) {
                    e.preventDefault();
                    e.stopPropagation();
                    return;
                }
                // User clicked manually — cancel pending timer and init if needed
                if (pendingStepTimer) {
                    cancelStepTimer();
                    const content = document.getElementById(`step-${i}-content`);
                    if (content && content.innerHTML.trim() === '' && initFns[i]) {
                        initFns[i]();
                    }
                }
            });
        }
    }
}
