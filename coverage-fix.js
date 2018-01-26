module.exports = function hacks() {
  return {
    visitor: {
      Program(programPath) {
        programPath.traverse({
          ArrowFunctionExpression(path) {
            const node = path.node;
            node.expression = node.body.type !== 'BlockStatement';
          },
        });
      },
    },
  };
};
