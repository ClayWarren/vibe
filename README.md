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

## Quick start

```bash
npm install
npm run build
node dist/cli/index.js compile examples/hello.vcl --target ts
```

## Web playground

```bash
cd web
npm install   # first time only
npm run dev   # opens VCL playground with live compile to TS/Rust
```

## Spec highlights

- Indent defines blocks, statements end with `.`
- English-like control words (define, when, fetch, ensure, validate)
- Implicit async for I/O verbs

## Status
- Tokenizer hardened (Chevrotain-based; strings, multi-word ops, indentation).
- Parser covers fetch/get/send/store and control constructs.
- Runtime interpreter + Express demo server; end-to-end tests included.
