import * as core from "@actions/core";
import * as github from "@actions/github";
import fetch from 'node-fetch';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const WEBHOOK_URL = process.env.DISCORD_URQL_WEBHOOK_URL;

async function main() {
  const octokit = github.getOctokit(GITHUB_TOKEN);

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
    return octokit.rest.repos.getReleaseByTag({
      owner: 'urql-graphql',
      repo: 'urql',
      tag: `${entry.name}@${entry.version}`
    })
  })

  const releases = (await Promise.allSettled(releasePromises))
    .map(x => x.status === 'fulfilled' && x.value.status === 200 ? x.value.data : undefined)
    .filter(Boolean)

  // Construct message
  const text = releases.map((release) => {
    const { name: title, body: changes, html_url: url } = release;

    return `:package: ${title}\n${changes}\n${url}`;
  }, '').join('\n\n')

  // Send message through a discord webhook or bot
  const response = fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username: 'philpl', content: `:bell: urql Release day!\n${text}` })
  })

  if (!response.ok) {
    console.log('Something went wrong while sending the discord webhook.');
    return;
  }

  return response;
}

main().then().catch(console.error)
