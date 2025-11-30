import { describe, it, expect } from 'vitest';
import { parse } from '../src/parser/index.js';
import { lowerProgram } from '../src/ir/index.js';
import { emitTypeScript } from '../src/transpilers/typescript.js';

const compileTS = (code: string) => emitTypeScript(lowerProgram(parse(code)));

describe('TypeScript emitter', () => {
  it('emits if/else and fetch', () => {
    const ts = compileTS(`if true:\n  let a = fetch things.\nend.`);
    expect(ts).toContain('if (true)');
    expect(ts).toContain('await runtime.fetch');
  });

  it('emits loops', () => {
    const ts = compileTS(
      `for each item in items:\n  call log with item.\nend.\nrepeat 2 times:\n  call log with "hi".\nend.`
    );
    expect(ts).toContain('for (const item of items)');
    expect(ts).toContain('for (let i = 0; i < 2; i++)');
  });

  it('emits ensure/validate/expect', () => {
    const ts = compileTS('ensure ok.\nvalidate ok.\nexpect ok.');
    expect(ts).toContain('runtime.ensure');
    expect(ts).toContain('runtime.validate');
    expect(ts).toContain('runtime.expect');
  });

  it('emits stop with error and binary ops', () => {
    const ts = compileTS('stop with "bad".\nlet y = 2 plus 3 times 4.');
    expect(ts).toContain('throw new Error');
    expect(ts).toContain('2 + 3 * 4');
  });

  it('maps comparison operators', () => {
    const ts = compileTS('let ok = a greater_than b.\nlet neq = a not_equal_to b.\nlet div = a divided_by b.');
    expect(ts).toContain('>');
    expect(ts).toContain('!==');
    expect(ts).toContain('/ b');
  });
  it('emits divided_by and less_than ops', () => {
    const ts = compileTS(`let ratio = a divided_by b.\nlet small = a less_than b.`);
    expect(ts).toContain('/ b');
    expect(ts).toContain('< b');
  });

  it('handles unknown binary op gracefully', () => {
    const ts = emitTypeScript({
      kind: 'IRBinary',
      op: 'custom_op',
      left: { kind: 'IRLiteral', value: 1 },
      right: { kind: 'IRLiteral', value: 2 },
    } as any);
    expect(ts).toContain('custom_op');
  });
});

  it('emits minus operator', () => {
    const ts = compileTS('let diff = a minus b.');
    expect(ts).toContain('- b');
  });
