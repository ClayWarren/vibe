import { tokenize } from '../tokenizer/index.js';
import type {
  Program,
  Statement,
  Expression,
  Identifier,
  Literal,
  BinaryOperator,
  BinaryExpression,
  Block,
} from '../types/ast.js';
import type { Token } from '../tokenizer/types.js';

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
    if (this.matchKeyword('use')) return this.useStatement();
    if (this.matchKeyword('define')) return this.functionDef();
    if (this.matchKeyword('every')) return this.scheduleHandler();
    if (this.matchKeyword('when')) return this.eventHandler();
    if (this.matchKeyword('if')) return this.ifStatement();
    if (this.matchKeyword('for')) return this.forEachStatement();
    if (this.matchKeyword('repeat')) return this.repeatStatement();
    if (this.matchKeyword('return')) return this.returnStatement();
    if (this.matchKeyword('stop')) return this.stopStatement();
    if (this.matchKeyword('call')) return this.callStatement();
    if (this.matchKeyword('send')) return this.sendStatement();
    if (this.matchKeyword('store')) return this.storeStatement();
    if (this.matchKeyword('ensure')) return this.ensureLike('EnsureExpression');
    if (this.matchKeyword('validate')) return this.ensureLike('ValidateExpression');
    if (this.matchKeyword('expect')) return this.ensureLike('ExpectExpression');
    // imports
    if (this.matchKeyword('import')) return this.importStmt();
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
    // optional parameters (space separated) until colon
    const params: Identifier[] = [];
    while (!this.is('colon')) {
      params.push(this.identifier());
    }
    this.consume('colon');
    const body = this.block();
    this.expectKeyword('end');
    this.consume('dot');
    return { kind: 'FunctionDef', name, params, body };
  }

  private eventHandler(): Statement {
    const parts: string[] = [];
    while (!this.is('colon')) {
      const tok = this.peek();
      if (tok.type === 'eof') break;
      parts.push(this.consume(tok.type).value ?? '');
    }
    this.consume('colon');
    const body = this.block();
    this.expectKeyword('end');
    this.consume('dot');
    return { kind: 'EventHandler', event: parts.join(' '), body };
  }

  private scheduleHandler(): Statement {
    const parts: string[] = ['every'];
    while (!this.is('colon')) {
      const tok = this.peek();
      if (tok.type === 'eof') break;
      parts.push(this.consume(tok.type).value ?? '');
    }
    this.consume('colon');
    const body = this.block();
    this.expectKeyword('end');
    this.consume('dot');
    return { kind: 'EventHandler', event: parts.join(' '), body };
  }

  private ifStatement(): Statement {
    const condition = this.expression();
    this.consume('colon');
    const inlineThen = !this.is('newline');
    let then: Block;
    if (inlineThen) {
      const stmt = this.statement();
      then = { kind: 'Block', statements: [stmt] };
    } else {
      then = this.block();
    }
    let otherwise: Block | undefined;
    if (this.matchKeyword('else')) {
      this.consume('colon');
      const inlineElse = !this.is('newline');
      if (inlineElse) {
        otherwise = { kind: 'Block', statements: [this.statement()] };
      } else {
        otherwise = this.block();
      }
    }
    if (!inlineThen || otherwise) {
      this.expectKeyword('end');
      this.consume('dot');
    }
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
    const times = this.primary(); // stop before treating 'times' as binary op
    if (this.is('operator') && this.peek().value === 'times') {
      this.pos++;
    } else {
      this.expectKeyword('times');
    }
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

  private callStatement(): Statement {
    const expr = this.callExpression();
    this.consume('dot');
    return { kind: 'ExpressionStatement', expression: expr };
  }

  private sendStatement(): Statement {
    const payload = this.expression();
    let target: Expression | undefined;
    if (this.matchKeyword('to')) {
      target = this.expression();
    }
    this.consume('dot');
    return { kind: 'ExpressionStatement', expression: { kind: 'SendExpression', payload, target } as Expression };
  }

  private useStatement(): Statement {
    // Treat use <mod>. as import <mod>.
    const mod = this.identifier();
    this.consume('dot');
    return { kind: 'ImportStatement', source: mod.name } as any;
  }

  private importStmt(): Statement {
    const mod = this.identifier();
    let alias: string | undefined;
    if (this.matchKeyword('as')) {
      alias = this.identifier().name;
    }
    this.consume('dot');
    return { kind: 'ImportStatement', source: mod.name, alias } as any;
  }

  private storeStatement(): Statement {
    const value = this.expression();
    let target: Identifier | undefined;
    if (this.matchKeyword('into')) {
      target = this.identifier();
    }
    this.consume('dot');
    return { kind: 'ExpressionStatement', expression: { kind: 'StoreExpression', value, target } as Expression };
  }

  private ensureLike(kind: 'EnsureExpression' | 'ValidateExpression' | 'ExpectExpression'): Statement {
    const condition = this.expression();
    this.consume('dot');
    return { kind: 'ExpressionStatement', expression: { kind, condition } as Expression };
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
    if (this.is('identifier')) {
      const id = this.identifier();
      // namespace access: foo::bar
      if (this.is('colon') && this.peek(1)?.type === 'colon' && this.peek(2)?.type === 'identifier') {
        this.consume('colon');
        this.consume('colon');
        const tail = this.identifier();
        return { kind: 'Identifier', name: `${id.name}::${tail.name}` };
      }
      return id;
    }
    if (this.is('number') || this.is('string')) return this.literal();
    if (this.matchKeyword('true')) return { kind: 'BooleanLiteral', value: true };
    if (this.matchKeyword('false')) return { kind: 'BooleanLiteral', value: false };
    if (this.matchKeyword('none')) return { kind: 'NoneLiteral' };
    throw this.error('Unexpected token in expression');
  }

  private fetchExpression(): Expression {
    const parts: string[] = [];
    while (this.is('identifier') || this.is('keyword')) {
      const next = this.peek();
      if (next.type === 'keyword' && ['where', 'into'].includes(next.value ?? '')) break;
      parts.push(this.consume(next.type).value ?? '');
    }
    let qualifier: string | undefined;
    let into: Identifier | undefined;
    if (this.matchKeyword('where')) {
      const qualParts: string[] = [];
      while (
        !this.is('dot') &&
        !this.is('newline') &&
        !this.is('indent') &&
        !this.is('dedent') &&
        !(this.peek().type === 'keyword' && this.peek().value === 'into')
      ) {
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
    let callee = this.identifier();
    if (this.is('colon') && this.peek(1)?.type === 'colon' && this.peek(2)?.type === 'identifier') {
      this.consume('colon');
      this.consume('colon');
      const tail = this.identifier();
      callee = { kind: 'Identifier', name: `${callee.name}::${tail.name}` } as any;
    }
    const args: Expression[] = [];
    if (this.matchKeyword('with')) {
      args.push(this.expression());
      while (this.matchKeyword(',' as any)) {
        args.push(this.expression());
      }
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

  private consume(type: Token['type']): Token {
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
    if (!this.matchKeyword(value)) throw this.error(`Expected keyword ${value}`);
  }

  private skipTrivia() {
    while (this.is('newline')) this.pos++;
  }

  private is(type: Token['type']): boolean {
    return this.peek().type === type;
  }

  private peek(offset = 0): Token {
    return this.tokens[this.pos + offset] || { type: 'eof', value: undefined, line: 0, column: 0 } as any;
  }

  private error(msg: string): Error {
    const tok = this.peek();
    return new Error(`${msg} at line ${tok.line}, column ${tok.column}`);
  }
}

const parserInstance = new Parser();
export function parse(source: string): Program {
  return parserInstance.parse(source);
}
