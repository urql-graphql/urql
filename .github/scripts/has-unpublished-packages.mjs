import { appendFileSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

async function readWorkspacePatterns() {
  const workspace = await readFile('pnpm-workspace.yaml', 'utf8');
  const patterns = [];
  let inPackages = false;

  for (const line of workspace.split('\n')) {
    if (line === 'packages:') {
      inPackages = true;
      continue;
    }

    if (inPackages && line && !line.startsWith(' ')) {
      break;
    }

    const match = line.match(/^\s+-\s+['"]?([^'"]+)['"]?\s*$/);

    if (inPackages && match) {
      patterns.push(match[1]);
    }
  }

  return patterns.filter(pattern => !pattern.startsWith('!'));
}

async function expandWorkspacePattern(pattern) {
  const normalized = pattern.replace(/^\.\//, '');

  if (normalized === '.') {
    return [process.cwd()];
  }

  if (!normalized.endsWith('/*')) {
    return [];
  }

  const directory = normalized.slice(0, -2);
  const entries = await readdir(directory, { withFileTypes: true });

  return entries
    .filter(entry => entry.isDirectory())
    .map(entry => path.join(process.cwd(), directory, entry.name));
}

async function getWorkspacePackages() {
  const directories = (await Promise.all((await readWorkspacePatterns()).map(expandWorkspacePattern)))
    .flat();
  const packages = [];

  for (const directory of directories) {
    try {
      const pkg = JSON.parse(await readFile(path.join(directory, 'package.json'), 'utf8'));

      if (!pkg.private && pkg.name && pkg.version) {
        packages.push({ name: pkg.name, version: pkg.version });
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  return packages.sort((a, b) => a.name.localeCompare(b.name));
}

async function hasPublishedVersion(pkg) {
  const response = await fetch(`https://registry.npmjs.org/${encodeURIComponent(pkg.name)}`, {
    headers: { accept: 'application/vnd.npm.install-v1+json' },
  });

  if (response.status === 404) {
    return false;
  }

  if (!response.ok) {
    throw new Error(`Failed to query ${pkg.name}: ${response.status} ${response.statusText}`);
  }

  const metadata = await response.json();
  return Object.prototype.hasOwnProperty.call(metadata.versions ?? {}, pkg.version);
}

async function main() {
  const packages = await getWorkspacePackages();
  let hasUnpublished = false;

  for (const pkg of packages) {
    const isPublished = await hasPublishedVersion(pkg);

    if (isPublished) {
      console.log(`${pkg.name}@${pkg.version} is already published`);
    } else {
      console.log(`${pkg.name}@${pkg.version} is not published yet`);
      hasUnpublished = true;
    }
  }

  const output =
    [`has_unpublished=${String(hasUnpublished)}`, `should_publish=${String(hasUnpublished)}`].join(
      '\n'
    ) + '\n';

  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, output);
  } else {
    process.stdout.write(output);
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
