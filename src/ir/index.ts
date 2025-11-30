import type { Program, Statement, Expression } from '../types/ast.js';

export type IRNode =
  | { kind: 'IRProgram'; body: IRNode[] }
  | { kind: 'IRLet'; name: string; value: IRNode }
  | { kind: 'IRReturn'; value?: IRNode }
  | { kind: 'IRStop'; value: IRNode }
  | { kind: 'IRIf'; condition: IRNode; then: IRNode[]; otherwise?: IRNode[] }
  | { kind: 'IRForEach'; item: string; collection: IRNode; body: IRNode[] }
  | { kind: 'IRRepeat'; times: IRNode; body: IRNode[] }
  | { kind: 'IRCall'; callee: string; args: IRNode[] }
  | { kind: 'IRFetch'; target: string; qualifier?: string }
  | { kind: 'IRSend'; payload: IRNode; target?: IRNode }
  | { kind: 'IRStore'; value: IRNode; target?: string }
  | { kind: 'IREnsure'; op: 'ensure' | 'validate' | 'expect'; condition: IRNode }
  | { kind: 'IRLiteral'; value: unknown }
  | { kind: 'IRIdentifier'; name: string }
  | { kind: 'IRBinary'; op: string; left: IRNode; right: IRNode };

export function lowerProgram(ast: Program): IRNode {
  return { kind: 'IRProgram', body: ast.body.map(lowerStatement) };
}

function lowerStatement(stmt: Statement): IRNode {
  switch (stmt.kind) {
    case 'LetStatement':
      return { kind: 'IRLet', name: stmt.id.name, value: lowerExpression(stmt.value) };
    case 'ReturnStatement':
      return { kind: 'IRReturn', value: stmt.value ? lowerExpression(stmt.value) : undefined };
    case 'StopStatement':
      return { kind: 'IRStop', value: lowerExpression(stmt.value) };
    case 'IfStatement':
      return {
        kind: 'IRIf',
        condition: lowerExpression(stmt.condition),
        then: stmt.then.statements.map(lowerStatement),
        otherwise: stmt.otherwise?.statements.map(lowerStatement),
      };
    case 'ForEachStatement':
      return {
        kind: 'IRForEach',
        item: stmt.item.name,
        collection: lowerExpression(stmt.collection),
        body: stmt.body.statements.map(lowerStatement),
      };
    case 'RepeatStatement':
      return {
        kind: 'IRRepeat',
        times: lowerExpression(stmt.times),
        body: stmt.body.statements.map(lowerStatement),
      };
    case 'FunctionDef':
      return {
        kind: 'IRLet',
        name: stmt.name.name,
        value: { kind: 'IRProgram', body: stmt.body.statements.map(lowerStatement) },
      };
    case 'ExpressionStatement':
      return lowerExpression(stmt.expression);
    case 'EventHandler':
      return {
        kind: 'IRLet',
        name: `on_${stmt.event}`,
        value: { kind: 'IRProgram', body: stmt.body.statements.map(lowerStatement) },
      };
    default:
      throw new Error(`Unhandled statement ${(stmt as Statement).kind}`);
  }
}

function lowerExpression(expr: Expression): IRNode {
  switch (expr.kind) {
    case 'Identifier':
      return { kind: 'IRIdentifier', name: expr.name };
    case 'NumberLiteral':
    case 'StringLiteral':
    case 'BooleanLiteral':
      return { kind: 'IRLiteral', value: (expr as any).value };
    case 'NoneLiteral':
      return { kind: 'IRLiteral', value: null };
    case 'BinaryExpression':
      return {
        kind: 'IRBinary',
        op: expr.operator,
        left: lowerExpression(expr.left),
        right: lowerExpression(expr.right),
      };
    case 'CallExpression':
      return { kind: 'IRCall', callee: expr.callee.name, args: expr.args.map(lowerExpression) };
    case 'FetchExpression':
      return { kind: 'IRFetch', target: expr.target, qualifier: expr.qualifier };
    case 'SendExpression':
      return {
        kind: 'IRSend',
        payload: lowerExpression(expr.payload),
        target: expr.target ? lowerExpression(expr.target) : undefined,
      };
    case 'StoreExpression':
      return {
        kind: 'IRStore',
        value: lowerExpression(expr.value),
        target: expr.target?.name,
      };
    case 'EnsureExpression':
      return { kind: 'IREnsure', op: 'ensure', condition: lowerExpression(expr.condition) };
    case 'ValidateExpression':
      return { kind: 'IREnsure', op: 'validate', condition: lowerExpression(expr.condition) };
    case 'ExpectExpression':
      return { kind: 'IREnsure', op: 'expect', condition: lowerExpression(expr.condition) };
    default:
      throw new Error(`Unhandled expression ${(expr as Expression).kind}`);
  }
}
