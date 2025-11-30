export enum Op {
  CONST,        // push const index
  LOAD,         // load local/frame slot
  STORE,        // store local/frame slot
  LOAD_IDX,     // load array[index]
  LEN,          // push length of array
  FETCH,        // host fetch(target const, qualifier const)
  SEND,         // host send(payload, target?)
  STORE_OP,     // host store(value, target const)
  ENSURE,       // truthy check
  JUMP,         // absolute jump
  JUMP_IF_FALSE,// conditional jump
  CALL,         // call function index
  RET,          // return
  STOP,         // stop with value
  BIN_OP,       // binary operator code
  NOOP,
}

export enum BinOp {
  PLUS,
  MINUS,
  TIMES,
  DIV,
  EQ,
  NEQ,
  GT,
  LT,
}
