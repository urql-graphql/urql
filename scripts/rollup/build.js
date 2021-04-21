#!/usr/bin/env node

const path = require('path');
const glob = require('glob').sync;
const execa = require('execa');

const workspaceRoot = path.resolve(__dirname, '../../');

let packages = glob('{packages,exchanges}/*/package.json')
  .filter(pkg => !require(path.join(workspaceRoot, pkg)).private)
  .map(pkg => path.resolve(pkg, '../'));

if (process.env.NODE_TOTAL) {
  const nodeTotal = parseInt(process.env.NODE_TOTAL, 10) || 1;
  const nodeIndex = parseInt(process.env.NODE_INDEX, 10) % nodeTotal;
  packages = packages.filter((_, i) => i % nodeTotal === nodeIndex);
  console.log(`> Node ${nodeIndex + 1} of ${nodeTotal}.`);
}

const builds = packages.map(async package => {
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
    console.error(error);
    throw error;
  }
});

(async () => {
  try {
    await Promise.all(builds);
  } catch (e) {
    process.exit(1);
  }
})();
