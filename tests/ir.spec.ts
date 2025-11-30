import { describe, it, expect } from 'vitest';
import { lowerProgram } from '../src/ir/index.js';
import { parse } from '../src/parser/index.js';

describe('IR lowering', () => {
  it('lowers function and event handlers', () => {
    const ast = parse(`define f:\n  return 1.\nend.\nwhen user logs_in:\n  stop with "no".\nend.`);
    const ir = lowerProgram(ast);
    const lets = ir.kind === 'IRProgram' ? ir.body.filter((n) => n.kind === 'IRLet') : [];
    expect(lets.length).toBe(2);
  });

  it('lowers ensure/validate/expect and fetch', () => {
    const ast = parse(
      `ensure ok.\nvalidate ok.\nexpect ok.\nlet x = fetch data where id equal_to 1 into rec.`
    );
    const ir = lowerProgram(ast);
    const kinds: string[] = [];
    const walk = (node: any) => {
      kinds.push(node.kind);
      if (node.body) node.body.forEach((n: any) => walk(n));
      if (node.value) walk(node.value);
      if (node.then) node.then.forEach((n: any) => walk(n));
      if (node.otherwise) node.otherwise.forEach((n: any) => walk(n));
    };
    walk(ir);
    expect(kinds).toContain('IREnsure');
    expect(kinds).toContain('IRFetch');
  });

  it('lowers loops and conditionals', () => {
    const ast = parse(
      `for each x in xs:\n  return x.\nend.\nrepeat 3 times:\n  return none.\nend.\nif true:\n  return 1.\nelse:\n  return 2.\nend.`
    );
    const ir = lowerProgram(ast);
    const bodyKinds = (ir as any).body.map((n: any) => n.kind);
    expect(bodyKinds).toContain('IRForEach');
    expect(bodyKinds).toContain('IRRepeat');
    expect(bodyKinds).toContain('IRIf');
  });
});
