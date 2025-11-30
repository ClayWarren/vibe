import { describe, it, expect } from 'vitest';
import { parse } from '../src/parser/index.js';
import { lowerProgram } from '../src/ir/index.js';
import { emitTypeScript } from '../src/transpilers/typescript.js';
import { emitRust } from '../src/transpilers/rust.js';
import fs from 'fs';

const example = fs.readFileSync('examples/webapp.vcl', 'utf8');

describe('fixtures transpilation', () => {
  it('emits runnable TypeScript using runtime helpers', () => {
    const ir = lowerProgram(parse('import stdlib.\n' + example));
    const ts = emitTypeScript(ir).code;
    expect(ts).toContain('runtime.ensure');
    expect(ts).toContain('runtime.store');
  });

  it('emits Rust stubs with runtime calls', () => {
    const ir = lowerProgram(parse(example));
    const rs = emitRust(ir);
    expect(rs).toContain('runtime::store');
  });
});
