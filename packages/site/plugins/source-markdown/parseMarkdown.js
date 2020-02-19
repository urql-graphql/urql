import { promisify } from 'util';
import GithubSlugger from 'github-slugger';
import nodeGlob from 'glob';
import { read as readVFile } from 'to-vfile';
import { select, selectAll } from 'unist-util-select';
import { parse as yaml } from 'yaml';
import * as path from 'path';

const glob = promisify(nodeGlob);

export const groupPages = pages =>
  pages.reduce((acc, page) => {
    const sectionIndex = acc.findIndex(a => a.section === page.section);
    if (sectionIndex === -1) {
      return [
        ...acc,
        {
          section: page.section,
          pages: [page],
        },
      ];
    }

    acc[sectionIndex].pages = [...acc[sectionIndex].pages, page];
    return acc;
  }, []);

export const getPages = async (processor, location, pathPrefix = '') => {
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
