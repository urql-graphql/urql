import * as os from 'os';
import { resolve } from 'path';
import constants from './src/constants';
import Document from './src/html';

const isStaging = process.env.REACT_STATIC_STAGING === 'true';
const basePath = 'open-source/urql';

export default {
  plugins: [
    resolve(__dirname, 'plugins/monorepo-fix/'),
    resolve(__dirname, 'plugins/preact'),
    [
      'react-static-plugin-md-pages',
      {
        location: '../../docs',
        template: './src/screens/docs',
        pathPrefix: 'docs',
      },
    ],

    'react-static-plugin-styled-components',
    'react-static-plugin-sitemap',
    'react-static-plugin-react-router',
  ],

  paths: {
    src: 'src',
    dist: isStaging ? `dist/${basePath}` : 'dist',
    buildArtifacts: 'node_modules/.cache/react-static/artifacts/',
    devDist: 'node_modules/.cache/react-static/dist/',
    temp: 'node_modules/.cache/react-static/temp/',
    public: 'public', // The public directory (files copied to dist during build)
  },

  basePath: 'open-source/urql',
  stagingBasePath: '',
  devBasePath: '',

  Document,

  getSiteData: () => ({
    title: constants.docsTitle,
  }),

  maxThreads: Math.min(8, os.cpus().length / 2),

  getRoutes: async () => [
    {
      path: '/',
      template: require.resolve('./src/screens/home'),
    },
    {
      path: '/concepts/core-package',
      redirect: '/basics/core',
    },
    {
      path: '/basics/getting-started',
      redirect: '/basics',
    },
    {
      path: '/basics/mutations',
      redirect: '/basics',
    },
    {
      path: '/basics/queries',
      redirect: '/basics',
    },
    {
      path: '/basics/document-caching',
      redirect: '/concepts/document-caching',
    },
    {
      path: '404',
      template: require.resolve('./src/screens/404'),
    },
  ],
};
