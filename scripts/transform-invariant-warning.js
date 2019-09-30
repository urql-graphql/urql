const visited = 'visitedByInvariantWarningTransformer';

const warningDevCheckTemplate = `
  if (process.env.NODE_ENV !== 'production') {
    NODE;
  }
`.trim();

const plugin = ({ template, types: t }) => {
  const wrapWithDevCheck = template(
    warningDevCheckTemplate,
    { placeholderPattern: /^NODE$/ }
  );

  return {
    visitor: {
      CallExpression(path) {
        const { name } = path.node.callee;
        if ((name === 'warning') && !path.node[visited]) {
          path.node[visited] = true;
          path.replaceWith(wrapWithDevCheck({ NODE: path.node }));
        } else if (name === 'invariant' && !path.node[visited]) {
          path.node[visited] = true;
          const formerNode = path.node.arguments[1];
          path.node.arguments[1] = t.conditionalExpression(
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
            formerNode,
            t.stringLiteral('')
          )
        }
      }
    }
  };
};

export default plugin;
