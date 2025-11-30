# VCL Language Philosophy

- **Intent over syntax**: code reads like instructions but maps deterministically.
- **AI-native**: grammar is strict enough for tooling, forgiving enough for generation.
- **Zero-symbol mindset**: periods end statements; indentation shapes blocks.
- **Safety by construction**: explicit `stop` for errors, `ensure/validate/expect` for guards.
- **Async by default**: I/O verbs imply awaitable operations.
