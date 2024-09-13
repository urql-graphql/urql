// eslint-disable-next-line
const { defineConfig } = require('cypress');

module.exports = defineConfig({
  video: false,

  e2e: {
    setupNodeEvents(_on, _config) {
      /*noop*/
    },
    supportFile: false,
  },
  component: {
    specPattern: './**/e2e-tests/*spec.tsx',
    devServer: {
      framework: 'react',
      bundler: 'vite',
      viteConfig: {
        server: {
          fs: {
            allow: ['..'],
          },
        },
      },
    },
  },
});
