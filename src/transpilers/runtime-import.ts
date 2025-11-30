// Helper to emit runtime import for TS/Rust targets.
export function tsRuntimeImport(): string {
  return `import * as runtime from '../runtime/index.js';`;
}

export function rustRuntimeImport(): string {
  return `use runtime::*;`;
}
