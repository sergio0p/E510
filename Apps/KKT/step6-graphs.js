// ============================================================
// Module 8: step6-graphs.js — Graphical Display
// ============================================================

function initStep6() {
    const caseNum = state.selectedCase;
    const sol = state.caseSolution;
    const [m1, m2] = state.studentMultipliers;
    const caseDesc = getCaseDescription(caseNum, m1, m2);

    let discardNote = '';
    if (state.lambdaCheckFailed) {
        discardNote = `
            <div class="alert alert-warning">
                <strong>Note:</strong> Case ${caseNum} (${caseDesc}) was discarded because
                the Lagrange multiplier values were not consistent with the case assumptions.
                The graphs below still show the analysis for reference.
            </div>
        `;
    }

    // Show Graph 3 only when this case does NOT match the true optimum
    const showZoomed = (caseNum !== state.solutionCase) || state.lambdaCheckFailed;

    let graph3HTML = '';
    if (showZoomed) {
        graph3HTML = `
            <h5 class="text-center mb-3 mt-4">Graph 3: Lagrangian Solution vs Optimal Solution</h5>
            <div id="plot-zoomed" class="plot-container"></div>
        `;
    }

    const content = document.getElementById('step-6-content');
    content.innerHTML = `
        <div class="alert alert-info text-center">
            <strong>Case ${caseNum}:</strong> ${caseDesc}
        </div>
        ${discardNote}
        <h5 class="text-center mb-3">Graph 1: Objective Function Analysis</h5>
        <div id="plot-objective" class="plot-container"></div>
        <h5 class="text-center mb-3 mt-4">Graph 2: Lagrangian Analysis (for this case)</h5>
        <div id="plot-lagrangian" class="plot-container"></div>
        ${graph3HTML}
        <div class="text-center mt-4">
            <button id="btn-return-cases" class="btn btn-action fw-bold">Return to Case Table</button>
        </div>
    `;

    document.getElementById('btn-return-cases').addEventListener('click', returnToCaseTable);

    // Draw plots
    drawObjectivePlot();
    drawLagrangianPlot();
    if (showZoomed) {
        drawZoomedPlot();
    }

    // Mark this case as completed
    state.completedCases.add(caseNum);
    markStepComplete(6);
}

function returnToCaseTable() {
    // Reset steps 3-6 for a new case
    for (let i = 3; i <= 6; i++) {
        unmarkStepComplete(i);
        if (i > 2) lockStep(i);
        const c = document.getElementById(`step-${i}-content`);
        if (c) c.innerHTML = '';
        clearFeedback(`step-${i}-feedback`);
    }
    state.lambdaCheckFailed = false;
    unlockStep(2);
    openStep(2);
    initStep2();
}

// ---- Plotting helpers ----

function buildMeshGrid(xMin, xMax, yMin, yMax, n) {
    const xs = [];
    const ys = [];
    const dx = (xMax - xMin) / (n - 1);
    const dy = (yMax - yMin) / (n - 1);
    for (let i = 0; i < n; i++) {
        xs.push(xMin + i * dx);
        ys.push(yMin + i * dy);
    }
    return { xs, ys };
}

function evaluateGrid(xs, ys, fn) {
    const z = [];
    for (let j = 0; j < ys.length; j++) {
        const row = [];
        for (let i = 0; i < xs.length; i++) {
            row.push(fn(xs[i], ys[j]));
        }
        z.push(row);
    }
    return z;
}

function feasibilityGrid(xs, ys) {
    const z = [];
    for (let j = 0; j < ys.length; j++) {
        const row = [];
        for (let i = 0; i < xs.length; i++) {
            const x = xs[i], y = ys[j];
            const feasible = (x + 2 * y <= state.c1 + 1e-9) && (2 * x + y <= state.c2 + 1e-9);
            row.push(feasible ? 1 : null);
        }
        z.push(row);
    }
    return z;
}

function constraintLinePoints(xMin, xMax) {
    // Constraint 1: x + 2y = c1 → y = (c1 - x) / 2
    // Constraint 2: 2x + y = c2 → y = c2 - 2x
    const n = 100;
    const dx = (xMax - xMin) / (n - 1);

    const c1x = [], c1y = [], c2x = [], c2y = [];
    for (let i = 0; i < n; i++) {
        const x = xMin + i * dx;
        const y1 = (state.c1 - x) / 2;
        const y2 = state.c2 - 2 * x;
        c1x.push(x); c1y.push(y1);
        c2x.push(x); c2y.push(y2);
    }
    return { c1x, c1y, c2x, c2y };
}

