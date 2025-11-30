import { describe, it, expect } from 'vitest';
import { parse } from '../src/parser/index.js';

describe('parser errors', () => {
  it('throws on missing dot', () => {
    expect(() => parse('let x = 1')).toThrow();
  });

  it('throws on malformed if', () => {
    expect(() => parse('if true return 1.')).toThrow();
  });
});
