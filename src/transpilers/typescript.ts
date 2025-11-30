import type { IRNode } from '../ir/index.js';
import { tsRuntimeImport } from './runtime-import.js';

type EmitOptions = { withMap?: boolean };
type MapEntry = { out: number; src?: { line: number; column: number } };

export function emitTypeScript(
  node: IRNode,
  options: EmitOptions = {},
  indent = 0,
  state: { line: number; map: MapEntry[] } = { line: 1, map: [] }
): { code: string; map: MapEntry[] } {
  const body = emitNode(node, indent, state, options.withMap === true);
  const header = tsRuntimeImport();
  return { code: `${header}\n${body}`, map: state.map };
}

// Backward-compat helper
export function emitTypeScriptLegacy(node: IRNode): string {
  return emitTypeScript(node).code;
}

function emitNode(
  node: IRNode,
  indent: number,
  state: { line: number; map: MapEntry[] },
  track: boolean
): string {
  const pad = '  '.repeat(indent);
  switch (node.kind) {
    case 'IRProgram':
      return node.body.map((n) => emitNode(n, indent, state, track)).join('\n');
    case 'IRLet':
      map(state, node);
      return lineify(state, `${pad}const ${node.name} = ${emitNode(node.value, indent, state, track)};`);
    case 'IRReturn':
      map(state, node);
      return lineify(state, `${pad}return ${node.value ? emitNode(node.value, indent, state, track) : ''};`);
    case 'IRStop':
      map(state, node);
      return lineify(state, `${pad}throw new Error(${emitNode(node.value, indent, state, track)});`);
    case 'IRIf': {
      map(state, node);
      const thenPart = node.then.map((n) => emitNode(n, indent + 1, state, track)).join('\n');
      const elsePart = node.otherwise?.map((n) => emitNode(n, indent + 1, state, track)).join('\n');
      const elseBlock = elsePart ? `\n${pad}} else {\n${elsePart}\n${pad}}` : '';
      return lineify(
        state,
        `${pad}if (${emitNode(node.condition, indent, state, track)}) {\n${thenPart}\n${pad}}${elseBlock}`
      );
    }
    case 'IRForEach': {
      map(state, node);
      const body = node.body.map((n) => emitNode(n, indent + 1, state, track)).join('\n');
      return lineify(
        state,
        `${pad}for (const ${node.item} of ${emitNode(node.collection, indent, state, track)}) {\n${body}\n${pad}}`
      );
    }
    case 'IRRepeat': {
      map(state, node);
      const body = node.body.map((n) => emitNode(n, indent + 1, state, track)).join('\n');
      const times = emitNode(node.times, indent, state, track);
      return lineify(state, `${pad}for (let i = 0; i < ${times}; i++) {\n${body}\n${pad}}`);
    }
    case 'IRCall':
      return `${pad}${node.callee}(${node.args.map((a) => emitNode(a, indent, state, track)).join(', ')})`;
    case 'IRFetch':
      return `${pad}await runtime.fetch(${JSON.stringify(node.target)}, ${
        node.qualifier ? JSON.stringify(node.qualifier) : 'undefined'
      })`;
    case 'IREnsure':
      return `${pad}runtime.${node.op}(${emitNode(node.condition, indent, state, track)});`;
    case 'IRSend':
      return `${pad}await runtime.send(${emitNode(node.payload, indent, state, track)}${
        node.target ? `, ${emitNode(node.target, indent, state, track)}` : ''
      });`;
    case 'IRStore':
      return `${pad}await runtime.store(${emitNode(node.value, indent, state, track)}${
        node.target ? `, ${JSON.stringify(node.target)}` : ''
      });`;
    case 'IRLiteral':
      return typeof node.value === 'string' ? `${JSON.stringify(node.value)}` : String(node.value);
    case 'IRIdentifier':
      return node.name;
    case 'IRBinary':
      return `${emitNode(node.left, indent, state, track)} ${tsOp(node.op)} ${emitNode(node.right, indent, state, track)}`;
    /* c8 ignore next */
    default:
      throw new Error(`Unhandled IR node ${(node as IRNode).kind}`);
  }
}

function map(state: { line: number; map: MapEntry[] }, node: any) {
  if (node.loc) {
    state.map.push({ out: state.line, src: node.loc });
  }
}

function lineify(state: { line: number; map: MapEntry[] }, code: string): string {
  const lines = code.split('\n').length;
  state.line += lines - 1;
  return code;
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