function getContourLevels(centerX, centerY, fn, tick) {
    return [
        fn(centerX - tick, centerY - tick),
        fn(centerX - 2 * tick, centerY - 2 * tick),
        fn(centerX - 3 * tick, centerY - 3 * tick)
    ];
}

function drawObjectivePlot() {
    const sol = state.caseSolution;
    const xopt = state.xopt;
    const yopt = state.yopt;

    const plotXMax = Math.max(xopt, sol.x, state.c1, state.c2 / 2) + 3;
    const plotYMax = Math.max(yopt, sol.y, state.c1 / 2, state.c2) + 3;
    const xMin = -1, yMin = -1;

    const n = 80;
    const { xs, ys } = buildMeshGrid(xMin, plotXMax, yMin, plotYMax, n);

    // Objective contour
    const zObj = evaluateGrid(xs, ys, objFunc);
    const levels = getContourLevels(xopt, yopt, objFunc, state.xtick);

    // Feasible region heatmap
    const zFeas = feasibilityGrid(xs, ys);

    // Constraint lines
    const cl = constraintLinePoints(xMin, plotXMax);

    const traces = [
        // Feasible region
        {
            x: xs, y: ys, z: zFeas,
            type: 'heatmap',
            colorscale: [[0, 'rgba(42,161,152,0.2)'], [1, 'rgba(42,161,152,0.2)']],
            showscale: false,
            showlegend: false,
            hoverinfo: 'skip'
        },
        // Objective contours (indifference curves)
        {
            x: xs, y: ys, z: zObj,
            type: 'contour',
            contours: {
                coloring: 'none',
                start: levels[2],
                end: levels[0],
                size: (levels[0] - levels[2]) / 2,
                showlabels: true,
                labelfont: { size: 11, color: '#6c71c4' }
            },
            line: { color: '#6c71c4', width: 1.5 },
            showscale: false,
            hoverinfo: 'x+y+z',
            name: 'Indifference curves',
            showlegend: true
        },
        // Constraint 1 line (blue)
        {
            x: cl.c1x, y: cl.c1y,
            type: 'scatter', mode: 'lines',
            line: { color: '#268bd2', width: 2 },
            name: `x + 2y = ${formatNumber(state.c1)}`
        },
        // Constraint 2 line (red)
        {
            x: cl.c2x, y: cl.c2y,
            type: 'scatter', mode: 'lines',
            line: { color: '#dc322f', width: 2 },
            name: `2x + y = ${formatNumber(state.c2)}`
        },
        // Optimal point
        {
            x: [xopt], y: [yopt],
            type: 'scatter', mode: 'markers',
            marker: { color: '#b58900', size: 8, line: { color: '#073642', width: 1 } },
            name: `Optimum (${formatNumber(xopt)}, ${formatNumber(yopt)})`,
            text: [`f = ${formatNumber(objFunc(xopt, yopt))}`],
            hoverinfo: 'text+name'
        }
    ];

    const layout = {
        xaxis: { title: 'x', range: [xMin, plotXMax] },
        yaxis: { title: 'y', range: [yMin, plotYMax] },
        showlegend: true,
        legend: {
            x: 1.02, y: 1,
            xanchor: 'left',
            bgcolor: 'rgba(253,246,227,0.85)',
            bordercolor: '#93a1a1',
            borderwidth: 1,
            font: { size: 11 }
        },
        margin: { t: 30, b: 50, l: 50, r: 180 },
        paper_bgcolor: '#fdf6e3',
        plot_bgcolor: '#fdf6e3'
    };

    Plotly.newPlot('plot-objective', traces, layout, { responsive: true });
}

