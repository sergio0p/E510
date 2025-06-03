export default class Matrix {
    private values;
    constructor(m?: Matrix | void);
    isIdentity(): boolean;
    multiplyRight(A: Matrix): Matrix;
    scale(x: number, y: number): Matrix;
    translate(x: number, y: number): Matrix;
    rotate(x: number): Matrix;
    toSVGTransform(): string;
    toString(): string;
}
