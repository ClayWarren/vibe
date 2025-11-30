import type { Identifier } from '../types/ast.js';

export function parseParams(words: string[]): Identifier[] {
  return words.map((w) => ({ kind: 'Identifier', name: w }) as Identifier);
}