function drawLagrangianPlot() {
    const sol = state.caseSolution;
    const xopt = state.xopt;
    const yopt = state.yopt;

    const plotXMax = Math.max(xopt, sol.x, state.c1, state.c2 / 2) + 3;
    const plotYMax = Math.max(yopt, sol.y, state.c1 / 2, state.c2) + 3;
    const xMin = -1, yMin = -1;

    const n = 80;
    const { xs, ys } = buildMeshGrid(xMin, plotXMax, yMin, plotYMax, n);

    // Lagrangian function for this case
    const l1v = sol.l1, l2v = sol.l2;
    const lagFn = (x, y) => lagrangianFunc(x, y, l1v, l2v);

    const zLag = evaluateGrid(xs, ys, lagFn);
    const levels = getContourLevels(sol.x, sol.y, lagFn, state.xtick);

    // Feasible region
    const zFeas = feasibilityGrid(xs, ys);

    // Constraint lines
    const cl = constraintLinePoints(xMin, plotXMax);

    const traces = [
        // Feasible region
        {
            x: xs, y: ys, z: zFeas,
            type: 'heatmap',
            colorscale: [[0, 'rgba(42,161,152,0.2)'], [1, 'rgba(42,161,152,0.2)']],
            showscale: false, showlegend: false, hoverinfo: 'skip'
        },
        // Lagrangian contours
        {
            x: xs, y: ys, z: zLag,
            type: 'contour',
            contours: {
                coloring: 'none',
                start: levels[2],
                end: levels[0],
                size: (levels[0] - levels[2]) / 2,
                showlabels: true,
                labelfont: { size: 11, color: '#6c71c4' }
            },
            line: { color: '#6c71c4', width: 1.5 },
            showscale: false,
            hoverinfo: 'x+y+z',
            name: 'Lagrangian contours',
            showlegend: true
        },
        // Constraint lines
        {
            x: cl.c1x, y: cl.c1y,
            type: 'scatter', mode: 'lines',
            line: { color: '#268bd2', width: 2 },
            name: `x + 2y = ${formatNumber(state.c1)}`
        },
        {
            x: cl.c2x, y: cl.c2y,
            type: 'scatter', mode: 'lines',
            line: { color: '#dc322f', width: 2 },
            name: `2x + y = ${formatNumber(state.c2)}`
        },
        // Case solution point
        {
            x: [sol.x], y: [sol.y],
            type: 'scatter', mode: 'markers',
            marker: { color: '#d33682', size: 10, symbol: 'diamond', line: { color: '#073642', width: 1 } },
            name: `Case sol (${formatNumber(sol.x)}, ${formatNumber(sol.y)})`,
            text: [`L = ${formatNumber(lagFn(sol.x, sol.y))}`],
            hoverinfo: 'text+name'
        }
    ];

    const layout = {
        xaxis: { title: 'x', range: [xMin, plotXMax] },
        yaxis: { title: 'y', range: [yMin, plotYMax] },
        showlegend: true,
        legend: {
            x: 1.02, y: 1,
            xanchor: 'left',
            bgcolor: 'rgba(253,246,227,0.85)',
            bordercolor: '#93a1a1',
            borderwidth: 1,
            font: { size: 11 }
        },
        margin: { t: 30, b: 50, l: 50, r: 180 },
        paper_bgcolor: '#fdf6e3',
        plot_bgcolor: '#fdf6e3'
    };

    Plotly.newPlot('plot-lagrangian', traces, layout, { responsive: true });
}

