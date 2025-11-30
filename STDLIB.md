# VCL Standard Library (draft)

## Core verbs

- `fetch <target>`: async data retrieval; qualifiers: `where`, `sorted by`, `into`.
- `send <channel> to <target>`: notifications, email, webhooks.
- `store <value> into <target>`: persistence hook.
- `log <value>`: console or tracing sink.

## Collections

- `length of <collection>`
- `push <value> into <collection>`

## Time (planned)

- `now`, `today`, `sleep <duration>`

## Tasks

- `every <duration>:` block scheduling

Implementations are provided by the runtime layer; transpilers call runtime helpers.
