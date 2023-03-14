const visited = 'visitedByDebugTargetTransformer';

const warningDevCheckTemplate = `
  process.env.NODE_ENV !== 'production' ? NODE : undefined
`.trim();

const noopTransformTemplate = `
  process.env.NODE_ENV !== 'production' ? NODE : FALLBACK
`.trim();

const plugin = ({ template, types: t }) => {
  const wrapWithDevCheck = template.expression(
    warningDevCheckTemplate,
    { placeholderPattern: /^NODE$/ }
  );

  const wrapWithNoopTransform = template.expression(
    noopTransformTemplate,
    { placeholderPattern: /^(NODE|FALLBACK)$/ }
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
      CallExpression(path, meta) {
        if (path.node[visited] || !path.node.callee) return;

        if (path.node.callee.name === 'dispatchDebug') {
          path.node[visited] = true;
          if (t.isObjectExpression(path.node.arguments[0]) && !meta.filename.endsWith('compose.ts')) {
            path.node.arguments[0].properties.push(
              t.objectProperty(
                t.stringLiteral('source'),
                t.stringLiteral(name)
              )
             );
          }

          path.replaceWith(wrapWithDevCheck({ NODE: path.node }));
        } else if (path.node.callee.name === 'addMetadata') {
          path.node[visited] = true;
          path.replaceWith(wrapWithNoopTransform({
            NODE: path.node,
            FALLBACK: path.node.arguments[0],
          }));
        }
      }
    }
  };
};

export default plugin;
