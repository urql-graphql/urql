const checkForTypeCheck = (node) => {
  if (node.type === "LogicalExpression") {
    return checkForTypeCheck(node.left) || checkForTypeCheck(node.right);
  } else if (node.left && node.left.operator === "typeof" && node.left.argument.name === "process") {
    return true;
  }
  return false;
};

const plugin = ({ template, types: t }) => {
  const typeCheckNode = template.expression.ast`typeof process !== 'undefined'`;

  return {
    visitor: {
      BinaryExpression(path) {
        const { node } = path;
        const { left } = node;
        if (left && left.property && left.property.name === "NODE_ENV") {
          const logicalExpression = path.findParent((path) => path.isLogicalExpression());
          if (!logicalExpression) {
            // This is a normal singular if-statement
            path.replaceWith(t.logicalExpression("&&", typeCheckNode, node));
          } else {
            // This is a logical expression, we need to find out whether or not we're already using the check.
            const { left, right } = logicalExpression.node;
            console.log(left, right);
            if (checkForTypeCheck(left) || checkForTypeCheck(right)) return;
            logicalExpression.replaceWith(t.logicalExpression("&&", typeCheckNode, logicalExpression.node));
          }
        }
      }
    }
  };
};

export default plugin;
