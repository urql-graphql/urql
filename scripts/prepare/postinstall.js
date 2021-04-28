const path = require('path');
const fs = require('fs');

const hookSource = path.resolve(__dirname, '../../node_modules/husky-v4/sh/husky.sh');
const hook = path.resolve(__dirname, '../../.git/hooks/husky.sh');
const localHook = path.resolve(__dirname, '../../.git/hooks/husky.local.sh');
const gitConfig = path.resolve(__dirname, '../../.git/config');

let script = fs.readFileSync(hookSource, { encoding: 'utf-8' });
script = script.replace(`$(basename "$0")`, `$(basename "$0" .sh)`);

let config = fs.readFileSync(gitConfig, { encoding: 'utf-8' });
config = config.replace(/\s*hooksPath\s*=\s*\.husky\n?/g, '\n');

fs.writeFileSync(hook, script);
fs.writeFileSync(gitConfig, config);

fs.writeFileSync(
  localHook,
  'packageManager=yarn\n' +
    'cd "."\n'
);
