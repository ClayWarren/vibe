# Standard Library

Provided as module `stdlib` (import with `import stdlib.`). Backed by runtime adapters.

- `ensure_true` — throws if falsy.
- `now` — epoch milliseconds via runtime.
- `log_value` — sends value via runtime log/send.
- `store_value` — stores value into `items` collection.
- `fetch_users` — fetches `users` via runtime.

Runtime verbs available to transpilers and VM/interpreter:
- `fetch(target, qualifier?)`
- `send(payload, target?)`
- `store(value, target?)`
- `log(value)`
- `now()`
- `ensure/validate/expect(condition)`
