const path = require("path");

module.exports = {
  entry: path.resolve(__dirname, "src/ui.js"),
  output: {
    path: path.resolve(__dirname, "public"),
    filename: "bundle.js"
  }
};
