#!/usr/bin/env node

const path = require('path');
const glob = require('glob').sync;
const execa = require('execa');

const workspaceRoot = path.resolve(__dirname, '../../');

let packages = glob('{packages,exchanges}/*/package.json')
  .filter(pkg => !require(path.join(workspaceRoot, pkg)).private)
  .map(pkg => path.resolve(pkg, '../'));

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
        'run-s',
        ['build'],
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
