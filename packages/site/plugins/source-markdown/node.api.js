import { promisify } from 'util';
import { glob as globCb } from 'glob';
import { read as readVFile } from 'to-vfile';
import frontmatter from 'remark-frontmatter';
import squeeze from 'remark-squeeze-paragraphs';
import toHast from 'mdast-util-to-hast';
import sanitize from 'hast-util-sanitize';
import GithubSlugger from 'github-slugger';
import { select, selectAll } from 'unist-util-select';
import toString from 'mdast-util-to-string';
import { parse as yaml } from 'yaml';
import raw from 'hast-util-raw';
import remark from 'remark';
import * as path from 'path';

const slugger = new GithubSlugger();
const glob = promisify(globCb);
const cwd = process.cwd();

const staticPluginSourceMarkdown = (opts = {}) => {
  const location = path.resolve(cwd, opts.location);
  const template = path.resolve(cwd, opts.template);
  const plugins = opts.remarkPlugins || [];

  const processor = remark()
    .use(frontmatter, ['yaml'])
    .use(squeeze);

  plugins.forEach(plugin => {
    if (Array.isArray(plugin) && plugin.length > 1) {
      fn.use(plugin[0], plugin[1])
    } else {
      fn.use(plugin)
    }
  })

  const getFileData = async ({ route }) => {
    const vfile = await readVFile(path.resolve(location, `${route.path}.md`));
    const tree = await processor.parse(vfile);

    const headings = selectAll('heading', tree)
      .map(node => {
        const value = toString(node);
        const depth = node.depth;
        const slug = slugger.slug(value);
        return { type: 'heading', value, slug, depth };
      });

    const frontmatter = yaml(select('yaml', tree)?.value);
    const contents = raw(sanitize(toHast(tree)));
    return { contents, frontmatter, headings };
  };

  const getRoutes = async () => {
    const mds = await glob('**/*.md', {
      cwd: location
    });

    return mds.map(file => ({
      path: path.basename(path.relative(location, file), '.md'),
      getData: getFileData,
      template,
    }));
  };

  return { getRoutes };
};

export default staticPluginSourceMarkdown;
