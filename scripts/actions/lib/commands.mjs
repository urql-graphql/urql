import * as stream from 'stream';
import * as path from 'path';
import * as fs from 'fs';
import { promisify } from 'util';

import * as tar from 'tar';
import { execa, execaNode } from 'execa';
import Arborist from '@npmcli/arborist';
import packlist from 'npm-packlist';

import { workspaceRoot, require } from './constants.mjs';
import { getPackageManifest, getPackageArtifact } from './packages.mjs';

const pipeline = promisify(stream.pipeline);

const buildPackage = async cwd => {
  const manifest = getPackageManifest(cwd);
  console.log('> Building', manifest.name);

  try {
    await execa('run-s', ['build'], {
      preferLocal: true,
      localDir: workspaceRoot,
      cwd,
    });
  } catch (error) {
    console.error('> Build failed', manifest.name);
    throw error;
  }
};

const preparePackage = async cwd => {
  const manifest = getPackageManifest(cwd);
  console.log('> Preparing', manifest.name);

  try {
    await execaNode(require.resolve('../../prepare/index.js'), { cwd });
  } catch (error) {
    console.error('> Preparing failed', manifest.name);
    throw error;
  }
};

const packPackage = async cwd => {
  const manifest = getPackageManifest(cwd);
  const artifact = getPackageArtifact(cwd);
  console.log('> Packing', manifest.name);

  const arborist = new Arborist({ path: cwd });
  const tree = await arborist.loadActual();

  try {
    await pipeline(
      tar.create(
        {
          cwd,
          prefix: 'package/',
          portable: true,
          gzip: true,
        },
        (await packlist(tree)).map(f => `./${f}`)
      ),
      fs.createWriteStream(path.resolve(cwd, artifact))
    );
  } catch (error) {
    console.error('> Packing failed', manifest.name);
    throw error;
  }
};

export { buildPackage, preparePackage, packPackage };
