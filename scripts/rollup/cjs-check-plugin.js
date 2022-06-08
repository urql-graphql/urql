import { parse } from 'cjs-module-lexer';
import { createFilter } from '@rollup/pluginutils';

function cleanup(opts = {}) {
  const filter = createFilter(opts.include, opts.exclude, {
    resolve: false
  });

  return {
    name: "cleanup",

    renderChunk(code, chunk) {
      if (opts.extension !== '.js') {
        return null;
      } else if (!filter(chunk.fileName)) {
        return null;
      }

      const output = parse(code);
      const matches = chunk.exports.every(mod => {
        if (mod[0] == '*') {
          return output.reexports.indexOf(mod.slice(1)) > -1;
        } else {
          return output.exports.indexOf(mod) > -1;
        }
      });

      if (!matches) {
        throw new Error('cjs-module-lexer did not agree with Rollup\'s exports.');
      }

      return null;
    }
  };
}

export default cleanup;
