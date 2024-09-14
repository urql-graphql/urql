import * as path from 'path';
import { getPackageManifest, getPackageArtifact } from './packages.mjs';
import { DefaultArtifactClient } from '@actions/artifact';

export const uploadArtifact = async cwd => {
  const manifest = getPackageManifest(cwd);
  const artifact = getPackageArtifact(cwd);
  console.log('> Uploading', manifest.name);

  try {
    const client = new DefaultArtifactClient();
    await client.uploadArtifact(artifact, [path.resolve(cwd, artifact)], cwd, {
      continueOnError: false,
    });
  } catch (error) {
    console.error('> Uploading failed', manifest.name);
    throw error;
  }
};
