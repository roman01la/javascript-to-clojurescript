function generate(node) {
  if (node.type === "program") {
    return node.children.map(generate).join("");
  }
  if (node.type === "symbol") {
    return node.name;
  }
  if (node.type === "NumericLiteral") {
    return node.value;
  }
  if (node.type === "StringLiteral") {
    return JSON.stringify(node.value);
  }
  if (node.type === "list") {
    const items = node.children;
    return `(${items.map(generate).join(" ")})\n\n`;
  }
  if (node.type === "vector") {
    const items = node.children;
    return `[${items.map(generate).join(" ")}]`;
  }
  if (node.type === "keyword") {
    return `:${node.value}`;
  }
  if (node.type === "ArrayExpression") {
    const items = node.children;
    return `#js [${items.map(generate).join(" ")}]`;
  }
  if (node.type === "ObjectExpression") {
    const items = node.children;
    return `#js {${items.map(generate).join(" ")}}`;
  }
  if (node.type === "ObjectProperty") {
    const [key, value] = node.children;
    return `:${generate(key)} ${generate(value)}`;
  }
  if (node.type === "tagged") {
    return `${node.tag} ${generate(node.expr)}`;
  }
  if (node.type === "hashMap") {
    const items = node.children;
    return `{${items.map(generate).join(" ")}}`;
  }
  if (node.type === "mapEntry") {
    const [key, value] = node.children;
    return `${generate(key)} ${generate(value)}`;
  }
  if (node.type === "EmptyStatement") {
    return undefined;
  }
  if (node.type === "BreakStatement") {
    return undefined;
  }

  console.info(node);
}

module.exports = generate;
