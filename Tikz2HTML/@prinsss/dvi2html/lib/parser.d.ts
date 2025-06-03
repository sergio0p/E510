import { Machine } from "./machine";
declare enum Opcode {
    set_char = 0,
    set1 = 128,
    set2 = 129,
    set3 = 130,
    set4 = 131,
    set_rule = 132,
    put_char = 133,
    put2 = 134,
    put3 = 135,
    put4 = 136,
    put_rule = 137,
    nop = 138,
    bop = 139,
    eop = 140,
    push = 141,
    pop = 142,
    right = 143,
    right2 = 144,
    right3 = 145,
    right4 = 146,
    w = 147,
    w1 = 148,
    w2 = 149,
    w3 = 150,
    w4 = 151,
    x = 152,
    x1 = 153,
    x2 = 154,
    x3 = 155,
    x4 = 156,
    down = 157,
    down2 = 158,
    down3 = 159,
    down4 = 160,
    y = 161,
    y1 = 162,
    y2 = 163,
    y3 = 164,
    y4 = 165,
    z = 166,
    z1 = 167,
    z2 = 168,
    z3 = 169,
    z4 = 170,
    fnt = 171,
    fnt1 = 235,
    fnt2 = 236,
    fnt3 = 237,
    fnt4 = 238,
    xxx = 239,
    xxx2 = 240,
    xxx3 = 241,
    xxx4 = 242,
    fnt_def = 243,
    fnt_def2 = 244,
    fnt_def3 = 245,
    fnt_def4 = 246,
    pre = 247,
    post = 248,
    post_post = 249
}
export declare class DviCommand {
    length: number;
    special: boolean;
    constructor(properties: any);
    execute(machine: Machine): void;
    toString(): string;
}
declare class PutChar extends DviCommand {
    opcode: Opcode.put_char;
    c: number;
    constructor(properties: any);
    execute(machine: Machine): void;
    toString(): string;
}
declare class SetChar extends DviCommand {
    opcode: Opcode.set_char;
    c: number;
    constructor(properties: any);
    execute(machine: Machine): void;
    toString(): string;
}
declare class PutRule extends DviCommand {
    opcode: Opcode.put_rule;
    a: number;
    b: number;
    constructor(properties: any);
    execute(machine: Machine): void;
    toString(): string;
}
declare class SetRule extends DviCommand {
    opcode: Opcode.set_rule;
    a: number;
    b: number;
    constructor(properties: any);
    execute(machine: Machine): void;
    toString(): string;
}
declare class Nop extends DviCommand {
    opcode: Opcode.nop;
    constructor(properties: any);
    toString(): string;
}
declare class Bop extends DviCommand {
    opcode: Opcode.bop;
    c_0: number;
    c_1: number;
    c_2: number;
    c_3: number;
    c_4: number;
    c_5: number;
    c_6: number;
    c_7: number;
    c_8: number;
    c_9: number;
    p: number;
    constructor(properties: any);
    execute(machine: Machine): void;
    toString(): string;
}
declare class Eop extends DviCommand {
    opcode: Opcode.eop;
    constructor(properties: any);
    execute(machine: Machine): void;
    toString(): string;
}
declare class Push extends DviCommand {
    opcode: Opcode.push;
    constructor(properties: any);
    execute(machine: Machine): void;
    toString(): string;
}
declare class Pop extends DviCommand {
    opcode: Opcode.pop;
    constructor(properties: any);
    execute(machine: Machine): void;
    toString(): string;
}
declare class MoveRight extends DviCommand {
    opcode: Opcode.right;
    b: number;
    constructor(properties: any);
    execute(machine: Machine): void;
    toString(): string;
}
declare class MoveW extends DviCommand {
    opcode: Opcode.w;
    b: number;
    constructor(properties: any);
    execute(machine: Machine): void;
    toString(): string;
}
declare class MoveX extends DviCommand {
    opcode: Opcode.x;
    b: number;
    constructor(properties: any);
    execute(machine: Machine): void;
    toString(): string;
}
declare class MoveDown extends DviCommand {
    opcode: Opcode.down;
    a: number;
    constructor(properties: any);
    execute(machine: Machine): void;
    toString(): string;
}
declare class MoveY extends DviCommand {
    opcode: Opcode.y;
    a: number;
    constructor(properties: any);
    execute(machine: Machine): void;
    toString(): string;
}
declare class MoveZ extends DviCommand {
    opcode: Opcode.z;
    a: number;
    constructor(properties: any);
    execute(machine: Machine): void;
    toString(): string;
}
declare class SetFont extends DviCommand {
    opcode: Opcode.fnt;
    k: number;
    constructor(properties: any);
    execute(machine: Machine): void;
    toString(): string;
}
declare class Special extends DviCommand {
    opcode: Opcode.xxx;
    x: string;
    constructor(properties: any);
    toString(): string;
}
declare class FontDefinition extends DviCommand {
    opcode: Opcode.fnt_def;
    k: number;
    c: number;
    s: number;
    d: number;
    a: number;
    l: number;
    n: string;
    constructor(properties: any);
    execute(machine: Machine): void;
    toString(): string;
}
declare class Preamble extends DviCommand {
    opcode: Opcode.pre;
    i: number;
    num: number;
    den: number;
    mag: number;
    x: string;
    constructor(properties: any);
    execute(machine: Machine): void;
    toString(): string;
}
declare class Post extends DviCommand {
    opcode: Opcode.post;
    p: number;
    num: number;
    den: number;
    mag: number;
    l: number;
    u: number;
    s: number;
    t: number;
    constructor(properties: any);
    execute(machine: Machine): void;
    toString(): string;
}
declare class PostPost extends DviCommand {
    opcode: Opcode.post_post;
    q: number;
    i: number;
    constructor(properties: any);
    execute(machine: Machine): void;
    toString(): string;
}
declare type Command = SetChar | SetRule | PutChar | PutRule | Nop | Bop | Eop | Push | Pop | MoveRight | MoveW | MoveX | MoveDown | MoveY | MoveZ | SetFont | Special | FontDefinition | Preamble | Post | PostPost;
export declare function dviParser(stream: any): AsyncGenerator<Command, void, unknown>;
export declare function execute(commands: any, machine: any): Promise<void>;
export declare function merge(commands: any, filter: any, merge: any): AsyncGenerator<any, void, any>;
export declare function mergeText(commands: any): AsyncGenerator<any, void, any>;
export {};
