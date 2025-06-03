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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spread = (this && this.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
    return ar;
};
Object.defineProperty(exports, "__esModule", { value: true });
var matrix_1 = require("../matrix");
// Postscript interpreter.
// Most postscript is not implemented.
// There is enough implemented to perform the basic operations that result from the LaTeX commands \scalebox,
// \rotatebox, and \resizebox, and a little more that is incomplete and mostly untested.
var PSInterpreter = /** @class */ (function () {
    function PSInterpreter(machine, psInput) {
        this.machine = machine;
        this.psInput = psInput;
        this.stack = [];
    }
    PSInterpreter.prototype.interpret = function (machine) {
        var e_1, _a;
        try {
            for (var _b = __values(tokens(this.psInput)), _c = _b.next(); !_c.done; _c = _b.next()) {
                var token = _c.value;
                // Numeric literals
                if (/^[+-]?\d+(\.\d*)?$/.test(token)) {
                    this.stack.push(new PSNumber(token));
                    continue;
                }
                // String literals
                if (token[0] == '(') {
                    this.stack.push(new PSString(token));
                    continue;
                }
                // Array start (same as a mark)
                if (token == '[') {
                    PSInterpreter.operators.mark(this);
                    continue;
                }
                // Array end
                if (token == ']') {
                    var array = new PSArray();
                    var elt = this.stack.pop();
                    while (!elt.name || elt.name != 'mark') {
                        array.push(elt);
                    }
                    this.stack.push(array);
                }
                // Identifiers (i.e. Variables)
                if (token[0] == "/") {
                    this.stack.push(new PSIdentifier(token));
                }
                // Procedures
                if (token[0] == '{') {
                    this.stack.push(new PSProcedure(token));
                }
                // Operators
                if (token in PSInterpreter.operators) {
                    PSInterpreter.operators[token](this);
                    continue;
                }
                throw Error("Invalid or unimplemented postscript expression");
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
        }
    };
    PSInterpreter.stateQueue = [];
    // The value of each key is the number of parameters from the stack it needs.
    PSInterpreter.operators = {
        // Stack operators
        pop: function (interpreter) { interpreter.stack.pop(); },
        exch: function (interpreter) {
            var a1 = interpreter.stack.pop();
            var a2 = interpreter.stack.pop();
            interpreter.stack.push(a1);
            interpreter.stack.push(a2);
        },
        dup: function (interpreter) {
            interpreter.stack.push(interpreter.stack[interpreter.stack.length - 1]);
        },
        mark: function (interpreter) {
            interpreter.stack.push(new PSMark());
        },
        // Math operators
        neg: function (interpreter) {
            var x = interpreter.stack.pop();
            interpreter.stack.push(new PSNumber(-x.value));
        },
        add: function (interpreter) {
            var x = interpreter.stack.pop();
            var y = interpreter.stack.pop();
            interpreter.stack.push(new PSNumber(x.value + y.value));
        },
        sub: function (interpreter) {
            var x = interpreter.stack.pop();
            var y = interpreter.stack.pop();
            interpreter.stack.push(new PSNumber(y.value - x.value));
        },
        mul: function (interpreter) {
            var x = interpreter.stack.pop();
            var y = interpreter.stack.pop();
            interpreter.stack.push(new PSNumber(x.value * y.value));
        },
        div: function (interpreter) {
            var x = interpreter.stack.pop();
            var y = interpreter.stack.pop();
            interpreter.stack.push(new PSNumber(y.value / x.value));
        },
        // Graphics state operators
        gsave: function (interpreter) {
            PSInterpreter.stateQueue.push(new matrix_1.default(interpreter.machine.matrix));
        },
        grestore: function (interpreter) {
            interpreter.machine.matrix = PSInterpreter.stateQueue.pop();
        },
        // Path construction operators
        currentpoint: function (interpreter) {
            var _a;
            (_a = interpreter.stack).push.apply(_a, __spread(interpreter.machine.getCurrentPosition().map(function (coord) { return new PSNumber(coord); })));
        },
        moveto: function (interpreter) {
            var y = interpreter.stack.pop();
            var x = interpreter.stack.pop();
            interpreter.machine.setCurrentPosition(x.value, y.value);
        },
        // Coordinate system and matrix operators
        scale: function (interpreter) {
            var y = interpreter.stack.pop();
            var x = interpreter.stack.pop();
            interpreter.machine.matrix.scale(x.value, y.value);
        },
        translate: function (interpreter) {
            var y = interpreter.stack.pop();
            var x = interpreter.stack.pop();
            interpreter.machine.matrix.translate(x.value, y.value);
        },
        rotate: function (interpreter) {
            // r is in degrees
            var r = interpreter.stack.pop();
            interpreter.machine.matrix.rotate(r.value);
        }
    };
    return PSInterpreter;
}());
exports.default = PSInterpreter;
// Parse a string into tokens.  This method attempts to emulate ghostscript's parsing.
function tokens(input) {
    var token, stringLevel, procedureLevel, charGen, charGen_1, charGen_1_1, character, nextChar, _a, e_2_1;
    var e_2, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                token = "";
                stringLevel = 0;
                procedureLevel = 0;
                charGen = (function () {
                    var input_1, input_1_1, c, e_3_1;
                    var e_3, _a;
                    return __generator(this, function (_b) {
                        switch (_b.label) {
                            case 0:
                                _b.trys.push([0, 5, 6, 7]);
                                input_1 = __values(input), input_1_1 = input_1.next();
                                _b.label = 1;
                            case 1:
                                if (!!input_1_1.done) return [3 /*break*/, 4];
                                c = input_1_1.value;
                                return [4 /*yield*/, c];
                            case 2:
                                _b.sent();
                                _b.label = 3;
                            case 3:
                                input_1_1 = input_1.next();
                                return [3 /*break*/, 1];
                            case 4: return [3 /*break*/, 7];
                            case 5:
                                e_3_1 = _b.sent();
                                e_3 = { error: e_3_1 };
                                return [3 /*break*/, 7];
                            case 6:
                                try {
                                    if (input_1_1 && !input_1_1.done && (_a = input_1.return)) _a.call(input_1);
                                }
                                finally { if (e_3) throw e_3.error; }
                                return [7 /*endfinally*/];
                            case 7: return [2 /*return*/];
                        }
                    });
                })();
                _c.label = 1;
            case 1:
                _c.trys.push([1, 35, 36, 37]);
                charGen_1 = __values(charGen), charGen_1_1 = charGen_1.next();
                _c.label = 2;
            case 2:
                if (!!charGen_1_1.done) return [3 /*break*/, 34];
                character = charGen_1_1.value;
                nextChar = undefined;
                _a = character;
                switch (_a) {
                    case ' ': return [3 /*break*/, 3];
                    case '\t': return [3 /*break*/, 3];
                    case '\n': return [3 /*break*/, 3];
                    case '[': return [3 /*break*/, 8];
                    case ']': return [3 /*break*/, 8];
                    case '{': return [3 /*break*/, 14];
                    case '}': return [3 /*break*/, 18];
                    case '(': return [3 /*break*/, 21];
                    case ')': return [3 /*break*/, 24];
                    case '\\': return [3 /*break*/, 27];
                    case '/': return [3 /*break*/, 28];
                    case '%': return [3 /*break*/, 31];
                }
                return [3 /*break*/, 32];
            case 3:
                if (!procedureLevel) return [3 /*break*/, 4];
                if (token[token.length - 1] != ' ')
                    token += ' ';
                return [3 /*break*/, 7];
            case 4:
                if (!stringLevel) return [3 /*break*/, 5];
                switch (character) {
                    case ' ':
                        token += ' ';
                        break;
                    case '\n':
                        token += '\\n';
                        break;
                    case '\t':
                        token += '\\t';
                        break;
                }
                return [3 /*break*/, 7];
            case 5:
                if (!token) return [3 /*break*/, 7];
                return [4 /*yield*/, token];
            case 6:
                _c.sent();
                token = "";
                _c.label = 7;
            case 7: return [3 /*break*/, 33];
            case 8:
                if (!(!procedureLevel && !stringLevel)) return [3 /*break*/, 12];
                if (!token) return [3 /*break*/, 10];
                return [4 /*yield*/, token];
            case 9:
                _c.sent();
                _c.label = 10;
            case 10:
                token = "";
                return [4 /*yield*/, character];
            case 11:
                _c.sent();
                return [3 /*break*/, 13];
            case 12:
                token += character;
                _c.label = 13;
            case 13: return [3 /*break*/, 33];
            case 14:
                if (!!stringLevel) return [3 /*break*/, 17];
                if (!(procedureLevel == 0 && token)) return [3 /*break*/, 16];
                return [4 /*yield*/, token];
            case 15:
                _c.sent();
                _c.label = 16;
            case 16:
                ++procedureLevel;
                _c.label = 17;
            case 17:
                token += character;
                return [3 /*break*/, 33];
            case 18:
                token += character;
                if (stringLevel)
                    return [3 /*break*/, 33];
                --procedureLevel;
                if (!!procedureLevel) return [3 /*break*/, 20];
                return [4 /*yield*/, token];
            case 19:
                _c.sent();
                token = "";
                _c.label = 20;
            case 20: return [3 /*break*/, 33];
            case 21:
                ++stringLevel;
                if (!(token && !procedureLevel && stringLevel == 1)) return [3 /*break*/, 23];
                return [4 /*yield*/, token];
            case 22:
                _c.sent();
                _c.label = 23;
            case 23:
                if (stringLevel > 1)
                    token += '\\';
                token += character;
                return [3 /*break*/, 33];
            case 24:
                --stringLevel;
                if (stringLevel)
                    token += '\\';
                token += character;
                if (!(!procedureLevel && !stringLevel)) return [3 /*break*/, 26];
                return [4 /*yield*/, token];
            case 25:
                _c.sent();
                token = "";
                _c.label = 26;
            case 26: return [3 /*break*/, 33];
            case 27:
                token += character;
                nextChar = charGen.next();
                if (nextChar.done)
                    throw Error("Invalid escape character.");
                if (!nextChar.done)
                    token += nextChar.value;
                return [3 /*break*/, 33];
            case 28:
                if (!(!procedureLevel && !stringLevel && token)) return [3 /*break*/, 30];
                return [4 /*yield*/, token];
            case 29:
                _c.sent();
                _c.label = 30;
            case 30:
                token += character;
                return [3 /*break*/, 33];
            case 31:
                do {
                    nextChar = charGen.next();
                } while (!nextChar.done && nextChar.value != '\n');
                return [3 /*break*/, 33];
            case 32:
                token += character;
                _c.label = 33;
            case 33:
                charGen_1_1 = charGen_1.next();
                return [3 /*break*/, 2];
            case 34: return [3 /*break*/, 37];
            case 35:
                e_2_1 = _c.sent();
                e_2 = { error: e_2_1 };
                return [3 /*break*/, 37];
            case 36:
                try {
                    if (charGen_1_1 && !charGen_1_1.done && (_b = charGen_1.return)) _b.call(charGen_1);
                }
                finally { if (e_2) throw e_2.error; }
                return [7 /*endfinally*/];
            case 37:
                if (!token) return [3 /*break*/, 39];
                return [4 /*yield*/, token];
            case 38:
                _c.sent();
                _c.label = 39;
            case 39: return [2 /*return*/];
        }
    });
}
// Postscript stack objects
var StackObject = /** @class */ (function () {
    function StackObject(name) {
        this.name = name;
    }
    return StackObject;
}());
// Stack number
var PSNumber = /** @class */ (function (_super) {
    __extends(PSNumber, _super);
    function PSNumber(value) {
        var _this = _super.call(this, "number") || this;
        if (typeof value === "number")
            _this.value = value;
        else if (typeof value === "string")
            _this.value = parseFloat(value);
        return _this;
    }
    return PSNumber;
}(StackObject));
// Stack string
var PSString = /** @class */ (function (_super) {
    __extends(PSString, _super);
    function PSString(value) {
        var _this = _super.call(this, "string") || this;
        _this.value = value.replace(/^\(|\)$/g, "");
        return _this;
    }
    return PSString;
}(StackObject));
// Stack array
var PSArray = /** @class */ (function (_super) {
    __extends(PSArray, _super);
    function PSArray(value) {
        var _this = _super.call(this, "array") || this;
        _this.value = value || [];
        return _this;
    }
    PSArray.prototype.push = function (elt) {
        this.value.push(elt);
    };
    PSArray.prototype.pop = function () {
        return this.value.pop();
    };
    return PSArray;
}(StackObject));
// Stack mark
var PSMark = /** @class */ (function (_super) {
    __extends(PSMark, _super);
    function PSMark() {
        var _this = _super.call(this, "mark") || this;
        _this.value = "-mark-";
        return _this;
    }
    return PSMark;
}(StackObject));
// Stack identifier
var PSIdentifier = /** @class */ (function (_super) {
    __extends(PSIdentifier, _super);
    function PSIdentifier(value) {
        var _this = _super.call(this, "identifier") || this;
        _this.value = value.replace(/^\//, "");
        return _this;
    }
    return PSIdentifier;
}(StackObject));
// Stack procedure object
var PSProcedure = /** @class */ (function (_super) {
    __extends(PSProcedure, _super);
    function PSProcedure(value) {
        var _this = _super.call(this, "procedure") || this;
        _this.value = value;
        return _this;
    }
    return PSProcedure;
}(StackObject));
