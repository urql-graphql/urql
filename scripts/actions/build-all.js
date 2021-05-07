#!/usr/bin/env node

const { listPackages } = require('./lib/packages');
const { buildPackage } = require('./lib/commands');

(async () => {
  try {
    const packages = await listPackages();
    const builds = packages.map(buildPackage);
    await Promise.all(builds);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
})();
