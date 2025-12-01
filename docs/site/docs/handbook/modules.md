# Modules & Registry

## Imports and namespacing
- Use `foo::bar` style namespaces; the linker in VCL resolves module paths.
- Modules live under `vcl_modules/` by default when installed from the registry.

```text
import auth::session.

define handler.
  let user = auth::session::current ctx.
  ensure user.
  return user.
```

## Publishing & installing
- Local registry path defaults to `$HOME/.vcl-registry` (see README).
- `vcl publish` copies the current module (from `vcl.json`) into the registry.
- `vcl install <name>` pulls into `vcl_modules/<name>/` and updates `vcl.json`.

## Versioning
- Semantic versioning is recommended; the current registry is local-only. Remote registry is planned.

## Advice
- Keep module APIs small: prefer record params over many scalars.
- Re-export from `index.vcl` to give consumers stable entry points.

See also: [Stdlib](/stdlib) for shipped modules and [CLI](/cli) for publish/install commands.
