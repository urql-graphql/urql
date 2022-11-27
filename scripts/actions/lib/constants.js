const path = require('path');

module.exports = {
  workspaceRoot: path.resolve(__dirname, '../../../'),
  workspaces: [
    'packages/*',
    'exchanges/*',
  ],
};
