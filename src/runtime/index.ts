// Pluggable runtime. Default in-memory adapters are provided for tests.
type FetchFn = (target: string, qualifier?: string) => Promise<unknown> | unknown;
type SendFn = (payload: unknown, target?: unknown) => Promise<void> | void;
type StoreFn = (value: unknown, target?: string) => Promise<void> | void;
type LogFn = (value: unknown) => void;

export type RuntimeAdapters = {
  fetch?: FetchFn;
  send?: SendFn;
  store?: StoreFn;
  log?: LogFn;
};

const memory: Record<string, unknown[]> = {};

const defaultAdapters: Required<RuntimeAdapters> = {
  fetch: (target, _qualifier) => memory[target] ?? [],
  send: (_payload, _target) => {},
  store: (value, target = 'default') => {
    memory[target] = memory[target] ?? [];
    (memory[target] as unknown[]).push(value);
  },
  log: (v) => console.log(v),
};

let adapters: Required<RuntimeAdapters> = { ...defaultAdapters };

export function configureRuntime(overrides: RuntimeAdapters) {
  adapters = { ...defaultAdapters, ...overrides };
}

export async function fetch(target: string, qualifier?: string) {
  return adapters.fetch(target, qualifier);
}

export async function send(payload: unknown, target?: unknown) {
  return adapters.send(payload, target);
}

export async function store(value: unknown, target?: string) {
  return adapters.store(value, target);
}

export function log(message: unknown) {
  adapters.log(message);
}

export function ensure(condition: unknown) {
  if (!condition) throw new Error('ensure failed');
}

export function validate(condition: unknown) {
  if (!condition) throw new Error('validation failed');
}

export function expect(condition: unknown) {
  if (!condition) throw new Error('expectation failed');
}

export const runtime = {
  fetch,
  send,
  store,
  log,
  ensure,
  validate,
  expect,
};
