import * as vscode from 'vscode';
import * as path from 'path';
import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind } from 'vscode-languageclient/node.js';

let client: LanguageClient | undefined;

export function activate(context: vscode.ExtensionContext) {
  const serverModule = context.asAbsolutePath(path.join('out', 'server.js'));
  const serverOptions: ServerOptions = {
    run: { module: serverModule, transport: TransportKind.ipc },
    debug: { module: serverModule, transport: TransportKind.ipc },
  };

  const clientOptions: LanguageClientOptions = {
    documentSelector: [{ scheme: 'file', language: 'vcl' }],
    synchronize: {
      fileEvents: vscode.workspace.createFileSystemWatcher('**/*.vcl'),
    },
  };

  client = new LanguageClient('vclLanguageServer', 'VCL Language Server', serverOptions, clientOptions);
  client.start();

  // Compile command (TS target) remains as an extra convenience
  context.subscriptions.push(
    vscode.commands.registerCommand('vcl.compile', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;
      const file = editor.document.fileName;
      const cli = path.join(vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || process.cwd(), 'dist', 'cli', 'index.js');
      const cp = require('child_process').spawnSync('node', [cli, 'compile', file, '--target', 'ts', '--with-stdlib'], {
        cwd: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath,
        encoding: 'utf8',
      });
      if (cp.status !== 0) {
        vscode.window.showErrorMessage(cp.stderr || 'vcl compile failed');
        return;
      }
      const outPath = file.replace(/\.vcl$/i, '.gen.ts');
      await vscode.workspace.fs.writeFile(vscode.Uri.file(outPath), Buffer.from(cp.stdout, 'utf8'));
      vscode.window.showInformationMessage(`VCL compiled to ${outPath}`);
    })
  );
}

export function deactivate(): Thenable<void> | undefined {
  if (!client) {
    return undefined;
  }
  return client.stop();
}
