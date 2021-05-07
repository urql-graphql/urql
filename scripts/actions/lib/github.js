const path = require('path');
const { getPackageManifest, getPackageArtifact } = require('./packages');

let _client;
const client = () => {
  return _client || (_client = require('@actions/artifact').create());
};

const uploadArtifact = async (cwd) => {
  const manifest = getPackageManifest(cwd);
  const artifact = getPackageArtifact(cwd);
  console.log('> Uploading', manifest.name);

  try {
    await client().uploadArtifact(
      artifact,
      [path.resolve(cwd, artifact)],
      cwd,
      { continueOnError: false }
    );
  } catch (error) {
    console.error('> Uploading failed', manifest.name);
    throw error;
  }
};

module.exports = { uploadArtifact };
