const REGEX_FLAGS = new Set(["i", "m", "u"]);

const regexFlags = s => {
  const flags = Array.from(s)
    .filter(f => REGEX_FLAGS.has(f))
    .join("");
  return flags === "" ? "" : `(?${flags})`;
};

// ===================

const program = (next, node) => node.children.map(next).join("");

const symbol = (next, node) => node.name;

const list = (next, node) => `(${node.children.map(next).join(" ")})\n\n`;

const vector = (next, node) => `[${node.children.map(next).join(" ")}]`;

const keyword = (next, node) => `:${node.value}`;

const tagged = (next, node) => `${node.tag} ${generate(node.expr)}`;

// =======================================

const HashMap = (next, node) => `{${node.children.map(next).join(" ")}}`;

const MapEntry = (next, node) => {
  const [key, value] = node.children;
  return `${next(key)} ${next(value)}`;
};

// ==========================================

const NumericLiteral = (next, node) => node.value;

const StringLiteral = (next, node) => JSON.stringify(node.value);

const BooleanLiteral = (next, node) => node.value;

const EmptyStatement = (next, node) => undefined;

const BreakStatement = (next, node) => undefined;

const ObjectProperty = (next, node) => {
  const [key, value] = node.children;

  const nextKey =
    key.type === "StringLiteral"
      ? JSON.parse(next(key))
      : next(key);

  return `:${nextKey} ${next(value)}`;
};

const ObjectExpression = (next, node) =>
  `#js {${node.children.map(next).join(" ")}}`;

const ArrayExpression = (next, node) =>
  `#js [${node.children.map(next).join(" ")}]`;

const RegExpLiteral = (next, node) =>
  `#"${regexFlags(node.flags)}${node.pattern}"`;

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
  ArrayExpression,
  RegExpLiteral
};
