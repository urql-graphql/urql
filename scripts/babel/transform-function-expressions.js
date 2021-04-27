const plugin = ({ types: t }) => ({
  visitor: {
    FunctionExpression(path) {
      if (
        t.isVariableDeclarator(path.parent) &&
        t.isProgram(path.parentPath.scope.block)
      ) {
        const expr = path.node;
        const decl = path.parent;
        const decls = path.parentPath.parent.declarations;
        const parent = path.parentPath.parentPath.parent;

        let replacement = t.functionDeclaration(
          decl.id,
          expr.params,
          expr.body,
          expr.generator,
          expr.async,
        );

        if (t.isExportNamedDeclaration(parent)) {
          replacement = t.exportNamedDeclaration(replacement);
        }

        path.parentPath.parentPath.insertBefore(replacement);

        if (decls.length <= 1) {
          path.parentPath.parentPath.remove();
        } else {
          path.remove();
        }
      }
    }
  }
});

export default plugin;
