# Vibe Coding Language (VCL)

Pragmatic, English-forward DSL with a working compiler, VM, runtime, and package manager.

## Structure

- `src/tokenizer` – indentation-aware tokenizer
- `src/parser` – AST generator
- `src/types` – AST types
- `src/ir` – lowering to intermediate representation
- `src/transpilers` – TypeScript and Rust emitters
- `src/runtime` – pluggable runtime adapters (in-memory defaults)
- `src/cli` – CLI commands (`compile`, `repl`, `run`, `install`, `publish`, `format`, `lint`)
- `docs/` – deeper reference material (philosophy, runtime, stdlib, roadmap)

## Quick start

```bash
nvm use 24   # >=20 works; tests run on 24
pnpm install
pnpm run build
# Compile to TypeScript (links stdlib)
node dist/cli/index.js compile examples/user_profile.vcl --target ts --with-stdlib
# Run via interpreter
node dist/cli/index.js run examples/webapp.vcl --event "http GET /api/health"
# Run via VM
node dist/cli/index.js run examples/webapp.vcl --event "http GET /api/health" --vm
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

- See `docs/README.md` for the doc hub and `docs/site` for the VitePress site scaffold.

## Status
- Tokenizer hardened (indentation, multiline strings, escapes, imports).
- Parser + linker handle namespaced imports (`foo::bar`), scheduling, and module inlining.
- Transpilers: runnable TypeScript/Rust emitters; WASM text stub; optional sourcemaps.
- Runtime + VM: interpreter/VM parity, pluggable adapters; CLI `run --vm`.
- Package manager: `vcl install/publish` with local registry support; formatter/linter; LSP-style completion stub.
- REPL prints TS preview; demo server remains in `scripts/demo-server.ts`.
