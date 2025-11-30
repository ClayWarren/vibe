#!/usr/bin/env node
import { Command } from 'commander';
import { readFileSync, writeFileSync } from 'fs';
import { parse } from '../parser/index.js';
import { lowerProgram } from '../ir/index.js';
import { emitTypeScript } from '../transpilers/typescript.js';
import { emitRust } from '../transpilers/rust.js';
import { runEvent } from '../runtime/interpreter.js';

const program = new Command();
program.name('vcl').description('Vibe Coding Language compiler').version('0.1.0');

program
  .command('compile')
  .argument('<file>', 'VCL source file')
  .option('--target <target>', 'ts|rust', 'ts')
  .option('--sourcemap <file>', 'output source map (ts only)')
  .option('--with-stdlib', 'prepend stdlib imports')
  .action((file, options) => {
    const source = readFileSync(file, 'utf8');
    const stdlibImport = options.withStdlib ? 'import stdlib.\n' : '';
    const ast = parse(stdlibImport + source);
    const { linkProgram } = require('../module/linker.js');
    const linked = linkProgram(ast, process.cwd());
    const ir = lowerProgram(linked);
    if (options.target === 'rust') {
      const code = emitRust(ir);
      process.stdout.write(code + '\n');
    } else {
      const { code, map } = emitTypeScript(ir, { withMap: Boolean(options.sourcemap) });
      process.stdout.write(code + '\n');
      if (options.sourcemap) {
        writeFileSync(options.sourcemap, JSON.stringify(map, null, 2), 'utf8');
      }
    }
  });

program
  .command('repl')
  .description('Start interactive VCL shell')
  .action(async () => {
    const { startRepl } = await import('../repl.js');
    await startRepl();
  });

program
  .command('format')
  .description('Format a VCL file')
  .argument('<file>', 'VCL source file')
  .option('--write', 'overwrite the file')
  .action((file, options) => {
    const { emitVcl } = require('../emitter/vcl.js');
    const src = readFileSync(file, 'utf8');
    const formatted = emitVcl(parse(src));
    if (options.write) {
      writeFileSync(file, formatted + '\n', 'utf8');
    } else {
      process.stdout.write(formatted + '\n');
    }
  });

program
  .command('lint')
  .description('Lint a VCL file for syntax/semantic issues')
  .argument('<file>', 'VCL source file')
  .action((file) => {
    const { checkProgram } = require('../semantic/check.js');
    try {
      const src = readFileSync(file, 'utf8');
      const ast = parse(src);
      const issues = checkProgram(ast);
      if (issues.length) {
        issues.forEach((i: any) => console.error(`lint: ${i.message}`));
        process.exitCode = 1;
      }
    } catch (err) {
      console.error((err as Error).message);
      process.exitCode = 1;
    }
  });

program
  .command('lsp')
  .description('Start a minimal LSP-like stub (completion only)')
  .action(async () => {
    console.log('VCL LSP stub: provides keyword completion via stdio.');
    const keywords = ['let', 'define', 'when', 'if', 'else', 'for', 'repeat', 'return', 'stop', 'fetch', 'send', 'store', 'ensure', 'validate', 'expect', 'every'];
    process.stdin.on('data', (buf) => {
      const input = buf.toString().trim();
      const matches = keywords.filter((k) => k.startsWith(input));
      process.stdout.write(JSON.stringify({ completions: matches }) + '\n');
    });
  });

program
  .command('install')
  .description('Add a dependency to vcl.json')
  .argument('<name>', 'package name')
  .option('--version <version>', 'version range', 'latest')
  .option('--registry <url>', 'override registry base URL')
  .action(async (name, opts) => {
    const { install } = require('../pm/index.js');
    await install(name, opts.version, process.cwd(), opts.registry);
  });

program
  .command('init')
  .description('Create vcl.json manifest')
  .argument('<name>', 'project name')
  .option('--version <version>', 'project version', '0.1.0')
  .action((name, opts) => {
    const { writeManifest } = require('../pm/index.js');
    writeManifest({ name, version: opts.version });
    console.log('Created vcl.json');
  });

program
  .command('publish')
  .description('Publish current module to a registry directory')
  .option('--registry <dir>', 'registry directory', '.vcl-registry')
  .action((opts) => {
    const { publishModule } = require('../module/registry.js');
    publishModule(process.cwd(), opts.registry);
  });

program
  .command('run')
  .description('Run a VCL file (interpreter or VM)')
  .argument('<file>', 'VCL source file')
  .option('--vm', 'use VM execution')
  .option('--event <name>', 'event name to invoke', 'http GET /')
  .action((file, opts) => {
    const src = readFileSync(file, 'utf8');
    const ast = parse(src);
    const { linkProgram } = require('../module/linker.js');
    const linked = linkProgram(ast, process.cwd());
    if (opts.vm) {
      const { lowerProgram } = require('../ir/index.js');
      const { compileIR } = require('../vm/compiler.js');
      const { runBytecode } = require('../vm/vm.js');
      const bc = compileIR(lowerProgram(linked));
      const res = runBytecode(bc, `on_${opts.event}`, {
        fetch: () => [],
        send: () => {},
        store: () => {},
        log: () => {},
      });
      console.log(JSON.stringify(res, null, 2));
    } else {
      runEvent(linked, opts.event, { data: {} }).then((r) => {
        console.log(JSON.stringify(r, null, 2));
      });
    }
  });

program.parse();
