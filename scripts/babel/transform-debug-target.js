const dispatchProperty = 'dispatchDebug';
const visited = 'visitedByDebugTargetTransformer';
const warningDevCheckTemplate = `
  if (process.env.NODE_ENV !== 'production' && typeof ${dispatchProperty} !== undefined) {
    NODE;
  }
`.trim();

const dispatchDebugTemplate = `dispatchDebug: process.env.NODE_ENV !== 'production' ? NODE : () => {}`.trim();

const plugin = ({ template }) => {
  const wrapWithDevCheck = template(
    warningDevCheckTemplate,
    { placeholderPattern: /^NODE$/ }
  );

  const wrapDispatchDebug = template(
    dispatchDebugTemplate,
    { placeholderPattern: /^NODE$/ }
  );

  return {
    visitor: {
      ObjectProperty(path) {
        if (path.node.key && path.node.key.name === 'dispatchDebug' && !path.node[visited]) {
          path.node[visited] = true;
		      path.replaceWith(wrapDispatchDebug({ NODE: path.node.value }));
        }
      },
      ExpressionStatement(path) {
        if (
          !path.node[visited] &&
          path.node.expression.callee &&
          path.node.expression.callee.name === 'dispatchDebug'
        ) {
          path.node[visited] = true;
          path.replaceWith(wrapWithDevCheck({ NODE: path.node }));
        }
      }
    }
  };
};

export default plugin;
