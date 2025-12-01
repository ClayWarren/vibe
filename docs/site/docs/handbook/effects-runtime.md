# Effects & Runtime

VCL is designed around effect verbs. Think of this as the “Async & Effects” counterpart to the TS Handbook.

## Core effect verbs
- `fetch` — read external data (HTTP, DB, file). Returns a value or raises on failure.
- `send` — emit an outgoing message/response.
- `store` — persist data.
- `log` — structured logging for observability.

These are provided by the runtime; the compiler doesn’t hard-code transports.

## Handler shape
- Convention: HTTP/event handlers are named `on_<event>` in the compiled output.
- In VCL, you define with `define <name>.` and rely on the runtime adapter to pass a context record.

```text
define get_user.
  let { id } = ctx.
  let user = fetch { path: "users/" + id }.
  ensure user.
  send { status: 200, body: user }.
```

## Success and failure
- `ensure`, `validate`, `expect` short-circuit on failure. The runtime maps that to HTTP 4xx/5xx depending on adapter policy.
- Use `return <value>.` to end a handler early.

## Async model
- Effects are implicitly async; the compiler targets promises in TS output.
- In VM mode, the runtime drives the effect loop; in interpreter mode, effects await sequentially.

## Runtime contract
A runtime must supply (at least):

```ts
{
  fetch: (req) => Promise<any>,
  send: (res) => Promise<any> | any,
  store?: (op) => Promise<any>,
  log?: (...args) => void,
  now?: () => number
}
```

Adapters (Next.js/Express/Workers) should wrap these verbs to their platform primitives.

## Testing effects
- Provide a mock runtime: stub `fetch/send/store/log` and assert calls.
- Run compiled TS directly in tests; the effect surface stays small.

See also: [Runtime](/runtime) for more detail and [VM](/vm) for the bytecode pipeline.
