#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const dir = path.resolve(__dirname, '../extras');
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir);
}

const pathToPkgJson = path.resolve(dir, 'package.json');
if (fs.existsSync(pathToPkgJson)) {
  fs.unlinkSync(pathToPkgJson);
}

const mainPkgJson = require('../package.json');

const contents = JSON.stringify(
  {
    name: '@urql/exchange-graphcache-extras',
    version: mainPkgJson.version,
    private: true,
    sideEffects: false,
    description: mainPkgJson.description,
    repository: mainPkgJson.repository,
    bugs: mainPkgJson.bugs,
    homepage: mainPkgJson.homepage,
    main: '../dist/urql-exchange-graphcache-extras.js',
    module: '../dist/urql-exchange-graphcache-extras.es.js',
    types: '../dist/types/extras/index.d.ts',
    source: '../src/extras/index.ts',
    author: mainPkgJson.author,
    license: mainPkgJson.license,
  },
  undefined,
  2
);

fs.writeFileSync(pathToPkgJson, contents);
