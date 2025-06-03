"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashCode = exports.dvi2svg = void 0;
const crypto_1 = require("crypto");
const dvi2html_1 = require("@prinsss/dvi2html");
const jsdom_1 = require("jsdom");
const svgo_1 = require("svgo");
/**
 * Converts a DVI file to an SVG string.
 *
 * @param dvi The buffer containing the DVI file.
 * @param options The options.
 * @returns The SVG string.
 */
async function dvi2svg(dvi, options = {}) {
    let html = '';
    const dom = new jsdom_1.JSDOM(`<!DOCTYPE html>`);
    const document = dom.window.document;
    async function* streamBuffer() {
        yield Buffer.from(dvi);
        return;
    }
    await (0, dvi2html_1.dvi2html)(streamBuffer(), {
        write(chunk) {
            html = html + chunk.toString();
        },
    });
    // Patch: Assign unique IDs to SVG elements to avoid conflicts when inlining multiple SVGs.
    const ids = html.match(/\bid="pgf[^"]*"/g);
    if (ids) {
        // Sort the ids from longest to shortest.
        ids.sort((a, b) => b.length - a.length);
        const hash = hashCode(html);
        for (const id of ids) {
            const pgfIdString = id.replace(/id="pgf(.*)"/, '$1');
            html = html.replaceAll('pgf' + pgfIdString, `pgf${hash}${pgfIdString}`);
        }
    }
    // Patch: Fixes symbols stored in the SOFT HYPHEN character (e.g. \Omega, \otimes) not being rendered
    // Replaces soft hyphens with ¬
    html = html.replaceAll('&#173;', '&#172;');
    // Fix errors in the generated HTML.
    const container = document.createRange().createContextualFragment(html);
    const svg = container.querySelector('svg');
    if (options.embedFontCss) {
        const defs = document.createElement('defs');
        const style = document.createElement('style');
        const fontCssUrl = options.fontCssUrl ?? 'https://cdn.jsdelivr.net/npm/node-tikzjax@latest/css/fonts.css';
        style.textContent = `@import url('${fontCssUrl}');`;
        defs.appendChild(style);
        svg.prepend(defs);
    }
    if (options.disableOptimize) {
        return svg.outerHTML;
    }
    const optimizedSvg = (0, svgo_1.optimize)(svg.outerHTML, {
        plugins: [
            {
                name: 'preset-default',
                params: {
                    overrides: {
                        // Don't use the "cleanupIDs" plugin
                        // To avoid problems with duplicate IDs ("a", "b", ...)
                        // when inlining multiple svgs with IDs
                        cleanupIds: false,
                    },
                },
            },
        ],
    });
    return optimizedSvg.data;
}
exports.dvi2svg = dvi2svg;
/**
 * A helper function to generate a unique ID for each SVG element.
 *
 * @param str The string to hash.
 * @returns The hash of the string.
 */
function hashCode(str) {
    const md5sum = (0, crypto_1.createHash)('md5');
    md5sum.update(str);
    return md5sum.digest('hex');
}
exports.hashCode = hashCode;
