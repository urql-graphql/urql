// eslint-disable-next-line
const { defineConfig } = require('cypress');

module.exports = defineConfig({
  video: false,

  component: {
    specPattern: './**/e2e-tests/*spec.tsx',
    devServer: {
      framework: 'react',
      bundler: 'vite',
      viteConfig: {
        server: {
          fs: {
            allow: ['../..'],
          },
        },
      },
    },
  },
});
