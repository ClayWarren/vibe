# VCL Language Support (VS Code)

Features:
- Syntax highlighting for `.vcl`
- LSP server: diagnostics via `vcl lint`, keyword completions, format provider (calls `vcl format`)
- Command: compile-to-TS (`VCL: Compile to TypeScript`)

Requirements:
- Workspace built with `pnpm run build` so `dist/cli/index.js` exists.
- `VCL_REGISTRY` set if you use imports.

Usage:
- Run the commands from the Command Palette.
- Compile writes a sibling `*.gen.ts` file.

Build the extension:
```bash
cd vscode-extension
pnpm install
pnpm run compile
```

Package (optional):
```bash
pnpm dlx @vscode/vsce package
```
