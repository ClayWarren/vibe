import { Op, BinOp } from './opcodes.js';
import { decodeJump, Bytecode } from './bytecode.js';

type Host = {
  fetch?: (t: string, q?: string | null) => any;
  send?: (p: any, t?: any) => void;
  store?: (v: any, t?: string) => void;
  log?: (v: any) => void;
};

export function runBytecode(bc: Bytecode, entry: string, host: Host = {}): any {
  const fn = bc.fns.find((f) => f.name === entry);
  if (!fn) throw new Error(`entry ${entry} not found`);
  let pc = fn.offset;
  const stack: any[] = [];
  const locals: any[] = [];
  // seed locals from host globals matching slot names
  Object.entries(bc.slots).forEach(([name, idx]) => {
    if ((host as any)[name] !== undefined) locals[idx] = (host as any)[name];
  });
  while (pc < bc.code.length) {
    const op = bc.code[pc++];
    switch (op) {
      case Op.CONST:
        stack.push(bc.consts[bc.code[pc++]]);
        break;
      case Op.LOAD:
        stack.push(locals[bc.code[pc++]] ?? null);
        break;
      case Op.LOAD_IDX: {
        const idx = stack.pop();
        const arr = stack.pop();
        stack.push(arr?.[idx]);
        break;
      }
      case Op.LEN: {
        const arr = stack.pop();
        stack.push(Array.isArray(arr) ? arr.length : 0);
        break;
      }
      case Op.STORE: {
        const idx = bc.code[pc++];
        locals[idx] = stack.pop();
        break;
      }
      case Op.FETCH: {
        const tgt = bc.consts[bc.code[pc++]] as string;
        const qual = bc.consts[bc.code[pc++]] as string | null;
        const res = host.fetch ? host.fetch(tgt, qual ?? undefined) : [];
        stack.push(res);
        break;
      }
      case Op.SEND: {
        const hasTarget = bc.code[pc++];
        const target = hasTarget ? stack.pop() : undefined;
        const payload = stack.pop();
        host.send?.(payload, target);
        break;
      }
      case Op.STORE_OP: {
        const key = bc.consts[bc.code[pc++]] as string;
        const val = stack.pop();
        host.store?.(val, key);
        break;
      }
      case Op.ENSURE: {
        const v = stack.pop();
        if (!v) throw new Error('Expectation failed');
        break;
      }
      case Op.BIN_OP: {
        const bop = bc.code[pc++];
        const r = stack.pop();
        const l = stack.pop();
        stack.push(applyBin(l, r, bop));
        break;
      }
      case Op.CALL: {
        const idx = bc.code[pc++];
        const target = bc.fns[idx];
        if (!target) throw new Error('call missing fn');
        const ret = runBytecode({ ...bc, fns: bc.fns }, target.name, host);
        stack.push(ret);
        break;
      }
      case Op.JUMP: {
        const dest = decodeJump(pc, bc.code);
        pc = dest;
        break;
      }
      case Op.JUMP_IF_FALSE: {
        const dest = decodeJump(pc, bc.code);
        const cond = stack.pop();
        pc = cond ? pc + 3 : dest;
        break;
      }
      case Op.STOP:
        return { status: 400, body: stack.pop() };
      case Op.RET:
        return stack.pop();
      case Op.NOOP:
      default:
        break;
    }
  }
  return null;
}

function applyBin(l: any, r: any, op: BinOp) {
  switch (op) {
    case BinOp.PLUS:
      return l + r;
    case BinOp.MINUS:
      return l - r;
    case BinOp.TIMES:
      return l * r;
    case BinOp.DIV:
      return l / r;
    case BinOp.EQ:
      return l === r;
    case BinOp.NEQ:
      return l !== r;
    case BinOp.GT:
      return l > r;
    case BinOp.LT:
      return l < r;
    default:
      return undefined;
  }
}
