import { resolve } from 'path';

import constants from './src/constants';
import Document from './src/html';

const docsContentPath = resolve(__dirname, '../../docs/core');

export default {
  plugins: [
    resolve(__dirname, 'plugins/monorepo-fix/'),

    [
      resolve(__dirname, 'plugins/source-markdown/'),
      {
        location: docsContentPath,
        template: './src/screens/docs',
      },
    ],

    'react-static-plugin-styled-components',
    'react-static-plugin-sitemap',
    'react-static-plugin-react-router',
  ],

  paths: {
    nodeModules: '../../node_modules',
    src: 'src',
    dist: 'dist',
    buildArtifacts: 'node_modules/.cache/react-static/artifacts/',
    devDist: 'node_modules/.cache/react-static/dist/',
    temp: 'node_modules/.cache/react-static/temp/',
  },

  basePath: 'open-source/urql',
  stagingBasePath: '',
  devBasePath: '',

  getSiteData: () => ({
    title: constants.docsTitle
  }),

  getRoutes: async () => [
    {
      path: '/',
      template: require.resolve('./src/screens/home'),
    },
  ],
};
