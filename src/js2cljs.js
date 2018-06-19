const bt = require("babel-types");
const t = require("./cljs-types");

const flatMap = (fn, coll) =>
  coll.map(fn).reduce((ret, e) => ret.concat(e), []);

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
    alternate === null ? "nil" : alternate
  ]);
}

function getDotProps(node, ret = []) {
  if (bt.isMemberExpression(node.object)) {
    return getDotProps(node.object, [node.property, ...ret]);
  }
  return [node.object, node.property, ...ret];
}

function maybeThreadMemberSyntax(node, ret = []) {
  if (bt.isCallExpression(node)) {
    return [
      ...maybeThreadMemberSyntax(node.callee.object, [
        node.callee.property || node.callee,
        node.arguments
      ]),
      ret
    ];
  }
  return ret;
}

function normlizeOperator(op) {
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
  return op;
}

// ==================

const transformRec = (ast, opts = {}) => {
  if (bt.isFile(ast)) {
    return transformRec(ast.program);
  }
  if (bt.isProgram(ast)) {
    return t.program(ast.body.map(transformRec));
  }
  if (bt.isExpressionStatement(ast)) {
    let comments;
    if (Array.isArray(ast.leadingComments)) {
      comments = ast.leadingComments.map(n => t.comment(n.value));
    }
    const ret = transformRec(ast.expression);
    if (comments) {
      ret.comments = comments;
    }
    return ret;
  }
  if (bt.isBinaryExpression(ast)) {
    const { operator, left, right } = ast;

    const expr = t.list([t.symbol(normlizeOperator(operator))]);
    const l = transformRec(left);
    const r = transformRec(right);

    expr.children.push(l);
    expr.children.push(r);

    return expr;
  }
  if (bt.isUnaryExpression(ast)) {
    return t.list([t.symbol(ast.operator), transformRec(ast.argument)]);
  }
  if (bt.isIdentifier(ast)) {
    if (opts.isGetter) {
      return t.symbol(`-${ast.name}`);
    }
    if (opts.isDotGetter) {
      return t.symbol(`.-${ast.name}`);
    }
    if (opts.isCall) {
      return t.symbol(`.${ast.name}`);
    }
    return t.symbol(ast.name);
  }
  if (bt.isNumericLiteral(ast)) {
    return t.NumericLiteral(ast.extra.raw);
  }
  if (bt.isVariableDeclaration(ast)) {
    return transformRec(ast.declarations[0]);
  }
  if (bt.isVariableDeclarator(ast)) {
    const { id, init } = ast;

    return t.list([t.symbol(t.DEF), transformRec(id), transformRec(init)]);
  }
  if (bt.isFunctionDeclaration(ast)) {
    const { id, params, body } = ast;

    const bodies = transformRec(body, { isImplicitDo: true });

    const l = t.list([
      t.symbol(t.DEFN),
      transformRec(id),
      t.vector(params.map(transformRec))
    ]);

    if (Array.isArray(bodies)) {
      l.children.push(...bodies);
    } else {
      l.children.push(bodies);
    }
    return l;
  }
  if (bt.isFunctionExpression(ast)) {
    const { id, params, body } = ast;

    let node;
    const bodies = body.body && body.body.map(transformRec);

    if (id === null) {
      node = t.list([t.symbol(t.FN), t.vector(params.map(transformRec))]);
    } else {
      node = t.list([
        t.symbol(t.DEFN),
        transformRec(id),
        t.vector(params.map(transformRec))
      ]);
    }

    if (bodies) {
      node.children.push(...bodies);
    }
    return node;
  }
  if (bt.isArrowFunctionExpression(ast)) {
    const { params, body } = ast;

    let bodies;

    if (ast.expression) {
      bodies = [transformRec(body)];
    } else {
      bodies = transformRec(body, { isImplicitDo: true });
    }

    const node = t.list([t.symbol(t.FN), t.vector(params.map(transformRec))]);

    if (bodies) {
      node.children.push(...bodies);
    }
    return node;
  }
  if (bt.isReturnStatement(ast)) {
    return transformRec(ast.argument);
  }
  if (bt.isCallExpression(ast)) {
    const { callee } = ast;

    const memberChain = maybeThreadMemberSyntax(ast).filter(
      r => r.length !== 0
    );

    if (memberChain.length > 2) {
      let fn;
      const [id, args, ...entries] = memberChain;
      if (window.hasOwnProperty(id.name)) {
        fn = t.symbol(`js/${id.name}`);
      } else {
        fn = transformRec(id);
      }
      return t.list([
        t.symbol("->"),
        t.list([fn, ...args.map(transformRec)]),
        ...entries.map(([id, args]) =>
          t.list([
            transformRec(id, { isCall: true }),
            ...args.map(transformRec)
          ])
        )
      ]);
    }

    if (bt.isMemberExpression(callee)) {
      if (callee.object.name && window.hasOwnProperty(callee.object.name)) {
        const fn = t.symbol(`js/${callee.object.name}`);
        return t.list([
          t.symbol(`.${callee.property.name}`),
          fn,
          ...ast.arguments.map(transformRec)
        ]);
      } else {
        const fn = transformRec(callee, { isCallExpression: true });
        return t.list([...fn.children, ...ast.arguments.map(transformRec)]);
      }
    }
    if (window.hasOwnProperty(callee.name)) {
      const fn = t.symbol(`js/${callee.name}`);
      return t.list([fn, ...ast.arguments.map(transformRec)]);
    }

    const fn = transformRec(callee);
    return t.list([fn, ...ast.arguments.map(transformRec)]);
  }
  if (bt.isStringLiteral(ast)) {
    return t.StringLiteral(ast.value);
  }
  if (bt.isArrayExpression(ast)) {
    return t.ArrayExpression(ast.elements.map(transformRec));
  }
  if (bt.isMemberExpression(ast)) {
    const { object, property } = ast;

    if (opts.isCallExpression) {
      if (bt.isThisExpression(object)) {
        return t.list([
          t.symbol("this-as"),
          t.symbol("this"),
          t.list([t.symbol("."), t.symbol("this"), transformRec(property)])
        ]);
      } else if (ast.computed) {
        if (opts.isCallExpression) {
          return t.list([
            t.list([
              t.symbol("aget"),
              transformRec(object),
              transformRec(property)
            ])
          ]);
        } else {
          return t.list([
            t.symbol("aget"),
            transformRec(object),
            transformRec(property)
          ]);
        }
      } else {
        return t.list([t.symbol(`.${property.name}`), transformRec(object)]);
      }
    } else if (bt.isThisExpression(object)) {
      return t.list([
        t.symbol("this-as"),
        t.symbol("this"),
        t.list([
          t.symbol("."),
          t.symbol("this"),
          transformRec(property, { isGetter: true })
        ])
      ]);
    } else if (ast.computed) {
      return t.list([
        t.symbol("aget"),
        transformRec(object),
        transformRec(property)
      ]);
    } else {
      const [target, ...props] = getDotProps(ast);
      if (props.length === 1) {
        return t.list([t.symbol(`.-${props[0].name}`), transformRec(target)]);
      }
      return t.list([
        t.symbol(".."),
        transformRec(target),
        ...props.map(n => transformRec(n, { isGetter: true }))
      ]);
    }
  }
  if (bt.isObjectExpression(ast)) {
    const props = ast.properties;
    return t.ObjectExpression(props.map(transformRec));
  }
  if (bt.isObjectProperty(ast)) {
    return t.ObjectProperty([transformRec(ast.key), transformRec(ast.value)]);
  }
  if (bt.isThisExpression(ast)) {
    return t.list([t.symbol("this-as"), t.symbol("this")]);
  }

  if (bt.isJSXExpressionContainer(ast)) {
    return transformRec(ast.expression);
  }
  if (bt.isJSXElement(ast)) {
    const attrs = ast.openingElement.attributes;

    return t.vector([
      transformRec(ast.openingElement),
      t.hashMap(attrs ? attrs.map(transformRec) : null),
      ...ast.children.map(transformRec)
    ]);
  }
  if (bt.isJSXAttribute(ast)) {
    return t.mapEntry(transformRec(ast.name), transformRec(ast.value));
  }
  if (bt.isJSXOpeningElement(ast)) {
    return transformRec(ast.name, {
      isJSXElement: /^[A-Z]/.test(ast.name.name)
    });
  }
  if (bt.isJSXIdentifier(ast)) {
    if (opts.isJSXElement) {
      return t.symbol(ast.name);
    } else {
      return t.keyword(ast.name);
    }
  }
  if (bt.isJSXText(ast)) {
    if (ast.value.trim() !== "") {
      return t.StringLiteral(ast.value);
    }
    return t.EmptyStatement();
  }
  if (bt.isAssignmentExpression(ast)) {
    if (bt.isMemberExpression(ast.left)) {
      if (isNestedThisExpression(ast.left)) {
        alterNestedThisExpression("that", ast.left);
        return t.list([
          t.symbol("this-as"),
          t.symbol("that"),
          t.list([
            t.symbol("set!"),
            transformRec(ast.left),
            transformRec(ast.right)
          ])
        ]);
      }
      return t.list([
        t.symbol("set!"),
        transformRec(ast.left),
        transformRec(ast.right)
      ]);
    } else {
      return t.list([
        t.symbol("set!"),
        transformRec(ast.left),
        transformRec(ast.right)
      ]);
    }
  }
  if (bt.isNewExpression(ast)) {
    return t.list([
      t.symbol("new"),
      transformRec(ast.callee, { isCallExpression: true }),
      ...ast.arguments.map(transformRec)
    ]);
  }
  if (bt.isObjectMethod(ast)) {
    return t.ObjectProperty([
      transformRec(ast.key),
      t.list([
        t.symbol(t.FN),
        t.vector(ast.params.map(transformRec)),
        ...ast.body.body.map(transformRec)
      ])
    ]);
  }
  if (bt.isEmptyStatement(ast)) {
    return t.EmptyStatement();
  }
  if (bt.isBlockStatement(ast)) {
    if (bt.isVariableDeclaration(ast.body[0])) {
      const [decls, rest] = takeWhile(
        n => bt.isVariableDeclaration(n),
        ast.body
      );
      const entries = flatMap(d => {
        const { id, init } = d.declarations[0];
        return [transformRec(id), transformRec(init)];
      }, decls);
      return t.list([
        t.symbol(t.LET),
        t.vector(entries),
        ...rest.map(transformRec)
      ]);
    }
    if (opts.isImplicitDo) {
      return ast.body.map(transformRec);
    }
    return t.list([t.symbol("do"), ...ast.body.map(transformRec)]);
  }
  if (bt.isIfStatement(ast)) {
    const { test, consequent, alternate } = ast;

    if (bt.isIfStatement(alternate)) {
      const entries = getCondEntries(ast).map(n => {
        if (n === ":else") {
          return t.keyword("else");
        }
        if (n === "nil") {
          return t.symbol(t.NIL);
        }
        if (n.body && n.body.length === 1) {
          const r = transformRec(n, { isImplicitDo: true });
          return r[0];
        }
        return transformRec(n);
      });
      return t.list([t.symbol(t.COND), ...entries]);
    }

    if (alternate !== null) {
      const l = t.list([t.symbol(t.IF), transformRec(test)]);
      if (consequent.body.length > 1) {
        l.children.push(transformRec(consequent));
      } else {
        l.children.push(...transformRec(consequent, { isImplicitDo: true }));
      }
      if (alternate.body.length > 1) {
        l.children.push(transformRec(alternate));
      } else {
        l.children.push(...transformRec(alternate, { isImplicitDo: true }));
      }
      return l;
    }
    const retWhen = t.list([t.symbol(t.WHEN), transformRec(test)]);
    const retConseq = transformRec(consequent, { isImplicitDo: true });
    if (Array.isArray(retConseq)) {
      retWhen.children.push(...retConseq);
    } else {
      retWhen.children.push(retConseq);
    }
    return retWhen;
  }
  if (bt.isSwitchStatement(ast)) {
    const { discriminant, cases } = ast;

    return t.list([
      t.symbol(t.CASE),
      transformRec(discriminant),
      ...flatMap(transformRec, cases)
    ]);
  }
  if (bt.isSwitchCase(ast)) {
    const { test, consequent } = ast;

    const csqf = consequent.filter(n => !bt.isBreakStatement(n));
    const csq = csqf.map(transformRec);

    if (bt.isVariableDeclaration(consequent[0])) {
      const [decls, rest] = takeWhile(n => bt.isVariableDeclaration(n), csqf);
      const entries = flatMap(d => {
        const { id, init } = d.declarations[0];
        return [transformRec(id), transformRec(init)];
      }, decls);

      return [
        transformRec(test),
        t.list([t.symbol(t.LET), t.vector(entries), ...rest.map(transformRec)])
      ];
    }

    if (test === null) {
      return csq;
    }

    if (csq.length > 1) {
      return [transformRec(test), t.list([t.symbol("do"), ...csq])];
    }
    return [transformRec(test), ...csq];
  }
  if (bt.isImportDeclaration(ast)) {
    const { source, specifiers } = ast;

    const sxs = specifiers.map(s => {
      if (bt.isImportSpecifier(s)) {
        return [
          transformRec(s.imported, { isDotGetter: true }),
          transformRec(s.local)
        ];
      }
      if (bt.isImportDefaultSpecifier(s)) {
        return [t.symbol(".-default"), transformRec(s.local)];
      }
      if (bt.isImportNamespaceSpecifier(s)) {
        return ["*", transformRec(s.local)];
      }
    });

    const [[imported, local]] = sxs;

    if (imported === "*") {
      return t.list([
        t.symbol(t.DEF),
        local,
        t.list([t.symbol("js/require"), transformRec(source)])
      ]);
    }
    return t.list([
      t.symbol(t.DEF),
      local,
      t.list([imported, t.list([t.symbol("js/require"), transformRec(source)])])
    ]);
  }
  if (bt.isConditionalExpression(ast)) {
    const { test, consequent, alternate } = ast;
    return t.list([
      t.symbol(t.IF),
      transformRec(test),
      transformRec(consequent),
      transformRec(alternate)
    ]);
  }

  console.info(ast);
  throw new Error(`${ast.type} is not implemented`);
};

module.exports = transformRec;
