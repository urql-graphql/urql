/** Babel plugin for cleaning up arrow function transpilation, which turns function expressions assigned to variable decalators into function declarations when it's safe to do so. */
const functionExpressionCleanup = ({ types: t }) => {
  /** Checks whether this block has only safe conditions up until the given node. */
  const isSafeUntil = (block, until) => {
    let body = [];
    if (t.isIfStatement(block)) {
      body = block.consequent;
      if (block.alternate && !isSafeUntil(block.alternate, until)) {
        return false;
      }
    } else if (t.isBlockStatement(block)) {
      body = block.body;
    }

    for (let i = 0, l = body.length; i < l; i++) {
      let node = body[i];
      if (t.isIfStatement(node)) {
        // An if statement is safe if it also is safe throughout
        if (!isSafeUntil(node, until)) return false;
      } else if (
        !t.isVariableDeclaration(node) &&
        !t.isFunctionDeclaration(node) &&
        !(t.isExpressionStatement(node) && t.isAssignmentExpression(node.expression))
      ) {
        // only variable declarations and function declarations are safe
        // assignments are fine too, since we're later checking the binding for "constantViolations"
        return false;
      } else if (node === until) {
        return true;
      }
    }

    return true;
  };

  return {
    visitor: {
      FunctionExpression(path) {
        if (!t.isVariableDeclarator(path.parent)) {
          // Must be on a variable declarator
          return;
        }

        if (
          t.isFunctionDeclaration(path.parentPath.scope.block) ||
          t.isFunctionExpression(path.parentPath.scope.block)
        ) {
          // When the function expression is nested inside another function, it may be safe
          // to turn this into a declaration, if it's only preceded by variable declarations
          // and assignments (potentially even nested in if-statements)
          if (!isSafeUntil(path.parentPath.scope.block.body, path.parentPath.parent))
            return;
        } else if (!t.isProgram(path.parentPath.scope.block)) {
          return;
        }

        const binding = path.scope.getBinding(path.parent.id.name);

        if (
          (binding.constantViolations && binding.constantViolations.length) ||
          binding.referencePaths.some(path =>
            !t.isCallExpression(path.parentPath.node) &&
            !t.isProgram(path.parentPath.node))
        ) {
          // The declaration must not be reassigned and it must only be referenced as plain calls
          return;
        }

        const fn = t.functionDeclaration(
          path.parent.id,
          path.node.params,
          path.node.body,
          path.node.generator,
          path.node.async,
        );

        // We insert after other variable declarators to not rely on hoisting and for readability
        path.parentPath.parentPath.insertAfter(
          // If the variabe is exported then the function declaration must also be exported.
          t.isExportNamedDeclaration(path.parentPath.parentPath.parent)
            ? t.exportNamedDeclaration(fn)
            : fn
        );

        if (path.parentPath.parent.declarations.length <= 1) {
          path.parentPath.parentPath.remove();
        } else {
          path.remove();
        }
      }
    }
  };
};

export default functionExpressionCleanup;
