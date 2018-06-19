// const fs = require("fs");
// const path = require("path");
const { parse } = require("babylon");
const zprint = require("zprint-clj");

const generate = require("./cljs-gen");
const transformRec = require("./js2cljs");

// const jscode = fs.readFileSync(path.join(__dirname, "test.js"), "utf8");

// const ast = transformRec(parse(jscode, { plugins: ["jsx"] }));

// console.log(JSON.stringify(ast, null, 2));
// const genast = generate(ast);
// const code = zprint(genast, "", { isHangEnabled: false });

// console.log(code);

module.exports = code =>
  zprint(
    generate(
      transformRec(parse(code, { sourceType: "module", plugins: ["jsx"] }))
    ),
    "sample",
    {
      isHangEnabled: false
    }
  );
