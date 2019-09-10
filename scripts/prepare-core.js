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

const contents = JSON.stringify({
  name: '@urql/core',
  version: '1.5.0',
  private: true,
  description:
    'A highly customizable and versatile GraphQL client to use everywhere',
  repository: 'https://www.github.com/FormidableLabs/urql',
  bugs: {
    url: 'https://github.com/FormidableLabs/urql/issues',
  },
  homepage: 'https://formidable.com/open-source/urql',
  main: '../dist/cjs/core.js',
  module: '../dist/es/core.js',
  types: '../dist/types/index.core.d.ts',
  source: '../src/client.ts',
  sideEffects: false,
  author: 'Formidable',
  license: 'MIT',
}, undefined, 2);

fs.writeFileSync(pathToPkgJson, contents);
