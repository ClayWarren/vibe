import { describe, it, expect } from 'vitest';
import { tokenize } from '../src/tokenizer/index.js';
import { parse } from '../src/parser/index.js';
import { lowerProgram } from '../src/ir/index.js';
import { emitTypeScript } from '../src/transpilers/typescript.js';
import { readFileSync } from 'fs';

const sample = readFileSync('examples/user_profile.vcl', 'utf8');

describe('VCL pipeline', () => {
  it('tokenizes indentation and dots', () => {
    const tokens = tokenize(sample);
    const dotCount = tokens.filter(t => t.type === 'dot').length;
    expect(dotCount).toBeGreaterThan(3);
    expect(tokens.some(t => t.type === 'indent')).toBe(true);
    expect(tokens.some(t => t.type === 'dedent')).toBe(true);
  });

  it('parses into an AST program', () => {
    const ast = parse(sample);
    expect(ast.kind).toBe('Program');
    expect(ast.body.length).toBeGreaterThan(0);
  });

  it('lowers to IR and emits TypeScript', () => {
    const ir = lowerProgram(parse(sample));
    const ts = emitTypeScript(ir);
    expect(ts).toContain('const get_user_profile');
    expect(ts).toContain('await runtime.fetch');
    expect(ts).toContain('throw new Error');
  });
});
