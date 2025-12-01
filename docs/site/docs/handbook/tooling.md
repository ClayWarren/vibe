# Tooling & Workflow

## CLI (quick view)
- Build: `pnpm run build` (project) or `node dist/cli/index.js compile <file> --target ts --with-stdlib`.
- Run: `node dist/cli/index.js run <file> --event "http GET /health" [--vm]`.
- Lint/format: `node dist/cli/index.js lint <file>` and `format` (formatter enforces trailing dots / indent).
- REPL: `node dist/cli/index.js repl` (prints TS preview inline).

See full details in [CLI](/cli).

## VS Code
- VCL language extension: syntax highlighting, icons, snippets.
- File association: `*.vcl` → `VCL` language; workspace sets this already.
- “Copy as Markdown for LLMs” button in docs for easy context sharing.

## Build targets
- TypeScript (default): plugs into TS/Node/Next pipelines.
- Rust emitter: experimental, for systems use.
- VM / interpreter: choose at runtime via `--vm`.

## Dev loop
1) `pnpm dev` (project) or `pnpm dev` + `pnpm vcl:build --watch` if you add a watch script.
2) Run unit tests against compiled TS; mock the runtime interface for effects.

## Source maps
- TS emitter can produce source maps (see `spec` and CLI flags). Useful for debugging in Node/Next.
