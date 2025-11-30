import { Op, BinOp } from './opcodes.js';

export type FnEntry = { name: string; offset: number; arity: number };

export type Bytecode = {
  code: number[];
  consts: any[];
  fns: FnEntry[];
  slots: Record<string, number>;
};

export function encodeJump(target: number): number[] {
  return [target >> 16, (target >> 8) & 0xff, target & 0xff];
}

export function decodeJump(pc: number, code: number[]): number {
  return (code[pc] << 16) | (code[pc + 1] << 8) | code[pc + 2];
}

export function binOpFor(op: string): BinOp {
  switch (op) {
    case 'plus':
      return BinOp.PLUS;
    case 'minus':
      return BinOp.MINUS;
    case 'times':
      return BinOp.TIMES;
    case 'divided_by':
      return BinOp.DIV;
    case 'equal_to':
      return BinOp.EQ;
    case 'not_equal_to':
      return BinOp.NEQ;
    case 'greater_than':
      return BinOp.GT;
    case 'less_than':
      return BinOp.LT;
    default:
      return BinOp.EQ;
  }
}
