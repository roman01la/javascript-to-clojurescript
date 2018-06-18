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

const NumericLiteral = value => ({
  type: "NumericLiteral",
  value
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

const StringLiteral = value => ({
  type: "StringLiteral",
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

const tagged = (tag, expr) => ({
  type: "tagged",
  tag,
  expr
});

const hashMap = children => ({
  type: "hashMap",
  children
});

const mapEntry = (key, value) => ({
  type: "mapEntry",
  children: [key, value]
});

const EmptyStatement = () => ({
  type: "EmptyStatement"
});

const DEF = "def";
const DEFN = "defn";
const FN = "fn";
const LET = "let";
const IF = "if";
const WHEN = "when";

module.exports = {
  program,
  comment,
  symbol,
  NumericLiteral,
  StringLiteral,
  ArrayExpression,
  ObjectExpression,
  ObjectProperty,
  EmptyStatement,
  list,
  vector,
  tagged,
  keyword,
  hashMap,
  mapEntry,
  DEF,
  DEFN,
  FN,
  LET,
  IF,
  WHEN
};
