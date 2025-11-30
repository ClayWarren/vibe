import { describe, it, expect } from 'vitest';
import { parse } from '../src/parser/index.js';
import { checkProgram } from '../src/semantic/check.js';

describe('semantic checks', () => {
  it('flags undefined identifiers', () => {
    const ast = parse('return missing_value.');
    const issues = checkProgram(ast);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].message).toContain('missing_value');
  });

  it('allows defined variables and built-ins', () => {
    const ast = parse('let x = 1.\nreturn x.');
    const issues = checkProgram(ast);
    expect(issues.length).toBe(0);
  });

  it('accepts user-defined functions', () => {
    const ast = parse('define foo:\n  return 1.\nend.\ncall foo.');
    const issues = checkProgram(ast);
    expect(issues.length).toBe(0);
  });
});
