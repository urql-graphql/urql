const plugin = ({ template, types: t }) => {
  const wrapWithDevCheck = template(
    `
      if (process.env.NODE_ENV !== 'production') {
        NODE;
      }
    `.trim(),
    {
      placeholderPattern: /^NODE$/,
    }
  );
  return {
    visitor: {
      ExpressionStatement(path) {
        if (
          !path.node.expression.callee ||
          path.node.expression.callee.name !== 'dispatchDebug'
        ) {
          return;
        }

        path.node.visitedByDebugTargetTransformer = true;
        path.replaceWith(wrapWithDevCheck({ NODE: path.node }));
      },
    },
  };
};

module.exports = plugin;
