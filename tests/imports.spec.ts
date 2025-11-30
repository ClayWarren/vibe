import { describe, it, expect } from 'vitest';
import { resolveModule } from '../src/module/resolver.js';
import { loadModule } from '../src/module/loader.js';
import fs from 'fs';
import path from 'path';

describe('module resolution', () => {
  it('resolves local module file', () => {
    const tmp = path.join(process.cwd(), 'tmp_mod.vcl');
    fs.writeFileSync(tmp, 'let x = 1.', 'utf8');
    const src = resolveModule('tmp_mod', process.cwd());
    expect(src).toContain('let x');
    fs.unlinkSync(tmp);
  });

  it('loads stdlib stub', () => {
    const mod = loadModule('stdlib', process.cwd());
    expect(mod.src).toContain('ensure_true');
  });

  it('links imported module with namespacing', () => {
    const tmp = path.join(process.cwd(), 'tmp_link.vcl');
    fs.writeFileSync(tmp, 'define helper:\n  return 2.\nend.', 'utf8');
    const main = 'import tmp_link.\nwhen http GET /go:\n  return tmp_link::helper.\nend.';
    const { linkProgram } = require('../dist/module/linker.js');
    const { parse } = require('../dist/parser/index.js');
    const linked = linkProgram(parse(main), process.cwd());
    expect(linked.body.some((s: any) => s.kind === 'FunctionDef' && s.name.name.endsWith('helper'))).toBe(true);
    fs.unlinkSync(tmp);
  });

  it('supports import alias and selective names', () => {
    const tmp = path.join(process.cwd(), 'tmp_link2.vcl');
    fs.writeFileSync(tmp, 'define helper:\n  return 3.\nend.', 'utf8');
    const main = 'import tmp_link2 as t.\nwhen http GET /go:\n  return t::helper.\nend.';
    const { linkProgram } = require('../dist/module/linker.js');
    const { parse } = require('../dist/parser/index.js');
    const linked = linkProgram(parse(main), process.cwd());
    expect(linked.body.some((s: any) => s.kind === 'FunctionDef' && s.name.name.startsWith('t::helper'))).toBe(true);
    fs.unlinkSync(tmp);
  });
});
