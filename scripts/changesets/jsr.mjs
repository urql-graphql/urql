#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

import {
  getPackageManifest,
  listPackages
} from '../actions/lib/packages.mjs';

const getExports = (exports) => {
  return Object.keys(exports).reduce((acc, item) => {
    if (item.includes('package.json')) return acc;

    const exp = exports[item];
    return { ...acc, [item]: exp.source }
  })
}

export const updateJsr = async () => {
  (await listPackages()).forEach((dir) => {
    const manifest = getPackageManifest(dir);

    const jsrManifest = {
      name: manifest.name,
      version: manifest.version,
      exports: manifest.exports ? getExports(manifest.exports) : manifest.source,
      exclude: ['node_modules', 'cypress']
    }

    fs.writeFileSync(path.resolve(dir, 'jsr.json'), JSON.stringify(jsrManifest, undefined, 2));
  });
}

