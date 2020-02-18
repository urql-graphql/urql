import { resolve } from 'path';
import { metaData } from './static-config-parts/constants';
import Document from './src/html';

const docsContentPath = resolve(__dirname, '../../docs');

export default {
  plugins: [
    resolve(__dirname, 'static-config-parts/'),

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
    title: metaData.title,
  }),

  getRoutes: async () => [
    {
      path: '/',
      template: require.resolve('./src/screens/home'),
    },
  ],
};
