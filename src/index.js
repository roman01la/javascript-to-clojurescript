const { parse } = require("babylon");
const zprint = require("zprint-clj");

const generate = require("./cljs-gen");
const transformAST = require("./js2cljs");
const addSyntaxSugar = require("./syntax-builder");

const toLispAST = code =>
  transformAST(
    parse(code, { sourceType: "module", plugins: ["jsx", "objectRestSpread"] })
  );

const transform = code =>
  zprint(generate(toLispAST(code)), "sample", {
    isHangEnabled: false
  });

module.exports = {
  toLispAST,
  transform,
  addSyntaxSugar
};
