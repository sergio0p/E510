"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var machine_1 = require("./machine");
var HTMLMachine = /** @class */ (function (_super) {
    __extends(HTMLMachine, _super);
    function HTMLMachine(o) {
        var _this = _super.call(this) || this;
        _this.output = o;
        _this.color = 'black';
        _this.colorStack = [];
        _this.svgDepth = 0;
        return _this;
    }
    HTMLMachine.prototype.pushColor = function (c) {
        this.colorStack.push(this.color);
        this.color = c;
    };
    HTMLMachine.prototype.popColor = function () {
        this.color = this.colorStack.pop();
    };
    HTMLMachine.prototype.setPapersize = function (width, height) {
        this.paperwidth = width;
        this.paperheight = height;
    };
    HTMLMachine.prototype.getCurrentPosition = function () {
        return [
            this.position.h * this.pointsPerDviUnit,
            this.position.v * this.pointsPerDviUnit
        ];
    };
    HTMLMachine.prototype.setCurrentPosition = function (x, y) {
        this.position.h = x / this.pointsPerDviUnit;
        this.position.v = y / this.pointsPerDviUnit;
    };
    HTMLMachine.prototype.putHTML = function (html) {
        this.output.write(html);
    };
    HTMLMachine.prototype.putSVG = function (svg) {
        var left = this.position.h * this.pointsPerDviUnit;
        var top = this.position.v * this.pointsPerDviUnit;
        if (svg.match(/<svg beginpicture>/)) {
            if (this.svgDepth > 0) {
                // In this case we are inside another svg element so drop the svg start tags.
                svg = svg.replace("<svg beginpicture>", "");
            }
            else {
                svg = svg.replace("<svg beginpicture>", "<svg version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" " +
                    "xmlns:xlink=\"http://www.w3.org/1999/xlink\" " +
                    ("width=\"" + this.paperwidth + "pt\" height=\"" + this.paperheight + "pt\" ") +
                    ("viewBox=\"-72 -72 " + this.paperwidth + " " + this.paperheight + "\">"));
            }
        }
        if (svg.match(/<\/svg endpicture>/)) {
            // If we are inside another svg element, then drop the svg end tag.
            // Otherwise just remove the " endpicture" bit.
            svg = svg.replace("<\/svg endpicture>", this.svgDepth > 0 ? "" : "<\/svg>");
        }
        svg = svg.replace(/{\?x}/g, left.toString());
        svg = svg.replace(/{\?y}/g, top.toString());
        this.svgDepth += (svg.match(/<svg.*>/g) || []).length;
        this.svgDepth -= (svg.match(/<\/svg.*>/g) || []).length;
        this.output.write(svg);
    };
    HTMLMachine.prototype.preamble = function (numerator, denominator, magnification, comment) {
        var dviUnit = magnification * numerator / 1000.0 / denominator;
        var resolution = 300.0; // ppi
        var tfm_conv = (25400000.0 / numerator) * (denominator / 473628672) / 16.0;
        var conv = (numerator / 254000.0) * (resolution / denominator);
        conv = conv * (magnification / 1000.0);
        this.pointsPerDviUnit = dviUnit * 72.27 / 100000.0 / 2.54;
    };
    HTMLMachine.prototype.putRule = function (rule) {
        var a = rule.a * this.pointsPerDviUnit;
        var b = rule.b * this.pointsPerDviUnit;
        var left = this.position.h * this.pointsPerDviUnit;
        var bottom = this.position.v * this.pointsPerDviUnit;
        var top = bottom - a;
        this.output.write("<rect x=\"" + left + "\" y=\"" + top + "\" width=\"" + b + "\" height=\"" + a + "\" fill=\"" + this.color + "\"" +
            (this.matrix.toSVGTransform() + "></rect>"));
    };
    HTMLMachine.prototype.putText = function (text) {
        var textWidth = 0;
        var textHeight = 0;
        var textDepth = 0;
        var htmlText = "";
        for (var i = 0; i < text.length; i++) {
            var c = text[i];
            var metrics = this.font.metrics.characters[c];
            if (metrics === undefined) {
                //TODO: Handle this better. Error only happens for c === 127
                console.error("Could not find font metric for " + c);
                metrics = this.font.metrics.characters[126];
            }
            textWidth += metrics.width;
            textHeight = Math.max(textHeight, metrics.height);
            textDepth = Math.max(textDepth, metrics.depth);
            // This is ridiculous.
            if ((c >= 0) && (c <= 9)) {
                htmlText += "&#" + (161 + c) + ";";
            }
            else if ((c >= 10) && (c <= 19)) {
                htmlText += "&#" + (173 + c - 10) + ";";
            }
            else if (c == 20) {
                htmlText += "&#" + 8729 + ";"; // O RLLY?!
            }
            else if ((c >= 21) && (c <= 32)) {
                htmlText += "&#" + (184 + c - 21) + ";";
            }
            else if (c == 127) {
                htmlText += "&#" + 196 + ";";
            }
            else {
                htmlText += String.fromCharCode(c);
            }
        }
        // tfm is based on 1/2^16 pt units, rather than dviunit which is 10^−7 meters
        var dviUnitsPerFontUnit = this.font.metrics.designSize / 1048576.0 * 65536 / 1048576;
        var top = (this.position.v - textHeight * dviUnitsPerFontUnit) * this.pointsPerDviUnit;
        var left = this.position.h * this.pointsPerDviUnit;
        var width = textWidth * this.pointsPerDviUnit * dviUnitsPerFontUnit;
        var height = textHeight * this.pointsPerDviUnit * dviUnitsPerFontUnit;
        var depth = textDepth * this.pointsPerDviUnit * dviUnitsPerFontUnit;
        var top = this.position.v * this.pointsPerDviUnit;
        var fontsize = (this.font.metrics.designSize / 1048576.0) * this.font.scaleFactor / this.font.designSize;
        if (this.svgDepth == 0) {
            this.output.write("<span style=\"line-height: 0; color: " + this.color + "; font-family: " + this.font.name + "; font-size: " + fontsize + "pt; position: absolute; top: " + (top - height) + "pt; left: " + left + "pt; overflow: visible;\"><span style=\"margin-top: -" + fontsize + "pt; line-height: " + 0 + "pt; height: " + fontsize + "pt; display: inline-block; vertical-align: baseline; \">" + htmlText + "</span><span style=\"display: inline-block; vertical-align: " + height + "pt; height: " + 0 + "pt; line-height: 0;\"></span></span>");
        }
        else {
            var bottom = this.position.v * this.pointsPerDviUnit;
            // No 'pt' on fontsize since those units are potentially scaled
            this.output.write("<text alignment-baseline=\"baseline\" y=\"" + bottom + "\" x=\"" + left + "\" " +
                ("font-family=\"" + this.font.name + "\" font-size=\"" + fontsize + "\" ") +
                ("fill=\"" + this.color + "\"" + this.matrix.toSVGTransform() + ">") +
                (htmlText + "</text>"));
        }
        return textWidth * dviUnitsPerFontUnit * this.font.scaleFactor / this.font.designSize;
    };
    return HTMLMachine;
}(machine_1.Machine));
exports.default = HTMLMachine;
