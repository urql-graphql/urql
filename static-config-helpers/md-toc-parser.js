/* eslint-disable max-params */
import React from "react";
import find from "lodash/find";
// import { withRouter } from "react-router";
import { withRouteData, withRouter } from "react-static";
import PropTypes from "prop-types";
import MarkdownIt from "markdown-it";
import markdownItTocAndAnchor from "markdown-it-toc-and-anchor";
import Prism from "prismjs";
/* eslint-disable no-unused-vars */
// add more language support
import jsx from "prismjs/components/prism-jsx";
import sh from "prismjs/components/prism-bash";
import yaml from "prismjs/components/prism-yaml";
/* eslint-enable no-unused-vars */

import basename from "../src/constants/basename";

// after mount or update, apparently...
//     Prism.highlightAll();

const setMarkdownRenderer = currentPath => {
  const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true
  });

  md.use(markdownItTocAndAnchor, {
    anchorLinkSymbol: "",
    anchorClassName: "Anchor"
  });

  // store the original rule
  const defaultRender =
    md.renderer.rules.link_open ||
    function(tokens, idx, options, env, renderer) {
      return renderer.renderToken(tokens, idx, options);
    };
  //
  // Update anchor links to include the basename
  md.renderer.rules.link_open = function(tokens, idx, options, env, renderer) {
    const anchor = tokens[idx].attrs[1];
    if (anchor && anchor.length > 0) {
      const href = anchor[1];
      if (href.indexOf("#") === 0) {
        tokens[idx].attrs[1][1] = `${basename}${currentPath}${href}`;
        tokens[idx].attrs.push(["aria-hidden", "true"]);
      }
    }
    return defaultRender(tokens, idx, options, env, renderer);
  };
  return md;
};

// path, props
const generateRenderReadyMd = ({ markdown, path }) => {
  // incidentally slug used to be currentPath
  const customMdRenderer = setMarkdownRenderer(path);
  return customMdRenderer.render(markdown);
};

export default generateRenderReadyMd;

// etc etc.
// const renderedMd = generateRenderReadyMd(props)
