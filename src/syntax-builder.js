function walk(node) {
  if (Array.isArray(node.children)) {
    node.children.forEach(ch => walk(ch));
  }
}

module.exports = walk;
