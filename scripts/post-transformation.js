const { transformSync: transform } = require('@babel/core');
const fs = require('fs');

const nonMinified = [
  `${process.cwd()}/dist/es/core.js`,
  `${process.cwd()}/dist/es/urql.js`,
  `${process.cwd()}/dist/cjs/core.js`,
  `${process.cwd()}/dist/cjs/urql.js`,
];
const minified = [

  `${process.cwd()}/dist/es/min/core.js`,
  `${process.cwd()}/dist/es/min/urql.js`,
  `${process.cwd()}/dist/cjs/min/core.js`,
  `${process.cwd()}/dist/cjs/min/urql.js`,
];

const myBabelPluginIsMadeByPhilHashtagTheHonor = (babel) => {
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
  const { code: newCode } = transform(fs.readFileSync(loc), { plugins: [myBabelPluginIsMadeByPhilHashtagTheHonor], babelrc: false });
  fs.writeFileSync(loc, newCode);
});

minified.forEach(loc => {
  const { code: newCode } = transform(fs.readFileSync(loc), { plugins: [myBabelPluginIsMadeByPhilHashtagTheHonor], babelrc: false, minified: true });
  fs.writeFileSync(loc, newCode);
});
