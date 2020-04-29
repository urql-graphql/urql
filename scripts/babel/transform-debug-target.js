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

  let name = 'unknownExchange';

  return {
    visitor: {
      ExportNamedDeclaration(path) {
        if (path.node.declaration && path.node.declaration.declarations && path.node.declaration.declarations[0] && path.node.declaration.declarations[0].id) {
          const exportName = path.node.declaration.declarations[0].id.name;
          if (/Exchange$/i.test(exportName)) name = exportName;
        }
      },
      CallExpression(path) {
        if (
          !path.node[visited] &&
          path.node.callee &&
          path.node.callee.name === dispatchProperty
        ) {
          path.node[visited] = true;
          if (t.isObjectExpression(path.node.arguments[0])) {
            path.node.arguments[0].properties.push(
              t.objectProperty(
                t.stringLiteral('source'),
                t.stringLiteral(name)
              )
             );
          }

          path.replaceWith(wrapWithDevCheck({ NODE: path.node }));
        }
      }
    }
  };
};

export default plugin;
