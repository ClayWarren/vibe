# CLI Workflows

Common CLI commands for everyday work.

## Lint / check
- `vcl lint <file>` — syntax + basic semantic checks (undefined ids, simple type checks, effect misuse).
- `vcl check <file>` — same as lint; stricter rules will land here over time.

## Format
- `vcl format <file> [--write]` — enforce trailing dots / indent; writes back with `--write`.

## Test (lightweight)
- `vcl test <file> [--event <name>] [--expect <json>]`
  - Runs a handler via the interpreter and optionally asserts the JSON result.
  - Example: `vcl test examples/webapp.vcl --event "http GET /health" --expect '{"status":200}'`

## Compile
- `vcl compile <file> --target ts|rust [--with-stdlib] [--sourcemap <file>]`

## Run
- `vcl run <file> [--event <name>] [--vm]`

## Publish / install
- `vcl publish --registry <dir>`
- `vcl install <name> [--version <range>] [--registry <dir|url>]`
