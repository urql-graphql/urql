const path = require('path');
const cwd = process.cwd();

const pkg = require(path.resolve(cwd, './package.json'));

export const name = pkg.name
  .replace(/[@\s\/]+/g, ' ')
  .trim()
  .replace(/\s+/, '-')
  .toLowerCase();

export const source = pkg.source || './src/index.ts';

export const externalModules = ['dns', 'fs', 'path', 'url'];
if (pkg.peerDependencies)
  externalModules.push(...Object.keys(pkg.peerDependencies));
if (pkg.dependencies)
  externalModules.push(...Object.keys(pkg.dependencies));

const externalPredicate = new RegExp(`^(${externalModules.join('|')})($|/)`);

export const isExternal = id => {
  if (id === 'babel-plugin-transform-async-to-promises/helpers') {
    return false;
  }

  return externalPredicate.test(id);
};

export const hasReact = externalModules.includes('react');
export const hasPreact = externalModules.includes('preact');
