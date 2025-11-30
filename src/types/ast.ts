// AST node definitions for VCL v1.0
export type Identifier = { kind: 'Identifier'; name: string };
export type Literal =
  | { kind: 'NumberLiteral'; value: number }
  | { kind: 'StringLiteral'; value: string }
  | { kind: 'BooleanLiteral'; value: boolean }
  | { kind: 'NoneLiteral' };

export type Expression =
  | Identifier
  | Literal
  | BinaryExpression
  | CallExpression
  | FetchExpression
  | SendExpression
  | StoreExpression
  | EnsureExpression
  | ValidateExpression
  | ExpectExpression;

export type BinaryOperator =
  | 'plus'
  | 'minus'
  | 'times'
  | 'divided_by'
  | 'equal_to'
  | 'not_equal_to'
  | 'greater_than'
  | 'less_than';

export type BinaryExpression = {
  kind: 'BinaryExpression';
  operator: BinaryOperator;
  left: Expression;
  right: Expression;
};

export type CallExpression = {
  kind: 'CallExpression';
  callee: Identifier;
  args: Expression[];
};

export type FetchExpression = {
  kind: 'FetchExpression';
  target: string;
  qualifier?: string;
  into?: Identifier;
};

export type SendExpression = {
  kind: 'SendExpression';
  payload: Expression;
  target?: Expression;
};

export type StoreExpression = {
  kind: 'StoreExpression';
  value: Expression;
  target?: Identifier;
};

export type EnsureExpression = {
  kind: 'EnsureExpression';
  condition: Expression;
};

export type ValidateExpression = {
  kind: 'ValidateExpression';
  condition: Expression;
};

export type ExpectExpression = {
  kind: 'ExpectExpression';
  condition: Expression;
};

export type Statement =
  | LetStatement
  | ReturnStatement
  | StopStatement
  | IfStatement
  | ForEachStatement
  | RepeatStatement
  | FunctionDef
  | EventHandler
  | ImportStatement
  | ExpressionStatement;

export type Block = { kind: 'Block'; statements: Statement[] };

export type LetStatement = {
  kind: 'LetStatement';
  id: Identifier;
  value: Expression;
  typeAnnotation?: string;
};

export type ReturnStatement = { kind: 'ReturnStatement'; value?: Expression };
export type StopStatement = { kind: 'StopStatement'; value: Expression };

export type IfStatement = {
  kind: 'IfStatement';
  condition: Expression;
  then: Block;
  otherwise?: Block;
};

export type ForEachStatement = {
  kind: 'ForEachStatement';
  item: Identifier;
  collection: Expression;
  body: Block;
};

export type RepeatStatement = {
  kind: 'RepeatStatement';
  times: Expression;
  body: Block;
};

export type FunctionDef = {
  kind: 'FunctionDef';
  name: Identifier;
  params?: Identifier[];
  body: Block;
};

export type EventHandler = {
  kind: 'EventHandler';
  event: string;
  body: Block;
};

export type ImportStatement = {
  kind: 'ImportStatement';
  source: string;
  alias?: string;
};

export type ExpressionStatement = { kind: 'ExpressionStatement'; expression: Expression };

export type Program = { kind: 'Program'; body: Statement[] };
