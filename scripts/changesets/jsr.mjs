#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

import { getPackageManifest, listPackages } from '../actions/lib/packages.mjs';

const getExports = exports => {
  const exportNames = Object.keys(exports);
  const eventualExports = {};
  for (const exportName of exportNames) {
    if (exportName.includes('package.json')) continue;
    const exp = exports[exportName];
    eventualExports[exportName] = exp.source;
  }
  return eventualExports;
};

export const updateJsr = async () => {
  (await listPackages()).forEach(dir => {
    const manifest = getPackageManifest(dir);
    const jsrManifest = {
      name: manifest.name,
      version: manifest.version,
      exports: manifest.exports
        ? getExports(manifest.exports)
        : manifest.source,
      exclude: [
        'node_modules',
        'cypress',
        '**/*.test.*',
        '**/*.spec.*',
        '**/*.test.*.snap',
        '**/*.spec.*.snap',
      ],
    };

    fs.writeFileSync(
      path.resolve(dir, 'jsr.json'),
      JSON.stringify(jsrManifest, undefined, 2)
    );
  });
};
