/**
 * Upload docs to surge.
 */
const path = require('path');
const chalk = require('chalk');
const execa = require('execa');

if (!process.env.SURGE_LOGIN || !process.env.SURGE_TOKEN) {
  console.warn('No SURGE_* env variables received. Skipping.');
  process.exit(0);
}

if (!process.env.PR_NUMBER) {
  console.warn('No PR_NUMBER env variable received. Skipping.');
  process.exit(0);
}

const PR_NUM = process.env.PR_NUMBER;
const PROJECT = 'urql';
const SRC = path.resolve(__dirname, '../../dist');
const DOMAIN = `formidable-com-${PROJECT}-staging-${PR_NUM}.surge.sh`;

const EXECA_OPTS = {
  stdio: 'inherit',
};

const { log } = console;
const logMsg = msg => log(chalk`[{cyan deploy/surge}] ${msg}`);

const main = async () => {
  logMsg(chalk`Uploading files to {cyan ${DOMAIN}}`);
  await execa('yarn', ['run', 'surge', '--project', SRC, '--domain', DOMAIN], EXECA_OPTS);
};

if (require.main === module) {
  main().catch(err => {
    console.error(err); // eslint-disable-line no-console
    process.exit(0); // We don't fail CI on errors in staging
  });
}
