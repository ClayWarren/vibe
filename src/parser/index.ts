import { tokenize } from '../tokenizer/index.js';
import type { Token, TokenType } from '../tokenizer/index.js';
import type {
  Program,
  Statement,
  Expression,
  Identifier,
  Block,
  Literal,
  BinaryOperator,
} from '../types/ast.js';

export class Parser {
  private tokens: Token[] = [];
  private pos = 0;

  parse(source: string): Program {
    this.tokens = tokenize(source);
    this.pos = 0;
    const body: Statement[] = [];
    while (!this.is('eof')) {
      this.skipTrivia();
      if (this.is('eof')) break;
      const stmt = this.statement();
      if (stmt) body.push(stmt);
    }
    return { kind: 'Program', body };
  }

  private statement(): Statement {
    this.skipTrivia();
    if (this.matchKeyword('let')) return this.letStatement();
    if (this.matchKeyword('define')) return this.functionDef();
    if (this.matchKeyword('when')) return this.eventHandler();
    if (this.matchKeyword('if')) return this.ifStatement();
    if (this.matchKeyword('for')) return this.forEachStatement();
    if (this.matchKeyword('repeat')) return this.repeatStatement();
    if (this.matchKeyword('return')) return this.returnStatement();
    if (this.matchKeyword('stop')) return this.stopStatement();
    if (this.matchKeyword('call')) return this.callStatement();
    if (this.matchKeyword('ensure')) return this.ensureLike('EnsureExpression');
    if (this.matchKeyword('validate')) return this.ensureLike('ValidateExpression');
    if (this.matchKeyword('expect')) return this.ensureLike('ExpectExpression');
    // fallback expression statement
    const expr = this.expression();
    this.consume('dot');
    return { kind: 'ExpressionStatement', expression: expr };
  }

  private letStatement(): Statement {
    const id = this.identifier();
    this.consume('equals');
    const value = this.expression();
    this.consume('dot');
    return { kind: 'LetStatement', id, value };
  }

  private functionDef(): Statement {
    const name = this.identifier();
    this.consume('colon');
    const body = this.block();
    this.expectKeyword('end');
    this.consume('dot');
    return { kind: 'FunctionDef', name, body };
  }

  private eventHandler(): Statement {
    const event = this.consumeValue();
    this.consume('colon');
    const body = this.block();
    this.expectKeyword('end');
    this.consume('dot');
    return { kind: 'EventHandler', event: event ?? 'event', body };
  }

  private ifStatement(): Statement {
    const condition = this.expression();
    if (this.matchColon()) {
      const single = this.statement();
      return {
        kind: 'IfStatement',
        condition,
        then: { kind: 'Block', statements: [single] },
      };
    }
    this.consume('colon');
    const then = this.block();
    let otherwise: Block | undefined;
    if (this.matchKeyword('else')) {
      if (this.matchColon()) {
        otherwise = this.block();
      }
    }
    this.expectKeyword('end');
    this.consume('dot');
    return { kind: 'IfStatement', condition, then, otherwise };
  }

  private forEachStatement(): Statement {
    this.expectKeyword('each');
    const item = this.identifier();
    this.expectKeyword('in');
    const collection = this.expression();
    this.consume('colon');
    const body = this.block();
    this.expectKeyword('end');
    this.consume('dot');
    return { kind: 'ForEachStatement', item, collection, body };
  }

  private repeatStatement(): Statement {
    const times = this.expression();
    this.expectKeyword('times');
    this.consume('colon');
    const body = this.block();
    this.expectKeyword('end');
    this.consume('dot');
    return { kind: 'RepeatStatement', times, body };
  }

  private returnStatement(): Statement {
    const value = this.expression();
    this.consume('dot');
    return { kind: 'ReturnStatement', value };
  }

  private stopStatement(): Statement {
    if (this.matchKeyword('with')) {
      const valueWith = this.expression();
      this.consume('dot');
      return { kind: 'StopStatement', value: valueWith };
    }
    const value = this.expression();
    this.consume('dot');
    return { kind: 'StopStatement', value };
  }

  private block(): Block {
    const statements: Statement[] = [];
    this.skipTrivia();
    this.consume('indent');
    while (true) {
      this.skipTrivia();
      if (this.is('dedent')) break;
      statements.push(this.statement());
    }
    this.consume('dedent');
    return { kind: 'Block', statements };
  }

  private expression(): Expression {
    return this.binary();
  }

