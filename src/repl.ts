import readline from 'readline';
import { parse } from './parser/index.js';
import { lowerProgram } from './ir/index.js';
import { emitTypeScript } from './transpilers/typescript.js';
import { runEvent } from './runtime/interpreter.js';
import { configureRuntime } from './runtime/index.js';

export async function startRepl() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'vcl> ',
  });
  configureRuntime({
    fetch: () => [],
    send: () => {},
    store: () => {},
    log: () => {},
  });
  rl.prompt();
  rl.on('line', (line) => {
    try {
      const ast = parse(line);
      const ir = lowerProgram(ast);
      const { code } = emitTypeScript(ir);
      console.log('// ts preview');
      console.log(code);
      // execute if it's a single handler or return
      const event = (ast.body[0] as any)?.event ?? '';
      const res = event ? runEvent(ast as any, event, { data: {} }) : null;
      Promise.resolve(res).then((r) => {
        if (r) console.log('// result', r);
        rl.prompt();
      });
      return;
    } catch (err) {
      console.error((err as Error).message);
    }
    rl.prompt();
  });
}
