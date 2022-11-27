// eslint-disable-next-line
const { defineConfig } = require('cypress');
// eslint-disable-next-line
const tsconfigPaths = require('vite-tsconfig-paths').default;

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
        plugins: [tsconfigPaths()],
        server: {
          fs: {
            allow: ['..'],
          },
        },
      },
    },
  },
});
