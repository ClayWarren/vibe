import type { Program, Statement, Expression } from '../types/ast.js';

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

export function checkProgram(program: Program): SemanticIssue[] {
  const issues: SemanticIssue[] = [];
  const scope = new Set<string>();
  const imports = new Set<string>();
  walkStatements(program.body, scope, issues);
  return issues;
}

function walkStatements(stmts: Statement[], scope: Set<string>, issues: SemanticIssue[]) {
  for (const st of stmts) {
    switch (st.kind) {
      case 'ImportStatement':
        // imports introduce their module name into scope
        scope.add(st.source);
        break;
      case 'LetStatement':
        walkExpr(st.value, scope, issues);
        scope.add(st.id.name);
        break;
      case 'ReturnStatement':
        if (st.value) walkExpr(st.value, scope, issues);
        break;
      case 'StopStatement':
        walkExpr(st.value, scope, issues);
        break;
      case 'IfStatement': {
        walkExpr(st.condition, scope, issues);
        const thenScope = new Set(scope);
        walkStatements(st.then.statements, thenScope, issues);
        if (st.otherwise) walkStatements(st.otherwise.statements, new Set(scope), issues);
        break;
      }
      case 'ForEachStatement': {
        walkExpr(st.collection, scope, issues);
        const loopScope = new Set(scope);
        loopScope.add(st.item.name);
        walkStatements(st.body.statements, loopScope, issues);
        break;
      }
      case 'RepeatStatement':
        walkExpr(st.times, scope, issues);
        walkStatements(st.body.statements, new Set(scope), issues);
        break;
      case 'FunctionDef':
        scope.add(st.name.name);
        walkStatements(st.body.statements, new Set(scope), issues);
        break;
      case 'EventHandler':
        walkStatements(st.body.statements, new Set(scope), issues);
        break;
      case 'ExpressionStatement':
        walkExpr(st.expression, scope, issues);
        break;
      default:
        break;
    }
  }
}

function walkExpr(expr: Expression, scope: Set<string>, issues: SemanticIssue[]) {
  switch (expr.kind) {
    case 'Identifier':
      if (!scope.has(expr.name) && !BUILTINS.has(expr.name)) {
        issues.push({ message: `Undefined identifier "${expr.name}"` });
      }
      break;
    case 'BinaryExpression':
      walkExpr(expr.left, scope, issues);
      walkExpr(expr.right, scope, issues);
      break;
    case 'CallExpression':
      walkExpr(expr.callee, scope, issues);
      expr.args.forEach((a) => walkExpr(a, scope, issues));
      break;
    case 'FetchExpression':
      if (expr.into) {
        scope.add(expr.into.name);
      }
      break;
    case 'SendExpression':
      walkExpr(expr.payload, scope, issues);
      if (expr.target) walkExpr(expr.target, scope, issues);
      break;
    case 'StoreExpression':
      walkExpr(expr.value, scope, issues);
      if (expr.target) scope.add(expr.target.name);
      break;
    case 'EnsureExpression':
    case 'ValidateExpression':
    case 'ExpectExpression':
      walkExpr((expr as any).condition, scope, issues);
      break;
    default:
      break;
  }
}
