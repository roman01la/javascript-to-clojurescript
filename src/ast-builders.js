const t = require("./cljs-types");
const utils = require("./utils");

const DEF = (id, init) => t.list([t.symbol(t.DEF), id, init]);

const FN = (next, id, params, body, opts = { isImplicitDo: true }) => {
  const bodies = next(body, opts);

  const larr = [t.symbol(t.FN)];
  if (id !== null) {
    larr.push(next(id));
  }
  larr.push(t.vector(params.map(next)));

  const l = t.list(larr);

  if (Array.isArray(bodies)) {
    l.children.push(...bodies);
  } else {
    l.children.push(bodies);
  }
  return l;
};

const DEFN = (next, id, params, body) => {
  const bodies = next(body, { isImplicitDo: true });

  const l = t.list([t.symbol(t.DEFN), next(id), t.vector(params.map(next))]);

  if (Array.isArray(bodies)) {
    l.children.push(...bodies);
  } else {
    l.children.push(bodies);
  }
  return l;
};

const FN_CALL = (next, fn, args = []) => t.list([fn, ...args.map(next)]);

const METHOD_CALL = (next, method, object, args) =>
  t.list([next(method, { isCall: true }), object, ...args.map(next)]);

const THIS_AS = (name, bodies) =>
  t.list([t.symbol("this-as"), t.symbol(name), ...bodies]);

const PROP_GET = (next, prop, object) =>
  t.list([
    next(prop, { isDotGetter: true }),
    next(object, { checkGlobal: true })
  ]);

const NESTED_PROPS_GET = (next, target, props) =>
  t.list([
    t.symbol(".."),
    next(target, { checkGlobal: true }),
    ...props.map(n => next(n, { isGetter: true }))
  ]);

const DO = bodies => t.list([t.symbol("do"), ...bodies]);

const IF = (next, test, consequent, alternate) => {
  const l = t.list([t.symbol(t.IF), next(test)]);
  if (consequent.body === undefined || consequent.body.length > 1) {
    l.children.push(next(consequent));
  } else {
    l.children.push(...next(consequent, { isImplicitDo: true }));
  }
  if (alternate.body === undefined || alternate.body.length > 1) {
    l.children.push(next(alternate));
  } else {
    l.children.push(...next(alternate, { isImplicitDo: true }));
  }
  return l;
};

const WHEN = (next, test, consequent) => {
  const ret = t.list([t.symbol(t.WHEN), next(test)]);
  const conseq = next(consequent, { isImplicitDo: true });
  if (Array.isArray(conseq)) {
    ret.children.push(...conseq);
  } else {
    ret.children.push(conseq);
  }
  return ret;
};

const COND = (next, ast) => {
  const entries = utils.getCondEntries(ast).map(n => {
    if (n === ":else") {
      return t.keyword("else");
    }
    if (n === "nil") {
      return t.symbol(t.NIL);
    }
    if (n.body && n.body.length === 1) {
      const r = next(n, { isImplicitDo: true });
      return r[0];
    }
    return next(n);
  });
  return t.list([t.symbol(t.COND), ...entries]);
};

const CASE = (next, discriminant, cases) =>
  t.list([t.symbol(t.CASE), next(discriminant), ...utils.flatMap(next, cases)]);

const HICCUP_ELEMENT = (next, tag, attrs, children) =>
  t.vector([
    next(tag),
    t.HashMap(attrs ? attrs.map(next) : null),
    ...children.map(next)
  ]);

module.exports = {
  DEF,
  FN,
  DEFN,
  FN_CALL,
  METHOD_CALL,
  THIS_AS,
  PROP_GET,
  NESTED_PROPS_GET,
  DO,
  IF,
  WHEN,
  COND,
  CASE,
  HICCUP_ELEMENT
};
