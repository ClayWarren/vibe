import * as vscode from 'vscode';
import { spawn } from 'child_process';
import path from 'path';

const KEYWORDS = ['define', 'when', 'else', 'ensure', 'validate', 'expect', 'return', 'stop', 'let', 'every', 'fetch', 'send', 'store', 'log'];

export function activate(context: vscode.ExtensionContext) {
  // Completion (keyword-level for now)
  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(
      { language: 'vcl' },
      {
        provideCompletionItems() {
          return KEYWORDS.map((k) => new vscode.CompletionItem(k, vscode.CompletionItemKind.Keyword));
        },
      },
      ...[' ']
    )
  );

  // Format command
  context.subscriptions.push(
    vscode.commands.registerCommand('vcl.format', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;
      const file = editor.document.fileName;
      try {
        const output = await runCli(['format', file]);
        const fullRange = new vscode.Range(
          editor.document.positionAt(0),
          editor.document.positionAt(editor.document.getText().length)
        );
        await editor.edit((edit) => edit.replace(fullRange, output.trimEnd() + '\n'));
      } catch (err) {
        vscode.window.showErrorMessage((err as Error).message);
      }
    })
  );

  // Lint command
  context.subscriptions.push(
    vscode.commands.registerCommand('vcl.lint', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;
      const file = editor.document.fileName;
      try {
        await runCli(['lint', file]);
        vscode.window.showInformationMessage('VCL lint: no issues');
      } catch (err) {
        vscode.window.showErrorMessage((err as Error).message);
      }
    })
  );

  // Compile command (TS target)
  context.subscriptions.push(
    vscode.commands.registerCommand('vcl.compile', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;
      const file = editor.document.fileName;
      try {
        const output = await runCli(['compile', file, '--target', 'ts', '--with-stdlib']);
        const outPath = file.replace(/\.vcl$/i, '.gen.ts');
        await vscode.workspace.fs.writeFile(vscode.Uri.file(outPath), Buffer.from(output, 'utf8'));
        vscode.window.showInformationMessage(`VCL compiled to ${outPath}`);
      } catch (err) {
        vscode.window.showErrorMessage((err as Error).message);
      }
    })
  );
}

export function deactivate() {}

async function runCli(args: string[]): Promise<string> {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  const cwd = workspaceFolders && workspaceFolders.length ? workspaceFolders[0].uri.fsPath : process.cwd();
  const cli = path.join(cwd, 'dist', 'cli', 'index.js');
  return new Promise((resolve, reject) => {
    const proc = spawn('node', [cli, ...args], { cwd, shell: false });
    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', (d) => (stdout += d.toString()));
    proc.stderr.on('data', (d) => (stderr += d.toString()));
    proc.on('close', (code) => {
      if (code === 0) resolve(stdout);
      else reject(new Error(stderr.trim() || `vcl CLI failed with code ${code}`));
    });
  });
}
