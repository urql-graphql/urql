import React from 'react';
import styled from 'styled-components';
import { MDXProvider } from '@mdx-js/react';

import Highlight, { Prism } from 'prism-react-renderer';
import nightOwlLight from 'prism-react-renderer/themes/nightOwlLight';

const getLanguage = className => {
  const res = className.match(/language-(\w+)/);
  return res ? res[1] : null;
};

const Pre = styled.pre`
  position: relative;
  max-width: 100%;
  background: #f0f0f2;
  color: #36313d;
  font-size: 0.9em;
  line-height: 1.2;
  padding: 1rem;
`;

const Code = styled.code`
  display: block;
  font-family: monospace;

  -webkit-overflow-scrolling: touch;
  overflow-x: auto;
  overflow-wrap: unset;
  font-variant-ligatures: none;
  font-feature-settings: normal;
  white-space: pre;
`;

const InlineCode = styled.code`
  display: inline-block;
  background: #f0f0f2;
  color: #36313d;
  border-radius: 3px
  font-family: monospace;
  font-size: inherit;
  font-variant-ligatures: none;
  font-feature-settings: normal;
  padding: 0 0.2em;
  margin: 0;
`;

const HighlightCode = ({ className = '', children }) => {
  const language = getLanguage(className);

  return (
    <Highlight
      Prism={Prism}
      theme={nightOwlLight}
      code={children.trim()}
      language={language}
    >
      {({ className, style, tokens, getLineProps, getTokenProps }) => (
        <Pre className={className} style={style}>
          <Code>
            {tokens.map((line, i) => (
              <div {...getLineProps({ line, key: i })}>
                {line.map((token, key) => (
                  <span {...getTokenProps({ token, key })} />
                ))}
              </div>
            ))}
          </Code>
        </Pre>
      )}
    </Highlight>
  );
};

const components = {
  inlineCode: InlineCode,
  code: HighlightCode,
};

export const MDXComponents = ({ children }) => (
  <MDXProvider components={components}>{children}</MDXProvider>
);
