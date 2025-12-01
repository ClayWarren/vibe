import {
  createConnection,
  TextDocuments,
  DiagnosticSeverity,
  ProposedFeatures,
  InitializeParams,
  CompletionItem,
  CompletionItemKind,
  TextDocumentSyncKind,
  TextEdit,
  Position,
  DocumentFormattingParams,
} from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const connection = createConnection(ProposedFeatures.all);
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);
let workspaceRoot: string | null = null;

const KEYWORDS = ['define', 'when', 'else', 'ensure', 'validate', 'expect', 'return', 'stop', 'let', 'every', 'fetch', 'send', 'store', 'log'];

connection.onInitialize((params: InitializeParams) => {
  workspaceRoot = params.rootUri ? fileURLToPath(params.rootUri) : null;
  return {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
      completionProvider: { resolveProvider: false },
      documentFormattingProvider: true,
    },
  };
});

connection.onCompletion((): CompletionItem[] => {
  return KEYWORDS.map((k) => ({ label: k, kind: CompletionItemKind.Keyword }));
});

documents.onDidChangeContent((change) => {
  validateTextDocument(change.document);
});

connection.onDocumentFormatting((params: DocumentFormattingParams): TextEdit[] => {
  const doc = documents.get(params.textDocument.uri);
  if (!doc) return [];
  const formatted = runCli(['format'], doc.getText(), doc.uri);
  if (!formatted) return [];
  const start = Position.create(0, 0);
  const end = doc.positionAt(doc.getText().length);
  return [TextEdit.replace({ start, end }, formatted.endsWith('\n') ? formatted : formatted + '\n')];
});

async function validateTextDocument(textDocument: TextDocument): Promise<void> {
  const output = runCli(['lint'], textDocument.getText(), textDocument.uri);
  const diagnostics = output
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      // expect format: lint: message (no positions today)
      const msg = line.replace(/^lint:\s*/i, '');
      return {
        severity: DiagnosticSeverity.Error,
        range: {
          start: textDocument.positionAt(0),
          end: textDocument.positionAt(0),
        },
        message: msg,
        source: 'vcl',
      };
    });
  connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
}

function runCli(args: string[], stdin: string, uri: string): string {
  const cwd = workspaceRoot || process.cwd();
  const cli = path.join(cwd, 'dist', 'cli', 'index.js');
  if (!fs.existsSync(cli)) return '';
  const res = spawnSync('node', [cli, ...args, '--'], {
    cwd,
    input: stdin,
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
  });
  if (res.status !== 0) {
    return res.stderr?.toString() || '';
  }
  return res.stdout?.toString() || '';
}

documents.listen(connection);
connection.listen();
