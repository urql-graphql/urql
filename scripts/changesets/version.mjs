#!/usr/bin/env node

import glob from 'glob';
import { execa } from 'execa';

import {
  getPackageManifest,
  updatePackageManifest,
  listPackages
} from '../actions/lib/packages.mjs';

const versionRe = /^\d+\.\d+\.\d+/i;
const execaOpts = { stdio: 'inherit' };

await execa('changeset', ['changeset', 'version'], execaOpts);
await execa('pnpm', ['install', '--lockfile-only'], execaOpts);

const packages = (await listPackages()).reduce((map, dir) => {
  const manifest = getPackageManifest(dir);
  const versionMatch = manifest.version.match(versionRe);
  if (versionMatch) {
    const { name } = manifest;
    const version = `^${versionMatch[0]}`;
    map[name] = version;
  }
  return map;
}, {});

const examples = (await glob('./examples/*/')).filter(x => !/node_modules$/.test(x));
console.log(`Scope: updating ${examples.length} examples`)
for (const example of examples) {
  const manifest = getPackageManifest(example);

  if (manifest.dependencies) {
    for (const name in manifest.dependencies) {
      if (packages[name] && packages[name] !== manifest.dependencies)
        manifest.dependencies[name] = packages[name];
    }
  }

  if (manifest.devDependencies) {
    for (const name in manifest.devDependencies) {
      if (packages[name] && packages[name] !== manifest.devDependencies)
        manifest.devDependencies[name] = packages[name];
    }
  }

  await updatePackageManifest(example, manifest);
}
