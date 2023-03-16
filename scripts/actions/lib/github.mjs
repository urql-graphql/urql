import * as path from 'path';
import { getPackageManifest, getPackageArtifact } from './packages.mjs';
import { create } from '@actions/artifact';

let _client;
const client = () => {
  return _client || (_client = create());
};

export const uploadArtifact = async (cwd) => {
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
