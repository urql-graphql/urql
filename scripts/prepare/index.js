#!/usr/bin/env node

const invariant = require('invariant');
const path = require('path');
const fs = require('fs');

const cwd = process.cwd();
const workspaceRoot = path.resolve(__dirname, '../../');
const pkg = require(path.resolve(cwd, 'package.json'));

const normalize = name => name
  .replace(/[@\s\/\.]+/g, ' ')
  .trim()
  .replace(/\s+/, '-')
  .toLowerCase();

const name = normalize(pkg.name);

invariant(
  path.normalize(cwd) !== path.normalize(workspaceRoot),
  'prepare-pkg must be run in a package.'
);

invariant(
  fs.existsSync(pkg.source || 'src/index.ts'),
  'package.json:source must exist'
);

invariant(
  path.normalize(pkg.main) === `dist/${name}.cjs.js`,
  'package.json:main path must be valid'
);

invariant(
  path.normalize(pkg.module) === `dist/${name}.esm.js`,
  'package.json:module path must be valid'
);

invariant(
  path.normalize(pkg.types) === 'dist/types/'
    + path.relative('src', pkg.source || 'src/index.ts')
      .replace(/\.ts$/, '.d.ts'),
  'package.json:types path must be valid'
);

invariant(
  path.normalize(pkg.repository.directory) ===
    path.relative(workspaceRoot, cwd),
  'package.json:repository.directory path is invalid'
);

invariant(
  pkg.sideEffects === false,
  'package.json:sideEffects must be false'
);

invariant(
  pkg.license === 'MIT',
  'package.json:license must be "MIT"'
);

invariant(
  Array.isArray(pkg.files) &&
    pkg.files.some(x => path.normalize(x) === 'dist/') &&
    pkg.files.some(x => path.normalize(x) === 'LICENSE'),
  'package.json:files must include "dist" and "LICENSE"'
);

if (pkg.exports) {
  invariant(!!pkg.exports['.'], 'package.json:exports must have a "." entry');

  for (const key in pkg.exports) {
    const entry = pkg.exports[key];
    const entryName = normalize(key);
    const bundleName = entryName ? `${name}-${entryName}` : name;

    invariant(
      fs.existsSync(entry.source),
      `package.json:exports["${key}"].source must exist`
    );

    invariant(
      path.normalize(entry.require) === `dist/${bundleName}.cjs.js`,
      `package.json:exports["${key}"].require must be valid`
    );

    invariant(
      path.normalize(entry.import) === `dist/${bundleName}.esm.js`,
      `package.json:exports["${key}"].import must be valid`
    );

    invariant(
      path.normalize(entry.types) === 'dist/types/'
        + path.relative('src', entry.source).replace(/\.ts$/, '.d.ts'),
      'package.json:types path must be valid'
    );
  }
}

fs.copyFileSync(
  path.resolve(workspaceRoot, 'LICENSE'),
  path.resolve(cwd, 'LICENSE'), cwd
);
