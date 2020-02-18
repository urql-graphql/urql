import { mdx } from '@mdx-js/react';

/** Recursively convert an MDX-compatible HAST to JSX */
export const hastToMdx = (node, assets, i = 0) => {
  const children = node.children && node.children.length > 0
    ? node.children.map((node, i) => hastToMdx(node, assets, i))
    : null;

  switch (node.type) {
    case 'text':
      return node.value;
    case 'root':
      return children;
    case 'element':
      const props = {
        ...node.properties,
        children,
        key: i,
      };

      // Given a dictionary of image files, read the Webpack-included
      // output path and replace the `src` path.
      if (node.tagName === 'img')
        props.src = assets[props.src] || props.src;

      return mdx(node.tagName, props);
    default:
      return null;
  }
};


