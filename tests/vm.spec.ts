import { describe, it, expect } from 'vitest';
import { parse } from '../src/parser/index.js';
import { lowerProgram } from '../src/ir/index.js';
import { compileIR } from '../src/vm/compiler.js';
import { runBytecode } from '../src/vm/vm.js';

describe('vm execution', () => {
  it('runs handler and returns value', () => {
    const program = parse(`when http GET /sum:\n  return 5.\nend.`);
    const ir = lowerProgram(program);
    const bc = compileIR(ir);
    const res = runBytecode(bc, 'on_http GET /sum', {});
    expect(res).toBe(5);
  });
});
