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
