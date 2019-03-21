import React from "react";
import MarkdownIt from "markdown-it";
import markdownItTocAndAnchor from "markdown-it-toc-and-anchor";
/* eslint-disable no-unused-vars */
import Prism from "prismjs";
// add more language support
import jsx from "prismjs/components/prism-jsx";
import sh from "prismjs/components/prism-bash";
import yaml from "prismjs/components/prism-yaml";
/* eslint-enable no-unused-vars */

import Highlight, { defaultProps } from "prism-react-renderer";

import basename from "../src/constants/basename";

const setMarkdownRenderer = currentPath => {
  const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
    highlight: (str, lang) => {
      const html = Prism.languages[lang]
        ? Prism.highlight(str, Prism.languages[lang])
        : str;
      const cls = `language-${lang}`;
      return (
        <Highlight {...defaultProps} code={str} language={lang}>
          {({ className, style, tokens, getLineProps, getTokenProps }) => (
            <pre className={"FUCKING-PRISM"} style={style}>
              {tokens.map((line, i) => (
                <div {...getLineProps({ line, key: i })}>
                  {line.map((token, key) => (
                    <span {...getTokenProps({ token, key })} />
                  ))}
                </div>
              ))}
            </pre>
          )}
        </Highlight>
      );
      // return (
      //   <pre className={cls}>
      //     <code dangerouslySetInnerHTML={{ __html: html }} className={cls} />
      //   </pre>
      // );
    }
  });

  md.use(markdownItTocAndAnchor, {
    anchorLinkSymbol: "",
    anchorClassName: "Anchor"
  });

  // store the original rule
  const defaultRender =
    md.renderer.rules.link_open ||
    function(tokens, idx, options, env, renderer) {
      // eslint-disable-line max-params
      return renderer.renderToken(tokens, idx, options);
    };
  //
  // Update anchor links to include the basename
  // eslint-disable-next-line max-params, camelcase
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
