import { parse } from 'cjs-module-lexer';
import { createFilter } from '@rollup/pluginutils';

function cleanup(opts = {}) {
  const filter = createFilter(opts.include, opts.exclude, {
    resolve: false
  });

  return {
    name: "cjs-check",

    renderChunk(code, chunk) {
      if (opts.extension !== '.js') {
        return null;
      } else if (!filter(chunk.fileName)) {
        return null;
      }

      const output = parse(code);

      let hasMissing = false;
      for (const mod of chunk.exports) {
        if (mod[0] == '*' && !output.reexports.includes(mod.slice(1))) {
          hasMissing = true;
          console.error(`Missing Module Re-Export: ${mod.slice(1)}`)
        } else if (mod[0] != '*' && !output.exports.includes(mod)) {
          hasMissing = true;
          console.error(`Missing Module Export: ${mod}`)
        }
      }

      if (hasMissing) {
        throw new Error('cjs-module-lexer did not agree with Rollup\'s exports.');
      }

      return null;
    }
  };
}

export default cleanup;
