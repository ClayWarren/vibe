import type { IRNode } from '../ir/index.js';

export function emitRust(node: IRNode, indent = 0): string {
  const pad = '  '.repeat(indent);
  switch (node.kind) {
    case 'IRProgram':
      return node.body.map((n) => emitRust(n, indent)).join('\n');
    case 'IRLet':
      return `${pad}let ${node.name} = ${emitRust(node.value, indent)};`;
    case 'IRReturn':
      return `${pad}return ${node.value ? emitRust(node.value, indent) : '()'};`;
    case 'IRStop':
      return `${pad}return Err(anyhow::anyhow!(${emitRust(node.value, indent)}));`;
    case 'IRIf': {
      const thenPart = node.then.map((n) => emitRust(n, indent + 1)).join('\n');
      const elsePart = node.otherwise?.map((n) => emitRust(n, indent + 1)).join('\n');
      const elseBlock = elsePart ? `\n${pad}} else {\n${elsePart}\n${pad}}` : '';
      return `${pad}if ${emitRust(node.condition, indent)} {\n${thenPart}\n${pad}}${elseBlock}`;
    }
    case 'IRForEach': {
      const body = node.body.map((n) => emitRust(n, indent + 1)).join('\n');
      return `${pad}for ${node.item} in ${emitRust(node.collection, indent)} {\n${body}\n${pad}}`;
    }
    case 'IRRepeat': {
      const body = node.body.map((n) => emitRust(n, indent + 1)).join('\n');
      const times = emitRust(node.times, indent);
      return `${pad}for _i in 0..${times} {\n${body}\n${pad}}`;
    }
    case 'IRCall':
      return `${pad}${node.callee}(${node.args.map((a) => emitRust(a, indent)).join(', ')})`;
    case 'IRFetch':
      return `${pad}runtime::fetch(${JSON.stringify(node.target)}, ${node.qualifier ? JSON.stringify(node.qualifier) : 'None'})`;
    case 'IREnsure':
      return `${pad}runtime::${node.op}(${emitRust(node.condition, indent)});`;
    case 'IRLiteral':
      if (typeof node.value === 'string') return `${JSON.stringify(node.value)}.to_string()`;
      if (node.value === null) return 'None';
      if (typeof node.value === 'boolean') return node.value ? 'true' : 'false';
      return String(node.value);
    case 'IRIdentifier':
      return node.name;
    case 'IRBinary':
      return `${emitRust(node.left, indent)} ${rsOp(node.op)} ${emitRust(node.right, indent)}`;
    default:
      throw new Error(`Unhandled IR node ${(node as IRNode).kind}`);
  }
}

function rsOp(op: string): string {
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
      return '==';
    case 'not_equal_to':
      return '!=';
    case 'greater_than':
      return '>';
    case 'less_than':
      return '<';
    default:
      return op;
  }
}
