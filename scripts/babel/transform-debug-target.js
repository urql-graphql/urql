const dispatchProperty = 'dispatchDebug';
const visited = 'visitedByDebugTargetTransformer';

const warningDevCheckTemplate = `
  if (process.env.NODE_ENV !== 'production' && typeof ${dispatchProperty} !== undefined) {
    NODE;
  }
`.trim();


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
      ObjectProperty(path) {
        if (path.node.key && path.node.key.name === dispatchProperty && !path.node[visited]) {
          path.node[visited] = true;
		      path.node.value = t.conditionalExpression(
            t.binaryExpression(
              '!==',
              t.memberExpression(
                t.memberExpression(
                  t.identifier('process'),
                  t.identifier('env')
                ),
                t.identifier('NODE_ENV')
              ),
              t.stringLiteral('production')
            ),
            path.node.value,
            t.arrowFunctionExpression([], t.blockStatement([]))
          );
        }
      },
      ExpressionStatement(path) {
        if (
          !path.node[visited] &&
          path.node.expression.callee &&
          path.node.expression.callee.name === dispatchProperty
        ) {
          path.node[visited] = true;
          path.replaceWith(wrapWithDevCheck({ NODE: path.node }));
        }

        path.node.visitedByDebugTargetTransformer = true;
        path.replaceWith(wrapWithDevCheck({ NODE: path.node }));
      },
    },
  };
};

module.exports = plugin;
