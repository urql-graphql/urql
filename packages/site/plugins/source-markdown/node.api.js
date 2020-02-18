import { sync as glob } from 'glob';
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
  const plugins = opts.remarkPlugins || [];

  // Find all markdown files in the given location
  const mds = glob('**/*.md', { cwd: location })
    .map(x => path.resolve(location, x));

  // By default the remark parsers gets the frontmatter data and removes
  // extra-long paragraphs
  const processor = remark()
    .use(frontmatter, ['yaml'])
    .use(squeeze);

  // All plugins in opts.remarkPlugins will be added to remark
  plugins.forEach(plugin => {
    if (Array.isArray(plugin) && plugin.length > 1) {
      fn.use(plugin[0], plugin[1])
    } else {
      fn.use(plugin)
    }
  });

  const getFileData = async ({ route }) => {
    // Send the given file through the processor
    const vfile = await readVFile(path.resolve(location, `${route.path}.md`));
    const tree = processor.parse(vfile);

    // Find all headings and convert them to a reusable format
    const headings = selectAll('heading', tree)
      .map(node => {
        const value = toString(node);
        const depth = node.depth;
        const slug = slugger.slug(value);
        return { type: 'heading', value, slug, depth };
      });

    // Parse the frontmatter yaml data to JSON
    const frontmatter = yaml(select('yaml', tree)?.value);

    return { frontmatter, headings };
  };

  const getRoutes = async () => {
    return mds.map(file => ({
      // Each route will be at the exact path that the markdown is at
      path: path.basename(path.relative(location, file), '.md'),
      // We'll render the markdown file itself as a "template"
      getData: getFileData,
      template: file,
    }));
  };

  return {
    getRoutes,
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
            },
          },
        ],
      })

      return config;
    }
  };
};

export default staticPluginSourceMarkdown;
