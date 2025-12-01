# VCL Language Support (VS Code)

Features:
- Syntax highlighting for `.vcl`
- LSP server: diagnostics via `vcl lint`, keyword completions, format provider (calls `vcl format`)
- Command: compile-to-TS (`VCL: Compile to TypeScript`)
- Icon theme: choose "VCL Icons" in VS Code to get a custom file icon for `.vcl` files

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

Enable the icon theme in VS Code:
- Ctrl/Cmd+K Ctrl/Cmd+T → select "VCL Icons"

Package (optional):
```bash
pnpm dlx @vscode/vsce package
```
