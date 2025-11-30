# Runtime

VCL code expects a host runtime that provides a few verbs. The CLI ships an in-memory default, and you can swap in your own adapters to integrate with real services.

## Surface

```ts
export type Runtime = {
  fetch: (resource: string, params?: any) => Promise<any> | any
  send: (channel: string, payload?: any) => Promise<void> | void
  store: (key: string, value: any) => Promise<void> | void
  log: (value: any) => void
  now?: () => Date | string | number
}
```

- `fetch` returns data for the requested resource.
- `send` emits messages (email/webhook/etc.).
- `store` persists key/value data.
- `log` records debugging output.
- `now` overrides the clock (used by schedulers/tests).

The interpreter (`src/runtime/interpreter.ts`) and VM runner (`src/vm/vm.ts`) both accept this shape.

## Defaults

The CLI uses a simple in-memory adapter:

```ts
{
  fetch: () => [],
  send: () => {},
  store: () => {},
  log: console.log,
  now: () => new Date(),
}
```

## Supplying your own runtime

Interpreter:

```ts
import { runEvent } from '../dist/runtime/interpreter.js'
import { parse } from '../dist/parser/index.js'
import { linkProgram } from '../dist/module/linker.js'

const ast = parse(source)
const linked = linkProgram(ast, process.cwd())
const result = await runEvent(linked, 'http GET /users', {
  fetch: async (res, params) => db.query(res, params),
  send: async (channel, payload) => mailer.send(channel, payload),
  store: async (key, val) => kv.put(key, val),
  log: console.log,
})
```

VM:

```ts
import { lowerProgram } from '../dist/ir/index.js'
import { compileIR } from '../dist/vm/compiler.js'
import { runBytecode } from '../dist/vm/vm.js'

const bc = compileIR(lowerProgram(linked))
const result = runBytecode(bc, 'on_http GET /users', runtime)
```

## Time control

Provide `now()` in tests or replay scenarios to freeze time:

```ts
const runtime = { ...adapters, now: () => new Date('2025-01-01T00:00:00Z') }
```

## Logging

`log` is called by the `log_value` stdlib helper and anywhere you emit `log` in VCL.
