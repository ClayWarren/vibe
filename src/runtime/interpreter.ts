import type { Program, Statement, Expression, BinaryExpression, FunctionDef } from '../types/ast.js';

export type EvalResult = { status: number; body: any };

type Frame = Record<string, any>;

type EvalCtx = {
  frames: Frame[];
  functions: Record<string, FunctionDef>;
  runtime: {
    fetch?: (target: string, qualifier?: string) => Promise<any> | any;
    send?: (payload: any, target?: any) => Promise<void> | void;
    store?: (value: any, target?: string) => Promise<void> | void;
    log?: (value: any) => void;
  };
  data?: Record<string, any>;
};

export function collectEvents(ast: Program) {
  return ast.body.filter((s) => s.kind === 'EventHandler') as any[];
}

export function collectFunctions(ast: Program) {
  const map: Record<string, FunctionDef> = {};
  ast.body.forEach((s: any) => {
    if (s.kind === 'FunctionDef') map[s.name.name] = s as FunctionDef;
  });
  return map;
}

export async function runEvent(ast: Program, eventName: string, ctx: Partial<EvalCtx> & any): Promise<EvalResult> {
  const handler = collectEvents(ast).find((h) => h.event === eventName);
  if (!handler) return { status: 404, body: 'not found' };
  const evalCtx: EvalCtx = {
    frames: [ctx],
    functions: collectFunctions(ast),
    runtime: ctx.runtime || { fetch: ctx.fetch, send: ctx.send, store: ctx.store, log: ctx.log },
    data: ctx.data || {},
  };
  try {
    const handled = await evalStatements(handler.body.statements, evalCtx, 'event');
    if (handled.kind === 'return') return { status: 200, body: handled.value ?? null };
    if (handled.kind === 'stop') return { status: 400, body: handled.value };
    return { status: 200, body: null };
  } catch (err) {
    return { status: 400, body: { error: (err as Error).message } };
  }
}

type StepResult =
  | { kind: 'none' }
  | { kind: 'return'; value: any }
  | { kind: 'stop'; value: any };

async function evalStatements(stmts: Statement[], ctx: EvalCtx, mode: 'event' | 'func'): Promise<StepResult> {
  for (const st of stmts) {
    switch (st.kind) {
      case 'ReturnStatement': {
        const value = st.value ? await evalExpr(st.value, ctx) : undefined;
        return { kind: 'return', value };
      }
      case 'StopStatement': {
        const value = await evalExpr(st.value, ctx);
        return { kind: 'stop', value };
      }
      case 'LetStatement':
        setVar(ctx, st.id.name, await evalExpr(st.value, ctx));
        break;
      case 'IfStatement': {
        const cond = await evalExpr(st.condition, ctx);
        const branch = cond ? st.then : st.otherwise;
        if (branch) {
          const inner = await evalStatements(branch.statements, ctx, mode);
          if (inner.kind !== 'none') return inner;
        }
        break;
      }
      case 'ForEachStatement': {
        const arr = await evalExpr(st.collection, ctx);
        if (Array.isArray(arr)) {
          for (const item of arr) {
            setVar(ctx, st.item.name, item);
            const inner = await evalStatements(st.body.statements, ctx, mode);
            if (inner.kind !== 'none') {
              return inner;
            }
          }
        }
        break;
      }
      case 'RepeatStatement': {
        const times = Number((await evalExpr(st.times, ctx)) ?? 0);
        for (let i = 0; i < times; i++) {
          const inner = await evalStatements(st.body.statements, ctx, mode);
          if (inner.kind !== 'none') return inner;
        }
        break;
      }
      case 'FunctionDef':
        // already collected
        break;
      default: {
        const exp = (st as any).expression as Expression | undefined;
        if (exp) await evalExpr(exp, ctx);
      }
    }
  }
  return { kind: 'none' };
}

async function evalExpr(expr: Expression, ctx: EvalCtx): Promise<any> {
  switch (expr.kind) {
    case 'Identifier':
      return getVar(ctx, expr.name);
    case 'NumberLiteral':
    case 'StringLiteral':
      return (expr as any).value;
    case 'BooleanLiteral':
      return expr.value;
    case 'NoneLiteral':
      return null;
    case 'BinaryExpression':
      return evalBinary(expr, ctx);
    case 'EnsureExpression':
    case 'ValidateExpression':
    case 'ExpectExpression': {
      const ok = await evalExpr((expr as any).condition, ctx);
      if (!ok) throw new Error('Expectation failed');
      return ok;
    }
    case 'FetchExpression': {
      if (ctx.runtime.fetch) return ctx.runtime.fetch(expr.target, expr.qualifier);
      return (ctx.data && ctx.data[expr.target]) || [];
    }
    case 'SendExpression': {
      const payload = await evalExpr(expr.payload, ctx);
      const target = expr.target ? await evalExpr(expr.target, ctx) : undefined;
      if (ctx.runtime.send) await ctx.runtime.send(payload, target);
      return undefined;
    }
    case 'StoreExpression': {
      const value = await evalExpr(expr.value, ctx);
      const key = expr.target?.name || (expr.target as any) || 'default';
      if (ctx.runtime.store) await ctx.runtime.store(value, key);
      else if (ctx.data) {
        ctx.data[key] = ctx.data[key] || [];
        (ctx.data[key] as any[]).push(value);
      }
      return undefined;
    }
    case 'CallExpression': {
      const callee = (expr as any).callee.name;
      const args = await Promise.all((expr as any).args.map((a: Expression) => evalExpr(a, ctx)));
      // user-defined functions
      if (ctx.functions[callee]) {
        return evalFunction(ctx.functions[callee], args, ctx);
      }
      const fn = getVar(ctx, callee);
      if (typeof fn === 'function') return fn(...args);
      return undefined;
    }
    default:
      return undefined;
  }
}

async function evalFunction(fn: FunctionDef, args: any[], ctx: EvalCtx) {
  pushFrame(ctx);
  if (fn.params) {
    fn.params.forEach((p, i) => setVar(ctx, p.name, args[i]));
  }
  const res = await evalStatements(fn.body.statements, ctx, 'func');
  popFrame(ctx);
  if (res.kind === 'return') return res.value;
  if (res.kind === 'stop') throw new Error(res.value ?? 'stopped');
  return undefined;
}

async function evalBinary(expr: BinaryExpression, ctx: EvalCtx): Promise<any> {
  const [l, r] = await Promise.all([evalExpr(expr.left, ctx), evalExpr(expr.right, ctx)]);
  switch (expr.operator) {
    case 'plus':
      return l + r;
    case 'minus':
      return l - r;
    case 'times':
      return l * r;
    case 'divided_by':
      return l / r;
    case 'equal_to':
      return l === r;
    case 'not_equal_to':
      return l !== r;
    case 'greater_than':
      return l > r;
    case 'less_than':
      return l < r;
    default:
      return undefined;
  }
}

function pushFrame(ctx: EvalCtx) {
  ctx.frames.unshift({});
}

function popFrame(ctx: EvalCtx) {
  ctx.frames.shift();
}

function setVar(ctx: EvalCtx, name: string, value: any) {
  ctx.frames[0][name] = value;
}

function getVar(ctx: EvalCtx, name: string): any {
  for (const frame of ctx.frames) {
    if (name in frame) return frame[name];
  }
  if (ctx.data && name in ctx.data) return ctx.data[name];
  if ((ctx.runtime as any)[name] !== undefined) return (ctx.runtime as any)[name];
  return undefined;
}
