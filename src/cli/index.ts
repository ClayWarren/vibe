#!/usr/bin/env node
import { Command } from 'commander';
import { readFileSync } from 'fs';
import { parse } from '../parser/index.js';
import { lowerProgram } from '../ir/index.js';
import { emitTypeScript } from '../transpilers/typescript.js';

const program = new Command();
program.name('vcl').description('Vibe Coding Language compiler').version('0.1.0');

program
  .command('compile')
  .argument('<file>', 'VCL source file')
  .option('--target <target>', 'ts|rust', 'ts')
  .action((file, options) => {
    const source = readFileSync(file, 'utf8');
    const ast = parse(source);
    const ir = lowerProgram(ast);
    const code = options.target === 'rust' ? '/* rust */' : emitTypeScript(ir);
    process.stdout.write(code + '\n');
  });

program
  .command('repl')
  .description('Start interactive VCL shell')
  .action(async () => {
    const { startRepl } = await import('../repl.js');
    await startRepl();
  });

program.parse();
