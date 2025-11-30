// Minimal runtime hooks the transpilers expect.
export async function fetch(target: string, qualifier?: string) {
  console.log('fetch', target, qualifier ?? '');
  return [];
}

export async function send(target: string, payload: unknown) {
  console.log('send', target, payload);
}

export function log(message: unknown) {
  console.log(message);
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
