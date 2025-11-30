import type { Program, Statement, Expression } from '../types/ast.js';

export function emitVcl(program: Program): string {
  return program.body.map((s) => emitStmt(s, 0)).join('\n');
}

function emitStmt(stmt: Statement, indent: number): string {
  const pad = '  '.repeat(indent);
  switch (stmt.kind) {
    case 'LetStatement':
      return `${pad}let ${stmt.id.name} = ${emitExpr(stmt.value)}.`;
    case 'ReturnStatement':
      return `${pad}return ${stmt.value ? emitExpr(stmt.value) : 'none'}.`;
    case 'StopStatement':
      return `${pad}stop with ${emitExpr(stmt.value)}.`;
    case 'ExpressionStatement':
      return `${pad}${emitExpr(stmt.expression)}.`;
    case 'FunctionDef':
      return `${pad}define ${stmt.name.name}:\n${emitBlock(stmt.body, indent + 1)}\n${pad}end.`;
    case 'EventHandler':
      return `${pad}when ${stmt.event}:\n${emitBlock(stmt.body, indent + 1)}\n${pad}end.`;
    case 'IfStatement': {
      const elsePart = stmt.otherwise ? `\n${pad}else:\n${emitBlock(stmt.otherwise, indent + 1)}` : '';
      return `${pad}if ${emitExpr(stmt.condition)}:\n${emitBlock(stmt.then, indent + 1)}${elsePart}\n${pad}end.`;
    }
    case 'ForEachStatement':
      return `${pad}for each ${stmt.item.name} in ${emitExpr(stmt.collection)}:\n${emitBlock(stmt.body, indent + 1)}\n${pad}end.`;
    case 'RepeatStatement':
      return `${pad}repeat ${emitExpr(stmt.times)} times:\n${emitBlock(stmt.body, indent + 1)}\n${pad}end.`;
    default:
      return `${pad}# unsupported statement`;
  }
}

function emitBlock(block: any, indent: number): string {
  return block.statements.map((s: Statement) => emitStmt(s, indent)).join('\n');
}

function emitExpr(expr: Expression): string {
  switch (expr.kind) {
    case 'Identifier':
      return expr.name;
    case 'NumberLiteral':
      return String((expr as any).value);
    case 'StringLiteral':
      return JSON.stringify((expr as any).value);
    case 'BooleanLiteral':
      return expr.value ? 'true' : 'false';
    case 'NoneLiteral':
      return 'none';
    case 'BinaryExpression':
      return `${emitExpr(expr.left)} ${expr.operator} ${emitExpr(expr.right)}`;
    case 'FetchExpression': {
      const qualifier = expr.qualifier ? ` where ${expr.qualifier}` : '';
      const into = expr.into ? ` into ${expr.into.name}` : '';
      return `fetch ${expr.target}${qualifier}${into}`;
    }
    case 'SendExpression':
      return `send ${emitExpr(expr.payload)}${expr.target ? ` to ${emitExpr(expr.target)}` : ''}`;
    case 'StoreExpression':
      return `store ${emitExpr(expr.value)}${expr.target ? ` into ${expr.target.name}` : ''}`;
    case 'CallExpression':
      return `call ${expr.callee.name}${expr.args.length ? ` with ${expr.args.map(emitExpr).join(', ')}` : ''}`;
    case 'EnsureExpression':
    case 'ValidateExpression':
    case 'ExpectExpression':
      return `${expr.kind.replace('Expression', '').toLowerCase()} ${emitExpr((expr as any).condition)}`;
    default:
      return 'unknown';
  }
}
