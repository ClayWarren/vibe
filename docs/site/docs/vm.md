# VM

VCL ships a bytecode compiler and VM for fast, deterministic execution. The VM matches interpreter behavior and is selectable via `--vm` in the CLI.

## Pipeline

1. Parse + link: `parse` → `linkProgram`
2. Lower to IR: `lowerProgram`
3. Compile to bytecode: `compileIR`
4. Execute: `runBytecode(bytecode, handlerName, runtime)`

## Handler naming

Event handlers are exported as `on_<event>`. For HTTP events, `http GET /health` becomes `on_http GET /health`. Use the same name when invoking `runBytecode`.

## Runtime surface

The VM expects the same runtime shape as the interpreter: `{ fetch, send, store, log, now? }`.

## Example

```ts
import { parse } from '../dist/parser/index.js'
import { linkProgram } from '../dist/module/linker.js'
import { lowerProgram } from '../dist/ir/index.js'
import { compileIR } from '../dist/vm/compiler.js'
import { runBytecode } from '../dist/vm/vm.js'

const ast = parse(source)
const linked = linkProgram(ast, process.cwd())
const bc = compileIR(lowerProgram(linked))

const result = runBytecode(bc, 'on_http GET /health', {
  fetch: () => [],
  send: () => {},
  store: () => {},
  log: console.log,
})
```

## Scheduling

Scheduled handlers (`every 5 minutes: ...`) are lowered to functions you can call manually. Hook them to your scheduler of choice and pass them through the VM runner the same way.

## Determinism

The VM is designed to be deterministic given the same runtime inputs. Provide a fixed `now()` for repeatable tests.
