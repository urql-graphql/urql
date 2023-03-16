#!/usr/bin/env node

import { listPackages } from './lib/packages.mjs';
import { buildPackage } from './lib/commands.mjs';

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
