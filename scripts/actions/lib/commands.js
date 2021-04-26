const path = require('path');
const execa = require('execa');
const fs = require('fs');
const tar = require('tar');
const stream = require('stream');
const packlist = require('npm-packlist');

const { workspaceRoot } = require('./constants');
const { getPackageManifest, getPackageArtifact } = require('./packages');

const pipeline = require('util').promisify(stream.pipeline);

const buildPackage = async (cwd) => {
  const manifest = getPackageManifest(cwd);
  console.log('> Building', manifest.name);

  try {
    await execa(
      'run-s',
      ['build'],
      {
        preferLocal: true,
        localDir: workspaceRoot,
        cwd,
      }
    );
  } catch (error) {
    console.error('> Build failed', manifest.name);
    throw error;
  }
};

const preparePackage = async (cwd) => {
  const manifest = getPackageManifest(cwd);
  console.log('> Preparing', manifest.name);

  try {
    await execa.node(
      require.resolve('../../prepare/index.js'),
      { cwd },
    );
  } catch (error) {
    console.error('> Preparing failed', manifest.name);
    throw error;
  }
};

const packPackage = async (cwd) => {
  const manifest = getPackageManifest(cwd);
  const artifact = getPackageArtifact(cwd);
  console.log('> Packing', manifest.name);

  try {
    await pipeline(
      tar.create(
        {
          cwd,
          prefix: 'package/',
          portable: true,
          gzip: true,
        },
        (await packlist({ path: cwd })).map((f) => `./${f}`)
      ),
      fs.createWriteStream(path.resolve(cwd, artifact))
    );
  } catch (error) {
    console.error('> Packing failed', manifest.name);
    throw error;
  }
};

module.exports = { buildPackage, preparePackage, packPackage };
