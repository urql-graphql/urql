import * as os from 'os';
import { resolve } from 'path';
import constants from './src/constants';
import Document from './src/html';

const isStaging = process.env.REACT_STATIC_ENV === 'staging';
const isProduction = process.env.REACT_STATIC_ENV === 'production';

export default {
  plugins: [
    resolve(__dirname, 'plugins/assets-fix/'),
    resolve(__dirname, 'plugins/monorepo-fix/'),
    resolve(__dirname, 'plugins/react-router/'),
    (isStaging || isProduction) && resolve(__dirname, 'plugins/preact/'),
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
  ].filter(Boolean),

  paths: {
    src: 'src',
    dist: `dist/${basePath}`,
    buildArtifacts: 'node_modules/.cache/react-static/artifacts/',
    devDist: 'node_modules/.cache/react-static/dist/',
    temp: 'node_modules/.cache/react-static/temp/',
    assetsPath: 'static',
    public: 'public', // The public directory (files copied to dist during build)
  },

  basePath,
  stagingBasePath: basePath,
  devBasePath: basePath,

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
      path: '/docs/concepts/core-package',
      redirect: '/docs/basics/core',
    },
    {
      path: '/docs/basics/getting-started',
      redirect: '/docs/basics',
    },
    {
      path: '/docs/basics/mutations',
      redirect: '/docs/basics',
    },
    {
      path: '/docs/basics/queries',
      redirect: '/docs/basics',
    },
    {
      path: '404',
      template: require.resolve('./src/screens/404'),
    },
    {
      path: '/docs/graphcache/custom-updates',
      redirect: '/docs/graphcache/cache-updates',
    },
    {
      path: '/docs/graphcache/computed-queries',
      redirect: '/docs/graphcache/local-resolvers',
    },
    {
      path: '/docs/graphcache/under-the-hood',
      redirect: '/docs/graphcache/normalized-caching',
    },
    {
      path: '/docs/concepts/document-caching',
      redirect: '/docs/basics/document-caching',
    },
    {
      path: '/docs/concepts/errors',
      redirect: '/docs/basics/errors',
    },
    {
      path: '/docs/concepts',
      redirect: '/docs/architecture',
    },
    {
      path: '/docs/concepts/stream-patterns',
      redirect: '/docs/architecture',
    },
    {
      path: '/docs/concepts/philosophy',
      redirect: '/docs/architecture',
    },
    {
      path: '/docs/concepts/exchanges',
      redirect: '/docs/advanced/authoring-exchanges',
    },
  ],
};
