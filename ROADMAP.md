# VCL Roadmap

## v0.1 (this scaffold)

- Tokenizer, parser, AST, IR skeletons
- TS/Rust emitters stubbed
- CLI + REPL placeholders

## v0.2

- Complete grammar coverage for natural verbs and scheduling (`every <duration>:`)
- Robust tokenizer (multi-line strings, escape handling)
- Proper block-sensitive parser without colon sentinels
- Basic semantic analysis (undefined identifiers, type hints)

## v0.3

- Executable runtime (db/http adapters, event bus)
- End-to-end transpilation to runnable TS/Rust
- Snapshot-based test suite for fixtures in `examples/`

## v0.4

- IDE tooling (LSP stub, autocomplete from grammar)
- Formatter and linter (enforce periods/indent)
- Source maps back to VCL

## v1.0

- Stable spec, published stdlib, package manager
- WASM backend
- Deterministic REPL with compiled preview
