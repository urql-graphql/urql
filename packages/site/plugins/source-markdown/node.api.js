import { promisify } from 'util';
import { createSharedData } from 'react-static/node';
import { read as readVFile } from 'to-vfile';
import frontmatter from 'remark-frontmatter';
import squeeze from 'remark-squeeze-paragraphs';
import GithubSlugger from 'github-slugger';
import { select, selectAll } from 'unist-util-select';
import toString from 'mdast-util-to-string';
import { parse as yaml } from 'yaml';
import * as path from 'path';
import remark from 'remark';
import nodeGlob from 'glob';

const glob = promisify(nodeGlob);

const staticPluginSourceMarkdown = (opts = {}) => ({
  async getRoutes(_, { config }) {
    // Resolve target location from ROOT folder
    const location = path.resolve(config.paths.ROOT, opts.location);

    // Get page data for each discovered markdown file
    const markdownPages = await getMarkdownData(
      getMarkdownProcessor(opts.remarkPlugins),
      location,
      opts.pathPrefix
    );

    // Share data, since all pages will be displayed e.g. in the sidebar
    const pages = createSharedData(markdownPages);

    // Create react-static routes for each page
    return markdownPages.map(page => ({
      path: page.path,
      // The markdown file becomes the "template" which the Webpack loader
      // below picks up
      template: `${path.resolve(location, page.originalPath)}.md`,
      sharedData: { pages },
      getData: () => ({ ...page, headings: undefined }),
    }));
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

const getMarkdownData = async (processor, location, pathPrefix = '') => {
  const slugger = new GithubSlugger();

  // Find all markdown files in the given location
  const mds = (await glob('**/*.md', { cwd: location })).map(x =>
    path.resolve(location, x)
  );

  // Map each markdown to its page data
  return Promise.all(
    mds.map(async originalPath => {
      // Reproduce the current markdown file's route path
      const relative = path.relative(location, originalPath);
      const filename = path.basename(relative, '.md');
      const dirname = path.dirname(relative);
      const newPath = path.join(pathPrefix, dirname, filename);

      // Parse the given markdown file into MAST
      const vfile = await readVFile(originalPath);
      const tree = processor.parse(vfile);

      // Parse the frontmatter yaml data to JSON
      const frontmatter = yaml(select('yaml', tree)?.value || '') || {};

      // Find all headings and convert them to a reusable format
      const headings = selectAll('heading', tree).map(node => {
        const depth = node.depth;
        const value = (depth === 1 && frontmatter.title) || toString(node);
        const slug = slugger.slug(value);
        return { value, slug, depth };
      });

      // Add fallback for Frontmatter title to first h1 heading
      frontmatter.title =
        frontmatter.title ||
        headings.find(x => x.depth === 1)?.value ||
        newPath;

      return {
        section: dirname,
        originalPath: path.join(dirname, filename),
        path: newPath,
        headings,
        frontmatter,
      };
    })
  );
};

export default staticPluginSourceMarkdown;
