#!/usr/bin/env node

const invariant = require('invariant');
const path = require('path');
const fs = require('fs');

const cwd = process.cwd();
const workspaceRoot = path.resolve(__dirname, '../../');
const pkg = require(path.resolve(cwd, 'package.json'));

const hasReact = [
  'dependencies',
  'optionalDependencies',
  'peerDependencies',
].some(dep => pkg[dep] && pkg[dep].react);

const hasNext = [
  'dependencies',
  'optionalDependencies',
  'peerDependencies',
].some(dep => pkg[dep] && pkg[dep].next);

const normalize = name =>
  name
    .replace(/[@\s/.]+/g, ' ')
    .trim()
    .replace(/\s+/, '-')
    .toLowerCase();

const name = normalize(pkg.name);

const posixPath = x => path.normalize(x).split(path.sep).join('/');

const is = (a, b) => posixPath(a) === posixPath(b);

invariant(
  pkg.publishConfig.provenance === true,
  'package.json:publishConfig.provenance must be set to true'
);

if (pkg.name.startsWith('@urql/')) {
  invariant(
    pkg.publishConfig.access === 'public',
    'package.json:publishConfig.access must be set to public for @urql/* packages'
  );
}

invariant(!is(cwd, workspaceRoot), 'prepare-pkg must be run in a package.');

invariant(
  fs.existsSync(pkg.source || 'src/index.ts'),
  'package.json:source must exist'
);

if (hasReact && !hasNext) {
  invariant(
    is(pkg.main, path.join('dist', `${name}.js`)),
    'package.json:main path must end in `.js` for packages depending on React.'
  );

  invariant(
    is(pkg.module, path.join('dist', `${name}.es.js`)),
    'package.json:module path must end in `.es.js` for packages depending on React.'
  );
} else {
  invariant(
    is(pkg.main, path.join('dist', `${name}`)),
    'package.json:main path must be valid and have no extension'
  );

  invariant(
    is(pkg.module, path.join('dist', `${name}.mjs`)),
    'package.json:module path must be valid and ending in .mjs'
  );
}

invariant(
  is(pkg.types, path.join('dist', `${name}.d.ts`)),
  'package.json:types path must be valid'
);

invariant(
  is(pkg.repository.directory, path.relative(workspaceRoot, cwd)),
  'package.json:repository.directory path is invalid'
);

invariant(pkg.sideEffects === false, 'package.json:sideEffects must be false');

invariant(!!pkg.author, 'package.json:author must be defined');

invariant(pkg.license === 'MIT', 'package.json:license must be "MIT"');

invariant(
  Array.isArray(pkg.files) &&
    pkg.files.some(x => path.normalize(x).startsWith('dist')) &&
    pkg.files.some(x => path.normalize(x) === 'LICENSE'),
  'package.json:files must include "dist" and "LICENSE"'
);

if (hasReact && !hasNext) {
  invariant(
    !pkg.exports,
    'package.json:exports must not be added for packages depending on React.'
  );
} else {
  invariant(
    !!pkg.exports,
    'package.json:exports must be added and have a "." entry'
  );
  invariant(!!pkg.exports['.'], 'package.json:exports must have a "." entry');
  invariant(
    !!pkg.exports['./package.json'],
    'package.json:exports must have a "./package.json" entry'
  );

  for (const key in pkg.exports) {
    const entry = pkg.exports[key];
    if (entry === './package.json') continue;

    const entryName = normalize(key);
    const bundleName = entryName ? `${name}-${entryName}` : name;
    invariant(
      fs.existsSync(entry.source),
      `package.json:exports["${key}"].source must exist`
    );

    invariant(
      is(entry.require, `./dist/${bundleName}.js`),
      `package.json:exports["${key}"].require must be valid`
    );

    invariant(
      is(entry.import, `./dist/${bundleName}.mjs`),
      `package.json:exports["${key}"].import must be valid`
    );

    invariant(
      is(entry.types, `./dist/${bundleName}.d.ts`),
      'package.json:types path must be valid'
    );

    invariant(
      Object.keys(entry)[0] === 'types',
      'package.json:types must come first'
    );
  }
}

fs.copyFileSync(
  path.resolve(workspaceRoot, 'LICENSE'),
  path.resolve(cwd, 'LICENSE'),
  0
);
