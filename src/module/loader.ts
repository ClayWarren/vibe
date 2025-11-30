import { parse } from '../parser/index.js';
import { resolveModule } from './resolver.js';
import { lowerProgram } from '../ir/index.js';
import type { Program } from '../types/ast.js';

const cache = new Map<string, { ast: Program; ir: any; src: string }>();

export function loadModule(source: string, cwd = process.cwd()) {
  const key = `${cwd}:${source}`;
  if (cache.has(key)) return cache.get(key)!;
  const src = resolveModule(source, cwd);
  const ast = parse(src);
  const ir = lowerProgram(ast);
  const entry = { ast, ir, src };
  cache.set(key, entry);
  return entry;
}
