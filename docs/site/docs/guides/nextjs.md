# Next.js Adapter (coming soon)

Goal: route VCL handlers through Next.js App Router.

Planned steps:
1) Compile VCL to TypeScript into `vcl-out/`.
2) Add `app/api/<route>/route.ts` that imports compiled handler (e.g., `on_http_GET_/hello`).
3) Wrap Next `Request` into the runtime shape `{ fetch, send, store?, log?, now? }` and return `NextResponse`.
4) Provide a template and a `pnpm dev` script that watches VCL + runs `next dev`.

We’ll ship a full example template here.
