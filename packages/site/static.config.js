import { resolve } from 'path';
import constants from './src/constants';
import Document from './src/html';

export default {
  plugins: [
    resolve(__dirname, 'plugins/monorepo-fix/'),

    [
      'react-static-plugin-md-pages',
      {
        location: '../../docs',
        template: './src/screens/docs',
      },
    ],

    'react-static-plugin-styled-components',
    'react-static-plugin-sitemap',
    'react-static-plugin-react-router',
  ],

  paths: {
    src: 'src',
    dist: 'dist',
    buildArtifacts: 'node_modules/.cache/react-static/artifacts/',
    devDist: 'node_modules/.cache/react-static/dist/',
    temp: 'node_modules/.cache/react-static/temp/',
  },

  basePath: 'open-source/urql',
  stagingBasePath: '',
  devBasePath: '',

  Document,

  getSiteData: () => ({
    title: constants.docsTitle,
  }),

  getRoutes: async () => [
    {
      path: '/',
      template: require.resolve('./src/screens/home'),
    },
  ],
};
