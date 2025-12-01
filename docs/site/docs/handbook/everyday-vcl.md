# Everyday VCL

This chapter mirrors TS Handbook “Everyday Types,” but in VCL’s indent-first, dot-terminated style.

## Blocks, indentation, trailing dots
- Indentation defines scope; tabs are disallowed. Use spaces consistently.
- Statements end with a trailing dot (`.`). Missing dots are a common error.
- Example:

```text
define greet.
  let message = "hi".
  log message.
```

## Values and literals
- Primitives: `number`, `string`, `boolean`, `none`.
- Records: `{ name: "ada", age: 36 }` (keys are identifiers; strings allowed via quotes).
- Variants (sum types): `Ok(value)` / `Err(reason)` pattern; pattern matching is planned—today treat as tagged data.
- Arrays: `[1, 2, 3]`.

## Bindings
- `let` introduces a binding in the current scope.
- Reassignment is allowed with `let x = ...` again in the same scope; shadowing is permitted in nested scopes.

## Control flow
- `when <condition>.` introduces a block. Use `else.` for alternate branch.

```text
when user.is_admin.
  log "admin".
else.
  log "user".
```

- `ensure` / `validate` / `expect` are semantic checks (see Effects chapter for failure semantics).

## Functions / handlers
- Define named handlers with `define name.`. Handlers take a single implicit `ctx` record; additional params are pattern fields inside `ctx` (common convention). Example:

```text
define add_user.
  let { name, email } = ctx.
  store { path: "users", value: { name, email } }.
  return { status: "ok" }.
```

## Types (lightweight)
- VCL is structurally typed; most code is inferred. Explicit type annotations are currently minimal; use the spec for edge cases.
- Truthiness: only `none` is falsy.

## Common pitfalls
- Missing trailing dots.
- Mixed tabs/spaces in indent.
- Forgetting to return a value from handlers that the runtime expects.

See also: [Language Spec](/spec) for formal grammar and [Stdlib](/stdlib) for available helpers.
