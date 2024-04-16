import * as core from "@actions/core";
import * as github from "@actions/github";
import fetch from 'node-fetch';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const WEBHOOK_URL = process.env.DISCORD_URQL_WEBHOOK_URL;

const octokit = github.getOctokit(GITHUB_TOKEN);

const formatBody = (input) => {
  const titleRe = /(?:^|\n)#+[^\n]+/g;
  const updatedDepsRe = /\n-\s*Updated dependencies[\s\S]+\n(\n\s+-[\s\S]+)*/ig;
  const markdownLinkRe = /\[([^\]]+)\]\(([^\)]+)\)/g;
  const creditRe = new RegExp(`Submitted by (?:undefined|${markdownLinkRe.source})`, 'ig');
  const repeatedNewlineRe = /(\n[ ]*)+/g;
  return input
    .replace(titleRe, '')
    .replace(updatedDepsRe, '')
    .replace(creditRe, (_match, text, url) => {
      if (!text || /@kitten|@JoviDeCroock/i.test(text))
        return '';
      return `Submitted by [${text}](${url})`;
    })
    .replace(markdownLinkRe, (_match, text, url) => {
      return `[${text}](<${url}>)`;
    })
    .replace(repeatedNewlineRe, '\n')
    .trim();
};

async function getReleaseBody(name, version) {
  const tag = `${name}@${version}`;
  const result = await octokit.rest.repos.getReleaseByTag({
    owner: 'urql-graphql',
    repo: 'urql',
    tag,
  });

  const release = result.status === 200 ? result.data : undefined;
  if (!release || !release.body) return;

  const title = ':package: [${tag}](<${release.html_url}>)\n';
  const body = formatBody(release.body);
  if (!body) return;

  return `${title}\n${body}`;
}

async function main() {
  const inputPackages = core.getInput("publishedPackages");
  let packages;

  try {
    packages = JSON.parse(inputPackages)
  } catch (e) {
    console.error('invalid JSON in publishedPackages input.')
    return;
  }

  // Get releases
  const releasePromises = packages.map(entry => {
    return getReleaseBody(entry.name, entry.version);
  });

  const content = (await Promise.allSettled(releasePromises))
    .map(x => x.status === 'fulfilled' && x.value)
    .filter(Boolean)
    .join('\n\n');

  // Send message through a discord webhook or bot
  const response = fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content })
  })

  if (!response.ok) {
    console.log('Something went wrong while sending the discord webhook.');
    return;
  }

  return response;
}

main().then().catch(console.error)
