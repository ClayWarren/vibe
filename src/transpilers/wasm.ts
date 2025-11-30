// Minimal WASM text emitter stub: emits a function per IRLet event with a no-op body.
import type { IRNode } from '../ir/index.js';

export function emitWasm(node: IRNode): string {
  const lines: string[] = ['(module'];
  if (node.kind === 'IRProgram') {
    for (const n of node.body) {
      if (n.kind === 'IRLet' && n.name.startsWith('on_')) {
        lines.push(`  (func $${sanitize(n.name)} (result i32) (i32.const 0))`);
        lines.push(`  (export "${n.name}" (func $${sanitize(n.name)}))`);
      }
    }
  }
  lines.push(')');
  return lines.join('\n');
}

function sanitize(name: string) {
  return name.replace(/[^a-zA-Z0-9_]/g, '_');
}
