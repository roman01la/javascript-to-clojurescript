const program = children => ({
  type: "program",
  children
});

const comment = value => ({
  type: "comment",
  value
});

const symbol = name => ({
  type: "symbol",
  name
});

const list = children => ({
  type: "list",
  children
});

const vector = children => ({
  type: "vector",
  children
});

const keyword = value => ({
  type: "keyword",
  value
});

const tagged = (tag, expr) => ({
  type: "tagged",
  tag,
  expr
});

// ==========================

const NumericLiteral = value => ({
  type: "NumericLiteral",
  value
});

const StringLiteral = value => ({
  type: "StringLiteral",
  value
});

const BooleanLiteral = value => ({
  type: "BooleanLiteral",
  value
});

const ArrayExpression = children => ({
  type: "ArrayExpression",
  children
});

const ObjectExpression = children => ({
  type: "ObjectExpression",
  children
});

const ObjectProperty = children => ({
  type: "ObjectProperty",
  children
});

const EmptyStatement = () => ({
  type: "EmptyStatement"
});

const BreakStatement = () => ({
  type: "BreakStatement"
});

const RegExpLiteral = ({ pattern, flags }) => ({
  type: "RegExpLiteral",
  pattern,
  flags
});

// ==========================

const ForOfStatement = () => ({
  type: "ForOfStatement"
});

// ==========================

const HashMap = children => ({
  type: "HashMap",
  children
});

const MapEntry = (key, value) => ({
  type: "MapEntry",
  children: [key, value]
});

// ============================

const DEF = "def";
const DEFN = "defn";
const FN = "fn";
const LET = "let";
const IF = "if";
const WHEN = "when";
const COND = "cond";
const CASE = "case";
const NIL = "nil";
const TRY = "try";
const CATCH = "catch";
const FINALLY = "finally";
const THROW = "throw";
const DO = "throw";

module.exports = {
  NumericLiteral,
  StringLiteral,
  BooleanLiteral,
  ArrayExpression,
  ObjectExpression,
  ObjectProperty,
  EmptyStatement,
  BreakStatement,
  RegExpLiteral,

  ForOfStatement,

  program,
  comment,
  symbol,
  list,
  vector,
  tagged,
  keyword,

  HashMap,
  MapEntry,

  DEF,
  DEFN,
  FN,
  LET,
  IF,
  WHEN,
  COND,
  CASE,
  NIL,
  TRY,
  CATCH,
  FINALLY,
  THROW,
  DO
};
