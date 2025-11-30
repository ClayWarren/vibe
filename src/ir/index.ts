import type { Program, Statement, Expression } from '../types/ast.js';

type Loc = { line: number; column: number };

export type IRNode =
  | { kind: 'IRProgram'; body: IRNode[]; loc?: Loc }
  | { kind: 'IRLet'; name: string; value: IRNode; loc?: Loc }
  | { kind: 'IRReturn'; value?: IRNode; loc?: Loc }
  | { kind: 'IRStop'; value: IRNode; loc?: Loc }
  | { kind: 'IRIf'; condition: IRNode; then: IRNode[]; otherwise?: IRNode[]; loc?: Loc }
  | { kind: 'IRForEach'; item: string; collection: IRNode; body: IRNode[]; loc?: Loc }
  | { kind: 'IRRepeat'; times: IRNode; body: IRNode[]; loc?: Loc }
  | { kind: 'IRCall'; callee: string; args: IRNode[]; loc?: Loc }
  | { kind: 'IRFetch'; target: string; qualifier?: string; loc?: Loc }
  | { kind: 'IRSend'; payload: IRNode; target?: IRNode; loc?: Loc }
  | { kind: 'IRStore'; value: IRNode; target?: string; loc?: Loc }
  | { kind: 'IREnsure'; op: 'ensure' | 'validate' | 'expect'; condition: IRNode; loc?: Loc }
  | { kind: 'IRLiteral'; value: unknown; loc?: Loc }
  | { kind: 'IRIdentifier'; name: string; loc?: Loc }
  | { kind: 'IRBinary'; op: string; left: IRNode; right: IRNode; loc?: Loc };

export function lowerProgram(ast: Program): IRNode {
  return { kind: 'IRProgram', body: ast.body.map(lowerStatement), loc: (ast as any).loc };
}

function lowerStatement(stmt: Statement): IRNode {
  switch (stmt.kind) {
    case 'LetStatement':
      return { kind: 'IRLet', name: stmt.id.name, value: lowerExpression(stmt.value), loc: (stmt as any).loc };
    case 'ReturnStatement':
      return { kind: 'IRReturn', value: stmt.value ? lowerExpression(stmt.value) : undefined, loc: (stmt as any).loc };
    case 'StopStatement':
      return { kind: 'IRStop', value: lowerExpression(stmt.value), loc: (stmt as any).loc };
    case 'IfStatement':
      return {
        kind: 'IRIf',
        condition: lowerExpression(stmt.condition),
        then: stmt.then.statements.map(lowerStatement),
        otherwise: stmt.otherwise?.statements.map(lowerStatement),
        loc: (stmt as any).loc,
      };
    case 'ForEachStatement':
      return {
        kind: 'IRForEach',
        item: stmt.item.name,
        collection: lowerExpression(stmt.collection),
        body: stmt.body.statements.map(lowerStatement),
        loc: (stmt as any).loc,
      };
    case 'RepeatStatement':
      return {
        kind: 'IRRepeat',
        times: lowerExpression(stmt.times),
        body: stmt.body.statements.map(lowerStatement),
        loc: (stmt as any).loc,
      };
    case 'FunctionDef':
      return {
        kind: 'IRLet',
        name: stmt.name.name,
        value: { kind: 'IRProgram', body: stmt.body.statements.map(lowerStatement) },
        loc: (stmt as any).loc,
      };
    case 'ExpressionStatement':
      return { ...lowerExpression(stmt.expression), loc: (stmt as any).loc } as IRNode;
    case 'ImportStatement':
      return { kind: 'IRLiteral', value: null, loc: (stmt as any).loc };
    case 'EventHandler':
      return {
        kind: 'IRLet',
        name: `on_${stmt.event}`,
        value: { kind: 'IRProgram', body: stmt.body.statements.map(lowerStatement) },
        loc: (stmt as any).loc,
      };
    default:
      throw new Error(`Unhandled statement ${(stmt as Statement).kind}`);
  }
}

function lowerExpression(expr: Expression): IRNode {
  switch (expr.kind) {
    case 'Identifier':
      return { kind: 'IRIdentifier', name: expr.name, loc: (expr as any).loc };
    case 'NumberLiteral':
    case 'StringLiteral':
    case 'BooleanLiteral':
      return { kind: 'IRLiteral', value: (expr as any).value, loc: (expr as any).loc };
    case 'NoneLiteral':
      return { kind: 'IRLiteral', value: null, loc: (expr as any).loc };
    case 'BinaryExpression':
      return {
        kind: 'IRBinary',
        op: expr.operator,
        left: lowerExpression(expr.left),
        right: lowerExpression(expr.right),
        loc: (expr as any).loc,
      };
    case 'CallExpression':
      return { kind: 'IRCall', callee: expr.callee.name, args: expr.args.map(lowerExpression), loc: (expr as any).loc };
    case 'FetchExpression':
      return { kind: 'IRFetch', target: expr.target, qualifier: expr.qualifier, loc: (expr as any).loc };
    case 'SendExpression':
      return {
        kind: 'IRSend',
        payload: lowerExpression(expr.payload),
        target: expr.target ? lowerExpression(expr.target) : undefined,
        loc: (expr as any).loc,
      };
    case 'StoreExpression':
      return {
        kind: 'IRStore',
        value: lowerExpression(expr.value),
        target: expr.target?.name,
        loc: (expr as any).loc,
      };
    case 'EnsureExpression':
      return { kind: 'IREnsure', op: 'ensure', condition: lowerExpression(expr.condition), loc: (expr as any).loc };
    case 'ValidateExpression':
      return { kind: 'IREnsure', op: 'validate', condition: lowerExpression(expr.condition), loc: (expr as any).loc };
    case 'ExpectExpression':
      return { kind: 'IREnsure', op: 'expect', condition: lowerExpression(expr.condition), loc: (expr as any).loc };
    default:
      throw new Error(`Unhandled expression ${(expr as Expression).kind}`);
  }
}
