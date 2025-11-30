import type { IRNode } from '../ir/index.js';
import { Op, BinOp } from './opcodes.js';
import { Bytecode, encodeJump, binOpFor } from './bytecode.js';

type Ctx = {
  code: number[];
  consts: any[];
  fns: { name: string; offset: number; arity: number }[];
  slots: Record<string, number>;
};

export function compileIR(ir: IRNode): Bytecode {
  const ctx: Ctx = { code: [], consts: [], fns: [], slots: {} };
  emit(ir, ctx);
  return { code: ctx.code, consts: ctx.consts, fns: ctx.fns, slots: ctx.slots };
}

function emit(node: IRNode, ctx: Ctx) {
  switch (node.kind) {
    case 'IRProgram':
      for (const n of node.body) emit(n, ctx);
      break;
    case 'IRLet':
      if (node.value.kind === 'IRProgram') {
        // function/event
        const offset = ctx.code.length;
        ctx.fns.push({ name: node.name, offset, arity: 0 });
        emit(node.value, ctx);
        ctx.code.push(Op.RET);
      } else {
        emit(node.value, ctx);
        ctx.code.push(Op.STORE, slot(ctx, node.name));
      }
      break;
    case 'IRReturn':
      if (node.value) emit(node.value, ctx);
      ctx.code.push(Op.RET);
      break;
    case 'IRStop':
      emit(node.value, ctx);
      ctx.code.push(Op.STOP);
      break;
    case 'IRIf': {
      emit(node.condition, ctx);
      const jfPos = ctx.code.length;
      ctx.code.push(Op.JUMP_IF_FALSE, 0, 0, 0);
      node.then.forEach((s) => emit(s, ctx));
      const jendPos = ctx.code.length;
      ctx.code.push(Op.JUMP, 0, 0, 0);
      const elseOffset = ctx.code.length;
      patchJump(ctx, jfPos, elseOffset);
      node.otherwise?.forEach((s) => emit(s, ctx));
      const end = ctx.code.length;
      patchJump(ctx, jendPos, end);
      break;
    }
    case 'IRForEach': {
      const start = ctx.code.length;
      emit(node.collection, ctx);
      const arrSlot = slot(ctx, `_iter_${start}`);
      ctx.code.push(Op.STORE, arrSlot);
      const idxSlot = slot(ctx, `_idx_${start}`);
      ctx.code.push(Op.CONST, pushConst(ctx, 0), Op.STORE, idxSlot);
      const loopCheck = ctx.code.length;
      ctx.code.push(Op.LOAD, idxSlot);      // idx
      ctx.code.push(Op.LOAD, arrSlot);      // arr
      ctx.code.push(Op.LEN);                // len
      ctx.code.push(Op.BIN_OP, BinOp.LT);   // idx < len
      const jf = ctx.code.length;
      ctx.code.push(Op.JUMP_IF_FALSE, 0, 0, 0); // if false -> end
      // load arr[idx]
      ctx.code.push(Op.LOAD, arrSlot);
      ctx.code.push(Op.LOAD, idxSlot);
      ctx.code.push(Op.LOAD_IDX);
      ctx.code.push(Op.STORE, slot(ctx, node.item));
      node.body.forEach((s) => emit(s, ctx));
      // idx++
      ctx.code.push(Op.LOAD, idxSlot);
      ctx.code.push(Op.CONST, pushConst(ctx, 1));
      ctx.code.push(Op.BIN_OP, BinOp.PLUS);
      ctx.code.push(Op.STORE, idxSlot);
      ctx.code.push(Op.JUMP, ...encodeJump(loopCheck));
      patchJump(ctx, jf, ctx.code.length);
      break;
    }
    case 'IRRepeat': {
      emit(node.times, ctx);
      const countSlot = slot(ctx, `_rep_${ctx.code.length}`);
      ctx.code.push(Op.STORE, countSlot);
      const loop = ctx.code.length;
      ctx.code.push(Op.LOAD, countSlot);
      const jf = ctx.code.length;
      ctx.code.push(Op.JUMP_IF_FALSE, 0, 0, 0);
      node.body.forEach((s) => emit(s, ctx));
      ctx.code.push(Op.LOAD, countSlot);
      ctx.code.push(Op.CONST, pushConst(ctx, 1));
      ctx.code.push(Op.BIN_OP, BinOp.MINUS);
      ctx.code.push(Op.STORE, countSlot);
      ctx.code.push(Op.JUMP, ...encodeJump(loop));
      patchJump(ctx, jf, ctx.code.length);
      break;
    }
    case 'IRCall':
      node.args.forEach((a) => emit(a, ctx));
      ctx.code.push(Op.CALL, fnIndex(ctx, node.callee));
      break;
    case 'IRFetch': {
      const t = pushConst(ctx, node.target);
      const q = pushConst(ctx, node.qualifier ?? null);
      ctx.code.push(Op.FETCH, t, q);
      break;
    }
    case 'IREnsure':
      emit(node.condition, ctx);
      ctx.code.push(Op.ENSURE);
      break;
    case 'IRSend':
      emit(node.payload, ctx);
      if (node.target) emit(node.target, ctx);
      ctx.code.push(Op.SEND, node.target ? 1 : 0);
      break;
    case 'IRStore':
      emit(node.value, ctx);
      ctx.code.push(Op.STORE_OP, pushConst(ctx, node.target ?? 'default'));
      break;
    case 'IRLiteral':
      ctx.code.push(Op.CONST, pushConst(ctx, node.value));
      break;
    case 'IRIdentifier':
      ctx.code.push(Op.LOAD, slot(ctx, node.name));
      break;
    case 'IRBinary':
      emit(node.left, ctx);
      emit(node.right, ctx);
      ctx.code.push(Op.BIN_OP, binOpFor(node.op));
      break;
    default:
      break;
  }
}

function pushConst(ctx: Ctx, v: any): number {
  const idx = ctx.consts.length;
  ctx.consts.push(v);
  return idx;
}

function slot(ctx: Ctx, name: string): number {
  if (ctx.slots[name] === undefined) {
    ctx.slots[name] = Object.keys(ctx.slots).length;
  }
  return ctx.slots[name];
}

function fnIndex(ctx: Ctx, name: string): number {
  let idx = ctx.fns.findIndex((f) => f.name === name);
  if (idx >= 0) return idx;
  idx = ctx.fns.length;
  ctx.fns.push({ name, offset: 0, arity: 0 });
  return idx;
}

function patchJump(ctx: Ctx, pos: number, target: number) {
  ctx.code.splice(pos + 1, 3, ...encodeJump(target));
}
