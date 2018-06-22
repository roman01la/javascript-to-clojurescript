const codegen = require("./code-generators");

function generate(node) {
  if (codegen.hasOwnProperty(node.type)) {
    return codegen[node.type](generate, node);
  }
  console.info(node);
  throw new Error(`${node.type} is not implemented`);
}

module.exports = generate;
