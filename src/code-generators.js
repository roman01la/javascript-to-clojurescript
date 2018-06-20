const program = (next, node) => node.children.map(next).join("");

const symbol = (next, node) => node.name;

const list = (next, node) => `(${node.children.map(next).join(" ")})\n\n`;

const vector = (next, node) => `[${node.children.map(next).join(" ")}]`;

const keyword = (next, node) => `:${node.value}`;

const tagged = (next, node) => `${node.tag} ${generate(node.expr)}`;

const HashMap = (next, node) => `{${node.children.map(next).join(" ")}}`;

const MapEntry = (next, node) => {
  const [key, value] = node.children;
  return `${next(key)} ${next(value)}`;
};

const NumericLiteral = (next, node) => node.value;

const StringLiteral = (next, node) => JSON.stringify(node.value);

const BooleanLiteral = (next, node) => node.value;

const EmptyStatement = (next, node) => undefined;

const BreakStatement = (next, node) => undefined;

const ObjectProperty = (next, node) => {
  const [key, value] = node.children;
  return `:${next(key)} ${next(value)}`;
};

const ObjectExpression = (next, node) =>
  `#js {${node.children.map(next).join(" ")}}`;

const ArrayExpression = (next, node) =>
  `#js [${node.children.map(next).join(" ")}]`;

module.exports = {
  program,
  symbol,
  list,
  vector,
  keyword,
  tagged,

  HashMap,
  MapEntry,

  NumericLiteral,
  StringLiteral,
  BooleanLiteral,
  EmptyStatement,
  BreakStatement,
  ObjectProperty,
  ObjectExpression,
  ArrayExpression
};
