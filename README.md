# Vibe Coding Language (VCL)

Early scaffold for the VCL v1.0 compiler and tooling.

## Structure

- `src/tokenizer` – indentation-aware tokenizer
- `src/parser` – AST generator
- `src/types` – AST types
- `src/ir` – lowering to intermediate representation
- `src/transpilers` – TypeScript and Rust emitters
- `src/runtime` – minimal runtime stubs
- `src/cli` – CLI commands (`compile`, `repl`)
- `docs/` – deeper reference material (philosophy, runtime, stdlib, roadmap)

## Quick start

```bash
nvm use 20  # recommended
pnpm install
pnpm run build
node dist/cli/index.js compile examples/user_profile.vcl --target ts
```

## Web playground

```bash
cd web
pnpm install   # first time only
pnpm run dev   # opens VCL playground with live compile to TS/Rust
```

## Spec highlights

- Indent defines blocks, statements end with `.`
- English-like control words (define, when, fetch, ensure, validate)
- Implicit async for I/O verbs

## Docs

- See `docs/README.md` for a hub to the language philosophy, stdlib draft, runtime reference, and roadmap.

## Status
- Tokenizer hardened (Chevrotain-based; strings, multi-word ops, indentation).
- Parser covers fetch/get/send/store and control constructs.
- TypeScript transpiler emits runnable code; Rust emitter exists but CLI currently uses a placeholder output.
- Runtime interpreter + Express demo server; end-to-end tests included.
