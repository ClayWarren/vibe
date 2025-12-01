# CLI

The `vcl` CLI lives in `dist/cli/index.js` and is wired via Commander. Use `pnpm vcl ...` if you add a bin entry, or run directly with Node.

## Commands

- `vcl compile <file> [--target ts|rust] [--sourcemap <file>] [--dts <file>] [--with-stdlib]`
  - Parses, links imports, lowers to IR, and emits TS (default) or Rust.
  - `--dts <file>` emits declarations with `VclRuntime`, `VclContext`, and handler signatures `(ctx?: VclContext) => Promise<any>`.
- `vcl run <file> [--event <name>] [--vm]`
  - Runs an event handler either via interpreter (default) or VM (`--vm`).
- `vcl repl`
  - Interactive shell that echoes a TS preview while you type VCL.
- `vcl format <file> [--write]`
  - Emits formatted VCL (enforces periods/indent). Writes in-place with `--write`.
- `vcl lint <file> [--strict]`
  - Syntax + basic semantic checks (undefined identifiers in strict mode, simple type checks, effect misuse).
- `vcl check <file> [--strict]`
  - Alias of `lint`; defaults to strict=true.
- `vcl format <file> [--write]`
  - Formats VCL (enforces trailing dots / indent).
- `vcl test <file> [--event <name>] [--handler <name>] [--data <json>] [--expect <json>]`
  - Runs a handler via the interpreter; pass data context with `--data`, optionally assert the JSON result.
- `vcl install <name> [--version <range>] [--registry <dir|url>]`
  - Fetches and extracts a VCL module into `vcl_modules/<name>/` and updates `vcl.json`.
- `vcl publish [--registry <dir>]`
  - Copies the current module (from `vcl.json`) into a local registry directory (default `.vcl-registry`).
- `vcl init <name> [--version]`
  - Creates a `vcl.json` manifest for the current folder.
- `vcl lsp`
  - Tiny completion-only LSP-style server over stdio.

## Examples

Compile with stdlib prepended:

```bash
node dist/cli/index.js compile examples/user_profile.vcl --with-stdlib > out.ts
```

Run through the interpreter:

```bash
node dist/cli/index.js run examples/webapp.vcl --event "http GET /api/health"
```

Run through the VM:

```bash
node dist/cli/index.js run examples/webapp.vcl --event "http GET /api/health" --vm
```

Publish to a local registry dir:

```bash
node dist/cli/index.js publish --registry ../my-registry
```

## Node version

Use Node 24 (tested) or >=20. The repo uses `pnpm`; run `pnpm install && pnpm run build` first.
