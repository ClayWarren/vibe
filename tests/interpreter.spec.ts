import { describe, it, expect, vi } from 'vitest';
import { parse } from '../src/parser/index.js';
import { runEvent } from '../src/runtime/interpreter.js';

const program = parse(`
when http GET /ping:
  return "pong".
end.

when http POST /send:
  send body to target.
  return none.
end.

when http POST /store:
  store body into items.
  return items.
end.

when http POST /ensure:
  ensure body.ok.
  return "ok".
end.

define ping:
  return "pong".
end.
`);

describe('interpreter', () => {
  it('returns data from fetch fallback and store', async () => {
    const ctx = { data: { items: [] }, body: { name: 'x' } } as any;
    const res = await runEvent(program, 'http POST /store', ctx);
    expect(res.status).toBe(200);
    expect(ctx.data.items.length).toBe(1);
  });

  it('calls send hook', async () => {
    const send = vi.fn();
    await runEvent(program, 'http POST /send', { send, body: 'msg', target: 't' });
    expect(send).toHaveBeenCalledWith('msg', 't');
  });

  it('returns pong', async () => {
    const res = await runEvent(program, 'http GET /ping', {} as any);
    expect(res.body).toBe('pong');
  });

  it('fails ensure when condition false', async () => {
    const ast = parse('when http POST /ensure:\n  ensure false.\nend.');
    const res = await runEvent(ast, 'http POST /ensure', {} as any);
    expect(res.status).toBe(400);
  });

  it('handles stop with error', async () => {
    const ast = parse('when http POST /stop:\n  stop with "boom".\nend.');
    const res = await runEvent(ast, 'http POST /stop', {} as any);
    expect(res.status).toBe(400);
    expect(res.body).toBe('boom');
  });

  it('evaluates for-each and repeat', async () => {
    const ast = parse(`when http GET /sum:\n  let total = 0.\n  for each n in nums:\n    let total = total plus n.\n  end.\n  repeat 2 times:\n    let total = total plus 1.\n  end.\n  return total.\nend.`);
    const res = await runEvent(ast, 'http GET /sum', { nums: [1, 2, 3] });
    expect(res.body).toBe(1 + 2 + 3 + 2); // repeat adds 2
  });

  it('uses fetch hook when provided', async () => {
    const fetch = vi.fn().mockReturnValue([{ id: 1 }]);
    const ast = parse('when http GET /fetch:\n  let items = fetch data.\n  return items.\nend.');
    const res = await runEvent(ast, 'http GET /fetch', { fetch });
    expect(fetch).toHaveBeenCalled();
    expect(res.body[0].id).toBe(1);
  });

  it('covers binary ops and call expression', async () => {
    const ast = parse(
      `when http GET /math:\n  let a = 6 times 7.\n  let b = a divided_by 3.\n  let c = b greater_than 10.\n  let d = b less_than 15.\n  let e = b not_equal_to 0.\n  let f = call add with b.\n  return f.
end.`
    );
    const res = await runEvent(ast, 'http GET /math', { add: (x: number) => x + 1 } as any);
    expect(res.body).toBe(15); // (6*7)/3 =14 +1
  });

  it('sends without target and fetches from data fallback', async () => {
    const send = vi.fn();
    const ast = parse('when http GET /ops:\n  send body.\n  let items = fetch users where id equal_to 1.\n  return items.\nend.');
    const res = await runEvent(ast, 'http GET /ops', { send, body: 'x', data: { users: [{ id: 1 }] } } as any);
    expect(send).toHaveBeenCalled();
    expect(res.body[0].id).toBe(1);
  });

  it('uses store hook when provided', async () => {
    const store = vi.fn();
    const ast = parse('when http POST /storehook:\n  store body into items.\nend.');
    await runEvent(ast, 'http POST /storehook', { store, body: { v: 1 } } as any);
    expect(store).toHaveBeenCalledWith({ v: 1 }, 'items');
  });

  it('executes else branch when condition false', async () => {
    const ast = parse('when http GET /cond:\n  if false:\n    return 1.\n  else:\n    return 2.\n  end.\nend.');
    const res = await runEvent(ast, 'http GET /cond', {} as any);
    expect(res.body).toBe(2);
  });

  it('calls user-defined function', async () => {
    const res = await runEvent(program, 'http GET /ping', { data: {} } as any);
    expect(res.body).toBe('pong');
  });

  it('lexical scope shadows', async () => {
    const ast = parse(
      `when http GET /shadow:\n  let x = 1.\n  if true:\n    let x = 2.\n    return x.\n  end.\n  return x.\nend.`
    );
    const res = await runEvent(ast, 'http GET /shadow', {} as any);
    expect(res.body).toBe(2);
  });
});
