"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Matrix = /** @class */ (function () {
    function Matrix(m) {
        this.values = m ? m.values.slice(0) : [1, 0, 0, 1, 0, 0];
    }
    Matrix.prototype.isIdentity = function () {
        return (Math.abs(this.values[0] - 1) < Number.EPSILON && Math.abs(this.values[1]) < Number.EPSILON &&
            Math.abs(this.values[2]) < Number.EPSILON && Math.abs(this.values[3] - 1) < Number.EPSILON &&
            Math.abs(this.values[4]) < Number.EPSILON && Math.abs(this.values[5]) < Number.EPSILON);
    };
    // this = this * A
    Matrix.prototype.multiplyRight = function (A) {
        var result = new Matrix();
        result.values[0] = this.values[0] * A.values[0] + this.values[2] * A.values[1];
        result.values[1] = this.values[1] * A.values[0] + this.values[3] * A.values[1];
        result.values[2] = this.values[0] * A.values[2] + this.values[2] * A.values[3];
        result.values[3] = this.values[1] * A.values[2] + this.values[3] * A.values[3];
        result.values[4] = this.values[0] * A.values[4] + this.values[2] * A.values[5] + this.values[4];
        result.values[5] = this.values[1] * A.values[4] + this.values[3] * A.values[5] + this.values[5];
        this.values = A.values;
        return this;
    };
    // this = this * [[x, 0, 0], [0, y, 0], [0, 0, 1]]
    Matrix.prototype.scale = function (x, y) {
        this.values[0] *= x;
        this.values[1] *= x;
        this.values[2] *= y;
        this.values[3] *= y;
        return this;
    };
    // this = this * [[1, 0, x], [0, 1, y], [0, 0, 1]]
    Matrix.prototype.translate = function (x, y) {
        this.values[4] = this.values[0] * x + this.values[2] * y + this.values[4];
        this.values[5] = this.values[1] * x + this.values[3] * y + this.values[5];
        return this;
    };
    // this = this * [[cos(x), sin(x), 0], [-sin(x), cos(x), 0], [0, 0, 1]]
    // x is in degrees
    Matrix.prototype.rotate = function (x) {
        var rad = x * Math.PI / 180;
        var c = Math.cos(rad);
        var s = Math.sin(rad);
        var m0 = this.values[0] * c + this.values[2] * s;
        var m1 = this.values[1] * c + this.values[3] * s;
        var m2 = -this.values[0] * s + this.values[2] * c;
        var m3 = -this.values[1] * s + this.values[3] * c;
        this.values[0] = m0;
        this.values[1] = m1;
        this.values[2] = m2;
        this.values[3] = m3;
        return this;
    };
    Matrix.prototype.toSVGTransform = function () {
        return this.isIdentity() ? "" : " transform=\"matrix(" + this.values.join(" ") + ")\"";
    };
    Matrix.prototype.toString = function () {
        return "[" + this.values.join(",") + "]";
    };
    return Matrix;
}());
exports.default = Matrix;
