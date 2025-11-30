import { createToken, Lexer, type ILexingResult } from 'chevrotain';
import { TokenType as TT, Token } from './types.js';

// Token types to keep compatibility with existing parser
export type TokenType = TT;
export type { Token };

// Keywords and operators
const keywordList = [
  'let',
  'define',
  'when',
  'if',
  'else',
  'end',
  'for',
  'each',
  'in',
  'repeat',
  'times',
  'return',
  'stop',
  'is',
  'none',
  'true',
  'false',
  'ensure',
  'validate',
  'expect',
  'use',
  'call',
  'with',
  'where',
  'into',
  'every',
  'fetch',
  'send',
  'to',
  'store',
  'get',
].sort((a, b) => b.length - a.length);

const operatorList = [
  'plus',
  'minus',
  'times',
  'divided_by',
  'equal_to',
  'not_equal_to',
  'greater_than',
  'less_than',
].sort((a, b) => b.length - a.length);

// Chevrotain token definitions
const Newline = createToken({ name: 'Newline', pattern: /\r?\n/, line_breaks: true });
const Comment = createToken({ name: 'Comment', pattern: /#.*/ });
const WS = createToken({ name: 'WS', pattern: /[ \t]+/, group: Lexer.SKIPPED });
const Dot = createToken({ name: 'Dot', pattern: /\./ });
const Colon = createToken({ name: 'Colon', pattern: /:/ });
const Equals = createToken({ name: 'Equals', pattern: /=/ });
const StringLiteral = createToken({
  name: 'StringLiteral',
  pattern: /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/,
});
const NumberLiteral = createToken({ name: 'NumberLiteral', pattern: /\d+(?:\.\d+)?/ });

const Identifier = createToken({ name: 'Identifier', pattern: /[A-Za-z0-9_\\/-]+/ });
const Operator = createToken({
  name: 'Operator',
  pattern: new RegExp(`(?:${operatorList.join('|')})\\b`),
});
const Keyword = createToken({
  name: 'Keyword',
  pattern: new RegExp(`(?:${keywordList.join('|')})\\b`),
});

const allTokens = [
  Comment,
  WS,
  Newline,
  Dot,
  Colon,
  Equals,
  StringLiteral,
  NumberLiteral,
  Operator,
  Keyword,
  Identifier,
];

const lineLexer = new Lexer(allTokens, { positionTracking: 'onlyStart' });

export function tokenize(source: string): Token[] {
  const lines = source.replace(/\r\n?/g, '\n').split('\n');
  const tokens: Token[] = [];
  const indentStack = [0];

  lines.forEach((line, idx) => {
    const lineNo = idx + 1;
    if (line.trim() === '' || line.trim().startsWith('#')) return;
    const indent = line.match(/^ */)?.[0].length ?? 0;
    const currentIndent = indentStack[indentStack.length - 1];
    if (indent > currentIndent) {
      indentStack.push(indent);
      tokens.push({ type: 'indent', line: lineNo, column: 1 });
    } else {
      while (indent < indentStack[indentStack.length - 1]) {
        indentStack.pop();
        tokens.push({ type: 'dedent', line: lineNo, column: 1 });
      }
    }

    const segment = line.slice(indent);
    const lexResult: ILexingResult = lineLexer.tokenize(segment);
    if (lexResult.errors.length) {
      throw new Error(`Lexing error at line ${lineNo}: ${lexResult.errors[0].message}`);
    }
    for (const tk of lexResult.tokens) {
      const column = indent + tk.startOffset + 1;
      switch (tk.tokenType) {
        case Dot:
          tokens.push({ type: 'dot', line: lineNo, column });
          break;
        case Colon:
          tokens.push({ type: 'colon', line: lineNo, column });
          break;
        case Equals:
          tokens.push({ type: 'equals', line: lineNo, column });
          break;
        case StringLiteral:
          tokens.push({ type: 'string', value: stripQuotes(tk.image), line: lineNo, column });
          break;
        case NumberLiteral:
          tokens.push({ type: 'number', value: tk.image, line: lineNo, column });
          break;
        case Operator:
          tokens.push({ type: 'operator', value: tk.image, line: lineNo, column });
          break;
        case Keyword:
          tokens.push({ type: 'keyword', value: tk.image, line: lineNo, column });
          break;
        case Identifier:
          tokens.push({ type: 'identifier', value: tk.image, line: lineNo, column });
          break;
        default:
          break;
      }
    }
    tokens.push({ type: 'newline', line: lineNo, column: line.length + 1 });
  });

  while (indentStack.length > 1) {
    indentStack.pop();
    tokens.push({ type: 'dedent', line: lines.length, column: 1 });
  }

  tokens.push({ type: 'eof', line: lines.length + 1, column: 1 });
  return tokens;
}

function stripQuotes(img: string): string {
  if (!img) return '';
  const quote = img[0];
  const inner = img.slice(1, -1);
  return inner.replace(/\\(.)/g, '$1');
}
