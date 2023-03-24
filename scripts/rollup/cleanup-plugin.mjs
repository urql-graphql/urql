import { transformSync as transform } from '@babel/core';
import { createFilter } from '@rollup/pluginutils';

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

function cleanup() {
  const emptyImportRe = /import\s+(?:'[^']+'|"[^"]+")\s*;?/g;
  const gqlImportRe = /(import\s+(?:[*\s{}\w\d]+)\s*from\s*'graphql';?)/g;
  const jsFilter = createFilter(/.m?js$/, null, { resolve: false });
  const dtsFilter = createFilter(/\.d\.ts(\.map)?$/, null, { resolve: false });

  return {
    name: "cleanup",

    renderChunk(code, chunk) {
      if (jsFilter(chunk.fileName)) {
        return transform(code, {
          plugins: [removeEmptyImports],
          babelrc: false
        });
      } else if (dtsFilter(chunk.fileName)) {
        return code
          .replace(emptyImportRe, '')
          .replace(gqlImportRe, x => '/*!@ts-ignore*/\n' + x);
      }
    },
  };
}

export default cleanup;
