# VCL Roadmap

## v0.1 (done)

- Tokenizer, parser, AST, IR skeletons ✅
- TS/Rust emitters stubbed ✅
- CLI + REPL placeholders ✅

## v0.2 (done)

- Grammar coverage for natural verbs and scheduling (`every <duration>:`) ✅
- Tokenizer hardened (multi-line strings, escape handling) ✅
- Block-sensitive inline/indented parser (no Chevrotain dependency) ✅
- Basic semantic check for undefined identifiers ✅

## v0.3 (done)

- Executable runtime with pluggable adapters + in-memory defaults ✅
- End-to-end transpilation to runnable TS/Rust ✅
- Fixtures/snapshot coverage for transpilation ✅

## v0.4

- IDE tooling (LSP stub, autocomplete from grammar)
- Formatter and linter (enforce periods/indent)
- Source maps back to VCL

## v1.0 (done)

- Stable spec + stdlib docs ✅
- Package manager scaffold (vcl.json, install/init, tarball fetch stub) ✅
- WASM backend stub ✅
- Deterministic REPL with compiled preview ✅
- Namespaced imports + linker ✅
