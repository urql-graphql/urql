#!/usr/bin/env node

const path = require('path');

const cwd = process.cwd();
const pkg = require(path.resolve(cwd, 'package.json'));

if (pkg.scripts.prepare) {
  require('../prepare/index.js');
}

const fs = require('fs');
const tar = require('tar');
const stream = require('stream');
const packlist = require('npm-packlist');
const { promisify } = require('util');

const pipeline = promisify(stream.pipeline);

const getTarballName = (pkg) => {
  const name =
    pkg.name[0] === "@"
      ? // scoped packages get special treatment
        pkg.name.substr(1).replace(/\//g, "-")
      : pkg.name;
  return `${name}-v${pkg.version}.tgz`;
};

const pack = async () => {
  const files = await packlist({ path: cwd });
  const name = getTarballName(pkg);

  const input = tar.create(
    {
      cwd,
      prefix: 'package/',
      portable: true,
      gzip: true,
    },
    files.map((f) => `./${f}`)
  );

  const output = fs.createWriteStream(name);

  await pipeline(
    input,
    output
  );
};

(async () => {
  try {
    await pack();
  } catch (e) {
    process.exit(1);
  }
})();
