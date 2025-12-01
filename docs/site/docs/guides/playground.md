# Playground

A Vite-powered playground lives in `web/` for interactive compilation to TypeScript/Rust.

## Run locally

```bash
cd web
pnpm install   # first time only
pnpm run dev   # opens on http://localhost:5173
```

Features:

- Monaco editor with VCL syntax highlighting (tokenizer-driven)
- Live compile to TypeScript and Rust side-by-side
- Preview of runtime logs

## Troubleshooting

- Ensure the root project is built (`pnpm run build` at repo root) so the playground can import the latest dist artifacts.
- Node 24 recommended; 20+ works.
