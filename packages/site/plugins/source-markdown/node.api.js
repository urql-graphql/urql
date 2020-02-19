import { createSharedData } from 'react-static/node';
import frontmatter from 'remark-frontmatter';
import squeeze from 'remark-squeeze-paragraphs';
import toString from 'mdast-util-to-string';
import { parse as yaml } from 'yaml';
import * as path from 'path';
import remark from 'remark';

import { getPages } from './markdown';

const staticPluginSourceMarkdown = (opts = {}) => ({
  async getRoutes(_, { config }) {
    // Resolve target location from ROOT folder
    const location = path.resolve(config.paths.ROOT, opts.location);

    // Get page data for each discovered markdown file
    const pages = await getPages(
      getMarkdownProcessor(opts.remarkPlugins),
      location,
      opts.pathPrefix
    );

    // Share data, since all pages will be displayed e.g. in the sidebar
    const sharedData = { pages: createSharedData(pages) };

    // Convert the page tree into the react-static route structure
    const groupToPage = page => {
      const file = page.originalPath
        ? `${path.resolve(location, page.originalPath)}.md`
        : undefined;
      const data = {
        path: page.path,
        originalPath: page.originalPath,
        frontmatter: page.frontmatter,
      };

      return {
        path: page.key,
        template: file,
        sharedData,
        getData: page.path ? () => data : undefined,
        children:
          page.children.length > 0 ? page.children.map(groupToPage) : undefined,
      };
    };

    return [groupToPage(pages)];
  },
  afterGetConfig({ config }) {
    // Register `md` files as a valid extension with react-static
    config.extensions = [...config.extensions, '.md'];
  },
  webpack(webpackConfig, { config, defaultLoaders }) {
    // Resolve target location and template from ROOT folder
    const location = path.resolve(config.paths.ROOT, opts.location);
    const template = path.resolve(config.paths.ROOT, opts.template);

    // Create a rule that only applies to the discovered markdown files
    webpackConfig.module.rules[0].oneOf.unshift({
      test: /.md$/,
      // Limit the rule strictly to the files we have
      include: [location],
      use: [
        defaultLoaders.jsLoader.use[0],
        // The loader will parse the markdown to an MDX-compatible HAST
        // and will wrap it in the actual template given in `opts.template`
        {
          loader: require.resolve('./loader'),
          options: {
            processor: getMarkdownProcessor(opts.remarkPlugins),
            template,
            location,
          },
        },
      ],
    });

    return webpackConfig;
  },
});

const getMarkdownProcessor = (plugins = []) => {
  // By default the remark parsers gets the frontmatter data and removes
  // extra-long paragraphs
  const processor = remark()
    .use(frontmatter, ['yaml'])
    .use(squeeze);

  // All plugins in opts.remarkPlugins will be added to remark
  plugins.forEach(plugin => {
    if (Array.isArray(plugin) && plugin.length > 1) {
      fn.use(plugin[0], plugin[1]);
    } else {
      fn.use(plugin);
    }
  });

  return processor;
};

export default staticPluginSourceMarkdown;
