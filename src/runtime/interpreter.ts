import type { Program, Statement, Expression, BinaryExpression } from '../types/ast.js';

export type EvalResult = { status: number; body: any };
export type EvalContext = {
  fetch?: (target: string, qualifier?: string) => Promise<any> | any;
  send?: (payload: any, target?: any) => Promise<void> | void;
  store?: (value: any, target?: string) => Promise<void> | void;
  data?: Record<string, any>;
  [key: string]: any;
};

export function collectEvents(ast: Program) {
  return ast.body.filter((s) => s.kind === 'EventHandler') as any[];
}

export async function runEvent(ast: Program, eventName: string, ctx: EvalContext): Promise<EvalResult> {
  const handler = collectEvents(ast).find((h) => h.event === eventName);
  if (!handler) return { status: 404, body: 'not found' };
  try {
    const handled = await evalStatements(handler.body.statements, { ...ctx });
    if (handled.done) return handled.result;
    return { status: 200, body: null };
  } catch (err) {
    return { status: 400, body: { error: (err as Error).message } };
  }
}

async function evalStatements(
  stmts: Statement[],
  ctx: EvalContext
): Promise<{ done: true; result: EvalResult } | { done: false }> {
  for (const st of stmts) {
    switch (st.kind) {
      case 'ReturnStatement': {
        const value = st.value ? await evalExpr(st.value, ctx) : undefined;
        return { done: true, result: { status: 200, body: value ?? null } };
      }
      case 'StopStatement': {
        const value = await evalExpr(st.value, ctx);
        return { done: true, result: { status: 400, body: value } };
      }
      case 'LetStatement':
        ctx[st.id.name] = await evalExpr(st.value, ctx);
        break;
      case 'IfStatement': {
        const cond = await evalExpr(st.condition, ctx);
        const branch = cond ? st.then : st.otherwise;
        if (branch) {
          const inner = await evalStatements(branch.statements, ctx);
          if (inner.done) return inner;
        }
        break;
      }
      case 'ForEachStatement': {
        const arr = await evalExpr(st.collection, ctx);
        if (Array.isArray(arr)) {
          for (const item of arr) {
            ctx[st.item.name] = item;
            const inner = await evalStatements(st.body.statements, ctx);
            if (inner.done) return inner;
          }
        }
        break;
      }
      case 'RepeatStatement': {
        const times = Number((await evalExpr(st.times, ctx)) ?? 0);
        for (let i = 0; i < times; i++) {
          const inner = await evalStatements(st.body.statements, ctx);
          if (inner.done) return inner;
        }
        break;
      }
      default: {
        const exp = (st as any).expression as Expression | undefined;
        if (exp) await evalExpr(exp, ctx);
      }
    }
  }
  return { done: false };
}

async function evalExpr(expr: Expression, ctx: EvalContext): Promise<any> {
  switch (expr.kind) {
    case 'Identifier':
      return ctx[expr.name];
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
      if (ctx.fetch) return ctx.fetch(expr.target, expr.qualifier);
      return (ctx.data && ctx.data[expr.target]) || [];
    }
    case 'SendExpression': {
      const payload = await evalExpr(expr.payload, ctx);
      const target = expr.target ? await evalExpr(expr.target, ctx) : undefined;
      if (ctx.send) await ctx.send(payload, target);
      return undefined;
    }
    case 'StoreExpression': {
      const value = await evalExpr(expr.value, ctx);
      const key = expr.target?.name || expr.target || 'default';
      if (ctx.store) await ctx.store(value, key);
      else if (ctx.data) {
        ctx.data[key] = ctx.data[key] || [];
        ctx.data[key].push(value);
      }
      return undefined;
    }
    case 'CallExpression': {
      const callee = (expr as any).callee.name;
      const args = await Promise.all((expr as any).args.map((a: Expression) => evalExpr(a, ctx)));
      if (typeof ctx[callee] === 'function') return (ctx as any)[callee](...args);
      return undefined;
    }
    default:
      return undefined;
  }
}

async function evalBinary(expr: BinaryExpression, ctx: EvalContext): Promise<any> {
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
