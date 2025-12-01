import type { Program, Statement, Expression, BinaryOperator } from '../types/ast.js';

export type SemanticIssue = { message: string; severity: Severity };

const BUILTINS = new Set([
  'body',
  'query',
  'params',
  'data',
  'users',
  'items',
  'runtime',
  'target',
  'send',
  'store',
  'fetch',
  'log',
  // common handler args used in examples/tests
  'user_id',
  'cart_items',
  'items',
]);

type Type =
  | 'number'
  | 'string'
  | 'boolean'
  | 'none'
  | 'record'
  | 'unknown';

type Severity = 'warning' | 'error';

export function checkProgram(program: Program, opts: { strict?: boolean } = {}): SemanticIssue[] {
  const issues: SemanticIssue[] = [];
  const scope = new Map<string, Type>();
  // mark builtins as unknown (treat as present)
  for (const b of BUILTINS) scope.set(b, 'unknown');
  walkStatements(program.body, scope, issues, opts);
  return issues;
}

function walkStatements(stmts: Statement[], scope: Map<string, Type>, issues: SemanticIssue[], opts: { strict?: boolean }) {
  for (const st of stmts) {
    switch (st.kind) {
      case 'ImportStatement':
        // imports introduce their module name into scope
        scope.set(st.source, 'unknown');
        break;
      case 'LetStatement':
        {
          const t = typeExpr(st.value, scope, issues, opts);
          scope.set(st.id.name, t);
        }
        break;
      case 'ReturnStatement':
        if (st.value) typeExpr(st.value, scope, issues, opts);
        break;
      case 'StopStatement':
        typeExpr(st.value, scope, issues, opts);
        break;
      case 'IfStatement': {
        const condType = typeExpr(st.condition, scope, issues, opts);
        if (!isBoolish(condType)) {
          issues.push({ message: 'Condition should be boolean', severity: opts.strict ? 'error' : 'warning' });
        }
        const thenScope = new Map(scope);
        walkStatements(st.then.statements, thenScope, issues, opts);
        if (st.otherwise) walkStatements(st.otherwise.statements, new Map(scope), issues, opts);
        break;
      }
      case 'ForEachStatement': {
        typeExpr(st.collection, scope, issues, opts);
        const loopScope = new Map(scope);
        loopScope.set(st.item.name, 'unknown');
        walkStatements(st.body.statements, loopScope, issues, opts);
        break;
      }
      case 'RepeatStatement':
        {
          const t = typeExpr(st.times, scope, issues, opts);
          if (t !== 'number' && t !== 'unknown') {
            issues.push({ message: 'repeat times should be a number', severity: opts.strict ? 'error' : 'warning' });
          }
          walkStatements(st.body.statements, new Map(scope), issues, opts);
        }
        break;
      case 'FunctionDef':
        scope.set(st.name.name, 'unknown');
        walkStatements(st.body.statements, new Map(scope), issues, opts);
        break;
      case 'EventHandler':
        walkStatements(st.body.statements, new Map(scope), issues, opts);
        break;
      case 'ExpressionStatement':
        typeExpr(st.expression, scope, issues, opts);
        break;
      default:
        break;
    }
  }
}

function typeExpr(expr: Expression, scope: Map<string, Type>, issues: SemanticIssue[], opts: { strict?: boolean }): Type {
  switch (expr.kind) {
    case 'Identifier':
      if (!scope.has(expr.name) && opts.strict) {
        issues.push({ message: `Undefined identifier "${expr.name}"`, severity: 'error' });
      }
      return scope.get(expr.name) ?? 'unknown';
    case 'NumberLiteral':
      return 'number';
    case 'StringLiteral':
      return 'string';
    case 'BooleanLiteral':
      return 'boolean';
    case 'NoneLiteral':
      return 'none';
    case 'BinaryExpression':
      return typeBinary(expr.operator, expr.left, expr.right, scope, issues, opts);
    case 'CallExpression':
      typeExpr(expr.callee, scope, issues, opts);
      expr.args.forEach((a) => typeExpr(a, scope, issues, opts));
      return 'unknown';
    case 'FetchExpression':
      if (expr.into) {
        scope.set(expr.into.name, 'unknown');
      }
      // Basic shape check
      if (expr.qualifier && typeof expr.qualifier !== 'string') {
        issues.push({ message: 'fetch qualifier should be a string', severity: opts.strict ? 'error' : 'warning' });
      }
      return 'unknown';
    case 'SendExpression':
      {
        const t = typeExpr(expr.payload, scope, issues, opts);
        if (t === 'none') {
          issues.push({ message: 'send payload should not be none', severity: opts.strict ? 'error' : 'warning' });
        }
        if (expr.target) {
          const tt = typeExpr(expr.target, scope, issues, opts);
          if (!isStringish(tt)) {
            issues.push({ message: 'send target should be string/unknown', severity: opts.strict ? 'error' : 'warning' });
          }
        }
      }
      return 'unknown';
    case 'StoreExpression':
      {
        const t = typeExpr(expr.value, scope, issues, opts);
        if (t === 'none') {
          issues.push({ message: 'store value should not be none', severity: opts.strict ? 'error' : 'warning' });
        }
      }
      if (expr.target) scope.set(expr.target.name, 'unknown');
      return 'unknown';
    case 'EnsureExpression':
    case 'ValidateExpression':
    case 'ExpectExpression':
      {
        const cond = typeExpr((expr as any).condition, scope, issues, opts);
        if (!isBoolish(cond)) {
          issues.push({
            message: `${expr.kind.replace('Expression', '')} expects a boolean condition`,
            severity: opts.strict ? 'error' : 'warning',
          });
        }
      }
      return 'unknown';
    default:
      return 'unknown';
  }
}

function typeBinary(
  op: BinaryOperator,
  left: Expression,
  right: Expression,
  scope: Map<string, Type>,
  issues: SemanticIssue[],
  opts: { strict?: boolean },
): Type {
  const lt = typeExpr(left, scope, issues, opts);
  const rt = typeExpr(right, scope, issues, opts);
  const numericOps = new Set(['plus', 'minus', 'times', 'divided_by', 'greater_than', 'less_than']);
  const comparisonOps = new Set(['equal_to', 'not_equal_to']);

  if (numericOps.has(op)) {
    if (!isNumericish(lt) || !isNumericish(rt)) {
      issues.push({ message: `Operator ${op} expects numbers`, severity: opts.strict ? 'error' : 'warning' });
    }
    return op === 'greater_than' || op === 'less_than' ? 'boolean' : 'number';
  }

  if (comparisonOps.has(op)) {
    return 'boolean';
  }

  return 'unknown';
}

function isNumericish(t: Type): boolean {
  return t === 'number' || t === 'unknown';
}

function isBoolish(t: Type): boolean {
  return t === 'boolean' || t === 'unknown';
}

function isStringish(t: Type): boolean {
  return t === 'string' || t === 'unknown';
}
