import { transformSync as transform } from '@babel/core';
import { createFilter } from '@rollup/pluginutils';
import { posix as path } from 'path';

import * as settings from './settings.mjs';

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
      }
    },

    generateBundle(_options, bundle) {
      const basePath = path.relative(
        path.resolve(settings.cwd, '../..'),
        path.join(settings.cwd, 'src'),
      );

      for (const fileName in bundle) {
        if (!dtsFilter(fileName)) {
          continue;
        } else if (fileName.startsWith(basePath)) {
          const targetPath = fileName.slice(basePath.length + 1);
          bundle[fileName].fileName = path.join('types', targetPath);;
        } else {
          delete bundle[fileName];
        }
      }
    },
  };
}

export default cleanup;
