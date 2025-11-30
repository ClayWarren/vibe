# VCL Language Spec (v1.0 draft)

## Lexical
- Significant indentation; tabs are treated as 4 spaces.
- Statements terminate with `.`.
- Strings: single or double quotes, allow `\n \r \t \\ \" \'` and multiline.
- Numbers: decimal with optional fraction.
- Comments: `#` to end of line.

## Keywords
`let define when every if else end for each in repeat times return stop is none true false ensure validate expect use call with where into fetch send to store get`

## Grammar (EBNF)
```
program       ::= statement* EOF
statement     ::= import | let | define | when | schedule | if | for | repeat
                | return | stop | send | store | ensureLike | exprStmt
import        ::= "import" IDENT ( "as" IDENT | ":" importList )? "."
importList    ::= IDENT ("," IDENT)*
let           ::= "let" IDENT "=" expression "."
define        ::= "define" IDENT ":" block "end" "."
when          ::= "when" WORDS ":" block "end" "."
schedule      ::= "every" WORDS ":" block "end" "."
if            ::= "if" expression ":" (block | inlineStmt) ("else" ":" (block | inlineStmt))? ("end".)?
for           ::= "for" "each" IDENT "in" expression ":" block "end" "."
repeat        ::= "repeat" expression "times" ":" block "end" "."
return        ::= "return" expression? "."
stop          ::= "stop" ("with" expression)? "."
send          ::= "send" expression ("to" expression)? "."
store         ::= "store" expression ("into" IDENT)? "."
ensureLike    ::= ("ensure" | "validate" | "expect") expression "."
exprStmt      ::= expression "."
block         ::= INDENT statement* DEDENT
expression    ::= primary (OP primary | "is" (primary | "none"))*
primary       ::= literal | identifier | fetch | call
fetch         ::= "fetch" WORDS ("where" WORDS)? ("into" IDENT)?
call          ::= "call" IDENT ("with" expression)?
literal       ::= NUMBER | STRING | "true" | "false" | "none"
OP            ::= plus | minus | times | divided_by | equal_to | not_equal_to | greater_than | less_than
```

## Semantics (core)
- `ensure/validate/expect` throw if condition falsy.
- `stop with X` aborts current event with status 400 and body X.
- `return X` returns status 200 and body X (or `null` if omitted).
- `fetch/send/store/log` are delegated to runtime adapters; in absence, fetch falls back to `ctx.data[target]`, store appends to `ctx.data[target]`.
- Event names are free-form strings from `when ...` or `every ...`.

## Types
- Dynamically typed; literals produce JS primitives; `none` maps to `null`.

## Determinism
- REPL and tests use injected runtime; time/random must be provided by host.

## Compatibility
- Backward compatible with v0.x syntax; colon is mandatory after control headers; indentation defines blocks.
