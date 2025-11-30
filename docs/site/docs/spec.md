# Language Spec (summary)

See full draft in `docs/spec/language.md` in the repo. Key points:

- Statements end with `.`; indentation defines blocks.
- Keywords: `let, define, when, every, if, else, end, for, each, in, repeat, times, return, stop, fetch, send, store, ensure, validate, expect, use, import`.
- Functions: `define foo:` blocks; call via `call foo with x` or host-provided names.
- Events: `when http GET /path:` and scheduled `every <duration>:` handlers.
- Safety: `ensure/validate/expect` throw on falsy; `stop with <value>` aborts handler.
- Modules: `import foo.` with namespaced access `foo::name` or alias `import foo as f.`
- Expressions: binary verbs (`plus, minus, times, divided_by, equal_to, not_equal_to, greater_than, less_than`).

Refer to the repo’s `docs/spec` for the authoritative spec.
