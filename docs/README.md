# VCL Documentation

Use these short guides as entry points:

- [Language Philosophy](philosophy.md) – design principles that shape syntax and tooling choices.
- [Standard Library (draft)](stdlib.md) – core verbs and planned collection/time helpers.
- [Runtime Reference (draft)](runtime.md) – expected host runtime surface area for transpiled code.
- [Roadmap](roadmap.md) – versioned milestones for the compiler, runtime, and tooling.
- Registry: set `export VCL_REGISTRY=$HOME/.vcl-registry` (default path used by the CLI if set).
- Node version: use Node 24 (`nvm use 24`); Node 20+ works.
- npm: once published, install CLI via `npm i -g @claywarren/vcl` and run `vcl ...` without local builds.

If you are exploring the codebase, the root `README.md` covers project structure and quick start commands. `AGENTS.md` remains in the root for contributor instructions.
