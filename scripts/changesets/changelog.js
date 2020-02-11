const { config } = require('dotenv');
const { getInfo } = require('@changesets/get-github-info');

config();

const REPO = 'FormidableLabs/urql';

/** Creates a "(See X)" string from a template */
const templateSeeRef = links => {
  const humanReadableLinks = links
    .filter(Boolean)
    .map(link => {
      if (typeof link === 'string') return link;
      return link.pull || link.commit;
    });

  const size = humanReadableLinks.length;
  if (size === 0) return '';

  const str = size > 2
    ? humanReadableLinks.map((x, i) => i === size - 1 ? `and ${x}` : x).join(', ')
    : humanReadableLinks.join(' and ');
  return `(See ${str})`;
};

const changelogFunctions = {
  getDependencyReleaseLine: async (
    changesets,
    dependenciesUpdated,
  ) => {
    if (dependenciesUpdated.length === 0) return '';

    const dependenciesLinks = await Promise.all(
      changesets.map(async cs => {
        if (cs.commit) {
          const { links } = await getInfo({
            repo: REPO,
            commit: cs.commit
          });

          return links;
        }
      })
    );

    let changesetLink = '- Updated dependencies';

    const seeRef = templateSeeRef(dependenciesLinks);
    if (seeRef) changesetLink += ` ${seeRef}`;

    const detailsLinks = dependenciesUpdated.map(dep => {
      return `  - ${dep.name}@${dep.newVersion}`;
    });

    return [changesetLink, ...detailsLinks].join('\n');
  },
  getReleaseLine: async (changeset, type) => {
    const [firstLine, ...futureLines] = changeset.summary
      .trim()
      .split(/[\r\n]+/)
      .map(l => l.trimRight());

    let pull, commit, user;
    if (changeset.commit) {
      const { links } = await getInfo({
        repo: REPO,
        commit: changeset.commit
      });

      pull = links.pull || undefined;
      commit = links.commit || undefined;
      user = links.user || undefined;
    }

    let annotation = '';
    if (type === 'patch' && /^\s*fix/i.test(firstLine)) {
      annotation = '⚠️ ';
    }

    let str = `\n- ${annotation}${firstLine}`;
    if (futureLines.length > 0) {
      str += `\n${futureLines.map(l => `  ${l}`).join('\n')}`;
    }

    if (user) {
      str += `, by ${user}`;
    }

    if (pull || commit) {
      const seeRef = templateSeeRef([pull || commit]);
      if (seeRef) str += ` ${seeRef}`;
    }

    return str;
  }
};

module.exports = {
  ...changelogFunctions,
  default: changelogFunctions
};
