// eslint-disable-next-line
const { startDevServer } = require('@cypress/vite-dev-server');

/**
 * @type {Cypress.PluginConfig}
 */
module.exports = (on, _config) => {
  on('dev-server:start', options => startDevServer({ options }));
};
