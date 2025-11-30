import type { IRNode } from '../ir/index.js';

export function emitTypeScript(node: IRNode, indent = 0): string {
  const pad = '  '.repeat(indent);
  switch (node.kind) {
    case 'IRProgram':
      return node.body.map((n) => emitTypeScript(n, indent)).join('\n');
    case 'IRLet':
      return `${pad}const ${node.name} = ${emitTypeScript(node.value, indent)};`;
    case 'IRReturn':
      return `${pad}return ${node.value ? emitTypeScript(node.value, indent) : ''};`;
    case 'IRStop':
      return `${pad}throw new Error(${emitTypeScript(node.value, indent)});`;
    case 'IRIf': {
      const thenPart = node.then.map((n) => emitTypeScript(n, indent + 1)).join('\n');
      const elsePart = node.otherwise?.map((n) => emitTypeScript(n, indent + 1)).join('\n');
      const elseBlock = elsePart ? `\n${pad}} else {\n${elsePart}\n${pad}}` : '';
      return `${pad}if (${emitTypeScript(node.condition, indent)}) {\n${thenPart}\n${pad}}${elseBlock}`;
    }
    case 'IRForEach': {
      const body = node.body.map((n) => emitTypeScript(n, indent + 1)).join('\n');
      return `${pad}for (const ${node.item} of ${emitTypeScript(node.collection, indent)}) {\n${body}\n${pad}}`;
    }
    case 'IRRepeat': {
      const body = node.body.map((n) => emitTypeScript(n, indent + 1)).join('\n');
      const times = emitTypeScript(node.times, indent);
      return `${pad}for (let i = 0; i < ${times}; i++) {\n${body}\n${pad}}`;
    }
    case 'IRCall':
      return `${pad}${node.callee}(${node.args.map((a) => emitTypeScript(a, indent)).join(', ')})`;
    case 'IRFetch':
      return `${pad}await runtime.fetch(${JSON.stringify(node.target)}, ${node.qualifier ? JSON.stringify(node.qualifier) : 'undefined'})`;
    case 'IREnsure':
      return `${pad}runtime.${node.op}(${emitTypeScript(node.condition, indent)});`;
    case 'IRLiteral':
      return typeof node.value === 'string' ? `${JSON.stringify(node.value)}` : String(node.value);
    case 'IRIdentifier':
      return node.name;
    case 'IRBinary':
      return `${emitTypeScript(node.left, indent)} ${tsOp(node.op)} ${emitTypeScript(node.right, indent)}`;
    /* c8 ignore next */
    default:
      throw new Error(`Unhandled IR node ${(node as IRNode).kind}`);
  }
}

function tsOp(op: string): string {
  switch (op) {
    case 'plus':
      return '+';
    case 'minus':
      return '-';
    case 'times':
      return '*';
    case 'divided_by':
      return '/';
    case 'equal_to':
      return '===';
    case 'not_equal_to':
      return '!==';
    case 'greater_than':
      return '>';
    case 'less_than':
      return '<';
    /* c8 ignore next */
    default:
      return op;
  }
}
