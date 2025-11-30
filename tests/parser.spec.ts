import { describe, it, expect } from 'vitest';
import { parse } from '../src/parser/index.js';

const parseOne = (code: string) => parse(code).body[0];

describe('parser statements', () => {
  it('parses if/else blocks', () => {
    const ast = parse(`if a is none:\n  return none.\nelse:\n  stop with "err".\nend.`);
    expect(ast.body[0].kind).toBe('IfStatement');
    const ifStmt = ast.body[0] as any;
    expect(ifStmt.otherwise).toBeTruthy();
  });

  it('parses loops and repeat', () => {
    const ast = parse(
      `for each item in items:\n  ensure item.\nend.\nrepeat 2 times:\n  validate true.\nend.`
    );
    expect(ast.body[0].kind).toBe('ForEachStatement');
    expect(ast.body[1].kind).toBe('RepeatStatement');
  });

  it('parses ensure/validate/expect expressions', () => {
    const ast = parse(`ensure ready.\nvalidate ok.\nexpect good.`);
    expect(ast.body[0].kind).toBe('ExpressionStatement');
  });

  it('parses fetch with where and into', () => {
    const stmt = parseOne('let user = fetch user where id equal_to uid into record.');
    expect((stmt as any).value.kind).toBe('FetchExpression');
    const fetch = (stmt as any).value;
    expect(fetch.qualifier).toContain('id');
    expect(fetch.into.name).toBe('record');
  });

  it('parses event handler names and inline if', () => {
    const ast = parse(`when user logs_in:\n  stop with "no".\nend.\nif ok: return ok.`);
    const event = ast.body[0] as any;
    expect(event.kind).toBe('EventHandler');
    expect(event.event).toContain('logs_in');
    const inlineIf = ast.body[1] as any;
    expect(inlineIf.then.statements[0].kind).toBe('ReturnStatement');
  });

  it('parses call expressions with with-arg and default is equality', () => {
    const ast = parse('call do_stuff with thing.\nif user is active: return user.');
    const call = ast.body[0] as any;
    expect(call.kind).toBe('ExpressionStatement');
    const ifStmt = ast.body[1] as any;
    expect(ifStmt.condition.kind).toBe('BinaryExpression');
    expect(ifStmt.condition.operator).toBe('equal_to');
  });
});
