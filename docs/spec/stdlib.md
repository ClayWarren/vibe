# VCL Standard Library (v1.0 draft)

## Core verbs
- `fetch <target> [where <qualifier>] [into <ident>]` → runtime.fetch(target, qualifier)
- `send <payload> [to <target>]` → runtime.send(payload, target?)
- `store <value> [into <target>]` → runtime.store(value, target?)
- `log <value>` → runtime.log
- `now` → runtime.now (returns epoch ms)

## Control/safety
- `ensure/validate/expect <condition>` throw if falsy.
- `stop with <value>` aborts current handler with error.

## Scheduling
- `every <duration>:` declares a scheduled handler; runtime wiring is host-provided.

## Collections (host-provided helpers)
- `length of <collection>` (planned)
- `push <value> into <collection>` (planned)

## Time (planned)
- `now`, `today`, `sleep <duration>`

## Notes
- All stdlib verbs are host-implemented; VCL transpilers emit calls to the global `runtime` namespace with matching names.
- Module `stdlib` is provided via `import stdlib.` (resolved from `vcl_modules/stdlib/main.vcl`).
- Registry: dependencies can be installed via `vcl install <name> [--registry <url>]`; default registry base can be overridden by `VCL_REGISTRY`.
