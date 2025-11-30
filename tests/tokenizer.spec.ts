import { describe, it, expect } from 'vitest';
import { tokenize } from '../src/tokenizer/index.js';

describe('tokenizer', () => {
  it('produces indent/dedent and dots', () => {
    const code = `define thing:\n  let a = 1.\nend.`;
    const tokens = tokenize(code);
    expect(tokens.some((t) => t.type === 'indent')).toBe(true);
    expect(tokens.some((t) => t.type === 'dedent')).toBe(true);
    expect(tokens.filter((t) => t.type === 'dot').length).toBe(2);
  });

  it('distinguishes keywords, operators, numbers, strings', () => {
    const code = 'let total = 3.14 plus 2 minus 1."done".';
    const tokens = tokenize(code);
    expect(tokens.find((t) => t.type === 'number')?.value).toBe('3.14');
    expect(tokens.find((t) => t.type === 'operator')?.value).toBe('plus');
    expect(tokens.find((t) => t.type === 'string')?.value).toBe('done');
  });

  it('handles fetch/where/into as keywords and identifiers', () => {
    const code = 'let user = fetch user where id is 1 into result.';
    const tokens = tokenize(code);
    const fetchTok = tokens.find((t) => t.value === 'fetch');
    expect(fetchTok?.type).toBe('keyword');
    expect(tokens.some((t) => t.value === 'into')).toBe(true);
  });

  it('splits trailing dot after number', () => {
    const tokens = tokenize('let x = 3.');
    const num = tokens.find((t) => t.type === 'number');
    const dots = tokens.filter((t) => t.type === 'dot');
    expect(num?.value).toBe('3');
    expect(dots.length).toBeGreaterThan(0);
  });
});
