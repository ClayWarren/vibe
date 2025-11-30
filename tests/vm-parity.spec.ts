import { describe, it, expect } from 'vitest';
import { parse } from '../src/parser/index.js';
import { lowerProgram } from '../src/ir/index.js';
import { compileIR } from '../src/vm/compiler.js';
import { runBytecode } from '../src/vm/vm.js';
import { runEvent } from '../src/runtime/interpreter.js';

const program = parse(`
when http GET /sum:
  let total = 0.
  for each n in nums:
    let total = total plus n.
  end.
  repeat 2 times:
    let total = total plus 1.
  end.
  return total.
end.
`);

describe('vm parity', () => {
  it('matches interpreter result for sum handler', async () => {
    const ir = lowerProgram(program);
    const bc = compileIR(ir);
    const vmRes = runBytecode(bc, 'on_http GET /sum', {
      fetch: () => [],
      store: () => {},
      send: () => {},
      log: () => {},
      nums: [1, 2, 3],
    } as any);
    const interp = await runEvent(program, 'http GET /sum', { nums: [1, 2, 3] } as any);
    expect(vmRes).toBe(interp.body);
  });
});
