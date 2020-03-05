/**
 * Upload docs to surge.
 */
const path = require('path');
const chalk = require('chalk');
const execa = require('execa');

const PROJECT = 'urql';
const { CIRCLE_SHA1 } = process.env;
const COMMIT_HASH = CIRCLE_SHA1.slice(0, 7);
const SRC = path.resolve(__dirname, '../../dist');
const DOMAIN = `formidable-com-${PROJECT}-staging-${COMMIT_HASH}.surge.sh`;

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
    process.exit(1); // eslint-disable-line no-process-exit
  });
}