  private binary(): Expression {
    let left = this.primary();
    while (this.is('operator') || this.matchKeyword('is')) {
      let opToken: BinaryOperator | 'is' = 'is';
      if (this.is('operator')) {
        opToken = this.consume('operator').value as BinaryOperator;
      } else {
        // consumed 'is'
        if (this.is('operator')) {
          opToken = this.consume('operator').value as BinaryOperator;
        } else if (this.matchKeyword('none')) {
          left = {
            kind: 'BinaryExpression',
            operator: 'equal_to',
            left,
            right: { kind: 'NoneLiteral' },
          };
          continue;
        } else {
          const rightDefault = this.primary();
          left = { kind: 'BinaryExpression', operator: 'equal_to', left, right: rightDefault };
          continue;
        }
      }
      const right = this.primary();
      left = { kind: 'BinaryExpression', operator: opToken as BinaryOperator, left, right };
    }
    return left;
  }

  private primary(): Expression {
    if (this.matchKeyword('fetch')) return this.fetchExpression();
    if (this.matchKeyword('call')) return this.callExpression();
    if (this.is('identifier')) return this.identifier();
    if (this.is('number') || this.is('string')) return this.literal();
    if (this.matchKeyword('true')) return { kind: 'BooleanLiteral', value: true };
    if (this.matchKeyword('false')) return { kind: 'BooleanLiteral', value: false };
    if (this.matchKeyword('none')) return { kind: 'NoneLiteral' };
    throw this.error('Unexpected token in expression');
  }

  private fetchExpression(): Expression {
    const parts: string[] = [];
    while (this.is('identifier') || this.is('keyword')) {
      if (this.peek().type === 'keyword' && ['where', 'into'].includes(this.peek().value ?? '')) break;
      parts.push(this.consume(this.peek().type).value ?? '');
    }
    let qualifier: string | undefined;
    let into;
    if (this.matchKeyword('where')) {
      const qualParts: string[] = [];
      while (!this.is('dot') && !this.is('newline') && !this.is('indent') && !this.is('dedent')) {
        qualParts.push(this.consume(this.peek().type).value ?? '');
      }
      qualifier = qualParts.join(' ');
    }
    if (this.matchKeyword('into')) {
      into = this.identifier();
    }
    return { kind: 'FetchExpression', target: parts.join(' '), qualifier, into };
  }

  private callExpression(): Expression {
    const callee = this.identifier();
    const args: Expression[] = [];
    if (this.matchKeyword('with')) {
      args.push(this.expression());
    }
    return { kind: 'CallExpression', callee, args };
  }

  private literal(): Literal {
    const tok = this.consume(this.peek().type);
    if (tok.type === 'number') return { kind: 'NumberLiteral', value: Number(tok.value) };
    return { kind: 'StringLiteral', value: tok.value ?? '' };
  }

  private identifier(): Identifier {
    const tok = this.consume('identifier');
    return { kind: 'Identifier', name: tok.value ?? '' };
  }

  private consume(type: TokenType): Token {
    const tok = this.peek();
    if (tok.type !== type) throw this.error(`Expected ${type} but got ${tok.type}`);
    this.pos++;
    return tok;
  }

  private consumeValue(): string | undefined {
    const tok = this.consume(this.peek().type);
    return tok.value;
  }

  private matchKeyword(value: string): boolean {
    const tok = this.peek();
    if (tok.type === 'keyword' && tok.value === value) {
      this.pos++;
      return true;
    }
    return false;
  }

  private matchColon(): boolean {
    if (this.is('colon')) {
      this.pos++;
      return true;
    }
    return false;
  }

  private expectKeyword(value: string) {
    const tok = this.peek();
    if (tok.type !== 'keyword' || tok.value !== value) {
      throw this.error(`Expected keyword '${value}'`);
    }
    this.pos++;
  }

  private is(type: TokenType): boolean {
    return this.peek().type === type;
  }

  private skipTrivia() {
    while (this.is('newline') || this.is('dot')) {
      this.pos++;
    }
  }

  private callStatement(): Statement {
    const callee = this.identifier();
    const args: Expression[] = [];
    if (this.matchKeyword('with')) {
      args.push(this.expression());
    }
    this.consume('dot');
    return { kind: 'ExpressionStatement', expression: { kind: 'CallExpression', callee, args } };
  }

  private ensureLike(kind: 'EnsureExpression' | 'ValidateExpression' | 'ExpectExpression'): Statement {
    const condition = this.expression();
    this.consume('dot');
    return { kind: 'ExpressionStatement', expression: { kind, condition } as any };
  }

  private peek(): Token {
    return this.tokens[this.pos];
  }

  private error(message: string): Error {
    const tok = this.peek();
    return new Error(`${message} at line ${tok.line}, column ${tok.column}`);
  }
}

export const parse = (source: string) => new Parser().parse(source);
