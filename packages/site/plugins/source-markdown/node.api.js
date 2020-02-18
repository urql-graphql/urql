import { sync as glob } from 'glob';
import { createSharedData } from 'react-static/node';
import { read as readVFile } from 'to-vfile';
import frontmatter from 'remark-frontmatter';
import squeeze from 'remark-squeeze-paragraphs';
import GithubSlugger from 'github-slugger';
import { select, selectAll } from 'unist-util-select';
import toString from 'mdast-util-to-string';
import { parse as yaml } from 'yaml';
import remark from 'remark';
import * as path from 'path';

const slugger = new GithubSlugger();
const cwd = process.cwd();

const staticPluginSourceMarkdown = (opts = {}) => {
  const location = path.resolve(cwd, opts.location);
  const template = path.resolve(cwd, opts.template);
  const pathPrefix = opts.pathPrefix || '';
  const plugins = opts.remarkPlugins || [];

  // Find all markdown files in the given location
  const mds = glob('**/*.md', { cwd: location }).map(x =>
    path.resolve(location, x)
  );

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

  const getMarkdownData = async () => {
    return Promise.all(
      mds.map(async originalPath => {
        // Reproduce the current markdown file's route path
        const relative = path.relative(location, originalPath);
        const filename = path.basename(relative, '.md');
        const dirname = path.dirname(relative);

        // Parse the given markdown file into MAST
        const vfile = await readVFile(originalPath);
        const tree = processor.parse(vfile);

        slugger.reset();

        // Find all headings and convert them to a reusable format
        const headings = selectAll('heading', tree).map(node => {
          const value = toString(node);
          const depth = node.depth;
          const slug = slugger.slug(value);
          return { value, slug, depth };
        });

        // Parse the frontmatter yaml data to JSON
        const frontmatter = yaml(select('yaml', tree)?.value);

        // Add fallback for Frontmatter title to first h1 heading
        frontmatter.title =
          frontmatter.title || headings.find(x => x.depth === 1)?.value || path;

        return {
          originalPath: path.join(dirname, filename),
          path: path.join(pathPrefix, dirname, filename),
          headings,
          frontmatter,
        };
      })
    );
  };

  return {
    async getRoutes() {
      // Get page data for each discovered markdown file
      const markdownPages = await getMarkdownData();
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
    webpack(config, { defaultLoaders }) {
      // Create a rule that only applies to the discovered markdown files
      config.module.rules[0].oneOf.unshift({
        test: /.md$/,
        // Limit the rule strictly to the files we have
        include: mds,
        use: [
          defaultLoaders.jsLoader.use[0],
          // The loader will parse the markdown to an MDX-compatible HAST
          // and will wrap it in the actual template given in `opts.template`
          {
            loader: require.resolve('./loader'),
            options: {
              template,
              processor,
              mds,
            },
          },
        ],
      });

      return config;
    },
  };
};

export default staticPluginSourceMarkdown;
