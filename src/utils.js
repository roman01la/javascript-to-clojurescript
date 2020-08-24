const bt = require("babel-types");
const t = require("./cljs-types");

const globalObj = (typeof window !== "undefined" ? window : global);

const isComponentElement = n => /^[A-Z]/.test(n);

const flatMap = (fn, coll) =>
  coll.map(fn).reduce((ret, e) => ret.concat(e), []);

function takeWhile(pred, [x, ...xs], ret = []) {
  if (pred(x)) {
    return takeWhile(pred, xs, ret.concat(x));
  }
  if (x === undefined) {
    return [ret];
  } else {
    return [ret, [x, ...xs]];
  }
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

function getDotProps(node, ret = []) {
  if (bt.isMemberExpression(node.object)) {
    return getDotProps(node.object, [node.property, ...ret]);
  }
  return [node.object, node.property, ...ret];
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

function maybeThreadMemberSyntax(next, node) {
  if (bt.isCallExpression(node)) {
    if (bt.isCallExpression(node.callee.object)) {
      return [
        t.list([
          next(node.callee.property, { isCall: true }),
          ...node.arguments.map(next)
        ]),
        ...maybeThreadMemberSyntax(next, node.callee.object)
      ];
    }

    let f;

    if (
      bt.isIdentifier(node.callee) &&
      globalObj.hasOwnProperty(node.callee.name)
    ) {
      f = t.symbol(`js/${node.callee.name}`);
    } else {
      f = next(node.callee);
    }

    return [t.list([f, ...node.arguments.map(next)])];
  }
}

function isNestedThisExpression(node) {
  if (bt.isThisExpression(node.object)) {
    return node;
  }
  if (node.object.hasOwnProperty("object")) {
    return isNestedThisExpression(node.object);
  }
  return false;
}

function alterNestedThisExpression(name, node) {
  const thisNode = isNestedThisExpression(node);
  if (thisNode) {
    thisNode.object = bt.identifier(name);
  }
}

module.exports = {
  isComponentElement,
  flatMap,
  takeWhile,
  getCondEntries,
  getDotProps,
  normalizeOperator,
  maybeThreadMemberSyntax,
  isNestedThisExpression,
  alterNestedThisExpression,
  globalObj
};
