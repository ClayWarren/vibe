# Quickstart

## Prereqs
- Node >= 20 (tested on 24)

## Install CLI
```bash
npm i -g @claywarren/vcl
```

Or from source (if you cloned the repo):
```bash
nvm use 24
pnpm install
pnpm run build
```

## Compile
```bash
# TypeScript target with stdlib
node dist/cli/index.js compile examples/user_profile.vcl --target ts --with-stdlib

# Rust target
node dist/cli/index.js compile examples/user_profile.vcl --target rust
```

## Run
```bash
# Interpreter
node dist/cli/index.js run examples/webapp.vcl --event "http GET /api/health"

# VM
node dist/cli/index.js run examples/webapp.vcl --event "http GET /api/health" --vm
```

## Install a module
```bash
node dist/cli/index.js install localpkg --registry .vcl-registry-test
```

## Publish to local registry
```bash
node dist/cli/index.js publish --registry .vcl-registry
```
