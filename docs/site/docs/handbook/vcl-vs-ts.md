# VCL vs TypeScript (quick comparison)

A side‑by‑side to help TS users orient in VCL.

## Cheat sheet

| Topic | VCL | TypeScript |
| --- | --- | --- |
| Blocks | Significant indentation + trailing `.` ends statements | Braces + semicolons (optional) |
| Imports/modules | `foo::bar` namespaces; modules resolved by linker/registry | `import { x } from './mod'` ES modules |
| Effects | Built‑ins: `fetch/send/store/log`; runtime provides implementations | Use `fetch`, libs, or framework APIs |
| Async | Effects implicitly async; compiled TS uses promises | `async/await` explicit |
| Truthiness | Only `none` is falsy | `false`, `0`, `""`, `null`, `undefined`, `NaN` |
| Nullish | `none` | `null` / `undefined` |
| Types | Structural; mostly inferred; explicit annotations limited today | Rich annotations, interfaces, generics, utility types |
| Handlers | `define <name>.` with implicit `ctx` record; common for events/HTTP | Functions/handlers per framework (e.g., Next route handlers) |
| Returns | `return <value>.` (or implicit last send/ensure) | `return value;` |
| Tooling | CLI + VCL VS Code extension | TS compiler + tsserver/VS Code |

## Hello, request handler

VCL:
```text
define hello.
  let { name } = ctx.
  let greeting = "Hello, " + name + "!".
  send { status: 200, body: { message: greeting } }.
```

Compiled TS (conceptual shape):
```ts
export async function on_http_GET_/hello(ctx: { name: string }) {
  const greeting = `Hello, ${ctx.name}!`;
  return { status: 200, body: { message: greeting } };
}
```

## Control flow

VCL:
```text
when user.is_admin.
  log "admin".
else.
  log "user".
```

TS:
```ts
if (user.is_admin) {
  console.log("admin");
} else {
  console.log("user");
}
```

## Effects & runtime
- In VCL you call `fetch/send/store/log`; the runtime adapter maps these to platform primitives (HTTP, DB, logging).
- In TS you call platform APIs directly; there’s no built‑in effect vocabulary.

## Modules
- VCL: `import auth::session.` and call `auth::session::current ctx.`
- TS: `import { current } from './auth/session'` and call `current(ctx)`.

## Error handling
- `ensure` / `validate` / `expect` short‑circuit; the runtime turns them into errors/responses.
- TS uses `throw`/`try-catch` or Result/Promise patterns.

## When to pick which
- Write in VCL for terse, effect‑first handlers and generate TS for integration.
- Drop to TS for ecosystem/library breadth or advanced typing features not yet in VCL.
