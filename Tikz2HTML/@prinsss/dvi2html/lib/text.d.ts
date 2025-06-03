/// <reference types="node" />
import { Machine, Rule } from "./machine";
import { Writable } from 'stream';
export default class TextMachine extends Machine {
    output: Writable;
    snippets: [number, number, Buffer][];
    constructor(o: Writable);
    putRule(rule: Rule): void;
    beginPage(page: any): void;
    endPage(): void;
    putText(text: Buffer): number;
    postPost(p: any): void;
}
