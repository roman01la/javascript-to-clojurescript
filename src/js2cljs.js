const astt = require("./ast-transforms");

function tr(ast, opts = {}) {
  if (astt.hasOwnProperty(ast.type)) {
    return astt[ast.type](tr, ast, opts);
  }
  console.info(ast);
  throw new Error(`${ast.type} is not implemented`);
}

module.exports = tr;
