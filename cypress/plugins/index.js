/// <reference types="cypress" />
// ***********************************************************
// This example plugins/index.js can be used to load plugins
//
// You can change the location of this file or turn off loading
// the plugins file with the 'pluginsFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/plugins-guide
// ***********************************************************

// eslint-disable-next-line
const { startDevServer } = require('@cypress/vite-dev-server');

/**
 * @type {Cypress.PluginConfig}
 */
module.exports = (on, _config) => {
  on('dev-server:start', options => startDevServer({ options }));
};
