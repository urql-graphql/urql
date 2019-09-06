const pipeExpression = (t, pipeline) => {
  if (pipeline.length === 1) {
    return pipeline[0];
  } else {
    const operator = pipeline[pipeline.length - 1];
    const rest = pipeline.slice(0, -1);
    return t.callExpression(
      pipeExpression(t, rest),
      [operator]
    );
  }
};

const pipePlugin = ({ types: t }) => ({
  visitor: {
    ImportDeclaration(path) {
      if (path.node.source.value === 'wonka') {
        const specifiers = path.node.specifiers.filter(spec => {
          return spec.imported.name !== 'pipe';
        });

        if (specifiers.length > 0) {
          path.node.specifiers = specifiers;
        } else {
          path.remove();
        }
      }
    },
    CallExpression(path) {
      const callee = path.node.callee;
      const args = path.node.arguments;
      if (callee.name !== 'pipe') {
        return;
      } else if (args.length === 0) {
        path.replaceWith(t.identifier('undefined'));
      } else {
        path.replaceWith(pipeExpression(t, args));
      }
    }
  }
});

export default pipePlugin;
