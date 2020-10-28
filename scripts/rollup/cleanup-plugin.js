import { transformSync as transform } from '@babel/core';
import { createFilter } from '@rollup/pluginutils';
import babelPluginModularGraphQL from 'babel-plugin-modular-graphql';

function removeEmptyImports({ types: t }) {
  return {
    visitor: {
      ImportDeclaration(path) {
        if (path.node.specifiers.length === 0) {
          path.remove();
        }
      },
      CallExpression(path) {
        if (
          t.isIdentifier(path.node.callee) &&
          path.node.callee.name === 'require' &&
          t.isExpressionStatement(path.parent)
        ) {
          path.remove();
        }
      }
    }
  };
}

function cleanup(opts = {}) {
  const filter = createFilter(opts.include, opts.exclude, {
    resolve: false
  });

  return {
    name: "cleanup",

    renderChunk(code, chunk) {
      if (!filter(chunk.fileName)) {
        return null;
      }

      return transform(code, {
        plugins: [
          [babelPluginModularGraphQL, { extension: opts.extension }],
          removeEmptyImports
        ],
        babelrc: false
      });
    }
  };
}

export default cleanup;
