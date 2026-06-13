#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative } from "node:path";

const root = process.cwd();
const config = JSON.parse(readFileSync(join(root, ".changeset/config.json"), "utf8"));
const ignored = new Set(config.ignore || []);
const access = config.access || "public";

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function packageJsonPathsFromWorkspace() {
  const paths = [];

  function visit(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (
        entry.name === ".git" ||
        entry.name === "node_modules" ||
        entry.name === ".pnpm" ||
        entry.name === "dist" ||
        entry.name === "coverage"
      ) {
        continue;
      }

      const path = join(dir, entry.name);
      if (entry.isDirectory()) {
        visit(path);
      } else if (entry.isFile() && entry.name === "package.json") {
        paths.push(path);
      }
    }
  }

  visit(root);
  return paths;
}

function packageJsonPaths() {
  return [...new Set(packageJsonPathsFromWorkspace())].filter(existsSync);
}

function versionExists(name, version) {
  const result = spawnSync("npm", ["view", `${name}@${version}`, "version", "--json"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

  if (result.status === 0) return true;
  const output = `${result.stdout}
${result.stderr}`;
  if (output.includes("E404") || output.includes("No match found")) return false;

  process.stdout.write(result.stdout);
  process.stderr.write(result.stderr);
  throw new Error(`Could not check npm version for ${name}@${version}`);
}

function distTag(version) {
  const prerelease = version.match(/^[^-]+-([0-9A-Za-z-]+)/);
  return prerelease ? prerelease[1] : "latest";
}

function runGit(args) {
  const result = spawnSync("git", args, {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  process.stdout.write(result.stdout);
  process.stderr.write(result.stderr);
  if (result.status !== 0) process.exit(result.status || 1);
}

function hasLocalGitTag(tagName) {
  const result = spawnSync(
    "git",
    ["rev-parse", "--verify", "--quiet", `refs/tags/${tagName}`],
    {
      cwd: root,
      stdio: "ignore",
    }
  );
  return result.status === 0;
}

function createGitTag(tagName) {
  if (hasLocalGitTag(tagName)) {
    console.log(`Git tag ${tagName} already exists locally.`);
  } else {
    runGit(["tag", tagName, "-m", tagName]);
  }

  // changesets/action parses this line, then pushes the tag and creates the GitHub release.
  console.log(`New tag: ${tagName}`);
}

const staged = [];
for (const packageJsonPath of packageJsonPaths()) {
  const pkg = readJson(packageJsonPath);
  if (!pkg.name || !pkg.version || pkg.private || ignored.has(pkg.name)) continue;
  if (versionExists(pkg.name, pkg.version)) {
    console.log(`Skipping ${pkg.name}@${pkg.version}; already published.`);
    continue;
  }

  const packageDir = dirname(packageJsonPath);
  const tag = distTag(pkg.version);
  const args = [
    "stage",
    "publish",
    packageDir,
    "--provenance",
    "--access",
    pkg.publishConfig?.access || access,
    "--tag",
    tag,
    "--json",
  ];

  console.log(`Staging ${pkg.name}@${pkg.version} with dist-tag ${tag}...`);
  const result = spawnSync("pnpm", args, {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  process.stdout.write(result.stdout);
  process.stderr.write(result.stderr);
  if (result.status !== 0) process.exit(result.status || 1);

  const stageId = result.stdout.match(/"stageId"\s*:\s*"([^"]+)"/)?.[1];
  const tagName = `${pkg.name}@${pkg.version}`;
  createGitTag(tagName);

  staged.push({
    name: pkg.name,
    version: pkg.version,
    path: relative(root, packageDir) || ".",
    stageId,
  });
}

if (staged.length === 0) {
  console.log("No unpublished packages to stage.");
} else {
  console.log("Staged packages:");
  for (const pkg of staged) {
    console.log(`- ${pkg.name}@${pkg.version}${pkg.stageId ? ` (${pkg.stageId})` : ""}`);
  }
  console.log("Approve staged packages with `npm stage approve <stage-id>` after review.");
}
