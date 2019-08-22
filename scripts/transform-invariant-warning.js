const visited = 'visitedByInvariantWarningTransformer';

export default function Plugin({ template }) {
  const wrapWithDevCheck = template(
      `
    if (process.env.NODE_ENV !== "production") {
      NODE;
    }
  `,
    { placeholderPattern: /^NODE$/ }
  );

  return {
    visitor: {
      Program(p) {
        p.traverse({
          CallExpression(path) {
            if (path.node[visited]) return
            path.node[visited] = true;
            if (path.node.callee.name === 'invariant' || path.node.callee.name === 'warning') {
              path.replaceWith(wrapWithDevCheck({ NODE: path.node }));
            }
          }
        })
      },
    },
  };
}
