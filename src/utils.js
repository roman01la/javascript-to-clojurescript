const bt = require("babel-types");
const t = require("./cljs-types");

const isComponentElement = n => /^[A-Z]/.test(n);

const flatMap = (fn, coll) =>
  coll.map(fn).reduce((ret, e) => ret.concat(e), []);

function takeWhile(pred, [x, ...xs], ret = []) {
  if (pred(x)) {
    return takeWhile(pred, xs, ret.concat(x));
  }
  return [ret, [x, ...xs]];
}

function getCondEntries(node, ret = []) {
  const { test, consequent, alternate } = node;

  if (bt.isIfStatement(alternate)) {
    return getCondEntries(alternate, ret.concat([test, consequent]));
  }
  return ret.concat([
    test,
    consequent,
    ":else",
    alternate === null ? t.NIL : alternate
  ]);
}

function normalizeOperator(op) {
  if (op === "==") {
    return "=";
  }
  if (op === "===") {
    return "=";
  }
  if (op === "!=") {
    return "not=";
  }
  if (op === "!==") {
    return "not=";
  }
  if (op === "||") {
    return "or";
  }
  if (op === "&&") {
    return "and";
  }
  if (op === "!") {
    return "not";
  }
  return op;
}

module.exports = {
  isComponentElement,
  flatMap,
  takeWhile,
  getCondEntries,
  normalizeOperator
};
