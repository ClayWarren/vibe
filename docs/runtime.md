# Runtime Reference (draft)

The runtime adapts natural verbs to host capabilities. Suggested TypeScript shape:

```ts
interface Runtime {
  fetch(target: string, qualifier?: string): Promise<unknown>;
  send(target: string, payload: unknown): Promise<void>;
  store(target: string, payload: unknown): Promise<void>;
  log(value: unknown): void;
}
```

The transpiler currently expects a global `runtime` namespace; wiring should be injected per target.
