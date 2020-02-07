#!/usr/bin/env node

const path = require('path');
const execa = require('execa');

const { compilerOptions: { paths } } = require('../../tsconfig.json');
const workspaceRoot = path.resolve(__dirname, '../../');
const rollupConfig = path.resolve(__dirname, './config.js');

let packages = Object.keys(paths).map(package => {
  return path.resolve(workspaceRoot, paths[package][0], '../');
});

// CircleCI parallelism
// See: https://github.com/facebook/react/blob/901d76bc5c8dcd0fa15bb32d1dfe05709aa5d273/scripts/rollup/build.js#L705-L710
if (process.env.CIRCLE_NODE_TOTAL) {
  const nodeTotal = parseInt(process.env.CIRCLE_NODE_TOTAL, 10);
  const nodeIndex = parseInt(process.env.CIRCLE_NODE_INDEX, 10);
  packages = packages.filter((_, i) => i % nodeTotal === nodeIndex);
}

(async () => {
  for (const package of packages) {
    const packageName = path.relative(workspaceRoot, package);
    console.log('> Building', packageName);

    try {
      await execa(
        'rollup',
        ['--silent', '-c', rollupConfig],
        {
          preferLocal: true,
          localDir: workspaceRoot,
          cwd: package,
        }
      );
    } catch (error) {
      console.error('> Build failed', packageName);
      console.error(error.message);
      process.exit(-1);
    }
  }
})();
