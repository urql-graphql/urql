const jsTagsPlugin = ({ types: t }) => ({
  visitor: {
    TaggedTemplateExpression(path) {
      if (path.node.tag.name !== 'js') return;

      const expressions = path.node.quasi.expressions;

      const quasis = path.node.quasi.quasis.map((x) =>
        x.value.cooked
          .replace(/\s*[=(){},;:!]\s*/g, (x) => x.trim())
          .replace(/\s+/g, ' ')
          .replace(/^\s+$/g, '')
      );

      const concat = expressions.reduceRight(
        (prev, node, i) =>
          t.binaryExpression(
            '+',
            t.stringLiteral(quasis[i]),
            t.binaryExpression('+', node, prev)
          ),
        t.stringLiteral(quasis[quasis.length - 1])
      );

      path.replaceWith(concat);
    },
  },
});

export default jsTagsPlugin;
