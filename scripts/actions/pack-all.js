#!/usr/bin/env node

const { listPackages } = require('./lib/packages');
const { preparePackage, packPackage } = require('./lib/commands');

(async () => {
  try {
    const packages = await listPackages();
    const packs = packages.map(async (cwd) => {
      await preparePackage(cwd);
      await packPackage(cwd);
    });

    await Promise.all(packs);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
})();
