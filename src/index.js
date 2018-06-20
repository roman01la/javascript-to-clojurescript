// const fs = require("fs");
// const path = require("path");
const { parse } = require("babylon");
const zprint = require("zprint-clj");

const generate = require("./cljs-gen");
const transformAST = require("./js2cljs");

// const jscode = fs.readFileSync(path.join(__dirname, "test.js"), "utf8");

// const ast = transformAST(parse(jscode, { plugins: ["jsx"] }));

// console.log(JSON.stringify(ast, null, 2));
// const genast = generate(ast);
// const code = zprint(genast, "", { isHangEnabled: false });

// console.log(code);

const toLispAST = code =>
  transformAST(parse(code, { sourceType: "module", plugins: ["jsx"] }));

const transform = code =>
  zprint(generate(toLispAST(code)), "sample", {
    isHangEnabled: false
  });

module.exports = {
  toLispAST,
  transform
};
