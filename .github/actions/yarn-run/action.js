const run = require('execa')(
  'yarn',
  ['run', process.env.INPUT_COMMAND],
  { cwd: process.cwd(), }
);

run.stdout.pipe(process.stdout);
run.stderr.pipe(process.stderr);

run
  .then(result => process.exit(result.exitCode))
  .catch(error => process.exit(error.exitCode || -1));
