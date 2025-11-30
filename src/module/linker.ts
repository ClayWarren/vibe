import type { Program, Statement, FunctionDef, EventHandler, ImportStatement } from '../types/ast.js';
import { loadModule } from './loader.js';

// Linker with namespacing: imported top-level functions/events are prefixed with <mod>::.
export function linkProgram(program: Program, cwd = process.cwd()): Program {
  const linkedBody: Statement[] = [];
  for (const stmt of program.body as any[]) {
    if (stmt.kind === 'ImportStatement') {
      const mod = loadModule(stmt.source, cwd);
      const prefix = `${stmt.alias ?? stmt.source}::`;
      mod.ast.body.forEach((s: any) => {
        if (s.kind === 'FunctionDef') {
          linkedBody.push(renameFunction(s, prefix));
        } else if (s.kind === 'EventHandler') {
          linkedBody.push(renameEvent(s, prefix));
        } else {
          linkedBody.push(s);
        }
      });
    } else {
      linkedBody.push(stmt);
    }
  }
  return { ...program, body: linkedBody };
}

function renameFunction(fn: FunctionDef, prefix: string): FunctionDef {
  return { ...fn, name: { ...fn.name, name: prefix + fn.name.name } };
}

function renameEvent(ev: EventHandler, prefix: string): EventHandler {
  return { ...ev, event: prefix + ev.event };
}

function makeAliasFn(name: string, target: string): FunctionDef {
  return {
    kind: 'FunctionDef',
    name: { kind: 'Identifier', name },
    params: [],
    body: {
      kind: 'Block',
      statements: [
        {
          kind: 'ReturnStatement',
          value: { kind: 'Identifier', name: target },
        } as any,
      ],
    },
  };
}
