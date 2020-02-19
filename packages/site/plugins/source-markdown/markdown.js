import remark from 'remark';
import { parse as yaml } from 'yaml';
import toString from 'mdast-util-to-string';
import squeeze from 'remark-squeeze-paragraphs';
import frontmatter from 'remark-frontmatter';
import { promisify } from 'util';
import GithubSlugger from 'github-slugger';
import nodeGlob from 'glob';
import { read as readVFile } from 'to-vfile';
import { select, selectAll } from 'unist-util-select';
import * as path from 'path';

const glob = promisify(nodeGlob);
const INDEX_PAGE_RE = /^(readme|index)$/i;

const formatNameToTitle = title => {
  return title
    .split(/[\s-_]+/)
    .map(x => x.replace(/^\w/, y => y.toUpperCase()))
    .join(' ');
};

const makeGroup = (groupName, order) => ({
  key: groupName,
  children: {},
  frontmatter: {
    title: formatNameToTitle(groupName),
    order,
  },
});

const groupPages = (pages, pathPrefix, orderOverride = {}) => {
  const rootGroup = makeGroup(pathPrefix || '/');

  for (let i = 0, l = pages.length; i < l; i++) {
    const page = pages[i];
    const keyPath = pathPrefix ? [pathPrefix] : [];
    const groupPath = page.originalPath.split(path.sep);

    let group = rootGroup;
    let order = orderOverride;
    while (groupPath.length > 0) {
      const childGroupName = path.basename(groupPath.shift(), '.md');
      const isIndexPage = INDEX_PAGE_RE.test(childGroupName);
      if (!isIndexPage) {
        keyPath.push(childGroupName);
        order = typeof order === 'object' &&
          order[childGroupName];
        group =
          group.children[childGroupName] ||
          (group.children[childGroupName] = makeGroup(childGroupName, order));
      }
    }

    group.originalPath = page.originalPath;
    group.path = keyPath.join('/');
    group.headings = page.headings;

    group.frontmatter = {
      ...group.frontmatter,
      ...page.frontmatter,
      order: typeof group.frontmatter.order === 'number'
        ? group.frontmatter.order
        : page.frontmatter.order
    };
  }

  const groupChildrenToArray = group => {
    const children = Object.values(group.children).map(groupChildrenToArray);

    children.sort((a, b) => {
      const { title: titleA, order: orderA = children.length } = a.frontmatter;
      const { title: titleB, order: orderB = children.length } = b.frontmatter;
      const order = orderA - orderB;
      return order || titleA.localeCompare(titleB);
    });

    return { ...group, children };
  };

  return groupChildrenToArray(rootGroup);
};

export const getMarkdownProcessor = (plugins = []) => {
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

export const getPageData = tree => {
  const slugger = new GithubSlugger();

  // Parse the frontmatter yaml data to JSON
  const yamlNode = select('yaml', tree);
  const frontmatter = yaml((yamlNode && yamlNode.value) || '') || {};

  // Find all headings and convert them to a reusable format
  const headings = selectAll('heading', tree)
    .filter(node => node.depth <= 3)
    .map(node => {
      const depth = node.depth;
      const value = (depth === 1 && frontmatter.title) || toString(node);
      const slug = slugger.slug(value);
      return { value, slug, depth };
    });

  // Add fallback for Frontmatter title to first h1 heading
  const h1Node = headings.find(x => x.depth === 1);
  frontmatter.title =
    frontmatter.title ||
    (h1Node && h1Node.value) ||
    formatNameToTitle(filename);

  return { frontmatter, headings };
};

export const getPages = async (location, remarkPlugins, pathPrefix, order) => {
  const processor = getMarkdownProcessor(remarkPlugins);

  // Find all markdown files in the given location
  const mds = (await glob('**/*.md', { cwd: location })).map(x =>
    path.normalize(path.resolve(location, x))
  );

  // Map each markdown to its page data
  const pages = await Promise.all(
    mds.map(async originalPath => {
      // Reproduce the current markdown file's route path
      const relative = path.relative(location, originalPath);
      const filename = path.basename(relative, '.md');
      const dirname = path.dirname(relative);

      // Parse the given markdown file into MAST
      const vfile = await readVFile(originalPath);
      const tree = processor.parse(vfile);
      const { frontmatter, headings } = getPageData(tree);

      return {
        originalPath: path.join(dirname, filename),
        headings,
        frontmatter,
      };
    })
  );

  return groupPages(pages, pathPrefix, order);
};
