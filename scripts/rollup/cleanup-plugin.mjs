import { createFilter } from '@rollup/pluginutils';

function cleanup() {
  const emptyImportRe = /import\s+(?:'[^']+'|"[^"]+")\s*;?/g;
  const gqlImportRe = /(import\s+(?:[*\s{}\w\d]+)\s*from\s*'graphql';?)/g;
  const dtsFilter = createFilter(/\.d\.ts(\.map)?$/, null, { resolve: false });

  return {
    name: "cleanup",

    renderChunk(input, chunk) {
      if (dtsFilter(chunk.fileName)) {
        return input
          .replace(emptyImportRe, '')
          .replace(gqlImportRe, x => '/*!@ts-ignore*/\n' + x);
      }
    },
  };
}

export default cleanup;
