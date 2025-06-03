"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
const bootstrap_1 = require("./bootstrap");
const dvi2svg_1 = require("./dvi2svg");
__exportStar(require("./bootstrap"), exports);
__exportStar(require("./dvi2svg"), exports);
/**
 * Compiles TeX source code to SVG image.
 */
async function tex2svg(input, options) {
    await (0, bootstrap_1.load)();
    const dvi = await (0, bootstrap_1.tex)(input, options);
    const svg = await (0, dvi2svg_1.dvi2svg)(dvi, options);
    return svg;
}
exports.default = tex2svg;
