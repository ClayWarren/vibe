import express from 'express';
import bodyParser from 'body-parser';
import { parse } from '../src/parser/index.ts';
import type { Program, Statement, Expression, BinaryExpression } from '../src/types/ast.ts';
import fs from 'fs';

const app = express();
app.use(bodyParser.json());

const db: Record<string, any[]> = { users: [] };

type Ctx = Record<string, any>;

type Event = { method: string; path: string; handler: Statement[] };

function collectEvents(ast: Program): Event[] {
  const events: Event[] = [];
  for (const stmt of ast.body) {
    if (stmt.kind === 'EventHandler') {
      const parts = stmt.event.split(' ');
      const method = (parts[1] || 'GET').toUpperCase();
      const path = parts.slice(2).join(' ') || '/';
      events.push({ method, path, handler: stmt.body.statements });
    }
  }
  return events;
}

function evalStatements(stmts: Statement[], ctx: Ctx, res: express.Response): boolean {
  for (const st of stmts) {
    switch (st.kind) {
      case 'ReturnStatement': {
        const value = st.value ? evalExpr(st.value, ctx) : undefined;
        res.json(value ?? null);
        return true;
      }
      case 'StopStatement': {
        const value = evalExpr(st.value, ctx);
        res.status(400).json({ error: value });
        return true;
      }
      case 'LetStatement': {
        ctx[st.id.name] = evalExpr(st.value, ctx);
        break;
      }
      case 'IfStatement': {
        const cond = evalExpr(st.condition, ctx);
        if (cond) {
          if (evalStatements(st.then.statements, ctx, res)) return true;
        } else if (st.otherwise) {
          if (evalStatements(st.otherwise.statements, ctx, res)) return true;
        }
        break;
      }
      case 'ForEachStatement': {
        const arr = evalExpr(st.collection, ctx);
        if (Array.isArray(arr)) {
          for (const item of arr) {
            ctx[st.item.name] = item;
            if (evalStatements(st.body.statements, ctx, res)) return true;
          }
        }
        break;
      }
      default: {
        if ((st as any).expression) evalExpr((st as any).expression, ctx);
      }
    }
  }
  return false;
}

function evalExpr(expr: Expression, ctx: Ctx): any {
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
      const ok = evalExpr((expr as any).condition, ctx);
      if (!ok) throw new Error('Expectation failed');
      return ok;
    }
    case 'FetchExpression': {
      const target = expr.target.split(' ')[0];
      return db[target] ?? [];
    }
    default:
      return null;
  }
}

function evalBinary(expr: BinaryExpression, ctx: Ctx): any {
  const left = evalExpr(expr.left, ctx);
  const right = evalExpr(expr.right, ctx);
  switch (expr.operator) {
    case 'plus':
      return left + right;
    case 'minus':
      return left - right;
    case 'times':
      return left * right;
    case 'divided_by':
      return left / right;
    case 'equal_to':
      return left === right;
    case 'not_equal_to':
      return left !== right;
    case 'greater_than':
      return left > right;
    case 'less_than':
      return left < right;
    default:
      return false;
  }
}

function bootstrap(vclPath: string) {
  const source = fs.readFileSync(vclPath, 'utf8');
  const ast = parse(source);
  const events = collectEvents(ast);
  for (const ev of events) {
    (app as any)[ev.method.toLowerCase()](ev.path, (req, res) => {
      const ctx: Ctx = {
        body: req.body,
        params: req.params,
        query: req.query,
        users: db.users,
      };
      try {
        const handled = evalStatements(ev.handler, ctx, res);
        if (!handled) res.json(null);
      } catch (err) {
        res.status(400).json({ error: (err as Error).message });
      }
    });
  }
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`VCL demo server running on :${port}`));
}

bootstrap(process.argv[2] || 'examples/webapp.vcl');
