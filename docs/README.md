# VCL Documentation

Use these short guides as entry points:

- [Language Philosophy](philosophy.md) – design principles that shape syntax and tooling choices.
- [Standard Library (draft)](stdlib.md) – core verbs and planned collection/time helpers.
- [Runtime Reference (draft)](runtime.md) – expected host runtime surface area for transpiled code.
- [Roadmap](roadmap.md) – versioned milestones for the compiler, runtime, and tooling.
- Registry: optional; the CLI now prefers bundled/npm modules. Keep `VCL_REGISTRY` if you host your own or want a local mirror.
- Node version: use Node 24 (`nvm use 24`); Node 20+ works.
- npm: install the CLI with `npm i -g @claywarren/vcl` and run `vcl ...` without building from source.

If you are exploring the codebase, the root `README.md` covers project structure and quick start commands. `AGENTS.md` remains in the root for contributor instructions.
