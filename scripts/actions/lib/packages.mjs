import * as path from 'path';
import * as fs from 'fs/promises';
import glob from 'glob';

import { workspaceRoot, workspaces, require } from './constants.mjs';

const getPackageManifest = (cwd) =>
  require(path.resolve(cwd, 'package.json'));

const updatePackageManifest = async (cwd, manifest) => {
  try {
    if (!!getPackageManifest(cwd)) {
      await fs.writeFile(
        path.resolve(cwd, 'package.json'),
        JSON.stringify(manifest, null, 2) + '\n',
      );
    }
  } catch (error) {
    throw new Error('package.json does not exist in: ' + cwd);
  }
};

const getPackageArtifact = (cwd) => {
  const pkg = getPackageManifest(cwd);
  const name =
    pkg.name[0] === "@"
      ?  pkg.name.slice(1).replace(/\//g, '-')
      : pkg.name;
  return `${name}-v${pkg.version}.tgz`;
};

const listPackages = async () => {
  let manifests = await Promise.all(
    workspaces.map(dir => glob(`${dir}/package.json`))
  );

  manifests = manifests.reduce((acc, manifests) => {
    acc.push(...manifests);
    return acc;
  }, []);

  let packages = manifests
    .filter(pkg => !require(path.join(workspaceRoot, pkg)).private)
    .map(pkg => path.resolve(pkg, '../'));

  if (process.env.NODE_TOTAL) {
    const nodeTotal = parseInt(process.env.NODE_TOTAL, 10) || 1;
    const nodeIndex = parseInt(process.env.NODE_INDEX, 10) % nodeTotal;
    packages = packages.filter((_, i) => i % nodeTotal === nodeIndex);
    console.log(`> Node ${nodeIndex + 1} of ${nodeTotal}.`);
  }

  return packages;
};

const listArtifacts = async () => {
  return (await listPackages()).map(cwd => {
    const artifact = getPackageArtifact(cwd);
    return path.resolve(cwd, artifact);
  });
};

export {
  getPackageManifest,
  updatePackageManifest,
  getPackageArtifact,
  listPackages,
  listArtifacts,
};
