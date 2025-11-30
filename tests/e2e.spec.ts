import { describe, it, expect } from 'vitest';
import { parse } from '../src/parser/index.js';
import { runEvent } from '../src/runtime/interpreter.js';
import fs from 'fs';

const webapp = fs.readFileSync('examples/webapp.vcl', 'utf8');
const ast = parse(webapp);

describe('end-to-end interpreter', () => {
  it('returns health ok', async () => {
    const res = await runEvent(ast, 'http GET /api/health', { data: {} });
    expect(res.status).toBe(200);
    expect(res.body).toBe('ok');
  });

  it('stores and returns created user', async () => {
    const ctx = { data: { users: [] as any[] }, body: { name: 'Ada' } } as any;
    const res = await runEvent(ast, 'http POST /api/users', ctx);
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Ada');
    expect(ctx.data.users.length).toBe(1);
  });
});
