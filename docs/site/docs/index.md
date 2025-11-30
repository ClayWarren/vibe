# Vibe Coding Language (VCL)

VCL is an indentation-first, English-like language that compiles to TypeScript, Rust, or runs on a lightweight VM. It aims to be the next step beyond TypeScript for AI-native, readable code.

- Deterministic blocks via indent + trailing dots
- Natural verbs: fetch/send/store/ensure/validate/expect
- Multiple targets: TS, Rust, WASM stub, VM/interpreter
- Module system with namespacing and registry publish/install

📦 Install & build
```bash
pnpm install
pnpm run build
```

🚀 Compile & run
```bash
node dist/cli/index.js compile examples/user_profile.vcl --target ts --with-stdlib
node dist/cli/index.js run examples/webapp.vcl --event "http GET /api/health"
node dist/cli/index.js run examples/webapp.vcl --event "http GET /api/health" --vm
```

🧠 Learn more
- [Quickstart](/quickstart)
- [Language Spec](/spec)
- [Stdlib](/stdlib)
- [Runtime](/runtime)
- [CLI](/cli)
- [VM](/vm)
- [Playground](/playground)
