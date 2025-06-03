import { Machine } from '../machine';
export default class PSInterpreter {
    private machine;
    private stack;
    private psInput;
    private static stateQueue;
    constructor(machine: Machine, psInput: string);
    interpret(machine: Machine): void;
    private static operators;
}
