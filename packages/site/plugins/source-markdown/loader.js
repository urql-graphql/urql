import { getOptions, stringifyRequest } from 'loader-utils';
import { selectAll } from 'unist-util-select';
import raw from 'hast-util-raw';
import sanitize from 'hast-util-sanitize';
import toHast from 'mdast-util-to-hast';
import visit from 'unist-util-visit';

export default function loader(source) {
  this.cacheable();

  const options = getOptions(this);

  // Ensure that the template and utilities are relative paths
  const template = stringifyRequest(this, options.template);
  const utils = stringifyRequest(this, require.resolve('./browser.utils.js'));

  // Parse the markdown contents
  const tree = options.processor.parse(source);

  // Extract all images and add require statements for them
  const assets = selectAll('image', tree).map(node => {
    const path = JSON.stringify(node.url);
    return `[${path}]: require(${path}),`;
  });

  // Sanitise the markdown HAST and JSON stringify it
  const contents = JSON.stringify(raw(sanitize(toHast(tree))));

  return `
    import React from "react";
    import { useRouteData } from "react-static";
    import Template from ${template};
    import { hastToMdx } from ${utils};

    var assets = { ${assets.join(',')} };
    var mdx = hastToMdx(${contents}, assets);

    export default function MarkdownTemplate(props) {
      return <Template {...props}>{mdx}</Template>;
    }
  `;
}
