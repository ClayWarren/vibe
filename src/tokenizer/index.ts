import { createToken, Lexer, type IToken } from 'chevrotain';
import { Token } from './types.js';

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
  'as',
  'ensure',
  'validate',
  'expect',
  'use',
  'import',
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

const Newline = createToken({ name: 'Newline', pattern: /\r?\n/, line_breaks: true });
const Comment = createToken({ name: 'Comment', pattern: /#.*/ });
const WS = createToken({ name: 'WS', pattern: /[ \t]+/, group: Lexer.SKIPPED });
const Dot = createToken({ name: 'Dot', pattern: /\./ });
const Colon = createToken({ name: 'Colon', pattern: /:/ });
const Equals = createToken({ name: 'Equals', pattern: /=/ });
const StringLiteral = createToken({
  name: 'StringLiteral',
  // allow multiline strings with escapes
  pattern: /"(?:[^"\\]|\\.|\\\n)*"|'(?:[^'\\]|\\.|\\\n)*'/,
  line_breaks: true,
});
const NumberLiteral = createToken({ name: 'NumberLiteral', pattern: /\d+(?:\.\d+)?/ });
const Identifier = createToken({ name: 'Identifier', pattern: /[A-Za-z0-9_\/-]+/ });
const Operator = createToken({
  name: 'Operator',
  pattern: new RegExp(`(?:${operatorList.join('|')})\\b`),
  longer_alt: Identifier,
});
const Keyword = createToken({
  name: 'Keyword',
  pattern: new RegExp(`(?:${keywordList.join('|')})\\b`),
  longer_alt: Identifier,
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

export const tokenVocabulary = {
  Newline,
  Indent: createToken({ name: 'Indent', pattern: Lexer.NA }),
  Dedent: createToken({ name: 'Dedent', pattern: Lexer.NA }),
  EOF: createToken({ name: 'EOF', pattern: Lexer.NA }),
  Dot,
  Colon,
  Equals,
  StringLiteral,
  NumberLiteral,
  Operator,
  Keyword,
  Identifier,
  allTokens: [] as any[],
};

tokenVocabulary.allTokens = [
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
  tokenVocabulary.Indent,
  tokenVocabulary.Dedent,
  tokenVocabulary.EOF,
];

export function tokenize(source: string): Token[] {
  const chev = tokenizeChevrotain(source);
  return chev.map((t) => {
    const type = toType(t.tokenType);
    const value =
      type === 'string' ? stripQuotes(t.image) : t.image;
    return { type, value, line: t.startLine!, column: t.startColumn! };
  });
}

export function tokenizeChevrotain(source: string): IToken[] {
  const lines = source.replace(/\r\n?/g, '\n').split('\n');
  const tokens: IToken[] = [];
  const indentStack = [0];
  lines.forEach((line, idx) => {
    const lineNo = idx + 1;
    if (line.trim() === '' || line.trim().startsWith('#')) return;
    const indent = line.match(/^ */)?.[0].length ?? 0;
    const currentIndent = indentStack[indentStack.length - 1];
    if (indent > currentIndent) {
      indentStack.push(indent);
      tokens.push(makeVirtual(tokenVocabulary.Indent, lineNo, 1));
    } else {
      while (indent < indentStack[indentStack.length - 1]) {
        indentStack.pop();
        tokens.push(makeVirtual(tokenVocabulary.Dedent, lineNo, 1));
      }
    }
    const segment = line.slice(indent);
    const lexResult = lineLexer.tokenize(segment);
    if (lexResult.errors.length) throw new Error(`Lexing error at line ${lineNo}: ${lexResult.errors[0].message}`);
    for (const tk of lexResult.tokens) {
      if (tk.tokenType === Newline || tk.tokenType === Comment) continue;
      tk.startLine = lineNo;
      tk.startColumn = indent + tk.startOffset + 1;
      tokens.push(tk);
    }
    tokens.push(makeVirtual(Newline, lineNo, line.length + 1));
  });
  while (indentStack.length > 1) {
    indentStack.pop();
    tokens.push(makeVirtual(tokenVocabulary.Dedent, lines.length, 1));
  }
  tokens.push(makeVirtual(tokenVocabulary.EOF, lines.length + 1, 1));
  return tokens;
}

function makeVirtual(tokenType: any, line: number, column: number): IToken {
  return { image: '', startOffset: 0, tokenType, startLine: line, startColumn: column } as IToken;
}

function toType(tokenType: any): Token['type'] {
  switch (tokenType) {
    case tokenVocabulary.Newline:
      return 'newline';
    case tokenVocabulary.Indent:
      return 'indent';
    case tokenVocabulary.Dedent:
      return 'dedent';
    case tokenVocabulary.EOF:
      return 'eof';
    case tokenVocabulary.Dot:
      return 'dot';
    case tokenVocabulary.Colon:
      return 'colon';
    case tokenVocabulary.Equals:
      return 'equals';
    case tokenVocabulary.StringLiteral:
      return 'string';
    case tokenVocabulary.NumberLiteral:
      return 'number';
    case tokenVocabulary.Operator:
      return 'operator';
    case tokenVocabulary.Keyword:
      return 'keyword';
    case tokenVocabulary.Identifier:
      return 'identifier';
    default:
      return 'identifier';
  }
}

function stripQuotes(image: string): string {
  const inner = image.slice(1, -1);
  return inner.replace(/\\(.)/g, (_m, ch) => {
    switch (ch) {
      case 'n':
        return '\n';
      case 'r':
        return '\r';
      case 't':
        return '\t';
      case '"':
        return '"';
      case "'":
        return "'";
      case '\\':
        return '\\';
      default:
        return ch;
    }
  });
}
