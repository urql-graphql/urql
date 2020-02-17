import { resolve } from 'path';

import { getSidebarItems } from './static-config-helpers/md-data-transforms';
import { metaData } from './static-config-parts/constants';
import { createSharedData } from 'react-static/node';
import Document from './src/html';

const docsContentPath = resolve(__dirname, '../../docs/core');

export default {
  plugins: [
    'react-static-plugin-styled-components',
    'react-static-plugin-sitemap',
    'react-static-plugin-react-router',
    resolve(__dirname, 'static-config-parts'),
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

  getRoutes: async () => {
    const sidebarItems = await getSidebarItems(docsContentPath);
    const rawSidebarHeaders = sidebarItems.map(d => ({
      title: d.title,
      path: `/${d.slug}/`,
      slug: d.slug,
    }));
    const rawToc = sidebarItems.reduce((memo, item) => {
      const subArray = item.data.subHeadings.map(sh => ({
        content: sh.value,
        level: sh.depth,
      }));
      memo[item.slug] = subArray;
      return memo;
    }, {});
    const toc = createSharedData(rawToc);
    const sidebarHeaders = createSharedData(rawSidebarHeaders);

    return [
      {
        path: '/',
        template: require.resolve('./src/screens/home'),
      },
      {
        path: '/docs',
        template: 'src/screens/docs',
        sharedData: { toc, sidebarHeaders },
        getData: () => ({
          title: `${metaData.title} | Documentation`,
          markdown: sidebarItems[0].markdown,
          renderedMd: sidebarItems[0].content,
          slug: sidebarItems[0].slug,
        }),
        // move slug + path to data in transform, renderedMd to data, and nuke markdown prop
        children: sidebarItems.map(
          ({ slug, path, markdown, content, data }) => ({
            path,
            template: 'src/screens/docs',
            sharedData: { toc, sidebarHeaders },
            getData: () => ({
              title: data.title,
              markdown,
              slug,
              renderedMd: content,
            }),
          })
        ),
      },
    ];
  },
  // Document,
};
