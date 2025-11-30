export type TokenType =
  | 'keyword'
  | 'identifier'
  | 'number'
  | 'string'
  | 'newline'
  | 'indent'
  | 'dedent'
  | 'dot'
  | 'colon'
  | 'equals'
  | 'operator'
  | 'eof';

export type Token = {
  type: TokenType;
  value?: string;
  line: number;
  column: number;
};

const KEYWORDS = new Set([
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
]);

const OPERATORS = new Set([
  'plus',
  'minus',
  'times',
  'divided_by',
  'equal_to',
  'not_equal_to',
  'greater_than',
  'less_than',
]);

export function tokenize(source: string): Token[] {
  const lines = source.replace(/\r\n?/g, '\n').split('\n');
  const tokens: Token[] = [];
  const indentStack = [0];

  for (let lineNo = 0; lineNo < lines.length; lineNo++) {
    const rawLine = lines[lineNo];
    if (rawLine.trim() === '' || rawLine.trim().startsWith('#')) continue;

    const indent = rawLine.match(/^ */)?.[0].length ?? 0;
    const currentIndent = indentStack[indentStack.length - 1];
    if (indent > currentIndent) {
      indentStack.push(indent);
      tokens.push({ type: 'indent', line: lineNo + 1, column: 1 });
    } else {
      while (indent < indentStack[indentStack.length - 1]) {
        indentStack.pop();
        tokens.push({ type: 'dedent', line: lineNo + 1, column: 1 });
      }
    }

    let i = indent;
    const line = rawLine;
    while (i < line.length) {
      const ch = line[i];
      if (ch === ' ' || ch === '\t') {
        i++;
        continue;
      }
      const column = i + 1;
      if (ch === '#') break;
      if (ch === '.') {
        tokens.push({ type: 'dot', line: lineNo + 1, column });
        i++;
        continue;
      }
      if (ch === ':') {
        tokens.push({ type: 'colon', line: lineNo + 1, column });
        i++;
        continue;
      }
      if (ch === '=') {
        tokens.push({ type: 'equals', line: lineNo + 1, column });
        i++;
        continue;
      }
      if (ch === '"') {
        let j = i + 1;
        let value = '';
        while (j < line.length && line[j] !== '"') {
          value += line[j];
          j++;
        }
        tokens.push({ type: 'string', value, line: lineNo + 1, column });
        i = j + 1;
        continue;
      }
      if (/\d/.test(ch)) {
        let j = i;
        while (j < line.length && /[\d.]/.test(line[j])) j++;
        const value = line.slice(i, j);
        tokens.push({ type: 'number', value, line: lineNo + 1, column });
        i = j;
        continue;
      }
      // identifier / keyword / operator
      let j = i;
      while (j < line.length && /[A-Za-z_]/.test(line[j])) j++;
      const word = line.slice(i, j);
      if (OPERATORS.has(word)) {
        tokens.push({ type: 'operator', value: word, line: lineNo + 1, column });
      } else if (KEYWORDS.has(word)) {
        tokens.push({ type: 'keyword', value: word, line: lineNo + 1, column });
      } else {
        tokens.push({ type: 'identifier', value: word, line: lineNo + 1, column });
      }
      i = j;
    }
    tokens.push({ type: 'newline', line: lineNo + 1, column: line.length + 1 });
  }

  while (indentStack.length > 1) {
    indentStack.pop();
    tokens.push({ type: 'dedent', line: lines.length, column: 1 });
  }

  tokens.push({ type: 'eof', line: lines.length + 1, column: 1 });
  return tokens;
}
