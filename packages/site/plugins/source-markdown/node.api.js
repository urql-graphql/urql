import { promisify } from 'util';
import { glob as globCb } from 'glob';
import { read as readVFile } from 'to-vfile';
import frontmatter from 'remark-frontmatter';
import squeeze from 'remark-squeeze-paragraphs';
import toHast from 'mdast-util-to-hast';
import sanitize from 'hast-util-sanitize';
import raw from 'hast-util-raw';
import remark from 'remark';
import * as path from 'path';

const glob = promisify(globCb);
const cwd = process.cwd();

const staticPluginSourceMarkdown = (opts = {}) => {
  const location = path.resolve(cwd, opts.location);
  const template = path.resolve(cwd, opts.template);
  const plugins = opts.remarkPlugins || [];

  const processor = remark()
    .use(frontmatter, ['yaml', 'toml'])
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
    const hast = raw(sanitize(toHast(tree)));
    return { contents: hast };
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
