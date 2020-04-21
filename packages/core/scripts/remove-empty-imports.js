const { transformSync: transform } = require('@babel/core');
const fs = require('fs');

const nonMinified = [
  `${process.cwd()}/dist/urql-core.js`,
  `${process.cwd()}/dist/urql-core.mjs`,
  `${process.cwd()}/dist/urql-core-internal.js`,
  `${process.cwd()}/dist/urql-core-internal.mjs`,
];

const removeEmptyImports = (babel) => {
  const { types: t } = babel;

  return {
    visitor: {
      ImportDeclaration(path) {
        const { specifiers } = path.node
        if (specifiers.length === 0) {
          path.remove();
        }
      },
      CallExpression(path) {
        if (
          t.isIdentifier(path.node.callee) &&
          path.node.callee.name === 'require' &&
          path.parent.type !== 'VariableDeclarator'
        ) {
          path.remove();
        }
      }
    }
  };
}

nonMinified.forEach(loc => {
  const { code: newCode } = transform(fs.readFileSync(loc), { plugins: [removeEmptyImports], babelrc: false });
  fs.writeFileSync(loc, newCode);
});
