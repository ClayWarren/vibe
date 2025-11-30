import readline from 'readline';
import { parse } from './parser/index.js';
import { lowerProgram } from './ir/index.js';
import { emitTypeScript } from './transpilers/typescript.js';

export async function startRepl() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'vcl> ',
  });
  rl.prompt();
  rl.on('line', (line) => {
    try {
      const ast = parse(line);
      const ir = lowerProgram(ast);
      const code = emitTypeScript(ir);
      console.log(code);
    } catch (err) {
      console.error((err as Error).message);
    }
    rl.prompt();
  });
}
