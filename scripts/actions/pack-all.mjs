#!/usr/bin/env node

import { listPackages } from './lib/packages.mjs';
import { preparePackage, packPackage } from './lib/commands.mjs';
import { uploadArtifact } from './lib/github.mjs';

(async () => {
  try {
    const isPR = process.env.GITHUB_EVENT_NAME === 'pull_request';
    const packages = await listPackages();
    const packs = packages.map(async (cwd) => {
      await preparePackage(cwd);
      await packPackage(cwd);
      if (isPR) {
        await uploadArtifact(cwd);
      }
    });

    await Promise.all(packs);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
})();