function drawZoomedPlot() {
    const sol = state.caseSolution;
    const xopt = state.xopt;
    const yopt = state.yopt;

    // Lagrangian function for this case
    const l1v = sol.l1, l2v = sol.l2;
    const lagFn = (x, y) => lagrangianFunc(x, y, l1v, l2v);

    // Dynamic zoom: frame both points with padding
    const allX = [sol.x, xopt];
    const allY = [sol.y, yopt];
    const xCenter = (Math.min(...allX) + Math.max(...allX)) / 2;
    const yCenter = (Math.min(...allY) + Math.max(...allY)) / 2;
    const xSpan = Math.max(Math.max(...allX) - Math.min(...allX), 1.5);
    const ySpan = Math.max(Math.max(...allY) - Math.min(...allY), 1.5);
    const pad = 1.5; // padding around the points
    const xMin = xCenter - xSpan / 2 - pad;
    const xMax = xCenter + xSpan / 2 + pad;
    const yMin = yCenter - ySpan / 2 - pad;
    const yMax = yCenter + ySpan / 2 + pad;

    const n = 100;
    const { xs, ys } = buildMeshGrid(xMin, xMax, yMin, yMax, n);

    // Lagrangian contour at the level passing through the optimum
    const lagAtOpt = lagFn(xopt, yopt);

    // Lagrangian contours: the level through optimum + nearby levels
    const tick = Math.max(xSpan, ySpan) / 8;
    const lagLevels = [
        lagFn(sol.x - 2 * tick, sol.y - 2 * tick),
        lagFn(sol.x - tick, sol.y - tick),
        lagAtOpt,
        lagFn(sol.x + tick, sol.y + tick)
    ].sort((a, b) => a - b);

    const zLag = evaluateGrid(xs, ys, lagFn);

    // Feasible region
    const zFeas = feasibilityGrid(xs, ys);

    // Constraint lines
    const cl = constraintLinePoints(xMin, xMax);

    const traces = [
        // Feasible region
        {
            x: xs, y: ys, z: zFeas,
            type: 'heatmap',
            colorscale: [[0, 'rgba(42,161,152,0.2)'], [1, 'rgba(42,161,152,0.2)']],
            showscale: false, showlegend: false, hoverinfo: 'skip'
        },
        // Lagrangian contours (general levels)
        {
            x: xs, y: ys, z: zLag,
            type: 'contour',
            contours: {
                coloring: 'none',
                start: Math.min(...lagLevels),
                end: Math.max(...lagLevels),
                size: (Math.max(...lagLevels) - Math.min(...lagLevels)) / (lagLevels.length - 1)
            },
            line: { color: '#6c71c4', width: 1.5 },
            showscale: false,
            hoverinfo: 'x+y+z',
            name: 'Lagrangian contours',
            showlegend: true,
            contours_showlabels: false
        },
        // Lagrangian contour at optimum level (highlighted)
        {
            x: xs, y: ys, z: zLag,
            type: 'contour',
            contours: {
                coloring: 'none',
                start: lagAtOpt,
                end: lagAtOpt,
                size: 1
            },
            line: { color: '#cb4b16', width: 2.5, dash: 'dash' },
            showscale: false,
            hoverinfo: 'x+y+z',
            name: 'L contour at optimum',
            showlegend: true
        },
        // Constraint lines
        {
            x: cl.c1x, y: cl.c1y,
            type: 'scatter', mode: 'lines',
            line: { color: '#268bd2', width: 2 },
            name: `x + 2y = ${formatNumber(state.c1)}`
        },
        {
            x: cl.c2x, y: cl.c2y,
            type: 'scatter', mode: 'lines',
            line: { color: '#dc322f', width: 2 },
            name: `2x + y = ${formatNumber(state.c2)}`
        },
        // Optimal point
        {
            x: [xopt], y: [yopt],
            type: 'scatter', mode: 'markers',
            marker: { color: '#b58900', size: 10, line: { color: '#073642', width: 1 } },
            name: `Optimum (${formatNumber(xopt)}, ${formatNumber(yopt)})`,
            text: [`f = ${formatNumber(objFunc(xopt, yopt))}, L = ${formatNumber(lagAtOpt)}`],
            hoverinfo: 'text+name'
        },
        // Case solution point
        {
            x: [sol.x], y: [sol.y],
            type: 'scatter', mode: 'markers',
            marker: { color: '#d33682', size: 10, symbol: 'diamond', line: { color: '#073642', width: 1 } },
            name: `Case sol (${formatNumber(sol.x)}, ${formatNumber(sol.y)})`,
            text: [`L = ${formatNumber(lagFn(sol.x, sol.y))}`],
            hoverinfo: 'text+name'
        }
    ];

    const layout = {
        xaxis: { title: 'x', range: [xMin, xMax] },
        yaxis: { title: 'y', range: [yMin, yMax] },
        showlegend: true,
        legend: {
            x: 1.02, y: 1,
            xanchor: 'left',
            bgcolor: 'rgba(253,246,227,0.85)',
            bordercolor: '#93a1a1',
            borderwidth: 1,
            font: { size: 11 }
        },
        margin: { t: 30, b: 50, l: 50, r: 180 },
        paper_bgcolor: '#fdf6e3',
        plot_bgcolor: '#fdf6e3'
    };

    Plotly.newPlot('plot-zoomed', traces, layout, { responsive: true });
}
