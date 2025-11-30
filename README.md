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
nvm use 24   # or >=20
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

- See `docs/README.md` for a hub to the language philosophy, stdlib, runtime reference, and roadmap.

## Status
- Tokenizer hardened (Chevrotain-based; strings, multi-word ops, indentation; multiline strings, imports).
- Parser covers fetch/get/send/store, scheduling, functions, imports with namespacing.
- Transpilers: runnable TypeScript/Rust emitters; WASM text stub; optional sourcemap.
- VM + interpreter parity, pluggable runtime adapters; CLI `run --vm` available.
- Module system: linker with namespacing, `vcl install/publish` (registry-aware), `vcl format`/`lint`.
- REPL prints TS preview; demo server remains in `scripts/demo-server.ts`.
