import type { Program, Statement, Expression, BinaryOperator } from '../types/ast.js';

export type SemanticIssue = { message: string };

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
]);

type Type =
  | 'number'
  | 'string'
  | 'boolean'
  | 'none'
  | 'unknown';

export function checkProgram(program: Program): SemanticIssue[] {
  const issues: SemanticIssue[] = [];
  const scope = new Map<string, Type>();
  // mark builtins as unknown (treat as present)
  for (const b of BUILTINS) scope.set(b, 'unknown');
  walkStatements(program.body, scope, issues);
  return issues;
}

function walkStatements(stmts: Statement[], scope: Map<string, Type>, issues: SemanticIssue[]) {
  for (const st of stmts) {
    switch (st.kind) {
      case 'ImportStatement':
        // imports introduce their module name into scope
        scope.set(st.source, 'unknown');
        break;
      case 'LetStatement':
        {
          const t = typeExpr(st.value, scope, issues);
          scope.set(st.id.name, t);
        }
        break;
      case 'ReturnStatement':
        if (st.value) typeExpr(st.value, scope, issues);
        break;
      case 'StopStatement':
        typeExpr(st.value, scope, issues);
        break;
      case 'IfStatement': {
        const condType = typeExpr(st.condition, scope, issues);
        if (!isBoolish(condType)) {
          issues.push({ message: 'Condition should be boolean' });
        }
        const thenScope = new Map(scope);
        walkStatements(st.then.statements, thenScope, issues);
        if (st.otherwise) walkStatements(st.otherwise.statements, new Map(scope), issues);
        break;
      }
      case 'ForEachStatement': {
        typeExpr(st.collection, scope, issues);
        const loopScope = new Map(scope);
        loopScope.set(st.item.name, 'unknown');
        walkStatements(st.body.statements, loopScope, issues);
        break;
      }
      case 'RepeatStatement':
        {
          const t = typeExpr(st.times, scope, issues);
          if (t !== 'number' && t !== 'unknown') {
            issues.push({ message: 'repeat times should be a number' });
          }
          walkStatements(st.body.statements, new Map(scope), issues);
        }
        break;
      case 'FunctionDef':
        scope.set(st.name.name, 'unknown');
        walkStatements(st.body.statements, new Map(scope), issues);
        break;
      case 'EventHandler':
        walkStatements(st.body.statements, new Map(scope), issues);
        break;
      case 'ExpressionStatement':
        typeExpr(st.expression, scope, issues);
        break;
      default:
        break;
    }
  }
}

function typeExpr(expr: Expression, scope: Map<string, Type>, issues: SemanticIssue[]): Type {
  switch (expr.kind) {
    case 'Identifier':
      if (!scope.has(expr.name)) {
        issues.push({ message: `Undefined identifier "${expr.name}"` });
        return 'unknown';
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
      return typeBinary(expr.operator, expr.left, expr.right, scope, issues);
    case 'CallExpression':
      typeExpr(expr.callee, scope, issues);
      expr.args.forEach((a) => typeExpr(a, scope, issues));
      return 'unknown';
    case 'FetchExpression':
      if (expr.into) {
        scope.set(expr.into.name, 'unknown');
      }
      return 'unknown';
    case 'SendExpression':
      typeExpr(expr.payload, scope, issues);
      if (expr.target) typeExpr(expr.target, scope, issues);
      return 'unknown';
    case 'StoreExpression':
      typeExpr(expr.value, scope, issues);
      if (expr.target) scope.set(expr.target.name, 'unknown');
      return 'unknown';
    case 'EnsureExpression':
    case 'ValidateExpression':
    case 'ExpectExpression':
      {
        const cond = typeExpr((expr as any).condition, scope, issues);
        if (!isBoolish(cond)) {
          issues.push({ message: `${expr.kind.replace('Expression', '')} expects a boolean condition` });
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
): Type {
  const lt = typeExpr(left, scope, issues);
  const rt = typeExpr(right, scope, issues);
  const numericOps = new Set(['plus', 'minus', 'times', 'divided_by', 'greater_than', 'less_than']);
  const comparisonOps = new Set(['equal_to', 'not_equal_to']);

  if (numericOps.has(op)) {
    if (!isNumericish(lt) || !isNumericish(rt)) {
      issues.push({ message: `Operator ${op} expects numbers` });
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
