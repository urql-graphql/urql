const visited = 'visitedByInvariantWarningTransformer';

const warningDevCheckTemplate = `
  if (process.env.NODE_ENV !== 'production') {
    NODE;
  }
`.trim();

const plugin = ({ template }) => {
  const wrapWithDevCheck = template(
    warningDevCheckTemplate,
    { placeholderPattern: /^NODE$/ }
  );

  return {
    visitor: {
      CallExpression(path) {
        const { name } = path.node.callee;
        if ((name === 'warning' || name === 'invariant') && !path.node[visited]) {
          path.node[visited] = true;
          path.replaceWith(wrapWithDevCheck({ NODE: path.node }));
        }
      }
    }
  };
};

export default plugin;
