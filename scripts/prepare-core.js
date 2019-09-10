const fs = require('fs');
const path = require('path');

var dir = path.resolve(process.cwd(), 'core');

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
    name: '@urql/core',
    version: mainPkgJson.version,
    private: true,
    description: mainPkgJson.description,
    repository: mainPkgJson.repository,
    bugs: mainPkgJson.bugs,
    homepage: mainPkgJson.homepage,
    main: '../dist/cjs/core.js',
    module: '../dist/es/core.js',
    types: '../dist/types/index.core.d.ts',
    source: '../src/client.ts',
    sideEffects: false,
    author: mainPkgJson.author,
    license: mainPkgJson.license,
  },
  undefined,
  2
);

fs.writeFileSync(pathToPkgJson, contents);
