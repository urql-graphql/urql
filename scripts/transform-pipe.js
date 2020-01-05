const pipeExpression = (t, pipeline) => {
  let x = pipeline[0];
  for (let i = 1; i < pipeline.length; i++)
    x = t.callExpression(pipeline[i], [x]);
  return x;
};

const pipePlugin = ({ types: t }) => ({
  visitor: {
    ImportDeclaration(path, state) {
      if (path.node.source.value === 'wonka') {
        const { specifiers } = path.node;
        const pipeSpecifierIndex = specifiers.findIndex(spec => {
          return spec.imported.name === 'pipe';
        });

        if (pipeSpecifierIndex > -1) {
          const pipeSpecifier = specifiers[pipeSpecifierIndex];
          state.pipeName = pipeSpecifier.local.name;
          if (specifiers.length > 1) {
          path.node.specifiers.splice(pipeSpecifierIndex, 1);
          } else {
          	path.remove();
          }
        }
      }
    },
    CallExpression(path, state) {
      if (state.pipeName) {
        const callee = path.node.callee;
        const args = path.node.arguments;
        if (callee.name !== state.pipeName) {
          return;
        } else if (args.length === 0) {
          path.replaceWith(t.identifier('undefined'));
        } else {
          path.replaceWith(pipeExpression(t, args));
        }
      }
    }
  }
});

export default pipePlugin;
