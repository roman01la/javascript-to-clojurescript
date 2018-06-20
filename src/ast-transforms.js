const bt = require("babel-types");
const t = require("./cljs-types");
const utils = require("./utils");

function makeDEFN(next, id, params, body) {
  const bodies = next(body, { isImplicitDo: true });

  const l = t.list([t.symbol(t.DEFN), next(id), t.vector(params.map(next))]);

  if (Array.isArray(bodies)) {
    l.children.push(...bodies);
  } else {
    l.children.push(bodies);
  }
  return l;
}

function getDotProps(node, ret = []) {
  if (bt.isMemberExpression(node.object)) {
    return getDotProps(node.object, [node.property, ...ret]);
  }
  return [node.object, node.property, ...ret];
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
      window.hasOwnProperty(node.callee.name)
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

// =============

const File = (next, ast, opts) => next(ast.program);
const Program = (next, ast, opts) => t.program(ast.body.map(next));
const ExpressionStatement = (next, ast, opts) => {
  let comments;
  if (Array.isArray(ast.leadingComments)) {
    comments = ast.leadingComments.map(n => t.comment(n.value));
  }
  const ret = next(ast.expression);
  if (comments) {
    ret.comments = comments;
  }
  return ret;
};

const BinaryExpression = (next, ast, opts) => {
  const { operator, left, right } = ast;

  return t.list([
    t.symbol(utils.normalizeOperator(operator)),
    next(left),
    next(right)
  ]);
};

const UnaryExpression = (next, ast, opts) =>
  t.list([t.symbol(utils.normalizeOperator(ast.operator)), next(ast.argument)]);

const Identifier = (next, ast, opts) => {
  if (opts.isGetter) {
    return t.symbol(`-${ast.name}`);
  }
  if (opts.isDotGetter) {
    return t.symbol(`.-${ast.name}`);
  }
  if (opts.isCall) {
    return t.symbol(`.${ast.name}`);
  }
  if (opts.checkGlobal && window.hasOwnProperty(ast.name)) {
    return t.symbol(`js/${ast.name}`);
  }
  return t.symbol(ast.name);
};

const NumericLiteral = (next, ast, opts) => t.NumericLiteral(ast.extra.raw);

const VariableDeclaration = (next, ast, opts) => next(ast.declarations[0]);

const VariableDeclarator = (next, ast, opts) => {
  const { id, init } = ast;

  if (bt.isArrowFunctionExpression(init)) {
    const { body, params } = init;
    return makeDEFN(next, id, params, body);
  }

  return t.list([t.symbol(t.DEF), next(id), next(init)]);
};

const FunctionDeclaration = (next, ast, opts) => {
  const { id, params, body } = ast;
  return makeDEFN(next, id, params, body);
};

const FunctionExpression = (next, ast, opts) => {
  const { id, params, body } = ast;

  let node;
  const bodies = body.body && body.body.map(next);

  if (id === null) {
    node = t.list([t.symbol(t.FN), t.vector(params.map(next))]);
  } else {
    node = t.list([t.symbol(t.DEFN), next(id), t.vector(params.map(next))]);
  }

  if (bodies) {
    node.children.push(...bodies);
  }
  return node;
};

const ArrowFunctionExpression = (next, ast, opts) => {
  const { params, body } = ast;

  const node = t.list([t.symbol(t.FN), t.vector(params.map(next))]);

  const bodies = ast.expression
    ? [next(body)]
    : next(body, { isImplicitDo: true });

  if (bodies) {
    node.children.push(...bodies);
  }
  return node;
};

const ReturnStatement = (next, ast, opts) => next(ast.argument);

const CallExpression = (next, ast, opts) => {
  const { callee } = ast;

  const memberChain = maybeThreadMemberSyntax(next, ast).reverse();

  if (memberChain.length > 2) {
    return t.list([t.symbol("->"), ...memberChain]);
  }

  if (bt.isMemberExpression(callee)) {
    if (callee.object.name && window.hasOwnProperty(callee.object.name)) {
      const fn = t.symbol(`js/${callee.object.name}`);
      return t.list([
        t.symbol(`.${callee.property.name}`),
        fn,
        ...ast.arguments.map(next)
      ]);
    } else {
      const fn = next(callee, { isCallExpression: true });
      return t.list([...fn.children, ...ast.arguments.map(next)]);
    }
  }
  if (window.hasOwnProperty(callee.name)) {
    const fn = t.symbol(`js/${callee.name}`);
    return t.list([fn, ...ast.arguments.map(next)]);
  }

  const fn = next(callee);
  return t.list([fn, ...ast.arguments.map(next)]);
};

const MemberExpression = (next, ast, opts) => {
  const { object, property } = ast;

  if (opts.isCallExpression) {
    if (bt.isThisExpression(object)) {
      return t.list([
        t.symbol("this-as"),
        t.symbol("this"),
        t.list([t.symbol("."), t.symbol("this"), next(property)])
      ]);
    } else if (ast.computed) {
      if (opts.isCallExpression) {
        return t.list([
          t.list([t.symbol("aget"), next(object), next(property)])
        ]);
      } else {
        return t.list([t.symbol("aget"), next(object), next(property)]);
      }
    } else {
      return t.list([t.symbol(`.${property.name}`), next(object)]);
    }
  } else if (bt.isThisExpression(object)) {
    return t.list([
      t.symbol("this-as"),
      t.symbol("this"),
      t.list([
        t.symbol("."),
        t.symbol("this"),
        next(property, { isGetter: true })
      ])
    ]);
  } else if (ast.computed) {
    return t.list([t.symbol("aget"), next(object), next(property)]);
  } else {
    const [target, ...props] = getDotProps(ast);
    if (props.length === 1) {
      return t.list([
        t.symbol(`.-${props[0].name}`),
        next(target, { checkGlobal: true })
      ]);
    }
    return t.list([
      t.symbol(".."),
      next(target, { checkGlobal: true }),
      ...props.map(n => next(n, { isGetter: true }))
    ]);
  }
};

const StringLiteral = (next, ast, opts) => t.StringLiteral(ast.value);

const ArrayExpression = (next, ast, opts) =>
  t.ArrayExpression(ast.elements.map(next));

const ObjectExpression = (next, ast, opts) => {
  const props = ast.properties;
  return t.ObjectExpression(props.map(next));
};

const ObjectProperty = (next, ast, opts) =>
  t.ObjectProperty([next(ast.key), next(ast.value)]);

const ThisExpression = (next, ast, opts) =>
  t.list([t.symbol("this-as"), t.symbol("this")]);

const AssignmentExpression = (next, ast, opts) => {
  if (bt.isMemberExpression(ast.left)) {
    if (isNestedThisExpression(ast.left)) {
      alterNestedThisExpression("that", ast.left);
      return t.list([
        t.symbol("this-as"),
        t.symbol("that"),
        t.list([t.symbol("set!"), next(ast.left), next(ast.right)])
      ]);
    }
    return t.list([t.symbol("set!"), next(ast.left), next(ast.right)]);
  } else {
    return t.list([t.symbol("set!"), next(ast.left), next(ast.right)]);
  }
};

const NewExpression = (next, ast, opts) =>
  t.list([
    t.symbol("new"),
    next(ast.callee, { isCallExpression: true }),
    ...ast.arguments.map(next)
  ]);

const ObjectMethod = (next, ast, opts) =>
  t.ObjectProperty([
    next(ast.key),
    t.list([
      t.symbol(t.FN),
      t.vector(ast.params.map(next)),
      ...ast.body.body.map(next)
    ])
  ]);

const EmptyStatement = (next, ast, opts) => t.EmptyStatement();

const BlockStatement = (next, ast, opts) => {
  if (bt.isVariableDeclaration(ast.body[0])) {
    const [decls, rest] = utils.takeWhile(
      n => bt.isVariableDeclaration(n),
      ast.body
    );
    const entries = utils.flatMap(d => {
      const { id, init } = d.declarations[0];
      return [next(id), next(init)];
    }, decls);
    return t.list([t.symbol(t.LET), t.vector(entries), ...rest.map(next)]);
  }
  if (opts.isImplicitDo) {
    return ast.body.map(next);
  }
  return t.list([t.symbol("do"), ...ast.body.map(next)]);
};

const IfStatement = (next, ast, opts) => {
  const { test, consequent, alternate } = ast;

  if (bt.isIfStatement(alternate)) {
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
  }

  if (alternate !== null) {
    const l = t.list([t.symbol(t.IF), next(test)]);
    if (consequent.body.length > 1) {
      l.children.push(next(consequent));
    } else {
      l.children.push(...next(consequent, { isImplicitDo: true }));
    }
    if (alternate.body.length > 1) {
      l.children.push(next(alternate));
    } else {
      l.children.push(...next(alternate, { isImplicitDo: true }));
    }
    return l;
  }
  const retWhen = t.list([t.symbol(t.WHEN), next(test)]);
  const retConseq = next(consequent, { isImplicitDo: true });
  if (Array.isArray(retConseq)) {
    retWhen.children.push(...retConseq);
  } else {
    retWhen.children.push(retConseq);
  }
  return retWhen;
};

const SwitchStatement = (next, ast, opts) => {
  const { discriminant, cases } = ast;

  return t.list([
    t.symbol(t.CASE),
    next(discriminant),
    ...utils.flatMap(next, cases)
  ]);
};

const SwitchCase = (next, ast, opts) => {
  const { test, consequent } = ast;

  const csqf = consequent.filter(n => !bt.isBreakStatement(n));
  const csq = csqf.map(next);

  if (bt.isVariableDeclaration(consequent[0])) {
    const [decls, rest] = utils.takeWhile(
      n => bt.isVariableDeclaration(n),
      csqf
    );
    const entries = utils.flatMap(d => {
      const { id, init } = d.declarations[0];
      return [next(id), next(init)];
    }, decls);

    return [
      next(test),
      t.list([t.symbol(t.LET), t.vector(entries), ...rest.map(next)])
    ];
  }

  if (test === null) {
    return csq;
  }

  if (csq.length > 1) {
    return [next(test), t.list([t.symbol("do"), ...csq])];
  }
  return [next(test), ...csq];
};

const BreakStatement = (next, ast, opts) => t.BreakStatement();

const ImportDeclaration = (next, ast, opts) => {
  const { source, specifiers } = ast;

  const sxs = specifiers.map(s => {
    if (bt.isImportSpecifier(s)) {
      return [next(s.imported, { isDotGetter: true }), next(s.local)];
    }
    if (bt.isImportDefaultSpecifier(s)) {
      return [t.symbol(".-default"), next(s.local)];
    }
    if (bt.isImportNamespaceSpecifier(s)) {
      return ["*", next(s.local)];
    }
  });

  const imported = sxs[0][0];
  const local = sxs[0][1];

  if (imported === "*") {
    return t.list([
      t.symbol(t.DEF),
      local,
      t.list([t.symbol("js/require"), next(source)])
    ]);
  }
  return t.list([
    t.symbol(t.DEF),
    local,
    t.list([imported, t.list([t.symbol("js/require"), next(source)])])
  ]);
};

const ConditionalExpression = (next, ast, opts) => {
  const { test, consequent, alternate } = ast;
  return t.list([
    t.symbol(t.IF),
    next(test),
    next(consequent),
    next(alternate)
  ]);
};

const LogicalExpression = (next, ast, opts) => {
  const { operator, left, right } = ast;
  return t.list([
    t.symbol(utils.normalizeOperator(operator)),
    next(left),
    next(right)
  ]);
};

const NullLiteral = (next, ret) => t.symbol(t.NIL);

const BooleanLiteral = (next, ret) => t.BooleanLiteral(ast.value);

/* ========= JSX ========= */
const JSXExpressionContainer = (next, ast, opts) => next(ast.expression);

const JSXElement = (next, ast, opts) => {
  const attrs = ast.openingElement.attributes;

  return t.vector([
    next(ast.openingElement),
    t.HashMap(attrs ? attrs.map(next) : null),
    ...ast.children.map(next)
  ]);
};

const JSXAttribute = (next, ast, opts) =>
  t.MapEntry(next(ast.name), next(ast.value));

const JSXOpeningElement = (next, ast, opts) =>
  next(ast.name, {
    isJSXElement: utils.isComponentElement(ast.name.name)
  });

const JSXIdentifier = (next, ast, opts) =>
  opts.isJSXElement ? t.symbol(ast.name) : t.keyword(ast.name);

const JSXText = (next, ast, opts) =>
  ast.value.trim() !== "" ? t.StringLiteral(ast.value) : t.EmptyStatement();

module.exports = {
  File,
  Program,
  ExpressionStatement,
  BinaryExpression,
  UnaryExpression,
  Identifier,
  NumericLiteral,
  VariableDeclaration,
  VariableDeclarator,
  FunctionDeclaration,
  FunctionExpression,
  ArrowFunctionExpression,
  ReturnStatement,
  CallExpression,
  StringLiteral,
  MemberExpression,
  ArrayExpression,
  ObjectExpression,
  ObjectProperty,
  ThisExpression,
  AssignmentExpression,
  NewExpression,
  ObjectMethod,
  EmptyStatement,
  BlockStatement,
  IfStatement,
  SwitchStatement,
  SwitchCase,
  BreakStatement,
  ImportDeclaration,
  ConditionalExpression,
  LogicalExpression,
  NullLiteral,
  BooleanLiteral,

  JSXExpressionContainer,
  JSXElement,
  JSXAttribute,
  JSXOpeningElement,
  JSXIdentifier,
  JSXText
};
