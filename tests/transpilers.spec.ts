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
});
