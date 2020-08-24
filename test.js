const { transform } = require("./src/index");
const astTransforms = require("./src/ast-transforms");

const errors = [];
let tests = 0;
const astTypes = new Set();

function test(astType,jsInput, cljsExpected) {
    const cljsOut = transform(jsInput);
    if (cljsOut !== (cljsExpected.endsWith(")") ? cljsExpected + "\n" : cljsExpected)) {
        errors.push({ expected: cljsExpected, actual: cljsOut })
    }
    tests++;
    astTypes.add(astType)
}

test("BinaryExpression", "2 / 1", "(/ 2 1)");
test("BinaryExpression", "2 / 1 / 9 / 6", "(/ (/ (/ 2 1) 9) 6)"); // TODO: Flatten

test("DeleteStatement", "delete obj.x", `(js-delete obj "x")`);

test("UnaryExpression", "+x", `(+ x)`);

test("Identifier", "x", `x`);
test("Identifier", "x.y", `(.-y x)`);
test("Identifier", "x.y.z", `(.. x -y -z)`);
test("Identifier", "x()", `(x)`);
test("Identifier", "setTimeout", `js/setTimeout`); // FIXME
test("Identifier", "setTimeout()", `(js/setTimeout)`);

test("NumericLiteral", "123", `123`);
test("NumericLiteral", "1.23", `1.23`);
test("NumericLiteral", ".23", `.23`);
test("NumericLiteral", "-345", `(- 345)`);

test("VariableDeclaration", "var x = 1", `(def x 1)`);
test("VariableDeclaration", "let x = 1", `(def x 1)`);
test("VariableDeclaration", "let x", `(def x nil)`); // Not sure if correct
test("VariableDeclaration", "const x = 1", `(def x 1)`);
test("VariableDeclaration", "const x = x => x", `(defn x [x] x)`);

test("VariableDeclarator", "const x = x => x", `(defn x [x] x)`);

test("FunctionDeclaration", "function f(a, b) { return a }", `(defn f [a b] a)`);

test("FunctionExpression", "(function(a, b) { return a })", `(fn [a b] a)`);

test("ArrowFunctionExpression", "((a, b) => a)", `(fn [a b] a)`);

test("ReturnStatement", "function f(a, b) { return a }", `(defn f [a b] a)`);

test("CallExpression", "x.y.z()", `(.z (.-y x))`);
test("CallExpression", "global.setTimeout()", `(.setTimeout js/global)`);
test("CallExpression", "[1, ...[2, 3], 4]", `(.concat #js [1] #js [2 3] 4)`);
test("CallExpression", "[1, ...x, ...y.z]", `(.concat (.concat #js [1] x) (.-z y))`);

test("MemberExpression", "x.y", `(.-y x)`);
test("MemberExpression", "x.y()", `(.y x)`);
test("MemberExpression", `x["y"]`, `(aget x "y")`);
test("MemberExpression", `x["y"]()`, `((aget x "y"))`);
test("MemberExpression", `this.x`, `(this-as this (.-x this))`); // FIXME
test("MemberExpression", `this.x()`, `(this-as this (.x this))`);

test("StringLiteral", `"xasd"`, `"xasd"`); // FIXME

const missingTests = Object.keys(astTransforms).filter(fname => !astTypes.has(fname));
console.log("Missing tests for following AST types");
console.log(missingTests);

if (errors.length > 0) {
    errors.forEach(({actual, expected}) => {
        console.log("Failed test");
        console.log(actual)
        console.log(expected)
    })
    process.exit(1)
} else {
    console.log(`${tests} tests passed`);
}