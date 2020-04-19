const dispatchProperty = 'dispatchDebug';
const visited = 'visitedByDebugTargetTransformer';

const warningDevCheckTemplate = `
  process.env.NODE_ENV !== 'production' ? NODE : undefined
`.trim();

const plugin = ({ template, types: t }) => {
  const wrapWithDevCheck = template.expression(
    warningDevCheckTemplate,
    { placeholderPattern: /^NODE$/ }
  );

  return {
    visitor: {
      CallExpression(path) {
        if (
          !path.node[visited] &&
          path.node.callee &&
          path.node.callee.name === dispatchProperty
        ) {
          path.node[visited] = true;
          path.replaceWith(wrapWithDevCheck({ NODE: path.node }));
        }
      }
    }
  };
};

export default plugin;
